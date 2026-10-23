## production 계획·반영·보존

`map_plan`의 `featureCatalog`는 `canonicalId`, `aliases`, `localNames`, `role`, source `objectIds`, `connectedIds`를 담는다. canonical ID와 등록 alias/localName을 `featureRequests`에 넣고, source path UUID는 canonical ID 대신 표시용 `featureObjectIds`에 쓴다. 빈 `connectedIds`는 확인된 연결 인덱스가 없다는 뜻이지 지형이 연결되지 않았다는 증거가 아니다. 예를 들어 `river:Nile`, `Nile`/`nile`/`NILE`, 등록 localName `나일강`은 같은 feature를 가리킨다. `FEATURE_ALIAS_UNREGISTERED`(alias 미등록), `FEATURE_UNINDEXED`(식별자가 검증되지 않은 geometry), `FEATURE_UNAVAILABLE`(source geometry 없음), `FEATURE_NOT_SELECTED`, `FEATURE_PARTIAL_SELECTION`, `FEATURE_HIDDEN`을 구분하며, 해석 결과는 `report.featureResolutions`로 확인한다.

등록 관리 지도 루트의 `xMm`/`yMm`는 각각 −10000–10000mm 문서 좌표다. 명시한 위치는 `policy:"preserve"` 업데이트와 save/reopen을 거쳐 유지되므로, unchanged valid map을 갱신하려고 reset하거나 detach할 필요가 없다. 관리 경계 스타일은 `adminBorderStyle:"none"|"solid"|"dashed"`로 설정하고, `boundaryDashPt:[length,gap]`는 실제 출력의 물리 pt 단위(.1–100 각각)다. 생략 시 source 스타일을 보존하며 새 dashed 경계의 기본 패턴은 `[1.5,1]`이다. 연결된 native path는 업데이트와 재열기 사이에서도 dash phase를 이어간다.

실제 스키마를 확인하고 defaultSpec의 필요한 값만 수정한다. map spec의 식별 계약은 `kind:"map"`, `mapSchemaVersion:"vectora.map/v1"`, `mode:"template"`, assetRef/assetHash/sidecarRef/sidecarHash다. 새 등록 map defaultSpec은 공통 `styleProfile:"kice"`를 사용하며 `profileId:"kice-map"`만으로 기존 지도가 소급 스타일링되지는 않는다. 저장된 explicit 값과 사용자의 요청은 자동 KICE 기본값보다 우선한다.

실제 계약이 `categories`를 지원하면 명목상 권역·도시 기호와 대응 범례를 함께 생성한다. 범주를 임의 숫자로 바꿔 `thematic`에 넣지 않는다. 국가/지리 앵커와 안정적인 범주·자료 ID를 유지하고 기호를 글꼴 문자로 대체하지 않는다. `widthMm`/`frameMm`은 지도 창 크기이며 범례를 포함한 완성 폭이 아니다. 오른쪽 범례는 실측 폭을 먼저 예약하고, 아래 범례는 지원되는 가로 배치·자동 줄바꿈을 사용한 뒤 실제 외곽과 8pt를 확인한다. 구버전의 세로 누적 범례가 불필요하게 높으면 지원 범위 안에서 배치를 보충하고 한계를 기록한다.

기존 문서 편집·명시적 원본 재현에서는 경계 변경 요청이 없으면 해당 해안·국경·행정경계 정책을 보존한다. **새 제작에서는 프리셋의 초기 가시성을 그대로 강제하지 않고**, 지도 공통 지침에 따라 필요한 경계를 선택한다. 해안만 필요한 지도는 실제 등록 roles를 확인해 `layers:{"coast":true,"internal-border":false,"admin-border":false}`처럼 불필요한 경계 역할만 숨긴다. 해당 역할이 없는 바탕에는 필드를 추정하지 않는다. 국가 경계는 `internal-border`, 내부 행정 경계는 `admin-border`이며 `adminBorderStyle`만 바꿔 국경 전체를 숨겼다고 판단하지 않는다. 역할별 `boundaryStyles`를 지원하면 필요한 국경에만 dashed를 지정한다. 단순 국가 강조 때문에 모든 선에 `borderStyle:"solid"`를 강제하지 않으며, plan과 실제 출력에서 해안 보존·불필요한 경계 제거를 확인한다.

- widthMm 기본 108, 현재 지원 1–108mm. 완성 폭은 별도 설명이 없으면 지시 문자/기호까지 포함한다. 범위 밖 요구를 조용히 108로 바꾸지 않는다. `cropDocumentMm:{x,y,width,height}`는 원문서 mm의 유한한 양의 대지 내부 범위, `frameMm`은 결과 지도 창이다. `s=창 폭/crop 폭`, `창 높이=crop 높이×s`로 동일 X/Y 배율을 적용한다. 폭/crop 변경 때 frame도 갱신하거나 create/plan에서 생략해 재계산한다. update 생략은 유지이므로 새 frame을 명시한다.
- 관리 지도의 폭은 native map update로 바꾸고 지리 anchor·투영·binding을 유지한다. 일반 그룹 확대/폭 맞춤으로 원경로를 변형하거나 invalid binding을 남기지 않는다. 따로 보충한 경로·라벨은 자동 연결 여부를 확인하고, 미연결이면 원 지리 좌표에서 새 창으로 다시 계산한다. 현재 점 위치를 눈대중으로 옮겨 맞추지 않는다.
- 지도 아래에 별도 수치 면을 보충하는 기존 방식은 현재 연결 앱의 지도 스키마가 `TemplateMapSpec.scalar`를 지원하지 않는 구버전에서만 조건부로 쓴다. 이 경우에도 source의 sea 역할과 `map.ocean` 배경을 구별하고, 실제 계층을 확인한 뒤 필요한 배경 개체만 조정한다. native scalar 지도에서는 바다 투명화를 하지 않는다. scalar 면은 불투명 바탕·육지·수역 채움 뒤, 지리선·라벨 앞에 native로 그려지며 map viewport clip을 따른다.
- 전용 대지에 완성 폭을 맞추면 `xMm:0,yMm:0` 등 실제 배치를 명시해 기본 오프셋 잘림을 막는다. 여백은 대지 치수에 포함하고 원점 포함 world bounds 네 변을 확인한다. 요청 종횡비는 **지도 창**에 적용하며 빈 대지 여백/비등방 왜곡으로 충족시키지 않는다. 도법/범위 때문에 불가능하면 미충족을 알린다.
- `verifiedIds`는 현재 바탕의 조회 feature ID(countryId 필드: 국가 또는 등록 행정구역), islandPolicy는 all/mainOnly/excludeIslands, borderStyle은 none/solid/dashed다. `styleProfile:"kice"`의 경계는 검정, 단순 선택 음영은 `highlightFill:"#AAAAAA"`를 기본으로 한다. 선폭을 미지정하면 지원 앱이 지도 창의 실제 폭에 따라 0.15–0.3pt로 조정한다(108mm 창은 0.3pt, 36mm 창은 약 0.17pt). 이 자동값을 모든 크기에서 0.3pt로 덮어쓰지 않는다. 명시한 `boundaryStrokePt`는 크기를 바꿔도 보존된다. 새 지도의 바다색은 지도 공통 지침에서 선택한 값을 `oceanFill`로 명시하고, 기존 지도 수정에서는 원래 값을 유지한다. `viewportPolicy:"source"|"kice-world"`는 명시 crop을 보존한다. `graticulePolicy:"source"|"major"|"none"`은 현재 스키마에서 지원할 때만 쓴다. major는 바탕에 있는 주요 위경선을 활성화하지만 `layers.graticule:false`가 명시되면 숨김이 우선한다. 없는 위경선을 새로 만든다는 뜻은 아니다. `layers:{역할:true|false}`는 실제 roles에만 사용하고 생략은 원가시성 유지다. internal-border 가시성과 borderStyle을 구별한다. Source sidecar의 `stylePolicy[objectId]:"preserve"|"profile"`은 지정된 source object의 의미 있는 sea/coast/boundary 스타일을 프로필이 덮어쓸지 제어한다. `preserve`는 해당 원본의 프로필 재스타일을 막고, 명시적인 사용자 oceanFill/boundary 색·폭은 우선한다. River, plate-boundary, movement 및 thematic 주제 선폭은 이 경계 기본값으로 정규화하지 않는다. 하천의 개별 `riverStyle`은 live schema에 있을 때만 사용하며, 그 필드별 명시값과 source preserve 정책을 확인한다. 하천을 강조하려고 전체 경계선 폭을 바꾸지 않는다.
- 해안선이 세밀한 작은 지도에서 시각 원칙에 따라 더 가는 폭을 선택했다면 그 값을 native map spec의 `boundaryStrokePt`에 명시해 갱신한다. 검정색은 유지하고 실제 출력 폭을 확인한다. 이 필드는 경계 공통 폭이므로 특정 역할만 다른 폭이 꼭 필요한 경우에만 미지원 부분을 보충한다. 관리 중인 원경로를 직접 스타일링해 지리 binding을 깨거나, 지원되는 전체 경계 폭 조절을 위해 지도 선 전체를 복제하지 않는다.
- 새 지명의 위치가 미지정이면 `placement:"auto"`를 우선한다. 지원 앱의 비례원 지도는 가까운 빈 면을 찾으며 `haloMm`은 글자 윤곽 보완이다. 윤곽만으로 문자 사이의 점선을 가리지는 못하므로, 점선 위 문자는 공통 판독성 규칙의 작은 흰 배경을 적용한다. 회색 면 위 글자는 공통 판독성 기준의 흰 윤곽을 검토한다. `haloMm:0`은 자동 윤곽까지 금지하는 명시값이다. 배치 불가 오류가 나거나 인출선이 부자연스럽게 길면 8pt·관측 위치·수량 척도를 유지한 채 지도 창·열 폭·인출선 계획을 재검토한다. 오류를 없애기 위해 임의 offset과 `fixed`로 바꾸거나 지리선과 겹친 이름을 그대로 납품하지 않는다. 고정 배치는 명시된 위치 또는 실제 잉크·기호·지리선과 대조해 검증한 배치에만 사용한다.
- overlays label/point의 document anchor `{kind:"document",xMm,yMm}`와 별도 anchors는 **원문서 mm**, crop 안 위치다. label은 `placement:"auto"|"fixed"`, `leader`, `haloMm:0..1`, `offsetMm:{x,y}`를 지원한다. point는 `radiusMm`, `fill`, `stroke:"#RRGGBB"|"none"`, `strokeWidthPt`를 지원하며 KICE 빈 원은 흰 채움·검정 0.3pt 외곽이다. label/point의 `provenance:{source,reference,elevationM?}`는 표시 근거를 보존한다. ID를 유지하고 배열 patch는 전체 교체임을 고려한다. geographic anchor `{kind:"geographic",longitude,latitude}`는 WGS84 경도 −180~180°, 위도 −90~90°이며 바탕과 같은 투영/반구 clip을 적용한다. 뒤쪽/창 밖 점을 보이게 하려고 좌표를 바꾸지 않는다.

- 경유점이 있는 경로는 라이브 map 계약이 지원하면 `routes[].via:[{longitude,latitude},...]`에 순서대로 WGS84 좌표를 준다. `from`/`to`와 같은 투영·crop으로 배치하며 무방향 연결은 `arrow:"none"`을 명시한다. 화면상의 꺾임을 보고 임의 위경도를 만들거나 섬 내부의 검사 좌표를 항구 좌표로 쓰지 않는다. 기존 경로의 생략값은 원 설정을 보존한다. 이중선 등 미지원 표현만 같은 지리 경로에서 보충하고, 지도 창을 바꾼 후 연결점과 경유점 위치를 다시 확인한다.

- 원자료 이미지 px/aspect는 측정값이며 DPI 없는 px를 제작 mm로 추정하지 않는다.
- plan transform.xPx/yPx와 내부 recipe 값은 문서 px다. mm=px×25.4/96이며 화면 px가 아니다. *Mm 필드에 px를 넣거나 production을 apply.units로 다시 환산하지 않는다.

최신 inspect의 documentId/revision/실제 계층/production.components를 확인하고 `vectora_map_plan({documentId,spec})`의 정규화 spec·sourceHashes·selectedPaths·report를 검토한다. `report.readiness`는 `ready|partial|blocked`; plan의 `render`, `save`, `reopen`, `export`는 아직 `notRun`이다. partial 사유를 남기고 blocked는 적용하지 않는다. plan은 삽입·revision 변경·자료 등록·저장·재열기를 수행하지 않으며 selectedPaths의 소스 UUID는 편집 ID가 아니다. 일반 plan을 폰트/렌더 검증으로 보지 않는다. 수량 지도에 명시적인 `report.flowPreflight`가 반환된 경우만 해당 새 구성요소의 native 실측 사전 검사 결과로 읽는다.


preserve는 수동 스타일·고정 위치·부분 detach를 존중하며 미리보기/reset 전환과 실제 결과가 같다고 가정하지 않는다. 관리 원경로 이동·내부 view 변형·비균일 상위 배율/skew는 binding을 무효화할 수 있다. invalid에 preserve를 강행하거나 사용자 초기화 의도 없이 reset하지 않는다. 독립 편집 요청 대상만 실제 component/자식 ID로 detach한다. 부분 detach는 재생성에서 제외, 전체는 binding 제거다. 실행 전 대상 ID가 지도 루트인지 자식인지 대조하고, 부분 해제 후 루트의 binding과 나머지 지리 anchor가 유효한지 즉시 확인한다. 잘못된 루트 해제를 그대로 둔 채 다음 편집을 진행하지 않는다. 원자료 누락/미래 스키마의 unresolved 정적 그림을 자동 fetch/재생성하지 않는다.

프로필은 요청값 → 저장된 명시값 → 기본값 순이며 저장 spec의 `styleProvenance`가 explicit/automatic을 구별한다.

## 통계 scalar 등치면·단계 색칠과 공통 비교

국가별 단계 구분도는 실제 `thematic` 스키마가 `labelContent`를 지원할 때 자료의 의미에 따라 `"none"`(등급·색만 읽히게 할 때 국가 라벨과 인출선 생략), `"label"`(지칭만), `"label-value"`(지칭과 값)를 선택한다. `"none"`도 records/값/등급색/범례/`displayNote`를 유지하며 기본값으로 강요하지 않는다. 생략은 기존 label+value/missing 표시를 보존한다. 원자료의 값·등급·단위를 지우지 않는다. `records[].labelOffsetMm:{x,y}`를 지원하면 지리 앵커에서 최종 출력 mm만큼 떨어진 문자 잉크 중심을 지정할 수 있다. 생략은 자동 배치다. 자동 지시선이 어색하면 해당 record의 오프셋을 source update로 고쳐 라벨과 선을 함께 재생성한다. overlay 라벨은 지원되는 `offsetMm`/`placement`를 사용한다. 관리 자식이나 선만 직접 이동하여 자료 갱신을 막지 않는다. 현재 명시 오프셋은 해안 밖 빈 면을 검사하며, 지형·다른 문자와 충돌하면 오류를 무시하지 말고 위치를 다시 정한다. 다른 국가를 관통하는 인출선 여부는 AI가 이미지로 판단한다. 폭 변경 후에도 물리 오프셋·글자 크기와 지리 연결을 확인한다.

실제 schema가 `thematic.legend.positionMm:{x,y}`를 지원하면 범례의 왼쪽 위를 **지도 창 원점 기준 출력 mm**로 지정한다(+x 오른쪽, +y 아래). `placement:"below"`·`gapMm`은 기본 위치용으로 유지하며 명시 위치가 우선한다. 생략하면 기존 아래 배치다. 우측 보조 칸 등 적절한 위치는 AI가 지도·삽입 지도·문자의 실제 외곽을 보고 정한다. 지도 폭을 바꿔도 이 물리 좌표는 자동 비례 확대되지 않으므로 다시 검수한다. 범례 그룹을 수동 이동하는 대신 이 source 필드를 사용하고, 값·범례 문구를 바꿔도 연결·배치가 유지되는지 확인한다. 다른 종류의 범례에 같은 필드를 추정해 보내지 않는다.

연결 앱의 실제 `vectora://production/map/schema`가 `TemplateMapSpec.scalar`를 노출할 때만 native scalar를 사용한다. `scalar`는 `schema`, `id`, `grid`, `scale`, `interpolation`, `missing`, `legend`를 보존한다. `grid`의 `crs`, `registration`, `longitudes`, `latitudes`, `rowOrder`, 2차원 숫자/null `values`, `quantity`, `unit`, `provenance`를 그대로 전달한다. 좌표·행·값을 자동 정렬, 역전, 재표본화, 변환하지 않는다. `provenance.kind`의 `provided`와 `hypothetical`은 같은 이름의 task `dataSource`로 자동 연결한다.

live schema가 `scalar.paintDomain`을 지원하면 바다까지 관측값을 나타낼 때 `"all"`(생략 기본), 육지에만 채색하고 바다는 비워둘 때 `"land"`를 선택한다. `land`는 검증된 지도 육지·수역 면으로 등치면 채색만 잘라 내며 격자의 바다 노드·null·보간·척도는 바꾸지 않는다. 같은 map source의 값·범위·크기 변경으로 함께 재계산하게 하고 흰 바다 덮개를 별도 배치하지 않는다. 검증된 면 기하가 없는 양식이나 빈 육지 범위가 거절되면 적합한 등록 양식을 선택하며, `all`로 조용히 바꾸거나 누락 자료를 만들지 않는다. 미지원 앱에서는 필요한 보충과 이후 범위 편집 시 재생성 한계를 명시한다.

제공된 `scale.thresholds`와 `bands`의 순서·ID·색·라벨을 유지한다. `interpolation`은 `linear-triangles-sw-ne`, `missing`은 `skip-cell`이며 null은 0이 아니다. 고도/DEM, 임의 CRS, cell-centered raster, 자동 구간 추정과 다른 정량 지도층을 섞지 않는다. 시점은 사용자가 준 패널 라벨·캡션에 두고 grid에 없는 시점 필드를 만들지 않는다.

native scalar는 채워진 ISOBANDS(등치면·단계 색칠)를 만든다. 정확한 등치선 경로나 선 라벨이 요구되면 연결 앱의 live schema/API 지원을 확인한다. 지원하지 않을 때는 필요한 선·라벨만 보충하며 등치면만으로 요청을 완료했다고 하지 않는다. 통계값을 DEM으로 바꾸지 않는다.

범례는 native 편집 가능한 UND 8pt다. `legend.maxWidthMm`가 있으면 실측 줄바꿈만 허용하고 글자 축소·절단은 하지 않는다. `highLabel`/`lowLabel`과 제목·구간 라벨을 보존한다. `widthMm`/`frameMm`은 계속 지도 viewport 치수이며, 오른쪽 범례의 실측 전체 경계는 별도로 계산한다.

지도 아래의 짧은 가로 범례는 live 계약이 지원하면 `scalar.legend.orientation:"horizontal"`을 쓴다. 낮은 값부터의 band 순서와 원자료 연결을 유지하며 항목 단위 줄바꿈·실제 잉크 중심 정렬을 이용한다. `maxWidthMm`는 지도 창 폭 안에서 정하고 제목·범례 문구를 바꾼 뒤에도 실제 가로 중심과 전체 폭을 확인한다. 생략은 기존 세로 목록이다. 이 항목형 범례를 구간 경계에 숫자가 붙은 연속 색띠와 혼동하지 않으며, 연속 색띠가 요구되면 해당 지원 여부를 따로 확인한다.

같은 척도를 쓰는 비교는 새 recipe를 만들지 않고 기존 isoline-map 자식들을 composition으로 묶는다. owner의 `composition.sharedScalar`가 quantity·unit·scale·legend의 유일한 편집 원본이며, `bindings[].target.childIds`는 stable composition child ID 경로다. 각 대상 map의 `scalar.scale`, `grid.quantity`, `grid.unit`은 owner와 일치하는 캐시이고 local `scalar.legend.placement`는 `none`이다. 격자와 값은 패널별로 독립 유지하며 척도·단위·범례를 자식별로 다시 편집하거나 복사하지 않는다.

native `composition.sharedScalar`가 공통 범례의 단일 소유자다. `production_plan`으로 범례를 한 번 측정하고, 사용자가 요청한 row/column 배치에서 지도 viewport·실제 8pt 라벨·지리 라벨·범례와 간격·패널 간격·캡션을 포함한 전체 bounds가 폭 예산에 들어가는지 확인한다. 패널 지도 viewport는 같은 물리 크기와 aspect ratio를 유지한다. `legend.maxWidthMm`는 측정된 줄바꿈 폭만 제한하며, UND 8pt는 고정한다. `widthMm`/`frameMm`은 지도 viewport 치수로 유지한다.

- live map schema가 `overlays[].leaderHaloPt`를 제공하면 색칠된 바탕 위 자동 지시선의 흰 테두리를 그 속성으로 조정한다(한쪽 추가 폭, pt). KICE 미지정은 가시 회색 면을 지나는 선에0.25pt씩, 0은 해제, 양수는 명시 적용이다. 검정 본선과 같은 경로·소유 관계를 유지하므로 별도 어긋난 흰 선을 만들지 않는다. 지명 이동·자료 갱신·재열기 뒤 연결 끝점과 실제 겹침을 확인한다.
