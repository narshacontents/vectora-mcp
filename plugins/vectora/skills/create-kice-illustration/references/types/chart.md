# 차트 · chart

유한한 관측값의 범주·시점·구성비를 표현한다. 연속 이론·개념 관계와 경계·영역은 숫자가 없어도 graph다. 비정량 특성 축에 개별 대상의 위치를 배치하면 diagram/schematic이다. 아래에서 하나만 읽는다.

| ID | TSV 폴더 ID | 분류표의 한국어 명칭 | 읽을 하위유형 |
|---|---|---|---|
| `bar` | `D2-01_Bar` | 막대 | [bar](../subtypes/chart/bar.md) |
| `stacked-bar` | `D2-02_StackedBar` | 누적 막대·띠 | [stacked-bar](../subtypes/chart/stacked-bar.md) |
| `pie` | `D2-03_Pie` | 원·도넛 | [pie](../subtypes/chart/pie.md) |
| `line` | `D2-04_Line` | 선 | [line](../subtypes/chart/line.md) |
| `scatter` | `D2-05_Scatter` | 산점·버블 | [scatter](../subtypes/chart/scatter.md) |
| `dot` | `D2-06_Dot` | 점 | [dot](../subtypes/chart/dot.md) |
| `radar` | `D2-07_Radar` | 방사형 | [radar](../subtypes/chart/radar.md) |
| `others` | `D2-08_Others` | 기타 차트 | [others](../subtypes/chart/others.md) |

## 차트 공통 데이터·보조선

- 항목·계열·시점·단위·결측과 척도를 확정한다. 결측은 0이 아니고 실제 x간격은 유지한다. 같은 좌표는 겹친 채 두고 표식·라벨만 구별한다. 근접 점도 좌표를 벌리지 않으며 표식 중심·크기 의미를 보존한다. 계열과 채움·무늬·선·표식 대응을 전체에서 유지한다. 같은 채움 견본만으로 구별되지 않는 계열은 직접 영역명이나 서로 다른 무늬·선·표식으로 대응시킨다.
- 수치 Y축의 선·산점·세로 막대/누적 막대는 주요 눈금의 가로 보조 파선을 기본으로 둔다. 값 라벨로 대신하지 않는다. 단일/소수 항목이 바닥선+값으로 충분하거나 사용자가 생략을 지정하면 생략할 수 있다. 가로 막대는 값 축에 수직인 세로 보조선이다.
- 작은 패널은 주요 높이 약 3–5개부터 정한다. 보조선은 자료 영역 끝까지만, 자료·문자 뒤에 두고 축/영점/테두리와 중복하지 않는다. 패널 여백·범례·생략 구간으로 연장하지 않는다. X 판독에 필요한 세로선만 추가하며 점→축 인출선과 전면 격자를 구별한다. 원/도넛에는 격자가 없다.
- 이중 축은 필요할 때만 각각 단위·범위·계열 대응을 명시해 독립 계산한다. 시각적으로 맞추려고 척도를 바꾸지 않는다. 점 라벨은 관측값, 축 눈금은 척도다. 기간 화살표·괄호 양끝은 실제 시점에 맞추고 떨어진 띠에는 짧은 보조선을 둔다. 공통 시간 단위는 마지막 시점 문자열과 분리한다.

- 축 눈금·부호를 포함한 값 라벨·범주명은 각각 별도 공간에 둔다. 음수 값은 영점 아래의 범주명과 겹치지 않게 하고, 눈금은 실제 척도에 맞춰 필요한 위치에 빠짐없이 표시한다. 끝점 계열명은 표식 외곽과 간격을 두며 선·점·축·다른 문자와 충돌하면 라벨만 offset/인출선으로 옮긴다. 자료점·막대 끝·수치 좌표는 이동하지 않는다.
- 작은 차트의 범례는 실제 문구와 견본에 필요한 폭·행수로 정하며 본체에 비해 과대하게 잡지 않는다. 직접 계열명으로 충분하면 범례를 생략하고, 범례를 위해 자료 영역을 불필요하게 축소하지 않는다.

## graph 생성기의 compact spec

`kind:"graph",chartStyle,type,dataFidelity:"exact"|"approximate"|"concept",categories,series`. 새 chartStyle에는 relative가 없다. categories는 비어 있지 않은 1–200개 문자열, series는 1–8개이며 각 `{id,label,values}`는 안정적 고유 ID(영문·숫자·`._:-`, 1–100자)와 같은 범주 수의 유한수/null 배열을 가진다. points 계열도 values가 필요하며 미지 값은 null이다. `concept`는 line에서만 `chartOptions.mode:"concept"`와 함께 쓸 수 있고 관측값이 아니다. points 전체 최대 5,000개.

### KICE profile과 새 chartOptions

새 native production graph는 `styleProfile:"kice"`를 기본 사용하며 `"general"`을 명시하면 일반 스타일을 쓴다. 요청·저장 명시값은 자동 기본값보다 우선하고 정규화된 spec의 `styleProvenance:{schema:"vectora.style-provenance/v1",explicit,automatic}`가 출처를 나눈다. 기존 spec에 profile을 추가해 소급 스타일링하지 않는다.

- 공통 조판: `yTitleOrientation:"horizontal"|"vertical"|"rotated"`, `xTitlePosition:"end"|"center"`, `labelPolicy:"all"|"major"`, `labelRotation:-90..90`(degree), `zeroLineStyle:"solid"|"dash"|"dot"`.
- 막대: `barWidthMm`와 `groupGapMm`는 각각 0–20mm의 물리 폭·간격이다. 요청/저장 explicit 값이 자동 폭보다 우선한다. histogram interval이나 값에 비례하는 길이·면적의 의미를 바꾸지 않는다.
- 데이터 점: `projectionLines:[{seriesId,indices,axes?:"x"|"y"|"both"}]`에서 `indices`는 0 기반 범주 인덱스이고 `axes`는 투영할 축이다. `specialPoints`도 0 기반 범주 인덱스다. 축 투영은 선택한 점 좌표에만 붙고 자료값은 이동하지 않는다.
- 연속 개념 개형: line 계열은 `chartOptions:{mode:"concept",semanticLabels:"end"|"legend"|"none",specialPoints:[...]}`를 지원한다. spec의 `series.values`는 경로 모양을 놓기 위한 내부 좌표로만 입력하며 관측값으로 설명하거나 숫자 축·눈금으로 표시하지 않는다. `domain`, `ticks`, `xDomain`, `xTicks`는 실제 정량 축이 필요할 때만 준다. 곡선 이름을 유지할 때 `semanticLabels:"none"`으로 지우지 말고 end label 또는 legend를 고른다.
- 덤벨 방향: `orientation:"horizontal"|"vertical"`은 dumbbell에서만 사용한다. 세로형도 전체 그림을 회전하지 않고 범주를 가로축, 값을 세로축에 둔다.

- 폭 `widthMm:18–108`, `plotHeightMm:15–200`, `strokePt:0.1–4`(pt). `domain,ticks`는 값 축, `xDomain,xTicks`는 독립축. 막대 값 축은 0을 포함하고 수동 축은 모든 표시값을 포함한다. 기본 선 수치 X에는 `chartOptions:{xNumeric:true},xValues`를 범주 수와 같은 엄격 증가 배열로 준다.
- series의 `fill`, `pattern:none|dots|hatch`, `line:solid|dash|dash-dot`, `marker:none|circle|triangle|square|open-square|open-circle|open-triangle`를 대응시킨다. 표식 없는 선에 표식 무늬를 넣지 않는다. `grid:true,chartOptions:{gridStyle:"dash"}`; dot 옵션은 규격 1.5/1pt와 다르다. 실제 `valueLabels,xTitle,yTitle,unit`, `chartOptions.labelDecimals`(0–10)을 지정한다.
- `legend:above|beneath|right|inside|none`; 아래는 beneath이고 bottom/below 별칭은 쓰지 않는다. inside의 `legendAnchor:top-left|top-right|bottom-left|bottom-right`, `legendReverse`, `legendStyle:swatch|label-fill` 중 견본 상자는 swatch 우선이다.
- `axisBreaks:{x?:{from,to,gapMm,mode?:"axis"|"through",lowerLayout?:"proportional"|"compact"},y?:...,secondaryY?:...}`. `through`는 자료 막대를 관통하는 생략 표현, `axis`는 축의 생략 표시다. `compact`는 0부터 시작하고 생략 하단 구간에 자료·유효 눈금이 없을 때만 쓸 수 있다. KICE가 조건을 만족하는 빈 하단을 압축해도 `from`/`to`와 자료값은 변경하지 않는다. 생략 뒤 값은 실제 축 mapping으로 재검수한다. 범주 X 생략은 인접 범주 사이만. 생략으로 숨겨진 자료와 누적 결측 warnings를 확인한다. `chartOptions.annotations:[{from,to,label,position:above|below}]` 최대 20개, 범주는 0 기반 인덱스·수치 X는 실제 좌표; 기본 가로 막대에는 적용하지 않는다.
- 혼합 `chartStyle:"bar-scatter",type:"bar"`는 계열 `renderRole:bar|line|scatter|area,axis:primary|secondary`로 만들 수 있다. 실제 secondary 계열에만 `chartOptions.secondaryDomain,secondaryTicks,secondaryTitle`을 준다. 전용 옵션을 다른 스타일에 섞지 않는다.
- chartStyle을 생략하는 legacy는 별도 계약이다. `layout,panels,x,yDomain,labelOffsets`를 새 spec에 섞지 않는다. legacy는 새 그래프 UI 편집 지원을 약속하지 않는다. live 도구 spec이 open record여도 허용 옵션을 추측하지 않는다.

## 선택 Node 경로·최종 대조

production을 우선한다. 사용할 수 없거나 해당 구조가 미지원이면 `node scripts/build_graph.mjs --spec <입력.json> --output <그래프.svg> [--font <UND-v3.0-Regular.otf>]`의 bar/pie/line 경로를 쓸 수 있다. 실제 로컬 폰트와 fontkit 필요; 기본 덮어쓰기 금지. 폭 40–108, 높이 15–200, dataFidelity exact/approximate/relative(원에는 relative 불가), legend none/right/center(원 2개), domain/ticks/grid/unit/panelGapMm/source 지원. 최소 입력은 `type:bar|pie|line`, `dataFidelity`, `series:[{label,fill?,pattern?,line?,marker?,values?}]`, `widthMm`, `plotHeightMm`다. bar horizontal은 `layout:"horizontal",categories,series.values,domain:[0,max]`; bar panels/mirror는 `layout,panels:[{label,values}]`(계열 순서), mirror는 양수 2패널·범례 없음. pie는 `panels:[{label,values,outside?}]`(각 합100), `labelMode:category-percent|percent`; line은 `x`, 계열 values(null 결측), 증가 `xValues?`, `xAxis:zero|bottom`, `xLabelsAt:axis|bottom`, `labelMode:end|legend`, `valueLabels?`다. 이 CLI 입력에 production의 chartStyle/전용 옵션을 섞지 않는다. 예시 JSON을 복사하지 않는다. report의 geometry·textBounds·checks·substitutions/vectorGlyphs는 제한된 근거이고 실제 가져온 렌더·물리 크기·편집성을 확인한다. 필요한 눈금/보조선이 미지원이면 후속 편집으로 추가한다. labelOffsets는 예외적으로 문서 px다.

자료·영점·범위·결측·각도·계열 대응과 외곽·무늬·라벨을 따로 대조한다. 누적 경계·크기 변환·두 축은 수치로 검산한다. 정확 입력/추정/상대표현 상태를 그림 밖에 기록한다.
