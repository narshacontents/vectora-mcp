# 연속 통계 격자·등치선의 실행

연결 앱의 실제 `vectora://production/map/schema`가 `TemplateMapSpec.scalar`를 노출할 때만 native scalar를 사용한다. `scalar`는 `schema`, `id`, `grid`, `scale`, `interpolation`, `missing`, `legend`를 보존한다. `grid`의 `crs`, `registration`, `longitudes`, `latitudes`, `rowOrder`, 2차원 숫자/null `values`, `quantity`, `unit`, `provenance`를 그대로 전달한다. 좌표·행·값을 자동 정렬, 역전, 재표본화, 변환하지 않는다. `provenance.kind`의 `provided`와 `hypothetical`은 같은 이름의 task `dataSource`로 자동 연결한다.

live schema가 `scalar.paintDomain`을 지원하면 바다까지 관측값을 나타낼 때 `"all"`(생략 기본), 육지에만 채색하고 바다는 비워둘 때 `"land"`를 선택한다. `land`는 검증된 지도 육지·수역 면으로 등치면 채색만 잘라 내며 격자의 바다 노드·null·보간·척도는 바꾸지 않는다. 같은 map source의 값·범위·크기 변경으로 함께 재계산하게 하고 흰 바다 덮개를 별도 배치하지 않는다. 검증된 면 기하가 없는 양식이나 빈 육지 범위가 거절되면 적합한 등록 양식을 선택하며, `all`로 조용히 바꾸거나 누락 자료를 만들지 않는다. 미지원 앱에서는 필요한 보충과 이후 범위 편집 시 재생성 한계를 명시한다.

연속 분포의 육지에서 격자·해안 불일치로 생긴 작은 흰 틈을 없애야 하고 실제 결측 자체가 문제 단서가 아니면, live schema의 `scalar.missingPaint:"nearest-band"`를 사용한다. `paintDomain:"land"` 또는 `renderDomain:"selected"`의 검증된 육지에만 가까운 유효 구간의 색을 연장하며 원격자·null·수치·등치선은 그대로다. 바다·호수까지 채우거나 격자값을 복원한 것으로 해석하지 않는다. 생략/`"skip-cell"`은 기존 결측 표시다. 보완 범위를 제작 기록에 남기고 실제 JPEG의 해안·섬·빈틈을 확인한다. 유효 표본이나 검증된 면이 없어 거절되면 임의 사각형으로 덮지 않는다.

제공된 `scale.thresholds`와 `bands`의 순서·ID·색·라벨을 유지한다. `interpolation`은 `linear-triangles-sw-ne`, `missing`은 `skip-cell`이며 null은 0이 아니다. 고도/DEM, 임의 CRS, 자동 구간 추정과 다른 정량 지도층을 섞지 않는다. cell-centered raster를 node grid인 척 그대로 넘기지 않는다. 변환이 필요하면 원자료 geotransform의 각 픽셀 중심 위경도를 명시 노드로 추출하고 값·결측을 보존하며, 새 노드 사이 보간이라는 해석과 원 해상도를 기록한다. 시점은 사용자가 준 패널 라벨·캡션에 두고 grid에 없는 시점 필드를 만들지 않는다.

live schema가 `scalar.contours`를 지원하면 `mode:"lines"`는 선만, `"both"`는 기존 등치면과 선을 함께 만든다. 생략은 기존 등치면이다. 선은 같은 `scale.thresholds`·보간·결측 정책을 사용하므로 별도 임계값이나 DEM을 만들지 않는다. `domain:"all"`은 바다 포함, `"land"`는 검증된 전체 육지, `"selected"`는 `featureObjectIds`로 선택한 육지다. 회색 강조 국가 목록인 `verifiedIds`를 선택 영역으로 오인하지 않는다. `featureObjectIds`나 등치선 domain만으로 주변국의 공유 해안까지 제거되지는 않는다. 한 국가만 남기는 경우 live 계약에 `renderDomain:"selected"`가 있으면 등록 육지 ID를 `featureObjectIds`에 주고 이 모드를 사용한다. 바탕·외곽·등치면·등치선을 같은 선택 영역으로 제한하며 섬과 내부 수역은 보존한다. 미지원 앱에서 주변국 선이 남으면 적합한 바탕을 선택하거나 미충족으로 알리고 흰 사각형으로 덮어 성공 처리하지 않는다. 선의 domain과 면의 `paintDomain`은 별개이므로 둘을 함께 확인한다. 미지원 앱에서는 필요한 선·라벨만 보충하고 이후 재조판 한계를 밝힌다.

등치선의 `strokePt`는 해안·보조선과 읽기 위계를 보고 정한다. live schema가 `scalar.contours.stroke`를 지원하면 명시한 회색 `#RRGGBB`로 외곽과 구분할 수 있고, 생략하면 기존 검정이다. `labels.show` 기본은 숫자 표시이며 원 단위를 별도로 읽히게 한다. 생성기가 실제 문자와 작은 흰 받침을 함께 배치한다. 숫자가 겹치거나 해안에 너무 붙으면 `labels.positions:[{value,ratio}]`로 해당 값의 가장 긴 가시 선 위 위치만 조정한다(ratio0~1). 관리 자식 숫자를 직접 끌어 연동을 끊거나 값·격자를 바꾸지 않는다. 라벨 공간 부족 경고가 있으면 폭·범위·숫자 위치를 검토하며 필요한 숫자를 조용히 생략하지 않는다. 폭·범위·원자료를 수정한 뒤 선과 숫자가 함께 갱신되고 서로 가리지 않는지 실제 JPEG로 확인한다.

작은 등치선에 숫자를 넣기 어려우면 live schema의 `labels.callouts:[{id,value,positionMm:{x,y},anchor:{fragmentIndex,ratio}}]`를 사용할 수 있다. `positionMm`는 frameMm과 같은 지도 로컬 mm 좌표의 **실제 숫자 획 중심**이며 위경도나 프레임 비율이 아니다. `fragmentIndex`는 현재 가시 조각의 길이순 0부터, `ratio`는 그 조각을 따른 0~1 위치다(생략하면 가장 긴 조각의 가운데). 같은 값의 inline 숫자는 대체되며 `labels.positions`와 중복 지정하지 않는다. 격자·범위·투영 변경 후 실제 선에서 연결점을 다시 계산하지만, 고정한 숫자 위치와 조각 순위는 새 지리 형태에 적합한지 AI가 재검수한다. 사라진 등치값/조각의 unresolved 경고와 숨겨진 라벨을 성공으로 처리하지 않는다. 물리 8pt 숫자·작은 흰 받침·지시선 흰 테두리는 관리 개체에 유지하고 직접 자식 개체를 옮기지 않는다.

광역 분포의 명시적 일반화가 적절할 때만 `scripts/generalize_scalar_grid.py 원격자.json 표시격자.json --sigma-km 값`을 선택해 쓴다. 이 도구는 지역의 규칙적인 위경도 격자에서 거리·면적을 반영한 가중 평균을 만들며 원본·좌표·원래 결측을 보존한다. 출력 JSON과 변환 기록을 함께 보존하고, 표시격자를 선과 면의 공통 입력으로 사용한다. 강도는 고정하지 않고 최종 인쇄상 약0.5–1.5mm에 해당하는 거리부터 비교하되 작은 극값이 문제 단서이면 사용하지 않는다. 표시 값이 원시 값과 같다고 보고하거나 새 등치선에 예전 지시선 앵커를 재사용하지 않는다.

범례는 native 편집 가능한 UND 8pt다. `legend.maxWidthMm`가 있으면 실측 줄바꿈만 허용하고 글자 축소·절단은 하지 않는다. `highLabel`/`lowLabel`과 제목·구간 라벨을 보존한다. `widthMm`/`frameMm`은 계속 지도 viewport 치수이며, 오른쪽 범례의 실측 전체 경계는 별도로 계산한다.

지도 아래의 짧은 가로 범례는 live 계약이 지원하면 `scalar.legend.orientation:"horizontal"`을 쓴다. 낮은 값부터의 band 순서와 원자료 연결을 유지하며 항목 단위 줄바꿈·실제 잉크 중심 정렬을 이용한다. `maxWidthMm`는 지도 창 폭 안에서 정하고 제목·범례 문구를 바꾼 뒤에도 실제 가로 중심과 전체 폭을 확인한다. 생략은 기존 세로 목록이다. 이 항목형 범례를 구간 경계에 숫자가 붙은 연속 색띠와 혼동하지 않으며, 연속 색띠가 요구되면 해당 지원 여부를 따로 확인한다.

같은 척도를 쓰는 비교는 새 recipe를 만들지 않고 기존 isoline-map 자식들을 composition으로 묶는다. owner의 `composition.sharedScalar`가 quantity·unit·scale·legend의 유일한 편집 원본이며, `bindings[].target.childIds`는 stable composition child ID 경로다. 각 대상 map의 `scalar.scale`, `grid.quantity`, `grid.unit`은 owner와 일치하는 캐시이고 local `scalar.legend.placement`는 `none`이다. 격자와 값은 패널별로 독립 유지하며 척도·단위·범례를 자식별로 다시 편집하거나 복사하지 않는다.

native `composition.sharedScalar`가 공통 범례의 단일 소유자다. `production_plan`으로 범례를 한 번 측정하고, 사용자가 요청한 row/column 배치에서 지도 viewport·실제 8pt 라벨·지리 라벨·범례와 간격·패널 간격·캡션을 포함한 전체 bounds가 폭 예산에 들어가는지 확인한다. 패널 지도 viewport는 같은 물리 크기와 aspect ratio를 유지한다. `legend.maxWidthMm`는 측정된 줄바꿈 폭만 제한하며, UND 8pt는 고정한다. `widthMm`/`frameMm`은 지도 viewport 치수로 유지한다.

## scalar 미지원 앱에서만

- 지도 아래에 별도 수치 면을 보충하는 기존 방식은 현재 연결 앱의 지도 스키마가 `TemplateMapSpec.scalar`를 지원하지 않는 구버전에서만 조건부로 쓴다. 이 경우에도 source의 sea 역할과 `map.ocean` 배경을 구별하고, 실제 계층을 확인한 뒤 필요한 배경 개체만 조정한다. native scalar 지도에서는 바다 투명화를 하지 않는다. scalar 면은 불투명 바탕·육지·수역 채움 뒤, 지리선·라벨 앞에 native로 그려지며 map viewport clip을 따른다.
