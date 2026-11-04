import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStyle,assertGeometry,postCreateCommands,preflight} from '../skills/create-kice-illustration/scripts/fixed-style-families/charts.mjs';
import {existsSync} from 'node:fs';
const app=new URL('../../src/production/graphs-cartesian.mjs',import.meta.url),available=existsSync(app);
const {buildCartesianGraph}=available?await import(app):{};
const styleID='chart-population-pyramid.v1',H=3.189111111111111;
const font={postscriptName:'UNDv31-Regular',normalize:v=>String(v),measure:v=>[...String(v)].reduce((w,c)=>w+(/[\x00-\xff]/.test(c)?16/3:32/3),0)};
const walk=s=>[s,...(s.children??[]).flatMap(c=>walk(c.spec??c))];
const content=(n,interval=20)=>({panel:'(가)',male:Array.from({length:n},(_,i)=>(i%6)+.2),female:Array.from({length:n},(_,i)=>(i%6)+.4),ageTickInterval:interval});
for(const n of [18,19,20,21])for(const widthMm of [76,80,108])for(const interval of [5,20])test(`${n} bins / ${widthMm}mm / ${interval} years: native panels, complete values and spaced 8pt labels`,async()=>{
 const b=buildStyle({styleID,widthMm,content:content(n,interval)});assert.equal(assertGeometry(b),true);
 const graphs=walk(b.spec).filter(s=>s.kind==='graph');assert.equal(graphs.length,2);
 for(const [i,g]of graphs.entries()){assert.equal(g.categories.length,n);assert.deepEqual(g.series[0].values,b.content[i?'female':'male']);if(available){const r=buildCartesianGraph(g,{fontAdapter:font});assert.equal(r.report.fontPt,8);assert.equal(r.report.geometry.filter(g=>g.role==='bar').length,n);}}
 const ages=b.spec.children[0].spec.children[1].spec;let y=0,previousEnd=0;const labels=[];
 for(const slot of ages.children){if(slot.reserve){assert.ok(slot.reserve.heightMm>=.1);y+=slot.reserve.heightMm;}else{assert.ok(y>=previousEnd-1e-8);previousEnd=y+H;if(/^age\d/.test(slot.id))labels.push(slot.text);assert.equal(slot.richText.fontPt,8);y+=H;}}
 assert.deepEqual(labels,Array.from({length:n},(_,i)=>(n-1-i)*5).filter(v=>v%interval===0).map(String));assert.ok(ages.children.some(c=>c.text==='(세)'));assert.ok(walk(b.spec).some(c=>c.text==='(%)'));
 assert.equal(b.geometry.dataRule.rows,n);assert.equal(b.geometry.dataRule.plotHeightMm,graphs[0].plotHeightMm);
 const changed=buildStyle({styleID,widthMm,content:{...b.content,male:b.content.male.map(v=>v*.5)}});assert.equal(changed.geometrySignature,b.geometrySignature);
 const measured=[];await preflight(b,async s=>{measured.push(s);return{widthMm:s.widthMm,heightMm:H,warnings:[]};});assert.ok(measured.some(s=>s.children[0].text==='(세)'));
});
test('pyramid post-create accepts 21 rows, flips only the left panel and rejects stale row counts',()=>{
 const b=buildStyle({styleID,content:content(21)}),rule=b.geometry.nativeOverrides[0];
 const component={id:'g',objectId:'owner',kind:'graph',spec:{chartStyle:'bar',categories:Array(21).fill('age'),series:[{id:'male',values:b.content.male}]},roles:{'graph:y-axis':{id:'axis'}}};
 const inspect={production:{components:[component,{id:'parent',roles:{'composition:child:bars':{id:'owner'},'composition:child:sex':{id:'caption'}}}]},geometry:[{id:'axis',geometry:{xMm:20,yMm:rule.topMm,widthMm:0,heightMm:50}},{id:'caption',geometry:{xMm:0,yMm:0,widthMm:3,heightMm:H}}],objects:[{id:'owner',type:'Group',originX:'left',originY:'top',left:0,top:0,width:200,height:200,strokeWidth:0,scaleX:1,scaleY:1,objects:[]}]};
 assert.ok(postCreateCommands(b,inspect).commands.some(c=>c.type==='flipX'));
 const stale=structuredClone(inspect);stale.production.components[0].spec.categories.pop();assert.throws(()=>postCreateCommands(b,stale),/21-category/);
});
test('invalid count, interval and mismatched sex values reject without fallback',()=>{
 for(const c of [content(17),content(22),{...content(21),female:[1]},content(18,7)])assert.throws(()=>buildStyle({styleID,content:c}),/finite values|ageTickInterval/);
});
