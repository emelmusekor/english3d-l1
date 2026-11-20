/* 동아출판 초등 영어 6 · Lesson 2 "What Would You Like to Have?" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L2',
  title: "Lesson 2 · What Would You Like to Have?",
  foods: [
    { id: 'beef steak',       ko: '소고기 스테이크', emoji: '🥩' },
    { id: 'potato pizza',     ko: '감자 피자',       emoji: '🍕' },
    { id: 'chicken sandwich', ko: '치킨 샌드위치',   emoji: '🥪' },
    { id: 'tomato spaghetti', ko: '토마토 스파게티', emoji: '🍝' },
    { id: 'fruit salad',      ko: '과일 샐러드',     emoji: '🥗' },
    { id: 'lemon juice',      ko: '레몬주스',        emoji: '🍋' },
    { id: 'cheese pizza',     ko: '치즈 피자',       emoji: '🍕' },
    { id: 'chocolate cake',   ko: '초콜릿 케이크',   emoji: '🍰' },
    { id: 'ice cream',        ko: '아이스크림',      emoji: '🍦' },
    { id: 'fish and chips',   ko: '피시 앤드 칩스',  emoji: '🍟' },
    { id: 'milk',             ko: '우유',            emoji: '🥛' },
    { id: 'lemon candy',      ko: '레몬 사탕',       emoji: '🍬' }
  ],
  // 북쪽 음식 가게 6곳 (왼쪽 → 오른쪽, 일부러 섞어 둠)
  stallOrder: ['fruit salad', 'beef steak', 'lemon juice', 'potato pizza', 'tomato spaghetti', 'chicken sandwich'],

  // 미션 2: Listen and Do 손님
  customers: [
    { id: 'c1', name: 'Emma', girl: true,  food: 'lemon juice',      shirt: 0xff8a80 },
    { id: 'c2', name: 'Sam',  girl: false, food: 'fruit salad',      shirt: 0x4caf50 },
    { id: 'c3', name: 'Lily', girl: true,  food: 'beef steak',       shirt: 0xba68c8 },
    { id: 'c4', name: 'Ben',  girl: false, food: 'chicken sandwich', shirt: 0xffb300 }
  ],
  // Play Together 1: 같은 음식 주문하기 (듣고 고르기)
  pt1: ['tomato spaghetti', 'potato pizza', 'lemon juice'],

  // 미션 3: Play Together 2 맛 찾기
  tastes: [
    { food: 'lemon juice',      short: 'juice',    taste: 'sour',  face: '🍋😖', cue: '얼굴이 저절로 찡그려져요!' },
    { food: 'chocolate cake',   short: 'cake',     taste: 'sweet', face: '🍰😋', cue: '설탕 맛이 가득해요!' },
    { food: 'cheese pizza',     short: 'pizza',    taste: 'salty', face: '🍕🧂', cue: '소금 맛이 나요!' },
    { food: 'chicken sandwich', short: 'sandwich', taste: 'hot',   face: '🥪🥵', cue: '혀가 화끈화끈해요!' }
  ],

  // 미션 4: 문장 블록 (Write and Do)
  sentences: [
    { en: 'What would you like to have?', ko: '무엇을 먹고 싶니?' },
    { en: "I'd like to have a beef steak, please.", ko: '소고기 스테이크 주세요.' },
    { en: "How's your salad?", ko: '샐러드 맛이 어때?' },
    { en: "It's sweet.", ko: '달콤해.' }
  ],

  // 미션 5: 배고픈 고양이 (Reading)
  reading: {
    joy: [
      ['Narrator', 'On a sunny day, a hungry cat comes to Joy’s Restaurant.', '어느 화창한 날, 배고픈 고양이가 Joy’s Restaurant에 와요.'],
      ['Server', 'Welcome! What would you like to have?', '어서 오세요! 무엇을 드시겠어요?'],
      ['Cat', "I'd like to have a cheese pizza, please.", '치즈 피자 주세요.'],
      ['Cat', "I'd like to have a beef steak, too.", '소고기 스테이크도 주세요.'],
      ['Server', "How's your pizza?", '피자 맛이 어때요?'],
      ['Cat', "Umm, it's salty but delicious.", '음, 짜지만 맛있어요.'],
      ['Cat', "Now, I'm full. I'm a happy cat.", '이제 배불러요. 나는 행복한 고양이예요.']
    ],
    cake: [
      ['Narrator', 'On a rainy day, a hungry cat comes to Cake House.', '어느 비 오는 날, 배고픈 고양이가 Cake House에 와요.'],
      ['Baker', 'Welcome! What would you like to have?', '어서 오세요! 무엇을 드시겠어요?'],
      ['Cat', "I'd like to have a chocolate cake, please.", '초콜릿 케이크 주세요.'],
      ['Cat', "I'd like to have some ice cream, too.", '아이스크림도 주세요.'],
      ['Baker', "How's your cake?", '케이크 맛이 어때요?'],
      ['Cat', "Umm, it's sweet.", '음, 달콤해요.'],
      ['Cat', "Now, I'm full. I'm a happy cat.", '이제 배불러요. 나는 행복한 고양이예요.']
    ]
  },

  // 미션 6: Let's Write 세 컷 만화
  comicSample: [
    ['Server', 'What would you like to have?', '무엇을 먹고 싶니?'],
    ['Jiho', "I'd like to have a chicken sandwich, please.", '치킨 샌드위치 주세요.'],
    ['Jiho', "I'd like to have a lemon juice, too.", '레몬주스도 주세요.'],
    ['Server', "How's your juice?", '주스 맛이 어때?'],
    ['Jiho', "It's sour.", '셔.']
  ],
  comicFoods: [ // [문장에 쓰는 말, 한글, How's your ___?, 그림]
    ['a beef steak', '소고기 스테이크', 'steak', '🥩'],
    ['a potato pizza', '감자 피자', 'pizza', '🍕'],
    ['a cheese pizza', '치즈 피자', 'pizza', '🍕'],
    ['a chicken sandwich', '치킨 샌드위치', 'sandwich', '🥪'],
    ['a tomato spaghetti', '토마토 스파게티', 'spaghetti', '🍝'],
    ['a fruit salad', '과일 샐러드', 'salad', '🥗'],
    ['a lemon juice', '레몬주스', 'juice', '🍋'],
    ['a chocolate cake', '초콜릿 케이크', 'cake', '🍰'],
    ['some ice cream', '아이스크림', 'ice cream', '🍦'],
    ['some milk', '우유', 'milk', '🥛']
  ],
  tasteWords: [['sweet', '달콤한 😋'], ['sour', '신 😖'], ['salty', '짠 🧂'], ['hot', '매운 🥵'], ['delicious', '맛있는 😍']],

  // 보너스: Sounds and Letters ch
  th: ['chicken', 'cheese', 'chocolate', 'lunch', 'chips', 'sandwich']
};
