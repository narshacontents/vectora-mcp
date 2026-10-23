# 모호한 요청의 제작 경로 판별

분류가 애매하거나 여러 방식이 섞일 때 해당 항목만 검색한다. 원칙 본문은 작업 지침 준비 도구가 선택한다. 이 문서는 매 작업의 필수 정독 대상이 아니다.

- **배치/제작 방식부터 선택한다.** 일반 이름의 대화는 vertical-dialogue / horizontal-dialogue / presentation, 매체는 newspaper / webpage / paper / scroll / board / worksheet, 교사와 칠판은 teacher-board다. 단순 막대·선·원·산점은 bar / line / pie / scatter, 목록표(행=개체·열=속성)는 table, 교차표(행·열=범주, 셀=같은 지표의 교차값)는 cross-table, 도식은 tree / network / flowchart / venn / timeline / schematic이다.
- 전후·좌우의 대상/특성을 대응시키는 비교판은 `comparison`(D4-07 + node-diagram)이다. 판정·절차 분기가 없으면 flowchart로 바꾸지 않는다. 실제 도시·유적·시설의 평면/배치도와 가상 계획도는 `site-plan`(I3-14)으로 참조자료·기하 구조 보충 지침을 읽는다. 실재 배치는 출처 평면 이미지를 확인하고, 가상 계획도는 `dataSource:hypothetical`로 구별한다.
- 질문별 ○·×·체크 응답표는 `D1-05_Checklist`를 선택한다. 대각선 머리글이 있다는 이유만으로 cross-table로 바꾸지 않는다. 분류는 머리글 모양보다 셀의 의미를 우선한다.
- 클립보드에 끼운 한 장의 보고서나 스프링 노트는 `paper` 외피다. 그림이 있으면 image-board의 paper variant를 쓰며, '보드'라는 이름 때문에 noticeboard 카드들로 나누지 않는다. worksheet는 지시·과제와 응답/작성 영역이 있는 양식에만 선택한다.
- 책·노트·고리 카드·앨범은 book / notebook / ring-card / album, 편지·엽서는 letter / postcard, 안내장·포스터·표찰·필름 자료판은 brochure / poster / display-sign / film-frame으로 해당 매체 지침을 준비한다. 이메일·게시물·기기·재생 화면은 email / social-feed / mobile-screen / video-screen, 영사용 걸이 화면은 projection-screen이다. 이는 제작 방향을 고르는 별칭이며 새 native variant를 뜻하지 않는다. 실제 그림/인물 등으로 기존 ITB/ITC 분류를 유지해야 하면 그 unit에 bound-paper / correspondence / display-medium / device-medium 조건만 추가한다. 메신저에는 messenger도, 새 작화·사진에는 실제 해당 조건도 포함한다.
- 접힘·말림·겹침·압정/테이프/클립·거친 가장자리의 낱장은 paper 지침으로 처리한다. 달력·증서·표가 있는 책도 매체는 제본 형태로 고르고 내용 역할은 별도로 준비한다. 비문·목간·죽간·기물·지폐·우표·의복의 문자처럼 실물 자체가 자료이면 photo/object/해당 ITC를 유지하고 필요한 참조·원화와 문자 조건을 결합한다. 문자나 사각 면이 있다는 이유만으로 종이 텍스트일러를 덧씌우지 않는다.
- 여러 사람이 한 칠판·자료판을 함께 보는 장면은 활자 자료이면 `ITA-6_GroupBoard`, 그림·표·그래프 자료이면 `ITB-3_GroupImageBoard`와 해당 매체 variant를 선택한다. 공유 장면 전체를 새로 작화할 때는 기존 `contains:artwork` 조건을 지정한다. 실제 발언 방향을 speech-horizontal / speech-vertical / speech-solo로 표시하고, 독립 표·그래프는 별도 unit으로 준비한다. 내부 제작에 dialogue 생성기를 쓰더라도 요청의 공동 장면을 일반 가로대화 여러 행으로 바꾸지 않는다.
- 관측값을 잇는 선 차트와 함수·이론 개형을 구별한다. 후자는 curve, 생산가능곡선처럼 가능 영역을 가르는 경계는 frontier를 선택한다. 실제 구현에 혼합 차트 생성기를 쓰더라도 의미상 recipe를 단순 line/bar로 바꾸지 않는다.
- 3D 곡면은 `surface`로 분류한다. native graph/schema에서 `type:"surface"` 지원을 확인한 뒤 surface 실행 지침을 읽고, 없으면 기존 편집 경로를 사용한다. 저장소 계약만으로 설치 앱 지원을 단정하지 않는다.
- 지도는 locator-map / topographic-map / area-map / route-map / symbol-map / choropleth / dot-map / proportional-map / isoline-map / flow-map / old-map 중 실제 정보 표현으로 선택한다. 좌표 노드 통계 지도는 isoline-map으로 분류하고, 현재 연결 앱이 `TemplateMapSpec.scalar`를 지원하면 채워진 등치면·단계 색칠에 native scalar를 쓴다. 정확한 등치선이나 선 라벨이 필요하면 live schema/API 지원을 확인하고, 미지원이면 필요한 선·라벨만 보충한다. 격자 순서·좌표·null·값·척도·단위·시점 표기·출처를 그대로 보존하며 DEM은 고도 등고선에만 쓴다. 실제 사진/스캔은 photo, 새 작화는 portrait / object / scene이다.
- 호수·하천·지형 자체를 읽는 일반도는 topographic-map에서 시작한다. 이런 자연 자료층은 `contains:natural`, 위치도·확대창의 대응 관계가 있으면 `contains:inset`을 표시한다. 바탕 위 일반 경로로 보충할 지물도 실제 요청 조건에 포함하며, native spec에 없다는 이유로 해당 지침을 빠뜨리지 않는다.
- 특정 인물은 figure, 원본 인물 사진은 original-person, 시대 복장이 단서이면 costume을 선택하고 실제 배치를 variant로 지정한다. 사진·지도·차트 칸이 있는 매체는 image-board와 지원 매체 variant(newspaper / screen / paper / scroll / board / worksheet)를 사용한다. 대표 매체가 웹페이지이면 image-board variant는 screen이다. 독립 webpage recipe와 native browser variant는 별도 계층이다. 내부의 독립 표·차트·지도는 별도 unit으로 함께 준비한다.
- 특정 건축물·유적·장소의 식별이 핵심인 장면은 `place`(ITC-3_Place)를 선택한다. 장면 위 독립 발언은 scene variant에 speech-solo 조건, 인물 옆 발표 배치는 presentation variant를 쓴다. 원화를 asset으로 구현하더라도 일반 scene으로 분류를 바꾸거나, 상단 발언에 인물 옆 발표의 폭을 적용하지 않는다.
- **인물/사진/새 원화, 실자료 조사, 긴 산문, 밑줄, 문단 박스, 빈 공간 예약**이 있으면 각각 contains 또는 dataSource에 표시한다. 단일 편집 문단이 래스터 옆에서 흐르고 래스터 아래에서 전체 폭으로 이어지는 조판을 요청한 경우에만 `contains:text-flow`를 지정한다. 치수/줄 수 예약은 reserve, 문장 속 박스는 inline-box이며 서로 다르다. 인물이 있는 일반 세로대화가 기본이고, 인물 없는 메시지 화면은 messenger다.
- 모식도에도 산·식생·동물·지형의 생김새를 읽는 삽화가 포함되면 `contains:artwork`와 `organic`을 함께 지정한다. 기하 구조의 편집 가능한 경계·기호·수치와 새 원화를 구별하며, schematic이라는 이름만으로 자연물을 코드 도형으로 대체하지 않는다.
- 독립적으로 완결된 자료를 여러 units로 나눈다. 같은 장면에 서로 다른 발언 배치가 공존할 때는 해당 발언군만 추가 unit으로 지침을 준비하고 한 장면으로 조판한다. 한 unit에 충돌하는 발언 배치 조건을 넣거나, 외피·교사·짧은 보조 발언 때문에 별도 완성 그림을 만들지 않는다. 보조 발언은 speech-horizontal / speech-vertical / speech-solo 조건이다. 분류가 애매할 때만 [분류 사전](references/taxonomy.md)을 해당 항목으로 검색한다. 이름이 명확한 comparison / site-plan 별칭 외에는 Others로 우회하지 않는다. 분류 ID는 MCP kind가 아니다.


- 새 지도에 문자가 있으면 경로도·영역도 등 세부 유형에 관계없이 위치/라벨 원칙을 자동 포함한다. 문자 없는 지도만 textMode:none으로 제외하며, 별도 위치 기호가 있으면 contains:points를 지정한다. 옛 지도 원본 사진은 이 자동 조판 대상이 아니다.
