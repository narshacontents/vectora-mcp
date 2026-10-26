import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareTask, recipes} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const prepare = unit => prepareTask({units: [unit]});

test('root ternary graph routes to D2-08 and reviews its actual display labels without mutation', () => {
  const unit = {recipe: 'line', spec: {
    kind: 'graph', type: 'line', chartStyle: 'ternary', legend: 'none',
    categories: ['A 지역', 'B 지역', 'C 지역'],
    series: [{id: 'A 지역', label: 'A 지역', values: [10, 20, 70]}],
    chartOptions: {title: '자료 제목', note: '자료 주', showXAxis: false, showYAxis: false},
    unit: '비율: %',
  }};
  const before = structuredClone(unit);
  const result = prepare(unit);

  assert.deepEqual(unit, before, 'inference and display review must preserve the native data');
  assert.equal(recipes.ternary.subtype, 'D2-08_Others');
  assert.equal(result.resolved[0].recipe, 'ternary');
  assert.equal(result.resolved[0].subtype, 'D2-08_Others');
  assert.equal(result.resolved[0].type, 'D2_Chart');
  assert.ok(result.resolved[0].inference.some(item =>
    item.condition === 'native graph:ternary' && item.inferred === 'ternary'));
  assert.ok(result.inputReview.scope.inspectedPaths.includes('units[0].spec.categories[0]'));
  assert.ok(result.inputReview.scope.inspectedPaths.includes('units[0].spec.series[0].label'));
  assert.ok(result.inputReview.scope.inspectedPaths.includes('units[0].spec.chartOptions.title'));
  assert.ok(result.inputReview.scope.inspectedPaths.includes('units[0].spec.chartOptions.note'));
  assert.ok(result.inputReview.scope.inspectedPaths.includes('units[0].spec.unit'));
  assert.ok(!result.inputReview.scope.inspectedPaths.some(path =>
    path.includes('.values') || path.endsWith('.id')));
  assert.ok(result.inputReview.warnings.some(warning =>
    warning.ruleId === 'limited-latin-region-fund-stock-label-half-space' &&
    warning.path === 'units[0].spec.series[0].label'));
});

test('composition automatically routes ternary graph and honors an explicit table recipe mapping', () => {
  const unit = {recipe: 'paper', spec: {kind: 'composition', children: [
    {id: 'tri', spec: {
      kind: 'graph', type: 'line', chartStyle: 'ternary', legend: 'none',
      categories: ['A 지역', 'B 지역', 'C 지역'],
      series: [{id: 'series-a', label: 'A 지역', values: [10, 20, 70]}],
    }},
    {id: 'table', spec: {kind: 'table', cells: [{text: '항목'}, {text: '값'}]}},
  ]}, specRecipes: {'spec.children[1].spec': 'table'}};
  const before = structuredClone(unit);
  const result = prepare(unit);
  const graph = result.resolved.find(item => item.id === 'unit-1:native-1');
  const table = result.resolved.find(item => item.id === 'unit-1:native-2');

  assert.deepEqual(unit, before);
  assert.equal(graph.recipe, 'ternary');
  assert.equal(graph.subtype, 'D2-08_Others');
  assert.ok(graph.inference.some(item =>
    item.condition === 'native graph:ternary' && item.inferred === 'ternary'));
  assert.equal(table.recipe, 'table');
  assert.equal(table.subtype, 'D1-01_Flat');
  assert.ok(table.inference.some(item =>
    item.condition === 'explicit specRecipes mapping' && item.inferred === 'table'));
  assert.ok(result.inputReview.warnings.some(warning =>
    warning.ruleId === 'limited-latin-region-fund-stock-label-half-space' &&
    warning.path === 'units[0].spec.children[0].spec.series[0].label'));
  assert.ok(!result.inputReview.scope.inspectedPaths.some(path =>
    path.includes('.values') || path.endsWith('.id')));
});

test('non-ternary graph label visibility is unchanged and unknown styles still require mapping', () => {
  const line = prepare({recipe: 'line', spec: {
    kind: 'graph', type: 'line', chartStyle: 'line', legend: 'none',
    categories: ['A 지역', 'B', 'C'], series: [{label: 'A 지역', values: [1, 2, 3]}],
  }}).inputReview;
  assert.ok(line.scope.inspectedPaths.includes('units[0].spec.categories[0]'));
  assert.ok(!line.scope.inspectedPaths.includes('units[0].spec.series[0].label'));

  const mosaic = prepare({recipe: 'mosaic', spec: {
    kind: 'graph', type: 'line', chartStyle: 'mosaic', legend: 'none',
    categories: ['A 지역', 'B', 'C'], series: [{label: 'A 지역', values: [1, 2, 3]}],
    mosaic: {cellLabelMode: 'series-name'},
  }}).inputReview;
  assert.ok(!mosaic.scope.inspectedPaths.includes('units[0].spec.categories[0]'));
  assert.ok(mosaic.scope.inspectedPaths.includes('units[0].spec.series[0].label'));

  assert.throws(() => prepareTask({units: [{recipe: 'paper', spec: {
    kind: 'composition', children: [{spec: {
      kind: 'graph', type: 'line', chartStyle: 'unknown',
      categories: ['A', 'B', 'C'], series: [{label: 'A', values: [1, 2, 3]}],
    }}],
  }}]}), /cannot uniquely select recipe.*specRecipes/);
});
