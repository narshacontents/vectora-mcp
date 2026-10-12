# D2-04_Line — 선

유한 시점·순서 관측값을 선으로 연결

유한 시점/순서 관측을 실제 x간격·선형 y척도로 놓고 직선 구간으로 연결한다. 범주만 등간격이다. 스플라인·추세선·면채움은 요청 없이 추가하지 않으며 결측 구간을 임의로 잇지 않는다. 선 뒤에 표식을 놓고 마커는 글자 높이보다 작고 같은 시각 크기다. 점 수치 요청은 각 점 가까이에 실제 수치로 표시한다. 선 끝 이름이 몰리면 끝점 좌표를 고정한 채 이름을 간격 있게 배열하고 짧은 인출선/범례로 대응시킨다.

`chartStyle:"line",type:"line"`; smooth-line/step-line은 요청 관계에 맞을 때만. 2시점 이상이다. 음수 축의 0선과 바닥 시간축을 구별하고 계층 시점 라벨·부호·자릿수를 유지한다. legacy line은 x 문자열, 증가 xValues 선택, series.values(null 결측), xAxis zero/bottom, xLabelsAt axis/bottom, yTitle/xTitle, arrows, labelMode end/legend, valueLabels, series.labels를 쓴다.
