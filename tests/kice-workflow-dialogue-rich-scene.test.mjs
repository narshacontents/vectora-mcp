import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const prepare=unit=>prepareTask({units:[unit]});

test('group-board dialogue rich fields select text rules with exact provenance',()=>{
 const request={recipe:'ITA-6_GroupBoard',variant:'board',spec:{
  kind:'dialogue',layout:'horizontal',speakers:[{id:'a'},{id:'b'}],
  turns:[
   {id:'t1',speakerId:'a',text:'발언',richText:{text:'발언',styles:[{start:0,end:2,style:{underline:true}}]}},
   {id:'t2',speakerId:'b',text:'응답'},
  ],
  screenRichText:{text:'화면',styles:{0:{0:{vectoraInlineBox:{label:'가',widthMm:3}}}}},
  sharedScene:{board:{title:'공동 제목',titleRichText:{text:'공동 제목',underlines:[{start:0,end:2}],inlineBoxes:[{at:2,label:'가',widthMm:3}]}}},
 }};
 const before=structuredClone(request),result=prepare(request),again=prepare(request);
 assert.deepEqual(request,before);
 assert.deepEqual(result,again);
 const unit=result.resolved[0],origins=unit.inference.map(item=>item.path);
 assert.equal(unit.contains.filter(part=>part==='speech-horizontal').length,1);
 assert.deepEqual(unit.inference.filter(item=>item.inferred==='speech-horizontal'),[
  {path:'units[0].spec.turns[0].text',condition:'native horizontal dialogue renders every speaker turn as a speech bubble',inferred:'speech-horizontal'},
 ]);
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
 for(const path of ['core/underline.md','core/inline-box.md','components/bubble.md'])
  assert.equal(result.phaseSources.design.filter(source=>source.path===path).length,1,path);
});

test('vertical and screen presentation turns infer their matching speech condition once',()=>{
 const cases=[
  {layout:'vertical',condition:'speech-vertical',turn:{id:'t1',speakerId:'a',text:'세로 발언'},speakers:[{id:'a'}]},
  {layout:'presentation',mode:'screen',condition:'speech-solo',turn:{id:'t1',speakerId:'a',text:'발표 발언'},speakers:[{id:'a'}],screenText:'화면 자료'},
 ];
 for(const item of cases){
  const result=prepare({recipe:'ITA-6_GroupBoard',variant:'board',spec:{kind:'dialogue',layout:item.layout,mode:item.mode,speakers:item.speakers,turns:[item.turn],...(item.screenText?{screenText:item.screenText}:{})}});
  const unit=result.resolved[0],conditionEvidence=unit.inference.filter(entry=>entry.inferred===item.condition);
  assert.ok(unit.contains.includes(item.condition),item.layout);
  assert.equal(unit.contains.filter(part=>part===item.condition).length,1,item.layout);
  assert.deepEqual(conditionEvidence,[{path:'units[0].spec.turns[0].text',condition:item.layout==='presentation'?'native presentation screen mode renders every speaker turn as a bubble below the screen':'native vertical dialogue renders every speaker turn as a speech bubble',inferred:item.condition}],item.layout);
  assert.equal(result.phaseSources.design.filter(source=>source.path==='components/bubble.md').length,1,item.layout);
 }
});

test('richText.text alone provides speech evidence with its exact source path',()=>{
 const result=prepare({recipe:'ITA-6_GroupBoard',variant:'board',spec:{
  kind:'dialogue',layout:'vertical',speakers:[],turns:[{id:'t1',richText:{text:'서식 발언'}}],
 }});
 const unit=result.resolved[0];
 assert.ok(unit.contains.includes('speech-vertical'));
 assert.deepEqual(unit.inference.filter(entry=>entry.inferred==='speech-vertical'),[
  {path:'units[0].spec.turns[0].richText.text',condition:'native vertical dialogue renders every speaker turn as a speech bubble',inferred:'speech-vertical'},
 ]);
 assert.equal(result.phaseSources.design.filter(source=>source.path==='components/bubble.md').length,1);
});

test('explicit contains entries are preserved and deduplicated when dialogue inference agrees',()=>{
 const result=prepare({recipe:'ITA-6_GroupBoard',variant:'board',contains:['speech-horizontal','underline','speech-horizontal'],spec:{
  kind:'dialogue',layout:'horizontal',speakers:[{id:'a'},{id:'b'}],turns:[{id:'t1',speakerId:'a',text:'발언'}],
 }});
 assert.deepEqual(result.resolved[0].contains,['speech-horizontal','underline']);
 assert.equal(result.resolved[0].contains.filter(part=>part==='speech-horizontal').length,1);
 assert.equal(result.phaseSources.design.filter(source=>source.path==='components/bubble.md').length,1);
});

test('whitespace-only turns still route bubbles because the current native renderer draws them',()=>{
 const result=prepare({recipe:'ITA-6_GroupBoard',variant:'board',spec:{
  kind:'dialogue',layout:'horizontal',speakers:[{id:'a'},{id:'b'}],turns:[
   {id:'t1',speakerId:'a',text:' \t '},{id:'t2',speakerId:'b',text:'\n'},
  ],
 }});
 const unit=result.resolved[0];
 assert.ok(unit.contains.includes('speech-horizontal'));
 assert.deepEqual(unit.inference.filter(entry=>entry.inferred==='speech-horizontal'),[
  {path:'units[0].spec.turns[0].text',condition:'native horizontal dialogue renders every speaker turn as a speech bubble',inferred:'speech-horizontal'},
 ]);
 assert.equal(result.phaseSources.design.filter(source=>source.path==='components/bubble.md').length,1);
});

test('empty or non-speech dialogue content does not infer a bubble condition',()=>{
 const cases=[
  ['empty turns',{kind:'dialogue',layout:'horizontal',speakers:[{id:'a'}],turns:[]}],
  ['portrait-only',{kind:'dialogue',layout:'portrait-only',speakers:[{id:'a'}],turns:[{id:'t1',speakerId:'a',text:'이름 없는 초상'}]}],
  ['screen-only',{kind:'dialogue',layout:'presentation',mode:'screen',speakers:[],turns:[],screenText:'자료 화면'}],
  ['people only',{kind:'dialogue',layout:'horizontal',speakers:[{id:'a',assetId:'portrait'}],turns:[]}],
  ['prose only',{kind:'dialogue',layout:'horizontal',speakers:[],turns:[],sharedScene:{board:{title:'공동 제목'}}}],
 ];
 for(const [name,spec] of cases){
  const result=prepare({recipe:'ITA-6_GroupBoard',variant:'board',spec}),unit=result.resolved[0];
  assert.ok(!unit.contains.some(part=>part.startsWith('speech-')),name);
  assert.equal(result.phaseSources.design.filter(source=>source.path==='components/bubble.md').length,0,name);
 }
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
