## DEM 등고선

`vectora_production` create는 documentId/expectedRevision/requestId/spec, 기존 update는 실제 component id/patch/`policy:"preserve"`를 사용한다. 같은 재시도는 같은 requestId, 별도 편집은 새 ID다. stale/만료 응답은 inspect로 반영 여부부터 확인해 중복 create를 막는다. 적용 후 실제 featureObjectIds/역할 계층·binding·coverage·수동 편집과 report를 확인한다. 실패 시 revision/개체/선택의 복원을 확인하고 외부 새 revision을 되돌리지 않는다.

실제 고도는 출처와 좌표 범위가 확인된 EPSG:4326 격자를 `dem.grid`로 전달하고 `intervalM`으로 등고 간격을 정한다. 행은 북→남 순서이며 라이브 한도(현재 10,000표본)를 넘으면 출처·가공 해상도를 기록해 영역을 줄이거나 표시용 격자를 만든다. 해안선 원자료와 고도 자료의 해상도는 별개다. 작은 섬 확대에서 세계지도 해안선이 거칠면 상세 출처를 확보하고, 단순히 보존율을 올려 해결됐다고 판단하지 않는다.

라이브 계약이 지원하면 `dem.scale:{distanceKm:10,positionMm:{x:70,y:51.5}}`처럼 읽기 좋은 축척 길이와 빈 위치를 지정한다. 이 좌표는 crop/폭 적용 후 지도 컴포넌트 내부의 축척선 왼쪽 시작점이며 외부 배치 오프셋은 더하지 않는다. 예시 숫자는 고정 기본값이 아니다. 앱은 그 위치를 역투영해 WGS84 길이를 계산한다. 선·끝 눈금·8pt 끝값이 지도 안에 들어가는지 JPEG로 확인하고, 범위 밖 오류에는 위치나 길이를 바꾸되 자료 범위나 투영을 속이지 않는다. `dem.scale:{show:false}`는 생성 축척만 숨기며 생략은 기존 동작이다.

지도 테두리 안에 있어도 축척 끝점이 제공 DEM의 지리 범위를 넘으면 `DEM_SCALE_OUTSIDE_VIEW`로 거부될 수 있다. 위치를 유효 범위 안으로 옮겨 재생성하고, `map:scale`·`map:scale-zero-label`·`map:scale-label` 세 개체와 `0`·지정 거리의 km 표기, 두 라벨의 실제 8pt를 저장·재열기한 상태에서 확인한다. 재열기 동일성과 실제 JPEG의 눈금·문자 정렬·잘림 여부가 확인돼야 축척 검수 통과로 기록한다. 축척 기능의 통과를 전체 지도의 승인으로 확대하지 않는다. 해안 상세도·섬 선택·주제 자료가 미해결이면 전체 지도는 pending으로 남긴다.
