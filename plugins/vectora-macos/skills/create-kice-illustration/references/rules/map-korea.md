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
