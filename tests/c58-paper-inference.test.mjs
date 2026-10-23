import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareTask } from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

test('native paper routes explicitly and keeps inline-box inference in its body and nested component', () => {
  const inlineBoxText = {
    text: '\uFFFC 본문',
    inlineBoxes: [{ at: 0, label: '(가)', widthMm: 4 }],
  };
  const request = { units: [{
    recipe: 'paper',
    specRecipes: { 'spec.blocks[0].spec': 'table' },
    spec: {
      kind: 'text', variant: 'paper', widthMm: 82,
      body: inlineBoxText,
      blocks: [{ type: 'component', id: 'evidence-table', spec: {
        kind: 'table',
        rows: [{ id: 'r1' }], columns: [{ id: 'c1' }],
        cells: [{ id: 'r1c1', rowId: 'r1', columnId: 'c1', richText: structuredClone(inlineBoxText) }],
      } }],
    },
  }] };
  const before = structuredClone(request);
  const result = prepareTask(request);

  assert.deepEqual(request, before, 'paper inference leaves the caller-owned spec unchanged');
  assert.deepEqual(result.resolved.map(unit => unit.recipe), ['paper', 'table']);
  const paper = result.resolved[0];
  assert.equal(paper.variant, 'paper');
  assert.ok(paper.contains.includes('inline-box'));
  assert.ok(paper.inference.some(item => item.path === 'units[0].spec.body.inlineBoxes' && item.inferred === 'inline-box'));
  const table = result.resolved[1];
  assert.equal(table.specPath, 'units[0].spec.blocks[0].spec');
  assert.ok(table.contains.includes('inline-box'));
  assert.ok(table.inference.some(item => item.path.endsWith('.cells[0].richText.inlineBoxes') && item.inferred === 'inline-box'));
  assert.ok(Object.values(result.phaseSources).flat().some(source => source.path === 'core/inline-box.md'));
});

test('paper adds no permissive variant fallback and existing native text routes stay intact', () => {
  const result = prepareTask({ units: [
    { recipe: 'paper', spec: { kind: 'text', variant: 'paper', body: '종이' } },
    { recipe: 'newspaper', spec: { kind: 'text', variant: 'newspaper-band', body: '신문' } },
    { recipe: 'teacher-board', spec: { kind: 'text', variant: 'chalkboard', body: '칠판' } },
    { recipe: 'worksheet', spec: { kind: 'text', variant: 'worksheet', body: '학습지' } },
  ] });
  assert.deepEqual(result.resolved.map(unit => unit.recipe), ['paper', 'newspaper', 'teacher-board', 'worksheet']);

  assert.throws(() => prepareTask({ units: [{
    recipe: 'paper', spec: { kind: 'text', variant: 'unsupported-paper-like-frame', body: '보류' },
  }] }), /unsupported native text frame variant unsupported-paper-like-frame/);
});
