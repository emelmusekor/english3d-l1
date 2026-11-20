/* 동아출판 초등 영어 6 · Lesson 5 "How About Turning Off the Water?" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L5',
  title: 'Lesson 5 · How About Turning Off the Water?',
  // 환경 보호 어구 6개 (Listen and Do · Read and Talk) — should: 짝이 되는 의무 표현
  actions: [
    { id: 'turning off the light',      ko: '불 끄기',            emoji: '💡', should: 'save energy' },
    { id: 'turning off the water',      ko: '물 잠그기',          emoji: '🚰', should: 'save water' },
    { id: 'using a cup',                ko: '컵 사용하기',        emoji: '🥤', should: 'save water' },
    { id: 'using the stairs',           ko: '계단 이용하기',      emoji: '🪜', should: 'save energy' },
    { id: 'recycling paper',            ko: '종이 재활용하기',    emoji: '📰', should: 'recycle things' },
    { id: 'recycling cans and bottles', ko: '캔과 병 재활용하기', emoji: '🥫', should: 'recycle things' }
  ],
  shoulds: [
    { id: 'save energy',    ko: '에너지를 절약하다', emoji: '⚡' },
    { id: 'save water',     ko: '물을 절약하다',     emoji: '💧' },
    { id: 'recycle things', ko: '물건을 재활용하다', emoji: '♻️' }
  ],
  // 미션 2: Listen and Do (교과서 69쪽 대본 순서)
  kids: [
    { id: 'k1', name: 'Mina', girl: true,  action: 'recycling cans and bottles', shirt: 0xffd54f },
    { id: 'k2', name: 'Tom',  girl: false, action: 'turning off the light',      shirt: 0x4caf50 },
    { id: 'k3', name: 'Sora', girl: true,  action: 'using a cup',                shirt: 0xff8a80 },
    { id: 'k4', name: 'Ben',  girl: false, action: 'recycling paper',            shirt: 0x00897b },
    { id: 'k5', name: 'Yuna', girl: true,  action: 'using the stairs',           shirt: 0xba68c8 },
    { id: 'k6', name: 'Leo',  girl: false, action: 'turning off the water',      shirt: 0xffb300 }
  ],
  // 미션 1: Fun Talk 1 (지도서 대본)
  funTalk1a: [
    ['Rani', 'That was a nice music show.', '멋진 음악 공연이었어.'],
    ['Hajun', 'Right. Look at the trash on the grass.', '맞아. 잔디 위의 쓰레기 좀 봐.'],
    ['Joel', "Oh, no. Let's walk around and pick up the trash.", '오, 이런. 돌아다니면서 쓰레기를 줍자.']
  ],
  // 미션 4: 문장 블록
  sentences: [
    { en: 'How about turning off the water?', ko: '물을 잠그는 게 어때?' },
    { en: 'How about using the stairs?', ko: '계단을 이용하는 게 어때?' },
    { en: 'We should save energy.', ko: '우리는 에너지를 절약해야 해.' },
    { en: 'We should recycle things.', ko: '우리는 물건들을 재활용해야 해.' }
  ],
  // 미션 5: Let's Save the Earth (교과서 76~77쪽)
  reading: {
    moby: [
      ['Dr. Shark', "What's wrong, Moby?", '어디가 아프니, 모비?'],
      ['Moby', 'I have a stomachache.', '배가 아파요.'],
      ['Dr. Shark', 'You ate many plastic bottles.', '플라스틱병을 많이 먹었구나.'],
      ['Narrator', "Let's help Moby. What can we do for Moby?", '모비를 도웁시다. 우리가 모비를 위해 무엇을 할 수 있을까요?'],
      ['Narrator', 'How about recycling cans and bottles? We should recycle things. We should go green.', '캔과 병을 재활용하는 게 어때요? 우리는 물건들을 재활용해야 해요. 우리는 환경을 생각해야 해요.']
    ],
    lumi: [
      ['Fox', "It's winter, but it's very warm.", '겨울인데, 매우 따뜻해.'],
      ['Lumi', "Right. Oh, where is my house? I can't find it.", '맞아. 오, 내 집이 어디 있지? 찾을 수가 없어.'],
      ['Fox', 'Watch out, Lumi!', '조심해, 루미!'],
      ['Narrator', "Let's help Lumi. What can we do for Lumi?", '루미를 도웁시다. 우리가 루미를 위해 무엇을 할 수 있을까요?'],
      ['Narrator', 'How about turning off the lights? We should save energy. We should save the earth.', '불을 끄는 게 어때요? 우리는 에너지를 절약해야 해요. 우리는 지구를 구해야 해요.']
    ]
  },
  // 미션 6: Let's Write 예시 포스터 (교과서 78쪽)
  posterSample: [
    'The earth is sick.',
    'We should save the earth.',
    'How about turning off the lights?',
    'How about using the stairs?',
    'We should save energy.',
    'Act now.',
    'Small actions can save the earth.'
  ],
  // 보너스: Sounds and Letters sh
  th: ['trash', 'should', 'fish', 'shark', 'shower', 'wash']
};
