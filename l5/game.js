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
const SAVE_KEY = 'english3d_l5_v1';
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
  Rani: [1, 1.35], Hajun: [0, 1.15], Joel: [0, 1.1], Kai: [0, 1.1], Lily: [1, 1.6], Mom: [1, 1.05], 'Ms. Green': [1, 1.1],
  Mina: [1, 1.4], Tom: [0, 1.2], Sora: [1, 1.3], Ben: [0, 1.1], Yuna: [1, 1.35], Leo: [0, 1.15],
  Moby: [0, 1.5], 'Dr. Shark': [0, 0.75], Lumi: [1, 1.2], Fox: [1, 1.5], Narrator: [1, 1.0], Sophie: [1, 1.3], Shelly: [1, 1.3], '나': [0, 1.0]
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

// ---------------- 세계 만들기 (Lesson 5 · Green Town) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8bc66a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xeadfca)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xeadfca)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0x2f9e44, -4, 2, FEN); solid(1, 4, 1, 0x2f9e44, 4, 2, FEN);
const gateSign = textPlane('Green Town ♻️', 1.1, { fs: 64, bg: '#2f9e44', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
function tree(x, z, s = 1) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const c = ball(1.5 * s, 0x4caf50, x, 3 * s, z); c.scale.y = 1.1;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -43, 1); tree(-43, i, 1.1); tree(43, i + 3, 1); }
for (const x of [-38, -14, 14]) tree(x, 42, 0.9);
for (const [x, z] of [[-12, 30], [-16, 14], [-8, 12]]) tree(x, z, 1.2);
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-6, 8); bench(6, 6);

// ---------- 남동: Music Festival 잔디밭 ----------
const FEST = { x: 25, z: 28 };
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), mat(0x9ad77a)); f.rotation.x = -Math.PI / 2; f.position.set(FEST.x, 0.015, FEST.z); scene.add(f); }
solid(12, 1, 4, 0x6741d9, 25, 0.5, 38.5);
solid(12, 5, 0.4, 0x343a40, 25, 2.5, 40.6);
{ const s = textPlane('MUSIC FESTIVAL 🎵', 0.9, { fs: 64, bg: '#7048e8', fg: '#fff' }); s.position.set(25, 4.2, 40.35); s.rotation.y = Math.PI; }
for (const dx of [-5, 5]) { solid(1, 2, 1, 0x212529, 25 + dx, 2, 37.6); ball(0.3, 0x495057, 25 + dx, 2.3, 37.08); }
for (let i = 0; i < 6; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 3), mat([0xff6b6b, 0xffd43b, 0x74c0fc][i % 3])); fl.position.set(20 + i * 2, 4.9, 40.2); fl.rotation.x = Math.PI; scene.add(fl); }
// 분리수거함
const BINS = { x: 15.5, z: 22 };
function bin(x, z, c, label) {
  cyl(0.55, 0.45, 1.2, c, x, 0.6, z); cyl(0.6, 0.6, 0.1, c, x, 1.25, z); block(x - 0.55, z - 0.55, x + 0.55, z + 0.55);
  const t = textSprite(label, 0.4, { fs: 52, bg: '#ffffff', fg: '#1d3557', border: '#' + c.toString(16).padStart(6, '0') }); t.position.set(x, 1.8, z); scene.add(t);
}
bin(BINS.x, BINS.z - 1.2, 0x1c7ed6, '🥫 CANS'); bin(BINS.x, BINS.z + 1.2, 0x2f9e44, '🧴 BOTTLES');
const binFill = [];
// 수돗가
const FOUNT = { x: 9, z: 13 };
solid(1.6, 0.9, 1.0, 0xadb5bd, FOUNT.x, 0.45, FOUNT.z);
box(1.4, 0.1, 0.8, 0x74c0fc, FOUNT.x, 0.88, FOUNT.z);
cyl(0.06, 0.06, 0.6, 0x868e96, FOUNT.x, 1.2, FOUNT.z - 0.3); box(0.3, 0.06, 0.06, 0x868e96, FOUNT.x, 1.48, FOUNT.z - 0.18);
const waterStream = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.55, 8), new THREE.MeshLambertMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.75 }));
waterStream.position.set(FOUNT.x, 1.18, FOUNT.z - 0.05); scene.add(waterStream);
{ const s = textPlane('Water 🚰', 0.4, { fs: 48, bg: '#ffffff', fg: '#1971c2' }); s.position.set(FOUNT.x, 2.0, FOUNT.z - 0.52); s.rotation.y = 0; }

// ---------- 서쪽: Kai's Home ----------
const HOUSE = { x: -27, z: -2 };
solid(0.4, 4, 20, 0xe3fafc, -34, 2, -2);
solid(14, 4, 0.4, 0xe3fafc, -27, 2, -12); solid(14, 4, 0.4, 0xe3fafc, -27, 2, 8);
solid(0.5, 4, 0.5, 0x1098ad, -20.2, 2, -11.8); solid(0.5, 4, 0.5, 0x1098ad, -20.2, 2, 7.8);
box(14.6, 0.4, 20.6, 0xc5f6fa, -27, 4.2, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xe9d8a6)); fl.rotation.x = -Math.PI / 2; fl.position.set(-27, 0.02, -2); scene.add(fl); }
{ const s = textPlane("Kai's Home 🏢", 0.9, { fs: 64, bg: '#1098ad', fg: '#fff' }); s.position.set(-19.9, 4.9, -2); s.rotation.y = Math.PI / 2; }
// 거실: TV와 책상
const TV = { x: -27, z: -11.6 };
box(2.4, 1.4, 0.14, 0x212529, TV.x, 1.6, -11.7);
const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), glow(0x4dabf7)); tvScreen.position.set(TV.x, 1.6, -11.62); scene.add(tvScreen);
const tvPic = textPlane('📺 ON', 0.5, { fs: 60, bg: null, fg: '#fff' }); tvPic.position.set(TV.x, 1.6, -11.6);
solid(2, 0.75, 1, 0xdeb887, -27, 0.38, -8.5); box(0.6, 0.02, 0.45, 0xffffff, -27.2, 0.77, -8.5);
{ const s = textPlane('Math 📐', 0.25, { fs: 44, bg: '#ffffff', fg: '#333' }); s.position.set(-27.2, 0.8, -8.5); s.rotation.x = -Math.PI / 2; }
// 부엌: 냉장고와 전등
const FRIDGE = { x: -32.6, z: 5.2 };
solid(1.2, 2.2, 1.2, 0xf1f3f5, FRIDGE.x, 1.1, FRIDGE.z);
const fridgeDoor = new THREE.Group(); fridgeDoor.position.set(FRIDGE.x + 0.62, 0, FRIDGE.z - 0.6); scene.add(fridgeDoor);
box(0.08, 2.1, 1.2, 0xdee2e6, 0, 1.1, 0.6, fridgeDoor); box(0.06, 0.6, 0.06, 0x868e96, 0.06, 1.3, 1.05, fridgeDoor);
const fridgeLight = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), glow(0xfff3bf)); fridgeLight.position.set(FRIDGE.x + 0.61, 1.1, FRIDGE.z); fridgeLight.rotation.y = Math.PI / 2; scene.add(fridgeLight);
function setFridge(open) { fridgeDoor.rotation.y = open ? 1.3 : 0; fridgeLight.visible = open; }
box(4, 1, 1, 0xffffff, -28.5, 0.5, 7.2); box(4, 0.06, 1.02, 0x868e96, -28.5, 1.02, 7.2); block(-30.5, 6.7, -26.5, 7.7);
const LAMP = { x: -28.5, z: 4.5 };
cyl(0.02, 0.02, 1.2, 0x495057, LAMP.x, 3.4, LAMP.z);
const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 16, 1, true), new THREE.MeshLambertMaterial({ color: 0x495057, side: THREE.DoubleSide })); lampShade.position.set(LAMP.x, 2.7, LAMP.z); scene.add(lampShade);
const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), glow(0xffe066)); lampBulb.position.set(LAMP.x, 2.5, LAMP.z); scene.add(lampBulb);
const lampGlow = new THREE.PointLight(0xffe8a0, 1.2, 8); lampGlow.position.set(LAMP.x, 2.3, LAMP.z); scene.add(lampGlow);
function setLamp(on) { lampBulb.material.color.setHex(on ? 0xffe066 : 0x868e96); lampGlow.visible = on; }
function setTV(on) { tvScreen.material.color.setHex(on ? 0x4dabf7 : 0x111111); tvPic.visible = on; }
// 복도: 엘리베이터와 계단
const ELEV = { x: -33.7, z: -4 };
box(0.12, 2.6, 1.9, 0xadb5bd, ELEV.x, 1.3, ELEV.z); box(0.14, 2.5, 0.04, 0x495057, ELEV.x + 0.01, 1.3, ELEV.z);
{ const s = textPlane('ELEVATOR ⬆', 0.32, { fs: 44, bg: '#495057', fg: '#fff' }); s.position.set(ELEV.x + 0.1, 2.9, ELEV.z); s.rotation.y = Math.PI / 2; }
const STAIR = { x: -32.6, z: 0.6 };
for (let k = 0; k < 6; k++) solid(1.8 - k * 0.0, 0.3 * (k + 1), 0.5, 0xced4da, STAIR.x, 0.15 * (k + 1), STAIR.z - 1.4 + k * 0.5);
{ const s = textPlane('STAIRS 🪜', 0.32, { fs: 44, bg: '#2f9e44', fg: '#fff' }); s.position.set(STAIR.x + 0.95, 2.6, STAIR.z - 0.2); s.rotation.y = Math.PI / 2; }

// ---------- 동쪽: Eco Center ----------
const ECO = { x: 27, z: -2 };
solid(0.4, 4.5, 20, 0xf4fce3, 34, 2.25, -2);
solid(14, 4.5, 0.4, 0xf4fce3, 27, 2.25, -12); solid(14, 4.5, 0.4, 0xf4fce3, 27, 2.25, 8);
solid(0.5, 4.5, 0.5, 0x2f9e44, 20.2, 2.25, -11.8); solid(0.5, 4.5, 0.5, 0x2f9e44, 20.2, 2.25, 7.8);
box(14.6, 0.4, 20.6, 0xd3f9d8, 27, 4.7, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xebfbee)); fl.rotation.x = -Math.PI / 2; fl.position.set(27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('Eco Center ♻️', 1.0, { fs: 64, bg: '#2f9e44', fg: '#fff' }); s.position.set(19.9, 4.2, -7); s.rotation.y = -Math.PI / 2; }
// 스위치 보드: 전구 6개 (Play Together 1 스위치 먼저 끄기)
box(0.2, 3.2, 9.6, 0x343a40, 33.7, 2.2, -2);
{ const s = textPlane('Switch Board · OFF!', 0.45, { fs: 48, bg: '#ffd43b', fg: '#222' }); s.position.set(33.55, 4.1, -2); s.rotation.y = -Math.PI / 2; }
const ecoBulbs = L.actions.map((a, i) => {
  const z = -6 + (i % 3) * 4, y = i < 3 ? 2.9 : 1.4;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), glow(0xffe066)); b.position.set(33.45, y, z - 0.9); scene.add(b);
  const t = textPlane(a.emoji, 0.6, { fs: 80, bg: '#ffffff' }); t.position.set(33.55, y, z + 0.3); t.rotation.y = -Math.PI / 2;
  const sw = textPlane('ON', 0.3, { fs: 44, bg: '#e03131', fg: '#fff' }); sw.position.set(33.55, y - 0.55, z - 0.9); sw.rotation.y = -Math.PI / 2;
  return { b, sw, id: a.id };
});
function bulbOff(id) {
  const e = ecoBulbs.find(x => x.id === id); if (!e) return;
  e.b.material.color.setHex(0x868e96);
  const { t } = labelCanvas('OFF', { fs: 44, bg: '#2f9e44', fg: '#fff' }); e.sw.material.map = t; e.sw.material.needsUpdate = true;
}
function resetBulbs() { ecoBulbs.forEach(e => { e.b.material.color.setHex(0xffe066); const { t } = labelCanvas('ON', { fs: 44, bg: '#e03131', fg: '#fff' }); e.sw.material.map = t; e.sw.material.needsUpdate = true; }); }
// 그림 카드 탁자
solid(4, 0.9, 1.4, 0xb2f2bb, 27, 0.45, 4.5);
L.actions.forEach((a, i) => { const t = textPlane(a.emoji, 0.4, { fs: 80, bg: '#ffffff', border: '#2f9e44' }); t.position.set(25.4 + (i % 3) * 1.1, 0.92, 4.2 + Math.floor(i / 3) * 0.6); t.rotation.x = -Math.PI / 2; });

// ---------- 북쪽: Story Sea (Let's Save the Earth) ----------
const STORY = { x: 0, z: -34 };
{ const s = textPlane("Let's Save the Earth · Story Sea", 0.9, { fs: 62, bg: '#1864ab', fg: '#fff' }); s.position.set(0, 5, -40.7); }
solid(40, 4, 0.4, 0xd0ebff, 0, 2, -41);
// 바다 (Moby)
const SEA = { x: -11, z: -35 };
{ const w = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshLambertMaterial({ color: 0x339af0, transparent: true, opacity: 0.9 })); w.rotation.x = -Math.PI / 2; w.position.set(SEA.x, 0.04, SEA.z - 0.5); scene.add(w);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.6), mat(0xffe8a1)); sand.rotation.x = -Math.PI / 2; sand.position.set(SEA.x, 0.035, SEA.z + 4.6); scene.add(sand); }
const seaBottles = [];
for (const [dx, dz] of [[-5, -2], [-3, 1], [4, -1], [5.5, 2], [1, -3.2], [-6, 1.8]]) {
  const b = new THREE.Group(); cyl(0.12, 0.12, 0.5, 0xa5d8ff, 0, 0, 0, b); cyl(0.06, 0.06, 0.12, 0x1c7ed6, 0, 0.3, 0, b);
  b.rotation.z = 1.4; b.position.set(SEA.x + dx, 0.15, SEA.z + dz); scene.add(b); seaBottles.push(b);
}
{ const s = textPlane('🐟 Moby', 0.45, { fs: 48, bg: '#ffffff', fg: '#1864ab' }); s.position.set(SEA.x, 2.6, -40.6); }
// 북극 (Lumi)
const ICE = { x: 11, z: -35 };
{ const w = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshLambertMaterial({ color: 0x74c0fc })); w.rotation.x = -Math.PI / 2; w.position.set(ICE.x, 0.03, ICE.z - 0.5); scene.add(w); }
for (const [dx, dz, s] of [[-4, -2, 2.4], [3.5, -2.5, 1.6], [5, 1.5, 1.2], [-1, 1.5, 3]]) { const ice = cyl(s, s * 1.05, 0.3, 0xf8f9fa, ICE.x + dx, 0.15, ICE.z + dz, scene, 7); ice.material = glow(0xe7f5ff); ice.rotation.y = dx; }
{ const sun2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), glow(0xffa94d)); sun2.position.set(ICE.x + 5, 3.8, -40.2); scene.add(sun2); }
{ const s = textPlane('🐻‍❄️ Lumi', 0.45, { fs: 48, bg: '#ffffff', fg: '#1864ab' }); s.position.set(ICE.x, 2.6, -40.6); }

// ---------- 남서: Let's Write 포스터 마당 ----------
const WRITE = { x: -26, z: 30 };
box(16, 0.4, 12, 0xd3f9d8, WRITE.x, 0.2, WRITE.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz);
box(17, 0.4, 13, 0x2b8a3e, WRITE.x, 5.2, WRITE.z);
{ const s = textPlane("Let's Write · Earth Poster", 0.85, { fs: 62, bg: '#2b8a3e', fg: '#fff' }); s.position.set(WRITE.x + 8.6, 4.4, WRITE.z); s.rotation.y = Math.PI / 2; }
solid(0.4, 3.6, 10, 0xf8f9fa, WRITE.x - 7.6, 2, WRITE.z);
{ const p = textPlane('🌏 ' + L.posterSample.join('\n'), 3.0, { fs: 50, bg: '#ffffff', fg: '#2b8a3e', border: '#2b8a3e' }); p.position.set(WRITE.x - 7.35, 2.2, WRITE.z); p.rotation.y = Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x - 1, 0.85, WRITE.z + 3);

// ---------- 남서 아래 길가: 새싹 화분 (Read and Play) ----------
for (let i = 0; i < 6; i++) { const x = -9 - (i % 3) * 1.4, z = 38 + Math.floor(i / 3) * 1.4; cyl(0.35, 0.25, 0.5, 0xc0703a, x, 0.25, z); ball(0.18, 0x51cf66, x, 0.6, z); }
{ const s = textPlane('🌱 Sprouts', 0.4, { fs: 48, bg: '#ffffff', fg: '#2b8a3e' }); s.position.set(-10.4, 1.5, 36.9); s.rotation.y = 0; }

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'can') { cyl(0.16, 0.16, 0.42, 0xe03131, 0, 0.21, 0, g); cyl(0.14, 0.14, 0.02, 0xced4da, 0, 0.43, 0, g); }
  else if (id === 'bottle') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 12), new THREE.MeshLambertMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.8 })); m.position.y = 0.25; g.add(m); cyl(0.06, 0.1, 0.14, 0xa5d8ff, 0, 0.57, 0, g); cyl(0.065, 0.065, 0.06, 0x1c7ed6, 0, 0.66, 0, g); }
  else if (id === 'switch') { box(0.5, 0.7, 0.12, 0xffffff, 0, 0.35, 0, g); box(0.18, 0.26, 0.1, 0x2f9e44, 0, 0.35, 0.08, g); const t = textPlane('OFF', 0.25, { fs: 44, bg: '#2f9e44', fg: '#fff' }, g); t.position.set(0, 0.85, 0); }
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
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  if (waterStream.visible) waterStream.scale.x = 1 + Math.sin(t * 30) * 0.15;
  seaBottles.forEach((b, i) => { b.position.y = 0.15 + Math.sin(t * 1.5 + i) * 0.05; });
  for (const f of fallers) { f.userData.life -= dt; f.position.y += dt * 0.8; f.material.opacity = Math.max(0, f.userData.life); }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { scene.remove(f); return false; } return true; });
}
function puff(x, y, z, text) {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#2f9e44', border: '#2f9e44' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 1.6; scene.add(s); fallers.push(s);
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#eadfca'); R(0, -2, 52, 6, '#eadfca');
  R(-27, -2, 14, 20, '#1098ad', 'Kai 집'); R(27, -2, 14, 20, '#2f9e44', '에코 센터');
  R(SEA.x, -35, 16, 9, '#1c7ed6', '바다'); R(ICE.x, -35, 16, 9, '#74c0fc', '북극');
  R(WRITE.x, WRITE.z, 16, 12, '#2b8a3e', '포스터'); R(FEST.x, FEST.z, 22, 18, '#7048e8', '음악 축제');
  R(BINS.x, BINS.z, 2, 4, '#1c7ed6', ''); R(FOUNT.x, FOUNT.z, 2, 1.4, '#4dabf7', '');
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
const ACT = Object.fromEntries(L.actions.map(a => [a.id, a]));
// 동물 모형 (Moby·Dr. Shark·Lumi·Fox) — makePerson과 같은 이름표·느낌표 구조
function makeAnimal(o) {
  const g = new THREE.Group();
  let top = 1.6;
  if (o.kind === 'fish' || o.kind === 'shark') {
    const shark = o.kind === 'shark', c = o.color, s = shark ? 1.5 : 1;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.45 * s, 18, 14), mat(c)); body.scale.set(0.7, 0.8, 1.4); body.position.y = 0.75; g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.35 * s, 0.5 * s, 4), mat(c)); tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0.75, -0.75 * s); g.add(tail);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.15 * s, 0.4 * s, 4), mat(shark ? c : 0xffd43b)); fin.position.set(0, 0.75 + 0.42 * s, -0.05); g.add(fin);
    for (const x of [-0.2, 0.2]) { ball(0.07 * s, 0xffffff, x * s, 0.85, 0.42 * s, g); ball(0.035 * s, 0x111111, x * s * 1.05, 0.86, 0.47 * s, g); }
    if (shark) { cyl(0.3, 0.3, 0.12, 0xffffff, 0, 1.55, 0.15, g); box(0.2, 0.06, 0.04, 0xe03131, 0, 1.56, 0.42, g); box(0.06, 0.2, 0.04, 0xe03131, 0, 1.56, 0.42, g); }
    top = shark ? 1.9 : 1.4;
  } else { // bear / fox (네 발 동물)
    const bear = o.kind === 'bear', c = o.color, s = bear ? 1.2 : 0.7;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 16, 12), mat(c)); body.scale.set(0.9, 0.8, 1.3); body.position.y = 0.75 * s; g.add(body);
    for (const [x, z] of [[-0.25, -0.35], [0.25, -0.35], [-0.25, 0.35], [0.25, 0.35]]) cyl(0.11 * s, 0.11 * s, 0.5 * s, c, x * s, 0.25 * s, z * s, g);
    const head = ball(0.32 * s, c, 0, 1.15 * s, 0.55 * s, g);
    if (bear) { ball(0.1 * s, c, -0.22 * s, 1.42 * s, 0.5 * s, g); ball(0.1 * s, c, 0.22 * s, 1.42 * s, 0.5 * s, g); ball(0.08 * s, 0x222222, 0, 1.12 * s, 0.86 * s, g); }
    else { for (const x of [-0.15, 0.15]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 0.3 * s, 4), mat(c)); e.position.set(x * s, 1.5 * s, 0.5 * s); g.add(e); } const n = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.35 * s, 8), mat(c)); n.rotation.x = Math.PI / 2; n.position.set(0, 1.08 * s, 0.9 * s); g.add(n); ball(0.05, 0x222222, 0, 1.08 * s, 1.07 * s, g); const tl = ball(0.18 * s, c, 0, 0.9 * s, -0.75 * s, g); tl.scale.z = 1.8; }
    for (const x of [-0.12, 0.12]) ball(0.04 * s + 0.01, 0x111111, x * s, 1.22 * s, 0.82 * s, g);
    top = bear ? 2.0 : 1.3;
    void head;
  }
  if (o.kind === 'bear' || o.kind === 'fox') { const bm = new THREE.MeshLambertMaterial({ color: o.color, emissive: 0x5a5a5a }); g.traverse(m => { if (m.isMesh && m.material === mat(o.color)) m.material = bm; }); }
  const tag = textSprite(o.name, 0.34, { fs: 48, fg: '#1d3557' }); tag.position.y = top; g.add(tag);
  const mark = textSprite('!', 0.5, { fs: 70, bg: '#ffd43b', fg: '#c92a2a', border: '#c92a2a', pad: 18 });
  mark.position.y = top + 0.5; mark.visible = false; mark.userData.baseY = mark.position.y; g.add(mark);
  g.userData.mark = mark;
  return g;
}
function addNPC(id, o, x, z, face = 0) {
  const g = o.kind ? makeAnimal(o) : makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '' };
  return NPC[id];
}
// 집 위치 [x, z, 방향]
const HOME = {
  rani: [20.5, 25, -Math.PI / 2], hajun: [22.5, 23.4, -Math.PI / 2], joel: [22.5, 26.8, -Math.PI / 2],
  kai: [-24.5, -6.5, Math.PI / 2], lily: [-27, -7.6, Math.PI], kaiMom: [-28.5, 2.5, Math.PI / 2],
  green: [23.2, -6, Math.PI / 2],
  moby: [SEA.x + 1.5, -35.5, 0], shark: [SEA.x - 2.5, -34.5, Math.PI / 4],
  lumi: [ICE.x - 1, -33.6, 0], fox: [ICE.x + 2.6, -33.4, -Math.PI / 4],
  sophie: [WRITE.x + 1.5, WRITE.z + 4.4, Math.PI / 2],
  bonus: [-6, -20, 0]
};
const K_POS = [[14, -7], [16.5, -7], [14, -4], [16.5, -4], [14, -1], [16.5, -1]];
L.kids.forEach((k, i) => { HOME[k.id] = [...K_POS[i], -Math.PI / 2]; });

addNPC('rani', { name: 'Rani', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ['That was a nice music show.', '멋진 음악 공연이었어.'] }, ...HOME.rani);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ['Look at the trash on the grass.', '잔디 위의 쓰레기 좀 봐.'] }, ...HOME.hajun);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ['How about turning off the water?', '물을 잠그는 게 어때?'] }, ...HOME.joel);
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ['How about turning off the TV?', 'TV를 끄는 게 어때?'] }, ...HOME.kai);
addNPC('lily', { name: 'Lily', girl: true, shirt: 0xffa94d, hair: 0x2b1d14, scale: 0.8, idle: ["I'm doing my math homework.", '나는 수학 숙제를 하고 있어.'] }, ...HOME.lily);
addNPC('kaiMom', { name: 'Mom', girl: true, shirt: 0x7048e8, skirt: 0x5f3dc4, hair: 0x2b1d14, scale: 1.12, idle: ['We should save energy.', '우리는 에너지를 절약해야 해.'] }, ...HOME.kaiMom);
addNPC('green', { name: 'Ms. Green', girl: true, shirt: 0x2f9e44, skirt: 0x2b8a3e, hair: 0x6d4c41, scale: 1.12, idle: ['We should save the earth.', '우리는 지구를 구해야 해요.'] }, ...HOME.green);
addNPC('moby', { name: 'Moby', kind: 'fish', color: 0xff922b, idle: ['I have a stomachache.', '배가 아파요.'] }, ...HOME.moby);
addNPC('shark', { name: 'Dr. Shark', kind: 'shark', color: 0x868e96, idle: ["What's wrong, Moby?", '어디가 아프니, 모비?'] }, ...HOME.shark);
addNPC('lumi', { name: 'Lumi', kind: 'bear', color: 0xf8f9fa, idle: ["Where is my house? I can't find it.", '내 집이 어디 있지? 찾을 수가 없어.'] }, ...HOME.lumi);
addNPC('fox', { name: 'Fox', kind: 'fox', color: 0xe9ecef, idle: ["It's winter, but it's very warm.", '겨울인데, 매우 따뜻해.'] }, ...HOME.fox);
addNPC('sophie', { name: 'Sophie', girl: true, shirt: 0x40c057, hair: 0xd4a017, idle: ['Small actions can save the earth.', '작은 실천이 지구를 구할 수 있어.'] }, ...HOME.sophie);
addNPC('bonus', { name: 'Shelly', girl: true, shirt: 0x8e24aa, hair: 0xc0392b, idle: ['Look at the trash. We should recycle cans and bottles.', '쓰레기 좀 봐. 우리는 캔과 병을 재활용해야 해.'] }, ...HOME.bonus);
L.kids.forEach((k, i) => addNPC(k.id, { name: k.name, girl: k.girl, shirt: k.shirt, hair: [0x111111, 0xa0522d, 0x3b2a1a, 0xd4a017, 0x222222, 0x111111][i], scale: 0.9, idle: [`How about ${k.action}?`, `${ACT[k.action].ko}는 어때?`] }, ...HOME[k.id]));
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
const HA = (id) => `How about ${id}?`;
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 음악 축제 뒤 청소', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 에코 센터 스위치', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. Kai네 에너지 지킴이', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 지구를 구해요', book: 'Before/After You Read', start: stage5 },
  { title: '6. 환경 보호 포스터', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  waterStream.visible = S.stage === 0;
  setTV(S.stage <= 2); setFridge(false); setLamp(true);
  if (S.stage <= 1) resetBulbs(); else ecoBulbs.forEach(e => bulbOff(e.id));
  seaBottles.forEach(b => { b.visible = S.stage <= 4; });
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
const otherActs = (right, n = 3) => shuffle(L.actions.map(a => a.id).filter(x => x !== right)).slice(0, n);
// 스위치(OFF) 물건 하나 놓기
function switchAt(x, z, label, done) {
  setObj(label, () => [x, z]);
  addItem(itemModel('switch'), x, z, (it) => { removeItem(it); beep('get'); puff(x, 2, z, 'OFF'); done(); }, { y: 0.9, r: 1.3, spin: 0.6 });
}

// ---- 1. Fun Talk 1 ----
const TRASH = [['can', 19, 31.5], ['bottle', 23, 33.5], ['can', 28, 31], ['bottle', 31, 26], ['can', 27.5, 21], ['bottle', 31.5, 33.5]];
function stage1() {
  setObj('🎵 남동쪽 <b>Music Festival</b>의 <b>Rani</b>에게 가요', npcAt('rani')); mark('rani');
  NPC.rani.talk = async () => {
    mark('rani', false); NPC.rani.talk = null;
    await readLines(L.funTalk1a);
    await ask('나', 'Rani가 되어 캔과 병을 모아 두자고 권유해 보세요. 🥫🧴', '알맞은 말을 고르세요.', ['Sounds good. How about putting the cans and bottles here?', "Sounds good. What's wrong?", 'Sounds good. I have a stomachache.', 'Sounds good. Go to bed early.'], { me: true });
    await say('Joel', "Okay. I'll put the cans here.", '좋아. 나는 캔을 여기에 둘게.');
    await say('Hajun', "I'll put the bottles here.", '나는 병을 여기에 둘게.');
    await say('Rani', "Great. Let's clean up.", '좋아. 청소하자.');
    await ask('', 'Rani가 친구들에게 권유한 일은 무엇인가요?', 'Fun Talk 1 · 1번 문제', ['캔과 병을 여기에 모아 두기', '음악 공연 다시 보기', '물 마시러 가기', '사진 찍기'], { sayIt: false });
    await say('', '', '🥫🧴 잔디밭에 떨어진 캔 3개와 병 3개를 주워 오세요. 가까이 가면 주워져요.', { btn: '주울게!' });
    closeDlg();
    placeNPC('joel', BINS.x + 1.3, BINS.z - 1.2, -Math.PI / 2); placeNPC('hajun', BINS.x + 1.3, BINS.z + 1.2, -Math.PI / 2); placeNPC('rani', BINS.x + 3, BINS.z + 3.5, -Math.PI / 2);
    stageState.got = { can: 0, bottle: 0 };
    const upd = () => {
      const n = stageState.got.can + stageState.got.bottle;
      held = n ? { kind: 'bag', label: `🥫 ${stageState.got.can}/3 · 🧴 ${stageState.got.bottle}/3` } : null; refreshHUD();
      if (n < TRASH.length) setObj(`🗑 잔디밭의 쓰레기를 주워요 (${n}/6)`, nearestItem);
      else s1bins();
    };
    TRASH.forEach(([k, x, z]) => {
      const g = itemModel(k); g.scale.setScalar(1.8);
      addItem(g, x, z, (it) => { removeItem(it); stageState.got[k]++; beep('get'); upd(); }, { y: 0.5, r: 1.3, spin: 1 });
    });
    upd();
  };
}
function s1bins() {
  setObj('🥫 분리수거함 옆 <b>Joel</b>에게 캔을 줘요', npcAt('joel')); mark('joel');
  NPC.joel.talk = async () => {
    mark('joel', false); NPC.joel.talk = null;
    await ask('Joel', 'Which bin is for the cans?', '캔은 어느 통에 넣을까요?', ['🔵 CANS', '🟢 BOTTLES'], { noShuffle: true, sayIt: false });
    stageState.got.can = 0; held = { kind: 'bag', label: `🧴 ${stageState.got.bottle}/3` }; refreshHUD();
    for (let i = 0; i < 3; i++) { const c = itemModel('can'); c.position.set(BINS.x - 0.15 + i * 0.15, 1.35, BINS.z - 1.2); addDecor(c); }
    await say('Joel', 'Thanks!', '고마워!');
    closeDlg();
    setObj('🧴 <b>Hajun</b>에게 병을 줘요', npcAt('hajun')); mark('hajun');
    NPC.hajun.talk = async () => {
      mark('hajun', false); NPC.hajun.talk = null; held = null; refreshHUD(); good();
      for (let i = 0; i < 3; i++) { const c = itemModel('bottle'); c.position.set(BINS.x - 0.15 + i * 0.15, 1.35, BINS.z + 1.2); addDecor(c); }
      await say('Joel', "Wow, it's clean now. I feel so great.", '와, 이제 깨끗해. 기분이 정말 좋아.');
      await say('Hajun', "Oh, I'm thirsty. Let's drink some water over there.", '아, 목말라. 저기서 물 좀 마시자.');
      await say('Rani', 'Okay.', '좋아.');
      closeDlg(); s1water();
    };
  };
}
function s1water() {
  waterStream.visible = true;
  placeNPC('hajun', FOUNT.x - 1.6, FOUNT.z + 0.6, Math.PI / 2); placeNPC('joel', FOUNT.x + 0.2, FOUNT.z + 2.6, Math.PI); placeNPC('rani', FOUNT.x - 2.6, FOUNT.z + 3.2, Math.PI);
  setObj('🚰 <b>수돗가</b>의 <b>Hajun</b>에게 가요', npcAt('hajun')); mark('hajun');
  NPC.hajun.talk = async () => {
    mark('hajun', false); NPC.hajun.talk = null;
    await say('', '', '💦 하준이가 물을 세게 틀어 놓고 마시고 있어요!', {});
    await ask('나', 'Joel이 되어 하준이에게 권유해 보세요.', '알맞은 말을 고르세요.', [HA('turning off the water'), HA('using the stairs'), HA('recycling paper'), "Let's drink some water."], { me: true, hint: 'turning off the water = 물 잠그기' });
    await say('Hajun', "You're right.", '네 말이 맞아.');
    waterStream.visible = false; puff(FOUNT.x, 2, FOUNT.z, 'OFF'); beep('get');
    await say('Hajun', "Oh, you're using your bottle. That's great!", '오, 너는 네 물병을 쓰는구나. 멋지다!');
    await ask('', 'Hajun turned off the ______.', '하준이는 Joel의 권유를 듣고 무엇을 했나요?', ['water', 'light', 'TV', 'music'], { hint: '🚰' });
    await say('', '', '🌏 Fun Talk 1 완료! How about ~? 는 “~하는 게 어때?” 하고 권유하는 말이에요.', { btn: '다음 미션 ▶' });
    nextStage();
  };
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  setObj('♻️ 동쪽 <b>Eco Center</b>의 <b>Ms. Green</b>에게 가요', npcAt('green')); mark('green');
  NPC.green.talk = async () => {
    mark('green', false); NPC.green.talk = null;
    await say('Ms. Green', 'Welcome to the Eco Center! Listen to my friends.', '에코 센터에 온 걸 환영해요! 친구들의 말을 들어 봐요.');
    await say('', '', 'Listen and Do · 센터 앞 친구 6명의 권유를 잘 듣고, 알맞은 그림 카드를 골라요.', { btn: '시작!' });
    closeDlg(); stageState.done = {};
    const left = () => L.kids.filter(x => !stageState.done[x.id]).map(x => x.id);
    L.kids.forEach(k => {
      mark(k.id);
      NPC[k.id].talk = async () => {
        if (stageState.done[k.id]) { await say(k.name, 'Thank you!', '고마워!'); closeDlg(); return; }
        mark(k.id, false);
        await say(k.name, HA(k.action), '잘 듣고 알맞은 그림을 골라요. (🔊 다시 듣기)', { listen: true, koAlways: true });
        await ask('', `🔢 ${k.name}의 권유에 맞는 그림 카드는?`, '알맞은 그림을 고르세요.', [k.action, ...otherActs(k.action)].map(a => `${ACT[a].emoji} ${ACT[a].ko}`), { sayIt: false, hint: '🔊 다시 듣기' });
        speak(HA(k.action), k.name);
        stageState.done[k.id] = 1; closeDlg();
        const n = Object.keys(stageState.done).length;
        if (n < L.kids.length) setObj(`🔢 친구의 권유를 듣고 그림을 골라요 (${n}/6)`, () => nearestOf(left()));
        else s2pt1();
      };
    });
    setObj('🔢 센터 앞 친구의 권유를 듣고 그림을 골라요 (0/6)', () => nearestOf(left()));
  };
}
function s2pt1() {
  setObj('💡 <b>Ms. Green</b>에게 돌아가요', npcAt('green')); mark('green');
  NPC.green.talk = async () => {
    mark('green', false); NPC.green.talk = null;
    await say('Ms. Green', "Great job! Let's play Switch Off!", '잘했어요! 스위치 먼저 끄기 놀이를 해요!');
    await say('', '', 'Play Together 1 · 스위치 보드의 그림 카드를 보고 알맞게 권유하면 전구가 꺼져요. 💡→OFF', { btn: '시작!' });
    for (const a of shuffle(L.actions)) {
      await ask('Ms. Green', `${a.emoji}  ?`, `그림 카드: ${a.ko}. 알맞은 권유를 고르세요.`, [HA(a.id), ...otherActs(a.id).map(HA)], { me: true });
      bulbOff(a.id); beep('get');
    }
    await say('Ms. Green', 'All switches are off. Wonderful!', '스위치가 모두 꺼졌어요. 훌륭해요!');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  setTV(true);
  setObj("🏢 서쪽 <b>Kai's Home</b>의 <b>Kai</b>에게 가요", npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await say('', '', '📺 Lily가 TV를 켜 놓은 채 수학 숙제를 하고 있어요.', {});
    await say('Kai', 'Lily, what are you doing?', 'Lily, 뭐 하고 있니?');
    await say('Lily', "I'm doing my math homework.", '수학 숙제를 하고 있어.');
    await ask('나', 'Kai가 되어 Lily에게 권유해 보세요. 📺', '알맞은 말을 고르세요.', [HA('turning off the TV'), HA('watching TV'), HA('using a cup'), "What's wrong?"], { me: true });
    await say('Lily', 'Okay.', '알았어.');
    closeDlg();
    switchAt(TV.x + 1.9, -10.8, '📺 TV 옆 <b>OFF 스위치</b>를 눌러 TV를 꺼요', () => { setTV(false); good(); s3fridge(); });
  };
}
function s3fridge() {
  setFridge(true);
  placeNPC('lily', FRIDGE.x + 1.6, FRIDGE.z + 1.3, -Math.PI / 2); placeNPC('kaiMom', -29.2, 4.2, -Math.PI / 2);
  { const ic = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 10), mat(0xd7a35a)); c.rotation.x = Math.PI; c.position.y = 0.1; ic.add(c); ball(0.08, 0xffc9de, 0, 0.23, 0, ic); ic.position.set(FRIDGE.x + 1.85, 1.0, FRIDGE.z + 1.3); addDecor(ic); }
  setObj('🧊 부엌의 <b>Mom</b>에게 가요 (냉장고 문이 열려 있어요!)', npcAt('kaiMom')); mark('kaiMom');
  NPC.kaiMom.talk = async () => {
    mark('kaiMom', false); NPC.kaiMom.talk = null;
    await say('', '', '🍦 Lily가 아이스크림을 꺼낸 뒤 냉장고 문을 닫지 않았어요.', {});
    await say('Mom', 'Lily, close the door, please.', 'Lily, 문 좀 닫아 주렴.');
    await say('Lily', 'Okay, Mom.', '네, 엄마.');
    await ask('나', '엄마가 되어 왜 문을 닫아야 하는지 말해요. ⚡', '알맞은 말을 고르세요.', ['Good. We should save energy.', 'Good. We should save water.', 'Good. We should recycle things.'], { me: true });
    closeDlg();
    switchAt(FRIDGE.x + 1.5, FRIDGE.z - 0.8, '🧊 <b>냉장고</b> 앞의 OFF 표시로 가서 문을 닫아요', () => { setFridge(false); good(); s3stairs(); });
  };
}
function s3stairs() {
  placeNPC('kai', ELEV.x + 1.1, ELEV.z, Math.PI / 2); placeNPC('lily', -29.4, -2.6, -Math.PI / 2);
  setObj('🛗 엘리베이터 앞 Kai를 본 <b>Lily</b>에게 가요', npcAt('lily')); mark('lily');
  NPC.lily.talk = async () => {
    mark('lily', false); NPC.lily.talk = null;
    await say('', '', '🛗 Kai가 엘리베이터 앞에 서 있어요.', {});
    await ask('나', 'Lily가 되어 Kai에게 권유해 보세요. 🪜', '알맞은 말을 고르세요.', ['Kai, ' + HA('using the stairs'), 'Kai, ' + HA('using a cup'), 'Kai, ' + HA('recycling paper'), 'Kai, ' + HA('turning off the water')], { me: true });
    await say('Kai', 'Oh, okay.', '아, 알았어.');
    await ask('나', 'Lily가 되어 이유를 말해요.', '알맞은 말을 고르세요.', ['We should save energy.', 'We should recycle things.', 'We should save water.'], { me: true });
    placeNPC('kai', STAIR.x + 1.6, STAIR.z + 0.9, Math.PI / 2); puff(STAIR.x, 2.5, STAIR.z, '🪜');
    await say('', '', '🪜 Kai가 엘리베이터 대신 계단으로 가요.', {});
    closeDlg(); s3light();
  };
}
function s3light() {
  setLamp(true);
  placeNPC('kaiMom', -26.8, 1.2, Math.PI); placeNPC('lily', -25.6, 4.6, -Math.PI / 2);
  setObj('💡 부엌 불이 켜져 있어요. <b>Lily</b>에게 가요', npcAt('lily')); mark('lily');
  NPC.lily.talk = async () => {
    mark('lily', false); NPC.lily.talk = null;
    await say('', '', '💡 엄마가 부엌 불을 켜 놓은 채 거실로 가려고 해요.', {});
    await ask('나', 'Lily가 되어 엄마에게 부탁해요.', '알맞은 말을 고르세요.', ['Mom, turn off the light, please.', 'Mom, turn on the TV, please.', 'Mom, close the door, please.'], { me: true });
    await say('Mom', 'Oh, okay.', '아, 알았다.');
    await say('Lily', 'We should save energy.', '우리는 에너지를 절약해야 해요.');
    await say('Mom', "You're right.", '네 말이 맞아.');
    closeDlg();
    switchAt(LAMP.x - 1.6, LAMP.z - 1.4, '💡 부엌의 <b>전등 스위치(OFF)</b>를 눌러요', async () => {
      setLamp(false); good();
      busy = true;
      await ask('', 'Kai가 Lily에게 권유한 일은 무엇인가요?', 'Fun Talk 2 · 1번 문제', ['TV 끄기', '계단 이용하기', '컵 사용하기'], { sayIt: false });
      await ask('', 'Lily said, "We should ______."', 'Lily는 Kai와 엄마에게 무엇을 해야 한다고 말했나요?', ['save energy', 'save water', 'recycle things']);
      busy = false; closeDlg(); s3pt2();
    });
  };
}
function s3pt2() {
  setObj('🃏 계단 옆 <b>Kai</b>와 환경 보호 카드 놀이를 해요', npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await say('Kai', "Let's play a card game! Show your card.", '카드 놀이를 하자! 네 카드를 보여 줘.');
    await say('', '', 'Read and Talk · Play Together 2 · 내 카드에 맞게 권유하고, 해야 하는 일을 말해요.', { btn: '시작!' });
    for (const a of shuffle(L.actions).slice(0, 4)) {
      await ask('나', `🃏 내 카드: ${a.emoji}`, `${a.ko} 카드예요. 권유하는 말을 고르세요.`, [HA(a.id), ...otherActs(a.id).map(HA)], { me: true });
      await say('Kai', 'Okay.', '좋아.');
      await ask('나', `${HA(a.id)} We should ______.`, '해야 하는 일을 고르세요.', L.shoulds.map(s => s.id).sort((x, y) => (y === a.should) - (x === a.should)), { right: a.should, me: true, sayIt: false });
      speak('We should ' + a.should + '.', '나');
    }
    await say('Kai', 'We are a great eco team!', '우리는 멋진 환경 지킴이 팀이야!');
    nextStage();
  };
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('green', 0, 11, Math.PI);
  setObj('🧱 마을 가운데의 <b>Ms. Green</b>에게 가요', npcAt('green')); mark('green');
  NPC.green.talk = async () => {
    mark('green', false); NPC.green.talk = null;
    await say('Ms. Green', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '마을 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['paper?', 'water.', 'recycling', 'a', 'cup?', 'things.', 'energy.', 'save', 'using', 'off', 'light?'].filter(w => !words.includes(w));
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

// ---- 5. Let's Save the Earth (Reading) ----
function stage5() {
  setObj('🐟 북쪽 <b>Story Sea</b>의 <b>Dr. Shark</b>에게 가요', npcAt('shark')); mark('shark');
  NPC.shark.talk = async () => {
    mark('shark', false); NPC.shark.talk = null;
    await say('', '', '📖 Let\'s Save the Earth · 권유하는 표현(How about ~?)에 귀 기울이며 읽어요.', {});
    await readLines(L.reading.moby);
    await ask('', "What's wrong with Moby?", '모비는 어디가 아픈가요?', ['Moby has a stomachache.', 'Moby has a headache.', 'Moby has a toothache.'], { sayIt: false });
    await ask('', 'Moby ate many ______.', '모비는 무엇을 많이 먹었나요?', ['plastic bottles', 'cookies', 'fish'], { sayIt: false });
    await ask('', 'What can we do for Moby?', 'After You Read A · 해결 방법을 고르세요.', ['🥫 ' + HA('recycling cans and bottles'), '💡 ' + HA('turning off the lights'), '🪜 ' + HA('using the stairs')], { sayIt: false });
    seaBottles.forEach(b => { b.visible = false; }); puff(SEA.x, 2, SEA.z, '♻️'); beep('get');
    await say('Moby', 'Thank you! I feel better.', '고마워요! 나아졌어요.');
    closeDlg();
    setObj('🐻‍❄️ 오른쪽 <b>북극</b>의 <b>Lumi</b>에게 가요', npcAt('lumi')); mark('lumi');
    NPC.lumi.talk = async () => {
      mark('lumi', false); NPC.lumi.talk = null;
      await readLines(L.reading.lumi);
      await ask('', "It's winter, and it's very cold.", '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { right: '❌ X (틀려요)', noShuffle: true, sayIt: false, hint: "It's winter, but it's very ______." });
      await ask('', "Lumi can't find the house.", '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { noShuffle: true, sayIt: false });
      await say('', '', 'After You Read B · 글의 내용에 맞게 대화를 완성해요.', { btn: '시작' });
      await ask('', 'What can we do for Moby? How about ______ cans and bottles?', '빈칸에 알맞은 말', ['recycling', 'using', 'turning'], { sayIt: false });
      await ask('', "You're right. We should ______ things.", '빈칸에 알맞은 말', ['recycle', 'save', 'use'], { sayIt: false });
      await ask('', "Let's help Lumi, too. How about ______ the lights?", '빈칸에 알맞은 말', ['turning off', 'using', 'recycling'], { sayIt: false });
      await ask('', 'Okay. We should ______ energy.', '빈칸에 알맞은 말', ['save', 'recycle', 'use'], { sayIt: false });
      speak('How about turning off the lights? We should save energy.', 'Narrator');
      await say('Lumi', 'Thank you! We should save the earth.', '고마워요! 우리는 지구를 구해야 해요.');
      nextStage();
    };
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("✏️ 남서쪽 <b>Earth Poster</b> 마당의 <b>Sophie</b>에게 가요", npcAt('sophie')); mark('sophie');
  NPC.sophie.talk = async () => {
    mark('sophie', false);
    await say('Sophie', 'Read my poster!', '내 포스터를 읽어 줘!');
    for (const l of L.posterSample) await say('Sophie', l, '');
    await ask('', '포스터에서 “해야 하는 일”은?', '에너지 절약 포스터예요.', ['We should save energy.', 'We should save water.', 'We should recycle things.']);
    await ask('', '포스터에서 “권유하는 일”이 아닌 것은?', 'How about ~? 문장을 찾아보세요.', [HA('recycling paper'), HA('turning off the lights'), HA('using the stairs')], { sayIt: false });
    await say('Sophie', 'Now, make your own poster!', '이제 너만의 환경 보호 포스터를 만들어 봐!', { btn: '포스터 만들기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const shOpt = L.shoulds.map(s => `<option value="${s.id}">${s.emoji} ${s.id} (${s.ko})</option>`).join('');
  const acOpt = L.actions.map(a => `<option value="${a.id}">${a.emoji} ${a.id} (${a.ko})</option>`).join('');
  $('#wSh').innerHTML = shOpt; $('#wA1').innerHTML = acOpt; $('#wA2').innerHTML = acOpt;
  $('#wSh').value = 'save water'; $('#wA1').value = 'turning off the water'; $('#wA2').value = 'using a cup';
  if (S.card) { $('#wName').value = S.card.name; $('#wSh').value = S.card.sh; $('#wA1').value = S.card.a1; $('#wA2').value = S.card.a2; }
  const upd = () => { $('#wPreview').innerHTML = posterHTML(posterData()); };
  f.oninput = upd; f.onchange = upd; upd();
  $('#wRead').onclick = () => speak(posterText(posterData()).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = posterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.name)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if (c.a1 === c.a2) { toast('권유하는 일 두 가지를 서로 다르게 골라 주세요.'); return; }
    if (ACT[c.a1].should !== c.sh || ACT[c.a2].should !== c.sh) { toast(`“We should ${c.sh}.”와 어울리는 권유를 골라 주세요. 💡`); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(posterText(c).join(' '), '나');
    await say('Sophie', 'What a great poster! Small actions can save the earth.', '멋진 포스터야! 작은 실천이 지구를 구할 수 있어.');
    nextStage(); showEnd();
  };
}
function posterData() { return { name: $('#wName').value.trim(), sh: $('#wSh').value, a1: $('#wA1').value, a2: $('#wA2').value }; }
function posterText(c) {
  return ['The earth is sick.', 'We should save the earth.', HA(c.a1), HA(c.a2), `We should ${c.sh}.`, 'Act now.', 'Small actions can save the earth.'];
}
function posterHTML(c) {
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const e1 = ACT[c.a1] ? ACT[c.a1].emoji : '', e2 = ACT[c.a2] ? ACT[c.a2].emoji : '';
  return '<div class="cardPrev poster"><div class="pTop">🌏 ' + e1 + ' ' + e2 + '</div>' + posterText(c).map((l, i) => `<div class="${i === 0 || i === 5 ? 'pBig' : ''}">${esc(l)}</div>`).join('') + `<div class="pBy">by ${esc(c.name || '____')}</div></div>`;
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>sh 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · sh 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? posterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? posterText(S.card).join(' ') + ' (by ' + S.card.name + ')' : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 sh 코인 ----
const TH_SPOTS = [[-38, 14], [38, -32], [-24, -38], [38, 18], [-36, -36], [-38, 40]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('sh', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('sh', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Shelly');
      toast(`🪙 sh 코인: <b>${w.replace('sh', '<u>sh</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 sh 코인을 모두 모았어요! Look at the trash. We should recycle cans and bottles.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Shelly', "Hi! I'm Shelly. Look at the trash. We should recycle cans and bottles.", '안녕! 나는 Shelly야. 쓰레기 좀 봐. 우리는 캔과 병을 재활용해야 해.');
  await say('Shelly', 'Listen: trash, should, Shelly. sh, sh, sh!', 'Sounds and Letters · sh 소리를 들어 보세요.');
  await say('', '', `🪙 마을 구석구석에 숨은 sh 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
