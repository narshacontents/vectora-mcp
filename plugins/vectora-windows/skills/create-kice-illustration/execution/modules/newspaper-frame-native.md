### 신문 외피 구현

설계 단계에서 정한 외형을 실제 계약에 대응한다. 제호·날짜·제목·본문의 역할과 승인된 선 규칙을 유지하며, 생성기 옵션을 완성 디자인의 전체 목록으로 삼지 않는다.

`variant`는 하단 물결의 `newspaper-wave` 또는 회색 제호 띠/직선 하단의 `newspaper-band`다. 라이브 `vectora_production`의 text 계약을 우선하며, 지원되는 `body`/`title`과 `background.masthead`/`date`로 실제 글을 넣는다. `headerHeightMm`은 얕은 제호 영역, `titleHeightMm`은 별도 기사 제목 영역이며 제목이 없으면 0이다. 선택적 로컬 배경 helper를 사용할 때만 그 helper가 반환한 `masthead`/`date`/`headline` 슬롯에 문자를 별도로 조판한다. helper와 네이티브 생성기의 입력 계약을 혼용하지 않는다. 인터넷 신문 외피는 필요하면 직접 보완한다.

연결 앱의 지원 여부를 확인한 뒤 제호 정렬은 기존 `background.masthead:{text,textAlign:'left'|'center'|'right'}`로 입력해 측정·재조판에 유지하며, 생성 뒤 개별 문자 이동을 전제로 하지 않는다. 날짜 종류·크기는 기존 `datePolicy`의 의미 있는 날짜/장식 날짜 구분과 실측 계약을 따르고, 개별 `fontSize:7`을 상시 수동 보충하지 않는다.

라이브 스키마가 지원하면 `background.newspaperHeader:"plain"|"band"`와 `paperEdge:"straight"|"wave"`를 독립적으로 골라 흰 제호/회색 띠와 직선/물결 하단을 조합한다. 위 두 variant의 조합만 평가원 규칙으로 고정하지 않는다. 제호·날짜·제목·본문의 역할과 금지된 본문 가로선 규칙은 어떤 외피에서도 유지하며, 기존 문서의 수정에서는 외피 선택을 바꾸지 않는다.
