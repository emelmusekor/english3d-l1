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
const SAVE_KEY = 'english3d_l2_v1';
const fresh = () => ({ v: 1, stage: 0, stars: 0, correct: 0, tries: 0, streak: 0, best: 0, th: [], card: null, koHelp: true, rate: 0.9 });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) S = Object.assign(fresh(), s); } catch (e) {}
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };

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
  Server: [0, 1.0], Rani: [1, 1.4], "Rani's mom": [1, 1.05], Hajun: [0, 1.15], "Hajun's mom": [1, 1.0], Olivia: [1, 1.3],
  "Olivia's dad": [0, 0.85], "Olivia's mom": [1, 1.05], 'Café Server': [1, 1.15], 'Chef Joy': [1, 1.1], 'Ice Cream Man': [0, 0.95],
  Baker: [1, 1.2], Jiho: [0, 1.1], Charlie: [0, 1.2], Cat: [1, 1.6], Narrator: [1, 1.0], Emma: [1, 1.45], Sam: [0, 1.2], Lily: [1, 1.35], Ben: [0, 1.15], '나': [0, 1.0]
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

// ---------------- 세계 만들기 (Lesson 2 · Yummy Town) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const FK = Object.fromEntries(L.foods.map(f => [f.id, f]));
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8bc66a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const plaza = new THREE.Mesh(new THREE.PlaneGeometry(56, 74), mat(0xeadfca)); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.01, 4); scene.add(plaza);
// 바둑판 무늬 길
for (let i = -3; i <= 3; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(56, 0.15), mat(0xd9ccb2)); s.rotation.x = -Math.PI / 2; s.position.set(0, 0.015, 4 + i * 10); scene.add(s); }
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0xe76f51, -4, 2, FEN); solid(1, 4, 1, 0xe76f51, 4, 2, FEN);
const gateSign = textPlane('Yummy Town', 1.1, { fs: 64, bg: '#e76f51', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const c = ball(1.5 * s, 0x4caf50, x, 3 * s, z); c.scale.y = 1.2;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -43, 1); tree(-43, i, 1.1); tree(43, i + 3, 1); }
for (const x of [-38, -14, 14, 38]) tree(x, 42, 0.9);
// 분수
cyl(3, 3.2, 0.8, 0xb0bec5, 0, 0.4, 6, scene, 24); cyl(2.6, 2.6, 0.82, 0x64b5f6, 0, 0.42, 6, scene, 24); cyl(0.4, 0.5, 2.2, 0xcfd8dc, 0, 1.1, 6); ball(0.6, 0x90caf9, 0, 2.4, 6);
block(-3, 3, 3, 9);

// ---------- 음식 모형 ----------
const glassMat = (c) => new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity: 0.75 });
function plate(g, r = 0.32) { cyl(r, r * 0.85, 0.04, 0xffffff, 0, 0.02, 0, g, 20); }
function foodModel(id) {
  const g = new THREE.Group();
  if (id === 'beef steak') { plate(g); const m = box(0.36, 0.08, 0.24, 0x7b3f1d, 0, 0.08, 0, g); m.rotation.y = 0.3; ball(0.05, 0x4caf50, 0.17, 0.08, 0.12, g); ball(0.05, 0xff9800, 0.2, 0.07, -0.05, g); }
  else if (id === 'potato pizza' || id === 'cheese pizza') {
    cyl(0.32, 0.32, 0.05, 0xd49a3a, 0, 0.03, 0, g, 20); cyl(0.28, 0.28, 0.02, id === 'cheese pizza' ? 0xffd54f : 0xffe0a0, 0, 0.065, 0, g, 20);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; ball(0.045, id === 'cheese pizza' ? 0xd84315 : 0xf2c14e, Math.cos(a) * 0.17, 0.08, Math.sin(a) * 0.17, g); }
  }
  else if (id === 'chicken sandwich') { box(0.34, 0.06, 0.26, 0xe0b070, 0, 0.04, 0, g); box(0.38, 0.03, 0.3, 0x7cb342, 0, 0.085, 0, g); box(0.32, 0.06, 0.24, 0xc77c3a, 0, 0.12, 0, g); box(0.36, 0.02, 0.28, 0xe53935, 0, 0.16, 0, g); box(0.34, 0.06, 0.26, 0xe0b070, 0, 0.2, 0, g); }
  else if (id === 'tomato spaghetti') { plate(g); cyl(0.22, 0.24, 0.07, 0xf3d27a, 0, 0.06, 0, g, 16); const s = ball(0.15, 0xd84315, 0, 0.1, 0, g); s.scale.y = 0.45; }
  else if (id === 'fruit salad') {
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    bowl.position.y = 0.26; g.add(bowl);
    const cs = [0xe53935, 0xfdd835, 0x43a047, 0xfb8c00, 0x8e24aa, 0xff80ab];
    for (let i = 0; i < 9; i++) { const a = i * 0.7; ball(0.06, cs[i % 6], Math.cos(a) * 0.12, 0.24 + (i % 3) * 0.02, Math.sin(a) * 0.12, g); }
  }
  else if (id === 'lemon juice' || id === 'milk') {
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.32, 14), glassMat(id === 'milk' ? 0xffffff : 0xffeb3b)); gl.position.y = 0.16; g.add(gl);
    if (id === 'lemon juice') { const sl = cyl(0.07, 0.07, 0.02, 0xfff176, 0.08, 0.32, 0, g, 12); sl.rotation.z = 1.2; cyl(0.01, 0.01, 0.4, 0xff4081, -0.03, 0.3, 0, g).rotation.z = 0.25; }
  }
  else if (id === 'ice cream') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 12), mat(0xd7a35a)); c.rotation.x = Math.PI; c.position.y = 0.15; g.add(c); ball(0.11, 0xff9ec7, 0, 0.33, 0, g); ball(0.1, 0xfff3c4, 0, 0.45, 0, g); }
  else if (id === 'chocolate cake') { plate(g); cyl(0.2, 0.2, 0.2, 0x5d4037, 0, 0.13, 0, g, 18); cyl(0.205, 0.205, 0.04, 0xf8bbd0, 0, 0.25, 0, g, 18); ball(0.045, 0xd50000, 0, 0.3, 0, g); }
  else if (id === 'fish and chips') { box(0.36, 0.1, 0.26, 0xd32f2f, 0, 0.05, 0, g); for (let i = 0; i < 7; i++) box(0.04, 0.2, 0.04, 0xffd54f, -0.13 + i * 0.045, 0.16, -0.05 + (i % 2) * 0.04, g); box(0.2, 0.08, 0.12, 0xc58b3a, 0.05, 0.14, 0.08, g); }
  else if (id === 'lemon candy') { for (let i = 0; i < 5; i++) ball(0.06, 0xffee58, Math.cos(i * 1.3) * 0.1, 0.06, Math.sin(i * 1.3) * 0.1, g); }
  return g;
}
let decor = [];
function addDecor(o) { scene.add(o); decor.push(o); return o; }
function clearDecor() { decor.forEach(o => scene.remove(o)); decor = []; }
function table(x, z, r = 0.8) {
  cyl(r, r, 0.06, 0xffffff, x, 0.78, z, scene, 18); cyl(0.07, 0.07, 0.78, 0x777777, x, 0.39, z);
  block(x - r * 0.8, z - r * 0.8, x + r * 0.8, z + r * 0.8);
}
function umbrella(x, z, c) { cyl(0.04, 0.04, 2.4, 0x666666, x, 1.2, z); const u = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 10), mat(c)); u.position.set(x, 2.5, z); scene.add(u); }

// ---------- 북쪽: 음식 가게 6곳 ----------
const stallInfo = {};
const STALL_C = [0xff6b6b, 0xffa94d, 0xffd43b, 0x69db7c, 0x4dabf7, 0xb197fc];
L.stallOrder.forEach((f, i) => {
  const cx = -27 + 9 * i + 4.5;
  stallInfo[f] = { cx };
  solid(9, 3.6, 0.4, 0xfff4e6, cx, 1.8, -38);
  solid(0.4, 3.6, 7, 0xfff4e6, cx - 4.4, 1.8, -34.5); solid(0.4, 3.6, 7, 0xfff4e6, cx + 4.4, 1.8, -34.5);
  solid(6.5, 1.05, 0.9, 0xffffff, cx, 0.52, -31.5);
  box(6.6, 0.08, 1.0, STALL_C[i], cx, 1.08, -31.5);
  for (let k = 0; k < 6; k++) box(1.5, 0.12, 2, k % 2 ? 0xffffff : STALL_C[i], cx - 3.75 + k * 1.5, 3.7, -31.3).rotation.x = -0.35;
  box(9, 0.3, 7.5, 0xf1f3f5, cx, 3.75, -34.6);
  const fm = foodModel(f); fm.scale.setScalar(2.4); fm.position.set(cx, 1.12, -31.5); scene.add(fm);
  for (const dx of [-2.2, 2.2]) { const s = foodModel(f); s.scale.setScalar(1.3); s.position.set(cx + dx, 1.12, -31.6); scene.add(s); }
  const sign = textPlane(f, 0.7, { fs: 64, bg: '#ffffff', fg: '#c2410c', border: '#c2410c', minW: 480 }); sign.position.set(cx, 4.35, -30.75);
  zone('stall', f, cx - 4, -30.9, cx + 4, -27.2);
});
const fcSign = textPlane('FOOD STREET', 0.8, { fs: 64, bg: '#2b2d42', fg: '#ffd166' }); fcSign.position.set(0, 5.5, -38.2);

// ---------- 서쪽: Joy's Restaurant ----------
const JOY = { x: -27, z: -2 };
solid(0.4, 4, 20, 0xffe3e3, -34, 2, -2);
solid(14, 4, 0.4, 0xffe3e3, -27, 2, -12); solid(14, 4, 0.4, 0xffe3e3, -27, 2, 8);
solid(0.5, 4, 0.5, 0xc92a2a, -20.2, 2, -11.8); solid(0.5, 4, 0.5, 0xc92a2a, -20.2, 2, 7.8);
box(14.6, 0.4, 20.6, 0xc92a2a, -27, 4.2, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xf8f0e3)); fl.rotation.x = -Math.PI / 2; fl.position.set(-27, 0.02, -2); scene.add(fl); }
{ const s = textPlane("Joy's Restaurant", 1.0, { fs: 64, bg: '#c92a2a', fg: '#fff' }); s.position.set(-19.9, 4.9, -2); s.rotation.y = Math.PI / 2; }
table(-29, -6); table(-29, 2); table(-30, 6); table(-30, -10);
box(0.8, 1.1, 5, 0x8d6e63, -33, 0.55, -2); // 카운터
{ const m = textPlane('MENU', 0.5, { fs: 56, bg: '#2b2d42', fg: '#fff' }); m.position.set(-33.75, 2.6, -2); m.rotation.y = Math.PI / 2; }

// ---------- 동쪽: Airport Café + 비행기 + ARRIVALS ----------
const CAFE = { x: 27, z: -2 };
solid(0.4, 4, 20, 0xe7f5ff, 34, 2, -2);
solid(14, 4, 0.4, 0xe7f5ff, 27, 2, -12); solid(14, 4, 0.4, 0xe7f5ff, 27, 2, 8);
solid(0.5, 4, 0.5, 0x1c7ed6, 20.2, 2, -11.8); solid(0.5, 4, 0.5, 0x1c7ed6, 20.2, 2, 7.8);
box(14.6, 0.4, 20.6, 0x1c7ed6, 27, 4.2, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xe9ecef)); fl.rotation.x = -Math.PI / 2; fl.position.set(27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('✈ Airport Café', 1.0, { fs: 64, bg: '#1c7ed6', fg: '#fff' }); s.position.set(19.9, 4.9, -2); s.rotation.y = -Math.PI / 2; }
table(29, 0); table(30, -7); table(30, 5);
box(0.8, 1.1, 5, 0x495057, 33, 0.55, -2);
(function plane() {
  const g = new THREE.Group();
  const body = cyl(0.9, 0.9, 9, 0xffffff, 0, 0, 0, g, 16); body.rotation.z = Math.PI / 2;
  const nose = ball(0.9, 0xffffff, 4.5, 0, 0, g); nose.scale.x = 1.4;
  box(2.2, 0.15, 9, 0xadb5bd, 0.5, -0.2, 0, g); box(1.2, 1.8, 0.15, 0x1c7ed6, -4.2, 1.1, 0, g); box(1, 0.1, 3, 0xadb5bd, -4.2, 0.2, 0, g);
  for (let i = -3; i <= 3; i++) ball(0.18, 0x74c0fc, i, 0.35, 0.82, g);
  g.position.set(30, 2.4, -24); g.rotation.y = 0.3; scene.add(g);
  block(25, -28, 35, -20);
})();
const ARR = { x: 21, z: -20 };
box(0.4, 3.2, 0.4, 0x495057, ARR.x - 2, 1.6, ARR.z); box(0.4, 3.2, 0.4, 0x495057, ARR.x + 2, 1.6, ARR.z); box(4.4, 0.4, 0.4, 0x495057, ARR.x, 3.3, ARR.z);
{ const s = textPlane('ARRIVALS 🛬', 0.6, { fs: 60, bg: '#ffd43b', fg: '#222' }); s.position.set(ARR.x, 3.9, ARR.z + 0.25); }
{ const s = textPlane('ARRIVALS 🛬', 0.6, { fs: 60, bg: '#ffd43b', fg: '#222' }); s.position.set(ARR.x, 3.9, ARR.z - 0.25); s.rotation.y = Math.PI; }

// ---------- 광장: Taste Test, 아이스크림 카트, 손님 테이블 ----------
const TASTE = { x: 0, z: -16 };
solid(9, 0.8, 1.2, 0xfff3bf, TASTE.x, 0.4, TASTE.z); box(9.2, 0.06, 1.3, 0xf08c00, TASTE.x, 0.82, TASTE.z);
{ const s = textPlane('Taste Test 😋', 0.7, { fs: 60, bg: '#f08c00', fg: '#fff' }); s.position.set(TASTE.x, 2.9, TASTE.z - 1.6); }
cyl(0.05, 0.05, 2.4, 0x666666, TASTE.x - 2.5, 1.2, TASTE.z - 1.6); cyl(0.05, 0.05, 2.4, 0x666666, TASTE.x + 2.5, 1.2, TASTE.z - 1.6);
const ICE = { x: 9, z: 16 };
solid(2.4, 1.1, 1.2, 0xff8fab, ICE.x, 0.55, ICE.z); box(2.5, 0.08, 1.3, 0xffffff, ICE.x, 1.12, ICE.z);
for (const dx of [-0.8, 0, 0.8]) { const ic = foodModel('ice cream'); ic.position.set(ICE.x + dx, 1.15, ICE.z); scene.add(ic); }
{ const u = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.7, 12), mat(0xffc9de)); u.position.set(ICE.x, 3, ICE.z); scene.add(u); cyl(0.05, 0.05, 2.6, 0x888888, ICE.x, 1.6, ICE.z); }
{ const s = textPlane('ICE CREAM 🍦', 0.5, { fs: 56, bg: '#ffffff', fg: '#d6336c' }); s.position.set(ICE.x, 1.7, ICE.z + 0.65); }
const CUST_POS = [[-10, -6], [10, -6], [-12, 22], [12, 24]];
const CUST_TBL = CUST_POS.map(([x, z]) => [x + (x < 0 ? -1.4 : 1.4), z]);
CUST_TBL.forEach(([x, z], i) => { table(x, z, 0.6); umbrella(x, z, [0xff6b6b, 0x4dabf7, 0x69db7c, 0xffd43b][i]); });

// ---------- 남동: Cake House ----------
const CAKE = { x: 26, z: 30 };
box(16, 0.4, 12, 0xffdeeb, CAKE.x, 0.2, CAKE.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, CAKE.x + dx, 2.5, CAKE.z + dz);
{ const r = new THREE.Mesh(new THREE.ConeGeometry(11, 3, 4), mat(0xf783ac)); r.rotation.y = Math.PI / 4; r.position.set(CAKE.x, 6.4, CAKE.z); r.scale.z = 0.75; scene.add(r); }
{ const s = textPlane('Cake House 🎂', 0.9, { fs: 64, bg: '#d6336c', fg: '#fff' }); s.position.set(CAKE.x - 8.2, 4.4, CAKE.z); s.rotation.y = -Math.PI / 2; }
solid(1.2, 1, 7, 0xffffff, CAKE.x + 5.5, 0.9, CAKE.z);
for (let i = 0; i < 4; i++) { const c = foodModel(i % 2 ? 'chocolate cake' : 'ice cream'); c.scale.setScalar(1.4); c.position.set(CAKE.x + 5.5, 1.4, CAKE.z - 2.6 + i * 1.75); scene.add(c); }
table(CAKE.x, CAKE.z + 1);

// ---------- 남서: Comic Corner ----------
const COMIC = { x: -26, z: 30 };
box(16, 0.4, 12, 0xd0ebff, COMIC.x, 0.2, COMIC.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, COMIC.x + dx, 2.5, COMIC.z + dz);
box(17, 0.4, 13, 0x5f3dc4, COMIC.x, 5.2, COMIC.z);
{ const s = textPlane("Let's Write · Comic Corner", 0.85, { fs: 62, bg: '#5f3dc4', fg: '#fff' }); s.position.set(COMIC.x + 8.6, 4.4, COMIC.z); s.rotation.y = Math.PI / 2; }
solid(0.4, 3.4, 10, 0xf8f9fa, COMIC.x - 7.6, 2, COMIC.z);
['🍕', '🥤', '😋'].forEach((e, i) => { const p = textPlane(e, 1.4, { fs: 110, bg: '#ffffff', border: '#5f3dc4' }); p.position.set(COMIC.x - 7.35, 2.4, COMIC.z - 3 + i * 3); p.rotation.y = Math.PI / 2; });
solid(2, 0.9, 1.2, 0xdeb887, COMIC.x - 1, 0.85, COMIC.z);

// ---------- 비 ----------
const RN = 1400, rainGeo = new THREE.BufferGeometry(), rp = new Float32Array(RN * 3);
for (let i = 0; i < RN; i++) { rp[i * 3] = Math.random() * 60 - 30; rp[i * 3 + 1] = Math.random() * 20; rp[i * 3 + 2] = Math.random() * 60 - 30; }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xc5d8ff, size: 0.12 }));
rain.visible = false; scene.add(rain);
function setRain(on) { rain.visible = on; const c = on ? 0x8e9aa6 : 0xbfe6ff; scene.background.set(c); scene.fog.color.set(c); }

// ---------- 들고 있는 음식 (화면 오른쪽 아래) ----------
scene.add(camera);
let heldMesh = null, heldMeshFood = null, fallers = [];
function heldSync() {
  const f = held && held.kind === 'food' ? held.food : null;
  if (f === heldMeshFood) return;
  if (heldMesh) { camera.remove(heldMesh); heldMesh = null; }
  heldMeshFood = f;
  if (f) { heldMesh = foodModel(f); heldMesh.scale.setScalar(0.9); heldMesh.position.set(0.34, -0.45, -0.8); camera.add(heldMesh); }
}
function setHeldFood(f) { held = { kind: 'food', food: f, label: `${FK[f].emoji} ${f}` }; refreshHUD(); }
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  if (rain.visible) {
    const a = rainGeo.attributes.position.array;
    for (let i = 0; i < RN; i++) { a[i * 3 + 1] -= dt * 18; if (a[i * 3 + 1] < 0) a[i * 3 + 1] += 20; }
    rainGeo.attributes.position.needsUpdate = true; rain.position.set(P.x, 0, P.z);
  }
  for (const f of fallers) { if (f.position.y > 0.12) { f.userData.vy -= 9.8 * dt; f.position.y = Math.max(0.12, f.position.y + f.userData.vy * dt); } }
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.fillStyle = '#eadfca'; mctx.fillRect(tx(-28), tz(-33), 56 * s, 74 * s);
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, -34.5, 54, 7, '#e8590c', '음식 가게'); R(-27, -2, 14, 20, '#c92a2a', '레스토랑'); R(27, -2, 14, 20, '#1c7ed6', '카페');
  R(CAKE.x, CAKE.z, 16, 12, '#d6336c', '케이크'); R(COMIC.x, COMIC.z, 16, 12, '#5f3dc4', '만화'); R(TASTE.x, TASTE.z, 9, 1.5, '#f08c00');
  R(30, -24, 10, 3, '#adb5bd'); R(ICE.x, ICE.z, 2.4, 1.2, '#ff8fab');
  mctx.fillStyle = '#64b5f6'; mctx.beginPath(); mctx.arc(tx(0), tz(6), 3 * s, 0, 7); mctx.fill();
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
function addCat(id, x, z) {
  const g = new THREE.Group(), c = 0xf4a742;
  box(0.3, 0.28, 0.55, c, 0, 0.32, 0, g); ball(0.18, c, 0, 0.55, 0.32, g);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.13, 6), mat(c)); e.position.set(s * 0.09, 0.73, 0.3); g.add(e);
    ball(0.03, 0x111111, s * 0.07, 0.59, 0.47, g);
    for (const k of [-1, 1]) { const w = box(0.14, 0.008, 0.008, 0x333333, s * 0.12, 0.52 + k * 0.02, 0.45, g); w.rotation.z = k * 0.15 * s; }
  }
  ball(0.025, 0xff8a80, 0, 0.54, 0.5, g);
  for (const [x2, z2] of [[-0.1, -0.2], [0.1, -0.2], [-0.1, 0.2], [0.1, 0.2]]) box(0.08, 0.2, 0.08, c, x2, 0.1, z2, g);
  const tail = cyl(0.03, 0.03, 0.45, c, 0, 0.55, -0.38, g); tail.rotation.x = -0.6;
  for (let i = 0; i < 3; i++) box(0.31, 0.29, 0.05, 0xd9822b, 0, 0.32, -0.15 + i * 0.15, g);
  const tag = textSprite('Cat', 0.3, { fs: 48, fg: '#1d3557' }); tag.position.y = 1.0; g.add(tag);
  const mk = textSprite('!', 0.45, { fs: 70, bg: '#ffd43b', fg: '#c92a2a', border: '#c92a2a', pad: 18 });
  mk.visible = false; mk.userData.baseY = 1.4; mk.position.y = 1.4; g.add(mk); g.userData.mark = mk;
  g.position.set(x, 0, z); scene.add(g);
  NPC[id] = { id, name: 'Cat', g, home: [x, z, 0], idle: ["I'm a happy cat.", '나는 행복한 고양이야.'], talk: null, follow: false };
}
// 집 위치 (resetWorld 때 돌아감) [x, z, 바라보는 방향]
const HOME = {
  server: [-22.5, 3.5, Math.PI / 2],
  rani: [-27.4, -5.2, Math.PI / 2], raniMom: [-27.4, -6.9, Math.PI / 2],
  hajun: [-27.4, 2.8, Math.PI / 2], hajunMom: [-27.4, 1.1, Math.PI / 2],
  olivia: [27.4, -0.8, -Math.PI / 2], oliviaDad: [27.4, 0.9, -Math.PI / 2], oliviaMom: [ARR.x, ARR.z - 1.5, 0],
  cafeServer: [31.8, -2, -Math.PI / 2],
  chef: [TASTE.x, TASTE.z - 1.5, 0],
  icecream: [ICE.x, ICE.z - 1.2, 0],
  baker: [CAKE.x + 4.4, CAKE.z, -Math.PI / 2],
  jiho: [COMIC.x + 1, COMIC.z + 1.6, Math.PI / 2],
  cat: [3, 34, Math.PI],
  bonus: [-14, -22, 0]
};
L.customers.forEach((c, i) => { HOME[c.id] = [...CUST_POS[i], 0]; });
const TBL = { rani: [-29, -6], hajun: [-29, 2], olivia: [29, 0], cat: [-30, 6], catCake: [CAKE.x, CAKE.z + 1] };
L.customers.forEach((c, i) => { TBL[c.id] = CUST_TBL[i]; });

addNPC('server', { name: 'Server', shirt: 0x212529, hair: 0x3b2a1a, idle: ["Welcome to Joy's Restaurant!", 'Joy’s Restaurant에 오신 걸 환영해요!'] }, ...HOME.server);
addNPC('rani', { name: 'Rani', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ['A beef steak, please.', '소고기 스테이크 주세요.'] }, ...HOME.rani);
addNPC('raniMom', { name: "Rani's mom", girl: true, shirt: 0x7048e8, skirt: 0x5f3dc4, hair: 0x1b1b1b, scale: 1.12, idle: ["I'd like to have a tomato spaghetti, please.", '토마토 스파게티 주세요.'] }, ...HOME.raniMom);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ["I'd like to have a potato pizza, please.", '감자 피자 주세요.'] }, ...HOME.hajun);
addNPC('hajunMom', { name: "Hajun's mom", girl: true, shirt: 0x0ca678, skirt: 0x087f5b, hair: 0x3b2a1a, scale: 1.12, idle: ["I'd like to have a fruit salad, please.", '과일 샐러드 주세요.'] }, ...HOME.hajunMom);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ["It's hot!", '매워요!'] }, ...HOME.olivia);
addNPC('oliviaDad', { name: "Olivia's dad", shirt: 0x1971c2, hair: 0x6d4c41, scale: 1.18, idle: ['Fish and chips, please.', '피시 앤드 칩스 주세요.'] }, ...HOME.oliviaDad);
addNPC('oliviaMom', { name: "Olivia's mom", girl: true, shirt: 0xe64980, skirt: 0xa61e4d, hair: 0xd4a017, scale: 1.12, idle: ['This is for you.', '이건 너를 위한 거야.'] }, ...HOME.oliviaMom);
addNPC('cafeServer', { name: 'Café Server', girl: true, shirt: 0x1c7ed6, hair: 0x222222, idle: ['Hello! What would you like to have?', '안녕하세요! 무엇을 드시겠어요?'] }, ...HOME.cafeServer);
addNPC('chef', { name: 'Chef Joy', girl: true, shirt: 0xffffff, skirt: 0xdee2e6, hair: 0x3b2a1a, hat: true, scale: 1.1, idle: ["How's your food?", '음식 맛이 어때?'] }, ...HOME.chef);
addNPC('icecream', { name: 'Ice Cream Man', shirt: 0xff8fab, hair: 0x222222, idle: ['What would you like to have?', '무엇을 먹고 싶니?'] }, ...HOME.icecream);
addNPC('baker', { name: 'Baker', girl: true, shirt: 0xf783ac, hair: 0xa0522d, hat: true, idle: ['Welcome to Cake House!', 'Cake House에 온 걸 환영해!'] }, ...HOME.baker);
addNPC('jiho', { name: 'Jiho', shirt: 0x00897b, hair: 0x111111, idle: ["I'd like to have a lemon juice, too.", '레몬주스도 주세요.'] }, ...HOME.jiho);
addNPC('bonus', { name: 'Charlie', shirt: 0x8e24aa, hair: 0xc0392b, idle: ["I'm Charlie. I'd like to have a chicken sandwich, please.", '나는 Charlie야. 치킨 샌드위치 주세요.'] }, ...HOME.bonus);
L.customers.forEach((c, i) => addNPC(c.id, { name: c.name, girl: c.girl, shirt: c.shirt, hair: [0x3b2a1a, 0x111111, 0xa0522d, 0x222222][i], scale: 0.9, idle: [`I'd like to have a ${c.food}, please.`, `${FK[c.food].ko} 주세요.`] }, ...HOME[c.id]));
addCat('cat', HOME.cat[0], HOME.cat[1]);
function placeNPC(id, x, z, face) { const n = NPC[id]; n.g.position.set(x, 0, z); if (face !== undefined) n.g.rotation.y = face; n.home = [x, z, n.g.rotation.y]; n.follow = false; }
function placeFoodAt(tbl, food, k = 0) { const m = foodModel(food); m.position.set(tbl[0] + (k % 2 ? 0.3 : -0.3), 0.81, tbl[1] + (k > 1 ? 0.3 : -0.2)); addDecor(m); return m; }


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
    const right = choices[0];
    const order = o.noShuffle ? choices : shuffle(choices);
    const btns = order.map((c, i) => {
      const b = document.createElement('button'); b.className = 'choice'; if (c === right) b.dataset.r = 1; b.innerHTML = `<span class="num">${i + 1}</span>${c}`;
      b.onclick = () => {
        if (b.disabled) return;
        if (c === right) {
          b.classList.add('right'); btns.forEach(x => x.disabled = true); beep('ok');
          S.tries++; if (first) { S.correct++; S.streak++; S.best = Math.max(S.best, S.streak); addStar(); } save();
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
          if (idx === seq.length) { S.tries++; if (!mistakes) { S.correct++; addStar(2); } save(); beep('star'); setTimeout(res, 900); }
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
const OQ = ['What would you like to have?', "How's your pizza?", 'What grade are you in?', 'What club are you in?'];
const TASTE4 = ['sweet', 'sour', 'salty', 'hot'];
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 식당에 가요', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 주문을 배달해요', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. 맛을 말해요', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 배고픈 고양이', book: 'Before/After You Read', start: stage5 },
  { title: '6. 세 컷 만화 만들기', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {}; setRain(false); fallers = [];
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  NPC.oliviaMom.g.visible = S.stage > 2;
  zoneHandlers.stall = (f) => {
    if (!stageState.pickup) { toast(`🍽 여기는 <b>${f}</b> 가게예요.`); speak(f); return; }
    setHeldFood(f); beep('get'); speak(f); toast(`🍽 <b>${f}</b> 을(를) 들었어요!`);
    if (stageState.onPick) stageState.onPick();
  };
  spawnThCoins();
  refreshHUD();
}
function startStage(i) { S.stage = i; save(); resetWorld(); STAGES[i].start(); refreshHUD(); }
function nextStage() { closeDlg(); beep('star'); const i = S.stage + 1; showBanner(STAGES[S.stage].title + ' 완료!', i < STAGES.length - 1 ? '다음: ' + STAGES[i].title : '모든 미션 완료!'); startStage(i); }
function showBanner(a, b) { const el = $('#banner'); el.innerHTML = `<b>${a}</b><span>${b}</span>`; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
function mark(id, on = true) { NPC[id].g.userData.mark.visible = on; }
function good(n = 1) { S.tries++; S.correct++; addStar(n); beep('star'); save(); }
const dist = (p) => Math.hypot(p[0] - P.x, p[1] - P.z);
function nearestOf(ids) { let best = null, bd = 1e9; for (const id of ids) { const p = NPC[id].g.position, d = dist([p.x, p.z]); if (d < bd) { bd = d; best = [p.x, p.z]; } } return best; }
function nearestItem() { let best = null, bd = 1e9; for (const it of items) { if (!it.alive || it.bonus) continue; const d = dist([it.x, it.z]); if (d < bd) { bd = d; best = [it.x, it.z]; } } return best; }

// 음식 전해 주기 (미션 1·2 공통)
async function deliver(id, food, done) {
  const n = NPC[id];
  if (!held || held.kind !== 'food') { await say(n.name, `I'd like to have a ${food}, please.`, '잘 듣고 가게에서 음식을 가져와요. (🔊 다시 듣기)', { listen: true, koAlways: true }); closeDlg(); return; }
  if (held.food !== food) { beep('bad'); S.tries++; S.streak = 0; save(); await say(n.name, `No, thank you. I'd like to have a ${food}, please.`, '주문한 음식이 아니래요. 다시 들어 보세요.', { listen: true, koAlways: true }); closeDlg(); return; }
  held = null; refreshHUD(); good(); mark(id, false);
  placeFoodAt(TBL[id] || [n.g.position.x, n.g.position.z], food);
  await say(n.name, 'Thank you!', '고마워요!'); closeDlg();
  done();
}

// ---- 1. Fun Talk 1 ----
function stage1() {
  setObj("🍽 서쪽 <b>Joy's Restaurant</b>의 <b>Server</b>에게 말을 걸어요", () => [NPC.server.g.position.x, NPC.server.g.position.z]);
  mark('server');
  NPC.server.talk = async () => {
    mark('server', false); NPC.server.talk = null;
    await say('Server', 'Hello! Good afternoon.', '안녕하세요! 좋은 오후예요.');
    await say("Rani's mom", 'Good afternoon.', '안녕하세요.');
    await ask('나', '점원을 도와 Rani네 가족에게 무엇을 먹고 싶은지 물어보세요.', '알맞은 질문을 고르세요.', OQ, { me: true, hint: 'would like to have = 먹고 싶다' });
    await say("Rani's mom", "I'd like to have a tomato spaghetti, please. How about you, Rani?", '토마토 스파게티 주세요. 너는, Rani?', { listen: true });
    await say('Rani', 'A beef steak, please.', '소고기 스테이크 주세요.', { listen: true });
    await ask('', 'Rani would like to have a ______.', 'Rani는 무엇을 주문했나요?', ['beef steak', 'tomato spaghetti', 'potato pizza', 'fruit salad'], { hint: '🔊 다시 듣기를 눌러 보세요.' });
    await say('Hajun', 'Oh, Rani!', '어, Rani!');
    await say('Rani', 'Hello! Good to see you!', '안녕! 만나서 반가워!');
    await ask('나', '하준이네 가족에게도 무엇을 먹고 싶은지 물어보세요.', '알맞은 질문을 고르세요.', OQ, { me: true });
    await say("Hajun's mom", "I'd like to have a fruit salad, please.", '과일 샐러드 주세요.', { listen: true });
    await say('Hajun', "I'd like to have a potato pizza, please.", '감자 피자 주세요.', { listen: true });
    await ask('', 'Hajun would like to have a ______.', '하준이는 무엇을 주문했나요?', ['potato pizza', 'fruit salad', 'beef steak', 'lemon juice']);
    await say('Server', "Oh, I'm so busy! Can you help me?", '아, 너무 바빠요! 도와줄래요?');
    await say('', '', '🍽 북쪽 음식 가게(FOOD STREET)에서 Rani와 하준이가 주문한 음식을 가져다주세요. 가게 앞에 서면 음식을 들어요. 들고 가서 친구에게 말을 걸면 전해 줄 수 있어요.', { btn: '알겠어요!' });
    closeDlg();
    stageState.pickup = true; stageState.got = {};
    stageState.onPick = s1obj;
    for (const [id, f] of [['rani', 'beef steak'], ['hajun', 'potato pizza']]) {
      mark(id);
      NPC[id].talk = async () => { if (stageState.got[id]) { await say(NPC[id].name, 'Yummy!', '맛있어!'); closeDlg(); return; } await deliver(id, f, () => { stageState.got[id] = 1; s1obj(); }); };
    }
    s1obj();
  };
}
function s1obj() {
  const n = Object.keys(stageState.got).length;
  if (n >= 2) return s1IceCream();
  if (held) setObj(`🍽 <b>${held.food}</b> 을(를) 주문한 친구에게 가져다줘요 (${n}/2)`, () => nearestOf(['rani', 'hajun'].filter(i => !stageState.got[i])));
  else setObj(`🍽 북쪽 음식 가게에서 Rani와 하준이가 주문한 음식을 가져와요 (${n}/2)`, () => [0, -28.5]);
}
function s1IceCream() {
  stageState.pickup = false;
  setObj('🍦 Rani에게 말을 걸어 보세요', () => [NPC.rani.g.position.x, NPC.rani.g.position.z]); mark('rani');
  NPC.hajun.talk = null;
  NPC.rani.talk = async () => {
    mark('rani', false); NPC.rani.talk = null;
    await say('Rani', "Hajun, let's have some ice cream after lunch.", '하준아, 점심 먹고 아이스크림 먹자.');
    await say('Hajun', 'Sounds good.', '좋아.');
    closeDlg();
    placeNPC('rani', ICE.x - 2.4, ICE.z - 3.4, Math.PI); placeNPC('hajun', ICE.x + 2.4, ICE.z - 3.4, Math.PI);
    setObj('🍦 분수 옆 <b>아이스크림 가게</b>로 가요', () => [ICE.x, ICE.z - 2]); mark('icecream');
    NPC.icecream.talk = async () => {
      mark('icecream', false); NPC.icecream.talk = null;
      await say('Ice Cream Man', 'Hello! What would you like to have?', '안녕! 무엇을 먹고 싶니?');
      await ask('나', '아이스크림을 주문해 보세요.', '알맞은 문장을 고르세요.', ["I'd like to have some ice cream, please.", "How's your ice cream?", "It's ice cream.", 'What would you like to have?'], { me: true });
      await say('Ice Cream Man', 'Here you are.', '여기 있어.');
      await say('Hajun', 'Thank you. Uh-oh!', '고맙습니다. 어어!');
      const ic = foodModel('ice cream'); const p = NPC.hajun.g.position; ic.position.set(p.x + 0.4, 1.3, p.z + 0.4); ic.rotation.z = 2.4; ic.userData.vy = 0; addDecor(ic); fallers.push(ic);
      await say('', '', '앗! 하준이의 아이스크림이 바닥에 떨어졌어요. 🍦💦', { btn: '다음 미션 ▶' });
      nextStage();
    };
  };
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  placeNPC('server', 0, -24, 0);
  setObj('🧑‍🍳 음식 가게 앞의 <b>Server</b>에게 가요', () => [0, -24]); mark('server');
  NPC.server.talk = async () => {
    mark('server', false); NPC.server.talk = null;
    await say('Server', 'Thank you for your help! Our customers are hungry.', '도와줘서 고마워요! 손님들이 배가 고파요.');
    await say('', '', '광장의 손님 4명에게 무엇을 먹고 싶은지 묻고, 잘 듣고, 가게에서 알맞은 음식을 가져다주세요.', { btn: '시작!' });
    closeDlg();
    stageState.got = {}; stageState.asked = {}; stageState.pickup = true; stageState.onPick = s2obj;
    L.customers.forEach(c => {
      mark(c.id);
      NPC[c.id].talk = async () => {
        if (stageState.got[c.id]) { await say(c.name, 'Yummy! Thank you!', '맛있어! 고마워!'); closeDlg(); return; }
        if (!stageState.asked[c.id]) {
          await say(c.name, 'Hello!', '안녕하세요!');
          await ask('나', `${c.name}에게 무엇을 먹고 싶은지 물어보세요.`, '알맞은 질문을 고르세요.', OQ, { me: true });
          await say(c.name, `I'd like to have a ${c.food}, please.`, '잘 듣고 기억하세요! (🔊 다시 듣기)', { listen: true, koAlways: true });
          stageState.asked[c.id] = 1; closeDlg(); s2obj(); return;
        }
        await deliver(c.id, c.food, () => { stageState.got[c.id] = 1; s2obj(); });
      };
    });
    s2obj();
  };
}
function s2obj() {
  const n = Object.keys(stageState.got).length, left = L.customers.filter(c => !stageState.got[c.id]).map(c => c.id);
  if (n < L.customers.length) {
    if (held) setObj(`🍽 <b>${held.food}</b> 을(를) 주문한 손님에게 가져다줘요 (${n}/4)`, () => nearestOf(left));
    else setObj(`🍽 손님에게 주문을 받고, 가게에서 음식을 가져와요 (${n}/4)`, () => left.some(i => !stageState.asked[i]) ? nearestOf(left.filter(i => !stageState.asked[i])) : [0, -28.5]);
    return;
  }
  stageState.pickup = false;
  setObj('🧑‍🍳 <b>Server</b>에게 돌아가요', () => [0, -24]); mark('server');
  NPC.server.talk = async () => {
    mark('server', false); NPC.server.talk = null;
    await say('Server', "Great job! Let's play a game. Listen and find the same food!", '잘했어요! 놀이를 해요. 잘 듣고 같은 음식을 찾아요!');
    for (const f of L.pt1) {
      const others = shuffle(L.foods.slice(0, 6).map(x => x.id).filter(x => x !== f)).slice(0, 3);
      await ask('Server', `I'd like to have a ${f}, please.`, 'Play Together 1 · 잘 듣고 같은 음식을 고르세요. (🔊 다시 듣기)', [f, ...others].map(x => `${FK[x].emoji} ${x}`), { listen: true, speakQ: true, sayIt: false });
    }
    await say('Server', 'Wonderful! You are a great helper.', '훌륭해요! 최고의 도우미예요.');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Play Together 2 ----
function stage3() {
  setObj('✈ 동쪽 <b>Airport Café</b>의 <b>Olivia</b>에게 가요', () => [NPC.olivia.g.position.x, NPC.olivia.g.position.z]); mark('olivia');
  NPC.olivia.talk = async () => {
    mark('olivia', false); NPC.olivia.talk = null;
    await say("Olivia's dad", "Mom will arrive at one o'clock.", '엄마는 1시에 도착할 거야.');
    await say('Olivia', "Dad, I'm hungry.", '아빠, 배고파요.');
    await say("Olivia's dad", "Okay. Let's go and get some food.", '그래. 가서 음식을 좀 먹자.');
    await say('Café Server', 'Hello! What would you like to have?', '안녕하세요! 무엇을 드시겠어요?');
    await ask('나', 'Olivia가 되어 치킨 샌드위치를 주문해 보세요.', '알맞은 문장을 고르세요.', ["I'd like to have a chicken sandwich, please.", "How's your chicken sandwich?", "It's a chicken sandwich.", "I'm in the chicken club."], { me: true });
    await say("Olivia's dad", 'Fish and chips, please.', '피시 앤드 칩스 주세요.');
    await say('Olivia', 'Dad, I want to have some milk, too.', '아빠, 우유도 마시고 싶어요.');
    await say("Olivia's dad", 'Okay. A lemon juice and milk, please.', '그래. 레몬주스랑 우유 주세요.');
    ['chicken sandwich', 'fish and chips', 'lemon juice', 'milk'].forEach((f, k) => placeFoodAt(TBL.olivia, f, k));
    await say("Olivia's dad", "Olivia, how's your sandwich?", 'Olivia, 샌드위치 어떠니?');
    await ask('나', 'Olivia가 되어 대답해요. 🥪🥵 혀가 화끈화끈!', '샌드위치 맛을 고르세요.', ["It's hot.", "It's sweet.", "It's sour.", "It's salty."], { me: true, hint: 'hot = 매운' });
    await say('Olivia', 'Can I have your lemon juice?', '아빠 레몬주스 마셔도 돼요?');
    await say("Olivia's dad", 'Sure, go ahead.', '물론이지, 마시렴.');
    await say('Olivia', "Oh, it's sour!", '앗, 셔요!', { listen: true });
    await ask('', 'How is the lemon juice?', '레몬주스 맛은 어땠나요?', ['sour', 'sweet', 'hot', 'salty']);
    await say('', '', "🕐 1시가 되었어요! Olivia와 아빠를 따라 ARRIVALS(도착 문)로 가서 엄마를 만나요.", { btn: '가자!' });
    closeDlg();
    NPC.oliviaMom.g.visible = true;
    placeNPC('olivia', ARR.x - 1.2, ARR.z + 2, Math.PI); placeNPC('oliviaDad', ARR.x + 1.2, ARR.z + 2, Math.PI);
    setObj("🛬 <b>ARRIVALS</b>에서 <b>Olivia's mom</b>을 만나요", () => [ARR.x, ARR.z - 1.5]); mark('oliviaMom');
    NPC.oliviaMom.talk = async () => {
      mark('oliviaMom', false); NPC.oliviaMom.talk = null;
      await say("Olivia's mom", 'This is for you.', '이건 너를 위한 거야.');
      const c = foodModel('lemon candy'); c.position.set(ARR.x, 1.1, ARR.z - 0.8); addDecor(c);
      await say("Olivia's dad", "Oh, they're lemon candies.", '오, 레몬 사탕이네.');
      await say('Olivia', "Oh, it's not sour. It's sweet! Thanks, Mom.", '어, 안 시네. 달아요! 고마워요, 엄마.', { listen: true });
      await ask('', 'How are the lemon candies?', '레몬 사탕의 맛은?', ['sweet', 'sour', 'salty', 'hot']);
      closeDlg(); tasteGame();
    };
  };
}
function tasteGame() {
  setObj('👩‍🍳 광장 북쪽 <b>Taste Test</b>의 <b>Chef Joy</b>에게 가요', () => [TASTE.x, TASTE.z + 1.5]); mark('chef');
  NPC.chef.talk = async () => {
    mark('chef', false); NPC.chef.talk = null;
    await say('Chef Joy', "Let's play a taste game!", '맛 맞히기 놀이를 하자!');
    await say('', '', 'Play Together 2 · 테이블 위 음식 4개에 가까이 가서 하나씩 먹어 보세요. 먹은 뒤 셰프가 맛을 물어보면 영어로 대답해요.', { btn: '먹어 볼게!' });
    closeDlg(); stageState.tasted = 0;
    L.tastes.forEach((t, i) => {
      const g = foodModel(t.food); g.scale.setScalar(1.7);
      const ti = addItem(g, TASTE.x - 3 + i * 2, TASTE.z + 0.2, async (it) => {
        if (busy || performance.now() < it.ready) return;
        removeItem(it); busy = true; beep('get');
        await ask('Chef Joy', `How's your ${t.short}?`, `${t.face}  ${t.cue}`, TASTE4.map(x => `It's ${x}.`).sort((a, b) => (b === `It's ${t.taste}.`) - (a === `It's ${t.taste}.`)), { speakQ: true, me: true, hint: 'sweet 단 · sour 신 · salty 짠 · hot 매운' });
        closeDlg(); busy = false; stageState.tasted++;
        if (stageState.tasted < 4) { setObj(`😋 Taste Test 음식을 먹어 보세요 (${stageState.tasted}/4)`, nearestItem); return; }
        busy = true;
        await say('Chef Joy', 'Wow! You know all the tastes.', '와! 맛을 모두 아는구나.');
        busy = false; nextStage();
      }, { y: 1.0, r: 1.5, spin: 0.6 });
      ti.ready = performance.now() + 1500;
    });
    setObj('😋 Taste Test 음식을 먹어 보세요 (0/4)', nearestItem);
  };
}

// ---- 4. 문장 블록 ----
function stage4() {
  placeNPC('chef', 0, 12.5, Math.PI);
  setObj('⛲ 분수 앞의 <b>Chef Joy</b>에게 가요', () => [0, 12.5]); mark('chef');
  NPC.chef.talk = async () => {
    mark('chef', false); NPC.chef.talk = null;
    await say('Chef Joy', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 보자!');
    await say('', '', '분수 주위에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['What', "How's", 'juice', 'sour', 'like', 'have', 'your', "It's", 'pizza', 'please.'].filter(w => !words.includes(w));
  const extra = shuffle(pool).slice(0, 2);
  stageState.words = words; stageState.wi = 0; stageState.miss = 0;
  const all = shuffle(words.concat(extra));
  all.forEach((w, i) => {
    const a = (i / all.length) * Math.PI * 2 + Math.random() * 0.3, r = 6 + Math.random() * 4;
    const it = addItem(wordCube(w), Math.sin(a) * r, 6 + Math.cos(a) * r, (it) => {
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
  await say('Chef Joy', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. 배고픈 고양이 (Reading) ----
async function readLines(arr) { for (const [who, en, ko] of arr) await say(who, en, ko); }
function stage5() {
  setObj('🐱 교문 근처의 <b>배고픈 고양이</b>에게 가 봐요', () => [NPC.cat.g.position.x, NPC.cat.g.position.z]); mark('cat');
  NPC.cat.talk = async () => {
    mark('cat', false); NPC.cat.talk = null;
    await say('Cat', 'Meow! I\'m hungry.', '야옹! 배고파.');
    await say('', '', "🐱 배고픈 고양이가 Joy's Restaurant로 가요. 따라가 보세요!", { btn: '따라가기' });
    closeDlg();
    placeNPC('cat', -28.6, 6, Math.PI / 2);
    setObj("🐱 고양이를 따라 <b>Joy's Restaurant</b>로 가요", () => [-28.6, 6]); mark('cat');
    NPC.cat.talk = async () => {
      mark('cat', false); NPC.cat.talk = null;
      const R = L.reading.joy;
      await readLines(R.slice(0, 4));
      placeFoodAt(TBL.cat, 'cheese pizza', 0); placeFoodAt(TBL.cat, 'beef steak', 1);
      await readLines(R.slice(4));
      await ask('', "What did the cat have at Joy's Restaurant?", "Joy's Restaurant에서 고양이가 주문한 것은?", ['a cheese pizza and a beef steak', 'a chocolate cake and some ice cream', 'a chicken sandwich and a lemon juice']);
      await ask('', 'The cheese pizza was ______ but delicious.', '치즈 피자의 맛은?', ['salty', 'sweet', 'sour', 'hot']);
      await say('', '', '🌧 며칠 뒤, 비가 오는 날이에요. 고양이가 또 배가 고파요. 남동쪽 Cake House로 가 보세요!', { btn: '가 보자!' });
      closeDlg(); setRain(true);
      placeNPC('cat', CAKE.x - 1.4, CAKE.z + 1, Math.PI / 2);
      setObj('🌧 <b>Cake House</b>(남동쪽)에서 고양이를 찾아요', () => [CAKE.x - 1.4, CAKE.z + 1]); mark('cat');
      NPC.cat.talk = async () => {
        mark('cat', false); NPC.cat.talk = null;
        const C = L.reading.cake;
        await readLines(C.slice(0, 4));
        placeFoodAt(TBL.catCake, 'chocolate cake', 0); placeFoodAt(TBL.catCake, 'ice cream', 1);
        await readLines(C.slice(4));
        await ask('', 'What did the cat have at Cake House?', 'Cake House에서 고양이가 주문한 것은?', ['a chocolate cake and some ice cream', 'a cheese pizza and a beef steak', 'a fruit salad and some milk']);
        await say('', '', 'After You Read · 고양이가 되어 일기를 완성해요.', { btn: '시작' });
        await ask('Cat', "Joy's Restaurant: I had a cheese pizza. I had a beef ______, too.", '빈칸에 알맞은 말', ['steak', 'pizza', 'cake'], { sayIt: false });
        await ask('Cat', 'The cheese pizza was ______ but delicious.', '빈칸에 알맞은 말', ['salty', 'sweet', 'sour'], { sayIt: false });
        await ask('Cat', 'Cake House: I had a chocolate cake. I had some ______ ______, too.', '빈칸에 알맞은 말', ['ice cream', 'lemon juice', 'beef steak'], { sayIt: false });
        await ask('Cat', 'The chocolate cake was ______.', '빈칸에 알맞은 말', ['sweet', 'salty', 'hot'], { sayIt: false });
        speak("I had a chocolate cake. I had some ice cream, too. The chocolate cake was sweet.", 'Cat');
        await say('Cat', "Meow! I'm a happy cat.", '야옹! 나는 행복한 고양이야.');
        setRain(false); nextStage();
      };
    };
  };
}

// ---- 6. Let's Write: 세 컷 만화 ----
function stage6() {
  setObj("✏️ 남서쪽 <b>Comic Corner</b>의 <b>Jiho</b>에게 가요", () => [NPC.jiho.g.position.x, NPC.jiho.g.position.z]); mark('jiho');
  NPC.jiho.talk = async () => {
    mark('jiho', false);
    await say('Jiho', 'Read my comic!', '내 세 컷 만화를 읽어 줘!');
    await readLines(L.comicSample);
    await ask('', "How's the juice in Jiho's comic?", '만화 속 주스의 맛은?', ["It's sour.", "It's sweet.", "It's hot.", "It's salty."]);
    await say('Jiho', 'Now, make your comic!', '이제 너의 세 컷 만화를 만들어 봐!', { btn: '만화 만들기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const opt = (arr) => arr.map((v, i) => `<option value="${i}">${v[0]} (${v[1]})</option>`).join('');
  $('#wF1').innerHTML = opt(L.comicFoods); $('#wF2').innerHTML = opt(L.comicFoods);
  $('#wTaste').innerHTML = L.tasteWords.map(([w, k]) => `<option value="${w}">${w} (${k})</option>`).join('');
  $('#wF1').value = 3; $('#wF2').value = 6; $('#wTaste').value = 'sour';
  if (S.card) { $('#wName').value = S.card.name; $('#wF1').value = S.card.f1; $('#wF2').value = S.card.f2; $('#wTaste').value = S.card.taste; }
  const upd = () => { $('#wPreview').innerHTML = comicHTML(comicData()); };
  f.oninput = upd; upd();
  $('#wRead').onclick = () => speak(comicText(comicData()).map(l => l[1]).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = comicData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.name)) { toast('주문하는 사람 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(comicText(c).map(l => l[1]).join(' '), '나');
    await say('Jiho', 'What a great comic!', '정말 멋진 만화야!');
    nextStage(); showEnd();
  };
}
function comicData() { return { name: $('#wName').value.trim(), f1: +$('#wF1').value, f2: +$('#wF2').value, taste: $('#wTaste').value }; }
function comicText(c) {
  const F1 = L.comicFoods[c.f1], F2 = L.comicFoods[c.f2], nm = c.name || '____';
  return [['Server', 'What would you like to have?'], [nm, `I'd like to have ${F1[0]}, please.`], [nm, `I'd like to have ${F2[0]}, too.`], ['Server', `How's your ${F2[2]}?`], [nm, `It's ${c.taste}.`]];
}
function comicHTML(c) {
  const t = comicText(c), F1 = L.comicFoods[c.f1], F2 = L.comicFoods[c.f2];
  const face = { sweet: '😋', sour: '😖', salty: '🧂', hot: '🥵', delicious: '😍' }[c.taste] || '😋';
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const b = (l) => `<div class="bub"><b>${esc(l[0])}</b> ${esc(l[1])}</div>`;
  return `<div class="comic"><div class="cpanel"><div class="cemo">🧑‍🍳</div>${b(t[0])}</div><div class="cpanel"><div class="cemo">${F1[3]} ${F2[3]}</div>${b(t[1])}${b(t[2])}</div><div class="cpanel"><div class="cemo">${F2[3]}${face}</div>${b(t[3])}${b(t[4])}</div></div>`;
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>ch 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · ch 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? comicHTML(S.card) : '';
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 ch 코인 ----
const TH_SPOTS = [[-38, 14], [38, -32], [0, -42], [36, 40], [-36, -36], [-38, 30]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('ch', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('ch', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Charlie');
      toast(`🪙 ch 코인: <b>${w.replace('ch', '<u>ch</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast("🏅 ch 코인을 모두 모았어요! I'd like to have a chicken sandwich, please.", 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Charlie', "Hi! I'm Charlie. I'd like to have a chicken sandwich, please.", '안녕! 나는 Charlie야. 치킨 샌드위치 주세요.');
  await say('Charlie', 'Listen: chicken, cheese, lunch. ch, ch, ch!', 'Sounds and Letters · ch 소리를 들어 보세요.');
  await say('', '', `🪙 마을 구석구석에 숨은 ch 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
window.__game = { say, ask, tick: (dt) => update(dt, performance.now() / 1000), get S() { return S; }, P, NPC, startStage, items: () => items, zones, stallInfo, TBL, HOME, foodModel, get decor() { return decor; }, get st() { return stageState; }, get held() { return held; }, get busy() { return busy; } };
if (qs.has('autotest')) { const s = document.createElement('script'); s.src = 'autotest.js'; document.body.appendChild(s); }
})();
// 개발용 화면 위치: ?view=x,z,yaw  /  ?dlg=1
(() => { const q = new URLSearchParams(location.search); const G = window.__game; if (q.has('view')) { const [x, z, y] = q.get('view').split(',').map(Number); G.P.x = x; G.P.z = z; G.P.yaw = y; } })();
