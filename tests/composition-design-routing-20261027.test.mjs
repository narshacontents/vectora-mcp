import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
const paths=(r,phase)=>r.phaseSources[phase].map(x=>x.path);
test('single shared scenes receive composition design without requiring native composition',()=>{
 for(const unit of [{recipe:'teacher-board'}, {recipe:'ITA-6_GroupBoard',variant:'board'}, {recipe:'ITB-2_SoloImageBoard',variant:'board'}, {recipe:'ITB-3_GroupImageBoard',variant:'board'}]){
  const r=prepareTask({units:[unit]});
  assert.equal(paths(r,'design').filter(x=>x==='core/composition.md').length,1);
  assert.equal(paths(r,'execute').filter(x=>x==='execution/modules/composition.md').length,0);
 }
});
test('standalone simple and composite requests keep selective, deduplicated layout rules',()=>{
 const simple=prepareTask({units:[{recipe:'bar'}]});
 assert.equal(paths(simple,'design').includes('core/composition.md'),false);
 const mixed=prepareTask({units:[{recipe:'bar'},{recipe:'table'}]});
 assert.equal(paths(mixed,'design').filter(x=>x==='core/composition.md').length,1);
 assert.equal(paths(mixed,'execute').filter(x=>x==='execution/modules/composition.md').length,1);
});
