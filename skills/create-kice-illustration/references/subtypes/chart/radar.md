# 방사형 · chart/radar

중심에서 각 축으로 뻗는 거리·각도·순서를 확정한다. 범주 레이더는 동일 반경 척도와 같은 축 순서로 비교하며 서로 다른 단위 지표의 정규화는 제공된 근거만 쓴다. 폐합선·면적이 총량을 뜻한다고 추가 해석하지 않는다. 풍향장미는 방향별 각도·빈도/크기 매핑을 보존하고 레이더로 의미를 바꾸지 않는다.

`chartStyle:"radar",type:"line"`은 범주 3개 이상·primary만; `chartOptions.radarRings,radarStartAngle,radarClockwise,radarSpokeLine`을 지원 범위에서 쓴다. 새 공통 radar tick 집합은 모든 spoke에 하나의 정확한 반경 ruler와 공통 offset을 적용한다. 눈금마다 별도 방향을 지정하지 않고 수치 축의 공통 매핑을 확인한다. 풍향장미 부채꼴이 기본 관계 자체로 미지원이면 직접 벡터 계산한다. 수치 없는 `scaffoldOnly` 외곽 틀은 도식 의미이므로 정량 레이더와 혼동하지 않는다.
