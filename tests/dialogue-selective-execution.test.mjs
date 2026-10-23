import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareTask } from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import { prepareRules } from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';

const run = unit => prepareTask({units:[unit]}).contents.execute;

test('dialogue execution retains only the selected layout contract', () => {
  const vertical = run({recipe:'vertical-dialogue'});
  assert.match(vertical, /two-line-body-v1/);
  assert.match(vertical, /portraitFrame/);
  assert.doesNotMatch(vertical, /artwork\.speechGroups|source-alpha-v1|presentationMode:"speech"/);
  const horizontal = run({recipe:'horizontal-dialogue'});
  assert.match(horizontal, /artwork\.speechGroups/);
  assert.match(horizontal, /source-alpha-v1/);
  assert.doesNotMatch(horizontal, /two-line-body-v1|presentationMode:"speech"/);
  const presentation = run({recipe:'presentation'});
  assert.match(presentation, /presentationMode:"speech"/);
  assert.doesNotMatch(presentation, /two-line-body-v1|artwork\.speechGroups|source-alpha-v1/);
  for (const text of [vertical,horizontal,presentation]) {
    assert.match(text, /vectora:\/\/production\/dialogue\/schema/);
    assert.match(text, /speakers\[\]\.namePlacement/);
    assert.doesNotMatch(text, /<!-- (?:when-module|\/when-module)/);
  }
});

test('an explicit native shared board without turns still reads horizontal scene contracts', () => {
  const result = prepareTask({units:[{recipe:'ITA-6_GroupBoard',variant:'board',spec:{
    kind:'dialogue',layout:'horizontal',horizontalOptions:{layoutVersion:2,arrangement:'shared-row'},
    sharedScene:{version:1,artwork:{assetId:'approved-scene',speakers:[]}},speakers:[],turns:[]
  }}]});
  assert.ok(result.resolved[0].modules.includes('horizontal'));
  assert.match(result.contents.execute, /artwork\.dataRegions/);
  assert.match(result.contents.execute, /artwork\.speechGroups/);
  assert.doesNotMatch(result.contents.execute, /two-line-body-v1/);
});

test('mixed layout packets keep both contracts and the compatibility reader also filters', () => {
  const result = prepareTask({units:[{recipe:'vertical-dialogue'},{recipe:'presentation'},{recipe:'horizontal-dialogue'}]});
  for(const required of [/two-line-body-v1/,/presentationMode:"speech"/,/artwork\.speechGroups/]) assert.match(result.contents.execute,required);
  const legacy = prepareRules({subtype:'ITA-4_DialogueV',people:true}).content;
  assert.match(legacy,/two-line-body-v1/);
  assert.doesNotMatch(legacy,/artwork\.speechGroups|source-alpha-v1/);
  assert.throws(()=>prepareTask({units:[{recipe:'presentation',spec:{kind:'dialogue',layout:'vertical'}}]}),/Conflicting layouts/);
});
