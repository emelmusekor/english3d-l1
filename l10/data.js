/* 동아출판 초등 영어 6 · Lesson 10 "I'm Taller Than You" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L10',
  title: "Lesson 10 · I'm Taller Than You",
  words: [
    { id: 'bigger',   ko: '더 큰',     emoji: '🐘' },
    { id: 'faster',   ko: '더 빠른',   emoji: '🏎️' },
    { id: 'heavier',  ko: '더 무거운', emoji: '🏋️' },
    { id: 'longer',   ko: '더 긴',     emoji: '📏' },
    { id: 'stronger', ko: '더 힘센',   emoji: '💪' },
    { id: 'taller',   ko: '키가 더 큰', emoji: '🦒' }
  ],
  // 미션 1: Fun Talk 1 (지도서 대본)
  funTalk1: {
    s1: [
      ['Nara', "It's a home run!", '홈런이다!'],
      ['Olivia', 'Kai, you hit the ball very well.', 'Kai, 너 공을 정말 잘 친다.'],
      ['Kai', "Thanks. Nara, you're next.", '고마워. 나라야, 다음은 너야.'],
      ['Boy', "That's my drone. Can you help me?", '저거 제 드론볼이에요. 도와줄 수 있어요?'],
      ['Kai', 'Sure.', '그럼.']
    ]
  },
  // 미션 2: Listen and Do (교과서 143쪽 대본, ok = 그림과 일치)
  listen: [
    { en: 'The blue box is heavier than the yellow box.', ok: false, ko: '그림: 노란 상자 쪽으로 저울이 기울었어요.' },
    { en: 'The orange is bigger than the lemon.',         ok: true,  ko: '그림: 큰 오렌지와 작은 레몬' },
    { en: 'The tiger is stronger than the dog.',          ok: true,  ko: '그림: 힘센 호랑이와 강아지' },
    { en: 'The ruler is longer than the pencil.',         ok: true,  ko: '그림: 긴 자와 짧은 연필' },
    { en: 'Tina is taller than Lily.',                    ok: false, ko: '그림: Lily가 Tina보다 키가 커요.' },
    { en: 'Sam is faster than Mike.',                     ok: false, ko: '그림: Mike가 먼저 결승선에 들어왔어요.' }
  ],
  // Play Together 1·2 그림 카드 (지도서 512~513쪽)
  cards: [
    { word: 'bigger',   en: 'The basketball is bigger than the soccer ball.',     card: '🏀 > ⚽ (크기)' },
    { word: 'faster',   en: 'The red car is faster than the blue car.',           card: '🚗빨강 > 🚙파랑 (빠르기)' },
    { word: 'heavier',  en: 'The apple is heavier than the kiwi.',                card: '🍎 > 🥝 (무게)' },
    { word: 'longer',   en: 'The green pencil is longer than the blue pencil.',   card: '✏️초록 > ✏️파랑 (길이)' },
    { word: 'stronger', en: 'Mia is stronger than Amy.',                          card: '💪 Mia > Amy (힘)' },
    { word: 'taller',   en: 'Eric is taller than Harry.',                         card: '📏 Eric > Harry (키)' }
  ],
  // 미션 3: Fun Talk 2 퀴즈 쇼 (지도서 대본)
  quiz: {
    q1: [['Host', 'Welcome to the quiz show. Are you ready?', '퀴즈 쇼에 오신 것을 환영해요. 준비됐나요?'], ['Hajun', 'Yes.', '네.'], ['Rani', 'Yes.', '네.'],
         ['Host', 'The first question is about animals. Which is faster?', '첫 번째 문제는 동물에 관한 거예요. 어느 것이 더 빠를까요?']],
    rani: 'The rabbit is faster than the horse.',
    hajun: 'The tennis ball is heavier than the baseball.',
    answer2: 'The baseball is heavier than the tennis ball.',
    last: 'Asia is bigger than Africa.'
  },
  // Read and Talk 실생활 동영상 (Mia·Jimin)
  lineTalk: [
    ['Mia', 'Look at this picture. Which is longer, Line A or Line B?', '이 그림을 봐. 선 A와 선 B 중 어느 것이 더 길까?'],
    ['Jimin', 'Line A is longer than Line B.', '선 A가 선 B보다 더 길어.']
  ],
  // 미션 4: 문장 블록
  sentences: [
    { en: "I'm taller than you.", ko: '나는 너보다 키가 더 커.' },
    { en: 'My basket is bigger than yours.', ko: '내 바구니가 네 것보다 더 커.' },
    { en: 'Which is heavier?', ko: '어느 것이 더 무겁니?' },
    { en: 'Are you sure?', ko: '확실하니?' }
  ],
  // 미션 5: Alice in Dreamland (교과서 150~151쪽)
  reading: {
    p1: [
      ['Narrator', 'Alice read a book under a tree. She saw Mr. Rabbit.', 'Alice는 나무 아래에서 책을 읽었어요. 그녀는 토끼 씨를 보았어요.'],
      ['Alice', "Hello, I'm Alice. Where are you going?", '안녕, 나는 Alice야. 어디 가니?'],
      ['Mr. Rabbit', "Hi! I'm going to Dreamland. Let's go together.", '안녕! 나는 꿈나라에 가. 같이 가자.'],
      ['Alice', "Okay. Oh, wait! I'm slower than you.", '좋아. 아, 기다려! 나는 너보다 느려.']
    ],
    p2: [
      ['Narrator', 'Alice and Mr. Rabbit found a door in a big tree.', 'Alice와 토끼 씨는 큰 나무에서 문을 발견했어요.'],
      ['Alice', "I'm bigger than the door. I can't go inside.", '나는 문보다 더 커. 안으로 들어갈 수 없어.'],
      ['Mr. Rabbit', 'Drink this, Alice.', 'Alice, 이것을 마셔.'],
      ['Alice', "Now, I'm smaller than the door.", '이제 나는 문보다 더 작아.']
    ],
    p3: [
      ['Narrator', 'Alice and Mr. Rabbit found a house. They went into the house.', 'Alice와 토끼 씨는 집을 발견했어요. 그들은 집 안으로 들어갔어요.'],
      ['Narrator', 'There are two cookies on a table.', '탁자 위에 쿠키 두 개가 있어요.'],
      ['Alice', 'The apple cookie is bigger than the lemon cookie. I want the apple cookie.', '사과 쿠키가 레몬 쿠키보다 더 커. 나는 사과 쿠키를 먹을래.'],
      ['Mr. Rabbit', "Oh, no! Now, you're bigger than the house.", '이런! 이제 너는 집보다 더 커.']
    ],
    p4: [
      ['나', 'Wake up, Alice!', 'Alice, 일어나!'],
      ['Alice', 'Oh, it was a dream.', '아, 꿈이었구나.']
    ]
  },
  // 미션 6: Let's Write (하나와 Stacy)
  writeSample: [
    ['Hana', 'Stacy and I are friends.', 'Stacy와 나는 친구예요.'],
    ['Hana', "My hand is bigger than Stacy's.", '내 손은 Stacy의 손보다 더 커요.'],
    ['Hana', "Stacy's hair is longer than mine.", 'Stacy의 머리카락은 내 것보다 더 길어요.'],
    ['Hana', "My bag is heavier than Stacy's.", '내 가방은 Stacy의 가방보다 더 무거워요.'],
    ['Hana', "Stacy's eraser is smaller than mine.", 'Stacy의 지우개는 내 것보다 더 작아요.']
  ],
  // 비교 항목 [물건, 비교하는 말, 한국어]
  writeItems: [
    ['hand', 'bigger', '손 · 더 큰'], ['hair', 'longer', '머리카락 · 더 긴'], ['bag', 'heavier', '가방 · 더 무거운'],
    ['eraser', 'smaller', '지우개 · 더 작은'], ['pencil', 'longer', '연필 · 더 긴'], ['foot', 'bigger', '발 · 더 큰'],
    ['arm', 'longer', '팔 · 더 긴'], ['book', 'heavier', '책 · 더 무거운'], ['ruler', 'longer', '자 · 더 긴'],
    ['pencil case', 'bigger', '필통 · 더 큰'], ['water bottle', 'heavier', '물병 · 더 무거운'], ['backpack', 'smaller', '책가방 · 더 작은']
  ],
  // 보너스: Sounds and Letters er (배열 이름은 엔진 호환을 위해 th)
  th: ['bigger', 'tiger', 'faster', 'taller', 'water', 'teacher']
};
