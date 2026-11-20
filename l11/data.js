/* 동아출판 초등 영어 6 · Lesson 11 "How Can I Get to the Library?" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다.
   (정류장 이름 stop 은 market / library / hospital / bank / park / school / station 중에서 고르세요) */
window.LESSON = {
  id: 'L11',
  title: 'Lesson 11 · How Can I Get to the Library?',
  // 오답 보기로 쓰는 교통수단
  lines: ['Bus Number 5', 'Bus Number 7', 'Bus Number 3', 'Bus Number 10', 'Subway Line 2', 'Subway Line 3', 'Subway Line 4', 'Subway Line 7'],
  // 위치를 나타내는 말
  preps: [
    { id: 'in front of', ko: '~ 앞에', emoji: '⬇️' },
    { id: 'behind',      ko: '~ 뒤에', emoji: '⬆️' },
    { id: 'between',     ko: '~ 사이에', emoji: '↔️' }
  ],
  // 미션 1: Fun Talk 1 (지도서 396쪽 대본)
  funTalk1: {
    scene1: [
      ['Hajun', 'Look at this. I went to a climbing center last weekend.', '이것 봐. 나 지난 주말에 클라이밍 센터에 갔었어.'],
      ['Kai', 'Wow, it looks fun. I like climbing.', '와, 재미있어 보인다. 나 클라이밍 좋아해.'],
      ['Hajun', "I'm going to go there tomorrow. Do you want to come?", '내일 거기 또 갈 거야. 같이 갈래?']
    ],
    question: 'Sure. How can I get to the climbing center?',
    answer: "Take Bus Number 5 and get off at Green Market. Let's meet at the center at 3.",
    line: 'Bus Number 5', stop: 'market', stopLabel: 'Green Market',
    passerQ: "Excuse me. How can I get to the children's library?",
    passerA: 'Take Subway Line 3 and get off at Happy Park.'
  },
  // 미션 2: Listen and Do (지도서 398쪽 대본) — B: Boy, G: Girl
  listenDo: [
    { q: ['Boy', 'How can I get to the zoo?'],        a: ['Girl', 'Take Bus Number 5 and get off at the market.'],      kind: 'bus',    stop: 'market' },
    { q: ['Girl', 'How can I get to the flower shop?'], a: ['Boy', 'Take Subway Line 3 and get off at the park.'],       kind: 'subway', stop: 'park' },
    { q: ['Boy', 'How can I get to the restaurant?'],  a: ['Girl', 'Take Bus Number 7 and get off at the school.'],     kind: 'bus',    stop: 'school' },
    { q: ['Girl', 'How can I get to the library?'],    a: ['Boy', 'Take Subway Line 4 and get off at the bank.'],       kind: 'subway', stop: 'bank' },
    { q: ['Boy', 'How can I get to the museum?'],      a: ['Girl', 'Take Bus Number 9 and get off at the hospital.'],   kind: 'bus',    stop: 'hospital' }
  ],
  stopWords: { market: ['market', '🛒', '시장'], park: ['park', '🌳', '공원'], school: ['school', '🏫', '학교'], bank: ['bank', '🏦', '은행'], hospital: ['hospital', '🏥', '병원'] },
  // 미션 2: Play Together 1 · 지도 완성하기 (물음표 건물에 스티커 붙이기)
  mapGame: [
    { place: 'flowershop', name: 'flower shop', line: 'Subway Line 2', stop: 'hospital', stopLabel: 'the hospital' },
    { place: 'zoo',        name: 'zoo',         line: 'Subway Line 4', stop: 'school',   stopLabel: 'the school' },
    { place: 'bookstore',  name: 'bookstore',   line: 'Bus Number 7',  stop: 'library',  stopLabel: 'the library' }
  ],
  // 미션 3: Fun Talk 2 (지도서 402쪽 대본)
  funTalk2: {
    home: [
      ['Dad', 'What are you going to do tomorrow?', '내일 뭐 할 거니?'],
      ['Olivia', "I'm going to visit the airplane museum with Joel.", 'Joel이랑 비행기 박물관에 갈 거예요.'],
      ['Dad', 'That sounds fun.', '재미있겠구나.']
    ],
    question: 'How can I get to the airplane museum?',
    answer: "Take Subway Line 2 and get off at ABC Hospital. It's in front of the bank.",
    line: 'Subway Line 2', stop: 'hospital', stopLabel: 'ABC Hospital',
    lost: "Go straight one block. It's between the restaurant and the flower shop."
  },
  // 미션 3: Read and Talk · Play Together 2 (목적지 찾아가기) — 마을 지도에 맞춘 길 안내
  findGame: [
    { place: 'artcenter', name: 'art center', line: 'Bus Number 10', stop: 'library', stopLabel: 'the library',
      where: "It's behind the bookstore.", prep: 'behind', ref: 'bookstore', ko: '책방(Bookstore) 뒤' },
    { place: 'museum', name: 'museum', line: 'Bus Number 3', stop: 'bank', stopLabel: 'the bank',
      where: "It's behind the restaurant.", prep: 'behind', ref: 'restaurant', ko: '식당(Restaurant) 뒤' }
  ],
  // 미션 3 끝: Read and Talk 위치 말하기 (마을 지도 보고 고르기)
  whereQuiz: [
    { q: 'The airplane museum is ______ the restaurant and the flower shop.', a: 'between' },
    { q: 'The airplane museum is ______ the bank.', a: 'in front of' },
    { q: 'The art center is ______ the bookstore.', a: 'behind' }
  ],
  // 미션 4: 문장 블록
  sentences: [
    { en: 'How can I get to the library?', ko: '도서관에 어떻게 갈 수 있니?' },
    { en: 'Take Bus Number 5 and get off at the market.', ko: '5번 버스를 타고 시장에서 내려.' },
    { en: "It's in front of the bank.", ko: '그건 은행 앞에 있어.' },
    { en: "It's behind the museum.", ko: '그건 박물관 뒤에 있어.' }
  ],
  // 미션 5: How Can I Get There? (교과서 166~167쪽)
  reading: {
    hanok: [
      ['Old Man', 'Excuse me. How can I get to Seoul Hanok Stay?', '실례합니다. 서울 한옥 스테이에 어떻게 갈 수 있나요?'],
      ['Staff', "Take Bus Number 5 and get off at the park. It's behind the hospital.", '5번 버스를 타고 공원에서 내리세요. 그건 병원 뒤에 있어요.'],
      ['Old Man', 'Thank you.', '감사합니다.']
    ],
    food: [
      ['Leo', 'Where is a Korean restaurant?', '한국 식당이 어디에 있어요?'],
      ['Dad', "Let's see. There are many Korean restaurants.", '어디 보자. 한국 식당이 많이 있네.'],
      ['Yuna', "How about this one? It's between the bookstore and the toy shop.", '이곳은 어때요? 서점과 장난감 가게 사이에 있어요.'],
      ['Dad', "Okay. Let's go.", '좋아. 가자.']
    ],
    ticket: [
      ['Old Lady', "I can't find my ticket.", '제 표를 찾을 수가 없어요.'],
      ['Ben', 'There is a staff member at the help desk. She can help you.', '안내 데스크에 직원이 있어요. 그분이 도와드릴 수 있어요.'],
      ['Old Lady', 'Where is the help desk?', '안내 데스크는 어디에 있나요?'],
      ['Ben', "It's in front of the ice cream shop.", '그건 아이스크림 가게 앞에 있어요.']
    ]
  },
  // 미션 6: Let's Write 예시 글 (교과서 168쪽)
  writeSample: [
    'Come to Green Market.',
    'There are many fruits and vegetables.',
    'You can buy fruit salad and juice.',
    'Take Subway Line 4 and get off at the museum.',
    "It's in front of the park.",
    "It's open from Monday to Saturday."
  ],
  writeOpts: {
    place: ['Green Market', 'Happy Zoo', 'Sky Library', 'Blue Art Center', 'Sunny Park'],
    many: [['fruits and vegetables', '과일과 채소'], ['animals', '동물'], ['books', '책'], ['paintings', '그림'], ['flowers and trees', '꽃과 나무']],
    can: [['buy fruit salad and juice', '과일 샐러드와 주스를 사다'], ['see lions and pandas', '사자와 판다를 보다'], ['read many books', '책을 많이 읽다'], ['draw pictures', '그림을 그리다'], ['take pictures', '사진을 찍다']],
    lines: ['Bus Number 1', 'Bus Number 5', 'Bus Number 10', 'Subway Line 2', 'Subway Line 4', 'Subway Line 7'],
    stops: ['the museum', 'the park', 'the market', 'the school', 'the bank', 'the hospital', 'the library'],
    near: ['the park', 'the bank', 'the school', 'the museum', 'the hospital', 'the market', 'the restaurant', 'the bookstore'],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  // 보너스: Sounds and Letters nk (The pink tree is behind the bank.)
  th: ['pink', 'bank', 'think', 'drink', 'thank', 'ink']
};
