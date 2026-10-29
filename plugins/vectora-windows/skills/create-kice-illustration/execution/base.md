# Vectora 실행 계약

## 연결·단위

제작 전 `execution/usage-recording.md`에 따라 지정 사용 기록 폴더의 접근·쓰기 가능 여부를 확인한다. 확인에 실패하면 문서 생성/수정을 시작하지 않는다. 이미 같은 요청에서 검증했다면 그 결과를 재사용한다.

기존 설치 앱을 사용한다. `vectora_status`와 live tools/resources/capabilities에서 **이번 작업에 필요한 계약만** 확인한다. 같은 연결의 확인된 계약은 재사용하고 새 필드·재연결·관련 오류 때 갱신한다. 버전 문자열로 기능을 추측하거나 옛 guide 전체를 반복해서 읽지 않는다. MCP는 UI 미저장 탭과 독립 세션이다. 앱 코드 수정·Computer Use·DOM·스크립트 주입으로 대체하지 않는다.

일반 `units:"mm-pt"`: 위치·크기·경로·대지 mm, 글·획·파선 pt, `leadingPercent` %, tracking 1/1000em. production의 *Mm/*Pt는 재환산하지 않는다. inspect 원시 objects는 px, geometry/pathNodes는 반환 단위를 확인한다. **96px=25.4mm=72pt**. 직접 SVG는 width/height mm·viewBox px이며 letter-spacing은 선택한 실제 pt·자간으로 환산한다.

## 계획을 실행으로 연결하기

1. 새 문서/지정 파일을 열고 실제 documentId·revision을 확인한다. 제작 계획의 각 단위에 지원되는 생성 경로와 필요한 보충 부분을 정한다.
2. 최종 native spec으로 prepare_task의 `inputReview` 또는 `inspectDisplayText(spec)`를 확인한다. 원문뿐 아니라 추가한 제목·단위·범례·중첩 자료도 포함한다. 자동 교정은 없으므로 조판 규칙/명시 예외를 반영한 최종 문자열로 서식 범위를 계산하고 미검사 경로는 따로 확인한다.
3. 계획 도구가 지원하는 text/table/composition/dialogue를 읽기 전용 측정한다. 실제 문서 자산이 필요하면 documentId를 넣되, dialogue plan의 documentId 지원만으로 자산 측정/승인을 주장하지 않는다. 치수·유효성 통과는 제작·저장·시각 합격이 아니다.
4. production/apply/import 후 inspect로 실제 component ID·spec·roles·warnings·세계 좌표를 확인하고 계획의 단위/보충 개체와 연결한다. component ID와 계열/자료/노드 ID를 혼동하지 않는다.
5. **첫 미리보기 전에** 전체 내용 외곽이 대지에 들어오는지 확인하고 필요하면 대지만 외곽에 맞춘다. 내용이 늘어도 대지는 자동 확대되지 않을 수 있다. responsive 대지 연결이 재조판을 유발하면 지원되는 출력 준비 복사본을 쓴다. 잘린 미리보기는 진단용으로만 보존한다. 이미지 검수는 `core/review.md`, 최종 폭 맞춤·저장은 준비된 납품 지침을 따른다.

## 필요한 부분만 수정하기

- 생성은 `vectora_production(action:"create",spec)`, 기존 연결 자료 수정은 `action:"update",id,patch,policy:"preserve"`다. 객체는 깊은 병합, 배열은 전체 교체, 생략은 유지, null은 선택 필드 삭제다. 배열에는 유지할 안정 ID·값·서식도 보내며 종류 변경 때 이전 전용 옵션을 지운다. reset은 수동 편집 초기화가 허용된 경우만, detach는 불필요하게 하지 않는다.
- 내용 오류는 연결된 값/본문/서식, 배치 오류는 해당 역할/조판을 수정한다. 전체 삭제·재생성으로 편집 성공을 대신하지 않는다. 수정하지 않은 자산·사용자 서식·문단 박스 mm를 보존하고 warnings·렌더로 확인한다.
- 별도 보충 외피/부속은 실제 내용면 좌표에 둔다. plan 로컬 슬롯을 문서 원점으로 착각하거나 그룹 변환/기존 부속을 중복하지 않는다. 자동 재배치를 가정하지 말고 내용/폭 변경 뒤 보충 개체·주변 배치·대지를 확인한다.
- role override의 fixed/offset/release는 **재생성 때** 보존하는 계약이다. 즉시 이동은 실제 개체 transform이며 같은 offset을 중복 적용하지 않는다. 다음 preserve update에서도 위치·자료 연결을 확인한다.

편집 전 inspect한 실제 ID·최신 expectedRevision을 사용한다. 동일 재시도는 동일 전체 인자/requestId, 다른 편집은 새 ID다. 일반 배치 1,000개 이하; 실패 시 복원되며 응답 유실/리비전 오류 때만 `execution/recovery.md`를 읽는다. summary와 component/objectIds로 필요한 범위만 조회하고 저장/재열기·큰 문서/delta 비교는 `execution/inspection.md`를 읽는다. compact의 생략은 없음/검사 완료가 아니다. 미지원·보존 실패는 알리고 실제 지원 경로만 사용한다.
