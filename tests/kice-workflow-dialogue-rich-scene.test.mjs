import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const prepare=unit=>prepareTask({units:[unit]});

test('group-board dialogue rich fields select text rules with exact provenance',()=>{
 const request={recipe:'ITA-6_GroupBoard',variant:'board',contains:['speech-horizontal'],spec:{
  kind:'dialogue',layout:'horizontal',speakers:[],
  turns:[{id:'t1',richText:{text:'발언',styles:[{start:0,end:2,style:{underline:true}}]}}],
  screenRichText:{text:'화면',styles:{0:{0:{vectoraInlineBox:{label:'가',widthMm:3}}}}},
  sharedScene:{board:{title:'공동 제목',titleRichText:{text:'공동 제목',underlines:[{start:0,end:2}],inlineBoxes:[{at:2,label:'가',widthMm:3}]}}},
 }};
 const before=structuredClone(request),result=prepare(request),again=prepare(request);
 assert.deepEqual(request,before);
 assert.deepEqual(result,again);
 const unit=result.resolved[0],origins=unit.inference.map(item=>item.path);
 assert.ok(unit.contains.includes('underline'));
 assert.ok(unit.contains.includes('inline-box'));
 assert.equal(unit.contains.filter(part=>part==='underline').length,1);
 assert.equal(unit.contains.filter(part=>part==='inline-box').length,1);
 for(const path of [
  'units[0].spec.turns[0].richText.styles[0].style.underline',
  'units[0].spec.screenRichText.styles.0.0.vectoraInlineBox',
  'units[0].spec.sharedScene.board.title',
  'units[0].spec.sharedScene.board.titleRichText.underlines',
  'units[0].spec.sharedScene.board.titleRichText.inlineBoxes',
 ])assert.ok(origins.includes(path),path);
 for(const path of ['core/underline.md','core/inline-box.md'])
  assert.equal(result.phaseSources.design.filter(source=>source.path===path).length,1,path);
});

test('plain shared-board title remains the text fallback and contradicts textMode none',()=>{
 const spec={kind:'dialogue',layout:'horizontal',speakers:[],turns:[],sharedScene:{board:{title:'공동 제목',titleRichText:null}}};
 assert.throws(()=>prepare({recipe:'ITA-6_GroupBoard',variant:'board',textMode:'none',spec}),
  /textMode:none.*units\[0\]\.spec\.sharedScene\.board\.title/);
 const result=prepare({recipe:'ITA-6_GroupBoard',variant:'board',textMode:'labels',spec});
 assert.ok(result.resolved[0].inference.some(item=>item.path==='units[0].spec.sharedScene.board.title'&&item.inferred==='text'));
 assert.ok(!result.resolved[0].contains.includes('underline'));
 assert.ok(!result.resolved[0].contains.includes('inline-box'));
});

test('missing or null sharedScene adds no inferred text components',()=>{
 for(const sharedScene of [undefined,null]){
  const spec={kind:'dialogue',layout:'horizontal',speakers:[],turns:[],...(sharedScene===undefined?{}:{sharedScene})};
  const result=prepare({recipe:'ITA-6_GroupBoard',variant:'board',contains:['speech-horizontal'],textMode:'none',spec});
  assert.deepEqual(result.resolved[0].contains,['speech-horizontal']);
  assert.deepEqual(result.resolved[0].features,['speech-horizontal']);
  assert.ok(!result.resolved[0].contains.includes('underline'));
  assert.ok(!result.resolved[0].contains.includes('inline-box'));
 }
});
