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

현재 production schema에는 서로 다른 compact/legacy 분기가 있다. `chartStyle`을 넣은 compact 입력은 `kind:"graph"`, 필수 `type`, `dataFidelity:"exact"|"approximate"|"concept"`, `categories` 1–200개, `series` 1–8개를 사용한다. `column|bar|stacked-column|stacked-bar|percent-column|percent-bar|bar-scatter`는 `type:"bar"`, 나머지 9개 chartStyle은 `type:"line"`이다. 일반 계열은 `{label,values}`이며 값 배열은 범주 수와 맞고 유한 수 또는 `null`이다. 폭은 18–108mm, plot 높이는 15–200mm, `strokePt`는 0.1–4pt다. 실제 호출 예시는 현재 제공되는 graph schema의 examples를 확인한다.

`chartStyle`을 생략한 legacy 입력은 폭 40–108mm와 `dataFidelity:"exact"|"approximate"|"relative"`를 사용한다. `type:"line"`은 `x` 라벨과 계열별 `values`, `type:"points"`는 `xDomain`·`yDomain`과 계열별 `{x,y}` points, `type:"pie"`는 `panels`를 요구한다. `type:"bar"`는 `layout:"horizontal"`의 categories/values 또는 `layout:"panels"|"mirror"`의 panels를 사용한다. 두 분기의 전용 필드를 섞지 않는다. 스키마는 구조를 검사하며 값 길이·도메인·스타일별 제약과 물리적 배치는 앱 검증이 추가로 판정한다.

- 수치 함수는 충분한 실제 계산 샘플로 compact `chartStyle:"line"|"smooth-line"|"step-line"`, `type:"line"`, `dataFidelity:"exact"|"approximate"`, `categories`, `{id,label,values}` 계열을 쓸 수 있다. `xValues`는 categories와 같은 길이의 엄격 증가 수치 X좌표이며 `chartOptions:{xNumeric:true}`로 숫자축을 요청한다. 구조 스키마보다 세부 값/축 관계 검사가 추가되므로 실제 매핑을 대조한다. smooth-line 보간이 식의 교점·곡률을 바꾸면 그대로 쓰지 말고 해당 경로를 보정한다. 기본 파선·표식·범례는 실제 속성으로 검수한다.
- Compact chartOptions에는 막대/계열 간격 0–20mm, barGapRatio 0–3, markerSizeMm 0.5–3, labelRotation −90–90, labelPolicy all|major, labelDecimals 0–10, grid/zero-line solid|dash|dot 및 보조축 필드가 있다. 레이더·dumbbell·bubble·축 생략·projection 옵션은 현재 graph schema와 앱 검증에 맞춘다. 개념선은 `dataFidelity:"concept"`와 `chartOptions:{mode:"concept",semanticLabels:"end"|"legend"|"none",specialPoints:[...]}`를 사용한다. 이때 `series.values`는 형상용 내부 좌표이며 관측값·숫자 눈금이 아니다. 특수점은 0부터 시작하는 범주 인덱스다. legacy 선도 독립 분기이며 `relative` 내부 좌표를 숫자 눈금이나 값 라벨로 표시하지 않는다. legacy `labelOffsets` 단위는 문서 px다.
- 앱은 실제 축/자료 획에 대한 글자 잉크 충돌을 측정하고 문자만 이동한다. 공간이 부족하면 미해결 진단을 반환한다. 저장 성공은 기술 결과이며 시각 검수 통과를 뜻하지 않는다. 갱신된 전달 검수 결과와 실제 JPEG를 전체 해상도 및 의도한 인쇄 크기에서 확인하여 값·관계·라벨과 겹침을 검수한다. `layoutDiagnostics`는 다시 계산될 수 있고 전달 검수는 편집 후 최종 기하를 검사한다.
- 엔진이 함수의 기본 의미·비선형 축·곡면·면적 경계를 표현할 수 없으면 실제 식/개형에 맞는 편집 가능 path·면·라벨을 직접 구성한다. 생성기 선만으로 표현되는 부분은 먼저 만들고 면·접선 등 미지원 부분만 보충한다. 원시 SVG도 자료와 편집성을 유지하며 가짜 지원 chartStyle을 만들지 않는다.

식/주어진 관계와 실제 교점·극값·절편·경계·면적을 대조하고, 파선·인출선·라벨·보충 개체의 매핑을 확인한다.
