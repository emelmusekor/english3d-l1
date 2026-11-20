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
const SAVE_KEY = 'english3d_l1_v1';
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
  Kai: [0, 1.1], Nara: [1, 1.25], Jenny: [1, 1.5], 'Ms. White': [1, 1.0], Hajun: [0, 1.1], Olivia: [1, 1.3], Joel: [0, 1.15],
  Miso: [1, 1.3], Julia: [1, 1.25], Kamal: [0, 1.1], Jiho: [0, 1.1], Beth: [1, 1.3], Tom: [0, 1.2], Amy: [1, 1.5], Leo: [0, 1.15], Yuna: [1, 1.35], Mia: [1, 1.2], '나': [0, 1.0]
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
  mark.position.y = 2.75 + (o.hat ? 0.4 : 0); mark.visible = false; g.add(mark);
  g.userData.mark = mark;
  return g;
}

// ---------------- 세계 만들기 ----------------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8bc66a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const plaza = new THREE.Mesh(new THREE.PlaneGeometry(56, 74), mat(0xe9dcc0)); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.01, 4); scene.add(plaza);
// 담장
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
// 교문
solid(1, 4, 1, 0x8d6e63, -4, 2, FEN); solid(1, 4, 1, 0x8d6e63, 4, 2, FEN);
const gateSign = textPlane('Dream Elementary School', 1.0, { fs: 60, bg: '#1d3557', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1); // 교문 밖으로 못 나가게
// 나무
function tree(x, z, s = 1) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 * s, 3.4 * s, 10), mat(0x3f9142)); c.position.set(x, 3.3 * s, z); scene.add(c);
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -43, 1 + (i % 3) * 0.1); tree(-43, i, 1.1); tree(43, i + 3, 1); }
for (const x of [-38, -30, -14, 14, 30, 38]) tree(x, 42, 0.9);
// 분수
cyl(3, 3.2, 0.8, 0xb0bec5, 0, 0.4, 6, scene, 24); cyl(2.6, 2.6, 0.82, 0x64b5f6, 0, 0.42, 6, scene, 24); cyl(0.4, 0.5, 2.2, 0xcfd8dc, 0, 1.1, 6); ball(0.6, 0x90caf9, 0, 2.4, 6);
block(-3, 3, 3, 9);
// 벤치
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-8, 14.6); bench(8, 14.6);

// 교실 건물 (북쪽)
const ROOM_W = 9, Z_FRONT = -30, Z_BACK = -38, X0 = -27;
const roomInfo = {};
solid(54.4, 4, 0.4, 0xf4e1c1, 0, 2, Z_BACK);
box(55, 0.5, 9, 0xc0504d, 0, 4.25, (Z_FRONT + Z_BACK) / 2);
const roomFloor = new THREE.Mesh(new THREE.PlaneGeometry(54, 8), mat(0xd7b98e)); roomFloor.rotation.x = -Math.PI / 2; roomFloor.position.set(0, 0.02, -34); scene.add(roomFloor);
L.roomOrder.forEach((gr, i) => {
  const cx = X0 + ROOM_W * i + ROOM_W / 2;
  roomInfo[gr] = { cx, x1: cx - 4.2, x2: cx + 4.2, z1: Z_BACK + 0.4, z2: Z_FRONT - 0.3 };
  solid(0.4, 4, 8, 0xf4e1c1, X0 + ROOM_W * i, 2, -34);
  // 앞벽 (문 3m)
  solid(3, 4, 0.4, 0xf4e1c1, cx - 3, 2, Z_FRONT); solid(3, 4, 0.4, 0xf4e1c1, cx + 3, 2, Z_FRONT);
  box(3, 1, 0.4, 0xf4e1c1, cx, 3.5, Z_FRONT);
  const sign = textPlane(gr + ' grade', 0.75, { fs: 64, bg: '#2a9d8f', fg: '#fff', minW: 420 }); sign.position.set(cx, 3.5, Z_FRONT + 0.22);
  roomInfo[gr].sign = sign;
  // 칠판·책상
  box(4, 1.4, 0.1, 0x2e5e3e, cx, 2, Z_BACK + 0.3);
  const bt = textPlane(gr.toUpperCase() + ' GRADE', 0.45, { fs: 54, bg: null, fg: '#ffffff' }); bt.position.set(cx, 2.1, Z_BACK + 0.37);
  for (const dx of [-2.2, 0, 2.2]) for (const dz of [-35.6, -33.2]) { box(1.2, 0.08, 0.7, 0xdeb887, cx + dx, 0.75, dz); box(0.08, 0.75, 0.08, 0x777777, cx + dx, 0.37, dz); }
});
solid(0.4, 4, 8, 0xf4e1c1, -X0, 2, -34);

// 동아리 부스
const boothInfo = {};
const BOOTHS = { book: [-1, -14], history: [-1, -2], badminton: [-1, 10], guitar: [1, -14], dance: [1, -2], cooking: [1, 10] };
const signMat = { color: '#fff' };
for (const [id, [side, z]] of Object.entries(BOOTHS)) {
  const xo = side * 24.5, xb = side * 31.5, cx = side * 28;
  const col = { book: 0x8ecae6, history: 0xd4a373, badminton: 0xb5e48c, guitar: 0xffafcc, dance: 0xcdb4db, cooking: 0xffd6a5 }[id];
  solid(0.4, 3.2, 8, col, xb, 1.6, z);
  solid(7, 3.2, 0.4, col, cx, 1.6, z - 4); solid(7, 3.2, 0.4, col, cx, 1.6, z + 4);
  box(7.6, 0.3, 8.6, 0xffffff, cx, 3.35, z);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(7, 8), mat(id === 'dance' ? 0x5e548e : 0xf1e3d3)); fl.rotation.x = -Math.PI / 2; fl.position.set(cx, 0.025, z); scene.add(fl);
  boothInfo[id] = { side, z, cx, xo, x1: Math.min(xo, xb) + 0.3, x2: Math.max(xo, xb) - 0.3, z1: z - 3.6, z2: z + 3.6, sign: null };
  buildProps(id, cx, z, side);
}
function setBoothSign(id, text, done) {
  const b = boothInfo[id];
  if (b.sign) { scene.remove(b.sign); b.sign.geometry.dispose(); }
  const s = textPlane(text, 0.7, { fs: 62, bg: done ? '#e76f51' : '#adb5bd', fg: '#fff', minW: 460 });
  s.position.set(b.xo + b.side * -0.05, 3.6, b.z); s.rotation.y = -b.side * Math.PI / 2;
  scene.add(s); b.sign = s;
}
function buildProps(id, cx, z, side) {
  const bx = cx + side * 2.6;
  if (id === 'book') {
    for (const dz of [-2, 0, 2]) {
      box(0.6, 2.4, 1.8, 0x8d6e63, bx, 1.2, z + dz);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) box(0.4, 0.5, 0.18, [0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0x6a4c93][(k + r) % 5], bx - side * 0.15, 0.55 + r * 0.75, z + dz - 0.7 + k * 0.35);
    }
    box(1.6, 0.1, 1.2, 0xdeb887, cx - side * 0.5, 0.8, z); box(0.6, 0.06, 0.8, 0xffffff, cx - side * 0.5, 0.88, z);
  } else if (id === 'history') {
    for (const dz of [-2.5, 2.5]) cyl(0.3, 0.35, 3, 0xe0d6c8, bx, 1.5, z + dz);
    // 첨성대 모양 탑
    for (let i = 0; i < 6; i++) cyl(0.75 - i * 0.07 + (i > 3 ? 0.1 : 0), 0.78 - i * 0.07 + (i > 3 ? 0.1 : 0), 0.4, 0xbcaaa4, cx, 0.2 + i * 0.4, z);
    box(1.2, 0.2, 1.2, 0x8d6e63, cx, 2.5, z);
    const scroll = textPlane('OLD MAP', 0.5, { fs: 48, bg: '#f1dca7', fg: '#6d4c41' }); scroll.position.set(bx - side * 0.4, 2, z); scroll.rotation.y = -side * Math.PI / 2;
    block(cx - 0.8, z - 0.8, cx + 0.8, z + 0.8);
  } else if (id === 'badminton') {
    cyl(0.05, 0.05, 1.6, 0x555555, cx, 0.8, z - 3); cyl(0.05, 0.05, 1.6, 0x555555, cx, 0.8, z + 3);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.7), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    net.position.set(cx, 1.25, z); net.rotation.y = Math.PI / 2; scene.add(net);
    for (const dz of [-1.5, 1.5]) {
      const rk = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 20), mat(0xe63946)); rk.position.set(bx, 1.6, z + dz); rk.rotation.y = Math.PI / 2; scene.add(rk);
      box(0.06, 0.6, 0.06, 0x333333, bx, 1.05, z + dz);
    }
    const sh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 10), mat(0xffffff)); sh.position.set(cx - side * 1.5, 0.15, z + 1); scene.add(sh);
    block(cx - 0.1, z - 3, cx + 0.1, z + 3);
  } else if (id === 'guitar') {
    for (const dz of [-1.8, 0, 1.8]) {
      const g = new THREE.Group();
      const c1 = ball(0.42, 0xd2691e, 0, 0.6, 0, g); c1.scale.z = 0.35;
      const c2 = ball(0.32, 0xd2691e, 0, 1.15, 0, g); c2.scale.z = 0.35;
      ball(0.12, 0x222222, 0, 0.95, 0.12, g).scale.z = 0.2;
      box(0.1, 1.1, 0.06, 0x5d4037, 0, 1.85, 0, g); box(0.18, 0.25, 0.08, 0x3e2723, 0, 2.45, 0, g);
      g.position.set(bx, 0.2, z + dz); g.rotation.y = -side * Math.PI / 2; g.rotation.z = side * 0.15; scene.add(g);
    }
    const note = textSprite('♪ ♫', 0.6, { fs: 70, bg: null, fg: '#d6336c' }); note.position.set(cx, 2.6, z); scene.add(note);
  } else if (id === 'dance') {
    const cols = [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), mat(cols[(i + j * 2) % 5])); t.rotation.x = -Math.PI / 2; t.position.set(cx - 2.1 + i * 1.4, 0.03, z - 2.4 + j * 1.6); scene.add(t); }
    const disco = ball(0.45, 0xdddddd, cx, 2.7, z); disco.material = new THREE.MeshLambertMaterial({ color: 0xeeeeee, emissive: 0x333333 });
    box(0.05, 2.4, 6, 0xcfe8ff, bx + side * 0.6, 1.3, z);
  } else if (id === 'cooking') {
    box(1.2, 1, 3.4, 0xffffff, bx, 0.5, z); box(1.2, 0.05, 3.4, 0x444444, bx, 1.02, z);
    cyl(0.35, 0.35, 0.45, 0x9e9e9e, bx, 1.27, z - 0.8); cyl(0.3, 0.3, 0.12, 0x616161, bx, 1.1, z + 0.8);
    box(1.6, 0.1, 1.2, 0xdeb887, cx - side * 0.5, 0.8, z); box(0.1, 0.8, 0.1, 0x777777, cx - side * 0.5, 0.4, z);
    ball(0.15, 0xff3b30, cx - side * 0.5, 0.95, z - 0.3); ball(0.15, 0xffcc00, cx - side * 0.3, 0.95, z + 0.2); ball(0.15, 0x34c759, cx - side * 0.7, 0.95, z + 0.1);
    cyl(0.18, 0.2, 0.25, 0xffffff, cx - side * 0.5, 1.0, z + 0.4); ball(0.22, 0xffffff, cx - side * 0.5, 1.2, z + 0.4);
    block(bx - 0.6, z - 1.7, bx + 0.6, z + 1.7);
  }
}
// 버스 정류장 + 버스
box(4, 0.15, 2, 0x90a4ae, 10, 2.6, 41); cyl(0.07, 0.07, 2.6, 0x546e7a, 8.2, 1.3, 41.8); cyl(0.07, 0.07, 2.6, 0x546e7a, 11.8, 1.3, 41.8);
const busSign = textPlane('BUS STOP', 0.4, { fs: 48, bg: '#ffd43b', fg: '#222' }); busSign.position.set(10, 2.95, 40); busSign.rotation.y = Math.PI;
(function bus() {
  const g = new THREE.Group();
  box(2.6, 2.4, 8, 0xffc107, 0, 1.6, 0, g); box(2.62, 0.8, 7, 0xaedff7, 0, 2.2, 0.2, g);
  for (const [x, z] of [[-1.3, -2.6], [1.3, -2.6], [-1.3, 2.6], [1.3, 2.6]]) { const w = cyl(0.5, 0.5, 0.3, 0x222222, x, 0.5, z, g); w.rotation.z = Math.PI / 2; }
  const t = textPlane('SCHOOL BUS', 0.5, { fs: 52, bg: null, fg: '#222' }, g); t.position.set(-1.32, 1.2, 0); t.rotation.y = -Math.PI / 2;
  g.position.set(18, 0, 37); scene.add(g); block(16.7, 33, 19.3, 41);
})();
// 세계 어린이 모임 (남서)
const HALL = { x: -26, z: 30 };
(function hall() {
  box(16, 0.4, 12, 0xd8c3a5, HALL.x, 0.2, HALL.z);
  for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, HALL.x + dx, 2.5, HALL.z + dz);
  box(17, 0.4, 13, 0x264653, HALL.x, 5.2, HALL.z);
  const t = textPlane('World Children Meeting', 0.9, { fs: 64, bg: '#264653', fg: '#ffd166' }); t.position.set(HALL.x + 8.6, 4.4, HALL.z); t.rotation.y = Math.PI / 2;
  solid(0.4, 3.5, 11, 0xf6f1e9, HALL.x - 7.6, 2, HALL.z);
  const flags = { Korea: flagKorea, France: (c) => stripes(c, ['#0055a4', '#ffffff', '#ef4135'], true), India: flagIndia };
  ['France', 'Korea', 'India'].forEach((n, i) => {
    const c = document.createElement('canvas'); c.width = 300; c.height = 200; flags[n](c.getContext('2d'));
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.4), new THREE.MeshBasicMaterial({ map: tex })); f.position.set(HALL.x - 7.35, 2.6, HALL.z - 3.5 + i * 3.5); f.rotation.y = Math.PI / 2; scene.add(f);
    const l = textPlane(n, 0.4, { fs: 48 }); l.position.set(HALL.x - 7.35, 1.6, HALL.z - 3.5 + i * 3.5); l.rotation.y = Math.PI / 2;
  });
})();
function stripes(ctx, cols, vertical) { cols.forEach((c, i) => { ctx.fillStyle = c; vertical ? ctx.fillRect(i * 100, 0, 100, 200) : ctx.fillRect(0, i * 66.7, 300, 67); }); }
function flagKorea(ctx) {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 300, 200);
  ctx.save(); ctx.translate(150, 100); ctx.rotate(Math.atan2(2, 3));
  ctx.fillStyle = '#cd2e3a'; ctx.beginPath(); ctx.arc(0, 0, 50, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#0047a0'; ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#cd2e3a'; ctx.beginPath(); ctx.arc(-25, 0, 25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0047a0'; ctx.beginPath(); ctx.arc(25, 0, 25, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#000';
  [[60, 45, -1], [240, 155, -1], [240, 45, 1], [60, 155, 1]].forEach(([x, y, s]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(s * Math.atan2(2, 3)); for (let k = -1; k <= 1; k++) ctx.fillRect(-20, k * 12 - 4, 40, 8); ctx.restore(); });
}
function flagIndia(ctx) { stripes(ctx, ['#ff9933', '#ffffff', '#138808'], false); ctx.strokeStyle = '#000080'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(150, 100, 26, 0, Math.PI * 2); ctx.stroke(); }
// 도서관 (남동, 지호)
const LIB = { x: 26, z: 30 };
(function lib() {
  box(16, 0.4, 12, 0xcfe1f2, LIB.x, 0.2, LIB.z);
  for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, LIB.x + dx, 2.5, LIB.z + dz);
  box(17, 0.4, 13, 0x1d3557, LIB.x, 5.2, LIB.z);
  const t = textPlane("Let's Write · Library", 0.9, { fs: 64, bg: '#1d3557', fg: '#fff' }); t.position.set(LIB.x - 8.6, 4.4, LIB.z); t.rotation.y = -Math.PI / 2;
  for (const dz of [-3.5, 0, 3.5]) { solid(0.6, 2.6, 2.6, 0x8d6e63, LIB.x + 7, 1.5, LIB.z + dz); for (let k = 0; k < 6; k++) box(0.4, 0.5, 0.25, [0xe63946, 0x457b9d, 0xf4a261][k % 3], LIB.x + 6.65, 1.0 + (k > 2 ? 0.8 : 0), LIB.z + dz - 0.8 + (k % 3) * 0.6); }
  solid(2, 0.9, 1.2, 0xdeb887, LIB.x + 1, 0.85, LIB.z);
})();

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
const W = L.world;
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ["I'm Kai. I'm in the sixth grade.", '나는 Kai야. 나는 6학년이야.'] }, 10, 39.5, Math.PI);
addNPC('nara', { name: 'Nara', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ["Hi! I'm Nara. Nice to meet you.", '안녕! 나는 나라야. 만나서 반가워.'] }, 7.8, 39, Math.PI);
addNPC('jenny', { name: 'Jenny', girl: true, shirt: 0xffd54f, hair: 0xa0522d, scale: 0.78, idle: ["I'm in the second grade.", '나는 2학년이야.'] }, 12, 39, Math.PI);
addNPC('white', { name: 'Ms. White', girl: true, shirt: 0x5c6bc0, skirt: 0x283593, hair: 0xe0c070, scale: 1.12, idle: ['Hello! Welcome to Dream Elementary School.', '안녕! 드림 초등학교에 온 걸 환영해.'] }, 0, -25, 0);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ["I'm in the book club. I like reading science books.", '나는 책 동아리야. 과학책 읽는 걸 좋아해.'] }, -8, 16.4, Math.PI);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ["I'm in the cooking club.", '나는 요리 동아리야.'] }, -10.4, 16.8, Math.PI * 0.85);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ["I'm in the badminton club. I can play badminton very well.", '나는 배드민턴 동아리야. 배드민턴을 아주 잘 쳐.'] }, -5.6, 16.8, Math.PI * 1.15);
addNPC('mia', { name: 'Mia', girl: true, shirt: 0x7e57c2, hair: 0x222222, scale: 1.18, idle: ["I'm in the fifth grade. I'm in the badminton club.", '나는 5학년이야. 나는 배드민턴 동아리야.'] }, -26.5, 8.5, Math.PI / 2);
addNPC('miso', { name: 'Miso', girl: true, shirt: 0xe53935, hair: 0x111111, hat: true, idle: W.miso.lines[0] }, HALL.x - 5.6, HALL.z, Math.PI / 2);
addNPC('julia', { name: 'Julia', girl: true, shirt: 0x1565c0, hair: 0xd4a017, idle: W.julia.lines[0] }, HALL.x - 5.6, HALL.z - 3.5, Math.PI / 2);
addNPC('kamal', { name: 'Kamal', shirt: 0xff9800, hair: 0x111111, skin: 0xc68642, idle: W.kamal.lines[0] }, HALL.x - 5.6, HALL.z + 3.5, Math.PI / 2);
addNPC('jiho', { name: 'Jiho', shirt: 0x00897b, hair: 0x111111, idle: ['I want to be a writer.', '나는 작가가 되고 싶어.'] }, LIB.x + 2.6, LIB.z, -Math.PI / 2);
addNPC('beth', { name: 'Beth', girl: true, shirt: 0x8e24aa, hair: 0xc0392b, idle: ["I'm Beth. I'm in the sixth grade. I'm in the math club.", '나는 Beth야. 6학년이고 수학 동아리야.'] }, -14, -22, 0);
const STU_POS = [[-7, -8], [7, -10], [-12, 2], [12, 2]];
L.students.forEach((s, i) => addNPC(s.id, { name: s.name, girl: s.girl, shirt: s.shirt, hair: [0x3b2a1a, 0x111111, 0xa0522d, 0x222222][i], scale: 0.85, idle: [`I'm in the ${s.grade} grade.`, `나는 ${L.gradeKo[s.grade]}이야.`] }, ...STU_POS[i], 0));
function placeNPC(id, x, z, face) { const n = NPC[id]; n.g.position.set(x, 0, z); if (face !== undefined) n.g.rotation.y = face; n.home = [x, z, n.g.rotation.y]; n.follow = false; }
const inRoom = (gr, dx = 0) => [roomInfo[gr].cx + dx, -35];

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
const GQ = ['What grade are you in?', 'What club are you in?', "What's your name?", 'How are you?'];
const CQ = ['What club are you in?', 'What grade are you in?', 'Where are you from?', 'Do you like books?'];
const zoneHandlers = {}; // stage별 구역 진입
let stageState = {};

const STAGES = [
  { title: '1. 새 친구를 만나요', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 교실을 찾아 줘요', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. 동아리 축제', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 세계 어린이 모임', book: 'World Children Meeting', start: stage5 },
  { title: "6. 나를 소개해요", book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  const st = S.stage;
  // 위치 정리
  if (st >= 1) { placeNPC('jenny', ...inRoom('second', -1), 0); placeNPC('kai', ...inRoom('sixth', 1), 0); placeNPC('nara', ...inRoom('sixth', -1), 0); }
  else { placeNPC('kai', 10, 39.5, Math.PI); placeNPC('nara', 7.8, 39, Math.PI); placeNPC('jenny', 12, 39, Math.PI); }
  L.students.forEach((s, i) => st >= 2 ? placeNPC(s.id, ...inRoom(s.grade, 1.5), 0) : placeNPC(s.id, ...STU_POS[i], 0));
  for (const c of L.clubs) setBoothSign(c.id, st >= 3 ? c.en : '? ? ?', st >= 3);
  // 보너스 th 코인
  spawnThCoins();
  refreshHUD();
}
function startStage(i) { S.stage = i; save(); resetWorld(); STAGES[i].start(); refreshHUD(); }
function nextStage() { closeDlg(); beep('star'); track('stage_done', { stage: S.stage, stars: S.stars }); const i = S.stage + 1; showBanner(STAGES[S.stage].title + ' 완료!', i < STAGES.length - 1 ? '다음: ' + STAGES[i].title : '모든 미션 완료!'); startStage(i); }
function showBanner(a, b) { const el = $('#banner'); el.innerHTML = `<b>${a}</b><span>${b}</span>`; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
function mark(id, on = true) { NPC[id].g.userData.mark.visible = on; }

// ---- 1. Fun Talk 1 ----
function stage1() {
  setObj('🚌 버스 정류장에서 <b>Kai</b>에게 말을 걸어요', npcPos('kai'));
  mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false);
    await say('Nara', 'Hi, Kai.', '안녕, Kai.');
    await say('Kai', 'Hi, Nara. This is my cousin, Jenny.', '안녕, 나라야. 이 아이는 내 사촌 동생 Jenny야.');
    await say('Nara', "Hi, Jenny. I'm Nara.", '안녕, Jenny. 나는 나라야.');
    await ask('나', '나라 대신 Jenny에게 몇 학년인지 물어보세요.', '알맞은 질문을 고르세요.', GQ, { me: true, hint: 'grade = 학년' });
    await say('Jenny', "I'm in the second grade.", '나는 2학년이야.', { listen: true });
    await ask('', 'Jenny is in the ______ grade.', 'Jenny는 몇 학년인가요?', ['second', 'first', 'sixth', 'fourth'], { hint: '다시 듣기 🔊 를 눌러 보세요.' });
    await say('Nara', 'Nice to meet you.', '만나서 반가워.');
    await say('Jenny', 'Nice to meet you, too.', '나도 만나서 반가워.');
    await ask('나', '이번에는 Kai에게 몇 학년인지 물어보세요.', '알맞은 질문을 고르세요.', GQ, { me: true });
    await say('Kai', "I'm in the sixth grade.", '나는 6학년이야.', { listen: true });
    await ask('', 'Kai is in the ______ grade.', 'Kai는 몇 학년인가요?', ['sixth', 'second', 'fifth', 'third']);
    await say('Kai', "Oh, I'm late. Bye, Jenny!", '앗, 늦었다. 안녕, Jenny!');
    await say('Jenny', 'Kai! You have my bag!', 'Kai! 오빠가 내 가방을 갖고 있어!');
    await say('', '', '🎒 Kai가 Jenny의 가방을 놓고 뛰어갔어요! 가방을 주워서 Jenny의 교실에 갖다 주세요. 교실 문 위의 영어 이름표를 잘 읽어 보세요.', { btn: '알겠어요!' });
    closeDlg();
    placeNPC('kai', ...inRoom('sixth', 1), 0); placeNPC('nara', ...inRoom('sixth', -1), 0); placeNPC('jenny', ...inRoom('second', -1), 0);
    held = { kind: 'bag', label: "🎒 Jenny's bag (second grade)" }; beep('get'); refreshHUD();
    setObj("🎒 Jenny의 교실 <b>second grade</b> 를 찾아가요 (북쪽 교실 건물)", () => [0, -29]);
    zoneHandlers.room = async (gr) => {
      if (!held) return;
      if (gr !== 'second') { beep('bad'); toast(`여기는 <b>${gr} grade</b> 교실이에요.<br>Jenny는 <b>second grade</b> 예요!`); speak(`This is the ${gr} grade classroom.`); return; }
      held = null; refreshHUD(); busy = true;
      await say('Jenny', 'My bag! Thank you!', '내 가방! 고마워!');
      await say('Ms. White', 'Hello! What grade are you in?', '안녕! 너는 몇 학년이니?');
      await ask('나', 'Ms. White에게 대답해요. (나는 6학년)', '알맞은 대답을 고르세요.', ["I'm in the sixth grade.", "I'm in the book club.", "I'm sixth grade.", 'Yes, I am.'], { me: true, hint: "I'm in the ___ grade." });
      await say('Ms. White', 'Welcome to Dream Elementary School!', '드림 초등학교에 온 걸 환영해!');
      busy = false; nextStage();
    };
    // 선생님은 2학년 교실 앞
    placeNPC('white', roomInfo.second.cx + 1.5, -32.5, 0);
  };
}
// ---- 2. Listen and Do ----
function stage2() {
  placeNPC('white', 0, -25, 0);
  stageState.done = {};
  setObj('👩‍🏫 교실 건물 앞의 <b>Ms. White</b>에게 가요', npcPos('white'));
  mark('white');
  NPC.white.talk = async () => {
    mark('white', false);
    await say('Ms. White', 'Some new students are lost. Please help them!', '새로 온 학생들이 길을 잃었어. 도와주렴!');
    await say('', '', '광장에 있는 친구 4명에게 몇 학년인지 묻고, 잘 듣고, 그 친구의 교실까지 데려다주세요. (친구가 따라와요)', { btn: '시작!' });
    closeDlg(); NPC.white.talk = null;
    L.students.forEach(s => mark(s.id));
    setObj('❓ 길 잃은 친구 4명을 교실로 데려다줘요 (0/4)', nearestLost);
    L.students.forEach(s => {
      NPC[s.id].talk = async () => {
        if (stageState.done[s.id]) return;
        if (stageState.following && stageState.following !== s.id) { await say(s.name, 'Please help my friend first.', '내 친구 먼저 도와줘.'); closeDlg(); return; }
        if (stageState.following === s.id) { await say(s.name, `I'm in the ${s.grade} grade.`, `나는 ${L.gradeKo[s.grade]}이야.`, { listen: true }); closeDlg(); return; }
        await say(s.name, 'Hi! I\'m new here.', '안녕! 나는 여기 처음 왔어.');
        await ask('나', `${s.name}에게 몇 학년인지 물어보세요.`, '알맞은 질문을 고르세요.', GQ, { me: true });
        await say(s.name, `I'm in the ${s.grade} grade.`, '잘 듣고 기억하세요! (🔊 다시 듣기 가능)', { listen: true, koAlways: true });
        await say(s.name, 'Can you take me to my classroom?', '내 교실에 데려다줄래?', { btn: '따라와!' });
        closeDlg();
        stageState.following = s.id; NPC[s.id].follow = true; mark(s.id, false);
        setObj(`🚶 <b>${s.name}</b>의 교실을 찾아가요 (잊었으면 ${s.name}에게 다시 말 걸기)`, () => [0, -29]);
      };
    });
    zoneHandlers.room = async (gr) => {
      const id = stageState.following; if (!id) return;
      const s = L.students.find(x => x.id === id);
      if (gr !== s.grade) { beep('bad'); speak(`No. This is the ${gr} grade room.`, s.name); toast(`${s.name}: "No. This is the <b>${gr} grade</b> room."<br>다시 들어 볼까요? 🔊`); return; }
      stageState.following = null; stageState.done[id] = true; NPC[id].follow = false;
      placeNPC(id, ...inRoom(gr, 1.5), 0);
      S.tries++; S.correct++; addStar(); beep('star'); save();
      speak(`Thank you! This is my classroom.`, s.name); toast(`${s.name}: "Thank you!" ⭐`);
      const n = Object.keys(stageState.done).length;
      if (n < 4) setObj(`❓ 길 잃은 친구를 교실로 데려다줘요 (${n}/4)`, nearestLost);
      else {
        setObj('👩‍🏫 <b>Ms. White</b>에게 돌아가요', npcPos('white')); mark('white');
        NPC.white.talk = async () => {
          mark('white', false);
          await say('Ms. White', 'Great job! Now, line up in order. First grade to sixth grade!', '잘했어! 이제 1학년부터 6학년까지 순서대로 줄을 서 볼까?');
          await orderTask('', 'first → sixth: 학년 순서대로 누르세요', 'Play Together 1 · 학년 순서대로 줄 서기', L.grades.slice());
          await say('Ms. White', 'Wonderful! You know all the grades.', '훌륭해! 학년을 모두 아는구나.');
          nextStage();
        };
      }
    };
  };
}
function nearestLost() {
  let best = null, bd = 1e9;
  for (const s of L.students) { if (stageState.done && stageState.done[s.id]) continue; const p = NPC[s.id].g.position, d = Math.hypot(p.x - P.x, p.z - P.z); if (d < bd) { bd = d; best = [p.x, p.z]; } }
  return best;
}
// ---- 3. Fun Talk 2 + 동아리 이름표 ----
function stage3() {
  setObj('🪑 벤치 앞의 <b>Hajun</b>과 친구들에게 가요', npcPos('hajun'));
  mark('hajun');
  NPC.hajun.talk = async () => {
    mark('hajun', false);
    await say('Hajun', "It's time for club activities.", '동아리 활동 시간이야.');
    await say('Olivia', 'What club are you in?', '너는 무슨 동아리니?');
    await say('Hajun', "I'm in the book club.", '나는 책 동아리야.', { listen: true });
    await say('Joel', 'Do you like reading books?', '너는 책 읽는 거 좋아해?');
    await say('Hajun', 'Yes, I like reading science books.', '응, 나는 과학책 읽는 걸 좋아해.');
    await ask('나', 'Olivia에게 무슨 동아리인지 물어보세요.', '알맞은 질문을 고르세요.', CQ, { me: true, hint: 'club = 동아리' });
    await say('Olivia', "I'm in the cooking club. How about you, Joel?", '나는 요리 동아리야. 너는 어때, Joel?', { listen: true });
    await say('Joel', "I'm in the badminton club. I can play badminton very well.", '나는 배드민턴 동아리야. 나는 배드민턴을 아주 잘 쳐.', { listen: true });
    await ask('', 'Who is in the cooking club?', '요리 동아리는 누구일까요?', ['Olivia', 'Hajun', 'Joel']);
    await ask('', 'Hajun is in the ______ club.', '하준이는 무슨 동아리일까요?', ['book', 'cooking', 'badminton', 'dance']);
    await say('Hajun', 'Oh no! The club signs fell down!', '이런! 동아리 이름표가 다 떨어졌어!');
    await say('', '', '학교 곳곳에 떨어진 동아리 이름표 6장을 주워서, 알맞은 동아리 방(양쪽 부스)에 붙여 주세요. 방 안의 물건을 잘 보면 무슨 동아리인지 알 수 있어요!', { btn: '찾으러 가자!' });
    closeDlg();
    const spots = [[-16, 30], [14, 20], [-20, -22], [20, -22], [-2, 26], [4, -16]];
    stageState.cards = 0;
    shuffle(L.clubs).forEach((c, i) => {
      const card = textSprite(c.en, 0.7, { fs: 60, bg: '#ffffff', fg: '#e76f51', border: '#e76f51' });
      addItem(card, ...spots[i], (it) => {
        if (held) { if (!stageState.warned) { toast('이름표는 한 장씩만 들 수 있어요. 먼저 붙이고 오세요!'); stageState.warned = 1; } return; }
        removeItem(it); held = { kind: 'card', club: c.id, label: '🏷️ ' + c.en, item: c }; beep('get'); speak(c.en); refreshHUD();
        setObj(`🏷️ <b>${c.en}</b> 이름표를 알맞은 동아리 방에 붙여요`, null);
      }, { y: 1.4, r: 1.4 });
    });
    setObj('🏷️ 떨어진 동아리 이름표를 찾아요 (0/6) — 하얀 이름표가 떠 있어요', nearestItem);
    zoneHandlers.booth = (id) => {
      if (!held || held.kind !== 'card') return;
      if (stageState.boothDone && stageState.boothDone[id]) return;
      if (held.club !== id) { beep('bad'); toast(`이곳은 <b>${held.item.en}</b>이 아닌 것 같아요.<br>방 안의 물건을 잘 보세요!`); return; }
      stageState.boothDone = stageState.boothDone || {}; stageState.boothDone[id] = 1;
      setBoothSign(id, held.item.en, true); speak(`This is the ${held.item.en}.`); toast(`⭐ ${held.item.en} 완성!`);
      S.tries++; S.correct++; addStar(); beep('star'); save();
      held = null; refreshHUD(); stageState.cards++;
      if (stageState.cards < 6) setObj(`🏷️ 떨어진 동아리 이름표를 찾아요 (${stageState.cards}/6)`, nearestItem);
      else {
        setObj('🏸 <b>badminton club</b>에 있는 <b>Joel</b>에게 가 봐요', npcPos('joel'));
        placeNPC('joel', -26.5, 11.5, Math.PI / 2); mark('joel');
        NPC.joel.talk = async () => {
          mark('joel', false);
          await say('Joel', "Uhh.... She's so tall!", '음.... 저 누나 키가 정말 크다!');
          await ask('나', 'Joel 대신 키 큰 친구(Mia)에게 몇 학년인지 물어보세요.', '알맞은 질문을 고르세요.', GQ, { me: true });
          await say('Mia', "I'm in the fifth grade.", '나는 5학년이야.', { listen: true });
          await ask('', 'Mia is in the ______ grade.', 'Mia는 몇 학년일까요?', ['fifth', 'sixth', 'fourth', 'first']);
          await say('Joel', 'Oh! Nice to meet you!', '오! 만나서 반가워!');
          placeNPC('joel', -5.6, 16.8, Math.PI * 1.15);
          nextStage();
        };
      }
    };
  };
}
function nearestItem() {
  let best = null, bd = 1e9;
  for (const it of items) { if (!it.alive || it.bonus) continue; const d = Math.hypot(it.x - P.x, it.z - P.z); if (d < bd) { bd = d; best = [it.x, it.z]; } }
  return best;
}
// ---- 4. 문장 블록 ----
function stage4() {
  placeNPC('white', 0, 12.5, Math.PI);
  setObj('⛲ 분수 앞의 <b>Ms. White</b>에게 가요', npcPos('white')); mark('white');
  NPC.white.talk = async () => {
    mark('white', false); NPC.white.talk = null;
    await say('Ms. White', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 보자!');
    await say('', '', '분수 주위에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 화면 위쪽에 문장 칸이 보여요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['grade', 'club', 'sixth', 'book', 'What', "I'm", 'you', 'the'].filter(w => !words.includes(w));
  const extra = shuffle(pool).slice(0, 2);
  stageState.words = words; stageState.wi = 0; stageState.miss = 0;
  const all = shuffle(words.map(w => [w, true]).concat(extra.map(w => [w, false])));
  all.forEach(([w], i) => {
    const a = (i / all.length) * Math.PI * 2 + Math.random() * 0.4, r = 6 + Math.random() * 4;
    const x = Math.sin(a) * r, z = 6 + Math.cos(a) * r;
    const it = addItem(wordCube(w), x, z, (it) => {
      if (it.cool > performance.now()) return;
      if (w === stageState.words[stageState.wi]) {
        removeItem(it); stageState.wi++; beep('get'); speak(w.replace('?', '').replace('.', ''), '나'); drawSentenceBar();
        if (stageState.wi === stageState.words.length) finishSentence();
      } else {
        it.cool = performance.now() + 1200; beep('bad'); it.shake = 0.5; stageState.miss++;
        toast('순서가 아니에요! 다음 단어를 생각해 보세요.');
      }
    }, { y: 1.1, r: 1.2 });
    it.word = w;
  });
  drawSentenceBar();
  setObj(`🧱 문장 ${stageState.si + 1}/4: <b>${sen.ko}</b>`, nearestNeeded);
}
function nearestNeeded() {
  const w = stageState.words && stageState.words[stageState.wi];
  const it = items.find(i => i.alive && i.word === w);
  return S.koHelp && it ? [it.x, it.z] : null;
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
  await say('Ms. White', sen.en, sen.ko + ' ⭐', { btn: '다음 문장 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}
// ---- 5. World Children Meeting ----
function stage5() {
  stageState.read = {};
  setObj('🌏 <b>World Children Meeting</b> (남서쪽 큰 무대)에 가서 세 친구의 소개를 들어요 (0/3)', () => [HALL.x + 2, HALL.z]);
  ['miso', 'julia', 'kamal'].forEach(id => mark(id));
  const q = {
    miso: ['Miso is in the ______ grade.', '미소는 몇 학년인가요?', ['sixth', 'fifth', 'fourth', 'second']],
    julia: ['Julia is in the ______ club.', 'Julia는 무슨 동아리인가요?', ['soccer', 'cooking', 'book', 'dance']],
    kamal: ['Kamal wants to be ______.', 'Kamal의 장래 희망은?', ['an animal doctor', 'a writer', 'a cook', 'a soccer player']]
  };
  for (const id of ['miso', 'julia', 'kamal']) {
    NPC[id].talk = async () => {
      const w = W[id];
      if (id === 'miso' && !stageState.welcome) { stageState.welcome = 1; await say('Miso', 'Welcome to the world children meeting.', '세계 어린이 모임에 온 걸 환영해.'); }
      await lines(w.name, w.lines);
      if (stageState.read[id]) { closeDlg(); return; }
      await ask('', ...q[id], { hint: '🔊 다시 듣기 또는 친구에게 다시 말을 걸어 보세요.' });
      stageState.read[id] = 1; mark(id, false); closeDlg();
      const n = Object.keys(stageState.read).length;
      if (n < 3) setObj(`🌏 세 친구의 소개를 들어요 (${n}/3)`, () => [HALL.x + 2, HALL.z]);
      else { setObj('🌏 다시 <b>Miso</b>에게 말을 걸어 대화를 완성해요', npcPos('miso')); mark('miso'); NPC.miso.talk = finale5; }
    };
  }
  async function finale5() {
    mark('miso', false);
    await say('', '', 'After You Read · 글의 내용에 맞게 대화를 완성해요.', { btn: '시작' });
    await ask('Miso', "I'm in the ____ grade. What grade are you in, Kamal?", 'Miso의 말', ['sixth', 'fifth', 'fourth'], { sayIt: false, after: "I'm in the sixth grade. What grade are you in, Kamal?" });
    speak("I'm in the sixth grade. What grade are you in, Kamal?", 'Miso');
    await ask('Kamal', "I'm in the ____ grade. How about you, Julia?", 'Kamal의 말', ['fourth', 'sixth', 'fifth'], { sayIt: false, wait: 900 });
    speak("I'm in the fourth grade. How about you, Julia?", 'Kamal');
    await ask('Julia', "I'm in the ____ grade. I'm in the soccer club.", 'Julia의 말', ['fifth', 'fourth', 'sixth'], { sayIt: false });
    await ask('Julia', 'Miso, ____ club are you in?', 'Julia의 질문', ['what', 'how', 'who'], { sayIt: false });
    speak("Miso, what club are you in?", 'Julia');
    await ask('Miso', "I'm in the ____ club.", 'Miso의 대답', ['cooking', 'soccer', 'book'], { sayIt: false });
    speak("I'm in the cooking club.", 'Miso');
    await say('Miso', 'Thank you for coming!', '와 줘서 고마워!');
    nextStage();
  }
}
// ---- 6. Let's Write ----
function stage6() {
  setObj("📚 남동쪽 <b>Library</b>의 <b>Jiho</b>에게 가요", npcPos('jiho')); mark('jiho');
  NPC.jiho.talk = async () => {
    mark('jiho', false);
    await say('Jiho', 'Read my writing!', '내 글을 읽어 줘!');
    await lines('Jiho', L.jiho);
    await ask('', 'What does Jiho want to be?', '지호의 장래 희망은?', ['a writer', 'a teacher', 'a cook']);
    await say('Jiho', 'Now, write about you!', '이제 너를 소개하는 글을 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const O = L.writeOptions;
  const sel = (id, arr, fmt) => { const s = $('#' + id); s.innerHTML = arr.map(v => Array.isArray(v) ? `<option value="${v[0]}">${v[0]} (${v[1]})</option>` : `<option value="${v}">${fmt ? fmt(v) : v}</option>`).join(''); };
  sel('wLive', O.live); sel('wGrade', L.grades, g => `${g} (${L.gradeKo[g]})`); sel('wClub', O.club); sel('wLike', O.like); sel('wWant', O.want);
  $('#wGrade').value = 'sixth';
  if (S.card) { $('#wName').value = S.card.name; for (const k of ['live', 'grade', 'club', 'like', 'want']) $('#w' + k[0].toUpperCase() + k.slice(1)).value = S.card[k]; }
  const upd = () => {
    const c = cardData(); const t = cardText(c);
    $('#wPreview').innerHTML = t.map(l => `<div>${l}</div>`).join('');
  };
  f.oninput = upd; upd();
  $('#wRead').onclick = () => speak(cardText(cardData()).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = cardData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.name)) { toast('이름을 영어로 써 주세요. (예: Minsu)'); return; }
    const chk = [$('#chk1').checked, $('#chk2').checked, $('#chk3').checked];
    if (chk.includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(cardText(c).join(' '), '나');
    await say('Jiho', `Nice to meet you, ${c.name}!`, `만나서 반가워, ${c.name}!`);
    nextStage(); showEnd();
  };
}
function cardData() {
  return { name: $('#wName').value.trim(), live: $('#wLive').value, grade: $('#wGrade').value, club: $('#wClub').value, like: $('#wLike').value, want: $('#wWant').value };
}
function cardText(c) {
  return [`My name is ${c.name || '____'}.`, `I live in ${c.live}, Korea.`, `I'm in the ${c.grade} grade.`, `I'm in the ${c.club} club.`, `I like ${c.like}.`, `I want to be ${c.want}.`];
}
// ---- 자유 탐험 ----
function stageFree() {
  setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>th 코인</b>을 모아 보세요', null);
}
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · th 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? cardText(S.card).map(l => `<div>${l}</div>`).join('') : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? cardText(S.card).join(' ') : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 th 코인 ----
const TH_SPOTS = [[-38, 12], [38, -26], [0, -42], [36, 40], [-36, -36], [-38, 30]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('th', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('th', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Beth');
      toast(`🪙 th 코인: <b>${w.replace('th', '<u>th</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 th 코인을 모두 모았어요! Beth is in the sixth grade. She\'s in the math club.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.beth.talk = async () => {
  await say('Beth', "Hi! I'm Beth. I'm in the sixth grade. I'm in the math club.", '안녕! 나는 Beth야. 6학년이고 수학 동아리야.');
  await say('Beth', 'Listen: Beth, sixth, math. th, th, th!', 'Sounds and Letters · th 소리를 들어 보세요.');
  await say('', '', `🪙 학교 구석구석에 숨은 th 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
// NPC.beth.talk 등 일반 talk는 resetWorld 때 지워지지 않도록 별도 보관
const bethTalk = NPC.beth.talk;

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
  mctx.fillStyle = '#e9dcc0'; mctx.fillRect(tx(-28), tz(-33), 56 * s, 74 * s);
  mctx.fillStyle = '#c0504d'; mctx.fillRect(tx(-27), tz(-38), 54 * s, 8 * s);
  mctx.fillStyle = '#fff'; mctx.font = `bold ${10}px sans-serif`; mctx.textAlign = 'center';
  mctx.fillText('교실', tx(0), tz(-33));
  for (const [id, b] of Object.entries(boothInfo)) { mctx.fillStyle = '#f4a261'; mctx.fillRect(tx(Math.min(b.xo, b.xo + b.side * 7)), tz(b.z - 4), 7 * s, 8 * s); }
  mctx.fillStyle = '#264653'; mctx.fillRect(tx(HALL.x - 8), tz(HALL.z - 6), 16 * s, 12 * s);
  mctx.fillStyle = '#1d3557'; mctx.fillRect(tx(LIB.x - 8), tz(LIB.z - 6), 16 * s, 12 * s);
  mctx.fillStyle = '#fff'; mctx.fillText('세계', tx(HALL.x), tz(HALL.z) + 4); mctx.fillText('도서관', tx(LIB.x), tz(LIB.z) + 4);
  mctx.fillStyle = '#64b5f6'; mctx.beginPath(); mctx.arc(tx(0), tz(6), 3 * s, 0, 7); mctx.fill();
  mctx.fillStyle = '#ffc107'; mctx.fillRect(tx(16.7), tz(33), 2.6 * s, 8 * s);
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
    const m = g.userData.mark; if (m.visible) m.position.y = 2.75 + Math.sin(t * 4) * 0.1 + (n.id === 'miso' ? 0.4 : 0);
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
  for (const [gr, r] of Object.entries(roomInfo)) if (P.x > r.x1 && P.x < r.x2 && P.z > r.z1 && P.z < r.z2) z = ['room', gr];
  for (const [id, b] of Object.entries(boothInfo)) if (P.x > b.x1 && P.x < b.x2 && P.z > b.z1 && P.z < b.z2) z = ['booth', id];
  const zk = z ? z.join(':') : null;
  if (zk !== zoneNow) { zoneNow = zk; if (z && zoneHandlers[z[0]] && started && !dlgOpen) zoneHandlers[z[0]](z[1]); }

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
  NPC.beth.talk = bethTalk;
  if (S.stage === 0) showBanner(STAGES[0].title, '마우스 클릭 → 화면 돌리기 · W A S D 이동 · E 말 걸기');
  if (S.stage >= STAGES.length - 1) showEnd();
  if (!isTouch) setTimeout(() => toast('화면을 한 번 클릭하면 마우스로 둘러볼 수 있어요 (Esc로 해제)', 3500), 3200);
}
// resetWorld가 talk를 지우므로 Beth 대화 복구
const _reset = resetWorld;
resetWorld = function () { _reset(); NPC.beth.talk = bethTalk; };
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
window.__game = { say, ask, tick: (dt) => update(dt, performance.now() / 1000), get S() { return S; }, P, NPC, startStage, items: () => items, roomInfo, boothInfo, get st() { return stageState; }, get held() { return held; }, get busy() { return busy; } };
if (qs.has('autotest')) { const s = document.createElement('script'); s.src = 'autotest.js'; document.body.appendChild(s); }
})();
// 개발용 화면 위치: ?view=x,z,yaw  /  ?dlg=1
(() => { const q = new URLSearchParams(location.search); const G = window.__game; if (q.has('view')) { const [x, z, y] = q.get('view').split(',').map(Number); G.P.x = x; G.P.z = z; G.P.yaw = y; } if (q.has('dlg')) G.ask('나', 'Jenny에게 몇 학년인지 물어보세요.', '알맞은 질문을 고르세요.', ['What grade are you in?', 'What club are you in?', "What's your name?", 'How are you?'], { me: true }); })();
