# 인물이 포함될 때 선택하는 구성요소

인물이 실제 포함될 때 이 구성요소를 task instructions에 포함한다. 배치와 말풍선 수치는 실제 작업에 선택된 recipe·component 지침을 적용한다. 인물 없는 그림에는 선택하지 않는다.

## 적용 범위

- 새 작은 인물·대화·발표·관계도·독립 얼굴/흉상에는 신규 생성에는 아래 고정 블록을 넣는다. 국소 수정에는 기존 화풍·정체성 보존과 변경 범위를 우선하고 필요한 계약만 전달한다. ‘KICE’ 한마디로 줄이지 않는다. 생성·참조 검색·자산 실행 규칙은 task instructions에 함께 선택된다.
- 새 자유 장면 속 인물은 그 장면의 자유 원화 계약을 사용한다. 이 파일의 정체성·해부·승인 원칙은 유지하되 단품 투명 배경·흉상 비율·가장자리 배치를 자유 장면에 강제하지 않는다.
- **원본 인물 사진·기존 작품**에는 새 작화 계약을 적용하지 않는다. 실제 원본의 얼굴·복식·질감을 보존하고 task instructions에 선택된 사진 보존 규칙을 따른다.

<!-- when-module:artwork -->
```text
STYLE CONTRACT: Draw a living human character as a restrained editorial ink illustration for a printed senior-secondary examination. Use naturalistic proportions and restrained facial features: age-appropriate eyes and irises, unobtrusive lashes, and a readable nose bridge and natural jaw; preserve the subject’s distinguishing features. For adolescents and older teenagers, use proportionate near-adult faces; explicit children retain age-appropriate anatomy. Use crisp black contours, lighter and fewer interior lines, opaque white skin, and broad flat light-to-middle gray areas in the hair and clothing; reserve black for contours, pupils, and small local accents. Aim for large white areas, light gray around #D6D6D6 and middle gray around #AAAAAA, with darker gray only in small accents. These are visual tonal targets, not a pixel conversion. Judge the whole drawing at its intended print size as a restrained, natural, age-appropriate examination illustration. Group hair and beard into a few clear flat masses with sparse directional lines and no glossy highlight bands. Use only a few small, clearly bounded flat shadow shapes; keep the face predominantly white. Keep large shapes readable at the final small printed size. The rendering is flat illustrated line art, not a depiction of a sculpted object. Every gray area is one flat tone with a hard edge: no gradients, soft airbrushed shading, blush, or glossy hair sheen anywhere, including the face and hair.
EXCLUDE: statues, sculptural busts, marble, plaster, stone surfaces, pedestals, carved facial planes, charcoal, graphite or pencil texture, etching, engraving, hatching, cross-hatching, stippled shading, dense individual hair strands, photographic skin, 3D rendering, dramatic lighting, continuous tonal modeling, diffuse gray halos, exaggerated genre facial rendering (e.g., manga/webtoon/chibi proportions), obviously exaggerated glossy eyes, unreadable solid-black hair masses, emoji or geometric placeholder faces. Do not introduce these styles through historical subject references.
ASSET: Isolate the character on a transparent exterior background, with opaque white skin and any white clothing areas. Keep the requested head and body extent complete with minimal transparent outer padding. No lettering, name labels, speech bubbles, frames, or scenery. Include only props explicitly required by the request.
```
<!-- /when-module -->

<!-- when-module:artwork -->
### 새로 그린 인물의 승인과 범위

칠판·화면 옆 인물은 **정수리·손끝·화면 하단의 목표 위치**를 먼저 정한다. 목표보다 몸 아래쪽이 약간 더 이어지는 원화(필요하면 허리 아래~허벅지)를 생성하고, 머리 크기와 손의 접점을 맞춘 뒤 네이티브 클리핑으로 하단을 화면 아래와 자연스럽게 맞출 수 있다. 하단 여유는 크롭용이며 남겨 둘 빈 공간이 아니다. 짧은 흉상을 확대해 얼굴·가로 폭까지 커지게 하거나 세로만 늘이지 않는다. 목·머리·손을 자르거나 무릎 등 관절을 어색하게 절단해야만 맞는 원화는 자세·신체 범위를 바꿔 다시 생성한다. 인물 바닥이 판보다 먼저 끝나 그 아래에 큰 빈 열이 남는지 최종 조판에서 확인한다.

서로 다른 화자는 **인쇄 크기에서 언뜻 보아도 구분**되어야 한다. 같은 화풍·비슷한 머리 크기를 유지하면서 머리 외곽·앞머리·안경·얼굴 윤곽·복식 등 식별 특징을 생성 전에 나눠 정한다. 동일 얼굴을 좌우 반전하거나 가르마·표정만 조금 바꾸는 것으로 여러 사람을 만들지 않는다. 이름을 가리고 전체 세트를 보아도 화자가 구별되는지 확인한다. 특정 입장에 성별·외모를 연결하지 않는다.

**원·사각형 등 초상 테두리가 있는 경우에는 원화를 적당히 확대해 프레임을 채우고 그 도형을 기준으로 클리핑한다.** 흉상 외곽 전체를 빈 테두리 안에 작게 넣거나 어깨 절단면을 프레임 안에 띄우지 않는다. 얼굴·머리카락의 식별에 필요한 부분은 보존하고, 옆 어깨·가슴이 프레임 경계에서 자연스럽게 잘리도록 위치를 고른다. 원화의 종횡비는 유지한다. 원본 래스터·클리핑 마스크·테두리는 편집 가능한 관계로 남기고, 지도 등에 겹치는 초상은 프레임 안에 흰 바탕을 두어 뒤의 선이 비치지 않게 한다. 프레임 없는 일반 흉상에는 이 자르기를 강제하지 않는다.

**이 절의 화풍·생성·수정 생성 검사는 새로 그린 인물과 그 작화 자산의 재사용에만 적용한다. 실제 인물 사진·기존 작품에는 적용하지 않는다.** 원본 인물은 확인된 출처와의 얼굴·복식·질감·절단 범위 일치, 해상도와 배치를 검수하며 새 화풍으로 다시 생성하지 않는다.

확대와 예정 인쇄 크기 모두에서 흰 얼굴/회색 머리·의복의 큰 면, 식별 가능한 눈·코·입, 자연스러운 두개부·턱·귀·목·어깨를 확인한다. 옆얼굴은 이마→코→입→턱 연결과 한 눈, 3/4의 먼 눈은 좁게; 코만 붙인 정면 두 눈은 불합격. 머리/수염은 몇 큰 흐름 면이며 헬멧 이중 테두리·무수한 가는 털선·목탄/빗금/석재·연속 입체 명암을 피한다. 흉상은 옷깃·어깨 경사·큰 주름으로 이어지고 삼각 몸통/완벽 좌우 복제는 피한다. 표정은 절제하고 입장에 성별·나이·외모를 임의 연결하지 않는다. 반복 화자는 동일 원화를 재사용하고 서로 다른 화자에 같은 얼굴을 복제하지 않는다.

같은 자료에서 동등한 역할을 하는 여러 화자는 **하나의 작화 세트**로 설계한다. 생성 프롬프트에 같은 눈·코·입의 단순화 수준, 윤곽/내부 선 굵기, 머리·의복의 회색 면, 시점과 흉상 절단 범위를 함께 명시한다. 발언 목록의 참가자는 동일한 정면 또는 약한 3/4 시점, 정수리부터 어깨·가슴까지 같은 범위와 비슷한 가시 크기를 출발값으로 삼는다. 머리 모양·복식·연령 등의 필요한 차이는 남기되, 인물별로 미형 만화·사실화·아이콘 화풍이나 기울어진 전신/정면 흉상이 섞이지 않게 한다. 장면에서 요청한 서로 다른 동작·방향에는 이 같은 포즈 기본값을 강제하지 않는다. 자산 하나씩의 승인에 더해 전체 인물 세트를 나란히 놓고 예정 인쇄 크기에서 통일성을 검수한다. 각자 그럴듯해도 한 세트로 화풍·구도가 맞지 않으면 필요한 범위의 편집·크롭·교체 또는 재생성으로 바로잡는다.

작은 인터뷰·세로대화·화상 참가자는 기본 목·어깨~가슴의 흉상. 머리 bounds는 크기/위치 측정용이며 자르기 범위가 아니다. 배치의 `crop`도 흉상으로 유지하고, 작은 행에 맞추려고 얼굴만 자르지 않는다. ‘얼굴만/몸 제외’라는 명시 요청 또는 독립 얼굴 단품일 때만 머리카락 위~턱·귀로 자른다(미지정 머리 폭 **10–15mm** 출발). 일반 의뢰의 ‘교사 얼굴’, ‘인물’은 얼굴만 자르라는 지시가 아니다. 가로대화 흉상은 정수리~턱=1일 때 전체 높이 **1.5–1.9**, 어깨 폭/머리 폭 **1.6–2.0** 출발이며 손짓/전신 장면에는 강제하지 않는다. 발표자는 예약된 말풍선/화면과 남은 폭을 먼저 확정하고 그 영역에 맞는 자세·신체 범위로 생성한다. 작은 흉상 확대/인체 늘이기로 높이를 맞추지 않는다. 시선은 상대/발언 공간 안쪽으로 향하게 한다. 생성 원화와 실제 인물 사진 모두 배치 후 방향을 판단하고, 바깥쪽을 보면 이미지 개체만 좌우 뒤집는다. 이름·발언·틀은 반전하지 않는다. 사진에 있는 문자·사건의 방향 등 의미가 바뀌는 경우에는 반전 대신 사진 선택이나 배치를 조정한다.

승인 전 최종 조판에 채택하지 않는다. 예정 인쇄 크기에서 전체 인물이 평가원 시험지의 절제된 인물 선화로 읽히는지를 승인 기준으로 삼는다. 검정 윤곽과 회색 채움만 맞았다는 이유로 미형 만화풍의 얼굴·머리 광택·과장된 표정을 승인하지 않는다. 다만 눈에 띄게 과장된 광택 눈, 요청 연령에 반하는 유아형 머리·몸 비율, 특징을 읽기 어렵게 뭉친 검은 머리, 조각적·사진적 질감, 잘못된 해부학은 불합격으로 판정한다. 해당 문제를 발견하면 ‘화풍 한계’라고 적고 승인하지 않는다. 머리카락·피부·옷에 부드러운 그라데이션이나 번진 음영이 보여 사진·웹툰 일러스트처럼 읽히는 원화도 같은 이유로 불합격이다. 자기 원화만 보지 말고 같은 크기로 줄인 결과를 평가원 교과서식 선화(검은 윤곽, 흰 얼굴, 경계가 분명한 회색 면 2–3개)와 비교한다. 부분 자세·소품의 문제는 기존 원화를 편집한다. 얼굴·머리·명암의 화풍 전체가 다른 경우에는 실패 원화의 스타일이 편집에 반복될 수 있으므로, 필요한 인원·동작·배치만 말로 유지하고 같은 화풍 계약으로 새 원화를 생성하는 방법을 선택한다. 인원·포즈·소품이 맞는지와 화풍이 맞는지를 각각 판정한다. 공통 재검수·중단 원칙을 따르며 실제 프롬프트·원화 경로·승인 근거는 그림 밖 기록에 남긴다.
<!-- /when-module -->
