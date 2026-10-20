import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {prepareTask, recipes} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import {readIndex} from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';

// Native subsets test instruction selection, not runtime schema acceptance.
const prepare = unit => prepareTask({units: [unit]});
const sources = result => Object.values(result.phaseSources).flat().map(source => source.path);
const index = readIndex();
const schematic = {kind:'schematic', layout:'relations', widthMm:100,
 nodes:[{id:'left',text:'가',shape:'rect'},{id:'right',text:'나',shape:'rect'}],
 edges:[{id:'pair',from:'left',to:'right',direction:'none',routing:'straight'}]};

test('aliases retain 54 classification IDs and appear in recipe discovery', () => {
 assert.equal(Object.keys(index.subtypes).length,54);
 assert.equal(recipes.comparison.subtype,'D4-07_Others');
 assert.equal(recipes['site-plan'].subtype,'I3-14_Others');
 assert.equal(recipes.place.subtype,'ITC-3_Place');
 const list=JSON.parse(execFileSync(process.execPath,['skills/create-kice-illustration/scripts/prepare_task.mjs','--list'],{encoding:'utf8'}));
 for(const alias of ['comparison','site-plan','place'])assert.deepEqual(list.recipes[alias],recipes[alias]);
});

test('named-place scene retains identity guidance alongside independent speech and original-photo modes', () => {
 const scene={recipe:'place',variant:'scene',contains:['artwork','people','speech-solo','prose'],spec:{kind:'asset',assetId:'scene-1',sceneWidthMm:90}};
 const copy=structuredClone(scene),result=prepare(scene),paths=sources(result);
 assert.deepEqual(scene,copy);
 assert.equal(result.resolved.length,1);
 assert.equal(result.resolved[0].subtype,'ITC-3_Place');
 assert.ok(paths.includes('recipes/ITC_Fixed/ITC-3_Place.md'));
 for(const path of ['components/bubble.md','components/free-art.md','components/people.md'])assert.ok(paths.includes(path));
 assert.ok(!paths.includes('recipes/I2_Illustration/illustration-scene.md'));
 const original=prepare({...scene,contains:['photo'],textMode:'none'});
 assert.ok(sources(original).includes('components/photo.md'));
 assert.ok(!sources(original).includes('components/free-art.md'));
 assert.ok(!sources(original).includes('components/bubble.md'));
 const beside=prepare({...scene,variant:'presentation',contains:['artwork','people','prose']});
 assert.equal(beside.resolved[0].variant,'presentation');
 assert.ok(sources(beside).includes('recipes/layouts/presentation.md'));
 assert.throws(()=>prepare({...scene,spec:{kind:'map'}}),/incompatible/);
});

for(const withSpec of [false,true]) {
 test(`comparison ${withSpec?'spec':'brief'} keeps correspondence and omits flowchart rules`, () => {
  const unit={recipe:'comparison', ...(withSpec?{spec:structuredClone(schematic)}:{})};
  const original=structuredClone(unit),result=prepare(unit),paths=sources(result);
  assert.deepEqual(unit,original);
  assert.equal(result.resolved[0].recipe,'comparison');
  assert.equal(result.resolved[0].subtype,'D4-07_Others');
  assert.ok(result.resolved[0].modules.includes('node-diagram'));
  assert.ok(paths.includes('recipes/D4_Diagram/D4-07_Others.md'));
  assert.ok(paths.includes('components/node-diagram.md'));
  assert.ok(!paths.includes('recipes/D4_Diagram/D4-03_Flowchart.md'));
  for(const principle of ['중앙 항목 타원','위아래 전후 패널','수평 대응선','예/아니오','무방향','일반 벡터']) {
   assert.ok(result.contents.design.includes(principle),principle);
  }
  assert.deepEqual(result,prepare(unit));
 });
 test(`generic D4-07 ${withSpec?'spec':'brief'} loads node rules only when requested`, () => {
  const unit={recipe:'D4-07_Others',...(withSpec?{spec:structuredClone(schematic)}:{})};
  const generic=prepare(unit),withNodes=prepare({...unit,contains:['node']});
  assert.equal(generic.resolved[0].subtype,'D4-07_Others');
  assert.ok(!generic.resolved[0].modules.includes('node-diagram'));
  assert.ok(!sources(generic).includes('components/node-diagram.md'));
  assert.ok(withNodes.resolved[0].modules.includes('node-diagram'));
  assert.ok(sources(withNodes).includes('components/node-diagram.md'));
 });
 for(const dataSource of ['provided','research','hypothetical'])for(const textMode of ['labels','none']) {
  test(`site-plan ${withSpec?'spec':'brief'} / ${dataSource} / ${textMode} propagates source and geometry principles`, () => {
   const unit={recipe:'site-plan',dataSource,textMode,...(withSpec?{spec:structuredClone(schematic)}:{})};
   const original=structuredClone(unit),result=prepare(unit),resolved=result.resolved[0],paths=sources(result);
   assert.deepEqual(unit,original);
   assert.equal(resolved.subtype,'I3-14_Others');
   assert.ok(resolved.modules.includes('node-diagram'));
   for(const mod of ['map-preset','map-native','map-edit','map-projection','map-runtime']){
    assert.ok(!resolved.modules.includes(mod),mod);
    assert.ok(!paths.includes(index.modules[mod]),mod);
   }
   assert.ok(paths.includes('components/node-diagram.md'));
   assert.ok(paths.includes('recipes/I3_Map/I3-14_Others.md'));
   for(const principle of ['출처 평면 이미지를 직접 확인','성문·도로·건물','창작하지 않는다','dataSource:hypothetical','등록 GIS 프리셋 절차를 무조건 요구하지 않는다','현재 지원되는 schematic/일반 벡터','미확인 layout','원본 스캔'])assert.ok(result.contents.design.includes(principle),principle);
   assert.equal(resolved.features.includes('real-data'),dataSource==='research');
   assert.equal(resolved.modules.includes('map-points'),textMode!=='none');
   assert.equal(resolved.modules.includes('real-data'),dataSource==='research');
   // Research of a source plan must not inherit GIS coordinate conversion.
   assert.ok(!resolved.modules.includes('real-data-map'));
   assert.ok(!paths.includes('components/real-data-map.md'));
  });
 }
}

for(const dataSource of ['provided','research','hypothetical'])for(const textMode of ['labels','none']) {
 test(`native map site-plan / ${dataSource} / ${textMode} retains the complete map contract`, () => {
  const unit={recipe:'site-plan',dataSource,textMode,spec:{kind:'map',overlays:[]}};
  const original=structuredClone(unit),result=prepare(unit),resolved=result.resolved[0];
  const direct=prepare({...unit,recipe:'I3-14_Others'});
  assert.deepEqual(unit,original);
  assert.equal(resolved.recipe,'site-plan');
  assert.equal(resolved.subtype,'I3-14_Others');
  assert.deepEqual(resolved.modules,direct.resolved[0].modules);
  assert.deepEqual(sources(result),sources(direct));
  for(const mod of ['map-preset','map-native','map-runtime']){
   assert.ok(resolved.modules.includes(mod),mod);
   assert.ok(result.phaseSources.execute.some(source=>source.path===index.modules[mod]),mod);
  }
  assert.equal(resolved.modules.includes('real-data-map'),dataSource==='research');
  assert.equal(result.phaseSources.design.some(source=>source.path===index.modules['real-data-map']),dataSource==='research');
  assert.ok(result.phaseSources.design.some(source=>source.path==='recipes/I3_Map/I3-14_Others.md'));
 });
}

test('explicit site-plan overlays survive both schematic and native map routing', () => {
 for(const kind of ['schematic','map']){
  const result=prepare({recipe:'site-plan',spec:{kind},contains:['route','projection']});
  for(const mod of ['map-route','map-routes-native','map-projection'])assert.ok(result.resolved[0].modules.includes(mod),mod);
  assert.equal(result.resolved[0].modules.includes('map-preset'),kind==='map');
 }
});

test('nested aliases require explicit semantic binding and survive inference unchanged', () => {
 const request={recipe:'paper',spec:{kind:'composition',children:[{spec:structuredClone(schematic)},{spec:structuredClone(schematic)},{spec:{kind:'map',overlays:[]}}]},specRecipes:{'spec.children[0].spec':'comparison','spec.children[1].spec':{recipe:'site-plan',dataSource:'research'},'spec.children[2].spec':{recipe:'site-plan',dataSource:'research'}}};
 const original=structuredClone(request),result=prepare(request);
 assert.deepEqual(request,original);
 assert.deepEqual(result.resolved.map(unit=>unit.recipe),['paper','comparison','site-plan','site-plan']);
 assert.equal(result.resolved[1].subtype,'D4-07_Others');
 assert.equal(result.resolved[2].subtype,'I3-14_Others');
 assert.equal(result.resolved[3].subtype,'I3-14_Others');
 for(const mod of ['map-preset','map-native','map-runtime','real-data-map']){
  assert.ok(!result.resolved[2].modules.includes(mod),mod);
  assert.ok(result.resolved[3].modules.includes(mod),mod);
  const phase=mod==='real-data-map'?'design':'execute';
  assert.ok(result.phaseSources[phase].some(source=>source.path===index.modules[mod]&&source.unit===result.resolved[3].id),mod);
 }
 assert.ok(!sources(result).includes('recipes/D4_Diagram/D4-03_Flowchart.md'));
 for(const unit of result.resolved.slice(1))assert.ok(unit.inference.some(entry=>entry.condition==='explicit specRecipes mapping'&&entry.inferred===unit.recipe));
 assert.equal(sources(result).filter(path=>path==='components/node-diagram.md').length,1);
 assert.throws(()=>prepare({recipe:'paper',spec:request.spec}),/cannot uniquely select recipe.*schematic.*specRecipes/);
});

test('general flowchart, schematic, topographic and direct Others routes keep their meanings', () => {
 for(const withSpec of [false,true])for(const [recipe,subtype,kind] of [
  ['flowchart','D4-03_Flowchart','schematic'],['schematic','D4-06_Schematic','schematic'],
  ['topographic-map','I3-12_Topographic','map'],['D4-07_Others','D4-07_Others','schematic'],['I3-14_Others','I3-14_Others','map'],
 ]) {
  const result=prepare({recipe,...(withSpec?{spec:{kind}}:{})});
  assert.equal(result.resolved[0].subtype,subtype);
  if(recipe==='I3-14_Others'||recipe==='topographic-map')assert.ok(result.resolved[0].modules.includes('map-preset'));
  if(recipe==='flowchart')assert.ok(sources(result).includes('recipes/D4_Diagram/D4-03_Flowchart.md'));
 }
 assert.throws(()=>prepare({recipe:'comparison',spec:{kind:'map'}}),/incompatible/);
 assert.throws(()=>prepare({recipe:'site-plan',spec:{kind:'graph'}}),/incompatible/);
 assert.throws(()=>prepare({recipe:'comparison',contains:['site-plan']}),/recipe, not a contains/);
});

test('entrypoint exposes semantic routing without forcing all Others requests into aliases', () => {
 const root=readFileSync(new URL('../skills/create-kice-illustration/SKILL.md',import.meta.url),'utf8');
 assert.ok(root.includes('references/routing.md'));
 const entry=root+'\n'+readFileSync(new URL('../skills/create-kice-illustration/references/routing.md',import.meta.url),'utf8');
 for(const phrase of ['`comparison`(D4-07 + node-diagram)','`site-plan`(I3-14)','판정·절차 분기가 없으면 flowchart로 바꾸지 않는다','출처 평면 이미지','comparison / site-plan 별칭 외에는 Others로 우회하지 않는다'])assert.ok(entry.includes(phrase),phrase);
});


test('proportional-map loads only its linked quantity execution contract including composite children', () => {
 const module='execution/modules/map-proportional-native.md';
 const unit={recipe:'proportional-map',spec:{kind:'map',proportional:{schema:'vectora.map-proportional/v1'}}};
 const original=structuredClone(unit),single=prepare(unit);
 assert.deepEqual(unit,original);
 assert.equal(single.phaseSources.execute.filter(x=>x.path===module).length,1);
 for(const recipe of ['symbol-map','choropleth','locator-map'])assert.ok(!sources(prepare({recipe})).includes(module));
 const composite=prepareTask({units:[{id:'one',...unit},{id:'two',...unit}]});
 assert.equal(composite.phaseSources.execute.filter(x=>x.path===module).length,1);
 assert.equal(composite.resolved.length,2);
});
