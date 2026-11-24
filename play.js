/* 영어 3D · 놀이 층 (모든 단원이 같이 써요) — 물건과의 상호작용
 * ✈️ 비행기 타기 · ⚽ 공 차기(골대) · ⛲ 분수(동전 던지고 소원 빌기·무지개) · 🪑 벤치에 앉기 · 그네 · 트램펄린 ·
 * 🛴 킥보드 · 🎈 풍선 터뜨리기 · 🔔 종 치기 · 🎆 불꽃놀이 버튼 · ⛄ 눈사람 / 🏰 모래성 만들기
 * - 단원 세계 파일은 건드리지 않아요. 실행 중에 빈 자리(벽·건물·사람·미션 자리와 떨어진 곳)를 찾아 놓아요. 단원 번호가 씨앗이라 늘 같은 자리예요.
 * - 미션이 먼저예요: ❗ 붙은 친구·말할 것이 있는 친구가 옆에 있으면 E 는 그 친구에게 가요. 미션 물건·사람이 놀이 기구 자리에 오면 그 기구는 잠깐 비켜요(숨어요).
 * - 별(⭐)은 주지 않아요. 축하 효과와 '오늘의 놀이' 도장만 있어요.
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
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.d === DAY.d) { DAY.goals = Math.max(0, +s.goals || 0); if (s.tried && typeof s.tried === 'object') DAY.tried = s.tried; if (s.hi && typeof s.hi === 'object') DAY.hi = s.hi; DAY.all = s.all ? 1 : 0; } } catch (e) {}
const saveDay = () => { try { localStorage.setItem(KEY, JSON.stringify(DAY)); } catch (e) {} };

const ST = { ready: false, dead: false, things: [], kinds: [], ride: null, tgt: null, seatMe: null, lx: 0, lz: 0, pvx: 0, pvz: 0, confT: 0, actText: null, top: false, placed: [], t: 0, boostT: 0, hiT: 0, spotN: 0 };

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
const sph = (r, c, x, y, z, parent) => add(new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), typeof c === 'number' ? mat(c) : c), x, y, z, parent);
const grp = (x, z, rot, parent) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; (parent || scene).add(g); return g; };
const dyn = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); g.userData.dyn = 1; parent.add(g); return g; }; // 움직이는 부분 (합치지 않아요)
const noRay = (o) => { o.raycast = () => {}; o.userData.pol = 1; return o; };
// 움직이지 않는 부품을 한 덩어리로 합쳐요 (그리기 횟수를 줄여요). 색은 꼭짓점 색으로 옮겨요.
const bakedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
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
  const th = Object.assign({ kind, emoji, x, z, ux: x, uz: z, useR: 2.4, fp: [], solidR: 0, hidden: false, own: true, objs: [], clearT: 9, label: () => null, use: null, tick: null, verb: '하기', sign: null, signY: 3, ph: Math.random() * 6 }, o || {});
  ST.things.push(th); if (!ST.kinds.includes(kind)) ST.kinds.push(kind); return th;
}
function addSign(th, y, x, z) { // 멀리서도 보이는 그림 팻말
  const s = noRay(G.textSprite(th.emoji, 0.8, { fs: 64, bg: 'rgba(255,255,255,.93)', pad: 14 }));
  s.material.toneMapped = false; s.position.set(x == null ? th.x : x, y, z == null ? th.z : z); scene.add(s); th.sign = s; th.signY = y; th.objs.push(s);
}
function setHidden(th, on) { th.hidden = on; for (const o of th.objs) o.visible = !on; if (th.onHide) th.onHide(on); }
const missionNear = () => { const n = G.nearNPC; return !!(n && (n.talk || (n.g.userData.mark && n.g.userData.mark.visible))); };
const npcNear = (x, z, r) => { for (const id in G.NPC) { const g = G.NPC[id].g; if (g.visible && hyp(g.position.x - x, g.position.z - z) < r) return true; } return false; };
// 내 캐릭터를 자리에 앉혀요 (엔진이 매 프레임 서 있는 자세로 되돌리므로 그 뒤에 다시 맞춰요)
function pose(g, kind, a1) {
  const a = g.userData.anim; if (!a) return;
  if (kind === 'sit') { a.legL.rotation.x = a.legR.rotation.x = -1.4; a.armL.rotation.x = a.armR.rotation.x = -0.4; }
  else if (kind === 'swing') { a.legL.rotation.x = a.legR.rotation.x = -1.15 + (a1 || 0) * 0.7; a.armL.rotation.x = a.armR.rotation.x = -2.2; a.armL.rotation.z = -0.25; a.armR.rotation.z = 0.25; }
  else if (kind === 'scoot') { a.legL.rotation.x = 0; a.legR.rotation.x = 0.3; a.armL.rotation.x = a.armR.rotation.x = -1.0; a.armL.rotation.z = -0.1; a.armR.rotation.z = 0.1; }
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
  const F = th.fl, A = th.air; if (F.mode !== 'park' || ST.ride && ST.ride.kind !== 'scooter') return;
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
const BALL = { list: [], goals: [], spot: null };
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
  BALL.list.push(b); return b;
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
        if (!DAY.tried.ball) tell('ball', '⚽ 뻥! 공을 찼어요. 골대에 넣어 봐요');
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
  if (BALL.list.length) ST.kinds.push('ball');
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
  const th = thing('tramp', '🤸', sp.x, sp.z, { fp: [{ x: sp.x, z: sp.z, r: 1.7 }] });
  const g = grp(sp.x, sp.z, 0); th.g = g; th.objs.push(g);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; cyl(0.05, 0.05, 0.5, 0xffd43b, Math.cos(a) * 1.45, 0.25, Math.sin(a) * 1.45, g, 6); }
  const ring = add(new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 8, 28), mat(0x1c7ed6)), 0, 0.5, 0, g); ring.rotation.x = PI / 2;
  bake(g);
  const mt = add(new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.04, 24), new THREE.MeshStandardMaterial({ color: 0x343a40, roughness: 0.6 })), 0, 0.48, 0, g);
  th.dip = 0; th.n = 0; th.on = false;
  addSign(th, 2.6);
  th.tick = (dt) => {
    const on = !ST.ride || ST.ride.kind === 'scooter' ? hyp(P.x - sp.x, P.z - sp.z) < 1.35 && G.started && !G.dlgOpen : false;
    if (on && P.jy <= 0.5 && P.vy <= 0) {
      const boost = keys.Space || ST.boostT > 0;
      P.jy = 0.5; P.vy = Math.min(9.4, 6.4 + Math.min(th.n, 4) * 0.5 + (boost ? 1.2 : 0)); th.n++; th.dip = 1;
      G.beep([[196 + Math.min(th.n, 6) * 22, .05], [330 + Math.min(th.n, 6) * 30, .09]]);
      if (!DAY.tried.tramp) tell('tramp', '🤸 통통! 뛸수록 높이 올라가요<br><small>' + (G.isTouch ? '점프 버튼' : '<b>Space</b>') + ' 를 누르면 더 높이!</small>', 3000);
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
  th.n = 0; th.grow = -1; th.cd = 0;
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
  if (nb < 2) { const sp = spot(1.5, fAt ? { near: fAt, nearW: 0.5 } : null); if (sp) { const rot = fAt ? Math.atan2(fAt[0] - sp.x, fAt[1] - sp.z) : Math.atan2(-sp.x, -sp.z); buildBench(ownBench(sp.x, sp.z, rot), sp.x, sp.z, rot, true); } }
  // 놀이터: 트램펄린·그네·눈사람/모래성은 공 가까이에 모아요
  let sp = spot(2.2, { near: playAt, nearW: 0.2, lawn: 1 }); if (sp) buildTramp(sp);
  sp = spot(2.5, { near: playAt, nearW: 0.2, lawn: 1 }); if (sp) buildSwing(sp, Math.floor(rnd() * 4) * PI / 2);
  sp = spot(2.0, { near: playAt, nearW: 0.2, lawn: 1 }); if (sp) buildMake(sp, Math.atan2(-sp.x, 6 - sp.z));
  sp = spot(1.6); if (sp) buildBell(sp, Math.floor(rnd() * 2) * PI / 2);
  sp = spot(1.3); if (sp) buildFire(sp);
  sp = spot(1.2, fAt ? { near: fAt, nearW: 0.25 } : null); if (sp) buildBalloons(sp);
  sp = spot(1.2, { near: [0, 30], nearW: 0.3 }); if (sp) buildScooter(sp, rnd() * 6.28);
  clearCover();
  ST.lx = P.x; ST.lz = P.z;
  return true;
}

// ---------------- 타기·내리기 ----------------
function leave(silent) {
  const r = ST.ride; if (!r) return;
  if (r.kind === 'plane') { bail(r.th, silent); return; }
  ST.ride = null;
  if (r.kind === 'scooter') { const th = r.th; th.park(P.x, P.z, CAM.me && CAM.third ? CAM.face : P.yaw + PI); th.g.visible = !th.hidden; th.away = 0; if (CAM.me) CAM.me.position.y = P.jy; }
  else { unseat(); if (r.kind === 'swing') { P.x = r.th.x + r.th.f[0] * 1.2; P.z = r.th.z + r.th.f[1] * 1.2; } P.jy = 0; P.vy = 0; }
  if (!silent) G.beep('click');
  fire('leave', { kind: r.kind });
}
// 엔진이 부르는 것 ① E·Enter·터치 버튼. true 를 돌려주면 엔진은 다른 일을 하지 않아요
function interact(nearNPC) {
  if (!ST.ready || ST.dead) return false;
  const r = ST.ride, click = performance.now() - ST.clickT < 80; // 화면을 누른 것인가요 (E·Enter·터치 버튼이 아니라)
  if (r && r.kind !== 'scooter') { // 타고 있으면 E = 내리기. 앉아 있는데 미션 친구가 옆에 있으면 일어나면서 바로 그 친구에게 말을 걸어요
    if (click) return true;
    const talk = r.kind !== 'plane' && missionNear(); leave(talk); return !talk;
  }
  if (missionNear()) return false;
  if (ST.tgt && !ST.tgt.th.hidden) { ST.tgt.th.use(); return true; }
  if (r && !nearNPC && !click) { leave(); return true; }
  return false;
}
// ② 걷기 전에: 타고 있으면 true (엔진이 나를 움직이지 않아요). 비행기는 여기서 날아요
function drive(dt, t) {
  const r = ST.ride; if (!r || r.kind === 'scooter') return false;
  if (r.kind === 'plane') { P.jy = 0; P.vy = 0; flyStep(r.th, dt); }
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
    if (r && r.kind !== 'scooter') { if (r.kind === 'plane' || !missionNear()) { html = r.kind === 'plane' ? '비행기에서 바로 내리기' : r.kind === 'swing' ? '그네에서 내리기' : '벤치에서 일어나기'; verb = '내리기'; } }
    else if (!missionNear()) {
      if (ST.tgt) { html = ST.tgt.lab; verb = ST.tgt.th.verb; }
      else if (r && !G.nearNPC) { html = '킥보드에서 내리기'; verb = '내리기'; }
    }
  }
  if (html) { const h = (G.isTouch ? '👆 ' : '<b>E</b> ') + html; pr.style.display = 'block'; if (G.nearNPC || ST.prH !== h) { pr.innerHTML = h; ST.prH = h; } } else ST.prH = null; // 엔진이 덮어쓴 때와 글이 바뀐 때만 다시 써요
  if (act) {
    if (html) { act.classList.add('ready'); if (act.textContent !== verb) { if (ST.actText == null) ST.actText = act.textContent; act.textContent = verb; } }
    else if (ST.actText != null) { act.textContent = ST.actText; ST.actText = null; }
  }
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
  const r0 = ST.ride;
  if (r0 && r0.kind !== 'scooter' && (G.dlgOpen || G.busy)) leave(true); // 대화가 열리면 바로 내려요
  if ((ST.confT += dt) > 0.4) { ST.confT = 0; conflicts(); }
  // 내 속도 (공 차기용)
  const sx = P.x - ST.lx, sz = P.z - ST.lz; ST.lx = P.x; ST.lz = P.z;
  if (dt > 1e-4 && hyp(sx, sz) < 2) { ST.pvx = sx / dt; ST.pvz = sz / dt; } else { ST.pvx = ST.pvz = 0; }
  if (ST.boostT > 0) ST.boostT -= dt;
  const r = ST.ride, free = !r || r.kind === 'scooter';
  for (const th of ST.things) if (th.tick && !th.hidden) th.tick(dt, t);
  // 공
  const canKick = free && G.started && !G.dlgOpen;
  for (const b of BALL.list) {
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
  }
  // 가까이 있는 놀이 기구
  let best = null, bd = 1e9;
  if (free && G.started && !G.dlgOpen && !G.busy) for (const th of ST.things) {
    if (th.hidden || !th.use) continue;
    const d = hyp(P.x - th.ux, P.z - th.uz); if (d >= th.useR) continue;
    const k = d / th.useR; if (k < bd) { const lab = th.label(); if (lab) { bd = k; best = { th, lab }; } }
  }
  ST.tgt = best;
  for (const th of ST.things) if (th.sign && th.sign.visible) th.sign.position.y = th.signY + Math.sin(t * 2 + th.ph) * 0.08;
  hud();
  // 오늘 처음: 놀 거리가 있다고 한 번 알려요
  if (G.started && !DAY.hi[G.lessonNo] && ST.things.length && !ST.used) {
    if (!G.dlgOpen && !G.busy && !ST.ride) ST.hiT += dt;
    if (ST.hiT > 15) { DAY.hi[G.lessonNo] = 1; saveDay(); G.toast('✈️ ⚽ ⛲ 마을 곳곳에 놀 거리가 생겼어요!<br><small>지도에서 그림을 찾아가 봐요</small>', 4200); }
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
  get riding() { return ST.ride ? ST.ride.kind : null; }, // 'plane' | 'swing' | 'bench' | 'scooter' | null
  get speed() { try { return ST.ride && ST.ride.kind === 'scooter' ? (keys.ShiftLeft || keys.ShiftRight ? 1.1 : 1.6) : 1; } catch (e) { return 1; } },
  things: () => ST.things.map(th => ({ kind: th.kind, x: th.x, z: th.z, ux: th.ux, uz: th.uz, hidden: th.hidden, own: th.own })),
  where: (kind) => { const th = find(kind); return th ? [th.ux, th.uz] : null; },
  use: safe((kind) => { const th = find(kind); if (!th || !th.use || !th.label() || !G.started || G.dlgOpen || G.busy) return false; th.use(); return true; }, false), // 거리와 상관없이 그 기구를 써요
  ride: safe((kind) => window.PLAY.use(kind) && !!ST.ride, false),
  leave: safe(() => { leave(); }),
  balls: () => BALL.list.map(b => ({ kind: b.kind, x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz })),
  kick: safe((i, vx, vz, vy) => { const b = BALL.list[i]; if (!b) return false; b.vx = +vx || 0; b.vz = +vz || 0; b.vy = +vy || 0; b.rest = 0; return true; }, false),
  goals: () => BALL.goals.map(g => ({ x: g.x, z: g.z, rot: g.rot })),
  today: () => ({ goals: DAY.goals, tried: Object.keys(DAY.tried) }),
  // 엔진이 부르는 것
  interact: safe(interact, false), drive: safe(drive, false), cam: safe(cam, false), map: safe(map),
  // 개발용
  _st: ST, _grid: GR, _top: (on) => { ST.top = Array.isArray(on) ? on : !!on; },
  _ascii: safe(() => {
    const rows = [];
    for (let z = -46.5; z <= 46.5; z += 1) { let s = ''; for (let x = -46.5; x <= 46.5; x += 1) { const c = gcell(z) * GR.N + gcell(x); s += GR.wall[c] ? '#' : GR.occ[c] ? '+' : GR.path[c] ? '~' : GR.reach[c] ? '.' : ' '; } rows.push(s.split('')); }
    for (const p of ST.placed) { const i = Math.round(p.x + 46.5), j = Math.round(p.z + 46.5); if (rows[j] && rows[j][i]) rows[j][i] = 'o'; }
    for (const th of ST.things) { const i = Math.round(th.x + 46.5), j = Math.round(th.z + 46.5); if (rows[j] && rows[j][i]) rows[j][i] = th.kind[0].toUpperCase(); }
    return rows.map(r => r.join('')).join('\n');
  }, '')
};
})();
