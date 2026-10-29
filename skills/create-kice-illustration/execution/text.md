# 문자 측정·생성의 공통 계약

1. `vectora_fonts`와 노출된 `vectora_check_font`로 실제 family/style/weight, supportsText/missingGlyphs, 부분 서식 지원을 확인한다. 누락된 UND는 임의 대체하지 않는다. colorMode가 있으면 기본 cmyk, 사용자 RGB는 rgb다. 가져오기 MISSING_FONTS이면 실제 지원되는 fontReplacements와 사용자 지정 매핑을 확인한다.
2. `vectora_measure_text`에 최종 text·widthMm·textProfile과 필요한 명시값/범위 서식을 보내고 **생성에도 같은 선언**을 쓴다. frame·ink·baseline을 구별한다. 범위 서식 측정 미지원이면 실제 Editor에서 완성 서식을 측정한다. 옛 폰트 측정치·프레임 높이를 재사용하지 않는다.
3. 프레임 크기 변경은 `resizeTextFrame`/생성기의 재조판으로 한다. transform.width·전체 Scale로 문자 폭을 늘이지 않는다. import 맞춤/상위 배율로 실제 pt·장평·획 규격이 달라졌다면 조판 속성을 고친다.

## 스타일 API

등록 ID·실제 수치는 `vectora://capabilities`의 `textProfiles.catalog`에서 읽는다. 실제 스키마가 지원하는 아래 경로만 쓴다.

| 경로 | 스타일·크기·자간 |
|---|---|
| 일반 add/style/textRange | `values.textProfile`, `fontSize`, `charSpacing` |
| production rich text / measure spec | `textProfile`, `fontPt`, `tracking` |

- 양쪽 모두 행간은 `leadingPercent:130`처럼 **백분율**이다(1.3이나 pt 아님). horizontalScale도 백분율이며 0.95가 아니다. 명시값은 프로필보다 우선하므로 새 프로필로 바꿀 때 옛 자동값을 덮어쓰기 값으로 복사하지 않는다.
- 프리셋을 바꾸면 저장된 비율, 크기만 바꾸면 현재 비율을 유지한다. 부분 프로필은 글자 속성만 변경하며 다른 범위의 문단 행간을 바꾸지 않는다. 셀은 독립 글상자라 셀별 행간을 지정한다.
- 두 줄 이상이면 lineMetrics의 기준선 간격이 `fontPt × leadingPercent / 100`인지 확인한다. 부분 큰 글자에도 문단 기준 크기는 유지된다. 큰 기호/박스의 TEXT_LEADING_REVIEW·TEXT_LEADING_OVERFLOW는 실제 ink bounds와 함께 해결한다. 기존 lineHeight 배수는 같은 계산이라고 가정하지 말고 측정한다. 세로쓰기·기존 문서 방식을 요청 없이 바꾸지 않는다.
- 세로 글상자는 실제 글 크기·잉크를 반영한 기본 셀 간격, 행간은 열 간격이다. 글자 사이를 줄이려고 음수 자간으로 띄어쓰기까지 줄이지 않는다. 공백·반칸·세로 단위 묶음을 유지한다.

## 필요한 경우에만 읽을 계약

- 부분 서식·본문용 글리프·제목 괄호: `execution/text-ranges.md`. 문자열만 받는 제목/범례도 필요하면 생성된 실제 문자 ID에 적용한다.
- 문단 들여쓰기·항목 고정·문단 뒤 간격·각주: `execution/paragraphs.md`.
- 회색 면의 흰 윤곽·선 위 흰 받침: `execution/text-effects.md`.
- SVG 문자 가져오기: 실제 한 글상자인지 검사하고 분리됐으면 전체 원문·개행·범위 서식으로 네이티브 글상자를 재구성한다. 줄별 text/tspan 그룹·별도 밑줄 선을 완성본으로 남기지 않는다. pattern/textPath/filter/mask 보존도 실제로 확인하며, 필요한 그래픽만 선·원·clip으로 보충하고 본문/밑줄을 도형화하지 않는다. 화살촉은 실제 끝과 스키마 허용값을 확인한다.

스키마에 없는 기능은 추측 호출하지 않는다. 기술 검사 성공은 시각 합격이 아니다.
