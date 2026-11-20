/* 동아출판 초등 영어 6 · Lesson 7 "How Often Do You Exercise?" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L7',
  title: 'Lesson 7 · How Often Do You Exercise?',
  // 생활 습관 (you = 묻는 말, my = 답하는 말)
  habits: [
    { id: 'brush', you: 'brush your teeth', my: 'brush my teeth', ko: '이 닦기',    emoji: '🪥' },
    { id: 'wash',  you: 'wash your hands',  my: 'wash my hands',  ko: '손 씻기',    emoji: '🧼' },
    { id: 'eat',   you: 'eat breakfast',    my: 'eat breakfast',  ko: '아침 먹기',  emoji: '🍳' },
    { id: 'clean', you: 'clean your room',  my: 'clean my room',  ko: '방 청소하기', emoji: '🧹' },
    { id: 'ex',    you: 'exercise',         my: 'exercise',       ko: '운동하기',   emoji: '🏃' }
  ],
  // 미션 2: Listen and Do (교과서 99쪽 대본)
  kids: [
    { id: 'p1', name: 'Amy',  girl: true,  habit: 'brush', freq: 'Three times a day.', ko: '하루에 세 번', shirt: 0xffd54f },
    { id: 'p2', name: 'Tom',  girl: false, habit: 'eat',   freq: 'Four times a week.', ko: '일주일에 네 번', shirt: 0x4caf50 },
    { id: 'p3', name: 'Yuna', girl: true,  habit: 'clean', freq: 'Six times a month.', ko: '한 달에 여섯 번', shirt: 0xff8a80 },
    { id: 'p4', name: 'Leo',  girl: false, habit: 'wash',  freq: 'Five times a day.',  ko: '하루에 다섯 번', shirt: 0x00897b },
    { id: 'p5', name: 'Mia',  girl: true,  habit: 'ex',    freq: 'Twice a week.',      ko: '일주일에 두 번', shirt: 0xba68c8 }
  ],
  // 미션 2: Play Together 1 · 빈도수만큼 동작하기 (선생님 대답 → 일어날 친구 수)
  actGame: [
    { habit: 'brush', answer: 'Twice a day.', n: 2 },
    { habit: 'wash',  answer: 'Five times a day.', n: 5 },
    { habit: 'ex',    answer: 'Three times a week.', n: 3 }
  ],
  // 미션 3: Read and Talk (교과서 101쪽 카드)
  readTalk: [
    { habit: 'clean', freq: 'Four times a week.' },
    { habit: 'ex',    freq: 'Six times a month.' },
    { habit: 'eat',   freq: 'Five times a week.' },
    { habit: 'brush', freq: 'Twice a day.' },
    { habit: 'wash',  freq: 'Three times a day.' }
  ],
  // 미션 3: Play Together 2 · 빈도수 예상하기 (친구가 실제로 답하는 빈도)
  guessGame: [
    { who: 'Kai',   habit: 'wash',  n: 6, unit: 'day' },
    { who: 'Rani',  habit: 'ex',    n: 5, unit: 'week' },
    { who: 'Hajun', habit: 'clean', n: 2, unit: 'week' }
  ],
  numWords: ['', 'Once', 'Twice', 'Three times', 'Four times', 'Five times', 'Six times'],
  // 미션 4: 문장 블록
  sentences: [
    { en: 'How often do you exercise?', ko: '너는 얼마나 자주 운동하니?' },
    { en: 'I brush my teeth three times a day.', ko: '나는 하루에 세 번 이를 닦아.' },
    { en: 'I clean my room twice a week.', ko: '나는 일주일에 두 번 방을 청소해.' },
    { en: 'Good for you.', ko: '잘했구나.' }
  ],
  // 미션 5: The Sound of Music (Reading, 교과서 106~107쪽)
  reading: {
    house: [
      ['Dad', 'This is your new teacher.', '이분은 너희들의 새로운 선생님이시다.'],
      ['Maria', "Hello, I'm Maria. Nice to meet you.", '안녕, 난 마리아야. 만나서 반가워.'],
      ['Maria', "Brigitta, you're reading Romeo and Juliet.", '브리기타, 너는 「로미오와 줄리엣」을 읽고 있구나.'],
      ['Brigitta', 'Yes, I like reading books.', '네, 저는 책 읽는 것을 좋아해요.'],
      ['Maria', 'How often do you read books?', '너는 얼마나 자주 책을 읽니?'],
      ['Brigitta', 'Five times a week.', '일주일에 다섯 번이요.'],
      ['Maria', 'Good for you.', '잘했구나.']
    ],
    out: [
      ['Maria', "It's a beautiful day. Let's go out and exercise.", '날씨가 좋아. 나가서 운동하자.'],
      ['Kurt', 'Sorry. I want to stay home.', '죄송해요. 저는 집에 있고 싶어요.'],
      ['Maria', 'How often do you exercise, Kurt?', '너는 얼마나 자주 운동하니, 커트?'],
      ['Kurt', 'Twice a month.', '한 달에 두 번이요.'],
      ['Maria', "That's not good. Everyone, let's go to the park.", '그건 좋지 않아. 모두들, 공원에 가자.']
    ],
    park: [
      ['Gretl', "Oh, you're good at playing the guitar.", '오, 기타 연주를 잘하시네요.'],
      ['Maria', 'Thanks. I play the guitar every day. How about singing together?', '고마워. 나는 기타를 매일 연주해. 같이 노래하는 게 어떠니?'],
      ['Children', 'Okay.', '좋아요.']
    ]
  },
  // 미션 6: Let's Write (지나의 생활 습관 설문지, 교과서 108쪽)
  writeSample: [
    ['Q', 'How often do you eat breakfast?', '너는 얼마나 자주 아침을 먹니?'],
    ['A', 'I eat breakfast every day.', '나는 매일 아침을 먹어.'],
    ['Q', 'How often do you exercise?', '너는 얼마나 자주 운동하니?'],
    ['A', 'I exercise four times a week.', '나는 일주일에 네 번 운동해.'],
    ['Q', 'How often do you brush your teeth?', '너는 얼마나 자주 이를 닦니?'],
    ['A', 'I brush my teeth twice a day.', '나는 하루에 두 번 이를 닦아.'],
    ['Q', 'How often do you clean your room?', '너는 얼마나 자주 방을 청소하니?'],
    ['A', 'I clean my room twice a week.', '나는 일주일에 두 번 방을 청소해.']
  ],
  // 글쓰기에서 고를 수 있는 생활 습관 (3·4번 질문)
  writeHabits: [
    ['brush your teeth', 'brush my teeth', '이 닦기'], ['wash your hands', 'wash my hands', '손 씻기'],
    ['clean your room', 'clean my room', '방 청소하기'], ['read books', 'read books', '책 읽기'],
    ['play the guitar', 'play the guitar', '기타 치기'], ['sing a song', 'sing a song', '노래하기']
  ],
  writeFreq: [
    ['every day', '매일'], ['once a day', '하루에 한 번'], ['twice a day', '하루에 두 번'], ['three times a day', '하루에 세 번'],
    ['once a week', '일주일에 한 번'], ['twice a week', '일주일에 두 번'], ['three times a week', '일주일에 세 번'], ['four times a week', '일주일에 네 번'],
    ['five times a week', '일주일에 다섯 번'], ['once a month', '한 달에 한 번'], ['twice a month', '한 달에 두 번'], ['six times a month', '한 달에 여섯 번']
  ],
  // 보너스: Sounds and Letters ee (/i:/)
  th: ['three', 'week', 'teeth', 'tree', 'sheep', 'feet']
};
