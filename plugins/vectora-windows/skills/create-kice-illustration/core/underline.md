# 본문 부분 밑줄



**밑줄은 같은 글상자의 네이티브 서식** `textRange`의 `underline:true`/지원되는 `doubleUnderline`으로 적용한다. 재조판·재열기 뒤 저장 범위의 실제 문자열과 JPEG를 대조한다. 정확한 논리 문자 범위를 보냈는데 줄바꿈 뒤 서식이 밀리는 증상이 재현될 때만 execution/workarounds/underline-wrap.md의 임시 우회를 적용한다. 생성기/가져오기의 별도 밑줄도 문자 서식으로 고치며 line/path로 흉내 내지 않는다. 문장 빈칸의 순서·기준선을 유지한다.
