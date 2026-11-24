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
const SAVE_KEY = 'english3d_l13_v1';
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
const VOICE = { // 이 단원은 한국어로 읽어 줘요 (영어 목소리는 쓰지 않아요)
  '나': [0, 1.0]
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
    const sub = document.querySelector('#title .sub'); if (sub) { const v = document.createElement('span'); v.className = 'ver'; v.textContent = 'v2.9'; sub.appendChild(v); }
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
  const tag = textSprite(o.name, 0.34 / s, { fs: 48, fg: '#1d3557' }); tag.position.y = 2.25 + (o.hat ? 0.4 : 0); g.add(tag);
  const mark = textSprite('!', 0.5 / s, { fs: 70, bg: '#ffd43b', fg: '#c92a2a', border: '#c92a2a', pad: 18 });
  mark.position.y = 2.75 + (o.hat ? 0.4 : 0); mark.visible = false; mark.userData.baseY = mark.position.y; g.add(mark);
  g.userData.mark = mark; g.userData.tag = tag;
  return g;
}

// ---------------- 세계 만들기 (롯데월드 현장체험학습 안전교육) ----------------
// 한 장의 지도(±46m)에 세 구역을 놓았어요. 구역 사이는 벽으로 막혀 있고 미션이 장면을 옮겨 줘요.
//   남쪽  z 15~46 : 인천석정초 → (정문 나와 왼쪽) 석정로539번길 보도 → 모퉁이 → 석정로 보도 → 성산효대학원 앞 버스 1~6호차
//   가운데 z -2~4.6: 달리는 버스 안 (지붕을 걷어 낸 모형)
//   북쪽  z -46~-3: 롯데월드 — 옥외지상주차장 → 통로 → 매표소 → 정문 게이트 → (한 층 위) 1층 광장·회전목마·만남의 광장·매직아일랜드
// 실제 지도를 180도 돌려 놓았어요(게임 시작이 남쪽이라). 왼쪽·오른쪽으로 도는 방향은 실제와 같아요. 길이는 줄였어요.
const zones = [];
const zone = (type, id, x1, z1, x2, z2) => zones.push({ type, id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
DETAIL.win = false; DETAIL.doors = false; DETAIL.fronts = false; DETAIL.lamps = false; // 건물은 직접 꾸며요
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0xc3c8cc)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const FEN = 46;
const flat = (w, d, c, x, z, y = 0.02) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(c)); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; };
const slab = (w, d, c, x, z, y = 0.02) => box(w, 0.04, d, c, x, y, z); // 무늬 없는 바닥 (차도·모래·물)
const wall = (w, h, d, c, x, z) => { const m = solid(w, h, d, c, x, h / 2, z); m.userData.plain = 1; return m; };
const sign = (text, h, x, y, z, ry = 0, o = {}) => { const t = textPlane(text, h, Object.assign({ fs: 56, bg: '#ffffff', fg: '#1d3557' }, o)); t.position.set(x, y, z); t.rotation.y = ry; return t; };
const sign2 = (text, h, x, y, z, ry = 0, o = {}) => { sign(text, h, x, y, z, ry, o); const k = 0.04; sign(text, h, x - Math.sin(ry) * k, y, z - Math.cos(ry) * k, ry + Math.PI, o); }; // 양쪽에서 보이는 간판
const floorText = (text, h, x, z, o = {}, rz = 0) => { const t = textPlane(text, h, Object.assign({ fs: 96, bg: null, fg: '#ffffff' }, o)); t.rotation.x = -Math.PI / 2; t.rotation.z = rz; t.position.set(x, 0.08, z); return t; };
const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2; // 간판이 보는 쪽: 0=남(+z), N=북(-z), E=동(+x), W=서(-x)
function figure(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; p.children.forEach(ch => { if (ch.isSprite) ch.visible = false; }); scene.add(p); if (y === 0) block(x - 0.32, z - 0.32, x + 0.32, z + 0.32); return p; } // 이름표 없는 배경 사람 (서 있는 사람은 뚫고 지나가지 못해요)
// ---------- 모델 만들 때 쓰는 재질과 모양 ----------
const paintM = {}; const paint = (c) => paintM[c] || (paintM[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.36, metalness: 0.12 })); // 반들반들한 칠
const glassM = new THREE.MeshStandardMaterial({ color: 0x8fc7ea, roughness: 0.08, metalness: 0.35, transparent: true, opacity: 0.8 });
const darkGlass = new THREE.MeshStandardMaterial({ color: 0x1f2d3a, roughness: 0.1, metalness: 0.45 });
const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.22, metalness: 0.75 });
const goldM = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.3, metalness: 0.65 });
const tireM = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.9 });
const lampM = (c, k = 0.9) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k });
function rrect(rw, rh, r) { const s = new THREE.Shape(), x = -rw / 2, y = -rh / 2; s.moveTo(x + r, y); s.lineTo(x + rw - r, y); s.quadraticCurveTo(x + rw, y, x + rw, y + r); s.lineTo(x + rw, y + rh - r); s.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh); s.lineTo(x + r, y + rh); s.quadraticCurveTo(x, y + rh, x, y + rh - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
// 둥근 상자: 단면(가로 rw × 세로 rh, 모서리 r)을 길이 len 만큼 민 것. 길이 방향은 z
function rbox(rw, rh, len, r, material) { const g = new THREE.ExtrudeGeometry(rrect(rw, rh, r), { depth: len, bevelEnabled: false, curveSegments: 5 }); g.translate(0, 0, -len / 2); return new THREE.Mesh(g, material); }
const capsule = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 5, 12), m);
// 바퀴. axis: 'z' = 차 길이가 x 쪽(버스), 'x' = 차 길이가 z 쪽(자동차)
function wheel(g, x, z, r, wd, axis) {
  for (const [rr, ww, m] of [[r, wd, tireM], [r * 0.56, wd + 0.04, chrome], [r * 0.2, wd + 0.08, darkGlass]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, ww, 18), m); if (axis === 'z') t.rotation.x = Math.PI / 2; else t.rotation.z = Math.PI / 2; t.position.set(x, r, z); g.add(t); }
}
for (const [w, d, x, z] of [[2 * FEN, 0.5, 0, -FEN], [0.5, 2 * FEN, -FEN, 0], [0.5, 2 * FEN, FEN, 0], [2 * FEN, 0.5, 0, FEN]]) wall(w, 3, d, 0xdfe3e6, x, z);

// ======================================================================= 남쪽: 학교 → 버스
// ---------- 인천석정초등학교 (운동장과 정문) ----------
const SCH = { gateX: 27.6, gateZ: 38 };
slab(57.6, 11.6, 0xe6d3a3, -1.2, 37.4);                                   // 모래 운동장
{ // 본관: 회색 바탕 + 노란 창 사이 패널 + 빨간 지붕 띠 (4층)
  const b = solid(50, 9, 2.4, 0xe1e4e8, -4, 4.5, 44.7); b.userData.plain = 1;
  box(50.1, 0.45, 2.5, 0xe03131, -4, 8.95, 44.7);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) {
    const x = -26.5 + i * 4.1, y = 1.7 + j * 2.05;
    box(2.2, 1.15, 0.08, 0x9fd3ff, x, y, 43.47); box(1.0, 1.15, 0.07, 0xffd43b, x + 1.9, y, 43.48);
  }
  box(3, 2.5, 0.12, 0x8d6e63, 0, 1.25, 43.46); box(4.4, 0.25, 1.4, 0x868e96, 0, 2.75, 42.9);
  sign('인천석정초등학교', 0.9, 0, 3.6, 43.4, N, { bg: '#1d3557', fg: '#ffffff' });
}
solid(18, 6.5, 3.4, 0x9fb3c8, -19, 3.25, 33.6).userData.plain = 1; box(18.1, 2, 3.5, 0xb5523b, -19, 1, 33.6); // 강당
sign('체육관', 0.6, -19, 4.6, 35.35, 0, { bg: '#9fb3c8', fg: '#1d3557' });
wall(57.6, 1.8, 0.4, 0xb5523b, -1.2, 31.5); wall(0.4, 1.8, 14.5, 0xb5523b, -30, 38.75);
wall(0.4, 1.8, 4.2, 0xb5523b, SCH.gateX, 33.7); wall(0.4, 1.8, 5.7, 0xb5523b, SCH.gateX, 43.1);
for (const z of [35.9, 40.1]) { const p = solid(0.8, 3.1, 0.8, 0xbdb5a6, SCH.gateX, 1.55, z); p.userData.plain = 1; }
box(0.3, 0.3, 4.6, 0x6c757d, SCH.gateX, 3.1, 38);
sign2('🏫 인천석정초등학교', 0.62, SCH.gateX + 0.2, 3.65, 38, E, { bg: '#1d3557', fg: '#ffffff' });
solid(2.2, 2.6, 2.2, 0xf1f3f5, 25.4, 1.3, 42).userData.plain = 1; sign('경비실', 0.4, 24.28, 2.2, 42, W, { fs: 44 });
prop(flagPole, 8, 42.2); prop(goal, -12, 32.9, 0); prop(goal, -12, 42.6, N);
// 처음 서 있는 곳에서 갈 길이 보이게: 정문 쪽 화살표
floorText('정문 ➡', 1.3, 18, 38, { fg: '#8a6d1f' });

// ---------- 석정로539번길 (학교 앞 길: 어린이보호구역 30) ----------
flat(3.7, 31.2, 0xd9d2c5, 29.9, 30.6);                                     // 학교 쪽 보도
slab(3.7, 4.2, 0xffe066, 29.9, 38, 0.035);                                 // 정문 앞 노란 보도
slab(7, 31.2, 0xb5524a, 35.5, 30.6);                                       // 붉은 포장 차도
slab(0.15, 31.2, 0xffe066, 35.5, 30.6, 0.04);
floorText('30', 2.4, 34, 28, { fg: '#ffffff' }); floorText('어린이보호구역', 1.0, 37.2, 24, { fg: '#ffffff' }, E);
for (let k = 0; k < 6; k++) slab(0.9, 3.6, k % 2 ? 0xffffff : 0xffe066, 32.6 + k * 1.1, 38, 0.045); // 정문 앞 횡단보도 (우리는 건너지 않아요)
flat(1.6, 31.2, 0xd9d2c5, 39.9, 30.6);
wall(0.3, 2.2, 31.2, 0xd8dcd3, 41, 30.6);                                  // 우성1차아파트 돌 옹벽
for (const z of [20.5, 30, 41.5]) { box(4.2, 26, 9, 0xf4f4f1, 43.6, 13, z); for (let j = 0; j < 9; j++) box(0.08, 1.1, 7.6, 0x9fb7cf, 41.48, 3 + j * 2.6, z); }
sign('우성1차아파트', 0.7, 40.82, 3.2, 30, W, { bg: '#f4f4f1', fg: '#495057' });
// 보행자 울타리 (차도와 보도 사이). 정문 앞 횡단보도 자리만 열려 있어요.
const RAIL = 0x4dabf7;
function rail(wd, dp, x, z) { // 충돌은 그대로, 모양은 기둥 + 가로대 두 줄
  block(x - wd / 2, z - dp / 2, x + wd / 2, z + dp / 2);
  const along = wd > dp, len = along ? wd : dp, n = Math.max(1, Math.round(len / 1.7));
  for (const y of [0.5, 0.95]) box(along ? len : 0.07, 0.07, along ? 0.07 : len, 0xe9ecef, x, y, z);
  for (let i = 0; i <= n; i++) { const o = -len / 2 + (i / n) * len; cyl(0.055, 0.055, 1.08, RAIL, along ? x + o : x, 0.54, along ? z + o : z, scene, 6); }
}
function wtree(x, z, s = 1) { // 잎이 조금 남은 겨울 은행나무
  const g = grp(x, z); g.scale.setScalar(s); cyl(0.1, 0.17, 2.6, 0x7a5230, 0, 1.3, 0, g, 7);
  [[0.9, 0.5, 0], [-0.8, 0.6, 0.4], [0.3, 0.7, -0.8], [-0.2, 0.9, 0.7]].forEach(([dx, k, dz], i) => { const b = cyl(0.03, 0.06, 1.7, 0x7a5230, dx * 0.45, 2.6 + k * 0.9, dz * 0.45, g, 5); b.rotation.z = -dx * 0.75; b.rotation.x = dz * 0.75; if (i < 3) ball(0.36, [0xe9b824, 0xd9a21b, 0xf0c94d][i], dx * 0.95, 3.1 + k * 1.2, dz * 0.95, g); });
  return g;
}
rail(0.14, 16.9, 31.8, 27.75); rail(0.14, 6.2, 31.8, 42.9);
block(35.2, 14.9, 46, 46);                                                 // 더 안쪽으로는 못 가요 (그 전에 '차도!' 로 끝나요)
{ const p = cyl(0.09, 0.09, 3.6, 0xffd43b, 31.9, 1.8, 40.3); const b = box(0.4, 1.0, 0.3, 0x222222, 31.9, 3.3, 40.3); ball(0.13, 0xe03131, 31.9, 3.55, 40.12); ball(0.13, 0x2f9e44, 31.9, 3.1, 40.12); }
signPost('🚸 정문을 나와 왼쪽으로!\n길은 건너지 않아요', 28.5, 34.9, E, { fs: 40 });

// ---------- 석정로 (큰길) : 보도 · 버스 6대 · 차도 ----------
flat(78, 4.4, 0xd9d2c5, -7.2, 17.1);                                       // 넓은 보도 (x -46~31.8)
for (let x = -44; x <= 30; x += 2.2) slab(0.5, 0.3, 0xffd43b, x, 17.1, 0.04); // 점자블록
slab(92, 9.8, 0x4a4f57, 0, 10, 0.02);                                       // 차도
for (let x = -44; x <= 44; x += 6) { slab(2.4, 0.14, 0xffffff, x, 11.2, 0.045); slab(2.4, 0.14, 0xffffff, x, 6.9, 0.045); }
box(92, 0.9, 0.12, 0xffd43b, 0, 0.45, 8.8);                                 // 노란 중앙분리 울타리
floorText('50', 2.0, 26, 10.4, { fg: '#ffffff' }, W);
wall(92, 4.5, 0.5, 0xd9cdbb, 0, 4.8);                                       // 길 건너편 건물 줄 (그 뒤는 달리는 버스 구역)
[['택시 운전직 사원 모집', -24], ['간석 세탁', -4], ['성산종합사회복지관 ➡', 26]].forEach(([t, x]) => sign(t, 0.6, x, 3.2, 5.07, 0, { fs: 46, bg: '#fff9db', fg: '#5c4033' }));
block(-46, 4.8, 46, 12.2);
// 버스 (머리는 동쪽, 문은 보도 쪽 앞문)
const BUS_X = [8, -1.4, -10.8, -20.2, -29.6, -39], BUS_Z = 13.5;
const busDoor = (i) => [BUS_X[i] + 2.9, 15.75];
function busModel(no, accent) { // 전세버스: 둥근 몸통, 창 줄, 앞 유리, 색 띠, 바퀴, 거울, 에어컨
  const g = new THREE.Group(), LN = 8.4, WD = 2.5;
  const body = rbox(WD, 2.55, LN, 0.34, paint(0xf8f9fa)); body.rotation.y = Math.PI / 2; body.position.y = 1.92; g.add(body);
  box(LN - 0.2, 0.42, WD + 0.02, 0x343a40, 0, 0.62, 0, g);
  box(LN + 0.02, 0.24, WD + 0.03, accent, 0, 1.12, 0, g); box(LN + 0.02, 0.07, WD + 0.035, 0xffffff, 0, 1.31, 0, g);
  for (const s of [1, -1]) {
    for (let k = 0; k < 6; k++) { if (s === 1 && k === 5) continue; const wn = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.92, 0.06), darkGlass); wn.position.set(-3.55 + k * 1.2, 2.32, s * (WD / 2 + 0.005)); g.add(wn); }
    box(0.1, 0.1, 0.34, 0x212529, 3.9, 2.55, s * (WD / 2 + 0.16), g); box(0.08, 0.4, 0.24, 0x212529, 3.96, 2.3, s * (WD / 2 + 0.34), g);
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 14), lampM(0xfff3bf, 0.9)); hl.rotation.z = Math.PI / 2; hl.position.set(LN / 2 + 0.03, 0.98, s * 0.9); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.2), lampM(0xe03131, 0.6)); tl.position.set(-LN / 2 - 0.03, 1.12, s * 1.0); g.add(tl);
    for (const x of [2.7, -2.5]) wheel(g, x, s * 1.12, 0.5, 0.32, 'z');
  }
  const ws = rbox(2.2, 1.4, 0.08, 0.22, glassM); ws.rotation.y = Math.PI / 2; ws.position.set(LN / 2 + 0.01, 2.22, 0); g.add(ws);
  const rw = rbox(2.0, 0.9, 0.08, 0.16, darkGlass); rw.rotation.y = Math.PI / 2; rw.position.set(-LN / 2 - 0.01, 2.42, 0); g.add(rw);
  for (const x of [LN / 2 - 0.04, -LN / 2 + 0.04]) box(0.22, 0.34, WD + 0.1, 0x212529, x, 0.56, 0, g);
  box(1.12, 2.12, 0.05, 0x212529, 2.9, 1.52, WD / 2 + 0.01, g); for (const dx of [-0.27, 0.27]) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.47, 1.92, 0.06), glassM); d.position.set(2.9 + dx, 1.52, WD / 2 + 0.03); g.add(d); }
  box(1.14, 0.1, 0.14, 0xffd43b, 2.9, 0.42, WD / 2 + 0.06, g);
  const ac = rbox(1.5, 0.28, 2.6, 0.1, paint(0xe9ecef)); ac.rotation.y = Math.PI / 2; ac.position.set(-0.8, 3.32, 0); g.add(ac);
  if (no) { const t = textPlane(no + '호차', 0.82, { fs: 80, bg: '#ffffff', fg: '#d6336c', border: '#d6336c' }, g); t.position.set(-0.55, 2.32, WD / 2 + 0.045);
    const f = textPlane(String(no), 0.5, { fs: 80, bg: '#ffffff', fg: '#d6336c' }, g); f.position.set(LN / 2 + 0.07, 1.82, 0.55); f.rotation.y = E;
    const c = textPlane('석정초 6학년 ' + no + '반', 0.32, { fs: 44, bg: '#ffe066', fg: '#333' }, g); c.position.set(-0.55, 1.62, WD / 2 + 0.045); }
  g.traverse(o => { if (o.isMesh && o.geometry.type !== 'ExtrudeGeometry') o.userData.ns = 1; });
  return g;
}
const BUS_COL = [0xe03131, 0xf59f00, 0x2f9e44, 0x1c7ed6, 0x7048e8, 0xd6336c];
BUS_X.forEach((x, i) => { const b = busModel(i + 1, BUS_COL[i]); b.position.set(x, 0, BUS_Z); scene.add(b); block(x - 4.2, 12.2, x + 4.2, 14.8); });
block(12.2, 12.2, 17.4, 14.9); block(23.6, 12.2, 31.8, 14.9); block(-46, 12.2, -43.2, 14.9);
{ // 보도와 버스 사이 울타리: 버스 앞문 자리와 주차장 진출입로만 열려 있어요
  const gaps = BUS_X.map(x => [x + 2.0, x + 3.8]).concat([[17.5, 23.5]]).sort((a, b) => a[0] - b[0]);
  let x0 = -46; for (const [a, b] of gaps) { if (a - x0 > 0.3) rail(a - x0, 0.14, (a + x0) / 2, 15.05); x0 = b; }
  rail(31.8 - x0, 0.14, (31.8 + x0) / 2, 15.05);
}
{ const p = cyl(0.1, 0.1, 4.4, 0xffd43b, 31.2, 2.2, 15.6); box(0.4, 1.1, 0.3, 0x222222, 31.2, 3.9, 15.6); ball(0.13, 0xe03131, 31.2, 4.2, 15.78); ball(0.13, 0x2f9e44, 31.2, 3.7, 15.78); }
signPost('성산효대학원 앞\n버스 타는 곳 ⬅', 28.5, 18.9, N, { fs: 40 });
for (const x of [-42, -30, -18, -6, 6, 26]) wtree(x, 18.9); // 가로수

// ---------- 성산효대학원대학교 (보도 남쪽) ----------
const UNI = { x: -6, z: 28 };
{ const b = solid(32, 13, 6.4, 0xe8dccb, UNI.x, 6.5, UNI.z); b.userData.plain = 1;
  box(22, 9.2, 0.14, 0x3fa7a3, UNI.x, 6.9, 24.74); for (let i = 0; i < 7; i++) box(0.12, 9.2, 0.16, 0xd6ebe9, UNI.x - 9.4 + i * 3.13, 6.9, 24.7);
  for (let j = 0; j < 3; j++) box(22, 0.12, 0.16, 0xd6ebe9, UNI.x, 4.6 + j * 2.3, 24.7);
  box(7, 0.3, 2.2, 0xcabfae, UNI.x, 2.9, 23.8); for (const dx of [-3.2, 3.2]) cyl(0.16, 0.16, 2.9, 0xcabfae, UNI.x + dx, 1.45, 23); box(3.2, 2.5, 0.1, 0x495057, UNI.x, 1.25, 24.72);
  sign('성산효대학원대학교', 1.15, UNI.x, 12.1, 24.72, N, { bg: '#e8dccb', fg: '#1d3557', fs: 64 });
  sign('성산효대학원대학교', 0.42, UNI.x, 3.2, 22.66, N, { bg: '#cabfae', fg: '#1d3557', fs: 44 }); }
slab(63.2, 4.5, 0x5b6067, -14.4, 22, 0.02);                                // 앞 주차장
const PARKED = [[-26, 0xe9ecef], [-21, 0x343a40], [-12, 0x1c7ed6], [3, 0xf8f9fa], [8, 0xc92a2a]]; // 차 모델은 아래에서 세워요
for (const x of [-9, 0, 9]) prop(flagPole, UNI.x + x * 0.16 - 6.2, 20.6);
[['H', 0xe03131], ['Y', 0x1c7ed6], ['O', 0x2f9e44]].forEach(([t, c], i) => { box(1, 1, 0.5, c, 11.4 + i * 1.15, 0.9, 20.4); sign(t, 0.8, 11.4 + i * 1.15, 0.9, 20.13, N, { bg: null, fg: '#ffffff', fs: 90 }); });
wall(63.2, 0.8, 0.5, 0x2f7d4f, -14.4, 19.6); wall(4, 0.8, 0.5, 0x2f7d4f, 25.6, 19.6); // 낮은 생울타리
wall(0.4, 1.8, 12, 0xb5523b, 27.8, 25.5);                                   // 붉은 벽돌 담 (학교 앞 길 쪽)
block(-46, 19.4, 17.4, 31.5); block(23.6, 19.4, 27.8, 31.5); block(17.4, 20.2, 23.6, 31.5);
// 주차장 진출입로: 차가 보도를 가로질러 나와요
const DRIVE = { x1: 17.5, x2: 23.5, car: null, t: 0, danger: false };
slab(6, 9.4, 0x5b6067, 20.5, 19.6, 0.03); slab(6, 4.2, 0x8a8f96, 20.5, 17.1, 0.036);
for (const x of [17.5, 23.5]) for (let k = 0; k < 4; k++) slab(0.18, 0.7, 0xffd43b, x, 15.6 + k * 1.1, 0.05);
cyl(0.1, 0.1, 1.2, 0x495057, 17.9, 0.6, 20.6); { const bar = box(4.6, 0.12, 0.12, 0xffd43b, 20.1, 2.2, 20.6); bar.rotation.z = 0.5; }
box(0.5, 1.3, 0.4, 0xffd43b, 23.1, 0.65, 20.6);
signPost('🅿 주차장 진출입로\n차가 나와요! 멈추고 살펴요', 24.4, 19.0, N, { fs: 38, bg: '#fff3bf', fg: '#c92a2a', border: '#c92a2a' });
const carGeo = (() => { // 옆모습(보닛·앞 유리·지붕·트렁크)을 차 너비만큼 밀어 만든 몸통
  const s = new THREE.Shape(); s.moveTo(-2.0, 0.32); s.lineTo(-2.02, 0.78); s.quadraticCurveTo(-2.0, 0.95, -1.7, 0.98); s.lineTo(-1.25, 1.02); s.quadraticCurveTo(-0.95, 1.45, -0.6, 1.47); s.lineTo(0.35, 1.47); s.quadraticCurveTo(0.75, 1.42, 1.05, 1.0); s.lineTo(1.75, 0.9); s.quadraticCurveTo(2.05, 0.82, 2.05, 0.6); s.lineTo(2.05, 0.32); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.66, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.08, bevelSegments: 3, curveSegments: 8 }); g.translate(0, 0, -0.83); return g; })();
function carModel(c) { // 앞 = +z
  const g = new THREE.Group(), b = new THREE.Mesh(carGeo, paint(c)); b.rotation.y = -Math.PI / 2; g.add(b);
  box(1.88, 0.33, 1.22, darkGlass, 0, 1.22, -0.14, g);                                           // 옆 창
  const w1 = box(1.46, 0.76, 0.04, glassM, 0, 1.25, 0.735, g); w1.rotation.x = -0.98;            // 앞 유리
  const w2 = box(1.46, 0.7, 0.04, darkGlass, 0, 1.26, -0.955, g); w2.rotation.x = 0.96;          // 뒤 유리
  for (const s of [1, -1]) { for (const z of [1.3, -1.25]) wheel(g, s * 0.9, z, 0.36, 0.24, 'x');
    const hl = box(0.36, 0.14, 0.05, lampM(0xfff3bf, 0.9), s * 0.6, 0.72, 2.1, g); const tl = box(0.4, 0.12, 0.05, lampM(0xe03131, 0.6), s * 0.58, 0.82, -2.07, g);
    box(0.08, 0.12, 0.2, 0x212529, s * 1.0, 1.08, 0.55, g); }
  box(1.7, 0.2, 0.14, 0x212529, 0, 0.42, 2.08, g); box(1.7, 0.2, 0.14, 0x212529, 0, 0.42, -2.06, g);
  box(0.5, 0.12, 0.03, 0xf8f9fa, 0, 0.56, 2.15, g);
  g.traverse(o => { if (o.isMesh && o.geometry.type !== 'ExtrudeGeometry') o.userData.ns = 1; });
  return g;
}
DRIVE.car = carModel(0xf59f00); DRIVE.car.position.set(20.5, 0, 22.8); scene.add(DRIVE.car); box(0.5, 0.2, 0.26, lampM(0xffe066, 0.8), 0, 1.62, -0.1, DRIVE.car);
PARKED.forEach(([x, c], i) => { const p = carModel(c); p.position.set(x, 0, 22); p.rotation.y = i % 2 ? 0 : N; scene.add(p); });
// 지나가는 차들 [모형, 축('x'|'z'), 고정 좌표, 시작, 끝, 속도]
const TRAFFIC = [
  [carModel(0x1c7ed6), 'z', 37.2, 45, 15.5, 5.5], [carModel(0xe9ecef), 'z', 34.2, 15.5, 45, 4.6],
  [carModel(0xc92a2a), 'x', 10.8, -45, 45, 9], [carModel(0x2f9e44), 'x', 7.4, 45, -45, 10.5], [carModel(0x343a40), 'x', 6.2, 45, -45, 8]
].map(([g, ax, fix, a, b, v], i) => { scene.add(g); if (ax === 'x') g.rotation.y = b > a ? E : W; else g.rotation.y = b > a ? 0 : N; return { g, ax, fix, a, b, v, p: i * 0.37 }; });

// ======================================================================= 가운데: 달리는 버스 안
const BUSIN = { x1: -9, x2: 9, z1: -0.7, z2: 3.3, zc: 1.3, moving: false, off: 0, speed: 0, marks: [], seat: [-1.6, 1.3], door: [6.8, 2.5] };
slab(92, 6.8, 0x3d4248, 0, 1.2, 0.02);
wall(92, 4.5, 0.4, 0xb9c4cc, 0, -2.4);                                      // 방음벽 (그 너머는 롯데월드)
box(18, 0.08, 4.0, 0x7b838c, 0, 0.06, BUSIN.zc); box(18, 0.02, 1.36, 0x495057, 0, 0.105, BUSIN.zc);
wall(18, 1.0, 0.14, 0xf1f3f5, 0, BUSIN.z1); wall(15, 1.0, 0.14, 0xf1f3f5, -1.5, BUSIN.z2); wall(1.4, 1.0, 0.14, 0xf1f3f5, 8.3, BUSIN.z2);
wall(0.14, 1.0, 4.0, 0xf1f3f5, BUSIN.x1, BUSIN.zc); wall(0.14, 1.0, 4.0, 0xf1f3f5, BUSIN.x2, BUSIN.zc);
block(6.0, 3.3, 7.6, 3.7);                                                  // 앞문 (달릴 때는 닫혀 있어요)
box(1.6, 0.06, 0.5, 0xffd43b, 6.8, 0.12, 3.15); { const d = box(1.5, 2.0, 0.06, 0x9fd3ff, 6.8, 1.1, 3.36); d.material = new THREE.MeshStandardMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.45 }); }
for (let x = -9; x <= 9; x += 3) for (const z of [BUSIN.z1, BUSIN.z2]) cyl(0.05, 0.05, 1.5, 0xadb5bd, x, 1.75, z);
for (const z of [BUSIN.z1, BUSIN.z2]) box(18, 0.08, 0.1, 0xadb5bd, 0, 2.5, z);
{ const ws = box(0.06, 1.5, 4.0, 0x9fd3ff, 9.02, 1.75, BUSIN.zc); ws.material = new THREE.MeshStandardMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.35 }); }
const SEAT_ROWS = []; for (let k = 0; k < 9; k++) SEAT_ROWS.push(-7.4 + k * 1.45);
const SEAT_Z = [-0.32, 0.3, 2.3, 2.92];
SEAT_ROWS.forEach((xr, k) => {
  SEAT_Z.forEach((z, j) => { const mine = k === 4 && j === 2; box(0.62, 0.18, 0.56, mine ? 0xffd43b : 0x3b5bdb, xr, 0.5, z); box(0.14, 0.85, 0.56, mine ? 0xfab005 : 0x364fc7, xr - 0.32, 0.98, z); box(0.5, 0.4, 0.5, 0x495057, xr, 0.22, z); });
  block(xr - 0.42, BUSIN.z1, xr + 0.32, 0.62); block(xr - 0.42, 2.0, xr + 0.32, BUSIN.z2);
});
// 운전석·기사님
box(0.7, 0.2, 0.7, 0x212529, 7.9, 0.55, -0.1); box(0.14, 0.9, 0.7, 0x212529, 7.55, 1.05, -0.1); { const sw = cyl(0.28, 0.28, 0.05, 0x212529, 8.5, 1.15, -0.1, scene, 14); sw.rotation.z = Math.PI / 2 - 0.4; }
block(7.3, BUSIN.z1, 9, 0.6);
figure({ name: 'Driver', adult: true, shirt: 0x1c7ed6, hair: 0x333333, hat: true }, 7.95, -0.1, E, -0.28);
// 자리에 앉은 반 친구들
[[0, 0], [0, 3], [1, 1], [1, 2], [2, 3], [3, 0], [3, 2], [5, 1], [5, 3], [6, 0], [6, 2], [7, 1], [8, 3]].forEach(([k, j], i) => figure({ name: 'Kid' + i, girl: i % 2 === 0, shirt: [0xff8787, 0x74c0fc, 0x8ce99a, 0xffd43b, 0xb197fc, 0xffa94d][i % 6], hair: [0x111111, 0x3b2a1a, 0x5b3a22][i % 3], scale: 0.86 }, SEAT_ROWS[k] + 0.05, SEAT_Z[j], E, -0.3));
// 안전 장비: 비상망치(창가 기둥), 소화기(운전석 뒤), 비상구(맨 뒤), 앞문 비상 밸브
for (const [x, z] of [[-6, BUSIN.z1 + 0.1], [0, BUSIN.z1 + 0.1], [-3, BUSIN.z2 - 0.1], [3, BUSIN.z2 - 0.1]]) { box(0.1, 0.34, 0.08, 0xe03131, x, 2.0, z); box(0.26, 0.1, 0.1, 0xe03131, x, 2.2, z); }
sign('🔨 비상망치', 0.3, 0, 2.75, BUSIN.z1 + 0.02, 0, { fs: 44, bg: '#fff5f5', fg: '#c92a2a' }); sign('🔨 비상망치', 0.3, -3, 2.75, BUSIN.z2 - 0.02, N, { fs: 44, bg: '#fff5f5', fg: '#c92a2a' });
cyl(0.13, 0.13, 0.5, 0xe03131, 6.3, 0.4, 0.2, scene, 12); cyl(0.04, 0.04, 0.14, 0x222222, 6.3, 0.72, 0.2); sign('🧯 소화기', 0.3, 6.3, 1.25, -0.2, 0, { fs: 44, bg: '#fff5f5', fg: '#c92a2a' });
sign('🟩 비상구', 0.42, BUSIN.x1 + 0.1, 2.1, BUSIN.zc, E, { fs: 52, bg: '#2f9e44', fg: '#ffffff' }); box(0.06, 1.7, 1.2, 0x8ce99a, BUSIN.x1 + 0.06, 1.0, BUSIN.zc);
sign('비상시 문 여는 손잡이', 0.24, 6.8, 2.45, BUSIN.z2 - 0.02, N, { fs: 40, bg: '#fff5f5', fg: '#c92a2a' });
{ const tv = box(0.08, 0.55, 0.9, 0x111111, 8.9, 2.25, 2.4); sign('📺 안전 안내 영상', 0.2, 8.84, 2.25, 2.4, W, { fs: 40, bg: '#1c7ed6', fg: '#ffffff' }); }
// 달릴 때 뒤로 흘러가는 것들 (차선·가로등·표지판)
for (let i = 0; i < 16; i++) for (const z of [-1.55, 4.1]) { const m = slab(2.4, 0.16, 0xffffff, -46 + i * 6, z, 0.05); BUSIN.marks.push({ m, x: -46 + i * 6, span: 96 }); }
for (let i = 0; i < 6; i++) { const g = new THREE.Group(); cyl(0.07, 0.09, 4.6, 0x868e96, 0, 2.3, 0, g); box(0.9, 0.08, 0.14, 0x868e96, 0, 4.6, 0.4, g); g.position.set(-46 + i * 16, 0, -2.05); scene.add(g); BUSIN.marks.push({ m: g, x: -46 + i * 16, span: 96 }); }
['제2경인고속도로', '서울 · 안양 ⬆', '강남순환로', '잠실 · 롯데월드 ⬆'].forEach((t, i) => { const s = sign(t, 0.7, -40 + i * 24, 3.3, -2.17, 0, { fs: 52, bg: '#2b8a3e', fg: '#ffffff' }); BUSIN.marks.push({ m: s, x: -40 + i * 24, span: 96 }); });

// ======================================================================= 북쪽: 롯데월드
// ---------- 지하 1층 통로: 옥외지상주차장 → 웰빙센터(한 층 아래로) → 인솔자 휴게실 → 매표소 → 정문 게이트 ----------
const LW = { gate: [11, -9.6], top: [11, -15], meet: [19.2, -21.2] };
flat(92, 6.7, 0xd9cfc0, 0, -6.1);
wall(54, 4, 0.5, 0xf1e3c6, -19, -9.6); wall(32, 4, 0.5, 0xf1e3c6, 30, -9.6);  // 통로와 광장 사이 벽 (정문 게이트 x 8~14 만 열림)
slab(19, 6.6, 0x555a60, -36.5, -6.1, 0.03);                                // 옥외지상주차장
for (const [x, z, c] of [[-40.4, -7.9, 0x1c7ed6], [-41.2, -4.1, 0xf59f00]]) { const b = busModel(0, c); b.position.set(x, 0, z); b.rotation.y = N; scene.add(b); block(x - 4.2, z - 1.3, x + 4.2, z + 1.3); }
sign('🅿 옥외지상주차장', 0.6, -34, 3.3, -9.33, 0, { bg: '#495057', fg: '#ffffff' });
for (let k = 0; k < 6; k++) slab(0.5, 2.4, 0xffffff, -35.4 + k * 1.0, -6.0, 0.05); // 보행로 표시
// 웰빙센터 입구: 한 층 내려가는 에스컬레이터
for (const z of [-7.6, -4.6]) { cyl(0.18, 0.18, 3.4, 0xc9a227, -26.6, 1.7, z); block(-26.8, z - 0.2, -26.4, z + 0.2); }
box(0.3, 0.6, 3.4, 0xc9a227, -26.6, 3.5, -6.1); sign2('웰빙센터 입구 · 아래층으로 ⬇', 0.42, -26.6, 3.5, -6.1, W, { fs: 44, bg: '#c9a227', fg: '#ffffff' });
const ESC = [];
function escalator(x1, z1, x2, z2, alongX, id) { // 납작하게 그린 에스컬레이터: 검은 발판 + 노란 선 + 손잡이
  const w = Math.abs(x2 - x1), d = Math.abs(z2 - z1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  slab(w, d, 0x343a40, cx, cz, 0.04);
  const n = Math.round((alongX ? w : d) / 0.5);
  for (let i = 0; i <= n; i++) alongX ? slab(0.05, d - 0.3, 0x868e96, x1 + (i / n) * (x2 - x1), cz, 0.05) : slab(w - 0.3, 0.05, 0x868e96, cx, z1 + (i / n) * (z2 - z1), 0.05);
  if (alongX) { for (const z of [z1, z2]) { { const m = wall(w, 1.0, 0.1, 0x9fd3ff, cx, z); m.material = glassM; box(w, 0.1, 0.2, 0x111111, cx, 1.06, z); } slab(w, 0.14, 0xffd43b, cx, z + (z === Math.min(z1, z2) ? 0.28 : -0.28), 0.055); } }
  else { for (const x of [x1, x2]) { { const m = wall(0.1, 1.0, d, 0x9fd3ff, x, cz); m.material = glassM; box(0.2, 0.1, d, 0x111111, x, 1.06, cz); } slab(0.14, d, 0xffd43b, x + (x === Math.min(x1, x2) ? 0.28 : -0.28), cz, 0.055); } }
  ESC.push({ id, x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
}
escalator(-25.4, -7.3, -19.6, -4.9, true, 'down');
block(-25.4, -9.4, -19.6, -7.4); block(-25.4, -4.8, -19.6, -2.6);            // 에스컬레이터 옆으로는 못 지나가요
signPost('노란 선 안에 서서\n손잡이를 잡아요', -26.2, -3.6, E, { fs: 36, bg: '#fff3bf', fg: '#5c4033' });
// 단체 인솔자 휴게실 (정문 게이트 밖)
box(4.4, 3.2, 0.12, 0xa61e4d, -9, 1.6, -2.72); box(2.2, 2.3, 0.14, 0xd4a017, -9, 1.15, -2.76); box(1.8, 1.9, 0.16, 0xa5d8ff, -9, 1.15, -2.8);
sign('TOUR GUIDE LOUNGE · 단체 인솔자 휴게실', 0.34, -9, 2.75, -2.86, N, { fs: 40, bg: '#d4a017', fg: '#5c1a2e' });
// 단체 매표소
solid(8, 3, 1.2, 0xfff3bf, -1, 1.5, -8.9).userData.plain = 1; for (const dx of [-2.4, 0, 2.4]) box(1.5, 1.0, 0.1, 0xa5d8ff, -1 + dx, 1.7, -8.27);
sign('🎫 단체 매표소', 0.5, -1, 3.35, -8.27, 0, { bg: '#e8590c', fg: '#ffffff' });
// 정문 게이트
for (const x of [8, 14]) { const p = solid(0.7, 4.2, 0.7, 0xc9a227, x, 2.1, -9.6); p.userData.plain = 1; }
box(6.6, 0.8, 0.5, 0xc9a227, 11, 4.2, -9.6); sign2('정문 게이트 · MAIN GATE', 0.5, 11, 4.2, -9.33, 0, { fs: 50, bg: '#c9a227', fg: '#ffffff' });
for (const x of [9.5, 11, 12.5]) { cyl(0.12, 0.12, 1.0, 0x868e96, x, 0.5, -9.6); block(x - 0.14, -9.75, x + 0.14, -9.45); }
// 통로 동쪽: 잠실역·백화점 가는 길 (우리 반은 가지 않아요)
wall(0.2, 1.0, 6.5, 0xc92a2a, 21, -6.1); sign('🚇 잠실역 · 백화점 ➡\n우리 반은 이쪽으로 가지 않아요', 0.9, 20.86, 2.3, -6.1, W, { fs: 40, bg: '#fff5f5', fg: '#c92a2a' });
[[23, -4.4, 0x868e96], [25.5, -6.6, 0xe599f7], [28, -5, 0x74c0fc], [31, -7.4, 0xffa94d]].forEach(([x, z, c], i) => figure({ name: 'Walker' + i, adult: true, girl: i % 2 === 1, shirt: c, hair: 0x333333 }, x, z, i % 2 ? W : E));
signPost('버스 타는 곳(주차장) ⬅\n정문 게이트를 바라보고 왼쪽', 6.2, -3.5, N, { fs: 36 });

// ---------- 정문 게이트 안: 1층으로 올라가는 에스컬레이터 → 시계탑 광장 ----------
escalator(9.2, -9.9, 12.8, -13.4, false, 'up');
block(8, -13.4, 9.1, -9.8); block(12.9, -13.4, 14, -9.8);
flat(92, 36.2, 0xeadfce, 0, -27.9);                                         // 1층 광장 바닥
{ const t = solid(1.5, 7.5, 1.5, 0xf1e3c6, 5.6, 3.75, -17); t.userData.plain = 1; const c = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 4), mat(0x1c7ed6)); c.rotation.y = Math.PI / 4; c.position.set(5.6, 8.4, -17); scene.add(c);
   sign('시계탑', 0.4, 5.6, 2.6, -16.22, 0, { fs: 44 }); }
// 가운데 뚫린 곳: 아래층 아이스링크가 내려다보여요 (난간)
const RINKV = { x: -6, z: -25, rx: 11, rz: 6.5 };
{ const ice = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: 0xcfeefc, roughness: 0.35 })); ice.rotation.x = -Math.PI / 2; ice.scale.set(RINKV.rx - 0.5, RINKV.rz - 0.5, 1); ice.position.set(RINKV.x, 0.05, RINKV.z); scene.add(ice);
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 48), mat(0x8d6e63)); rim.rotation.x = -Math.PI / 2; rim.scale.set(RINKV.rx, RINKV.rz, 1); rim.position.set(RINKV.x, 0.06, RINKV.z); scene.add(rim);
  for (const y of [0.55, 1.05]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 6, 64), mat(0xc9a227)); r.rotation.x = Math.PI / 2; r.scale.set(RINKV.rx, RINKV.rz, 5); r.position.set(RINKV.x, y, RINKV.z); scene.add(r); }
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; cyl(0.06, 0.06, 1.1, 0xc9a227, RINKV.x + Math.cos(a) * RINKV.rx, 0.55, RINKV.z + Math.sin(a) * RINKV.rz, scene, 6); }
  for (let i = 0; i < 6; i++) { const z1 = RINKV.z - RINKV.rz + i * (RINKV.rz / 3), zm = z1 + RINKV.rz / 6 - RINKV.z, hw = RINKV.rx * Math.sqrt(Math.max(0, 1 - (zm * zm) / (RINKV.rz * RINKV.rz))) + 0.1; block(RINKV.x - hw, z1, RINKV.x + hw, z1 + RINKV.rz / 3); }
  signPost('난간에 매달리거나\n올라가지 않아요', RINKV.x + 9.2, RINKV.z + 6.2, 0, { fs: 34, bg: '#fff3bf', fg: '#5c4033' }); }
const skaters = [0xf783ac, 0x845ef7, 0x4dabf7].map((c, i) => figure({ name: 'Sk' + i, girl: i !== 2, shirt: c, hair: 0x3b2a1a, scale: 0.6 }, RINKV.x, RINKV.z, 0, 0.06));
// 회전목마 (우리 반 집합 장소)
const CARO = { x: 26, z: -23, spin: new THREE.Group() };
{ // 회전목마: 금빛 받침, 거울 기둥, 줄무늬 지붕과 물결 가장자리, 전구, 목마 12마리
  const C = CARO;
  cyl(4.95, 5.05, 0.16, 0x8d6e63, C.x, 0.08, C.z, scene, 36); { const deck = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.72, 0.22, 36), goldM); deck.position.set(C.x, 0.27, C.z); scene.add(deck); }
  cyl(0.9, 0.9, 4.4, 0xf8f0e3, C.x, 2.55, C.z, scene, 16);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, m = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.3, 0.04), chrome); m.position.set(C.x + Math.cos(a) * 0.9, 2.4, C.z + Math.sin(a) * 0.9); m.rotation.y = -a + Math.PI / 2; m.userData.ns = 1; scene.add(m); }
  for (const y of [0.95, 3.85]) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.07, 8, 24), goldM); b.rotation.x = Math.PI / 2; b.position.set(C.x, y, C.z); scene.add(b); }
  const top = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.4, 24), mat(0x4263eb)); top.position.set(C.x, 6.2, C.z); scene.add(top);
  for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(5.43, 2.4, 24, 1, true, i * Math.PI / 6, Math.PI / 12), mat(0xffffff)); s.position.set(C.x, 6.22, C.z); s.userData.ns = 1; scene.add(s); }
  { const rim = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 0.55, 36, 1, true), new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.5, side: THREE.DoubleSide })); rim.position.set(C.x, 4.75, C.z); scene.add(rim); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2;
    const sc = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(i % 2 ? 0x4263eb : 0xe03131)); sc.position.set(C.x + Math.cos(a) * 5.4, 4.5, C.z + Math.sin(a) * 5.4); sc.userData.ns = 1; scene.add(sc);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), lampM(0xfff3bf, 1.3)); bulb.position.set(C.x + Math.cos(a + 0.13) * 5.45, 4.9, C.z + Math.sin(a + 0.13) * 5.45); bulb.userData.ns = 1; scene.add(bulb); }
  { const fin = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8), goldM); fin.position.set(C.x, 7.55, C.z); scene.add(fin); const fc = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 8), goldM); fc.position.set(C.x, 8.1, C.z); scene.add(fc); }
  C.spin.position.set(C.x, 0.38, C.z); scene.add(C.spin);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, r = i % 2 ? 3.8 : 2.6, h = new THREE.Group(), col = paint([0xffffff, 0xffe3e3, 0xdbe4ff, 0xfff3bf, 0xe5dbff, 0xd3f9d8][i % 6]), acc = mat([0xe03131, 0x1c7ed6, 0x2f9e44, 0xf59f00][i % 4]);
    const body = capsule(0.2, 0.55, col); body.rotation.z = Math.PI / 2; body.position.y = 1.2; h.add(body);
    const neck = capsule(0.13, 0.32, col); neck.position.set(0.42, 1.48, 0); neck.rotation.z = -0.6; h.add(neck);
    const head = capsule(0.11, 0.2, col); head.position.set(0.62, 1.7, 0); head.rotation.z = 1.05; h.add(head);
    for (const dz of [-0.07, 0.07]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), col); e.position.set(0.52, 1.86, dz); h.add(e); }
    const mane = capsule(0.05, 0.36, acc); mane.position.set(0.36, 1.58, 0); mane.rotation.z = -0.6; h.add(mane);
    const tail = capsule(0.05, 0.3, acc); tail.position.set(-0.52, 1.18, 0); tail.rotation.z = 0.7; h.add(tail);
    [[0.3, 0.55], [0.3, -0.35], [-0.28, 0.3], [-0.28, -0.3]].forEach(([dx, rz], k) => { const l = capsule(0.055, 0.42, col); l.position.set(dx + Math.sin(rz) * 0.2, 0.82, k % 2 ? 0.1 : -0.1); l.rotation.z = rz; h.add(l); });
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.36), acc); saddle.position.set(-0.03, 1.42, 0); h.add(saddle);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.2, 6), goldM); pole.position.y = 2.3; h.add(pole);
    h.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); h.rotation.y = -a - Math.PI / 2; h.userData.ph = i * 1.7; h.traverse(o => { o.userData.ns = 1; }); C.spin.add(h);
  }
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; if (Math.abs(a - Math.PI) < 0.3) continue; cyl(0.05, 0.05, 0.9, 0xd4a017, C.x + Math.cos(a) * 5.2, 0.45, C.z + Math.sin(a) * 5.2, scene, 6); }
}
block(CARO.x - 5.1, CARO.z - 5.1, CARO.x + 5.1, CARO.z + 5.1);
sign('🎠 회전목마', 0.6, CARO.x, 3.9, CARO.z + 5.5, 0, { bg: '#4263eb', fg: '#ffffff' }); sign('🎠 회전목마', 0.6, CARO.x - 5.5, 3.9, CARO.z, W, { bg: '#4263eb', fg: '#ffffff' });
cyl(0.07, 0.07, 3.2, 0xe03131, LW.meet[0], 1.6, LW.meet[1]); { const s = textSprite('📍 우리 반 집합 장소\n회전목마 앞 · 2시 50분', 0.95, { fs: 46, bg: '#e03131', fg: '#ffffff' }); s.position.set(LW.meet[0], 3.75, LW.meet[1]); scene.add(s); }
// 만남의 광장 편의시설: 인포메이션(손님상담실) · 의무실 · 미아보호소 · 분실물센터 · 물품보관함  (회전목마를 바라보고 왼쪽)
const FAC = { z: -38, info: [3, -38], aid: [9, -38], lost: [15, -38], found: [20.2, -38] };
{ const b = solid(24, 4.4, 7.4, 0xf3ead7, 11.5, 2.2, -41.75); b.userData.plain = 1;
  for (let x = -0.5; x <= 23.5; x += 3) box(0.22, 4.4, 0.1, 0x5c4033, x, 2.2, -38.02); for (const y of [2.6, 4.3]) box(24, 0.24, 0.1, 0x5c4033, 11.5, y, -38.02);
  const R = new THREE.Mesh(new THREE.ConeGeometry(13.4, 2.4, 4), mat(0xa0522d)); R.rotation.y = Math.PI / 4; R.scale.set(1, 1, 0.36); R.position.set(11.5, 5.6, -41.75); scene.add(R);
  [[FAC.info[0], '❓ 인포메이션\n손님상담실', '#1c7ed6', 0x74c0fc], [FAC.aid[0], '➕ 의무실\nFirst Aid', '#2b8a3e', 0xb2f2bb], [FAC.lost[0], '🧒 미아보호소\nLost Children', '#e8590c', 0xffd8a8], [FAC.found[0], '🎒 분실물센터\nLost & Found', '#5f3dc4', 0xd0bfff]].forEach(([x, t, bg, c]) => { box(1.7, 2.3, 0.12, c, x, 1.15, -38.0); sign(t, 1.05, x, 3.45, -37.94, 0, { fs: 40, bg, fg: '#ffffff' }); });
  sign('만남의 광장', 0.55, 11.5, 5.0, -37.9, 0, { bg: '#c92a2a', fg: '#ffffff' });
  sign('AED ❤', 0.34, 11.2, 1.6, -37.93, 0, { fs: 40, bg: '#ffffff', fg: '#e03131', border: '#e03131' }); }
for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(0.78, 0.6, 0.6, [0x4dabf7, 0xffd43b, 0xff8787][(i + j) % 3], 25.2 + i * 0.82, 0.32 + j * 0.62, -38.4);
block(24.7, -38.8, 28.2, -38.0); sign('🔐 물품보관함', 0.38, 26.4, 2.35, -38.08, 0, { fs: 42 });
// 플라이벤처 (1층 동쪽): 혼자 타려면 140cm 이상
const FLY = { x: 44.6, z: -22 };
{ const b = solid(1.6, 6, 13, 0x5f3dc4, 45, 3, FLY.z); b.userData.plain = 1; box(0.14, 2.6, 2.4, 0x1c1c3a, 44.14, 1.3, FLY.z); sign('✈ 플라이벤처 FLY VENTURE', 0.75, 44.1, 4.6, FLY.z, W, { bg: '#1c1c3a', fg: '#ffe066', fs: 52 }); }
function heightGauge(x, z, ry, lines, marks) { // 키 재는 판
  const g = new THREE.Group(); box(0.5, 2.1, 0.08, 0xffffff, 0, 1.05, 0, g); for (const [cm, c] of marks) box(0.56, 0.06, 0.1, c, 0, cm / 100, 0, g);
  const t = textPlane(lines, 0.9, { fs: 38, bg: '#fff3bf', fg: '#c92a2a', border: '#c92a2a' }, g); t.position.set(1.15, 1.5, 0.02);
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g;
}
heightGauge(42.6, -18.6, W, '키 140cm 이상: 혼자 탑승\n120~140cm: 보호자와 함께', [[140, 0xe03131], [120, 0xf59f00]]);
// 버거베어 (회전목마 옆, 밀쿠폰 사용 가능) · 간식 가게 (밀쿠폰 안내 없음)
const FOOD = { ok: [34, -14.6], no: [20.5, -13.8] };
{ const b = solid(12, 4, 2.3, 0xffc078, 34, 2, -10.95); b.userData.plain = 1; box(12.2, 0.5, 2.6, 0xc92a2a, 34, 4.2, -11);
  sign('🍔 버거베어 BURGER BEAR', 0.62, 34, 3.4, -12.12, N, { bg: '#c92a2a', fg: '#ffffff', fs: 50 }); for (const dx of [-3, 0, 3]) box(2.2, 1.1, 0.1, 0xfff3bf, 34 + dx, 1.7, -12.11);
  box(1.3, 1.7, 0.06, 0xf06595, 28.9, 1.5, -12.12); sign('밀쿠폰 12,000원\n사용 가능', 1.0, 28.9, 1.5, -12.16, N, { fs: 40, bg: '#fff0f6', fg: '#1c3fa8', border: '#f06595' }); }
{ const g = grp(FOOD.no[0], -11.6); box(2.4, 1, 1.2, 0xff8787, 0, 0.5, 0, g); cyl(0.05, 0.05, 2.6, 0x868e96, 0, 1.6, 0, g); const c = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.7, 10), mat(0xffe066)); c.position.y = 3.05; g.add(c);
  const t = textPlane('🥨 츄러스 · 팝콘 (간식)', 0.36, { fs: 42, bg: '#ffffff', fg: '#c92a2a' }, g); t.position.set(0, 1.35, -0.62); t.rotation.y = N; block(FOOD.no[0] - 1.3, -12.3, FOOD.no[0] + 1.3, -10.9); }
for (const [x, z] of [[30, -16.6], [34.5, -17.2], [38.6, -16.4]]) prop(parasolTable, x, z, 0xff6b6b);
// 화장실 · 손 씻는 곳 / 비상구 / 엘리베이터 (동쪽·북쪽 벽)
const SPOTS = { wash: [42.6, -34], exit: [42.8, -42], lift: [36, -43.6], exit2: [-8, -43.8] };
box(0.14, 2.4, 3.2, 0x74c0fc, 45.6, 1.2, -34); sign('🚻 화장실 · 손 씻는 곳', 0.5, 45.5, 3.1, -34, W, { fs: 44, bg: '#1c7ed6', fg: '#ffffff' });
for (const dz of [-1, 0, 1]) { box(0.5, 0.2, 0.7, 0xffffff, 45.2, 0.95, -34 + dz); cyl(0.03, 0.03, 0.3, 0xadb5bd, 45.35, 1.2, -34 + dz); } block(44.8, -35.6, 45.8, -32.4);
box(0.14, 2.5, 1.9, 0x2f9e44, 45.6, 1.25, -42); sign('🟩 비상구 EXIT', 0.5, 45.5, 3.1, -42, W, { fs: 48, bg: '#2f9e44', fg: '#ffffff' });
box(1.9, 2.5, 0.14, 0x2f9e44, -8, 1.25, -45.6); sign('🟩 비상구 EXIT', 0.5, -8, 3.1, -45.5, 0, { fs: 48, bg: '#2f9e44', fg: '#ffffff' });
box(2.2, 2.6, 0.14, 0xadb5bd, 36, 1.3, -45.6); box(0.06, 2.6, 0.16, 0x495057, 36, 1.3, -45.55); sign('🛗 엘리베이터', 0.45, 36, 3.1, -45.5, 0, { fs: 44, bg: '#495057', fg: '#ffffff' });
for (let k = 0; k < 6; k++) slab(0.5, 0.25, 0x2f9e44, 39.4 + k * 0.9, -42, 0.05); // 바닥 대피 유도선
// 후룸라이드 (1층 남서쪽) · 리뉴얼 운휴 중인 스페인해적선 · 가든스테이지
const FLUME = { x: -27, z: -12.6, boat: null };
slab(13, 3.0, 0x4dabf7, FLUME.x, -11.6, 0.035); wall(13, 0.7, 0.2, 0x8d6e63, FLUME.x, -13.2);
{ const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.8 }); // 통나무 보트
  const log = capsule(0.46, 1.5, wood); log.rotation.z = Math.PI / 2; log.position.y = 0.42; g.add(log); box(1.7, 0.3, 0.62, 0x4a2d12, 0, 0.74, 0, g);
  for (const x of [-0.5, 0.15]) box(0.08, 0.36, 0.56, 0x6b4423, x, 0.95, 0, g);
  { const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 14), mat(0xdeb887)); nose.rotation.z = Math.PI / 2; nose.position.set(1.22, 0.42, 0); g.add(nose); }
  FLUME.boat = g; g.position.set(FLUME.x, 0, -11.6); scene.add(g); }
sign('🚣 후룸라이드 FLUME RIDE', 0.6, FLUME.x, 3.3, -13.3, N, { bg: '#1971c2', fg: '#ffffff', fs: 50 }); for (const dx of [-5, 5]) cyl(0.08, 0.08, 3.3, 0x868e96, FLUME.x + dx, 1.65, -13.3);
heightGauge(-19.6, -13.9, N, '키 110cm 이상\n물이 많이 튀어요', [[110, 0xe03131]]);
const SHIP = { spot: [-36.6, -19] };
for (const [w, d, x, z] of [[8, 0.2, -42, -22.6], [0.2, 7.2, -38, -19]]) wall(w, 2.4, d, 0xf8f9fa, x, z);
sign('🚧 스페인해적선\n리뉴얼 중 · 운휴', 1.2, -37.86, 1.6, -19, E, { fs: 40, bg: '#fff3bf', fg: '#c92a2a', border: '#c92a2a' });
{ const m = cyl(0.12, 0.12, 5, 0x868e96, -42.5, 2.5, -18.5); const s = box(3.6, 0.9, 1.2, 0x8d5524, -42.5, 3.2, -18.5); s.rotation.z = 0.25; }
const STAGE = { x: -29.5, z: -27, crowd: [-21.2, -22.2] };
solid(9, 0.8, 4.6, 0x8d6e63, STAGE.x, 0.4, STAGE.z).userData.plain = 1; wall(9, 4.2, 0.4, 0x2f7d4f, STAGE.x, STAGE.z - 2.5);
sign('🎭 가든스테이지', 0.6, STAGE.x, 3.4, STAGE.z - 2.26, 0, { bg: '#2f7d4f', fg: '#ffffff' });
[[0, 0], [1.5, 0.6], [-1.4, 0.9], [0.5, 1.9], [-0.7, -1.3], [2.3, -0.9], [-2.4, -0.5], [1.2, -2.2]].forEach(([dx, dz], i) => figure({ name: 'Crowd' + i, adult: i % 3 === 0, girl: i % 2 === 0, shirt: [0xff8787, 0x74c0fc, 0xffd43b, 0x8ce99a, 0xe599f7][i % 5], hair: 0x333333, scale: i % 3 ? 0.88 : 1.08 }, -22.6 + dx, -26.4 + dz, W));
// ---------- 매직아일랜드 (야외): 1층 서쪽 끝 → 2층 → 다리 ----------
const MI = { gate: [-42, -31.2], drop: [-24.6, -41], ring: null, aid: [-43.6, -43.6] };
wall(1.8, 4, 0.5, 0xf1e3c6, -45.1, -32.6); wall(19.8, 4, 0.5, 0xf1e3c6, -29.9, -32.6); wall(0.5, 4, 13.6, 0xf1e3c6, -20, -39.4);
escalator(-44.0, -29.2, -40.0, -32.4, false, 'mi');
box(4.6, 0.7, 0.5, 0x1c3fa8, -42, 3.9, -32.6); sign('Magic Island · 매직아일랜드 (2층 → 다리)', 0.42, -42, 3.9, -32.33, 0, { fs: 42, bg: '#1c3fa8', fg: '#ffffff' });
slab(4.4, 3.4, 0xb08968, -42, -34.6, 0.03); for (const x of [-44.2, -39.8]) wall(0.14, 1.0, 3.4, 0x8d6e63, x, -34.6); // 다리
slab(19.6, 3.4, 0x4dabf7, -29.9, -34.6, 0.02); slab(1.8, 3.4, 0x4dabf7, -45.1, -34.6, 0.02); block(-39.7, -36.3, -20, -32.9); block(-46, -36.3, -44.3, -32.9); // 석촌호수 물
slab(26, 9.7, 0xd6d0c4, -33, -41.15, 0.02);
{ solid(7, 4.6, 2, 0xf8f9fa, -34, 2.3, -44.6).userData.plain = 1; for (const [dx, h] of [[-3.2, 7.5], [0, 9.5], [3.2, 7.5]]) { cyl(0.9, 0.9, h, 0xf8f9fa, -34 + dx, h / 2, -44.6, scene, 12); const c = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.4, 12), mat(0x4263eb)); c.position.set(-34 + dx, h + 1.2, -44.6); scene.add(c); }
  box(1.6, 2.2, 0.1, 0x5c4033, -34, 1.1, -43.58); sign('🏰 매직캐슬', 0.5, -34, 3.2, -43.56, 0, { bg: '#4263eb', fg: '#ffffff' }); }
{ // 자이로드롭: 줄무늬 탑, 네 줄 레일, 꼭대기 장식, 바깥을 보고 앉는 의자 16개가 달린 고리
  const X = MI.drop[0], Z = MI.drop[1], steel = new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.4, metalness: 0.5 });
  cyl(3.0, 3.2, 0.3, 0x868e96, X, 0.15, Z, scene, 8);
  { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 22, 18), steel); col.position.set(X, 11, Z); scene.add(col); }
  for (let k = 0; k < 6; k++) { const rr = 0.97 - k * 0.035, b = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 1.4, 18), mat(k % 2 ? 0xe03131 : 0x1c7ed6)); b.position.set(X, 2.2 + k * 3.7, Z); scene.add(b); }
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.78, r = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 21.4, 6), mat(0xffd43b)); r.position.set(X + Math.cos(a) * 1.02, 10.9, Z + Math.sin(a) * 1.02); r.userData.ns = 1; scene.add(r); }
  { const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.9, 1.2, 12), mat(0xe03131)); crown.position.set(X, 22.6, Z); scene.add(crown); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 10), mat(0xffd43b)); tip.position.set(X, 24.3, Z); scene.add(tip); }
  const ring = new THREE.Group(), hoop = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.22, 10, 28), paint(0xffd43b)); hoop.rotation.x = Math.PI / 2; ring.add(hoop);
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, s = new THREE.Group(); box(0.42, 0.1, 0.4, 0x1c3fa8, 0, -0.25, 0.22, s); box(0.42, 0.62, 0.1, 0x1c3fa8, 0, 0.05, 0.02, s); box(0.34, 0.08, 0.3, 0xe03131, 0, 0.2, 0.26, s); s.position.set(Math.sin(a) * 2.0, 0, Math.cos(a) * 2.0); s.rotation.y = a; ring.add(s); }
  ring.position.set(X, 2, Z); ring.traverse(o => { o.userData.ns = 1; }); scene.add(ring); MI.ring = ring;
  block(X - 2.8, Z - 2.8, X + 2.8, Z + 2.8); sign2('🗼 자이로드롭', 0.55, X - 3.6, 3.1, Z + 3.1, 0, { bg: '#e03131', fg: '#ffffff' }); }
heightGauge(-28.6, -37.6, 0, '키 130~190cm\n소지품은 모두 보관함에', [[130, 0xe03131], [190, 0xe03131]]);
solid(2.6, 2.8, 2.2, 0xf8f9fa, -44.4, 1.4, -44.6).userData.plain = 1; sign('➕ 의무실 (야외)', 0.42, -44.4, 3.15, -43.48, 0, { fs: 42, bg: '#2b8a3e', fg: '#ffffff' });
signPost('아트란티스 ➡ (키 135~190cm)\n문보트 탑승장 ⬅', -31.2, -37.1, 0, { fs: 34 });
signPost('🧥 밖은 추워요! 겉옷을 입고\n젖은 바닥에서는 천천히', -38.6, -30.2, 0, { fs: 34, bg: '#e7f5ff', fg: '#1864ab', border: '#1864ab' });
prop(balloons, 6.5, -14.2, [0xe03131, 0xffffff, 0x2f9e44]); prop(balloons, 20.4, -30.5, [0xffd43b, 0xf783ac, 0x74c0fc]); prop(gifts, 6, -31); prop(gifts, 31.5, -31.4);
bunting(-17, -17.5, 5, -17.5, 4.4, [0xe03131, 0xffffff, 0x2f9e44]); lanternLine(17, -30.5, 35, -30.5, 4.6, [0xe03131, 0xffd43b, 0x2f9e44]);

// ---------- 실제 롯데월드 어드벤처 느낌: 유리 돔 · 풍선비행 · 모노레일 · 유럽풍 거리 · 풍차건물 ----------
const LWFX = { balloons: [], train: [], blades: null, swing: null, RX: 34, RZ: 13.2, cz: -27.6 };
{ // 유리 돔 (철골 격자 + 옅은 유리)
  const g = new THREE.SphereGeometry(30, 24, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  const wire = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xf1f6fa, wireframe: true, transparent: true, opacity: 0.55 }));
  const glass = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xbfe3f5, transparent: true, opacity: 0.09, side: THREE.BackSide, depthWrite: false }));
  for (const m of [wire, glass]) { m.scale.set(1.56, 0.4, 0.66); m.position.set(0, 13.2, -27.8); m.userData.ns = 1; scene.add(m); }
}
// 풍선비행: 돔 아래를 천천히 도는 열기구
[[0xe03131, 0xffffff], [0x1c7ed6, 0xffd43b], [0x2f9e44, 0xffffff], [0xf06595, 0xffe066]].forEach(([c1, c2], i) => {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), mat(c1)); top.scale.y = 1.15; top.position.y = 2.6; g.add(top);
  for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1.52, 4, 10, k * Math.PI / 3, Math.PI / 6), mat(c2)); s.scale.y = 1.15; s.position.y = 2.6; g.add(s); }
  const neck = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.0, 10, 1, true), mat(c1)); neck.rotation.x = Math.PI; neck.position.y = 0.95; g.add(neck);
  box(0.7, 0.5, 0.7, 0x8d5524, 0, 0, 0, g); for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) cyl(0.015, 0.015, 0.8, 0x5c4033, dx, 0.6, dz, g, 4);
  g.traverse(o => { o.userData.ns = 1; }); scene.add(g); LWFX.balloons.push({ g, a: i * Math.PI / 2 });
});
// 월드모노레일: 광장 위를 한 바퀴 도는 높은 선로와 열차
{ const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.011, 6, 90), mat(0x4263eb)); r.rotation.x = Math.PI / 2; r.scale.set(LWFX.RX, LWFX.RZ, 16); r.position.set(0, 8.2, LWFX.cz); r.userData.ns = 1; scene.add(r);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.31, x = Math.cos(a) * LWFX.RX, z = LWFX.cz + Math.sin(a) * LWFX.RZ; if (clearAt(x, z, 0.6) && Math.hypot(x - CARO.x, z - CARO.z) > 9.5 && Math.hypot(x - 11, z + 15) > 6 && Math.hypot(x - RINKV.x, z - RINKV.z) > 14) { cyl(0.22, 0.28, 8.1, 0xdfe3e6, x, 4.05, z, scene, 8); block(x - 0.25, z - 0.25, x + 0.25, z + 0.25); } }
  [0xffffff, 0xe03131, 0xffffff].forEach((c, k) => { const car = new THREE.Group(); { const b = capsule(0.58, 1.4, paint(c)); b.rotation.z = Math.PI / 2; b.position.y = 0.8; car.add(b); box(1.5, 0.4, 1.18, darkGlass, 0, 0.98, 0, car); box(1.9, 0.12, 1.19, 0xe03131, 0, 0.55, 0, car); } car.traverse(o => { o.userData.ns = 1; }); scene.add(car); LWFX.train.push({ g: car, k }); }); }
// 유럽풍 집 (광장 둘레)
function euroHouse(x, z, w, h, wallC, roofC, ry) {
  const g = grp(x, z, ry), d = 2.0;
  box(w, h, d, wallC, 0, h / 2, 0, g);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1, 4), mat(roofC)); roof.rotation.y = Math.PI / 4; roof.scale.set(w, 2.2, d + 0.5); roof.position.y = h + 1.1; g.add(roof);
  for (const y of [h * 0.48, h - 0.12]) box(w + 0.04, 0.16, 0.08, 0x5c4033, 0, y, d / 2 + 0.03, g);
  for (const dx of [-w / 2 + 0.1, 0, w / 2 - 0.1]) box(0.16, h, 0.08, 0x5c4033, dx, h / 2, d / 2 + 0.03, g);
  for (const dx of [-w / 4, w / 4]) { const wn = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.08), new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffc94d, emissiveIntensity: 0.55 })); wn.position.set(dx, h * 0.74, d / 2 + 0.05); g.add(wn); }
  box(0.9, 1.7, 0.08, 0x7a4a1e, -w / 4, 0.85, d / 2 + 0.05, g); { const sh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.08), new THREE.MeshStandardMaterial({ color: 0xd0ebff, emissive: 0x74c0fc, emissiveIntensity: 0.25 })); sh.position.set(w / 4, 1.1, d / 2 + 0.05); g.add(sh); }
  const hw = (Math.abs(Math.sin(ry)) > 0.5 ? d : w) / 2, hd = (Math.abs(Math.sin(ry)) > 0.5 ? w : d) / 2; block(x - hw, z - hd, x + hw, z + hd);
  return g;
}
[ // [x, z, 너비, 높이, 벽색, 지붕색, 보는 쪽]
  [-17, -44.6, 4.2, 4.6, 0xfff3bf, 0xc92a2a, 0], [-12.6, -44.6, 3.8, 5.4, 0xffd8a8, 0x1c7ed6, 0], [-3.6, -44.6, 4.4, 4.8, 0xf8f0e3, 0x2f9e44, 0],
  [30.6, -44.6, 4.4, 5.2, 0xffe3e3, 0x5f3dc4, 0], [41.2, -44.6, 4.0, 4.6, 0xfff3bf, 0xc92a2a, 0],
  [-15, -10.9, 4.2, 4.6, 0xffe8cc, 0x1c7ed6, N], [-9.8, -10.9, 4.0, 5.2, 0xf8f0e3, 0xc92a2a, N], [-4.4, -10.9, 4.2, 4.4, 0xd3f9d8, 0x8d5524, N], [1.6, -10.9, 4.4, 5.0, 0xfff3bf, 0x5f3dc4, N],
  [24.4, -10.9, 3.6, 4.6, 0xffdeeb, 0x2f9e44, N], [-44.6, -25.6, 4.2, 5.0, 0xffe8cc, 0xc92a2a, E], [44.6, -38, 3.6, 4.6, 0xd0ebff, 0x1c7ed6, W]
].forEach(a => euroHouse(...a));
for (const [x, z] of [[8.2, -21], [17.4, -28.6], [-20.4, -17.6], [-18.6, -33.4], [31.6, -29.4], [39.6, -17.6], [14.6, -33], [-2.4, -33.6], [20.6, -15]]) prop(lampPost2, x, z);
// 풍차건물 (배틀그라운드 월드 에이전트: 키 130cm 이상)
{ const X = 38.6, Z = -35.8; cyl(1.5, 2.1, 6.2, 0xf1e3c6, X, 3.1, Z, scene, 10); const c = new THREE.Mesh(new THREE.ConeGeometry(1.9, 2, 10), mat(0x8d5524)); c.position.set(X, 7.2, Z); scene.add(c); block(X - 1.9, Z - 1.9, X + 1.9, Z + 1.9);
  const hub = new THREE.Group(); hub.position.set(X - 1.75, 5.4, Z); for (let k = 0; k < 4; k++) { const b = box(0.08, 3.6, 0.8, 0xffffff, 0, 1.9, 0, hub); const arm = new THREE.Group(); arm.add(b); arm.rotation.x = k * Math.PI / 2; hub.add(arm); } scene.add(hub); LWFX.blades = hub;
  sign('풍차건물 · 배틀그라운드\n키 130cm 이상', 0.9, X - 2.2, 2.1, Z + 1.2, W, { fs: 38, bg: '#1c1c3a', fg: '#ffe066' }); }
// 매직아일랜드: 매직캐슬 꾸미기 · 자이로스윙
for (const [dx, h] of [[-5.2, 5.6], [5.2, 5.6], [-1.6, 11.5], [1.6, 11.5]]) { cyl(0.6, 0.6, h, 0xf8f9fa, -34 + dx, h / 2, -44.9, scene, 10); const c = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.9, 10), mat(0x364fc7)); c.position.set(-34 + dx, h + 0.95, -44.9); scene.add(c); cyl(0.02, 0.02, 0.9, 0xc9a227, -34 + dx, h + 2.3, -44.9); box(0.5, 0.26, 0.02, 0xe03131, -34 + dx + 0.27, h + 2.55, -44.9); }
for (let k = 0; k < 7; k++) box(0.5, 0.5, 0.5, 0xf8f9fa, -37 + k, 4.85, -43.7);
{ const X = -41, Z = -39.6; for (const s of [-1, 1]) { const leg = cyl(0.16, 0.2, 8.2, 0x1c7ed6, X, 3.9, Z + s * 1.5); leg.rotation.x = s * 0.36; } box(0.5, 0.5, 3.4, 0x1c7ed6, X, 7.7, Z);
  const arm = new THREE.Group(); arm.position.set(X, 7.6, Z); cyl(0.12, 0.12, 5.4, 0xffd43b, 0, -2.7, 0, arm); const disc = cyl(1.5, 1.5, 0.35, 0xe03131, 0, -5.4, 0, arm, 18); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; box(0.3, 0.5, 0.3, 0x343a40, Math.cos(a) * 1.3, -5.05, Math.sin(a) * 1.3, arm); }
  scene.add(arm); LWFX.swing = arm; block(X - 0.5, Z - 1.9, X + 0.5, Z + 1.9); sign('자이로스윙\n키 130~190cm', 0.7, X + 0.8, 1.5, Z + 2.4, 0, { fs: 38, bg: '#1c7ed6', fg: '#ffffff' }); }

// ======================================================================= 디자인 손질 (겉면 그림 · 실내 2~3층 벽 · 통로 · 버스 · 운동장)
function canvasTex(cw, ch, draw) { const c = document.createElement('canvas'); c.width = cw; c.height = ch; draw(c.getContext('2d'), cw, ch); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
// 유럽풍 2층 집이 이어진 겉면 (집 4채 = 12m)
const euroTex = canvasTex(768, 512, (x, W, H) => {
  const cols = ['#fbe9c6', '#f7d9d0', '#dcebf5', '#f3e2b3'], roofs = ['#b5432e', '#3b5bdb', '#2f7d4f', '#7a4a1e'];
  for (let i = 0; i < 4; i++) {
    const x0 = i * W / 4, hw = W / 4;
    x.fillStyle = cols[i]; x.fillRect(x0, 0, hw, H);
    x.fillStyle = roofs[i]; x.beginPath(); x.moveTo(x0, 70); x.lineTo(x0 + hw / 2, 6); x.lineTo(x0 + hw, 70); x.closePath(); x.fill(); x.fillRect(x0, 62, hw, 12);
    x.strokeStyle = '#6b4a2f'; x.lineWidth = 7; x.strokeRect(x0 + 3, 74, hw - 6, H - 78); x.beginPath(); x.moveTo(x0, 292); x.lineTo(x0 + hw, 292); x.stroke();
    for (const y of [124, 336]) for (const dx of [0.27, 0.73]) {
      const cx = x0 + hw * dx, ww = 50, wh = 88;
      x.fillStyle = '#5c4033'; x.fillRect(cx - ww / 2 - 5, y - 5, ww + 10, wh + 10); x.beginPath(); x.arc(cx, y, ww / 2 + 5, Math.PI, 0); x.fill();
      const g = x.createLinearGradient(0, y - 20, 0, y + wh); g.addColorStop(0, '#fff3bf'); g.addColorStop(1, '#ffc94d'); x.fillStyle = g; x.fillRect(cx - ww / 2, y, ww, wh); x.beginPath(); x.arc(cx, y, ww / 2, Math.PI, 0); x.fill();
      x.strokeStyle = '#5c4033'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, y - 24); x.lineTo(cx, y + wh); x.moveTo(cx - ww / 2, y + wh / 2); x.lineTo(cx + ww / 2, y + wh / 2); x.stroke();
      x.fillStyle = '#2f7d4f'; x.fillRect(cx - ww / 2 - 8, y + wh + 6, ww + 16, 10); x.fillStyle = ['#e03131', '#f783ac', '#ffd43b'][(i + (y > 200 ? 1 : 0)) % 3]; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx - ww / 2 + k * (ww / 4), y + wh + 4, 6, 0, 7); x.fill(); }
    }
    x.strokeStyle = '#3b2a1a'; x.lineWidth = 4;
    for (const y of [258, 472]) { x.beginPath(); x.moveTo(x0 + 8, y); x.lineTo(x0 + hw - 8, y); x.moveTo(x0 + 8, y + 26); x.lineTo(x0 + hw - 8, y + 26); x.stroke(); for (let k = 0; k <= 8; k++) { x.beginPath(); x.moveTo(x0 + 8 + k * (hw - 16) / 8, y); x.lineTo(x0 + 8 + k * (hw - 16) / 8, y + 26); x.stroke(); } }
  }
});
// 길가 건물 겉면 (건물 3채 = 12m)
const cityTex = canvasTex(768, 512, (x, W, H) => {
  const cols = ['#d9cdbb', '#c9d1d9', '#e3d5c5'];
  for (let i = 0; i < 3; i++) {
    const x0 = i * W / 3, bw = W / 3;
    x.fillStyle = cols[i]; x.fillRect(x0, 0, bw, H); x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(x0, 0, bw, 16); x.fillRect(x0 + bw - 5, 0, 5, H);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const wx = x0 + 26 + c * 76, wy = 44 + r * 112; x.fillStyle = '#51606f'; x.fillRect(wx - 3, wy - 3, 62, 76); x.fillStyle = (r + c + i) % 4 === 0 ? '#ffe9a8' : '#a9c5dd'; x.fillRect(wx, wy, 56, 70); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(wx, wy, 56, 22); x.fillStyle = '#51606f'; x.fillRect(wx + 26, wy, 3, 70); }
  }
});
// 벽 위에 얹는 윗부분(상자). 큰 두 면에 겉면 그림. (위에서 보는 2.5D 에서는 가리면 사라져요)
function upperWall(x1, z1, x2, z2, y0, y1, tex, tile) {
  const along = Math.abs(x2 - x1) > Math.abs(z2 - z1), len = along ? Math.abs(x2 - x1) : Math.abs(z2 - z1), h = y1 - y0;
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(len / tile, 1);
  const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }), side = mat(0xe9dcc3);
  const m = new THREE.Mesh(new THREE.BoxGeometry(along ? len : 1, h, along ? 1 : len), along ? [side, side, side, side, face, face] : [face, face, side, side, side, side]);
  m.position.set((x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2); m.userData.plain = 1; scene.add(m); return m;
}
// ----- 석정로 건너편: 높이가 다른 건물들 -----
[[-46, -34, 9], [-34, -22, 11.5], [-22, -10, 8], [-10, 2, 12.5], [2, 14, 9.5], [14, 26, 11], [26, 38, 8.5], [38, 46, 10.5]].forEach(([a, b, h]) => upperWall(a, 4.8, b, 4.8, 4.5, h, cityTex, 12));
// ----- 운동장 -----
for (const z of [32.5, 33.3, 34.1]) slab(30, 0.1, 0xffffff, 9, z, 0.045);                       // 달리기 줄
for (const [x, z] of [[-6.5, 32.6], [25.4, 32.9], [-27.6, 37], [-27.6, 41.6]]) wtree(x, z, 1.15);
{ const X = -23, Z = 39.6; for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(0.05, 0.05, 2.2, 0xe03131, X + dx, 1.1, Z + dz, scene, 6);   // 정글짐
  for (const y of [0.75, 1.45, 2.15]) { for (const dz of [-1, 1]) box(2, 0.06, 0.06, 0x1c7ed6, X, y, Z + dz); for (const dx of [-1, 1]) box(0.06, 0.06, 2, 0xffd43b, X + dx, y, Z); } block(X - 1.1, Z - 1.1, X + 1.1, Z + 1.1); }
{ const X = -17.6, Z = 40; box(1.2, 0.1, 1.2, 0x2f9e44, X, 1.7, Z); for (const [dx, dz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) cyl(0.05, 0.05, 1.7, 0x868e96, X + dx, 0.85, Z + dz, scene, 6);   // 미끄럼틀
  const sl = box(0.9, 0.08, 3.2, 0xffd43b, X, 0.92, Z - 2.05); sl.rotation.x = -0.52; block(X - 0.7, Z - 3.6, X + 0.7, Z + 0.7); }
for (const [x, c] of [[-10, 0xff8787], [-6, 0xffd43b], [6, 0x74c0fc], [10, 0xf783ac]]) { box(2.6, 0.45, 0.7, 0xb08968, x, 0.22, 42.9); for (let k = 0; k < 4; k++) ball(0.22, k % 2 ? 0x2f9e44 : c, x - 0.9 + k * 0.6, 0.6, 42.9); }   // 본관 앞 화단
for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) box(2.2, 1.2, 0.08, 0x9fb7cf, UNI.x - 12.25 + i * 3.5, 3 + j * 2.6, 31.24); // 대학원 뒷면 창
for (const [x, z] of [[29.9, 45], [30, 24]]) prop(lampPost2, x, z);
// ----- 달리는 버스: 창·천장 뼈대·선반, 길가 방음벽 -----
for (let x = -7.5; x <= 7.5; x += 3) for (const z of [BUSIN.z1, BUSIN.z2]) { if (z === BUSIN.z2 && x > 5) continue; const g = new THREE.Mesh(new THREE.BoxGeometry(2.86, 1.4, 0.04), new THREE.MeshStandardMaterial({ color: 0xbfe3f5, transparent: true, opacity: 0.2, depthWrite: false })); g.position.set(x, 1.75, z); g.userData.ns = 1; scene.add(g); }
for (let x = -9; x <= 9; x += 3) box(0.08, 0.08, 4.0, 0xadb5bd, x, 2.5, BUSIN.zc);
for (const z of [BUSIN.z1 + 0.32, BUSIN.z2 - 0.32]) box(17.6, 0.06, 0.5, 0xdee2e6, 0, 2.25, z);
{ const l = new THREE.Mesh(new THREE.BoxGeometry(16, 0.05, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3bf, emissiveIntensity: 0.9 })); l.position.set(-0.5, 2.5, BUSIN.zc); l.userData.ns = 1; scene.add(l); }
for (const z of [-2.12, 4.52]) { box(92, 2.0, 0.1, 0x8fa3ad, 0, 1.0, z); const p = new THREE.Mesh(new THREE.BoxGeometry(92, 1.5, 0.06), new THREE.MeshStandardMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.55 })); p.position.set(0, 2.75, z); scene.add(p); box(92, 0.12, 0.14, 0xffffff, 0, 3.55, z); }
// ----- 롯데월드 지하 1층 통로: 천장·조명·가게·안내판 -----
for (const cx of [-14, 10, 34]) { const c = box(24, 0.25, 6.7, 0xf8f0e3, cx, 4.75, -6.1); c.userData.ns = 1; }
for (let x = -23; x <= 43; x += 6) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3bf, emissiveIntensity: 1 })); l.position.set(x, 4.6, -6.1); l.userData.ns = 1; scene.add(l); }
[[-16, '🎁 기념품 가게', 0xe8590c], [-2.4, '☕ 카페', 0x2f9e44], [11.6, '📷 사진관', 0x5f3dc4], [17.4, '🧸 캐릭터 숍', 0xd6336c]].forEach(([x, name, c]) => {
  box(5, 0.24, 0.9, c, x, 3.05, -3.05); for (let k = 0; k < 5; k++) box(0.5, 0.26, 0.92, 0xffffff, x - 2 + k, 3.05, -3.05);
  const g = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.3, 0.08), new THREE.MeshStandardMaterial({ color: 0xd0ebff, emissive: 0xfff3bf, emissiveIntensity: 0.35 })); g.position.set(x, 1.3, -2.66); scene.add(g);
  box(4.6, 0.3, 0.12, 0x5c4033, x, 0.15, -2.68); for (const dx of [-2.25, 0, 2.25]) box(0.12, 2.6, 0.12, 0x5c4033, x + dx, 1.3, -2.68);
  sign(name, 0.44, x, 3.62, -2.7, N, { fs: 44, bg: '#ffffff', fg: '#333333' });
});
sign('⬆ 단체 매표소 · 정문 게이트', 0.5, -17.6, 4.05, -6.1, W, { fs: 46, bg: '#1c3fa8', fg: '#ffffff' });
sign('⬆ 버스 타는 곳 (주차장)', 0.5, 4.6, 4.05, -6.1, E, { fs: 46, bg: '#1c3fa8', fg: '#ffffff' });
for (const x of [-12, 0.5, 18]) bunting(x, -9.2, x, -3.0, 4.2, [0xe03131, 0xffffff, 0x2f9e44]);
for (const [x, t, c] of [[-13, '🎠 회전목마', '#4263eb'], [-6.2, '🗼 자이로드롭', '#e03131'], [3.6, '🚣 후룸라이드', '#1971c2'], [17.6, '✈ 플라이벤처', '#5f3dc4']]) sign(t, 0.5, x, 2.3, -9.33, 0, { fs: 44, bg: c, fg: '#ffffff', border: '#ffffff' });
// ----- 1층 광장: 2~3층 벽(유럽풍 집) · 지붕 띠 · 모서리 탑 -----
[[-46, -9.6, -19, -9.6], [-19, -9.6, 8, -9.6], [14, -9.6, 46, -9.6], [45.6, -46, 45.6, -9.6], [-20, -45.6, 2, -45.6], [2, -45.6, 24, -45.6], [24, -45.6, 46, -45.6], [-45.6, -32.6, -45.6, -9.6]].forEach(([x1, z1, x2, z2]) => {
  upperWall(x1, z1, x2, z2, 4.05, 13, euroTex, 12);
  const along = Math.abs(x2 - x1) > 1, len = along ? Math.abs(x2 - x1) : Math.abs(z2 - z1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const r = box(along ? len : 1.7, 0.5, along ? 1.7 : len, 0x8d4b2e, cx, 13.25, cz); r.userData.ns = 1;
});
upperWall(8, -9.6, 14, -9.6, 5.2, 13, euroTex, 12); box(6, 0.5, 1.7, 0x8d4b2e, 11, 13.25, -9.6);
sign('롯데월드 어드벤처', 0.7, 11, 5.9, -9.04, 0, { fs: 56, bg: '#7a1f3d', fg: '#ffe066' }); sign('나가는 곳 · 정문 게이트', 0.6, 11, 5.9, -10.16, N, { fs: 50, bg: '#7a1f3d', fg: '#ffe066' });
for (const [x, z] of [[45.2, -45.2], [45.2, -10], [-45.2, -10]]) { cyl(1.3, 1.3, 15.5, 0xf8f0e3, x, 7.75, z, scene, 12); const c = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.2, 12), mat(0x364fc7)); c.position.set(x, 17.1, z); scene.add(c); }

// ----- 모델 덧붙이기: 시계, 좌석 머리받이, 성 -----
{ const clockTex = canvasTex(256, 256, (x) => { x.fillStyle = '#fffdf5'; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill(); x.lineWidth = 12; x.strokeStyle = '#c9a227'; x.stroke(); x.fillStyle = '#3b2a1a';
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; x.beginPath(); x.arc(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96, k % 3 ? 5 : 9, 0, 7); x.fill(); }
    x.lineCap = 'round'; x.strokeStyle = '#3b2a1a'; x.lineWidth = 12; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 - 43, 128 - 36); x.stroke(); x.lineWidth = 8; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + 76, 128 + 44); x.stroke(); x.beginPath(); x.arc(128, 128, 9, 0, 7); x.fill(); });
  for (const [ry, dx, dz] of [[0, 0, 0.77], [N, 0, -0.77], [E, 0.77, 0], [W, -0.77, 0]]) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.62, 30), new THREE.MeshBasicMaterial({ map: clockTex, transparent: true })); f.position.set(5.6 + dx, 6.2, -17 + dz); f.rotation.y = ry; scene.add(f); }
  box(1.9, 0.3, 1.9, 0xc9a227, 5.6, 7.45, -17); box(1.9, 0.4, 1.9, 0xd9cdbb, 5.6, 0.2, -17); for (const y of [2.2, 5.0]) box(1.62, 0.14, 1.62, 0xc9a227, 5.6, y, -17); }
SEAT_ROWS.forEach((xr, k) => SEAT_Z.forEach((z, j) => { const mine = k === 4 && j === 2, hr = rbox(0.36, 0.26, 0.12, 0.09, mat(mine ? 0xfab005 : 0x2f44ad)); hr.rotation.y = Math.PI / 2; hr.position.set(xr - 0.32, 1.52, z); hr.userData.ns = 1; scene.add(hr); }));
{ const arch = new THREE.Mesh(new THREE.CircleGeometry(0.8, 18, 0, Math.PI), mat(0x5c4033)); arch.position.set(-34, 2.2, -43.57); scene.add(arch);
  for (const [dx, y] of [[-2.4, 3.2], [2.4, 3.2], [-3.2, 6], [3.2, 6], [0, 7.6], [-1.6, 9.2], [1.6, 9.2]]) box(0.36, 0.6, 0.06, lampM(0xffe9a8, 0.5), -34 + dx, y, dx === -2.4 || dx === 2.4 ? -43.57 : -43.72);
  for (const [dx, h] of [[-3.2, 7.5], [0, 9.5], [3.2, 7.5]]) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.08, 6, 18), mat(0xc9a227)); b.rotation.x = Math.PI / 2; b.position.set(-34 + dx, h - 0.5, -44.6); scene.add(b); } }

let decor = [];
function addDecor(o) { scene.add(o); decor.push(o); return o; }
function clearDecor() { decor.forEach(o => scene.remove(o)); decor = []; }
scene.add(camera);
function heldSync() {}
function setHeld(id, label) { held = { kind: 'thing', id, label }; refreshHUD(); }

// ---------- 위험한 곳 지킴이 ----------
// 차도에 들어가거나 차에 부딪히면 crash(), 뛰면 penalty() — 둘 다 미션 쪽(l13_stages.js)에 있어요.
let hazT = 0, runT = 0;
function inEsc() { for (const e of ESC) if (P.x > e.x1 && P.x < e.x2 && P.z > e.z1 && P.z < e.z2) return e; return null; }
function gateOpen() { return S.stage > 2 || (S.stage === 2 && stageState.ticket); }


// ---------- 한 줄로 따라오기: 친구들이 내가 걸어온 길을 따라 한 줄로 와요 (서로 겹치지 않고, 벽을 뚫지 않아요) ----------
const LINE = { on: false, trail: [], ids: [], gap: 1.25, first: 1.35 };
function lineStart(ids, bx, bz) { // (bx, bz): 처음 줄을 세울 쪽 (보통 내 등 뒤)
  LINE.on = true; LINE.ids = ids.slice(); LINE.trail = [];
  const n = Math.hypot(bx, bz) || 1; bx /= n; bz /= n;
  for (let k = 0; k <= 16; k++) LINE.trail.push([P.x + bx * k * 0.4, P.z + bz * k * 0.4]);
  ids.forEach((id, i) => { const d = LINE.first + i * LINE.gap, m = NPC[id]; m.follow = false; m.g.visible = true; m.g.position.set(P.x + bx * d, 0, P.z + bz * d); m.g.rotation.y = Math.atan2(-bx, -bz); m.home = [m.g.position.x, m.g.position.z, m.g.rotation.y]; });
}
function lineStop() { LINE.on = false; LINE.ids = []; }
function lineTick(dt) {
  if (!LINE.on) return;
  const tr = LINE.trail, h = tr[0];
  if (!h || Math.hypot(P.x - h[0], P.z - h[1]) > 0.3) { tr.unshift([P.x, P.z]); if (tr.length > 90) tr.pop(); }
  const ps = [];
  LINE.ids.forEach((id, i) => {
    const m = NPC[id]; if (!m || !m.g.visible) return;
    let need = LINE.first + i * LINE.gap, px = P.x, pz = P.z, tx = null, tz = 0;
    for (let k = 0; k < tr.length; k++) { const q = tr[k], seg = Math.hypot(q[0] - px, q[1] - pz); if (seg >= need && seg > 1e-6) { const f = need / seg; tx = px + (q[0] - px) * f; tz = pz + (q[1] - pz) * f; break; } need -= seg; px = q[0]; pz = q[1]; }
    if (tx === null) { tx = px; tz = pz; }
    const p = m.g.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d > 9) { p.x = tx; p.z = tz; }
    else if (d > 0.04) { const s = Math.min(d, Math.max(2.2, d * 3.2) * dt); p.x += dx / d * s; p.z += dz / d * s; if (d > 0.3) m.g.rotation.y = Math.atan2(dx, dz); }
    ps.push(p);
  });
  // 그래도 가까워지면(되돌아 걸을 때) 서로 조금 밀어내요
  for (let a = 0; a < ps.length; a++) {
    for (let b = a + 1; b < ps.length; b++) { const dx = ps[b].x - ps[a].x, dz = ps[b].z - ps[a].z, d = Math.hypot(dx, dz); if (d < 0.8 && d > 1e-4) { const k = (0.8 - d) / 2 / d; ps[a].x -= dx * k; ps[a].z -= dz * k; ps[b].x += dx * k; ps[b].z += dz * k; } }
    const dx = ps[a].x - P.x, dz = ps[a].z - P.z, d = Math.hypot(dx, dz); if (d < 0.95 && d > 1e-4) { ps[a].x += dx / d * (0.95 - d); ps[a].z += dz / d * (0.95 - d); }
  }
}
const mySlot = () => 0; // 이 단원은 함께 하기를 끄고 혼자 해요 (아래는 켤 때를 위한 것)
const mySlotOld = (() => { let n = 0; try { const q = new URLSearchParams(location.search).get('mp'); const m = q && /^[A-Za-z0-9]{5},(\d{1,2}),/.exec(q); if (m) n = +m[1]; } catch (e) {} return () => { try { if (!n && window.NET && window.NET.joined && window.NET.joined()) n = +window.NET.profile().num || 0; } catch (e) {} return n > 0 ? n - 1 : 0; }; })();

// ---------- 사람끼리 겹치지 않게 밀어내기 (따라오는 친구가 먼저 비켜요) ----------
function settleTick() {
  const all = Object.values(NPC).filter(m => m.g.visible);
  for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
    const A = all[a].g.position, B = all[b].g.position, dx = B.x - A.x, dz = B.z - A.z;
    if (Math.abs(dx) > 0.9 || Math.abs(dz) > 0.9) continue;
    let d = Math.hypot(dx, dz); if (d >= 0.85) continue;
    let ux = dx / (d || 1), uz = dz / (d || 1); if (d < 1e-4) { ux = Math.cos(a * 2.4 + b); uz = Math.sin(a * 2.4 + b); d = 0; }
    const la = LINE.on && LINE.ids.includes(all[a].id), lb = LINE.on && LINE.ids.includes(all[b].id), push = 0.85 - d;
    const wa = la === lb ? 0.5 : la ? 1 : 0, wb = 1 - wa;
    A.x -= ux * push * wa; A.z -= uz * push * wa; B.x += ux * push * wb; B.z += uz * push * wb;
  }
}

function worldTick(dt, t) {
  lineTick(dt);
  // 회전목마·자이로드롭·후룸라이드·아이스링크
  CARO.spin.rotation.y = t * 0.35; CARO.spin.children.forEach(h => { h.position.y = Math.sin(t * 1.6 + h.userData.ph) * 0.22; });
  { const k = (t * 0.16) % 1, y = k < 0.6 ? 2 + (k / 0.6) * 17 : k < 0.72 ? 19 : 19 - Math.min(1, (k - 0.72) / 0.1) * 17; MI.ring.position.y = stageState.gyroStop ? 15 : y; }
  FLUME.boat.position.x = FLUME.x + Math.sin(t * 0.7) * 5; FLUME.boat.rotation.y = Math.cos(t * 0.7) > 0 ? 0 : Math.PI;
  skaters.forEach((p, i) => { const a = t * 0.5 + i * 2.1, r = 0.55 + i * 0.12; p.position.x = RINKV.x + Math.cos(a) * RINKV.rx * r; p.position.z = RINKV.z + Math.sin(a) * RINKV.rz * r; p.rotation.y = -a; });
  // 풍선비행·모노레일·풍차·자이로스윙
  LWFX.balloons.forEach((b, i) => { const a = b.a + t * 0.05, bob = Math.sin(t * 0.6 + i * 1.7) * 0.5; b.g.position.set(Math.cos(a) * 23, 16.2 + bob + (i % 2) * 1.8, -27.6 + Math.sin(a) * 8.5); b.g.rotation.y = -a; });
  LWFX.train.forEach(c => { const a = t * 0.11 - c.k * 0.075; c.g.position.set(Math.cos(a) * LWFX.RX, 8.3, LWFX.cz + Math.sin(a) * LWFX.RZ); c.g.rotation.y = -Math.atan2(Math.cos(a) * LWFX.RZ, -Math.sin(a) * LWFX.RX); });
  if (LWFX.blades) LWFX.blades.rotation.x = t * 0.5;
  if (LWFX.swing) LWFX.swing.rotation.x = Math.sin(t * 0.9) * 0.85;
  // 지나가는 차
  for (const c of TRAFFIC) { c.p = (c.p + dt * c.v / Math.abs(c.b - c.a)) % 1; const v = c.a + (c.b - c.a) * c.p; if (c.ax === 'x') c.g.position.set(v, 0, c.fix); else c.g.position.set(c.fix, 0, v); }
  // 주차장에서 나오는 차: 2.5초 기다렸다가 보도를 가로질러 나가요 (9초마다)
  DRIVE.t = (DRIVE.t + dt) % 9;
  { const k = DRIVE.t, car = DRIVE.car; car.visible = k < 5.6; car.rotation.y = N; car.position.z = k < 2.5 ? 22.8 : 22.8 - (k - 2.5) * 4; DRIVE.danger = k > 2.3 && k < 5.0;
    if (started && !dlgOpen && DRIVE.danger && P.x > DRIVE.x1 - 0.2 && P.x < DRIVE.x2 + 0.2 && P.z > 14.2 && P.z < 19.5 && Math.abs(car.position.z - P.z) < 2.6)
      crash('car', P.x > 20.5 ? 25.2 : 15.8, 17.2); }
  if (started && !dlgOpen) {
    // 차도에 발을 들이면 끝! (정문 앞 횡단보도 — 우리 반은 건너지 않아요 / 주차장 진출입로 끝 — 그 앞은 큰길이에요)
    if (P.x > 32.5 && P.z > 35.4 && P.z < 40.6) crash('road', 30.2, 38);
    else if (P.z < 14.6 && P.x > 17.2 && P.x < 23.8 && P.z > 11) crash('road', 25.2, 17.2);
    // 뛰면 감점: 달리기(Shift)를 0.6초 넘게 하면 그때부터 1초마다 점수가 깎여요. 에스컬레이터에서는 더 많이.
    if (running) { runT += dt; if (runT > 0.6) { runT -= 1.0; penalty(inEsc() ? 'esc' : 'run'); } } else runT = Math.max(0, runT - dt * 2);
    // 입장권을 받기 전에는 정문 게이트를 지날 수 없어요
    if (!gateOpen() && P.z < -9.2 && P.z > -14 && P.x > 7.5 && P.x < 14.5) { P.z = -9.15; if (performance.now() - hazT > 2500) { hazT = performance.now(); toast('🎫 선생님께 <b>입장권</b>을 받은 뒤에 들어가요.', 2600); } }
  }
  settleTick();
  // 달리는 버스: 차선과 표지판이 뒤로 흘러가요
  BUSIN.speed += ((BUSIN.moving ? 20 : 0) - BUSIN.speed) * Math.min(1, dt * 0.9);
  if (BUSIN.speed > 0.05) { BUSIN.off = (BUSIN.off + BUSIN.speed * dt) % 96; for (const k of BUSIN.marks) { let x = k.x - BUSIN.off; if (x < -46) x += k.span; k.m.position.x = x; } }
}
function drawMapWorld(tx, tz, s) {
  const R = (x1, z1, x2, z2, c, label, fg) => { mctx.fillStyle = c; mctx.fillRect(tx(x1), tz(z1), (x2 - x1) * s, (z2 - z1) * s); if (label) { mctx.fillStyle = fg || '#fff'; mctx.fillText(label, tx((x1 + x2) / 2), tz((z1 + z2) / 2) + 4); } };
  mctx.fillStyle = '#c9ced2'; mctx.fillRect(0, 0, mapC.width, mapC.height);
  mctx.font = 'bold 10px sans-serif'; mctx.textAlign = 'center';
  // 남쪽: 학교와 버스
  R(-30, 31.5, 27.6, 46, '#e6d3a3', '인천석정초', '#5c4033'); R(28, 15, 31.8, 46, '#e9e2d3'); R(32, 15, 39, 46, '#b5524a'); R(-46, 15, 31.8, 19.3, '#e9e2d3');
  R(-46, 19.4, 27.6, 31.4, '#b9c7b2'); R(-22, 24.8, 10, 31.2, '#3fa7a3', '성산효대학원'); R(17.5, 15, 23.5, 24, '#8a8f96'); R(-46, 5, 46, 15, '#4a4f57');
  BUS_X.forEach((x, i) => { R(x - 4.2, 12.3, x + 4.2, 14.7, '#ffe066'); mctx.fillStyle = '#c2255c'; mctx.fillText(String(i + 1), tx(x), tz(13.5) + 4); });
  // 가운데: 버스 안
  R(-46, -2.2, 46, 4.6, '#3d4248'); R(BUSIN.x1, BUSIN.z1, BUSIN.x2, BUSIN.z2, '#74c0fc', '버스 안', '#1d3557');
  // 북쪽: 롯데월드
  R(-46, -9.4, 46, -2.8, '#d9cfc0'); R(-46, -9.4, -27, -2.8, '#555a60', '주차장'); R(-46, -46, 46, -9.8, '#eadfce'); R(8, -13.4, 14, -9.4, '#c9a227', '정문');
  mctx.fillStyle = '#cfeefc'; mctx.beginPath(); mctx.ellipse(tx(RINKV.x), tz(RINKV.z), RINKV.rx * s, RINKV.rz * s, 0, 0, 7); mctx.fill();
  mctx.fillStyle = '#4263eb'; mctx.beginPath(); mctx.arc(tx(CARO.x), tz(CARO.z), 4.7 * s, 0, 7); mctx.fill(); mctx.fillStyle = '#fff'; mctx.fillText('회전목마', tx(CARO.x), tz(CARO.z) + 4);
  R(-0.5, -45.5, 23.5, -38, '#a0522d', '만남의 광장'); R(44, -28.5, 46, -15.5, '#5f3dc4'); R(28, -12.2, 40, -9.8, '#c92a2a', '버거베어');
  R(-33.5, -13.2, -20.5, -10, '#1971c2', '후룸라이드'); R(-34, -29.6, -25, -24.6, '#2f7d4f', '스테이지'); R(-46, -46, -20, -32.6, '#b9d4e8', '매직아일랜드', '#1c3fa8');
  mctx.fillStyle = '#5f3dc4'; mctx.fillText('플라이벤처', tx(40), tz(-22) + 4);
}
// 놀이 층(play.js)이 롯데월드 놀이기구에 태워 줄 때 쓰는 자리·모형 (이 단원 전용)
window.__lw = {
  CARO, MI, FLUME, LWFX, RINKV, FOOD, SPOTS, STAGE, SHIP, FLY, LW, FAC,
  zone: () => (P.z < -9.4 ? 'park' : P.z < 4.6 ? 'bus' : 'school'),          // 지금 내가 있는 구역
  mission: () => ({ stage: S.stage, ticket: !!(stageState && stageState.ticket), over: !!(stageState && stageState.over) }),
  englishQuiz: () => Object.values(L.eng || {}).map(e => ({ q: e.ask ? e.sit : `${e.q}  (${e.qKo})`, a: e.a, why: `📗 ${e.book} 표현 · ${e.ask ? e.a[0] : e.aKo}`, en: true, book: e.book })),
  safetyQuiz: () => [].concat(...['pre', 'walk', 'bus', 'arrive', 'ride', 'lunch', 'lost', 'emerg', 'back'].map(k => Object.values(L[k] || {}).filter(q => q && q.q && Array.isArray(q.a))))
};

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
const camPerson = (ppl, x, z) => { for (const n of ppl) { if (n.follow || !n.g.visible) continue; const q = n.g.position; if (Math.abs(q.x - x) < 0.5 && Math.abs(q.z - z) < 0.5) return true; } return false; };
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
// 처음 자리 [x, z, 방향]
const HOME = {
  teacher: [0, 36.4, 0], seoyeon: [-3, 39.4, 0], jiho: [3, 39.6, 0], minjun: [4.4, 38, 0],
  guide: [-30.6, -6.1, W], cast_fly: [41.6, -22, W], cast_flume: [-20.8, -15.6, 0], cast_gyro: [-27.6, -39.4, 0],
  info: [3, -36.6, 0], nurse: [9, -36.6, 0], clerk: [34, -13.3, N], cast_plaza: [-1, -15.2, 0],
  stranger: [45, 45, 0], bonus: [22, -32.6, 0]
};
const FRIENDS = ['seoyeon', 'jiho', 'minjun'];
addNPC('teacher', { name: '선생님', adult: true, girl: true, shirt: 0x2b8a3e, skirt: 0x495057, hair: 0x2b1d14, scale: 1.12, idle: ['', '모둠 친구들과 꼭 같이 다녀요. 무슨 일이 생기면 바로 선생님께 연락해요.'] }, ...HOME.teacher);
addNPC('seoyeon', { name: '서연', girl: true, shirt: 0xf783ac, hair: 0x2b1d14, idle: ['', '우리 모둠, 끝까지 같이 다니자!'] }, ...HOME.seoyeon);
addNPC('jiho', { name: '지호', shirt: 0x4dabf7, hair: 0x111111, idle: ['', '집합은 2시 50분, 회전목마 앞이야. 잊지 마!'] }, ...HOME.jiho);
addNPC('minjun', { name: '민준', shirt: 0xffd43b, hair: 0x3b2a1a, scale: 0.92, idle: ['', '나는 키가 138cm야. 탈 수 있는 기구인지 안내판을 먼저 볼게.'] }, ...HOME.minjun);
addNPC('guide', { name: '담당자', adult: true, shirt: 0xe8590c, hair: 0x222222, hat: true, scale: 1.1, idle: ['', '주차장에서는 버스가 움직여요. 보행로 표시를 따라 줄지어 가요.'] }, ...HOME.guide);
addNPC('cast_fly', { name: '캐스트', adult: true, girl: true, shirt: 0x5f3dc4, skirt: 0x343a40, hair: 0x3b2a1a, hat: true, scale: 1.08, idle: ['', '플라이벤처는 키 140cm부터 혼자 탈 수 있어요. 안내판을 꼭 확인해요.'] }, ...HOME.cast_fly);
addNPC('cast_flume', { name: '캐스트', adult: true, shirt: 0x1971c2, hair: 0x222222, hat: true, scale: 1.1, idle: ['', '후룸라이드에서는 손잡이를 잡고, 타는 동안 일어서지 않아요.'] }, ...HOME.cast_flume);
addNPC('cast_gyro', { name: '캐스트', adult: true, girl: true, shirt: 0xe03131, skirt: 0x343a40, hair: 0x111111, hat: true, scale: 1.08, idle: ['', '자이로드롭은 키 130cm부터예요. 소지품은 모두 보관함에 넣어요.'] }, ...HOME.cast_gyro);
addNPC('info', { name: '안내 캐스트', adult: true, girl: true, shirt: 0x1c7ed6, skirt: 0x1c3fa8, hair: 0x2b1d14, hat: true, scale: 1.08, idle: ['', '명찰을 단 캐스트에게는 무엇이든 물어봐도 돼요. 길을 잃으면 저희에게 말해요.'] }, ...HOME.info);
addNPC('nurse', { name: '간호사', adult: true, girl: true, shirt: 0xffffff, skirt: 0x74c0fc, hair: 0x3b2a1a, scale: 1.08, idle: ['', '다치거나 아프면 의무실로 와요. 걷기 힘들면 가까운 캐스트에게 말하면 데려다줘요.'] }, ...HOME.nurse);
addNPC('clerk', { name: '점원', adult: true, shirt: 0xc92a2a, hair: 0x222222, hat: true, scale: 1.08, idle: ['', '밀쿠폰은 안내문이 붙은 식당의 정해진 메뉴에 한 번 쓸 수 있어요.'] }, ...HOME.clerk);
addNPC('cast_plaza', { name: '캐스트', adult: true, shirt: 0x2f9e44, hair: 0x222222, hat: true, scale: 1.1, idle: ['', '뛰지 않고 걸어요. 사람이 많은 곳에서는 밀지 않아요.'] }, ...HOME.cast_plaza);
addNPC('stranger', { name: '모르는 어른', adult: true, shirt: 0x495057, hair: 0x555555, scale: 1.15 }, ...HOME.stranger);
addNPC('bonus', { name: '안전 지킴이', adult: true, shirt: 0xf59f00, hair: 0x222222, hat: true, scale: 1.12 }, ...HOME.bonus);
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
ui.next.onclick = () => dlgNextFn && dlgNextFn();
ui.spk.onclick = () => lastSpeech && speak(...lastSpeech);
ui.peek.onclick = () => { ui.en.classList.remove('hidden'); ui.peek.style.display = 'none'; };

// ---------------- 단계 (미션) ----------------
// 롯데월드 현장체험학습 안전교육: 실제 하루 순서대로 걸어 보며, 상황마다 알맞은 행동을 골라요.
const zoneHandlers = {};
let stageState = {};

const STAGES = [
  { title: '1. 출발! 학교에서 버스까지', book: '걸어서 이동', start: stage1 },
  { title: '2. 버스 안전', book: '안전벨트 · 비상 장비', start: stage2 },
  { title: '3. 도착, 그리고 입장', book: '집합 장소 · 의무실 · 미아보호소', start: stage3 },
  { title: '4. 놀이기구 안전', book: '키 기준 · 안전바 · 멈췄을 때', start: stage4 },
  { title: '5. 점심과 돌발 상황', book: '밀쿠폰 · 길 잃음 · 대피', start: stage5 },
  { title: '6. 집합, 그리고 집으로', book: '시간 약속 · 귀가 · 안전 약속', start: stage6 },
  { title: '🎉 자유 탐험', book: '복습', start: stageFree }
];

// ---- 한국어로 읽어 주기 (이 단원은 영어 목소리 대신 한국어 목소리를 써요. '읽어 주기' 단추로 끄고 켜요)
let koVoices = [];
const loadKo = () => { try { koVoices = speechSynthesis.getVoices().filter(v => /^ko/i.test(v.lang)); } catch (e) {} };
if ('speechSynthesis' in window) { loadKo(); try { speechSynthesis.addEventListener('voiceschanged', loadKo); } catch (e) {} }
function speakKo(text, force) {
  if (!('speechSynthesis' in window) || !text || (!force && !S.koHelp)) return;
  try {
    speechSynthesis.cancel();
    const clean = String(text).replace(/<[^>]+>/g, ' ').replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{200D}]/gu, ' ').replace(/[·•]/g, ', ').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean); u.lang = 'ko-KR'; u.rate = Math.min(1.3, (S.rate || 0.9) + 0.15);
    if (koVoices[0]) u.voice = koVoices[0];
    speechSynthesis.speak(u);
  } catch (e) {}
}
const _speakEn = speak;
speak = function (text, who) { return /[가-힣]/.test(String(text || '')) ? speakKo(text, true) : _speakEn(text, who); };
const _setLine = setLine;
setLine = function (who, en, ko, o = {}) {
  _setLine(who, en, ko, Object.assign({}, o, { speak: false, koAlways: true }));
  const t = en || ko, eng = !!en && !/[가-힣]/.test(en); lastSpeech = t ? [t, who] : null; ui.spk.style.display = t ? 'inline-block' : 'none';
  if (eng) { if (o.speak !== false) _speakEn(en, who); } // 영어 문장은 늘 영어 목소리로 (듣기 연습)
  else if (t) speakKo(t);
};

function resetWorld() {
  clearItems(); clearDecor(); held = null; stageState = {};
  for (const k in zoneHandlers) delete zoneHandlers[k];
  for (const n of Object.values(NPC)) { n.talk = null; n.g.userData.mark.visible = false; n.follow = false; n.g.visible = true; }
  for (const [id, p] of Object.entries(HOME)) placeNPC(id, ...p);
  NPC.stranger.g.visible = false; BUSIN.moving = false; lineStop();
  spawnThCoins();
  refreshHUD(); scoreShow();
}
function startStage(i) { S.stage = i; save(); resetWorld(); STAGES[i].start(); refreshHUD(); }
function nextStage() { closeDlg(); beep('star'); track('stage_done', { stage: S.stage, stars: S.stars }); const i = S.stage + 1; showBanner(STAGES[S.stage].title + ' 완료!', i < STAGES.length - 1 ? '다음: ' + STAGES[i].title : '모든 미션 완료!'); startStage(i); }
function showBanner(a, b) { const el = $('#banner'); el.innerHTML = `<b>${a}</b><span>${b}</span>`; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
function mark(id, on = true) { NPC[id].g.userData.mark.visible = on; }
function good(n = 1) { S.tries++; S.correct++; addStar(n); beep('star'); save(); }
const npcAt = (id) => () => [NPC[id].g.position.x, NPC[id].g.position.z];
const dist = (p) => Math.hypot(p[0] - P.x, p[1] - P.z);
function nearestItem() { let best = null, bd = 1e9; for (const it of items) { if (!it.alive || it.bonus || it.wrong) continue; const d = dist([it.x, it.z]); if (d < bd) { bd = d; best = [it.x, it.z]; } } return best; }
function flash(color = '#fff') { const f = document.createElement('div'); f.style.cssText = `position:fixed;inset:0;background:${color};z-index:50;opacity:1;transition:opacity .8s;pointer-events:none`; document.body.appendChild(f); setTimeout(() => f.style.opacity = 0, 300); setTimeout(() => f.remove(), 1200); }
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function drawSentenceBar() { ui.sent.style.display = 'none'; }

// ---- 이 단원에서 쓰는 도우미
const tell = (who, text, btn) => say(who, text, '', btn ? { btn } : {});
// 상황 문제: 정답을 고르면 한 줄 설명을 보여 줘요. (a[0] 이 정답)
function quiz(q, who) {
  return ask(who || '', q.q, q.sub || '어떻게 할까요? 가장 안전한 행동을 골라요.', q.a,
    { after: '💡 ' + q.why, wait: Math.min(4600, 1900 + q.why.length * 45), hint: q.hint || '다시 생각해 봐요. 가장 안전한 행동은 무엇일까요?', sayIt: false });
}
// 영어로 말해 봐요: 교과서 표현으로 대답 고르기 / 알맞은 질문 고르기 (맞힌 문장은 영어로 읽어 줘요)
async function english(e) {
  if (!e) return;
  const tag = `📗 ${e.book} 표현`;
  if (e.ask) {
    await ask('나', e.sit, `${tag} · 알맞은 영어 문장을 골라요.`, e.a, { me: true, wait: 1500 });
    if (e.reply) await say(e.replyWho || e.who, e.reply[0], e.reply[1]);
  } else {
    await ask(e.who, e.q, `${e.qKo}${e.cue ? '  ·  ' + e.cue : ''}  ·  ${tag}`, e.a, { me: true, speakQ: true, wait: 1500, after: e.aKo ? '💬 ' + e.aKo : '' });
    if (e.after) await say(...e.after);
  }
}
// 정답이 없는 선택 — 고른 값을 돌려줘요
function choose(who, en, ko, choices) {
  return new Promise(res => {
    openDlg(); setLine(who, en, ko, {});
    ui.next.style.display = 'none';
    const btns = choices.map((c, i) => {
      const b = document.createElement('button'); b.className = 'choice'; b.dataset.r = 1; b.innerHTML = `<span class="num">${i + 1}</span>${c[1]}`;
      b.onclick = () => { if (b.disabled) return; btns.forEach(x => x.disabled = true); b.classList.add('right'); beep('ok'); setTimeout(() => { dlgChoiceKeys = null; res(c[0]); }, 600); };
      ui.ch.appendChild(b); return b;
    });
    dlgChoiceKeys = btns;
  });
}
// 이어지는 대화를 한 덩어리로 돌려요 (그동안 다른 것이 끼어들지 않게)
function run(fn) {
  if (busy) return; busy = true;
  (async () => {
    try { await fn(); } catch (e) { try { console.error(e); } catch (er) {} }
    finally { busy = false; if (dlgOpen && !dlgNextFn && !dlgChoiceKeys && !$('#writer').classList.contains('show') && !$('#end').classList.contains('show')) closeDlg(); }
  })();
}
// 밟으면 일이 일어나는 자리 (노란 고리). o.keep: 여러 번 밟을 수 있음, o.wrong: 길 안내에서 빼는 '틀린 자리'
function spot(x, z, then, o = {}) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 8, 28), new THREE.MeshBasicMaterial({ color: o.color || 0xffd43b })); ring.rotation.x = Math.PI / 2; ring.position.y = -1.0; g.add(ring);
  if (o.label) { const t = textSprite(o.label, 0.5, { fs: 50, bg: '#ffffff', fg: '#1d3557', border: '#ffd43b' }); t.position.y = 1.0; g.add(t); }
  const it = addItem(g, x, z, (it) => {
    if (busy || (it.cool || 0) > performance.now()) return;
    if (o.keep) it.cool = performance.now() + 2600; else { removeItem(it); beep('get'); }
    then(it);
  }, { y: 1.2, r: o.r || 1.3, spin: 0 });
  it.tag = o.tag || ''; it.wrong = !!o.wrong; return it;
}
// 장면 옮기기. step: 같은 반 친구들과 겹치지 않게 내 번호만큼 뒤쪽(등 뒤)으로 물러서는 간격, cols: 옆으로 서는 줄 수
function warp(x, z, yaw = 0, step = 0, cols = 1) {
  const k = mySlot(), bx = Math.sin(yaw), bz = Math.cos(yaw), row = Math.floor(k / cols) % 10, col = k % cols - (cols - 1) / 2;
  P.x = x + bx * row * step + bz * col * 1.1; P.z = z + bz * row * step - bx * col * 1.1; P.yaw = yaw; P.pitch = 0; try { CAM.tx = null; } catch (e) {}
}
const FR_OFF = [[-1.5, 0], [1.5, 0.2], [0, 1.6]];
function follow(ids = FRIENDS) { lineStart(ids, Math.sin(P.yaw), Math.cos(P.yaw)); } // 내 등 뒤로 한 줄
function friendsAt(x, z, face) { lineStop(); FRIENDS.forEach((id, i) => { placeNPC(id, x + FR_OFF[i][0], z + FR_OFF[i][1], face); NPC[id].g.visible = true; }); } // 한곳에 모여 서 있기
function hideFriends() { lineStop(); FRIENDS.forEach(id => { NPC[id].follow = false; placeNPC(id, 45, 44 - FRIENDS.indexOf(id)); NPC[id].g.visible = false; }); }
const myBus = () => Math.max(1, Math.min(L.classes || 6, S.cls || 1));

// ---- 안전 점수: 100점에서 시작해요. 뛰면 깎이고, 50점 밑으로 내려가면 처음부터 다시 해요.
//      차도에 들어가거나 차에 부딪히면 바로 처음부터 다시 시작해요. (자유 탐험에서는 적용하지 않아요)
const RULE = Object.assign({ start: 100, min: 50, run: 5, esc: 10, wrong: 2 }, L.score || {});
const scoreEl = (() => { try { const d = document.createElement('div'); d.className = 'pill'; d.id = 'safeBox'; d.innerHTML = '🛡️ <span class="lbl">안전 </span><b id="safeN">100</b><span class="lbl">점</span>'; const q = $('#questBox'); q.parentElement.insertBefore(d, q); return d; } catch (e) { return null; } })();
const playing = () => S.stage < STAGES.length - 1;
function scoreShow() { try { if (S.safe == null) S.safe = RULE.start; $('#safeN').textContent = Math.max(0, Math.round(S.safe)); scoreEl.classList.toggle('low', S.safe < RULE.min + 15); scoreEl.style.display = playing() ? '' : 'none'; } catch (e) {} }
function penalty(kind) {
  if (!playing() || stageState.over) return;
  const n = RULE[kind] || 0; if (!n) return;
  if (S.safe == null) S.safe = RULE.start;
  S.safe = Math.max(0, S.safe - n); S.streak = 0; save(); scoreShow(); beep('bad');
  try { scoreEl.classList.remove('pop'); void scoreEl.offsetWidth; scoreEl.classList.add('pop'); } catch (e) {}
  if (S.safe < RULE.min) { gameOver('score'); return; }
  if (kind === 'run') toast(`🏃 <b>뛰면 위험해요!</b> 안전 점수 −${n} (지금 ${S.safe}점 · ${RULE.min}점 밑이면 처음부터)`, 2600);
  else if (kind === 'esc') toast(`🛗 에스컬레이터에서는 <b>뛰지 않아요!</b> 안전 점수 −${n} (지금 ${S.safe}점)`, 3000);
}
window.addEventListener('e3d', (e) => { try { if (e.detail && e.detail.type === 'miss' && RULE.wrong) { penalty('wrong'); if (playing() && !stageState.over) toast(`🤔 다시 생각해 봐요. 안전 점수 −${RULE.wrong} (지금 ${S.safe}점)`, 2200); } } catch (er) {} });
// 차도·차 사고: 처음부터. (x, z)는 자유 탐험일 때 되돌려 놓을 자리
function crash(why, x, z) {
  if (!playing()) { P.x = x; P.z = z; if (performance.now() - hazT > 1800) { hazT = performance.now(); beep('bad'); toast(why === 'car' ? '🚗 빵! 차가 나오고 있어요. 멈추고 살펴요.' : '🚸 여기는 차도예요. 보도로만 다녀요.', 3000); } return; }
  gameOver(why);
}
function gameOver(why) {
  if (stageState.over) return; stageState.over = true;
  const msg = {
    car: ['🚗 끼익— 쾅!', '주차장에서 나오는 차와 부딪혔어요. 진출입로 앞에서는 꼭 멈추고, 차가 다 지나간 뒤에 건너요.'],
    road: ['🚸 여기는 차도예요!', '차도에 들어가면 큰 사고가 나요. 우리 반은 길을 건너지 않고 보도로만 걸어요.'],
    score: [`🛡️ 안전 점수가 ${RULE.min}점 밑으로 내려갔어요.`, '뛰지 않고, 살피고, 안전한 행동을 골라요.']
  }[why] || ['다시 해요', ''];
  beep('bad'); flash(why === 'score' ? '#495057' : '#e03131');
  const go = async () => {
    await say('', msg[0], msg[1] + ' 처음부터 다시 해요.', { btn: '처음부터 다시 ↩' });
    closeDlg(); restartAll();
  };
  if (busy) { (async () => { try { await go(); } catch (e) {} })(); } else run(go);
}
function restartAll() {
  const keep = { koHelp: S.koHelp, rate: S.rate, medals: Array.isArray(S.medals) ? S.medals : [], th: S.th, cls: S.cls, retry: (S.retry || 0) + 1 };
  S = Object.assign(fresh(), keep); S.safe = RULE.start; save();
  flash('#000'); P.x = 0; P.z = 40; P.yaw = 0; P.pitch = 0; try { CAM.tx = null; } catch (e) {}
  startStage(0); showBanner('처음부터 다시!', '이번에는 끝까지 안전하게 가 봐요'); track('start', { stage: 0 });
}

// ---- 1. 출발! 학교에서 버스까지 ----
function stage1() {
  setObj('🏫 <b>선생님</b>께 가서 출발 준비를 해요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await tell('선생님', `오늘은 ${L.park} 현장체험학습 날이에요! 출발하기 전에 몇 가지를 확인해요.`);
    await say('선생님', `🛡️ 안전 점수는 ${RULE.start}점에서 시작해요.`, `뛰면 점수가 깎이고, ${RULE.min}점 밑으로 내려가면 처음부터 다시 해요. 차도에 들어가거나 차에 부딪혀도 처음부터예요!`, { btn: '조심할게요' });
    const list = []; for (let n = 1; n <= (L.classes || 6); n++) list.push([n, n + '반']);
    S.cls = await choose('선생님', '나는 6학년 몇 반인가요?', '우리 반 버스는 반 번호와 같아요. (1반 → 1호차)', list); save();
    await say('선생님', '', '🇬🇧 오늘은 영어 시간이에요! 현장체험학습 길에서 6학년 영어 표현으로 말해 봐요.', { btn: '좋아요' });
    await english(L.eng.when);
    for (const q of L.pre) await quiz(q, '선생님');
    await tell('선생님', `좋아요! ${S.cls}반은 ${S.cls}호차를 타요. 버스는 ${L.busPlace}에 있어요. 정문을 나가면 왼쪽으로 돌아요. 길은 건너지 않고, 학교 쪽 보도로 한 줄로 걸어요.`, '출발!');
    closeDlg(); s1walk();
  };
}
function s1walk() {
  follow(); placeNPC('teacher', 28.7, 35.4, 0);
  setObj('🚶 운동장 동쪽 <b>정문</b>으로 나가요', () => [29.9, 38]);
  spot(29.9, 38, () => run(async () => {
    await tell('선생님', '정문 앞 횡단보도는 건너지 않아요. 왼쪽으로 돌아서, 차도에서 먼 보도 안쪽으로 걸어요.', '네!');
    closeDlg(); placeNPC('teacher', 28.7, 21, 0);
    setObj('🚶 보도를 따라 <b>큰길 모퉁이</b> 쪽으로 걸어요', () => [29.9, 27.5]);
    spot(29.9, 27.5, () => run(async () => {
      await english(L.eng.plan); await quiz(L.walk.phone); closeDlg();
      setObj('🚶 <b>큰길(석정로) 모퉁이</b>까지 걸어요', () => [29.9, 17.3]);
      spot(29.9, 17.3, () => run(async () => { await quiz(L.walk.corner, '선생님'); closeDlg(); s1drive(); }), { label: '모퉁이' });
    }));
  }), { label: '정문' });
}
function s1drive() {
  placeNPC('teacher', 25.6, 18.6, W);
  setObj('🅿 <b>주차장 진출입로</b> 앞의 선생님께 가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await quiz(L.walk.drive, '선생님');
    await tell('', '🚗 주차장에서 차가 나오는지 살피고, 차가 지나간 뒤에 진출입로를 건너요. 차와 부딪히면 처음부터 다시 해야 해요!', '살펴볼게요');
    closeDlg();
    setObj('🚗 차가 지나간 뒤 <b>진출입로를 건너요</b>', () => [15.8, 17.2]);
    spot(15.8, 17.2, () => run(async () => {
      good(2); toast('👍 멈추고, 살피고, 건넜어요! 별 +2', 2600);
      placeNPC('teacher', 14, 18.5, 0);
      await quiz(L.walk.busFind, '선생님'); closeDlg(); s1bus();
    }), { label: '건너기' });
  };
}
function s1bus() {
  const my = myBus(), [mx] = busDoor(my - 1);
  placeNPC('teacher', mx - 1.9, 18.2, 0);
  setObj(`🚌 우리 반 버스 <b>${my}호차</b>를 찾아 앞문 앞으로 가요`, () => busDoor(my - 1));
  BUS_X.forEach((x, i) => {
    const [dx, dz] = busDoor(i);
    spot(dx, dz, () => run(async () => {
      if (i + 1 !== my) { beep('bad'); toast(`여기는 <b>${i + 1}호차</b>예요. 우리 반은 <b>${my}호차</b>!`, 2400); return; }
      clearItems(); spawnThCoins();
      await quiz(L.walk.stairs, '선생님');
      await tell('', '🚌 손잡이를 잡고 한 칸씩! 버스에 올라타요.', '타요');
      nextStage();
    }), { keep: true, tag: 'bus' + (i + 1), r: 0.95, wrong: i + 1 !== my });
  });
}

// ---- 2. 버스 안전 ----
function stage2() {
  flash('#000'); warp(5.6 - (mySlot() % 12) * 0.85, BUSIN.zc, Math.PI / 2);
  hideFriends(); placeNPC('teacher', 8.3, 1.8, W);
  setObj('💺 통로를 따라 <b>내 자리(노란 좌석)</b>로 가요', () => BUSIN.seat);
  spot(BUSIN.seat[0], BUSIN.seat[1], () => run(async () => {
    await quiz(L.bus.bag); await quiz(L.bus.belt); await quiz(L.bus.beltHow);
    beep('get'); await tell('', '🔒 찰칵! 안전벨트를 맸어요.', '좋아요');
    await quiz(L.bus.video, '선생님');
    await tell('선생님', '출발하기 전에 버스 안 안전 장비 세 가지를 직접 찾아봐요. 비상망치, 소화기, 비상구!', '찾아볼게요');
    closeDlg(); s2tools();
  }), { label: '내 자리', r: 0.9 });
}
function s2tools() {
  stageState.found = 0;
  const done = () => {
    stageState.found++;
    if (stageState.found < 3) { setObj(`🔍 버스 안 <b>안전 장비</b>를 찾아요 (${stageState.found}/3)`, nearestItem); return; }
    setObj('💺 다 찾았어요! <b>내 자리</b>로 돌아가 앉아요', () => BUSIN.seat);
    spot(BUSIN.seat[0], BUSIN.seat[1], () => run(s2ride), { label: '내 자리', r: 0.9 });
  };
  [[0, 0.95, 'hammer', '🔨 ?'], [5.5, 1.15, 'ext', '🧯 ?'], [-8.1, 1.3, 'exit', '🟩 ?']].forEach(([x, z, k, lab]) =>
    spot(x, z, () => run(async () => { await tell('', L.busTools[k], '알겠어요'); closeDlg(); good(); done(); }), { label: lab, tag: k, r: 0.85 }));
  setObj('🔍 버스 안 <b>안전 장비</b>를 찾아요 (0/3)', nearestItem);
}
async function s2ride() {
  BUSIN.moving = true; beep('get');
  await tell('기사님', '모두 안전벨트를 맸지요? 출발합니다!', '출발');
  await tell('', `🛣️ 버스가 고속도로를 달려요. ${L.park}까지 1시간 20분쯤 걸려요.`, '다음');
  await quiz(L.bus.eraser); await quiz(L.bus.window); await quiz(L.bus.sick); await english(L.eng.sick);
  await tell('', `🏙️ 서울 잠실에 들어왔어요. 저기 ${L.park}가 보여요!`, '다음');
  await quiz(L.bus.stop);
  BUSIN.moving = false;
  await tell('선생님', '버스가 완전히 멈췄어요. 이제 벨트를 풀고, 앞자리부터 차례로 내려요.', '내려요');
  nextStage();
}

// ---- 3. 도착, 그리고 입장 ----
function stage3() {
  flash('#000'); warp(-34.2, -6.0, -Math.PI / 2, 0.01);
  follow(); placeNPC('teacher', -31.4, -3.7, W);
  setObj('🅿 주차장에 도착했어요! 마중 나온 <b>담당자</b>에게 가요', npcAt('guide')); mark('guide');
  NPC.guide.talk = async () => {
    mark('guide', false); NPC.guide.talk = null;
    await say('담당자', 'Welcome to Lotte World!', '롯데월드에 온 걸 환영해요!');
    await english(L.eng.grade);
    await tell('담당자', '어서 오세요! 주차장에서는 버스가 움직여요. 보행로 표시를 따라 줄지어 오세요. 매표소까지 안내할게요.');
    await quiz(L.arrive.off, '선생님'); closeDlg();
    placeNPC('guide', -27.6, -8.2, W); placeNPC('teacher', -17.6, -6.1, W);
    setObj('🛗 <b>웰빙센터 입구</b>의 에스컬레이터로 가요 (한 층 아래로)', () => [-24.4, -6.1]);
    spot(-24.4, -6.1, () => run(async () => {
      await quiz(L.arrive.esc); closeDlg();
      placeNPC('teacher', 2.2, -7.0, 0); placeNPC('guide', -3.6, -7.0, 0);
      setObj('🎫 통로를 따라 <b>단체 매표소</b> 앞의 선생님께 가요', npcAt('teacher')); mark('teacher');
      NPC.teacher.talk = async () => {
        mark('teacher', false); NPC.teacher.talk = null;
        await quiz(L.arrive.push, '선생님');
        await tell('선생님', '입장권을 나눠 줄게요. 잃어버리지 않게 잘 챙겨요. 선생님들은 정문 게이트 밖 인솔자 휴게실에도 있어요.', '받았어요');
        stageState.ticket = true; beep('get');
        await quiz(L.arrive.out, '선생님'); closeDlg();
        placeNPC('teacher', LW.meet[0] - 1.4, LW.meet[1] + 0.8, W);
        setObj('🎠 <b>정문 게이트</b>로 들어가 에스컬레이터를 타고 한 층 올라가요', () => [11, -14.6]);
        spot(11, -14.6, () => run(async () => {
          await tell('', '🎠 1층 광장이에요. 오른쪽에 회전목마가 보여요! 저기가 우리 반 집합 장소예요.', '가 볼래요');
          closeDlg(); s3meet();
        }), { label: '1층' });
      };
    }), { label: '에스컬레이터', r: 1.1 });
  };
}
function s3meet() {
  setObj('📍 <b>회전목마 앞</b>의 선생님께 가요', npcAt('teacher')); mark('teacher');
  NPC.teacher.talk = async () => {
    mark('teacher', false); NPC.teacher.talk = null;
    await quiz(L.arrive.meet, '선생님'); await quiz(L.arrive.time, '선생님');
    await tell('선생님', '회전목마를 바라보고 왼쪽이 만남의 광장이에요. 인포메이션, 의무실, 미아보호소를 직접 찾아가서 어디 있는지 익혀 봐요.', '찾아볼게요');
    closeDlg(); stageState.seen = 0;
    const places = [
      [FAC.info, '❓ 인포메이션', '❓ 인포메이션(손님상담실): 길을 모를 때, 물건이나 친구를 잃어버렸을 때 여기로 와요. 명찰을 단 캐스트에게는 무엇이든 물어봐도 돼요.', L.eng.where, 'info'],
      [FAC.aid, '➕ 의무실', '➕ 의무실: 다치거나 아프면 여기로 와요. 걷기 힘들면 가까운 캐스트에게 말하면 데려다줘요. 바로 옆에 AED도 있어요.', L.arrive.aid, 'aid'],
      [FAC.lost, '🧒 미아보호소', '🧒 미아보호소: 모둠과 떨어져 길을 잃으면 캐스트가 여기로 데려다주고 선생님을 찾아 줘요.', null, 'lost']
    ];
    places.forEach(([p, name, text, q, tag]) => spot(p[0], p[1] + 2.3, () => run(async () => {
      await tell('', text, '알겠어요'); if (q) await (q.book ? english(q) : quiz(q)); if (tag === 'aid') await english(L.eng.aid); closeDlg(); good(); stageState.seen++;
      if (stageState.seen < 3) { setObj(`🔎 만남의 광장에서 세 곳을 찾아요 (${stageState.seen}/3)`, nearestItem); return; }
      setObj('📍 <b>회전목마 앞</b>의 선생님께 돌아가요', npcAt('teacher')); mark('teacher');
      NPC.teacher.talk = async () => {
        mark('teacher', false); NPC.teacher.talk = null;
        await tell('선생님', `잘 찾았어요! 이제부터 모둠 친구들과 항상 같이 다녀요. 화장실도 짝과 함께! ${L.meetTime}에 여기 ${L.meetPlace}에서 만나요.`, '네!');
        nextStage();
      };
    }), { label: name, tag }));
    setObj('🔎 만남의 광장에서 <b>인포메이션·의무실·미아보호소</b>를 찾아요 (0/3)', nearestItem);
  };
}

// ---- 4. 놀이기구 안전 ----
const atMeet = () => { warp(LW.meet[0] - 3.4, LW.meet[1] + 3.2, -Math.PI / 2, 1.6, 4); follow(); placeNPC('teacher', LW.meet[0] - 1.4, LW.meet[1] + 0.6, W); };
function stage4() {
  atMeet();
  setObj('✈ 동쪽 <b>플라이벤처</b>의 캐스트에게 가요', npcAt('cast_fly')); mark('cast_fly');
  NPC.cast_fly.talk = async () => {
    mark('cast_fly', false); NPC.cast_fly.talk = null;
    await tell('캐스트', '플라이벤처에 오신 걸 환영해요! 타기 전에 키 재는 판을 먼저 봐 주세요. 키 140cm부터 혼자 탈 수 있어요.');
    await quiz(L.ride.height);
    await english(L.eng.taller);
    await tell('민준', '고마워! 후룸라이드는 110cm부터래. 그건 우리 다 같이 탈 수 있어.', '좋아, 가자!');
    closeDlg();
    setObj('🚣 남서쪽 <b>후룸라이드</b>의 캐스트에게 가요', npcAt('cast_flume')); mark('cast_flume');
    NPC.cast_flume.talk = async () => {
      mark('cast_flume', false); NPC.cast_flume.talk = null;
      await quiz(L.ride.things, '캐스트'); await quiz(L.ride.stand, '캐스트');
      flash('#74c0fc'); beep('fanfare');
      await tell('', '💦 첨벙! 손잡이를 꼭 잡고 신나게 탔어요.', '재밌다!');
      await quiz(L.ride.dizzy); closeDlg();
      setObj('🚧 서쪽 <b>스페인해적선</b> 앞 안내판을 보러 가요', () => SHIP.spot);
      spot(SHIP.spot[0], SHIP.spot[1], () => run(async () => {
        await quiz(L.ride.closed); await quiz(L.ride.fence); closeDlg(); s4island();
      }), { label: '안내판' });
    };
  };
}
function s4island() {
  setObj('🏰 북서쪽 <b>매직아일랜드 가는 길</b>로 가요 (에스컬레이터 → 다리)', () => [MI.gate[0], -29.9]);
  spot(MI.gate[0], -29.9, () => run(async () => {
    await quiz(L.ride.wet);
    await tell('', '🧥 매직아일랜드는 야외예요. 벗어 둔 겉옷을 다시 입고 나가요.', '입었어요');
    closeDlg();
    setObj('🗼 다리를 건너 <b>자이로드롭</b>의 캐스트에게 가요', npcAt('cast_gyro')); mark('cast_gyro');
    NPC.cast_gyro.talk = async () => {
      mark('cast_gyro', false); NPC.cast_gyro.talk = null;
      await tell('캐스트', '자이로드롭은 키 130cm부터 190cm까지 탈 수 있어요. 야외 기구는 너무 춥거나 바람이 세거나 눈·비가 오면 쉴 수 있어요.');
      await quiz(L.ride.bar, '캐스트');
      stageState.gyroStop = true; beep('bad');
      await quiz(L.ride.stopped);
      stageState.gyroStop = false; beep('get');
      await tell('캐스트', '안전 센서가 잠깐 멈춘 거였어요. 침착하게 기다려 줘서 고마워요!', '휴~');
      await english(L.eng.think);
      await quiz(L.ride.scared);
      nextStage();
    };
  }), { label: '매직아일랜드', r: 1.1 });
}

// ---- 5. 점심과 돌발 상황 ----
function stage5() {
  atMeet();
  setObj('🍔 점심시간! <b>밀쿠폰</b>을 쓸 수 있는 식당을 찾아요 (안내문을 잘 봐요)', () => FOOD.ok, { area: 9, key: 'food' });
  spot(FOOD.no[0], FOOD.no[1], () => { beep('bad'); toast('여기에는 밀쿠폰 안내문이 없어요. <b>"밀쿠폰 사용 가능"</b> 안내가 붙은 식당을 찾아요.', 3000); }, { keep: true, tag: 'foodNo', wrong: true });
  spot(FOOD.ok[0], FOOD.ok[1], () => run(async () => {
    clearItems(); spawnThCoins();
    await tell('', '🍔 "밀쿠폰 12,000원 사용 가능" 안내문이 붙어 있어요. 여기서 먹을 수 있어요!', '찾았다');
    await quiz(L.lunch.wash); closeDlg();
    setObj('🧼 동쪽 <b>화장실 · 손 씻는 곳</b>에서 손을 씻어요', () => SPOTS.wash);
    spot(SPOTS.wash[0], SPOTS.wash[1], () => {
      good(); toast('🧼 뽀득뽀득 30초! 손을 깨끗이 씻었어요.', 2600);
      setObj('🍔 <b>버거베어</b>의 점원에게 가서 주문해요', npcAt('clerk')); mark('clerk');
      NPC.clerk.talk = async () => {
        mark('clerk', false); NPC.clerk.talk = null;
        await quiz(L.lunch.coupon, '점원'); await english(L.eng.order); await quiz(L.lunch.tray); await english(L.eng.taste); await quiz(L.lunch.allergy);
        await tell('', '😋 모둠 친구들과 맛있게 먹었어요!', '잘 먹었습니다');
        await s5lost();
      };
    }, { label: '손 씻기', tag: 'wash' });
  }), { tag: 'foodOk' });
}
async function s5lost() {
  hideFriends(); NPC.teacher.g.visible = false;
  await tell('', '🧸 기념품을 구경하다 고개를 들었더니… 어? 모둠 친구들이 안 보여요!', '어떡하지?');
  await quiz(L.lost.stay); await quiz(L.lost.who); closeDlg();
  setObj('🧑‍💼 명찰을 단 <b>캐스트</b>를 찾아가 도움을 청해요', npcAt('cast_plaza')); mark('cast_plaza');
  NPC.cast_plaza.talk = async () => {
    mark('cast_plaza', false); NPC.cast_plaza.talk = null;
    await english(L.eng.lost);
    await tell('캐스트', '모둠을 잃어버렸군요. 걱정 마세요. 미아보호소와 선생님께 바로 연락할게요. 그동안 저와 함께 있어요.');
    const c = NPC.cast_plaza.g.position; placeNPC('stranger', c.x + 2.4, c.z + 1.6); NPC.stranger.g.visible = true;
    await quiz(L.lost.stranger, '모르는 어른');
    NPC.stranger.g.visible = false; placeNPC('stranger', ...HOME.stranger); NPC.stranger.g.visible = false;
    await tell('캐스트', '선생님과 연락이 됐어요! 친구들이 회전목마 앞에서 기다린대요.', '고맙습니다');
    closeDlg();
    friendsAt(LW.meet[0] - 4.6, LW.meet[1] + 0.4, 0); placeNPC('teacher', LW.meet[0] - 1.4, LW.meet[1] + 0.6, W); NPC.teacher.g.visible = true;
    setObj('📍 약속한 곳, <b>회전목마 앞</b>으로 가요', () => [LW.meet[0] - 3.4, LW.meet[1] + 4.6]);
    spot(LW.meet[0] - 3.4, LW.meet[1] + 4.6, () => run(async () => {
      await tell('서연', '찾았다! 걱정했어. 이제 꼭 붙어 다니자.', '응, 미안해!');
      closeDlg(); good(2); follow();
      setObj('🎭 서쪽 <b>가든스테이지</b> 앞에서 공연이 시작됐어요. 가 봐요', () => STAGE.crowd);
      spot(STAGE.crowd[0], STAGE.crowd[1], () => run(async () => {
        await quiz(L.emerg.crowd); await quiz(L.emerg.hurt);
        beep('bad'); flash('#ffa8a8');
        await tell('', '🚨 삐— 삐— 비상벨이 울려요! "손님 여러분, 캐스트의 안내에 따라 대피해 주세요."', '!');
        await quiz(L.emerg.fire); await english(L.eng.stairs); closeDlg(); s5exit();
      }), { label: '공연' });
    }), { label: '집합 장소' });
  };
}
function s5exit() {
  const near = () => (dist(SPOTS.exit) < dist(SPOTS.exit2) ? SPOTS.exit : SPOTS.exit2);
  setObj('🟩 <b>초록색 비상구</b> 표시를 따라 걸어서 나가요 (엘리베이터는 타지 않아요)', near);
  spot(SPOTS.lift[0], SPOTS.lift[1], () => { beep('bad'); toast('불이 났을 때 엘리베이터는 멈출 수 있어요. <b>비상구</b>로 걸어가요.', 3000); }, { keep: true, tag: 'lift', wrong: true, label: '🛗' });
  const out = () => run(async () => {
    clearItems(); spawnThCoins();
    await tell('', '✅ 이번에는 훈련 상황이었어요. 뛰지 않고, 밀지 않고, 비상구로 잘 나왔어요!', '휴~');
    good(2); nextStage();
  });
  spot(SPOTS.exit[0], SPOTS.exit[1], out, { label: '🟩 비상구', tag: 'exit' }); spot(SPOTS.exit2[0], SPOTS.exit2[1], out, { label: '🟩 비상구', tag: 'exit2' });
}

// ---- 6. 집합, 그리고 집으로 ----
function stage6() {
  warp(-8, -15.6, -Math.PI / 2, 1.6, 3); follow(['seoyeon', 'minjun']); placeNPC('teacher', LW.meet[0] - 1.4, LW.meet[1] + 0.6, W);
  placeNPC('jiho', P.x + 2.2, P.z + 1.3, W); // 지호가 시계를 보고 있어요
  setObj('⌚ 시계를 보던 <b>지호</b>에게 말을 걸어요', npcAt('jiho')); mark('jiho');
  NPC.jiho.talk = async () => {
    mark('jiho', false); NPC.jiho.talk = null;
    await tell('지호', '얘들아, 지금 2시 20분이야!', '벌써?');
    await quiz(L.back.time); closeDlg(); follow();
    setObj(`📍 ${L.meetTime} 전에 <b>${L.meetPlace}</b>의 선생님께 가요`, npcAt('teacher')); mark('teacher');
    NPC.teacher.talk = async () => {
      mark('teacher', false); NPC.teacher.talk = null;
      await quiz(L.back.missing, '선생님');
      await tell('선생님', '번호! … 모두 왔어요. 이제 정문 게이트로 나가요. 게이트를 바라보고 왼쪽으로 쭉 가면 버스 타는 곳이에요.', '네!');
      closeDlg();
      setObj('🚪 에스컬레이터를 타고 내려가 <b>정문 게이트</b>로 나가요', () => [11, -8.2]);
      spot(11, -8.2, () => run(async () => {
        await quiz(L.back.walk, '선생님'); closeDlg(); placeNPC('teacher', -31.4, -4.0, W);
        setObj('🚌 게이트를 바라보고 <b>왼쪽</b>으로 쭉! 주차장의 버스로 가요', () => [-33.4, -6.1]);
        spot(-33.4, -6.1, () => run(async () => {
          await quiz(L.back.seat, '선생님');
          flash('#000'); const [bx] = busDoor(myBus() - 1);
          warp(bx, 17, -Math.PI / 2, 0.01); follow(); placeNPC('teacher', 22, 38, W);
          await tell('', `🚌 한숨 자고 일어났더니… ${L.busPlace}에 도착했어요.`, '다 왔다');
          await quiz(L.back.home, '선생님'); closeDlg();
          setObj('🏫 왔던 길을 되짚어 <b>학교 정문</b>까지 걸어가요 (주차장 진출입로 조심!)', () => [29.9, 38]);
          spot(29.9, 38, () => {
            good(2); toast('👍 끝까지 안전하게 걸어왔어요! 별 +2', 2600);
            setObj('🏫 운동장의 <b>선생님</b>께 가요', npcAt('teacher')); mark('teacher');
            NPC.teacher.talk = async () => {
              mark('teacher', false);
              await english(L.eng.fun);
              await tell('선생님', '모두 안전하게 돌아왔어요! 마지막으로, 현장체험학습 날 내가 꼭 지킬 안전 약속을 써 봐요.', '약속 쓰기 ✏️');
              closeDlg(); openWriter();
            };
          }, { label: '정문' });
        }), { label: '버스' });
      }), { label: '게이트' });
    };
  };
}
function openWriter() {
  const f = $('#writer'); f.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const opt = L.pledges.map((p, i) => `<option value="${i}">${esc(p)}</option>`).join('');
  ['#wP1', '#wP2', '#wP3'].forEach((id, k) => { $(id).innerHTML = opt; $(id).value = k * 3; });
  if (S.card) { $('#wName').value = S.card.name || ''; (S.card.p || []).forEach((v, k) => { if (L.pledges[v]) $(['#wP1', '#wP2', '#wP3'][k]).value = v; }); }
  const upd = () => { $('#wPreview').innerHTML = cardHTML(cardData()); };
  f.oninput = upd; upd();
  $('#wRead').onclick = () => speakKo(cardText(cardData()).join('. '), true);
  $('#wDone').onclick = async () => {
    const c = cardData();
    if (!NAME_OK.test(c.name)) { toast('내 이름을 써 주세요.'); return; }
    if (new Set(c.p).size < 3) { toast('약속 세 가지를 서로 다르게 골라 주세요.'); return; }
    if ([$('#chk1').checked, $('#chk2').checked, $('#chk3').checked].includes(false)) { toast('약속을 지킬 준비가 됐는지 모두 확인해 주세요 ✅'); return; }
    S.card = c; addStar(3); save(); f.classList.remove('show'); beep('star');
    await tell('선생님', '멋진 약속이에요! 현장체험학습 날, 이 약속을 꼭 지켜요.', '네!');
    nextStage(); showEnd();
  };
}
function cardData() { return { name: $('#wName').value.trim(), p: [+$('#wP1').value, +$('#wP2').value, +$('#wP3').value] }; }
function cardText(c) { return ['나의 안전 약속', ...(c.p || []).map(i => L.pledges[i] || L.pledges[0]), `- ${c.name || '____'}`]; }
function cardHTML(c) {
  const t = cardText(c);
  return '<div class="cardPrev"><div><b style="color:var(--accent)">🛡️ ' + esc(t[0]) + '</b></div>' + t.slice(1, -1).map((l, i) => `<div>${i + 1}. ${esc(l)}</div>`).join('') + `<div style="text-align:right">${esc(t[t.length - 1])}</div></div>`;
}
// 자유 탐험: 세 구역을 오가는 이동 발판
function stageFree() {
  setObj('🎉 모든 미션 완료! 이동 발판으로 학교·버스·롯데월드를 다시 둘러보거나 <b>안전 표지 코인</b>을 모아 보세요', null);
  const pad = (x, z, label, to) => spot(x, z, () => { flash('#000'); hideFriends(); warp(...to); beep('get'); }, { keep: true, label, color: 0x74c0fc, r: 1.0, wrong: true });
  pad(6, 41.4, '🎢 롯데월드로', [13.6, -17.6, 0]); pad(-6, 41.4, '🚌 버스 안으로', [6.8, 2.5, Math.PI / 2]);
  pad(7.9, 2.4, '🎢 롯데월드로', [13.6, -17.6, 0]); pad(13.6, -19.6, '🏫 학교로', [0, 39, 0]); pad(8.4, -17.4, '🚌 버스 안으로', [6.8, 2.5, Math.PI / 2]);
}
function showEnd() {
  const e = $('#end'); e.classList.add('show'); openDlg(); ui.dlg.classList.remove('show');
  const acc = S.tries ? Math.round(S.correct / S.tries * 100) : 0;
  $('#endStats').innerHTML = `🛡️ 안전 점수 <b>${Math.round(S.safe == null ? RULE.start : S.safe)}점</b> · ⭐ 별 <b>${S.stars}</b> · 한 번에 맞힌 비율 <b>${acc}%</b> · 최고 연속 <b>${S.best}</b> · 안전 표지 코인 <b>${S.th.length}/${L.th.length}</b>`;
  $('#endCard').innerHTML = S.card ? cardHTML(S.card) : '';
  if (!showEnd.sent) { showEnd.sent = 1; track('finish', { stars: S.stars, correct: S.correct, tries: S.tries, best: S.best, card: S.card ? cardText(S.card).join(' ') + ` (안전 점수 ${Math.round(S.safe == null ? RULE.start : S.safe)}점${S.retry ? ', 다시 시작 ' + S.retry + '번' : ''})` : '' }); }
}
$('#endClose').onclick = () => { $('#end').classList.remove('show'); closeDlg(); };

// ---- 보너스: 안전 표지 코인 (롯데월드 안 실제 시설 앞에 있어요) ----
const TH_SPOTS = [[0.4, -35.4], [11.6, -34.2], [17.6, -35.4], [26.4, -36.4], [43.2, -39.4], [-41.6, -42.2]];
const TH_ICON = { '인포메이션': '❓', '의무실': '➕', '미아보호소': '🧒', '물품보관함': '🔐', '비상구': '🟩', 'AED': '❤' };
function spawnThCoins() {
  L.th.forEach((w, i) => {
    if (S.th.includes(w)) return;
    const g = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6b5200 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const t = textPlane(TH_ICON[w] || '★', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t.position.z = 0.07;
    const t2 = textPlane(TH_ICON[w] || '★', 0.5, { fs: 64, bg: null, fg: '#7a4b00' }, g); t2.position.z = -0.07; t2.rotation.y = Math.PI;
    const it = addItem(g, ...TH_SPOTS[i], (it) => {
      removeItem(it); S.th.push(w); save(); beep('star'); addStar();
      toast(`🪙 <b>${w}</b> (${S.th.length}/${L.th.length}) — ${L.thInfo[w] || ''}`, 5200);
      if (S.th.length === L.th.length) setTimeout(() => toast('🏅 안전 표지 코인을 모두 모았어요! 어디에 무엇이 있는지 다 알았네요.', 4000), 5300);
    }, { y: 1.3, r: 1.2, spin: 2 });
    it.bonus = true;
  });
}
NPC.bonus.talk = async () => {
  await tell('안전 지킴이', '안녕하세요! 저는 롯데월드 안전 지킴이예요. 여기에는 여러분을 지켜 주는 시설이 곳곳에 있어요.');
  await tell('', `🪙 인포메이션, 의무실, 미아보호소, 물품보관함, 비상구, AED 앞에 숨은 안전 표지 코인 ${L.th.length}개를 찾아보세요! (지금 ${S.th.length}개)`, '찾아볼게요');
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
    if (['Space', 'Enter', 'KeyE'].includes(e.code) && dlgNextFn && ui.dlg.classList.contains('show')) { e.preventDefault(); dlgNextFn(); }
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
// 도움말: 대화 중에 열었으면 닫을 때 그 대화로 돌아가요 (전에는 대화가 사라져서 그 뒤로 말을 걸 수 없었어요)
$('#helpBtn').onclick = () => { const h = $('#help'); h.dataset.was = !dlgOpen ? '' : ui.dlg.classList.contains('show') ? 'dlg' : 'other'; h.classList.add('show'); if (!dlgOpen) openDlg(); ui.dlg.classList.remove('show'); if (document.pointerLockElement) document.exitPointerLock(); };
$('#helpClose').onclick = () => { const h = $('#help'); h.classList.remove('show'); if (h.dataset.was === 'dlg') ui.dlg.classList.add('show'); else if (!h.dataset.was) closeDlg(); };
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
    { const tg = g.userData.tag; if (tg && !n.hideTag) tg.visible = g.position.distanceTo(camera.position) > 2.4; } // 카메라 바로 앞 사람의 이름표는 화면을 크게 가려서 숨겨요
    const m = g.userData.mark; if (m.visible) m.position.y = (m.userData.baseY || 2.75) + Math.sin(t * 4) * 0.1;
    const sc = d - (m.visible ? 3 : n.talk ? 1.2 : 0); // ❗ 붙은 미션 친구가 가장 먼저, 그다음 할 말이 있는 친구
    if (g.visible && d < 3.0 && sc < nd) { nd = sc; nearNPC = n; }
  }
  if (nearNPC && started && !dlgOpen) {
    ui.prompt.style.display = 'block';
    ui.prompt.innerHTML = (isTouch ? '👆 ' : '<b>E</b> ') + nearNPC.name + (nearNPC.talk ? '에게 말 걸기 ❗' : '에게 말 걸기');
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
  if (reset) { const keep = { koHelp: S.koHelp, rate: S.rate, medals: Array.isArray(S.medals) ? S.medals : [] }; S = Object.assign(fresh(), keep); save(); }
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
window.__mp = { scene, makePerson, textSprite, P, L, speak, toast, addStar, confetti, beep, isTouch, prompt: ui.prompt,
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
