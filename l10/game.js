/* English 3D School · Lesson 1 — 1인칭 3D 혼자 하는 영어 학교 탐험 */
(() => {
'use strict';
const L = window.LESSON;
const $ = (s) => document.querySelector(s);
const FONT = "'Jua', 'Malgun Gothic', sans-serif";
const errBox = $('#err');
window.addEventListener('error', (e) => { errBox.textContent = '오류: ' + e.message; errBox.style.display = 'block'; });
if (!window.THREE) { errBox.textContent = '3D 엔진을 불러오지 못했어요. 인터넷 연결을 확인하세요.'; errBox.style.display = 'block'; return; }

// ---------------- 저장 ----------------
const SAVE_KEY = 'english3d_l10_v1';
const fresh = () => ({ v: 1, stage: 0, stars: 0, correct: 0, tries: 0, streak: 0, best: 0, th: [], card: null, koHelp: true, rate: 0.9 });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) S = Object.assign(fresh(), s); } catch (e) {}
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
// 반 활동 기록 (백엔드가 설정되지 않으면 아무 일도 하지 않아요)
const track = (type, data) => { try { if (window.NET) window.NET.track(type, data); } catch (e) {} };
try { if (window.NET) window.NET.init({ lesson: L.id || 'L1' }); } catch (e) {}

// ---------------- 소리 ----------------
let AC = null;
function beep(type) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { ok: [[660, .08], [880, .12]], bad: [[220, .18]], get: [[784, .06], [1046, .1]], star: [[523, .07], [659, .07], [784, .07], [1046, .16]] }[type] || [[440, .1]];
    let t = AC.currentTime;
    for (const [f, d] of seq) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type === 'bad' ? 'square' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02); t += d;
    }
  } catch (e) {}
}
let voices = [];
const loadVoices = () => { try { voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); } catch (e) {} };
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
const VOICE = { // [여자?, pitch]
  Kai: [0, 1.1], Nara: [1, 1.35], Olivia: [1, 1.3], Boy: [0, 1.5], Teacher: [0, 0.9], 'Ms. Green': [1, 1.1], Host: [0, 0.85], Hajun: [0, 1.15], Rani: [1, 1.4],
  Mia: [1, 1.3], Jimin: [0, 1.1], Eric: [0, 1.2], Amy: [1, 1.4], Ted: [0, 1.15], Sue: [1, 1.3], Jo: [1, 1.25], Tom: [0, 1.2], Hana: [1, 1.3], Stacy: [1, 1.4],
  Alice: [1, 1.45], 'Mr. Rabbit': [0, 1.35], Narrator: [1, 1.0], Peter: [0, 1.1], '나': [0, 1.0]
};
function speak(text, who) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/’/g, "'"));
    u.lang = 'en-US'; u.rate = S.rate;
    const [girl, pitch] = VOICE[who] || [0, 1];
    u.pitch = pitch;
    const pref = girl ? /zira|samantha|female|aria|jenny|susan|google us english/i : /david|mark|guy|male|daniel|alex/i;
    const v = voices.find(v => /en-US/i.test(v.lang) && pref.test(v.name)) || voices.find(v => /en-US/i.test(v.lang)) || voices[0];
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) {}
}

// ---------------- 3D 기본 ----------------
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe6ff);
scene.fog = new THREE.Fog(0xbfe6ff, 45, 120);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 300);
camera.rotation.order = 'YXZ';
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
scene.add(new THREE.HemisphereLight(0xffffff, 0x88aa66, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(30, 50, 20); scene.add(sun);

const mats = {};
const mat = (c) => mats[c] || (mats[c] = new THREE.MeshLambertMaterial({ color: c }));
function box(w, h, d, c, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? mat(c) : c);
  m.position.set(x, y, z); parent.add(m); return m;
}
function cyl(rt, rb, h, c, x, y, z, parent = scene, seg = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)); m.position.set(x, y, z); parent.add(m); return m;
}
function ball(r, c, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(c)); m.position.set(x, y, z); parent.add(m); return m;
}
const colliders = [];
function solid(w, h, d, c, x, y, z) { const m = box(w, h, d, c, x, y, z); colliders.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2 }); return m; }
const block = (x1, z1, x2, z2) => colliders.push({ x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });

function labelCanvas(text, o = {}) {
  const fs = o.fs || 56, pad = o.pad || 22;
  const c = document.createElement('canvas'); const ctx = c.getContext('2d');
  ctx.font = `${fs}px ${FONT}`;
  const lines = String(text).split('\n');
  const w = Math.ceil(Math.max(...lines.map(l => ctx.measureText(l).width))) + pad * 2;
  const h = Math.ceil(fs * 1.25 * lines.length + pad * 1.2);
  c.width = Math.max(o.minW || 0, w); c.height = h;
  ctx.font = `${fs}px ${FONT}`;
  if (o.bg !== null) {
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.93)';
    const r = Math.min(26, h / 2); ctx.beginPath();
    ctx.moveTo(r, 0); ctx.arcTo(c.width, 0, c.width, h, r); ctx.arcTo(c.width, h, 0, h, r); ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, c.width, 0, r); ctx.fill();
    if (o.border) { ctx.lineWidth = 8; ctx.strokeStyle = o.border; ctx.stroke(); }
  }
  ctx.fillStyle = o.fg || '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, pad * 0.6 + fs * 1.25 * (i + 0.5)));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { t, w: c.width, h: c.height };
}
function textSprite(text, height = 0.42, o) {
  const { t, w, h } = labelCanvas(text, o);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
  s.scale.set(height * w / h, height, 1); return s;
}
function textPlane(text, height, o, parent = scene) {
  const { t, w, h } = labelCanvas(text, o);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(height * w / h, height), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  parent.add(m); return m;
}

// ---------------- 사람 ----------------
function makePerson(o) {
  const g = new THREE.Group();
  const skin = o.skin || 0xf5cfa8;
  box(0.17, 0.72, 0.2, o.pants || 0x2f3e66, -0.11, 0.36, 0, g);
  box(0.17, 0.72, 0.2, o.pants || 0x2f3e66, 0.11, 0.36, 0, g);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.78, 12), mat(o.shirt)); body.position.y = 1.08; g.add(body);
  if (o.girl) { const sk = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 12, 1, true), mat(o.skirt || o.shirt)); sk.position.y = 0.72; g.add(sk); }
  const armL = box(0.12, 0.62, 0.14, o.shirt, -0.36, 1.08, 0, g); armL.rotation.z = 0.12;
  const armR = box(0.12, 0.62, 0.14, o.shirt, 0.36, 1.08, 0, g); armR.rotation.z = -0.12;
  ball(0.07, skin, -0.4, 0.75, 0, g); ball(0.07, skin, 0.4, 0.75, 0, g);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), mat(skin)); head.position.y = 1.72; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(o.hair || 0x3b2a1a));
  hair.position.set(0, 1.74, -0.03); hair.rotation.x = -0.35; g.add(hair);
  if (o.girl) { box(0.52, 0.5, 0.14, o.hair || 0x3b2a1a, 0, 1.55, -0.2, g); }
  if (o.hat) { cyl(0.22, 0.24, 0.35, 0xffffff, 0, 2.1, 0, g); ball(0.27, 0xffffff, 0, 2.3, 0, g); }
  ball(0.04, 0x111111, -0.1, 1.76, 0.25, g); ball(0.04, 0x111111, 0.1, 1.76, 0.25, g);
  box(0.12, 0.03, 0.02, 0xc0504d, 0, 1.6, 0.27, g);
  ball(0.05, 0xffb0a0, -0.17, 1.64, 0.22, g); ball(0.05, 0xffb0a0, 0.17, 1.64, 0.22, g);
  const s = o.scale || 1; g.scale.setScalar(s);
  const tag = textSprite(o.name, 0.34 / s, { fs: 48, fg: '#1d3557' }); tag.position.y = 2.25 + (o.hat ? 0.4 : 0); g.add(tag);
  const mark = textSprite('!', 0.5 / s, { fs: 70, bg: '#ffd43b', fg: '#c92a2a', border: '#c92a2a', pad: 18 });
  mark.position.y = 2.75 + (o.hat ? 0.4 : 0); mark.visible = false; mark.userData.baseY = mark.position.y; g.add(mark);
  g.userData.mark = mark;
  return g;
}

// ---------------- 세계 만들기 (Lesson 10 · Compare Park) ----------------
const zones = [];
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8bc66a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xe9dcc0)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xe9dcc0)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0x1c7ed6, -4, 2, FEN); solid(1, 4, 1, 0x1c7ed6, 4, 2, FEN);
const gateSign = textPlane('Compare Park', 1.1, { fs: 64, bg: '#1c7ed6', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1, c = 0x4caf50) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const k = ball(1.5 * s, c, x, 3 * s, z); k.scale.y = 1.1;
  block(x - 0.4 * s, z - 0.4 * s, x + 0.4 * s, z + 0.4 * s);
}
for (let i = -40; i <= 40; i += 10) { tree(-43, i + 1, 1.1); tree(43, i - 2, 1); }
for (const x of [-38, -30, 30, 38]) tree(x, 43, 0.9);
for (const [x, z] of [[-8, 34], [9, 30], [-9, 8], [9, -14]]) tree(x, z, 1.1);
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-6, 20, Math.PI / 2); bench(6, 20, -Math.PI / 2);
const flat = (w, d, c, x, z, y = 0.02) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(c)); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; };
const sign = (text, h, bg, x, y, z, ry = 0, fg = '#fff') => { const s = textPlane(text, h, { fs: 60, bg, fg }); s.position.set(x, y, z); s.rotation.y = ry; return s; };

// ---------- 남서: 티볼 운동장 (Fun Talk 1) ----------
const FIELD = { x: -24, z: 24 };
flat(20, 16, 0xd9a066, FIELD.x, FIELD.z);
flat(19, 15, 0x69db7c, FIELD.x, FIELD.z, 0.025);
{ const d = flat(6, 6, 0xd9a066, FIELD.x + 4, FIELD.z + 2, 0.03); d.rotation.z = Math.PI / 4;
  for (const [dx, dz] of [[0, 4.2], [4.2, 0], [0, -4.2], [-4.2, 0]]) box(0.5, 0.06, 0.5, 0xffffff, FIELD.x + 4 + dx * 0.7, 0.06, FIELD.z + 2 + dz * 0.7);
  cyl(0.05, 0.05, 0.7, 0x222222, FIELD.x + 4, 0.35, FIELD.z + 4.9); ball(0.1, 0xffffff, FIELD.x + 4, 0.75, FIELD.z + 4.9); }
sign('Tee-ball Field ⚾', 0.8, '#e8590c', FIELD.x, 3.4, FIELD.z - 8.2);
cyl(0.06, 0.06, 3.4, 0x666666, FIELD.x - 2.5, 1.7, FIELD.z - 8.2); cyl(0.06, 0.06, 3.4, 0x666666, FIELD.x + 2.5, 1.7, FIELD.z - 8.2);
// 드론볼이 걸린 키 큰 나무
const TREE = { x: -12, z: 14 };
cyl(0.35, 0.5, 4, 0x7a5230, TREE.x, 2, TREE.z); block(TREE.x - 0.5, TREE.z - 0.5, TREE.x + 0.5, TREE.z + 0.5);
{ const c = ball(2.2, 0x2f9e44, TREE.x, 4.8, TREE.z); c.scale.y = 0.9; }
// 바구니 두 개 (Kai는 작은 것, 나라는 큰 것)
const BASKET_K = { x: -19.6, z: 24.6 }, BASKET_N = { x: -23.6, z: 26.4 };
function basket(x, z, s, full) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * s, 0.32 * s, 0.5 * s, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0x1c7ed6, side: THREE.DoubleSide })); b.position.y = 0.25 * s; g.add(b);
  cyl(0.32 * s, 0.32 * s, 0.03, 0x1864ab, 0, 0.02, 0, g);
  if (full) for (let i = 0; i < 9; i++) ball(0.09, 0xffffff, Math.cos(i * 2.1) * 0.22 * s, 0.5 * s + (i % 3) * 0.08, Math.sin(i * 2.1) * 0.22 * s, g);
  g.position.set(x, 0, z); scene.add(g); return g;
}
basket(BASKET_K.x, BASKET_K.z, 0.8, true); basket(BASKET_N.x, BASKET_N.z, 1.6, false);

// ---------- 서쪽: 비교 실험실 (Listen and Do) ----------
const LAB = { x: -27, z: -4 };
flat(20, 24, 0xdbe4ff, LAB.x, LAB.z);
solid(0.4, 4, 24, 0xbac8ff, -37, 2, LAB.z);
solid(20, 4, 0.4, 0xbac8ff, LAB.x, 2, LAB.z - 12); solid(9, 4, 0.4, 0xbac8ff, -32.5, 2, LAB.z + 12);
sign('Compare Lab 🔬', 1.0, '#4c6ef5', -16.9, 3.3, LAB.z + 7.5, Math.PI / 2);
solid(0.5, 4, 0.5, 0x4c6ef5, -17.2, 2, LAB.z - 11.8); solid(0.5, 4, 0.5, 0x4c6ef5, -17.2, 2, LAB.z + 11.8);
// 그림 1~6 (동쪽을 바라봄). 앞줄 1·2·3 (x=-23), 뒷줄 4·5·6 (x=-32)
const STATIONS = [[-23, -12], [-23, -4], [-23, 4], [-32, -12], [-32, -4], [-32, 4]];
const ST = STATIONS.map(([x, z], i) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; scene.add(g);
  box(5, 0.3, 3, 0xffffff, 0, 0.15, 0, g); block(x - 1.5, z - 2.5, x + 1.5, z + 2.5);
  const s = textPlane(String(i + 1), 0.8, { fs: 70, bg: '#ffd43b', fg: '#222' }, g); s.position.set(-2.1, 2.4, -1.2);
  return g;
});
// 1: 저울 (노란 상자 쪽으로 기울어 더 무거움)
(function (G) {
  const g = new THREE.Group(); box(3.2, 0.12, 0.5, 0x868e96, 0, 0, 0, g);
  box(0.6, 0.6, 0.6, 0x4dabf7, -1.2, 0.36, 0, g); box(0.95, 0.95, 0.95, 0xfcc419, 1.15, 0.53, 0, g);
  g.position.set(0, 1.2, 0); g.rotation.z = -0.2; G.add(g);
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 4), mat(0x495057)); t.position.set(0, 0.75, 0); G.add(t);
})(ST[0]);
// 2: 오렌지와 레몬
(function (G) { ball(0.6, 0xff922b, -0.8, 0.9, 0, G); const l = ball(0.28, 0xffe066, 0.9, 0.58, 0, G); l.scale.x = 1.4; })(ST[1]);
// 3: 호랑이와 강아지 그림판
(function (G) { const s = textPlane('🐯💪   🐶', 1.0, { fs: 90, bg: '#ffffff', border: '#868e96' }, G); s.position.set(0.2, 1.3, 0); })(ST[2]);
// 4: 자와 연필
(function (G) {
  box(2.6, 0.08, 0.35, 0xffe066, 0, 0.75, -0.3, G); for (let k = 0; k < 12; k++) box(0.03, 0.09, 0.12, 0x222222, -1.2 + k * 0.22, 0.76, -0.4, G);
  const p = cyl(0.06, 0.06, 1.0, 0xfab005, -0.6, 0.78, 0.4, G); p.rotation.z = Math.PI / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), mat(0xf5cfa8)); tip.rotation.z = -Math.PI / 2; tip.position.set(0, 0.78, 0.4); G.add(tip);
})(ST[3]);
// 5: Tina와 Lily (Lily가 더 큼)
(function (G) {
  const a = makePerson({ name: 'Tina', girl: true, shirt: 0xff8787, hair: 0x6d4c41, scale: 0.78 }); a.position.set(-0.8, 0.3, 0); G.add(a);
  const b = makePerson({ name: 'Lily', girl: true, shirt: 0x9775fa, hair: 0xd4a017, scale: 1.12 }); b.position.set(0.8, 0.3, 0); G.add(b);
})(ST[4]);
// 6: Sam과 Mike 달리기 (Mike가 먼저 결승선)
(function (G) {
  box(0.1, 1.4, 0.1, 0xe03131, -1.9, 1.0, -0.8, G); box(0.1, 1.4, 0.1, 0xe03131, -1.9, 1.0, 0.8, G); box(0.06, 0.15, 1.6, 0xffffff, -1.9, 1.6, 0, G);
  const m = makePerson({ name: 'Mike', shirt: 0x37b24d, hair: 0x111111, scale: 0.8 }); m.position.set(-1.4, 0.3, -0.4); m.rotation.y = -Math.PI / 2; G.add(m);
  const s = makePerson({ name: 'Sam', shirt: 0xf76707, hair: 0x6d4c41, scale: 0.8 }); s.position.set(1.3, 0.3, 0.4); s.rotation.y = -Math.PI / 2; G.add(s);
})(ST[5]);

// ---------- 동쪽: 퀴즈 쇼 (Fun Talk 2) ----------
const QUIZ = { x: 27, z: -4 };
box(14, 0.12, 16, 0x5f3dc4, QUIZ.x, 0.06, QUIZ.z);
solid(0.4, 6, 16, 0x7048e8, 34.2, 3, QUIZ.z);
sign('QUIZ SHOW ❓', 0.9, '#f08c00', 33.9, 5.3, QUIZ.z, -Math.PI / 2);
box(0.1, 2.2, 5.4, 0x212529, 33.9, 3.5, QUIZ.z);
for (let i = 0; i < 10; i++) ball(0.15, [0xffd43b, 0xff6b6b, 0x74c0fc][i % 3], 33.8, 0.8 + (i % 2) * 0.2, QUIZ.z - 7 + i * 1.55);
const DESK_H = { x: 25.6, z: -8.6 }, DESK_R = { x: 25.6, z: 0.6 };
for (const d of [DESK_H, DESK_R]) { solid(0.9, 0.9, 1.4, 0x74c0fc, d.x - 1.0, 0.45, d.z); cyl(0.22, 0.22, 0.12, 0xe03131, d.x - 1.0, 0.96, d.z); }
box(0.8, 1.0, 1.2, 0xf08c00, 31.3, 0.5, QUIZ.z - 1.2);
let quizScreen = null;
function setScreen(text) {
  if (quizScreen) scene.remove(quizScreen);
  quizScreen = textPlane(text, 1.5, { fs: 90, bg: '#ffffff', fg: '#222', border: '#f08c00' }); quizScreen.position.set(33.82, 3.5, QUIZ.z); quizScreen.rotation.y = -Math.PI / 2;
}
setScreen('❓ VS ❓');
// 선 비교 판 (Read and Talk) — 선 A와 B는 길이가 같아요
const LINE = { x: 31, z: 12 };
(function () {
  const c = document.createElement('canvas'); c.width = 512; c.height = 300; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 300); x.strokeStyle = '#222'; x.lineWidth = 8; x.font = 'bold 40px sans-serif'; x.fillStyle = '#222';
  const ln = (y, out) => { x.beginPath(); x.moveTo(140, y); x.lineTo(400, y); const d = out ? -36 : 36; x.moveTo(140, y); x.lineTo(140 - d, y - 30); x.moveTo(140, y); x.lineTo(140 - d, y + 30); x.moveTo(400, y); x.lineTo(400 + d, y - 30); x.moveTo(400, y); x.lineTo(400 + d, y + 30); x.stroke(); };
  x.fillText('A', 30, 95); ln(80, true); x.fillText('B', 30, 225); ln(210, false);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2), new THREE.MeshBasicMaterial({ map: t })); m.position.set(LINE.x + 0.06, 1.9, LINE.z); m.rotation.y = -Math.PI / 2; scene.add(m);
  solid(0.1, 2.4, 3.6, 0x868e96, LINE.x + 0.15, 1.6, LINE.z);
})();
sign('Which is longer?', 0.45, '#1971c2', LINE.x + 0.05, 3.25, LINE.z, -Math.PI / 2);
// 속삭이기 줄 (Play Together 2)
const WHISPER = { x: 26, z: 21 };
flat(16, 4, 0xfff3bf, WHISPER.x, WHISPER.z);
sign('Whisper Line 🤫', 0.6, '#e64980', WHISPER.x, 2.8, WHISPER.z - 2.3, 0);

// ---------- 남동: 글쓰기 코너 (Let's Write) ----------
const WRITE = { x: 26, z: 34 };
box(16, 0.12, 10, 0xfff0f6, WRITE.x, 0.06, WRITE.z);
for (const [dx, dz] of [[-7.5, -4.5], [7.5, -4.5], [-7.5, 4.5], [7.5, 4.5]]) solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz);
box(17, 0.4, 11, 0xffc9de, WRITE.x, 5.2, WRITE.z);
sign("Let's Write · Friends Corner", 0.8, '#d6336c', WRITE.x - 8.6, 4.4, WRITE.z, -Math.PI / 2);
solid(2.4, 0.9, 1.2, 0xdeb887, WRITE.x + 1, 0.85, WRITE.z + 2);
['✋', '🎒', '✏️'].forEach((e, i) => { const p = textPlane(e, 1.3, { fs: 110, bg: '#ffffff', border: '#d6336c' }); p.position.set(WRITE.x + 7.2, 2.4, WRITE.z - 3 + i * 3); p.rotation.y = -Math.PI / 2; });

// ---------- 북쪽: 꿈나라 (Alice in Dreamland) ----------
flat(56, 20, 0xb2f2bb, 0, -35);
sign('Dreamland 🐇', 1.0, '#ae3ec9', 0, 4.6, -25.8); cyl(0.15, 0.15, 5, 0xae3ec9, -2.6, 2.5, -25.8); cyl(0.15, 0.15, 5, 0xae3ec9, 2.6, 2.5, -25.8);
for (let i = 0; i < 26; i++) { const x = -26 + i * 2.1, z = -44 + (i % 3) * 0.5; cyl(0.02, 0.02, 0.4, 0x2b8a3e, x, 0.2, z, scene, 4); ball(0.14, [0xff6b6b, 0xffd43b, 0xf783ac, 0xb197fc][i % 4], x, 0.45, z); }
// Alice가 책을 읽는 나무
const READ_TREE = { x: -16, z: -29 };
tree(READ_TREE.x, READ_TREE.z, 1.3, 0x51cf66);
box(0.5, 0.06, 0.35, 0xc92a2a, READ_TREE.x + 1.3, 0.05, READ_TREE.z + 0.9);
// 문이 있는 큰 나무
const BIGTREE = { x: -4, z: -38 };
cyl(2.6, 3.2, 7, 0x8d5b3a, BIGTREE.x, 3.5, BIGTREE.z); block(BIGTREE.x - 2.8, BIGTREE.z - 2.8, BIGTREE.x + 2.8, BIGTREE.z + 2.8);
{ const c = ball(6, 0x37b24d, BIGTREE.x, 10, BIGTREE.z); c.scale.y = 0.7; }
box(0.7, 1.0, 0.1, 0xffd43b, BIGTREE.x, 0.5, BIGTREE.z + 2.95); ball(0.06, 0x222222, BIGTREE.x + 0.22, 0.5, BIGTREE.z + 3.02);
sign('little door 🚪', 0.35, '#5f3dc4', BIGTREE.x, 1.4, BIGTREE.z + 3.05);
// 작은 집과 쿠키 탁자
const HOUSE = { x: 14, z: -38 };
solid(4, 3, 4, 0xfff3bf, HOUSE.x, 1.5, HOUSE.z);
{ const r = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.8, 4), mat(0xe8590c)); r.rotation.y = Math.PI / 4; r.position.set(HOUSE.x, 3.9, HOUSE.z); scene.add(r); }
box(0.9, 1.6, 0.1, 0x8d5b3a, HOUSE.x, 0.8, HOUSE.z + 2.02); box(0.8, 0.7, 0.1, 0x74c0fc, HOUSE.x - 1.3, 1.8, HOUSE.z + 2.02); box(0.8, 0.7, 0.1, 0x74c0fc, HOUSE.x + 1.3, 1.8, HOUSE.z + 2.02);
const TABLE = { x: 10, z: -32.5 };
cyl(0.9, 0.9, 0.08, 0xffffff, TABLE.x, 0.8, TABLE.z, scene, 20); cyl(0.08, 0.08, 0.8, 0x777777, TABLE.x, 0.4, TABLE.z); block(TABLE.x - 0.8, TABLE.z - 0.8, TABLE.x + 0.8, TABLE.z + 0.8);
const cookieA = cyl(0.32, 0.32, 0.08, 0xd9480f, TABLE.x - 0.35, 0.88, TABLE.z), cookieL = cyl(0.17, 0.17, 0.08, 0xfcc419, TABLE.x + 0.45, 0.88, TABLE.z);
{ const s = textSprite('🍎 apple cookie', 0.25, { fs: 44 }); s.position.set(TABLE.x - 0.35, 1.25, TABLE.z); scene.add(s);
  const t = textSprite('🍋 lemon cookie', 0.25, { fs: 44 }); t.position.set(TABLE.x + 0.5, 1.15, TABLE.z + 0.3); scene.add(t); }

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'drone') {
    ball(0.25, 0x74c0fc, 0, 0.25, 0, g); box(0.9, 0.05, 0.08, 0x343a40, 0, 0.32, 0, g); box(0.08, 0.05, 0.9, 0x343a40, 0, 0.32, 0, g);
    for (const [x, z] of [[0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]]) cyl(0.16, 0.16, 0.02, 0xffffff, x, 0.36, z, g);
  } else if (id === 'ball') { ball(0.2, 0xffffff, 0, 0.2, 0, g); const s = box(0.3, 0.02, 0.02, 0xe03131, 0, 0.3, 0.12, g); s.rotation.y = 0.4; }
  return g;
}
let decor = [];
function addDecor(o) { scene.add(o); decor.push(o); return o; }
function clearDecor() { decor.forEach(o => scene.remove(o)); decor = []; }

// ---------- 들고 있는 물건 ----------
scene.add(camera);
let heldMesh = null, heldMeshId = null, fallers = [];
function heldSync() {
  const f = held && held.kind === 'thing' ? held.id : null;
  if (f === heldMeshId) return;
  if (heldMesh) { camera.remove(heldMesh); heldMesh = null; }
  heldMeshId = f;
  if (f) { heldMesh = itemModel(f); heldMesh.scale.setScalar(0.8); heldMesh.position.set(0.34, -0.45, -0.85); camera.add(heldMesh); }
}
function setHeld(id, label) { held = { kind: 'thing', id, label }; refreshHUD(); }
// 크기가 바뀌는 효과 (Alice)
const growers = [];
function growTo(g, s, sec = 1.2) { growers.push({ g, from: g.scale.x, to: s, t: 0, sec }); }
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  for (const f of fallers) { f.userData.life -= dt; f.position.y += dt * 0.8; f.material.opacity = Math.max(0, f.userData.life); }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { scene.remove(f); return false; } return true; });
  for (const w of growers) { w.t = Math.min(1, w.t + dt / w.sec); w.g.scale.setScalar(w.from + (w.to - w.from) * w.t); }
  for (let i = growers.length - 1; i >= 0; i--) if (growers[i].t >= 1) growers.splice(i, 1);
  if (droneMesh) droneMesh.rotation.y += dt * 3;
}
let droneMesh = null;
function puff(x, y, z, text = '✨') {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#ae3ec9', border: '#ae3ec9' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 1.6; scene.add(s); fallers.push(s);
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#e9dcc0'); R(0, -2, 52, 6, '#e9dcc0');
  R(FIELD.x, FIELD.z, 20, 16, '#e8590c', '티볼 운동장'); R(LAB.x, LAB.z, 20, 24, '#4c6ef5', '비교 실험실');
  R(QUIZ.x, QUIZ.z, 14, 16, '#5f3dc4', '퀴즈 쇼'); R(LINE.x - 2, LINE.z, 6, 4, '#1971c2', '선 비교');
  R(WHISPER.x, WHISPER.z, 16, 4, '#e64980', '속삭이기'); R(WRITE.x, WRITE.z, 16, 10, '#d6336c', '글쓰기');
  R(0, -37, 56, 14, '#ae3ec9', '꿈나라');
}

// ---------------- 플레이어 ----------------
const P = { x: 0, z: 40, yaw: 0, pitch: 0, r: 0.4 };
const keys = {};
let locked = false, started = false, dlgOpen = false, busy = false, held = null;
const touch = { mx: 0, mz: 0 };
function collide() {
  for (const c of colliders) {
    const nx = Math.max(c.x1, Math.min(P.x, c.x2)), nz = Math.max(c.z1, Math.min(P.z, c.z2));
    const dx = P.x - nx, dz = P.z - nz, d2 = dx * dx + dz * dz;
    if (d2 < P.r * P.r) {
      if (d2 > 1e-6) { const d = Math.sqrt(d2), k = (P.r - d) / d; P.x += dx * k; P.z += dz * k; }
      else { // 안에 들어감: 가장 가까운 면으로
        const opts = [[c.x1 - P.r - P.x, 0], [c.x2 + P.r - P.x, 0], [0, c.z1 - P.r - P.z], [0, c.z2 + P.r - P.z]];
        opts.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1])); P.x += opts[0][0]; P.z += opts[0][1];
      }
    }
  }
  for (const n of Object.values(NPC)) {
    if (!n.g.visible) continue;
    const dx = P.x - n.g.position.x, dz = P.z - n.g.position.z, d = Math.hypot(dx, dz), m = 0.75;
    if (d < m && d > 1e-4) { P.x += dx / d * (m - d); P.z += dz / d * (m - d); }
  }
}

// ---------------- NPC ----------------
const NPC = {};
function addNPC(id, o, x, z, face = 0) {
  const g = makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '' };
  return NPC[id];
}
const E = Math.PI / 2, Wd = -Math.PI / 2;
// 집 위치 [x, z, 방향]
const HOME = {
  kai: [-20, 23, E], nara: [-23, 25.2, E], olivia: [-21.5, 19.5, E], boy: [-14.5, 17.6, Math.PI / 4], teacher: [-28, 18, E],
  green: [-15, -4, E],
  host: [32.3, -4, Wd], hajun: [25.8, -8.6, Wd], rani: [25.8, 0.6, Wd],
  mia: [29.4, 10.4, Wd], jimin: [29.4, 13.6, Wd],
  w1: [20, 21, Wd], w2: [22.4, 21, Wd], w3: [24.8, 21, Wd], w4: [27.2, 21, Wd], w5: [29.6, 21, Wd], tom: [32, 21, E],
  hana: [23.5, 33.2, Wd], stacy: [23.5, 35.8, Wd],
  alice: [READ_TREE.x + 1.4, READ_TREE.z + 1.6, Math.PI / 4], rabbit: [READ_TREE.x + 4, READ_TREE.z + 1.5, -Math.PI / 4],
  bonus: [-6, -18, 0]
};

addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ["I'm taller than Ted.", '나는 Ted보다 키가 더 커.'] }, ...HOME.kai);
addNPC('nara', { name: 'Nara', girl: true, shirt: 0xf06595, hair: 0x111111, idle: ['My basket is bigger than yours.', '내 바구니가 네 것보다 더 커.'] }, ...HOME.nara);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, scale: 1.15, idle: ["I'm taller than you.", '나는 너보다 키가 더 커.'] }, ...HOME.olivia);
addNPC('boy', { name: 'Boy', shirt: 0xfab005, hair: 0x3b2a1a, scale: 0.75, idle: ['Thank you!', '고마워요!'] }, ...HOME.boy);
addNPC('teacher', { name: 'Teacher', shirt: 0x2f9e44, pants: 0x343a40, hair: 0x222222, scale: 1.15, idle: ['Everyone, good job today.', '모두 오늘 잘했어요.'] }, ...HOME.teacher);
addNPC('green', { name: 'Ms. Green', girl: true, shirt: 0xffffff, skirt: 0x4c6ef5, hair: 0x8d5524, scale: 1.12, idle: ['The orange is bigger than the lemon.', '오렌지가 레몬보다 더 커요.'] }, ...HOME.green);
addNPC('host', { name: 'Host', shirt: 0xf08c00, pants: 0x212529, hair: 0x343a40, scale: 1.15, idle: ['Welcome to the quiz show!', '퀴즈 쇼에 온 것을 환영해요!'] }, ...HOME.host);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ['Asia is bigger than Africa.', '아시아가 아프리카보다 더 커.'] }, ...HOME.hajun);
addNPC('rani', { name: 'Rani', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ['The rabbit is faster than the horse.', '토끼가 말보다 더 빨라.'] }, ...HOME.rani);
addNPC('mia', { name: 'Mia', girl: true, shirt: 0x15aabf, hair: 0x6d4c41, idle: ['Are you sure?', '확실하니?'] }, ...HOME.mia);
addNPC('jimin', { name: 'Jimin', shirt: 0x7950f2, hair: 0x111111, idle: ['Yes, I am.', '응, 확실해.'] }, ...HOME.jimin);
[['w1', 'Eric', 0, 0xff8787], ['w2', 'Amy', 1, 0x74c0fc], ['w3', 'Ted', 0, 0x8ce99a], ['w4', 'Sue', 1, 0xffd43b], ['w5', 'Jo', 1, 0xb197fc]].forEach(([id, name, girl, shirt]) =>
  addNPC(id, { name, girl: !!girl, shirt, hair: girl ? 0x8d5524 : 0x222222, scale: 0.92, idle: ['Shh! 🤫', '쉿! 속삭이기 놀이 중이에요.'] }, ...HOME[id]));
addNPC('tom', { name: 'Tom', shirt: 0xe8590c, hair: 0x3b2a1a, scale: 0.92, idle: ['Eric is stronger than Tom? No way!', 'Eric이 나보다 힘이 세다고? 말도 안 돼!'] }, ...HOME.tom);
addNPC('hana', { name: 'Hana', girl: true, shirt: 0xd6336c, hair: 0x111111, idle: ["My hand is bigger than Stacy's.", '내 손은 Stacy의 손보다 더 커요.'] }, ...HOME.hana);
addNPC('stacy', { name: 'Stacy', girl: true, shirt: 0x20c997, hair: 0xd4a017, idle: ["My hair is longer than Hana's.", '내 머리카락이 하나보다 더 길어요.'] }, ...HOME.stacy);
box(0.5, 0.75, 0.1, 0xd4a017, 0, 1.15, -0.26, NPC.stacy.g); // Stacy의 긴 머리
addNPC('alice', { name: 'Alice', girl: true, shirt: 0x74c0fc, skirt: 0x4dabf7, hair: 0xfcc419, idle: ["I'm slower than you.", '나는 너보다 느려.'] }, ...HOME.alice);
box(0.5, 0.06, 0.12, 0x222222, 0, 2.06, 0.02, NPC.alice.g); // 머리띠
addNPC('rabbit', { name: 'Mr. Rabbit', shirt: 0xc92a2a, pants: 0xf8f9fa, hair: 0xf8f9fa, skin: 0xf1f3f5, idle: ["I'm going to Dreamland. Let's go together.", '나는 꿈나라에 가. 같이 가자.'] }, ...HOME.rabbit);
for (const x of [-0.13, 0.13]) { const e = box(0.1, 0.55, 0.07, 0xf8f9fa, x, 2.18, -0.02, NPC.rabbit.g); e.rotation.z = x * 1.2; box(0.05, 0.4, 0.02, 0xffc9de, x, 2.18, 0.02, NPC.rabbit.g).rotation.z = x * 1.2; }
NPC.rabbit.g.userData.mark.userData.baseY = 3.05;
addNPC('bonus', { name: 'Peter', shirt: 0xf59f00, hair: 0xa0522d, idle: ['The bear is bigger than the tiger.', '곰이 호랑이보다 더 커.'] }, ...HOME.bonus);
function placeNPC(id, x, z, face) { const n = NPC[id]; n.g.position.set(x, 0, z); if (face !== undefined) n.g.rotation.y = face; n.home = [x, z, n.g.rotation.y]; n.follow = false; }
NPC.rabbit.g.children.forEach(c => { if (c.isSprite && c !== NPC.rabbit.g.userData.mark) c.position.y = 2.65; });

// ---------------- 물건 (카드·블록·코인) ----------------
let items = []; // {mesh, x, z, r, onTouch, spin, bob}
function addItem(mesh, x, z, onTouch, o = {}) { mesh.position.set(x, o.y || 1.2, z); scene.add(mesh); const it = { mesh, x, z, r: o.r || 1.3, onTouch, y: o.y || 1.2, spin: o.spin ?? 1.2, alive: true }; items.push(it); return it; }
function removeItem(it) { it.alive = false; scene.remove(it.mesh); }
function clearItems() { items.forEach(i => scene.remove(i.mesh)); items = []; }
function wordCube(word, color = '#ffffff', fg = '#1d3557') {
  const { t } = labelCanvas(word, { fs: 64, bg: color, fg, minW: 260, pad: 30 });
  const m = new THREE.MeshBasicMaterial({ map: t });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.8), [m, m, mat(0xffd166), mat(0xffd166), m, m]);
  return mesh;
}

// ---------------- UI ----------------
const ui = {
  stars: $('#stars'), stage: $('#stageName'), obj: $('#objText'), arrow: $('#arrow'), dist: $('#dist'), prompt: $('#prompt'),
  dlg: $('#dlg'), who: $('#dlgWho'), en: $('#dlgEn'), ko: $('#dlgKo'), ch: $('#dlgChoices'), next: $('#dlgNext'), spk: $('#dlgSpeak'), peek: $('#dlgPeek'),
  toast: $('#toast'), held: $('#held'), sent: $('#sentBar'), th: $('#thCount')
};
function toast(msg, ms = 2200) { ui.toast.innerHTML = msg; ui.toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => ui.toast.classList.remove('show'), ms); }
function refreshHUD() {
  ui.stars.textContent = S.stars;
  ui.stage.textContent = STAGES[Math.min(S.stage, STAGES.length - 1)].title;
  ui.th.textContent = S.th.length + '/' + L.th.length;
  ui.held.style.display = held ? 'block' : 'none';
  if (held) ui.held.innerHTML = '들고 있는 것: <b>' + held.label + '</b>';
  $('#koToggle').classList.toggle('on', S.koHelp);
}
function addStar(n = 1) { S.stars += n; save(); refreshHUD(); ui.stars.parentElement.classList.remove('pop'); void ui.stars.offsetWidth; ui.stars.parentElement.classList.add('pop'); }

let objective = { text: '', pos: null };
function setObj(text, pos) { objective = { text, pos }; ui.obj.innerHTML = text; }
const npcPos = (id) => () => [NPC[id].g.position.x, NPC[id].g.position.z];

// ----- 대화 상자 -----
let dlgNextFn = null, dlgChoiceKeys = null, lastSpeech = null;
function openDlg() { dlgOpen = true; ui.dlg.classList.add('show'); if (document.pointerLockElement) document.exitPointerLock(); for (const k in keys) keys[k] = false; }
function closeDlg() { dlgOpen = false; ui.dlg.classList.remove('show'); dlgNextFn = null; dlgChoiceKeys = null; }
function setLine(who, en, ko, o = {}) {
  ui.who.textContent = who || '';
  ui.who.style.display = who ? 'inline-block' : 'none';
  ui.en.textContent = en || '';
  ui.en.classList.toggle('hidden', !!o.listen);
  ui.peek.style.display = o.listen ? 'inline-block' : 'none';
  ui.ko.textContent = ko || '';
  ui.ko.style.display = ko && (S.koHelp || o.koAlways || !en) ? 'block' : 'none';
  ui.ch.innerHTML = '';
  lastSpeech = en ? [en, who] : null;
  ui.spk.style.display = en ? 'inline-block' : 'none';
  if (en && o.speak !== false) speak(en, who);
}
function say(who, en, ko, o = {}) {
  return new Promise(res => {
    openDlg(); setLine(who, en, ko, o);
    ui.next.style.display = 'inline-block'; ui.next.textContent = o.btn || '다음 ▶';
    dlgNextFn = () => { dlgNextFn = null; res(); };
  });
}
async function lines(who, arr, o = {}) { for (const [en, ko] of arr) await say(who, en, ko, o); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
// 선택형 질문: choices[0]이 정답
function ask(who, en, ko, choices, o = {}) {
  return new Promise(res => {
    openDlg(); setLine(who, en, ko, Object.assign({ speak: !!o.speakQ, koAlways: true }, o));
    ui.next.style.display = 'none';
    let first = true;
    const right = o.right !== undefined ? o.right : choices[0];
    const order = o.noShuffle ? choices : shuffle(choices);
    const btns = order.map((c, i) => {
      const b = document.createElement('button'); b.className = 'choice'; if (c === right) b.dataset.r = 1; b.innerHTML = `<span class="num">${i + 1}</span>${c}`;
      b.onclick = () => {
        if (b.disabled) return;
        if (c === right) {
          b.classList.add('right'); btns.forEach(x => x.disabled = true); beep('ok');
          S.tries++; if (first) { S.correct++; S.streak++; S.best = Math.max(S.best, S.streak); addStar(); } save();
          track('answer', { stage: S.stage, q: String(en || ko || '').slice(0, 80), ok: first, first: true });
          if (o.sayIt !== false && /[a-z]/i.test(c)) speak(c.replace(/<[^>]+>/g, ''), o.me ? '나' : who);
          if (o.after) { ui.ko.style.display = 'block'; ui.ko.textContent = o.after; }
          setTimeout(() => { dlgChoiceKeys = null; res(first); }, o.wait || 1100);
        } else {
          b.classList.add('wrong'); b.disabled = true; beep('bad');
          if (first) { S.tries++; S.streak = 0; save(); } first = false;
          if (o.hint) { ui.ko.style.display = 'block'; ui.ko.textContent = '💡 ' + o.hint; }
        }
      };
      ui.ch.appendChild(b); return b;
    });
    dlgChoiceKeys = btns;
  });
}
// 순서 맞추기
function orderTask(who, en, ko, seq, labels) {
  return new Promise(res => {
    openDlg(); setLine(who, en, ko, { speak: false, koAlways: true });
    ui.next.style.display = 'none';
    const ans = document.createElement('div'); ans.className = 'orderAns'; ui.ch.appendChild(ans);
    const pool = document.createElement('div'); pool.className = 'orderPool'; ui.ch.appendChild(pool);
    let idx = 0, mistakes = 0;
    shuffle(seq).forEach(w => {
      const b = document.createElement('button'); b.className = 'choice small'; b.textContent = w; b.dataset.i = seq.indexOf(w);
      b.onclick = () => {
        if (w === seq[idx]) { beep('get'); speak(labels ? labels(w) : w, '나'); b.remove(); const s = document.createElement('span'); s.className = 'chip'; s.textContent = w; ans.appendChild(s); idx++;
          if (idx === seq.length) { S.tries++; if (!mistakes) { S.correct++; addStar(2); } save(); track('answer', { stage: S.stage, q: String(en).slice(0, 80), ok: !mistakes, first: true }); beep('star'); setTimeout(res, 900); }
        } else { mistakes++; beep('bad'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); }
      };
      pool.appendChild(b);
    });
  });
}
ui.next.onclick = () => dlgNextFn && dlgNextFn();
ui.spk.onclick = () => lastSpeech && speak(...lastSpeech);
ui.peek.onclick = () => { ui.en.classList.remove('hidden'); ui.peek.style.display = 'none'; };

// ---------------- 단계 (미션) ----------------
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 티볼 운동장', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 비교 실험실', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. 퀴즈 쇼', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 꿈나라의 Alice', book: 'Before/After You Read', start: stage5 },
  { title: '6. 친구와 나 비교하기', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {}; droneMesh = null; growers.length = 0;
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  NPC.alice.g.scale.setScalar(1); cookieA.visible = true;
  setScreen('❓ VS ❓');
  spawnThCoins();
  refreshHUD();
}
function startStage(i) { S.stage = i; save(); resetWorld(); STAGES[i].start(); refreshHUD(); }
function nextStage() { closeDlg(); beep('star'); track('stage_done', { stage: S.stage, stars: S.stars }); const i = S.stage + 1; showBanner(STAGES[S.stage].title + ' 완료!', i < STAGES.length - 1 ? '다음: ' + STAGES[i].title : '모든 미션 완료!'); startStage(i); }
function showBanner(a, b) { const el = $('#banner'); el.innerHTML = `<b>${a}</b><span>${b}</span>`; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
function mark(id, on = true) { NPC[id].g.userData.mark.visible = on; }
function good(n = 1) { S.tries++; S.correct++; addStar(n); beep('star'); save(); }
const npcAt = (id) => () => [NPC[id].g.position.x, NPC[id].g.position.z];
const dist = (p) => Math.hypot(p[0] - P.x, p[1] - P.z);
function nearestItem() { let best = null, bd = 1e9; for (const it of items) { if (!it.alive || it.bonus) continue; const d = dist([it.x, it.z]); if (d < bd) { bd = d; best = [it.x, it.z]; } } return best; }
async function readLines(arr) { for (const [who, en, ko] of arr) await say(who, en, ko); }
function flash() { const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:50;opacity:1;transition:opacity .6s;pointer-events:none'; document.body.appendChild(f); setTimeout(() => f.style.opacity = 0, 60); setTimeout(() => f.remove(), 700); }
const OX = ['⭕ 일치해요', '❌ 일치하지 않아요'];

// ---- 1. Fun Talk 1 ----
function stage1() {
  droneMesh = itemModel('drone'); droneMesh.scale.setScalar(1.5); droneMesh.position.set(TREE.x + 0.4, 4.0, TREE.z + 1.9); addDecor(droneMesh);
  setObj('⚾ 남서쪽 <b>티볼 운동장</b>의 <b>Kai</b>에게 가요', npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await readLines(L.funTalk1.s1);
    await say('', '', '🌳 Kai가 방망이를 뻗어 봤지만 나무에 걸린 드론볼에 닿지 않아요.', {});
    await ask('나', 'Olivia가 되어 Kai에게 말해요. 🙋‍♀️', 'Olivia는 Kai보다 키가 커요. 알맞은 말을 고르세요.', ["I'm taller than you. I can do it.", 'Which is heavier?', 'Congratulations!', "It's a home run!"], { me: true, hint: 'taller = 키가 더 큰' });
    closeDlg();
    placeNPC('olivia', TREE.x + 0.6, TREE.z + 2.6, Math.PI);
    if (droneMesh) { scene.remove(droneMesh); droneMesh = null; }
    toast('🚁 Olivia가 손을 뻗어 드론볼을 꺼냈어요!', 2600);
    setObj('🚁 나무 아래 <b>드론볼</b>을 주워요', nearestItem);
    const g = itemModel('drone'); g.scale.setScalar(1.4);
    addItem(g, TREE.x - 1.2, TREE.z + 4.2, (it) => {
      removeItem(it); setHeld('drone', '🚁 drone ball'); beep('get');
      setObj('🚁 드론볼을 <b>남학생(Boy)</b>에게 줘요', npcAt('boy')); mark('boy');
      NPC.boy.talk = async () => {
        mark('boy', false); NPC.boy.talk = null; held = null; refreshHUD(); good();
        await say('Olivia', 'Here you are.', '여기 있어.');
        await say('Boy', 'Thank you.', '고마워요.');
        await ask('', 'Who is taller, Olivia or Kai?', 'Olivia와 Kai 중 키가 더 큰 사람은?', ['Olivia is taller than Kai.', 'Kai is taller than Olivia.']);
        placeNPC('olivia', ...HOME.olivia);
        await say('Teacher', 'Everyone, good job today. Please pick up the balls.', '모두 오늘 잘했어요. 공을 주워 주세요.');
        closeDlg(); s1balls();
      };
    }, { y: 0.4, r: 1.4, spin: 1 });
  };
}
function s1balls() {
  const spots = [[-31, 19], [-30, 29], [-17, 29]];
  stageState.balls = 0;
  const upd = () => setObj(`⚾ 운동장에 떨어진 <b>공</b>을 주워요 (${stageState.balls}/3)`, nearestItem);
  spots.forEach(([x, z]) => addItem(itemModel('ball'), x, z, (it) => {
    removeItem(it); stageState.balls++; beep('get'); upd();
    if (stageState.balls === 3) {
      setHeld('ball', '⚾ balls ×3');
      setObj('🧺 공을 들고 <b>Kai</b>에게 가요', npcAt('kai')); mark('kai');
      NPC.kai.talk = async () => {
        mark('kai', false); NPC.kai.talk = null; held = null; refreshHUD(); good();
        await say('Kai', 'Oh, my basket is full.', '아, 내 바구니가 가득 찼어.');
        await ask('나', '나라가 되어 Kai에게 말해요. 🧺', '나라의 바구니는 Kai의 바구니보다 커요.', ["My basket is bigger than yours. Let's put the balls here.", "I'm taller than you. I can do it.", 'Are you sure?', "You're next."], { me: true, hint: 'bigger = 더 큰' });
        await say('Kai', 'Thank you.', '고마워.');
        await say('Nara', "Oh, it's heavy.", '아, 무겁다.');
        await say('Olivia', 'Nara, I can help you.', '나라야, 내가 도와줄게.');
        await ask('', "Whose basket is bigger?", '누구의 바구니가 더 큰가요?', ["Nara's basket", "Kai's basket"]);
        await say('', '', '⚾ Fun Talk 1 완료! Olivia는 Kai보다 키가 크고(taller), 나라의 바구니는 Kai의 것보다 커요(bigger).', { btn: '다음 미션 ▶' });
        nextStage();
      };
    }
  }, { y: 0.5, r: 1.3, spin: 1 }));
  upd();
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  setObj('🔬 서쪽 <b>Compare Lab</b>의 <b>Ms. Green</b>에게 가요', npcAt('green')); mark('green');
  NPC.green.talk = async () => {
    mark('green', false); NPC.green.talk = null;
    await say('Ms. Green', 'Welcome to the Compare Lab! Listen and look at the pictures.', '비교 실험실에 온 걸 환영해요! 잘 듣고 그림을 봐요.');
    await say('', '', '실험실 안 그림 1~6번 앞의 🔊 블록에 가까이 가면 문장이 들려요. 그림과 일치하면 ⭕, 일치하지 않으면 ❌를 골라요.', { btn: '시작!' });
    closeDlg(); stageState.done = 0;
    L.listen.forEach((l, i) => {
      const [x, z] = STATIONS[i];
      const it = addItem(wordCube('🔊 ' + (i + 1), '#ffd43b'), x + 2.6, z, async (it) => {
        if (busy) return;
        busy = true; removeItem(it);
        try {
          await say('Ms. Green', l.en, `${i + 1}번 그림을 보며 잘 들어요. (🔊 다시 듣기)`, { listen: true, koAlways: true });
          await ask('', `${i + 1}번: 들은 문장이 그림과 일치하나요?`, '그림을 보고 고르세요.', OX, { right: l.ok ? OX[0] : OX[1], noShuffle: true, sayIt: false, after: l.en + ' → ' + l.ko, wait: 1600 });
        } finally { closeDlg(); busy = false; }
        stageState.done++;
        if (stageState.done < L.listen.length) setObj(`🔊 그림 앞 블록에서 듣고 ⭕❌ 골라요 (${stageState.done}/6)`, nearestItem);
        else s2pt1();
      }, { y: 1.0, r: 1.2, spin: 0.8 });
      it.station = i;
    });
    setObj('🔊 그림 앞 블록에서 듣고 ⭕❌ 골라요 (0/6)', nearestItem);
  };
}
function s2pt1() {
  setObj('👩‍🔬 <b>Ms. Green</b>에게 돌아가요', npcAt('green')); mark('green');
  NPC.green.talk = async () => {
    mark('green', false); NPC.green.talk = null;
    await say('Ms. Green', "Great job! Let's play a game. Listen and stand up in order!", '잘했어요! 놀이를 해요. 잘 듣고 순서대로 일어나요!');
    for (let r = 0; r < 2; r++) {
      const set = shuffle(L.cards).slice(0, 3);
      await say('', '', `Play Together 1 · 비교하며 일어나기 (${r + 1}/2): 선생님이 말하는 세 문장의 순서를 기억하세요.`, { btn: '듣기 ▶' });
      for (let k = 0; k < 3; k++) await say('Ms. Green', set[k].en, `${k + 1}번째 문장 (🔊 다시 듣기)`, { listen: true, koAlways: true });
      await orderTask('Ms. Green', 'Stand up in order!', '들은 순서대로 그림 카드를 눌러 일어나요.', set.map(c => c.card), (w) => L.cards.find(c => c.card === w).en);
    }
    await say('Ms. Green', 'Wonderful! Your group gets one point.', '훌륭해요! 모둠이 1점을 얻었어요.');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  setObj('❓ 동쪽 <b>QUIZ SHOW</b>의 <b>Host</b>에게 가요', npcAt('host')); mark('host');
  NPC.host.talk = async () => {
    mark('host', false); NPC.host.talk = null;
    const Q = L.quiz;
    await readLines(Q.q1);
    setScreen('🐇  VS  🐎');
    await say('Rani', Q.rani, '잘 들어 보세요. (🔊 다시 듣기)', { listen: true, koAlways: true });
    await ask('', 'Which is faster? (Rani의 대답)', 'Rani는 무엇이라고 대답했나요?', [Q.rani, 'The horse is faster than the rabbit.'], { sayIt: false });
    await say('Host', "You're right. Rani, you get 10 points.", '맞아요. Rani, 10점을 얻었어요.');
    setScreen('⚾  VS  🎾');
    await say('Host', 'Which is heavier?', '어느 것이 더 무거울까요?');
    await say('Hajun', Q.hajun, '테니스공이 야구공보다 더 무거워요.');
    await ask('나', '사회자가 되어 하준이에게 확인을 요청해요. 🤔', '알맞은 말을 고르세요.', ['Are you sure?', 'Yes, I am.', 'Which is faster?', 'Congratulations!'], { me: true, hint: 'Are you sure? = 확실하니?' });
    await say('Hajun', 'Yes, I am.', '네, 확실해요.');
    await say('Host', "You're wrong. " + Q.answer2, '틀렸어요. 야구공이 테니스공보다 더 무거워요.');
    await ask('', 'Which is heavier?', '사회자가 말한 정답은?', [Q.answer2, Q.hajun]);
    setScreen('🌏 Asia  VS  Africa 🌍');
    await say('Host', 'This is the last question. Which is bigger, Asia or Africa?', '마지막 문제예요. 아시아와 아프리카 중 어느 것이 더 클까요?');
    await ask('나', '하준이가 되어 버튼을 누르고 대답해요. 🔴', '아시아는 세계에서 가장 큰 대륙이에요.', [Q.last, 'Africa is bigger than Asia.', 'Are you sure?', 'Yes, I am.'], { me: true });
    await say('Host', "That's right. Rani, Hajun, you have the same score. You're all winners.", '정답이에요. Rani, 하준, 점수가 같아요. 모두 우승자예요.');
    setScreen('🏆 WINNERS 🏆');
    for (const id of ['hajun', 'rani']) { const p = NPC[id].g.position; puff(p.x, 2.6, p.z, '🎉'); }
    await say('Hajun', 'Congratulations!', '축하해!');
    await say('Rani', 'Congratulations!', '축하해!');
    closeDlg(); s3line();
  };
}
function s3line() {
  setObj('📏 퀴즈 쇼 북쪽 <b>선 비교 판</b>의 <b>Mia</b>에게 가요', npcAt('mia')); mark('mia');
  NPC.mia.talk = async () => {
    mark('mia', false); NPC.mia.talk = null;
    await readLines(L.lineTalk);
    await ask('나', 'Mia가 되어 Jimin에게 확인을 요청해요.', 'Read and Talk · 알맞은 말을 고르세요.', ['Are you sure?', 'Which is longer?', "I'm taller than you.", "You're next."], { me: true });
    await say('Jimin', 'Yes, I am.', '응, 확실해.');
    await say('Mia', "That's not right. They're the same.", '틀렸어. 둘은 길이가 같아.');
    await ask('', 'Which is longer, Line A or Line B?', '판의 두 선을 다시 보세요.', ["They're the same.", 'Line A is longer than Line B.', 'Line B is longer than Line A.']);
    await say('Mia', "Now, it's your turn!", '이제 네 차례야!');
    await ask('Mia', 'Which is bigger, A or B?', 'A: 🟡 작은 노란 공 · B: 🔵 큰 파란 공', ['B is bigger than A.', 'A is bigger than B.'], { speakQ: true });
    await ask('Mia', 'Are you sure?', '알맞은 대답을 고르세요.', ['Yes, I am.', 'Which is bigger?', "It's a home run!"], { speakQ: true, me: true });
    await say('Mia', "That's right!", '맞아!');
    closeDlg(); s3whisper();
  };
}
function s3whisper() {
  setObj('🤫 <b>Whisper Line</b> 맨 끝의 <b>Tom</b>에게 가요', npcAt('tom')); mark('tom');
  NPC.tom.talk = async () => {
    mark('tom', false); NPC.tom.talk = null;
    await say('Tom', "Let's play the whisper game! You're the last student.", '속삭이기 놀이를 하자! 네가 맨 끝 학생이야.');
    await say('', '', 'Play Together 2 · 맨 앞의 Eric이 카드를 보고 말한 문장이 귓속말로 전달돼요. Tom의 귓속말을 듣고 알맞은 카드를 골라요.', { btn: '시작!' });
    const set = shuffle(L.cards).slice(0, 3);
    for (const c of set) {
      for (const id of ['w1', 'w2', 'w3', 'w4', 'w5']) { const p = NPC[id].g.position; puff(p.x, 2.3, p.z, 'psst'); }
      await say('Tom', c.en, '🤫 잘 듣고 알맞은 카드를 골라요. (🔊 다시 듣기)', { listen: true, koAlways: true });
      await ask('', '어떤 카드일까요?', '들은 문장에 맞는 그림 카드를 고르세요.', [c.card, ...shuffle(L.cards.filter(x => x !== c)).slice(0, 3).map(x => x.card)], { sayIt: false, after: c.en });
      speak(c.en, '나');
    }
    await say('Tom', 'Great! Our group gets one point.', '좋아! 우리 모둠이 1점을 얻었어.');
    nextStage();
  };
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('green', 0, 11, Math.PI);
  setObj('🧱 공원 가운데의 <b>Ms. Green</b>에게 가요', npcAt('green')); mark('green');
  NPC.green.talk = async () => {
    mark('green', false); NPC.green.talk = null;
    await say('Ms. Green', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '공원 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['smaller', 'faster', 'longer', 'Who', 'you.', 'is', 'than', 'heavier?', 'Yes,', 'sure.'].filter(w => !words.includes(w));
  const extra = shuffle(pool).slice(0, 2);
  stageState.words = words; stageState.wi = 0; stageState.miss = 0;
  const all = shuffle(words.concat(extra));
  all.forEach((w, i) => {
    const a = (i / all.length) * Math.PI * 2 + Math.random() * 0.3, r = 5.5 + Math.random() * 3.5;
    const it = addItem(wordCube(w), BLK.x + Math.sin(a) * r, BLK.z + Math.cos(a) * r, (it) => {
      if (it.cool > performance.now()) return;
      if (w === stageState.words[stageState.wi]) {
        removeItem(it); stageState.wi++; beep('get'); speak(w.replace(/[?.,]/g, ''), '나'); drawSentenceBar();
        if (stageState.wi === stageState.words.length) finishSentence();
      } else { it.cool = performance.now() + 1200; beep('bad'); it.shake = 0.5; stageState.miss++; toast('순서가 아니에요! 다음 단어를 생각해 보세요.'); }
    }, { y: 1.1, r: 1.2 });
    it.word = w;
  });
  drawSentenceBar();
  setObj(`🧱 문장 ${stageState.si + 1}/${L.sentences.length}: <b>${sen.ko}</b>`, () => { const w = stageState.words && stageState.words[stageState.wi]; const it = items.find(i => i.alive && i.word === w); return S.koHelp && it ? [it.x, it.z] : null; });
}
function drawSentenceBar() {
  if (S.stage !== 3 || !stageState.words) { ui.sent.style.display = 'none'; return; }
  ui.sent.style.display = 'flex';
  ui.sent.innerHTML = stageState.words.map((w, i) => i < stageState.wi ? `<span class="slot fill">${w}</span>` : `<span class="slot">${'＿'.repeat(Math.min(w.length, 6))}</span>`).join('');
}
async function finishSentence() {
  const sen = L.sentences[stageState.si];
  S.tries++; if (!stageState.miss) { S.correct++; addStar(2); } else addStar(1); save();
  busy = true;
  await say('Ms. Green', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. Alice in Dreamland (Reading) ----
function stage5() {
  const R = L.reading;
  setObj('📖 북쪽 <b>Dreamland</b>의 나무 아래 <b>Alice</b>에게 가요', npcAt('alice')); mark('alice');
  NPC.alice.talk = async () => {
    mark('alice', false); NPC.alice.talk = null;
    await readLines(R.p1);
    await ask('', 'Alice ___ Mr. Rabbit (빠르기)', 'After You Read · 글의 내용에 맞게 < 또는 > 를 고르세요.', ['Alice < Mr. Rabbit', 'Alice > Mr. Rabbit'], { noShuffle: true, sayIt: false, after: "Alice is slower than Mr. Rabbit. (I'm slower than you.)" });
    closeDlg();
    placeNPC('alice', BIGTREE.x - 1.6, BIGTREE.z + 4.4, Math.PI); placeNPC('rabbit', BIGTREE.x + 1.8, BIGTREE.z + 4.4, Math.PI);
    setObj('🌳 <b>문이 있는 큰 나무</b>의 <b>Mr. Rabbit</b>에게 가요', npcAt('rabbit')); mark('rabbit');
    NPC.rabbit.talk = async () => {
      mark('rabbit', false); NPC.rabbit.talk = null;
      await readLines(R.p2.slice(0, 2));
      await ask('', 'Alice ___ the door (크기)', '글의 내용에 맞게 < 또는 > 를 고르세요.', ['Alice > the door', 'Alice < the door'], { noShuffle: true, sayIt: false, after: "I'm bigger than the door." });
      await say(...R.p2[2]);
      growTo(NPC.alice.g, 0.4); puff(NPC.alice.g.position.x, 1.6, NPC.alice.g.position.z, '✨ 쑥!');
      await say(...R.p2[3]);
      await ask('', "Now, Alice is ______ than the door.", '빈칸에 알맞은 말', ['smaller', 'bigger', 'faster'], { sayIt: false });
      closeDlg();
      placeNPC('alice', TABLE.x - 1.6, TABLE.z + 1.2, Math.PI); placeNPC('rabbit', TABLE.x + 1.6, TABLE.z + 1.2, Math.PI);
      setObj('🏠 <b>작은 집</b> 앞 탁자의 <b>Mr. Rabbit</b>에게 가요', npcAt('rabbit')); mark('rabbit');
      NPC.rabbit.talk = async () => {
        mark('rabbit', false); NPC.rabbit.talk = null;
        await readLines(R.p3.slice(0, 2));
        await ask('', 'Look at the table. Which cookie is bigger?', '탁자 위의 쿠키 두 개를 보세요.', ['The apple cookie is bigger than the lemon cookie.', 'The lemon cookie is bigger than the apple cookie.']);
        await say(...R.p3[2]);
        cookieA.visible = false; growTo(NPC.alice.g, 3.0, 1.6); puff(NPC.alice.g.position.x, 3, NPC.alice.g.position.z, '✨ 쑤욱!');
        await say(...R.p3[3]);
        await ask('', 'Before (쿠키를 먹기 전): Alice is ______ than the house.', 'After You Read B · 빈칸에 알맞은 말', ['smaller', 'bigger'], { noShuffle: true, sayIt: false });
        await ask('', 'After (쿠키를 먹은 후): Alice is ______ than the house.', 'After You Read B · 빈칸에 알맞은 말', ['bigger', 'smaller'], { noShuffle: true, sayIt: false });
        await say('', '', '💤 그때, 어디선가 Alice를 부르는 소리가 들려요…', { btn: '다음 ▶' });
        closeDlg(); flash();
        growers.length = 0; NPC.alice.g.scale.setScalar(1); cookieA.visible = true;
        placeNPC('alice', ...HOME.alice); NPC.rabbit.g.visible = false;
        setObj('😴 나무 아래에서 잠든 <b>Alice</b>를 깨워요', npcAt('alice')); mark('alice');
        NPC.alice.talk = async () => {
          mark('alice', false); NPC.alice.talk = null;
          await ask('나', 'Alice를 깨워요! ⏰', '알맞은 말을 고르세요.', ['Wake up, Alice!', 'Drink this, Alice.', "Let's go together.", 'Are you sure?'], { me: true });
          await say(...R.p4[1]);
          await say('', '', '📖 Alice in Dreamland 완료! Alice는 토끼보다 느리고(slower), 문보다 컸다가 작아지고(smaller), 쿠키를 먹고 집보다 커졌어요(bigger).', { btn: '다음 미션 ▶' });
          nextStage();
        };
      };
    };
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("✏️ 남동쪽 <b>Friends Corner</b>의 <b>Hana</b>에게 가요", npcAt('hana')); mark('hana');
  NPC.hana.talk = async () => {
    mark('hana', false);
    await say('Hana', 'Read my writing about Stacy and me!', 'Stacy와 나를 비교한 글을 읽어 줘!');
    await readLines(L.writeSample);
    await ask('', "Whose hair is longer?", '누구의 머리카락이 더 긴가요?', ["Stacy's hair is longer than Hana's.", "Hana's hair is longer than Stacy's."]);
    await ask('', "Whose bag is heavier?", '누구의 가방이 더 무거운가요?', ["Hana's bag", "Stacy's bag"]);
    await say('Hana', 'Now, compare you and your friend!', '이제 너와 친구를 비교하는 글을 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const opt = L.writeItems.map((a, i) => `<option value="${i}">${a[0]} · ${a[1]} (${a[2]})</option>`).join('');
  ['#wS1', '#wS2', '#wS3', '#wS4'].forEach((s, i) => { $(s).innerHTML = opt; $(s).value = i; });
  if (S.card) { $('#wName').value = S.card.name; $('#wMe').value = S.card.me || ''; ['s1', 's2', 's3', 's4'].forEach((k, i) => $('#wS' + (i + 1)).value = S.card[k]); }
  const upd = () => { $('#wPreview').innerHTML = letterHTML(letterData()); };
  f.oninput = upd; f.onchange = upd; upd();
  $('#wRead').onclick = () => speak(letterText(letterData()).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = letterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.name) || !/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.me)) { toast('내 이름과 친구 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    const names = [c.s1, c.s2, c.s3, c.s4].map(i => L.writeItems[i][0]);
    if (new Set(names).size < 4) { toast('비교 항목 네 가지를 서로 다른 물건으로 골라 주세요.'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).join(' '), '나');
    await say('Hana', 'Great writing! You and your friend are special.', '멋진 글이야! 너와 네 친구는 정말 특별해.');
    nextStage(); showEnd();
  };
}
function letterData() { return { me: $('#wMe').value.trim(), name: $('#wName').value.trim(), s1: +$('#wS1').value, s2: +$('#wS2').value, s3: +$('#wS3').value, s4: +$('#wS4').value }; }
function letterText(c) {
  const fr = c.name || '____', it = (i) => L.writeItems[i] || L.writeItems[0];
  const mine = (i) => `My ${it(i)[0]} is ${it(i)[1]} than ${fr}'s.`, yours = (i) => `${fr}'s ${it(i)[0]} is ${it(i)[1]} than mine.`;
  return [`${fr} and I are friends.`, mine(c.s1), yours(c.s2), mine(c.s3), yours(c.s4)];
}
function letterHTML(c) {
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  return '<div class="cardPrev">' + letterText(c).map(l => `<div>${esc(l)}</div>`).join('') + `<div style="text-align:right;color:var(--accent)">— ${esc(c.me || '____')}</div></div>`;
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>er 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · er 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? letterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? letterText(S.card).join(' ') + ' (' + S.card.me + ')' : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 er 코인 ----
const TH_SPOTS = [[-40, -24], [40, 8], [-14, -42], [38, -40], [-34, 38], [16, 42]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('er', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('er', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Peter');
      toast(`🪙 er 코인: <b>${w.replace(/er$/, '<u>er</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 er 코인을 모두 모았어요! The bear is bigger than the tiger.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Peter', "Hi! I'm Peter. The bear is bigger than the tiger.", '안녕! 나는 Peter야. 곰이 호랑이보다 더 커.');
  await say('Peter', 'Listen: bigger, tiger, Peter. er, er, er!', 'Sounds and Letters · er 소리를 들어 보세요.');
  await say('', '', `🪙 공원 구석구석에 숨은 er 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
  closeDlg();
};

// ---------------- 상호작용 ----------------
let nearNPC = null;
function interact() {
  if (dlgOpen || busy || !started || !nearNPC) return;
  const n = nearNPC;
  busy = true;
  (async () => {
    try {
      if (n.talk) await n.talk();
      else if (n.idle) { await say(n.name, n.idle[0], n.idle[1]); closeDlg(); }
    } finally { busy = false; if (dlgOpen && !dlgNextFn && !dlgChoiceKeys && !$('#writer').classList.contains('show') && !$('#end').classList.contains('show')) closeDlg(); }
  })();
}
// NPC.bonus.talk 등 일반 talk는 resetWorld 때 지워지지 않도록 별도 보관
const bethTalk = NPC.bonus.talk;

// ---------------- 입력 ----------------
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (dlgOpen) {
    if (['Space', 'Enter', 'KeyE'].includes(e.code) && dlgNextFn && ui.dlg.classList.contains('show')) { e.preventDefault(); dlgNextFn(); }
    if (dlgChoiceKeys && /^Digit[1-6]$/.test(e.code)) { const b = dlgChoiceKeys[+e.code.slice(5) - 1]; if (b) b.click(); }
    if (e.code === 'KeyR' && lastSpeech) speak(...lastSpeech);
    return;
  }
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (['KeyE', 'Enter', 'Space'].includes(e.code)) interact();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
let drag = null;
canvas.addEventListener('mousedown', (e) => {
  if (!started || dlgOpen) return;
  if (locked) { interact(); return; }
  drag = { x: e.clientX, y: e.clientY, moved: 0 };
});
addEventListener('mouseup', (e) => {
  if (drag && drag.moved < 5 && !dlgOpen && started && !isTouch) { try { canvas.requestPointerLock(); } catch (er) {} }
  drag = null;
});
addEventListener('mousemove', (e) => {
  if (locked) { P.yaw -= e.movementX * 0.0024; P.pitch -= e.movementY * 0.0024; }
  else if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.005; P.pitch -= dy * 0.005; drag.x = e.clientX; drag.y = e.clientY; }
  P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch));
});
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; $('#cross').style.display = locked ? 'block' : 'none'; });
// 터치
const isTouch = matchMedia('(pointer: coarse)').matches;
if (isTouch) document.body.classList.add('touch');
const joy = $('#joy'), knob = $('#knob');
let joyId = null, lookId = null, lookLast = null, joyC = null;
canvas.addEventListener('touchstart', (e) => {
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth * 0.4 && joyId === null) { joyId = t.identifier; joyC = [t.clientX, t.clientY]; joy.style.left = (t.clientX - 60) + 'px'; joy.style.top = (t.clientY - 60) + 'px'; joy.style.display = 'block'; }
    else if (lookId === null) { lookId = t.identifier; lookLast = [t.clientX, t.clientY]; }
  }
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) { let dx = t.clientX - joyC[0], dy = t.clientY - joyC[1]; const d = Math.hypot(dx, dy), m = 50; if (d > m) { dx *= m / d; dy *= m / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; touch.mx = dx / m; touch.mz = dy / m; }
    if (t.identifier === lookId) { P.yaw -= (t.clientX - lookLast[0]) * 0.006; P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch - (t.clientY - lookLast[1]) * 0.006)); lookLast = [t.clientX, t.clientY]; }
  }
  e.preventDefault();
}, { passive: false });
const endTouch = (e) => { for (const t of e.changedTouches) { if (t.identifier === joyId) { joyId = null; touch.mx = touch.mz = 0; joy.style.display = 'none'; knob.style.transform = ''; } if (t.identifier === lookId) lookId = null; } };
canvas.addEventListener('touchend', endTouch); canvas.addEventListener('touchcancel', endTouch);
$('#actBtn').addEventListener('click', interact);
$('#prompt').addEventListener('click', interact);

// 상단 버튼
$('#koToggle').onclick = () => { S.koHelp = !S.koHelp; save(); refreshHUD(); toast(S.koHelp ? '한글 도움 켜짐' : '한글 도움 꺼짐 (도전 모드!)'); };
$('#rateBtn').onclick = () => { S.rate = S.rate >= 0.9 ? 0.7 : 0.9; save(); $('#rateBtn').textContent = S.rate < 0.9 ? '🐢 천천히' : '🔊 보통'; speak('What grade are you in?', 'Kai'); };
$('#helpBtn').onclick = () => { $('#help').classList.add('show'); openDlg(); ui.dlg.classList.remove('show'); };
$('#helpClose').onclick = () => { $('#help').classList.remove('show'); closeDlg(); };
$('#mapBtn').onclick = () => { $('#mapBox').classList.toggle('show'); };

// ---------------- 지도 ----------------
const mapC = $('#mapCanvas'), mctx = mapC.getContext('2d');
function drawMap() {
  if (!$('#mapBox').classList.contains('show')) return;
  const s = mapC.width / 96, cx = mapC.width / 2;
  const tx = (x) => cx + x * s, tz = (z) => cx + z * s;
  mctx.fillStyle = '#8bc66a'; mctx.fillRect(0, 0, mapC.width, mapC.height);
  drawMapWorld(tx, tz, s);
  const p = objective.pos && objective.pos();
  if (p) { mctx.fillStyle = '#e63946'; mctx.beginPath(); mctx.arc(tx(p[0]), tz(p[1]), 5, 0, 7); mctx.fill(); }
  mctx.save(); mctx.translate(tx(P.x), tz(P.z)); mctx.rotate(-P.yaw); mctx.fillStyle = '#1d3557';
  mctx.beginPath(); mctx.moveTo(0, -8); mctx.lineTo(5, 6); mctx.lineTo(-5, 6); mctx.fill(); mctx.restore();
}

// ---------------- 목표 표시 ----------------
const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshBasicMaterial({ color: 0xff3b6b }));
scene.add(beacon);

// ---------------- 메인 루프 ----------------
let lastT = performance.now(), zoneNow = null, mapTick = 0;
const SPEED = 5.5;
function update(dt, t) {
  if (started && !dlgOpen) {
    let fx = 0, fz = 0;
    if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1;
    if (keys.KeyA) fx -= 1; if (keys.KeyD) fx += 1;
    if (keys.ArrowLeft) P.yaw += 2.2 * dt; if (keys.ArrowRight) P.yaw -= 2.2 * dt;
    if (keys.KeyQ) P.yaw += 2.2 * dt;
    fz -= touch.mz; fx += touch.mx;
    const len = Math.hypot(fx, fz);
    if (len > 0) {
      const k = Math.min(1, len) / len * SPEED * (keys.ShiftLeft || keys.ShiftRight ? 1.7 : 1) * dt;
      const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      P.x += (-sy * fz + cy * fx) * k; P.z += (-cy * fz - sy * fx) * k;
    }
    collide();
  }
  camera.position.set(P.x, 1.6 + (started ? Math.sin(t * 9) * 0.02 * Math.min(1, Math.hypot(touch.mx, touch.mz) + (keys.KeyW || keys.KeyS || keys.ArrowUp ? 1 : 0)) : 0), P.z);
  camera.rotation.y = P.yaw; camera.rotation.x = P.pitch;
  if (!started) { P.yaw = Math.sin(t * 0.1) * 0.6; }

  // NPC
  nearNPC = null; let nd = 3.0;
  for (const n of Object.values(NPC)) {
    const g = n.g, p = g.position;
    if (n.follow) {
      const dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz);
      if (d > 2) { const m = Math.min(d - 2, 6 * dt); p.x += dx / d * m; p.z += dz / d * m; }
      g.rotation.y = Math.atan2(dx, dz); p.y = Math.abs(Math.sin(t * 10)) * 0.08;
    }
    const dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz);
    if (d < 6 && !n.follow) { const target = Math.atan2(dx, dz); let diff = target - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 5); }
    if (!n.follow) p.y = 0;
    const m = g.userData.mark; if (m.visible) m.position.y = (m.userData.baseY || 2.75) + Math.sin(t * 4) * 0.1;
    const sc = d - (n.talk ? 1.2 : 0); // 미션 친구(❗) 우선
    if (g.visible && d < 3.0 && sc < nd) { nd = sc; nearNPC = n; }
  }
  if (nearNPC && started && !dlgOpen) {
    ui.prompt.style.display = 'block';
    ui.prompt.innerHTML = (isTouch ? '👆 ' : '<b>E</b> ') + nearNPC.name + (nearNPC.talk ? ' 와 이야기하기 ❗' : ' 와 이야기하기');
  } else ui.prompt.style.display = 'none';
  $('#actBtn').classList.toggle('ready', !!nearNPC);

  // 물건
  for (const it of items) {
    if (!it.alive) continue;
    it.mesh.rotation.y += it.spin * dt;
    let off = 0; if (it.shake > 0) { it.shake -= dt; off = Math.sin(t * 60) * 0.15; }
    it.mesh.position.set(it.x + off, it.y + Math.sin(t * 2 + it.x) * 0.15, it.z);
    if (started && !dlgOpen && Math.hypot(it.x - P.x, it.z - P.z) < it.r) it.onTouch(it);
  }
  items = items.filter(i => i.alive);

  // 구역
  let z = null;
  for (const r of zones) if (P.x > r.x1 && P.x < r.x2 && P.z > r.z1 && P.z < r.z2) z = [r.type, r.id];
  const zk = z ? z.join(':') : null;
  if (zk !== zoneNow) { zoneNow = zk; if (z && zoneHandlers[z[0]] && started && !dlgOpen) zoneHandlers[z[0]](z[1]); }

  worldTick(dt, t);
  // 목표
  const p = objective.pos && objective.pos();
  if (p && started) {
    beacon.visible = true; beacon.position.set(p[0], 3.3 + Math.sin(t * 3) * 0.2, p[1]); beacon.rotation.y = t * 2;
    const dx = p[0] - P.x, dz = p[1] - P.z, d = Math.hypot(dx, dz);
    const ty = Math.atan2(-dx, -dz); let rel = ty - P.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    ui.arrow.style.display = 'block'; ui.arrow.style.transform = `rotate(${-rel}rad)`; ui.dist.textContent = Math.round(d) + 'm';
  } else { beacon.visible = false; ui.arrow.style.display = 'none'; ui.dist.textContent = ''; }
  if ((mapTick += dt) > 0.1) { mapTick = 0; drawMap(); }
}
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  update(dt, now / 1000);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// ---------------- 시작 ----------------
function begin(reset) {
  if (reset) { const keep = { koHelp: S.koHelp, rate: S.rate }; S = Object.assign(fresh(), keep); save(); }
  $('#title').classList.remove('show'); started = true;
  P.x = 0; P.z = 40; P.yaw = 0; P.pitch = 0;
  startStage(S.stage);
  track('start', { stage: S.stage });
  setInterval(() => track('state', { stage: S.stage, stars: S.stars, correct: S.correct, tries: S.tries, best: S.best }), 30000);
  NPC.bonus.talk = bethTalk;
  if (S.stage === 0) showBanner(STAGES[0].title, '마우스 클릭 → 화면 돌리기 · W A S D 이동 · E 말 걸기');
  if (S.stage >= STAGES.length - 1) showEnd();
  if (!isTouch) setTimeout(() => toast('화면을 한 번 클릭하면 마우스로 둘러볼 수 있어요 (Esc로 해제)', 3500), 3200);
}
// resetWorld가 talk를 지우므로 보너스 대화 복구
const _reset = resetWorld;
resetWorld = function () { _reset(); NPC.bonus.talk = bethTalk; };
$('#btnStart').onclick = () => begin(true);
$('#btnContinue').onclick = () => begin(false);
if (S.stage > 0) { $('#btnContinue').style.display = 'inline-block'; $('#btnContinue').textContent = `이어하기 (${STAGES[Math.min(S.stage, STAGES.length - 1)].title})`; $('#btnStart').textContent = '처음부터'; }
$('#rateBtn').textContent = S.rate < 0.9 ? '🐢 천천히' : '🔊 보통';
resetWorld();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {});
requestAnimationFrame(loop);
// 테스트용: ?stage=N
const qs = new URLSearchParams(location.search);
if (qs.has('stage')) { S.stage = +qs.get('stage'); begin(false); }
window.__game = { say, ask, tick: (dt) => update(dt, performance.now() / 1000), get S() { return S; }, P, NPC, startStage, items: () => items, zones, HOME, stallInfo: typeof stallInfo !== 'undefined' ? stallInfo : null, get decor() { return decor; }, get st() { return stageState; }, get held() { return held; }, get busy() { return busy; } };
if (qs.has('autotest')) { const s = document.createElement('script'); s.src = 'autotest.js'; document.body.appendChild(s); }
})();
// 개발용 화면 위치: ?view=x,z,yaw  /  ?dlg=1
(() => { const q = new URLSearchParams(location.search); const G = window.__game; if (q.has('view')) { const [x, z, y] = q.get('view').split(',').map(Number); G.P.x = x; G.P.z = z; G.P.yaw = y; } })();
