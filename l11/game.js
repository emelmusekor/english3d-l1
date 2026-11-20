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
const SAVE_KEY = 'english3d_l11_v1';
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
  Hajun: [0, 1.15], Kai: [0, 1.1], 'Ms. Park': [1, 1.05], Man: [0, 0.9], Coach: [1, 1.1], Olivia: [1, 1.3], Dad: [0, 0.85], Joel: [0, 1.15],
  Woman: [1, 1.0], Grandpa: [0, 0.75], Erin: [1, 1.35], Jimin: [0, 1.1], 'Old Man': [0, 0.75], Staff: [1, 1.15], Leo: [0, 1.3], Yuna: [1, 1.5],
  'Old Lady': [1, 0.85], Ben: [0, 1.2], Mina: [1, 1.3], Hank: [0, 1.0], Boy: [0, 1.2], Girl: [1, 1.35], Narrator: [1, 1.0], '나': [0, 1.0]
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

// ---------------- 세계 만들기 (Lesson 11 · Happy Town 길 찾기 마을) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x9ccc72)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const flat = (w, d, c, x, z, y = 0.01) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(c)); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; };
// 도로: 가운데 남북 길 + 동서 길 2개 (A: z=10, B: z=-22)
flat(10, 92, 0xd9d4c7, 0, 0, 0.008); flat(92, 10, 0xd9d4c7, 0, 10, 0.009); flat(92, 10, 0xd9d4c7, 0, -22, 0.009); // 보도
flat(8, 92, 0x5c6370, 0, 0, 0.012); flat(92, 8, 0x5c6370, 0, 10, 0.014); flat(92, 8, 0x5c6370, 0, -22, 0.014);
for (let i = -44; i < 44; i += 4) { flat(0.2, 1.8, 0xffffff, 0, i, 0.02); flat(1.8, 0.2, 0xffffff, i, 10, 0.02); flat(1.8, 0.2, 0xffffff, i, -22, 0.02); }
for (const [x, z] of [[0, 14.6], [0, 5.4], [0, -17.4], [0, -26.6]]) for (let k = -3; k <= 3; k++) flat(0.6, 1.4, 0xffffff, x + k * 1.1, z, 0.022); // 횡단보도
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0x1c7ed6, -4, 2, FEN); solid(1, 4, 1, 0x1c7ed6, 4, 2, FEN);
const gateSign = textPlane('Happy Town', 1.1, { fs: 64, bg: '#1c7ed6', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1, blossom = false) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const c = ball(1.4 * s, blossom ? 0xff8cc6 : 0x4caf50, x, 3 * s, z); c.scale.y = 1.1;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
function lamp(x, z) { cyl(0.08, 0.1, 3.4, 0x495057, x, 1.7, z); const b = ball(0.22, 0xfff3bf, x, 3.5, z); b.material = new THREE.MeshBasicMaterial({ color: 0xfff3bf }); }
for (const x of [-40, -32, -24, -16, 16, 24, 32, 40]) { lamp(x, 15.2); lamp(x, -26.8); }

// ---------- 건물 ----------
// 줄: AN(동서길 A 북쪽, 정문이 남쪽 +z), AS(A 남쪽, 정문 북쪽), BS(동서길 B 남쪽, 정문 북쪽), BN(B 북쪽, 정문 남쪽)
const ROW = { AN: [1.5, 1], AS: [18.5, -1], BS: [-14.5, -1], BN: [-29.5, 1] };
const PL = {};
function building(id, name, ko, x, row, color, o = {}) {
  const [cz, f] = ROW[row], w = o.w || 7, d = 7, h = o.h || 5.5, fz = cz + f * d / 2;
  solid(w, h, d, color, x, h / 2, cz);
  box(w + 0.4, 0.4, d + 0.4, o.roof || 0x495057, x, h + 0.2, cz);
  box(1.6, 2.4, 0.1, 0x6b4a2b, x, 1.2, fz + f * 0.05); // 문
  for (const dx of [-2.3, 2.3]) box(1.3, 1.1, 0.08, 0xd0ebff, x + dx, 2.0, fz + f * 0.05);
  for (const dx of [-2.3, 0, 2.3]) box(1.3, 1.0, 0.08, 0xd0ebff, x + dx, h - 1.5, fz + f * 0.05);
  if (name) {
    const s = textPlane(name, 0.85, { fs: 64, bg: o.sign || '#ffffff', fg: o.fg || '#1d3557', border: o.border }); s.position.set(x, h - 0.45, fz + f * 0.12); s.rotation.y = f > 0 ? 0 : Math.PI;
    const b = textPlane(name, 0.6, { fs: 56, bg: o.sign || '#ffffff', fg: o.fg || '#1d3557' }); b.position.set(x, h - 0.9, cz - f * (d / 2 + 0.06)); b.rotation.y = f > 0 ? Math.PI : 0;
  }
  if (id) PL[id] = { id, name, ko, x, cz, f, fz, w, door: [x, fz + f * 1.6], x1: x - w / 2, x2: x + w / 2, z1: cz - d / 2 - 2.2, z2: cz + d / 2 + 2.2 };
  return PL[id];
}
building('climbing', 'Climbing Center 🧗', '클라이밍 센터', -38, 'AN', 0xffa94d, { sign: '#e8590c', fg: '#fff', h: 7 });
building('market', 'Green Market 🛒', '그린 시장', -29, 'AN', 0xb2f2bb, { sign: '#2f9e44', fg: '#fff' });
building('bookstore', 'Bookstore 📚', '책방', -20, 'AN', 0xfff3bf, { sign: '#f08c00', fg: '#fff' });
building('library', 'Library 📖', '도서관', -11, 'AN', 0xd0bfff, { sign: '#7048e8', fg: '#fff', h: 6.5 });
building('restaurant', 'Restaurant 🍝', '식당', 11, 'AN', 0xffc9c9, { sign: '#e03131', fg: '#fff' });
building('airmuseum', 'Airplane Museum ✈️', '비행기 박물관', 20, 'AN', 0xa5d8ff, { sign: '#1971c2', fg: '#fff', h: 7 });
building('flowershop', 'Flower Shop 🌷', '꽃집', 29, 'AN', 0xfcc2d7, { sign: '#d6336c', fg: '#fff' });
building('hospital', 'ABC Hospital 🏥', 'ABC 병원', 38, 'AN', 0xffffff, { sign: '#e03131', fg: '#fff', h: 7.5 });
building('olivia', "Olivia's House 🏠", 'Olivia의 집', -29, 'AS', 0xffe8cc, { sign: '#ffffff', fg: '#e8590c', roof: 0xe8590c });
building('bank', 'Bank 🏦', '은행', 20, 'AS', 0xe9ecef, { sign: '#495057', fg: '#ffd43b', h: 6.5 });
building('artcenter', 'Art Center 🎨', '아트 센터', -20, 'BS', 0xe5dbff, { sign: '#9c36b5', fg: '#fff', h: 7 });
building('museum', 'Museum 🏛️', '박물관', 11, 'BS', 0xf1f3f5, { sign: '#5c3d2e', fg: '#fff', h: 7 });
building('icecream', 'Ice Cream Shop 🍦', '아이스크림 가게', 11, 'BN', 0xfff0f6, { sign: '#f783ac', fg: '#fff' });
building('zoo', 'Zoo 🦁', '동물원', 20, 'BN', 0xd8f5a2, { sign: '#5c940d', fg: '#fff' });
building('school', 'School 🏫', '학교', 29, 'BN', 0xffd8a8, { sign: '#1864ab', fg: '#fff', h: 7 });
// 이름 없는 아파트 (뒤·앞 위치를 알아보기 쉽게)
for (const [x, row] of [[-38, 'BS'], [-29, 'BS'], [-11, 'BS'], [20, 'BS'], [29, 'BS'], [38, 'BS'], [38, 'BN']]) building(null, '', '', x, row, 0xced4da, { h: 8 });
// 장식: 클라이밍 벽, 비행기, 동물원 기린
{ const p = PL.climbing; for (let i = 0; i < 18; i++) ball(0.16, [0xff6b6b, 0x4dabf7, 0xffd43b, 0x51cf66][i % 4], p.x - 3 + (i % 6) * 1.2 + (i % 2) * 0.3, 2.8 + Math.floor(i / 6) * 1.1, p.fz + 0.12); }
(function plane() { const g = new THREE.Group(); const b = cyl(0.5, 0.35, 5, 0xf8f9fa, 0, 0, 0, g); b.rotation.x = Math.PI / 2; box(6, 0.12, 1.1, 0x1971c2, 0, 0, 0.2, g); box(2.2, 0.1, 0.6, 0x1971c2, 0, 0, -2.2, g); box(0.1, 1, 0.7, 0xe03131, 0, 0.5, -2.2, g); g.position.set(20, 8.3, 1.5); g.rotation.y = 0.5; scene.add(g); })();
(function giraffe() { const g = new THREE.Group(); box(1.2, 0.9, 0.5, 0xfab005, 0, 1.4, 0, g); const n = box(0.3, 1.6, 0.3, 0xfab005, 0.5, 2.5, 0, g); n.rotation.z = -0.2; box(0.6, 0.35, 0.3, 0xfab005, 0.75, 3.3, 0, g); for (const [x, z] of [[-0.45, -0.15], [0.45, -0.15], [-0.45, 0.15], [0.45, 0.15]]) box(0.15, 1.1, 0.15, 0xe67700, x, 0.55, z, g); g.position.set(PL.zoo.x + 2.6, 0, PL.zoo.fz + 1.2); g.rotation.y = 0.4; scene.add(g); block(PL.zoo.x + 1.8, PL.zoo.fz + 0.8, PL.zoo.x + 3.4, PL.zoo.fz + 1.6); })();
// 은행 뒤 분홍 나무 (The pink tree is behind the bank.)
tree(20, 25.2, 1.1, true);
{ const s = textPlane('The pink tree is behind the bank.', 0.38, { fs: 44, bg: '#ffffff', fg: '#d6336c' }); s.position.set(20, 1.3, 26.8); s.rotation.y = Math.PI; }

// ---------- 북서: Happy Park ----------
flat(38, 18, 0x8ce99a, -25, -36, 0.006);
for (const [x, z] of [[-40, -40], [-34, -42], [-28, -40], [-20, -42], [-12, -40], [-9, -33], [-40, -31], [-16, -34]]) tree(x, z, 1, (x + z) % 3 === 0);
{ const pond = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), mat(0x74c0fc)); pond.rotation.x = -Math.PI / 2; pond.position.set(-28, 0.03, -34); scene.add(pond); block(-30.5, -36.5, -25.5, -31.5); }
solid(0.5, 3.6, 0.5, 0x2f9e44, -27, 1.8, -27.5); solid(0.5, 3.6, 0.5, 0x2f9e44, -21, 1.8, -27.5);
{ const s = textPlane('Happy Park 🌳', 0.9, { fs: 64, bg: '#2f9e44', fg: '#fff' }); s.position.set(-24, 3.8, -27.4); }
PL.park = { id: 'park', name: 'Happy Park', ko: '해피 공원', x: -24, cz: -36, f: 1, fz: -27.5, door: [-24, -28.5], x1: -44, x2: -6, z1: -44, z2: -27 };
for (const x of [-40, -16, 16, 40]) tree(x, -43.5);

// ---------- 남쪽 가운데: Happy Station (출발 정류장) ----------
const HUB = { x: -7, z: 32 };
for (const dz of [-3.2, 3.2]) solid(0.2, 3, 0.2, 0x1c7ed6, HUB.x - 1.8, 1.5, HUB.z + dz);
box(4.4, 0.2, 7.4, 0x1c7ed6, HUB.x, 3.1, HUB.z); solid(0.2, 2.6, 7, 0x74c0fc, HUB.x - 2, 1.4, HUB.z);
{ const s = textPlane('Happy Station 🚌🚇', 0.7, { fs: 60, bg: '#1c7ed6', fg: '#fff' }); s.position.set(HUB.x + 2.25, 3.65, HUB.z); s.rotation.y = Math.PI / 2; }
// 안내 데스크
const INFO = { x: 6.5, z: 32 };
box(1, 1.1, 3, 0x20c997, INFO.x, 0.55, INFO.z); block(INFO.x - 0.5, INFO.z - 1.5, INFO.x + 0.5, INFO.z + 1.5);
{ const s = textPlane('Info ℹ️', 0.6, { fs: 56, bg: '#0ca678', fg: '#fff' }); s.position.set(INFO.x - 0.55, 2.8, INFO.z); s.rotation.y = -Math.PI / 2; cyl(0.06, 0.06, 2.6, 0x666666, INFO.x, 1.3, INFO.z + 1.6); }
// 마을 지도판
(function townBoard() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#9ccc72'; x.fillRect(0, 0, 512, 512); const s = 512 / 96, T = (v) => 256 + v * s;
  x.fillStyle = '#5c6370'; x.fillRect(T(-4), 0, 8 * s, 512); x.fillRect(0, T(6), 512, 8 * s); x.fillRect(0, T(-26), 512, 8 * s);
  x.font = 'bold 11px sans-serif'; x.textAlign = 'center';
  for (const p of Object.values(PL)) { if (p.id === 'park') { x.fillStyle = '#2f9e44'; x.fillRect(T(-44), T(-44), 38 * s, 17 * s); } else { x.fillStyle = '#ffffff'; x.fillRect(T(p.x1), T(p.cz - 3.5), 7 * s, 7 * s); } x.fillStyle = '#1d3557'; x.fillText(p.name.replace(/[^ -~]/g, '').trim(), T(p.x), T(p.cz) + 5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: t })); m.position.set(5, 2.6, 38); m.rotation.y = -Math.PI / 2 + 0.6; scene.add(m);
  cyl(0.08, 0.08, 2.5, 0x666666, 5, 1.25, 38);
  const h = textPlane('Town Map 🗺', 0.45, { fs: 48, bg: '#ffffff', fg: '#1d3557' }); h.position.set(5, 4.9, 38); h.rotation.y = -Math.PI / 2 + 0.6;
})();

// ---------- 정류장 (버스·지하철) ----------
const STOP = {};
function stop(id, label, x, z, sx, sz) {
  flat(4, 2.4, 0xffd43b, x, z, 0.03);
  cyl(0.07, 0.07, 1.9, 0x343a40, x + 2.2, 0.95, z);
  const s = textSprite(`🚏 ${label}\n🚌 Bus · 🚇 Subway`, 0.62, { fs: 44, bg: '#ffffff', fg: '#1d3557', border: '#fab005' }); s.position.set(x + 2.2, 2.2, z); scene.add(s);
  zone('stop', id, x - 2, z - 1.2, x + 2, z + 1.2);
  STOP[id] = { id, label, pad: [x, z], spawn: [sx, sz] };
}
stop('station', 'Happy Station', HUB.x, HUB.z, -2.5, HUB.z);
stop('market', 'Green Market', -29, 8.4, -24.5, 8.4);
stop('library', 'Library', -11, 8.4, -6.2, 8.4);
stop('hospital', 'ABC Hospital', 38, 8.4, 33.5, 8.4);
stop('bank', 'Bank', 20, 11.6, 24.5, 11.6);
stop('park', 'Happy Park', -24, -23.6, -19.5, -22.6);
stop('school', 'School', 29, -23.6, 33.5, -22.6);

// ---------- 남서: 공항 (How Can I Get There?) ----------
const AIR = { x: -27, z: 35 };
flat(33, 19, 0xe9ecef, -28, 35, 0.015);
solid(33, 3.5, 0.3, 0xa5d8ff, -28, 1.75, 25.4);
{ const s = textPlane('Airport ✈️ How Can I Get There?', 0.95, { fs: 62, bg: '#1864ab', fg: '#fff' }); s.position.set(-28, 5.6, 25.6); for (const dx of [-8, 8]) cyl(0.1, 0.1, 5.4, 0x666666, -28 + dx, 2.7, 25.6); }
{ const s = textPlane('Airport ✈️', 0.9, { fs: 62, bg: '#1864ab', fg: '#fff' }); s.position.set(-11.3, 3, 25.6); s.rotation.y = Math.PI / 2; cyl(0.08, 0.08, 3, 0x666666, -11.3, 1.5, 26.4); }
const STALL = {};
function stall(id, name, ko, x, z, face, color) { // face: 'E'(+x) 또는 'S'(+z)
  const g = new THREE.Group();
  box(5, 2.6, 3, color, 0, 1.3, 0, g); box(5.2, 0.35, 3.4, 0xffffff, 0, 2.8, 0.2, g); box(4.6, 1, 0.5, 0xffffff, 0, 0.5, 1.7, g);
  const s = textPlane(name, 0.55, { fs: 56, bg: '#ffffff', fg: '#1d3557', border: '#' + color.toString(16).padStart(6, '0') }, g); s.position.set(0, 3.4, 1.55);
  g.position.set(x, 0, z); g.rotation.y = face === 'E' ? Math.PI / 2 : 0; scene.add(g);
  if (face === 'E') { block(x - 1.5, z - 2.5, x + 2, z + 2.5); STALL[id] = { id, name, ko, x, z, door: [x + 3.4, z], x1: x + 1.5, x2: x + 5, z1: z - 2.2, z2: z + 2.2 }; }
  else { block(x - 2.5, z - 1.5, x + 2.5, z + 2); STALL[id] = { id, name, ko, x, z, door: [x, z + 3.4], x1: x - 2.2, x2: x + 2.2, z1: z + 1.5, z2: z + 5 }; }
}
stall('book', 'Bookstore 📚', '서점', -42.5, 30, 'E', 0xffd43b);
stall('rest1', 'Restaurant 🍲', '한국 식당', -42.5, 35.5, 'E', 0xff8787);
stall('toy', 'Toy Shop 🧸', '장난감 가게', -42.5, 41, 'E', 0x74c0fc);
stall('rest2', 'Restaurant 🍲', '한국 식당', -34, 27.2, 'S', 0xff8787);
stall('ice', 'Ice Cream 🍦', '아이스크림 가게', -24, 27.2, 'S', 0xfcc2d7);
function desk(id, x, z) {
  box(3, 1.1, 0.9, 0x339af0, x, 0.55, z); block(x - 1.5, z - 0.45, x + 1.5, z + 0.45);
  const s = textPlane('Help Desk ❓', 0.45, { fs: 52, bg: '#1971c2', fg: '#fff' }); s.position.set(x, 2.4, z + 0.5); cyl(0.05, 0.05, 1.3, 0x666666, x - 1.6, 1.6, z);
  STALL[id] = { id, name: 'Help Desk', ko: '안내 데스크', x, z, door: [x, z + 1.6], x1: x - 2, x2: x + 2, z1: z + 0.4, z2: z + 3 };
}
desk('help1', -24, 32);
desk('help2', -18, 41.5);
// 서울 한옥 스테이 포스터
{ const s = textPlane('Seoul Hanok Stay 🏯\nBus Number 5 → Park', 0.9, { fs: 46, bg: '#fff9db', fg: '#5c3d2e', border: '#c92a2a' }); s.position.set(-16, 2.2, 25.6); }
for (const [x, z] of [[-30, 33], [-30, 38]]) { box(2.6, 0.45, 0.6, 0x868e96, x, 0.45, z); block(x - 1.3, z - 0.3, x + 1.3, z + 0.3); }

// ---------- 남동: Let's Write 안내 글 책상 ----------
const WRITE = { x: 31, z: 35 };
box(16, 0.3, 12, 0xd3f9d8, WRITE.x, 0.15, WRITE.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.5, 5, 0.5, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz);
box(17, 0.4, 13, 0x2f9e44, WRITE.x, 5.2, WRITE.z);
{ const s = textPlane("Let's Write · Town Guide Desk", 0.8, { fs: 62, bg: '#2f9e44', fg: '#fff' }); s.position.set(WRITE.x - 8.6, 4.4, WRITE.z); s.rotation.y = -Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x + 1, 0.75, WRITE.z);
solid(0.4, 3.4, 10, 0xf8f9fa, WRITE.x + 7.6, 2, WRITE.z);
{ const s = textPlane('Come to Green Market! 🛒\n🚇 Subway Line 4 → museum\n📍 in front of the park', 1.9, { fs: 46, bg: '#ffffff', fg: '#2b8a3e', border: '#2f9e44' }); s.position.set(WRITE.x + 7.35, 2.3, WRITE.z); s.rotation.y = -Math.PI / 2; }

// ---------- 다니는 버스 (장식) ----------
function busModel(num, color) {
  const g = new THREE.Group();
  box(2.4, 2.4, 7, color, 0, 1.6, 0, g); box(2.42, 0.8, 6.2, 0xd0ebff, 0, 2.1, 0.2, g);
  for (const [x, z] of [[-1.2, -2.4], [1.2, -2.4], [-1.2, 2.4], [1.2, 2.4]]) { const w = cyl(0.45, 0.45, 0.3, 0x222222, x, 0.45, z, g); w.rotation.z = Math.PI / 2; }
  for (const r of [0, Math.PI]) { const t = textPlane('BUS ' + num, 0.55, { fs: 56, bg: '#ffffff', fg: '#1d3557' }, g); t.position.set(0, 2.9, r ? -3.52 : 3.52); t.rotation.y = r; }
  return g;
}
const buses = [{ g: busModel(5, 0x40c057), z: 12, dir: 1, off: 0 }, { g: busModel(10, 0x339af0), z: -20, dir: -1, off: 40 }, { g: busModel(7, 0xfab005), z: 8, dir: -1, off: 70 }];
buses.forEach(b => { b.g.rotation.y = b.dir > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(b.g); });

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'sticker') { const t = textPlane('🏷️', 0.6, { fs: 80, bg: '#ffffff', border: '#fab005' }, g); t.position.y = 0.3; }
  else if (id === 'ticket') { box(0.5, 0.02, 0.28, 0x74c0fc, 0, 0.1, 0, g); }
  return g;
}
let decor = [];
function addDecor(o) { scene.add(o); decor.push(o); return o; }
function clearDecor() { decor.forEach(o => scene.remove(o)); decor = []; }
// 물음표 스티커 자리 (Play Together 1)
function hideSign(id) {
  const p = PL[id];
  const a = textPlane('❓ ? ? ?', 0.95, { fs: 64, bg: '#868e96', fg: '#fff', minW: 700 }); a.position.set(p.x, 5.5 - 0.45, p.fz + p.f * 0.2); a.rotation.y = p.f > 0 ? 0 : Math.PI; addDecor(a);
  const b = textPlane('❓ ? ? ?', 0.7, { fs: 64, bg: '#868e96', fg: '#fff', minW: 700 }); b.position.set(p.x, 5.5 - 0.9, p.cz - p.f * (3.5 + 0.14)); b.rotation.y = p.f > 0 ? Math.PI : 0; addDecor(b);
  return [a, b];
}

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
function puff(x, y, z, text) {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#1c7ed6', border: '#1c7ed6' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 2; scene.add(s); fallers.push(s);
}
// 목표 건물 도착 확인 (건물 앞뒤 2m 안에 들어오면 도착)
const inRect = (r) => P.x > r.x1 && P.x < r.x2 && P.z > r.z1 && P.z < r.z2;
let rectNow = null;
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  for (const f of fallers) { f.userData.life -= dt; f.position.y += dt * 0.6; f.material.opacity = Math.max(0, Math.min(1, f.userData.life)); }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { scene.remove(f); return false; } return true; });
  for (const b of buses) { const x = ((t * 7 + b.off) % 100) - 50; b.g.position.set(b.dir * x, 0, b.z); }
  if (typeof goalTick === 'function') goalTick();
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#1d3557'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 92, '#5c6370'); R(0, 10, 92, 8, '#5c6370'); R(0, -22, 92, 8, '#5c6370');
  R(-25, -36, 38, 17, '#8ce99a', '해피 공원');
  for (const p of Object.values(PL)) if (p.id !== 'park') R(p.x, p.cz, 7, 7, '#ffffff', p.ko.replace('아이스크림 가게', '아이스크림').replace('비행기 박물관', '비행기박물관').replace('Olivia의 집', 'Olivia 집'));
  R(-28, 35, 33, 19, '#dee2e6', '공항'); R(WRITE.x, WRITE.z, 16, 12, '#b2f2bb', '글쓰기');
  for (const st of Object.values(STOP)) { mctx.fillStyle = '#fab005'; mctx.beginPath(); mctx.arc(tx(st.pad[0]), tz(st.pad[1]), 4, 0, 7); mctx.fill(); }
  mctx.fillStyle = '#1c7ed6'; mctx.fillText('🚏정류장', tx(HUB.x), tz(HUB.z) - 8);
}
window.__l11 = { PL, STOP, STALL };

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
function addNPC(id, o, x, z, face = 0) {
  const g = makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '' };
  return NPC[id];
}
const FE = Math.PI / 2, FW = -Math.PI / 2, FN = Math.PI, FS = 0; // 바라보는 방향 (+x, -x, -z, +z)
// 집 위치 [x, z, 방향]
const HOME = {
  hajun: [-3.6, 35.6, FS], kai: [-1.9, 35.2, FS],
  guide: [5.2, 32, FW],
  passer: [-26.6, 6.2, FS], coach: [-35.6, 6.4, FS],
  olivia: [-30.6, 12.6, FS], dad: [-27.6, 12.6, FS], joel: [-25.4, 12.2, FW],
  passer2: [35.4, 6.3, FS], grandpa: [17.6, 6.4, FS], erin: [23.2, 6.6, FS],
  oldman: [-18, 39.7, FS], staff1: [-18, 42.6, FN], staff2: [-24, 30.9, FS],
  leo: [-26.8, 35.8, FW], dad2: [-25.6, 37.4, FW], yuna: [-28, 37.6, FE],
  oldlady: [-14.6, 29.8, FW], ben: [-13.4, 31.4, FW],
  mina: [29.6, 35, FW],
  bonus: [16.6, 26.8, FS]
};
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ['I went to a climbing center last weekend.', '나 지난 주말에 클라이밍 센터에 갔었어.'] }, ...HOME.hajun);
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ['I like climbing.', '나는 클라이밍을 좋아해.'] }, ...HOME.kai);
addNPC('guide', { name: 'Ms. Park', girl: true, shirt: 0x0ca678, skirt: 0x087f5b, hair: 0x222222, scale: 1.1, idle: ['How can I help you?', '무엇을 도와줄까요?'] }, ...HOME.guide);
addNPC('passer', { name: 'Man', shirt: 0x868e96, hair: 0x3b2a1a, scale: 1.1, idle: ["How can I get to the children's library?", '어린이 도서관에 어떻게 가나요?'] }, ...HOME.passer);
addNPC('coach', { name: 'Coach', girl: true, shirt: 0xe8590c, hair: 0x6d4c41, scale: 1.1, idle: ['Are you ready?', '준비됐니?'] }, ...HOME.coach);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ["I'm going to visit the airplane museum.", '나는 비행기 박물관에 갈 거야.'] }, ...HOME.olivia);
addNPC('dad', { name: 'Dad', shirt: 0x5c7cfa, hair: 0x6d4c41, scale: 1.15, idle: ['That sounds fun.', '재미있겠구나.'] }, ...HOME.dad);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ['We should get off here.', '여기서 내려야 해.'] }, ...HOME.joel);
addNPC('passer2', { name: 'Woman', girl: true, shirt: 0xae3ec9, hair: 0x222222, scale: 1.1, idle: ["It's between the restaurant and the flower shop.", '그건 식당과 꽃집 사이에 있어요.'] }, ...HOME.passer2);
addNPC('grandpa', { name: 'Grandpa', shirt: 0x1864ab, pants: 0x1d3557, hair: 0xdee2e6, scale: 1.1, idle: ['Come and sit here.', '와서 여기 앉아 보렴.'] }, ...HOME.grandpa);
addNPC('erin', { name: 'Erin', girl: true, shirt: 0xf06595, hair: 0xd4a017, idle: ["I'll play the violin.", '나는 바이올린을 연주할 거야.'] }, ...HOME.erin);
addNPC('oldman', { name: 'Old Man', shirt: 0x5c940d, hair: 0xdee2e6, scale: 1.1, idle: ['How can I get to Seoul Hanok Stay?', '서울 한옥 스테이에 어떻게 가나요?'] }, ...HOME.oldman);
addNPC('staff1', { name: 'Staff', girl: true, shirt: 0x1971c2, skirt: 0x1864ab, hair: 0x222222, idle: ['Take Bus Number 5 and get off at the park.', '5번 버스를 타고 공원에서 내리세요.'] }, ...HOME.staff1);
addNPC('staff2', { name: 'Staff', girl: true, shirt: 0x1971c2, skirt: 0x1864ab, hair: 0x3b2a1a, idle: ['How can I help you?', '무엇을 도와드릴까요?'] }, ...HOME.staff2);
addNPC('leo', { name: 'Leo', shirt: 0xfab005, hair: 0x111111, scale: 0.85, idle: ['Where is a Korean restaurant?', '한국 식당이 어디에 있어요?'] }, ...HOME.leo);
addNPC('dad2', { name: 'Dad', shirt: 0x495057, hair: 0x111111, scale: 1.15, idle: ['There are many Korean restaurants.', '한국 식당이 많이 있네.'] }, ...HOME.dad2);
addNPC('yuna', { name: 'Yuna', girl: true, shirt: 0xf783ac, hair: 0x111111, scale: 0.85, idle: ["It's between the bookstore and the toy shop.", '서점과 장난감 가게 사이에 있어요.'] }, ...HOME.yuna);
addNPC('oldlady', { name: 'Old Lady', girl: true, shirt: 0x9775fa, skirt: 0x7048e8, hair: 0xe9ecef, scale: 1.05, idle: ["I can't find my ticket.", '제 표를 찾을 수가 없어요.'] }, ...HOME.oldlady);
addNPC('ben', { name: 'Ben', shirt: 0x20c997, hair: 0xa0522d, scale: 0.9, idle: ["It's in front of the ice cream shop.", '그건 아이스크림 가게 앞에 있어요.'] }, ...HOME.ben);
addNPC('mina', { name: 'Mina', girl: true, shirt: 0x2f9e44, hair: 0x111111, idle: ['Come to Green Market.', '그린 시장에 오세요.'] }, ...HOME.mina);
addNPC('bonus', { name: 'Hank', shirt: 0xf783ac, hair: 0xc0392b, idle: ['The pink tree is behind the bank.', '분홍 나무는 은행 뒤에 있어.'] }, ...HOME.bonus);
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
const zoneHandlers = {};
let stageState = {};
const QV = (dest) => `How can I get to the ${dest}?`;
const STOP_WORD = { market: 'the market', library: 'the library', hospital: 'the hospital', bank: 'the bank', park: 'the park', school: 'the school' };
const STOP_PL = { market: 'market', library: 'library', hospital: 'hospital', bank: 'bank', park: 'park', school: 'school' };

const STAGES = [
  { title: '1. 클라이밍 센터 가는 길', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 길 안내 듣고 지도 완성', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. 비행기 박물관 찾기', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 공항에서 길 찾기', book: 'Before/After You Read', start: stage5 },
  { title: '6. 우리 마을 안내 글', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  zoneHandlers.stop = onStop;
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
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
async function readLines(arr) { for (const [who, en, ko] of arr) await say(who, en, ko); }
function flash() { const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:50;opacity:1;transition:opacity .6s;pointer-events:none'; document.body.appendChild(f); setTimeout(() => f.style.opacity = 0, 60); setTimeout(() => f.remove(), 700); }
// 대화 실행 (말 걸기와 같은 방식: 끝나면 busy 풀고 남은 대화창 닫기)
function run(fn) {
  busy = true;
  (async () => {
    try { await fn(); }
    catch (e) { console.error(e); }
    finally { busy = false; if (dlgOpen && !dlgNextFn && !dlgChoiceKeys && !$('#writer').classList.contains('show') && !$('#end').classList.contains('show')) closeDlg(); }
  })();
}
// 점수 없는 고르기 창 (마지막 보기 = 취소)
function menu(title, ko, opts, cancel) {
  return new Promise(res => {
    openDlg(); setLine('', title, ko, { speak: false, koAlways: true }); ui.next.style.display = 'none'; ui.spk.style.display = 'none'; lastSpeech = null;
    const all = opts.concat([cancel]);
    const btns = all.map((c, i) => {
      const b = document.createElement('button'); b.className = 'choice'; if (i === all.length - 1) b.dataset.r = 1;
      b.innerHTML = `<span class="num">${i + 1}</span>${c}`;
      b.onclick = () => { dlgChoiceKeys = null; res(i === all.length - 1 ? -1 : i); };
      ui.ch.appendChild(b); return b;
    });
    dlgChoiceKeys = btns;
  });
}

// ---------- 버스·지하철 타기 ----------
function nearestStop() { let best = null, bd = 1e9; for (const s of Object.values(STOP)) { const d = dist(s.pad); if (d < bd) { bd = d; best = s.pad; } } return best; }
function setRide(r) {
  stageState.ride = r;
  const icon = r.line.startsWith('Bus') ? '🚌' : '🚇';
  setObj(r.obj || `🚏 가까운 <b>정류장</b>(노란 바닥)으로 가서 들은 대로 ${icon} 타요`, nearestStop);
}
const followers = () => Object.values(NPC).filter(n => n.follow);
function rideTo(id, icon) {
  const s = STOP[id]; flash(); beep('get');
  P.x = s.spawn[0]; P.z = s.spawn[1];
  const pl = PL[STOP_PL[id]]; if (pl) P.yaw = Math.atan2(-(pl.x - P.x), -(pl.door[1] - P.z));
  followers().forEach((n, i) => { n.g.position.set(P.x + 1.2 + i * 0.9, 0, P.z + 1.6); });
  toast(`${icon} <b>${s.label}</b>에서 내렸어요!`, 2600);
}
function onStop(id) {
  if (busy || dlgOpen) return;
  const r = stageState.ride;
  run(async () => {
    if (!r) {
      const opts = Object.values(STOP).filter(s => s.id !== id);
      const pick = await menu(`🚏 ${STOP[id].label}`, '버스·지하철을 타고 어디로 갈까요?', opts.map(s => s.label), '그냥 지나갈게요');
      closeDlg(); if (pick >= 0) rideTo(opts[pick].id, '🚌');
      return;
    }
    const icon = r.line.startsWith('Bus') ? '🚌' : '🚇';
    await ask('', r.say, '🚏 무엇을 탈까요? 들은 길 안내를 떠올려요. (🔊 다시 듣기 · 👀 글 보기)', [r.line, ...shuffle(L.lines.filter(l => l !== r.line)).slice(0, 3)], { listen: true, sayIt: true, me: true });
    if (r.onBoard) await r.onBoard();
    const others = shuffle(Object.keys(STOP_WORD).filter(k => k !== r.stop)).slice(0, 3).map(k => STOP_WORD[k]);
    await ask('', r.say, `${icon} ${r.line} · 어디에서 내릴까요?`, [r.stopLabel, ...others], { listen: true, sayIt: true, me: true });
    stageState.ride = null; closeDlg();
    rideTo(r.stop, icon);
    if (r.then) await r.then();
  });
}
// ---------- 목적지 도착 확인 ----------
function goTo(id, text, pos, onArrive) { stageState.goal = { id, rect: PL[id] || STALL[id], onArrive }; setObj(text, pos); }
function goalTick() {
  if (!started) return;
  const g = stageState.goal;
  let cur = null;
  for (const r of Object.values(STALL)) if (inRect(r)) cur = r;
  if (!cur) for (const r of Object.values(PL)) if (inRect(r)) { cur = r; break; }
  if (cur !== rectNow) {
    rectNow = cur;
    if (cur && g && cur.id !== g.id && !dlgOpen) toast(`여기는 <b>${cur.name}</b> (${cur.ko})예요. 길 안내를 다시 생각해 보세요. 🤔`, 2600);
  }
  if (g && !dlgOpen && !busy && inRect(g.rect)) { stageState.goal = null; beep('star'); run(g.onArrive); }
}
const refPos = (id) => () => { const p = PL[id] || STALL[id]; return [p.x, p.cz !== undefined ? p.cz : p.z]; };

// ---- 1. Fun Talk 1 ----
function stage1() {
  const F = L.funTalk1;
  setObj('🚏 <b>Happy Station</b> 옆의 <b>하준</b>이와 <b>Kai</b>에게 가요', npcAt('hajun')); mark('hajun');
  NPC.hajun.talk = async () => {
    mark('hajun', false); NPC.hajun.talk = null;
    await readLines(F.scene1);
    await ask('나', 'Kai가 되어 대답하고, 클라이밍 센터에 가는 방법을 물어보세요.', '알맞은 말을 고르세요.', [F.question, 'Sure. What are you going to do tomorrow?', "Sure. What's wrong?", 'Sure. What do you think?'], { me: true, hint: 'How can I get to ~? = ~에 어떻게 갈 수 있니?' });
    await say('Hajun', F.answer, '잘 듣고 기억해요! (🔊 다시 듣기)', { listen: true, koAlways: true });
    await ask('', 'How can Kai get to the climbing center?', 'Kai는 클라이밍 센터에 어떻게 가나요?', ['Take Bus Number 5 and get off at Green Market.', 'Take Bus Number 3 and get off at Green Market.', 'Take Subway Line 5 and get off at Happy Park.', 'Take Bus Number 5 and get off at the school.'], { hint: '🔊 하준이의 말을 다시 들어 보세요.' });
    await say('Kai', 'Okay. See you there.', '좋아. 거기서 봐.');
    await say('', '', '🌅 다음 날! Kai와 함께 버스를 타러 가요. 바로 옆 Happy Station(노란 바닥)에 올라서 보세요.', { btn: '출발!' });
    closeDlg();
    placeNPC('hajun', PL.climbing.x - 1.6, PL.climbing.door[1], 0);
    NPC.kai.follow = true;
    setRide({ line: F.line, stop: F.stop, stopLabel: F.stopLabel, say: F.answer, then: s1arrive });
  };
}
async function s1arrive() {
  const F = L.funTalk1;
  setObj('🙋 정류장 옆의 <b>아저씨(Man)</b>가 길을 물어요', npcAt('passer')); mark('passer');
  NPC.passer.talk = async () => {
    mark('passer', false); NPC.passer.talk = null;
    await say('Man', F.passerQ, '실례합니다. 어린이 도서관에 어떻게 갈 수 있나요?');
    await say('Kai', 'Wait a second.', '잠깐만요. (📱 지도 앱을 켜서 찾아봐요)');
    await ask('나', 'Kai가 되어 길을 알려 주세요.  📱 지도 앱: 🚇 Subway Line 3 → Happy Park', '알맞은 길 안내를 고르세요.', [F.passerA, 'Take Bus Number 3 and get off at Happy Park.', 'Take Subway Line 3 and get off at the school.', 'Take Subway Line 5 and get off at Green Market.'], { me: true, hint: '🚇 = subway, 3호선 = Line 3' });
    await say('Man', 'Thank you.', '고마워요.');
    closeDlg();
    goTo('climbing', '🧗 <b>Green Market 바로 옆</b>의 <b>Climbing Center</b>로 가요', () => PL.climbing.door, s1climb);
  };
}
async function s1climb() {
  NPC.kai.follow = false; placeNPC('kai', PL.climbing.x + 0.2, PL.climbing.door[1] - 0.2, 0);
  await say('Hajun', 'Kai! You came!', 'Kai! 왔구나!');
  await say('Coach', 'Are you ready?', '준비됐니?');
  await ask('나', '하준이와 Kai가 되어 대답해요. 🧗', '알맞은 대답을 고르세요.', ['Yes!', 'Take Bus Number 5.', "It's behind the bank.", 'Help me, please.'], { me: true });
  puff(PL.climbing.x - 1, 4.2, PL.climbing.fz + 0.6, 'Help me, please! 😱');
  await say('Kai', 'Help me, please.', '(두 칸 올라가고 더는 못 올라가요) 좀 도와주세요.');
  await say('Coach', "It's okay. I'll help you.", '괜찮아. 내가 도와줄게. (코치가 Kai를 안전하게 내려 줬어요)');
  good();
  await say('', '', '🧗 Fun Talk 1 완료! How can I get to ~? 로 길을 묻고, Take ~ and get off at ~. 로 길을 알려 줬어요.', { btn: '다음 미션 ▶' });
  nextStage();
}

// ---- 2. Listen and Do + Play Together 1 ----
const SWD = (s) => `${L.stopWords[s][1]} ${L.stopWords[s][0]}`;
const KIND = (k) => k === 'bus' ? '🚌 bus' : '🚇 subway';
function stage2() {
  stageState.hidden = {};
  for (const m of L.mapGame) stageState.hidden[m.place] = hideSign(m.place);
  setObj('ℹ️ <b>Happy Station</b> 안내 데스크의 <b>Ms. Park</b>에게 가요', npcAt('guide')); mark('guide');
  NPC.guide.talk = async () => {
    mark('guide', false); NPC.guide.talk = null;
    await say('Ms. Park', "Welcome to Happy Town! Let's listen to some directions.", 'Happy Town에 온 걸 환영해요! 길 안내를 들어 봐요.');
    await say('', '', '🎧 Listen and Do · 대화를 잘 듣고, 알맞은 교통수단과 내리는 곳을 골라요.', { btn: '시작!' });
    const stops = Object.keys(L.stopWords);
    for (const d of L.listenDo) {
      await say(d.q[0], d.q[1], '어디에 가고 싶은지 들어요.');
      const other = d.kind === 'bus' ? 'subway' : 'bus';
      const [s1, s2] = shuffle(stops.filter(s => s !== d.stop));
      await ask(d.a[0], d.a[1], '🔊 잘 듣고 교통수단과 내리는 곳을 고르세요. (다시 듣기 가능)', [`${KIND(d.kind)} · ${SWD(d.stop)}`, `${KIND(other)} · ${SWD(d.stop)}`, `${KIND(d.kind)} · ${SWD(s1)}`, `${KIND(other)} · ${SWD(s2)}`], { listen: true, speakQ: true, sayIt: false, hint: '🔊 다시 듣기를 눌러 보세요.' });
    }
    await say('Ms. Park', "Great listening! Now, let's complete the town map.", '잘 들었어요! 이제 마을 지도를 완성해 봐요.');
    await say('', '', '🗺 Play Together 1 · 지도 완성하기: 마을에 이름표가 없는 ❓ 건물 3곳이 있어요. 길 안내를 듣고 버스·지하철을 타고 가서 스티커를 붙여 주세요!', { btn: '좋아요!' });
    stageState.mi = 0; await mapRound();
  };
}
async function mapRound() {
  const m = L.mapGame[stageState.mi];
  const other = L.mapGame.find(x => x !== m).name;
  setHeld('sticker', `🏷️ ${m.name} 스티커`);
  await ask('나', `🏷️ '${m.name}' 스티커를 받았어요. Ms. Park에게 가는 방법을 물어보세요.`, `${stageState.mi ? '📱 전화로 ' : ''}알맞은 질문을 고르세요.`, [QV(m.name), QV(other), 'What are you going to do tomorrow?', "What's wrong?"], { me: true });
  const dir = `Take ${m.line} and get off at ${m.stopLabel}.`;
  await say('Ms. Park', dir, '잘 듣고 기억해요! (🔊 다시 듣기)', { listen: true, koAlways: true });
  closeDlg();
  setRide({ line: m.line, stop: m.stop, stopLabel: m.stopLabel, say: dir, then: async () => {
    goTo(m.place, `🏷️ 정류장 바로 옆 <b>❓ 건물</b>에 <b>${m.name}</b> 스티커를 붙여요`, null, async () => {
      stageState.hidden[m.place].forEach(o => o.visible = false); held = null; refreshHUD(); good();
      toast(`🏷️ <b>${PL[m.place].name}</b> 스티커를 붙였어요! (${stageState.mi + 1}/${L.mapGame.length})`, 2600);
      await say('나', `This is the ${m.name}!`, `여기가 ${PL[m.place].ko}이에요!`);
      stageState.mi++;
      if (stageState.mi < L.mapGame.length) await mapRound();
      else { await say('Ms. Park', 'You completed the town map. Great job!', '📱 마을 지도를 완성했어요. 정말 잘했어요!'); nextStage(); }
    });
  } });
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  const F = L.funTalk2;
  setObj("🏠 <b>Olivia's House</b>(Green Market 맞은편)의 <b>Olivia</b>에게 가요", npcAt('olivia')); mark('olivia');
  NPC.olivia.talk = async () => {
    mark('olivia', false); NPC.olivia.talk = null;
    await readLines(F.home);
    await ask('나', 'Olivia가 되어 아빠에게 비행기 박물관에 가는 방법을 물어보세요.', '알맞은 질문을 고르세요.', [F.question, QV('flower shop'), 'What are you going to do tomorrow?', "What's wrong?"], { me: true });
    await say('Dad', F.answer, '잘 듣고 기억해요! (🔊 다시 듣기)', { listen: true, koAlways: true });
    await ask('', 'What do Olivia and Joel take to get to the airplane museum?', 'Olivia와 Joel은 무엇을 타고 가나요?', ['Subway Line 2', 'Bus Number 2', 'Subway Line 3', 'Bus Number 5'], { hint: '🔊 아빠의 말을 다시 들어 보세요.' });
    await ask('', 'Where is the airplane museum?', 'Olivia의 아빠는 박물관이 어디에 있다고 했나요?', ["It's in front of the bank.", "It's behind the bank.", "It's between the bank and the school."]);
    await say('Olivia', 'Thanks, Dad.', '고마워요, 아빠.');
    await say('', '', '🌅 다음 날, Olivia와 Joel이 지하철을 타러 가요. 가까운 정류장으로 가요!', { btn: '출발!' });
    closeDlg();
    NPC.olivia.follow = true; NPC.joel.follow = true;
    setRide({ line: F.line, stop: F.stop, stopLabel: F.stopLabel, say: F.answer, onBoard: subwayScene, then: s3lost });
  };
}
async function subwayScene() {
  await say('', '', '🚇 지하철 안: 할아버지 한 분이 서 계세요. 👴', { btn: '다음 ▶' });
  await ask('나', 'Olivia가 되어 할아버지께 자리를 양보해요. 💺', '알맞은 말을 고르세요.', ['Please sit here.', 'Help me, please.', "I can't find the airplane museum.", 'Go straight one block.'], { me: true });
  await say('Grandpa', "Thank you. You're very kind.", '고맙구나. 정말 친절하구나.');
  await say('Joel', "Oh, it's ABC Hospital. We should get off here.", '아, ABC 병원이다. 여기서 내려야 해.');
}
async function s3lost() {
  const F = L.funTalk2;
  NPC.olivia.follow = false; NPC.joel.follow = false;
  setObj('🤔 박물관이 안 보여요! 정류장 옆 <b>Woman</b>에게 물어봐요', npcAt('passer2')); mark('passer2');
  NPC.passer2.talk = async () => {
    mark('passer2', false); NPC.passer2.talk = null;
    await say('Olivia', "I can't find the airplane museum.", '비행기 박물관을 못 찾겠어.');
    await ask('나', 'Joel이 되어 비행기 박물관이 어디에 있는지 물어보세요.', '알맞은 질문을 고르세요.', ['Excuse me. Where is the airplane museum?', 'Excuse me. What are you going to do?', "Excuse me. What's wrong?", 'Excuse me. What do you think?'], { me: true });
    await say('Woman', F.lost, '잘 듣고 기억해요! (🔊 다시 듣기)', { listen: true, koAlways: true });
    await ask('', 'Where is the airplane museum?', '비행기 박물관은 어디에 있나요?', ["It's between the restaurant and the flower shop.", "It's in front of the hospital.", "It's behind the flower shop.", "It's between the bank and the school."], { hint: 'between A and B = A와 B 사이에' });
    await say('Olivia', 'Thank you.', '고맙습니다.');
    closeDlg();
    NPC.olivia.follow = true; NPC.joel.follow = true;
    goTo('airmuseum', '✈️ <b>식당</b>과 <b>꽃집</b> <b>사이</b>에 있는 비행기 박물관을 찾아요 (Go straight one block.)', refPos('flowershop'), s3museum);
  };
}
async function s3museum() {
  NPC.olivia.follow = false; NPC.joel.follow = false;
  placeNPC('olivia', PL.airmuseum.x - 0.4, PL.airmuseum.door[1] + 0.6, Math.PI); placeNPC('joel', PL.airmuseum.x + 1.2, PL.airmuseum.door[1] + 0.8, Math.PI);
  await say('', '', '✈️ 비행기 박물관에 도착! 조종사 체험을 하러 가니 지하철에서 만난 할아버지가 있어요.', { btn: '다음 ▶' });
  await say('Olivia', "Oh, you're a pilot.", '어머, 조종사셨군요.');
  await say('Grandpa', 'Yes, I am. Come and sit here.', '그래, 맞아. 와서 여기 앉아 보렴.');
  flash(); toast('✈️ 조종사 체험! 슝~', 2200);
  await say('', '', '🎉 Fun Talk 2 완료! 이번에는 Erin의 길 안내를 듣고 직접 찾아가 봐요. (Play Together 2 · 목적지 찾아가기)', { btn: '다음 ▶' });
  closeDlg();
  setObj('🎻 박물관 앞의 <b>Erin</b>에게 가요', npcAt('erin')); mark('erin');
  NPC.erin.talk = async () => {
    mark('erin', false); NPC.erin.talk = null;
    await say('Erin', 'Hi! Can you come to the music show?', '안녕! 음악회에 올 수 있니? (초대장을 줘요 💌)');
    await say('나', 'Sure.', '물론이지.');
    await say('Erin', "I'll play the violin.", '나는 바이올린을 연주할 거야.');
    await ask('나', '음악회가 열리는 아트 센터에 가는 방법을 물어보세요.', '알맞은 말을 고르세요.', ["That's great. How can I get to the art center?", "That's great. What's wrong?", "That's great. What do you think?", "That's great. Where are you from?"], { me: true });
    stageState.fi = 0; await findRound();
  };
}
async function findRound() {
  const f = L.findGame[stageState.fi];
  const dir = `Take ${f.line} and get off at ${f.stopLabel}. ${f.where}`;
  await say('Erin', dir, '잘 듣고 기억해요! (🔊 다시 듣기)', { listen: true, koAlways: true });
  closeDlg();
  setRide({ line: f.line, stop: f.stop, stopLabel: f.stopLabel, say: dir, then: async () => {
    goTo(f.place, `📍 <b>${f.where}</b> ${S.koHelp ? '(' + f.ko + ')' : ''} — <b>${f.name}</b>을(를) 찾아요`, refPos(f.ref), async () => {
      good();
      const p = PL[f.place]; placeNPC('erin', p.x + 2, p.door[1] + (p.f < 0 ? -0.4 : 0.4), p.f < 0 ? Math.PI : 0);
      await ask('', `The ${f.name} is ______ the ${f.ref}.`, 'Read and Talk · 위치를 나타내는 말을 고르세요.', [f.prep, ...L.preps.map(x => x.id).filter(x => x !== f.prep)], { noShuffle: false });
      stageState.fi++;
      if (stageState.fi < L.findGame.length) {
        await say('Erin', "You're here! Thank you for coming. 🎻 After the show, let's go to the museum.", '와 줬구나! 음악회가 끝나면 박물관에 가자.');
        await ask('나', '박물관에 가는 방법을 물어보세요.', '알맞은 질문을 고르세요.', [QV('museum'), QV('art center'), 'What are you going to do tomorrow?', "What's wrong?"], { me: true });
        await findRound();
      } else {
        await say('Erin', "Here's the museum. Let's go in!", '여기가 박물관이야. 들어가자!');
        await say('', '', '🗺 Read and Talk · 마을 지도를 떠올리며 위치를 말해 봐요.', { btn: '좋아요!' });
        for (const q of L.whereQuiz.slice(0, 2)) await ask('', q.q, '알맞은 말을 고르세요.', [q.a, ...L.preps.map(x => x.id).filter(x => x !== q.a)]);
        nextStage();
      }
    });
  } });
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: -7 };
function stage4() {
  placeNPC('guide', 0, -0.6, Math.PI);
  setObj('🧱 마을 한가운데 길(사거리 북쪽)의 <b>Ms. Park</b>에게 가요', npcAt('guide')); mark('guide');
  NPC.guide.talk = async () => {
    mark('guide', false); NPC.guide.talk = null;
    await say('Ms. Park', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '길 위에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['Take', 'Subway', 'Line', 'behind', 'between', 'front', 'bus', 'zoo.', 'park.', 'Where'].filter(w => !words.includes(w));
  const extra = shuffle(pool).slice(0, 2);
  stageState.words = words; stageState.wi = 0; stageState.miss = 0;
  const all = shuffle(words.concat(extra));
  all.forEach((w, i) => {
    const a = (i / all.length) * Math.PI * 2 + Math.random() * 0.3, r = 4 + Math.random() * 2.6;
    const it = addItem(wordCube(w), BLK.x + Math.sin(a) * r, BLK.z + Math.cos(a) * r * 1.1, (it) => {
      if (it.cool > performance.now()) return;
      if (w === stageState.words[stageState.wi]) {
        removeItem(it); stageState.wi++; beep('get'); speak(w.replace(/[?.,]/g, ''), '나'); drawSentenceBar();
        if (stageState.wi === stageState.words.length) finishSentence();
      } else { it.cool = performance.now() + 1200; beep('bad'); it.shake = 0.5; stageState.miss++; toast('순서가 아니에요! 다음 단어를 생각해 보세요.'); }
    }, { y: 1.1, r: 1.0 });
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

// ---- 5. How Can I Get There? (Reading) ----
function stage5() {
  const R = L.reading;
  setObj('✈️ 남서쪽 <b>Airport</b>의 <b>Old Man</b>에게 가요', npcAt('oldman')); mark('oldman');
  NPC.oldman.talk = async () => {
    mark('oldman', false); NPC.oldman.talk = null;
    await say('', '', '📖 How Can I Get There? · 공항에서 사람들이 길을 묻고 있어요. 잘 읽어 보세요.', { btn: '읽기 ▶' });
    await readLines(R.hanok);
    await ask('', 'How can the old man get to Seoul Hanok Stay?', '할아버지는 서울 한옥 스테이에 어떻게 가나요?', ['Take Bus Number 5 and get off at the park.', 'Take Subway Line 5 and get off at the park.', 'Take Bus Number 5 and get off at the hospital.'], { sayIt: false });
    await ask('', 'Where is Seoul Hanok Stay?', '서울 한옥 스테이는 어디에 있나요?', ["It's behind the hospital.", "It's in front of the hospital.", "It's between the park and the hospital."], { sayIt: false });
    closeDlg();
    setObj('🍲 배고픈 <b>Leo</b>네 가족에게 가요', npcAt('leo')); mark('leo');
    NPC.leo.talk = async () => {
      mark('leo', false); NPC.leo.talk = null;
      await readLines(R.food);
      await ask('', 'Where is the Korean restaurant?', 'Yuna가 고른 한국 식당은 어디에 있나요?', ["It's between the bookstore and the toy shop.", "It's in front of the ice cream shop.", "It's behind the help desk."], { sayIt: false });
      await say('', '', '🍲 가족을 서점(Bookstore)과 장난감 가게(Toy Shop) 사이의 식당으로 안내해 주세요. 식당이 두 곳이니 잘 보세요!', { btn: '안내할게요!' });
      closeDlg();
      ['leo', 'dad2', 'yuna'].forEach(id => NPC[id].follow = true);
      goTo('rest1', '🍲 <b>서점</b>과 <b>장난감 가게</b> <b>사이</b>의 식당으로 가족을 안내해요', () => STALL.book.door, s5food);
    };
  };
}
async function s5food() {
  const R = L.reading, s = STALL.rest1;
  ['leo', 'dad2', 'yuna'].forEach((id, i) => placeNPC(id, s.door[0] + 1.6, s.door[1] - 1.2 + i * 1.2, -Math.PI / 2));
  good();
  await say('Dad', 'This is it. Thank you!', '여기구나. 고마워!');
  closeDlg();
  setObj('🎫 표를 잃어버린 <b>Old Lady</b>에게 가요', npcAt('oldlady')); mark('oldlady');
  NPC.oldlady.talk = async () => {
    mark('oldlady', false); NPC.oldlady.talk = null;
    await readLines(R.ticket);
    await ask('', 'Where is the help desk?', '할머니가 갈 안내 데스크는 어디에 있나요?', ["It's in front of the ice cream shop.", "It's behind the ice cream shop.", "It's between the bookstore and the toy shop."], { sayIt: false });
    await say('', '', '❓ 안내 데스크가 두 곳이에요. 아이스크림 가게 앞의 안내 데스크로 할머니를 모셔다 드려요.', { btn: '모셔다 드릴게요!' });
    closeDlg();
    NPC.oldlady.follow = true;
    goTo('help1', '❓ <b>아이스크림 가게 앞</b>의 Help Desk로 할머니를 안내해요', () => [STALL.ice.x, STALL.ice.z], s5help);
  };
}
async function s5help() {
  NPC.oldlady.follow = false; placeNPC('oldlady', STALL.help1.x + 1.2, STALL.help1.door[1], Math.PI);
  good();
  await say('Staff', 'Here is your ticket.', '여기 표가 있어요. 🎫');
  await say('Old Lady', 'Thank you!', '고마워요!');
  await say('', '', '📝 After You Read · 각 인물이 찾는 장소를 골라요.', { btn: '시작' });
  const A = ['Seoul Hanok Stay', 'a Korean restaurant', 'the help desk'];
  await ask('', '1. Old Man 👴 is looking for ______.', '할아버지가 찾는 곳은?', A, { noShuffle: true, sayIt: false });
  await ask('', "2. Leo's family 👨‍👧‍👦 is looking for ______.", 'Leo네 가족이 찾는 곳은?', A, { right: A[1], noShuffle: true, sayIt: false });
  await ask('', '3. Old Lady 👵 is looking for ______.', '할머니가 찾는 곳은?', A, { right: A[2], noShuffle: true, sayIt: false });
  await say('', '', '📝 글의 내용에 맞게 문장을 완성해요.', { btn: '시작' });
  await ask('', 'Take ______ Number 5 and get off at the park.', '빈칸에 알맞은 말', ['Bus', 'Subway', 'Line'], { sayIt: false });
  await ask('', 'Seoul Hanok Stay is ______ the hospital.', '빈칸에 알맞은 말', ['behind', 'in front of', 'between'], { sayIt: false });
  await ask('', 'The help desk is ______ the ice cream shop.', '빈칸에 알맞은 말', ['in front of', 'behind', 'between'], { sayIt: false });
  await ask('', 'The Korean restaurant is ______ the bookstore and the toy shop.', '빈칸에 알맞은 말', ['between', 'behind', 'in front of'], { sayIt: false });
  speak("The Korean restaurant is between the bookstore and the toy shop.", 'Narrator');
  await say('', '', '✈️ 공항 길 찾기 완료! 길을 묻고, 위치를 말하는 글을 끝까지 읽었어요.', { btn: '다음 미션 ▶' });
  nextStage();
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("✏️ 남동쪽 <b>Town Guide Desk</b>의 <b>Mina</b>에게 가요", npcAt('mina')); mark('mina');
  NPC.mina.talk = async () => {
    mark('mina', false);
    await say('Mina', 'Read my writing about Green Market!', 'Green Market에 가는 방법을 안내하는 내 글을 읽어 줘!');
    const ko = ['그린 시장에 오세요.', '과일과 채소가 많이 있어요.', '과일 샐러드와 주스를 살 수 있어요.', '지하철 4호선을 타고 박물관에서 내리세요.', '그곳은 공원 앞에 있어요.', '월요일부터 토요일까지 문을 열어요.'];
    for (let i = 0; i < L.writeSample.length; i++) await say('Mina', L.writeSample[i], ko[i] || '');
    await ask('', 'How can you get to Green Market?', '그린 시장에 어떻게 가나요?', ['Take Subway Line 4 and get off at the museum.', 'Take Bus Number 4 and get off at the park.', 'Take Subway Line 4 and get off at the park.'], { sayIt: false });
    await ask('', 'Where is Green Market?', '그린 시장은 어디에 있나요?', ["It's in front of the park.", "It's behind the museum.", "It's between the park and the museum."], { sayIt: false });
    await say('Mina', 'Now, write about a place in your town!', '이제 우리 마을의 장소에 가는 방법을 안내하는 글을 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const W = L.writeOpts, opt = (arr) => arr.map(a => Array.isArray(a) ? `<option value="${esc(a[0])}">${esc(a[0])} (${esc(a[1])})</option>` : `<option value="${esc(a)}">${esc(a)}</option>`).join('');
  $('#wPlace').innerHTML = opt(W.place); $('#wMany').innerHTML = opt(W.many); $('#wCan').innerHTML = opt(W.can);
  $('#wLine').innerHTML = opt(W.lines); $('#wStop').innerHTML = opt(W.stops);
  $('#wPrep').innerHTML = opt(L.preps.map(p => [p.id, p.ko])); $('#wN1').innerHTML = opt(W.near); $('#wN2').innerHTML = opt(W.near);
  $('#wFrom').innerHTML = opt(W.days); $('#wTo').innerHTML = opt(W.days);
  $('#wN2').value = W.near[1]; $('#wTo').value = 'Saturday';
  if (S.card) for (const [k, id] of [['name', 'wName'], ['place', 'wPlace'], ['many', 'wMany'], ['can', 'wCan'], ['line', 'wLine'], ['stop', 'wStop'], ['prep', 'wPrep'], ['n1', 'wN1'], ['n2', 'wN2'], ['from', 'wFrom'], ['to', 'wTo']]) if (S.card[k]) $('#' + id).value = S.card[k];
  const upd = () => { $('#wN2box').style.display = $('#wPrep').value === 'between' ? '' : 'none'; $('#wPreview').innerHTML = letterHTML(letterData()); };
  f.oninput = upd; f.onchange = upd; upd();
  $('#wRead').onclick = () => speak(letterText(letterData()).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = letterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.name)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if (c.prep === 'between' && c.n1 === c.n2) { toast('between 뒤의 두 장소를 서로 다르게 골라 주세요.'); return; }
    if (c.from === c.to) { toast('여는 요일 두 개를 서로 다르게 골라 주세요.'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).join(' '), '나');
    await say('Mina', "Great writing! Now I want to go there.", '멋진 글이야! 나도 거기 가 보고 싶어.');
    nextStage(); showEnd();
  };
}
function letterData() { const v = (id) => $('#' + id).value.trim(); return { name: v('wName'), place: v('wPlace'), many: v('wMany'), can: v('wCan'), line: v('wLine'), stop: v('wStop'), prep: v('wPrep'), n1: v('wN1'), n2: v('wN2'), from: v('wFrom'), to: v('wTo') }; }
function letterText(c) {
  const loc = c.prep === 'between' ? `It's between ${c.n1} and ${c.n2}.` : `It's ${c.prep} ${c.n1}.`;
  return [`Come to ${c.place}.`, `There are many ${c.many}.`, `You can ${c.can}.`, `Take ${c.line} and get off at ${c.stop}.`, loc, `It's open from ${c.from} to ${c.to}.`];
}
function letterHTML(c) {
  return '<div class="cardPrev">' + letterText(c).map(l => `<div>${esc(l)}</div>`).join('') + (c.name ? `<div style="text-align:right;color:var(--accent)">— ${esc(c.name)}</div>` : '') + '</div>';
}
function stageFree() { setObj('🎉 모든 미션 완료! 정류장(노란 바닥)에서 버스·지하철을 타고 마을을 돌아다니거나 <b>nk 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · nk 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? letterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? letterText(S.card).join(' ') + ' — ' + S.card.name : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 nk 코인 ----
const TH_SPOTS = [[-30, -6], [30, -6], [42, 22], [-8, 22], [6, -40], [-40, -38]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('nk', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('nk', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Hank');
      toast(`🪙 nk 코인: <b>${w.replace('nk', '<u>nk</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 nk 코인을 모두 모았어요! The pink tree is behind the bank.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Hank', "Hi! I'm Hank. The pink tree is behind the bank.", '안녕! 나는 Hank야. 분홍 나무는 은행 뒤에 있어.');
  await say('Hank', 'Listen: pink, bank, Hank. nk, nk, nk!', 'Sounds and Letters · nk 소리를 들어 보세요.');
  await say('', '', `🪙 마을 구석구석에 숨은 nk 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
