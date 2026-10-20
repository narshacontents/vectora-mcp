import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareRules, readIndex} from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const index = readIndex();
const routeModule = 'map-routes-native';
const routeFile = index.modules[routeModule];
const task = (recipe, extra = {}) => prepareTask({units: [{recipe, textMode: 'none', ...extra}]});

test('native route execution rules follow only selections that resolve map-route', () => {
  for (const recipe of ['route-map', 'flow-map']) {
    const result = task(recipe);
    assert.ok(result.resolved[0].modules.includes(routeModule), recipe);
    assert.ok(result.phaseSources.execute.some(source => source.path === routeFile), recipe);
  }

  const requestedRoute = task('locator-map', {contains: ['route']});
  assert.ok(requestedRoute.resolved[0].modules.includes(routeModule));

  for (const [recipe, extra] of [
    ['locator-map', {}],
    ['locator-map', {contains: ['points']}],
    ['topographic-map', {contains: ['natural']}],
    ['old-map', {}],
  ]) {
    const result = task(recipe, extra);
    assert.ok(!result.resolved[0].modules.includes(routeModule), `${recipe}: ${JSON.stringify(extra)}`);
    assert.ok(!result.phaseSources.execute.some(source => source.path === routeFile), recipe);
  }
});

test('Korea route selection keeps the existing conditional route overlay and adds the execution rule', () => {
  const result = task('route-map', {contains: ['korea']});
  assert.ok(result.resolved[0].modules.includes('map-korea-route'));
  assert.ok(result.resolved[0].modules.includes(routeModule));
  assert.ok(result.phaseSources.execute.some(source => source.path === routeFile));
});

test('legacy rule selection resolves the same map-route execution module', () => {
  const result = prepareRules({subtype: 'I3-22_Route'});
  assert.ok(result.modules.includes(routeModule));
  assert.ok(result.sources.includes(routeFile));
});
