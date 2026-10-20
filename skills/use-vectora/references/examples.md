# MCP 명령 예

ID/버전은 실제 도구 응답으로 바꾼다. 도구 이름 앞의 MCP 서버 접두사는 클라이언트에 따라 붙는다.

## Graph production schema 예제

앱 1.4.2 이상에서 compact와 legacy graph branches가 노출되는지 live schema로 확인한다. compact는 `chartStyle`과 `categories`를 사용하고 legacy는 `chartStyle`을 생략한다. 두 입력을 섞지 않는다.

Compact line:

```json
{"kind":"graph","type":"line","chartStyle":"line","styleProfile":"kice","widthMm":65,"dataFidelity":"exact","categories":["A","B","C"],"series":[{"id":"a","label":"자료","values":[10,30,20]}],"valueLabels":true,"legend":"beneath","chartOptions":{"compact":true,"gridStyle":"dash"}}
```

Legacy line:

```json
{"kind":"graph","type":"line","dataFidelity":"exact","x":["A","B"],"series":[{"label":"자료","values":[10,20]}],"domain":[0,30],"legend":"none"}
```

이 예제는 앱 graph discovery schema에 정의된 실행 예를 따른다. 실제 실행 시 값 배열 길이, 수치 도메인, 스타일별 옵션과 물리적 크기 적합성을 추가 검사한다. spec 저장은 렌더 결과의 겹침 검수 완료를 뜻하지 않으므로 delivery audit와 실제 JPEG를 확인한다.

등록 문자 스타일이 지원되고 `und-illust-8-v1`이 catalog에 있는지 먼저 확인한다.

`vectora_new_document({"name":"관계도","width":108,"height":60})`로 생성 후 일반 편집:

```json
{
  "documentId": "응답의 문서 ID",
  "expectedRevision": 0,
  "requestId": "relation-drawing-1",
  "commands": [
    {"type":"typography","profile":"kice"},
    {"type":"add","shape":"rect","values":{"name":"상자 A","left":10,"top":20,"width":30,"height":16,"fill":"#ffffff","stroke":"#000000","strokeWidth":0.3}},
    {"type":"add","shape":"text","values":{"name":"A 라벨","left":14,"top":25,"width":22,"text":"A 지역","textProfile":"und-illust-8-v1","fill":"#000000","textAlign":"center"}},
    {"type":"add","shape":"line","values":{"left":43,"top":28,"width":22,"stroke":"#000000","strokeWidth":0.3,"arrowStart":"arrow-3","arrowEnd":"arrow-3"}},
    {"type":"add","shape":"ellipse","values":{"left":68,"top":20,"width":26,"height":16,"fill":"none","stroke":"#000000","strokeWidth":0.3}}
  ]
}
```

부분 문자: inspect에서 문자 ID를 얻고 `H2O`의 2에 아래첨자를 적용한다. `start` 포함/`end` 제외이며 Unicode grapheme 순서다.

```json
{"type":"textRange","id":"실제 문자 ID","start":1,"end":2,"values":{"script":"sub","underline":true}}
```

`script`는 `normal/super/sub`, `baselineShift`는 pt이며 양수가 위쪽이다. 부분 서식에는 글꼴·크기·굵기·스타일·색·선·밑줄·취소선·첨자·기준선 이동이 가능하다. 자간과 행간은 문자 개체 전체의 `style`로 적용한다.

여러 줄 본문은 하나의 `shape:"text"`에 전체 문자열과 개행을 넣는다. 한 줄마다 add하지 않으며 줄별 글상자를 그룹으로 묶는 방식도 쓰지 않는다. 부분 밑줄은 위 `textRange`의 `values:{underline:true}`로 같은 글상자 안에 적용한다. 밑줄용 별도 선·경로를 추가하지 않는다.

```json
[
  {"type":"select","ids":["실제 선 ID"]},
  {"type":"style","values":{"strokeDashArray":[1.5,1],"arrowStart":"arrow-3","arrowEnd":"arrow-3","arrowScale":1}},
  {"type":"transform","values":{"x":25,"y":30,"width":50}}
]
```

화살표는 열린 선/경로에 적용한다. 현재 스키마 값 `none/arrow-3`을 양끝별로 설정한다. `arrow-3`의 UI 이름은 “화살표”다. `arrowScale`은 0.25–4다. 세로선은 `width:0,y2:높이`로 만들고 경로는 `shape:path,d:"M 10 10 L 30 20"`처럼 명령의 기하 단위로 지정한다.

`vectora_apply` 지원: 도형/문자 추가, 선택, 이동·크기·회전·뒤집기, 서식, 앞뒤 순서, 그룹/해제, 정렬/분배, 합치기/빼기/교차/차이/분할, 클리핑, 그라디언트/그림자, 경로 오프셋·노드·단순화·연결·반전, 문자/선 윤곽선, 복제/복사/붙여넣기, 잠금/숨김, 대지/가이드/레이어. 실제 세부 스키마는 tools/list를 따른다. 화면 확대·패널 배치·마우스 제스처는 문서 편집 명령이 아니다.

`vectora_save({documentId,path:"/절대/경로/그림.svg"})`는 편집 메타데이터를 포함한다. `vectora_export({documentId,path:"/절대/경로/배포.pdf",format:"pdf",outlineText:true})`는 인쇄용 사본이다. 폴더는 미리 존재해야 하고 모든 파일은 64MiB 이하이다. 미리보기와 내보내기는 개체나 이력을 수정하지 않는다.

## JPEG/PNG 회색조와 컬러 내보내기

먼저 현재 tools/list에서 rasterColorMode가 지원되는지 확인한다. 앱 1.2.0 이상에서만 아래 새 필드를 사용하며, 이전 스키마에서는 앱을 업데이트하고 MCP를 다시 연결한다.

~~~js
vectora_export({documentId, path:"/절대/경로/그림.jpeg", format:"jpeg", scale:4, rasterColorMode:"grayscale"})
vectora_export({documentId, path:"/절대/경로/그림.png", format:"png", scale:4, rasterColorMode:"color"})
~~~

rasterColorMode를 생략하면 JPEG/PNG는 회색조다. 컬러 요청은 "color"로 지정한다. 이 옵션은 PNG/JPEG 내보내기에만 보내며 SVG/PDF/WebP 내보내기에 포함하면 거부된다. vectora_export_package의 옵션은 PNG 출력에만 적용된다. 변환은 출력에만 적용되며 편집 원본과 vectora_preview, SVG/PDF/WebP 미리보기의 색은 유지된다. PDF의 colorMode는 별개다.

## 사용자 프리셋

`vectora_list_presets`는 내장·사용자 프리셋을 반환한다. 분류를 제한할 때는 `category`를 `text`, `graph`, `schematic`, `dialogue` 중 하나로 지정한다. 내장·사용자 프리셋을 열 때는 목록에서 받은 실제 `id`를 `presetId`에 넣는다.

```json
{"presetId":"목록 응답의 실제 preset ID","name":"새 구성비 도식"}
```

이 인자를 `vectora_create_preset`에 전달하면 새 격리 문서가 열린다. 현재 편집 문서를 새 사용자 프리셋으로 저장하려면 다음 인자를 `vectora_save_preset`에 전달한다. `id`는 새로 만들 때 생략한다.

```json
{
  "documentId": "실제 문서 ID",
  "title": "지역별 구성비",
  "category": "graph",
  "description": "흑백 원 그래프"
}
```

저장한 사용자 프리셋의 그림을 교체할 때만 기존 사용자 프리셋 `id`를 추가한다. 저장은 현재 문서를 바꾸지 않는다. 프리셋 이름·분류·설명은 다음과 같이 수정한다. `id`만 필수이며 바꾸지 않을 필드는 생략한다.

```json
{"id":"목록 응답의 사용자 preset ID","title":"새 이름","description":"수정한 설명"}
```

이 인자를 `vectora_update_preset`에 전달한다. `vectora_delete_preset`에는 `{"id":"사용자 preset ID"}`를 전달해 사용자 항목을 삭제한다. 내장 프리셋 ID를 전달하면 현재 OS 사용자의 목록에서 숨긴다. `vectora_restore_preset`은 특정 내장 항목만 되돌리거나, 인자가 없으면 숨겨진 기본 프리셋을 모두 되살린다. 개인 프리셋은 유지된다. 각 변경 뒤 `vectora_list_presets`로 읽어 실제 상태를 확인한다.

## Windows 경로

Windows에서 MCP 경로 인자는 절대 경로를 JSON 문자열로 전달한다. 역슬래시는 두 번 쓴다.

```json
{"path":"C:\\Users\\사용자 이름\\Documents\\사회 도식.svg"}
```

앱 안에서 경로를 자동 탐색하는 것은 Codex 플러그인의 Windows 실행기 기능이다. 다른 MCP 클라이언트는 앱 실행 파일을 직접 등록하고 `--mcp-stdio`를 인자로 전달해야 한다.
