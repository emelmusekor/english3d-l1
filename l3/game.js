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
const SAVE_KEY = 'english3d_l3_v1';
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
  Olivia: [1, 1.3], Hajun: [0, 1.15], Kai: [0, 1.1], Joel: [0, 1.15], Clerk: [1, 1.1], Rani: [1, 1.4], Mom: [1, 1.05], Ria: [1, 1.6],
  'Dr. Jones': [0, 0.85], 'Nurse Kim': [1, 1.15], Pharmacist: [0, 1.0], Patient: [0, 1.05], Florence: [1, 1.25], Mother: [1, 1.0], Soldier: [0, 0.8],
  Narrator: [1, 1.0], Judy: [1, 1.3], Suho: [0, 1.1], Stella: [1, 1.3], Jenny: [1, 1.5], Sam: [0, 1.2], Emily: [1, 1.35], Jiho: [0, 1.1], Mia: [1, 1.3], Khan: [0, 1.0], '나': [0, 1.0]
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

// ---------------- 세계 만들기 (Lesson 3 · Spring Park & Health Town) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8bc66a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xeadfca)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xeadfca)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0x40c057, -4, 2, FEN); solid(1, 4, 1, 0x40c057, 4, 2, FEN);
const gateSign = textPlane('Spring Park', 1.1, { fs: 64, bg: '#2f9e44', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1, blossom = false) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const c = ball(1.5 * s, blossom ? 0xffc9de : 0x4caf50, x, 3 * s, z); c.scale.y = 1.1;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -43, 1, i % 16 === 0); tree(-43, i, 1.1, i % 16 === 8); tree(43, i + 3, 1, i % 16 === 0); }
for (const x of [-38, -14, 14, 38]) tree(x, 42, 0.9, true);
for (const [x, z] of [[-12, 30], [12, 34], [-16, 14], [16, 10]]) tree(x, z, 1.2, true);
// 꽃밭
const FLOWER = { x: -9, z: 18 };
const fc = [0xff6b6b, 0xffd43b, 0xf783ac, 0xffffff, 0xb197fc];
for (let i = 0; i < 70; i++) {
  const x = FLOWER.x + (Math.random() - 0.5) * 7, z = FLOWER.z + (Math.random() - 0.5) * 5;
  cyl(0.02, 0.02, 0.4, 0x2b8a3e, x, 0.2, z, scene, 4); ball(0.11, fc[i % 5], x, 0.45, z);
}
{ const s = textPlane('🌷 Flower Garden', 0.5, { fs: 52, bg: '#ffffff', fg: '#2b8a3e' }); s.position.set(FLOWER.x, 1.5, FLOWER.z + 2.8); }
// 피크닉 돗자리
const MAT = { x: -4.5, z: 24 };
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6), mat(0xff8787)); m.rotation.x = -Math.PI / 2; m.position.set(MAT.x, 0.03, MAT.z); scene.add(m);
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.25), mat(0xffffff)); s.rotation.x = -Math.PI / 2; s.position.set(MAT.x, 0.035, MAT.z - 1 + i * 0.65); scene.add(s); }
  box(0.6, 0.35, 0.4, 0xc58b3a, MAT.x + 1, 0.2, MAT.z); }
// 푸드 트럭
const TRUCK = { x: 10, z: 18 };
(function truck() {
  const g = new THREE.Group();
  box(3, 2.6, 6, 0x4dabf7, 0, 1.7, 0, g); box(3.02, 1.1, 2.6, 0xffffff, 0, 2.1, 0.6, g);
  box(0.4, 0.1, 2.8, 0xffd43b, -1.7, 1.45, 0.6, g);
  for (const [x, z] of [[-1.5, -2], [1.5, -2], [-1.5, 2.2], [1.5, 2.2]]) { const w = cyl(0.5, 0.5, 0.3, 0x222222, x, 0.5, z, g); w.rotation.z = Math.PI / 2; }
  const t = textPlane('FOOD TRUCK 🍦🍪', 0.5, { fs: 52, bg: '#ffd43b', fg: '#222' }, g); t.position.set(-1.52, 3.2, 0.2); t.rotation.y = -Math.PI / 2;
  g.position.set(TRUCK.x, 0, TRUCK.z); scene.add(g); block(TRUCK.x - 1.5, TRUCK.z - 3, TRUCK.x + 1.5, TRUCK.z + 3);
})();
// 벤치
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-6, 8); bench(6, 8);

// ---------- 서쪽: Rani's House ----------
const HOUSE = { x: -27, z: -2 };
solid(0.4, 4, 20, 0xfff3bf, -34, 2, -2);
solid(14, 4, 0.4, 0xfff3bf, -27, 2, -12); solid(14, 4, 0.4, 0xfff3bf, -27, 2, 8);
solid(0.5, 4, 0.5, 0xe8590c, -20.2, 2, -11.8); solid(0.5, 4, 0.5, 0xe8590c, -20.2, 2, 7.8);
{ const r = new THREE.Mesh(new THREE.ConeGeometry(12.5, 4, 4), mat(0xe8590c)); r.rotation.y = Math.PI / 4; r.scale.set(0.8, 1, 1.1); r.position.set(-27, 6, -2); scene.add(r); }
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xe9d8a6)); fl.rotation.x = -Math.PI / 2; fl.position.set(-27, 0.02, -2); scene.add(fl); }
{ const s = textPlane("Rani's House 🏠", 0.9, { fs: 64, bg: '#e8590c', fg: '#fff' }); s.position.set(-19.9, 4.6, -2); s.rotation.y = Math.PI / 2; }
// 침대
const BED = { x: -31.5, z: -8 };
solid(2.2, 0.6, 3.2, 0x8d6e63, BED.x, 0.3, BED.z); box(2.1, 0.25, 3.1, 0xffffff, BED.x, 0.72, BED.z); box(2.1, 0.2, 1.6, 0x74c0fc, BED.x, 0.88, BED.z + 0.7); box(1.2, 0.2, 0.6, 0xffffff, BED.x, 0.9, BED.z - 1.1);
// TV
box(2.2, 1.3, 0.12, 0x212529, -27, 1.6, -11.7); box(2, 1.1, 0.02, 0x4dabf7, -27, 1.6, -11.63);
// 부엌
box(4, 1, 1, 0xffffff, -31, 0.5, 6.8); box(4, 0.06, 1.02, 0x868e96, -31, 1.02, 6.8);
for (const [dx, c] of [[-1, 0xff922b], [0, 0xff922b], [1, 0xffd43b]]) ball(0.15, c, -31 + dx, 1.2, 6.8);
cyl(0.7, 0.7, 0.06, 0xffffff, -27, 0.78, 3, scene, 18); cyl(0.07, 0.07, 0.78, 0x777777, -27, 0.39, 3); block(-27.6, 2.4, -26.4, 3.6);
// 신발장/문 표시
{ const s = textPlane('Sports Day 🏃 (Today!)', 0.4, { fs: 48, bg: '#ffffff', fg: '#c92a2a' }); s.position.set(-33.75, 2.4, 0); s.rotation.y = Math.PI / 2; }

// ---------- 동쪽: Hospital ----------
const HOSP = { x: 27, z: -2 };
solid(0.4, 4.5, 20, 0xffffff, 34, 2.25, -2);
solid(14, 4.5, 0.4, 0xffffff, 27, 2.25, -12); solid(14, 4.5, 0.4, 0xffffff, 27, 2.25, 8);
solid(0.5, 4.5, 0.5, 0xe03131, 20.2, 2.25, -11.8); solid(0.5, 4.5, 0.5, 0xe03131, 20.2, 2.25, 7.8);
box(14.6, 0.4, 20.6, 0xf1f3f5, 27, 4.7, -2);
box(0.3, 2.2, 0.7, 0xe03131, 20, 6.0, -2); box(0.3, 0.7, 2.2, 0xe03131, 20, 6.0, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xe7f5ff)); fl.rotation.x = -Math.PI / 2; fl.position.set(27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('Hospital 🏥', 1.0, { fs: 64, bg: '#e03131', fg: '#fff' }); s.position.set(19.9, 4.2, -7); s.rotation.y = -Math.PI / 2; }
// 진료실 책상
solid(1, 0.9, 2.4, 0xdee2e6, 31.5, 0.45, -6); box(0.05, 0.6, 0.8, 0x212529, 31.9, 1.25, -6.6);
solid(1.6, 0.6, 2.4, 0xa5d8ff, 31.5, 0.3, -9.6); box(1.5, 0.2, 2.3, 0xffffff, 31.5, 0.7, -9.6);
// 대기실 의자
for (let i = 0; i < 6; i++) box(1.0, 0.5, 0.8, 0x74c0fc, 23 + (i % 3) * 1.3, 0.25, 2 + Math.floor(i / 3) * 3);
{ const s = textPlane('Waiting Room', 0.45, { fs: 48, bg: '#1c7ed6', fg: '#fff' }); s.position.set(33.75, 2.6, 3.5); s.rotation.y = -Math.PI / 2; }
// 약국 카운터
const PHARM = { x: 27, z: 6.6 };
box(5, 1.1, 0.8, 0x96f2d7, PHARM.x, 0.55, PHARM.z); for (let k = 0; k < 6; k++) box(0.25, 0.35, 0.25, [0xff8787, 0x74c0fc, 0xffd43b][k % 3], PHARM.x - 2 + k * 0.8, 1.3, PHARM.z);
{ const s = textPlane('Pharmacy 💊', 0.45, { fs: 48, bg: '#0ca678', fg: '#fff' }); s.position.set(PHARM.x, 2.5, PHARM.z + 0.9); s.rotation.y = Math.PI; }

// ---------- 북쪽: The Great Nurse 이야기 마당 ----------
const STORY = { x: 0, z: -32 };
box(40, 0.3, 14, 0xf8f0e3, 0, 0.15, -34);
solid(40, 4, 0.4, 0xe6d5b8, 0, 2, -41);
{ const s = textPlane('The Great Nurse · Story Garden', 0.9, { fs: 62, bg: '#5f3dc4', fg: '#fff' }); s.position.set(0, 5, -40.7); }
// 왼쪽: 어린 Florence의 방 (인형)
const ROOM1 = { x: -10, z: -35 };
solid(0.3, 3, 8, 0xffdeeb, -16, 1.5, -36.5); box(8, 0.2, 8, 0xffc9de, -12, 3.1, -36.5);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), mat(0xffe3ec)); fl.rotation.x = -Math.PI / 2; fl.position.set(-12, 0.32, -36.5); scene.add(fl); }
solid(1.6, 0.5, 2.4, 0xd0bfff, -14.4, 0.55, -38.5); box(1.5, 0.15, 2.3, 0xffffff, -14.4, 0.85, -38.5);
(function doll() { const g = new THREE.Group(); cyl(0.12, 0.16, 0.3, 0x74c0fc, 0, 0.15, 0, g); ball(0.1, 0xf5cfa8, 0, 0.38, 0, g); ball(0.105, 0xfab005, 0, 0.42, -0.02, g); g.position.set(-14.4, 0.92, -38.0); g.rotation.x = -1.4; scene.add(g); })();
{ const s = textPlane('Young Florence 👧', 0.45, { fs: 48, bg: '#ffffff', fg: '#d6336c' }); s.position.set(-12, 2.6, -40.6); }
// 오른쪽: 전쟁 중 병원 텐트
const TENT = { x: 10, z: -35 };
{ const t = new THREE.Mesh(new THREE.ConeGeometry(4.4, 3.6, 4, 1, true), new THREE.MeshLambertMaterial({ color: 0xd8c39a, side: THREE.DoubleSide })); t.rotation.y = Math.PI / 4; t.position.set(12, 2.1, -38.2); scene.add(t); }
for (const dx of [-2.2, 0, 2.2]) { box(1.0, 0.4, 2, 0x868e96, 12 + dx, 0.5, -38.4); box(0.95, 0.12, 1.9, 0xffffff, 12 + dx, 0.75, -38.4); block(12 + dx - 0.5, -39.4, 12 + dx + 0.5, -37.4); }
{ const lamp = ball(0.15, 0xffe066, 8.6, 1.6, -33); lamp.material = new THREE.MeshBasicMaterial({ color: 0xffe066 }); cyl(0.12, 0.12, 0.3, 0x495057, 8.6, 1.35, -33); }
{ const s = textPlane('Nurse Florence 🏮', 0.45, { fs: 48, bg: '#ffffff', fg: '#5f3dc4' }); s.position.set(12, 3.6, -40.6); }

// ---------- 남서: Let's Write 편지 책상 (Judy) ----------
const WRITE = { x: -26, z: 30 };
box(16, 0.4, 12, 0xd0ebff, WRITE.x, 0.2, WRITE.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz);
box(17, 0.4, 13, 0x1971c2, WRITE.x, 5.2, WRITE.z);
{ const s = textPlane("Let's Write · Get Well Desk", 0.85, { fs: 62, bg: '#1971c2', fg: '#fff' }); s.position.set(WRITE.x + 8.6, 4.4, WRITE.z); s.rotation.y = Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x - 1, 0.85, WRITE.z);
solid(0.4, 3.4, 10, 0xf8f9fa, WRITE.x - 7.6, 2, WRITE.z);
['🤧', '🤒', '💊'].forEach((e, i) => { const p = textPlane(e, 1.4, { fs: 110, bg: '#ffffff', border: '#1971c2' }); p.position.set(WRITE.x - 7.35, 2.4, WRITE.z - 3 + i * 3); p.rotation.y = Math.PI / 2; });

// ---------- 남동: 운동장 (Sports Day) ----------
const FIELD = { x: 26, z: 30 };
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat(0x69db7c)); f.rotation.x = -Math.PI / 2; f.position.set(FIELD.x, 0.02, FIELD.z); scene.add(f);
  for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(16, 0.12), mat(0xffffff)); l.rotation.x = -Math.PI / 2; l.position.set(FIELD.x, 0.03, FIELD.z - 4.5 + i * 3); scene.add(l); }
  const s = textPlane('Sports Day 🏃', 0.7, { fs: 60, bg: '#f76707', fg: '#fff' }); s.position.set(FIELD.x, 3.2, FIELD.z - 6.2); cyl(0.06, 0.06, 3, 0x666666, FIELD.x - 2.5, 1.5, FIELD.z - 6.2); cyl(0.06, 0.06, 3, 0x666666, FIELD.x + 2.5, 1.5, FIELD.z - 6.2);
  for (let i = 0; i < 8; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 3), mat(fc[i % 5])); fl.position.set(FIELD.x - 7 + i * 2, 2.6, FIELD.z - 6.2); fl.rotation.x = Math.PI; scene.add(fl); } }

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'tissue') { box(0.4, 0.2, 0.25, 0x74c0fc, 0, 0.1, 0, g); const t = box(0.12, 0.15, 0.08, 0xffffff, 0, 0.27, 0, g); t.rotation.z = 0.3; }
  else if (id === 'medicine') { box(0.18, 0.28, 0.18, 0xffffff, -0.12, 0.14, 0, g); box(0.2, 0.06, 0.2, 0xff6b6b, -0.12, 0.3, 0, g); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.24, 12), new THREE.MeshLambertMaterial({ color: 0xd0ebff, transparent: true, opacity: 0.7 })); gl.position.set(0.12, 0.12, 0); g.add(gl); }
  else if (id === 'orange juice') { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.32, 14), new THREE.MeshLambertMaterial({ color: 0xff922b, transparent: true, opacity: 0.85 })); gl.position.y = 0.16; g.add(gl); ball(0.06, 0xff922b, 0.09, 0.33, 0, g); }
  else if (id === 'ice cream') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 12), mat(0xd7a35a)); c.rotation.x = Math.PI; c.position.y = 0.15; g.add(c); ball(0.11, 0x5d4037, 0, 0.33, 0, g); }
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
  if (f) { heldMesh = itemModel(f); heldMesh.scale.setScalar(0.9); heldMesh.position.set(0.34, -0.45, -0.8); camera.add(heldMesh); }
}
function setHeld(id, label) { held = { kind: 'thing', id, label }; refreshHUD(); }
// 재채기 효과
let sneezeT = 0;
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  for (const f of fallers) { f.userData.life -= dt; f.position.y += dt * 0.8; f.material.opacity = Math.max(0, f.userData.life); }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { scene.remove(f); return false; } return true; });
}
function puff(x, y, z, text = 'Achoo!') {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#1c7ed6', border: '#1c7ed6' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 1.6; scene.add(s); fallers.push(s);
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#eadfca'); R(0, -2, 52, 6, '#eadfca');
  R(-27, -2, 14, 20, '#e8590c', '라니 집'); R(27, -2, 14, 20, '#e03131', '병원');
  R(0, -36, 40, 9, '#5f3dc4', '이야기 마당'); R(WRITE.x, WRITE.z, 16, 12, '#1971c2', '편지');
  R(FIELD.x, FIELD.z, 16, 12, '#2f9e44', '운동장'); R(FLOWER.x, FLOWER.z, 7, 5, '#f783ac', '꽃밭'); R(TRUCK.x, TRUCK.z, 3, 6, '#4dabf7', '트럭');
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
const SY = Object.fromEntries(L.symptoms.map(s => [s.id, s]));
function addNPC(id, o, x, z, face = 0) {
  const g = makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '' };
  return NPC[id];
}
// 집 위치 [x, z, 방향]
const HOME = {
  olivia: [FLOWER.x + 1.5, FLOWER.z + 3.4, Math.PI], hajun: [FLOWER.x - 1.2, FLOWER.z + 3.4, Math.PI],
  kai: [TRUCK.x - 2.6, TRUCK.z - 1, -Math.PI / 2], joel: [TRUCK.x - 2.6, TRUCK.z + 1.2, -Math.PI / 2], truck: [TRUCK.x - 1.9, TRUCK.z + 2.6, -Math.PI / 2],
  rani: [-30, -5, Math.PI / 2], raniMom: [-28.4, -4, Math.PI / 2], ria: [-30.5, 4.5, Math.PI / 2],
  doctor: [30.6, -6, -Math.PI / 2], nurse: [22.8, -6, Math.PI / 2], pharmacist: [PHARM.x, PHARM.z + 0.9, Math.PI],
  florenceYoung: [-12, -36.6, 0], florenceMom: [-10.2, -35.4, -Math.PI / 4],
  florence: [9.6, -33.6, 0], soldier: [12, -34.6, 0],
  judy: [WRITE.x + 1, WRITE.z + 1.8, Math.PI / 2], suho: [WRITE.x + 2.4, WRITE.z - 1.6, Math.PI / 2],
  bonus: [-6, -20, 0]
};
const P_POS = [[14, -7], [16.5, -7], [14, -4], [16.5, -4], [14, -1], [16.5, -1]];
L.patients.forEach((p, i) => { HOME[p.id] = [...P_POS[i], -Math.PI / 2]; });

addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ['Oh, these flowers are beautiful.', '와, 이 꽃들 정말 예쁘다.'] }, ...HOME.olivia);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ['I have a runny nose.', '나는 콧물이 나.'] }, ...HOME.hajun);
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ['I have a toothache.', '나는 이가 아파.'] }, ...HOME.kai);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ["Don't eat too many sweets.", '단것을 너무 많이 먹지 마.'] }, ...HOME.joel);
addNPC('truck', { name: 'Clerk', girl: true, shirt: 0xffd43b, hair: 0x222222, idle: ['Hello! What would you like to have?', '안녕! 무엇을 먹고 싶니?'] }, ...HOME.truck);
addNPC('rani', { name: 'Rani', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ["I don't feel well.", '몸이 안 좋아.'] }, ...HOME.rani);
addNPC('raniMom', { name: 'Mom', girl: true, shirt: 0x7048e8, skirt: 0x5f3dc4, hair: 0x1b1b1b, scale: 1.12, idle: ['Go to bed early.', '일찍 자렴.'] }, ...HOME.raniMom);
addNPC('ria', { name: 'Ria', girl: true, shirt: 0xffa94d, hair: 0x1b1b1b, scale: 0.75, idle: ['I made some orange juice for you.', '언니를 위해 오렌지주스를 만들었어.'] }, ...HOME.ria);
addNPC('doctor', { name: 'Dr. Jones', shirt: 0xffffff, pants: 0x495057, hair: 0x868e96, scale: 1.15, idle: ['Sit down, please. What\'s wrong?', '앉으세요. 어디가 아프니?'] }, ...HOME.doctor);
addNPC('nurse', { name: 'Nurse Kim', girl: true, shirt: 0xfcc2d7, skirt: 0xf783ac, hair: 0x222222, idle: ["What's wrong?", '어디가 아프니?'] }, ...HOME.nurse);
addNPC('pharmacist', { name: 'Pharmacist', shirt: 0xffffff, pants: 0x0ca678, hair: 0x3b2a1a, idle: ['Take this with warm water.', '이것을 따뜻한 물과 함께 먹으렴.'] }, ...HOME.pharmacist);
addNPC('florenceYoung', { name: 'Florence', girl: true, shirt: 0x74c0fc, hair: 0xa0522d, scale: 0.8, idle: ["I'm taking care of my doll.", '나는 인형을 돌보고 있어요.'] }, ...HOME.florenceYoung);
addNPC('florenceMom', { name: 'Mother', girl: true, shirt: 0x9c36b5, skirt: 0x862e9c, hair: 0x6d4c41, scale: 1.12, idle: ['What are you doing, Florence?', 'Florence, 뭐 하고 있니?'] }, ...HOME.florenceMom);
addNPC('florence', { name: 'Florence', girl: true, shirt: 0x343a40, skirt: 0xf8f9fa, hair: 0xa0522d, hat: true, scale: 1.1, idle: ["What's wrong?", '어디가 아프세요?'] }, ...HOME.florence);
addNPC('soldier', { name: 'Soldier', shirt: 0x5c940d, hair: 0x3b2a1a, idle: ['I have a headache.', '머리가 아파요.'] }, ...HOME.soldier);
addNPC('judy', { name: 'Judy', girl: true, shirt: 0x1971c2, hair: 0xd4a017, idle: ['Hi, Suho. Are you okay?', '안녕, 수호야. 괜찮니?'] }, ...HOME.judy);
addNPC('suho', { name: 'Suho', shirt: 0x868e96, hair: 0x111111, idle: ["I don't feel well.", '몸이 안 좋아.'] }, ...HOME.suho);
addNPC('bonus', { name: 'Stella', girl: true, shirt: 0x8e24aa, hair: 0xc0392b, idle: ['I have a stomachache. Get some rest.', '배가 아파. 좀 쉬렴.'] }, ...HOME.bonus);
L.patients.forEach((p, i) => addNPC(p.id, { name: p.name, girl: p.girl, shirt: p.shirt, hair: [0xa0522d, 0x3b2a1a, 0xd4a017, 0x111111, 0x222222, 0x111111][i], skin: p.name === 'Khan' ? 0xc68642 : undefined, scale: 0.9, idle: [`I have a ${p.symptom}.`, `${SY[p.symptom].ko} 때문에 아파요.`] }, ...HOME[p.id]));
function placeNPC(id, x, z, face) { const n = NPC[id]; n.g.position.set(x, 0, z); if (face !== undefined) n.g.rotation.y = face; n.home = [x, z, n.g.rotation.y]; n.follow = false; }


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
const WQ = ["What's wrong?", 'What would you like to have?', 'What grade are you in?', "How's your pizza?"];
const SILLY = ['Eat too many sweets.', "Let's play outside all day.", 'Watch TV all night.', 'Go to school today.'];
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 봄 소풍', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 병원 도우미', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. Rani의 하루', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 위대한 간호사', book: 'Before/After You Read', start: stage5 },
  { title: '6. 아픈 친구에게 쓰는 글', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  if (S.stage > 1) L.patients.forEach((p, i) => placeNPC(p.id, 23 + (i % 3) * 1.3, 2.9 + Math.floor(i / 3) * 3, -Math.PI / 2));
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
function nearestOf(ids) { let best = null, bd = 1e9; for (const id of ids) { const p = NPC[id].g.position, d = dist([p.x, p.z]); if (d < bd) { bd = d; best = [p.x, p.z]; } } return best; }
function nearestItem() { let best = null, bd = 1e9; for (const it of items) { if (!it.alive || it.bonus) continue; const d = dist([it.x, it.z]); if (d < bd) { bd = d; best = [it.x, it.z]; } } return best; }
async function readLines(arr) { for (const [who, en, ko] of arr) await say(who, en, ko); }
function flash() { const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:50;opacity:1;transition:opacity .6s;pointer-events:none'; document.body.appendChild(f); setTimeout(() => f.style.opacity = 0, 60); setTimeout(() => f.remove(), 700); }
function sneeze(id) { const p = NPC[id].g.position; puff(p.x, 2.4, p.z); }
const symChoices = (right) => [right, ...shuffle(L.symptoms.map(s => s.id).filter(x => x !== right)).slice(0, 3)];

// ---- 1. Fun Talk 1 ----
function stage1() {
  setObj('🌷 <b>꽃밭</b>의 <b>Olivia</b>와 하준이에게 가요', npcAt('olivia')); mark('olivia');
  NPC.olivia.talk = async () => {
    mark('olivia', false); NPC.olivia.talk = null;
    await say('Olivia', 'Oh, these flowers are beautiful. Hajun, can you take a picture of me?', '와, 이 꽃들 정말 예쁘다. 하준아, 내 사진 좀 찍어 줄래?');
    sneeze('hajun');
    await say('Hajun', 'Okay. Achoo!', '그래. 에취!');
    await ask('나', 'Olivia가 되어 하준이에게 어디가 아픈지 물어보세요.', '알맞은 질문을 고르세요.', WQ, { me: true, hint: "What's wrong? = 어디가 아프니?" });
    await say('Hajun', 'I have a runny nose.', '나는 콧물이 나.', { listen: true });
    await ask('', 'Hajun has a ______.', '하준이는 어디가 아픈가요?', ['runny nose', 'toothache', 'fever', 'headache'], { hint: '🔊 다시 듣기를 눌러 보세요.' });
    await say('', '', '🧻 피크닉 돗자리에 있는 휴지를 가져다 하준이에게 주세요.', { btn: '가져올게!' });
    closeDlg();
    setObj('🧻 피크닉 돗자리에서 <b>휴지</b>를 가져와요', () => [MAT.x, MAT.z]);
    const g = itemModel('tissue'); g.scale.setScalar(1.8);
    addItem(g, MAT.x, MAT.z, (it) => {
      removeItem(it); setHeld('tissue', '🧻 tissue'); beep('get');
      setObj('🧻 하준이에게 휴지를 줘요', npcAt('hajun')); mark('hajun');
      NPC.hajun.talk = async () => {
        mark('hajun', false); NPC.hajun.talk = null; held = null; refreshHUD(); good();
        await say('Olivia', 'Here you are.', '여기 있어.');
        await say('Hajun', 'Thanks.', '고마워.');
        closeDlg(); s1truck();
      };
    }, { y: 0.6, r: 1.4, spin: 0.8 });
  };
}
function s1truck() {
  setObj('🍦 <b>푸드 트럭</b>의 <b>Kai</b>에게 가요', npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await say('Clerk', 'Hello! What would you like to have?', '안녕! 무엇을 먹고 싶니?');
    await say('Kai', "I'd like to have a chocolate ice cream, please. I want some chocolate cookies, too.", '초콜릿 아이스크림 주세요. 초콜릿 쿠키도 먹고 싶어요.');
    await say('Joel', "Kai, you don't look well.", 'Kai, 너 안색이 안 좋아 보여.');
    await ask('나', 'Joel이 되어 Kai에게 어디가 아픈지 물어보세요.', '알맞은 질문을 고르세요.', WQ, { me: true });
    await say('Kai', 'I have a toothache.', '나는 이가 아파.', { listen: true });
    await ask('', 'Kai has a ______.', 'Kai는 어디가 아픈가요?', ['toothache', 'runny nose', 'stomachache', 'cold']);
    await say('Joel', "Oh, that's too bad.", '아, 안됐다.');
    await ask('나', 'Joel이 되어 Kai에게 조언해 주세요. 🦷🍫', 'Kai는 단것을 많이 주문했어요.', ["Don't eat too many sweets.", 'Eat more sweets.', "Let's have some ice cream.", 'I have a toothache.'], { me: true });
    await say('Kai', 'Okay.', '알았어.');
    await say('Olivia', "Come here. Let's take a picture together.", '이리 와. 다 같이 사진 찍자.');
    placeNPC('olivia', TRUCK.x - 4, TRUCK.z - 0.5, -Math.PI / 2); placeNPC('hajun', TRUCK.x - 4, TRUCK.z + 1.5, -Math.PI / 2);
    flash(); beep('star'); toast('📸 찰칵! 다 함께 사진을 찍었어요.', 2500);
    await say('', '', '📸 Fun Talk 1 완료! 하준이는 콧물(runny nose), Kai는 치통(toothache)이 있었어요.', { btn: '다음 미션 ▶' });
    nextStage();
  };
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  setObj('🏥 동쪽 <b>Hospital</b>의 <b>Nurse Kim</b>에게 가요', npcAt('nurse')); mark('nurse');
  NPC.nurse.talk = async () => {
    mark('nurse', false); NPC.nurse.talk = null;
    await say('Nurse Kim', 'We have many patients today. Can you help me?', '오늘 환자가 많아요. 도와줄래요?');
    await say('', '', '병원 앞 환자 6명에게 어디가 아픈지 묻고, 잘 듣고, 진료 카드에 증상을 표시해 주세요.', { btn: '시작!' });
    closeDlg(); stageState.done = {};
    L.patients.forEach(p => {
      mark(p.id);
      NPC[p.id].talk = async () => {
        if (stageState.done[p.id]) { await say(p.name, 'Thank you!', '고마워요!'); closeDlg(); return; }
        mark(p.id, false);
        await ask('나', `${p.name}에게 어디가 아픈지 물어보세요.`, '알맞은 질문을 고르세요.', WQ, { me: true });
        await say(p.name, `I have a ${p.symptom}.`, '잘 듣고 진료 카드에 표시해요. (🔊 다시 듣기)', { listen: true, koAlways: true });
        await ask('', `📋 진료 카드 · ${p.name}: I have a ______.`, '알맞은 증상을 고르세요.', symChoices(p.symptom).map(s => `${SY[s].emoji} ${s}`), { sayIt: false, hint: '🔊 다시 듣기' });
        stageState.done[p.id] = 1; closeDlg();
        const i = L.patients.indexOf(p); placeNPC(p.id, 23 + (i % 3) * 1.3, 2.9 + Math.floor(i / 3) * 3, -Math.PI / 2);
        const n = Object.keys(stageState.done).length;
        if (n < L.patients.length) setObj(`📋 환자에게 어디가 아픈지 물어봐요 (${n}/6)`, () => nearestOf(L.patients.filter(x => !stageState.done[x.id]).map(x => x.id)));
        else s2pt1();
      };
    });
    setObj('📋 병원 앞 환자에게 어디가 아픈지 물어봐요 (0/6)', () => nearestOf(L.patients.filter(x => !stageState.done[x.id]).map(x => x.id)));
  };
}
function s2pt1() {
  setObj('👩‍⚕️ <b>Nurse Kim</b>에게 돌아가요', npcAt('nurse')); mark('nurse');
  NPC.nurse.talk = async () => {
    mark('nurse', false); NPC.nurse.talk = null;
    await say('Nurse Kim', "Great job! Let's play a game. Look at the gesture and say the symptom!", '잘했어요! 몸짓을 보고 증상을 말해 봐요!');
    for (const s of shuffle(L.symptoms).slice(0, 3)) {
      await ask('Nurse Kim', `${s.emoji}  ${s.act}`, 'Play Together 1 · 한마음 증상 말하기: 알맞은 문장을 고르세요.', [`I have a ${s.id}.`, ...shuffle(L.symptoms.filter(x => x.id !== s.id)).slice(0, 3).map(x => `I have a ${x.id}.`)], { me: true, speak: false });
    }
    await say('Nurse Kim', 'Wonderful! Thank you for your help.', '훌륭해요! 도와줘서 고마워요.');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Play Together 2 ----
function stage3() {
  placeNPC('rani', BED.x + 1.6, BED.z + 1, Math.PI / 2);
  setObj("🏠 서쪽 <b>Rani's House</b>의 <b>Rani</b>에게 가요", npcAt('rani')); mark('rani');
  NPC.rani.talk = async () => {
    mark('rani', false); NPC.rani.talk = null;
    await say('Rani', "Mom, I don't feel well.", '엄마, 몸이 안 좋아요.');
    await say('Mom', 'Oh, Rani, you have a fever.', '어머, Rani, 열이 있구나.');
    await say('Rani', 'Oh, no! Today is Sports Day. Can I go to school?', '안 돼! 오늘 운동회 날인데. 학교 가도 돼요?');
    await say('Mom', "No, you can't. Let's go see a doctor.", '아니, 안 돼. 병원에 가 보자.');
    await ask('', "What's wrong with Rani?", 'Rani는 어디가 아픈가요?', ['She has a fever.', 'She has a toothache.', 'She has a stomachache.']);
    closeDlg();
    placeNPC('rani', 29.4, -5.2, Math.PI / 2 + Math.PI); placeNPC('raniMom', 29.2, -3.6, -Math.PI / 2);
    setObj('🏥 <b>Hospital</b>의 <b>Dr. Jones</b>에게 가요', npcAt('doctor')); mark('doctor');
    NPC.doctor.talk = async () => {
      mark('doctor', false); NPC.doctor.talk = null;
      await say('Dr. Jones', 'Sit down, please.', '앉으세요.');
      await ask('나', 'Dr. Jones가 되어 Rani에게 어디가 아픈지 물어보세요.', '알맞은 질문을 고르세요.', WQ, { me: true });
      await say('Rani', 'I have a fever. I have a headache, too.', '열이 나요. 머리도 아파요.', { listen: true });
      await ask('', 'Rani has a fever and a ______.', 'Rani의 또 다른 증상은?', ['headache', 'toothache', 'stomachache', 'runny nose']);
      await say('Dr. Jones', 'Let me see. You have a cold.', '어디 보자. 감기에 걸렸구나.');
      await ask('나', 'Dr. Jones가 되어 Rani에게 조언해 주세요.', '알맞은 조언을 고르세요.', ['Drink warm water and get some rest.', 'Eat too many sweets.', 'Go to school today.', 'Watch TV all night.'], { me: true });
      await say('Rani', 'Okay, Dr. Jones.', '네, Jones 선생님.');
      await say('Dr. Jones', 'Please get the medicine at the pharmacy.', '약국에서 약을 받아 가세요.');
      closeDlg();
      setObj('💊 병원 안 <b>Pharmacy</b>에서 약을 받아요', npcAt('pharmacist')); mark('pharmacist');
      NPC.pharmacist.talk = async () => {
        mark('pharmacist', false); NPC.pharmacist.talk = null;
        await say('Pharmacist', 'Here you are. Take this with warm water.', '여기 있어요. 따뜻한 물과 함께 먹어요.');
        closeDlg(); setHeld('medicine', '💊 medicine'); beep('get');
        placeNPC('rani', BED.x + 1.4, BED.z + 0.6, Math.PI / 2); placeNPC('raniMom', BED.x + 2.6, BED.z + 2.2, Math.PI / 2);
        setObj("🏠 약을 들고 <b>Rani's House</b>의 <b>Mom</b>에게 가요", npcAt('raniMom')); mark('raniMom');
        NPC.raniMom.talk = async () => {
          mark('raniMom', false); NPC.raniMom.talk = null; held = null; refreshHUD(); good();
          await say('Mom', 'Rani, take this with warm water.', 'Rani, 이걸 따뜻한 물과 함께 먹으렴.');
          await say('Rani', 'Thank you, Mom. Can I watch TV?', '고마워요, 엄마. TV 봐도 돼요?');
          await ask('나', '엄마가 되어 대답해요. 😴', 'Rani는 푹 쉬어야 해요.', ["No, you can't. Go to bed early.", 'Yes. Watch TV all night.', 'I have a fever.', "What's wrong?"], { me: true });
          placeNPC('ria', BED.x + 2.4, BED.z + 0.2, Math.PI / 2);
          const oj = itemModel('orange juice'); oj.position.set(BED.x + 1.0, 0.95, BED.z + 0.2); addDecor(oj);
          await say('Ria', "Rani! I made some orange juice for you. It's good for your cold.", '언니! 언니를 위해 오렌지주스를 만들었어. 감기에 좋대.');
          await say('Rani', "Thanks, Ria. Oh, it's sweet. I like it.", '고마워, Ria. 와, 달다. 맛있어.');
          await say('Mom', 'Ria!', 'Ria!');
          await say('', '', '🍊 앗! Ria가 오렌지주스를 만드느라 부엌이 엉망이 됐어요.', {});
          await ask('', "How's the orange juice?", '오렌지주스의 맛은? (Lesson 2 복습)', ["It's sweet.", "It's salty.", "It's hot.", "It's sour."]);
          closeDlg(); s3pt2();
        };
      };
    };
  };
}
function s3pt2() {
  setObj('💊 <b>Pharmacy</b>의 약사에게 가서 조언 놀이를 해요', npcAt('pharmacist')); mark('pharmacist');
  NPC.pharmacist.talk = async () => {
    mark('pharmacist', false); NPC.pharmacist.talk = null;
    await say('Pharmacist', "Let's play a game! Listen to the patient and give advice.", '놀이를 해요! 환자의 말을 듣고 조언해 주세요.');
    for (const a of L.advice) {
      await ask('Patient', `I have a ${a.symptom}.`, `Play Together 2 · 증상 없애기 ${SY[a.symptom].emoji}  알맞은 조언을 고르세요.`, [a.advice, ...shuffle(SILLY).slice(0, 3)], { me: true, speakQ: true, listen: true });
    }
    await say('Pharmacist', 'Great! Now everyone feels better.', '좋아요! 이제 모두 나아졌어요.');
    nextStage();
  };
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('nurse', 0, 11, Math.PI);
  setObj('🧱 공원 가운데의 <b>Nurse Kim</b>에게 가요', npcAt('nurse')); mark('nurse');
  NPC.nurse.talk = async () => {
    mark('nurse', false); NPC.nurse.talk = null;
    await say('Nurse Kim', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '공원 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ["What's", 'wrong?', 'have', 'nose.', 'Take', 'some', 'rest.', 'water.', 'fever', 'Get'].filter(w => !words.includes(w));
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
  await say('Nurse Kim', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. The Great Nurse (Reading) ----
function stage5() {
  setObj('📖 북쪽 <b>Story Garden</b>의 <b>어린 Florence</b>에게 가요', npcAt('florenceYoung')); mark('florenceYoung');
  NPC.florenceYoung.talk = async () => {
    mark('florenceYoung', false); NPC.florenceYoung.talk = null;
    await readLines(L.reading.young);
    await ask('', 'Florence liked playing with a doll.', '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { noShuffle: true, sayIt: false });
    await ask('Florence', 'Oh, you have a cold. Go to bed ______.', '빈칸에 알맞은 말', ['early', 'late', 'now'], { sayIt: false });
    closeDlg();
    setObj('🏮 오른쪽 <b>텐트</b>의 <b>Nurse Florence</b>에게 가요', npcAt('florence')); mark('florence');
    NPC.florence.talk = async () => {
      mark('florence', false); NPC.florence.talk = null;
      await readLines(L.reading.nurse);
      await ask('', 'Florence became a teacher.', '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { right: '❌ X (틀려요)', noShuffle: true, sayIt: false, hint: 'Florence studied hard and became a ______.' });
      await ask('', 'Florence helped sick people in a war.', '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { noShuffle: true, sayIt: false });
      await say('', '', 'After You Read · 글의 내용에 맞게 문장을 완성해요.', { btn: '시작' });
      await ask('Soldier', 'I have a ______. I have a fever, too.', '빈칸에 알맞은 말', ['headache', 'toothache', 'runny nose'], { sayIt: false });
      await ask('Florence', '______ this with warm water and get some rest.', '빈칸에 알맞은 말', ['Take', 'Have', 'Eat'], { sayIt: false });
      await ask('Florence', 'Take this with warm water and ______ some rest.', '빈칸에 알맞은 말', ['get', 'go', 'take'], { sayIt: false });
      speak('Take this with warm water and get some rest.', 'Florence');
      await say('Florence', 'Do you know her? She was a great nurse, Florence Nightingale.', '그녀를 아나요? 위대한 간호사, 플로렌스 나이팅게일이었어요.');
      nextStage();
    };
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("✏️ 남서쪽 <b>Get Well Desk</b>의 <b>Judy</b>에게 가요", npcAt('judy')); mark('judy');
  NPC.judy.talk = async () => {
    mark('judy', false);
    await say('Judy', 'Read my writing!', '내 글을 읽어 줘!');
    await readLines(L.writeSample);
    await ask('', 'What does Judy tell Suho?', 'Judy의 조언은?', ["Don't go outside today.", 'Go to school today.', 'Eat too many sweets.']);
    await say('Judy', 'Now, write to your sick friend!', '이제 아픈 친구와의 대화 글을 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const symOpt = L.symptoms.map(s => `<option value="${s.id}">${s.id} (${s.ko})</option>`).join('');
  const advOpt = L.writeAdvice.map((a, i) => `<option value="${i}">${a[0]} (${a[1]})</option>`).join('');
  $('#wS1').innerHTML = symOpt; $('#wS2').innerHTML = symOpt; $('#wA1').innerHTML = advOpt; $('#wA2').innerHTML = advOpt;
  $('#wS1').value = 'cold'; $('#wS2').value = 'runny nose'; $('#wA1').value = 0; $('#wA2').value = 1;
  if (S.card) { $('#wName').value = S.card.name; $('#wMe').value = S.card.me || ''; $('#wS1').value = S.card.s1; $('#wS2').value = S.card.s2; $('#wA1').value = S.card.a1; $('#wA2').value = S.card.a2; }
  const upd = () => { $('#wPreview').innerHTML = letterHTML(letterData()); };
  f.oninput = upd; upd();
  $('#wRead').onclick = () => speak(letterText(letterData()).map(l => l[1]).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = letterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.name) || !/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.me)) { toast('내 이름과 친구 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if (c.s1 === c.s2) { toast('증상 두 가지를 서로 다르게 골라 주세요.'); return; }
    if (c.a1 === c.a2) { toast('조언 두 가지를 서로 다르게 골라 주세요.'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).map(l => l[1]).join(' '), '나');
    await say('Judy', 'Great writing! I hope your friend feels better.', '멋진 글이야! 친구가 빨리 낫길 바라.');
    nextStage(); showEnd();
  };
}
function letterData() { return { me: $('#wMe').value.trim(), name: $('#wName').value.trim(), s1: $('#wS1').value, s2: $('#wS2').value, a1: +$('#wA1').value, a2: +$('#wA2').value }; }
function letterText(c) {
  const me = c.me || '____', fr = c.name || '____';
  const a1 = L.writeAdvice[c.a1][0], a2 = L.writeAdvice[c.a2][0];
  const adv = a1.charAt(0).toUpperCase() + a1.slice(1) + ' and ' + a2.charAt(0).toLowerCase() + a2.slice(1) + '.';
  return [[me, `Hi, ${fr}. Are you okay?`], [fr, "No, I'm not. I don't feel well."], [me, "What's wrong?"], [fr, `I have a ${c.s1}. I have a ${c.s2}, too.`], [me, `That's too bad. ${adv} Don't go outside today.`], [fr, `Okay. Thanks, ${me}.`]];
}
function letterHTML(c) {
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  return '<div class="cardPrev">' + letterText(c).map(l => `<div><b style="color:var(--accent)">${esc(l[0])}</b> ${esc(l[1])}</div>`).join('') + '</div>';
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>st 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · st 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? letterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? letterText(S.card).map(l => l[0] + ': ' + l[1]).join(' ') : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 st 코인 ----
const TH_SPOTS = [[-38, 14], [38, -32], [-20, -42], [36, 40], [-36, -36], [-38, 30]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('st', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('st', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Stella');
      toast(`🪙 st 코인: <b>${w.replace('st', '<u>st</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 st 코인을 모두 모았어요! I have a stomachache. Get some rest.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Stella', "Hi! I'm Stella. I have a stomachache. Get some rest.", '안녕! 나는 Stella야. 배가 아파. 좀 쉬렴.');
  await say('Stella', 'Listen: stomachache, rest, Stella. st, st, st!', 'Sounds and Letters · st 소리를 들어 보세요.');
  await say('', '', `🪙 공원 구석구석에 숨은 st 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
