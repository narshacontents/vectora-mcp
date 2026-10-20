## graph 생성기의 compact spec

`kind:"graph",chartStyle,type,dataFidelity:"exact"|"approximate"|"concept",categories,series`. 새 chartStyle에는 relative가 없다. categories는 비어 있지 않은 1–200개 문자열, series는 1–8개이며 각 `{id,label,values}`는 안정적 고유 ID(영문·숫자·`._:-`, 1–100자)와 같은 범주 수의 유한수/null 배열을 가진다. points 계열도 values가 필요하며 미지 값은 null이다. `concept`는 line에서만 `chartOptions.mode:"concept"`와 함께 쓸 수 있고 관측값이 아니다. points 전체 최대 5,000개.

### KICE profile과 새 chartOptions

새 native production graph는 `styleProfile:"kice"`를 기본 사용하며 `"general"`을 명시하면 일반 스타일을 쓴다. 요청·저장 명시값은 자동 기본값보다 우선하고 정규화된 spec의 `styleProvenance:{schema:"vectora.style-provenance/v1",explicit,automatic}`가 출처를 나눈다. 기존 spec에 profile을 추가해 소급 스타일링하지 않는다.

- 폭 `widthMm:18–108`, `plotHeightMm:15–200`, `strokePt:0.1–4`(pt).

- series의 `fill`, `pattern:none|dots|hatch`, `line:solid|dash|dash-dot`, `marker:none|circle|triangle|square|open-square|open-circle|open-triangle`를 대응시킨다. 표식 없는 선에 표식 무늬를 넣지 않는다. `grid:true,chartOptions:{gridStyle:"dash"}`; dot 옵션은 규격 1.5/1pt와 다르다. 실제 `valueLabels,xTitle,yTitle,unit`, `chartOptions.labelDecimals`(0–10)을 지정한다.

- `legend:above|beneath|right|inside|none`; 아래는 beneath이고 bottom/below 별칭은 쓰지 않는다. inside의 `legendAnchor:top-left|top-right|bottom-left|bottom-right`, `legendReverse`, `legendStyle:swatch|label-fill` 중 견본 상자는 swatch 우선이다.

- chartStyle을 생략하는 legacy는 별도 계약이다. `layout,panels,x,yDomain,labelOffsets`를 새 spec에 섞지 않는다. legacy는 새 그래프 UI 편집 지원을 약속하지 않는다. live 도구 spec이 open record여도 허용 옵션을 추측하지 않는다.

연결 그래프의 폭은 source의 `widthMm`나 지원되는 단일 native graph/기존 native parent의 `fitContentWidth`로 변경한다. 일반 그룹으로 감싸거나 보충 개체와 함께 선택한 상태에서 일반 배율 조정을 시도하지 않는다. `NATIVE_GRAPH_FIT_UNSUPPORTED`이면 source 폭을 바꾸고 독립 보충 요소의 위치만 맞춘 뒤 `fitSelection`으로 대지를 맞춘다. 오류를 피하려고 바인딩을 해제하지 않는다. 축 범위·자료 좌표·8pt 문자와 실제 외곽 폭을 재확인한다.

live graph 계약이 위치 갱신을 지원하면 독립 그래프의 이동도 `update,policy:"preserve"`의 `xMm/yMm`로 처리한다. 이 좌표는 활성 대지 기준 **구성요소 원점**이며 실제 칠해진 외곽의 좌상단/중심과 다르다. 대지를 맞춘 기존 파일은 대지 원점과 현재 실제 위치를 먼저 확인한다. 한 축을 생략하면 그 축의 현재 위치를 유지한다. composition·본문·대화 소유자의 내부 그래프는 소유자의 배치 규칙을 따르며 자식 좌표로 강제 이동하지 않는다. 값·크기와 함께 바꿀 때도 안정적 ID를 유지하고 실제 기하를 확인한다.

일반 `column/bar`의 값 라벨은 기본 측정 배치를 먼저 사용한다. 막대 끝 근처에 두되 점선·축·다른 값과 충돌하면 옆으로 이동할 수 있다. 충돌 회피에 필요한 지시선만 `graph.label.leader`로 남으며 격자선이 아니다. 모든 라벨에 선을 덧붙이거나 실제 오차 막대를 지우지 않는다. 이 기본값을 지원하지 않는 앱에는 옵션을 추측해 보내지 말고 현재 계약과 결과를 대조한다.
