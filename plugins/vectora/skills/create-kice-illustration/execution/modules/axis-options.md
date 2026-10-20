## 수치 축 설정

- 공통 조판: `yTitleOrientation:"horizontal"|"vertical"|"rotated"`, `xTitlePosition:"end"|"center"`, `labelPolicy:"all"|"major"`, `labelRotation:-90..90`(degree), `zeroLineStyle:"solid"|"dash"|"dot"`.

`domain,ticks`는 값 축, `xDomain,xTicks`는 독립축. 막대 값 축은 0을 포함하고 수동 축은 모든 표시값을 포함한다. 기본 선 수치 X에는 `chartOptions:{xNumeric:true},xValues`를 범주 수와 같은 엄격 증가 배열로 준다.

라이브 compact 계약이 단일 눈금을 지원하면 원점만 필요한 개형은 명시한 증가 `domain:[min,max]`와 `ticks:[0]`로 만든다. 수치 X의 단일 `xTicks`도 명시한 `xDomain`이 필요하다. 하나의 눈금으로 축 범위를 추정하거나 빈 배열을 보내지 않는다. 이 경로에서는 생성된 편집 가능 0을 쓰고 별도 0 문자를 중복 보충하지 않는다. secondary/legacy의 눈금 계약은 따로 확인한다.

공통 원점의 중복 0은 지원 연결본의 `chartOptions.originLabelPolicy:"auto"`를 우선한다. 이는 수치 X의 공유 원점에서 자동 눈금만 합치며 명시한 ticks/숨김 설정은 보존한다. 제작자가 눈금을 직접 정할 때는 `ticks` 또는 `xTicks` 한쪽에서만 0을 표시하고, 사용자 명시 눈금이나 `"both"` 요청은 유지한다. 생성된 글자만 지우거나 domain·실제 원점까지 바꾸지 않는다.

- `axisBreaks:{x?:{from,to,gapMm,mode?:"axis"|"through",lowerLayout?:"proportional"|"compact"},y?:...,secondaryY?:...}`. `through`는 자료 막대를 관통하는 생략 표현, `axis`는 축의 생략 표시다. `compact`는 0부터 시작하고 생략 하단 구간에 자료·유효 눈금이 없을 때만 쓸 수 있다. KICE가 조건을 만족하는 빈 하단을 압축해도 `from`/`to`와 자료값은 변경하지 않는다. 생략 뒤 값은 실제 축 mapping으로 재검수한다. 범주 X 생략은 인접 범주 사이만. 생략으로 숨겨진 자료와 누적 결측 warnings를 확인한다.
- 기간 화살표·이름·양끝 안내선은 별도 경로를 만들기 전에 `chartOptions.annotations:[{from,to,label,position:"above"|"below",guideAnchor?:"plot"|"zero"}]`를 사용한다. 최대 20개, 범주 X는 0 기반 인덱스·수치 X는 실제 좌표다. `guideAnchor` 생략은 plot 경계이며 0선에 닿아야 할 때 지원되는 `"zero"`를 지정한다. source의 기간과 폭을 바꾸면 함께 재배치된다. 끝 라벨 충돌을 피하려고 같은 선 견본만 있는 범례로 바꾸어 계열 구분을 없애지 않는다.
- 음수 Y를 포함한 개형에서 가로축을 0에 놓으려면 지원 연결본에서 최상위 `xAxis:"zero"`를 쓴다. 생략/`"bottom"`은 plot 하단이다. 기본 Y축의 0이 보이는 범위여야 하며 축 생략으로 가려진 0은 사용할 수 없다. 축·눈금·화살촉·단위의 실제 위치를 함께 확인한다.
- 목표·기준 수평선은 지원되는 `chartOptions.horizontalReferences:[{id,value,label?,line?:"solid"|"dash"|"dot"}]`를 우선한다. 안정된 id와 실제 기준값을 유지하며 전체 가시 X 범위의 0.3pt 선·라벨이 함께 갱신된다. 자료 계열/범례로 위장하지 않는다. 최대 20개이며 Y 생략 안의 값이나 해결되지 않는 라벨 배치는 오류를 확인한다.

위 새 축·기준선 계약은 현재 라이브 graph schema에서 지원을 확인한 compact `column`, `stacked-column`, `percent-column`, `line`, `smooth-line`, `step-line`, `bar-scatter`에만 적용한다. 원점 정책에는 수치 X도 필요하다. 다른 compact 형식과 legacy에 옵션을 섞지 않는다(legacy line의 기존 xAxis는 별도 계약). 구형 연결본에 필드를 강제로 보내지 말고 실제 부족한 부분만 보충한다. 도구 버전 이름만으로 지원을 추정하지 않는다.
