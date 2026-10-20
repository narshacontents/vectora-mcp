import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
const root=new URL('../skills/create-kice-illustration/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('common contract detects actual scoped resources and preserves legacy fallbacks',()=>{
 const task=prepareTask({units:[{recipe:'newspaper',features:['reserve','long-operation']}]});
 const s=[task.contents.execute,task.contents.deliver].join('\n');
 for(const token of ['vectora://capabilities','vectora://production/<kind>','productionKinds','planningKinds','responseView:"compact"','sinceDocumentId','reset-required','view:"component"','준비 복사본','preparation.bindingsFrozen','기존 1.3.0'])assert.ok(s.includes(token),token);
 assert.match(s,/profile:"kice"[\s\S]*visualReview.status:"pending"[\s\S]*검증된 수동 경로/);
 assert.match(s,/legacy export_package는 쓰지 않는다/);
 assert.match(read('execution/modules/reservation.md'),/heightMm와 lines를 함께 보내지 않는다/);
 assert.match(s,/사용자 지정 파일명·형식을 정확히 지원하지 않으면[\s\S]*사용자가 \.jpg를 명시하면[\s\S]*\.jpg 경로로 실행한다/);
});
test('table and dialogue contracts retain source values and approved embedded artwork',()=>{
 const tableTask=prepareTask({units:[{recipe:'table'}]});
 const table=[tableTask.contents.design,tableTask.contents.execute].join('\n'),dialogue=read('execution/modules/artwork-asset.md');
 for(const token of ['rowId','columnId','rowSpan','colSpan','notApplicable','unknown','모든 격자 칸','대각선 헤더','requiresVisualReview'])assert.ok(table.includes(token),token);
 assert.match(tableTask.contents.design,/제작 후 셀별 값·헤더 소속·빈칸·공유 경계와 실제 글 획 여백을 대조/);
 assert.match(tableTask.contents.design,/재열기 후 셀 값·세로 정렬·실제 획 여백/);
 assert.doesNotMatch(read('references/families/D1_Table.md'),/spec은 widthMm|cells:\[/);
 for(const token of ['awaiting-approved-artwork','reviewed:true','headBounds','visibleBounds','dataUrl','rasterPath','base64·width/height·visibleBounds를 직접 보내지 않는다','8MiB','재추적하지 않고'])assert.ok(dialogue.includes(token),token);
});
test('exam-agent caller keeps semantic guidance and receives native execution and delivery contracts',()=>{
 const guide=read('references/caller/exam-agent-guide.md');
 assert.match(guide,/저장·재열기[\s\S]*실제 JPEG 직접 열람/);
 assert.match(guide,/자동 audit\/기술 성공과 시각 합격은 별개/);
 assert.match(guide,/지정 이름·폴더·형식이 우선/);
 assert.match(guide,/연결 앱의 실제 capability·명령·schema/);
 assert.doesNotMatch(guide,/visualReview\.|vectora_export_package/);

 const units=[{recipe:'newspaper'}];
 const task=prepareTask({caller:'exam-agent',units});
 for(const [phase,file] of [['design','execution/caller.md'],['execute','execution/base.md'],['deliver','execution/delivery.md']]){
  assert.deepEqual(task.phaseSources[phase].filter(source=>source.path===file).map(source=>source.path),[file],`${phase}: ${file}`);
  assert.ok(task.contents[phase].includes(read(file).trim()),`${phase}: complete ${file}`);
 }
 const ordinary=prepareTask({units});
 assert.ok(!Object.values(ordinary.phaseSources).flat().some(source=>source.path==='execution/caller.md'));
 for(const token of ['vectora://capabilities','기존 1.3.0'])assert.ok(task.contents.execute.includes(token),token);
 assert.match(task.contents.deliver,/deliveryReady:false[\s\S]*visualReview.status:"pending"[\s\S]*저장된 실제 JPEG를 직접 열어[\s\S]*검수한 뒤만 완료/);
 assert.match(task.contents.deliver,/사용자 지정 파일명·형식을 정확히 지원하지 않으면[\s\S]*사용자가 \.jpg를 명시하면[\s\S]*\.jpg 경로로 실행한다/);
});
