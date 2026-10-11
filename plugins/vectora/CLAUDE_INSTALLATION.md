# Vectora Claude 마켓플레이스 설치

Claude용 MCP와 세 스킬은 **GitHub 마켓플레이스의 Vectora 플러그인 하나로 설치**합니다. ZIP을 풀거나 MCPB·스킬 ZIP을 따로 등록하지 않습니다.

## 데스크톱 Claude / Cowork

1. Vectora 앱을 별도로 설치합니다. 새 글꼴 기능에는 앱 1.1.11 이상, JPEG/PNG 회색조 래스터 내보내기에는 앱 1.2.0 이상이 필요합니다. 진행 상태·단계 통지·체크포인트 자동 갱신/새 문서 복구·진단 미리보기에는 앱 1.3.0 이상이 필요하며 실제 도구/스키마 지원을 확인합니다. 네이티브 표·복합 조판(`composition`의 네이티브 블록·정확한 예약 영역), 승인 PNG/JPEG의 로컬 `rasterPath` 등록과 원화 제작 전 대화 조판 계획, 점진적 MCP 리소스·간결/변경 검사, 검사를 거친 평가원 `.vectora`·JPEG 납품에는 앱 1.4.0 이상이 필요합니다. 새 compact/legacy 그래프 계약과 지도 지물 catalog·물리 파선·보존 동작, 표 세로 정렬·108mm 경계 검수, 두루마리 기본/화면 variant, 최신 graph/map/table 저장·재열기 검수에는 앱 **1.4.2 이상**과 해당 live capability/schema가 필요합니다. 구형 앱은 기존 편집·저장 경로를 사용합니다. 새 기능을 쓰기 전에 앱을 업데이트하고 MCP를 다시 연결하세요. 기본 MCP 기능에는 1.0.0 이상, 등록된 지도 프리셋의 지리 편집·투영 기능에는 1.1.10 이상이 필요하며, 평가원 제작에는 UND폰트v3.0도 필요합니다.
2. 데스크톱 앱의 Cowork 탭에서 **Customize → Plugins → Add → Add marketplace**를 엽니다.
3. **Add from a repository**에 `narshacontents/vectora-mcp`를 입력합니다.
4. 추가된 Vectora 마켓플레이스에서 **Vectora**를 설치합니다.
5. 새 로컬 Cowork 세션에서 Vectora 연결 상태를 확인합니다. 실제 Vectora MCP 도구와 세 스킬이 로드되어야 합니다.

공식 문서에 따르면 플러그인에 포함된 로컬 MCP는 Cowork와 Claude Code에서 실행합니다. **일반 Claude 채팅이나 웹/클라우드 세션은 컴퓨터에 설치된 Vectora 앱에 연결되지 않습니다.** 조직 정책으로 로컬 MCP가 꺼져 있는 경우에도 사용할 수 없습니다. 실제 계정의 Cowork 설치·권한·도구 노출은 해당 환경에서 확인합니다.

## Claude Code

Node.js 18 이상이 PATH에 있는 로컬 macOS/Windows에서 실행합니다.

```sh
claude plugin marketplace add narshacontents/vectora-mcp
claude plugin install vectora@vectora --scope user
claude plugin list
```

`vectora@vectora`가 enabled인지 확인한 뒤 새 세션을 엽니다. `use-vectora`, `create-kice-illustration`(통합사회 평가원 스타일 일러스트 만들기), `create-kice-science-illustration`(통합과학 평가원 스타일 일러스트 만들기) 세 스킬 및 Vectora MCP가 함께 설치됩니다. 기존 통합사회 스킬의 호출 이름은 유지합니다. 통합과학 스킬은 등록 정보만 있고 본문은 비어 있으며 자동 호출하지 않습니다.

대화 안에서는 `/plugin marketplace add narshacontents/vectora-mcp`로 등록하고 `/plugin install vectora@vectora`에서 **Install for you**를 선택할 수 있습니다. 스킬은 `/vectora:use-vectora`, `/vectora:create-kice-illustration`, `/vectora:create-kice-science-illustration`으로 확인합니다. CLI 설치는 로컬 컴퓨터의 Claude Code에 적용되며 claude.ai 계정에 자동 등록되는 것은 아닙니다.

## 기존 설치에서 전환

기존 `vectora@vectora-local` 또는 별도 MCPB 연결을 사용하는 경우 새 마켓플레이스의 연결을 확인한 후 기존 연결을 끕니다. 중복 등록한 스킬도 새 플러그인에 포함된 세 스킬로 통일합니다. 기존 사용자 그림·프리셋·앱 설정을 지울 필요는 없습니다.

## 업데이트

```sh
claude plugin marketplace update vectora
claude plugin update vectora@vectora
```

새 세션 또는 `/reload-plugins`로 적용합니다. 자동 업데이트를 원하면 `/plugin → Marketplaces → vectora → Enable auto-update`를 켭니다. 외부 마켓플레이스의 자동 업데이트는 기본적으로 꺼져 있습니다. 업데이트 출처는 GitHub `main`의 매니페스트와 플러그인 파일이며 Release 첨부파일은 사용하지 않습니다.

## 앱을 찾지 못할 때

Vectora 앱을 기본 설치 위치에 두면 자동으로 찾습니다. 다른 위치라면 플러그인 안의 경로 등록 도구를 사용합니다. `<플러그인 경로>`에는 설치된 Vectora 플러그인 폴더를 넣습니다.

```sh
sh "<플러그인 경로>/scripts/configure-app.sh" "/Applications/Vectora.app"
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "<플러그인 경로>\scripts\configure-app.ps1" -AppPath "D:\앱 폴더\Vectora\Vectora.exe"
```

macOS는 `~/Library/Application Support/Vectora/mcp-app-path`, Windows는 `%APPDATA%\Vectora\mcp-app-path`에 실제 앱의 절대 경로 한 줄을 저장합니다. `VECTORA_APP_PATH`가 있으면 우선합니다. 앱 경로가 아니라 플러그인 폴더를 이 파일에 넣지 않습니다.

## 제작 시 확인

Claude가 실행하는 코드의 첨부 경로와 Vectora가 저장하는 로컬 경로는 다를 수 있습니다. 실제 Vectora MCP 도구와 입력 스키마를 먼저 확인하고, 글꼴·텍스트 측정·편집·저장을 MCP로 수행합니다. 일반 앱 창의 미저장 문서는 자동 연결되지 않으므로 저장한 파일을 MCP로 열어 작업합니다.

평가원 시각 규칙은 원본 스킬을 유지합니다. 로컬 보조 스크립트를 직접 사용할 때만 Node.js/Python 실행 환경이 필요하며, 포함된 의존성은 글꼴 파일이나 이미지 생성 모델이 아닙니다. 새 인물·삽화 원화에는 별도의 실제 이미지 생성 도구가 필요합니다. MCP가 연결되지 않은 세션에서 저장·재열기를 완료했다고 보고하지 않습니다.

## 인물·삽화 원화 준비

Vectora MCP는 그림을 편집하고 배치하는 도구이며 원화를 생성하는 모델은 포함하지 않습니다. Claude에서 스킬을 실행해도 이미지 생성 기능이 자동으로 생기지 않습니다. 현재 연결된 도구와 준비된 원화에 따라 다음 경로를 사용할 수 있습니다.

| 방법 | 작업 흐름 | 필요한 조건 |
|---|---|---|
| 외부 이미지 생성 MCP 연결 — 자동화 권장 | Claude가 스킬의 화풍·대상·포즈·참조 이미지 조건을 전달 → 생성 결과 검수 → Vectora에 이미지로 배치 | 별도로 연결한 생성 도구, 해당 서비스 인증·이용 요금, 필요한 참조 이미지·투명 배경 지원 확인 |
| 외부에서 생성한 원화 전달 — 즉시 사용 가능 | Claude가 생성 프롬프트와 조판 준비 → 사용자가 이미지 생성 서비스에서 원화 제작 → Claude에 전달하여 배치 | 생성한 PNG/JPEG와 Vectora가 접근 가능한 파일(앱 1.4.0 이상의 지원 연결에서는 승인 원화의 절대 rasterPath 우선) 또는 지원되는 data URL |
| 승인된 원화 재사용 | 사용자가 제공하거나 재사용을 명시한 인물·포즈 자산을 골라 조판 | 요청에 맞는 원화, 이용 권한, 식별 특징·화풍·해상도 검수 |

우선 별도의 이미지 생성 MCP를 연결하는 구성을 권장합니다. Vectora의 편집·저장 기능을 유지하면서 Claude가 생성과 배치를 이어서 수행할 수 있습니다. 이 저장소에 이미지 생성 API 연동은 아직 구현되어 있지 않습니다. 추후 Vectora 안에 직접 추가하려면 공급자 선택, API 키 보관, 호출 비용, 생성 대기·실패 처리와 이미지 전달 경로를 별도로 구현해야 합니다. Claude/ChatGPT 구독만으로 외부 생성 API 이용 권한이나 요금이 충당된다고 가정하지 않습니다.

인물 원화는 기본적으로 투명한 바깥 배경과 불투명한 흰 피부를 가진 PNG를 사용하고, 문자·말풍선·이름·자료 도형은 Vectora의 독립 편집 요소로 둡니다. 생성 도구나 원화가 없으면 프롬프트·조판까지만 준비하며 임시 얼굴을 완성 삽화로 보고하지 않습니다. 승인 원화도 새 포즈·장면까지 자동으로 만들 수 있다는 뜻은 아닙니다. 실제 사진은 합성 이미지로 대체하지 않으며, 흑백 사진을 우선하되 컬러 원본도 보존하여 최종 JPEG/PNG 내보내기에서 회색조로 변환합니다.

## 공식 문서

- [Claude의 GitHub 마켓플레이스 추가와 로컬 MCP 지원 범위](https://support.claude.com/en/articles/13837440-use-plugins-in-claude)
- [Claude Code 마켓플레이스 형식](https://code.claude.com/docs/en/plugins/create-marketplace)
- [Claude Code 설치와 업데이트](https://code.claude.com/docs/en/plugins/install)
- [로컬 MCP와 채팅의 차이](https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors)
