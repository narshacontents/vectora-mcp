---
name: create-kice-illustration
description: "통합사회 평가원 스타일 일러스트 만들기. 사용자의 설명으로 Vectora용 편집 가능한 통합사회 그림을 제작·수정한다. 표(table), 유한 수치 차트(chart), 연속 개념 그래프(graph), 도식(diagram), 사진(photo), 삽화(illustration), 지도(map), 대화(dialogue), 문서(document), 학습 활동(activity)을 정보 역할로 분류하고 공통→유형→하위유형의 세 문서로 제작한다. 출제 에이전트 의뢰는 설치된 references/caller/exam-agent-guide.md의 입력·응답 계약으로 연결한다. 문항 출제·정답 풀이는 범위 밖이다."
---

# 통합사회 평가원 스타일 일러스트 만들기

현재 사용자 지시가 최우선이다. 이 규격은 사용자가 정한 제작 원칙이며 평가원 공식 규정이 아니다. 현재 요청의 내용·관계·필수 대상에서 새로 설계한다. 과거 평가원 예시·기출·카탈로그·측정표·완성 템플릿을 찾아 복사·추적하거나 가까운 예시 ID를 선택하지 않는다. 이번 요청의 자료는 입력이며, 명시한 원본 재현·동일 인물 재사용에는 직접 참고한다. 승인된 지도 바탕 재사용은 허용한다.

## 출제 에이전트 의뢰·완료 계약

[출제 에이전트 연동 가이드](references/caller/exam-agent-guide.md)는 **호출자가 의뢰서를 작성하고 결과를 문항에 반영하는 참고 자료**다. 제작자의 추가 지침이나 네 번째 필수 문서가 아니며, 제작자는 아래 계약과 선택한 세 지침으로 실행한다.

- 입력: 문항/그림/의뢰 버전·신규/수정 범위·그림의 역할, **표시할 원문/이름/기호/빈칸/강조**와 대상별 대응, **표시 금지 출제 맥락/정답/해설**을 분리한다. 제작 의도·검수 메모·파일명은 자동 표시하지 않는다.
- 자료/제약: 실제 제공/실제 조사/가상/정성 자료를 구별하고 값·단위·분모·시점·결측·관계·직접 출처/조사 범위·참조 파일·유지/금지 조건을 받는다. 그림 전체 외곽 목표 폭(mm), 높이 제한과 내부 내용 상자 치수를 구별하고 저장 폴더·파일명·형식·덮어쓰기 범위를 확인한다. 의미를 바꾸는 누락/모순은 확인하며 선택적 조판은 제작자가 결정한다.
- 완료 응답은 **본문**으로 `문항/그림/의뢰 버전; 상태: 완료 / 일부 미완료 / 입력 또는 도구 필요; 유형/하위유형; 실제 원본·JPEG 경로; 실측 외곽 폭×높이(mm); 저장·재열기; 실제 JPEG 직접 열람·검수; 원문·값·대응 관계 검사; 순수 벡터/포함 원화 혼합; 실제 출처·변환(해당 시); 미충족 조건·남은 문제`를 전달한다. 검사는 실행·미실행·실패를 구별하고 미확인을 합격으로 쓰지 않는다. 별도 의뢰/검수/응답 파일은 기본 납품에 추가하지 않는다.

## 세 단계와 분류

비복합 작업은 **이 SKILL.md → references/types/<type>.md 하나 → references/subtypes/<type>/<subtype>.md 하나**, 정확히 세 지침 문서를 읽는다. 유형 문서에서 하위유형 하나를 선택한다. 실행·참조 검색·실자료·원화 규칙은 이 문서와 선택한 두 문서에 포함되어 있다. 생성에 use-vectora 스킬이나 옛 common/production/people 문서를 추가로 읽지 않는다. 도구의 현재 입력 스키마와 실제 입력·데이터·지도 자산은 지침 문서가 아니다. 이 세 문서 제한은 **이 그림 스킬의 지침 체계**에 관한 것으로 플랫폼의 별도 필수 스킬 정책을 면제하지 않는다.

| 정확한 type | 정보 역할과 경계 | 유형 문서 |
|---|---|---|
| table | 행·열·셀의 비교/교차값/응답/격자. 유한 수치를 면적·길이로 나타내면 chart | [table](references/types/table.md) |
| chart | 유한 관측값·범주·시점·구성비의 정량 시각화. 관측점을 잇는 선도 chart | [chart](references/types/chart.md) |
| graph | 연속 함수·가능 영역 경계·분포 면적·연속 개념 좌표. 유한 실측 시계열과 구분 | [graph](references/types/graph.md) |
| diagram | 위계·관계·절차·집합·연표·단면/공간 구조·정량값 없는 특성 좌표. 벤은 구성비 원 차트가 아님 | [diagram](references/types/diagram.md) |
| photo | 사진·스캔의 실제 조명/연속 계조 또는 기존 작품의 원본 복제. 새 선화 재작화는 illustration | [photo](references/types/photo.md) |
| illustration | 신규 작화한 대상·행동·복원 장면, 독립 얼굴/흉상, 실제 주화·문장·국기의 선화 재작화. 공간 분포는 map | [illustration](references/types/illustration.md) |
| map | 지리적 공간 기준 위의 위치·영역·분포·이동. 대상의 지형 형태만 그리면 illustration, 구조 단면은 diagram | [map](references/types/map.md) |
| dialogue | 인물과 발화 텍스트의 대응. TV·뉴스도 말풍선 발화가 있으면 dialogue | [dialogue](references/types/dialogue.md) |
| document | 신문·문서·웹·방송 매체 외피의 기사/자막/자료 카드 텍스트; 발화 말풍선 없음 | [document](references/types/document.md) |
| activity | 학습 보드·슬라이드·학습지·활동 양식. 교사+말풍선도 그 활동의 한 단위 | [activity](references/types/activity.md) |

- 세부 유형은 선택한 유형 문서의 경계를 따른다. 분류표의 reserved는 자료 분류 상태이지 해당 그림 제작 금지가 아니다.
- 복합 요청은 독립적으로 완결된 자료 단위를 빠짐없이 나열하고 각 단위에 유형→하위유형을 적용한다. 활동 보드 안 완결 표·차트는 분리한다. 매체 테두리·교사·짧은 발화처럼 상위 기능에 종속된 장식 때문에 불필요한 복합형을 만들지 않는다.
- 같은 식별 기호·시점·값은 단위 간 대조하고 가까이 묶는다. 복합형도 하나의 완성 그림으로 저장하며 내부 자료·글·연결은 별도 편집 구조를 유지한다.

## 물리 규격·내용·편집

- 최종 전체 폭 **108mm 이하**. 사용자 지정 폭은 대지가 아니라 **그림 전체의 실제 외곽 폭**이다. 8pt·선폭을 유지하며 줄바꿈·영역·간격 조판으로 먼저 지정 폭에 가깝게 맞춘다. 대지만 지정 폭으로 늘이거나 가짜 배경으로 폭을 채우지 않는다. 높이 상한으로 해석하지 않는다.
- 새 글은 기본 글꼴 계열 **UND v3.0**, 8pt, 자간 **-6% = tracking/charSpacing:-60**(1/1000em)이다. 기본 Regular의 PostScript face는 **UNDv30-Regular**이며, 굵게·기울임은 실제 **UNDv30-Bold**·**UNDv30-Italic** 면을 쓴다. 가짜 굵게/기울임은 만들지 않는다. 모든 한글·CJK·전각 문자와 공백은 SocRegular를, Dopyo에 보이는 라틴 문자·그리스 문자 이름의 수학 기호와 CJK/한글/전각 밖의 숫자·문장부호·기호는 Dopyo를 기본으로 쓴다(ASCII 숫자 포함). Dopyo에 글리프가 없으면 SocRegular 및 확인된 원본 글리프 합집합의 지원 범위만 사용한다.
- 텍스트 일러스트·문서·활동·대화의 긴 산문에서는 영어 라틴 문자 범위를 UND v3.0 Body로 기본 지정한다. 한글 문장 안에 섞인 영어 단어도 해당 범위에 포함한다. 한국어와 기호는 UND v3.0에 둔다. 실제 문자 범위별 fontFamily(textRange) 지원을 사용하고, 문단 전체를 Body로 바꾸거나 스키마에 없는 필드를 보내지 않는다. Body의 PostScript 면은 UNDv30Body-Regular/Bold/Italic이다.
- 폰트 바이너리는 그림·스킬에 임베드하지 않는다. 폰트·면을 자동 대체하지 않는다. 기존 문서의 서체·자간은 요청 없이 바꾸지 않는다.
- 기존 0→⓪ 입력 변환은 유지한다. 현재 UND v3.0 면은 ⓪ 글리프를 제공하지 않으므로 UND 지원 문자라고 주장하지 말고 실제 누락 글리프로 보고한다.
- 원문·밑줄·식별 기호·빈칸·수치·소수 자릿수·관계를 유지한다. 빈칸 정답, 요청 없는 이름·제목·해설·기관·연도를 추가하지 않는다. 단, 유형 규칙에 명시한 매체 식별용 기본 표기(신문의 ○○신문·기호 날짜)는 적용하고 실제 기관명·현재연도를 추정하지 않는다. 제작/검사 기록은 그림 밖에 둔다. 실자료의 확인·환산은 아래 조건에서만 허용한다.
- 단위·기준 시점은 적용 자료 가까이, 주석·출처는 그 아래 여백에 둔다. 여러 자료의 단위/출처를 섞지 않는다.
- 새 그림은 별도 문서, 수정은 지정 범위만. 문자·말풍선·자료 그래프·도식은 독립 편집 요소; 원화는 이동·비례 크기·교체 가능한 포함 이미지여도 된다. 전체 조판 래스터화/본문 전체 윤곽선화를 편집 원본으로 취급하지 않는다.
- **하나의 텍스트 덩어리는 반드시 하나의 편집 가능한 글상자**로 만든다. 한 발언·본문·셀 내용·라벨 안의 자동 줄바꿈과 명시 개행은 같은 글상자 안에 유지한다. 여러 줄을 한 줄씩 별도 글상자로 만들거나 그 글상자들을 그룹으로 묶어 대신하는 것은 금지한다. 글꼴·강조·밑줄이 달라도 같은 글상자의 문자 범위 서식을 사용한다. 제목과 본문, 서로 다른 발언/셀처럼 독립된 내용 단위만 각각의 글상자로 나눈다.
- 벡터 선·화살촉·선 역할의 채움 경로는 **#000000, 유효 불투명도 100%**(상위 그룹 포함). 강약은 굵기/실선·파선으로 구별한다. 일반 테두리·말풍선·도식 연결·보조선·인출선·범례 선은 **0.3pt**; 축·개형 등은 유형 규격. 원화/장식의 모든 획에 0.3pt를 강제하지 않는다.
- Native graph/map production은 새 create에서 공통 `styleProfile:"kice"`를 기본 적용한다. `styleProfile:"general"`과 사용자가 준 값은 우선한다. KICE graph의 축/자료/보조선은 각각 0.4/0.6/0.3pt, 지도 경계·빈 원 외곽은 0.3pt이며 새 지도 점은 흰 채움·검정 외곽, 단순 강조 면은 `#AAAAAA`부터 시작한다. 바다색을 요청하지 않으면 흰 바탕이고, 회색 바다를 요청했으나 농도를 정하지 않으면 `#EEEEEE`를 쓴다. profile resolver는 요청값 → 저장된 명시값 → 프로필 기본값 순으로 적용하고 저장 spec의 `styleProvenance`에서 `explicit`과 `automatic` 경로를 구분한다. 기존 spec에 새 프로필을 덧붙여 소급 변경하지 않는다.
- 회색 **채움/명암 면**은 허용한다. 원화 픽셀은 검정으로 치환하지 않는다. 매체/활동 외피의 구조·작은 장식·접촉 그림자에 필요한 국소 회색 선은 이유·요소를 기록하고 허용하되 기본 윤곽은 검정. 이를 내부 표·차트·대화·도식의 회색 선 예외로 확장하지 않는다. JPEG 안티앨리어싱은 설정상 회색 선과 구분한다.

## 내용에서 크기 계산

1. **실제 본문 측정/지정 내용 상자 예약 → 내용 영역 → 주변 요소 → 최종 외곽** 순서. 실제 UND v3.0 면과 자간으로 줄바꿈·줄높이를 측정하고 괄호/문장부호가 잘못 고립되지 않게 한다. 영어 본문 범위를 Body로 지정했다면 그 혼합 서식 그대로 측정한다. 글자 수·다른 폰트 평균폭·이전 폰트의 프레임 치수로 완료하지 않는다.
2. 내용 틀 높이 = 실제 조판 높이 + 위아래 여백. 제목·작성자·삽화·꼬리·둥근 모서리는 별도 공간. 프레임/글 획/밑줄 경계를 구별한다.
3. 다음 행 y = 현재 행의 **몸통·꼬리·인물·이름·소품까지 포함한 최하단 외곽 + 행간**. 전체 높이에 비례하여 모든 y를 늘리지 않는다. 비교 요소는 기준선·틈을 일관되게 하되 글 분량에 따라 영역을 조정한다. 내부보다 항목 사이 간격을 크게 해 묶는다.
4. 원은 1:1, 인물·사물은 자연스러운 종횡비; 상대 인물 크기는 머리끼리 비교한다. 글·선은 물리 규격을 유지하고 영역·줄바꿈·라벨을 조정한다. 전체 Scale/압축/textLength로 맞추지 않는다. 지도 바탕만 문자·지시선 추가 전에 비례 조정한다.
5. 유형 수치는 미지정 배치의 출발값이며 충돌 없는 대응·묶음이 우선이다. 범위를 벗어난 실제 이유는 기록하며 내용·글 크기를 바꿔 숨기지 않는다.

**내용 상자 치수 지정:** 지정 너비/높이는 여백을 뺀 사용 가능 내용 영역이다. 그대로 예약한 뒤 좌우/위아래 여백과 외피·장식을 바깥에 더한다. 높이 100mm에 여백 2mm씩이면 안쪽 면 최소 104mm. 높이만 주면 너비는 유형의 가용 폭으로 정한다. 본문이 없으면 비워 두고 임시 문장/요청 없는 테두리는 넣지 않는다. 예약 x/y/너비/높이는 그림 밖 기록 또는 메타데이터에 남긴다. 조건이 실제 충돌할 때만 조정을 확인한다.

**N줄 지정:** 실제 UND v3.0 8pt/-60로 정확히 N줄인 텍스트 프레임을 측정한다. 지정 너비·행간을 우선하며 미지정 기본 행간은 **lineHeight:1.24**(공식 규정 아님). 긴 영어 범위를 Body로 쓰면 실제 혼합 서식으로 측정한다. 본문 없으면 짧은 한글 문구를 명시 줄바꿈 N줄로 만들어 자동 줄바꿈이 늘지 않는지 확인한다. 빈 문자열/개행만 또는 N×8pt로 추정하지 않는다. 본문이 있으면 그 문장으로 측정하고 줄 수 충돌을 숨기지 않는다. measurementAvailable=true, font.verified=true, 누락 글리프 없음, lines.length===N을 확인한 frameBounds.heightMm를 예약한다(inkBounds/기준선 거리 아님). 도구가 없으면 실제 UND v3.0 Editor 임시 프레임 배율 1로 mm 높이를 측정한다. 임시/숨긴 측정 문자는 저장 전 제거; 줄 수·너비·폰트·행간·높이를 기록하고 행간을 바꾸면 재측정한다.

**밑줄은 반드시 글상자의 밑줄 기능으로 적용한다.** 전체 또는 실제 문자열 구간에 라이브 스키마가 지원하는 `underline:true` 서식을 사용하며, 부분 밑줄은 같은 글상자 ID의 `textRange`에 적용한다. 이중 밑줄은 라이브 `textRange.values.doubleUnderline`이 노출될 때만 범위 서식으로 적용한다. 밑줄용 별도 line/path/사각형을 만들어 글 아래에 배치하지 않는다. 줄바꿈을 가로지르는 범위도 글상자를 나누지 않고 같은 개체 안의 범위 서식으로 처리하며, 글 수정·재조판 후에도 해당 글자에 밑줄이 따라가는지 확인한다. 생성기·가져오기에서 별도 밑줄 선이 생기면 글상자 서식으로 교정하며, 지원 실패를 별도 선으로 숨기지 않는다. 문장 빈칸은 순서·기준선을 유지한다.

자료 식별 (가)~(하)는 문서에 해당 글자를 그대로 저장하고 입력한다. 느낌표·골뱅이·샵·달러 기호나 PUA 문자를 저장 문자열로 쓰지 않는다. 글리프 누락이 있으면 실제 지원 상태와 렌더러의 확인된 표시 경로를 점검한다. 미지원 기호는 의미가 같은 경우에만 바꾸고 기록할 수 있다. 뜻이 다른 대괄호는 괄호만 벡터 선으로, 안 문자는 살아 있게 둔다. 그 밖의 글리프·폰트 문제는 조용히 대체하지 않는다.

## 차트·연속 그래프의 축·개형 표현 — chart/graph에만

정량 chart와 축/개형을 가진 graph에 적용한다. 수량 눈금은 **실제 수량 척도가 있는 경우만**; 정성 이론 그래프에 새 숫자 눈금·전면 격자를 자동 추가하지 않는다. 눈금 비교용 보조선 적용 조건은 해당 유형에서 정한다.

- 축 **0.4pt**, 개형 **0.6/0.7/0.8pt** 중 하나, 보조선·인출선·범례 테두리 **0.3pt**. 채운 화살촉에 외곽선을 덧대지 않는다. 채움은 **#FFFFFF,#EEEEEE,#CCCCCC,#AAAAAA,#666666,#000000**; 그라디언트·그림자·입체 장식 금지.
- 보조 파선 선/간격 **1.5/1pt**. 개형 파선은 0.6·0.7pt에서 **2/1pt**, 0.8pt에서 **3/1.5pt**. 일점쇄선은 각각 **5/1/1/1pt**, **6/1.5/1.5/1.5pt**. 엔진의 0.8pt 일점쇄선이 6/1/1/1이면 실제 개체를 교정한다.
- 필요한 범례는 흰 사각 상자에 본체와 같은 물리 크기의 견본/표식·문구를 정렬하며 직접 계열명으로 대응이 충분하면 생략한다. Y지표명은 축 왼쪽 직립 세로쓰기; 긴 제목은 의미 단위 **2–3열**, 짧은 단위는 따로. X제목은 눈금 아래 별도 줄/축 끝 바깥.
- 제목·눈금·단위·범례·외부 라벨 공간을 먼저 제외하여 자료 영역 계산. 긴 범주명은 의미 단위 줄바꿈과 실제 폭 측정, 한 음절 고립·이웃 라벨 접촉 금지. 비수량 범주 간격만 라벨 폭에 맞춰 변경할 수 있다.
- 수량 축은 일정 간격의 읽기 쉬운 눈금이며 관측값을 불규칙 눈금으로 대신하지 않는다. 생략 뒤에도 척도/눈금 간격 유지. 같은 의미의 비교 패널은 척도·크기 공유, 패널 사이 틈은 내부 틈보다 크게.
- 무늬는 불투명 바탕의 실제 원/선으로 만들고 영역 경계에서 클리핑; 외곽/공유 경계는 한 번만. 라벨 충돌은 배치로 풀고 자료 좌표를 이동하지 않는다.

## 글을 담는 외피 — document/activity에만

흰 내용 면을 먼저 확보하고 외피·장식은 그 바깥의 얕은 프레임에 둔다. 장식 때문에 기존 내용 영역/예약 공간을 잠식하거나 외피를 불필요하게 확장하지 않는다. 회색 바탕은 **#CCCCCC–#D6D6D6**, 작은 강조는 **#888888–#999999** 또는 **#555555–#777777**를 출발값으로 사용하여 지나치게 희미하거나 성기지 않게 한다. 내부 여백 **외피 폭의 2–5%**, 카드 사이 틈 **4–6%** 출발; 실제 글·빈 공간과 얕은 외피가 우선이며 단순 균등 확대하지 않는다. 원본 사진에는 이 외피 팔레트/신규 작화 계약을 적용하지 않는다.

## 새 원화와 참조 검색 — 원본 photo에는 적용하지 않음

- 새 인물·사물·장면은 **현재 세션에 실제 연결된 이미지 생성/편집 도구**(Codex의 imagegen 또는 Claude에 연결된 외부 이미지 생성 MCP 등)로 만들고 기본은 이미지 그대로 배치한다. 도구 이름·입력 스키마·참조 이미지/투명 배경 지원은 실제 도구에서 확인하며 imagegen이라는 이름의 도구가 모든 클라이언트에 있다고 가정하지 않는다. 회화 질감·자연물을 아이콘/기하 부품으로 대체하거나 추적 때문에 원화를 단순화하지 않는다. Photo의 제공/확인 원본 비트맵은 새 작화 화풍·no-statues 검사에서 제외한다.
- 생성 도구가 없으면 사용자가 제공했거나 재사용을 명시한 원화를 실제로 먼저 검토한다. 새 원화가 여전히 필요하면 대상·포즈·시점·식별 특징·아래 화풍 계약·배경 조건을 담은 생성 프롬프트와 **비최종 벡터 조판**을 준비하고 필요한 원화를 요청한다. 프롬프트는 응답 본문에 제공하며 별도 납품 파일을 추가하지 않는다. 받은 원화는 직접 열어 검수하고 포함 이미지로 배치하며 문자·말풍선·도형은 독립 편집 요소로 유지한다. 도구 부재를 손그린 코드 도형·임시 얼굴·과거 예시로 대체하지 않고 원본 Photo도 생성 대체하지 않는다. 원화/검수가 미충족인 조판은 완료로 보고하지 않는다. 이 규칙은 Codex·Claude 모두에 적용한다.
- 이름이 지정된 실제 인물·구체적 유물/사물은 생성 전에 인터넷 참조 이미지를 검색하고 실제 이미지 및 원문 명칭·설명을 확인한다. 박물관/소장 기관/공공 아카이브 우선; 얼굴·복식/주요 부위·비례·문양 특징을 추출하고 변형들을 섞지 않는다. 일반 사상가/학생/꽃병에 특정 이름을 붙이지 않는다.
- 확인 이미지를 참조 입력으로 전달하거나 지원되지 않으면 확인 특징을 문장으로 전달한다. 외형은 식별 가능하게, 화풍은 아래 계약으로 새로 그린다. 사람의 조각상 참조는 얼굴·복식 근거일 뿐 재질/받침대는 재현하지 않는다. **유물 자체가 조각품인 요청**에는 그 대상의 형태·재질을 보존한다. 참조 URL·대상·반영 특징은 작업 기록에, 그림 안에는 임의 출처를 넣지 않는다. 검색/열람 실패는 확인 완료로 보고하지 않는다.
- 편집할 **로컬 이미지 경로는 먼저 실제로 열어 보고** 선택한 도구가 지원하는 참조 입력으로 전달한다. Codex imagegen에서는 로컬 참조 경로를 사용하고, 로컬 경로 없는 대화 이미지는 필요한 최소 최근 이미지 수를 사용하며 두 방식은 혼용하지 않는다. 외부 도구에 imagegen 전용 인자를 추측해 보내지 않는다. 필요한 이미지 누락 시 다시 첨부를 요청한다. 배경 제거/내용 수정은 이미지 편집 도구를 사용하고 코드 픽셀 편집으로 대체하지 않는다. 참조 이미지가 전혀 없는 신규 생성에만 편집 참조 인자를 붙이지 않는다. 지명 인물·유물의 확인된 이미지 참조 입력은 위 참조 검색 절차대로 허용한다.
- 대상·행동·시점·절단 범위·가용 영역을 구체화하고 원화에 문자·수치·말풍선·범례·조판 틀을 굽지 않는다. 다음 **원문 인물 블록은 작은 인물/대화/발표/관계도/얼굴·흉상 매 호출에 그대로** 전달한다. ‘KICE’ 한마디나 ‘이전과 같은 화풍’으로 대체하지 않는다. 자유 장면에는 아래 자유 원화 계약을 사용하며 풍경에 투명 인물 단품 계약을 강제하지 않는다. 사용자 명시 화풍은 우선한다.

```text
STYLE CONTRACT: Draw a living human character as a clean Korean examination textbook cartoon ink illustration. Use natural human anatomy and restrained, readable facial features. Use crisp black contours, lighter and fewer interior lines, opaque white skin, and broad flat gray areas in the hair and clothing. Group hair and beard into a few clear masses with sparse directional lines. Use only a few small flat shadow shapes; keep the face predominantly white. Keep large shapes readable at the final small printed size. The rendering is flat illustrated line art, not a depiction of a sculpted object.
EXCLUDE: statues, sculptural busts, marble, plaster, stone surfaces, pedestals, carved facial planes, charcoal, graphite or pencil texture, etching, engraving, hatching, cross-hatching, stippled shading, dense individual hair strands, photographic skin, 3D rendering, dramatic lighting, continuous tonal modeling, diffuse gray halos, oversized anime eyes, emoji or geometric placeholder faces. Do not introduce these styles through historical subject references.
ASSET: Isolate the character on a transparent exterior background, with opaque white skin and any white clothing areas. Keep the requested head and body extent complete with minimal transparent outer padding. No lettering, name labels, speech bubbles, frames, or scenery. Include only props explicitly required by the request.
```

**자유 원화의 공통 화풍 계약:** 검정·흰색·회색만, 또렷하되 과하지 않은 외곽과 더 가는 내부선, 제한된 회색 명암, 자연스러운 구조·원근·관절·겹침. 사진 피부·광택 3D·과도한 효과·이모지·기하 임시 얼굴·미세 획의 덩어리로 대체하지 않는다. 이 내용을 매 생성 프롬프트에 명시하고 타입의 대상별 델타를 더한다. 풍경/회화는 연한·끊긴 윤곽과 질감을 허용하며 별도 벡터 윤곽은 공통 검정 규칙을 따른다. 새 사진 질감 사물 요청에는 형태·재질이 회색 표면 결로 읽히게 하되 원본 재현은 요청 자료의 명암·질감을 유지하고 임의 그림자·필터를 더하지 않는다.

자유 원화에는 다음 고정 블록도 매 호출 그대로 넣고 대상별 특징을 더한다(독립 작은 인물에는 위 인물 계약 사용). 조각품 자체/명시 원본 재현/사용자 지정 화풍은 해당 예외를 명시한다.
```text
STYLE CONTRACT: Draw a clean grayscale Korean examination textbook illustration of the requested subject and action. Use black, white, and gray only, crisp but not excessively heavy outer contours, finer and fewer interior lines, and restrained gray shading. Preserve natural structure, perspective, anatomy, joints, and meaningful overlaps. Keep the subject's identifying features readable at the final printed size. Do not replace organic subjects with emoji, icons, geometric placeholders, or dense decorative linework. Preserve scene-essential backgrounds and textures where needed. Do not bake lettering, numbers, speech bubbles, legends, or layout frames into the artwork; these will be added as separate editable vectors.
```


- 인물 단품은 투명 **바깥** 배경 PNG 우선, 흰 피부/흰옷은 불투명. 기존 흰 배경 원화는 불필요하게 재생성하지 않고 여백·배치로 간섭을 피한다. 자유 장면의 물·실내·화면 배경은 남길 수 있다. 독립 이동 대상/소품만 분리한다.
- 실제 보이는 머리/몸 경계로 배율을 정하고 비례를 유지한다. 투명 여백/모자/소품 포함 전체 높이로 얼굴을 맞추지 않는다. 이미지 내부 눈·코까지 경로 분해할 의무는 없다. 해상도는 `사용 픽셀수/(배치 mm/25.4)` ppi; **300ppi 이상** 시작, 가는 선·확대는 **600ppi** 우선 검토. 단순 픽셀 확대는 세부 복원이 아니다.
- 확대도는 같은 원화의 해당 부위와 방향을 사용하고 확대 해상도 확인; 잔상은 같은 물체를 위치·회전·농담만 바꿔 반복한다. 중요한 얼굴·손·꼬리·동작 범위를 자르지 않는다.

### 인물 공통 승인과 범위

확대와 예정 인쇄 크기 모두에서 흰 얼굴/회색 머리·의복의 큰 면, 식별 가능한 눈·코·입, 자연스러운 두개부·턱·귀·목·어깨를 확인한다. 옆얼굴은 이마→코→입→턱 연결과 한 눈, 3/4의 먼 눈은 좁게; 코만 붙인 정면 두 눈은 불합격. 머리/수염은 몇 큰 흐름 면이며 헬멧 이중 테두리·무수한 가는 털선·목탄/빗금/석재·연속 입체 명암을 피한다. 흉상은 옷깃·어깨 경사·큰 주름으로 이어지고 삼각 몸통/완벽 좌우 복제는 피한다. 표정은 절제하고 입장에 성별·나이·외모를 임의 연결하지 않는다. 반복 화자는 동일 원화를 재사용하고 서로 다른 화자에 같은 얼굴을 복제하지 않는다.

작은 인터뷰/화상 참가자는 기본 목·어깨~가슴의 흉상; ‘얼굴만/몸 제외’ 또는 독립 얼굴이면 머리카락 위~턱·귀만(미지정 머리 폭 **10–15mm** 출발). 가로대화 흉상은 정수리~턱=1일 때 전체 높이 **1.5–1.9**, 어깨 폭/머리 폭 **1.6–2.0** 출발이며 손짓/전신 장면에는 강제하지 않는다. 발표자는 예약된 말풍선/화면과 남은 폭을 먼저 확정하고 그 영역에 맞는 자세·신체 범위로 생성한다. 작은 흉상 확대/인체 늘이기로 높이를 맞추지 않는다. 시선은 상대/발언 공간으로; 원화 반전 시 이름·발언은 반전하지 않는다.

승인 전 최종 조판에 채택하지 않는다. 위반은 같은 계약으로 수정 생성하고 아래 공통 재검수·중단 원칙을 따른다. 실제 프롬프트·원화 경로·승인 근거는 그림 밖 기록에 남긴다.

### 조건부 벡터화

원화까지 순수 벡터 요구 또는 내부 경로 수정 필요일 때만 추적한다. `vectora_trace_image`의 실제 스키마로 회색 면을 추적하고 자동 맞춤 배율을 확인한다. 이미 이용 가능한 로컬 canvas/imagetracerjs 경로도 가능하나 새 앱 개발/외부 서비스 설치로 범위를 넓히지 않는다. 소수 회색 면은 그래프의 6색 규칙과 다르다. 의미 있는 눈·손·가느다란 구조를 원화와 벡터 렌더로 대조하고 잡음 경로·번짐·누락을 교정한다. 대상별 그룹·반복 자산 재사용, 그림만 비례 배치, 바깥 흰 면의 꼬리 가림을 확인한다. 순수 벡터 요구 결과에서만 이미지 참조가 없어야 하며 혼합 결과는 순수 벡터라고 보고하지 않는다.

## 말풍선이 있는 모든 유형의 공통 구조

Dialogue와 activity 속 교사 발화 등 **말풍선이 실제 있는 경우만** 적용한다. 흰 둥근 몸통+날렵한 **비대칭 곡선** 꼬리, 0.3pt 검정 외곽. 글 영역 밖에 모서리·꼬리를 더하며 내부 여백 **1.5–2.5mm** 출발. 꼬리는 긴 완만 곡선과 짧고 깊은 곡선이 중앙에서 비켜난 한 뾰족 끝으로 모이고 두 접점에서 몸통과 자연스럽게 이어진 하나의 닫힌 윤곽이다. 밑변선·겹친 삼각형·이중 획·틈·대칭 V/물방울·화살촉 금지. 옆/아래 방향·전체 좌우 반전은 가능하나 두 곡선의 비대칭을 유지한다.

**사람 얼굴은 반드시 전체 그림의 왼쪽 또는 오른쪽 끝에 붙인다.** 인물보다 가쪽에 둘 수 있는 유일한 예외는 그 사람의 이름이다. 그 경우 이름의 실제 글 획이 해당 좌우 끝에 붙고 얼굴은 공통 이름↔인물 간격만 두어 바로 안쪽에 온다. 이름이 없거나 아래/안쪽에 있으면 얼굴 자체가 끝에 붙어야 한다. 얼굴/머리의 실제 보이는 바깥 윤곽과 이름의 글 획을 기준으로 맞추며 이미지 사각형·흰색/투명 패딩·글상자 사각형을 끝에 맞춘 것으로 대신하지 않는다. 인물 또는 바깥 이름보다 가쪽에 큰 흰 여백이나 빈 세로 띠를 남기지 않는다. 말풍선 아래 중앙이나 각 열의 가운데에 인물을 놓지 않으며 여러 인물이면 좌우 끝을 유지하도록 행을 나눈다. 외피 장식·소품·대지 맞춤으로 큰 가쪽 여백을 정당화하거나 얼굴을 잘라서 맞추지 않는다. 제작 전 폭 예약, 원화 배치, 생성기 재조판, 최종 JPEG에서 이 조건을 확인한다.

108mm 폭에서 돌출 **1.5–3mm**, 접점 밑변 폭 **2–3.5mm**, 꼬리 끝↔자기 화자 머리의 실제 빈틈 **1–2mm** 출발. 가로 배치는 끝 높이↔정수리 세로, 옆 꼬리는 머리 윤곽과 가로 거리로 잰다. 옆 이름 글 획↔같은 높이 인물 윤곽 **0.8–1.5mm**, 아래 이름↔인물 하단도 **0.8–1.5mm** 출발. 이미지 사각/투명 여백은 제외한다. 멀리 떨어진 화자까지 꼬리를 늘이거나 몸통 확대와 함께 꼬리를 확대하지 않는다. 끝은 자기 얼굴/입을 향하고 닿지 않는다. 예약→승인 원화의 실제 경계 재계산→최종 합성에서 형태와 간격을 각각 검사하고 실제 mm를 기록한다. 흰 이미지 배경이 끝을 가리면 배치/바깥 면부터 고친다. 이름은 받은 것만 별도 문자, 반복 위치는 일관되게 유지한다. 생성기 기본 대칭 꼬리는 직접 경로 수정한다.

## 실제 자료를 조사·시각화할 때만

- 실제 수치/기간/지역/위치/특정 시점 분포를 요청하면 제공 표·URL을 직접 확인하고 없으면 생산 기관 원표/API/파일·공식 통계·국제기구 우선 검색한다. 검색 요약/재인용만으로 확정하지 않는다. 일반 원화·가상 예시·정성 함수·가상 지도에 자동 적용하지 않는다.
- 지역·기간 누락 없이 정의·단위·분모·연간/연말·포함 제외·경계 시점·잠정/추정/확정을 맞춘다. 개정은 공식 재작성 계열 우선, 이어 붙일 수 없으면 단절 표시. 결측은 0/보간으로 만들지 않는다. 찾지 못한 값은 발명하지 않고 확인 범위와 누락을 밝힌다.
- 사용자 미지정일 때만 단위 환산·일관 반올림·값 라벨 생략을 허용한다. 순위 역전/차이 소실/0 오해/추세 왜곡이면 정밀도를 늘리거나 숫자 라벨만 생략한다. 축·단위·기준 연도·필요 눈금·범례와 **모든 관측값/자료점**은 보존한다. 연도 축 글자만 성기게 하고 실제 점을 삭제하지 않는다. 구성비를 몰래 정규화하지 않는다.
- 원자료 좌표 유지/라벨만 반올림은 **exact**; 반올림 좌표를 사용하면 도형과 라벨에 같은 값, 근사 고지와 **approximate**. 원자료·입력·표시값·변환·정밀도·표/행·확인일은 작업 기록에 구분한다.
- 지도는 실제 위치를 확인하여 승인 바탕의 투영/등록에 맞게 환산; 파일 x/y를 위경도로 보지 않는다. 국가 경로에 소지역 통계를 붙이거나 가짜 경계/경계 시점 왜곡을 만들지 않는다. 비율·밀도는 경계값/범례/결측을 가진 소수 채움 단계, 총량은 기호 **면적** 비례를 검토한다. 위치 확인과 통계 검증은 별개다.
- 최종 설명에 **기관·표/데이터셋·기준 연도·단위·가공 요약·직접 출처 URL**을 밝힌다. 그림 안은 필요할 때 짧은 `자료: 기관(연도), 일부 반올림`으로; 긴 URL로 가리지 않는다. 출처 파일을 추가 납품하지 않는다.

<!-- VECTORA_CLIENT_BOUNDARY -->

### Claude 로컬 실행 경계

Claude에서 현재 노출된 MCP 도구 목록으로 Vectora 연결·실제 도구 이름·입력 스키마를 확인한다. 플러그인 접두사가 붙을 수 있다. 로컬 MCP는 Claude Code와 Claude Desktop Cowork 로컬 세션에서 사용하며 일반 웹/클라우드에는 자동 연결되지 않는다. MCP가 없으면 비최종 설계안만 준비하고 로컬 편집·저장·재열기·내보내기를 완료했다고 주장하지 않는다.

Claude 코드 실행 첨부 경로는 로컬 앱·글꼴 경로와 별개일 수 있다. 실제 노출된 vectora_fonts 및 제공되는 vectora_check_font/vectora_measure_text를 사용하고, SVG 문자열/data URL은 가져오기 스키마가 허용할 때만 전달한다. 첨부 경로를 Vectora 저장 경로로 재사용하지 말고 사용자가 지정한 실제 로컬 경로를 사용한다. Claude Code 로컬 플러그인에서는 번들된 보조 스크립트를 사용할 수 있다.

이 패키지는 이미지 생성 모델을 포함하지 않는다. 먼저 현재 세션에 실제 연결된 외부 이미지 생성/편집 MCP 등의 도구를 확인한다. 있으면 이 문서의 화풍 계약·참조 검색·투명 배경 조건을 해당 도구의 실제 스키마에 맞춰 전달한다. 생성 결과는 실제로 열어 대상·화풍·배경을 확인하고 Vectora가 접근 가능한 로컬 파일 또는 지원되는 data URL로 가져온다. 원격 URL이나 Claude 첨부 경로를 로컬 파일 경로로 간주하지 않는다.

생성 도구 부재의 재사용 검토·생성 프롬프트·비최종 조판·미완료 보고는 이 문서의 공통 「새 원화와 참조 검색」의 동일 규칙을 적용한다.

## 최소 Vectora 실행 계약

- 기존 설치 앱을 사용하고 `vectora_status`로 버전·연결과 실제 도구 스키마를 확인한다. 제작을 위해 앱 코드·버전·패키지를 변경하지 않는다. MCP는 앱 UI 미저장 탭과 독립 세션이다. Computer Use/브라우저 DOM/앱 스크립트 주입으로 대체하지 않는다. 생성은 이 문서로 충분하며 use-vectora/서버 옛 guide를 추가 지침으로 읽지 않는다.
- vectora_fonts와 노출된 vectora_check_font로 위 물리 규격의 실제 family/style/weight/supportsText·missingGlyphs·문자 범위별 서식 지원을 확인한다. 스키마에 있는 인자만 전송한다. colorMode가 있으면 기본 cmyk, 사용자 RGB면 rgb. 열기/가져오기에서 MISSING_FONTS면 목록과 설치 폰트를 확인하고 실제 fontReplacements 지원 시 명시 선택 매핑으로 재시도한다. UND 대체에는 사용자 지시가 필요하다.
- `vectora_new_document`(기본 mm) 또는 지정 `vectora_open_document` → production/apply/import → inspect/preview → save/open/export. 실제 응답의 documentId/최신 expectedRevision/개체 ID 사용; 동일 재시도는 동일 requestId, 다른 편집은 새 ID. 일반 배치 1,000개 이하, 실패 시 복원. 일반 명령 add/select/style/transform는 대상 ID를 확인한다.
- 재시도는 **동일 requestId와 동일 전체 인자**로만 한다. 다른 편집/수정한 인자는 새 ID; revision 충돌이면 inspect 후 내용과 최신 revision을 확인한다. 취소는 이미 적용된 편집의 실행 취소가 아니며, 취소·응답 유실·연결 복구 후 inspect로 실제 상태를 확인한다. `REQUEST_RESULT_EXPIRED`는 결과 캐시 만료이지 편집 미실행이 아니다. 새 ID로 같은 편집을 무작정 재실행하지 않는다. 실제 객체·revision·저장 결과로 적용 여부를 판별하고 필요할 때만 새 편집을 구성한다. 되돌리기는 지원되는 vectora_history를 사용하고, 세션 소실 시 미저장 복구를 주장하지 않는다.
- 일반 `units:"mm-pt"`는 위치·크기·경로·대지 mm, 글·획·행간·파선 pt; tracking은 1/1000em. production `*Mm/*Pt`는 다시 환산하지 않는다. inspect 원시 objects는 px, pathNodes/geometry 문서 좌표는 반환 단위를 확인한다. px 경로는 **96px=25.4mm=72pt**, 8pt=10.666666667px, 0.3pt=0.4px. 직접 SVG는 width/height mm, viewBox 해당 px, letter-spacing=-0.64px.
- vectora_measure_text는 라이브 스키마를 확인한 뒤 실제 text,widthMm,fontPt:8,tracking:-60,lineHeight와 지원되는 글꼴 범위 서식을 보낸다. 실제 UND v3.0 혼합 서식의 측정 결과로 frame/ink/baseline을 구분한다. 도구가 범위별 서식을 측정하지 못하면 실제 Editor에서 완성 서식을 재측정한다. 이전 폰트의 측정치나 프레임 높이는 재사용하지 않는다. 프레임 변경은 resizeTextFrame/실제 재조판; transform.width나 전체 Scale로 글자를 늘이지 않는다. 획 하한/자동 import 맞춤/상위 배율로 규격이 바뀌면 실제 속성을 교정한다.
- 새 차트/지원 그래프는 `chartStyle` production, 2·3집합은 `layout:"venn"` production 우선; 해당 계약은 **선택한 유형/잎** 안에 있다. 일부 미지원이면 기본 수치·축·점·관계를 생성하고 그 부분만 실제 ID로 별도 편집 보충. 기본 자료 관계 자체가 미지원/실제 생성 경로 부재일 때만 작업 SVG 전체 제작. 새 spec에 옛 legacy 전용 필드를 혼합하지 않는다. 생성은 `vectora_production({documentId,expectedRevision,requestId,action:"create",spec})`. inspect의 `production.components`에서 실제 component ID·저장 spec·roles 개체 ID·warnings를 읽으며 `includeGeometry:true`의 세계 좌표/외곽을 확인한다. component ID는 자료/계열/노드 ID와 다르다.
- 수정은 `action:"update",id,patch,policy:"preserve"`: 객체 깊은 병합, 배열 전체 교체, 생략 유지, null 선택 필드 삭제. 배열 교체 시 유지할 항목의 안정 ID·값·스타일도 보내며 종류 변경 시 이전 전용 옵션은 지운다. 수동 override를 유지하는 preserve 결과는 spec만으로 보증하지 말고 warnings·렌더를 확인한다. reset은 사용자에게 수동 편집 초기화 권한이 있을 때만; 상위 배치를 지우는 명령으로 해석하지 않는다. 불필요 detach 금지. 보충 개체는 자동 재배치되지 않으므로 자료·폭·높이 변경 뒤 좌표·라벨·연결 대응을 재검수한다. 대지는 component 증가로 자동 확대되지 않는다. 잘못된 내용은 입력을 수정하고 지원·측정 실패를 숨기지 않는다.
- 지도는 실제 프리셋 ID와 제공된 지리 자산으로 시작하며 지원 capability와 실행 경로는 map 부모/선택 잎에 포함한다. 자산 manifest/원자료는 입력 데이터로 확인할 수 있다. 등록되지 않은 바탕에 지리 재투영을 추측하지 않는다.
- 여러 줄 텍스트는 Vectora의 **한 글상자 안에서 개행·자동 줄바꿈**으로 제작한다. SVG의 줄별 `<text>` 생성·그룹화는 금지하며, 단일 `<text>`/`tspan`도 가져온 뒤 실제로 하나의 글상자인지 확인한다. 분리되면 전체 원문·개행·범위 서식을 한 네이티브 글상자로 재구성한다. production 결과도 같은 기준으로 검사하며 줄 수만큼의 글상자나 별도 밑줄 선을 완성본으로 남기지 않는다. SVG pattern/textPath/filter/mask 보존을 가정하지 않고 실제 선·원+clip 등 편집 구조로 구현하되 본문이나 밑줄을 도형으로 대체하지 않는다. 화살촉은 실제 끝, `arrow-3` 등은 현재 스키마 허용값 확인. 단순 자동 audit가 시각 품질·의미를 인증하지 않는다.
- 포함 PNG/JPEG 이미지로 가져오고 임시 경로 의존을 제거한다. vector asset 등록이 래스터를 거부하면 일반 이미지로 배치하며 등록을 위해 추적하지 않는다. 도구 연결 실패면 이용 가능한 실제 Vectora Editor 경로로 검사하되 파일 작성만으로 앱 저장·재열기를 주장하지 않는다. 앱 개발/외부 모델 설치로 범위를 넓히지 않는다.


### 현재 연결의 제작·검사 계약 — 지원 확인 후 사용

- 기존 1.3.0 MCP 연결본도 앱 기능을 보장하지 않는다. MCP·앱 버전 숫자만으로 새 기능을 가정하지 않는다. 라이브 `tools/list`, `resources/list`와 `vectora://capabilities`가 실제 제공되면 이를 확인한다. capabilities의 `productionKinds`, `planningKinds`, `inspection`, `mutationResponseViews`, `deliveryProfiles`와 `vectora://production`의 종류별 인덱스를 사용한다. 필요한 종류만 `vectora://production/<kind>`와 `/schema`에서 확인한다. 그래프 `styleProfile`/`chartOptions`, 지도 `styleProfile`/DEM/지물 요청, `textRange.values.doubleUnderline`, `artboard.fitContentWidth`, inspect의 `delivery` view는 해당 live input schema에 있을 때만 사용한다. 이들은 실행 계약이며 네 번째 제작 지침이 아니다. 필드나 view가 없으면 추측 호출하지 않고 기존 편집·검수 경로를 쓴다.
- `vectora_production_plan({spec,documentId?})`가 있으면 text/table/composition/dialogue를 읽기 전용으로 측정한다. 실제로 문서 자산을 사용하는 계획만 documentId를 명시한다. dialogue plan이 documentId를 받는다고 자산을 측정·승인했다고 주장하지 않는다. 계획은 제작·저장·눈으로 본 검수 완료가 아니다. 편집은 현재 revision과 고유 requestId를 사용하며, production의 `responseView:"compact"`는 실제 지원 때만 지정한다.
- 평소 `vectora_inspect({documentId,view:"summary"})`로 문서·치수·개수와 자산 요약을 확인하고, 편집 대상은 `view:"component",componentIds:[실제 ID]` 또는 objectIds로 좁힌다. summary는 원시 개체·전체 spec·포함 원화 데이터가 아니다. 전체 비교·재열기는 `view:"full"`을 사용하고 래스터 무결성 검사가 필요하면 실제 지원 `rasterIntegrity:true`를 명시한다. full 자체가 래스터 검증을 보증하지 않는다. 추가 옵션을 생략한 inspect는 기존 응답을 유지한다.
- `sinceRevision`은 같은 문서의 실제 검사 기준과 `sinceDocumentId`를 함께 사용한다. `delta.status:"delta"`의 changedIds/removedIds와 stateChanged를 읽는다. `fullRequired:true` 또는 `reset-required`면 전체 검사를 다시 수행하고 기준을 갱신한다. 다른 문서/연결의 캐시를 재사용하거나 변경 없음으로 해석하지 않는다. 변경 기록은 scoped/view 검사 이후 32 revision·4MiB 범위로 제한된다.
- 승인 PNG/JPEG를 등록할 때 실제 지원되는 asset.rasterPath 절대 경로를 우선 사용한다. 앱 머신에서 읽고 포함하므로 base64를 검사 응답/대화에 왕복시키지 않는다. reviewed:true와 실제 headBounds/crop/facing 승인은 직접 시각 검수이며 파일 읽기 성공으로 대체하지 않는다. 없는 계약은 추측하지 않고 기존 포함 이미지 경로를 쓴다.
- 복합형은 `kind:"composition",layout:"row"|"column"|"grid",widthMm,gapMm,maxHeightMm?,columns?,children`의 지원을 확인한다. 각 child는 안정된 고유 id와 `spec` 또는 `reserve` 하나이며 선택 widthMm를 가진다. grid에서만 columns를 쓴다. children은 최대32개, 중첩은 깊이6/총128개 한도다. 안정 ID와 수동 수정 보존을 확인한다. 내부 의미 단위는 각각 편집 가능한 컴포넌트로 유지하고 무조건 한 SVG로 평탄화하지 않는다. 무지원이면 기존 개체·그룹으로 같은 조판을 구성한다.
- 내용 예약은 `{widthMm?,heightMm}` 또는 `{widthMm?,lines,text?,lineHeight?}` 중 하나다. heightMm와 lines를 함께 보내지 않는다. 줄 수는 실제 UND v3.0 8pt/-60 측정 결과와 일치해야 한다. 임시 측정 문구는 그림에 표시하지 않는다. 현재 newspaper/scroll/browser text 프레임의 blocks에서만 `{type:"reserve",id,reserve}` 또는 `{type:"component",id,spec}`를 지원 확인 후 쓴다. noticeboard blocks의 지원으로 확대하지 않는다. 예약은 조판 공간이며 실제 원문/빈칸 의미를 대체하지 않는다.

### 진행 상태·체크포인트·진단 미리보기 — 지원 연결본만

- 앱 버전 숫자만으로 지원을 가정하지 않는다. `vectora_status`와 현재 `tools/list`의 실제 도구·입력/응답 계약을 확인한다. 아래 도구/필드가 없으면 보내지 않으며 기존 inspect/preview/save 경로를 사용한다. 새 기능이 없는 설치본에서도 기존 검수·미완료 보고 조건은 유지한다.
- `vectora_operation_status({operationId?})`가 있으면 장기 호출의 실제 operationId와 `queued/running/completed/failed/cancelled`, elapsedMs, errorCode 및 connectionId/sessionId를 확인한다. 상태 조회는 편집 재실행이나 실행 취소가 아니다. `completed`는 작업 메타데이터이며 최종 그림 검수 합격이나 응답 본문 복구를 보증하지 않는다. 기록이 없거나 세션이 다르면 원래 문서/결과가 남았다고 가정하지 않는다.
- 클라이언트가 MCP progressToken을 지원하면 프로토콜의 `_meta.progressToken`으로 진행 통지를 받을 수 있다. 실제 단계 전환만 보고하며 카운터를 완료율/예상 시간으로 해석하지 않는다. 통지가 없다고 실패 또는 미실행으로 단정하지 않는다. 취소·응답 유실 뒤에는 inspect/체크포인트 상태를 확인한다.
- `vectora_checkpoint({documentId,path,overwrite?})`가 있으면 접근 가능한 절대 `.vectora` 경로의 **내부 임시 영역**에 중간 문서를 보존한다. 기존 사용자 파일은 임의로 덮어쓰지 않는다. 최초 성공은 이 연결의 해당 문서에 `autoRefresh:true`를 설정하여 이후 적용/production/history/가져오기/추적 편집 성공마다 같은 지정 경로를 갱신한다. 자동 갱신 대상은 내부 체크포인트로 한정한다. 응답의 `checkpoint.saved/path/revision`을 확인하며 `saved:false/error/warnings`이면 편집 성공과 보존 실패를 구별한다. 편집은 이미 반영되므로 저장 실패를 이유로 재실행하지 않는다. 실패한 최초 저장은 자동 갱신을 설정하지 않는다. 성공 응답의 경로·revision·세션 정보를 확인하고 체크포인트를 최종 납품/검수 완료로 취급하지 않는다. 도구가 없으면 vectora_save의 기존 계약으로 중간 원본을 저장한다.
- `vectora_restore_checkpoint({path})`는 체크포인트를 **새 독립 문서**로 연다. 응답의 새 documentId/revision과 restoredFrom을 확인하고 다시 inspect한다. 이전 세션의 ID/revision·작업 캐시는 재사용하지 않는다. 복구는 원 경로 자동 갱신을 설정하지 않으며 새 문서에 checkpoint를 다시 호출해야 설정된다. 포함 이미지·글꼴·자료 대응을 재검수하고 체크포인트 이후 편집을 복구했다고 주장하지 않는다. 이 도구가 없으면 실제 저장 파일을 vectora_open_document로 연다.
- 미리보기 응답이 `warnings`, `deliveryReady`, artboardId, widthMm/heightMm를 제공하면 경고와 실제 치수를 읽는다. `deliveryReady:false`인 이미지도 결함을 확인하는 **진단 미리보기**로 직접 볼 수 있으나 납품 가능한 완성본으로 보고하지 않는다. KICE package의 기술 `success`와 `technicalChecks`가 통과해도 `deliveryReady:false` 또는 `visualReview.status:"pending"`이면 직접 JPEG 검수가 남아 있다. `audit.status:"review-required"`와 `audit.humanReview`/`visualReview.auditFindings`는 사람이 확인할 항목이다. 미리보기의 렌더 성공/치수는 내용·글꼴·실외곽 검수와 최종 내보내기 성공을 대신하지 않는다. 오류와 경고를 수정한 뒤 저장·재열기·실제 결과 이미지 검수를 완료한다.

## 래스터 출력 색상

- 평가원 그림의 기본 납품은 편집 가능한 .vectora 원본과 4배 .jpeg이며, JPEG/PNG 래스터는 기본 회색조로 내보낸다. 사용자가 컬러를 명시하면 컬러를 우선한다. rasterColorMode는 PNG/JPEG에만 전달하고 SVG/PDF/WebP에는 보내지 않는다(거부됨). 기존 legacy vectora_export_package의 래스터 옵션은 PNG에 적용하며, 지원되는 profile:"kice"에서는 JPEG에 적용한다.
- 색상 변환은 내보내기 단계에서만 한다. 편집 원본의 채움·선·이미지 색상을 바꾸어 회색으로 만들지 않는다. vectora_preview와 SVG/PDF/WebP 미리보기는 원래 색을 유지한다. PDF colorMode RGB/CMYK는 별도 설정이다.
- 호출 전에 라이브 tools/list 스키마를 확인한다. vectora_export 또는 vectora_export_package에 rasterColorMode가 없으면 추측해 보내거나 다른 앱/변환기로 회색조를 흉내 내지 않는다. 앱 1.2.0 이상으로 업데이트하고 MCP를 다시 연결한 뒤 사용한다.

## 저장·재열기·납품

- 완성 그림마다 기본 **같은 본체의 .vectora 한 개 + .jpeg 한 개**, 복합형도 한 쌍. 다른 형식/추가 파일은 명시 요청 때만. SVG/원본 PNG/기록/검수 이미지는 내부 임시 영역, 폰트 파일은 포함하지 않는다. 기존 파일을 두 개로 맞추려고 삭제하지 않는다.
- 이름과 폴더는 각각 사용자 지정 우선(번호·공백·대소문자 유지); 확장자를 분리해 동일 본체, 한쪽만 final/preview 접미사 금지. `.jpg` 명시 시 그 확장자. 미지정 폴더는 **현재 작업 공간 바로 안**(날짜/output 폴더 임의 생성 금지), 상대 경로는 작업 공간 기준. 자동 이름 충돌은 양쪽에 같은 번호; 지정 이름의 불명확한 교체는 확인한다. 무관한 기존 파일은 덮어쓰지 않는다.

1. **1차 완성본을 반드시 이미지로 직접 보고**, 최종 사용 크기와 확대에서 원문·글리프·단위·자료 대응, 글/선 규격·편집성, 명백히 어색한 겹침·잘림·너무 큰 틈·불필요 여백·원화 화풍·꼬리/인출선의 실제 대상을 확인한다. 말풍선 그림은 얼굴 또는 그 바깥 이름이 좌우 끝에 붙고 가쪽에 큰 흰 여백이 없는지 확인한다. 별도로 실제 개체 ID와 문자 서식을 검사해 텍스트 덩어리당 글상자 하나, 같은 글상자의 단일/이중 밑줄 서식, 줄별 분리 글상자·별도 밑줄 선 없음도 확인한다. 저장·재열기 뒤에도 이 편집 구조가 유지되어야 한다. 수치 audit나 렌더 성공만으로 통과시키지 않는다. 의도된 본문 빈칸·원화 내부 장면 공간은 외부 대지 여백과 구별한다.
2. 명백한 결함은 배치 수정 또는 필요한 원화 재생성 후 **같은 완성본 전체를 다시 이미지로 검수**한다. 단회 생성으로 종료하지 않는다. 수정 라운드·결과를 기록하고 기본 최대 3회 수정, 개선 정체·도구 한계·미충족이 남으면 중단하여 정직하게 보고한다. 축소·흐림·클리핑·진단 면제로 결함을 숨기지 않는다.
3. **지원되는 KICE 최종 출력 프로필을 우선 사용한다.** 현재 capabilities.deliveryProfiles와 도구 스키마에 kice가 있고 사용자가 지정한 파일명·확장자·형식을 정확히 지원하면 `vectora_export_package({profile:"kice",documentId,directory,baseName,artboardId?,rasterScale:4,rasterColorMode:"grayscale",overwrite:false})`로 같은 본체 .vectora와 .jpeg 한 쌍만 저장한다. 사용자 배율/컬러/교체 지시가 우선이다. directory는 접근 가능한 기존 절대 폴더, baseName은 경로 구분자 없는 파일 본체다. includePdf:true는 거부된다. 이 프로필은 원본 작업 문서를 유지하고 별도 준비 복사본에서 responsive fitToArtboard 바인딩을 현재 해결된 폭에 고정한다. 내부 문자·도형·컴포넌트의 편집 구조는 유지한다. 실제 표시 획/alpha 외곽을 측정하여 외곽 맞춤→원본 저장→실제 파일 독립 재열기·비교→같은 재열기 상태 JPEG를 처리하므로 기존 save/open/export를 중복 호출하지 않는다. 그전에 1–2항의 이미지 직접 검수는 필요하다. sourceDocumentId/sourceRevision, preparation.bindingsFrozen/closeStatus와 fit.status·실제 치수를 읽고 unavailable/실외곽 불일치를 성공으로 쓰지 않는다. files의 written/failed/not-run·실제 경로·오류를 확인하며 일부 원본 저장을 두 파일 완성으로 보고하지 않는다. success/technicalChecks는 기술 검사이고 deliveryReady:false와 visualReview.status:"pending"은 직접 이미지 검수 전 상태다. **저장된 실제 JPEG를 직접 열어** 최종 크기/확대에서 원문·값·대응·글/선·원화·외곽·저장본 일치를 검수한 뒤만 완료로 보고한다. 결함 수정은 같은 문서에서 2항을 적용하고 이 프로필을 다시 실행해 두 파일을 같은 최종 상태로 맞춘다. 기본 납품에 추가 파일을 만드는 legacy export_package는 쓰지 않는다.
4. **KICE 프로필이 없거나 사용자 지정 파일명·형식을 정확히 지원하지 않으면 검증된 수동 경로를 쓴다.** profile:kice는 .jpeg를 만들므로 사용자가 .jpg를 명시하면 임의로 바꾸지 않고 아래 save→재열기→JPEG export를 .jpg 경로로 실행한다. 다른 명시 형식도 실제 지원 export 계약으로 실행하며 원본과 출력은 같은 파일 본체를 유지한다. 사용자 지시가 프로필 선호보다 우선이다. 라이브 command schema에 `artboard`의 `fitContentWidth`가 있으면 실제 납품 개체를 선택하고 `values.width`를 `mm-pt`에서는 mm로 지정한다. 이 동작은 보이는 내용 폭을 요청 폭에 맞춘 뒤 물리 글자·획을 유지하며 표시된 잉크/클립/그림자 외곽에 맞춘다. 명령 응답의 성공 여부와 대지 치수·미리보기를 확인한다. KICE 패키지 보고서의 `fit.status`와 실측 치수는 별도로 확인한다. 없으면 `fitSelection`을 써 대지를 보이는 렌더 외곽에 맞추고 텍스트 프레임·보이는 잉크 외곽을 미리보기에서 대조한다. `fitSelection`은 내용물 폭을 바꾸지 않는다. selectAll은 잠금·타 대지 누락/혼입을 확인한다. 과잉 여백·누락은 지원되는 artboard update의 x/y/width/height로 바로잡고 연결 컴포넌트 재조판 후 이미지로 확인한다. `vectora_save({documentId,path,format:"vectora"})`→실제 파일 존재 확인→`vectora_open_document` 재열기와 문자·도형·그룹·포함 이미지·치수 보존 검사→최종 외곽 재확인→`vectora_export({documentId,path,format:"jpeg",scale:4,transparent:false,rasterColorMode:"grayscale"})` 순서다. 사용자 배율/컬러/명시 대지 지시가 우선이며 라이브 지원 옵션만 보낸다. 실제 JPEG 직접 열람으로 1–2항을 재검수하고 수정 시 저장·재열기·JPEG를 반복한다. 파일 작성·확장자 변경·별도 PNG 변환을 Vectora 저장/내보내기로 주장하지 않는다.
5. 그 JPEG 자체를 `![그림 설명](<절대 JPEG 경로>)`로 표시하고 `.vectora` 파일 링크 제공. 경로·저장/재열기/내보내기 상태·혼합 원화 여부를 사실대로 보고한다. 기능 실패는 미완료를 밝히며 두 파일 완성으로 주장하지 않는다.
