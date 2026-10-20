import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const paths=result=>Object.values(result.phaseSources).flat().map(source=>source.path);

function sceneSpec(dataRegions){
 return {kind:'dialogue',layout:'horizontal',speakers:[],turns:[],sharedScene:{artwork:{assetId:'reviewed-scene',speakers:[],dataRegions}}};
}

test('shared-scene table and graph get independent routing while a plain unit stays with dialogue',()=>{
 const request={units:[{recipe:'horizontal-dialogue',specRecipes:{'spec.sharedScene.artwork.dataRegions[0].spec':'table'},spec:sceneSpec([
  {id:'table',bounds:{x:4,y:5,width:120,height:64},spec:{kind:'table',rows:[],columns:[],cells:[]}},
  {id:'graph',bounds:{x:140,y:5,width:120,height:64},spec:{kind:'graph',type:'bar',unit:'천 명',series:[{id:'population',label:'인구',values:[3]}]}},
  {id:'unit',bounds:{x:4,y:80,width:100,height:20},text:'단위: 만 명'},
  {id:'worksheet-frame',bounds:{x:110,y:80,width:120,height:36},spec:{kind:'text',variant:'worksheet',blocks:[{type:'reserve',reserve:{heightMm:6}}]}},
 ])}]};
 const before=structuredClone(request),result=prepareTask(request);
 assert.deepEqual(request,before,'inference leaves caller-owned specs unchanged');
 assert.deepEqual(result.resolved.map(unit=>unit.recipe),['horizontal-dialogue','table','bar','worksheet']);
 assert.deepEqual(result.resolved.slice(1).map(unit=>unit.specPath),[
  'units[0].spec.sharedScene.artwork.dataRegions[0].spec',
  'units[0].spec.sharedScene.artwork.dataRegions[1].spec',
  'units[0].spec.sharedScene.artwork.dataRegions[3].spec',
 ]);
 const dialogue=result.resolved[0],graph=result.resolved[2],worksheet=result.resolved[3];
 assert.ok(dialogue.inference.some(item=>item.path==='units[0].spec.sharedScene.artwork.dataRegions[2].text'&&item.inferred==='text'));
 assert.ok(graph.inference.some(item=>item.path==='units[0].spec.sharedScene.artwork.dataRegions[1].spec.unit'&&item.inferred==='text'));
 assert.ok(worksheet.contains.includes('reserve'));
 assert.ok(worksheet.inference.some(item=>item.path.endsWith('.blocks[0].reserve')&&item.inferred==='reserve'));
 assert.ok(!result.resolved.some(unit=>unit.specPath?.endsWith('dataRegions[2].spec')),'frame-free text creates no media-frame recipe');
 assert.ok(!result.resolved.some(unit=>unit.recipe==='newspaper'));
 assert.ok(paths(result).includes('core/reserve.md'));

 const ambiguous=structuredClone(request);delete ambiguous.units[0].specRecipes;
 assert.throws(()=>prepareTask(ambiguous),/dataRegions\[0\]\.spec.*cannot uniquely select recipe.*specRecipes/);
});

test('nested region compositions retain rich-label text and markup in their surrounding binding',()=>{
 const request={units:[{recipe:'horizontal-dialogue',spec:sceneSpec([{id:'caption',bounds:{x:8,y:12,width:90,height:30},spec:{kind:'composition',children:[
  {id:'nested',spec:{kind:'composition',children:[{id:'unit-label',text:'(가) 단위',richText:{text:'(가) 단위',underlines:[{start:0,end:3}],inlineBoxes:[{at:0,label:'가',widthMm:5}]}}]}},
 ]}}])}]};
 const before=structuredClone(request),result=prepareTask(request),dialogue=result.resolved[0];
 assert.deepEqual(request,before,'nested inference does not mutate source text or rich-text runs');
 assert.equal(result.resolved.length,1,'frame-free composition labels do not get arbitrary recipes');
 const provenance=dialogue.inference.map(item=>JSON.stringify(item));
 assert.equal(new Set(provenance).size,provenance.length,'nested unbound content is recorded once in provenance');
 assert.ok(dialogue.contains.includes('underline'));
 assert.ok(dialogue.contains.includes('inline-box'));
 for(const path of [
  'units[0].spec.sharedScene.artwork.dataRegions[0].spec.children[0].spec.children[0].text',
  'units[0].spec.sharedScene.artwork.dataRegions[0].spec.children[0].spec.children[0].richText.text',
  'units[0].spec.sharedScene.artwork.dataRegions[0].spec.children[0].spec.children[0].richText.underlines',
  'units[0].spec.sharedScene.artwork.dataRegions[0].spec.children[0].spec.children[0].richText.inlineBoxes',
 ])assert.ok(dialogue.inference.some(item=>item.path===path),path);
 assert.ok(paths(result).includes('core/underline.md'));
 assert.ok(paths(result).includes('core/inline-box.md'));

 const contradictory=structuredClone(request);contradictory.units[0].textMode='none';
 assert.throws(()=>prepareTask(contradictory),/textMode:none.*dataRegions\[0\].spec.children\[0\].spec.children\[0\].text/);
});

test('a recipe mapping aimed at frame-free region text remains unused',()=>{
 const request={units:[{recipe:'horizontal-dialogue',specRecipes:{'spec.sharedScene.artwork.dataRegions[0].spec':'newspaper'},spec:sceneSpec([
  {id:'unit',bounds:{x:2,y:2,width:80,height:20},text:'단위: 명'},
 ])}]};
 assert.throws(()=>prepareTask(request),/Unused specRecipes mapping: spec\.sharedScene\.artwork\.dataRegions\[0\]\.spec/);
});
