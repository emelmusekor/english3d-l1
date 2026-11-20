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
const SAVE_KEY = 'english3d_l9_v1';
const fresh = () => ({ v: 1, stage: 0, stars: 0, correct: 0, tries: 0, streak: 0, best: 0, th: [], card: null, koHelp: true, rate: 0.9 });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) S = Object.assign(fresh(), s); } catch (e) {}
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
// 반 활동 기록 (백엔드가 설정되지 않으면 아무 일도 하지 않아요)
const track = (type, data) => { try { if (window.NET) window.NET.track(type, data); } catch (e) {} };
try { if (window.NET) window.NET.init({ lesson: L.id || 'L1' }); } catch (e) {}

// ---------------- 소리 ----------------
let AC = null, MUTE = false;
try { MUTE = localStorage.getItem('english3d_mute') === '1'; } catch (e) {}
const SFX = {
  ok: [[660, .08], [880, .14]], bad: [[208, .1], [165, .16]], get: [[784, .06], [1046, .1]],
  star: [[523, .07], [659, .07], [784, .07], [1046, .16]], combo: [[784, .06], [988, .06], [1175, .06], [1568, .2]],
  jump: [[330, .05], [494, .08]], click: [[540, .035]], fanfare: [[523, .1], [659, .1], [784, .1], [1046, .14], [784, .08], [1046, .32]]
};
function beep(type) {
  if (MUTE) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended' && AC.resume) AC.resume();
    const seq = SFX[type] || [[440, .1]];
    const vol = type === 'click' ? .05 : type === 'bad' ? .08 : type === 'jump' ? .06 : .12;
    let t = AC.currentTime;
    for (const [f, d] of seq) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type === 'click' ? 'sine' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02); t += d;
    }
  } catch (e) {}
}
// ---------- 축하 효과 (색종이·날아가는 별·칭찬 말) ----------
const fxLayer = document.createElement('div'); fxLayer.id = 'fx'; document.body.appendChild(fxLayer);
const praiseEl = document.createElement('div'); praiseEl.id = 'praise'; document.body.appendChild(praiseEl);
const calm = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
function confetti(n = 40) {
  if (calm) return;
  try {
    const cols = ['#ff6b6b', '#ffd166', '#06d6a0', '#4dabf7', '#f783ac', '#b197fc'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'conf';
      const dur = 1.6 + Math.random() * 1.6;
      c.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-duration:${dur}s;animation-delay:${Math.random() * .5}s;--dx:${(Math.random() * 240 - 120) | 0}px;--rot:${(Math.random() * 1400 - 700) | 0}deg`;
      if (i % 3 === 0) c.style.borderRadius = '50%';
      fxLayer.appendChild(c); setTimeout(() => c.remove(), (dur + .6) * 1000);
    }
  } catch (e) {}
}
function flyStar(n = 1) {
  if (calm) return;
  try {
    const r = document.getElementById('stars').getBoundingClientRect();
    for (let i = 0; i < Math.min(n, 5); i++) {
      const s = document.createElement('span'); s.className = 'flyStar'; s.textContent = '⭐';
      const x0 = innerWidth / 2 + (Math.random() * 120 - 60), y0 = innerHeight * 0.55 + (Math.random() * 40 - 20);
      s.style.left = x0 + 'px'; s.style.top = y0 + 'px'; fxLayer.appendChild(s);
      setTimeout(() => { s.style.transform = `translate(${r.left + r.width / 2 - x0 - 14}px,${r.top + r.height / 2 - y0 - 14}px) scale(.5) rotate(360deg)`; s.style.opacity = '.3'; }, 30 + i * 90);
      setTimeout(() => s.remove(), 900 + i * 90);
    }
  } catch (e) {}
}
const PRAISE = ['Great!', 'Nice!', 'Good job!', 'Excellent!', 'Perfect!', 'Wonderful!'];
function praise(streak) {
  try {
    const hot = streak >= 3;
    praiseEl.innerHTML = PRAISE[Math.random() * PRAISE.length | 0] + (hot ? `<small>🔥 ${streak}번 연속!</small>` : '');
    praiseEl.classList.remove('show'); void praiseEl.offsetWidth; praiseEl.classList.add('show');
    if (hot) { setTimeout(() => beep('combo'), 220); if (streak % 5 === 0) confetti(30); }
  } catch (e) {}
}
let voices = [];
const loadVoices = () => { try { voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); } catch (e) {} };
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
const VOICE = { // [여자?, pitch]
  Rani: [1, 1.4], Mom: [1, 1.05], Ria: [1, 1.6], Dad: [0, 0.85], Librarian: [1, 1.1], 'Ms. Lee': [1, 1.15],
  Tom: [0, 1.2], Yuna: [1, 1.4], Ben: [0, 1.1], Sora: [1, 1.3], Max: [0, 1.15], Emma: [1, 1.35],
  Joel: [0, 1.15], Olivia: [1, 1.3], Hajun: [0, 1.15], Kai: [0, 1.1], Mina: [1, 1.35], Leo: [0, 1.2],
  Ron: [0, 1.05], Harry: [0, 1.1], Sally: [1, 1.3], Dean: [0, 1.0], Narrator: [1, 1.0], Friends: [1, 1.2], '나': [0, 1.0]
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

// ---------------- 세계 만들기 (Lesson 9 · Weekend Town) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8fc96e)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xe3d7c1)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xe3d7c1)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0x1971c2, -4, 2, FEN); solid(1, 4, 1, 0x1971c2, 4, 2, FEN);
const gateSign = textPlane('Weekend Town', 1.1, { fs: 64, bg: '#1971c2', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const c = ball(1.5 * s, 0x4caf50, x, 3 * s, z); c.scale.y = 1.1;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -43.5, 1); tree(-43, i, 1.1); tree(43, i + 3, 1); }
for (const x of [-38, -14, 14, 38]) tree(x, 42, 0.9);
for (const [x, z] of [[-6, 36], [6, 34], [-17, -16], [16, 22]]) tree(x, z, 1.1);
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-6, 28, Math.PI / 2); bench(6, 28, -Math.PI / 2);

// ---------- 서쪽: Rani's House ----------
const HOUSE = { x: -27, z: -2 };
solid(0.4, 4, 20, 0xfff3bf, -34, 2, -2);
solid(14, 4, 0.4, 0xfff3bf, -27, 2, -12); solid(14, 4, 0.4, 0xfff3bf, -27, 2, 8);
solid(0.5, 4, 0.5, 0x2f9e44, -20.2, 2, -11.8); solid(0.5, 4, 0.5, 0x2f9e44, -20.2, 2, 7.8);
{ const r = new THREE.Mesh(new THREE.ConeGeometry(12.5, 4, 4), mat(0x2f9e44)); r.rotation.y = Math.PI / 4; r.scale.set(0.8, 1, 1.1); r.position.set(-27, 6, -2); scene.add(r); }
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xe9d8a6)); fl.rotation.x = -Math.PI / 2; fl.position.set(-27, 0.02, -2); scene.add(fl); }
{ const s = textPlane("Rani's House 🏠", 0.9, { fs: 64, bg: '#2f9e44', fg: '#fff' }); s.position.set(-19.9, 4.6, -2); s.rotation.y = Math.PI / 2; }
// 거실: 소파, TV
box(1, 0.6, 3.6, 0x5c7cfa, -33, 0.3, -7); box(0.3, 0.6, 3.6, 0x4263eb, -33.4, 0.9, -7);
box(2.2, 1.3, 0.12, 0x212529, -27, 1.6, -11.7); box(2, 1.1, 0.02, 0x74c0fc, -27, 1.6, -11.63);
// 부엌 (아빠의 초콜릿케이크)
const KITCHEN = { x: -31, z: 6.8 };
box(5, 1, 1, 0xffffff, KITCHEN.x, 0.5, KITCHEN.z); box(5, 0.06, 1.02, 0x868e96, KITCHEN.x, 1.02, KITCHEN.z); block(KITCHEN.x - 2.5, KITCHEN.z - 0.5, KITCHEN.x + 2.5, KITCHEN.z + 0.5);
box(1, 0.9, 0.9, 0x495057, KITCHEN.x + 2, 1.5, KITCHEN.z);
cyl(0.35, 0.35, 0.3, 0x5d4037, KITCHEN.x - 1, 1.2, KITCHEN.z); cyl(0.36, 0.36, 0.06, 0xfff3bf, KITCHEN.x - 1, 1.38, KITCHEN.z); ball(0.06, 0xe03131, KITCHEN.x - 1, 1.45, KITCHEN.z);
cyl(0.8, 0.8, 0.06, 0xffffff, -27, 0.78, 2, scene, 18); cyl(0.07, 0.07, 0.78, 0x777777, -27, 0.39, 2); block(-27.6, 1.4, -26.4, 2.6);
{ const s = textPlane('Sunday Morning ☀️', 0.4, { fs: 48, bg: '#ffffff', fg: '#2f9e44' }); s.position.set(-33.75, 2.6, 0); s.rotation.y = Math.PI / 2; }
// 마당 개집 + 개
const DOGHOUSE = { x: -16, z: -9 };
solid(1.8, 1.2, 1.6, 0xc92a2a, DOGHOUSE.x, 0.6, DOGHOUSE.z);
{ const r = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 4), mat(0x862e9c)); r.rotation.y = Math.PI / 4; r.position.set(DOGHOUSE.x, 1.6, DOGHOUSE.z); scene.add(r);
  box(0.7, 0.7, 0.05, 0x212529, DOGHOUSE.x, 0.4, DOGHOUSE.z + 0.81);
  const s = textPlane('🐕 Coco', 0.3, { fs: 48, bg: '#ffffff', fg: '#c92a2a' }); s.position.set(DOGHOUSE.x, 1.0, DOGHOUSE.z + 0.83); }
function dogModel() {
  const g = new THREE.Group(), c = 0xd9a066;
  box(0.32, 0.3, 0.7, c, 0, 0.45, 0, g);
  for (const [x, z] of [[-0.11, -0.25], [0.11, -0.25], [-0.11, 0.25], [0.11, 0.25]]) box(0.08, 0.3, 0.08, c, x, 0.15, z, g);
  box(0.3, 0.28, 0.3, c, 0, 0.72, 0.4, g); box(0.16, 0.12, 0.16, 0xf1d2a8, 0, 0.66, 0.6, g); ball(0.04, 0x111111, 0, 0.7, 0.69, g);
  box(0.07, 0.16, 0.12, 0x8b5a2b, -0.15, 0.85, 0.35, g); box(0.07, 0.16, 0.12, 0x8b5a2b, 0.15, 0.85, 0.35, g);
  const tail = box(0.05, 0.05, 0.3, c, 0, 0.6, -0.45, g); tail.rotation.x = 0.7; g.userData.tail = tail;
  ball(0.03, 0x111111, -0.07, 0.8, 0.55, g); ball(0.03, 0x111111, 0.07, 0.8, 0.55, g);
  return g;
}
const DOG = dogModel(); DOG.scale.setScalar(1.3); scene.add(DOG);
const DOG_HOME = [DOGHOUSE.x + 1.6, DOGHOUSE.z + 1.4, 0.4];
function placeDog(x, z, r = 0) { DOG.position.set(x, 0, z); DOG.rotation.y = r; }
placeDog(...DOG_HOME);

// ---------- 동쪽: Library ----------
const LIBR = { x: 27, z: -2 };
solid(0.4, 4.5, 20, 0xe7f5ff, 34, 2.25, -2);
solid(14, 4.5, 0.4, 0xe7f5ff, 27, 2.25, -12); solid(14, 4.5, 0.4, 0xe7f5ff, 27, 2.25, 8);
solid(0.6, 4.5, 0.6, 0x1864ab, 20.2, 2.25, -11.8); solid(0.6, 4.5, 0.6, 0x1864ab, 20.2, 2.25, 7.8);
box(14.6, 0.4, 20.6, 0x1864ab, 27, 4.7, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xf3e5d0)); fl.rotation.x = -Math.PI / 2; fl.position.set(27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('Library 📚', 1.0, { fs: 64, bg: '#1864ab', fg: '#fff' }); s.position.set(19.85, 3.9, -6); s.rotation.y = -Math.PI / 2; }
const bookC = [0xe03131, 0x1c7ed6, 0x2f9e44, 0xf59f00, 0x7048e8, 0xe64980];
function shelf(x, z, rot) {
  const g = new THREE.Group(); box(3.6, 3, 0.6, 0x8d6e63, 0, 1.5, 0, g);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) box(0.22, 0.5, 0.4, bookC[(r * 3 + k) % 6], -1.5 + k * 0.33, 0.45 + r * 0.7, 0.12, g);
  g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
}
for (const z of [-9, -5, -1, 3]) { shelf(33.4, z, -Math.PI / 2); block(33, z - 1.8, 34, z + 1.8); }
for (const x of [24, 28]) { shelf(x, -11.4, 0); shelf(x, 7.4, Math.PI); }
const LTABLE = { x: 26, z: 1 };
solid(3, 0.8, 1.6, 0xdeb887, LTABLE.x, 0.4, LTABLE.z);
for (const [dx, c] of [[-0.8, 0x1c7ed6], [0.6, 0xe03131]]) box(0.5, 0.08, 0.36, c, LTABLE.x + dx, 0.84, LTABLE.z);
solid(1.2, 1, 2.6, 0x1864ab, 31, 0.5, -6);
{ const s = textPlane('Science 🔭  ·  Comics 💥', 0.4, { fs: 46, bg: '#ffffff', fg: '#1864ab' }); s.position.set(32.6, 3.4, -3); s.rotation.y = -Math.PI / 2; }

// ---------- 가운데: 계획표 광장 ----------
const BOARD = { x: -12, z: 18 };
{ const g = new THREE.Group();
  box(0.3, 3.6, 9, 0x495057, 0, 2.2, 0, g); box(0.1, 3.2, 8.6, 0xffffff, 0.16, 2.3, 0, g);
  scene.add(g); g.position.set(BOARD.x, 0, BOARD.z); block(BOARD.x - 0.3, BOARD.z - 4.6, BOARD.x + 0.3, BOARD.z + 4.6);
  const t = textPlane('My Plans 🗓️', 0.55, { fs: 60, bg: '#f59f00', fg: '#fff' }); t.position.set(BOARD.x + 0.25, 4.3, BOARD.z); t.rotation.y = Math.PI / 2;
  ['Today', 'Tomorrow', 'This Weekend'].forEach((w, i) => { const p = textPlane(w, 0.42, { fs: 50, bg: '#1971c2', fg: '#fff' }); p.position.set(BOARD.x + 0.23, 3.5, BOARD.z + 2.8 - i * 2.8); p.rotation.y = Math.PI / 2; }); }
const boardSlot = (time, k) => { const i = ['this afternoon', 'tomorrow', 'this weekend'].indexOf(time); return [BOARD.x + 0.25, 2.75 - k * 0.95, BOARD.z + 2.8 - i * 2.8]; };
// 카드 놀이 탁자
const CARD = { x: -14, z: 6 };
solid(1.6, 0.75, 1.6, 0xffd43b, CARD.x, 0.38, CARD.z);
{ const s = textPlane('Plan Cards 🃏', 0.45, { fs: 50, bg: '#e8590c', fg: '#fff' }); s.position.set(CARD.x, 2.6, CARD.z - 2.2); cyl(0.05, 0.05, 2.4, 0x666666, CARD.x, 1.2, CARD.z - 2.25); }

// ---------- 북쪽: Dream School 연극 무대 ----------
const SCHOOL = { x: 0, z: -34 };
solid(36, 6, 0.6, 0xffe8cc, 0, 3, -41.5);
box(16, 0.7, 6, 0x9c6b3c, 0, 0.35, -37.5); block(-8, -40.5, 8, -34.6);
{ const c = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.6), mat(0x74c0fc)); c.position.set(0, 3.1, -41.1); scene.add(c);
  for (const x of [-7.3, 7.3]) box(1.4, 5, 0.3, 0xc92a2a, x, 2.8, -40.9);
  const s = textPlane('Peter Pan · School Play 🎭', 0.8, { fs: 62, bg: '#c92a2a', fg: '#fff' }); s.position.set(0, 5.4, -40.9);
  box(4, 0.8, 1.2, 0x5d4037, -4, 1.4, -40); cyl(0.07, 0.07, 3, 0x5d4037, -4, 2.8, -40); box(1.6, 1.2, 0.05, 0xffffff, -4, 3.2, -39.96); }
for (let r = 0; r < 3; r++) for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) box(1, 0.5, 0.8, 0x845ef7, sx * (2.8 + k * 1.3), 0.25, -31 + r * 2);
{ const s = textPlane('Dream School 🏫', 0.9, { fs: 64, bg: '#7048e8', fg: '#fff' }); s.position.set(0, 4.2, -24); cyl(0.1, 0.1, 4.2, 0x666666, -3.6, 2.1, -24); cyl(0.1, 0.1, 4.2, 0x666666, 3.6, 2.1, -24); }
function crocModel() {
  const g = new THREE.Group(), c = 0x2b8a3e;
  box(0.6, 0.35, 1.6, c, 0, 0.25, 0, g); box(0.5, 0.25, 0.8, c, 0, 0.22, 1.1, g); box(0.48, 0.08, 0.7, 0xffffff, 0, 0.12, 1.15, g);
  ball(0.08, 0xffffff, -0.15, 0.45, 0.8, g); ball(0.08, 0xffffff, 0.15, 0.45, 0.8, g); ball(0.04, 0x111111, -0.15, 0.48, 0.86, g); ball(0.04, 0x111111, 0.15, 0.48, 0.86, g);
  const t = box(0.3, 0.2, 1.2, c, 0, 0.2, -1.3, g); t.rotation.y = 0.3;
  for (let i = 0; i < 4; i++) box(0.12, 0.12, 0.12, 0x37b24d, 0, 0.47, -0.6 + i * 0.4, g);
  ball(0.17, 0xf5cfa8, 0, 0.55, 0.15, g); // 악어 옷 속 얼굴 (동생)
  return g;
}
// 학교 앞 셔틀버스
const BUS = { x: -12, z: -22 };
(function bus() {
  const g = new THREE.Group();
  box(2.6, 2.4, 6.4, 0xfab005, 0, 1.6, 0, g); box(2.62, 0.8, 5.2, 0xd0ebff, 0, 2.1, 0.2, g);
  for (const [x, z] of [[-1.3, -2.2], [1.3, -2.2], [-1.3, 2.2], [1.3, 2.2]]) { const w = cyl(0.45, 0.45, 0.3, 0x222222, x, 0.45, z, g); w.rotation.z = Math.PI / 2; }
  const t = textPlane('SCHOOL BUS', 0.4, { fs: 48, bg: '#212529', fg: '#fab005' }, g); t.position.set(1.32, 2.9, 0); t.rotation.y = Math.PI / 2;
  g.position.set(BUS.x, 0, BUS.z); scene.add(g); block(BUS.x - 1.3, BUS.z - 3.2, BUS.x + 1.3, BUS.z + 3.2);
})();
// 영화관
const CINEMA = { x: 13, z: -18 };
solid(8, 5, 0.6, 0x343a40, CINEMA.x, 2.5, CINEMA.z - 2);
{ const s = textPlane('CINEMA 🎬', 0.8, { fs: 64, bg: '#212529', fg: '#ffd43b' }); s.position.set(CINEMA.x, 4.3, CINEMA.z - 1.65);
  const p = textPlane('🍿 Now Showing', 0.4, { fs: 48, bg: '#ffffff', fg: '#c92a2a' }); p.position.set(CINEMA.x, 2.2, CINEMA.z - 1.65); }

// ---------- 북서: London Train Station (Ron) ----------
const STATION = { x: -28, z: -32 };
box(16, 0.5, 5, 0xced4da, STATION.x, 0.25, STATION.z - 2);
for (const dz of [-6, -7.4]) box(18, 0.1, 0.15, 0x868e96, STATION.x, 0.06, STATION.z + dz);
(function train() {
  const g = new THREE.Group();
  box(5, 2.4, 2.2, 0xc92a2a, 0, 1.5, 0, g); box(2, 1.2, 2, 0x212529, -1.8, 3.2, 0, g); cyl(0.3, 0.4, 1, 0x212529, 1.8, 3.1, 0, g);
  box(5, 2.2, 2.2, 0x1864ab, -5.4, 1.5, 0, g);
  for (const x of [-6.8, -4, -1.6, 1.6]) for (const z of [-1.1, 1.1]) { const w = cyl(0.4, 0.4, 0.2, 0x222222, x, 0.4, z, g); w.rotation.x = Math.PI / 2; }
  g.position.set(STATION.x + 2, 0, STATION.z - 6.7); scene.add(g); block(STATION.x - 6.5, STATION.z - 7.9, STATION.x + 4.6, STATION.z - 5.5);
})();
{ const s = textPlane('London Train 🚂', 0.8, { fs: 62, bg: '#495057', fg: '#fff' }); s.position.set(STATION.x, 3.6, STATION.z - 4.4);
  cyl(0.08, 0.08, 3.6, 0x666666, STATION.x - 3, 1.8, STATION.z - 4.45); cyl(0.08, 0.08, 3.6, 0x666666, STATION.x + 3, 1.8, STATION.z - 4.45); }
// 우체통
box(0.7, 1.3, 0.7, 0xe03131, STATION.x + 6, 0.65, STATION.z + 2); block(STATION.x + 5.6, STATION.z + 1.6, STATION.x + 6.4, STATION.z + 2.4);

// ---------- 북동: Quidditch Field (Harry) ----------
const QF = { x: 28, z: -31 };
{ const f = new THREE.Mesh(new THREE.CircleGeometry(8, 32), mat(0x69db7c)); f.rotation.x = -Math.PI / 2; f.scale.x = 1.3; f.position.set(QF.x, 0.02, QF.z); scene.add(f);
  for (const dx of [-1.8, 0, 1.8]) { const h = 4 + (dx === 0 ? 1 : 0); cyl(0.08, 0.08, h, 0xfcc419, QF.x + dx, h / 2, QF.z - 7); const r = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 8, 20), mat(0xfcc419)); r.position.set(QF.x + dx, h + 0.6, QF.z - 7); scene.add(r); block(QF.x + dx - 0.2, QF.z - 7.2, QF.x + dx + 0.2, QF.z - 6.8); }
  const s = textPlane('Quidditch World Cup 🧹', 0.7, { fs: 60, bg: '#862e9c', fg: '#fff' }); s.position.set(QF.x, 3.4, QF.z + 8.2);
  cyl(0.06, 0.06, 3.4, 0x666666, QF.x - 3.6, 1.7, QF.z + 8.2); cyl(0.06, 0.06, 3.4, 0x666666, QF.x + 3.6, 1.7, QF.z + 8.2);
  const b = new THREE.Group(); cyl(0.04, 0.04, 1.6, 0x8b5a2b, 0, 0, 0, b); const bb = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 8), mat(0xe9c46a)); bb.position.y = -0.95; b.add(bb);
  b.rotation.z = 1.2; b.position.set(QF.x + 3, 0.3, QF.z - 2); scene.add(b); }

// ---------- 남동: Ball Park (야구장) ----------
const PARK = { x: 26, z: 30 };
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat(0x51cf66)); f.rotation.x = -Math.PI / 2; f.position.set(PARK.x, 0.02, PARK.z); scene.add(f);
  const d = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), mat(0xd9a066)); d.rotation.x = -Math.PI / 2; d.rotation.z = Math.PI / 4; d.position.set(PARK.x, 0.03, PARK.z + 1); scene.add(d);
  for (const [dx, dz] of [[0, -3.5], [3.5, 0], [0, 3.5], [-3.5, 0]]) box(0.4, 0.06, 0.4, 0xffffff, PARK.x + dx, 0.06, PARK.z + 1 + dz);
  for (let r = 0; r < 3; r++) solid(16, 0.5 + r * 0.5, 1, 0x1971c2, PARK.x, 0.25 + r * 0.25, PARK.z - 6.5 - r);
  const s = textPlane('Ball Park ⚾', 0.7, { fs: 60, bg: '#1971c2', fg: '#fff' }); s.position.set(PARK.x, 3.2, PARK.z - 9.2); s.rotation.y = Math.PI;
  const s2 = textPlane('Ball Park ⚾', 0.7, { fs: 60, bg: '#1971c2', fg: '#fff' }); s2.position.set(PARK.x, 3.2, PARK.z - 9.1); }

// ---------- 남서: Let's Write 주말 계획 책상 (Sally) ----------
const WRITE = { x: -26, z: 30 };
box(16, 0.4, 12, 0xfff3bf, WRITE.x, 0.2, WRITE.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz);
box(17, 0.4, 13, 0xf08c00, WRITE.x, 5.2, WRITE.z);
{ const s = textPlane("Let's Write · My Weekend", 0.85, { fs: 62, bg: '#f08c00', fg: '#fff' }); s.position.set(WRITE.x + 8.6, 4.4, WRITE.z); s.rotation.y = Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x - 1, 0.85, WRITE.z);
solid(0.4, 3.4, 10, 0xf8f9fa, WRITE.x - 7.6, 2, WRITE.z);
[['Sat.', '🌳🐕'], ['Sun.', '🏠🧹']].forEach(([d, e], i) => { const p = textPlane(d + ' ' + e, 0.9, { fs: 80, bg: '#ffffff', border: '#f08c00', fg: '#e8590c' }); p.position.set(WRITE.x - 7.35, 2.4, WRITE.z - 2.2 + i * 4.4); p.rotation.y = Math.PI / 2; });

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'leash') { const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 18), mat(0xe03131)); r.position.y = 0.5; g.add(r); box(0.05, 0.4, 0.05, 0xe03131, 0, 0.15, 0, g); box(0.1, 0.1, 0.1, 0x868e96, 0, -0.08, 0, g); }
  else if (id === 'letter') { box(0.42, 0.28, 0.03, 0xfff3bf, 0, 0.14, 0, g); ball(0.04, 0xc92a2a, 0, 0.15, 0.03, g); }
  return g;
}
let decor = [];
function addDecor(o) { scene.add(o); decor.push(o); return o; }
function clearDecor() { decor.forEach(o => scene.remove(o)); decor = []; }

// ---------- 들고 있는 물건 ----------
scene.add(camera);
let heldMesh = null, heldMeshId = null, dogFollow = null;
function heldSync() {
  const f = held && held.kind === 'thing' ? held.id : null;
  if (f === heldMeshId) return;
  if (heldMesh) { camera.remove(heldMesh); heldMesh = null; }
  heldMeshId = f;
  if (f) { heldMesh = itemModel(f); heldMesh.scale.setScalar(0.9); heldMesh.position.set(0.34, -0.5, -0.8); camera.add(heldMesh); }
}
function setHeld(id, label) { held = { kind: 'thing', id, label }; refreshHUD(); }
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  if (DOG.userData.tail) DOG.userData.tail.rotation.y = Math.sin(t * 12) * 0.5;
  if (dogFollow) { // 개가 사람 옆을 따라가요
    const p = dogFollow.g.position, dx = p.x + 0.9 - DOG.position.x, dz = p.z + 0.6 - DOG.position.z, d = Math.hypot(dx, dz);
    if (d > 0.3) { const m = Math.min(d, 6 * dt); DOG.position.x += dx / d * m; DOG.position.z += dz / d * m; DOG.rotation.y = Math.atan2(dx, dz); }
  }
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#e3d7c1'); R(0, -2, 52, 6, '#e3d7c1');
  R(-27, -2, 14, 20, '#2f9e44', 'Rani 집'); R(27, -2, 14, 20, '#1864ab', '도서관');
  R(0, -37, 18, 7, '#c92a2a', '학교 연극'); R(STATION.x, STATION.z - 3, 16, 9, '#495057', '기차역');
  R(QF.x, QF.z, 16, 14, '#862e9c', '퀴디치'); R(WRITE.x, WRITE.z, 16, 12, '#f08c00', '주말 계획');
  R(PARK.x, PARK.z, 16, 12, '#1971c2', '야구장'); R(BOARD.x, BOARD.z, 3, 9, '#f59f00', '계획표');
  R(CARD.x, CARD.z, 3, 3, '#e8590c', '카드'); R(CINEMA.x, CINEMA.z - 2, 8, 2, '#212529', '영화관'); R(BUS.x, BUS.z, 3, 6, '#fab005', '버스');
}

// ---------------- 플레이어 ----------------
const P = { x: 0, z: 40, yaw: 0, pitch: 0, r: 0.4, jy: 0, vy: 0 };
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
const PL = Object.fromEntries(L.plans.map(p => [p.id, p]));
const TM = Object.fromEntries(L.times.map(t => [t.id, t]));
function addNPC(id, o, x, z, face = 0) {
  const g = makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '' };
  return NPC[id];
}
// 집 위치 [x, z, 방향]
const HOME = {
  raniMom: [-24, -4, Math.PI / 2], rani: [-27.5, -6.5, Math.PI / 2], ria: [-29, -3.6, Math.PI / 2], dad: [-31, 5.2, 0],
  librarian: [30, -2.6, -Math.PI / 2],
  teacher: [-10.4, 14.2, Math.PI / 2],
  joel: [-5, -20, Math.PI], olivia: [-7, -21.6, Math.PI / 2], hajun: [-3.4, -21.6, -Math.PI / 2],
  kai: [-12.4, 6, -Math.PI / 2], mina: [-15.6, 6, Math.PI / 2], leo: [-14, 7.6, Math.PI],
  ron: [-26, -29.4, 0], harry: [27, -26.5, Math.PI],
  sally: [WRITE.x + 1, WRITE.z + 1.8, Math.PI / 2],
  bonus: [6, -10, 0]
};
const KID_POS = [[6, 12], [10, 12], [6, 17], [10, 17], [6, 22], [10, 22]];
L.kids.forEach((k, i) => { HOME[k.id] = [...KID_POS[i], -Math.PI / 2]; });

addNPC('raniMom', { name: 'Mom', girl: true, shirt: 0x7048e8, skirt: 0x5f3dc4, hair: 0x1b1b1b, scale: 1.12, idle: ["I'm going to walk the dog.", '나는 개를 산책시킬 거야.'] }, ...HOME.raniMom);
addNPC('rani', { name: 'Rani', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ["I'm going to go to the library.", '나는 도서관에 갈 거야.'] }, ...HOME.rani);
addNPC('ria', { name: 'Ria', girl: true, shirt: 0xffa94d, hair: 0x1b1b1b, scale: 0.75, idle: ['I want to read comic books.', '나는 만화책을 읽고 싶어.'] }, ...HOME.ria);
addNPC('dad', { name: 'Dad', shirt: 0xffffff, pants: 0x495057, hair: 0x1b1b1b, scale: 1.15, idle: ["I'm going to make a chocolate cake.", '나는 초콜릿케이크를 만들 거야.'] }, ...HOME.dad);
addNPC('librarian', { name: 'Librarian', girl: true, shirt: 0x1864ab, skirt: 0x1c7ed6, hair: 0x6d4c41, scale: 1.1, idle: ['Welcome to the library!', '도서관에 온 것을 환영해요!'] }, ...HOME.librarian);
addNPC('teacher', { name: 'Ms. Lee', girl: true, shirt: 0xf59f00, skirt: 0xe67700, hair: 0x222222, scale: 1.12, idle: ['What are you going to do this weekend?', '이번 주말에 무엇을 할 거니?'] }, ...HOME.teacher);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ["I'm going to stay home.", '나는 집에 있을 거야.'] }, ...HOME.joel);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ["I'm going to see the school play.", '나는 학교 연극을 볼 거야.'] }, ...HOME.olivia);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ["I'm going to watch a baseball game with my dad.", '나는 아빠와 야구 경기를 볼 거야.'] }, ...HOME.hajun);
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ["I'm going to stay home.", '나는 집에 있을 거야.'] }, ...HOME.kai);
addNPC('mina', { name: 'Mina', girl: true, shirt: 0xe64980, hair: 0x111111, idle: ["I'm going to see a movie.", '나는 영화를 볼 거야.'] }, ...HOME.mina);
addNPC('leo', { name: 'Leo', shirt: 0x82c91e, hair: 0x8d5524, idle: ['Have a good time!', '좋은 시간 보내!'] }, ...HOME.leo);
addNPC('ron', { name: 'Ron', shirt: 0x862e9c, hair: 0xd9480f, idle: ["I'm going to watch the Quidditch World Cup.", '나는 퀴디치 월드컵을 볼 거야.'] }, ...HOME.ron);
addNPC('harry', { name: 'Harry', shirt: 0x343a40, hair: 0x111111, idle: ['I want to go shopping in London, too.', '나는 런던에서 쇼핑도 하고 싶어.'] }, ...HOME.harry);
addNPC('sally', { name: 'Sally', girl: true, shirt: 0xf08c00, hair: 0xd4a017, idle: ["I'm going to go to the park on Saturday.", '나는 토요일에 공원에 갈 거야.'] }, ...HOME.sally);
addNPC('bonus', { name: 'Dean', shirt: 0x0ca678, hair: 0x5c3d1e, idle: ["I'm going to read books and eat some cake.", '나는 책을 읽고 케이크를 먹을 거야.'] }, ...HOME.bonus);
L.kids.forEach((k, i) => addNPC(k.id, { name: k.name, girl: k.girl, shirt: k.shirt, hair: [0x3b2a1a, 0x111111, 0xd4a017, 0x222222, 0xa0522d, 0x111111][i], scale: 0.9, idle: [`I'm going to ${k.plan}.`, `나는 ${PL[k.plan].ko}.`] }, ...HOME[k.id]));
// 아이들 머리 위 시간 표지판 (미션 2에서만 보임)
const kidSign = {};
L.kids.forEach(k => { const s = textSprite('🕑 ' + k.time, 0.42 / 0.9, { fs: 46, bg: '#1971c2', fg: '#fff' }); s.position.y = 3.6; s.visible = false; NPC[k.id].g.add(s); kidSign[k.id] = s; });
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
const stageDots = (() => { try { const d = document.createElement('div'); d.id = 'stageDots'; ui.stage.parentElement.insertBefore(d, ui.stage); return d; } catch (e) { return null; } })();
function toast(msg, ms = 2200) { ui.toast.innerHTML = msg; ui.toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => ui.toast.classList.remove('show'), ms); }
function refreshHUD() {
  ui.stars.textContent = S.stars;
  ui.stage.textContent = STAGES[Math.min(S.stage, STAGES.length - 1)].title;
  if (stageDots) { let h = ''; for (let i = 0; i < STAGES.length - 1; i++) h += `<i class="${i < S.stage ? 'on' : i === S.stage ? 'now' : ''}"></i>`; stageDots.innerHTML = h; }
  ui.th.textContent = S.th.length + '/' + L.th.length;
  ui.held.style.display = held ? 'block' : 'none';
  if (held) ui.held.innerHTML = '들고 있는 것: <b>' + held.label + '</b>';
  $('#koToggle').classList.toggle('on', S.koHelp);
}
function addStar(n = 1) { S.stars += n; save(); refreshHUD(); flyStar(n); ui.stars.parentElement.classList.remove('pop'); void ui.stars.offsetWidth; ui.stars.parentElement.classList.add('pop'); }

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
    let first = true, wrongs = 0;
    const right = o.right !== undefined ? o.right : choices[0];
    const order = o.noShuffle ? choices : shuffle(choices);
    const btns = order.map((c, i) => {
      const b = document.createElement('button'); b.className = 'choice'; if (c === right) b.dataset.r = 1; b.innerHTML = `<span class="num">${i + 1}</span>${c}`;
      b.onclick = () => {
        if (b.disabled) return;
        if (c === right) {
          b.classList.add('right'); btns.forEach(x => x.disabled = true); beep('ok');
          S.tries++; if (first) { S.correct++; S.streak++; S.best = Math.max(S.best, S.streak); addStar(); praise(S.streak); } save();
          track('answer', { stage: S.stage, q: String(en || ko || '').slice(0, 80), ok: first, first: true });
          if (o.sayIt !== false && /[a-z]/i.test(c)) speak(c.replace(/<[^>]+>/g, ''), o.me ? '나' : who);
          if (o.after) { ui.ko.style.display = 'block'; ui.ko.textContent = o.after; }
          setTimeout(() => { dlgChoiceKeys = null; res(first); }, o.wait || 1100);
        } else {
          b.classList.add('wrong'); b.disabled = true; beep('bad');
          if (first) { S.tries++; S.streak = 0; save(); } first = false;
          if (o.hint) { ui.ko.style.display = 'block'; ui.ko.textContent = '💡 ' + o.hint; }
          if (++wrongs >= 2 && btns.length >= 4) btns.forEach(x => { if (x.dataset.r) x.classList.add('nudge'); });
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
const Qt = (t) => `What are you going to do ${t}?`;
const QCH = (t) => [Qt(t), ...L.times.map(x => x.id).filter(x => x !== t).map(Qt), "What's wrong?"];
const planChoices = (right) => [right, ...shuffle(L.plans.map(p => p.id).filter(x => x !== right)).slice(0, 3)].map(p => `${PL[p].emoji} ${p}`);
const sentChoices = (right) => [right, ...shuffle(L.plans.map(p => p.id).filter(x => x !== right)).slice(0, 3)].map(p => `I'm going to ${p}.`);
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. Rani네 일요일', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 친구들의 계획표', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. 금요일 하굣길', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 해리와 론의 주말', book: 'Before/After You Read', start: stage5 },
  { title: '6. 나의 주말 계획', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {}; dogFollow = null;
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  for (const s of Object.values(kidSign)) s.visible = false;
  placeDog(...DOG_HOME);
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
function boardCard(text, x, y, z) { const p = textPlane(text, 0.5, { fs: 50, bg: '#fff9db', fg: '#1d3557', border: '#f59f00' }); scene.remove(p); p.position.set(x, y, z); p.rotation.y = Math.PI / 2; return addDecor(p); }

// ---- 1. Fun Talk 1 ----
function stage1() {
  setObj("🏠 서쪽 <b>Rani's House</b>의 <b>Mom</b>에게 가요", npcAt('raniMom')); mark('raniMom');
  NPC.raniMom.talk = async () => {
    mark('raniMom', false); NPC.raniMom.talk = null;
    await say('', '', '☀️ 일요일 오전이에요. Rani네 가족이 오후 계획을 이야기해요. 내가 엄마가 되어 볼까요?', { btn: '좋아!' });
    await ask('나', '엄마가 되어 Rani에게 오늘 오후 계획을 물어보세요.', '알맞은 질문을 고르세요.', QCH('this afternoon'), { me: true, hint: 'this afternoon = 오늘 오후' });
    await say('Rani', "I'm going to go to the library. I want to read science books.", '나는 도서관에 갈 거예요. 과학책을 읽고 싶어요.', { listen: true });
    await ask('', 'What is Rani going to do this afternoon?', 'Rani는 오늘 오후에 무엇을 할 계획인가요?', planChoices('go to the library'), { sayIt: false, hint: '🔊 다시 듣기를 눌러 보세요.' });
    await say('Mom', 'Sounds good.', '좋구나.');
    await say('Rani', 'Ria, do you want to come with me?', 'Ria, 나랑 같이 갈래?');
    await say('Ria', 'Yes. I want to read comic books.', '응. 나는 만화책을 읽고 싶어.');
    await say('', '', '이번엔 내가 Rani가 되어 엄마의 계획을 물어봐요.', {});
    await ask('나', 'Rani가 되어 엄마에게 오늘 오후 계획을 물어보세요.', '알맞은 질문을 고르세요.', ["Okay. Let's go together. What are you going to do this afternoon, Mom?", "Okay. Let's go together. What are you going to do this weekend, Mom?", "Okay. Let's go together. What's wrong, Mom?"], { me: true });
    await say('Mom', "I'm going to walk the dog.", '나는 개를 산책시킬 거야.', { listen: true });
    await ask('', 'Who is going to walk the dog this afternoon?', '오늘 오후에 개를 산책시킬 사람은 누구인가요?', ['Mom', 'Rani', 'Ria', 'Dad'], { hint: "Mom: I'm going to walk the dog." });
    await say('Mom', '', '🦮 마당 개집 옆에 있는 Coco의 목줄 좀 가져다줄래?', { btn: '가져올게!' });
    closeDlg();
    const LX = DOGHOUSE.x + 2.4, LZ = DOGHOUSE.z - 1.6;
    setObj('🦮 마당 <b>개집</b> 옆에서 <b>목줄</b>을 가져와요', () => [LX, LZ]);
    const g = itemModel('leash'); g.scale.setScalar(1.8);
    addItem(g, LX, LZ, (it) => {
      removeItem(it); setHeld('leash', '🦮 leash'); beep('get');
      setObj('🦮 엄마에게 목줄을 줘요', npcAt('raniMom')); mark('raniMom');
      NPC.raniMom.talk = async () => {
        mark('raniMom', false); NPC.raniMom.talk = null; held = null; refreshHUD(); good();
        await say('Mom', '', '고마워! 이제 Coco를 산책시킬게. 🐕');
        placeNPC('raniMom', DOGHOUSE.x + 3.4, DOGHOUSE.z + 4, Math.PI / 2); dogFollow = NPC.raniMom;
        closeDlg(); s1dad();
      };
    }, { y: 0.6, r: 1.4, spin: 0.8 });
  };
}
function s1dad() {
  setObj('🎂 부엌의 <b>Dad</b>에게 가요', npcAt('dad')); mark('dad');
  NPC.dad.talk = async () => {
    mark('dad', false); NPC.dad.talk = null;
    await say('Dad', "Rani, Ria! I'm going to make a chocolate cake.", 'Rani, Ria! 아빠는 초콜릿케이크를 만들 거야.');
    await say('Rani', 'Wow, I love your chocolate cake.', '와, 저는 아빠의 초콜릿케이크가 정말 좋아요.');
    await say('Dad', "I'll put some banana cream on it.", '그 위에 바나나 크림을 올릴 거야.');
    await say('Rani', "That's great. We'll come home early.", '좋아요. 우리 일찍 돌아올게요.');
    await say('Ria', 'See you later!', '이따 봐요!');
    await ask('', 'What is Dad going to make this afternoon?', '아빠는 오늘 오후에 무엇을 만들 계획인가요?', ['🎂 a chocolate cake', '🍕 a pizza', '🍪 cookies', '🍊 orange juice'], { sayIt: false });
    closeDlg(); s1lib();
  };
}
function s1lib() {
  setObj('📚 <b>Rani</b>에게 가서 도서관에 같이 가요', npcAt('rani')); mark('rani');
  NPC.rani.talk = async () => {
    mark('rani', false); NPC.rani.talk = null;
    await say('Rani', "Let's go together.", '같이 가자!');
    closeDlg(); NPC.rani.follow = true; NPC.ria.follow = true;
    setObj('📚 Rani, Ria와 함께 동쪽 <b>Library</b>의 <b>사서</b>에게 가요', npcAt('librarian')); mark('librarian');
    NPC.librarian.talk = async () => {
      mark('librarian', false); NPC.librarian.talk = null;
      placeNPC('rani', LTABLE.x - 0.8, LTABLE.z + 1.4, Math.PI); placeNPC('ria', LTABLE.x + 0.8, LTABLE.z + 1.4, Math.PI);
      await say('Librarian', 'Welcome to the library!', '도서관에 온 걸 환영해요! 과학책과 만화책은 저쪽에 있어요.');
      await say('', '', '📖 Rani는 지구 과학책을, Ria는 만화책을 읽어요. 어? 땅속 지층 그림이 초콜릿케이크처럼 보여요! 🎂', {});
      await ask('', 'What does Ria want to read?', 'Ria는 무엇을 읽고 싶어 했나요?', ['comic books', 'science books', 'a letter'], { hint: 'Ria: I want to read ______ books.' });
      await say('', '', '📚 Fun Talk 1 완료! Rani와 Ria는 도서관에 가고(go to the library), 엄마는 개를 산책시켜요(walk the dog).', { btn: '다음 미션 ▶' });
      nextStage();
    };
  };
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  for (const s of Object.values(kidSign)) s.visible = true;
  setObj('🗓️ 광장 <b>계획표</b> 앞의 <b>Ms. Lee</b>에게 가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await say('Ms. Lee', "Let's listen to our friends' plans.", '친구들의 계획을 잘 듣고 계획표를 완성해요.');
    await say('', '', '친구 6명의 머리 위 🕑 시간을 보고 계획을 물어보세요. 잘 듣고 계획표에 붙일 그림 카드를 골라요.', { btn: '시작!' });
    closeDlg(); stageState.done = {}; stageState.slot = {};
    L.kids.forEach(k => {
      mark(k.id);
      NPC[k.id].talk = async () => {
        if (stageState.done[k.id]) { await say(k.name, `I'm going to ${k.plan}.`, `나는 ${PL[k.plan].ko}.`); closeDlg(); return; }
        mark(k.id, false);
        await ask('나', `${k.name}에게 ${TM[k.time].ko} 계획을 물어보세요. (🕑 ${k.time})`, '알맞은 질문을 고르세요.', QCH(k.time), { me: true });
        await say(k.name, `I'm going to ${k.plan}.`, '잘 듣고 계획표에 붙일 그림 카드를 골라요. (🔊 다시 듣기)', { listen: true, koAlways: true });
        await ask('', `🗓️ ${k.name} · ${TM[k.time].board}: I'm going to ______.`, '알맞은 그림 카드를 고르세요.', planChoices(k.plan), { sayIt: false, hint: '🔊 다시 듣기' });
        stageState.done[k.id] = 1; closeDlg();
        const n0 = stageState.slot[k.time] || 0; stageState.slot[k.time] = n0 + 1;
        boardCard(`${PL[k.plan].emoji} ${k.name}`, ...boardSlot(k.time, n0));
        kidSign[k.id].visible = false;
        const n = Object.keys(stageState.done).length;
        if (n < L.kids.length) setObj(`🗓️ 친구에게 계획을 물어봐요 (${n}/6)`, () => nearestOf(L.kids.filter(x => !stageState.done[x.id]).map(x => x.id)));
        else s2pt1();
      };
    });
    setObj('🗓️ 광장 오른쪽 친구들에게 계획을 물어봐요 (0/6)', () => nearestOf(L.kids.filter(x => !stageState.done[x.id]).map(x => x.id)));
  };
}
function s2pt1() {
  setObj('👩‍🏫 계획표 앞의 <b>Ms. Lee</b>에게 돌아가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await say('Ms. Lee', "Great job! Let's play a game.", '잘했어요! 계획표 완성하기 놀이를 해요. 선생님의 계획을 묻고, 같은 카드를 골라 따라 말해요.');
    for (const tp of L.teacherPlan) {
      await ask('나', `선생님께 ${TM[tp.time].ko} 계획을 물어보세요.`, 'Play Together 1 · 알맞은 질문을 고르세요.', QCH(tp.time), { me: true });
      await say('Ms. Lee', `I'm going to ${tp.plan}.`, '잘 들어 보세요. (🔊 다시 듣기)', { listen: true, koAlways: true });
      await ask('', `🗓️ ${TM[tp.time].board}: ?`, '선생님의 계획과 같은 카드를 골라 따라 말해요.', sentChoices(tp.plan), { me: true, hint: '🔊 다시 듣기' });
    }
    await say('Ms. Lee', 'Wonderful!', '훌륭해요! 선생님의 계획을 모두 맞혔어요.');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  setObj('🏫 북쪽 <b>Dream School</b> 앞의 <b>Joel</b>에게 가요', npcAt('joel')); mark('joel');
  NPC.joel.talk = async () => {
    mark('joel', false); NPC.joel.talk = null;
    await say('', '', '🎒 금요일 하굣길이에요. Joel, Olivia, 하준이가 함께 집에 가고 있어요. 내가 Joel이 되어 볼까요?', { btn: '좋아!' });
    await ask('나', 'Joel이 되어 하준이에게 내일 계획을 물어보세요.', '알맞은 질문을 고르세요.', ['Hajun, what are you going to do tomorrow?', 'Hajun, what are you going to do this afternoon?', "Hajun, what's wrong?", 'Hajun, what grade are you in?'], { me: true });
    await say('Hajun', "I'm going to watch a baseball game with my dad.", '나는 아빠와 야구 경기를 볼 거야.', { listen: true });
    await ask('', 'What is Hajun going to do tomorrow?', '하준이는 내일 무엇을 할 계획인가요?', planChoices('watch a baseball game'), { sayIt: false, hint: '🔊 다시 듣기' });
    await say('Joel', 'That sounds great.', '그거 좋겠다.');
    await ask('나', 'Olivia가 되어 하준이에게 기원하는 말을 해 주세요. 😊', '알맞은 말을 고르세요.', ['Have a good time!', "That's too bad.", 'Get some rest.', 'Nice to meet you.'], { me: true, hint: 'Have a good time! = 좋은 시간 보내!' });
    await say('Hajun', 'Thanks. See you.', '(노란 셔틀버스를 보고) 고마워. 안녕.');
    placeNPC('hajun', BUS.x + 2, BUS.z + 2.6, Math.PI / 2);
    await say('Olivia', 'What are you going to do tomorrow?', '(Joel에게) 너는 내일 뭐 할 거니?');
    await ask('나', 'Joel이 되어 대답해요. Joel은 내일 🏠 집에 있을 거예요.', '알맞은 대답을 고르세요.', ["I'm going to stay home. How about you?", "I'm going to see a movie. How about you?", "I'm going to walk the dog. How about you?", 'I have a runny nose.'], { me: true });
    await say('Olivia', "I'm going to see the school play, Peter Pan.", '나는 학교 연극 〈피터 팬〉을 볼 거야.', { listen: true });
    await ask('', 'What is Olivia going to do tomorrow?', 'Olivia는 내일 무엇을 할 계획인가요?', ['See the school play.', 'Watch a baseball game.', 'Go to the library.', 'Stay home.']);
    await say('Joel', 'Peter Pan?', '피터 팬?');
    await say('Olivia', 'Yes, my little brother will be in the play. Do you want to go with me?', '응, 내 남동생이 연극에 나와. 나랑 같이 갈래?');
    await say('Joel', 'Sure.', '좋아.');
    await say('Olivia', "Great. Let's meet at school at 2.", '좋아. 2시에 학교에서 만나.');
    await ask('', 'What time are they going to meet?', '두 사람은 몇 시에 만나기로 했나요?', ['At 2.', 'At 5.', 'At 12.'], { sayIt: false });
    closeDlg(); s3play();
  };
}
function s3play() {
  placeNPC('olivia', 1.6, -30.5, Math.PI); NPC.joel.g.visible = false; placeNPC('hajun', ...HOME.hajun); NPC.hajun.g.visible = false;
  const hook = makePerson({ name: 'Captain Hook', shirt: 0xc92a2a, pants: 0x212529, hair: 0x111111 }); hook.position.set(-2.6, 0.7, -37.2); hook.rotation.y = 0.3; addDecor(hook);
  const pan = makePerson({ name: 'Peter Pan', shirt: 0x40c057, pants: 0x2b8a3e, hair: 0xd9480f, scale: 0.85 }); pan.position.set(0, 0.7, -38.3); addDecor(pan);
  const croc = crocModel(); croc.scale.setScalar(1.1); croc.position.set(3.2, 0.7, -36.6); croc.rotation.y = -1.2; addDecor(croc);
  const tag = textSprite('🐊', 0.5, { fs: 60, bg: null }); tag.position.set(3.2, 1.9, -36.6); addDecor(tag);
  setObj('🎭 다음 날! 학교 <b>연극 무대</b> 앞의 <b>Olivia</b>에게 가요', npcAt('olivia')); mark('olivia');
  NPC.olivia.talk = async () => {
    mark('olivia', false); NPC.olivia.talk = null;
    await say('Joel', 'Is that your brother?', '(후크 선장을 가리키며) 저 사람이 네 동생이야?');
    await say('Olivia', "No. He's over there. That's my brother.", '(바닥을 기어 다니는 악어를 가리키며) 아니. 저기 있어. 저게 내 동생이야.', { listen: true });
    await ask('', "Who is Olivia's brother?", 'Olivia의 남동생은 누구일까요?', ['🐊 the crocodile', '🏴‍☠️ Captain Hook', '🧚 Peter Pan'], { sayIt: false });
    await say('Joel', "He's a good actor.", '(당황하며) 연기 잘한다.');
    await say('', '', '😆 Fun Talk 2 완료! 이제 광장의 카드 탁자에서 계획 카드 놀이를 해요.', { btn: '좋아!' });
    closeDlg(); s3pt2();
  };
}
function s3pt2() {
  const cards = () => stageState.hand.map(c => `${PL[c].emoji} ${c}`).join(' · ');
  stageState.hand = L.myCards.slice();
  setObj('🃏 광장 <b>Plan Cards</b> 탁자의 <b>Kai</b>에게 가요', npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await say('Kai', "Let's play a card game!", '계획 카드 내려놓기 놀이를 하자! 친구와 같은 카드가 있으면 내려놓으며 “Have a good time!” 하고 말해.');
    await say('', '', `🃏 내 카드: ${cards()}`, { btn: '시작!' });
    // 1) Kai: tomorrow / stay home (내게 있음)
    await ask('나', 'Kai에게 내일 계획을 물어보세요.', 'Read and Talk · 알맞은 질문을 고르세요.', QCH('tomorrow'), { me: true });
    await say('Kai', "I'm going to stay home.", '(카드를 내려놓으며) 잘 들어 보세요.', { listen: true, koAlways: true });
    await ask('나', `🃏 내 카드: ${cards()}`, '나에게 Kai와 같은 카드가 있어요! 카드를 내려놓으며 말해요.', ['Have a good time!', "That's too bad.", 'Get some rest.', 'Nice to meet you.'], { me: true });
    stageState.hand = stageState.hand.filter(c => c !== 'stay home');
    // 2) Mina: this afternoon / see a movie (내게 없음)
    await ask('나', 'Mina에게 오늘 오후 계획을 물어보세요.', '알맞은 질문을 고르세요.', QCH('this afternoon'), { me: true });
    await say('Mina', "I'm going to see a movie.", '(카드를 내려놓으며) 잘 들어 보세요.', { listen: true, koAlways: true });
    await ask('', `🃏 내 카드: ${cards()}`, 'Mina와 같은 카드가 있나요?', ['❌ 없어요 → 카드 더미에서 한 장 가져가요', '⭕ 있어요 → Have a good time!'], { noShuffle: true, sayIt: false });
    stageState.hand.push('go to the library'); toast('🃏 새 카드를 가져왔어요: 📚 go to the library', 2500);
    // 3) 내 차례
    await say('Leo', 'What are you going to do this weekend?', '친구들이 나에게 물어요. 내 카드 한 장을 내려놓으며 대답해요.');
    await ask('나', `🃏 내 카드: ${cards()}`, '내 카드에 있는 계획으로 대답하세요.', ["I'm going to walk the dog.", "I'm going to see a movie.", "I'm going to watch a baseball game.", "I'm going to do my science project."], { me: true });
    await say('Leo', 'Have a good time!', '(같은 카드를 내려놓으며) 좋은 시간 보내!');
    await say('Kai', '', '🃏 Play Together 2 완료! 계획을 묻고 답하고, “Have a good time!”으로 기원하는 말을 했어요.', { btn: '다음 미션 ▶' });
    nextStage();
  };
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('teacher', 0, 12, Math.PI);
  setObj('🧱 광장 가운데의 <b>Ms. Lee</b>에게 가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await say('Ms. Lee', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '길 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['this', 'weekend?', 'afternoon?', 'see', 'movie.', 'stay', 'home.', 'good', 'dog.', 'library.', 'What', 'Have', 'walk'].filter(w => !words.includes(w));
  const extra = shuffle(pool).slice(0, 2);
  stageState.words = words; stageState.wi = 0; stageState.miss = 0;
  const all = shuffle(words.concat(extra));
  all.forEach((w, i) => {
    const a = (i / all.length) * Math.PI * 2 + Math.random() * 0.3, r = 5.5 + Math.random() * 3.5;
    const it = addItem(wordCube(w), BLK.x + Math.sin(a) * r, BLK.z + Math.cos(a) * r, (it) => {
      if (it.cool > performance.now()) return;
      if (w === stageState.words[stageState.wi]) {
        removeItem(it); stageState.wi++; beep('get'); speak(w.replace(/[?.,!]/g, ''), '나'); drawSentenceBar();
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
  await say('Ms. Lee', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. Harry and Ron's Weekend (Reading) ----
function stage5() {
  setObj('🚂 북서쪽 <b>London Train</b> 역의 <b>Ron</b>에게 가요', npcAt('ron')); mark('ron');
  NPC.ron.talk = async () => {
    mark('ron', false); NPC.ron.talk = null;
    await say('', '', '📖 Before You Read · Ron이 Harry에게 쓴 편지예요. 계획을 나타내는 말(I\'m going to ~)에 귀 기울이며 읽어 봐요.', { btn: '읽기' });
    await readLines(L.reading.ron);
    await say('', '', "After You Read · Ron's Sunday: Ron의 일요일 계획에 맞는 단어를 골라요.", { btn: '시작' });
    await ask('', 'watch the ______ World Cup', "Ron's Sunday ①", ['Quidditch', 'soccer'], { sayIt: false });
    await ask('', 'go to London by ______', "Ron's Sunday ②", ['train', 'bus'], { sayIt: false });
    await ask('', 'buy the ______ for the flying class', "Ron's Sunday ③", ['textbook', 'ticket'], { sayIt: false });
    await ask('', 'buy a ______', "Ron's Sunday ④", ['scarf', 'hat'], { sayIt: false });
    await say('Ron', '', '✉️ 이 편지를 Harry에게 전해 줄래? Harry는 북동쪽 퀴디치 경기장에 있어.', { btn: '좋아!' });
    closeDlg(); setHeld('letter', '✉️ letter'); beep('get');
    setObj('✉️ 북동쪽 <b>Quidditch</b> 경기장의 <b>Harry</b>에게 편지를 전해요', npcAt('harry')); mark('harry');
    NPC.harry.talk = async () => {
      mark('harry', false); NPC.harry.talk = null; held = null; refreshHUD(); good();
      await say('Harry', '', '와, Ron의 편지구나! 고마워. 바로 답장을 쓸게.');
      await readLines(L.reading.harry);
      await ask('', 'Harry wants to watch the game with Ron.', '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { noShuffle: true, sayIt: false });
      await ask('', 'Harry wants to go shopping in Paris.', '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { right: '❌ X (틀려요)', noShuffle: true, sayIt: false, hint: 'I want to go shopping in ______, too.' });
      await say('', '', 'After You Read · 글의 내용에 맞게 Harry와 Ron의 대화를 완성해요.', { btn: '시작' });
      await ask('Harry', 'Sure. ______ are you going to do this Sunday?', '빈칸에 알맞은 말', ['What', 'Where', 'Who'], { sayIt: false });
      await ask('Harry', 'Sure. What are you ______ to do this Sunday?', '빈칸에 알맞은 말', ['going', 'go', 'want'], { sayIt: false });
      await ask('Ron', "I'm going to ______ the Quidditch World Cup.", '빈칸에 알맞은 말', ['watch', 'buy', 'read'], { sayIt: false });
      await ask('Ron', "I'm going to buy a textbook and a ______, too.", '빈칸에 알맞은 말', ['scarf', 'ticket', 'train'], { sayIt: false });
      speak("I'm going to buy a textbook and a scarf, too. Can you come with me?", 'Ron');
      await say('Harry', 'See you this Sunday.', '이번 일요일에 만나! 🧹');
      nextStage();
    };
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("✏️ 남서쪽 <b>My Weekend</b> 책상의 <b>Sally</b>에게 가요", npcAt('sally')); mark('sally');
  NPC.sally.talk = async () => {
    mark('sally', false);
    await say('Sally', 'Read my weekend plans!', '내 주말 계획 글을 읽어 줘!');
    await readLines(L.writeSample);
    await ask('', 'What is Sally going to do on Saturday?', 'Sally는 토요일에 무엇을 할 계획인가요?', ['Go to the park and walk the dog.', 'Stay home and clean my room.', 'Ride a bike and go swimming.']);
    await ask('', 'What is Sally going to do on Sunday?', 'Sally는 일요일에 무엇을 할 계획인가요?', ['Stay home and clean my room.', 'Go to the park and walk the dog.', 'See a movie.']);
    await say('Sally', 'Tell me about your weekend plans.', '이제 너의 주말 계획을 써 줘!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const opt = L.writePlans.map((a, i) => `<option value="${i}">${a[0]} (${a[1]})</option>`).join('');
  ['#wSat1', '#wSat2', '#wSun1', '#wSun2'].forEach(s => $(s).innerHTML = opt);
  $('#wSat1').value = 0; $('#wSat2').value = 1; $('#wSun1').value = 2; $('#wSun2').value = 3;
  if (S.card) { $('#wMe').value = S.card.me || ''; $('#wSat1').value = S.card.sat1; $('#wSat2').value = S.card.sat2; $('#wSun1').value = S.card.sun1; $('#wSun2').value = S.card.sun2; }
  const upd = () => { $('#wPreview').innerHTML = letterHTML(letterData()); };
  f.oninput = upd; upd();
  $('#wRead').onclick = () => speak(letterText(letterData()).map(l => l[1]).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = letterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.me)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if (c.sat1 === c.sat2) { toast('토요일 계획 두 가지를 서로 다르게 골라 주세요.'); return; }
    if (c.sun1 === c.sun2) { toast('일요일 계획 두 가지를 서로 다르게 골라 주세요.'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).slice(1).map(l => l[1]).join(' '), '나');
    await say('Sally', 'Have a good time!', '멋진 주말 계획이야! 좋은 시간 보내!');
    nextStage(); showEnd();
  };
}
function letterData() { return { me: $('#wMe').value.trim(), sat1: +$('#wSat1').value, sat2: +$('#wSat2').value, sun1: +$('#wSun1').value, sun2: +$('#wSun2').value }; }
function letterText(c) {
  const me = c.me || '____', p = (i) => (L.writePlans[i] || L.writePlans[0])[0];
  return [['Sally', 'What are you going to do this weekend? Tell me about your weekend plans.'],
    [me, `I'm going to ${p(c.sat1)} on Saturday. I'm going to ${p(c.sat2)}, too.`],
    [me, `I'm going to ${p(c.sun1)} on Sunday. I'm going to ${p(c.sun2)}, too.`]];
}
function letterHTML(c) {
  const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  return '<div class="cardPrev">' + letterText(c).map(l => `<div><b style="color:var(--accent)">${esc(l[0])}</b> ${esc(l[1])}</div>`).join('') + '</div>';
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>ea 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · ea 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? letterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? letterText(S.card).map(l => l[0] + ': ' + l[1]).join(' ') : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 ea 코인 ----
const TH_SPOTS = [[-38, 14], [38, -16], [-12, -38.5], [38, 42], [-40, -20], [-40, 40]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('ea', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('ea', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Dean');
      toast(`🪙 ea 코인: <b>${w.replace('ea', '<u>ea</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast("🏅 ea 코인을 모두 모았어요! I'm going to read books and eat some cake.", 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Dean', "Hi! I'm Dean. I'm going to read books and eat some cake.", '안녕! 나는 Dean이야. 나는 책을 읽고 케이크를 먹을 거야.');
  await say('Dean', 'Listen: read, eat, Dean. ea, ea, ea!', 'Sounds and Letters · ea는 길게 [이:] 소리가 나요.');
  await say('', '', `🪙 마을 구석구석에 숨은 ea 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
  closeDlg();
};

// ---------------- 상호작용 ----------------
let nearNPC = null;
function interact() {
  if (dlgOpen || busy || !started || !nearNPC) return;
  const n = nearNPC;
  coachDone('talk');
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
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'Space' && !nearNPC) jump();
  else if (['KeyE', 'Enter', 'Space'].includes(e.code)) interact();
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
function jump() { if (!started || dlgOpen || P.jy > 0) return; P.vy = 5.2; P.jy = 0.001; beep('jump'); coachDone('jump'); }
const jumpBtn = document.createElement('button'); jumpBtn.id = 'jumpBtn'; jumpBtn.textContent = '점프'; document.body.appendChild(jumpBtn);
jumpBtn.addEventListener('click', jump);
// 효과음 켜기/끄기 (M)
const sfxBtn = document.createElement('button'); sfxBtn.id = 'sfxBtn'; sfxBtn.title = '효과음 켜기/끄기 (M)';
const sfxLabel = () => { sfxBtn.textContent = MUTE ? '🔇' : '🎵'; };
function toggleMute() { MUTE = !MUTE; try { localStorage.setItem('english3d_mute', MUTE ? '1' : '0'); } catch (e) {} sfxLabel(); toast(MUTE ? '🔇 효과음 꺼짐 (영어 말소리는 그대로 나와요)' : '🎵 효과음 켜짐'); if (!MUTE) beep('ok'); }
sfxBtn.onclick = toggleMute; sfxLabel();
try { const bs = document.querySelector('.hud .btns'); bs.insertBefore(sfxBtn, $('#mapBtn')); } catch (e) {}
document.addEventListener('click', (e) => { try { if (e.isTrusted && e.target.closest && e.target.closest('button:not(.choice),a')) beep('click'); } catch (er) {} });
// 처음 한 번: 조작 연습 카드
const coach = { el: null, done: {}, yaw0: 0, x0: 0, z0: 0 };
function coachStart() {
  try { if (localStorage.getItem('english3d_coach')) return; } catch (e) { return; }
  const steps = isTouch
    ? [['look', '오른쪽 화면을 밀어 둘러봐요'], ['move', '왼쪽 화면을 밀어 걸어요'], ['talk', '❗친구 옆에서 <b>말 걸기</b>를 눌러요']]
    : [['look', '화면을 <b>클릭</b>하고 마우스로 둘러봐요'], ['move', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 로 걸어요 (<kbd>Shift</kbd> 달리기)'], ['talk', '❗친구 옆에서 <kbd>E</kbd> 를 눌러요']];
  const el = document.createElement('div'); el.id = 'coach';
  el.innerHTML = '<b>🎮 이렇게 움직여요</b><button id="coachX" title="닫기">✕</button>' + steps.map(s => `<div data-k="${s[0]}">${s[1]}</div>`).join('');
  document.body.appendChild(el); coach.el = el; coach.yaw0 = P.yaw; coach.x0 = P.x; coach.z0 = P.z; coach.turn = 0;
  el.querySelector('#coachX').onclick = coachEnd;
}
function coachEnd() { if (!coach.el) return; coach.el.remove(); coach.el = null; try { localStorage.setItem('english3d_coach', '1'); } catch (e) {} }
function coachDone(k) {
  if (!coach.el || coach.done[k]) return;
  const d = coach.el.querySelector(`[data-k="${k}"]`); if (!d) return;
  coach.done[k] = 1; d.classList.add('ok');
  if (coach.el.querySelectorAll('div.ok').length === coach.el.querySelectorAll('div').length) { toast('👍 조작 연습 끝! 빨간 화살표를 따라가요'); setTimeout(coachEnd, 1200); }
}
function coachTick() {
  if (!coach.el) return;
  coach.el.style.display = dlgOpen ? 'none' : 'block';
  coach.turn += Math.abs(P.yaw - coach.yaw0); coach.yaw0 = P.yaw;
  if (coach.turn > 0.8) coachDone('look');
  if (Math.hypot(P.x - coach.x0, P.z - coach.z0) > 4) coachDone('move');
}
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
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 26, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xff3b6b, transparent: true, opacity: 0.16, depthWrite: false }));
scene.add(beam);
const trail = new THREE.Group(); scene.add(trail);
(() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.strokeStyle = '#fff'; x.lineWidth = 14; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(10, 46); x.lineTo(32, 18); x.lineTo(54, 46); x.stroke();
  const tex = new THREE.CanvasTexture(c);
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: tex, color: 0xff3b6b, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; trail.add(m);
  }
})();
const edgeL = document.createElement('div'), edgeR = document.createElement('div');
edgeL.className = 'edge l'; edgeL.innerHTML = '◀<small>이쪽!</small>'; edgeR.className = 'edge r'; edgeR.innerHTML = '▶<small>이쪽!</small>';
document.body.appendChild(edgeL); document.body.appendChild(edgeR);
function guideTick(t, p, d, rel) {
  const on = !!p && started;
  beam.visible = on && d > 6; trail.visible = on && d > 4;
  const side = on && !dlgOpen && Math.abs(rel) > 0.75 ? (rel > 0 ? 1 : -1) : 0;
  edgeL.classList.toggle('show', side === 1); edgeR.classList.toggle('show', side === -1);
  if (!on) return;
  beam.position.set(p[0], 13, p[1]);
  trail.position.set(P.x, 0.13, P.z); trail.rotation.y = P.yaw + rel;
  const ph = (t * 1.2) % 1;
  trail.children.forEach((m, i) => {
    const s = 3.4 + (i + ph) * 1.5;
    m.visible = s < d - 1.8; m.position.z = -s;
    m.material.opacity = Math.min(1, (i + ph) / 1.2, (7 - i - ph) / 2) * 0.7;
  });
}

// ---------------- 메인 루프 ----------------
let lastT = performance.now(), zoneNow = null, mapTick = 0;
const SPEED = 5.5;
let running = false;
function update(dt, t) {
  if (started && !dlgOpen) {
    let fx = 0, fz = 0;
    if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1;
    if (keys.KeyA) fx -= 1; if (keys.KeyD) fx += 1;
    if (keys.ArrowLeft) P.yaw += 2.2 * dt; if (keys.ArrowRight) P.yaw -= 2.2 * dt;
    if (keys.KeyQ) P.yaw += 2.2 * dt;
    fz -= touch.mz; fx += touch.mx;
    const len = Math.hypot(fx, fz);
    running = len > 0 && !!(keys.ShiftLeft || keys.ShiftRight);
    if (len > 0) {
      const k = Math.min(1, len) / len * SPEED * (keys.ShiftLeft || keys.ShiftRight ? 1.7 : 1) * dt;
      const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      P.x += (-sy * fz + cy * fx) * k; P.z += (-cy * fz - sy * fx) * k;
    }
    collide();
  } else running = false;
  if (P.jy > 0) { P.jy += P.vy * dt; P.vy -= 15 * dt; if (P.jy <= 0) { P.jy = 0; P.vy = 0; } }
  const fovT = running ? 77 : 70; if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov += (fovT - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix(); }
  coachTick();
  camera.position.set(P.x, P.jy + 1.6 + (started ? Math.sin(t * 9) * 0.02 * Math.min(1, Math.hypot(touch.mx, touch.mz) + (keys.KeyW || keys.KeyS || keys.ArrowUp ? 1 : 0)) : 0), P.z);
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
    ui.arrow.style.display = 'block'; ui.arrow.style.transform = `rotate(${-rel}rad)`; ui.dist.textContent = d < 3 ? '도착!' : Math.round(d) + 'm';
    guideTick(t, p, d, rel);
  } else { guideTick(t, null, 0, 0); beacon.visible = false; ui.arrow.style.display = 'none'; ui.dist.textContent = ''; }
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
  coachStart();
  if (!isTouch && !coach.el) setTimeout(() => toast('화면을 한 번 클릭하면 마우스로 둘러볼 수 있어요 (Esc로 해제)', 3500), 3200);
}
// resetWorld가 talk를 지우므로 보너스 대화 복구
const _reset = resetWorld;
resetWorld = function () { _reset(); NPC.bonus.talk = bethTalk; };
// 단계가 넘어갈 때·끝났을 때 축하
const _startStage = startStage;
startStage = function (i) { const up = started && i > S.stage; _startStage(i); if (up) confetti(i >= STAGES.length - 1 ? 90 : 45); };
const _showEnd = showEnd;
showEnd = function () { const was = $('#end').classList.contains('show'); _showEnd(); if (!was) { confetti(110); setTimeout(() => beep('fanfare'), 500); } };
// 시작 화면: 단원마다 얼마나 했는지 보여 주기
(() => {
  try {
    let total = 0, done = 0;
    document.querySelectorAll('.lessonPick a').forEach(a => {
      const m = /^L(\d+)$/.exec(a.textContent.trim()); if (!m) return;
      let s = null; try { s = JSON.parse(localStorage.getItem('english3d_l' + m[1] + '_v1')); } catch (e) {}
      if (!s) return;
      total += s.stars || 0;
      if (s.stage >= 6) { done++; a.classList.add('done'); a.textContent += ' ✓'; a.title = '끝낸 단원 · 별 ' + (s.stars || 0) + '개'; }
      else if (s.stage > 0 || s.stars > 0) { a.classList.add('ing'); a.title = '미션 ' + (s.stage + 1) + '/6 하는 중 · 별 ' + (s.stars || 0) + '개'; const b = document.createElement('i'); b.style.width = Math.max(12, s.stage / 6 * 100) + '%'; a.appendChild(b); }
    });
    const pick = document.querySelector('.lessonPick');
    if (pick && total > 0) {
      const rank = total < 20 ? '🌱 새싹 탐험가' : total < 60 ? '🥾 씩씩한 탐험가' : total < 120 ? '🧭 영어 모험가' : total < 200 ? '🏅 영어 달인' : '🏆 영어 챔피언';
      const d = document.createElement('div'); d.className = 'myRank'; d.innerHTML = `<b>${rank}</b> · 모은 별 ⭐ ${total}개 · 끝낸 단원 ${done}/12`;
      pick.parentElement.insertBefore(d, pick);
    }
    const hp = document.querySelector('#help .panel #helpClose');
    if (hp) { const q = document.createElement('p'); q.innerHTML = '⌨️ <b>Space</b> 점프 · <b>Shift</b> 달리기 · <b>M</b> 효과음 · <b>G</b> 화질 바꾸기. 두 번 틀리면 정답이 살짝 반짝여요.'; hp.parentElement.insertBefore(q, hp); }
  } catch (e) {}
})();
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
