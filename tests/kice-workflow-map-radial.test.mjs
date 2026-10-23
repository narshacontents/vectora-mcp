import test from 'node:test';
import assert from 'node:assert/strict';
import {inferSpec} from '../skills/create-kice-illustration/scripts/infer_spec.mjs';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const prepare = unit => prepareTask({units: [unit]});
const radial = () => ({
 kind: 'map',
 radial: {
  schema: 'vectora.map-radial/v1',
  records: [{id: 'wind-east', anchor: {kind: 'geographic', longitude: 128, latitude: 36}, values: [4, 2, 3, 1]}],
  angleOrder: ['북', '북동', '동', '남동'],
  startAngleDeg: -90,
  clockwise: true,
  scale: 'linear',
  max: 4,
  diameterMm: 16,
  unit: 'm/s',
  rings: {values: [2, 4], shape: 'circle'},
  legend: {id: 'wind-key', placement: 'right', gapMm: 2, title: '풍속', directionIndices: [0, 2]},
 },
});
const paths = result => Object.values(result.phaseSources).flat().map(source => source.path);

test('root radial map infers proportional-map, statistics, and only displayed text', () => {
 const spec = radial();
 const request = {units: [{id: 'wind', spec}]};
 const before = structuredClone(request);
 const result = prepareTask(request);
 const selected = result.resolved[0];

 assert.deepEqual(request, before);
 assert.equal(selected.id, 'wind');
 assert.equal(selected.recipe, 'proportional-map');
 assert.equal(selected.subtype, 'I3-33_Proportional');
 assert.ok(selected.contains.includes('statistics'));
 assert.ok(selected.modules.includes('map-statistics'));
 assert.ok(paths(result).includes('execution/modules/map-proportional-native.md'));
 for (const i of [0, 2]) assert.ok(selected.inference.some(entry => entry.path === `units[0].spec.radial.angleOrder[${i}]` && entry.inferred === 'text'));
 for (const i of [1, 3]) assert.ok(!selected.inference.some(entry => entry.path === `units[0].spec.radial.angleOrder[${i}]`));
 assert.ok(selected.inference.some(entry => entry.path === 'units[0].spec.radial.legend.title' && entry.inferred === 'text'));
 assert.ok(selected.inference.some(entry => entry.path === 'units[0].spec.radial.unit' && entry.inferred === 'text'));
 assert.ok(!selected.inference.some(entry => entry.path.includes('.records[')));
});

test('radial map in a composition binds its child automatically and preserves child identity and source order', () => {
 const spec = radial();
 const request = {
  recipe: 'paper',
  id: 'wind-panel',
  spec: {kind: 'composition', layout: 'column', children: [{id: 'wind-map', spec}]},
 };
 const before = structuredClone(request);
 const result = prepare(request);

 assert.deepEqual(request, before);
 assert.deepEqual(result.resolved.map(unit => unit.recipe), ['paper', 'proportional-map']);
 assert.equal(result.resolved[1].id, 'wind-panel:native-1');
 assert.equal(result.resolved[1].specPath, 'units[0].spec.children[0].spec');
 assert.ok(result.resolved[1].contains.includes('statistics'));
 assert.deepEqual(spec.radial.angleOrder, ['북', '북동', '동', '남동']);
 assert.deepEqual(spec.radial.records.map(record => [record.id, record.values]), [['wind-east', [4, 2, 3, 1]]]);
 assert.ok(paths(result).includes('execution/modules/map-proportional-native.md'));
});

test('explicit symbol-map bindings conflict with quantitative native radial data', () => {
 assert.throws(
  () => prepare({recipe: 'symbol-map', spec: radial()}),
  /native radial maps use the proportional-map recipe/,
 );
 assert.throws(
  () => prepare({
   recipe: 'paper',
   spec: {kind: 'composition', children: [{id: 'wind', spec: radial()}]},
   specRecipes: {'spec.children[0].spec': 'symbol-map'},
  }),
  /native radial maps use the proportional-map recipe/,
 );
});

test('radial text inference follows rendered directions and ignores blank display strings', () => {
 const selected = prepare({recipe: 'proportional-map', spec: radial()}).resolved[0];
 assert.deepEqual(
  selected.inference.filter(entry => entry.inferred === 'text').map(entry => entry.path),
  [
   'units[0].spec.radial.angleOrder[0]',
   'units[0].spec.radial.angleOrder[2]',
   'units[0].spec.radial.legend.title',
   'units[0].spec.radial.unit',
  ],
 );
 assert.throws(
  () => prepare({recipe: 'proportional-map', textMode: 'none', spec: radial()}),
  /textMode:none contradicts actual text at units\[0\]\.spec\.radial\.angleOrder\[0\]/,
 );

 // This deliberately incomplete selection fixture isolates blank-text inference;
 // runtime map-schema validation remains outside this workflow test.
 const blankSpec = {kind: 'map', radial: {angleOrder: [], unit: ' \t', legend: {title: ' \t', directionIndices: []}}};
 const blank = inferSpec(
  {recipe: 'proportional-map', textMode: 'none', spec: blankSpec},
  'units[0]',
  () => ({type: 'I3_Map', subtype: 'I3-33_Proportional'}),
 );
 assert.ok(!blank.provenance.some(entry => entry.inferred === 'text'));
});

test('ordinary route-map selection keeps its route module without radial statistics rules', () => {
 const result = prepare({recipe: 'route-map', textMode: 'none', spec: {kind: 'map', routes: []}});
 const selected = result.resolved[0];

 assert.ok(selected.modules.includes('map-routes-native'));
 assert.ok(paths(result).includes('execution/modules/map-routes-native.md'));
 assert.ok(!selected.modules.includes('map-proportional-native'));
 assert.ok(!selected.contains.includes('statistics'));
});
