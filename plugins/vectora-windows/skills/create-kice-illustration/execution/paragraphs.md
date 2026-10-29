# 문단 들여쓰기·접두부·간격

산문의 문단 조판 또는 각주가 필요할 때 읽는다. 원문 하나를 줄별 개체로 분리하지 않는다.

- 커서 기준 문단 들여쓰기가 필요한 경우, 라이브 `vectora_apply`에 `paragraphIndent`가 노출되면 `{type:"paragraphIndent",id:<글상자 ID>,at:<논리 grapheme 커서 위치>,action:"set"}`를 쓴다. `at`은 화면 줄의 번호나 UTF-16 코드 단위 위치가 아니라 실제 저장 문자열의 커서 인덱스다. 고정 공백·인라인 박스 조판 이후의 실제 문자열로 계산하고, 선택한 장평·자간·부분 서식을 포함한 커서 x는 앱이 측정한다. 해제는 같은 문단의 `at`에 `action:"clear"`다. 지원되는 가로 왼쪽/양쪽 정렬에서 사용하며 다른 정렬을 몰래 바꾸지 않는다. production 소유 글상자에서도 후속 본문 수정·저장·재열기에 들여쓰기가 유지되는지 확인한다. 미지원 앱에서는 공백으로 흉내 내거나 필드 이름을 추측하지 않는다.

- 첫 줄 들여쓰기·고정 본문 열은 라이브 스키마의 `paragraphLayout` 지원을 확인한 뒤 `{type:"paragraphLayout",id,at,firstLineIndentMm}` 또는 `prefix:{end,bodyStartMm}`로 지정한다. `at`과 `end`는 원문 논리 grapheme 위치이며 `end`는 접두부·뒤 공백 다음 본문 첫 글자다. 치수는 **글상자 로컬 mm**로, 첫 줄 0–100mm·본문 열 0 초과–100mm이고 음수는 지원하지 않는다. 접두부와 본문 첫 글자가 실제로 들어가는 열을 측정해 선택한다. 생성·측정용 rich text는 `paragraphLayouts:[{paragraphStart,firstLineIndentMm?,spaceAfterPt?,prefix?}]`를 함께 보내며, 현재 공개 스키마에 없는 경로에는 전송하지 않는다. `prefix:null`은 접두부 고정만, `action:"clear"`는 이 문단 배치를 해제한다. 기존 커서 들여쓰기가 함께 있으면 후속 행은 그 커서 앵커가 우선하므로 의도하지 않은 중복 설정을 남기지 않는다.

- 문단 간격은 live `paragraphLayout.spaceAfterPt` 지원 시 원문 문단 시작 위치 `at`에 지정한다. 값은 단위 모드와 무관한 pt이며 기본0, 음수는 쓰지 않는다. 해당 문단의 마지막 표시 줄과 바로 다음 비어 있지 않은 문단의 첫 줄 사이에만 더해지며 자동 줄바꿈 내부·빈 문단·마지막 문단 뒤에는 더하지 않는다. 생성·측정에는 같은 `paragraphLayouts`를 전달하고, 기준선 차이·본문 편집·저장/재열기로 보존을 확인한다. 전체 문단 배치를 지우는 clear 대신 간격만 없앨 때는 `spaceAfterPt:0`을 지정해 들여쓰기·접두부를 유지한다.
