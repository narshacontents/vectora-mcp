import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readIndex,skillRoot} from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';
import {prepareTask,writeTask,recipes} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
const all=r=>Object.values(r.contents).join('\n');
test('all existing classification routes remain executable without a fixed read hierarchy',()=>{
 let count=0;
 for(const [recipe,row] of Object.entries(readIndex().subtypes))for(const variant of row.variants?Object.keys(row.variants):[undefined]){
  const r=prepareTask({units:[{recipe,variant}]});
  assert.equal(r.resolved[0].subtype,recipe);
  assert.equal(r.resolved[0].variant,variant??null);
  assert.ok(r.contents.design.length>1000);
  assert.ok(r.contents.execute.includes('expectedRevision'));
  assert.ok(r.contents.deliver.includes('저장된 실제 JPEG'));
  assert.ok(!all(r).includes('<!-- when-module'));
  count++;
 }
 assert.equal(count,124);
});
test('simple requests omit unrelated layouts and conditional typography',()=>{
 const bar=prepareTask({units:[{recipe:'bar'}]});
 assert.ok(bar.contents.design.includes('0.4pt'));
 assert.ok(bar.contents.design.includes('주요 Y눈금의 가로 파선'));
 assert.ok(!bar.contents.design.includes('신문 외피'));
 assert.ok(!all(bar).includes('STYLE CONTRACT:'));
 assert.ok(!all(bar).includes('inlineTextBox'));
 assert.ok(!all(bar).includes('UND v3.0 Body로 기본 지정'));
 assert.ok(!bar.contents.design.includes('vectora_export_package'));
});
test('vertical characters, messenger and original photographs select different dependencies',()=>{
 const vertical=prepareTask({units:[{recipe:'vertical-dialogue'}]});
 assert.equal(vertical.resolved[0].people,true);
 for(const s of ['2줄 이하','흉상','STYLE CONTRACT: Draw a living human character','비대칭'])assert.ok(vertical.contents.design.includes(s),s);
 const messenger=prepareTask({units:[{recipe:'messenger'}]});
 assert.equal(messenger.resolved[0].people,false);
 assert.ok(!all(messenger).includes('STYLE CONTRACT:'));
 assert.ok(!all(messenger).includes('headBounds'));
 const photo=prepareTask({units:[{recipe:'original-person',variant:'presentation'}]});
 assert.ok(all(photo).includes('사진을 재생성해 해결하지 않는다'));
 assert.ok(!photo.resolved[0].modules.includes('presentation-artwork'));
});
test('text conditions and native half spaces are selected for the actual material',()=>{
 const r=prepareTask({units:[{recipe:'newspaper',contains:['underline','inline-box']}]});
 for(const s of ['inlineTextBox','textRange','U+2002','U+0020','ASCII','『』','UND v3.0 Body'])assert.ok(all(r).includes(s),s);
 assert.ok(!all(r).includes('원본 인물 사진'));
 assert.throws(()=>prepareTask({units:[{recipe:'newspaper',textMode:'none',contains:['inline-box']}]}),/Text components/);
});
test('independent composite units deduplicate shared rules without losing their own form',()=>{
 const r=prepareTask({units:[{id:'paper',recipe:'newspaper',contains:['underline']},{id:'data',recipe:'bar'},{id:'table',recipe:'table'}]});
 assert.equal(r.resolved.length,3);
 const allSources=Object.values(r.phaseSources).flat().map(x=>x.path);
 assert.equal(allSources.filter(x=>x==='core/typography.md').length,1);
 assert.equal(allSources.filter(x=>x==='core/style.md').length,1);
 assert.equal(allSources.filter(x=>x==='core/composition.md').length,1);
 assert.ok(all(r).includes('신문'));
 assert.ok(all(r).includes('rowSpan'));
 assert.ok(all(r).includes('barWidthMm'));
 assert.ok(!all(r).includes('map-korea-sido'));
});
test('research and Korea map rules are loaded when selected, never assumed for a supplied world map',()=>{
 const world=prepareTask({units:[{recipe:'choropleth',dataSource:'provided'}]});
 assert.ok(!all(world).includes('map-korea-sido-2025'));
 const korea=prepareTask({units:[{recipe:'choropleth',contains:['korea'],dataSource:'research'}]});
 assert.ok(korea.resolved[0].features.includes('real-data'));
 assert.ok(all(korea).includes('map-korea-sido-2025'));
 assert.ok(all(korea).includes('구간'));
 assert.throws(()=>prepareTask({units:[{recipe:'old-map',contains:['dem']}]}),/original old-map/);
});
test('labeled route and thematic maps include placement rules without a separate points flag',()=>{
 const r=prepareTask({units:[{recipe:'worksheet'},{recipe:'route-map'},{recipe:'area-map'}]});
 for(const unit of r.resolved.slice(1))assert.ok(unit.modules.includes('map-points'));
 assert.equal(r.phaseSources.design.filter(s=>s.path==='components/map-points.md').length,1);
 assert.ok(r.contents.design.includes('지리 anchor는 고정'));
 const bare=prepareTask({units:[{recipe:'route-map',textMode:'none'}]});
 assert.ok(!bare.resolved[0].modules.includes('map-points'));
 const explicit=prepareTask({units:[{recipe:'route-map',textMode:'none',contains:['points']}]});
 assert.ok(explicit.resolved[0].modules.includes('map-points'));
 const old=prepareTask({units:[{recipe:'old-map'}]});
 assert.ok(!old.resolved[0].modules.includes('map-points'));
});
test('invalid selections fail clearly instead of silently omitting rules',()=>{
 for(const units of [[],[{recipe:'typo'}],[{recipe:'bar',contains:['inlne-box']}],[{recipe:'figure'}],[{recipe:'bar',dataSource:'internet'}],[{id:'x',recipe:'bar'},{id:'x',recipe:'pie'}]])assert.throws(()=>prepareTask({units}));
 assert.throws(()=>prepareTask({units:[{recipe:'horizontal-dialogue',contains:['speech-vertical']}]}),/Conflicting/);
});
test('a misplaced recipe explains the correction without silently rerouting the request',()=>{
 for(const recipe of ['costume','original-person']){
  const request={units:[{recipe:'webpage',contains:['people',recipe]}]};
  const original=structuredClone(request);
  assert.throws(()=>prepareTask(request),error=>error.message.includes(`${recipe} is a recipe`)&&error.message.includes(`recipe:"${recipe}"`)&&error.message.includes('variant'));
  assert.deepEqual(request,original);
  const corrected=prepareTask({units:[{recipe,variant:'screen',contains:['prose']}]});
  assert.equal(corrected.resolved[0].recipe,recipe);
  assert.equal(corrected.resolved[0].variant,'screen');
 }
 assert.throws(()=>prepareTask({units:[{recipe:'bar',contains:['inlne-box']}]}),/Unknown component: inlne-box/);
});
test('phase files are deterministic and cannot overwrite user or installed files',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kice-workflow-'));
 try{
  const req={units:[{recipe:'pie'}]};
  const a=writeTask(req,dir),b=writeTask(req,dir);
  assert.deepEqual(a,b);
  const design=a.readNow[0];fs.writeFileSync(design,'user content');
  assert.throws(()=>writeTask(req,dir));assert.equal(fs.readFileSync(design,'utf8'),'user content');
  assert.throws(()=>writeTask(req,path.join(skillRoot,'should-not-write')),/outside/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
