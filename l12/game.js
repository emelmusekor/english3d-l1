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
const SAVE_KEY = 'english3d_l12_v1';
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
// ---------- 배경 음악 (파일 없이 만드는 잔잔한 가락, 단원마다 조·빠르기가 달라요) ----------
const BGM = { on: false, gain: null, next: 0, step: 0, timer: 0 };
function bgmStart() {
  if (BGM.on || MUTE || /[?&]autotest/.test(location.search)) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended' && AC.resume) AC.resume();
    const n = parseInt(String(L.id || 'L1').replace(/\D/g, ''), 10) || 1;
    const root = 196 * Math.pow(2, [0, 2, 4, 5, 7, 9][n % 6] / 12), beat = 0.34 + (n % 4) * 0.03;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16], prog = [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]];
    const seed = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 5, 7, 5, 4, 2].map((v, i) => (v + n * (i % 3)) % scale.length);
    BGM.gain = AC.createGain(); BGM.gain.gain.value = 0.0001; BGM.gain.connect(AC.destination);
    const note = (f, t, d, v, type) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(BGM.gain); o.start(t); o.stop(t + d + 0.05); };
    BGM.on = true; BGM.next = AC.currentTime + 0.1; BGM.step = 0;
    BGM.timer = setInterval(() => {
      try {
        if (!BGM.on) return;
        let talking = false; try { talking = speechSynthesis.speaking; } catch (e) {}
        BGM.gain.gain.setTargetAtTime(MUTE || document.hidden ? 0.0001 : talking ? 0.012 : 0.05, AC.currentTime, 0.25);
        while (BGM.next < AC.currentTime + 0.5) {
          const s = BGM.step++, bar = (s >> 3) % 4, ch = prog[bar];
          if (s % 8 === 0) ch.forEach((c, i) => note(root * Math.pow(2, (c - 12) / 12), BGM.next, beat * 7.5, 0.16 - i * 0.03, 'sine'));
          if (s % 2 === 0 && !((s >> 5) % 4 === 3 && s % 8 > 3)) note(root * Math.pow(2, scale[seed[(s >> 1) % 16]] / 12), BGM.next, beat * 1.7, 0.2, 'triangle');
          if (s % 8 === 4) note(root * Math.pow(2, (ch[1] + 12) / 12), BGM.next, beat * 0.9, 0.07, 'sine');
          BGM.next += beat;
        }
      } catch (e) {}
    }, 150);
  } catch (e) { BGM.on = false; }
}
function bgmStop() { BGM.on = false; clearInterval(BGM.timer); try { BGM.gain.gain.setTargetAtTime(0.0001, AC.currentTime, 0.1); } catch (e) {} }
document.addEventListener('pointerdown', () => bgmStart(), { passive: true });
document.addEventListener('keydown', () => bgmStart());
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
  Kai: [0, 1.1], Sister: [1, 1.5], Dad: [0, 0.85], Mom: [1, 1.05], Brother: [0, 1.0], 'Ms. Lee': [1, 1.1], Yuna: [1, 1.35], Andy: [0, 1.15],
  Rani: [1, 1.4], Joel: [0, 1.15], Hajun: [0, 1.1], 'Ms. Smith': [1, 1.0], Minho: [0, 1.15], Grace: [1, 1.35], Tom: [0, 1.2],
  Leo: [0, 1.15], Ava: [1, 1.3], Ben: [0, 1.05], Zoe: [1, 1.4], Emma: [1, 1.3], Sam: [0, 1.2], Lily: [1, 1.45], Ling: [1, 1.25], Narrator: [1, 1.0], '나': [0, 1.0]
};
function speak(text, who) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/’/g, "'"));
    u.lang = 'en-US'; u.rate = S.rate;
    const name = String(who || '');
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    const known = VOICE[name];
    const girl = known ? known[0] : /mom|ms\.|mrs\.|miss|girl|grandma|aunt|sister|nurse|queen/i.test(name) ? 1 : /dad|mr\.|man|boy|grandpa|uncle|brother|king/i.test(name) ? 0 : h % 2;
    const adult = /mom|dad|ms\.|mrs\.|mr\.|teacher|doctor|dr\.|nurse|chef|server|clerk|baker|man|woman|staff|guide|officer|driver|grand|coach|narrator/i.test(name);
    // 사람마다 목소리가 조금씩 달라요: 목소리 종류 + 높낮이 + 빠르기
    let pitch = known ? known[1] : (adult ? 0.95 : 1.2);
    pitch += ((h % 7) - 3) * 0.04 + (adult ? -0.08 : 0.05);
    u.pitch = Math.max(0.6, Math.min(1.8, pitch));
    u.rate = S.rate * (1 + (((h >> 3) % 5) - 2) * 0.03) * (adult ? 0.97 : 1.02);
    const fem = /zira|samantha|female|aria|jenny|susan|michelle|ana|emma|sonia|libby|natasha|clara|hazel|catherine|karen|moira|tessa|victoria|allison|ava|google us english|google uk english female/i;
    const mal = /david|mark|guy|\bmale|daniel|alex|ryan|eric|christopher|brian|george|james|william|thomas|fred|tom|aaron|google uk english male/i;
    const en = voices.filter(v => /^en[-_](US|GB|AU|CA)/i.test(v.lang));
    let pool = en.filter(v => girl ? fem.test(v.name) && !/\bmale/i.test(v.name.replace(/female/i, '')) : mal.test(v.name) && !/female/i.test(v.name));
    if (!pool.length) pool = en.filter(v => /en[-_]US/i.test(v.lang)); if (!pool.length) pool = en.length ? en : voices;
    const us = pool.filter(v => /en[-_]US/i.test(v.lang)); const order = us.concat(pool.filter(v => !us.includes(v)));
    const v = name === '나' ? order[0] : order[(h >> 5) % order.length];
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
      o.userData.grassHex = o.material.color.getHex(); o.material = new THREE.MeshStandardMaterial({ map: grassTexture(o.userData.grassHex), roughness: 1 }); o.userData.grass = 1;
    } else if (flat && p.width * p.height >= 300 && o.material.color && !o.material.map && !o.material.transparent && Math.abs(o.rotation.x + Math.PI / 2) < 0.01) {
      o.material = new THREE.MeshStandardMaterial({ map: paveTexture(o.material.color.getHex(), p.width, p.height), roughness: 0.95 });
    }
    o.receiveShadow = true;
    o.castShadow = !flat && !ms[0].transparent && !(p.radius > 20) && !o.userData.ns;
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
  fx2Tick(dt, now / 1000);
}
// 개발용: ?perf 로 그리기 횟수(draw call)·삼각형 수를 재요
try { if (new URLSearchParams(location.search).has('perf')) setTimeout(() => { let now = performance.now(); for (let i = 0; i < 8; i++) { now += 400; update(0.05, now / 1000); gfxTick(0.4, now); renderer.render(scene, camera); } const r = renderer.info.render; let meshes = 0; scene.traverse(o => { if (o.isMesh && o.visible) meshes++; }); document.title = 'PERF calls=' + r.calls + ' tris=' + r.triangles + ' geo=' + renderer.info.memory.geometries + ' meshes=' + meshes + ' people=' + Object.keys(NPC).length; }, 2500); } catch (e) {}
// 사람 한 명 움직이기. f = { talk: 말하는 중, wave: 손 흔들기, look: [x, z] 바라볼 곳 }
function animatePerson(g, t, dt, f) {
  const a = g.userData.anim; if (!a || !g.visible) return;
  dt = Math.max(0, Math.min(0.1, dt || 0));
  const p = g.position, step = a.lx === undefined ? 0 : Math.hypot(p.x - a.lx, p.z - a.lz), moving = step > 0.002 && step < 0.5;
  a.lx = p.x; a.lz = p.z;
  // 멀리 있는 사람은 얼굴 부품을 숨기고 움직임 계산도 쉬어요
  const far = Math.hypot(p.x - camera.position.x, p.z - camera.position.z) > (GFX.high ? 40 : 24);
  if (far !== !!a.far) { a.far = far; a.eyes.forEach(e => { e.visible = !far; }); a.smile.visible = !far; if (far) { a.mouth.visible = false; a.walk = 0; a.armL.rotation.x = a.baseL; a.armR.rotation.x = a.baseR; a.legL.rotation.x = a.legR.rotation.x = 0; } }
  a.blob.visible = !GFX.high;
  if (far) return;
  a.walk = moving ? Math.min(1, a.walk + dt * 6) : Math.max(0, a.walk - dt * 4);
  a.wave += ((f && f.wave && !moving ? 1 : 0) - a.wave) * Math.min(1, dt * 7);
  const run = f && f.run ? 1 : 0, air = f && f.air ? 1 : 0; a.air = (a.air || 0) + (air - (a.air || 0)) * Math.min(1, dt * 12);
  const sw = Math.sin(t * (run ? 13 : 9) + a.ph) * (run ? 1.0 : 0.7) * a.walk, br = Math.sin(t * 2.2 + a.ph), still = 1 - a.walk;
  a.armL.rotation.x = sw + a.baseL * still - a.air * 0.5; a.armR.rotation.x = (-sw + a.baseR * still) * (1 - a.wave) - a.air * 0.5; a.legL.rotation.x = -sw * 0.8 + a.air * 0.5; a.legR.rotation.x = sw * 0.8 - a.air * 0.35;
  a.armL.rotation.z = -0.12 - still * br * 0.03 - a.air * 1.1; a.armR.rotation.z = 0.12 + still * br * 0.03 + a.wave * (2.45 + Math.sin(t * 9) * 0.3) + a.air * 1.1;
  a.body.scale.set(1, 1 + br * 0.015, 0.85); a.head.position.y = a.hy + br * 0.008 + a.walk * Math.abs(Math.sin(t * 9 + a.ph)) * 0.02;
  const bl = ((t + a.ph) % 4.2) < 0.13 ? 0.15 : 1; a.eyes.forEach(e => { e.scale.y = bl; });
  let ty = 0;
  if (f && f.look) { const dx = f.look[0] - p.x, dz = f.look[1] - p.z, d = Math.hypot(dx, dz); if (d < 7 && d > 0.3) { let r = Math.atan2(dx, dz) - g.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); if (Math.abs(r) < 2) ty = Math.max(-1, Math.min(1, r)); } }
  a.look += (ty - a.look) * Math.min(1, dt * 5); a.headG.rotation.y = a.look; a.headG.rotation.z = Math.sin(t * 1.3 + a.ph) * 0.03 * still;
  const talk = !!(f && f.talk); a.mouth.visible = talk; a.smile.visible = !talk;
  if (talk) a.mouth.scale.y = 0.25 + Math.abs(Math.sin(t * 13 + a.ph)) * 0.75;
  a.blob.visible = !GFX.high;
}
const extraPeople = []; // 엔진 밖에서 만든 사람(다른 친구 등)도 여기 넣으면 같이 움직여요
function animatePeople(t, dt) {
  if (typeof NPC === 'undefined') return;
  let who = '', speaking = false;
  try { if (dlgOpen) { who = ui.who.textContent; speaking = !!(window.speechSynthesis && speechSynthesis.speaking); } } catch (e) {}
  const me = [P.x, P.z];
  for (const n of Object.values(NPC)) {
    const near = Math.hypot(P.x - n.g.position.x, P.z - n.g.position.z);
    animatePerson(n.g, t, dt, { look: me, talk: speaking && who === n.name && near < 9, wave: !dlgOpen && n.g.userData.mark.visible && near < 7 && near > 1.2 });
  }
  for (const e of extraPeople) animatePerson(e.g || e, t, dt, e.flags || null);
}
// ---------- 2.0 꾸미기: 꽃·덤불·둥근 나무·나비·새·꽃가루·반짝임·얼굴 그림 ----------
const FX2 = { ready: false, tickers: [], butter: [], birds: [], stage: -1, pollen: null, snow: false };
const vig = document.createElement('div'); vig.id = 'vig'; canvas.after(vig);
const fade2 = document.createElement('div'); fade2.id = 'fade2'; document.body.appendChild(fade2);
sun.color.set(0xffe6c2); renderer.toneMappingExposure = 1.06;
const haloTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(255,250,210,.95)'); g.addColorStop(0.35, 'rgba(255,225,120,.4)'); g.addColorStop(1, 'rgba(255,220,100,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const talkRing = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 32), new THREE.MeshBasicMaterial({ color: 0x20c997, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide }));
talkRing.rotation.x = -Math.PI / 2; talkRing.position.y = 0.05; talkRing.visible = false; scene.add(talkRing);
// 얼굴 그림(초상화): 사람 모델을 작은 그림으로 찍어요
const PORT = { cache: {}, N: 224 };
function portrait(opts, key) {
  if (PORT.cache[key] !== undefined) return PORT.cache[key];
  let url = '';
  try {
    const N = PORT.N;
    if (!PORT.rt) {
      PORT.rt = new THREE.WebGLRenderTarget(N, N);
      PORT.scene = new THREE.Scene(); PORT.scene.add(new THREE.HemisphereLight(0xffffff, 0xc8b8a0, 1.7));
      const d = new THREE.DirectionalLight(0xfff4e0, 1.7); d.position.set(1.5, 2.5, 3); PORT.scene.add(d);
      PORT.cam = new THREE.PerspectiveCamera(26, 1, 0.1, 20); PORT.cam.position.set(0, 1.68, 2.45); PORT.cam.lookAt(0, 1.63, 0);
    }
    const g = makePerson(Object.assign({}, opts, { scale: 1, adult: opts.adult != null ? opts.adult : undefined }));
    g.scale.setScalar(1); g.userData.tag.visible = false; g.userData.mark.visible = false; g.rotation.y = 0.32; PORT.scene.add(g);
    const prev = renderer.getRenderTarget(), pc = renderer.getClearColor(new THREE.Color()), pa = renderer.getClearAlpha();
    renderer.setRenderTarget(PORT.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(PORT.scene, PORT.cam);
    const buf = new Uint8Array(N * N * 4); renderer.readRenderTargetPixels(PORT.rt, 0, 0, N, N, buf);
    renderer.setRenderTarget(prev); renderer.setClearColor(pc, pa); PORT.scene.remove(g);
    const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
    const lut = new Uint8Array(256); for (let i = 0; i < 256; i++) lut[i] = Math.round(255 * Math.pow(i / 255, 1 / 2.2));
    for (let y = 0; y < N; y++) for (let k = 0; k < N; k++) { const s = ((N - 1 - y) * N + k) * 4, d = (y * N + k) * 4; im.data[d] = lut[buf[s]]; im.data[d + 1] = lut[buf[s + 1]]; im.data[d + 2] = lut[buf[s + 2]]; im.data[d + 3] = buf[s + 3]; }
    x.putImageData(im, 0, 0); url = c.toDataURL('image/png');
  } catch (e) { url = ''; }
  return (PORT.cache[key] = url);
}
// 내 캐릭터
const AVATARS = ['Nara', 'Hajun', 'Olivia', 'Kai', 'Rani', 'Joel'];
const avatarKey = () => { let k = null; try { k = localStorage.getItem('english3d_avatar'); } catch (e) {} return AVATARS.includes(k) ? k : 'Nara'; };
window.__avatar = {
  list: AVATARS,
  get: () => ({ key: avatarKey() }),
  set: (k) => { if (AVATARS.includes(k)) try { localStorage.setItem('english3d_avatar', k); } catch (e) {} },
  make: (o = {}) => makePerson({ name: o.name || '친구', look: o.look || o.key || avatarKey(), scale: o.scale, adult: false }),
  portrait: (k) => portrait({ name: k || avatarKey() }, 'av:' + (k || avatarKey())),
  animate: (g, t, dt, flags) => animatePerson(g, t, dt, flags),
  people: null
};
function initUI2() {
  window.__avatar.people = extraPeople;
  try { // 개발용: ?cast=1 이면 여섯 친구를 한 줄로 세워요
    if (new URLSearchParams(location.search).has('cast')) AVATARS.forEach((k, i) => { const g = makePerson({ name: k }); g.position.set(P.x + i * 1.0 - 2.5, 0, P.z - 3.2); scene.add(g); extraPeople.push({ g, flags: { look: [P.x, P.z], wave: i === 3, talk: i === 1 } }); });
  } catch (e) {}
  try {
    const sub = document.querySelector('#title .sub'); if (sub) { const v = document.createElement('span'); v.className = 'ver'; v.textContent = 'v2.2'; sub.appendChild(v); }
    const bs = document.querySelector('#btnStart');
    if (bs) {
      const w = document.createElement('div'); w.className = 'avatarPick';
      w.innerHTML = '<div class="apT">🙋 내 캐릭터를 골라요</div><div class="apRow">' + AVATARS.map(k => `<button type="button" data-k="${k}"><img alt="" src="${window.__avatar.portrait(k)}"><span>${k}</span></button>`).join('') + '</div>';
      bs.parentElement.insertBefore(w, bs);
      const mark = () => w.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === avatarKey()));
      w.querySelectorAll('button').forEach(b => b.onclick = () => { window.__avatar.set(b.dataset.k); mark(); setMe(); try { beep('ok'); } catch (e) {} });
      mark();
    }
    const me = document.createElement('img'); me.id = 'meFace'; me.alt = ''; ui.stars.parentElement.insertBefore(me, ui.stars.parentElement.firstChild);
    const setMe = () => { const u = window.__avatar.portrait(); if (u) me.src = u; else me.style.display = 'none'; }; setMe();
    // 대화 상자에 말하는 사람 얼굴
    const face = document.createElement('img'); face.id = 'dlgFace'; face.alt = ''; ui.dlg.appendChild(face);
    const upd = () => {
      const who = ui.who.textContent; let u = '';
      if (who === '나') u = window.__avatar.portrait();
      else { const n = Object.values(NPC).find(n => n.name === who); if (n) u = portrait(n.g.userData.opts, 'npc:' + who); }
      if (u) face.src = u; ui.dlg.classList.toggle('hasFace', !!u);
    };
    new MutationObserver(upd).observe(ui.who, { childList: true, characterData: true, subtree: true }); upd();
  } catch (e) {}
}
// 가로등·분수 물방울 (단원 세계에서 불러 쓸 수 있어요)
function lampPost2(x, z) {
  cyl(0.09, 0.13, 3.6, 0x495057, x, 1.8, z); cyl(0.22, 0.09, 0.18, 0x495057, x, 3.66, z);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 9), new THREE.MeshStandardMaterial({ color: 0xfff3bf, emissive: 0xffe08a, emissiveIntensity: 0.9, roughness: 0.4 })); b.position.set(x, 3.95, z); b.userData.ns = 1; scene.add(b);
  block(x - 0.2, z - 0.2, x + 0.2, z + 0.2);
}
function fountainFx(x, y, z, r = 1.6) {
  const n = 28, drops = [], m = new THREE.MeshStandardMaterial({ color: 0xd0ebff, emissive: 0x74c0fc, emissiveIntensity: 0.5, roughness: 0.2, transparent: true, opacity: 0.85 });
  for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), m); d.userData.ns = 1; scene.add(d); drops.push(d); }
  FX2.tickers.push((dt, t) => { drops.forEach((d, i) => { const k = (t * 0.7 + i / n * 3.1) % 1, a = i * 2.4; d.position.set(x + Math.cos(a) * r * k, y + 1.4 * k * 4 * (1 - k) - k * (y - 0.9), z + Math.sin(a) * r * k); d.visible = GFX.high || i % 2 === 0; }); });
}
const leafMats = {};
function leafMat(hex) { return leafMats[hex] || (leafMats[hex] = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95, flatShading: true })); }
function decorate() {
  let ground = null; const covers = [], cones = [];
  const walk = (o) => {
    if (o.userData.anim || o.isSprite || o.isPoints || o.isInstancedMesh || o === sky || o === clouds || !o.visible) return;
    if (o.isMesh) {
      if (o.userData.grass) { if (!ground || o.geometry.parameters.width > ground.geometry.parameters.width) ground = o; }
      else {
        const gp = o.geometry.parameters || {};
        if (o.geometry.type === 'ConeGeometry' && o.parent === scene && gp.radialSegments >= 8 && gp.radius >= 1 && gp.radius <= 2.8 && gp.height >= 2.4) cones.push(o);
        if (!(gp.radius > 20)) { const b = new THREE.Box3().setFromObject(o); if (b.min.y < 1.2 && b.max.y > 0.004 && b.max.x - b.min.x < 150) covers.push([b.min.x - 0.25, b.max.x + 0.25, b.min.z - 0.25, b.max.z + 0.25]); }
      }
    }
    for (const c of o.children) walk(c);
  };
  walk(scene);
  // 뾰족한 나무 → 둥글둥글한 나무
  for (const c of cones) {
    const col = c.material.color, h = col.getHSL({}); if (!((h.h > 0.18 && h.h < 0.47) || ((h.h > 0.85 || h.h < 0.06) && h.l > 0.6))) continue;
    const r = c.geometry.parameters.radius * c.scale.x, H = c.geometry.parameters.height * c.scale.y, hex = col.getHex();
    const G = new THREE.Group(); G.position.copy(c.position);
    [[0, -0.22 * H, 0, 0.95], [0.5, -0.05 * H, 0.25, 0.68], [-0.45, 0.0, -0.3, 0.72], [0.05, 0.2 * H, 0.05, 0.66]].forEach(([dx, dy, dz, k], i) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * k, 1), leafMat(shade(hex, [0, 0.04, -0.035, 0.07][i]))); m.position.set(dx * r, dy, dz * r); m.rotation.y = i * 1.3; G.add(m);
    });
    c.visible = false; scene.add(G);
  }
  if (!ground) return;
  const gh = new THREE.Color(ground.userData.grassHex).getHSL({});
  const green = gh.h > 0.17 && gh.h < 0.48 && gh.s > 0.18; FX2.snow = gh.l > 0.82 && gh.s < 0.35;
  const free = (x, z) => { for (const c of covers) if (x > c[0] && x < c[1] && z > c[2] && z < c[3]) return false; return true; };
  let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (tries, max, pad = 0) => { const out = []; for (let i = 0; i < tries && out.length < max; i++) { const x = (rnd() - 0.5) * 88, z = (rnd() - 0.5) * 88; if (free(x, z) && (!pad || (free(x + pad, z) && free(x - pad, z) && free(x, z + pad) && free(x, z - pad)))) out.push([x, z]); } return out; };
  const hi = GFX.high, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  if (green) {
    // 풀 포기
    const tf = pick(5000, hi ? 1100 : 260);
    if (tf.length) { const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.16, 0.5, 5), new THREE.MeshStandardMaterial({ color: shade(ground.userData.grassHex, -0.09), roughness: 1 }), tf.length); tf.forEach(([x, z], i) => { const k = 0.6 + rnd() * 0.8; v.set(x, 0.22 * k, z); sc.set(k, k, k); m4.compose(v, q, sc); im.setMatrixAt(i, m4); }); im.userData.pol = 1; im.receiveShadow = true; scene.add(im); }
    // 꽃 무리
    const cl = pick(2500, hi ? 120 : 40, 0.5), fl = [];
    const FC = [0xff6b6b, 0xffd43b, 0xffffff, 0xf783ac, 0xb197fc, 0xffa94d];
    cl.forEach(([x, z], ci) => { const n = 3 + (ci % 4); for (let i = 0; i < n; i++) fl.push([x + (rnd() - 0.5) * 1.1, z + (rnd() - 0.5) * 1.1, FC[(ci + (i % 2)) % FC.length], 0.26 + rnd() * 0.16]); });
    if (fl.length) {
      const pet = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 7, 5), new THREE.MeshStandardMaterial({ roughness: 0.8 }), fl.length);
      const cen = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 6, 5), new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.8 }), fl.length);
      const stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.013, 0.013, 1, 4), new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 1 }), fl.length);
      fl.forEach(([x, z, c, h], i) => {
        v.set(x, h, z); sc.set(1, 0.45, 1); m4.compose(v, q, sc); pet.setMatrixAt(i, m4); pet.setColorAt(i, col.set(c));
        v.set(x, h + 0.04, z); sc.set(1, 1, 1); m4.compose(v, q, sc); cen.setMatrixAt(i, m4);
        v.set(x, h / 2, z); sc.set(1, h, 1); m4.compose(v, q, sc); stem.setMatrixAt(i, m4);
      });
      for (const im of [pet, cen, stem]) { im.userData.pol = 1; scene.add(im); }
    }
    // 덤불
    const bu = pick(900, hi ? 40 : 14, 1.1);
    if (bu.length) { const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.55, 1), leafMat(0x4f9d46), bu.length); bu.forEach(([x, z], i) => { const k = 0.7 + rnd() * 0.7; v.set(x, 0.3 * k, z); sc.set(k * 1.2, k * 0.85, k * 1.2); m4.compose(v, q, sc); im.setMatrixAt(i, m4); }); im.userData.pol = 1; im.castShadow = true; im.receiveShadow = true; scene.add(im); }
    // 나비
    const BC = [0xffd43b, 0xff8787, 0x74c0fc, 0xffffff, 0xda77f2, 0xffa94d];
    const wg = new THREE.PlaneGeometry(0.2, 0.24); wg.translate(0.1, 0, 0); wg.rotateX(-Math.PI / 2);
    cl.slice(0, 7).forEach(([x, z], i) => {
      const G = new THREE.Group(), mt = new THREE.MeshBasicMaterial({ color: BC[i % BC.length], side: THREE.DoubleSide });
      const a = new THREE.Mesh(wg, mt), b = new THREE.Mesh(wg, mt); b.scale.x = -1; G.add(a); G.add(b); scene.add(G);
      FX2.butter.push({ G, a, b, x, z, ph: i * 1.7 });
    });
  }
  // 새
  for (let i = 0; i < 5; i++) {
    const G = new THREE.Group(), mt = new THREE.MeshBasicMaterial({ color: 0x4a5568, fog: false });
    const wgeo = new THREE.BoxGeometry(1.5, 0.06, 0.45); wgeo.translate(0.75, 0, 0);
    const a = new THREE.Mesh(wgeo, mt), b = new THREE.Mesh(wgeo, mt); b.scale.x = -1; G.add(a); G.add(b); scene.add(G);
    G.traverse(o => { o.userData.ns = 1; });
    FX2.birds.push({ G, a, b, r: 45 + i * 9, y: 30 + i * 3.5, sp: 0.07 + i * 0.012, ph: i * 1.9 });
  }
  // 꽃가루 (눈 오는 곳에서는 눈송이)
  const n = FX2.snow ? 160 : 46, pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) base.push([rnd() * 18, rnd() * (FX2.snow ? 9 : 3.6) + 0.3, rnd() * 18, rnd() * 6]);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: FX2.snow ? 0.11 : 0.06, color: FX2.snow ? 0xffffff : 0xfff3bf, transparent: true, opacity: FX2.snow ? 0.9 : 0.7, depthWrite: false }));
  pts.frustumCulled = false; scene.add(pts); FX2.pollen = { pts, base, n };
}
function fx2Tick(dt, t) {
  if (!FX2.ready) { FX2.ready = true; try { detailWorld(); } catch (e) { console.warn(e); } try { decorate(); } catch (e) { console.warn(e); } initUI2(); }
  for (const f of FX2.tickers) f(dt, t);
  FX2.butter.forEach((b, i) => {
    b.G.visible = GFX.high || i < 2; if (!b.G.visible) return;
    const x = b.x + Math.sin(t * 0.45 + b.ph) * 1.8 + Math.sin(t * 1.3 + b.ph) * 0.4, z = b.z + Math.cos(t * 0.37 + b.ph * 2) * 1.8;
    b.G.rotation.y = Math.atan2(x - b.G.position.x, z - b.G.position.z) - Math.PI / 2;
    b.G.position.set(x, 0.9 + Math.sin(t * 1.9 + b.ph) * 0.35, z);
    const fl = 0.25 + Math.abs(Math.sin(t * 16 + b.ph)) * 1.0; b.a.rotation.z = fl; b.b.rotation.z = -fl;
  });
  for (const b of FX2.birds) {
    const a = t * b.sp + b.ph; b.G.position.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.3 + b.ph) * 2, Math.sin(a) * b.r); b.G.rotation.y = -a;
    const fl = Math.sin(t * 5 + b.ph) * 0.5; b.a.rotation.z = fl; b.b.rotation.z = -fl;
  }
  if (FX2.pollen) {
    const { pts, base, n } = FX2.pollen; pts.visible = GFX.high || FX2.snow;
    if (pts.visible) {
      const a = pts.geometry.attributes.position, cx = camera.position.x, cz = camera.position.z, H = FX2.snow ? 9 : 3.6;
      const md = (v, m) => ((v % m) + m) % m;
      for (let i = 0; i < n; i++) { const b = base[i];
        a.array[i * 3] = cx + md(b[0] + Math.sin(t * 0.3 + b[3]) * 0.6 + t * 0.15 - cx, 18) - 9;
        a.array[i * 3 + 1] = FX2.snow ? md(b[1] - t * 0.9, H) + 0.2 : b[1] + Math.sin(t * 0.5 + b[3]) * 0.3;
        a.array[i * 3 + 2] = cz + md(b[2] + Math.cos(t * 0.25 + b[3]) * 0.6 - cz, 18) - 9; }
      a.needsUpdate = true;
    }
  }
  // 물건 반짝임
  if (typeof items !== 'undefined') for (const it of items) {
    if (!it.alive || !it.mesh) continue;
    let h = it.mesh.userData.halo;
    if (!h) { h = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); h.userData.pol = 1; h.renderOrder = -1; it.mesh.add(h); it.mesh.userData.halo = h; }
    const k = (1.9 + Math.sin(t * 3 + it.x) * 0.25) / (it.mesh.scale.x || 1); h.scale.set(k, k, 1); h.material.opacity = 0.5 + Math.sin(t * 3 + it.x) * 0.15;
  }
  // 말 걸 수 있는 친구 발밑 고리
  let nn = null; try { nn = started && !dlgOpen ? nearNPC : null; } catch (e) {}
  talkRing.visible = !!(nn && nn.g && nn.g.visible);
  if (talkRing.visible) { talkRing.position.x = nn.g.position.x; talkRing.position.z = nn.g.position.z; const k = 1 + Math.sin(t * 5) * 0.08; talkRing.scale.set(k, k, 1); talkRing.material.opacity = 0.6 + Math.sin(t * 5) * 0.2; }
  // 미션이 바뀔 때 화면 깜빡 전환
  if (started && S.stage !== FX2.stage) { if (FX2.stage >= 0) { fade2.classList.remove('go'); void fade2.offsetWidth; fade2.classList.add('go'); } FX2.stage = S.stage; }
}
// ---------- 2.1 건물·장소 디테일: 창문·벽 띠·문·차양·천장등·울타리 기둥 + 소품 ----------
// 단원 세계에서 끌 수 있어요: DETAIL.win = false; 특정 벽만 빼려면 mesh.userData.plain = 1 (창문만 빼려면 mesh.userData.nowin = 1)
const DETAIL = { win: true, trim: true, doors: true, fronts: true, lamps: true, fence: true };
const winGlassMat = new THREE.MeshStandardMaterial({ color: 0xa5d8ff, roughness: 0.12, metalness: 0.35, emissive: 0x4dabf7, emissiveIntensity: 0.22 });
const awningTex = {};
function awningMat(hex) {
  if (awningTex[hex]) return awningTex[hex];
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  const a = '#' + new THREE.Color(hex).getHexString();
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : a; x.fillRect(i * 32, 0, 32, 40); x.beginPath(); x.arc(i * 32 + 16, 40, 16, 0, Math.PI); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  return (awningTex[hex] = t);
}
function valance(x1, z1, x2, z2, y, hex, hgt = 0.55) {
  const L = Math.hypot(x2 - x1, z2 - z1), t = awningMat(hex).clone(); t.needsUpdate = true; t.repeat.x = Math.max(1, Math.round(L / 2.6));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(L, hgt), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }));
  m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); m.userData.ns = 1; scene.add(m); return m;
}
function detailWorld() {
  const walls = [], fences = [], posts = [], boxes = [], b3 = new THREE.Box3();
  for (const o of scene.children) {
    if (!o.visible || o.isSprite || o.isPoints || o.isInstancedMesh || o.isLight || o === sky || o === clouds || o.userData.grass || o.userData.anim) continue;
    const p = o.isMesh && o.geometry.type === 'BoxGeometry' ? o.geometry.parameters : null;
    const up = p && !o.rotation.x && !o.rotation.y && !o.rotation.z && o.scale.x === 1 && o.scale.y === 1 && !o.userData.plain && o.material && o.material.color && Math.abs(o.position.y - p.height / 2) < 0.3;
    let kind = 0;
    if (up && Math.min(p.width, p.depth) <= 0.6 && Math.max(p.width, p.depth) >= 4) kind = p.height >= 3 && p.height <= 7 ? 1 : p.height >= 0.9 && p.height <= 1.5 ? 2 : 0;
    else if (up && p.width <= 1.1 && p.depth <= 1.1 && p.height >= 3 && p.height <= 7) kind = 3;
    if (kind === 1) walls.push(o); else if (kind === 2) fences.push(o); else if (kind === 3) posts.push(o);
    b3.setFromObject(o); if (b3.isEmpty()) continue;
    if (b3.max.y < 0.3 || b3.max.x - b3.min.x > 70 || b3.max.z - b3.min.z > 70 || b3.min.y > 7) continue;
    boxes.push({ o, b: b3.clone() });
  }
  const parts = [], glass = [], hit = new THREE.Box3();
  const busy = (skip, x1, y1, z1, x2, y2, z2) => { hit.min.set(Math.min(x1, x2), y1, Math.min(z1, z2)); hit.max.set(Math.max(x1, x2), y2, Math.max(z1, z2)); for (const k of boxes) if (!skip.includes(k.o) && k.b.intersectsBox(hit)) return true; return false; };
  const ray = new THREE.Raycaster(), upV = new THREE.Vector3(0, 1, 0), org = new THREE.Vector3();
  const roofY = (x, z) => { org.set(x, 1.7, z); ray.set(org, upV); ray.far = 9; for (const h of ray.intersectObjects(scene.children, true)) { const o = h.object; if (o === sky || o === clouds || o.isSprite || o.isPoints || o.isInstancedMesh || (o.parent && o.parent === clouds)) continue; return 1.7 + h.distance; } return 0; };
  for (const w of walls) {
    const p = w.geometry.parameters, ax = p.width >= p.depth, L = ax ? p.width : p.depth, T = ax ? p.depth : p.width, h = p.height, c = w.position, hex = w.material.color.getHex();
    const add = (a, y, la, sy, th, col, arr = parts) => arr.push(ax ? [c.x + a, y, c.z, la, sy, th, col] : [c.x, y, c.z + a, th, sy, la, col]);
    if (DETAIL.trim) { add(0, 0.21, L + 0.06, 0.42, T + 0.1, shade(hex, -0.17)); add(0, h + 0.05, L + 0.14, 0.16, T + 0.24, shade(hex, 0.09)); }
    if (DETAIL.win && h >= 3.4 && !w.userData.nowin) {
      const n = Math.max(1, Math.round(L / 3.6)), step = L / n, ww = Math.min(1.5, step * 0.45), wh = 1.2, wy = Math.min(2.25, h * 0.56);
      for (let i = 0; i < n; i++) {
        const a = -L / 2 + step * (i + 0.5), px = ax ? c.x + a : c.x, pz = ax ? c.z : c.z + a, ex = ax ? ww / 2 + 0.3 : T / 2 + 0.8, ez = ax ? T / 2 + 0.8 : ww / 2 + 0.3;
        if (busy([w], px - ex, wy - wh / 2 - 0.25, pz - ez, px + ex, wy + wh / 2 + 0.3, pz + ez)) continue;
        add(a, wy, ww + 0.18, wh + 0.18, T + 0.08, 0xffffff); add(a, wy, ww, wh, T + 0.12, 0, glass);
        add(a, wy, 0.06, wh, T + 0.16, 0xffffff); add(a, wy, ww, 0.06, T + 0.16, 0xffffff);
        add(a, wy - wh / 2 - 0.13, ww + 0.36, 0.08, T + 0.32, 0xf1f3f5);
      }
    }
  }
  // 같은 줄에 놓인 벽 사이의 틈 = 문: 문틀을 달고, 바깥쪽에 차양·발판·화분
  if (DETAIL.doors) {
    const info = walls.map(w => { const p = w.geometry.parameters, ax = p.width >= p.depth, L = ax ? p.width : p.depth; return { w, ax, line: ax ? w.position.z : w.position.x, a1: (ax ? w.position.x : w.position.z) - L / 2, a2: (ax ? w.position.x : w.position.z) + L / 2, h: p.height, T: ax ? p.depth : p.width, hex: w.material.color.getHex() }; });
    for (const A of info) for (const B of info) {
      if (A === B || A.ax !== B.ax || Math.abs(A.line - B.line) > 0.15 || A.hex !== B.hex) continue;
      const g = B.a1 - A.a2; if (g < 1.4 || g > 4.6) continue;
      if (info.some(C => C !== A && C !== B && C.ax === A.ax && Math.abs(C.line - A.line) < 0.15 && C.a1 < B.a1 && C.a2 > A.a2)) continue;
      const m = (A.a2 + B.a1) / 2, h = Math.min(A.h, B.h), T = A.T, dk = shade(A.hex, -0.28), ax = A.ax, ln = A.line;
      const add = (a, y, la, sy, th, col) => parts.push(ax ? [a, y, ln, la, sy, th, col] : [ln, y, a, th, sy, la, col]);
      add(m, h - 0.25, g + 0.3, 0.5, T + 0.14, dk); add(A.a2 + 0.07, (h - 0.5) / 2, 0.14, h - 0.5, T + 0.14, dk); add(B.a1 - 0.07, (h - 0.5) / 2, 0.14, h - 0.5, T + 0.14, dk);
      const side = (s) => ax ? [m, ln + s] : [ln + s, m];
      const c1 = roofY(...side(1.6)), c2 = roofY(...side(-1.6));
      if (!!c1 === !!c2) continue;
      const s = c1 ? -1 : 1, [ox, oz] = side(s * (T / 2 + 0.55)), ay = Math.min(h - 0.5, 3.2);
      const aw = new THREE.Mesh(new THREE.BoxGeometry(ax ? g + 0.9 : 1.1, 0.07, ax ? 1.1 : g + 0.9), mat(0xe8590c)); aw.position.set(ox, ay, oz); aw.rotation[ax ? 'x' : 'z'] = (ax ? s : -s) * 0.28; scene.add(aw);
      const [ex, ez] = side(s * (T / 2 + 1.05));
      valance(ax ? ex - g / 2 - 0.45 : ex, ax ? ez : ez - g / 2 - 0.45, ax ? ex + g / 2 + 0.45 : ex, ax ? ez : ez + g / 2 + 0.45, ay - 0.38, 0xe8590c, 0.4);
      const [mx, mz] = side(s * (T / 2 + 0.75)); const rug = new THREE.Mesh(new THREE.BoxGeometry(ax ? g * 0.75 : 1, 0.03, ax ? 1 : g * 0.75), mat(0x8d5a3b)); rug.position.set(mx, 0.03, mz); scene.add(rug);
      for (const d of [-1, 1]) { const [qx, qz] = ax ? [m + d * (g / 2 + 0.5), ln + s * (T / 2 + 0.45)] : [ln + s * (T / 2 + 0.45), m + d * (g / 2 + 0.5)]; if (!busy([A.w, B.w], qx - 0.3, 0.3, qz - 0.3, qx + 0.3, 1.2, qz + 0.3)) flowerPot(qx, qz, 0.9); }
    }
  }
  // 앞이 트인 건물: 앞 기둥 사이에 들보와 줄무늬 차양
  if (DETAIL.fronts) {
    const used = new Set();
    for (const A of posts) {
      let best = null, bd = 1e9;
      for (const B of posts) { if (A === B || A.material !== B.material) continue; const dx = Math.abs(A.position.x - B.position.x), dz = Math.abs(A.position.z - B.position.z); if (Math.min(dx, dz) > 0.15) continue; const d = Math.max(dx, dz); if (d >= 5 && d <= 26 && d < bd) { bd = d; best = B; } }
      if (!best || used.has(best.uuid + A.uuid)) continue; used.add(A.uuid + best.uuid);
      const h = Math.min(A.geometry.parameters.height, best.geometry.parameters.height), ax = Math.abs(A.position.z - best.position.z) < 0.15, hex = A.material.color.getHex();
      const mx = (A.position.x + best.position.x) / 2, mz = (A.position.z + best.position.z) / 2, th = 0.36;
      if (busy([A, best], ax ? A.position.x : mx - th / 2, h - 0.5, ax ? mz - th / 2 : A.position.z, ax ? best.position.x : mx + th / 2, h - 0.05, ax ? mz + th / 2 : best.position.z)) continue;
      parts.push(ax ? [mx, h - 0.2, mz, bd, 0.4, th, hex] : [mx, h - 0.2, mz, th, 0.4, bd, hex]);
      if (bd >= 6) valance(A.position.x, A.position.z, best.position.x, best.position.z, h - 0.66, hex);
    }
  }
  if (DETAIL.fence) for (const f of fences) {
    const p = f.geometry.parameters, ax = p.width >= p.depth, L = ax ? p.width : p.depth, h = p.height, c = f.position, hex = f.material.color.getHex(), n = Math.max(1, Math.round(L / 3));
    for (let i = 0; i <= n; i++) { const a = -L / 2 + L * i / n, x = ax ? c.x + a : c.x, z = ax ? c.z : c.z + a; parts.push([x, (h + 0.3) / 2, z, 0.26, h + 0.3, 0.26, shade(hex, -0.07)]); parts.push([x, h + 0.36, z, 0.36, 0.1, 0.36, shade(hex, -0.16)]); }
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  const inst = (arr, material, colored) => { if (!arr.length) return; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, arr.length); arr.forEach((a, i) => { v.set(a[0], a[1], a[2]); sc.set(a[3], a[4], a[5]); m4.compose(v, q, sc); im.setMatrixAt(i, m4); if (colored) im.setColorAt(i, col.set(a[6])); }); im.userData.pol = 1; im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false; scene.add(im); };
  inst(parts, new THREE.MeshStandardMaterial({ roughness: 0.9 }), true); inst(glass, winGlassMat, false);
  // 실내 천장등: 지붕이 있는 구역 한가운데에 등 하나와 바닥의 따뜻한 빛
  if (DETAIL.lamps) {
    const zl = typeof zones !== 'undefined' ? zones : [], seen = [];
    const shadeG = new THREE.ConeGeometry(0.42, 0.34, 14, 1, true), shadeM = new THREE.MeshStandardMaterial({ color: 0xf08c00, side: THREE.DoubleSide, roughness: 0.7 });
    const bulbG = new THREE.SphereGeometry(0.17, 10, 8), bulbM = new THREE.MeshStandardMaterial({ color: 0xfff3bf, emissive: 0xffe08a, emissiveIntensity: 1.1 });
    const glowM = new THREE.MeshBasicMaterial({ map: haloTex, color: 0xffe3a3, transparent: true, opacity: 0.34, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    for (const r of zl) {
      const w = r.x2 - r.x1, d = r.z2 - r.z1; if (!(w * d >= 20 && w * d <= 700)) continue;
      const k = Math.max(w, d) > 13 ? 2 : 1;
      for (let i = 0; i < k; i++) {
        const f = k === 1 ? 0.5 : 0.28 + i * 0.44, x = w >= d ? r.x1 + w * f : (r.x1 + r.x2) / 2, z = w >= d ? (r.z1 + r.z2) / 2 : r.z1 + d * f;
        if (seen.some(s => Math.hypot(s[0] - x, s[1] - z) < 4)) continue;
        const top = roofY(x, z); if (top < 3.2) continue; seen.push([x, z]);
        const y = Math.min(top, 5.2) - 0.7;
        const cord = box(0.03, top - y, 0.03, 0x495057, x, (top + y) / 2, z); cord.userData.ns = 1;
        const sh = new THREE.Mesh(shadeG, shadeM); sh.position.set(x, y - 0.1, z); sh.userData.ns = 1; scene.add(sh);
        const b = new THREE.Mesh(bulbG, bulbM); b.position.set(x, y - 0.24, z); b.userData.ns = 1; scene.add(b);
        const g = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowM); const rr = Math.min(Math.min(w, d) * 0.9, 9); g.scale.set(rr, rr, 1); g.rotation.x = -Math.PI / 2; g.position.set(x, 0.06, z); g.userData.pol = 1; g.renderOrder = 2; scene.add(g);
      }
    }
  }
}
// ----- 소품 (단원 세계에서 불러 써요. 충돌 상자는 달지 않아요) -----
const clearAt = (x, z, r = 0.8) => !colliders.some(c => x + r > c.x1 && x - r < c.x2 && z + r > c.z1 && z - r < c.z2);
const prop = (fn, x, z, ...a) => { const [px, pz] = typeof x === 'number' ? [x, z] : [z, a[0]]; if (clearAt(px, pz)) return fn(x, z, ...a); }; // 글자가 먼저 오는 소품(signPost·easel)도 돼요
function grp(x, z, rot = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g; }
function flowerPot(x, z, s = 1, c = 0xff8787) { const g = grp(x, z); g.scale.setScalar(s); cyl(0.26, 0.19, 0.4, 0xc9743c, 0, 0.2, 0, g); ball(0.3, 0x4f9d46, 0, 0.55, 0, g); for (let i = 0; i < 5; i++) ball(0.09, c, Math.cos(i * 1.26) * 0.2, 0.72 + (i % 2) * 0.08, Math.sin(i * 1.26) * 0.2, g); return g; }
function mailbox(x, z, rot = 0, c = 0xe03131) { const g = grp(x, z, rot); cyl(0.06, 0.06, 1, 0x495057, 0, 0.5, 0, g); box(0.42, 0.34, 0.6, c, 0, 1.15, 0, g); const t = cyl(0.21, 0.21, 0.6, c, 0, 1.32, 0, g); t.rotation.x = Math.PI / 2; box(0.04, 0.26, 0.1, 0xffd43b, 0.24, 1.3, 0.15, g); return g; }
function bike(x, z, rot = 0, c = 0x1c7ed6) {
  const g = grp(x, z, rot);
  for (const dx of [-0.55, 0.55]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 6, 18), mat(0x212529)); w.position.set(dx, 0.38, 0); g.add(w); }
  const bar = (x1, y1, x2, y2) => { const L = Math.hypot(x2 - x1, y2 - y1), b = box(L, 0.05, 0.05, c, (x1 + x2) / 2, (y1 + y2) / 2, 0, g); b.rotation.z = Math.atan2(y2 - y1, x2 - x1); };
  bar(-0.55, 0.38, -0.1, 0.4); bar(-0.1, 0.4, 0.4, 0.85); bar(-0.55, 0.38, -0.2, 0.85); bar(-0.2, 0.85, 0.4, 0.85); bar(0.4, 0.85, 0.55, 0.38);
  box(0.24, 0.06, 0.14, 0x212529, -0.22, 0.92, 0, g); box(0.05, 0.05, 0.5, 0x495057, 0.4, 1.02, 0, g); return g;
}
function parasolTable(x, z, c = 0xff6b6b) { const g = grp(x, z); cyl(0.6, 0.6, 0.06, 0xf8f9fa, 0, 0.78, 0, g, 16); cyl(0.05, 0.05, 2.5, 0x868e96, 0, 1.25, 0, g); const p = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 8), mat(c)); p.position.y = 2.6; g.add(p); for (let i = 0; i < 3; i++) cyl(0.2, 0.2, 0.45, shade(c, 0.12), Math.cos(i * 2.09) * 0.95, 0.23, Math.sin(i * 2.09) * 0.95, g); return g; }
function bunting(x1, z1, x2, z2, y = 3.4, cols = [0xff6b6b, 0xffd43b, 0x51cf66, 0x4dabf7, 0xda77f2]) {
  const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(4, Math.round(L / 0.7)), yaw = -Math.atan2(z2 - z1, x2 - x1), tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.2, 0, 0, 0.2, 0, 0, 0, -0.42, 0]), 3)); tri.computeVertexNormals();
  const ms = cols.map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  for (let i = 0; i <= n; i++) { const f = i / n, sag = Math.sin(f * Math.PI) * Math.min(0.7, L * 0.06); const m = new THREE.Mesh(tri, ms[i % ms.length]); m.position.set(x1 + (x2 - x1) * f, y - sag, z1 + (z2 - z1) * f); m.rotation.y = yaw; scene.add(m); }
  for (const [x, z] of [[x1, z1], [x2, z2]]) cyl(0.05, 0.07, y, 0x868e96, x, y / 2, z);
}
function signPost(text, x, z, rot = 0, o = {}) { const g = grp(x, z, rot), oo = Object.assign({ fs: 52, bg: '#ffffff', fg: '#1d3557', border: '#1d3557' }, o); cyl(0.07, 0.09, 2.2, 0x8d6e63, 0, 1.1, 0, g); const s = textPlane(text, o.h || 0.5, oo, g); s.position.set(0, 2.3, 0.06); const b = textPlane(text, o.h || 0.5, oo, g); b.position.set(0, 2.3, -0.06); b.rotation.y = Math.PI; return g; }
function easel(text, x, z, rot = 0, o = {}) { const g = grp(x, z, rot); box(1.3, 1.5, 0.08, 0x5c4033, 0, 1.05, 0, g).rotation.x = -0.16; const s = textPlane(text, o.h || 1.1, Object.assign({ fs: 44, bg: '#2b2d42', fg: '#fff' }, o), g); s.position.set(0, 1.07, 0.07); s.rotation.x = -0.16; { const w = s.geometry.parameters.width, hh = s.geometry.parameters.height; s.scale.setScalar(Math.min(1, 1.18 / w, 1.36 / hh)); } for (const dx of [-0.55, 0.55]) box(0.07, 1.2, 0.07, 0x5c4033, dx, 0.6, -0.3, g).rotation.x = 0.3; return g; }
function balloons(x, z, cols = [0xff6b6b, 0xffd43b, 0x4dabf7]) {
  const g = grp(x, z); box(0.3, 0.3, 0.3, 0x868e96, 0, 0.15, 0, g);
  cols.forEach((c, i) => { const a = i * 2.1, b = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshStandardMaterial({ color: c, roughness: 0.35 })); b.scale.y = 1.2; b.position.set(Math.cos(a) * 0.4, 2.7 + i * 0.35, Math.sin(a) * 0.4); g.add(b); box(0.015, b.position.y - 0.3, 0.015, 0xdee2e6, b.position.x / 2, b.position.y / 2 + 0.15, b.position.z / 2, g); });
  FX2.tickers.push((dt, t) => { g.rotation.y = Math.sin(t * 0.6 + x) * 0.3; }); return g;
}
function crates(x, z, rot = 0) { const g = grp(x, z, rot); box(0.8, 0.6, 0.8, 0xc58b3a, 0, 0.3, 0, g); box(0.8, 0.6, 0.8, 0xb07a2e, 0.85, 0.3, 0.1, g); box(0.7, 0.55, 0.7, 0xd9a252, 0.4, 0.88, 0.05, g).rotation.y = 0.4; return g; }
function binTrio(x, z, rot = 0) { const g = grp(x, z, rot); [[0x2f9e44, '♻'], [0x1c7ed6, '🧴'], [0xf59f00, '📄']].forEach(([c, t], i) => { cyl(0.36, 0.3, 0.95, c, (i - 1) * 0.85, 0.48, 0, g); cyl(0.39, 0.39, 0.08, shade(c, -0.12), (i - 1) * 0.85, 0.99, 0, g); const s = textPlane(t, 0.36, { fs: 48, bg: null, fg: '#fff' }, g); s.position.set((i - 1) * 0.85, 0.55, 0.37); }); return g; }
function snowman(x, z, rot = 0) { const g = grp(x, z, rot); ball(0.6, 0xffffff, 0, 0.55, 0, g); ball(0.42, 0xffffff, 0, 1.35, 0, g); ball(0.3, 0xffffff, 0, 1.95, 0, g); const n = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), mat(0xff922b)); n.rotation.x = Math.PI / 2; n.position.set(0, 1.95, 0.4); g.add(n); for (const dx of [-0.11, 0.11]) ball(0.035, 0x212529, dx, 2.03, 0.27, g); cyl(0.24, 0.24, 0.3, 0x212529, 0, 2.36, 0, g); cyl(0.36, 0.36, 0.04, 0x212529, 0, 2.2, 0, g); cyl(0.33, 0.33, 0.12, 0xe03131, 0, 1.7, 0, g); return g; }
function gifts(x, z) { const g = grp(x, z); [[0, 0, 0.6, 0xe03131], [0.7, 0.1, 0.45, 0x2f9e44], [0.3, 0.6, 0.38, 0x1c7ed6]].forEach(([dx, dz, s, c]) => { box(s, s, s, c, dx, s / 2, dz, g); box(s + 0.02, s + 0.02, s * 0.16, 0xffd43b, dx, s / 2, dz, g); box(s * 0.16, s + 0.02, s + 0.02, 0xffd43b, dx, s / 2, dz, g); }); return g; }
function flagPole(x, z, c = 0x1c7ed6) { const g = grp(x, z); cyl(0.06, 0.09, 6, 0xced4da, 0, 3, 0, g); ball(0.12, 0xffd43b, 0, 6.05, 0, g); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1, 8, 1), new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.8 })); f.position.set(0.86, 5.4, 0); g.add(f); const pa = f.geometry.attributes.position; FX2.tickers.push((dt, t) => { for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 3 + t * 4) * 0.08 * (pa.getX(i) + 0.8)); pa.needsUpdate = true; }); return g; }
function busStop(x, z, rot = 0, text = 'BUS') { const g = grp(x, z, rot); cyl(0.06, 0.06, 2.6, 0x495057, 0, 1.3, 0, g); const d = cyl(0.42, 0.42, 0.06, 0x1c7ed6, 0, 2.7, 0, g, 20); d.rotation.x = Math.PI / 2; for (const k of [1, -1]) { const s = textPlane(text, 0.3, { fs: 44, bg: null, fg: '#fff' }, g); s.position.set(0, 2.7, 0.05 * k); if (k < 0) s.rotation.y = Math.PI; } return g; } // 앞뒤 모두 글자
function hydrant(x, z) { const g = grp(x, z); cyl(0.17, 0.2, 0.7, 0xe03131, 0, 0.35, 0, g); ball(0.18, 0xe03131, 0, 0.72, 0, g); const a = cyl(0.07, 0.07, 0.56, 0xc92a2a, 0, 0.45, 0, g); a.rotation.z = Math.PI / 2; return g; }
function goal(x, z, rot = 0) { const g = grp(x, z, rot); for (const dx of [-1.5, 1.5]) cyl(0.06, 0.06, 2, 0xffffff, dx, 1, 0, g); box(3.1, 0.12, 0.12, 0xffffff, 0, 2, 0, g); const n = new THREE.Mesh(new THREE.PlaneGeometry(3, 2, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 })); n.position.set(0, 1, -0.5); n.rotation.x = 0.25; g.add(n); ball(0.22, 0xffffff, 0.6, 0.22, 0.9, g); return g; }
function lantern(x, y, z, c = 0xe03131) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.5 })); b.scale.y = 1.15; b.position.set(x, y, z); b.userData.ns = 1; scene.add(b); cyl(0.12, 0.12, 0.08, 0xffd43b, x, y + 0.36, z); cyl(0.12, 0.12, 0.08, 0xffd43b, x, y - 0.36, z); }
function lanternLine(x1, z1, x2, z2, y = 3.3, cols = [0xe03131, 0xffd43b, 0x1c7ed6]) { const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(2, Math.round(L / 1.8)); for (let i = 0; i <= n; i++) { const f = i / n; lantern(x1 + (x2 - x1) * f, y - Math.sin(f * Math.PI) * 0.4, z1 + (z2 - z1) * f, cols[i % cols.length]); } for (const [x, z] of [[x1, z1], [x2, z2]]) cyl(0.06, 0.08, y + 0.3, 0x5c4033, x, (y + 0.3) / 2, z); }
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
// 2.0: 교과서 친구 6명은 이름만으로 그 모습이 돼요. 다른 사람은 이름에 따라 머리 모양·옷 무늬가 달라져요.
const CAST = {
  Nara: { girl: true, skin: 0xf6cfa9, hair: 0x5b3a22, hairStyle: 'pony', curl: true, glasses: true, shirt: 0xffd43b, pat: 'argyle', skirt: 0x2f7d4f, skirtPat: 'plaid', shoe: 0xffffff },
  Hajun: { girl: false, skin: 0xf5cfa8, hair: 0x4a2f1e, hairStyle: 'short', shirt: 0xb7e4a0, vest: 0xb197fc, pat: 'vest', pants: 0xd8c9a3, prop: 'book', shoe: 0x8d6e63 },
  Olivia: { girl: true, noSkirt: true, skin: 0xfde0cf, hair: 0xe2582a, hairStyle: 'long', shirt: 0xdbeafe, bib: 0xf783ac, pat: 'overall', pants: 0x3b6fb5, shoe: 0xffffff },
  Kai: { girl: false, skin: 0xfbd5b5, hair: 0xf08c2e, hairStyle: 'curly', shirt: 0xffffff, jacket: 0xb2e06a, inner: 0xff7a3d, pat: 'jacket', pants: 0xc9c2a8, prop: 'ball', shoe: 0xff8787 },
  Rani: { girl: true, skin: 0xb9794f, hair: 0x1c1410, hairStyle: 'long', band: 0xff6fae, shirt: 0xe64980, jacket: 0xe64980, inner: 0xffffff, pat: 'jacket', heart: true, skirt: 0x4c7fc4, shoe: 0xffffff },
  Joel: { girl: false, skin: 0x70482f, hair: 0x15100c, hairStyle: 'curly', shirt: 0xe03131, pat: 'hoodie', hood: true, pants: 0x2f5fa8, shoe: 0xffffff }
};
const ADULT_RE = /^(Ms\.|Mr\.|Mrs\.|Dr\.|Dad|Mom|Mother|Father|Teacher|Staff|Clerk|Server|Nurse|School Nurse|Pharmacist|Librarian|Ranger|Soldier|Poet|Old |Man$|Woman$|Doctor|Chef|Driver|Grand|Coach|Guide|Baker|Farmer|Police|Officer|Vet)/;
const hashStr = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const hex6 = (c) => '#' + new THREE.Color(c).getHexString();
const shade = (c, l) => new THREE.Color(c).offsetHSL(0, 0, l).getHex();
const clothTex = {};
// 윗옷 무늬: 가로 = 몸 둘레(가운데가 앞), 세로 = 위(어깨)→아래
function clothTexture(o) {
  const key = [o.pat || 'plain', o.shirt, o.vest, o.jacket, o.inner, o.bib, o.heart ? 1 : 0].join('_');
  if (clothTex[key]) return clothTex[key];
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  const base = o.pat === 'vest' ? o.vest : o.pat === 'jacket' ? o.jacket : o.shirt;
  x.fillStyle = hex6(base); x.fillRect(0, 0, 256, 256);
  const dark = hex6(shade(base, -0.1)), light = hex6(shade(base, 0.1));
  const both = (fn) => { fn(128); fn(0); fn(256); }; // 앞(가운데)과 뒤(양 끝)에 같이 그리기
  if (o.pat === 'argyle') {
    x.fillStyle = '#fff'; x.fillRect(0, 40, 256, 14);
    for (let i = 0; i < 9; i++) { const cx = i * 32, cy = 150; x.fillStyle = i % 2 ? '#ffffff' : '#ff922b'; x.beginPath(); x.moveTo(cx, cy - 34); x.lineTo(cx + 16, cy); x.lineTo(cx, cy + 34); x.lineTo(cx - 16, cy); x.fill(); }
    x.strokeStyle = 'rgba(120,80,0,.35)'; x.lineWidth = 2; for (let i = -8; i < 16; i++) { x.beginPath(); x.moveTo(i * 32, 116); x.lineTo(i * 32 + 32, 184); x.stroke(); x.beginPath(); x.moveTo(i * 32 + 32, 116); x.lineTo(i * 32, 184); x.stroke(); }
    x.fillStyle = dark; x.fillRect(0, 232, 256, 24);
  } else if (o.pat === 'vest') {
    x.fillStyle = hex6(o.shirt); x.beginPath(); x.moveTo(128 - 34, 30); x.lineTo(128 + 34, 30); x.lineTo(128, 120); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.moveTo(128 - 36, 30); x.lineTo(128, 122); x.lineTo(128 + 36, 30); x.stroke();
    x.fillStyle = '#fff'; x.fillRect(0, 30, 256, 8);
    x.strokeStyle = dark; x.lineWidth = 2; for (let i = 0; i < 256; i += 10) { x.beginPath(); x.moveTo(i, 226); x.lineTo(i, 256); x.stroke(); }
    x.fillStyle = '#fff'; x.fillRect(0, 214, 256, 5); x.fillRect(0, 226, 256, 5);
  } else if (o.pat === 'overall') {
    for (let y = 0; y < 256; y += 20) { x.fillStyle = '#74c0fc'; x.fillRect(0, y, 256, 9); }
    x.fillStyle = hex6(o.bib); x.fillRect(0, 150, 256, 106);
    both((cx) => { x.fillStyle = hex6(o.bib); x.fillRect(cx - 44, 96, 88, 70); x.fillRect(cx - 44, 30, 14, 70); x.fillRect(cx + 30, 30, 14, 70); x.fillStyle = '#ffd43b'; x.beginPath(); x.arc(cx - 37, 104, 6, 0, 7); x.arc(cx + 37, 104, 6, 0, 7); x.fill(); x.strokeStyle = hex6(shade(o.bib, -0.12)); x.lineWidth = 3; x.strokeRect(cx - 18, 118, 36, 28); });
  } else if (o.pat === 'jacket') {
    x.fillStyle = hex6(o.inner); x.fillRect(128 - 30, 0, 60, 256);
    if (o.heart) { x.fillStyle = '#ffd43b'; x.beginPath(); x.moveTo(128, 150); x.bezierCurveTo(96, 120, 108, 92, 128, 112); x.bezierCurveTo(148, 92, 160, 120, 128, 150); x.fill(); }
    x.fillStyle = dark; x.fillRect(128 - 34, 0, 5, 256); x.fillRect(128 + 29, 0, 5, 256);
    x.fillStyle = '#fff'; x.fillRect(0, 236, 98, 20); x.fillRect(158, 236, 98, 20);
    x.fillStyle = dark; x.fillRect(0, 242, 98, 4); x.fillRect(158, 242, 98, 4);
  } else if (o.pat === 'hoodie') {
    x.strokeStyle = dark; x.lineWidth = 5; x.beginPath(); x.moveTo(128 - 44, 232); x.lineTo(128 - 28, 176); x.lineTo(128 + 28, 176); x.lineTo(128 + 44, 232); x.stroke();
    x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.moveTo(128 - 12, 34); x.lineTo(128 - 14, 108); x.moveTo(128 + 12, 34); x.lineTo(128 + 14, 100); x.stroke();
    x.fillStyle = dark; x.fillRect(0, 240, 256, 16);
  } else if (o.pat === 'stripe') {
    for (let y = 60; y < 256; y += 34) { x.fillStyle = light; x.fillRect(0, y, 256, 14); }
  } else if (o.pat === 'band') {
    x.fillStyle = '#fff'; x.fillRect(0, 110, 256, 16); x.fillStyle = dark; x.fillRect(0, 130, 256, 8);
  } else if (o.pat === 'shirt') {
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(128 - 30, 26); x.lineTo(128, 70); x.lineTo(128 + 30, 26); x.fill();
    x.fillStyle = dark; x.fillRect(126, 70, 4, 186); for (let y = 96; y < 240; y += 40) { x.beginPath(); x.arc(128, y, 5, 0, 7); x.fill(); }
  } else if (o.pat === 'star') {
    x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 13 : 30; x.lineTo(128 + Math.cos(a) * r, 140 + Math.sin(a) * r); } x.fill();
    x.fillStyle = dark; x.fillRect(0, 240, 256, 16);
  } else { x.fillStyle = dark; x.fillRect(0, 240, 256, 16); x.fillStyle = light; x.fillRect(0, 28, 256, 10); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (clothTex[key] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
}
function plaidMat(hex) {
  const key = 'plaid' + hex; if (clothTex[key]) return clothTex[key];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = hex6(hex); x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 32) { x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(i, 0, 10, 128); x.fillRect(0, i, 128, 10); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(i + 18, 0, 2, 128); x.fillRect(0, i + 18, 128, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1);
  return (clothTex[key] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide }));
}
// 작은 부품 여러 개를 한 덩어리로 합쳐요(색은 꼭짓점 색). 사람 한 명을 그리는 횟수가 크게 줄어요.
const bakedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 });
function bakeParts(parent) {
  const list = [], gone = [];
  const collect = (o, mtx, top) => {
    for (const c of o.children) {
      const m = c.material;
      if (!c.isMesh || c.userData.keep || !c.visible || !m || !m.isMeshStandardMaterial || m.map || m.transparent || m.side !== THREE.FrontSide || m.vertexColors) continue;
      c.updateMatrix(); const mm = mtx ? mtx.clone().multiply(c.matrix) : c.matrix.clone();
      list.push([c.geometry, mm, m.color, !c.userData.ns]); if (top) gone.push(c);
      collect(c, mm, false);
    }
  };
  collect(parent, null, true);
  if (list.length < 2) return null;
  let nv = 0, ni = 0;
  for (const [g] of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3(); let vo = 0, io = 0, cast = false;
  for (const [g, mm, c, cs] of list) {
    const P0 = g.attributes.position, N0 = g.attributes.normal, n = P0.count; nm.getNormalMatrix(mm); cast = cast || cs;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(P0, i).applyMatrix4(mm); pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
      v.fromBufferAttribute(N0, i).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
      col[(vo + i) * 3] = c.r; col[(vo + i) * 3 + 1] = c.g; col[(vo + i) * 3 + 2] = c.b;
    }
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; }
    else { for (let i = 0; i < n; i++) idx[io + i] = vo + i; io += n; }
    vo += n;
  }
  for (const c of gone) parent.remove(c);
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3)); bg.setIndex(new THREE.BufferAttribute(idx, 1));
  const out = new THREE.Mesh(bg, bakedMat); if (!cast) out.userData.ns = 1; parent.add(out); return out;
}
const PGEO = {}; // 사람 부품 모양은 한 번만 만들어 같이 써요
const pgeo = (k, f) => PGEO[k] || (PGEO[k] = f());
const PATS = ['plain', 'stripe', 'band', 'shirt', 'star', 'plain'];
const HAIR_G = ['long', 'bob', 'pony', 'twin', 'long', 'bun'], HAIR_B = ['short', 'side', 'short', 'spiky', 'curly', 'side'];
function makePerson(o0) {
  const look = CAST[o0.look || o0.name];
  const o = Object.assign({}, o0, look || {});
  if (o0.hat) o.hat = o0.hat; if (o0.scale) o.scale = o0.scale;
  const hs = hashStr(String(o.name || 'x'));
  const adult = o.adult != null ? o.adult : ADULT_RE.test(o.name || '');
  const old = /^(Old |Grand)/.test(o.name || '');
  if (!look) { if (!o.pat) o.pat = adult ? (hs % 2 ? 'shirt' : 'plain') : PATS[hs % PATS.length]; if (!o.hairStyle) o.hairStyle = o.girl ? HAIR_G[(hs >> 3) % HAIR_G.length] : HAIR_B[(hs >> 3) % HAIR_B.length]; }
  const g = new THREE.Group();
  const skin = o.skin || 0xf5cfa8, pants = o.pants || 0x2f3e66, hairC = old ? 0xd9d9d9 : (o.hair || 0x3b2a1a);
  const ns = (m) => { m.userData.ns = 1; return m; }; // 작은 부품은 그림자를 만들지 않아요
  const cap = (r, l, c) => new THREE.Mesh(pgeo('c' + r + '_' + l, () => new THREE.CapsuleGeometry(r, l, 4, 10)), typeof c === 'number' ? mat(c) : c);
  const sph = (r, c, x, y, z, parent, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(pgeo('s' + r, () => new THREE.SphereGeometry(r, 10, 7)), mat(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return ns(m); };
  const hasSkirt = (o.girl && !o.noSkirt) || (o.skirt && !o.noSkirt);
  const R = adult ? 0.265 : 0.3, sh = adult ? 0.29 : 0.26;
  // 발밑 그림자 (가벼운 화질에서만 보여요)
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; blob.visible = false; g.add(blob);
  const legs = [-0.11, 0.11].map(x => {
    const piv = new THREE.Group(); piv.position.set(x, 0.74, 0); g.add(piv);
    const leg = cap(0.085, 0.5, hasSkirt ? skin : pants); leg.position.y = -0.36; piv.add(leg);
    if (hasSkirt) { const so = cap(0.09, 0.1, 0xffffff); so.position.y = -0.56; piv.add(ns(so)); }
    const shoe = cap(0.085, 0.14, o.shoe || 0x3a3a3a); shoe.rotation.x = Math.PI / 2; shoe.position.set(0, -0.655, 0.05); shoe.scale.set(1.05, 1, 0.8); piv.add(ns(shoe));
    return piv;
  });
  const body = cap(sh, 0.4, clothTexture(o)); body.position.y = 1.08; body.scale.z = 0.85; body.rotation.y = Math.PI; g.add(body);
  if (hasSkirt) { const sk = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 14, 1, true), o.skirtPat === 'plaid' ? plaidMat(o.skirt) : new THREE.MeshStandardMaterial({ color: o.skirt || o.shirt, roughness: 0.88, side: THREE.DoubleSide })); sk.position.y = 0.72; g.add(sk); }
  if (o.hood) sph(0.19, o.shirt, 0, 1.44, -0.2, g, 0.95, 0.8, 0.8);
  cyl(0.07, 0.08, 0.12, skin, 0, 1.47, 0, g);
  const sleeve = o.shirt;
  const arms = [-1, 1].map(sd => {
    const piv = new THREE.Group(); piv.position.set(sd * (sh + 0.07), 1.36, 0); piv.rotation.z = sd * 0.12; g.add(piv);
    const arm = cap(0.065, 0.44, sleeve); arm.position.y = -0.28; piv.add(arm);
    if (o.pat === 'overall') for (const y of [-0.12, -0.3, -0.48]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.06, 10), mat(0x74c0fc)); b.position.y = y; piv.add(ns(b)); }
    sph(0.075, skin, 0, -0.6, 0, piv);
    return piv;
  });
  // ----- 머리 (headG 가 통째로 돌아가요) -----
  const headG = new THREE.Group(); headG.position.y = 1.72; g.add(headG);
  const head = new THREE.Mesh(new THREE.SphereGeometry(R, 22, 16), mat(skin)); headG.add(head);
  sph(0.08, skin, -R, 0, 0, headG); sph(0.08, skin, R, 0, 0, headG);
  const hcap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.07, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), mat(hairC));
  hcap.position.set(0, 0.02, -0.03); hcap.rotation.x = -0.35; headG.add(hcap);
  const st = o.hairStyle || 'short';
  const tuft = (x, y, z, r, sx = 1, sy = 1, sz = 1) => sph(r, hairC, x, y, z, headG, sx, sy, sz);
  if (st === 'curly' || o.curl) { for (let i = 0; i < 13; i++) { const a = i * 2.4, v = 0.25 + (i % 4) * 0.2, rr = R * 1.02; tuft(Math.sin(a) * Math.cos(v) * rr, Math.sin(v) * rr + 0.03, Math.cos(a) * Math.cos(v) * rr * 0.92 - 0.04, 0.1 + (i % 3) * 0.012); } }
  if (st === 'short') { tuft(-0.08, R * 0.8, R * 0.62, 0.12, 1.5, 0.6, 0.8); tuft(0.1, R * 0.85, R * 0.55, 0.1, 1.2, 0.6, 0.8); }
  if (st === 'side') { tuft(0.06, R * 0.78, R * 0.66, 0.13, 1.7, 0.55, 0.8).rotation.z = -0.3; }
  if (st === 'spiky') for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 6), mat(hairC)); s.position.set(-0.16 + i * 0.08, R * 1.02, 0.02 + (i % 2) * 0.06); s.rotation.z = 0.25 - i * 0.12; headG.add(ns(s)); }
  if (st === 'long' || st === 'bob' || st === 'pony' || st === 'twin' || st === 'bun') { for (let i = 0; i < 4; i++) tuft(-0.15 + i * 0.1, R * 0.74 - Math.abs(i - 1.5) * 0.025, R * 0.7, 0.085, 1.1, 0.75, 0.7); }
  if (st === 'long') { const lh = cap(R * 0.78, 0.42, hairC); lh.position.set(0, -0.2, -0.16); lh.scale.z = 0.5; headG.add(lh); for (const sd of [-1, 1]) { const lk = cap(0.07, 0.3, hairC); lk.position.set(sd * (R - 0.02), -0.2, -0.02); headG.add(ns(lk)); } }
  if (st === 'bob') { const lh = cap(R * 0.86, 0.14, hairC); lh.position.set(0, -0.08, -0.12); lh.scale.z = 0.6; headG.add(lh); for (const sd of [-1, 1]) tuft(sd * (R - 0.01), -0.12, 0, 0.1, 0.7, 1.5, 1); }
  if (st === 'pony') { const bd = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 12), mat(0xff6b6b)); bd.position.set(0, R * 0.95, -R * 0.55); bd.rotation.x = 1.0; headG.add(ns(bd)); tuft(0, R + 0.1, -R * 0.75, 0.13); tuft(0, R + 0.02, -R * 1.1, 0.14); tuft(0, R - 0.14, -R * 1.25, 0.12); tuft(0, R - 0.28, -R * 1.25, 0.09); }
  if (st === 'twin') for (const sd of [-1, 1]) { tuft(sd * (R + 0.06), -0.06, -0.06, 0.12, 0.9, 1.3, 0.9); tuft(sd * (R + 0.08), -0.24, -0.06, 0.09, 0.9, 1.3, 0.9); const bd = sph(0.045, 0xff8787, sd * (R + 0.02), 0.06, -0.04, headG); bd.scale.set(1, 1, 1); }
  if (st === 'bun') tuft(0, R * 0.95, -R * 0.6, 0.14);
  if (o.band) { const b = new THREE.Mesh(new THREE.TorusGeometry(R * 1.06, 0.03, 6, 20, Math.PI), mat(o.band)); b.position.set(0, 0.02, 0.03); b.rotation.x = -0.12; headG.add(ns(b)); }
  if (o.hat) { cyl(0.22, 0.24, 0.35, 0xffffff, 0, 0.38, 0, headG); ball(0.27, 0xffffff, 0, 0.58, 0, headG); }
  // 얼굴
  const eyes = [-1, 1].map(sd => {
    const e = new THREE.Group(); e.position.set(sd * 0.105, 0.035, R * 0.86); headG.add(e);
    sph(0.058, 0xffffff, 0, 0, 0, e, 1, 1.15, 0.6); sph(0.04, 0x2b1d14, sd * -0.004, 0, 0.022, e, 1, 1.12, 0.6); sph(0.014, 0xffffff, 0.014, 0.02, 0.046, e);
    return e;
  });
  for (const sd of [-1, 1]) { const b = box(0.085, 0.02, 0.02, shade(hairC, hairC === 0xd9d9d9 ? -0.25 : -0.03), sd * 0.108, 0.135, R * 0.9, headG); b.rotation.z = sd * -0.14; ns(b); }
  sph(0.024, shade(skin, -0.06), 0, -0.035, R * 0.99, headG);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.013, 6, 14, Math.PI), mat(0xb5443f)); smile.position.set(0, -0.085, R * 0.93); smile.rotation.z = Math.PI; headG.add(ns(smile));
  const mouth = sph(0.045, 0x8c2f2a, 0, -0.115, R * 0.91, headG, 1, 0.6, 0.4); mouth.visible = false;
  sph(0.05, 0xff9e8f, -0.175, -0.07, R * 0.78, headG, 1, 0.7, 0.5); sph(0.05, 0xff9e8f, 0.175, -0.07, R * 0.78, headG, 1, 0.7, 0.5);
  if (o.glasses) { for (const sd of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.011, 6, 18), mat(0x5c4033)); r.position.set(sd * 0.105, 0.035, R * 0.96); headG.add(ns(r)); } ns(box(0.05, 0.012, 0.012, 0x5c4033, 0, 0.045, R * 0.99, headG)); }
  if (adult && !o.girl && hs % 3 === 0) ns(box(0.13, 0.025, 0.02, shade(hairC, -0.03), 0, -0.05, R * 0.97, headG)); // 콧수염
  // 소품
  const anim = { armL: arms[0], armR: arms[1], legL: legs[0], legR: legs[1], body, head: headG, headG, hy: 1.72, eyes, smile, mouth, blob, walk: 0, wave: 0, look: 0, baseL: 0, baseR: 0, ph: Math.random() * 10 };
  if (o.prop === 'ball') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), mat(0xe8731c)); b.position.set(0.06, -0.72, 0.1); arms[0].add(b); for (const r of [0, Math.PI / 2]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.171, 0.006, 4, 20), mat(0x3a2a1a)); l.rotation.y = r; b.add(ns(l)); } anim.baseL = -0.55; }
  if (o.prop === 'book') { const b = box(0.06, 0.3, 0.22, 0x2f9e44, 0.06, -0.6, 0.06, arms[0]); ns(box(0.065, 0.26, 0.2, 0xffffff, 0.005, 0, 0.012, b)); anim.baseL = -0.25; }
  // 부품 합치기: 머리 1 + 눈 2 + 입 2 + 팔 2 + 다리 2 + 몸통쯤만 따로 그려요
  smile.userData.keep = 1; mouth.userData.keep = 1;
  for (const e of eyes) bakeParts(e);
  bakeParts(headG); for (const pv of legs) bakeParts(pv); for (const pv of arms) bakeParts(pv); bakeParts(g);
  g.userData.anim = anim; g.userData.opts = o0; g.userData.adult = adult;
  const s = o.scale || (adult ? 1.1 : 1); g.scale.setScalar(s);
  const tag = textSprite(o.name, 0.34 / s, { fs: 48, fg: '#1d3557' }); tag.position.y = 2.25 + (o.hat ? 0.4 : 0); g.add(tag);
  const mark = textSprite('!', 0.5 / s, { fs: 70, bg: '#ffd43b', fg: '#c92a2a', border: '#c92a2a', pad: 18 });
  mark.position.y = 2.75 + (o.hat ? 0.4 : 0); mark.visible = false; mark.userData.baseY = mark.position.y; g.add(mark);
  g.userData.mark = mark; g.userData.tag = tag;
  return g;
}

// ---------------- 세계 만들기 (Lesson 12 · Winter Festival Town) ----------------
const zones = [];
const ceil = (c) => new THREE.MeshBasicMaterial({ color: c });
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0xffffff)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), mat(0xd8cbb5)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 0); scene.add(path);
const path2 = new THREE.Mesh(new THREE.PlaneGeometry(52, 6), mat(0xd8cbb5)); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -2); scene.add(path2);
const path3 = new THREE.Mesh(new THREE.PlaneGeometry(56, 5), mat(0xd8cbb5)); path3.rotation.x = -Math.PI / 2; path3.position.set(0, 0.013, 26); scene.add(path3);
const FEN = 46;
for (const [w, d, x, z] of [[2 * FEN, 0.4, 0, -FEN], [0.4, 2 * FEN, -FEN, 0], [0.4, 2 * FEN, FEN, 0], [FEN - 4, 0.4, -(FEN + 4) / 2, FEN], [FEN - 4, 0.4, (FEN + 4) / 2, FEN]])
  solid(w, 1.2, d, 0xffffff, x, 0.6, z);
solid(1, 4, 1, 0x1c7ed6, -4, 2, FEN); solid(1, 4, 1, 0x1c7ed6, 4, 2, FEN);
const gateSign = textPlane('Winter Festival Town ❄️', 1.0, { fs: 64, bg: '#1c7ed6', fg: '#fff' }); gateSign.position.set(0, 4.3, FEN - 0.1); gateSign.rotation.y = Math.PI;
block(-3.6, FEN + 0.3, 3.6, FEN + 1);
// 눈 덮인 나무
function pine(x, z, s = 1) {
  cyl(0.2 * s, 0.25 * s, 1.2 * s, 0x7a5230, x, 0.6 * s, z);
  for (let k = 0; k < 3; k++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry((1.5 - k * 0.35) * s, 1.5 * s, 10), mat(0x2f7d4f)); c.position.set(x, (1.6 + k * 0.9) * s, z); scene.add(c);
    const w = new THREE.Mesh(new THREE.ConeGeometry((0.8 - k * 0.18) * s, 0.6 * s, 10), mat(0xffffff)); w.position.set(x, (2.1 + k * 0.9) * s, z); scene.add(w);
  }
  block(x - 0.35, z - 0.35, x + 0.35, z + 0.35);
}
for (let i = -40; i <= 40; i += 8) { pine(i + 2, -44, 1); pine(43, i + 3, 1); if (i > -16) pine(-43, i, 1.1); }
for (const x of [-38, -14, 14, 38]) pine(x, 42, 0.9);
for (const [x, z] of [[-12, 36], [12, 38], [-14, 12], [14, 10]]) pine(x, z, 1.1);
// 눈사람
function snowman(x, z, s = 1) { ball(0.6 * s, 0xffffff, x, 0.55 * s, z); ball(0.42 * s, 0xffffff, x, 1.45 * s, z); ball(0.3 * s, 0xffffff, x, 2.05 * s, z); const n = new THREE.Mesh(new THREE.ConeGeometry(0.06 * s, 0.3 * s, 8), mat(0xff922b)); n.rotation.x = Math.PI / 2; n.position.set(x, 2.05 * s, z + 0.35 * s); scene.add(n); cyl(0.22 * s, 0.22 * s, 0.3 * s, 0x222222, x, 2.4 * s, z); block(x - 0.5 * s, z - 0.5 * s, x + 0.5 * s, z + 0.5 * s); }
snowman(-6, 34); snowman(7, 30, 0.8); snowman(-8, -12, 0.9);
// 벤치
function bench(x, z, rot = 0) { const g = new THREE.Group(); box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); }
bench(-6, 8); bench(6, 8);

// ---------- 서쪽: Snow Festival (스키장·아이스 쇼·눈 숲·기념품 가게) ----------
const SLOPE = { x: -33, z: -10 };
{ const r = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 14), mat(0xffffff)); r.rotation.x = 0; r.rotation.z = -0.32; r.position.set(-40, 1.6, -10); scene.add(r);
  block(-44, -17, -36.5, -3); for (const z of [-15, -10, -5]) { cyl(0.05, 0.05, 1.6, 0xe03131, -36.2, 0.8, z); }
  const s = textPlane('Ski Slope ⛷️', 0.7, { fs: 60, bg: '#1971c2', fg: '#fff' }); s.position.set(-36, 3.6, -17.5); cyl(0.06, 0.06, 3.3, 0x666666, -37.5, 1.6, -17.5); cyl(0.06, 0.06, 3.3, 0x666666, -34.5, 1.6, -17.5); }
// 아이스 쇼
const RINK = { x: -24, z: -24 };
const skaters = [];
{ cyl(5, 5, 0.12, 0xc5f6fa, RINK.x, 0.06, RINK.z, scene, 32);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; cyl(0.08, 0.08, 0.9, 0xffffff, RINK.x + Math.cos(a) * 5.2, 0.45, RINK.z + Math.sin(a) * 5.2, scene, 6); }
  block(RINK.x - 5, RINK.z - 5, RINK.x + 5, RINK.z + 5);
  for (const [dx, dz, c] of [[-1.5, 0, 0xf783ac], [1.5, 1, 0x845ef7]]) { const p = makePerson({ name: 'Skater', girl: true, shirt: c, hair: 0x3b2a1a }); p.position.set(RINK.x + dx, 0.12, RINK.z + dz); p.children.forEach(ch => { if (ch.isSprite) ch.visible = false; }); scene.add(p); skaters.push(p); }
  const s = textPlane('Ice Show ⛸️', 0.8, { fs: 60, bg: '#7048e8', fg: '#fff' }); s.position.set(RINK.x, 3.4, RINK.z + 5.4); s.rotation.y = Math.PI;
  // 남쪽(스키장·가운데 길)에서 걸어올 때도 간판이 보이게 앞면을 하나 더 달아요. (글자판은 한쪽 면만 보여요)
  const s2 = textPlane('Ice Show ⛸️', 0.8, { fs: 60, bg: '#7048e8', fg: '#fff' }); s2.position.set(RINK.x, 3.4, RINK.z + 5.42);
  cyl(0.06, 0.06, 3, 0x666666, RINK.x - 2, 1.5, RINK.z + 5.4); cyl(0.06, 0.06, 3, 0x666666, RINK.x + 2, 1.5, RINK.z + 5.4); }
// 눈 숲 (하이킹)
const FOREST = { x: -32, z: -36 };
for (const [x, z] of [[-40, -30], [-36, -38], [-28, -40], [-24, -33], [-38, -24], [-30, -30], [-20, -40], [-34, -42]]) pine(x, z, 1.3);
{ const s = textPlane('Snow Forest 🌲', 0.7, { fs: 60, bg: '#2b8a3e', fg: '#fff' }); s.position.set(-30, 3.4, -26.5); s.rotation.y = Math.PI;
  const s2 = textPlane('Snow Forest 🌲', 0.7, { fs: 60, bg: '#2b8a3e', fg: '#fff' }); s2.position.set(-30, 3.4, -26.48); cyl(0.06, 0.06, 3, 0x666666, -32, 1.5, -26.5); cyl(0.06, 0.06, 3, 0x666666, -28, 1.5, -26.5); }
// 기념품 가게
const SHOP = { x: -28, z: 4 };
solid(0.4, 3.6, 8, 0xffe8cc, -34, 1.8, 4); solid(12, 3.6, 0.4, 0xffe8cc, -28, 1.8, 0); solid(12, 3.6, 0.4, 0xffe8cc, -28, 1.8, 8);
{ const rg = new THREE.ConeGeometry(8, 2.6, 4); rg.rotateY(Math.PI / 4); const r = new THREE.Mesh(rg, mat(0xc92a2a)); r.scale.set(1.1, 1, 0.75); /* 모양을 먼저 돌려야 네모 지붕이 돼요 */ r.position.set(-28, 4.9, 4); scene.add(r);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), mat(0xf3d9b1)); fl.rotation.x = -Math.PI / 2; fl.position.set(-28, 0.02, 4); scene.add(fl);
  const s = textPlane('Souvenir Shop 🎁', 0.7, { fs: 60, bg: '#c92a2a', fg: '#fff' }); s.position.set(-21.9, 3.2, 4); s.rotation.y = Math.PI / 2; }
solid(1, 2.2, 6, 0x8d6e63, -33.2, 1.1, 4);
for (let k = 0; k < 8; k++) box(0.35, 0.35, 0.35, [0x74c0fc, 0xffd43b, 0xff8787, 0x63e6be][k % 4], -32.6, 0.7 + (k > 3 ? 0.9 : 0), 2 + (k % 4) * 1.3);
const CUP = { x: -27, z: 6.3 };
box(3, 0.9, 1, 0xdeb887, -27, 0.45, 7.2); block(-28.5, 6.7, -25.5, 7.7);

// ---------- 동쪽: Opinion Market (Listen and Do) ----------
const MKT = { x: 28, z: -4 };
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(18, 20), mat(0xfff0f6)); fl.rotation.x = -Math.PI / 2; fl.position.set(MKT.x, 0.02, MKT.z); scene.add(fl);
  for (const [dx, dz] of [[-8.6, -9.6], [8.6, -9.6], [-8.6, 9.6], [8.6, 9.6]]) solid(0.5, 4.6, 0.5, 0xffffff, MKT.x + dx, 2.3, MKT.z + dz);
  for (let i = 0; i < 6; i++) box(3, 0.3, 20.6, ceil(i % 2 ? 0xfff0f6 : 0xf7a1c4), MKT.x - 7.5 + i * 3, 4.75, MKT.z);
  solid(0.4, 3, 20, 0xffdeeb, MKT.x + 9, 1.5, MKT.z);
  const s = textPlane('Opinion Market 🛍️', 0.9, { fs: 62, bg: '#d6336c', fg: '#fff' }); s.position.set(MKT.x - 8.9, 4.1, MKT.z); s.rotation.y = -Math.PI / 2; }
// 진열대 6곳 [x, z]
const STALLS = [[23, -11], [27, -11], [31, -11], [35, -11], [27, 1], [31, 1]].map(([x, z]) => ({ x, z }));
function itemModel(id) {
  const g = new THREE.Group();
  if (id === 'scarf') { box(0.25, 1.0, 0.06, 0xae3ec9, -0.15, 0.5, 0, g); box(0.25, 1.0, 0.06, 0xae3ec9, 0.15, 0.5, 0, g); box(0.6, 0.2, 0.08, 0xe599f7, 0, 1.0, 0, g); }
  else if (id === 'hat') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 14), mat(0xe03131)); c.position.y = 0.4; g.add(c); ball(0.1, 0xffffff, 0, 0.75, 0, g); cyl(0.32, 0.32, 0.1, 0xffffff, 0, 0.1, 0, g, 14); }
  else if (id === 'board game') { box(0.8, 0.06, 0.8, 0x4263eb, 0, 0.03, 0, g); for (let k = 0; k < 4; k++) ball(0.06, [0xe03131, 0xffd43b, 0x40c057, 0xffffff][k], -0.2 + k * 0.13, 0.12, 0.1, g); }
  else if (id === 'book') { box(0.5, 0.12, 0.7, 0x2b8a3e, 0, 0.06, 0, g); box(0.48, 0.1, 0.66, 0xffffff, 0.02, 0.07, 0, g); }
  else if (id === 'cup game') { for (const [x, y] of [[-0.2, 0.12], [0, 0.12], [0.2, 0.12], [-0.1, 0.36], [0.1, 0.36], [0, 0.6]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.22, 12), mat([0x74c0fc, 0xffa8a8, 0xb2f2bb][Math.round(x * 10 + 2) % 3])); c.position.set(x, y, 0); g.add(c); } }
  else if (id === 'puzzle cube') { const cs = [0xe03131, 0x1c7ed6, 0xffd43b, 0x2b8a3e, 0xff922b, 0xffffff]; for (let i = 0; i < 27; i++) { const x = i % 3 - 1, y = (i / 3 | 0) % 3 - 1, z = (i / 9 | 0) - 1; box(0.13, 0.13, 0.13, cs[(i * 7) % 6], x * 0.14, 0.2 + y * 0.14, z * 0.14, g); } }
  else if (id === 'cup') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.3, 14), mat(0x74c0fc)); c.position.y = 0.15; g.add(c); box(0.36, 0.06, 0.14, 0x868e96, 0.04, 0.02, 0, g); box(0.06, 0.08, 0.12, 0x868e96, -0.1, -0.03, 0, g); box(0.06, 0.08, 0.12, 0x868e96, 0.16, -0.03, 0, g); }
  else if (id === 'photo') { box(0.5, 0.4, 0.04, 0xffffff, 0, 0.2, 0, g); box(0.42, 0.3, 0.05, 0x74c0fc, 0, 0.22, 0, g); ball(0.06, 0xffd43b, 0.1, 0.28, 0.03, g); }
  else if (id === 'music') { cyl(0.22, 0.22, 0.03, 0xced4da, 0, 0.1, 0, g, 24); cyl(0.05, 0.05, 0.04, 0x495057, 0, 0.1, 0, g, 12); g.children.forEach(c => c.rotation.x = Math.PI / 2); const n = textPlane('🎵', 0.35, { fs: 80, bg: null }, g); n.position.set(0, 0.45, 0); }
  else if (id === 'flag') { cyl(0.04, 0.04, 1.6, 0x868e96, 0, 0.8, 0, g); box(0.6, 0.4, 0.03, 0xff922b, 0.3, 1.4, 0, g); }
  return g;
}
STALLS.forEach((s, i) => {
  box(2.6, 1, 1.4, [0x9775fa, 0x9775fa, 0xffc078, 0xffc078, 0xf783ac, 0xf783ac][i], s.x, 0.5, s.z); block(s.x - 1.3, s.z - 0.7, s.x + 1.3, s.z + 0.7);
  const m = itemModel(L.listen[i].thing); m.position.set(s.x, 1.0, s.z); scene.add(m);
  const n = textPlane(`${i + 1}${L.listen[i].price ? ' · ' + L.listen[i].price : ''}`, 0.45, { fs: 52, bg: '#ffffff', fg: '#d6336c', border: '#d6336c' }); n.position.set(s.x, 2.6, s.z - 0.2);
});

// ---------- 북쪽: Art Museum (Reading) ----------
const MUS = { x: 0, z: -35 };
// 그림이 걸린 벽: 자동 창문이 두 그림 사이에 생겨서 그림처럼 보여요 → 이 벽만 자동 꾸미기를 끄고 아래 띠만 직접 달아요.
solid(30, 5, 0.4, 0xf8f0e3, 0, 2.5, -41.5).userData.plain = 1; box(30.06, 0.42, 0.5, shade(0xf8f0e3, -0.17), 0, 0.21, -41.5);
solid(0.4, 5, 12, 0xf8f0e3, -15, 2.5, -35.5); solid(0.4, 5, 12, 0xf8f0e3, 15, 2.5, -35.5);
solid(11, 5, 0.4, 0xf8f0e3, -9.5, 2.5, -29.5); solid(11, 5, 0.4, 0xf8f0e3, 9.5, 2.5, -29.5);
box(30.8, 0.4, 12.8, ceil(0xf1f3f5), 0, 5.2, -35.5);
for (const x of [-4, 4]) { cyl(0.35, 0.35, 5, 0xffffff, x, 2.5, -29.2, scene, 14); block(x - 0.35, -29.55, x + 0.35, -28.85); }
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), mat(0xb08968)); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.02, -35.5); scene.add(fl);
  const s = textPlane('Art Museum 🖼️', 1.0, { fs: 64, bg: '#495057', fg: '#fff' }); s.position.set(0, 4.3, -29.0); }
const lamp = new THREE.PointLight(0xffffff, 0.8, 30); lamp.position.set(0, 4.5, -35); scene.add(lamp);
const PAINT1 = { x: -7, z: -41.2 }, PAINT2 = { x: 7, z: -41.2 };
function frame(x, w, h) { box(w + 0.5, h + 0.5, 0.15, 0x2b2b2b, x, 2.6, -41.2); }
frame(PAINT1.x, 4, 3);
{ const p = textPlane('🥲', 2.6, { fs: 160, bg: '#ffe066', fg: '#000', pad: 30, minW: 380 }); p.position.set(PAINT1.x, 2.6, -41.1); }
frame(PAINT2.x, 4.4, 3);
{ const p = textPlane('🌼🌿📖🌿🌼', 1.2, { fs: 90, bg: '#8ce99a', fg: '#000', pad: 60, minW: 600 }); p.position.set(PAINT2.x, 2.6, -41.1); }
for (const x of [PAINT1.x, PAINT2.x]) { for (const dx of [-2, 2]) cyl(0.05, 0.05, 1, 0xc9a227, x + dx, 0.5, -39.3); const rope = box(4, 0.06, 0.06, 0xc92a2a, x, 0.95, -39.3); }
{ const a = textPlane('Roy Lichtenstein · 1964', 0.32, { fs: 44, bg: '#ffffff', fg: '#222' }); a.position.set(PAINT1.x, 0.75, -41.1); const b = textPlane('Claude Monet', 0.32, { fs: 44, bg: '#ffffff', fg: '#222' }); b.position.set(PAINT2.x, 0.75, -41.1); }

// ---------- 남서: Sunny School (Fun Talk 2) ----------
const SCH = { x: -28, z: 27 };
solid(0.4, 4, 16, 0xfff9db, -36, 2, 27); solid(16, 4, 0.4, 0xfff9db, -28, 2, 19); solid(16, 4, 0.4, 0xfff9db, -28, 2, 35);
solid(0.4, 4, 5, 0xfff9db, -20, 2, 21.5); solid(0.4, 4, 5, 0xfff9db, -20, 2, 32.5);
box(16.6, 0.4, 16.6, ceil(0xfff3bf), -28, 4.2, 27); box(16.8, 0.1, 16.8, 0xf08c00, -28, 4.45, 27);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mat(0xe9d8a6)); fl.rotation.x = -Math.PI / 2; fl.position.set(-28, 0.02, 27); scene.add(fl);
  const s = textPlane('Sunny School 🏫', 0.8, { fs: 62, bg: '#f08c00', fg: '#fff' }); s.position.set(-19.75, 3.4, 27); s.rotation.y = Math.PI / 2; }
// 졸업 현수막 (교문)
const GATE = { x: -14, z: 22 };
cyl(0.12, 0.12, 4, 0x868e96, -14, 2, 19.5); cyl(0.12, 0.12, 4, 0x868e96, -14, 2, 24.5); block(-14.2, 19.3, -13.8, 19.7); block(-14.2, 24.3, -13.8, 24.7);
{ const b = textPlane('🎓 Happy Graduation! 졸업 축하', 0.7, { fs: 56, bg: '#ffffff', fg: '#c2255c', border: '#c2255c' }); b.position.set(-14, 3.6, 22); b.rotation.y = Math.PI / 2; }
// 교실 안: 스크린, 책상, 노트북
const SCREEN = { x: -35.6, z: 27 };
box(0.1, 2.2, 4, 0xffffff, SCREEN.x, 2.2, SCREEN.z);
const screenTxt = textPlane('📹 Our Class Video', 0.6, { fs: 56, bg: '#212529', fg: '#fff', minW: 520 }); screenTxt.position.set(SCREEN.x + 0.1, 2.2, SCREEN.z); screenTxt.rotation.y = Math.PI / 2;
for (const [x, z] of [[-29, 23], [-29, 26.5], [-25, 23], [-25, 26.5]]) { box(1.4, 0.75, 0.9, 0xdeb887, x, 0.38, z); box(0.6, 0.45, 0.5, 0x4dabf7, x + 0.9, 0.23, z); }
const LAPTOP = { x: -33, z: 31 };
box(1.8, 0.8, 1.0, 0x8d6e63, LAPTOP.x, 0.4, LAPTOP.z); box(0.6, 0.03, 0.4, 0x495057, LAPTOP.x, 0.82, LAPTOP.z); { const l = box(0.6, 0.4, 0.03, 0x495057, LAPTOP.x, 1.02, LAPTOP.z - 0.2); l.rotation.x = -0.2; }
block(LAPTOP.x - 0.9, LAPTOP.z - 0.5, LAPTOP.x + 0.9, LAPTOP.z + 0.5);
const MUSIC = { x: -23, z: 33.6 };
box(2.4, 1.6, 0.6, 0x5f3dc4, MUSIC.x, 0.8, MUSIC.z + 0.6); { const s = textPlane('🎵 Music', 0.35, { fs: 48, bg: '#ffffff', fg: '#5f3dc4' }); s.position.set(MUSIC.x, 2, MUSIC.z + 0.25); s.rotation.y = Math.PI; }

// ---------- 남동: Let's Write · Computer Lab ----------
const WRITE = { x: 26, z: 30 };
box(16, 0.4, 12, 0xd3f9d8, WRITE.x, 0.2, WRITE.z);
// 동쪽 기둥 둘은 plain: 자동 차양이 🎮·good·bad 카드 바로 뒤에 걸려서 카드가 어수선해 보여요.
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) { const m = solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz); if (dx > 0) m.userData.plain = 1; }
box(17, 0.4, 13, ceil(0xd3f9d8), WRITE.x, 5.2, WRITE.z); box(17.2, 0.1, 13.2, 0x2b8a3e, WRITE.x, 5.45, WRITE.z);
{ const s = textPlane("Let's Write · Opinion Lab 💻", 0.85, { fs: 62, bg: '#2b8a3e', fg: '#fff' }); s.position.set(WRITE.x - 8.6, 4.4, WRITE.z); s.rotation.y = -Math.PI / 2; }
for (const dz of [-3, 0, 3]) { solid(1.2, 0.8, 2, 0xdeb887, WRITE.x + 5.5, 0.6, WRITE.z + dz); box(0.1, 0.6, 0.9, 0x212529, WRITE.x + 6, 1.3, WRITE.z + dz); box(0.04, 0.5, 0.8, [0x74c0fc, 0x8ce99a, 0xffd43b][dz / 3 + 1], WRITE.x + 5.93, 1.3, WRITE.z + dz); }
solid(0.4, 3.4, 10, 0xf8f9fa, WRITE.x + 7.6, 2, WRITE.z);
['🎮', '👍 good', '👎 bad'].forEach((e, i) => { const p = textPlane(e, 0.9, { fs: 80, bg: '#ffffff', border: '#2b8a3e' }); p.position.set(WRITE.x + 7.35, 4.0, WRITE.z - 3 + i * 3); p.rotation.y = -Math.PI / 2; });

// ---------- 얼음 낚시 연못 (보너스) ----------
const POND = { x: 10, z: -18 };
cyl(3.2, 3.2, 0.08, 0xd0ebff, POND.x, 0.04, POND.z, scene, 28); cyl(0.45, 0.45, 0.1, 0x1864ab, POND.x + 0.8, 0.06, POND.z, scene, 16);
block(POND.x + 0.35, POND.z - 0.45, POND.x + 1.25, POND.z + 0.45);
{ const s = textPlane('Ice Fishing 🎣', 0.5, { fs: 52, bg: '#ffffff', fg: '#1864ab' }); s.position.set(POND.x, 2.6, POND.z - 3.4); }

// ---------- 겨울 축제 소품 (v2.1) ----------
// 가운데 길 위·가게 앞에 건 등과 깃발은 3인칭 카메라(높이 2.3m)에 걸리지 않게 4m 위로 달아요.
lanternLine(-5.2, 36.5, 5.2, 36.5, 4.3); lanternLine(-5.2, -13.5, 5.2, -13.5, 4.3);
lanternLine(-21.4, -0.5, -21.4, 8.5, 4.5); // 기념품 가게 앞
bunting(-5.2, 15, 5.2, 15, 4.2); bunting(-13, -5.8, -13, 1.8, 4.0);
prop(gifts, -10.8, 37.3); prop(gifts, 10.8, 39.3); prop(gifts, 8.4, 31.3); prop(gifts, -20.7, 9);
prop(balloons, 18.2, -14.8, [0xf783ac, 0xffffff, 0x74c0fc]); prop(balloons, 18.2, 6.8, [0xffd43b, 0xf783ac, 0x9775fa]);
// 눈사람은 이 단원의 snowman(x, z, 크기)를 써요. (충돌 상자가 있어서 길·미션 동선 밖에만)
snowman(-7.6, -27.6, 0.9); snowman(14.6, -21.6, 0.8); snowman(-39.6, -20.2, 1);

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
  if (f) { heldMesh = itemModel(f); heldMesh.scale.setScalar(0.9); heldMesh.position.set(0.34, -0.5, -0.8); camera.add(heldMesh); }
}
function setHeld(id, label) { held = { kind: 'thing', id, label }; refreshHUD(); }
function worldTick(dt, t) {
  heldSync();
  if (heldMesh) heldMesh.rotation.y = Math.sin(t * 1.5) * 0.3;
  skaters.forEach((p, i) => { const a = t * 0.6 + i * Math.PI; p.position.x = RINK.x + Math.cos(a) * 2.5; p.position.z = RINK.z + Math.sin(a) * 2.5; p.rotation.y = -a; });
  for (const f of fallers) { f.userData.life -= dt; f.position.y += dt * 0.8; f.material.opacity = Math.max(0, f.userData.life); }
  fallers = fallers.filter(f => { if (f.userData.life <= 0) { scene.remove(f); return false; } return true; });
}
function puff(x, y, z, text) {
  const s = textSprite(text, 0.5, { fs: 60, bg: '#ffffff', fg: '#d6336c', border: '#d6336c' }); s.position.set(x, y, z); s.material.transparent = true; s.userData.life = 1.8; scene.add(s); fallers.push(s);
}
function drawMapWorld(tx, tz, s) {
  const R = (x, z, w, h, c, label) => { mctx.fillStyle = c; mctx.fillRect(tx(x - w / 2), tz(z - h / 2), w * s, h * s); if (label) { mctx.fillStyle = '#fff'; mctx.fillText(label, tx(x), tz(z) + 4); } };
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  R(0, 0, 8, 90, '#cbb994'); R(0, -2, 52, 6, '#cbb994'); R(0, 26, 56, 5, '#cbb994');
  R(-40, -10, 8, 14, '#74c0fc', '스키장'); R(RINK.x, RINK.z, 10, 10, '#7048e8', '아이스 쇼'); R(-31, -36, 14, 10, '#2b8a3e', '눈 숲');
  R(-28, 4, 12, 8, '#c92a2a', '기념품'); R(MKT.x, MKT.z, 18, 20, '#d6336c', '의견 시장');
  R(0, -35.5, 30, 12, '#495057', '미술관'); R(SCH.x, SCH.z, 16, 16, '#f08c00', '학교'); R(WRITE.x, WRITE.z, 16, 12, '#2b8a3e', '글쓰기');
  R(POND.x, POND.z, 6, 6, '#1864ab', '낚시');
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
// ----- 보는 방법: 3인칭(내 캐릭터가 보여요) / 1인칭(내 눈으로). V 키나 🎥 버튼으로 바꿔요 -----
const CAM = { third: true, d: 4, side: 0, zoom: 0, talkN: null, turn: 0, me: null, key: '', face: Math.PI, lx: 0, lz: 0, still: 0 };
try { const q = new URLSearchParams(location.search).get('cam') || localStorage.getItem('english3d_view'); if (q) CAM.third = String(q) !== '1'; } catch (e) {}
const camBtn = document.createElement('button'); camBtn.id = 'camBtn'; camBtn.title = '보는 방법 바꾸기 (V)';
const camLabel = () => { camBtn.textContent = CAM.third ? '🎥' : '👀'; };
function toggleView() {
  CAM.third = !CAM.third; camLabel();
  try { localStorage.setItem('english3d_view', CAM.third ? '3' : '1'); } catch (e) {}
  try { toast(CAM.third ? '🎥 내 캐릭터가 보여요 (V 키로 바꾸기)' : '👀 내 눈으로 봐요 (V 키로 바꾸기)'); } catch (e) {}
}
camBtn.onclick = toggleView; camLabel();
try { const bs = document.querySelector('.hud .btns'); bs.insertBefore(camBtn, document.querySelector('#mapBtn')); } catch (e) {}
addEventListener('keydown', (e) => { if (e.code === 'KeyV' && !dlgOpen && !(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT'))) toggleView(); });
const camBlocked = (x, z) => { for (const c of colliders) if (x > c.x1 - 0.22 && x < c.x2 + 0.22 && z > c.z1 - 0.22 && z < c.z2 + 0.22) return true; return false; };
// 카메라 가림: 충돌 상자가 없는 큰 것(나뭇잎·파라솔·천막·낮은 지붕)과 서 있는 사람 뒤로 카메라가 들어가지 않게 당겨 와요
const camRay = new THREE.Raycaster(), camB3 = new THREE.Box3(), CAMOCC = { list: [], t: 9 };
function camOccList() {
  const out = [];
  scene.traverse(o => {
    if (!o.isMesh) return;
    let big = o.userData.camBig;
    if (big === undefined) {
      if (!o.userData.camSeen) { o.userData.camSeen = 1; return; } // 방금 생긴 것은 자리를 잡은 다음에 재요
      big = 0; const m = o.material;
      if (!o.isInstancedMesh && o !== sky && m && !Array.isArray(m) && (m.isMeshStandardMaterial || m.isMeshLambertMaterial) && !m.transparent && o.geometry.type !== 'PlaneGeometry') {
        let skip = false; for (let a = o; a; a = a.parent) if (a.userData.anim || a === clouds) { skip = true; break; }
        if (!skip) { camB3.setFromObject(o); const w = camB3.max.x - camB3.min.x, d = camB3.max.z - camB3.min.z; big = w >= 1 && d >= 1 && w < 60 && d < 60 && camB3.max.y > 1.7 ? 1 : 0; }
      }
      o.userData.camBig = big;
    }
    if (big) out.push(o);
  });
  return out;
}
function camOccDist(ox, oy, oz, dx, dy, dz, far) {
  camRay.ray.origin.set(ox, oy, oz); camRay.ray.direction.set(dx, dy, dz).normalize(); camRay.near = 0; camRay.far = far;
  for (const h of camRay.intersectObjects(CAMOCC.list, false)) {
    let ok = true; for (let a = h.object; a; a = a.parent) if (!a.visible || a.userData.halo) { ok = false; break; }
    if (ok) return h.distance;
  }
  return Infinity;
}
const camPerson = (ppl, x, z) => { for (const n of ppl) { if (n.follow || !n.g.visible) continue; const q = n.g.position; if (Math.abs(q.x - x) < 0.5 && Math.abs(q.z - z) < 0.5) return true; } return false; };
function camTick(dt, t) {
  dt = Math.max(0, Math.min(0.1, dt || 0));
  const walkIn = Math.min(1, Math.hypot(touch.mx, touch.mz) + (keys.KeyW || keys.KeyS || keys.ArrowUp ? 1 : 0));
  // 말을 걸면 처음 잠깐 상대 쪽으로 돌아봐요. 3인칭이면 얼굴이 대화 상자에 가리지 않게 내 눈높이까지 다가가요.
  const talkN = started && dlgOpen && nearNPC && nearNPC.g.visible ? nearNPC : null;
  if (talkN !== CAM.talkN) { CAM.talkN = talkN; CAM.turn = talkN ? 0.9 : 0; }
  if (talkN && CAM.turn > 0) {
    CAM.turn -= dt; const q = talkN.g.position, k = Math.min(1, dt * 5);
    let dy = Math.atan2(-(q.x - P.x), -(q.z - P.z)) - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    P.yaw += dy * k; P.pitch += (-0.04 - P.pitch) * k;
  }
  CAM.zoom += ((talkN ? 1 : 0) - CAM.zoom) * Math.min(1, dt * 6);
  if (!CAM.third) {
    if (CAM.me) CAM.me.visible = false;
    camera.position.set(P.x, P.jy + 1.6 + (started ? Math.sin(t * 9) * 0.02 * walkIn : 0), P.z);
    camera.rotation.y = P.yaw; camera.rotation.x = P.pitch; return;
  }
  // 내 캐릭터
  const key = avatarKey();
  if (!CAM.me || CAM.key !== key) {
    if (CAM.me) scene.remove(CAM.me);
    const g = makePerson({ name: '나', look: key, adult: false }); g.userData.tag.visible = false; g.userData.mark.visible = false;
    scene.add(g); CAM.me = g; CAM.key = key; CAM.face = P.yaw + Math.PI; CAM.lx = P.x; CAM.lz = P.z;
  }
  const g = CAM.me, mx = P.x - CAM.lx, mz = P.z - CAM.lz, step = Math.hypot(mx, mz); CAM.lx = P.x; CAM.lz = P.z;
  let face = P.yaw + Math.PI, look = null; // 가만히 있으면 앞(카메라가 보는 쪽)을 봐요
  CAM.still = step > 0.004 && step < 1 ? 0 : CAM.still + dt;
  if (dlgOpen && nearNPC && nearNPC.g.visible) { const q = nearNPC.g.position; face = Math.atan2(q.x - P.x, q.z - P.z); look = [q.x, q.z]; } // 말할 때는 상대를 봐요
  else if (CAM.still < 0.25 && step > 0.004 && step < 1) face = Math.atan2(mx, mz); // 걸을 때는 가는 쪽을 봐요
  else if (CAM.still < 0.25) face = CAM.face;
  let df = face - CAM.face; df = Math.atan2(Math.sin(df), Math.cos(df)); CAM.face += df * Math.min(1, dt * 10);
  g.position.set(P.x, P.jy, P.z); g.rotation.y = CAM.face;
  let speaking = false; try { speaking = dlgOpen && ui.who.textContent === '나' && !!(window.speechSynthesis && speechSynthesis.speaking); } catch (e) {}
  animatePerson(g, t, dt, { run: running, air: P.jy > 0.02, talk: speaking, look });
  // 카메라: 머리 위 뒤쪽에서 오른쪽 어깨 너머로 봐요(앞사람이 내 캐릭터에 가리지 않게). 벽·천장·바닥을 뚫지 않게 당겨 와요
  const py = P.jy + 2.3 - 0.68 * CAM.zoom, cp = Math.cos(P.pitch), sp = Math.sin(P.pitch), hx = Math.sin(P.yaw) * cp, hz = Math.cos(P.yaw) * cp;
  let want = 4 * (1 - CAM.zoom);
  if (sp < -0.02) want = Math.min(want, (3.15 - py) / -sp);
  if (sp > 0.02) want = Math.min(want, (py - 0.4) / sp);
  let free = want; const ppl = Object.values(NPC);
  for (let d = 0.2; d <= want + 0.3; d += 0.12) { const x = P.x + hx * d, z = P.z + hz * d; if (camBlocked(x, z) || camPerson(ppl, x, z)) { free = Math.max(0, d - 0.4); break; } }
  if ((CAMOCC.t += dt) > 2) { CAMOCC.t = 0; try { CAMOCC.list = camOccList(); } catch (e) { CAMOCC.list = []; } }
  if (want > 0.3) { let od = Infinity; try { od = camOccDist(P.x, py, P.z, hx, -sp, hz, want + 0.4); } catch (e) {} if (od - 0.35 < free) free = Math.max(0, od - 0.35); }
  CAM.d = free < CAM.d ? free : CAM.d + (free - CAM.d) * Math.min(1, dt * 4);
  const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw), bx = P.x + hx * CAM.d, bz = P.z + hz * CAM.d;
  let sideT = Math.min(0.6, CAM.d * 0.17);
  if (camBlocked(bx + rx * (sideT + 0.9), bz + rz * (sideT + 0.9)) || camBlocked(bx + rx * sideT, bz + rz * sideT) || camBlocked(bx + rx * sideT * 0.5, bz + rz * sideT * 0.5)) sideT = 0; // 오른쪽에 벽이 가까우면 가운데로
  CAM.side = sideT < CAM.side ? sideT : CAM.side + (sideT - CAM.side) * Math.min(1, dt * 3);
  camera.position.set(bx + rx * CAM.side, py - sp * CAM.d, bz + rz * CAM.side);
  camera.rotation.y = P.yaw; camera.rotation.x = P.pitch;
  g.visible = CAM.d > (g.visible ? 1.8 : 2.0); // 벽·나무에 밀려 너무 가까워지면 캐릭터를 숨겨요(머리가 화면을 가리지 않게)
}

// ---------------- NPC ----------------
const NPC = {};
const WD = Object.fromEntries(L.words.map(w => [w.id, w]));
function addNPC(id, o, x, z, face = 0) {
  const g = makePerson(o); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  NPC[id] = { id, name: o.name, g, home: [x, z, face], idle: o.idle || null, talk: null, follow: false, ko: o.ko || '' };
  return NPC[id];
}
// 집 위치 [x, z, 방향]
const HOME = {
  kai: [-32, -6, Math.PI / 2], sister: [-31.6, -3.6, Math.PI / 2], dad: [-29.6, -7.4, Math.PI / 2], brother: [-29.8, -2.4, Math.PI / 2], mom: [-30, 4.5, Math.PI / 2],
  lee: [17, -1, -Math.PI / 2], yuna: [21.5, 4.5, Math.PI], andy: [22.8, 4.5, Math.PI],
  rani: [-11.6, 21, -Math.PI / 2], joel: [-11.4, 23.2, -Math.PI / 2], hajun: [-10, 22, -Math.PI / 2], smith: [-34, 24, Math.PI / 2],
  leo: [-8, -36.5, Math.PI], ava: [-6.2, -36.5, Math.PI], ben: [5.6, -36.5, Math.PI], zoe: [7.8, -36.5, Math.PI],
  emma: [WRITE.x - 3, WRITE.z, -Math.PI / 2], sam: [WRITE.x - 1.5, WRITE.z - 3, -Math.PI / 2], lily: [WRITE.x - 1.5, WRITE.z + 3, -Math.PI / 2],
  bonus: [POND.x - 1.2, POND.z + 0.4, Math.PI / 2]
};
const C_POS = [[-24, 21.5], [-31, 32.5], [-24.5, 30.2]];
L.classmates.forEach((c, i) => { HOME[c.id] = [...C_POS[i], Math.PI / 2]; });

addNPC('kai', { name: 'Kai', shirt: 0x1e88e5, hair: 0x2b1d14, idle: ["I think it looks boring.", '아이스 쇼는 지루해 보여.'] }, ...HOME.kai);
addNPC('sister', { name: 'Sister', girl: true, shirt: 0xf06595, hair: 0x2b1d14, scale: 0.8, idle: ['Oh, it looks fun. What do you think?', '와, 재미있어 보여. 어떻게 생각해?'] }, ...HOME.sister);
addNPC('dad', { name: 'Dad', shirt: 0x495057, hair: 0x2b1d14, scale: 1.15, idle: ["Look over there. There's an ice show.", '저기 봐. 아이스 쇼가 있네.'] }, ...HOME.dad);
addNPC('brother', { name: 'Brother', shirt: 0x2f9e44, hair: 0x2b1d14, scale: 1.05, idle: ['How about going hiking in the snow forest?', '눈 숲으로 하이킹 가는 게 어때?'] }, ...HOME.brother);
addNPC('mom', { name: 'Mom', girl: true, shirt: 0x7048e8, skirt: 0x5f3dc4, hair: 0x2b1d14, scale: 1.12, idle: ['Sure.', '그래.'] }, ...HOME.mom);
addNPC('lee', { name: 'Ms. Lee', girl: true, shirt: 0xd6336c, skirt: 0xa61e4d, hair: 0x222222, scale: 1.12, idle: ["I think it's fun. What do you think?", '나는 재미있다고 생각해. 너는 어떻게 생각하니?'] }, ...HOME.lee);
addNPC('yuna', { name: 'Yuna', girl: true, shirt: 0xffa94d, hair: 0x111111, idle: ["I think it's cheap. What do you think?", '나는 싸다고 생각해. 너는 어떻게 생각해?'] }, ...HOME.yuna);
addNPC('andy', { name: 'Andy', shirt: 0x15aabf, hair: 0xd4a017, idle: ["I don't think so. I think it's expensive.", '나는 그렇게 생각하지 않아. 비싸다고 생각해.'] }, ...HOME.andy);
addNPC('rani', { name: 'Rani', girl: true, shirt: 0xf06292, hair: 0x1b1b1b, idle: ["It's already February.", '벌써 2월이야.'] }, ...HOME.rani);
addNPC('joel', { name: 'Joel', shirt: 0x26c6da, hair: 0xd7a96b, idle: ["I'll miss our teacher, Ms. Smith.", '스미스 선생님이 보고 싶을 거야.'] }, ...HOME.joel);
addNPC('hajun', { name: 'Hajun', shirt: 0x43a047, hair: 0x111111, idle: ["That's a good idea.", '좋은 생각이야.'] }, ...HOME.hajun);
addNPC('smith', { name: 'Ms. Smith', girl: true, shirt: 0x845ef7, skirt: 0x5f3dc4, hair: 0xd4a017, scale: 1.12, idle: ["I'll miss you.", '보고 싶을 거예요.'] }, ...HOME.smith);
addNPC('leo', { name: 'Leo', shirt: 0xc92a2a, hair: 0x3b2a1a, idle: ["I think she's happy.", '나는 그녀가 행복하다고 생각해.'] }, ...HOME.leo);
addNPC('ava', { name: 'Ava', girl: true, shirt: 0x2b8a3e, skirt: 0xfab005, hair: 0x111111, skin: 0x8d5524, idle: ["I think she's sad.", '나는 그녀가 슬프다고 생각해.'] }, ...HOME.ava);
addNPC('ben', { name: 'Ben', shirt: 0x1971c2, hair: 0x111111, skin: 0x8d5524, idle: ["I think she's sleeping.", '나는 그녀가 자고 있다고 생각해.'] }, ...HOME.ben);
addNPC('zoe', { name: 'Zoe', girl: true, shirt: 0xfcc419, hair: 0xa0522d, idle: ["I think she's reading a book.", '나는 그녀가 책을 읽고 있다고 생각해.'] }, ...HOME.zoe);
addNPC('emma', { name: 'Emma', girl: true, shirt: 0x2b8a3e, hair: 0xd4a017, idle: ['Playing computer games is good. What do you think?', '컴퓨터 게임을 하는 것은 좋아. 너는 어떻게 생각해?'] }, ...HOME.emma);
addNPC('sam', { name: 'Sam', shirt: 0x4dabf7, hair: 0x3b2a1a, idle: ['I think so, too.', '나도 그렇게 생각해.'] }, ...HOME.sam);
addNPC('lily', { name: 'Lily', girl: true, shirt: 0xff8787, hair: 0x111111, idle: ["I don't think so.", '나는 그렇게 생각하지 않아.'] }, ...HOME.lily);
addNPC('bonus', { name: 'Ling', girl: true, shirt: 0x1864ab, hair: 0x111111, hat: true, idle: ['I think fishing is boring.', '나는 낚시가 지루하다고 생각해.'] }, ...HOME.bonus);
L.classmates.forEach((c, i) => addNPC(c.id, { name: c.name, girl: c.girl, shirt: c.shirt, hair: [0x111111, 0xa0522d, 0x3b2a1a][i], scale: 0.9, idle: [`I think it's ${c.says}.`, `나는 ${WD[c.says].kt} 생각해.`] }, ...HOME[c.id]));
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
let auditLog = null; // 개발용: ?audit
// opt.area: "찾는 것이 과제"일 때 쓰는 약한 힌트. 정확한 곳 대신 반지름 area(m)짜리 넓은 고리만 보여 주고,
//   30초 넘게 헤매면 고리가 조금씩 줄어들어요(75초 뒤에는 정확한 곳을 알려 줘요).
function setObj(text, pos, opt) {
  const keepT = objective && objective.area && opt && opt.area && objective.key === (opt.key || text) ? objective.t : 0;
  objective = { text, pos, t: keepT };
  if (pos && opt && opt.area) {
    let h = 7; const key = opt.key || text; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const a = (h % 628) / 100, k = 0.2 + ((h >>> 5) % 35) / 100, A = opt.area;
    objective.area = A; objective.key = key; objective.exact = pos;
    objective.R = () => { const s = objective.t; return s < 30 ? A : s > 75 ? 0 : Math.max(2.5, A + (2.5 - A) * (s - 30) / 40); };
    objective.pos = () => { const e = pos(); if (!e) return null; const R = objective.R(); return R ? [e[0] + Math.cos(a) * R * k, e[1] + Math.sin(a) * R * k] : e; };
  }
  ui.obj.innerHTML = text; if (auditLog) auditLog.pending = true;
  hudFit();
}
// 작은 화면: 위쪽 칸(버튼 줄·미션 칸)의 실제 높이를 재서 그 아래 표시들이 겹치지 않게 해요 (style.css 의 --hudB)
function hudFit() { requestAnimationFrame(() => { try { const h = document.querySelector('.hud').getBoundingClientRect().bottom; if (h > 0) document.documentElement.style.setProperty('--hudB', Math.round(h) + 'px'); } catch (e) {} }); }
addEventListener('resize', hudFit); setInterval(hudFit, 1500);
const npcPos = (id) => () => [NPC[id].g.position.x, NPC[id].g.position.z];
const rectMid = (r) => r ? [(r.x1 + r.x2) / 2, (r.z1 + r.z2) / 2] : null;

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
const AGREE = 'I think so, too.', DISAGREE = "I don't think so.";
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 눈 축제 나들이', book: 'Fun Talk 1', start: stage1 },
  { title: '2. 의견 시장', book: 'Listen and Do · Play Together 1', start: stage2 },
  { title: '3. 선생님께 드리는 영상', book: 'Fun Talk 2 · Read and Talk · Play Together 2', start: stage3 },
  { title: '4. 문장 블록 만들기', book: 'Read and Play · Write and Do', start: stage4 },
  { title: '5. 미술관에서', book: 'Before/After You Read', start: stage5 },
  { title: '6. 내 의견을 쓰는 글', book: "Let's Write", start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  screenTxt.visible = true;
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
function flash(color = '#fff') { const f = document.createElement('div'); f.style.cssText = `position:fixed;inset:0;background:${color};z-index:50;opacity:1;transition:opacity .8s;pointer-events:none`; document.body.appendChild(f); setTimeout(() => f.style.opacity = 0, 300); setTimeout(() => f.remove(), 1200); }
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
// 정답이 없는 선택 (내 의견 고르기) — 고른 값을 돌려줘요
function choose(who, en, ko, choices) {
  return new Promise(res => {
    openDlg(); setLine(who, en, ko, { speak: false, koAlways: true });
    ui.next.style.display = 'none';
    const btns = choices.map((c, i) => {
      const b = document.createElement('button'); b.className = 'choice'; b.dataset.r = 1; b.innerHTML = `<span class="num">${i + 1}</span>${c[1]}`;
      b.onclick = () => { if (b.disabled) return; btns.forEach(x => x.disabled = true); b.classList.add('right'); beep('ok'); if (/[a-z]/i.test(c[2] || '')) speak(c[2], '나'); setTimeout(() => { dlgChoiceKeys = null; res(c[0]); }, 800); };
      ui.ch.appendChild(b); return b;
    });
    dlgChoiceKeys = btns;
  });
}
function pickUp(id, label, x, z, then, scale = 1.6) {
  const g = itemModel(id); g.scale.setScalar(scale);
  return addItem(g, x, z, (it) => { removeItem(it); if (label) setHeld(id, label); beep('get'); then(it); }, { y: 1.0, r: 1.3, spin: 0.8 });
}

// ---- 1. Fun Talk 1 · 눈 축제 ----
function stage1() {
  setObj('⛷️ 서쪽 <b>Ski Slope</b>의 <b>Kai</b> 가족에게 가요', npcAt('kai')); mark('kai');
  NPC.kai.talk = async () => {
    mark('kai', false); NPC.kai.talk = null;
    await readLines(L.funTalk1.slope);
    await ask('나', 'Kai가 되어 대답해요.', '😴 Kai는 아이스 쇼가 지루해 보여요. 알맞은 말을 고르세요.', ["I don't think so. I think it looks boring.", 'I think so, too.', "It's 5,000 won.", "I'm faster than you."], { me: true, hint: "동의하지 않을 때: I don't think so." });
    await ask('', 'What does Kai think about the ice show?', 'Kai는 아이스 쇼에 관해 어떻게 생각하나요?', ['It looks boring.', 'It looks fun.', 'It looks easy.', 'It looks cheap.']);
    await say('Brother', 'How about going hiking in the snow forest?', '눈 숲으로 하이킹 가는 게 어때?');
    await ask('나', 'Kai가 되어 형의 제안에 대답해요. 🥾', 'Kai는 하이킹이 재미있을 것 같대요.', ["Oh, that sounds fun. Let's go hiking.", "I don't think so. I think it looks boring.", 'This is cheap.', "It's warm in here."], { me: true });
    await say('', '', '🌲 북쪽 Snow Forest 꼭대기의 주황 깃발까지 함께 걸어가요!', { btn: '출발!' });
    closeDlg();
    placeNPC('sister', -30, -31, 0); placeNPC('brother', -27.6, -31.5, 0); placeNPC('dad', -26.5, -29.8, 0);
    NPC.kai.follow = true;
    setObj('🥾 <b>Snow Forest</b>의 주황 깃발까지 걸어가요', () => [-33, -34]);
    pickUp('flag', null, -33, -34, () => {
      NPC.kai.follow = false; good();
      const p = NPC.sister.g.position; puff(p.x, 2.6, p.z, 'Hurry up!');
      speak('Come on. Hurry up!', 'Sister'); toast('Sister: <b>Come on. Hurry up!</b> (어서 와. 서둘러!)', 3200);
      placeNPC('kai', -25.5, 3, Math.PI / 2); placeNPC('sister', -24.6, 5, -Math.PI / 2); placeNPC('mom', -30.5, 5.5, Math.PI / 2);
      placeNPC('dad', -31, 2, Math.PI / 2); placeNPC('brother', -24.5, 1.2, -Math.PI / 2);
      setObj('🎁 <b>Souvenir Shop</b>에서 스케이트 모양 컵을 찾아요', () => [CUP.x, CUP.z]);
      pickUp('cup', '⛸️ skate cup', CUP.x, CUP.z, () => {
        setObj('⛸️ 컵을 Kai의 <b>여동생</b>에게 보여 줘요', npcAt('sister')); mark('sister');
        NPC.sister.talk = async () => {
          mark('sister', false); NPC.sister.talk = null; held = null; refreshHUD();
          await readLines(L.funTalk1.shop);
          await ask('나', 'Kai가 되어 대답해요. 🙂', 'Kai도 컵이 싸다고 생각해요.', [AGREE, "I don't think so. I think it's expensive.", 'I think it looks boring.', 'How about going hiking?'], { me: true, hint: '동의할 때: I think so, too.' });
          await say('Sister', 'Mom, can I buy this cup?', '엄마, 이 컵 사도 돼요?');
          await say('Mom', 'Sure.', '그럼.');
          await ask('', "What is Kai's sister going to buy?", 'Kai의 여동생이 사려는 물건은?', ['⛸️ a skate cup', '🎿 skis', '🧣 a scarf', '⛄ a snowman']);
          await say('', '', '❄️ Fun Talk 1 완료! 동의하지 않을 때는 I don\'t think so., 동의할 때는 I think so, too.라고 말해요.', { btn: '다음 미션 ▶' });
          nextStage();
        };
      });
    }, 1.3);
  };
}

// ---- 2. Listen and Do + Play Together 1 ----
function stage2() {
  setObj('🛍️ 동쪽 <b>Opinion Market</b>의 <b>Ms. Lee</b>에게 가요', npcAt('lee')); mark('lee');
  NPC.lee.talk = async () => {
    mark('lee', false); NPC.lee.talk = null;
    await say('Ms. Lee', 'Welcome! Yuna and Andy are shopping. Listen to them.', '어서 와요! 유나와 앤디가 쇼핑 중이에요. 두 사람의 말을 들어 봐요.');
    await say('', '', '진열대 1~6번에서 두 사람의 대화를 잘 듣고, 서로 동의했는지(⭕) 동의하지 않았는지(❌) 골라요.', { btn: '시작!' });
    closeDlg(); stageState.k = 0; s2next();
  };
}
function s2next() {
  const k = stageState.k, it = L.listen[k], s = STALLS[k];
  placeNPC('yuna', s.x - 0.6, s.z + (s.z < 0 ? 1.7 : -1.7), s.z < 0 ? Math.PI : 0); placeNPC('andy', s.x + 0.7, s.z + (s.z < 0 ? 1.7 : -1.7), s.z < 0 ? Math.PI : 0);
  setObj(`🛍️ ${k + 1}번 진열대 ${it.emoji} 앞의 <b>Yuna</b>에게 가요 (${k}/6)`, npcAt('yuna')); mark('yuna');
  NPC.yuna.talk = async () => {
    mark('yuna', false); NPC.yuna.talk = null;
    await say(it.a[0], it.a[1], `${k + 1}번 ${it.emoji} · 잘 들어 보세요. (🔊 다시 듣기)`, { listen: true, koAlways: true });
    await say(it.b[0], it.b[1], '대답을 잘 들어 보세요. (🔊 다시 듣기)', { listen: true, koAlways: true });
    const yes = `⭕ 동의했어요`, no = `❌ 동의하지 않았어요`;
    await ask('', `${k + 1}번 ${it.emoji} · ${it.b[0]}는 동의했나요?`, '들은 대답으로 골라요.', [yes, no], { right: it.agree ? yes : no, noShuffle: true, sayIt: false, hint: `${it.b[0]}: ${it.b[1]}` });
    stageState.k++; closeDlg();
    if (stageState.k < L.listen.length) s2next(); else s2pt1();
  };
}
function s2pt1() {
  placeNPC('yuna', ...HOME.yuna); placeNPC('andy', ...HOME.andy);
  setObj('🙂 <b>Ms. Lee</b>에게 돌아가 선택 대결 놀이를 해요', npcAt('lee')); mark('lee');
  NPC.lee.talk = async () => {
    mark('lee', false); NPC.lee.talk = null;
    await say('Ms. Lee', "Let's play a game! Look at the card and listen to my opinion.", 'Play Together 1 · 선택 대결 놀이! 카드를 보고 내 의견을 들어요.');
    await say('', '', '화이트보드에 그린 내 얼굴(🙂 동의 / 🙁 동의하지 않음)에 맞게 대답해요.', { btn: '좋아요!' });
    for (const c of shuffle(L.cards).slice(0, 4)) {
      const agree = Math.random() < 0.5;
      await ask('Ms. Lee', `${c.pic}  ${c.en} What do you think?`, `내 화이트보드: ${agree ? '🙂 동의해요' : '🙁 동의하지 않아요'} → 알맞은 대답은?`, [AGREE, DISAGREE, 'What do you think?'], { right: agree ? AGREE : DISAGREE, me: true, speakQ: true });
    }
    await say('Ms. Lee', 'Great job! You can say your opinion.', '잘했어요! 이제 의견을 말할 수 있어요.');
    nextStage();
  };
}

// ---- 3. Fun Talk 2 + Read and Talk + Play Together 2 ----
function stage3() {
  setObj('🎓 남서쪽 <b>Sunny School</b> 교문의 <b>Rani</b>에게 가요', npcAt('rani')); mark('rani');
  NPC.rani.talk = async () => {
    mark('rani', false); NPC.rani.talk = null;
    await readLines(L.funTalk2.gate);
    await ask('나', 'Joel이 되어 선생님을 위한 일을 제안해요. 📹', '영상을 만들자고 제안해요.', ['How about making a video?', "I think it's expensive.", "I'll miss you.", "It's already February."], { me: true, hint: 'How about ~ing? = ~하는 게 어때?' });
    await say('Hajun', "That's a good idea. She can remember us.", '좋은 생각이야. 선생님이 우리를 기억하실 수 있겠다.');
    await say('', '', '📷 학교 마당에 떨어진 우리 반 사진 3장을 모아 영상을 만들어요.', { btn: '모을게!' });
    closeDlg(); stageState.ph = 0;
    placeNPC('rani', -30, 28.5, Math.PI / 2); placeNPC('joel', -31.2, 30.6, Math.PI); placeNPC('hajun', -33, 29.2, Math.PI / 2);
    const spots = [[-12, 30], [-17, 14], [-6, 20]];
    spots.forEach(([x, z]) => pickUp('photo', null, x, z, () => {
      stageState.ph++; toast(`📷 사진 ${stageState.ph}/3`);
      if (stageState.ph < 3) return;
      setObj('💻 교실 안 노트북 옆의 <b>Hajun</b>에게 가요', npcAt('hajun')); mark('hajun');
      NPC.hajun.talk = s3video;
    }, 1.4));
    setObj('📷 학교 마당의 사진을 모아요 (0/3)', nearestItem);
  };
}
async function s3video() {
  mark('hajun', false); NPC.hajun.talk = null; good();
  screenTxt.visible = true;
  await say('Hajun', 'This video is nice. What do you think, Joel?', '이 영상 멋지다. Joel, 너는 어떻게 생각해?');
  await ask('나', 'Joel이 되어 대답해요. 😑', 'Joel은 영상이 조금 심심하대요.', ["Umm.... I think it's boring.", "That's a good idea.", 'Congratulations, everyone!', "I'll miss our teacher."], { me: true });
  await ask('', 'What does Joel think about the video?', 'Joel은 영상에 관해 어떻게 생각하나요?', ["It's boring.", "It's fun.", "It's easy.", "It's expensive."]);
  await say('Hajun', 'How about adding music to the video?', '영상에 음악을 넣는 게 어때?');
  await ask('나', 'Rani가 되어 하준이의 제안에 대답해요. 🎵', '제안에 동의하는 말을 골라요.', ["That's a good idea. I think it looks easy.", "I don't think so. I think it's boring.", "It's already February.", 'This is cheap.']);
  await say('Joel', "I think so, too. I can do it now.", '나도 그렇게 생각해. 지금 바로 할 수 있어.');
  await say('', '', '🎵 교실 뒤쪽 음악 선반에서 음악 CD를 가져다 Joel에게 줘요.', { btn: '가져올게!' });
  closeDlg();
  setObj('🎵 교실 뒤 <b>Music</b> 선반의 CD를 가져와요', () => [MUSIC.x, MUSIC.z - 1]);
  pickUp('music', '🎵 music CD', MUSIC.x, MUSIC.z - 1, () => {
    setObj('🎵 CD를 <b>Joel</b>에게 줘요', npcAt('joel')); mark('joel');
    NPC.joel.talk = async () => {
      mark('joel', false); NPC.joel.talk = null; held = null; refreshHUD(); good();
      await say('Hajun', "Wow, it's great. Ms. Smith will like it.", '와, 멋지다. 스미스 선생님이 좋아하실 거야.');
      await say('', '', '🎓 졸업식 날이에요!', { btn: '다음 ▶' });
      for (const [id, x, z] of [['rani', -30.5, 22.5], ['joel', -30.5, 25], ['hajun', -30.5, 27.5], ...L.classmates.map((c, i) => [c.id, -26.8, 22 + i * 3])]) placeNPC(id, x, z, -Math.PI / 2);
      placeNPC('smith', -34, 26, Math.PI / 2);
      await say(...L.funTalk2.end[0]);
      flash('#000'); screenTxt.visible = false;
      const t = textPlane('💐 Thank you, Ms. Smith! 🎵', 0.55, { fs: 56, bg: '#fff3bf', fg: '#c2255c', minW: 520 }); t.position.set(SCREEN.x + 0.12, 2.2, SCREEN.z); t.rotation.y = Math.PI / 2; addDecor(t);
      await say('', '', '💡 갑자기 불이 꺼지고 감사 영상이 나와요!', {});
      await say(...L.funTalk2.end[1]); await say(...L.funTalk2.end[2]);
      await ask('', "What did Rani say to Hajun's idea?", 'Rani는 하준이의 제안에 뭐라고 말했나요?', ["That's a good idea.", "I don't think so.", "I'll miss you.", "It's boring."]);
      closeDlg(); s3talk();
    };
  });
}
function s3talk() {
  setObj('👩‍🏫 <b>Ms. Smith</b>에게 가서 낱말을 읽어요', npcAt('smith')); mark('smith');
  NPC.smith.talk = async () => {
    mark('smith', false); NPC.smith.talk = null;
    await say('Ms. Smith', 'Read the words and say your opinion.', 'Read and Talk · 낱말을 읽고 의견을 말해 봐요.');
    for (const r of shuffle(L.readTalk).slice(0, 3)) {
      const w = WD[r.word];
      await ask('Ms. Smith', `${r.pic}`, `알맞은 낱말은? (${w.ko})`, [w.id, w.opp, ...shuffle(L.words.map(x => x.id).filter(x => x !== w.id && x !== w.opp)).slice(0, 1)], { sayIt: true });
    }
    await say('Ms. Smith', "Let's play a game. Find friends with the same opinion!", 'Play Together 2 · 같은 의견 찾기! 먼저 내 의견을 골라요.');
    stageState.my = {};
    for (const o of L.opinions) {
      stageState.my[o.id] = await choose('나', `${o.pic}  ${o.en}`, '내 생각에 ⭕ 표 해요. (정답은 없어요!)', o.pair.map(p => [p, `${WD[p].emoji} ${p} (${WD[p].ko})`, `I think it's ${p}.`]));
    }
    await say('', '', '반 친구 3명에게 말을 걸어요. 친구의 의견을 듣고 내 의견에 맞게 대답해요.', { btn: '시작!' });
    closeDlg(); s3friends();
  };
}
function s3friends() {
  stageState.done = {}; stageState.same = [];
  const left = () => L.classmates.filter(c => !stageState.done[c.id]).map(c => c.id);
  L.classmates.forEach(c => {
    mark(c.id);
    NPC[c.id].talk = async () => {
      mark(c.id, false); NPC[c.id].talk = null;
      const o = L.opinions.find(x => x.id === c.topic), mine = stageState.my[c.topic];
      const same = mine === c.says, other = `${DISAGREE} I think it's ${mine}.`;
      await ask(c.name, `${o.pic}  I think it's ${c.says}. What do you think?`, `내 의견: ${WD[mine].emoji} ${mine} → 알맞은 대답은?`, [AGREE, same ? `${DISAGREE} I think it's ${WD[mine].opp}.` : other], { right: same ? AGREE : other, me: true, speakQ: true });
      if (same) { stageState.same.push(c.name); toast(`✍️ 같은 의견! 표에 <b>${c.name}</b> 이름을 써요.`, 2400); }
      else toast('🙂 의견이 달라요. 서로의 생각을 존중해요!', 2400);
      stageState.done[c.id] = 1; closeDlg();
      const n = Object.keys(stageState.done).length;
      if (n < L.classmates.length) setObj(`🗣️ 반 친구에게 말을 걸어요 (${n}/3)`, () => nearestOf(left()));
      else {
        await say('Ms. Smith', 'Good job! Different opinions are okay.', `잘했어요! 같은 의견 친구: ${stageState.same.length ? stageState.same.join(', ') : '없음'} · 의견이 달라도 괜찮아요.`, { btn: '다음 미션 ▶' });
        nextStage();
      }
    };
  });
  setObj('🗣️ 교실의 반 친구에게 말을 걸어요 (0/3)', () => nearestOf(left()));
}

// ---- 4. 문장 블록 ----
const BLK = { x: 0, z: 2 };
function stage4() {
  placeNPC('lee', 0, 11, Math.PI);
  setObj('🧱 마을 가운데의 <b>Ms. Lee</b>에게 가요', npcAt('lee')); mark('lee');
  NPC.lee.talk = async () => {
    mark('lee', false); NPC.lee.talk = null;
    await say('Ms. Lee', "Let's make sentences with word blocks!", '단어 블록으로 문장을 만들어 봐요!');
    await say('', '', '마을 가운데에 단어 블록이 떠 있어요. 문장 순서대로 블록에 부딪혀서 모으세요. 대문자로 시작하는 단어가 첫 단어예요!', { btn: '시작!' });
    closeDlg(); stageState.si = 0; spawnSentence();
  };
}
function spawnSentence() {
  clearItems(); spawnThCoins();
  const sen = L.sentences[stageState.si];
  const words = sen.en.split(' ');
  const pool = ['boring.', 'expensive.', 'easy.', 'too.', 'What', 'you', "it's", 'fun.', 'so.', 'Look', 'cheap.', 'think?'].filter(w => !words.includes(w));
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
  await say('Ms. Lee', sen.en, sen.ko + ' ⭐', { btn: '다음 ▶' });
  busy = false; closeDlg();
  stageState.si++;
  if (stageState.si < L.sentences.length) spawnSentence();
  else { ui.sent.style.display = 'none'; clearItems(); nextStage(); }
}

// ---- 5. What Do You Think? (Reading) ----
function stage5() {
  setObj('🖼️ 북쪽 <b>Art Museum</b>의 <b>Leo</b>에게 가요', npcAt('leo')); mark('leo');
  NPC.leo.talk = async () => {
    mark('leo', false); NPC.leo.talk = null;
    await say('', '', 'Before You Read · 의견을 나타내는 문장(I think ~ / I don\'t think so.)에 귀 기울이며 읽어요.', { btn: '읽기 시작' });
    await readLines(L.reading.p1);
    await ask('', 'Leo thinks the woman is happy.', '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { noShuffle: true, sayIt: false });
    await ask('', 'Ava thinks the woman is happy, too.', '글의 내용과 맞으면 O, 틀리면 X', ['⭕ O (맞아요)', '❌ X (틀려요)'], { right: '❌ X (틀려요)', noShuffle: true, sayIt: false, hint: "Ava: I don't think so. I think she's sad." });
    closeDlg();
    setObj('🖼️ 오른쪽 그림 앞의 <b>Zoe</b>에게 가요', npcAt('zoe')); mark('zoe');
    NPC.zoe.talk = async () => {
      mark('zoe', false); NPC.zoe.talk = null;
      await readLines(L.reading.p2);
      await ask('', 'What is the woman doing? (Zoe)', 'Zoe는 그림 속 여자가 무엇을 한다고 생각하나요?', ["She's reading a book.", "She's sleeping.", "She's crying.", "She's smiling."], { sayIt: true });
      await say('', '', 'After You Read A · 각 문장이 어느 작품에 알맞은지 골라요. (1: 🥲 릭턴스타인 / 2: 🌼 모네)', { btn: '시작' });
      for (const m of L.reading.match) {
        const one = '🖼️ 1 (🥲 우는 여자)', two = '🖼️ 2 (🌼📖 꽃 위의 여자)';
        await ask('', m.en, '어느 작품일까요?', [one, two], { right: m.n === 1 ? one : two, noShuffle: true, sayIt: false, speakQ: true });
      }
      await say('', '', 'After You Read B · 글의 내용에 맞게 문장을 완성해요.', { btn: '시작' });
      for (const f of L.reading.fill) {
        const tail = f.ans === 'reading' ? ' a book.' : '.';
        await ask(f.who, `I think she's ______${tail}`, `${f.who}의 의견은?`, f.opts, { right: f.ans, sayIt: false });
        speak(`I think she's ${f.ans}${tail}`, f.who);
      }
      await say('Zoe', 'We have different opinions. That\'s okay!', '우리는 의견이 달라. 그래도 괜찮아!');
      nextStage();
    };
  };
}

// ---- 6. Let's Write ----
function stage6() {
  setObj("💻 남동쪽 <b>Opinion Lab</b>의 <b>Emma</b>에게 가요", npcAt('emma')); mark('emma');
  NPC.emma.talk = async () => {
    mark('emma', false);
    await say('Emma', "Let's talk about computer games!", '컴퓨터 게임에 관해 이야기해 보자!');
    await readLines(L.writeSample);
    await ask('', 'Which sentence is a reason for "good"?', '컴퓨터 게임이 좋다는 의견을 뒷받침하는 문장은?', ['There are some good games for students.', "You don't play outside often.", "You don't talk with your family often.", 'Sometimes you play computer games too much.']);
    await ask('', 'Which sentence is a reason for "bad"?', '컴퓨터 게임이 나쁘다는 의견을 뒷받침하는 문장은?', ["You don't talk with your family often.", 'Playing computer games is fun.', 'There are some good games for students.', 'You can get good ideas from computer games.']);
    await say('Emma', 'Now, write your opinion!', '이제 컴퓨터 게임에 관한 내 의견을 글로 써 봐!', { btn: '글쓰기 ✏️' });
    closeDlg(); openWriter();
  };
}
const ALL_REASONS = L.reasons.good.map(r => ['good', ...r]).concat(L.reasons.bad.map(r => ['bad', ...r]));
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const opt = ALL_REASONS.map((r, i) => `<option value="${i}">${esc(r[1])} (${esc(r[2])})</option>`).join('');
  ['#wR1', '#wR2', '#wR3'].forEach(id => $(id).innerHTML = opt);
  $('#wOp').value = 'good'; $('#wR1').value = 0; $('#wR2').value = 1; $('#wR3').value = 2;
  if (S.card) { $('#wName').value = S.card.name; $('#wOp').value = S.card.op; $('#wR1').value = S.card.r[0]; $('#wR2').value = S.card.r[1]; $('#wR3').value = S.card.r[2]; }
  const upd = () => { $('#wPreview').innerHTML = letterHTML(letterData()); };
  $('#wOp').onchange = () => { const b = $('#wOp').value === 'good' ? 0 : 3; $('#wR1').value = b; $('#wR2').value = b + 1; $('#wR3').value = b + 2; upd(); };
  f.oninput = upd; upd();
  $('#wRead').onclick = () => speak(letterText(letterData()).join(' '), '나');
  $('#wDone').onclick = async () => {
    const c = letterData();
    if (!/^[A-Za-z][A-Za-z .'-]{0,19}$/.test(c.name)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if (new Set(c.r).size < 3) { toast('이유 세 가지를 서로 다르게 골라 주세요.'); return; }
    if (c.r.some(i => ALL_REASONS[i][0] !== c.op)) { toast(`내 의견(${c.op})에 맞는 이유를 골라 주세요. 🤔`); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).join(' '), '나');
    await say('Emma', c.op === 'good' ? 'I think so, too. Great writing!' : "I don't think so. But great writing!", '멋진 글이야! 의견이 달라도 서로 존중해요.');
    nextStage(); showEnd();
  };
}
function letterData() { return { name: $('#wName').value.trim(), op: $('#wOp').value === 'bad' ? 'bad' : 'good', r: [+$('#wR1').value, +$('#wR2').value, +$('#wR3').value] }; }
function letterText(c) {
  return [`I think playing computer games is ${c.op}.`, ...c.r.map(i => (ALL_REASONS[i] || ALL_REASONS[0])[1]), `- ${c.name || '____'}`];
}
function letterHTML(c) {
  const t = letterText(c);
  return '<div class="cardPrev"><div><b style="color:var(--accent)">' + esc(t[0]) + '</b></div>' + t.slice(1, -1).map(l => `<div>${esc(l)}</div>`).join('') + `<div style="text-align:right">${esc(t[t.length - 1])}</div></div>`;
}
function stageFree() { setObj('🎉 모든 미션 완료! 친구들에게 말을 걸며 복습하거나 <b>ing 코인</b>을 모아 보세요', null); }
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · ing 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? letterHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? letterText(S.card).join(' ') : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스 ing 코인 ----
const TH_SPOTS = [[-40, 20], [40, -33], [-20, -14], [34, 42], [-10, -44], [12, 16]];
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane('ing', 0.4, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane('ing', 0.4, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar(); speak(w, 'Ling');
      toast(`🪙 ing 코인: <b>${w.replace(/ing$/, '<u>ing</u>')}</b> (${S.th.length}/${L.th.length})`, 2600);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 ing 코인을 모두 모았어요! I think fishing is boring.', 4000), 2700);
    }, { y: 1.3, r: 1.3, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await say('Ling', "Hi! I'm Ling. I think fishing is boring.", '안녕! 나는 Ling이야. 나는 낚시가 지루하다고 생각해.');
  await say('Ling', 'Listen: fishing, boring. ing, ing, ing!', 'Sounds and Letters · ing 소리를 들어 보세요. (우리말 ㅇ 받침과 비슷해요)');
  await say('', '', `🪙 마을 구석구석에 숨은 ing 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, { btn: '찾아볼게!' });
  closeDlg();
};

// ---------------- 상호작용 ----------------
let nearNPC = null;
function interact() {
  if (!dlgOpen && !busy && started && !(nearNPC && nearNPC.talk) && window.MULTI && window.MULTI.interact()) return; // 함께 하기: 친구에게 묻기
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
const sfxBtn = document.createElement('button'); sfxBtn.id = 'sfxBtn'; sfxBtn.title = '효과음·음악 켜기/끄기 (M)';
const sfxLabel = () => { sfxBtn.textContent = MUTE ? '🔇' : '🎵'; };
function toggleMute() { MUTE = !MUTE; try { localStorage.setItem('english3d_mute', MUTE ? '1' : '0'); } catch (e) {} sfxLabel(); toast(MUTE ? '🔇 효과음·음악 꺼짐 (영어 말소리는 그대로 나와요)' : '🎵 효과음·음악 켜짐'); if (!MUTE) { beep('ok'); bgmStart(); } }
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
  if (p && objective.R && objective.R()) { mctx.strokeStyle = 'rgba(230,57,70,.8)'; mctx.fillStyle = 'rgba(230,57,70,.14)'; mctx.lineWidth = 2; mctx.beginPath(); mctx.arc(tx(p[0]), tz(p[1]), Math.abs(tx(objective.R()) - tx(0)), 0, 7); mctx.fill(); mctx.stroke(); }
  if (p && NAV.line && NAV.line.length > 1) { mctx.strokeStyle = 'rgba(230,57,70,.75)'; mctx.lineWidth = 2; mctx.setLineDash([4, 3]); mctx.beginPath(); NAV.line.forEach((q, k) => k ? mctx.lineTo(tx(q[0]), tz(q[1])) : mctx.moveTo(tx(q[0]), tz(q[1]))); mctx.stroke(); mctx.setLineDash([]); }
  mctx.save(); mctx.translate(tx(P.x), tz(P.z)); mctx.rotate(-P.yaw); mctx.fillStyle = '#1d3557';
  mctx.beginPath(); mctx.moveTo(0, -8); mctx.lineTo(5, 6); mctx.lineTo(-5, 6); mctx.fill(); mctx.restore();
  if (window.MULTI) window.MULTI.map(mctx, tx, tz); // 함께 하기: 친구 점
}

// ---------------- 목표 표시 ----------------
const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshBasicMaterial({ color: 0xff3b6b }));
scene.add(beacon);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 26, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xff3b6b, transparent: true, opacity: 0.16, depthWrite: false }));
scene.add(beam);
const trail = new THREE.Group(); trail.position.y = 0.13; scene.add(trail);
(() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.strokeStyle = '#fff'; x.lineWidth = 14; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(10, 46); x.lineTo(32, 18); x.lineTo(54, 46); x.stroke();
  const tex = new THREE.CanvasTexture(c);
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: tex, color: 0xff3b6b, transparent: true, depthWrite: false }));
    m.rotation.order = 'YXZ'; m.rotation.x = -Math.PI / 2; trail.add(m);
  }
})();
// 약한 힌트: "이 근처" 넓은 고리
const areaRing = new THREE.Group(); areaRing.visible = false; scene.add(areaRing);
(() => {
  const r = new THREE.Mesh(new THREE.RingGeometry(0.965, 1, 72), new THREE.MeshBasicMaterial({ color: 0xff3b6b, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide }));
  const d = new THREE.Mesh(new THREE.CircleGeometry(0.965, 48), new THREE.MeshBasicMaterial({ color: 0xff3b6b, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
  r.rotation.x = d.rotation.x = -Math.PI / 2; r.userData.noShadow = d.userData.noShadow = true; areaRing.add(d); areaRing.add(r); areaRing.position.y = 0.11;
})();
const edgeL = document.createElement('div'), edgeR = document.createElement('div');
edgeL.className = 'edge l'; edgeL.innerHTML = '◀<small>이쪽!</small>'; edgeR.className = 'edge r'; edgeR.innerHTML = '▶<small>이쪽!</small>';
document.body.appendChild(edgeL); document.body.appendChild(edgeR);
// ---------- 길 찾기: 벽·건물을 돌아가는 길을 찾아 안내해요 ----------
const NAV = { cs: 0.4, o: -47, N: 0, grid: null, sig: null, sigT: 9, path: null, t: 9, px: 0, pz: 0, gx: 1e9, gz: 0, run: 0, line: null };
function navGrid() {
  const cs = NAV.cs, N = NAV.N = Math.round(94 / cs), g = NAV.grid = new Uint8Array(N * N), r = 0.34;
  for (const c of colliders) {
    const i1 = Math.max(0, Math.ceil((c.x1 - r - NAV.o) / cs - 0.5)), i2 = Math.min(N - 1, Math.floor((c.x2 + r - NAV.o) / cs - 0.5));
    const j1 = Math.max(0, Math.ceil((c.z1 - r - NAV.o) / cs - 0.5)), j2 = Math.min(N - 1, Math.floor((c.z2 + r - NAV.o) / cs - 0.5));
    for (let j = j1; j <= j2; j++) for (let i = i1; i <= i2; i++) g[j * N + i] = 1;
  }
  NAV.cost = new Float32Array(N * N); NAV.from = new Int32Array(N * N); NAV.stamp = new Uint32Array(N * N);
}
const navCell = (v) => Math.max(0, Math.min(NAV.N - 1, Math.floor((v - NAV.o) / NAV.cs)));
const navPos = (i) => NAV.o + (i + 0.5) * NAV.cs;
function navFree(i, j, R) { // 막힌 칸이면 가장 가까운 빈 칸
  const g = NAV.grid, N = NAV.N; if (!g[j * N + i]) return [i, j];
  for (let r = 1; r <= R; r++) {
    let best = null, bd = 1e9;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N || b >= N || g[b * N + a]) continue;
      const d = di * di + dj * dj; if (d < bd) { bd = d; best = [a, b]; }
    }
    if (best) return best;
  }
  return null;
}
function navLOS(x1, z1, x2, z2) {
  const d = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(d / 0.2), g = NAV.grid, N = NAV.N;
  for (let k = 1; k < n; k++) { const f = k / n; if (g[navCell(z1 + (z2 - z1) * f) * N + navCell(x1 + (x2 - x1) * f)]) return false; }
  return true;
}
function navFind(sx, sz, gx, gz) {
  const N = NAV.N, g = NAV.grid, s = navFree(navCell(sx), navCell(sz), 6), e = navFree(navCell(gx), navCell(gz), 14);
  if (!s || !e) return null;
  const S0 = s[1] * N + s[0], E = e[1] * N + e[0], cost = NAV.cost, from = NAV.from, stamp = NAV.stamp, id = ++NAV.run, ex = e[0], ez = e[1];
  const hk = [], hv = [];
  const push = (k, v) => { let i = hk.length; hk.push(k); hv.push(v); while (i > 0) { const q = (i - 1) >> 1; if (hk[q] <= k) break; hk[i] = hk[q]; hv[i] = hv[q]; i = q; } hk[i] = k; hv[i] = v; };
  const pop = () => { const top = hv[0], k = hk.pop(), v = hv.pop(), n = hk.length; if (n) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && hk[c + 1] < hk[c]) c++; if (hk[c] >= k) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c; } hk[i] = k; hv[i] = v; } return top; };
  const h = (i, j) => { const a = Math.abs(i - ex), b = Math.abs(j - ez); return a + b - 0.586 * Math.min(a, b); };
  stamp[S0] = id; cost[S0] = 0; from[S0] = -1; push(h(s[0], s[1]), S0);
  let found = false, guard = 0;
  while (hk.length && guard++ < 90000) {
    const c = pop(); if (c === E) { found = true; break; }
    const ci = c % N, cj = (c / N) | 0, cc = cost[c];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const a = ci + di, b = cj + dj;
      if (a < 0 || b < 0 || a >= N || b >= N) continue; const k = b * N + a; if (g[k]) continue;
      if (di && dj && (g[cj * N + a] || g[b * N + ci])) continue;
      const nc = cc + (di && dj ? 1.414 : 1);
      if (stamp[k] === id && cost[k] <= nc) continue;
      stamp[k] = id; cost[k] = nc; from[k] = c; push(nc + h(a, b), k);
    }
  }
  if (!found) return null;
  const pts = []; for (let c = E; c !== -1; c = from[c]) pts.push([navPos(c % N), navPos((c / N) | 0)]);
  pts.reverse();
  const out = [pts[0]]; let i = 0; // 곧게 펴기
  while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !navLOS(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j = i + Math.max(1, ((j - i) * 0.75) | 0); out.push(pts[j]); i = j; }
  return out;
}
// 지금 서 있는 곳에서 목표까지 꺾이는 점들 [[x,z]…] 과 길이를 돌려줘요
function navTick(dt, p) {
  NAV.t += dt; NAV.sigT += dt;
  if (NAV.sigT > 1) { NAV.sigT = 0; let s = colliders.length; for (const c of colliders) s += c.x1 * 3 + c.z1 * 7 + c.x2 + c.z2; if (s !== NAV.sig) { NAV.sig = s; navGrid(); NAV.t = 9; } }
  const moved = Math.hypot(P.x - NAV.px, P.z - NAV.pz), gm = Math.hypot(p[0] - NAV.gx, p[1] - NAV.gz);
  if (gm > 1.5 || moved > 3 || (NAV.t > 0.3 && (moved > 0.35 || gm > 0.3)) || NAV.t > 2) {
    NAV.t = 0; NAV.px = P.x; NAV.pz = P.z; NAV.gx = p[0]; NAV.gz = p[1];
    try { NAV.path = navFind(P.x, P.z, p[0], p[1]); } catch (e) { NAV.path = null; }
  }
  const pts = [[P.x, P.z]], path = NAV.path;
  if (path) for (let k = 0; k < path.length; k++) {
    if (k === 0 && Math.hypot(path[0][0] - P.x, path[0][1] - P.z) < 0.9) continue;
    if (k === path.length - 1 && Math.hypot(path[k][0] - p[0], path[k][1] - p[1]) < 0.9) continue;
    pts.push(path[k]);
  }
  pts.push(p);
  let len = 0; for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
  NAV.line = pts;
  return { pts, len };
}
// 목표 위 보석: 머리 위 ❗와 겹치지 않게, 지붕에 묻히지 않게 높이를 맞춰요
const guideRay = new THREE.Raycaster(); guideRay.camera = camera; guideRay.far = 9;
const BK = { key: '', y: 3.3, show: true, t: 9 };
function beaconFit(p, dt) {
  BK.t += dt; const key = Math.round(p[0] * 2) + ',' + Math.round(p[1] * 2);
  if (BK.t < 0.3 || (key === BK.key && BK.t < 1.5)) return;
  BK.key = key; BK.t = 0;
  let y = 3.3, top = 0;
  for (const n of Object.values(NPC)) {
    const g = n.g; if (!g.visible || Math.hypot(g.position.x - p[0], g.position.z - p[1]) > 0.8) continue;
    const m = g.userData.mark; top = Math.max(top, (m.userData.baseY || m.position.y) * g.scale.y + (m.visible ? 0.4 : -0.3));
  }
  if (top) y = Math.max(y, top + 0.6);
  let ceil = 99;
  try {
    const own = new Set(items.map(i => i.mesh));
    guideRay.set(new THREE.Vector3(p[0], 1.3, p[1]), new THREE.Vector3(0, 1, 0));
    for (const hit of guideRay.intersectObjects(scene.children, true)) {
      const o = hit.object; if (!o.isMesh || o === beam || o === beacon) continue;
      if (o.material && o.material.transparent && o.material.opacity < 0.5) continue;
      let skip = false; for (let q = o; q; q = q.parent) if (!q.visible || q === trail || own.has(q) || (q.userData && q.userData.mark)) { skip = true; break; }
      if (skip) continue;
      ceil = 1.3 + hit.distance; break;
    }
  } catch (e) {}
  if (y > ceil - 0.5) y = ceil - 0.55;
  BK.y = y; BK.show = y >= Math.max(1.9, top + 0.3);
}
function guideTick(t, p, d, rel, nav) {
  const on = !!p && started;
  beam.visible = on && d > 6; trail.visible = on && d > 4;
  const side = on && !dlgOpen && Math.abs(rel) > 0.75 ? (rel > 0 ? 1 : -1) : 0;
  edgeL.classList.toggle('show', side === 1); edgeR.classList.toggle('show', side === -1);
  if (!on) return;
  beam.position.set(p[0], 13, p[1]);
  const pts = nav.pts, ph = (t * 1.2) % 1;
  let seg = 1, acc = 0, sl = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  trail.children.forEach((m, i) => {
    const s = 3.4 + (i + ph) * 1.5;
    m.visible = s < nav.len - 1.8; if (!m.visible) return;
    while (seg < pts.length - 1 && s > acc + sl) { acc += sl; seg++; sl = Math.hypot(pts[seg][0] - pts[seg - 1][0], pts[seg][1] - pts[seg - 1][1]); }
    const a = pts[seg - 1], b = pts[seg], f = sl > 0 ? Math.min(1, (s - acc) / sl) : 0;
    m.position.set(a[0] + (b[0] - a[0]) * f, 0, a[1] + (b[1] - a[1]) * f);
    m.rotation.y = Math.atan2(-(b[0] - a[0]), -(b[1] - a[1]));
    m.material.opacity = Math.min(1, (i + ph) / 1.2, (7 - i - ph) / 2) * 0.7;
  });
}

// 개발용 점검 기록 (?audit): 목표가 바뀔 때마다 가리키는 곳과 실제 대상을 적어 둬요
function auditTick(p) {
  const A = auditLog, key = objective.text + '|' + (p ? Math.round(p[0]) + ',' + Math.round(p[1]) : 'null');
  if (!A.pending && key === A.last) return;
  A.pending = false; A.last = key;
  const r1 = (v) => Math.round(v * 10) / 10;
  const npcs = Object.values(NPC).filter(n => n.g.visible && (n.talk || n.g.userData.mark.visible)).map(n => [n.id, r1(n.g.position.x), r1(n.g.position.z), n.talk ? 1 : 0, n.g.userData.mark.visible ? 1 : 0, n.follow ? 1 : 0]);
  const its = items.filter(i => i.alive && !i.bonus && !i.coin).map(i => [String(i.word || i.label || i.id || i.kind || '?').slice(0, 14), r1(i.x), r1(i.z)]);
  const inC = p ? colliders.some(c => p[0] > c.x1 && p[0] < c.x2 && p[1] > c.z1 && p[1] < c.z2) : 0;
  let nav = null;
  if (p) { try { if (!NAV.grid) navGrid(); const t0 = performance.now(), pa = navFind(P.x, P.z, p[0], p[1]), ms = performance.now() - t0; let len = 0; if (pa) for (let k = 1; k < pa.length; k++) len += Math.hypot(pa[k][0] - pa[k - 1][0], pa[k][1] - pa[k - 1][1]); nav = { ok: pa ? 1 : 0, n: pa ? pa.length : 0, len: r1(len), ms: r1(ms), end: pa ? [r1(pa[pa.length - 1][0]), r1(pa[pa.length - 1][1])] : null }; } catch (e) { nav = { err: String(e) }; } }
  A.rows.push({ st: S.stage, t: objective.text.replace(/<[^>]+>/g, ''), p: p ? [r1(p[0]), r1(p[1])] : null, P: [r1(P.x), r1(P.z)], inC: inC ? 1 : 0, npcs, its, nav });
  let el = document.getElementById('auditOut'); if (!el) { el = document.createElement('script'); el.type = 'application/json'; el.id = 'auditOut'; document.body.appendChild(el); }
  el.textContent = JSON.stringify(A.rows);
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
  camTick(dt, t);
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
    const sc = d - (m.visible ? 3 : n.talk ? 1.2 : 0); // ❗ 붙은 미션 친구가 가장 먼저, 그다음 할 말이 있는 친구
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
  if (auditLog) auditTick(p);
  if (started && !dlgOpen) objective.t = (objective.t || 0) + dt;
  const aR = p && started && objective.R ? objective.R() : 0;
  areaRing.visible = aR > 0;
  if (aR > 0) { // 약한 힌트: 넓은 고리 안 어딘가예요
    areaRing.position.x = p[0]; areaRing.position.z = p[1]; areaRing.scale.set(aR, 1, aR);
    areaRing.children[1].material.opacity = 0.55 + Math.sin(t * 2.5) * 0.2;
    const d = Math.hypot(p[0] - P.x, p[1] - P.z);
    guideTick(t, null, 0, 0, null); beacon.visible = false;
    if (d > aR) {
      const nav = navTick(dt, p), aim = nav.pts[1], ty = Math.atan2(-(aim[0] - P.x), -(aim[1] - P.z)); let rel = ty - P.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      const back = Math.abs(rel) > 1.9;
      ui.arrow.style.display = back ? 'none' : 'block'; ui.arrow.style.transform = `rotate(${-rel}rad)`; ui.dist.textContent = (back ? '↩ 뒤쪽 ' : '') + '🔍 ' + Math.round(Math.max(1, Math.max(d, nav.len) - aR)) + 'm';
    } else { NAV.line = null; ui.arrow.style.display = 'none'; ui.dist.textContent = objective.t > 30 ? '🔍 고리가 줄어들어요' : '🔍 이 근처!'; }
  } else if (p && started) {
    beaconFit(p, dt);
    beacon.visible = BK.show; beacon.position.set(p[0], BK.y + Math.sin(t * 3) * 0.15, p[1]); beacon.rotation.y = t * 2;
    const d = Math.hypot(p[0] - P.x, p[1] - P.z), nav = navTick(dt, p);
    const aim = nav.pts[1], dx = aim[0] - P.x, dz = aim[1] - P.z; // 다음 꺾이는 곳을 가리켜요
    const ty = Math.atan2(-dx, -dz); let rel = ty - P.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    const back = Math.abs(rel) > 1.9; // 뒤쪽이면 위 화살표 대신 글로 알려요
    ui.arrow.style.display = back ? 'none' : 'block'; ui.arrow.style.transform = `rotate(${-rel}rad)`; ui.dist.textContent = d < 3 ? '도착!' : (back ? '↩ 뒤쪽 ' : '') + Math.round(Math.max(d, nav.len)) + 'm';
    guideTick(t, p, d, rel, nav);
  } else { NAV.line = null; guideTick(t, null, 0, 0, null); beacon.visible = false; ui.arrow.style.display = 'none'; ui.dist.textContent = ''; }
  if (window.MULTI) window.MULTI.tick(dt, t); // 함께 하기: 친구 아바타
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
    const ks = document.querySelector('#title .keys'); if (ks) { const d = document.createElement('div'); d.innerHTML = '🎥 <span class="desk"><kbd>V</kbd> 또는 </span>🎥 버튼: 내 캐릭터 보기 ↔ 내 눈으로 보기'; ks.insertBefore(d, ks.lastElementChild); }
    const hp = document.querySelector('#help .panel #helpClose');
    if (hp) { const q = document.createElement('p'); q.innerHTML = '⌨️ <b>Space</b> 점프 · <b>Shift</b> 달리기 · <b>V</b> 보는 방법(내 캐릭터 보기 ↔ 내 눈으로 보기) · <b>M</b> 효과음·음악 · <b>G</b> 화질 바꾸기. 두 번 틀리면 정답이 살짝 반짝여요.'; hp.parentElement.insertBefore(q, hp); }
  } catch (e) {}
})();
// ---------- 포탈: 단원을 끝내면 교문에 다음 단원으로 가는 문이 열려요 (새로 고침 없이 걸어서 넘어가요) ----------
const lessonNo = parseInt(String(L.id || 'L1').replace(/\D/g, ''), 10) || 1;
const lessonUrl = (n) => (lessonNo === 1 ? '' : '../') + (n === 1 ? '' : 'l' + n + '/') + 'index.html?portal=1';
const PORTAL = { g: null, disc: null, ring: null, hold: 0, going: false, told: false, x: 0, z: 45.2, next: lessonNo >= 12 ? 1 : lessonNo + 1 };
function portalMake() {
  const g = new THREE.Group(); g.position.set(PORTAL.x, 0, PORTAL.z);
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 128, 6, 128, 128, 128); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, '#b5f2ff'); gr.addColorStop(0.6, '#7c4dff'); gr.addColorStop(1, 'rgba(60,20,160,0)');
  x.fillStyle = gr; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 7; x.lineCap = 'round';
  for (let k = 0; k < 4; k++) { x.beginPath(); for (let i = 0; i <= 44; i++) { const a = k * Math.PI / 2 + i * 0.12, r = 8 + i * 2.6; const px = 128 + Math.cos(a) * r, py = 128 + Math.sin(a) * r; if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.15, 10, 44), new THREE.MeshStandardMaterial({ color: 0x9775fa, emissive: 0x7c4dff, emissiveIntensity: 1.1, roughness: 0.3 })); ring.position.y = 1.75; ring.userData.ns = 1; g.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })); disc.position.y = 1.75; g.add(disc);
  for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), mat(0x5f3dc4)); b.position.set(sx * 1.45, 0.15, 0); g.add(b); }
  const t1 = textSprite('🌀 Lesson ' + PORTAL.next, 0.62, { fs: 56, bg: '#5f3dc4', fg: '#ffffff' }); t1.position.y = 5.5; g.add(t1);
  const t2 = textSprite(PORTAL.next === 1 ? '처음 단원으로 가는 문' : '다음 단원으로 가는 문', 0.36, { fs: 44, fg: '#5f3dc4' }); t2.position.y = 4.95; g.add(t2);
  scene.add(g); PORTAL.g = g; PORTAL.disc = disc; PORTAL.ring = ring;
}
function portalGo() {
  if (PORTAL.going) return; PORTAL.going = true;
  try { save(); track('portal', { to: PORTAL.next }); } catch (e) {}
  try { beep('fanfare'); confetti(40); } catch (e) {}
  const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;z-index:99;background:radial-gradient(circle,#fff 0%,#b197fc 70%,#5f3dc4 100%);opacity:0;transition:opacity .7s;display:flex;align-items:center;justify-content:center;font-size:34px;color:#3b1d8f;pointer-events:none';
  f.textContent = '🌀 Lesson ' + PORTAL.next + ' 로 가요!'; document.body.appendChild(f); requestAnimationFrame(() => { f.style.opacity = '1'; });
  setTimeout(() => { location.href = lessonUrl(PORTAL.next); }, 850);
}
FX2.tickers.push((dt, t) => {
  let fin = false; try { fin = started && S.stage >= STAGES.length - 1; } catch (e) {}
  if (fin && !PORTAL.g) portalMake();
  if (!PORTAL.g) return;
  PORTAL.g.visible = fin; if (!fin || PORTAL.going) return;
  PORTAL.disc.rotation.z -= dt * 1.7; const k = 1 + Math.sin(t * 3) * 0.03; PORTAL.ring.scale.set(k, k, 1);
  if (dlgOpen) { PORTAL.hold = 0; return; }
  if (!PORTAL.told) { // 끝 화면을 닫으면 알려 주고, 가는 길도 보여 줘요
    PORTAL.told = true;
    toast('🌀 교문에 <b>포탈</b>이 열렸어요! 들어가면 <b>Lesson ' + PORTAL.next + '</b> 로 가요.', 4200);
    try { if (!objective.pos) setObj(objective.text + '<br>🌀 교문의 <b>포탈</b>로 들어가면 <b>Lesson ' + PORTAL.next + '</b> 로 가요', () => [PORTAL.x, PORTAL.z - 0.9]); } catch (e) {}
  }
  const inP = Math.abs(P.x - PORTAL.x) < 1.45 && P.z > PORTAL.z - 1.0;
  if (inP) { if (!PORTAL.hold) { toast('🌀 Lesson ' + PORTAL.next + ' 로 가는 중… (가기 싫으면 밖으로 나와요)', 1500); try { beep('get'); } catch (e) {} } PORTAL.hold += dt; if (PORTAL.hold > 1.5) portalGo(); }
  else PORTAL.hold = 0;
});
// 끝 화면에도 바로 가는 단추를 달아요
try { const ec = document.querySelector('#end #endClose'); if (ec) { const b = document.createElement('button'); b.className = 'big'; b.id = 'endNext'; b.textContent = '🌀 ' + (PORTAL.next === 1 ? '처음 단원' : '다음 단원') + ' Lesson ' + PORTAL.next + ' 로 가기'; b.onclick = portalGo; ec.classList.add('alt'); ec.parentElement.insertBefore(b, ec); } } catch (e) {}
$('#btnStart').onclick = () => begin(true);
$('#btnContinue').onclick = () => begin(false);
if (S.stage > 0) { $('#btnContinue').style.display = 'inline-block'; $('#btnContinue').textContent = `이어하기 (${STAGES[Math.min(S.stage, STAGES.length - 1)].title})`; $('#btnStart').textContent = '처음부터'; }
$('#rateBtn').textContent = S.rate < 0.9 ? '🐢 천천히' : '🔊 보통';
resetWorld();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {});
requestAnimationFrame(loop);
// 테스트용: ?stage=N
const qs = new URLSearchParams(location.search);
if (qs.has('audit')) auditLog = { rows: [], last: '', pending: true };
if (qs.has('stage')) { S.stage = +qs.get('stage'); begin(false); }
else if (qs.has('portal')) { // 포탈을 타고 왔어요: 시작 화면 없이 바로 이어서 해요
  begin(false);
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  setTimeout(() => { try { toast('🌀 <b>Lesson ' + lessonNo + '</b> 에 도착했어요!', 2600); confetti(30); } catch (e) {} }, 600);
}
window.__game = { say, ask, tick: (dt) => update(dt, performance.now() / 1000), get S() { return S; }, P, NPC, startStage, items: () => items, zones, HOME, stallInfo: typeof stallInfo !== 'undefined' ? stallInfo : null, get decor() { return decor; }, get st() { return stageState; }, get held() { return held; }, get busy() { return busy; } };
if (qs.has('autotest')) { const s = document.createElement('script'); s.src = 'autotest.js'; document.body.appendChild(s); }
// 함께 하기(multi.js): 반에 참여한 학생끼리 같은 공간에서 만나요. net.js 와 같은 폴더에서 불러와요.
window.__mp = { scene, makePerson, textSprite, P, L, speak, toast, addStar, confetti, beep, isTouch, prompt: ui.prompt,
  get S() { return S; }, get started() { return started; }, get dlgOpen() { return dlgOpen; }, get busy() { return busy; }, get nearNPC() { return nearNPC; },
  lock(on) { dlgOpen = !!on; if (on) { if (document.pointerLockElement) document.exitPointerLock(); for (const k in keys) keys[k] = false; } } };
try { const n = document.querySelector('script[src$="net.js"]'); if (n) { const s = document.createElement('script'); s.src = n.getAttribute('src').replace(/net\.js$/, 'multi.js'); document.body.appendChild(s); } } catch (e) {}
})();
// 개발용 화면 위치: ?view=x,z,yaw  /  ?dlg=1
(() => { const q = new URLSearchParams(location.search); const G = window.__game; if (q.has('view')) { const [x, z, y] = q.get('view').split(',').map(Number); G.P.x = x; G.P.z = z; G.P.yaw = y; } })();
