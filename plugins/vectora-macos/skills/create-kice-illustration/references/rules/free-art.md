**자유 원화의 공통 화풍 계약:** 검정·흰색·회색만, 또렷하되 과하지 않은 외곽과 더 가는 내부선, 제한된 회색 명암, 자연스러운 구조·원근·관절·겹침. 사진 피부·광택 3D·과도한 효과·이모지·기하 임시 얼굴·미세 획의 덩어리로 대체하지 않는다. 이 내용을 매 생성 프롬프트에 명시하고 타입의 대상별 델타를 더한다. 풍경/회화는 연한·끊긴 윤곽과 질감을 허용하며 별도 벡터 윤곽은 공통 검정 규칙을 따른다. 새 사진 질감 사물 요청에는 형태·재질이 회색 표면 결로 읽히게 하되 원본 재현은 요청 자료의 명암·질감을 유지하고 임의 그림자·필터를 더하지 않는다.

자유 원화에는 다음 고정 블록도 매 호출 그대로 넣고 대상별 특징을 더한다(독립 작은 인물에는 인물 전용 계약 사용). 조각품 자체/명시 원본 재현/사용자 지정 화풍은 해당 예외를 명시한다.
```text
STYLE CONTRACT: Draw a clean grayscale Korean examination textbook illustration of the requested subject and action. Use black, white, and gray only, crisp but not excessively heavy outer contours, finer and fewer interior lines, and restrained gray shading. Preserve natural structure, perspective, anatomy, joints, and meaningful overlaps. Keep the subject's identifying features readable at the final printed size. Do not replace organic subjects with emoji, icons, geometric placeholders, or dense decorative linework. Preserve scene-essential backgrounds and textures where needed. Do not bake lettering, numbers, speech bubbles, legends, or layout frames into the artwork; these will be added as separate editable vectors.
```
