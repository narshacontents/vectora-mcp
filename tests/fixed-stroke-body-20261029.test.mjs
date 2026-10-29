import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildFixedStyle,exampleContent,listFixedStyles} from '../skills/create-kice-illustration/scripts/fixed_styles.mjs';
const build=(styleID,widthMm)=>buildFixedStyle({styleID,content:exampleContent(styleID),...(widthMm?{widthMm}:{})});
const asset=id=>JSON.parse(readFileSync(new URL(`../skills/create-kice-illustration/assets/fixed-styles/${id}.json`,import.meta.url)));
test('core criticism/judgment strokes become 0.4pt; side panels retain their existing weight',()=>{
 for(const id of ['criticism-2.v1','criticism-3.v1','judgment-2.v1','judgment-3.v1'])for(const width of [undefined,100,108]){
  const b=build(id,width),core=b.parts.find(p=>p.id==='core').spec;
  assert.ok(core.frameDecorations.length>0);assert.ok(core.frameDecorations.every(p=>p.strokePt===.4));
  function side(s){if(s.legendFrame)assert.equal(s.legendFrame.strokePt,.3);for(const p of s.frameDecorations??[])assert.equal(p.strokePt,.3);for(const c of s.children??[])if(c.spec)side(c.spec);}
  for(const p of b.parts.filter(p=>['legend','example'].includes(p.id)))side(p.spec);
 }
});
test('document label ink centers target the flat body above the actual cubic at 90/96/100/108mm',()=>{
 for(const id of ['judgment-2.v1','judgment-3.v1'])for(const widthMm of [90,96,100,108]){
  const core=build(id,widthMm).parts.find(p=>p.id==='core').spec,positions=new Map();
  function height(s){const hs=(s.children??[]).map(c=>c.reserve?.heightMm??(c.spec?height(c.spec):c.text?.includes('\n')?6.858:3.189111111111111));return s.layout==='row'?Math.max(0,...hs):hs.reduce((a,b)=>a+b,0);}
  function walk(s,y=0){let cursor=y;for(const c of s.children??[]){if(c.id?.startsWith('slot-'))positions.set(c.id,cursor);if(c.spec)walk(c.spec,s.layout==='column'?cursor:y);if(s.layout==='column')cursor+=c.reserve?.heightMm??(c.spec?height(c.spec):0);}}
  walk(core);
  for(const n of asset(id).nodes.filter(n=>n.shape==='document')){
   const path=core.frameDecorations.find(p=>p.id===`node-${n.id}`),start=path.path[0].y.offsetMm,curve=path.path.find(p=>p.command==='C');
   let min=Infinity;const a=path.path[2].y.offsetMm,c1=curve.control1.y.offsetMm,c2=curve.control2.y.offsetMm,end=curve.y.offsetMm;
   for(let i=0;i<=10000;i++){const u=i/10000;min=Math.min(min,(1-u)**3*a+3*(1-u)**2*u*c1+3*(1-u)*u*u*c2+u**3*end);}
   const actualInkCenter=positions.get(`slot-${n.id}`)+1.602555794687379;
   assert.ok(Math.abs(actualInkCenter-(start+min)/2)<1e-6,`${id}/${widthMm}/${n.id}: body center`);
   assert.ok(actualInkCenter<start+n.heightMm*widthMm/108/2-.5);
  }
 }
});
test('misc changes only authored 0.3pt core strokes, preserving operators, decorative details and path commands',()=>{
 for(const {styleID} of listFixedStyles().filter(s=>s.family==='misc')){
  const original=asset(styleID),b=build(styleID);
  assert.deepEqual(b.spec.frameDecorations.map(p=>p.strokePt),original.decorations.map(p=>p.strokePt===.3?.4:p.strokePt));
  assert.deepEqual(b.spec.frameDecorations.map(p=>p.path.map(c=>c.command)),original.decorations.map(p=>p.path.map(c=>c.command)));
  for(let i=0;i<original.decorations.length;i++)for(const k of ['fill','stroke','layer'])assert.equal(b.spec.frameDecorations[i][k],original.decorations[i][k]);
 }
});
test('Venn hatch/core declarations remain unchanged',()=>{
 const venn=build('venn-2-hatch.v1').parts.find(p=>p.id==='core').spec;
 assert.equal(venn.strokePt,asset('venn-2-hatch.v1').native.strokePt);
 assert.deepEqual(venn.regionPatterns,asset('venn-2-hatch.v1').native.regionPatterns);
});
