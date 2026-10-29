import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareTask,writeTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import {skillRoot} from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';
const selected=result=>new Set(Object.values(result.phaseSources).flat().map(row=>row.path));
const optional=result=>new Set(result.onDemand.map(row=>row.path));

test('label-only graphs keep shared typography but defer paragraph, glyph and footnote mechanics',()=>{
 const result=prepareTask({units:[{recipe:'line'}]});
 const now=selected(result),later=optional(result);
 for(const file of ['core/typography.md','core/display-text.md','execution/text.md'])assert.ok(now.has(file),file);
 for(const file of ['core/prose.md','core/footnotes.md','core/symbols.md','execution/paragraphs.md','execution/text-ranges.md']){
  assert.ok(!now.has(file),file);assert.ok(later.has(file),file);
 }
 assert.ok(now.has('components/graph-style.md'));
 for(const item of result.onDemand){assert.ok(fs.statSync(path.join(skillRoot,item.path)).isFile());assert.ok(item.when.length>10);assert.ok(result.contents[item.phase].includes(item.path));}
});

test('real formatted prose selects paragraph/range contracts while footnotes remain an explicit task condition',()=>{
 const request={units:[{recipe:'newspaper',contains:['footnotes','symbols'],spec:{kind:'text',variant:'newspaper-wave',body:{text:'㉠ 자료를 살펴보자.',underlines:[{start:2,end:4}]}}}]};
 const before=structuredClone(request),result=prepareTask(request),now=selected(result);
 assert.deepEqual(request,before);
 for(const file of ['core/prose.md','core/underline.md','core/footnotes.md','core/symbols.md','execution/paragraphs.md','execution/text-ranges.md'])assert.ok(now.has(file),file);
 assert.ok(!optional(result).has('core/footnotes.md'));
 assert.ok(result.resolved[0].contains.includes('underline'));
 const labels=prepareTask({units:[{recipe:'line',contains:['footnotes']}]});
 assert.ok(selected(labels).has('core/footnotes.md'));
 assert.ok(selected(labels).has('execution/paragraphs.md'));
 assert.ok(!selected(labels).has('core/prose.md'));
});

test('intent and composite conditions survive without a complete native spec and deduplicate shared reading',()=>{
 const result=prepareTask({units:[
  {recipe:'teacher-board',contains:['prose','speech-solo','inline-box']},
  {recipe:'bar',contains:['footnotes']},
  {recipe:'symbol-map',dataSource:'provided'},
 ]});
 const paths=Object.values(result.phaseSources).flat().map(row=>row.path);
 for(const file of ['core/production-plan.md','core/review.md','core/typography.md','core/display-text.md','execution/text.md','execution/paragraphs.md','core/footnotes.md','core/inline-box.md','core/composition.md'])assert.equal(paths.filter(p=>p===file).length,1,file);
 assert.ok(result.resolved.find(row=>row.recipe==='teacher-board').contains.includes('inline-box'));
 assert.ok(result.resolved.find(row=>row.recipe==='symbol-map').modules.includes('map-points'));
});

test('plan and repair guidance reach their phases for textless, single and composite work without loading the caller manual',()=>{
 for(const units of [[{recipe:'object',textMode:'none'}],[{recipe:'line'}],[{recipe:'webpage'},{recipe:'table'}]]){
  const request={units},before=structuredClone(request),result=prepareTask(request);
  assert.deepEqual(request,before);
  assert.ok(result.phaseSources.design.some(row=>row.path==='core/production-plan.md'));
  assert.ok(result.phaseSources.deliver.some(row=>row.path==='core/review.md'));
  for(const phase of ['execute','deliver'])assert.ok(!result.phaseSources[phase].some(row=>row.path==='core/production-plan.md'));
  assert.ok(!selected(result).has('execution/caller.md'));
  const external=prepareTask({...request,caller:'exam-agent'});
  assert.ok(selected(external).has('execution/caller.md'));
  assert.ok(!selected(external).has('references/caller/exam-agent-guide.md'));
 }
});

test('optional branches are real absolute readable files in CLI output; default delivery does not load manual branch',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'vectora-focus-'));
 try{
  const result=writeTask({units:[{recipe:'table'}]},out);
  assert.ok(!Object.values(result.sources).flat().some(row=>row.path==='execution/delivery-manual.md'));
  const manual=result.onDemand.find(row=>row.path.endsWith('/execution/delivery-manual.md'));
  assert.ok(manual&&manual.phase==='deliver');
  for(const item of result.onDemand){assert.ok(path.isAbsolute(item.path));assert.ok(fs.statSync(item.path).isFile());}
  const files=[...result.readNow,...result.beforeExecute,...result.beforeDeliver];
  for(const file of files)assert.ok(fs.statSync(file).size>0);
  assert.equal(result.instructionSize.totalBytes,Object.values(result.instructionSize.bytes).reduce((a,b)=>a+b,0));
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});

test('blank artwork does not pull text-only guidance; invalid text conditions still reject',()=>{
 const result=prepareTask({units:[{recipe:'object',textMode:'none'}]});
 assert.ok(!selected(result).has('core/typography.md'));
 assert.ok(!optional(result).has('core/footnotes.md'));
 for(const condition of ['footnotes','symbols'])assert.throws(()=>prepareTask({units:[{recipe:'object',textMode:'none',contains:[condition]}]}),/Text components/);
});

test('large composites keep all rules and report a nonblocking size signal without truncation',()=>{
 const result=prepareTask({units:[{recipe:'teacher-board',contains:['prose','speech-solo','inline-box','symbols','footnotes']},{recipe:'route-map',contains:['korea','natural'],dataSource:'research'},{recipe:'bar'}]});
 assert.equal(result.instructionSize.warning,'large-instruction-bundle');
 const now=selected(result);
 for(const file of ['core/inline-box.md','core/symbols.md','core/footnotes.md','components/map-korea.md','components/graph-style.md'])assert.ok(now.has(file),file);
 for(const [phase,body] of Object.entries(result.contents))assert.equal(result.instructionSize.bytes[phase],Buffer.byteLength(body));
});


test('map data-layer contracts are selected by meaning before spec creation, not loaded for ordinary routes',()=>{
 const route=prepareTask({units:[{recipe:'route-map'}]}),isoline=prepareTask({units:[{recipe:'isoline-map'}]}),choropleth=prepareTask({units:[{recipe:'choropleth'}]});
 assert.ok(!selected(route).has('execution/modules/map-scalar-native.md'));
 assert.ok(!selected(route).has('execution/modules/map-thematic-native.md'));
 assert.ok(optional(route).has('execution/modules/map-scalar-native.md'));
 assert.ok(selected(isoline).has('execution/modules/map-scalar-native.md'));
 assert.ok(selected(choropleth).has('execution/modules/map-thematic-native.md'));
 assert.ok(!selected(choropleth).has('execution/modules/map-scalar-native.md'));
 const old=prepareTask({units:[{recipe:'old-map'}]});
 assert.ok(!old.contents.design.includes('Miller/Patterson'));
 assert.ok(route.contents.design.includes('Miller/Patterson'));
});
