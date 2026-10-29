# 큰 문서·부분 수정·재열기의 검사 범위

큰 원화/경로를 반복 조회하지 않고 필요한 실제 개체를 검사할 때 읽는다.

- 평소 `vectora_inspect({documentId,view:"summary"})`로 문서·치수·개수와 자산 요약을 확인하고, 편집 대상은 `view:"component",componentIds:[실제 ID]` 또는 objectIds로 좁힌다. 전체 보존 비교·재열기는 지원되는 `view:"delivery",includeGeometry:true`를 우선해 포함 원화·경로의 큰 원시 데이터를 반복해서 받지 않는다. 이 view의 fingerprint는 편집 핸들이 아니므로 실제 경로/점 편집에 필요한 개체만 `view:"full",objectIds:[실제 ID]`로 확인한다. delivery 미지원이면 기존 full 경로를 사용한다. summary는 원시 개체·전체 spec이 아니며, 래스터 무결성 검사가 필요하면 지원되는 `rasterIntegrity:true`를 명시한다. full 자체는 래스터 검증을 보증하지 않는다.

- 레이어 목록의 대표색/썸네일 `fill`은 실제 선색이 아니다. 선색·선폭을 보정하기 전에 해당 개체의 실제 `stroke`·`strokeWidth`와 렌더를 확인한다. 채움 없는 경로의 목록상 회색 표시만 보고 정상 검정 선을 수동 수정하거나 기본값 결함으로 기록하지 않는다.

- `sinceRevision`은 같은 문서의 실제 검사 기준과 `sinceDocumentId`를 함께 사용한다. `delta.status:"delta"`의 changedIds/removedIds와 stateChanged를 읽는다. `fullRequired:true` 또는 `reset-required`면 전체 검사를 다시 수행하고 기준을 갱신한다. 다른 문서/연결의 캐시를 재사용하거나 변경 없음으로 해석하지 않는다. 변경 기록은 scoped/view 검사 이후 32 revision·4MiB 범위로 제한된다.

- 호출 스키마가 지원하면 생성·변경·저장·열기·내보내기·문서 목록의 `responseView:"compact"`로 완료/리비전/파일 경로를 받는다. 응답 요약과 위 inspect의 view는 별도 선택이다. 실제 개체 좌표·spec·경로가 필요한 검사는 해당 범위를 반환하는 view로 조회하며, compact에 생략된 정보를 없거나 검증 완료라고 추정하지 않는다.
