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
const SAVE_KEY = 'english3d_l6_v1';
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
  Clerk: [1, 1.05], Rani: [1, 1.4], Nara: [1, 1.3], Olivia: [1, 1.3], Hajun: [0, 1.15], Minsu: [0, 1.2], Yuri: [1, 1.4],
  'Ms. Han': [1, 1.0], Amy: [1, 1.5], Ben: [0, 1.2], Sora: [1, 1.4], Tom: [0, 1.15], Lily: [1, 1.35], Jun: [0, 1.1],
  Kai: [0, 1.1], Leilani: [1, 1.2], Malia: [1, 1.3], Joel: [0, 1.15], Staff: [0, 0.85], Ella: [1, 1.2], Ranger: [0, 0.85],
  Diego: [0, 1.1], Owen: [0, 1.2], Girl: [1, 1.4], Boy: [0, 1.15], '나': [0, 1.0]
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

// ---------------- 세계 만들기 (Lesson 6 · Culture Village) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x9ccc65)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xe2d3b5)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xe2d3b5)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const FEN = 46;
// 돌담 울타리
for (const [w, d, x, z] of [[2 * FEN, 0.6, 0, -FEN], [0.6, 2 * FEN, -FEN, 0], [0.6, 2 * FEN, FEN, 0], [FEN - 4, 0.6, -(FEN + 4) / 2, FEN], [FEN - 4, 0.6, (FEN + 4) / 2, FEN]])
  solid(w, 1.3, d, 0xb0a597, x, 0.65, z);
// 솟을대문
solid(1, 4.4, 1, 0x8d3b2a, -4, 2.2, FEN); solid(1, 4.4, 1, 0x8d3b2a, 4, 2.2, FEN);
box(10, 0.5, 2, 0x37474f, 0, 4.7, FEN); box(9, 0.3, 1.2, 0x8d3b2a, 0, 4.35, FEN);
const gateSign = textPlane('Culture Village', 1.1, { fs: 64, bg: '#8d3b2a', fg: '#fff' }); gateSign.position.set(0, 3.5, FEN - 0.6); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1, kind = 0) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x6d4c41, x, s, z);
  const c = ball(1.5 * s, [0x43a047, 0xff8a65, 0x66bb6a][kind], x, 3 * s, z); c.scale.y = 1.1;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -43, 1, i % 16 === 0 ? 1 : 0); tree(-43, i, 1.1, i % 16 === 8 ? 1 : 0); tree(43, i + 3, 1, i % 16 === 0 ? 1 : 2); }
for (const x of [-38, -14, 14, 38]) tree(x, 42, 0.9, 1);
for (const [x, z] of [[-16, 11], [16, 10], [-15, 34], [15, 35]]) tree(x, z, 1.2, 1);
function hanokRoof(x, z, w, d, y, c = 0x37474f) {
  box(w, 0.35, d, c, x, y, z);
  const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.62, 2.4, 4), mat(c)); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); r.position.set(x, y + 1.35, z); scene.add(r);
  for (const sx of [-1, 1]) { const e = box(0.4, 0.4, d + 0.6, c, x + sx * (w / 2 + 0.1), y + 0.2, z); e.rotation.z = sx * -0.35; }
}
function ceiling(x, z, w, d, y, c) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: c })); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); scene.add(m); }
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-6, 8); bench(6, 8);
// 장승
for (const sx of [-6.5, 6.5]) { cyl(0.35, 0.4, 3, 0x8d6e63, sx, 1.5, 38); ball(0.45, 0x8d6e63, sx, 3.1, 38); box(0.5, 0.12, 0.1, 0x222222, sx, 3.15, 38.42); box(0.6, 0.1, 0.1, 0xc62828, sx, 2.8, 38.4); block(sx - 0.4, 37.6, sx + 0.4, 38.4); }

// ---------- 남쪽 가운데: 약과 가게 (Fun Talk 1 장면 1) ----------
const STALL = { x: -9, z: 22 };
solid(6, 1.1, 1, 0xa1887f, STALL.x, 0.55, STALL.z - 0.5);
box(6.2, 0.08, 1.1, 0xf5f5f5, STALL.x, 1.12, STALL.z - 0.5);
for (const dx of [-2.8, 2.8]) cyl(0.08, 0.08, 3, 0x5d4037, STALL.x + dx, 1.5, STALL.z - 0.1);
{ const a = box(6.6, 0.12, 2.4, 0xc62828, STALL.x, 3.05, STALL.z - 0.9); a.rotation.x = -0.2; }
{ const s = textPlane('Yakgwa 🍪', 0.7, { fs: 60, bg: '#c62828', fg: '#fff' }); s.position.set(STALL.x, 3.6, STALL.z + 0.4); }
function yakgwaModel(s = 1) {
  const g = new THREE.Group();
  const y = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.16 * s, 0.07 * s, 8), mat(0x9c5a1a)); y.position.y = 0.035 * s; g.add(y);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 0.075 * s, 8), mat(0xc77d2e)); t.position.y = 0.04 * s; g.add(t);
  return g;
}
for (let i = 0; i < 9; i++) { const y = yakgwaModel(); y.position.set(STALL.x - 2.2 + (i % 3) * 0.4, 1.17, STALL.z - 0.7 + Math.floor(i / 3) * 0.3); scene.add(y); }
cyl(0.5, 0.5, 0.05, 0xffffff, STALL.x - 1.8, 1.17, STALL.z - 0.5, scene, 18);

// ---------- 남쪽 가운데: 제기차기 마당 (Fun Talk 1 장면 2) ----------
const JEGI = { x: 10, z: 22 };
{ const f = new THREE.Mesh(new THREE.CircleGeometry(4.5, 28), mat(0xe8d5a6)); f.rotation.x = -Math.PI / 2; f.position.set(JEGI.x, 0.02, JEGI.z); scene.add(f);
  const s = textPlane('Jegichagi 🪶', 0.6, { fs: 58, bg: '#ffffff', fg: '#2e7d32', border: '#2e7d32' }); s.position.set(JEGI.x, 2.8, JEGI.z - 4.8); cyl(0.06, 0.06, 2.6, 0x666666, JEGI.x - 1.6, 1.3, JEGI.z - 4.8); cyl(0.06, 0.06, 2.6, 0x666666, JEGI.x + 1.6, 1.3, JEGI.z - 4.8); }
const BASKET = { x: 15.5, z: 26 };
cyl(0.5, 0.4, 0.5, 0xbc8f5a, BASKET.x, 0.25, BASKET.z); block(BASKET.x - 0.5, BASKET.z - 0.5, BASKET.x + 0.5, BASKET.z + 0.5);
function jegiModel(s = 1) {
  const g = new THREE.Group();
  cyl(0.09 * s, 0.11 * s, 0.06 * s, 0xffd54f, 0, 0.03 * s, 0, g);
  ['#ef5350', '#42a5f5', '#66bb6a', '#ffffff'].forEach((c, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.32 * s, 6), mat(parseInt(c.slice(1), 16))); f.position.set(Math.sin(i * 1.57) * 0.04 * s, 0.2 * s, Math.cos(i * 1.57) * 0.04 * s); f.rotation.x = Math.PI; g.add(f); });
  return g;
}
{ const j = jegiModel(1.2); j.position.set(BASKET.x, 0.55, BASKET.z); scene.add(j); }
const kickJegi = []; // 공중에서 오르내리는 제기

// ---------- 서쪽: Traditional Culture Hall (한옥 전시관) ----------
const CULT_POS = { x: -27, z: -2 };
solid(0.4, 4, 20, 0xf3e5c8, -34, 2, -2);
solid(14, 4, 0.4, 0xf3e5c8, -27, 2, -12); solid(14, 4, 0.4, 0xf3e5c8, -27, 2, 8);
for (const z of [-11.8, -6, 2, 7.8]) solid(0.5, 4, 0.5, 0x8d3b2a, -20.2, 2, z);
hanokRoof(-27, -2, 15.5, 21.5, 4.2); ceiling(-27, -2, 14, 20, 4.0, 0xc8a27a);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xd7b98e)); fl.rotation.x = -Math.PI / 2; fl.position.set(-27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('Traditional Culture Hall', 0.75, { fs: 60, bg: '#8d3b2a', fg: '#fff' }); s.position.set(-19.85, 3.6, -2); s.rotation.y = Math.PI / 2; }
// 복주머니 6개 (Listen and Do)
const POCKET_Z = [-9, -6, -3, 0, 3, 6];
function pocketModel(c) {
  const g = new THREE.Group();
  const b = ball(0.45, c, 0, 0.45, 0, g); b.scale.set(1, 0.9, 0.8);
  const n = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.35, 10), mat(c)); n.position.y = 0.95; n.rotation.x = Math.PI; g.add(n);
  box(0.5, 0.06, 0.06, 0xffd54f, 0, 0.8, 0, g);
  return g;
}
const pocketSlots = [];
POCKET_Z.forEach((z, i) => {
  solid(1, 1, 1, 0x6d4c41, -32.6, 0.5, z);
  const p = pocketModel([0xe53935, 0x1e88e5, 0x8e24aa, 0x43a047, 0xfb8c00, 0xd81b60][i]); p.position.set(-32.6, 1, z); scene.add(p);
  const s = textPlane(String(i + 1), 0.5, { fs: 64, bg: '#ffffff', fg: '#8d3b2a', border: '#8d3b2a', pad: 14 }); s.position.set(-33.75, 2.7, z); s.rotation.y = Math.PI / 2;
  pocketSlots.push({ x: -32.6, z, sticker: null });
});
{ const s = textPlane('Listen and Do · 복주머니 1~6', 0.4, { fs: 46, bg: '#fff8e1', fg: '#8d3b2a' }); s.position.set(-27, 3.3, -11.75); }
// 민화 액자·북 장식
{ const p = textPlane('🐯🐦', 1.0, { fs: 100, bg: '#fff3e0', border: '#8d3b2a' }); p.position.set(-24, 2.2, 7.75); p.rotation.y = Math.PI; }
{ const d = cyl(0.6, 0.6, 0.7, 0xc62828, -23, 1.3, -10.6, scene, 18); d.rotation.x = Math.PI / 2; cyl(0.05, 0.05, 1.3, 0x5d4037, -23.8, 0.65, -10.6); cyl(0.05, 0.05, 1.3, 0x5d4037, -22.2, 0.65, -10.6); }

// ---------- 동쪽: World Culture Center (세계 문화 체험관) ----------
const WCC = { x: 27, z: -2 };
solid(0.4, 4.5, 20, 0xe3f2fd, 34, 2.25, -2);
solid(14, 4.5, 0.4, 0xe3f2fd, 27, 2.25, -12); solid(14, 4.5, 0.4, 0xe3f2fd, 27, 2.25, 8);
solid(0.5, 4.5, 0.5, 0x1565c0, 20.2, 2.25, -11.8); solid(0.5, 4.5, 0.5, 0x1565c0, 20.2, 2.25, 7.8);
box(14.6, 0.4, 20.6, 0x90caf9, 27, 4.7, -2); ceiling(27, -2, 14, 20, 4.48, 0xe3f2fd);
{ const g = ball(1.6, 0x42a5f5, 27, 5.9, -2); g.scale.y = 0.6; }
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xfafafa)); fl.rotation.x = -Math.PI / 2; fl.position.set(27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('World Culture Center 🌏', 0.75, { fs: 60, bg: '#1565c0', fg: '#fff' }); s.position.set(19.85, 3.6, -2); s.rotation.y = -Math.PI / 2; }
// 훌라 무대
const HULA = { x: 30, z: -7.5 };
box(6, 0.3, 5, 0x8d6e63, HULA.x, 0.15, HULA.z);
{ const s = textPlane('Hula · Hawaii 🌺', 0.55, { fs: 54, bg: '#ff7043', fg: '#fff' }); s.position.set(33.75, 3.95, HULA.z); s.rotation.y = -Math.PI / 2; }
for (let i = 0; i < 6; i++) { const p = cyl(0.12, 0.15, 3.2, 0x8d6e63, 33.2, 1.6, HULA.z - 2.5 + i); const l = ball(0.5, 0x43a047, 33.2, 3.3, HULA.z - 2.5 + i); l.scale.y = 0.4; }
// 젬베 코너
const DJ = { x: 30, z: 4 };
{ const s = textPlane('Djembe · Africa 🥁', 0.55, { fs: 54, bg: '#6d4c41', fg: '#fff' }); s.position.set(33.75, 3, DJ.z); s.rotation.y = -Math.PI / 2; }
function djembeModel(s = 1) {
  const g = new THREE.Group();
  cyl(0.2 * s, 0.12 * s, 0.35 * s, 0x8d6e63, 0, 0.175 * s, 0, g);
  cyl(0.28 * s, 0.14 * s, 0.4 * s, 0xa1887f, 0, 0.55 * s, 0, g);
  cyl(0.29 * s, 0.29 * s, 0.03 * s, 0xf5deb3, 0, 0.76 * s, 0, g, 18);
  for (let i = 0; i < 6; i++) { const r = box(0.02 * s, 0.6 * s, 0.02 * s, 0xc62828, Math.sin(i) * 0.22 * s, 0.45 * s, Math.cos(i) * 0.22 * s, g); r.rotation.z = Math.sin(i) * 0.25; }
  return g;
}
solid(2.6, 0.8, 1.2, 0xd7ccc8, 32.5, 0.4, DJ.z);
for (const dx of [-0.8, 0.8]) { const d = djembeModel(1.1); d.position.set(32.5 + dx, 0.8, DJ.z); scene.add(d); }
const DJ_SHELF = { x: 23.5, z: 6.6 };
box(2, 0.6, 0.8, 0xd7ccc8, DJ_SHELF.x, 0.3, DJ_SHELF.z + 0.3);

// ---------- 남동: 투호 마당 (Read and Talk · Play Together 2) ----------
const TUHO = { x: 26, z: 30 };
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat(0xe8d5a6)); f.rotation.x = -Math.PI / 2; f.position.set(TUHO.x, 0.02, TUHO.z); scene.add(f);
  const s = textPlane('Tuho Yard 🏹', 0.7, { fs: 60, bg: '#2e7d32', fg: '#fff' }); s.position.set(TUHO.x, 3.2, TUHO.z - 6.2); cyl(0.06, 0.06, 3, 0x666666, TUHO.x - 2.3, 1.5, TUHO.z - 6.2); cyl(0.06, 0.06, 3, 0x666666, TUHO.x + 2.3, 1.5, TUHO.z - 6.2); }
const POT = { x: 26, z: 28 };
cyl(0.35, 0.45, 0.9, 0x1565c0, POT.x, 0.45, POT.z, scene, 16); cyl(0.25, 0.35, 0.2, 0x1565c0, POT.x, 1.0, POT.z, scene, 16);
block(POT.x - 0.5, POT.z - 0.5, POT.x + 0.5, POT.z + 0.5);
for (let i = 0; i < 2; i++) { const a = cyl(0.02, 0.02, 1.2, 0x8d6e63, POT.x + (i - 0.5) * 0.12, 1.4, POT.z); a.rotation.z = (i - 0.5) * 0.3; }
const ARROWS = { x: 31.5, z: 33.5 };
cyl(0.3, 0.3, 0.6, 0x6d4c41, ARROWS.x, 0.3, ARROWS.z); block(ARROWS.x - 0.4, ARROWS.z - 0.4, ARROWS.x + 0.4, ARROWS.z + 0.4);
for (let i = 0; i < 4; i++) { const a = cyl(0.02, 0.02, 1.1, 0x8d6e63, ARROWS.x + (i - 1.5) * 0.08, 0.9, ARROWS.z); a.rotation.z = (i - 1.5) * 0.12; }

// ---------- 북쪽: All About Kiwis 정원 ----------
const KIWI = { x: 0, z: -34 };
box(40, 0.3, 14, 0xdcedc8, 0, 0.15, -34);
solid(40, 4, 0.4, 0xc5e1a5, 0, 2, -41);
{ const s = textPlane('All About Kiwis 🥝', 0.95, { fs: 62, bg: '#558b2f', fg: '#fff' }); s.position.set(0, 5, -40.7); }
// 왼쪽: 키위 덩굴 (과일)
const VINE = { x: -11, z: -37 };
for (const [dx, dz] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) { cyl(0.1, 0.1, 2.6, 0x6d4c41, VINE.x + dx, 1.3, VINE.z + dz); block(VINE.x + dx - 0.2, VINE.z + dz - 0.2, VINE.x + dx + 0.2, VINE.z + dz + 0.2); }
box(6.6, 0.2, 4.6, 0x7cb342, VINE.x, 2.7, VINE.z);
for (let i = 0; i < 16; i++) { const k = ball(0.13, 0x8d6e63, VINE.x - 2.6 + (i % 8) * 0.75, 2.45, VINE.z - 1.3 + Math.floor(i / 8) * 2.4); k.scale.y = 1.3; }
{ const g = new THREE.Group(); ball(0.5, 0x8d6e63, 0, 0, 0, g).scale.set(1, 1.25, 1); const c = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), mat(0x9ccc65)); c.position.z = 0.51; g.add(c); ball(0.12, 0xf1f8e9, 0, 0, 0.52, g).scale.z = 0.2;
  for (let i = 0; i < 10; i++) { const s = ball(0.025, 0x111111, Math.sin(i * 0.63) * 0.22, Math.cos(i * 0.63) * 0.22, 0.52, g); s.scale.z = 0.3; }
  g.position.set(VINE.x - 4.6, 1.6, VINE.z + 2); scene.add(g); }
{ const s = textPlane('Kiwi Fruit · from China', 0.45, { fs: 48, bg: '#ffffff', fg: '#558b2f' }); s.position.set(VINE.x, 3.5, -40.6); }
// 오른쪽: 키위 새 울타리
const PEN = { x: 11, z: -36 };
for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; if (i === 5) continue; cyl(0.06, 0.06, 0.8, 0x8d6e63, PEN.x + Math.cos(a) * 3.6, 0.4, PEN.z + Math.sin(a) * 3); }
{ const f = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), mat(0xa5d6a7)); f.rotation.x = -Math.PI / 2; f.scale.y = 0.85; f.position.set(PEN.x, 0.31, PEN.z); scene.add(f); }
block(PEN.x - 3.6, PEN.z - 3, PEN.x + 3.6, PEN.z + 3);
{ const s = textPlane('Kiwi Bird · New Zealand', 0.45, { fs: 48, bg: '#ffffff', fg: '#5d4037' }); s.position.set(PEN.x, 3.3, -40.6); }
function kiwiBird() {
  const g = new THREE.Group();
  const b = ball(0.35, 0x8d6e63, 0, 0.45, 0, g); b.scale.set(1, 0.85, 1.2);
  ball(0.17, 0x8d6e63, 0, 0.62, 0.36, g);
  const beak = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.5, 6), mat(0xe0c080)); beak.rotation.x = Math.PI / 2 + 0.5; beak.position.set(0, 0.52, 0.66); g.add(beak);
  ball(0.025, 0x111111, -0.08, 0.67, 0.48, g); ball(0.025, 0x111111, 0.08, 0.67, 0.48, g);
  for (const sx of [-0.12, 0.12]) cyl(0.025, 0.025, 0.25, 0xe0c080, sx, 0.13, 0, g);
  return g;
}
const birds = [0, 1, 2].map(i => { const k = kiwiBird(); k.userData.a = i * 2.1; scene.add(k); return k; });

// ---------- 남서: Let's Write 전시 책상 (Diego) ----------
const WRITE = { x: -26, z: 30 };
box(16, 0.4, 12, 0xfff3e0, WRITE.x, 0.2, WRITE.z);
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) solid(0.6, 5, 0.6, 0x8d3b2a, WRITE.x + dx, 2.5, WRITE.z + dz);
box(17, 0.4, 13, 0x37474f, WRITE.x, 5.2, WRITE.z); ceiling(WRITE.x, WRITE.z, 17, 13, 4.98, 0xffe0b2);
{ const s = textPlane("Let's Write · Culture Show", 0.85, { fs: 62, bg: '#e65100', fg: '#fff' }); s.position.set(WRITE.x + 8.6, 4.4, WRITE.z); s.rotation.y = Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x - 1, 0.85, WRITE.z);
function chulloModel(s = 1) {
  const g = new THREE.Group();
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0xe53935)); g.add(h);
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.29 * s, 0.025 * s, 6, 20), mat([0xffd54f, 0x1e88e5, 0xffffff][i])); b.rotation.x = Math.PI / 2; b.position.y = (0.05 + i * 0.07) * s; g.add(b); }
  for (const sx of [-1, 1]) { const e = box(0.1 * s, 0.4 * s, 0.14 * s, 0xe53935, sx * 0.25 * s, -0.18 * s, 0, g); cyl(0.01 * s, 0.01 * s, 0.25 * s, 0xffd54f, sx * 0.25 * s, -0.5 * s, 0, g); }
  ball(0.06 * s, 0xffd54f, 0, 0.33 * s, 0, g);
  return g;
}
{ const c = chulloModel(1.1); c.position.set(WRITE.x - 1, 1.75, WRITE.z); scene.add(c); }
solid(0.4, 3.4, 10, 0xf8f9fa, WRITE.x - 7.6, 2, WRITE.z);
['🍪', '🎭', '🏹'].forEach((e, i) => { const p = textPlane(e, 1.4, { fs: 110, bg: '#ffffff', border: '#e65100' }); p.position.set(WRITE.x - 7.35, 2.4, WRITE.z - 3 + i * 3); p.rotation.y = Math.PI / 2; });

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'yakgwa') { const y = yakgwaModel(1.4); g.add(y); }
  else if (id === 'jegi') { g.add(jegiModel(1.2)); }
  else if (id === 'djembe') { g.add(djembeModel(0.6)); }
  else if (id === 'arrow') { const a = cyl(0.02, 0.02, 0.9, 0x8d6e63, 0, 0.2, 0, g); a.rotation.z = 1.2; const t = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), mat(0x9e9e9e)); t.position.set(-0.42, 0.37, 0); t.rotation.z = 1.2 + Math.PI / 2; g.add(t); }
  else if (id === 'card') { box(0.5, 0.7, 0.04, 0xfff8e1, 0, 0.35, 0, g); }
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
const dancers = []; // { id, k } — 춤추거나 북 치는 사람(위아래로 흔들기)
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  for (const f of fallers) { f.userData.life -= dt; f.position.y += dt * 0.8; f.material.opacity = Math.max(0, f.userData.life); }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { scene.remove(f); return false; } return true; });
  birds.forEach((b, i) => { const a = t * 0.5 + b.userData.a; b.position.set(PEN.x + Math.cos(a) * 2.1, 0.3, PEN.z + Math.sin(a) * 1.7); b.rotation.y = -a; });
  for (const d of dancers) { const n = NPC[d.id]; if (!n) continue; n.g.position.y = Math.abs(Math.sin(t * (d.k || 5))) * 0.15; if (d.sway) n.g.rotation.z = Math.sin(t * 3) * 0.12; }
  for (const j of kickJegi) j.position.y = j.userData.y0 + Math.abs(Math.sin(t * 3 + j.userData.p)) * 1.4;
}
function puff(x, y, z, text) {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#8d3b2a', border: '#8d3b2a' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 1.6; scene.add(s); fallers.push(s);
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#e2d3b5'); R(0, -2, 52, 6, '#e2d3b5');
  R(-27, -2, 14, 20, '#8d3b2a', '전통문화관'); R(27, -2, 14, 20, '#1565c0', '세계 문화관');
  R(0, -36, 40, 9, '#558b2f', '키위 정원'); R(WRITE.x, WRITE.z, 16, 12, '#e65100', '글쓰기');
  R(TUHO.x, TUHO.z, 16, 12, '#2e7d32', '투호 마당'); R(STALL.x, STALL.z, 6, 3, '#c62828', '약과'); R(JEGI.x, JEGI.z, 8, 8, '#a1887f', '제기차기');
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
const CU = Object.fromEntries(L.cultures.map(c => [c.id, c]));
function addNPC(id, o, x, z, face = 0) {
  const g = makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '' };
  return NPC[id];
}
// 집 위치 [x, z, 방향]
const HOME = {
  clerk: [STALL.x + 0.6, STALL.z - 1.6, 0], rani: [STALL.x - 0.8, STALL.z + 1.6, Math.PI], nara: [STALL.x + 1.2, STALL.z + 1.6, Math.PI],
  olivia: [JEGI.x - 3.4, JEGI.z + 2.6, Math.PI / 2], hajun: [JEGI.x - 3.4, JEGI.z + 0.6, Math.PI / 2],
  kicker1: [JEGI.x + 1, JEGI.z - 1.2, -Math.PI / 2], kicker2: [JEGI.x + 2.6, JEGI.z + 1.4, -Math.PI / 2],
  guide: [-22.6, -2, -Math.PI / 2],
  kai: [26, -6.6, Math.PI / 2], dancer1: [HULA.x - 1, HULA.z - 0.8, -Math.PI / 2], dancer2: [HULA.x + 1.2, HULA.z + 0.9, -Math.PI / 2],
  joel: [27, 2.4, Math.PI / 2], staff: [31.4, 2.0, -Math.PI / 2],
  ella: [VINE.x + 0.5, VINE.z + 3.6, 0], ranger: [PEN.x - 1.5, PEN.z + 4.4, 0],
  diego: [WRITE.x + 1, WRITE.z + 1.8, Math.PI / 2],
  bonus: [-6, -20, 0]
};
L.pockets.forEach((p, i) => { HOME[p.id] = [-30.8, POCKET_Z[i], Math.PI / 2]; });

addNPC('clerk', { name: 'Clerk', girl: true, shirt: 0xc62828, hair: 0x222222, scale: 1.1, idle: ['Would you like to try some yakgwa?', '약과 좀 먹어 볼래?'] }, ...HOME.clerk);
addNPC('rani', { name: 'Rani', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ["Oh, it's sweet and soft!", '와, 달고 부드러워!'] }, ...HOME.rani);
addNPC('nara', { name: 'Nara', girl: true, shirt: 0x7e57c2, hair: 0x111111, idle: ['I like yakgwa.', '나는 약과를 좋아해.'] }, ...HOME.nara);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ['Oh, it looks fun. I want to try.', '와, 재미있어 보여. 나도 해 보고 싶어.'] }, ...HOME.olivia);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ["It's a traditional Korean game.", '그건 한국의 전통 놀이야.'] }, ...HOME.hajun);
addNPC('kicker1', { name: 'Minsu', shirt: 0x5c6bc0, hair: 0x111111, idle: ['You kick the Jegi with one foot.', '한 발로 제기를 차.'] }, ...HOME.kicker1);
addNPC('kicker2', { name: 'Yuri', girl: true, shirt: 0x26a69a, hair: 0x222222, idle: ['Jegichagi is fun!', '제기차기는 재미있어!'] }, ...HOME.kicker2);
addNPC('guide', { name: 'Ms. Han', girl: true, shirt: 0x8d3b2a, skirt: 0x5d4037, hair: 0x222222, scale: 1.12, idle: ['Do you know anything about hanok?', '한옥에 관해 알고 있니?'] }, ...HOME.guide);
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ['I learned hula from my cousin before.', '전에 사촌에게 훌라를 배웠어.'] }, ...HOME.kai);
addNPC('dancer1', { name: 'Leilani', girl: true, shirt: 0xffffff, skirt: 0x8bc34a, hair: 0x2b1d14, idle: ['Aloha! This is hula.', '알로하! 이건 훌라예요.'] }, ...HOME.dancer1);
addNPC('dancer2', { name: 'Malia', girl: true, shirt: 0xffeb3b, skirt: 0x8bc34a, hair: 0x2b1d14, idle: ["It's a traditional Hawaiian dance.", '하와이의 전통 춤이에요.'] }, ...HOME.dancer2);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ["It's a traditional African drum.", '그건 아프리카의 전통 북이야.'] }, ...HOME.joel);
addNPC('staff', { name: 'Staff', shirt: 0xff8f00, hair: 0x3b2a1a, skin: 0x8d5524, scale: 1.1, idle: ['You hit it with your hands and fingers.', '손과 손가락으로 쳐요.'] }, ...HOME.staff);
addNPC('ella', { name: 'Ella', girl: true, shirt: 0x7cb342, hair: 0xd4a017, idle: ["It's sweet and sour.", '달고 새콤해요.'] }, ...HOME.ella);
addNPC('ranger', { name: 'Ranger', shirt: 0x6d4c41, pants: 0x4e342e, hair: 0x3b2a1a, scale: 1.1, idle: ["It can't fly. But it can run fast.", '날지 못해요. 하지만 빨리 달려요.'] }, ...HOME.ranger);
addNPC('diego', { name: 'Diego', shirt: 0xe53935, hair: 0x111111, skin: 0xd2a679, idle: ["It's a hat from Peru.", '그건 페루에서 온 모자야.'] }, ...HOME.diego);
addNPC('bonus', { name: 'Owen', shirt: 0xffca28, hair: 0x6d4c41, idle: ['Do you know anything about the music show?', '음악 공연에 관해 알고 있니?'] }, ...HOME.bonus);
L.pockets.forEach((p, i) => addNPC(p.id, { name: p.name, girl: p.girl, shirt: p.shirt, hair: [0xa0522d, 0x3b2a1a, 0x111111, 0xd4a017, 0x222222, 0x111111][i], scale: 0.9, idle: [`Do you know anything about ${p.culture}?`, `${CU[p.culture].ko}에 관해 알고 있니?`] }, ...HOME[p.id]));
// Diego의 추요 모자
{ const c = chulloModel(0.95); c.position.set(0, 1.86, 0); NPC.diego.g.add(c); const sp = NPC.diego.g.children.filter(o => o.isSprite); sp[0].position.y = 2.6; sp[1].userData.baseY = 3.15; sp[1].position.y = 3.15; }
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
const KQ = (x) => [`Do you know anything about ${x}?`, 'What would you like to have?', "What's wrong?", 'Where are you from?'];
const KINDS = ['cookie', 'drum', 'game', 'dance', 'house', 'painting'];
const kindAns = (k, pre = '') => [`${pre}It's a traditional Korean ${k}.`, ...shuffle(KINDS.filter(x => x !== k)).slice(0, 3).map(x => `${pre}It's a traditional Korean ${x}.`)];
const jo = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 ? a : b); };
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 민속 마을 나들이', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 전통문화관 복주머니', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. 세계 문화 체험', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Do · Write and Do', start: stage4 },
  { title: '5. 키위 이야기', book: 'Before/After You Read', start: stage5 },
  { title: '6. 전통문화 소개 글', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; n.g.rotation.z = 0; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  dancers.length = 0;
  dancers.push({ id: 'kicker1', k: 6 }, { id: 'kicker2', k: 7 }, { id: 'dancer1', k: 3, sway: 1 }, { id: 'dancer2', k: 3, sway: 1 });
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
function giveTo(id, label, then) { setObj(label, npcAt(id)); mark(id); NPC[id].talk = async () => { mark(id, false); NPC[id].talk = null; held = null; refreshHUD(); good(); await then(); }; }
function fetchItem(model, x, z, _unused, label, objText, after, o = {}) {
  setObj(objText, () => [x, z]);
  const g = itemModel(model); g.scale.setScalar(o.scale || 1.8);
  addItem(g, x, z, (it) => { removeItem(it); setHeld(model, label); beep('get'); after(); }, { y: o.y || 1.2, r: 1.2, spin: 0.8 });
}

// ---- 1. Fun Talk 1 ----
function stage1() {
  setObj('🍪 <b>약과 가게</b>의 <b>Rani</b>와 Nara에게 가요', npcAt('rani')); mark('rani');
  NPC.rani.talk = async () => {
    mark('rani', false); NPC.rani.talk = null;
    await readLines(L.funTalk1.scene1);
    await ask('나', 'Nara가 되어 Rani에게 약과에 관해 알고 있는지 물어보세요.', '알맞은 질문을 고르세요.', KQ('yakgwa'), { me: true, hint: 'Do you know anything about ~? = ~에 관해 알고 있니?' });
    await say('Rani', "Yes, I do. It's a traditional Korean cookie.", '응, 알고 있어. 그건 한국의 전통 과자야.', { listen: true });
    await ask('', 'Yakgwa is a traditional Korean ______.', 'Rani는 약과를 무엇이라고 했나요?', ['cookie', 'drum', 'game', 'house'], { hint: '🔊 다시 듣기를 눌러 보세요.' });
    await say('Nara', "That's right. I like yakgwa.", '맞아. 나는 약과를 좋아해.');
    await say('Rani', 'Me, too. Can I have one more?', '나도. 하나 더 먹어도 돼요?');
    await say('Clerk', 'Of course. Go ahead.', '물론이지. 어서 먹으렴.');
    await say('', '', '🍪 진열대 끝에 있는 약과를 하나 집어 Rani에게 가져다주세요.', { btn: '가져올게!' });
    closeDlg();
    fetchItem('yakgwa', STALL.x + 2.3, STALL.z + 0.3, null, '🍪 yakgwa', '🍪 진열대에서 <b>약과</b>를 집어요', () => {
      giveTo('rani', '🍪 Rani에게 약과를 줘요', async () => {
        await say('Rani', "Thank you! Mmm, it's sweet and soft.", '고마워! 음, 달고 부드러워.');
        closeDlg(); s1jegi();
      });
    }, { y: 1.4 });
  };
}
function s1jegi() {
  setObj('🪶 <b>제기차기 마당</b>의 <b>Olivia</b>와 하준이에게 가요', npcAt('olivia')); mark('olivia');
  NPC.olivia.talk = async () => {
    mark('olivia', false); NPC.olivia.talk = null;
    await readLines(L.funTalk1.scene2);
    await ask('나', '하준이가 되어 Olivia에게 제기차기에 관해 알고 있는지 물어보세요.', '알맞은 질문을 고르세요.', KQ('Jegichagi'), { me: true });
    await say('Olivia', "No, I don't. What is it?", '아니, 몰라. 그게 뭐야?', { listen: true });
    await ask('나', '하준이가 되어 제기차기를 설명해 주세요. 🪶', '제기차기는 한국의 전통 놀이예요.', kindAns('game'), { me: true });
    await say('Hajun', 'You kick the Jegi with one foot. Look!', '한 발로 제기를 차는 거야. 봐!');
    await say('Olivia', 'Oh, it looks fun. I want to try.', '와, 재미있어 보여. 나도 해 보고 싶어.');
    await say('', '', '🧺 바구니에서 제기를 가져다 Olivia에게 주세요.', { btn: '가져올게!' });
    closeDlg();
    fetchItem('jegi', BASKET.x, BASKET.z + 1.1, null, '🪶 Jegi', '🧺 바구니에서 <b>제기</b>를 가져와요', () => {
      giveTo('olivia', '🪶 Olivia에게 제기를 줘요', async () => {
        await say('Hajun', 'Try again, Olivia.', '다시 해 봐, Olivia.');
        await say('Olivia', 'Now I can do it!', '이제 할 수 있어!');
        const hp = NPC.hajun.g.position; const j = jegiModel(1.4); j.position.set(hp.x, 2.05, hp.z); addDecor(j);
        puff(hp.x, 2.8, hp.z, 'Uh-oh!');
        await say('Olivia', "Uh-oh! Hajun, I'm sorry.", '어머! 하준아, 미안해.');
        await ask('', 'What did Olivia learn about Jegichagi?', 'Olivia가 제기차기에 관해 알게 된 것은?', ["It's a traditional Korean game.", "It's a traditional Korean cookie.", "It's a traditional Korean house."]);
        await say('', '', '🎉 Fun Talk 1 완료! 약과는 전통 과자(cookie), 제기차기는 전통 놀이(game)예요.', { btn: '다음 미션 ▶' });
        nextStage();
      });
    });
  };
}

// ---- 2. Listen and Do + Play Together 1 ----
function pocketLines(i) {
  const p = L.pockets[i], c = CU[p.culture];
  const asker = p.name, other = L.pockets[i % 2 ? i - 1 : i + 1].name;
  const q = [asker, `Do you know anything about ${p.culture}?`], a = `It's a traditional Korean ${c.kind}.`;
  return p.yes ? [q, [other, `Yes, I do. ${a}`]] : [q, [other, "No, I don't."], [asker, a]];
}
function stage2() {
  setObj('🏯 서쪽 <b>Traditional Culture Hall</b>의 <b>Ms. Han</b>에게 가요', npcAt('guide')); mark('guide');
  NPC.guide.talk = async () => {
    mark('guide', false); NPC.guide.talk = null;
    await say('Ms. Han', 'Welcome to the Traditional Culture Hall!', '전통문화관에 온 걸 환영해요!');
    await say('', '', '복주머니 앞 친구 6명의 대화를 잘 듣고, 복주머니에 알맞은 붙임딱지를 붙여 주세요. 🔊', { btn: '시작!' });
    closeDlg(); stageState.done = {};
    L.pockets.forEach((p, i) => {
      mark(p.id);
      NPC[p.id].talk = async () => {
        if (stageState.done[p.id]) { await say(p.name, 'Thank you!', '고마워!'); closeDlg(); return; }
        mark(p.id, false);
        for (const [who, en] of pocketLines(i)) await say(who, en, '잘 듣고 붙임딱지를 골라요. (🔊 다시 듣기 · 👀 글 보기)', { listen: true, koAlways: true });
        const c = CU[p.culture];
        await ask('', `📌 복주머니 ${i + 1}번 · 알맞은 붙임딱지는?`, '대화에 나온 전통문화를 고르세요.', [p.culture, ...shuffle(L.cultures.map(x => x.id).filter(x => x !== p.culture)).slice(0, 3)].map(x => `${CU[x].emoji} ${x}`), { hint: '🔊 다시 듣기를 눌러 보세요.' });
        await ask('', `${p.culture}: It's a traditional Korean ______.`, `${jo(c.ko, '은', '는')} 어떤 전통문화인가요?`, [c.kind, ...shuffle(KINDS.filter(k => k !== c.kind)).slice(0, 2)]);
        stageState.done[p.id] = 1; closeDlg();
        const st = textPlane(`${c.emoji} ${p.culture}`, 0.42, { fs: 50, bg: '#fffde7', fg: '#5d4037', border: '#fbc02d', pad: 14 });
        scene.remove(st); st.position.set(-33.7, 1.8, POCKET_Z[i]); st.rotation.y = Math.PI / 2; addDecor(st);
        const n = Object.keys(stageState.done).length;
        if (n < L.pockets.length) setObj(`📌 복주머니 친구들의 대화를 들어요 (${n}/6)`, () => nearestOf(L.pockets.filter(x => !stageState.done[x.id]).map(x => x.id)));
        else s2pt1();
      };
    });
    setObj('📌 복주머니 친구들의 대화를 들어요 (0/6)', () => nearestOf(L.pockets.filter(x => !stageState.done[x.id]).map(x => x.id)));
  };
}
function s2pt1() {
  setObj('👩‍🏫 <b>Ms. Han</b>에게 돌아가요', npcAt('guide')); mark('guide');
  NPC.guide.talk = async () => {
    mark('guide', false); NPC.guide.talk = null;
    await say('Ms. Han', "Great job! Let's play a game. Listen and pick up the card first!", '잘했어요! 놀이를 해요. 잘 듣고 카드를 먼저 집으세요!');
    await say('', '', 'Play Together 1 · 카드 먼저 집기 🃏 선생님의 질문을 듣고, 바닥에 놓인 카드 중 알맞은 카드로 달려가세요! (3판)', { btn: '시작!' });
    stageState.round = 0; stageState.targets = shuffle(L.cultures).slice(0, 3);
    await pt1Round();
  };
}
async function pt1Round() {
  const c = stageState.targets[stageState.round];
  stageState.target = null;
  await say('Ms. Han', `Do you know anything about ${c.id}?`, '잘 듣고 알맞은 카드를 먼저 집어요!', { listen: true, koAlways: true, btn: '카드 찾기 🏃' });
  closeDlg();
  stageState.target = c.id; stageState.miss = 0;
  const slots = [];
  for (const x of [-28.6, -25.8]) for (const z of [-8.5, -5.2, -1.9, 1.4, 4.7]) slots.push([x, z]);
  const free = shuffle(slots.filter(s => dist(s) > 2.2));
  shuffle(L.cultures).forEach((cu, i) => {
    const it = addItem(wordCube(`${cu.emoji} ${cu.id}`, '#fff8e1', '#5d4037'), free[i][0], free[i][1], (it) => {
      if (stageState.target !== cu.id) { if ((it.cool || 0) > performance.now()) return; it.cool = performance.now() + 1200; it.shake = 0.5; beep('bad'); stageState.miss++; toast('그 카드가 아니에요! 🔊 다시 생각해 보세요.'); return; }
      pt1Got(cu);
    }, { y: 0.9, r: 1.0, spin: 0.6 });
    it.word = cu.id;
  });
  setObj(`🃏 ${stageState.round + 1}/3판 · 알맞은 카드를 집어요`, () => { const it = items.find(i => i.alive && i.word === stageState.target); return S.koHelp && it ? [it.x, it.z] : null; });
}
async function pt1Got(c) {
  busy = true; stageState.target = null;
  items.filter(i => !i.bonus).forEach(removeItem);
  S.tries++; if (!stageState.miss) { S.correct++; addStar(); } save(); beep('get');
  try {
    await ask('나', `🃏 ${c.emoji} ${c.id} 카드를 집었어요! 대답해요.`, `${jo(c.ko, '은', '는')} 한국의 전통 ${jo(c.kindKo, '이에요', '예요')}.`, kindAns(c.kind, 'Yes, I do. '), { me: true });
    await say('Tom', "No, I don't.", '(카드를 못 집은 팀) 아니, 몰라.');
    stageState.round++;
    if (stageState.round < 3) await pt1Round();
    else { await say('Ms. Han', 'You win! Wonderful!', '여러분 팀이 이겼어요! 훌륭해요!'); nextStage(); }
  } finally { busy = false; }
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  placeNPC('nara', 26, -8.6, Math.PI / 2);
  setObj('🌏 동쪽 <b>World Culture Center</b>의 <b>Kai</b>에게 가요', npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await say('Kai', "Wow, they're dancing.", '와, 춤추고 있어.');
    await ask('나', 'Kai가 되어 Nara에게 훌라에 관해 알고 있는지 물어보세요.', '알맞은 질문을 고르세요.', KQ('hula'), { me: true });
    await say('Nara', "Yes, I do. It's a traditional Hawaiian dance.", '응, 알고 있어. 그건 하와이의 전통 춤이야.', { listen: true });
    await ask('', 'How did Nara explain hula?', '나라는 훌라를 무엇이라고 설명했나요?', ["It's a traditional Hawaiian dance.", "It's a traditional Korean dance.", "It's a traditional African drum."]);
    await say('Kai', 'That\'s right. I learned hula from my cousin before.', '맞아. 전에 사촌에게 훌라를 배웠어.');
    dancers.push({ id: 'kai', k: 3 });
    await say('', '', '🌺 Kai가 훌라 춤을 춰요!', {});
    await ask('나', 'Nara가 되어 Kai를 칭찬해 주세요. 💃', '잘하는 것을 말해요.', ["Oh, you're good at dancing, Kai.", "Oh, you're good at cooking, Kai.", "No, I don't.", "I'm sorry, Kai."], { me: true });
    await say('Kai', 'Thanks!', '고마워!');
    closeDlg(); s3djembe();
  };
}
function s3djembe() {
  placeNPC('rani', 27, 4.6, Math.PI / 2);
  setObj('🥁 체험관 안쪽 <b>Djembe</b> 코너의 <b>Joel</b>에게 가요', npcAt('joel')); mark('joel');
  NPC.joel.talk = async () => {
    mark('joel', false); NPC.joel.talk = null;
    await say('Joel', "Oh, it's a djembe.", '아, 젬베다.');
    await ask('나', 'Joel이 되어 Rani에게 젬베에 관해 알고 있는지 물어보세요.', '악기 이름 앞에는 the를 붙여요.', KQ('the djembe'), { me: true });
    await say('Rani', "No, I don't. What is it?", '아니, 몰라. 그게 뭐야?', { listen: true });
    await ask('나', 'Joel이 되어 젬베를 설명해 주세요. 🥁', '젬베는 아프리카의 전통 북이에요.', ["It's a traditional African drum. It makes great sounds.", "It's a traditional Hawaiian dance.", "It's a traditional Korean cookie.", "It's a traditional Korean house."], { me: true });
    await say('Rani', 'I want to play it.', '나 쳐 보고 싶어.');
    await say('Staff', 'You hit it with your hands and fingers.', '손과 손가락으로 치면 돼요.');
    await say('', '', '🥁 입구 쪽 선반의 작은 젬베를 가져다 Rani에게 주세요.', { btn: '가져올게!' });
    closeDlg();
    fetchItem('djembe', DJ_SHELF.x, DJ_SHELF.z - 0.9, null, '🥁 djembe', '🥁 선반에서 <b>젬베</b>를 가져와요', () => {
      giveTo('rani', '🥁 Rani에게 젬베를 줘요', async () => {
        const rp = NPC.rani.g.position; const d = djembeModel(1.1); d.position.set(rp.x + 0.7, 0, rp.z); addDecor(d);
        dancers.push({ id: 'rani', k: 9 }); beep('get'); setTimeout(() => beep('get'), 250);
        placeNPC('nara', 26.6, 6.6, Math.PI / 2);
        await say('Rani', "Nara, look! I'm playing the drum. It's a djembe.", 'Nara, 봐! 나 북 치고 있어. 젬베야.');
        await ask('나', 'Nara가 되어 Rani를 칭찬해 주세요. 🥁', '잘하는 것을 말해요.', ["Oh, you're good at playing the djembe, Rani.", "Oh, you're good at dancing, Rani.", "Yes, I do.", "It's a traditional Korean cookie."], { me: true });
        await say('Rani', "Thanks. It's very fun.", '고마워. 정말 재미있어.');
        closeDlg(); s3tuho();
      });
    }, { scale: 1.6, y: 0.9 });
  };
}
function s3tuho() {
  placeNPC('hajun', TUHO.x - 3.2, TUHO.z + 0.6, Math.PI / 2); placeNPC('olivia', TUHO.x - 3.2, TUHO.z + 3, Math.PI / 2); placeNPC('nara', TUHO.x + 3.4, TUHO.z + 2.2, -Math.PI / 2);
  setObj('🏹 남동쪽 <b>Tuho Yard</b>의 <b>Hajun</b>에게 가요', npcAt('hajun')); mark('hajun');
  NPC.hajun.talk = async () => {
    mark('hajun', false); NPC.hajun.talk = null;
    await say('', '', 'Read and Talk · 투호 마당에서 친구와 이야기해요.', {});
    await ask('나', '하준이에게 투호에 관해 알고 있는지 물어보세요. 🏹', '알맞은 질문을 고르세요.', KQ('Tuho'), { me: true });
    await say('Hajun', "No, I don't.", '아니, 몰라.', { listen: true });
    await ask('나', '투호를 설명해 주세요.', '투호는 한국의 전통 놀이예요.', kindAns('game'), { me: true });
    await say('Hajun', "Let's play Tuho!", '투호 놀이 하자!');
    await say('', '', '🏹 화살 바구니에서 화살을 가져와 파란 항아리에 던져 넣으세요.', { btn: '해 볼게!' });
    closeDlg();
    fetchItem('arrow', ARROWS.x - 1.2, ARROWS.z, null, '🏹 arrow', '🏹 바구니에서 <b>화살</b>을 가져와요', () => {
      setObj('🏹 파란 <b>항아리</b> 가까이 가서 화살을 넣어요', () => [POT.x, POT.z]);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 6, 30), new THREE.MeshBasicMaterial({ color: 0xffd54f })); ring.rotation.x = Math.PI / 2;
      const it = addItem(ring, POT.x, POT.z, async (it) => {
        removeItem(it); held = null; refreshHUD(); busy = true;
        try {
          const a = cyl(0.02, 0.02, 1.2, 0xffd54f, POT.x, 1.5, POT.z); scene.remove(a); addDecor(a); beep('star'); toast('🎯 쏙! 화살이 항아리에 들어갔어요!');
          await say('Hajun', 'Wow! My turn.', '와! 내 차례야.');
          const b = cyl(0.02, 0.02, 1.2, 0xef5350, POT.x + 0.1, 1.5, POT.z); b.rotation.z = 0.2; scene.remove(b); addDecor(b); beep('star');
          await ask('나', '하준이도 화살을 넣었어요! 칭찬해 주세요. 🎯', '잘하는 것을 말해요.', ["You're good at playing Tuho.", "You're good at dancing.", "No, I don't.", "It's a traditional Korean cookie."], { me: true });
          await say('Hajun', 'Thanks! Nara has some cards. Let\'s play with her.', '고마워! Nara가 카드를 가지고 있어. 같이 놀자.');
          closeDlg(); s3pt2();
        } finally { busy = false; }
      }, { y: 0.15, r: 1.6, spin: 0 });
    }, { scale: 1.8 });
  };
}
function s3pt2() {
  setObj('🃏 <b>Nara</b>와 같은 카드 모으기 놀이를 해요', npcAt('nara')); mark('nara');
  NPC.nara.talk = async () => {
    mark('nara', false); NPC.nara.talk = null;
    await say('Nara', "Let's play a card game! Collect three same cards.", '카드 놀이 하자! 같은 카드 세 장을 모아 봐.');
    for (const c of shuffle(L.cultures).slice(0, 2)) {
      const qs = (x) => [x, ...shuffle(L.cultures.map(y => y.id).filter(y => y !== x)).slice(0, 3)].map(y => `Do you know anything about ${y}?`);
      await say('', '', `🃏 내 카드: ${c.emoji} ${c.id} ×2  ·  한 장만 더 모으면 돼요!`, {});
      await ask('나', `Olivia에게 ${c.emoji} 카드를 달라고 물어보세요.`, `${c.ko}에 관해 알고 있는지 물어요.`, qs(c.id), { me: true });
      await say('Olivia', "No, I don't.", '(카드가 없어요) 아니, 몰라.', { listen: true });
      toast('🃏 카드 더미에서 한 장을 가져왔어요. 다른 카드네요!', 2200);
      await ask('나', `이번엔 Nara에게 물어보세요.`, `${c.ko}에 관해 알고 있는지 물어요.`, qs(c.id), { me: true });
      await say('Nara', `Yes, I do. It's a traditional Korean ${c.kind}.`, '(카드를 줘요) 응, 알고 있어.', { listen: true });
      await ask('나', `🃏 ${c.emoji} ×3! 카드를 내려놓으며 크게 말해요.`, `${jo(c.ko, '은', '는')} 한국의 전통 ${jo(c.kindKo, '이에요', '예요')}.`, kindAns(c.kind), { me: true });
    }
    await say('Nara', "You win! You're good at playing card games.", '네가 이겼어! 너 카드 놀이 잘한다.');
    nextStage();
  };
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('guide', 0, 11, Math.PI);
  setObj('🧱 마을 가운데의 <b>Ms. Han</b>에게 가요', npcAt('guide')); mark('guide');
  NPC.guide.talk = async () => {
    mark('guide', false); NPC.guide.talk = null;
    await say('Ms. Han', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '마을 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['know', 'about', 'No,', "don't.", 'game.', 'dance.', 'drum.', 'Korean', 'at', 'good', 'like'].filter(w => !words.includes(w));
  const extra = shuffle(pool).slice(0, 2);
  stageState.words = words; stageState.wi = 0; stageState.miss = 0;
  const all = shuffle(words.concat(extra)), placed = [];
  all.forEach((w) => {
    let x = 0, z = 0;
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 4.5;
      x = BLK.x + Math.sin(a) * r; z = BLK.z + Math.cos(a) * r;
      if (dist([x, z]) > 2.6 && placed.every(p => Math.hypot(p[0] - x, p[1] - z) > 1.7)) break;
    }
    placed.push([x, z]);
    const it = addItem(wordCube(w), x, z, (it) => {
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
  await say('Ms. Han', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. All About Kiwis (Reading) ----
const OX = ['⭕ O (맞아요)', '❌ X (틀려요)'];
function stage5() {
  setObj('🥝 북쪽 <b>All About Kiwis</b> 정원의 <b>Ella</b>에게 가요', npcAt('ella')); mark('ella');
  NPC.ella.talk = async () => {
    mark('ella', false); NPC.ella.talk = null;
    await say('Ella', 'Hello! Look at the kiwi fruit and the kiwi bird.', '안녕! 키위 과일과 키위 새를 봐요.');
    await say('', '', 'Before You Read · 그림에 알맞은 단어를 골라요.', { btn: '시작' });
    const PZ = [['🐦', 'bird'], ['🟤', 'brown'], ['🥝🍎', 'fruit'], ['🍯', 'sweet']];
    for (const [e, w] of shuffle(PZ).slice(0, 2)) await ask('', `${e}  →  ______`, '그림에 알맞은 단어', [w, ...PZ.filter(p => p[1] !== w).map(p => p[1])], { sayIt: true });
    await say('', '', '📖 All About Kiwis · 키위 과일에 관한 글을 읽어요.', { btn: '읽기' });
    await readLines(L.reading.fruit);
    await ask('', "The kiwi fruit: It's from New Zealand.", '글의 내용과 맞으면 O, 틀리면 X', OX, { right: OX[1], noShuffle: true, sayIt: false, hint: "It's from ______." });
    await ask('', "The kiwi fruit: It's sweet and sour.", '글의 내용과 맞으면 O, 틀리면 X', OX, { noShuffle: true, sayIt: false });
    closeDlg();
    setObj('🐦 오른쪽 <b>키위 새 울타리</b>의 <b>Ranger</b>에게 가요', npcAt('ranger')); mark('ranger');
    NPC.ranger.talk = async () => {
      mark('ranger', false); NPC.ranger.talk = null;
      await readLines(L.reading.bird);
      await ask('', 'The kiwi bird: It lives only in China.', '글의 내용과 맞으면 O, 틀리면 X', OX, { right: OX[1], noShuffle: true, sayIt: false, hint: 'It lives only in ______.' });
      await ask('', 'The kiwi bird: It can run fast.', '글의 내용과 맞으면 O, 틀리면 X', OX, { noShuffle: true, sayIt: false });
      await say('', '', 'After You Read · 글의 내용에 맞게 대화를 완성해요.', { btn: '시작' });
      await ask('나', 'Do you ______ anything about the kiwi fruit?', '빈칸에 알맞은 말', ['know', 'like', 'have'], { sayIt: false });
      await ask('Ella', "Yes, I do. It's ______ outside and green inside.", '빈칸에 알맞은 말', ['brown', 'green', 'yellow'], { sayIt: false });
      await ask('나', "It's good at ______. It makes a sound like, \"kiwi.\"", '키위 새에 관한 설명 · 빈칸에 알맞은 말', ['smelling', 'flying', 'swimming'], { sayIt: false });
      speak("It's good at smelling. It makes a sound like, kiwi.", 'Ranger');
      await say('Ranger', 'Kiwi! Kiwi! The name, kiwi, came from the bird\'s sound.', '키위! 키위! 키위라는 이름은 새의 소리에서 왔어요.');
      nextStage();
    };
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("✏️ 남서쪽 <b>Culture Show</b>의 <b>Diego</b>에게 가요", npcAt('diego')); mark('diego');
  NPC.diego.talk = async () => {
    mark('diego', false);
    await say('Diego', 'Hi! Read my writing about Peru!', '안녕! 페루에 관한 내 글을 읽어 줘!');
    await readLines(L.writeSample);
    await ask('', 'Where is the chullo from?', '추요는 어느 나라에서 왔나요?', ["It's from Peru.", "It's from Korea.", "It's from China."]);
    await ask('', 'When do people wear the chullo?', '사람들은 언제 추요를 쓰나요?', ['In winter.', 'In summer.', 'At night.']);
    await say('Diego', 'Now, write about a traditional culture!', '이제 소개하고 싶은 전통문화에 관해 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  $('#wC').innerHTML = L.writeCultures.map((c, i) => `<option value="${i}">${c.about} (${c.ko} · ${c.from})</option>`).join('');
  let curC = -1;
  const fillDesc = () => {
    const c = L.writeCultures[+$('#wC').value]; if (+$('#wC').value === curC) return; curC = +$('#wC').value;
    const opt = c.desc.map((d, i) => `<option value="${i}">${d[0]} (${d[1]})</option>`).join('');
    $('#wD1').innerHTML = opt; $('#wD2').innerHTML = opt; $('#wD1').value = 0; $('#wD2').value = 1;
  };
  $('#wC').value = 0; fillDesc();
  if (S.card && L.writeCultures[S.card.c]) { $('#wMe').value = S.card.me || ''; $('#wC').value = S.card.c; fillDesc(); $('#wD1').value = S.card.d1; $('#wD2').value = S.card.d2; }
  const upd = () => { fillDesc(); $('#wPreview').innerHTML = letterHTML(letterData()); };
  f.oninput = upd; f.onchange = upd; upd();
  $('#wRead').onclick = () => speak(letterText(letterData()).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = letterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.me)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if (c.d1 === c.d2) { toast('설명 두 가지를 서로 다르게 골라 주세요.'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).join(' '), '나');
    await say('Diego', 'Great writing! Now I know about it, too.', '멋진 글이야! 이제 나도 그것에 관해 알게 됐어.');
    nextStage(); showEnd();
  };
}
function letterData() { return { me: $('#wMe').value.trim(), c: +$('#wC').value, d1: +$('#wD1').value, d2: +$('#wD2').value }; }
function letterText(c) {
  const w = L.writeCultures[c.c] || L.writeCultures[0];
  return [`Look at this picture. It's ${w.it}.`, `Do you know anything about ${w.about}?`, `It's ${w.kind} from ${w.from}.`, w.desc[c.d1][0], w.desc[c.d2][0]];
}
function letterHTML(c) {
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  return '<div class="cardPrev">' + letterText(c).map(l => `<div>${esc(l)}</div>`).join('') + `<div style="text-align:right;color:var(--accent)">— ${esc(c.me || '____')}</div></div>`;
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>ow 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · ow 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? letterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? letterText(S.card).join(' ') + ' — ' + S.card.me : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 ow 코인 ----
const TH_SPOTS = [[-38, 14], [38, -30], [-20, -42], [38, 40], [-38, -36], [-40, 30]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('ow', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('ow', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Owen');
      toast(`🪙 ow 코인: <b>${w.replace('ow', '<u>ow</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 ow 코인을 모두 모았어요! Do you know anything about the music show?', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Owen', "Hi! I'm Owen. Do you know anything about the music show?", '안녕! 나는 Owen이야. 음악 공연에 관해 알고 있니?');
  await say('Owen', 'Listen: know, show, snow. ow, ow, ow!', 'Sounds and Letters · ow 소리를 들어 보세요. (cow의 ow와는 소리가 달라요)');
  await say('', '', `🪙 마을 구석구석에 숨은 ow 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
