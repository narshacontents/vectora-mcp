# Vectora MCP v1.3.5

요청의 구성요소에 필요한 지침을 준비하는 방식으로 평가원 스타일 스킬을 개편했습니다. 기존 3단계 문서를 일률적으로 읽지 않고, 공통 원칙·배치 recipe·조건부 요소·실행 계약을 중복 없이 연결합니다.

- **2028 예시문항 기준 조판:** 연속 본문과 표·축·라벨의 서체·장평·자간 역할을 구별합니다. 반칸, 괄호, 부분 밑줄, 문단 박스와 전체 원문을 보존합니다.
- **네이티브 편집 활용:** 지원 앱의 첫 줄 들여쓰기·고정 본문 열·본문 숫자 서식, 지도 옆 본문 흐름·경유 경로, 타원 벤 다이어그램·순위 도식을 우선 사용합니다.
- **첫 완성본과 납품 검수:** 실제 사용 폭과 저장된 JPEG를 직접 확인하고, .vectora 저장·재열기와 같은 이름의 JPEG 내보내기를 구별해 검증합니다. 생성기 성공을 시각 합격으로 대신하지 않습니다.
- **새 연결본의 기능 확인:** 새 기능은 Vectora 앱 1.4.6 이상에서 실제 공개 스키마를 확인합니다. 원화가 필요한 경우의 이미지 생성 도구와 웹 검색 도구는 이 플러그인에 포함하지 않습니다.

Codex의 macOS·Windows 플러그인과 Claude Code·데스크톱 Cowork 로컬 세션은 기존 GitHub 마켓플레이스에서, Gemini CLI는 같은 저장소의 Git 확장으로 설치·업데이트합니다. [클라이언트별 설치 안내](https://github.com/narshacontents/vectora-mcp#readme)

Gemini CLI 업데이트는 `gemini extensions update vectora`, 버전 고정 설치는 `gemini extensions install https://github.com/narshacontents/vectora-mcp --ref v1.3.5`를 사용합니다. 일반 웹 채팅 지원이나 기존 설치본의 자동 갱신을 뜻하지 않습니다. 별도 ZIP·MCPB·개별 스킬 압축파일은 배포하지 않습니다.
