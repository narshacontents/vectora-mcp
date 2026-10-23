import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {prepareTask, recipes} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const prepare = unit => prepareTask({units:[unit]});
const sources = result => Object.values(result.phaseSources).flat().map(source => source.path);
const mediaModules = ['bound-paper','correspondence','display-medium','device-medium'];

const aliasGroups = [
  [['book','notebook','ring-card','album'], 'paper', 'bound-paper'],
  [['postcard','letter'], 'paper', 'correspondence'],
  [['brochure','poster','display-sign','film-frame'], 'paper', 'display-medium'],
  [['email','social-feed','mobile-screen','video-screen'], 'paper', 'device-medium'],
  [['projection-screen'], 'scroll', null],
];

test('paper and projection media aliases add only their selected conditional rule', () => {
  for(const [aliases, variant, selectedFeature] of aliasGroups) {
    for(const alias of aliases) {
      const unit = {recipe:alias}, before = structuredClone(unit);
      const result = prepare(unit), resolved = result.resolved[0], paths = sources(result);
      assert.deepEqual(unit,before);
      assert.equal(recipes[alias].subtype,'ITA-1_TypeBoard');
      assert.equal(resolved.variant,variant,alias);
      assert.equal(resolved.features.includes(selectedFeature),Boolean(selectedFeature),alias);
      for(const feature of mediaModules) {
        assert.equal(resolved.features.includes(feature),feature===selectedFeature,alias+': '+feature);
        assert.equal(resolved.modules.includes(feature),feature===selectedFeature,alias+': '+feature);
        assert.equal(paths.includes('recipes/layouts/'+feature+'.md'),feature===selectedFeature,alias+': '+feature);
      }
      assert.ok(resolved.modules.includes(variant),alias+': '+variant);
      assert.ok(!resolved.modules.includes('screen'),alias+': accidental screen decoration');
    }
  }
});

test('conditional media features augment existing image-board and teacher-board routes', () => {
  for(const unit of [
    {recipe:'image-board',variant:'paper',textMode:'prose'},
    {recipe:'teacher-board',textMode:'labels'},
  ]) {
    const base = prepare(unit).resolved[0];
    const mixed = prepare({...unit,contains:mediaModules}).resolved[0];
    const added = mixed.modules.filter(module => !base.modules.includes(module)).sort();
    assert.deepEqual(added,mediaModules.slice().sort());
    assert.deepEqual(base.features.filter(feature => mediaModules.includes(feature)),[]);
    assert.deepEqual(mixed.features.filter(feature => mediaModules.includes(feature)).sort(),mediaModules.slice().sort());
    for(const module of base.modules) assert.ok(mixed.modules.includes(module),unit.recipe+': '+module);
  }
});

test('media aliases bind native paper text and compositions without introducing browser decoration', () => {
  const text = {recipe:'email',spec:{kind:'text',variant:'paper',title:'받은 편지',body:'본문'}};
  const textBefore = structuredClone(text);
  const textUnit = prepare(text).resolved[0];
  assert.deepEqual(text,textBefore);
  assert.equal(textUnit.variant,'paper');
  assert.ok(textUnit.features.includes('device-medium'));
  assert.ok(textUnit.modules.includes('device-medium'));
  assert.ok(!textUnit.modules.includes('screen'));

  const composition = {recipe:'book',spec:{kind:'composition',layout:'column',children:[
    {id:'page',spec:{kind:'text',variant:'paper',body:'페이지 본문'}},
  ]}};
  const compositionBefore = structuredClone(composition);
  const compositionResult = prepare(composition);
  assert.deepEqual(composition,compositionBefore);
  assert.equal(compositionResult.resolved[0].recipe,'book');
  assert.ok(compositionResult.resolved[0].features.includes('bound-paper'));
  assert.equal(compositionResult.resolved[1].recipe,'paper');
  assert.ok(!compositionResult.resolved.some(unit => unit.recipe==='screen'));

  const mapped = {recipe:'paper',spec:{kind:'composition',layout:'column',children:[
    {spec:{kind:'text',variant:'paper',body:'엽서 본문'}},
  ]},specRecipes:{'spec.children[0].spec':{recipe:'postcard'}}};
  const mappedResult = prepare(mapped);
  assert.equal(mappedResult.resolved[1].recipe,'postcard');
  assert.ok(mappedResult.resolved[1].features.includes('correspondence'));

  const projection = prepare({recipe:'projection-screen',spec:{kind:'text',variant:'scroll-screen',body:'화면'}}).resolved[0];
  assert.equal(projection.variant,'scroll');
  assert.ok(projection.modules.includes('scroll'));
  assert.ok(!projection.modules.includes('screen'));
});

test('media features do not leak into unrelated or old paper routes', () => {
  for(const unit of [
    {recipe:'paper'},
    {recipe:'image-board',variant:'paper'},
    {recipe:'teacher-board'},
    {recipe:'newspaper'},
    {recipe:'scroll'},
    {recipe:'line'},
  ]) {
    const resolved = prepare(unit).resolved[0];
    for(const feature of mediaModules) assert.ok(!resolved.features.includes(feature),unit.recipe+': '+feature);
  }
  assert.throws(()=>prepare({recipe:'email',spec:{kind:'text',variant:'email',body:'본문'}}),/unsupported native text frame variant email/);
  const list = JSON.parse(execFileSync(process.execPath,['skills/create-kice-illustration/scripts/prepare_task.mjs','--list'],{encoding:'utf8'}));
  for(const [aliases] of aliasGroups) for(const alias of aliases) assert.deepEqual(list.recipes[alias],recipes[alias]);
  for(const feature of mediaModules) {
    assert.ok(list.components.includes(feature));
    assert.equal(typeof list.features[feature],'string');
  }
  assert.ok(!list.variants['ITA-1_TypeBoard'].includes('email'));
});
