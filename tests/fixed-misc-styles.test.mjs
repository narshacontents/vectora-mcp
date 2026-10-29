import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listStyles,exampleContent,buildStyle,assertGeometry,preflight} from '../skills/create-kice-illustration/scripts/fixed-style-families/misc.mjs';
const asset=id=>JSON.parse(readFileSync(new URL(`../skills/create-kice-illustration/assets/fixed-styles/${id}.json`,import.meta.url),'utf8'));
const build=(id,content=exampleContent(id),widthMm)=>buildStyle({styleID:id,content,...(widthMm===undefined?{}:{widthMm})});
const catalog=listStyles();
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/fixed-misc-content.json',import.meta.url),'utf8'));
function assertNativeChildWidths(spec) { for(const child of spec.children??[]) { if(child.widthMm!==undefined)assert.ok(child.widthMm>=1&&child.widthMm<=108,`${child.id}: child width ${child.widthMm} outside native 1–108mm bounds`);if(child.spec)assertNativeChildWidths(child.spec); } }
test('seven discrete source groups and the exact public bundle contract',()=>{
  assert.deepEqual(catalog.map(s=>s.sourceGroup),['DUP010','DUP011','DUP012','DUP017','DUP018','DUP026','DUP030']);
  assert.equal(new Set(catalog.map(s=>s.styleID)).size,7);
  const defaults={'form-argument-2line.v1':95,'form-argument-1line.v1':99,'form-ab-links.v1':89.5,'form-question-2circle.v1':88,'form-nested-rect.v1':72,'form-timeline-5.v1':100,'form-phone-6line.v1':47};
  for(const{styleID,defaultWidthMm,estimatedPrintWidthMm,minWidthMm,maxWidthMm}of catalog){let b=build(styleID);assert.deepEqual(Object.keys(b).sort(),['styleID','content','spec','parts','geometry','geometrySignature','requiresNativePreflight','recipe'].sort());assert.equal(defaultWidthMm,defaults[styleID]);assert.equal(estimatedPrintWidthMm,defaultWidthMm);assert.equal(maxWidthMm,108);assert.ok(minWidthMm<defaultWidthMm&&defaultWidthMm<maxWidthMm);assert.equal(b.spec.widthMm,defaultWidthMm);assert.equal(b.geometry.widthMm,defaultWidthMm);assert.equal(b.spec.kind,'composition');assert.equal(b.requiresNativePreflight,true);assert.equal(b.recipe,asset(styleID).recipe);}
  assert.throws(()=>build('DUP010'),/unknown styleID/);
});
for(const{styleID}of catalog){
 test(`${styleID}: changed slots retain all geometry, line counts and formatting`,()=>{const a=build(styleID,fixtures[styleID].base),b=build(styleID,fixtures[styleID].variant);assert.notDeepEqual(a.content,b.content);assert.notDeepEqual(a.spec,b.spec);assert.deepEqual(a.geometry,b.geometry);assert.equal(a.geometrySignature,b.geometrySignature);assert.equal(assertGeometry(b),true);assert.equal(a.parts.length,asset(styleID).slots.length+asset(styleID).fixedText.length);});
 test(`${styleID}: deep immutability and all output fields are checked`,()=>{let c=exampleContent(styleID),b=build(styleID,c);c[Object.keys(c)[0]]='outside mutation';assert.notEqual(b.content[Object.keys(c)[0]],c[Object.keys(c)[0]]);assert.throws(()=>b.spec.widthMm=1,TypeError);for(let field of['spec','parts','geometry','geometrySignature','requiresNativePreflight','recipe']){let m=structuredClone(b);if(field==='spec')m.spec.frameDecorations[0].strokePt=2;else if(field==='parts')m.parts[0].expectedHeightMm+=1;else if(field==='geometry')m.geometry.sourceGroup='other';else m[field]=null;assert.throws(()=>assertGeometry(m),/override detected/);}});
 test(`${styleID}: exact content and request keys still reject invalid literals and sizes`,()=>{let c=exampleContent(styleID),s=asset(styleID).slots[0],limits=catalog.find(v=>v.styleID===styleID);assert.throws(()=>buildStyle({styleID,content:c,widthMm:1}),/between/);assert.throws(()=>buildStyle({styleID,content:c,unexpected:true}),/widthMm is optional/);assert.throws(()=>build(styleID,{...c,widthMm:90}),/allowed keys/);let m=structuredClone(c);delete m[s.id];assert.throws(()=>build(styleID,m),/allowed keys/);m=structuredClone(c);m[s.id]='';assert.throws(()=>build(styleID,m),/literal|exactly/);for(let slot of asset(styleID).slots){let v=structuredClone(c);v[slot.id]=slot.items?['A']:Array(slot.lines+1).fill('text').join('\n');assert.throws(()=>build(styleID,v),/exactly/);}assert.equal(build(styleID,c,limits.minWidthMm).geometry.widthMm,limits.minWidthMm);assert.equal(build(styleID,c,limits.maxWidthMm).geometry.widthMm,108);for(const widthMm of [limits.minWidthMm-.1,limits.maxWidthMm+.1,null,NaN,Infinity,'90'])assert.throws(()=>build(styleID,c,widthMm),/between/);});
 test(`${styleID}: default, smaller and larger widths preserve topology, 8pt text and stroke`,async()=>{
  const source=asset(styleID),limits=catalog.find(v=>v.styleID===styleID),smallWidth=Math.max(limits.minWidthMm+.1,limits.defaultWidthMm-5),widths=[limits.defaultWidthMm,limits.minWidthMm,smallWidth,limits.defaultWidthMm+5,limits.maxWidthMm];
  assert.ok(smallWidth<limits.defaultWidthMm);const baseContent=fixtures[styleID].base,variantContent=fixtures[styleID].variant,bundles=[];
   for(const width of widths){const a=build(styleID,baseContent,width),b=build(styleID,variantContent,width);bundles.push(a);assert.equal(a.spec.widthMm,width);assert.ok(a.geometry.heightMm>0);assert.deepEqual(a.geometry,b.geometry);assert.equal(a.geometrySignature,b.geometrySignature);assert.equal(assertGeometry(b),true);assertNativeChildWidths(a.spec);assert.deepEqual(a.spec.frameDecorations.map(d=>d.path.map(p=>p.command)),source.decorations.map(d=>d.path.map(p=>p.command)));assert.deepEqual(a.spec.frameDecorations.map(d=>d.strokePt),source.decorations.map(d=>d.strokePt===.3?.4:d.strokePt));if(styleID==='form-timeline-5.v1'){const gaps=[];const collect=s=>{if(s.layout==='row'&&s.gapMm>0)gaps.push(s.gapMm);for(const child of s.children??[])if(child.spec)collect(child.spec);};collect(a.spec);assert.equal(gaps.length,width<108?1:0);for(const gap of gaps)assert.ok(Math.abs(gap-width/source.widthMm)<=1.1e-9);}for(let p of a.parts){const sourceSlot=[...source.slots,...source.fixedText].find(s=>s.id===p.id);assert.equal(p.spec.children[0].richText.fontPt,sourceSlot.fontPt);assert.equal(p.lineCount,sourceSlot.lines);} }
  assert.notEqual(bundles[0].geometrySignature,bundles[1].geometrySignature);assert.notEqual(bundles[0].geometrySignature,bundles.at(-1).geometrySignature);
  for(const b of bundles){const parts=new Map(b.parts.map(p=>[JSON.stringify(p.spec),p]));const planner=async s=>{const p=parts.get(JSON.stringify(s));return p?{heightMm:p.expectedHeightMm,widthMm:p.maxWidthMm,warnings:[]}:{heightMm:b.geometry.heightMm,widthMm:b.geometry.widthMm,boundsMm:{widthMm:b.geometry.widthMm},warnings:[]};};assert.equal((await preflight(b,planner)).status,'passed');await assert.rejects(preflight(b,async s=>{const plan=await planner(s);return JSON.stringify(s)===JSON.stringify(b.spec)?{...plan,widthMm:b.geometry.widthMm+1}:plan;}),/fixed geometry/);}
 });
 test(`${styleID}: native preflight cannot silently accept overflow, unavailable metrics, or complete bounds drift`,async()=>{let b=build(styleID),parts=new Map(b.parts.map(p=>[JSON.stringify(p.spec),p]));let planner=async s=>{let p=parts.get(JSON.stringify(s));return p?{heightMm:p.expectedHeightMm,widthMm:p.maxWidthMm,warnings:[]}:{heightMm:b.geometry.heightMm,widthMm:b.geometry.widthMm,boundsMm:{widthMm:b.geometry.widthMm},warnings:[]};};assert.equal((await preflight(b,planner)).status,'passed');await assert.rejects(preflight(b,async s=>({...await planner(s),heightMm:100})),/fixed line count|fixed geometry/);await assert.rejects(preflight(b,async()=>({})),/measurement unavailable/);await assert.rejects(preflight(b,async s=>{let r=await planner(s);return JSON.stringify(s)===JSON.stringify(b.spec)?{...r,boundsMm:{widthMm:1000}}:r;}),/fixed geometry/);});
}
test('source architectures keep their distinctive shells and connection roles',()=>{
 const a=asset('form-argument-2line.v1'),b=asset('form-argument-1line.v1');assert.equal(a.slots.find(s=>s.id==='conclusion').lines,2);assert.equal(b.slots.find(s=>s.id==='conclusion').lines,1);for(let t of[a,b])for(let id of['major-label','minor-label','conclusion-label','plus-horizontal','plus-vertical','conclusion-arrow-tip','blank-rule'])assert.ok(t.decorations.find(d=>d.id===id));
 const ab=asset('form-ab-links.v1');assert.equal(ab.decorations.filter(d=>d.id.startsWith('box-')).length,3);assert.ok(ab.decorations.every(d=>!d.id.includes('tip')));
 const q=asset('form-question-2circle.v1');assert.equal(q.slots.find(s=>s.id==='question').lines,2);assert.equal(q.slots.find(s=>s.id==='right').items,2);assert.ok(q.decorations.some(d=>d.id.startsWith('no-dash')));assert.ok(q.decorations.find(d=>d.id==='yes-tip'));
 const n=asset('form-nested-rect.v1');for(let id of['outer-box','inner-box','outer-nameplate','inner-nameplate'])assert.ok(n.decorations.find(d=>d.id===id).path.some(c=>c.command==='Q'));
 const t=asset('form-timeline-5.v1');assert.equal(t.slots.filter(s=>s.id.startsWith('interval')).length,5);assert.equal(t.slots.filter(s=>s.id.startsWith('event')&&s.lines===2).length,6);assert.equal(t.decorations.filter(d=>d.id.startsWith('boundary')).length,6);
 const p=asset('form-phone-6line.v1');assert.equal(p.slots.find(s=>s.id==='body').lines,6);for(let id of['phone-outer','phone-inner','speaker','status-bar','bubble','bubble-tail'])assert.ok(p.decorations.find(d=>d.id===id));
});
test('all fixed paths fit live decoration limits and physical coordinates never follow content ratios',()=>{
 for(const{styleID}of catalog){let b=build(styleID);assert.ok(b.spec.frameDecorations.length<=64);for(let d of b.spec.frameDecorations){assert.ok(d.strokePt>=.05);for(let c of d.path)for(let v of[c,c.control,c.control1,c.control2].filter(Boolean))if(v.x){assert.equal(v.x.ratio,0);assert.equal(v.y.ratio,0);}}function visit(s){for(let c of s.children??[]){if(c.reserve)assert.ok(c.reserve.heightMm>=.1);if(c.widthMm!==undefined)assert.ok(c.widthMm>=1&&c.widthMm<=108);if(c.spec)visit(c.spec);}}visit(b.spec);}
});
test('filled shells cannot occlude their owned editable text',()=>{
 for(const {styleID} of catalog)for(const decoration of asset(styleID).decorations) {
  if(decoration.fill!=='none'&&!decoration.id.includes('tip'))assert.equal(decoration.layer,'back',`${styleID}/${decoration.id}`);
 }
 for(const id of ['outer-box','inner-box']) {
  const outline=asset('form-nested-rect.v1').decorations.find(d=>d.id===id);
  assert.equal(outline.path.at(-1).command,'L');
  assert.equal(outline.path[0].x.offsetMm,51);
  assert.equal(outline.path.at(-1).x.offsetMm,21);
 }
});
const evidence=process.env.FIXED_MISC_NATIVE_EVIDENCE;
test('bounded correction retains shape pluses and compact six-line phone padding',()=>{
 for(const id of ['form-argument-2line.v1','form-argument-1line.v1']) {
  for(const d of asset(id).decorations.filter(d=>d.id.startsWith('plus-'))) {
   assert.equal(d.strokePt,.75);assert.equal(d.fill,'#000000');assert.equal(d.path.at(-1).command,'Z');
  }
 }
 const phone=asset('form-phone-6line.v1');assert.equal(phone.heightMm,41.6);
 assert.equal(phone.slots.find(s=>s.id==='body').fontPt,8);assert.equal(phone.slots.find(s=>s.id==='body').lines,6);
 if(evidence)for(const kind of ['base','variant']) {
  const doc=JSON.parse(readFileSync(`${evidence}/form-phone-6line.v1-${kind}/reopened.json`));
  const body=doc.geometry.find(g=>g.lines?.length===6),bubble=doc.geometry.find(g=>g.name==='frame-decoration:bubble');
  const gap=bubble.geometry.yMm+bubble.geometry.heightMm-body.inkBounds.yMm-body.inkBounds.heightMm;
  assert.ok(gap>=1.5&&gap<=2,`actual native ink padding ${gap}`);
 }
});
for(const{styleID}of catalog)test(`${styleID}: live native base/variant and independent reopen evidence`,{skip:!evidence},()=>{for(let kind of['base','variant']){let root=`${evidence}/${styleID}-${kind}`,req=JSON.parse(readFileSync(root+'/request.json')),proof=JSON.parse(readFileSync(root+'/verification.json'));assert.deepEqual(req.spec,build(styleID,fixtures[styleID][kind]).spec);assert.equal(proof.technicalPass,true);assert.equal(proof.reopenGeometry.equal,true);}let pair=JSON.parse(readFileSync(`${evidence}/${styleID}-geometry.json`));assert.equal(pair.equal,true);assert.ok(pair.structuralObjects>0&&pair.textObjects>0);});
