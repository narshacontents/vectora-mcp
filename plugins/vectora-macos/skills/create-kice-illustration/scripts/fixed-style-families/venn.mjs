import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const ids=['venn3-only-three-bc.v1','venn3-only-two-ab-ac.v1','venn3-only-three-ac.v1','venn3-chain-triple.v1','venn2-hatch-density2.v1','venn2-hatch-density3.v1'];
const clone=value=>structuredClone(value);
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const templates=new Map(ids.map(id=>[id,freeze(JSON.parse(readFileSync(new URL(`../../assets/fixed-styles/${id}.json`,import.meta.url),'utf8')))]));
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function fail(message){throw new Error(`FIXED_VENN_CONSTRAINT: ${message}`);}
function template(id){const t=templates.get(id);if(!t)fail(`unknown styleID ${id}`);return t;}
function keys(value,allowed,name,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.includes(k))||allowed.some(k=>!optional.includes(k)&&!Object.hasOwn(value,k)))fail(`${name}: allowed ${allowed.join(', ')}`);}
function literals(values,count,name,max){
  if(!Array.isArray(values)||values.length!==count)fail(`${name}: exactly ${count} items`);
  return values.map((value,i)=>{if(typeof value!=='string'||!value.trim()||/[\u0000-\u001f\u2028\u2029]/u.test(value)||Array.from(value).length>max)fail(`${name}[${i}]: one nonempty line, at most ${max} characters`);return value;});
}
export function listStyles(){return freeze(ids.map(styleID=>{const t=template(styleID);return {styleID,recipe:t.recipe,family:t.family,sourceGroup:t.sourceGroup,counts:clone(t.counts),...sizePolicy};}));}
export function exampleContent(styleID){const t=template(styleID);return {setLabels:['갑','을','병'].slice(0,t.counts.sets),regions:Array.from({length:t.counts.regions},(_,i)=>String.fromCharCode(65+i)),legend:Array.from({length:t.counts.legend},(_,i)=>`예시 영역 ${i+1}`)};}
function contentFor(t,input){
  keys(input,['setLabels','regions','legend'],'content');
  const content={setLabels:literals(input.setLabels,t.counts.sets,'setLabels',2),regions:literals(input.regions,t.counts.regions,'regions',1),legend:literals(input.legend,t.counts.legend,'legend',24)};
  if(new Set(content.setLabels).size!==t.counts.sets||new Set(content.regions).size!==t.counts.regions)fail('set names and region symbols must be distinct');
  return content;
}
const sizePolicy={defaultWidthMm:84,minWidthMm:78,maxWidthMm:108};
/** Native geometry reserves a physical .3pt outline before solving the circle
 * span. Keep its glyph-origin band physical too; scaling normalized coordinates
 * directly moves the supplemental strokes off the native ellipses. */
function sizedTemplate(source,requested){
  const widthMm=requested===undefined?sizePolicy.defaultWidthMm:requested;
  if(typeof widthMm!=='number'||!Number.isFinite(widthMm)||widthMm<sizePolicy.minWidthMm||widthMm>sizePolicy.maxWidthMm)fail(`widthMm must be ${sizePolicy.minWidthMm}..${sizePolicy.maxWidthMm}`);
  const t=clone(source),ratio=widthMm/source.widthMm;
  t.widthMm=widthMm;t.native.widthMm*=ratio;t.legendWidthMm*=ratio;t.gapMm*=ratio;
  calibratePlane(t,source,t.native.widthMm);
  return t;
}
function calibratePlane(t,source,diagramWidthMm){
  const strokeMm=.3*25.4/72,k=(diagramWidthMm-strokeMm)/(source.native.widthMm-strokeMm);
  const plane=t.nativePlane=clone(source.nativePlane);
  const top=source.nativePlane.circles.A.yMm-source.nativePlane.circles.A.ryMm;
  const x=value=>strokeMm/2+(value-strokeMm/2)*k,y=value=>top+(value-top)*k;
  for(const circle of Object.values(plane.circles)){circle.xMm=x(circle.xMm);circle.yMm=y(circle.yMm);circle.rxMm*=k;circle.ryMm*=k;}
  for(const hole of plane.textExclusions){hole.xMm=x(hole.xMm);hole.yMm=y(hole.yMm);}
  plane.paintHeightMm=y(source.nativePlane.paintHeightMm-strokeMm/2)+strokeMm/2;
  plane.paintWidthMm=diagramWidthMm;
}
const extent=offsetMm=>({ratio:0,offsetMm});
const command=(name,x,y)=>({command:name,x:extent(x),y:extent(y)});
function legendSpec(t,c){
  return {kind:'composition',layout:'column',widthMm:t.legendWidthMm,gapMm:1,
    legendFrame:{title:'〈범례〉',paddingMm:1.2,titlePaddingMm:.25,strokePt:.3},
    children:c.legend.map((value,i)=>({id:`region-${i}`,text:`${c.regions[i]}\u2002: ${value}`,richText:{text:`${c.regions[i]}\u2002: ${value}`,textAlign:'left',autoFit:false}}))};
}

const masks={A:1,B:2,AB:3,C:4,AC:5,BC:6,ABC:7};
function membership(x,y,circles){let mask=0;for(const [key,c] of Object.entries(circles))if(((x-c.xMm)/c.rxMm)**2+((y-c.yMm)/c.ryMm)**2<1-1e-9)mask|=masks[key];return mask;}
function inHole(x,y,holes){return holes.some(h=>Math.abs(x-h.xMm)<=h.widthMm/2&&Math.abs(y-h.yMm)<=h.heightMm/2);}

function resolveTextExclusions(t,native,delta){
  const measured=native.layout?.venn?.textBackings;
  if(!Array.isArray(measured))fail('native actual-ink textBackings unavailable; rebuild the app before preflight');
  // The added paths paint in front of native text. Include their half-stroke
  // envelope so a diagonal stroke cannot nick the white backing at a corner.
  const clearanceMm=Math.max(0,...t.supplementalHatches.map(h=>h.strokePt))*25.4/72/2;
  const byKey=new Map(measured.map(label=>[label.key,label]));
  t.nativePlane.textExclusions=t.nativePlane.textExclusions.map(({key})=>{
    const label=byKey.get(key),box=label?.backingMm,ink=label?.inkMm;
    if(!box||!ink||![box,ink].every(b=>['xMm','yMm','widthMm','heightMm'].every(k=>Number.isFinite(b[k]))&&b.widthMm>0&&b.heightMm>0)
      ||box.xMm>ink.xMm||box.yMm>ink.yMm||box.xMm+box.widthMm<ink.xMm+ink.widthMm||box.yMm+box.heightMm<ink.yMm+ink.heightMm)fail(`native actual-ink backing unavailable for ${key}`);
    return {key,xMm:box.xMm+box.widthMm/2,yMm:box.yMm+box.heightMm/2+delta,widthMm:box.widthMm+2*clearanceMm,heightMm:box.heightMm+2*clearanceMm};
  });
}

/** Exact ellipse intersections, with native boolean-region membership. This is
 * only supplemental hatch paint: circles, semantic regions and editable labels
 * remain generated by native layout:venn. No raster tracing or app imports. */
function supplementalPaths(t){
  if(!t.supplementalHatches.length)return [];
  if(!t.nativePlane?.circles||!t.nativePlane.textExclusions?.length)fail('native geometry calibration is missing');
  const {circles,textExclusions:holes}=t.nativePlane;
  const output=[];
  for(const hatch of t.supplementalHatches)for(const [index,degrees] of hatch.anglesDeg.entries()){
    const angle=degrees*Math.PI/180,ux=Math.cos(angle),uy=Math.sin(angle),nx=-uy,ny=ux,spacing=hatch.spacingMm[index],commands=[];
    const radius=150;
    for(let k=-Math.ceil(radius/spacing);k<=Math.ceil(radius/spacing);k++){
      const px=nx*k*spacing,py=ny*k*spacing,cuts=[-radius,radius];
      for(const c of Object.values(circles)){
        const dx=px-c.xMm,dy=py-c.yMm,a=(ux/c.rxMm)**2+(uy/c.ryMm)**2,b=2*(dx*ux/c.rxMm**2+dy*uy/c.ryMm**2),d=(dx/c.rxMm)**2+(dy/c.ryMm)**2-1,disc=b*b-4*a*d;
        if(disc>=0){cuts.push((-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a));}
      }
      for(const h of holes){
        if(Math.abs(ux)>1e-9)for(const x of [h.xMm-h.widthMm/2,h.xMm+h.widthMm/2])cuts.push((x-px)/ux);
        if(Math.abs(uy)>1e-9)for(const y of [h.yMm-h.heightMm/2,h.yMm+h.heightMm/2])cuts.push((y-py)/uy);
      }
      cuts.sort((a,b)=>a-b);
      const runs=[];
      for(let i=1;i<cuts.length;i++){
        const a=cuts[i-1],b=cuts[i],mid=(a+b)/2,x=px+ux*mid,y=py+uy*mid;
        if(b-a<1e-7||membership(x,y,circles)!==masks[hatch.region]||inHole(x,y,holes))continue;
        if(runs.length&&Math.abs(runs.at(-1)[1]-a)<1e-7)runs.at(-1)[1]=b;else runs.push([a,b]);
      }
      for(const [a,b] of runs){
        if(b-a<.2)continue;
        const inset=.06;
        commands.push(command('M',px+ux*(a+inset),1+py+uy*(a+inset)),command('L',px+ux*(b-inset),1+py+uy*(b-inset)));
      }
    }
    if(commands.length<2)fail(`no supplemental strokes for ${hatch.region}/${degrees}`);
    // A native decoration path allows at most 512 commands.
    for(let i=0;i<commands.length;i+=500)output.push({id:`hatch-${hatch.region}-${index}-${i/500}`,layer:'front',stroke:'#000000',strokePt:hatch.strokePt,fill:'none',path:commands.slice(i,i+500)});
  }
  return output;
}
function withoutContent(spec){
  const s=clone(spec);
  if(s.kind==='schematic'&&s.layout==='venn'){s.setLabels=s.setLabels.map(()=>'$content');for(const key of Object.keys(s.regions))s.regions[key]='$content';}
  for(const child of s.children??[]){if(child.text!==undefined&&child.id.startsWith('region-')){child.text='$content';if(child.richText)child.richText.text='$content';}if(child.spec)child.spec=withoutContent(child.spec);}
  return s;
}
function compile(t,content,originReserveMm=1){
  const native={...clone(t.native),setLabels:content.setLabels,regions:Object.fromEntries(t.regionKeys.map((key,i)=>[key,content.regions[i]]))};
  // Positive glyph-origin compensation is an empty inter-child gap, not an
  // overlapping reservation under a native text frame. Taller glyphs consume
  // part of the transparent 1mm reservation instead. Painted paths stay fixed.
  const core={kind:'composition',layout:'column',widthMm:t.native.widthMm,gapMm:Math.max(0,originReserveMm-1),children:[{id:'native-origin-reserve',reserve:{heightMm:Math.min(1,originReserveMm)}},{id:'venn',spec:native}],frameDecorations:supplementalPaths(t)};
  const legend=legendSpec(t,content);
  const spec={kind:'composition',layout:'row',widthMm:t.widthMm,gapMm:t.gapMm,rowAlign:'center',children:[{id:'core',widthMm:t.native.widthMm,spec:core},{id:'legend',widthMm:t.legendWidthMm,spec:legend}]};
  return {spec,parts:[{id:'core',spec:core},{id:'legend',spec:legend}],native};
}
export function buildStyle(request){
  keys(request,['styleID','content','widthMm'],'request',['widthMm']);
  const t=sizedTemplate(template(request.styleID),request.widthMm),content=contentFor(t,request.content),{spec,parts}=compile(t,content);
  const geometry={spec:withoutContent(spec),regions:t.regionKeys,calibration:clone(t.nativePlane),hatches:clone(t.supplementalHatches)};
  return freeze({styleID:t.styleID,widthMm:t.widthMm,recipe:t.recipe,family:t.family,sourceGroup:t.sourceGroup,content:clone(content),spec,parts,geometry,geometrySignature:digest(geometry),requiresNativePreflight:true,requiresResolvedSpec:true,visualReview:'pending'});
}
export function assertGeometry(bundle){
  if(!bundle?.styleID)fail('bundle required');
  const expected=buildStyle({styleID:bundle.styleID,widthMm:bundle.widthMm,content:bundle.content});
  for(const field of ['widthMm','recipe','family','sourceGroup','spec','parts','geometry','geometrySignature','requiresNativePreflight','requiresResolvedSpec'])if(JSON.stringify(bundle[field])!==JSON.stringify(expected[field]))fail(`fixed ${field} override detected; recompile content slots`);
  return true;
}
export async function preflight(bundle,planner){
  assertGeometry(bundle);if(typeof planner!=='function')fail('native planner(spec) callback required');
  const t=sizedTemplate(template(bundle.styleID),bundle.widthMm),unresolved=compile(t,bundle.content);
  const native=await planner(clone(unresolved.native));
  if(!Number.isFinite(native?.heightMm))fail('native Venn measurement unavailable');
  if(!Number.isFinite(native.layout?.venn?.diagramWidthMm)||Math.abs(native.layout.venn.diagramWidthMm-t.native.widthMm)>.01)fail('native set geometry changed to fit content');
  calibratePlane(t,template(bundle.styleID),native.layout.venn.diagramWidthMm);
  const delta=t.nativePlane.paintHeightMm-native.heightMm;
  const originReserveMm=1+(Math.abs(delta)<1e-8?0:delta);
  if(originReserveMm<.1||originReserveMm>3)fail('native glyph paint exceeds the fixed origin reservation');
  resolveTextExclusions(t,native,originReserveMm-1);
  const resolved=compile(t,bundle.content,originReserveMm);
  const plans=[];
  for(const part of resolved.parts){
    const plan=await planner(clone(part.spec));
    if(!Number.isFinite(plan?.heightMm)||!Number.isFinite(plan?.widthMm))fail(`${part.id}: native measurements unavailable`);
    const warnings=(plan.warnings??[]).filter(w=>/자료량에 비례하지 않습니다/.test(w)===false);
    if(warnings.length)fail(`${part.id}: ${warnings.join('; ')}`);
    if(part.id==='legend'){
      const frame=plan.layout?.legendFrame,backingExtraMm=2*part.spec.legendFrame.titlePaddingMm;
      if(!frame||!Number.isFinite(frame.titleInkMm?.widthMm)||!Number.isFinite(frame.titleBackingMm?.widthMm)||Math.abs(frame.titleBackingMm.widthMm-frame.titleInkMm.widthMm-backingExtraMm)>.02)fail('legend requires native content-fit legendFrame measurements');
      if(plan.widthMm>part.spec.widthMm+.05)fail('legend exceeds its maximum width');
    }
    plans.push({id:part.id,plan});
  }
  const complete=await planner(clone(resolved.spec));
  if(!Number.isFinite(complete?.boundsMm?.widthMm)||complete.boundsMm.widthMm>bundle.widthMm+.15||(complete.warnings??[]).some(w=>!/자료량에 비례하지 않습니다/.test(w)))fail('complete native allocation failed');
  return freeze({styleID:bundle.styleID,widthMm:bundle.widthMm,sourceGroup:bundle.sourceGroup,geometrySignature:bundle.geometrySignature,status:'passed',plans,complete,spec:resolved.spec,resolvedSpec:resolved.spec,resolvedCalibration:clone(t.nativePlane),compensation:{nativePaintHeightMm:native.heightMm,targetPaintHeightMm:t.nativePlane.paintHeightMm,originReserveMm,unpaintedAdapterRole:'composition:child:native-origin-reserve'},visualReview:'pending'});
}
