#!/usr/bin/env node
// Prepare exactly one third-level instruction document from single-source rules.
// This script only reads installed skill data and writes an internal temporary file.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function readIndex(root = skillRoot) {
  return JSON.parse(readFileSync(path.join(root, 'references/rule-index.json'), 'utf8'));
}

function readSource(root, relative) {
  const base = realpathSync(root);
  const absolute = realpathSync(path.resolve(base, relative));
  if (!absolute.startsWith(base + path.sep)) throw new Error(`Outside skill: ${relative}`);
  return readFileSync(absolute, 'utf8').trim();
}

export function prepareRules({ subtype, variant, features = [], people = false }, root = skillRoot) {
  const index = readIndex(root);
  const row = index.subtypes[subtype];
  if (!row) throw new Error(`Unknown subtype: ${subtype}. Use --help to choose an existing ID.`);
  const selected = [...new Set(features)];
  for (const feature of selected) {
    if (!index.features[feature]) throw new Error(`Unknown feature: ${feature}`);
    const allowed = index.features[feature].types;
    if (allowed && !allowed.includes(row.type)) throw new Error(`${feature} does not apply to ${row.type}`);
  }
  if (row.variants && !Object.hasOwn(row.variants, variant ?? '')) {
    throw new Error(`${subtype} requires --variant ${Object.keys(row.variants).join(' | ')}`);
  }
  if (!row.variants && variant) throw new Error(`${subtype} has no --variant choice.`);
  if (selected.filter(x => x.startsWith('speech-')).length > 1) {
    throw new Error('Choose one speech layout for this unit; use separate units for a composite.');
  }
  if (selected.includes('messenger') && (subtype !== 'ITA-4_DialogueV' || people)) {
    throw new Error('messenger is the people-free ITA-4_DialogueV variant.');
  }
  if (subtype === 'I3-13_OldMap' && selected.some(x => ['korea','dem','projection','area','points','route','statistics','natural','tectonic-ice'].includes(x))) {
    throw new Error('An original old-map image is preserved as an image. Use historical/photo/annotation context, not modern preset layers.');
  }
  if (variant && ['horizontal','vertical','presentation'].includes(variant) && selected.some(x => x.startsWith('speech-'))) {
    throw new Error('The variant already selects a speech layout; do not add a second layout.');
  }
  const modules = new Set(row.modules);
  for (const name of row.variants?.[variant] ?? []) modules.add(name);
  for (const feature of selected) for (const name of index.features[feature].modules) modules.add(name);
  const layouts=['horizontal','vertical','presentation'].filter(name=>modules.has(name));
  if (layouts.length > 1) throw new Error(`Conflicting layouts: ${layouts.join(', ')}. Select one layout per unit.`);
  if (selected.includes('messenger') && layouts.some(name=>name!=='vertical')) throw new Error('messenger requires the vertical layout only.');
  if (modules.has('artwork')) modules.add('artwork-geometry');
  if (selected.includes('real-data') && row.type === 'I3_Map') modules.add('real-data-map');
  if (selected.includes('composition') && row.type === 'I3_Map') modules.add('map-composition');

  const hasPeople = people || row.peopleRequired === true;
  const originalPerson = index.people.originalPhotoSubtypes.includes(subtype);
  if (hasPeople) {
    if (!originalPerson) {
      modules.add('artwork');
      modules.add('artwork-geometry');
      if (variant === 'scene') modules.add('free-art');
    }
    // Generic scene people are checked by the people exception, without portrait framing.
    if (modules.has('bubble') || (row.type.startsWith('IT') && variant !== 'scene')) {
      modules.add('person-speech');
      modules.add('person-spacing');
      modules.add('artwork-asset');
      modules.add('asset-runtime');
    }
  }
  if (modules.has('presentation')) modules.add(originalPerson?'presentation-photo':'presentation-artwork');
  if (modules.has('vertical')) {
    modules.add('vertical-gap');
    if (!hasPeople) {
      modules.delete('vertical');
      modules.add('vertical-messenger');
    }
  }
  if (modules.has('map-natural')) modules.add('map-feature');
  if (selected.includes('korea')) {
    for (const [topic, module] of Object.entries(index.koreaOverlays)) {
      if (modules.has(`map-${topic}`)) modules.add(module);
    }
  }
  if (modules.has('chart-axes') && !modules.has('axis-options')) modules.add('axis-options');
  // Original photo pixels are exempt from new-art style even if people are present.
  if (subtype === 'ITC-2_RealPhoto' && selected.includes('artwork')) {
    throw new Error('ITC-2_RealPhoto preserves the actual portrait; do not replace it with generated artwork.');
  }
  const sources = [row.file, ...[...modules].map(key => {
    if (!index.modules[key]) throw new Error(`Missing rule module: ${key}`);
    return index.modules[key];
  })];
  const sections = sources.map(file => readSource(root, file));
  const body = sections.join('\n\n');
  const signature = createHash('sha256').update(JSON.stringify({subtype,variant,selected,hasPeople})).update(body).digest('hex').slice(0,16);
  const content = `<!-- prepared-rules:${signature}; single-source selection, do not edit -->\n`
    + `# 선택 세부 원칙 — ${subtype}${variant ? ` / ${variant}` : ''}\n\n`
    + `이 문서는 공통 → ${row.type} → 세부유형의 세 번째 지침이다. 선택 조건: ${selected.join(', ') || '기본'}. `
    + (hasPeople ? '인물 원칙은 예외 파일로 함께 읽는다.' : '인물 원칙은 읽지 않는다.')
    + '\n공통과 유형 원칙은 상속한다. 아래에 이미 필요한 조건이 포함되어 있으므로 원본 조각이나 다른 세부 문서를 추가로 읽지 않는다.\n\n'
    + body + '\n';
  return {
    subtype, type: row.type, variant: variant ?? null, features: selected,
    hasPeople, modules: [...modules], sources, signature, content,
    commonFile: path.join(root,'SKILL.md'), typeFile: path.join(root,index.types[row.type]),
    peopleFile: hasPeople ? path.join(root,index.people.file) : null,
  };
}

export function writePreparedRules(selection, out, root = skillRoot) {
  if (!out) throw new Error('--out must be an internal temporary directory.');
  const result = prepareRules(selection, root);
  const directory = path.resolve(out);
  // Never write into the installed skill or overwrite an existing user file.
  const realRoot = realpathSync(root);
  let ancestor=directory;
  while(!existsSync(ancestor)) ancestor=path.dirname(ancestor);
  const planned=path.resolve(realpathSync(ancestor),path.relative(ancestor,directory));
  if (planned === realRoot || planned.startsWith(realRoot + path.sep)) throw new Error('--out must be outside the installed skill.');
  mkdirSync(directory, {recursive:true});
  const realDirectory = realpathSync(directory);
  if (realDirectory === realRoot || realDirectory.startsWith(realRoot + path.sep)) throw new Error('--out must be outside the installed skill.');
  const subtypeFile = path.join(realDirectory,`${result.subtype}-${result.signature}.md`);
  try { writeFileSync(subtypeFile,result.content,{flag:'wx'}); }
  catch (error) {
    if (error.code !== 'EEXIST' || readFileSync(subtypeFile,'utf8') !== result.content) throw error;
  }
  const read = [result.commonFile,result.typeFile,subtypeFile];
  if (result.peopleFile) read.push(result.peopleFile);
  return {subtype:result.subtype,type:result.type,variant:result.variant,features:result.features,modules:result.modules,subtypeFile,read,instructionFileCount:read.length};
}

function main(args) {
  if (args.includes('--help')) {
    const index=readIndex();
    console.log('Usage: node scripts/prepare_rules.mjs --subtype ID --out INTERNAL_TEMP_DIR [--variant FORMAT] [--features a,b] [--people]\nRead SKILL.md, the selected type, and the returned subtypeFile; only people adds a fourth file.\n');
    for (const type of Object.keys(index.types)) {
      console.log(type);
      for (const [key,row] of Object.entries(index.subtypes).filter(([,row])=>row.type===type)) {
        console.log(`  ${key}${row.variants ? ` --variant ${Object.keys(row.variants).join('|')}` : ''}${row.peopleRequired ? ' (people required)' : ''}`);
      }
    }
    console.log('\nConditional features:');
    for (const [key,row] of Object.entries(index.features)) console.log(`  ${key}: ${row.description}`);
    return;
  }
  const selection={features:[]};let out;
  for(let i=0;i<args.length;i++) {
    const key=args[i];
    if(key==='--people'){selection.people=true;continue;}
    if(!['--subtype','--variant','--features','--out'].includes(key)) throw new Error(`Unknown option: ${key}`);
    const value=args[++i];if(!value || value.startsWith('--'))throw new Error(`Missing value for ${key}`);
    if(key==='--out')out=value;
    else if(key==='--features')selection.features=value.split(',').filter(Boolean);
    else selection[key.slice(2)]=value;
  }
  console.log(JSON.stringify(writePreparedRules(selection,out),null,2));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {main(process.argv.slice(2));} catch(error){console.error(error.message);process.exitCode=1;}
}
