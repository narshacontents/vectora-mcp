## production 계획·반영·보존

`map_plan`의 `featureCatalog`는 `canonicalId`, `aliases`, `localNames`, `role`, source `objectIds`, `connectedIds`를 담는다. canonical ID와 등록 alias/localName을 `featureRequests`에 넣고, source path UUID는 canonical ID 대신 표시용 `featureObjectIds`에 쓴다. 빈 `connectedIds`는 확인된 연결 인덱스가 없다는 뜻이지 지형이 연결되지 않았다는 증거가 아니다. 예를 들어 `river:Nile`, `Nile`/`nile`/`NILE`, 등록 localName `나일강`은 같은 feature를 가리킨다. `FEATURE_ALIAS_UNREGISTERED`(alias 미등록), `FEATURE_UNINDEXED`(식별자가 검증되지 않은 geometry), `FEATURE_UNAVAILABLE`(source geometry 없음), `FEATURE_NOT_SELECTED`, `FEATURE_PARTIAL_SELECTION`, `FEATURE_HIDDEN`을 구분하며, 해석 결과는 `report.featureResolutions`로 확인한다.

등록 관리 지도 루트의 `xMm`/`yMm`는 각각 −10000–10000mm 문서 좌표다. 명시한 위치는 `policy:"preserve"` 업데이트와 save/reopen을 거쳐 유지되므로, unchanged valid map을 갱신하려고 reset하거나 detach할 필요가 없다. 관리 경계 스타일은 `adminBorderStyle:"none"|"solid"|"dashed"`로 설정하고, `boundaryDashPt:[length,gap]`는 실제 출력의 물리 pt 단위(.1–100 각각)다. 생략 시 source 스타일을 보존하며 새 dashed 경계의 기본 패턴은 `[1.5,1]`이다. 연결된 native path는 업데이트와 재열기 사이에서도 dash phase를 이어간다.

실제 스키마를 확인하고 defaultSpec의 필요한 값만 수정한다. map spec의 식별 계약은 `kind:"map"`, `mapSchemaVersion:"vectora.map/v1"`, `mode:"template"`, assetRef/assetHash/sidecarRef/sidecarHash다. 새 등록 map defaultSpec은 공통 `styleProfile:"kice"`를 사용하며 `profileId:"kice-map"`만으로 기존 지도가 소급 스타일링되지는 않는다. 저장된 explicit 값과 사용자의 요청은 자동 KICE 기본값보다 우선한다.

실제 계약이 `categories`를 지원하면 명목상 권역·도시 기호와 대응 범례를 함께 생성한다. 범주를 임의 숫자로 바꿔 `thematic`에 넣지 않는다. 국가/지리 앵커와 안정적인 범주·자료 ID를 유지하고 기호를 글꼴 문자로 대체하지 않는다. `widthMm`/`frameMm`은 지도 창 크기이며 범례를 포함한 완성 폭이 아니다. 오른쪽 범례는 실측 폭을 먼저 예약하고, 아래 범례는 지원되는 가로 배치·자동 줄바꿈을 사용한 뒤 실제 외곽과 8pt를 확인한다. 구버전의 세로 누적 범례가 불필요하게 높으면 지원 범위 안에서 배치를 보충하고 한계를 기록한다.

경계 변경 요청이 없으면 선택한 프리셋의 해안·국경·행정경계별 실선/점선 정책을 보존한다. 단순 국가 강조를 위해 `borderStyle:"solid"` 등을 임의로 명시하지 않는다. 생략한 값이 실제 원본 스타일을 유지하는지 plan과 출력에서 확인하고, 유지되지 않으면 확인한 원본 정책으로만 보정한다.

- widthMm 기본 108, 현재 지원 1–108mm. 완성 폭은 별도 설명이 없으면 지시 문자/기호까지 포함한다. 범위 밖 요구를 조용히 108로 바꾸지 않는다. `cropDocumentMm:{x,y,width,height}`는 원문서 mm의 유한한 양의 대지 내부 범위, `frameMm`은 결과 지도 창이다. `s=창 폭/crop 폭`, `창 높이=crop 높이×s`로 동일 X/Y 배율을 적용한다. 폭/crop 변경 때 frame도 갱신하거나 create/plan에서 생략해 재계산한다. update 생략은 유지이므로 새 frame을 명시한다.
- 관리 지도의 폭은 native map update로 바꾸고 지리 anchor·투영·binding을 유지한다. 일반 그룹 확대/폭 맞춤으로 원경로를 변형하거나 invalid binding을 남기지 않는다. 따로 보충한 경로·라벨은 자동 연결 여부를 확인하고, 미연결이면 원 지리 좌표에서 새 창으로 다시 계산한다. 현재 점 위치를 눈대중으로 옮겨 맞추지 않는다.
- 지도 아래에 별도 수치 면을 보충하는 기존 방식은 현재 연결 앱의 지도 스키마가 `TemplateMapSpec.scalar`를 지원하지 않는 구버전에서만 조건부로 쓴다. 이 경우에도 source의 sea 역할과 `map.ocean` 배경을 구별하고, 실제 계층을 확인한 뒤 필요한 배경 개체만 조정한다. native scalar 지도에서는 바다 투명화를 하지 않는다. scalar 면은 불투명 바탕·육지·수역 채움 뒤, 지리선·라벨 앞에 native로 그려지며 map viewport clip을 따른다.
- 전용 대지에 완성 폭을 맞추면 `xMm:0,yMm:0` 등 실제 배치를 명시해 기본 오프셋 잘림을 막는다. 여백은 대지 치수에 포함하고 원점 포함 world bounds 네 변을 확인한다. 요청 종횡비는 **지도 창**에 적용하며 빈 대지 여백/비등방 왜곡으로 충족시키지 않는다. 도법/범위 때문에 불가능하면 미충족을 알린다.
- `verifiedIds`는 현재 바탕의 조회 feature ID(countryId 필드: 국가 또는 등록 행정구역), islandPolicy는 all/mainOnly/excludeIslands, borderStyle은 none/solid/dashed다. `styleProfile:"kice"`의 경계는 `boundaryStroke:"#000000"`, `boundaryStrokePt:0.3`, 단순 선택 음영은 `highlightFill:"#AAAAAA"`를 기본으로 한다. 바다색 요청이 없으면 원 바탕의 흰 배경을 유지하고 회색 바다를 요청했을 때 농도를 생략하면 `oceanFill:"#EEEEEE"`를 사용한다. `viewportPolicy:"source"|"kice-world"`는 명시 crop을 보존한다. `graticulePolicy:"source"|"major"|"none"`은 현재 스키마에서 지원할 때만 쓴다. major는 바탕에 있는 주요 위경선을 활성화하지만 `layers.graticule:false`가 명시되면 숨김이 우선한다. 없는 위경선을 새로 만든다는 뜻은 아니다. `layers:{역할:true|false}`는 실제 roles에만 사용하고 생략은 원가시성 유지다. internal-border 가시성과 borderStyle을 구별한다. Source sidecar의 `stylePolicy[objectId]:"preserve"|"profile"`은 지정된 source object의 의미 있는 sea/coast/boundary 스타일을 프로필이 덮어쓸지 제어한다. `preserve`는 해당 원본의 프로필 재스타일을 막고, 명시적인 사용자 oceanFill/boundary 색·폭은 우선한다. River, plate-boundary, movement 및 thematic 주제 선폭은 경계 0.3pt 프로필로 정규화하지 않는다. 하천의 개별 `riverStyle`은 live schema에 있을 때만 사용하며, 그 필드별 명시값과 source preserve 정책을 확인한다. 하천을 강조하려고 전체 경계선 폭을 바꾸지 않는다.
- 해안선이 세밀한 작은 지도에서 시각 원칙에 따라 더 가는 폭을 선택했다면 그 값을 native map spec의 `boundaryStrokePt`에 명시해 갱신한다. 검정색은 유지하고 실제 출력 폭을 확인한다. 이 필드는 경계 공통 폭이므로 특정 역할만 다른 폭이 꼭 필요한 경우에만 미지원 부분을 보충한다. 관리 중인 원경로를 직접 스타일링해 지리 binding을 깨거나, 지원되는 전체 경계 폭 조절을 위해 지도 선 전체를 복제하지 않는다.
- 새 지명의 위치가 미지정이면 `placement:"auto"`를 우선한다. 지원 앱의 비례원 지도는 가까운 빈 면을 찾고 불가피할 때만 보조 점선 위에 작은 글자 윤곽 halo를 자동 적용한다. 별도 요구가 없으면 `haloMm`을 생략하며, `0`은 이 보완까지 금지하는 명시값이다. 배치 불가 오류가 나거나 인출선이 부자연스럽게 길면 8pt·관측 위치·수량 척도를 유지한 채 지도 창·열 폭·인출선 계획을 재검토한다. 오류를 없애기 위해 임의 offset과 `fixed`로 바꾸거나 지리선과 겹친 이름을 그대로 납품하지 않는다. 고정 배치는 명시된 위치 또는 실제 잉크·기호·지리선과 대조해 검증한 배치에만 사용한다.
- overlays label/point의 document anchor `{kind:"document",xMm,yMm}`와 별도 anchors는 **원문서 mm**, crop 안 위치다. label은 `placement:"auto"|"fixed"`, `leader`, `haloMm:0..1`, `offsetMm:{x,y}`를 지원한다. point는 `radiusMm`, `fill`, `stroke:"#RRGGBB"|"none"`, `strokeWidthPt`를 지원하며 KICE 빈 원은 흰 채움·검정 0.3pt 외곽이다. label/point의 `provenance:{source,reference,elevationM?}`는 표시 근거를 보존한다. ID를 유지하고 배열 patch는 전체 교체임을 고려한다. geographic anchor `{kind:"geographic",longitude,latitude}`는 WGS84 경도 −180~180°, 위도 −90~90°이며 바탕과 같은 투영/반구 clip을 적용한다. 뒤쪽/창 밖 점을 보이게 하려고 좌표를 바꾸지 않는다.

- 경유점이 있는 경로는 라이브 map 계약이 지원하면 `routes[].via:[{longitude,latitude},...]`에 순서대로 WGS84 좌표를 준다. `from`/`to`와 같은 투영·crop으로 배치하며 무방향 연결은 `arrow:"none"`을 명시한다. 화면상의 꺾임을 보고 임의 위경도를 만들거나 섬 내부의 검사 좌표를 항구 좌표로 쓰지 않는다. 기존 경로의 생략값은 원 설정을 보존한다. 이중선 등 미지원 표현만 같은 지리 경로에서 보충하고, 지도 창을 바꾼 후 연결점과 경유점 위치를 다시 확인한다.

- 원자료 이미지 px/aspect는 측정값이며 DPI 없는 px를 제작 mm로 추정하지 않는다.
- plan transform.xPx/yPx와 내부 recipe 값은 문서 px다. mm=px×25.4/96이며 화면 px가 아니다. *Mm 필드에 px를 넣거나 production을 apply.units로 다시 환산하지 않는다.

최신 inspect의 documentId/revision/실제 계층/production.components를 확인하고 `vectora_map_plan({documentId,spec})`의 정규화 spec·sourceHashes·selectedPaths·report를 검토한다. `report.readiness`는 `ready|partial|blocked`; plan의 `render`, `save`, `reopen`, `export`는 아직 `notRun`이다. partial 사유를 남기고 blocked는 적용하지 않는다. plan은 삽입·revision 변경·자료 등록·저장·재열기를 수행하지 않으며 selectedPaths의 소스 UUID는 편집 ID가 아니다. 일반 plan을 폰트/렌더 검증으로 보지 않는다. 수량 지도에 명시적인 `report.flowPreflight`가 반환된 경우만 해당 새 구성요소의 native 실측 사전 검사 결과로 읽는다.


preserve는 수동 스타일·고정 위치·부분 detach를 존중하며 미리보기/reset 전환과 실제 결과가 같다고 가정하지 않는다. 관리 원경로 이동·내부 view 변형·비균일 상위 배율/skew는 binding을 무효화할 수 있다. invalid에 preserve를 강행하거나 사용자 초기화 의도 없이 reset하지 않는다. 독립 편집 요청 대상만 실제 component/자식 ID로 detach한다. 부분 detach는 재생성에서 제외, 전체는 binding 제거다. 실행 전 대상 ID가 지도 루트인지 자식인지 대조하고, 부분 해제 후 루트의 binding과 나머지 지리 anchor가 유효한지 즉시 확인한다. 잘못된 루트 해제를 그대로 둔 채 다음 편집을 진행하지 않는다. 원자료 누락/미래 스키마의 unresolved 정적 그림을 자동 fetch/재생성하지 않는다.

프로필은 요청값 → 저장된 명시값 → 기본값 순이며 저장 spec의 `styleProvenance`가 explicit/automatic을 구별한다.

## 통계 scalar 등치면·단계 색칠과 공통 비교

연결 앱의 실제 `vectora://production/map/schema`가 `TemplateMapSpec.scalar`를 노출할 때만 native scalar를 사용한다. `scalar`는 `schema`, `id`, `grid`, `scale`, `interpolation`, `missing`, `legend`를 보존한다. `grid`의 `crs`, `registration`, `longitudes`, `latitudes`, `rowOrder`, 2차원 숫자/null `values`, `quantity`, `unit`, `provenance`를 그대로 전달한다. 좌표·행·값을 자동 정렬, 역전, 재표본화, 변환하지 않는다. `provenance.kind`의 `provided`와 `hypothetical`은 같은 이름의 task `dataSource`로 자동 연결한다.

제공된 `scale.thresholds`와 `bands`의 순서·ID·색·라벨을 유지한다. `interpolation`은 `linear-triangles-sw-ne`, `missing`은 `skip-cell`이며 null은 0이 아니다. 고도/DEM, 임의 CRS, cell-centered raster, 자동 구간 추정과 다른 정량 지도층을 섞지 않는다. 시점은 사용자가 준 패널 라벨·캡션에 두고 grid에 없는 시점 필드를 만들지 않는다.

native scalar는 채워진 ISOBANDS(등치면·단계 색칠)를 만든다. 정확한 등치선 경로나 선 라벨이 요구되면 연결 앱의 live schema/API 지원을 확인한다. 지원하지 않을 때는 필요한 선·라벨만 보충하며 등치면만으로 요청을 완료했다고 하지 않는다. 통계값을 DEM으로 바꾸지 않는다.

범례는 native 편집 가능한 UND 8pt다. `legend.maxWidthMm`가 있으면 실측 줄바꿈만 허용하고 글자 축소·절단은 하지 않는다. `highLabel`/`lowLabel`과 제목·구간 라벨을 보존한다. `widthMm`/`frameMm`은 계속 지도 viewport 치수이며, 오른쪽 범례의 실측 전체 경계는 별도로 계산한다.

같은 척도를 쓰는 비교는 새 recipe를 만들지 않고 기존 isoline-map 자식들을 composition으로 묶는다. owner의 `composition.sharedScalar`가 quantity·unit·scale·legend의 유일한 편집 원본이며, `bindings[].target.childIds`는 stable composition child ID 경로다. 각 대상 map의 `scalar.scale`, `grid.quantity`, `grid.unit`은 owner와 일치하는 캐시이고 local `scalar.legend.placement`는 `none`이다. 격자와 값은 패널별로 독립 유지하며 척도·단위·범례를 자식별로 다시 편집하거나 복사하지 않는다.

native `composition.sharedScalar`가 공통 범례의 단일 소유자다. `production_plan`으로 범례를 한 번 측정하고, 사용자가 요청한 row/column 배치에서 지도 viewport·실제 8pt 라벨·지리 라벨·범례와 간격·패널 간격·캡션을 포함한 전체 bounds가 폭 예산에 들어가는지 확인한다. 패널 지도 viewport는 같은 물리 크기와 aspect ratio를 유지한다. `legend.maxWidthMm`는 측정된 줄바꿈 폭만 제한하며, UND 8pt는 고정한다. `widthMm`/`frameMm`은 지도 viewport 치수로 유지한다.
