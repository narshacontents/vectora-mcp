import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const nested={kind:'map',locators:[{id:'child',spec:{kind:'map',locators:[{id:'grandchild',spec:{kind:'map'}}]}}]};

test('prepare_task routes owned native map locators to map-inset without flattening their hierarchy',()=>{
 const result=prepareTask({units:[{id:'main',recipe:'topographic-map',spec:nested}]});
 assert.equal(result.resolved.length,1);
 assert.equal(result.resolved[0].features.includes('inset'),true);
 assert.equal(result.resolved[0].modules.includes('map-inset'),true);
 assert.deepEqual(result.resolved[0].inference,[{path:'units[0].spec.locators',condition:'owned native map locators',inferred:'inset'}]);
 assert.equal(result.resolved[0].modules.includes('composition'),false);
});

test('empty native locators do not add inset guidance and explicit inset requests still route',()=>{
 const ordinary=prepareTask({units:[{id:'main',recipe:'topographic-map',spec:{kind:'map',locators:[]}}]});
 assert.equal(ordinary.resolved[0].modules.includes('map-inset'),false);
 const explicit=prepareTask({units:[{id:'main',recipe:'topographic-map',contains:['inset'],spec:{kind:'map'}}]});
 assert.equal(explicit.resolved[0].modules.includes('map-inset'),true);
});
