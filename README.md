# 영어 3D 학교 · Lesson 1 (I'm in the Sixth Grade)

3D 영어 게임(내 캐릭터 보기 / 내 눈으로 보기, V 키). 서버 없음, 정적 파일만.

- index.html : 게임 / guide.html : 기능 소개 / teacher.html : 선생님 화면(차시 연결·정답·이 기기 기록)
- data.js : 학습 문장·단어 (여기만 고치면 내용 변경)
- game.js : 3D 엔진(three.js 0.160 CDN) / style.css : 공통 스타일
- autotest.js : 개발용 자동 통과 테스트 (`index.html?stage=0&autotest`)
- 개발용 주소 옵션: `?stage=0~6` 바로 해당 미션, `?view=x,z,yaw` 위치 지정

실행: index.html 더블클릭(인터넷 필요: three.js·글꼴 CDN) 또는 Vercel/GitHub Pages에 site 폴더 그대로 올리기.
기록 저장: 브라우저 localStorage `english3d_l1_v1`.
