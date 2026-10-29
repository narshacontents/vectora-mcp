import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const ids=['chart-population-pyramid.v1','chart-age-population-sexratio.v1','chart-city-rank.v1','chart-season-temperature.v1','chart-supply-demand-grid.v1'];
const clone=v=>structuredClone(v),json=v=>JSON.stringify(v),hash=v=>createHash('sha256').update(json(v)).digest('hex');
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const templates=new Map(ids.map(id=>[id,freeze(JSON.parse(readFileSync(new URL(`../../assets/fixed-styles/${id}.json`,import.meta.url),'utf8')))]));
function fail(s){throw Error('FIXED_CHART_CONSTRAINT: '+s);}
function template(id){const t=templates.get(id);if(!t)fail('unknown styleID '+id);return t;}
function sizedTemplate(base,widthMm=base.defaultWidthMm??base.widthMm){
 if(typeof widthMm!=='number'||!Number.isFinite(widthMm)||widthMm<base.minWidthMm||widthMm>base.maxWidthMm)fail('widthMm: finite '+base.minWidthMm+'..'+base.maxWidthMm);
 const t=clone(base),q=widthMm/base.geometryWidthMm;t.widthMm=widthMm;t.sizeRatio=q;
 if(t.plotWidthMm!==undefined)t.plotWidthMm=t.type==='mixed'?widthMm-(base.geometryWidthMm-base.plotWidthMm):base.plotWidthMm*q;
 if(t.type!=='mirror')t.plotHeightMm*=q;
 if(t.rightSpine){t.rightSpine.x*=q;t.rightSpine.bottom=t.rightSpine.top+t.plotHeightMm;}
 for(const rule of t.nativeOverrides??[]){
  if(rule.target==='graph-origin'){rule.axisXmm=4+(rule.axisXmm-4)*q;/* header text retains physical size */}
  if(rule.target==='fixed-x-axis-extension')rule.lengthMm*=q;
  if(rule.target==='pyramid-horizontal-panel'){
   const side=(widthMm-18)/2;rule.leftBaselineXmm=4+side-rule.nativeBoundsInsetMm;rule.rightBaselineXmm=4+side+18+rule.nativeBoundsInsetMm;
   rule.pitchMm=3.4*q;rule.barHeightMm=3.39*q;rule.femaleCaptionXmm=widthMm+1;
  }
 }
 return t;
}
function keys(v,expected,name){if(!v||Array.isArray(v)||typeof v!=='object'||Object.keys(v).length!==expected.length||expected.some(k=>!Object.hasOwn(v,k)))fail(name+': exactly keys '+expected.join(', '));}
function literal(v,name,max=20){if(typeof v!=='string'||!v.trim()||v!==v.trim()||/[\u0000-\u001f\u2028\u2029]/u.test(v)||[...v].length>max)fail(name+': bounded single-line literal');return v;}
function choice(v,options,name){if(!options.includes(v))fail(name+': allowed '+options.join(', '));return v;}
function values(v,n,max,name){if(!Array.isArray(v)||v.length!==n||v.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>max))fail(name+`: exactly ${n} finite values in 0..${max}`);return [...v];}
function contentFor(t,c){
 keys(c,Object.keys(t.example),'content');
 if(t.type==='supply-demand'){
  const yMax=c.yMax;if(typeof yMax!=='number'||!Number.isFinite(yMax)||yMax<1||yMax>10000)fail('yMax: finite 1..10000');
  const supply=values(c.supply,2,yMax,'supply'),demand=values(c.demand,2,yMax,'demand');
  if(supply[1]!==yMax||supply[0]>yMax/4||demand[1]!==0||demand[0]<yMax*.75)fail('line endpoints exceed fixed end-label scaffold');
  return {yMax,quantityUnit:literal(c.quantityUnit,'quantityUnit',8),supplyLabel:literal(c.supplyLabel,'supplyLabel',16),demandLabel:literal(c.demandLabel,'demandLabel',16),supply,demand,priceTitle:literal(c.priceTitle,'priceTitle',16),quantityTitle:literal(c.quantityTitle,'quantityTitle',8)};
 }
 const panel=literal(c.panel,'panel',6);
 if(t.type==='mirror')return{panel,male:values(c.male,18,6,'male'),female:values(c.female,18,6,'female')};
 if(t.type==='mixed'){
  const p=values(c.population,21,12,'population'),r=values(c.sexRatio,21,300,'sexRatio');
  if(p.slice(-4).some(x=>x>8)||r.slice(-4).some(x=>x>180))fail('last four observations exceed fixed legend clearance');
  return{panel,population:p,sexRatio:r,year:literal(c.year,'year',12),source:literal(c.source,'source',24),populationLabel:literal(c.populationLabel,'populationLabel',8),sexRatioLabel:literal(c.sexRatioLabel,'sexRatioLabel',8)};
 }
 if(!Array.isArray(c.categories)||c.categories.length!==4)fail('categories: exactly 4 labels');const categories=c.categories.map((s,i)=>literal(s,'categories['+i+']',6));if(new Set(categories).size!==4)fail('categories: labels must be unique');return{panel,values:values(c.values,4,t.type==='column'?100:30,'values'),categories};
}
export function listStyles(){return freeze(ids.map(styleID=>{const t=template(styleID);return{styleID,groupID:t.groupID,family:'charts',recipe:t.recipe,widthMm:t.defaultWidthMm,defaultWidthMm:t.defaultWidthMm,minWidthMm:t.minWidthMm,maxWidthMm:t.maxWidthMm,plotHeightMm:sizedTemplate(t).plotHeightMm,contentKeys:Object.keys(t.example),contentSlots:clone(t.contentSlots),nativeLimitation:clone(t.nativeLimitation??null),requiresNativePreflight:true};}));}
export function exampleContent(id){return clone(template(id).example);}
const xy=(x,y)=>({x:{ratio:0,offsetMm:x},y:{ratio:0,offsetMm:y}});
function path(id,pts,fill='none',strokePt=.3){return{id,layer:'front',stroke:'#000000',strokePt,fill,path:pts.map(([x,y],i)=>({command:i?'L':'M',...xy(x,y)})).concat(fill==='none'?[]:[{command:'Z'}])};}
const rect=(id,x,y,w,h,fill)=>path(id,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],fill,.2);
const reserve=(id,heightMm)=>({id,reserve:{heightMm}});
const text=(id,s,widthMm,align='center')=>({id,text:s,widthMm,richText:{text:s,textProfile:'und-dotum-8-default-v1',fontPt:8,leadingPercent:130,textAlign:align,autoFit:false}});
const column=(widthMm,children,gapMm=0)=>({kind:'composition',layout:'column',widthMm,gapMm,children});
const row=(widthMm,children,gapMm=0)=>({kind:'composition',layout:'row',widthMm,gapMm,children});
const H=3.189111111111111;
function fixedColumn(w,h,slots){
 let y=0;const children=[];
 for(const slot of slots){
  if(slot.y<y-.0001)fail('fixed label rows overlap');
  const gap=slot.y-y;
  if(gap>=.1)children.push(reserve('gap-'+slot.id,gap));
  else if(gap>1e-7){
   // Move an internal sub-minimum gap into the preceding blank allocation.
   // Its following label and total allocation stay fixed; no height is added.
   const previous=children.findLast(child=>child.reserve);
   if(!previous)fail('small fixed label gap needs an adjacent blank allocation');
   previous.reserve.heightMm+=gap;
  }
  children.push(text(slot.id,slot.text,w,slot.align));y=slot.y+H;
 }
 if(y>h+.0001)fail('fixed labels exceed height');
 const tail=h-y,mergedTailMm=tail>1e-7&&tail<.1?tail:0;
 if(tail>=.1)children.push(reserve('tail',tail));
 // A short trailing blank joins the next outer clearance, preserving every
 // label, the following tick row, and the complete composition's height.
 return{spec:column(w,children),mergedTailMm};
}
function pyramid(t,c){
 const q=t.sizeRatio,top=8,pitch=3.4*q,bottom=top+18*pitch,sideWidth=(t.widthMm-18)/2,left=sideWidth,right=left+18,span=sideWidth-5,height=bottom+6.8;
 const dec=[];
 const tickSlots=[{x:left-span,s:'6'},{x:left-span/3*2,s:'4'},{x:left-span/3,s:'2'},{x:left,s:'0'},{x:t.widthMm/2,s:'(%)',w:11},{x:right,s:'0'},{x:right+span/3,s:'2'},{x:right+span/3*2,s:'4'},{x:right+span,s:'6'}];
 const tickChildren=[];let cursor=0;for(const [i,slot]of tickSlots.entries()){const w=slot.w??3,start=slot.x-w/2;if(start>cursor)tickChildren.push({id:'tick-gap-'+i,widthMm:start-cursor,reserve:{heightMm:H}});tickChildren.push(text('tick-'+i,slot.s,w));cursor=start+w;if(i!==4)dec.push(path('tick-'+i,[[slot.x,bottom],[slot.x,bottom+.65]],'none',.2));}if(cursor<t.widthMm)tickChildren.push({id:'tick-tail',widthMm:t.widthMm-cursor,reserve:{heightMm:H}});
 const ages=Array.from({length:18},(_,i)=>i===0?'85세 이상':`${85-i*5}~${89-i*5}`);
 const bars=(id,values,fill)=>({kind:'graph',type:'bar',chartStyle:'bar',styleProfile:'kice',widthMm:span+.14111111111111,plotHeightMm:18*pitch,dataFidelity:'exact',categories:ages,series:[{id,label:id==='male'?'남':'여',values:[...values],fill}],domain:[0,6],ticks:[0,2,4,6],legend:'none',grid:false,valueLabels:false,strokePt:.2,chartOptions:{compact:true,barWidthMm:3.39*q,showXAxis:true,showYAxis:true,showXTicks:false,showYTicks:false,showCategoryLabels:false,showYLabels:false,axisArrows:false}});
 const side=(id,name,values,fill,align)=>column(sideWidth,[{id:'bars',widthMm:span+.14111111111111,spec:bars(id,values,fill)},text('sex',name,3,align)]);
 const labels=[{id:'panel',text:c.panel,y:0,align:'center'}];for(let i=0;i<18;i++){const age=85-i*5;if(i===0||i%2===1)labels.push({id:'age'+i,text:i===0?'85세 이상':`${age}~${age+4}`,y:top+i*pitch+(pitch-H)/2-(i===0?Math.max(0,H-pitch):0),align:'center'});}
 const ageColumn=fixedColumn(18,bottom+Math.max(.08,(H-pitch)/2),labels);
 const plot=row(t.widthMm,[{id:'male',widthMm:sideWidth,spec:side('male','남',c.male,'#CCCCCC','left')},{id:'ages',widthMm:18,spec:ageColumn.spec},{id:'female',widthMm:sideWidth,spec:side('female','여',c.female,'#AAAAAA','right')}]);
 return {...column(t.widthMm,[{id:'plot',spec:plot},reserve('tick-clearance',1+ageColumn.mergedTailMm),{id:'ticks',spec:row(t.widthMm,tickChildren)},reserve('bottom',height-bottom-Math.max(.08,(H-pitch)/2)-1-H)]),frameDecorations:dec};
}
function graphBase(t){return{kind:'graph',styleProfile:'kice',widthMm:t.widthMm,plotHeightMm:t.plotHeightMm,dataFidelity:'exact',strokePt:.3,legend:'none',grid:true,valueLabels:false,chartOptions:{plotWidthMm:t.plotWidthMm,axisStrokePt:.4,guideStrokePt:.2,axisArrows:false,showXTicks:false,showYTicks:false,labelRotation:0,labelPolicy:'all',gridStyle:'dash',zeroLineStyle:'solid'}};}
function makeSpec(t,c){
 if(t.type==='mirror')return pyramid(t,c);
 let g=graphBase(t);
 if(t.type==='column'){g={...g,type:'bar',chartStyle:'column',categories:c.categories,domain:[0,100],ticks:[0,20,40,60,80,100],series:[{id:'population',label:'인구',values:c.values,fill:'#AAAAAA'}],chartOptions:{...g.chartOptions,frame:'box',barWidthMm:5,title:c.panel}};}
 else if(t.type==='scatter'){g={...g,type:'bar',chartStyle:'bar-scatter',categories:c.categories,domain:[0,30],ticks:[0,5,10,15,20,25,30],yUnit:'(℃)',grid:false,series:[{id:'temperature',label:'기온',values:c.values,marker:'circle',renderRole:'scatter',fill:'#000000'}],chartOptions:{...g.chartOptions,frame:'none',title:c.panel+' 시기',markerSizeMm:1,showYTicks:true,axisTicks:{y:{direction:'in',lengthMm:.7}},horizontalReferences:[10,20,30].map(value=>({id:'reference-'+value,value,line:'dash'}))}};}
 else if(t.type==='mixed'){
 const cats=Array.from({length:21},(_,i)=>i===20?'100세 이상':`${i*5}~${i*5+4}`);
 g={...g,fontPt:t.graphFontPt,type:'bar',chartStyle:'bar-scatter',categories:cats,domain:[0,12],ticks:[0,2,4,6,8,10,12],yUnit:'(%)',legend:'inside',grid:false,series:[{id:'population',label:c.populationLabel,renderRole:'bar',axis:'primary',fill:'#AAAAAA',values:c.population},{id:'sex-ratio',label:c.sexRatioLabel,renderRole:'line',axis:'secondary',marker:'none',fill:'#000000',values:c.sexRatio}],strokePt:.8,chartOptions:{...g.chartOptions,categoryTextDirection:'vertical',categoryVerticalNumericGrouping:'digits-2-3',frame:'box',secondaryDomain:[0,300],secondaryTicks:[0,50,100,150,200,250,300],legendAnchor:'top-right',legendArrangement:'vertical',legendSwatch:'rect',barWidthMm:1.5,showYTicks:true,axisTicks:{y:{direction:'in',lengthMm:.7},secondaryY:{direction:'in',lengthMm:.7}},title:c.panel}};
 return column(t.widthMm,[{id:'plot',spec:g},{id:'footer',spec:row(t.widthMm,[text('year',c.year,t.widthMm/2,'left'),text('source',c.source,t.widthMm/2,'right')])}],1);
 }else{
 g={...g,type:'line',chartStyle:'line',categories:['0','20'],xValues:[0,20],xDomain:[0,20],xTicks:Array.from({length:11},(_,i)=>i*2),domain:[0,c.yMax],ticks:Array.from({length:10},(_,i)=>(i+1)*c.yMax/10),yTitle:c.priceTitle,xTitle:`${c.quantityTitle}(${c.quantityUnit})`,series:[{id:'supply',label:c.supplyLabel,values:c.supply,marker:'none',fill:'#000000'},{id:'demand',label:c.demandLabel,values:c.demand,marker:'none',fill:'#000000'}],strokePt:.8,chartOptions:{...g.chartOptions,axisTextLayout:'end-reserved',xNumeric:true,xGrid:true,axisArrows:true,axisText:{x:{placement:'tip'},y:{placement:'tip'}},axisTipExtensionMm:{x:7,y:3},lineEndLabels:true}};
 }
 if(t.type==='scatter')return {...column(t.widthMm,[{id:'plot',spec:g}]),frameDecorations:[path('right-spine',[[t.rightSpine.x,t.rightSpine.top],[t.rightSpine.x,t.rightSpine.bottom]],'none',.4),...[1,2,3].map(n=>path('category-tick-'+n,[[t.rightSpine.x-t.plotWidthMm+n*t.plotWidthMm/4,t.rightSpine.bottom],[t.rightSpine.x-t.plotWidthMm+n*t.plotWidthMm/4,t.rightSpine.bottom-.7]],'none',.2))]};
 return g;
}
// Only declared content fields are projected out. Structural/style fields, arrays,
// generated paths and every slot's dimensions remain committed by this bundle.
function scaffold(t){const c=clone(t.example),s=makeSpec(t,c);function strip(v){if(!v||typeof v!=='object')return v;if(Array.isArray(v))return v.map(strip);const o={};for(const[k,x]of Object.entries(v)){if(k==='categories')o[k]=x.map(()=>'<slot>');else if(['text','values','title','label'].includes(k))o[k]='<slot>';else if(k==='richText'){o[k]={...strip(x),text:'<slot>'};}else if(t.type==='mirror'&&k==='frameDecorations'){o[k]=x.filter(p=>!/^male-|^female-/.test(p.id));}else o[k]=strip(x);}return o;}return{spec:strip(s),nativeOverrides:clone(t.nativeOverrides??[]),nativeLimitation:clone(t.nativeLimitation??null),dataRule:t.type==='mirror'?{nativePanels:2,rows:18,plotHeightMm:61.2*t.sizeRatio,domain:[0,6],millimetersPerValue:((t.widthMm-18)/2-5)/6,markHeightMm:3.39*t.sizeRatio}:null};}
function measurementParts(t,c){const parts=[];const add=(id,s,w,h=H+.02)=>parts.push({id,spec:column(w,[text('literal',s,w)]),maxWidthMm:w,maxHeightMm:h});if(t.type==='supply-demand'){add('price-title',c.priceTitle,22);add('quantity-title',`${c.quantityTitle}(${c.quantityUnit})`,24);add('supply-label',c.supplyLabel,16);add('demand-label',c.demandLabel,16);for(let i=0;i<11;i++)add('y-tick-'+i,String(i*c.yMax/10),7);}else{add('panel',c.panel+(t.type==='scatter'?' 시기':''),t.type==='mirror'?16:26);if(t.type==='mixed'){add('year',c.year,t.widthMm/2);add('source',c.source,t.widthMm/2);add('legend-population',c.populationLabel,9);add('legend-ratio',c.sexRatioLabel,9);
 const plot=makeSpec(t,c).children[0].spec,slotWidth=t.plotWidthMm/21-.2;
 for(const [i,label]of plot.categories.entries()){
  const heightMm=(label.match(/[0-9]{1,3}|[^0-9]/gu)??[]).length*t.graphFontPt*25.4/72+.5;
  parts.push({id:'vertical-category-'+i,spec:column(slotWidth,[{id:'literal',spec:{kind:'verticalText',text:label,verticalNumericGrouping:'digits-2-3',widthMm:slotWidth,heightMm,textProfile:'und-dotum-8-default-v1',fontPt:t.graphFontPt,leadingPercent:130,autoFit:false}}]),maxWidthMm:slotWidth,maxHeightMm:heightMm});
 }
 }if(t.type==='mirror')add('oldest','85세 이상',16);if(c.categories)c.categories.forEach((s,i)=>add('category-'+i,s,t.plotWidthMm/4-1));}return parts;}
export function buildStyle(request){keys(request,Object.hasOwn(request,'widthMm')?['styleID','content','widthMm']:['styleID','content'],'request');const t=sizedTemplate(template(request.styleID),request.widthMm),content=contentFor(t,request.content),geometry=scaffold(t);return freeze({styleID:t.styleID,widthMm:t.widthMm,content,spec:makeSpec(t,content),parts:measurementParts(t,content),geometry,geometrySignature:hash(geometry),requiresNativePreflight:true,recipe:t.recipe});}
export function assertGeometry(bundle){if(!bundle?.styleID)fail('bundle required');const expected=buildStyle({styleID:bundle.styleID,content:bundle.content,widthMm:bundle.widthMm});for(const k of ['widthMm','spec','parts','geometry','geometrySignature','requiresNativePreflight','recipe'])if(json(bundle[k])!==json(expected[k]))fail('geometry, content or style override detected: '+k);return true;}
export async function preflight(bundle,planner){assertGeometry(bundle);if(typeof planner!=='function')fail('native planner(spec) required');const plans=[];for(const p of bundle.parts){const measured=await planner(clone(p.spec));if(!measured||!Number.isFinite(measured.widthMm)||!Number.isFinite(measured.heightMm)||measured.widthMm<=0||measured.heightMm<=0)fail(p.id+': native measurement unavailable');if(measured.widthMm>p.maxWidthMm+.02||measured.heightMm>p.maxHeightMm+.02||(measured.warnings?.length??0)>0)fail(p.id+': content exceeds fixed slot; no automatic resizing');plans.push({id:p.id,plan:measured});}return{styleID:bundle.styleID,status:'passed',widthMm:bundle.widthMm,geometrySignature:bundle.geometrySignature,scope:'Native text-slot preflight only; ordinary graphs have no read-only native planner. Native generation, scaffold comparison and JPEG review remain required.',plans,requiresNativeGenerationReview:true};}

// Mandatory after native create AND every content update. Parts remain probes;
// all executable role resolution lives here, never in an artifact dependency.
export function postCreateCommands(bundle,inspect,{componentId}={}){
 assertGeometry(bundle);const rules=bundle.geometry.nativeOverrides;
 if(!rules.length)return{commands:[],evidence:[]};
 if(!Array.isArray(inspect?.production?.components)||!Array.isArray(inspect.geometry))fail('full native inspect production/geometry required');
 const graphs=inspect.production.components.filter(c=>c.kind==='graph'&&(componentId===undefined||c.id===componentId));
 if(graphs.length!==1)fail('exactly one native graph owner required; specify componentId when multiple graphs exist');
 const c=graphs[0],commands=[],evidence=[];
 const geom=(key,ink=false)=>{const id=c.roles?.[key]?.id,g=inspect.geometry.find(g=>g.id===id);if(!id||!g?.geometry||!['xMm','yMm','widthMm','heightMm'].every(k=>Number.isFinite(g.geometry[k]))||ink&&(!g.inkBounds||!['xMm','yMm','widthMm','heightMm'].every(k=>Number.isFinite(g.inkBounds[k]))))fail('missing native role/geometry '+key);return g;};
 const move=(id,values)=>commands.push({type:'select',ids:[id]},{type:'transform',values});
 function groupBounds(id,allowFlip=false){
  let chain;
  function find(objects,parents=[]){for(const o of objects??[])if(o.objects){if(o.id===id)chain=[...parents,o];else find(o.objects,[...parents,o]);}}find(inspect.objects);if(!chain)fail('native graph owner group unavailable');
  let cx=0,cy=0,result;
  for(const o of chain){if(o.originX!=='left'||o.originY!=='top'||o.scaleX!==1||o.scaleY!==1||Math.abs(o.angle??0)>1e-8||o.flipY||o.flipX&&!(allowFlip&&o.id===id)||Math.abs(o.skewX??0)+Math.abs(o.skewY??0)>1e-8||o.strokeWidth!==0)fail('post-create graph requires unscaled translated native groups');if(![o.left,o.top,o.width,o.height].every(Number.isFinite))fail('group world geometry unavailable');const left=cx+o.left,top=cy+o.top;result={x:left*25.4/96,y:top*25.4/96,width:o.width*25.4/96,height:o.height*25.4/96,flipX:!!o.flipX};cx=left+o.width/2;cy=top+o.height/2;}
  return result;
 }
 for(const rule of rules){
  if(rule.target==='pyramid-horizontal-panel'){
   const series=c.spec?.series?.[0],sex=series?.id;
   if(!['male','female'].includes(sex)||c.spec.series.length!==1||c.spec.chartStyle!=='bar'||c.spec.categories?.length!==18||series.values?.length!==18)fail('native 18-category horizontal sex panel required');
   const axis=geom('graph:y-axis'),bounds=groupBounds(c.objectId,true),needFlip=sex==='male';
   if(bounds.flipX!==needFlip)commands.push({type:'select',ids:[c.objectId]},{type:'flipX'});
   const predictedBaseline=needFlip?(bounds.flipX?axis.geometry.xMm:2*(bounds.x+bounds.width/2)-axis.geometry.xMm):axis.geometry.xMm;
   const desiredBaseline=needFlip?rule.leftBaselineXmm:rule.rightBaselineXmm;
   const dx=desiredBaseline-predictedBaseline,dy=rule.topMm-axis.geometry.yMm;
   if(Math.abs(dx)+Math.abs(dy)>1e-7)move(c.objectId,{x:bounds.x+dx+rule.nativeBoundsInsetMm,y:bounds.y+dy+rule.nativeBoundsInsetMm});
   const parent=inspect.production.components.find(p=>p.roles?.['composition:child:bars']?.id===c.objectId),captionId=parent?.roles?.['composition:child:sex']?.id,caption=inspect.geometry.find(g=>g.id===captionId);
   if(!caption?.geometry)fail('native sex caption unavailable');move(captionId,{x:sex==='male'?rule.maleCaptionXmm:rule.femaleCaptionXmm,y:rule.captionYmm});
   evidence.push({target:rule.target,componentId:c.id,sex,nativeBarCount:Object.keys(c.roles).filter(k=>k.includes(':bar-segment-')).length,positiveValuesPreserved:true,horizontalFlip:needFlip,deltaX:dx,deltaY:dy});
  }else if(rule.target==='population-bars-and-legend-swatch'){
   const entries=Object.entries(c.roles).filter(([key])=>key.startsWith('graph:series:population:')&&(/:bar-segment-\d+(?::\d+)?$/.test(key)||key.endsWith(':legend-swatch')));
   if(entries.length!==22)fail('expected 21 native population bars and one legend swatch');
   for(const[key,r]of entries){geom(key);commands.push({type:'select',ids:[r.id]},{type:'style',values:{strokeWidth:rule.strokePt}});}evidence.push({target:rule.target,strokePt:rule.strokePt,objectIds:entries.map(([,r])=>r.id)});
  }else if(rule.target==='y-unit'){
   const unit=geom('graph:label:unit',true),tick=geom('graph:y-tick-label-30',true),dy=tick.inkBounds.yMm-rule.gapToTopTickMm-unit.inkBounds.heightMm-unit.inkBounds.yMm;
   move(unit.id,{y:unit.geometry.yMm+dy});evidence.push({target:rule.target,objectId:unit.id,gapMm:rule.gapToTopTickMm,deltaY:dy,retainXCenter:true});
  }else if(rule.target==='fixed-x-axis-extension'){
   const axis=geom('graph:x-axis'),arrow=geom('graph:x-axis-arrow'),nodes=inspect.pathNodes?.find(p=>p.id===axis.id)?.nodes;
   if(nodes?.length!==2||!nodes.every(n=>Number.isFinite(n.point?.x)&&Number.isFinite(n.point?.y))||Math.abs(nodes[0].point.y-nodes[1].point.y)>1e-5||nodes[1].point.x<=nodes[0].point.x)fail('two horizontal native axis endpoints required');
   // Only the unscaled empty shaft extension after the final data tick changes.
   // Plot width, tick coordinates, stroke and observations never change.
   const end=axis.geometry.xMm+rule.lengthMm,dx=end-(axis.geometry.xMm+axis.geometry.widthMm);
   if(Math.abs(dx)>1e-7){commands.push({type:'pathPoint',id:axis.id,index:1,point:{x:end,y:nodes[1].point.y}});move(arrow.id,{x:arrow.geometry.xMm+dx});}
   evidence.push({target:rule.target,lengthMm:rule.lengthMm,axisId:axis.id,arrowId:arrow.id,delta:dx});
  }else if(rule.target==='graph-origin'){
   const axis=geom('graph:y-axis'),b=groupBounds(c.objectId),dx=rule.axisXmm-axis.geometry.xMm,dy=rule.axisYmm-axis.geometry.yMm;
   if(Math.abs(dx)+Math.abs(dy)>1e-7)move(c.objectId,{x:b.x+dx,y:b.y+dy});
   evidence.push({target:rule.target,objectId:c.objectId,deltaX:dx,deltaY:dy,translationOnly:true});
  }else fail('unknown native post-create rule '+rule.target);
 }
 return{commands,evidence};
}
