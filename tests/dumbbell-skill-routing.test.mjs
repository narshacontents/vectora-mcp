import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {prepareTask, recipes} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const source = JSON.parse(readFileSync(new URL('./fixtures/dumbbell-routing-c2.json', import.meta.url), 'utf8'));
const dotRule = 'recipes/D2_Chart/D2-06_Dot.md';
const othersRule = 'recipes/D2_Chart/D2-08_Others.md';
const prepare = unit => prepareTask({units: [unit]});

test('C2 root dumbbell routes a vague Others recipe to discoverable Dot guidance without mutation', () => {
  const unit = {id: 'C2', recipe: 'D2-08_Others', spec: structuredClone(source)};
  const before = structuredClone(unit);
  const result = prepare(unit);
  const selected = result.resolved[0];

  assert.deepEqual(unit, before, 'native source must remain unchanged');
  assert.equal(recipes.dot.subtype, 'D2-06_Dot');
  assert.equal(recipes.dumbbell.subtype, 'D2-06_Dot');
  assert.equal(selected.recipe, 'dumbbell');
  assert.equal(selected.subtype, 'D2-06_Dot');
  assert.equal(selected.type, 'D2_Chart');
  assert.ok(selected.inference.some(item => item.condition === 'native graph:dumbbell' && item.inferred === 'dumbbell'));
  assert.equal(result.phaseSources.design.filter(item => item.path === dotRule).length, 1);
  assert.ok(!result.phaseSources.design.some(item => item.path === othersRule));
});

test('nested dumbbells override a wrong explicit mapping, deduplicate stably, and preserve other graph routes', () => {
  const graph = () => structuredClone(source);
  const unit = {
    id: 'composition',
    recipe: 'paper',
    spec: {kind: 'composition', layout: 'column', children: [
      {id: 'auto-dumbbell', spec: graph()},
      {id: 'mapped-dumbbell', spec: graph()},
      {id: 'mosaic', spec: {...graph(), chartStyle: 'mosaic'}},
      {id: 'line', spec: {...graph(), chartStyle: 'line'}},
    ]},
    specRecipes: {
      'spec.children[1].spec': 'D2-08_Others',
      'spec.children[2].spec': 'D2-08_Others',
      'spec.children[3].spec': 'D2-04_Line',
    },
  };
  const before = structuredClone(unit);
  const first = prepare(unit);
  const second = prepare(unit);
  const auto = first.resolved.find(item => item.id === 'composition:native-1');
  const mapped = first.resolved.find(item => item.id === 'composition:native-2');
  const mosaic = first.resolved.find(item => item.id === 'composition:native-3');
  const line = first.resolved.find(item => item.id === 'composition:native-4');

  assert.deepEqual(unit, before, 'nested inference must not rewrite the supplied composition');
  assert.deepEqual(second, first, 'routing and source deduplication must be deterministic');
  assert.equal(auto.subtype, 'D2-06_Dot');
  assert.equal(mapped.subtype, 'D2-06_Dot');
  assert.ok(mapped.inference.some(item => item.condition === 'native graph:dumbbell' && item.inferred === 'dumbbell' && item.evidence?.overrode === 'D2-08_Others'));
  assert.equal(mosaic.recipe, 'D2-08_Others');
  assert.equal(mosaic.subtype, 'D2-08_Others');
  assert.equal(line.recipe, 'D2-04_Line');
  assert.equal(line.subtype, 'D2-04_Line');
  assert.equal(first.phaseSources.design.filter(item => item.path === dotRule).length, 1);
  assert.equal(first.phaseSources.design.filter(item => item.path === othersRule).length, 1);
  assert.ok(first.phaseSources.design.some(item => item.path === 'recipes/D2_Chart/D2-04_Line.md'));
});
