# Vectora MCP v1.3.2

평가원 일러스트 스킬의 분류와 문서 위치를 현재 자료 폴더에 맞췄습니다. 기존 제작 원칙을 옮기고 중복을 통합했으며, 앱과 MCP 실행 기능은 변경하지 않았습니다.

- **원문자와 밑줄 사이:** `㉠`·`㉡` 뒤에는 Vectora의 **Alt+Space 고정 반칸(U+2002)** 한 개를 사용합니다. 일반 공백으로 대체하지 않으며 원문자·반칸을 제외한 본문에만 밑줄을 적용합니다.
- **10개 유형·50개 세부유형:** `D1_Table`, `D2_Chart`, `D3_Graph`, `D4_Diagram`, `I1_Photo`, `I2_Illustration`, `I3_Map`, `ITA_TypeSwap`, `ITB_ImageSwap`, `ITC_Fixed`에 맞춰 문서와 참조를 재배치했습니다. 표는 6종, 지도는 12종이며 대화·문서·활동은 활자 교체형·그림 교체형·고정형으로 대응됩니다.
- **필요한 지침만 읽기:** 공통→유형→세부유형을 적용합니다. 세부 폴더가 없는 사진·삽화는 공통→유형 두 문서에서 끝납니다. 여러 유형에 적용되는 인물·말풍선·매체 외피·원본 보존 규칙은 조건부 공통 항목으로 통합했습니다.
- 기존 화풍·수치·배치·편집성·지도 프리셋·저장 및 JPEG 검수 규칙은 유지합니다. 사용자 원본 이미지와 글꼴 파일은 배포에 포함하지 않습니다.

## 설치·업데이트

Codex와 Claude 모두 **`narshacontents/vectora-mcp` GitHub 마켓플레이스**로 배포합니다. 설치된 플러그인은 각 클라이언트에서 업데이트한 뒤 새 세션에서 사용하세요. 이 릴리스만으로 현재 세션의 설치본이 자동 갱신되지는 않습니다.

- Codex: 운영체제에 맞는 `vectora-macos@vectora` 또는 `vectora-windows@vectora`
- Claude Code·데스크톱 Cowork 로컬 세션: `vectora@vectora`
- [설치 안내](https://github.com/narshacontents/vectora-mcp#readme) · [Claude 설치 안내](https://github.com/narshacontents/vectora-mcp/blob/main/CLAUDE_INSTALLATION.md)

수동 설치 ZIP·MCPB·개별 스킬 압축파일은 제공하지 않습니다. GitHub의 자동 Source code 압축파일은 설치 패키지가 아닙니다.
