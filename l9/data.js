/* 동아출판 초등 영어 6 · Lesson 9 "I'm Going to Walk the Dog" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L9',
  title: "Lesson 9 · I'm Going to Walk the Dog",
  // 언제 (질문에 쓰는 말)
  times: [
    { id: 'this afternoon', ko: '오늘 오후', board: 'Today' },
    { id: 'tomorrow',       ko: '내일',     board: 'Tomorrow' },
    { id: 'this weekend',   ko: '이번 주말', board: 'This Weekend' }
  ],
  // 계획 어구 (Key Words)
  plans: [
    { id: 'do my science project',  ko: '과학 과제를 하다',   emoji: '🔬' },
    { id: 'stay home',              ko: '집에 있다',         emoji: '🏠' },
    { id: 'go to the library',      ko: '도서관에 가다',      emoji: '📚' },
    { id: 'walk the dog',           ko: '개를 산책시키다',    emoji: '🐕' },
    { id: 'see a movie',            ko: '영화를 보다',        emoji: '🎬' },
    { id: 'watch a baseball game',  ko: '야구 경기를 보다',   emoji: '⚾' }
  ],
  // 미션 2: Listen and Do (교과서 129쪽 대본 1~6)
  kids: [
    { id: 'p1', name: 'Tom',  girl: false, time: 'this afternoon', plan: 'see a movie',           shirt: 0x4dabf7 },
    { id: 'p2', name: 'Yuna', girl: true,  time: 'tomorrow',       plan: 'go to the library',     shirt: 0xf783ac },
    { id: 'p3', name: 'Ben',  girl: false, time: 'this weekend',   plan: 'walk the dog',          shirt: 0x40c057 },
    { id: 'p4', name: 'Sora', girl: true,  time: 'tomorrow',       plan: 'watch a baseball game', shirt: 0xffa94d },
    { id: 'p5', name: 'Max',  girl: false, time: 'this afternoon', plan: 'stay home',             shirt: 0x845ef7 },
    { id: 'p6', name: 'Emma', girl: true,  time: 'this weekend',   plan: 'do my science project', shirt: 0x20c997 }
  ],
  // 미션 2: Play Together 1 · 계획표 완성하기 (선생님의 계획표)
  teacherPlan: [
    { time: 'this afternoon', plan: 'walk the dog' },
    { time: 'tomorrow',       plan: 'see a movie' },
    { time: 'this weekend',   plan: 'go to the library' }
  ],
  // 미션 3: Play Together 2 · 계획 카드 내려놓기 (내 카드)
  myCards: ['walk the dog', 'stay home'],
  // 미션 4: 문장 블록
  sentences: [
    { en: 'What are you going to do tomorrow?', ko: '너는 내일 무엇을 할 거니?' },
    { en: "I'm going to walk the dog.", ko: '나는 개를 산책시킬 거야.' },
    { en: "I'm going to go to the library.", ko: '나는 도서관에 갈 거야.' },
    { en: 'Have a good time!', ko: '좋은 시간 보내!' }
  ],
  // 미션 5: Harry and Ron's Weekend (Reading)
  reading: {
    ron: [
      ['Ron', 'To Harry,', '해리에게,'],
      ['Ron', 'What are you going to do this Sunday?', '이번 일요일에 무엇을 할 거니?'],
      ['Ron', "I'm going to watch the Quidditch World Cup. My brother has game tickets.", '나는 퀴디치 월드컵을 볼 거야. 우리 형이 경기 표를 가지고 있어.'],
      ['Ron', "After the game, we're going to go to London by train.", '경기가 끝나고, 우리는 기차를 타고 런던에 갈 거야.'],
      ['Ron', "I'm going to buy the textbook for the flying class. I'm going to buy a scarf, too.", '나는 비행 수업 교과서를 살 거야. 목도리도 살 거야.'],
      ['Ron', 'Can you join us? Yours, Ron', '너도 함께할래? 론이'] 
    ],
    harry: [
      ['Harry', 'To Ron,', '론에게,'],
      ['Harry', 'Thank you for your letter.', '편지 고마워.'],
      ['Harry', 'I want to watch the game with you. I want to go shopping in London, too.', '너와 함께 경기를 보고 싶어. 런던에서 쇼핑도 하고 싶어.'],
      ['Harry', 'See you this Sunday. Your friend, Harry', '이번 일요일에 만나. 너의 친구 해리가']
    ]
  },
  // 미션 6: Let's Write (Sally의 주말 계획)
  writeSample: [
    ['Sally', 'What are you going to do this weekend? Tell me about your weekend plans.', '이번 주말에 무엇을 할 거니? 주말 계획을 말해 줘.'],
    ['Sally', "I'm going to go to the park on Saturday. I'm going to walk the dog, too.", '나는 토요일에 공원에 갈 거야. 개도 산책시킬 거야.'],
    ['Sally', "I'm going to stay home on Sunday. I'm going to clean my room, too.", '나는 일요일에 집에 있을 거야. 내 방도 청소할 거야.']
  ],
  writePlans: [
    ['go to the park', '공원에 가다'], ['walk the dog', '개를 산책시키다'], ['stay home', '집에 있다'], ['clean my room', '내 방을 청소하다'],
    ['ride a bike', '자전거를 타다'], ['go swimming', '수영하러 가다'], ['go to the library', '도서관에 가다'], ['see a movie', '영화를 보다'],
    ['watch a baseball game', '야구 경기를 보다'], ['do my science project', '과학 과제를 하다'], ['read books', '책을 읽다']
  ],
  // 보너스: Sounds and Letters ea /i:/ (엔진 호환을 위해 배열 이름은 th)
  th: ['read', 'eat', 'beach', 'sea', 'please', 'tea']
};
