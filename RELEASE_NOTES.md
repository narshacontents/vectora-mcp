# Vectora MCP v1.3.4

Gemini CLI에서 Vectora MCP와 평가원 스타일 스킬을 같은 GitHub 저장소의 확장으로 설치할 수 있습니다. 기존 Codex·Claude 마켓플레이스 배포도 함께 유지합니다.

- **Gemini CLI 지원:** 저장소 루트의 확장 설정으로 macOS·Windows의 설치된 Vectora 앱을 연결하고 기존 스킬을 자동 발견합니다. 도구 이름·실제 스키마와 로컬 이미지 확인 방식에 맞춘 실행 지침을 추가했습니다.
- **동일한 제작 원칙:** 공통 → 유형 → 선택 세부 문서의 3단계와 인물 예외 문서를 유지합니다. Gemini를 위한 별도 평가원 원칙 사본을 만들지 않습니다.
- **휴대형 보조 실행:** 선택적 조판·추적·감사 스크립트는 함께 배포되는 의존성을 사용합니다. 이미지 생성 모델은 포함하지 않으며, 새 원화에 필요한 도구가 없으면 미완료 조건을 알립니다.
- **통합 배포 검증:** Gemini 설정·버전·실행기와 기존 클라이언트 배포본을 함께 검사합니다. 통합과학 스킬은 계속 준비 중입니다.

Gemini CLI 0.50.0의 격리 설치에서 세 스킬 인식과 MCP 연결을 확인했습니다. macOS의 실제 Vectora 1.4.3에서 편집 가능한 UND 한글 문서의 저장·재열기·4배 회색조 JPEG 출력과 이미지 확인을 마쳤습니다. Windows는 실행 인자와 경로 처리 검증 범위이며 실제 Windows 앱 실행은 이번 검증에 포함하지 않았습니다. Gemini 모델의 전체 일러스트 생성 품질을 검증한 결과는 아닙니다.

## 설치·업데이트

Gemini CLI의 터미널에서 설치합니다.

```sh
gemini extensions install https://github.com/narshacontents/vectora-mcp
```

설치 후 새 세션에서 사용합니다. 이후 업데이트는 `gemini extensions update vectora`로 받습니다. 특정 버전 고정은 설치 명령에 `--ref v1.3.4`를 추가합니다.

Codex는 `vectora-macos@vectora` 또는 `vectora-windows@vectora`, Claude Code·데스크톱 Cowork 로컬 세션은 `vectora@vectora`를 기존 GitHub 마켓플레이스에서 설치·업데이트합니다. [클라이언트별 설치 안내](https://github.com/narshacontents/vectora-mcp#readme)

Gemini 지원 범위는 로컬 CLI이며 일반 Gemini 웹 채팅 연결을 뜻하지 않습니다. 이 릴리스만으로 기존 설치본이 자동 갱신되지는 않습니다. 수동 설치 ZIP·MCPB·개별 스킬 압축파일은 제공하지 않습니다.
