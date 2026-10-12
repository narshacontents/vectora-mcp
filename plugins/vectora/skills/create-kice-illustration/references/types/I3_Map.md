# I3_Map — 지도

공간 기준 위 위치·분포·영역·이동을 표현한다. 비복합 제작의 지침은 `SKILL.md → 이 문서 → 선택한 하위유형 한 문서`로 끝난다. 도구의 실제 스키마·응답, 선택 자산의 manifest와 실제 자료는 확인할 수 있으나 다른 실행/규칙 문서를 추가로 읽지 않는다.

## 핵심 정보로 한 하위유형 선택

| 세부유형 | 선택 기준 |
|---|---|
| [I3-11_Locator · 위치 지시도](../subtypes/I3_Map/I3-11_Locator.md) | 일반도. 칠한 면·그은 경계·점이 정답 후보 자리일 뿐이고 (가)·A~E로 '어디(어느 나라)인가'를 맞추게 함. 면을 칠했든 아니든, 범례가 수도·국경 기호뿐이면 여기 |
| [I3-12_Topographic · 지형도](../subtypes/I3_Map/I3-12_Topographic.md) | 일반도. 지형 등고선·하천·지도 기호의 대축척 지형도, 해발 고도 등고선 모식 |
| [I3-13_OldMap · 고지도·실물 지도](../subtypes/I3_Map/I3-13_OldMap.md) | 일반도. 기존 지도의 사진·스캔(옛 세계 지도, 대동여지도, 점토판). 표현 방식보다 우선 |
| [I3-14_Others · 기타 지도](../subtypes/I3_Map/I3-14_Others.md) | 일반도. 평면·배치도, 반구·지구본, 특수 투영 모식, 카토그램 |
| [I3-21_Area · 영역 구분도](../subtypes/I3_Map/I3-21_Area.md) | 질적 주제도. 범례·라벨·설명이 면이 무엇의 범위인지(언어권·암석·산업 지역·왕조 영역·빙하·호수 범위) 알려 주고, 그 범위·변화 자체가 정보 |
| [I3-22_Route · 경로·선 기호도](../subtypes/I3_Map/I3-22_Route.md) | 질적 주제도. 양 없는 선: 원정로·교역로·이동 경로·산줄기·사건 순서 |
| [I3-23_Symbol · 점 기호도](../subtypes/I3_Map/I3-23_Symbol.md) | 질적 주제도. 범례가 점 기호(●□△)에 범주를 줌 |
| [I3-31_Choropleth · 단계 구분도](../subtypes/I3_Map/I3-31_Choropleth.md) | 양적 주제도. 구역·격자별 음영 등급이 값의 구간 |
| [I3-32_Dot · 점묘도](../subtypes/I3_Map/I3-32_Dot.md) | 양적 주제도. 점 하나 = 일정량, 점 개수로 분포 |
| [I3-33_Proportional · 도형 표현도](../subtypes/I3_Map/I3-33_Proportional.md) | 양적 주제도. 지도 위 제자리의 원·막대·풍향 장미 크기·구성이 값. 지도 둘레에 따로 그린 차트를 지시선으로 이은 것은 D2 |
| [I3-34_Isoline · 등치선도](../subtypes/I3_Map/I3-34_Isoline.md) | 양적 주제도. 기온·강수량 등 통계값의 같은 값을 이은 선. 지형 등고선은 I3-12 |
| [I3-35_Flow · 유선도](../subtypes/I3_Map/I3-35_Flow.md) | 양적 주제도. 화살표 굵기로 이동 방향과 양 |

바탕 범위·국경·격자·원형 창은 정보 유형과 독립이다. 극중심 바탕의 단순 국가 위치 강조는 I3-11_Locator이며 도법 규칙은 이 부모 문서의 조건부 규칙으로 적용한다. 기본 라벨·범례·locator·확대창·같은 주제 비교 패널도 한 지도다. 독립적으로 판독하는 별도 주제 지도나 지도 둘레에 별도로 배치한 자체 축/수치 구조의 차트를 함께 요구하면 전역 복합 라우팅을 적용한다. 지형 입체도·단면도와 개념 자연물 그림은 실제 공간 분포 지도와 구별해 적합한 전역 유형으로 보낸다.

기존 지도의 사진·스캔은 I3-13_OldMap으로 분류하고 SKILL.md의 실제 원본 보존 규칙을 적용한다. 아래 프리셋 제작 절차는 새 지리 바탕을 제작·편집하는 경우에 적용하며 기존 고지도 사진을 현대 프리셋으로 대체하지 않는다.

## 실제 프리셋에서 시작

1. `vectora_list_presets({})`를 category 필터 없이 조회해 UND 메뉴와 같은 현재 사용자 카탈로그의 실제 ID·이름·설명에서 범위·경계·도법·상세도에 맞는 항목을 고른다. 없는 group 필드를 만들거나 category/source를 지리 binding으로 해석하지 않는다. 목록·소스·planner 목록은 서로 다를 수 있다.
2. `vectora_map_plan({})`의 templates/capabilities와 대조한다. **선택한 기본 프리셋 ID = template.presetId**일 때만 그 `assetRef`로 plan을 조회해 defaultSpec·assetHash/sidecarHash·source/notes·registration·국가·roles·projection을 사용한다. 유사 이름/개인 프리셋을 임의 연결하거나 해시 오류를 우회하지 않는다.
3. 등록 production 경로는 `vectora_new_document`의 새 격리 문서에 같은 바탕의 관리 map을 한 번 create한다. 대응/도구가 없으면 `vectora_create_preset({presetId:실제 ID,name?:작업명})`의 일반 벡터 문서를 편집한다. 이미 연 일반 프리셋 위에 관리 지도를 중복 생성하지 않는다. 기존 관리 map은 inspect의 실제 component ID로 update한다.

등록 32종과 legacy `world_continents`의 부분 매핑을 구별한다. 32는 등록 기준선이며 현재 설치 목록/지원의 보증이나 고정 선택 제한이 아니다. legacy는 unregistered·CHN/JPN/KOR 부분 매핑이며 새 프리셋의 국가 ID를 넣지 않는다. 지원 여부는 버전/소스가 아닌 **연결본의 실제 capability**로 판정한다. geographic 등록만 WGS84 배치/재투영을 허용하고 unregistered는 원도법·문서 좌표에 한정한다. partial 국가 coverage는 영토/섬 완전성 보증이 아니다. `parts:["unclassified"]`이면 `islandPolicy:"all"`만 사용한다.

사용자 지정 별도 작업 파일은 우선한다. 그 외 library SVG나 `world_continents.vectora`를 직접 열기/import하여 프리셋 시작을 우회하지 않는다. 후보에 대상이 없으면 다른 적합한 실제 프리셋을 찾고, 목록 불가/후보 없음은 범위·상세도 한계로 남긴다. 검수용 기출·관찰 카탈로그·옛 측정표를 생성 의존성으로 삼지 않는다. `map-template-edit.py`는 명시된 프리셋 등록 준비 또는 사용자 지정 SVG 편집에만 사용하며 일반 제작의 프리셋 대체/투영 API가 아니다.

## 출처·역할·지리 등록

- 등록본은 현재 source/notes/registration과 해시를 우선한다. 같은 ID의 외부 교체본에 옛 library 좌표·도법을 섞지 않는다. 일반 편집은 선택 프리셋과 대응이 확인된 `assets/maps/library/index.json` 항목의 manifest 하나와 SVG만 조사한다. source revision·권리·변경 표시·해시·resolution·projection·치수·viewBox·gaps를 실제 schema로 확인한다. CC BY-SA 파생 조건도 지킨다. manifest의 pending/nativeValidation은 새 작업의 검증 결과가 아니다.
- 일반 `vectora-map-template/v1` 국가 객체의 ISO/source feature/partIds를 실제 경로와 대조한다. source variant `vectora-map-source-variant/v1`의 countries는 ISO 문자열/빈 배열일 수 있으므로 객체 id/partIds 계약을 강제하지 않는다. 치수는 coordinateManifest, originalViewBox/outputViewBox 등 실제 필드로 읽는다. source group의 data-name·실제 이름/ID·기하로 역할을 식별한다. roles 개수/빈 그룹은 정보 존재 보증이 아니며 국가 자동 선택을 보장하지 않는다.
- 선택본의 현재 source/notes/projection/registration·해시·실제 역할을 근거로 판단한다. 같은 ID라도 교체된 자료의 좌표·시점·도법·권리를 옛 자산에서 가져오지 않는다. 사용자가 보관 원본 파일을 명시적으로 제공한 경우에는 그 파일의 메타데이터와 실제 기하를 따른다. 도법명 확인과 수치 좌표 등록/API 지원은 각각 검증한다.
- source feature ID와 native 편집 ID를 구별한다. 단일 자식 collapse는 inspect로 확인한 실제 ID만 쓴다. 누락 part ID만으로 면 누락을 단정하지 않고 이름·순서·상자만으로 국가를 추정하지 않는다. SVG data-*는 native에 보존되지 않으므로 출처/좌표/feature 대응은 manifest sidecar에 유지한다. 큰 지도는 inspect `includeObjects:false` 요약 후 필요한 `objectIds`만 geometry 상세로 조회한다.
- 해안·섬·본토·이웃 지역과 분리면을 보존한다. 강조 국가/대상 전체가 절단선 한쪽과 창 안에 놓이도록 지원 도법·중앙 경도·crop을 제작 전에 선택한다. 지도·강조·등록 기호에 같은 crop/이동/등방 배율을 적용한다. 투영은 확정 근거가 없으면 unknown이며 원형/수평 위선만으로 이름을 정하지 않는다. 원 SVG는 고정 투영 결과다. 잘라내기·회전·늘이기는 재투영/새 중심경도/날짜변경선 절단이 아니다.
- controlPoints.lonlat는 [경도,위도] degree, xy/expectedXY는 manifest가 지정한 원 SVG viewBox 좌표다. errorPx는 자산 검사이지 native 검증이 아니다. 같은 제어점에는 같은 변환을 적용하고 임의 지점은 같은 투영·파라미터·clipping을 계산하는 확인된 수단으로 변환한다. 제어점 선형 보간/화면 비율로 정밀 위경도를 놓지 않는다. extent=null인 극/반구를 경위도 사각형으로 해석하지 않으며 기록된 0–360 경도도 보존한다.

## 한국 지도: 정규 바탕과 자료 결합

한국 지도도 위의 정보 역할로 한 하위유형을 선택한다. 전국/지역/서울은 바탕 범위이며 별도 유형이 아니다. 선택 음영, 위치점, 단계구분, 비례 원, 이동선, 자연분포를 각각 같은 바탕의 독립 주제 객체로 조립한다. 자료가 필요한 유형을 일괄 미지원으로 분류하지 않는다. **재사용 바탕 + 검증 자료 + 실제 native 객체** 경로와 자동 생성 기능을 구별한다.

현재 개발 소스 카탈로그에서 확인한 선택 후보는 아래와 같다. 설치본의 지원 보증이 아니며 제작 때 list_presets와 map_plan의 같은 presetId 대응을 다시 확인한다.

| 바탕 | 실제 presetId | 단위·범위 |
|---|---|---|
| 대한민국 외곽 | `map-korea-outline-2025` | KOR 하나; 북한/한반도 전체 윤곽 아님 |
| 한반도/북한 외곽 | `map-korea-peninsula-ne10m`, `map-korea-north-outline-ne10m` | Natural Earth 10m 참고 외곽; 2025 행정경계 아님 |
| 전국 시도 | `map-korea-sido-2025` | 17 시도 |
| 전국 시군·자치구 | `map-korea-city-county-2025` | 229 단위; 일반시의 일반구 병합, 제주 행정시 보존 |
| 전국 일반구 포함 | `map-korea-sigungu-2025` | 252 단위; 229 바탕과 별도 선택 |
| 권역 | `map-korea-capital-2025`, `map-korea-chungcheong-2025`, `map-korea-honam-2025`, `map-korea-yeongnam-2025` | 각각 수도권·충청권·호남권·영남권 |
| 서울 행정 바탕 | `map-korea-region-11-2025` | 25 자치구; 한강 수역 없음 |
| 서울 + 한강 | `map-korea-seoul-han-2025` | 25 자치구 + 별도 OSM 원수역 면/강안선 |
| 개별 시도 | live 목록의 `map-korea-region-…-2025` | 선택 시도 안의 시군·자치구; 강원도는 확인된 `map-korea-region-51-2025` |

- 229 단위 바탕과 일반구를 분리한 252 단위 자료를 혼용하지 않는다. 일반구를 별도 면으로 보존한 개발 후보는 `map-korea-sigungu-2025`(252 단위)이며 실제 연결본 목록/plan을 확인해 선택한다. 세종·제주 행정시와 자치구의 법적 성격을 모두 같은 자치단체로 설명하지 않는다. 일반구 통계를 시 전체로 합치려면 해당 지표의 집계 가능성·분모·기준 연도를 검증하고 변환 근거를 남긴다.
- 대한민국 2025 행정 바탕의 source는 SGIS 유래 `vuski/admdongkor`, 경계 시점 2025-01-01, commit `dd1881663fcabc69b81393604e91ebf3a4202e9a`, CC BY 4.0(상위 KOGL 1유형)이다. 실제 source의 저작자·출처·권리 링크와 단순화/병합 변경을 표시한다. 공동 토폴로지 90m 단순화 자료는 정밀 해안·법적 경계 측정용이 아니다. coast 역할에 북쪽 육상 경계도 포함되어 법적 해안선으로 해석하지 않는다.
- `countryId`라는 API 필드가 시도/시군구도 담는다. 현재 시도는 `KR-SIDO-…`, 시군은 `KR-CITY-…`, 일반구 포함 바탕은 `KR-SGG-…`이지만 접두사/코드로 ID를 조합하지 않는다. 선택 plan의 countries에서 canonicalName·상위 지역·시점을 대조해 실제 ID를 가져오고 production 후 featureObjectIds 및 inspect의 native 경로를 확인한다. source 코드·part 경로 ID·native 객체 ID는 서로 다르다. 중구·서구·고성군처럼 이름이 겹치면 전체 지명과 상위 지역으로 결정하며 미확정 이름을 임의 선택하지 않는다.
- 군위의 대구 편입, 특별자치도 명칭, 시군 통합 등으로 옛 문항의 경계가 달라질 수 있다. 문항 연도를 경계 연도로 단정하지 않는다. 요구 기준 시점이 다르면 검증된 해당 시기 경계를 확보하거나 불일치를 남긴다. 현재 면의 이름만 옛 지명으로 바꾸어 역사 경계를 만들지 않는다.
- 현재 섬 좌표는 원위치이며 본토/섬 분류는 unclassified, coverage는 partial이다. islandPolicy는 all을 사용한다. 제주·울릉도·독도를 확대창에 넣을 때 원창과 확대창의 extent/clip/변환을 따로 유지하고 실제 위치와 표시 위치를 구별한다. 본지도 면을 라벨 공간으로 이동시키지 않는다. 섬 누락/상세도는 실제 geometry와 출력으로 확인한다.
- 전국 선택 음영+A–E·지시선, 서울 구 강조, 도시 위치점, 지역 통계, 권역 흐름은 반복 제작 틀이다. 바탕 경계·점 중심·선의 의미를 값/글자에 맞춰 바꾸지 않는다. 라벨은 UND v3.0 실효 8pt의 별도 객체이며 겹침은 라벨/인출선으로 해결한다. 범례·확대창·기호·주제선은 독립 편집한다.
- 북한/한반도 외곽은 Natural Earth의 고정 리비전 일반화 자료이며 정확한 시대 경계/국지 상세도를 보증하지 않는다. 서울 한강은 위 별도 변형에만 확보되어 있다. 그 외 하천/산줄기·교통망, 지질, 기선/영해, 과거 유로·고지도는 위 행정 바탕의 자동 산출물이 아니다. 등고선은 실제 DEM grid 입력이 있을 때만 제작할 수 있으며 자동 지형·정상 식별은 지원하지 않는다. 적합한 바탕/검증 자료의 실제 존재·좌표 정합을 확인해 필요한 층만 보완한다. 기출 이미지는 분석 corpus이며 그대로 배포하거나 신규 지도의 바탕으로 따라 그리지 않는다.

### 서울·한강과 출처 표시

- 구 선택 음영에서 한강은 바탕층이므로 area 하나를 선택한다. 기본 서울 바탕에 한강이 있다고 가정하지 않고, live 목록과 plan이 일치하는 `map-korea-seoul-han-2025`를 선택한다. 실제 water 면과 river 강안선, 행정경계의 독립 역할을 inspect로 확인한다. 흰 수역이 강조 면 위에 보이고 강안과 행정경계가 구분되는지 최종 크기로 검수한다. 행정경계 역할은 표시/숨김이며 UI의 자동 점선 변경 기능으로 설명하지 않는다.
- 한강은 Geofabrik/OSM 2025-01-01의 실제 riverbank polygon 2개를 독립 WGS84 bbox로 추출한 자료다. 중심선 버퍼·SGIS 경계로 만든 물면이 아니며 행정 자료의 CC BY/KOGL과 수역 DB의 ODbL을 별도 보존한다. 실제 geometry·구멍·강안과 지리 정합을 유지한다.
- 출력·공유에는 **© OpenStreetMap contributors**를 실제 **UND v3.0 실효 8pt 독립 텍스트**로 그림 근처 또는 동봉 설명에 표시한다. map.overlays label의 문서 anchor 또는 일반 native text로 구성하며, 문구가 바탕 도형에 이미 들어 있다고 가정하지 않는다. 글자를 윤곽으로 바꾸어 역투영한 가짜 지리 장식을 만들지 않는다. 지도 재투영/배율 변경 시 출처는 지리 도형과 분리된 페이지 조판으로 유지한다.
- OSM 권리 링크 `https://www.openstreetmap.org/copyright`, ODbL `https://opendatacommons.org/licenses/odbl/1-0/`, 원자료 `https://download.geofabrik.de/asia/south-korea-250101-free.shp.zip` 및 추출/변경 근거를 유지한다. 파생 수역 DB를 공유할 때 독립 ODbL 데이터와 해당 권리를 함께 제공하고 행정층 전체를 CC BY 단일 출처로 재표기하지 않는다. 선택 manifest의 waterDataset·layerRights를 따른다.

### 시점·통계 단위의 제작 예

- 수원·성남·용인 전체 강조는 경기도 31 시군 바탕의 실제 전체 시 feature를 선택한다. 252 일반구 바탕의 구 하나를 전체 시로 대체하지 않는다. 일반구 바탕이 필요하면 해당 시의 모든 구·분리면 대응을 확인한다.
- 2018 군위/대구의 선택 음영은 area + 검증된 2018 경계다. 단지 과거 연도라는 이유로 historical로 재분류하지 않는다. 2025 대구 면에서 군위를 빼거나 지명을 경북으로 바꾸는 것만으로 당시 전국 경계를 보증하지 않는다. 역사 경계의 변화·고증 자체가 주제일 때 historical을 선택한다.
- 통계+독도 확대는 statistics 하나에서 표 단위·시점·구간을 검증하고 본창/확대창에 같은 계급을 적용한다. 울릉 행정 feature가 독도 전용 ID나 충분한 섬 상세도 보증은 아니다. 확인한 분리면만 확대하고 독도를 새 통계 행으로 중복 집계하지 않는다.

한국 메타데이터는 `assets/maps/library/korea/index.json`에서 후보를 찾고 선택한 manifest의 실제 source·해시·단위·roles·검증 단계를 확인한다. 이 JSON은 자산 메타데이터이며 추가 지침 문서가 아니다. frozen-source 검증과 parentRuntimeValidation을 구별한다. macOS arm64 1.1.11 로컬 test packaged 앱(asar SHA-256 `d4338ef9484613ed840e6df4e64529a592fcdce1aca966983b8a474c8fb371a9`)에서 두 marketplace launcher의 28종 source/hash/catalog와 대표 6종(시도·서울11·수도권·북한외곽·서울한강·부산26)의 native 생성·clip·source embedded·저장/재열기·JPEG가 검증됐다. 서울11은 실제 UI spec 재사용·정규화 일치·undo/redo·partial detach/preserve도 확인됐다. 공식 설치 앱은 미갱신이다. 이 결과를 28종 모두의 native 작업 검증이나 323장 재현으로 확대하지 않는다. 구형 설치본의 실제 목록에 없거나 plan이 DATA_PACK_MISSING/blocked면 해당 연결에서는 제작 가능하다고 약속하지 않는다.

## production 계획·반영·보존

`map_plan`의 `featureCatalog`는 `canonicalId`, `aliases`, `localNames`, `role`, source `objectIds`, `connectedIds`를 담는다. canonical ID와 등록 alias/localName을 `featureRequests`에 넣고, source path UUID는 canonical ID 대신 표시용 `featureObjectIds`에 쓴다. 빈 `connectedIds`는 확인된 연결 인덱스가 없다는 뜻이지 지형이 연결되지 않았다는 증거가 아니다. 예를 들어 `river:Nile`, `Nile`/`nile`/`NILE`, 등록 localName `나일강`은 같은 feature를 가리킨다. `FEATURE_ALIAS_UNREGISTERED`(alias 미등록), `FEATURE_UNINDEXED`(식별자가 검증되지 않은 geometry), `FEATURE_UNAVAILABLE`(source geometry 없음), `FEATURE_NOT_SELECTED`, `FEATURE_PARTIAL_SELECTION`, `FEATURE_HIDDEN`을 구분하며, 해석 결과는 `report.featureResolutions`로 확인한다.

등록 관리 지도 루트의 `xMm`/`yMm`는 각각 −10000–10000mm 문서 좌표다. 명시한 위치는 `policy:"preserve"` 업데이트와 save/reopen을 거쳐 유지되므로, unchanged valid map을 갱신하려고 reset하거나 detach할 필요가 없다. 관리 경계 스타일은 `adminBorderStyle:"none"|"solid"|"dashed"`로 설정하고, `boundaryDashPt:[length,gap]`는 실제 출력의 물리 pt 단위(.1–100 각각)다. 생략 시 source 스타일을 보존하며 새 dashed 경계의 기본 패턴은 `[1.5,1]`이다. 연결된 native path는 업데이트와 재열기 사이에서도 dash phase를 이어간다.

실제 스키마를 확인하고 defaultSpec의 필요한 값만 수정한다. map spec의 식별 계약은 `kind:"map"`, `mapSchemaVersion:"vectora.map/v1"`, `mode:"template"`, assetRef/assetHash/sidecarRef/sidecarHash다. 새 등록 map defaultSpec은 공통 `styleProfile:"kice"`를 사용하며 `profileId:"kice-map"`만으로 기존 지도가 소급 스타일링되지는 않는다. 저장된 explicit 값과 사용자의 요청은 자동 KICE 기본값보다 우선한다.

- widthMm 기본 108, 현재 지원 1–108mm. 완성 폭은 별도 설명이 없으면 지시 문자/기호까지 포함한다. 범위 밖 요구를 조용히 108로 바꾸지 않는다. `cropDocumentMm:{x,y,width,height}`는 원문서 mm의 유한한 양의 대지 내부 범위, `frameMm`은 결과 지도 창이다. `s=창 폭/crop 폭`, `창 높이=crop 높이×s`로 동일 X/Y 배율을 적용한다. 폭/crop 변경 때 frame도 갱신하거나 create/plan에서 생략해 재계산한다. update 생략은 유지이므로 새 frame을 명시한다.
- 전용 대지에 완성 폭을 맞추면 `xMm:0,yMm:0` 등 실제 배치를 명시해 기본 오프셋 잘림을 막는다. 여백은 대지 치수에 포함하고 원점 포함 world bounds 네 변을 확인한다. 요청 종횡비는 **지도 창**에 적용하며 빈 대지 여백/비등방 왜곡으로 충족시키지 않는다. 도법/범위 때문에 불가능하면 미충족을 알린다.
- `verifiedIds`는 현재 바탕의 조회 feature ID(countryId 필드: 국가 또는 등록 행정구역), islandPolicy는 all/mainOnly/excludeIslands, borderStyle은 none/solid/dashed다. `styleProfile:"kice"`의 경계는 `boundaryStroke:"#000000"`, `boundaryStrokePt:0.3`, 단순 선택 음영은 `highlightFill:"#AAAAAA"`를 기본으로 한다. 바다색 요청이 없으면 원 바탕의 흰 배경을 유지하고 회색 바다를 요청했을 때 농도를 생략하면 `oceanFill:"#EEEEEE"`를 사용한다. `viewportPolicy:"source"|"kice-world"`는 명시 crop을 보존하고 `graticulePolicy:"source"|"major"|"none"`은 명시 layers를 보존한다. `layers:{역할:true|false}`는 실제 roles에만 사용하고 생략은 원가시성 유지다. internal-border 가시성과 borderStyle을 구별한다. Source sidecar의 `stylePolicy[objectId]:"preserve"|"profile"`은 지정된 source object의 의미 있는 sea/coast/boundary 스타일을 프로필이 덮어쓸지 제어한다. `preserve`는 해당 원본의 프로필 재스타일을 막고, 명시적인 사용자 oceanFill/boundary 색·폭은 우선한다. River, plate-boundary, movement 및 thematic 주제 선폭은 경계 0.3pt 프로필로 정규화하지 않는다.
- overlays label/point의 document anchor `{kind:"document",xMm,yMm}`와 별도 anchors는 **원문서 mm**, crop 안 위치다. label은 `placement:"auto"|"fixed"`, `leader`, `haloMm:0..1`, `offsetMm:{x,y}`를 지원한다. point는 `radiusMm`, `fill`, `stroke:"#RRGGBB"|"none"`, `strokeWidthPt`를 지원하며 KICE 빈 원은 흰 채움·검정 0.3pt 외곽이다. label/point의 `provenance:{source,reference,elevationM?}`는 표시 근거를 보존한다. ID를 유지하고 배열 patch는 전체 교체임을 고려한다. geographic anchor `{kind:"geographic",longitude,latitude}`는 WGS84 경도 −180~180°, 위도 −90~90°이며 바탕과 같은 투영/반구 clip을 적용한다. 뒤쪽/창 밖 점을 보이게 하려고 좌표를 바꾸지 않는다.
- `projection`은 원설정을 복사해 수정한 **완전한 객체**로 create/update하며 내부 일부만 patch하지 않는다. name/parallels 지원은 live capability로 확인한다. rotate=[경도회전,위도회전,롤]·center는 degree, 중심 경도 λ는 rotate[0]=−λ다. scale/translate/clipExtent는 원문서 96px/in 좌표, clipAngle은 degree/null이다. clipAngle=null은 구면 각도 제한 없음, 최상위 projection=null은 원도법 복원이다. 변경 시 지도·등록 주제층·geographic anchor를 동일 재투영하고 중심/clip/crop/frame을 함께 확인한다. document anchor는 따라가지 않으므로 재검수한다. 도법 변경은 없는 나라·LOD·자료를 생성하지 않는다.
- 원자료 이미지 px/aspect는 측정값이며 DPI 없는 px를 제작 mm로 추정하지 않는다.
- plan transform.xPx/yPx와 내부 recipe 값은 문서 px다. mm=px×25.4/96이며 화면 px가 아니다. *Mm 필드에 px를 넣거나 production을 apply.units로 다시 환산하지 않는다.

최신 inspect의 documentId/revision/실제 계층/production.components를 확인하고 `vectora_map_plan({documentId,spec})`의 정규화 spec·sourceHashes·selectedPaths·report를 검토한다. `report.readiness`는 `ready|partial|blocked`; plan의 `render`, `save`, `reopen`, `export`는 아직 `notRun`이다. partial 사유를 남기고 blocked는 적용하지 않는다. plan은 삽입·revision 변경·자료 등록·폰트/렌더 검증이 아니며 selectedPaths의 소스 UUID는 편집 ID가 아니다.

### 지도 지물 요청과 DEM 자료

- `featureRequests:["요청한 지명·하천 등"]`는 검증된 map source에서 조합한 feature catalog에서 찾는다: sidecar `features`의 canonical ID/name/aliases/localNames/connectedIds, `countries`의 canonical ID·name·registered aliases·source path IDs, 그리고 hash가 일치하는 승인 preset에서 확인한 정확한 native river leaf name. 같은 이름의 river sections는 함께 묶지만 상·하류·지류 관계나 원자료에 없는 alias는 추론하지 않는다. generic Path/경로 같은 이름은 지명으로 쓰지 않는다. 외부 지오검색 API/별도 MCP search command는 없다. `featureObjectIds`를 생략하면 원래 선택을 유지하며, 배열을 주면 derived catalog에 등록된 source object ID만 표시 대상으로 고른다(`[]`는 없음). `report.featureMapping[요청문자열]`은 해석된 전체 object IDs를 보존하고 `report.issues`에서 `scope:"feature"`, `id`, `code`를 확인한다. `FEATURE_UNAVAILABLE`은 일치하는 feature도 미색인 후보 geometry도 없을 때, `FEATURE_UNINDEXED`는 land/river/water geometry는 있지만 검증된 feature identity가 없어 이름을 확인할 수 없을 때 반환되므로 자료 부재로 단정하지 않는다. `FEATURE_NOT_SELECTED`/`FEATURE_PARTIAL_SELECTION`은 식별된 경로가 미선택/일부 누락, `FEATURE_HIDDEN`은 표시 꺼짐이다. unresolved issue가 있으면 `report.readiness:"partial"`로 남기며 선택 경로만으로 전체 지물이 있는 것처럼 답하지 않는다.
- 등고선은 검증 가능한 제공 자료를 `dem`으로 받는다: `dem:{grid:{schema:"vectora.dem/v1",crs:"EPSG:4326",columns,rows,extent:[west,south,east,north],elevationsM,resolutionM,provenance:{source,reference,license?}},intervalM,extent?,projection,requirements?}`. `elevationsM`는 북→남 행 순서의 `columns*rows` 고도(m) 배열이며 결측은 `null`; 최대 10,000개 샘플이고 앱은 자동 resampling/fetch를 하지 않는다. `extent`는 grid 안의 WGS84 범위, `projection`은 지도의 실제 유효 투영과 같아야 한다. 결과는 제공 고도에 근거한 편집 가능한 `map.contour`와 가능한 경우 축척이며 고도와 provenance를 유지한다. `requirements:[{id,kind:"peak"|"crater",minimumDiameterM}]`의 상세 크기가 해상도에 부족하면 `DEM_RESOLUTION_UNSUPPORTED`, 자료 해상도가 있더라도 자동 봉우리/분화구 식별은 `DEM_TERRAIN_IDENTIFICATION_UNSUPPORTED`로 미지원 사유를 반환한다. 미관측 지형·표고·정상을 만들어 채우지 않는다.

`vectora_production` create는 documentId/expectedRevision/requestId/spec, 기존 update는 실제 component id/patch/`policy:"preserve"`를 사용한다. 같은 재시도는 같은 requestId, 별도 편집은 새 ID다. stale/만료 응답은 inspect로 반영 여부부터 확인해 중복 create를 막는다. 적용 후 실제 featureObjectIds/역할 계층·binding·coverage·수동 편집과 report를 확인한다. 실패 시 revision/개체/선택의 복원을 확인하고 외부 새 revision을 되돌리지 않는다.

preserve는 수동 스타일·고정 위치·부분 detach를 존중하며 미리보기/reset 전환과 실제 결과가 같다고 가정하지 않는다. 관리 원경로 이동·내부 view 변형·비균일 상위 배율/skew는 binding을 무효화할 수 있다. invalid에 preserve를 강행하거나 사용자 초기화 의도 없이 reset하지 않는다. 독립 편집 요청 대상만 실제 component/자식 ID로 detach한다. 부분 detach는 재생성에서 제외, 전체는 binding 제거다. 원자료 누락/미래 스키마의 unresolved 정적 그림을 자동 fetch/재생성하지 않는다.

## 경계·일반 편집·클립

- 바탕/수역/면/강조/해안/국경/행정 경계/자연·통계 주제선/격자/기호/문자/범례/clip을 독립 역할로 보존한다. 실제 존재하는 svgGroupIds와 inspect 계층을 대조한다. 국경 없음은 해안 제거가 아니며 국경 정책·분쟁·시점을 임의 보정하거나 강조 테두리로 의미를 바꾸지 않는다. 수역색은 요청에 맞추며 단독 윤곽의 빈 배경을 바다로 단정하지 않는다. stroke 없는 실루엣에 해안을 자동 추가하지 않는다.
- 일반 문서에서 역할 자식 path 선택 후 style을 적용한다. 국경 dash는 `strokeDashArray:[]` 또는 요청한 양의 길이 배열, sea는 면 fill 또는 실제 대지 background다. 현재 visibility 확인 후 layer visible 토글/선택 hide를 사용하며 style.visible이나 unrelated showAll을 쓰지 않는다. 그룹 fill이 자식 명시 fill을 덮는다고 가정하지 않는다.
- world_continents 출처임이 확인된 경우에만 숨은 회색 강조 면을 실제 위치/ID/분리면 대조 후 bringFront하고 해안/국경을 위에 보존한다. 흰 육지 전체를 앞에 올려 강조를 가리지 않는다. 일반 국가 면 양식은 대응이 확인된 모든 자식 fill을 바꾸며 위 bringFront 방식을 전용하지 않는다. 별도 highlights는 경계 아래 둔다. 해당 바탕의 AAA/EEE 색을 모든 지도에 강제하지 않는다.
- 일반 문서 crop는 변환한 바탕/강조와 맨 위 mask를 clip하고 창 밖 원기하를 보존한다. mask는 문서 좌표이므로 clip 후 그룹만 이동/축소하지 않고 정합을 확인하거나 변환 후 재clip한다. native map의 상대 clip/고정 frame과 혼용하지 않는다. 선택 상자와 보이는 창은 다를 수 있어 테두리는 창에 맞춘 독립 선, 문자/인출선은 clip 위에 둔다.
- 지도만 확대/축소할 때 독립 문자·범례를 함께 늘이지 않는다. 상위 transform으로 전역의 고정 실효 8pt가 달라지는 위험을 확인한다. 필요한 선의 최종 실효 굵기/선종류·면 농도와 기호 크기를 확인하고 수량 선폭은 의미를 유지한다. 작은 영역의 기본 인출선은 0.3pt이며 도시 점/화살촉을 자동으로 달지 않는다. 북쪽표·축척·경위선·제목은 근거 없이 장식하지 않고 축척은 해당 도법/위치/최종 배율 근거가 필요하다.

## 라벨·범례와 정보 강약

- 위치 기호의 중심과 지리선은 실제 자료에 고정한다. 문자 잉크가 점·해안·국경·등고선과 겹치면 라벨만 빈 공간으로 옮기고 필요시 짧은 인출선으로 연결한다. 불가피할 때만 핵심 지형 정보를 가리지 않는 최소 바탕색 halo/짧은 선 끊기를 허용하며 원기하·데이터 좌표는 보존한다. 큰 흰 덮개로 가리지 않는다. 인출선 끝은 해당 지점/영역 안에 두고 불필요한 우회·교차를 줄인다. 문자·기호·인출선은 별도 개체로 유지한다.
- 범례는 섬을 포함한 지리 윤곽과 겹치지 않는 공간에 예약한다. 설명 상자도 대상 가까이 배치하되 지리 정보를 가리지 않는다. 보조 국경·격자는 주제 면/기호·지시선보다 약하게 두며 핵심 판독에 필요한 지리선은 보존한다.

## 조건부 확대·패널·보완 자료

- locator/inset은 원범위와 확대창의 관계를 정확히 표시하며 연결선을 이동 경로와 구별한다. 각 창의 바탕·mask·좌표 등록·배율을 따로 기록하고 같은 주제 비교에는 공통 척도/등급/범례를 우선한다. 독립 척도면 표시한다. 다른 관찰 방향/도법은 해당 조건의 별도 검증 바탕이 필요하다.
- production magnify의 sourceId/sourceRegionMm/targetRegionMm은 문서 범위 `{xMm,yMm,widthMm,heightMm}`를 원형으로 복제한다. LOD/새 도법을 만들지 않는다. 사각 view는 별도 작업본·경로·clip으로 조립한다. 패널·원자료 이미지·라벨·범례를 독립 편집 가능하게 두며 잘린 프레임 조각을 새 패널로 추정하지 않는다.
- 작은 섬/좁은 해협의 특징이 몇 직선으로 뭉개지면 상세 등록 프리셋을 먼저 찾는다. 없을 때 출처·권리·시점·feature·CRS·투영/변환/control 정합을 검증한 외부 고해상도 공공 **원기하**를 보완 층으로 사용할 수 있다. 기존 원기하/clip을 보존한다. 확보/정합이 입증되지 않으면 상세도 미충족이며 저상세 확대를 통과시키지 않는다. 본래 직선/중세 개념도에 복잡한 선을 강제하는 규칙은 아니다.
- 실제 래스터/위성영상은 원자료 그대로 포함하고 문자·범례는 벡터로 둔다. import/crop/늘이기는 재투영·warping이 아니다. 없는 자연자료를 imagegen/임의 등치선으로 대체하지 않는다.
- native 선이 있어도 실제 출력에서 지리선이 흐리면 통과가 아니다. 필요시 같은 원지리 벡터에 동일 변환·정확한 창내 clip을 적용한 독립 native 선 overlay로 보완할 수 있으나 자동 기능으로 가정하지 않는다. 래스터 따라그리기·눈대중 단순화·원기하 삭제/clip 해제로 숨기지 않는다. 중첩 변환은 선 스타일을 먼저 정해 같은 배율을 적용하고 재열기 정합이 깨지면 원프리셋부터 복구한다.

전역 검증 단계에서 지도별로 대상·값·단위·범례·anchor/인출선 끝·섬/해협·projection/extent/동일 배율·경계 의미·수역색·패널 척도·네 변 잘림을 최종 크기와 확대 화면으로 대조한다. ready/issues 없음은 자동 라벨–점/테두리 회피나 시각 통과 보증이 아니다. binding·수동 편집·자료 이미지·clip의 재열기 보존과 실제 JPEG의 지리선 선명도를 확인한다. 재열기에서 binding/도형 연결이 invalid이면 외관이 남아 있어도 보존 성공이 아니다. 앱 기능이 부족하면 미지원 범위를 보고하고, 실제 지원되는 프리셋 일반 편집·검증된 자료 보완 경로로 가능한 부분을 진행한다. 앱 개발로 해결 범위를 넓히지 않는다. 조판 성공·출력 결함·미수행 검증을 구별한다.

지원 composition 안 지도는 할당 영역에 맞춘 frameMm의 비례 크기로 조판하되 기존 crop/projection/anchors와 8pt 지도 표기를 유지한다. 지리 관계를 임의로 이동하여 조판을 맞추지 않는다. scoped component 검사와 실제 최종 렌더에서 위치·범례·표기 대응을 재확인한다. 무지원이면 기존 지도 컴포넌트와 편집 조판을 사용한다.


## 위치·점·라벨이 있을 때

- 같은 크기의 원/사각/삼각/기호는 위치·범주이며 수량 비례로 추정하지 않는다. 작은 장소의 타원/국지 영역 표시는 국가 전체 채움·자연 경계와 구별한다.
- 등록 좌표 또는 바탕에서 확인한 위치에 기호 **중심**을 맞춘다. 고정 anchor를 이동해 겹침을 해결하지 않는다. 부가 수치는 의미·단위를 명시한다.
- 라벨의 실제 잉크 상자와 점 외곽 사이 약 **0.7–1.5mm**를 시작 간격으로 쓴다(보편 강제값 아님).
- 문자·인출선·기호를 분리하고 필요한 기호 범례만 둔다. 화살촉 없는 기본 관계/비교 연결에 이동 방향을 부여하지 않는다.
- 일반 add의 ellipse/polygon/path와 독립 text는 자동 위경도 변환이 아니다. 문서 anchor와 등록 좌표를 구별하고 바탕 배율 변경 후 기호 중심/크기·인출선의 대응을 확인한다.

## 한국 지도 적용

한국 정규 예: 대한민국 윤곽 또는 시도 바탕에 도시·산의 검증 좌표를 geographic point anchor로 놓고 별도 label을 붙인다. 이름만으로 좌표를 추정하지 않는다. 지시선만 요구한 시군 참조에는 불필요한 도시 점을 추가하지 않는다. 북한 지점은 남한 외곽 바탕으로 대체하지 않는다.

## 면 채움·무늬·면 라벨이 있을 때

- 동일 회색 국가 강조·서로 다른 명목 범주·국경과 무관한 산업/문화 영역을 구별한다. 농도 차이로 수치 등급을 추정하지 않는다. 사용자 정의 영역은 제공 윤곽이나 근거 있는 자료로만 만든다.
- 명목 범주는 채움·점/선무늬·범례로 구별한다. 중복 범주의 겹침과 복수 대응을 유지하며 순서 있는 수치 단계로 바꾸지 않는다.
- 면 내부 라벨 또는 바깥 인출선을 크기에 따라 선택한다. 한 라벨로 본토/여러 섬을 식별하면 필요한 여러 인출선을 쓴다. 인출선은 도시 점과 별개다.
- 무늬는 확인한 대상 폴리곤 전체에 적용한다. live production create의 `spec:{kind:"pattern",sourceId,pattern:"dots"|"hatch",spacingMm,…}`와 실제 지원 dotDiameterMm/strokePt/angle·옵션/상한을 스키마로 확인한다. source 면·윤곽 복제·marks 순서와 mask를 검수한다. 같은 국가의 분리면도 빠짐없이 대응시키고 무늬가 영역 밖으로 새지 않게 한다.
- SVG pattern 보존을 가정하지 않고 실제 점/선 개체와 clip 또는 확인된 편집 대안을 쓴다. 채움/marks 위의 필요한 해안·국경·작은 섬 윤곽을 보존한다.
- 범례는 지도와 **같은 점 간격·해칭 각도/굵기·채움**의 독립 샘플+문자다. 임의 축소로 무늬 밀도를 바꾸지 않는다.

## 한국 지도 적용

한국 정규 예: 전국 시군·자치구 중 지정한 지역을 회색으로 채우고 A–E를 붙인다. 실제 countryId를 verifiedIds로 plan/create하거나 inspect에서 대응한 모든 분리면에 native fill을 적용한다. 서로 다른 범주의 색/무늬는 각 대상 면의 일반 편집으로 처리하며 단일 highlightFill이 자동 다범주 채움이라고 가정하지 않는다. 행정경계와 산업/문화권 윤곽은 별개다.

서울 강남·서초 강조에서 한강이 필요하면 별도 서울+한강 바탕을 실제 목록/plan으로 선택한다. 수역은 바탕 역할이므로 지형도 하위 문서를 추가로 읽지 않는다. 흰 물면·강안선·행정경계의 겹침과 독립 OSM 출처 텍스트를 부모 문서 기준으로 검수한다.

## 경로·연결·이동이 있을 때

- 무방향 지점 묶음/쌍 연결도 포함한다. 연결 관계와 이동 의미를 구별하고 제공된 출발·도착·방향·경유·시점·수량만 표시한다. 빈/채운 원이나 양끝 점의 범례가 방향을 정의하면 그대로 따르며 양방향을 일방향으로 바꾸지 않는다.
- 관계 직선·실제 경로·대권 연결을 구별한다. 임의 곡선을 실제 항로/최단거리로 설명하지 않는다. 이동량은 정의된 굵기 단계/비례 굵기와 범례로 표시하며 문체상의 선폭을 수량으로 추정하지 않는다.
- 교차/겹침은 곡률·레이어·라벨 간격으로 해결하되 출발/도착 anchor를 보존한다. 촉의 실제 끝과 기호 중심을 대조한다.
- 일반 path의 끝별 arrowStart/arrowEnd는 방향이 주어진 끝에만 적용한다. 무방향은 촉 없는 선이다. 날짜변경선은 등록 도법으로 분할해 화면 양끝을 잘못 잇는 긴 선을 막는다.
- 같은 바탕/투영에 검증된 경로 SVG는 보완 가능하나 MCP의 대권 계산/날짜변경선 자동 분할을 실제 지원 전 가정하지 않는다.

## 한국 지도 적용

한국 정규 예: 권역/전국 바탕에 검증한 출발·도착 anchor를 놓고 독립 native path와 필요한 끝 화살촉·수량 범례를 만든다. 개념 이동 연결이면 그 의미로 조립하고 실제 도로·철도·하천 경로 요청에는 검증한 선 geometry를 사용한다. mapbuilder가 이동표에서 경로 geometry를 자동 산출한다고 주장하지 않는다.

## 통계 자료가 있을 때

- 공간 단위·자료 시점·값·단위·결측을 맞춘다. 국가/행정구역을 혼용하지 않고 하위 경계가 없는데 국가 경로로 소지역 값을 대신하지 않는다. 표 행 ID와 검증 feature ID를 명시적으로 대조하고 미매칭/중복을 남긴다. 자동 join/단계구분/기호 생성/통계 갱신은 실제 지원 전 주장하지 않는다.
- 래스터 명암은 지표별 방향을 확인한다(인구밀도 검정=높음과 야간 빛 흰색=많음 등). 원자료·농도 방향·단위·범례를 보존한다.
- 단순 범례/수치 라벨/통계 기호는 선택한 지도 하위유형 안에서 처리한다. 지도 둘레에 별도로 배치한 자체 축/구성비/수치 구조의 독립 차트는 전역 복합으로 라우팅하며 native 생성기로 기본 구조를 만든다. 비교 패널은 등급·원 크기·차트 축을 공통화하거나 차이를 명시한다.

## 한국 지도 적용

한국 정규 예: 229 단위 바탕과 같은 시점·단위의 통계표를 명시적으로 대조한 뒤 구간별 native 면 채움 또는 검증 위치의 독립 원을 만든다. map create/update는 바탕·선택·anchor 관리이며 통계 join/계급 계산/값 변경에 따른 주제 객체 자동 갱신은 아니다. 252 일반구 행을 229 면에 그대로 연결하지 않는다. 자료 미확정 행은 남기고 검증된 행의 조판은 진행한다.

## 자연 자료층이 있을 때

- 하천·호수·산지·해구·해령·판 경계·기후선은 국가 경계와 별도 자료/선종류다. 해령 눈금·단층 상대운동·측정점은 독립 기호이며 실제 roles로 필요한 층만 선택한다. 자연 분포는 국가 경계를 가로지르므로 국가 채움으로 대체하지 않는다.
- 미제공 주제명을 식생/기후/작물 등으로 확정하지 않는다. 등치선은 값·단위·시점·선 간격을 갖춘 자료로 만든다. 계절 수렴대·고도선·기후 경계에 임의 곡선을 사용하지 않는다. 해안 확대는 하천·섬·갯벌 범위·상세도·축척 근거를 확인한다.
- 실제 위성/항공영상·밀도 래스터의 범례·캡션·식별 문자는 독립 조판한다. 좌표/범위가 등록된 자료가 부족하면 해당 층을 미충족으로 남기고 가능한 자료 배치·범례 작업을 진행한다.

## 판 구조·빙상의 자료 의미

- 판 경계·열점·이동 표시는 선택한 자료의 source/notes에 기록된 시점·역할·기호 의미를 따른다. **2018 자료도 현재 관측 자료라고 가정하지 않는다.** 해령/발산·수렴·섭입·보존 경계·방향·열점·조산대를 구별하고 필요한 층만 켠다.
- 원지도에서 등록한 이동 화살표/열점 기호를 수치 측정용 벡터라고 단정하지 않는다. 재투영 후 방향·폭·위치를 출력으로 확인하고 선택 자료의 원저자·라이선스·변경 표시를 보존한다.
- **PaleoMIST 20 ka 모형 빙상**과 **GLACIMONTIS 지역별 최종 빙기 최대 범위**는 동시점 자료가 아니다. 정확히 20 ka만 요구하면 GLACIMONTIS paleoglacier 층을 숨긴다. 선택본의 현대 참고 해안/국경을 빙기 해안으로 설명하지 않으며 고해안 요청에는 해당 시기·좌표가 검증된 별도 자료가 필요하다.

## 한국 지도 적용

한국 정규 예: 검증된 기온/강수 등치선·지질 면·하천/산줄기·DEM 등고선을 같은 좌표 기준의 바탕에 독립 주제층으로 결합한다. 행정 바탕에 자연자료가 포함되거나 등고선이 자동 생성된다고 가정하지 않는다. 국지 지형도는 해당 해상도와 시기의 실자료를 확보해 축척/범례 틀을 재사용한다. 영해/기선은 해안의 단순 offset으로 만들지 않고 기준 기점·시점·계산 근거를 확인한다.

## 역사적 지리 자료가 있을 때

- 시대·출처·대륙/수역 구분·중심 장소·방위 관습·표기 체계를 확인한다. 현대 해안/국경으로 자동 교체하지 않는다.
- 재현 요청은 사용자 원자료를 확인한다. 새 개념도는 제공 내용 관계로 구성하며 옛 검수 예시를 생성 참조로 불러오지 않는다.
- 실제 역사 경계·문명 영역은 해당 시점과 표현 목적에 맞는 출처의 윤곽/위치를 검증한다. 현대 지리 바탕의 정확성과 역사 영역의 고증은 별개다. 현대 국가 채움이나 임의의 각진 다각형으로 대체하지 않는다. 자료 기반 개략 범위가 허용되는 요청에만 근사를 명시하고, 정확한 경계 재현에는 근사를 쓰지 않는다. 자료가 없으면 확보를 진행하고 미확인 범위를 남긴다. 빙상의 자연 범위 자체가 핵심이면 I3-21_Area로 분류한다.

## 한국 지도 적용

한국의 과거 해안·1910년대 유로·고지도식 기호는 기준 시대와 좌표/개념 표현을 먼저 확인한다. 현대 행정 바탕은 명시한 참고층으로만 쓸 수 있으며 과거 경계/유로를 대신하지 않는다. 시대별 실자료가 확보되면 바탕+독립 역사 주제층+문자/범례 틀을 재사용하고 고증이 없는 부분은 미확정으로 남긴다.

## 도법·좌표·방위·시간을 표현할 때

도법/좌표/방위/시차 자체가 핵심이면 I3-14_Others로 분류한다. 다른 주제의 극중심 바탕에도 해당 조건만 적용한다.

- 경위선은 없음/일부/전체 중 필요한 표현만 둔다. 가장자리 위도 눈금만 있으면 전체 격자를 자동 추가하지 않는다. 방사선·동심원·적도 외곽은 실제 투영 관계에 근거하며 테두리가 적도라는 근거 없이 명명하지 않는다.
- 지구본 경위선은 요청 간격을 우선하며 미지정이면 핵심 경도·위도를 읽을 수 있는 성긴 간격을 선택한다. 경위도/극점 라벨은 해당 기준선과의 대응을 유지하고 모호하면 짧은 인출선으로 연결한다.
- 시차/업무 시간은 기준 도시/경도·날짜·서머타임 적용 여부를 확인하고 원호·시각 눈금·선종류 범례를 분리한다. 거리/방위/면적은 도법 성질과 측정 근거로 판정하며 화면 거리/원형 외관으로 등거리/등면적을 주장하지 않는다.
- 선택본의 현재 projection·등록 근거·live capability로 도법과 좌표 계산 가능 범위를 판단한다. 고정 SVG의 도법명은 위경도 등록/재투영 API 지원을 뜻하지 않는다. 적합한 바탕/엔진이 없으면 필요한 자료/기능을 남기며 확인된 외부 변환 수단의 실제 입력/출력만 사용한다. crop/그룹 회전을 새 투영으로 대체하지 않는다.

## 한국 지도 적용

한국의 중심 지정 방위도법 예에서는 중심 위경도와 도법을 실제 자료대로 설정하고 지원 엔진의 좌표 결과로 동심원·지점을 조립한다. Mercator 행정 바탕을 원형으로 crop하여 정거방위도법으로 부르지 않는다. 중심에서의 거리만 보존하는 조건을 전역 축척으로 확장하지 않는다. 요구 도법 API가 없으면 검증된 외부 변환 결과를 사용하거나 미충족으로 남긴다.
