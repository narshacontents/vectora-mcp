# 대칭 막대가 요청된 경우의 실행

우선 `chartStyle:"column"|"bar",type:"bar"`. `categoryStyles:[{fill?,pattern?}]`는 항목별 재정의다. 대칭 막대는 중앙 항목 열 하나와 좌우 같은 척도를 쓴다. 실제 graph schema가 `mirrorOptions:{version:1}`을 지원하면 `type:"bar",layout:"mirror"`와 함께 사용한다. series는 위→아래 항목, panels는 왼쪽·오른쪽 2개이며 양수 원자료를 유지한다. 공통 `domain:[0,max]`·양쪽 양수 `ticks`, 실제 단위 `unit`, 필요한 `valueLabels`를 지정하고 지원되는 plan으로 글꼴·폭을 확인한다. 숫자·눈금은 같은 컴포넌트의 자료 갱신에 연결하며 독립 문자로 중복하지 않는다. 서로 비교할 패널은 명시한 범위와 폭을 맞춘다. 좌우 집단을 설명하는 공통 범례는 조밀한 한 묶음으로 두고 그림 전체에 걸쳐 흩어 놓지 않는다. 그 범례로 모든 패널의 대응을 읽을 수 있고 중복 집단명이 불필요하면, 라이브 스키마가 지원하는 `mirrorOptions.showPanelLabels:false`로 개별 집단명과 그 전용 높이 예약을 함께 생략할 수 있다. 원자료의 집단명은 유지하며, 범례가 없거나 개별 명칭이 필요한 구성에는 기본 표시를 유지한다.

`mirrorOptions`가 없는 연결본이거나 저장된 legacy 형식을 편집할 때만 `execution/modules/bar-legacy.md`를 읽는다. 새 생성은 지원되는 현행 입력을 우선하며 과거 형식을 동시에 적용하지 않는다.
