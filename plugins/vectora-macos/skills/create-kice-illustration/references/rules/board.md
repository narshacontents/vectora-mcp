### 학습 화면·게시판

학습 화면·슬라이드·칠판·게시판을 제작한다. 보드·핀·받침·조작부는 매체에 필요한 요소만 선택한다. 교사와 말풍선은 같은 단위로 구성하며 다른 유형 문서를 추가로 읽지 않는다.

교사·발표자가 있으면 위 「발표 배치」와 「발언·인물 대응과 승인 원화」의 동일 조건을 적용한다.

#### 선택 게시판 실행

스킬 루트에서 `node scripts/build_text_frame.mjs --spec <입력.json> --output <배경.svg>` 또는 `buildTextFrame(spec)`을 사용한다. 게시판은 `variant:"noticeboard"`, `widthMm` 기본 108/범위 30–108, 필수 `contentHeightMm`은 실제 측정/지정 내용 높이, `paddingMm`은 밖에 더하는 여백이다. 필요에 따라 `columns`, `cardTitleHeightMm`, `footerHeightMm`, `portraitMm`, `headerHeightMm`, `titleHeightMm`을 사용한다. 기존 출력은 명시적 `--force`일 때만 교체한다.

반환 `{svg,layout}`의 `layout.slots`는 문서 px 좌표의 chrome/title/content/author 자리다. 실제 높이에 맞는 `textAlign`/`verticalAlign`을 적용하고 빈 `illustrationSlots`는 요청한 초상으로 채운다. 배경 도구는 본문과 줄 수를 측정/작성하지 않으며 미지원 `lineCount`/`contentWidthMm`을 입력하지 않는다. 실제 슬롯 폭과 연속 직사각형 높이를 확인하고 교사·말풍선은 별도 개체로 배치한다. 다른 학습 매체는 위 원리로 직접 구성한다.


3카드 게시판을 요청하면 `columns:3`으로 구성하며 다른 카드 수를 받으면 그 수를 따른다. 카드 제목·본문·하단 작성자/초상을 각각 예약한다. 생성된 빈 초상 슬롯은 실제 요청된 초상만 채운다.

#### 검사

화면과 발언 대응, 꼬리 형상/실제 윤곽 간격, 바깥 이름·높이 기준·하단 정렬을 확인한다. 말풍선이 있으면 얼굴 또는 바로 가쪽 이름의 좌우 끝 정렬과 가쪽의 큰 흰 여백 없음을 확인한다. 각 발언/본문 덩어리가 여러 줄이어도 글상자 하나이고 밑줄은 그 글상자의 서식인지 검사한다. 게시판이면 카드 간격·작성자 대응·예약 공간을 함께 검사한다.

독립 완결 표·차트를 native 내부 컴포넌트 또는 기존 편집 그룹으로 보존한다.
