## production 계획·반영·보존

`map_plan`의 `featureCatalog`는 `canonicalId`, `aliases`, `localNames`, `role`, source `objectIds`, `connectedIds`를 담는다. canonical ID와 등록 alias/localName을 `featureRequests`에 넣고, source path UUID는 canonical ID 대신 표시용 `featureObjectIds`에 쓴다. 빈 `connectedIds`는 확인된 연결 인덱스가 없다는 뜻이지 지형이 연결되지 않았다는 증거가 아니다. 예를 들어 `river:Nile`, `Nile`/`nile`/`NILE`, 등록 localName `나일강`은 같은 feature를 가리킨다. `FEATURE_ALIAS_UNREGISTERED`(alias 미등록), `FEATURE_UNINDEXED`(식별자가 검증되지 않은 geometry), `FEATURE_UNAVAILABLE`(source geometry 없음), `FEATURE_NOT_SELECTED`, `FEATURE_PARTIAL_SELECTION`, `FEATURE_HIDDEN`을 구분하며, 해석 결과는 `report.featureResolutions`로 확인한다.

등록 관리 지도 루트의 `xMm`/`yMm`는 각각 −10000–10000mm 문서 좌표다. 명시한 위치는 `policy:"preserve"` 업데이트와 save/reopen을 거쳐 유지되므로, unchanged valid map을 갱신하려고 reset하거나 detach할 필요가 없다. 관리 경계 스타일은 `adminBorderStyle:"none"|"solid"|"dashed"`로 설정하고, `boundaryDashPt:[length,gap]`는 실제 출력의 물리 pt 단위(.1–100 각각)다. 생략 시 source 스타일을 보존하며 새 dashed 경계의 기본 패턴은 `[1.5,1]`이다. 연결된 native path는 업데이트와 재열기 사이에서도 dash phase를 이어간다.

실제 스키마를 확인하고 defaultSpec의 필요한 값만 수정한다. map spec의 식별 계약은 `kind:"map"`, `mapSchemaVersion:"vectora.map/v1"`, `mode:"template"`, assetRef/assetHash/sidecarRef/sidecarHash다. 새 등록 map defaultSpec은 공통 `styleProfile:"kice"`를 사용하며 `profileId:"kice-map"`만으로 기존 지도가 소급 스타일링되지는 않는다. 저장된 explicit 값과 사용자의 요청은 자동 KICE 기본값보다 우선한다.

- widthMm 기본 108, 현재 지원 1–108mm. 완성 폭은 별도 설명이 없으면 지시 문자/기호까지 포함한다. 범위 밖 요구를 조용히 108로 바꾸지 않는다. `cropDocumentMm:{x,y,width,height}`는 원문서 mm의 유한한 양의 대지 내부 범위, `frameMm`은 결과 지도 창이다. `s=창 폭/crop 폭`, `창 높이=crop 높이×s`로 동일 X/Y 배율을 적용한다. 폭/crop 변경 때 frame도 갱신하거나 create/plan에서 생략해 재계산한다. update 생략은 유지이므로 새 frame을 명시한다.
- 전용 대지에 완성 폭을 맞추면 `xMm:0,yMm:0` 등 실제 배치를 명시해 기본 오프셋 잘림을 막는다. 여백은 대지 치수에 포함하고 원점 포함 world bounds 네 변을 확인한다. 요청 종횡비는 **지도 창**에 적용하며 빈 대지 여백/비등방 왜곡으로 충족시키지 않는다. 도법/범위 때문에 불가능하면 미충족을 알린다.
- `verifiedIds`는 현재 바탕의 조회 feature ID(countryId 필드: 국가 또는 등록 행정구역), islandPolicy는 all/mainOnly/excludeIslands, borderStyle은 none/solid/dashed다. `styleProfile:"kice"`의 경계는 `boundaryStroke:"#000000"`, `boundaryStrokePt:0.3`, 단순 선택 음영은 `highlightFill:"#AAAAAA"`를 기본으로 한다. 바다색 요청이 없으면 원 바탕의 흰 배경을 유지하고 회색 바다를 요청했을 때 농도를 생략하면 `oceanFill:"#EEEEEE"`를 사용한다. `viewportPolicy:"source"|"kice-world"`는 명시 crop을 보존하고 `graticulePolicy:"source"|"major"|"none"`은 명시 layers를 보존한다. `layers:{역할:true|false}`는 실제 roles에만 사용하고 생략은 원가시성 유지다. internal-border 가시성과 borderStyle을 구별한다. Source sidecar의 `stylePolicy[objectId]:"preserve"|"profile"`은 지정된 source object의 의미 있는 sea/coast/boundary 스타일을 프로필이 덮어쓸지 제어한다. `preserve`는 해당 원본의 프로필 재스타일을 막고, 명시적인 사용자 oceanFill/boundary 색·폭은 우선한다. River, plate-boundary, movement 및 thematic 주제 선폭은 경계 0.3pt 프로필로 정규화하지 않는다.
- overlays label/point의 document anchor `{kind:"document",xMm,yMm}`와 별도 anchors는 **원문서 mm**, crop 안 위치다. label은 `placement:"auto"|"fixed"`, `leader`, `haloMm:0..1`, `offsetMm:{x,y}`를 지원한다. point는 `radiusMm`, `fill`, `stroke:"#RRGGBB"|"none"`, `strokeWidthPt`를 지원하며 KICE 빈 원은 흰 채움·검정 0.3pt 외곽이다. label/point의 `provenance:{source,reference,elevationM?}`는 표시 근거를 보존한다. ID를 유지하고 배열 patch는 전체 교체임을 고려한다. geographic anchor `{kind:"geographic",longitude,latitude}`는 WGS84 경도 −180~180°, 위도 −90~90°이며 바탕과 같은 투영/반구 clip을 적용한다. 뒤쪽/창 밖 점을 보이게 하려고 좌표를 바꾸지 않는다.

- 원자료 이미지 px/aspect는 측정값이며 DPI 없는 px를 제작 mm로 추정하지 않는다.
- plan transform.xPx/yPx와 내부 recipe 값은 문서 px다. mm=px×25.4/96이며 화면 px가 아니다. *Mm 필드에 px를 넣거나 production을 apply.units로 다시 환산하지 않는다.

최신 inspect의 documentId/revision/실제 계층/production.components를 확인하고 `vectora_map_plan({documentId,spec})`의 정규화 spec·sourceHashes·selectedPaths·report를 검토한다. `report.readiness`는 `ready|partial|blocked`; plan의 `render`, `save`, `reopen`, `export`는 아직 `notRun`이다. partial 사유를 남기고 blocked는 적용하지 않는다. plan은 삽입·revision 변경·자료 등록·폰트/렌더 검증이 아니며 selectedPaths의 소스 UUID는 편집 ID가 아니다.


preserve는 수동 스타일·고정 위치·부분 detach를 존중하며 미리보기/reset 전환과 실제 결과가 같다고 가정하지 않는다. 관리 원경로 이동·내부 view 변형·비균일 상위 배율/skew는 binding을 무효화할 수 있다. invalid에 preserve를 강행하거나 사용자 초기화 의도 없이 reset하지 않는다. 독립 편집 요청 대상만 실제 component/자식 ID로 detach한다. 부분 detach는 재생성에서 제외, 전체는 binding 제거다. 원자료 누락/미래 스키마의 unresolved 정적 그림을 자동 fetch/재생성하지 않는다.

프로필은 요청값 → 저장된 명시값 → 기본값 순이며 저장 spec의 `styleProvenance`가 explicit/automatic을 구별한다.
