## 사용할 수 있는 생성 경로

legacy 연속 선은 폭 40–108mm, `dataFidelity:"exact"|"approximate"|"relative"`, `type:"line"`, `x` 라벨과 계열 `values`를 사용한다. compact의 전용 필드와 섞지 않는다. legacy `labelOffsets`는 문서 px다.

- 수치 함수는 충분한 실제 계산 샘플로 compact `chartStyle:"line"|"smooth-line"|"step-line"`, `type:"line"`, `dataFidelity:"exact"|"approximate"`, `categories`, `{id,label,values}` 계열을 쓸 수 있다. `xValues`는 categories와 같은 길이의 엄격 증가 수치 X좌표이며 `chartOptions:{xNumeric:true}`로 숫자축을 요청한다. 구조 스키마보다 세부 값/축 관계 검사가 추가되므로 실제 매핑을 대조한다. smooth-line 보간이 식의 교점·곡률을 바꾸면 그대로 쓰지 말고 해당 경로를 보정한다. 기본 파선·표식·범례는 실제 속성으로 검수한다.
- 앱은 실제 축/자료 획에 대한 글자 잉크 충돌을 측정하고 문자만 이동한다. 공간이 부족하면 미해결 진단을 반환한다. 저장 성공은 기술 결과이며 시각 검수 통과를 뜻하지 않는다. 갱신된 전달 검수 결과와 실제 JPEG를 전체 해상도 및 의도한 인쇄 크기에서 확인하여 값·관계·라벨과 겹침을 검수한다. `layoutDiagnostics`는 다시 계산될 수 있고 전달 검수는 편집 후 최종 기하를 검사한다.
- 엔진이 함수의 기본 의미·비선형 축·곡면·면적 경계를 표현할 수 없으면 실제 식/개형에 맞는 편집 가능 path·면·라벨을 직접 구성한다. 생성기 선만으로 표현되는 부분은 먼저 만들고 면·접선 등 미지원 부분만 보충한다. 원시 SVG도 자료와 편집성을 유지하며 가짜 지원 chartStyle을 만들지 않는다.

식/주어진 관계와 실제 교점·극값·절편·경계·면적을 대조하고, 파선·인출선·라벨·보충 개체의 매핑을 확인한다.
