# ITC_Fixed

고정형. 특정 인물·실존 인물 사진·특정 장소/사건·시대 복장이 식별 단서인 경우이며 ITA·ITB보다 먼저 판정한다. 갑·을 같은 화자 기호만으로 특정 인물로 분류하지 않는다.

| 세부유형 | 선택 기준 |
|---|---|
| `ITC-1_Figure · 특정 인물` | 고정형. 얼굴·차림으로 누군지 알아보는 특정 역사 인물·사상가(칸 만화 포함) |
| `ITC-2_RealPhoto · 실존 인물 사진` | 고정형. 실제 인물의 초상·보도 사진이 단서 |
| `ITC-3_Place · 특정 장소·장면` | 고정형. 특정 건축물·광장·유적·사건 현장이 배경이자 단서 |
| `ITC-4_Costume · 시대 복장 인물` | 고정형. 특정인은 아니지만 복장(관복·승복·갑옷 등)으로 시대가 정해진 인물 장면 |



## 선택 세부 문서 준비

- `--variant`로 실제 배치 horizontal / vertical / presentation / scene, 또는 매체 newspaper / screen / paper / scroll / board / worksheet를 고른다.
- 보드에 실제 보조 발언이 있을 때만 `speech-horizontal`, `speech-vertical`, `speech-solo` 중 하나를 선택한다. 발언 variant가 있으면 speech 조건을 중복 선택하지 않는다.
