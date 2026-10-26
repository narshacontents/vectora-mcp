# Vectora 연결·편집 계약



- 기존 설치 앱을 사용하고 `vectora_status`로 버전·연결과 실제 도구 스키마를 확인한다. 제작을 위해 앱 코드·버전·패키지를 변경하지 않는다. MCP는 앱 UI 미저장 탭과 독립 세션이다. Computer Use/브라우저 DOM/앱 스크립트 주입으로 대체하지 않는다. 같은 연결에서 확인한 실행 계약·스키마는 재사용하고, 재연결·계약 변경·새 필드·관련 오류 때 다시 확인한다. use-vectora/서버 옛 guide를 무조건 추가로 읽지 않는다.

- `vectora_new_document`(기본 mm) 또는 지정 `vectora_open_document` → production/apply/import → inspect/preview → save/open/export. 실제 응답의 documentId/최신 expectedRevision/개체 ID 사용; 동일 재시도는 동일 requestId, 다른 편집은 새 ID. 일반 배치 1,000개 이하, 실패 시 복원. 일반 명령 add/select/style/transform는 대상 ID를 확인한다.

- 일반 `units:"mm-pt"`는 위치·크기·경로·대지 mm, 글·획·행간·파선 pt; tracking은 1/1000em. production `*Mm/*Pt`는 다시 환산하지 않는다. inspect 원시 objects는 px, pathNodes/geometry 문서 좌표는 반환 단위를 확인한다. px 경로는 **96px=25.4mm=72pt**, 8pt=10.666666667px, 0.3pt=0.4px. 직접 SVG는 width/height mm, viewBox 해당 px를 사용한다. letter-spacing은 선택한 실제 pt와 자간에서 환산하며 -0.64px를 모든 스타일에 고정하지 않는다.

- **첫 측정·생성 전에 표시 문자열을 확정한다.** 받은 본문뿐 아니라 제작자가 추가한 제목·단위·범례·중첩 자료까지 실제 native spec을 `prepare_task.mjs`에 전달해 `inputReview`를 읽거나, `scripts/inspect_display_text.mjs`의 `inspectDisplayText(spec)`로 검사한다. 문자열은 자동 수정되지 않는다. 경고를 typography 원칙과 대조해 고치고 URL·코드·사용자 명시 예외와 미검사 경로를 구별한 뒤 서식 범위를 계산한다. 처음 요청만 검사한 결과를 이후 추가 문구의 통과 근거로 삼지 않는다.

- 지원되는 전용 생성 기능을 우선 사용하고 일부 미지원 항목만 편집으로 보충한다. 생성은 `vectora_production({documentId,expectedRevision,requestId,action:"create",spec})`. inspect의 `production.components`에서 실제 component ID·저장 spec·roles 개체 ID·warnings를 읽으며 `includeGeometry:true`의 세계 좌표/외곽을 확인한다. component ID는 자료/계열/노드 ID와 다르다.

- native 내용 위에 외피·접힘·고정 부속을 보충할 때는 plan의 로컬 슬롯을 문서 원점으로 간주하지 않는다. 실제 컴포넌트/내용 면의 문서 좌표에 연결해 배치하고, 기본 삽입 위치나 그룹 변환을 중복 가산하지 않는다. native가 이미 그린 테두리·봉·그림자는 역할 ID로 확인하여 같은 부속을 한 번 더 겹치지 않는다.

- 수정은 `action:"update",id,patch,policy:"preserve"`: 객체 깊은 병합, 배열 전체 교체, 생략 유지, null 선택 필드 삭제. 배열 교체 시 유지할 항목의 안정 ID·값·스타일도 보내며 종류 변경 시 이전 전용 옵션은 지운다. 수동 override를 유지하는 preserve 결과는 spec만으로 보증하지 말고 warnings·렌더를 확인한다. reset은 사용자에게 수동 편집 초기화 권한이 있을 때만; 상위 배치를 지우는 명령으로 해석하지 않는다. 불필요 detach 금지. 보충 개체는 자동 재배치되지 않으므로 자료·폭·높이 변경 뒤 좌표·라벨·연결 대응을 재검수한다. 대지는 component 증가로 자동 확대되지 않는다. 잘못된 내용은 입력을 수정하고 지원·측정 실패를 숨기지 않는다.

본문·값·폭을 바꿔 달라는 요청에는 기존 컴포넌트의 연결된 내용/서식을 수정한다. 전체 그림을 지우고 다시 만들어 편집 성공으로 대신하지 않는다. 수정하지 않은 내용·자산·사용자 서식과 문단 박스의 물리 치수를 보존하고, 변화한 영역과 그 주변 배치까지 확인한다. 연결 동작이 지원되지 않거나 보존을 거부하면 정확한 한계를 알리고 필요한 범위만 보충한다.

- 역할 `override`의 fixed/offset/release는 재생성 시의 보존 규칙이다. 현재 계약은 그 호출만으로 즉시 도형을 이동하지 않으므로 성공 응답을 이동 완료로 읽지 않는다. 즉시 이동에는 실제 개체의 일반 transform을 쓰고, override를 지정했다면 다음 preserve update 뒤 실제 위치를 검사한다. 일반 transform의 이동과 같은 offset을 중복 적용하지 않는다.

- 현재 제작·측정·검사 계약은 **앱 1.4.2 이상**에서 사용한다. 네이티브 표·복합 조판·검사·평가원 납품 등 기존 1.4.0 기능과 기존 1.3.0 MCP 연결의 진행/체크포인트 기능, 1.2.0 회색조 내보내기의 최소 버전은 그대로다. 1.3.0 MCP 연결도 앱 기능을 보장하지 않는다. MCP·앱 버전 문자열만으로 새 기능을 가정하지 말고 라이브 `tools/list`, `resources/list`, `vectora://capabilities`의 `productionKinds`, `planningKinds`, `inspection`, `mutationResponseViews`, `deliveryProfiles` 및 필요한 `vectora://production/<kind>`·`/schema`를 확인한다. 이들은 실제 실행 시 지원을 확인하는 계약이다. 필드나 view가 없으면 추측 호출하지 않고 기존 편집·검수 경로를 쓴다.

- `vectora_production_plan({spec,documentId?})`가 있으면 text/table/composition/dialogue를 읽기 전용으로 측정한다. 실제로 문서 자산을 사용하는 계획만 documentId를 명시한다. dialogue plan이 documentId를 받는다고 자산을 측정·승인했다고 주장하지 않는다. 계획은 제작·저장·눈으로 본 검수 완료가 아니다. 편집은 현재 revision과 고유 requestId를 사용하며, production의 `responseView:"compact"`는 실제 지원 때만 지정한다.

- 평소 `vectora_inspect({documentId,view:"summary"})`로 문서·치수·개수와 자산 요약을 확인하고, 편집 대상은 `view:"component",componentIds:[실제 ID]` 또는 objectIds로 좁힌다. 전체 보존 비교·재열기는 지원되는 `view:"delivery",includeGeometry:true`를 우선해 포함 원화·경로의 큰 원시 데이터를 반복해서 받지 않는다. 이 view의 fingerprint는 편집 핸들이 아니므로 실제 경로/점 편집에 필요한 개체만 `view:"full",objectIds:[실제 ID]`로 확인한다. delivery 미지원이면 기존 full 경로를 사용한다. summary는 원시 개체·전체 spec이 아니며, 래스터 무결성 검사가 필요하면 지원되는 `rasterIntegrity:true`를 명시한다. full 자체는 래스터 검증을 보증하지 않는다.

- 레이어 목록의 대표색/썸네일 `fill`은 실제 선색이 아니다. 선색·선폭을 보정하기 전에 해당 개체의 실제 `stroke`·`strokeWidth`와 렌더를 확인한다. 채움 없는 경로의 목록상 회색 표시만 보고 정상 검정 선을 수동 수정하거나 기본값 결함으로 기록하지 않는다.

- `sinceRevision`은 같은 문서의 실제 검사 기준과 `sinceDocumentId`를 함께 사용한다. `delta.status:"delta"`의 changedIds/removedIds와 stateChanged를 읽는다. `fullRequired:true` 또는 `reset-required`면 전체 검사를 다시 수행하고 기준을 갱신한다. 다른 문서/연결의 캐시를 재사용하거나 변경 없음으로 해석하지 않는다. 변경 기록은 scoped/view 검사 이후 32 revision·4MiB 범위로 제한된다.

- 호출 스키마가 지원하면 생성·변경·저장·열기·내보내기·문서 목록의 `responseView:"compact"`로 완료/리비전/파일 경로를 받는다. 응답 요약과 위 inspect의 view는 별도 선택이다. 실제 개체 좌표·spec·경로가 필요한 검사는 해당 범위를 반환하는 view로 조회하며, compact에 생략된 정보를 없거나 검증 완료라고 추정하지 않는다.
