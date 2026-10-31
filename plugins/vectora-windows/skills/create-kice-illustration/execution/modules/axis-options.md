## 수치 축 설정

현재 graph schema가 제공하는 compact Cartesian에서는 `chartOptions.axisText.{x,y,secondaryY}`로 제목·단위를 함께 조판한다. 각 축의 `pairing`은 `same-line`(제목·단위 사이 공백 없이 한 줄), `next-line`(단위를 다음 줄), `separate`(서로 다른 위치), `showTitle/showUnit`은 표시 여부다. X `placement`는 `end`(끝 아래)·`center`(가운데 아래)·`tip`(축 끝 옆), Y·secondaryY는 `outside`(바깥 위)·`vertical`(실제 세로쓰기)·`tip`(바깥쪽 축 끝 옆)이다. 개념 좌표도·눈금 없는 선그래프처럼 "Y축 끝 왼쪽 제목"이면 `tip`을 쓴다. 제목과 단위를 함께 쓴 `tip`은 실제 JPEG에서 글자 윗선이 화살촉 끝과 같은 높이인지 확인한다. 넘거나 아래로 떨어지면 블록 위치를 맞춘다. **제목과 단위를 함께 쓰는 축은 글자가 화살촉 끝 안쪽에 있어야 한다.** Y는 축 왼쪽에서 글자 윗선을 화살촉 끝에 맞추고, X는 축 바로 아래에서 오른쪽 끝을 화살촉 끝에 맞춘다(필요하면 축 끝 연장). X `tip`처럼 화살촉 밖으로 나가는 배치는 단위만 있는 축에만 쓴다. 두 축의 제목·단위 표시 여부가 같으면 배치도 같게 한다. 둘 다 화살촉 끝에 붙이거나(Y `tip`+X `end`), 둘 다 단위는 축 끝 옆·제목은 축 가운데(Y `vertical`+X `center`)로 둔다. 지원 앱은 미지정 시 화살촉 끝 방식을 기본으로 하고 섞인 명시값을 그 방식으로 맞춘다. `outside`는 제목 블록이 축 끝보다 위에 떠서 축과 분리돼 보이므로, 맨 위 숫자 눈금이 축 끝에 붙어 `tip`과 겹칠 때만 고른다. Y 단위만 있을 때는 숫자 눈금열의 기존 위치를 유지하고 가로쓰기 단위의 실제 글 획 중심을 그 선행 부호를 제외한 숫자 본체 잉크열 중심에 맞춘다. 단위를 축 바깥에 제한하기 위해 눈금열을 옮기지 않는다. 문구는 기존 `xTitle/yTitle/xUnit/yUnit/unit`, 보조축은 `secondaryTitle/secondaryUnit`에 보존한다. 표시 생략은 의미가 다른 곳에 충분히 있을 때만 선택하며, 겹침을 피하려고 필수 단위를 숨기지 않는다.

**`pairing`은 `same-line`이 기본이다.** `가격(달러)`, `수량(개)`처럼 제목+단위가 약 7자 이하이면 폭이 좁아도 한 줄로 두고, `next-line`은 제목이 길어 그림 폭을 넘거나 자료 영역을 크게 줄일 때만 쓴다. X·Y는 같은 방식으로 맞춘다.

`chartOptions.axisTextLayout:"end-reserved"`는 전체 폭과 수치 범위를 유지하면서 플롯을 줄여 축 끝 제목 공간을 확보한다. X제목·단위는 마지막 눈금 오른쪽 **연장부 아래**, Y제목·단위는 위 연장부 바깥에 둔다. `axisText`의 결합/표시 설정은 유지하며 개별 placement보다 이 배치가 우선한다. `"standard"`로 돌아가면 저장한 개별 placement를 사용한다. 세로형 Cartesian에서만 사용하며 가로막대·상자 프레임·숨긴 X/Y축과는 함께 쓰지 않는다.

원본과 같은 물리 크기로 재현할 때는 `chartOptions.plotWidthMm`으로 **내부 자료 영역 너비**를 명시할 수 있다(4–200mm, 생략은 자동). `plotHeightMm`과 함께 사용하며 `widthMm`은 글자를 포함할 공간의 예산이다. 실제 저장 폭은 내용에 맞게 달라질 수 있으므로 별도로 검수한다. 글자·전체 그림을 늘려 맞추지 않는다. 일반 의뢰에는 원본 계측값이 없는 이 필드를 임의로 채울 필요가 없다.

지원 앱에서 `end-reserved`의 X 눈금·범주명과 축 사이 간격은 `chartOptions.xLabelGapMm`로 실측 글 획의 윗변 기준으로 조정한다(0–20mm, 회전하지 않은 세로형 Cartesian). 지원 앱의 새 KICE 제작은 약 1.1mm의 자동 간격에서 시작한다. 저장된 그림의 생략값은 기존 배치를 보존하므로 신규 생성과 구별하고, 수정 요청에서는 실제 간격을 확인한다. `xTitleGapMm`는 제목의 별도 간격이다. 두 간격을 함께 보고, 원점 0을 없애거나 눈금 문자를 개별 이동해 우회하지 않는다.

`chartOptions.axisTipExtensionMm:{x?,y?,secondaryY?}`는 자료 범위를 바꾸지 않고 축 끝에 여유를 둔다(각 0–20mm). 상황별 배치 선택은 [그래프 원칙](../../components/graph-style.md)을 따른다. `axisLabelLayout`의 실제 표시 영역과 JPEG에서 제목·단위·최상단/끝 눈금의 간격을 함께 검수한다. 지원하지 않는 chartStyle에는 새 필드를 보내지 않는다. 가로 막대(`bar/stacked-bar/percent-bar`)는 기존 `yUnit/unit`이 실제 가로 값 축에 대응하므로 `axisText` 묶음은 사용하지 않고 기존 제목·단위 필드를 유지한다. 범례 배열과 물리 축 끝 연장은 지원 여부를 따로 확인한다.

라이브 계약이 지원하는 Cartesian의 오른쪽 범례는 `legend:"right"`와 `chartOptions.rightLegend:{align:"top"|"middle"|"bottom",gapMm?:0..20}`으로 상자·견본·문자를 함께 배치한다. 정렬 기준은 자료 영역(plot)의 높이이며, `gapMm` 생략은 1mm다. `legendAnchor`와 함께 쓰지 않는다. 보조축 눈금·단위·세로 제목의 실제 표시 영역을 피하고, 제목과 범례의 세로 구간이 겹치지 않으면 같은 오른쪽 열을 공유한다. 범례 자식을 따로 이동하기 전에 이 설정을 사용한다. 옵션 전체 생략은 기존 배치를 유지한다. `widthMm` 예산과 실제 내용 폭을 구분하고, 저장·재열기·값 변경 후에도 범례 전체 정렬과 축 글자 여유가 유지되는지 inspect와 실제 JPEG로 확인한다.

- 공통 조판: `yTitleOrientation:"horizontal"|"vertical"`, `xTitlePosition:"end"|"center"`, `labelPolicy:"all"|"major"`, `labelRotation:-90..90`(degree), `zeroLineStyle:"solid"|"dash"|"dot"`.

세로 Y축 제목은 `vertical`로 만든 뒤 실제 세로 텍스트박스인지 inspect로 확인한다. 원문 문자열의 강제 개행이나 회전으로 대신하지 않는다. 구형 생성기가 낱글자/개행 개체를 반환하면 이를 숨기고 지원되는 `verticalText` 한 개로 보충한다.

월별 자료 등 좁은 범주축은 모든 관측값·원래 범주를 유지하면서 **표시할 눈금 문자만** 줄일 수 있다. live schema가 허용하는 기본 Cartesian 또는 범주형 `bar-scatter`에서 `chartOptions.labelIndices:[0,3,6,9]`처럼 0부터 시작하는 표시 인덱스를 선택한다. 숫자 X축/명시 `xValues`나 다른 확장형에는 지원을 추정하지 않는다. 규칙적인 시계열의 모든 월 숫자를 억지로 회전하기 전에 수평의 주요 월 표시를 검토하되, 순서를 추론할 수 없는 명목 범주는 필요한 이름을 생략하지 않는다. `labelPolicy:"major"`는 실측 자동 선택, 명시 `labelIndices`는 정확한 선택이며 `all`을 강제한 채 겹침을 방치하지 않는다. 실제 출력과 수치 수정·재열기에서 자료 위치와 표시 월이 일치하는지 확인한다.

현재 graph schema가 지원하면 큰 수량 눈금은 `chartOptions.xLabelGrouping:true` / `yLabelGrouping:true`로 천 단위 구분을 설정한다. X 수치 독립축은 x, 값 축은 y이며 가로막대도 값 축에는 y 설정을 쓴다. 표시 문자열을 실측한 뒤 정렬하므로 생성된 눈금 문자를 따로 바꾸지 않는다. 원자료·축 범위·눈금값은 숫자로 유지하고, 연도·식별 번호에는 자동으로 쉼표를 넣지 않는다. 생략/false는 기존 표시를 보존한다.

`domain,ticks`는 값 축, `xDomain,xTicks`는 독립축. 막대 값 축은 0을 포함하고 수동 축은 모든 표시값을 포함한다. 기본 선 수치 X에는 `chartOptions:{xNumeric:true},xValues`를 범주 수와 같은 엄격 증가 배열로 준다.

라이브 compact 계약이 단일 눈금을 지원하면 원점만 필요한 수치 개형은 증가 `domain`/`xDomain`을 주고 `ticks:[0]`, `xTicks:[0]`으로 범위를 따로 확정한다. **공유 원점의 0은 한 축에서만 표시**한다. 다른 X 눈금이 없는 이 경우 `chartOptions:{showCategoryLabels:false,showXTicks:false}`로 X쪽 숫자·눈금만 숨기고 Y쪽 0을 쓴다. 반대 배치가 필요하면 Y쪽 표시 설정을 사용한다. 서로 다른 단위의 좌우 Y축은 각각의 0을 남길 수 있다. 지원되는 보조축은 명시 `chartOptions.secondaryDomain`과 `secondaryTicks:[0]`으로 만들며, 불필요한 두 번째 눈금을 생성한 뒤 숨기지 않는다. 하나의 눈금으로 축 범위를 추정하거나 빈 배열·별도 0 문자로 대신하지 않는다. legacy의 계약은 따로 확인한다.

경제 좌표도처럼 축에 몇 개의 지정 눈금만 두고 원점 `0`이 필요하면 지원 앱의 `chartOptions:{xNumeric:true,originLabel:true}`를 쓴다. 앱이 X 눈금 기준선·Y 눈금 오른쪽 열에 `0` 하나를 놓으므로 별도 문자로 만들지 않는다. 연도 X축의 마지막 두 눈금이 가까우면 앱이 마지막 라벨만 같은 줄에서 오른쪽으로 밀어 준다. 아래 줄로 따로 빼지 않는다.

`chartOptions.originLabelPolicy:"auto"`는 수치 X의 공유 원점에서 **자동 생성 눈금만** 합친다. 명시한 `ticks`/`xTicks`의 0까지 제거해 주는 옵션이 아니다. 다른 눈금도 필요한 경우 한쪽 명시 목록에서만 0을 빼고 나머지 눈금은 유지한다. 사용자가 두 0을 명시하거나 `"both"`를 요청한 경우는 따른다. 생성된 글자만 지우거나 domain·실제 원점까지 바꾸지 않는다.

- `axisBreaks:{x?:{from,to,gapMm,mode?:"axis"|"through",lowerLayout?:"proportional"|"compact"},y?:...,secondaryY?:...}`. `through`는 자료 막대를 관통하는 생략 표현, `axis`는 축의 생략 표시다. `compact`는 0부터 시작하고 생략 하단 구간에 자료·유효 눈금이 없을 때만 쓸 수 있다. KICE가 조건을 만족하는 빈 하단을 압축해도 `from`/`to`와 자료값은 변경하지 않는다. 생략 뒤 값은 실제 축 mapping으로 재검수한다. 범주 X 생략은 인접 범주 사이만. 생략으로 숨겨진 자료와 누적 결측 warnings를 확인한다.
- 기간 화살표·이름·양끝 안내선은 별도 경로를 만들기 전에 `chartOptions.annotations:[{from,to,label,position:"above"|"below",guideAnchor?:"plot"|"zero",arrow?:"none"|"start"|"end"|"both",gapMm?:number}]`를 사용한다. 최대 20개, 범주 X는 0 기반 인덱스·수치 X는 실제 좌표다. 지원되는 `arrow`는 시작점·끝점의 화살촉을 정하며 생략은 양끝이다. 진행 방향이 필요한 기간은 `end`, 단순 범위는 요청 의미에 맞게 선택하고 화살촉만 별도로 지우지 않는다. `guideAnchor` 생략은 plot 경계이며 0선에 닿아야 할 때 지원되는 `"zero"`를 지정한다. 지원되는 `gapMm`(0.5–30mm)은 자료 영역 위/아래 경계부터 기간선까지의 거리이며 기존 행 간격은 더해진다. 불필요하게 긴 빈 간격은 이 값으로 줄이되 표시된 눈금·범주명과 겹치지 않는지 확인한다. 선·화살촉·이름·양끝 안내선을 따로 옮기지 않는다. source의 기간과 폭을 바꾸면 함께 재배치된다. 끝 라벨 충돌을 피하려고 같은 선 견본만 있는 범례로 바꾸어 계열 구분을 없애지 않는다.
- 음수 Y를 포함한 개형에서 가로축을 0에 놓으려면 지원 연결본에서 최상위 `xAxis:"zero"`를 쓴다. 생략/`"bottom"`은 plot 하단이다. 기본 Y축의 0이 보이는 범위여야 하며 축 생략으로 가려진 0은 사용할 수 없다. 축·눈금·화살촉·단위의 실제 위치를 함께 확인한다.
- 목표·기준 수평선은 지원되는 `chartOptions.horizontalReferences:[{id,value,label?,line?:"solid"|"dash"|"dot"}]`를 우선한다. 안정된 id와 실제 기준값을 유지하며 전체 가시 X 범위의 0.3pt 선·라벨이 함께 갱신된다. 자료 계열/범례로 위장하지 않는다. 최대 20개이며 Y 생략 안의 값이나 해결되지 않는 라벨 배치는 오류를 확인한다.

위 새 축·기준선 계약은 현재 라이브 graph schema에서 지원을 확인한 compact `column`, `stacked-column`, `percent-column`, `line`, `smooth-line`, `step-line`, `bar-scatter`에만 적용한다. 원점 정책에는 수치 X도 필요하다. 다른 compact 형식과 legacy에 옵션을 섞지 않는다(legacy line의 기존 xAxis는 별도 계약). 구형 연결본에 필드를 강제로 보내지 말고 실제 부족한 부분만 보충한다. 도구 버전 이름만으로 지원을 추정하지 않는다.

축선 선택은 `chartOptions.frame:"none"|"box"`와 `axisArrows`로 분리한다. 상자 프레임은 `frame:"box",axisArrows:false`, 일반 축선은 `frame:"none",axisArrows:false`, 화살표 축은 `frame:"none",axisArrows:true`다. 지원 연결본에서는 `axisTicks.{x,y,secondaryY}`의 `direction:"in"|"out"|"cross"`, `lengthMm`으로 눈금 방향·길이를 선택한다. `showXTicks/showYTicks:false`가 표시 여부를 정하고 수치 라벨은 그대로 남길 수 있다. 라이브 계약이 없는 구형 연결본에는 새 필드를 보내지 않는다.
