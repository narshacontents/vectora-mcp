# 연속 그래프 도구 API 계약

## 생성 옵션

- 연속 개념 개형: line 계열은 `chartOptions:{mode:"concept",semanticLabels:"end"|"legend"|"none",specialPoints:[...]}`를 지원한다. spec의 `series.values`는 경로 모양을 놓기 위한 내부 좌표로만 입력하며 관측값으로 설명하거나 숫자 축·눈금으로 표시하지 않는다. `domain`, `ticks`, `xDomain`, `xTicks`는 실제 정량 축이 필요할 때만 준다. 곡선 이름을 유지할 때 `semanticLabels:"none"`으로 지우지 말고 end label 또는 legend를 고른다.

## 사용할 수 있는 생성 경로

legacy 연속 선은 폭 40–108mm, `dataFidelity:"exact"|"approximate"|"relative"`, `type:"line"`, `x` 라벨과 계열 `values`를 사용한다. compact의 전용 필드와 섞지 않는다. legacy `labelOffsets`는 문서 px다.

- 수치 함수는 충분한 실제 계산 샘플로 compact `chartStyle:"line"|"smooth-line"|"step-line"`, `type:"line"`, `dataFidelity:"exact"|"approximate"`, `categories`, `{id,label,values}` 계열을 쓸 수 있다. `xValues`는 categories와 같은 길이의 엄격 증가 수치 X좌표이며 `chartOptions:{xNumeric:true}`로 숫자축을 요청한다. 구조 스키마보다 세부 값/축 관계 검사가 추가되므로 실제 매핑을 대조한다. smooth-line 보간이 식의 교점·곡률을 바꾸면 그대로 쓰지 말고 해당 경로를 보정한다. 기본 파선·표식·범례는 실제 속성으로 검수한다.
