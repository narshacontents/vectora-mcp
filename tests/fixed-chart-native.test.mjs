import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {buildStyle,exampleContent,assertGeometry} from '../skills/create-kice-illustration/scripts/fixed-style-families/charts.mjs';

// Integration runs in the app checkout; the public skill checkout alone has
// no native Cartesian renderer. Skill-only constraints live in the sibling test.
const app=new URL('../../src/production/',import.meta.url);
const available=existsSync(new URL('graphs-cartesian.mjs',app));
const {buildCartesianGraph}=available?await import(new URL('graphs-cartesian.mjs',app)):{};
const {graphLabelInk}=available?await import(new URL('graph-axis-layout.mjs',app)):{};
const {graphTypography}=available?await import(new URL('graph-text-profile.mjs',app)):{};
const mm=v=>v*96/25.4;
const font={postscriptName:'UNDv31-Regular',normalize:v=>String(v),
 measure:v=>[...String(v)].reduce((w,c)=>w+(/[\x00-\xff]/.test(c)?16/3:32/3),0),
 ink:v=>({x:-font.measure(v)/2,y:-4,w:font.measure(v),h:8.1})};
const build=(styleID,widthMm,patch={})=>buildStyle({styleID,widthMm,content:{...exampleContent(styleID),...patch}});
const graph=b=>b.spec.children?.[0].spec??b.spec;
const render=s=>{try{return buildCartesianGraph(s,{fontAdapter:font});}catch(error){throw new Error(`${s.chartStyle} ${s.widthMm}mm domain ${s.domain}: ${error.message}`,{cause:error});}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
function ink(r,s,name){
 const b=r.report.textBounds.find(b=>b.name===name);
 const tag=r.svg.match(new RegExp(`<text\\b[^>]*data-name="${name}"[^>]*>`))?.[0];
 assert.ok(b&&tag,name);
 const a=Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
 return graphLabelInk(b.text,+a.x,b.y+b.h/2,a['text-anchor']??'middle',font,graphTypography(s,font.postscriptName));
}

test('native signed boxed points retain exact coordinates, a solid zero and ordinary box spacing',{skip:!available},()=>{
 for(const widthMm of [44,48,50,108]){
  const b=build('chart-season-temperature.v1',widthMm,{values:[-12,-4,0,12],domain:[-12,12],ticks:[-12,-8,-4,0,4,8,12]});
  const s=graph(b),r=render(s),plot=r.report.axisLabelLayout.plot;
  assert.equal(assertGeometry(b),true);assert.equal(r.report.fontPt,8);
  assert.deepEqual(r.report.geometry.filter(g=>g.role==='point').map(p=>p.value),s.series[0].values);
  for(const p of r.report.geometry.filter(g=>g.role==='point')){
   assert.equal(p.hidden,false);near(p.yPx,plot.y+plot.h*(12-p.value)/24);
  }
  for(const name of ['frame-top','frame-right','zero-baseline']){
   const line=r.svg.match(new RegExp(`<line\\b[^>]*data-name="${name}"[^>]*>`))?.[0];assert.ok(line,name);
   assert.doesNotMatch(line,/stroke-dasharray/);
  }
  // Compare the same box dimensions, title, unit and labels against columns.
  const column={...s,chartStyle:'column',series:[{id:'t',label:'기온',values:[1,4,8,12]}]};
  const reference=render(column),refPlot=reference.report.axisLabelLayout.plot;
  const gap=(result,spec)=>ink(result,spec,'y-tick-label-12').y-ink(result,spec,'unit').y-ink(result,spec,'unit').h;
  near(gap(r,s),gap(reference,column));
  near(ink(r,s,'category-0').y-plot.axisY,ink(reference,column,'category-0').y-refPlot.axisY);
 }
});

test('native 48/50mm demand grid preserves square scaling, 8pt ink clearance and both demand intercepts',{skip:!available},()=>{
 for(const widthMm of [48,50,72,84,108])for(const yMax of [20,200]){
  const b=build('chart-supply-demand-grid.v1',widthMm,{yMax,supply:[0,yMax],demand:[yMax,0]}),s=graph(b),r=render(s),plot=r.report.axisLabelLayout.plot;
  assert.equal(r.report.fontPt,8);near(plot.w,mm(58*widthMm/108));near(plot.w,plot.h);
  assert.equal(r.report.ticks.length,10);assert.equal(r.report.xTicks.length,11);
  assert.equal((r.svg.match(/<line\b[^>]*data-name="x-grid-/g)??[]).length,11);
  const demand=r.report.geometry.find(g=>g.role==='curve'&&g.seriesId==='demand');
  assert.ok(demand);near(demand.controls[0][0],0);near(demand.controls[0][1],yMax);
  near(demand.controls.at(-1)[0],20);near(demand.controls.at(-1)[1],0);
  near(demand.pixelControls[0][0],plot.x);near(demand.pixelControls[0][1],plot.y);
  near(demand.pixelControls.at(-1)[0],plot.x+plot.w);near(demand.pixelControls.at(-1)[1],plot.axisY);
  const y=r.report.textBounds.filter(b=>b.name.startsWith('y-tick-label-')).map(b=>ink(r,s,b.name)).sort((a,b)=>a.y-b.y);
  for(let i=1;i<y.length;i++)assert.ok(y[i].y-y[i-1].y-y[i-1].h>=mm(.2)-1e-5);
  const x=r.report.textBounds.filter(b=>b.name.startsWith('x-tick-label-')).map(b=>ink(r,s,b.name)).sort((a,b)=>a.x-b.x);
  for(let i=1;i<x.length;i++)assert.ok(x[i].x-x[i-1].x-x[i-1].w>=mm(.5)-1e-5);
  const price=ink(r,s,'y-title-horizontal');assert.ok(price.x+price.w<=plot.x-mm(.5),'price title clears the Y shaft and dart');
  const title=ink(r,s,'x-title');for(const label of x)assert.ok(title.y>=label.y+label.h||title.x>=label.x+label.w||title.x+title.w<=label.x);
 }
});
