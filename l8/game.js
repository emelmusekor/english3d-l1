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
const SAVE_KEY = 'english3d_l8_v1';
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
  Mom: [1, 1.05], Olivia: [1, 1.3], Ben: [0, 1.4], Kai: [0, 1.1], "Kai's brother": [0, 0.9], Nara: [1, 1.35], Joel: [0, 1.15], 'Ms. Lee': [1, 1.1],
  Poet: [1, 1.25], Alex: [0, 1.1], Brian: [0, 1.0], Friend: [1, 1.3], Amy: [1, 1.45], Tom: [0, 1.2], Lucy: [1, 1.35], Sam: [0, 1.1], Emma: [1, 1.3], Boy: [0, 1.2], Girl: [1, 1.35], '나': [0, 1.0]
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

// ---------------- 세계 만들기 (Lesson 8 · Feelings Town) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x94cf72)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xeadfca)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xeadfca)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const path3 = new THREE.Mesh(new THREE.PlaneGeometry(40, 5), mat(0xeadfca)); path3.rotation.x = -Math.PI / 2; path3.position.set(0, 0.012, -22); scene.add(path3);
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0xf59f00, -4, 2, FEN); solid(1, 4, 1, 0xf59f00, 4, 2, FEN);
const gateSign = textPlane('Feelings Town 😄😢😠😟😴', 1.1, { fs: 64, bg: '#f59f00', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1, c = 0x4caf50) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const b = ball(1.5 * s, c, x, 3 * s, z); b.scale.y = 1.1;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -44, 1); tree(-43.5, i + 1, 1.1, i % 16 === 0 ? 0xffc9de : 0x4caf50); tree(43.5, i + 3, 1); }
for (const x of [-38, -14, 14, 38]) tree(x, 42, 0.9, 0xffc9de);
for (const [x, z] of [[-12, 36], [12, 38], [-14, 12], [15, 12]]) tree(x, z, 1.2);
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-6, 8); bench(6, 8);
// 감정 표지판 (중앙 길)
['😄 happy', '😢 sad', '😠 upset', '😟 worried', '😴 tired'].forEach((t, i) => {
  const x = i % 2 ? 5.2 : -5.2, z = 32 - i * 5;
  cyl(0.07, 0.07, 2.2, 0x868e96, x, 1.1, z);
  const p = textPlane(t, 0.5, { fs: 52, bg: '#ffffff', fg: '#1d3557', border: '#f59f00' }); p.position.set(x, 2.3, z); p.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
});

// ---------- 서쪽: Olivia's House + 마당 ----------
const HOUSE = { x: -27, z: -2 };
solid(0.4, 4, 20, 0xfff3bf, -34, 2, -2);
solid(14, 4, 0.4, 0xfff3bf, -27, 2, -12); solid(14, 4, 0.4, 0xfff3bf, -27, 2, 8);
solid(0.5, 4, 0.5, 0x1c7ed6, -20.2, 2, -11.8); solid(0.5, 4, 0.5, 0x1c7ed6, -20.2, 2, 7.8);
{ const r = new THREE.Mesh(new THREE.ConeGeometry(12.5, 4, 4), mat(0x1c7ed6)); r.rotation.y = Math.PI / 4; r.scale.set(0.8, 1, 1.1); r.position.set(-27, 6, -2); scene.add(r); }
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xe9d8a6)); fl.rotation.x = -Math.PI / 2; fl.position.set(-27, 0.02, -2); scene.add(fl); }
{ const s = textPlane("Olivia's House 🏠", 0.9, { fs: 64, bg: '#1c7ed6', fg: '#fff' }); s.position.set(-19.9, 4.6, -2); s.rotation.y = Math.PI / 2; }
// 거실 소파·탁자
box(1, 0.5, 3.4, 0xf08c00, -32.8, 0.25, -6); box(0.3, 0.6, 3.4, 0xe67700, -33.4, 0.75, -6);
cyl(0.7, 0.7, 0.06, 0xffffff, -30, 0.6, -6, scene, 18); cyl(0.07, 0.07, 0.6, 0x777777, -30, 0.3, -6); block(-30.6, -6.6, -29.4, -5.4);
// Ben의 방 (책상 + 만들기 재료)
solid(2.4, 0.8, 1.1, 0xdeb887, -32.6, 0.4, 5.6); box(0.6, 0.1, 0.5, 0xffffff, -32.6, 0.85, 5.6);
{ const s = textPlane("Ben's Room ✈️", 0.4, { fs: 48, bg: '#ffffff', fg: '#1c7ed6' }); s.position.set(-33.75, 2.4, 3.5); s.rotation.y = Math.PI / 2; }
// 축구 트로피 장식장
box(0.8, 1.6, 1.4, 0x8d6e63, -33.4, 0.8, -10); cyl(0.12, 0.2, 0.4, 0xffd43b, -33.4, 1.85, -10);
// 마당 (Scene 3)
const YARD = { x: -27, z: 16 };
{ const y = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), mat(0x7bc96f)); y.rotation.x = -Math.PI / 2; y.position.set(YARD.x, 0.02, YARD.z); scene.add(y);
  for (let i = 0; i < 15; i++) { box(0.12, 0.8, 0.12, 0xffffff, YARD.x - 7 + i, 0.4, YARD.z + 6); box(0.12, 0.8, 0.12, 0xffffff, YARD.x - 7, 0.4, YARD.z - 6 + i * 0.8); }
  box(14, 0.08, 0.06, 0xffffff, YARD.x, 0.65, YARD.z + 6); box(0.06, 0.08, 12, 0xffffff, YARD.x - 7, 0.65, YARD.z);
  block(YARD.x - 7, YARD.z + 5.9, YARD.x + 7, YARD.z + 6.1); block(YARD.x - 7.1, YARD.z - 6, YARD.x - 6.9, YARD.z + 6);
  const s = textPlane('Yard 🌳', 0.5, { fs: 52, bg: '#ffffff', fg: '#2b8a3e' }); s.position.set(YARD.x + 6.8, 1.6, YARD.z); s.rotation.y = Math.PI / 2;
  // 개집
  const g = new THREE.Group(); box(1.4, 1, 1.2, 0xc92a2a, 0, 0.5, 0, g); const r = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.7, 4), mat(0x862e9c)); r.rotation.y = Math.PI / 4; r.position.y = 1.35; g.add(r); box(0.5, 0.6, 0.05, 0x222222, 0, 0.35, 0.61, g);
  g.position.set(YARD.x - 4.5, 0, YARD.z + 3); scene.add(g); block(YARD.x - 5.2, YARD.z + 2.4, YARD.x - 3.8, YARD.z + 3.6); }
const PLANE_LAND = { x: -11, z: 27 };

// ---------- 동쪽: Green School ----------
const SCHOOL = { x: 27, z: -2 };
solid(0.4, 4.5, 20, 0xfff9db, 34, 2.25, -2);
solid(14, 4.5, 0.4, 0xfff9db, 27, 2.25, -12); solid(14, 4.5, 0.4, 0xfff9db, 27, 2.25, 8);
solid(0.5, 4.5, 0.5, 0x2f9e44, 20.2, 2.25, -11.8); solid(0.5, 4.5, 0.5, 0x2f9e44, 20.2, 2.25, 7.8);
box(14.6, 0.4, 20.6, 0x2f9e44, 27, 4.7, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xd3a46a)); fl.rotation.x = -Math.PI / 2; fl.position.set(27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('Green School 🏫', 1.0, { fs: 64, bg: '#2f9e44', fg: '#fff' }); s.position.set(19.9, 4.2, -7); s.rotation.y = -Math.PI / 2; }
// 칠판
box(0.1, 1.8, 6, 0x2b8a3e, 33.7, 2, -2);
{ const s = textPlane('Today: Science 🔬\nTomorrow: Math ➗', 0.9, { fs: 52, bg: null, fg: '#ffffff' }); s.position.set(33.6, 2.1, -2); s.rotation.y = -Math.PI / 2; }
// 책상 줄
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = 30.5 - r * 2.6, z = -7 + c * 4.2; box(0.8, 0.7, 1.2, 0xffd8a8, x, 0.35, z); box(0.5, 0.45, 0.5, 0x339af0, x - 0.8, 0.22, z); }

// ---------- 북동: Kai's House ----------
const KAI = { x: 30, z: -32 };
solid(14, 3.6, 0.4, 0xe7f5ff, 30, 1.8, -39); solid(0.4, 3.6, 14, 0xe7f5ff, 37, 1.8, -32); solid(14, 3.6, 0.4, 0xe7f5ff, 30, 1.8, -25);
solid(0.5, 3.6, 0.5, 0x7048e8, 23.2, 1.8, -38.8); solid(0.5, 3.6, 0.5, 0x7048e8, 23.2, 1.8, -25.2);
{ const r = new THREE.Mesh(new THREE.ConeGeometry(10.5, 3.4, 4), mat(0x7048e8)); r.rotation.y = Math.PI / 4; r.position.set(30, 5.3, -32); scene.add(r); }
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat(0xd0bfff)); fl.rotation.x = -Math.PI / 2; fl.position.set(30, 0.02, -32); scene.add(fl); }
{ const s = textPlane("Kai's House 🏡", 0.8, { fs: 64, bg: '#7048e8', fg: '#fff' }); s.position.set(22.9, 4.1, -32); s.rotation.y = -Math.PI / 2; }
// 공부 책상 + 스탠드
const DESK = { x: 33.5, z: -34 };
solid(1.2, 0.8, 2.2, 0xdeb887, DESK.x, 0.4, DESK.z); box(0.5, 0.06, 0.7, 0xffffff, DESK.x - 0.1, 0.83, DESK.z);
cyl(0.05, 0.05, 0.6, 0x495057, DESK.x + 0.3, 1.1, DESK.z - 0.8); ball(0.14, 0xffe066, DESK.x + 0.15, 1.4, DESK.z - 0.8);
{ const s = textPlane('Math Quiz 📝 Tomorrow', 0.4, { fs: 48, bg: '#ffffff', fg: '#7048e8' }); s.position.set(36.75, 2.2, -34); s.rotation.y = -Math.PI / 2; }
// 책장
const SHELF = { x: 30, z: -38.3 };
solid(3, 2.4, 0.8, 0x8d6e63, SHELF.x, 1.2, SHELF.z);
for (let k = 0; k < 8; k++) box(0.25, 0.5, 0.5, [0xff8787, 0x74c0fc, 0xffd43b, 0x69db7c][k % 4], SHELF.x - 1.1 + (k % 4) * 0.7, 0.75 + Math.floor(k / 4) * 0.9, SHELF.z + 0.1);
// 침대
solid(2, 0.6, 3, 0x8d6e63, 26, 0.3, -36.5); box(1.9, 0.25, 2.9, 0xffffff, 26, 0.72, -36.5); box(1.9, 0.2, 1.5, 0x9775fa, 26, 0.88, -35.8);

// ---------- 북서: Feelings Maze (Listen and Do) ----------
const MAZE = { x: -31, z: -31 };
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(19, 18), mat(0xb2f2bb)); f.rotation.x = -Math.PI / 2; f.position.set(-30.5, 0.02, -31); scene.add(f); }
const hedge = (x1, z1, x2, z2) => { const w = Math.abs(x2 - x1) || 0.8, d = Math.abs(z2 - z1) || 0.8; solid(w, 1.1, d, 0x2b8a3e, (x1 + x2) / 2, 0.55, (z1 + z2) / 2); };
hedge(-40, -40, -21, -40); hedge(-40, -40, -40, -22); hedge(-21, -40, -21, -28);
hedge(-40, -28, -27, -28); hedge(-35, -34, -21, -34);
{ const s = textPlane('Feelings Maze 🧩', 0.8, { fs: 62, bg: '#2b8a3e', fg: '#fff' }); s.position.set(-30, 3.2, -40.5); }
cyl(0.08, 0.08, 3, 0x666666, -34, 1.5, -40.5); cyl(0.08, 0.08, 3, 0x666666, -26, 1.5, -40.5);
// 출구 깃발
const GOAL_FLAG = { x: -24, z: -37 };
cyl(0.06, 0.06, 2.6, 0x495057, GOAL_FLAG.x, 1.3, GOAL_FLAG.z);
{ const fl = textPlane('GOAL 🏁', 0.5, { fs: 52, bg: '#ffd43b', fg: '#222' }); fl.position.set(GOAL_FLAG.x + 0.7, 2.3, GOAL_FLAG.z); }

// ---------- 북쪽: Color Garden (Reading) ----------
const STORY = { x: 0, z: -34 };
box(40, 0.3, 14, 0xf8f0e3, 0, 0.15, -34);
solid(40, 4, 0.4, 0xe6d5b8, 0, 2, -41);
{ const s = textPlane('What Color Is Your World? 🎨', 0.9, { fs: 62, bg: '#f76707', fg: '#fff' }); s.position.set(0, 5, -40.7); }
const COLORS = { blue: { x: -12, c: 0x4dabf7, css: '#1c7ed6', label: 'Blue 💙' }, gray: { x: 0, c: 0xadb5bd, css: '#495057', label: 'Gray 🩶' }, yellow: { x: 12, c: 0xffd43b, css: '#f08c00', label: 'Yellow 💛' } };
for (const k of Object.keys(COLORS)) {
  const c = COLORS[k];
  { const f = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), mat(c.c)); f.rotation.x = -Math.PI / 2; f.position.set(c.x, 0.32, -36); scene.add(f); }
  solid(0.4, 3.2, 0.4, c.c, c.x - 3.6, 1.6, -39.5); solid(0.4, 3.2, 0.4, c.c, c.x + 3.6, 1.6, -39.5);
  box(7.6, 0.4, 0.5, c.c, c.x, 3.3, -39.5);
  const s = textPlane(c.label, 0.6, { fs: 56, bg: '#ffffff', fg: c.css, border: c.css }); s.position.set(c.x, 2.4, -40.6);
}
// Before You Read 그림판 (정원 사이 벽)
[[-18, '🚚 move to\na new city'], [-6, '🏫 go to\na new school'], [6, '🤝 make\na new friend'], [18, 'Before\nYou Read 📖']].forEach(([x, t]) => { const s = textPlane(t, 1.1, { fs: 48, bg: '#ffffff', fg: '#1d3557', border: '#f76707' }); s.position.set(x, 1.9, -40.7); });

// ---------- 남서: Let's Write · Feelings Board ----------
const WRITE = { x: -26, z: 30 };
box(16, 0.4, 12, 0xfff0f6, WRITE.x, 0.2, WRITE.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz);
box(17, 0.4, 13, 0xd6336c, WRITE.x, 5.2, WRITE.z);
{ const s = textPlane("Let's Write · Feelings Board #", 0.85, { fs: 62, bg: '#d6336c', fg: '#fff' }); s.position.set(WRITE.x + 8.6, 4.4, WRITE.z); s.rotation.y = Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x - 1, 0.85, WRITE.z);
box(0.9, 0.55, 0.05, 0x212529, WRITE.x - 1, 1.6, WRITE.z - 0.3);
solid(0.4, 3.4, 10, 0xf8f9fa, WRITE.x - 7.6, 2, WRITE.z);
['😠 #upset\n#bike', '😄 #happy\n#soccer game', '💬 Good\nfor you!'].forEach((e, i) => { const p = textPlane(e, 1.0, { fs: 56, bg: '#ffffff', fg: '#d6336c', border: '#d6336c' }); p.position.set(WRITE.x - 7.35, 2.4, WRITE.z - 3.2 + i * 3.2); p.rotation.y = Math.PI / 2; });

// ---------- 남동: 축구장 ----------
const FIELD = { x: 26, z: 30 };
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat(0x51cf66)); f.rotation.x = -Math.PI / 2; f.position.set(FIELD.x, 0.02, FIELD.z); scene.add(f);
  const l = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 12), mat(0xffffff)); l.rotation.x = -Math.PI / 2; l.position.set(FIELD.x, 0.03, FIELD.z); scene.add(l);
  const c = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.8, 32), mat(0xffffff)); c.rotation.x = -Math.PI / 2; c.position.set(FIELD.x, 0.03, FIELD.z); scene.add(c);
  for (const sx of [-1, 1]) { const gx = FIELD.x + sx * 7.6; box(0.12, 1.6, 0.12, 0xffffff, gx, 0.8, FIELD.z - 1.8); box(0.12, 1.6, 0.12, 0xffffff, gx, 0.8, FIELD.z + 1.8); box(0.12, 0.12, 3.7, 0xffffff, gx, 1.6, FIELD.z); }
  ball(0.25, 0xffffff, FIELD.x + 2, 0.25, FIELD.z + 1);
  const s = textPlane('Soccer Field ⚽🏆', 0.7, { fs: 60, bg: '#f76707', fg: '#fff' }); s.position.set(FIELD.x, 3.2, FIELD.z - 6.2); cyl(0.06, 0.06, 3, 0x666666, FIELD.x - 2.5, 1.5, FIELD.z - 6.2); cyl(0.06, 0.06, 3, 0x666666, FIELD.x + 2.5, 1.5, FIELD.z - 6.2); }

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'airplane') {
    box(0.7, 0.08, 0.12, 0xffffff, 0, 0.1, 0, g); const n = box(0.12, 0.06, 0.1, 0x74c0fc, 0.38, 0.1, 0, g); n.rotation.z = -0.2;
    box(0.22, 0.03, 0.9, 0x339af0, 0.05, 0.12, 0, g); box(0.1, 0.18, 0.04, 0x339af0, -0.32, 0.2, 0, g); box(0.1, 0.03, 0.3, 0x339af0, -0.32, 0.12, 0, g);
  } else if (id === 'mathbook') {
    box(0.42, 0.08, 0.3, 0x7048e8, 0, 0.04, 0, g); box(0.4, 0.06, 0.28, 0xffffff, 0.01, 0.06, 0, g);
    const t = textPlane('Math ➗', 0.12, { fs: 48, bg: null, fg: '#ffffff' }, g); t.rotation.x = -Math.PI / 2; t.position.set(0, 0.085, 0);
  }
  return g;
}
let decor = [];
function addDecor(o) { scene.add(o); decor.push(o); return o; }
function clearDecor() { decor.forEach(o => scene.remove(o)); decor = []; }

// ---------- 강아지 Max ----------
const DOG_HOME = { x: YARD.x - 2.5, z: YARD.z + 1.5 };
const dog = new THREE.Group();
(function makeDog() {
  box(0.36, 0.32, 0.7, 0xc58b3a, 0, 0.42, 0, dog); box(0.3, 0.28, 0.3, 0xc58b3a, 0, 0.66, 0.42, dog);
  box(0.1, 0.16, 0.08, 0x7a4b20, -0.12, 0.84, 0.38, dog); box(0.1, 0.16, 0.08, 0x7a4b20, 0.12, 0.84, 0.38, dog);
  ball(0.04, 0x111111, -0.07, 0.7, 0.58, dog); ball(0.04, 0x111111, 0.07, 0.7, 0.58, dog); ball(0.05, 0x222222, 0, 0.62, 0.6, dog);
  for (const [x, z] of [[-0.12, -0.25], [0.12, -0.25], [-0.12, 0.25], [0.12, 0.25]]) box(0.09, 0.28, 0.09, 0xa9702a, x, 0.14, z, dog);
  const tail = box(0.06, 0.06, 0.3, 0xa9702a, 0, 0.6, -0.45, dog); tail.rotation.x = 0.7; dog.userData.tail = tail;
  const tag = textSprite('Max 🐶', 0.3, { fs: 48, fg: '#7a4b20' }); tag.position.y = 1.25; dog.add(tag);
})();
dog.position.set(DOG_HOME.x, 0, DOG_HOME.z); scene.add(dog);
let dogTarget = null;
function dogGo(x, z) { dogTarget = { x, z }; }
function dogHome() { dogTarget = null; dog.position.set(DOG_HOME.x, 0, DOG_HOME.z); }

// ---------- 날아가는 비행기 ----------
let flyer = null;
function flyPlane(from, to, dur, onEnd) {
  const g = itemModel('airplane'); g.scale.setScalar(1.6); addDecor(g);
  flyer = { g, from, to, t: 0, dur, onEnd };
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
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  for (const f of fallers) { f.userData.life -= dt; f.position.y += dt * 0.8; f.material.opacity = Math.max(0, f.userData.life); }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { scene.remove(f); return false; } return true; });
  // 강아지
  dog.userData.tail.rotation.y = Math.sin(t * 14) * 0.6;
  if (dogTarget) {
    const dx = dogTarget.x - dog.position.x, dz = dogTarget.z - dog.position.z, d = Math.hypot(dx, dz);
    if (d > 0.3) { const m = Math.min(d, 7 * dt); dog.position.x += dx / d * m; dog.position.z += dz / d * m; dog.rotation.y = Math.atan2(dx, dz); dog.position.y = Math.abs(Math.sin(t * 14)) * 0.12; }
    else dog.position.y = 0;
  }
  // 비행기
  if (flyer) {
    flyer.t += dt; const k = Math.min(1, flyer.t / flyer.dur);
    const x = flyer.from.x + (flyer.to.x - flyer.from.x) * k, z = flyer.from.z + (flyer.to.z - flyer.from.z) * k;
    flyer.g.position.set(x, 1.2 + Math.sin(k * Math.PI) * 5, z); flyer.g.rotation.y = Math.atan2(flyer.to.x - flyer.from.x, flyer.to.z - flyer.from.z) - Math.PI / 2;
    if (k >= 1) { const f = flyer; flyer = null; scene.remove(f.g); if (f.onEnd) f.onEnd(); }
  }
}
function puff(x, y, z, text) {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#1c7ed6', border: '#1c7ed6' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 1.6; scene.add(s); fallers.push(s);
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#eadfca'); R(0, -2, 52, 6, '#eadfca'); R(0, -22, 40, 5, '#eadfca');
  R(-27, -2, 14, 20, '#1c7ed6', '올리비아 집'); R(YARD.x, YARD.z, 14, 12, '#5c940d', '마당');
  R(27, -2, 14, 20, '#2f9e44', '학교'); R(KAI.x, KAI.z, 14, 14, '#7048e8', '카이 집');
  R(-30.5, -31, 19, 18, '#2b8a3e', '감정 미로'); R(0, -35, 40, 9, '#f76707', '색깔 정원');
  R(WRITE.x, WRITE.z, 16, 12, '#d6336c', '감정 게시판'); R(FIELD.x, FIELD.z, 16, 12, '#f08c00', '축구장');
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
const FE = Object.fromEntries(L.feelings.map(f => [f.id, f]));
function addNPC(id, o, x, z, face = 0) {
  const g = makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '', scale: o.scale || 1, face: null };
  return NPC[id];
}
// 얼굴 표정 말풍선 (머리 옆)
function setFace(id, emoji) {
  const n = NPC[id];
  if (n.face) { n.g.remove(n.face); n.face = null; }
  if (!emoji) return;
  const s = textSprite(emoji, 0.55 / n.scale, { fs: 80, bg: '#ffffff', border: '#f59f00', pad: 14 }); s.position.set(0.62, 1.95, 0); n.g.add(s); n.face = s;
}
// 집 위치 [x, z, 방향]
const HOME = {
  mom: [-29, -3, Math.PI / 2], olivia: [-17, 3, -Math.PI / 2], ben: [-30.6, 4.4, Math.PI / 2],
  kai: [32, -31, -Math.PI / 2], nara: [24.5, -5, Math.PI / 2], joel: [24.5, 1.5, Math.PI / 2],
  teacher: [-18, -25, -Math.PI / 2],
  poet: [COLORS.blue.x, -34, 0],
  alex: [WRITE.x + 1, WRITE.z + 1.8, Math.PI / 2],
  bonus: [-6, -19, 0]
};
const KID_POS = [[-24, -25], [-34, -25], [-24, -31], [-33, -31], [-30, -37]];
L.kids.forEach((k, i) => { HOME[k.id] = [...KID_POS[i], Math.PI / 4]; });

addNPC('mom', { name: 'Mom', girl: true, shirt: 0xf06595, skirt: 0xc2255c, hair: 0x6d4c41, scale: 1.12, idle: ['Olivia, Ben, dinner is ready!', 'Olivia, Ben, 저녁 다 됐다!'] }, ...HOME.mom);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ['I scored the winning goal!', '내가 결승골을 넣었어!'] }, ...HOME.olivia);
addNPC('ben', { name: 'Ben', shirt: 0x4dabf7, hair: 0x6d4c41, scale: 0.82, idle: ['I made an airplane. It was my homework.', '나는 비행기를 만들었어. 숙제였어.'] }, ...HOME.ben);
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ['The math quiz is tomorrow.', '수학 퀴즈는 내일이야.'] }, ...HOME.kai);
addNPC('nara', { name: 'Nara', girl: true, shirt: 0xfcc419, hair: 0x111111, idle: ['You don\'t look well. What\'s wrong?', '안색이 안 좋아 보여. 무슨 일 있니?'] }, ...HOME.nara);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ['We have the science quiz today.', '우리 오늘 과학 퀴즈 있어.'] }, ...HOME.joel);
addNPC('teacher', { name: 'Ms. Lee', girl: true, shirt: 0x12b886, skirt: 0x087f5b, hair: 0x222222, scale: 1.12, idle: ['Why are you happy? Because I won the soccer game.', '너는 왜 행복하니? 축구 경기에서 이겼기 때문이야.'] }, ...HOME.teacher);
addNPC('poet', { name: 'Poet', girl: true, shirt: 0xff922b, hair: 0x3b2a1a, idle: ['What color is your world today?', '오늘 너의 세상은 무슨 색이니?'] }, ...HOME.poet);
addNPC('alex', { name: 'Alex', shirt: 0xd6336c, hair: 0x5c3d2e, idle: ["Today, I'm happy. Why? Because I won the soccer game.", '오늘 나는 행복해. 왜냐고? 축구 경기에서 이겼거든.'] }, ...HOME.alex);
addNPC('bonus', { name: 'Brian', shirt: 0x8d6e63, pants: 0x5d4037, hair: 0x3b2a1a, idle: ['My brother broke my brown cup.', '내 남동생이 내 갈색 컵을 깼어.'] }, ...HOME.bonus);
L.kids.forEach((k, i) => addNPC(k.id, { name: k.name, girl: k.girl, shirt: k.shirt, hair: [0xa0522d, 0x3b2a1a, 0xd4a017, 0x111111, 0x222222][i], scale: 0.9, idle: [`Because ${k.because}`, `${FE[k.feel].emoji} ${FE[k.feel].ko} 이유를 말했어요.`] }, ...HOME[k.id]));
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

const STAGES = [
  { title: '1. Olivia네 집', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 감정 미로', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. Kai의 수학 퀴즈', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 너의 세상은 무슨 색?', book: 'Before/After You Read', start: stage5 },
  { title: '6. 오늘 나의 기분 글', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); flyer = null; held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; setFace(n.id, null); }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  dogHome();
  if (S.stage > 1) L.kids.forEach(k => setFace(k.id, FE[k.feel].emoji));
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
const why = (f, pre = '') => (pre ? pre + ', why' : 'Why') + ` are you ${f}?`;
// 정답 질문 + 다른 감정 질문 3개
const whyChoices = (f, pre = '') => [why(f, pre), ...shuffle(L.feelings.map(x => x.id).filter(x => x !== f)).slice(0, 3).map(x => why(x, pre))];
const feelChoices = (f) => [f, ...shuffle(L.feelings.map(x => x.id).filter(x => x !== f)).slice(0, 3)].map(x => `${FE[x].emoji} ${x}`);
const RS = Object.fromEntries(L.reasons.map(r => [r.feel, r]));
const reasonChoices = (f) => [f, ...shuffle(L.reasons.map(r => r.feel).filter(x => x !== f)).slice(0, 3)].map(x => `${RS[x].pic} ${RS[x].phrase}`);

// ---- 1. Fun Talk 1 ----
function stage1() {
  setObj("🏠 서쪽 <b>Olivia's House</b>의 <b>Mom</b>에게 가요", npcAt('mom')); mark('mom');
  NPC.mom.talk = async () => {
    mark('mom', false); NPC.mom.talk = null;
    await say('', '', '🙋 이 장면에서 나는 Olivia와 Ben의 엄마예요. 아이들의 기분을 살펴 주세요.', { btn: '좋아요!' });
    placeNPC('olivia', -26.6, -3.4, -Math.PI / 2); setFace('olivia', '😄');
    await say('Olivia', "Mom, I'm home!", '엄마, 다녀왔어요!');
    await say('Mom', 'You look happy.', '기분이 좋아 보이는구나.');
    await ask('나', '엄마가 되어 Olivia에게 기분이 좋은 이유를 물어보세요. 😄', '알맞은 질문을 고르세요.', whyChoices('happy'), { me: true, hint: 'Olivia의 얼굴 😄 = happy' });
    await say('Olivia', 'Because I won the soccer game. I scored the winning goal, too.', '왜냐하면 축구 경기에서 이겼거든요. 제가 결승골도 넣었어요.', { listen: true });
    await ask('', 'Why is Olivia happy?', 'Olivia가 기분이 좋은 이유는 무엇인가요?', ['She won the soccer game.', 'She made a new friend.', 'She has a math quiz.', 'Her friend moved to a new city.'], { hint: '🔊 다시 듣기를 눌러 보세요.' });
    await ask('나', '엄마가 되어 Olivia에게 알맞은 말을 해 주세요. 🏆', '축구 경기에서 이긴 Olivia에게!', ['Congratulations!', "Don't worry.", "That's too bad.", 'Go to bed early.'], { me: true });
    await say('Olivia', 'Thank you, Mom.', '고마워요, 엄마.');
    placeNPC('ben', -27, -0.6, -Math.PI / 2); setFace('ben', '😠');
    await say('', '', '😠 Olivia의 동생 Ben이 화난 얼굴로 방에서 나왔어요.', {});
    await ask('나', '엄마가 되어 Ben에게 속상한 이유를 물어보세요. 😠', '알맞은 질문을 고르세요.', whyChoices('upset', 'Ben'), { me: true, hint: 'Ben의 얼굴 😠 = upset' });
    await say('Ben', 'Because Max broke my airplane.', '왜냐하면 Max가 내 비행기를 망가뜨렸어요.', { listen: true });
    await ask('', "Who broke Ben's airplane?", 'Ben의 비행기를 망가뜨린 것은 누구인가요?', ['🐶 Max', '👧 Olivia', '👩 Mom', '👦 Ben'], { sayIt: false });
    await say('Mom', 'Airplane?', '비행기?');
    await say('Ben', 'Yes, I made it yesterday. It was my homework.', '네, 어제 만들었어요. 숙제였어요.');
    await say('Olivia', 'Let me see. I can fix it.', '어디 보자. 내가 고칠 수 있어.');
    toast('🔧 Olivia가 비행기를 고쳤어요!', 2200);
    await say('', '', '✈️ 비행기를 다 고쳤어요. 마당에 나가서 함께 날려 봐요!', { btn: '마당으로!' });
    closeDlg();
    placeNPC('olivia', YARD.x + 3.5, YARD.z - 2, Math.PI / 2); placeNPC('ben', YARD.x + 4.5, YARD.z + 1, Math.PI / 2); setFace('ben', null);
    setObj('🌬️ 집 앞 <b>마당</b>에서 <b>Ben</b>과 비행기를 날려요', npcAt('ben')); mark('ben');
    NPC.ben.talk = async () => {
      mark('ben', false); NPC.ben.talk = null;
      const bp = NPC.ben.g.position;
      await say('Olivia', "It's windy. The airplane is flying well.", '바람이 분다. 비행기가 잘 날아가.');
      const landed = new Promise(r => flyPlane({ x: bp.x, z: bp.z }, PLANE_LAND, 2.6, r));
      await say('Ben', "Oh, no. I can't see my airplane. Where is it?", '아, 안 돼. 내 비행기가 안 보여. 어디 있지?');
      setFace('ben', '😟');
      await landed;
      dogGo(PLANE_LAND.x - 1, PLANE_LAND.z - 1);
      await say('', '', '🐶 Max가 비행기가 날아간 쪽으로 달려가요! Max를 따라가 비행기를 찾아 Ben에게 가져다주세요.', { btn: '따라갈게!' });
      closeDlg(); s1plane();
    };
  };
}
function s1plane() {
  setObj('🐶 <b>Max</b>를 따라가 날아간 <b>비행기</b>를 찾아요', () => [PLANE_LAND.x, PLANE_LAND.z]);
  const g = itemModel('airplane'); g.scale.setScalar(1.8);
  addItem(g, PLANE_LAND.x, PLANE_LAND.z, (it) => {
    removeItem(it); setHeld('airplane', '✈️ airplane'); beep('get');
    toast('🐶 Max가 비행기를 찾았어요! Ben에게 가져다줘요.', 2600);
    dogGo(NPC.ben.g.position.x - 1.2, NPC.ben.g.position.z - 0.8);
    setObj('✈️ 비행기를 <b>Ben</b>에게 가져다줘요', npcAt('ben')); mark('ben');
    NPC.ben.talk = async () => {
      mark('ben', false); NPC.ben.talk = null; held = null; refreshHUD(); good(); setFace('ben', '😄');
      await say('Ben', 'Good job, Max.', '잘했어, Max.');
      puff(dog.position.x, 1.4, dog.position.z, 'Woof! 🐾');
      await ask('', 'Why was Ben upset?', 'Ben은 왜 속이 상했었나요? (Fun Talk 1 확인)', ['Because Max broke his airplane.', 'Because he won the soccer game.', 'Because he has a math quiz.', 'Because he stayed up late.']);
      await say('', '', '✈️ Fun Talk 1 완료! Olivia는 축구 경기에서 이겨서 행복(happy)했고, Ben은 Max가 비행기를 망가뜨려서 속상(upset)했어요.', { btn: '다음 미션 ▶' });
      nextStage();
    };
  }, { y: 0.6, r: 1.4, spin: 0.8 });
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  setObj('🧩 북서쪽 <b>Feelings Maze</b>의 <b>Ms. Lee</b>에게 가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await say('Ms. Lee', 'Welcome to the Feelings Maze! Listen carefully and find the right face.', '감정 미로에 온 걸 환영해요! 잘 듣고 알맞은 표정을 찾아요.');
    await say('', '', '미로 안 친구 5명에게 차례로 가서 대화를 잘 듣고, ① 알맞은 표정 스티커 ② 알맞은 이유 그림을 골라 미로를 통과하세요.', { btn: '시작!' });
    closeDlg(); stageState.ki = 0;
    L.kids.forEach(k => setFace(k.id, '❓'));
    s2kid();
  };
}
function s2kid() {
  const i = stageState.ki;
  if (i >= L.kids.length) { s2pt1(); return; }
  const k = L.kids[i];
  setObj(`🎧 미로 속 <b>${k.name}</b>의 대화를 들어요 (${i}/${L.kids.length})`, npcAt(k.id)); mark(k.id);
  NPC[k.id].talk = async () => {
    mark(k.id, false); NPC[k.id].talk = null;
    await say('나', why(k.feel), '친구에게 이유를 물어요. 잘 들어 보세요. (🔊 다시 듣기)', { listen: true, koAlways: true });
    await say(k.name, 'Because ' + k.because, '잘 듣고 표정 스티커를 골라요. (🔊 다시 듣기)', { listen: true, koAlways: true });
    await ask('', `🏷️ ${k.name}에게 붙일 표정 스티커는?`, '알맞은 표정을 고르세요.', feelChoices(k.feel), { sayIt: false, hint: '🔊 다시 듣기 · 👀 글 보기' });
    setFace(k.id, FE[k.feel].emoji);
    await ask('', `🧩 ${k.name}의 이유를 찾아 미로를 통과해요.`, `${FE[k.feel].emoji} 알맞은 이유 그림을 고르세요.`, reasonChoices(k.feel), { sayIt: false });
    speak(`${why(k.feel)} Because ${k.because}`, k.name);
    closeDlg(); toast(`✅ ${k.name}: ${FE[k.feel].emoji} ${k.feel} · ${RS[k.feel].pic}`, 2200);
    stageState.ki++; s2kid();
  };
}
function s2pt1() {
  placeNPC('teacher', GOAL_FLAG.x + 1, GOAL_FLAG.z + 1, -Math.PI / 2);
  setObj('🏁 미로 출구(<b>GOAL</b>)의 <b>Ms. Lee</b>에게 가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await say('Ms. Lee', "You did it! Now, let's play a game. Find the missing picture!", '해냈어요! 이제 사라진 그림 찾기 놀이를 해요!');
    const all = L.reasons.map(r => `${FE[r.feel].emoji}${r.pic}`).join('   ');
    for (const miss of shuffle(L.reasons).slice(0, 2)) {
      await say('Ms. Lee', '', `👀 그림 5개를 잘 기억하세요!\n${all}`, { btn: '기억했어요!' });
      const four = L.reasons.filter(r => r !== miss).map(r => `${FE[r.feel].emoji}${r.pic}`).join('   ');
      await ask('나', `${four}   ❔`, 'Play Together 1 · 사라진 감정 찾기: 사라진 그림에 알맞은 질문을 하세요.', whyChoices(miss.feel), { me: true });
      await ask('Ms. Lee', 'Because ' + miss.en + '.', '선생님의 대답을 듣고 따라 말해요. 알맞은 대답을 고르세요.', ['Because ' + miss.en + '.', ...shuffle(L.reasons.filter(r => r !== miss)).slice(0, 2).map(r => 'Because ' + r.en + '.')], { me: true, speakQ: true, listen: true });
    }
    await say('Ms. Lee', 'Wonderful! You found all the feelings.', '훌륭해요! 감정을 모두 찾았어요.');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  placeNPC('kai', DESK.x - 1.3, DESK.z + 0.6, Math.PI / 2); setFace('kai', '😟');
  setObj("🏡 북동쪽 <b>Kai's House</b>의 <b>Kai</b>에게 가요", npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await say('', '', '🙋 이 장면에서 나는 Kai의 형이에요. Kai가 걱정스러운 얼굴로 수학 공부를 하고 있어요.', { btn: '좋아요!' });
    await ask('나', 'Kai의 형이 되어 걱정하는 이유를 물어보세요. 😟', '알맞은 질문을 고르세요.', whyChoices('worried', 'Kai'), { me: true, hint: 'Kai의 얼굴 😟 = worried' });
    await say('Kai', 'Because I have a math quiz tomorrow. This problem is too hard.', '왜냐하면 내일 수학 퀴즈가 있거든. 이 문제가 너무 어려워.', { listen: true });
    await ask('', 'Why is Kai worried?', 'Kai는 왜 걱정하나요?', ['He has a math quiz tomorrow.', 'He won the soccer game.', 'His friend moved to a new city.']);
    await ask('나', 'Kai의 형이 되어 Kai를 위로해 주세요.', '걱정하는 동생에게 할 말은?', ["Don't worry. I'll help you.", 'Congratulations!', 'Good for you!', "Let's play soccer."], { me: true });
    await say('', '', '📚 책장에서 수학책을 가져와 Kai에게 주세요.', { btn: '가져올게!' });
    closeDlg();
    setObj('📚 책장에서 <b>수학책</b>을 가져와요', () => [SHELF.x, SHELF.z + 1.2]);
    const g = itemModel('mathbook'); g.scale.setScalar(1.8);
    addItem(g, SHELF.x, SHELF.z + 1.2, (it) => {
      removeItem(it); setHeld('mathbook', '📚 math book'); beep('get');
      setObj('📚 수학책을 <b>Kai</b>에게 줘요', npcAt('kai')); mark('kai');
      NPC.kai.talk = async () => {
        mark('kai', false); NPC.kai.talk = null; held = null; refreshHUD(); good(); setFace('kai', '😄');
        await say('', '', '✏️ 형이 어려운 수학 문제를 쉽게 풀었어요!', {});
        await say('Kai', "Wow, you're good at math.", '와, 형은 수학을 잘하는구나.');
        await say("Kai's brother", 'Thanks. My favorite subject is math.', '고마워. 내가 가장 좋아하는 과목은 수학이야.');
        await say('', '', '🌙 둘은 늦은 시간까지 함께 수학 문제를 풀었어요… 다음 날 학교에서!', { btn: '학교로 ▶' });
        closeDlg(); s3school();
      };
    }, { y: 1.0, r: 1.4, spin: 0.8 });
  };
}
function s3school() {
  placeNPC('kai', 26.4, -3.2, -Math.PI / 2); setFace('kai', '😴');
  placeNPC('nara', 24.6, -4.6, Math.PI / 2); placeNPC('joel', 24.8, -1.2, Math.PI / 2);
  setObj('🏫 동쪽 <b>Green School</b>의 <b>Nara</b>에게 가요', npcAt('nara')); mark('nara');
  NPC.nara.talk = async () => {
    mark('nara', false); NPC.nara.talk = null;
    await say('', '', '🙋 다음 날 학교 교실이에요. 이번에는 내가 Nara예요. Kai가 피곤해 보여요.', { btn: '좋아요!' });
    await say('Nara', "You don't look well. What's wrong?", '안색이 안 좋아 보여. 무슨 일 있니?');
    await say('Kai', "I'm very tired.", '나 너무 피곤해.');
    await ask('나', 'Nara가 되어 Kai에게 피곤한 이유를 물어보세요. 😴', '알맞은 질문을 고르세요.', whyChoices('tired'), { me: true, hint: 'Kai의 얼굴 😴 = tired' });
    await say('Kai', 'Because I stayed up late last night. I studied for the math quiz.', '왜냐하면 어젯밤 늦게까지 깨어 있었거든. 수학 퀴즈 공부를 했어.', { listen: true });
    await ask('', 'Why is Kai tired?', 'Kai가 피곤한 이유는 무엇인가요?', ['He stayed up late last night.', 'He won the soccer game.', 'His sister broke his robot.']);
    await say('Joel', 'Math quiz? The math quiz is tomorrow.', '수학 퀴즈? 수학 퀴즈는 내일이야.');
    await say('Kai', 'Really?', '정말?');
    await say('Joel', 'Yes. We have the science quiz today.', '응. 오늘은 과학 퀴즈가 있어.');
    setFace('kai', '😟');
    await say('Kai', 'Oh, no!', '아, 안 돼!');
    await ask('', 'What quiz do they have today?', '오늘은 무슨 퀴즈가 있나요? (칠판을 보세요)', ['the science quiz', 'the math quiz', 'the English quiz'], { sayIt: false });
    closeDlg(); s3pt2();
  };
}
function s3pt2() {
  setObj('🙂 <b>Joel</b>과 얼굴 표정 놀이를 해요', npcAt('joel')); mark('joel');
  NPC.joel.talk = async () => {
    mark('joel', false); NPC.joel.talk = null;
    await say('Joel', "Let's play a game! I'll make a face. Ask me why.", '놀이하자! 내가 표정을 지을게. 왜 그런지 물어봐.');
    for (const f of shuffle(L.faces).slice(0, 4)) {
      setFace('joel', FE[f.feel].emoji);
      await ask('Joel', FE[f.feel].emoji, 'Play Together 2 · 얼굴 표정 짓기: Joel의 표정을 보고 알맞은 질문을 고르세요.', whyChoices(f.feel), { me: true });
      await say('Joel', f.because, '잘 들어 보세요. (🔊 다시 듣기)', { listen: true, koAlways: true });
      const cheer = f.feel === 'happy';
      await ask('나', cheer ? '기쁜 Joel에게 알맞은 말을 해 주세요.' : 'Joel을 위로해 주세요.', 'Read and Talk · 알맞은 말을 고르세요.', cheer ? ['Good for you!', "Don't worry.", "That's too bad."] : ["Don't worry.", 'Congratulations!', 'Good for you!'], { me: true });
    }
    setFace('joel', '😄');
    await say('Joel', 'That was fun! Thank you.', '재미있었어! 고마워.');
    nextStage();
  };
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('olivia', 0, 11, Math.PI);
  setObj('🧱 마을 가운데의 <b>Olivia</b>에게 가요', npcAt('olivia')); mark('olivia');
  NPC.olivia.talk = async () => {
    mark('olivia', false); NPC.olivia.talk = null;
    await say('Olivia', "Let's read and match first!", '먼저 읽고 짝을 맞춰 봐요!');
    await ask('Olivia', 'Why are you tired?', 'Read and Play · 감정 꽃밭: 알맞은 대답을 고르세요.', ['Because I stayed up late last night.', 'Because I won the soccer game.', 'Because my sister broke my cup.'], { speakQ: true });
    await ask('Olivia', 'Why are you worried?', 'Read and Play · 감정 꽃밭: 알맞은 대답을 고르세요.', ['Because I have a math quiz.', 'Because I won the soccer game.', 'Because I made a new friend.'], { speakQ: true });
    await say('Olivia', "Now, let's make sentences with word blocks!", '이제 단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '마을 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['sad?', 'tired?', 'happy?', 'my', 'game.', 'quiz.', 'sister', 'won', 'Because', 'robot.', 'help', 'Why'].filter(w => !words.includes(w));
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
  await say('Olivia', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. What Color Is Your World? (Reading) ----
const OX = ['⭕ O (맞아요)', '❌ X (틀려요)'];
function poetAt(k) { placeNPC('poet', COLORS[k].x, -34, 0); }
function stage5() {
  poetAt('blue');
  setObj('🎨 북쪽 <b>Color Garden</b>의 <b>Blue</b> 정원에 있는 <b>Poet</b>에게 가요', npcAt('poet')); mark('poet');
  NPC.poet.talk = async () => {
    mark('poet', false); NPC.poet.talk = null;
    await say('Poet', 'Hi! I wrote a poem about feelings. What Color Is Your World?', '안녕! 나는 감정에 관한 시를 썼어. 「너의 세상은 무슨 색이니?」');
    await say('', '', 'Before You Read · 그림을 보고 알맞은 어구를 골라요.', { btn: '시작' });
    await ask('', '🚚🏙️  ______', '그림에 알맞은 어구', ['move to a new city', 'go to a new school', 'make a new friend'], { noShuffle: false });
    await ask('', '🏫🎒  ______', '그림에 알맞은 어구', ['go to a new school', 'move to a new city', 'make a new friend']);
    await ask('', '🤝🙂  ______', '그림에 알맞은 어구', ['make a new friend', 'go to a new school', 'move to a new city']);
    setFace('poet', '😢');
    await readLines(L.reading.blue);
    await ask('', 'I will miss my best friend, Judy.', '글의 내용과 맞으면 O, 틀리면 X', OX, { noShuffle: true, sayIt: false });
    closeDlg(); poetAt('gray'); setFace('poet', null);
    setObj('🩶 가운데 <b>Gray</b> 정원의 <b>Poet</b>에게 가요', npcAt('poet')); mark('poet');
    NPC.poet.talk = async () => {
      mark('poet', false); NPC.poet.talk = null; setFace('poet', '😟');
      await readLines(L.reading.gray);
      await ask('', 'I will go to a new school. I will meet old friends.', '글의 내용과 맞으면 O, 틀리면 X', OX, { right: OX[1], noShuffle: true, sayIt: false, hint: 'I will meet ______ people.' });
      closeDlg(); poetAt('yellow'); setFace('poet', null);
      setObj('💛 오른쪽 <b>Yellow</b> 정원의 <b>Poet</b>에게 가요', npcAt('poet')); mark('poet');
      NPC.poet.talk = async () => {
        mark('poet', false); NPC.poet.talk = null; setFace('poet', '😄');
        await readLines(L.reading.yellow);
        await ask('', "Kate is in my class.", '글의 내용과 맞으면 O, 틀리면 X', OX, { noShuffle: true, sayIt: false });
        await say('', '', 'After You Read A · 색깔이 나타내는 감정을 골라요.', { btn: '시작' });
        await ask('', 'Blue 💙', '파랑은 어떤 감정일까요?', ['sad', 'happy', 'worried']);
        await ask('', 'Gray 🩶', '회색은 어떤 감정일까요?', ['worried', 'happy', 'sad']);
        await ask('', 'Yellow 💛', '노랑은 어떤 감정일까요?', ['happy', 'sad', 'worried']);
        await say('', '', 'After You Read B · 글의 내용에 맞게 대화를 완성해요.', { btn: '시작' });
        await ask('', 'Why are you sad? – Because I will ______ to a new city.', '빈칸에 알맞은 말', ['move', 'go', 'made'], { sayIt: false });
        await ask('', 'Why are you worried? – Because I will go to a new ______.', '빈칸에 알맞은 말', ['school', 'city', 'friend'], { sayIt: false });
        await ask('', 'Why are you happy? – Because I ______ a new friend, Kate.', '빈칸에 알맞은 말', ['made', 'go', 'move'], { sayIt: false });
        speak('Because I made a new friend, Kate.', 'Poet');
        await say('Poet', 'What color is your world today?', '오늘 너의 세상은 무슨 색이니? 짝과 이야기해 보세요.');
        nextStage();
      };
    };
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("✏️ 남서쪽 <b>Feelings Board</b>의 <b>Alex</b>에게 가요", npcAt('alex')); mark('alex');
  NPC.alex.talk = async () => {
    mark('alex', false);
    await say('Alex', 'Read my online posts!', '내 온라인 글을 읽어 줘!');
    for (const p of L.writeSample) {
      setFace('alex', FE[p.feel].emoji);
      for (const l of p.lines) await say('Alex', l, '');
      await say('Friend', p.comment, `💬 친구의 댓글 · ${p.tags}`);
    }
    await ask('', 'Why is Alex upset?', 'Alex가 속상한 이유는?', ['Because his sister broke his bike.', 'Because he won the soccer game.', 'Because he has a math quiz.']);
    await ask('', 'Alex won the soccer game. What did the friend say?', '친구는 어떤 댓글을 달았나요?', ['Good for you!', "Don't worry.", "That's too bad."]);
    await say('Alex', 'Now, write your own post about today!', '이제 오늘 나의 기분과 그 이유를 글로 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  $('#wF').innerHTML = L.feelings.map(x => `<option value="${x.id}">${x.emoji} ${x.id} (${x.ko})</option>`).join('');
  $('#wR').innerHTML = L.writeReasons.map((r, i) => `<option value="${i}">${r[0]} (${r[1]})</option>`).join('');
  $('#wC').innerHTML = L.writeComments.map((c, i) => `<option value="${i}">${c[0]} (${c[1]})</option>`).join('');
  $('#wF').value = 'happy'; $('#wR').value = 0; $('#wC').value = 0;
  if (S.card) { $('#wMe').value = S.card.me || ''; $('#wF').value = S.card.f; $('#wR').value = S.card.r; $('#wC').value = S.card.c; }
  const upd = () => { $('#wPreview').innerHTML = postHTML(postData()); };
  f.oninput = upd; f.onchange = upd; upd();
  $('#wRead').onclick = () => speak(postText(postData()).slice(0, 3).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = postData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.me)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    const happy = c.f === 'happy', r = L.writeReasons[c.r];
    if (!!r[4] !== happy) { toast(happy ? '행복한 기분에 어울리는 이유를 골라 주세요 😄' : '이 기분에 어울리는 이유를 골라 주세요 (기쁜 일은 happy와 함께!)'); return; }
    if (!!L.writeComments[c.c][2] !== happy) { toast(happy ? '기쁜 글에는 Good for you! 같은 축하 댓글이 어울려요.' : "속상하거나 걱정되는 글에는 Don't worry. 같은 위로 댓글이 어울려요."); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(postText(c).slice(0, 3).join(' '), '나');
    await say('Alex', 'Great post! Thank you for sharing.', '멋진 글이야! 나눠 줘서 고마워.');
    nextStage(); showEnd();
  };
}
function postData() { return { me: $('#wMe').value.trim(), f: $('#wF').value, r: +$('#wR').value, c: +$('#wC').value }; }
function postText(c) {
  const r = L.writeReasons[c.r] || L.writeReasons[0], cm = L.writeComments[c.c] || L.writeComments[0];
  return [`Today, I'm ${c.f}. Why?`, `Because ${r[0]}.`, r[2], `#${c.f} #${r[3]}`, cm[0]];
}
function postHTML(c) {
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const t = postText(c), fe = FE[c.f] || L.feelings[0];
  return '<div class="cardPrev">' + `<div><b style="color:var(--accent)">${fe.emoji} ${esc(c.me || '____')}</b></div>` +
    t.slice(0, 3).map(l => `<div>${esc(l)}</div>`).join('') + `<div style="color:#1c7ed6">${esc(t[3])}</div>` +
    `<div style="font-size:18px;margin-top:6px">💬 <b>Friend</b> ${esc(t[4])}</div></div>`;
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>br 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · br 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? postHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? (S.card.me + ': ' + postText(S.card).join(' ')) : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 br 코인 ----
const TH_SPOTS = [[-38, 14], [40, -16], [-42, -2], [32, 41], [14, -19], [-17, 40]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('br', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('br', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Brian');
      toast(`🪙 br 코인: <b>${w.replace('br', '<u>br</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 br 코인을 모두 모았어요! Why are you upset? – Because my brother broke my brown cup.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Brian', "Hi! I'm Brian. Why am I upset? Because my brother broke my brown cup.", '안녕! 나는 Brian이야. 왜 속상하냐고? 내 남동생이 내 갈색 컵을 깼거든.');
  await say('Brian', 'Listen: brother, broke, brown. br, br, br!', 'Sounds and Letters · br 소리를 들어 보세요.');
  await say('', '', `🪙 마을 구석구석에 숨은 br 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
