import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const prepare=unit=>prepareTask({units:[unit]});

test('matching presentation variant and inferred speech-solo preserve the original-photo contract',()=>{
 const request={recipe:'original-person',variant:'presentation',dataSource:'provided',spec:{
  kind:'dialogue',layout:'presentation',speakers:[{id:'a',assetId:'portrait'}],turns:[{id:'t1',speakerId:'a',text:'발표 발언'}],
 }};
 const before=structuredClone(request),result=prepare(request),unit=result.resolved[0];
 assert.deepEqual(request,before);
 assert.equal(unit.subtype,'ITC-2_RealPhoto');
 assert.equal(unit.variant,'presentation');
 assert.equal(unit.people,true);
 assert.equal(unit.contains.filter(part=>part==='speech-solo').length,1);
 assert.ok(unit.modules.includes('photo'));
 assert.ok(unit.modules.includes('person-speech'));
 assert.ok(!unit.modules.includes('artwork'));
 assert.ok(!unit.modules.includes('presentation-artwork'));
});

test('nested explicit original-person presentation mapping keeps the same photo and speech contract',()=>{
 const request={recipe:'paper',spec:{kind:'composition',layout:'column',children:[{
  id:'portrait',spec:{kind:'dialogue',layout:'presentation',speakers:[{id:'a',assetId:'portrait'}],turns:[{id:'t1',speakerId:'a',text:'발표 발언'}]},
 }]},specRecipes:{'spec.children[0].spec':{recipe:'original-person',variant:'presentation',people:true,dataSource:'provided'}}};
 const before=structuredClone(request),result=prepare(request),child=result.resolved[1];
 assert.deepEqual(request,before);
 assert.equal(child.subtype,'ITC-2_RealPhoto');
 assert.equal(child.variant,'presentation');
 assert.equal(child.contains.filter(part=>part==='speech-solo').length,1);
 assert.ok(child.modules.includes('photo'));
 assert.ok(!child.modules.includes('artwork'));
 assert.ok(!child.modules.includes('presentation-artwork'));
});

test('native dialogue layout conflicts with a different selected horizontal or vertical route',()=>{
 assert.throws(()=>prepare({recipe:'original-person',variant:'horizontal',spec:{
  kind:'dialogue',layout:'vertical',speakers:[],turns:[],
 }}),/Conflicting layouts: horizontal, vertical/);
 assert.throws(()=>prepare({recipe:'horizontal-dialogue',spec:{
  kind:'dialogue',layout:'vertical',speakers:[],turns:[],
 }}),/Conflicting layouts: horizontal, vertical/);
  assert.throws(()=>prepare({recipe:'presentation',spec:{
   kind:'dialogue',layout:'horizontal',speakers:[],turns:[],
  }}),/Conflicting layouts: presentation, horizontal/);
});
