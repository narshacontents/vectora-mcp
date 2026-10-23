# 네이티브 대화 실행

발언 순서와 세로·가로 구도를 고르고, 원문·화자명·원화의 실제 크기를 계획한다. 말풍선·문자·이름은 네이티브 대화 컴포넌트로 함께 생성하고 갱신한다. 원화 확인과 문자 실측을 마친 뒤 생성하며, 실제 외곽 폭·이름의 글자 획 간격·말풍선 안 흰 면의 가림과 잘림을 확인한다. 지원되는 배치를 매번 수동 경로 편집이나 개별 이름 이동으로 대신하지 않는다.

이름이 있으면 선택한 배치 원칙을 실제 `speakers[].namePlacement`에 반영한다. 현재 스키마가 이 필드를 지원할 때 가로대화·발표의 기본은 `"outer"`이며, 생략했을 때의 아래 배치를 그대로 납품하지 않는다. `crop`과 인물 치수도 승인 원화의 필요한 신체 범위와 일치시킨다. 이 실행 지침을 읽었다는 이유로 원 요청에 없는 말풍선이나 이름을 추가하지 않는다.

<!-- when-module:vertical -->
세로 대화에서 지원되는 경우 `verticalOptions.widthPolicy:"painted-v1"`과 `nameGapMm`을 사용한다. 바깥 이름은 텍스트 상자 폭 대신 글자 획을 기준으로 배치한다. 활성 화자별 원화가 필요하며, 실제 외곽 폭을 측정해 요청 폭과 비교한다. 독립된 단 하나의 짧은 발언은 자연폭으로 만들 수 있지만, 세로로 나열한 발언 열에서는 짧은 행도 같은 몸통·본문 폭을 유지한다. 가로 대화에는 `verticalOptions`를 보내지 않는다.
<!-- /when-module -->

<!-- when-module:vertical -->
사각 인물 테두리를 명시 요청한 경우에만, 현재 schema가 지원하는 분리 원화·measured vertical v2 조합에서 `speakers[].portraitFrame`을 사용하고 `widthPolicy:"painted-v1"`, `tailPlacement:"reviewed-head-v1"` 지원을 확인한다. 꼬리/말풍선 `portraitGapMm`은 얼굴 윤곽이나 투명 여백이 아닌 painted outer frame edge를 기준으로 확인한다. `nameGapMm`은 바깥쪽 이름에만 적용하며, 아래 이름은 native 고정 1mm 간격을 유지한다. 본문 편집 뒤 프레임·말풍선·꼬리·이름의 동반 reflow를 검수한다. 요청에 프레임이 없으면 필드를 보내거나 테두리를 추가하지 않는다.
<!-- /when-module -->

<!-- when-module:horizontal -->
2–3명이 같은 자료판·탁자를 공유하며 한 줄에 있는 장면은, 라이브 계약이 지원하면 `horizontalOptions:{layoutVersion:2,arrangement:"shared-row"}`를 사용한다. 독립 대화의 두 명씩 행 나누기나 과거 v1의 세 열 배치로 우회하지 않는다. 실측 본문으로 배분된 열 폭, 자기 인물을 향한 짧은 꼬리, 양끝 인물의 안쪽 시선을 확인한다. `shared-row`만으로 외부 보드·탁자·제목이 자동 갱신되지는 않는다.
<!-- /when-module -->

<!-- when-module:horizontal -->
여러 인물과 가구의 접촉·가림을 한 원화로 제작한 경우, 라이브 계약이 제공하면 `sharedScene:{version:1,artwork:{assetId,speakers:[{speakerId,headBounds:{x,y,width,height}}]}}`로 연결한다. 승인된 장면 래스터를 `assetRole:"scene",crop:"full"`로 등록하고, 별도의 얼굴 자산처럼 자산 자체에 머리 bounds를 만들지 않는다. 사람별 bounds는 원본 픽셀의 정수리~턱·귀 범위이며 어깨 아래로 내려오는 긴 머리카락은 제외한다. 활성 화자 2–3명의 왼쪽→오른쪽 순서와 ID를 일치시킨다. 장면 안에 이미 있는 탁자, 개별 화자의 `assetId`·`headWidthMm`·`crop`을 중복 지정하지 않는다. 원화의 종횡비를 유지하면서 말풍선과 바깥 이름을 실제 머리에 연결하므로 원화 생성 전에 머리 배치와 이름이 놓일 옆 공간도 계획한다. 원화에 읽을 글·말풍선·표·그래프를 구워 넣지 않는다.
<!-- /when-module -->

<!-- when-module:horizontal -->
더 많은 화자나 장면 위·아래에 나뉜 발언은 라이브 schema의 `artwork.speechGroups` 지원을 확인한 뒤 명시 배치를 사용한다. `[{id,placement:"above"|"below",turns:[{turnId,leftMm,widthMm?,maxWidthMm?,topMm?|bottomMm?,paddingMm?,tailDepthMm?,anchor?}]}]`로 각 발언을 정확히 한 번 연결한다. 이는 AI가 실측해 고른 배치이며 `leftMm`·폭은 최종 대화 평면의 mm, 선택한 위/아래 경계는 가시 원화 상단 기준 mm, `anchor`는 승인 원화의 화자 윤곽 접점 픽셀이다. 전체 한 줄만 자연폭으로 줄이려면 `widthMm`를 생략하고 가용 `maxWidthMm`를 준다. 고정 열 폭은 발언 수정 때 자동 재배분되지 않으므로 제작자가 다시 측정한다. 명시 위치가 없을 때 머리 경계 가까이 놓이며, 상하 경계를 고정하면 짧은 곡선 꼬리가 실제 화자 윤곽에 닿는지도 확인한다. 읽을 자료와 보호할 원화 영역은 `dataRegions` 및 `protectedRegions:[{id,bounds}]`로 보존한다. 공간 충돌·지나치게 긴 꼬리 오류는 배치/원화를 재계획하라는 뜻이며 글자 축소나 수동 삼각 꼬리로 우회하지 않는다. 이 명시 배치가 없는 기존 2–3인 경로와 구별한다.
<!-- /when-module -->

<!-- when-module:horizontal -->
장면 크기 옵션이 라이브 계약에 있으면 새 공유 원화는 기본 `maxHeadWidthMm:15`로 가장 큰 검토 머리 폭을 제한하고, 장면 전체를 같은 비율로 축소해 가운데 놓는다. 말풍선·보드는 전체 요청 폭을 유지한다. 머리를 작게 그리라는 생성 지시만 믿고 원화를 전체 폭까지 늘리지 않는다. 사용자가 장면 폭을 지정한 경우 `artwork.sceneWidthMm`이 머리 상한보다 우선하며 전체 폭 안에 들어가야 한다. `sceneWidthMm:null`은 명시 폭을 지워 저장된 상한으로 돌아가고, `maxHeadWidthMm:null`은 상한을 해제한다. 저장된 구버전 장면에 두 옵션이 없으면 기존 전체 폭 배치를 유지하며 단순 문구 수정 때 새 기본값으로 바꾸지 않는다.
<!-- /when-module -->

<!-- when-module:horizontal -->
라이브 계약이 제공하면 새 공유 원화의 `artwork.nameClearance:"source-alpha-v1"` 기본값을 유지한다. 이름 높이에서 실제 원화의 바깥 윤곽을 측정하므로 머리 bounds를 긴 머리카락까지 부풀리거나 이름을 수동 이동하지 않는다. 불투명 배경으로 윤곽을 입증할 수 없다는 경고가 나오면 머리 bounds 기반 배치로 돌아간 상태이므로 실제 JPEG에서 이름과 머리카락·옷의 겹침을 확인한다. 저장된 구버전 장면의 `reviewed-head-v1` 또는 정책 누락은 기존 배치를 유지하며, 사용자 요청이나 명시적인 재생성 없이 새 정책으로 교체하지 않는다.
<!-- /when-module -->

<!-- when-module:horizontal -->
불투명 보드·장식 배경이나 이웃 인물 때문에 alpha로 이름 공간을 안전하게 계산할 수 없을 때만, 사용 전에 연결된 라이브 `vectora://production/dialogue/schema`와 `vectora://production/dialogue`에서 `sharedScene.artwork.speakers[].nameRegion` 지원을 확인한다. 지원이 확인된 앱에서만 안정된 `speakerId`에 대응하는 머리 옆, 얼굴 높이의 빈 영역을 원본 픽셀로 검수해 `nameRegion` (`x`,`y`,`width`,`height`, 선택적 `background:"white"`)으로 지정한다. 영역은 원화의 실제 source bounds 안에서 모든 머리·사람·자료 잉크와 다른 이름 영역을 피해야 하며, 장면·대화 변경 뒤에도 native `speaker.label`의 8pt 잉크와 기존 물리 `horizontalOptions.nameGapMm` 간격이 영역 안에 들어야 한다. `background:"white"`는 승인된 비자료 장식을 의도적으로 덮을 때만 쓰고 native 0.25mm backing 전체를 영역 안에 둔다. 이름 라벨은 대화 소유로 유지하며 solver를 피하려고 생략하거나 별도 텍스트로 다시 만들지 않는다. 명시 `speaker.side`가 영역이 정한 쪽과 충돌하면 입력을 해소한다. 영역 맞춤 실패는 실제 공간 부족을 뜻하며 얼굴·자료 위 배치나 글자 축소를 허가하지 않는다. 미지원 앱에는 옵션을 보내지 않는다. 기존 지원 경로나 수동 보충을 쓰는 경우에도 native 이름 연결이 지원되지 않거나 수동임을 분명히 밝힌다.
<!-- /when-module -->

<!-- when-module:horizontal -->
`sharedScene.artwork.dataRegions`는 opt-in이다. 실행 직전 현재 연결된 `vectora://production/dialogue/schema`에서 요청 layout의 실제 schema branch를 확인하고, 같은 연결의 `vectora://production/dialogue` 입력 설명으로 호출 필드를 확인한 경우에만 쓴다. 미지원 구버전 앱에서는 필드를 생략하고 별도 편집 객체 조판을 명시적 fallback으로 쓰며 장면 영역과의 자동 바인딩이 없다고 밝힌다. 각 영역은 짧고 안정된 고유 `id`, 원화 `visibleBounds` 안에서 머리·이름·다른 자료 영역과 겹치지 않도록 검수한 원본 픽셀 `bounds:{x,y,width,height}`, `insetMm`(기본 1), `align`/`verticalAlign`(`start|center|end`, 생략 시 `start`)을 가진다. 내용은 `spec` 또는 프레임 없는 `text`와 선택적 `richText`다. `spec`은 독립 `table`, `graph`, 매체용 `kind:"text"` 프레임 또는 `composition`이며 구성 자식도 `spec` 또는 `text`/`richText`로 둔다. `richText.text`는 `text`와 정확히 같아야 한다. 모호한 표에는 실제 방문 경로의 `specRecipes` 매핑을 지정하고, 검수 없는 고정 좌표를 복사하지 않는다.
<!-- /when-module -->

<!-- when-module:horizontal -->
자식은 안정 ID의 native owner에 남겨 장면 변환을 반영하고 대화·내용 수정 때 자동 재흐름하게 한다. 원본 이미지와 데이터는 그대로 보존하며, 표 열은 명시 제약이 없으면 자동 배치한다. 제목·단위·축·범례·라벨·선 두께를 포함한 전체 paint bounds가 영역 안에 드는지 확인하고 각 역할에서 선택한 문자 프로필의 크기를 유지한다. 말풍선·꼬리·이름과 자료 paint가 겹치면 artwork.md의 안전영역 원칙으로 원화 영역과 대화 배치를 조정해 데이터와 대화가 서로를 가리지 않게 한다. 공간 부족 오류는 글자 축소, 그룹 스케일, 원문 라벨 축약을 허가하지 않는다.
<!-- /when-module -->

<!-- when-module:horizontal -->
라이브 계약의 `sharedScene.board:{title?,titleRichText?}`는 칠판·받침과 선택적 제목을 소유하며 문단 박스와 부분 서식을 유지한다. 지원 앱에서 제목을 생략하거나 빈 문자열로 두면 제목 글상자와 제목용 위 여백이 생기지 않는다. 제목이 없는 장면을 위해 임의 제목을 넣거나 칠판을 다른 소유자로 분리하지 않는다. 개별 원화가 필요한 단순한 접촉 장면은 `table:{kind:"projected-round",contacts:[{speakerId,assetId,x,y}]}`를 사용할 수 있다. 접점은 검수된 흉상/전신 래스터의 실제 받침 손 원본 픽셀 좌표이며, 얼굴 좌표나 동일한 y값으로 추측하지 않는다. 이 한 점 방식은 임의 자세나 두 팔의 자연스러움을 보증하지 않는다. 손끝이 닿아도 몸통 절단면이나 받침 팔이 떠 있으면 미완료다. 요청하지 않은 보드·탁자는 추가하지 않는다.
<!-- /when-module -->

폭·발언·제목은 소유 컴포넌트에서 수정하고, 원화 종횡비·짧은 꼬리·이름 간격·제목의 글 획 중심·상하 간격·장면의 접촉을 검수한다. 원화 없는 plan은 최종 원화 배치의 승인이 아니며, 승인된 원화로 생성한 실제 이미지를 확인한다. 미지원 또는 다른 자세는 기존 보충 경로를 사용하고 수동으로 남은 관계를 기록한다. 지원하지 않는 앱에는 새 옵션을 보내지 않는다.

<!-- when-module:presentation -->
인물과 큰 말풍선으로 된 발표는 `layout:"presentation",presentationMode:"speech"`를 쓴다. 실제 계약이 측정형 `presentationOptions:{layout:"speech",layoutVersion:2}`를 지원하면 새 원화 포함 발표의 기본 정책을 사용한다. 미지정 인물 크기를 임의 `headWidthMm`으로 덮어쓰지 않고, 말풍선 높이와 원화의 실제 가시 영역으로 계산한 인물·바깥 이름·꼬리를 확인한다. 기존 문서의 v1/저장 정책은 단순 문구 수정만으로 바꾸지 않는다.

자료판 옆의 **원형 교사 초상과 짧은 질문**은 큰 말풍선과 발표자의 높이를 맞추는 구성과 구별한다. 선택된 recipe의 교사/학생 크기 위계와 인물 구성요소의 프레임 클리핑 원칙을 적용하며, 질문 높이에 맞춰 교사를 작게 만들거나 문장을 늘리지 않는다. 현재 라이브 계약이 `presentationOptions:{layout:"speech",layoutVersion:1}`과 `portraitHeightMm`을 지원하면 이 인셋에 한해 명시 높이를 적용할 수 있다. 프레임·흰 바탕·마스크와 원화의 편집 관계를 보존하고, 최종 가시 외곽으로 꼬리·발언·인접 행을 배치한다. 선택 recipe가 허용하는 비정보 영역 겹침을 무조건 금지하지 않는다. 바깥 매체의 component 블록에 남은 `indentMm`과 가용 폭도 확인하여 불필요한 빈 띠를 없앤다. 수동 보충 관계는 자료 수정 뒤 다시 확인하며 자동 연결된 것처럼 납품하지 않는다.
<!-- /when-module -->

<!-- when-module:vertical -->
라이브 스키마가 `verticalOptions.columnAlignment:"shared-v1"`을 제공하면 새 세로 발언 열에 사용한다. 전체 폭은 제작자가 정하고 공통 몸통/본문 폭과 행별 자연 높이는 네이티브 측정에 맡긴다. 기존 문서를 이 규칙으로 재조판할 때만 명시적으로 선택하며, 예전의 행별 수동 x·폭 보정을 다시 덧씌우지 않는다. 한 줄을 두 줄로 만드는 임의 본문 폭이나 최소 높이를 지정하지 않는다. 미지원 앱에서는 동일 폭·본문 시작선·자연 높이로 보충 조판하되, 본문 편집 뒤 공통 열이 유지되는지도 확인하고 수동 관계를 기록한다.

현재 계약이 제공하면 새 세로 대화는 `verticalOptions.portraitSizing:"two-line-body-v1"`, `portraitAlignment:"top-ink-v1"`, `tailPlacement:"reviewed-head-v1"`을 사용한다. 원화 없는 계획의 `portraitReference.bodyHeightMm`은 인물 전체 높이의 기준이며, 실제 승인 흉상을 넣은 뒤 가시 높이·정수리와 말풍선 몸통 상단 정렬·얼굴~꼬리 간격을 다시 확인한다. 세 옵션은 현재 연결된 스키마가 실제 제공할 때만 보내며, 상단 정렬을 지원하지 않는 앱의 중앙 배치를 규칙 충족으로 판정하지 않는다. 사용자가 크기를 지정하지 않았다면 자동 계산을 임의 `headWidthMm`/`portraitHeightMm`으로 덮어쓰지 않는다. 전체 높이를 명시한 요청은 `portraitHeightMm`으로 지정한다. 이전 `headSizing:"two-line-height-v1"`은 얼굴 높이만 맞추는 호환 정책이므로 새 기준에 사용하지 않는다. 구체적인 크기·절단 범위의 판단은 선택된 세로대화·인물 원칙을 따른다.
<!-- /when-module -->

현재 연결된 `vectora://production/dialogue/schema`와 `vectora://production/dialogue`에서 옵션과 허용 범위를 확인한다. `additionalProperties:true`나 앱 소스의 정의만으로 실행 지원을 추정하지 않는다. 공개되지 않은 옵션은 보내지 않고 지원되는 방식으로 제작하며, 미지원·미확인 한계를 구별한다. 기존 문서의 배치 정책은 사용자 요청이나 명시적인 재생성 없이 교체하지 않는다.
