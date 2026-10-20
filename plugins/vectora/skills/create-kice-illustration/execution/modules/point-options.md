## 생성 옵션

- 데이터 점: `chartOptions.projectionLines:[{seriesId,indices,axes?:"x"|"y"|"both"}]`에서 `indices`는 해당 계열의 0 기반 자료점 인덱스다(values 계열은 범주 위치, points 계열은 points 위치). `specialPoints`는 line 개형의 범주 인덱스이며 독립 XY 점 목록이 아니다. 축 투영은 선택한 점 좌표에만 붙고 자료값은 이동하지 않는다.

- 직선 경계와 독립 XY 점·이름·축 투영을 함께 만들 때는 compact `chartStyle:"bar-scatter",type:"bar"`에서 각 계열의 `renderRole:"line"|"scatter"`와 `points:[{x,y,label?}]`를 우선 검토한다. 막대 계열이 없어도 사용할 수 있다. 구조상 필요한 비어 있지 않은 categories와 같은 길이의 values는 유지하며 points만 쓰는 계열의 values는 null로 두고 가짜 0 관측값을 만들지 않는다. basic-line/legacy points에 renderRole을 섞지 않는다.
- 경계 위의 A·B 같은 기준점은 별도 의미가 없으면 검정 채운 점으로 설정한다(`fill:"#000000"`). 제외점·명시된 빈 원이나 여러 자료 계열의 구분 표식을 임의로 바꾸지는 않는다.
- 선 위 이름은 실제 선 위의 점에 `label`을 붙이고 필요하면 `labelOffsetMm:{x,y}`로 배치한다. 인출선은 native 거리 조건에 따라 생성되므로 오프셋 성공만으로 존재한다고 단정하지 않는다. 직선의 중간 anchor는 공선상에 두어 개형을 꺾지 않는다. 교점 좌표는 요청한 식·자료로 계산해 넣고, 네이티브가 교점을 자동 계산한다고 가정하지 않는다. 점·이름·투영·폭 변경을 같은 source spec에서 갱신한 뒤 미지원 부분만 별도 보충한다.
- 미지정 이름은 생성기의 자동 배치를 먼저 사용한다. 명시 오프셋이 필요하면 실제 글 크기·선의 방향·투영선을 함께 대조해 정하며, 모든 이름에 임의의 고정 오프셋을 먼저 넣지 않는다. 명시 오프셋은 충돌 회피를 보장하지 않으므로 source/plan 수락과 실제 글 획의 판독성을 구분한다.

표식 크기 `markerSizeMm`는 0.5–3mm이다.
