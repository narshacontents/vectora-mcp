import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGraphCore } from '../src/production/graphs-core.mjs';

const spec={
  type:'bar',layout:'horizontal',dataFidelity:'exact',widthMm:96,plotHeightMm:30,
  strokePt:.7,legend:'none',categories:['서울','부산'],domain:[0,100],
  ticks:[0,20,40,60,80,100],unit:'%',
  series:[{id:'a',label:'A',values:[40,80]}],
};
const pointsSpec={
  type:'points',dataFidelity:'exact',widthMm:96,plotHeightMm:30,strokePt:.7,
  legend:'none',grid:false,xDomain:[0,10],yDomain:[0,10],xTicks:[0,5,10],yTicks:[0,5,10],
  series:[{id:'a',label:'관측',points:[{x:2,y:3},{x:8,y:7}]}],
};
const adapter=postscriptName=>({
  postscriptName,
  normalize:value=>String(value).normalize('NFC'),
  measure:(value,fontPx,trackingPx)=>[...value].length*fontPx*.5+Math.max(0,[...value].length-1)*trackingPx,
});

test('fresh v3.1 graphs use current app typography and keep the terminal number aligned with its unit',()=>{
  const built=buildGraphCore(spec,{fontAdapter:adapter('UNDv31-Regular')});
  assert.deepEqual(
    Object.fromEntries(['textProfile','fontFamily','fontPt','charSpacing','horizontalScale','leadingPercent','leadingPt'].map(key=>[key,built.report[key]])),
    {textProfile:'und-dotum-8-default-v1',fontFamily:'UND v3.1',fontPt:8,charSpacing:0,horizontalScale:100,leadingPercent:130,leadingPt:10.4},
  );
  assert.match(built.svg,/font-size="10\.666667"[^>]*letter-spacing="0"/);
  assert.equal(built.report.widthMm,96);
  assert.equal(built.report.strokePt,.7);

  const tick=built.report.textBounds.find(box=>box.name==='tick-100');
  const unit=built.report.textBounds.find(box=>box.name==='unit');
  assert.ok(tick&&unit);
  assert.equal(tick.y,unit.y);
  assert.ok(Math.abs(unit.x-(tick.x+tick.w)-96/25.4)<1e-8);
});

test('an explicitly selected v3.0 face retains historical graph typography',()=>{
  const built=buildGraphCore(spec,{fontAdapter:adapter('UNDv30-Regular')});
  assert.deepEqual(
    Object.fromEntries(['fontPt','charSpacing'].map(key=>[key,built.report[key]])),
    {fontPt:8,charSpacing:-60},
  );
  assert.match(built.svg,/font-size="10\.666667"[^>]*letter-spacing="-0\.64"/);
});

test('points reuse the shared v3.1 typographic defaults and report them consistently',()=>{
  const built=buildGraphCore(pointsSpec,{fontAdapter:adapter('UNDv31-Regular')});
  assert.deepEqual(
    Object.fromEntries(['textProfile','fontFamily','fontPt','charSpacing','horizontalScale','leadingPercent','leadingPt'].map(key=>[key,built.report[key]])),
    {textProfile:'und-dotum-8-default-v1',fontFamily:'UND v3.1',fontPt:8,charSpacing:0,horizontalScale:100,leadingPercent:130,leadingPt:10.4},
  );
  assert.match(built.svg,/font-size="10\.666667"[^>]*letter-spacing="0"/);
  assert.match(built.svg,/font-family="UND v3\.1"/);
  assert.equal(built.report.widthMm,96);
  assert.equal(built.report.strokePt,.7);
});

test('points preserve the explicit v3.0 legacy metrics',()=>{
  const built=buildGraphCore(pointsSpec,{fontAdapter:adapter('UNDv30-Regular')});
  assert.deepEqual(
    Object.fromEntries(['fontPt','charSpacing'].map(key=>[key,built.report[key]])),
    {fontPt:8,charSpacing:-60},
  );
  assert.match(built.svg,/font-size="10\.666667"[^>]*letter-spacing="-0\.64"/);
});
