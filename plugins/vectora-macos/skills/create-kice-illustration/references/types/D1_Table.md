# D1_Table — 표

행·열과 셀 대응을 읽는 격자다. 아래에서 하나를 골라 해당 파일만 읽는다. 대각선 모서리 하나는 다단 헤더가 아니다.

| 세부유형 | 선택 기준 |
|---|---|
| [D1-01_Flat · 단일헤더 목록표](../subtypes/D1_Table/D1-01_Flat.md) | 머리 1겹 + 값 한 줄(한 행 또는 전치형 한 열). 줄 이름 칸이 붙어도 값 줄이 하나면 여기 |
| [D1-02_MultiFlat · 다중헤더 목록표](../subtypes/D1_Table/D1-02_MultiFlat.md) | 단일헤더 목록표 여러 줄이 같은 머리를 공유해 쌓인 표. 값 줄 2개 이상이고 줄마다 다른 개념(항목별 수치표·설명표). 칸이 모두 같은 것을 의미하면 Cross |
| [D1-03_Cross · 교차표](../subtypes/D1_Table/D1-03_Cross.md) | 행·열 모두 범주, 셀=교차값(동질). 전치해도 성립. 대각선 모서리 헤더 허용 |
| [D1-04_Nested · 병합헤더표](../subtypes/D1_Table/D1-04_Nested.md) | 헤더 2겹 이상 또는 병합 셀·섹션 띠. 대각선 모서리 칸만으로는 Nested 아님(R6) |
| [D1-05_Checklist · 응답체크표](../subtypes/D1_Table/D1-05_Checklist.md) | 셀이 ○×·✓·빈칸·점수. 조건 대응용 |
| [D1-06_Others · 기타 격자](../subtypes/D1_Table/D1-06_Others.md) | 선택지 띠, 퍼즐 격자, 카드 나열 |

## 모든 표의 규칙

- 행/열 제목·셀 값·병합 범위·빈칸 의미를 먼저 확정한다. 흰 본문과 직각 격자를 기본으로 하며 헤더·비해당 칸 등 의미 있는 곳만 회색 면으로 구분한다. 공유 경계는 한 번만 그린다.
- 짧은 항목·기호·헤더는 중앙, 긴 설명은 왼쪽. 숫자 열은 비교에 맞춰 중앙 또는 오른쪽 하나를 유지한다. 실제 문구·수치 측정으로 열 폭을 정하고 행 높이는 그 행의 최대 글상자 높이+위아래 여백이다. 같은 역할의 값 열은 가능한 한 같은 폭이다.
- 미지수·미입력·0·해당 없음·불가능한 조합은 서로 다르다. 빈칸을 추측해 채우거나 회색으로 막지 않는다. 제공된 합계·소계는 위치·구분선으로 식별한다. 단위는 표 우상단 바깥 또는 적용 헤더 가까이에 둔다.
- 매체 안에서도 셀은 직각을 유지하고 장식은 셀 영역을 침범하지 않는다. 매체 외피를 별도로 요청한 경우에만 복합형으로 분리한다.

## 실행·검수

라이브 계약이 kind:"table"을 제공하면 전용 표를 우선 사용한다. spec은 widthMm(기본108, 최대108),paddingMm(기본1.5),rows:[{id,minHeightMm?}],columns:[{id,widthMm?,align?,verticalAlign?}],cells:[{id,rowId,columnId,text,rowSpan?,colSpan?,role?,state?,align?,verticalAlign?,fill?}]이다. align은 left/center/right, verticalAlign은 top/middle/bottom, role은 header/body, state는 value/blank/zero/notApplicable/unknown이다. 세로 정렬은 셀 또는 열에 지정할 수 있다. 기본 행 제목은 짧은 한 줄을 세로 중앙에 두고 긴 본문은 위쪽 정렬한다. 행 최대100·열 최대50·셀 최대5000, 셀 문구 최대20000·전체250000자, paddingMm은 (0,20] 범위다. 모든 격자 칸을 정확히 한 번 덮으며 누락·중복·범위 밖 병합은 거부된다. blank의 text는 빈 문자열이고 zero는 원문의 0을 명시한다. state만으로 표시 문구를 생성하지 않는다. 명시 열 폭 합은 표 전체 외곽 폭이며 선폭 때문에 임의로 값을 줄이지 않는다. 108mm 경계에 맞출 때 열 폭을 재조정하더라도 값·행·8pt 글자 크기는 유지한다. 한글·Latin 혼합 문구는 native −60 charSpacing 측정을 보존하고 수동 자간 보정으로 폭을 속이지 않는다. 허용 면은 #FFFFFF/#EEEEEE/#CCCCCC/#AAAAAA이고 검정 면 반전·대각선 헤더·rich text runs는 현재 계약의 지원으로 주장하지 않는다.

읽기 전용 vectora_production_plan의 표 계획으로 실측 셀·텍스트·공유 경계 boundsMm와 폭/높이·글꼴·warnings를 확인한다. requiresVisualReview는 직접 검수 필요를 뜻한다. 제작 후 셀별 값·헤더 소속·빈칸·공유 경계와 실제 글 획 여백을 대조한다. 무지원 연결본은 편집 가능한 rect/line/text를 vectora_apply로 구성하고 셀 좌표·크기·병합 대응을 유지한다. 일반 편집 geometry는 기본 mm, 획은 pt이며 inspect raw objects는 px다. 새 편집마다 최신 revision과 고유 requestId를 사용한다.

저장 성공과 시각 검수는 별개다. 재열기 후 셀 값·세로 정렬·실제 획 여백을 다시 확인하고 실제 JPEG를 원본 해상도와 최종 인쇄 크기에서 검수한다.

## 단일 머리의 목록표 공통 — Flat·MultiFlat

헤더 한 겹, 행=개체·열=속성(또는 반대)이다. 개체와 속성의 역할을 유지하며 전치로 의미가 달라지는 표를 교차표로 취급하지 않는다. 행/열 제목 누락 때문에 다른 개체의 속성처럼 읽히지 않는지 확인한다.

지원 연결본에서는 부모 유형의 현재 제작 계약을 사용한다. rowId/columnId로 본문과 단일 헤더 대응을 유지한다. 미지원이면 기존 편집 가능한 요소로 같은 의미를 보존한다.
