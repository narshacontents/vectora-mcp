# KICE 프로필로 요청 형식을 저장할 수 없을 때만

**KICE 프로필이 없거나 사용자 지정 파일명·형식을 정확히 지원하지 않으면 검증된 수동 경로를 쓴다.** profile:kice는 .jpeg를 만들므로 사용자가 .jpg를 명시하면 임의로 바꾸지 않고 아래 save→재열기→JPEG export를 .jpg 경로로 실행한다. 다른 명시 형식도 실제 지원 export 계약으로 실행하며 원본과 출력은 같은 파일 본체를 유지한다. 사용자 지시가 프로필 선호보다 우선이다. execution/delivery.md의 외곽 폭·대지 맞춤을 적용한 뒤 `vectora_save({documentId,path,format:"vectora"})`→실제 파일 존재 확인→`vectora_open_document` 재열기와 문자·도형·그룹·포함 이미지·치수 보존 검사→최종 외곽 재확인→`vectora_export({documentId,path,format:"jpeg",scale:4,transparent:false,rasterColorMode:"grayscale"})` 순서다. 사용자 배율/컬러/명시 대지 지시가 우선이며 라이브 지원 옵션만 보낸다. 실제 JPEG 직접 열람으로 core/review.md을 재검수하고 수정 시 저장·재열기·JPEG를 반복한다. 파일 작성·확장자 변경·별도 PNG 변환을 Vectora 저장/내보내기로 주장하지 않는다.

AUDIT_BLOCKED 등 원칙 위반을 이 경로로 우회하지 않는다. 실패본 보존과 정상 납품을 구분한다.
