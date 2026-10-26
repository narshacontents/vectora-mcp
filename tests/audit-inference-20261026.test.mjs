import assert from 'node:assert/strict';
import test from 'node:test';
import {inferSpec} from '../skills/create-kice-illustration/scripts/infer_spec.mjs';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const mergedTable = {
  kind: 'table',
  rows: [{id: 'prompt'}, {id: 'answer'}],
  columns: [{id: 'item'}, {id: 'mark'}],
  cells: [
    {id: 'merged-title', rowId: 'prompt', columnId: 'item', colSpan: 2, text: '문항 묶음'},
    {id: 'choice-a', rowId: 'answer', columnId: 'item', text: '가'},
    {id: 'choice-b', rowId: 'answer', columnId: 'mark', text: '○'},
  ],
};

test('merged cells add Nested structural provenance without replacing explicit table meaning', () => {
  const checklistRequest = {units: [{recipe: 'D1-05_Checklist', spec: structuredClone(mergedTable)}]};
  const before = structuredClone(checklistRequest);
  const checklist = prepareTask(checklistRequest).resolved[0];
  assert.deepEqual(checklistRequest, before, 'inference leaves the caller-owned table unchanged');
  assert.equal(checklist.recipe, 'D1-05_Checklist');
  assert.equal(checklist.subtype, 'D1-05_Checklist');
  assert.ok(checklist.inference.some(item =>
    item.path === 'units[0].spec.cells[0].colSpan' &&
    item.inferred === 'D1-04_Nested' &&
    item.evidence?.structuralOnly === true));

  const generic = prepareTask({units: [{recipe: 'table', spec: structuredClone(mergedTable)}]}).resolved[0];
  assert.equal(generic.recipe, 'D1-04_Nested', 'a generic table can select Nested from its merged structure');
  assert.equal(generic.subtype, 'D1-04_Nested');

  const crossRequest = {
    units: [{
      recipe: 'paper',
      specRecipes: {'spec.children[0].spec': 'D1-03_Cross'},
      spec: {kind: 'composition', layout: 'column', children: [{id: 'cross-table', spec: structuredClone(mergedTable)}]},
    }],
  };
  const crossBefore = structuredClone(crossRequest);
  const cross = prepareTask(crossRequest).resolved.find(unit => unit.specPath === 'units[0].spec.children[0].spec');
  assert.deepEqual(crossRequest, crossBefore, 'inference leaves the mapped table unchanged');
  assert.equal(cross.recipe, 'D1-03_Cross');
  assert.equal(cross.subtype, 'D1-03_Cross');
  assert.ok(cross.inference.some(item =>
    item.path === 'units[0].spec.children[0].spec.cells[0].colSpan' &&
    item.inferred === 'D1-04_Nested' &&
    item.evidence?.structuralOnly === true));
});

test('native coordinate schematic nodes infer literal text and matching rich-text guidance without mutation', () => {
  const literal = '조건을 확인한다';
  const request = {units: [{recipe: 'flowchart', spec: {
    kind: 'schematic', layout: 'relations',
    nodes: [{id: 'condition', text: literal, richText: {
      text: literal,
      underlines: [{start: 0, end: 2}],
      inlineBoxes: [{at: 0, label: '가', widthMm: 4}],
    }}],
    edges: [],
  }}]};
  const before = structuredClone(request);
  const result = prepareTask(request).resolved[0];

  assert.deepEqual(request, before, 'native source text and rich-text data remain unchanged');
  assert.ok(result.inference.some(item => item.path === 'units[0].spec.nodes[0].text' && item.inferred === 'text'));
  assert.ok(result.inference.some(item => item.path === 'units[0].spec.nodes[0].richText.text' && item.inferred === 'text'));
  assert.ok(result.inference.some(item => item.path === 'units[0].spec.nodes[0].richText.underlines' && item.inferred === 'underline'));
  assert.ok(result.inference.some(item => item.path === 'units[0].spec.nodes[0].richText.inlineBoxes' && item.inferred === 'inline-box'));
  assert.ok(result.contains.includes('underline'));
  assert.ok(result.contains.includes('inline-box'));
});

test('unsupported native fields are reported as uninspected while explicit binding checks remain active', () => {
  const request = {
    recipe: 'paper',
    specRecipes: {'spec.children[0].spec': 'manual-pattern-guidance'},
    spec: {kind: 'composition', children: [{id: 'pattern', spec: {kind: 'pattern', sourceId: 'source-object'}}]},
  };
  const before = structuredClone(request);
  const checked = [];
  const result = inferSpec(request, 'units[0]', (binding, spec, path) => {
    checked.push({recipe: binding.recipe, kind: spec.kind, path});
    return {type: 'mapped-native-kind'};
  });
  const child = result.children[0];
  const uninspected = child.inference.provenance.find(item => item.inferred === 'uninspected-native-kind');

  assert.deepEqual(request, before, 'unsupported-kind inference does not mutate caller data');
  assert.ok(checked.some(item => item.kind === 'pattern' && item.recipe === 'manual-pattern-guidance'));
  assert.deepEqual(uninspected, {
    path: 'units[0].spec.children[0].spec',
    condition: 'native fields are outside rule inference coverage; no native validity was established',
    inferred: 'uninspected-native-kind',
    evidence: {kind: 'pattern'},
  });
  assert.throws(() => inferSpec(request, 'units[0]', (_binding, spec) => {
    if (spec.kind === 'pattern') throw new Error('recipe mapping is incompatible with native kind pattern');
    return {type: 'mapped-native-kind'};
  }), /recipe mapping is incompatible with native kind pattern/);
});
