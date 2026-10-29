import test from 'node:test';import assert from 'node:assert/strict';
import {listStyles,exampleContent,buildStyle,assertGeometry,preflight,postCreateCommands} from '../skills/create-kice-illustration/scripts/fixed-style-families/charts.mjs';
const list=listStyles(),build=id=>buildStyle({styleID:id,content:exampleContent(id)});
function changed(id){const c=exampleContent(id);if(c.panel)c.panel=c.panel==='(가)'?'(나)':'(다)';for(const k of ['male','female','population','sexRatio','values'])if(c[k])c[k]=c[k].map(x=>x*.8);if(c.year)c.year='(2025)';if(c.yMax){c.yMax=200;c.quantityUnit='개';c.supplyLabel='국내 공급';c.demandLabel='국내 수요';c.supply=[20,200];c.demand=[180,0];}return c;}
test('exact five opt-in chart catalog entries and public contract',()=>{assert.equal(list.length,5);assert.deepEqual(list.map(x=>x.groupID),['DUP005','DUP006','DUP007','DUP008','DUP009']);for(const {styleID}of list){assert.match(styleID,/^chart-/);assert.equal(build(styleID).requiresNativePreflight,true);assert.equal(typeof build(styleID).recipe,'string');}for(const id of ['bar','DUP005','chart-any.v1'])assert.throws(()=>build(id),/unknown styleID/);});
for(const {styleID}of list){test(styleID+': declared slot changes retain scaffold and immutable caller isolation',()=>{const before=build(styleID),content=changed(styleID),after=buildStyle({styleID,content});assert.notDeepEqual(after.spec,before.spec);assert.deepEqual(after.geometry,before.geometry);assert.equal(after.geometrySignature,before.geometrySignature);assert.equal(assertGeometry(after),true);assert.throws(()=>after.geometry.spec.widthMm=50,TypeError);assert.throws(()=>after.parts.push({}),TypeError);if(content.values){content.values[0]=999;assert.notEqual(after.content.values[0],999);}});
 test(styleID+': reject undeclared fields and geometry/style/part tampering',()=>{const b=build(styleID);assert.throws(()=>buildStyle({styleID,content:{...b.content,widthMm:90}}),/exactly keys/);assert.throws(()=>buildStyle({styleID,content:b.content,unexpected:90}),/exactly keys/);for(const alter of [x=>x.spec.widthMm=20,x=>x.geometrySignature='fake',x=>x.parts[0].maxHeightMm=100,x=>x.spec.extra=true,x=>x.requiresNativePreflight=false,x=>x.recipe='photo']){const copy=structuredClone(b);alter(copy);assert.throws(()=>assertGeometry(copy),/override detected/);}});
 test(styleID+': finite bounded values and cardinality; no empty or oversized labels',()=>{const c=exampleContent(styleID),field=['male','values','population','supply'].find(k=>c[k]);for(const bad of [[],c[field].slice(1),c[field].map(()=>NaN),c[field].map(()=>Infinity),c[field].map(()=>-1),c[field].map(()=>999999)])assert.throws(()=>buildStyle({styleID,content:{...c,[field]:bad}}),/finite values/);const label=c.panel?'panel':'supplyLabel';for(const bad of ['', 'long\nlabel','A'.repeat(100),'\u0000'])assert.throws(()=>buildStyle({styleID,content:{...c,[label]:bad}}),/allowed|literal/);});
 test(styleID+': actual measurement required, rejects overflow/warnings without resizing',async()=>{const b=build(styleID),before=JSON.stringify(b);await assert.rejects(preflight(b,async()=>({})),/measurement unavailable/);await assert.rejects(preflight(b,async()=>({widthMm:999,heightMm:3})),/exceeds fixed slot/);await assert.rejects(preflight(b,async()=>({widthMm:8,heightMm:30})),/exceeds fixed slot/);await assert.rejects(preflight(b,async()=>({widthMm:8,heightMm:3,warnings:['overflow']})),/exceeds fixed slot/);const measured=[];const r=await preflight(b,async s=>{measured.push(s);return{widthMm:s.widthMm,heightMm:3.189111111111111,warnings:[]};});assert.equal(r.status,'passed');assert.equal(measured.length,b.parts.length);assert.ok(measured.every(s=>s.kind==='composition'));assert.equal(r.requiresNativeGenerationReview,true);assert.equal(JSON.stringify(b),before);});}
test('pyramid: two native positive-data horizontal graphs own 36 marks; only labels/ticks supplemented',()=>{
 const b=build(list[0].styleID),s=b.spec;
 function graphs(spec){return(spec.kind==='graph'?[spec]:[]).concat((spec.children??[]).flatMap(c=>c.spec?graphs(c.spec):[]));}
 const before=graphs(s),after=graphs(buildStyle({styleID:b.styleID,content:changed(b.styleID)}).spec);
 assert.equal(before.length,2);assert.equal(s.frameDecorations.some(d=>/^(male|female)-\d+$/.test(d.id)),false);
 for(const [i,g]of before.entries()){assert.equal(g.type,'bar');assert.equal(g.chartStyle,'bar');assert.equal(g.categories.length,18);assert.deepEqual(g.domain,[0,6]);assert.equal(g.chartOptions.showXAxis,true);assert.equal(g.chartOptions.showYAxis,true);assert.equal(g.series[0].values.length,18);assert.ok(g.series[0].values.every(v=>v>=0));assert.notDeepEqual(g.series[0].values,after[i].series[0].values);assert.deepEqual(g.chartOptions,after[i].chartOptions);}
 assert.deepEqual(before[0].series[0].values,b.content.male);assert.deepEqual(before[1].series[0].values,b.content.female);
});
test('mixed: dedicated safe legend region and fixed observation count',()=>{const id=list[1].styleID,c=exampleContent(id);for(const [k,v]of [['population',9],['sexRatio',200]]){const copy=structuredClone(c);copy[k][20]=v;assert.throws(()=>buildStyle({styleID:id,content:copy}),/legend clearance/);}const s=build(id).spec.children[0].spec;assert.equal(s.series.length,2);assert.equal(s.series[1].axis,'secondary');assert.equal(s.categories.length,21);assert.equal(s.chartOptions.plotWidthMm,70);});
test('supply-demand: real source scale slots, fixed 10x10 grid; invalid endpoints/units fail',()=>{const id=list[4].styleID,c=exampleContent(id),s=build(id).spec;assert.equal(s.dataFidelity,'exact');assert.equal(s.chartOptions.mode,undefined);assert.equal(s.xTicks.length,11);assert.equal(s.ticks.length,10);assert.equal(s.chartOptions.plotWidthMm,s.plotHeightMm);for(const patch of [{yMax:0},{yMax:Infinity},{quantityUnit:'bad\nunit'},{supply:[5,19]},{demand:[14,0]}])assert.throws(()=>buildStyle({styleID:id,content:{...c,...patch}}),/finite|literal|endpoints/);});

test('content literals are not exam-wording enums; positive intermediate scale is allowed',()=>{const rank=exampleContent(list[2].styleID);assert.equal(buildStyle({styleID:list[2].styleID,content:{...rank,panel:'자료 A'}}).content.panel,'자료 A');const mixed=exampleContent(list[1].styleID);assert.equal(buildStyle({styleID:list[1].styleID,content:{...mixed,source:'(연구원)',year:'2027년'}}).content.source,'(연구원)');const sd=exampleContent(list[4].styleID);const b=buildStyle({styleID:list[4].styleID,content:{...sd,yMax:100,supply:[0,100],demand:[100,0],supplyLabel:'생산',demandLabel:'소비',quantityUnit:'단위',priceTitle:'가격',quantityTitle:'거래량'}});assert.equal(b.spec.domain[1],100);assert.equal(b.spec.chartOptions.plotWidthMm,b.spec.plotHeightMm);assert.equal(b.parts.some(p=>p.spec.children[0].text==='거래량(단위)'),true);});

test('post-create scope: explicit componentId changes only that graph; omitted multi-graph fails',()=>{
 const bundle=build(list[1].styleID),anchor=bundle.geometry.nativeOverrides.find(r=>r.target==='graph-origin');
 function panel(prefix){const roles={'graph:y-axis':{id:prefix+'-axis'}};for(let n=0;n<21;n++)roles['graph:series:population:bar-segment-0'+(n?':'+(n+1):'')]={id:prefix+'-bar-'+n};roles['graph:series:population:legend-swatch']={id:prefix+'-swatch'};
 const geometry=Object.values(roles).map(r=>({id:r.id,geometry:{xMm:anchor.axisXmm,yMm:anchor.axisYmm,widthMm:1,heightMm:1}}));
 return{component:{id:prefix+'-component',objectId:prefix+'-owner',kind:'graph',roles},geometry,object:{id:prefix+'-owner',type:'Group',originX:'left',originY:'top',left:15,top:15,width:300,height:200,strokeWidth:0,scaleX:1,scaleY:1,objects:[]}};}
 const a=panel('a'),b=panel('b'),inspect={production:{components:[a.component,b.component]},geometry:[...a.geometry,...b.geometry],objects:[a.object,b.object]},snapshot=JSON.stringify(inspect);
 assert.throws(()=>postCreateCommands(bundle,inspect),/componentId/);assert.throws(()=>postCreateCommands(bundle,inspect,{componentId:'missing'}),/componentId/);
 const r=postCreateCommands(bundle,inspect,{componentId:a.component.id});assert.equal(r.commands.filter(c=>c.type==='style').length,22);assert.ok(r.commands.filter(c=>c.type==='select').every(c=>c.ids.every(id=>id.startsWith('a-'))));assert.equal(JSON.stringify(inspect),snapshot);
 const broken=structuredClone(inspect);delete broken.production.components[0].roles['graph:series:population:legend-swatch'];assert.throws(()=>postCreateCommands(bundle,broken,{componentId:a.component.id}),/expected 21/);
 assert.deepEqual(postCreateCommands(build(list[2].styleID),undefined),{commands:[],evidence:[]});
});

for(const entry of list)test(entry.styleID+': optional physical width, size signature and fixed typography',async()=>{
 const normal=build(entry.styleID),small=buildStyle({styleID:entry.styleID,content:exampleContent(entry.styleID),widthMm:entry.minWidthMm}),large=buildStyle({styleID:entry.styleID,content:exampleContent(entry.styleID),widthMm:entry.maxWidthMm});
 assert.equal(normal.widthMm,entry.defaultWidthMm);assert.ok(entry.defaultWidthMm<108);assert.equal(small.spec.widthMm,entry.minWidthMm);assert.equal(large.spec.widthMm,entry.maxWidthMm);assert.notEqual(small.geometrySignature,large.geometrySignature);assert.equal(assertGeometry(small),true);assert.equal(assertGeometry(large),true);
 function physicalText(s,found=[]){if(s.fontPt!==undefined)found.push(['fontPt',s.fontPt]);if(s.strokePt!==undefined)found.push(['strokePt',s.strokePt]);if(s.richText)physicalText(s.richText,found);for(const c of s.children??[])physicalText(c.spec??c,found);return found;}
 assert.deepEqual(physicalText(small.spec),physicalText(large.spec));
 for(const bad of [0,NaN,Infinity,'80',entry.minWidthMm-.01,entry.maxWidthMm+.01])assert.throws(()=>buildStyle({styleID:entry.styleID,content:exampleContent(entry.styleID),widthMm:bad}),/widthMm/);
 const tampered=structuredClone(small);tampered.widthMm=entry.maxWidthMm;assert.throws(()=>assertGeometry(tampered),/override detected/);
 await assert.rejects(preflight(small,async()=>({widthMm:entry.maxWidthMm,heightMm:3})),/exceeds fixed slot/);
});
test('mixed: native vertical category option keeps all 21 source labels whole',()=>{
 const s=build(list[1].styleID).spec.children[0].spec;assert.equal(s.categories[0],'0~4');assert.equal(s.categories[19],'95~99');assert.equal(s.categories[20],'100세 이상');assert.ok(s.categories.every(s=>!s.includes('\n')));assert.equal(s.chartOptions.categoryTextDirection,'vertical');assert.equal(s.chartOptions.categoryVerticalNumericGrouping,'digits-2-3');assert.equal(s.chartOptions.labelRotation,0);
});
test('pyramid: requested width updates two native panels, central gap and world baselines together',()=>{
 for(const widthMm of [76,80,108]){
  const b=buildStyle({styleID:list[0].styleID,content:exampleContent(list[0].styleID),widthMm}),r=b.geometry.nativeOverrides[0],plot=b.spec.children[0].spec;
  assert.equal(plot.children.length,3);assert.equal(plot.children[1].widthMm,18);assert.ok(Math.abs(r.rightBaselineXmm-r.leftBaselineXmm-(18+2*r.nativeBoundsInsetMm))<1e-8);assert.equal(r.femaleCaptionXmm,widthMm+1);assert.equal(b.geometry.dataRule.nativePanels,2);
  const graphs=[plot.children[0].spec.children[0].spec,plot.children[2].spec.children[0].spec];for(const g of graphs){assert.equal(g.plotHeightMm,18*r.pitchMm);assert.equal(g.chartOptions.barWidthMm,r.barHeightMm);assert.equal(g.series[0].values.length,18);}
 }
});
test('season: requested plot width and translated native origin share right decoration coordinates',()=>{
 for(const widthMm of [44,48,56,108]){
  const b=buildStyle({styleID:list[3].styleID,content:exampleContent(list[3].styleID),widthMm}),g=b.spec.children[0].spec,origin=b.geometry.nativeOverrides.find(r=>r.target==='graph-origin'),right=b.spec.frameDecorations[0].path;
  assert.ok(Math.abs(right[0].x.offsetMm-(origin.axisXmm-4+g.chartOptions.plotWidthMm))<1e-8);assert.ok(Math.abs(right[1].y.offsetMm-right[0].y.offsetMm-g.plotHeightMm)<1e-8);
 }
});

test('pyramid legal widths 76/80/100/108: reservations stay native-valid and blank-space merging conserves height',()=>{
 const H=3.189111111111111;
 const walk=s=>[s,...(s.children??[]).flatMap(c=>walk(c.spec??c))];
 for(const widthMm of [76,80,100,108]){
  const b=buildStyle({styleID:list[0].styleID,content:exampleContent(list[0].styleID),widthMm}),s=b.spec,plot=s.children[0].spec,ages=plot.children[1].spec;
  const reservations=walk(s).filter(c=>c.reserve);
  assert.ok(reservations.every(c=>Number.isFinite(c.reserve.heightMm)&&c.reserve.heightMm>=.1&&c.reserve.heightMm<=1000),String(widthMm));
  const ageHeight=ages.children.reduce((sum,c)=>sum+(c.reserve?.heightMm??H),0);
  const clearance=s.children.find(c=>c.id==='tick-clearance').reserve.heightMm,bottom=s.children.find(c=>c.id==='bottom').reserve.heightMm;
  const pitch=3.4*widthMm/108,plotBottom=8+18*pitch;
  assert.ok(Math.abs(ageHeight+clearance-(plotBottom+Math.max(.08,(H-pitch)/2)+1))<1e-9,'tick position remains fixed at '+widthMm);
  assert.ok(Math.abs(ageHeight+clearance+H+bottom-(plotBottom+6.8))<1e-9,'total height remains fixed at '+widthMm);
  assert.ok(walk(s).filter(c=>c.richText).every(c=>c.richText.fontPt===8));
  assert.equal(walk(s).filter(c=>c.kind==='graph').length,2);assert.equal(assertGeometry(b),true);
  if(widthMm===100){assert.ok(!ages.children.some(c=>c.id==='tail'));assert.ok(Math.abs(clearance-1.0595185185185159)<1e-9);}
 }
});
