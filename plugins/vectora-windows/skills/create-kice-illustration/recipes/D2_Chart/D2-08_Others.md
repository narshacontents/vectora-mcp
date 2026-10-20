# D2-08_Others — 기타 차트

D2 7종에 없는 유한 정량 차트(트리맵·모자이크·면적 비례 격자 등)

유한 정량의 트리맵·모자이크·면적 비례 격자·영역 차트 등이다. 길이/면적/위치가 어떤 값을 뜻하는지 정하고 전체·부분·분모·결측을 구별한다. 면적 비례 표현을 장식 크기로 바꾸지 않는다.

지원되는 영역은 `stacked-area|percent-area|horizontal-percent-area`, type line, 시점 2개 이상·primary만; xValues는 엄격 증가한다. percent는 결측 없는 비음수·양수 합계, 값 축 0–100. `chartOptions.interpolation:linear|step`과 가로 구성비·세로 시간의 `reverseIndependentAxis`는 해당 스타일만 쓴다. 트리맵/모자이크 등의 기본 면적 관계가 미지원이면 수치로 경계를 계산해 편집 가능한 면·라벨을 구성한다.

축 없는 정량 차트라도 제공된 개수 단위는 `chartOptions.note`에 `단위 : 명`처럼 총계·주석 옆에 한 번 표시한다. 값 축이 없다는 이유로 생략하지 않으며, 입력에 없는 단위는 추정하지 않는다.

모자이크는 live `vectora://production/graph/schema`가 `type:"bar",chartStyle:"mosaic"`를 허용할 때만 native graph로 선택한다. `mosaic.columns`와 모든 행의 raw `series.values`를 한 소스에 두고 `categories`는 생략한다. 열 순서를 바꾸면 모든 values 배열도 함께 재정렬하고, 지속할 열·행 ID를 유지한다. 집계는 native validator에 맡기며 면적은 원수치에서 계산한다. 수치 변경은 같은 graph owner의 source를 갱신하고, 스키마가 지원하지 않을 때만 기존의 수치 기반 편집 가능 면·라벨 fallback을 쓴다.

삼각 구성비 좌표는 세 성분의 합·축 방향·척도를 확인해 점을 계산한다. 꼭짓점 성분명·변 눈금·점 기호/이름은 서로 다른 위치에 두고, 점 좌표를 유지한 채 라벨만 이동한다. 지원되지 않는 삼각도는 확인된 편집 요소로 구성하며 전용 API를 추정하지 않는다.
