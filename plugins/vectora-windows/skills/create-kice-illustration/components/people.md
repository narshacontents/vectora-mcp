# 인물이 포함될 때 선택하는 구성요소

인물이 실제 포함될 때 이 구성요소를 task instructions에 포함한다. 배치와 말풍선 수치는 실제 작업에 선택된 recipe·component 지침을 적용한다. 인물 없는 그림에는 선택하지 않는다.

## 적용 범위

- 새 작은 인물·대화·발표·관계도·독립 얼굴/흉상에는 아래 고정 블록을 매 생성/수정 프롬프트에 그대로 넣는다. ‘KICE’ 한마디로 줄이지 않는다. 생성·참조 검색·자산 실행 규칙은 task instructions에 함께 선택된다.
- 새 자유 장면 속 인물은 그 장면의 자유 원화 계약을 사용한다. 이 파일의 정체성·해부·승인 원칙은 유지하되 단품 투명 배경·흉상 비율·가장자리 배치를 자유 장면에 강제하지 않는다.
- **원본 인물 사진·기존 작품**에는 새 작화 계약을 적용하지 않는다. 실제 원본의 얼굴·복식·질감을 보존하고 task instructions에 선택된 사진 보존 규칙을 따른다.

```text
STYLE CONTRACT: Draw a living human character as a restrained editorial ink illustration for a printed senior-secondary examination. Use naturalistic proportions and restrained facial features: compact almond-shaped eyes, small dark irises with visible whites, unobtrusive lashes, and a readable nose bridge and natural jaw. For adolescents and older teenagers, use proportionate near-adult faces; explicit children retain age-appropriate anatomy. Use crisp black contours, lighter and fewer interior lines, opaque white skin, and broad flat light-to-middle gray areas in the hair and clothing; reserve black for contours, pupils, and small local accents. Aim for large white areas, light gray around #D6D6D6 and middle gray around #AAAAAA, with darker gray only in small accents. These are visual tonal targets, not a pixel conversion. Judge the whole drawing at its intended print size as a natural, age-appropriate educational illustration; iris width, a slightly larger stylized eye, or a gray area alone does not require rejection. Group hair and beard into a few clear flat masses with sparse directional lines and no glossy highlight bands. Use only a few small, clearly bounded flat shadow shapes; keep the face predominantly white. Keep large shapes readable at the final small printed size. The rendering is flat illustrated line art, not a depiction of a sculpted object.
EXCLUDE: statues, sculptural busts, marble, plaster, stone surfaces, pedestals, carved facial planes, charcoal, graphite or pencil texture, etching, engraving, hatching, cross-hatching, stippled shading, dense individual hair strands, photographic skin, 3D rendering, dramatic lighting, continuous tonal modeling, diffuse gray halos, exaggerated genre facial rendering (e.g., manga/webtoon/chibi proportions), obviously exaggerated glossy eyes, unreadable solid-black hair masses, emoji or geometric placeholder faces. Do not introduce these styles through historical subject references.
ASSET: Isolate the character on a transparent exterior background, with opaque white skin and any white clothing areas. Keep the requested head and body extent complete with minimal transparent outer padding. No lettering, name labels, speech bubbles, frames, or scenery. Include only props explicitly required by the request.
```

### 새로 그린 인물의 승인과 범위

**이 절의 화풍·생성·수정 생성 검사는 새로 그린 인물과 그 작화 자산의 재사용에만 적용한다. 실제 인물 사진·기존 작품에는 적용하지 않는다.** 원본 인물은 확인된 출처와의 얼굴·복식·질감·절단 범위 일치, 해상도와 배치를 검수하며 새 화풍으로 다시 생성하지 않는다.

확대와 예정 인쇄 크기 모두에서 흰 얼굴/회색 머리·의복의 큰 면, 식별 가능한 눈·코·입, 자연스러운 두개부·턱·귀·목·어깨를 확인한다. 옆얼굴은 이마→코→입→턱 연결과 한 눈, 3/4의 먼 눈은 좁게; 코만 붙인 정면 두 눈은 불합격. 머리/수염은 몇 큰 흐름 면이며 헬멧 이중 테두리·무수한 가는 털선·목탄/빗금/석재·연속 입체 명암을 피한다. 흉상은 옷깃·어깨 경사·큰 주름으로 이어지고 삼각 몸통/완벽 좌우 복제는 피한다. 표정은 절제하고 입장에 성별·나이·외모를 임의 연결하지 않는다. 반복 화자는 동일 원화를 재사용하고 서로 다른 화자에 같은 얼굴을 복제하지 않는다.

작은 인터뷰·세로대화·화상 참가자는 기본 목·어깨~가슴의 흉상. 머리 bounds는 크기/위치 측정용이며 자르기 범위가 아니다. 배치의 `crop`도 흉상으로 유지하고, 작은 행에 맞추려고 얼굴만 자르지 않는다. ‘얼굴만/몸 제외’라는 명시 요청 또는 독립 얼굴 단품일 때만 머리카락 위~턱·귀로 자른다(미지정 머리 폭 **10–15mm** 출발). 일반 의뢰의 ‘교사 얼굴’, ‘인물’은 얼굴만 자르라는 지시가 아니다. 가로대화 흉상은 정수리~턱=1일 때 전체 높이 **1.5–1.9**, 어깨 폭/머리 폭 **1.6–2.0** 출발이며 손짓/전신 장면에는 강제하지 않는다. 발표자는 예약된 말풍선/화면과 남은 폭을 먼저 확정하고 그 영역에 맞는 자세·신체 범위로 생성한다. 작은 흉상 확대/인체 늘이기로 높이를 맞추지 않는다. 시선은 상대/발언 공간으로; 원화 반전 시 이름·발언은 반전하지 않는다.

승인 전 최종 조판에 채택하지 않는다. 예정 인쇄 크기에서 전체 인물이 자연스러운 교육용 삽화로 읽히는지를 승인 기준으로 삼는다. 홍채 너비, 약간 큰 양식화 눈, 회색 면 하나만으로 자동 불합격하지 않는다. 다만 눈에 띄게 과장된 광택 눈, 요청 연령에 반하는 유아형 머리·몸 비율, 특징을 읽기 어렵게 뭉친 검은 머리, 조각적·사진적 질감, 잘못된 해부학은 불합격으로 판정한다. 해당 문제를 발견하면 ‘화풍 한계’라고 적고 승인하지 않는다. 같은 계약으로 해당 표현을 수정 생성하고, 인원·포즈·소품이 맞는지와 화풍이 맞는지를 각각 판정한다. 공통 재검수·중단 원칙을 따르며 실제 프롬프트·원화 경로·승인 근거는 그림 밖 기록에 남긴다.
