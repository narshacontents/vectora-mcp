import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../skills/create-kice-illustration/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('common contract detects actual scoped resources and preserves legacy fallbacks',()=>{
 const s=read('SKILL.md');
 for(const token of ['vectora://capabilities','vectora://production/<kind>','productionKinds','planningKinds','responseView:"compact"','sinceDocumentId','reset-required','view:"component"','준비 복사본','preparation.bindingsFrozen','기존 1.3.0','네 번째 제작 지침이 아니다'])assert.ok(s.includes(token),token);
 assert.match(s,/profile:"kice"[\s\S]*visualReview.status:"pending"[\s\S]*검증된 수동 경로/);
 assert.match(s,/legacy export_package는 쓰지 않는다/);
 assert.match(read('references/rules/reservation.md'),/heightMm와 lines를 함께 보내지 않는다/);
 assert.match(s,/사용자 지정 파일명·형식을 정확히 지원하지 않으면[\s\S]*사용자가 \.jpg를 명시하면[\s\S]*\.jpg 경로로 실행한다/);
});
test('table and dialogue contracts retain source values and approved embedded artwork',()=>{
 const table=read('references/types/D1_Table.md'),dialogue=read('references/rules/artwork-asset.md');
 for(const token of ['rowId','columnId','rowSpan','colSpan','notApplicable','unknown','모든 격자 칸','대각선 헤더','requiresVisualReview'])assert.ok(table.includes(token),token);
 for(const token of ['awaiting-approved-artwork','reviewed:true','headBounds','visibleBounds','dataUrl','rasterPath','base64·width/height·visibleBounds를 직접 보내지 않는다','8MiB','재추적하지 않고'])assert.ok(dialogue.includes(token),token);
});
test('caller separates technical delivery from final visual inspection',()=>{
 const s=read('references/caller/exam-agent-guide.md');
 assert.match(s,/visualReview.pending[\s\S]*실제 JPEG 직접 열람 전에는 완료로 응답하지 않는다/);
 assert.match(s,/기존 1.3.0 연결본/);
 assert.match(s,/\.jpg 명시[\s\S]*지정 이름을 보존[\s\S]*사용자 지정 확장자를 \.jpeg로 바꾸지 않는다/);
});
