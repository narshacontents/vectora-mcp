# Vectora MCP + 평가원 스타일 스킬 2.0.0

Codex·Claude는 **GitHub 마켓플레이스**, Gemini CLI는 같은 저장소의 **Git 확장**으로 설치합니다. Vectora 편집 도구와 다음 세 스킬이 함께 설치됩니다.

| 표시 이름 | 호출 이름 | 상태 |
|---|---|---|
| Vectora 벡터 편집 | `use-vectora` | 사용 가능 |
| 통합사회 평가원 스타일 일러스트 만들기 | `create-kice-illustration` | 사용 가능 |
| 통합과학 평가원 스타일 일러스트 만들기 | `create-kice-science-illustration` | 등록 정보만 있으며 본문은 비어 있음 |

기존 `create-kice-illustration` 호출 이름과 경로는 호환성을 위해 유지합니다. 통합과학 스킬은 자동 호출하지 않으며 제작 지침은 아직 제공하지 않습니다.

[출제 에이전트 연동 가이드](skills/create-kice-illustration/references/caller/exam-agent-guide.md)가 세 플러그인에 함께 설치됩니다. 표시 원문과 표시 금지 출제 맥락·정답을 분리해 의뢰하고, 제작자는 상태·실제 파일 경로·실측 mm·실행한 검사·미충족 조건을 응답 본문으로 전달합니다. 이 가이드는 출제 에이전트가 의뢰를 준비할 때 읽으며, 일반 제작자는 해당 작업의 단계별 지침을 따릅니다.

평가원 스킬은 자료형 분류 v3의 10유형·50세부유형을 검색·기록용으로 유지합니다. 제작할 배치와 구성요소를 선택하면 `prepare_task.mjs`가 설계·실행·검수 단계에 필요한 지침만 준비합니다. 공통 원칙, 제작 방식, 조건부 구성요소와 도구 계약은 각각 한 원본으로 관리하며, 인물·내부 표/차트·문단 박스 등의 실제 내용에 따라 연결됩니다. 고정된 파일 수나 분류 계층을 읽기 순서로 강제하지 않습니다. 원문자 뒤 밑줄 앞에는 Vectora Alt+Space의 고정 반칸(U+2002)을 사용합니다.

실제 자료로 그래프·지도를 요청하면 공신력 있는 원자료를 확인하고, 출처와 가공 방법을 밝히면서 시험지에 적합한 단위·숫자 표기·시각화 형식을 선택합니다.

기본 MCP 기능에는 Vectora 앱 1.0.0 이상, 등록된 지도 프리셋의 지리 편집·투영 기능에는 앱 1.1.10 이상이 필요합니다. UND v3.0 문서 호환 기능은 앱 1.1.11 이상에서 사용할 수 있습니다. 새 JPEG/PNG 회색조 래스터 내보내기는 Vectora 앱 1.2.0 이상이 필요합니다. 진행 상태 조회·단계 통지·체크포인트 자동 갱신/복구·경고가 있는 진단 미리보기는 앱 **1.3.0 이상**에서 사용할 수 있습니다. 네이티브 표·복합 조판(`composition`의 네이티브 블록·정확한 예약 영역), 승인 PNG/JPEG의 로컬 `rasterPath` 등록과 원화 제작 전 대화 조판 계획, 점진적 MCP 리소스·간결/변경 검사, 검사를 거친 평가원 `.vectora`·JPEG 납품에는 앱 **1.4.0 이상**이 필요합니다. 새 그래프 스키마와 자동 충돌 배치, 지도 지물 카탈로그·binding 보존, 표 세로 정렬, 108mm 맞춤, 혼합 문자·명시 굵기·예약 외곽·두루마리 개선은 앱 **1.4.2 이상**과 해당 live schema가 필요합니다. 앱 2.0의 `(가)`~`(하)` 표시, 네 가지 문자 프리셋, 비율 행간, 통합 문단 항목 고정은 현재 연결의 live schema를 확인해 사용하세요. 버전만으로 기능을 가정하지 말고 `vectora_status`와 현재 도구/스키마를 확인하세요. 구형 앱에는 지원하지 않는 필드를 보내지 않고 기존 편집·저장·재열기 경로를 사용합니다. 새 기능을 사용하려면 앱을 업데이트하고 MCP를 다시 연결하세요.

마켓플레이스 출처는 두 클라이언트 모두 **`narshacontents/vectora-mcp`**입니다. MCP 저장소는 공개이므로 다운로드용 GitHub 토큰이 필요하지 않습니다. Vectora 앱은 별도로 설치하며, 앱의 비공개 배포 권한과 업데이트는 별도입니다. 플러그인에는 앱이나 UND 글꼴 파일이 들어 있지 않습니다.

| 사용할 환경 | 설치할 항목 |
|---|---|
| Codex macOS | Vectora (macOS) · `vectora-macos@vectora` |
| Codex Windows | Vectora (Windows) · `vectora-windows@vectora` |
| Claude Code / 데스크톱 Cowork | Vectora · `vectora@vectora` |
| Gemini CLI (macOS / Windows) | Vectora · `vectora` 확장 |

## Codex 설치

1. 평가원 그림에는 UND v3.1과 UND v3.1 Batang을 사용합니다. Vectora 2.0의 별도 글꼴 폴더에는 두 서체의 Regular·Bold·Italic·BoldItalic, 총 8개 면이 있습니다. `(가)`~`(하)` 표시는 이 v3.1 서체에 통합되어 새 설치에는 v3.0 보조 글꼴이 필요하지 않습니다. 글꼴은 직접 설치하며 앱·MCP가 자동 설치하지 않습니다. 기존 v3.0 문서는 계속 보존됩니다.
2. Codex의 **플러그인 → 마켓플레이스 추가**에서 출처에 `narshacontents/vectora-mcp`, Git ref에 `main`을 입력하고 Sparse 경로는 비워 둡니다.
3. Vectora 마켓플레이스에서 운영체제에 맞는 **한 항목만** 설치합니다.
4. 새 대화에서 “Vectora 연결 상태를 확인해줘”라고 요청합니다. MCP와 세 스킬이 함께 표시되어야 합니다.

기존 ZIP·개인 마켓플레이스로 설치한 Vectora가 있다면 새 항목을 확인한 후 기존 항목을 꺼서 같은 도구가 중복되지 않게 합니다.

명령줄에서도 설치할 수 있습니다.

```sh
codex plugin marketplace add narshacontents/vectora-mcp --ref main
# macOS
codex plugin add vectora-macos@vectora
# Windows에서는 위 설치 명령 대신
codex plugin add vectora-windows@vectora
```

Codex 연결에는 별도 Node.js나 Python 설치가 필요하지 않습니다. Windows에서는 함께 설치된 PowerShell 실행기가 앱과 통신합니다.

## Claude 설치

Claude의 **Customize → Plugins → Add → Add marketplace → Add from a repository**에서 `narshacontents/vectora-mcp`를 추가하고 **Vectora**를 설치합니다. Cowork에서는 먼저 데스크톱 앱의 Cowork 탭을 엽니다.

Claude Code 명령줄에서는 다음 두 줄을 실행합니다.

```sh
claude plugin marketplace add narshacontents/vectora-mcp
claude plugin install vectora@vectora --scope user
```

MCP와 세 스킬이 함께 설치되므로 별도 스킬 ZIP 업로드가 필요하지 않습니다. Claude용 실행기는 Node.js 18 이상을 사용하며, Claude Code에서는 `node`가 PATH에 있어야 합니다. 설치 후 새 로컬 세션에서 Vectora 도구와 `/vectora:use-vectora`, `/vectora:create-kice-illustration`, `/vectora:create-kice-science-illustration`을 확인합니다.

**Vectora의 로컬 MCP는 Claude Code와 데스크톱 Cowork 로컬 세션에서 사용합니다. 일반 Claude 채팅·웹/클라우드 세션에서는 컴퓨터의 Vectora 앱에 연결되지 않습니다.** 계정에서 플러그인만 보인다고 로컬 도구가 연결된 것은 아닙니다. 설치 범위와 경로 문제는 [Claude 설치 안내](https://github.com/narshacontents/vectora-mcp/blob/main/CLAUDE_INSTALLATION.md)를 참고하세요.

## Gemini CLI 설치

컴퓨터에 Vectora 앱, Gemini CLI와 Git을 설치합니다. 새 평가원 작업에는 앱에서 설치·등록하는 UND v3.1과 UND v3.1 Batang을 사용합니다. 연결 실행기는 Gemini CLI에서 사용하는 Node.js를 실행합니다. 배포 확인 환경은 Gemini CLI 0.50.0입니다. 다음 명령을 터미널에서 실행하고 확장이 요청하는 MCP·스킬 사용 권한을 확인합니다.

```sh
gemini extensions install https://github.com/narshacontents/vectora-mcp
gemini extensions list
gemini skills list
gemini mcp list
```

새 CLI 세션에서 “평가원 스타일로 막대그래프를 만들어줘”처럼 요청하면 해당 스킬을 활성화합니다. `vectora` MCP의 실제 연결과 스킬의 설치 경로를 확인하세요. 같은 이름의 사용자·작업공간 스킬이나 수동 MCP 설정이 있으면 확장보다 우선할 수 있습니다.

**이 확장은 로컬 Gemini CLI용입니다. 일반 Gemini 웹 채팅에 업로드하는 패키지가 아닙니다.** 원화 이미지 생성 모델은 포함하지 않습니다. 새 인물·삽화 제작에는 현재 세션에 연결된 이미지 생성 도구 또는 사용자가 제공한 원화가 필요하며, 없는 경우 스킬은 미완료 조건을 알립니다.

Gemini는 일부 환경 변수를 필터링하므로 사용자 지정 앱 위치는 설치된 확장 루트의 `scripts/configure-app.sh` 또는 `scripts/configure-app.ps1`로 등록하세요. 셸의 `VECTORA_APP_PATH`가 전달된다고 가정하지 않습니다. 선택적 조판·추적 보조 프로그램은 `scripts/gemini/run-helper.mjs`로 함께 설치된 휴대형 실행본을 사용합니다. Python 감사 스크립트를 실행할 때만 Python 3가 추가로 필요합니다. 통합과학은 준비 중이며 자동 제작에 사용하지 않습니다.

설정 구조와 배포 방식은 [Gemini 공식 확장 문서](https://geminicli.com/docs/extensions/reference/)와 [배포 안내](https://geminicli.com/docs/extensions/releasing/)를 따릅니다. GitHub topic을 통한 갤러리 수집과 저장소 URL로 직접 설치하는 것은 별개입니다.

## 업데이트

마켓플레이스는 GitHub의 `main`에 게시된 파일을 가져옵니다. GitHub Release만 게시하면 기존 설치가 즉시 갱신된다고 보장하지 않습니다.

- Codex: `codex plugin marketplace upgrade vectora`로 목록을 갱신하고 사용하는 항목을 다시 설치한 뒤 새 대화를 시작합니다.
- Claude Code: `claude plugin marketplace update vectora`와 `claude plugin update vectora@vectora`를 실행합니다. 현재 세션은 `/reload-plugins` 또는 새 세션으로 반영합니다.
- Claude Code의 자동 업데이트는 `/plugin`의 Marketplaces에서 Vectora의 **Enable auto-update**로 켤 수 있습니다. 사용자 추가 마켓플레이스는 기본적으로 꺼져 있습니다.
- Gemini CLI: `gemini extensions update vectora`를 실행하고 새 세션을 시작합니다. 설치 시 `--auto-update`를 지정해 자동 업데이트를 선택할 수 있습니다. 특정 버전 고정은 설치 명령에 `--ref v2.0.0`을 추가합니다.

v1.0.4부터 GitHub Releases는 버전과 변경 안내를 기록합니다. 수동 설치 ZIP, MCPB, 개별 스킬 ZIP, 별도 설정 도구와 관리용 JSON을 릴리스 첨부 파일로 배포하지 않습니다. GitHub가 자동으로 표시하는 Source code 압축파일을 사용자가 직접 내려받아 설치할 필요는 없습니다. Gemini CLI가 설치 과정에서 저장소나 GitHub 소스 아카이브를 가져오는 것은 공식 확장 설치 절차입니다.

## 앱 경로와 연결

macOS의 `/Applications/Vectora.app` 또는 `~/Applications/Vectora.app`, Windows의 사용자 Programs 또는 Program Files 기본 위치에서 앱을 자동으로 찾습니다. 사용자 지정 경로는 `VECTORA_APP_PATH` 또는 다음 파일의 한 줄로 지정할 수 있습니다.

- macOS: `~/Library/Application Support/Vectora/mcp-app-path` — `Vectora.app`의 절대 경로
- Windows: `%APPDATA%\Vectora\mcp-app-path` — `Vectora.exe`의 절대 경로

경로 등록용 `scripts/configure-app.sh`와 `scripts/configure-app.ps1`은 해당 플러그인 안에 포함합니다. 별도 설치 파일로 배포하지 않습니다. 클라이언트가 연결하지 못하면 실제 앱 경로, 런타임, MCP 오류를 확인합니다.

MCP는 일반 편집 창의 미저장 문서를 자동 조작하지 않습니다. 작업 파일을 저장한 뒤 `vectora_open_document`로 열거나 새 문서를 만들어 작업합니다.

## 포함 기능

연결된 앱의 MCP 도구로 문서 생성·가져오기·편집·저장, 도형·경로·문자·곡률·양끝 화살표, 그룹·레이어·대지, 글꼴 확인·조판 측정, 프리셋, 그림 규격 검사와 이미지 내보내기를 수행합니다. 그래프 리소스는 현재 compact·legacy 스키마의 필드·범위·예제를 제공하고, 저장 성공과 unresolved 배치 검수를 구분합니다. 지원되는 native label layout은 실제 텍스트 ink와 축·자료 획을 검사하며, 실제 점·축·자료 좌표를 이동하지 않고 라벨을 배치합니다. 2·3집합 벤 다이어그램은 `layout: "venn"`을 우선 적용합니다. 옵션이 없으면 핵심 native 구조를 먼저 만들고 지원되지 않는 요소만 편집 가능한 요소로 보완합니다. 지도 지물은 `vectora_map_plan`의 canonical ID·별칭·현지명·연결 구간을 확인하고, 표는 native 셀·열 정렬을 사용합니다. 사용한 값·좌표·역할별 문자 스타일과 사용자 지정 설정은 보존하고 실제 JPEG를 별도로 직접 검수합니다.

지도 제작은 유형별 지침과 출처·manifest가 있는 바탕 자산 라이브러리를 참고하며, 먼저 `vectora_list_presets({})`에서 요청 범위·경계·도법·상세도에 맞는 실제 UND 프리셋을 선택합니다. W0/W1 관리형 경로는 연결본의 capability를 확인한 뒤 `world_continents`의 제한된 부분 매핑에만 적용합니다. 프리셋 목록이나 자산 라이브러리는 모든 지도의 자동 제작·관리 기능을 뜻하지 않으며, 최종 결과는 저장본 JPEG의 실제 크기와 확대 화면에서 검수합니다.

도형 위치·크기는 mm, 문자·선은 pt, 자간은 1/1000em, 행간은 %입니다. 새 평가원 제작에는 UND v3.1과 UND v3.1 Batang의 등록 문자 스타일을 본문·발언·표·라벨 역할에 맞게 적용하고, 같은 이름의 `.vectora` 원본과 기본 4배 `.jpeg`를 전달합니다. 한 단을 쓰는 자료는 약108mm를 기준으로 조판하며 글자를 모두8pt로 줄여 맞추지 않습니다. 사진은 흑백을 우선하되 적합한 컬러 원본도 사용하며, 편집 원본의 색은 유지하고 최종 JPEG/PNG에서 회색조로 내보냅니다. 이미지 생성 모델과 글꼴 파일은 플러그인에 포함하지 않습니다. Claude의 새 인물·삽화 제작 대안은 [Claude 원화 준비 안내](https://github.com/narshacontents/vectora-mcp/blob/main/CLAUDE_INSTALLATION.md#인물삽화-원화-준비)를 참고하세요.

## 유지보수와 릴리스

루트의 매니페스트·실행기·`skills/`가 원본이고 `plugins/`는 마켓플레이스에서 설치하는 생성본입니다. Gemini CLI는 루트 확장과 같은 원본 스킬을 읽습니다. 클라이언트별 도구·파일 경로 안내만 조정하고 평가원 화풍 규칙은 유지합니다. 로컬 작업은 `vectora-source/vectora-mcp`의 독립 저장소에서 수행합니다. 생성·검사에는 Node.js와 Python 3가 필요합니다. 아래 명령은 저장소에 포함된 의존성을 사용하므로 네트워크 설치를 하지 않습니다.

```sh
node scripts/build-marketplace.mjs
node scripts/build-marketplace.mjs --check
```

의존성을 변경할 때만 `node scripts/build-claude-runtime.mjs`로 고정된 npm 잠금파일과 Python 해시에 맞춰 내부 의존성 묶음을 다시 만듭니다. 이 내부 묶음은 설치파일이나 릴리스 첨부가 아닙니다. 의존성 변경 뒤 마켓플레이스 생성 명령도 실행합니다.

원본과 생성된 파일을 함께 커밋합니다. `--check`는 소스와 설치본의 불일치를 검사하며 네트워크 설치나 파일 수정을 하지 않습니다. 릴리스는 사용자 요청이 있을 때만 버전을 올리고 생성본을 갱신한 뒤, 필요한 검증·커밋·푸시·태그·GitHub Release 게시를 수행합니다. `node scripts/stage-release.mjs`는 깨끗한 소스와 생성본을 확인하고 게시할 설명문과 내부 검증 기록만 준비합니다. 설치 아카이브를 만들거나 업로드하지 않습니다.

[Codex 플러그인 공식 안내](https://developers.openai.com/plugins/build/plugins) · [Claude 마켓플레이스 설치](https://support.claude.com/en/articles/13837440-use-plugins-in-claude) · [Claude Code 설치·업데이트](https://code.claude.com/docs/en/plugins/install)

2028 예시문항 기준의 새 문단 배치·본문 숫자 서식·지도 흐름·타원 및 순위 도식은 **앱 1.4.6 이상**에서 실제 capability/schema가 노출될 때 사용합니다. 스킬은 요청한 구성요소에 필요한 규칙만 준비하고, 첫 완성본과 저장된 JPEG를 직접 확인합니다. 구형 앱의 미지원 기능을 임의의 문자 치환이나 글자 축소로 흉내 내지 않습니다.
