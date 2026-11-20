/* 동아출판 초등 영어 6 · Lesson 6 "Do You Know Anything About Yakgwa?" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L6',
  title: 'Lesson 6 · Do You Know Anything About Yakgwa?',
  // 전통문화 낱말 (Read and Talk · Play Together 카드)
  cultures: [
    { id: 'yakgwa',  kind: 'cookie',   ko: '약과', kindKo: '과자', emoji: '🍪' },
    { id: 'the buk', kind: 'drum',     ko: '북',   kindKo: '북',   emoji: '🥁' },
    { id: 'Tuho',    kind: 'game',     ko: '투호', kindKo: '놀이', emoji: '🏹' },
    { id: 'Talchum', kind: 'dance',    ko: '탈춤', kindKo: '춤',   emoji: '🎭' },
    { id: 'hanok',   kind: 'house',    ko: '한옥', kindKo: '집',   emoji: '🏠' },
    { id: 'minhwa',  kind: 'painting', ko: '민화', kindKo: '그림', emoji: '🖼️' }
  ],
  // 미션 1: Fun Talk 1 (지도서 대본)
  funTalk1: {
    scene1: [
      ['Clerk', 'Would you like to try some yakgwa?', '약과 좀 먹어 볼래?'],
      ['Rani', "Sure. Oh, it's sweet and soft!", '좋아요. 와, 달고 부드러워요!']
    ],
    scene2: [
      ['Olivia', 'Look over there! What are they doing?', '저기 봐! 저 사람들 뭐 하는 거야?'],
      ['Hajun', "Oh, they're playing Jegichagi.", '아, 제기차기를 하고 있어.']
    ]
  },
  // 미션 2: Listen and Do (교과서 83쪽 대본) · a=묻는 사람, yes=알고 있는지
  pockets: [
    { id: 'p1', name: 'Amy',  girl: true,  culture: 'yakgwa',  yes: true,  shirt: 0xffd54f },
    { id: 'p2', name: 'Ben',  girl: false, culture: 'the buk', yes: false, shirt: 0x4caf50 },
    { id: 'p3', name: 'Sora', girl: true,  culture: 'Tuho',    yes: true,  shirt: 0xff8a80 },
    { id: 'p4', name: 'Tom',  girl: false, culture: 'Talchum', yes: false, shirt: 0x00897b },
    { id: 'p5', name: 'Lily', girl: true,  culture: 'hanok',   yes: true,  shirt: 0xba68c8 },
    { id: 'p6', name: 'Jun',  girl: false, culture: 'minhwa',  yes: false, shirt: 0xffb300 }
  ],
  // 미션 3: Fun Talk 2 (지도서 대본) — 세계 문화 체험관
  funTalk2: {
    hula: { name: 'hula', kind: 'Hawaiian dance', ko: '하와이의 전통 춤' },
    djembe: { name: 'the djembe', kind: 'African drum', ko: '아프리카의 전통 북' }
  },
  // 미션 4: 문장 블록
  sentences: [
    { en: 'Do you know anything about yakgwa?', ko: '약과에 관해 알고 있니?' },
    { en: 'Yes, I do.', ko: '응, 알고 있어.' },
    { en: "It's a traditional Korean cookie.", ko: '그것은 한국의 전통 과자야.' },
    { en: "You're good at playing Tuho.", ko: '너는 투호를 잘하는구나.' }
  ],
  // 미션 5: All About Kiwis (Reading)
  reading: {
    fruit: [
      ['Ella', 'Do you know anything about the kiwi fruit?', '키위 과일에 관해 알고 있나요?'],
      ['Ella', "It's from China.", '그것은 중국에서 왔어요.'],
      ['Ella', "It's brown outside and green inside.", '겉은 갈색이고 속은 초록색이에요.'],
      ['Ella', "It's sweet and sour.", '달고 새콤해요.'],
      ['Ella', 'The name, kiwi, came from the kiwi bird.', '키위라는 이름은 키위 새에서 왔어요.']
    ],
    bird: [
      ['Ranger', 'Do you know anything about the kiwi bird?', '키위 새에 관해 알고 있나요?'],
      ['Ranger', 'It lives only in New Zealand.', '그것은 뉴질랜드에만 살아요.'],
      ['Ranger', "It's brown.", '갈색이에요.'],
      ['Ranger', "It can't fly. But it can run fast.", '날지 못해요. 하지만 빨리 달릴 수 있어요.'],
      ['Ranger', "It's good at smelling.", '냄새를 잘 맡아요.'],
      ['Ranger', 'The name, kiwi, came from the bird\'s sound.', '키위라는 이름은 그 새의 소리에서 왔어요.'],
      ['Ranger', 'It makes a sound like, "kiwi."', '"키위" 하는 소리를 내요.']
    ]
  },
  // 미션 6: Let's Write (페루의 chullo 예시문)
  writeSample: [
    ['Diego', 'Look at this picture.', '이 그림을 보세요.'],
    ['Diego', "It's a chullo.", '이것은 추요(chullo)예요.'],
    ['Diego', 'Do you know anything about the chullo?', '추요에 관해 알고 있나요?'],
    ['Diego', "It's a hat from Peru.", '그것은 페루에서 온 모자예요.'],
    ['Diego', 'It has long ears.', '긴 귀가 있어요.'],
    ['Diego', 'People wear it in winter.', '사람들은 겨울에 그것을 써요.']
  ],
  // 글쓰기에서 고를 전통문화: it=It's 뒤, about=about 뒤, kind=종류, from=나라, desc=설명 보기
  writeCultures: [
    { it: 'buchaechum', about: 'buchaechum', kind: 'a dance', from: 'Korea', ko: '부채춤', desc: [['The dancers wear hanbok.', '춤추는 사람들은 한복을 입어요.'], ['They dance with fans.', '부채를 들고 춤춰요.'], ["It's very beautiful.", '정말 아름다워요.']] },
    { it: 'yakgwa', about: 'yakgwa', kind: 'a cookie', from: 'Korea', ko: '약과', desc: [["It's sweet and soft.", '달고 부드러워요.'], ['People eat it on special days.', '사람들은 특별한 날에 먹어요.'], ['It has a flower shape.', '꽃 모양이에요.']] },
    { it: 'Tuho', about: 'Tuho', kind: 'a game', from: 'Korea', ko: '투호', desc: [['You throw arrows into a pot.', '항아리에 화살을 던져 넣어요.'], ["It's very fun.", '정말 재미있어요.'], ['Many people can play it together.', '여러 사람이 함께 할 수 있어요.']] },
    { it: 'the buk', about: 'the buk', kind: 'a drum', from: 'Korea', ko: '북', desc: [['You hit it with a stick.', '채로 쳐요.'], ['It makes great sounds.', '멋진 소리가 나요.'], ['It is big and round.', '크고 둥글어요.']] },
    { it: 'hanok', about: 'hanok', kind: 'a house', from: 'Korea', ko: '한옥', desc: [['It has a beautiful roof.', '지붕이 아름다워요.'], ["It's warm in winter.", '겨울에 따뜻해요.'], ["It's cool in summer.", '여름에 시원해요.']] },
    { it: 'hula', about: 'hula', kind: 'a dance', from: 'Hawaii', ko: '훌라', desc: [['The dancers move their hands.', '춤추는 사람들은 손을 움직여요.'], ['They wear flowers.', '꽃을 달아요.'], ["It's very beautiful.", '정말 아름다워요.']] },
    { it: 'a djembe', about: 'the djembe', kind: 'a drum', from: 'Africa', ko: '젬베', desc: [['You hit it with your hands and fingers.', '손과 손가락으로 쳐요.'], ['It makes great sounds.', '멋진 소리가 나요.'], ["It's very fun.", '정말 재미있어요.']] },
    { it: 'a chullo', about: 'the chullo', kind: 'a hat', from: 'Peru', ko: '추요', desc: [['It has long ears.', '긴 귀가 있어요.'], ['People wear it in winter.', '사람들은 겨울에 써요.'], ["It's very warm.", '정말 따뜻해요.']] }
  ],
  // 보너스: Sounds and Letters ow (배열 이름은 엔진 호환 위해 th)
  th: ['know', 'show', 'snow', 'slow', 'yellow', 'window']
};
