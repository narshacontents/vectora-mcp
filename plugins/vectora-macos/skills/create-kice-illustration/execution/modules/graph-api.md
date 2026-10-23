## graph 생성기의 compact spec

`kind:"graph",chartStyle,type,dataFidelity:"exact"|"approximate"|"concept",categories,series`. 새 chartStyle에는 relative가 없다. categories는 비어 있지 않은 1–200개 문자열, series는 1–8개이며 각 `{id,label,values}`는 안정적 고유 ID(영문·숫자·`._:-`, 1–100자)와 같은 범주 수의 유한수/null 배열을 가진다. points 계열도 values가 필요하며 미지 값은 null이다. `concept`는 line에서만 `chartOptions.mode:"concept"`와 함께 쓸 수 있고 관측값이 아니다. points 전체 최대 5,000개.

### KICE profile과 새 chartOptions

새 native production graph는 `styleProfile:"kice"`를 기본 사용하며 `"general"`을 명시하면 일반 스타일을 쓴다. 요청·저장 명시값은 자동 기본값보다 우선하고 정규화된 spec의 `styleProvenance:{schema:"vectora.style-provenance/v1",explicit,automatic}`가 출처를 나눈다. 기존 spec에 profile을 추가해 소급 스타일링하지 않는다.

`styleProfile`과 문자용 `textProfile`은 별개다. 새 그래프의 문자 기본값은 연결 앱의 현재 일러스트 프리셋을 사용하고, 생성된 실제 글꼴·장평·자간·행간이 그 값과 일치하는지 확인한다. 구형 결과의 95%·-60·`lineHeight:1.24` 등을 새 입력에 복사하지 않는다. 행간 원본은 `leadingPercent`이며 크기를 변형해도 비율을 유지한다. 저장된 명시 서식은 변경 요청이 있을 때만 바꾼다.

- 폭 `widthMm:18–108`, `plotHeightMm:15–200`, `strokePt:0.1–4`(pt).

- `strokePt`는 자료선이다. 연결 schema가 제공하면 축은 `chartOptions.axisStrokePt`, 격자·투영 보조선은 `chartOptions.guideStrokePt`로 따로 지정한다. 역할별 지침의 출발값을 쓰고 이미 저장된 명시 스타일은 보존한다. 레이더의 기존 `radarGuideStrokePt` 명시값이 있으면 그 우선순위를 확인한다. 굵기 변경 뒤 범례 견본·자료선·실제 물리 선폭을 함께 확인하며, 생성된 선 몇 개만 수동으로 굵게 만들어 원자료 설정과 어긋나게 하지 않는다.

- series의 `fill`, `pattern:none|dots|hatch`, `line:solid|dash|dash-dot|dot`, `marker:none|circle|triangle|square|open-square|open-circle|open-triangle`를 대응시킨다. 연결 schema가 `dot`을 지원하면 순수 점선은 이 원자료 값으로 지정해 자료선·범례·값 수정에 함께 유지한다. `dash-dot`은 일점쇄선이므로 순수 점선 대신 사용한 뒤 개별 선분을 고치는 방식은 피한다. 표식 없는 선에 표식 무늬를 넣지 않는다. `grid:true,chartOptions:{gridStyle:"dash"}`; 실제 `valueLabels,xTitle,yTitle,unit`, `chartOptions.labelDecimals`(0–10)을 지정한다.

- 단위와 축 제목을 구분한다. 숫자 눈금 옆의 `(월)`·`%`처럼 눈금과 같은 기준선에 놓을 단위는 지원되는 `xUnit` 경로를 사용한다. `xTitlePosition:"end"`는 축 제목의 가로 위치이며 눈금과 같은 높이를 뜻하지 않는다. 끝에 놓는 짧은 축 제목은 첫 조판에서 마지막 눈금·화살표·자료선과 함께 보고, 별도의 큰 아래 여백이 생기면 축 끝 주변의 빈 공간을 활용한다. 눈금 줄에 공간이 부족하면 축 위도 가능하되 실제 자료나 이름을 가리지 않는다. 지원되는 간격 설정과 네이티브 문자 배치로 조정하고 자료 수정 뒤에도 보존되는지 확인한다. 가운데 축 제목까지 일률적으로 위로 옮기지 않는다. 월별 자료의 범주/수치축 선택은 간격의 의미에 맞추고, 단위를 올리려고 축의 의미를 바꾸지 않는다.

- 어두운 누적 구간에서 생성기가 값 문자를 흰색으로 만들었는지 실제 속성을 확인한다. 이 자동 대비색을 공통 판독성 규칙의 검정 글자·흰 윤곽선과 혼동하지 않는다. 원자료 옵션에 없는 문자 외관은 해당 값 문자의 네이티브 스타일로 첫 조판에 보충하고, 자료를 갱신한 뒤에도 같은 역할의 문자 외관이 유지되는지 확인한다.

- `legend:above|beneath|right|inside|none`; 아래는 beneath이고 bottom/below 별칭은 쓰지 않는다. inside의 `legendAnchor:top-left|top-right|bottom-left|bottom-right`, `legendReverse`, `legendStyle:swatch|label-fill` 중 견본 상자는 swatch 우선이다.

- chartStyle을 생략하는 legacy는 별도 계약이다. `layout,panels,x,yDomain,labelOffsets`를 새 spec에 섞지 않는다. legacy는 새 그래프 UI 편집 지원을 약속하지 않는다. live 도구 spec이 open record여도 허용 옵션을 추측하지 않는다.

연결 그래프의 폭은 source의 `widthMm`나 지원되는 단일 native graph/기존 native parent의 `fitContentWidth`로 변경한다. 일반 그룹으로 감싸거나 보충 개체와 함께 선택한 상태에서 일반 배율 조정을 시도하지 않는다. `NATIVE_GRAPH_FIT_UNSUPPORTED`이면 source 폭을 바꾸고 독립 보충 요소의 위치만 맞춘 뒤 `fitSelection`으로 대지를 맞춘다. 오류를 피하려고 바인딩을 해제하지 않는다. 축 범위·자료 좌표·8pt 문자와 실제 외곽 폭을 재확인한다.

live graph 계약이 위치 갱신을 지원하면 독립 그래프의 이동도 `update,policy:"preserve"`의 `xMm/yMm`로 처리한다. 이 좌표는 활성 대지 기준 **구성요소 원점**이며 실제 칠해진 외곽의 좌상단/중심과 다르다. 대지를 맞춘 기존 파일은 대지 원점과 현재 실제 위치를 먼저 확인한다. 한 축을 생략하면 그 축의 현재 위치를 유지한다. composition·본문·대화 소유자의 내부 그래프는 소유자의 배치 규칙을 따르며 자식 좌표로 강제 이동하지 않는다. 값·크기와 함께 바꿀 때도 안정적 ID를 유지하고 실제 기하를 확인한다.

축 선·눈금 획·눈금 문자는 서로 다른 표시 설정일 수 있다. 축 없이 직접 값만 비교하는 가로 막대를 만들 때는 실제 schema의 `showXAxis/showYAxis`, `showXTicks/showYTicks`뿐 아니라 `showYLabels`도 확인해 남길 정보를 source에 명시한다. 축을 숨겼는데 고립된 0이나 단위가 남으면 생성된 문자만 삭제하기 전에 해당 지원 설정과 단위의 소속을 고친다. 자료 값 수정 뒤 같은 표시 정책이 유지되어야 한다.

일반 `column/bar`에서는 선택한 정보 표시 방식을 `grid`·`valueLabels`에 반영한다. 값과 점선이 모두 필요하면 같은 기준 위치를 유지하고 문자에 작은 흰 배경을 적용한다. 지원 앱의 자동 처리와 실제 출력·재열기를 확인하며 임의 필드는 만들지 않는다. 하나만 필요한 자료에서는 수치 우선은 `valueLabels:true,grid:false`, 대소관계 우선은 `valueLabels:false,grid:true,chartOptions:{gridStyle:"dash"}`를 사용한다. 원자료 값은 삭제하지 않는다. 개별 값만 이동시키는 이전 자동 배치를 그대로 납품하지 말고, 실제 출력에서 같은 역할의 막대 끝과 값 라벨 간격을 확인한다. 점선 생략은 장식 격자에만 해당하며 축·자료선·실제 오차 막대를 지우지 않는다.
