import test from 'node:test';
import assert from 'node:assert/strict';
import {inferSpec} from '../skills/create-kice-illustration/scripts/infer_spec.mjs';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
// Native fixtures are selection-bearing subsets, not claims of complete runtime validity.
const prepare=unit=>prepareTask({units:[unit]});
const paths=r=>Object.values(r.phaseSources).flat().map(x=>x.path);
test('formatted newspaper visits concrete text slots and records exact provenance',()=>{
 const r=prepare({recipe:'newspaper',spec:{kind:'text',variant:'newspaper-wave',title:{text:'제목',styles:[{start:0,end:1,style:{doubleUnderline:true}}]},body:{text:'\uFFFC본문',underlines:[{start:0,end:1}],inlineBoxes:[{at:0,label:'가',widthMm:3}]},background:{masthead:{text:'신문',inlineBlanks:[{at:0,widthMm:3}]}},reserve:{heightMm:5}}});
 for(const part of ['underline','inline-box','reserve'])assert.ok(r.resolved[0].contains.includes(part));
 assert.ok(r.resolved[0].inference.some(x=>x.path==='units[0].spec.title.styles[0].style.doubleUnderline'&&x.inferred==='underline'));
 for(const file of ['core/underline.md','core/inline-box.md','core/reserve.md'])assert.equal(paths(r).filter(x=>x===file).length,1);
});
test('native graph and explicitly mapped table each select their own deduplicated recipe',()=>{
 const table={kind:'table',rows:[{id:'r'}],columns:[{id:'c'}],cells:[{id:'v',rowId:'r',columnId:'c',text:'값',richText:{text:'값',widthMm:10,styles:{0:{0:{underline:true}}}}}]};
 const unit={recipe:'newspaper',spec:{kind:'text',variant:'newspaper-wave',blocks:[{type:'graph',graph:{kind:'graph',type:'bar',series:[{label:'수치',values:[1,2]}]}},{type:'component',spec:{kind:'composition',layout:'column',children:[{spec:table},{spec:table},{reserve:{lines:2}}]}}]},specRecipes:{'spec.blocks[1].spec.children[0].spec':'cross-table','spec.blocks[1].spec.children[1].spec':'cross-table'}};
 const before=structuredClone(unit),a=prepare(unit),b=prepare(unit);
 assert.deepEqual(unit,before);assert.deepEqual(a,b);
 assert.deepEqual(a.resolved.map(x=>x.recipe),['newspaper','bar','cross-table','cross-table']);
 assert.equal(paths(a).filter(x=>x==='core/composition.md').length,1);
 assert.ok(a.resolved.every(x=>!x.features.includes('real-data')));
 assert.ok(!a.resolved[0].contains.includes('underline'));assert.ok(a.resolved[2].contains.includes('underline'));
 assert.ok(!a.resolved[0].contains.includes('reserve'));
 assert.equal(paths(a).filter(x=>x==='core/reserve.md').length,1);
 assert.ok(a.resolved[0].inference.some(x=>x.path==='units[0].spec.blocks[1].spec.children[2].reserve'&&x.condition==='native reserve'&&x.inferred==='reserve'));
});
// Fixtures test selection-bearing native subsets; runtime dimensions/data validation is separate.
// These cases intentionally contain invalid or unresolved native selection shapes.
test('ambiguous and unsupported children fail with actionable exact mapping diagnostics',()=>{
 for(const spec of [{kind:'table'},{kind:'graph',type:'points'},{kind:'graph',type:'line',chartStyle:'stacked-area'},{kind:'unrecognized'}]){
  assert.throws(()=>prepare({recipe:'paper',spec:{kind:'composition',children:[{spec}]}}),/spec.children\[0\].spec.*specRecipes/);
 }
 const unsupported=prepare({recipe:'paper',spec:{kind:'wat'}});
 assert.ok(unsupported.resolved[0].inference.some(entry=>entry.inferred==='uninspected-native-kind'&&entry.evidence?.kind==='wat'));
 assert.ok(unsupported.warnings?.some(warning=>warning.code==='uninspected-native-kind'&&warning.kind==='wat'&&warning.path==='units[0].spec'));
 assert.throws(()=>prepare({recipe:'paper',spec:{kind:'map'}}),/incompatible with native kind map/);
 assert.throws(()=>prepare({recipe:'paper',spec:{kind:'text',blocks:[{type:'wat'}]}}),/unsupported block/);
 assert.throws(()=>prepare({recipe:'paper',spec:{kind:'composition',children:[{spec:{kind:'table'}}]},specRecipes:{'spec.children[0].spec':'typo'}}),/Unknown recipe/);
 assert.throws(()=>prepare({recipe:'paper',spec:{kind:'text'},specRecipes:{'spec.metadata':'bar'}}),/Unused specRecipes/);
});
test('explicit intent survives inference and actual contradictions name their source',()=>{
 const spec={kind:'dialogue',layout:'presentation',speakers:[{id:'a',assetId:'portrait'}],turns:[{text:'설명'}]};
 assert.throws(()=>prepare({recipe:'presentation',people:false,spec}),/people:false.*speakers\[0\].assetId/);
 assert.throws(()=>prepare({recipe:'presentation',textMode:'none',spec}),/textMode:none.*turns\[0\].text/);
 const original=prepare({recipe:'original-person',variant:'presentation',dataSource:'provided',spec});
 assert.equal(original.resolved[0].people,true);
 assert.ok(!original.resolved[0].modules.includes('artwork'));
 assert.ok(!original.resolved[0].modules.includes('presentation-artwork'));
 const explicit=prepare({recipe:'newspaper',contains:['underline'],features:['reserve'],textMode:'labels',spec:{kind:'text',body:'본문'}});
 assert.equal(explicit.resolved[0].textMode,'labels');assert.ok(explicit.resolved[0].contains.includes('underline'));assert.ok(explicit.resolved[0].features.includes('reserve'));
});
test('native dialogue shared-scene artwork infers people and selects the free-art contract',()=>{
 const spec={kind:'dialogue',layout:'horizontal',speakers:[{speakerId:'a',headBounds:{x:12,y:8,width:20,height:24}},{speakerId:'b',headBounds:{x:74,y:8,width:20,height:24}}],turns:[{speakerId:'a',text:'첫 화자의 설명',richText:{text:'강조',inlineBoxes:[{at:0,label:'가',widthMm:3}]}},{speakerId:'b',text:'둘째 화자의 설명'}],sharedScene:{board:{title:'공유 제목'},artwork:{assetId:'reviewed-whole-scene',speakers:[{speakerId:'a',headBounds:{x:12,y:8,width:20,height:24}},{speakerId:'b',headBounds:{x:74,y:8,width:20,height:24}}]}}};
 const request={recipe:'horizontal-dialogue',contains:['prose'],spec},before=structuredClone(request),result=prepare(request),selected=result.resolved[0];
 assert.deepEqual(request,before);
 assert.equal(selected.people,true);
 assert.ok(selected.modules.includes('free-art'));
 for(const module of ['artwork','person-speech','person-spacing','dialogue-native'])assert.ok(selected.modules.includes(module),module);
 assert.ok(paths(result).includes('components/people.md'));
 assert.ok(paths(result).includes('components/free-art.md'));
 assert.ok(selected.inference.some(x=>x.path==='units[0].spec.sharedScene.artwork.assetId'&&x.condition==='nonempty shared-scene artwork asset reference'&&x.inferred==='people'));
 assert.ok(selected.inference.some(x=>x.path==='units[0].spec.sharedScene.board.title'&&x.inferred==='text'));
 assert.ok(selected.inference.some(x=>x.path==='units[0].spec.turns[0].text'&&x.inferred==='text'));
 assert.ok(selected.inference.some(x=>x.path==='units[0].spec.turns[0].richText.inlineBoxes'&&x.inferred==='inline-box'));
 assert.ok(selected.contains.includes('inline-box'));
 assert.ok(selected.contains.includes('prose'));
 assert.ok(paths(result).includes('core/prose.md'));
});
test('pre-artwork group board selects free-art from existing artwork condition without fabricating native inference',()=>{
 const request={recipe:'ITA-6_GroupBoard',variant:'board',contains:['people','artwork','speech-horizontal']};
 const before=structuredClone(request),result=prepare(request),selected=result.resolved[0];
 assert.deepEqual(request,before);
 assert.equal(selected.people,true);
 assert.ok(selected.features.includes('artwork'));
 assert.ok(selected.features.includes('speech-horizontal'));
 assert.ok(selected.modules.includes('free-art'));
 assert.ok(paths(result).includes('components/free-art.md'));
 assert.ok(!Object.hasOwn(selected,'inference'));
 assert.ok(!Object.hasOwn(selected,'specPath'));

 const portrait=prepare({recipe:'figure',variant:'screen',contains:['people']}).resolved[0];
 assert.equal(portrait.people,true);
 assert.ok(!portrait.features.includes('artwork'));
 assert.ok(!portrait.modules.includes('free-art'));
});
test('portrait-only dialogue and similarly named metadata do not infer free-art',()=>{
 const portrait=prepare({recipe:'horizontal-dialogue',spec:{kind:'dialogue',layout:'horizontal',speakers:[{speakerId:'a',assetId:'portrait'}],turns:[{speakerId:'a',text:'설명'}]}}).resolved[0];
 assert.equal(portrait.people,true);
 assert.ok(portrait.modules.includes('person-speech'));
 assert.ok(!portrait.modules.includes('free-art'));

 const metadata=prepare({recipe:'horizontal-dialogue',spec:{kind:'dialogue',layout:'horizontal',speakers:[],turns:[],metadata:{sharedScene:{artwork:{assetId:'ignore-me'}}}}}).resolved[0];
 assert.ok(!metadata.inference.some(x=>x.inferred==='people'));
 assert.ok(!metadata.inference.some(x=>x.path.includes('metadata.sharedScene.artwork.assetId')));
 assert.ok(!metadata.modules.includes('free-art'));

 const unrelated=prepare({recipe:'photo',spec:{kind:'asset',sharedScene:{artwork:{assetId:'ignore-me'}}}}).resolved[0];
 assert.equal(unrelated.people,false);
 assert.ok(!unrelated.modules.includes('free-art'));

 for(const [recipe,spec] of [
  ['bar',{kind:'graph',type:'bar',sharedScene:{artwork:{assetId:'ignore-me'}}}],
  ['table',{kind:'table',sharedScene:{artwork:{assetId:'ignore-me'}}}],
 ]){
  const result=prepare({recipe,spec}).resolved[0];
  assert.equal(result.people,false,recipe);
  assert.ok(!result.modules.includes('free-art'),recipe);
 }
});
test('shared-scene artwork inference stays on a nested dialogue child and conflicts with explicit people false',()=>{
 const dialogue={kind:'dialogue',layout:'vertical',speakers:[{speakerId:'a',headBounds:{x:3,y:4,width:10,height:12}}],turns:[{speakerId:'a',text:'설명'}],sharedScene:{artwork:{assetId:'child-scene',speakers:[{speakerId:'a',headBounds:{x:3,y:4,width:10,height:12}}]}}};
 const request={recipe:'paper',people:false,spec:{kind:'composition',children:[{id:'dialogue',spec:dialogue}]}};
 const before=structuredClone(request),result=prepare(request),parent=result.resolved[0],child=result.resolved[1];
 assert.deepEqual(request,before);
 assert.equal(parent.people,false);
 assert.ok(!parent.modules.includes('free-art'));
 assert.equal(child.people,true);
 assert.ok(child.modules.includes('free-art'));
 assert.ok(child.inference.some(x=>x.path==='units[0].spec.children[0].spec.sharedScene.artwork.assetId'&&x.inferred==='people'));
 assert.equal(child.specPath,'units[0].spec.children[0].spec');
 assert.throws(()=>prepare({...request,specRecipes:{'spec.children[0].spec':{recipe:'vertical-dialogue',people:false}}}),/people:false.*shared-scene artwork asset.*spec\.children\[0\]\.spec\.sharedScene\.artwork\.assetId/);
 assert.throws(()=>prepare({recipe:'vertical-dialogue',people:false,spec:dialogue}),/people:false.*shared-scene artwork asset.*sharedScene\.artwork\.assetId/);
});
test('known graph slots and presentation screenGraph are visited; unrelated metadata is ignored',()=>{
 const spec={kind:'text',variant:'browser',body:'본문',graphSlots:[{graph:{kind:'graph',type:'bar',chartStyle:'percent-column'}}],metadata:{reserve:{lines:1},inlineBoxes:[{}],underlines:[{}],spec:{kind:'table'},speakers:[{assetId:'ignored'}]}};
 const r=prepare({recipe:'screen',spec});
 assert.deepEqual(r.resolved.map(x=>x.recipe),['screen','stacked-bar']);
 assert.deepEqual(r.resolved[0].contains,[]);assert.equal(r.resolved[0].people,false);
 const screen=prepare({recipe:'presentation',spec:{kind:'dialogue',layout:'presentation',screenGraph:{kind:'graph',type:'pie'}}});
 assert.equal(screen.resolved[1].specPath,'units[0].spec.screenGraph');
});
test('map auto-label compatibility and no inferred research or people from metadata',()=>{
 const normal=prepare({recipe:'route-map',spec:{kind:'map',metadata:{text:'not a label',underlines:[{}]}}});
 assert.ok(normal.resolved[0].modules.includes('map-points'));
 assert.ok(!normal.resolved[0].features.includes('real-data'));
 const bare=prepare({recipe:'route-map',textMode:'none',spec:{kind:'map'}});
 assert.ok(!bare.resolved[0].modules.includes('map-points'));
 const oldRequest={recipe:'old-map',spec:{kind:'asset'}};
 const before=structuredClone(oldRequest),old=prepare(oldRequest),again=prepare(oldRequest);
 assert.deepEqual(oldRequest,before);assert.deepEqual(old,again);
 assert.equal(old.resolved[0].subtype,'I3-13_OldMap');
 assert.ok(old.resolved[0].modules.includes('photo'));
 assert.ok(old.resolved[0].modules.includes('map-historical'));
 assert.ok(!old.resolved[0].modules.includes('map-points'));
 assert.ok(!old.resolved[0].modules.includes('map-native'));
 assert.ok(!old.resolved[0].modules.includes('artwork'));
 assert.ok(!old.resolved[0].modules.includes('free-art'));
 assert.ok(!old.resolved[0].features.includes('points'));
 assert.throws(()=>prepare({recipe:'old-map',spec:{kind:'map'}}),/incompatible with native kind map; expected asset/);
 assert.throws(()=>prepare({recipe:'route-map',spec:{kind:'asset'}}),/incompatible with native kind asset; expected map/);
 const preparedWithoutSpec=prepare({recipe:'old-map'});
 assert.equal(preparedWithoutSpec.resolved[0].subtype,'I3-13_OldMap');
 assert.ok(preparedWithoutSpec.resolved[0].modules.includes('photo'));
 assert.ok(!preparedWithoutSpec.resolved[0].modules.includes('map-points'));
 assert.deepEqual(preparedWithoutSpec.resolved[0].modules,old.resolved[0].modules);
});

test('other original-photo routes keep their existing asset binding and photo contract',()=>{
 const photo=prepare({recipe:'photo',spec:{kind:'asset'}}).resolved[0];
 assert.equal(photo.subtype,'photo-original');
 assert.ok(photo.modules.includes('photo'));
 assert.ok(!photo.modules.includes('artwork'));
 const person=prepare({recipe:'original-person',variant:'presentation',spec:{kind:'asset'}}).resolved[0];
 assert.equal(person.subtype,'ITC-2_RealPhoto');
 assert.equal(person.variant,'presentation');
 assert.equal(person.people,true);
 assert.ok(person.modules.includes('photo'));
 assert.ok(!person.modules.includes('artwork'));
 assert.ok(!person.modules.includes('presentation-artwork'));
});
test('descendant presentation conditions stay on the child and original photo mapping preserves intent',()=>{
 const portrait={kind:'dialogue',layout:'presentation',mode:'screen',speakers:[{id:'s',assetId:'portrait'}],turns:[{id:'t',speakerId:'s',text:'설명'}],screenText:'화면'};
 const req={recipe:'paper',people:false,spec:{kind:'composition',layout:'column',children:[{id:'speaker',spec:portrait},{id:'text',spec:{kind:'text',variant:'newspaper-band',body:{text:'본문',underlines:[{start:0,end:1}]}}}]}};
 const r=prepare(req);
 assert.equal(r.resolved[0].people,false);assert.deepEqual(r.resolved[0].contains,[]);
 assert.equal(r.resolved[1].people,true);assert.ok(r.resolved[1].modules.includes('person-speech'));
 assert.deepEqual(r.resolved[1].contains,['speech-solo']);assert.deepEqual(r.resolved[2].contains,['underline']);
 assert.equal(r.resolved[2].people,false);
 const photo=prepare({...req,specRecipes:{'spec.children[0].spec':{recipe:'original-person',variant:'presentation',people:true,dataSource:'provided'}}});
 assert.equal(photo.resolved[1].variant,'presentation');assert.ok(!photo.resolved[1].modules.includes('artwork'));assert.ok(!photo.resolved[1].modules.includes('presentation-artwork'));
 assert.throws(()=>prepare({...req,specRecipes:{'spec.children[0].spec':{recipe:'presentation',people:false}}}),/people:false.*assetId/);
});
test('root kind compatibility and native composition shape guards stay specific',()=>{
 assert.throws(()=>prepare({recipe:'bar',spec:{kind:'text',variant:'newspaper-wave',body:'본문'}}),/incompatible.*text/);
 assert.throws(()=>prepare({recipe:'table',spec:{kind:'graph',type:'bar'}}),/incompatible.*graph/);
 assert.doesNotThrow(()=>prepare({recipe:'paper',spec:{kind:'composition',layout:'column',children:[{id:'r',reserve:{heightMm:3}}]}}));
 for(const children of [[],[{}],[null]])assert.throws(()=>prepare({recipe:'bar',spec:{kind:'composition',layout:'column',children}}),/composition requires children with spec, text, richText, or reserve/);
 assert.throws(()=>prepare({recipe:'paper',spec:{kind:'composition',children:[{spec:{kind:'composition',children:[]}}]}}),/native composition requires children/);
 // Explicit paper and image-board roots remain intentional outer frames.
 assert.equal(prepare({recipe:'paper',spec:{kind:'composition',children:[{id:'p',spec:{kind:'text',variant:'paper',body:'본문'}}]}}).resolved[0].recipe,'paper');
 assert.equal(prepare({recipe:'image-board',variant:'screen',spec:{kind:'composition',children:[{id:'p',spec:{kind:'text',variant:'paper',body:'본문'}}]}}).resolved[0].recipe,'image-board');
 const originalPerson=prepare({recipe:'original-person',variant:'presentation',spec:{kind:'composition',children:[{id:'p',spec:{kind:'text',variant:'paper',body:'사진 설명'}}]}});
 assert.equal(originalPerson.resolved[0].recipe,'original-person');assert.equal(originalPerson.resolved[0].type,'ITC_Fixed');
 assert.throws(()=>prepare({recipe:'old-map',spec:{kind:'composition',children:[{id:'map',spec:{kind:'map',overlays:[]}}]},specRecipes:{'spec.children[0].spec':'route-map'}}),/old-map is an original scan.*cannot bind a native composition/);
 assert.throws(()=>prepare({recipe:'route-map',spec:{kind:'composition',children:[{id:'map',spec:{kind:'map',overlays:[]}}]},specRecipes:{'spec.children[0].spec':'route-map'}}),/native map roots remain unsupported/);
 // Historical override is allowed when there is no actual portrait asset.
 assert.equal(prepare({recipe:'vertical-dialogue',people:false,spec:{kind:'dialogue',layout:'vertical',speakers:[{id:'s'}],turns:[{id:'t',speakerId:'s',text:'문장'}]}}).resolved[0].people,false);
});
test('D1-D4 root compositions retain semantic recipes and infer paper children once',()=>{
 const makeUnit=(recipe,id,children,layout='column',extra={})=>({id,recipe,spec:{kind:'composition',layout,children,...extra}});
 const flowChildren=[
  {id:'collect',spec:{kind:'text',variant:'paper',title:'자료: 수집',body:{text:'설문 자료를 모은다.',styles:[{start:0,end:2,style:{underline:true}}]}}},
  {id:'analyze',spec:{kind:'text',variant:'paper',title:'자료 분석',body:{text:'응답을 분류한다.',styles:[{start:0,end:2,style:{underline:true}}]}}},
  {id:'conclude',spec:{kind:'text',variant:'paper',title:'결론 도출',body:{text:'가설을 검증한다.',styles:[{start:0,end:2,style:{underline:true}}]}}},
 ];
 const request={units:[
  makeUnit('table','table-root',[{id:'table-content',spec:{kind:'text',variant:'paper',body:'표 자료'}}]),
  makeUnit('bar','bar-root',[{id:'bar-content',spec:{kind:'text',variant:'paper',body:'막대 자료'}}]),
  makeUnit('curve','curve-root',[{id:'curve-content',spec:{kind:'text',variant:'paper',body:'곡선 자료'}}]),
  makeUnit('flowchart','flow-root',flowChildren,'row',{stageArrows:[{id:'collect-analyze',from:'collect',to:'analyze',widthMm:2.6,lengthMm:3.4},{id:'analyze-conclude',from:'analyze',to:'conclude',widthMm:2.6,lengthMm:3.4}]}),
 ]};
 const before=structuredClone(request),result=prepareTask(request);
 assert.deepEqual(request,before,'inference and review preserve the supplied native composition');
 const roots=result.resolved.filter(unit=>unit.id.endsWith('-root'));
 assert.deepEqual(roots.map(({recipe,type})=>[recipe,type]),[
  ['table','D1_Table'],['bar','D2_Chart'],['curve','D3_Graph'],['flowchart','D4_Diagram'],
 ]);
 assert.ok(roots.every(unit=>!unit.type.startsWith('IT')&&!unit.modules.includes('artwork')&&!unit.modules.includes('photo')));
 const paperChildren=result.resolved.filter(unit=>unit.recipe==='paper');
 assert.equal(paperChildren.length,6);
 assert.ok(paperChildren.every(unit=>unit.textMode==='prose'&&unit.type==='ITA_TypeSwap'));
 const flowTextChildren=paperChildren.filter(unit=>unit.id.startsWith('flow-root:native-'));
 assert.equal(flowTextChildren.length,3);
 assert.ok(flowTextChildren.every(unit=>unit.contains.includes('underline')));
 assert.ok(flowTextChildren.every(unit=>['frame','document','paper'].every(module=>unit.modules.includes(module))));
 const flowRoot=result.resolved.find(unit=>unit.id==='flow-root');
 assert.ok(flowRoot.modules.includes('node-diagram'));
 assert.ok(!flowRoot.modules.some(module=>['frame','document','paper'].includes(module)));
 assert.equal(Object.values(result.phaseSources).flat().filter(source=>source.path==='core/composition.md').length,1);
 assert.equal(result.inputReview.warnings.filter(w=>w.ruleId==='display-colon-spacing'&&w.path==='units[3].spec.children[0].spec.title').length,1);
 assert.equal(flowRoot.contains.includes('underline'),false,'child typography conditions stay scoped to child units');
 assert.equal(result.inputReview.blocking,false);
});
test('native formula requirements remain incompatible with composition and other root recipes',()=>{
 const formula={kind:'schematic',layout:'formula',formula:{items:[{kind:'text',text:'x'}]}};
 assert.throws(()=>prepare({recipe:'formula',spec:{kind:'composition',children:[{id:'formula',spec:formula}]}}),/recipe formula requires native schematic layout:formula/);
 assert.throws(()=>prepare({recipe:'flowchart',spec:formula}),/native schematic layout:formula conflicts with recipe flowchart/);
});
test('structured mappings support image-board variants and reject unsupported fields',()=>{
 const req={recipe:'paper',spec:{kind:'composition',layout:'column',children:[{id:'b',spec:{kind:'text',variant:'newspaper-wave',body:'자료'}}]},specRecipes:{'spec.children[0].spec':{recipe:'image-board',variant:'newspaper',people:false,dataSource:'provided'}}};
 const before=structuredClone(req),a=prepare(req);assert.deepEqual(req,before);assert.deepEqual(a,prepare(req));
 assert.equal(a.resolved[1].variant,'newspaper');assert.equal(a.resolved[1].people,false);
 assert.throws(()=>prepare({...req,specRecipes:{'spec.children[0].spec':{recipe:'image-board',unsupported:true}}}),/mapping requires/);
});
test('both actual newspaper variants infer child recipe and native inline-box style',()=>{
 for(const variant of ['newspaper-wave','newspaper-band']){
  const r=prepare({recipe:'paper',spec:{kind:'composition',layout:'column',children:[{id:'n',spec:{kind:'text',variant,body:{text:'\uFFFC',styles:{0:{0:{vectoraInlineBox:{label:'가',widthMm:3}}}}}}}]}});
  assert.equal(r.resolved[1].recipe,'newspaper');assert.ok(r.resolved[1].contains.includes('inline-box'));
  assert.ok(r.resolved[1].inference.some(x=>x.path.endsWith('.body.styles.0.0.vectoraInlineBox')));
 }
});

test('numeric native table merges resolve generic aliases to Nested at root and child',()=>{
 const root={recipe:'table',spec:{kind:'table',rows:[{id:'header'},{id:'value'}],columns:[{id:'student'},{id:'score'}],cells:[{rowId:'header',columnId:'student',colSpan:2,role:'header'}]}};
 const before=structuredClone(root),r=prepare(root);
 assert.deepEqual(root,before);
 assert.equal(r.resolved[0].subtype,'D1-04_Nested');
 assert.equal(r.resolved[0].recipe,'D1-04_Nested');
 assert.ok(r.resolved[0].inference.some(x=>x.path==='units[0].spec.cells[0].colSpan'&&x.inferred==='D1-04_Nested'));

 const child={recipe:'paper',spec:{kind:'composition',children:[{id:'merged',spec:{kind:'table',rows:[{id:'header'},{id:'value'}],columns:[{id:'student'},{id:'score'}],cells:[{rowId:'header',columnId:'student',rowSpan:2,role:'header'}]}}]},specRecipes:{'spec.children[0].spec':'table'}};
 const childBefore=structuredClone(child),nested=prepare(child);
 assert.deepEqual(child,childBefore);
 assert.equal(nested.resolved[1].subtype,'D1-04_Nested');
 assert.ok(nested.resolved[1].inference.some(x=>x.path==='units[0].spec.children[0].spec.cells[0].rowSpan'&&x.inferred==='D1-04_Nested'));
});

test('explicit table subtypes remain selected while merged cells retain Nested structural provenance',()=>{
 const spec={kind:'table',cells:[{rowId:'header',columnId:'student',colSpan:2,role:'header'}]};
 assert.equal(prepare({recipe:'D1-04_Nested',spec}).resolved[0].subtype,'D1-04_Nested');
 const flat=prepare({recipe:'D1-01_Flat',spec}).resolved[0];
 assert.equal(flat.subtype,'D1-01_Flat');
 assert.ok(flat.inference.some(x=>x.path==='units[0].spec.cells[0].colSpan'&&x.inferred==='D1-04_Nested'&&x.evidence?.structuralOnly===true));
 const cross=prepare({recipe:'paper',spec:{kind:'composition',children:[{spec}]},specRecipes:{'spec.children[0].spec':'D1-03_Cross'}}).resolved[1];
 assert.equal(cross.subtype,'D1-03_Cross');
 assert.ok(cross.inference.some(x=>x.path==='units[0].spec.children[0].spec.cells[0].colSpan'&&x.inferred==='D1-04_Nested'&&x.evidence?.structuralOnly===true));
 assert.throws(()=>prepare({recipe:'flowchart',spec}),/recipe flowchart is incompatible with native kind table/);
});

test('tables without numeric merged spans keep existing explicit and ambiguous selection behavior',()=>{
 const plain={kind:'table',rows:[{id:'r1'},{id:'r2'},{id:'r3'}],columns:[{id:'c1'},{id:'c2'},{id:'c3'}],diagonalHeader:true,cells:[{rowId:'r1',columnId:'c1',colSpan:'2',role:'header'}]};
 assert.equal(prepare({recipe:'table',spec:plain}).resolved[0].subtype,'D1-01_Flat');
 assert.equal(prepare({recipe:'D1-05_Checklist',spec:plain}).resolved[0].subtype,'D1-05_Checklist');
 assert.throws(()=>prepare({recipe:'paper',spec:{kind:'composition',children:[{spec:plain}]}}),/cannot uniquely select recipe.*specRecipes/);
});

test('dialogue execution contracts follow layout and native screen signals',()=>{
 for(const recipe of ['horizontal-dialogue','vertical-dialogue','presentation','teacher-board']){
  const result=prepare({recipe});
  assert.ok(result.resolved[0].modules.includes('dialogue-native'),recipe);
 }
 const board=prepare({recipe:'teacher-board'});
 assert.ok(board.phaseSources.execute.some(x=>x.path==='execution/modules/dialogue-native.md'));
 assert.ok(!board.resolved[0].modules.includes('bubble'));
 assert.ok(!prepare({recipe:'messenger'}).resolved[0].modules.includes('dialogue-native'));

 for(const field of ['presentationMode','mode']){
  const spec={kind:'dialogue',layout:'presentation',[field]:'screen',speakers:[{id:'s'}],turns:[{id:'t',text:'설명'}]};
  const result=prepare({recipe:'presentation',spec});
  assert.ok(result.resolved[0].modules.includes('dialogue-native'),field);
  assert.ok(result.resolved[0].modules.includes('presentation-screen-native'),field);
 }
});

test('screen mode alone does not select the presentation screen contract for horizontal or vertical dialogue',()=>{
 for(const layout of ['horizontal','vertical'])for(const field of ['presentationMode','mode']){
  const spec={kind:'dialogue',layout,[field]:'screen',speakers:[{id:'s'}],turns:[{id:'t',text:'설명'}]};
  const recipe=layout==='horizontal'?'horizontal-dialogue':'vertical-dialogue';
  const result=prepare({recipe,spec});
  assert.ok(!result.resolved[0].modules.includes('presentation-screen-native'),`${layout}.${field}`);
 }
});

test('screen presentation contracts cover ITA and ITB without leaking to web, scene or table units',()=>{
 for(const recipe of ['teacher-board','ITB-2_SoloImageBoard']){
  const result=prepare({recipe,variant:'screen'});
  assert.ok(result.resolved[0].modules.includes('presentation-screen-native'),recipe);
 }
 for(const unit of [
  {recipe:'screen'},
  {recipe:'image-board',variant:'screen'},
  {recipe:'scene'},
  {recipe:'original-person',variant:'presentation'},
  {recipe:'table'},
 ]){
  const result=prepare(unit);
  assert.ok(!result.resolved[0].modules.includes('dialogue-native'),unit.recipe);
  assert.ok(!result.resolved[0].modules.includes('presentation-screen-native'),unit.recipe);
 }
});

test('non-speaking people in web and image boards retain artwork support without speaker placement rules',()=>{
 for(const unit of [
  {recipe:'image-board',variant:'screen',people:true},
  {recipe:'webpage',contains:['people'],spec:{kind:'text',variant:'browser',body:'해녀 두 명 소개',layout:'presentation',mode:'screen'}},
  {recipe:'figure',variant:'screen',contains:['people']},
  {recipe:'original-person',variant:'screen',contains:['people']},
 ]){
  const result=prepare(unit),selected=result.resolved[0],sources=paths(result);
  assert.equal(selected.people,true,unit.recipe);
  for(const module of ['person-speech','person-spacing']){
   assert.ok(!selected.modules.includes(module),unit.recipe+':'+module);
   assert.ok(!sources.includes(`components/${module}.md`),unit.recipe+':'+module);
  }
  assert.ok(sources.includes('components/people.md'),unit.recipe);
  for(const module of ['artwork-asset','asset-runtime'])assert.ok(sources.includes(`execution/modules/${module}.md`),unit.recipe+':'+module);
  assert.equal(selected.modules.includes('artwork'),unit.recipe!=='original-person',unit.recipe);
 }
});

test('speaker placement rules remain for selected dialogue, presentation and ITC auxiliary speech',()=>{
 for(const unit of [
  {recipe:'image-board',variant:'screen',contains:['people','speech-solo']},
  {recipe:'ITB-2_SoloImageBoard',variant:'screen'},
  ...['horizontal-dialogue','vertical-dialogue','presentation','teacher-board'].map(recipe=>({recipe})),
  {recipe:'figure',variant:'horizontal'},
  {recipe:'original-person',variant:'presentation'},
  {recipe:'figure',variant:'screen',contains:['speech-solo']},
 ]){
  const selected=prepare(unit).resolved[0];
  for(const module of ['person-speech','person-spacing'])assert.ok(selected.modules.includes(module),unit.recipe+':'+module);
 }
});

test('native dialogue adds speaker placement only to its own unit in a composite image board',()=>{
 for(const layout of ['horizontal','vertical','presentation']){
  const dialogue={kind:'dialogue',layout,speakers:[{id:'s',assetId:'portrait'}],turns:[{speakerId:'s',text:'설명'}]};
  const direct=prepare({recipe:'image-board',variant:'screen',spec:dialogue});
  const composite=prepare({recipe:'image-board',variant:'screen',contains:['people'],spec:{kind:'composition',children:[{spec:dialogue}]}});
  for(const module of ['person-speech','person-spacing']){
   assert.ok(direct.resolved[0].modules.includes(module),layout+':'+module);
   assert.ok(!composite.resolved[0].modules.includes(module),layout+':parent:'+module);
   assert.ok(composite.resolved[1].modules.includes(module),layout+':child:'+module);
  }
 }
});

test('actual map label overlays contradict textMode none; point-only and metadata do not',()=>{
 const point={id:'p',kind:'point',anchor:{kind:'geographic',longitude:127,latitude:37}};
 const spec={kind:'map',overlays:[point,{id:'label',kind:'label',text:'서울',anchor:point.anchor}]};
 assert.throws(()=>prepare({recipe:'route-map',textMode:'none',spec}),/textMode:none.*overlays\[1\].text/);
 assert.doesNotThrow(()=>prepare({recipe:'route-map',textMode:'none',spec:{kind:'map',overlays:[point],metadata:{text:'무시'}}}));
 const r=prepare({recipe:'route-map',spec});assert.ok(r.resolved[0].modules.includes('map-points'));
});

test('invalid native newspaper alias is rejected explicitly',()=>{
 assert.throws(()=>prepare({recipe:'newspaper',spec:{kind:'text',variant:'newspaper',body:'본문'}}),/unsupported native text frame variant newspaper/);
});

test('explicit text-flow condition selects its execution module; ordinary prose does not',()=>{
 const requested=prepare({recipe:'newspaper',contains:['text-flow'],spec:{kind:'text',variant:'newspaper-wave',body:'일반 문단'}});
 assert.ok(requested.resolved[0].features.includes('text-flow'));
 assert.ok(requested.resolved[0].modules.includes('text-flow'));
 assert.ok(paths(requested).includes('execution/modules/text-flow.md'));
 assert.ok(requested.contents.execute.includes('현재 연결된 라이브 `vectora_apply` 스키마'));

 const plain=prepare({recipe:'newspaper',spec:{kind:'text',variant:'newspaper-wave',body:'일반 문단'}});
 assert.ok(!plain.resolved[0].contains.includes('text-flow'));
 assert.ok(!plain.resolved[0].modules.includes('text-flow'));
 assert.ok(!paths(plain).includes('execution/modules/text-flow.md'));
});

test('native TextFrameSpec.textFlow infers the condition with provenance and leaves the input untouched',()=>{
 const request={recipe:'newspaper',spec:{kind:'text',variant:'newspaper-wave',body:{text:'본문',widthMm:72,textFlow:{bodyFrame:{xMm:4,yMm:8,widthMm:72},obstacles:[{objectId:'live-photo-child',side:'left',marginMm:2}]}}}};
 const before=structuredClone(request),result=prepare(request);
 assert.deepEqual(request,before);
 assert.ok(!Object.hasOwn(request.spec.body,'textFlowBounds'));
 assert.ok(result.resolved[0].contains.includes('text-flow'));
 assert.ok(result.resolved[0].modules.includes('text-flow'));
 assert.ok(result.resolved[0].inference.some(x=>x.path==='units[0].spec.body.textFlow'&&x.condition==='native TextFrameSpec.textFlow'&&x.inferred==='text-flow'));
 assert.ok(paths(result).includes('execution/modules/text-flow.md'));
});

test('nested composition text-flow stays on its text child with the full native source path',()=>{
 const request={recipe:'paper',spec:{kind:'composition',layout:'column',children:[{id:'article',spec:{kind:'text',variant:'newspaper-band',body:{text:'문단',widthMm:64,textFlow:{bodyFrame:{xMm:2,yMm:3,widthMm:64},obstacles:[{objectId:'photo-child',side:'right',marginMm:1}]}}}}]}};
 const before=structuredClone(request),result=prepare(request);
 assert.deepEqual(request,before);
 assert.ok(!Object.hasOwn(request.spec.children[0].spec.body,'textFlowBounds'));
 assert.ok(!result.resolved[0].modules.includes('text-flow'));
 const child=result.resolved[1];
 assert.ok(child.contains.includes('text-flow'));
 assert.ok(child.modules.includes('text-flow'));
 assert.ok(child.inference.some(x=>x.path==='units[0].spec.children[0].spec.body.textFlow'&&x.inferred==='text-flow'));
 assert.equal(child.specPath,'units[0].spec.children[0].spec');
 assert.ok(paths(result).includes('execution/modules/text-flow.md'));
});

test('native browser owned-wrap infers text-flow; omitted and fixed-column asides do not',()=>{
 const browserSpec={kind:'text',variant:'browser',blocks:[{type:'text',id:'article-body',text:'기사 본문'}],aside:{layout:'wrap',anchorBlockId:'article-body'},background:{asideWidthMm:24}};
 const request={recipe:'webpage',spec:browserSpec},before=structuredClone(request),wrapped=prepare(request),selected=wrapped.resolved[0];
 assert.deepEqual(request,before);
 assert.ok(selected.contains.includes('text-flow'));
 assert.ok(selected.modules.includes('text-flow'));
 assert.ok(selected.inference.some(x=>x.path==='units[0].spec.aside.layout'&&x.condition==='native browser aside.layout === "wrap" with nonempty anchorBlockId'&&x.inferred==='text-flow'));
 assert.ok(paths(wrapped).includes('execution/modules/text-flow.md'));

 for(const aside of [undefined,{layout:'column',anchorBlockId:'article-body'},{layout:'wrap'}]){
  const spec={...browserSpec};
  if(aside===undefined)delete spec.aside;else spec.aside=aside;
  const result=prepare({recipe:'webpage',spec}),plain=result.resolved[0];
  assert.ok(!plain.contains.includes('text-flow'),aside?.layout??'omitted aside');
  assert.ok(!plain.modules.includes('text-flow'),aside?.layout??'omitted aside');
  assert.ok(!plain.inference.some(x=>x.inferred==='text-flow'),aside?.layout??'omitted aside');
 }
});

test('native browser owned-wrap text-flow remains scoped to a nested child',()=>{
 const request={recipe:'paper',spec:{kind:'composition',layout:'column',children:[{id:'browser',spec:{kind:'text',variant:'browser',blocks:[{type:'text',id:'article-body',text:'기사 본문'}],aside:{layout:'wrap',anchorBlockId:'article-body'},background:{asideWidthMm:24}}}]}};
 const before=structuredClone(request),result=prepare(request),parent=result.resolved[0],child=result.resolved[1];
 assert.deepEqual(request,before);
 assert.ok(!parent.contains.includes('text-flow'));
 assert.ok(!parent.modules.includes('text-flow'));
 assert.ok(child.contains.includes('text-flow'));
 assert.ok(child.modules.includes('text-flow'));
 assert.ok(child.inference.some(x=>x.path==='units[0].spec.children[0].spec.aside.layout'&&x.condition==='native browser aside.layout === "wrap" with nonempty anchorBlockId'&&x.inferred==='text-flow'));
});

test('timeline pin v1 and periods v1 infer only renderer-visible text in nested specs',()=>{
 const timeline={kind:'schematic',layout:'timeline',timeline:{version:1,spacing:'sequence',appearance:'pin',events:[
  {id:'event:one',time:'원래 시간',timeLabel:'시각',label:'사건'},
  {id:'event-two',time:'문자열 시간',label:'원인'},
  {id:'event-three',time:2030,label:'결과'},
 ]},metadata:{text:'숨김'},numericData:[42],rawProvenance:{text:'숨김'}};
 const periods={kind:'schematic',layout:'periods',periods:{version:1,spacing:'sequence',boundaries:[
  {id:'b0',time:'경계 시간',labelAfter:'구간'}, {id:'b1',time:25},
 ],rows:[{id:'row:id',label:'행',intervals:[{id:'interval:id',from:'b0',to:'b1',label:'기간'}]}]},metadata:{text:'숨김'}};
 const request={recipe:'paper',spec:{kind:'composition',layout:'column',children:[{id:'timeline',spec:timeline},{id:'periods',spec:periods}]},specRecipes:{
  'spec.children[0].spec':'flowchart','spec.children[1].spec':'flowchart',
 }};
 const before=structuredClone(request),result=inferSpec(request,'units[0]');
 assert.deepEqual(request,before,'selection inference preserves native source fields');
 const inferred=result.children.flatMap(child=>child.inference.provenance).filter(entry=>entry.inferred==='text').map(entry=>entry.path);
 assert.deepEqual(inferred,[
  'units[0].spec.children[0].spec.timeline.events[0].label',
  'units[0].spec.children[0].spec.timeline.events[0].timeLabel',
  'units[0].spec.children[0].spec.timeline.events[1].label',
  'units[0].spec.children[0].spec.timeline.events[1].time',
  'units[0].spec.children[0].spec.timeline.events[2].label',
  'units[0].spec.children[1].spec.periods.boundaries[0].labelAfter',
  'units[0].spec.children[1].spec.periods.rows[0].label',
  'units[0].spec.children[1].spec.periods.rows[0].intervals[0].label',
 ]);
});

test('timeline bands and malformed or unknown schematic time versions produce no text inference',()=>{
 const specs=[
  {kind:'schematic',layout:'timeline',timeline:{version:2,spacing:'sequence',events:[{id:'e',time:'시간',label:'사건'}]}},
  {kind:'schematic',layout:'timeline',timeline:{version:1,spacing:'sequence',appearance:'unknown',events:[{id:'a',time:'시간',label:'사건'},{id:'b',time:'시간',label:'사건'}]}},
  {kind:'schematic',layout:'timeline',timeline:{version:1,spacing:'sequence',appearance:'band',events:[{id:'e',time:'시간',label:'사건'}]}},
  {kind:'schematic',layout:'periods',periods:{version:2,spacing:'sequence',boundaries:[],rows:[{id:'r',label:'행',intervals:[]}]}},
  {kind:'schematic',layout:'periods',periods:{version:1,spacing:'sequence',boundaries:[{id:'b0',time:0},{id:'b1',time:1}],rows:[{id:'r',label:'행',intervals:[{id:'i',from:'missing',to:'b1',label:'기간'}]}]}},
  {kind:'schematic',layout:'periods',periods:{version:1,spacing:'sequence',strokePt:0,boundaries:[{id:'b0',time:0},{id:'b1',time:1}],rows:[{id:'r',label:'행',intervals:[{id:'i',from:'b0',to:'b1',label:'기간'}]}]}},
 ];
 for(const spec of specs){
  const inferred=inferSpec({recipe:'flowchart',spec},'units[0]');
  assert.deepEqual(inferred.provenance.filter(entry=>entry.inferred==='text'),[]);
 }
});

test('timeline band v1 infers times only when shown and never invents labels from numeric or missing times',()=>{
 const band={kind:'schematic',layout:'timeline',timeline:{version:1,spacing:'sequence',appearance:'band',showTimes:true,events:[
  {id:'a',time:0,timeLabel:'표시 시각',label:'시작'},
  {id:'b',time:'문자 시각',label:'중간'},
  {id:'c',label:'시간 생략'},
  {id:'d',time:2030,label:'숫자 시각'},
 ],intervals:[{id:'ab',from:'a',to:'b',label:'기간'}]}};
 const shown=inferSpec({recipe:'flowchart',spec:band},'units[0]');
 assert.deepEqual(shown.provenance.filter(entry=>entry.inferred==='text').map(entry=>entry.path),[
  'units[0].spec.timeline.events[0].label',
  'units[0].spec.timeline.events[0].timeLabel',
  'units[0].spec.timeline.events[1].label',
  'units[0].spec.timeline.events[1].time',
  'units[0].spec.timeline.events[2].label',
  'units[0].spec.timeline.events[3].label',
  'units[0].spec.timeline.intervals[0].label',
 ]);

 const hidden=structuredClone(band);hidden.timeline.showTimes=false;
 const hiddenResult=inferSpec({recipe:'flowchart',spec:hidden},'units[0]');
 assert.deepEqual(hiddenResult.provenance.filter(entry=>entry.inferred==='text').map(entry=>entry.path),[
  'units[0].spec.timeline.events[0].label',
  'units[0].spec.timeline.events[1].label',
  'units[0].spec.timeline.events[2].label',
  'units[0].spec.timeline.events[3].label',
  'units[0].spec.timeline.intervals[0].label',
 ]);
});
