### 선택 추적 helper

로컬 helper를 사용할 때 `<plugin>/bin/vectora-skill trace_artwork <원화.png> <출력.svg> --width-mm <그림폭>`으로 실행한다. 입력은 PNG 파일만 받으므로 다른 형식의 원화는 PNG로 저장해 넣는다.

기본 6단계 회색이며 `--colors 3..12`, `--detail 0초과..5`(작을수록 세밀), `--max-px 300..1800`, `--min-path 0..100`을 조절한다. `--ink 85`는 검정 윤곽 기준, 0이면 별도 추출을 끈다. 연한 회화나 검정 번짐은 기준을 낮춘다. 기존 출력은 덮어쓰지 않고 `.trace.json`은 처리 기록이지 품질 판정이 아니다.
