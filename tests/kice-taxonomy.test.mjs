import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildClaudePlugin } from '../scripts/build-claude-packages.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(repo, 'skills/create-kice-illustration');
const approvedLeaves = {
  "D1_Table": [
    "D1-01_Flat",
    "D1-02_MultiFlat",
    "D1-03_Cross",
    "D1-04_Nested",
    "D1-05_Checklist",
    "D1-06_Others"
  ],
  "D2_Chart": [
    "D2-01_Bar",
    "D2-02_StackedBar",
    "D2-03_Pie",
    "D2-04_Line",
    "D2-05_Scatter",
    "D2-06_Dot",
    "D2-07_Radar",
    "D2-08_Others"
  ],
  "D3_Graph": [
    "D3-01_Curve",
    "D3-02_Frontier",
    "D3-03_Distribution",
    "D3-04_Others"
  ],
  "D4_Diagram": [
    "D4-01_Tree",
    "D4-02_Network",
    "D4-03_Flowchart",
    "D4-04_Venn",
    "D4-05_Timeline",
    "D4-06_Schematic",
    "D4-07_Others"
  ],
  "I1_Photo": [],
  "I2_Illustration": [],
  "I3_Map": [
    "I3-11_Locator",
    "I3-12_Topographic",
    "I3-13_OldMap",
    "I3-14_Others",
    "I3-21_Area",
    "I3-22_Route",
    "I3-23_Symbol",
    "I3-31_Choropleth",
    "I3-32_Dot",
    "I3-33_Proportional",
    "I3-34_Isoline",
    "I3-35_Flow"
  ],
  "ITA_TypeSwap": [
    "ITA-1_TypeBoard",
    "ITA-2_Solo",
    "ITA-3_DialogueH",
    "ITA-4_DialogueV",
    "ITA-5_SoloBoard",
    "ITA-6_GroupBoard"
  ],
  "ITB_ImageSwap": [
    "ITB-1_ImageBoard",
    "ITB-2_SoloImageBoard",
    "ITB-3_GroupImageBoard"
  ],
  "ITC_Fixed": [
    "ITC-1_Figure",
    "ITC-2_RealPhoto",
    "ITC-3_Place",
    "ITC-4_Costume"
  ]
};
const counts = Object.fromEntries(Object.entries(approvedLeaves).map(([key,leaves])=>[key,leaves.length]));
const types = Object.keys(counts).sort();
const read = rel => readFileSync(path.join(skill, rel), 'utf8');
const mdFiles = directory => readdirSync(directory).filter(x => x.endsWith('.md')).sort();
const oldRefs = /(?:common|people|real-data|vectora-contract|artwork-production|artwork-vectorization|freeform-illustrations|text-illustrations|text-builder|graph-builder|graph-illustrations|graph-venn-production|schematic-illustrations|dialogue-illustrations|map-(?:illustrations|template|production|layouts|location|area|statistics|flow|physical|projection|historical))\.md/;
function instructionLinks(rel) {
  const body = read(rel).replace(/```[\s\S]*?```/g, '');
  const links = [];
  for (const match of body.replace(/`[^`]*`/g, '').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^[a-z]+:\/\//i.test(target)) continue;
    const resolved = path.resolve(skill, path.dirname(rel), target);
    assert.ok(resolved.startsWith(`${skill}${path.sep}`), `${rel}: outside-skill reference ${target}`);
    assert.ok(existsSync(resolved), `${rel}: missing link ${target}`);
    // The caller guide is an installed input reference, not a creator instruction edge.
    if (target === 'references/caller/exam-agent-guide.md') continue;
    if (resolved.endsWith('.md')) links.push(path.relative(skill, resolved).split(path.sep).join('/'));
  }
  // A bare legacy filename must not silently reintroduce a fourth instruction read.
  assert.doesNotMatch(body, oldRefs, rel);
  return links;
}

test('canonical taxonomy has exactly ten parents and 50 folder-matched leaves', t => {
  assert.deepEqual(mdFiles(path.join(skill, 'references')), [], 'superseded flat references must not be shipped');
  const parents = mdFiles(path.join(skill, 'references/types'));
  assert.deepEqual(parents, types.map(x => `${x}.md`));
  assert.deepEqual(readdirSync(path.join(skill, 'references/subtypes')).sort(), types.filter(x=>counts[x]));
  const leaves = [];
  for (const type of types) {
    if (!counts[type]) continue;
    const dir = path.join(skill, 'references/subtypes', type);
    const children = mdFiles(dir);
    assert.equal(children.length, counts[type], type);
    assert.deepEqual(children, approvedLeaves[type].map(x=>`${x}.md`).sort(), `${type}: unapproved taxonomy leaf`);
    assert.deepEqual(readdirSync(dir).sort(), children, `${type}: extra taxonomy file/directory`);
    leaves.push(...children.map(x => `references/subtypes/${type}/${x}`));
  }
  assert.equal(leaves.length, 50);
  assert.equal(new Set(leaves).size, 50);
  for (const type of ['I1_Photo','I2_Illustration']) {
    assert.equal(existsSync(path.join(skill,'references/subtypes',type)),false);
    assert.match(read(`references/types/${type}.md`), /두 개만 읽/);
  }
  const photoRules=read('SKILL.md');
  assert.match(photoRules, /실제 원본을 이미지 개체로 유지/);
  assert.match(photoRules, /대체물로 생성하지 않는다/);
  const files = ['SKILL.md', ...parents.map(x=>`references/types/${x}`), ...leaves];
  const hash = createHash('sha256');
  for (const rel of files) hash.update(rel).update('\0').update(read(rel)).update('\0');
  t.diagnostic(`instruction source sha256=${hash.digest('hex')}; Node ${process.version}; ${process.platform}/${process.arch}`);
});

test('instruction links form only root -> selected type -> selected subtype', () => {
  const rootLinks = instructionLinks('SKILL.md');
  assert.deepEqual([...new Set(rootLinks)].sort(), types.map(x=>`references/types/${x}.md`));
  for (const type of types) {
    const parent = `references/types/${type}.md`;
    const expected = counts[type] ? mdFiles(path.join(skill, 'references/subtypes', type)).map(x=>`references/subtypes/${type}/${x}`) : [];
    assert.deepEqual([...new Set(instructionLinks(parent))].sort(), expected, parent);
    for (const leaf of expected) assert.deepEqual(instructionLinks(leaf), [], `${leaf}: fourth instruction edge`);
  }
});

test('global boundary, physical rules and both conditional style templates stay in first file', () => {
  const root = read('SKILL.md');
  assert.equal(root.split('<!-- VECTORA_CLIENT_BOUNDARY -->').length, 2);
  assert.equal(root.split('\n').length <= 500, true);
  for (const fragment of ['108mm', 'UNDv30-Regular', 'charSpacing:-60', 'frameBounds.heightMm', '1.5–2.5mm', '1.5–3mm', '2–3.5mm', '1–2mm', '0.8–1.5mm', 'STYLE CONTRACT: Draw a living human character', 'STYLE CONTRACT: Draw a clean grayscale', 'exact', 'approximate', 'scale:4', 'transparent:false']) assert.ok(root.includes(fragment), fragment);
  assert.match(root, /Photo[^\n]*原|Photo[^\n]*원본|원본 photo/i);
});

test('graph helper help is self-contained and no longer points at a removed reference', () => {
  const help = execFileSync(process.execPath, [path.join(skill, 'scripts/build_graph.mjs'), '--help'], {encoding:'utf8'});
  assert.doesNotMatch(help, oldRefs);
  for (const fragment of ['--spec', '--output', 'dataFidelity', 'series', 'domain', 'xValues', 'null gaps', '.layout.json', 'UNDv30-Regular']) assert.ok(help.includes(fragment), fragment);
});

test('Claude adapter inserts local MCP and missing-imagegen restrictions only in root', () => {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'vectora-kice-taxonomy-'));
  try {
    buildClaudePlugin(path.join(temporary, 'plugin'));
    const staged = path.join(temporary, 'plugin/skills/create-kice-illustration');
    const root = readFileSync(path.join(staged, 'SKILL.md'), 'utf8');
    assert.match(root, /Claude 로컬 실행 경계/);
    assert.match(root, /이미지 생성 모델을 포함하지 않는다/);
    assert.match(root, /일반 웹\/클라우드/);
    assert.match(root, /비최종 설계안/);
    assert.doesNotMatch(root, oldRefs);
    for (const type of types) {
      const rel = `references/types/${type}.md`;
      assert.equal(readFileSync(path.join(staged,rel),'utf8'), read(rel).replaceAll('node skills/create-kice-illustration/scripts/', 'node scripts/').replaceAll('python3 skills/create-kice-illustration/scripts/', 'python3 scripts/'));
    }
  } finally { rmSync(temporary, {recursive:true, force:true}); }
});

test('circled marker spacing uses Vectora Alt+Space, with underline on body only', () => {
  const root = read('SKILL.md');
  for(const token of ['Alt+Space','U+2002','㉠\u2002본문','일반 공백 폭의 절반','원문자와 반칸은 밑줄 범위에서 제외','textRange/underlines 위치를 다시 계산']) assert.ok(root.includes(token), token);
  assert.doesNotMatch(root,/U\+2002`는 전각 폭이므로 반칸용으로 사용하지/);
});
