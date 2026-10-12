# D4-04_Venn — 벤다이어그램

집합 교집합

집합의 교집합·포함·분리를 먼저 확정한다. 일반 2·3집합 고정 교차 배치는 production을 원/SVG보다 먼저 사용한다. 면적은 수량 비례가 아니다. 완전 포함·서로 분리·4집합 이상·면적 비례가 기본 관계면 별도 편집 가능한 도식으로 만들며 고정 겹침으로 대신하지 않는다.

## 벤 전용 spec

`{kind:"schematic",layout:"venn",sets:2|3,widthMm,setLabels,regions,regionFills?,regionPatterns?,universe?,legend?}`. nodes/edges 불필요. sets 기본2, 폭 기본70mm; 2집합40–108, 3집합50–108mm. setLabels는 집합 수와 같은 서로 다른 비빈 한줄 이름(각24자 이하).

- regions 문자열: 2집합 `A,B,AB,outside`, 3집합 `A,B,C,AB,AC,BC,ABC,outside`. 모두 배타적 영역: AB는 `(A∩B)−C`, ABC는 공통. 전체 A∩B 수량을 AB에 그대로 넣지 않는다. 누락 영역을 근거 없이 계산하지 않는다. 각 값4줄·160자 이하; 생략/빈 문자열은 빈칸, "0"은 실제0.
- outside 문구는 전체집합 사각형 없이도 가능. outside 채움/무늬는 `universe:{title?}` 필요; 사각형만 `{}`, title 한줄60자 이하. universe:null로 지우면 outside 채움·무늬도 지운다.
- regionFills는 소문자 `#ffffff,#f2f2f2,#e0e0e0,#cccccc,#b3b3b3,#999999,#808080` 또는 null. 차트 6색 계약과 다르다. 값 삭제와 채움 삭제는 독립이므로 patch에 각각 명시한다.
- `regionPatterns[key]:{type,spacingMm?,strokePt?}`, type `none,vertical,horizontal,rightDiagonal,leftDiagonal,grid,crossDiagonal,verticalRight,verticalLeft`; spacingMm0.6–8, strokePt0.1–1. 규격선에 맞춰 strokePt:0.3을 명시한다(기본0.25). 실제 잘린 선이며 점 무늬는 미지원이다. 글 여백과 영역 경계를 검수한다.
- 오른쪽 `legend:{title?,rows:[{label,description}]}` 최대12행; label 한줄24자, description4줄100자, title 한줄30자. 문자열 표식/설명 표이며 regionPatterns 자동 견본이 아니다. 미제공 제목은 title:""로 엔진의 〈범례〉 추가를 막는다. widthMm은 본도식만이며 범례 더한 전체도108mm 이하; 공간이 부족하면 본도식 폭을 줄여 다시 측정한다.
- 3→2 변경은 setLabels 배열 교체 후 regions/regionFills/regionPatterns의 C,AC,BC,ABC 각각 null. 밖 영역·범례·전체집합도 선택 속성별 null로 제거한다. 빈 객체/생략은 깊은 병합의 옛 값을 지우지 않는다.
- 긴 문구 때문에 측정 오류가 나면 배치를 바꾸며 원문 요약·글자 축소·빈칸 답 추측으로 통과시키지 않는다. 각 배타 영역·문구·해칭·전체집합 포함과 최종 외곽을 검사한다.
