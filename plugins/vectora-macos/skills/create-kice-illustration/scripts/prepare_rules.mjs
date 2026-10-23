#!/usr/bin/env node
// Legacy selection resolver. New production tasks use prepare_task.mjs.
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

export function filterModuleBlocks(text, enabledModules, knownModules, source = '<input>') {
  const open = '<!-- when-module';
  const close = '<!-- /when-module -->';
  let cursor = 0;
  let result = '';
  while (cursor < text.length) {
    const openAt = text.indexOf(open, cursor);
    const closeAt = text.indexOf(close, cursor);
    if (closeAt !== -1 && (openAt === -1 || closeAt < openAt)) {
      throw new Error(`Conditional module close without open in ${source}`);
    }
    if (openAt === -1) {
      result += text.slice(cursor);
      break;
    }
    result += text.slice(cursor, openAt);
    const conditionStart = openAt + open.length;
    if (text[conditionStart] !== ':') throw new Error(`Malformed conditional module marker in ${source}`);
    const markerEnd = text.indexOf('-->', conditionStart + 1);
    if (markerEnd === -1) throw new Error(`Malformed conditional module marker in ${source}`);
    const condition = text.slice(conditionStart + 1, markerEnd).trim();
    if (!/^[a-z][a-z0-9-]*$/.test(condition)) {
      throw new Error(`Invalid conditional module in ${source}: ${condition || '(empty)'}`);
    }
    if (!knownModules.has(condition)) {
      throw new Error(`Unknown conditional module in ${source}: ${condition}`);
    }
    const contentStart = markerEnd + 3;
    const blockEnd = text.indexOf(close, contentStart);
    if (blockEnd === -1) throw new Error(`Unclosed when-module:${condition} block in ${source}`);
    const nestedOpen = text.indexOf(open, contentStart);
    if (nestedOpen !== -1 && nestedOpen < blockEnd) {
      throw new Error(`Nested when-module blocks are not supported in ${source}`);
    }
    if (enabledModules.has(condition)) result += text.slice(contentStart, blockEnd);
    cursor = blockEnd + close.length;
  }
  return result;
}

export function prepareRules(options, root = skillRoot) {
  const { subtype, variant, features = [], people = false, nativeSpec } = options;
  const index = readIndex(root);
  const row = index.subtypes[subtype];
  if (!row) throw new Error(`Unknown subtype: ${subtype}. Use --help to choose an existing ID.`);
  const sharedSceneArtwork = nativeSpec?.kind === 'dialogue'
    && typeof nativeSpec.sharedScene?.artwork?.assetId === 'string'
    && nativeSpec.sharedScene.artwork.assetId.length > 0;
  if (sharedSceneArtwork && options.people === false) {
    throw new Error('people:false contradicts shared-scene artwork asset at nativeSpec.sharedScene.artwork.assetId');
  }
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
  if (selected.includes('messenger') && (subtype !== 'ITA-4_DialogueV' || people || sharedSceneArtwork)) {
    throw new Error('messenger is the people-free ITA-4_DialogueV variant.');
  }
  if (subtype === 'I3-13_OldMap' && selected.some(x => ['korea','dem','projection','area','points','route','statistics','natural','tectonic-ice'].includes(x))) {
    throw new Error('An original old-map image is preserved as an image. Use historical/photo/annotation context, not modern preset layers.');
  }
  const modules = new Set(row.modules);
  for (const name of row.variants?.[variant] ?? []) modules.add(name);
  for (const feature of selected) for (const name of index.features[feature].modules) modules.add(name);
  const nativeDialogueLayout = nativeSpec?.kind === 'dialogue'
    && ['horizontal','vertical','presentation'].includes(nativeSpec.layout)
    ? nativeSpec.layout
    : null;
  const layouts=['horizontal','vertical','presentation'].filter(name=>modules.has(name));
  if (nativeDialogueLayout && !layouts.includes(nativeDialogueLayout)) layouts.push(nativeDialogueLayout);
  if (layouts.length > 1) throw new Error(`Conflicting layouts: ${layouts.join(', ')}. Select one layout per unit.`);
  // Explicit native layout must select its rules even when a board has no turns yet.
  if (nativeDialogueLayout) modules.add(nativeDialogueLayout);
  if (selected.includes('messenger') && layouts.some(name=>name!=='vertical')) throw new Error('messenger requires the vertical layout only.');
  if (modules.has('artwork')) modules.add('artwork-geometry');
  if (selected.includes('real-data') && row.type === 'I3_Map') modules.add('real-data-map');
  if (selected.includes('composition') && row.type === 'I3_Map') modules.add('map-composition');

  const hasPeople = people || sharedSceneArtwork || row.peopleRequired === true;
  const originalPerson = index.people.originalPhotoSubtypes.includes(subtype);
  const speakerLayout = modules.has('speech') || modules.has('bubble') || layouts.length > 0 || nativeDialogueLayout;
  if (hasPeople) {
    if (!originalPerson) {
      modules.add('artwork');
      modules.add('artwork-geometry');
      if (variant === 'scene' || sharedSceneArtwork) modules.add('free-art');
    }
    // People in a page or illustration do not by themselves imply speakers.
    if (speakerLayout) {
      modules.add('person-speech');
      modules.add('person-spacing');
    }
    // Preserve approved artwork and asset registration for non-speaking people too.
    if (speakerLayout || (row.type.startsWith('IT') && variant !== 'scene')) {
      modules.add('artwork-asset');
      modules.add('asset-runtime');
    }
  }
  if (modules.has('presentation') && !originalPerson) {
    modules.add('presentation-artwork');
  }
  if (modules.has('vertical')) {
    modules.add('vertical-gap');
    if (!hasPeople) {
      modules.delete('vertical');
      modules.add('vertical-messenger');
    }
  }
  const speechFamily = row.type === 'ITA_TypeSwap' || row.type === 'ITB_ImageSwap';
  const selectedDialogueLayout = speechFamily
    && ['horizontal','vertical','presentation'].some(name => modules.has(name));
  if ((selectedDialogueLayout || nativeDialogueLayout)
    && !selected.includes('messenger') && !modules.has('vertical-messenger')) {
    modules.add('dialogue-native');
  }
  const screenPresentationVariant = speechFamily && variant === 'screen' && modules.has('presentation');
  const screenNativeDialogue = nativeSpec?.kind === 'dialogue'
    && nativeSpec.layout === 'presentation'
    && (nativeSpec.presentationMode === 'screen' || nativeSpec.mode === 'screen');
  if (screenPresentationVariant || screenNativeDialogue) {
    modules.add('presentation-screen-native');
  }
  if (modules.has('map-natural')) modules.add('map-feature');
  if (modules.has('map-route')) modules.add('map-routes-native');
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
  const knownModules = new Set(Object.keys(index.modules));
  const sections = sources.map(file => filterModuleBlocks(readSource(root, file), modules, knownModules, file));
  const body = sections.join('\n\n');
  const signature = createHash('sha256').update(JSON.stringify({subtype,variant,selected,hasPeople})).update(body).digest('hex').slice(0,16);
  const content = `<!-- prepared-rules:${signature}; single-source selection, do not edit -->\n`
    + `# 선택 세부 원칙 — ${subtype}${variant ? ` / ${variant}` : ''}\n\n`
    + `이 문서는 ${row.type} 제작 규칙의 호환 선택 결과다. 새 작업은 prepare_task.mjs로 준비한다. 선택 조건: ${selected.join(', ') || '기본'}. `
    + (hasPeople ? '인물 구성요소가 필요하다.' : '인물 원칙은 읽지 않는다.')
    + '\n새 작업은 prepare_task.mjs가 공통·제작·구성요소·실행·검수 지침을 단계별로 준비한다. 이 호환 결과만으로 전체 제작 원칙을 읽었다고 판단하지 않는다.\n\n'
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
    console.log('Usage: node scripts/prepare_rules.mjs --subtype ID --out INTERNAL_TEMP_DIR [--variant FORMAT] [--features a,b] [--people]\nLegacy resolver; use prepare_task.mjs for new phase-based production tasks.\n');
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
