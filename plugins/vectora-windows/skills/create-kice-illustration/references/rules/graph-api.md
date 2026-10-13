## graph 생성기의 compact spec

`kind:"graph",chartStyle,type,dataFidelity:"exact"|"approximate"|"concept",categories,series`. 새 chartStyle에는 relative가 없다. categories는 비어 있지 않은 1–200개 문자열, series는 1–8개이며 각 `{id,label,values}`는 안정적 고유 ID(영문·숫자·`._:-`, 1–100자)와 같은 범주 수의 유한수/null 배열을 가진다. points 계열도 values가 필요하며 미지 값은 null이다. `concept`는 line에서만 `chartOptions.mode:"concept"`와 함께 쓸 수 있고 관측값이 아니다. points 전체 최대 5,000개.

### KICE profile과 새 chartOptions

새 native production graph는 `styleProfile:"kice"`를 기본 사용하며 `"general"`을 명시하면 일반 스타일을 쓴다. 요청·저장 명시값은 자동 기본값보다 우선하고 정규화된 spec의 `styleProvenance:{schema:"vectora.style-provenance/v1",explicit,automatic}`가 출처를 나눈다. 기존 spec에 profile을 추가해 소급 스타일링하지 않는다.

- 폭 `widthMm:18–108`, `plotHeightMm:15–200`, `strokePt:0.1–4`(pt).

- series의 `fill`, `pattern:none|dots|hatch`, `line:solid|dash|dash-dot`, `marker:none|circle|triangle|square|open-square|open-circle|open-triangle`를 대응시킨다. 표식 없는 선에 표식 무늬를 넣지 않는다. `grid:true,chartOptions:{gridStyle:"dash"}`; dot 옵션은 규격 1.5/1pt와 다르다. 실제 `valueLabels,xTitle,yTitle,unit`, `chartOptions.labelDecimals`(0–10)을 지정한다.

- `legend:above|beneath|right|inside|none`; 아래는 beneath이고 bottom/below 별칭은 쓰지 않는다. inside의 `legendAnchor:top-left|top-right|bottom-left|bottom-right`, `legendReverse`, `legendStyle:swatch|label-fill` 중 견본 상자는 swatch 우선이다.

- chartStyle을 생략하는 legacy는 별도 계약이다. `layout,panels,x,yDomain,labelOffsets`를 새 spec에 섞지 않는다. legacy는 새 그래프 UI 편집 지원을 약속하지 않는다. live 도구 spec이 open record여도 허용 옵션을 추측하지 않는다.
