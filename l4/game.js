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
const SAVE_KEY = 'english3d_l4_v1';
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
  Joel: [0, 1.15], Nara: [1, 1.35], Hajun: [0, 1.15], Kai: [0, 1.1], 'Ms. Park': [1, 1.1], Dad: [0, 0.85], Olivia: [1, 1.3], Ben: [0, 1.45],
  Erin: [1, 1.35], "Erin's Dad": [0, 0.9], Diego: [0, 1.1], Lucy: [1, 1.35], Kate: [1, 1.3], Nick: [0, 1.15], Jay: [0, 1.2],
  Amy: [1, 1.4], Tom: [0, 1.2], Yuna: [1, 1.3], Leo: [0, 1.1], Narrator: [1, 1.0], '나': [0, 1.0]
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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
// 그래픽 품질: high(그림자·고해상도) / low(가볍게). G 키로 바꿀 수 있고, 느리면 자동으로 low.
const GFX = { high: true, auto: true };
try { const q = new URLSearchParams(location.search).get('gfx') || localStorage.getItem('english3d_gfx'); if (q) { GFX.high = q === 'high'; GFX.auto = false; } } catch (e) {}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, GFX.high ? 1.5 : 1));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = GFX.high; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe6ff);
scene.fog = new THREE.Fog(0xbfe6ff, 55, 160);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 420);
camera.rotation.order = 'YXZ';
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const hemi = new THREE.HemisphereLight(0xe3f2ff, 0xc9bfa4, 1.35); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.0); sun.position.set(30, 50, 20);
sun.castShadow = GFX.high; sun.shadow.mapSize.set(2048, 2048);
{ const c = sun.shadow.camera; c.left = -38; c.right = 38; c.top = 38; c.bottom = -38; c.near = 1; c.far = 150; }
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);
const SUN_DIR = new THREE.Vector3(30, 50, 20).normalize();

const mats = {};
const mat = (c) => mats[c] || (mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0 }));

// ---------- 하늘·구름·먼 언덕 ----------
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x4a90e2) }, bottom: { value: new THREE.Color(0xbfe6ff) } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.7 + 0.04, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.75)), 1.0); }'
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 32, 16), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
const sunDisk = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, 'rgba(255,245,200,.9)'); g.addColorStop(1, 'rgba(255,240,200,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false, depthWrite: false, transparent: true, toneMapped: false }));
  s.scale.set(60, 60, 1); scene.add(s); return s;
})();
const clouds = new THREE.Group(); scene.add(clouds);
{
  const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdde8f5, emissiveIntensity: 0.55, roughness: 1, fog: false });
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2 + Math.random() * 0.3, r = 170 + Math.random() * 90, cl = new THREE.Group();
    for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(7 + Math.random() * 6, 10, 8), cm); b.position.set(k * 8 - 16 + Math.random() * 4, Math.random() * 4, Math.random() * 6); b.scale.y = 0.6; cl.add(b); }
    cl.position.set(Math.cos(a) * r, 60 + Math.random() * 35, Math.sin(a) * r); cl.lookAt(0, cl.position.y, 0); clouds.add(cl);
  }
  clouds.traverse(o => { o.userData.pol = 1; });
}
{
  const hc = [0x6fae55, 0x5f9e4a, 0x7cbc62, 0x86b86a];
  for (let i = 0; i < 30; i++) {
    const a = i / 30 * Math.PI * 2, r = 105 + (i % 3) * 22;
    const h = new THREE.Mesh(new THREE.SphereGeometry(26 + (i * 7) % 18, 14, 10), new THREE.MeshStandardMaterial({ color: hc[i % 4], roughness: 1 }));
    h.position.set(Math.cos(a) * r, -12 - (i % 4) * 3, Math.sin(a) * r); h.scale.set(1.4, 0.75 + (i % 5) * 0.08, 1.2); h.userData.pol = 1; scene.add(h);
  }
}
// 울타리 밖 풀숲
{
  const n = 900, im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.18, 0.55, 5), new THREE.MeshStandardMaterial({ color: 0x5c9e43, roughness: 1 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 48 + Math.random() * 40, k = 0.7 + Math.random() * 0.9; v.set(Math.cos(a) * r, 0.25 * k, Math.sin(a) * r); sc.set(k, k, k); m4.compose(v, q, sc); im.setMatrixAt(i, m4); }
  im.userData.pol = 1; scene.add(im);
}
// 풀밭 무늬 (원래 바닥 색을 바탕으로 만듦)
const grassTex = {};
function grassTexture(hex) {
  if (grassTex[hex]) return grassTex[hex];
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const base = new THREE.Color(hex); x.fillStyle = '#' + base.getHexString(); x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const t = base.clone().offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.14);
    x.fillStyle = '#' + t.getHexString(); x.fillRect(Math.random() * 256, Math.random() * 256, 1.5 + Math.random() * 2.5, 3 + Math.random() * 6);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(48, 48); t.anisotropy = 8;
  return (grassTex[hex] = t);
}
const paveTex = {};
function paveTexture(hex, w, h) {
  const key = hex + '_' + w + '_' + h; if (paveTex[key]) return paveTex[key];
  let t = paveTex['c' + hex];
  if (!t) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const base = new THREE.Color(hex); x.fillStyle = '#' + base.getHexString(); x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 700; i++) { const k = base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.06); x.fillStyle = '#' + k.getHexString(); x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
    if (base.getHSL({}).l > 0.45) { x.strokeStyle = '#' + base.clone().offsetHSL(0, 0, -0.035).getHexString(); x.lineWidth = 2; x.strokeRect(1, 1, 126, 126); }
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; paveTex['c' + hex] = t;
  }
  const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
  return (paveTex[key] = tt);
}
// 장면 다듬기: 그림자 켜기, 글자판은 색 그대로, 큰 바닥에 풀 무늬
function polish(root) {
  root.traverse(o => {
    if (o.userData.pol) return; o.userData.pol = 1;
    if (o.isSprite) { o.material.toneMapped = false; return; }
    if (!o.isMesh || o === sky || o.isInstancedMesh || o.isPoints) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    let basic = false;
    for (const m of ms) if (m.isMeshBasicMaterial) { m.toneMapped = false; basic = true; }
    if (basic) return;
    const g = o.geometry, p = (g && g.parameters) || {};
    const flat = g && g.type === 'PlaneGeometry';
    if (flat && p.width >= 200 && !o.userData.grass && o.material.color && !o.material.map) {
      o.material = new THREE.MeshStandardMaterial({ map: grassTexture(o.material.color.getHex()), roughness: 1 }); o.userData.grass = 1;
    } else if (flat && p.width * p.height >= 300 && o.material.color && !o.material.map && !o.material.transparent && Math.abs(o.rotation.x + Math.PI / 2) < 0.01) {
      o.material = new THREE.MeshStandardMaterial({ map: paveTexture(o.material.color.getHex(), p.width, p.height), roughness: 0.95 });
    }
    o.receiveShadow = true;
    o.castShadow = !flat && !ms[0].transparent && !(p.radius > 20);
  });
}
function setQuality(high, why) {
  GFX.high = high;
  renderer.shadowMap.enabled = high; sun.castShadow = high;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.5 : 1)); resize();
  scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); });
  if (why) try { toast(high ? '🎨 그래픽: 선명하게 (G 키로 바꾸기)' : '🎨 그래픽: 가볍게 (G 키로 바꾸기)'); } catch (e) {}
}
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyG' || (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT'))) return;
  GFX.auto = false; setQuality(!GFX.high, true);
  try { localStorage.setItem('english3d_gfx', GFX.high ? 'high' : 'low'); } catch (er) {}
});
const fogBase = new THREE.Color(), skyTop = new THREE.Color(0x3f86d8), hsl = {};
const perf = { t0: 0, frames: 0, done: false };
let polishT = 1;
function gfxTick(dt, now) {
  sky.position.copy(camera.position);
  fogBase.copy(scene.fog.color); fogBase.getHSL(hsl);
  skyMat.uniforms.bottom.value.copy(fogBase);
  skyMat.uniforms.top.value.copy(fogBase).lerp(skyTop, hsl.s > 0.3 ? 0.55 : 0.15);
  sunDisk.position.copy(camera.position).addScaledVector(SUN_DIR, 300);
  sunDisk.visible = hsl.l > 0.6 && hsl.s > 0.3;
  clouds.rotation.y += dt * 0.004;
  sun.position.set(P.x + SUN_DIR.x * 60, SUN_DIR.y * 60, P.z + SUN_DIR.z * 60); sun.target.position.set(P.x, 0, P.z); sun.target.updateMatrixWorld();
  if ((polishT += dt) > 0.7) { polishT = 0; polish(scene); }
  if (started && GFX.auto && !perf.done) {
    if (!perf.t0) perf.t0 = now;
    perf.frames++;
    if (now - perf.t0 > 5000) { perf.done = true; const fps = perf.frames * 1000 / (now - perf.t0); if (fps < 28 && GFX.high) setQuality(false, true); }
  }
  animatePeople(now / 1000, dt);
}
function animatePeople(t, dt) {
  if (typeof NPC === 'undefined') return;
  for (const n of Object.values(NPC)) {
    const a = n.g.userData.anim; if (!a || !n.g.visible) continue;
    const p = n.g.position, step = a.lx === undefined ? 0 : Math.hypot(p.x - a.lx, p.z - a.lz), moving = step > 0.002 && step < 0.5;
    a.lx = p.x; a.lz = p.z;
    a.walk = moving ? Math.min(1, a.walk + dt * 6) : Math.max(0, a.walk - dt * 4);
    const sw = Math.sin(t * 9 + a.ph) * 0.7 * a.walk, br = Math.sin(t * 2.2 + a.ph);
    a.armL.rotation.x = sw; a.armR.rotation.x = -sw; a.legL.rotation.x = -sw * 0.8; a.legR.rotation.x = sw * 0.8;
    a.armL.rotation.z = 0.1 + (1 - a.walk) * br * 0.03; a.armR.rotation.z = -0.1 - (1 - a.walk) * br * 0.03;
    a.body.scale.set(1, 1 + br * 0.015, 0.85); a.head.position.y = a.hy + br * 0.008;
    const bl = ((t + a.ph) % 4.2) < 0.13 ? 0.15 : 1; a.eyes.forEach(e => { e.scale.y = bl; });
  }
}
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
  const skin = o.skin || 0xf5cfa8, pants = o.pants || 0x2f3e66, hairC = o.hair || 0x3b2a1a;
  const cap = (r, l, c) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), mat(c));
  const legs = [-0.11, 0.11].map(x => {
    const piv = new THREE.Group(); piv.position.set(x, 0.74, 0); g.add(piv);
    const leg = cap(0.085, 0.5, pants); leg.position.y = -0.36; piv.add(leg);
    box(0.16, 0.09, 0.26, 0x2b2b2b, 0, -0.69, 0.04, piv);
    return piv;
  });
  const body = cap(0.26, 0.4, o.shirt); body.position.y = 1.08; body.scale.z = 0.85; g.add(body);
  if (o.girl) { const sk = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 14, 1, true), new THREE.MeshStandardMaterial({ color: o.skirt || o.shirt, roughness: 0.88, side: THREE.DoubleSide })); sk.position.y = 0.72; g.add(sk); }
  cyl(0.07, 0.08, 0.12, skin, 0, 1.47, 0, g);
  const arms = [-1, 1].map(sd => {
    const piv = new THREE.Group(); piv.position.set(sd * 0.33, 1.36, 0); piv.rotation.z = sd * -0.1; g.add(piv);
    const arm = cap(0.065, 0.44, o.shirt); arm.position.y = -0.28; piv.add(arm);
    ball(0.075, skin, 0, -0.6, 0, piv);
    return piv;
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 16), mat(skin)); head.position.y = 1.72; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(hairC));
  hair.position.set(0, 1.74, -0.03); hair.rotation.x = -0.35; g.add(hair);
  if (o.girl) { const lh = cap(0.21, 0.28, hairC); lh.position.set(0, 1.58, -0.17); lh.scale.z = 0.55; g.add(lh); }
  if (o.hat) { cyl(0.22, 0.24, 0.35, 0xffffff, 0, 2.1, 0, g); ball(0.27, 0xffffff, 0, 2.3, 0, g); }
  ball(0.08, skin, -0.28, 1.72, 0, g); ball(0.08, skin, 0.28, 1.72, 0, g);
  const eyes = [-0.1, 0.1].map(x => { const e = ball(0.042, 0x1a1a1a, x, 1.76, 0.25, g); ball(0.013, 0xffffff, 0.012, 0.018, 0.035, e); return e; });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 14, Math.PI), mat(0xb5443f)); smile.position.set(0, 1.63, 0.265); smile.rotation.z = Math.PI; g.add(smile);
  ball(0.05, 0xffb0a0, -0.17, 1.65, 0.22, g); ball(0.05, 0xffb0a0, 0.17, 1.65, 0.22, g);
  g.userData.anim = { armL: arms[0], armR: arms[1], legL: legs[0], legR: legs[1], body, head, hy: 1.72, eyes, walk: 0, ph: Math.random() * 10 };
  const s = o.scale || 1; g.scale.setScalar(s);
  const tag = textSprite(o.name, 0.34 / s, { fs: 48, fg: '#1d3557' }); tag.position.y = 2.25 + (o.hat ? 0.4 : 0); g.add(tag);
  const mark = textSprite('!', 0.5 / s, { fs: 70, bg: '#ffd43b', fg: '#c92a2a', border: '#c92a2a', pad: 18 });
  mark.position.y = 2.75 + (o.hat ? 0.4 : 0); mark.visible = false; mark.userData.baseY = mark.position.y; g.add(mark);
  g.userData.mark = mark;
  return g;
}

// ---------------- 세계 만들기 (Lesson 4 · Calendar Town) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8bc66a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xeadfca)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xeadfca)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0xf08c00, -4, 2, FEN); solid(1, 4, 1, 0xf08c00, 4, 2, FEN);
const gateSign = textPlane('Calendar Town 🗓️', 1.1, { fs: 64, bg: '#f08c00', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1, color = 0x4caf50) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const c = ball(1.5 * s, color, x, 3 * s, z); c.scale.y = 1.1;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -43, 1, i % 16 === 0 ? 0xffa94d : 0x4caf50); tree(-43, i, 1.1); tree(43, i + 3, 1, i % 16 === 0 ? 0xffa94d : 0x4caf50); }
for (const x of [-38, -14, 14, 38]) tree(x, 42, 0.9);
for (const [x, z] of [[-14, 38], [14, 40], [-16, 12], [16, 12]]) tree(x, z, 1.1, 0x69db7c);
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-8, 7); bench(8, 7);

// ---------- 가운데: Calendar Plaza (열두 달 간판) ----------
const CAL = { x: 0, z: 23, r: 8 };
{ const d = new THREE.Mesh(new THREE.CircleGeometry(CAL.r + 1.5, 40), mat(0xfff3bf)); d.rotation.x = -Math.PI / 2; d.position.set(CAL.x, 0.02, CAL.z); scene.add(d);
  const s = textSprite('🗓️ Calendar Plaza', 0.7, { fs: 60, bg: '#f08c00', fg: '#fff' }); s.position.set(CAL.x, 4.6, CAL.z); scene.add(s); }
const MONTH_COL = ['#4dabf7', '#748ffc', '#40c057', '#f783ac', '#fd7e14', '#12b886', '#fa5252', '#f59f00', '#82c91e', '#e8590c', '#9775fa', '#1c7ed6'];
const monthBoard = [];
L.months.forEach(([en, ko], i) => {
  const a = (i + 0.5) * Math.PI / 6;
  const bx = CAL.x + CAL.r * Math.sin(a), bz = CAL.z - CAL.r * Math.cos(a);
  const g = new THREE.Group(); g.position.set(bx, 0, bz); g.rotation.y = Math.atan2(CAL.x - bx, CAL.z - bz); scene.add(g);
  box(0.12, 2.0, 0.12, 0x868e96, -1.0, 1.0, 0, g); box(0.12, 2.0, 0.12, 0x868e96, 1.0, 1.0, 0, g);
  box(2.6, 1.15, 0.1, 0xffffff, 0, 2.4, -0.03, g);
  const t = textPlane(`${en}\n${ko}`, 1.05, { fs: 56, bg: MONTH_COL[i], fg: '#fff', minW: 420 }, g); t.position.set(0, 2.4, 0.04);
  const t2 = textPlane(en, 0.45, { fs: 52, bg: MONTH_COL[i], fg: '#fff' }, g); t2.position.set(0, 2.4, -0.1); t2.rotation.y = Math.PI;
  block(bx - 1, bz - 1, bx + 1, bz + 1);
  const ix = CAL.x + (CAL.r - 2) * Math.sin(a), iz = CAL.z - (CAL.r - 2) * Math.cos(a);
  monthBoard.push({ g, x: bx, z: bz, ix, iz });
});
function stickOn(month, text) { // 달력 간판에 스티커 붙이기
  const b = monthBoard[month - 1];
  const s = textPlane(text, 0.42, { fs: 52, bg: '#ffffff', fg: '#c92a2a', border: '#c92a2a' }, b.g); s.position.set(0, 1.45, 0.12);
  decor.push(s); return s;
}

// ---------- 서쪽: Olivia's House ----------
const HOUSE = { x: -27, z: -2 };
solid(0.4, 4, 20, 0xe7f5ff, -34, 2, -2);
solid(14, 4, 0.4, 0xe7f5ff, -27, 2, -12); solid(14, 4, 0.4, 0xe7f5ff, -27, 2, 8);
solid(0.5, 4, 0.5, 0x1971c2, -20.2, 2, -11.8); solid(0.5, 4, 0.5, 0x1971c2, -20.2, 2, 7.8);
{ const r = new THREE.Mesh(new THREE.ConeGeometry(12.5, 4, 4), mat(0x1971c2)); r.rotation.y = Math.PI / 4; r.scale.set(0.8, 1, 1.1); r.position.set(-27, 6, -2); scene.add(r); }
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xe9d8a6)); fl.rotation.x = -Math.PI / 2; fl.position.set(-27, 0.02, -2); scene.add(fl); }
{ const s = textPlane("Olivia's House 🏠", 0.9, { fs: 64, bg: '#1971c2', fg: '#fff' }); s.position.set(-19.9, 4.6, -2); s.rotation.y = Math.PI / 2; }
// 소파·식탁·벽 달력
box(1, 0.5, 3.4, 0xf06595, -32.8, 0.25, -7); box(0.3, 0.9, 3.4, 0xf06595, -33.4, 0.7, -7);
cyl(0.8, 0.8, 0.06, 0xffffff, -27, 0.78, -6, scene, 18); cyl(0.07, 0.07, 0.78, 0x777777, -27, 0.39, -6); block(-27.7, -6.7, -26.3, -5.3);
{ const s = textPlane('MAY · 22 🚌 Field Trip\nJUNE · 1 🛍️ School Market', 1.0, { fs: 44, bg: '#ffffff', fg: '#1971c2', border: '#1971c2' }); s.position.set(-27, 2.3, -11.75); }
// Ben의 알뜰 시장 상자
const BENBOX = { x: -31.5, z: 5.6 };
solid(1.6, 0.7, 1.2, 0xc58b3a, BENBOX.x, 0.35, BENBOX.z);
box(1.3, 0.1, 0.9, 0xffd43b, BENBOX.x, 0.72, BENBOX.z); box(1.2, 0.12, 0.8, 0x74c0fc, BENBOX.x - 0.1, 0.8, BENBOX.z + 0.05);
{ const s = textPlane("Ben's Box 🛍️", 0.36, { fs: 46, bg: '#ffffff', fg: '#e8590c' }); s.position.set(BENBOX.x + 0.82, 0.45, BENBOX.z); s.rotation.y = Math.PI / 2; }

// ---------- 동쪽: Sunny School (행사 게시판) ----------
const SCHOOL = { x: 27, z: -2 };
solid(0.4, 4.5, 20, 0xfff9db, 34, 2.25, -2);
solid(14, 4.5, 0.4, 0xfff9db, 27, 2.25, -12); solid(14, 4.5, 0.4, 0xfff9db, 27, 2.25, 8);
solid(0.5, 4.5, 0.5, 0x2f9e44, 20.2, 2.25, -11.8); solid(0.5, 4.5, 0.5, 0x2f9e44, 20.2, 2.25, 7.8);
box(14.6, 0.4, 20.6, 0x2f9e44, 27, 4.7, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xd3f9d8)); fl.rotation.x = -Math.PI / 2; fl.position.set(27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('Sunny School 🏫', 1.0, { fs: 64, bg: '#2f9e44', fg: '#fff' }); s.position.set(19.9, 4.2, -2); s.rotation.y = -Math.PI / 2; }
{ const s = textPlane('Event Board 📌', 0.45, { fs: 52, bg: '#e8590c', fg: '#fff' }); s.position.set(33.75, 3.85, -1.25); s.rotation.y = -Math.PI / 2; }
const POSTER_Z = [-8, -3.5, 1, 5.5];
const EV = Object.fromEntries(L.events.map(e => [e.id, e]));
L.listen.forEach((p, i) => {
  const e = EV[p.event];
  const s = textPlane(`${i + 1}. ${e.emoji}\n${e.id}\n${p.poster[0]}월 ${p.poster[1]}일`, 1.7, { fs: 50, bg: '#ffffff', fg: '#1d3557', border: '#e8590c' });
  s.position.set(33.75, 2.2, POSTER_Z[i]); s.rotation.y = -Math.PI / 2;
});
// 선생님 책상·칠판
solid(1, 0.9, 2.4, 0xdeb887, 22.6, 0.45, -9);
box(4.4, 1.4, 0.1, 0x2b8a3e, 27, 2.3, -11.75);
{ const s = textPlane('When is the ...?', 0.45, { fs: 52, bg: null, fg: '#ffffff' }); s.position.set(27, 2.3, -11.65); }
for (let i = 0; i < 4; i++) box(1.0, 0.7, 0.7, 0xffa94d, 24 + (i % 2) * 2.2, 0.35, -4 + Math.floor(i / 2) * 6);

// ---------- 북쪽: My Birthday 이야기 마당 ----------
const STORY = { x: 0, z: -32 };
box(40, 0.3, 14, 0xfff0f6, 0, 0.15, -34);
solid(40, 4, 0.4, 0xfcc2d7, 0, 2, -41);
{ const s = textPlane('My Birthday · Story Garden 🎉', 0.9, { fs: 62, bg: '#d6336c', fg: '#fff' }); s.position.set(0, 5, -40.7); }
// 왼쪽: Diego (Mexico) 피냐타
const PINATA = { x: -10, z: -37 };
for (const dx of [-3, 3]) cyl(0.1, 0.1, 3.6, 0x8d6e63, PINATA.x + dx, 1.8, PINATA.z);
{ const bar = cyl(0.08, 0.08, 6.2, 0x8d6e63, PINATA.x, 3.6, PINATA.z); bar.rotation.z = Math.PI / 2; }
block(PINATA.x - 3.2, PINATA.z - 0.2, PINATA.x - 2.8, PINATA.z + 0.2); block(PINATA.x + 2.8, PINATA.z - 0.2, PINATA.x + 3.2, PINATA.z + 0.2);
function pinataModel() {
  const g = new THREE.Group(); const cols = [0xff6b6b, 0xffd43b, 0x51cf66, 0x339af0, 0xcc5de8];
  cols.forEach((c, i) => { const m = cyl(0.42 - i * 0.02, 0.42 - i * 0.02, 0.14, c, -0.28 + i * 0.14, 0, 0, g, 16); m.rotation.z = Math.PI / 2; });
  ball(0.22, 0xffd43b, 0.5, 0.25, 0, g); cyl(0.05, 0.05, 0.3, 0xff6b6b, 0.62, 0.48, 0, g);
  for (const dx of [-0.25, 0.25]) cyl(0.05, 0.05, 0.4, 0x51cf66, dx, -0.55, 0, g);
  return g;
}
const pinataDecor = pinataModel(); pinataDecor.position.set(PINATA.x, 2.7, PINATA.z); scene.add(pinataDecor);
cyl(0.015, 0.015, 0.5, 0x222222, PINATA.x, 3.35, PINATA.z);
{ const s = textPlane('Diego · Mexico 🌵 · June 7th', 0.45, { fs: 48, bg: '#ffffff', fg: '#d6336c' }); s.position.set(-10, 5.0, -40.6); }
// 오른쪽: Lucy (Australia) 요정 빵
const BREAD = { x: 10, z: -37 };
solid(3, 0.8, 1.4, 0xffffff, BREAD.x, 0.7, BREAD.z);
for (let k = 0; k < 4; k++) { box(0.5, 0.06, 0.5, 0xfff3bf, BREAD.x - 1 + k * 0.65, 1.14, BREAD.z); for (let j = 0; j < 6; j++) ball(0.035, fcol(j), BREAD.x - 1.13 + k * 0.65 + (j % 3) * 0.13, 1.19, BREAD.z - 0.1 + Math.floor(j / 3) * 0.2); }
function fcol(j) { return [0xff6b6b, 0x51cf66, 0x339af0, 0xffd43b, 0xcc5de8][j % 5]; }
{ const s = textPlane('Lucy · Australia 🦘 · October 21st', 0.45, { fs: 48, bg: '#ffffff', fg: '#1971c2' }); s.position.set(10, 5.0, -40.6); }
{ const s = textPlane('Fairy Bread 🍞✨', 0.4, { fs: 48, bg: '#fff3bf', fg: '#e8590c' }); s.position.set(BREAD.x, 1.8, BREAD.z + 0.72); }

// ---------- 남서: Let's Write 초대장 책상 (Kate) ----------
const WRITE = { x: -26, z: 30 };
box(16, 0.4, 12, 0xfff0f6, WRITE.x, 0.2, WRITE.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz);
box(17, 0.4, 13, 0xd6336c, WRITE.x, 5.2, WRITE.z);
{ const s = textPlane("Let's Write · Invitation Desk 💌", 0.85, { fs: 62, bg: '#d6336c', fg: '#fff' }); s.position.set(WRITE.x + 8.6, 4.4, WRITE.z); s.rotation.y = Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x - 1, 0.85, WRITE.z);
solid(0.4, 3.4, 10, 0xf8f9fa, WRITE.x - 7.6, 2, WRITE.z);
['🎩', '💌', '🎉'].forEach((e, i) => { const p = textPlane(e, 1.4, { fs: 110, bg: '#ffffff', border: '#d6336c' }); p.position.set(WRITE.x - 7.35, 2.4, WRITE.z - 3 + i * 3); p.rotation.y = Math.PI / 2; });
for (let i = 0; i < 3; i++) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 12), mat(fcol(i))); h.position.set(WRITE.x - 1.6 + i * 0.6, 1.58, WRITE.z); scene.add(h); }

// ---------- 남동: Music Festival 무대 ----------
const FEST = { x: 26, z: 30 };
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat(0xe5dbff)); f.rotation.x = -Math.PI / 2; f.position.set(FEST.x, 0.02, FEST.z); scene.add(f); }
box(10, 0.2, 4, 0x7048e8, FEST.x + 2, 0.1, FEST.z - 3.5);
solid(12, 4, 0.4, 0x5f3dc4, FEST.x + 2, 2, FEST.z - 5.8);
{ const s = textPlane('Music Festival 🎸 May 3rd', 0.8, { fs: 60, bg: '#7048e8', fg: '#fff' }); s.position.set(FEST.x + 2, 4.6, FEST.z - 5.55); }
for (const dx of [-3.2, 7.2]) { solid(1, 1.8, 1, 0x212529, FEST.x + dx, 0.9, FEST.z - 4.5); ball(0.3, 0x495057, FEST.x + dx, 1.3, FEST.z - 3.98); }
for (let i = 0; i < 8; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 3), mat(fcol(i))); fl.position.set(FEST.x - 4 + i * 1.6, 3.9, FEST.z - 5.5); fl.rotation.x = Math.PI; scene.add(fl); }
function guitarModel() {
  const g = new THREE.Group();
  ball(0.2, 0xd9480f, 0, 0, 0, g).scale.set(1, 1, 0.4); ball(0.15, 0xd9480f, 0, 0.22, 0, g).scale.set(1, 1, 0.4);
  box(0.06, 0.55, 0.04, 0x5c3a21, 0, 0.55, 0, g); box(0.1, 0.12, 0.05, 0x212529, 0, 0.85, 0, g);
  return g;
}

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'pants') { box(0.5, 0.18, 0.1, 0x2f9e44, 0, 0.5, 0, g); box(0.22, 0.5, 0.1, 0x2f9e44, -0.13, 0.17, 0, g); box(0.22, 0.5, 0.1, 0x2f9e44, 0.13, 0.17, 0, g); }
  else if (id === 'pinata') { const p = pinataModel(); p.scale.setScalar(0.8); g.add(p); }
  else { const s = textSprite(id, 0.7, { fs: 80, bg: '#ffffff', border: '#f08c00', pad: 16 }); g.add(s); }
  return g;
}
let decor = [];
function addDecor(o) { scene.add(o); decor.push(o); return o; }
function clearDecor() { decor.forEach(o => { if (o.parent) o.parent.remove(o); }); decor = []; }

// ---------- 들고 있는 물건 ----------
scene.add(camera);
let heldMesh = null, heldMeshId = null, fallers = [];
function heldSync() {
  const f = held && held.kind === 'thing' ? held.id : null;
  if (f === heldMeshId) return;
  if (heldMesh) { camera.remove(heldMesh); heldMesh = null; }
  heldMeshId = f;
  if (f) { heldMesh = itemModel(f); heldMesh.scale.setScalar(0.9); heldMesh.position.set(0.34, -0.6, -0.8); camera.add(heldMesh); }
}
function setHeld(id, label) { held = { kind: 'thing', id, label }; refreshHUD(); }
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  if (pinataDecor.visible) pinataDecor.rotation.z = Math.sin(t * 1.3) * 0.12;
  for (const f of fallers) {
    f.userData.life -= dt;
    if (f.userData.vy !== undefined) {
      f.userData.vy -= 9 * dt; f.position.y = Math.max(0.4, f.position.y + f.userData.vy * dt);
      if (f.position.y > 0.4) { f.position.x += f.userData.vx * dt; f.position.z += f.userData.vz * dt; }
    } else { f.position.y += dt * 0.8; f.material.opacity = Math.max(0, f.userData.life); }
  }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { if (f.parent) f.parent.remove(f); return false; } return true; });
}
function puff(x, y, z, text) {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#d6336c', border: '#d6336c' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 1.6; scene.add(s); fallers.push(s);
}
function candyBurst(x, y, z) {
  for (let i = 0; i < 20; i++) {
    const c = ball(0.1, fcol(i), x, y, z); const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.6;
    c.userData = { life: 40, vy: 1.5 + Math.random() * 2, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp }; fallers.push(c); decor.push(c);
  }
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#eadfca'); R(0, -2, 52, 6, '#eadfca');
  mctx.fillStyle = '#f08c00'; mctx.beginPath(); mctx.arc(tx(CAL.x), tz(CAL.z), (CAL.r + 1) * s, 0, 7); mctx.fill(); mctx.fillStyle = '#fff'; mctx.fillText('달력 광장', tx(CAL.x), tz(CAL.z) + 4);
  R(-27, -2, 14, 20, '#1971c2', 'Olivia 집'); R(27, -2, 14, 20, '#2f9e44', '학교');
  R(0, -36, 40, 9, '#d6336c', '생일 이야기 마당'); R(WRITE.x, WRITE.z, 16, 12, '#c2255c', '초대장');
  R(FEST.x, FEST.z, 16, 12, '#7048e8', '음악 축제');
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
// 집 위치 [x, z, 방향]
const HOME = {
  joel: [FEST.x + 1, FEST.z - 1, 0], nara: [FEST.x - 2.5, FEST.z + 1, Math.PI / 2],
  hajun: [CAL.x + 2, CAL.z + 2.5, Math.PI], kai: [-11, 18, Math.PI / 2],
  teacher: [23.6, -7.2, -Math.PI / 2],
  dad: [-26, -4.5, Math.PI / 2], olivia: [-29.5, 0, Math.PI / 2], ben: [-27.5, 4.5, Math.PI / 2],
  erin: [-15, 1.5, Math.PI / 2], erinDad: [-15, -5, Math.PI / 2],
  diego: [-12.5, -33.6, 0], lucy: [12.5, -33.6, 0],
  kate: [WRITE.x + 1, WRITE.z + 1.8, Math.PI / 2], nick: [WRITE.x + 2.4, WRITE.z - 1.6, Math.PI / 2],
  bonus: [-6, -20, 0]
};
L.listen.forEach((p, i) => { HOME[p.id] = [32.9, POSTER_Z[i] + 1.9, -Math.PI / 2]; });

addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ["I'll play the guitar at the music festival.", '나는 음악 축제에서 기타를 칠 거야.'] }, ...HOME.joel);
{ const gt = guitarModel(); gt.position.set(0.15, 0.95, 0.3); gt.rotation.z = -0.9; NPC.joel.g.add(gt); }
addNPC('nara', { name: 'Nara', girl: true, shirt: 0xffa94d, hair: 0x1b1b1b, idle: ['When is the music festival?', '음악 축제는 언제야?'] }, ...HOME.nara);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ["Kai's birthday is coming.", 'Kai의 생일이 다가오고 있어.'] }, ...HOME.hajun);
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ['My birthday is on April 25th.', '내 생일은 4월 25일이야.'] }, ...HOME.kai);
addNPC('teacher', { name: 'Ms. Park', girl: true, shirt: 0x9775fa, skirt: 0x7048e8, hair: 0x222222, scale: 1.12, idle: ['When is the field trip? It\'s on May 22nd.', '현장 체험 학습은 언제일까요? 5월 22일이에요.'] }, ...HOME.teacher);
addNPC('dad', { name: 'Dad', shirt: 0x495057, pants: 0x343a40, hair: 0x6d4c41, scale: 1.15, idle: ['Olivia, when is the field trip?', 'Olivia, 현장 체험 학습은 언제니?'] }, ...HOME.dad);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ["It's on May 22nd.", '5월 22일이에요.'] }, ...HOME.olivia);
addNPC('ben', { name: 'Ben', shirt: 0xfab005, hair: 0x6d4c41, scale: 0.78, idle: ["I'll sell my clothes. They're too small.", '내 옷을 팔 거야. 너무 작거든.'] }, ...HOME.ben);
addNPC('erin', { name: 'Erin', girl: true, shirt: 0xf06595, hair: 0xd4a017, idle: ['I got new shoes. They\'re for Sports Day.', '새 신발을 샀어. 운동회 때 신을 거야.'] }, ...HOME.erin);
addNPC('erinDad', { name: "Erin's Dad", shirt: 0x5c7cfa, pants: 0x364fc7, hair: 0xa0522d, scale: 1.15, idle: ['When is Sports Day?', '운동회는 언제니?'] }, ...HOME.erinDad);
addNPC('diego', { name: 'Diego', shirt: 0xe03131, hair: 0x2b1d14, skin: 0xd9a066, idle: ['My birthday is on June 7th.', '내 생일은 6월 7일이야.'] }, ...HOME.diego);
addNPC('lucy', { name: 'Lucy', girl: true, shirt: 0x1c7ed6, hair: 0xe0a85a, idle: ['My birthday is on October 21st.', '내 생일은 10월 21일이야.'] }, ...HOME.lucy);
addNPC('kate', { name: 'Kate', girl: true, shirt: 0xd6336c, hair: 0x8d5524, idle: ['Can you come to the funny hat party?', '재미있는 모자 파티에 올 수 있니?'] }, ...HOME.kate);
{ const h = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 12), mat(0x51cf66)); h.position.y = 2.2; NPC.kate.g.add(h);
  for (const c of NPC.kate.g.children) if (c.isSprite) { c.position.y += 0.45; if (c.userData.baseY) c.userData.baseY += 0.45; } }
addNPC('nick', { name: 'Nick', shirt: 0x20c997, hair: 0x3b2a1a, idle: ['The party is on May 10th.', '파티는 5월 10일이야.'] }, ...HOME.nick);
addNPC('bonus', { name: 'Jay', shirt: 0xf59f00, hair: 0x5c3a21, idle: ['Sports Day is on May 4th. We will play soccer.', '운동회는 5월 4일이야. 우리는 축구를 할 거야.'] }, ...HOME.bonus);
L.listen.forEach((p, i) => addNPC(p.id, { name: p.name, girl: p.girl, shirt: p.shirt, hair: [0xa0522d, 0x3b2a1a, 0x111111, 0xd4a017][i], scale: 0.9, idle: [`When is the ${p.event}?`, `${EV[p.event].ko}은(는) 언제일까?`] }, ...HOME[p.id]));
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
const MN = L.months.map(m => m[0]);
const ord = (n) => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
const dstr = (d) => `${MN[d[0] - 1]} ${ord(d[1])}`;
const dko = (d) => `${d[0]}월 ${d[1]}일`;
const MAXD = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function whenQ(label, pre = '') {
  const c = (s) => pre ? pre + s.charAt(0).toLowerCase() + s.slice(1) : s;
  return [c(`When is ${label}?`), c(`Where is ${label}?`), c("What's wrong?"), c('What grade are you in?')];
}
function dateSet(r, extra) { // 정답 날짜 + 헷갈리는 날짜 3개
  const out = [r];
  const add = (d) => { if (out.length < 4 && !out.some(o => o[0] === d[0] && o[1] === d[1])) out.push(d); };
  if (extra) add(extra);
  add([r[0], r[1] > 15 ? r[1] - 10 : r[1] + 10]);
  add([r[0] % 12 + 1, r[1]]);
  add([(r[0] + 5) % 12 + 1, r[1] % 28 + 1]);
  return out;
}
const SORRY = ["I'm sorry?", 'Thank you.', 'Nice to meet you.', 'Here you are.'];
const OX = ['⭕ O (맞아요)', '❌ X (틀려요)'];
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 음악 축제와 생일', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 행사 게시판', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. Olivia네 집', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 나의 생일', book: 'Before/After You Read', start: stage5 },
  { title: '6. 행사 초대 글 쓰기', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  pinataDecor.visible = true;
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
async function readLines(arr) { for (const [who, en, ko] of arr) await say(who, en, ko); }
function flash() { const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:50;opacity:1;transition:opacity .6s;pointer-events:none'; document.body.appendChild(f); setTimeout(() => f.style.opacity = 0, 60); setTimeout(() => f.remove(), 700); }
// 달력 간판에 스티커 붙이기 미션
function stickerTask(month, emoji, label, objText, then) {
  const b = monthBoard[month - 1];
  setObj(objText, () => [b.ix, b.iz]);
  addItem(itemModel(emoji), b.ix, b.iz, (it) => {
    removeItem(it); stickOn(month, label); good();
    toast(`🗓️ <b>${MN[month - 1]}</b> 달력에 <b>${label}</b> 스티커를 붙였어요!`, 2600);
    then();
  }, { y: 1.5, r: 1.4, spin: 1.2 });
}

// ---- 1. Fun Talk 1 ----
function stage1() {
  setObj('🎸 남동쪽 <b>Music Festival</b> 무대의 <b>Joel</b>에게 가요', npcAt('joel')); mark('joel');
  NPC.joel.talk = async () => {
    mark('joel', false); NPC.joel.talk = null;
    await say('Joel', 'Good morning, Nara.', '좋은 아침이야, 나라야.');
    await ask('나', 'Nara가 되어 Joel에게 인사해요.', '알맞은 말을 고르세요.', ['Good morning.', 'Good night.', 'Goodbye.', "I'm sorry?"], { me: true });
    await say('Nara', 'Oh, you have a nice guitar.', '와, 멋진 기타를 가지고 있구나.');
    await say('Joel', "Thanks. It's for the guitar club. I'll play it at the music festival.", '고마워. 기타 동아리 거야. 음악 축제에서 연주할 거야.');
    await say('Nara', "That's nice.", '멋지다.');
    await ask('나', 'Nara가 되어 음악 축제가 언제인지 물어보세요.', '알맞은 질문을 고르세요.', whenQ('the music festival'), { me: true, hint: 'When is ~? = ~은 언제니?' });
    await say('Joel', "It's on May 3rd. Can you come to the festival?", '잘 듣고 날짜를 기억해요. (🔊 다시 듣기)', { listen: true, koAlways: true });
    await ask('', 'The music festival is on ______.', '음악 축제는 언제인가요?', ['May 3rd', 'May 23rd', 'March 3rd', 'April 25th'], { hint: '🔊 다시 듣기를 눌러 보세요.' });
    await ask('나', 'Nara가 되어 대답해요: Can you come to the festival?', '축제에 올 수 있냐고 물었어요.', ['Sure.', 'I have a runny nose.', 'Good night.', 'Here you are.'], { me: true });
    await say('', '', '🗓️ 가운데 달력 광장의 <May> 간판에 음악 축제 스티커를 붙여 주세요.', { btn: '붙일게!' });
    closeDlg();
    stickerTask(5, '🎸', '🎸 3', '🗓️ 달력 광장의 <b>May</b> 간판에 음악 축제 스티커를 붙여요', s1birthday);
  };
}
function s1birthday() {
  placeNPC('joel', CAL.x - 1.5, CAL.z + 2.5, 0); placeNPC('nara', CAL.x - 0.5, CAL.z - 2, 0);
  setObj('🎂 달력 광장의 <b>Hajun</b>에게 가요', npcAt('hajun')); mark('hajun');
  NPC.hajun.talk = async () => {
    mark('hajun', false); NPC.hajun.talk = null;
    await say('Hajun', "Kai's birthday is coming.", 'Kai의 생일이 다가오고 있어.');
    await ask('나', "Joel이 되어 Kai의 생일이 언제인지 물어보세요. (That's right. ...)", '알맞은 질문을 고르세요.', ['When is his birthday?', 'Where is his birthday?', "What's wrong with him?", 'What grade is he in?'], { me: true });
    await say('Hajun', "It's on April 25th.", '잘 듣고 날짜를 기억해요. (🔊 다시 듣기)', { listen: true, koAlways: true });
    await ask('', "Kai's birthday is on ______.", 'Kai의 생일은 언제인가요?', ['April 25th', 'April 5th', 'August 25th', 'May 3rd'], { hint: '🔊 다시 듣기를 눌러 보세요.' });
    await say('Joel', "It's next Monday. What can we do for him?", '다음 주 월요일이네. 우리가 Kai를 위해 무엇을 할 수 있을까?');
    await say('Nara', 'We can sing together.', '함께 노래를 부를 수 있어.');
    await say('Joel', 'I can play the guitar. How about this song? Listen!', '나는 기타를 칠 수 있어. 이 노래 어때? 들어 봐!');
    toast('🎸 ♪ ♬ ♪ Happy birthday to you ♬', 2400); beep('star');
    await say('', '', '🎂 이번에는 <April> 간판에 Kai의 생일 스티커를 붙여요.', { btn: '붙일게!' });
    closeDlg();
    stickerTask(4, '🎂', '🎂 25', '🗓️ 달력 광장의 <b>April</b> 간판에 Kai의 생일 스티커를 붙여요', async () => {
      busy = true;
      await say('', '', '🗓️ Fun Talk 1 완료! 음악 축제는 May 3rd(5월 3일), Kai의 생일은 April 25th(4월 25일)예요.', { btn: '다음 미션 ▶' });
      busy = false; nextStage();
    });
  };
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  setObj('🏫 동쪽 <b>Sunny School</b>의 <b>Ms. Park</b>에게 가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await say('Ms. Park', 'Look at the event posters. Ask your friends and listen carefully.', '행사 포스터를 보세요. 친구들에게 묻고 잘 들어 보세요.');
    await say('', '', '📌 게시판 앞 친구 4명에게 행사 날짜를 묻고, 들은 날짜가 포스터와 같으면 O, 다르면 X를 골라요.', { btn: '시작!' });
    closeDlg(); stageState.done = {};
    const left = () => L.listen.filter(x => !stageState.done[x.id]).map(x => x.id);
    L.listen.forEach((p, i) => {
      const e = EV[p.event]; mark(p.id);
      NPC[p.id].talk = async () => {
        if (stageState.done[p.id]) { await say(p.name, 'Thank you!', '고마워!'); closeDlg(); return; }
        mark(p.id, false);
        await ask('나', `${p.name}에게 ${e.emoji} ${e.ko} 날짜를 물어보세요.`, '알맞은 질문을 고르세요.', whenQ(e.label), { me: true });
        await say(p.name, `It's on ${dstr(p.said)}.`, '잘 듣고 포스터와 비교해요. (🔊 다시 듣기)', { listen: true, koAlways: true });
        const same = p.said[0] === p.poster[0] && p.said[1] === p.poster[1];
        await ask('', `📌 포스터 ${i + 1}: ${e.emoji} ${e.id} · ${dko(p.poster)}`, '들은 날짜가 포스터와 같으면 O, 다르면 X', OX, { right: same ? OX[0] : OX[1], noShuffle: true, sayIt: false, hint: '🔊 다시 듣기로 한 번 더 들어 보세요.' });
        await ask('', `${e.label.charAt(0).toUpperCase() + e.label.slice(1)} is on ______.`, `${p.name}가 말한 날짜를 고르세요.`, dateSet(p.said, p.poster).map(dstr));
        stageState.done[p.id] = 1; closeDlg();
        const n = Object.keys(stageState.done).length;
        if (n < L.listen.length) setObj(`📌 게시판 앞 친구에게 행사 날짜를 물어봐요 (${n}/${L.listen.length})`, () => nearestOf(left()));
        else s2guess();
      };
    });
    setObj(`📌 게시판 앞 친구에게 행사 날짜를 물어봐요 (0/${L.listen.length})`, () => nearestOf(left()));
  };
}
function s2guess() {
  setObj('👩‍🏫 <b>Ms. Park</b>에게 돌아가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await say('Ms. Park', "Great job! Let's play a guessing game. Ask me the date!", '잘했어요! 날짜 추측하기 놀이를 해요. 날짜를 물어보세요!');
    for (const g of L.guess) {
      const e = EV[g.event];
      await ask('나', `Play Together 1 · ${e.emoji} ${e.ko} 그림이에요. 선생님께 날짜를 물어보세요.`, '알맞은 질문을 고르세요.', whenQ(e.label), { me: true });
      await ask('Ms. Park', `It's on ${dstr(g.date)}.`, '선생님이 말한 날짜를 고르세요. (🔊 다시 듣기)', shuffle(dateSet(g.date)).map(dko), { right: dko(g.date), speakQ: true, listen: true });
    }
    await say('Ms. Park', 'Wonderful! You are good at dates.', '훌륭해요! 날짜를 정말 잘 듣는군요.');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  setObj("🏠 서쪽 <b>Olivia's House</b>의 <b>Dad</b>에게 가요", npcAt('dad')); mark('dad');
  NPC.dad.talk = async () => {
    mark('dad', false); NPC.dad.talk = null;
    await say('', '', '👨 Olivia의 아빠가 되어 대화해 보세요.', { btn: '좋아요!' });
    await ask('나', 'Dad가 되어 Olivia에게 현장 체험 학습 날짜를 물어보세요.', '알맞은 질문을 고르세요.', whenQ('the field trip', 'Olivia, '), { me: true });
    await say('Olivia', "It's on May 22nd.", '🔊 지이잉~ 청소기 소리 때문에 잘 안 들려요!', { listen: true, koAlways: true });
    await ask('나', 'Dad가 되어 다시 말해 달라고 해요.', '잘 못 들었을 때 하는 말을 고르세요.', SORRY, { me: true, hint: "I'm sorry? = 뭐라고? (다시 말해 줄래?)" });
    await say('Olivia', "It's on May 22nd, Dad.", '5월 22일이에요, 아빠.');
    await say('Dad', "Oh, it's next Thursday.", '아, 다음 주 목요일이구나.');
    await say('Olivia', "Right. We'll visit the art center. I'll make a paper clock there.", '맞아요. 우리는 미술관에 갈 거예요. 거기서 종이 시계를 만들 거예요.');
    await say('Dad', 'Oh, that sounds fun.', '오, 재미있겠구나.');
    await ask('', 'When is the field trip?', '현장 체험 학습은 언제인가요?', ["It's on May 22nd.", "It's on May 2nd.", "It's on March 22nd.", "It's on June 1st."]);
    await say('Ben', "The school market day is coming, too. It's for helping sick children.", '학교 알뜰 시장 날도 다가와요. 아픈 어린이들을 돕기 위한 거예요.');
    await ask('나', 'Dad가 되어 Ben에게 알뜰 시장 날짜를 물어보세요.', '알맞은 질문을 고르세요.', whenQ('the school market'), { me: true });
    await say('Ben', "It's on June 1st. I'll sell my clothes. They're too small.", '잘 듣고 날짜를 기억해요. (🔊 다시 듣기)', { listen: true, koAlways: true });
    await say('Olivia', "That's very nice, Ben.", '정말 착하구나, Ben.');
    await ask('', 'When is the school market?', '학교 알뜰 시장은 언제인가요?', ["It's on June 1st.", "It's on July 1st.", "It's on June 21st.", "It's on May 22nd."]);
    await say('Olivia', 'Dad, where are my green pants?', '아빠, 제 초록색 바지 어디 있어요?');
    await say('Dad', 'I have no idea.', '모르겠구나.');
    await say('', '', "👖 Olivia의 초록색 바지를 찾아 주세요. Ben의 알뜰 시장 상자가 수상해요!", { btn: '찾아볼게!' });
    closeDlg();
    setObj("👖 <b>Ben's Box</b>에서 초록색 바지를 찾아요", () => [BENBOX.x + 1.9, BENBOX.z - 0.2]);
    addItem(itemModel('pants'), BENBOX.x + 1.9, BENBOX.z - 0.2, (it) => {
      removeItem(it); setHeld('pants', '👖 green pants'); beep('get');
      setObj('👖 <b>Olivia</b>에게 바지를 가져다줘요', npcAt('olivia')); mark('olivia');
      NPC.olivia.talk = async () => {
        mark('olivia', false); NPC.olivia.talk = null; held = null; refreshHUD(); good();
        await say('Olivia', 'Oh, those are my pants. Ben!', '어, 그거 내 바지잖아. Ben!');
        toast('😅 Ben이 알뜰 시장에 팔려고 상자에 넣었나 봐요!', 2600);
        closeDlg(); s3erin();
      };
    }, { y: 1.0, r: 1.4, spin: 1 });
  };
}
function s3erin() {
  setObj('👟 집 밖 길가의 <b>Erin</b>에게 가요', npcAt('erin')); mark('erin');
  NPC.erin.talk = async () => {
    mark('erin', false); NPC.erin.talk = null;
    await say('Erin', "Dad, I got new shoes. They're for Sports Day.", '아빠, 새 신발을 샀어요. 운동회 때 신을 거예요.');
    await ask('나', "Erin's Dad가 되어 운동회 날짜를 물어보세요.", '알맞은 질문을 고르세요.', whenQ('Sports Day'), { me: true });
    await say('Erin', "It's on April 19th.", '📢 쿵쾅쿵쾅! 주변이 시끄러워서 잘 안 들려요.', { listen: true, koAlways: true });
    await ask('나', "Erin's Dad가 되어 다시 말해 달라고 해요.", '알맞은 말을 고르세요.', SORRY, { me: true });
    await say('Erin', "It's on April 19th.", '4월 19일이에요.');
    await ask('', 'When is Sports Day?', '운동회는 언제인가요?', ["It's on April 19th.", "It's on April 9th.", "It's on August 19th.", "It's on May 22nd."]);
    await say('Erin', "Let's play a card game!", '카드 놀이를 하자!');
    await say('', '', '🃏 Play Together 2 · 날짜 뒤집기: 카드를 보고 날짜를 묻고, “I’m sorry?”로 다시 듣고, 날짜를 골라요.', { btn: '시작!' });
    for (const f of L.flip) {
      const e = EV[f.event];
      await ask('나', `🃏 ${e.emoji} ${e.ko} 카드를 뒤집었어요. Erin에게 날짜를 물어보세요.`, '알맞은 질문을 고르세요.', whenQ(e.label), { me: true });
      await ask('Erin', `It's on ${dstr(f.date)}.`, '잘 안 들렸어요. 다시 말해 달라고 해요.', SORRY, { me: true, speakQ: true, listen: true });
      await ask('Erin', `It's on ${dstr(f.date)}.`, `${e.emoji} 카드에 쓸 날짜를 고르세요. (🔊 다시 듣기)`, shuffle(dateSet(f.date)).map(dko), { right: dko(f.date), speakQ: true, listen: true });
    }
    await say('Erin', 'Great! You flipped all the cards.', '좋아! 카드를 모두 뒤집었어.');
    nextStage();
  };
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('teacher', 0, 12, 0);
  setObj('🧱 마을 가운데 길의 <b>Ms. Park</b>에게 가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await say('Ms. Park', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '길 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['When', 'is', 'the', 'on', "It's", 'My', 'birthday', 'sorry?', 'trip?', 'May', 'June', '3rd.', 'Where', 'What', 'in', 'at'].filter(w => !words.includes(w));
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
  await say('Ms. Park', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. My Birthday (Reading) ----
function stage5() {
  setObj('📖 북쪽 <b>Story Garden</b>의 <b>Diego</b>에게 가요', npcAt('diego')); mark('diego');
  NPC.diego.talk = async () => {
    mark('diego', false); NPC.diego.talk = null;
    await say('', '', '📖 생일 날짜를 나타내는 표현에 주의하며 읽어 보세요.', { btn: '읽기 시작' });
    await readLines(L.reading.diego);
    await ask('', "When is Diego's birthday?", 'Diego의 생일은 언제인가요?', ["It's on June 7th.", "It's on June 17th.", "It's on July 7th.", "It's on October 21st."]);
    await ask('', 'A piñata has candies and toys inside.', '글의 내용과 맞으면 O, 틀리면 X', OX, { noShuffle: true, sayIt: false });
    await say('Diego', 'I will try to open it.', '🎉 피냐타에 다가가서 쳐 보세요!', { btn: '쳐 볼게!' });
    closeDlg();
    pinataDecor.visible = false;
    const pz = PINATA.z + 1.2;
    setObj('🎉 <b>피냐타</b>를 쳐서 열어요', () => [PINATA.x, pz]);
    addItem(itemModel('pinata'), PINATA.x, pz, (it) => {
      removeItem(it); candyBurst(PINATA.x, 2, pz); puff(PINATA.x, 2.8, pz, 'POP!'); good(); flash();
      toast('🍬 Candies and toys will fall out! 사탕과 장난감이 쏟아졌어요!', 3000);
      s5lucy();
    }, { y: 2.0, r: 1.5, spin: 0.6 });
  };
}
function s5lucy() {
  setObj('🍞 오른쪽 <b>Fairy Bread</b> 식탁의 <b>Lucy</b>에게 가요', npcAt('lucy')); mark('lucy');
  NPC.lucy.talk = async () => {
    mark('lucy', false); NPC.lucy.talk = null;
    await readLines(L.reading.lucy);
    await ask('', "When is Lucy's birthday?", 'Lucy의 생일은 언제인가요?', ["It's on October 21st.", "It's on October 1st.", "It's on December 21st.", "It's on June 7th."]);
    await ask('', 'Lucy will eat Fairy Bread for dinner.', '글의 내용과 맞으면 O, 틀리면 X', OX, { right: OX[1], noShuffle: true, sayIt: false, hint: 'I will eat it for ______.' });
    await say('', '', 'After You Read · 각 인물과 알맞은 그림을 연결해요.', { btn: '시작' });
    await ask('', '🎉 piñata · 🍬 candies and toys', '누구의 생일 파티일까요?', ['Diego', 'Lucy'], { noShuffle: true });
    await ask('', '🍞 Fairy Bread · 🧈 butter · 🌈 colorful sugar', '누구의 생일 파티일까요?', ['Lucy', 'Diego'], { right: 'Lucy', noShuffle: true });
    await say('', '', 'After You Read · 글의 내용에 맞게 대화를 완성해요.', { btn: '시작' });
    await ask('Diego', 'My birthday is on ______. Lucy, when is your birthday?', '빈칸에 알맞은 말', ['June 7th', 'October 21st', 'May 3rd'], { sayIt: false });
    await ask('Lucy', "It's on ______.", '빈칸에 알맞은 말', ['October 21st', 'June 7th', 'April 25th'], { sayIt: false });
    await ask('Diego', 'I will ______ a piñata on my birthday party. How about you?', '빈칸에 알맞은 말', ['hit', 'eat', 'make'], { sayIt: false });
    await ask('Lucy', 'I will ______ Fairy Bread for breakfast.', '빈칸에 알맞은 말', ['eat', 'hit', 'sell'], { sayIt: false });
    speak('I will eat Fairy Bread for breakfast.', 'Lucy');
    await say('Lucy', 'Happy birthday to us!', '우리 모두 생일 축하해!');
    nextStage();
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("💌 남서쪽 <b>Invitation Desk</b>의 <b>Kate</b>에게 가요", npcAt('kate')); mark('kate');
  NPC.kate.talk = async () => {
    mark('kate', false);
    await say('Kate', 'Read my invitation!', '내 초대 글을 읽어 줘!');
    await readLines(L.writeSample);
    await ask('', 'When is the funny hat party?', '파티는 언제인가요?', ["It's on May 10th.", "It's on May 2nd.", "It's on March 10th."]);
    await ask('', 'Where is the party?', '파티는 어디에서 하나요?', ["At Kate's house.", 'At the school.', 'At the park.']);
    await say('Kate', 'Now, invite your friend to a party!', '이제 친구를 파티에 초대하는 글을 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const opt = (arr) => arr.map((a, i) => `<option value="${i}">${a[0]} (${a[1]})</option>`).join('');
  $('#wEv').innerHTML = opt(L.writeEvents); $('#wA1').innerHTML = opt(L.writeActs); $('#wA2').innerHTML = opt(L.writeActs); $('#wPlace').innerHTML = opt(L.writePlaces);
  $('#wMon').innerHTML = L.months.map((m, i) => `<option value="${i + 1}">${m[0]} (${m[1]})</option>`).join('');
  $('#wDay').innerHTML = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${ord(i + 1)}</option>`).join('');
  $('#wTime').innerHTML = [1, 2, 3, 4, 5, 6].map(t => `<option value="${t}">${t}시</option>`).join('');
  $('#wEv').value = 0; $('#wA1').value = 0; $('#wA2').value = 1; $('#wMon').value = 5; $('#wDay').value = 10; $('#wPlace').value = 0; $('#wTime').value = 2;
  if (S.card) { for (const [k, id] of [['to', 'wTo'], ['me', 'wMe'], ['ev', 'wEv'], ['a1', 'wA1'], ['a2', 'wA2'], ['mon', 'wMon'], ['day', 'wDay'], ['place', 'wPlace'], ['time', 'wTime']]) if (S.card[k] !== undefined) $('#' + id).value = S.card[k]; }
  const upd = () => { $('#wPreview').innerHTML = letterHTML(letterData()); };
  f.oninput = upd; f.onchange = upd; upd();
  $('#wRead').onclick = () => speak(letterText(letterData()).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = letterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.to) || !/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.me)) { toast('초대할 친구 이름과 내 이름을 영어로 써 주세요. (예: Nick)'); return; }
    if (c.a1 === c.a2) { toast('행사 내용 두 가지를 서로 다르게 골라 주세요.'); return; }
    if (c.day > MAXD[c.mon - 1]) { toast(`${L.months[c.mon - 1][1]}에는 ${c.day}일이 없어요. 날짜를 다시 골라 주세요.`); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).join(' '), '나');
    await say('Kate', 'Great invitation! Your friend will come to the party.', '멋진 초대 글이야! 친구가 꼭 올 거야.');
    nextStage(); showEnd();
  };
}
function letterData() { return { to: $('#wTo').value.trim(), me: $('#wMe').value.trim(), ev: +$('#wEv').value, a1: +$('#wA1').value, a2: +$('#wA2').value, mon: +$('#wMon').value, day: +$('#wDay').value, place: +$('#wPlace').value, time: +$('#wTime').value }; }
function letterText(c) {
  const to = c.to || '____', me = c.me || '____';
  const ev = (L.writeEvents[c.ev] || L.writeEvents[0])[0], a1 = (L.writeActs[c.a1] || L.writeActs[0])[0], a2 = (L.writeActs[c.a2] || L.writeActs[1])[0];
  const pl = (L.writePlaces[c.place] || L.writePlaces[0])[0];
  return [`To ${to},`, `Can you come to the ${ev}?`, `We will ${a1}.`, `We will ${a2}, too.`, `The party is on ${dstr([c.mon, c.day])}.`, `Please come to ${pl} at ${c.time}. It will be fun.`, 'Your friend,', me];
}
function letterHTML(c) {
  const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const t = letterText(c);
  return '<div class="cardPrev">' + t.map((l, i) => `<div${i >= t.length - 2 ? ' style="text-align:right"' : ''}>${esc(l)}</div>`).join('') + '</div>';
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>ay 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · ay 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? letterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? letterText(S.card).join(' ') : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 ay 코인 ----
const TH_SPOTS = [[-38, 14], [38, -30], [-24, -39], [38, 40], [-36, -36], [-40, 40]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('ay', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('ay', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Jay');
      toast(`🪙 ay 코인: <b>${w.replace('ay', '<u>ay</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 ay 코인을 모두 모았어요! Sports Day is on May 4th. We will play soccer.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Jay', "Hi! I'm Jay. Sports Day is on May 4th. We will play soccer.", '안녕! 나는 Jay야. 운동회는 5월 4일이야. 우리는 축구를 할 거야.');
  await say('Jay', 'Listen: day, May, play. ay, ay, ay!', 'Sounds and Letters · ay 소리를 들어 보세요.');
  await say('', '', `🪙 마을 구석구석에 숨은 ay 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
  gfxTick(dt, now);
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
