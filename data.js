/* 동아출판 초등 영어 6 · Lesson 1 "I'm in the Sixth Grade" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L1',
  title: "Lesson 1 · I'm in the Sixth Grade",
  grades: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'],
  gradeKo: { first: '1학년', second: '2학년', third: '3학년', fourth: '4학년', fifth: '5학년', sixth: '6학년' },
  // 교실 건물 왼쪽 → 오른쪽 문 순서 (일부러 섞어 둠)
  roomOrder: ['fourth', 'first', 'sixth', 'third', 'fifth', 'second'],

  clubs: [
    { id: 'book',      en: 'book club',      ko: '책 동아리' },
    { id: 'history',   en: 'history club',   ko: '역사 동아리' },
    { id: 'badminton', en: 'badminton club', ko: '배드민턴 동아리' },
    { id: 'guitar',    en: 'guitar club',    ko: '기타 동아리' },
    { id: 'dance',     en: 'dance club',     ko: '춤 동아리' },
    { id: 'cooking',   en: 'cooking club',   ko: '요리 동아리' }
  ],

  // 미션 2: 길 잃은 친구들 (Listen and Do)
  students: [
    { id: 's1', name: 'Tom',  grade: 'fourth', girl: false, shirt: 0x4caf50 },
    { id: 's2', name: 'Amy',  grade: 'first',  girl: true,  shirt: 0xff8a80 },
    { id: 's3', name: 'Leo',  grade: 'fifth',  girl: false, shirt: 0xffb300 },
    { id: 's4', name: 'Yuna', grade: 'third',  girl: true,  shirt: 0xba68c8 }
  ],

  // 미션 4: 문장 블록 (Write and Do)
  sentences: [
    { en: 'What grade are you in?', ko: '너는 몇 학년이니?' },
    { en: "I'm in the sixth grade.", ko: '나는 6학년이야.' },
    { en: 'What club are you in?', ko: '너는 무슨 동아리니?' },
    { en: "I'm in the book club.", ko: '나는 책 동아리야.' }
  ],

  // 미션 5: World Children Meeting (Reading)
  world: {
    miso: { name: 'Miso', country: 'Korea', lines: [
      ["Hello! I'm Miso from Korea.", '안녕! 나는 한국에서 온 미소야.'],
      ["I'm in the sixth grade.", '나는 6학년이야.'],
      ["I'm in the cooking club.", '나는 요리 동아리야.'],
      ['I like cooking and eating bibimbap.', '나는 비빔밥을 요리하고 먹는 것을 좋아해.']
    ]},
    julia: { name: 'Julia', country: 'France', lines: [
      ["Hello! I'm Julia from France.", '안녕! 나는 프랑스에서 온 Julia야.'],
      ["I'm in the fifth grade.", '나는 5학년이야.'],
      ["I'm in the soccer club.", '나는 축구 동아리야.'],
      ['I like playing soccer with my friends.', '나는 친구들과 축구하는 것을 좋아해.']
    ]},
    kamal: { name: 'Kamal', country: 'India', lines: [
      ["Hi! I'm Kamal from India.", '안녕! 나는 인도에서 온 Kamal이야.'],
      ["I'm in the fourth grade.", '나는 4학년이야.'],
      ['There are many cows in my city.', '우리 도시에는 소가 많아.'],
      ['I want to be an animal doctor.', '나는 수의사가 되고 싶어.']
    ]}
  },

  // 미션 6: Let's Write
  jiho: [
    ['My name is Jiho.', '내 이름은 지호야.'],
    ['I live in Seoul, Korea.', '나는 한국 서울에 살아.'],
    ["I'm in the sixth grade.", '나는 6학년이야.'],
    ["I'm in the book club.", '나는 책 동아리야.'],
    ['I like reading books.', '나는 책 읽는 것을 좋아해.'],
    ['I want to be a writer.', '나는 작가가 되고 싶어.']
  ],
  writeOptions: {
    live: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Jeju'],
    club: ['book', 'history', 'badminton', 'guitar', 'dance', 'cooking', 'soccer', 'math', 'science', 'art'],
    like: [
      ['reading books', '책 읽기'], ['cooking', '요리하기'], ['playing soccer', '축구하기'],
      ['dancing', '춤추기'], ['playing the guitar', '기타 치기'], ['drawing pictures', '그림 그리기'],
      ['playing badminton', '배드민턴 치기'], ['singing', '노래하기'], ['playing games', '게임하기']
    ],
    want: [
      ['a writer', '작가'], ['a teacher', '선생님'], ['a cook', '요리사'], ['an animal doctor', '수의사'],
      ['a singer', '가수'], ['a scientist', '과학자'], ['a soccer player', '축구 선수'],
      ['a dancer', '무용가'], ['a doctor', '의사'], ['a game designer', '게임 개발자']
    ]
  },

  // 보너스: Sounds and Letters th
  th: ['sixth', 'fourth', 'fifth', 'math', 'Beth', 'three']
};
