import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const ids = ['form-argument-2line.v1','form-argument-1line.v1','form-ab-links.v1','form-question-2circle.v1','form-nested-rect.v1','form-timeline-5.v1','form-phone-6line.v1'];
// Estimated print widths compare representative ink height with the fixed 8pt
// profile and layout. Raster pixels and DPI are not physical-size measurements.
const defaultWidths = new Map([
  ['form-argument-2line.v1',95],
  ['form-argument-1line.v1',99],
  ['form-ab-links.v1',89.5],
  ['form-question-2circle.v1',88],
  ['form-nested-rect.v1',72],
  ['form-timeline-5.v1',100],
  ['form-phone-6line.v1',47],
]);
const clone = value => structuredClone(value);
function freeze(value) { if(value && typeof value==='object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
const templates = new Map(ids.map(id=>[id,freeze(JSON.parse(readFileSync(new URL(`../../assets/fixed-styles/${id}.json`,import.meta.url),'utf8')))]));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function fail(message) { throw new Error(`FIXED_STYLE_CONSTRAINT: ${message}`); }
function template(id) { const t=templates.get(id); if(!t)fail(`unknown styleID ${id}`); return t; }
function exactKeys(value,allowed,where) {
  if(!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).some(k=>!allowed.includes(k)) || allowed.some(k=>!Object.hasOwn(value,k)))fail(`${where}: exactly allowed keys ${allowed.join(', ')}`);
}
function literal(value,slot) {
  if(typeof value!=='string' || !value.trim() || value.split('\n').some(line=>!line.trim()) || /[\u0000-\u0009\u000b-\u001f\u2028\u2029]/u.test(value) || value.split('\n').length!==slot.lines || Array.from(value).length>slot.maxChars)fail(`${slot.id}: nonempty literal, <=${slot.maxChars} characters, exactly ${slot.lines} line(s)`);
  return value;
}
function contentFor(t,content) {
  exactKeys(content,t.slots.map(s=>s.id),'content');
  return Object.fromEntries(t.slots.map(s=>{
    if(s.items) {
      const v=content[s.id];
      if(!Array.isArray(v)||v.length!==s.items)fail(`${s.id}: exactly ${s.items} items`);
      return [s.id,v.map((text,i)=>literal(text,{...s,id:`${s.id}[${i}]`,lines:1,maxChars:s.itemMaxChars}))];
    }
    return [s.id,literal(content[s.id],s)];
  }));
}
export function listStyles() { return freeze(ids.map(id=>{const t=template(id),range=limits(t),reference=scaledTemplate(t,range.defaultWidthMm);return {styleID:id,family:'misc',sourceGroup:t.group,recipe:t.recipe,counts:{slots:t.slots.length},widthMm:range.defaultWidthMm,heightMm:reference.heightMm,estimatedPrintWidthMm:range.defaultWidthMm,...range};})); }
export function exampleContent(id) { return clone(template(id).example); }
const textHeight = (fontPt,lines) => fontPt/8*(3.189111111111111+(lines-1)*3.668888888888889);
const mm = n => Math.round(n*1e9)/1e9;
function bandsFor(t) {
  const slots=[...t.slots.map(s=>({...s})),...t.fixedText.map(s=>({...s}))].sort((a,b)=>a.y-b.y||a.x-b.x),bands=[];
  for(const s of slots) { const last=bands.at(-1);if(last && s.y<last.end-.001) {last.slots.push(s);last.end=Math.max(last.end,s.y+s.height);}else bands.push({start:s.y,end:s.y+s.height,slots:[s]}); }
  return bands;
}
function minimumWidth(t) {
  const bands=bandsFor(t);let minScale=0;
  for(const band of bands)for(const s of band.slots) {
    const top=s.y-band.start,remaining=band.end-s.y;
    if(top>.001)minScale=Math.max(minScale,.1/top);
    minScale=Math.max(minScale,(textHeight(s.fontPt,s.lines)+.1)/remaining);
  }
  return Math.ceil(t.widthMm*minScale*10)/10;
}
function limits(t) {
  const defaultWidthMm=defaultWidths.get(t.styleID),minWidthMm=minimumWidth(t),maxWidthMm=108;
  if(defaultWidthMm<minWidthMm)fail(`${t.styleID}: reference-like default falls below readable minimum`);
  return {defaultWidthMm,minWidthMm,maxWidthMm};
}
function scaledTemplate(source,widthMm) {
  const scale=widthMm/source.widthMm,bands=bandsFor(source),corrections=[];let y=0;
  for(const band of bands) {
    const gap=band.start-y;
    if(gap>.001)corrections.push({at:band.start,extra:Math.max(0,.1-gap*scale)});
    y=band.end;
  }
  const bottomGap=source.heightMm-y,bottomExtra=bottomGap>.001?Math.max(0,.1-bottomGap*scale):0;
  const mapY=value=>mm(value*scale+corrections.reduce((sum,c)=>sum+(value>=c.at-.000000001?c.extra:0),0));
  const point=(point,axis)=>{
    const base=axis==='x'?source.widthMm:source.heightMm;
    const physical=(point.ratio??0)*base+(point.offsetMm??0);
    return {ratio:0,offsetMm:axis==='x'?mm(physical*scale):mapY(physical)};
  };
  const scalePath=decoration=>{
    const copy=clone(decoration);
    // Only authored 0.3pt core outlines/connectors receive the requested +0.1pt.
    // Keep tone strips, blank rules, bold operators/tips and phone details exact.
    if(copy.strokePt===.3)copy.strokePt=.4;
    for(const command of copy.path??[])for(const key of ['x','y','control','control1','control2']) {
      if(key==='x'||key==='y') { if(command[key])command[key]=point(command[key],key); }
      else if(command[key])for(const axis of ['x','y'])if(command[key][axis])command[key][axis]=point(command[key][axis],axis);
    }
    return copy;
  };
  const heightMm=mm(source.heightMm*scale+corrections.reduce((sum,c)=>sum+c.extra,0)+bottomExtra);
  return {
    ...source,widthMm,heightMm,
    slots:source.slots.map(s=>({...s,x:mm(s.x*scale),y:mapY(s.y),width:mm(s.width*scale),height:mm(s.height*scale)})),
    fixedText:source.fixedText.map(s=>({...s,x:mm(s.x*scale),y:mapY(s.y),width:mm(s.width*scale),height:mm(s.height*scale)})),
    decorations:source.decorations.map(scalePath),
  };
}
function requestedWidth(source,widthMm) {
  const {defaultWidthMm,minWidthMm,maxWidthMm}=limits(source),width=widthMm===undefined?defaultWidthMm:widthMm;
  if(typeof width!=='number'||!Number.isFinite(width)||width<minWidthMm||width>maxWidthMm)fail(`${source.styleID}: widthMm must be between ${minWidthMm} and ${maxWidthMm}`);
  return width;
}
function textChild(s,text) {
  return {id:`literal-${s.id}`,text,widthMm:s.width,richText:{text,textProfile:'und-dotum-8-default-v1',fontPt:s.fontPt,tracking:0,leadingPercent:130,textAlign:s.align,autoFit:false,...(s.fill?{fill:s.fill}:{})}};
}
function reservation(height) { const n=mm(height);if(n<.1)fail("asset reserve below native 0.1mm minimum");return {heightMm:n}; }
function column(s,text,start,height) {
  const children=[],top=s.y-start,bottom=height-top-textHeight(s.fontPt,s.lines);
  if(bottom<-.001)fail(`${s.id}: fixed text row too short`);
  if(top>.001)children.push({id:'top',reserve:reservation(top)});
  children.push(textChild(s,text));
  if(bottom>.001)children.push({id:'bottom',reserve:reservation(bottom)});
  return {id:`track-${s.id}`,widthMm:s.width,spec:{kind:'composition',layout:'column',widthMm:s.width,gapMm:0,children}};
}
function tightSequence(tracks,gapMm,firstId,lastId) {
  const widthMm=mm(tracks.reduce((sum,track)=>sum+track.widthMm,0)+gapMm*(tracks.length-1)),id=`tight-${firstId}-${lastId}`;
  return {id,widthMm,spec:{kind:'composition',layout:'row',widthMm,gapMm:mm(gapMm),rowAlign:'top',children:tracks}};
}
function drawing(t,content) {
  const slots=[...t.slots.map(s=>({...clone(s),text:s.items?content[s.id].join(', '):content[s.id]})),...clone(t.fixedText)].sort((a,b)=>a.y-b.y||a.x-b.x);
  // Each connected vertical band contains disjoint fixed horizontal tracks.
  // Content height is measured before execution, never used to reposition tracks.
  const bands=[];
  for(const s of slots) { const last=bands.at(-1);if(last && s.y<last.end-.001) {last.slots.push(s);last.end=Math.max(last.end,s.y+s.height);}else bands.push({start:s.y,end:s.y+s.height,slots:[s]}); }
  const children=[];let y=0;
  for(const [i,b] of bands.entries()) {
    if(b.start-y>.001)children.push({id:`gap-${i}`,reserve:reservation(b.start-y)});
    let x=0,tightTracks=[],tightGapMm,firstTrackId;const row=[];
    for(const s of b.slots.sort((a,b)=>a.x-b.x)) {
      if(s.x<x-.001)fail(`${t.styleID}: overlapping fixed text tracks ${s.id}`);
      const track=column(s,s.text,b.start,b.end-b.start),gapMm=mm(Math.max(0,s.x-x));
      if(!tightTracks.length) {
        if(gapMm>.001) {
          if(gapMm<1)fail(`${t.styleID}: leading fixed-track gap below native 1mm child-width minimum`);
          row.push({id:`left-${s.id}`,widthMm:mm(gapMm),reserve:reservation(b.end-b.start)});
        }
        tightTracks=[track];firstTrackId=s.id;
      } else if(gapMm<1) {
        const normalizedGap=gapMm<.001?0:gapMm;
        if(tightGapMm===undefined)tightGapMm=normalizedGap;
        else if(Math.abs(tightGapMm-normalizedGap)>.000001)fail(`${t.styleID}: nonuniform sub-1mm gaps cannot be represented by one native row`);
        tightTracks.push(track);
      } else {
        row.push(tightTracks.length>1?tightSequence(tightTracks,tightGapMm,firstTrackId,s.id):tightTracks[0],{id:`left-${s.id}`,widthMm:mm(gapMm),reserve:reservation(b.end-b.start)});
        tightTracks=[track];tightGapMm=undefined;firstTrackId=s.id;
      }
      x=s.x+s.width;
    }
    if(tightTracks.length)row.push(tightTracks.length>1?tightSequence(tightTracks,tightGapMm,firstTrackId,b.slots.at(-1).id):tightTracks[0]);
    if(t.widthMm-x>.001) {
      const rightGap=mm(t.widthMm-x);
      if(rightGap<1)fail(`${t.styleID}: trailing fixed-track gap below native 1mm child-width minimum`);
      row.push({id:'right',widthMm:rightGap,reserve:reservation(b.end-b.start)});
    }
    if(x>t.widthMm+.001)fail(`${t.styleID}: fixed track outside drawing`);
    children.push({id:`band-${i}`,spec:{kind:'composition',layout:'row',widthMm:t.widthMm,gapMm:0,rowAlign:'top',children:row}});y=b.end;
  }
  if(t.heightMm-y>.001)children.push({id:'bottom',reserve:reservation(t.heightMm-y)});
  if(y>t.heightMm+.001)fail(`${t.styleID}: fixed rows outside drawing`);
  return {kind:'composition',layout:'column',widthMm:t.widthMm,gapMm:0,children,frameDecorations:clone(t.decorations)};
}
function withoutContent(spec,slotIds) {
  const s=clone(spec);
  function walk(node) {for(const child of node.children??[]) {if(slotIds.has(child.id)) {child.text='$content';child.richText.text='$content';}if(child.spec)walk(child.spec);}}
  walk(s);return s;
}
export function buildStyle(request) {
  if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!['styleID','content','widthMm'].includes(k))||!Object.hasOwn(request,'styleID')||!Object.hasOwn(request,'content'))fail('request: styleID and content are required; widthMm is optional');
  const source=template(request.styleID),widthMm=requestedWidth(source,request.widthMm),t=scaledTemplate(source,widthMm),content=contentFor(source,request.content),spec=drawing(t,content);
  const slots=[...t.slots.map(s=>({...s,text:s.items?content[s.id].join(', '):content[s.id]})),...t.fixedText];
  const parts=slots.map(s=>({id:s.id,spec:{kind:'composition',layout:'column',widthMm:s.width,gapMm:0,children:[textChild(s,s.text)]},expectedHeightMm:textHeight(s.fontPt,s.lines),maxWidthMm:s.width,lineCount:s.lines}));
  const geometry={spec:withoutContent(spec,new Set(t.slots.map(s=>`literal-${s.id}`))),slots:t.slots.map(({id,x,y,width,height,lines,fontPt,align,items})=>({id,x,y,width,height,lines,fontPt,align,...(items?{items}:{})})),sourceGroup:t.group,widthMm:t.widthMm,heightMm:t.heightMm};
  return freeze({styleID:t.styleID,content,spec,parts,geometry,geometrySignature:hash(geometry),requiresNativePreflight:true,recipe:t.recipe});
}
export function assertGeometry(bundle) {
  if(!bundle?.styleID)fail('bundle required');const expected=buildStyle({styleID:bundle.styleID,content:bundle.content,widthMm:bundle.geometry?.widthMm});
  for(const key of ['spec','parts','geometry','geometrySignature','requiresNativePreflight','recipe'])if(JSON.stringify(bundle[key])!==JSON.stringify(expected[key]))fail(`${key}: geometry, style, slot, or preflight override detected`);
  return true;
}
export async function preflight(bundle,planner) {
  assertGeometry(bundle);if(typeof planner!=='function')fail('native planner(spec) callback required');const plans=[],t=scaledTemplate(template(bundle.styleID),bundle.geometry.widthMm);
  for(const part of bundle.parts) {
    const plan=await planner(clone(part.spec));
    if(!plan || !Number.isFinite(plan.heightMm) || !Number.isFinite(plan.widthMm))fail(`${part.id}: native measurement unavailable`);
    if(Math.abs(plan.heightMm-part.expectedHeightMm)>.02 || plan.widthMm>part.maxWidthMm+.02 || (plan.warnings??[]).length)fail(`${part.id}: measured content exceeds fixed line count/slot; revise content, never shrink typography`);
    plans.push({id:part.id,plan});
  }
  const complete=await planner(clone(bundle.spec));
  if(!complete || !Number.isFinite(complete.heightMm) || !Number.isFinite(complete.widthMm) || !Number.isFinite(complete.boundsMm?.widthMm))fail('complete native measurement unavailable');
  if(Math.abs(complete.heightMm-t.heightMm)>.02 || Math.abs(complete.widthMm-t.widthMm)>.02 || complete.boundsMm.widthMm>t.widthMm+.15 || (complete.warnings??[]).length)fail('complete native fixed geometry exceeds declared bounds or has warnings');
  return {styleID:bundle.styleID,geometrySignature:bundle.geometrySignature,status:'passed',plans,complete,visualReview:'pending'};
}
