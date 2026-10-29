import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import * as tables from './fixed-style-families/tables.mjs';
import * as charts from './fixed-style-families/charts.mjs';
import * as misc from './fixed-style-families/misc.mjs';
import * as venn from './fixed-style-families/venn.mjs';
import * as theory from './fixed-style-families/theory.mjs';

const externalFamilies=[tables,charts,misc,venn,theory];
const externalFamily=id=>externalFamilies.find(f=>f.listStyles().some(s=>s.styleID===id));

const ids = ['criticism-2.v1', 'criticism-3.v1', 'judgment-2.v1', 'judgment-3.v1', 'venn-2-hatch.v1'];
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const templates = new Map(ids.map(id => [id, freeze(JSON.parse(readFileSync(new URL(`../assets/fixed-styles/${id}.json`, import.meta.url), 'utf8')))]));
const clone = value => structuredClone(value);
const sizePolicy=t=>({defaultWidthMm:t.family==='judgment'?96:84,minWidthMm:t.family==='judgment'?90:78,maxWidthMm:108});
function sizedTemplate(source,requested){
  const p=sizePolicy(source),width=requested??p.defaultWidthMm;
  if(typeof width!=='number'||!Number.isFinite(width)||width<p.minWidthMm||width>p.maxWidthMm)fail(`widthMm must be ${p.minWidthMm}..${p.maxWidthMm}`);
  const t=clone(source),k=source.family==='criticism'?(width-40)/68:width/source.widthMm;t.widthMm=width;t.scale=k;t.heightMm*=k;
  t.coreWidthMm=(t.family==='criticism'?68:108)*k;
  if(t.nodes)for(const n of t.nodes)for(const key of ['xMm','yMm','widthMm','heightMm'])n[key]*=k;
  if(t.columns)t.columns=t.columns.map(v=>v.map(n=>n*k));
  if(t.arrows)for(const e of t.arrows){e.points=e.points.map(v=>v.map(n=>n*k));if(e.labelBox)e.labelBox=e.labelBox.map((n,i)=>i===3?Math.max(3.4,n*k):n*k);}
  for(const key of ['legendBox','exampleBox'])if(t[key])t[key]=t.family==='criticism'?[width-36,t[key][1]*k,36,t[key][3]]:t[key].map(n=>n*k);
  if(t.native){t.native.widthMm*=k;t.native.widthPolicy='total-v1';}
  return t;
}
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function fail(message) { throw new Error(`FIXED_STYLE_CONSTRAINT: ${message}`); }
function template(id) { const t = templates.get(id); if (!t) fail(`unknown styleID ${id}`); return t; }
function keys(value, allowed, name, optional=[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) fail(`${name}: allowed keys ${allowed.join(', ')}`);
  for (const key of allowed) if (!optional.includes(key) && !Object.hasOwn(value, key)) fail(`${name}.${key} is required`);
}
function literal(value, name, max = 80, lines = 1) {
  if (typeof value !== 'string' || !value.trim() || value.split('\n').some(line=>!line.trim()) || value.includes('\r') || /[\u0000-\u0008\u000b-\u001f\u2028\u2029]/u.test(value) || Array.from(value).length > max || value.split('\n').length !== lines) fail(`${name}: nonempty literal, <=${max} characters, exactly ${lines} line(s)`);
  return value;
}
function array(value, count, name, max) {
  if (!Array.isArray(value) || value.length !== count) fail(`${name}: exactly ${count} items`);
  return value.map((v, i) => literal(v, `${name}[${i}]`, max));
}
export function listFixedStyles() {
  return freeze([...ids.map(id => { const t = template(id); return {styleID:id, family:t.family, recipe:{criticism:'D4-02_Network',judgment:'D4-03_Flowchart',venn:'D4-04_Venn'}[t.family], counts:clone(t.counts),...sizePolicy(t)}; }),...externalFamilies.flatMap(f=>f.listStyles())]);
}
export function exampleContent(styleID) {
  const external=externalFamily(styleID);if(external)return external.exampleContent(styleID);
  const t = template(styleID);
  if (t.family === 'criticism') return {people:['갑','을','병'].slice(0,t.counts.people), relations:Array.from({length:t.counts.relations}, (_,i)=>String.fromCharCode(65+i)), legend:['관계 방향','관계 기호'], exampleCaption:'주체에서 대상으로\n기호의 관계를 읽는다.'};
  if (t.family === 'judgment') return {start:'가상 조건을\n차례로 확인한다.', decisions:['A','B','C','D'].slice(0,t.counts.decisions), conclusions:['결과 1','결과 2','결과 3'].slice(0,t.counts.conclusions), yes:'예', no:'아니요', legend:['시작','조건','진행','결과']};
  return {setLabels:['갑','을'], regions:['A','B','C'], legend:['왼쪽 영역','공통 영역','오른쪽 영역']};
}
function contentFor(t, input) {
  let content;
  if (t.family === 'criticism') {
    keys(input, ['people','relations','legend','exampleCaption'], 'content');
    content = {people:array(input.people,t.counts.people,'people',1), relations:array(input.relations,t.counts.relations,'relations',1), legend:array(input.legend,2,'legend',24), exampleCaption:literal(input.exampleCaption,'exampleCaption',100,2)};
    if (new Set(content.people).size !== content.people.length || new Set(content.relations).size !== content.relations.length) fail('people and relation symbols must be distinct');
  } else if (t.family === 'judgment') {
    keys(input, ['start','decisions','conclusions','yes','no','legend'], 'content');
    content = {start:literal(input.start,'start',80,2), decisions:array(input.decisions,t.counts.decisions,'decisions',1), conclusions:array(input.conclusions,t.counts.conclusions,'conclusions',12), yes:literal(input.yes,'yes',3), no:literal(input.no,'no',3), legend:array(input.legend,4,'legend',18)};
    if (content.yes === content.no || new Set(content.decisions).size !== content.decisions.length) fail('branch and decision symbols must be distinct');
  } else {
    keys(input, ['setLabels','regions','legend'], 'content');
    content = {setLabels:array(input.setLabels,2,'setLabels',2), regions:array(input.regions,3,'regions',1), legend:array(input.legend,3,'legend',24)};
    if (new Set(content.setLabels).size !== 2 || new Set(content.regions).size !== 3) fail('set and region names must be distinct');
  }
  return content;
}

const extent = offsetMm => ({ratio:0, offsetMm});
const point = (x,y) => ({x:extent(x), y:extent(y)});
const command = (name,x,y) => ({command:name, ...point(x,y)});
const path = (id, points, fill = 'none', strokePt = .3) => ({id,layer:'front',stroke:'#000000',strokePt,fill,path:points.map((p,i)=>command(i?'L':'M',...p)).concat(fill==='none'?[]:[{command:'Z'}])});
const rectangle = (id,x,y,w,h,strokePt=.3) => path(id,[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],'none',strokePt);
function arrow(id,x,y,length=7) {
  return [path(`${id}-shaft`,[[x,y],[x+length,y]]), path(`${id}-tip`,[[x+length,y],[x+length-1.5,y-.65],[x+length-1.5,y+.65]],'#000000')];
}
function icon(shape, x, y) {
  if (shape === 'diamond') return path('icon-diamond',[[x,y+2],[x+3,y],[x+6,y+2],[x+3,y+4],[x,y+2]]);
  if (shape === 'document') return {id:'icon-document',layer:'front',stroke:'#000000',strokePt:.3,fill:'none',path:[command('M',x,y),command('L',x+6,y),command('L',x+6,y+4),{command:'C',control1:point(x+4,y+2),control2:point(x+2,y+6),...point(x,y+4)},{command:'Z'}]};
  return rectangle('icon-rect',x,y,6,3);
}
function textChild(id,text,widthMm) { return {id,text,widthMm,richText:{text,textAlign:'left',autoFit:false}}; }
function shell(id,widthMm,children){
  return {kind:'composition',layout:'column',widthMm,gapMm:1.1,
    legendFrame:{title:id==='legend'?'〈범례〉':'〈예시〉',paddingMm:1.2,titlePaddingMm:.25,strokePt:.3},children};
}
function symbolBlock(shape,dashed=false){
  const paths=shape==='arrow'?(dashed?[...vectorArrow('solid',[[.2,1.1],[6.2,1.1]]),...vectorArrow('dashed',[[.2,3],[6.2,3]],true)]:arrow('direction',.2,2,6)):[icon(shape,.2,0)];
  return {kind:'composition',layout:'column',widthMm:7,gapMm:0,children:[{id:'extent',reserve:{widthMm:7,heightMm:4.3}}],frameDecorations:paths};
}
function symbolRow(id,shape,text,widthMm,dashed=false){
  return {id,spec:{kind:'composition',layout:'row',widthMm:widthMm-2.7,gapMm:1,rowAlign:'center',children:[
    {id:'symbol',widthMm:7,spec:symbolBlock(shape,dashed)},
    {id:'meaning',text,richText:{text,textAlign:'left',autoFit:false}}
  ]}};
}
function coreSpec(t,c) {
  return {...clone(t.native),setLabels:c.setLabels,regions:{A:c.regions[0],AB:c.regions[1],B:c.regions[2]}};
}

function legendSpec(t,c) {
  const w=t.legendBox[2];
  let children;
  if(t.family==='criticism'){
    const symbols=c.relations.length>2&&c.relations.every((v,i)=>v.codePointAt(0)===c.relations[0].codePointAt(0)+i)?c.relations[0]+'~'+c.relations.at(-1):c.relations.join('·');
    children=[symbolRow('direction-row','arrow',c.legend[0],w),{id:'symbols',text:`${symbols}\u2002: ${c.legend[1]}`}];
  }else if(t.family==='judgment')children=['rect','diamond','arrow','document'].map((shape,i)=>symbolRow(`row-${i}`,shape,c.legend[i],w,i===2));
  else children=c.legend.map((text,i)=>({id:`region-${i}`,text:`${c.regions[i]}\u2002: ${text}`}));
  return shell('legend',w,children);
}
function exampleSpec(t,c){
  const w=t.exampleBox[2],inner=Math.min(w-2.7,22),track=(inner-6)/2;
  const person=(id,value)=>({id,widthMm:track,spec:{kind:'composition',layout:'column',widthMm:track,gapMm:0,children:[{id:'top',reserve:{heightMm:1.2}},textChild('label',value,track),{id:'bottom',reserve:{heightMm:1.2}}],frameDecorations:[ellipsePath(id+'-circle',(track-5.6)/2,0,5.6,5.6)]}});
  const a=person('source',c.people[0]),b=person('target',c.people[1]);a.spec.children[1].richText.textAlign='center';b.spec.children[1].richText.textAlign='center';
  const mini={kind:'composition',layout:'row',widthMm:inner,gapMm:0,rowAlign:'center',children:[a,
    {id:'relation',widthMm:6,spec:{kind:'composition',layout:'column',widthMm:6,gapMm:.3,children:[{id:'symbol',text:c.relations[0],richText:{text:c.relations[0],textAlign:'center'}},{id:'arrow',reserve:{heightMm:2}}],frameDecorations:vectorArrow('example-arrow',[[.2,4],[5.8,4]])}},
    b
  ]};
  // The small exemplifying labels/arrows are content of the same auto-fit frame.
  return shell('example',w,[{id:'mini',widthMm:inner,spec:mini},{id:'caption',text:c.exampleCaption,richText:{text:c.exampleCaption,textAlign:'center',autoFit:false}}]);
}

function ellipsePath(id,x,y,w,h,strokePt=.3) {
  const k=.5522847498307936,rx=w/2,ry=h/2,cx=x+rx,cy=y+ry;
  return {id,layer:'front',stroke:'#000000',strokePt,fill:'none',path:[command('M',cx+rx,cy),
    {command:'C',control1:point(cx+rx,cy+k*ry),control2:point(cx+k*rx,cy+ry),...point(cx,cy+ry)},
    {command:'C',control1:point(cx-k*rx,cy+ry),control2:point(cx-rx,cy+k*ry),...point(cx-rx,cy)},
    {command:'C',control1:point(cx-rx,cy-k*ry),control2:point(cx-k*rx,cy-ry),...point(cx,cy-ry)},
    {command:'C',control1:point(cx+k*rx,cy-ry),control2:point(cx+rx,cy-k*ry),...point(cx+rx,cy)},{command:'Z'}]};
}
function vectorArrow(id,points,dashed=false,direction='forward',strokePt=.3) {
  let shaft=path(`${id}-shaft`,points,'none',strokePt);
  if(dashed){
    shaft.path=[];
    for(let i=1;i<points.length;i++){
      const [x,y]=points[i-1],dx=points[i][0]-x,dy=points[i][1]-y,len=Math.hypot(dx,dy);
      for(let d=0;d<len;d+=1.1){shaft.path.push(command('M',x+dx*d/len,y+dy*d/len),command('L',x+dx*Math.min(d+.65,len)/len,y+dy*Math.min(d+.65,len)/len));}
    }
  }
  if(direction==='none')return [shaft];
  const [x,y]=points.at(-1),[px,py]=points.at(-2),len=Math.hypot(x-px,y-py),ux=(x-px)/len,uy=(y-py)/len;
  return [shaft,path(`${id}-tip`,[[x,y],[x-ux*1.6-uy*.55,y-uy*1.6+ux*.55],[x-ux*1.6+uy*.55,y-uy*1.6-ux*.55]],'#000000',strokePt)];
}
function nodePath(n) {
  const {id,xMm:x,yMm:y,widthMm:w,heightMm:h}=n;
  if(n.shape==='circle')return ellipsePath(`node-${id}`,x,y,w,h,.4);
  if(n.shape==='diamond')return path(`node-${id}`,[[x,y+h/2],[x+w/2,y],[x+w,y+h/2],[x+w/2,y+h],[x,y+h/2]],'none',.4);
  if(n.shape==='document')return {id:`node-${id}`,layer:'front',stroke:'#000000',strokePt:.4,fill:'none',path:[command('M',x,y),command('L',x+w,y),command('L',x+w,y+h-1),{command:'C',control1:point(x+w*.65,y+h-4),control2:point(x+w*.35,y+h+2),...point(x,y+h-1)},{command:'Z'}]};
  return rectangle(`node-${id}`,x,y,w,h,.4);
}
function slotRow(id,columnWidth,slot){
  let left=Math.max(0,slot.x),width=Math.min(slot.width,columnWidth-left),right=columnWidth-left-width;
  if(left<1){width+=left;left=0;}if(right<1){width+=right;right=0;}
  const children=[];
  if(left>.001)children.push({id:'left',widthMm:left,reserve:{heightMm:slot.height}});
  // A measured one/two-line native frame plus physical trailing reservation
  // establishes this row. Preflight rejects any height change before execution.
  const text=textChild('literal',slot.text,width);text.richText.textAlign=slot.align??'center';
  const textHeight=slot.text.includes('\n')?6.858:3.189111111111111;
  const bottom=slot.height-textHeight;
  if(bottom<0)fail(`${id}: text frame exceeds fixed slot`);
  children.push({id:'text-track',widthMm:width,spec:{kind:'composition',layout:'column',widthMm:width,gapMm:0,children:[text,{id:'height',reserve:{heightMm:bottom}}]}});
  if(right>.001)children.push({id:'right',widthMm:right,reserve:{heightMm:slot.height}});
  return {id,spec:{kind:'composition',layout:'row',widthMm:columnWidth,gapMm:0,children}};
}
function fixedColumn(id,x,width,height,slots){
  let cursor=0;
  const children=[];
  for(const [i,slot] of slots.sort((a,b)=>a.y-b.y).entries()){
    if(slot.y<cursor-.02)fail(`${id}: overlapping text slots`);
    if(slot.y-cursor>.001)children.push({id:`gap-${i}`,reserve:{heightMm:slot.y-cursor}});
    children.push(slotRow(`slot-${slot.id}`,width,{...slot,x:slot.x-x}));cursor=slot.y+slot.height;
  }
  if(height-cursor>.001)children.push({id:'bottom',reserve:{heightMm:height-cursor}});
  if(cursor>height+.01)fail(`${id}: text slots exceed fixed height`);
  return {id,widthMm:width,spec:{kind:'composition',layout:'column',widthMm:width,gapMm:0,children}};
}
function fixedDrawing(t,c){
  const width=t.coreWidthMm,height=t.heightMm;
  const columns=t.columns.map(([x,w],i)=>({id:`column-${i}`,x,width:w,slots:[]}));
  const add=slot=>{
    const mid=slot.x+slot.width/2;
    const col=columns.find(col=>mid>=col.x-.001&&mid<=col.x+col.width+.001);
    if(!col)fail(`no text column for ${slot.id}`);
    const x=Math.max(col.x,Math.min(slot.x,col.x+col.width-slot.width));
    col.slots.push({...slot,x,width:Math.min(slot.width,col.width)});
  };
  const decorations=t.nodes.map(nodePath);
  for(const n of t.nodes){
    const text=n.index===null?c[n.slot]:c[n.slot][n.index],lines=text.split('\n').length;
    const slotHeight=lines===2?7.058:3.4;
    // The cubic's first upper extremum is h-1-sqrt(3)/2. Only the
    // flat rectangle above that extremum is available to the document label.
    // UND 8pt one-line ink center, measured in native inspection, is 1.60256mm
    // from its frame top. Keep the physical text size and the authored wave.
    const textY=n.shape==='document'
      ? n.yMm+(n.heightMm-1-Math.sqrt(3)/2)/2-1.602555794687379
      : n.yMm+(n.heightMm-slotHeight)/2;
    add({id:n.id,x:n.xMm+.7,y:textY,width:n.widthMm-1.4,height:slotHeight,text});
  }
  for(const e of t.arrows){
    decorations.push(...vectorArrow(e.id,e.points,e.dashed,e.direction,.4));
    if(e.labelBox){const [x,y,width,height]=e.labelBox;add({id:e.id,x,y,width,height,text:e.slot?c[e.slot][e.index]:c[e.labelSlot]});}
  }
  columns.sort((a,b)=>a.x-b.x);
  // Native declared tracks have a 1mm floor. Absorb sub-mm whitespace into
  // the preceding empty part of a text track, retaining the authored slot x.
  if(columns[0].x>0&&columns[0].x<1){columns[0].width+=columns[0].x;columns[0].x=0;}
  for(let i=1;i<columns.length;i++){
    const gap=columns[i].x-columns[i-1].x-columns[i-1].width;
    if(gap>0&&gap<1)columns[i-1].width+=gap;
  }
  const children=[];let cursor=0;
  for(const col of columns){
    if(col.x<cursor-.01)fail(`overlapping text columns ${col.id}`);
    if(col.x-cursor>.001)children.push({id:`gap-${col.id}`,widthMm:col.x-cursor,reserve:{heightMm:height}});
    children.push(fixedColumn(col.id,col.x,col.width,height,col.slots));cursor=col.x+col.width;
  }
  if(width-cursor>=1)children.push({id:'end',widthMm:width-cursor,reserve:{heightMm:height}});
  else if(width-cursor>.001){children.at(-1).widthMm+=width-cursor;children.at(-1).spec.widthMm+=width-cursor;}
  return {kind:'composition',layout:'row',widthMm:width,gapMm:0,children,frameDecorations:decorations};
}
// Only the known literal slots are erased. Every other field, including unknown
// additions, topology, widths, dashes and physical decoration points, survives.
function withoutContent(spec) {
  const s=clone(spec);
  if(s.kind==='schematic') {
    if(s.nodes) for(const node of s.nodes) {node.text='$content';if(node.richText)node.richText.text='$content';}
    if(s.edges) for(const edge of s.edges) if(Object.hasOwn(edge,'label')) edge.label='$content';
    if(s.layout==='venn') { s.setLabels=s.setLabels.map(()=>'$content'); for(const key of Object.keys(s.regions)) s.regions[key]='$content'; }
  }
  if(s.children) for(const child of s.children) { if(Object.hasOwn(child,'text')){child.text='$content';if(child.richText)child.richText.text='$content';} if(child.spec)child.spec=withoutContent(child.spec); }
  return s;
}

export function buildFixedStyle(request) {
  keys(request,['styleID','content','widthMm'],'request',['widthMm']);
  const external=externalFamily(request.styleID);if(external)return external.buildStyle(request);
  const t=sizedTemplate(template(request.styleID),request.widthMm),content=contentFor(t,request.content);
  if(t.family==='judgment'){
    // A lower decision may reach farther right than its text column. Reserve
    // the full vector extent before positioning the independent legend.
    t.coreWidthMm=Math.max(t.legendBox[0],...t.nodes.map(n=>n.xMm+n.widthMm),...t.columns.map(([x,w])=>x+w))+.12;
    t.legendBox[0]=t.coreWidthMm+1;
    t.legendBox[2]=t.widthMm-t.legendBox[0];
  }
  const core=t.family==='venn'?coreSpec(t,content):fixedDrawing(t,content),legend=legendSpec(t,content);
  let spec;
  const parts=[{id:'core',spec:core,maxHeightMm:t.family==='venn'?undefined:t.heightMm+.01},{id:'legend',spec:legend}];
  if(t.family==='criticism'){
    const example=exampleSpec(t,content);legend.legendFrame.contentAlign='center';example.legendFrame.contentAlign='center';parts.push({id:'example',spec:example,maxHeightMm:t.exampleBox[3]+1});
    spec={kind:'composition',layout:'row',widthMm:t.widthMm,gapMm:4,rowAlign:'center',children:[{id:'core',widthMm:t.coreWidthMm,spec:core},{id:'aside',widthMm:t.legendBox[2],spec:{kind:'composition',layout:'column',widthMm:t.legendBox[2],gapMm:2,sharedWidth:'max-content',children:[{id:'legend',spec:legend},{id:'example',spec:example}]}}]};
  }else if(t.family==='judgment'){
    spec={kind:'composition',layout:'row',widthMm:t.widthMm,gapMm:1,rowAlign:'top',children:[{id:'core',widthMm:t.coreWidthMm,spec:core},{id:'legend',widthMm:t.legendBox[2],spec:legend}]};
  }else{
    spec={kind:'composition',layout:'row',widthMm:t.widthMm,gapMm:10*t.scale,rowAlign:'center',children:[{id:'core',widthMm:t.native.widthMm,spec:core},{id:'legend',widthMm:t.legendBox[2],spec:legend}]};
  }
  // Read-only native probes for every fixed text row catch measured growth
  // before a column/whole drawing can move its later text slots.
  function probes(s,scope=''){
    for(const child of s.children??[])if(child.spec){
      if(child.id.startsWith('slot-')){
        const track=child.spec.children.find(c=>c.id==='text-track').spec;
        const text=track.children[0].text;
        const height=track.children[1].reserve.heightMm+(text.includes('\n')?6.858:3.189111111111111);
        parts.push({id:`text${scope}/${child.id}`,spec:child.spec,maxHeightMm:height});
      }else probes(child.spec,scope+'/'+child.id);
    }
  }
  probes(core);
  const geometry={spec:withoutContent(spec),topology:(t.edges??[]).map(({id,from,to,direction,dashed})=>({id,from,to,direction,dashed}))};
  return freeze({styleID:t.styleID,widthMm:t.widthMm,content:clone(content),spec,parts,geometry,geometrySignature:hash(geometry),requiresNativePreflight:true,visualReview:'pending'});
}

export function assertFixedGeometry(bundle) {
  if(!bundle || !bundle.styleID)fail('bundle required');
  const external=externalFamily(bundle.styleID);if(external)return external.assertGeometry(bundle);
  const expected=buildFixedStyle({styleID:bundle.styleID,widthMm:bundle.widthMm,content:bundle.content});
  if(JSON.stringify(withoutContent(bundle.spec))!==JSON.stringify(expected.geometry.spec) || JSON.stringify(bundle.geometry)!==JSON.stringify(expected.geometry) || bundle.geometrySignature!==expected.geometrySignature || JSON.stringify(bundle.parts)!==JSON.stringify(expected.parts))fail('geometry, topology, part, or style override detected; choose another styleID instead');
  // Literal changes belong in content and must be compiled again, never patched.
  if(JSON.stringify(bundle.spec)!==JSON.stringify(expected.spec))fail('spec content differs from declared slots');
  return true;
}

/** Resolve registered post-create appearance rules against actual native IDs.
 * Inspect again after applying commands. The caller owns revision and tool I/O. */
export function planFixedStyleAdjustments(bundle, inspect, options = {}) {
  assertFixedGeometry(bundle);
  const external=externalFamily(bundle.styleID);
  if(external?.postCreateCommands)return external.postCreateCommands(bundle,inspect,options);
  if(bundle.geometry?.nativeOverrides?.length)fail('registered native adjustment handler unavailable');
  return {commands:[],evidence:[]};
}

export async function preflightFixedStyle(bundle, planner) {
  const external=externalFamily(bundle?.styleID);if(external)return external.preflight(bundle,planner);
  assertFixedGeometry(bundle);
  if(typeof planner!=='function')fail('native planner(spec) callback required');
  const plans=[];
  for(const part of bundle.parts) {
    const plan=await planner(clone(part.spec));
    if(!plan || !Number.isFinite(plan.heightMm) || !Number.isFinite(plan.widthMm))fail(`${part.id}: native measurement unavailable`);
    if(part.maxHeightMm!==undefined && (part.id.startsWith('text')?Math.abs(plan.heightMm-part.maxHeightMm)>.02:plan.heightMm>part.maxHeightMm+.02))fail(`${part.id}: measured content exceeds fixed row height; retain geometry and revise content`);
    const warnings=(plan.warnings??[]).filter(w=>!(part.id==='core' && part.spec.layout==='venn' && /자료량에 비례하지 않습니다/.test(w)));
    if(warnings.length)fail(`${part.id}: native warnings ${warnings.join('; ')}`);
    if(part.maxContentHeightMm!==undefined) {
      const content=plan.layout?.children?.find(child=>child.id===`${part.id}-content`);
      if(!content || content.heightMm>part.maxContentHeightMm+.02)fail(`${part.id}: measured content exceeds fixed panel; retain geometry and revise content`);
    }
    if(part.spec.nodes) for(const node of part.spec.nodes) {
      const measured=plan.layout?.nodes?.find(n=>n.id===node.id);
      const expectedLines=node.text.split('\n').length;
      if(!measured || measured.lineCount!==expectedLines || measured.requiredHeightMm>node.heightMm+.02 || measured.minSingleLineWidthMm>node.widthMm+.02 && expectedLines===1)fail(`${part.id}/${node.id}: measured content does not fit fixed node`);
    }
    plans.push({id:part.id,plan});
  }
  const complete=await planner(clone(bundle.spec));
  const warnings=(complete?.warnings??[]).filter(w=>!(bundle.styleID==='venn-2-hatch.v1' && /자료량에 비례하지 않습니다/.test(w)));
  if(!complete || !Number.isFinite(complete.boundsMm?.widthMm) || complete.boundsMm.widthMm>bundle.widthMm+.15 || warnings.length)fail('complete native geometry exceeds requested width or has warnings');
  return {styleID:bundle.styleID,geometrySignature:bundle.geometrySignature,status:'passed',plans,complete,visualReview:'pending'};
}

// Compare native world geometry, not input hashes or local group coordinates.
// Glyph outlines/backings are content; their typography is still held fixed.
export function compareNativeFixedStyleGeometry(before,after) {
  function project(doc){
    if(!Array.isArray(doc?.objects)||!Array.isArray(doc.geometry)||!Array.isArray(doc.pathNodes))fail('full native inspect with geometry/pathNodes required');
    const geometry=new Map(doc.geometry.map(v=>[v.id,v])),paths=new Map(doc.pathNodes.map(v=>[v.id,v]));
    const structural=[],typography=[];
    const style=o=>Object.fromEntries(['stroke','fill','strokeWidth','strokeDashArray','scaleX','scaleY','angle','skewX','skewY','flipX','flipY','arrowStart','arrowEnd','vectoraArrowStart','vectoraArrowEnd'].map(k=>[k,o[k]]));
    function walk(objects,scope='root'){
      for(const [i,o] of objects.entries()){
        const key=`${scope}/${o.productionKey??o.productionRole??'object'}:${i}`;
        if(o.objects){walk(o.objects,key);continue;}
        if(/Text/i.test(o.type)||o.text!==undefined){
          typography.push({key,...Object.fromEntries(['fontFamily','fontSize','fontWeight','fontStyle','charSpacing','horizontalScale','vectoraLeadingPercent','scaleX','scaleY'].map(k=>[k,o[k]]))});continue;
        }
        if(/backing|halo/.test(o.productionRole??''))continue;
        const g=geometry.get(o.id),p=paths.get(o.id);if(!g)fail(`native geometry unavailable: ${key}`);
        structural.push({key,type:o.type,role:o.productionRole,geometry:g.geometry,paint:g.paint,path:p?{subpaths:p.subpaths,nodes:p.nodes}:undefined,style:style(o)});
      }
    }
    walk(doc.objects);return {structural,typography};
  }
  const a=project(before),b=project(after),differences=[];
  function compare(x,y,at){
    if(typeof x==='number'&&typeof y==='number'){if(Math.abs(x-y)>1e-5)differences.push({at,before:x,after:y});return;}
    if(Array.isArray(x)&&Array.isArray(y)){if(x.length!==y.length)differences.push({at:at+'.length',before:x.length,after:y.length});for(let i=0;i<Math.min(x.length,y.length);i++)compare(x[i],y[i],`${at}[${i}]`);return;}
    if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const key of new Set([...Object.keys(x),...Object.keys(y)]))compare(x[key],y[key],at+'.'+key);return;}
    if(x!==y)differences.push({at,before:x,after:y});
  }
  compare(a,b,'native');
  return {equal:differences.length===0,structuralObjects:a.structural.length,textObjects:a.typography.length,tolerance:1e-5,differences};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const args=process.argv.slice(2);
    if(args.length===1 && args[0]==='--list') process.stdout.write(JSON.stringify(listFixedStyles(),null,2)+'\n');
    else if(args.length===2 && args[0]==='--example') process.stdout.write(JSON.stringify({styleID:args[1],content:exampleContent(args[1])},null,2)+'\n');
    else if(args.length===2 && args[0]==='--request') process.stdout.write(JSON.stringify(buildFixedStyle(JSON.parse(readFileSync(args[1],'utf8'))),null,2)+'\n');
    else fail('usage: --list | --example styleID | --request input.json');
  } catch(error) { process.stderr.write(`${error.message}\n`); process.exitCode=1; }
}
