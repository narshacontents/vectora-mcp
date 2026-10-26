# 모식도 배치 원칙
단면·공간 구조·특성 좌표 배치·3D 속성 큐브(정량 값 없는 축)

단면·공간 구조·정성 특성 좌표·수량 없는 3D 속성 큐브다. 영역·층·접합·안팎·투영과 상대 위치를 보존하고 물리적 관계를 연결 편의를 위해 바꾸지 않는다. 절단면과 외관 면을 구별한다. 3D 구조의 보이는 앞 모서리는 실선, 가려진 뒤 모서리는 파선으로 구별하며 실제 투영·가림에 맞춘다. 기호는 축·모서리와 떨어뜨려 배치하고 인출선이 필요하면 원래 대응 위치를 유지한다.

명칭은 대응 영역의 빈 면에 두거나 짧은 인출선으로 빼며, 내부 배치에는 필요한 최소 흰 바탕으로 획을 구별할 수 있다. 밖에 둘 수치·명칭만 실제 8pt 문자열 폭과 인출선 공간을 먼저 확보한다. 긴 설명과 나란히 배치할 때는 설명의 실측 높이와 라벨 포함 모식도 외곽을 비교해 열 너비를 정한다. 양쪽 라벨 띠 때문에 설명만 가늘고 길어져 그림 아래 큰 빈 공간이 남으면 명칭의 안/밖 배치와 열 너비부터 조정한다. 정한 원화 가용 폭·높이·비율을 생성 프롬프트에 포함하고, 이후 크기 변경에도 인출선 끝이 원래 대응 영역을 가리키는지 확인한다. 그림 위에 숫자를 무작정 겹치거나 글자 크기·의미를 바꿔 맞추지 않는다.

고도·깊이·거리의 수치를 한 방향의 축이나 평행 기준선으로 제시하면 먼저 값에 비례하는 좌표를 정하고 원화의 구간도 그 위치에 맞춰 생성한다. 선형 척도에서 같은 값 차이는 같은 간격이며, 원화 속 나무·층이 그려진 위치에 맞추려고 눈금 간격을 바꾸지 않는다. 실제 구간 경계가 어긋나면 원화를 재생성하거나 내용이 보존되는 배치를 조정한다. 수치 척도가 없는 정성 구분에는 이 비례 조건을 강제하거나 숫자를 임의로 추가하지 않는다.

작은 보조 흐름 화살표는 검정 0.3pt 선에서 시작하고, 머리는 주변 8pt 글자 높이의 절반 안팎으로 읽히게 한다. 명시된 굵은 흐름/면적 기호는 예외다. 곡선의 높이는 실제 대상·구름·문자를 피하는 데 필요한 만큼만 확보하고, 방향만 나타내는 화살표 때문에 위쪽에 큰 빈 띠를 만들지 않는다. 원화와 화살표를 포함한 실제 외곽으로 아래 자료와의 간격을 정한다.

설명용 지형·식생 원화는 넓은 영역·층·대표 개체를 읽는 그림이다. 해당 원화의 생성 지시에는 공통 STYLE CONTRACT와 최종 배치 치수에 아래 조건을 함께 넣는다. 대상 설명은 개념에 필요한 지형·방향·층에 집중하고, 내용에 없는 도시·농경지·숲·표면 질감을 풍경 장식으로 덧붙이지 않는다. 원화 단독 검수에서 실사형 지형·촘촘한 질감 덩어리로 나왔으면, 문자 공간이 있다는 이유만으로 채택하지 말고 상세도를 줄여 다시 생성한다.

> Render this explanatory landform or vegetation diagram as a compact pen-outline drawing for small exam print. Convey depth through the perspective of boundary lines, not realistic lighting. In this schematic style, restrained shading means uniform flat fills only: white or light-to-middle gray, with no gradients, speckle or numerous crease strokes. Leave broad uninterrupted areas between a few essential structural lines; omit lines that do not explain a boundary or change of form. Show only representative trees, rocks or animals needed to explain the subject, with visible space between them. Do not add settlements, fields, forest cover or surface texture unless they carry requested information. Clouds, if needed, have a simple outline and a completely uniform pale fill; rain consists of a few clearly separated short strokes. Use sparse drawn water marks rather than reflective water texture. Do not use continuous shaded relief, photographic terrain, forest microtexture, mottled watercolor, airbrushed clouds or a rendered miniature. Preserve the required slopes, layers, boundaries and viewing direction.

정성 좌표는 축 양끝 의미와 상대 위치만 보존하며 숫자 눈금/전면 격자를 추가하지 않는다. 축 0.4pt, 인출선 0.3pt; 세로축 제목은 축 바깥에 두고 짧은 정성 제목은 가로쓰기, 긴 제목은 직립 세로쓰기를 기본으로 선택한다. 긴 제목은 의미 단위로 2–3열, 단위는 분리하고 X제목은 축 끝 바깥 또는 아래에 둔다. 세로 지표명을 패널 상단 중앙 제목으로 떼지 않는다. 제공된 기준선·이동 방향만 쓴다. 수치 없는 radar 외곽은 실제 `chartStyle:"radar",type:"line",chartOptions:{scaffoldOnly:true,radarAxisLabels},categories,series`에서 values를 범주 수만큼 null, 계열 labels를 제공 기호로 둘 수 있다. 내부 위치를 실제 값처럼 표시하지 않는다.
