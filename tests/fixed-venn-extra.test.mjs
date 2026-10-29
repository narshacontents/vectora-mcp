import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {listStyles,exampleContent,buildStyle,assertGeometry,preflight} from '../skills/create-kice-illustration/scripts/fixed-style-families/venn.mjs';
import {compareNativeFixedStyleGeometry} from '../skills/create-kice-illustration/scripts/fixed_styles.mjs';
const styles=listStyles();
const expectedGroups=['DUP019','DUP020','DUP021','DUP022','DUP024','DUP025'];
const keys=[['A','B','C','BC'],['A','B','AB','AC'],['A','B','C','AC'],['A','AB','BC','ABC'],['A','AB','B'],['A','AB','B']];
const build=id=>buildStyle({styleID:id,content:exampleContent(id)});
const native=b=>b.parts[0].spec.children.find(c=>c.id==='venn').spec;
function variant(id){const c=exampleContent(id);return {setLabels:['X','Y','Z'].slice(0,c.setLabels.length),regions:c.regions.map((_,i)=>String(i+1)),legend:c.legend.map((_,i)=>`변형 영역 ${i+1}`)};}
function measuredBackings(b){
  return b.geometry.calibration.textExclusions.map(h=>({key:h.key,inkMm:{xMm:h.xMm-.65,yMm:h.yMm-.85,widthMm:1.3,heightMm:1.7},backingMm:{xMm:h.xMm-1,yMm:h.yMm-1.2,widthMm:2,heightMm:2.4}}));
}
test('six exact source groups, with explicit family/subtype metadata',()=>{
  assert.equal(styles.length,6);assert.deepEqual(styles.map(s=>s.sourceGroup),expectedGroups);
  for(const s of styles){assert.equal(s.recipe,'D4-04_Venn');assert.equal(s.family,'venn');}
  for(const id of ['venn-3','DUP027','venn-2-hatch.v1'])assert.throws(()=>build(id),/unknown styleID/);
});
for(const [index,{styleID}] of styles.entries()){
  test(`${styleID}: exact native semantic regions and cardinality`,()=>{
    const b=build(styleID),s=native(b);
    assert.equal(s.kind,'schematic');assert.equal(s.layout,'venn');assert.equal(s.widthPolicy,'total-v1');
    assert.deepEqual(Object.keys(s.regions),keys[index]);
    assert.equal(s.sets,index<4?3:2);
    assert.deepEqual(Object.values(s.regions),Array.from({length:styles[index].counts.regions},(_,i)=>String.fromCharCode(65+i)));
    assert.equal(assertGeometry(b),true);
  });
  test(`${styleID}: frozen geometry survives all content-slot substitutions`,()=>{
    const a=build(styleID),b=buildStyle({styleID,content:variant(styleID)});
    assert.notDeepEqual(a.spec,b.spec);assert.deepEqual(a.geometry,b.geometry);assert.equal(a.geometrySignature,b.geometrySignature);
    assert.throws(()=>a.spec.children[0].widthMm=3,TypeError);
    const tampered=structuredClone(a);tampered.spec.children[0].widthMm--;
    assert.throws(()=>assertGeometry(tampered),/override detected/);
    const mutated=structuredClone(a);mutated.geometry.calibration.circles.A.rxMm++;
    assert.throws(()=>assertGeometry(mutated),/override detected/);
    for(const field of ['requiresNativePreflight','requiresResolvedSpec']){
      const bypass=structuredClone(a);bypass[field]=false;
      assert.throws(()=>assertGeometry(bypass),new RegExp(field+' override detected'));
      delete bypass[field];
      assert.throws(()=>assertGeometry(bypass),new RegExp(field+' override detected'));
    }
  });
  test(`${styleID}: invalid slots and structural overrides reject`,()=>{
    const c=exampleContent(styleID);
    assert.throws(()=>buildStyle({styleID,content:{...c,legend:[]}}),/exactly/);
    assert.throws(()=>buildStyle({styleID,content:{...c,setLabels:c.setLabels.map(()=> 'X')}}),/distinct/);
    assert.throws(()=>buildStyle({styleID,content:{...c,legend:c.legend.map(()=> 'line\nbreak')}}),/one nonempty line/);
    assert.throws(()=>buildStyle({styleID,content:c,widthMm:77}),/widthMm/);
  });
}
test('widthMm defaults to 84, is bounded and participates in immutable reconstruction',()=>{
  for(const {styleID,...listed} of styles){
    assert.equal(listed.defaultWidthMm,84);assert.equal(listed.minWidthMm,78);assert.equal(listed.maxWidthMm,108);
    const base=build(styleID),wide=buildStyle({styleID,content:base.content,widthMm:108});
    assert.equal(base.widthMm,84);assert.equal(base.spec.widthMm,84);
    assert.equal(assertGeometry(wide),true);assert.notEqual(wide.geometrySignature,base.geometrySignature);
    assert.deepEqual(base.geometry.hatches,wide.geometry.hatches);
    assert.notEqual(base.geometry.calibration.circles.A.rxMm,wide.geometry.calibration.circles.A.rxMm);
    assert.equal(base.geometry.calibration.textExclusions[0].widthMm,wide.geometry.calibration.textExclusions[0].widthMm);
    assert.equal(base.geometry.calibration.textExclusions[0].heightMm,wide.geometry.calibration.textExclusions[0].heightMm);
    for(const widthMm of [77.99,108.01,NaN,Infinity,null,'84'])assert.throws(()=>buildStyle({styleID,content:base.content,widthMm}),/widthMm/);
    for(const widthMm of [78,84,108]){
      const sized=buildStyle({styleID,content:base.content,widthMm});assert.equal(assertGeometry(sized),true);
      assert.ok(Math.abs(sized.spec.children.reduce((n,c)=>n+c.widthMm,0)+sized.spec.gapMm-widthMm)<1e-8);
    }
    for(const widthMm of [78,undefined]){const altered=structuredClone(wide);altered.widthMm=widthMm;assert.throws(()=>assertGeometry(altered),/override detected/);}
    const legend=base.parts.find(p=>p.id==='legend').spec;
    assert.deepEqual(legend.legendFrame,{title:'〈범례〉',paddingMm:1.2,titlePaddingMm:.25,strokePt:.3});assert.equal(legend.frameDecorations,undefined);
    assert.ok(legend.children.every(c=>c.widthMm===undefined&&c.reserve===undefined));
  }
});
test('supplemental segments retain physical angle/spacing and stay in exact ellipse regions outside physical text masks at every size',()=>{
  const masks={A:1,B:2,C:4,AB:3,AC:5,BC:6,ABC:7};
  for(const {styleID} of styles)for(const widthMm of [78,84,108]){
    const b=buildStyle({styleID,content:exampleContent(styleID),widthMm}),plane=b.geometry.calibration;
    const at=(x,y)=>{let mask=0;for(const [key,c] of Object.entries(plane.circles))if(((x-c.xMm)/c.rxMm)**2+((y-c.yMm)/c.ryMm)**2<1)mask|=masks[key];return mask;};
    for(const path of b.parts[0].spec.frameDecorations){
      const [,region,direction]=path.id.match(/^hatch-([ABC]+)-(\d+)-/),hatch=b.geometry.hatches.find(h=>h.region===region);
      const angle=hatch.anglesDeg[Number(direction)]*Math.PI/180,ux=Math.cos(angle),uy=Math.sin(angle),spacing=hatch.spacingMm[Number(direction)];
      assert.equal(path.strokePt,.2);assert.ok(path.path.length<=512);assert.equal(path.path.length%2,0);
      for(let i=0;i<path.path.length;i+=2){
        const a=path.path[i],z=path.path[i+1],ax=a.x.offsetMm,ay=a.y.offsetMm-1,zx=z.x.offsetMm,zy=z.y.offsetMm-1;
        assert.ok(Math.abs((zx-ax)*uy-(zy-ay)*ux)<1e-7,'physical hatch angle');
        const level=(-uy*ax+ux*ay)/spacing;
        assert.ok(Math.abs(level-Math.round(level))<1e-7,'physical normal spacing');
        for(const fraction of [0,.25,.5,.75,1]){
          const x=ax+(zx-ax)*fraction,y=ay+(zy-ay)*fraction;
          assert.equal(at(x,y),masks[region],`${styleID}/${widthMm}/${path.id}`);
          assert.ok(x>=0&&x<=b.parts[0].spec.widthMm&&y>=0&&y<=plane.paintHeightMm);
          assert.ok(!plane.textExclusions.some(h=>Math.abs(x-h.xMm)<=h.widthMm/2&&Math.abs(y-h.yMm)<=h.heightMm/2));
        }
      }
    }
  }
});
test('two-set density families retain distinct measured direction and normal spacing',()=>{
  const [a,b]=styles.slice(4).map(s=>build(s.styleID));
  assert.equal(a.geometry.hatches[0].anglesDeg[0],-64.5);assert.equal(b.geometry.hatches[0].anglesDeg[0],-53.75);
  assert.equal(a.geometry.hatches[0].spacingMm[0],1.82);assert.equal(b.geometry.hatches[0].spacingMm[0],1.61);
  assert.notEqual(a.geometrySignature,b.geometrySignature);
});
test('triple intersection keeps three hatch directions, not a two-direction substitute',()=>{
  const b=build('venn3-chain-triple.v1');
  assert.deepEqual(b.geometry.hatches.find(h=>h.region==='ABC').anglesDeg,[90,-45,45]);
});
test('native preflight rejects changed native allocation or a tall/empty legend',async()=>{
  const b=build(styles[4].styleID);
  await assert.rejects(preflight(b,async()=>({})),/measurement unavailable/);
  await assert.rejects(preflight(b,async spec=>({widthMm:spec.widthMm,heightMm:spec.widthMm,layout:{venn:{diagramWidthMm:spec.widthMm},children:[{id:'legend-content',heightMm:2}]},boundsMm:{widthMm:109}})),/legendFrame|origin reservation/);
});
test('preflight uses the fixed title padding and returns identical ready.spec/resolvedSpec aliases',async()=>{
  for(const {styleID} of styles){
    const b=build(styleID);
    const planner=async(spec,backingExtraMm=.5)=>{
      if(spec.kind==='schematic')return {heightMm:b.geometry.calibration.paintHeightMm,layout:{venn:{diagramWidthMm:spec.widthMm,textBackings:measuredBackings(b)}}};
      if(spec.legendFrame)return {widthMm:spec.widthMm,heightMm:15,layout:{legendFrame:{titleInkMm:{widthMm:10},titleBackingMm:{widthMm:10+backingExtraMm}}}};
      return {widthMm:spec.widthMm,heightMm:50,boundsMm:{widthMm:spec.widthMm}};
    };
    const ready=await preflight(b,planner);
    assert.strictEqual(ready.spec,ready.resolvedSpec);
    assert.deepEqual(ready.spec.children[1].spec.legendFrame,{title:'〈범례〉',paddingMm:1.2,titlePaddingMm:.25,strokePt:.3});
    await assert.rejects(preflight(b,spec=>planner(spec,.7)),/legendFrame measurements/);
  }
});
test('preflight replaces oversized calibration holes with actual ink backings; missing or invalid metrics reject',async()=>{
  for(const {styleID} of styles){
    const b=build(styleID),measured=measuredBackings(b);
    const planner=async spec=>{
      if(spec.kind==='schematic')return {heightMm:b.geometry.calibration.paintHeightMm-.2,layout:{venn:{diagramWidthMm:spec.widthMm,textBackings:measured}}};
      if(spec.legendFrame)return {widthMm:spec.widthMm,heightMm:15,layout:{legendFrame:{titleInkMm:{widthMm:10},titleBackingMm:{widthMm:10.5}}}};
      return {widthMm:spec.widthMm,heightMm:50,boundsMm:{widthMm:spec.widthMm}};
    };
    const ready=await preflight(b,planner),clearance=Math.max(0,...b.geometry.hatches.map(h=>h.strokePt))*25.4/72/2;
    assert.deepEqual(ready.resolvedCalibration.circles,b.geometry.calibration.circles);
    for(const [i,hole] of ready.resolvedCalibration.textExclusions.entries()){
      assert.ok(Math.abs(hole.widthMm-(2+2*clearance))<1e-8);
      assert.ok(Math.abs(hole.heightMm-(2.4+2*clearance))<1e-8);
      assert.ok(Math.abs(hole.xMm-(measured[i].backingMm.xMm+1))<1e-8);
      assert.ok(Math.abs(hole.yMm-(measured[i].backingMm.yMm+1.4))<1e-8);
    }
    for(const bad of [undefined,[],measured.slice(1),measured.map(x=>({...x,backingMm:{...x.backingMm,widthMm:NaN}})),measured.map(x=>({...x,backingMm:{...x.inkMm,widthMm:.01}}))]){
      await assert.rejects(preflight(b,async spec=>spec.kind==='schematic'?{heightMm:b.geometry.calibration.paintHeightMm,layout:{venn:{diagramWidthMm:spec.widthMm,textBackings:bad}}}:planner(spec)),/actual-ink/);
    }
  }
});
// The measured origin reservation is transparent layout, not a diagram path.
// All painted leaves and all fixed reservations remain in the comparison.
function forFigure(doc){
  const next=structuredClone(doc);
  const visit=items=>items.filter(o=>{
    if(o.productionKey==='composition:child:native-origin-reserve'){
      assert.equal(o.productionRole,'content.reservation');assert.equal(o.fill,'transparent');assert.ok(!o.stroke||o.stroke==='none');return false;
    }
    if(o.objects)o.objects=visit(o.objects);return true;
  });
  next.objects=visit(next.objects);return next;
}
const evidence=process.env.FIXED_VENN_EXTRA_NATIVE_EVIDENCE;
for(const {styleID} of styles)test(`${styleID}: actual native content variant, typography and independent reopen`,{skip:!evidence},()=>{
  const read=(kind,name)=>JSON.parse(readFileSync(join(evidence,`${styleID}-${kind}`,name),'utf8'));
  // The unresolved bundle has conservative calibration holes. Only the
  // preflight's actual-ink resolved spec is executable.
  for(const kind of ['base','variant']){
    const request=read(kind,'request.json');
    assert.equal(request.checked.styleID,styleID);
    assert.equal(request.checked.status,'passed');
    assert.deepEqual(request.spec,request.checked.spec);
  }
  assert.notDeepEqual(read('base','request.json').spec,read('variant','request.json').spec);
  for(const kind of ['base','variant']){
    assert.equal(read(kind,'verification.json').technicalPass,true);
    const result=compareNativeFixedStyleGeometry(forFigure(read(kind,'inspect.json')),forFigure(read(kind,'reopened.json')));
    assert.equal(result.equal,true,JSON.stringify(result.differences));
  }
  // Changed glyph ink intentionally changes supplemental path endpoints. Keep
  // circle topology, physical type and all stroke styles invariant instead of
  // requiring the old oversized empty holes to survive content substitution.
  const leaves=doc=>{const out=[];const walk=items=>{for(const o of items){if(o.objects)walk(o.objects);else out.push(o);}};walk(doc.objects);return out;};
  const invariant=doc=>{
    const all=leaves(doc),byId=new Map(doc.geometry.map(g=>[g.id,g]));
    const circles=all.filter(o=>o.productionRole==='venn.set-circle');
    const center=o=>{const g=byId.get(o.id).geometry;return [g.xMm+g.widthMm/2,g.yMm+g.heightMm/2];},origin=center(circles[0]);
    return {circles:circles.map(o=>({key:o.productionKey,rx:o.radius??o.rx,ry:o.radius??o.ry,scaleX:o.scaleX,scaleY:o.scaleY,strokeWidth:o.strokeWidth,relativeCenter:center(o).map((v,i)=>Math.round((v-origin[i])*1e5)/1e5)})),
      text:all.filter(o=>o.text!==undefined).map(o=>({key:o.productionKey,family:o.fontFamily,size:o.fontSize,scaleX:o.scaleX,scaleY:o.scaleY,weight:o.fontWeight,style:o.fontStyle})),
      hatches:all.filter(o=>o.productionRole==='venn.hatch-line'||o.productionKey?.startsWith('frame-decoration:hatch-')).map(o=>({key:o.productionKey,stroke:o.stroke,strokeWidth:o.strokeWidth}))};
  };
  assert.deepEqual(invariant(read('base','reopened.json')),invariant(read('variant','reopened.json')));
});
