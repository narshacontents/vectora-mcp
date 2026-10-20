### 선택 추적 helper

로컬 helper를 사용할 때 스킬 루트에서 `node scripts/trace_artwork.mjs <원화.png> <출력.svg> --width-mm <그림폭>`으로 실행한다. canvas/imagetracerjs가 있는 프로젝트에서만 사용한다.

기본 6단계 회색이며 `--colors 3..12`, `--detail 0초과..5`(작을수록 세밀), `--max-px 300..1800`, `--min-path 0..100`을 조절한다. `--ink 85`는 검정 윤곽 기준, 0이면 별도 추출을 끈다. 연한 회화나 검정 번짐은 기준을 낮춘다. 기존 출력은 덮어쓰지 않고 `.trace.json`은 처리 기록이지 품질 판정이 아니다.
