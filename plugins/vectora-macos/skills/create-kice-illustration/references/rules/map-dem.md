## DEM 등고선

`vectora_production` create는 documentId/expectedRevision/requestId/spec, 기존 update는 실제 component id/patch/`policy:"preserve"`를 사용한다. 같은 재시도는 같은 requestId, 별도 편집은 새 ID다. stale/만료 응답은 inspect로 반영 여부부터 확인해 중복 create를 막는다. 적용 후 실제 featureObjectIds/역할 계층·binding·coverage·수동 편집과 report를 확인한다. 실패 시 revision/개체/선택의 복원을 확인하고 외부 새 revision을 되돌리지 않는다.
