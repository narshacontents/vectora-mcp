import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTask, recipes} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const sources = result => Object.values(result.phaseSources).flat().map(source => source.path);
const surfaceSpec = expression => ({
 kind:'graph', type:'surface', dataFidelity:'concept',
 surface:{expression, variables:{x:'x',y:'y'}, xDomain:[0,1], yDomain:[0,1], samples:{x:3,y:3}},
});

test('surface alias routes D3-04 to the isolated surface execution contract', () => {
 assert.equal(recipes.surface.subtype,'D3-04_Others');
 assert.deepEqual(recipes.surface.nativeKinds,['graph']);
 const result=prepareTask({units:[{recipe:'surface'}]}), paths=sources(result);
 assert.equal(result.resolved[0].subtype,'D3-04_Others');
 assert.ok(result.resolved[0].modules.includes('surface-graph-api'));
 for(const module of ['graph-api','continuous-graph-api','graph-schema','axis-options','point-options']) {
  assert.ok(!result.resolved[0].modules.includes(module),module);
 }
 assert.ok(paths.includes('execution/modules/surface-graph-api.md'));
 for(const path of ['execution/modules/graph-api.md','execution/modules/continuous-graph-api.md','execution/modules/graph-schema.md']) {
  assert.ok(!paths.includes(path),path);
 }
 assert.match(result.contents.design,/전체 projected hull 바깥이라는 이유/);
});

test('nested native surface specs infer the surface recipe and execution module', () => {
 const request={units:[{
  recipe:'paper',
  spec:{kind:'composition',layout:'column',children:[{id:'surface',spec:surfaceSpec('x+y')}]},
 }]};
 const before=structuredClone(request),result=prepareTask(request);
 const child=result.resolved[1],paths=sources(result);
 assert.deepEqual(request,before);
 assert.equal(child.recipe,'surface');
 assert.equal(child.subtype,'D3-04_Others');
 assert.ok(child.inference.some(item=>item.condition==='native graph:surface'&&item.inferred==='surface'));
 assert.ok(paths.includes('execution/modules/surface-graph-api.md'));
 assert.ok(!paths.includes('execution/modules/continuous-graph-api.md'));
});

test('generic D3-04 2D graphs retain their existing continuous graph instructions', () => {
 const result=prepareTask({units:[{
  recipe:'D3-04_Others',
  spec:{kind:'graph',type:'line',dataFidelity:'concept',x:['가','나'],series:[{label:'관계',values:[0,1]}]},
 }]});
 const paths=sources(result);
 assert.equal(result.resolved[0].subtype,'D3-04_Others');
 assert.ok(result.resolved[0].modules.includes('graph-api'));
 assert.ok(result.resolved[0].modules.includes('continuous-graph-api'));
 assert.ok(!result.resolved[0].modules.includes('surface-graph-api'));
 assert.ok(paths.includes('execution/modules/graph-api.md'));
 assert.ok(paths.includes('execution/modules/continuous-graph-api.md'));
 assert.ok(!paths.includes('execution/modules/surface-graph-api.md'));
 assert.doesNotMatch(result.contents.design,/축별 연결감과 실제 글자 간격/);
});

test('ordinary native line charts keep their D2 routing and do not load surface guidance', () => {
 const result=prepareTask({units:[{
  recipe:'line',
  spec:{kind:'graph',type:'line',chartStyle:'line',dataFidelity:'exact',categories:['가','나'],series:[{label:'자료',values:[1,2]}]},
 }]});
 assert.equal(result.resolved[0].subtype,'D2-04_Line');
 assert.ok(!result.resolved[0].modules.includes('surface-graph-api'));
 assert.ok(!sources(result).includes('execution/modules/surface-graph-api.md'));
});

test('composite surface units deduplicate shared surface and composition modules', () => {
 const result=prepareTask({units:[{
  recipe:'paper',
  spec:{kind:'composition',layout:'column',children:[
   {id:'first',spec:surfaceSpec('x+y')},
   {id:'second',spec:surfaceSpec('x-y')},
  ]},
 }]});
 const paths=sources(result);
 assert.equal(result.resolved.filter(unit=>unit.recipe==='surface').length,2);
 assert.equal(paths.filter(path=>path==='execution/modules/surface-graph-api.md').length,1);
 assert.equal(paths.filter(path=>path==='execution/modules/composition.md').length,1);
 assert.equal(paths.filter(path=>path==='recipes/D3_Graph/D3-04_Others.md').length,1);
 assert.ok(!paths.includes('execution/modules/graph-api.md'));
 assert.ok(!paths.includes('execution/modules/continuous-graph-api.md'));
});
