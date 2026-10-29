import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

// Fixed plain grids. All visible cell strings are content; cell geometry is not.
// Representative tables have a consistent width-to-ink-height ratio near
// 33:1. At roughly 2.5mm of Korean ink height for 8pt, estimate 84mm;
// source raster pixels and DPI are not physical-size measurements.
const formats = [
  ['table-2x6.v1',2,[46,12.4,12.4,12.4,12.4,12.4],'DUP001',84,70,108],
  ['table-2x7.v1',2,[38,...Array(6).fill(70/6)],'DUP002',84,70,108],
  ['table-3x3.v1',3,[42,33,33],'DUP003',84,50,108],
  ['table-3x4.v1',3,[35,...Array(3).fill(73/3)],'DUP004',84,55,108],
];
const lookup=id=>{const f=formats.find(f=>f[0]===id);if(!f)throw Error(`FIXED_STYLE_CONSTRAINT: unknown table style ${id}`);return f;};
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const fail=msg=>{throw Error(`FIXED_STYLE_CONSTRAINT: ${msg}`);};
const resolveWidth=(format,widthMm)=>{
  const [, , , , defaultWidthMm,minWidthMm,maxWidthMm]=format;
  const width=widthMm===undefined?defaultWidthMm:widthMm;
  if(typeof width!=='number'||!Number.isFinite(width)||width<minWidthMm||width>maxWidthMm)fail(`widthMm must be between ${minWidthMm} and ${maxWidthMm}`);
  return width;
};
export const listStyles=()=>formats.map(([styleID,rows,widths,sourceGroup,defaultWidthMm,minWidthMm,maxWidthMm])=>({styleID,family:'table',recipe:'D1-01_Flat',sourceGroup,counts:{rows,columns:widths.length},widthMm:defaultWidthMm,defaultWidthMm,estimatedPrintWidthMm:defaultWidthMm,minWidthMm,maxWidthMm}));
export function exampleContent(id){
  const [,rows,widths]=lookup(id),n=widths.length;
  if(rows===2)return {cells:[['대상',...Array.from({length:n-1},(_,i)=>String(i+1))],['측정값',...Array.from({length:n-1},(_,i)=>String((i+1)*10))]]};
  return {cells:[['구분',...['갑','을','병'].slice(0,n-1)],['지표 1',...Array.from({length:n-1},(_,i)=>String((i+1)*100))],['지표 2',...Array.from({length:n-1},(_,i)=>String((i+1)*20))]]};
}
export function buildStyle(request){
  if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!['styleID','content','widthMm'].includes(k))||!Object.hasOwn(request,'styleID')||!Object.hasOwn(request,'content'))fail('styleID and content are required; widthMm is optional');
  const {styleID,content}=request,format=lookup(styleID),[,rowCount,widthRatios]=format,colCount=widthRatios.length,widthMm=resolveWidth(format,request.widthMm);
  if(!content||Object.keys(content).length!==1||!Array.isArray(content.cells)||content.cells.length!==rowCount)fail('fixed row count and cells slot required');
  const cells=content.cells.map((row,r)=>{
    if(!Array.isArray(row)||row.length!==colCount)fail('fixed column count required');
    return row.map((text,c)=>{if(typeof text!=='string'||!text.trim()||/[\r\n\u0000-\u001f\u2028\u2029]/u.test(text)||Array.from(text).length>80)fail('each cell must be a nonempty single-line literal');return {id:`r${r}c${c}`,rowId:`r${r}`,columnId:`c${c}`,text,state:'value',align:'center',verticalAlign:'middle'};});
  }).flat();
  const spec={kind:'table',xMm:0,yMm:0,widthMm,strokePt:.4,textProfile:'und-dotum-8-default-v1',paddingHorizontalMm:1,paddingVerticalMm:.5,
    rows:Array.from({length:rowCount},(_,r)=>({id:`r${r}`,minHeightMm:5.5})),columns:widthRatios.map((baseWidthMm,c)=>({id:`c${c}`,widthMm:baseWidthMm*widthMm/108,align:'center',verticalAlign:'middle'})),cells};
  const geometry=structuredClone(spec);geometry.cells.forEach(cell=>cell.text='CONTENT');
  return freeze({styleID,family:'table',recipe:'D1-01_Flat',content:structuredClone(content),spec,parts:[{id:'core',spec}],geometry,geometrySignature:hash(geometry),requiresNativePreflight:true,visualReview:'pending'});
}
export function assertGeometry(bundle){
  const expected=buildStyle({styleID:bundle.styleID,content:bundle.content,widthMm:bundle.spec?.widthMm});
  for(const k of ['spec','geometry','geometrySignature','parts'])if(!isDeepStrictEqual(bundle[k],expected[k]))fail(`changed ${k}`);
  return true;
}
export async function preflight(bundle,planner){
  assertGeometry(bundle);const [,rows,widths]=lookup(bundle.styleID),plan=await planner(structuredClone(bundle.spec));
  const measured=plan.layout??plan;
  if(!Number.isFinite(plan.widthMm)||!Number.isFinite(plan.heightMm))fail('native grid measurement unavailable');
  if((plan.warnings??[]).length||Math.abs(plan.widthMm-bundle.spec.widthMm)>.2||Math.abs(plan.heightMm-rows*5.5)>.2)fail('measured content expands fixed grid');
  if(!Array.isArray(measured.cells)||measured.cells.length!==rows*widths.length)fail('native per-cell measurement required');
  for(const cell of measured.cells)if(!Number.isFinite(cell?.boundsMm?.height)||Math.abs(cell.boundsMm.height-5.5)>.02)fail('cell content wraps or changes fixed height');
  return {styleID:bundle.styleID,status:'passed',geometrySignature:bundle.geometrySignature,complete:plan,visualReview:'pending'};
}
