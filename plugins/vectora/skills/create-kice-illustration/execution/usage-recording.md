# 요청·수정 결과의 필수 기록

납품과 별도로 다음 **기존 공유 폴더**에 기록한다. 사용자별 계정 루트 이름·운영체제 경로는 달라도 이 논리 경로는 바꾸지 않는다.

`/A4. 통사실험실/[C] 개별 PJT/vectora (Js)/스킬 사용 기록`

각 그림의 요청/수정 한 번에 **동일 본체 이름의 `.vectora`, `.jpeg`, `.json` 세 파일**만 저장한다. 한 요청에서 여러 독립 그림을 납품하면 그림마다 세 파일, 내부 재시도는 최종 검수본만 남긴다. 이전 버전은 보존한다. 납품 폴더가 따로 지정돼도 기록을 생략하지 않는다. 관련 요청 원문과 제작 해석을 구별하며 전체 채팅·인증정보·무관한 개인정보는 수집하지 않는다.

## 1. 제작 시작 전에

사용자에게 결과와 요청이 이 공유 폴더에 기록된다고 짧게 알린다. 스킬 루트에서 실행한다.

```sh
node scripts/usage_record.mjs preflight
```

이 도구는 macOS/Windows Dropbox 등록 정보와 macOS CloudStorage에서 기존 폴더를 찾고 한글 NFC/NFD를 동일하게 처리한다. 반환된 `root`를 이후 commit에 사용한다. 직접 위치를 지정해야 하면 `--root <확인한 전체 기록 폴더>`를 쓴다. 같은 이름의 임의 작업 폴더를 만들어 대체하지 않는다.

로컬 동기화 폴더가 없더라도 연결된 Dropbox에서 정확한 폴더를 조회하고 쓰기 권한을 확인할 수 있으면 원격 경로를 쓸 수 있다. 실제 연결 도구의 경로/권한 계약을 확인하며 API 토큰을 요구하거나 기록에 넣지 않는다. **로컬·원격 모두 폴더를 찾을 수 없거나 쓰기 불가이면 제작을 시작하지 않는다.** preflight 성공은 원격 업로드 증명이 아니다.

새 그림은 `illustrationId`, 각 요청은 `requestId`에 새 UUID를 발급한다. 같은 그림 수정은 illustrationId를 유지한다. 원 요청을 즉시 내부 JSON에 보존하며 출력 경로는 납품 후 채운다. 같은 요청의 저장 재시도는 같은 ID·시각·내용을 재사용한다.

## 2. 최종 결과와 이력 준비

앱에서 저장→재열기→JPEG 직접 검수를 끝낸 뒤 다음 입력을 작성한다. `prompt.verbatim`은 실제 의뢰 문구이며 제작자가 다듬은 프롬프트로 대체하지 않는다. 호출 에이전트가 원 의뢰도 전달했다면 관련 원문을 함께 보존하고 전달자/해석을 구별한다.

```json
{
  "requestId": "새 요청 UUID",
  "illustrationId": "그림 UUID",
  "requestedAt": "ISO 8601 시각",
  "action": "create",
  "prompt": {"verbatim": "실제 요청 원문", "origin": "user"},
  "interpretedBrief": "확정 내용·배치 의도·이번 변경 범위의 짧은 해석",
  "assumptions": ["미지정하여 제작자가 결정한 사항"],
  "outputs": {
    "vectora": {"path": "/실제/납품/그림.vectora"},
    "jpeg": {"path": "/실제/납품/그림.jpeg"}
  }
}
```

호출자가 AI이면 `origin:"calling-agent"`를 사용한다. `engine`, `skillVersion`은 확인한 값만 선택적으로 기록한다. 수정은 `action:"modify"`와 `--previous <앞선 이력.json>`을 쓴다. 같은 대화의 기록 ID를 재사용하고, 파일만 받은 경우 기존 기록의 납품 경로·출력 SHA-256과 대조해 앞선 버전을 찾는다. 이름만 같다고 합치지 않는다. 기록이 없는 기존 파일만 `baseline:{"path":"/기존/그림.vectora"}`로 연결하며 모르는 이전 프롬프트를 추정하지 않는다. helper가 revision·parentRequestId·누적 history·파일 크기/SHA-256을 계산한다.

```sh
node scripts/usage_record.mjs prepare --input <요청.json> --out <새 내부 기록묶음 폴더>
# 수정 시 위 명령에 --previous <이전 이력.json> 추가
node scripts/usage_record.mjs commit --bundle <내부 기록묶음 폴더> --root <preflight의 root>
```

결과 위치는 `archive/<illustrationId>/<requestId>/`다. 파일 본체 이름은 illustrationId이고 원 납품 이름/경로는 JSON에 남는다. 동일 ID·동일 내용은 재사용하고 충돌/부분 저장은 덮지 않는다. 입력 파일은 변경하지 않는다. 내부 준비 파일·검사 로그·업로드 영수증은 공유 폴더에 추가하지 않는다. JSON의 `vectora.skill-usage/v1`은 한 파일에서 이전 요청·변경 의도·각 버전의 결과 해시를 추적할 수 있는 누적 이력이다.

## 3. Dropbox 확인과 실패 처리

- 로컬 commit의 `synced-folder-written`은 동기화 폴더에 세 파일이 쓰였다는 뜻이다. 연결 Dropbox로 같은 원격 폴더를 다시 조회하여 세 파일의 이름·크기를 확인한다. 가능하면 내려받기/내용 해시도 대조하고 결과를 내부 영수증에 둔다. 원격 검증이 안 됐다면 동기화 대기로 표시하며 업로드 완료라고 쓰지 않는다.
- 로컬 동기화 경로를 못 쓰는 원격 연결은 prepare에 `--prepare-remote`를 붙인다. 정확한 기존 루트 아래 반환된 `archiveRelativePath`만 생성하고 연결 Dropbox 업로드로 세 파일을 올린다. 도구의 완료 상태와 원격 재조회를 확인한다. `remote-prepared` 자체는 업로드가 아니다.
- 동기화 지연/권한 변경/부분 업로드 시 결과물은 보존하고 기록 미완료를 알린다. 같은 requestId로 상태를 확인해 누락만 복구한다. 충돌한 원격 파일을 자동 덮어쓰거나 새 ID를 계속 발급해 중복 기록하지 않는다. 새 제작 요청은 기록 경로가 다시 정상인지 확인한 뒤 받는다.
- helper의 형식·해시 검사는 실제 그림 검수나 앱 재열기 검증을 대신하지 않는다. 작업자가 실패본을 통과본으로 기록하거나 앞선 요청을 새 생성으로 바꾸어 계보를 끊지 않는다.
