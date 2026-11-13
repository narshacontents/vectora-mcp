# Gemini CLI 실행



Gemini CLI 확장은 같은 작업별 선택 원칙을 사용한다. 현재 노출된 MCP 이름·스키마로 Vectora를 호출하고 도구 이름의 접두사를 추정하지 않는다. 로컬 앱 연결은 Gemini CLI용이며 일반 Gemini 웹 채팅에 자동 연결되지 않는다. 실제 이미지 파일은 `read_file` 등 이미지 입력을 지원하는 도구로 열어 픽셀을 검수한다. 경로·도구의 성공 메시지만으로 이미지 확인을 대신하지 않는다.

`<plugin>/bin/vectora-skill prepare_task`는 스킬 루트에서 실행한다. 선택 세부 문서에서 선택적 `<plugin>/bin/vectora-skill build_graph`, `<plugin>/bin/vectora-skill build_text_frame`, `<plugin>/bin/vectora-skill trace_artwork`, `<plugin>/bin/vectora-skill audit_svg`가 필요하면 같은 실행 파일에 원래 인자를 붙여 실행한다(`<plugin>`은 이 확장의 루트). 원본·출력은 절대 경로로 전달한다. 원칙 문서는 현재 스킬의 것을 유지하며 실행본이 있는 다른 클라이언트의 지침을 추가로 읽지 않는다. 새 원화는 현재 연결된 이미지 생성 도구를 확인하고 선택 세부·인물 문서의 화풍을 적용한다. 이 확장은 이미지 생성 모델을 포함하지 않는다.
