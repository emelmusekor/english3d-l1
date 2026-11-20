/* 동아출판 초등 영어 6 · Lesson 4 "When Is the Field Trip?" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L4',
  title: 'Lesson 4 · When Is the Field Trip?',
  months: [
    ['January', '1월'], ['February', '2월'], ['March', '3월'], ['April', '4월'], ['May', '5월'], ['June', '6월'],
    ['July', '7월'], ['August', '8월'], ['September', '9월'], ['October', '10월'], ['November', '11월'], ['December', '12월']
  ],
  // 행사 (label: 질문에 들어가는 말)
  events: [
    { id: 'field trip',     label: 'the field trip',     ko: '현장 체험 학습', emoji: '🚌' },
    { id: 'school market',  label: 'the school market',  ko: '학교 알뜰 시장', emoji: '🛍️' },
    { id: 'math quiz',      label: 'the math quiz',      ko: '수학 퀴즈',     emoji: '➗' },
    { id: 'music festival', label: 'the music festival', ko: '음악 축제',     emoji: '🎸' },
    { id: 'birthday party', label: 'the birthday party', ko: '생일 파티',     emoji: '🎂' },
    { id: 'Sports Day',     label: 'Sports Day',         ko: '운동회',       emoji: '🏃' }
  ],
  // 미션 2: Listen and Do (교과서 53쪽, 지도서 대본) — poster: 그림 속 날짜, said: 들리는 날짜 [달, 일]
  listen: [
    { id: 'p1', name: 'Amy',  girl: true,  event: 'field trip',     poster: [9, 25], said: [9, 25], shirt: 0xffd54f },
    { id: 'p2', name: 'Tom',  girl: false, event: 'school market',  poster: [3, 7],  said: [4, 7],  shirt: 0x4caf50 },
    { id: 'p3', name: 'Yuna', girl: true,  event: 'math quiz',      poster: [11, 1], said: [10, 2], shirt: 0xff8a80 },
    { id: 'p4', name: 'Leo',  girl: false, event: 'music festival', poster: [2, 3],  said: [2, 3],  shirt: 0x00897b }
  ],
  // 미션 2: Play Together 1 날짜 추측하기 (선생님이 말하는 날짜)
  guess: [
    { event: 'field trip', date: [4, 22] }, { event: 'birthday party', date: [1, 19] }, { event: 'Sports Day', date: [6, 15] }
  ],
  // 미션 3: Play Together 2 날짜 뒤집기 (Read and Talk 어구)
  flip: [
    { event: 'school market', date: [5, 30] }, { event: 'birthday party', date: [9, 2] },
    { event: 'math quiz', date: [3, 14] }, { event: 'music festival', date: [12, 17] }
  ],
  // 미션 4: 문장 블록
  sentences: [
    { en: 'When is the field trip?', ko: '현장 체험 학습은 언제니?' },
    { en: "It's on May 22nd.", ko: '5월 22일이야.' },
    { en: "I'm sorry?", ko: '뭐라고? (다시 말해 줄래?)' },
    { en: 'My birthday is on June 7th.', ko: '내 생일은 6월 7일이야.' }
  ],
  // 미션 5: My Birthday (Reading)
  reading: {
    diego: [
      ['Diego', "I'm Diego from Mexico.", '나는 멕시코에서 온 Diego야.'],
      ['Diego', 'My birthday is on June 7th.', '내 생일은 6월 7일이야.'],
      ['Diego', 'I will hit a piñata on my birthday party.', '나는 생일 파티에서 피냐타를 칠 거야.'],
      ['Diego', "It's a paper doll.", '그것은 종이 인형이야.'],
      ['Diego', 'It has candies and toys inside.', '그 안에는 사탕과 장난감이 들어 있어.'],
      ['Diego', 'I will try to open it.', '나는 그것을 열어 보려고 할 거야.'],
      ['Diego', 'Candies and toys will fall out.', '사탕과 장난감이 쏟아져 나올 거야.']
    ],
    lucy: [
      ['Lucy', "I'm Lucy from Australia.", '나는 호주에서 온 Lucy야.'],
      ['Lucy', 'My birthday is on October 21st.', '내 생일은 10월 21일이야.'],
      ['Lucy', 'My dad will make Fairy Bread for my birthday.', '우리 아빠는 내 생일에 요정 빵을 만들어 주실 거야.'],
      ['Lucy', 'He will cover white bread with butter.', '아빠는 흰 빵에 버터를 바르실 거야.'],
      ['Lucy', 'He will put colorful sugar on the bread.', '아빠는 빵 위에 알록달록한 설탕을 뿌리실 거야.'],
      ['Lucy', 'I will eat it for breakfast.', '나는 그것을 아침으로 먹을 거야.']
    ]
  },
  // 미션 6: Let's Write (Kate의 초대 글)
  writeSample: [
    ['Kate', 'To Nick,', 'Nick에게,'],
    ['Kate', 'Can you come to the funny hat party?', '재미있는 모자 파티에 올 수 있니?'],
    ['Kate', 'We will wear funny hats. We will take funny pictures, too.', '우리는 재미있는 모자를 쓸 거야. 재미있는 사진도 찍을 거야.'],
    ['Kate', 'The party is on May 10th.', '파티는 5월 10일이야.'],
    ['Kate', 'Please come to my house at 2. It will be fun.', '2시에 우리 집으로 와. 재미있을 거야.'],
    ['Kate', 'Your friend, Kate', '너의 친구, Kate']
  ],
  writeEvents: [['funny hat party', '재미있는 모자 파티'], ['birthday party', '생일 파티'], ['pizza party', '피자 파티'], ['dance party', '댄스 파티'], ['movie party', '영화 파티']],
  writeActs: [
    ['wear funny hats', '재미있는 모자를 쓰다'], ['take funny pictures', '재미있는 사진을 찍다'], ['play fun games', '재미있는 게임을 하다'],
    ['eat a birthday cake', '생일 케이크를 먹다'], ['eat pizza', '피자를 먹다'], ['dance together', '함께 춤추다'],
    ['watch a movie', '영화를 보다'], ['sing songs', '노래를 부르다']
  ],
  writePlaces: [['my house', '우리 집'], ['the school', '학교'], ['the park', '공원'], ['the library', '도서관']],
  // 보너스: Sounds and Letters ay
  th: ['day', 'May', 'play', 'birthday', 'today', 'say']
};
