# 노드·연결 실행 계약


`spec:{kind:"schematic",layout,widthMm,gapMm?,nodes,edges}`. 확인된 layout은 `sequential,shared,crossing,shared-results,relations`이며 분류 ID 자체를 layout으로 넣지 않는다. nodes는 `{id,text,shape:"rect"|"circle"|"ellipse"|"diamond"|"document",widthMm?,level?,xMm?,yMm?}`; edges는 `{id,from,to,direction:"none"|"forward"|"both",routing:"straight"|"orthogonal",label?,dashed?,fromAnchor?,toAnchor?,viaPolicy?,via?:[{xMm,yMm}]}`다. 선택한 layout/row 버전의 지원 범위를 확인하고 안정적 ID로 대응을 유지한다.

개별 연결선에 경유점 `via`를 주면서 직각을 원하면, 라이브 계약이 지원하는 `routing:"orthogonal",viaPolicy:"orthogonal-v1"`을 함께 명시한다. 정책 생략은 이전 문서의 꺾은선 연결을 보존하므로 `routing`만으로 직각이 보장되지 않는다. 이 정책은 노드의 이동·크기 변경에 맞춰 끝 꺾임을 갱신하지만 장애물을 자동으로 피하지는 않는다. 경유점은 생성기 내부 좌표이며 공유 줄기·자동 반환선·관리 행 통로에는 이 옵션을 섞지 않는다.

본문에 따라 높이가 달라져야 하는 노드는 라이브 계약의 자동 측정을 우선하고, 별도 고정높이 조건이 없으면 `heightMm`을 생략한다. 첫 실측 높이를 명시 높이로 다시 넣어 후속 편집을 고정하지 않는다. 좌표 노드의 자동 높이 재조판이 지원되면 본문 수정 후 실제 글·저장된 제작 원문·외곽·연결점이 함께 갱신되는지 확인한다. 이 경로는 상단 위치와 폭을 유지하므로, 커진 노드와 이웃의 겹침이나 중심선 정렬은 제작자가 확인하고 필요한 좌표만 다시 정한다. 부분 서식·문단 박스·보조 열을 현재 node 계약이 소유하지 못해 보충했다면, 자동 측정되는 기본 노드와 수동으로 따라가야 하는 요소를 구별해 기록하고 본문 증감 후 함께 확인한다.

요청에서 반드시 지켜야 할 배치·관계와 제작자가 임의로 택한 좌표·junction/anchor/via 핀을 구분하고, 제작자가 고른 핀만으로 `rowLayout` 불가를 판단하지 않는다. 사용자가 명시한 배치는 보존한다. 독립 schematic에서 모든 노드가 직사각형이고 요청 관계가 아래향 무라벨 연결이며 live schema/plan이 `rowLayout` v1을 지원하면, 좌표를 설계하기 전에 `layout:"relations", rowLayout:{version:1,horizontalGapMm:1,verticalGapMm:3,xPolicy:"auto",rows:[{id:"r1",nodeIds:["a"]},{id:"r2",nodeIds:["b","c"]}]}`처럼 필요한 간격을 명시한 간단한 row plan을 먼저 시도한다. 행은 위계 단계와 일대일일 필요가 없어 추가 행을 둘 수 있고, 연결은 행을 건너뛸 수 있으며, 단독 행은 `alignToNodeId`로 다른 행의 노드에 정렬할 수 있다. `rows[].nodeIds`로 행과 행 안의 원소 순서를 정하고, `edges`에는 실제 관계만 따로 적는다. plan의 자연폭(`minSingleLineWidthMm`)·최종 폭·`lines`를 확인하고, 불확실한 줄은 실제 안쪽 폭과 UND 8pt 및 선택한 문자 역할의 자간으로 `vectora_measure_text`해 검토한다. 좁은 폭에서는 기존 노드 사이 간격을 보존한 자연 줄바꿈을 먼저 사용한다. 긴 이름을 한 줄로 유지하려고 모든 행의 간격을 함께 줄여 상자들이 거의 붙게 만들지 않는다. 구조 하한 `minimumWidthMm`는 자연어 실측 하한이 아니며, 자연 줄바꿈 후보가 `widthMm`에 들지 않으면 계획이 실패하므로 폭을 넓히거나 행을 나눈다. `widthMm`는 입력 외피이므로 plan의 실제 잉크 폭과 대조해 필요하면 `fitContentWidth` 대신 spec/대화상자의 `widthMm`를 갱신하고 다시 계획한다. 행 높이는 측정된 내용과 필요한 화살표 여유로 정하며 스타일 지침의 도식 전체 높이에 맞춰 짧은 행을 늘리지 않는다.

v1의 자동 X 모드에서는 `nodes[].xMm/yMm/level`, `via`, junction·anchor 핀을 섞지 않는다. 루트 `xMm/yMm` 이동은 지원된다. 선택한 행 버전에서 지원하지 않는 원·관계 방향·중첩 제작 등의 조건, 사용자가 명시한 좌표 또는 요청에 필수인 교차·특수 경로가 있거나, 간단한 row plan에서 실제 거부 사유가 확인되면 해당 조건을 지원하는 기존 coordinate layout으로 전환한다. 그때는 plan의 실제 안쪽 폭·줄 수·필요 높이와 `vectora_measure_text`의 `lines`를 써서 폭·상자 높이·다음 좌표를 조정한다. 짧은 낱말, 특히 괄호 설명을 단어 중간에서 나누지 않도록 폭과 배치를 고친다. 측정은 생성될 글상자의 `autoFit`·`textAlign`과 일치시킨다. 현행 노드는 가운데 어절 조판을 사용하므로 `textAlign:"center",autoFit:true`로 측정하고, 이전 연결본은 실제 plan과 비교한다. 조판을 흉내 내는 강제 엔터로 원문을 고정하지 않는다. 수정 뒤 저장된 실제 JPEG에서 직각 연결과 노드 경계 앵커를 확인하고, 높이·통로도 다시 살핀다. 계획 성공만으로 겹침 없는 최종 그림이라 판단하지 않는다.

**라벨이 있는 혼합 모양의 아래향 판정도**는 live 계약이 v2를 지원하면 `rowLayout:{version:2,xPolicy:"preserve",horizontalGapMm:2,verticalGapMm:5,rows:[…]}`를 검토한다. 숫자는 고정 규칙이 아니라 요청 배치의 최소 간격이다. 제작자가 각 노드의 `xMm`·`widthMm`와 행 순서를 정하고, 앱이 실제 직사각형·마름모·문서 노드 높이 및 응답·화살촉의 통로로 다음 행의 Y를 계산한다. 각 노드는 한 행에만 두며 `yMm`·level·via/junction 등 충돌 핀은 섞지 않는다. 인접 다음 행으로 `bottom→top` 또는 바깥쪽 `left/right→top` 직각 연결만 지원하며, 같은 출구의 여러 선·한 결과로 합류·교차·건너뛴 행은 이 경로에 강제하지 않는다. v2는 X·폭·글꼴을 자동 협상하지 않는다. 실제 plan이 거부하면 관계를 지우지 말고 지원되는 좌표 모드로 조판한다. 독립 제목·범례는 계속 제작자가 배치하며, 본문 수정 뒤 행 이동과 범례 간격을 함께 확인한다.

v1 행 모드에 제목·위아래 설명이 필요하고 live 계약이 지원하면 `rowLayout.title:{text}`와 `rowLayout.caption:{text,position:"above"|"below",arrowDirection:"none"|"up"|"down"}`를 우선 사용한다. 같은 도식 안에서 실측 높이와 간격을 함께 갱신하므로 글·노드를 바꿀 때 별도 좌표 보정을 반복하지 않는다. 설명 화살표는 요청한 의미가 있을 때만 넣고, 불필요한 고정 높이를 주지 않는다. 제목·설명이 필요하지 않은 도식에는 추가하지 않는다.

`shared`의 열 배정은 연결 관계에서 계산되므로 `xMm/yMm/level`로 열폭 제한을 우회하지 않는다. 행 모드의 제목·설명 계약이 적용되지 않는 도식에서는 별도 글 컴포넌트로 둔다. 직접 좌표를 설계할 때는 `relations`를 선택하되 열폭·간격도 실제로 들어가야 한다. `shared` 열폭 충돌에는 노드 폭·간격·배치를 조정하며, 글자 축소나 관계 삭제로 해결하지 않는다.

노드의 내부 좌표와 생성된 컴포넌트의 문서 좌표를 구별한다. 제목·아래 설명과 결합할 때는 생성 직후 실제 루트 외곽을 inspect해 배치한다. 지원 좌표 필드를 바꿨는데 source만 달라지고 실좌표가 남으면 같은 update를 반복하지 말고 기존 루트를 문서 좌표로 이동한 뒤 선·글을 함께 확인하고 앱 결함으로 기록한다. 이미 배치한 루트의 보존 수정 뒤에도 이 검사를 적용한다.

좌표 모드에서는 공유 줄기의 edges에 같은 `sharedStemId`와 필요하면 같은 `junctionMm:{xMm,yMm}`를 준다. 선언 없는 교차는 분리된다. 명시 좌표·via로 교차·줄기를 보존하되 컴포넌트 이동 후에는 도구 계약의 좌표계와 실제 노드 앵커를 대조해 수직 구간이 사선으로 바뀌지 않게 한다. 순환을 sequential 제약에 강제로 넣지 않고 명시 좌표 또는 relations를 쓴다. 일반 테두리·연결선은 0.3pt; 비그래프 파선 주기는 내용·크기에 맞춰 결정한다. 벤 계약은 해당 하위유형 안에 있다. 노드 계약으로 표현되지 않는 공간 구조는 지원 요소를 먼저 생성하고 부족한 면·경계·기호만 편집 가능한 개체로 보충한다.

좌표 모식도의 `diamond`·`document` 지원 여부는 live schema에서 확인한다. 지원되면 `nodes[].shape`로 지정하고 plan의 실제 문자 여백·필요 높이를 배치에 반영한다. 마름모의 비스듬한 변과 문서의 물결 영역까지 텍스트 영역으로 계산하지 않는다. 글을 바꾼 뒤에는 외곽과 연결 지점이 함께 재계산되는 native 노드를 유지한다. 선택한 row 버전의 모양·연결 지원 범위를 확인하며 v1과 v2를 혼동하지 않는다.
