# 문자·서체 측정과 네이티브 편집



- vectora_fonts와 노출된 vectora_check_font로 위 물리 규격의 실제 family/style/weight/supportsText·missingGlyphs·문자 범위별 서식 지원을 확인한다. 스키마에 있는 인자만 전송한다. colorMode가 있으면 기본 cmyk, 사용자 RGB면 rgb. 열기/가져오기에서 MISSING_FONTS면 목록과 설치 폰트를 확인하고 실제 fontReplacements 지원 시 명시 선택 매핑으로 재시도한다. UND 대체에는 사용자 지시가 필요하다.

- vectora_measure_text는 라이브 스키마를 확인한 뒤 실제 text,widthMm,fontPt:8, 선택한 역할의 tracking,lineHeight, `horizontalScale` 및 지원되는 글꼴 범위 서식을 보낸다. 생성에도 같은 값을 명시해 도구 기본값으로 돌아가지 않게 한다. horizontalScale은 mm/px 단위 모드와 무관한 백분율이며 0.95가 아니다. 허용된 장식 문자 크기 예외가 있으면 그 실제 fontPt로 따로 측정한다. 실제 선택한 UND 계열 혼합 서식의 측정 결과로 frame/ink/baseline을 구분한다. 도구가 범위별 서식을 측정하지 못하면 실제 Editor에서 완성 서식을 재측정한다. 이전 폰트의 측정치나 프레임 높이는 재사용하지 않는다. 프레임 변경은 resizeTextFrame/실제 재조판; transform.width나 전체 Scale로 글자를 늘이지 않는다. 획 하한/자동 import 맞춤/상위 배율로 규격이 바뀌면 실제 속성을 교정한다.

- Fabric 직렬화형 `styles` 배열의 `start/end`는 grapheme 인덱스이며 개행 문자는 세지 않는다. 범위는 오름차순·비중첩이어야 한다. `underlines`와 `textRange`는 논리 grapheme 인덱스를 사용하므로 계약을 섞지 않는다. 밑줄 범위는 강제 개행을 넘을 수 없다.
- `lineHeight`는 엔진 배수이며 `fontPt × lineHeight`가 실제 기준선 간격이라고 가정하지 않는다. 두 줄 이상의 실제 `lineMetrics`에서 간격을 mm→pt로 환산하고, 명시 간격이 필요하면 현재 배수에 `목표 간격 / 측정 간격`을 곱해 조정한 뒤 재측정한다. 큰 기호·다른 서체·인라인 박스 때문에 개별 행이 커진 경우를 전체 문단의 고정 행간 오류로 취급하지 않는다.
- 문자 모양은 라이브 스키마가 지원할 때 `textRange.values.glyphRole` 또는 native rich-text의 해당 문자 `styles`에 지정한다. Main Regular 제목·자료 기호 `< > = ~`에는 `"kice-main-symbols-v1"`, 연속 본문 숫자와 같은 기호에는 `"kice-main-prose-v1"`을 선택한다. 해제는 `"default"`이며 UI의 **문자 모양**과 같다. 같은 범위 서식을 측정·생성·저장에 유지한다. 기본 표·축 숫자와 ABC를 본문 역할로 일괄 바꾸지 않는다. 미지원 앱에서는 role 값을 추측하거나 전각/CJK/PUA로 원문을 치환하지 않는다.
- `scripts/prepare_prose.mjs`는 Fabric 직렬화 서식 배열을 line/character map으로 변환해야 할 때만 선택적으로 쓴다. 매 산문 제작의 필수 단계가 아니며 글꼴을 자동 지정하지 않는다. 원문을 수정하면 새 문자열에 맞춰 범위를 갱신하고 예전 위치 인덱스를 복사하지 않는다.
- 커서 기준 문단 들여쓰기가 필요한 경우, 라이브 `vectora_apply`에 `paragraphIndent`가 노출되면 `{type:"paragraphIndent",id:<글상자 ID>,at:<논리 grapheme 커서 위치>,action:"set"}`를 쓴다. `at`은 화면 줄의 번호나 UTF-16 코드 단위 위치가 아니라 실제 저장 문자열의 커서 인덱스다. 고정 공백·인라인 박스 조판 이후의 실제 문자열로 계산하고, 선택한 장평·자간·부분 서식을 포함한 커서 x는 앱이 측정한다. 해제는 같은 문단의 `at`에 `action:"clear"`다. 지원되는 가로 왼쪽/양쪽 정렬에서 사용하며 다른 정렬을 몰래 바꾸지 않는다. production 소유 글상자에서도 후속 본문 수정·저장·재열기에 들여쓰기가 유지되는지 확인한다. 미지원 앱에서는 공백으로 흉내 내거나 필드 이름을 추측하지 않는다.
- 첫 줄 들여쓰기·고정 본문 열은 라이브 스키마의 `paragraphLayout` 지원을 확인한 뒤 `{type:"paragraphLayout",id,at,firstLineIndentMm}` 또는 `prefix:{end,bodyStartMm}`로 지정한다. `at`과 `end`는 원문 논리 grapheme 위치이며 `end`는 접두부·뒤 공백 다음 본문 첫 글자다. 치수는 **글상자 로컬 mm**로, 첫 줄 0–100mm·본문 열 0 초과–100mm이고 음수는 지원하지 않는다. 접두부와 본문 첫 글자가 실제로 들어가는 열을 측정해 선택한다. 생성·측정용 rich text는 `paragraphLayouts:[{paragraphStart,firstLineIndentMm?,prefix?}]`를 함께 보내며, 현재 공개 스키마에 없는 경로에는 전송하지 않는다. `prefix:null`은 접두부 고정만, `action:"clear"`는 이 문단 배치를 해제한다. 기존 커서 들여쓰기가 함께 있으면 후속 행은 그 커서 앵커가 우선하므로 의도하지 않은 중복 설정을 남기지 않는다.

- 여러 줄 텍스트는 Vectora의 **한 글상자 안에서 개행·자동 줄바꿈**으로 제작한다. SVG의 줄별 `<text>` 생성·그룹화는 금지하며, 단일 `<text>`/`tspan`도 가져온 뒤 실제로 하나의 글상자인지 확인한다. 분리되면 전체 원문·개행·범위 서식을 한 네이티브 글상자로 재구성한다. production 결과도 같은 기준으로 검사하며 줄 수만큼의 글상자나 별도 밑줄 선을 완성본으로 남기지 않는다. SVG pattern/textPath/filter/mask 보존을 가정하지 않고 실제 선·원+clip 등 편집 구조로 구현하되 본문이나 밑줄을 도형으로 대체하지 않는다. 화살촉은 실제 끝, `arrow-3` 등은 현재 스키마 허용값 확인. 단순 자동 audit가 시각 품질·의미를 인증하지 않는다.
