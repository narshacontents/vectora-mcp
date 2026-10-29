# 표 도구 API 계약

격자 두께를 지정할 때는 live schema의 `strokePt`를 표 원자료에 선언한다. 미지정 기본은 0.3pt이며, 등록 고정 표의 0.4pt처럼 명시한 값은 생성·편집·실측·검사에 함께 적용된다. 선 개체만 생성 후 고쳐 원자료와 검사 기준을 어긋나게 하지 않는다.

라이브 계약이 kind:"table"을 제공하면 전용 표를 우선 사용한다. spec은 widthMm(기본108, 최대108),paddingMm(기본1.5),rows:[{id,minHeightMm?}],columns:[{id,widthMm?,align?,verticalAlign?}],cells:[{id,rowId,columnId,text,richText?:TextFrameSpec,content?:ProductionSpec,rowSpan?,colSpan?,role?,state?,align?,verticalAlign?,fill?}]이다. align은 left/center/right, verticalAlign은 top/middle/bottom, role은 header/body, state는 value/blank/zero/notApplicable/unknown이다. 세로 정렬은 셀 또는 열에 지정할 수 있다. 기본 행 제목은 짧은 한 줄을 세로 중앙에 두고 긴 본문은 위쪽 정렬한다. 행 최대100·열 최대50·셀 최대5000, 셀 문구 최대20000·전체250000자, paddingMm은 (0,20] 범위다. 모든 격자 칸을 정확히 한 번 덮으며 누락·중복·범위 밖 병합은 거부된다. blank의 text는 빈 문자열이고 zero는 원문의 0을 명시한다. state만으로 표시 문구를 생성하지 않는다. 명시 열 폭 합은 표 전체 외곽 폭이며 선폭 때문에 임의로 값을 줄이지 않는다. 108mm 경계에 맞출 때 열 폭을 재조정하더라도 값·행·셀별 선택 프로필의 글자 크기는 유지한다. 한글·Latin 혼합 문구는 선택한 문자 역할의 기본 자간과 실제 범위 서식으로 실측한다. 줄별 자간·어절 조판은 core/typography.md의 공통 규칙을 적용하며, 실측 없이 수동 자간 값으로 셀 폭을 맞추지 않는다. 허용 면은 #FFFFFF/#EEEEEE/#CCCCCC/#AAAAAA이고 검정 면 반전은 현재 지원하지 않는다. 임의 rich text runs API는 추측하지 않는다.

live 셀 schema가 `diagonalHeader`를 제공하면 대각선 머리글은 `cells[].diagonalHeader:{upperRight:"열 제목",lowerLeft:"행 제목"}`와 `text:""`로 만든다. `richText/content`와 함께 보내지 않고 각 제목은 개행 없는 원문으로 둔다. 표의 글꼴·여백을 물려받으며 실제 삼각 영역에 맞춰 행 높이를 계산한다. 폭 부족 오류는 열 폭을 재배분해 해결하고 글자를 축소하거나 선·라벨을 따로 덧그리지 않는다. 문구·폭 수정도 같은 셀 ID와 원본 필드로 갱신하여 선과 두 제목이 함께 이동하는지 확인한다. 미지원 연결본에서만 편집 가능한 보충 요소를 사용하고 자동 연동되지 않는 범위를 밝힌다.

표 전체 기본은 루트 `textProfile`, 셀별 선택은 `cells[].richText.textProfile`로 지정한다. 명시 지원되지 않은 `cells[].textProfile`을 보내거나 schema의 `additionalProperties:true`를 실행 지원으로 해석하지 않는다.

`cells[].richText`는 `TextFrameSpec` 기반 셀 부분 서식이며 `richText.text`는 `cell.text`와 같아야 한다. 밑줄 등 서식 범위는 최종 문자열 기준으로 지정한다. 공개 discovery schema에서 필드가 누락될 수 있으므로 live `vectora_production_plan`의 지원을 확인한 뒤 사용한다.

live 표 schema가 지원하면 루트의 `paddingHorizontalMm`·`paddingVerticalMm`으로 좌우·위아래 여백을 각각 지정한다. 각 값은 `(0,20]`mm이며 생략한 축만 `paddingMm ?? 1.5`를 따른다. 셀별 필드로 보내지 않는다. 간격을 줄여야 할 때도 표 family의 사방 판독 여백을 지키며, 작은 공통 `paddingMm` 하나로 좌우까지 동시에 줄이지 않는다. 좌우 값은 글·내부 자료의 가용 폭과 병합 열에, 위아래 값은 행 높이와 세로 배치에 반영된다. 글상자를 하나씩 이동·축소하는 보정 대신 이 원본 설정을 사용하고, 좁아진 폭의 자동 줄바꿈과 행 높이를 plan/JPEG로 확인한다. update에서 생략하면 기존값을 보존하며 해당 축을 `null`로 지우면 공통값으로 돌아간다.

셀 소유의 `content`는 요청 시 연결된 앱의 live `vectora://production/table/schema`에 `cells[].content`가 있을 때만 사용한다. 존재하면 stable cell ID로 `cell:<id>:content`를 소유 키로 삼고, `text:""`, `richText` 생략, state 생략 또는 `value`를 보낸다. content는 composition child와 같은 자립형 native kinds를 사용하되 `pattern`/`magnify`/`trail` 및 source-dependent references는 제외한다. cell/grid가 inner width와 span 포함 실측 높이를 배정하고, 자식 x/y는 배치를 바꾸지 않으며 글리프 크기를 조절하지 않는다. 자식의 native IDs·assets·source metadata를 보존하고 자식 편집은 table부터 부모 composition과 board까지 재흐름한다. Strict intrinsic measurement가 nested content를 계산할 수 없으면 `TABLE_CONTENT_UNSUPPORTED`로 중단한다. 일반 auto/fixed 표 배치는 기존 measured layout을 사용한다. live schema가 필드를 알리지 않으면 제출하지 말고 기존 measured table path를 유지하며, 셀 안 native child가 필수인 요청은 현재 연결본에서 지원되지 않는다고 보고한다.

읽기 전용 vectora_production_plan의 표 계획으로 실측 셀·텍스트·공유 경계 boundsMm와 폭/높이·글꼴·warnings를 확인한다. requiresVisualReview는 직접 검수 필요를 뜻한다.

표 위의 단위는 표의 실제 오른쪽 끝에 맞추고 가까이 묶는다. text-frame의 일반 `blocks[].text`는 부모 본문 슬롯의 폭으로 측정·배치되므로 내부 `text.widthMm`만 줄여 단위의 오른쪽 끝이 바뀐다고 가정하지 않는다. 표와 단위를 같은 가용 영역으로 계획하거나, 지원되는 소유 컨테이너 안에서 함께 정렬하고 plan의 두 실제 끝점을 대조한다. 더 좁은 표를 가운데 놓은 채 단위만 바깥 본문 끝에 남기거나, 수동 공백으로 밀지 않는다. 표의 소속 단계와 독립 자료의 가운데 배치는 산문 위계 원칙을 유지한다.

머리글의 짧은 단위·영문 토큰이 중간에서 갈라지면 열 폭을 재배분하거나 항목명과 단위 사이에서만 의미상 줄을 나눈다. `(mm)`를 `(m`과 `m)`로 나눠 맞추지 않으며, 이 머리글 조판을 연속 본문에 강제 개행을 넣는 방식으로 확대하지 않는다.

무지원 연결본은 편집 가능한 rect/line/text를 vectora_apply로 구성하고 셀 좌표·크기·병합 대응을 유지한다. 일반 편집 geometry는 기본 mm, 획은 pt이며 inspect raw objects는 px다. 새 편집마다 최신 revision과 고유 requestId를 사용한다.
