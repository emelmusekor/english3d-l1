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
try { const q = new URLSearchParams(location.search).get('gfx') || localStorage.getItem('english3d_gfx'); if (q) { GFX.high = q === 'high'; GFX.auto = false; GFX.wantLite = q === 'lite'; GFX.fixed = !!new URLSearchParams(location.search).get('gfx'); } } catch (e) {}
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
// 아주 가볍게: 화면 해상도를 낮추고(픽셀 0.7배), 먼 곳은 안개로 가려 덜 그려요 (느린 크롬북용)
function setLite(on, why) {
  GFX.lite = on;
  renderer.setPixelRatio(on ? 0.7 : Math.min(window.devicePixelRatio || 1, GFX.high ? 1.5 : 1)); resize();
  scene.fog.near = on ? 26 : 55; scene.fog.far = on ? 80 : 160; camera.far = on ? 90 : 420; camera.updateProjectionMatrix();
  sky.scale.setScalar(on ? 0.22 : 1); sunDisk.scale.set(on ? 16 : 60, on ? 16 : 60, 1); clouds.visible = !on; // 하늘 공도 보이는 거리 안으로
  if (why) try { toast(on ? '🎨 그래픽: 아주 가볍게 (G 키로 바꾸기)' : '🎨 그래픽: 선명하게 (G 키로 바꾸기)'); } catch (e) {}
}
function setQuality(high, why) {
  GFX.high = high; if (high && GFX.lite) setLite(false);
  renderer.shadowMap.enabled = high; sun.castShadow = high;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.5 : 1)); resize();
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
const perf = { t0: 0, frames: 0, done: false };
let polishT = 1;
function gfxTick(dt, now) {
  sky.position.copy(camera.position);
  fogBase.copy(scene.fog.color); fogBase.getHSL(hsl);
  skyMat.uniforms.bottom.value.copy(fogBase);
  skyMat.uniforms.top.value.copy(fogBase).lerp(skyTop, hsl.s > 0.3 ? 0.55 : 0.15);
  sunDisk.position.copy(camera.position).addScaledVector(SUN_DIR, GFX.lite ? 80 : 300);
  sunDisk.visible = hsl.l > 0.6 && hsl.s > 0.3;
  clouds.rotation.y += dt * 0.004;
  sun.position.set(P.x + SUN_DIR.x * 60, SUN_DIR.y * 60, P.z + SUN_DIR.z * 60); sun.target.position.set(P.x, 0, P.z); sun.target.updateMatrixWorld();
  if ((polishT += dt) > 0.7) { polishT = 0; polish(scene); }
  if (started && !perf.done && !GFX.fixed) { // 처음 몇 초 동안 재서 느리면 한 단계씩 가볍게 (선명하게 → 가볍게 → 아주 가볍게)
    if (!perf.t0) perf.t0 = now;
    perf.frames++;
    if (now - perf.t0 > 5000) {
      const fps = perf.frames * 1000 / (now - perf.t0); perf.t0 = 0; perf.frames = 0;
      if (fps < 28 && GFX.high && GFX.auto) setQuality(false, true);
      else if (fps < 24 && !GFX.high && !GFX.lite && (GFX.auto || !GFX.wantLite)) { setLite(true, true); perf.done = true; }
      else perf.done = true;
    }
  }
  if (GFX.wantLite && !GFX.lite && started) { GFX.wantLite = false; setLite(true); }
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
    const sub = document.querySelector('#title .sub'); if (sub) { const v = document.createElement('span'); v.className = 'ver'; v.textContent = 'v3.0'; sub.appendChild(v); }
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
    const m = o.material; if (!m || Array.isArray(m) || m.transparent || m.map || m.alphaMap || !(m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshBasicMaterial)) return false;
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
    let nv = 0, ni = 0; for (const o of gr) { nv += o.geometry.attributes.position.count; ni += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    let vo = 0, io = 0;
    for (const o of gr) {
      const g = o.geometry, P0 = g.attributes.position, N0 = g.attributes.normal, mw = o.matrixWorld; nm.getNormalMatrix(mw);
      for (let i = 0; i < P0.count; i++) {
        v.fromBufferAttribute(P0, i).applyMatrix4(mw); pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
        v.fromBufferAttribute(N0, i).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
      }
      if (g.index) { const I = g.index.array; for (let k = 0; k < I.length; k++) idx[io + k] = I[k] + vo; io += I.length; }
      else { for (let k = 0; k < P0.count; k++) idx[io + k] = vo + k; io += P0.count; }
      vo += P0.count;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
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
solid(12, 5, 0.4, 0x343a40, 25, 2.5, 40.6).userData.plain = 1; // 무대 뒤판: 창문·띠를 달지 않아요
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
solid(40, 4, 0.4, 0xd0ebff, 0, 2, -41).userData.plain = 1; // 바다·북극 배경 벽: 창문을 달지 않아요
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
for (const [dx, dz] of [[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]]) { const m = solid(0.6, 5, 0.6, 0xffffff, WRITE.x + dx, 2.5, WRITE.z + dz); if (dx > 0) m.userData.plain = 1; } // 동쪽(간판 쪽) 기둥에는 차양을 달지 않아요(간판과 겹쳐요)
box(17, 0.4, 13, 0x2b8a3e, WRITE.x, 5.2, WRITE.z);
{ const s = textPlane("Let's Write · Earth Poster", 0.85, { fs: 62, bg: '#2b8a3e', fg: '#fff' }); s.position.set(WRITE.x + 8.6, 4.4, WRITE.z); s.rotation.y = Math.PI / 2; }
solid(0.4, 3.6, 10, 0xf8f9fa, WRITE.x - 7.6, 2, WRITE.z).userData.plain = 1; // 포스터 게시판
{ const p = textPlane('🌏 ' + L.posterSample.join('\n'), 3.0, { fs: 50, bg: '#ffffff', fg: '#2b8a3e', border: '#2b8a3e' }); p.position.set(WRITE.x - 7.35, 2.2, WRITE.z); p.rotation.y = Math.PI / 2; }
solid(2, 0.9, 1.2, 0xdeb887, WRITE.x - 1, 0.85, WRITE.z + 3);

// ---------- 남서 아래 길가: 새싹 화분 (Read and Play) ----------
for (let i = 0; i < 6; i++) { const x = -9 - (i % 3) * 1.4, z = 38 + Math.floor(i / 3) * 1.4; cyl(0.35, 0.25, 0.5, 0xc0703a, x, 0.25, z); ball(0.18, 0x51cf66, x, 0.6, z); }
{ const s = textPlane('🌱 Sprouts', 0.4, { fs: 48, bg: '#ffffff', fg: '#2b8a3e' }); s.position.set(-10.4, 1.5, 36.9); s.rotation.y = 0; }

// ---------- 꾸미기 소품 (v2.1 · 충돌 상자 없음) ----------
{
  const sign = (t, x, z, rot, o) => { if (clearAt(x, z, 0.3)) signPost(t, x, z, rot, o); };
  // 음악 축제 잔디밭 가장자리: 깃발 줄·풍선·파라솔
  bunting(36.4, 22, 36.4, 36.5, 3.6); bunting(14, 27.5, 14, 36.5, 3.6);
  prop(balloons, 17.6, 38.6); prop(balloons, 32.4, 38.6, [0x51cf66, 0xffd43b, 0x4dabf7]);
  prop(parasolTable, 34, 21.5, 0x51cf66);
  // Kai's Home 앞 모퉁이: 남쪽에 우편함·분리수거 통, 북쪽에 팻말
  prop(mailbox, -19.2, 9.2, Math.PI / 2); prop(binTrio, -18.4, 11.2, Math.PI / 2);
  sign('Save energy ⚡', -18.8, -13.6, Math.PI / 2, { h: 0.42 });
  // Eco Center 앞 모퉁이: 화분·자전거
  prop(flowerPot, 18.9, -13.2, 1.2, 0xffd43b); prop(flowerPot, 18.9, 9.2, 1.2, 0xffd43b);
  prop(bike, 22.5, 9.4, 0, 0x1c7ed6); prop(bike, 24.4, 9.5, 0.15, 0x2f9e44);
  sign('Recycle things ♻️', 18.6, 11.2, -Math.PI / 2, { h: 0.42 });
  // 수돗가 옆
  sign('Save water 💧', 12, 13, 0, { h: 0.42 });
  // 서쪽 잔디밭 쉼터 · 포스터 마당 입구
  prop(parasolTable, -11, 21, 0xffd43b);
  if (clearAt(-16.3, 23.4)) easel('Go\ngreen! 🌏', -16.3, 23.4, Math.PI / 2, { h: 0.75 });
}

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
// 차례가 아닌 친구에게 말을 걸었을 때 나오는 한 줄 안내 (평소 대사만 나오면 왜 안 되는지 알 수 없어서 넣었어요)
const tip = (msg) => async () => { await say('', '', typeof msg === 'function' ? msg() : msg, { btn: '알겠어!' }); closeDlg(); };
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
    // 다 줍기 전에 분리수거함의 Joel·Hajun 에게 가면 평소 대사만 나와서 왜 안 받는지 알 수 없었어요 → 몇 개 남았는지 안내
    NPC.joel.talk = NPC.hajun.talk = tip(() => `🗑 잔디밭의 쓰레기를 모두 주운 다음에 가져와요! (지금 ${stageState.got.can + stageState.got.bottle}/6)`);
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
  // 병을 받을 Hajun 에게 먼저 가면 평소 대사만 나왔어요 → 순서 안내 (Joel 과 이야기하면 아래에서 진짜 대화로 바뀌어요)
  NPC.hajun.talk = tip('🥫 먼저 옆에 있는 Joel에게 캔을 줘요!');
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
  // 설명을 듣기 전에 친구에게 먼저 말을 걸면 평소 대사(들어야 할 권유)만 나오고 세어지지 않았어요 → 안내
  L.kids.forEach(k => { NPC[k.id].talk = tip('♻️ 먼저 Ms. Green에게 가서 설명을 들어요!'); });
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
    await ask('나', 'Lily가 되어 Kai에게 권유해 보세요. 🪜', '알맞은 말을 고르세요.', ['Kai, h' + HA('using the stairs').slice(1), 'Kai, h' + HA('using a cup').slice(1), 'Kai, h' + HA('recycling paper').slice(1), 'Kai, h' + HA('turning off the water').slice(1)], { me: true });
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
  const all = shuffle(words.concat(extra)), placed = [];
  all.forEach((w, i) => {
    // 블록이 내 발밑에 생기면 나오자마자 "순서가 아니에요"가 뜨고 별이 깎였어요 → 내 자리(2.6m)와 다른 블록(1.7m)을 피해서 놓아요
    let x = 0, z = 0;
    for (let k = 0; k < 40; k++) {
      const a = k ? Math.random() * Math.PI * 2 : (i / all.length) * Math.PI * 2 + Math.random() * 0.3, r = 5.5 + Math.random() * 3.5;
      x = BLK.x + Math.sin(a) * r; z = BLK.z + Math.cos(a) * r;
      if (dist([x, z]) > 2.6 && placed.every(q => Math.hypot(q[0] - x, q[1] - z) > 1.7)) break;
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
      await ask('', "You're right. We should ______ things.", '빈칸에 알맞은 말', ['recycle', 'turn', 'drink'], { sayIt: false });
      await ask('', "Let's help Lumi, too. How about ______ the lights?", '빈칸에 알맞은 말', ['turning off', 'using', 'recycling'], { sayIt: false });
      await ask('', 'Okay. We should ______ energy.', '빈칸에 알맞은 말', ['save', 'recycle', 'use'], { sayIt: false });
      speak('How about turning off the lights? We should save energy.', 'Narrator');
      await say('Lumi', 'Thank you! We should save the earth.', '고마워요! 우리는 지구를 구해야 해요.', { speak: false });
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
    await ask('', 'Sophie의 포스터에 없는 권유는?', '포스터의 How about ~? 문장과 비교해 보세요.', [HA('recycling paper'), HA('turning off the lights'), HA('using the stairs')], { sayIt: false });
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
    if (!NAME_OK.test(c.name)) { toast('내 이름을 영어로 써 주세요. (예: Minsu)'); return; }
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
