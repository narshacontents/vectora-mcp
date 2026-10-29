import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import {buildFixedStyle,exampleContent,listFixedStyles} from '../skills/create-kice-illustration/scripts/fixed_styles.mjs';

const unit=()=>({id:'relation',recipe:'network',fixedStyle:{styleID:'criticism-2.v1',content:exampleContent('criticism-2.v1')}});
test('fixed style compiles editable spec and loads instructions only for selected units',()=>{
 const request={units:[unit()]}, snapshot=JSON.stringify(request), r=prepareTask(request);
 assert.equal(JSON.stringify(request),snapshot);
 assert.equal(r.fixedStyles.length,1);
 assert.equal(r.fixedStyles[0].unit,'relation');
 assert.deepEqual(r.fixedStyles[0].spec,buildFixedStyle(unit().fixedStyle).spec);
 assert.equal(r.resolved[0].fixedStyle,'criticism-2.v1');
 assert.ok(r.phaseSources.design.some(x=>x.path==='references/fixed-styles.md'));
 const ordinary=prepareTask({units:[{recipe:'bar'}]});
 assert.equal(ordinary.fixedStyles,undefined);
 assert.ok(!ordinary.phaseSources.design.some(x=>x.path==='references/fixed-styles.md'));
});
test('a matching fixed spec is allowed; geometry overrides and incompatible semantic recipes fail',()=>{
 const selected=unit(); selected.spec=structuredClone(buildFixedStyle(selected.fixedStyle).spec);
 assert.doesNotThrow(()=>prepareTask({units:[selected]}));
 selected.spec.widthMm+=1;
 assert.throws(()=>prepareTask({units:[selected]}),/geometry overrides/);
 assert.throws(()=>prepareTask({units:[{...unit(),recipe:'bar'}]}),/requires D4-02_Network/);
});
test('content substitution preserves geometry signature and separate composite routing',()=>{
 const first=unit(), second=unit(); second.id='other';second.fixedStyle.content.people=['갑','을'];
 const r=prepareTask({units:[first,second,{id:'chart',recipe:'bar'}]});
 assert.equal(r.fixedStyles.length,2);
 assert.equal(r.fixedStyles[0].geometrySignature,r.fixedStyles[1].geometrySignature);
 assert.equal(r.phaseSources.design.filter(x=>x.path==='references/fixed-styles.md').length,1);
 assert.ok(r.phaseSources.design.some(x=>x.path==='core/composition.md'));
});

test('every registered fixed scaffold resolves through ordinary preparation without extra caller bindings',()=>{
 const catalog=listFixedStyles();assert.equal(catalog.length,28);
 for(const item of catalog){
  const result=prepareTask({units:[{id:item.styleID,recipe:item.recipe,fixedStyle:{styleID:item.styleID,content:exampleContent(item.styleID)}}]});
  assert.equal(result.fixedStyles[0].styleID,item.styleID);
  const bundle=buildFixedStyle({styleID:item.styleID,content:exampleContent(item.styleID)});
  assert.equal(result.fixedStyles[0].requiresNativeFinalization,bundle.requiresNativeFinalization===true||Boolean(bundle.geometry?.nativeOverrides?.length));
  assert.equal(result.fixedStyles[0].requiresNativeResolvedSpec,buildFixedStyle({styleID:item.styleID,content:exampleContent(item.styleID)}).requiresResolvedSpec===true);
  assert.ok(result.resolved.length>0,item.styleID);
  assert.ok(result.phaseSources.design.some(x=>x.path==='references/fixed-styles.md'));
 }
});
test('same fixed ID accepts a requested width and retains it in the execution contract',()=>{
 const input=unit();input.fixedStyle.widthMm=100;
 const result=prepareTask({units:[input]});
 assert.equal(result.fixedStyles[0].widthMm,100);
 assert.equal(result.fixedStyles[0].spec.widthMm,100);
 assert.equal(result.fixedStyles[0].styleID,input.fixedStyle.styleID);
 assert.notEqual(result.fixedStyles[0].geometrySignature,prepareTask({units:[unit()]}).fixedStyles[0].geometrySignature);
});
