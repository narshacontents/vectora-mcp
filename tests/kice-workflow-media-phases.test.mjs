import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import {readIndex} from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';

const index = readIndex();
const routes = {
  screen: {
    design: 'recipes/layouts/screen.md',
    module: 'screen-frame-native',
    execute: 'execution/modules/screen-frame-native.md',
  },
  newspaper: {
    design: 'recipes/layouts/newspaper.md',
    module: 'newspaper-frame-native',
    execute: 'execution/modules/newspaper-frame-native.md',
  },
};

const prepare = unit => prepareTask({units: [unit]});
const phasePaths = (result, phase) => result.phaseSources[phase].map(source => source.path);
const count = (paths, path) => paths.filter(item => item === path).length;

function assertFrameRoute(result, resolved, variant) {
  const route = routes[variant];
  assert.equal(index.modules[variant], route.design);
  assert.equal(index.modules[route.module], route.execute);
  assert.ok(resolved.modules.includes(variant));
  assert.ok(resolved.modules.includes(route.module));
  assert.equal(resolved.modules.filter(module => module === route.module).length, 1);
  assert.equal(count(phasePaths(result, 'design'), route.design), 1);
  assert.equal(count(phasePaths(result, 'execute'), route.execute), 1);
  assert.equal(count(phasePaths(result, 'design'), route.execute), 0);
  assert.equal(count(phasePaths(result, 'execute'), route.design), 0);
}

test('explicit newspaper, screen, and webpage routes keep layout design in design and add one native execution module', () => {
  for (const [recipe, variant] of [['newspaper', 'newspaper'], ['screen', 'screen'], ['webpage', 'screen']]) {
    const result = prepare({recipe});
    assert.equal(result.resolved[0].recipe, recipe);
    assert.equal(result.resolved[0].variant, variant);
    assertFrameRoute(result, result.resolved[0], variant);
  }
});

test('all existing ITA, ITB, and ITC screen and newspaper variants select the matching phase module', () => {
  const entries = Object.entries(index.subtypes).filter(([, row]) => row.variants);
  for (const variant of Object.keys(routes)) {
    const matching = entries.filter(([, row]) => row.variants[variant]);
    const families = new Set(matching.map(([, row]) => row.type));
    for (const family of ['ITA_TypeSwap', 'ITB_ImageSwap', 'ITC_Fixed']) assert.ok(families.has(family), family);
    assert.ok(matching.length > 0, variant);

    for (const [subtype] of matching) {
      const result = prepare({recipe: subtype, variant});
      assert.equal(result.resolved[0].subtype, subtype);
      assert.equal(result.resolved[0].variant, variant);
      assertFrameRoute(result, result.resolved[0], variant);
    }
  }
});

test('nested native text inference routes browser and newspaper children into the correct execution phases once', () => {
  const request = {
    recipe: 'paper',
    spec: {
      kind: 'composition',
      layout: 'column',
      children: [
        {id: 'browser-one', spec: {kind: 'text', variant: 'browser', body: '첫 화면'}},
        {id: 'news-wave', spec: {kind: 'text', variant: 'newspaper-wave', body: '신문 본문'}},
        {id: 'news-band', spec: {kind: 'text', variant: 'newspaper-band', body: '띠 제호 신문'}},
        {id: 'browser-two', spec: {kind: 'text', variant: 'browser', body: '둘째 화면'}},
      ],
    },
  };
  const original = structuredClone(request);
  const result = prepare(request);
  assert.deepEqual(request, original);
  assert.deepEqual(result.resolved.map(unit => unit.recipe), ['paper', 'screen', 'newspaper', 'newspaper', 'screen']);
  assert.deepEqual(result.resolved.slice(1).map(unit => unit.specPath), [
    'units[0].spec.children[0].spec',
    'units[0].spec.children[1].spec',
    'units[0].spec.children[2].spec',
    'units[0].spec.children[3].spec',
  ]);

  assert.ok(result.resolved[1].inference.some(item => item.inferred === 'screen'));
  assert.ok(result.resolved[2].inference.some(item => item.inferred === 'newspaper'));
  assert.ok(result.resolved[3].inference.some(item => item.inferred === 'newspaper'));
  assert.ok(result.resolved[4].inference.some(item => item.inferred === 'screen'));
  for (const unit of result.resolved.slice(1)) assertFrameRoute(result, unit, unit.variant);
  assert.equal(count(phasePaths(result, 'execute'), routes.screen.execute), 1);
  assert.equal(count(phasePaths(result, 'execute'), routes.newspaper.execute), 1);
});

test('paper and other non-frame media routes do not receive screen or newspaper execution modules', () => {
  const aliases = [
    'book', 'notebook', 'ring-card', 'album', 'postcard', 'letter',
    'brochure', 'poster', 'display-sign', 'film-frame', 'email',
    'social-feed', 'mobile-screen', 'video-screen', 'projection-screen',
  ];
  const units = [
    ...aliases.map(recipe => ({recipe})),
    {recipe: 'paper'},
    {recipe: 'scroll'},
    {recipe: 'image-board', variant: 'paper'},
    {recipe: 'teacher-board'},
    {recipe: 'line'},
  ];

  for (const unit of units) {
    const result = prepare(unit);
    for (const route of Object.values(routes)) {
      assert.ok(!result.resolved.some(item => item.modules.includes(route.module)), unit.recipe + ': ' + route.module);
      assert.equal(count(phasePaths(result, 'execute'), route.execute), 0, unit.recipe + ': ' + route.execute);
    }
  }
});
