/* 영어 3D · 게임성 층 (모든 단원이 같이 써요)
 * - 보석 💎 모으기: 길 안내 경로 위와 세계 곳곳에 놓여요. 10개마다 별 +1.
 * - 미션 결과 카드와 메달 🥇🥈🥉: 미션이 끝날 때 잠깐 떴다가 저절로 사라져요. 대화 상자를 열거나 진행을 막지 않아요.
 * - 배지 12개: 모든 단원 공통 (localStorage 'english3d_fun_v1').
 * - 꾸미기: 모든 단원에서 모은 별 합계에 따라 열려요.
 * 엔진(game.js)과는 window.__fun(연결 지점)과 window 의 'e3d' 이벤트로만 이어져 있어요. 이 파일이 없어도 게임은 그대로 돼요.
 * 학습 내용·미션 흐름은 건드리지 않아요.
 */
(() => {
'use strict';
const G = window.__fun;
if (!G || window.FUN || !window.THREE) return;
const THREE = window.THREE;
const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
// 여기서 난 오류가 게임을 멈추지 않게 모두 감싸요
const safe = (f) => function () { try { return f.apply(this, arguments); } catch (e) { try { console.warn('fun.js', e); } catch (er) {} } };
const hyp = Math.hypot;
const MEDAL = ['', '🥉', '🥈', '🥇'];

// ---------------- 저장 (모든 단원 공통) ----------------
const KEY = 'english3d_fun_v1';
const F = { v: 1, gems: 0, badges: {}, fresh: [], stars: 0, decoMax: 0 };
const readF = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } };
(() => { const s = readF(); if (!s) return; F.gems = Math.max(0, +s.gems || 0); if (s.badges && typeof s.badges === 'object') F.badges = s.badges; if (Array.isArray(s.fresh)) F.fresh = s.fresh.filter(x => typeof x === 'string'); F.stars = Math.max(0, +s.stars || 0); F.decoMax = Math.max(0, +s.decoMax || 0); })();
function saveF() { // 다른 창에서 받은 것도 잃지 않게 합쳐서 저장해요
  try {
    const s = readF();
    if (s) { F.gems = Math.max(F.gems, +s.gems || 0); F.stars = Math.max(F.stars, +s.stars || 0); F.decoMax = Math.max(F.decoMax, +s.decoMax || 0); if (s.badges && typeof s.badges === 'object') for (const k in s.badges) if (!F.badges[k]) F.badges[k] = s.badges[k]; }
    localStorage.setItem(KEY, JSON.stringify(F));
  } catch (e) {}
}
let dirty = false;
function flush() { if (!dirty) return; dirty = false; try { G.save(); } catch (e) {} saveF(); }
addEventListener('pagehide', safe(flush));
const lessonSave = (n) => { if (n === G.lessonNo) return G.S; try { return JSON.parse(localStorage.getItem('english3d_l' + n + '_v1')); } catch (e) { return null; } };
function totals() { // 모든 단원 기록: 별 합계, 끝낸 단원 수, 미션을 하나라도 끝냈는지, 소리 코인을 다 모은 단원이 있는지
  const T = { stars: 0, done: 0, any: false, coins: false };
  for (let n = 1; n <= 12; n++) {
    const s = lessonSave(n); if (!s || typeof s !== 'object') continue;
    T.stars += +s.stars || 0;
    if (s.stage >= 6) T.done++;
    if (s.stage >= 1) T.any = true;
    if (Array.isArray(s.th) && s.th.length >= (n === G.lessonNo && G.L.th ? G.L.th.length : 6) && s.th.length > 0) T.coins = true;
  }
  return T;
}

// ---------------- 알림 (오른쪽 위에 잠깐 뜨는 쪽지) ----------------
const notes = el('div'); notes.id = 'funNotes'; document.body.appendChild(notes);
function note(html, cls, ms) {
  const d = el('div', 'funNote' + (cls ? ' ' + cls : ''), html); notes.appendChild(d);
  while (notes.children.length > 4) notes.firstChild.remove();
  setTimeout(() => d.classList.add('show'), 30);
  setTimeout(() => d.classList.remove('show'), ms || 2400);
  setTimeout(() => d.remove(), (ms || 2400) + 450);
}

// ---------------- 배지 ----------------
const BADGES = [
  { id: 'first', e: '🚩', n: '첫걸음', how: '미션을 하나 끝내요' },
  { id: 'perfect', e: '💯', n: '완벽한 미션', how: '한 미션을 한 번도 안 틀리고 끝내요' },
  { id: 'streak5', e: '🔥', n: '5번 연속 정답', how: '한 번에 5번 연속으로 맞혀요', prog: () => [Math.min(5, G.S.best | 0), 5] },
  { id: 'streak10', e: '⚡', n: '10번 연속 정답', how: '한 번에 10번 연속으로 맞혀요', prog: () => [Math.min(10, G.S.best | 0), 10] },
  { id: 'gem50', e: '💎', n: '보석 수집가', how: '보석을 50개 모아요', prog: () => [Math.min(50, F.gems), 50] },
  { id: 'gem200', e: '👑', n: '보석 부자', how: '보석을 200개 모아요', prog: () => [Math.min(200, F.gems), 200] },
  { id: 'coins', e: '🪙', n: '소리 코인 박사', how: '한 단원의 소리 코인을 모두 찾아요' },
  { id: 'lesson1', e: '🎓', n: '단원 하나 끝!', how: '단원 하나를 끝까지 해요' },
  { id: 'lesson12', e: '🏆', n: '모든 단원 끝!', how: '열두 단원을 모두 끝내요', prog: () => [Math.min(12, totals().done), 12] },
  { id: 'portal', e: '🌀', n: '포탈 여행자', how: '포탈을 타고 다른 단원으로 가요' },
  { id: 'ask', e: '💬', n: '영어로 묻기', how: '함께 하기에서 친구에게 영어로 물어봐요' },
  { id: 'five', e: '🙌', n: '하이파이브', how: '함께 하기에서 친구와 하이파이브해요' }
];
const badgeOf = (id) => BADGES.find(b => b.id === id);
const badgeCount = () => BADGES.filter(b => F.badges[b.id]).length;
function grant(id) {
  if (F.badges[id] || !badgeOf(id)) return;
  F.badges[id] = Date.now(); F.fresh.push(id); saveF(); renderShelves();
}
let noteWait = 0;
function badgePump() { // 새 배지 알리기: 한 번에 하나씩, 여러 개면 묶어서
  if (!F.fresh.length || !G.started || performance.now() < noteWait) return;
  const ids = F.fresh.splice(0, F.fresh.length).filter(badgeOf); saveF();
  if (!ids.length) return;
  if (ids.length > 2) note('<div class="be">🏅</div><div><small>새 배지!</small><b>배지 ' + ids.length + '개를 받았어요</b><span>' + ids.map(i => badgeOf(i).e).join(' ') + '</span></div>', 'badge', 4200);
  else ids.forEach((id, k) => { const b = badgeOf(id); setTimeout(() => note('<div class="be">' + b.e + '</div><div><small>새 배지!</small><b>' + b.n + '</b><span>' + b.how + '</span></div>', 'badge', 4200), k * 500); });
  noteWait = performance.now() + 1500;
  try { G.confetti(36); G.beep('fanfare'); } catch (e) {}
}
function quick() { // 이 단원 기록만 보고 받을 수 있는 배지
  const S = G.S;
  if ((S.best | 0) >= 5) grant('streak5');
  if ((S.best | 0) >= 10) grant('streak10');
  if (F.gems >= 50) grant('gem50');
  if (F.gems >= 200) grant('gem200');
  if (G.L.th && G.L.th.length && Array.isArray(S.th) && S.th.length >= G.L.th.length) grant('coins');
  if (S.stage >= 1) grant('first');
  if (S.stage >= G.stages - 1) grant('lesson1');
}
function full() { // 모든 단원 기록을 읽어서 확인 (가끔만 불러요)
  quick();
  const T = totals();
  if (T.any) grant('first');
  if (T.coins) grant('coins');
  if (T.done >= 1) grant('lesson1');
  if (T.done >= 12) grant('lesson12');
  decoRefresh(T);
}
// 배지 진열장: 받은 것은 또렷하게, 못 받은 것은 흐리게. 누르면 무엇을 하면 받는지 한 줄로 알려 줘요
const shelves = [];
function howLine(b) {
  const got = !!F.badges[b.id]; let p = '';
  if (!got && b.prog) { try { const v = b.prog(); p = ' (' + v[0] + '/' + v[1] + ')'; } catch (e) {} }
  return '<b>' + b.e + ' ' + b.n + '</b> · ' + b.how + (got ? ' ✔ 받았어요!' : p);
}
function shelf() {
  const w = el('div', 'funShelf'); w.innerHTML = '<div class="fsT"></div><div class="fsRow"></div><div class="fsHow"></div>';
  const row = w.children[1];
  BADGES.forEach((b, i) => { const bt = el('button', '', b.e); bt.type = 'button'; bt.dataset.i = i; bt.onclick = safe(() => { w.dataset.sel = i; drawShelf(w); }); row.appendChild(bt); });
  for (let i = shelves.length - 1; i >= 0; i--) if (!shelves[i].isConnected) shelves.splice(i, 1);
  shelves.push(w); drawShelf(w); return w;
}
function drawShelf(w) {
  const sel = w.dataset.sel === undefined ? -1 : +w.dataset.sel, n = badgeCount();
  w.children[0].innerHTML = '🏅 내 배지 <b>' + n + '</b>/' + BADGES.length;
  Array.prototype.forEach.call(w.children[1].children, (bt, i) => { const b = BADGES[i], got = !!F.badges[b.id]; bt.classList.toggle('on', got); bt.classList.toggle('sel', i === sel); bt.title = b.n + ' · ' + b.how + (got ? ' (받았어요)' : ''); });
  let b = sel >= 0 ? BADGES[sel] : null, pre = '';
  if (!b) { b = BADGES.find(x => !F.badges[x.id]); pre = b ? '다음 배지: ' : ''; }
  w.children[2].innerHTML = b ? pre + howLine(b) : '배지를 모두 모았어요! 🎉';
}
function renderShelves() { for (const w of shelves) if (w.isConnected) drawShelf(w); }

// ---------------- 미션 결과 카드와 메달 ----------------
// 메달은 정확도로 정해요: 한 번에 맞힌 문제가 90% 이상(또는 다 맞힘) 🥇, 70% 이상(또는 하나만 틀림) 🥈, 끝까지 하면 🥉. 시간은 보여 주기만 해요(재촉하지 않아요).
const M = { stage: -1, t: 0, tries0: 0, correct0: 0, miss: 0, gems: 0, last: null };
function missionReset() { const S = G.S; M.stage = S.stage; M.t = 0; M.tries0 = S.tries | 0; M.correct0 = S.correct | 0; M.miss = 0; M.gems = 0; }
const medalOf = (ok, total) => { if (!total) return 3; const a = ok / total, wrong = total - ok; return wrong === 0 || a >= 0.9 ? 3 : wrong <= 1 || a >= 0.7 ? 2 : 1; };
const timeText = (s) => { s = Math.max(1, Math.round(s)); return s < 60 ? s + '초' : Math.floor(s / 60) + '분' + (s % 60 ? ' ' + (s % 60) + '초' : ''); };
const medalRow = (md, n) => { let h = ''; for (let i = 0; i < n; i++) { const m = md && md[i] | 0; h += m ? '<i class="on" title="미션 ' + (i + 1) + '">' + MEDAL[m] + '</i>' : '<i title="미션 ' + (i + 1) + '">' + (i + 1) + '</i>'; } return h; };
const card = el('div'); card.id = 'funCard'; document.body.appendChild(card);
let cardT = 0;
function resultLines(r) {
  return (r.total ? '<span>🎯 한 번에 맞힌 문제 <b>' + r.ok + '/' + r.total + '</b> (' + Math.round(r.ok / r.total * 100) + '%)</span>' : '<span>🎯 미션을 잘 해냈어요</span>') +
    '<span>⏱ 걸린 시간 <b>' + timeText(r.t) + '</b> · 💎 보석 <b>' + r.gems + '개</b></span>';
}
function showCard(r) {
  const word = r.medal === 3 ? '금메달! 참 잘했어요' : r.medal === 2 ? '은메달! 잘했어요' : '동메달! 끝까지 해냈어요';
  card.innerHTML = '<div class="fcM">' + MEDAL[r.medal] + '</div><div class="fcB"><b class="t">' + word + '</b>' + resultLines(r) + '</div>';
  card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
  clearTimeout(cardT); cardT = setTimeout(() => card.classList.remove('show'), 4600);
}
function stageDone(st) {
  const S = G.S; grant('first');
  if (M.stage !== st) return;
  const total = Math.max(0, (S.tries | 0) - M.tries0 - M.miss), ok = Math.max(0, Math.min(total, (S.correct | 0) - M.correct0));
  const medal = medalOf(ok, total);
  if (!Array.isArray(S.medals)) S.medals = [];
  for (let i = 0; i <= st; i++) S.medals[i] = S.medals[i] | 0;
  if (medal > S.medals[st]) S.medals[st] = medal;
  try { G.save(); } catch (e) {}
  if (total >= 3 && ok === total) grant('perfect');
  M.last = { st, ok, total, t: M.t, gems: M.gems, medal };
  if (st < G.stages - 2) showCard(M.last); // 마지막 미션은 끝 화면에서 보여 줘요
  quick();
}

// ---------------- 보석 💎 ----------------
const GEM = { cap: 30, list: [], mesh: null, stage: -1, wait: 0, obj: null, objT: 0, objDone: true, pathAt: null, lines: 0, combo: 0, comboT: 0, sparks: [], reach: null, queue: null };
const D = new THREE.Object3D();
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19];
function gemInit() {
  const geo = new THREE.OctahedronGeometry(0.3, 0); geo.scale(1, 1.35, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x35c4ff, emissive: 0x0b84e0, emissiveIntensity: 0.75, roughness: 0.2, metalness: 0.1, flatShading: true });
  const m = new THREE.InstancedMesh(geo, mat, GEM.cap); // 보석 전체가 그리기 한 번이에요
  m.count = 0; m.frustumCulled = false; m.raycast = () => {}; m.userData.pol = 1; m.userData.camBig = 0;
  G.scene.add(m); GEM.mesh = m;
}
const pill = el('div', 'pill', '💎 <span id="gemN">0</span><i><b></b></i>'); pill.id = 'gemBox'; pill.title = '보석 10개마다 별 +1';
try { const sp = $('#stars').parentElement; sp.parentElement.insertBefore(pill, sp.nextSibling); } catch (e) {}
function hudGem(pop) {
  const n = G.S.gems | 0; pill.firstElementChild.textContent = n; pill.lastElementChild.firstElementChild.style.width = (n % 10) * 10 + '%';
  if (pop) { pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop'); }
}
function spark(x, y, z) {
  let s = null; for (const k of GEM.sparks) if (k.life <= 0) { s = k; break; }
  if (!s) {
    if (GEM.sparks.length >= 3) s = GEM.sparks[0];
    else { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.haloTex, color: 0xd0f4ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); sp.userData.pol = 1; sp.raycast = () => {}; sp.visible = false; G.scene.add(sp); s = { sp, life: 0 }; GEM.sparks.push(s); }
  }
  s.life = 0.4; s.sp.position.set(x, y, z); s.sp.visible = true;
}
function take(g) {
  g.alive = false;
  const S = G.S; S.gems = (S.gems | 0) + 1; F.gems++; M.gems++; dirty = true;
  const now = performance.now(); GEM.combo = now - GEM.comboT < 1600 ? Math.min(GEM.combo + 1, SCALE.length - 1) : 0; GEM.comboT = now;
  const f = 587 * Math.pow(2, SCALE[GEM.combo] / 12); // 연달아 먹을수록 음이 올라가요
  G.beep([[f, 0.05], [f * 1.5, 0.09]]);
  spark(g.x, 0.95, g.z); hudGem(true);
  if (S.gems % 10 === 0) { G.addStar(1); note('💎 보석 <b>' + S.gems + '개</b>! 별 +1 ⭐ 멋져요!', '', 2400); setTimeout(() => { try { G.beep('star'); } catch (e) {} }, 180); }
  if (F.gems === 50 || F.gems === 200) quick();
}
function gemTick(dt, t) {
  const m = GEM.mesh, list = GEM.list, P = G.P, can = !G.dlgOpen; let n = 0;
  for (let i = 0; i < list.length; i++) {
    const g = list[i]; if (!g.alive) continue;
    const dx = P.x - g.x, dz = P.z - g.z, d2 = dx * dx + dz * dz;
    if (can && d2 < 5.3) { // 가까이 가면 살짝 끌려와요
      if (d2 < 1.1) { take(g); continue; }
      const k = Math.min(1, dt * 5); g.x += dx * k; g.z += dz * k;
    }
    if (g.age < 1) g.age = Math.min(1, g.age + dt * 3);
    D.position.set(g.x, 0.85 + Math.sin(t * 2.4 + g.ph) * 0.12, g.z); D.rotation.y = t * 1.8 + g.ph; D.scale.setScalar(g.age);
    D.updateMatrix(); m.setMatrixAt(n++, D.matrix);
  }
  m.count = n; m.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < GEM.sparks.length; i++) {
    const s = GEM.sparks[i]; if (s.life <= 0) continue;
    s.life -= dt; const k = 1 - Math.max(0, s.life) / 0.4;
    s.sp.scale.setScalar(0.7 + k * 2.3); s.sp.material.opacity = 1 - k; s.sp.position.y += dt * 1.4;
    if (s.life <= 0) s.sp.visible = false;
  }
}
const alive = () => { let n = 0; for (const g of GEM.list) if (g.alive) n++; return n; };
function compact() { let k = 0; for (let i = 0; i < GEM.list.length; i++) if (GEM.list[i].alive) GEM.list[k++] = GEM.list[i]; GEM.list.length = k; }
function addGem(x, z, path) { if (alive() >= GEM.cap) return false; GEM.list.push({ x, z, path: !!path, ph: Math.random() * 6.28, age: 0, alive: true }); return true; }
// 길 격자(엔진의 길 찾기와 같은 것)로 빈자리·갈 수 있는 곳을 확인해요
const cell = (v) => { const N = G.NAV.N; return Math.max(0, Math.min(N - 1, Math.floor((v - G.NAV.o) / G.NAV.cs))); };
function clearAt(x, z, k) {
  const g = G.NAV.grid, N = G.NAV.N, ci = cell(x), cj = cell(z);
  for (let dj = -k; dj <= k; dj++) for (let di = -k; di <= k; di++) { const a = ci + di, b = cj + dj; if (a < 0 || b < 0 || a >= N || b >= N || g[b * N + a]) return false; }
  return true;
}
function flood() { // 내가 서 있는 곳에서 걸어서 갈 수 있는 칸
  const g = G.NAV.grid, N = G.NAV.N;
  if (!GEM.reach || GEM.reach.length !== N * N) { GEM.reach = new Uint8Array(N * N); GEM.queue = new Int32Array(N * N); }
  const r = GEM.reach, q = GEM.queue; r.fill(0);
  let s = -1; const ci = cell(G.P.x), cj = cell(G.P.z);
  for (let R = 0; R <= 8 && s < 0; R++) for (let dj = -R; dj <= R && s < 0; dj++) for (let di = -R; di <= R; di++) { const a = ci + di, b = cj + dj; if (a >= 0 && b >= 0 && a < N && b < N && !g[b * N + a]) { s = b * N + a; break; } }
  if (s < 0) return false;
  let h = 0, tl = 0; q[tl++] = s; r[s] = 1;
  while (h < tl) {
    const c = q[h++], a = c % N, b = (c / N) | 0;
    if (a > 0 && !g[c - 1] && !r[c - 1]) { r[c - 1] = 1; q[tl++] = c - 1; }
    if (a < N - 1 && !g[c + 1] && !r[c + 1]) { r[c + 1] = 1; q[tl++] = c + 1; }
    if (b > 0 && !g[c - N] && !r[c - N]) { r[c - N] = 1; q[tl++] = c - N; }
    if (b < N - 1 && !g[c + N] && !r[c + N]) { r[c + N] = 1; q[tl++] = c + N; }
  }
  return true;
}
function zoneRects() { // 들어가면 일이 생기는 구역(교실·가게 등)에는 보석을 놓지 않아요
  const out = [], gm = window.__game || {};
  for (const k of ['zones', 'roomInfo', 'boothInfo', 'stallInfo']) {
    let v = null; try { v = gm[k]; } catch (e) {}
    if (!v || typeof v !== 'object') continue;
    for (const r of (Array.isArray(v) ? v : Object.values(v))) if (r && isFinite(r.x1) && isFinite(r.x2) && isFinite(r.z1) && isFinite(r.z2)) out.push(r);
  }
  return out;
}
function nearThing(x, z, rn, ri) { // 사람·미션 물건 가까이인가요
  const NPC = G.NPC;
  for (const k in NPC) { const g = NPC[k].g; if (g.visible && hyp(g.position.x - x, g.position.z - z) < rn) return true; }
  const items = G.items;
  for (let i = 0; i < items.length; i++) { const it = items[i]; if (it.alive && hyp(it.x - x, it.z - z) < ri) return true; }
  return false;
}
function spawnScatter() {
  compact();
  try { G.navGrid(); } catch (e) {}
  if (!G.NAV.grid || !flood()) return;
  const P = G.P, want = 12 + (Math.random() * 5 | 0), zr = zoneRects(), N = G.NAV.N, o = G.objective;
  let tgt = null; try { tgt = o && (o.exact || o.pos) ? (o.exact || o.pos)() : null; } catch (e) {}
  const put = [];
  for (let pass = 0; pass < 2 && put.length < want; pass++) { // 자리가 모자라면 두 번째에는 조금 느슨하게
    const gap = pass ? 4 : 7;
    for (let tries = 0; tries < 500 && put.length < want; tries++) {
      const x = (Math.random() * 2 - 1) * 44, z = (Math.random() * 2 - 1) * 44;
      if (!GEM.reach[cell(z) * N + cell(x)] || !clearAt(x, z, 2)) continue;
      if (hyp(x - P.x, z - P.z) < 6 || hyp(x, z - 38) < 6 || hyp(x, z - 45) < 4) continue; // 내 자리·시작 지점·교문 포탈
      if (tgt && hyp(x - tgt[0], z - tgt[1]) < 3.5) continue;
      if (nearThing(x, z, 2.5, 2.5)) continue;
      let bad = false;
      if (!pass) for (const r of zr) if (x > r.x1 - 0.6 && x < r.x2 + 0.6 && z > r.z1 - 0.6 && z < r.z2 + 0.6) { bad = true; break; }
      if (!bad) for (const q of put) if (hyp(q[0] - x, q[1] - z) < gap) { bad = true; break; }
      if (!bad) for (const g of GEM.list) if (g.alive && hyp(g.x - x, g.z - z) < 3) { bad = true; break; }
      if (!bad) put.push([x, z]);
    }
  }
  for (const q of put) addGem(q[0], q[1], false);
}
function killPath() { for (const g of GEM.list) if (g.path) g.alive = false; }
function pathGems(o) { // 목표가 멀면 가는 길에 줄지어 놓아요. 찾는 것이 과제(약한 힌트)일 때는 놓지 않아요
  let p = null; try { p = o && o.pos && !o.area ? o.pos() : null; } catch (e) {}
  const old = GEM.pathAt;
  if (p && old && hyp(p[0] - old[0], p[1] - old[1]) < 3) { for (const g of GEM.list) if (g.alive && g.path) return; }
  killPath(); GEM.pathAt = null;
  if (!p || GEM.lines >= 4) return;
  const P = G.P;
  if (!G.NAV.grid) G.navGrid();
  const pts = G.navFind(P.x, P.z, p[0], p[1]); if (!pts || pts.length < 2) return;
  let len = 0; for (let k = 1; k < pts.length; k++) len += hyp(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
  if (len <= 15) return;
  compact();
  const n = Math.max(6, Math.min(10, Math.floor((len - 7.5) / 2.2) + 1)), step = Math.min(2.4, (len - 7.5) / (n - 1));
  let seg = 1, acc = 0, sl = hyp(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), made = 0;
  for (let i = 0; i < n; i++) {
    const s = 4 + i * step;
    while (seg < pts.length - 1 && s > acc + sl) { acc += sl; seg++; sl = hyp(pts[seg][0] - pts[seg - 1][0], pts[seg][1] - pts[seg - 1][1]); }
    const a = pts[seg - 1], b = pts[seg], f = sl > 0 ? Math.min(1, (s - acc) / sl) : 0, x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
    if (hyp(x - p[0], z - p[1]) < 3 || nearThing(x, z, 1.6, 1.8)) continue;
    let bad = false; for (const g of GEM.list) if (g.alive && hyp(g.x - x, g.z - z) < 1.2) { bad = true; break; }
    if (!bad && addGem(x, z, true)) made++;
  }
  if (made) { GEM.pathAt = [p[0], p[1]]; GEM.lines++; }
}
function gemGuard() { // 나중에 생긴 미션 물건·자리를 옮긴 사람과 겹친 보석은 조용히 치워요
  for (const g of GEM.list) if (g.alive && g.age >= 1 && nearThing(g.x, g.z, 1.2, 1.7)) g.alive = false;
}
function gemSlow(step) {
  const S = G.S;
  if (S.stage !== GEM.stage) { // 미션이 바뀌면 다시 놓아요
    GEM.stage = S.stage; for (const g of GEM.list) g.alive = false; GEM.wait = 1; GEM.lines = 0; GEM.pathAt = null; GEM.obj = null; GEM.objDone = true;
  }
  const free = !G.dlgOpen && !G.busy;
  if (GEM.wait > 0) { if (free && (GEM.wait -= step) <= 0) spawnScatter(); return; }
  const o = G.objective;
  if (o !== GEM.obj) { GEM.obj = o; GEM.objT = 0; GEM.objDone = false; }
  if (!GEM.objDone && free && (GEM.objT += step) >= 1) { GEM.objDone = true; pathGems(o); }
  gemGuard();
}

// ---------------- 꾸미기: 모든 단원에서 모은 별 합계로 열려요 ----------------
// 번호는 엔진 makePerson 의 꾸미기 부품 번호와 같아요 (함께 하는 친구에게도 이 번호만 전해져요)
const DECOS = [
  { n: '없음', e: '🙂', need: 0 }, { n: '모자', e: '🧢', need: 10 }, { n: '가방', e: '🎒', need: 50 },
  { n: '풍선', e: '🎈', need: 120 }, { n: '왕관', e: '👑', need: 220 }, { n: '나비 날개', e: '🦋', need: 350 }
];
let otherStars = 0;
const AV = () => (window.__avatar && window.__avatar.setDeco ? window.__avatar : null);
const decoNow = () => { try { return AV().get().deco | 0; } catch (e) { return 0; } };
const decoOpen = () => { let k = 0; for (let i = 1; i < DECOS.length; i++) if ((F.stars | 0) >= DECOS[i].need) k = i; return k; };
function decoSet(n) { try { if (AV()) AV().setDeco(n); } catch (e) {} drawDeco(); }
function decoCheck(tot) { // 별 합계가 늘었는지 보고, 새로 열린 꾸미기를 알려요 (한 번 열린 것은 다시 잠기지 않아요)
  if (tot > (F.stars | 0)) { F.stars = tot; dirty = true; }
  const open = decoOpen();
  if (open > (F.decoMax | 0)) {
    F.decoMax = open; saveF();
    if (G.started && AV()) { // 놀이 중에 열리면 바로 입혀 줘요 (시작 화면에서 바꿀 수 있어요)
      decoSet(open); const d = DECOS[open];
      note('<div class="be">' + d.e + '</div><div><small>새 꾸미기!</small><b>' + d.n + '</b><span>별 ' + d.need + '개를 모아서 열렸어요</span></div>', 'badge', 4200);
      try { G.confetti(30); G.beep('fanfare'); } catch (e) {}
    }
  }
  if (decoNow() > open) decoSet(0);
}
function decoRefresh(T) { T = T || totals(); otherStars = T.stars - (G.S.stars | 0); decoCheck(T.stars); drawDeco(); }
function drawDeco() { // 시작 화면 '내 캐릭터를 골라요' 아래
  const ap = $('.avatarPick'); if (!ap || !AV()) return false;
  let w = $('#decoPick'); if (!w) { w = el('div'); w.id = 'decoPick'; ap.parentElement.insertBefore(w, ap.nextSibling); }
  const cur = decoNow(), open = decoOpen();
  w.innerHTML = '<span class="dpT">🎀 꾸미기</span>' + DECOS.map((d, i) => i <= open
    ? '<button type="button" data-d="' + i + '"' + (i === cur ? ' class="on"' : '') + ' title="' + d.n + '">' + d.e + '<small>' + d.n + '</small></button>'
    : '<button type="button" data-d="' + i + '" class="lock" title="별 ' + d.need + '개를 모으면 열려요">🔒<small>⭐ ' + d.need + '</small></button>').join('') + '<div class="dpHow"></div>';
  w.querySelectorAll('button').forEach(b => { b.onclick = safe(() => {
    const i = +b.dataset.d, d = DECOS[i];
    if (i > decoOpen()) { const h = w.querySelector('.dpHow'); h.textContent = d.e + ' ' + d.n + ': 별을 ' + d.need + '개 모으면 열려요 (지금 ' + (F.stars | 0) + '개)'; clearTimeout(drawDeco.t); drawDeco.t = setTimeout(() => { h.textContent = ''; }, 3500); return; }
    decoSet(i); try { G.beep('ok'); } catch (e) {}
  }); });
  return true;
}
(function waitPick(n) { if (!safe(drawDeco)() && n > 0) setTimeout(() => waitPick(n - 1), 300); })(40); // 캐릭터 고르기 칸이 생기면 그 아래에 달아요

// ---------------- 시작 화면·끝 화면 ----------------
function renderTitle() {
  const pick = $('.lessonPick'); if (!pick || $('#funTitle')) return;
  pick.querySelectorAll('a').forEach(a => { // 다른 단원 메달
    const m = /^L(\d+)/.exec(a.textContent.trim()); if (!m) return;
    const s = lessonSave(+m[1]), md = s && Array.isArray(s.medals) ? s.medals : []; const c = [0, 0, 0, 0];
    for (let i = 0; i < 6; i++) c[md[i] | 0]++;
    if (c[1] + c[2] + c[3] === 0) return;
    const sp = el('span', 'md', c[3] ? '🥇' + c[3] : c[2] ? '🥈' + c[2] : '🥉' + c[1]); a.appendChild(sp);
    a.title = (a.title ? a.title + ' · ' : '') + '메달 🥇' + c[3] + ' 🥈' + c[2] + ' 🥉' + c[1];
  });
  const box = el('div'); box.id = 'funTitle';
  const S = G.S, n = Math.max(1, G.stages - 1);
  box.innerHTML = '<div class="funMedals"><span>이 단원 메달</span>' + medalRow(S.medals, n) + '<span class="fg">💎 ' + (S.gems | 0) + '개</span></div>';
  box.appendChild(shelf());
  pick.parentElement.insertBefore(box, pick.nextSibling);
  try { const hc = $('#help .panel #helpClose'); if (hc) hc.parentElement.insertBefore(el('p', '', '💎 <b>보석</b>을 10개 모을 때마다 별이 하나 생겨요. 미션을 끝내면 <b>메달</b>을, 도전을 해내면 <b>배지</b>를 받아요.'), hc); } catch (e) {}
}
function renderEnd() {
  const endCard = $('#endCard'); if (!endCard) return;
  let box = $('#funEnd'); if (!box) { box = el('div'); box.id = 'funEnd'; endCard.parentElement.insertBefore(box, endCard.nextSibling); }
  const S = G.S, n = Math.max(1, G.stages - 1), r = M.last && M.last.st === G.stages - 2 ? M.last : null;
  box.innerHTML = '<div class="funMedals"><span>이 단원 메달</span>' + medalRow(S.medals, n) + '<span class="fg">💎 ' + (S.gems | 0) + '개</span></div>' +
    (r ? '<div class="feLast"><b>마지막 미션 ' + MEDAL[r.medal] + '</b>' + resultLines(r) + '</div>' : '');
  // 배지 진열장은 단추 아래에 둬요 (작은 화면에서도 단추가 바로 보이게)
  let box2 = $('#funEnd2'); if (!box2) { box2 = el('div'); box2.id = 'funEnd2'; endCard.parentElement.appendChild(box2); }
  box2.textContent = ''; box2.appendChild(shelf());
}
try { const end = $('#end'); if (end) new MutationObserver(safe(() => { if (end.classList.contains('show')) { full(); renderEnd(); } })).observe(end, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}

// ---------------- 엔진이 알려 주는 일 ----------------
addEventListener('e3d', safe((e) => {
  const d = e.detail || {}, type = d.type, data = d.data || {};
  if (type === 'miss') { if (data.stage === M.stage) M.miss++; }
  else if (type === 'answer') quick();
  else if (type === 'stage_done') stageDone(data.stage);
  else if (type === 'start') { missionReset(); GEM.stage = -1; hudGem(); full(); }
  else if (type === 'finish') full();
  else if (type === 'portal') { noteWait = performance.now() + 9000; grant('portal'); dirty = true; flush(); } // 배지 알림은 도착한 단원에서 보여 줘요
  else if (type === 'mp_ask') grant('ask');
  else if (type === 'mp_five') grant('five');
}));

// ---------------- 매 프레임 ----------------
let lastNow = performance.now(), slow = 0, stageSeen = -1;
G.tickers.push(safe((dt, t) => {
  const now = performance.now(), real = Math.min(1, Math.max(0, (now - lastNow) / 1000)); lastNow = now;
  if (!G.started) return;
  const S = G.S;
  if (S.stage !== M.stage) missionReset();
  M.t += real;
  if (!GEM.mesh) { gemInit(); hudGem(); }
  gemTick(dt, t);
  if ((slow += real) >= 0.25) { // 무거운 일은 1초에 네 번만
    gemSlow(slow); slow = 0;
    if (S.stage !== stageSeen) { stageSeen = S.stage; full(); }
    quick(); decoCheck(otherStars + (S.stars | 0)); badgePump(); flush();
  }
}));

safe(renderTitle)(); safe(full)(); safe(hudGem)();
window.FUN = { F, M, GEM, BADGES, DECOS, grant, showCard, stageDone, spawnScatter, pathGems, note, totals, renderEnd, decoSet, decoCheck };
})();
