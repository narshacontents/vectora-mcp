import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {buildFixedStyle,listFixedStyles,exampleContent,assertFixedGeometry,preflightFixedStyle,compareNativeFixedStyleGeometry} from '../skills/create-kice-illustration/scripts/fixed_styles.mjs';

const build=id=>buildFixedStyle({styleID:id,content:exampleContent(id)});
const baseIDs=['criticism-2.v1','criticism-3.v1','judgment-2.v1','judgment-3.v1','venn-2-hatch.v1'];
const styles=listFixedStyles().filter(s=>baseIDs.includes(s.styleID));
const main=b=>b.parts.find(p=>p.id==='core').spec;
function changed(id) {
  const c=exampleContent(id);
  if(c.people){c.people=c.people.map((_,i)=>['X','Y','Z'][i]);c.relations=c.relations.map((_,i)=>String(i+1));c.legend=['방향 표지','기호 뜻'];c.exampleCaption='출발 기호를 따라\n도착 관계를 확인한다.';}
  else if(c.start){c.start='새로운 조건을\n순서대로 판단한다.';c.decisions=c.decisions.map((_,i)=>String(i+1));c.conclusions=c.conclusions.map((_,i)=>`판정 ${i+1}`);c.yes='참';c.no='거짓';c.legend=['첫 단계','판단','이동','종착'];}
  else {c.setLabels=['X','Y'];c.regions=['1','2','3'];c.legend=['왼쪽 단독','두 집합 공통','오른쪽 단독'];}
  return c;
}
test('five base architectures remain registered, no photo/map/graph catch-all',()=>{
  assert.deepEqual(styles.map(s=>s.styleID),['criticism-2.v1','criticism-3.v1','judgment-2.v1','judgment-3.v1','venn-2-hatch.v1']);
  for(const id of ['DUP027','photo','map','bar','venn-3','judgment'])assert.throws(()=>build(id),/unknown styleID/);
});
for(const {styleID} of styles) {
  test(`${styleID}: all slots change without changing declared geometry or topology`,()=>{
    const original=build(styleID),variant=buildFixedStyle({styleID,content:changed(styleID)});
    assert.notDeepEqual(original.spec,variant.spec);
    assert.deepEqual(original.geometry,variant.geometry);
    assert.equal(original.geometrySignature,variant.geometrySignature);
    assert.equal(assertFixedGeometry(variant),true);
  });
  test(`${styleID}: deep immutability and recompiled content ownership`,()=>{
    const input={styleID,content:exampleContent(styleID)},bundle=buildFixedStyle(input);
    input.content.legend[0]='after compilation';
    assert.notEqual(bundle.content.legend[0],input.content.legend[0]);
    assert.throws(()=>bundle.spec.children[0].widthMm=10,TypeError);
    assert.throws(()=>bundle.geometry.spec.children.pop(),TypeError);
    const copy=structuredClone(bundle);copy.spec.children[0].widthMm--;
    assert.throws(()=>assertFixedGeometry(copy),/override detected/);
    const duplicate=structuredClone(bundle);duplicate.parts[0].spec.extra=true;
    assert.throws(()=>assertFixedGeometry(duplicate),/override detected/);
  });
  test(`${styleID}: cardinality, unknown geometry overrides, literal line counts reject`,()=>{
    const content=exampleContent(styleID),list=content.people?'people':content.start?'decisions':'setLabels';
    assert.throws(()=>buildFixedStyle({styleID,content:{...content,[list]:[]}}),/exactly/);
    assert.throws(()=>buildFixedStyle({styleID,content:{...content,widthMm:90}}),/allowed keys/);
    assert.equal(buildFixedStyle({styleID,content,widthMm:100}).widthMm,100);
    assert.throws(()=>buildFixedStyle({styleID,content,widthMm:10}),/widthMm/);
    assert.throws(()=>buildFixedStyle({styleID,content,scale:.8}),/allowed keys/);
    assert.throws(()=>buildFixedStyle({styleID,content:{...content,legend:content.legend.map(()=> 'bad\nwrap')}}),/exactly 1 line/);
  });
}
test('criticism: detached arrow pairs preserve six directions without crossing the top circle channel',()=>{
  const b=build('criticism-3.v1'),s=main(b),paths=s.frameDecorations;
  assert.deepEqual(b.geometry.topology.map(e=>[e.id,e.from,e.to]),[['relation1','p1','p2'],['relation2','p2','p1'],['relation3','p3','p2'],['relation4','p2','p3'],['relation5','p3','p1'],['relation6','p1','p3']]);
  const scale=(b.widthMm-40)/68;
  const circles=[[28.85,10.85,9.25],[10.85,38.85,9.25],[46.85,38.85,9.25]].map(v=>v.map(n=>n*scale));
  const segments=[];
  for(let i=1;i<=6;i++){
    const p=paths.find(p=>p.id===`relation${i}-shaft`).path;
    const v=p.map(c=>[c.x.offsetMm,c.y.offsetMm]);segments.push(v);
    for(const [x,y] of v)for(const [cx,cy,r] of circles)assert.ok(Math.hypot(x-cx,y-cy)>r+scale,'detached endpoint must clear every circle');
  }
  const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
    const [a,b]=segments[i],[c,d]=segments[j];
    assert.ok(!(orient(a,b,c)*orient(a,b,d)<0&&orient(c,d,a)*orient(c,d,b)<0),'independent arrows may not cross');
  }
});
test('judgment: flat source-ratio diamonds, S-wave documents, and both legend arrow samples',()=>{
  for(const n of [2,3]){
    const b=build(`judgment-${n}.v1`),s=main(b),paths=s.frameDecorations;
    assert.equal(paths.filter(p=>/^node-q/.test(p.id)).length,n+1);
    const diamond=paths.find(p=>p.id==='node-q1').path;
    const xs=diamond.map(c=>c.x.offsetMm),ys=diamond.map(c=>c.y.offsetMm);
    assert.ok(Math.max(...ys)-Math.min(...ys)<=7.4);
    assert.ok((Math.max(...xs)-Math.min(...xs))/(Math.max(...ys)-Math.min(...ys))>3);
    for(const doc of paths.filter(p=>/^node-r/.test(p.id))){
      assert.ok(doc.path.some(c=>c.command==='C'));
      const curve=doc.path.find(c=>c.command==='C');
      assert.ok(curve.control1.y.offsetMm<curve.y.offsetMm&&curve.control2.y.offsetMm>curve.y.offsetMm);
    }
    const legend=b.parts.find(p=>p.id==='legend').spec;
    assert.equal(legend.legendFrame.title,'〈범례〉');
    const arrowPaths=legend.children[2].spec.children[0].spec.frameDecorations;
    assert.ok(arrowPaths.some(p=>p.id==='solid-shaft'));
    assert.ok(arrowPaths.some(p=>p.id==='dashed-shaft'&&p.path.filter(c=>c.command==='M').length>1));
    assert.equal(b.geometry.topology.filter(e=>e.dashed).length,n-1);
  }
});
test('venn: semantic A/AB/B maps left/shared/right; no content-driven native legend optimizer',()=>{
  const s=main(build('venn-2-hatch.v1'));
  assert.deepEqual(s.regions,{A:'A',AB:'B',B:'C'});
  assert.deepEqual(Object.values(s.regionPatterns).map(p=>p.type),['rightDiagonal','crossDiagonal','leftDiagonal']);
  assert.equal(s.sets,2);assert.equal(s.setShape.type,'ellipse');assert.equal(s.widthPolicy,'total-v1');
  assert.equal(s.legend,undefined);
});
test('all base legends share content-sized closed-frame contract, never an authored title gap',()=>{
  for(const {styleID} of styles){
    const b=build(styleID),legend=b.parts.find(p=>p.id==='legend').spec;
    assert.deepEqual(legend.legendFrame,{title:'〈범례〉',paddingMm:1.2,titlePaddingMm:.25,strokePt:.3,...(styleID.startsWith('criticism')?{contentAlign:'center'}:{})});
    assert.equal(legend.frameDecorations,undefined);
    assert.equal(legend.maxHeightMm,undefined);
    assert.ok(b.widthMm<108);
    const larger=buildFixedStyle({styleID,widthMm:108,content:exampleContent(styleID)});
    assert.equal(larger.styleID,b.styleID);assert.notEqual(larger.geometrySignature,b.geometrySignature);
    assert.equal(assertFixedGeometry(larger),true);
    const strokeValues=x=>JSON.stringify(x).match(/"strokePt":([0-9.]+)/g);
    assert.deepEqual(strokeValues(b.spec),strokeValues(larger.spec));
    assert.ok(!JSON.stringify(b.spec).includes('"scaleX"'));
  }
});
test('judgment legends stay beyond the complete vector extent at every supported width',()=>{
  for(const styleID of ['judgment-2.v1','judgment-3.v1'])for(const widthMm of [90,96,108]){
    const b=buildFixedStyle({styleID,widthMm,content:exampleContent(styleID)});
    const [core,legend]=b.spec.children;
    const right=Math.max(...core.spec.frameDecorations.flatMap(p=>p.path.flatMap(c=>[c.x?.offsetMm,c.control1?.x?.offsetMm,c.control2?.x?.offsetMm].filter(Number.isFinite))));
    assert.ok(core.widthMm>right+.05,'the independent core includes its actual vector marks');
    assert.equal(b.spec.gapMm,1);
    assert.ok(Math.abs(core.widthMm+b.spec.gapMm+legend.widthMm-widthMm)<1e-8);
  }
});
test('preflight rejects measured overflow rather than changing geometry or typography',async()=>{
  const b=build('judgment-2.v1'),signature=b.geometrySignature;
  await assert.rejects(preflightFixedStyle(b,async s=>({widthMm:s.widthMm,heightMm:100,layout:{nodes:s.nodes?.map(n=>({id:n.id,lineCount:10,requiredHeightMm:100,minSingleLineWidthMm:200}))}})),/fixed row height|does not fit/);
  assert.equal(b.geometrySignature,signature);
  await assert.rejects(preflightFixedStyle(b,async()=>({})),/measurement unavailable/);
});
test('CLI lists actual styles and compiles examples without side effects',()=>{
  const script=fileURLToPath(new URL('../skills/create-kice-illustration/scripts/fixed_styles.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[script,'--list'],{encoding:'utf8'});
  assert.equal(result.status,0);assert.deepEqual(JSON.parse(result.stdout),listFixedStyles());
  const invalid=spawnSync(process.execPath,[script,'--example','map'],{encoding:'utf8'});
  assert.equal(invalid.status,1);assert.match(invalid.stderr,/unknown styleID/);
});
test('native comparator catches moved paths and scaled text despite identical source specs',()=>{
  const before={objects:[{id:'a',type:'Path',productionKey:'shape',scaleX:1,scaleY:1},{id:'t',type:'Textbox',text:'A',fontSize:10.666,scaleX:1,scaleY:1}],geometry:[{id:'a',geometry:{xMm:1,yMm:2,widthMm:3,heightMm:4},paint:{xMm:1,yMm:2,widthMm:3,heightMm:4}}],pathNodes:[{id:'a',nodes:[{point:{x:1,y:2}}],subpaths:[]}]};
  const after=structuredClone(before);after.objects[0].id='new';after.geometry[0].id='new';after.pathNodes[0].id='new';after.objects[1].text='B';
  assert.equal(compareNativeFixedStyleGeometry(before,after).equal,true);
  after.pathNodes[0].nodes[0].point.x+=.2;
  assert.equal(compareNativeFixedStyleGeometry(before,after).equal,false);
  after.pathNodes[0].nodes[0].point.x-=.2;after.objects[1].scaleX=.9;
  assert.equal(compareNativeFixedStyleGeometry(before,after).equal,false);
});
const nativeEvidence=process.env.FIXED_STYLE_NATIVE_EVIDENCE;
for(const {styleID} of styles)test(`${styleID}: actual native variant and independent reopen geometry`,{skip:!nativeEvidence},()=>{
  const read=(kind,name)=>JSON.parse(readFileSync(join(nativeEvidence,`${styleID}-${kind}`,name),'utf8'));
  assert.deepEqual(read('base','request.json').spec,build(styleID).spec,'native evidence must match the current helper');
  assert.notDeepEqual(read('base','request.json').spec,read('variant','request.json').spec,'variant must really change content');
  for(const kind of ['base','variant']){
    const proof=read(kind,'verification.json');assert.equal(proof.technicalPass,true);
    const comparison=compareNativeFixedStyleGeometry(read(kind,'inspect.json'),read(kind,'reopened.json'));
    assert.equal(comparison.equal,true,JSON.stringify(comparison.differences));
  }
  const comparison=compareNativeFixedStyleGeometry(read('base','reopened.json'),read('variant','reopened.json'));
  assert.ok(comparison.structuralObjects>0&&comparison.textObjects>0);
  assert.equal(comparison.equal,true,JSON.stringify(comparison.differences));
});

test('paired criticism frames negotiate content width and center complete rows',()=>{
 for(const id of ['criticism-2.v1','criticism-3.v1']){const b=build(id),stack=b.spec.children.find(c=>c.id==='aside').spec;
 assert.equal(stack.sharedWidth,'max-content');assert.ok(stack.children.every(c=>c.spec.legendFrame.contentAlign==='center'));
 const mini=b.parts.find(p=>p.id==='example').spec.children.find(c=>c.id==='mini');assert.equal(mini.widthMm,22);
 }
});
