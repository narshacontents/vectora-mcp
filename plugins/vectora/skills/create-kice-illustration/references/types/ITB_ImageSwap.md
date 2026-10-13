# ITB_ImageSwap

그림 교체형. 사진·지도·그래프·삽화 자료 칸이 있는 판과 해설자 구성을 사람 수로 구분한다. 실제 특정 인물·장소·복장이 식별 단서인 고정형은 ITC_Fixed를 먼저 판정한다. 신문 속 교체 가능한 보도 사진만으로 ITC-2_RealPhoto로 바꾸지 않는다.

| 세부유형 | 선택 기준 |
|---|---|
| `ITB-1_ImageBoard · 그림 보드` | 그림 교체형. 사람 없이 사진·지도·그래프·삽화 칸이 든 판(신문 사진, 웹 사진, 답사 계획서 지도) |
| `ITB-2_SoloImageBoard · 1인 + 그림 보드` | 그림 교체형. 한 사람 + 그림이 든 보드·화면, 또는 해설자 + 유물 사진 |
| `ITB-3_GroupImageBoard · 여러 명 + 그림 보드` | 그림 교체형. 여러 사람 + 지도·그래프·그림 보드·자료 |



## 선택 세부 문서 준비

- 보드 세부유형은 newspaper / screen / paper / scroll / board / worksheet, 해설자+틀 없는 자료는 plain을 `--variant`로 고른다.
- 보드에 실제 보조 발언이 있을 때만 `speech-horizontal`, `speech-vertical`, `speech-solo` 중 하나를 선택한다. 자료 칸이 실제 사진인지 새 작화인지에 따라 공통 조건을 선택한다.
