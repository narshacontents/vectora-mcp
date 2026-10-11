# 연속 그래프 · graph

연속 함수·가능 영역·분포의 이론 관계가 의미다. 유한 관측 연결은 chart다. **2축 개념도는 축에 숫자가 없어도 연속적인 관계·경계·영역 자체가 뜻을 가지면 graph/others**, 개별 대상들을 비정량 특성의 양끝 사이에 배치하는 구조면 diagram/schematic이다. 숫자 유무나 그림 모양만으로 다시 분류하지 않는다. 아래에서 하나만 읽는다.

| ID | TSV 폴더 ID | 분류표의 한국어 명칭 | 읽을 하위유형 |
|---|---|---|---|
| `curve` | `D3-01_Curve` | 함수 곡선 | [curve](../subtypes/graph/curve.md) |
| `frontier` | `D3-02_Frontier` | 경계선 | [frontier](../subtypes/graph/frontier.md) |
| `distribution` | `D3-03_Distribution` | 분포 곡선 | [distribution](../subtypes/graph/distribution.md) |
| `others` | `D3-04_Others` | 기타 연속 | [others](../subtypes/graph/others.md) |

## 연속 관계의 공통 규칙

- 식·정의역·척도·단위·교점·기울기·이동 관계를 요청에서 확정한다. 비율·증가율 등 rate의 지표명과 단위는 분리해 보존하며 백분율 표현에는 %를 표시한다. 0–1 비율과 %를 근거 없이 바꾸지 않는다. 수치 없는 개형에 새 숫자 눈금·전면 격자를 만들지 않는다. 정성 개형의 내부 제작 좌표를 실제 값으로 표시하지 않는다.
- 값이 주어진 축은 실제 매핑으로 계산하고 영점·음수·생략을 구별한다. 숫자 Y눈금 비교가 필요한 경우 주요 높이 약 3–5개의 보조 파선을 자료 영역 안 뒤쪽에 둔다. 특정 점의 대응은 필요한 점→축 인출선만 쓴다. 요청된 점의 축 대응값은 빠짐없이 표시하고 눈금·부호·범주/구간 문구를 분리한다.
- 교점·접선·증감·곡률·이동 화살표는 제공된 관계만 표시한다. 곡선을 보기 좋게 바꾸어 의미를 바꾸지 않는다. 값 없는 개형과 정량 함수는 다른 충실도이며 모든 샘플/제어점을 유한 관측으로 설명하지 않는다.

- 점·곡선 끝의 기호/계열명은 축·선·표식·다른 문자와 간격을 둔다. 충돌은 라벨 offset/인출선으로 풀고 실제 점·교점·절편·곡선 좌표는 이동하지 않는다. 범례는 문구·견본에 필요한 크기로 두고 작은 개형보다 과대하게 만들지 않으며 직접 이름으로 충분하면 생략한다.

## 사용할 수 있는 생성 경로

- 수치 함수는 충분한 실제 계산 샘플로 `kind:"graph",chartStyle:"line"|"smooth-line"|"step-line",type:"line",dataFidelity:"exact"|"approximate",categories,series,xValues,chartOptions:{xNumeric:true}`를 사용할 수 있다. 계열은 `{id,label,values}`이고 categories/xValues/values 길이는 같으며 xValues는 엄격 증가한다. categories 2–200, series 1–8, 폭 18–108mm, 높이 15–200mm; `domain,ticks,xDomain,xTicks,strokePt,grid,valueLabels,xTitle,yTitle,unit`은 실제 내용에 맞춘다. smooth-line 보간이 식의 교점·곡률을 바꾸면 그대로 쓰지 말고 해당 경로를 보정한다. 기본 파선·표식·범례는 실제 속성으로 검수한다.
- 새 chartStyle의 정량 선은 `dataFidelity:"exact"|"approximate"`이며 relative를 받지 않는다. 수치 없는 개념 개형은 line style에서 `dataFidelity:"concept"`와 `chartOptions:{mode:"concept",semanticLabels:"end"|"legend"|"none",specialPoints:[...]}`를 함께 사용한다. schema상 `series.values` 배열은 곡선 형상용 내부 좌표로 입력하지만 관측 자료로 해석하거나 숫자 축·눈금으로 표시하지 않는다. 특수점은 0 기반 범주 인덱스다. 실제 legacy `type:"line"` 또는 선택 Node `node skills/create-kice-illustration/scripts/build_graph.mjs --spec <입력.json> --output <곡선.svg> [--font <UND-v3.0-Regular.otf>]`의 relative 경로를 쓸 때도 숫자 눈금/값 라벨 없이 내부 레이아웃 좌표만 쓴다. legacy line은 `x,series:[{id,label,values}],xValues?,domain,ticks,xAxis:zero|bottom,xLabelsAt:axis|bottom,labelMode:end|legend`; 폭 40–108mm·높이 15–200mm, `legend:none|right`, `labelOffsets`는 문서 px다. 새/legacy 필드를 혼합하지 않는다. 선택 Node는 type line·실제 로컬 폰트/fontkit이 필요하고 기본 덮어쓰기는 금지다. SVG와 .layout.json의 측정·geometry 보고서를 검토한 뒤 실제 가져온 렌더를 확인한다.
- 엔진이 함수의 기본 의미·비선형 축·곡면·면적 경계를 표현할 수 없으면 실제 식/개형에 맞는 편집 가능 path·면·라벨을 직접 구성한다. 생성기 선만으로 표현되는 부분은 먼저 만들고 면·접선 등 미지원 부분만 보충한다. 원시 SVG도 자료와 편집성을 유지하며 가짜 지원 chartStyle을 만들지 않는다.

식/주어진 관계와 실제 교점·극값·절편·경계·면적을 대조하고, 파선·인출선·라벨·보충 개체의 매핑을 확인한다.
