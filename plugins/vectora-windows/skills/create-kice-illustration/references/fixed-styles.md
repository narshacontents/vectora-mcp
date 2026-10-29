# 반복 구조의 고정 스타일

요소의 종류·수·역할·방향·상대 배치가 같은 반복 형식에만 적용한다. 일반 신문·웹페이지·그래프·지도까지 한 외형으로 고정하지 않는다. 원본 사진·고지도 파일의 중복은 에셋 재사용이며, 내용을 교체하는 구조 양식과 구별한다. 스킬에는 원본 이미지나 문항 구문을 포함하지 않는다.

## 선택

`node scripts/fixed_styles.mjs --list`에서 등록 구조·recipe를 찾고, `--example <styleID>`로 필요한 내용 슬롯을 확인한다. 의뢰자가 ID를 알 필요는 없다. 구조가 일치할 때만 `fixedStyle:{styleID,content,widthMm?}`를 선택한다.

| 계열 | 등록 형식 | 바꿀 내용 |
| --- | --- | --- |
| 표 | 2×6, 2×7, 3×3, 3×4 | 셀 문자열·수치 |
| 차트·그래프 | 인구 피라미드, 연령 인구·성비, 도시 순위, 계절 기온, 수요·공급 격자, 총공급 좌측 이동 이론 곡선 | 값·표시 문구·기호 |
| 관계·판단 | 두/세 주체 비판 관계, 두/세 결론 판단, 한/두 줄 논증, A/B 연결 | 인물·관계·판단·결론·범례 |
| 집합 | 세 집합의 네 가지 표시 영역, 두 집합 해칭 세 밀도 | 집합명·영역 기호·범례 |
| 기타 | 두 원 질문, 겹친 사각형, 다섯 구간 시간선, 여섯 줄 휴대전화 | 질문·이름·시간·본문 |

등록 JSON과 `exampleContent()`가 각 형식의 정확한 슬롯 계약이다. 슬롯의 순서는 연결·영역·행열 순서이며 값의 의미와 함께 유지한다. 다른 요소 수·연결·형태가 필요하면 일반 recipe나 다른 등록 형식으로 **명시적으로 전환**한다. 맞지 않는 내용을 기존 형식에 억지로 압축하지 않는다.

폭은 같은 styleID의 선택값이다. 생략하면 카탈로그의 형식별 기본 폭을 사용하며, 독립 그림을 모두 108mm로 채우지 않는다. 허용 범위 안에서 도형·열·배치를 다시 계산하고 글자 크기·획·무늬 간격은 물리값을 유지한다. 너무 좁아 원문이 맞지 않으면 native 실측에서 거절한다.

## 호출

```js
import {buildFixedStyle, preflightFixedStyle, planFixedStyleAdjustments} from './scripts/fixed_styles.mjs';
const bundle = buildFixedStyle({styleID, content, widthMm});
const ready = await preflightFixedStyle(bundle, spec => nativePlan({spec}));
await nativeProduction({action:'create', spec:ready.spec ?? bundle.spec});
const inspected = await nativeInspect();
const finishing = planFixedStyleAdjustments(bundle, inspected, {componentId});
if (finishing.commands.length) await nativeApply(finishing.commands);
```

`nativePlan`은 `vectora_production_plan`의 decoded structuredContent를 반환하는 호출자 함수다. 실제 도구 호출에는 연결의 documentId·최신 expectedRevision·새 requestId를 붙인다. helper는 도구 실행·파일 저장을 하지 않는다. 인구 피라미드는 native 가로 막대 그래프 두 개로 구성되므로, 생성된 두 graph componentId 각각에 새 inspect → 보정 → apply를 수행한다.

`prepare_task.mjs`는 unit의 recipe 호환성을 검사해 `fixedStyles[].spec`과 검증 요구를 돌려준다. **실행은 spec 한 개만** 사용한다. 검사용 `parts`를 추가 생성하지 않는다. 생성 전에 `assertFixedGeometry()`와 native preflight를 통과해야 한다. preflight가 `spec`을 돌려주면 반드시 그 spec으로 생성한다. 이는 글리프의 잉크 높이 차이를 투명 예약 공간으로 상쇄해 고정 도형 위치를 보존하는 측정 결과다. 생성·내용 갱신 후 `requiresNativeFinalization`인 형식은 실제 inspect를 받아 `planFixedStyleAdjustments()`의 등록 보정을 적용하고 다시 inspect한다. 보정은 현재 native 역할 ID에 붙이며 UUID를 저장해 재사용하지 않는다. 이 단계의 획·단위 간격까지 고정 형식의 일부다. 여러 그래프가 있는 문서는 해당 생성본의 실제 graph componentId를 지정한다. 형식 내부 정렬 보정까지 끝낸 후 복합 그림의 최종 위치에 배치한다.

## 보존과 검수

- 같은 크기에서는 도형의 연결·상대 배치·선·해칭·문자 서식을 유지한다. 범례는 예외적으로 내용에 맞춰 폭·높이가 변하는 공용 `composition.legendFrame`을 사용한다. 제목을 위한 긴 선 공백을 미리 만들지 않고, 닫힌 사각 테두리 위에 실측 제목 폭만큼 작은 흰 배경을 겹친다. 문구·기호·값은 슬롯으로 바꾼다. 그래프의 값 변경에 따른 막대 길이·곡선·점 위치는 내용 변화이며, 축·패널·범례의 구조 변화와 구별한다.
- 위아래 범례·예시 상자는 내용에 맞춘 공통 폭으로 연결하고 내부 묶음을 가운데 정렬한다. 물결 바닥의 결과 상자는 물결까지 포함한 전체 외곽이 아니라 평평한 본문 영역의 중앙에 글을 놓는다. 작은 벤 문자 받침은 실제 잉크와 최소 여백만 덮는다.
- 등록된 표와 관계·판단 도식의 핵심 획은 0.4pt를 사용한다. 이는 해당 고정 형식의 값이며 지도·그래프·보조 무늬 및 일반 표 전체에 일괄 적용하지 않는다. 표는 원자료의 `strokePt` 선언을 유지한다.
- 내용이 예약 공간을 넘으면 원문을 유지한 채 실패한다. 자르기·말줄임·글자 축소로 몰래 우회하지 않는다. 범례의 자동 확장은 정상 동작이지만, 고정 의미 도형의 슬롯은 예약 폭을 지킨다. 줄 수가 고정된 슬롯의 명시 개행 외에는 불필요한 개행을 만들지 않는다.
- 반환 bundle은 재귀 freeze되며 geometrySignature가 포함된다. 내용 교체는 builder를 다시 호출한다. spec 직접 편집은 해당 고정 스타일 검증 대상에서 제외한다.
- native 표·그래프·벤 도구가 가능한 부분은 그 도구로 만든다. 미지원 외피·특수 연결·보조 해칭만 편집 가능한 벡터로 보충한다. 독립 보충 도형은 후속 범위·형태 편집에 자동 연동된다고 약속하지 않는다.
- native preflight는 실제 문자 폭·높이와 생성 가능한 구조를 확인한다. graph 전체 plan처럼 도구가 지원하지 않는 검사는 생략 사실을 밝히고 생성 후 실제 bounds로 검증한다. 스펙 hash만으로 완성된 그림의 형태 보존을 판단하지 않는다. 범례는 짧은 문구→긴 문구→짧은 문구로 실제 편집해 양방향 크기 갱신과 내용 보존을 확인한다.
- 생성·내용 교체 후 실제 world 좌표·경로·획·화살표·해칭과 문자 크기/배율을 대조한다. UUID·글리프·자료 값에 따른 그래프 도형은 비교에서 구분한다. `compareNativeFixedStyleGeometry()`의 전체 비문자 비교는 같은 저장본의 재열기 등에 사용한다. 내용 변경 전후에는 고정된 핵심 도형과 내용에 반응하는 범례 크기를 분리해 확인하고, 그래프는 축·패널과 자료 도형을 구별한다.
- 저장→독립 재열기→저장된 JPEG 검수로 완성한다. 고정 슬롯 검증은 앱에서 사용자의 수동 이동을 영구 금지하는 잠금 기능이 아니다.
