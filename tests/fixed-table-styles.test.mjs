import test from 'node:test';
import assert from 'node:assert/strict';
import {listStyles,exampleContent,buildStyle,assertGeometry,preflight} from '../skills/create-kice-illustration/scripts/fixed-style-families/tables.mjs';
for(const {styleID,counts,defaultWidthMm,estimatedPrintWidthMm,minWidthMm,maxWidthMm} of listStyles())test(styleID+': scalable fixed grid retains readable table profile',async()=>{
 const c=exampleContent(styleID),base=buildStyle({styleID,content:c});
 assert.equal(base.spec.widthMm,defaultWidthMm);assert.equal(estimatedPrintWidthMm,defaultWidthMm);assert.equal(maxWidthMm,108);assert.equal(base.spec.textProfile,'und-dotum-8-default-v1');
 assert.equal(base.spec.paddingHorizontalMm,1);assert.equal(base.spec.paddingVerticalMm,.5);
 assert.ok(minWidthMm<defaultWidthMm&&defaultWidthMm<maxWidthMm);
 const smallWidth=Math.max(minWidthMm+.1,defaultWidthMm-8),largeWidth=defaultWidthMm+8;
  const minimum=buildStyle({styleID,content:c,widthMm:minWidthMm}),small=buildStyle({styleID,content:c,widthMm:smallWidth}),large=buildStyle({styleID,content:c,widthMm:largeWidth}),maximum=buildStyle({styleID,content:c,widthMm:maxWidthMm});
  for(const bundle of [base,minimum,small,large,maximum]) {
  assert.ok(Math.abs(bundle.spec.columns.reduce((sum,col)=>sum+col.widthMm,0)-bundle.spec.widthMm)<1e-9);
  assert.ok(bundle.spec.columns.every((col,i)=>Math.abs(col.widthMm/bundle.spec.widthMm-base.spec.columns[i].widthMm/base.spec.widthMm)<1e-12));
  assert.ok(bundle.spec.rows.every(row=>row.minHeightMm===5.5));assertGeometry(bundle);
 }
 assert.notEqual(base.geometrySignature,small.geometrySignature);assert.notEqual(base.geometrySignature,large.geometrySignature);
 c.cells=c.cells.map(row=>row.map(s=>s==='대상'?'항목':s==='측정값'?'값':/^\d+$/.test(s)?String(+s+7):s+'값'));
  for(const widthMm of [defaultWidthMm,smallWidth,largeWidth,maxWidthMm]) {
  const sameSize=buildStyle({styleID,content:c,widthMm});assert.equal(buildStyle({styleID,content:exampleContent(styleID),widthMm}).geometrySignature,sameSize.geometrySignature);assert.notDeepEqual(buildStyle({styleID,content:exampleContent(styleID),widthMm}).spec,sameSize.spec);assertGeometry(sameSize);
 }
 const drift=structuredClone(base);drift.spec.rows[0].minHeightMm++;assert.throws(()=>assertGeometry(drift),/changed spec/);
 const widthDrift=structuredClone(base);widthDrift.spec.widthMm++;assert.throws(()=>assertGeometry(widthDrift),/changed spec/);
 assert.throws(()=>buildStyle({styleID,content:c,widthMm:minWidthMm-.1}),/between/);
 assert.throws(()=>buildStyle({styleID,content:c,widthMm:maxWidthMm+.1}),/between/);
 assert.equal(buildStyle({styleID,content:c,widthMm:maxWidthMm}).spec.widthMm,108);
 for(const widthMm of [null,NaN,Infinity,'90'])assert.throws(()=>buildStyle({styleID,content:c,widthMm}),/between/);
 assert.throws(()=>buildStyle({styleID,content:c,unexpected:true}),/widthMm is optional/);
 assert.throws(()=>buildStyle({styleID,content:{cells:c.cells.slice(1)}}),/row count/);
 const multiline=structuredClone(c);multiline.cells[0][0]='두\n줄';assert.throws(()=>buildStyle({styleID,content:multiline}),/single-line/);
 await assert.rejects(()=>preflight(base,async spec=>({widthMm:108,heightMm:counts.rows*5.5,layout:{cells:base.spec.cells.map(()=>({boundsMm:{height:5.5}}))},warnings:[]})),/expands/);
 const measuredSmall=await preflight(small,async spec=>({widthMm:spec.widthMm,heightMm:counts.rows*5.5,layout:{cells:small.spec.cells.map(()=>({boundsMm:{height:5.5}}))},warnings:[]}));assert.equal(measuredSmall.status,'passed');
  const measuredMaximum=await preflight(maximum,async spec=>({widthMm:spec.widthMm,heightMm:counts.rows*5.5,layout:{cells:maximum.spec.cells.map(()=>({boundsMm:{height:5.5}}))},warnings:[]}));assert.equal(measuredMaximum.status,'passed');
 await assert.rejects(()=>preflight(small,async()=>({heightMm:counts.rows*5.5,layout:{cells:small.spec.cells.map(()=>({boundsMm:{height:5.5}}))}})),/measurement unavailable/);
 assert.equal(base.spec.rows.length,counts.rows);assert.equal(base.spec.columns.length,counts.columns);
});

test('fixed grids declare 0.4pt in source and need no post-create appearance adjustment',async()=>{
 const family=await import('../skills/create-kice-illustration/scripts/fixed-style-families/tables.mjs');
 const {planFixedStyleAdjustments}=await import('../skills/create-kice-illustration/scripts/fixed_styles.mjs');
 assert.equal(family.postCreateCommands,undefined);
 for(const {styleID,minWidthMm,defaultWidthMm,maxWidthMm} of listStyles())for(const widthMm of [minWidthMm,defaultWidthMm,maxWidthMm]){
  const bundle=buildStyle({styleID,content:exampleContent(styleID),widthMm});
  assert.equal(bundle.spec.strokePt,.4);assert.equal(bundle.geometry.strokePt,.4);assert.equal(bundle.parts[0].spec.strokePt,.4);
  assert.equal(bundle.geometry.nativeOverrides,undefined);
  assert.deepEqual(planFixedStyleAdjustments(bundle,{}),{commands:[],evidence:[]});
  const tampered=structuredClone(bundle);tampered.spec.strokePt=.3;assert.throws(()=>assertGeometry(tampered),/changed spec/);
 }
});
