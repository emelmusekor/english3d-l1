/* 동아출판 초등 영어 6 · Lesson 3 "I Have a Runny Nose" 학습 자료
   교사가 문장·단어를 바꾸고 싶으면 이 파일만 고치면 됩니다. */
window.LESSON = {
  id: 'L3',
  title: 'Lesson 3 · I Have a Runny Nose',
  symptoms: [
    { id: 'cold',        ko: '감기',   emoji: '🤧', act: '콜록콜록, 몸이 으슬으슬' },
    { id: 'runny nose',  ko: '콧물',   emoji: '💧', act: '콧물이 주르륵' },
    { id: 'fever',       ko: '열',     emoji: '🤒', act: '이마가 뜨끈뜨끈' },
    { id: 'stomachache', ko: '복통',   emoji: '🤢', act: '배를 움켜쥐고 있어요' },
    { id: 'headache',    ko: '두통',   emoji: '🤕', act: '머리를 감싸고 있어요' },
    { id: 'toothache',   ko: '치통',   emoji: '🦷', act: '볼을 감싸고 있어요' }
  ],
  // 미션 2: Listen and Do (교과서 39쪽 대본)
  patients: [
    { id: 'p1', name: 'Jenny', girl: true,  symptom: 'headache',    shirt: 0xffd54f },
    { id: 'p2', name: 'Sam',   girl: false, symptom: 'runny nose',  shirt: 0x4caf50 },
    { id: 'p3', name: 'Emily', girl: true,  symptom: 'toothache',   shirt: 0xff8a80 },
    { id: 'p4', name: 'Jiho',  girl: false, symptom: 'fever',       shirt: 0x00897b },
    { id: 'p5', name: 'Mia',   girl: true,  symptom: 'stomachache', shirt: 0xba68c8 },
    { id: 'p6', name: 'Khan',  girl: false, symptom: 'cold',        shirt: 0xffb300 }
  ],
  // 미션 3: Play Together 2 · 증상 없애기 (Read and Sing 노랫말의 증상-조언 짝)
  advice: [
    { symptom: 'fever',       advice: 'Go see a doctor.',                           pic: '🏥', ko: '병원에 가 보렴.' },
    { symptom: 'cold',        advice: 'Get some rest.',                             pic: '🛏️', ko: '좀 쉬렴.' },
    { symptom: 'stomachache', advice: 'Take this with warm water and get some rest.', pic: '💊🥛', ko: '이것을 따뜻한 물과 함께 먹고 좀 쉬렴.' },
    { symptom: 'headache',    advice: 'Get some rest.',                             pic: '🛏️', ko: '좀 쉬렴.' }
  ],
  adviceChoices: ['Go see a doctor.', 'Get some rest.', 'Take this with warm water.', 'Go to bed early.', "Don't eat too many sweets."],
  // 미션 4: 문장 블록
  sentences: [
    { en: "What's wrong?", ko: '어디가 아프니?' },
    { en: 'I have a runny nose.', ko: '나는 콧물이 나.' },
    { en: 'Take this with warm water.', ko: '이것을 따뜻한 물과 함께 먹으렴.' },
    { en: 'Get some rest.', ko: '좀 쉬렴.' }
  ],
  // 미션 5: The Great Nurse (Reading)
  reading: {
    young: [
      ['Narrator', 'Florence liked playing with a doll.', 'Florence는 인형 놀이를 좋아했어요.'],
      ['Mother', 'What are you doing, Florence?', 'Florence, 뭐 하고 있니?'],
      ['Florence', "I'm taking care of my doll. She's sick.", '인형을 돌보고 있어요. 아프거든요.'],
      ['Florence', "What's wrong? Oh, you have a cold. Go to bed early.", '어디가 아프니? 아, 감기에 걸렸구나. 일찍 자렴.']
    ],
    nurse: [
      ['Narrator', 'Florence studied hard and became a nurse.', 'Florence는 열심히 공부해서 간호사가 되었어요.'],
      ['Narrator', 'Florence helped sick people in a war.', 'Florence는 전쟁에서 아픈 사람들을 도왔어요.'],
      ['Florence', "What's wrong?", '어디가 아프세요?'],
      ['Soldier', 'I have a headache. I have a fever, too.', '머리가 아파요. 열도 나요.'],
      ['Florence', 'Take this with warm water and get some rest.', '이것을 따뜻한 물과 함께 드시고 좀 쉬세요.'],
      ['Soldier', 'Thank you.', '고마워요.'],
      ['Narrator', 'Do you know her? She was a great nurse, Florence Nightingale.', '그녀를 아나요? 그녀는 위대한 간호사, 플로렌스 나이팅게일이었어요.']
    ]
  },
  // 미션 6: Let's Write (Judy와 Suho)
  writeSample: [
    ['Judy', 'Hi, Suho. Are you okay?', '안녕, 수호야. 괜찮니?'],
    ['Suho', "No, I'm not. I don't feel well.", '아니, 안 괜찮아. 몸이 안 좋아.'],
    ['Judy', "What's wrong?", '어디가 아프니?'],
    ['Suho', 'I have a cold. I have a runny nose, too.', '감기에 걸렸어. 콧물도 나.'],
    ['Judy', "That's too bad. Drink warm water and go to bed early. Don't go outside today.", '안됐구나. 따뜻한 물을 마시고 일찍 자. 오늘은 밖에 나가지 마.'],
    ['Suho', 'Okay. Thanks, Judy.', '알았어. 고마워, Judy.']
  ],
  writeAdvice: [
    ['Drink warm water', '따뜻한 물을 마셔'], ['go to bed early', '일찍 자'], ['get some rest', '좀 쉬어'],
    ['go see a doctor', '병원에 가 봐'], ['take this with warm water', '이것을 따뜻한 물과 함께 먹어'], ["don't eat too many sweets", '단것을 너무 많이 먹지 마']
  ],
  // 보너스: Sounds and Letters st
  th: ['stomachache', 'rest', 'student', 'story', 'stop', 'nest']
};
