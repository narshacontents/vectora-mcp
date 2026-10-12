# D2-05_Scatter — 산점·버블

두 정량 지표 좌표점. 버블 포함

각 점 중심은 실제 x·y이며 임의 연결·좌표 벌리기는 하지 않는다. 모양/채움으로 계열을 구별하고 밀집 라벨만 빈 방향/인출선으로 이동한다. 라벨의 글 획과 점 외곽·축을 함께 대조한다. 근접 표식은 중심을 유지한 채 열린/채운 모양·겹침 순서로 식별하고, 제공된 크기 변수가 없을 때만 가독성을 위한 공통 표식 크기를 조정한다. 버블 크기는 별도 변수이고 면적/지름 비례를 확인한다. 면적 비례 반지름은 값 제곱근; 범례도 같은 변환이다. 큰 원의 가림/잘림을 배치로 풀되 비례를 바꾸지 않는다. 기준선·평균·회귀·이동은 각각 제공된 의미만 쓴다.

새 `chartStyle:"bubble",type:"line"`의 series.points는 `{x,y,size?,label?,fill?,labelOffsetMm?:{x,y}}`, size 비음수; 없으면 기본 크기이며 창작하지 않는다. values 배열도 필수다. `chartOptions.bubbleSizeScale,sizeLegend:[{value,label}],sizeLegendTitle,sizeLegendPosition:beneath|inside|right,sizeLegendLayout:row|nested`는 버블 전용이며 실제 크기 변환을 확인한다. 크기 범례의 겹친 원도 윤곽·수치 대응을 남긴다. 표식만이면 legacy `type:"points",series.points,xDomain,yDomain`와 실제 ticks, legend right/none을 사용할 수 있다; legacy 생략 안 점/눈금은 거부된다. 무늬/시점의 의미를 임의 부여하지 않는다.
