/* 동아출판 초등 영어 6 · Lesson 8 "Why Are You Happy?" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L8',
  title: 'Lesson 8 · Why Are You Happy?',
  feelings: [
    { id: 'happy',   ko: '행복한',     emoji: '😄' },
    { id: 'sad',     ko: '슬픈',       emoji: '😢' },
    { id: 'upset',   ko: '속상한',     emoji: '😠' },
    { id: 'worried', ko: '걱정스러운', emoji: '😟' },
    { id: 'tired',   ko: '피곤한',     emoji: '😴' }
  ],
  // 감정·상태의 이유 (Listen and Do · Read and Talk 어구)
  reasons: [
    { feel: 'happy',   en: 'I won the soccer game',          phrase: 'won the soccer game',  pic: '⚽🏆', ko: '축구 경기에서 이겼어요' },
    { feel: 'sad',     en: 'my friend moved to a new city',  phrase: 'moved to a new city',  pic: '🚚🏙️', ko: '친구가 새 도시로 이사 갔어요' },
    { feel: 'upset',   en: 'my sister broke my robot',       phrase: 'broke my robot',       pic: '🤖💥', ko: '여동생이 내 로봇을 망가뜨렸어요' },
    { feel: 'worried', en: 'I have a math quiz',             phrase: 'have a math quiz',     pic: '📝➗', ko: '수학 퀴즈가 있어요' },
    { feel: 'tired',   en: 'I stayed up late last night',    phrase: 'stayed up late',       pic: '🌙📚', ko: '어젯밤 늦게까지 깨어 있었어요' }
  ],
  // 미션 2: Listen and Do (지도서 대본 순서 ➊~➎)
  kids: [
    { id: 'k1', name: 'Amy',  girl: true,  feel: 'tired',   because: 'I stayed up late last night.',   shirt: 0xffb300 },
    { id: 'k2', name: 'Tom',  girl: false, feel: 'happy',   because: 'I won the soccer game.',         shirt: 0x43a047 },
    { id: 'k3', name: 'Lucy', girl: true,  feel: 'sad',     because: 'my friend moved to a new city.', shirt: 0x42a5f5 },
    { id: 'k4', name: 'Sam',  girl: false, feel: 'upset',   because: 'my sister broke my robot.',      shirt: 0xe53935 },
    { id: 'k5', name: 'Emma', girl: true,  feel: 'worried', because: 'I have a math quiz.',            shirt: 0x8e24aa }
  ],
  // 미션 3: Play Together 2 · 얼굴 표정 짓기 (Read and Talk 예시 대화)
  faces: [
    { feel: 'upset',   because: 'Because my brother broke my robot.' },
    { feel: 'worried', because: 'Because I have a math quiz.' },
    { feel: 'happy',   because: 'Because I won the soccer game.' },
    { feel: 'sad',     because: 'Because my friend moved to a new city.' },
    { feel: 'tired',   because: 'Because I stayed up late.' }
  ],
  // 미션 4: 문장 블록
  sentences: [
    { en: 'Why are you happy?', ko: '너는 왜 행복하니?' },
    { en: 'Because I won the soccer game.', ko: '왜냐하면 나는 축구 경기에서 이겼기 때문이야.' },
    { en: 'Because my brother broke my robot.', ko: '왜냐하면 내 남동생이 내 로봇을 망가뜨렸기 때문이야.' },
    { en: "Don't worry. I can help you.", ko: '걱정하지 마. 내가 도와줄 수 있어.' }
  ],
  // 미션 5: What Color Is Your World? (교과서 120~121쪽)
  reading: {
    blue: [
      ['Poet', 'Why are you sad today?', '오늘 너는 왜 슬프니?'],
      ['Poet', 'Because I will move to a new city.', '왜냐하면 나는 새 도시로 이사 갈 거라서.'],
      ['Poet', 'I will miss my best friend, Judy.', '나는 가장 친한 친구 Judy가 보고 싶을 거야.'],
      ['Poet', 'Blue, blue, my world is blue.', '파랑, 파랑, 나의 세상은 파랑이야.']
    ],
    gray: [
      ['Poet', 'Why are you worried today?', '오늘 너는 왜 걱정스럽니?'],
      ['Poet', 'Because I will go to a new school.', '왜냐하면 나는 새 학교에 갈 거라서.'],
      ['Poet', 'I will meet new people.', '나는 새로운 사람들을 만날 거야.'],
      ['Poet', 'Gray, gray, my world is gray.', '회색, 회색, 나의 세상은 회색이야.']
    ],
    yellow: [
      ['Poet', 'Why are you happy today?', '오늘 너는 왜 행복하니?'],
      ['Poet', 'Because I made a new friend, Kate.', '왜냐하면 나는 새 친구 Kate를 사귀었거든.'],
      ['Poet', "She's in my class.", '그 애는 우리 반이야.'],
      ['Poet', 'Yellow, yellow, my world is yellow.', '노랑, 노랑, 나의 세상은 노랑이야.'],
      ['Poet', 'What color is your world today?', '오늘 너의 세상은 무슨 색이니?']
    ]
  },
  // 미션 6: Let's Write (Alex의 온라인 글, 교과서 122쪽)
  writeSample: [
    { feel: 'upset', lines: ["Today, I'm upset. Why?", 'Because my sister broke my bike.', 'My mom bought it for my birthday.'], comment: "Don't worry.", tags: '#upset #bike' },
    { feel: 'happy', lines: ["Today, I'm happy. Why?", 'Because I won the soccer game.', 'I scored a goal, too.'], comment: 'Good for you!', tags: '#happy #soccer game' }
  ],
  // 글쓰기 이유 보기 [영어 이유, 한국어, 설명 문장, 해시태그, 기쁜 일?]
  writeReasons: [
    ['I won the soccer game', '축구 경기에서 이겼어요', 'I scored a goal, too.', 'soccer game', true],
    ['I made a new friend', '새 친구를 사귀었어요', "She's in my class.", 'new friend', true],
    ['my friend moved to a new city', '친구가 새 도시로 이사 갔어요', 'I will miss my friend.', 'friend'],
    ['my brother broke my robot', '남동생이 내 로봇을 망가뜨렸어요', 'I made it yesterday.', 'robot'],
    ['my sister broke my bike', '여동생이 내 자전거를 망가뜨렸어요', 'My mom bought it for my birthday.', 'bike'],
    ['I have a math quiz', '수학 퀴즈가 있어요', 'This problem is too hard.', 'math quiz'],
    ['I stayed up late last night', '어젯밤 늦게까지 깨어 있었어요', 'I studied for the quiz.', 'stayed up late']
  ],
  writeComments: [
    ['Good for you!', '잘됐다!', true], ['Congratulations!', '축하해!', true],
    ["Don't worry.", '걱정하지 마.', false], ["Don't worry. I can help you.", '걱정하지 마. 내가 도와줄게.', false]
  ],
  // 보너스: Sounds and Letters br
  th: ['brother', 'broke', 'brown', 'bread', 'bridge', 'brush']
};
