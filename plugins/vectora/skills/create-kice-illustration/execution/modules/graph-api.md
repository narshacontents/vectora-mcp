## graph 생성기의 compact spec

`kind:"graph",chartStyle,type,dataFidelity:"exact"|"approximate"|"concept",categories,series`. 새 chartStyle에는 relative가 없다. categories는 비어 있지 않은 1–200개 문자열, series는 1–8개이며 각 `{id,label,values}`는 안정적 고유 ID(영문·숫자·`._:-`, 1–100자)와 같은 범주 수의 유한수/null 배열을 가진다. points 계열도 values가 필요하며 미지 값은 null이다. `concept`는 line에서만 `chartOptions.mode:"concept"`와 함께 쓸 수 있고 관측값이 아니다. points 전체 최대 5,000개.

### KICE profile과 새 chartOptions

새 native production graph는 `styleProfile:"kice"`를 기본 사용하며 `"general"`을 명시하면 일반 스타일을 쓴다. 요청·저장 명시값은 자동 기본값보다 우선하고 정규화된 spec의 `styleProvenance:{schema:"vectora.style-provenance/v1",explicit,automatic}`가 출처를 나눈다. 기존 spec에 profile을 추가해 소급 스타일링하지 않는다.

`styleProfile`과 문자용 `textProfile`은 별개다. 새 그래프의 문자 기본값은 연결 앱의 현재 일러스트 프리셋을 사용하고, 생성된 실제 글꼴·장평·자간·행간이 그 값과 일치하는지 확인한다. 구형 결과의 95%·-60·`lineHeight:1.24` 등을 새 입력에 복사하지 않는다. 행간 원본은 `leadingPercent`이며 크기를 변형해도 비율을 유지한다. 저장된 명시 서식은 변경 요청이 있을 때만 바꾼다.

- 폭 `widthMm:18–108`, `plotHeightMm:15–200`, `strokePt:0.1–4`(pt).

- `strokePt`는 자료선이다. 연결 schema가 제공하면 축은 `chartOptions.axisStrokePt`, 격자·투영 보조선은 `chartOptions.guideStrokePt`로 따로 지정한다. 역할별 지침의 출발값을 쓰고 이미 저장된 명시 스타일은 보존한다. 레이더의 기존 `radarGuideStrokePt` 명시값이 있으면 그 우선순위를 확인한다. 연결 schema가 수치 레이더의 `series[].strokePt`를 제공하면 강조할 계열만 명시해 자료선과 범례 견본을 함께 바꾼다. 미지정 계열은 공통 굵기를 따르며, 같은 필드가 다른 차트에도 지원된다고 추정하지 않는다. 굵기 변경 뒤 범례 견본·자료선·실제 물리 선폭을 함께 확인하며, 생성된 선 몇 개만 수동으로 굵게 만들어 원자료 설정과 어긋나게 하지 않는다.

- series의 `fill`, `pattern:none|dots|hatch`, `line:solid|dash|dash-dot|dot`, `marker:none|circle|triangle|square|open-square|open-circle|open-triangle`를 대응시킨다. 연결 schema가 `dot`을 지원하면 순수 점선은 이 원자료 값으로 지정해 자료선·범례·값 수정에 함께 유지한다. `dash-dot`은 일점쇄선이므로 순수 점선 대신 사용한 뒤 개별 선분을 고치는 방식은 피한다. 표식 없는 선에 표식 무늬를 넣지 않는다. `grid:true,chartOptions:{gridStyle:"dash"}`; 실제 `valueLabels,xTitle,yTitle,unit`, `chartOptions.labelDecimals`(0–10)을 지정한다.

- 연결 schema가 제공하는 사각 막대 계열의 무늬는 series의 `patternSpacingMm`(해치 간격/점 가로 간격), `patternRowSpacingMm`(점 세로 간격), `patternRowOffsetMm`(교대 행 이동), `patternDotDiameterMm`로 조절한다. `pattern:"hatch"`의 방향은 지원되는 해치 설정을 함께 사용한다. 같은 series 설정이 본체와 범례에 적용되므로 견본만 따로 고치지 않는다. 미지원 계열·범주별 스타일에 이 필드를 추측해 보내지 않는다.

- 촘촘한 연령·범주를 세로로 읽어야 하면 live schema의 `chartOptions.categoryTextDirection:"vertical"`을 사용하고 categories 원문은 그대로 둔다. `10~14`처럼 두세 자리 수를 묶어 읽는 연령 구간은 지원되는 `categoryVerticalNumericGrouping:"digits-2-3"`을 함께 사용한다. 네이티브 세로 글상자와 저장된 방향을 확인한다. 한 글자씩 개행하거나 labelRotation으로 세로쓰기를 흉내 내지 않는다.

- 단위와 축 제목은 [수치 축 설정](axis-options.md)의 네이티브 조판으로 함께 배치한다. X 단위는 마지막 수치와 같은 기준선, 짧은 축 제목은 끝 아래, 가운데 제목은 축 아래를 출발점으로 하며 실제 배치는 자료의 의미·공간에 따라 선택한다. Y 제목/단위와 최상단 눈금은 별개 문자열의 위치를 따로 추측하지 말고 함께 측정한다. 생성 문자를 수동 이동하기 전에 source의 제목·단위·위치 설정을 수정하고 값 변경·재열기에서도 보존되는지 확인한다.

- 어두운 누적 구간에서 생성기가 값 문자를 흰색으로 만들었는지 실제 속성을 확인한다. 이 자동 대비색을 공통 판독성 규칙의 검정 글자·흰 윤곽선과 혼동하지 않는다. 원자료 옵션에 없는 문자 외관은 해당 값 문자의 네이티브 스타일로 첫 조판에 보충하고, 자료를 갱신한 뒤에도 같은 역할의 문자 외관이 유지되는지 확인한다.

- live graph 계약이 제공하면 가로 100% 띠의 구간 이름·시점 간 경계 연결은 `chartOptions.percentBarComparison:{segmentLabels:true,boundaryLinks:true}`로 만든다. `type:"bar",chartStyle:"percent-bar"`의 한 누적 묶음에서만 쓰며 필요 없는 항목은 생략하거나 false로 둔다. 이름은 첫 띠의 실제 구간 중심, 점선은 인접 띠의 내부 누적 경계를 따른다. 원자료의 계열 ID·순서를 유지해 값을 갱신하고 선 끝을 별도로 옮기지 않는다. 구간보다 넓은 이름은 이웃 글자와 전체 외곽 폭을 함께 확인한다. 미지원 연결본에서만 보충하며 값 수정 뒤 수동 갱신이 필요한 한계를 기록한다.

- `legend:above|beneath|right|inside|none`; 아래는 `beneath`로 보낸다. `chartOptions.legendAnchor`는 내부 범례의 후보 우선순위이며 위치 잠금이 아니다. 네 모서리 `top-left|top-right|bottom-left|bottom-right` 외에, 지원되는 2D Cartesian의 연결 schema가 제공하면 `top-center|bottom-center|middle-left|middle-right|middle-center`도 선택한다. 같은 지원 계열의 `chartOptions.legendArrangement:auto|horizontal|vertical`로 배열을 별도 지정한다. `auto`는 폭에 맞는 배열과 충돌 없는 후보를 찾는 초안이므로 [범례 배치 원칙](../../components/data-surface.md)에 따라 AI가 최종 위치·배열을 선택한다. `legendPlacement`의 요청/실제 위치·배열·후보·fallback을 읽는다. 내부 배치가 어려우면 다른 내부 후보나 `beneath`로 바뀔 수 있다. `chartOptions.legendReverse`, `legendStyle:swatch|label-fill` 중 견본 상자는 `swatch` 우선이다.

- 사각 막대의 작은 면 채움 범례는 지원 앱에서 `chartOptions.legendSwatch:"square"`로 2.4mm 정사각 견본을 선택한다. 아래 범례의 좌우를 플롯에 맞출 때는 `legend:"beneath",chartOptions.legendBox:"plot"`을 함께 사용한다. 실측 문구가 맞지 않으면 배열·문구·전체 폭을 조정하고 글자를 축소하지 않는다. `legendBox:"content"`는 내용 폭이다. 선 자료의 범례에는 정사각 면 견본을 적용하지 않는다.

- 초안 JPEG를 본 뒤 source의 `legendAnchor`·`legendArrangement`를 명시해 `update,policy:"preserve"`로 갱신한다. 충돌 검사 뒤 보고된 실제 위치와 JPEG를 다시 확인하며 자료 연결을 해제하지 않는다. 오른쪽 범례의 높이 정렬·간격은 지원되는 `rightLegend` 설정을 우선한다. 그 밖에 source 설정으로 표현할 수 없는 보정은 component inspect의 실제 role key로 `action:"override",spec:{key,mode:"fixed"|"offset"|"release",xMm?,yMm?}`를 사용한다. `fixed`는 현재 위치 보존, `offset`은 재생성 위치에 대한 mm 이동량이며 이 명령 자체는 즉시 이동하지 않는다. 다음 preserve update에서 확인하거나 즉시 이동용 native transform을 사용하되 같은 이동을 이중 적용하지 않는다. 상자·제목뿐 아니라 계열에 속한 견본·문자도 포함해 범례 전체를 보정한다. `graph.legend` 역할만으로 전체가 선택된다고 가정하지 않으며, 배열 변경을 개별 이동으로 흉내 내지 않는다. 값·문구 변경 후 저장·재열기와 JPEG로 대응·간격·충돌을 다시 확인하고, 필요한 자유도를 지원하지 않으면 앱 담당자에게 남긴다.

- chartStyle을 생략하는 legacy는 별도 계약이다. `layout,panels,x,yDomain,labelOffsets`를 새 spec에 섞지 않는다. legacy는 새 그래프 UI 편집 지원을 약속하지 않는다. live 도구 spec이 open record여도 허용 옵션을 추측하지 않는다.

연결 그래프의 폭은 source의 `widthMm`나 지원되는 단일 native graph/기존 native parent의 `fitContentWidth`로 변경한다. 일반 그룹으로 감싸거나 보충 개체와 함께 선택한 상태에서 일반 배율 조정을 시도하지 않는다. `NATIVE_GRAPH_FIT_UNSUPPORTED`이면 source 폭을 바꾸고 독립 보충 요소의 위치만 맞춘 뒤 `fitSelection`으로 대지를 맞춘다. 오류를 피하려고 바인딩을 해제하지 않는다. 축 범위·자료 좌표·8pt 문자와 실제 외곽 폭을 재확인한다.

live graph 계약이 위치 갱신을 지원하면 독립 그래프의 이동도 `update,policy:"preserve"`의 `xMm/yMm`로 처리한다. 이 좌표는 활성 대지 기준 **구성요소 원점**이며 실제 칠해진 외곽의 좌상단/중심과 다르다. 대지를 맞춘 기존 파일은 대지 원점과 현재 실제 위치를 먼저 확인한다. 한 축을 생략하면 그 축의 현재 위치를 유지한다. composition·본문·대화 소유자의 내부 그래프는 소유자의 배치 규칙을 따르며 자식 좌표로 강제 이동하지 않는다. 값·크기와 함께 바꿀 때도 안정적 ID를 유지하고 실제 기하를 확인한다.

축 선·눈금 획·눈금 문자는 서로 다른 표시 설정일 수 있다. 축 없이 직접 값만 비교하는 가로 막대를 만들 때는 실제 schema의 `showXAxis/showYAxis`, `showXTicks/showYTicks`뿐 아니라 `showYLabels`도 확인해 남길 정보를 source에 명시한다. 축을 숨겼는데 고립된 0이나 단위가 남으면 생성된 문자만 삭제하기 전에 해당 지원 설정과 단위의 소속을 고친다. 생성된 보조선·문자를 삭제만 하면 재생성 때 돌아올 수 있다. 지원 표시 설정이나 보존되는 비자료 스타일 보정을 사용하고, 최종 보정 뒤 자료 값 수정·복원에서도 같은 표시 정책이 유지되는지 확인한다.

일반 `column/bar`에서는 선택한 정보 표시 방식을 `grid`·`valueLabels`에 반영한다. 값과 점선이 모두 필요하면 같은 기준 위치를 유지하고 문자에 작은 흰 배경을 적용한다. 지원 앱의 자동 처리와 실제 출력·재열기를 확인하며 임의 필드는 만들지 않는다. 하나만 필요한 자료에서는 수치 우선은 `valueLabels:true,grid:false`, 대소관계 우선은 `valueLabels:false,grid:true,chartOptions:{gridStyle:"dash"}`를 사용한다. 원자료 값은 삭제하지 않는다. 개별 값만 이동시키는 이전 자동 배치를 그대로 납품하지 말고, 실제 출력에서 같은 역할의 막대 끝과 값 라벨 간격을 확인한다. 점선 생략은 장식 격자에만 해당하며 축·자료선·실제 오차 막대를 지우지 않는다.

별표 각주가 여러 개면 `chartOptions.note`에 줄바꿈 문자열만 넣어 끝내지 않는다. 해당 필드에 문단 접두부 정렬이 없으면 그래프 가까이에 별도의 편집 가능한 글상자를 만들고, typography의 반칸·공통 본문 시작 열과 native 문단 항목 고정을 적용한다. 출처는 각주와 구분하고 그래프 높이를 바꾼 뒤 보충 글상자 위치도 다시 확인한다.
