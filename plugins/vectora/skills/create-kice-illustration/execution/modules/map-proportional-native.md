# 지도 위 수량 기호와 연결 범례

연속 수량 비례 원은 라이브 capabilities의 `mapProportional` 또는 `map.proportional`과 `vectora://production/map/schema`에서 `proportional` 지원을 확인한 뒤 **네이티브 지도의 연결 자료 기능을 우선 사용한다**. 등급 기호·막대·풍향 장미까지 지원한다고 추정하지 않는다. 미지원 표현은 검증된 바탕에 필요한 부분만 보충한다.

- 입력은 `schema:"vectora.map-proportional/v1"`, `records:[{id,value,anchor}]`, `referenceValue`, `referenceDiameterMm`, `unit`, `legend`다. 관측 ID는 값/순위와 독립적으로 유지하고, anchor는 확인한 위경도 또는 바탕 원문서 좌표다. 일반 point의 radius를 각각 계산해 연결 기능을 우회하지 않는다.
- 기준값과 그 값의 출력 지름을 처음에 정한다. 일부 값·지도 폭을 바꿀 때 이 기준을 유지하여 지도의 원과 범례가 같은 척도로 갱신되게 한다. 기호 전체 크기 변경을 요청했을 때만 기준 지름을 바꾼다. 양수의 최소 크기를 임의 보정하거나 새 최댓값에 맞춰 자동 정규화하지 않는다. 0과 `null` 결측은 모두 기호가 없지만 자료 의미는 구별하며 음수는 이 표현으로 제작하지 않는다.
- `legend:{id,placement:"below"|"right",layout:"nested"|"compact",gapMm,entries:[{id,value}],title?}`를 원과 함께 지정한다. 원문 단위는 `unit`에 유지하고 기본은 제목에 한 번 표시한다. 각 값에 반복해야 할 때만 `labelUnit:"each"`를 쓴다. 중첩형은 밑변을 맞춘 원과 서로 구별되는 인출선을 사용하며, 숫자가 많다는 이유로 임의 공용 세로선을 덧붙이지 않는다.
- 원의 중심을 문자 피하려고 옮기지 않는다. 자동 배치의 선호 offset은 비례 원·다른 문자를 피하면서 조정될 수 있으므로 단순 미세 배치에 고정 좌표를 강제하지 않는다. 실제 JPEG에서 큰 원 전체와 지명 사이가 읽기 좋게 떨어졌는지 확인한다.
- 지도 창의 `widthMm`와 범례를 포함한 완성 폭은 다르다. 오른쪽 범례의 폭을 먼저 예약하고, 아래 범례는 창 폭 안에서 조밀한 한 묶음으로 배치한다. 현재 스키마에 `legend.align`이 있으면 기본 가운데 정렬을 사용하고, 명시적으로 요청한 경우만 `left`/`right`로 바꾼다. 범례 내부 요소를 창 폭 전체에 억지로 벌리지 않는다. 생성 후 실제 전체 외곽·8pt·비례원의 검정 선(기본0.3pt)·불투명 회색 채움을 확인한다. 이 원의 선폭을 해안·국경까지 일괄 적용하지 않는다. 작은 원/겹침/창 밖 기호 경고는 해당 범위·척도를 재검토하라는 신호이며 좌표 이동·값 왜곡으로 숨기지 않는다.
- 값·범례값·범위를 수정할 때 같은 map component를 preserve update한다. records/entries 배열은 전체 교체이므로 미변경 자료와 ID도 보존한다. 저장·재열기 뒤 값과 지름·위치 대응을 확인한다. `categories`·단계구분 `thematic`·DEM과의 같은 spec 결합은 현재 지원하지 않는다. 여러 표현이 요청되면 실제 지원되는 별도 주제 구성으로 조립하며 임의로 하나를 삭제하지 않는다.

## 방향별 값의 다각형

실제 지도 schema에 `radial`이 있을 때 사용한다. 수량 비례 원의 `proportional`과 다른 계약이며, 별도 방사형 그래프를 지도 위에 얹는 방식보다 이 연결 기능을 우선한다.

- `schema:"vectora.map-radial/v1"`, `records:[{id,anchor:{kind:"geographic",longitude,latitude},values}]`, `angleOrder`, `startAngleDeg`, `clockwise`, `scale:"linear"`, `max`, `diameterMm`, `unit`, `rings`, `legend`를 준다. 위경도 등록이 검증된 바탕에서만 사용한다. `values`는 방위 순서와 길이가 같고, 0은 반경 0, `null`은 선의 끊김이며 결측이 있는 다각형은 채우지 않는다. 원자료를 임의 재정렬·정규화·제곱근 변환하지 않는다.
- 북쪽 시작·시계 방향이면 `startAngleDeg:-90,clockwise:true`다. `rings.values`는 증가하는 양수이며 마지막 값은 `max`와 같다. `rings.shape:"circle"|"polygon"`, `spokes`, `style.fill` 등 현재 schema 필드만 사용한다. 이 기능은 등각 간격의 방향별 다각형이며 지리적 진북의 도법별 회전 보정이나 방향별 부채꼴을 지원한다고 추정하지 않는다.
- `legend:{id,placement:"right"|"below",gapMm,title?,directionIndices?}`로 한 공통 동심원 키에 수치와 방위를 표시한다. 방위 라벨이 모두 필요하지 않으면 표시할 방위만 `directionIndices`로 고르되 원자료의 모든 방향·값은 보존한다. 좁은 공통 키에서 인출선이 길어지면, 라이브 schema가 지원하는 `legend.layout:"open-quadrant"`로 오른쪽 아래 사분면을 열어 수치를 짧게 붙인다. 이 옵션은 범례 조판만 바꾸며 지점 기호의 선형 0 기준을 바꾸지 않는다. 과밀 오류를 무시하거나 숫자·방위를 숨기지 않는다. 범례와 지점 기호는 같은 `max`·물리 지름을 쓰며 제목의 단위를 중복하지 않는다.
- 값 편집은 같은 ID의 `records`를, 지도 편집은 같은 map의 폭·범위·도법을 preserve update한다. 위경도와 고정 물리 지름이 함께 보존되는지 확인한다. crop 변경은 창 종횡비도 갱신하며, 창/투영 밖 지점을 보이게 하려고 위경도를 옮기지 않는다. 관측 위치의 라벨 겹침은 별도 label offset으로 해결한다.
- 지도 창 폭은 범례를 포함한 완성 폭이 아니다. 실제 공통 키와 관측 라벨을 측정해 전체 폭을 배분한 뒤 JPEG에서 숫자의 실제 잉크와 다른 원형 눈금·인출선의 겹침, 선 교차·잘림을 확인한다. 범례를 지도 높이에 맞추려고 내부를 벌리지 않는다. 원자료 수정 의뢰에서는 해당 꼭짓점과 연결선의 갱신을 확인한다. 전용 GUI 편집기 유무와 MCP 자료 갱신 가능 여부는 구별한다.
- 같은 척도의 비교 지도는 공통 키 하나를 쓸 수 있다. 두 지도 사이에 놓을 때는 제목·방위·수치를 포함한 실제 키 외곽을 양쪽 지도 사이 공간의 가운데에 맞춘다. 라이브 schema가 지원하면 나머지 지도의 `radial.legend.visible:false`로 중복 키만 숨기고, 모든 지도의 `max`·`diameterMm`·방위 순서·단위·눈금을 동일하게 유지한다. 별도 map 소유자 사이 척도 변경은 자동 동기화되지 않으므로 함께 갱신한다. 해안선이 기호 판독을 방해할 때 지원되는 `radial.style.backgroundFill:"#FFFFFF"`로 기호 바로 뒤만 차폐한다. 중심을 흰 원으로 덮어 0 기준이나 작은 값을 지우지 않는다.
