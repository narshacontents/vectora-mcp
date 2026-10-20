자산 경로 `assets/`는 이 스킬 루트 기준이다.

## 실제 프리셋에서 시작

1. `vectora_list_presets({})`를 category 필터 없이 조회해 UND 메뉴와 같은 현재 사용자 카탈로그의 실제 ID·이름·설명에서 범위·경계·도법·상세도에 맞는 항목을 고른다. 없는 group 필드를 만들거나 category/source를 지리 binding으로 해석하지 않는다. 목록·소스·planner 목록은 서로 다를 수 있다.
2. `vectora_map_plan({})`의 templates/capabilities와 대조한다. **선택한 기본 프리셋 ID = template.presetId**일 때만 그 `assetRef`로 plan을 조회해 defaultSpec·assetHash/sidecarHash·source/notes·registration·국가·roles·projection을 사용한다. 유사 이름/개인 프리셋을 임의 연결하거나 해시 오류를 우회하지 않는다.
3. 등록 production 경로는 `vectora_new_document`의 새 격리 문서에 같은 바탕의 관리 map을 한 번 create한다. 대응/도구가 없으면 `vectora_create_preset({presetId:실제 ID,name?:작업명})`의 일반 벡터 문서를 편집한다. 이미 연 일반 프리셋 위에 관리 지도를 중복 생성하지 않는다. 기존 관리 map은 inspect의 실제 component ID로 update한다.

등록 32종과 legacy `world_continents`의 부분 매핑을 구별한다. 32는 등록 기준선이며 현재 설치 목록/지원의 보증이나 고정 선택 제한이 아니다. legacy는 unregistered·CHN/JPN/KOR 부분 매핑이며 새 프리셋의 국가 ID를 넣지 않는다. 지원 여부는 버전/소스가 아닌 **연결본의 실제 capability**로 판정한다. geographic 등록만 WGS84 배치/재투영을 허용하고 unregistered는 원도법·문서 좌표에 한정한다. partial 국가 coverage는 영토/섬 완전성 보증이 아니다. `parts:["unclassified"]`이면 `islandPolicy:"all"`만 사용한다.

사용자 지정 별도 작업 파일은 우선한다. 그 외 library SVG나 `world_continents.vectora`를 직접 열기/import하여 프리셋 시작을 우회하지 않는다. 후보에 대상이 없으면 다른 적합한 실제 프리셋을 찾고, 목록 불가/후보 없음은 범위·상세도 한계로 남긴다. 검수용 기출·관찰 카탈로그·옛 측정표를 생성 의존성으로 삼지 않는다. `map-template-edit.py`는 명시된 프리셋 등록 준비 또는 사용자 지정 SVG 편집에만 사용하며 일반 제작의 프리셋 대체/투영 API가 아니다.

## 제작 전 상세도 확인 — 확대 삽입도뿐 아니라 모든 지도

작은 섬/좁은 해협의 특징이 몇 직선으로 뭉개지면 상세 등록 프리셋을 먼저 찾는다. 없을 때 출처·권리·시점·feature·CRS·투영/변환/control 정합을 검증한 외부 고해상도 공공 **원기하**를 보완 층으로 사용할 수 있다. 기존 원기하/clip을 보존한다. 확보/정합이 입증되지 않으면 상세도 미충족이며 저상세 확대를 통과시키지 않는다. 본래 직선/중세 개념도에 복잡한 선을 강제하는 규칙은 아니다.

`DETAIL_INSUFFICIENT`가 있으면 그대로 최종 바탕으로 확정하지 말고, 해당 범위·출력 크기에서 충분한 세부를 가진 후보를 다시 확인한다. 도법 변경·확대만으로 원자료의 상세도가 늘어나지 않는다. 적합한 바탕을 확보하지 못했으면 그 한계를 밝힌다. 형식상 `partial` 생성 가능과 시험지용 지리 표현의 통과를 구별한다.

## 출처·역할·지리 등록

- 등록본은 현재 source/notes/registration과 해시를 우선한다. 같은 ID의 외부 교체본에 옛 library 좌표·도법을 섞지 않는다. 일반 편집은 선택 프리셋과 대응이 확인된 `assets/maps/library/index.json` 항목의 manifest 하나와 SVG만 조사한다. source revision·권리·변경 표시·해시·resolution·projection·치수·viewBox·gaps를 실제 schema로 확인한다. CC BY-SA 파생 조건도 지킨다. manifest의 pending/nativeValidation은 새 작업의 검증 결과가 아니다.
- 일반 `vectora-map-template/v1` 국가 객체의 ISO/source feature/partIds를 실제 경로와 대조한다. source variant `vectora-map-source-variant/v1`의 countries는 ISO 문자열/빈 배열일 수 있으므로 객체 id/partIds 계약을 강제하지 않는다. 치수는 coordinateManifest, originalViewBox/outputViewBox 등 실제 필드로 읽는다. source group의 data-name·실제 이름/ID·기하로 역할을 식별한다. roles 개수/빈 그룹은 정보 존재 보증이 아니며 국가 자동 선택을 보장하지 않는다.
- 선택본의 현재 source/notes/projection/registration·해시·실제 역할을 근거로 판단한다. 같은 ID라도 교체된 자료의 좌표·시점·도법·권리를 옛 자산에서 가져오지 않는다. 사용자가 보관 원본 파일을 명시적으로 제공한 경우에는 그 파일의 메타데이터와 실제 기하를 따른다. 도법명 확인과 수치 좌표 등록/API 지원은 각각 검증한다.
- source feature ID와 native 편집 ID를 구별한다. 단일 자식 collapse는 inspect로 확인한 실제 ID만 쓴다. 누락 part ID만으로 면 누락을 단정하지 않고 이름·순서·상자만으로 국가를 추정하지 않는다. SVG data-*는 native에 보존되지 않으므로 출처/좌표/feature 대응은 manifest sidecar에 유지한다. 큰 지도는 inspect `includeObjects:false` 요약 후 필요한 `objectIds`만 geometry 상세로 조회한다.
- 해안·섬·본토·이웃 지역과 분리면을 보존한다. 강조 국가/대상 전체가 절단선 한쪽과 창 안에 놓이도록 지원 도법·중앙 경도·crop을 제작 전에 선택한다. 지도·강조·등록 기호에 같은 crop/이동/등방 배율을 적용한다. 투영은 확정 근거가 없으면 unknown이며 원형/수평 위선만으로 이름을 정하지 않는다. 원 SVG는 고정 투영 결과다. 잘라내기·회전·늘이기는 재투영/새 중심경도/날짜변경선 절단이 아니다.
- controlPoints.lonlat는 [경도,위도] degree, xy/expectedXY는 manifest가 지정한 원 SVG viewBox 좌표다. errorPx는 자산 검사이지 native 검증이 아니다. 같은 제어점에는 같은 변환을 적용하고 임의 지점은 같은 투영·파라미터·clipping을 계산하는 확인된 수단으로 변환한다. 제어점 선형 보간/화면 비율로 정밀 위경도를 놓지 않는다. extent=null인 극/반구를 경위도 사각형으로 해석하지 않으며 기록된 0–360 경도도 보존한다.
