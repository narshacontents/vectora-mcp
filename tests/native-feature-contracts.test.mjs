import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
const root=new URL('../skills/create-kice-illustration/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('common contract detects actual scoped resources and preserves legacy fallbacks',()=>{
 const task=prepareTask({units:[{recipe:'newspaper',features:['reserve','long-operation']}]});
 const s=[task.contents.execute,task.contents.deliver].join('\n');
 for(const token of ['vectora_status','live tools/resources/capabilities','vectora://capabilities','준비 복사본','preparation.bindingsFrozen','기존 inspect/preview/save 경로'])assert.ok(s.includes(token),token);
 assert.ok(task.onDemand.some(item=>item.path==='execution/inspection.md'&&item.phase==='execute'));
 const inspection=read('execution/inspection.md');
 for(const token of ['responseView:"compact"','sinceDocumentId','reset-required','view:"component"','미지원이면 기존 full 경로'])assert.ok(inspection.includes(token),token);
 assert.match(s,/profile:"kice"[\s\S]*visualReview.pending[\s\S]*execution\/delivery-manual.md/);
 assert.match(s,/legacy package로 기본 한 쌍 납품을 대신하지 않는다/);
 assert.match(read('execution/modules/reservation.md'),/heightMm와 lines를 함께 보내지 않는다/);
 assert.ok(task.onDemand.some(item=>item.path==='execution/delivery-manual.md'&&item.phase==='deliver'));
 assert.match(read('execution/delivery-manual.md'),/사용자 지정 파일명·형식을 정확히 지원하지 않으면[\s\S]*사용자가 \.jpg를 명시하면[\s\S]*\.jpg 경로로 실행한다/);
});
test('table and dialogue contracts retain source values and approved embedded artwork',()=>{
 const tableTask=prepareTask({units:[{recipe:'table'}]});
 const table=[tableTask.contents.design,tableTask.contents.execute].join('\n'),dialogue=read('execution/modules/artwork-asset.md');
 for(const token of ['rowId','columnId','rowSpan','colSpan','notApplicable','unknown','모든 격자 칸','diagonalHeader','대각선 머리글','requiresVisualReview'])assert.ok(table.includes(token),token);
 assert.match(tableTask.contents.design,/제작 후 셀별 값·헤더 소속·빈칸·공유 경계와 실제 글 획 여백을 대조/);
 assert.match(tableTask.contents.design,/재열기 후 셀 값·세로 정렬·실제 획 여백/);
 assert.doesNotMatch(read('references/families/D1_Table.md'),/spec은 widthMm|cells:\[/);
 for(const token of ['awaiting-approved-artwork','reviewed:true','headBounds','visibleBounds','dataUrl','rasterPath','base64·width/height·visibleBounds를 직접 보내지 않는다','8MiB','재추적하지 않고'])assert.ok(dialogue.includes(token),token);
});
test('exam-agent receives internal execution and delivery contracts without loading caller handbooks',()=>{
 const units=[{recipe:'newspaper'}];
 const task=prepareTask({caller:'exam-agent',units});
 for(const [phase,file] of [['design','execution/caller.md'],['execute','execution/base.md'],['deliver','execution/delivery.md']]){
  assert.deepEqual(task.phaseSources[phase].filter(source=>source.path===file).map(source=>source.path),[file],`${phase}: ${file}`);
  assert.ok(task.contents[phase].includes(read(file).trim()),`${phase}: complete ${file}`);
 }
 const ordinary=prepareTask({units});
 assert.ok(!Object.values(ordinary.phaseSources).flat().some(source=>source.path==='execution/caller.md'));
 for(const handbook of ['references/caller/exam-agent-guide.md','references/caller/human-prompt-guide.md']){
  for(const prepared of [task,ordinary])assert.ok(!Object.values(prepared.phaseSources).flat().some(source=>source.path===handbook));
 }
 for(const token of ['vectora://capabilities','이번 작업에 필요한 계약만'])assert.ok(task.contents.execute.includes(token),token);
 assert.match(task.contents.deliver,/기술 결과[\s\S]*deliveryReady:false\/visualReview.pending[\s\S]*직접 검수 전 상태/);
 assert.match(task.contents.deliver,/저장된 실제 JPEG를 직접 열어[\s\S]*검수한다/);
 assert.ok(task.onDemand.some(item=>item.path==='execution/delivery-manual.md'));
 assert.match(read('execution/delivery-manual.md'),/사용자가 \.jpg를 명시하면[\s\S]*\.jpg 경로로 실행한다/);
});
