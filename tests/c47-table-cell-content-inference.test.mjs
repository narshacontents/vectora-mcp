import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareTask } from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const prepare = unit => prepareTask({ units: [unit] });

test('cell content children receive their own recipes, rules, and truthful source paths', () => {
  const unit = {
    recipe: 'table',
    spec: {
      kind: 'table',
      rows: [{ id: 'r1' }],
      columns: [{ id: 'c1' }, { id: 'c2' }],
      cells: [
        { id: 'chart-cell', rowId: 'r1', columnId: 'c1', text: '', content: {
          kind: 'graph', type: 'bar', series: [{ id: 's1', label: '항목', values: [1] }],
        } },
        { id: 'text-cell', rowId: 'r1', columnId: 'c2', text: '', content: {
          kind: 'text', variant: 'newspaper-wave', body: { text: '강조', underlines: [{ start: 0, end: 1 }] },
        } },
      ],
    },
  };
  const before = structuredClone(unit);
  const result = prepare(unit);

  assert.deepEqual(unit, before, 'inference does not rewrite caller-owned specs');
  assert.deepEqual(result.resolved.map(child => child.recipe), ['table', 'bar', 'newspaper']);
  assert.equal(result.resolved[0].subtype, 'D1-01_Flat', 'cell content does not change table taxonomy');
  assert.ok(!result.resolved[0].modules.some(module => module.includes('graph')), 'child graph rules do not leak into the table unit');

  const chart = result.resolved[1];
  assert.equal(chart.specPath, 'units[0].spec.cells[0].content');
  assert.ok(chart.inference.some(item => item.path === 'units[0].spec.cells[0].content.series[0].label' && item.inferred === 'text'));
  assert.ok(chart.modules.some(module => module.includes('graph')));

  const text = result.resolved[2];
  assert.equal(text.specPath, 'units[0].spec.cells[1].content');
  assert.ok(text.contains.includes('underline'));
  assert.ok(text.inference.some(item => item.path === 'units[0].spec.cells[1].content.body.underlines' && item.inferred === 'underline'));
  assert.ok(!result.resolved[0].contains.includes('underline'), 'child features stay with the child unit');
});

test('table child content requires an exact specRecipes path when its table semantics are ambiguous', () => {
  const childTable = { kind: 'table', rows: [], columns: [], cells: [] };
  const unit = {
    recipe: 'table',
    spec: { kind: 'table', cells: [{ id: 'parent-cell', rowId: 'r', columnId: 'c', text: '', content: childTable }] },
  };
  assert.throws(() => prepare(unit), /units\[0\]\.spec\.cells\[0\]\.content.*cannot uniquely select recipe/);

  const result = prepare({ ...unit, specRecipes: { 'spec.cells[0].content': 'cross-table' } });
  assert.equal(result.resolved[1].recipe, 'cross-table');
  assert.equal(result.resolved[1].specPath, 'units[0].spec.cells[0].content');
  assert.ok(result.resolved[1].inference.some(item => item.path === 'units[0].spec.cells[0].content' && item.inferred === 'cross-table'));
});
