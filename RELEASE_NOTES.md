# Vectora MCP 2.3.1

- Vectora 2.3.1(Rust) 앱과 함께 쓰는 판입니다. 스킬 지침은 2.2.3과 같습니다.
- MCP 실행기와 스킬 보조 명령이 Rust 실행 파일(`bin/vectora-mcp-launch`, `bin/vectora-skill`)입니다. Codex·Claude Code·Gemini CLI 모두 Node.js·Python·PowerShell 없이 연결합니다.
- 한 플러그인이 여러 운영체제를 맡는 경우(`vectora-macos`는 macOS·Linux, Claude 플러그인과 Gemini 확장은 macOS·Linux·Windows) `bin/`의 실행기가 운영체제와 CPU에 맞는 실행 파일(`bin/<플랫폼>/`, Windows는 `bin/*.exe`)을 고릅니다.
- 앱 위치는 이전과 같은 규칙으로 찾습니다: `VECTORA_APP_PATH`, 사용자 데이터 폴더의 `mcp-app-path`, 그다음 기본 설치 위치. Vectora 2.3.1 앱은 실행할 때 자기 위치를 `mcp-app-path`에 기록합니다.
- Vectora 2.3.1 앱은 아직 이미지 생성 키를 쓰지 않으므로 Vectora 이미지 생성 연결은 사용할 수 없다고 답합니다.

Codex와 Claude는 GitHub 마켓플레이스, Gemini CLI는 같은 저장소 루트의 Git 확장으로 설치합니다. 별도 ZIP/MCPB 설치본이나 개별 스킬 압축파일은 배포하지 않습니다. 플러그인 원본은 narshacontents/vectora-studio의 `rust/mcp-plugin`이며, 게시된 파일과 해시는 `vectora-release.json`에 있습니다. 원본 기출·사용자 결과물·테스트 그림·지도 원본·글꼴 바이너리는 배포하지 않습니다. GitHub Release 게시와 사용자의 설치본 업데이트는 별개입니다.
