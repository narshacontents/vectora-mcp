## 수치 축 설정

- 공통 조판: `yTitleOrientation:"horizontal"|"vertical"|"rotated"`, `xTitlePosition:"end"|"center"`, `labelPolicy:"all"|"major"`, `labelRotation:-90..90`(degree), `zeroLineStyle:"solid"|"dash"|"dot"`.

`domain,ticks`는 값 축, `xDomain,xTicks`는 독립축. 막대 값 축은 0을 포함하고 수동 축은 모든 표시값을 포함한다. 기본 선 수치 X에는 `chartOptions:{xNumeric:true},xValues`를 범주 수와 같은 엄격 증가 배열로 준다.

- `axisBreaks:{x?:{from,to,gapMm,mode?:"axis"|"through",lowerLayout?:"proportional"|"compact"},y?:...,secondaryY?:...}`. `through`는 자료 막대를 관통하는 생략 표현, `axis`는 축의 생략 표시다. `compact`는 0부터 시작하고 생략 하단 구간에 자료·유효 눈금이 없을 때만 쓸 수 있다. KICE가 조건을 만족하는 빈 하단을 압축해도 `from`/`to`와 자료값은 변경하지 않는다. 생략 뒤 값은 실제 축 mapping으로 재검수한다. 범주 X 생략은 인접 범주 사이만. 생략으로 숨겨진 자료와 누적 결측 warnings를 확인한다. `chartOptions.annotations:[{from,to,label,position:above|below}]` 최대 20개, 범주는 0 기반 인덱스·수치 X는 실제 좌표; 기본 가로 막대에는 적용하지 않는다.
