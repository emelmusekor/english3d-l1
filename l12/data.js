/* 동아출판 초등 영어 6 · Lesson 12 "What Do You Think?" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L12',
  title: 'Lesson 12 · What Do You Think?',
  // Key Words (교과서 173쪽)
  words: [
    { id: 'cheap',     ko: '값이 싼',    emoji: '🪙', opp: 'expensive', kt: '싸다고' },
    { id: 'expensive', ko: '값이 비싼',  emoji: '💎', opp: 'cheap', kt: '비싸다고' },
    { id: 'easy',      ko: '쉬운',       emoji: '👌', opp: 'difficult', kt: '쉽다고' },
    { id: 'difficult', ko: '어려운',     emoji: '🤯', opp: 'easy', kt: '어렵다고' },
    { id: 'fun',       ko: '재미있는',   emoji: '🤩', opp: 'boring', kt: '재미있다고' },
    { id: 'boring',    ko: '지루한',     emoji: '🥱', opp: 'fun', kt: '지루하다고' }
  ],
  // 미션 1: Fun Talk 1 (지도서 대본)
  funTalk1: {
    slope: [
      ['Kai', "I'm faster than you.", '내가 너보다 빨라.'],
      ['Dad', "Look over there. There's an ice show.", '저기 봐. 아이스 쇼가 있네.'],
      ['Sister', 'Oh, it looks fun. What do you think, Kai?', '와, 재미있어 보여. 오빠는 어떻게 생각해?']
    ],
    shop: [
      ['Kai', "Oh, it's warm in here.", '와, 여긴 따뜻하다.'],
      ['Sister', 'Look at this cup. I like it.', '이 컵 좀 봐. 마음에 들어.'],
      ['Kai', "Oh, that looks like a skate. It's 5,000 won.", '와, 스케이트처럼 생겼네. 5,000원이야.'],
      ['Sister', 'This is cheap. What do you think?', '이거 싸다. 오빠는 어떻게 생각해?']
    ]
  },
  // 미션 2: Listen and Do (교과서 173쪽 대본) — G: Yuna, B: Andy
  listen: [
    { thing: 'scarf',      emoji: '🧣', price: '₩5,000',  a: ['Yuna', "I think it's cheap. What do you think?"],          b: ['Andy', "I don't think so. I think it's expensive."],   agree: false },
    { thing: 'hat',        emoji: '🧢', price: '₩10,000', a: ['Andy', "I think it's expensive. What do you think?"],      b: ['Yuna', 'I think so, too.'],                            agree: true },
    { thing: 'board game', emoji: '🎲', price: '',        a: ['Andy', 'I think it looks fun. What do you think?'],      b: ['Yuna', 'I think so, too.'],                            agree: true },
    { thing: 'book',       emoji: '📗', price: '',        a: ['Yuna', 'I think it looks boring. What do you think?'],   b: ['Andy', "I don't think so. I think it looks fun."],      agree: false },
    { thing: 'cup game',   emoji: '🥤', price: '',        a: ['Yuna', "I think it's easy. What do you think?"],          b: ['Andy', "I don't think so. I think it's difficult."],   agree: false },
    { thing: 'puzzle cube', emoji: '🧊', price: '',       a: ['Andy', "I think it's difficult. What do you think?"],     b: ['Yuna', 'I think so, too.'],                            agree: true }
  ],
  // 미션 2: Play Together 1 · 선택 대결 놀이 그림 카드
  cards: [
    { pic: '🧩', en: "I think it's difficult." }, { pic: '🎢', en: "I think it's fun." },
    { pic: '💍', en: "I think it's expensive." }, { pic: '🧮', en: "I think it's easy." },
    { pic: '🍬 ₩500', en: "I think it's cheap." }, { pic: '📺', en: "I think it's boring." }
  ],
  // 미션 3: Fun Talk 2 (지도서 대본)
  funTalk2: {
    gate: [
      ['Rani', "It's already February.", '벌써 2월이야.'],
      ['Joel', "I'll miss our teacher, Ms. Smith.", '스미스 선생님이 보고 싶을 거야.'],
      ['Rani', "Me, too. Let's do something for her.", '나도. 선생님을 위해 뭔가 하자.']
    ],
    end: [
      ['Ms. Smith', 'Congratulations, everyone!', '모두 졸업 축하해요!'],
      ['Rani', 'Thank you so much, Ms. Smith.', '스미스 선생님, 정말 감사합니다.'],
      ['Ms. Smith', "I'll miss you.", '보고 싶을 거예요.']
    ]
  },
  // 미션 3: Read and Talk 그림 (교과서 175쪽)
  readTalk: [
    { pic: '🚀 SPACE', word: 'fun' }, { pic: '🎠', word: 'boring' }, { pic: '🧱', word: 'easy' },
    { pic: '➗ 1/2 + 3/4', word: 'difficult' }, { pic: '☕ ₩2,000', word: 'cheap' }, { pic: '👗 ₩9,000', word: 'expensive' }
  ],
  // 미션 3: Play Together 2 · 같은 의견 찾기 (교과서 175쪽 표)
  opinions: [
    { id: 'game',  pic: '🎮', en: 'the computer game', pair: ['fun', 'boring'] },
    { id: 'bike',  pic: '🚲', en: 'riding a bike',     pair: ['easy', 'difficult'] },
    { id: 'bag',   pic: '🎒 ₩15,000', en: 'the backpack', pair: ['cheap', 'expensive'] }
  ],
  classmates: [
    { id: 'c1', name: 'Minho', girl: false, shirt: 0x5c7cfa, topic: 'game', says: 'fun' },
    { id: 'c2', name: 'Grace', girl: true,  shirt: 0xf783ac, topic: 'bike', says: 'difficult' },
    { id: 'c3', name: 'Tom',   girl: false, shirt: 0x20c997, topic: 'bag',  says: 'expensive' }
  ],
  // 미션 4: 문장 블록
  sentences: [
    { en: 'What do you think?', ko: '너는 어떻게 생각하니?' },
    { en: "I think it's fun.", ko: '나는 그것이 재미있다고 생각해.' },
    { en: 'I think so, too.', ko: '나도 그렇게 생각해.' },
    { en: "I don't think so.", ko: '나는 그렇게 생각하지 않아.' }
  ],
  // 미션 5: What Do You Think? (Reading, 교과서 180~181쪽)
  reading: {
    p1: [
      ['Leo', 'Look at this painting. Roy Lichtenstein painted it in 1964.', '이 그림을 봐. 로이 릭턴스타인이 1964년에 이걸 그렸어.'],
      ['Ava', "I know him. He's an American painter.", '나 그 사람 알아. 미국 화가야.'],
      ['Leo', "The woman is smiling. I think she's happy. What do you think?", '여자가 미소 짓고 있어. 나는 그녀가 행복하다고 생각해. 너는 어떻게 생각해?'],
      ['Ava', "I don't think so. I think she's sad. She's crying.", '나는 그렇게 생각하지 않아. 나는 그녀가 슬프다고 생각해. 울고 있잖아.']
    ],
    p2: [
      ['Zoe', 'Do you know Claude Monet?', '너 클로드 모네 아니?'],
      ['Ben', "Yes, he's my favorite painter.", '응, 내가 가장 좋아하는 화가야.'],
      ['Zoe', 'Look! He painted this painting. The woman is lying on the flowers.', '봐! 그가 이 그림을 그렸어. 여자가 꽃 위에 누워 있어.'],
      ['Ben', "I think she's sleeping. What do you think?", '나는 그녀가 자고 있다고 생각해. 너는 어떻게 생각해?'],
      ['Zoe', "I don't think so. I think she's reading a book.", '나는 그렇게 생각하지 않아. 나는 그녀가 책을 읽고 있다고 생각해.'],
      ['Zoe', 'Look at her hands. She has a book.', '그녀의 손을 봐. 책을 들고 있어.']
    ],
    // After You Read A: 어느 작품에 맞는 문장일까요? (1: 릭턴스타인, 2: 모네)
    match: [
      { en: 'Roy Lichtenstein painted this painting.', n: 1 },
      { en: 'The woman is lying on the flowers.', n: 2 },
      { en: 'Claude Monet painted this painting.', n: 2 },
      { en: 'The American painter painted it in 1964.', n: 1 }
    ],
    // After You Read B
    fill: [
      { who: 'Leo', ans: 'happy', opts: ['happy', 'sad', 'sleeping'] },
      { who: 'Ava', ans: 'sad', opts: ['sad', 'happy', 'reading a book'] },
      { who: 'Ben', ans: 'sleeping', opts: ['sleeping', 'crying', 'reading a book'] },
      { who: 'Zoe', ans: 'reading', opts: ['reading', 'sleeping', 'smiling'] }
    ]
  },
  // 미션 6: Let's Write (교과서 182~183쪽)
  writeSample: [
    ['Emma', 'Playing computer games is good. What do you think?', '컴퓨터 게임을 하는 것은 좋아. 너는 어떻게 생각해?'],
    ['Sam', 'I think so, too. Playing computer games is fun.', '나도 그렇게 생각해. 컴퓨터 게임을 하는 것은 재미있어.'],
    ['Sam', 'There are some good games for students. You can get good ideas from computer games.', '학생들을 위한 좋은 게임이 있어. 컴퓨터 게임에서 좋은 아이디어를 얻을 수 있어.'],
    ['Lily', "I don't think so. You don't play outside often.", '나는 그렇게 생각하지 않아. 밖에서 자주 놀지 않게 돼.'],
    ['Lily', "You don't talk with your family often. Sometimes you play computer games too much.", '가족과 자주 이야기하지 않게 돼. 가끔은 컴퓨터 게임을 너무 많이 해.']
  ],
  reasons: {
    good: [['Playing computer games is fun.', '컴퓨터 게임을 하는 것은 재미있어요.'], ['There are some good games for students.', '학생들을 위한 좋은 게임이 있어요.'], ['You can get good ideas from computer games.', '컴퓨터 게임에서 좋은 아이디어를 얻을 수 있어요.']],
    bad: [["You don't play outside often.", '밖에서 자주 놀지 않게 돼요.'], ["You don't talk with your family often.", '가족과 자주 이야기하지 않게 돼요.'], ['Sometimes you play computer games too much.', '가끔은 컴퓨터 게임을 너무 많이 해요.']]
  },
  // 보너스: Sounds and Letters ing
  th: ['fishing', 'boring', 'playing', 'reading', 'sleeping', 'smiling']
};
