# D2-08_Others — 기타 차트

D2 7종에 없는 유한 정량 차트(트리맵·모자이크·면적 비례 격자 등)

유한 정량의 트리맵·모자이크·면적 비례 격자·영역 차트 등이다. 길이/면적/위치가 어떤 값을 뜻하는지 정하고 전체·부분·분모·결측을 구별한다. 면적 비례 표현을 장식 크기로 바꾸지 않는다.

지원되는 영역은 `stacked-area|percent-area|horizontal-percent-area`, type line, 시점 2개 이상·primary만; xValues는 엄격 증가한다. percent는 결측 없는 비음수·양수 합계, 값 축 0–100. `chartOptions.interpolation:linear|step`과 가로 구성비·세로 시간의 `reverseIndependentAxis`는 해당 스타일만 쓴다. 트리맵/모자이크 등의 기본 면적 관계가 미지원이면 수치로 경계를 계산해 편집 가능한 면·라벨을 구성한다.

축 없는 정량 차트라도 제공된 개수 단위는 `chartOptions.note`에 `단위 : 명`처럼 총계·주석 옆에 한 번 표시한다. 값 축이 없다는 이유로 생략하지 않으며, 입력에 없는 단위는 추정하지 않는다.

모자이크는 live `vectora://production/graph/schema`가 `type:"bar",chartStyle:"mosaic"`를 허용할 때만 native graph로 선택한다. `mosaic.columns`와 모든 행의 raw `series.values`를 한 소스에 두고 `categories`는 생략한다. 열 순서를 바꾸면 모든 values 배열도 함께 재정렬하고, 지속할 열·행 ID를 유지한다. 집계는 native validator에 맡기며 면적은 원수치에서 계산한다. 수치 변경은 같은 graph owner의 source를 갱신하고, 스키마가 지원하지 않을 때만 기존의 수치 기반 편집 가능 면·라벨 fallback을 쓴다.

면적 비례 영역 안에 숫자 없이 항목 이름만 넣을 때, live schema가 지원하면 `mosaic.cellLabelMode:"series-name"`과 안정적인 `series[].id/label/values`를 사용한다. 이름은 자료값 변경 시 같은 셀 안에서 재배치되는 native 문자로 두고 독립 글상자를 다시 옮기는 작업을 피한다. 이 모드는 `valueLabels`보다 우선하며, 생략하면 기존 숫자 표시 정책을 유지한다. 0값 셀에는 이름을 넣지 않는다. 이름이 들어가지 않으면 원수치를 바꾸거나 글자를 축소하지 않고 도표 크기·분할 배치 또는 허용된 표시명을 조정한다.

삼각 구성비 좌표는 세 성분의 합·축 방향·척도를 확인해 점을 계산한다. 꼭짓점 성분명·변 눈금·점 기호/이름은 서로 다른 위치에 둔다. 첫 조판에서 점 이름의 실제 획과 삼각형 경계·보조선의 교차를 검사한다. 좌표는 고정하고 이름만 여유 있는 쪽으로 옮기며, 조밀한 보조선은 이름 획 주변의 작은 흰 바탕으로 가릴 수 있다. 축 경계나 데이터 점을 가려 해결하지 않는다. 지원되지 않는 삼각도는 확인된 편집 요소로 구성하며 전용 API를 추정하지 않는다.
