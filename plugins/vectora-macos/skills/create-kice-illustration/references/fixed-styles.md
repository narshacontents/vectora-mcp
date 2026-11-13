# 반복 구조의 고정 스타일

요소의 종류·수·역할·방향·상대 배치가 같은 반복 형식에만 적용한다. 일반 신문·웹페이지·그래프·지도까지 한 외형으로 고정하지 않는다. 원본 사진·고지도 파일의 중복은 에셋 재사용이며, 내용을 교체하는 구조 양식과 구별한다. 스킬에는 원본 이미지나 문항 구문을 포함하지 않는다.

## 선택

`<plugin>/bin/vectora-skill fixed_styles --list`에서 등록 구조·recipe를 찾고, `--example <styleID>`로 필요한 내용 슬롯을 확인한다. 의뢰자가 ID를 알 필요는 없다. 구조가 일치할 때만 `fixedStyle:{styleID,content,widthMm?}`를 선택한다.

| 계열 | 등록 형식 | 바꿀 내용 |
| --- | --- | --- |
| 표 | 2×6, 2×7, 3×3, 3×4 | 셀 문자열·수치 |
| 차트·그래프 | 인구 피라미드, 연령 인구·성비, 도시 순위, 계절 기온, 수요·공급 격자, 총공급 좌측 이동 이론 곡선 | 값·표시 문구·기호 |
| 관계·판단 | 두/세 주체 비판 관계, 두/세 결론 판단, 한/두 줄 논증, A/B 연결 | 인물·관계·판단·결론·범례 |
| 집합 | 세 집합의 네 가지 표시 영역, 두 집합 해칭 세 밀도 | 집합명·영역 기호·범례 |
| 대화 구도 | 가로 2/3인, 세로 2/3인 | 화자 이름·원화·정확한 발언; 높이는 내용 연동 |
| 작은 구성요소 | 설명·범례·예시 제목 상자 | 제목·항목·부분 서식; 폭·높이는 내용 연동 |
| 기타 | 두 원 질문, 겹친 사각형, 다섯 구간 시간선, 여섯 줄 휴대전화 | 질문·이름·시간·본문 |

등록 JSON과 `exampleContent()`가 각 형식의 정확한 슬롯 계약이다. 슬롯의 순서는 연결·영역·행열 순서이며 값의 의미와 함께 유지한다. 다른 요소 수·연결·형태가 필요하면 일반 recipe나 다른 등록 형식으로 **명시적으로 전환**한다. 맞지 않는 내용을 기존 형식에 억지로 압축하지 않는다.

폭은 같은 styleID의 선택값이다. 생략하면 카탈로그의 형식별 기본 폭을 사용하며, 독립 그림을 모두 108mm로 채우지 않는다. 허용 범위 안에서 도형·열·배치를 다시 계산하고 글자 크기·획·무늬 간격은 물리값을 유지한다. 너무 좁아 원문이 맞지 않으면 native 실측에서 거절한다.

## 호출

```text
# 각 명령의 결과 JSON은 괄호 속 fixed_styles 함수의 반환값과 같다. 입력은 JSON 파일 경로 또는 -(stdin), 결과는 stdout, 오류는 stderr와 종료 코드 1이다.
bundle    = <plugin>/bin/vectora-skill fixed_styles --request 요청.json            (buildFixedStyle; 요청 {styleID, content, widthMm?})
true      = <plugin>/bin/vectora-skill fixed_styles --assert-geometry bundle.json  (assertFixedGeometry)
ready     = <plugin>/bin/vectora-skill fixed_styles --preflight 입력.json          (preflightFixedStyle; 입력 {bundle, plans:[{spec, plan}, …]}, 종료 코드 3은 다음 plan 요청)
vectora_production({action:'create', spec: ready.spec ?? bundle.spec}) → vectora_inspect → inspected
finishing = <plugin>/bin/vectora-skill fixed_styles --plan-adjustments 입력.json   (planFixedStyleAdjustments; 입력 {bundle, inspect: inspected, options?:{componentId}}) → commands가 있으면 vectora_apply
그 밖: --bind-speaker-assets {bundle, bindings} (bindFixedStyleSpeakerAssets), --compare-geometry {before, after} (compareNativeFixedStyleGeometry)
```

`--preflight`는 `{bundle, plans:[]}`로 시작한다. 종료 코드 3이면 stdout `{status:"needs-native-plan", call, spec}`의 spec으로 `vectora_production_plan`을 호출하고, decoded structuredContent를 `{spec, plan}`으로 `plans` 끝에 더해 같은 명령을 다시 실행한다. 종료 코드 0의 출력이 preflight 결과다. bundle이 바뀌면 `plans:[]`부터 다시 시작한다. 실제 도구 호출에는 연결의 documentId·최신 expectedRevision·새 requestId를 붙인다. helper는 도구 실행·파일 저장을 하지 않는다. 인구 피라미드는 native 가로 막대 그래프 두 개로 구성되므로, 생성된 두 graph componentId 각각에 새 inspect → 보정 → apply를 수행한다.

인구 피라미드의 `male`·`female`은 같은 길이의 18~21개 양수 원자료(0 포함)를 **높은 연령부터** 받는다. 18개는 85세 이상→0~4세, 21개는 100세 이상→0~4세다. `content.ageTickInterval:20`이면 80·60·40·20·0 등 지정 간격의 연령 숫자와 `(세)`만 표시하고 모든 계급의 막대는 유지한다. 생략하면 기존 계급명 표시를 유지한다. 좁은 막대와 독립적으로 8pt 눈금 간격을 확보하며, 남 왼쪽·여 오른쪽의 양수 대칭 축·0 기준·`(%)`는 보존한다. 앱의 단일 native 피라미드도 `mirrorOptions:{version:1,ageTickInterval:20}`과 최대 21개 계급을 받는다. 누적 막대나 별도 수동 눈금으로 우회하지 않는다. 연령 숫자가 왼쪽 세로축에 있고 남·여 막대가 0선에서 맞붙은 형태는 `content.ageLabelPosition:"left"`, `content.barGap:0`으로 같은 양식에서 만든다(남/여는 눈금 숫자 아래 약 1mm). 기본값은 가운데 연령형이다. 수동 벡터로 다시 그리지 않는다.

`<plugin>/bin/vectora-skill prepare_task`는 unit의 recipe 호환성을 검사해 `fixedStyles[].spec`과 검증 요구를 돌려준다. **실행은 spec 한 개만** 사용한다. 검사용 `parts`를 추가 생성하지 않는다. 생성 전에 `assertFixedGeometry()`와 native preflight를 통과해야 한다. preflight가 `spec`을 돌려주면 반드시 그 spec으로 생성한다. 이는 글리프의 잉크 높이 차이를 투명 예약 공간으로 상쇄해 고정 도형 위치를 보존하는 측정 결과다. 생성·내용 갱신 후 `requiresNativeFinalization`인 형식은 실제 inspect를 받아 `planFixedStyleAdjustments()`의 등록 보정을 적용하고 다시 inspect한다. 보정은 현재 native 역할 ID에 붙이며 UUID를 저장해 재사용하지 않는다. 이 단계의 획·단위 간격까지 고정 형식의 일부다. 여러 그래프가 있는 문서는 해당 생성본의 실제 graph componentId를 지정한다. 형식 내부 정렬 보정까지 끝낸 후 복합 그림의 최종 위치에 배치한다.

## 대화 구도와 작은 구성요소

`dialogue-horizontal-2.v1`·`dialogue-horizontal-3.v1`·`dialogue-vertical-2.v1`·`dialogue-vertical-3.v1`은 인당 한 발언인 기본 구도다. 발언이 반복되거나 공유 장면이 있으면 일반 대화 recipe로 전환한다. 원화를 포함한 완성 그림을 복제하지 않는다. `speakers`에 ID·이름, `turns`에 화자 ID·정확한 문장/부분 서식을 주어 먼저 실측한다. `awaiting-approved-artwork`는 미완성이며, 계획에 맞는 서로 구분되는 인물 원화를 검수·등록하고 `bindFixedStyleSpeakerAssets(bundle,[{speakerId,assetId},…])`로 연결한 뒤 생성한다. 인물의 시선·표정·머리/의상 특징은 의뢰에 맞게 바꾼다.

고정하는 것은 열·화자 대응·이름 배치·짧은 곡선 꼬리·간격 정책이다. 가로 기본 구도는 전체 흉상 높이 20mm를 함께 예약하여 서로 다른 얼굴·머리 모양 때문에 말풍선이 계단처럼 어긋나지 않게 한다. 다른 포즈·비율이 필요한 경우 일반 대화 recipe에서 조정한다. 글줄 수와 몸통 높이까지 고정하지 않는다. 세로는 아래 행을 이동하고, 가로는 인물 쪽을 유지하며 위로 확장한다. 이름은 바깥쪽에 둔다. 내용 변경 후 꼬리·모서리 변형과 인접 대상 충돌을 검수한다.

`component-caption.v1`·`component-legend.v1`·`component-example.v1`은 `caption-frame` recipe로 준비한다. `content:{title,items:[{id,text,richText?}]}`를 받고 지정 폭은 최대 폭이다. 복합 그림의 작은 부품으로 써도 전체 외피를 고정하지 않는다. 새 재사용 후보는 역할·형태가 안정적이고 내용 교체/저장 복원 검증을 마친 경우에만 등록한다.

## 보존과 검수

- 같은 크기에서는 도형의 연결·상대 배치·선·해칭·문자 서식을 유지한다. 작은 제목 상자는 내용에 맞춰 폭·높이가 변하는 공용 `composition.legendFrame`을 사용한다. 제목을 위한 긴 선 공백을 미리 만들지 않고, 닫힌 사각 테두리 위에 실측 제목 폭만큼 작은 흰 배경을 겹친다. 문구·기호·값은 슬롯으로 바꾼다. 그래프의 값 변경에 따른 막대 길이·곡선·점 위치는 내용 변화이며, 축·패널·범례의 구조 변화와 구별한다.
- 위아래 범례·예시 상자는 내용에 맞춘 공통 폭으로 연결하고 내부 묶음을 가운데 정렬한다. 물결 바닥의 결과 상자는 물결까지 포함한 전체 외곽이 아니라 평평한 본문 영역의 중앙에 글을 놓는다. 작은 벤 문자 받침은 실제 잉크와 최소 여백만 덮는다.
- 등록된 표와 관계·판단 도식의 핵심 획은 0.4pt를 사용한다. 이는 해당 고정 형식의 값이며 지도·그래프·보조 무늬 및 일반 표 전체에 일괄 적용하지 않는다. 표는 원자료의 `strokePt` 선언을 유지한다.
- 내용이 예약 공간을 넘으면 원문을 유지한 채 실패한다. 자르기·말줄임·글자 축소로 몰래 우회하지 않는다. 말풍선·작은 제목 상자의 자동 확장은 정상 동작이지만, 고정 의미 도형의 슬롯은 예약 폭을 지킨다. 줄 수가 고정된 슬롯의 명시 개행 외에는 불필요한 개행을 만들지 않는다.
- 반환 bundle은 재귀 freeze되며 geometrySignature가 포함된다. 내용 교체는 builder를 다시 호출한다. spec 직접 편집은 해당 고정 스타일 검증 대상에서 제외한다.
- native 표·그래프·벤 도구가 가능한 부분은 그 도구로 만든다. 미지원 외피·특수 연결·보조 해칭만 편집 가능한 벡터로 보충한다. 독립 보충 도형은 후속 범위·형태 편집에 자동 연동된다고 약속하지 않는다.
- native preflight는 실제 문자 폭·높이와 생성 가능한 구조를 확인한다. graph 전체 plan처럼 도구가 지원하지 않는 검사는 생략 사실을 밝히고 생성 후 실제 bounds로 검증한다. 스펙 hash만으로 완성된 그림의 형태 보존을 판단하지 않는다. 범례는 짧은 문구→긴 문구→짧은 문구로 실제 편집해 양방향 크기 갱신과 내용 보존을 확인한다.
- 생성·내용 교체 후 실제 world 좌표·경로·획·화살표·해칭과 문자 크기/배율을 대조한다. UUID·글리프·자료 값에 따른 그래프 도형은 비교에서 구분한다. `compareNativeFixedStyleGeometry()`의 전체 비문자 비교는 같은 저장본의 재열기 등에 사용한다. 내용 변경 전후에는 고정된 핵심 도형과 내용에 반응하는 범례 크기를 분리해 확인하고, 그래프는 축·패널과 자료 도형을 구별한다.
- 저장→독립 재열기→저장된 JPEG 검수로 완성한다. 고정 슬롯 검증은 앱에서 사용자의 수동 이동을 영구 금지하는 잠금 기능이 아니다.
