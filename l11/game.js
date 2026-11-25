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
const fresh = () => ({ v: 1, stage: 0, stars: 0, correct: 0, tries: 0, streak: 0, best: 0, th: [], card: null, koHelp: true, rate: 0.9, gems: 0, medals: [] });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) S = Object.assign(fresh(), s); } catch (e) {}
const save = () => { try { if (window.__e3dReloading) return; localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }; // 서버 기록을 내려받아 새로 여는 중에는 덮어쓰지 않아요
// 반 활동 기록 (백엔드가 설정되지 않으면 아무 일도 하지 않아요)
// 게임 안 알림: 게임성 층(fun.js)이 window 의 'e3d' 이벤트로 들어요 (미션 끝·정답·포탈 등)
const fire = (type, data) => { try { window.dispatchEvent(new CustomEvent('e3d', { detail: { type, data } })); } catch (e) {} };
const track = (type, data) => { fire(type, data); try { if (window.NET) window.NET.track(type, data); } catch (e) {} };
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
    const seq = Array.isArray(type) ? type : SFX[type] || [[440, .1]];
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
// 그래픽 카드 대신 CPU 로 그리는 크롬(SwiftShader·Microsoft Basic Render 등)이면 아주 느려요 → 처음부터 아주 가볍게, 계단 펴기(antialias) 끄기
const SOFT_GPU = (() => { try { const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'); if (!g) return ''; const d = g.getExtension('WEBGL_debug_renderer_info'); const r = String(d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)); try { g.getExtension('WEBGL_lose_context').loseContext(); } catch (e) {} return /SwiftShader|Basic Render|llvmpipe|softpipe|Software/i.test(r) ? r : ''; } catch (e) { return ''; } })();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !SOFT_GPU, powerPreference: 'high-performance' });
// 그래픽 품질: high(그림자·고해상도) / low(가볍게). G 키로 바꿀 수 있고, 느리면 자동으로 low.
const GFX = { high: true, auto: true, soft: !!SOFT_GPU };
// 화면 해상도 배율: 단계별 기본값에, 큰 화면이면 그리는 점 수 상한(백만 점 단위)을 둬요
function gfxPR() {
  const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight);
  const base = GFX.lite ? 0.7 : Math.min(window.devicePixelRatio || 1, GFX.high ? 1.5 : 1);
  const budget = (GFX.lite ? (GFX.soft ? 0.45 : 0.9) : GFX.high ? 3.6 : 2.0) * 1e6;
  return Math.max(0.35, Math.min(base, Math.sqrt(budget / (w * h))));
}
try { const q = new URLSearchParams(location.search).get('gfx') || localStorage.getItem('english3d_gfx'); if (q) { GFX.high = q === 'high'; GFX.auto = false; GFX.wantLite = q === 'lite'; GFX.fixed = !!new URLSearchParams(location.search).get('gfx'); } } catch (e) {}
if (GFX.soft && !GFX.fixed) { GFX.high = false; GFX.wantLite = true; }
renderer.setPixelRatio(gfxPR());
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = GFX.high; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe6ff);
scene.fog = new THREE.Fog(0xbfe6ff, 55, 160);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 420);
camera.rotation.order = 'YXZ';
function resize() { const w = innerWidth, h = innerHeight; renderer.setPixelRatio(gfxPR()); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
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
// 아주 가볍게: 화면 해상도를 낮추고(픽셀 0.7배), 먼 곳은 안개로 가려 덜 그려요 (느린 크롬북용)
function setLite(on, why) {
  GFX.lite = on;
  resize();
  const s = GFX.soft; // CPU 로 그리면 더 가까이까지만 (물체 수가 줄어야 빨라져요)
  GFX.fogAdd = -1; GFX.lv = on ? (s ? [16, 46, 50] : [26, 80, 90]) : [55, 160, 420]; liteFog();
  sky.scale.setScalar(on ? (s ? 0.12 : 0.22) : 1); sunDisk.scale.set(on ? 9 : 60, on ? 9 : 60, 1); clouds.visible = !on; // 하늘 공도 보이는 거리 안으로
  if (why) try { toast(on ? '🎨 그래픽: 아주 가볍게 (G 키로 바꾸기)' : '🎨 그래픽: 선명하게 (G 키로 바꾸기)'); } catch (e) {}
}
// 안개·보이는 거리: 2.5D 는 카메라가 캐릭터에서 30m 넘게 떨어져 있어서 그만큼 더해요
function liteFog() {
  let iso = false; try { iso = CAM.iso; } catch (e) {}
  const v = GFX.lv || [55, 160, 420], add = GFX.lite && iso ? 30 : 0;
  if (GFX.fogAdd === add) return; GFX.fogAdd = add;
  scene.fog.near = v[0] + add; scene.fog.far = v[1] + add; camera.far = v[2] + add; camera.updateProjectionMatrix();
}
function setQuality(high, why) {
  GFX.high = high; if (high && GFX.lite) setLite(false);
  renderer.shadowMap.enabled = high; sun.castShadow = high;
  resize();
  scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); });
  if (why) try { toast(high ? '🎨 그래픽: 선명하게 (G 키로 바꾸기)' : '🎨 그래픽: 가볍게 (G 키로 바꾸기)'); } catch (e) {}
}
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyG' || (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT'))) return;
  GFX.auto = false;
  if (GFX.high) setQuality(false, true); else if (!GFX.lite) setLite(true, true); else setQuality(true, true); // 선명하게 → 가볍게 → 아주 가볍게 → 선명하게
  try { localStorage.setItem('english3d_gfx', GFX.lite ? 'lite' : GFX.high ? 'high' : 'low'); } catch (er) {}
});
const fogBase = new THREE.Color(), skyTop = new THREE.Color(0x3f86d8), hsl = {};
const perf = { warm: 0, last: 0, samples: [], done: false, fps: 0 };
let polishT = 1;
function gfxTick(dt, now) {
  sky.position.copy(camera.position); if (GFX.lite) liteFog();
  fogBase.copy(scene.fog.color); fogBase.getHSL(hsl);
  skyMat.uniforms.bottom.value.copy(fogBase);
  skyMat.uniforms.top.value.copy(fogBase).lerp(skyTop, hsl.s > 0.3 ? 0.55 : 0.15);
  sunDisk.position.copy(camera.position).addScaledVector(SUN_DIR, GFX.lite ? (GFX.soft ? 44 : 80) : 300);
  sunDisk.visible = hsl.l > 0.6 && hsl.s > 0.3;
  clouds.rotation.y += dt * 0.004;
  sun.position.set(P.x + SUN_DIR.x * 60, SUN_DIR.y * 60, P.z + SUN_DIR.z * 60); sun.target.position.set(P.x, 0, P.z); sun.target.updateMatrixWorld();
  if ((polishT += dt) > 0.7) { polishT = 0; polish(scene); }
  if (started && !perf.done && !GFX.fixed) { // 느리면 한 단계씩 가볍게 (선명하게 → 가볍게 → 아주 가볍게)
    // 시작하고 3초는 재지 않아요(그림 준비·물체 합치기로 잠깐 끊겨요). 한 장 그리는 시간의 '가운데 값'으로 재서 가끔 생기는 끊김에 속지 않아요
    if (!perf.warm) perf.warm = now + 3000;
    if (now >= perf.warm && !document.hidden) {
      if (perf.last) perf.samples.push(Math.min(400, now - perf.last));
      perf.last = now;
      if (perf.samples.length >= 150 || (perf.samples.length >= 12 && now - perf.warm > 6000)) {
        const s = perf.samples.slice().sort((x, y) => x - y), fps = 1000 / s[s.length >> 1];
        perf.samples = []; perf.last = 0; perf.warm = now + 1500; perf.fps = Math.round(fps);
        if (fps < 28 && GFX.high && GFX.auto) setQuality(false, true);
        else if (fps < 24 && !GFX.high && !GFX.lite && (GFX.auto || !GFX.wantLite)) { setLite(true, true); perf.done = true; }
        else perf.done = true;
      }
    } else perf.last = 0;
  }
  if (GFX.wantLite && !GFX.lite && started) { GFX.wantLite = false; setLite(true); }
  if (GFX.soft && started && !GFX.softTold) { GFX.softTold = true; setTimeout(() => { try { toast('💻 이 컴퓨터의 크롬이 그래픽 카드를 쓰지 않고 있어 화면을 가볍게 그려요. 크롬 창을 모두 닫았다 다시 열면 빨라질 수 있어요.'); } catch (e) {} }, 2500); }
  animatePeople(now / 1000, dt);
  fx2Tick(dt, now / 1000);
}
// 개발용: ?perf 로 그리기 횟수(draw call)·삼각형 수를 재요
try { if (new URLSearchParams(location.search).has('perf')) setTimeout(() => { let now = performance.now(); for (let i = 0; i < 8; i++) { now += 400; update(0.05, now / 1000); gfxTick(0.4, now); renderer.render(scene, camera); } const r = renderer.info.render; let meshes = 0; scene.traverse(o => { if (o.isMesh && o.visible) meshes++; }); document.title = 'PERF calls=' + r.calls + ' tris=' + r.triangles + ' geo=' + renderer.info.memory.geometries + ' meshes=' + meshes + ' people=' + Object.keys(NPC).length + ' merged=' + MERGE.before + '→' + MERGE.groups + ' reverted=' + MERGE.reverted; }, 4500); } catch (e) {}
// 사람 한 명 움직이기. f = { talk: 말하는 중, wave: 손 흔들기, look: [x, z] 바라볼 곳 }
function animatePerson(g, t, dt, f) {
  const a = g.userData.anim; if (!a || !g.visible) return;
  dt = Math.max(0, Math.min(0.1, dt || 0));
  const p = g.position, step = a.lx === undefined ? 0 : Math.hypot(p.x - a.lx, p.z - a.lz), moving = step > 0.002 && step < 0.5;
  a.lx = p.x; a.lz = p.z;
  // 멀리 있는 사람은 얼굴 부품을 숨기고 움직임 계산도 쉬어요
  const far = CAM.iso ? Math.hypot(p.x - P.x, p.z - P.z) > (GFX.high ? 46 : 30) : Math.hypot(p.x - camera.position.x, p.z - camera.position.z) > (GFX.high ? 40 : 24);
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
const FX2 = { ready: false, tickers: [], butter: [], birds: [], stage: -1, pollen: null, snow: false, fountains: [], goals: [] };
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
const decoOk = (n) => { n = Math.round(Number(n)); return n >= 1 && n <= 9 ? n : 0; };
let avatarDeco = 0; try { avatarDeco = decoOk(localStorage.getItem('english3d_deco')); } catch (e) {}
window.__avatar = {
  list: AVATARS,
  get: () => (avatarDeco ? { key: avatarKey(), deco: avatarDeco } : { key: avatarKey() }),
  setDeco: (n) => { avatarDeco = decoOk(n); try { localStorage.setItem('english3d_deco', String(avatarDeco)); } catch (e) {} },
  set: (k) => { if (AVATARS.includes(k)) try { localStorage.setItem('english3d_avatar', k); } catch (e) {} },
  make: (o = {}) => makePerson({ name: o.name || '친구', look: o.look || o.key || avatarKey(), deco: decoOk(o.deco), scale: o.scale, adult: false }),
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
    const sub = document.querySelector('#title .sub'); if (sub) { const v = document.createElement('span'); v.className = 'ver'; v.textContent = 'v3.4'; sub.appendChild(v); }
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
  FX2.fountains.push({ x, y, z, r }); // 놀이 층(play.js)이 이 분수를 찾아 써요
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

// ---------- 움직이지 않는 물체 합치기: 같은 색(재질)의 상자·기둥·공을 16m 구역마다 하나로 합쳐 그리기 횟수를 줄여요 ----------
//  · 대상: 무늬 없는 불투명 재질의 Mesh. 높고 넓은 것(지붕·천장)은 2.5D 에서 숨기니까 빼요
//  · 2초 동안 지켜보고 그새 움직이거나 숨겨진 것은 빼요. 합친 원본은 장면에서 떼어 둬서(매 프레임 계산에서 빠져요) 가벼워요
//  · 합친 뒤 누가 원본을 옮기거나·숨기거나·다시 붙이거나·지우면 그 묶음을 원래대로 되돌려요 (mergeGuard)
//  · 두 번 해요: 처음(세계) + 8초 뒤(놀이 층·미션 소품까지). ?nomerge 로 끄기, ?mergecheck 로 되돌린 것 보기
const MERGE = { passes: 0, recs: [], groups: 0, before: 0, reverted: 0, log: [], hooked: false };
function mergeVisibleFrom(o) { for (let a = o; a; a = a.parent) { if (!a.visible) return false; if (a === scene) return true; } return false; }
function mergeRevert(r) {
  const i = MERGE.recs.indexOf(r); if (i < 0) return; MERGE.recs.splice(i, 1);
  scene.remove(r.mm); r.mm.geometry.dispose();
  for (const it of r.items) { const o = it.o; o.userData.keep = 1; o.userData.mergedRec = null; if (!o.parent && !it.gone && it.parent) it.parent.add(o); }
  MERGE.reverted++;
  try { const o = r.items[0].o, e = o.matrixWorld.elements; MERGE.log.push(r.items.length + 'x' + o.geometry.type.replace('Geometry', '') + '@' + e[12].toFixed(0) + ',' + e[14].toFixed(0) + '#' + o.material.color.getHexString()); } catch (er) {}
}
function mergeGuard() {
  for (let i = MERGE.recs.length - 1; i >= 0; i--) {
    const r = MERGE.recs[i]; let bad = false;
    for (const it of r.items) {
      const o = it.o, p = it.parent;
      if (o.parent || it.gone || !o.visible || !o.position.equals(it.pos) || !o.quaternion.equals(it.quat) || !o.scale.equals(it.scl)) { bad = true; break; }
      if (p !== scene && (!mergeVisibleFrom(p) || !p.matrixWorld.equals(it.pmw))) { bad = true; break; }
    }
    if (bad) mergeRevert(r);
  }
}
function mergeHook() { // 떼어 둔 원본을 누가 지우거나(remove) 붙이면(add) 바로 알아채요
  if (MERGE.hooked) return; MERGE.hooked = true;
  const rm = THREE.Object3D.prototype.remove, add = THREE.Object3D.prototype.add;
  THREE.Object3D.prototype.remove = function (...objs) { for (const o of objs) { const r = o && o.userData && o.userData.mergedRec; if (r) { const it = r.items.find(x => x.o === o); if (it) it.gone = true; mergeRevert(r); } } return rm.apply(this, objs); };
  THREE.Object3D.prototype.add = function (...objs) { const res = add.apply(this, objs); for (const o of objs) { const r = o && o.userData && o.userData.mergedRec; if (r) mergeRevert(r); } return res; };
}
function mergeStatic() {
  let qs0; try { qs0 = new URLSearchParams(location.search); } catch (e) { return; }
  if (qs0.has('nomerge') || MERGE.passes >= 2) return;
  const pass = ++MERGE.passes;
  try { polish(scene); } catch (e) {}
  scene.updateMatrixWorld(true);
  const skip = new Set([sky, clouds, camera]);
  try { if (typeof decor !== 'undefined' && Array.isArray(decor)) decor.forEach(o => skip.add(o)); } catch (e) {}
  try { items.forEach(i => skip.add(i.mesh)); } catch (e) {}
  try { Object.values(NPC).forEach(n => skip.add(n.g)); } catch (e) {}
  try { if (CAM.me) skip.add(CAM.me); } catch (e) {}
  const CELL = 16, cand = [], b3 = new THREE.Box3();
  const ok = (o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible) return false;
    const u = o.userData; if (u.anim || u.keep || u.grass || u.merged || u.dyn || u.mergedRec) return false;
    const m = o.material; if (!m || Array.isArray(m) || m.transparent || (m.map && !m.userData.paint) || m.alphaMap || !(m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshBasicMaterial)) return false;
    const g = o.geometry; if (!g || !g.attributes.position || !g.attributes.normal || g.morphAttributes.position || g.attributes.position.count > 4000) return false;
    if (g.type === 'PlaneGeometry' && (g.parameters.width * g.parameters.height) >= 300) return false;
    return true;
  };
  const visit = (o) => {
    if (skip.has(o) || !o.visible || o.isLight || o.isSprite || o.isPoints || o.isInstancedMesh) return;
    const u = o.userData; if (u.anim || u.keep || u.dyn || u.tag || u.merged) return;
    if (o.isMesh && ok(o)) {
      b3.setFromObject(o);
      if (!b3.isEmpty() && !(b3.min.y >= 1.0 && b3.max.x - b3.min.x >= 0.9 && b3.max.z - b3.min.z >= 0.9)) {
        const cx = Math.floor((b3.min.x + b3.max.x) / 2 / CELL), cz = Math.floor((b3.min.z + b3.max.z) / 2 / CELL);
        cand.push({ o, key: o.material.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + cx + ',' + cz, m0: o.matrixWorld.clone() });
      }
    }
    for (const c of o.children) visit(c);
  };
  for (const c of scene.children) visit(c);
  setTimeout(() => { try { mergeBuild(cand, qs0); } catch (e) { console.warn(e); } }, 2000);
  if (pass === 1) setTimeout(() => { try { mergeStatic(); } catch (e) { console.warn(e); } }, 8000); // 놀이 층·미션 소품이 놓인 뒤 한 번 더
}
function mergeBuild(cand, qs0) {
  scene.updateMatrixWorld(true);
  const groups = new Map();
  for (const c of cand) {
    const o = c.o; if (o.userData.keep || o.userData.mergedRec || !mergeVisibleFrom(o) || !o.matrixWorld.equals(c.m0)) continue;
    let gr = groups.get(c.key); if (!gr) groups.set(c.key, gr = []); gr.push(o);
  }
  for (const gr of groups.values()) {
    if (gr.length < 2) continue;
    if (gr[0].material.map && gr.some(o => !o.geometry.attributes.uv)) continue; // 그림 무늬(PAINT) 재질은 무늬 자리(uv)도 함께 옮겨요
    const vc = !!gr[0].material.vertexColors; if (vc && gr.some(o => !o.geometry.attributes.color)) continue; // 꼭짓점 색으로 칠한 것(놀이 물건)은 색도 옮겨요. 안 옮기면 새까매져요
    let nv = 0, ni = 0; for (const o of gr) { nv += o.geometry.attributes.position.count; ni += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), uvs = gr[0].material.map ? new Float32Array(nv * 2) : null, cols = vc ? new Float32Array(nv * 3) : null;
    const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    let vo = 0, io = 0;
    for (const o of gr) {
      const g = o.geometry, P0 = g.attributes.position, N0 = g.attributes.normal, mw = o.matrixWorld; nm.getNormalMatrix(mw);
      for (let i = 0; i < P0.count; i++) {
        v.fromBufferAttribute(P0, i).applyMatrix4(mw); pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
        v.fromBufferAttribute(N0, i).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
      }
      if (uvs) { const U = g.attributes.uv; for (let i = 0; i < P0.count; i++) { uvs[(vo + i) * 2] = U.getX(i); uvs[(vo + i) * 2 + 1] = U.getY(i); } }
      if (cols) { const C = g.attributes.color; for (let i = 0; i < P0.count; i++) { cols[(vo + i) * 3] = C.getX(i); cols[(vo + i) * 3 + 1] = C.getY(i); cols[(vo + i) * 3 + 2] = C.getZ(i); } }
      if (g.index) { const I = g.index.array; for (let k = 0; k < I.length; k++) idx[io + k] = I[k] + vo; io += I.length; }
      else { for (let k = 0; k < P0.count; k++) idx[io + k] = vo + k; io += P0.count; }
      vo += P0.count;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); if (uvs) geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); if (cols) geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeBoundingBox(); geo.computeBoundingSphere();
    const mm = new THREE.Mesh(geo, gr[0].material); mm.castShadow = gr[0].castShadow; mm.receiveShadow = gr[0].receiveShadow;
    mm.userData.merged = gr.length; mm.userData.pol = 1; mm.matrixAutoUpdate = false; mm.updateMatrix();
    scene.add(mm);
    const rec = { mm, items: [] };
    for (const o of gr) {
      const p = o.parent;
      rec.items.push({ o, parent: p, pos: o.position.clone(), quat: o.quaternion.clone(), scl: o.scale.clone(), pmw: p.matrixWorld.clone(), gone: false });
      p.children.splice(p.children.indexOf(o), 1); o.parent = null; // 장면에서 떼어 둬요 (remove 를 쓰지 않는 것은 아래 갈고리가 알아채지 않게)
      o.userData.mergedRec = rec;
    }
    MERGE.recs.push(rec); MERGE.groups++; MERGE.before += gr.length;
  }
  mergeHook();
  if (!MERGE.timer) MERGE.timer = setInterval(() => { try { mergeGuard(); } catch (e) {} }, 500);
  if (qs0.has('mergecheck') && !MERGE.chk) MERGE.chk = setInterval(() => { if (MERGE.log.length) document.documentElement.dataset.mergebad = MERGE.reverted + ' ' + MERGE.log.slice(0, 30).join(' ; '); }, 1000);
}
function fx2Tick(dt, t) {
  if (!FX2.ready) { FX2.ready = true; try { detailWorld(); } catch (e) { console.warn(e); } try { decorate(); } catch (e) { console.warn(e); } initUI2(); try { mergeStatic(); } catch (e) { console.warn(e); } }
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
function goal(x, z, rot = 0) { const g = grp(x, z, rot); FX2.goals.push({ x, z, rot, g }); for (const dx of [-1.5, 1.5]) cyl(0.06, 0.06, 2, 0xffffff, dx, 1, 0, g); box(3.1, 0.12, 0.12, 0xffffff, 0, 2, 0, g); const n = new THREE.Mesh(new THREE.PlaneGeometry(3, 2, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 })); n.position.set(0, 1, -0.5); n.rotation.x = 0.25; g.add(n); ball(0.22, 0xffffff, 0.6, 0.22, 0.9, g); return g; }
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
  const fs = o.fs || 56, pad = o.pad || 22, tail = o.tail || 0, fnt = `${o.fw ? o.fw + ' ' : ''}${fs}px ${o.font || FONT}`;
  const c = document.createElement('canvas'); const ctx = c.getContext('2d');
  ctx.font = fnt;
  const lines = String(text).split('\n');
  const w = Math.ceil(Math.max(...lines.map(l => ctx.measureText(l).width))) + pad * 2;
  const h = Math.ceil(fs * 1.25 * lines.length + pad * 1.2);
  c.width = Math.max(o.minW || 0, w); c.height = h + tail;
  ctx.font = fnt;
  if (o.bg !== null && tail) { // 말풍선: 둥근 상자 + 아래 가운데 꼬리 (테두리 안쪽으로 그려요)
    const i = o.border ? 3 : 0, W = c.width - i, H = h - i, r = Math.min(30, (H - i) / 2), m = c.width / 2;
    ctx.beginPath(); ctx.moveTo(i + r, i); ctx.arcTo(W, i, W, H, r); ctx.arcTo(W, H, m, H, r);
    ctx.lineTo(m + tail * 0.75, H); ctx.lineTo(m, h + tail - i - 1); ctx.lineTo(m - tail * 0.75, H);
    ctx.arcTo(i, H, i, i, r); ctx.arcTo(i, i, W, i, r); ctx.closePath();
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.93)'; ctx.fill();
    if (o.border) { ctx.lineWidth = 4; ctx.strokeStyle = o.border; ctx.stroke(); }
  } else if (o.bg !== null) {
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.93)';
    const r = Math.min(26, h / 2); ctx.beginPath();
    ctx.moveTo(r, 0); ctx.arcTo(c.width, 0, c.width, h, r); ctx.arcTo(c.width, h, 0, h, r); ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, c.width, 0, r); ctx.fill();
    if (o.border) { ctx.lineWidth = 8; ctx.strokeStyle = o.border; ctx.stroke(); }
  }
  ctx.fillStyle = o.fg || '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, pad * 0.6 + fs * 1.25 * (i + 0.5)));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { t, w: c.width, h: c.height, tail, fnt };
}
// 이름표 말풍선 (3.3): 크림색 둥근 풍선 + 금빛 테 + 기울인 명조 글씨. 글꼴이 늦게 오면 받은 뒤 다시 그려요
const BUBBLE = { fs: 44, pad: 18, tail: 14, bg: 'rgba(251,243,223,.96)', fg: '#3a2c14', border: '#c9a24a', fw: 'italic 700', font: "'Gowun Batang', 'Batang', serif" };
function bubbleSprite(text, height, o) {
  const opt = Object.assign({}, BUBBLE, o || {}), s = textSprite(text, height, opt);
  try {
    const f = `${opt.fw} ${opt.fs}px 'Gowun Batang'`;
    if (document.fonts && !document.fonts.check(f, String(text))) document.fonts.load(f, String(text)).then(() => {
      try { const n = labelCanvas(text, opt), old = s.material.map; s.material.map = n.t; s.material.needsUpdate = true; s.scale.set(s.scale.y * n.w / n.h, s.scale.y, 1); if (old) old.dispose(); } catch (e) {}
    }, () => {});
  } catch (e) {}
  return s;
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

// ---------- 3.4 그림 같은 화풍 (PAINT): 붓으로 칠한 바닥·길·벽·지붕·물·하늘과 따뜻한 불빛 — 모든 단원이 함께 써요 ----------
//  · 단원 세계를 다 만든 뒤 PAINT.apply({ sky: '이름' 또는 {...} }) 를 한 번 불러요. ?noart 면 아무것도 하지 않아요 (예전 모습과 비교하기)
//  · 큰 면(바닥·길·벽·지붕·물)에만 붓질 무늬를 입히고, 무늬 한 장·재질 하나를 여러 곳이 함께 써요.
//    무늬는 거의 흰 바탕이라 원래 색을 곱해요 → 단원마다 고른 색이 그대로 남아요. 작은 소품은 색만 (엔진이 합쳐 그려요)
//  · PAINT 재질(userData.paint)은 무늬가 있어도 '움직이지 않는 물체 합치기'에 들어가요 (무늬 자리는 월드 좌표라 이웃 조각과 이어져요)
//  · CPU 로 그리는 크롬(GFX.soft)이면 무늬 크기를 반으로, 벽·지붕·창문은 색만 (바닥·하늘만 칠해요)
//  · 엔진 mat(색) 으로 만든 흔한 재질만 바꿔요 (빛·유리·특별한 재질은 그대로). 빼고 싶은 물체는 userData.noart = 1
const PAINT = (() => {
  let off = false; try { off = new URLSearchParams(location.search).has('noart'); } catch (e) {}
  const A = { off, tex: {}, mats: {}, water: [], glows: [], fogHex: null, skyMat: null, applied: false, late: false };
  let seed = 20261126;
  const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const jit = (c, a = 18, l = 0) => { const [r, g, b] = rgb(c), k = (R() - 0.5) * 2 * a + l, f = (v) => cl(v + k + (R() - 0.5) * a * 0.7); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const pick = (arr) => arr[(R() * arr.length) | 0];
  const HSL = (c) => new THREE.Color(c).getHSL({}, THREE.SRGBColorSpace); // 화면에 보이는 색(sRGB) 기준
  const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k).getHex();
  const offHex = (c, dh, ds, dl) => { const k = new THREE.Color(c), h = k.getHSL({}, THREE.SRGBColorSpace); return k.setHSL((h.h + dh + 1) % 1, Math.max(0, Math.min(1, h.s + ds)), Math.max(0, Math.min(1, h.l + dl)), THREE.SRGBColorSpace).getHex(); };
  // 캔버스 그림 → 무늬 (CPU 로 그리는 크롬이면 512 → 256)
  function tex(w, h, draw, rep = true) {
    const c = document.createElement('canvas'), k = GFX.soft && w >= 512 ? 0.5 : 1; c.width = w * k; c.height = h * k;
    const x = c.getContext('2d'); x.scale(k, k); draw(x, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = GFX.soft ? 1 : 4; return t;
  }
  function wrapDo(W, H, px, py, m, fn) { for (const ox of px < m ? [0, W] : px > W - m ? [0, -W] : [0]) for (const oy of py < m ? [0, H] : py > H - m ? [0, -H] : [0]) fn(px + ox, py + oy); }
  // 붓질 하나: 살짝 휜 둥근 선 (가장자리에 걸치면 반대편에도 그려서 이음매가 없어요)
  function dab(x, px, py, len, wid, ang, col, W, H, bend = 0.25) {
    const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2, bx = -dy * bend, by = dx * bend;
    x.strokeStyle = col; x.lineWidth = wid; x.lineCap = 'round';
    wrapDo(W, H, px, py, len + wid, (X, Y) => { x.beginPath(); x.moveTo(X - dx, Y - dy); x.quadraticCurveTo(X + bx, Y + by, X + dx, Y + dy); x.stroke(); });
  }
  // 그려 둔 그림 위에 그 자리 색으로 짧은 붓질을 잔뜩 (그림책 → 유화 느낌)
  function brushify(x, W, H, n, len, wid, alpha, angFn) {
    const cw = x.canvas.width, sx = cw / W, d = x.getImageData(0, 0, cw, x.canvas.height).data; x.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const px = R() * W, py = R() * H, k = (((py * sx) | 0) * cw + ((px * sx) | 0)) * 4, j = (R() - 0.5) * 26;
      dab(x, px, py, len * (0.6 + R() * 0.8), wid * (0.7 + R() * 0.6), angFn ? angFn(px, py) : (R() - 0.5) * 0.9, `rgb(${cl(d[k] + j)},${cl(d[k + 1] + j)},${cl(d[k + 2] + j * 1.2)})`, W, H, 0.3);
    }
    x.globalAlpha = 1;
  }
  // 짧은 붓질로 가득 채운 면
  function strokeTex(base, pal, n, len, wid, angFn, extra) {
    return tex(512, 512, (x, W, H) => {
      x.fillStyle = base; x.fillRect(0, 0, W, H);
      for (let i = 0; i < n; i++) { const px = R() * W, py = R() * H; dab(x, px, py, len * (0.6 + R() * 0.8), wid * (0.7 + R() * 0.6), angFn(px, py), jit(pick(pal), 14), W, H, 0.35); }
      if (extra) extra(x, W, H);
    });
  }
  // 둥근 돌을 엇갈려 깐 길
  function cobbleTex(pal, grout, rows = 13) {
    return tex(512, 512, (x, W, H) => {
      x.fillStyle = '#' + grout.toString(16).padStart(6, '0'); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 700; i++) dab(x, R() * W, R() * H, 12, 5, R() * 3, jit(grout, 12), W, H);
      const rh = H / rows;
      for (let r = 0; r < rows; r++) {
        const ws = []; let s = 0; while (s < W - 30) { const w = 30 + R() * 26; ws.push(w); s += w; } const kk = W / s;
        let x0 = (r % 2) * 20 + R() * 8;
        for (const w0 of ws) {
          const w = w0 * kk, cx = x0 + w / 2, cy = r * rh + rh / 2 + (R() - 0.5) * 2.5, c = pick(pal), bw = w - 4 - R() * 2, bh = rh - 4 - R() * 2;
          wrapDo(W, H, cx, cy, w, (X, Y) => { x.fillStyle = jit(c, 8, -4); x.beginPath(); x.roundRect(X - bw / 2, Y - bh / 2, bw, bh, Math.min(bw, bh) * 0.42); x.fill(); });
          for (let j = 0; j < 5; j++) dab(x, cx + (R() - 0.5) * w * 0.5, cy + (R() - 0.5) * rh * 0.45, w * (0.22 + R() * 0.22), 3 + R() * 3, (R() - 0.5) * 0.6, jit(c, 18, j % 2 ? 10 : -6), W, H, 0.4);
          x0 += w;
        }
      }
      brushify(x, W, H, 900, 9, 3, 0.35, () => (R() - 0.5) * 0.8);
    });
  }
  // 네모 보도블록·타일 (블록마다 붓질)
  function blockTex(pal, line, n = 4) {
    return tex(512, 512, (x, W, H) => {
      x.fillStyle = '#' + line.toString(16).padStart(6, '0'); x.fillRect(0, 0, W, H); const s = W / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const c = pick(pal), x0 = i * s + ((j % 2) * s / 2), y0 = j * s;
        wrapDo(W, H, x0 + s / 2, y0 + s / 2, s, (X, Y) => { x.fillStyle = jit(c, 7); x.fillRect(X - s / 2 + 3, Y - s / 2 + 3, s - 6, s - 6); });
        for (let k = 0; k < 34; k++) dab(x, x0 + 8 + R() * (s - 16), y0 + 8 + R() * (s - 16), 12 + R() * 16, 4 + R() * 4, (R() - 0.5) * 0.6 + (k % 2 ? 0 : 1.57), jit(c, 16), W, H, 0.3);
      }
    });
  }
  // 무늬 만들기 (쓰는 것만 처음 쓸 때 한 번 만들어요)
  const MAKE = {
    stucco: () => tex(512, 512, (x, W, H) => { // 회벽: 크고 부드러운 붓질 (색 차이는 작게)
      x.fillStyle = '#f5f2ec'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 760; i++) dab(x, R() * W, R() * H, 46 + R() * 50, 14 + R() * 10, (R() - 0.5) * 0.9, jit(pick([0xffffff, 0xf9f5ee, 0xf0ece5, 0xeae5dd, 0xf6efe3, 0xedeaf1]), 5), W, H, 0.35);
      x.globalAlpha = 0.5; for (let i = 0; i < 260; i++) dab(x, R() * W, R() * H, 18 + R() * 16, 4 + R() * 3, (R() - 0.5) * 1.2, jit(pick([0xffffff, 0xe6e0d6]), 6), W, H, 0.4); x.globalAlpha = 1;
    }),
    lawn: () => strokeTex('#edf2e4', [0xffffff, 0xe2edd2, 0xd2e2bf, 0xf5f5d4, 0xc6d9b0, 0xfafbe6], 2600, 15, 4, (px, py) => -1.2 + Math.sin(px * 0.02 + py * 0.035) * 0.6),
    asphalt: () => strokeTex('#e8eaef', [0xffffff, 0xdadde6, 0xcdd1dc, 0xf1f2f6, 0xd5cfdf, 0xe2e6f0], 2400, 18, 5, () => (R() - 0.5) * 0.5),
    leaf: () => strokeTex('#eef3e6', [0xffffff, 0xdfe9d0, 0xcddcbb, 0xf4f6dc, 0xc2d4ae, 0xf9fbe9], 2400, 12, 5, () => R() * 6.3),
    hill: () => strokeTex('#f0f2ea', [0xffffff, 0xe3eada, 0xd6e0c9, 0xf6f2d8, 0xdce4cf, 0xeef3e6], 1600, 24, 8, (px, py) => -0.4 + Math.sin(px * 0.015 + py * 0.02) * 0.7),
    cobble: () => cobbleTex([0xffffff, 0xffe1dc, 0xe8ddff, 0xdbe9ff, 0xfff0cc, 0xffe2cc, 0xf0f6e4], 0xbdb2a6, 12),
    tile: () => blockTex([0xffffff, 0xf6f1ea, 0xeeece8, 0xf9f5ee, 0xefe9e2], 0xd2cbc0, 4),
    plank: () => tex(512, 512, (x, W, H) => { const n = 8, s = H / n; for (let i = 0; i < n; i++) { x.fillStyle = jit(0xf2ece4, 12); x.fillRect(0, i * s, W, s - 3); x.fillStyle = 'rgba(120,96,70,.35)'; x.fillRect(0, i * s + s - 3, W, 3); for (let k = 0; k < 60; k++) dab(x, R() * W, i * s + 3 + R() * (s - 8), 40 + R() * 50, 2.5, (R() - 0.5) * 0.06, jit(0xd8cdbf, 20), W, H, 0.05); } }),
    slab: () => strokeTex('#f3f1ed', [0xffffff, 0xf7f5f1, 0xeeebe6, 0xe8e4de, 0xfaf8f4, 0xf1ece5], 1100, 46, 11, () => (R() - 0.5) * 0.2, (x, W, H) => { for (let r = 0; r < 8; r++) { x.fillStyle = 'rgba(80,66,60,.09)'; x.fillRect(0, r * H / 8 + H / 8 - 3, W, 3); } }), // 평평한 지붕: 위에서는 지붕 줄, 아래에서는 칠한 천장
    roof: () => tex(512, 512, (x, W, H) => { // 기와 줄 (색은 재질 색을 곱해요)
      x.fillStyle = '#d9d9d9'; x.fillRect(0, 0, W, H); const rh = H / 8;
      for (let r = 0; r < 8; r++) { for (let i = 0; i < 16; i++) { const cx = i * W / 16 + (r % 2) * W / 32; wrapDo(W, H, cx, r * rh, 40, (X, Y) => { x.fillStyle = jit(0xf2f2f2, 16); x.beginPath(); x.ellipse(X, Y + rh * 0.55, W / 32 - 2, rh * 0.55, 0, 0, Math.PI); x.fill(); }); }
        for (let k = 0; k < 40; k++) dab(x, R() * W, r * rh + R() * rh, 14, 4, 1.4 + (R() - 0.5) * 0.4, jit(0xffffff, 26, -12), W, H, 0.3);
        x.fillStyle = 'rgba(60,40,40,.35)'; x.fillRect(0, r * rh + rh - 4, W, 4); }
    }),
    brick: () => tex(512, 512, (x, W, H) => {
      x.fillStyle = '#e8d8c8'; x.fillRect(0, 0, W, H); const rows = 16, rh = H / rows, bw = W / 8;
      for (let r = 0; r < rows; r++) for (let i = 0; i < 9; i++) { const cx = i * bw + (r % 2) * bw / 2, c = pick([0xb5523b, 0xa8472f, 0xc4643f, 0x9e4a3a, 0xbf5a45]);
        wrapDo(W, H, cx, r * rh + rh / 2, bw, (X, Y) => { x.fillStyle = jit(c, 10); x.fillRect(X - bw / 2 + 3, Y - rh / 2 + 2.5, bw - 6, rh - 5); });
        for (let k = 0; k < 3; k++) dab(x, cx + (R() - 0.5) * bw * 0.6, r * rh + rh / 2 + (R() - 0.5) * rh * 0.3, bw * 0.35, 3, (R() - 0.5) * 0.2, jit(c, 22), W, H, 0.2); }
    }),
    ice: () => tex(512, 512, (x, W, H) => { x.fillStyle = '#e4f4fb'; x.fillRect(0, 0, W, H); for (let i = 0; i < 1300; i++) { const cx = R() * W, cy = R() * H, r = 60 + R() * 220, a0 = R() * 6.28; dab(x, cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, 18 + R() * 30, 2 + R() * 4, a0 + 1.57, pick(['#ffffff', '#cfeaf7', '#e9f6fc', '#bfe0f2', '#f4fbff']), W, H, 0.5); } }), // 빙판: 스케이트 날 자국처럼 둥근 붓질
    water: () => strokeTex('#4a8bd0', [0x3b7fc4, 0x5aa0e0, 0x7fc0f0, 0x2f6fb0, 0x9fd6f5, 0x4f9ad8], 2200, 30, 5, (px, py) => Math.sin(px * 0.025 + py * 0.06) * 0.35, (x, W, H) => { for (let i = 0; i < 90; i++) dab(x, R() * W, R() * H, 10 + R() * 14, 3, (R() - 0.5) * 0.3, 'rgba(255,255,255,.85)', W, H, 0.4); }),
    snow: () => strokeTex('#f3f6fb', [0xffffff, 0xeef3fb, 0xe2e9f5, 0xf7f1f6, 0xe6e2f2, 0xfdfaf2, 0xd8e2f1], 2800, 18, 5, (px, py) => -0.3 + Math.sin(px * 0.018 + py * 0.03) * 0.5, (x, W, H) => { for (let i = 0; i < 160; i++) { x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(R() * W, R() * H, 2, 2); } }),
    // 유리창: 위는 하늘이 비치고 아래는 방 안의 따뜻한 불빛 (엔진 창문은 창살이 따로 있어서 창살 없이)
    glass: () => winTex(false),
    win: () => winTex(true),
    glow: () => tex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,.75)'); g.addColorStop(0.45, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }, false)
  };
  function winTex(frame) {
    return tex(256, 256, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#b9dcf4'); g.addColorStop(0.42, '#d6eaf4'); g.addColorStop(0.58, '#ffe6ad'); g.addColorStop(1, '#ffcd78'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 240; i++) dab(x, R() * W, R() * H * 0.55, 16 + R() * 18, 5 + R() * 4, (R() - 0.5) * 0.5, pick(['#cfe6f7', '#a8d0ef', '#e8f4fb', '#b5d8f2']), W, H, 0.3);
      for (let i = 0; i < 200; i++) dab(x, R() * W, H * 0.55 + R() * H * 0.45, 14 + R() * 14, 5 + R() * 4, (R() - 0.5) * 0.6, pick(['#ffe2a0', '#ffd27f', '#ffefc6', '#ffc66a', '#f8d8a0']), W, H, 0.3);
      for (const sx of [0, 1]) for (let i = 0; i < 26; i++) dab(x, sx ? W - 10 - R() * 26 : 10 + R() * 26, H * 0.5 + R() * H * 0.5, 34 + R() * 26, 7 + R() * 5, Math.PI / 2 + (R() - 0.5) * 0.15, pick(['#f3aea3', '#ec958b', '#f8c6bc']), W * 9, H * 9, 0.1);
      x.globalAlpha = 0.65; for (let i = 0; i < 3; i++) dab(x, W * (0.28 + i * 0.13), H * (0.3 + i * 0.07), 80, 7 - i * 2, -0.9, '#ffffff', W * 9, H * 9, 0); x.globalAlpha = 1;
      if (frame) { x.strokeStyle = '#fbf8f2'; x.lineWidth = 18; x.strokeRect(0, 0, W, H); x.lineWidth = 10; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.moveTo(0, H * 0.5); x.lineTo(W, H * 0.5); x.stroke(); }
    }, false);
  }
  const FLOORY = { lawn: 1, asphalt: 1, cobble: 1, tile: 1, plank: 1, water: 1, snow: 1, ice: 1 }; // 비스듬히 보는 바닥만 선명하게(이방성 4), 벽·지붕·잎은 1 (GPU 일을 덜어요)
  const get = (k) => { let t = A.tex[k]; if (!t) { t = A.tex[k] = MAKE[k](); if (!FLOORY[k]) t.anisotropy = 1; } return t; };
  // 땅: 그 단원 땅 색으로 칠한 들판 (붓질 + 작은 꽃 점)
  function meadowTex(hex) {
    const k = 'meadow' + hex; if (A.tex[k]) return A.tex[k];
    const pal = [hex, offHex(hex, 0.015, 0.05, -0.08), offHex(hex, -0.03, 0.08, 0.05), offHex(hex, 0.05, -0.05, -0.13), offHex(hex, -0.06, 0.1, 0.0), offHex(hex, 0, -0.05, 0.1), mix(hex, 0xc9b65a, 0.35), offHex(hex, 0.03, 0.0, -0.18)];
    return (A.tex[k] = strokeTex('#' + new THREE.Color(hex).getHexString(), pal, 3200, 16, 4, (px, py) => -1.2 + Math.sin(px * 0.02 + py * 0.035) * 0.6,
      (x, W, H) => { for (let i = 0; i < 70; i++) { const c = pick(['#ffffff', '#fff3a8', '#ffc9de', '#e5d4ff', '#fffbe8']), px = R() * W, py = R() * H; dab(x, px, py, 3, 4, 0, c, W, H, 0); } }));
  }
  // ---------- 하늘: 아래쪽 하늘에 소용돌이 붓질 + 뭉게구름 (단원마다 색만 조금씩 달라요) ----------
  const SKY = {
    school: { st: [[0, '#2f68c0'], [0.5, '#5d95d6'], [0.8, '#9cc6ea'], [0.94, '#d6e9f4'], [1, '#eef1ea']], fog: 0xdde9ee },
    warm:   { st: [[0, '#3470c2'], [0.5, '#649fdb'], [0.8, '#a9cde9'], [0.93, '#f0dcc6'], [1, '#f8e7d3']], fog: 0xf0e3d6, shade: ['#ece0e4', '#e4e0ee', '#f2e6e2'] },
    spring: { st: [[0, '#3a7bce'], [0.5, '#72abe5'], [0.8, '#b1d6f1'], [0.93, '#f1dfec'], [1, '#fbedf2']], fog: 0xf0e5ee, shade: ['#eedcec', '#e6dcf2', '#f2e0ea'], cloud: ['#ffffff', '#fff6fa', '#fffaf2'] },
    lilac:  { st: [[0, '#3a68c6'], [0.5, '#7095dc'], [0.8, '#b1c2ee'], [0.93, '#e3dbf4'], [1, '#f0ebf6']], fog: 0xe7e3f2, shade: ['#ddd4f0', '#d8daf2', '#e8dcf2'] },
    fresh:  { st: [[0, '#2670c4'], [0.5, '#4c9edb'], [0.8, '#8fcee9'], [0.93, '#d2eeee'], [1, '#ebf7ef']], fog: 0xdbeeea },
    golden: { st: [[0, '#386cbb'], [0.5, '#6a9dd5'], [0.8, '#b0cde2'], [0.93, '#f0e0bd'], [1, '#f7ead0']], fog: 0xeee2cc, cloud: ['#ffffff', '#fff8e8', '#fff2d6'], shade: ['#ead6c6', '#e6d8d8', '#efdcc8'] },
    clear:  { st: [[0, '#2265c6'], [0.5, '#4991de'], [0.8, '#8ac2ed'], [0.93, '#d0eaf6'], [1, '#edf6f4']], fog: 0xdaecf2 },
    pastel: { st: [[0, '#476cc7'], [0.5, '#809cdf'], [0.8, '#bfc2ee'], [0.93, '#f1d7e6'], [1, '#f8e8ef']], fog: 0xefe1eb, shade: ['#e7d1ea', '#e0d4f2', '#f0d6e4'], ring: ['#ffffff', '#f6ecfa', '#e2dcf6'] },
    summer: { st: [[0, '#1c5cc0'], [0.5, '#3c87de'], [0.8, '#83bdee'], [0.93, '#cde7f6'], [1, '#e9f4f4']], fog: 0xd6e9f2, clouds: 14 },
    mint:   { st: [[0, '#2d6cc4'], [0.5, '#5899da'], [0.8, '#9dcfe5'], [0.93, '#d4efe4'], [1, '#edf7ed']], fog: 0xdaeee4 },
    peach:  { st: [[0, '#3269c2'], [0.5, '#649ad8'], [0.8, '#a6cbe9'], [0.93, '#efdecd'], [1, '#f6eadf']], fog: 0xede3d9, shade: ['#ead8d8', '#e3dbe9', '#efdcd2'] },
    winter: { st: [[0, '#5579c4'], [0.5, '#8aa5da'], [0.8, '#c2cde8'], [0.93, '#f0d8d6'], [1, '#f8e6d8']], fog: 0xefe3e0, cloud: ['#ffffff', '#fff6f0', '#fff0e4'], shade: ['#e0d3ea', '#d9d6ee', '#ecd6e0'], ring: ['#ffffff', '#f3eefa', '#dfe2f5'], vort: 5 }
  };
  const SKY_D = { cloud: ['#ffffff', '#fffaf0', '#fff7e6', '#ffffff'], shade: ['#e4e0f0', '#dde3f2', '#eeeaf5'], ring: ['#ffffff', '#eaf3fb', '#cfe3f6'], clouds: 8, vort: 4 };
  function skyTex(o) {
    const W = 1024, H = 512, hz = H / 2; // 그리기는 1024×512 자리로, 그림은 두 배(2048×1024)로 또렷하게 (CPU 로 그리면 1024)
    return tex(W * 2, H * 2, (x) => {
      x.scale(2, 2);
      const g = x.createLinearGradient(0, 0, 0, hz); o.st.forEach(([k, c]) => g.addColorStop(k, c)); x.fillStyle = g; x.fillRect(0, 0, W, hz);
      x.fillStyle = '#' + new THREE.Color(o.fog).getHexString(); x.fillRect(0, hz, W, H - hz);
      // 하늘 바탕: 소용돌이 흐름을 따라가는 그 자리 색 붓질
      const vort = []; for (let i = 0; i < o.vort; i++) vort.push([(i + R() * 0.6) / o.vort * W, hz * (0.42 + R() * 0.3), 46 + R() * 50, R() < 0.5 ? 1 : -1]);
      const flow = (px, py) => { let a = Math.sin(py * 0.03 + px * 0.004) * 0.22; for (const [vx, vy, r, s] of vort) { let dx = px - vx; if (dx > W / 2) dx -= W; if (dx < -W / 2) dx += W; const dy = (py - vy) * 1.6, d = Math.hypot(dx, dy); if (d < r * 2) { const k = Math.max(0, 1 - d / (r * 2)); a += (Math.atan2(dy, dx) + s * Math.PI / 2) * k * k * 1.5 - a * k * k; } } return a; };
      const cw = x.canvas.width, sx = cw / W, d0 = x.getImageData(0, 0, cw, Math.ceil(hz * sx)).data;
      for (let i = 0; i < 5200; i++) {
        const py = Math.pow(R(), 0.7) * hz, px = R() * W, k = (((py * sx) | 0) * cw + ((px * sx) | 0)) * 4, j = (R() - 0.45) * 30;
        dab(x, px, py, 12 + R() * 16, 3 + R() * 3, flow(px, py), `rgba(${cl(d0[k] + j * 0.8)},${cl(d0[k + 1] + j)},${cl(d0[k + 2] + j * 1.1)},0.7)`, W, H * 4, 0.3);
      }
      // 부드러운 소용돌이 (흰 빛 고리, 살짝)
      for (const [vx, vy, r, s] of vort) for (let ring = 0; ring < 4; ring++) { const rr = r * (0.3 + ring * 0.22); x.globalAlpha = 0.24 - ring * 0.035; for (let a = 0; a < 6.28; a += 0.2) dab(x, (vx + Math.cos(a) * rr * 1.5 + W) % W, vy + Math.sin(a) * rr * 0.6, 14, 3.5, a + s * 1.57, pick(o.ring), W, H * 4, 0.2); x.globalAlpha = 1; }
      // 지평선 가까이 옅은 새털구름
      x.globalAlpha = 0.45; for (let i = 0; i < 110; i++) dab(x, R() * W, hz * (0.7 + R() * 0.24), 40 + R() * 60, 2 + R() * 2.5, (R() - 0.5) * 0.12, pick(o.ring), W, H * 4, 0.08); x.globalAlpha = 1;
      // 뭉게구름: 둥근 덩이 여러 개 (아래는 그늘 색, 위는 크림색) + 덩이를 따라 도는 붓질
      const fillE = (px, py, rx, ry, col) => { x.fillStyle = col; for (const ox of [0, W, -W]) { if (px + ox + rx < 0 || px + ox - rx > W) continue; x.beginPath(); x.ellipse(px + ox, py, rx, ry, 0, 0, 6.29); x.fill(); } };
      for (let i = 0; i < o.clouds; i++) {
        const big = i % 3 === 0, cx = (i + R() * 0.7) / o.clouds * W, cy = hz * (0.82 + R() * 0.1), cw2 = big ? 34 + R() * 16 : 14 + R() * 18, n = big ? 5 + ((R() * 3) | 0) : 3 + ((R() * 2) | 0), puffs = [];
        for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, pr = cw2 * (0.2 + 0.3 * Math.sin(f * Math.PI)) * (0.8 + R() * 0.4); puffs.push([cx - cw2 + f * 2 * cw2 + (R() - 0.5) * 10, cy - pr * 0.4, pr]); }
        x.globalAlpha = 0.95; for (const [px, py, pr] of puffs) fillE(px, py + pr * 0.18, pr, pr * 0.78, pick(o.shade));
        fillE(cx, cy + 1, cw2 * 1.05, Math.max(4, cw2 * 0.1), pick(o.shade));
        for (const [px, py, pr] of puffs) fillE(px - pr * 0.06, py - pr * 0.1, pr * 0.86, pr * 0.62, pick(o.cloud)); x.globalAlpha = 1;
        for (const [px, py, pr] of puffs) for (let k = 0; k < 22; k++) { const a = R() * 6.28, rr = pr * (0.35 + R() * 0.6), qy = py + Math.sin(a) * rr * 0.7; dab(x, (px + Math.cos(a) * rr + W) % W, qy, pr * (0.3 + R() * 0.3), 2.5 + R() * 3, a + 1.57, qy > py + pr * 0.2 ? pick(o.shade) : pick(o.cloud), W, H * 4, 0.35); }
      }
    }, false);
  }
  // ---------- 무늬 자리 (월드 좌표로 잡아서 이웃 조각과 이어져요) ----------
  const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
  function worldUV(o, tile) {
    const g = o.geometry, P0 = g.attributes.position, N0 = g.attributes.normal, uv = g.attributes.uv; if (!uv || !N0 || g.userData.artUV) return; g.userData.artUV = 1;
    o.updateMatrixWorld(true); _nm.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < P0.count; i++) {
      _v.fromBufferAttribute(P0, i).applyMatrix4(o.matrixWorld); _n.fromBufferAttribute(N0, i).applyMatrix3(_nm);
      const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z);
      if (ay >= ax && ay >= az) uv.setXY(i, _v.x / tile, -_v.z / tile); else if (ax >= az) uv.setXY(i, _v.z / tile, _v.y / tile); else uv.setXY(i, _v.x / tile, _v.y / tile);
    }
    uv.needsUpdate = true;
  }
  function roundUV(o, tile) { const g = o.geometry, p = g.parameters, uv = g.attributes.uv; if (!uv || g.userData.artUV) return; g.userData.artUV = 1; const s = o.scale, r = Math.max(p.radiusTop || 0, p.radiusBottom || 0, p.radius || 0) * Math.max(s.x, s.z); const ku = Math.max(1, Math.round(2 * Math.PI * r / tile)), kv = Math.max(1, p.height * s.y / tile); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ku, uv.getY(i) * kv); uv.needsUpdate = true; }
  // 재질은 (무늬 × 곱할 색) 마다 하나 → 같은 색 벽끼리 합쳐 그려요
  function pm(key, t, tint = 0xffffff, rough = 0.95, o = {}) {
    const k = key + '|' + tint + '|' + rough; let m = A.mats[k];
    if (!m) { m = A.mats[k] = new THREE.MeshStandardMaterial(Object.assign({ map: t, color: tint, roughness: rough }, o)); m.userData.paint = 1; }
    return m;
  }
  // 바닥 색 → 무늬 [이름, 한 장 크기(m), 곱할 색]
  function floorKind(hex, w, d, want) {
    const c = HSL(hex), area = w * d, long = Math.max(w, d) / Math.max(0.01, Math.min(w, d));
    const k = want || (c.s < 0.22 && c.l < 0.5 ? 'asphalt'
      : c.h > 0.5 && c.h < 0.67 && c.s > 0.4 && c.l > 0.3 && c.l < 0.82 ? 'water'
      : c.h > 0.48 && c.h < 0.64 && c.s > 0.3 && c.l >= 0.82 ? 'ice'
      : c.h > 0.17 && c.h < 0.48 && c.s > 0.2 && c.l < 0.82 ? 'lawn'
      : c.h > 0.03 && c.h < 0.14 && c.s > 0.2 && c.l > 0.3 && c.l < 0.76 ? 'plank'
      : c.l > 0.6 && (area >= 1000 || (long >= 4 && area >= 60)) ? 'cobble'
      : c.l > 0.6 ? 'tile' : 'stucco');
    const T = { asphalt: 4, water: 3.5, ice: 5, lawn: 4.5, plank: 2.4, cobble: 3.2, tile: 2.6, stucco: 3, snow: 8, brick: 2.2 }[k] || 3;
    return [k, T, k === 'water' ? mix(hex, 0xffffff, 0.55) : k === 'brick' || k === 'snow' || k === 'ice' ? 0xffffff : hex];
  }
  function floorMat(k, tint) { return k === 'water' ? pm('water', get('water'), tint, 0.25) : k === 'ice' ? pm('ice', get('ice'), tint, 0.3, { metalness: 0.05 }) : pm(k, get(k), tint, k === 'asphalt' ? 0.92 : 0.95); }
  function paintFloor(o, hex, w, d, want) { const [k, t, tint] = floorKind(hex, w, d, want); worldUV(o, t); o.material = floorMat(k, tint); }
  // ---------- 큰 면 찾아 칠하기 (색·모양으로 찾아요) ----------
  A.surfaces = function (opt = {}) {
    const FL = opt.floor || {}, soft = GFX.soft;
    scene.updateMatrixWorld(true);
    const todo = []; scene.traverse(o => { if (o.isMesh && !o.isInstancedMesh) todo.push(o); });
    for (const o of todo) {
      let skip = false; for (let a = o; a; a = a.parent) if (a.userData.dyn || a.userData.noart || a.userData.anim || a.userData.keep) { skip = true; break; } if (skip) continue;
      const m = o.material; if (!m || Array.isArray(m) || !m.isMeshStandardMaterial || m.map || m.transparent || !m.color) continue;
      const hex = m.color.getHex(); if (mats[hex] !== m) continue; // 엔진 mat() 으로 만든 흔한 색만
      const g = o.geometry, p = g.parameters || {}, s = o.scale, t = g.type, y = o.matrixWorld.elements[13], c = HSL(hex);
      if (t === 'PlaneGeometry') {
        if (Math.abs(o.rotation.x + Math.PI / 2) > 0.01) continue;
        const w = p.width * s.x, d = p.height * s.y;
        if (w >= 200) { // 땅: 들판(또는 눈밭). 엔진 꾸미기(풀 포기·꽃·눈송이)는 원래 색으로 그대로
          const snow = c.l > 0.85 && c.s < 0.4; worldUV(o, snow ? 8 : 7);
          o.material = new THREE.MeshStandardMaterial({ map: snow ? get('snow') : meadowTex(hex), roughness: 1 }); o.userData.grass = 1; o.userData.grassHex = hex; continue;
        }
        if (w * d >= 6 && Math.min(w, d) >= 1) paintFloor(o, hex, w, d, FL[hex]);
        continue;
      }
      if (t === 'CircleGeometry') { // 둥근 마당
        const r = p.radius * Math.max(s.x, s.y); if (Math.abs(o.rotation.x + Math.PI / 2) < 0.01 && r >= 2) paintFloor(o, hex, r * 2, r * 2, FL[hex]);
        continue;
      }
      if (t === 'BoxGeometry') {
        const w = p.width * s.x, h = p.height * s.y, d = p.depth * s.z, flat = Math.abs(o.rotation.x) < 0.6 && Math.abs(o.rotation.z) < 0.6;
        if (h <= 0.06 && w * d >= 6 && Math.min(w, d) >= 1 && flat) { paintFloor(o, hex, w, d, FL[hex]); continue; }                       // 얇은 바닥판
        if (h <= 0.5 && y - h / 2 < 0.15 && w * d >= 12 && Math.min(w, d) >= 2 && flat) { paintFloor(o, hex, w, d, FL[hex]); continue; }   // 낮은 단(무대·마루)
        if (soft) continue;
        if (h <= 0.6 && y >= 2.4 && w * d >= 12 && flat) { worldUV(o, 2.6); o.material = pm('slab', get('slab'), hex, 0.85); continue; }      // 평평한 지붕
        if (Math.min(w, d) <= 0.12 && Math.max(w, d) >= 0.5 && Math.max(w, d) <= 2.8 && h >= 0.5 && h <= 2.8 && c.h > 0.5 && c.h < 0.66 && c.l > 0.68 && c.s > 0.3) { o.material = pm('win', get('win'), 0xffffff, 0.35, { emissive: 0xffffff, emissiveMap: get('win'), emissiveIntensity: 0.22, metalness: 0.1 }); continue; } // 창문
        if (h >= 0.7 && Math.max(w, d) >= 3.5) {                                                                                            // 벽
          if (c.l < 0.22) continue;
          if ((c.h < 0.05 || c.h > 0.97) && c.s > 0.35 && c.l > 0.25 && c.l < 0.55) { worldUV(o, 2.2); o.material = pm('brick', get('brick')); }
          else { worldUV(o, 3.2); o.material = pm('stucco', get('stucco'), hex); }
        }
        continue;
      }
      if (t === 'CylinderGeometry') {
        const r = Math.max(p.radiusTop, p.radiusBottom) * Math.max(s.x, s.z), h = p.height * s.y;
        if (r >= 0.8 && c.h > 0.5 && c.h < 0.67 && c.s > 0.4 && c.l > 0.3 && c.l < 0.82) { worldUV(o, 3.5); o.material = floorMat('water', mix(hex, 0xffffff, 0.55)); continue; } // 분수·연못 물
        if (r >= 2 && h <= 0.5 && y - h / 2 < 0.15) { paintFloor(o, hex, r * 2, r * 2, FL[hex]); continue; }                                    // 둥근 단
        if (soft) continue;
        if (r >= 0.55 && h >= 4 && c.l >= 0.22) { roundUV(o, 2.4); o.material = pm('stucco', get('stucco'), hex); }                              // 탑·둥근 기둥
        continue;
      }
      if (t === 'ConeGeometry' && !soft) {
        const r = p.radius * Math.max(s.x, s.z), h = p.height * s.y;
        if (r >= 0.7 && h >= 0.9 && r <= 6 && !(c.h > 0.17 && c.h < 0.48)) { roundUV(o, 1.6); o.material = pm('roof', get('roof'), hex, 0.8); } // 원뿔 지붕 (초록 원뿔은 나무라서 빼요)
      }
    }
  };
  // ---------- 먼 언덕: 하나로 합쳐 붓질 (그리기 30번 → 1번) ----------
  A.hills = function () {
    const hs = scene.children.filter(o => o.isMesh && o.geometry.type === 'SphereGeometry' && o.geometry.parameters.radius >= 20 && o.position.y < -5 && o.userData.pol);
    if (hs.length < 2) return;
    let nv = 0, ni = 0; for (const o of hs) { nv += o.geometry.attributes.position.count; ni += o.geometry.index.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uvs = new Float32Array(nv * 2), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    let vo = 0, io = 0;
    for (const o of hs) {
      o.updateMatrixWorld(true); const g = o.geometry, P0 = g.attributes.position, N0 = g.attributes.normal, U = g.attributes.uv, mw = o.matrixWorld, cc = o.material.color; _nm.getNormalMatrix(mw);
      for (let i = 0; i < P0.count; i++) {
        _v.fromBufferAttribute(P0, i).applyMatrix4(mw); pos.set([_v.x, _v.y, _v.z], (vo + i) * 3);
        _v.fromBufferAttribute(N0, i).applyMatrix3(_nm).normalize(); nor.set([_v.x, _v.y, _v.z], (vo + i) * 3);
        uvs[(vo + i) * 2] = U.getX(i) * 9; uvs[(vo + i) * 2 + 1] = U.getY(i) * 4; col.set([cc.r, cc.g, cc.b], (vo + i) * 3);
      }
      const I = g.index.array; for (let k = 0; k < I.length; k++) idx[io + k] = I[k] + vo; io += I.length; vo += P0.count;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    const mm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: get('hill'), roughness: 1 })); mm.userData.pol = 1; mm.userData.keep = 1; mm.receiveShadow = true;
    for (const o of hs) scene.remove(o);
    scene.add(mm); A.hillMesh = mm;
  };
  // ---------- 하늘 ----------
  A.sky = function (o) {
    const base = typeof o === 'string' ? o : (o && o.base) || 'school';
    for (const ch of base) seed = (seed * 31 + ch.charCodeAt(0) * 977) % 2147483647; // 하늘 이름마다 구름·소용돌이 자리가 달라요
    const p = Object.assign({}, SKY_D, SKY[base] || SKY.school, typeof o === 'object' ? o : {});
    const t = skyTex(p); t.wrapS = THREE.RepeatWrapping; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; // 하늘은 늘 크게 보여서 작은 그림(밉맵)이 필요 없어요 (메모리·CPU 그리기 아끼기)
    A.skyMat = new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false });
    sky.material = A.skyMat; clouds.clear(); // 하늘 그림에 구름이 있어서 둥근 구름 공은 치워요 (그리기 횟수도 줄어요)
    A.fogHex = p.fog; scene.fog.color.setHex(p.fog); if (scene.background && scene.background.isColor) scene.background.setHex(p.fog);
  };
  A.rain = function (on) { if (A.off || !A.skyMat) return; A.skyMat.color.setHex(on ? 0x8d97a6 : 0xffffff); };
  // ---------- 빛 번짐: 점 하나에 동그란 빛 그림 (Points 하나 = 그리기 한 번) ----------
  A.halo = function (list, size = 1.6, opacity = 0.5) {
    if (A.off || !list.length) return null;
    const pos = new Float32Array(list.length * 3), col = new Float32Array(list.length * 3), c = new THREE.Color();
    list.forEach(([x, y, z, h], i) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; c.setHex(h || 0xffc46b); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pt = new THREE.Points(g, new THREE.PointsMaterial({ size, map: get('glow'), vertexColors: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
    pt.userData.pol = 1; pt.renderOrder = 2; scene.add(pt); A.glows.push(pt); return pt;
  };
  // 엔진 창문(detailWorld 유리)에 하늘·불빛 그림
  function glassPaint(k) { const t = get('glass'); Object.assign(winGlassMat, { map: t, emissiveMap: t, roughness: 0.3, metalness: 0.1, emissiveIntensity: k }); winGlassMat.color.setHex(0xffffff); winGlassMat.emissive.setHex(0xffffff); winGlassMat.needsUpdate = true; }
  // 가로등 전구(lampPost2)는 하나씩 새 재질이라 같은 것끼리 하나로 (엔진이 합쳐 그려요)
  function lampShare() { let one = null; scene.traverse(o => { const m = o.material; if (!o.isMesh || !m || !m.isMeshStandardMaterial || m.map || m.transparent) return; if (m.color.getHex() === 0xfff3bf && m.emissive.getHex() === 0xffe08a && m.emissiveIntensity === 0.9 && m.roughness === 0.4) { if (!one) one = m; else o.material = one; } }); }
  // 둥근 나무(엔진 꾸미기가 뾰족한 나무를 바꾼 것): 잎 덩이 4개를 꼭짓점 색으로 한 덩어리로 (나무 하나 그리기 4번 → 1번, 그림자도)
  let treeM = null;
  function bakeTrees() {
    const leaf = new Set(Object.values(leafMats)), m4 = new THREE.Matrix4(); let n = 0;
    for (const G of scene.children.slice()) {
      if (!G.isGroup || G.children.length < 2 || G.userData.dyn || G.userData.anim || !G.visible) continue;
      if (!G.children.every(c => c.isMesh && c.visible && c.geometry.type === 'IcosahedronGeometry' && leaf.has(c.material))) continue;
      G.updateMatrixWorld(true); const inv = G.matrixWorld.clone().invert(), parts = []; let nv = 0;
      for (const c of G.children) { const g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); m4.multiplyMatrices(inv, c.matrixWorld); g.applyMatrix4(m4); parts.push([g, c.material.color]); nv += g.attributes.position.count; }
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3); let j = 0;
      for (const [g, c] of parts) { const cnt = g.attributes.position.count; pos.set(g.attributes.position.array, j * 3); nor.set(g.attributes.normal.array, j * 3); for (let i = 0; i < cnt; i++) { col[(j + i) * 3] = c.r; col[(j + i) * 3 + 1] = c.g; col[(j + i) * 3 + 2] = c.b; } j += cnt; g.dispose(); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3)); bg.computeBoundingSphere();
      if (!treeM) treeM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, map: GFX.soft ? null : get('leaf') });
      const mm = new THREE.Mesh(bg, treeM); mm.castShadow = true; mm.receiveShadow = true; mm.userData.pol = 1;
      for (const c of G.children.slice()) G.remove(c);
      G.add(mm); if (treeM.map) { bg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nv * 2), 2)); worldUV(mm, 1.6); } n++; // 잎에 붓질 (월드 좌표로)
    }
    return n;
  }
  // 엔진 꾸미기(창문·천장등)가 놓인 다음: 전구마다 따뜻한 빛 번짐
  function lateStep(opt) {
    try { A.trees = bakeTrees(); } catch (e) { console.warn(e); }
    try { if (!GFX.soft) { const leaf = new Set(Object.values(leafMats)); for (const o of scene.children) if (o.isInstancedMesh && o.geometry.type === 'IcosahedronGeometry' && leaf.has(o.material)) { o.material = o.material.clone(); o.material.map = get('leaf'); } } } catch (e) { console.warn(e); } // 덤불에도 잎 붓질
    const list = [], lan = [], wp = new THREE.Vector3();
    scene.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || !o.visible) return; const m = o.material, g = o.geometry; if (!m || Array.isArray(m) || !g || g.type !== 'SphereGeometry' || g.parameters.radius > 0.35) return;
      let dyn = false; for (let a = o; a; a = a.parent) if (a.userData.dyn || a.userData.anim || a.userData.tag) dyn = true; if (dyn) return;
      const lamp = (m.isMeshStandardMaterial && m.emissive && m.emissive.getHex() === 0xffe08a && m.emissiveIntensity >= 0.8) || (m.isMeshBasicMaterial && !m.map && m.color.getHex() === 0xfff3bf);
      if (lamp) { o.getWorldPosition(wp); list.push([wp.x, wp.y, wp.z, 0xffc46b]); }
      else if (m.isMeshStandardMaterial && g.parameters.radius === 0.3 && m.emissiveIntensity === 0.35 && m.emissive.getHex() === m.color.getHex()) { o.getWorldPosition(wp); lan.push([wp.x, wp.y, wp.z, mix(m.color.getHex(), 0xffe6a0, 0.45)]); } // 등불 줄(lanternLine)
    });
    for (const e of opt.glows || []) list.push(e);
    const k = GFX.soft ? 0 : opt.glow == null ? 1 : opt.glow; // CPU 로 그리면 빛 번짐은 빼요 (겹쳐 그리는 점이 비싸요)
    if (list.length && k > 0) { A.halo(list, 1.9, 0.42 * k); A.halo(list.map(([x, y, z]) => [x, y, z, 0xfff1c9]), 0.55, Math.min(1, 0.8 * k)); }
    if (lan.length && k > 0) A.halo(lan, 2.8, 0.42 * k);
    // 꽃가루·눈송이(엔진 꾸미기)를 네모 대신 동그란 빛 알갱이로
    if (FX2.pollen && FX2.pollen.pts) { const pm0 = FX2.pollen.pts.material; pm0.map = get('glow'); pm0.size *= 1.8; pm0.needsUpdate = true; }
  }
  // ---------- 한 번에: 하늘 → 언덕 → 큰 면 → 창문 → (꾸미기 뒤) 빛 번짐 ----------
  A.apply = function (opt = {}) {
    if (A.off || A.applied) return; A.applied = true; A.opt = opt;
    const t0 = performance.now();
    try { A.sky(opt.sky || 'school'); } catch (e) { console.warn(e); }
    try { A.hills(); } catch (e) { console.warn(e); }
    try { A.surfaces(opt); } catch (e) { console.warn(e); }
    try { if (!GFX.soft) glassPaint(opt.winGlow == null ? 0.2 : opt.winGlow); } catch (e) { console.warn(e); }
    try { lampShare(); } catch (e) { console.warn(e); }
    FX2.tickers.push((dt, t) => {
      if (!A.late) { A.late = true; try { lateStep(opt); } catch (e) { console.warn(e); } }
      const w = A.tex.water; if (w) w.offset.x = t * 0.03;
      if (A.hillMesh) A.hillMesh.visible = !(GFX.lite && GFX.soft); // CPU 로 그리며 아주 가볍게: 언덕은 보이는 거리(50m) 밖이라 안 그려요
    });
    A.ms = Math.round(performance.now() - t0);
  };
  try { window.__paint = A; } catch (e) {} // 개발용: 콘솔에서 살펴보기
  A.get = get; A.pm = pm; A.worldUV = worldUV; A.roundUV = roundUV; A.dab = dab; A.tex2 = tex; A.R = R; A.SKY = SKY;
  return A;
})();

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
// 꾸미기(fun.js 에서 골라요): 1 모자 · 2 가방 · 3 풍선 · 4 왕관 · 5 나비 날개. 몸·머리 부품과 하나로 합쳐져서 그리기 횟수는 늘지 않아요
function decoParts(d, g, headG, R, sh) {
  const part = (key, f, c, x, y, z, parent) => { const m = new THREE.Mesh(pgeo(key, f), mat(c)); m.position.set(x, y, z); m.userData.ns = 1; parent.add(m); return m; };
  const ballG = () => new THREE.SphereGeometry(1, 12, 8);
  if (d === 1) { // 모자
    part('dDome', () => new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), 0xe03131, 0, 0.13, 0.01, headG).scale.set(R * 1.24, R * 1.02, R * 1.24);
    const br = part('dBrim', () => new THREE.CylinderGeometry(0.2, 0.2, 0.03, 14), 0xc92a2a, 0, 0.14, R * 1.1, headG); br.scale.set(1.1, 1, 0.9); br.rotation.x = 0.14;
    part('dBall', ballG, 0xffffff, 0, 0.13 + R * 1.02, 0.01, headG).scale.setScalar(0.04);
  } else if (d === 2) { // 가방
    part('dPack', () => new THREE.BoxGeometry(0.38, 0.44, 0.18), 0x339af0, 0, 1.1, -(sh * 0.85 + 0.085), g);
    part('dPocket', () => new THREE.BoxGeometry(0.27, 0.17, 0.06), 0x1864ab, 0, 1.01, -(sh * 0.85 + 0.2), g);
    part('dFlap', () => new THREE.BoxGeometry(0.39, 0.1, 0.19), 0xffd43b, 0, 1.3, -(sh * 0.85 + 0.085), g);
  } else if (d === 3) { // 풍선 (허리에 묶어서 왼쪽 어깨 위로 떠 있어요)
    const a = new THREE.Vector3(0.24, 1.15, -0.16), b = new THREE.Vector3(0.52, 2.38, -0.34), dir = b.clone().sub(a);
    const st = part('dString', () => new THREE.CylinderGeometry(0.008, 0.008, 1, 5), 0xf1f3f5, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, g);
    st.scale.y = dir.length(); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    part('dBall', ballG, 0xff6b6b, b.x + 0.03, b.y + 0.25, b.z - 0.03, g).scale.set(0.22, 0.27, 0.22);
    part('dKnot', () => new THREE.ConeGeometry(0.035, 0.06, 6), 0xe03131, b.x, b.y, b.z, g);
  } else if (d === 4) { // 왕관
    const y = R * 0.9;
    const rg = part('dRing', () => new THREE.TorusGeometry(0.18, 0.035, 6, 16), 0xffc233, 0, y, -0.01, headG); rg.rotation.x = Math.PI / 2; rg.scale.set(1, 1, 1.5);
    for (let i = 0; i < 5; i++) { const an = i * Math.PI * 2 / 5; part('dSpike', () => new THREE.ConeGeometry(0.05, 0.13, 6), 0xffc233, Math.sin(an) * 0.18, y + 0.1, Math.cos(an) * 0.18 - 0.01, headG); part('dBall', ballG, i % 2 ? 0x4dabf7 : 0xe03131, Math.sin(an) * 0.18, y + 0.175, Math.cos(an) * 0.18 - 0.01, headG).scale.setScalar(0.026); }
  } else if (d === 5) { // 나비 날개
    for (const sd of [-1, 1]) {
      const up = part('dBall', ballG, 0xf783ac, sd * 0.36, 1.4, -(sh * 0.85 + 0.07), g); up.scale.set(0.3, 0.36, 0.035); up.rotation.set(0, sd * -0.25, sd * -0.5);
      const dn = part('dBall', ballG, 0xb197fc, sd * 0.27, 1.02, -(sh * 0.85 + 0.06), g); dn.scale.set(0.19, 0.23, 0.035); dn.rotation.set(0, sd * -0.25, sd * 0.45);
      part('dBall', ballG, 0xffffff, sd * 0.4, 1.46, -(sh * 0.85 + 0.12), g).scale.set(0.07, 0.09, 0.02);
    }
  }
}
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
  if (o0.deco) decoParts(o0.deco | 0, g, headG, R, sh);
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
  const tag = bubbleSprite(o.name, 0.38 / s); tag.position.y = 2.3 + (o.hat ? 0.4 : 0); g.add(tag);
  const mark = textSprite('!', 0.5 / s, { fs: 70, bg: '#ffd43b', fg: '#c92a2a', border: '#c92a2a', pad: 18 });
  mark.position.y = 2.75 + (o.hat ? 0.4 : 0); mark.visible = false; mark.userData.baseY = mark.position.y; g.add(mark);
  g.userData.mark = mark; g.userData.tag = tag;
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
{ const s = textPlane('Seoul Hanok Stay 🏯\nBus Number 5 → Park', 0.9, { fs: 46, bg: '#fff9db', fg: '#5c3d2e', border: '#c92a2a' }); s.position.set(-15.4, 2.2, 25.6); } // x -16 → -15.4: 자동 창문이 포스터 오른쪽 끝에 딱 붙어 생겨서, 포스터가 그 자리까지 차지하게 옮겼어요
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

// ---------- 거리 소품 (v2.1) ----------
// 길 안내 미션에 힌트가 되지 않게, 어느 건물인지 알려 주는 소품·방향 표지판은 두지 않아요.
// 정류장 표지: 실제로 탈 수 있는 정류장(노란 바닥)의 왼쪽 끝에만 세워요. (병원 정류장은 Woman 자리라 비워 둠)
// 엔진 busStop 은 앞뒤 모두 BUS 글자가 있어요.
for (const id of ['market', 'library', 'bank', 'park', 'school']) { const [x, z] = STOP[id].pad; busStop(x - 2.2, z); }
prop(hydrant, 5.7, 15.7); prop(hydrant, 5.8, -27.8);
prop(mailbox, -24.4, 16.6, Math.PI / 2); prop(mailbox, 5.6, 22.5, -Math.PI / 2, 0x1c7ed6);
prop(bike, -19.6, -28.4, 0.3); prop(bike, 25.8, 16.8, -0.2, 0xe03131);
prop(parasolTable, -18.5, -37.5, 0xff922b); prop(parasolTable, -35.5, -35.5, 0x4dabf7);
prop(binTrio, -8.2, 37.4);
prop(flagPole, -12.6, 44.2, 0x1c7ed6);
prop(balloons, 22.3, 28.3); prop(balloons, 22.3, 41.7, [0x51cf66, 0xffd43b, 0xda77f2]);

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

// ---------- 그림 같은 화풍: 붓으로 칠한 들판·길·벽·지붕·물·하늘 (엔진 PAINT, ?noart 로 끄기) ----------
PAINT.apply({ sky: 'peach', floor: { 0xd9d4c7: 'tile' } });

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
// ----- 보는 방법 세 가지: 3D 내 캐릭터 보기(3인칭) / 2.5D 위에서 보기(쿼터뷰) / 내 눈으로 보기(1인칭). V 키나 🎥 버튼으로 바꿔요 -----
// CAM.third 는 '내 캐릭터가 보이는가'(3D·2.5D 둘 다 true), CAM.iso 는 2.5D 인가
const CAM = { third: true, iso: false, isoK: 0, isoYaw: Math.PI / 4, isoT: 9, isoAge: 0, tx: null, tz: 0, hid: new Set(), pin: null, d: 4, side: 0, zoom: 0, talkN: null, turn: 0, me: null, key: '', face: Math.PI, lx: 0, lz: 0, still: 0 };
try { const q = String(new URLSearchParams(location.search).get('cam') || localStorage.getItem('english3d_view') || ''); if (q === '1') CAM.third = false; else if (q === 'iso') CAM.iso = true; } catch (e) {}
const camBtn = document.createElement('button'); camBtn.id = 'camBtn'; camBtn.title = '보는 방법 바꾸기 (V)';
const camLabel = () => { camBtn.textContent = CAM.iso ? '🗺️ 2.5D' : CAM.third ? '🎥 3D' : '👀 내 눈'; };
function isoRestore() { for (const o of CAM.hid) { o.visible = true; o.userData.isoHid = 0; } CAM.hid.clear(); }
function toggleView() {
  // 3D → 2.5D → 내 눈 → 3D
  if (CAM.iso) { CAM.iso = false; CAM.third = false; isoRestore(); P.pitch = 0; }
  else if (CAM.third) { CAM.iso = true; CAM.isoK = Math.round((P.yaw - Math.PI / 4) / (Math.PI / 2)); CAM.isoYaw = Math.PI / 4 + CAM.isoK * Math.PI / 2; CAM.tx = null; CAM.isoAge = 0; CAMOCC.t = 9; if (document.pointerLockElement) document.exitPointerLock(); }
  else { CAM.third = true; }
  camLabel();
  try { localStorage.setItem('english3d_view', CAM.iso ? 'iso' : CAM.third ? '3' : '1'); } catch (e) {}
  try { toast(CAM.iso ? '🗺️ <b>2.5D</b> 위에서 내려다봐요<br><small>W A S D 로 걷고, Q 로 화면을 돌려요 · V 로 바꾸기</small>' : CAM.third ? '🎥 <b>3D</b> 내 캐릭터 뒤에서 봐요 (V 로 바꾸기)' : '👀 내 눈으로 봐요 (V 로 바꾸기)', 3200); } catch (e) {}
}
// 2.5D: Q(또는 ←/→)로 화면을 90도씩 돌려요
const isoBlink = document.createElement('div'); isoBlink.style.cssText = 'position:fixed;inset:0;background:#1d3557;opacity:0;pointer-events:none;z-index:3;transition:opacity .22s';
document.body.appendChild(isoBlink);
function isoTurn(k) { CAM.isoK += k; CAM.isoYaw = Math.PI / 4 + CAM.isoK * Math.PI / 2; isoBlink.style.transition = 'none'; isoBlink.style.opacity = '.45'; requestAnimationFrame(() => { isoBlink.style.transition = 'opacity .22s'; isoBlink.style.opacity = '0'; }); }
addEventListener('keydown', (e) => { if (!CAM.iso || dlgOpen || e.repeat || (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT'))) return; if (e.code === 'KeyQ' || e.code === 'ArrowLeft') isoTurn(1); else if (e.code === 'ArrowRight') isoTurn(-1); });
// 2.5D: 머리 위를 덮는 것(지붕·나뭇잎·차양)은 그 밑에 있는 동안 숨겨서 안이 보이게 해요
function isoTick(dt) {
  if ((CAM.isoT += dt) < 0.12) return; CAM.isoT = 0;
  const now = new Set();
  try {
    camRay.ray.origin.set(P.x, P.jy + 1.9, P.z); camRay.ray.direction.set(0, 1, 0); camRay.near = 0; camRay.far = 14;
    for (const h of camRay.intersectObjects(CAMOCC.list, false)) {
      let ok = true; for (let a = h.object; a; a = a.parent) if ((!a.visible && !a.userData.isoHid) || a.userData.halo) { ok = false; break; }
      if (ok) now.add(h.object);
    }
    // 카메라와 나 사이를 가리는 지붕·나뭇잎·차양(땅에 닿지 않은 것)도 숨겨요. 벽은 그대로 두고 머리 위 ▼ 로 자리를 알려 줘요
    const o0 = camera.position, dx = P.x - o0.x, dy = 0.35 - o0.y, dz = P.z - o0.z, len = Math.hypot(dx, dy, dz); // 발끝까지 보이게 발 쪽으로 쏴요
    camRay.ray.origin.copy(o0); camRay.ray.direction.set(dx / len, dy / len, dz / len); camRay.near = 0; camRay.far = len - 0.4;
    for (const h of camRay.intersectObjects(CAMOCC.list, false)) {
      if (!(h.object.userData.camLowY >= 1.2)) continue;
      let ok = true; for (let a = h.object; a; a = a.parent) if ((!a.visible && !a.userData.isoHid) || a.userData.halo) { ok = false; break; }
      if (ok) now.add(h.object);
    }
  } catch (e) {}
  for (const o of CAM.hid) if (!now.has(o)) { o.visible = true; o.userData.isoHid = 0; CAM.hid.delete(o); }
  for (const o of now) if (!CAM.hid.has(o)) { o.visible = false; o.userData.isoHid = 1; CAM.hid.add(o); }
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
        if (!skip) { camB3.setFromObject(o); const w = camB3.max.x - camB3.min.x, d = camB3.max.z - camB3.min.z; big = w >= 1 && d >= 1 && w < 60 && d < 60 && camB3.max.y > 1.7 ? 1 : 0; o.userData.camLowY = camB3.min.y; }
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
const camPerson = (ppl, x, z) => { for (const n of ppl) { if (n.follow || n.inLine || !n.g.visible) continue; /* 내 뒤에 줄 서서 따라오는 친구(inLine)는 카메라를 당기지 않아요 */ const q = n.g.position; if (Math.abs(q.x - x) < 0.5 && Math.abs(q.z - z) < 0.5) return true; } return false; };
function camTick(dt, t) {
  dt = Math.max(0, Math.min(0.1, dt || 0));
  if (window.PLAY && window.PLAY.cam(dt, t)) return; // 놀이 층: 비행기를 타는 동안은 카메라가 비행기를 따라가요
  const walkIn = Math.min(1, Math.hypot(touch.mx, touch.mz) + (keys.KeyW || keys.KeyS || keys.ArrowUp ? 1 : 0));
  // 말을 걸면 처음 잠깐 상대 쪽으로 돌아봐요. 3인칭이면 얼굴이 대화 상자에 가리지 않게 내 눈높이까지 다가가요.
  const talkN = started && dlgOpen && nearNPC && nearNPC.g.visible ? nearNPC : null;
  if (talkN !== CAM.talkN) { CAM.talkN = talkN; CAM.turn = talkN ? 0.9 : 0; }
  if (CAM.iso) { // 2.5D: 화면 방향은 고정(Q 로만 돌려요). 걷는 방향은 화면 기준이에요
    CAM.isoYaw = Math.PI / 4 + CAM.isoK * Math.PI / 2;
    P.yaw = CAM.isoYaw; P.pitch = 0; CAM.turn = 0;
  }
  if (talkN && CAM.turn > 0) {
    CAM.turn -= dt; const q = talkN.g.position, k = Math.min(1, dt * 5);
    let dy = Math.atan2(-(q.x - P.x), -(q.z - P.z)) - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    P.yaw += dy * k; P.pitch += (-0.04 - P.pitch) * k;
  }
  CAM.zoom += ((talkN && !CAM.iso ? 1 : 0) - CAM.zoom) * Math.min(1, dt * 6);
  if (!CAM.third) {
    if (CAM.me) CAM.me.visible = false;
    camera.position.set(P.x, P.jy + 1.6 + (started ? Math.sin(t * 9) * 0.02 * walkIn : 0), P.z);
    camera.rotation.y = P.yaw; camera.rotation.x = P.pitch; return;
  }
  // 내 캐릭터
  const meLook = avatarKey(), key = meLook + ':' + avatarDeco;
  if (!CAM.me || CAM.key !== key) {
    if (CAM.me) scene.remove(CAM.me);
    const g = makePerson({ name: '나', look: meLook, deco: avatarDeco, adult: false }); g.userData.tag.visible = false; g.userData.mark.visible = false;
    scene.add(g); CAM.me = g; CAM.key = key; CAM.face = P.yaw + Math.PI; CAM.lx = P.x; CAM.lz = P.z;
  }
  const g = CAM.me, mx = P.x - CAM.lx, mz = P.z - CAM.lz, step = Math.hypot(mx, mz); CAM.lx = P.x; CAM.lz = P.z;
  let face = P.yaw + Math.PI, look = null; // 가만히 있으면 앞(카메라가 보는 쪽)을 봐요
  CAM.still = step > 0.004 && step < 1 ? 0 : CAM.still + dt;
  if (dlgOpen && nearNPC && nearNPC.g.visible) { const q = nearNPC.g.position; face = Math.atan2(q.x - P.x, q.z - P.z); look = [q.x, q.z]; } // 말할 때는 상대를 봐요
  else if (CAM.still < 0.25 && step > 0.004 && step < 1) face = Math.atan2(mx, mz); // 걸을 때는 가는 쪽을 봐요
  else if (CAM.still < 0.25 || CAM.iso) face = CAM.face;
  let df = face - CAM.face; df = Math.atan2(Math.sin(df), Math.cos(df)); CAM.face += df * Math.min(1, dt * 10);
  g.position.set(P.x, P.jy, P.z); g.rotation.y = CAM.face;
  let speaking = false; try { speaking = dlgOpen && ui.who.textContent === '나' && !!(window.speechSynthesis && speechSynthesis.speaking); } catch (e) {}
  animatePerson(g, t, dt, { run: running, air: P.jy > 0.02, talk: speaking, look });
  if (CAM.iso) CAM.isoAge += dt;
  if ((CAMOCC.t += dt) > (CAM.iso && CAM.isoAge < 4 ? 0.3 : 2)) { CAMOCC.t = 0; try { CAMOCC.list = camOccList(); } catch (e) { CAMOCC.list = []; } }
  if (CAM.iso) { // 2.5D: 높은 곳에서 비스듬히 내려다봐요. 멀미가 덜 나게 만든 보기예요:
    //  · 화면 방향·높이·화각이 변하지 않아요(점프해도, 달려도, 대화가 열려도 그대로)
    //  · 조금 움직일 때는 화면이 따라오지 않고(가운데 1.3m 안), 멀리 갈 때만 부드럽게 따라와요
    //  · 내 캐릭터는 화면 가운데보다 조금 위에 있어서 대화 상자가 떠도 화면을 옮길 필요가 없어요
    const pit = -0.98, dist = 30, cp = Math.cos(pit), sp = Math.sin(pit), sy = Math.sin(P.yaw), cy = Math.cos(P.yaw), DZ = 1.3;
    if (CAM.tx === null || Math.hypot(P.x - CAM.tx, P.z - CAM.tz) > 9) { CAM.tx = P.x; CAM.tz = P.z; } // 처음이거나 순간 이동했으면 바로 맞춰요
    const ex = P.x - CAM.tx, ez = P.z - CAM.tz, el = Math.hypot(ex, ez);
    if (el > DZ) { const k = (el - DZ) / el * Math.min(1, dt * 9); CAM.tx += ex * k; CAM.tz += ez * k; }
    const tx = CAM.tx + sy * 2.2, tz = CAM.tz + cy * 2.2;
    camera.position.set(tx + sy * cp * dist, 1 - sp * dist, tz + cy * cp * dist);
    camera.rotation.y = P.yaw; camera.rotation.x = pit;
    g.visible = true;
    if (!CAM.pin) { try { const s = textSprite('▼', 0.5, { fs: 60, bg: null, fg: '#ff3b6b' }); s.material.depthTest = false; s.material.depthWrite = false; s.renderOrder = 999; s.position.y = 2.85; s.userData.pol = 1; s.material.toneMapped = false; CAM.pin = s; } catch (e) {} }
    if (CAM.pin) { if (CAM.pin.parent !== g) g.add(CAM.pin); CAM.pin.visible = true; CAM.pin.position.y = 2.85 + Math.sin(t * 4) * 0.08; }
    isoTick(dt);
    return;
  }
  if (CAM.pin) CAM.pin.visible = false;
  // 카메라: 머리 위 뒤쪽에서 오른쪽 어깨 너머로 봐요(앞사람이 내 캐릭터에 가리지 않게). 벽·천장·바닥을 뚫지 않게 당겨 와요
  const py = P.jy + 2.3 - 0.68 * CAM.zoom, cp = Math.cos(P.pitch), sp = Math.sin(P.pitch), hx = Math.sin(P.yaw) * cp, hz = Math.cos(P.yaw) * cp;
  let want = 4 * (1 - CAM.zoom);
  if (sp < -0.02) want = Math.min(want, (3.15 - py) / -sp);
  if (sp > 0.02) want = Math.min(want, (py - 0.4) / sp);
  let free = want; const ppl = Object.values(NPC);
  for (let d = 0.2; d <= want + 0.3; d += 0.12) { const x = P.x + hx * d, z = P.z + hz * d; if (camBlocked(x, z) || camPerson(ppl, x, z)) { free = Math.max(0, d - 0.4); break; } }
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
          if (first) { S.tries++; S.streak = 0; save(); fire('miss', { stage: S.stage }); } first = false;
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
// 다음 대사로: 읽던 소리를 멈추고 바로 넘어가요 (말이 다 끝날 때까지 기다리지 않아요)
function skipLine() { if (!dlgNextFn || !ui.dlg.classList.contains('show')) return false; try { speechSynthesis.cancel(); } catch (e) {} const f = dlgNextFn; f(); return true; }
ui.next.onclick = (e) => { if (e) e.stopPropagation(); skipLine(); };
// 대화 상자의 빈 곳이나 글자를 눌러도 넘어가요 (단추·보기는 그대로)
ui.dlg.addEventListener('click', (e) => { if (e.target.closest('button, a, input, select, label')) return; skipLine(); });
// 대화가 떠 있을 때 화면(3D)을 눌러도 넘어가요
let downInDlg = false; // 말을 거는 그 클릭이 첫 대사를 바로 넘기지 않게: 대화가 떠 있을 때 누른 것만 넘겨요
canvas.addEventListener('pointerdown', () => { downInDlg = dlgOpen && !!dlgNextFn && ui.dlg.classList.contains('show'); });
canvas.addEventListener('pointerup', () => { if (downInDlg && dlgOpen && dlgNextFn && !dlgChoiceKeys && ui.dlg.classList.contains('show')) skipLine(); downInDlg = false; });
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
// 지금 서 있는 정류장(노란 바닥) 이름. 없으면 null
const stopUnder = () => { for (const z of zones) if (z.type === 'stop' && inRect(z)) return z.id; return null; };
const RIDE_FIRST = '🚏 먼저 <b>정류장</b>(노란 바닥)에서 들은 대로 버스·지하철을 타고 내려야 해요!';
function setRide(r) {
  stageState.ride = r;
  r.pad = stopUnder(); // 고침: 정류장 위에 선 채로 탈것이 정해지면(구역은 들어서는 순간에만 불려요) 나갔다 와야만 탈 수 있었어요 → goalTick 이 한 번 불러 줘요
  stageState.early = r.early ? { ids: r.early, msg: RIDE_FIRST } : null; // 고침: 타기 전에 목적지로 걸어가면 아무 반응이 없던 것 → 안내 한 줄
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
    stageState.ride = null; stageState.early = null; closeDlg();
    rideTo(r.stop, icon);
    if (r.then) await r.then();
  });
}
// ---------- 목적지 도착 확인 ----------
function goTo(id, text, pos, onArrive, opt) { stageState.goal = { id, rect: PL[id] || STALL[id], onArrive }; stageState.early = null; setObj(text, pos, opt); }
function goalTick() {
  if (!started) return;
  const g = stageState.goal;
  // 고침: 정류장 위에 선 채로 탈것이 정해졌으면, 대화가 끝난 뒤 그 자리에서 바로 타는 질문을 띄워요 (나갔다 들어오지 않아도 되게)
  const rd = stageState.ride;
  if (rd && rd.pad && !dlgOpen && !busy) { const id = rd.pad; rd.pad = null; if (stopUnder() === id) { onStop(id); return; } }
  let cur = null;
  for (const r of Object.values(STALL)) if (inRect(r)) cur = r;
  if (!cur) for (const r of Object.values(PL)) if (inRect(r)) { cur = r; break; }
  if (cur !== rectNow) {
    rectNow = cur;
    const e = stageState.early, h = stageState.hidden && stageState.hidden[cur && cur.id];
    if (cur && g && cur.id !== g.id && !dlgOpen) {
      // 고침: 아직 이름표를 안 붙인 ❓ 건물에 잘못 가면 건물 이름이 그대로 나와 다음 스티커의 답을 알려 주던 것
      if (h && h[0].visible) toast('여기는 다른 <b>❓ 건물</b>이에요. 길 안내를 다시 생각해 보세요. 🤔', 2600);
      else toast(`여기는 <b>${cur.name}</b> (${cur.ko})예요. 길 안내를 다시 생각해 보세요. 🤔`, 2600);
    } else if (cur && !g && e && e.ids.includes(cur.id) && !dlgOpen) toast(e.msg, 3200); // 고침: 아직 갈 차례가 아닌 목적지에 먼저 오면 조용히 무시되던 것 → 안내 한 줄
  }
  if (g && !dlgOpen && !busy && inRect(g.rect)) { stageState.goal = null; beep('star'); run(g.onArrive); }
}
const refPos = (id) => () => { const p = PL[id] || STALL[id]; return p.door ? p.door : [p.x, p.cz !== undefined ? p.cz : p.z]; }; // 기준 건물의 문 앞

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
    setRide({ line: F.line, stop: F.stop, stopLabel: F.stopLabel, say: F.answer, early: ['climbing'], then: s1arrive });
  };
}
async function s1arrive() {
  const F = L.funTalk1;
  setObj('🙋 정류장 옆의 <b>아저씨(Man)</b>가 길을 물어요', npcAt('passer')); mark('passer');
  stageState.early = { ids: ['climbing'], msg: '🙋 먼저 정류장 옆의 <b>아저씨(Man)</b>에게 가 보세요!' }; // 고침: 아저씨를 건너뛰고 클라이밍 센터에 먼저 가면 아무 반응이 없던 것 → 안내 한 줄
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
    await say('', '', '🗺 Play Together 1 · 지도 완성하기: 이름표 없는 ❓ 건물 3곳에 스티커를 붙여요. 길 안내를 듣고 버스·지하철을 타고 가요!', { btn: '좋아요!' });
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
  setRide({ line: m.line, stop: m.stop, stopLabel: m.stopLabel, say: dir, early: L.mapGame.slice(stageState.mi).map(x => x.place), then: async () => { // early: 아직 이름표를 안 붙인 ❓ 건물 모두(어느 건물이 맞는지는 알려 주지 않아요)
    goTo(m.place, `🏷️ 정류장 바로 옆 <b>❓ 건물</b>에 <b>${m.name}</b> 스티커를 붙여요`, refPos(m.place), async () => {
      stageState.hidden[m.place].forEach(o => o.visible = false); held = null; refreshHUD(); good();
      toast(`🏷️ <b>${PL[m.place].name}</b> 스티커를 붙였어요! (${stageState.mi + 1}/${L.mapGame.length})`, 2600);
      await say('나', `This is the ${m.name}!`, `여기가 ${PL[m.place].ko}이에요!`);
      stageState.mi++;
      if (stageState.mi < L.mapGame.length) await mapRound();
      else { await say('Ms. Park', 'You completed the town map. Great job!', '📱 마을 지도를 완성했어요. 정말 잘했어요!'); nextStage(); }
    }, { area: 12 });
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
    setRide({ line: F.line, stop: F.stop, stopLabel: F.stopLabel, say: F.answer, early: ['airmuseum'], onBoard: subwayScene, then: s3lost });
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
  stageState.early = { ids: ['airmuseum'], msg: '🤔 먼저 정류장 옆의 <b>Woman</b>에게 길을 물어봐요!' }; // 고침: Woman 을 건너뛰고 박물관에 먼저 가면 아무 반응이 없던 것 → 안내 한 줄
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
  setRide({ line: f.line, stop: f.stop, stopLabel: f.stopLabel, say: dir, early: [f.place], then: async () => {
    goTo(f.place, `📍 <b>${f.where}</b> ${S.koHelp ? '(' + f.ko + ')' : ''} — 찾을 곳: <b>${f.name}</b>`, refPos(f.ref), async () => {
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
    goTo('help1', '❓ <b>아이스크림 가게 앞</b>의 Help Desk로 할머니를 안내해요', () => STALL.ice.door, s5help);
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
    if (!NAME_OK.test(c.name)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
    if (c.prep === 'between' && c.n1 === c.n2) { toast('between 뒤의 두 장소를 서로 다르게 골라 주세요.'); return; }
    if (c.from === c.to) { toast('여는 요일 두 개를 서로 다르게 골라 주세요.'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('체크리스트를 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    speak(letterText(c).join(' '), '나');
    await say('Mina', "Great writing! Now I want to go there.", '멋진 글이야! 나도 거기 가 보고 싶어.', { speak: false });
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
  if (!dlgOpen && !busy && started && window.PLAY && window.PLAY.interact(nearNPC)) return; // 놀이 층: 물건 타기·쓰기 (미션 친구가 먼저예요)
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
    if (['Space', 'Enter', 'KeyE'].includes(e.code) && dlgNextFn && ui.dlg.classList.contains('show')) { e.preventDefault(); skipLine(); }
    if (dlgChoiceKeys && /^Digit[1-6]$/.test(e.code)) { const b = dlgChoiceKeys[+e.code.slice(5) - 1]; if (b) b.click(); }
    if (e.code === 'KeyR' && lastSpeech) speak(...lastSpeech);
    return;
  }
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'Space') jump(); // 스페이스는 점프만 해요 (말 걸기는 E·Enter·클릭)
  else if (['KeyE', 'Enter'].includes(e.code)) interact();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
let drag = null;
canvas.addEventListener('mousedown', (e) => {
  if (!started || dlgOpen) return;
  if (locked) { interact(); return; }
  drag = { x: e.clientX, y: e.clientY, moved: 0 };
});
addEventListener('mouseup', (e) => {
  if (drag && drag.moved < 5 && !dlgOpen && started && !isTouch && !CAM.iso) { try { canvas.requestPointerLock(); } catch (er) {} }
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
$('#actBtn').addEventListener('click', () => { if (dlgOpen) { skipLine(); return; } interact(); }); // 대화 중에는 '다음'
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
// 도움말: 대화 중에 열었으면 닫을 때 그 대화로 돌아가요 (전에는 대화가 사라져서 그 뒤로 말을 걸 수 없었어요)
$('#helpBtn').onclick = () => { const h = $('#help'); h.dataset.was = !dlgOpen ? '' : ui.dlg.classList.contains('show') ? 'dlg' : 'other'; h.classList.add('show'); if (!dlgOpen) openDlg(); ui.dlg.classList.remove('show'); if (document.pointerLockElement) document.exitPointerLock(); };
$('#helpClose').onclick = () => { const h = $('#help'); h.classList.remove('show'); if (h.dataset.was === 'dlg') ui.dlg.classList.add('show'); else if (!h.dataset.was) closeDlg(); };
$('#mapBtn').onclick = () => { $('#mapBox').classList.toggle('show'); };

// ---------------- 지도 ----------------
const mapC = $('#mapCanvas'), mctx = mapC.getContext('2d');
function drawMap() {
  if (!$('#mapBox').classList.contains('show') && !MINI.on) return;
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
  if (window.PLAY) window.PLAY.map(mctx, tx, tz); // 놀이 층: 놀이 기구 자리
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
  const play = window.PLAY; // 놀이 층: 타고 있는 동안은 걷지 않아요
  if (started && !dlgOpen && !(play && play.drive(dt, t))) {
    let fx = 0, fz = 0;
    if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1;
    if (keys.KeyA) fx -= 1; if (keys.KeyD) fx += 1;
    if (keys.ArrowLeft) P.yaw += 2.2 * dt; if (keys.ArrowRight) P.yaw -= 2.2 * dt;
    if (keys.KeyQ) P.yaw += 2.2 * dt;
    fz -= touch.mz; fx += touch.mx;
    const len = Math.hypot(fx, fz);
    running = len > 0 && !!(keys.ShiftLeft || keys.ShiftRight);
    if (len > 0) {
      const k = Math.min(1, len) / len * SPEED * (keys.ShiftLeft || keys.ShiftRight ? 1.7 : 1) * (play ? play.speed : 1) * dt;
      const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      P.x += (-sy * fz + cy * fx) * k; P.z += (-cy * fz - sy * fx) * k;
    }
    collide();
  } else running = false;
  if (P.jy > 0) { P.jy += P.vy * dt; P.vy -= 15 * dt; if (P.jy <= 0) { P.jy = 0; P.vy = 0; } }
  const fovT = CAM.iso ? 30 : running ? 77 : 70; if (Math.abs(camera.fov - fovT) > 0.05) { if (CAM.iso || camera.fov < 60) camera.fov = fovT; else camera.fov += (fovT - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix(); }
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
    { const tg = g.userData.tag; if (tg && !n.hideTag) tg.visible = g.position.distanceTo(camera.position) > 3.6; } // 카메라 바로 앞 사람의 이름표는 화면을 크게 가려서 숨겨요
    const m = g.userData.mark; if (m.visible) m.position.y = (m.userData.baseY || 2.75) + Math.sin(t * 4) * 0.1;
    const sc = d - (m.visible ? 3 : n.talk ? 1.2 : 0); // ❗ 붙은 미션 친구가 가장 먼저, 그다음 할 말이 있는 친구
    if (g.visible && d < 3.0 && sc < nd) { nd = sc; nearNPC = n; }
  }
  if (nearNPC && started && !dlgOpen) {
    if (ui.prompt.style.display !== 'block') ui.prompt.style.display = 'block';
    const ph = (isTouch ? '👆 ' : '<b>E</b> ') + nearNPC.name + (nearNPC.talk ? '에게 말 걸기 ❗' : '에게 말 걸기');
    if (ui.prompt._h !== ph) { ui.prompt._h = ph; ui.prompt.innerHTML = ph; }
  } else if (ui.prompt.style.display !== 'none') { ui.prompt.style.display = 'none'; ui.prompt._h = ''; }
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
      ui.arrow.style.display = back ? 'none' : 'block'; ui.arrow.style.transform = `rotate(${-rel}rad)`; setDist((back ? '↩ 뒤쪽 ' : '') + '🔍 ' + Math.round(Math.max(1, Math.max(d, nav.len) - aR)) + 'm');
    } else { NAV.line = null; ui.arrow.style.display = 'none'; setDist(objective.t > 30 ? '🔍 고리가 줄어들어요' : '🔍 이 근처!'); }
  } else if (p && started) {
    beaconFit(p, dt);
    beacon.visible = BK.show; beacon.position.set(p[0], BK.y + Math.sin(t * 3) * 0.15, p[1]); beacon.rotation.y = t * 2;
    const d = Math.hypot(p[0] - P.x, p[1] - P.z), nav = navTick(dt, p);
    const aim = nav.pts[1], dx = aim[0] - P.x, dz = aim[1] - P.z; // 다음 꺾이는 곳을 가리켜요
    const ty = Math.atan2(-dx, -dz); let rel = ty - P.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    const back = Math.abs(rel) > 1.9; // 뒤쪽이면 위 화살표 대신 글로 알려요
    ui.arrow.style.display = back ? 'none' : 'block'; ui.arrow.style.transform = `rotate(${-rel}rad)`; setDist(d < 3 ? '도착!' : (back ? '↩ 뒤쪽 ' : '') + Math.round(Math.max(d, nav.len)) + 'm');
    guideTick(t, p, d, rel, nav);
  } else { NAV.line = null; guideTick(t, null, 0, 0, null); beacon.visible = false; ui.arrow.style.display = 'none'; setDist(''); }
  if (window.MULTI) window.MULTI.tick(dt, t); // 함께 하기: 친구 아바타
  { const ms = performance.now(); if (ms - mapTick > (GFX.lite ? 200 : 100)) { mapTick = ms; drawMap(); miniDraw(); } } // 지도: 실제 시간으로 1초에 10번 (가볍게 그릴 때는 5번). 장면이 느려도 늦지 않게
  skinTick(dt);
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
  if (reset) { // 처음부터: 진행(단계·점수·맞힌 수)만 지우고, 모은 것(별·최고 연속·메달·보석·카드·코인·반)은 그대로 둬요
    const fin = S.stage >= STAGES.length - 1;
    const keep = { koHelp: S.koHelp, rate: S.rate, medals: Array.isArray(S.medals) ? S.medals : [], stars: S.stars | 0, best: S.best | 0, gems: S.gems | 0, card: S.card || null, th: Array.isArray(S.th) ? S.th : [], done: (S.done | 0) + (fin ? 1 : 0) };
    if (S.cls != null) keep.cls = S.cls;
    S = Object.assign(fresh(), keep); save();
  }
  $('#title').classList.remove('show'); started = true;
  P.x = 0; P.z = 40; P.yaw = 0; P.pitch = 0;
  startStage(S.stage);
  track('start', { stage: S.stage });
  setInterval(() => track('state', { stage: S.stage, stars: S.stars, correct: S.correct, tries: S.tries, best: S.best }), 30000);
  NPC.bonus.talk = bethTalk;
  if (S.stage === 0) showBanner(STAGES[0].title, isTouch ? '왼쪽 화면을 밀어 걷기 · 오른쪽 화면을 밀어 둘러보기 · 말 걸기 단추' : '마우스 클릭 → 화면 돌리기 · W A S D 이동 · E 말 걸기');
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
      const m = /^L(\d+)$/.exec(a.dataset.l || a.textContent.trim()); if (!m) return; const extra = !!a.dataset.l; /* data-l: 영어 단원이 아닌 곁들이 단원(롯데월드 안전) */
      let s = null; try { s = JSON.parse(localStorage.getItem('english3d_l' + m[1] + '_v1')); } catch (e) {}
      if (!s) return;
      if (!extra) total += s.stars || 0;
      if (s.stage >= 6) { if (!extra) done++; a.classList.add('done'); a.textContent += ' ✓'; a.title = '끝낸 단원 · 별 ' + (s.stars || 0) + '개'; }
      else if (s.stage > 0 || s.stars > 0) { a.classList.add('ing'); a.title = '미션 ' + (s.stage + 1) + '/6 하는 중 · 별 ' + (s.stars || 0) + '개'; const b = document.createElement('i'); b.style.width = Math.max(12, s.stage / 6 * 100) + '%'; a.appendChild(b); }
    });
    const pick = document.querySelector('.lessonPick');
    if (pick && total > 0) {
      const rank = total < 20 ? '🌱 새싹 탐험가' : total < 60 ? '🥾 씩씩한 탐험가' : total < 120 ? '🧭 영어 모험가' : total < 200 ? '🏅 영어 달인' : '🏆 영어 챔피언';
      const d = document.createElement('div'); d.className = 'myRank'; d.innerHTML = `<b>${rank}</b> · 모은 별 ⭐ ${total}개 · 끝낸 단원 ${done}/12`;
      pick.parentElement.insertBefore(d, pick);
    }
    const ks = document.querySelector('#title .keys'); if (ks) { const d = document.createElement('div'); d.innerHTML = '🎥 <span class="desk"><kbd>V</kbd> 또는 </span>🎥 버튼: 3D ↔ 2.5D(위에서 보기) ↔ 내 눈으로 보기'; ks.insertBefore(d, ks.lastElementChild); }
    const hp = document.querySelector('#help .panel #helpClose');
    if (hp) { const q = document.createElement('p'); q.innerHTML = '⌨️ <b>Space</b> 점프 · <b>Shift</b> 달리기 · <b>V</b> 보는 방법(3D → 2.5D 위에서 보기 → 내 눈으로 보기) · 말 걸기는 <b>E</b> · 화면이 어지러우면 <b>V</b> 를 눌러 <b>2.5D</b> 로 바꿔 보세요 · <b>M</b> 효과음·음악 · <b>G</b> 화질 바꾸기. 두 번 틀리면 정답이 살짝 반짝여요.'; hp.parentElement.insertBefore(q, hp); }
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
  let fin = false; try { fin = started && !L.noPortal && S.stage >= STAGES.length - 1; } catch (e) {}
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
try { const ec = document.querySelector('#end #endClose'); if (ec && !L.noPortal) { const b = document.createElement('button'); b.className = 'big'; b.id = 'endNext'; b.textContent = '🌀 ' + (PORTAL.next === 1 ? '처음 단원' : '다음 단원') + ' Lesson ' + PORTAL.next + ' 로 가기'; b.onclick = portalGo; ec.classList.add('alt'); ec.parentElement.insertBefore(b, ec); } } catch (e) {}
// ---------- 글쓰기 미션: 어떤 이름을 넣어도 제출은 되게 해요 ----------
// 전에는 영어 글자만 받아서 siW00 처럼 숫자가 섞이거나 한글로 쓰면 '완성!'이 눌리지 않았어요.
// 이제 글자·숫자(한글 포함)는 그대로 받고, 화면을 깨뜨릴 수 있는 기호만 지워요. 비어 있으면 Student 로 채워요.
const NAME_OK = /^[\p{L}\p{N} .'_-]{1,24}$/u;
const nameClean = (v) => { const s = String(v == null ? '' : v).replace(/[^\p{L}\p{N} .'_-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24); return s || 'Student'; };
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest ? e.target.closest('#wDone') : null; if (!b) return;
  try {
    document.querySelectorAll('#writer input').forEach(i => { const ty = (i.getAttribute('type') || 'text').toLowerCase(); if (ty === 'text' || ty === 'search') { const v = nameClean(i.value); if (v !== i.value) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } } });
    // 체크리스트: 처음 누를 때는 확인하라고 알려 주고, 한 번 더 누르면 그대로 완성돼요
    const boxes = [...document.querySelectorAll('#writer input[type=checkbox]')];
    if (boxes.some(c => !c.checked)) { b.dataset.tries = String((+b.dataset.tries || 0) + 1); if (+b.dataset.tries >= 2) boxes.forEach(c => { c.checked = true; }); else setTimeout(() => { try { toast('체크리스트를 확인해 보세요 ✅<br><small>한 번 더 누르면 그대로 완성돼요.</small>', 3200); } catch (er) {} }, 50); }
  } catch (er) {}
}, true);
// ---------- 선생님 코드로 미션 건너뛰기 (어딘가에서 막혔을 때 쓰는 비상 단추. 도움말 ❓ 안에 있어요) ----------
try {
  const hc = document.querySelector('#help .panel #helpClose');
  if (hc) {
    const box = document.createElement('div'); box.id = 'skipBox';
    box.innerHTML = '<b>🔑 미션이 막혔나요?</b> 선생님께 받은 코드를 넣으면 지금 미션을 건너뛰어요.<span><input id="skipCode" inputmode="numeric" maxlength="8" placeholder="코드" autocomplete="off"><button type="button" id="skipGo">이 미션 건너뛰기</button></span><i id="skipMsg"></i>';
    hc.parentElement.insertBefore(box, hc);
    const inp = box.querySelector('#skipCode'), msg = box.querySelector('#skipMsg');
    const go = () => {
      const want = String((window.NET_CONFIG && window.NET_CONFIG.skipCode) || '2580'), got = String(inp.value || '').trim();
      if (!got) { msg.textContent = '코드를 넣어 주세요.'; return; }
      if (got !== want) { msg.textContent = '코드가 달라요. 선생님께 다시 물어봐요.'; inp.value = ''; try { beep('bad'); } catch (e) {} return; }
      if (!started) { msg.textContent = '게임을 시작한 뒤에 쓸 수 있어요.'; return; }
      if (S.stage >= STAGES.length - 1) { msg.textContent = '이미 모든 미션을 끝냈어요.'; return; }
      try { track('skip', { stage: S.stage }); } catch (e) {}
      S.stage += 1; save();
      msg.textContent = '⏭ 다음 미션으로 넘어가요…';
      setTimeout(() => { location.href = location.pathname + '?skip=1'; }, 400); // 깨끗한 상태로 다시 열어요
    };
    box.querySelector('#skipGo').onclick = go;
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); });
    inp.addEventListener('keyup', (e) => e.stopPropagation());
  }
} catch (e) {}
// ---------- 3.3 화면 꾸밈: 나침반 알약 · 가볼 곳 목록 · 둥근 작은 지도 · 자판 안내 · 둥근 단추 · 시작 화면 액자 ----------
// 새 계산은 하지 않고, 이미 있는 목표(objective)·길 찾기(NAV)·지도(drawMap)·사람(NPC)을 그대로 보여 줘요.
// 글은 바뀔 때만 쓰고, 목록은 1초에 4번, 작은 지도는 1초에 10번만 다시 그려요.
let distTxt = null;
function setDist(s) { s = String(s).replace(/(\d)m$/, '$1 m'); if (s !== distTxt) { distTxt = s; ui.dist.textContent = s; } }
const MINI = { on: false, el: null, cv: null, ctx: null, W: 0, vig: null };
const SKIN = { t: 9, slow: 9, yaw: 0, key: '', rows: [], name: '', icon: '', objT: null, nameT: '', capT: 0, pre: true };
window.__skin = { MINI, SKIN }; // 개발용: 화면 꾸밈 상태 보기
const skinEl = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const EMO_RE = /^\s*((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*️?)/u;
const plainText = (h) => String(h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
try { // 나침반 알약: [금빛 동그라미 안 바늘] [가는 곳] [거리]
  const nav = $('#nav'), ic = skinEl('div', 'navIc'), em = skinEl('span', 'em'), nm = skinEl('span'); nm.id = 'navName';
  nav.insertBefore(ic, nav.firstChild); ic.appendChild(ui.arrow); ic.appendChild(em); nav.insertBefore(nm, ui.dist); nav.classList.add('off');
  SKIN.nav = nav; SKIN.navEm = em; SKIN.navNm = nm;
} catch (e) {}
// 가볼 곳 목록
const HL = (() => { try { const d = skinEl('div', '', '<div class="hdr"><span>가볼 곳</span><i></i></div><div class="list"></div>'); d.id = 'hl'; document.body.appendChild(d); return { el: d, list: d.querySelector('.list'), cnt: d.querySelector('.hdr i') }; } catch (e) { return null; } })();
// 둥근 작은 지도
try { const d = skinEl('div', '', '<canvas></canvas>'); d.id = 'mini'; document.body.appendChild(d); MINI.el = d; MINI.cv = d.firstChild; MINI.ctx = MINI.cv.getContext('2d'); } catch (e) {}
// 자판 안내 (컴퓨터만): 누른 글쇠가 금빛으로 켜져요
const CAPS = (() => {
  try {
    const lw = lessonNo === 13 || !!window.__lw;
    const k = (id, txt, small, cls = '') => `<div class="k ${cls}" data-k="${id}"><b>${txt}</b><small>${small}</small></div>`;
    const d = skinEl('div', '', `<div class="kr">${k('', '', '', 'gap')}${k('W', 'W', '앞으로')}${k('E', 'E', '말 걸기')}${k('V', 'V', '보기 바꾸기')}</div>`
      + `<div class="kr">${k('A', 'A', '왼쪽')}${k('S', 'S', '뒤로')}${k('D', 'D', '오른쪽')}${k('Shift', 'Shift', lw ? '뛰면 감점' : '달리기')}</div>`
      + `<div class="kr">${k('Space', 'Space', '점프', 'wide')}</div>`);
    d.id = 'keycaps'; document.body.appendChild(d);
    const map = { KeyW: 'W', ArrowUp: 'W', KeyA: 'A', ArrowLeft: 'A', KeyS: 'S', ArrowDown: 'S', KeyD: 'D', ArrowRight: 'D', KeyE: 'E', KeyV: 'V', Space: 'Space', ShiftLeft: 'Shift', ShiftRight: 'Shift' };
    const els = {}; d.querySelectorAll('.k[data-k]').forEach(e => { if (e.dataset.k) els[e.dataset.k] = e; });
    const set = (e, on) => { const id = map[e.code]; if (!id || !els[id]) return; if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return; els[id].classList.toggle('on', on); if (on) { SKIN.capT = 0; d.classList.remove('dim'); } };
    addEventListener('keydown', (e) => set(e, true)); addEventListener('keyup', (e) => set(e, false));
    addEventListener('blur', () => { for (const id in els) els[id].classList.remove('on'); });
    return d;
  } catch (e) { return null; }
})();
// 오른쪽 위 단추: 그림 글자만 동그라미 안에, 이름은 마우스를 올리면(누르면 잠깐) 보여요
const iconize = (b) => {
  if (!b || b.tagName !== 'BUTTON' || b.querySelector(':scope > .ic')) return;
  const txt = (b.textContent || '').trim(), m = EMO_RE.exec(txt);
  const ic = m ? m[1] : (b.id === 'koToggle' ? '가' : txt.slice(0, 1));
  let lb = (m ? txt.slice(m[0].length) : txt).trim();
  if (b.id === 'rateBtn' && lb) lb = '읽는 속도: ' + lb;
  if (!lb) lb = b.id === 'helpBtn' ? '도움말' : (b.title || '').replace(/\s*\(.*\)$/, '');
  b.textContent = ''; const a = skinEl('span', 'ic'), c = skinEl('span', 'lb'); a.textContent = ic; c.textContent = lb; b.appendChild(a); b.appendChild(c);
  b.setAttribute('aria-label', lb);
};
try {
  const bs = document.querySelector('.hud .btns');
  const all = () => bs.querySelectorAll(':scope > button').forEach(iconize); all();
  new MutationObserver(all).observe(bs, { childList: true, subtree: true, characterData: true });
  bs.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button'); if (!b || !isTouch) return; b.classList.add('tipOn'); clearTimeout(b._tip); b._tip = setTimeout(() => b.classList.remove('tipOn'), 1400); });
} catch (e) {}
// 시작 화면: 금빛 액자(속은 비어 있어서 뒤의 3D 장면이 그대로 보여요) + 이름판
try {
  const tp = $('#title .panel');
  if (tp) {
    const fr = skinEl('div', 'tFrame', '<span class="plate"></span>');
    fr.firstChild.textContent = lessonNo === 13 || window.__lw ? 'FIELD TRIP · SAFETY' : 'LESSON ' + lessonNo;
    tp.insertBefore(fr, tp.firstChild); tp.parentElement.classList.add('framed');
  }
  const tt = $('#title'), upd = () => { SKIN.pre = !!(tt && tt.classList.contains('show')); document.body.classList.toggle('pre', SKIN.pre); };
  if (tt) new MutationObserver(upd).observe(tt, { attributes: true, attributeFilter: ['class'] }); upd();
} catch (e) {}
// 목표 글에서 그림 글자와 가는 곳 이름을 뽑아요 ("🏫 <b>선생님</b>께 가요" → 🏫, 선생님)
function objMeta() {
  const raw = objective.text || '', pl = plainText(raw), m = EMO_RE.exec(pl);
  SKIN.icon = m ? m[1] : '📍';
  const b = /<b>(.*?)<\/b>/i.exec(raw);
  SKIN.nameT = b ? plainText(b[1]) : (m ? pl.slice(m[0].length) : pl).trim().slice(0, 16);
}
const npcNear = (x, z, r) => { let best = null, bd = r; for (const n of Object.values(NPC)) { const g = n.g; if (!g.visible) continue; const d = Math.hypot(g.position.x - x, g.position.z - z); if (d < bd) { bd = d; best = n; } } return best; };
const relAng = (x, z) => { let r = Math.atan2(-(x - P.x), -(z - P.z)) - SKIN.yaw; return Math.atan2(Math.sin(r), Math.cos(r)); };
const PLAY_KO = { plane: ['🛩️', '비행기 타기'], swing: ['🎠', '그네'], scooter: ['🛴', '킥보드 타기'], bike: ['🚲', '자전거 타기'], bus: ['🚌', '버스 타기'], carousel: ['🎠', '회전목마'], ball: ['⚽', '공 차기'], balloon: ['🎈', '풍선'], bell: ['🔔', '종 치기'], fountain: ['⛲', '분수'], kite: ['🪁', '연날리기'], fish: ['🎣', '낚시'], hoop: ['🏀', '농구'], chest: ['👑', '보물 상자'], fire: ['🎆', '불꽃놀이'], build: ['🧱', '블록 쌓기'] };
// 롯데월드: 공원 안 이름난 곳 (안전 시설 · 모이는 곳 · 놀이기구)
function lwSpots() {
  const W = window.__lw; if (!W || !W.zone || W.zone() !== 'park') return [];
  const out = [], add = (ic, name, cat, col, p) => { if (p && isFinite(p[0]) && isFinite(p[1])) out.push({ id: 'lw:' + name, ic, name, cat, col, x: p[0], z: p[1] }); };
  try {
    add('🎠', '회전목마', '모이는 곳', '#74c0fc', W.CARO && [W.CARO.x, W.CARO.z]);
    if (W.FAC) { add('ℹ️', '안내 센터', '안전 시설', '#ff8787', W.FAC.info); add('🩹', '의무실', '안전 시설', '#ff8787', W.FAC.aid); add('🧒', '미아 보호소', '안전 시설', '#ff8787', W.FAC.lost); }
    add('🎢', '플라이벤처', '놀이기구', '#b197fc', W.FLY && [W.FLY.x, W.FLY.z]);
    add('🚣', '후룸라이드', '놀이기구', '#b197fc', W.FLUME && [W.FLUME.x, W.FLUME.z]);
    add('🎭', '공연 무대', '공연', '#faa2c1', W.STAGE && [W.STAGE.x, W.STAGE.z]);
    add('🏰', '매직아일랜드', '놀이기구', '#b197fc', W.MI && W.MI.gate);
    add('🍔', '식당', '점심', '#ffa94d', W.FOOD && W.FOOD.ok);
  } catch (e) {}
  return out;
}
function hlCollect(p) {
  const rows = [], gx = p ? (objective.exact ? objective.exact()[0] : p[0]) : 0, gz = p ? (objective.exact ? objective.exact()[1] : p[1]) : 0;
  let gn = null;
  if (p) {
    gn = objective.R && objective.R() ? null : npcNear(gx, gz, 1.6);
    let len = 0; const L0 = NAV.line; if (L0 && L0.length > 1) for (let k = 1; k < L0.length; k++) len += Math.hypot(L0[k][0] - L0[k - 1][0], L0[k][1] - L0[k - 1][1]);
    rows.push({ id: 'goal', goal: 1, ic: SKIN.icon, npc: gn, name: SKIN.name, cat: '지금 가는 곳', col: '#e8c26a', x: p[0], z: p[1], d: Math.max(len, Math.hypot(p[0] - P.x, p[1] - P.z)) });
  }
  const oth = [];
  for (const n of Object.values(NPC)) {
    const g = n.g; if (!g.visible || n === gn || n.follow) continue;
    const mk = g.userData.mark && g.userData.mark.visible; if (!mk && !n.talk) continue;
    const d = Math.hypot(g.position.x - P.x, g.position.z - P.z); if (d > (mk ? 80 : 30) || d < 0.5) continue;
    oth.push({ id: 'n:' + n.id, npc: n, ic: '🙂', name: n.name, cat: mk ? '말 걸기 ❗' : '이야기 나누기', col: mk ? '#ff9f7a' : '#63d3c4', x: g.position.x, z: g.position.z, d: d - (mk ? 1000 : 0) });
  }
  for (const s of lwSpots()) { if (p && Math.hypot(s.x - gx, s.z - gz) < 4) continue; s.d = Math.hypot(s.x - P.x, s.z - P.z) - 500; oth.push(s); }
  if (!window.__lw && window.PLAY && PLAY.things) try { // 놀이 기구 (보석으로 타는 것들)
    for (const th of PLAY.things()) {
      const k = PLAY_KO[th.kind]; if (!k || th.hidden) continue; const x = th.ux != null ? th.ux : th.x, z = th.uz != null ? th.uz : th.z, d = Math.hypot(x - P.x, z - P.z);
      if (d > 35 || (p && Math.hypot(x - gx, z - gz) < 3)) continue;
      oth.push({ id: 'p:' + th.kind + Math.round(x) + ',' + Math.round(z), ic: k[0], name: k[1], cat: th.price ? '놀이 · 💎 ' + th.price : '놀이', col: '#b197fc', x, z, d: d - 500 });
    }
  } catch (e) {}
  oth.sort((a, b) => a.d - b.d);
  for (const r of oth) { r.d = Math.hypot(r.x - P.x, r.z - P.z); rows.push(r); if (rows.length >= 4) break; }
  return rows;
}
function hlRender(rows) {
  if (!HL) return;
  let soft = GFX.soft, made = 0;
  for (const r of rows) { // 사람이면 얼굴 그림 (한 번에 하나만 새로 그려요)
    if (!r.npc || soft) continue; const k = 'npc:' + r.npc.name;
    if (PORT.cache[k] !== undefined) r.img = PORT.cache[k]; else if (!made) { made = 1; r.img = portrait(r.npc.g.userData.opts, k); }
  }
  const key = rows.map(r => r.id + '|' + r.name + '|' + (r.img ? 1 : 0) + '|' + r.ic).join(';');
  if (key !== SKIN.key) {
    SKIN.key = key;
    HL.list.innerHTML = rows.map(r => `<div class="row${r.goal ? ' goal' : ''}" style="--c:${r.col}"><span class="ic">${r.img ? `<img alt="" src="${r.img}">` : r.ic}</span><span class="tx"><div class="nm"></div><div class="ct"></div></span><span class="ds"><span class="dv"></span><i class="ar"></i></span></div>`).join('');
    const els = HL.list.querySelectorAll('.row');
    rows.forEach((r, i) => { const e = els[i]; e.querySelector('.nm').textContent = r.name || '?'; e.querySelector('.ct').textContent = r.cat; r.dv = e.querySelector('.dv'); r.ar = e.querySelector('.ar'); r.lastD = ''; r.lastA = 99; });
    SKIN.rows = rows;
  } else rows.forEach((r, i) => { const o = SKIN.rows[i]; r.dv = o.dv; r.ar = o.ar; r.lastD = o.lastD; r.lastA = o.lastA; SKIN.rows[i] = r; });
  for (const r of SKIN.rows) {
    const ds = r.d < 3 ? '도착' : Math.round(r.d) + ' m'; if (ds !== r.lastD) { r.lastD = ds; r.dv.textContent = ds; }
    const a = relAng(r.x, r.z); if (Math.abs(a - r.lastA) > 0.08) { r.lastA = a; r.ar.style.transform = `rotate(${(-a).toFixed(2)}rad)`; }
  }
  HL.el.classList.toggle('show', SKIN.rows.length > 0 && started && !SKIN.pre && !coach.el);
}
function skinTick(dt) {
  SKIN.t += dt; SKIN.slow += dt; SKIN.capT += dt;
  try { const v = camera.getWorldDirection(SKIN.v || (SKIN.v = new THREE.Vector3())); if (Math.abs(v.x) + Math.abs(v.z) > 1e-4) SKIN.yaw = Math.atan2(-v.x, -v.z); } catch (e) {}
  if (SKIN.slow > 1) { // 1초에 한 번: 작은 지도·자판 보이기, 흐림 효과 끄기
    SKIN.slow = 0;
    const play = started && !SKIN.pre;
    if (MINI.el) {
      MINI.el.classList.toggle('show', play);
      const w = MINI.el.clientWidth - 12, dpr = Math.min(2, GFX.lite ? 1 : (devicePixelRatio || 1)), W = Math.max(64, Math.round(w * dpr));
      const was = MINI.on; MINI.on = play && w > 0;
      if (MINI.on && W !== MINI.W) { MINI.W = MINI.cv.width = MINI.cv.height = W; MINI.vig = null; }
      if (MINI.on && (!was || !MINI.drawn)) mapTick = 0; // 처음 보일 때는 다음 장면에서 바로 그려요
    }
    if (CAPS) CAPS.classList.toggle('show', play && !isTouch && !dlgOpen);
    document.body.classList.toggle('noblur', !!(GFX.soft || GFX.lite));
  }
  if (!started && SKIN.pre) titleCam(GFX.soft || GFX.lite || GFX.wantLite ? 0 : dt); // 느린 컴퓨터에서는 같은 장면을 멈춘 채로 보여 줘요
  else titleCamOff();
  { const pOn = ui.prompt.style.display === 'block'; if (CAPS && pOn !== SKIN.pOn) { SKIN.pOn = pOn; CAPS.classList.toggle('fade', pOn); } } // 말 걸기 안내가 떠 있으면 자판 안내는 흐리게
  if (CAPS) { if (dlgOpen && CAPS.classList.contains('show')) CAPS.classList.remove('show'); if (SKIN.capT > 4 && !CAPS.classList.contains('dim')) CAPS.classList.add('dim'); }
  if (CAPS && !SKIN.learned && started && !dlgOpen && SKIN.capT < 0.5 && CAPS.querySelector('.k.on')) { SKIN.moveT = (SKIN.moveT || 0) + dt; if (SKIN.moveT > 20) { SKIN.learned = true; CAPS.classList.add('learned'); } } // 20초쯤 움직여 봤으면 자판 안내는 거의 투명하게 (내 캐릭터를 가리지 않게)
  if (SKIN.t < 0.25) return;
  SKIN.t = 0;
  if (SKIN.objT !== objective.text) { SKIN.objT = objective.text; objMeta(); }
  const p = objective.pos && objective.pos();
  let nm = SKIN.nameT;
  if (p && !(objective.R && objective.R())) { const n = npcNear(p[0], p[1], 1.6); if (n) nm = n.name; }
  SKIN.name = nm;
  if (SKIN.nav) {
    const on = !!(p && started && !SKIN.pre && distTxt);
    SKIN.nav.classList.toggle('off', !on);
    SKIN.nav.classList.toggle('here', distTxt === '도착!');
    if (SKIN.navNm.textContent !== nm) SKIN.navNm.textContent = nm;
    if (SKIN.navEm.textContent !== SKIN.icon) SKIN.navEm.textContent = SKIN.icon;
  }
  if (HL) { if (started && !SKIN.pre) hlRender(hlCollect(p)); else HL.el.classList.remove('show'); }
}
// 시작 화면: 액자 속 장면은 마을을 비스듬히 위에서 천천히 도는 모습이에요 (액자 가운데에 마을 가운데가 오게 숙여요)
function titleCam(dt) {
  const W = window.__lw, c = W && W.CARO ? [W.CARO.x - 22, W.CARO.z - 4] : [0, 2], R = W ? 34 : 46, H = W ? 16 : 26;
  SKIN.ta = (SKIN.ta || 0) + dt;
  const a = W ? 1.5 + Math.sin(SKIN.ta * 0.08) * 0.3 : 0.5 + SKIN.ta * 0.045; // 롯데월드: 회전목마 쪽에서 공원 안을 천천히 둘러봐요
  camera.position.set(c[0] + Math.sin(a) * R, H, c[1] + Math.cos(a) * R);
  camera.lookAt(c[0], 1.5, c[1]);
  if ((SKIN.frT = (SKIN.frT || 0) - dt) <= 0) { SKIN.frT = 0.5; try { const r = $('#title .tFrame').getBoundingClientRect(); SKIN.fy = r.height > 10 ? (r.top + r.height / 2) / innerHeight : 0.5; } catch (e) { SKIN.fy = 0.5; } }
  // 액자 가운데에 장면 가운데가 오게: 카메라를 숙이지 않고 그림을 위로 옮겨요(세로 화면에서도 바닥만 보이지 않게)
  const W0 = innerWidth, H0 = innerHeight, y0 = Math.round((0.5 - (SKIN.fy || 0.5)) * H0);
  if (SKIN.vo !== y0 + ':' + W0 + 'x' + H0) { SKIN.vo = y0 + ':' + W0 + 'x' + H0; camera.setViewOffset(W0, H0, 0, y0, W0, H0); }
}
function titleCamOff() { if (SKIN.vo) { SKIN.vo = 0; camera.clearViewOffset(); } }
// 둥근 작은 지도: 큰 지도(mapCanvas)를 내 자리 둘레만 잘라 돌려서 그려요. 위쪽 = 내가 보는 쪽
function miniDraw() {
  if (!MINI.on) return;
  const c = MINI.ctx, W = MINI.W, R = W / 2, s = mapC.width / 96, cx = mapC.width / 2, k = R / (21 * s), y = SKIN.yaw, u = W / 170;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, W);
  c.save(); c.beginPath(); c.arc(R, R, R, 0, 7); c.clip();
  c.fillStyle = '#20264a'; c.fillRect(0, 0, W, W);
  c.translate(R, R); c.rotate(y); c.scale(k, k); c.translate(-(cx + P.x * s), -(cx + P.z * s));
  c.drawImage(mapC, 0, 0);
  c.restore(); MINI.drawn = 1;
  if (!MINI.vig) { const g = c.createRadialGradient(R, R, R * 0.55, R, R, R); g.addColorStop(0, 'rgba(14,17,40,.12)'); g.addColorStop(1, 'rgba(14,17,40,.62)'); MINI.vig = g; }
  c.fillStyle = MINI.vig; c.beginPath(); c.arc(R, R, R, 0, 7); c.fill();
  const cs = Math.cos(y), sn = Math.sin(y);
  const p = objective.pos && objective.pos();
  if (p && started) { // 목표: 안이면 금빛 고리, 밖이면 테두리에 금빛 화살촉
    const dx = (p[0] - P.x) * s * k, dz = (p[1] - P.z) * s * k, x = dx * cs - dz * sn, z = dx * sn + dz * cs, d = Math.hypot(x, z), lim = R - 13 * u;
    if (d > lim) {
      const a = Math.atan2(z, x); c.save(); c.translate(R + Math.cos(a) * lim, R + Math.sin(a) * lim); c.rotate(a + Math.PI / 2);
      c.fillStyle = '#f4c25a'; c.strokeStyle = '#3a2608'; c.lineWidth = 1.5 * u; c.beginPath(); c.moveTo(0, -8 * u); c.lineTo(7 * u, 6 * u); c.lineTo(-7 * u, 6 * u); c.closePath(); c.fill(); c.stroke(); c.restore();
    } else {
      const pu = 1 + Math.sin(performance.now() / 260) * 0.18;
      c.strokeStyle = 'rgba(247,220,149,.9)'; c.lineWidth = 2 * u; c.beginPath(); c.arc(R + x, R + z, 9 * u * pu, 0, 7); c.stroke();
      c.fillStyle = '#f4c25a'; c.strokeStyle = '#3a2608'; c.lineWidth = 1.5 * u; c.beginPath(); c.arc(R + x, R + z, 4.5 * u, 0, 7); c.fill(); c.stroke();
    }
  }
  // 나: 가운데 크림색 화살표 (내 몸이 보는 쪽)
  c.save(); c.translate(R, R); c.rotate(y - P.yaw);
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 4 * u;
  c.fillStyle = '#fff6dc'; c.strokeStyle = '#3a2608'; c.lineWidth = 1.6 * u; c.beginPath(); c.moveTo(0, -10 * u); c.lineTo(7 * u, 8 * u); c.lineTo(0, 4 * u); c.lineTo(-7 * u, 8 * u); c.closePath(); c.fill(); c.shadowBlur = 0; c.stroke(); c.restore();
  // 방위: N 은 금빛 동그라미, 나머지는 작은 눈금
  const r0 = R - 9 * u;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, vx = Math.sin(a), vz = -Math.cos(a), x = R + (vx * cs - vz * sn) * r0, z = R + (vx * sn + vz * cs) * r0;
    if (i === 0) { c.fillStyle = '#15182e'; c.strokeStyle = '#e8c26a'; c.lineWidth = 1.5 * u; c.beginPath(); c.arc(x, z, 8 * u, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#f7dc95'; c.font = `bold ${Math.round(10 * u)}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', x, z + 0.5 * u); }
    else { c.fillStyle = 'rgba(247,220,149,.75)'; c.beginPath(); c.arc(x, z, 2 * u, 0, 7); c.fill(); }
  }
}
$('#btnStart').onclick = () => begin(true);
$('#btnContinue').onclick = () => begin(false);
// 다시 온 학생: '이어하기'가 첫 번째 큰 단추, '처음부터'는 아래쪽 작은 글 단추이고 두 번 눌러야 시작해요 (잘못 눌러 진행을 잃지 않게)
const RESTART_T = '↺ 처음부터 다시 하기';
if (S.stage > 0) {
  const bc = $('#btnContinue'), bs = $('#btnStart'), last = STAGES.length - 1;
  bc.style.display = 'inline-block';
  bc.textContent = S.stage >= last ? '🎉 이어서 자유롭게 놀기' : `이어하기 · ${STAGES[Math.min(S.stage, last)].title}`;
  bs.textContent = RESTART_T; bs.classList.add('restart');
  bs.onclick = () => {
    if (bs.classList.contains('arm')) { clearTimeout(bs._t); bs.classList.remove('arm'); begin(true); return; }
    bs.classList.add('arm'); bs.textContent = '정말 처음부터 할까요? 한 번 더 누르면 시작해요 (별·카드는 그대로)';
    clearTimeout(bs._t); bs._t = setTimeout(() => { bs.classList.remove('arm'); bs.textContent = RESTART_T; }, 4000);
  };
}
// 시작 화면에서 Enter = 이어하기 (처음이면 시작하기)
addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || started || !$('#title').classList.contains('show')) return;
  const tg = e.target; if (tg && /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(tg.tagName)) return; // 단추에 초점이 있으면 그 단추가 눌려요
  e.preventDefault(); const bc = $('#btnContinue'); (bc.style.display !== 'none' && S.stage > 0 ? bc : $('#btnStart')).click();
});
$('#rateBtn').textContent = S.rate < 0.9 ? '🐢 천천히' : '🔊 보통';
resetWorld();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {});
requestAnimationFrame(loop);
// 테스트용: ?stage=N
const qs = new URLSearchParams(location.search);
if (qs.has('audit')) auditLog = { rows: [], last: '', pending: true };
if (qs.has('stage')) { S.stage = +qs.get('stage'); begin(false); }
else if (qs.has('skip')) { // 선생님 코드로 미션을 건너뛰었어요: 바로 다음 미션부터
  begin(false);
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  setTimeout(() => { try { toast('⏭ 미션을 건너뛰었어요. 여기서부터 이어서 해요!', 3200); } catch (e) {} }, 600);
}
else if (qs.has('portal')) { // 포탈을 타고 왔어요: 시작 화면 없이 바로 이어서 해요
  begin(false);
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  setTimeout(() => { try { toast('🌀 <b>Lesson ' + lessonNo + '</b> 에 도착했어요!', 2600); confetti(30); } catch (e) {} }, 600);
}
window.__game = { camera, CAM, say, ask, tick: (dt) => update(dt, performance.now() / 1000), get S() { return S; }, P, NPC, startStage, items: () => items, zones, HOME, stallInfo: typeof stallInfo !== 'undefined' ? stallInfo : null, get decor() { return decor; }, get st() { return stageState; }, get held() { return held; }, get busy() { return busy; } };
if (qs.has('autotest')) { const s = document.createElement('script'); s.src = 'autotest.js'; document.body.appendChild(s); }
// 함께 하기(multi.js): 반에 참여한 학생끼리 같은 공간에서 만나요. net.js 와 같은 폴더에서 불러와요.
window.__mp = { scene, makePerson, textSprite: (t, h, o) => (o && o.border === '#2a9d8f' && o.bg === '#fff' ? bubbleSprite(t, h * 1.05, { fs: o.fs, pad: o.pad }) : textSprite(t, h, o)), P, L, speak, toast, addStar, confetti, beep, isTouch, prompt: ui.prompt,
  shot() { // 같이 사진 찍기: 내 캐릭터 앞쪽에서 얼굴이 보이게 한 장 찍고, 카메라는 바로 되돌려요
    try {
      const p0 = camera.position.clone(), q0 = camera.quaternion.clone(), f0 = camera.fov;
      if (CAM.third) { camera.position.set(P.x - Math.sin(P.yaw) * 4.6, 2.0, P.z - Math.cos(P.yaw) * 4.6); camera.lookAt(P.x, 1.2, P.z); camera.fov = 60; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); }
      renderer.render(scene, camera); const u = renderer.domElement.toDataURL('image/jpeg', 0.86);
      camera.position.copy(p0); camera.quaternion.copy(q0); camera.fov = f0; camera.updateProjectionMatrix();
      return u;
    } catch (e) { return null; }
  },
  get S() { return S; }, get started() { return started; }, get dlgOpen() { return dlgOpen; }, get busy() { return busy; }, get nearNPC() { return nearNPC; },
  lock(on) { dlgOpen = !!on; if (on) { if (document.pointerLockElement) document.exitPointerLock(); for (const k in keys) keys[k] = false; } } };
try { const n = document.querySelector('script[src$="net.js"]'); if (n) { const s = document.createElement('script'); s.src = n.getAttribute('src').replace(/net\.js$/, 'multi.js'); document.body.appendChild(s); } } catch (e) {}
// 게임성 층(fun.js): 보석 모으기·미션 결과 카드와 메달·배지·꾸미기. net.js 와 같은 폴더에서 불러와요. 없어도 게임은 그대로 돼요.
window.__fun = { scene, P, L, NPC, NAV, navGrid, navFind, tickers: FX2.tickers, haloTex, beep, confetti, addStar, save, lessonNo,
  get S() { return S; }, get started() { return started; }, get dlgOpen() { return dlgOpen; }, get busy() { return busy; }, get objective() { return objective; }, get items() { return items; },
  get stages() { return STAGES.length; } };
try { const n = document.querySelector('script[src$="net.js"]'); if (n) { const s = document.createElement('script'); s.src = n.getAttribute('src').replace(/net\.js$/, 'fun.js'); document.body.appendChild(s); } } catch (e) {}
// 놀이 층(play.js): 비행기 타기·공 차기·분수 같은 물건과의 상호작용. net.js 와 같은 폴더에서 불러와요. 없어도 게임은 그대로 돼요.
window.__play = { scene, camera, P, CAM, L, NPC, NAV, navGrid, navFind, colliders, collide, keys, touch, GFX, FX2, tickers: FX2.tickers, haloTex, beep, confetti, toast, textSprite, speak, isTouch, calm, prompt: ui.prompt, lessonNo,
  lock(on) { dlgOpen = !!on; if (on) { if (document.pointerLockElement) document.exitPointerLock(); for (const k in keys) keys[k] = false; } }, // 영어 관문 창이 떠 있는 동안 걷기·말 걸기를 멈춰요
  get S() { return S; }, get started() { return started; }, get dlgOpen() { return dlgOpen; }, get busy() { return busy; }, get nearNPC() { return nearNPC; }, get items() { return items; }, get objective() { return objective; } };
try { const n = document.querySelector('script[src$="net.js"]'); if (n) { const s = document.createElement('script'); s.src = n.getAttribute('src').replace(/net\.js$/, 'play.js'); document.body.appendChild(s); } } catch (e) {}
})();
// 개발용 화면 위치: ?view=x,z,yaw  /  ?dlg=1
(() => { const q = new URLSearchParams(location.search); const G = window.__game; if (q.has('view')) { const [x, z, y] = q.get('view').split(',').map(Number); G.P.x = x; G.P.z = z; G.P.yaw = y; } })();
