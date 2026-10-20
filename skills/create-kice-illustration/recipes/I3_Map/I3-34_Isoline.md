# I3-34_Isoline — 등치선도

양적 주제도. 기온·강수량 등 통계값의 같은 값을 이은 선. 지형 등고선은 I3-12

좌표 노드의 통계값 지도는 `isoline-map`으로 분류한다. 연결 앱의 `TemplateMapSpec.scalar`는 채워진 등치면·단계 색칠에 사용한다. 정확한 등치선이나 선 라벨은 live schema/API 지원을 확인하고, 미지원이면 필요한 부분만 보충한다.

원 격자의 좌표 순서, `rowOrder`, 값과 null, 척도·단위, 시점 표기와 출처를 유지한다. 제공된 임계값·구간·라벨을 그대로 쓰고 자동으로 척도를 추정하거나 값을 고도/DEM으로 바꾸지 않는다. DEM 기반 등고선은 I3-12다.

단독 지도와 여러 지도 비교 모두 이 recipe를 유지한다. native scalar와 공통 비교 범례의 입력·측정·편집 계약은 `execution/modules/map-native.md`를 따른다.
