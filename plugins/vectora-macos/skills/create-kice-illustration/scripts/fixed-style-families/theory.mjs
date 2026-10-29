import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const clone=v=>structuredClone(v),json=v=>JSON.stringify(v);
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const asset=freeze(JSON.parse(readFileSync(new URL('../../assets/fixed-styles/theory-as-left-shift.v1.json',import.meta.url),'utf8')));
const fail=s=>{throw Error('FIXED_THEORY_CONSTRAINT: '+s);};
const hash=v=>createHash('sha256').update(json(v)).digest('hex');
function template(id){if(id!==asset.styleID)fail('unknown styleID '+id);return asset;}
function keys(v,allowed,required=allowed){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!allowed.includes(k))||required.some(k=>!Object.hasOwn(v,k)))fail('exact keys '+allowed.join(', '));}
function literal(v,key,max){if(typeof v!=='string'||v!==v.trim()||!v||/[\u0000-\u001f\u2028\u2029]/u.test(v)||[...v].length>max)fail(key+': bounded single-line literal');return v;}
function contentFor(c){keys(c,Object.keys(asset.example));const result={};for(const [key,s]of Object.entries(asset.slots)){if(s.count){if(!Array.isArray(c[key])||c[key].length!==s.count)fail(key+': exactly '+s.count+' slots');result[key]=c[key].map(v=>literal(v,key,s.maxCharacters));if(new Set(result[key]).size!==s.count)fail(key+': distinct slots required');}else result[key]=literal(c[key],key,s.maxCharacters);}return result;}
export function listStyles(){return freeze([{styleID:asset.styleID,family:asset.family,groupID:asset.groupID,recipe:asset.recipe,defaultWidthMm:asset.defaultWidthMm,minWidthMm:asset.minWidthMm,maxWidthMm:asset.maxWidthMm,contentKeys:Object.keys(asset.example),contentSlots:clone(asset.slots),requiresNativePreflight:true,requiresNativeFinalization:true,requiresPostCreateAdjustments:true}]);}
export function exampleContent(id){return clone(template(id).example);}
const text=(id,s,w)=>({id,text:s,widthMm:w,richText:{text:s,textProfile:'und-dotum-8-default-v1',fontPt:8,horizontalScale:100,leadingPercent:130,textAlign:'left',autoFit:false}});
function compile(width,c){
 const q=width/asset.defaultWidthMm,g=clone(asset.native);
 g.widthMm=width;g.plotHeightMm=asset.plotHeightMm*q;g.chartOptions.plotWidthMm=asset.plotWidthMm*q;
 g.series[0].label=c.curveNames[0];g.series[1].label=c.curveNames[1];
 g.xTitle=c.axisNames[1];g.yTitle=c.axisNames[0];
 // Native annotations supply editable source-backed label/line/arrow roles.
 // Their qualitative range coordinates only allocate the initial native
 // objects. Finalization positions glyph ink and removes unused range rules.
 g.chartOptions.semanticLabels='none';
 g.chartOptions.annotations=[
  ...[...c.valueSymbols,c.curveNames[1]].map(label=>({from:0,to:10,label,position:'above',arrow:'none'})),
  {from:10.5,to:13.5,label:c.originSymbol,position:'above',arrow:'start'},
  {from:0,to:10,label:c.curveNames[0],position:'above',arrow:'none'}
 ];
 return g;
}
export function buildStyle(request){
 keys(request,['styleID','content','widthMm'],['styleID','content']);template(request.styleID);
 const width=request.widthMm??asset.defaultWidthMm;
 if(typeof width!=='number'||!Number.isFinite(width)||width<asset.minWidthMm||width>asset.maxWidthMm)fail('widthMm: finite '+asset.minWidthMm+'..'+asset.maxWidthMm);
 const content=contentFor(request.content),spec=compile(width,content),geometry={spec:compile(width,Object.fromEntries(Object.entries(asset.example).map(([k,v])=>[k,Array.isArray(v)?v.map((_,i)=>'$'+k+i):'$'+k]))),nativeOverrides:[{target:'accepted-theory-ink-slots',version:1}],source:clone(asset.source)};
 const probes=[text('price-high',content.valueSymbols[0],8),text('price-low',content.valueSymbols[1],8),text('origin',content.originSymbol,5),...content.curveNames.map((v,i)=>text('curve-'+i,v,24)),...content.axisNames.map((v,i)=>text('axis-'+i,v,24))];
 const parts=probes.map(p=>({id:p.id,spec:{kind:'composition',layout:'column',widthMm:p.widthMm,gapMm:0,children:[{...p,id:'literal'}]},maxWidthMm:p.widthMm,maxHeightMm:3.209111111111111}));
 return freeze({styleID:asset.styleID,family:'theory',recipe:asset.recipe,sourceGroup:asset.groupID,widthMm:width,content,spec,parts,geometry,geometrySignature:hash(geometry),requiresNativePreflight:true,requiresNativeFinalization:true,requiresPostCreateAdjustments:true,visualReview:'pending'});
}
export function assertGeometry(b){if(!b?.styleID)fail('bundle required');const expected=buildStyle({styleID:b.styleID,widthMm:b.widthMm,content:b.content});for(const k of Object.keys(expected))if(k!=='visualReview'&&json(b[k])!==json(expected[k]))fail('geometry, content or style override detected: '+k);return true;}
export async function preflight(b,planner){
 assertGeometry(b);if(typeof planner!=='function')fail('native planner(spec) required');const plans=[];
 for(const p of b.parts){const m=await planner(clone(p.spec));if(!Number.isFinite(m?.widthMm)||!Number.isFinite(m?.heightMm)||m.widthMm<=0||m.heightMm<=0)fail(p.id+': native measurement unavailable');if(m.widthMm>p.maxWidthMm+.02||m.heightMm>p.maxHeightMm+.02||m.warnings?.length)fail(p.id+': content exceeds fixed slot; no automatic resizing');plans.push({id:p.id,plan:m});}
 return{styleID:b.styleID,widthMm:b.widthMm,status:'passed',geometrySignature:b.geometrySignature,plans,requiresNativeGenerationReview:true,requiresPostCreateAdjustments:true,scope:'Text-slot measurements only. Create/update the graph, inspect, apply postCreateCommands, inspect, save/reopen and review actual JPEG.'};
}

/** Existing planFixedStyleAdjustments dispatch contract. Apply after create or
 * content/width update, always from a fresh full inspection. No I/O or mutation. */
export function postCreateCommands(b,inspect,{componentId}={}){
 assertGeometry(b);if(!Array.isArray(inspect?.production?.components)||!Array.isArray(inspect.geometry)||!Array.isArray(inspect.objects))fail('full native inspect required');
 const components=inspect.production.components,flat=os=>os.flatMap(o=>[o,...flat(o.objects??[])]),objects=flat(inspect.objects);
 const graphs=components.filter(c=>c.kind==='graph'&&(componentId===undefined||c.id===componentId));
 if(graphs.length!==1)fail('exactly one native graph; specify graph componentId');const graph=graphs[0];
 const owner=graph;
 function sourceMatches(expected,actual){if(Array.isArray(expected))return Array.isArray(actual)&&expected.length===actual.length&&expected.every((v,i)=>sourceMatches(v,actual[i]));if(expected&&typeof expected==='object')return actual&&typeof actual==='object'&&Object.entries(expected).every(([k,v])=>sourceMatches(v,actual[k]));return expected===actual;}
 if(!sourceMatches(b.spec,graph.spec))fail('owner source differs from compiled slots; update the graph first');
 const commands=[],evidence=[];
 const geom=(c,key,ink=false)=>{const id=c.roles?.[key]?.id,g=inspect.geometry.find(g=>g.id===id);if(!id||!g?.geometry||!['xMm','yMm','widthMm','heightMm'].every(k=>Number.isFinite(g.geometry[k]))||ink&&(!g.inkBounds||!['xMm','yMm','widthMm','heightMm'].every(k=>Number.isFinite(g.inkBounds[k]))))fail('missing native geometry/ink '+key);return g;};
 // Physical font/stroke promises require unscaled, unrotated native trees.
 function checkTree(os,active=false){for(const o of os){const inside=active||o.id===owner.objectId;if(inside&&(Math.abs((o.scaleX??1)-1)>1e-7||Math.abs((o.scaleY??1)-1)>1e-7||Math.abs(o.angle??0)>1e-7||o.flipX||o.flipY||Math.abs(o.skewX??0)+Math.abs(o.skewY??0)>1e-7))fail('unscaled native owner and children required');if(o.objects)checkTree(o.objects,inside);}}checkTree(inspect.objects);
 const ax=geom(graph,'graph:x-axis').geometry,ay=geom(graph,'graph:y-axis').geometry;
 const q=b.widthMm/asset.defaultWidthMm;
 if(Math.abs(ax.widthMm-asset.plotWidthMm*q)>.02||Math.abs(ay.heightMm-asset.plotHeightMm*q)>.02)fail('native plot geometry differs from fixed width');
 const at=(x,y)=>({x:ay.xMm+x*ax.widthMm,y:ax.yMm-y*ay.heightMm});
 const move=(g,x,y)=>{if(Math.abs(g.geometry.xMm-x)>1e-6||Math.abs(g.geometry.yMm-y)>1e-6)commands.push({type:'select',ids:[g.id]},{type:'transform',values:{x,y}});};
 const high=geom(graph,'graph:label:annotation-label-above-0',true),low=geom(graph,'graph:label:annotation-label-above-1',true),origin=geom(graph,'graph:label:annotation-label-above-3',true),demand=geom(graph,'graph:label:annotation-label-above-4',true),supply=geom(graph,'graph:label:annotation-label-above-2',true);
 for(const [g,index]of [[high,0],[low,1]]){const p=geom(graph,'graph:projection-'+index).geometry;move(g,g.geometry.xMm+ay.xMm-1.45-g.inkBounds.xMm-g.inkBounds.widthMm,g.geometry.yMm+p.yMm-g.inkBounds.yMm-g.inkBounds.heightMm/2);}
 move(origin,origin.geometry.xMm+ay.xMm-1.75-origin.inkBounds.xMm-origin.inkBounds.widthMm,origin.geometry.yMm+ax.yMm-origin.inkBounds.yMm-origin.inkBounds.heightMm/2);
 for(const [g,x]of [[demand,.2],[supply,.8]]){const p=at(x,.9);move(g,g.geometry.xMm+p.x-g.inkBounds.xMm-g.inkBounds.widthMm/2,g.geometry.yMm+p.y-.85-g.inkBounds.yMm-g.inkBounds.heightMm);}
 const yt=geom(graph,'graph:y-title',true),ya=geom(graph,'graph:y-axis-arrow').geometry,xt=geom(graph,'graph:label:x-title',true);
 move(yt,yt.geometry.xMm+ya.xMm-.7-yt.inkBounds.xMm-yt.inkBounds.widthMm,yt.geometry.yMm+ya.yMm-.7-yt.inkBounds.yMm);
 move(xt,xt.geometry.xMm,xt.geometry.yMm+ax.yMm+.85-xt.inkBounds.yMm);
 const tip=at(.525,.73),shaft=geom(graph,'graph:annotation-above-3'),head=geom(graph,'graph:annotation-above-3-start');
 move(shaft,tip.x,tip.y);move(head,tip.x,tip.y-head.geometry.heightMm/2);
 const shaftObject=objects.find(o=>o.id===shaft.id);
 if(Math.abs(shaftObject.strokeWidth*.75-.5)>1e-6)commands.push({type:'select',ids:[shaft.id]},{type:'style',values:{strokeWidth:.5}});
 // Only annotation allocation rules and unused auto-name/leader objects are
 // removed. Native curves, projections, source labels and ownership remain.
 for(const [key,role] of Object.entries(graph.roles??{}))if(/^graph:annotation-above-[0124]$/.test(key)||/^graph:annotation-guide/.test(key)||key==='graph:series:shift:end-label'||key==='graph:series:supply:end-label'||/leader$/.test(key)){
  if(inspect.geometry.some(g=>g.id===role.id))commands.push({type:'select',ids:[role.id]},{type:'delete'});
 }
 for(const g of [high,low,origin,demand,supply,shaft,head]){const o=objects.find(o=>o.id===g.id);if(!o?.productionKey||!g.componentId)fail('supplement lacks persisted native owner '+g.id);evidence.push({id:g.id,key:o.productionKey,ownerComponentId:owner.id,graphComponentId:graph.id,inspectionComponentId:g.componentId,sourceOwned:true,editable:true});}
 return{commands,evidence};
}
