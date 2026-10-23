# D4-04_Venn — 벤다이어그램

집합 교집합

집합의 교집합·포함·분리를 먼저 확정한다. 일반 2·3집합 고정 교차 배치는 production을 원/SVG보다 먼저 사용한다. 면적은 수량 비례가 아니다. 완전 포함·서로 분리·4집합 이상·면적 비례가 기본 관계면 별도 편집 가능한 도식으로 만들며 고정 겹침으로 대신하지 않는다.

## 벤 전용 spec

`{kind:"schematic",layout:"venn",sets:2|3,widthMm,setLabels,regions,regionFills?,regionPatterns?,universe?,legend?}`. nodes/edges 불필요. sets 기본2, 폭 기본70mm; 2집합40–108, 3집합50–108mm. setLabels는 집합 수와 같은 서로 다른 비빈 한줄 이름(각24자 이하).

- regions 문자열: 2집합 `A,B,AB,outside`, 3집합 `A,B,C,AB,AC,BC,ABC,outside`. 모두 배타적 영역: AB는 `(A∩B)−C`, ABC는 공통. 전체 A∩B 수량을 AB에 그대로 넣지 않는다. 누락 영역을 근거 없이 계산하지 않는다. 각 값4줄·160자 이하; 생략/빈 문자열은 빈칸, "0"은 실제0.
- 두 집합의 가로 타원이 필요한 경우 라이브 스키마가 지원하면 `setShape:{type:"ellipse",aspectRatio}`를 쓴다. 비율은 가로/세로, 1 초과–3 이하이며 원형 복원은 `{type:"circle"}` 또는 null이다. 글자·해칭·선까지 그룹으로 납작하게 변형하지 않는다. 세 집합에 이 타원 옵션을 적용하지 않는다.
- outside 문구는 전체집합 사각형 없이도 가능. outside 채움/무늬는 `universe:{title?}` 필요; 사각형만 `{}`, title 한줄60자 이하. universe:null로 지우면 outside 채움·무늬도 지운다.
- regionFills는 소문자 `#ffffff,#f2f2f2,#e0e0e0,#cccccc,#b3b3b3,#999999,#808080` 또는 null. 차트 6색 계약과 다르다. 값 삭제와 채움 삭제는 독립이므로 patch에 각각 명시한다.
- `regionPatterns[key]:{type,spacingMm?,strokePt?}`, type `none,vertical,horizontal,rightDiagonal,leftDiagonal,grid,crossDiagonal,verticalRight,verticalLeft`; spacingMm0.6–8, strokePt0.1–1. 규격선에 맞춰 strokePt:0.3을 명시한다(기본0.25). 실제 잘린 선이며 점 무늬는 미지원이다. 글 여백과 영역 경계를 검수한다.
- 오른쪽 `legend:{title?,widthMm?,rows:[{label,description}]}` 최대12행; label 한줄24자, description4줄100자, title 한줄30자. 문자열 표식/설명 표이며 regionPatterns 자동 견본이 아니다. `label`에는 표식만, `description`에는 `:` 같은 구분자를 넣지 않는다(엔진이 구분자를 출력). 도식 폭을 정하기 전에 각 `label+description` 전체 항목의 실제 폭을 잰다. 의미상 짧은 항목은 가능하면 한 줄을 유지하되, 모든 줄바꿈을 금지하지 않는다. 미제공 제목은 title:""로 엔진의 〈범례〉 추가를 막는다. 라이브 스키마가 지원하면 `widthPolicy:"total-v1"`로 범례·글상자까지 포함한 전체 할당 폭을 `widthMm`에 지정하고, 반환된 plan의 `diagramWidthMm`·`overallWidthMm`을 실제 배치와 대조한다. 특히 표 셀 안에 넣을 때 셀의 실제 가용 폭을 사용한다. 생략/`diagram-v1`은 기존처럼 본도식 폭만 뜻하므로 범례를 더한 전체 외곽을 별도 측정한다. 일반 전체 폭108mm 이하를 유지하고 부족하면 글자를 줄이거나 도식을 불필요하게 키우지 말고 배치를 조정한다.
- 범례 설명을 나중에 고쳐도 원의 크기를 유지해야 하거나 도식·설명의 시각적 비중을 먼저 정했다면, 지원 앱에서 `legend.widthMm`으로 범례 **외곽 상자 폭**을 고정한다. `total-v1`은 남은 폭을 도식에 배분하며 범례 원문은 그 안에서 자동 줄바꿈한다. plan의 두 영역 폭을 대조하고, 한쪽 빈 공간을 채우려고 원만 과도하게 키우지 않는다. 미지정은 자동 배분을 유지한다. 도식 크기를 지키려고 설명 중간에 강제 엔터를 넣지 않는다.
- 3→2 변경은 setLabels 배열 교체 후 regions/regionFills/regionPatterns의 C,AC,BC,ABC 각각 null. 밖 영역·범례·전체집합도 선택 속성별 null로 제거한다. 빈 객체/생략은 깊은 병합의 옛 값을 지우지 않는다.
- 긴 문구 때문에 측정 오류가 나면 배치를 바꾸며 원문 요약·글자 축소·빈칸 답 추측으로 통과시키지 않는다. 각 배타 영역·문구·해칭·전체집합 포함과 최종 외곽을 검사한다.
