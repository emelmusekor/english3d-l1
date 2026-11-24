/* 영어 3D · 놀이 층 (모든 단원이 같이 써요) — 물건과의 상호작용
 * [3차] 관문은 한 번뿐이에요(틀리면 그 도전은 끝, 보석은 그대로. 다시 E 하면 다른 문제). 간판(이름+💎값)·바닥 고리, 연·낚시·농구·보물 상자와 단원 놀이가 하나씩 더 있어요.
 * [2차] 💎 보석(fun.js 가 센 '모은 수 − 쓴 수')을 내고, 그 단원 영어 표현을 맞혀야 탈 수 있어요(공 차기·벤치는 무료). 단원마다 그 단원 표현으로 하는 놀이가 두 가지씩 있어요(L2 푸드 트럭 등).
 * ✈️ 비행기 타기 · ⚽ 공 차기(골대) · ⛲ 분수(동전 던지고 소원 빌기·무지개) · 🪑 벤치에 앉기 · 그네 · 트램펄린 ·
 * 🛴 킥보드 · 🎈 풍선 터뜨리기 · 🔔 종 치기 · 🎆 불꽃놀이 버튼 · ⛄ 눈사람 / 🏰 모래성 만들기
 * - 단원 세계 파일은 건드리지 않아요. 실행 중에 빈 자리(벽·건물·사람·미션 자리와 떨어진 곳)를 찾아 놓아요. 단원 번호가 씨앗이라 늘 같은 자리예요.
 * - 미션이 먼저예요: ❗ 붙은 친구·말할 것이 있는 친구가 옆에 있으면 E 는 그 친구에게 가요. 미션 물건·사람이 놀이 기구 자리에 오면 그 기구는 잠깐 비켜요(숨어요).
 * - 별(⭐)은 주지도 깎지도 않아요(정답률·서버 기록도 그대로). 보석은 쓰기만 해요(벌기는 미션에서). 축하 효과와 '오늘의 놀이' 도장만 있어요.
 * - 엔진(game.js)과는 window.__play(연결 지점)와 엔진이 부르는 PLAY.interact / drive / cam / map / speed 로만 이어져 있어요. 이 파일이 없어도 게임은 그대로 돼요.
 * - ?autotest 일 때는 아무것도 하지 않아요. ?noplay 로 끌 수 있어요.
 */
(() => {
'use strict';
const G = window.__play;
if (!G || window.PLAY || !window.THREE) return;
let qs; try { qs = new URLSearchParams(location.search); } catch (e) { return; }
if (qs.has('autotest')) {
  if (qs.has('playrec')) { // 개발용: 자동 테스트가 지나가는 미션 자리(사람·물건·목표)를 적어 둬요 → 아래 AVOID 표
    const seen = {}; const el = document.createElement('pre'); el.id = 'playRec'; el.style.display = 'none'; document.body.appendChild(el);
    const put = (k, x, z) => { if (!isFinite(x) || !isFinite(z)) return; seen[k + Math.round(x) + ',' + Math.round(z)] = 1; };
    setInterval(() => { try {
      for (const id in G.NPC) { const g = G.NPC[id].g; if (g.visible) put('n', g.position.x, g.position.z); }
      for (const it of G.items) if (it.alive) put('i', it.x, it.z);
      const o = G.objective; if (o && o.pos) { const p = o.pos(); if (p) put('o', p[0], p[1]); }
      put('p', G.P.x, G.P.z);
      el.textContent = Object.keys(seen).join(' ');
    } catch (e) {} }, 120);
  }
  return;
}
if (qs.has('noplay') || !(G.lessonNo >= 1 && G.lessonNo <= 12)) return;
const THREE = window.THREE, P = G.P, CAM = G.CAM, scene = G.scene, camera = G.camera, keys = G.keys;
let errN = 0;
const warn = (e) => { if (errN++ < 8) try { console.warn('play.js', e); } catch (er) {} };
// 여기서 난 오류가 게임을 멈추지 않게 모두 감싸요
const safe = (f, dflt) => function () { try { return f.apply(this, arguments); } catch (e) { warn(e); return dflt; } };
const hyp = Math.hypot, PI = Math.PI;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const angDiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };
const smooth = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
let seed = (G.lessonNo * 7919 + 101) | 0; // 자리 정하기는 단원 번호가 씨앗 (늘 같은 자리)
const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length) % a.length];
// 자리 고르기에 쓰는 흔들림: 칸 자리로만 정해져요 (둘레가 조금 달라져도 다른 칸의 값은 그대로라서 자리가 잘 안 바뀌어요)
const hn = (i, j, k) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k + G.lessonNo * 131, 1274126177)) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };
const fire = (type, data) => { try { window.dispatchEvent(new CustomEvent('e3dplay', { detail: { type, data: data || {} } })); } catch (e) {} };
const eKey = () => (G.isTouch ? '👆 버튼' : '<b>E</b>');

// 자동 테스트가 지나간 미션 자리(사람·물건·목표). 2m 칸, 글자 둘이 한 자리(x, z). 이 자리 둘레에는 놀이 기구를 놓지 않아요.
const AB = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const AVOID = {
  1: '4T4c557V7b7c7d7e7f8H9B9G9M9SA5ARATC6D5DCFcGCH5H6HNHOHPIVJJJPJTJVJWKQKTKVL5L6LNLTMaN2N7NANBNGNMNNNSNTNUNVNXOLOTOVP6PFPGPLQ5QHQPQRRHRIRJRORPRRRSRhShTNTOTPThU6UXV5V8XCY5Z6Z7ZJbGbMbSbcbddOdRfhgA',
  2: '4U4c559J9L9N9P9QALAPBABdC9CBCPGCH9HBHXHYIKIPJLJNJPJRJSJTKNKRL9LBLFLTN2NBNFNMNNNTNXOUOVP9PAPBPFPNPTPdPeQTRLRNRORPRRRTRURVSKSPTATTTZXDXEYEZ9ZAZBZcZdaNbNccdMfhg7',
  3: '4U4c558J8L8P9J9K9LBbBdD2H5I5IXJLJOJPJXKDLLLPLRLZMLNLNRNSNTNXOJORPLPNQRR7RMRNRPRQRVRXS6T5TKTLTNUJULUNVJVKVLVNYKZKZPZQaPaQaRbLbRcKdKfhg7',
  4: '3h4U558P8Q9N9PALB3BLBbBdFLFOGOH6H7HWI5JOKDKNKOLLLMLQLRNJNKNLNRNSNTNXNaOLOZOaPLPPPQPbQLQZRNRPT6T7ZJZdabbbdKdMdNdPdRg8gh',
  5: '4U4h557L7O7P7R8O8P9J9L9M9N9PAPB4BHBIBKBPBeH6J5JNJPJQKDKNKRLLLMLRMJMLNLNRNSNTNXORPLPMPPQLQNQPQVRLRNRQRTRURVS6S7TKTLTNU7UJULUNVJVKVLVNVXVYVZXZXaXdYKZKZZZbZebXbddadeg7gW',
  6: '3c454U7J7K7L7N7P7Q8J8K8L8N8P8Q9J9L9M9N9PAJALAMANAPBMBdCMD2I7IZJMJNJOJPJXJYJZKDKLKPKQLLLOLRLSNRNSNTNXOJOKOLOTPJPKPLPMQLQNQOQZR7RNRQRZS7TXTZVbYcZKZQZdaJaOaPabbJbObPbRbdcedJdOg8gh',
  7: '3W557J7L7N7P7Q8J8L8N8P8Q9e9fBJCJD2EdF5H5H6HYHZHaJ7JNJPJQK7K8KDKOKRLLLMLRLSNLNRNSNTNXOLOSPLPPQNRNRORQRRS5SZT5T6TYTZTaV5VJVKVLZJZPZQaJbJbLbMcMcPcQdNdPdQdVdWdXeWfhg7hS',
  8: '2M4U6B77787B7P85959L9NB5B7B8BBBUBdCVEBFBFPFhH6H7HbJLJMJPKDKLKPKRLLLMLPLQLRMKN6N7NJNKNLNRNSNTNXOSPLPPQLQNQOQPQQRMRNT6T7UDZLZNZOaLc5d7dhhF',
  9: '3D3h4U7P8P9K9LA9B9BLBdFQGHGIGRH4HLHQIDIUJCJMJNJPKPLCLDLLLMLQLRNLNRNSNTNXO8OKOLORPLPPPQPTQIQLQOQRQTQVQXQYRLRMRORRRTRVRXSTSVSYZOaAbAbMbOcLgFgi',
  10: '3B6g7X8b8c9H9L9P9WBZDHDLDPDXDYDZF9FLFbFcG2GAGLGVGWH9HVHWHXJNJPJQK6KEKPLMLPLSM6M7NLNRNSNTNXOLORPKPLPMQPR7RNRPRQT7T8ViXXYXZXZdZfaJaNbSbUbXcXdLdXg3hR',
  11: '343R3c3f4Q4R5Q5e5f7T8K8T9Q9R9S9T9f9gAQATAfBBBRBSBTBdBeDDDREDEhEjFcGRGbHdJYJdKKLHLILJLKLLLMLNLdLeLfMHMNMfNHNMNNNXOHOLPHPIPJPKPLPMPdQ3QJTDTRV9VbWQXBXRXTYRZRZTZVbBbRbecKcfdDdReBeQfQfRfSgRiTiY',
  12: '3X6Z6a767K7L7O7Z7b7d878J8M8P8Q8Z8b8c979Q9Y9Z9bA8AXAZAbBNBPBYBcBdDGFUHXHZHcI1IYJ5JNJQK5KQKRKXLNLRMLNKNRNSNTNXOSOTPLPMPPQ5QMQPR5RERPTVVNYJYPYbZJZNZPZbZcZdaJaNbJbNcJcNdJdNeJeifJh7'
};

// ---------------- 저장: 오늘 해 본 놀이 (별은 주지 않아요) ----------------
const KEY = 'english3d_play_v1';
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const DAY = { d: today(), goals: 0, tried: {}, hi: {}, all: 0 };
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.d === DAY.d) { DAY.goals = Math.max(0, +s.goals || 0); if (s.tried && typeof s.tried === 'object') DAY.tried = s.tried; if (s.hi && typeof s.hi === 'object') DAY.hi = s.hi; DAY.all = s.all ? 1 : 0; DAY.fish = Math.max(0, +s.fish || 0); if (typeof s.deco === 'string') DAY.deco = s.deco; } } catch (e) {}
const saveDay = () => { try { localStorage.setItem(KEY, JSON.stringify(DAY)); } catch (e) {} };

const ST = { ready: false, dead: false, things: [], kinds: [], ride: null, tgt: null, seatMe: null, lx: 0, lz: 0, pvx: 0, pvz: 0, confT: 0, actText: null, top: false, placed: [], t: 0, boostT: 0, hiT: 0, spotN: 0, danceT: 0 };

const roam = (r) => !!r && (r.kind === 'scooter' || r.kind === 'bike'); // 타고도 내 마음대로 다니는 것 (킥보드·자전거)
// 안내 쪽지. 오늘 처음 해 본 놀이면 '오늘의 놀이' 도장도 찍어요
function tell(kind, html, ms) {
  let extra = ''; if (kind) ST.used = true;
  if (kind && !DAY.tried[kind]) {
    DAY.tried[kind] = 1; saveDay(); fire('try', { kind });
    const n = ST.kinds.filter(k => DAY.tried[k]).length, all = ST.kinds.length;
    extra = '<br><small>오늘의 놀이 ' + n + '/' + all + ' ✅</small>';
    if (n >= all && !DAY.all) { DAY.all = 1; saveDay(); setTimeout(safe(() => { G.toast('🏅 오늘의 놀이를 모두 해 봤어요! 대단해요!', 3200); G.confetti(80); G.beep('fanfare'); }), 2800); }
  }
  if (html) G.toast(html + extra, ms || 2600);
}

// ---------------- 만들기 도구 ----------------
const MATS = {};
const mat = (c) => MATS[c] || (MATS[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0 }));
const tag = (m) => { m.userData.camBig = 0; return m; }; // 카메라 가림 계산에서 빼요
const add = (m, x, y, z, parent) => { m.position.set(x, y, z); (parent || scene).add(tag(m)); return m; };
const box = (w, h, d, c, x, y, z, parent) => add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? mat(c) : c), x, y, z, parent);
const cyl = (rt, rb, h, c, x, y, z, parent, seg) => add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), typeof c === 'number' ? mat(c) : c), x, y, z, parent);
const sph = (r, c, x, y, z, parent) => add(new THREE.Mesh(new THREE.SphereGeometry(r, r < 0.13 ? 8 : 12, r < 0.13 ? 5 : 8), typeof c === 'number' ? mat(c) : c), x, y, z, parent);
const grp = (x, z, rot, parent) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; (parent || scene).add(g); return g; };
const dyn = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); g.userData.dyn = 1; parent.add(g); return g; }; // 움직이는 부분 (합치지 않아요)
const noRay = (o) => { o.raycast = () => {}; o.userData.pol = 1; return o; };
// 움직이지 않는 부품을 한 덩어리로 합쳐요 (그리기 횟수를 줄여요). 색은 꼭짓점 색으로 옮겨요.
const bakedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }); // 그릇·항아리처럼 속이 보이는 모양도 있어서 양면
function bake(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), m4 = new THREE.Matrix4(), list = [];
  const walk = (o) => {
    if (o !== root && o.userData.dyn) return;
    const m = o.material;
    if (o.isMesh && m && m.isMeshStandardMaterial && !m.transparent && !m.map && !m.vertexColors && !o.userData.keep && MATS[m.color.getHex()] === m) list.push(o);
    for (const c of o.children) walk(c);
  };
  walk(root);
  if (list.length < 2) return null;
  let n = 0; const parts = [];
  for (const o of list) { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); m4.multiplyMatrices(inv, o.matrixWorld); g.applyMatrix4(m4); parts.push([g, o.material.color]); n += g.attributes.position.count; }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let k = 0;
  for (const [g, c] of parts) {
    const cnt = g.attributes.position.count; pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3);
    for (let i = 0; i < cnt; i++) { col[(k + i) * 3] = c.r; col[(k + i) * 3 + 1] = c.g; col[(k + i) * 3 + 2] = c.b; }
    k += cnt; g.dispose();
  }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  for (const o of list) { o.parent.remove(o); o.geometry.dispose(); }
  const m = tag(new THREE.Mesh(bg, bakedMat)); root.add(m); return m;
}
const dotTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
// 화면 깜빡 (타고 내릴 때 카메라가 바뀌는 순간을 가려요)
const blinkEl = document.createElement('div'); blinkEl.style.cssText = 'position:fixed;inset:0;background:#1d3557;opacity:0;pointer-events:none;z-index:3;transition:opacity .4s';
document.body.appendChild(blinkEl);
function blink() { blinkEl.style.transition = 'none'; blinkEl.style.opacity = '.6'; requestAnimationFrame(() => requestAnimationFrame(() => { blinkEl.style.transition = 'opacity .4s'; blinkEl.style.opacity = '0'; })); }

// ---------------- 작은 효과: 떠오르는 그림 글자 · 반짝 터짐 ----------------
const EMO = { list: [], mats: {} };
function emo(text, x, y, z, size) {
  let s = null; for (const k of EMO.list) if (k.life <= 0) { s = k; break; }
  if (!s) { if (EMO.list.length >= 6) s = EMO.list[0]; else { const sp = noRay(new THREE.Sprite()); sp.visible = false; scene.add(sp); s = { sp, life: 0, i: EMO.list.length }; EMO.list.push(s); } }
  const key = s.i + text; let m = EMO.mats[key];
  if (!m) { const t = G.textSprite(text, 1, { fs: 64, bg: null, pad: 8 }); m = EMO.mats[key] = { m: t.material, w: t.scale.x }; m.m.depthWrite = false; m.m.toneMapped = false; }
  s.sp.material = m.m; s.w = m.w; s.size = size || 0.6; s.life = s.max = 1.3; s.sp.position.set(x, y, z); s.sp.visible = true;
}
const FW = { list: [], cap: 0, trails: [] };
function burst(x, y, z, o) { // o: { n, sp(속도), life, size, cols:[hex…], g(중력) }
  if (!FW.cap) FW.cap = G.GFX.high ? 44 : 26;
  let b = null; for (const k of FW.list) if (k.life <= 0) { b = k; break; }
  if (!b) {
    if (FW.list.length >= 6) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FW.cap * 3), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(FW.cap * 3), 3));
    const pts = noRay(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.5, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, fog: false })));
    pts.frustumCulled = false; pts.visible = false; scene.add(pts);
    b = { pts, vel: new Float32Array(FW.cap * 3), life: 0 }; FW.list.push(b);
  }
  const n = Math.min(FW.cap, o.n || FW.cap), pa = b.pts.geometry.attributes.position, ca = b.pts.geometry.attributes.color, c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * PI * 2, s = Math.sqrt(1 - u * u), v = (o.sp || 6) * (0.75 + Math.random() * 0.35);
    b.vel[i * 3] = Math.cos(a) * s * v; b.vel[i * 3 + 1] = u * v; b.vel[i * 3 + 2] = Math.sin(a) * s * v;
    pa.setXYZ(i, x, y, z); c.set(o.cols[i % o.cols.length]); ca.setXYZ(i, c.r, c.g, c.b);
  }
  b.pts.geometry.setDrawRange(0, n); pa.needsUpdate = true; ca.needsUpdate = true;
  b.n = n; b.life = b.max = o.life || 1.5; b.g = o.g == null ? 4 : o.g; b.pts.material.size = o.size || 0.55; b.pts.material.opacity = 1; b.pts.visible = true;
}
function fxTick(dt) {
  for (const s of EMO.list) {
    if (s.life <= 0) continue;
    s.life -= dt; const k = 1 - Math.max(0, s.life) / s.max, sz = s.size * (0.7 + Math.min(1, k * 4) * 0.3);
    s.sp.position.y += dt * 0.9; s.sp.scale.set(sz * s.w, sz, 1); s.sp.material.opacity = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    if (s.life <= 0) s.sp.visible = false;
  }
  for (const b of FW.list) {
    if (b.life <= 0) continue;
    b.life -= dt; const pa = b.pts.geometry.attributes.position, a = pa.array, v = b.vel, dr = Math.max(0, 1 - 1.4 * dt);
    for (let i = 0; i < b.n * 3; i += 3) { v[i] *= dr; v[i + 1] = v[i + 1] * dr - b.g * dt; v[i + 2] *= dr; a[i] += v[i] * dt; a[i + 1] += v[i + 1] * dt; a[i + 2] += v[i + 2] * dt; }
    pa.needsUpdate = true; b.pts.material.opacity = clamp(b.life / b.max * 1.6, 0, 1);
    if (b.life <= 0) b.pts.visible = false;
  }
  for (const tr of FW.trails) {
    if (!tr.on) continue;
    tr.t += dt; const k = tr.t / tr.dur;
    if (k >= 1) { tr.on = false; tr.sp.visible = false; burst(tr.x, tr.y, tr.z, { sp: 8.5, life: 1.8, size: 1.05, cols: tr.cols }); G.beep([[140, .07], [90, .16]]); continue; }
    tr.sp.position.set(tr.x0 + (tr.x - tr.x0) * k, 1 + (tr.y - 1) * (1 - (1 - k) * (1 - k)), tr.z0 + (tr.z - tr.z0) * k);
  }
}
function rocket(x0, z0, x, y, z, cols) { // 쏘아 올린 뒤 하늘에서 터져요
  let tr = null; for (const k of FW.trails) if (!k.on) { tr = k; break; }
  if (!tr) { if (FW.trails.length >= 5) return; const sp = noRay(new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xfff3bf, transparent: true, depthWrite: false, toneMapped: false, fog: false }))); sp.scale.set(0.5, 0.9, 1); sp.visible = false; scene.add(sp); tr = { sp, on: false }; FW.trails.push(tr); }
  Object.assign(tr, { on: true, t: 0, dur: 0.9, x0, z0, x, y, z, cols }); tr.sp.visible = true; tr.sp.position.set(x0, 1, z0);
}

// ---------------- 빈자리 찾기 ----------------
// 0.5m 칸. wall = 충돌 상자(걸어서 갈 수 있는지), occ = 무엇인가 있는 곳(건물·지붕·나무·간판·바닥 깔린 방·미션 자리), path = 길, hgt = 그 칸에서 가장 높은 것의 높이
const GR = { cs: 0.5, o: -47, N: 188, wall: null, occ: null, path: null, pave: null, hgt: null, dist: null, distP: null, reach: null, maxH: 0 };
const gcell = (v) => clamp(Math.floor((v - GR.o) / GR.cs), 0, GR.N - 1);
const gpos = (i) => GR.o + (i + 0.5) * GR.cs;
const gin = (x, z) => x > -47 && x < 47 && z > -47 && z < 47;
const distAt = (x, z) => gin(x, z) ? GR.dist[gcell(z) * GR.N + gcell(x)] : 0;
const hgtAt = (x, z) => gin(x, z) ? GR.hgt[gcell(z) * GR.N + gcell(x)] : 0;
const pathAt = (x, z) => gin(x, z) ? GR.path[gcell(z) * GR.N + gcell(x)] : 0;
const distPAt = (x, z) => gin(x, z) ? GR.distP[gcell(z) * GR.N + gcell(x)] : 99;
const paveAt = (x, z) => gin(x, z) ? GR.pave[gcell(z) * GR.N + gcell(x)] : 0;
const reachAt = (x, z) => gin(x, z) ? GR.reach[gcell(z) * GR.N + gcell(x)] : 0;
function gridRect(arr, x1, x2, z1, z2, v) {
  if (x2 < -47 || x1 > 47 || z2 < -47 || z1 > 47) return;
  const N = GR.N, i1 = gcell(x1), i2 = gcell(x2), j1 = gcell(z1), j2 = gcell(z2);
  for (let j = j1; j <= j2; j++) for (let i = i1; i <= i2; i++) { const c = j * N + i; if (v === undefined) arr[c] = 1; else if (arr[c] < v) arr[c] = v; }
}
function distField(mask) {
  const N = GR.N, dist = new Float32Array(N * N), D1 = 1, D2 = 1.4142;
  for (let c = 0; c < N * N; c++) dist[c] = mask[c] ? 0 : 1e6;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = j * N + i; let v = dist[c]; if (!v) continue;
    if (i > 0) v = Math.min(v, dist[c - 1] + D1); if (j > 0) { v = Math.min(v, dist[c - N] + D1); if (i > 0) v = Math.min(v, dist[c - N - 1] + D2); if (i < N - 1) v = Math.min(v, dist[c - N + 1] + D2); }
    dist[c] = v;
  }
  for (let j = N - 1; j >= 0; j--) for (let i = N - 1; i >= 0; i--) {
    const c = j * N + i; let v = dist[c]; if (!v) continue;
    if (i < N - 1) v = Math.min(v, dist[c + 1] + D1); if (j < N - 1) { v = Math.min(v, dist[c + N] + D1); if (i < N - 1) v = Math.min(v, dist[c + N + 1] + D2); if (i > 0) v = Math.min(v, dist[c + N - 1] + D2); }
    dist[c] = v;
  }
  for (let c = 0; c < N * N; c++) dist[c] *= GR.cs;
  return dist;
}
function buildGrid() {
  const N = GR.N, wall = GR.wall = new Uint8Array(N * N), occ = GR.occ = new Uint8Array(N * N), path = GR.path = new Uint8Array(N * N), pave = GR.pave = new Uint8Array(N * N), hgt = GR.hgt = new Float32Array(N * N);
  for (const c of G.colliders) { gridRect(wall, c.x1 - 0.3, c.x2 + 0.3, c.z1 - 0.3, c.z2 + 0.3); gridRect(occ, c.x1 - 0.3, c.x2 + 0.3, c.z1 - 0.3, c.z2 + 0.3); }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = gpos(i), z = gpos(j); if (Math.abs(x) > 44.4 || Math.abs(z) > 44.4) { wall[j * N + i] = 1; occ[j * N + i] = 1; } }
  // 장면에 있는 것들: 사람·미션 물건은 빼요(미션마다 자리가 달라서 → AVOID 표와 '잠깐 비키기'가 맡아요)
  scene.updateMatrixWorld(true);
  const skip = new Set(); for (const id in G.NPC) skip.add(G.NPC[id].g); for (const it of G.items) if (it.mesh) skip.add(it.mesh);
  const b = new THREE.Box3();
  const walk = (o) => {
    if (!o.visible || o.isSprite || o.isPoints || o.isInstancedMesh || o.isLight || skip.has(o) || o === CAM.me) return;
    if (o.userData.anim) { const q = o.position; gridRect(occ, q.x - 0.7, q.x + 0.7, q.z - 0.7, q.z + 0.7); gridRect(hgt, q.x - 0.7, q.x + 0.7, q.z - 0.7, q.z + 0.7, 2); return; } // 서 있는 사람(꾸밈)
    if (o.isMesh && o.geometry) {
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      const w = b.max.x - b.min.x, d = b.max.z - b.min.z, basic = m && m.isMeshBasicMaterial;
      const flat = !basic && b.max.y <= 0.22 && b.max.y > 0.005 && w < 200 && d < 200, lane = flat && Math.min(w, d) <= 10 && Math.max(w, d) >= 22;
      if (lane) gridRect(path, b.min.x, b.max.x, b.min.z, b.max.z); // 좁고 긴 길
      else if (flat && w * d >= 700) gridRect(pave, b.min.x, b.max.x, b.min.z, b.max.z); // 넓게 깔린 마당
      if (w < 70 && d < 70 && Math.abs(b.min.x + b.max.x) < 104 && Math.abs(b.min.z + b.max.z) < 104 && b.max.y > 0.005 && b.min.y < 30 && !(basic && m.transparent && !m.map) && !(basic && !m.map && w < 1.5 && d < 1.5)) {
        if (b.max.y > 0.22) { gridRect(occ, b.min.x - 0.2, b.max.x + 0.2, b.min.z - 0.2, b.max.z + 0.2); gridRect(hgt, b.min.x - 0.3, b.max.x + 0.3, b.min.z - 0.3, b.max.z + 0.3, b.max.y); }
        else if (!basic && !lane && w * d < 700) gridRect(occ, b.min.x - 0.2, b.max.x + 0.2, b.min.z - 0.2, b.max.z + 0.2); // 낮게 깔린 것: 방 바닥·빙판·연못 같은 곳
      }
    }
    for (const c of o.children) walk(c);
  };
  walk(scene);
  let mh = 0; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const h = hgt[j * N + i]; if (h > mh && Math.abs(gpos(i)) < 46.5 && Math.abs(gpos(j)) < 46.5) mh = h; }
  GR.maxH = mh;
  // 들어가면 일이 생기는 구역(교실·가게 등)
  const gm = window.__game || {};
  for (const k of ['zones', 'roomInfo', 'boothInfo', 'stallInfo']) {
    let v = null; try { v = gm[k]; } catch (e) {}
    if (!v || typeof v !== 'object') continue;
    for (const r of (Array.isArray(v) ? v : Object.values(v))) if (r && isFinite(r.x1) && isFinite(r.x2) && isFinite(r.z1) && isFinite(r.z2)) gridRect(occ, r.x1 - 0.5, r.x2 + 0.5, r.z1 - 0.5, r.z2 + 0.5);
  }
  // 미션 자리 · 시작 지점 · 교문(포탈)
  const av = AVOID[G.lessonNo] || '';
  for (let k = 0; k + 1 < av.length; k += 2) { const x = AB.indexOf(av[k]) * 2 - 46, z = AB.indexOf(av[k + 1]) * 2 - 46; gridRect(occ, x - 1.6, x + 1.6, z - 1.6, z + 1.6); }
  gridRect(occ, -5, 5, 34, 47);
  // 가장 가까운 '무엇인가 있는 칸' / 길까지의 거리(m)
  GR.dist = distField(occ); GR.distP = distField(path);
  // 시작 지점에서 걸어서 갈 수 있는 칸
  const reach = GR.reach = new Uint8Array(N * N), q = new Int32Array(N * N); let h = 0, tl = 0, s = -1;
  const ci = gcell(0), cj = gcell(40);
  for (let R = 0; R <= 10 && s < 0; R++) for (let dj = -R; dj <= R && s < 0; dj++) for (let di = -R; di <= R; di++) { const a = ci + di, bb = cj + dj; if (a >= 0 && bb >= 0 && a < N && bb < N && !wall[bb * N + a]) { s = bb * N + a; break; } }
  if (s < 0) return false;
  q[tl++] = s; reach[s] = 1;
  while (h < tl) {
    const c = q[h++], a = c % N, bb = (c / N) | 0;
    if (a > 0 && !wall[c - 1] && !reach[c - 1]) { reach[c - 1] = 1; q[tl++] = c - 1; }
    if (a < N - 1 && !wall[c + 1] && !reach[c + 1]) { reach[c + 1] = 1; q[tl++] = c + 1; }
    if (bb > 0 && !wall[c - N] && !reach[c - N]) { reach[c - N] = 1; q[tl++] = c - N; }
    if (bb < N - 1 && !wall[c + N] && !reach[c + N]) { reach[c + N] = 1; q[tl++] = c + N; }
  }
  return true;
}
const tooClose = (x, z, r, gap) => { for (const p of ST.placed) if (hyp(p.x - x, p.z - z) < p.r + r + gap) return true; return false; };
// 반지름 r 인 둥근 자리 하나. near 를 주면 그 가까이를 좋아해요.
function spot(r, o) {
  o = o || {}; const N = GR.N, salt = ++ST.spotN; let best = null, bs = -1e9;
  for (let pass = 0; pass < 2 && !best; pass++) {
    const m = pass ? 0.3 : 0.9, gap = pass ? 0.5 : 1.3;
    for (let j = 6; j < N - 6; j += 2) for (let i = 6; i < N - 6; i += 2) {
      const c = j * N + i; if (!GR.reach[c]) continue; const d = GR.dist[c]; if (d < r + m || (!pass && GR.distP[c] < r + 0.3)) continue; // 처음에는 길도 피해요
      const x = gpos(i), z = gpos(j); if (tooClose(x, z, r, gap)) continue;
      let s = Math.min(d - r, 4) + hn(i, j, salt) * 2.2 - (GR.path[c] ? 3 : 0) - (o.lawn && GR.pave[c] ? 3 : 0) - hyp(x, z - 6) * 0.035;
      if (o.near) s -= hyp(x - o.near[0], z - o.near[1]) * (o.nearW || 0.12);
      if (o.far) s += Math.min(45, hyp(x - o.far[0], z - o.far[1])) * 0.14; // 멀수록 좋아요 (버스 정류장 둘째)
      if (s > bs) { bs = s; best = { x, z }; }
    }
  }
  if (best) ST.placed.push({ x: best.x, z: best.z, r });
  return best;
}
// 활주로: 길이 2*hl, 너비 5. 뜨는 쪽에 높은 것이 없는 방향을 골라요.
function findStrip(hl, H, strict) {
  const N = GR.N, need = 3.0; let best = null, bs = -1e9;
  for (let j = 8; j < N - 8; j += 2) for (let i = 8; i < N - 8; i += 2) {
    const c = j * N + i; if (!GR.reach[c] || GR.dist[c] < need + 0.4) continue;
    const x = gpos(i), z = gpos(j), base = Math.min(GR.dist[c], 7) * 0.5 + hn(i, j, 0) * 1.2 - hyp(x, z) * 0.02;
    for (let k = 0; k < 8; k++) {
      const h = k * PI / 4, dx = Math.sin(h), dz = Math.cos(h), e = hl - 2.5;
      if (distAt(x + dx * e, z + dz * e) < need || distAt(x - dx * e, z - dz * e) < need) continue;
      if (strict && (distPAt(x, z) < 2.7 || distPAt(x + dx * e, z + dz * e) < 2.7 || distPAt(x - dx * e, z - dz * e) < 2.7)) continue;
      let pen = 0, viol = 0;
      for (const s of [-hl + 1, 0, hl - 1]) { if (pathAt(x + dx * s, z + dz * s)) pen += 1.5; if (paveAt(x + dx * s, z + dz * s)) pen += 1; }
      for (let s = hl - 1; s <= hl + 34; s += 2.5) {
        const alt = Math.max(0, (s - hl + 1) * 0.43); if (alt > H) break;
        for (const w of [-2.6, 0, 2.6]) if (hgtAt(x + dx * s - dz * w, z + dz * s + dx * w) > Math.max(0.5, alt - 0.9)) viol++;
      }
      const s = base - viol * 1.3 - pen - (x * dx + z * dz) / (hyp(x, z) + 6) * 0.8;
      if (s > bs) { bs = s; best = { x, z, h, hl, viol }; }
    }
  }
  if (best) { const dx = Math.sin(best.h), dz = Math.cos(best.h), e = hl - 2.5; for (const s of [-e, 0, e]) ST.placed.push({ x: best.x + dx * s, z: best.z + dz * s, r: need }); }
  return best;
}
// 놀이 기구 밑의 풀·꽃·덤불(한꺼번에 그리는 것)은 치워요
function clearCover() {
  const m4 = new THREE.Matrix4(); let n = 0;
  scene.traverse(o => {
    if (!o.isInstancedMesh || o.userData.play || o.count > 5000) return;
    let ch = false;
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, m4); const e = m4.elements, x = e[12], z = e[14];
      if (x < -47 || x > 47 || z < -47 || z > 47) continue;
      for (const p of ST.placed) if (hyp(p.x - x, p.z - z) < p.r) { e[0] = e[1] = e[2] = e[4] = e[5] = e[6] = e[8] = e[9] = e[10] = 0; o.setMatrixAt(i, m4); ch = true; n++; break; }
    }
    if (ch) o.instanceMatrix.needsUpdate = true;
  });
  return n;
}

// ---------------- 놀이 기구 공통 ----------------
function thing(kind, emoji, x, z, o) {
  const th = Object.assign({ kind, emoji, x, z, ux: x, uz: z, useR: 2.4, fp: [], solidR: 0, hidden: false, own: true, objs: [], clearT: 9, label: () => null, use: null, tick: null, verb: '하기', sign: null, signY: 3, ph: Math.random() * 6, price: 0, passN: 0, passT: 0, busy: 0 }, o || {});
  ST.things.push(th); if (!ST.kinds.includes(kind)) ST.kinds.push(kind); return th;
}
function addSign(th, y, x, z) { th.signY = y; th.signAt = [x, z]; th.wantSign = 1; } // 간판 자리만 적어 두고, 값이 정해진 뒤 makeSigns 가 만들어요
const SIGNNAME = { goal: '공 차기', bench: '벤치에 앉기' };
function makeSigns() { // 멀리서도 보이는 간판: 그림 + 이름 + 💎값 (늘 나를 봐요 → 2.5D 에서도 읽혀요)
  for (const th of ST.things) {
    if (!th.wantSign || th.sign) continue;
    const name = th.name || (th.kind === 'build' ? (G.FX2.snow ? '눈사람 만들기' : '모래성 만들기') : NAME[th.kind]) || SIGNNAME[th.kind] || '', free = !th.price;
    const s = noRay(G.textSprite(th.emoji + ' ' + name + '\n' + (th.price ? '💎 ' + th.price : '무료'), 0.98, { fs: 46, bg: 'rgba(255,255,255,.96)', fg: '#1d3557', border: th.themed ? '#e76f51' : free ? '#2b8a3e' : '#1c7ed6', pad: 18 }));
    s.material.toneMapped = false; s.material.depthWrite = false; const a = th.signAt || [];
    s.position.set(a[0] == null ? th.x : a[0], th.signY, a[1] == null ? th.z : a[1]); scene.add(s); th.sign = s; th.objs.push(s); if (th.hidden) s.visible = false;
  }
}
// 놀이 자리 바닥 고리 (한꺼번에 한 번에 그려요)
const RING = { mesh: null, list: [] };
function makeRings() {
  const list = ST.things.filter(th => th.own && th.fp.length && !/^(plane|scooter|bike|bus|cat|goal)$/.test(th.kind)); if (!list.length) return;
  const geo = new THREE.RingGeometry(0.94, 1, 44); geo.rotateX(-PI / 2);
  const m = noRay(new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: G.FX2.snow ? 0x4dabf7 : 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }), list.length));
  m.userData.play = 1; m.userData.camBig = 0; m.frustumCulled = false; scene.add(m); RING.mesh = m; RING.list = list; ringUpdate();
}
function ringUpdate() {
  if (!RING.mesh) return; const D = new THREE.Object3D();
  RING.list.forEach((th, i) => { const r = th.hidden ? 0.0001 : th.fp[0].r + 0.3; D.position.set(th.fp[0].x, 0.05, th.fp[0].z); D.scale.set(r, 1, r); D.updateMatrix(); RING.mesh.setMatrixAt(i, D.matrix); });
  RING.mesh.instanceMatrix.needsUpdate = true;
}
function setHidden(th, on) { th.hidden = on; for (const o of th.objs) o.visible = !on; if (th.onHide) th.onHide(on); ringUpdate(); }
const missionNear = () => { const n = G.nearNPC; return !!(n && (n.talk || (n.g.userData.mark && n.g.userData.mark.visible))); };
const npcNear = (x, z, r) => { for (const id in G.NPC) { const g = G.NPC[id].g; if (g.visible && hyp(g.position.x - x, g.position.z - z) < r) return true; } return false; };
// 내 캐릭터를 자리에 앉혀요 (엔진이 매 프레임 서 있는 자세로 되돌리므로 그 뒤에 다시 맞춰요)
function pose(g, kind, a1) {
  const a = g.userData.anim; if (!a) return;
  if (kind === 'sit') { a.legL.rotation.x = a.legR.rotation.x = -1.4; a.armL.rotation.x = a.armR.rotation.x = -0.4; }
  else if (kind === 'swing') { a.legL.rotation.x = a.legR.rotation.x = -1.15 + (a1 || 0) * 0.7; a.armL.rotation.x = a.armR.rotation.x = -2.2; a.armL.rotation.z = -0.25; a.armR.rotation.z = 0.25; }
  else if (kind === 'scoot') { a.legL.rotation.x = 0; a.legR.rotation.x = 0.3; a.armL.rotation.x = a.armR.rotation.x = -1.0; a.armL.rotation.z = -0.1; a.armR.rotation.z = 0.1; }
  else if (kind === 'bike') { const s = Math.sin(a1 || 0) * 0.42; a.legL.rotation.x = -0.75 + s; a.legR.rotation.x = -0.75 - s; a.armL.rotation.x = a.armR.rotation.x = -1.15; a.armL.rotation.z = -0.16; a.armR.rotation.z = 0.16; }
}
function seatAvatar(node, y, kind, a1) {
  const g = CAM.me; if (!g) return;
  if (ST.seatMe && ST.seatMe !== g && ST.seatMe.parent && ST.seatMe.parent !== scene) ST.seatMe.parent.remove(ST.seatMe); // 꾸미기를 바꿔 캐릭터가 새로 생겼어요
  ST.seatMe = g;
  if (g.parent !== node) node.add(g);
  g.position.set(0, y, 0); g.rotation.set(0, 0, 0); pose(g, kind || 'sit', a1);
}
function unseat() {
  for (const g of [ST.seatMe, CAM.me]) if (g && g.parent && g.parent !== scene) { if (g === CAM.me) { scene.add(g); g.position.set(P.x, P.jy, P.z); g.rotation.set(0, CAM.face || 0, 0); } else g.parent.remove(g); }
  ST.seatMe = null;
}
function pushOut(x, z, r) {
  const dx = P.x - x, dz = P.z - z, d = hyp(dx, dz), m = r + P.r;
  if (d >= m) return false;
  if (d < 1e-3) P.x = x + m; else { P.x = x + dx / d * m; P.z = z + dz / d * m; }
  return true;
}

// ---------------- ✈️ 비행기 ----------------
const FLY = { H: 11, R: 30, v: 7.5, cruise: 26 };
function buildAirfield(sp) {
  const hl = sp.hl, dx = Math.sin(sp.h), dz = Math.cos(sp.h);
  const th = thing('plane', '✈️', sp.x, sp.z, { verb: '타기', useR: 3.8, solidR: 1.5 });
  const pad = grp(sp.x, sp.z, sp.h); th.g = pad;
  box(5, 0.05, hl * 2, 0x868e96, 0, 0.035, 0, pad);
  for (let z = -hl + 1.2; z < hl - 1.2; z += 2) box(0.22, 0.02, 1.1, 0xffffff, 0, 0.07, z + 0.55, pad);
  for (const x of [-2.3, 2.3]) box(0.14, 0.02, hl * 2 - 0.4, 0xffd43b, x, 0.07, 0, pad);
  for (const k of [-2, -1, 1, 2]) for (const e of [-1, 1]) box(0.3, 0.02, 0.8, 0xffffff, k * 0.78, 0.07, e * (hl - 0.7), pad);
  cyl(0.05, 0.07, 3, 0xced4da, 2.8, 1.5, -hl + 0.5, pad);
  const sock = dyn(pad, 2.8, 2.9, -hl + 0.5);
  for (let k = 0; k < 3; k++) { const c = cyl(0.2 - k * 0.04, 0.24 - k * 0.04, 0.34, k % 2 ? 0xffffff : 0xff922b, 0.2 + k * 0.34, 0, 0, sock, 10); c.rotation.z = PI / 2; }
  bake(pad);
  // 비행기 (앞이 +z)
  const pl = new THREE.Group(); pl.rotation.order = 'YXZ'; scene.add(pl);
  const C1 = pick([0xe03131, 0x1c7ed6, 0xf59f00, 0x2f9e44, 0x7048e8]), C2 = 0xffffff;
  const body = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 2.6, 6, 14), mat(C1)), 0, 1.05, -0.1, pl); body.rotation.x = PI / 2;
  const nose = cyl(0.3, 0.5, 0.5, C2, 0, 1.05, 1.8, pl); nose.rotation.x = PI / 2;
  box(6.6, 0.12, 1.3, C2, 0, 0.8, 0.25, pl);
  for (const sx of [-1, 1]) box(0.7, 0.13, 1.32, C1, sx * 2.95, 0.8, 0.25, pl);
  box(2.4, 0.1, 0.75, C2, 0, 1.2, -1.75, pl); box(0.1, 0.95, 0.8, C1, 0, 1.75, -1.8, pl);
  for (const sx of [-1, 1]) { const w = cyl(0.26, 0.26, 0.16, 0x212529, sx * 0.85, 0.26, 0.55, pl); w.rotation.z = PI / 2; box(0.08, 0.5, 0.08, 0x868e96, sx * 0.8, 0.55, 0.55, pl); }
  { const w = cyl(0.13, 0.13, 0.1, 0x212529, 0, 0.13, -1.7, pl); w.rotation.z = PI / 2; box(0.06, 0.4, 0.06, 0x868e96, 0, 0.36, -1.7, pl); }
  tor(0.5, 0.05, 0x343a40, 0, 1.05, 1.56, pl); // 엔진 덮개 테
  for (const sx of [-1, 1]) { ell(0.2, 0.7, 0.85, 1.5, C1, sx * 0.85, 0.33, 0.5, pl); const st = cyl(0.03, 0.03, 0.62, 0x868e96, sx * 0.72, 1.02, 0.3, pl, 6); st.rotation.z = sx * 0.95; ell(0.66, 0.55, 0.1, 1, C1, sx * 3.28, 0.8, 0.25, pl); cyl(0.3, 0.3, 0.02, C1, sx * 1.75, 0.87, 0.25, pl, 16); cyl(0.17, 0.17, 0.025, C2, sx * 1.75, 0.87, 0.25, pl, 14); }
  box(0.11, 0.2, 0.82, C2, 0, 1.98, -1.8, pl); ell(0.42, 1, 0.3, 0.9, C2, 0, 1.2, -1.75, pl); for (const z of [0.9, 0.3, -0.5]) box(0.02, 0.2, 0.3, C2, 0.545, 1.1, z, pl);
  const glass = box(0.85, 0.42, 0.05, new THREE.MeshStandardMaterial({ color: 0xa5d8ff, roughness: 0.15, transparent: true, opacity: 0.55 }), 0, 1.74, 0.5, pl); glass.rotation.x = -0.4;
  const prop = dyn(pl, 0, 1.05, 2.08);
  box(1.9, 0.16, 0.05, 0x343a40, 0, 0, 0, prop); box(0.16, 1.9, 0.05, 0x343a40, 0, 0, 0, prop); sph(0.15, 0xffd43b, 0, 0, 0.02, prop);
  const seat = dyn(pl, 0, 0.35, -0.2);
  bake(pl);
  const A = th.air = { cx: sp.x, cz: sp.z, h: sp.h, dx, dz, hl, viol: sp.viol, px: sp.x - dx * (hl - 2.4), pz: sp.z - dz * (hl - 2.4), roll: 2 * hl - 5 };
  const F = th.fl = { mode: 'park', x: A.px, z: A.pz, y: 0, h: sp.h, v: 0, vy: 0, pitch: 0, bank: 0, s: 0, t: 0, manT: 0, cy: 0, tx: 0, tz: 0, sg: 1, rp: null, gs: 0, hA: 0, h0: 0 };
  th.pl = pl; th.prop = prop; th.seat = seat; th.ux = A.px; th.uz = A.pz;
  const shadow = noRay(new THREE.Mesh(new THREE.CircleGeometry(2.4, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false })));
  shadow.rotation.x = -PI / 2; shadow.visible = false; shadow.userData.camBig = 0; scene.add(shadow); th.shadow = shadow; // 날 때 땅에 비치는 그림자 (높이를 알 수 있게)
  th.objs.push(pad, pl); th.fp = [-1, 0, 1].map(k => ({ x: sp.x + dx * k * (hl - 2), z: sp.z + dz * k * (hl - 2), r: 2.6 }));
  pl.position.set(F.x, 0, F.z); pl.rotation.set(0, F.h, 0);
  addSign(th, 3.7, A.px, A.pz);
  th.label = () => F.mode === 'park' ? '비행기 타기 ✈️' : null;
  th.use = () => board(th);
  th.solid = () => F.mode === 'park' || F.mode === 'turn' ? [F.x, F.z] : null;
  th.tick = (dt, t) => {
    sock.rotation.y = Math.sin(t * 1.3) * 0.35; sock.rotation.z = -0.25 + Math.sin(t * 2.1) * 0.08;
    th.sign.visible = !th.hidden && F.mode === 'park';
    if (F.mode === 'turn') { // 내린 뒤: 다음 손님을 위해 제자리에서 돌아서요
      F.t += dt; const k = smooth(F.t / 3.2); F.h = F.h0 + angDiff(A.h, F.h0) * k; prop.rotation.z += dt * 6 * (1 - k);
      if (k >= 1) { F.h = A.h; F.mode = 'park'; }
      pl.rotation.set(0, F.h, 0);
    }
  };
  return th;
}
function board(th) {
  const F = th.fl, A = th.air; if (F.mode !== 'park' || ST.ride && !roam(ST.ride)) return;
  if (ST.ride) leave(true);
  blink();
  Object.assign(F, { mode: 'roll', s: 0, v: 0, vy: 0, t: 0, manT: 0, cy: A.h + PI, tx: CAM.tx == null ? P.x : CAM.tx, tz: CAM.tx == null ? P.z : CAM.tz, pitch: 0, bank: 0 });
  ST.ride = { kind: 'plane', th }; P.jy = 0; P.vy = 0;
  G.beep([[196, .08], [262, .08], [330, .1], [392, .16]]);
  tell('plane', '✈️ 출발! 마을 위를 한 바퀴 돌아요<br><small>' + (G.isTouch ? '조이스틱을 좌우로' : '<b>A</b> · <b>D</b>') + ' 방향 바꾸기 · ' + eKey() + ' 바로 내리기</small>', 4600);
  fire('ride', { kind: 'plane' });
}
const appPt = (A) => { const e = A.hl - 1.5, tdx = A.cx + A.dx * e, tdz = A.cz + A.dz * e; return [tdx, tdz, tdx + A.dx * 26, tdz + A.dz * 26]; }; // 내려앉을 곳, 그 앞 26m (다가오는 곳)
function goodReturn(th) { // 크게 꺾지 않고 활주로 쪽으로 돌아설 수 있는 자리인가요
  const F = th.fl, A = th.air, q = appPt(A), ex = q[2] - F.x, ez = q[3] - F.z;
  return hyp(ex, ez) > 18 && -(ex * A.dx + ez * A.dz) > 10 && Math.abs(angDiff(F.h, Math.atan2(ex, ez))) < 1.75;
}
function startReturn(th) {
  const F = th.fl, A = th.air, q = appPt(A), tdx = q[0], tdz = q[1], ax = q[2], az = q[3];
  const k = clamp(hyp(ax - F.x, az - F.z) * 0.55, 14, 34);
  const p = [[F.x, F.z], [F.x + Math.sin(F.h) * k, F.z + Math.cos(F.h) * k], [ax + A.dx * k, az + A.dz * k], [ax, az]];
  const pts = [], n = 48; let len = 0;
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u, b0 = v * v * v, b1 = 3 * v * v * u, b2 = 3 * v * u * u, b3 = u * u * u;
    const x = p[0][0] * b0 + p[1][0] * b1 + p[2][0] * b2 + p[3][0] * b3, z = p[0][1] * b0 + p[1][1] * b1 + p[2][1] * b2 + p[3][1] * b3;
    if (i) len += hyp(x - pts[i - 1][0], z - pts[i - 1][1]);
    pts.push([x, z, len]);
  }
  F.rp = { pts, len, s: 0, y0: F.y }; F.hA = Math.min(FLY.H, 26 * 0.42); F.tdx = tdx; F.tdz = tdz; F.ax = ax; F.az = az; F.mode = 'return';
  G.toast('🛬 이제 활주로로 돌아가요', 2200);
}
function flyStep(th, dt) {
  const F = th.fl, A = th.air, h0 = F.h, y0 = F.y;
  let ix = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + (G.touch.mx || 0), iz = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - (G.touch.mz || 0);
  ix = clamp(ix, -1, 1); iz = clamp(iz, -1, 1);
  if (F.mode === 'roll') {
    F.v = Math.min(FLY.v, F.v + 4.2 * dt); F.x += A.dx * F.v * dt; F.z += A.dz * F.v * dt; F.s += F.v * dt;
    if (F.s >= A.roll) F.mode = 'climb';
  } else if (F.mode === 'climb' || F.mode === 'cruise') {
    F.v += (FLY.v + iz * 1.5 - F.v) * Math.min(1, dt * 1.5);
    let turn = 0;
    if (F.mode === 'climb') { if (F.y >= Math.min(FLY.H - 1, 5.5)) { F.mode = 'cruise'; F.t = 0; const d = hyp(F.x, F.z); F.sg = d < 3 || (-F.z * Math.sin(F.h) + F.x * Math.cos(F.h)) >= 0 ? 1 : -1; } }
    else {
      const d = hyp(F.x, F.z) || 1e-3;
      if (Math.abs(ix) > 0.2 && d < 56) { F.manT = 2.5; turn = -ix * 0.62; }
      else if (F.manT > 0 && d < 56) F.manT -= dt;
      else { // 저절로: 마을 둘레를 크게 돌아요
        const rx = F.x / d, rz = F.z / d, k = clamp((d - FLY.R) / 10, -1, 1), wx = -rz * F.sg - rx * k, wz = rx * F.sg - rz * k;
        turn = clamp(angDiff(Math.atan2(wx, wz), F.h) * 1.2, -0.46, 0.46); F.manT = 0;
      }
      F.t += dt; if (F.t > FLY.cruise && (F.t > FLY.cruise + 22 || goodReturn(th))) startReturn(th);
    }
    F.h += turn * dt;
    const vyT = clamp((FLY.H - F.y) * 0.9, -2, F.v * 0.5); F.vy += (vyT - F.vy) * Math.min(1, dt * 2.5); F.y += F.vy * dt;
    F.x += Math.sin(F.h) * F.v * dt; F.z += Math.cos(F.h) * F.v * dt;
  } else if (F.mode === 'return') {
    const rp = F.rp; F.v += (7 - F.v) * Math.min(1, dt * 1.5); rp.s = Math.min(rp.len, rp.s + F.v * dt);
    let i = 1; while (i < rp.pts.length - 1 && rp.pts[i][2] < rp.s) i++;
    const a = rp.pts[i - 1], b = rp.pts[i], f = b[2] > a[2] ? (rp.s - a[2]) / (b[2] - a[2]) : 1;
    F.x = a[0] + (b[0] - a[0]) * f; F.z = a[1] + (b[1] - a[1]) * f;
    F.h += clamp(angDiff(Math.atan2(b[0] - a[0], b[1] - a[1]), F.h) * 3, -1.2, 1.2) * dt;
    F.y = rp.y0 + (F.hA - rp.y0) * smooth(rp.s / rp.len);
    if (rp.s >= rp.len) { F.mode = 'glide'; F.gs = 0; }
  } else if (F.mode === 'glide') {
    F.v += (5.6 - F.v) * Math.min(1, dt * 0.8); F.gs += F.v * dt; const u = Math.min(1, F.gs / 26);
    F.x = F.ax - A.dx * F.gs; F.z = F.az - A.dz * F.gs; F.y = F.hA * Math.pow(1 - u, 1.5);
    F.h += clamp(angDiff(A.h + PI, F.h) * 3, -1.2, 1.2) * dt;
    if (u >= 1) { F.y = 0; F.mode = 'rollout'; G.beep([[150, .05], [110, .08]]); }
  } else if (F.mode === 'rollout') {
    const d = hyp(A.px - F.x, A.pz - F.z); F.v = clamp(d * 1.5, 0.7, F.v); F.h = A.h + PI;
    if (d < 0.12) { F.x = A.px; F.z = A.pz; F.v = 0; arrive(th); }
    else { const m = Math.min(d, F.v * dt); F.x += (A.px - F.x) / d * m; F.z += (A.pz - F.z) / d * m; }
  }
  const tr = angDiff(F.h, h0) / Math.max(dt, 1e-3), vy = (F.y - y0) / Math.max(dt, 1e-3);
  F.bank += (clamp(-tr * 0.55, -0.42, 0.42) - F.bank) * Math.min(1, dt * 2.5);
  F.pitch += (clamp(-Math.atan2(vy, Math.max(F.v, 2)) * 0.9, -0.4, 0.14) - F.pitch) * Math.min(1, dt * 3);
  th.pl.position.set(F.x, F.y, F.z); th.pl.rotation.set(F.pitch, F.h, F.bank);
  th.prop.rotation.z += dt * (9 + F.v * 3);
  const sh = th.shadow; sh.visible = F.y > 0.4; if (sh.visible) { sh.position.set(F.x, 0.06, F.z); sh.scale.setScalar(1 - Math.min(0.45, F.y * 0.035)); sh.material.opacity = 0.22 - Math.min(0.1, F.y * 0.008); }
}
function endRide(th) { // 비행이 끝났어요 (내려앉았거나, 중간에 내렸거나)
  const F = th.fl; ST.ride = null; unseat();
  if (CAM.me) CAM.me.visible = CAM.third;
  if (CAM.iso) { CAM.tx = F.tx; CAM.tz = F.tz; }
  F.pitch = 0; F.bank = 0; F.y = 0; F.v = 0; F.rp = null; th.shadow.visible = false;
  fire('leave', { kind: 'plane' });
}
function arrive(th) {
  const F = th.fl; blink(); endRide(th);
  F.mode = 'turn'; F.t = 0; F.h0 = F.h; th.pl.position.set(F.x, 0, F.z); th.pl.rotation.set(0, F.h, 0);
  G.beep('ok'); G.toast('🛬 도착! 즐거운 비행이었나요?', 2400);
}
function bail(th, silent) { // 바로 내리기: 비행기는 활주로로 돌아가 있어요
  const F = th.fl, A = th.air; if (!silent) blink();
  endRide(th);
  F.mode = 'park'; F.x = A.px; F.z = A.pz; F.h = A.h; th.pl.position.set(F.x, 0, F.z); th.pl.rotation.set(0, F.h, 0);
  if (CAM.iso) { CAM.tx = P.x; CAM.tz = P.z; }
  if (!silent) G.toast('🛬 비행기에서 내렸어요', 1800);
}
function planeCam(th, dt) {
  const F = th.fl, g = CAM.me;
  if (g) { if (CAM.third) { seatAvatar(th.seat, 0, 'sit'); g.visible = true; } else g.visible = false; }
  F.cy += angDiff(F.h + PI, F.cy) * Math.min(1, dt * (F.mode === 'rollout' ? 0 : 1.7)); // 내려앉은 뒤에는 화면을 돌리지 않아요
  if (CAM.iso) { // 2.5D: 엔진과 같은 각도·같은 카메라 높이로 비행기를 따라가요. 비행기가 뜬 만큼 옆으로만 옮겨서 늘 화면 가운데에 보여요
    const yaw = CAM.isoYaw, pit = -0.98, cp = Math.cos(pit), sp = Math.sin(pit), sy = Math.sin(yaw), cy = Math.cos(yaw), k = Math.min(1, dt * 5);
    F.tx += (F.x - F.tx) * k; F.tz += (F.z - F.tz) * k;
    const camY = 1 - sp * 30, dist = (camY - 1 - F.y) / -sp;
    camera.position.set(F.tx + sy * 2.2 + sy * cp * dist, camY, F.tz + cy * 2.2 + cy * cp * dist); camera.rotation.set(pit, yaw, 0);
  } else if (CAM.third) { // 3D: 비행기 뒤 위쪽에서 천천히 따라가요
    const k = smooth(F.y / 4), back = 7 + 3.5 * k, up = 3.2 + 1.3 * k;
    camera.position.set(F.x + Math.sin(F.cy) * back, F.y + up, F.z + Math.cos(F.cy) * back); camera.rotation.set(-0.2 - 0.05 * k, F.cy, 0);
  } else { // 내 눈: 조종석에서 앞을 봐요
    camera.position.set(F.x + Math.sin(F.h) * 0.3, F.y + 2.15, F.z + Math.cos(F.h) * 0.3); camera.rotation.set(-0.1 + F.pitch * 0.5, F.cy, 0);
  }
}

// ---------------- ⚽ 공·골대 ----------------
const BALL = { list: [], goals: [], spot: null, until: 0, was: false }; // until: 이때까지 공을 찰 수 있어요 (영어 관문을 맞히면 90초)
function ballTex(kind) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  if (kind === 'beach') { ['#ff6b6b', '#ffffff', '#ffd43b', '#ffffff', '#4dabf7', '#ffffff', '#51cf66', '#ffffff'].forEach((col, i) => { x.fillStyle = col; x.fillRect(i * 16, 0, 16, 64); }); }
  else { x.fillStyle = '#ffffff'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#212529'; for (const [u, v, r] of [[16, 32, 7], [48, 32, 7], [80, 32, 7], [112, 32, 7], [0, 12, 6], [32, 12, 6], [64, 12, 6], [96, 12, 6], [128, 12, 6], [0, 52, 6], [32, 52, 6], [64, 52, 6], [96, 52, 6], [128, 52, 6]]) { x.beginPath(); x.ellipse(u, v, r * 1.25, r, 0, 0, 7); x.fill(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function addBall(kind, hx, hz) {
  const beach = kind === 'beach', r = beach ? 0.42 : 0.3;
  const m = tag(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), new THREE.MeshStandardMaterial({ map: ballTex(kind), roughness: 0.55 })));
  m.position.set(hx, r, hz); scene.add(m);
  const blob = noRay(new THREE.Mesh(new THREE.CircleGeometry(r * 0.95, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false })));
  blob.rotation.x = -PI / 2; scene.add(blob);
  const b = { kind, m, blob, r, x: hx, y: r, z: hz, vx: 0, vy: 0, vz: 0, home: [hx, hz], rest: 0, kickT: 0, score: 0, pop: 0, e: beach ? 0.74 : 0.56, g: beach ? 10 : 15, drag: beach ? 0.85 : 0.3, fr: beach ? 1.6 : 2.3, pw: beach ? 0.8 : 1 };
  BALL.list.push(b);
  // 잠긴 공: 🔒 가 떠 있고, 닿아도 굴러가지 않아요. 가까이에서 E → 영어 문제를 맞히면 한동안 찰 수 있어요
  b.lock = noRay(G.textSprite('🔒', 0.42, { fs: 64, bg: 'rgba(255,255,255,.9)', pad: 10 })); b.lock.material.toneMapped = false; scene.add(b.lock);
  const th = thing('ball', '⚽', hx, hz, { own: false, verb: '차기', useR: 2.3 });
  th.label = () => BALL.until > ST.t ? null : '공 차기 ⚽ 🔒';
  th.use = () => { BALL.until = ST.t + 90; BALL.was = true; G.beep([[523, .06], [784, .1]]); tell('ball', '⚽ 공이 풀렸어요! 90초 동안 달려가서 뻥 차 봐요<br><small>골대에 넣으면 골!</small>', 3000); fire('use', { kind: 'ball' }); };
  th.tick = () => { th.x = th.ux = b.x; th.z = th.uz = b.z; };
  return b;
}
function ballHome(b) { b.x = b.home[0]; b.z = b.home[1]; b.y = b.r; b.vx = b.vy = b.vz = 0; b.rest = 0; b.score = 0; b.pop = 0.001; }
const bax = new THREE.Vector3();
function ballBounce(b, nx, nz, pen, e) { b.x += nx * pen; b.z += nz * pen; const vn = b.vx * nx + b.vz * nz; if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vz -= (1 + e) * vn * nz; } }
function ballStep(b, dt, canKick) {
  const px = b.x, pz = b.z;
  if (b.y > b.r + 1e-3 || b.vy > 0) { b.vy -= b.g * dt; b.y += b.vy * dt; if (b.y <= b.r) { b.y = b.r; b.vy = b.vy < -1.4 ? -b.vy * b.e : 0; } }
  const sp0 = hyp(b.vx, b.vz);
  if (sp0 > 0) { const ground = b.y <= b.r + 0.02, dec = (ground ? b.fr : 0) * dt + sp0 * b.drag * dt, k = Math.max(0, sp0 - dec) / sp0; b.vx *= k; b.vz *= k; }
  b.x += b.vx * dt; b.z += b.vz * dt;
  // 벽·건물
  if (b.y < 3.6) for (const c of G.colliders) {
    if (b.x + b.r <= c.x1 || b.x - b.r >= c.x2 || b.z + b.r <= c.z1 || b.z - b.r >= c.z2) continue;
    const nx = clamp(b.x, c.x1, c.x2), nz = clamp(b.z, c.z1, c.z2), dx = b.x - nx, dz = b.z - nz, d = hyp(dx, dz);
    if (d > 1e-4) { if (d < b.r) ballBounce(b, dx / d, dz / d, b.r - d, 0.62); }
    else { const o = [[b.x - c.x1, -1, 0], [c.x2 - b.x, 1, 0], [b.z - c.z1, 0, -1], [c.z2 - b.z, 0, 1]].sort((p, q) => p[0] - q[0])[0]; ballBounce(b, o[1], o[2], o[0] + b.r, 0.62); }
  }
  if (b.x > 45.2) ballBounce(b, -1, 0, b.x - 45.2, 0.62); else if (b.x < -45.2) ballBounce(b, 1, 0, -45.2 - b.x, 0.62);
  if (b.z > 45.2) ballBounce(b, 0, -1, b.z - 45.2, 0.62); else if (b.z < -45.2) ballBounce(b, 0, 1, -45.2 - b.z, 0.62);
  // 사람·놀이 기구
  if (b.y < 1.8) for (const id in G.NPC) { const g = G.NPC[id].g; if (!g.visible) continue; const dx = b.x - g.position.x, dz = b.z - g.position.z, d = hyp(dx, dz), m = b.r + 0.42; if (d < m && d > 1e-4) ballBounce(b, dx / d, dz / d, m - d, 0.5); }
  for (const th of ST.things) {
    if (th.hidden) continue;
    if (th.kind === 'tramp') { if (b.y < 0.5 + b.r && b.vy <= 0 && hyp(b.x - th.x, b.z - th.z) < 1.4) { b.y = 0.5 + b.r; b.vy = 6.5; th.dip = 1; } continue; }
    const s = th.solid ? th.solid() : th.solidR ? [th.x, th.z] : null; if (!s || b.y > 2.2) continue;
    const dx = b.x - s[0], dz = b.z - s[1], d = hyp(dx, dz), m = b.r + th.solidR; if (d < m && d > 1e-4) ballBounce(b, dx / d, dz / d, m - d, 0.6);
  }
  // 발로 차기
  if (b.kickT > 0) b.kickT -= dt;
  if (canKick && b.score <= 0 && b.y < 1.1 && P.jy < 0.9) {
    const dx = b.x - P.x, dz = b.z - P.z, d = hyp(dx, dz), m = b.r + 0.46;
    if (d < m) {
      const sp = hyp(ST.pvx, ST.pvz); let nx = d > 1e-3 ? dx / d : -Math.sin(P.yaw), nz = d > 1e-3 ? dz / d : -Math.cos(P.yaw);
      if (sp > 0.8 && b.kickT <= 0) {
        const kx = nx * 0.55 + ST.pvx / sp * 0.45, kz = nz * 0.55 + ST.pvz / sp * 0.45, kl = hyp(kx, kz) || 1, pw = (3 + sp * 1.35) * b.pw;
        b.vx = kx / kl * pw; b.vz = kz / kl * pw; b.vy = 1.4 + pw * 0.2; b.kickT = 0.25; b.rest = 0;
        G.beep([[190, .04], [120, .06]]); fire('kick', { i: BALL.list.indexOf(b), x: b.x, z: b.z, vx: b.vx, vz: b.vz });
      } else ballBounce(b, nx, nz, m - d, 0.3);
      b.x = P.x + nx * m; b.z = P.z + nz * m;
    }
  }
  // 골대
  for (const gl of BALL.goals) {
    if (gl.th && gl.th.hidden) continue;
    const fx = Math.sin(gl.rot), fz = Math.cos(gl.rot), ux = fz, uz = -fx;
    const lz = (b.x - gl.x) * fx + (b.z - gl.z) * fz, lx = (b.x - gl.x) * ux + (b.z - gl.z) * uz;
    if (Math.abs(lx) > 3 || Math.abs(lz) > 3) continue;
    const pl = (px - gl.x) * fx + (pz - gl.z) * fz, plx = (px - gl.x) * ux + (pz - gl.z) * uz;
    if (b.score <= 0 && pl > 0 && lz <= 0 && Math.abs(lx) < 1.42 && b.y < 2.0) { goalIn(gl, b); continue; }
    if (lz < 0 && lz > -0.95 && Math.abs(lx) < 1.5 && b.y < 2.0) { // 그물 안
      if (b.score > 0) { b.vx *= Math.max(0, 1 - 6 * dt); b.vz *= Math.max(0, 1 - 6 * dt); }
      else if (Math.abs(plx) >= 1.5) { const s = plx > 0 ? 1 : -1; ballBounce(b, ux * s, uz * s, 1.5 - Math.abs(lx) + 0.01, 0.3); }
      else if (pl <= -0.95) ballBounce(b, -fx, -fz, lz + 0.96, 0.3);
    } else if (b.score > 0 && lz <= -0.95 && pl > -0.95 && Math.abs(lx) < 1.6) ballBounce(b, fx, fz, -0.95 - lz + 0.01, 0.15);
  }
  // 멈춰 있으면 쉬고, 너무 멀리 가거나 갈 수 없는 곳에 들어가면 제자리로 돌아와요
  const sp = hyp(b.vx, b.vz);
  if (sp < 0.06 && b.y <= b.r + 0.01) { b.vx = b.vz = 0; b.rest += dt; } else b.rest = 0;
  if (b.score > 0) { b.score -= dt; if (b.score <= 0) ballHome(b); }
  else if (!isFinite(b.x + b.y + b.z) || (b.rest > 2.5 && !reachAt(b.x, b.z)) || (b.rest > 25 && hyp(b.x - b.home[0], b.z - b.home[1]) > 16)) ballHome(b);
  // 그리기
  if (b.pop > 0) { b.pop = Math.min(1, b.pop + dt * 4); b.m.scale.setScalar(b.pop); if (b.pop >= 1) b.pop = 0; }
  const mx = b.x - px, mz = b.z - pz, ml = hyp(mx, mz);
  if (ml > 1e-4 && ml < 2) { bax.set(mz / ml, 0, -mx / ml); b.m.rotateOnWorldAxis(bax, ml / b.r); }
  b.m.position.set(b.x, b.y, b.z);
  b.blob.visible = !G.GFX.high; if (b.blob.visible) { b.blob.position.set(b.x, 0.03, b.z); b.blob.material.opacity = 0.22 * clamp(1 - (b.y - b.r) / 4, 0.2, 1); }
}
function goalIn(gl, b) {
  b.score = 2.6; b.vx *= 0.25; b.vz *= 0.25; b.vy = Math.min(b.vy, 1);
  DAY.goals++; saveDay();
  G.confetti(40); G.beep('combo');
  emo('🎉', gl.x, 2.6, gl.z, 1.1);
  G.toast('⚽ 골! 🎉' + (DAY.goals > 1 ? '<br><small>오늘 ' + DAY.goals + '번째 골이에요</small>' : ''), 2400);
  fire('goal', { n: DAY.goals, kind: b.kind });
}
function buildGoal(x, z, rot) {
  const g = grp(x, z, rot), C = G.FX2.snow ? 0xe03131 : 0xffffff; // 눈 위에서는 빨간 골대
  for (const dx of [-1.5, 1.5]) { cyl(0.07, 0.07, 2, C, dx, 1, 0, g, 10); const s = cyl(0.045, 0.045, 2.2, C, dx, 0.98, -0.47, g, 8); s.rotation.x = 0.44; }
  const bar = cyl(0.07, 0.07, 3.14, C, 0, 2, 0, g, 10); bar.rotation.z = PI / 2;
  const back = cyl(0.045, 0.045, 3.1, C, 0, 0.05, -0.95, g, 8); back.rotation.z = PI / 2;
  bake(g);
  const net = noRay(new THREE.Mesh(new THREE.PlaneGeometry(3, 2.2, 8, 6), new THREE.MeshBasicMaterial({ color: G.FX2.snow ? 0x495057 : 0xffffff, wireframe: true, transparent: true, opacity: 0.7 })));
  net.position.set(0, 0.98, -0.47); net.rotation.x = 0.44; net.userData.camBig = 0; g.add(net);
  return g;
}
function buildBalls() {
  const eng = (G.FX2.goals || []).slice(0, 2), homes = [];
  if (eng.length) { // 이 단원에 이미 골대가 있어요: 그 앞에 공을 놓아요
    for (const e of eng) {
      const fx = Math.sin(e.rot), fz = Math.cos(e.rot);
      BALL.goals.push({ x: e.x, z: e.z, rot: e.rot });
      try { const d = e.g.children[e.g.children.length - 1]; if (d && d.geometry && d.geometry.type === 'SphereGeometry') d.visible = false; } catch (er) {}
      for (const s of [3.2, 2.2, 4.4, 1.4]) { const x = e.x + fx * s, z = e.z + fz * s; if (reachAt(x, z) && !GR.wall[gcell(z) * GR.N + gcell(x)]) { homes.push([x, z]); ST.placed.push({ x, z, r: 1 }); break; } }
    }
  } else {
    let sp = spot(5.2, { lawn: 1 }) || spot(3.8, { lawn: 1 }) || spot(2.8);
    if (!sp) return;
    const p = ST.placed[ST.placed.length - 1], R = p.r;
    let fx = -sp.x, fz = -(sp.z - 4); const fl = hyp(fx, fz) || 1; fx /= fl; fz /= fl; // 골대는 바깥쪽에 서서 가운데를 봐요
    const gx = sp.x - fx * (R - 1.4), gz = sp.z - fz * (R - 1.4), rot = Math.atan2(fx, fz);
    const th = thing('goal', '⚽', gx, gz, { fp: [{ x: gx - fx * 0.4, z: gz - fz * 0.4, r: 1.9 }] });
    ST.kinds.splice(ST.kinds.indexOf('goal'), 1); // 종류는 'ball' 하나로 세요
    th.g = buildGoal(gx, gz, rot); th.objs.push(th.g); addSign(th, 3.0);
    BALL.goals.push({ x: gx, z: gz, rot, th });
    const hx = gx + fx * Math.min(3.2, R), hz = gz + fz * Math.min(3.2, R);
    homes.push([hx - fz * 0.6, hz + fx * 0.6], [hx + fz * 0.9, hz - fx * 0.9]);
    const ring = noRay(new THREE.Mesh(new THREE.RingGeometry(1.25, 1.4, 36), new THREE.MeshBasicMaterial({ color: G.FX2.snow ? 0x4dabf7 : 0xffffff, transparent: true, opacity: 0.7, depthWrite: false })));
    ring.rotation.x = -PI / 2; ring.position.set(hx, 0.04, hz); ring.userData.camBig = 0; scene.add(ring); th.objs.push(ring);
  }
  homes.slice(0, 2).forEach((h, i) => addBall(i ? 'beach' : 'soccer', h[0], h[1]));
  if (homes.length === 1 && eng.length) { const h = homes[0]; if (reachAt(h[0] + 1.2, h[1] + 0.8)) addBall('beach', h[0] + 1.2, h[1] + 0.8); }
}

// ---------------- ⛲ 분수 ----------------
const WISH = ['오늘도 좋은 일이 생길 거예요!', '영어가 쑥쑥 늘 거예요!', '친구들과 더 친해질 거예요!', '내일은 더 신나는 하루가 될 거예요!', '하고 싶은 일이 꼭 이루어질 거예요!', '웃을 일이 많이 생길 거예요!'];
function rainbowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), cols = ['#b197fc', '#4dabf7', '#51cf66', '#ffd43b', '#ff922b', '#ff6b6b'];
  cols.forEach((col, i) => { x.strokeStyle = col; x.lineWidth = 5.8; x.beginPath(); x.arc(128, 128, 101 + i * 5, 0, 7); x.stroke(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildFountain(sp, eng) {
  // eng: 엔진이 만든 분수(이미 있는 것) { x, y, z, r }
  const x = eng ? eng.x : sp.x, z = eng ? eng.z : sp.z, top = eng ? eng.y : 2.35, wr = eng ? eng.r + 0.45 : 2.15, wy = eng ? 0.84 : 0.74, out = eng ? 3.2 : 2.65;
  const th = thing('fountain', '⛲', x, z, { own: !eng, verb: '던지기', useR: out + 2.5, solidR: eng ? 0 : out, fp: eng ? [] : [{ x, z, r: out + 0.2 }] });
  if (!eng) {
    const g = grp(x, z, 0); th.g = g; th.objs.push(g);
    cyl(2.5, 2.65, 0.7, 0xb0bec5, 0, 0.35, 0, g, 24); cyl(0.36, 0.46, 1.5, 0xcfd8dc, 0, 1.2, 0, g, 12); cyl(0.95, 0.4, 0.3, 0xcfd8dc, 0, 2.0, 0, g, 16); sph(0.34, 0x90caf9, 0, 2.3, 0, g);
    flatZ(tor(2.55, 0.1, 0xcfd8dc, 0, 0.7, 0, g)); flatZ(tor(0.95, 0.05, 0xb0bec5, 0, 2.15, 0, g)); flatZ(tor(0.46, 0.06, 0xb0bec5, 0, 0.78, 0, g)); for (let i = 0; i < 8; i++) { const a = i * PI / 4; sph(i % 2 ? 0.12 : 0.17, i % 2 ? 0xcfd8dc : 0x90caf9, Math.cos(a) * 2.55, 0.8, Math.sin(a) * 2.55, g); } // 테두리 · 구슬 장식
    bake(g);
    const water = cyl(2.15, 2.15, 0.74, new THREE.MeshStandardMaterial({ color: 0x64b5f6, roughness: 0.25 }), 0, 0.37, 0, g, 24); water.userData.keep = 1;
    addSign(th, 3.9);
  }
  const n = G.GFX.high ? 40 : 20;
  const drops = noRay(new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 5), new THREE.MeshStandardMaterial({ color: 0xd0ebff, emissive: 0x74c0fc, emissiveIntensity: 0.5, roughness: 0.2, transparent: true, opacity: 0.85 }), n));
  drops.frustumCulled = false; drops.userData.play = 1; drops.count = 0; scene.add(drops); th.objs.push(drops);
  const rb = noRay(new THREE.Mesh(new THREE.RingGeometry(wr + 0.3, wr + 1.05, 40, 1, 0, PI), new THREE.MeshBasicMaterial({ map: rainbowTex(), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })));
  { const uv = rb.geometry.attributes.uv, po = rb.geometry.attributes.position; for (let i = 0; i < uv.count; i++) { const r = hyp(po.getX(i), po.getY(i)) || 1, k = (97 + (r - (wr + 0.3)) / 0.75 * 33) / 256 / r; uv.setXY(i, 0.5 + po.getX(i) * k, 0.5 + po.getY(i) * k); } } // 띠 그림(반지름 98~129)이 고리 너비에 딱 맞게
  rb.position.set(x, wy, z); rb.visible = false; rb.userData.camBig = 0; scene.add(rb);
  const rip = noRay(new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })));
  rip.rotation.x = -PI / 2; rip.visible = false; rip.userData.camBig = 0; scene.add(rip);
  const coin = tag(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.035, 12), new THREE.MeshStandardMaterial({ color: 0xffd43b, emissive: 0xf59f00, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.5 })));
  coin.visible = false; coin.userData.ns = 1; scene.add(coin);
  const D = new THREE.Object3D();
  const S = th.ft = { k: 0.6, boost: 0, rbT: 0, ripT: 0, coinT: 0, c0: null, c1: null, wishN: Math.floor(Math.random() * WISH.length) };
  th.label = () => S.coinT > 0 ? null : '동전 던지고 소원 빌기 🪙';
  th.use = () => {
    if (S.coinT > 0) return;
    const a = Math.random() * 7, r = Math.random() * wr * 0.55;
    S.c0 = [P.x, 1.3, P.z]; S.c1 = [x + Math.cos(a) * r, wy, z + Math.sin(a) * r]; S.coinT = 0.001; coin.visible = true;
    G.beep([[988, .04], [1318, .06]]); fire('use', { kind: 'fountain' });
  };
  th.onHide = (on) => { if (on) { rb.visible = false; rip.visible = false; coin.visible = false; S.coinT = 0; } };
  th.tick = (dt, t) => {
    const near = hyp(P.x - x, P.z - z) < out + 6;
    if (S.boost > 0) S.boost -= dt;
    S.k += ((S.boost > 0 ? 1.9 : near ? 1.0 : 0.6) - S.k) * Math.min(1, dt * 1.6);
    // 물줄기: 이미 있는 분수에는 '세진 만큼'만 더해요
    const show = eng ? (S.k > 1.05 ? n : 0) : (S.k > 0.8 || G.GFX.high ? n : n >> 1), kk = S.k;
    for (let i = 0; i < show; i++) {
      const u = (t * 0.7 + i * 0.377) % 1, a = i * 2.4;
      if (i % 5 === 0) D.position.set(x + Math.cos(a) * 0.08, top + (0.5 + 2.6 * (kk - 0.6)) * 4 * u * (1 - u), z + Math.sin(a) * 0.08);
      else { const rr = wr * 0.85 * u * (0.55 + 0.35 * Math.min(kk, 1.3)); D.position.set(x + Math.cos(a) * rr, top + (0.9 + 1.5 * (kk - 0.6)) * 4 * u * (1 - u) - u * (top - wy), z + Math.sin(a) * rr); }
      D.updateMatrix(); drops.setMatrixAt(i, D.matrix);
    }
    drops.count = show; drops.instanceMatrix.needsUpdate = true;
    // 동전
    if (S.coinT > 0) {
      S.coinT += dt; const u = Math.min(1, S.coinT / 0.75), a = S.c0, b = S.c1;
      coin.position.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + 1.7 * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u); coin.rotation.x = u * 14; coin.rotation.z = u * 5;
      if (u >= 1) {
        S.coinT = 0; coin.visible = false; S.boost = 7; S.rbT = 0.001; S.ripT = 0.001;
        rip.position.set(b[0], wy + 0.03, b[2]); rip.visible = true; rb.visible = true; rb.rotation.y = Math.atan2(P.x - x, P.z - z);
        G.beep([[1400, .03], [700, .06], [500, .1]]); emo('✨', b[0], wy + 0.6, b[2], 0.7);
        tell('fountain', '🪙 퐁당! 소원을 빌었어요 ✨<br><small>' + WISH[S.wishN++ % WISH.length] + '</small>', 3200);
      }
    }
    if (S.ripT > 0) { S.ripT += dt; const u = S.ripT / 0.9; rip.scale.setScalar(0.25 + u * 1.3); rip.material.opacity = 0.8 * (1 - u); if (u >= 1) { S.ripT = 0; rip.visible = false; } }
    if (S.rbT > 0) { S.rbT += dt; const u = S.rbT / 7.5; rb.material.opacity = 0.92 * Math.min(1, u * 6, (1 - u) * 4); if (u >= 1) { S.rbT = 0; rb.visible = false; } }
  };
  return th;
}

// ---------------- 🪑 벤치 ----------------
function buildBench(bg, x, z, rot, own) {
  const fx = Math.sin(rot), fz = Math.cos(rot);
  const th = thing('bench', '🪑', x, z, { own, verb: '앉기', useR: 1.9, fp: own ? [{ x, z, r: 1.3 }] : [] });
  th.ux = x + fx * 0.5; th.uz = z + fz * 0.5; th.g = bg; if (own) th.objs.push(bg);
  th.f = [fx, fz]; th.node = dyn(bg, 0, 0, 0.05);
  th.label = () => npcNear(x, z, 1.3) ? null : '벤치에 앉기 🪑';
  th.use = () => {
    if (ST.ride) leave(true);
    const lx = (P.x - x) * fz - (P.z - z) * fx; th.node.position.x = clamp(lx, -0.6, 0.6) < 0 ? -0.55 : 0.55; // 내가 온 쪽 자리에 앉아요
    ST.ride = { kind: 'bench', th }; P.x = x + fx * 0.6; P.z = z + fz * 0.6; P.jy = 0; P.vy = 0;
    tell('bench', '🪑 잠깐 쉬어 가요<br><small>' + eKey() + ' 를 누르면 일어나요</small>', 2600); fire('ride', { kind: 'bench' });
  };
  th.tick = (dt, t) => { if (ST.ride && ST.ride.th === th && (th.zz = (th.zz || 0) + dt) > 3.2) { th.zz = 0; emo('🎵', x + th.node.position.x * fz, 2.3, z - th.node.position.x * fx, 0.5); } };
  return th;
}
function ownBench(x, z, rot) {
  const g = grp(x, z, rot);
  box(2.4, 0.15, 0.6, 0xa1887f, 0, 0.55, 0, g); box(2.4, 0.5, 0.12, 0xa1887f, 0, 0.9, -0.28, g); box(0.15, 0.55, 0.5, 0x6d4c41, -1, 0.27, 0, g); box(0.15, 0.55, 0.5, 0x6d4c41, 1, 0.27, 0, g);
  bake(g); return g;
}
function findBenches() { // 단원 세계에 이미 있는 벤치 (모양으로 찾아요)
  const out = [];
  for (const o of scene.children) {
    if (!o.isGroup || o.children.length !== 4 || !o.visible) continue;
    const p = o.children[0].geometry && o.children[0].geometry.parameters;
    if (p && p.width === 2.4 && p.height === 0.15 && p.depth === 0.6 && Math.abs(o.scale.x - 1) < 0.01) out.push(o);
  }
  return out;
}

// ---------------- 그네 ----------------
function buildSwing(sp, rot) {
  const th = thing('swing', '🎠', sp.x, sp.z, { verb: '타기', useR: 2.1, fp: [{ x: sp.x, z: sp.z, r: 2.0 }] });
  const g = grp(sp.x, sp.z, rot); th.g = g; th.objs.push(g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = cyl(0.07, 0.08, 3.25, 0xe8590c, sx * 1.05, 1.55, sz * 0.62, g, 8); p.rotation.x = sz * -0.4; }
  const bar = cyl(0.07, 0.07, 2.3, 0xe8590c, 0, 3.05, 0, g, 8); bar.rotation.z = PI / 2;
  for (const sx of [-1, 1]) { sph(0.12, 0xffd43b, sx * 1.12, 3.05, 0, g); for (const sz of [-1, 1]) cyl(0.13, 0.15, 0.08, 0xffd43b, sx * 1.05, 0.04, sz * 1.26, g, 10); } // 이음매 · 발 받침
  bake(g);
  const piv = dyn(g, 0, 3.05, 0);
  for (const sx of [-1, 1]) cyl(0.02, 0.02, 2.3, 0x868e96, sx * 0.36, -1.15, 0, piv, 6);
  box(0.84, 0.07, 0.36, 0x1c7ed6, 0, -2.32, 0, piv);
  th.piv = piv; th.amp = 0.04; th.f = [Math.sin(rot), Math.cos(rot)];
  addSign(th, 4.0);
  th.label = () => '그네 타기';
  th.use = () => {
    if (ST.ride) leave(true);
    ST.ride = { kind: 'swing', th }; P.x = sp.x; P.z = sp.z; P.jy = 0; P.vy = 0;
    tell('swing', '🎠 그네를 타요. 흔들흔들~<br><small>' + eKey() + ' 를 누르면 내려요</small>', 2600); fire('ride', { kind: 'swing' });
  };
  th.tick = (dt, t) => {
    const on = ST.ride && ST.ride.th === th;
    th.amp += ((on ? 0.6 : 0.04) - th.amp) * Math.min(1, dt * (on ? 0.5 : 0.8));
    th.ang = Math.sin(t * 2.25 + th.ph) * th.amp; piv.rotation.x = th.ang;
  };
  return th;
}

// ---------------- 트램펄린 ----------------
function buildTramp(sp) {
  const th = thing('tramp', '🤸', sp.x, sp.z, { fp: [{ x: sp.x, z: sp.z, r: 1.7 }], verb: '뛰기', useR: 2.9, solidR: 1.5 });
  const g = grp(sp.x, sp.z, 0); th.g = g; th.objs.push(g);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; cyl(0.05, 0.05, 0.5, 0xffd43b, Math.cos(a) * 1.45, 0.25, Math.sin(a) * 1.45, g, 6); }
  const ring = add(new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 8, 28), mat(0x1c7ed6)), 0, 0.5, 0, g); ring.rotation.x = PI / 2;
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; ell(0.36, 1, 0.26, 0.5, i % 2 ? 0xffd43b : 0xff6b6b, Math.cos(a) * 1.5, 0.57, Math.sin(a) * 1.5, g).rotation.y = -a + PI / 2; } // 알록달록 안전 덮개
  for (const sx of [-1, 1]) cyl(0.03, 0.03, 0.62, 0xced4da, sx * 0.25, 0.28, 1.7, g, 6).rotation.x = 0.35; for (const y of [0.18, 0.4]) flatX(cyl(0.025, 0.025, 0.5, 0xced4da, 0, y, 1.74 - y * 0.35, g, 6)); // 사다리
  bake(g);
  const mt = add(new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.04, 24), new THREE.MeshStandardMaterial({ color: 0x343a40, roughness: 0.6 })), 0, 0.48, 0, g);
  th.dip = 0; th.n = 0; th.on = false;
  addSign(th, 2.6);
  th.solid = () => hasPass(th) ? null : [sp.x, sp.z]; // 값을 내기 전에는 올라설 수 없어요
  th.label = () => hasPass(th) ? null : '트램펄린 뛰기 🤸';
  th.use = () => { th.was = true; G.beep([[392, .06], [587, .1]]); tell('tramp', '🤸 60초 동안 마음껏 뛰어요! 올라서면 통통<br><small>' + (G.isTouch ? '점프 버튼' : '<b>Space</b>') + ' 를 누르면 더 높이!</small>', 3200); };
  th.tick = (dt) => {
    if (th.was && !hasPass(th)) { th.was = false; G.toast('🤸 트램펄린 시간이 끝났어요', 1800); }
    const on = hasPass(th) && (!ST.ride || roam(ST.ride)) ? hyp(P.x - sp.x, P.z - sp.z) < 1.35 && G.started && !G.dlgOpen : false;
    if (on && P.jy <= 0.5 && P.vy <= 0) {
      const boost = keys.Space || ST.boostT > 0;
      P.jy = 0.5; P.vy = Math.min(9.4, 6.4 + Math.min(th.n, 4) * 0.5 + (boost ? 1.2 : 0)); th.n++; th.dip = 1;
      G.beep([[196 + Math.min(th.n, 6) * 22, .05], [330 + Math.min(th.n, 6) * 30, .09]]);
    } else if (!on && P.jy <= 0) th.n = 0;
    if (th.dip > 0) th.dip = Math.max(0, th.dip - dt * 4);
    mt.position.y = 0.48 - th.dip * 0.16; mt.scale.y = 1;
  };
  return th;
}

// ---------------- 🛴 킥보드 ----------------
function buildScooter(sp, rot) {
  const th = thing('scooter', '🛴', sp.x, sp.z, { verb: '타기', useR: 1.9, fp: [{ x: sp.x, z: sp.z, r: 1.0 }] });
  const g = new THREE.Group(); scene.add(g); th.g = g; th.objs.push(g);
  const C = pick([0x12b886, 0xf06595, 0x4c6ef5, 0xfd7e14]);
  box(0.2, 0.05, 0.9, C, 0, 0.15, 0, g);
  for (const z of [-0.42, 0.45]) { const w = cyl(0.12, 0.12, 0.07, 0x212529, 0, 0.12, z, g, 12); w.rotation.z = PI / 2; }
  const stem = cyl(0.03, 0.03, 0.98, 0xced4da, 0, 0.62, 0.4, g, 6); stem.rotation.x = -0.12;
  box(0.52, 0.05, 0.05, 0x343a40, 0, 1.1, 0.34, g);
  for (const s of [-1, 1]) flatX(cap(0.032, 0.09, 0xe03131, s * 0.25, 1.1, 0.34, g)); ell(0.14, 0.5, 0.3, 1, C, 0, 0.25, -0.42, g); ell(0.13, 0.9, 0.25, 2.6, 0x212529, 0, 0.185, 0, g); sph(0.045, 0xffd43b, 0, 1.0, 0.39, g); // 손잡이 · 흙받이 · 발판 고무 · 전조등
  bake(g);
  th.home = [sp.x, sp.z, rot]; th.away = 0;
  const park = (x, z, r) => { th.x = th.ux = x; th.z = th.uz = z; th.fp[0].x = x; th.fp[0].z = z; g.position.set(x, 0, z); g.rotation.set(0, r, 0.12); if (th.sign) th.sign.position.set(x, th.signY, z); };
  park(sp.x, sp.z, rot);
  addSign(th, 2.3);
  th.park = park;
  th.label = () => ST.ride && ST.ride.th === th ? null : '킥보드 타기 🛴';
  th.use = () => {
    if (ST.ride) leave(true);
    ST.ride = { kind: 'scooter', th }; th.away = 0; g.rotation.z = 0;
    G.beep([[523, .05], [784, .08]]);
    tell('scooter', '🛴 씽씽! 걸을 때보다 빨라요<br><small>' + eKey() + ' 를 누르면 내려요</small>', 2800); fire('ride', { kind: 'scooter' });
  };
  th.tick = (dt) => {
    const on = ST.ride && ST.ride.th === th;
    th.sign.visible = !th.hidden && !on;
    if (on) { g.visible = CAM.third; g.position.set(P.x, P.jy, P.z); g.rotation.set(0, CAM.me && CAM.third ? CAM.face : P.yaw + PI, 0); return; }
    if (hyp(th.x - th.home[0], th.z - th.home[1]) > 1) { th.away += dt; if (th.away > 75) { park(th.home[0], th.home[1], th.home[2]); th.away = 0; } } // 오래 버려두면 제자리로
  };
  return th;
}

// ---------------- 🎈 풍선 ----------------
function buildBalloons(sp) {
  const th = thing('balloon', '🎈', sp.x, sp.z, { verb: '터뜨리기', useR: 2.0, fp: [{ x: sp.x, z: sp.z, r: 1.0 }], solidR: 0.3 });
  const g = grp(sp.x, sp.z, 0); th.g = g; th.objs.push(g);
  box(0.36, 0.3, 0.36, 0x868e96, 0, 0.15, 0, g);
  const cols = [0xff6b6b, 0xffd43b, 0x4dabf7, 0x51cf66, 0xda77f2], bs = [];
  const geo = new THREE.SphereGeometry(0.32, 12, 10), sgeo = new THREE.BoxGeometry(0.015, 1, 0.015); sgeo.translate(0, -0.5, 0);
  cols.forEach((c, i) => {
    const a = i * 1.257, hx = Math.cos(a) * 0.45, hy = 2.1 + (i % 3) * 0.32, hz = Math.sin(a) * 0.45;
    const b = dyn(g, hx, hy, hz), m = tag(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.35 }))); m.scale.y = 1.2; b.add(m);
    const s = tag(new THREE.Mesh(sgeo, mat(0xdee2e6))); s.position.y = -0.36; s.scale.y = hy - 0.6; s.userData.ns = 1; b.add(s);
    bs.push({ b, c, home: [hx, hy, hz], st: 'on', t: 0 });
  });
  th.re = 0;
  const left = () => bs.filter(k => k.st === 'on').length;
  th.label = () => left() ? '풍선 터뜨리기 🎈' : null;
  th.use = () => {
    const on = bs.filter(k => k.st === 'on'); if (!on.length) return;
    const k = on[Math.floor(Math.random() * on.length)];
    if (on.length === 1) { k.st = 'fly'; k.t = 0; G.beep([[660, .06], [880, .06], [1175, .12]]); tell('balloon', '🎈 마지막 풍선은 하늘로 날아가요!', 2200); th.re = 7; }
    else {
      k.st = 'gone'; k.b.visible = false;
      burst(sp.x + k.home[0], k.home[1], sp.z + k.home[2], { n: 16, sp: 3.2, life: 0.55, size: 0.3, cols: [k.c, 0xffffff], g: 6 });
      G.beep([[1100, .02], [240, .05], [160, .05]]); tell('balloon', '🎈 펑! 풍선을 터뜨렸어요', 1800);
    }
    fire('use', { kind: 'balloon' });
  };
  th.tick = (dt, t) => {
    g.rotation.y = Math.sin(t * 0.6 + th.ph) * 0.25;
    for (const k of bs) {
      if (k.st === 'fly') { k.t += dt; k.b.position.y += dt * (1.6 + k.t * 0.5); k.b.position.x = k.home[0] + Math.sin(k.t * 1.7) * 0.5 * Math.min(1, k.t); if (k.b.position.y > 34) { k.st = 'gone'; k.b.visible = false; } }
      else if (k.st === 'grow') { k.t = Math.min(1, k.t + dt * 2.5); k.b.scale.setScalar(k.t); if (k.t >= 1) k.st = 'on'; }
    }
    if (!left() && !bs.some(k => k.st === 'grow') && (th.re -= dt) < 0) { // 다 없어지면 조금 뒤에 새 풍선이 달려요
      bs.forEach(k => { if (k.st !== 'on') { k.st = 'grow'; k.t = 0.01; k.b.position.set(k.home[0], k.home[1], k.home[2]); k.b.scale.setScalar(0.01); k.b.visible = true; } });
      th.re = 6;
    }
  };
  return th;
}

// ---------------- 🔔 종 ----------------
function buildBell(sp, rot) {
  const th = thing('bell', '🔔', sp.x, sp.z, { verb: '치기', useR: 2.2, fp: [{ x: sp.x, z: sp.z, r: 1.4 }] });
  const g = grp(sp.x, sp.z, rot); th.g = g; th.objs.push(g);
  for (const sx of [-1, 1]) { cyl(0.09, 0.11, 3.1, 0x8d6e63, sx * 0.95, 1.55, 0, g, 8); box(0.5, 0.16, 0.5, 0x6d4c41, sx * 0.95, 0.08, 0, g); }
  box(2.3, 0.16, 0.22, 0x8d6e63, 0, 3.1, 0, g);
  const roof = add(new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.8, 4), mat(0xc92a2a)), 0, 3.58, 0, g); roof.rotation.y = PI / 4; roof.scale.z = 0.6;
  bake(g);
  const piv = dyn(g, 0, 3.0, 0), gold = new THREE.MeshStandardMaterial({ color: 0xf2b632, roughness: 0.35, metalness: 0.55 });
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.48, 0.66, 16), gold), 0, -0.45, 0, piv); add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), gold), 0, -0.14, 0, piv);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 6, 18), gold), 0, -0.78, 0, piv).rotation.x = PI / 2;
  const clap = dyn(piv, 0, -0.2, 0); add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0x5c4033)), 0, -0.62, 0, clap);
  const rope = box(0.035, 1.1, 0.035, 0xdeb887, 0, -1.4, 0, piv); rope.userData.ns = 1;
  th.sw = 0; th.n = 0; th.cd = 0; th.t0 = 0;
  addSign(th, 4.5);
  const NOTE = [784, 880, 988, 1175, 1318, 1175, 988, 880];
  th.label = () => th.cd > 0 ? null : '종 치기 🔔';
  th.use = () => {
    if (th.cd > 0) return;
    const f = NOTE[th.n++ % NOTE.length]; th.sw = 1; th.cd = 0.45; th.t0 = ST.t;
    G.beep([[f, .5]]); setTimeout(() => G.beep([[f * 2, .25]]), 30);
    emo('🎵', sp.x + (Math.random() - 0.5), 2.6, sp.z + (Math.random() - 0.5), 0.6);
    tell('bell', '🔔 댕~ 종을 쳤어요. 여러 번 치면 가락이 돼요', 2200); fire('use', { kind: 'bell' });
  };
  th.tick = (dt, t) => {
    if (th.cd > 0) th.cd -= dt;
    if (th.sw > 0) th.sw = Math.max(0, th.sw - dt * 0.55);
    const a = Math.sin((t - th.t0) * 8.5) * 0.42 * th.sw; piv.rotation.z = a; clap.rotation.z = -a * 1.6;
  };
  return th;
}

// ---------------- 🎆 불꽃놀이 버튼 ----------------
const FCOL = [[0xff6b6b, 0xffd43b], [0x4dabf7, 0xffffff], [0x51cf66, 0xffe066], [0xda77f2, 0xff8787], [0xffa94d, 0xffffff], [0x3bc9db, 0xb197fc]];
function buildFire(sp) {
  const th = thing('fire', '🎆', sp.x, sp.z, { verb: '누르기', useR: 2.0, solidR: 0.4, fp: [{ x: sp.x, z: sp.z, r: 0.9 }] });
  const g = grp(sp.x, sp.z, 0); th.g = g; th.objs.push(g);
  cyl(0.36, 0.44, 0.9, 0x343a40, 0, 0.45, 0, g, 14); cyl(0.42, 0.42, 0.08, 0xffd43b, 0, 0.94, 0, g, 14);
  cyl(0.6, 0.66, 0.1, 0x495057, 0, 0.05, 0, g, 16); for (let i = 0; i < 10; i++) sph(0.055, i % 2 ? 0xffd43b : 0x212529, Math.cos(i * PI / 5) * 0.45, 0.5, Math.sin(i * PI / 5) * 0.45, g); for (const s of [-1, 1]) { const tb = cyl(0.07, 0.09, 0.5, 0xe03131, s * 0.75, 0.3, -0.2, g, 8); tb.rotation.z = -s * 0.2; cone(0.07, 0.14, 0xffd43b, s * 0.8, 0.6, -0.2, g, 8).rotation.z = -s * 0.2; } // 받침 · 경고 구슬 · 폭죽 통
  bake(g);
  const btn = add(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xe03131, emissive: 0xc92a2a, emissiveIntensity: 0.5, roughness: 0.4 })), 0, 1.05, 0, g);
  th.cd = 0; th.q = []; th.n = 0;
  addSign(th, 2.3);
  th.label = () => th.cd > 0 ? null : '불꽃놀이 버튼 누르기 🎆';
  th.use = () => {
    if (th.cd > 0) return;
    th.cd = 5; const n = G.GFX.high ? 5 : 3;
    let dx = sp.x - P.x, dz = sp.z - P.z; const dl = hyp(dx, dz) || 1; dx /= dl; dz /= dl; // 내가 보는 쪽 하늘에 터져요
    const iso = CAM.iso; // 2.5D 에서는 화면 안(버튼 둘레)에서, 3D 에서는 앞쪽 먼 하늘에서 터져요
    for (let i = 0; i < n; i++) { const d = iso ? 1 + Math.random() * 5 : 17 + Math.random() * 7, w = (Math.random() - 0.5) * (iso ? 12 : 20); th.q.push({ t: i * 0.45, x: sp.x + dx * d - dz * w, y: iso ? 4.5 + Math.random() * 3 : 7 + Math.random() * 3.5, z: sp.z + dz * d + dx * w, cols: FCOL[(th.n + i) % FCOL.length] }); }
    th.n += n; G.beep([[392, .05], [523, .05]]);
    tell('fire', '🎆 불꽃놀이 시작! 하늘을 봐요', 2600); fire('use', { kind: 'fire' });
  };
  th.tick = (dt) => {
    if (th.cd > 0) th.cd -= dt;
    btn.position.y = 1.05 - (th.cd > 4.6 ? 0.07 : 0); btn.material.emissiveIntensity = th.cd > 0 ? 0.1 : 0.55;
    for (let i = th.q.length - 1; i >= 0; i--) { const s = th.q[i]; if ((s.t -= dt) <= 0) { th.q.splice(i, 1); rocket(sp.x, sp.z, s.x, s.y, s.z, s.cols); G.beep([[300, .05], [520, .07], [820, .1]]); } }
  };
  return th;
}

// ---------------- ⛄ 눈사람 / 🏰 모래성 ----------------
function buildMake(sp, rot) {
  const snow = !!G.FX2.snow;
  const th = thing('build', snow ? '⛄' : '🏰', sp.x, sp.z, { verb: '만들기', useR: 2.3, fp: [{ x: sp.x, z: sp.z, r: 1.6 }], solidR: snow ? 0.6 : 0 });
  const g = grp(sp.x, sp.z, rot); th.g = g; th.objs.push(g);
  const st = [dyn(g), dyn(g), dyn(g)];
  if (snow) {
    const base = sph(0.75, 0xffffff, 0, 0.1, 0, g); base.scale.set(1.3, 0.3, 1.3);
    cyl(0.17, 0.13, 0.28, 0xe03131, 1.15, 0.14, 0.35, g, 10); const sv = box(0.05, 0.9, 0.05, 0x8d6e63, 1.2, 0.42, -0.25, g); sv.rotation.z = -0.5; box(0.2, 0.26, 0.03, 0x868e96, 1.43, 0.08, -0.25, g).rotation.z = -0.5; // 양동이·삽 (눈 위에서 자리가 보이게)
    sph(0.6, 0xffffff, 0, 0.55, 0, st[0]); sph(0.43, 0xffffff, 0, 1.36, 0, st[1]);
    sph(0.3, 0xffffff, 0, 1.96, 0, st[2]);
    const nose = add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), mat(0xff922b)), 0, 1.96, 0.4, st[2]); nose.rotation.x = PI / 2;
    for (const dx of [-0.11, 0.11]) sph(0.035, 0x212529, dx, 2.04, 0.27, st[2]);
    cyl(0.24, 0.24, 0.3, 0x212529, 0, 2.37, 0, st[2]); cyl(0.36, 0.36, 0.04, 0x212529, 0, 2.21, 0, st[2]); cyl(0.33, 0.33, 0.12, 0xe03131, 0, 1.7, 0, st[2]);
    for (const sx of [-1, 1]) { const a = box(0.7, 0.04, 0.04, 0x5c4033, sx * 0.65, 1.5, 0, st[2]); a.rotation.z = sx * 0.5; }
  } else {
    for (const [w, d, x, z] of [[3, 0.2, 0, -1.4], [3, 0.2, 0, 1.4], [0.2, 2.6, -1.4, 0], [0.2, 2.6, 1.4, 0]]) box(w, 0.24, d, 0xa1887f, x, 0.12, z, g);
    box(2.6, 0.14, 2.6, 0xf2d9a0, 0, 0.07, 0, g);
    box(1.3, 0.45, 1.3, 0xe9c46a, 0, 0.36, 0, st[0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(0.2, 0.22, 0.75, 0xe9c46a, sx * 0.62, 0.52, sz * 0.62, st[1], 10); add(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.3, 10), mat(0xdcb65a)), sx * 0.62, 1.04, sz * 0.62, st[1]); }
    cyl(0.3, 0.34, 0.9, 0xe9c46a, 0, 1.03, 0, st[2], 12); add(new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.45, 12), mat(0xdcb65a)), 0, 1.7, 0, st[2]);
    cyl(0.02, 0.02, 0.6, 0x868e96, 0, 2.1, 0, st[2], 5); box(0.34, 0.2, 0.02, 0xe03131, 0.18, 2.28, 0, st[2]);
  }
  bake(g); st.forEach(s => { bake(s); s.visible = false; s.scale.setScalar(0.01); });
  th.n = 0; th.grow = -1; th.cd = 0; th.freeNow = () => th.n >= 3; // 다시 만들기(치우기)는 그냥 돼요
  addSign(th, snow ? 3.3 : 2.9);
  const NM = snow ? '눈사람' : '모래성';
  th.label = () => th.cd > 0 ? null : th.n >= 3 ? NM + ' 다시 만들기' : (snow ? '눈 굴리기 ⛄' : '모래 쌓기 🏰') + ' (' + th.n + '/3)';
  th.use = () => {
    if (th.cd > 0) return;
    th.cd = 0.5;
    if (th.n >= 3) { th.n = 0; st.forEach(s => { s.visible = false; s.scale.setScalar(0.01); }); G.beep([[330, .05], [247, .08]]); G.toast('처음부터 다시 만들어요', 1600); return; }
    const s = st[th.n]; s.visible = true; s.scale.setScalar(0.01); th.grow = th.n; th.gt = 0; th.n++;
    G.beep([[392 + th.n * 90, .05], [523 + th.n * 110, .09]]);
    if (th.n >= 3) { G.confetti(26); setTimeout(() => G.beep('star'), 250); emo(snow ? '⛄' : '🏰', sp.x, 2.6, sp.z, 0.9); tell('build', (snow ? '⛄' : '🏰') + ' ' + NM + ' 완성! 멋져요', 2600); }
    else tell(null, (snow ? '⛄ 눈을 굴려요… ' : '🏰 모래를 쌓아요… ') + th.n + '/3', 1500);
    fire('use', { kind: 'build', n: th.n });
  };
  th.tick = (dt) => {
    if (th.cd > 0) th.cd -= dt;
    if (th.grow >= 0) { th.gt = Math.min(1, th.gt + dt * 3.2); const k = th.gt, e = 1 + 0.25 * Math.sin(k * PI) * (1 - k) + (k - 1) * (1 - k); st[th.grow].scale.setScalar(Math.max(0.01, k * e)); if (k >= 1) { st[th.grow].scale.setScalar(1); th.grow = -1; } }
  };
  return th;
}

// ================= 2차: 💎 보석으로 타기 · 영어로 말해야 타기 · 단원 놀이 =================
// - 값은 지금 가진 보석(fun.js 가 센 '모은 수 − 쓴 수', FUN.wallet / FUN.spend)에서 빠져요. 별·정답률·서버 기록은 건드리지 않아요.
// - 영어 문장은 모두 그 단원 data.js(window.LESSON) 에서 꺼내 써요. 조립할 때는 교과서 문장의 한 부분만 바꿔 끼워요.
const L = G.L || {};
const S4 = (Array.isArray(L.sentences) ? L.sentences : []).filter(s => s && s.en && s.ko);
const rndI = (n) => Math.floor(Math.random() * n);
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rndI(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
const uniq = (a) => a.filter((x, i) => x != null && a.indexOf(x) === i);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const swap = (base, from, to) => base && from && to != null && String(base).indexOf(from) >= 0 ? String(base).replace(from, to) : null; // 교과서 문장의 한 부분만 바꿔요. 못 찾으면 null
const SPEAK = G.speak || (window.__mp && window.__mp.speak) || (() => {});
const LOCK = G.lock || (window.__mp && window.__mp.lock) || null;

// ---------------- 💎 값 ----------------
const PRICE = { plane: 8, chest: 5, bike: 4, scooter: 3, fire: 3, tramp: 2, swing: 2, build: 2, kite: 2, fish: 2, fountain: 1, balloon: 1, bell: 1, hoop: 1 }; // 공 차기·벤치는 무료
const PASS = { fountain: { n: 3 }, balloon: { n: 5 }, build: { n: 3 }, bell: { t: 40 }, tramp: { t: 60 }, kite: { t: 60 }, bench: { t: 120 }, ball: { t: 90 } };        // 한 번 값을 내면 n번 / t초 (없으면 1번)
const NAME = { plane: '비행기 타기', bike: '자전거 타기', scooter: '킥보드 타기', fire: '불꽃놀이', tramp: '트램펄린 뛰기', swing: '그네 타기', build: '만들기', fountain: '분수에 동전 던지기', balloon: '풍선 터뜨리기', bell: '종 치기', kite: '연 날리기', fish: '낚시 연못', hoop: '농구 골대', chest: '보물 상자', bench: '벤치에 앉기', ball: '공 차기' };
const funW = () => { const f = window.FUN; return f && typeof f.wallet === 'function' && typeof f.spend === 'function' ? f : null; };
const wallet = () => { const f = funW(); return f ? f.wallet() : 1e9; }; // fun.js 가 없으면 값 없이 놀아요
const pay = (n) => { const f = funW(); return !f || n <= 0 ? true : !!f.spend(n); };
const hasPass = (th) => th.passN > 0 || th.passT > ST.t;
const isFree = (th) => !!(th.freeNow && th.freeNow()) || (!th.themed && hasPass(th)); // 영어 관문은 모든 놀이에 있어요 (값이 0 이어도). 맞힌 뒤 이용권이 남아 있는 동안만 그냥 돼요
const costText = (th) => isFree(th) ? '' : th.price > 0 ? ' · 💎' + th.price : ' · 🗣️';
function needMore(price) {
  const k = Math.max(1, price - wallet()); let extra = '';
  try {
    const o = G.objective, p = o && o.pos && o.pos();
    if (p) { extra = '<br><small>➡ 미션 자리까지 ' + Math.max(1, Math.round(hyp(p[0] - P.x, p[1] - P.z))) + 'm · 화면 위 화살표를 따라가요</small>'; const f = window.FUN; if (f && f.pathGems) f.pathGems(o); } // 미션 가는 길에 보석을 놓아 줘요
    const nav = document.querySelector('#nav'); if (nav) { nav.classList.remove('pgGlow'); void nav.offsetWidth; nav.classList.add('pgGlow'); setTimeout(() => nav.classList.remove('pgGlow'), 3200); }
  } catch (e) {}
  gateEl();
  G.toast('💎 보석이 <b>' + k + '개</b> 더 필요해요<br><small>미션 길에 있는 보석을 모으거나, 미션을 하면 얻을 수 있어요</small>' + extra, 4400);
  G.beep('bad'); fire('poor', { need: k });
}
// 놀이 기구 쓰기: 무료·이용권이 있으면 바로, 아니면 보석 확인 → 영어 관문 → 값 내기 → 작동
function tryUse(th) {
  if (!th || !th.use || GATE.open) return false;
  if (isFree(th)) { if (!th.themed && th.passN > 0 && !(th.freeNow && th.freeNow())) th.passN--; th.use(); return true; }
  if (th.canUse && !th.canUse()) return false;
  const price = th.price | 0;
  if (wallet() < price) { needMore(price); return false; }
  let ch = null; try { ch = th.challenge ? th.challenge() : lessonQ(); } catch (e) { warn(e); }
  const go = () => {
    if (!pay(price)) { needMore(price); return; }
    const ps = PASS[th.kind]; th.passN = 0; th.passT = 0;
    if (!th.themed) { if (ps && ps.t) th.passT = ST.t + ps.t; else th.passN = (ps && ps.n ? ps.n : 1) - 1; }
    fire('paid', { kind: th.kind, price }); th.use();
  };
  if (!ch || !LOCK) { go(); return true; } // 문제를 만들 수 없으면 값만 받아요
  openGate({ title: th.emoji + ' ' + (th.name || NAME[th.kind] || ''), cost: price, specs: Array.isArray(ch) ? ch : [ch], ride: /^(plane|bike|scooter|swing|tramp|bus|carousel)$/.test(th.kind) }, go);
  return true;
}

// ---------------- 🗣️ 영어 관문 (자체 창: 별·정답률·기록과 상관없어요) ----------------
const GATE = { el: null, open: false, specs: null, i: 0, onPass: null, timers: [], btns: [], title: '', cost: 0, done: false, ride: false };
function gateEl() {
  if (GATE.el) return GATE.el;
  const st = document.createElement('style');
  st.textContent = '#playGate{position:fixed;left:50%;bottom:16px;transform:translate(-50%,30px);width:min(760px,94vw);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:12px 18px 12px;box-shadow:0 8px 30px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:.2s;z-index:31;border:4px solid #1d3557;color:#1d3557}'
    + '#playGate.show{opacity:1;pointer-events:auto;transform:translate(-50%,0)}'
    + '#playGate .pgTop{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px}'
    + '#playGate .pgTitle{background:#e76f51;color:#fff;border-radius:10px;padding:3px 12px;font-size:16px}'
    + '#playGate .pgCost{background:#e7f5ff;border-radius:10px;padding:3px 10px;font-size:15px}'
    + '#playGate .pgTag{font-size:14px;color:#5c677d;flex:1}'
    + '#playGate .pgX{border:0;background:#eef2f6;color:#1d3557;border-radius:10px;padding:6px 10px;font-size:14px;font-family:inherit}'
    + '#playGate .pgPic{font-size:30px;line-height:1.25;margin:2px 0}'
    + '#playGate .pgPic small{font-size:17px;color:#5c677d}'
    + '#playGate .pgEn{font-size:26px;line-height:1.3;margin:4px 0}'
    + '#playGate .pgEn.pgEar{font-size:19px;color:#2a9d8f}'
    + '#playGate .pgKo{font-size:17px;color:#5c677d;line-height:1.45}'
    + '#playGate .pgKo b{color:#1d3557}'
    + '#playGate .pgCh{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'
    + '#playGate .pgCh .choice{font-family:inherit}'
    + '#playGate .pgRow{display:flex;align-items:center;gap:10px;margin-top:10px;min-height:34px}'
    + '#playGate .pgSpk{border:0;background:#e7f5ff;color:#1d3557;border-radius:10px;padding:8px 12px;font-size:16px;font-family:inherit}'
    + '#playGate .pgHint{font-size:16px;color:#e76f51;flex:1}'
    + '#playGate .pgHint.ok{color:#2b8a3e}#playGate .pgHint.no{color:#e03131;font-size:18px}'
    + '#playGate{background:linear-gradient(180deg,#fff8e6 0,#fff 64px);border-color:#1d3557;box-shadow:0 10px 0 rgba(29,53,87,.18),0 14px 34px rgba(0,0,0,.28)}'
    + '#playGate .pgTitle{font-size:18px;padding:5px 14px;border-radius:999px;box-shadow:0 2px 0 #c2553b}#playGate .pgCost{background:#fff3bf;border:2px solid #ffd43b;border-radius:999px;font-size:14px}'
    + '#playGate .pgCh .choice{border-radius:16px;box-shadow:0 3px 0 #d0d7e2;transition:transform .08s,box-shadow .08s}#playGate .pgCh .choice:active:not(:disabled){transform:translateY(3px);box-shadow:none}'
    + '#playGate .pgCh .choice.right{box-shadow:0 3px 0 #2b8a3e}#playGate .pgCh .choice.wrong{box-shadow:0 3px 0 #e03131}#playGate .pgPic{background:#f1f8ff;border-radius:14px;padding:6px 12px;display:inline-block}'
    + '@keyframes pgGlow{0%,100%{filter:none}50%{filter:drop-shadow(0 0 10px #ffd43b) drop-shadow(0 0 4px #ffd43b) brightness(1.15)}}#nav.pgGlow{animation:pgGlow .64s 5}'
    + '@media (max-width:640px){#playGate .pgEn{font-size:21px}#playGate .pgPic{font-size:24px}#playGate .pgCh .choice{font-size:17px;flex-basis:100%}}';
  document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'playGate';
  d.innerHTML = '<div class="pgTop"><span class="pgTitle"></span><span class="pgCost"></span><span class="pgTag"></span><button type="button" class="pgX">✕ 그만두기</button></div><div class="pgPic"></div><div class="pgEn"></div><div class="pgKo"></div><div class="pgCh"></div><div class="pgRow"><button type="button" class="pgSpk"></button><span class="pgHint"></span></div>';
  document.body.appendChild(d); GATE.el = d;
  d.querySelector('.pgX').onclick = safe(() => closeGate(true));
  d.querySelector('.pgSpk').onclick = safe(() => { const s = GATE.specs && GATE.specs[GATE.i]; if (s && s.say) sayAll(s.say, s.who); });
  return d;
}
function sayAll(list, who) { // 차례로 읽어 줘요. 걸리는 시간(ms)을 돌려줘요
  for (const t of GATE.timers) clearTimeout(t); GATE.timers = []; let at = 0;
  for (const s of (Array.isArray(list) ? list : [list])) {
    if (!s) continue; const txt = Array.isArray(s) ? s[0] : s, w = Array.isArray(s) ? s[1] : who;
    GATE.timers.push(setTimeout(() => { try { SPEAK(txt, w || 'Teacher'); } catch (e) {} }, at)); at += 650 + txt.length * 72;
  }
  return at;
}
function openGate(o, onPass) {
  gateEl(); Object.assign(GATE, { open: true, specs: o.specs, i: 0, onPass, title: o.title, cost: o.cost | 0, done: false, ride: !!o.ride });
  if (LOCK) LOCK(true);
  GATE.el.classList.add('show'); showStep(); fire('gate', { title: o.title });
}
function closeGate(cancel) {
  if (!GATE.open) return;
  GATE.open = false; GATE.el.classList.remove('show'); GATE.btns = [];
  if (cancel) { for (const t of GATE.timers) clearTimeout(t); GATE.timers = []; try { speechSynthesis.cancel(); } catch (e) {} G.beep('click'); }
  let talk = false; try { talk = document.querySelector('#dlg').classList.contains('show'); } catch (e) {} // 엔진 대화가 떠 있으면 잠금은 그대로 둬요
  if (LOCK && !talk) LOCK(false);
}
function showStep() {
  const d = GATE.el, q = (c) => d.querySelector(c), s = GATE.specs[GATE.i], n = GATE.specs.length;
  GATE.done = false;
  q('.pgTitle').textContent = GATE.title; q('.pgCost').textContent = GATE.cost ? '맞히면 💎 ' + GATE.cost + '개를 내고 해요' : '맞히면 할 수 있어요';
  q('.pgTag').textContent = (s.tag || '') + (n > 1 ? ' (' + (GATE.i + 1) + '/' + n + ')' : '') + ' · 기회는 한 번!';
  const pic = q('.pgPic'); pic.innerHTML = s.pic || ''; pic.style.display = s.pic ? '' : 'none';
  const en = q('.pgEn'); en.classList.toggle('pgEar', !s.en && !!s.say); en.textContent = s.en || (s.say ? '🔊 잘 들어 보세요' : ''); en.style.display = s.en || s.say ? '' : 'none';
  q('.pgKo').innerHTML = s.ko || '';
  const hint = q('.pgHint'); hint.textContent = ''; hint.classList.remove('ok', 'no');
  const spk = q('.pgSpk'); spk.style.display = s.say ? '' : 'none'; spk.textContent = s.again || '🔊 다시 듣기';
  const ch = q('.pgCh'); ch.textContent = ''; GATE.btns = [];
  const wrongHit = (b) => { // 틀리면 이 도전은 끝: 정답을 잠깐 보여 주고 닫아요 (보석은 그대로)
    if (GATE.done) return; GATE.done = true; G.beep('bad'); if (s.qid) qMiss(s.qid, true);
    GATE.btns.forEach(x => { x.disabled = true; if (x.dataset.r) x.classList.add('right'); }); if (b) b.classList.add('wrong');
    hint.classList.add('no'); hint.textContent = '❌ 아쉬워요! 정답: ' + (s.order ? s.order.join(' ') : s.right);
    fire('fail', { title: GATE.title });
    setTimeout(safe(() => {
      if (!GATE.open) return; const ride = GATE.ride; closeGate(false);
      G.toast('😢 아쉬워요! 이번에는 못 ' + (ride ? '탔어요' : '했어요') + '<br><small>보석은 그대로예요 · 다시 도전하려면 ' + eKey() + '</small>', 3200);
    }), 2000);
  };
  if (s.order) { // 낱말 순서 맞추기
    const ans = document.createElement('div'); ans.className = 'orderAns'; ch.appendChild(ans);
    const pool = document.createElement('div'); pool.className = 'orderPool'; ch.appendChild(pool);
    let idx = 0;
    shuf(s.order.map((w, i) => i)).forEach(i => {
      const w = s.order[i], b = document.createElement('button'); b.type = 'button'; b.className = 'choice small'; b.textContent = w; b.dataset.w = i;
      b.onclick = safe(() => {
        if (GATE.done) return;
        if (w === s.order[idx]) { G.beep('get'); b.remove(); const c = document.createElement('span'); c.className = 'chip'; c.textContent = w; ans.appendChild(c); idx++; if (idx >= s.order.length) stepDone(s); }
        else { b.classList.add('wrong'); wrongHit(null); }
      });
      pool.appendChild(b); GATE.btns.push(b);
    });
  } else {
    (s.keep ? s.choices : shuf(s.choices)).forEach((c, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'choice'; if (c === s.right) b.dataset.r = 1;
      b.innerHTML = '<span class="num">' + (i + 1) + '</span>' + esc(c);
      b.onclick = safe(() => { if (GATE.done || b.disabled) return; if (c === s.right) { b.classList.add('right'); stepDone(s); } else wrongHit(b); });
      ch.appendChild(b); GATE.btns.push(b);
    });
  }
  if (s.say) { for (const t of GATE.timers) clearTimeout(t); GATE.timers = [setTimeout(() => { if (GATE.open && GATE.specs[GATE.i] === s) sayAll(s.say, s.who); }, 350)]; }
}
function stepDone(s) {
  GATE.done = true; GATE.btns.forEach(x => { x.disabled = true; }); G.beep('ok');
  if (s.qid) qMiss(s.qid, false);
  const hint = GATE.el.querySelector('.pgHint'); hint.classList.add('ok'); hint.textContent = '✅ ' + (s.afterKo || '잘했어요!');
  const ms = s.after ? sayAll(s.after, s.whoAfter || '나') : 0; // 맞히면 그 문장을 소리 내어 읽어 줘요
  setTimeout(safe(() => {
    if (!GATE.open) return;
    if (++GATE.i < GATE.specs.length) { showStep(); return; }
    const f = GATE.onPass; closeGate(false); if (f) f();
  }), clamp(ms * 0.75, 900, 3000));
}
addEventListener('keydown', safe((e) => {
  if (!GATE.open) return;
  if (/^Digit[1-9]$/.test(e.code)) { const b = GATE.btns[+e.code.slice(5) - 1]; if (b && !GATE.specs[GATE.i].order) b.click(); }
  else if (e.code === 'KeyR') GATE.el.querySelector('.pgSpk').click();
  else if (e.code === 'Escape') closeGate(true);
}));

// ---------------- 그 단원 문장으로 내는 문제 (공통 놀이의 관문) ----------------
// 유형 네 가지: ① 뜻 보고 영어 문장 고르기 ② 듣고 고르기 ③ 낱말 순서 맞추기 ④ 질문에 알맞은 대답 고르기
const QA = { 1: [[0, 1], [2, 3]], 2: [[0, 1], [2, 3]], 3: [[0, 1]], 4: [[0, 1]], 8: [[0, 1]], 9: [[0, 1], [0, 2]], 11: [[0, 1]] }; // L.sentences 안의 질문–대답 짝 (번호). 대답이 하나로 뚜렷한 것만 (L6·L12 는 다른 문장도 대답이 될 수 있어서 뺐어요)
const QKEY = 'english3d_play_q1';
let QS = {}; try { const s = JSON.parse(localStorage.getItem(QKEY)); if (s && typeof s === 'object') QS = s; } catch (e) {}
const qState = () => { const k = 'l' + G.lessonNo; let s = QS[k]; if (!s || typeof s !== 'object' || !Array.isArray(s.miss)) s = QS[k] = { p: 0, miss: [] }; return s; };
const qSave = () => { try { localStorage.setItem(QKEY, JSON.stringify(QS)); } catch (e) {} };
function qMiss(id, add) { const s = qState(), i = s.miss.indexOf(id); if (add && i < 0) s.miss.push(id); else if (!add && i >= 0) s.miss.splice(i, 1); if (s.miss.length > 12) s.miss.shift(); qSave(); }
let QB = null;
function qBank() {
  const by = { ko: [], listen: [], order: [], reply: [] }, n = S4.length;
  S4.forEach((x, i) => { by.ko.push({ id: 'k' + i, t: 'ko', i }); by.listen.push({ id: 'l' + i, t: 'listen', i }); const w = x.en.split(' ').length; if (w >= 3 && w <= 9) by.order.push({ id: 'o' + i, t: 'order', i }); });
  for (const [q, a] of (QA[G.lessonNo] || [])) if (S4[q] && S4[a] && /\?$/.test(S4[q].en) && !/\?$/.test(S4[a].en)) by.reply.push({ id: 'r' + q + '_' + a, t: 'reply', i: a, q });
  const rot = (a, k) => a.length ? a.slice(k % a.length).concat(a.slice(0, k % a.length)) : a;
  by.listen = rot(by.listen, 1); by.order = rot(by.order, 2); by.ko = rot(by.ko, G.lessonNo % Math.max(1, n));
  const out = []; for (let i = 0; i < 8; i++) for (const t of ['ko', 'listen', 'reply', 'order']) if (by[t][i]) out.push(by[t][i]);
  return out;
}
function qSpec(q) {
  const s = S4[q.i], all = S4.map(x => x.en);
  if (q.t === 'ko') return { qid: q.id, tag: '뜻 보고 말하기', ko: '<b>「' + esc(s.ko) + '」</b><br>영어로 어떻게 말할까요?', choices: all, right: s.en, hint: '"' + s.en.split(' ')[0] + ' …" 로 시작해요', after: [s.en] };
  if (q.t === 'listen') return { qid: q.id, tag: '듣고 고르기', ko: '잘 듣고, 들은 문장을 골라요', say: [s.en], choices: all, right: s.en, hint: '뜻: ' + s.ko, after: [s.en] };
  if (q.t === 'order') return { qid: q.id, tag: '낱말 순서 맞추기', ko: '<b>「' + esc(s.ko) + '」</b><br>낱말을 차례대로 눌러 문장을 만들어요', order: s.en.split(' '), hint: '"' + s.en.split(' ')[0] + '" 부터 눌러요', after: [s.en] };
  const Q = S4[q.q], alsoOk = (QA[G.lessonNo] || []).filter(p => p[0] === q.q).map(p => p[1]);
  return { qid: q.id, tag: '질문에 대답하기', en: Q.en, say: [Q.en], ko: esc(Q.ko) + ' — 알맞은 대답을 골라요', choices: [s.en].concat(S4.filter((x, k) => k !== q.q && k !== q.i && alsoOk.indexOf(k) < 0 && !/\?$/.test(x.en)).map(x => x.en)), right: s.en, hint: '뜻: ' + s.ko, after: [s.en] };
}
function lessonQ() { // 돌아가며 내고, 틀린 문제는 곧 다시 나와요
  const qb = QB || (QB = qBank()); if (!qb.length) return null;
  const st = qState(); let q = null;
  if (st.miss.length && st.p % 2 === 1) q = qb.find(x => x.id === st.miss[0]) || null;
  if (!q || (q.id === st.last && qb.length > 1)) { q = qb[(st.q | 0) % qb.length]; st.q = ((st.q | 0) + 1) % qb.length; if (q.id === st.last && qb.length > 1) { q = qb[(st.q | 0) % qb.length]; st.q = ((st.q | 0) + 1) % qb.length; } }
  st.last = q.id; // 바로 앞에 낸 문제는 연달아 내지 않아요
  st.p = (st.p | 0) + 1; qSave();
  return qSpec(q);
}

// ---------------- 움직임 도구 ----------------
const TW = [];
function tw(dur, fn, done) { TW.push({ t: 0, dur: Math.max(0.01, dur), fn, done }); }
const later = (sec, fn) => tw(sec, null, fn);
function twTick(dt) {
  for (let i = TW.length - 1; i >= 0; i--) {
    const a = TW[i]; a.t += dt; const k = Math.min(1, a.t / a.dur);
    try { if (a.fn) a.fn(k); } catch (e) { warn(e); }
    if (k >= 1) { TW.splice(TW.indexOf(a), 1); try { if (a.done) a.done(); } catch (e) { warn(e); } }
  }
}
function toss(m, a, b, dur, h, done) { m.visible = true; tw(dur, k => { m.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + h * 4 * k * (1 - k), a[2] + (b[2] - a[2]) * k); }, done); }
const tune = (seq, gap, len) => seq.forEach((f, i) => later(i * (gap || 0.22), () => G.beep([[f, len || 0.2]])));
const hop = (o, h, dur, y0) => { const y = y0 == null ? o.position.y : y0; tw(dur || 0.4, k => { o.position.y = y + (h || 0.3) * 4 * k * (1 - k); }, () => { o.position.y = y; }); };
const front = (d, y) => [P.x - Math.sin(P.yaw) * (d || 0.9), y == null ? 1.2 : y, P.z - Math.cos(P.yaw) * (d || 0.9)]; // 내 앞
function jumpMe() { if (P.jy <= 0 && (!ST.ride || roam(ST.ride))) { P.vy = 5.2; P.jy = 0.001; } }

// ---------------- 모형 도구 (둥근 모양) ----------------
const MATD = {};
const matD = (c) => MATD[c] || (MATD[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, side: THREE.DoubleSide }));
const glow = (c, k) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k == null ? 0.6 : k, roughness: 0.5 });
const cap = (r, len, c, x, y, z, parent) => add(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, r < 0.1 ? 2 : 3, r < 0.1 ? 7 : 10), typeof c === 'number' ? mat(c) : c), x, y, z, parent);
const cone = (r, h, c, x, y, z, parent, seg) => add(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 14), typeof c === 'number' ? mat(c) : c), x, y, z, parent);
const tor = (R, r, c, x, y, z, parent, arc) => add(new THREE.Mesh(new THREE.TorusGeometry(R, r, R < 0.25 ? 5 : 6, R < 0.25 ? 12 : 20, arc || PI * 2), typeof c === 'number' ? mat(c) : c), x, y, z, parent);
const ell = (r, sx, sy, sz, c, x, y, z, parent) => { const m = sph(r, c, x, y, z, parent); m.scale.set(sx, sy, sz); return m; };
const lathe = (pts, c, x, y, z, parent) => add(new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), 16), typeof c === 'number' ? mat(c) : c), x, y, z, parent);
const flatX = (m) => { m.rotation.z = PI / 2; return m; };  // 옆으로 눕히기 (x 축 방향)
const flatZ = (m) => { m.rotation.x = PI / 2; return m; };  // 앞뒤로 눕히기 (z 축 방향)
const EMS = {};
function emoSprite(text, h) { // 그림 글자 팻말 (늘 나를 봐요)
  let c = EMS[text]; if (!c) { const t = G.textSprite(text, 1, { fs: 96, bg: null, pad: 6 }); c = EMS[text] = { map: t.material.map, w: t.scale.x }; }
  const s = noRay(new THREE.Sprite(new THREE.SpriteMaterial({ map: c.map, transparent: true, depthWrite: false, toneMapped: false }))); s.scale.set(h * c.w, h, 1); s.userData.h = h; return s;
}
function emoSet(s, text) { let c = EMS[text]; if (!c) { const t = G.textSprite(text, 1, { fs: 96, bg: null, pad: 6 }); c = EMS[text] = { map: t.material.map, w: t.scale.x }; } s.material.map = c.map; s.material.needsUpdate = true; s.scale.set(s.userData.h * c.w, s.userData.h, 1); }
// 단원 놀이 자리 하나: 앞(+z)이 마을 가운데를 봐요
function mkStation(kind, emoji, name, r, o) {
  o = o || {}; const sp = spot(r, o.near ? { near: o.near, nearW: o.nearW || 0.2, far: o.far } : { far: o.far }); if (!sp) return null;
  const rot = o.rot != null ? o.rot : Math.atan2(-sp.x, 6 - sp.z), fx = Math.sin(rot), fz = Math.cos(rot);
  const th = thing(kind, emoji, sp.x, sp.z, { verb: o.verb || '하기', useR: r + 1.5, fp: [{ x: sp.x, z: sp.z, r: r * 0.85 }], name, themed: 1, price: o.price == null ? 1 : o.price, solidR: o.solid || 0, rot, f: [fx, fz] });
  const g = grp(sp.x, sp.z, rot); th.g = g; th.objs.push(g);
  th.ux = sp.x + fx * r * 0.55; th.uz = sp.z + fz * r * 0.55;
  th.W = (lx, ly, lz) => [sp.x + lx * fz + lz * fx, ly, sp.z - lx * fx + lz * fz]; // 자리 기준 좌표 → 세계 좌표
  th.label = () => th.busy > 0 ? null : name;
  return th;
}
const pickI = (th, n) => (th.qi = ((th.qi == null ? rndI(n) : th.qi + 1) % n)); // 돌아가며 골라요
const others = (all, right, n) => shuf(uniq(all).filter(x => x !== right)).slice(0, n);
const cheer = (th, e, html, ms) => { if (e) emo(e, th.x, 2.4, th.z, 0.9); tell(th.kind, html, ms || 2800); };

// ---------------- 🍽️ 음식 모형 (L2) ----------------
const FOODS = {};
function dish(g, r) { cyl(r, r * 0.78, 0.035, 0xffffff, 0, 0.018, 0, g, 22); flatZ(tor(r * 0.98, 0.016, 0xced4da, 0, 0.036, 0, g)); }
function wedge(r, h, c, y, g) { const m = cyl(r, r, h, c, 0, y, -0.02, g, 3); m.scale.set(0.8, 1, 1.35); return m; } // 세모난 케이크 조각
function foodModel(name) {
  const key = String(name || '').toLowerCase().replace(/^(a|an|some)\s+/, ''); if (FOODS[key]) return FOODS[key];
  const g = new THREE.Group();
  if (/steak/.test(key)) { // 소고기 스테이크: 구운 줄무늬 고기 + 버터 + 브로콜리 + 감자튀김
    dish(g, 0.4); ell(0.2, 1.2, 0.34, 0.85, 0x8a4b2a, -0.05, 0.1, 0.02, g); ell(0.2, 1.24, 0.2, 0.9, 0x6f3a1f, -0.05, 0.075, 0.02, g);
    for (const dx of [-0.17, -0.07, 0.03]) { const l = box(0.028, 0.014, 0.27, 0x3f2212, dx, 0.166, 0.02, g); l.rotation.y = 0.55; }
    box(0.075, 0.035, 0.075, 0xffe066, -0.05, 0.185, 0.03, g);
    for (const [x, z] of [[0.25, 0.1], [0.22, -0.07], [0.3, 0.0]]) { cyl(0.02, 0.026, 0.06, 0x94d82d, x, 0.065, z, g, 6); sph(0.058, 0x2f9e44, x, 0.12, z, g); sph(0.04, 0x37b24d, x + 0.03, 0.14, z + 0.02, g); }
    for (let i = 0; i < 5; i++) { const f = box(0.03, 0.03, 0.19, 0xffc34d, -0.2 + i * 0.045, 0.06 + (i % 2) * 0.03, -0.24, g); f.rotation.y = (i - 2) * 0.22; }
    sph(0.045, 0xe03131, 0.14, 0.075, 0.25, g);
  } else if (/pizza/.test(key)) { // 피자: 빵 테두리 + 치즈 + 토핑 (감자 / 치즈)
    dish(g, 0.42); cyl(0.36, 0.36, 0.04, 0xd9a05b, 0, 0.056, 0, g, 24); flatZ(tor(0.345, 0.03, 0xc98b46, 0, 0.075, 0, g)); cyl(0.315, 0.315, 0.03, 0xffd43b, 0, 0.082, 0, g, 24);
    const potato = /potato/.test(key);
    for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.3, r = 0.11 + (i % 2) * 0.12, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (potato) { ell(0.055, 1, 0.5, 0.8, 0xf3e2b3, x, 0.105, z, g).rotation.y = a; if (i % 2) box(0.05, 0.02, 0.03, 0xc0392b, x * 0.55, 0.105, z * 0.55, g); }
      else { cyl(0.055, 0.055, 0.016, 0xfff3bf, x, 0.103, z, g, 10); if (i % 3 === 0) ell(0.04, 1.3, 0.3, 0.7, 0x2f9e44, x * 0.5, 0.108, z * 0.5, g); } }
    for (let i = 0; i < 3; i++) { const l = box(0.72, 0.006, 0.012, 0xc98b46, 0, 0.1, 0, g); l.rotation.y = i * PI / 3; }
  } else if (/sandwich/.test(key)) { // 샌드위치: 세모 빵 사이에 상추·치킨·토마토·치즈
    dish(g, 0.38); let y = 0.04;
    for (const [c, h, r] of [[0xe9bd72, 0.05, 0.27], [0x51cf66, 0.02, 0.31], [0xd98e3b, 0.05, 0.25], [0xe03131, 0.02, 0.23], [0xffd43b, 0.015, 0.29], [0xe9bd72, 0.05, 0.27]]) { y += h / 2; const m = cyl(r, r, h, c, 0, y, 0, g, 3); m.rotation.y = c === 0xffd43b ? 0.5 : 0; y += h / 2 + 0.002; }
    cyl(0.008, 0.008, 0.2, 0xdeb887, 0, y + 0.06, 0, g, 5); sph(0.035, 0x5c940d, 0, y + 0.15, 0, g); sph(0.02, 0xe03131, 0.012, y + 0.165, 0.02, g);
  } else if (/spaghetti/.test(key)) { // 스파게티: 돌돌 말린 면 + 토마토소스 + 미트볼 + 바질
    dish(g, 0.4);
    for (let i = 0; i < 5; i++) { const t = flatZ(tor(0.2 - i * 0.03, 0.034, i % 2 ? 0xf8d877 : 0xf2c94c, (i % 2 - 0.5) * 0.03, 0.07 + i * 0.035, (i % 3 - 1) * 0.02, g)); t.rotation.y = i; t.rotation.x += (i % 2 ? 0.12 : -0.1); }
    ell(0.13, 1, 0.45, 1, 0xd9480f, 0, 0.235, 0, g); sph(0.055, 0x7a4424, 0.07, 0.275, 0.03, g); sph(0.05, 0x7a4424, -0.06, 0.27, -0.04, g);
    ell(0.04, 1.4, 0.25, 0.8, 0x2f9e44, 0.0, 0.31, 0.05, g).rotation.y = 0.6; ell(0.035, 1.4, 0.25, 0.8, 0x37b24d, -0.03, 0.31, 0.01, g).rotation.y = -0.7;
  } else if (/salad/.test(key)) { // 과일 샐러드: 둥근 그릇에 색색 과일
    lathe([[0.0, 0], [0.17, 0.012], [0.3, 0.1], [0.37, 0.22], [0.39, 0.25]], 0xa5d8ff, 0, 0, 0, g); flatZ(tor(0.39, 0.016, 0xffffff, 0, 0.25, 0, g)); cyl(0.17, 0.2, 0.03, 0x74c0fc, 0, 0.015, 0, g, 18);
    ell(0.33, 1, 0.3, 1, 0xb2f2bb, 0, 0.19, 0, g);
    const F = [[0xe03131, 0.065], [0xff922b, 0.06], [0x7950f2, 0.042], [0x94d82d, 0.058], [0xffe066, 0.055], [0x364fc7, 0.035], [0xff6b6b, 0.06]];
    for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 0.05 + (i * 37 % 100) / 100 * 0.22, f = F[i % F.length], m = sph(f[1], f[0], Math.cos(a) * r, 0.27 + (i % 3) * 0.022, Math.sin(a) * r, g); if (i % F.length === 3) m.scale.set(1, 0.35, 1); if (i % F.length === 4) m.scale.set(1, 0.4, 1); }
    for (const [x, z] of [[0.1, 0.12], [-0.14, -0.05]]) cone(0.018, 0.03, 0x2f9e44, x, 0.36, z, g, 6);
  } else if (/juice/.test(key)) { // 레몬주스: 컵 + 빨대 + 레몬 조각 + 얼음
    cyl(0.13, 0.1, 0.34, 0xffe066, 0, 0.17, 0, g, 18); flatZ(tor(0.13, 0.014, 0xffffff, 0, 0.34, 0, g)); cyl(0.105, 0.105, 0.02, 0xdee2e6, 0, 0.01, 0, g, 16);
    const s = cyl(0.014, 0.014, 0.42, 0xe03131, 0.05, 0.36, 0, g, 6); s.rotation.z = -0.25;
    const le = cyl(0.085, 0.085, 0.02, 0xffd43b, -0.11, 0.36, 0.03, g, 16); le.rotation.z = PI / 2; le.rotation.y = 0.5; const li = cyl(0.065, 0.065, 0.022, 0xfff3bf, -0.11, 0.36, 0.03, g, 16); li.rotation.z = PI / 2; li.rotation.y = 0.5;
    box(0.06, 0.05, 0.06, 0xffffff, -0.02, 0.34, 0.04, g).rotation.y = 0.5; box(0.055, 0.05, 0.055, 0xf1f3f5, 0.03, 0.345, -0.05, g).rotation.y = 0.2;
  } else if (/cake/.test(key)) { // 초콜릿 케이크 한 조각: 층층이 + 크림 + 체리
    dish(g, 0.34);
    wedge(0.22, 0.075, 0x5c3317, 0.075, g); wedge(0.22, 0.03, 0xfff3bf, 0.128, g); wedge(0.22, 0.075, 0x6b3a1c, 0.18, g); wedge(0.22, 0.03, 0x3f220f, 0.233, g);
    ell(0.06, 1, 0.75, 1, 0xffffff, 0, 0.28, -0.1, g); sph(0.035, 0xffffff, 0, 0.32, -0.1, g); sph(0.04, 0xe03131, 0, 0.36, -0.1, g); cyl(0.005, 0.005, 0.07, 0x5c940d, 0.01, 0.41, -0.1, g, 4); for (const x of [-0.07, 0.07]) sph(0.022, 0xfff3bf, x, 0.255, 0.1, g);
  } else if (/ice cream/.test(key)) { // 아이스크림: 과자 콘 + 두 덩이 + 체리
    cyl(0.1, 0.13, 0.04, 0xffffff, 0, 0.02, 0, g, 16); const c = cone(0.105, 0.3, 0xe0a45c, 0, 0.18, 0, g, 16); c.rotation.x = PI;
    flatZ(tor(0.1, 0.014, 0xc98b46, 0, 0.33, 0, g)); sph(0.125, 0xff8fab, 0, 0.42, 0, g); sph(0.105, 0x96f2d7, 0.01, 0.57, 0, g); sph(0.035, 0xe03131, 0.01, 0.685, 0, g);
    for (let i = 0; i < 5; i++) box(0.012, 0.012, 0.035, [0xffd43b, 0x4dabf7, 0xffffff][i % 3], Math.cos(i * 1.3) * 0.07, 0.63 + (i % 2) * 0.02, Math.sin(i * 1.3) * 0.07, g);
  } else if (/milk/.test(key)) { // 우유: 흰 컵 + 파란 줄 + 과자
    cyl(0.12, 0.1, 0.32, 0xffffff, 0, 0.16, 0, g, 18); flatZ(tor(0.118, 0.012, 0x4dabf7, 0, 0.2, 0, g)); flatZ(tor(0.121, 0.012, 0xdee2e6, 0, 0.32, 0, g)); cyl(0.2, 0.16, 0.02, 0xffe8cc, 0.02, 0.01, 0, g, 16);
    cyl(0.07, 0.07, 0.022, 0xd9a05b, 0.24, 0.02, 0.06, g, 12); for (const [x, z] of [[0.22, 0.05], [0.26, 0.08], [0.24, 0.03]]) sph(0.012, 0x5c3317, x, 0.034, z, g);
  } else { dish(g, 0.36); ell(0.2, 1, 0.5, 1, 0xffc078, 0, 0.11, 0, g); }
  bake(g); g.userData.dyn = 1; FOODS[key] = g; return g;
}
function showFood(name, at, scale) { const m = foodModel(name).clone(); m.position.set(at[0], at[1], at[2]); m.scale.setScalar(0.01); scene.add(m); tw(0.35, k => m.scale.setScalar(Math.max(0.01, scale * (k + 0.3 * Math.sin(k * PI))))); return m; }
function eatFood(m, scale, done) { // 내 앞으로 날아와서 세 입에 냠냠
  const a = [m.position.x, m.position.y, m.position.z], b = front(0.95, 1.15);
  toss(m, a, b, 0.7, 0.5, () => {
    for (let i = 0; i < 3; i++) later(0.35 + i * 0.45, () => { m.scale.setScalar(scale * (0.72 - i * 0.26)); G.beep([[420 - i * 40, .05], [300, .05]]); if (i === 2) { scene.remove(m); emo('😋', b[0], b[1] + 0.3, b[2], 0.7); if (done) done(); } });
  });
}

// ---------------- 단원 놀이 (단원마다 두 가지). 영어는 모두 그 단원 data.js 에서 꺼내요 ----------------
const THEME = {};
// L1 · 동아리 체험 무대 / 학년 실로폰
THEME[1] = (near) => {
  const ICON = { guitar: '🎸', badminton: '🏸', cooking: '🍳', dance: '💃' }, base = S4[3] && S4[3].en, ask = S4[2];
  const mk = (c) => swap(base, 'book club', c.en), list = (L.clubs || []).filter(c => ICON[c.id] && mk(c));
  if (list.length >= 2 && ask) (() => {
    const th = mkStation('club', '🎸', '동아리 체험', 2.7, { near, solid: 0 }); if (!th) return; const g = th.g;
    cyl(2.45, 2.55, 0.2, 0x9c6b3f, 0, 0.1, 0, g, 30); cyl(2.25, 2.25, 0.05, 0xf3e3c6, 0, 0.21, 0, g, 30);
    for (let i = 0; i < 10; i++) sph(0.07, [0xff6b6b, 0xffd43b, 0x4dabf7][i % 3], Math.cos(i / 10 * PI * 2) * 2.35, 0.26, Math.sin(i / 10 * PI * 2) * 2.35, g);
    bake(g);
    const pr = {};
    // 기타
    const gt = pr.guitar = dyn(g, -1.35, 0.23, 0.2); gt.rotation.z = 0.18;
    ell(0.33, 1, 1.12, 0.32, 0xd9903d, 0, 0.5, 0, gt); ell(0.25, 1, 1, 0.32, 0xd9903d, 0, 0.9, 0, gt); flatZ(cyl(0.09, 0.09, 0.02, 0x3f2212, 0, 0.56, 0.105, gt, 14));
    box(0.085, 0.8, 0.05, 0x5c4033, 0, 1.4, 0.03, gt); box(0.14, 0.22, 0.05, 0x3f2212, 0, 1.9, 0.03, gt); box(0.16, 0.03, 0.04, 0xf1f3f5, 0, 0.36, 0.11, gt);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) sph(0.022, 0xdee2e6, s * 0.09, 1.83 + i * 0.07, 0.03, gt);
    for (let i = 0; i < 4; i++) box(0.006, 1.45, 0.006, 0xf8f9fa, -0.027 + i * 0.018, 1.08, 0.115, gt);
    bake(gt);
    // 배드민턴 채와 셔틀콕
    const rk = pr.badminton = dyn(g, 1.35, 0.23, 0.25); rk.rotation.z = -0.25;
    tor(0.26, 0.022, 0xe03131, 0, 1.35, 0, rk); cyl(0.016, 0.016, 0.62, 0xced4da, 0, 0.78, 0, rk, 6); cyl(0.03, 0.034, 0.3, 0x1c7ed6, 0, 0.35, 0, rk, 8);
    for (let i = -2; i <= 2; i++) { box(0.004, 0.5 - Math.abs(i) * 0.05, 0.004, 0xf8f9fa, i * 0.09, 1.35, 0, rk); box(0.5 - Math.abs(i) * 0.05, 0.004, 0.004, 0xf8f9fa, 0, 1.35 + i * 0.09, 0, rk); }
    bake(rk);
    const sh = new THREE.Group(); sh.userData.dyn = 1; const sc = cone(0.085, 0.14, 0xffffff, 0, 0.06, 0, sh, 10); sc.rotation.x = PI; sph(0.04, 0xe9bd72, 0, -0.03, 0, sh); bake(sh); sh.visible = false; scene.add(sh); th.objs.push(sh);
    // 냄비
    const pt = pr.cooking = dyn(g, -0.75, 0.23, -1.25);
    box(0.85, 0.5, 0.65, 0xdee2e6, 0, 0.25, 0, pt); for (const x of [-0.2, 0.2]) cyl(0.035, 0.035, 0.03, 0x343a40, x, 0.3, 0.335, pt, 8).rotation.x = PI / 2; cyl(0.24, 0.24, 0.02, 0x212529, 0, 0.51, 0, pt, 16);
    cyl(0.3, 0.27, 0.3, 0x495057, 0, 0.67, 0, pt, 18); for (const s of [-1, 1]) flatZ(tor(0.07, 0.018, 0x212529, s * 0.34, 0.74, 0, pt));
    bake(pt);
    const lid = dyn(pt, 0, 0.83, 0); ell(0.31, 1, 0.3, 1, 0xadb5bd, 0, 0, 0, lid); sph(0.045, 0x212529, 0, 0.1, 0, lid); bake(lid);
    // 춤: 반짝이 공과 스피커
    const dc = pr.dance = dyn(g, 0.85, 0.23, -1.25);
    box(0.55, 0.85, 0.42, 0x343a40, 0, 0.43, 0, dc); flatZ(cyl(0.17, 0.17, 0.03, 0x868e96, 0, 0.3, 0.215, dc, 16)); flatZ(cyl(0.09, 0.09, 0.03, 0x868e96, 0, 0.65, 0.215, dc, 14)); cyl(0.03, 0.04, 2.3, 0xced4da, 0.55, 1.15, 0, dc, 8); box(0.6, 0.04, 0.04, 0xced4da, 0.28, 2.3, 0, dc);
    bake(dc);
    const ballM = new THREE.MeshStandardMaterial({ color: 0xe7f5ff, roughness: 0.25, metalness: 0.7, flatShading: true });
    const disco = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), ballM), 0.02, 2.0, 0, dc);
    addSign(th, 3.4);
    th.challenge = () => { const c = th.cur = list[pickI(th, list.length)]; return { tag: '동아리 체험', pic: ICON[c.id] + ' ' + esc(c.ko), en: ask.en, ko: esc(ask.ko) + ' — 그림의 동아리로 대답해요', say: [ask.en], choices: list.map(mk), right: mk(c), hint: c.ko + ' = ' + c.en, after: [mk(c)] }; };
    th.use = () => {
      const c = th.cur || list[0], id = c.id, p = pr[id]; th.busy = 4.5;
      if (p) hop(p, 0.25, 0.45);
      if (id === 'guitar') { tune([392, 494, 587, 784, 587, 494, 392, 523], 0.26, 0.3); tw(2.4, k => { gt.rotation.z = 0.18 + Math.sin(k * 30) * 0.05; }); for (let i = 0; i < 4; i++) later(i * 0.55, () => { const w = th.W(-1.35, 2.3, 0.2); emo('🎵', w[0] + (Math.random() - 0.5), w[1], w[2], 0.6); }); }
      else if (id === 'badminton') { const a = th.W(1.35, 1.7, 0.25); let n = 0; const go = () => { const b = front(0.6, 1.6), up = n % 2 === 0; toss(sh, up ? a : b, up ? b : a, 0.6, 1.3, () => { G.beep([[900, .03], [500, .04]]); if (++n < 6) go(); else sh.visible = false; }); tw(0.3, k => { rk.rotation.z = -0.25 - Math.sin(k * PI) * 0.6; }); }; go(); }
      else if (id === 'cooking') { tw(3, k => { lid.position.y = 0.83 + Math.abs(Math.sin(k * 26)) * 0.08; }, () => { lid.position.y = 0.83; }); for (let i = 0; i < 4; i++) later(i * 0.6, () => { const w = th.W(-0.75, 1.5, -1.25); emo(i === 3 ? '🍚' : '♨️', w[0], w[1], w[2], 0.7); G.beep([[260 + i * 30, .05], [200, .05]]); }); }
      else { ST.danceT = 4.5; tune([523, 0, 659, 523, 784, 0, 659, 784, 1046], 0.3, 0.16); tw(4.5, k => { disco.rotation.y = k * 18; ballM.color.setHSL((k * 3) % 1, 0.7, 0.7); }, () => ballM.color.set(0xe7f5ff)); }
      cheer(th, ICON[id], ICON[id] + ' ' + esc(c.ko) + ' 체험! 신나요', 2600);
    };
  })();
  const grades = (L.grades || []).slice(0, 6), gko = L.gradeKo || {}, gb = S4[1] && S4[1].en, gq = S4[0], gs = (x) => swap(gb, 'sixth', x);
  if (grades.length >= 4 && gq && gs('first')) (() => {
    const th = mkStation('grade', '🎹', '학년 실로폰', 2.1, { near }); if (!th) return; const g = th.g;
    for (const s of [-1, 1]) { const r = cap(0.07, 3.3, 0x8d6e63, 0, 0.62, s * 0.42, g); r.rotation.z = PI / 2; r.rotation.y = s * 0.13; for (const x of [-1.5, 1.5]) cyl(0.06, 0.08, 0.6, 0x6d4c41, x, 0.3, s * (0.42 - x * 0.065 * 1), g, 8); }
    bake(g);
    const COL = [0xe03131, 0xff922b, 0xffd43b, 0x40c057, 0x339af0, 0x9775fa], bars = [];
    grades.forEach((x, i) => { const b = dyn(g, (i - (grades.length - 1) / 2) * 0.56, 0.76, 0); box(0.44, 0.09, 1.55 - i * 0.14, COL[i % 6], 0, 0, 0, b); for (const z of [-0.45, 0.45]) sph(0.03, 0xf8f9fa, 0, 0.05, z * (1 - i * 0.08), b); bake(b); const s = emoSprite(String(i + 1), 0.36); s.position.set(0, 0.45, 0); b.add(s); bars.push(b); });
    const mal = dyn(g, 0, 1.1, 0.9); cyl(0.018, 0.018, 0.7, 0xdeb887, 0, 0.25, 0, mal, 6); sph(0.07, 0xf06595, 0, 0.62, 0, mal); mal.rotation.x = -1.2; bake(mal);
    addSign(th, 2.5);
    th.challenge = () => { const x = th.cur = grades[pickI(th, grades.length)]; return { tag: '듣고 고르기', pic: '🎹', en: gq.en, ko: '친구의 대답을 잘 듣고, 몇 학년인지 골라요', say: [gq.en, gs(x)], choices: grades.map(k => gko[k] || k), keep: true, right: gko[x] || x, hint: x + ' = ' + (gko[x] || ''), after: [gs(x)] }; };
    th.use = () => {
      const n = Math.max(1, grades.indexOf(th.cur) + 1), SC = [523, 587, 659, 784, 880, 1046]; th.busy = n * 0.3 + 1.2;
      for (let i = 0; i < n; i++) later(i * 0.3, () => { G.beep([[SC[i % 6], .28]]); hop(bars[i], 0.14, 0.25, 0.76); mal.position.x = bars[i].position.x; tw(0.2, k => { mal.rotation.x = -1.2 - Math.sin(k * PI) * 0.5; }); });
      later(n * 0.3 + 0.1, () => { G.beep([[SC[(n - 1) % 6] * 2, .4]]); const w = th.W(bars[n - 1].position.x, 1.7, 0); emo('🎵', w[0], w[1], w[2], 0.7); });
      cheer(th, null, '🎹 ' + esc(gko[th.cur] || '') + '! 실로폰을 ' + n + '번 쳤어요', 2600);
    };
  })();
};
// L2 · 푸드 트럭(주문하고 먹기) / 맛보기 식탁
THEME[2] = (near) => {
  const cf = (L.comicFoods || []).filter(f => Array.isArray(f) && f[0] && f[1]), ob = S4[1] && S4[1].en, oq = S4[0];
  const order = (f) => swap(ob, 'a beef steak', f[0]);
  if (cf.length >= 4 && oq && order(cf[0])) (() => {
    const th = mkStation('food', '🍽️', '푸드 트럭', 3.0, { near, price: 2, solid: 1.5, verb: '주문' }); if (!th) return; const g = th.g;
    const C1 = 0xff8787, C2 = 0xfff5f5;
    box(3.3, 1.45, 1.75, C1, -0.35, 1.2, 0, g); flatX(cyl(0.875, 0.875, 3.3, C1, -0.35, 1.9, 0, g, 20)); box(3.32, 0.16, 1.77, C2, -0.35, 0.75, 0, g);
    box(1.05, 1.0, 1.65, C2, 1.8, 0.98, 0, g); flatZ(cyl(0.5, 0.5, 1.65, C2, 1.85, 1.45, 0, g, 16)); box(0.06, 0.5, 1.3, 0xa5d8ff, 2.34, 1.5, 0, g).rotation.z = -0.25; box(0.5, 0.42, 0.04, 0xa5d8ff, 1.85, 1.5, 0.83, g);
    box(0.25, 0.22, 1.7, 0xced4da, 2.38, 0.5, 0, g); for (const z of [-0.6, 0.6]) sph(0.11, 0xffe066, 2.36, 0.85, z, g);
    for (const x of [-1.4, 1.75]) for (const z of [-0.8, 0.8]) { flatZ(cyl(0.4, 0.4, 0.26, 0x212529, x, 0.4, z, g, 18)); flatZ(cyl(0.18, 0.18, 0.28, 0xdee2e6, x, 0.4, z, g, 12)); }
    box(1.9, 0.75, 0.06, 0x343a40, -0.45, 1.6, 0.86, g); box(2.2, 0.08, 0.5, 0xdeb887, -0.45, 1.18, 1.08, g); for (const x of [-1.4, 0.5]) box(0.06, 0.4, 0.06, 0xa1887f, x, 0.98, 1.2, g).rotation.x = 0.5;
    for (let i = 0; i < 7; i++) { const a = box(0.32, 0.05, 0.75, i % 2 ? 0xffffff : 0xe03131, -1.41 + i * 0.32, 2.14, 1.16, g); a.rotation.x = 0.42; sph(0.06, i % 2 ? 0xffffff : 0xe03131, -1.41 + i * 0.32, 1.95, 1.5, g); }
    cyl(0.1, 0.1, 0.5, 0x868e96, -1.5, 2.9, -0.3, g, 8); ell(0.22, 1, 0.5, 1, 0x495057, -1.5, 3.15, -0.3, g);
    // 메뉴판
    for (const s of [-1, 1]) box(0.06, 1.3, 0.06, 0x8d6e63, -2.6 + s * 0.4, 0.62, 1.3 - 0.12, g).rotation.x = -0.15; box(0.95, 1.05, 0.06, 0x2b2d42, -2.6, 0.9, 1.3, g).rotation.x = -0.15;
    bake(g);
    const board = emoSprite('🥩🍕🥗', 0.34); board.position.set(-2.6, 1.05, 1.42); g.add(board); const b2 = emoSprite('🍝🥪🍰', 0.34); b2.position.set(-2.6, 0.68, 1.46); g.add(b2);
    const cook = emoSprite('👩‍🍳', 0.6); cook.position.set(-0.45, 1.68, 0.8); g.add(cook);
    addSign(th, 3.9);
    th.challenge = () => { const f = th.cur = cf[pickI(th, cf.length)], em = f[3] || '🍽️'; return { tag: '주문하기', pic: em + ' ' + esc(f[1]), en: oq.en, ko: esc(oq.ko) + ' — 그림의 음식을 주문해요', say: [[oq.en, 'Server']], choices: [order(f)].concat(others(cf.map(order), order(f), 3)), right: order(f), hint: f[1] + ' = ' + f[0], after: [order(f)] }; };
    th.use = () => {
      const f = th.cur || cf[0], at = th.W(-0.45, 1.28, 1.08); th.busy = 4.6;
      G.beep([[659, .08], [880, .12]]); const m = showFood(f[0], at, 1.5);
      later(1.5, () => eatFood(m, 1.5, () => cheer(th, null, (f[3] || '🍽️') + ' ' + esc(f[1]) + '! 냠냠, 잘 먹었어요', 2800)));
    };
  })();
  const ta = (L.tastes || []).filter(t => t && t.short && t.taste && t.food), tw5 = (L.tasteWords || []).map(w => w[0]), qb = S4[2] && S4[2].en, ab = S4[3] && S4[3].en;
  const how = (t) => swap(qb, 'salad', t.short), its = (w) => swap(ab, 'sweet', w);
  if (ta.length >= 2 && tw5.length >= 3 && how(ta[0]) && its('sour')) (() => {
    const th = mkStation('taste', '😋', '맛보기 식탁', 2.2, { near, solid: 1.1, verb: '맛보기' }); if (!th) return; const g = th.g;
    cyl(1.25, 1.25, 0.07, 0xfff0f6, 0, 0.86, 0, g, 28); lathe([[1.25, 0.83], [1.33, 0.55], [1.28, 0.4]], 0xffdeeb, 0, 0, 0, g); cyl(0.12, 0.16, 0.86, 0xa1887f, 0, 0.43, 0, g, 10); cyl(0.55, 0.6, 0.06, 0xa1887f, 0, 0.03, 0, g, 16);
    cyl(0.04, 0.04, 2.0, 0xced4da, 0, 1.9, 0, g, 8); cone(1.7, 0.55, 0xff8787, 0, 2.75, 0, g, 10); for (let i = 0; i < 10; i++) sph(0.09, i % 2 ? 0xffffff : 0xe03131, Math.cos(i / 10 * PI * 2) * 1.66, 2.46, Math.sin(i / 10 * PI * 2) * 1.66, g); sph(0.08, 0xe03131, 0, 3.05, 0, g);
    bake(g);
    const ds = ta.slice(0, 4).map((t, i) => { const a = i / Math.min(4, ta.length) * PI * 2 + PI / 4, m = foodModel(t.food).clone(); m.position.set(Math.cos(a) * 0.72, 0.9, Math.sin(a) * 0.72); m.scale.setScalar(0.95); g.add(m); return m; });
    addSign(th, 3.6);
    th.challenge = () => { const i = pickI(th, Math.min(4, ta.length)), t = th.cur = ta[i]; th.ci = i; return { tag: '맛 말하기', pic: esc(t.face || '') + ' <small>' + esc(t.cue || '') + '</small>', en: how(t), ko: '맛이 어떤지 대답해요', say: [[how(t), 'Server']], choices: tw5.map(its), right: its(t.taste), hint: (L.tasteWords.find(w => w[0] === t.taste) || [])[1] || '', after: [its(t.taste)] }; };
    th.use = () => { const t = th.cur || ta[0], m = ds[th.ci | 0]; th.busy = 2.6; hop(m, 0.5, 0.5, 0.9); tw(1.6, k => { m.rotation.y = k * PI * 2; }); G.beep([[523, .06], [784, .1]]); const w = th.W(m.position.x, 1.9, m.position.z); later(0.5, () => emo((t.face || '😋').slice(-2), w[0], w[1], w[2], 0.8)); cheer(th, null, esc(t.face || '😋') + ' ' + esc(its(t.taste)) + ' 맛을 영어로 말했어요', 2600); };
  })();
};
// L3 · 곰 인형 병원(조언하기) / 건강 검진(증상 말하기)
THEME[3] = (near) => {
  const sy = (L.symptoms || []).filter(s => s && s.id && s.ko), ad = (L.advice || []).filter(a => a && a.symptom && a.advice), allAd = uniq((L.adviceChoices || []).concat(ad.map(a => a.advice)));
  const have = (s) => swap(S4[1] && S4[1].en, 'runny nose', s.id), wq = S4[0];
  if (sy.length >= 3 && ad.length >= 2 && wq && have(sy[0])) (() => {
    const th = mkStation('nurse', '🧸', '곰 인형 병원', 2.3, { near, solid: 0.9, verb: '돌보기' }); if (!th) return; const g = th.g;
    box(1.25, 0.28, 2.2, 0xffffff, 0, 0.5, 0, g); for (const [x, z] of [[-0.55, -1], [0.55, -1], [-0.55, 1], [0.55, 1]]) { cyl(0.05, 0.05, 0.5, 0xadb5bd, x, 0.25, z, g, 8); sph(0.07, 0x495057, x, 0.06, z, g); }
    cap(0.09, 1.1, 0xadb5bd, 0, 1.0, -1.08, g).rotation.z = PI / 2; for (const x of [-0.55, 0.55]) cyl(0.05, 0.05, 0.75, 0xadb5bd, x, 0.72, -1.08, g, 8);
    box(1.15, 0.16, 2.1, 0xe7f5ff, 0, 0.7, 0, g); ell(0.3, 1.3, 0.45, 0.9, 0xffffff, 0, 0.83, -0.75, g); ell(0.62, 1, 0.3, 1.25, 0x74c0fc, 0, 0.78, 0.4, g);
    cyl(0.03, 0.03, 2.0, 0xced4da, 0.95, 1.0, -0.8, g, 6); cyl(0.3, 0.3, 0.03, 0xced4da, 0.95, 0.02, -0.8, g, 5); box(0.22, 0.32, 0.08, 0xffe3e3, 0.95, 1.85, -0.8, g); box(0.4, 0.03, 0.03, 0xced4da, 0.95, 2.02, -0.8, g);
    box(0.6, 0.7, 0.5, 0xf1f3f5, -1.2, 0.35, -0.6, g); box(0.4, 0.26, 0.3, 0xffffff, -1.2, 0.83, -0.6, g); box(0.2, 0.06, 0.02, 0xe03131, -1.2, 0.83, -0.44, g); box(0.06, 0.2, 0.02, 0xe03131, -1.2, 0.83, -0.44, g);
    bake(g);
    const bear = dyn(g, 0, 0.8, -0.25), BR = 0xc98d5b;
    ell(0.3, 1, 1.1, 0.9, BR, 0, 0.32, 0, bear); sph(0.25, BR, 0, 0.8, 0.03, bear); for (const s of [-1, 1]) { sph(0.095, BR, s * 0.2, 1.02, 0, bear); sph(0.05, 0xf3d9b1, s * 0.2, 1.02, 0.06, bear); cap(0.08, 0.22, BR, s * 0.33, 0.38, 0.08, bear).rotation.z = s * 0.7; cap(0.09, 0.2, BR, s * 0.17, 0.08, 0.28, bear).rotation.x = PI / 2; sph(0.03, 0x212529, s * 0.09, 0.86, 0.24, bear); }
    ell(0.11, 1, 0.8, 0.8, 0xf3d9b1, 0, 0.74, 0.22, bear); sph(0.035, 0x212529, 0, 0.78, 0.31, bear); ell(0.2, 1, 1, 0.5, 0xf3d9b1, 0, 0.3, 0.22, bear);
    bake(bear);
    const bub = emoSprite('🤒', 0.5); bub.position.set(0.42, 1.35, 0); bear.add(bub);
    addSign(th, 3.2);
    const pool = sy.filter(s => ad.some(a => a.symptom === s.id));
    th.challenge = () => {
      const s = th.cur = pool[pickI(th, pool.length)], a = ad.find(x => x.symptom === s.id).advice; emoSet(bub, s.emoji || '🤒');
      const lab = (x) => (x.emoji || '') + ' ' + x.ko;
      return [{ tag: '듣고 고르기', pic: '🧸', en: wq.en, ko: '곰 인형이 아파요. 어디가 아픈지 잘 들어요', say: [[wq.en, 'Nurse'], [have(s), 'Boy']], choices: [lab(s)].concat(others(sy.map(lab), lab(s), 3)), right: lab(s), hint: '다시 들어 봐요 🔊', after: [have(s)] },
        { tag: '알맞은 말 해 주기', pic: esc(lab(s)), ko: '곰 인형에게 알맞은 말을 해 줘요', en: have(s), choices: [a].concat(shuf(allAd.filter(x => a.toLowerCase().indexOf(x.toLowerCase().replace(/\.$/, '')) < 0 && x !== a)).slice(0, 2)), right: a, hint: (ad.find(x => x.symptom === s.id).ko || ''), after: [a] }];
    };
    th.use = () => { th.busy = 3; emoSet(bub, '😊'); hop(bear, 0.35, 0.45, 0.8); later(0.5, () => hop(bear, 0.25, 0.4, 0.8)); tune([523, 659, 784, 1046], 0.16); for (let i = 0; i < 3; i++) later(i * 0.4, () => { const w = th.W((i - 1) * 0.4, 2.2, -0.25); emo('❤️', w[0], w[1], w[2], 0.6); }); later(9, () => emoSet(bub, '🤒')); cheer(th, null, '🧸 곰 인형이 나았어요! 고마워요', 2600); };
  })();
  if (sy.length >= 4 && wq && have(sy[0])) (() => {
    const th = mkStation('clinic', '🩺', '건강 검진', 2.0, { near, solid: 0.7, verb: '검진' }); if (!th) return; const g = th.g;
    box(1.9, 0.9, 0.7, 0xffffff, 0, 0.45, -0.5, g); box(2.0, 0.07, 0.8, 0x74c0fc, 0, 0.93, -0.5, g); box(1.7, 0.28, 0.02, 0xe7f5ff, 0, 0.5, -0.14, g);
    cyl(0.05, 0.06, 2.6, 0xced4da, -1.15, 1.3, -0.5, g, 8); box(0.7, 0.7, 0.08, 0xffffff, -1.15, 2.6, -0.5, g); box(0.46, 0.14, 0.1, 0xe03131, -1.15, 2.6, -0.5, g); box(0.14, 0.46, 0.1, 0xe03131, -1.15, 2.6, -0.5, g);
    cap(0.1, 1.25, 0xf8f9fa, 0.55, 1.75, -0.5, g); sph(0.19, 0xe03131, 0.55, 1.02, -0.5, g); for (let i = 0; i < 6; i++) box(0.09, 0.012, 0.012, 0x495057, 0.67, 1.35 + i * 0.16, -0.5, g);
    cyl(0.11, 0.11, 0.24, 0xff922b, -0.35, 1.09, -0.45, g, 14); cyl(0.09, 0.09, 0.08, 0xffffff, -0.35, 1.25, -0.45, g, 14); cap(0.045, 0.1, 0x4dabf7, -0.05, 1.01, -0.3, g).rotation.z = PI / 2;
    lathe([[0.0, 0], [0.2, 0.02], [0.24, 0.1], [0.22, 0.4], [0.24, 0.42]], 0x8d6e63, 0.9, 0, 0.5, g); cyl(0.22, 0.22, 0.04, 0xe7f5ff, 0.9, 0.42, 0.5, g, 14);
    bake(g);
    const merc = add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 8), glow(0xe03131, 0.4)), 0.55, 1.1, -0.39, g); merc.scale.y = 0.35; merc.position.y = 1.1 + 0.175;
    const setM = (k) => { merc.scale.y = k; merc.position.y = 1.1 + k / 2; };
    addSign(th, 3.5);
    th.challenge = () => { const s = th.cur = sy[pickI(th, sy.length)]; return { tag: '증상 말하기', pic: esc(s.emoji || '') + ' <small>' + esc(s.act || s.ko) + '</small>', en: wq.en, ko: esc(wq.ko) + ' — 그림처럼 아프다고 말해요', say: [[wq.en, 'Nurse']], choices: [have(s)].concat(others(sy.map(have), have(s), 3)), right: have(s), hint: s.ko + ' = ' + s.id, after: [have(s)] }; };
    th.use = () => {
      const tip = S4[3]; th.busy = 4;
      tw(1.4, k => setM(0.35 + k * 0.85), () => { G.beep([[880, .1], [880, .1]]); later(0.5, () => tw(1.4, k => setM(1.2 - k * 0.85))); });
      later(1.6, () => { const w = th.W(-0.35, 1.9, -0.45); emo('💊', w[0], w[1], w[2], 0.7); if (tip) { try { SPEAK(tip.en, 'Nurse'); } catch (e) {} } });
      cheer(th, null, '🩺 검진 끝!' + (tip ? '<br><small>' + esc(tip.en) + ' — ' + esc(tip.ko) + '</small>' : ''), 3400);
    };
  })();
};
// L4 · 생일 케이크(날짜 대답하기) / 피냐타(날짜 듣기)
const ordN = (d) => d + (d % 100 >= 11 && d % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][d % 10]);
THEME[4] = (near) => {
  const mo = (L.months || []).filter(m => Array.isArray(m) && m[0]), ev = L.events || [], dates = (L.guess || []).concat(L.flip || []).filter(d => d && d.date && ev.some(e => e.id === d.event));
  const dstr = (d) => mo[d[0] - 1][0] + ' ' + ordN(d[1]), on = (d) => swap(S4[1] && S4[1].en, 'May 22nd', dstr(d)), when = (e) => swap(S4[0] && S4[0].en, 'the field trip', e.label), bd = (d) => swap(S4[3] && S4[3].en, 'June 7th', dstr(d));
  if (mo.length === 12 && dates.length >= 4 && on([1, 1]) && when(ev[0])) (() => {
    const th = mkStation('cake', '🎂', '생일 케이크', 2.1, { near, solid: 1.0, verb: '불 켜기' }); if (!th) return; const g = th.g;
    cyl(1.15, 1.15, 0.07, 0xffffff, 0, 0.8, 0, g, 26); lathe([[1.15, 0.78], [1.22, 0.5], [1.18, 0.32]], 0xd0ebff, 0, 0, 0, g); cyl(0.14, 0.18, 0.8, 0xa1887f, 0, 0.4, 0, g, 10); cyl(0.6, 0.65, 0.06, 0xa1887f, 0, 0.03, 0, g, 16);
    cyl(0.85, 0.85, 0.04, 0xf8f9fa, 0, 0.86, 0, g, 24); cyl(0.72, 0.74, 0.46, 0xfff0f6, 0, 1.11, 0, g, 24); flatZ(tor(0.73, 0.06, 0xff8fab, 0, 1.33, 0, g)); cyl(0.46, 0.48, 0.38, 0xfff0f6, 0, 1.53, 0, g, 22); flatZ(tor(0.47, 0.05, 0xff8fab, 0, 1.71, 0, g));
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; sph(0.065, 0xe03131, Math.cos(a) * 0.61, 1.39, Math.sin(a) * 0.61, g); ell(0.07, 1, 1.3, 1, 0xff8fab, Math.cos(a + 0.3) * 0.74, 1.24, Math.sin(a + 0.3) * 0.74, g); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; cyl(0.022, 0.022, 0.26, [0x4dabf7, 0xffd43b, 0x51cf66][i % 3], Math.cos(a) * 0.3, 1.85, Math.sin(a) * 0.3, g, 6); }
    bake(g);
    const fl = [], flM = glow(0xffd43b, 1); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2, f = add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), flM), Math.cos(a) * 0.3, 2.02, Math.sin(a) * 0.3, g); f.scale.y = 1.6; f.visible = false; f.userData.ns = 1; fl.push(f); }
    addSign(th, 3.2);
    th.challenge = () => { const d = th.cur = dates[pickI(th, dates.length)], e = ev.find(x => x.id === d.event); return { tag: '날짜 대답하기', pic: esc(e.emoji || '📅') + ' ' + esc(e.ko) + ' <small>📅 ' + d.date[0] + '월 ' + d.date[1] + '일</small>', en: when(e), ko: '달력을 보고 날짜를 대답해요', say: [when(e)], choices: [on(d.date)].concat(others(dates.map(x => on(x.date)), on(d.date), 3)), right: on(d.date), hint: d.date[0] + '월 = ' + mo[d.date[0] - 1][0], after: [on(d.date)] }; };
    th.use = () => { th.busy = 5; fl.forEach((f, i) => later(i * 0.25, () => { f.visible = true; G.beep([[660 + i * 80, .08]]); })); later(1.7, () => tune([523, 523, 587, 523, 698, 659], 0.24, 0.22)); later(3.6, () => { fl.forEach(f => { f.visible = false; }); const w = th.W(0, 2.3, 0); emo('💨', w[0], w[1], w[2], 0.8); burst(w[0], w[1], w[2], { n: 24, sp: 3.5, life: 0.9, size: 0.3, cols: [0xff8fab, 0xffd43b, 0x4dabf7, 0xffffff], g: 5 }); }); cheer(th, null, '🎂 촛불을 켰어요! 후~ 하고 꺼 봐요', 3000); };
  })();
  if (mo.length === 12 && bd([1, 1])) (() => {
    const th = mkStation('pinata', '🪅', '피냐타 터뜨리기', 2.2, { near, price: 2, verb: '치기' }); if (!th) return; const g = th.g;
    cyl(0.09, 0.12, 3.5, 0x8d6e63, -1.1, 1.75, 0, g, 10); cap(0.07, 1.5, 0x8d6e63, -0.35, 3.45, 0, g).rotation.z = PI / 2; cyl(0.45, 0.5, 0.12, 0x6d4c41, -1.1, 0.06, 0, g, 12); cyl(0.012, 0.012, 0.85, 0xdee2e6, 0.4, 3.02, 0, g, 5);
    bake(g);
    const pn = dyn(g, 0.4, 3.45, 0), bd2 = dyn(pn, 0, -1.25, 0), CC = [0xe03131, 0xffd43b, 0x40c057, 0x339af0, 0xbe4bdb, 0xff922b];
    sph(0.36, 0xffd43b, 0, 0, 0, bd2); flatZ(tor(0.36, 0.04, 0xe03131, 0, 0, 0, bd2)); tor(0.36, 0.04, 0x339af0, 0, 0, 0, bd2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2, c = cone(0.17, 0.5, CC[i], Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0, bd2, 10); c.rotation.z = a - PI / 2; const s = box(0.03, 0.26, 0.012, CC[(i + 2) % 6], Math.cos(a) * 0.86, Math.sin(a) * 0.86 - 0.08, 0, bd2); s.userData.ns = 1; }
    for (const z of [-1, 1]) { const c = cone(0.17, 0.46, CC[z > 0 ? 3 : 4], 0, 0, z * 0.5, bd2, 10); c.rotation.x = z * PI / 2; }
    bake(bd2);
    const bat = dyn(g, 1.0, 0.25, 0.7); cap(0.05, 0.9, 0xdeb887, 0, 0.5, 0, bat); bat.rotation.z = -0.5; bake(bat);
    addSign(th, 4.2);
    const again = S4[2] ? S4[2].en + ' 🔊' : null;
    th.challenge = () => { const pk = () => [1 + rndI(12), 1 + rndI(28)], d = th.cur = pk(), set = [d]; while (set.length < 4) { const x = pk(); if (!set.some(y => y[0] === x[0] || y[1] === x[1])) set.push(x); } const lab = (x) => '📅 ' + x[0] + '월 ' + x[1] + '일'; return { tag: '듣고 고르기', pic: '🪅', ko: '친구의 생일을 잘 듣고 달력을 골라요' + (S4[2] ? '<br><small>못 들었으면 <b>' + esc(S4[2].en) + '</b> 하고 다시 물어봐요</small>' : ''), say: [bd(d)], again, choices: set.map(lab), right: lab(d), hint: mo[d[0] - 1][0] + ' = ' + d[0] + '월', after: [bd(d)] }; };
    th.use = () => {
      th.busy = 8.5; const w = th.W(0.4, 2.2, 0);
      for (let i = 0; i < 3; i++) later(0.2 + i * 0.6, () => { G.beep([[160, .06], [110, .08]]); tw(0.5, k => { pn.rotation.z = Math.sin(k * PI) * (0.35 + i * 0.12) * (i % 2 ? -1 : 1); bat.rotation.z = -0.5 - Math.sin(k * PI) * 1.2; }); });
      later(2.1, () => { bd2.visible = false; G.beep('combo'); burst(w[0], w[1], w[2], { n: 44, sp: 5, life: 1.5, size: 0.42, cols: CC, g: 9 }); ['🍬', '🍭', '🧸'].forEach((e, i) => later(i * 0.25, () => emo(e, w[0] + (i - 1) * 0.6, w[1], w[2], 0.75))); cheer(th, null, '🪅 팡! 사탕과 장난감이 쏟아졌어요', 2800); });
      later(7.5, () => { bd2.visible = true; tw(0.5, k => bd2.scale.setScalar(Math.max(0.01, k))); });
    };
  })();
};

// L5 · 지구 지킴이 집(이렇게 해 보자고 말하기) / 아픈 지구(We should …)
THEME[5] = (near) => {
  const ac = (L.actions || []).filter(a => a && a.id && a.ko), sh = (L.shoulds || []).filter(s => s && s.id);
  const how = (a) => swap(S4[0] && S4[0].en, 'turning off the water', a.id), we = (s) => swap(S4[2] && S4[2].en, 'save energy', s.id);
  if (ac.length >= 4 && how(ac[0])) (() => {
    const th = mkStation('eco', '🌱', '지구 지킴이 집', 2.7, { near, verb: '실천' }); if (!th) return; const g = th.g;
    box(4.6, 0.12, 2.4, 0xd8f5a2, 0, 0.06, 0, g); box(4.6, 2.5, 0.18, 0xfff9db, 0, 1.37, -1.05, g); box(4.8, 0.14, 0.4, 0x94d82d, 0, 2.68, -1.0, g); box(4.6, 0.3, 0.2, 0x94d82d, 0, 0.27, -1.04, g);
    // 전등
    cyl(0.2, 0.24, 0.05, 0x495057, -1.85, 0.15, -0.4, g, 14); cyl(0.03, 0.03, 1.6, 0x495057, -1.85, 0.95, -0.4, g, 8);
    // 세면대와 수도꼭지
    box(0.9, 0.78, 0.55, 0xffffff, -0.75, 0.51, -0.65, g); cyl(0.3, 0.26, 0.06, 0xd0ebff, -0.75, 0.9, -0.6, g, 16); cyl(0.035, 0.035, 0.36, 0xadb5bd, -0.75, 1.08, -0.86, g, 8); const sp = tor(0.13, 0.03, 0xadb5bd, -0.75, 1.26, -0.73, g, PI); sp.rotation.y = PI / 2; sph(0.05, 0x4dabf7, -0.62, 1.1, -0.86, g);
    // 분리배출 통
    for (const [x, c] of [[0.55, 0x339af0], [1.2, 0xfab005]]) { cyl(0.27, 0.22, 0.62, c, x, 0.43, -0.6, g, 14); flatZ(tor(0.27, 0.025, 0xffffff, x, 0.74, -0.6, g)); }
    // 계단
    for (let i = 0; i < 3; i++) box(0.62, 0.2 * (i + 1), 0.3, [0xffc9c9, 0xffa8a8, 0xff8787][i], 2.0, 0.12 + 0.1 * (i + 1), 0.2 - i * 0.3, g);
    bake(g);
    const shadeM = glow(0xffe066, 0.9), shade = add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.34, 0.36, 16, 1, true), shadeM), -1.85, 1.9, -0.4, g); shadeM.side = THREE.DoubleSide; shade.userData.ns = 1;
    const drops = [0, 1, 2].map(i => { const d = sph(0.035, glow(0x74c0fc, 0.5), -0.75, 1.1, -0.6, g); d.userData.ns = 1; return d; });
    const cup = dyn(g, -0.75, 0.93, -0.6); cyl(0.09, 0.07, 0.18, 0x74c0fc, 0, 0.09, 0, cup, 12); flatZ(tor(0.05, 0.014, 0x74c0fc, 0.11, 0.09, 0, cup)).rotation.y = 0; cup.visible = false;
    const paper = box(0.2, 0.012, 0.27, 0xffffff, 0, 0, 0, scene); paper.visible = false; const can = cyl(0.055, 0.055, 0.14, 0xe03131, 0, 0, 0, scene, 10); can.visible = false; const ball = sph(0.1, 0x7950f2, 0, 0, 0, scene); ball.visible = false; th.objs.push(paper, can, ball);
    for (const [x, e] of [[0.55, '📰'], [1.2, '🥫']]) { const s = emoSprite(e, 0.3); s.position.set(x, 0.45, -0.3); g.add(s); }
    addSign(th, 3.5);
    th.light = 1; th.water = 1;
    th.challenge = () => { const a = th.cur = ac[pickI(th, ac.length)]; return { tag: '실천 말하기', pic: esc(a.emoji || '🌱') + ' ' + esc(a.ko), ko: '지구를 위해 이렇게 해 보자고 말해요', choices: [how(a)].concat(others(ac.map(how), how(a), 3)), right: how(a), hint: a.ko + ' = ' + a.id, after: [how(a)] }; };
    th.use = () => {
      const a = th.cur || ac[0], id = a.id; th.busy = 3;
      if (/light/.test(id)) { th.light = 0; G.beep([[440, .05], [220, .1]]); later(12, () => { th.light = 1; }); }
      else if (/water/.test(id)) { th.water = 0; G.beep([[700, .04], [350, .08]]); later(12, () => { th.water = 1; }); }
      else if (/cup/.test(id)) { cup.visible = true; th.water = 0; hop(cup, 0.15, 0.4, 0.93); G.beep([[600, .05], [800, .08]]); later(8, () => { cup.visible = false; th.water = 1; }); }
      else if (/stairs/.test(id)) { for (let i = 0; i < 3; i++) later(i * 0.45, () => { const p0 = th.W(2.0, 0.2 * i + 0.15, 0.55 - i * 0.3), p1 = th.W(2.0, 0.2 * (i + 1) + 0.25, 0.2 - i * 0.3); toss(ball, p0, p1, 0.4, 0.3, i === 2 ? () => later(1.2, () => { ball.visible = false; }) : null); G.beep([[392 + i * 130, .08]]); }); }
      else { const pa = /paper/.test(id), m = pa ? paper : can, to = th.W(pa ? 0.55 : 1.2, 0.8, -0.6); for (let i = 0; i < 3; i++) later(i * 0.55, () => { toss(m, front(0.6, 1.3), to, 0.5, 0.9, () => { G.beep([[300, .04], [200, .05]]); emo('✨', to[0], to[1] + 0.3, to[2], 0.5); if (i === 2) m.visible = false; }); }); }
      cheer(th, null, esc(a.emoji || '🌱') + ' ' + esc(a.ko) + '! 지구가 고마워해요 💚', 2800);
    };
    th.tick = (dt, t) => {
      shadeM.emissiveIntensity += ((th.light ? 0.9 : 0.02) - shadeM.emissiveIntensity) * Math.min(1, dt * 6);
      drops.forEach((d, i) => { d.visible = !!th.water; if (th.water) { const u = (t * 1.4 + i / 3) % 1; d.position.y = 1.1 - u * 0.2; } });
    };
  })();
  if (ac.length >= 3 && sh.length >= 2 && we(sh[0]) && how(ac[0])) (() => {
    const th = mkStation('earth', '🌍', '아픈 지구 돕기', 2.0, { near, solid: 0.8, verb: '돕기' }); if (!th) return; const g = th.g;
    cyl(0.75, 0.9, 0.3, 0x868e96, 0, 0.15, 0, g, 18); cyl(0.2, 0.3, 0.55, 0xadb5bd, 0, 0.55, 0, g, 12); tor(0.95, 0.05, 0xffd43b, 0, 1.7, 0, g, PI).rotation.z = -PI / 2;
    bake(g);
    const gl = dyn(g, 0, 1.7, 0); sph(0.78, 0x4dabf7, 0, 0, 0, gl);
    for (const [a, b, s] of [[0.4, 0.5, 0.36], [1.9, 0.2, 0.3], [2.6, -0.4, 0.24], [4.0, 0.3, 0.34], [5.0, -0.3, 0.28], [0.9, -0.6, 0.2]]) { const x = Math.cos(b) * Math.cos(a), y = Math.sin(b), z = Math.cos(b) * Math.sin(a), m = ell(s, 1, 1, 0.3, 0x51cf66, x * 0.74, y * 0.74, z * 0.74, gl); m.rotation.order = 'YXZ'; m.rotation.y = Math.atan2(x, z); m.rotation.x = -b; }
    bake(gl); gl.rotation.z = 0.3;
    const smog = flatZ(tor(1.0, 0.09, new THREE.MeshStandardMaterial({ color: 0x868e96, transparent: true, opacity: 0.55, roughness: 1 }), 0, 1.75, 0, g)); smog.userData.ns = 1;
    const face = emoSprite('🤒', 0.7); face.position.set(0, 1.7, 0.95); g.add(face);
    addSign(th, 3.4);
    th.ok = 0;
    th.challenge = () => { const a = th.cur = ac[pickI(th, ac.length)], s = sh.find(x => x.id === a.should) || sh[0]; return { tag: '듣고 대답하기', pic: esc(a.emoji || '') + ' ' + esc(a.ko), en: how(a), ko: '그러면 우리는 무엇을 해야 할까요?', say: [how(a)], choices: sh.map(we), right: we(s), hint: s.ko + ' = ' + s.id, after: [we(s)] }; };
    th.use = () => { th.busy = 3; th.ok = 10; emoSet(face, '😊'); tune([523, 659, 784, 1046], 0.15); tw(2, k => { gl.rotation.y += 0.12 * (1 - k); }); for (let i = 0; i < 3; i++) later(i * 0.35, () => { const w = th.W((i - 1) * 0.5, 2.8, 0.3); emo('💚', w[0], w[1], w[2], 0.6); }); cheer(th, null, '🌍 지구가 웃어요! 고마워요', 2600); };
    th.tick = (dt) => { gl.rotation.y += dt * 0.25; if (th.ok > 0) { th.ok -= dt; if (th.ok <= 0) emoSet(face, '🤒'); } smog.visible = th.ok <= 0; smog.rotation.z += dt * 0.4; };
  })();
};
// L6 · 투호 던지기 / 북 치기 (전통문화 설명하기)
THEME[6] = (near) => {
  const cu = (L.cultures || []).filter(c => c && c.id && c.kind), ask = (c) => swap(S4[0] && S4[0].en, 'yakgwa', c.id), its = (c) => swap(S4[2] && S4[2].en, 'cookie', c.kind), yes = S4[1];
  const spec = (c, tag) => ({ tag, pic: esc(c.emoji || '') + ' ' + esc(c.ko), en: ask(c), ko: '무엇인지 영어로 설명해요', say: [ask(c)], choices: [its(c)].concat(others(cu.map(its), its(c), 3)), right: its(c), hint: c.ko + ' = ' + (c.kindKo || c.kind) + ' (' + c.kind + ')', after: yes ? [yes.en, its(c)] : [its(c)] });
  const tuho = cu.find(c => /tuho/i.test(c.id)), buk = cu.find(c => /buk/i.test(c.id));
  if (tuho && cu.length >= 4 && ask(tuho) && its(tuho)) (() => {
    const th = mkStation('tuho', '🏹', '투호 던지기', 2.3, { near, verb: '던지기' }); if (!th) return; const g = th.g;
    cyl(1.9, 1.9, 0.04, 0xc92a2a, 0, 0.03, 0, g, 28); cyl(1.6, 1.6, 0.045, 0xf8f0e3, 0, 0.032, 0, g, 28); box(1.6, 0.05, 0.12, 0x1c7ed6, 0, 0.04, 1.5, g);
    lathe([[0.0, 0.0], [0.2, 0.0], [0.26, 0.08], [0.34, 0.4], [0.3, 0.72], [0.17, 0.92], [0.17, 1.02], [0.23, 1.08]], 0x8d6e63, 0, 0.05, -0.5, g); flatZ(tor(0.335, 0.03, 0xffd43b, 0, 0.47, -0.5, g)); flatZ(tor(0.2, 0.025, 0xffd43b, 0, 1.0, -0.5, g));
    for (const s of [-1, 1]) { cyl(0.07, 0.07, 0.3, 0x8d6e63, s * 0.27, 0.98, -0.5, g, 10); flatZ(tor(0.07, 0.018, 0xffd43b, s * 0.27, 1.13, -0.5, g)); }
    cyl(0.16, 0.2, 0.5, 0x5c4033, 1.2, 0.3, 1.1, g, 10); flatZ(tor(0.165, 0.02, 0xffd43b, 1.2, 0.55, 1.1, g));
    bake(g);
    const arrows = [0, 1, 2].map(i => { const a = new THREE.Group(); a.userData.dyn = 1; cyl(0.016, 0.016, 0.8, [0xe03131, 0x1c7ed6, 0x2f9e44][i], 0, 0, 0, a, 6); cone(0.035, 0.09, 0x495057, 0, -0.44, 0, a, 6).rotation.x = PI; for (const r of [0, PI / 2]) box(0.1, 0.16, 0.008, 0xffffff, 0, 0.34, 0, a).rotation.y = r; bake(a); scene.add(a); th.objs.push(a); return a; });
    const rest = () => arrows.forEach((a, i) => { const w = th.W(1.2 + (i - 1) * 0.07, 0.85, 1.1); a.position.set(w[0], w[1], w[2]); a.rotation.set(0.15 * (i - 1), 0, 0.12 * (i - 1)); a.visible = true; });
    rest(); addSign(th, 2.6);
    th.challenge = () => spec(tuho, '전통 놀이 설명하기');
    th.use = () => {
      th.busy = 5.5;
      arrows.forEach((a, i) => later(0.3 + i * 0.8, () => { const to = th.W((i - 1) * 0.07, 1.25, -0.5 + (i - 1) * 0.04); a.rotation.set(0, 0, 0); toss(a, front(0.5, 1.4), to, 0.75, 1.5, () => { a.rotation.set(0.2 * (i - 1), 0, 0.2 * (1 - i)); G.beep('get'); emo('✨', to[0], to[1] + 0.5, to[2], 0.5); }); tw(0.75, k => { a.rotation.x = -1.2 + k * 2.4; }); }));
      later(3.0, () => { const p = S4[3]; if (p) { try { SPEAK(p.en, 'Teacher'); } catch (e) {} } cheer(th, null, '🏹 쏙쏙쏙! 세 개 다 넣었어요' + (p ? '<br><small>' + esc(p.en) + ' — ' + esc(p.ko) + '</small>' : ''), 3400); });
      later(6.5, rest);
    };
  })();
  if (buk && cu.length >= 4 && ask(buk) && its(buk)) (() => {
    const th = mkStation('buk', '🥁', '북 치기', 2.0, { near, solid: 0.7, verb: '치기' }); if (!th) return; const g = th.g;
    for (const s of [-1, 1]) { cyl(0.07, 0.09, 1.5, 0x8d6e63, s * 0.85, 0.75, -0.3, g, 8); box(0.2, 0.1, 0.9, 0x6d4c41, s * 0.85, 0.05, -0.3, g); sph(0.1, 0xffd43b, s * 0.85, 1.55, -0.3, g); }
    cap(0.05, 1.7, 0x8d6e63, 0, 0.35, -0.3, g).rotation.z = PI / 2;
    flatZ(cyl(0.62, 0.62, 0.55, 0xb5442b, 0, 1.0, -0.3, g, 26)); for (const s of [-1, 1]) tor(0.62, 0.035, 0x5c4033, 0, 1.0, -0.3 + s * 0.27, g);
    for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; sph(0.03, 0xffd43b, Math.cos(a) * 0.63, 1.0 + Math.sin(a) * 0.63, -0.09, g); }
    bake(g);
    const head = dyn(g, 0, 1.0, -0.02); flatZ(cyl(0.58, 0.58, 0.02, 0xfff3bf, 0, 0, 0, head, 26));
    for (const [c, a0] of [[0xe03131, 0], [0x1c7ed6, PI]]) { const m = add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.012, 16, 1, false, a0, PI), matD(c)), 0, 0, 0.014, head); m.rotation.x = PI / 2; }
    const sticks = [-1, 1].map(s => { const k = dyn(g, s * 0.3, 1.25, 0.75); cap(0.022, 0.5, 0xdeb887, 0, 0, -0.2, k).rotation.x = PI / 2; sph(0.045, 0xdeb887, 0, 0, -0.48, k); bake(k); k.rotation.x = -0.5; return k; });
    addSign(th, 2.6);
    const beat = (i) => { G.beep([[i % 2 ? 98 : 131, .22]]); tw(0.22, k => { head.scale.setScalar(1 + Math.sin(k * PI) * 0.07); sticks[i % 2].rotation.x = -0.5 + Math.sin(k * PI) * 0.75; }); const w = th.W(0, 1.0, 0.1); burst(w[0], w[1], w[2], { n: 6, sp: 2, life: 0.35, size: 0.22, cols: [0xfff3bf, 0xffd43b], g: 0 }); };
    th.freeT = 0; th.freeNow = () => th.freeT > ST.t;
    th.label = () => th.busy > 0 ? null : th.freeNow() ? '북 치기 (둥둥!)' : '북 치기';
    th.challenge = () => spec(buk, '전통 악기 설명하기');
    th.use = () => {
      if (th.freeNow()) { beat(th.bn = (th.bn | 0) + 1); return; }
      th.busy = 2.6; [0, 0.4, 0.8, 1.0, 1.2, 1.6, 2.0].forEach((t, i) => later(t, () => beat(i))); th.freeT = ST.t + 25;
      later(2.4, () => cheer(th, null, '🥁 둥 둥 두둥! 한동안 마음껏 칠 수 있어요', 2800));
    };
  })();
};
// L7 · 운동 기구(횟수 대답하기) / 세면대(생활 습관 듣기)
THEME[7] = (near) => {
  const hb = (L.habits || []).filter(h => h && h.id && h.you && h.my), nw = L.numWords || [], good = S4[3];
  const fr = uniq((L.readTalk || []).map(x => x.habit + '|' + x.freq).concat((L.actGame || []).map(x => x.habit + '|' + x.answer))).map(s => { const p = s.split('|'), m = /^(.+?) a (day|week|month)\.$/.exec(p[1] || ''), n = m ? nw.indexOf(m[1]) : -1; return m && n > 0 && hb.find(h => h.id === p[0]) ? { h: hb.find(h => h.id === p[0]), en: p[1], n, ko: { day: '하루', week: '일주일', month: '한 달' }[m[2]] + '에 ' + n + '번' } : null; }).filter(Boolean);
  const often = (h) => swap(S4[0] && S4[0].en, 'exercise', h.you), mine = (x) => 'I ' + x.h.my + ' ' + x.en.charAt(0).toLowerCase() + x.en.slice(1); // I brush my teeth three times a day. (교과서 문형)
  if (fr.length >= 4 && often(hb[0])) (() => {
    const th = mkStation('gym', '🏋️', '튼튼 운동장', 2.3, { near, verb: '운동' }); if (!th) return; const g = th.g;
    cyl(1.9, 1.9, 0.06, 0x4dabf7, 0, 0.03, 0, g, 28); flatZ(tor(1.9, 0.05, 0xffffff, 0, 0.06, 0, g));
    for (const s of [-1, 1]) cyl(0.06, 0.07, 2.4, 0xe03131, s * 1.0, 1.2, -1.2, g, 8); cap(0.045, 2.1, 0xced4da, 0, 2.35, -1.2, g).rotation.z = PI / 2;
    for (const s of [-1, 1]) { cyl(0.012, 0.012, 0.6, 0x495057, s * 0.3, 2.0, -1.2, g, 5); tor(0.11, 0.022, 0xffd43b, s * 0.3, 1.6, -1.2, g); }
    box(1.0, 0.08, 0.4, 0x495057, -1.2, 0.5, 0.2, g); for (const x of [-1.6, -0.8]) for (const z of [0.05, 0.35]) cyl(0.03, 0.03, 0.5, 0x495057, x, 0.25, z, g, 6);
    sph(0.2, 0x212529, 1.3, 0.24, 0.3, g); tor(0.12, 0.03, 0x212529, 1.3, 0.48, 0.3, g); cyl(0.05, 0.05, 0.02, 0xffd43b, 1.3, 0.24, 0.5, g, 10).rotation.x = PI / 2;
    bake(g);
    const db = [-1.4, -1.0].map((x, i) => { const d = dyn(g, x, 0.63, 0.2); flatZ(cyl(0.025, 0.025, 0.34, 0xced4da, 0, 0, 0, d, 8)); for (const s of [-1, 1]) { sph(0.085, i ? 0x1c7ed6 : 0xe8590c, 0, 0, s * 0.19, d); flatZ(cyl(0.065, 0.065, 0.05, 0x343a40, 0, 0, s * 0.12, d, 10)); } bake(d); return d; });
    addSign(th, 3.3);
    th.challenge = () => { const x = th.cur = fr[pickI(th, fr.length)]; return { tag: '횟수 대답하기', pic: esc(x.h.emoji || '') + ' ' + esc(x.h.ko) + ' <small>' + x.ko + '</small>', en: often(x.h), ko: '그림을 보고 얼마나 자주 하는지 대답해요', say: [often(x.h)], choices: [x.en].concat(others(fr.map(y => y.en), x.en, 3)), right: x.en, hint: x.ko + ' = ' + x.en, after: [x.en] }; };
    th.use = () => { const x = th.cur || fr[0], n = x.n; th.busy = n * 0.75 + 1.4;
      for (let i = 0; i < n; i++) later(0.2 + i * 0.75, () => { jumpMe(); G.beep([[392 + i * 50, .06], [587 + i * 60, .08]]); emo(String(i + 1), P.x, 2.7, P.z, 0.7); db.forEach(d => hop(d, 0.3, 0.4, 0.63)); });
      later(0.4 + n * 0.75, () => { if (good) { try { SPEAK(good.en, 'Teacher'); } catch (e) {} } cheer(th, '💪', '💪 ' + n + '번 뛰었어요!' + (good ? '<br><small>' + esc(good.en) + ' — ' + esc(good.ko) + '</small>' : ''), 3000); }); };
  })();
  if (fr.length >= 4) (() => {
    const th = mkStation('wash', '🪥', '반짝 세면대', 2.0, { near, solid: 0.6, verb: '씻기' }); if (!th) return; const g = th.g;
    box(2.4, 2.3, 0.14, 0xe3fafc, 0, 1.25, -0.7, g); box(2.5, 0.12, 0.3, 0x3bc9db, 0, 2.45, -0.66, g);
    box(1.5, 0.75, 0.6, 0xffffff, 0, 0.42, -0.35, g); box(1.6, 0.08, 0.7, 0xdee2e6, 0, 0.83, -0.33, g); lathe([[0.0, 0.0], [0.2, 0.01], [0.33, 0.1], [0.36, 0.16]], 0xffffff, 0, 0.84, -0.3, g);
    cyl(0.035, 0.035, 0.3, 0xadb5bd, 0, 1.0, -0.58, g, 8); const sp = tor(0.12, 0.028, 0xadb5bd, 0, 1.15, -0.46, g, PI); sp.rotation.y = PI / 2; for (const s of [-1, 1]) sph(0.045, s > 0 ? 0xe03131 : 0x339af0, s * 0.2, 0.92, -0.58, g);
    flatZ(cyl(0.5, 0.5, 0.03, 0xa5d8ff, 0, 1.75, -0.62, g, 24)).scale.set(1, 1, 1.25); tor(0.5, 0.04, 0xffd43b, 0, 1.75, -0.6, g).scale.set(1, 1.25, 1);
    ell(0.09, 1.4, 0.6, 1, 0xff8fab, 0.55, 0.91, -0.25, g); cyl(0.07, 0.06, 0.16, 0x74c0fc, -0.55, 0.95, -0.25, g, 10); box(0.5, 0.6, 0.04, 0xffd43b, 1.0, 1.2, -0.6, g);
    bake(g);
    const br = dyn(g, 0, 1.35, 0.25); cap(0.035, 0.6, 0x339af0, 0, 0, 0, br).rotation.z = PI / 2; box(0.2, 0.05, 0.07, 0xffffff, 0.3, 0.03, 0, br); for (let i = 0; i < 4; i++) box(0.035, 0.07, 0.06, 0xe7f5ff, 0.235 + i * 0.045, 0.085, 0, br); bake(br);
    addSign(th, 3.3);
    const lab = (x) => (x.h.emoji || '') + ' ' + x.h.ko + ' · ' + x.ko;
    th.challenge = () => { const x = th.cur = fr[pickI(th, fr.length)]; return { tag: '듣고 고르기', pic: '🪥🧼', ko: '친구의 생활 습관을 잘 듣고 알맞은 그림을 골라요', say: [mine(x)], choices: [lab(x)].concat(others(fr.map(lab), lab(x), 3)), right: lab(x), hint: x.h.ko + ' = ' + x.h.my, after: [mine(x)] }; };
    th.use = () => { const x = th.cur || fr[0], n = x.n; th.busy = n * 0.5 + 1.5;
      for (let i = 0; i < n; i++) later(0.2 + i * 0.5, () => { tw(0.45, k => { br.position.x = Math.sin(k * PI * 2) * 0.25; }); G.beep([[1200, .03], [900, .03], [1200, .03]]); const w = th.W((Math.random() - 0.5) * 0.6, 1.5, 0.2); burst(w[0], w[1], w[2], { n: 8, sp: 1.6, life: 0.9, size: 0.3, cols: [0xffffff, 0xd0ebff], g: -1.5 }); });
      later(0.4 + n * 0.5, () => { if (good) { try { SPEAK(good.en, 'Teacher'); } catch (e) {} } cheer(th, '✨', '🪥 ' + esc(x.h.ko) + ' ' + n + '번! 반짝반짝' + (good ? '<br><small>' + esc(good.en) + ' — ' + esc(good.ko) + '</small>' : ''), 3000); }); };
  })();
};
// L8 · 마음 풍선(이유 말하기) / 로봇 고치기(위로·축하하기)
THEME[8] = (near) => {
  const fe = (L.feelings || []).filter(f => f && f.id), rs = (L.reasons || []).filter(r => r && r.feel && r.en), cm = (L.writeComments || []).filter(c => Array.isArray(c) && c[0]);
  const why = (f) => swap(S4[0] && S4[0].en, 'happy', f), bc = (r) => swap(S4[1] && S4[1].en, 'I won the soccer game', r.en), femo = (id) => (fe.find(f => f.id === id) || {}).emoji || '🙂';
  const FC = { happy: 0xffd43b, sad: 0x4dabf7, upset: 0xff6b6b, worried: 0xb197fc, tired: 0x8ce99a };
  if (fe.length >= 3 && rs.length >= 4 && why('sad') && bc(rs[0])) (() => {
    const th = mkStation('feel', '🎈', '마음 풍선', 2.0, { near, solid: 0.5, verb: '말하기' }); if (!th) return; const g = th.g;
    lathe([[0.0, 0.0], [0.42, 0.0], [0.5, 0.12], [0.46, 0.5], [0.5, 0.56]], 0xdeb887, 0, 0, 0, g); flatZ(tor(0.48, 0.04, 0xe03131, 0, 0.3, 0, g)); sph(0.09, 0xe03131, 0, 0.36, 0.5, g); for (const s of [-1, 1]) ell(0.1, 1, 0.6, 0.4, 0xe03131, s * 0.14, 0.4, 0.5, g);
    bake(g);
    const sg = new THREE.BoxGeometry(0.012, 1, 0.012); sg.translate(0, -0.5, 0);
    const bl = {}; fe.slice(0, 5).forEach((f, i) => { const a = i / Math.min(5, fe.length) * PI * 2, hx = Math.cos(a) * 0.62, hy = 2.0 + (i % 2) * 0.4, hz = Math.sin(a) * 0.4, b = dyn(g, hx, hy, hz); const m = sph(0.36, new THREE.MeshStandardMaterial({ color: FC[f.id] || 0xffc9c9, roughness: 0.35 }), 0, 0, 0, b); m.scale.y = 1.15; cone(0.06, 0.08, FC[f.id] || 0xffc9c9, 0, -0.43, 0, b, 8); const s = tag(new THREE.Mesh(sg, mat(0xdee2e6))); s.position.y = -0.46; s.scale.y = hy - 1.0; s.userData.ns = 1; b.add(s); const e = emoSprite(f.emoji || '🙂', 0.42); e.position.set(0, 0, 0.4); b.add(e); bl[f.id] = { b, e, y: hy, emoji: f.emoji || '🙂' }; });
    addSign(th, 3.6);
    const pos = (id) => id === 'happy';
    th.challenge = () => { const r = th.cur = rs[pickI(th, rs.length)]; return { tag: '이유 말하기', pic: femo(r.feel) + ' ' + esc(r.pic || ''), en: why(r.feel), ko: '그림을 보고 왜 그런지 말해요', say: [why(r.feel)], choices: [bc(r)].concat(others(rs.map(bc), bc(r), 3)), right: bc(r), hint: r.ko || '', after: [bc(r)] }; };
    th.use = () => { const r = th.cur || rs[0], o = bl[r.feel], good = pos(r.feel), say = good ? (cm.find(c => c[2]) || [])[0] : (S4[3] && S4[3].en); th.busy = 3;
      if (o) { tw(2.4, k => { o.b.position.y = o.y + Math.sin(k * PI) * 0.7; }); if (!good) { later(0.8, () => emoSet(o.e, '😄')); later(8, () => emoSet(o.e, o.emoji)); } const w = th.W(o.b.position.x, o.y + 0.9, o.b.position.z); later(0.6, () => burst(w[0], w[1], w[2], { n: 14, sp: 2.6, life: 0.8, size: 0.3, cols: [0xffd43b, 0xffffff, 0xff8fab], g: 2 })); }
      tune(good ? [523, 659, 784, 1046] : [392, 494, 587], 0.16);
      later(0.5, () => { if (say) { try { SPEAK(say, 'Teacher'); } catch (e) {} } });
      cheer(th, null, femo(r.feel) + ' → 😄 마음을 영어로 말했어요' + (say ? '<br><small>' + esc(say) + '</small>' : ''), 3200); };
  })();
  const fc = (L.faces || []).filter(f => f && f.feel && f.because), yes = cm.filter(c => c[2]).map(c => c[0]), no = cm.filter(c => !c[2]).map(c => c[0]);
  if (fc.length >= 3 && yes.length && no.length && why('sad')) (() => {
    const th = mkStation('robot', '🤖', '로봇 고치기', 2.0, { near, solid: 0.6, verb: '고치기' }); if (!th) return; const g = th.g;
    cyl(1.3, 1.4, 0.1, 0x868e96, 0, 0.05, 0, g, 22);
    box(0.5, 0.3, 0.3, 0xe03131, 1.0, 0.25, 0.5, g); cap(0.03, 0.3, 0xadb5bd, 1.0, 0.45, 0.5, g).rotation.z = PI / 2; cap(0.03, 0.4, 0xadb5bd, -1.0, 0.13, 0.7, g).rotation.z = PI / 2; tor(0.07, 0.025, 0xadb5bd, -0.75, 0.13, 0.7, g, PI * 1.5).rotation.x = PI / 2;
    bake(g);
    const rb = dyn(g, 0, 0.1, 0), BL = 0x74c0fc;
    for (const s of [-1, 1]) { cap(0.1, 0.3, 0x495057, s * 0.17, 0.3, 0, rb); ell(0.13, 1, 0.5, 1.4, 0x343a40, s * 0.17, 0.07, 0.05, rb); sph(0.11, 0x495057, s * 0.4, 1.1, 0, rb); }
    box(0.66, 0.66, 0.46, BL, 0, 0.85, 0, rb); flatX(cyl(0.23, 0.23, 0.66, BL, 0, 1.18, 0, rb, 14)); box(0.4, 0.26, 0.03, 0xe7f5ff, 0, 0.9, 0.235, rb); for (let i = 0; i < 3; i++) sph(0.035, [0xe03131, 0xffd43b, 0x51cf66][i], -0.11 + i * 0.11, 0.9, 0.25, rb);
    cyl(0.07, 0.07, 0.1, 0x495057, 0, 1.43, 0, rb, 8); ell(0.3, 1.15, 0.9, 1, 0xa5d8ff, 0, 1.72, 0, rb); ell(0.24, 1.1, 0.5, 0.5, 0x212529, 0, 1.74, 0.2, rb); for (const s of [-1, 1]) cyl(0.05, 0.05, 0.08, 0x495057, s * 0.36, 1.72, 0, rb, 8).rotation.z = PI / 2;
    bake(rb);
    const eyeM = glow(0x51cf66, 0.05), eyes = [-1, 1].map(s => sph(0.05, eyeM, s * 0.11, 1.75, 0.3, rb));
    const arms = [-1, 1].map(s => { const a = dyn(rb, s * 0.4, 1.1, 0); cap(0.075, 0.42, BL, 0, -0.3, 0, a); sph(0.1, 0x495057, 0, -0.6, 0, a); bake(a); return a; });
    const ant = dyn(rb, 0, 1.98, 0); cyl(0.015, 0.015, 0.25, 0x495057, 0, 0.12, 0, ant, 5); sph(0.06, 0xe03131, 0, 0.27, 0, ant); bake(ant);
    const broke = () => { th.n = 0; eyeM.emissiveIntensity = 0.05; eyeM.color.set(0x495057); arms[0].position.set(-0.95, 0.12, 0.35); arms[0].rotation.set(0, 0, 1.5); arms[1].position.set(0.75, 0.12, -0.6); arms[1].rotation.set(0.4, 0, -1.4); ant.position.set(0.5, 0.05, 0.85); ant.rotation.set(0, 0, 1.45); rb.rotation.set(0, 0, 0.06); };
    broke(); addSign(th, 3.0);
    th.label = () => th.busy > 0 ? null : '로봇 고치기 (' + th.n + '/3)';
    th.challenge = () => { const f = th.cur = fc[pickI(th, fc.length)], good = f.feel === 'happy', r = good ? yes[rndI(yes.length)] : no[rndI(no.length)]; return { tag: '듣고 알맞은 말 해 주기', pic: '🤖 ' + femo(f.feel), en: why(f.feel), ko: '친구의 말을 잘 듣고, 알맞은 말을 해 줘요', say: [[why(f.feel), 'Teacher'], [f.because, 'Boy']], choices: [r].concat(shuf(good ? no : yes).slice(0, 2)), right: r, hint: good ? '좋은 일이 생겼대요 🎉' : '속상한 일이 생겼대요. 위로해 줘요', after: [r] }; };
    th.use = () => {
      const n = th.n; th.busy = 1.6; G.beep([[330, .05], [440, .05], [660, .1]]);
      if (n < 2) { const a = arms[n], s = n ? 1 : -1, p0 = a.position.clone(), r0 = a.rotation.z; tw(0.9, k => { a.position.set(p0.x + (s * 0.4 - p0.x) * k, p0.y + (1.1 - p0.y) * k + Math.sin(k * PI) * 0.4, p0.z * (1 - k)); a.rotation.set(a.rotation.x * (1 - k), 0, r0 * (1 - k)); }); }
      else { const p0 = ant.position.clone(); tw(0.9, k => { ant.position.set(p0.x * (1 - k), p0.y + (1.98 - p0.y) * k + Math.sin(k * PI) * 0.4, p0.z * (1 - k)); ant.rotation.z = 1.45 * (1 - k); }, () => { eyeM.color.set(0x51cf66); eyeM.emissiveIntensity = 1; rb.rotation.z = 0; }); }
      th.n = n + 1;
      if (th.n >= 3) { th.busy = 7; later(1.1, () => { tune([523, 659, 784, 659, 784, 1046, 784, 1046], 0.2); tw(4.5, k => { rb.rotation.y = Math.sin(k * 16) * 0.5; arms[0].rotation.z = -1.2 - Math.sin(k * 30) * 0.6; arms[1].rotation.z = 1.2 + Math.sin(k * 30) * 0.6; rb.position.y = 0.1 + Math.abs(Math.sin(k * 20)) * 0.12; }, () => { rb.rotation.y = 0; rb.position.y = 0.1; arms[0].rotation.z = 0; arms[1].rotation.z = 0; }); cheer(th, '🤖', '🤖 로봇을 다 고쳤어요! 로봇이 춤을 춰요', 3200); }); later(16, broke); }
      else cheer(th, null, '🔧 로봇 고치기 ' + th.n + '/3', 1800);
    };
  })();
};

// L9 · 강아지 산책 / 과학 실험 화산 (할 일 말하기)
THEME[9] = (near) => {
  const pl = (L.plans || []).filter(p => p && p.id), tm = (L.times || []).filter(t => t && t.id), bye = S4[3];
  const what = (t) => swap(S4[0] && S4[0].en, 'tomorrow', t.id), going = (p) => swap(S4[1] && S4[1].en, 'walk the dog', p.id);
  const spec = (p, tag) => { const t = tm[rndI(tm.length)]; return { tag, pic: esc(p.emoji || '') + ' ' + esc(p.ko) + ' <small>' + esc(t.ko) + '</small>', en: what(t), ko: '그림을 보고 무엇을 할지 대답해요', say: [what(t)], choices: [going(p)].concat(others(pl.map(going), going(p), 3)), right: going(p), hint: p.ko + ' = ' + p.id, after: bye ? [going(p), [bye.en, 'Teacher']] : [going(p)] }; };
  const dogP = pl.find(p => /dog/.test(p.id)), sciP = pl.find(p => /science/.test(p.id));
  if (dogP && tm.length && pl.length >= 4 && what(tm[0]) && going(dogP)) (() => {
    const th = mkStation('dog', '🐕', '강아지 산책', 2.0, { near, price: 2, solid: 0.7, verb: '산책' }); if (!th) return; const g = th.g;
    box(1.2, 0.9, 1.3, 0xd9480f, -0.5, 0.45, -0.5, g); const rf = cone(1.15, 0.7, 0x5c4033, -0.5, 1.25, -0.5, g, 4); rf.rotation.y = PI / 4; rf.scale.set(1, 1, 1.08);
    flatZ(cyl(0.3, 0.3, 0.04, 0x212529, -0.5, 0.42, 0.15, g, 16)); box(0.6, 0.42, 0.04, 0x212529, -0.5, 0.21, 0.15, g); box(0.5, 0.14, 0.03, 0xfff3bf, -0.5, 0.82, 0.17, g);
    lathe([[0.0, 0.0], [0.16, 0.0], [0.22, 0.1], [0.2, 0.12], [0.14, 0.04]], 0x339af0, 0.65, 0, 0.25, g); ell(0.12, 1, 0.3, 1, 0x8d6e63, 0.65, 0.08, 0.25, g);
    cyl(0.04, 0.04, 0.8, 0x8d6e63, 0.95, 0.4, -0.6, g, 6); tor(0.08, 0.02, 0xe03131, 0.95, 0.72, -0.56, g);
    bake(g);
    const dog = new THREE.Group(); dog.userData.dyn = 1; scene.add(dog); th.objs.push(dog); const DC = 0xf0c27b, DD = 0x8d5a2b;
    flatZ(cap(0.2, 0.42, DC, 0, 0.42, 0, dog)); sph(0.2, DC, 0, 0.66, 0.36, dog); ell(0.11, 0.9, 0.8, 1.3, 0xfff3bf, 0, 0.61, 0.53, dog); sph(0.04, 0x212529, 0, 0.64, 0.66, dog);
    for (const s of [-1, 1]) { ell(0.1, 0.5, 1.2, 0.9, DD, s * 0.17, 0.68, 0.32, dog).rotation.z = s * 0.4; sph(0.028, 0x212529, s * 0.08, 0.72, 0.53, dog); for (const z of [-0.2, 0.22]) cap(0.055, 0.2, DC, s * 0.12, 0.15, z, dog); }
    flatZ(tor(0.17, 0.03, 0xe03131, 0, 0.56, 0.24, dog)).rotation.x = PI / 2 - 0.5; ell(0.1, 1, 0.5, 1.2, DD, 0.05, 0.6, -0.05, dog);
    bake(dog);
    const tail = dyn(dog, 0, 0.5, -0.4); cap(0.04, 0.22, DD, 0, 0.14, -0.04, tail).rotation.x = -0.5; bake(tail);
    const home = th.W(0.4, 0, 0.75), D = th.dg = { x: home[0], z: home[1], h: th.rot, walk: 0 };
    dog.position.set(D.x, 0, D.z); dog.rotation.y = D.h; addSign(th, 2.6);
    th.label = () => D.walk > 0 || th.busy > 0 ? null : '강아지 산책';
    th.challenge = () => spec(dogP, '할 일 말하기');
    th.use = () => { D.walk = 60; G.beep([[660, .06], [880, .06], [660, .06], [880, .1]]); emo('❤️', D.x, 1.4, D.z, 0.6); cheer(th, null, '🐕 멍멍! 강아지가 한동안 따라와요' + (bye ? '<br><small>' + esc(bye.en) + ' — ' + esc(bye.ko) + '</small>' : ''), 3200); };
    th.onHide = (on) => { if (on) D.walk = 0; };
    th.tick = (dt, t) => {
      let tx = home[0], tz = home[1], keep = 0.05, sp = 6;
      if (D.walk > 0) { D.walk -= dt; tx = P.x; tz = P.z; keep = 1.3; sp = 9; if (D.walk <= 0) G.toast('🐕 강아지가 집으로 돌아가요', 1800); if (ST.ride && !roam(ST.ride)) { tx = D.x; tz = D.z; } }
      const dx = tx - D.x, dz = tz - D.z, d = hyp(dx, dz); let mv = 0;
      if (d > keep + 0.05) { mv = Math.min(d - keep, sp * dt); D.x += dx / d * mv; D.z += dz / d * mv; D.h += angDiff(Math.atan2(dx, dz), D.h) * Math.min(1, dt * 8); }
      else if (D.walk <= 0) D.h += angDiff(th.rot, D.h) * Math.min(1, dt * 4);
      dog.position.set(D.x, mv > 0.001 ? Math.abs(Math.sin(t * 14)) * 0.12 : 0, D.z); dog.rotation.y = D.h; tail.rotation.z = Math.sin(t * (D.walk > 0 ? 18 : 5)) * 0.6;
    };
  })();
  if (sciP && tm.length && pl.length >= 4 && going(sciP)) (() => {
    const th = mkStation('volcano', '🌋', '과학 실험 화산', 2.1, { near, solid: 0.9, verb: '실험' }); if (!th) return; const g = th.g;
    cyl(1.35, 1.35, 0.08, 0x2f9e44, 0, 0.74, 0, g, 24); cyl(0.14, 0.2, 0.7, 0x8d6e63, 0, 0.35, 0, g, 10); cyl(0.7, 0.75, 0.06, 0x8d6e63, 0, 0.03, 0, g, 16);
    lathe([[0.95, 0.0], [0.78, 0.2], [0.52, 0.55], [0.34, 0.85], [0.24, 1.02], [0.2, 1.05], [0.14, 0.98]], 0x7b5a3c, 0, 0.78, -0.1, g); flatZ(tor(0.21, 0.04, 0xff6b00, 0, 1.82, -0.1, g));
    for (const [a, l] of [[0.5, 0.5], [2.4, 0.38], [4.3, 0.6]]) { const c = cap(0.05, l, 0xff922b, Math.cos(a) * 0.36, 1.5, -0.1 + Math.sin(a) * 0.36, g); c.rotation.z = Math.cos(a) * 0.5; c.rotation.x = -Math.sin(a) * 0.5; }
    for (let i = 0; i < 3; i++) { cyl(0.05, 0.05, 0.3, [0x74c0fc, 0xff8fab, 0xb2f2bb][i], 0.85 + i * 0.16, 0.95, 0.75, g, 8); sph(0.05, [0x74c0fc, 0xff8fab, 0xb2f2bb][i], 0.85 + i * 0.16, 0.8, 0.75, g); } box(0.6, 0.04, 0.16, 0xdeb887, 1.01, 0.9, 0.75, g);
    lathe([[0.0, 0.0], [0.16, 0.0], [0.18, 0.08], [0.07, 0.24], [0.07, 0.34], [0.09, 0.36]], 0xd0ebff, -0.9, 0.78, 0.7, g); ell(0.15, 1, 0.3, 1, 0x51cf66, -0.9, 0.84, 0.7, g);
    bake(g);
    addSign(th, 3.5);
    th.challenge = () => spec(sciP, '할 일 말하기');
    th.use = () => { th.busy = 4.5; const w = th.W(0, 1.95, -0.1); tune([110, 98, 110, 98], 0.18, 0.16);
      for (let i = 0; i < 4; i++) later(0.7 + i * 0.7, () => { burst(w[0], w[1], w[2], { n: 30, sp: 5.2, life: 1.3, size: 0.45, cols: [0xff6b00, 0xffd43b, 0xe03131], g: 9 }); G.beep([[130, .1], [80, .2]]); if (i % 2) emo('💨', w[0], w[1] + 0.6, w[2], 0.8); });
      cheer(th, null, '🌋 펑! 화산 실험 성공이에요', 2800); };
  })();
};
// L10 · 저울(어느 것이 더 무거울까) / 자동차 경주(어느 것이 더 빠를까)
THEME[10] = (near) => {
  const cards = (L.cards || []).filter(c => c && c.en && c.word), all = cards.map(c => c.en);
  const LOOK = { apple: [0xe03131, 0.2], kiwi: [0x8d6e3f, 0.14], baseball: [0xffffff, 0.13], 'tennis ball': [0xc0eb75, 0.12], orange: [0xff922b, 0.18], lemon: [0xffd43b, 0.13] };
  const facts = uniq(cards.filter(c => c.word === 'heavier').map(c => c.en).concat(L.quiz && L.quiz.answer2 ? [L.quiz.answer2] : [])).map(en => { const m = /^The (.+?) is heavier than the (.+?)\.$/.exec(en); return m ? { en, a: m[1], b: m[2] } : null; }).filter(Boolean);
  const wq = S4.find(s => /heavier/.test(s.en) && /\?$/.test(s.en));
  if (facts.length && all.length >= 4) (() => {
    const th = mkStation('scale', '⚖️', '무게 재기 저울', 2.0, { near, solid: 0.5, verb: '재기' }); if (!th) return; const g = th.g;
    cyl(0.6, 0.7, 0.14, 0x5c4033, 0, 0.07, 0, g, 18); lathe([[0.16, 0.0], [0.09, 0.3], [0.07, 1.3], [0.11, 1.45], [0.06, 1.55]], 0xffd43b, 0, 0.14, 0, g); sph(0.1, 0xf59f00, 0, 1.72, 0, g);
    bake(g);
    const beam = dyn(g, 0, 1.62, 0); cap(0.04, 2.2, 0xf59f00, 0, 0, 0, beam).rotation.z = PI / 2; for (const s of [-1, 1]) sph(0.07, 0xffd43b, s * 1.12, 0, 0, beam); bake(beam);
    const pans = [-1, 1].map(s => { const p = dyn(g, s * 1.12, 1.0, 0); lathe([[0.0, 0.0], [0.3, 0.02], [0.42, 0.1], [0.44, 0.13]], matD(0xffe066), 0, 0, 0, p); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, c = cyl(0.01, 0.01, 0.66, 0x868e96, Math.cos(a) * 0.2, 0.42, Math.sin(a) * 0.2, p, 4); c.rotation.z = Math.cos(a) * 0.33; c.rotation.x = -Math.sin(a) * 0.33; } return p; });
    const it = [-1, 1].map((s, i) => { const m = sph(0.2, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), 0, 0.2, 0, pans[i]); return m; });
    const lab = [-1, 1].map((s, i) => { const e = emoSprite('❔', 0.3); e.position.set(0, 0.75, 0); pans[i].add(e); return e; });
    addSign(th, 3.0);
    th.tilt = 0; th.want = 0;
    const EM = { apple: '🍎', kiwi: '🥝', baseball: '⚾', 'tennis ball': '🎾', orange: '🍊', lemon: '🍋' };
    const setup = (f) => { [f.a, f.b].forEach((nm, i) => { const L0 = LOOK[nm] || [0xadb5bd, 0.16]; it[i].material.color.set(L0[0]); it[i].scale.setScalar(L0[1] / 0.2); it[i].position.y = 0.03 + L0[1]; emoSet(lab[i], EM[nm] || '❔'); }); th.want = 0.26; };
    setup(facts[0]); th.want = 0;
    th.challenge = () => { const f = th.cur = facts[pickI(th, facts.length)]; setup(f); G.beep([[300, .05], [240, .08]]); return { tag: '비교해서 말하기', pic: (EM[f.a] || '') + ' ⚖️ ' + (EM[f.b] || ''), en: wq ? wq.en : '', ko: '저울이 어느 쪽으로 기울었는지 보고 말해요', say: wq ? [wq.en] : null, choices: [f.en].concat(others(all, f.en, 3)), right: f.en, hint: '기운 쪽이 더 무거워요 (heavier)', after: [f.en] }; };
    th.use = () => { th.busy = 2.5; tune([523, 784, 1046], 0.14); const w = th.W(-1.12, 1.6, 0); burst(w[0], w[1], w[2], { n: 14, sp: 2.4, life: 0.8, size: 0.3, cols: [0xffd43b, 0xffffff], g: 2 }); later(7, () => { th.want = 0; }); cheer(th, null, '⚖️ 딩동! 무게를 영어로 비교했어요', 2600); };
    th.tick = (dt) => { th.tilt += (th.want - th.tilt) * Math.min(1, dt * 2.5); beam.rotation.z = th.tilt; pans.forEach((p, i) => { const s = i ? 1 : -1; p.position.set(s * 1.12 * Math.cos(th.tilt), 1.62 + s * 1.12 * Math.sin(th.tilt) - 0.9, 0); }); };
  })();
  const race = cards.map(c => { const m = /^The (\w+) car is faster than the (\w+) car\.$/.exec(c.en); return m ? { en: c.en, a: m[1], b: m[2] } : null; }).filter(Boolean)[0];
  const CC = { red: 0xe03131, blue: 0x1c7ed6, green: 0x2f9e44, yellow: 0xffd43b, black: 0x343a40, white: 0xf8f9fa };
  if (race && all.length >= 4) (() => {
    const th = mkStation('race', '🏎️', '자동차 경주', 3.4, { near, verb: '출발' }); if (!th) return; const g = th.g;
    box(6.4, 0.05, 1.7, 0x495057, 0, 0.035, 0, g); box(6.4, 0.052, 0.06, 0xffffff, 0, 0.04, 0, g); for (const z of [-0.85, 0.85]) for (let i = 0; i < 8; i++) box(0.8, 0.07, 0.08, i % 2 ? 0xffffff : 0xe03131, -2.8 + i * 0.8, 0.05, z, g);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) box(0.2, 0.054, 0.2, (i + j) % 2 ? 0xffffff : 0x212529, 2.5 + j * 0.2, 0.042, -0.7 + i * 0.2, g);
    for (const z of [-1.0, 1.0]) cyl(0.05, 0.06, 2.0, 0xced4da, 2.6, 1.0, z, g, 8); for (let i = 0; i < 10; i++) box(0.06, 0.26, 0.2, i % 2 ? 0xffffff : 0x212529, 2.6, 1.9, -0.9 + i * 0.2, g);
    cyl(0.05, 0.06, 1.4, 0x495057, -3.0, 0.7, -1.05, g, 8); box(0.2, 0.5, 0.2, 0x343a40, -3.0, 1.5, -1.05, g); for (let i = 0; i < 3; i++) sph(0.07, [0xe03131, 0xffd43b, 0x40c057][i], -3.0, 1.65 - i * 0.15, -0.94, g);
    bake(g);
    const mkCar = (c, z) => { const car = dyn(g, -2.6, 0.06, z); box(0.8, 0.14, 0.38, c, 0, 0.16, 0, car); ell(0.2, 1.35, 0.7, 0.85, c, -0.04, 0.26, 0, car); ell(0.15, 1.2, 0.75, 0.9, 0x212529, -0.02, 0.33, 0, car); flatX(cap(0.07, 0.3, c, 0.33, 0.17, 0, car)); box(0.06, 0.12, 0.42, 0x212529, -0.42, 0.3, 0, car);
      for (const x of [-0.26, 0.26]) for (const s of [-1, 1]) flatZ(cyl(0.1, 0.1, 0.07, 0x212529, x, 0.1, s * 0.2, car, 12)); bake(car); return car; };
    const cars = [mkCar(CC[race.a] || 0xe03131, -0.42), mkCar(CC[race.b] || 0x1c7ed6, 0.42)];
    addSign(th, 3.2);
    th.rt = -1;
    th.challenge = () => { th.rt = 0; tune([440, 440, 880], 0.3, 0.14); return { tag: '비교해서 말하기', pic: '🏎️💨', ko: '경주를 보고, 어느 자동차가 더 빠른지 말해요', choices: [race.en].concat(others(all, race.en, 3)), right: race.en, hint: '먼저 들어온 자동차가 더 빨라요 (faster)', after: [race.en] }; };
    th.use = () => { th.busy = 3; th.rt = 0; const w = th.W(2.6, 1.2, -0.42); later(1.7, () => { burst(w[0], w[1], w[2], { n: 20, sp: 3, life: 1, size: 0.35, cols: [0xffd43b, 0xffffff, CC[race.a] || 0xe03131], g: 3 }); G.beep('combo'); }); later(6, () => { th.rt = -1; }); cheer(th, null, '🏁 ' + esc(race.en), 3000); };
    th.tick = (dt, t) => { if (th.rt >= 0) th.rt += dt; const k = th.rt < 0 ? 0 : Math.min(1, Math.max(0, th.rt - 0.6) / 1.5), e = k * k * (3 - 2 * k); cars[0].position.x = -2.6 + e * 5.2; cars[1].position.x = -2.6 + e * 3.7; cars.forEach((c, i) => { c.position.y = 0.06 + (k > 0 && k < 1 ? Math.abs(Math.sin(t * 30 + i)) * 0.012 : 0); }); if (th.rt > 14) th.rt = -1; };
  })();
};
// L11 · 버스 타고 가기(길 묻고 답하기) / 선물 찾기(위치 말하기)
function busPark(th, at) { const s = th.stops[at]; th.at = at; th.x = th.ux = s[0]; th.z = th.uz = s[1]; th.bus.position.set(s[0], 0, s[1]); th.bus.rotation.set(0, s[2], 0); th.fp[0].x = s[0]; th.fp[0].z = s[1]; if (th.sign) th.sign.position.set(s[0], th.signY, s[1]); }
function busStep(r, dt) {
  const th = r.th, pts = r.pts; r.v = Math.min(8.5, r.v + 5 * dt); r.s = Math.min(r.len, r.s + r.v * dt);
  let i = 1; while (i < pts.length - 1 && pts[i][2] < r.s) i++;
  const a = pts[i - 1], b = pts[i], f = b[2] > a[2] ? (r.s - a[2]) / (b[2] - a[2]) : 1, x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
  r.h += angDiff(Math.atan2(b[0] - a[0], b[1] - a[1]), r.h) * Math.min(1, dt * 5);
  P.x = x; P.z = z; if (!CAM.iso) P.yaw += angDiff(r.h + PI, P.yaw) * Math.min(1, dt * 2.2);
  th.bus.position.set(x, Math.abs(Math.sin(r.s * 1.5)) * 0.02, z); th.bus.rotation.y = r.h; for (const w of th.wheels) w.rotation.x += r.v * dt * 2.6;
  if (r.s >= r.len) { ST.ride = null; unseat(); busPark(th, r.to); const s = th.stops[r.to]; P.x = s[0] + Math.cos(s[2]) * 1.6; P.z = s[1] - Math.sin(s[2]) * 1.6; G.collide(); G.beep('ok'); G.toast('🚌 도착했어요! 내릴게요', 2000); fire('leave', { kind: 'bus' }); }
}
THEME[11] = (near) => {
  const ld = (L.listenDo || []).filter(d => d && d.q && d.a && d.q[1] && d.a[1]), sw = L.stopWords || {};
  if (ld.length >= 3 && G.navFind) (() => {
    const th = mkStation('bus', '🚌', '버스 타기', 2.4, { near, price: 3, solid: 1.3, verb: '타기' }); if (!th) return; const g = th.g;
    const spB = spot(2.2, { far: [th.x, th.z] });
    // 정류장 (A): 지붕 있는 쉼터
    const stopModel = (gg, shelter) => { cyl(0.05, 0.06, 2.5, 0x495057, -1.75, 1.25, -0.2, gg, 8); flatZ(cyl(0.34, 0.34, 0.06, 0x1c7ed6, -1.75, 2.55, -0.2, gg, 20)); flatZ(tor(0.34, 0.03, 0xffffff, -1.75, 2.55, -0.2, gg)); cyl(0.28, 0.3, 0.06, 0x868e96, -1.75, 0.03, -0.2, gg, 12);
      if (shelter) { for (const z of [-1.1, 0.7]) cyl(0.05, 0.05, 2.2, 0xadb5bd, -2.35, 1.1, z, gg, 8); flatZ(cyl(0.75, 0.75, 2.3, 0x74c0fc, -2.1, 1.75, -0.2, gg, 16)).scale.set(1, 1, 0.45); box(0.4, 0.07, 1.4, 0xa1887f, -2.25, 0.5, -0.2, gg); for (const z of [-0.8, 0.4]) box(0.3, 0.5, 0.07, 0x6d4c41, -2.25, 0.25, z, gg); }
      box(2.0, 0.03, 3.6, 0xdee2e6, 0, 0.02, 0, gg); for (const z of [-1.7, 1.7]) box(2.0, 0.035, 0.1, 0xffd43b, 0, 0.022, z, gg); };
    stopModel(g, true); bake(g);
    const sgA = emoSprite('🚏', 0.42); sgA.position.set(-1.75, 2.55, -0.1); g.add(sgA);
    let rotB = 0;
    if (spB) { rotB = Math.atan2(-spB.x, 6 - spB.z); const gB = grp(spB.x, spB.z, rotB); stopModel(gB, false); bake(gB); const s2 = emoSprite('🚏', 0.42); s2.position.set(-1.75, 2.55, -0.1); gB.add(s2); th.objs.push(gB); th.fp.push({ x: spB.x, z: spB.z, r: 1.8 }); }
    // 버스 (지붕이 열린 꼬마 버스, 앞이 +z)
    const bus = new THREE.Group(); bus.userData.dyn = 1; scene.add(bus); th.objs.push(bus); th.bus = bus; const BY = 0xffd43b;
    box(1.6, 0.85, 3.5, BY, 0, 0.82, 0, bus); flatX(cyl(0.42, 0.42, 1.6, BY, 0, 0.82, 1.75, bus, 14)); flatX(cyl(0.42, 0.42, 1.6, BY, 0, 0.82, -1.75, bus, 14)); box(1.64, 0.14, 3.6, 0x343a40, 0, 0.42, 0, bus); box(1.62, 0.1, 4.2, 0xffffff, 0, 1.0, 0, bus);
    for (const s of [-1, 1]) { cap(0.045, 3.6, 0xe03131, s * 0.8, 1.3, 0, bus).rotation.x = PI / 2; for (let i = 0; i < 4; i++) { box(0.03, 0.34, 0.6, 0xa5d8ff, s * 0.815, 0.98, -1.2 + i * 0.8, bus); cyl(0.03, 0.03, 0.16, 0xe03131, s * 0.8, 1.25, -1.5 + i * 1.0, bus, 6); } sph(0.1, 0xfff3bf, s * 0.5, 0.75, 2.14, bus); sph(0.07, 0xe03131, s * 0.55, 0.75, -2.14, bus); }
    cap(0.045, 1.5, 0xe03131, 0, 1.3, 1.85, bus).rotation.z = PI / 2; cap(0.045, 1.5, 0xe03131, 0, 1.3, -1.85, bus).rotation.z = PI / 2; box(0.9, 0.3, 0.05, 0xa5d8ff, 0, 1.0, 2.16, bus); box(1.1, 0.12, 0.06, 0x343a40, 0, 0.5, 2.2, bus);
    for (const z of [-0.9, 0.6]) box(1.2, 0.1, 0.45, 0x1c7ed6, 0, 1.08, z, bus);
    bake(bus);
    th.wheels = []; for (const z of [-1.15, 1.2]) for (const s of [-1, 1]) { const w = dyn(bus, s * 0.82, 0.36, z); flatX(cyl(0.36, 0.36, 0.22, 0x212529, 0, 0, 0, w, 16)); flatX(cyl(0.16, 0.16, 0.24, 0xdee2e6, 0, 0, 0, w, 6)); bake(w); th.wheels.push(w); }
    th.seat = dyn(bus, 0, 0.45, 0.15);
    th.stops = [[th.x, th.z, th.rot]]; if (spB) th.stops.push([spB.x, spB.z, rotB]);
    th.at = 0; addSign(th, 3.3); busPark(th, 0);
    th.solid = () => ST.ride && ST.ride.th === th ? null : [th.x, th.z];
    const route = (from, to) => { try { if (!G.NAV.grid) G.navGrid(); const a = th.stops[from], b = th.stops[to]; let p = G.navFind(a[0], a[1], b[0], b[1]); if (!p || p.length < 2) { p = G.navFind(b[0], b[1], a[0], a[1]); if (p) p = p.slice().reverse(); } /* 길 찾기가 한쪽에서 포기하면 반대쪽에서 찾아 뒤집어요 */ if (!p || p.length < 2) return null; let len = 0; const pts = p.map((q, i) => { if (i) len += hyp(q[0] - p[i - 1][0], q[1] - p[i - 1][1]); return [q[0], q[1], len]; }); return len > 6 ? { pts, len } : null; } catch (e) { return null; } };
    th.label = () => th.busy > 0 || th.stops.length < 2 ? null : '버스 타기 🚌';
    th.canUse = () => { th.rt = route(th.at, 1 - th.at); if (!th.rt) G.toast('🚌 지금은 버스 길이 막혔어요. 조금 뒤에 다시 와요', 2200); return !!th.rt; };
    th.challenge = () => { const d = th.cur = ld[pickI(th, ld.length)], num = (/(?:Number|Line) (\d+)/.exec(d.a[1]) || [])[1] || '', st = sw[d.stop] || []; return { tag: '길 묻고 답하기', pic: (d.kind === 'subway' ? '🚇' : '🚌') + ' ' + esc(num) + ' → ' + esc((st[1] || '') + ' ' + (st[2] || '')), en: d.q[1], ko: '그림을 보고 가는 방법을 알려 줘요', say: [[d.q[1], d.q[0]]], choices: [d.a[1]].concat(others(ld.map(x => x.a[1]), d.a[1], 3)), right: d.a[1], hint: (st[2] || '') + ' = ' + (st[0] || ''), after: [d.a[1]] }; };
    th.use = () => { const rt = th.rt || route(th.at, 1 - th.at); if (!rt) return; if (ST.ride) leave(true); blink(); ST.ride = { kind: 'bus', th, pts: rt.pts, len: rt.len, s: 0, v: 0, h: bus.rotation.y, to: 1 - th.at }; P.jy = 0; P.vy = 0; tune([523, 659], 0.18); tell('bus', '🚌 출발! 다음 정류장까지 가요<br><small>' + eKey() + ' 를 누르면 바로 내려요</small>', 3000); fire('ride', { kind: 'bus' }); };
  })();
  const pr = (L.preps || []).filter(p => p && p.id), AFT = { 'in front of': S4[2], behind: S4[3] };
  if (pr.length >= 3) (() => {
    const th = mkStation('where', '🎁', '선물 찾기', 2.0, { near, verb: '찾기' }); if (!th) return; const g = th.g;
    cyl(1.9, 1.9, 0.05, 0xb2f2bb, 0, 0.03, 0, g, 26);
    const house = (x, c, r) => { box(0.9, 0.75, 0.8, c, x, 0.43, 0, g); const rf = cone(0.78, 0.5, r, x, 1.05, 0, g, 4); rf.rotation.y = PI / 4; box(0.22, 0.4, 0.03, 0x5c4033, x, 0.26, 0.41, g); for (const s of [-1, 1]) box(0.16, 0.16, 0.03, 0xa5d8ff, x + s * 0.28, 0.55, 0.41, g); };
    house(-0.85, 0xfff3bf, 0x1c7ed6); house(0.85, 0xf8f0e3, 0xc92a2a); for (let i = 0; i < 4; i++) cyl(0.035, 0.035, 0.5, 0xffffff, 0.55 + i * 0.2, 0.3, 0.44, g, 6);
    bake(g);
    for (const [x, e] of [[-0.85, '🏦'], [0.85, '🏛️']]) { const s = emoSprite(e, 0.4); s.position.set(x, 1.6, 0); g.add(s); }
    const gift = dyn(g, 0, 0.06, 0); box(0.36, 0.3, 0.36, 0xe03131, 0, 0.15, 0, gift); box(0.38, 0.31, 0.08, 0xffd43b, 0, 0.15, 0, gift); box(0.08, 0.31, 0.38, 0xffd43b, 0, 0.15, 0, gift); bake(gift);
    const lid = dyn(gift, 0, 0.3, 0); box(0.42, 0.08, 0.42, 0xc92a2a, 0, 0.04, 0, lid); for (const s of [-1, 1]) ell(0.08, 1.2, 0.7, 0.6, 0xffd43b, s * 0.08, 0.13, 0, lid); bake(lid);
    const POS = { 'in front of': [-0.85, 0.85], behind: [0.85, -0.85], between: [0, 0] };
    addSign(th, 2.6);
    th.challenge = () => { const p = th.cur = pr[pickI(th, pr.length)], q = POS[p.id] || [0, 0]; gift.position.x = q[0]; gift.position.z = q[1]; G.beep([[700, .04], [900, .05]]); const a = AFT[p.id]; return { tag: '위치 말하기', pic: '🎁 <small>🏦 은행 · 🏛️ 박물관</small>', ko: '선물이 어디에 있는지 보고 골라요', choices: pr.map(x => x.id), keep: true, right: p.id, hint: p.ko + ' = ' + p.id, after: a && a.en.indexOf(p.id) >= 0 ? [a.en] : null, afterKo: a && a.en.indexOf(p.id) >= 0 ? a.en : null }; };
    th.use = () => { th.busy = 3; const w = th.W(gift.position.x, 0.8, gift.position.z); tw(0.6, k => { lid.position.y = 0.3 + Math.sin(k * PI / 2) * 0.7; lid.rotation.z = k * 1.2; }); later(0.3, () => { burst(w[0], w[1], w[2], { n: 24, sp: 3.4, life: 1.1, size: 0.34, cols: [0xffd43b, 0xff8fab, 0x4dabf7, 0xffffff], g: 5 }); G.beep('combo'); emo('🎁', w[0], w[1] + 0.6, w[2], 0.8); }); later(4, () => { lid.position.y = 0.3; lid.rotation.z = 0; }); cheer(th, null, '🎁 찾았다! 위치를 영어로 말했어요', 2600); };
    th.tick = (dt, t) => { gift.position.y = 0.06 + Math.abs(Math.sin(t * 2.4)) * (th.cur && th.cur.id === 'behind' ? 0.9 : 0.12); };
  })();
};
// L12 · 깡통 맞히기(의견 말하기) / 회전목마(맞장구·반대하기)
THEME[12] = (near) => {
  const wd = (L.words || []).filter(w => w && w.id), th1 = (w) => swap(S4[1] && S4[1].en, 'fun', w), wq = S4[0], pics = (L.readTalk || []).filter(x => x && x.pic && x.word && wd.some(w => w.id === x.word));
  const wko = (id) => (wd.find(w => w.id === id) || {}).ko || '';
  if (pics.length >= 4 && wq && th1('easy')) (() => {
    const th = mkStation('cans', '🥫', '깡통 맞히기', 2.3, { near, solid: 0.9, verb: '던지기' }); if (!th) return; const g = th.g;
    box(2.6, 0.9, 0.7, 0xff8787, 0, 0.45, -0.6, g); box(2.7, 0.08, 0.8, 0xfff5f5, 0, 0.94, -0.6, g); for (let i = 0; i < 6; i++) box(0.22, 0.86, 0.02, 0xffffff, -1.1 + i * 0.44, 0.45, -0.24, g);
    for (const s of [-1, 1]) cyl(0.06, 0.06, 2.6, 0xffffff, s * 1.3, 1.3, -0.95, g, 8); box(2.7, 1.3, 0.06, 0x1c7ed6, 0, 1.9, -1.0, g);
    for (let i = 0; i < 7; i++) { const a = box(0.39, 0.05, 0.9, i % 2 ? 0xffffff : 0xe03131, -1.17 + i * 0.39, 2.62, -0.55, g); a.rotation.x = 0.3; sph(0.07, i % 2 ? 0xffffff : 0xe03131, -1.17 + i * 0.39, 2.45, -0.12, g); }
    for (let i = 0; i < 4; i++) sph(0.09, [0xffd43b, 0x51cf66, 0xff922b, 0xda77f2][i], -1.0 + i * 0.14, 1.07, -0.35, g);
    bake(g);
    const CP = [[-0.22, 0], [0, 0], [0.22, 0], [-0.11, 1], [0.11, 1], [0, 2]], cans = CP.map((p, i) => { const c = dyn(g, 0.45 + p[0], 1.09 + p[1] * 0.23, -0.6); cyl(0.095, 0.095, 0.21, i % 2 ? 0xe03131 : 0xadb5bd, 0, 0, 0, c, 12); flatZ(tor(0.095, 0.012, 0xf8f9fa, 0, 0.09, 0, c)); flatZ(tor(0.095, 0.012, 0xf8f9fa, 0, -0.09, 0, c)); bake(c); return c; });
    const ball = sph(0.09, 0xffd43b, 0, 0, 0, scene); ball.visible = false; th.objs.push(ball);
    const reset = () => cans.forEach((c, i) => { c.position.set(0.45 + CP[i][0], 1.09 + CP[i][1] * 0.23, -0.6); c.rotation.set(0, 0, 0); });
    addSign(th, 3.5);
    th.challenge = () => { const x = th.cur = pics[pickI(th, pics.length)]; return { tag: '의견 말하기', pic: esc(x.pic), en: wq.en, ko: '그림을 보고 내 생각을 말해요', say: [wq.en], choices: [th1(x.word)].concat(others(wd.map(w => th1(w.id)), th1(x.word), 3)), right: th1(x.word), hint: wko(x.word) + ' = ' + x.word, after: [th1(x.word)] }; };
    th.use = () => { th.busy = 5; const to = th.W(0.45, 1.3, -0.6);
      later(0.2, () => toss(ball, front(0.5, 1.4), th.W(1.0, 1.7, -0.9), 0.5, 0.5, () => G.beep([[200, .04]])));
      later(1.1, () => toss(ball, front(0.5, 1.4), to, 0.5, 0.5, () => { ball.visible = false; G.beep([[900, .04], [500, .05], [300, .08]]); cans.forEach((c, i) => { const p0 = c.position.clone(), vx = (CP[i][0] + (i % 2 ? 0.25 : -0.2)) * 2.4, vz = -0.3 - (i % 3) * 0.2, s = i % 2 ? 1 : -1; tw(0.8, k => { c.position.set(p0.x + vx * k, Math.max(0.12, p0.y + 1.2 * k - 3.0 * k * k), p0.z + vz * k * 0.4); c.rotation.z = s * k * 5; }); }); burst(to[0], to[1], to[2], { n: 14, sp: 2.6, life: 0.7, size: 0.3, cols: [0xffffff, 0xffd43b], g: 4 }); cheer(th, null, '🥫 와르르! 깡통을 다 쓰러뜨렸어요', 2800); }));
      later(5, reset); };
  })();
  const yes = S4[2], no = S4[3];
  if (pics.length >= 3 && wd.length >= 4 && yes && no && th1('easy')) (() => {
    const th = mkStation('carousel', '🎠', '회전목마', 2.7, { near, price: 3, solid: 0, verb: '타기' }); if (!th) return; const g = th.g;
    cyl(2.35, 2.45, 0.22, 0xffc9c9, 0, 0.11, 0, g, 30); for (let i = 0; i < 12; i++) sph(0.07, i % 2 ? 0xffd43b : 0xffffff, Math.cos(i / 12 * PI * 2) * 2.4, 0.24, Math.sin(i / 12 * PI * 2) * 2.4, g);
    bake(g);
    const rot = dyn(g, 0, 0.22, 0);
    cyl(2.25, 2.25, 0.06, 0xfff0f6, 0, 0.03, 0, rot, 30); cyl(0.3, 0.34, 2.9, 0xffe066, 0, 1.45, 0, rot, 14); for (let i = 0; i < 4; i++) flatZ(tor(0.33, 0.04, 0xe03131, 0, 0.5 + i * 0.6, 0, rot));
    cone(2.6, 1.0, 0xff8fab, 0, 3.4, 0, rot, 16); cyl(2.6, 2.6, 0.14, 0xffffff, 0, 2.86, 0, rot, 30); sph(0.16, 0xffd43b, 0, 3.98, 0, rot);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; sph(0.11, [0xffd43b, 0x4dabf7, 0xffffff, 0x51cf66][i % 4], Math.cos(a) * 2.55, 2.76, Math.sin(a) * 2.55, rot); }
    const HC = [0xffffff, 0xffe8cc, 0xd0ebff, 0xfcc2d7], SC = [0xe03131, 0x1c7ed6, 0x2f9e44, 0x7048e8];
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2, h = new THREE.Group(); h.position.set(Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55); h.rotation.y = -a; rot.add(h); const y = 1.0 + (i % 2) * 0.22; // 말은 돌아가는 쪽(+z)을 봐요
      cyl(0.03, 0.03, 2.8, 0xffd43b, 0, 1.43, 0, h, 6); flatZ(cap(0.2, 0.5, HC[i], 0, y, 0, h)); const nk = cap(0.11, 0.3, HC[i], 0, y + 0.3, 0.36, h); nk.rotation.x = 0.6; ell(0.14, 0.85, 0.9, 1.5, HC[i], 0, y + 0.52, 0.52, h); for (const s of [-1, 1]) { cone(0.04, 0.1, HC[i], s * 0.07, y + 0.68, 0.44, h, 6); sph(0.025, 0x212529, s * 0.1, y + 0.56, 0.6, h); for (const z of [-0.26, 0.26]) { const l = cap(0.05, 0.3, HC[i], s * 0.12, y - 0.33, z, h); l.rotation.x = z > 0 ? -0.4 : 0.4; } }
      ell(0.2, 1.05, 0.4, 1.1, SC[i], 0, y + 0.19, -0.02, h); const tl = cap(0.045, 0.25, SC[i], 0, y - 0.02, -0.5, h); tl.rotation.x = -0.7; box(0.03, 0.2, 0.3, SC[i], 0, y + 0.52, 0.3, h).rotation.x = 0.6; }
    bake(rot);
    th.seat = dyn(rot, 1.55, 0, 0); th.seatY = 1.0 + 0.19 - 0.6; th.rg = rot; th.sp = 0;
    addSign(th, 4.9);
    th.label = () => th.busy > 0 ? null : '회전목마 타기 🎠';
    th.challenge = () => { const x = th.cur = pics[pickI(th, pics.length)], agree = Math.random() < 0.5, w2 = agree ? x.word : (wd.find(w => w.id === x.word) || {}).opp || shuf(wd.filter(w => w.id !== x.word))[0].id, r = agree ? yes.en : no.en; return { tag: '친구 말에 대답하기', pic: esc(x.pic), en: th1(w2) + ' ' + wq.en, ko: '그림을 보고, 친구와 생각이 같은지 대답해요', say: [[th1(w2), 'Girl'], [wq.en, 'Girl']], choices: [yes.en, no.en], keep: true, right: r, hint: '그림은 "' + wko(x.word) + '" 쪽이에요', after: agree ? [r] : [r, th1(x.word)] }; };
    th.use = () => { if (ST.ride) leave(true); ST.ride = { kind: 'carousel', th, t: 0 }; P.jy = 0; P.vy = 0; th.busy = 1; tune([523, 659, 784, 1046, 784, 659, 523, 659, 784, 1046, 1318, 1046], 0.32, 0.26); tell('carousel', '🎠 빙글빙글~ 회전목마가 돌아요<br><small>' + eKey() + ' 를 누르면 내려요</small>', 3000); fire('ride', { kind: 'carousel' }); };
    th.tick = (dt) => { const on = ST.ride && ST.ride.th === th; if (on) { ST.ride.t += dt; if (ST.ride.t > 20) { G.toast('🎠 한 바퀴 끝! 재미있었나요?', 2000); leave(true); } } th.sp += ((on ? 0.75 : 0) - th.sp) * Math.min(1, dt * 0.9); rot.rotation.y -= th.sp * dt; }; // 말이 보는 쪽으로 돌아요
  })();
};

// ---------------- 🚲 자전거 (킥보드보다 조금 더 빨라요. 페달·바퀴가 돌아요) ----------------
function buildBike(sp, rot) {
  const th = thing('bike', '🚲', sp.x, sp.z, { verb: '타기', useR: 2.0, fp: [{ x: sp.x, z: sp.z, r: 1.1 }] });
  const g = new THREE.Group(); scene.add(g); th.g = g; th.objs.push(g);
  const C = pick([0xe03131, 0x1c7ed6, 0x2f9e44, 0xf08c00]), R = 0.34, ZF = 0.54, ZB = -0.52;
  const tube = (x1, y1, z1, x2, y2, z2, r, c) => { const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, len = hyp(dx, dy, dz), m = cyl(r, r, len, c, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, g, 8); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len)); return m; };
  // 프레임 (마름모꼴): 안장 기둥 · 윗대 · 아랫대 · 뒷바퀴 받침 · 앞 포크
  const BB = [0, 0.34, -0.06], ST0 = [0, 0.88, -0.24], HD = [0, 0.92, 0.36], HB = [0, 0.74, 0.4];
  tube(BB[0], BB[1], BB[2], ST0[0], ST0[1], ST0[2], 0.028, C); tube(ST0[0], ST0[1] - 0.06, ST0[2] + 0.02, HD[0], HD[1], HD[2], 0.028, C); tube(BB[0], BB[1], BB[2], HB[0], HB[1], HB[2], 0.03, C);
  for (const s of [-1, 1]) { tube(s * 0.04, BB[1], BB[2], s * 0.05, R, ZB, 0.018, C); tube(s * 0.04, ST0[1] - 0.08, ST0[2], s * 0.05, R, ZB, 0.016, C); tube(s * 0.05, HB[1], HB[2], s * 0.05, R, ZF, 0.02, 0xced4da); }
  tube(HB[0], HB[1], HB[2], 0, 1.06, 0.33, 0.026, 0xced4da); tube(0, ST0[1], ST0[2], 0, 0.99, -0.27, 0.02, 0xced4da);
  // 핸들 · 손잡이 · 종 · 안장 · 짐받이 · 흙받이
  flatX(cyl(0.02, 0.02, 0.56, 0xced4da, 0, 1.07, 0.33, g, 8)); for (const s of [-1, 1]) flatX(cap(0.028, 0.1, 0x212529, s * 0.27, 1.07, 0.33, g)); sph(0.04, 0xffd43b, 0.1, 1.1, 0.33, g);
  ell(0.13, 0.75, 0.42, 1.5, 0x343a40, 0, 1.01, -0.27, g); ell(0.09, 0.7, 0.4, 0.8, 0x343a40, 0, 1.0, -0.12, g);
  box(0.2, 0.02, 0.36, 0xadb5bd, 0, 0.74, -0.56, g); for (const s of [-1, 1]) tube(s * 0.08, 0.74, -0.7, s * 0.05, R, ZB, 0.01, 0xadb5bd);
  for (const z of [ZF, ZB]) { const f = tor(R + 0.045, 0.012, C, 0, R, z, g, PI * 0.6); f.rotation.y = PI / 2; f.rotation.x = z > 0 ? -0.4 : 0.9; }
  flatX(cyl(0.085, 0.085, 0.012, 0xced4da, 0.05, BB[1], BB[2], g, 14)); sph(0.05, 0xfff3bf, 0, 0.95, 0.44, g); tube(-0.06, BB[1] - 0.02, BB[2] - 0.1, -0.2, 0.03, -0.2, 0.012, 0xadb5bd);
  bake(g);
  // 바퀴: 타이어 · 테 · 바퀴살 · 축 (돌아가요)
  const wheel = (z) => { const w = dyn(g, 0, R, z); const t1 = tor(R - 0.03, 0.036, 0x212529, 0, 0, 0, w); t1.rotation.y = PI / 2; const t2 = tor(R - 0.075, 0.012, 0xdee2e6, 0, 0, 0, w); t2.rotation.y = PI / 2; for (let i = 0; i < 5; i++) { const s = cyl(0.006, 0.006, (R - 0.08) * 2, 0xe9ecef, 0, 0, 0, w, 4); s.rotation.x = i / 5 * PI; } flatX(cyl(0.035, 0.035, 0.1, 0xadb5bd, 0, 0, 0, w, 8)); sph(0.025, 0xff922b, 0.02, R - 0.12, 0, w); bake(w); return w; };
  const wf = wheel(ZF), wb = wheel(ZB);
  // 페달 (돌아가요)
  const crank = dyn(g, 0, BB[1], BB[2]); for (const s of [-1, 1]) { box(0.02, 0.17, 0.03, 0xadb5bd, s * 0.075, s * 0.085, 0, crank); box(0.11, 0.025, 0.07, 0x212529, s * 0.13, s * 0.17, 0, crank); } bake(crank);
  th.home = [sp.x, sp.z, rot]; th.away = 0; th.ph = 0;
  const park = (x, z, r) => { th.x = th.ux = x; th.z = th.uz = z; th.fp[0].x = x; th.fp[0].z = z; g.position.set(x, 0, z); g.rotation.set(0, r, 0.14); if (th.sign) th.sign.position.set(x, th.signY, z); };
  park(sp.x, sp.z, rot); addSign(th, 2.3); th.park = park;
  th.label = () => ST.ride && ST.ride.th === th ? null : '자전거 타기 🚲';
  th.use = () => {
    if (ST.ride) leave(true);
    ST.ride = { kind: 'bike', th }; th.away = 0; g.rotation.z = 0;
    G.beep([[1568, .05], [1568, .08]]); // 따르릉
    tell('bike', '🚲 따르릉! 킥보드보다 더 빨라요<br><small>' + eKey() + ' 를 누르면 내려요</small>', 2800); fire('ride', { kind: 'bike' });
  };
  th.tick = (dt) => {
    const on = ST.ride && ST.ride.th === th;
    th.sign.visible = !th.hidden && !on;
    if (on) {
      const v = hyp(ST.pvx, ST.pvz), h = CAM.me && CAM.third ? CAM.face : P.yaw + PI;
      g.visible = CAM.third; g.position.set(P.x, P.jy, P.z); g.rotation.set(0, h, 0);
      wf.rotation.x += v * dt / R; wb.rotation.x += v * dt / R; th.ph += v * dt * 1.5; crank.rotation.x = th.ph;
      return;
    }
    if (hyp(th.x - th.home[0], th.z - th.home[1]) > 1) { th.away += dt; if (th.away > 75) { park(th.home[0], th.home[1], th.home[2]); th.away = 0; } }
  };
  return th;
}

// ---------------- 🐱 고양이 길들이기 (간식을 주면 한동안 졸졸 따라와요. 시간이 지나면 도망가요) ----------------
const CAT = { tame: 150, add: 120, max: 300, low: 45 };
const wallAt = (x, z) => !gin(x, z) || GR.wall[gcell(z) * GR.N + gcell(x)];
function freeNear(x, z, r0, r1) { // (x, z) 둘레의 걸을 수 있는 빈 자리
  for (let i = 0; i < 24; i++) { const a = Math.random() * PI * 2, d = r0 + Math.random() * (r1 - r0), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (!wallAt(px, pz) && reachAt(px, pz) && distAt(px, pz) > 0.4) return [px, pz]; }
  return null;
}
const CATLOOKS = [{ c: 0xf4a340, c2: 0xd9780f, eye: 0x94d82d, belly: 1, socks: 1 }, { c: 0x495057, c2: 0x212529, eye: 0xffd43b, belly: 1, socks: 1, mask: 0 }]; // 0 = 주황 줄무늬, 1 = 회색
function catBody(look) { // 고양이 모형 (앞이 +z, 바닥 y=0). 장면에는 넣지 않아요
  const root = new THREE.Group(); root.scale.setScalar(1.4);
  const C = look.c, C2 = look.c2, W = 0xffffff;
  // 서 있는 몸
  const stand = dyn(root, 0, 0, 0); ell(0.2, 0.85, 0.8, 1.65, C, 0, 0.3, 0, stand); ell(0.15, 0.8, 0.7, 1, look.belly ? W : C, 0, 0.27, 0.22, stand); for (let i = 0; i < 3; i++) box(0.24, 0.03, 0.05, C2, 0, 0.445 - Math.abs(i - 1) * 0.012, -0.16 + i * 0.14, stand); flatZ(tor(0.13, 0.022, 0xe03131, 0, 0.36, 0.26, stand)).rotation.x = PI / 2 - 0.3; sph(0.03, 0xffd43b, 0, 0.27, 0.34, stand); bake(stand);
  const legs = [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]].map(q => { const l = dyn(stand, q[0], 0.2, q[1]); cap(0.04, 0.12, C, 0, -0.1, 0, l); sph(0.045, look.socks ? W : C, 0, -0.17, 0.012, l); bake(l); return l; });
  // 앉은 몸
  const sit = dyn(root, 0, 0, 0); ell(0.2, 0.92, 1.25, 0.95, C, 0, 0.27, -0.06, sit); ell(0.15, 0.8, 1.2, 0.6, look.belly ? W : C, 0, 0.29, 0.07, sit); for (const s of [-1, 1]) { sph(0.13, C, s * 0.13, 0.12, -0.06, sit); cap(0.04, 0.16, C, s * 0.07, 0.13, 0.13, sit); sph(0.047, look.socks ? W : C, s * 0.07, 0.04, 0.15, sit); } flatZ(tor(0.12, 0.022, 0xe03131, 0, 0.46, 0.02, sit)); sph(0.03, 0xffd43b, 0, 0.42, 0.13, sit); bake(sit); sit.visible = false;
  // 머리: 귀 · 눈 · 코 · 수염
  const head = dyn(root, 0, 0.47, 0.33); ell(0.17, 1.08, 0.92, 0.95, C, 0, 0, 0, head);
  for (const s of [-1, 1]) { const e = cone(0.07, 0.13, C, s * 0.1, 0.16, -0.01, head, 4); e.rotation.z = -s * 0.25; const e2 = cone(0.04, 0.08, 0xffa8a8, s * 0.1, 0.155, 0.018, head, 4); e2.rotation.z = -s * 0.25; sph(0.034, look.eye, s * 0.068, 0.02, 0.135, head); ell(0.016, 0.6, 1.3, 0.6, 0x212529, s * 0.068, 0.02, 0.163, head); ell(0.05, 1, 0.8, 0.7, W, s * 0.035, -0.045, 0.14, head); for (const k of [-1, 1]) { const w = box(0.15, 0.006, 0.006, W, s * 0.13, -0.04 + k * 0.022, 0.13, head); w.rotation.z = s * k * 0.16; w.rotation.y = -s * 0.25; } }
  sph(0.018, 0xff8fab, 0, -0.022, 0.168, head); if (look.mask) ell(0.1, 1, 0.6, 0.5, C2, 0, 0.09, 0.09, head);
  bake(head);
  // 꼬리 (살랑살랑)
  const tail = dyn(root, 0, 0.36, -0.3); let tp = tail; for (let i = 0; i < 3; i++) { const sgm = dyn(tp, 0, i ? 0.13 : 0, 0); cap(0.034 - i * 0.004, 0.1, i === 2 ? C2 : C, 0, 0.065, 0, sgm); bake(sgm); sgm.rotation.x = i ? 0.35 : -0.9; tp = sgm; }
  const segs = []; { let q = tail.children[0]; while (q) { segs.push(q); q = q.children.find(c => c.isGroup); } }
  const setPose = (s) => { const sitting = s === 'sit'; stand.visible = !sitting; sit.visible = sitting; if (sitting) { head.position.set(0, 0.58, 0.07); tail.position.set(0.05, 0.06, -0.2); tail.rotation.set(0, 0, 0); segs[0].rotation.set(-1.45, 0, 0.5); } else { head.position.set(0, 0.47, 0.33); tail.position.set(0, 0.36, -0.3); segs[0].rotation.set(-0.9, 0, 0); } };
  return { root, stand, sit, head, tail, segs, legs, setPose };
}
function makeCat(skin) { // 다른 층(함께 하기)이 친구의 고양이를 그릴 때: 같은 모양의 새 고양이. group.userData.pose(t, 'walk' | 'run' | 'sit')
  const M = catBody(CATLOOKS[skin === 1 ? 1 : 0]), g = new THREE.Group(); g.add(M.root); let cur = 'stand'; M.setPose('stand');
  g.userData.skin = skin === 1 ? 1 : 0;
  g.userData.pose = (t, mode) => {
    const sitting = mode === 'sit', run = mode === 'run'; t = +t || 0;
    if ((cur === 'sit') !== sitting) { cur = sitting ? 'sit' : 'stand'; M.setPose(cur); M.stand.rotation.x = 0; M.stand.position.y = 0; M.head.rotation.set(0, 0, 0); }
    if (!sitting) { const ph = t * (run ? 22 : 9), sw = Math.sin(ph) * (run ? 0.9 : 0.45), bob = Math.abs(Math.sin(ph)) * (run ? 0.065 : 0.01); M.legs[0].rotation.x = sw; M.legs[3].rotation.x = sw; M.legs[1].rotation.x = -sw; M.legs[2].rotation.x = -sw; M.stand.rotation.x = run ? Math.sin(ph) * 0.12 : 0; M.stand.position.y = bob; M.head.position.y = 0.47 + bob; M.head.rotation.x = run ? -0.1 : 0; }
    else { M.head.rotation.x = Math.sin(t * 1.3) * 0.06; M.head.rotation.z = Math.sin(t * 0.7) * 0.08; }
    M.segs.forEach((s, i) => { if (i) { s.rotation.z = Math.sin(t * 5 + i * 0.9) * 0.4; s.rotation.x = 0.35; } });
  };
  return g;
}
function buildCat(x, z, look, idx) {
  const th = thing('cat', '🐱', x, z, { own: false, verb: '간식', useR: 2.8, themed: 1, price: 1, name: '고양이 간식 주기' });
  const { root, stand, sit, head, tail, segs, legs, setPose } = catBody(look); scene.add(root); th.g = root; th.objs.push(root);
  const heart = emoSprite('❤️', 0.3); heart.position.set(0, 0.95, 0.1); heart.visible = false; root.add(heart);
  const blob = noRay(new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }))); blob.rotation.x = -PI / 2; blob.position.y = 0.02; root.add(blob);
  const C0 = th.cat = { x, z, h: rnd() * 6.28, st: 'sit', t: 1 + idx * 2, tx: x, tz: z, tame: 0, meow: 6, ph: idx * 3, stuck: 0, hop: 0, hearts: '', skin: idx ? 1 : 0 };
  setPose('sit');
  // 한 걸음: 벽이면 옆으로 비켜 가요 (충돌 상자는 만들지 않아요)
  const step = (tx, tz, sp, dt) => {
    const dx = tx - C0.x, dz = tz - C0.z, d = hyp(dx, dz); if (d < 0.05) return 0;
    const base = Math.atan2(dx, dz), mv = Math.min(d, sp * dt);
    for (const off of [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9]) { const a = base + off, nx = C0.x + Math.sin(a) * mv, nz = C0.z + Math.cos(a) * mv; if (!wallAt(C0.x + Math.sin(a) * Math.max(mv, 0.4), C0.z + Math.cos(a) * Math.max(mv, 0.4))) { C0.x = nx; C0.z = nz; C0.h += angDiff(a, C0.h) * Math.min(1, dt * 9); return mv; } }
    return 0;
  };
  th.label = () => C0.st === 'flee' ? null : C0.tame > 0 ? (C0.tame < CAT.low ? '고양이에게 간식 더 주기 🐟' : null) : '고양이에게 간식 주기 🐟';
  th.challenge = () => lessonQ();
  th.use = () => {
    const more = C0.tame > 0; C0.tame = Math.min(CAT.max, (more ? C0.tame : 0) + (more ? CAT.add : CAT.tame)); C0.st = 'follow'; C0.t = 0; C0.meow = 2.5;
    G.beep([[880, .06], [1175, .08], [988, .1]]); emo('❤️', C0.x, 1.3, C0.z, 0.6); emo('🐟', C0.x + 0.3, 1.0, C0.z, 0.5);
    tell('cat', more ? '🐟 냠냠! 고양이가 더 오래 따라와요' : '🐱 야옹~ 고양이가 한동안 졸졸 따라와요!<br><small>하트가 다 없어지기 전에 간식을 더 주면 오래 따라와요</small>', 3400); fire('use', { kind: 'cat' });
  };
  th.tick = (dt, t) => {
    const dP = hyp(P.x - C0.x, P.z - C0.z), frozen = G.dlgOpen || !G.started; let mv = 0, sp = 0;
    if (C0.tame > 0 && C0.st !== 'flee') { // 길들인 동안: 따라오기
      C0.tame -= dt;
      const riding = ST.ride && !roam(ST.ride), pv = hyp(ST.pvx, ST.pvz);
      if (C0.tame <= 0) { C0.st = 'flee'; C0.t = 0; const far = freeNear(P.x, P.z, 18, 30) || freeNear(C0.x, C0.z, 8, 16); C0.tx = far ? far[0] : C0.x; C0.tz = far ? far[1] : C0.z; heart.visible = false; G.beep([[700, .06], [500, .08], [350, .12]]); emo('💨', C0.x, 1.0, C0.z, 0.6); G.toast('🐱 고양이가 흥미를 잃고 가 버렸어요<br><small>다시 만나서 간식을 주면 또 따라와요</small>', 3200); }
      else if (frozen || riding) C0.st = 'sit';
      else {
        if (dP > 16) { const q = freeNear(P.x, P.z, 1.5, 3); if (q) { C0.x = q[0]; C0.z = q[1]; emo('✨', C0.x, 0.8, C0.z, 0.5); } } // 너무 멀어지면 폴짝 따라와요
        // 내 왼쪽 앞(카메라에 가리지 않는 자리)을 따라와요. 그 자리가 막혀 있으면 나를 따라와요
        const fh = CAM.third && CAM.me ? CAM.face : P.yaw + PI; let gx = P.x + Math.cos(fh) * 1.15 + Math.sin(fh) * 0.45, gz = P.z - Math.sin(fh) * 1.15 + Math.cos(fh) * 0.45;
        if (wallAt(gx, gz)) { gx = P.x; gz = P.z; }
        const dT = hyp(gx - C0.x, gz - C0.z), near = gx === P.x && gz === P.z ? 1.3 : 0.45;
        if (dT > near + 0.6 || (dT > near && C0.st === 'follow' && pv > 0.5)) { C0.st = 'follow'; sp = clamp(pv + 1.5 + dT * 1.5, 2.2, 10.5); mv = step(gx, gz, sp, dt); C0.t = 0; }
        else if ((C0.t += dt) > 0.7) C0.st = 'sit'; // 내가 멈추면 옆에 앉아요
        if (C0.st === 'sit') C0.h += angDiff(Math.atan2(P.x - C0.x, P.z - C0.z), C0.h) * Math.min(1, dt * 5);
        if (P.jy > 0.35 && C0.hop <= 0) C0.hop = 0.5; // 내가 뛰면 같이 뛰어요
        if ((C0.meow -= dt) <= 0) { C0.meow = 11 + Math.random() * 9; emo('야옹~', C0.x, 1.25, C0.z, 0.42); G.beep([[880, .05], [1175, .07], [932, .1]]); }
      }
      const hs = C0.tame > 100 ? '❤️❤️❤️' : C0.tame > CAT.low ? '❤️❤️' : C0.tame > 15 ? '❤️' : (Math.floor(t * 3) % 2 ? '🐟' : '❓');
      if (hs !== C0.hearts && C0.tame > 0) { C0.hearts = hs; emoSet(heart, hs); } heart.visible = C0.tame > 0;
    } else if (C0.st === 'flee') { // 도망가기
      C0.t += dt; sp = 8.5; mv = step(C0.tx, C0.tz, sp, dt);
      if (C0.t > 7 || hyp(C0.tx - C0.x, C0.tz - C0.z) < 0.6 || (mv === 0 && C0.t > 1)) { C0.st = 'sit'; C0.t = 3; C0.tame = 0; }
    } else if (!frozen) { // 길고양이: 천천히 걷다가 앉았다가, 다가가면 살짝 피해요
      C0.t -= dt;
      if (dP < 2.0 && hyp(ST.pvx, ST.pvz) > 0.5 && C0.st !== 'shy') { C0.st = 'shy'; C0.t = 0.9; }
      if (C0.st === 'shy') { sp = 1.5; mv = step(C0.x + (C0.x - P.x), C0.z + (C0.z - P.z), sp, dt); if (C0.t <= 0) { C0.st = 'sit'; C0.t = 2.5 + Math.random() * 3; } }
      else if (C0.st === 'walk') { sp = 1.1; mv = step(C0.tx, C0.tz, sp, dt); if (C0.t <= 0 || hyp(C0.tx - C0.x, C0.tz - C0.z) < 0.3 || mv === 0) { C0.st = 'sit'; C0.t = 3 + Math.random() * 5; } }
      else if (C0.t <= 0) { const q = freeNear(C0.x, C0.z, 2.5, 8); if (q) { C0.tx = q[0]; C0.tz = q[1]; C0.st = 'walk'; C0.t = 9; } else C0.t = 2; }
      else if (dP < 5) C0.h += angDiff(Math.atan2(P.x - C0.x, P.z - C0.z), C0.h) * Math.min(1, dt * 2); // 앉아서 나를 쳐다봐요
    }
    // 그리기: 앉기 / 걷기 / 달리기(도망·쫓아오기)
    const moving = mv > 0.0005;
    if (sit.visible !== (C0.st === 'sit' && !moving)) setPose(C0.st === 'sit' && !moving ? 'sit' : 'stand');
    let y = 0; if (C0.hop > 0) { C0.hop -= dt; y = Math.sin(Math.max(0, C0.hop) / 0.5 * PI) * 0.5; }
    const run = moving && sp > 4;
    if (moving) { C0.ph += dt * (run ? 22 : 9); const sw = Math.sin(C0.ph) * (run ? 0.9 : 0.45); legs[0].rotation.x = sw; legs[3].rotation.x = sw; legs[1].rotation.x = -sw; legs[2].rotation.x = -sw; stand.rotation.x = run ? Math.sin(C0.ph) * 0.12 : 0; y += run ? Math.abs(Math.sin(C0.ph)) * 0.09 : Math.abs(Math.sin(C0.ph)) * 0.015; head.rotation.x = run ? -0.1 : 0; }
    else { legs.forEach(l => { l.rotation.x = 0; }); stand.rotation.x = 0; head.rotation.x = Math.sin(t * 1.3 + idx) * 0.06; head.rotation.z = Math.sin(t * 0.7 + idx * 2) * 0.08; }
    const wag = C0.st === 'flee' ? 0 : C0.tame > 0 ? 1 : 0.45; segs.forEach((s, i) => { if (i) { s.rotation.z = Math.sin(t * (2.2 + wag * 3) + i * 0.9 + idx) * (0.18 + wag * 0.25); s.rotation.x = C0.st === 'flee' ? 0.05 : 0.35; } });
    root.position.set(C0.x, y * 1.0, C0.z); root.rotation.y = C0.h; blob.visible = !G.GFX.high; blob.position.y = 0.02 - y / 1.2;
    th.x = th.ux = C0.x; th.z = th.uz = C0.z;
  };
  return th;
}
function buildCats() {
  const LOOKS = CATLOOKS, N = GR.N, put = [];
  for (let k = 0; k < 2; k++) {
    let best = null, bs = -1e9;
    for (let j = 8; j < N - 8; j += 3) for (let i = 8; i < N - 8; i += 3) {
      const c = j * N + i; if (!GR.reach[c] || GR.dist[c] < 1.2) continue; const x = gpos(i), z = gpos(j);
      let s = hn(i, j, 70 + k) * 6 - hyp(x - (k ? 9 : -9), z - 16) * 0.12 + Math.min(GR.dist[c], 3); if (put.length && hyp(x - put[0][0], z - put[0][1]) < 14) s -= 8;
      if (s > bs) { bs = s; best = [x, z]; }
    }
    if (best) { put.push(best); buildCat(best[0], best[1], LOOKS[k], k); }
  }
}

// ================= 3차: 놀이 더하기 (공통 넷 + 단원마다 하나씩 더) =================
// ---------------- 🪁 연 날리기 ----------------
function buildKite(sp) {
  const th = thing('kite', '🪁', sp.x, sp.z, { verb: '날리기', useR: 2.4, fp: [{ x: sp.x, z: sp.z, r: 1.2 }], solidR: 0.4 });
  const g = grp(sp.x, sp.z, Math.atan2(-sp.x, 6 - sp.z)); th.g = g; th.objs.push(g);
  for (const s of [-1, 1]) { const p = cyl(0.04, 0.05, 1.7, 0xa1887f, s * 0.55, 0.82, 0, g, 8); p.rotation.z = -s * 0.2; } flatX(cap(0.04, 1.0, 0xa1887f, 0, 1.6, 0, g)); cyl(0.5, 0.55, 0.08, 0x8d6e63, 0, 0.04, 0, g, 14);
  const mini = (x, c1, c2) => { const k = box(0.42, 0.42, 0.025, c1, x, 1.1, 0.05, g); k.rotation.z = PI / 4; k.scale.y = 1.25; box(0.02, 0.62, 0.03, c2, x, 1.1, 0.06, g); box(0.44, 0.02, 0.03, c2, x, 1.16, 0.06, g); for (let i = 0; i < 3; i++) ell(0.045, 1.4, 0.7, 0.5, [c2, 0xffffff, c2][i], x + (i % 2 ? 0.05 : -0.05), 0.7 - i * 0.13, 0.05, g); };
  mini(-0.28, 0xe03131, 0xffd43b); mini(0.28, 0x1c7ed6, 0xffffff);
  flatX(cyl(0.11, 0.11, 0.2, 0xdeb887, 0, 0.2, 0.35, g, 12)); for (const s of [-1, 1]) flatX(cyl(0.15, 0.15, 0.02, 0x8d6e63, s * 0.11, 0.2, 0.35, g, 12));
  bake(g);
  // 날아다니는 연
  const k = new THREE.Group(); k.userData.dyn = 1; scene.add(k); th.objs.push(k); k.visible = false;
  const C = pick([0xe03131, 0x7048e8, 0x12b886, 0xf08c00]);
  const sail = box(1.0, 1.0, 0.03, C, 0, 0, 0, k); sail.rotation.z = PI / 4; sail.scale.y = 1.3; box(0.03, 1.75, 0.04, 0xfff3bf, 0, 0, 0.02, k); box(1.02, 0.03, 0.04, 0xfff3bf, 0, 0.2, 0.02, k); for (const s of [-1, 1]) sph(0.07, 0xffffff, s * 0.2, 0.25, 0.04, k); ell(0.12, 1.3, 0.5, 0.4, 0xffffff, 0, -0.05, 0.04, k);
  bake(k);
  const tails = [0, 1, 2, 3].map(i => { const t = ell(0.09, 1.5, 0.6, 0.3, [0xffd43b, 0xffffff, 0xffd43b, 0xffffff][i], 0, 0, 0, scene); t.visible = false; th.objs.push(t); return t; });
  const line = add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })), 0, 0, 0, scene); line.visible = false; th.objs.push(line); noRay(line);
  const K = th.k = { x: sp.x, y: 1.2, z: sp.z, on: false }, up = new THREE.Vector3(0, 1, 0), dv = new THREE.Vector3();
  th.label = () => hasPass(th) ? null : '연 날리기 🪁';
  th.use = () => { K.on = true; K.x = P.x; K.y = 1.6; K.z = P.z; G.beep([[523, .06], [784, .06], [1046, .1]]); tell('kite', '🪁 연이 하늘로 올라가요! 1분 동안 나를 따라 날아요', 3000); fire('use', { kind: 'kite' }); };
  th.onHide = (on) => { if (on) K.on = false; };
  th.tick = (dt, t) => {
    const fly = K.on && hasPass(th);
    if (K.on && !fly) { K.on = false; G.toast('🪁 연이 내려왔어요', 1600); }
    k.visible = fly; line.visible = fly; tails.forEach(q => { q.visible = fly; });
    if (!fly) return;
    const h = P.yaw, tx = P.x + Math.sin(h) * 3.2 + Math.sin(t * 0.7) * 1.4, ty = 6.2 + Math.sin(t * 1.1) * 0.6, tz = P.z + Math.cos(h) * 3.2 + Math.cos(t * 0.5) * 1.2, q = Math.min(1, dt * 1.4);
    K.x += (tx - K.x) * q; K.y += (ty - K.y) * q; K.z += (tz - K.z) * q;
    k.position.set(K.x, K.y, K.z); k.rotation.set(-0.5 + Math.sin(t * 1.7) * 0.1, Math.atan2(P.x - K.x, P.z - K.z), Math.sin(t * 2.3) * 0.18);
    tails.forEach((m, i) => { m.position.set(K.x + Math.sin(t * 3 + i) * 0.14, K.y - 1.25 - i * 0.3, K.z + Math.cos(t * 2.4 + i) * 0.12); });
    const hx = P.x, hy = P.jy + 1.25, hz = P.z; dv.set(K.x - hx, K.y - 0.9 - hy, K.z - hz); const len = dv.length();
    line.position.set(hx + dv.x / 2, hy + dv.y / 2, hz + dv.z / 2); line.scale.set(1, len, 1); line.quaternion.setFromUnitVectors(up, dv.normalize());
  };
  return th;
}
// ---------------- 🎣 낚시 연못 ----------------
const FISH = [['금붕어', 0xff922b, 1], ['파랑 물고기', 0x339af0, 0.9], ['노랑 물고기', 0xffd43b, 0.8], ['큰 잉어', 0xe03131, 1.5]];
function buildPond(sp) {
  const th = thing('fish', '🎣', sp.x, sp.z, { verb: '낚시', useR: 3.9, fp: [{ x: sp.x, z: sp.z, r: 2.5 }], solidR: 2.05 });
  const rot = Math.atan2(-sp.x, 6 - sp.z), g = grp(sp.x, sp.z, rot); th.g = g; th.objs.push(g); const fx = Math.sin(rot), fz = Math.cos(rot);
  cyl(2.35, 2.45, 0.1, 0xc9b28a, 0, 0.05, 0, g, 28);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2 + 0.2, r = 2.15 + (i % 3) * 0.08; ell(0.26 + (i % 3) * 0.06, 1.2, 0.6, 0.9, [0x868e96, 0xadb5bd, 0x495057][i % 3], Math.cos(a) * r, 0.14, Math.sin(a) * r, g).rotation.y = a; }
  for (const [a, n] of [[2.3, 4], [4.0, 3], [5.4, 4]]) for (let i = 0; i < n; i++) { const x = Math.cos(a + i * 0.09) * 1.85, z = Math.sin(a + i * 0.09) * 1.85, h = 0.8 + (i % 2) * 0.35; cyl(0.018, 0.022, h, 0x5c940d, x, h / 2, z, g, 5); cap(0.035, 0.14, 0x7b4a2d, x, h + 0.05, z, g); }
  for (const [x, z, s] of [[-0.8, -0.5, 1], [0.7, -0.9, 0.8], [0.3, 0.6, 0.7]]) { cyl(0.3 * s, 0.3 * s, 0.02, 0x40c057, x, 0.125, z, g, 12); if (s > 0.75) { sph(0.07, 0xff8fab, x + 0.05, 0.18, z, g); sph(0.035, 0xffd43b, x + 0.05, 0.23, z, g); } }
  for (let i = 0; i < 4; i++) box(0.9, 0.06, 0.24, i % 2 ? 0xb08968 : 0xa1887f, 0, 0.2, 1.55 + i * 0.26, g); for (const s of [-1, 1]) for (const z of [1.5, 2.3]) cyl(0.05, 0.05, 0.4, 0x6d4c41, s * 0.4, 0.15, z, g, 6);
  bake(g);
  const water = cyl(2.05, 2.05, 0.02, new THREE.MeshStandardMaterial({ color: 0x4dabf7, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }), 0, 0.115, 0, g, 28); water.userData.ns = 1;
  const rod = dyn(g, 0.3, 0.3, 2.2); cap(0.018, 1.9, 0x8d6e63, 0, 0.95, 0, rod); rod.rotation.x = -0.9; rod.visible = false; bake(rod);
  const flt = new THREE.Group(); flt.userData.dyn = 1; sph(0.07, 0xe03131, 0, 0.03, 0, flt); sph(0.066, 0xffffff, 0, -0.02, 0, flt); cyl(0.008, 0.008, 0.16, 0x212529, 0, 0.1, 0, flt, 4); bake(flt); flt.visible = false; scene.add(flt); th.objs.push(flt);
  const rip = noRay(new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }))); rip.rotation.x = -PI / 2; rip.visible = false; rip.userData.camBig = 0; scene.add(rip); th.objs.push(rip);
  const fish = FISH.map(f => { const m = new THREE.Group(); m.userData.dyn = 1; ell(0.16, 0.6, 0.8, 1.5, f[1], 0, 0, 0, m); const tl = cone(0.11, 0.2, f[1], 0, 0, -0.3, m, 4); tl.rotation.x = PI / 2; tl.scale.x = 0.3; ell(0.07, 0.3, 1, 1.2, 0xffffff, 0, -0.03, 0.05, m); const fn = cone(0.06, 0.12, f[1], 0, 0.14, 0, m, 4); fn.scale.x = 0.3; for (const s of [-1, 1]) { sph(0.028, 0xffffff, s * 0.075, 0.03, 0.17, m); sph(0.014, 0x212529, s * 0.09, 0.03, 0.185, m); } bake(m); m.scale.setScalar(f[2] * 1.5); m.visible = false; scene.add(m); th.objs.push(m); return m; });
  th.label = () => th.busy > 0 ? null : '낚시하기 🎣';
  th.use = () => {
    th.busy = 6.5; const i = rndI(FISH.length), f = FISH[i], m = fish[i], c = [sp.x + (Math.random() - 0.5) * 1.6, 0.16, sp.z + (Math.random() - 0.5) * 1.6], a = [sp.x + fx * 2.1, 1.5, sp.z + fz * 2.1];
    rod.visible = true; G.beep([[700, .04], [500, .06]]);
    toss(flt, a, c, 0.7, 1.2, () => { G.beep([[1300, .03], [600, .05]]); rip.position.set(c[0], 0.14, c[2]); rip.visible = true; tw(3, k => { flt.position.y = 0.16 + Math.sin(k * 30) * 0.03 - (k > 0.85 ? 0.12 : 0); const u = (k * 3) % 1; rip.scale.setScalar(0.2 + u * 0.9); rip.material.opacity = 0.7 * (1 - u); }, () => {
      rip.visible = false; flt.visible = false; burst(c[0], 0.4, c[2], { n: 20, sp: 3.5, life: 0.8, size: 0.3, cols: [0xd0ebff, 0xffffff, 0x74c0fc], g: 9 }); G.beep('combo');
      const b = front(1.0, 1.35); m.rotation.set(0, P.yaw + PI / 2, 0); toss(m, c, b, 0.8, 1.6, () => { tw(1.6, k => { m.rotation.z = Math.sin(k * 40) * 0.35; m.position.y = b[1] + Math.sin(k * 20) * 0.04; }, () => { toss(m, b, c, 0.6, 1.0, () => { m.visible = false; rod.visible = false; burst(c[0], 0.3, c[2], { n: 10, sp: 2, life: 0.5, size: 0.25, cols: [0xd0ebff, 0xffffff], g: 8 }); }); }); });
      DAY.fish = (DAY.fish | 0) + 1; saveDay(); tell('fish', '🎣 ' + f[0] + '를 잡았어요! <small>(오늘 ' + DAY.fish + '마리째)</small><br><small>물고기는 다시 놓아줘요</small>', 3200); fire('use', { kind: 'fish' });
    }); });
  };
  return th;
}
// ---------------- 🏀 농구 골대 ----------------
function buildHoop(sp) {
  const th = thing('hoop', '🏀', sp.x, sp.z, { verb: '던지기', useR: 3.6, fp: [{ x: sp.x, z: sp.z, r: 2.0 }] });
  const rot = Math.atan2(-sp.x, 6 - sp.z), g = grp(sp.x, sp.z, rot); th.g = g; th.objs.push(g); const fx = Math.sin(rot), fz = Math.cos(rot);
  cyl(1.9, 1.9, 0.04, 0xe8590c, 0, 0.025, 0.4, g, 26); cyl(1.7, 1.7, 0.045, 0xffa94d, 0, 0.027, 0.4, g, 26); box(1.2, 0.05, 0.06, 0xffffff, 0, 0.05, 1.3, g);
  cyl(0.5, 0.56, 0.18, 0x343a40, 0, 0.09, -1.2, g, 14); cyl(0.07, 0.09, 3.3, 0x495057, 0, 1.7, -1.2, g, 10); const arm = cap(0.05, 0.6, 0x495057, 0, 3.25, -0.95, g); arm.rotation.x = PI / 2;
  box(1.5, 1.0, 0.06, 0xffffff, 0, 3.3, -0.62, g); for (const [w, h, x, y] of [[0.56, 0.04, 0, 3.32], [0.56, 0.04, 0, 2.98], [0.04, 0.38, -0.26, 3.15], [0.04, 0.38, 0.26, 3.15]]) box(w, h, 0.07, 0xe03131, x, y, -0.6, g); for (const s of [-1, 1]) box(0.05, 1.0, 0.07, 0xe03131, s * 0.73, 3.3, -0.62, g);
  flatZ(tor(0.26, 0.022, 0xff6b00, 0, 2.95, -0.3, g));
  bake(g);
  const net = noRay(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.16, 0.42, 10, 3, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.85 }))); net.position.set(0, 2.73, -0.3); net.userData.camBig = 0; g.add(net);
  const ball = new THREE.Group(); ball.userData.dyn = 1; sph(0.17, 0xe8731c, 0, 0, 0, ball); tor(0.171, 0.008, 0x3a2a1a, 0, 0, 0, ball); flatZ(tor(0.171, 0.008, 0x3a2a1a, 0, 0, 0, ball)); bake(ball); ball.visible = false; scene.add(ball); th.objs.push(ball);
  const W = (lx, ly, lz) => [sp.x + lx * fz + lz * fx, ly, sp.z - lx * fx + lz * fz], rim = W(0, 2.95, -0.3);
  th.label = () => th.busy > 0 ? null : '농구공 던지기 🏀';
  th.use = () => {
    th.busy = 5.2; let made = 0;
    for (let i = 0; i < 3; i++) later(0.2 + i * 1.5, () => { const ok = i === 2 || Math.random() < 0.7, to = ok ? rim : W(i % 2 ? 0.34 : -0.34, 3.05, -0.36);
      G.beep([[300, .04]]); toss(ball, front(0.5, 1.6), to, 0.9, 1.9, () => { if (ok) { made++; G.beep([[880, .05], [1318, .09]]); tw(0.5, k => { net.scale.set(1 + Math.sin(k * PI) * 0.25, 1 + Math.sin(k * PI) * 0.2, 1 + Math.sin(k * PI) * 0.25); }); toss(ball, to, W(0, 0.2, -0.2), 0.45, 0, () => { ball.visible = false; }); emo('🏀', rim[0], 3.5, rim[2], 0.6); } else { G.beep([[220, .06], [180, .06]]); toss(ball, to, W(i % 2 ? 1.6 : -1.6, 0.2, 0.6), 0.6, 0.6, () => { ball.visible = false; }); } tw(0.9, k => { ball.rotation.x = -k * 9; }); });
    });
    later(4.9, () => tell('hoop', '🏀 3개 중 ' + made + '개 성공!' + (made === 3 ? ' 대단해요 🎉' : ''), 2600)); fire('use', { kind: 'hoop' });
  };
  return th;
}
// ---------------- 👑 보물 상자 → 오늘의 장식 (내 캐릭터 머리에) ----------------
const DECO = [['crown', '왕관', '👑'], ['tophat', '마술사 모자', '🎩'], ['ribbon', '큰 리본', '🎀'], ['halo', '반짝 고리', '😇'], ['flower', '꽃 머리띠', '🌸']];
function decoModel(id) {
  const g = new THREE.Group(); g.userData.dyn = 1; g.userData.playDeco = id;
  if (id === 'crown') { const gold = 0xffd43b; add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.11, 14, 1, true), mat(gold)), 0, 0.31, 0, g); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; cone(0.05, 0.13, gold, Math.cos(a) * 0.185, 0.42, Math.sin(a) * 0.185, g, 4); sph(0.026, [0xe03131, 0x339af0, 0x51cf66][i % 3], Math.cos(a) * 0.2, 0.32, Math.sin(a) * 0.2, g); } }
  else if (id === 'tophat') { cyl(0.32, 0.32, 0.025, 0x212529, 0, 0.27, 0, g, 18); cyl(0.19, 0.2, 0.3, 0x212529, 0, 0.42, 0, g, 16); flatZ(tor(0.2, 0.02, 0xe03131, 0, 0.3, 0, g)); }
  else if (id === 'ribbon') { for (const s of [-1, 1]) { ell(0.13, 1.3, 0.9, 0.5, 0xff8fab, s * 0.15, 0.33, 0.02, g).rotation.z = s * 0.5; ell(0.07, 0.7, 1.5, 0.4, 0xf06595, s * 0.08, 0.2, 0.06, g).rotation.z = -s * 0.3; } sph(0.06, 0xf06595, 0, 0.32, 0.03, g); }
  else if (id === 'halo') { const h = flatZ(tor(0.2, 0.028, glow(0xffe066, 0.9), 0, 0.5, 0, g)); h.userData.ns = 1; for (let i = 0; i < 3; i++) sph(0.03, 0xffffff, Math.cos(i * 2.1) * 0.3, 0.52, Math.sin(i * 2.1) * 0.3, g); }
  else { flatZ(tor(0.27, 0.02, 0x40c057, 0, 0.16, 0, g)).rotation.x = PI / 2 - 0.25; for (let i = 0; i < 7; i++) { const a = -0.3 + i / 6 * (PI + 0.6); sph(0.055, [0xff8fab, 0xffd43b, 0xffffff, 0xda77f2][i % 4], Math.cos(a) * 0.27, 0.19 + Math.sin(a) * 0.07, Math.sin(a) * 0.27 * 0.25 + 0.02, g); } for (let i = 0; i < 7; i++) { const a = -0.3 + i / 6 * (PI + 0.6); sph(0.02, 0xffe066, Math.cos(a) * 0.3, 0.19 + Math.sin(a) * 0.075, 0.05, g); } }
  bake(g); return g;
}
function decoTick() { // 캐릭터가 새로 만들어져도(꾸미기 바꾸기 등) 다시 달아 줘요
  const g = CAM.me, a = g && g.userData.anim, want = ST.mask || DAY.deco || null; if (!a || !a.headG) return;
  const cur = a.headG.children.find(c => c.userData && c.userData.playDeco);
  if (cur && cur.userData.playDeco === want) return;
  if (cur) a.headG.remove(cur);
  if (want) a.headG.add(want === 'mask' && ST.maskM ? ST.maskM : decoModel(want));
}
function buildChest(sp) {
  const th = thing('chest', '👑', sp.x, sp.z, { verb: '열기', useR: 2.4, fp: [{ x: sp.x, z: sp.z, r: 1.3 }], solidR: 0.6 });
  const g = grp(sp.x, sp.z, Math.atan2(-sp.x, 6 - sp.z)); th.g = g; th.objs.push(g);
  cyl(1.1, 1.2, 0.12, 0x7048e8, 0, 0.06, 0, g, 20); cyl(0.95, 0.95, 0.03, 0xffd43b, 0, 0.13, 0, g, 20);
  box(1.1, 0.55, 0.7, 0x8d5a2b, 0, 0.42, 0, g); for (const x of [-0.42, 0, 0.42]) box(0.1, 0.57, 0.72, 0xffd43b, x, 0.42, 0, g); box(1.12, 0.06, 0.72, 0xffd43b, 0, 0.17, 0, g); for (const s of [-1, 1]) flatX(tor(0.09, 0.02, 0xadb5bd, s * 0.57, 0.45, 0, g)).rotation.y = PI / 2;
  bake(g);
  const lid = dyn(g, 0, 0.7, -0.35); flatX(cyl(0.35, 0.35, 1.1, 0x9c6b3f, 0, 0, 0.35, lid, 16)).scale.set(0.75, 1, 1); for (const x of [-0.42, 0, 0.42]) flatX(cyl(0.36, 0.36, 0.1, 0xffd43b, x, 0, 0.35, lid, 16)).scale.set(0.75, 1, 1); box(0.16, 0.2, 0.06, 0xffd43b, 0, -0.04, 0.72, lid); sph(0.035, 0x212529, 0, -0.05, 0.75, lid); bake(lid);
  const gl = noRay(new THREE.Sprite(new THREE.SpriteMaterial({ map: G.haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }))); gl.position.set(0, 0.9, 0); gl.scale.set(0.01, 0.01, 1); g.add(gl);
  th.open = 0; th.want = 0;
  th.label = () => th.busy > 0 ? null : '보물 상자 열기 👑';
  th.use = () => {
    th.busy = 5; th.want = 1; const opts = DECO.filter(d => d[0] !== DAY.deco), d = opts[rndI(opts.length)], w = [sp.x, 1.3, sp.z];
    G.beep('fanfare'); later(0.5, () => { burst(w[0], w[1], w[2], { n: 30, sp: 4, life: 1.3, size: 0.38, cols: [0xffd43b, 0xffffff, 0xff8fab, 0x74c0fc], g: 4 }); emo(d[2], w[0], 1.6, w[2], 1.0); DAY.deco = d[0]; saveDay(); decoTick(); });
    later(4.2, () => { th.want = 0; });
    tell('chest', '👑 보물 상자에서 <b>' + d[1] + '</b> ' + d[2] + ' 이(가) 나왔어요!<br><small>오늘 하루 내 캐릭터가 쓰고 다녀요</small>', 3600); fire('use', { kind: 'chest', deco: d[0] });
  };
  th.tick = (dt, t) => { th.open += (th.want - th.open) * Math.min(1, dt * 4); lid.rotation.x = -th.open * 1.25; const s = th.open * 2.2 + (th.busy <= 0 ? 0.5 + Math.sin(t * 3) * 0.12 : 0); gl.scale.set(s, s, 1); };
  return th;
}

// ---------------- 단원 놀이 하나씩 더 (그 단원 data.js 의 표현으로) ----------------
const THEME3 = {};
// L1 · 세계 친구 깃발 (어느 나라에서 왔는지 듣기)
THEME3[1] = () => {
  const KO = { Korea: '한국', France: '프랑스', India: '인도' }, ws = Object.values(L.world || {}).filter(w => w && w.country && w.lines && w.lines[0] && KO[w.country]);
  if (ws.length < 3) return;
  const th = mkStation('flags', '🚩', '세계 친구 깃발', 2.2, { verb: '올리기' }); if (!th) return; const g = th.g;
  cyl(2.0, 2.1, 0.14, 0x74c0fc, 0, 0.07, 0, g, 26); cyl(1.8, 1.8, 0.04, 0xe7f5ff, 0, 0.15, 0, g, 26);
  const X = [-1.2, 0, 1.2]; X.forEach(x => { cyl(0.045, 0.06, 3.4, 0xced4da, x, 1.85, -0.4, g, 8); sph(0.09, 0xffd43b, x, 3.6, -0.4, g); cyl(0.2, 0.24, 0.12, 0x868e96, x, 0.2, -0.4, g, 10); });
  sph(0.5, 0x4dabf7, 0, 0.62, 0.9, g); for (const [a, b] of [[0.5, 0.4], [2.2, 0.1], [4.1, 0.5], [5.2, -0.3]]) { const m = ell(0.2, 1, 1, 0.3, 0x51cf66, Math.cos(b) * Math.cos(a) * 0.47, 0.62 + Math.sin(b) * 0.47, 0.9 + Math.cos(b) * Math.sin(a) * 0.47, g); m.rotation.order = 'YXZ'; m.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); m.rotation.x = -b; } cyl(0.2, 0.3, 0.14, 0x8d6e63, 0, 0.2, 0.9, g, 10);
  bake(g);
  const mkFlag = (c) => { const f = new THREE.Group(); f.userData.dyn = 1;
    if (c === 'France') [0x1c4fb0, 0xffffff, 0xe03131].forEach((k, i) => box(0.3, 0.6, 0.03, k, 0.15 + i * 0.3, 0, 0, f));
    else if (c === 'India') { [0xff9933, 0xffffff, 0x138808].forEach((k, i) => box(0.9, 0.2, 0.03, k, 0.45, 0.2 - i * 0.2, 0, f)); for (const z of [-1, 1]) flatZ(cyl(0.07, 0.07, 0.035, 0x1c2f80, 0.45, 0, 0, f, 12)); }
    else { box(0.9, 0.6, 0.03, 0xffffff, 0.45, 0, 0, f); flatZ(cyl(0.15, 0.15, 0.04, 0xe03131, 0.45, 0.03, 0, f, 16)); flatZ(cyl(0.11, 0.11, 0.045, 0x1c4fb0, 0.45, -0.05, 0, f, 16)); for (const [x, y] of [[0.14, 0.18], [0.76, 0.18], [0.14, -0.18], [0.76, -0.18]]) box(0.14, 0.035, 0.04, 0x212529, x, y, 0, f).rotation.z = (x < 0.4 ? 1 : -1) * (y > 0 ? 1 : -1) * 0.6; }
    bake(f); return f; };
  const fl = ws.slice(0, 3).map((w, i) => { const f = mkFlag(w.country); f.position.set(X[i] + 0.05, 1.3, -0.4); g.add(f); return f; });
  addSign(th, 4.3);
  th.challenge = () => { const i = pickI(th, 3), w = th.cur = ws[i]; th.ci = i; return { tag: '듣고 고르기', pic: '🚩🌍', ko: '친구가 어느 나라에서 왔는지 잘 듣고 골라요', say: [[w.lines[0][0], w.name]], choices: ws.slice(0, 3).map(x => KO[x.country]), keep: true, right: KO[w.country], after: [w.lines[0][0]], afterKo: w.lines[0][1] }; };
  th.use = () => { th.busy = 3.5; th.up = th.ci | 0; tune([523, 659, 784, 1046, 784, 1046], 0.2); const w = th.W(X[th.up] + 0.5, 3.9, -0.4); later(1.2, () => burst(w[0], w[1], w[2], { n: 14, sp: 2.4, life: 0.9, size: 0.3, cols: [0xffd43b, 0xffffff], g: 2 })); cheer(th, null, '🚩 ' + esc(KO[th.cur.country]) + ' 친구의 깃발을 올렸어요', 2800); };
  th.tick = (dt) => { fl.forEach((f, i) => { f.position.y += ((th.up === i ? 3.15 : 1.3) - f.position.y) * Math.min(1, dt * 2.2); }); };
};
// L2 · 손님 식탁 (주문 듣고 음식 가져다주기)
THEME3[2] = () => {
  const cf = (L.comicFoods || []).filter(f => Array.isArray(f) && f[0] && f[1]), cu = (L.customers || []).filter(c => c && c.name && cf.some(f => f[0].indexOf(c.food) >= 0)), fo = L.foods || [], oq = S4[0];
  const order = (f) => swap(S4[1] && S4[1].en, 'a beef steak', f[0]); if (cu.length < 3 || !oq || !order(cf[0])) return;
  const th = mkStation('serve', '🧑‍🍳', '손님 식탁', 2.1, { solid: 0.9, verb: '서빙' }); if (!th) return; const g = th.g;
  cyl(1.0, 1.0, 0.07, 0xffffff, 0, 0.84, 0, g, 24); lathe([[1.0, 0.82], [1.07, 0.55], [1.03, 0.42]], 0xe03131, 0, 0, 0, g); cyl(0.1, 0.14, 0.84, 0xa1887f, 0, 0.42, 0, g, 10); cyl(0.5, 0.55, 0.06, 0xa1887f, 0, 0.03, 0, g, 14);
  cyl(0.04, 0.05, 0.14, 0x74c0fc, 0.5, 0.94, -0.3, g, 8); sph(0.07, 0xff8fab, 0.5, 1.07, -0.3, g); sph(0.05, 0xffd43b, 0.45, 1.1, -0.26, g);
  cyl(0.36, 0.36, 0.07, 0x8d6e63, 0, 0.5, -1.2, g, 16); cyl(0.05, 0.05, 0.5, 0x6d4c41, 0, 0.25, -1.2, g, 8); const bk = cap(0.06, 0.6, 0x8d6e63, 0, 1.0, -1.55, g); bk.rotation.z = PI / 2; for (const s of [-1, 1]) cyl(0.035, 0.035, 0.55, 0x8d6e63, s * 0.28, 0.76, -1.55, g, 6);
  bake(g);
  const guest = dyn(g, 0, 0.55, -1.15); ell(0.24, 1, 1.15, 0.85, 0x4dabf7, 0, 0.3, 0, guest); sph(0.21, 0xf5cfa8, 0, 0.78, 0.02, guest); ell(0.22, 1.02, 0.7, 1, 0x5c4033, 0, 0.86, -0.03, guest); for (const s of [-1, 1]) { sph(0.028, 0x212529, s * 0.075, 0.79, 0.2, guest); cap(0.055, 0.2, 0x4dabf7, s * 0.26, 0.36, 0.12, guest).rotation.x = -0.9; } flatZ(tor(0.05, 0.012, 0xb5443f, 0, 0.7, 0.19, guest, PI)).rotation.x = PI; bake(guest);
  addSign(th, 3.0);
  const lab = (c) => { const f = fo.find(x => x.id === c.food) || {}; return (f.emoji || '🍽️') + ' ' + (f.ko || c.food); };
  th.challenge = () => { const c = th.cur = cu[pickI(th, cu.length)], f = cf.find(x => x[0].indexOf(c.food) >= 0); th.cf = f; return { tag: '주문 듣기', pic: '🧑 ' + esc(c.name), en: oq.en, ko: '손님의 주문을 잘 듣고, 가져다줄 음식을 골라요', say: [[oq.en, 'Server'], [order(f), c.name]], choices: uniq(cu.map(lab)), right: lab(c), after: [order(f)] }; };
  th.use = () => { th.busy = 5; const at = th.W(0, 0.92, -0.25), m = showFood(th.cf[0], th.W(0, 1.6, 1.2), 1.3); later(0.4, () => toss(m, [m.position.x, m.position.y, m.position.z], at, 0.6, 0.4, () => { G.beep([[659, .06], [880, .1]]); hop(guest, 0.2, 0.4, 0.55); const w = th.W(0, 2.1, -1.15); emo('😋', w[0], w[1], w[2], 0.7); })); later(5.5, () => scene.remove(m)); cheer(th, null, '🧑‍🍳 ' + esc(lab(th.cur)) + ' 나왔습니다! 손님이 좋아해요', 2800); };
};
// L3 · 따뜻한 찻집 (아픈 친구에게 해 줄 말)
THEME3[3] = () => {
  const wa = (L.writeAdvice || []).filter(a => Array.isArray(a) && a[0] && a[1]); if (wa.length < 4) return;
  const th = mkStation('tea', '🫖', '따뜻한 찻집', 1.9, { solid: 0.8, verb: '차 따르기' }); if (!th) return; const g = th.g;
  cyl(0.95, 0.95, 0.07, 0xdeb887, 0, 0.82, 0, g, 22); cyl(0.1, 0.14, 0.82, 0x8d6e63, 0, 0.41, 0, g, 10); cyl(0.5, 0.55, 0.06, 0x8d6e63, 0, 0.03, 0, g, 14); cyl(0.6, 0.6, 0.015, 0xffe3e3, 0, 0.865, 0, g, 20);
  for (const [x, z] of [[0.45, 0.3], [-0.5, 0.25]]) { cyl(0.17, 0.13, 0.02, 0xffffff, x, 0.88, z, g, 12); cyl(0.1, 0.075, 0.12, 0xffffff, x, 0.95, z, g, 12); cyl(0.085, 0.085, 0.01, 0xc9743c, x, 1.0, z, g, 10); flatX(tor(0.045, 0.012, 0xffffff, x + 0.12, 0.95, z, g)).rotation.y = PI / 2; }
  cyl(0.09, 0.09, 0.16, 0xffd43b, -0.2, 0.94, -0.45, g, 10); cyl(0.095, 0.095, 0.03, 0x8d6e63, -0.2, 1.03, -0.45, g, 10); ell(0.07, 1.2, 0.8, 0.8, 0xffe066, 0.35, 0.92, -0.42, g);
  bake(g);
  const pot = dyn(g, 0, 0.87, -0.05); lathe([[0.0, 0.0], [0.16, 0.0], [0.23, 0.1], [0.24, 0.2], [0.17, 0.32], [0.1, 0.35]], 0x74c0fc, 0, 0, 0, pot); ell(0.11, 1, 0.35, 1, 0x4dabf7, 0, 0.36, 0, pot); sph(0.035, 0xffd43b, 0, 0.42, 0, pot); const spt = cap(0.03, 0.2, 0x74c0fc, 0.27, 0.22, 0, pot); spt.rotation.z = -0.9; flatX(tor(0.09, 0.02, 0x4dabf7, -0.26, 0.2, 0, pot)).rotation.y = PI / 2; bake(pot);
  addSign(th, 2.7);
  th.challenge = () => { const a = th.cur = wa[pickI(th, wa.length)]; return { tag: '해 줄 말 고르기', pic: '🤒💬', ko: '아픈 친구에게 <b>「' + esc(a[1]) + '」</b> 하고 말해 주고 싶어요', choices: [a[0]].concat(others(wa.map(x => x[0]), a[0], 3)), right: a[0], after: [a[0]] }; };
  th.use = () => { th.busy = 3.5; tw(2.2, k => { pot.rotation.z = -Math.sin(Math.min(1, k * 1.4) * PI) * 0.7; pot.position.y = 0.87 + Math.sin(k * PI) * 0.25; pot.position.x = Math.sin(k * PI) * 0.18; }, () => { pot.rotation.z = 0; }); for (let i = 0; i < 3; i++) later(0.6 + i * 0.5, () => { const w = th.W(0.45, 1.35, 0.3); emo(i === 2 ? '🍵' : '♨️', w[0], w[1], w[2], 0.6); G.beep([[520 + i * 60, .05], [400, .05]]); }); cheer(th, null, '🫖 따뜻한 차 한 잔! 친구가 고마워해요', 2600); };
};
// L4 · 열두 달 돌림판
THEME3[4] = () => {
  const mo = (L.months || []).filter(m => Array.isArray(m) && m[0] && m[1]); if (mo.length !== 12) return;
  const th = mkStation('months', '🎡', '열두 달 돌림판', 2.0, { solid: 0.5, verb: '돌리기' }); if (!th) return; const g = th.g;
  for (const s of [-1, 1]) { const p = cyl(0.07, 0.09, 2.5, 0xe8590c, s * 0.75, 1.15, -0.2, g, 8); p.rotation.z = s * 0.28; } cyl(0.9, 1.0, 0.12, 0x868e96, 0, 0.06, -0.2, g, 16); flatZ(cyl(0.1, 0.1, 0.5, 0xced4da, 0, 2.05, -0.1, g, 10));
  const pt = cone(0.13, 0.3, 0xe03131, 0, 3.42, 0.08, g, 4); pt.rotation.x = PI; pt.scale.z = 0.4;
  bake(g);
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'), COL = ['#74c0fc', '#a5d8ff', '#b2f2bb', '#8ce99a', '#d8f5a2', '#ffec99', '#ffd43b', '#ffa94d', '#ffc078', '#ffa8a8', '#e599f7', '#b197fc'];
  for (let i = 0; i < 12; i++) { const a0 = -PI / 2 + (i - 0.5) * PI / 6; x.fillStyle = COL[i]; x.beginPath(); x.moveTo(256, 256); x.arc(256, 256, 250, a0, a0 + PI / 6); x.closePath(); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 4; x.stroke(); const am = a0 + PI / 12; x.save(); x.translate(256 + Math.cos(am) * 185, 256 + Math.sin(am) * 185); x.rotate(am + PI / 2); x.fillStyle = '#1d3557'; x.font = "bold 40px 'Jua','Malgun Gothic',sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i + 1), 0, 0); x.restore(); }
  x.fillStyle = '#fff'; x.beginPath(); x.arc(256, 256, 60, 0, 7); x.fill(); x.fillStyle = '#e8590c'; x.font = "bold 44px 'Jua','Malgun Gothic',sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('월', 256, 258);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const wh = dyn(g, 0, 2.05, 0.12); const disc = noRay(new THREE.Mesh(new THREE.CircleGeometry(1.25, 36), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }))); disc.userData.camBig = 0; wh.add(disc); const rim = tor(1.25, 0.05, 0xffd43b, 0, 0, 0, wh); rim.userData.keep = 1; for (let i = 0; i < 12; i++) sph(0.05, 0xffffff, Math.cos(i * PI / 6) * 1.25, Math.sin(i * PI / 6) * 1.25, 0.03, wh);
  const back = noRay(new THREE.Mesh(new THREE.CircleGeometry(1.25, 24), new THREE.MeshBasicMaterial({ color: 0xffe8cc }))); back.rotation.y = PI; back.position.z = -0.02; wh.add(back);
  addSign(th, 4.0);
  th.ang = 0; th.to = 0; const SE = ['⛄', '⛄', '🌸', '🌸', '🌸', '☀️', '☀️', '☀️', '🍁', '🍁', '🍁', '⛄'];
  th.challenge = () => { const i = th.mi = pickI(th, 12), m = mo[i]; th.to = Math.ceil(th.ang / (PI * 2)) * PI * 2 + PI * 4 + i * PI / 6; tune([440, 494, 523, 587, 659], 0.12, 0.08); return { tag: '달 이름 말하기', pic: '📅 ' + esc(m[1]), ko: '돌림판이 멈춘 달을 영어로 골라요', choices: [m[0]].concat(others(mo.map(q => q[0]), m[0], 3)), right: m[0], after: [m[0]] }; };
  th.use = () => { th.busy = 2.5; const w = th.W(0, 3.5, 0.2); burst(w[0], w[1], w[2], { n: 18, sp: 3, life: 1, size: 0.32, cols: [0xffd43b, 0xff8fab, 0x74c0fc], g: 3 }); emo(SE[th.mi | 0], w[0], w[1] + 0.3, w[2], 0.9); tune([659, 784, 1046], 0.14); cheer(th, null, '🎡 ' + esc(mo[th.mi | 0][0]) + ' = ' + esc(mo[th.mi | 0][1]), 2600); };
  th.tick = (dt) => { th.ang += (th.to - th.ang) * Math.min(1, dt * 2.2); wh.rotation.z = th.ang; };
};
// L5 · 나무 심기 (We should …)
THEME3[5] = () => {
  const sh = (L.shoulds || []).filter(s => s && s.id && s.ko), we = (s) => swap(S4[2] && S4[2].en, 'save energy', s.id); if (sh.length < 3 || !we(sh[0])) return;
  const th = mkStation('plant', '🌳', '나무 심기', 1.9, { solid: 0.7, verb: '심기' }); if (!th) return; const g = th.g;
  cyl(0.95, 0.8, 0.5, 0xc9743c, 0, 0.25, 0, g, 18); flatZ(tor(0.95, 0.06, 0xb5632e, 0, 0.5, 0, g)); cyl(0.86, 0.86, 0.04, 0x6b4a2b, 0, 0.5, 0, g, 18);
  lathe([[0.0, 0.0], [0.16, 0.0], [0.2, 0.08], [0.2, 0.3], [0.16, 0.33]], 0x4dabf7, 1.25, 0, 0.5, g); const sp0 = cap(0.025, 0.3, 0x4dabf7, 1.5, 0.24, 0.5, g); sp0.rotation.z = -0.9; flatX(tor(0.1, 0.02, 0x339af0, 1.02, 0.2, 0.5, g)).rotation.y = PI / 2;
  bake(g);
  const st = [dyn(g, 0, 0.52, 0), dyn(g, 0, 0.52, 0), dyn(g, 0, 0.52, 0)];
  cyl(0.02, 0.025, 0.25, 0x51cf66, 0, 0.12, 0, st[0], 5); for (const s of [-1, 1]) ell(0.09, 1.4, 0.3, 0.7, 0x69db7c, s * 0.1, 0.26, 0, st[0]).rotation.z = s * 0.5;
  cyl(0.05, 0.07, 0.9, 0x8d6e63, 0, 0.45, 0, st[1], 7); sph(0.34, 0x40c057, 0, 1.05, 0, st[1]); sph(0.22, 0x51cf66, 0.2, 1.25, 0.1, st[1]);
  cyl(0.09, 0.13, 1.5, 0x7a5230, 0, 0.75, 0, st[2], 8); for (const [x, y, z, r] of [[0, 1.9, 0, 0.62], [0.45, 1.6, 0.15, 0.42], [-0.42, 1.65, -0.1, 0.45], [0.05, 2.35, 0.05, 0.38]]) sph(r, [0x2f9e44, 0x37b24d, 0x40c057][Math.round(r * 10) % 3], x, y, z, st[2]); for (let i = 0; i < 7; i++) sph(0.07, i % 2 ? 0xe03131 : 0xff8fab, Math.cos(i * 0.9) * 0.55, 1.65 + (i % 3) * 0.25, Math.sin(i * 0.9) * 0.5, st[2]);
  st.forEach(s => { bake(s); s.visible = false; s.scale.setScalar(0.01); });
  addSign(th, 3.6); th.n = 0;
  th.label = () => th.busy > 0 ? null : th.n >= 3 ? '나무 다시 심기' : '나무 심기 (' + th.n + '/3)';
  th.freeNow = () => th.n >= 3;
  th.challenge = () => { const s = th.cur = sh[pickI(th, sh.length)]; return { tag: '해야 할 일 말하기', pic: esc(s.emoji || '🌱') + ' ' + esc(s.ko), ko: '지구를 위해 우리가 해야 할 일을 영어로 골라요', choices: sh.map(we), right: we(s), after: [we(s)] }; };
  th.use = () => {
    if (th.n >= 3) { th.n = 0; st.forEach(s => { s.visible = false; s.scale.setScalar(0.01); }); G.toast('🌱 새 씨앗을 심을 자리가 생겼어요', 1600); return; }
    th.busy = 2.2; const s = st[th.n], w = th.W(0, 1.2, 0); st.forEach(q => { q.visible = false; }); s.visible = true; tw(0.9, k => s.scale.setScalar(Math.max(0.01, k + 0.25 * Math.sin(k * PI) * (1 - k))));
    burst(w[0], w[1] + th.n * 0.5, w[2], { n: 12, sp: 2, life: 0.8, size: 0.26, cols: [0x74c0fc, 0xd0ebff], g: 8 }); G.beep([[392 + th.n * 130, .06], [523 + th.n * 150, .1]]); th.n++;
    if (th.n >= 3) cheer(th, '🌳', '🌳 나무가 다 자랐어요! 지구가 시원해져요', 3000); else tell(null, '🌱 쑥쑥! 나무 ' + th.n + '/3', 1600);
  };
};
// L6 · 탈춤 추기
THEME3[6] = () => {
  const cu = (L.cultures || []).filter(c => c && c.id && c.kind), c0 = cu.find(c => /talchum/i.test(c.id)), ask = (c) => swap(S4[0] && S4[0].en, 'yakgwa', c.id), its = (c) => swap(S4[2] && S4[2].en, 'cookie', c.kind), yes = S4[1];
  if (!c0 || cu.length < 4 || !ask(c0) || !its(c0)) return;
  const th = mkStation('talchum', '🎭', '탈춤 추기', 2.1, { verb: '춤추기' }); if (!th) return; const g = th.g;
  cyl(1.9, 1.9, 0.05, 0xf8f0e3, 0, 0.03, 0, g, 26); flatZ(tor(1.9, 0.05, 0xc92a2a, 0, 0.05, 0, g)); flatZ(tor(1.2, 0.03, 0x1c7ed6, 0, 0.06, 0, g));
  for (const s of [-1, 1]) cyl(0.05, 0.06, 2.0, 0x8d6e63, s * 1.0, 1.0, -1.3, g, 8); cap(0.045, 2.1, 0x8d6e63, 0, 1.95, -1.3, g).rotation.z = PI / 2;
  const mask = (pp, c, cheek) => { ell(0.26, 0.9, 1.15, 0.35, c, 0, 0, 0, pp); for (const s of [-1, 1]) { ell(0.055, 1.5, 0.7, 0.5, 0x212529, s * 0.09, 0.07, 0.08, pp).rotation.z = s * 0.35; sph(0.06, cheek, s * 0.14, -0.07, 0.07, pp); cone(0.05, 0.14, c, s * 0.2, 0.26, 0, pp, 5).rotation.z = -s * 0.5; } const mo = tor(0.1, 0.022, 0xc92a2a, 0, -0.08, 0.09, pp, PI); mo.rotation.z = PI; ell(0.04, 1, 1.3, 1, c, 0, -0.01, 0.1, pp); };
  [[-0.6, 0xffffff, 0xff8787], [0, 0xe03131, 0xffd43b], [0.6, 0x343a40, 0xff8787]].forEach(([x, c, k]) => { const m = dyn(g, x, 1.55, -1.27); mask(m, c, k); bake(m); });
  bake(g);
  const mm = new THREE.Group(); mm.userData.dyn = 1; mm.userData.playDeco = 'mask'; mask(mm, 0xffffff, 0xff8787); bake(mm); mm.position.set(0, 0, 0.3);
  addSign(th, 3.0);
  th.challenge = () => ({ tag: '전통 춤 설명하기', pic: esc(c0.emoji || '🎭') + ' ' + esc(c0.ko), en: ask(c0), ko: '무엇인지 영어로 설명해요', say: [ask(c0)], choices: [its(c0)].concat(others(cu.map(its), its(c0), 3)), right: its(c0), after: yes ? [yes.en, its(c0)] : [its(c0)] });
  th.use = () => { th.busy = 6; ST.danceT = 5.5; ST.mask = 'mask'; ST.maskM = mm; decoTick(); [0, 0.5, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 3.25, 3.5, 4.0, 4.5, 5.0].forEach((t, i) => later(t, () => G.beep([[i % 3 ? 131 : 98, .18]]))); later(5.6, () => { ST.mask = null; decoTick(); }); cheer(th, null, '🎭 덩기덕 쿵더러러! 탈을 쓰고 춤춰요', 3000); };
};
// L7 · 팬케이크 쌓기 (얼마나 자주)
THEME3[7] = () => {
  const NUM = { once: 1, twice: 2, three: 3, four: 4, five: 5, six: 6, every: 7 }, wf = (L.writeFreq || []).filter(f => Array.isArray(f) && f[0] && f[1] && NUM[f[0].split(' ')[0]]); if (wf.length < 4) return;
  const th = mkStation('pancake', '🥞', '팬케이크 쌓기', 1.9, { solid: 0.8, verb: '쌓기' }); if (!th) return; const g = th.g;
  box(1.7, 0.85, 0.8, 0xffffff, 0, 0.43, -0.2, g); box(1.8, 0.07, 0.9, 0x495057, 0, 0.89, -0.2, g); for (const x of [-0.5, 0, 0.5]) flatZ(cyl(0.05, 0.05, 0.04, 0xe03131, x, 0.6, 0.21, g, 8));
  cyl(0.3, 0.26, 0.05, 0x212529, -0.45, 0.95, -0.25, g, 16); const hd = cap(0.03, 0.4, 0x8d6e63, -0.45, 0.96, 0.22, g); hd.rotation.x = PI / 2;
  cyl(0.36, 0.3, 0.03, 0xffffff, 0.42, 0.94, -0.2, g, 18); cyl(0.07, 0.09, 0.26, 0xc9743c, 0.78, 1.05, -0.5, g, 10); cone(0.06, 0.1, 0xffd43b, 0.78, 1.23, -0.5, g, 8);
  bake(g);
  const cakes = [0, 1, 2, 3, 4, 5, 6].map(i => { const c = new THREE.Group(); c.userData.dyn = 1; cyl(0.27, 0.27, 0.06, 0xe9b96e, 0, 0, 0, c, 16); flatZ(tor(0.27, 0.03, 0xd49a4a, 0, 0, 0, c)); bake(c); c.visible = false; scene.add(c); th.objs.push(c); return c; });
  const top = new THREE.Group(); top.userData.dyn = 1; box(0.1, 0.05, 0.1, 0xffe066, 0, 0.03, 0, top); ell(0.2, 1, 0.12, 1, 0xb5632e, 0, 0, 0, top); sph(0.05, 0xe03131, 0.1, 0.05, 0.08, top); bake(top); top.visible = false; scene.add(top); th.objs.push(top);
  addSign(th, 2.8);
  th.challenge = () => { const f = th.cur = wf[pickI(th, wf.length)]; return { tag: '횟수 말하기', pic: '🗓️ ' + esc(f[1]), ko: '얼마나 자주인지 영어로 골라요', choices: [f[0]].concat(others(wf.map(q => q[0]), f[0], 3)), right: f[0], after: [f[0]] }; };
  th.use = () => { const f = th.cur || wf[0], n = NUM[f[0].split(' ')[0]] || 1; th.busy = n * 0.4 + 2; cakes.forEach(c => { c.visible = false; }); top.visible = false;
    for (let i = 0; i < n; i++) later(0.2 + i * 0.4, () => { const to = th.W(0.42, 0.99 + i * 0.07, -0.2); toss(cakes[i], th.W(-0.45, 1.05, -0.25), to, 0.35, 0.7, () => G.beep([[330 + i * 40, .05]])); emo(String(i + 1), to[0], to[1] + 0.6, to[2], 0.5); });
    later(0.4 + n * 0.4, () => { const to = th.W(0.42, 0.99 + n * 0.07, -0.2); top.position.set(to[0], to[1], to[2]); top.visible = true; G.beep('get'); cheer(th, null, '🥞 팬케이크 ' + n + '장! <small>' + esc(f[0]) + ' = ' + esc(f[1]) + '</small>', 3000); });
    later(9, () => { cakes.forEach(c => { c.visible = false; }); top.visible = false; }); };
};
// L8 · 표정 거울 (왜 그런지 물어보기)
THEME3[8] = () => {
  const fe = (L.feelings || []).filter(f => f && f.id && f.emoji), why = (f) => swap(S4[0] && S4[0].en, 'happy', f.id), cheerUp = S4[3]; if (fe.length < 4 || !why(fe[1])) return;
  const th = mkStation('mirror', '🪞', '표정 거울', 1.8, { solid: 0.5, verb: '묻기' }); if (!th) return; const g = th.g;
  cyl(0.7, 0.8, 0.12, 0x8d6e63, 0, 0.06, 0, g, 16); cyl(0.07, 0.1, 0.7, 0x8d6e63, 0, 0.45, 0, g, 8);
  const fr = tor(0.75, 0.09, 0xffd43b, 0, 1.75, 0, g); fr.scale.set(1, 1.3, 1); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; sph(0.07, i % 2 ? 0xff8fab : 0xffffff, Math.cos(a) * 0.75, 1.75 + Math.sin(a) * 0.98, 0.06, g); } ell(0.16, 1.4, 0.8, 0.6, 0xffd43b, 0, 2.82, 0, g);
  bake(g);
  const glass = flatZ(cyl(0.72, 0.72, 0.03, new THREE.MeshStandardMaterial({ color: 0xd0ebff, roughness: 0.1, metalness: 0.4 }), 0, 1.75, -0.02, g, 28)); glass.scale.set(1, 1, 1.3);
  const face = emoSprite(fe[0].emoji, 0.95); face.position.set(0, 1.75, 0.12); g.add(face);
  addSign(th, 3.5);
  th.challenge = () => { const f = th.cur = fe[pickI(th, fe.length)]; emoSet(face, f.emoji); return { tag: '이유 물어보기', pic: f.emoji + ' ' + esc(f.ko), ko: '거울 속 친구에게 왜 그런지 물어봐요', choices: [why(f)].concat(others(fe.map(why), why(f), 3)), right: why(f), after: [why(f)] }; };
  th.use = () => { th.busy = 3; const w = th.W(0, 1.8, 0.3), f = th.cur || fe[0]; later(0.7, () => { emoSet(face, '😄'); burst(w[0], w[1], w[2], { n: 16, sp: 2.6, life: 0.9, size: 0.3, cols: [0xffd43b, 0xffffff, 0xff8fab], g: 1 }); if (f.id !== 'happy' && cheerUp) { try { SPEAK(cheerUp.en, 'Teacher'); } catch (e) {} } }); tune([523, 659, 784], 0.16); later(8, () => emoSet(face, f.emoji)); cheer(th, null, '🪞 ' + f.emoji + ' → 😄 친구의 마음을 물어봐 줬어요', 2800); };
};

// L9 · 야구 연습장 (할 일 말하기)
THEME3[9] = () => {
  const pl = (L.plans || []).filter(p => p && p.id), tm = (L.times || []).filter(t => t && t.id), p0 = pl.find(p => /baseball/.test(p.id)), bye = S4[3];
  const what = (t) => swap(S4[0] && S4[0].en, 'tomorrow', t.id), going = (p) => swap(S4[1] && S4[1].en, 'walk the dog', p.id);
  if (!p0 || !tm.length || pl.length < 4 || !what(tm[0]) || !going(p0)) return;
  const th = mkStation('bat', '⚾', '야구 연습장', 2.6, { verb: '치기' }); if (!th) return; const g = th.g;
  cyl(2.3, 2.3, 0.04, 0xc9a66b, 0, 0.025, 0, g, 28); cyl(0.5, 0.5, 0.045, 0xffffff, 0, 0.03, 1.3, g, 5); box(0.7, 0.05, 0.06, 0xffffff, 0, 0.05, -0.9, g);
  box(0.6, 0.7, 0.6, 0x1c7ed6, 0, 0.5, -1.9, g); for (const s of [-1, 1]) flatX(cyl(0.3, 0.3, 0.14, 0x212529, s * 0.37, 0.3, -1.9, g, 14)); const tb = cap(0.1, 0.5, 0x495057, 0, 0.95, -1.6, g); tb.rotation.x = PI / 2; sph(0.06, 0xe03131, 0.2, 0.9, -1.62, g);
  for (const s of [-1, 1]) { cyl(0.04, 0.04, 2.2, 0xadb5bd, s * 1.6, 1.1, 1.9, g, 6); } cap(0.035, 3.2, 0xadb5bd, 0, 2.2, 1.9, g).rotation.z = PI / 2;
  bake(g);
  const net = noRay(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.1, 8, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.5 }))); net.position.set(0, 1.1, 1.9); net.userData.camBig = 0; g.add(net);
  const bat = dyn(g, 0.55, 1.0, 1.2); cap(0.035, 0.5, 0xdeb887, 0, 0, -0.3, bat).rotation.x = PI / 2; cap(0.055, 0.35, 0xdeb887, 0, 0, -0.75, bat).rotation.x = PI / 2; sph(0.05, 0x8d6e63, 0, 0, 0.0, bat); bake(bat); bat.rotation.y = -0.9;
  const ball = sph(0.075, 0xffffff, 0, 0, 0, scene); ball.visible = false; th.objs.push(ball);
  addSign(th, 3.2);
  th.challenge = () => { const t = tm[rndI(tm.length)]; return { tag: '할 일 말하기', pic: esc(p0.emoji || '⚾') + ' ' + esc(p0.ko) + ' <small>' + esc(t.ko) + '</small>', en: what(t), ko: '그림을 보고 무엇을 할지 대답해요', say: [what(t)], choices: [going(p0)].concat(others(pl.map(going), going(p0), 3)), right: going(p0), after: bye ? [going(p0), [bye.en, 'Teacher']] : [going(p0)] }; };
  th.use = () => { th.busy = 6;
    for (let i = 0; i < 3; i++) later(0.3 + i * 1.7, () => { const a = th.W(0, 0.95, -1.3), b = th.W(0.1, 1.0, 1.15); G.beep([[500, .04]]); toss(ball, a, b, 0.45, 0.15, () => { G.beep([[900, .03], [400, .06], [250, .08]]); tw(0.3, k => { bat.rotation.y = -0.9 + Math.sin(k * PI) * 2.6; }); const far = th.W((i - 1) * 9, 6 + i * 2, -22); toss(ball, b, far, 1.1, 5, () => { ball.visible = false; }); const w = th.W(0, 2.6, 0); emo(i === 2 ? '🎉' : '⚾', w[0], w[1], w[2], 0.7); }); });
    later(5.2, () => cheer(th, null, '⚾ 딱! 딱! 딱! 공을 멀리 쳤어요', 2800)); };
};
// L10 · 비교 전시대 (bigger · longer · stronger · taller)
THEME3[10] = () => {
  const cards = (L.cards || []).filter(c => c && c.en && c.word), wd = L.words || [], pool = cards.filter(c => /^(bigger|longer|stronger|taller)$/.test(c.word)); if (pool.length < 2 || cards.length < 4) return;
  const th = mkStation('compare', '🔍', '비교 전시대', 2.0, { solid: 0.9, verb: '보기' }); if (!th) return; const g = th.g;
  cyl(1.5, 1.6, 0.5, 0x7048e8, 0, 0.25, 0, g, 24); flatZ(tor(1.52, 0.05, 0xffd43b, 0, 0.5, 0, g)); for (let i = 0; i < 8; i++) sph(0.07, 0xffd43b, Math.cos(i * PI / 4) * 1.58, 0.3, Math.sin(i * PI / 4) * 1.58, g);
  bake(g);
  const tt = dyn(g, 0, 0.5, 0); cyl(1.35, 1.35, 0.06, 0xf8f0e3, 0, 0.03, 0, tt, 24);
  const sc = {}, person = (pp, x, h, c) => { cap(0.14, h - 0.55, c, x, (h - 0.27) / 2 + 0.04, 0, pp); sph(0.15, 0xf5cfa8, x, h - 0.13, 0, pp); ell(0.16, 1, 0.6, 1, 0x5c4033, x, h - 0.04, -0.02, pp); for (const s of [-1, 1]) sph(0.02, 0x212529, x + s * 0.055, h - 0.12, 0.135, pp); };
  { const s = sc.bigger = dyn(tt, 0, 0.06, 0); sph(0.38, 0xe8731c, -0.42, 0.38, 0, s); tor(0.382, 0.012, 0x3a2a1a, -0.42, 0.38, 0, s); flatZ(tor(0.382, 0.012, 0x3a2a1a, -0.42, 0.38, 0, s)); sph(0.24, 0xffffff, 0.5, 0.24, 0, s); for (let i = 0; i < 6; i++) sph(0.07, 0x212529, 0.5 + Math.cos(i * 1.05) * 0.2, 0.24 + Math.sin(i * 1.05) * 0.2 * (i % 2 ? 1 : -0.4), 0.13 * (i % 2 ? 1 : -1), s); bake(s); }
  { const s = sc.longer = dyn(tt, 0, 0.06, 0); const pen = (z, len, c) => { flatX(cyl(0.06, 0.06, len, c, 0, 0.07, z, s, 6)); const t = cone(0.06, 0.16, 0xf3d9b1, len / 2 + 0.08, 0.07, z, s, 6); t.rotation.z = -PI / 2; const e = flatX(cyl(0.062, 0.062, 0.1, 0xff8fab, -len / 2 - 0.05, 0.07, z, s, 6)); void e; }; pen(-0.22, 1.5, 0x40c057); pen(0.25, 0.85, 0x339af0); bake(s); }
  { const s = sc.stronger = dyn(tt, 0, 0.06, 0); person(s, -0.4, 1.15, 0xe03131); person(s, 0.5, 1.05, 0x339af0); flatX(cyl(0.025, 0.025, 0.9, 0x495057, -0.4, 1.4, 0, s, 6)); for (const k of [-1, 1]) { flatX(cyl(0.16, 0.16, 0.08, 0x212529, -0.4 + k * 0.42, 1.4, 0, s, 12)); cap(0.035, 0.24, 0xe03131, -0.4 + k * 0.17, 1.22, 0, s); } bake(s); }
  { const s = sc.taller = dyn(tt, 0, 0.06, 0); person(s, -0.35, 1.45, 0x12b886); person(s, 0.4, 1.0, 0xf08c00); box(0.1, 1.6, 0.04, 0xfff3bf, 0.95, 0.8, 0, s); for (let i = 1; i < 8; i++) box(0.06, 0.012, 0.045, 0x495057, 0.93, i * 0.2, 0, s); bake(s); }
  const show = (w) => { for (const k in sc) sc[k].visible = k === w; }; show(pool[0].word);
  addSign(th, 3.0);
  th.challenge = () => { const c = th.cur = pool[pickI(th, pool.length)]; show(c.word); G.beep([[600, .04], [800, .05]]); return { tag: '비교해서 말하기', pic: '🔍', ko: '전시대의 두 가지를 보고 비교하는 문장을 골라요', choices: [c.en].concat(others(cards.map(x => x.en), c.en, 3)), right: c.en, after: [c.en], afterKo: (wd.find(w => w.id === c.word) || {}).ko }; };
  th.use = () => { th.busy = 2.6; tw(2.2, k => { tt.rotation.y = smooth(k) * PI * 2; }, () => { tt.rotation.y = 0; }); tune([523, 784, 1046], 0.14); const w = th.W(0, 2.2, 0); burst(w[0], w[1], w[2], { n: 14, sp: 2.4, life: 0.8, size: 0.3, cols: [0xffd43b, 0xffffff], g: 2 }); cheer(th, null, '🔍 ' + esc((th.cur || pool[0]).en), 3000); };
};
// L11 · 지하철역 (가는 방법 듣기)
THEME3[11] = () => {
  const sw = L.stopWords || {}, src = (L.mapGame || []).concat(L.findGame || []).filter(d => d && d.name && d.line && d.stopLabel && sw[d.stop]);
  const tell2 = (d) => { const a = swap(S4[1] && S4[1].en, 'Bus Number 5', d.line); return a && swap(a, 'the market', d.stopLabel); }, howq = (d) => swap(S4[0] && S4[0].en, 'the library', 'the ' + d.name);
  if (src.length < 3 || !tell2(src[0]) || !howq(src[0])) return;
  const th = mkStation('subway', '🚇', '꼬마 지하철역', 2.6, { verb: '보내기' }); if (!th) return; const g = th.g;
  box(4.6, 0.3, 1.4, 0xdee2e6, 0, 0.15, 0.6, g); box(4.6, 0.04, 0.16, 0xffd43b, 0, 0.32, -0.02, g); box(4.6, 0.08, 1.2, 0x495057, 0, 0.04, -0.75, g); for (const z of [-1.05, -0.45]) box(4.6, 0.06, 0.07, 0xadb5bd, 0, 0.11, z, g); for (let i = 0; i < 10; i++) box(0.14, 0.03, 0.8, 0x8d6e63, -2.1 + i * 0.46, 0.085, -0.75, g);
  for (const x of [-1.7, 1.7]) cyl(0.06, 0.07, 2.2, 0x868e96, x, 1.4, 0.95, g, 8); flatX(cyl(0.6, 0.6, 4.2, 0x339af0, 0, 2.35, 0.75, g, 14)).scale.set(1, 1, 0.3); box(1.5, 0.4, 0.06, 0x1c7ed6, 0, 1.9, 1.0, g);
  box(0.7, 0.9, 0.3, 0xffffff, -1.2, 0.75, 0.9, g); box(0.5, 0.25, 0.04, 0x74c0fc, -1.2, 0.95, 1.06, g);
  bake(g);
  const tr = dyn(g, -9, 0.14, -0.75); for (const x of [-1.0, 1.0]) { box(1.8, 0.75, 0.9, 0x2f9e44, x, 0.55, 0, tr); flatX(cyl(0.45, 0.45, 1.8, 0xf8f9fa, x, 0.95, 0, tr, 14)).scale.set(1, 1, 0.5); for (const k of [-0.5, 0, 0.5]) box(0.36, 0.3, 0.92, 0xa5d8ff, x + k, 0.68, 0, tr); for (const k of [-0.55, 0.55]) for (const s of [-1, 1]) flatZ(cyl(0.14, 0.14, 0.08, 0x212529, x + k, 0.14, s * 0.4, tr, 10)); } flatZ(cap(0.4, 0.1, 0x2f9e44, 1.95, 0.55, 0, tr)); sph(0.08, 0xfff3bf, 2.3, 0.45, 0, tr); box(0.2, 0.1, 0.5, 0x495057, 0, 0.35, 0, tr);
  bake(tr); tr.visible = false;
  const sg = emoSprite('🚇', 0.34); sg.position.set(0, 1.9, 1.05); g.add(sg);
  addSign(th, 3.4);
  const lab = (d) => (/Subway/.test(d.line) ? '🚇 ' : '🚌 ') + ((/(\d+)/.exec(d.line) || [])[1] || '') + ' → ' + (sw[d.stop][1] || '') + ' ' + (sw[d.stop][2] || '');
  th.challenge = () => { const d = th.cur = src[pickI(th, src.length)]; return { tag: '듣고 고르기', pic: '🚇🗺️', en: howq(d), ko: '가는 방법을 잘 듣고 알맞은 그림을 골라요', say: [[howq(d), 'Boy'], [tell2(d), 'Girl']], choices: uniq(src.map(lab)), right: lab(d), after: [tell2(d)] }; };
  th.use = () => { th.busy = 4.5; tr.visible = true; tune([523, 659, 523, 659], 0.25, 0.2); tw(4, k => { tr.position.x = -9 + smooth(k) * 18; }, () => { tr.visible = false; }); later(1.6, () => { const w = th.W(0, 1.6, -0.75); emo('🚇', w[0], w[1] + 1, w[2], 0.8); }); cheer(th, null, '🚇 지하철이 출발해요! 안녕~', 2800); };
};
// L12 · 기념품 가게 (두 친구의 생각 듣기)
THEME3[12] = () => {
  const ls = (L.listen || []).filter(d => d && d.a && d.b && d.a[1] && d.b[1] && typeof d.agree === 'boolean'); if (ls.length < 3) return;
  const th = mkStation('shop', '🧣', '기념품 가게', 2.2, { solid: 0.9, verb: '듣기' }); if (!th) return; const g = th.g;
  box(2.6, 0.9, 0.7, 0xffe8cc, 0, 0.45, -0.5, g); box(2.7, 0.08, 0.8, 0xc92a2a, 0, 0.94, -0.5, g); for (const s of [-1, 1]) cyl(0.06, 0.06, 2.7, 0xffffff, s * 1.3, 1.35, -0.85, g, 8);
  for (let i = 0; i < 7; i++) { const a = box(0.39, 0.05, 1.0, i % 2 ? 0xffffff : 0x2f9e44, -1.17 + i * 0.39, 2.72, -0.45, g); a.rotation.x = 0.3; sph(0.07, i % 2 ? 0xffffff : 0x2f9e44, -1.17 + i * 0.39, 2.54, 0.02, g); }
  box(2.5, 0.06, 0.4, 0xdeb887, 0, 1.75, -0.8, g); box(2.5, 1.6, 0.06, 0xfff3bf, 0, 1.75, -1.0, g);
  // 진열품: 목도리 · 모자 · 컵 · 책
  for (const dx of [-0.07, 0.07]) cap(0.05, 0.4, 0xae3ec9, -0.9 + dx, 1.25, -0.5, g); ell(0.13, 1, 0.5, 0.7, 0xe599f7, -0.9, 1.5, -0.5, g);
  ell(0.2, 1, 0.7, 1, 0xe03131, -0.3, 1.1, -0.5, g); sph(0.06, 0xffffff, -0.3, 1.26, -0.5, g); flatZ(tor(0.2, 0.035, 0xffffff, -0.3, 1.02, -0.5, g));
  cyl(0.11, 0.09, 0.22, 0x74c0fc, 0.3, 1.09, -0.5, g, 12); flatX(tor(0.06, 0.016, 0x74c0fc, 0.43, 1.09, -0.5, g)).rotation.y = PI / 2;
  box(0.34, 0.08, 0.26, 0x2b8a3e, 0.9, 1.02, -0.5, g); box(0.32, 0.06, 0.24, 0xffffff, 0.91, 1.03, -0.5, g); for (const x of [-0.8, 0, 0.8]) sph(0.11, [0xffd43b, 0x4dabf7, 0xff8fab][Math.round(x + 1)], x, 1.89, -0.8, g);
  bake(g);
  const item = emoSprite('🧣', 0.6); item.position.set(0, 2.25, -0.4); g.add(item);
  addSign(th, 3.6);
  th.challenge = () => { const d = th.cur = ls[pickI(th, ls.length)]; emoSet(item, d.emoji || '🎁'); const Y = '생각이 같아요 🙆', N = '생각이 달라요 🙅'; return { tag: '두 친구의 말 듣기', pic: esc(d.emoji || '') + ' ' + esc(d.price || ''), ko: '두 친구의 말을 잘 듣고, 생각이 같은지 골라요', say: [[d.a[1], d.a[0]], [d.b[1], d.b[0]]], choices: [Y, N], keep: true, right: d.agree ? Y : N, after: [[d.b[1], d.b[0]]], afterKo: d.b[1] }; };
  th.use = () => { th.busy = 2.6; hop(item, 0.4, 0.5, 2.25); tune([659, 880, 1175], 0.14); const w = th.W(0, 2.4, -0.3); burst(w[0], w[1], w[2], { n: 14, sp: 2.4, life: 0.8, size: 0.3, cols: [0xffd43b, 0xffffff, 0xff8fab], g: 2 }); cheer(th, null, '🧣 두 친구의 생각을 잘 들었어요!', 2600); };
};

// ---------------- 처음 한 번: 자리를 잡고 놀이 기구를 놓아요 ----------------
function init() {
  if (!buildGrid()) return false;
  FLY.H = clamp(GR.maxH + 2.6, 9, 16);
  // ✈️
  const strip = findStrip(5.5, FLY.H, true) || findStrip(3.6, FLY.H, true) || findStrip(5.5, FLY.H) || findStrip(3.6, FLY.H);
  if (strip) buildAirfield(strip);
  // ⚽
  buildBalls();
  const playAt = ST.placed.length ? [ST.placed[ST.placed.length - 1].x, ST.placed[ST.placed.length - 1].z] : [0, 0];
  // ⛲ (이미 분수가 있는 단원은 그 분수를 써요)
  const engF = (G.FX2.fountains || [])[0]; let fAt = null;
  if (engF) { buildFountain(null, engF); fAt = [engF.x, engF.z]; }
  else { const sp = spot(3.5); if (sp) { buildFountain(sp); fAt = [sp.x, sp.z]; } }
  // 🪑 이미 있는 벤치 + (모자라면) 분수 옆 벤치 하나
  let nb = 0;
  for (const bg of findBenches()) { const rot = bg.rotation.y, x = bg.position.x, z = bg.position.z; if (nb < 4 && reachAt(x + Math.sin(rot) * 0.7, z + Math.cos(rot) * 0.7)) { buildBench(bg, x, z, rot, false); nb++; } }
  if (nb < 2) { const sp = spot(1.5, fAt ? { near: fAt, nearW: 0.5 } : null); if (sp) { const rot = fAt ? Math.atan2(fAt[0] - sp.x, fAt[1] - sp.z) : Math.atan2(-sp.x, -sp.z); addSign(buildBench(ownBench(sp.x, sp.z, rot), sp.x, sp.z, rot, true), 2.3); } }
  // 놀이터: 트램펄린·그네·눈사람/모래성은 공 가까이에 모아요
  let sp = spot(2.2, { near: playAt, nearW: 0.2, lawn: 1 }); if (sp) buildTramp(sp);
  sp = spot(2.5, { near: playAt, nearW: 0.2, lawn: 1 }); if (sp) buildSwing(sp, Math.floor(rnd() * 4) * PI / 2);
  sp = spot(2.0, { near: playAt, nearW: 0.2, lawn: 1 }); if (sp) buildMake(sp, Math.atan2(-sp.x, 6 - sp.z));
  sp = spot(1.6); if (sp) buildBell(sp, Math.floor(rnd() * 2) * PI / 2);
  sp = spot(1.3); if (sp) buildFire(sp);
  sp = spot(1.2, fAt ? { near: fAt, nearW: 0.25 } : null); if (sp) buildBalloons(sp);
  sp = spot(1.2, { near: [0, 30], nearW: 0.3 }); if (sp) buildScooter(sp, rnd() * 6.28);
  sp = spot(1.3, { near: [0, 24], nearW: 0.25 }); if (sp) buildBike(sp, rnd() * 6.28);
  for (const th of ST.things) if (PRICE[th.kind]) th.price = PRICE[th.kind];
  const tf = THEME[G.lessonNo]; if (tf) { try { tf(null); } catch (e) { warn(e); } } // 단원 놀이 (그 단원 표현으로)
  const tf3 = THEME3[G.lessonNo]; if (tf3) { try { tf3(); } catch (e) { warn(e); } } // 단원 놀이 하나 더
  for (const [r, fn] of [[1.3, buildKite], [2.6, buildPond], [2.1, buildHoop], [1.4, buildChest]]) { try { const q = spot(r, { lawn: fn === buildPond ? 1 : 0 }); if (q) { const th = fn(q); addSign(th, ({ kite: 2.6, fish: 2.7, hoop: 4.5, chest: 2.5 })[th.kind] || 3); } } catch (e) { warn(e); } }
  for (const th of ST.things) if (PRICE[th.kind]) th.price = PRICE[th.kind];
  try { makeSigns(); makeRings(); } catch (e) { warn(e); }
  clearCover();
  try { buildCats(); } catch (e) { warn(e); } // 🐱 돌아다니는 고양이 두 마리
  ST.lx = P.x; ST.lz = P.z;
  return true;
}

// ---------------- 타기·내리기 ----------------
function leave(silent) {
  const r = ST.ride; if (!r) return;
  if (r.kind === 'plane') { bail(r.th, silent); return; }
  ST.ride = null;
  if (roam(r)) { const th = r.th; th.park(P.x, P.z, CAM.me && CAM.third ? CAM.face : P.yaw + PI); th.g.visible = !th.hidden; th.away = 0; if (CAM.me) CAM.me.position.y = P.jy; }
  else if (r.kind === 'bus') { unseat(); busPark(r.th, r.th.at); P.jy = 0; P.vy = 0; G.collide(); } // 중간에 내리면 버스는 떠난 정류장으로 돌아가요
  else { unseat(); if (r.kind === 'swing') { P.x = r.th.x + r.th.f[0] * 1.2; P.z = r.th.z + r.th.f[1] * 1.2; } P.jy = 0; P.vy = 0; }
  if (!silent) G.beep('click');
  fire('leave', { kind: r.kind });
}
// 엔진이 부르는 것 ① E·Enter·터치 버튼. true 를 돌려주면 엔진은 다른 일을 하지 않아요
function interact(nearNPC) {
  if (!ST.ready || ST.dead) return false;
  const r = ST.ride, click = performance.now() - ST.clickT < 80; // 화면을 누른 것인가요 (E·Enter·터치 버튼이 아니라)
  if (r && !roam(r)) { // 타고 있으면 E = 내리기. 앉아 있는데 미션 친구가 옆에 있으면 일어나면서 바로 그 친구에게 말을 걸어요
    if (click) return true;
    const talk = r.kind !== 'plane' && missionNear(); leave(talk); return !talk;
  }
  if (missionNear()) return false;
  if (GATE.open) return true;
  if (ST.tgt && !ST.tgt.th.hidden) { tryUse(ST.tgt.th); return true; }
  if (r && !nearNPC && !click) { leave(); return true; }
  return false;
}
// ② 걷기 전에: 타고 있으면 true (엔진이 나를 움직이지 않아요). 비행기는 여기서 날아요
function drive(dt, t) {
  const r = ST.ride; if (!r || roam(r)) return false;
  if (r.kind === 'plane') { P.jy = 0; P.vy = 0; flyStep(r.th, dt); }
  else if (r.kind === 'bus') { P.jy = 0; P.vy = 0; busStep(r, dt); }
  else if (P.jy > 0 || P.vy > 0) { P.jy = 0; P.vy = 0; leave(); return false; } // 앉아 있을 때 점프 = 일어나기
  return true;
}
// ③ 카메라: 비행기를 타는 동안만 맡아요
function cam(dt, t) {
  if (ST.top) { const q = Array.isArray(ST.top) ? ST.top : [0, 1.5, 49 / Math.tan(camera.fov * PI / 360)]; camera.position.set(q[0], q[2], q[1]); camera.rotation.set(-PI / 2, 0, 0); return true; } // 개발용: 위에서 보기 (전체 또는 [x, z, 높이])
  const r = ST.ride; if (!r || r.kind !== 'plane') return false;
  planeCam(r.th, dt); return true;
}
// ④ 지도
function map(mctx, tx, tz) {
  if (!ST.ready) return;
  mctx.save(); mctx.font = Math.max(12, Math.round(mctx.canvas.width / 17)) + 'px sans-serif'; mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillStyle = '#000';
  const seen = {};
  for (const th of ST.things) { if (th.hidden || !th.own && th.kind !== 'fountain' || seen[th.kind]) continue; seen[th.kind] = 1; mctx.fillText(th.emoji, tx(th.x), tz(th.z)); }
  for (const gl of BALL.goals) if (!gl.th) mctx.fillText('⚽', tx(gl.x), tz(gl.z));
  mctx.restore();
}

// ---------------- 매 프레임 ----------------
function conflicts() { // 미션 사람·물건·목표가 놀이 기구 자리에 오면 그 기구는 잠깐 비켜요
  const pts = [];
  for (const id in G.NPC) { const n = G.NPC[id]; if (n.g.visible && !n.follow) pts.push(n.g.position.x, n.g.position.z); }
  const its = G.items; for (let i = 0; i < its.length; i++) if (its[i].alive) pts.push(its[i].x, its[i].z);
  try { const o = G.objective, p = o && o.pos && o.pos(); if (p) pts.push(p[0], p[1]); } catch (e) {}
  for (const th of ST.things) {
    if (!th.own || !th.fp.length || (ST.ride && ST.ride.th === th)) continue;
    let hit = false;
    for (const c of th.fp) { for (let k = 0; k < pts.length; k += 2) if (hyp(pts[k] - c.x, pts[k + 1] - c.z) < c.r + 0.3) { hit = true; break; } if (hit) break; }
    if (hit) { th.clearT = 0; if (!th.hidden) setHidden(th, true); }
    else { th.clearT += 0.4; if (th.hidden && th.clearT >= 1.6) setHidden(th, false); }
  }
}
function hud() {
  const pr = G.prompt, act = ST.act; let html = null, verb = null; const r = ST.ride;
  if (G.started && !G.dlgOpen) {
    if (r && !roam(r)) { if (r.kind === 'plane' || !missionNear()) { html = ({ plane: '비행기에서 바로 내리기', swing: '그네에서 내리기', bus: '버스에서 내리기', carousel: '회전목마에서 내리기' })[r.kind] || '벤치에서 일어나기'; verb = '내리기'; } }
    else if (!missionNear()) {
      if (ST.tgt) { html = ST.tgt.lab; verb = ST.tgt.th.verb; }
      else if (r && !G.nearNPC) { html = r.kind === 'bike' ? '자전거에서 내리기' : '킥보드에서 내리기'; verb = '내리기'; }
    }
  }
  if (html) { const h = (G.isTouch ? '👆 ' : '<b>E</b> ') + html; pr.style.display = 'block'; if (G.nearNPC || ST.prH !== h) { pr.innerHTML = h; ST.prH = h; } } else ST.prH = null; // 엔진이 덮어쓴 때와 글이 바뀐 때만 다시 써요
  if (act) {
    if (html) { act.classList.add('ready'); if (act.textContent !== verb) { if (ST.actText == null) ST.actText = act.textContent; act.textContent = verb; } }
    else if (ST.actText != null) { act.textContent = ST.actText; ST.actText = null; }
  }
}
function signCull() { // 먼 간판은 쉬어요 (가벼운 화질에서는 더 가까이에서만)
  const far = G.GFX.high ? 60 : 38, cx = camera.position.x, cz = camera.position.z;
  for (const th of ST.things) { const s = th.sign; if (!s || th.hidden || th.kind === 'plane' || th.kind === 'scooter' || th.kind === 'bike') continue; s.visible = hyp(s.position.x - cx, s.position.z - cz) < far && !(ST.ride && ST.ride.th === th); }
}
function tick(dt, t) {
  if (ST.dead) return;
  if (!ST.ready) {
    if (!G.FX2.ready) return;
    let ok = false; try { ok = init(); } catch (e) { warn(e); }
    if (!ok) { ST.dead = true; return; }
    ST.ready = true; ST.act = document.querySelector('#actBtn'); fire('ready', { kinds: ST.kinds.slice() });
    return;
  }
  ST.t = t;
  if (GATE.open && !G.dlgOpen && LOCK) LOCK(true); // 관문 창이 떠 있는 동안은 계속 멈춰 있어요
  twTick(dt);
  const r0 = ST.ride;
  if (r0 && !roam(r0) && (G.dlgOpen || G.busy)) leave(true); // 대화가 열리면 바로 내려요
  if ((ST.confT += dt) > 0.4) { ST.confT = 0; conflicts(); decoTick(); signCull(); }
  // 내 속도 (공 차기용)
  const sx = P.x - ST.lx, sz = P.z - ST.lz; ST.lx = P.x; ST.lz = P.z;
  if (dt > 1e-4 && hyp(sx, sz) < 2) { ST.pvx = sx / dt; ST.pvz = sz / dt; } else { ST.pvx = ST.pvz = 0; }
  if (ST.boostT > 0) ST.boostT -= dt;
  const r = ST.ride, free = !r || roam(r);
  for (const th of ST.things) { if (th.busy > 0) th.busy -= dt; if (th.tick && !th.hidden) th.tick(dt, t); }
  // 공
  const canKick = free && G.started && !G.dlgOpen && BALL.until > ST.t;
  if (BALL.was && BALL.until <= ST.t) { BALL.was = false; G.toast('⚽ 공 차기 시간이 끝났어요. 공이 다시 잠겼어요 🔒', 2200); }
  for (const b of BALL.list) {
    b.lock.visible = BALL.until <= ST.t; if (b.lock.visible) b.lock.position.set(b.x, b.y + b.r + 0.5, b.z);
    if (!b.vx && !b.vz && !b.vy && b.y <= b.r + 1e-3 && b.score <= 0 && !b.pop && b.rest >= 2 && hyp(b.x - P.x, b.z - P.z) > 3 && reachAt(b.x, b.z)) { // 가만히 있는 공은 계산을 쉬어요
      b.rest += dt; b.blob.visible = !G.GFX.high; if (b.rest > 25 && hyp(b.x - b.home[0], b.z - b.home[1]) > 16) ballHome(b); continue;
    }
    const sp = hyp(b.vx, b.vz), n = sp * dt > b.r ? 2 : 1; for (let i = 0; i < n; i++) ballStep(b, dt / n, canKick);
  }
  fxTick(dt);
  // 부드러운 충돌: 놀이 기구를 뚫고 지나가지 않게 살짝 밀어내요 (충돌 상자를 새로 만들지 않아서 길 찾기·미션에는 영향이 없어요)
  if (free && G.started && !G.dlgOpen && P.jy < 1.2) {
    let hit = false;
    for (const th of ST.things) { if (th.hidden || !th.solidR) continue; const s = th.solid ? th.solid() : [th.x, th.z]; if (s && pushOut(s[0], s[1], th.solidR)) hit = true; }
    if (hit) G.collide();
  }
  // 타고 있는 모습
  if (r && CAM.me) {
    if (r.kind === 'bench') seatAvatar(r.th.node, -0.03, 'sit');
    else if (r.kind === 'swing') seatAvatar(r.th.piv, -2.94, 'swing', r.th.ang);
    else if (r.kind === 'scooter' && CAM.third) { CAM.me.position.y = P.jy + 0.18; pose(CAM.me, 'scoot'); }
    else if (r.kind === 'bike' && CAM.third) { const g = CAM.me, h = CAM.face; g.position.set(P.x - Math.sin(h) * 0.26, P.jy + 0.3, P.z - Math.cos(h) * 0.26); pose(g, 'bike', r.th.ph); } // 안장에 앉아 페달을 밟아요
    else if (r.kind === 'bus') seatAvatar(r.th.seat, 0, 'sit');
    else if (r.kind === 'carousel') seatAvatar(r.th.seat, r.th.seatY, 'sit');
  }
  if (ST.danceT > 0) { // 춤 동아리 체험: 내 캐릭터가 춤춰요
    ST.danceT -= dt; const g = CAM.me, a = g && g.userData.anim;
    if (a && CAM.third && !r) { g.rotation.y = CAM.face + Math.sin(t * 5) * 0.9; g.position.y = P.jy + Math.abs(Math.sin(t * 8)) * 0.16; a.armL.rotation.z = -2.1 + Math.sin(t * 9) * 0.5; a.armR.rotation.z = 2.1 + Math.sin(t * 9) * 0.5; }
  }
  // 가까이 있는 놀이 기구
  let best = null, bd = 1e9;
  if (free && G.started && !G.dlgOpen && !G.busy) for (const th of ST.things) {
    if (th.hidden || !th.use) continue;
    const d = hyp(P.x - th.ux, P.z - th.uz); if (d >= th.useR) continue;
    const k = d / th.useR; if (k < bd) { const lab = th.label(); if (lab) { bd = k; best = { th, lab: lab + costText(th) }; } }
  }
  ST.tgt = best;
  for (const th of ST.things) if (th.sign && th.sign.visible) th.sign.position.y = th.signY + Math.sin(t * 2 + th.ph) * 0.08;
  hud();
  // 오늘 처음: 놀 거리가 있다고 한 번 알려요
  if (G.started && !DAY.hi[G.lessonNo] && ST.things.length && !ST.used) {
    if (!G.dlgOpen && !G.busy && !ST.ride) ST.hiT += dt;
    if (ST.hiT > 15) { DAY.hi[G.lessonNo] = 1; saveDay(); G.toast('✈️ 🎣 🪁 마을 곳곳에 놀 거리가 있어요!<br><small>💎 보석을 내고 영어 문제를 한 번에 맞히면 탈 수 있어요 · 지도에서 그림을 찾아가 봐요</small>', 4800); }
  }
}
G.tickers.push(safe(tick));
ST.clickT = -1e9;
try { document.querySelector('#c').addEventListener('mousedown', () => { ST.clickT = performance.now(); }, true); } catch (e) {}
try { const jb = document.querySelector('#jumpBtn'); if (jb) jb.addEventListener('click', () => { ST.boostT = 1.2; }); } catch (e) {}
addEventListener('pagehide', safe(() => { if (ST.ride) leave(true); }));

// ---------------- 다른 층이 쓰는 문 ----------------
const find = (kind) => ST.things.find(th => th.kind === kind && !th.hidden) || null;
window.PLAY = {
  v: 1,
  get ready() { return ST.ready; },
  get riding() { return ST.ride ? ST.ride.kind : null; }, // 'plane' | 'swing' | 'bench' | 'scooter' | 'bike' | 'bus' | 'carousel' | null
  get speed() { try { const k = ST.ride && ST.ride.kind, sh = keys.ShiftLeft || keys.ShiftRight; return k === 'bike' ? (sh ? 1.15 : 1.85) : k === 'scooter' ? (sh ? 1.1 : 1.6) : 1; } catch (e) { return 1; } }, // 자전거가 킥보드보다 조금 더 빨라요
  things: () => ST.things.map(th => ({ kind: th.kind, x: th.x, z: th.z, ux: th.ux, uz: th.uz, hidden: th.hidden, own: th.own, price: th.price | 0, themed: !!th.themed })),
  where: (kind) => { const th = find(kind); return th ? [th.ux, th.uz] : null; },
  use: safe((kind) => { const th = find(kind); if (!th || !th.use || !th.label() || !G.started || G.dlgOpen || G.busy) return false; return tryUse(th); }, false), // 거리와 상관없이 그 기구를 써요 (보석·영어 관문은 그대로 거쳐요)
  wallet: () => wallet(), // 지금 가진 보석
  pet: () => { let c = null; for (const th of ST.things) if (th.kind === 'cat' && th.cat && th.cat.tame > 0 && th.cat.st !== 'flee' && (!c || th.cat.tame > c.tame)) c = th.cat; return c ? { skin: c.skin, left: Math.round(c.tame) } : null; }, // 지금 나를 따라오는 고양이 (없으면 null)
  makeCat: safe((skin) => makeCat(skin), null), // 같은 모양의 새 고양이 Group (장면에 넣지 않은 상태). group.userData.pose(t, 'walk' | 'run' | 'sit')
  price: (kind) => { const th = find(kind); return th ? th.price | 0 : 0; },
  get gate() { return GATE.open; },
  ride: safe((kind) => window.PLAY.use(kind) && !!ST.ride, false),
  leave: safe(() => { leave(); }),
  balls: () => BALL.list.map(b => ({ kind: b.kind, x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz })),
  kick: safe((i, vx, vz, vy) => { const b = BALL.list[i]; if (!b) return false; b.vx = +vx || 0; b.vz = +vz || 0; b.vy = +vy || 0; b.rest = 0; return true; }, false),
  goals: () => BALL.goals.map(g => ({ x: g.x, z: g.z, rot: g.rot })),
  today: () => ({ goals: DAY.goals, tried: Object.keys(DAY.tried) }),
  // 엔진이 부르는 것
  interact: safe(interact, false), drive: safe(drive, false), cam: safe(cam, false), map: safe(map),
  // 개발용
  _st: ST, _grid: GR, _gate: GATE, _q: () => lessonQ(), _food: (name, at, s) => showFood(name, at || front(1.3, 1.1), s || 2), _top: (on) => { ST.top = Array.isArray(on) ? on : !!on; },
  _ascii: safe(() => {
    const rows = [];
    for (let z = -46.5; z <= 46.5; z += 1) { let s = ''; for (let x = -46.5; x <= 46.5; x += 1) { const c = gcell(z) * GR.N + gcell(x); s += GR.wall[c] ? '#' : GR.occ[c] ? '+' : GR.path[c] ? '~' : GR.reach[c] ? '.' : ' '; } rows.push(s.split('')); }
    for (const p of ST.placed) { const i = Math.round(p.x + 46.5), j = Math.round(p.z + 46.5); if (rows[j] && rows[j][i]) rows[j][i] = 'o'; }
    for (const th of ST.things) { const i = Math.round(th.x + 46.5), j = Math.round(th.z + 46.5); if (rows[j] && rows[j][i]) rows[j][i] = th.kind[0].toUpperCase(); }
    return rows.map(r => r.join('')).join('\n');
  }, '')
};
})();
