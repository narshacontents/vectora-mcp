## 생성 옵션

- 연속 개념 개형: line 계열은 `chartOptions:{mode:"concept",semanticLabels:"end"|"legend"|"none",specialPoints:[...]}`를 지원한다. spec의 `series.values`는 경로 모양을 놓기 위한 내부 좌표로만 입력하며 관측값으로 설명하거나 숫자 축·눈금으로 표시하지 않는다. `domain`, `ticks`, `xDomain`, `xTicks`는 실제 정량 축이 필요할 때만 준다. 곡선 이름을 유지할 때 `semanticLabels:"none"`으로 지우지 말고 end label 또는 legend를 고른다.
