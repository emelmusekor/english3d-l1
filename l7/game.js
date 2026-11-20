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
const SAVE_KEY = 'english3d_l7_v1';
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
  Hajun: [0, 1.15], Kai: [0, 1.1], Rani: [1, 1.4], 'Coach Park': [0, 0.9], 'School Nurse': [1, 1.05], Olivia: [1, 1.3], Doctor: [0, 0.85], Joel: [0, 1.15], Nara: [1, 1.35],
  Dad: [0, 0.8], Maria: [1, 1.15], Brigitta: [1, 1.45], Kurt: [0, 1.3], Gretl: [1, 1.6], Children: [1, 1.5], Narrator: [1, 1.0], Jina: [1, 1.3], Q: [1, 1.2], A: [1, 1.35],
  Lee: [0, 1.1], Amy: [1, 1.5], Tom: [0, 1.2], Yuna: [1, 1.35], Leo: [0, 1.15], Mia: [1, 1.3], '나': [0, 1.0]
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

// ---------------- 세계 만들기 (Lesson 7 · Healthy Town) ----------------
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8fd16f)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xe6dccb)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xe6dccb)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0x1c7ed6, -4, 2, FEN); solid(1, 4, 1, 0x1c7ed6, 4, 2, FEN);
const gateSign = textPlane('Healthy Town 💪', 1.1, { fs: 64, bg: '#1c7ed6', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
function tree(x, z, s = 1) {
  cyl(0.25 * s, 0.32 * s, 2 * s, 0x7a5230, x, s, z);
  const c = ball(1.5 * s, 0x37b24d, x, 3 * s, z); c.scale.y = 1.15;
  block(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
for (let i = -40; i <= 40; i += 8) { tree(i + 2, -43, 1); tree(-43, i, 1.1); tree(43, i + 3, 1); }
for (const x of [-38, -14, 14, 38]) tree(x, 42, 0.9);
for (const [x, z] of [[-20, 14], [20, 12], [-6, 36], [6, 36]]) tree(x, z, 1.1);
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }

// ---------- 남서: 피크닉 (Fun Talk 1) ----------
const PICNIC = { x: -12, z: 24 };
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), mat(0x74c69d)); m.rotation.x = -Math.PI / 2; m.position.set(PICNIC.x, 0.02, PICNIC.z); scene.add(m); }
solid(2.6, 0.12, 1.4, 0xc58b3a, PICNIC.x, 0.8, PICNIC.z);
for (const [dx, dz] of [[-1.1, -0.55], [1.1, -0.55], [-1.1, 0.55], [1.1, 0.55]]) box(0.12, 0.8, 0.12, 0x8d5524, PICNIC.x + dx, 0.4, PICNIC.z + dz);
box(2.6, 0.1, 0.4, 0xc58b3a, PICNIC.x, 0.45, PICNIC.z - 1.1); box(2.6, 0.1, 0.4, 0xc58b3a, PICNIC.x, 0.45, PICNIC.z + 1.1);
// 탁자 위: 햄버거 · 치킨 샐러드
{ cyl(0.16, 0.16, 0.06, 0xd9a35a, PICNIC.x - 0.7, 0.9, PICNIC.z - 0.2, scene, 14); cyl(0.16, 0.16, 0.05, 0x6d3b1e, PICNIC.x - 0.7, 0.95, PICNIC.z - 0.2, scene, 14); cyl(0.16, 0.15, 0.06, 0xd9a35a, PICNIC.x - 0.7, 1.0, PICNIC.z - 0.2, scene, 14);
  cyl(0.28, 0.18, 0.12, 0xffffff, PICNIC.x + 0.6, 0.92, PICNIC.z + 0.1, scene, 16); ball(0.2, 0x69db7c, PICNIC.x + 0.6, 0.98, PICNIC.z + 0.1); }
{ const s = textPlane('🧺 Picnic Lunch', 0.55, { fs: 52, bg: '#ffffff', fg: '#2b8a3e' }); s.position.set(PICNIC.x, 2.3, PICNIC.z - 3.3); cyl(0.05, 0.05, 2.1, 0x666666, PICNIC.x, 1.05, PICNIC.z - 3.35); }
// 공 바구니
const BALLRACK = { x: -18, z: 29 };
{ box(1.2, 0.6, 0.8, 0x868e96, BALLRACK.x, 0.3, BALLRACK.z); ball(0.24, 0xf76707, BALLRACK.x - 0.3, 0.75, BALLRACK.z); ball(0.24, 0xf76707, BALLRACK.x + 0.3, 0.75, BALLRACK.z);
  const s = textPlane('Balls 🏀', 0.35, { fs: 48, bg: '#ffffff', fg: '#e8590c' }); s.position.set(BALLRACK.x, 1.4, BALLRACK.z + 0.42); block(BALLRACK.x - 0.6, BALLRACK.z - 0.4, BALLRACK.x + 0.6, BALLRACK.z + 0.4); }

// ---------- 남동: 농구장 · 달리기 트랙 ----------
const COURT = { x: 13, z: 24 };
{ const c = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat(0xe8590c)); c.rotation.x = -Math.PI / 2; c.position.set(COURT.x, 0.02, COURT.z); scene.add(c);
  const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 10), mat(0xffffff)); l.rotation.x = -Math.PI / 2; l.position.set(COURT.x, 0.03, COURT.z); scene.add(l);
  const r = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.55, 28), mat(0xffffff)); r.rotation.x = -Math.PI / 2; r.position.set(COURT.x, 0.03, COURT.z); scene.add(r);
  for (const sx of [-1, 1]) {
    const x = COURT.x + sx * 6.6;
    cyl(0.1, 0.1, 3.2, 0x495057, x, 1.6, COURT.z); block(x - 0.2, COURT.z - 0.2, x + 0.2, COURT.z + 0.2);
    box(0.08, 1.0, 1.6, 0xffffff, x - sx * 0.2, 3.3, COURT.z);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 16), mat(0xf03e3e)); rim.rotation.x = Math.PI / 2; rim.position.set(x - sx * 0.55, 3.0, COURT.z); scene.add(rim);
  }
  const s = textPlane('Basketball Court 🏀', 0.7, { fs: 60, bg: '#e8590c', fg: '#fff' }); s.position.set(COURT.x, 3.6, COURT.z + 5.4); s.rotation.y = Math.PI;
  cyl(0.06, 0.06, 3.3, 0x666666, COURT.x - 2.8, 1.65, COURT.z + 5.45); cyl(0.06, 0.06, 3.3, 0x666666, COURT.x + 2.8, 1.65, COURT.z + 5.45); }
const TRACK = { x: 32, z: 26 };
{ const t = new THREE.Mesh(new THREE.RingGeometry(4.2, 6, 40), mat(0xc0603a)); t.rotation.x = -Math.PI / 2; t.scale.set(1, 1.7, 1); t.position.set(TRACK.x, 0.025, TRACK.z); scene.add(t);
  const s = textPlane('Running Track 🏃', 0.6, { fs: 56, bg: '#c0603a', fg: '#fff' }); s.position.set(TRACK.x, 2.4, TRACK.z); s.rotation.y = Math.PI; }
const FLAG = { x: TRACK.x, z: TRACK.z - 8.6 };
{ cyl(0.06, 0.06, 3, 0xdee2e6, FLAG.x - 1.6, 1.5, FLAG.z); cyl(0.06, 0.06, 3, 0xdee2e6, FLAG.x + 1.6, 1.5, FLAG.z);
  const b = textPlane('🏁 FINISH', 0.45, { fs: 52, bg: '#212529', fg: '#fff' }); b.position.set(FLAG.x, 2.8, FLAG.z); b.rotation.y = Math.PI; }

// ---------- 서쪽: Habit Center (Listen and Do) ----------
const HABIT = { x: -27, z: -2 };
solid(0.4, 4, 20, 0xfff3bf, -34, 2, -2);
solid(14, 4, 0.4, 0xfff3bf, -27, 2, -12); solid(14, 4, 0.4, 0xfff3bf, -27, 2, 8);
solid(0.5, 4, 0.5, 0x2f9e44, -20.2, 2, -11.8); solid(0.5, 4, 0.5, 0x2f9e44, -20.2, 2, 7.8);
box(14.6, 0.4, 20.6, 0x51cf66, -27, 4.2, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xebfbee)); fl.rotation.x = -Math.PI / 2; fl.position.set(-27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('Habit Center ✅', 0.9, { fs: 64, bg: '#2f9e44', fg: '#fff' }); s.position.set(-19.9, 4.9, -2); s.rotation.y = Math.PI / 2; }
// 습관 스테이션 (서쪽 벽을 따라)
const STATION = { brush: -9.5, wash: -5.5, eat: -1.5, clean: 2.5, ex: 6 };
const stSign = (txt, z) => { const s = textPlane(txt, 0.42, { fs: 48, bg: '#ffffff', fg: '#2b8a3e', border: '#2f9e44' }); s.position.set(-33.75, 2.6, z); s.rotation.y = Math.PI / 2; };
// 이 닦기: 세면대 + 칫솔컵
box(1, 0.9, 1.6, 0xf1f3f5, -33.2, 0.45, STATION.brush); cyl(0.1, 0.08, 0.25, 0x74c0fc, -33.2, 1.05, STATION.brush - 0.4); box(0.03, 0.3, 0.03, 0xff6b6b, -33.2, 1.25, STATION.brush - 0.4); box(0.05, 0.7, 1.0, 0xbde0fe, -33.75, 1.7, STATION.brush);
stSign('🪥 brush your teeth', STATION.brush);
// 손 씻기: 세면대 + 비누
box(1, 0.9, 1.6, 0xf1f3f5, -33.2, 0.45, STATION.wash); box(0.3, 0.12, 0.2, 0xfcc2d7, -33.2, 0.96, STATION.wash + 0.4); cyl(0.04, 0.04, 0.4, 0xadb5bd, -33.5, 1.1, STATION.wash);
stSign('🧼 wash your hands', STATION.wash);
// 아침 먹기: 식탁
box(1.4, 0.08, 1.4, 0xdeb887, -32.6, 0.75, STATION.eat); cyl(0.07, 0.07, 0.75, 0x777777, -32.6, 0.37, STATION.eat);
cyl(0.25, 0.2, 0.05, 0xffffff, -32.6, 0.82, STATION.eat, scene, 16); ball(0.1, 0xffd43b, -32.6, 0.86, STATION.eat); cyl(0.07, 0.07, 0.2, 0xffffff, -32.2, 0.89, STATION.eat + 0.4);
stSign('🍳 eat breakfast', STATION.eat);
// 방 청소: 침대 + 빗자루
box(1.6, 0.5, 2.2, 0x9775fa, -33, 0.25, STATION.clean); box(1.5, 0.15, 2.1, 0xffffff, -33, 0.55, STATION.clean);
{ const st = cyl(0.03, 0.03, 1.4, 0x8d6e63, -31.8, 0.75, STATION.clean + 1.2); st.rotation.z = 0.2; box(0.4, 0.2, 0.1, 0xffd43b, -31.95, 0.1, STATION.clean + 1.2); }
stSign('🧹 clean your room', STATION.clean);
// 운동: 매트 + 줄넘기 + 아령
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), mat(0x4dabf7)); m.rotation.x = -Math.PI / 2; m.position.set(-32.8, 0.04, STATION.ex); scene.add(m);
  box(0.5, 0.1, 0.1, 0x495057, -33.2, 0.1, STATION.ex - 0.6); ball(0.12, 0x212529, -33.45, 0.12, STATION.ex - 0.6); ball(0.12, 0x212529, -32.95, 0.12, STATION.ex - 0.6); }
stSign('🏃 exercise', STATION.ex);
// 빈도 차트 (Day / Week / Month)
{ const s = textPlane('Day · Week · Month', 0.5, { fs: 52, bg: '#ffffff', fg: '#1c7ed6', border: '#1c7ed6' }); s.position.set(-27, 2.8, -11.75); }

// ---------- 동쪽: Health Center (Fun Talk 2) ----------
const HEALTH = { x: 27, z: -2 };
solid(0.4, 4.5, 20, 0xffffff, 34, 2.25, -2);
solid(14, 4.5, 0.4, 0xffffff, 27, 2.25, -12); solid(14, 4.5, 0.4, 0xffffff, 27, 2.25, 8);
solid(0.5, 4.5, 0.5, 0x15aabf, 20.2, 2.25, -11.8); solid(0.5, 4.5, 0.5, 0x15aabf, 20.2, 2.25, 7.8);
box(14.6, 0.4, 20.6, 0xe3fafc, 27, 4.7, -2);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), mat(0xe7f5ff)); fl.rotation.x = -Math.PI / 2; fl.position.set(27, 0.02, -2); scene.add(fl); }
{ const s = textPlane('Health Center 🩺', 0.95, { fs: 64, bg: '#15aabf', fg: '#fff' }); s.position.set(19.9, 4.2, -2); s.rotation.y = -Math.PI / 2; }
// 손 검사 상자
const HANDBOX = { x: 26, z: -9 };
solid(1.4, 1.0, 1.0, 0x495057, HANDBOX.x, 0.5, HANDBOX.z);
const handGlow = box(1.0, 0.4, 0.05, new THREE.MeshBasicMaterial({ color: 0x343a40 }), HANDBOX.x, 0.75, HANDBOX.z + 0.51);
{ const s = textPlane('🖐 Hand Check', 0.38, { fs: 48, bg: '#ffffff', fg: '#7048e8' }); s.position.set(HANDBOX.x, 1.5, HANDBOX.z + 0.52); }
// 치과 의자
const DENTAL = { x: 30.5, z: -4 };
solid(1.0, 0.5, 2.2, 0x63e6be, DENTAL.x, 0.25, DENTAL.z); box(0.9, 0.9, 0.2, 0x63e6be, DENTAL.x, 0.9, DENTAL.z - 1.0); cyl(0.04, 0.04, 1.2, 0xadb5bd, DENTAL.x + 0.8, 1.6, DENTAL.z - 0.6); ball(0.15, 0xfff3bf, DENTAL.x + 0.6, 2.2, DENTAL.z - 0.4);
{ const s = textPlane('🦷 Dental Check', 0.42, { fs: 48, bg: '#0ca678', fg: '#fff' }); s.position.set(33.75, 2.6, DENTAL.z); s.rotation.y = -Math.PI / 2; }
// 선물 선반
const SHELF = { x: 31.5, z: 6.6 };
box(4, 1.6, 0.6, 0xffe8cc, SHELF.x, 0.8, SHELF.z);
{ const s = textPlane('🎁 Gifts', 0.4, { fs: 48, bg: '#f76707', fg: '#fff' }); s.position.set(SHELF.x, 2.0, SHELF.z - 0.32); s.rotation.y = Math.PI; }
// Read and Talk 게시판
const BOARD = { x: 22.5, z: 5 };
box(3.2, 2, 0.12, 0xfff9db, BOARD.x, 1.7, 7.7);
{ const s = textPlane('Read and Talk\nHow often do you ...?', 0.75, { fs: 46, bg: null, fg: '#1864ab' }); s.position.set(BOARD.x, 1.75, 7.62); s.rotation.y = Math.PI; }

// ---------- 북쪽: The Sound of Music 이야기 마당 ----------
const STORY = { x: 0, z: -32 };
box(40, 0.3, 14, 0xf8f0e3, 0, 0.15, -34);
solid(40, 4, 0.4, 0xe6d5b8, 0, 2, -41);
{ const s = textPlane('The Sound of Music · Story Garden', 0.9, { fs: 62, bg: '#862e9c', fg: '#fff' }); s.position.set(0, 5, -40.7); }
// 왼쪽: 트랩 가족의 집
const VILLA = { x: -12, z: -36 };
solid(0.3, 3.4, 8, 0xfff0f6, -18, 1.7, -36.5); box(9, 0.3, 8.6, 0xa61e4d, -13.5, 3.5, -36.5);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), mat(0xf3d9fa)); fl.rotation.x = -Math.PI / 2; fl.position.set(-13.5, 0.32, -36.5); scene.add(fl); }
box(1.6, 0.9, 0.7, 0x845ef7, -16.5, 0.75, -39.8); box(0.5, 0.1, 0.35, 0xc92a2a, -12.5, 0.95, -37.6); // 소파·책
solid(1.4, 0.6, 0.8, 0x8d6e63, -12.5, 0.6, -37.6);
{ const s = textPlane('Trapp House 🏡', 0.45, { fs: 48, bg: '#ffffff', fg: '#a61e4d' }); s.position.set(-13.5, 2.8, -40.6); }
// 오른쪽: 공원 (기타)
const MEADOW = { x: 12, z: -35 };
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), mat(0x8ce99a)); fl.rotation.x = -Math.PI / 2; fl.position.set(12, 0.32, -36.5); scene.add(fl);
  const fc = [0xff6b6b, 0xffd43b, 0xf783ac, 0xffffff];
  for (let i = 0; i < 40; i++) { const x = 12 + (Math.random() - 0.5) * 9, z = -36.5 + (Math.random() - 0.5) * 6; if (Math.abs(x - 12) < 2.5 && z > -37) continue; ball(0.1, fc[i % 4], x, 0.42, z); } }
tree(16.5, -39, 1); tree(7.5, -39.5, 0.9);
{ const s = textPlane('Park Meadow 🎸', 0.45, { fs: 48, bg: '#ffffff', fg: '#2b8a3e' }); s.position.set(12, 2.8, -40.6); }

// ---------- 남서: Let's Write 설문 책상 (Jina) ----------
const WRITE = { x: -30, z: 33 };
box(14, 0.4, 10, 0xd0ebff, WRITE.x, 0.2, WRITE.z);
for (const [dx, dz] of [[-6.5, -4.5], [6.5, -4.5], [-6.5, 4.5], [6.5, 4.5]]) solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz);
box(15, 0.4, 11, 0x1971c2, WRITE.x, 5.2, WRITE.z);
{ const s = textPlane("Let's Write · Habit Survey", 0.8, { fs: 62, bg: '#1971c2', fg: '#fff' }); s.position.set(WRITE.x + 7.6, 4.4, WRITE.z); s.rotation.y = Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x - 1, 0.85, WRITE.z);
solid(0.4, 3.4, 8, 0xf8f9fa, WRITE.x - 6.6, 2, WRITE.z);
['🍳', '🏃', '🪥', '🧹'].forEach((e, i) => { const p = textPlane(e, 1.2, { fs: 110, bg: '#ffffff', border: '#1971c2' }); p.position.set(WRITE.x - 6.35, 2.4, WRITE.z - 3 + i * 2); p.rotation.y = Math.PI / 2; });

// ---------- 물건 모형 ----------
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'basketball') { ball(0.24, 0xf76707, 0, 0.24, 0, g); const r = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.012, 4, 20), mat(0x222222)); r.position.y = 0.24; g.add(r); }
  else if (id === 'hand doll') { box(0.3, 0.32, 0.12, 0xffc078, 0, 0.16, 0, g); for (let k = 0; k < 4; k++) box(0.06, 0.2, 0.08, 0xffc078, -0.11 + k * 0.073, 0.42, 0, g); const th = box(0.06, 0.16, 0.08, 0xffc078, -0.2, 0.25, 0, g); th.rotation.z = 0.6; ball(0.03, 0x111111, -0.05, 0.22, 0.07, g); ball(0.03, 0x111111, 0.05, 0.22, 0.07, g); }
  else if (id === 'toothbrush doll') { box(0.08, 0.5, 0.08, 0x4dabf7, 0, 0.25, 0, g); box(0.12, 0.14, 0.12, 0xffffff, 0, 0.56, 0, g); ball(0.025, 0x111111, -0.03, 0.3, 0.045, g); ball(0.025, 0x111111, 0.03, 0.3, 0.045, g); }
  else if (id === 'guitar') { const b = ball(0.2, 0xc58b3a, 0, 0.2, 0, g); b.scale.z = 0.4; box(0.06, 0.45, 0.04, 0x6d4c41, 0, 0.55, 0, g); }
  return g;
}
let decor = [];
function addDecor(o) { scene.add(o); decor.push(o); return o; }
function clearDecor() { decor.forEach(o => scene.remove(o)); decor = []; }

// ---------- 들고 있는 물건 ----------
scene.add(camera);
let heldMesh = null, heldMeshId = null, fallers = [], hoppers = {};
function heldSync() {
  const f = held && held.kind === 'thing' ? held.id : null;
  if (f === heldMeshId) return;
  if (heldMesh) { camera.remove(heldMesh); heldMesh = null; }
  heldMeshId = f;
  if (f) { heldMesh = itemModel(f); heldMesh.scale.setScalar(0.9); heldMesh.position.set(0.34, -0.45, -0.8); camera.add(heldMesh); }
}
function setHeld(id, label) { held = { kind: 'thing', id, label }; refreshHUD(); }
// 동작하는 친구 (Play Together 1): 제자리에서 폴짝
function hop(id, sec = 2.5) { hoppers[id] = sec; }
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  for (const id in hoppers) {
    hoppers[id] -= dt; const n = NPC[id];
    if (hoppers[id] <= 0 || !n) { delete hoppers[id]; if (n) n.g.position.y = 0; continue; }
    n.g.position.y = Math.abs(Math.sin(t * 7)) * 0.45;
  }
  for (const f of fallers) { f.userData.life -= dt; f.position.y += dt * 0.8; f.material.opacity = Math.max(0, f.userData.life); }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { scene.remove(f); return false; } return true; });
}
function puff(x, y, z, text) {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#1c7ed6', border: '#1c7ed6' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 1.6; scene.add(s); fallers.push(s);
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#e6dccb'); R(0, -2, 52, 6, '#e6dccb');
  R(-27, -2, 14, 20, '#2f9e44', '습관 센터'); R(27, -2, 14, 20, '#15aabf', '보건소');
  R(0, -36, 40, 9, '#862e9c', '이야기 마당'); R(WRITE.x, WRITE.z, 14, 10, '#1971c2', '설문지');
  R(COURT.x, COURT.z, 14, 10, '#e8590c', '농구장'); R(PICNIC.x, PICNIC.z, 9, 7, '#2b8a3e', '피크닉'); R(TRACK.x, TRACK.z, 12, 18, '#c0603a', '트랙');
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
const HB = Object.fromEntries(L.habits.map(h => [h.id, h]));
function addNPC(id, o, x, z, face = 0) {
  const g = makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '' };
  return NPC[id];
}
// 집 위치 [x, z, 방향]
const HOME = {
  hajun: [PICNIC.x - 1.2, PICNIC.z + 2, Math.PI], kai: [PICNIC.x + 1.4, PICNIC.z + 2, Math.PI], rani: [PICNIC.x, PICNIC.z - 2.2, 0],
  coach: [-22.6, -9, -Math.PI / 2],
  nurse: [HANDBOX.x - 1.6, HANDBOX.z + 1.4, Math.PI / 2], olivia: [HANDBOX.x + 0.8, HANDBOX.z + 1.6, -Math.PI / 2],
  doctor: [DENTAL.x - 1.2, DENTAL.z - 1.2, Math.PI / 2], joel: [DENTAL.x - 0.4, DENTAL.z + 2.2, Math.PI], nara: [23.5, 3, Math.PI / 2],
  dad: [-15.5, -35.4, 0], maria: [-11, -35, 0], brigitta: [-12.6, -36.7, 0], kurt: [-6.5, -31, 0], gretl: [12, -35, 0],
  jina: [WRITE.x + 1, WRITE.z + 1.8, Math.PI / 2],
  bonus: [-6, -20, 0]
};
L.kids.forEach((k) => { HOME[k.id] = [-31.2, STATION[k.habit], Math.PI / 2]; });

addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ['I like hamburgers.', '나는 햄버거가 좋아.'] }, ...HOME.hajun);
addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ["Let's play basketball after lunch.", '점심 먹고 농구하자.'] }, ...HOME.kai);
addNPC('rani', { name: 'Rani', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ['I exercise every day.', '나는 매일 운동해.'] }, ...HOME.rani);
addNPC('coach', { name: 'Coach Park', shirt: 0x2f9e44, pants: 0x212529, hair: 0x222222, scale: 1.12, idle: ['How often do you exercise?', '너는 얼마나 자주 운동하니?'] }, ...HOME.coach);
addNPC('nurse', { name: 'School Nurse', girl: true, shirt: 0xffffff, skirt: 0x99e9f2, hair: 0x3b2a1a, scale: 1.12, idle: ['You should wash your hands often.', '손을 자주 씻어야 해요.'] }, ...HOME.nurse);
addNPC('olivia', { name: 'Olivia', girl: true, shirt: 0xff7043, hair: 0x6d4c41, idle: ['I wash my hands twice a day.', '나는 하루에 두 번 손을 씻어.'] }, ...HOME.olivia);
addNPC('doctor', { name: 'Doctor', shirt: 0xffffff, pants: 0x495057, hair: 0x868e96, scale: 1.15, idle: ['Open your mouth, please.', '입을 벌려 보세요.'] }, ...HOME.doctor);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ['I brush my teeth three times a day.', '나는 하루에 세 번 이를 닦아.'] }, ...HOME.joel);
addNPC('nara', { name: 'Nara', girl: true, shirt: 0xffa94d, hair: 0x1b1b1b, idle: ['I eat sweets once or twice a day.', '나는 하루에 한두 번 단것을 먹어.'] }, ...HOME.nara);
addNPC('dad', { name: 'Dad', shirt: 0x364fc7, pants: 0x212529, hair: 0x6d4c41, scale: 1.18, idle: ['This is your new teacher.', '이분은 너희들의 새로운 선생님이시다.'] }, ...HOME.dad);
addNPC('maria', { name: 'Maria', girl: true, shirt: 0x868e96, skirt: 0x495057, hair: 0xd4a017, scale: 1.1, idle: ['I play the guitar every day.', '나는 기타를 매일 연주해.'] }, ...HOME.maria);
addNPC('brigitta', { name: 'Brigitta', girl: true, shirt: 0xcc5de8, hair: 0xa0522d, scale: 0.85, idle: ['I like reading books.', '나는 책 읽는 것을 좋아해.'] }, ...HOME.brigitta);
addNPC('kurt', { name: 'Kurt', shirt: 0x5c940d, hair: 0xa0522d, scale: 0.85, idle: ['Sorry. I want to stay home.', '죄송해요. 저는 집에 있고 싶어요.'] }, ...HOME.kurt);
addNPC('gretl', { name: 'Gretl', girl: true, shirt: 0xffc9de, hair: 0xd4a017, scale: 0.7, idle: ["Oh, you're good at playing the guitar.", '오, 기타 연주를 잘하시네요.'] }, ...HOME.gretl);
addNPC('jina', { name: 'Jina', girl: true, shirt: 0x1971c2, hair: 0x111111, idle: ['I eat breakfast every day.', '나는 매일 아침을 먹어.'] }, ...HOME.jina);
addNPC('bonus', { name: 'Lee', shirt: 0x8e24aa, hair: 0x222222, idle: ['I exercise three times a week.', '나는 일주일에 세 번 운동해.'] }, ...HOME.bonus);
L.kids.forEach((k, i) => addNPC(k.id, { name: k.name, girl: k.girl, shirt: k.shirt, hair: [0xa0522d, 0x3b2a1a, 0x111111, 0xd4a017, 0x222222][i], scale: 0.9, idle: [`I ${HB[k.habit].my} ${k.freq.charAt(0).toLowerCase() + k.freq.slice(1)}`, `${HB[k.habit].emoji} ${HB[k.habit].ko}: ${k.ko}`] }, ...HOME[k.id]));
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
const habitQ = (id) => `How often do you ${HB[id].you}?`;
const HQ = (right) => [habitQ(right), ...shuffle(L.habits.map(h => h.id).filter(x => x !== right)).slice(0, 3).map(habitQ)];
const FREQS = ['Once a day.', 'Twice a day.', 'Three times a day.', 'Five times a day.', 'Twice a week.', 'Four times a week.', 'Five times a week.', 'Once a month.', 'Six times a month.', 'Every day.'];
const freqChoices = (right) => [right, ...shuffle(FREQS.filter(f => f !== right)).slice(0, 3)];
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const freqText = (n, unit) => `${L.numWords[n]} a ${unit}.`;
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 공원 점심과 농구', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 습관 센터', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. 보건소 검진', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 사운드 오브 뮤직', book: 'Before/After You Read', start: stage5 },
  { title: '6. 나의 생활 습관 설문지', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const k in hoppers) delete hoppers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; n.g.position.y = 0; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  handGlow.material.color.set(0x343a40);
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
// 점수 없는 고르기 (예상하기 등): 고른 번호를 돌려줘요
function pick(who, en, ko, choices) {
  return new Promise(res => {
    openDlg(); setLine(who, en, ko, { speak: false, koAlways: true });
    ui.next.style.display = 'none';
    const btns = choices.map((c, i) => {
      const b = document.createElement('button'); b.className = 'choice'; b.dataset.r = 1; b.innerHTML = `<span class="num">${i + 1}</span>${c}`;
      b.onclick = () => { if (b.disabled) return; btns.forEach(x => x.disabled = true); b.classList.add('right'); beep('ok'); setTimeout(() => { dlgChoiceKeys = null; res(i); }, 600); };
      ui.ch.appendChild(b); return b;
    });
    dlgChoiceKeys = btns;
  });
}
// 가져다주기 공통
function fetchItem(id, label, x, z, objText, toId, toText, onGive) {
  setObj(objText, () => [x, z]);
  const g = itemModel(id); g.scale.setScalar(1.8);
  addItem(g, x, z, (it) => {
    removeItem(it); setHeld(id, label); beep('get');
    setObj(toText, npcAt(toId)); mark(toId);
    NPC[toId].talk = async () => {
      mark(toId, false); NPC[toId].talk = null; held = null; refreshHUD(); good();
      await onGive();
    };
  }, { y: 0.6, r: 1.4, spin: 0.8 });
}

// ---- 1. Fun Talk 1 ----
function stage1() {
  setObj('🧺 <b>피크닉</b> 탁자의 <b>Hajun</b>과 친구들에게 가요', npcAt('hajun')); mark('hajun');
  NPC.hajun.talk = async () => {
    mark('hajun', false); NPC.hajun.talk = null;
    await say('Hajun', 'I like hamburgers.', '나는 햄버거가 좋아.');
    await say('Kai', 'You ate a hamburger yesterday.', '너 어제도 햄버거 먹었잖아.');
    await ask('나', 'Kai가 되어 하준이에게 패스트푸드를 얼마나 자주 먹는지 물어보세요.', '알맞은 질문을 고르세요.', ['How often do you eat fast food?', 'How often do you exercise?', "What's wrong?", 'What would you like to have?'], { me: true, hint: 'How often ...? = 얼마나 자주 ...?' });
    await say('Hajun', 'Four times a week.', '일주일에 네 번.', { listen: true });
    await ask('', 'Hajun eats fast food ______.', '하준이는 패스트푸드를 일주일에 몇 번 먹나요?', ['four times a week', 'once a month', 'every day', 'twice a day'], { hint: '🔊 다시 듣기를 눌러 보세요.' });
    await say('Rani', "That's not good. Try my chicken salad, Hajun.", '그건 좋지 않아. 내 치킨 샐러드 먹어 봐, 하준아.');
    await say('Hajun', "Okay. Oh, it's good.", '알았어. 오, 맛있다.');
    await say('Kai', "Let's play basketball after lunch.", '점심 먹고 농구하자.');
    await say('Rani', 'Sounds good.', '좋아.');
    await say('', '', '🏀 공 바구니에서 농구공을 가져와 농구장의 Kai에게 주세요.', { btn: '가져올게!' });
    closeDlg();
    placeNPC('kai', COURT.x - 3, COURT.z, Math.PI / 2); placeNPC('hajun', COURT.x - 1.5, COURT.z + 2.4, Math.PI); placeNPC('rani', COURT.x - 1.5, COURT.z - 2.4, 0);
    fetchItem('basketball', '🏀 basketball', BALLRACK.x, BALLRACK.z + 1.6, '🏀 <b>공 바구니</b>에서 농구공을 가져와요', 'kai', '🏀 <b>농구장</b>의 <b>Kai</b>에게 공을 줘요', s1court);
  };
}
async function s1court() {
  await say('Kai', 'Thanks!', '고마워!');
  await say('Hajun', "Kai, you're good at playing basketball. I'm already tired.", 'Kai, 너 농구 잘한다. 난 벌써 지쳤어.');
  await ask('나', 'Rani가 되어 하준이에게 얼마나 자주 운동하는지 물어보세요.', '알맞은 질문을 고르세요.', ['How often do you exercise?', 'How often do you eat fast food?', 'How often do you clean your room?', "What's wrong?"], { me: true });
  await say('Hajun', 'Once a month. How about you?', '한 달에 한 번. 너는?', { listen: true });
  await ask('', 'Hajun exercises ______.', '하준이는 얼마나 자주 운동하나요?', ['once a month', 'every day', 'twice a week', 'three times a day'], { hint: '🔊 다시 듣기를 눌러 보세요.' });
  await ask('나', 'Rani가 되어 대답해요. 💪', 'Rani는 운동을 정말 좋아해요.', ['I exercise every day.', 'I want to stay home.', 'I like hamburgers.', "That's not good."], { me: true });
  await say('Kai', "Me, too. Hajun, let's exercise together. We can run with you.", '나도. 하준아, 같이 운동하자. 우리가 같이 달려 줄게.');
  await say('Rani', 'Come on, Hajun.', '어서, 하준아.');
  await say('Hajun', "Okay. I'll try.", '알았어. 해 볼게.');
  await say('', '', '🏃 다음 날! 하준이와 함께 동쪽 Running Track의 🏁 결승선까지 달려요.', { btn: '달리자!' });
  closeDlg();
  NPC.hajun.follow = true;
  setObj('🏃 하준이와 함께 <b>🏁 결승선</b>까지 달려요', () => [FLAG.x, FLAG.z]);
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffd43b })); g.add(ring);
  const t = textPlane('🏁', 0.6, { fs: 80, bg: null }, g); t.position.z = 0.01;
  addItem(g, FLAG.x, FLAG.z + 0.6, async (it) => {
    removeItem(it); NPC.hajun.follow = false; placeNPC('hajun', FLAG.x - 1.2, FLAG.z + 1.2, Math.PI); placeNPC('rani', FLAG.x + 1.2, FLAG.z + 1.4, Math.PI); placeNPC('kai', FLAG.x + 2.4, FLAG.z + 0.4, Math.PI);
    beep('star'); busy = true;
    try {
      await say('', '', '🏁 결승선 도착! 하준이가 헉헉대지만 끝까지 달렸어요.', {});
      await ask('나', 'Rani가 되어 하준이를 칭찬해 주세요. 👍', '칭찬하는 말을 고르세요.', ['Good for you.', "That's not good.", 'Four times a week.', 'I like hamburgers.'], { me: true, hint: 'Good for you. = 잘했어.' });
      await ask('', '운동을 한 달에 한 번 하는 친구는 누구인가요?', 'Fun Talk 1 확인', ['Hajun', 'Rani', 'Kai'], { sayIt: false });
      await say('', '', '🏀 Fun Talk 1 완료! 하준이는 패스트푸드를 일주일에 네 번(four times a week), 운동은 한 달에 한 번(once a month) 해요.', { btn: '다음 미션 ▶' });
    } finally { busy = false; }
    nextStage();
  }, { y: 1.2, r: 1.6, spin: 1.5 });
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  setObj('✅ 서쪽 <b>Habit Center</b>의 <b>Coach Park</b>에게 가요', npcAt('coach')); mark('coach');
  NPC.coach.talk = async () => {
    mark('coach', false); NPC.coach.talk = null;
    await say('Coach Park', "Welcome to the Habit Center! Let's check our friends' habits.", '습관 센터에 온 걸 환영해요! 친구들의 생활 습관을 알아봐요.');
    await say('', '', '친구 5명에게 생활 습관을 얼마나 자주 하는지 묻고, 잘 듣고, 습관 차트에 빈도수를 표시해 주세요.', { btn: '시작!' });
    closeDlg(); stageState.done = {};
    const left = () => nearestOf(L.kids.filter(x => !stageState.done[x.id]).map(x => x.id));
    L.kids.forEach(k => {
      mark(k.id);
      NPC[k.id].talk = async () => {
        if (stageState.done[k.id]) { await say(k.name, 'Good luck!', '힘내!'); closeDlg(); return; }
        mark(k.id, false);
        const h = HB[k.habit];
        await ask('나', `${k.name}에게 ${h.emoji} ${h.ko}를 얼마나 자주 하는지 물어보세요.`, '알맞은 질문을 고르세요.', HQ(k.habit), { me: true });
        await say(k.name, k.freq, '잘 듣고 습관 차트에 표시해요. (🔊 다시 듣기)', { listen: true, koAlways: true });
        await ask('', `📋 습관 차트 · ${k.name} ${h.emoji} ${h.you}`, '알맞은 빈도수를 고르세요.', freqChoices(k.freq), { sayIt: false, hint: '🔊 다시 듣기' });
        stageState.done[k.id] = 1; closeDlg();
        const n = Object.keys(stageState.done).length;
        if (n < L.kids.length) setObj(`📋 친구에게 얼마나 자주 하는지 물어봐요 (${n}/5)`, left);
        else s2pt1();
      };
    });
    setObj('📋 습관 센터의 친구에게 얼마나 자주 하는지 물어봐요 (0/5)', left);
  };
}
function s2pt1() {
  setObj('🧑‍🏫 <b>Coach Park</b>에게 돌아가요', npcAt('coach')); mark('coach');
  NPC.coach.talk = async () => {
    mark('coach', false); NPC.coach.talk = null;
    await say('Coach Park', "Great job! Let's play a game. Ask me how often I do it!", '잘했어요! 놀이를 해요. 선생님이 얼마나 자주 하는지 물어보세요!');
    for (const a of L.actGame) {
      const h = HB[a.habit];
      await ask('나', `🃏 그림 카드: ${h.emoji} ${h.you}`, 'Play Together 1 · 빈도수만큼 동작하기: 선생님께 물어보세요.', HQ(a.habit), { me: true });
      await say('Coach Park', `${a.answer} One, two, three!`, `${lc(a.answer)} 하나, 둘, 셋!`, { listen: true });
      const opts = [`${a.n}명`, ...shuffle([1, 2, 3, 4, 5].filter(x => x !== a.n)).slice(0, 2).map(x => `${x}명`)];
      await ask('', '🙋 몇 명이 일어나 동작해야 할까요?', `선생님은 "${a.answer}"라고 했어요.`, opts, { sayIt: false, hint: 'once 1 · twice 2 · three times 3 · four times 4 · five times 5' });
      L.kids.slice(0, a.n).forEach(k => hop(k.id, 2.6));
      await say(L.kids[0].name, a.answer, `${a.n}명의 친구가 ${h.ko} 동작을 하며 따라 말해요!`);
    }
    await say('Coach Park', 'Wonderful! You know your habits well.', '훌륭해요! 생활 습관 표현을 잘 아네요.');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  setObj('🩺 동쪽 <b>Health Center</b>의 <b>School Nurse</b>에게 가요', npcAt('nurse')); mark('nurse');
  NPC.nurse.talk = async () => {
    mark('nurse', false); NPC.nurse.talk = null;
    await say('School Nurse', 'Put your hands inside the box, please.', '상자 안에 손을 넣어 보세요.');
    await say('Olivia', 'Okay.', '네.');
    handGlow.material.color.set(0xb197fc); puff(HANDBOX.x, 1.8, HANDBOX.z + 0.6, '🟣 germs!');
    await say('School Nurse', 'Your hands are not clean.', '손이 깨끗하지 않네요.');
    await ask('나', 'School Nurse가 되어 Olivia에게 얼마나 자주 손을 씻는지 물어보세요.', '알맞은 질문을 고르세요.', HQ('wash'), { me: true });
    await say('Olivia', 'Twice a day.', '하루에 두 번이요.', { listen: true });
    await ask('', 'Olivia washes her hands ______.', 'Olivia는 하루에 몇 번 손을 씻나요?', ['twice a day', 'five times a day', 'every day', 'once a week'], { hint: '🔊 다시 듣기' });
    await ask('나', 'School Nurse가 되어 말해요.', '하루에 두 번은 너무 적어요.', ["That's not good. You should wash your hands often.", 'Good for you.', 'Sounds good.', "Let's play basketball after lunch."], { me: true });
    await say('', '', '🎁 선물 선반에서 손 인형을 가져와 Olivia에게 주세요.', { btn: '가져올게!' });
    closeDlg();
    fetchItem('hand doll', '🖐 hand doll', SHELF.x - 1.2, SHELF.z - 1.2, '🎁 <b>Gifts</b> 선반에서 손 인형을 가져와요', 'olivia', '🖐 <b>Olivia</b>에게 손 인형을 줘요', async () => {
      await say('Olivia', 'Thank you. I will wash my hands often.', '고맙습니다. 손을 자주 씻을게요.');
      closeDlg(); s3dental();
    });
  };
}
function s3dental() {
  setObj('🦷 <b>Dental Check</b>의 <b>Doctor</b>에게 가요', npcAt('doctor')); mark('doctor');
  NPC.doctor.talk = async () => {
    mark('doctor', false); NPC.doctor.talk = null;
    await say('Doctor', 'Your teeth are in good condition.', '이가 아주 건강하구나.');
    await say('Joel', 'Thank you.', '고맙습니다.');
    await ask('나', 'Doctor가 되어 Joel에게 얼마나 자주 이를 닦는지 물어보세요.', '알맞은 질문을 고르세요.', HQ('brush'), { me: true });
    await say('Joel', 'Three times a day.', '하루에 세 번이요.', { listen: true });
    await ask('나', 'Doctor가 되어 Joel을 칭찬해 주세요. 👍', '하루에 세 번! 좋은 습관이에요.', ['Good for you.', "That's not good.", 'Open your mouth, please.', "Don't eat too many sweets."], { me: true, hint: 'Good for you. = 잘했구나.' });
    await say('Doctor', "That's a good habit.", '좋은 습관이구나.');
    placeNPC('joel', HOME.joel[0] + 1.2, HOME.joel[1] + 1.4, Math.PI); placeNPC('nara', DENTAL.x - 0.5, DENTAL.z + 1.5, Math.PI);
    await say('Doctor', 'Open your mouth, please. You have two bad teeth. Do you like sweets?', '입을 벌려 보렴. 충치가 두 개 있구나. 단것을 좋아하니?');
    await say('Nara', 'Yes, I do. I eat sweets once or twice a day.', '네. 하루에 한두 번 단것을 먹어요.', { listen: true });
    await ask('나', 'Doctor가 되어 나라에게 조언해 주세요. 🍬', '나라는 충치가 있어요.', ["Don't eat too many sweets. Brush your teeth well, too.", 'Good for you.', 'Eat more sweets.', "Let's go out and exercise."], { me: true });
    await say('Nara', 'Okay. I will.', '네. 그럴게요.');
    await say('', '', '🎁 선물 선반에서 칫솔 인형을 가져와 나라에게 주세요.', { btn: '가져올게!' });
    closeDlg();
    fetchItem('toothbrush doll', '🪥 toothbrush doll', SHELF.x + 1.2, SHELF.z - 1.2, '🎁 <b>Gifts</b> 선반에서 칫솔 인형을 가져와요', 'nara', '🪥 <b>Nara</b>에게 칫솔 인형을 줘요', async () => {
      await say('Nara', 'Thank you!', '고맙습니다!');
      await ask('', 'What did the doctor say to praise Joel?', '의사 선생님은 Joel을 칭찬하며 뭐라고 말했나요?', ['Good for you.', "That's not good.", 'Open your mouth, please.'], { sayIt: false });
      closeDlg(); s3talk();
    });
  };
}
function s3talk() {
  placeNPC('nurse', BOARD.x + 1.6, 6.2, Math.PI);
  setObj('📋 <b>Read and Talk</b> 게시판의 <b>School Nurse</b>에게 가요', npcAt('nurse')); mark('nurse');
  NPC.nurse.talk = async () => {
    mark('nurse', false); NPC.nurse.talk = null;
    await say('School Nurse', 'Read the cards. Ask and answer!', '카드를 읽고 묻고 답해 보세요!');
    for (const c of shuffle(L.readTalk).slice(0, 3)) {
      const h = HB[c.habit];
      await ask('나', `🃏 ${h.emoji} ${h.you} / ${lc(c.freq).replace('.', '')}`, 'Read and Talk · 카드를 보고 물어보세요.', HQ(c.habit), { me: true });
      const ans = (f) => `I ${h.my} ${lc(f)}`;
      await ask('나', `${habitQ(c.habit)}`, '카드에 맞게 대답해요.', [ans(c.freq), ...shuffle(FREQS.filter(f => f !== c.freq)).slice(0, 2).map(ans)], { me: true });
      await say('School Nurse', 'Good for you.', '잘했구나.');
    }
    closeDlg(); s3pt2();
  };
}
function s3pt2() {
  placeNPC('kai', 16.5, -9, Math.PI / 2); placeNPC('rani', 16.5, -6.5, Math.PI / 2); placeNPC('hajun', 16.5, -4, Math.PI / 2);
  setObj('🎲 보건소 앞의 <b>Kai</b>와 빈도수 예상하기 놀이를 해요', npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await say('Kai', "Let's play a game! Guess how often we do it.", '놀이하자! 우리가 얼마나 자주 하는지 예상해 봐.');
    let hit = 0;
    for (const g of L.guessGame) {
      const h = HB[g.habit], unitKo = { day: '하루에', week: '일주일에', month: '한 달에' }[g.unit];
      const gi = await pick('나', `🤔 ${g.who}는 ${unitKo} 몇 번 ${h.emoji} ${h.ko}를 할까요?`, 'Play Together 2 · 빈도수 예상하기: 예상해서 골라 보세요.', [1, 2, 3, 4, 5, 6].map(n => `${n}번`));
      await ask('나', `${g.who}에게 물어보세요.`, '알맞은 질문을 고르세요.', HQ(g.habit), { me: true });
      const f = freqText(g.n, g.unit);
      await say(g.who, f, '잘 들어 보세요. (🔊 다시 듣기)', { listen: true, koAlways: true });
      await ask('', `${g.who}: I ${h.my} ______ a ${g.unit}.`, '친구가 말한 빈도수를 고르세요.', [L.numWords[g.n].toLowerCase(), ...shuffle([1, 2, 3, 4, 5, 6].filter(x => x !== g.n)).slice(0, 2).map(x => L.numWords[x].toLowerCase())], { sayIt: false });
      if (gi + 1 === g.n) { hit++; addStar(); beep('star'); toast(`⭕ 예상 적중! ${g.who}: ${f} 보너스 ⭐`, 2400); }
      else toast(`내 예상: ${gi + 1}번 · ${g.who}: ${f}`, 2400);
    }
    await say('Kai', `You got ${hit} right! Good for you.`, `${hit}개를 맞혔어! 잘했어.`);
    nextStage();
  };
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('coach', 0, 11, Math.PI);
  setObj('🧱 마을 가운데의 <b>Coach Park</b>에게 가요', npcAt('coach')); mark('coach');
  NPC.coach.talk = async () => {
    mark('coach', false); NPC.coach.talk = null;
    await say('Coach Park', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '마을 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['often', 'times', 'week.', 'day.', 'month.', 'twice', 'brush', 'clean', 'Good', 'exercise?', 'my', 'your', 'once'].filter(w => !words.includes(w));
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
  await say('Coach Park', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. The Sound of Music (Reading) ----
const OX = ['⭕ O (맞아요)', '❌ X (틀려요)'];
function stage5() {
  setObj('📖 북쪽 <b>Story Garden</b>의 <b>Trapp House</b>에서 <b>Maria</b>에게 가요', npcAt('maria')); mark('maria');
  NPC.maria.talk = async () => {
    mark('maria', false); NPC.maria.talk = null;
    await say('', '', '📖 Before You Read · 글을 읽으며 빈도수를 나타내는 표현(… a week, … a month, every day)을 찾아보세요.', { btn: '읽기 시작' });
    await readLines(L.reading.house);
    await ask('', 'Brigitta likes reading books.', '글의 내용과 맞으면 O, 틀리면 X', OX, { noShuffle: true, sayIt: false });
    await ask('Brigitta', 'I read books ______ a week.', '빈칸에 알맞은 말', ['five times', 'twice', 'once'], { sayIt: false });
    closeDlg();
    setObj('🚪 집 앞의 <b>Kurt</b>에게 가요', npcAt('kurt')); mark('kurt');
    NPC.kurt.talk = async () => {
      mark('kurt', false); NPC.kurt.talk = null;
      placeNPC('maria', HOME.kurt[0] - 1.6, HOME.kurt[1] - 0.8, Math.PI / 2);
      await readLines(L.reading.out);
      await ask('', 'Kurt wants to stay home.', '글의 내용과 맞으면 O, 틀리면 X', OX, { noShuffle: true, sayIt: false });
      await ask('Kurt', 'I exercise twice a ______.', '빈칸에 알맞은 말', ['month', 'week', 'day'], { sayIt: false });
      closeDlg();
      placeNPC('maria', MEADOW.x + 0.9, MEADOW.z - 1.3, 0); placeNPC('brigitta', MEADOW.x - 2.2, MEADOW.z - 1.8, Math.PI / 4); placeNPC('kurt', MEADOW.x + 2.8, MEADOW.z - 2.2, -Math.PI / 4);
      const gt = itemModel('guitar'); gt.scale.setScalar(1.6); gt.position.set(MEADOW.x + 1.3, 0.75, MEADOW.z - 1.0); gt.rotation.z = 0.5; addDecor(gt);
      setObj('🎸 <b>Park Meadow</b>의 <b>Gretl</b>에게 가요', npcAt('gretl')); mark('gretl');
      NPC.gretl.talk = async () => {
        mark('gretl', false); NPC.gretl.talk = null;
        await readLines(L.reading.park);
        await say('', '', 'After You Read · 글의 내용을 확인해요.', { btn: '시작' });
        await ask('', "I'm good at playing the piano. (Maria)", '글의 내용과 맞으면 O, 틀리면 X', OX, { right: OX[1], noShuffle: true, sayIt: false, hint: 'Gretl: "You\'re good at playing the ______."' });
        await ask('', "I'm reading Romeo and Juliet. (Maria)", '글의 내용과 맞으면 O, 틀리면 X', OX, { right: OX[1], noShuffle: true, sayIt: false, hint: 'Romeo and Juliet을 읽는 사람은 Brigitta예요.' });
        await ask('', 'How often does Maria play the guitar?', 'Maria는 얼마나 자주 기타를 연주하나요?', ['Every day.', 'Twice a month.', 'Five times a week.'], { sayIt: false });
        await say('Maria', 'Thanks. I play the guitar every day. How about singing together?', '고마워. 나는 기타를 매일 연주해. 같이 노래하는 게 어떠니?');
        nextStage();
      };
    };
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("✏️ 남서쪽 <b>Habit Survey</b> 책상의 <b>Jina</b>에게 가요", npcAt('jina')); mark('jina');
  NPC.jina.talk = async () => {
    mark('jina', false);
    await say('Jina', 'Read my habit survey!', '내 생활 습관 설문지를 읽어 줘!');
    await readLines(L.writeSample);
    await ask('', 'How often does Jina exercise?', '지나는 얼마나 자주 운동하나요?', ['Four times a week.', 'Every day.', 'Twice a week.']);
    await say('Jina', 'Now, write your habit survey!', '이제 너의 생활 습관 설문지를 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const fOpt = L.writeFreq.map((a, i) => `<option value="${i}">${a[0]} (${a[1]})</option>`).join('');
  const hOpt = L.writeHabits.map((a, i) => `<option value="${i}">${a[0]} (${a[2]})</option>`).join('');
  for (const id of ['#wF1', '#wF2', '#wF3', '#wF4']) $(id).innerHTML = fOpt;
  $('#wH3').innerHTML = hOpt; $('#wH4').innerHTML = hOpt;
  $('#wF1').value = 7; $('#wF2').value = 0; $('#wH3').value = 0; $('#wF3').value = 2; $('#wH4').value = 2; $('#wF4').value = 5;
  if (S.card) { $('#wMe').value = S.card.me; ['f1', 'f2', 'h3', 'f3', 'h4', 'f4'].forEach(k => { $('#w' + k.toUpperCase()).value = S.card[k]; }); }
  const upd = () => { $('#wPreview').innerHTML = letterHTML(letterData()); };
  f.oninput = upd; f.onchange = upd; upd();
  $('#wRead').onclick = () => speak(letterText(letterData()).map(l => l[1]).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = letterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.me)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if (c.h3 === c.h4) { toast('3번과 4번 질문의 생활 습관을 서로 다르게 골라 주세요.'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).slice(1).map(l => l[1]).join(' '), '나');
    await say('Jina', 'Great survey! Good for you.', '멋진 설문지야! 잘했어.');
    nextStage(); showEnd();
  };
}
function letterData() { return { me: $('#wMe').value.trim(), f1: +$('#wF1').value, f2: +$('#wF2').value, h3: +$('#wH3').value, f3: +$('#wF3').value, h4: +$('#wH4').value, f4: +$('#wF4').value }; }
function letterText(c) {
  const F = (i) => (L.writeFreq[i] || L.writeFreq[0])[0], H = (i) => L.writeHabits[i] || L.writeHabits[0];
  return [['Name', c.me || '____'],
    ['Q', 'How often do you exercise?'], ['A', `I exercise ${F(c.f1)}.`],
    ['Q', 'How often do you eat breakfast?'], ['A', `I eat breakfast ${F(c.f2)}.`],
    ['Q', `How often do you ${H(c.h3)[0]}?`], ['A', `I ${H(c.h3)[1]} ${F(c.f3)}.`],
    ['Q', `How often do you ${H(c.h4)[0]}?`], ['A', `I ${H(c.h4)[1]} ${F(c.f4)}.`]];
}
function letterHTML(c) {
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  return '<div class="cardPrev">' + letterText(c).map(l => `<div><b style="color:var(--accent)">${esc(l[0])}</b> ${esc(l[1])}</div>`).join('') + '</div>';
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>ee 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · ee 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? letterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? letterText(S.card).map(l => l[0] + ': ' + l[1]).join(' ') : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 ee 코인 ----
const TH_SPOTS = [[-40, 18], [38, -32], [-20, -42], [36, 40], [-36, -36], [40, 10]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('ee', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('ee', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Lee');
      toast(`🪙 ee 코인: <b>${w.replace('ee', '<u>ee</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 ee 코인을 모두 모았어요! I exercise three times a week.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Lee', "Hi! I'm Lee. I exercise three times a week.", '안녕! 나는 Lee야. 나는 일주일에 세 번 운동해.');
  await say('Lee', 'Listen: three, week, teeth. ee, ee, ee!', 'Sounds and Letters · ee(/i:/) 소리를 들어 보세요. 우리말 [이]보다 길게 소리 내요.');
  await say('', '', `🪙 마을 구석구석에 숨은 ee 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
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
