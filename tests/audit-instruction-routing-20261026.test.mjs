import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {writeTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import {readIndex} from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';

function prepareRequest(request){
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'vectora-routing-'));
 try{
  const result=writeTask(request,out);
  return {...result,executeText:fs.readFileSync(result.beforeExecute[0],'utf8')};
 }finally{fs.rmSync(out,{recursive:true,force:true});}
}
const prepare=unit=>prepareRequest({units:[unit]});
const paths=(result,phase)=>result.sources[phase].map(source=>source.path);
const assertSelectedOnce=(result,module,file)=>{
 assert.equal(result.selected[0].modules.filter(name=>name===module).length,1,`${module} selection`);
 assert.equal(paths(result,'execute').filter(path=>path===file).length,1,`${file} execute source`);
 assert.equal(result.executeText.split(`<!-- source:${file}`).length-1,1,`${file} execute content`);
};

test('map-feature, map-inset and node-diagram retain design rules and add one native execution module',()=>{
 const cases=[
  {unit:{recipe:'topographic-map'},component:'map-feature',native:'map-feature-native'},
  {unit:{recipe:'area-map',contains:['inset']},component:'map-inset',native:'map-inset-native'},
  {unit:{recipe:'flowchart'},component:'node-diagram',native:'node-diagram-native'},
 ];
 for(const {unit,component,native} of cases){
  const result=prepare(unit);
  assert.ok(result.selected[0].modules.includes(component),`${component} component remains selected`);
  assert.ok(paths(result,'design').includes(`components/${component}.md`),`${component} design source remains included`);
  assertSelectedOnce(result,native,`execution/modules/${native}.md`);
 }
 const repeated=prepareRequest({units:[{recipe:'topographic-map'},{recipe:'topographic-map'}]});
 assert.equal(paths(repeated,'execute').filter(file=>file==='execution/modules/map-feature-native.md').length,1);
});

test('browser chrome is selected for webpage and native browser input, with feature override and deduplication',()=>{
 const webpage=prepare({recipe:'webpage',features:['browser-chrome']});
 assertSelectedOnce(webpage,'browser-chrome-micro-ui','execution/modules/browser-chrome-micro-ui.md');

 const nativeBrowser=prepare({recipe:'screen',spec:{kind:'text',variant:'browser',title:'자료'}});
 assertSelectedOnce(nativeBrowser,'browser-chrome-micro-ui','execution/modules/browser-chrome-micro-ui.md');

 const explicit=prepare({recipe:'screen',features:['browser-chrome']});
 assertSelectedOnce(explicit,'browser-chrome-micro-ui','execution/modules/browser-chrome-micro-ui.md');
});

test('ordinary screen and image-board screen variants do not select browser chrome',()=>{
 for(const unit of [
  {recipe:'screen'},
  {recipe:'image-board',variant:'screen'},
 ]){
  const result=prepare(unit);
  assert.ok(!result.selected[0].modules.includes('browser-chrome-micro-ui'),unit.recipe);
  assert.ok(!paths(result,'execute').includes('execution/modules/browser-chrome-micro-ui.md'),unit.recipe);
 }
});

test('text-flow registry description includes supported native map obstacles',()=>{
 const index=readIndex();
 assert.match(index.features['text-flow'].description,/래스터.*native 지도 장애물/);
 assert.match(index.features.artwork.description,/people:true/);
 assert.doesNotMatch(index.features.artwork.description,/--people/);
});

test('merged table spans add Nested structural instructions while preserving explicit Checklist and Cross meaning',()=>{
 const spec={kind:'table',cells:[{rowId:'header',columnId:'student',colSpan:2,role:'header'}]};
 const checklist=prepare({recipe:'D1-05_Checklist',spec}),checklistUnit=checklist.selected[0];
 assert.equal(checklistUnit.recipe,'D1-05_Checklist');
 assert.equal(checklistUnit.subtype,'D1-05_Checklist');
 assert.ok(checklistUnit.inference.some(entry=>entry.inferred==='D1-04_Nested'&&entry.evidence?.structuralOnly===true));
 assert.equal(paths(checklist,'design').filter(file=>file==='recipes/D1_Table/D1-04_Nested.md').length,1);

 const cross=prepare({recipe:'paper',spec:{kind:'composition',children:[{id:'merged-cross',spec}]},specRecipes:{'spec.children[0].spec':'D1-03_Cross'}});
 const crossUnit=cross.selected[1];
 assert.equal(crossUnit.recipe,'D1-03_Cross');
 assert.equal(crossUnit.subtype,'D1-03_Cross');
 assert.ok(crossUnit.inference.some(entry=>entry.inferred==='D1-04_Nested'&&entry.evidence?.structuralOnly===true));
 assert.equal(paths(cross,'design').filter(file=>file==='recipes/D1_Table/D1-04_Nested.md').length,1);
});

test('unsupported native kinds are exposed as unvalidated warnings in the prepared beforeExecute output',()=>{
 const result=prepare({recipe:'flowchart',spec:{kind:'futureDiagram'}});
 const warning=result.warnings?.find(item=>item.code==='uninspected-native-kind');
 assert.deepEqual(warning,{code:'uninspected-native-kind',unit:'unit-1',path:'units[0].spec',kind:'futureDiagram',message:'현재 선택 추론 범위 밖입니다. native 유효성은 검증되지 않았습니다.'});
 assert.match(result.executeText,/현재 선택 추론 범위 밖입니다/);
 assert.match(result.executeText,/native 유효성은 검증되지 않았으므로/);
 assert.throws(()=>prepare({recipe:'flowchart',spec:{kind:'table'}}),/incompatible with native kind table/);
});
