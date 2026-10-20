# D2-01_Bar — 막대

범주별 독립 막대. 가로·세로·그룹

독립 막대는 영점부터 값에 비례하며 0에 최소 막대를 만들지 않는다. 최대 끝과 바깥 값 라벨을 포함해 값 축 공간을 확보한다. 같은 역할 막대 두께는 일정; 묶음 사이 틈은 내부 틈보다 크고 가로 묶음 사이에는 막대 두께 이상 여유를 둔다. 떨어진 세로 막대의 틈은 폭의 약 0.5–0.7배부터 검토한다. 가로 항목명은 묶음 세로 중심, 값 축은 아래; 세로 비교 패널은 바닥선·아래 제목을 맞춘다.

우선 `chartStyle:"column"|"bar",type:"bar"`. `categoryStyles:[{fill?,pattern?}]`는 항목별 재정의다. 대칭 막대는 중앙 항목 열 하나와 좌우 같은 척도를 쓴다. 실제 graph schema가 `mirrorOptions:{version:1}`을 지원하면 `type:"bar",layout:"mirror"`와 함께 사용한다. series는 위→아래 항목, panels는 왼쪽·오른쪽 2개이며 양수 원자료를 유지한다. 공통 `domain:[0,max]`·양쪽 양수 `ticks`, 실제 단위 `unit`, 필요한 `valueLabels`를 지정하고 지원되는 plan으로 글꼴·폭을 확인한다. 숫자·눈금은 같은 컴포넌트의 자료 갱신에 연결하며 독립 문자로 중복하지 않는다. 서로 비교할 패널은 명시한 범위와 폭을 맞춘다.

위 옵션이 없는 연결본의 legacy mirror는 정확히 2패널·양수·legend none, values는 series 순서다. `chartStyle`과 혼합하지 않는다. legacy horizontal은 categories/series.values/domain:[0,max]/ticks/valueLabels; panels는 1–4개·공통척도이고 숫자 눈금은 후속 추가한다. 기존 저장 형식은 요청 없이 새 모드로 전환하지 않고, 음수·절단을 양수 전용 mirror/legacy로 바꾸지 않는다. 미지원 부분을 보충했다면 자료 수정 뒤 보충 라벨의 값·위치도 확인한다.
