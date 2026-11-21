/* 영어 3D · 함께 하기 (같은 반 · 같은 모둠 친구와 한 공간에서 만나요)
 * - 반에 참여한 학생만 켜져요. 연결이 안 되면 조용히 혼자 하기로 돌아가요. 게임은 절대 막지 않아요.
 * - 서버 없이 브라우저끼리 바로 연결해요(WebRTC). 처음 만날 때만 공개 중계소를 잠깐 써요.
 * - 오가는 것: 위치·방향, 별명·번호, 옷 색, 미션 번호·별 수, 정해진 이모트/문장 번호. 자유 글은 보내지 않아요.
 * - 끄기: net-config.js 에 multiplayer: false
 */
(function () {
  'use strict';
  var G = window.__mp;
  if (!G || window.MULTI) return;
  var qs; try { qs = new URLSearchParams(location.search); } catch (e) { return; }
  var cfg = window.NET_CONFIG || {};
  var isDev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  var devMp = isDev && qs.has('mp');
  if (cfg.multiplayer === false && !devMp) return;
  if (qs.has('autotest') && !devMp) return;
  if (!window.RTCPeerConnection || !window.crypto || !crypto.subtle || !window.THREE) return;

  var APP = 'emelmusekor.github.io/english3d';
  var VER = '0.27.0';
  var STRATS = ['trystero', '@trystero-p2p/torrent', '@trystero-p2p/mqtt']; // 앞의 것이 막히면 다음 것으로
  var MAX = 8;            // 한 모둠(방) 최대 인원
  var SEND_MS = 200;      // 위치 보내기 간격 (5Hz)
  var NEAR = 3.2;         // 말 걸 수 있는 거리
  var STAR_COOL = 90000;  // 같은 친구와 별 보너스 쉬는 시간
  var STAR_DAY = 12;      // 하루 친구 별 보너스 상한
  var EMO = [
    { e: '👋', en: 'Hi!' }, { e: '👍', en: 'Good job!' }, { e: '😀', en: 'Thank you!' },
    { e: '❓', en: 'Pardon?' }, { e: '🆘', en: 'Help me, please!' }, { e: '🤝', en: "I'm here!" }
  ];
  var SHIRTS = [0xe76f51, 0x2a9d8f, 0x457b9d, 0xf4a261, 0x9b5de5, 0xef476f, 0x06b6a0, 0xe9c46a];
  var HAIRS = [0x3b2a1a, 0x1a1a1a, 0x6b4423, 0x8d5524];
  var SKINS = [0xf5cfa8, 0xe8b98c, 0xc68e5f];

  // ------------------------------------------------------------ 덧붙이는 모양
  try {
    var css = document.createElement('style');
    css.textContent = '#mpChip em{font-style:normal;font-size:13.5px;color:#31708f;text-align:left}#mpChip em.done{color:#2a9d8f;font-weight:700}' +
      '#mpPanel .mpRow.go{border:2px solid #dbe4ee;font:inherit;font-size:16px;color:inherit;cursor:pointer;text-align:left}#mpPanel .mpRow.go:hover{border-color:#2a9d8f;background:#f0faf8}' +
      '#mpPanel .mpQuest{flex:1 1 100%;display:flex;flex-direction:column;gap:2px;background:#fff8e6;border:2px solid #f4d58d;border-radius:12px;padding:7px 11px;font-size:15px}#mpPanel .mpQuest.done{background:#eafaf5;border-color:#2a9d8f}#mpPanel .mpQuest span{color:#5b6777;font-size:14px}' +
      '#mpFollow{position:fixed;left:12px;top:150px;display:none;align-items:center;gap:8px;background:rgba(42,157,143,.94);color:#fff;border-radius:14px;padding:6px 13px 6px 9px;font-size:16px;z-index:5;box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:pointer}#mpFollow.show{display:flex}#mpFollow i{display:inline-block;font-style:normal;font-size:22px;line-height:1;transition:transform .12s linear}' +
      '@media (max-width:640px){#mpFollow{top:calc(var(--hudB,144px) + 124px);font-size:14px}#mpChip em{font-size:12px}}';
    document.head.appendChild(css);
  } catch (e) {}

  // ------------------------------------------------------------ 도우미
  var noop = function () {};
  function clean(v, max) {
    return String(v == null ? '' : v).replace(/<[^>]*>/g, '').replace(/[<>&"'`\\]/g, '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function int(v, lo, hi) { var n = Math.round(Number(v)); if (!isFinite(n)) n = lo; return Math.max(lo, Math.min(hi, n)); }
  function num(v, lo, hi) { var n = Number(v); if (!isFinite(n)) n = 0; return Math.max(lo, Math.min(hi, n)); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function josa(word, a, b, etc) {
    var c = String(word).charCodeAt(String(word).length - 1) - 0xAC00;
    if (c < 0 || c > 11171) return etc;
    return c % 28 ? a : b;
  }
  function wa(word) { return josa(word, '과', '와', '(와)과'); }
  function eul(word) { return josa(word, '을', '를', '님을'); }
  function iga(word) { // 받침에 따라 이/가
    var c = String(word).charCodeAt(String(word).length - 1) - 0xAC00;
    if (c < 0 || c > 11171) return '님이';
    return c % 28 ? '이' : '가';
  }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function withTimeout(p, ms) {
    return new Promise(function (res, rej) {
      var to = setTimeout(function () { rej(new Error('timeout')); }, ms);
      p.then(function (v) { clearTimeout(to); res(v); }, function (e) { clearTimeout(to); rej(e); });
    });
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function sfx(k) { try { G.beep(k); } catch (e) {} }
  function toast(html, ms) { try { G.toast(html, ms || 2600); } catch (e) {} }

  // ------------------------------------------------------------ 내 정보
  var me = null;          // { code, num, nick }
  var group = 1;
  var lessonId = /^L\d{1,2}$/.test(String(G.L && G.L.id)) ? G.L.id : 'L1';
  function readProfile() {
    if (devMp) {
      var m = /^([A-Za-z0-9]{5}),(\d{1,2}),([^,]{1,12})$/.exec(qs.get('mp') || '');
      if (m && +m[2] >= 1) return { code: m[1].toUpperCase(), num: +m[2], nick: clean(m[3], 12) || '친구' };
    }
    try { return window.NET && window.NET.joined() ? window.NET.profile() : null; } catch (e) { return null; }
  }
  function cleanAv(a) {
    a = a && typeof a === 'object' ? a : {};
    var o = {};
    var kk = a.key || a.look;
    if (typeof kk === 'string' && /^(Nara|Hajun|Olivia|Kai|Rani|Joel)$/.test(kk)) return { look: kk };
    ['skin', 'pants', 'hair', 'shirt', 'skirt'].forEach(function (k) {
      var v = Number(a[k]); if (a[k] != null && isFinite(v) && v >= 0 && v <= 0xffffff) o[k] = v | 0;
    });
    if (a.girl) o.girl = 1;
    if (typeof a.preset === 'string' && /^[\w-]{1,20}$/.test(a.preset)) o.preset = a.preset;
    if (o.shirt == null) o.shirt = 0x457b9d;
    return o;
  }
  function myAvatar() {
    try {
      var a = window.__avatar, c = a && (typeof a.get === 'function' ? a.get() : a.config);
      if (c && typeof c === 'object') return cleanAv(c);
    } catch (e) {}
    var n = me ? me.num : 1;
    return { shirt: SHIRTS[n % SHIRTS.length], hair: HAIRS[n % HAIRS.length], skin: SKINS[n % SKINS.length], pants: 0x2f3e66 };
  }
  var helpUntil = 0;
  function myState() {
    var S = G.S || {};
    questRoll();
    return { k: me.nick, n: me.num, av: myAvatar(), st: int(S.stage, 0, 6), s: int(S.stars, 0, 99999), h: Date.now() < helpUntil ? 1 : 0, qe: quest.e, qp: quest.p };
  }
  function cleanState(v) {
    if (!v || typeof v !== 'object') return null;
    return { k: clean(v.k, 12) || '친구', n: int(v.n, 1, 99), av: cleanAv(v.av), st: int(v.st, 0, 6), s: int(v.s, 0, 99999), h: v.h ? 1 : 0, qe: int(v.qe, 0, 1e9), qp: int(v.qp, 0, 2) };
  }

  // ------------------------------------------------------------ 이 단원에서 주고받을 말
  var SENT = (G.L && Array.isArray(G.L.sentences) ? G.L.sentences : []).filter(function (s) { return s && typeof s.en === 'string'; }).slice(0, 8);
  var QS = SENT.filter(function (s) { return /\?\s*$/.test(s.en); });
  var AS = SENT.filter(function (s) { return !/\?\s*$/.test(s.en); });
  if (!QS.length) QS = SENT.slice();
  if (!AS.length) AS = SENT.slice();

  // ------------------------------------------------------------ 연결
  var T = null, room = null, act = {}, ust = null;
  var stratI = 0, connecting = false, status = 'off', watchTo = null, retryTo = null, gen = 0;
  var peers = {};         // userId → peer
  var lastSent = '', lastSentT = 0, lastStateSig = '', leaving = false;

  function roomId() { return me.code + '-' + lessonId + '-g' + group; }
  function peerList() { return Object.keys(peers).map(function (k) { return peers[k]; }); }
  function liveList() { return peerList().filter(function (p) { return p.st; }); }

  function connect() {
    if (room || connecting || !me) return;
    connecting = true; setStatus('wait');
    // 같은 반 친구들이 시작 자리에서 한데 겹쳐 서지 않게 번호에 따라 조금씩 옆으로 서요
    try { var P0 = G.P; if (Math.abs(P0.x) < 0.01 && Math.abs(P0.z - 40) < 0.01) { P0.x = ((me.num - 1) % 5 - 2) * 1.1; P0.z = 40 + (Math.floor((me.num - 1) / 5) % 2) * 1.3; } } catch (e) {}
    var my = ++gen, name = STRATS[stratI];
    withTimeout(import('https://cdn.jsdelivr.net/npm/' + name + '@' + VER + '/+esm'), 15000).then(function (mod) {
      if (my !== gen) return;
      connecting = false;
      T = mod;
      var r = mod.joinRoom({ appId: APP, identity: 'none', maxUsers: MAX, relayConfig: { warnOnRelayFailure: false } }, roomId());
      room = r;
      wire(r, my);
      clearTimeout(watchTo);
      watchTo = setTimeout(function () { checkRelays(my); }, 12000);
    }).catch(function () { if (my === gen) { connecting = false; nextStrategy(); } });
  }
  function leave() {
    gen++; connecting = false;
    clearTimeout(watchTo); clearTimeout(retryTo);
    var r = room; room = null; ust = null; act = {};
    leaving = true; Object.keys(peers).forEach(dropPeer); leaving = false;
    followId = null;
    if (r) { try { var p = r.leave(); if (p && p.catch) p.catch(noop); } catch (e) {} }
  }
  function nextStrategy() {
    leave();
    stratI++;
    if (stratI >= STRATS.length) {
      stratI = 0; setStatus('solo');
      retryTo = setTimeout(function () { if (!room) connect(); }, 120000);
    } else connect();
  }
  function checkRelays(my) {
    if (my !== gen || !room) return;
    if (peerList().length) { setStatus('on'); return; }
    var open = -1;
    try {
      if (T && T.getRelaySockets) { var s = T.getRelaySockets(); open = 0; Object.keys(s).forEach(function (u) { if (s[u] && s[u].readyState === 1) open++; }); }
    } catch (e) {}
    if (open === 0) nextStrategy(); else setStatus('on');
  }

  function wire(r, my) {
    try {
      r.onError(function (err) {
        if (my !== gen) return;
        var code = err && err.code;
        if (code === 'relay-failed' && !peerList().length) nextStrategy();
        else if (code === 'room-full' && !peerList().length) { setStatus('full'); toast('👥 이 모둠은 꽉 찼어요. 다른 모둠을 골라 보세요.', 3500); }
      });
      ust = r.makeUserState('me', null);
      lastStateSig = JSON.stringify(myState());
      ust.set(JSON.parse(lastStateSig));
      ust.onChange(function (v, c) {
        if (my !== gen || !c || c.self) return;
        if (c.removed) return;
        setPeerState(c.userId, v);
      });
      r.onUserJoin(function (c) {
        if (my !== gen) return;
        ensurePeer(c.userId);
        try { setPeerState(c.userId, ust.get(c.userId)); } catch (e) {}
        lastSent = ''; // 새 친구에게 내 위치를 바로 알려요
        setStatus('on');
      });
      r.onUserLeave(function (c) { if (my === gen) { dropPeer(c.userId); refreshChip(); } });
      act.p = r.makeAction('p'); act.e = r.makeAction('e'); act.q = r.makeAction('q'); act.a = r.makeAction('a');
      act.p.onMessage(function (d, c) { if (my === gen) onPos(c.userId, d); });
      act.e.onMessage(function (d, c) { if (my === gen) onEmote(c.userId, d); });
      act.q.onMessage(function (d, c) { if (my === gen) onAsk(c.userId, d); });
      act.a.onMessage(function (d, c) { if (my === gen) onAnswer(c.userId, d); });
    } catch (e) { nextStrategy(); }
  }
  function send(name, data, target) {
    try {
      if (!room || !act[name]) return;
      var p = target ? act[name].send(data, { target: target }) : act[name].send(data);
      if (p && p.catch) p.catch(noop);
    } catch (e) {}
  }

  // ------------------------------------------------------------ 친구 아바타
  function ensurePeer(id) {
    if (peers[id]) return peers[id];
    if (Object.keys(peers).length >= MAX + 2) return null;
    var p = peers[id] = { id: id, st: null, g: null, sig: '', x: 0, z: 40, yaw: 0, jy: 0, tx: 0, tz: 40, tyaw: 0, tjy: 0, has: false, walk: 0, ph: Math.random() * 10,
      bubble: null, bubbleT: 0, beam: null, fbeam: null, lastEmo: 0, helped: false, d: 99, flags: { wave: false, talk: false, look: null }, ent: null, waveT: 0, waveUntil: 0, hfT: 0 };
    return p;
  }
  function dropPeer(id) {
    var p = peers[id]; if (!p) return;
    if (p.st && G.started && !leaving) toast('👋 ' + esc(p.st.k) + iga(p.st.k) + ' 나갔어요.', 1800);
    unlist(p);
    if (p.g) { try { G.scene.remove(p.g); } catch (e) {} }
    if (followId === id) followId = null;
    delete peers[id];
    if (pendingOut && pendingOut.to === id) pendingOut = null;
    if (pendingIn && pendingIn.from === id) clearIncoming(false);
  }
  function buildAvatar(p) {
    try {
      unlist(p);
      if (p.g) G.scene.remove(p.g);
      var o = Object.assign({}, p.st.av, { name: p.st.k });
      var g = G.makePerson(o);
      g.position.set(p.x, 0, p.z); g.rotation.y = p.yaw + Math.PI; g.visible = p.has;
      G.scene.add(g); p.g = g; p.bubble = null; p.beam = null; p.fbeam = null;
      var ppl = window.__avatar && window.__avatar.people;
      if (ppl && ppl.push) { p.ent = { g: g, flags: p.flags }; ppl.push(p.ent); }
    } catch (e) { p.g = null; }
  }
  function unlist(p) {
    try { var ppl = window.__avatar && window.__avatar.people; if (ppl && p.ent) { var i = ppl.indexOf(p.ent); if (i >= 0) ppl.splice(i, 1); } } catch (e) {}
    p.ent = null;
  }
  function setPeerState(id, raw) {
    var st = cleanState(raw); if (!st) return;
    var p = ensurePeer(id); if (!p) return;
    var first = !p.st, old = p.st;
    p.st = st;
    var sig = JSON.stringify([st.k, st.av]);
    if (sig !== p.sig) { p.sig = sig; buildAvatar(p); }
    if (first) {
      if (G.started) { toast('🙌 ' + esc(st.k) + iga(st.k) + ' 왔어요!', 2200); sfx('get'); }
      baseMilestone();
    } else {
      if (st.st > old.st && G.started) { toast('👏 ' + esc(st.k) + iga(st.k) + ' 미션 ' + st.st + '을 끝냈어요!', 2600); sfx('get'); }
      if (st.h && !old.h) { p.helped = false; if (G.started) { toast('🆘 ' + esc(st.k) + iga(st.k) + ' 도와 달래요! 주황 빛기둥을 찾아가요.', 3600); sfx('get'); } }
    }
    setBeam(p, !!st.h);
    refreshChip();
  }
  function setBeam(p, on) {
    if (!p.g) return;
    if (on && !p.beam) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 22, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xff9f1c, transparent: true, opacity: 0.3, depthWrite: false }));
      m.position.y = 13; p.g.add(m); p.beam = m;
    } else if (!on && p.beam) { p.g.remove(p.beam); p.beam = null; }
  }
  function bubble(p, text, sec) {
    if (!p.g) return;
    try {
      if (p.bubble) p.g.remove(p.bubble);
      var s = G.textSprite(text, 0.42, { fs: 44, bg: '#fff', fg: '#1d3557', border: '#2a9d8f', pad: 18 });
      s.position.y = 2.85; p.g.add(s); p.bubble = s; p.bubbleT = sec || 4;
    } catch (e) {}
  }
  function onPos(id, d) {
    var p = peers[id]; if (!p || !Array.isArray(d) || d.length < 3) return;
    p.tx = num(d[0], -70, 70); p.tz = num(d[1], -70, 70); p.tyaw = num(d[2], -1000, 1000); p.tjy = num(d[3], 0, 4);
    if (!p.has) { p.has = true; p.x = p.tx; p.z = p.tz; p.yaw = p.tyaw; if (p.g) { p.g.visible = true; p.g.position.set(p.x, 0, p.z); } }
  }

  // ------------------------------------------------------------ 이모트
  var lastEmoteT = 0;
  function emote(i) {
    if (!room || !G.started || i < 0 || i > 4) return;
    var now = Date.now(); if (now - lastEmoteT < 1500) return; lastEmoteT = now;
    var e = EMO[i];
    send('e', i);
    try { G.speak(e.en, '나'); } catch (er) {}
    if (i === 0) {
      myWaveT = now;
      var nearAny = false;
      liveList().forEach(function (p) { if (p.has && p.d < 6) nearAny = true; if (p.has && p.d < NEAR && now - p.waveT < 5000) highFive(p); });
      if (nearAny) questAdd(1, 1);
    }
    if (i === 4) {
      helpUntil = now + 45000; pushState();
      toast('🆘 “' + e.en + '” 친구들에게 도와 달라고 했어요.', 2600);
    } else toast(e.e + ' “' + e.en + '”' + (liveList().length ? '' : ' (아직 친구가 없어요)'), 1800);
  }
  function onEmote(id, d) {
    var p = peers[id]; if (!p || !p.st) return;
    var i = int(d, 0, EMO.length - 1), now = Date.now();
    if (now - p.lastEmo < 900) return; p.lastEmo = now;
    var e = EMO[i];
    bubble(p, e.e + ' ' + e.en, 4);
    if (i === 0) { p.waveT = now; p.waveUntil = now + 2600; if (p.has && p.d < NEAR && now - myWaveT < 5000) highFive(p); }
    if (p.d < 12 && G.started && !G.dlgOpen) { try { G.speak(e.en, p.st.k); } catch (er) {} }
    if (i === 5 && Date.now() < helpUntil && p.d < 6) { // 도와주러 온 친구
      helpUntil = 0; pushState();
      toast('🤝 ' + esc(p.st.k) + iga(p.st.k) + ' 도와주러 왔어요!', 2600);
      questAdd(2, 1);
      reward(p, '친구가 도와주러 왔어요!');
    }
  }

  var myWaveT = 0;
  function highFive(p) {
    var now = Date.now(); if (now - p.hfT < 8000 || !G.started) return; p.hfT = now;
    bubble(p, '🙌 High five!', 3);
    try { G.confetti(14); } catch (e) {}
    sfx('star');
    toast('🙌 <b>High five!</b> ' + esc(p.st.k) + wa(p.st.k) + ' 손뼉 짝!', 2200);
    if (!G.dlgOpen) setTimeout(function () { try { G.speak('High five!', '나'); } catch (e) {} }, 700);
  }

  // ------------------------------------------------------------ 모둠 퀘스트 (5분마다 바뀌는 선택 활동)
  var QUEST_MS = 300000, QUEST_DAY = 6;
  var quest = { e: 0, p: 0, done: false, told: 0 };
  var QUESTS = [
    { t: '친구에게 영어로 묻고 대답 듣기', how: '친구 옆에서 E 를 눌러 영어로 물어봐요.', goal: function (m) { return Math.max(2, Math.min(m, 4)); } },
    { t: '친구 옆에 모여 👋 Hi! 하기', how: '친구 가까이 가서 숫자 키 1 (👋) 을 눌러요.', goal: function (m) { return Math.max(2, Math.ceil(m * 0.6)); } },
    { t: '도와 달라는 친구에게 가 주기', how: '누가 5 (🆘) 를 누르면 주황 빛기둥으로 가요.', goal: function () { return 2; } }
  ];
  var qEpoch = function () { return Math.floor(Date.now() / QUEST_MS); };
  function questRoll() {
    var e = qEpoch();
    if (quest.e !== e) {
      var rec = lsGet('english3d_mp_quest');
      quest.e = e; quest.p = 0; quest.done = !!(rec && rec.e === e);
    }
  }
  function questInfo() {
    questRoll();
    var q = QUESTS[quest.e % QUESTS.length], m = liveList().length + 1, sum = quest.p;
    liveList().forEach(function (p) { if (p.st.qe === quest.e) sum += p.st.qp; });
    var goal = q.goal(m);
    return { q: q, members: m, sum: Math.min(sum, goal), goal: goal, done: quest.done };
  }
  function questAdd(type, cap) {
    questRoll();
    if (quest.e % QUESTS.length !== type || liveList().length < 1) return;
    if (quest.p >= cap) return;
    quest.p++; pushState(); questCheck();
  }
  function questCheck() {
    if (!room || !G.started) return;
    var qi = questInfo();
    if (qi.members < 2) return;
    if (!quest.done && quest.told !== quest.e && !G.dlgOpen && !G.busy) {
      quest.told = quest.e;
      toast('🎯 <b>모둠 퀘스트</b>: ' + qi.q.t + '<br><small>' + qi.q.how + '</small>', 4200);
    }
    if (quest.done || qi.sum < qi.goal) return;
    quest.done = true; quest.told = quest.e;
    lsSet('english3d_mp_quest', { e: quest.e });
    var day = new Date().toISOString().slice(0, 10);
    var rec = lsGet('english3d_mp_qday'); if (!rec || rec.d !== day) rec = { d: day, n: 0 };
    try { G.confetti(55); } catch (e) {}
    sfx('star');
    if (rec.n < QUEST_DAY) {
      rec.n++; lsSet('english3d_mp_qday', rec);
      try { G.addStar(1); } catch (e) {}
      toast('🎉 <b>모둠 퀘스트 성공!</b> 모두 별 +1 ⭐', 3600);
    } else toast('🎉 <b>모둠 퀘스트 성공!</b> 다 같이 잘했어요!', 3600);
    pushState();
  }

  // ------------------------------------------------------------ 친구 찾아가기
  var followId = null, followUntil = 0;
  var followEl = el('div'); followEl.id = 'mpFollow';
  var followArrow = el('i', '', '⬆'), followText = el('span');
  followEl.appendChild(followArrow); followEl.appendChild(followText); document.body.appendChild(followEl);
  followEl.onclick = function () { stopFollow(); };
  function startFollow(p) {
    if (!p || !p.st) return;
    if (!p.has) { toast('🙂 ' + esc(p.st.k) + iga(p.st.k) + ' 아직 시작 화면에 있어요.', 2200); return; }
    followId = p.id; followUntil = Date.now() + 45000;
    toast('📍 ' + esc(p.st.k) + eul(p.st.k) + ' 찾아가요. 초록 빛기둥과 화살표를 따라가요.', 2600);
  }
  function stopFollow() {
    var p = followId && peers[followId]; followId = null;
    followEl.classList.remove('show');
    if (p && p.fbeam && p.g) { p.g.remove(p.fbeam); p.fbeam = null; }
  }
  function followTick() {
    if (!followId) { if (followEl.classList.contains('show')) followEl.classList.remove('show'); return; }
    var p = peers[followId], P = G.P;
    if (!p || !p.g || !p.has || Date.now() > followUntil) { stopFollow(); return; }
    if (p.d < 2.6) { stopFollow(); toast('🙌 ' + esc(p.st.k) + eul(p.st.k) + ' 만났어요!', 1800); sfx('get'); return; }
    if (!p.fbeam) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 22, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x2a9d8f, transparent: true, opacity: 0.32, depthWrite: false }));
      m.position.y = 13.5; p.g.add(m); p.fbeam = m;
    }
    var rel = Math.atan2(-(p.x - P.x), -(p.z - P.z)) - P.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    followArrow.style.transform = 'rotate(' + (-rel).toFixed(2) + 'rad)';
    followText.textContent = p.st.k + ' ' + Math.round(p.d) + 'm';
    followEl.classList.toggle('show', G.started && !G.dlgOpen && !panelOpen);
  }

  // ------------------------------------------------------------ 별 보너스 (같은 친구는 잠깐 쉬고, 하루 상한)
  var lastStar = {};
  function reward(p, msg) {
    var now = Date.now(), key = p.st ? p.st.n : 0;
    var day = new Date().toISOString().slice(0, 10);
    var rec = lsGet('english3d_mp_day'); if (!rec || rec.d !== day) rec = { d: day, n: 0 };
    if (now - (lastStar[key] || 0) < STAR_COOL || rec.n >= STAR_DAY) { toast('😊 ' + msg, 2200); return; }
    lastStar[key] = now; rec.n++; lsSet('english3d_mp_day', rec);
    try { G.addStar(1); } catch (e) {}
    sfx('star');
    toast('⭐ ' + msg + ' 별 +1', 2600);
    pushState();
  }

  // ------------------------------------------------------------ 창 (묻기·대답하기·모둠)
  var panel = el('div'); panel.id = 'mpPanel';
  var pTitle = el('div', 'mpT'), pEn = el('div', 'mpEn'), pKo = el('div', 'mpKo'), pBody = el('div', 'mpCh'), pX = el('button', 'mpX', '닫기 (Esc)');
  pX.type = 'button';
  panel.appendChild(pTitle); panel.appendChild(pEn); panel.appendChild(pKo); panel.appendChild(pBody); panel.appendChild(pX);
  document.body.appendChild(panel);
  var panelOpen = false, panelKeys = null, panelClose = null;
  function openPanel(o) {
    if (panelOpen) closePanel(true);
    pTitle.textContent = o.title || ''; pEn.textContent = o.en || ''; pEn.style.display = o.en ? '' : 'none';
    pKo.textContent = o.ko || ''; pKo.style.display = o.ko ? '' : 'none';
    pBody.textContent = ''; panelKeys = [];
    (o.choices || []).forEach(function (c, i) {
      var b = el('button', 'mpChoice'); b.type = 'button';
      var n = el('span', 'num', String(i + 1)); b.appendChild(n);
      b.appendChild(document.createTextNode(c.en));
      if (c.ko && G.S && G.S.koHelp) b.appendChild(el('small', '', c.ko));
      b.onclick = function () { c.fn(); };
      pBody.appendChild(b); panelKeys.push(b);
    });
    if (o.build) o.build(pBody);
    panelClose = o.onClose || null;
    panel.classList.add('show'); panelOpen = true;
    try { G.lock(true); } catch (e) {}
  }
  function closePanel(silent) {
    if (!panelOpen) return;
    panelOpen = false; panel.classList.remove('show'); panelKeys = null;
    var f = panelClose; panelClose = null;
    try { G.lock(false); } catch (e) {}
    if (f && !silent) f();
  }
  pX.onclick = function () { closePanel(); };
  addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    if (panelOpen) {
      if (e.code === 'Escape') { closePanel(); return; }
      var m = /^Digit([1-9])$/.exec(e.code);
      if (m && panelKeys && panelKeys[+m[1] - 1]) panelKeys[+m[1] - 1].click();
      return;
    }
    if (!room || !G.started || G.dlgOpen) return;
    var d = /^Digit([1-5])$/.exec(e.code);
    if (d) emote(+d[1] - 1);
    if (e.code === 'KeyT' && pendingIn) openAnswer();
  });

  // ----- 친구에게 영어로 묻기
  var pendingOut = null;  // { id, to, t }
  var pendingIn = null;   // { id, from, q, t }
  var note = el('button'); note.id = 'mpNote'; note.type = 'button'; document.body.appendChild(note);
  note.onclick = function () { openAnswer(); };

  function openAsk(p) {
    if (pendingOut && Date.now() - pendingOut.t < 30000) { toast('대답을 기다리는 중이에요…', 1500); return; }
    openPanel({
      title: '💬 ' + p.st.k + '에게 영어로 물어봐요',
      ko: '물어볼 말을 골라요. 친구가 영어로 대답해 줘요.',
      choices: QS.map(function (q, i) {
        return { en: q.en, ko: q.ko, fn: function () {
          closePanel(true);
          if (!peers[p.id]) return;
          var id = Math.floor(Math.random() * 1e9);
          pendingOut = { id: id, to: p.id, t: Date.now() };
          try { G.speak(q.en, '나'); } catch (e) {}
          send('q', { i: i, id: id }, p.id);
          toast('🗣 “' + esc(q.en) + '” 대답을 기다려요…', 3000);
        } };
      })
    });
  }
  function onAsk(id, d) {
    var p = peers[id]; if (!p || !p.st || !d || typeof d !== 'object') return;
    var qi = int(d.i, 0, QS.length - 1), rid = int(d.id, 0, 1e9);
    if (pendingIn || !G.started) { send('a', { i: -1, id: rid }, id); return; }
    pendingIn = { id: rid, from: id, q: qi, t: Date.now() };
    bubble(p, QS[qi].en, 8);
    note.textContent = '💬 ' + p.st.k + iga(p.st.k) + ' 물어봐요! 눌러서 대답해요' + (G.isTouch ? '' : ' (T)');
    note.classList.add('show'); sfx('get');
    if (!G.dlgOpen && !G.busy && p.d < 6) openAnswer();
  }
  function clearIncoming(tellBusy) {
    if (!pendingIn) return;
    if (tellBusy) send('a', { i: -1, id: pendingIn.id }, pendingIn.from);
    pendingIn = null; note.classList.remove('show');
    if (panelOpen && panelClose === answerClosed) closePanel(true);
  }
  function answerClosed() { /* 닫아도 쪽지는 남아 있어요 */ }
  function openAnswer() {
    var inc = pendingIn; if (!inc || panelOpen || G.dlgOpen || G.busy) return;
    var p = peers[inc.from]; if (!p || !p.st) { clearIncoming(false); return; }
    var q = QS[inc.q];
    try { G.speak(q.en, p.st.k); } catch (e) {}
    openPanel({
      title: '💬 ' + p.st.k + iga(p.st.k) + ' 물었어요',
      en: q.en, ko: (G.S && G.S.koHelp ? q.ko + ' · ' : '') + '영어로 대답해요.',
      onClose: answerClosed,
      choices: AS.map(function (a, i) {
        return { en: a.en, ko: a.ko, fn: function () {
          if (pendingIn !== inc) { closePanel(true); return; }
          pendingIn = null; note.classList.remove('show');
          closePanel(true);
          try { G.speak(a.en, '나'); } catch (e) {}
          send('a', { i: i, id: inc.id }, inc.from);
          if (peers[inc.from]) reward(peers[inc.from], '친구에게 영어로 대답했어요!');
        } };
      })
    });
  }
  function onAnswer(id, d) {
    var out = pendingOut;
    if (!out || out.to !== id || !d || typeof d !== 'object' || int(d.id, 0, 1e9) !== out.id) return;
    pendingOut = null;
    var p = peers[id]; if (!p || !p.st) return;
    var ai = int(d.i, -1, AS.length - 1);
    if (ai < 0) { toast('🙂 ' + esc(p.st.k) + iga(p.st.k) + ' 지금 바빠요. 조금 뒤에 다시 물어봐요.', 2600); return; }
    var a = AS[ai];
    bubble(p, a.en, 6); questAdd(0, 2);
    if (!G.dlgOpen) { try { G.speak(a.en, p.st.k); } catch (e) {} }
    toast('💬 <b>' + esc(p.st.k) + '</b>: ' + esc(a.en), 3200);
    setTimeout(function () { if (peers[id]) reward(peers[id], '친구와 영어로 이야기했어요!'); }, 900);
  }

  // ------------------------------------------------------------ 모둠 칸 (HUD)
  var chip = el('button'); chip.id = 'mpChip'; chip.type = 'button';
  var chipText = el('span'), chipBar = el('i'), chipFill = el('b'), chipQuest = el('em');
  chipBar.appendChild(chipFill); chip.appendChild(chipText); chip.appendChild(chipBar); chip.appendChild(chipQuest);
  document.body.appendChild(chip);
  chip.onclick = function () { if (!panelOpen && !G.dlgOpen && !G.busy && G.started) openGroupPanel(); };
  function setStatus(s) { status = s; refreshChip(); }
  var mileBase = -1, mileMembers = 0;
  function groupSum() { var s = int(G.S && G.S.stars, 0, 99999); liveList().forEach(function (p) { s += p.st.s; }); return s; }
  function baseMilestone() { mileMembers = liveList().length + 1; mileBase = Math.floor(groupSum() / (15 * mileMembers)); }
  function refreshChip() {
    var n = liveList().length;
    chip.classList.toggle('show', !!me && G.started && status !== 'off');
    chip.classList.toggle('alone', n === 0);
    chipQuest.style.display = n ? '' : 'none';
    if (status === 'wait' && !n) chipText.textContent = '📡 모둠 ' + group + ' · 연결하는 중…';
    else if (status === 'solo') chipText.textContent = '🙂 혼자 하는 중 (연결 안 됨)';
    else if (status === 'full') chipText.textContent = '👥 모둠 ' + group + ' 꽉 찼어요';
    else if (!n) chipText.textContent = '🟢 모둠 ' + group + ' · 친구 0명 · 기다려요';
    else {
      var step = 15 * (n + 1), sum = groupSum();
      chipText.textContent = '🟢 모둠 ' + group + ' · ' + (n + 1) + '명 · 우리 모둠 ⭐ ' + sum;
      var qi = questInfo();
      chipQuest.textContent = qi.done ? '🎯 모둠 퀘스트 성공! 🎉' : '🎯 ' + qi.q.t + ' ' + qi.sum + '/' + qi.goal;
      chipQuest.classList.toggle('done', qi.done);
      chipFill.style.width = Math.round((sum % step) / step * 100) + '%';
      if (mileMembers !== n + 1 || mileBase < 0) baseMilestone();
      else {
        var m = Math.floor(sum / step);
        if (m > mileBase) {
          mileBase = m;
          if (G.started) { try { G.confetti(45); } catch (e) {} sfx('star'); toast('🎉 우리 모둠 별 ' + (m * step) + '개 달성! 다 같이 잘했어요!', 3200); }
        } else if (m < mileBase) mileBase = m;
      }
    }
  }
  function openGroupPanel() {
    openPanel({
      title: '👥 함께 하기 · 모둠 ' + group,
      ko: status === 'solo' ? '지금은 연결이 안 돼서 혼자 하는 중이에요. 조금 뒤에 다시 이어 볼게요.' : '같은 모둠 친구와 한 공간에서 만나요. 친구 옆에서 E 를 누르면 영어로 물어볼 수 있어요.',
      build: function (body) {
        var list = el('div', 'mpList');
        var S = G.S || {};
        var rows = [{ r: { k: me.nick + ' (나)', st: int(S.stage, 0, 6), s: int(S.stars, 0, 99999) }, p: null }].concat(liveList().map(function (p) { return { r: p.st, p: p }; }));
        rows.forEach(function (row) {
          var r = row.r, d = el(row.p ? 'button' : 'div', 'mpRow' + (row.p ? ' go' : '')); d.appendChild(el('b', '', r.k));
          d.appendChild(el('span', '', (r.st >= 6 ? '모두 끝냄' : '미션 ' + (r.st + 1)) + ' · ⭐ ' + r.s + (r.h ? ' · 🆘' : '') + (row.p ? ' · 📍 찾아가기' : '')));
          if (row.p) { d.type = 'button'; d.onclick = function () { closePanel(true); startFollow(row.p); }; }
          list.appendChild(d);
        });
        body.appendChild(list);
        if (liveList().length) {
          var qi = questInfo();
          var qd = el('div', 'mpQuest' + (qi.done ? ' done' : ''));
          qd.appendChild(el('b', '', '🎯 모둠 퀘스트 · ' + (qi.done ? '성공! 🎉' : qi.sum + '/' + qi.goal)));
          qd.appendChild(el('span', '', qi.q.t + ' — ' + (qi.done ? '조금 뒤에 새 퀘스트가 나와요.' : qi.q.how)));
          body.appendChild(qd);
        } else body.appendChild(el('div', 'mpSub', '친구가 들어오면 모둠 퀘스트가 시작돼요. 같은 단원, 같은 모둠 친구만 보여요.'));
        body.appendChild(el('div', 'mpSub', '인사말 (숫자 키 1~5) · 가까이서 서로 👋 하면 하이파이브!'));
        var em = el('div', 'mpEmo');
        EMO.slice(0, 5).forEach(function (e, i) {
          var b = el('button', '', e.e + ' ' + e.en); b.type = 'button';
          b.onclick = function () { closePanel(true); emote(i); };
          em.appendChild(b);
        });
        body.appendChild(em);
        body.appendChild(el('div', 'mpSub', '모둠 바꾸기 (한 모둠에 ' + MAX + '명까지)'));
        var gr = el('div', 'mpGroups');
        var maxG = Math.max(5, Math.ceil(me.num / MAX));
        for (var i = 1; i <= maxG; i++) (function (i) {
          var b = el('button', i === group ? 'cur' : '', '모둠 ' + i); b.type = 'button';
          b.onclick = function () { closePanel(true); setGroup(i); };
          gr.appendChild(b);
        })(i);
        body.appendChild(gr);
      }
    });
  }
  function setGroup(g) {
    g = int(g, 1, 20); if (g === group && room) return;
    group = g; lsSet('english3d_mp_group', { c: me.code, g: g });
    leave(); stratI = 0; mileBase = -1;
    toast('👥 모둠 ' + g + '(으)로 옮겼어요.', 2000);
    connect();
  }

  // ------------------------------------------------------------ 터치용 이모트 단추
  var emoBtn = el('button', '', '👋'); emoBtn.id = 'mpEmoBtn'; emoBtn.type = 'button'; document.body.appendChild(emoBtn);
  emoBtn.onclick = function () { if (!panelOpen && !G.dlgOpen && !G.busy && G.started) openGroupPanel(); };

  // ------------------------------------------------------------ 주기 작업
  function pushState() {
    if (!ust || !me) return;
    try { var sig = JSON.stringify(myState()); if (sig !== lastStateSig) { lastStateSig = sig; ust.set(JSON.parse(sig)); } } catch (e) {}
  }
  setInterval(function () {
    if (!room || !G.started) return;
    if (!liveList().length && !Object.keys(peers).length) return;
    var P = G.P, msg = [r2(P.x), r2(P.z), r2(P.yaw), r2(P.jy || 0)], sig = msg.join(','), now = Date.now();
    if (sig === lastSent && now - lastSentT < 2000) return;
    lastSent = sig; lastSentT = now;
    send('p', msg);
  }, SEND_MS);
  setInterval(function () {
    if (!me) {
      me = readProfile();
      if (me) {
        var g = lsGet('english3d_mp_group');
        group = g && g.c === me.code ? int(g.g, 1, 20) : Math.max(1, Math.ceil(me.num / MAX));
      }
    }
    if (me && G.started && !room && !connecting && status === 'off') connect();
    if (!room) return;
    pushState();
    var now = Date.now();
    if (pendingOut && now - pendingOut.t > 30000) { var p = peers[pendingOut.to]; pendingOut = null; if (p && p.st) toast('🙂 ' + esc(p.st.k) + iga(p.st.k) + ' 바쁜가 봐요. 조금 뒤에 다시 물어봐요.', 2400); }
    if (pendingIn && now - pendingIn.t > 25000 && !(panelOpen && panelClose === answerClosed)) clearIncoming(true);
    questCheck();
    refreshChip();
  }, 1000);
  addEventListener('pagehide', function () { leave(); status = 'off'; });

  // ------------------------------------------------------------ 게임 쪽에서 부르는 것
  var nearFriend = null;
  function tick(dt, t) {
    if (!me) return;
    var P = G.P, best = null, bd = NEAR, nowMs = Date.now();
    var list = peerList();
    for (var i = 0; i < list.length; i++) {
      var p = list[i]; if (!p.g || !p.has) continue;
      var k = Math.min(1, dt * 9);
      var ox = p.x, oz = p.z;
      p.x += (p.tx - p.x) * k; p.z += (p.tz - p.z) * k; p.jy += (p.tjy - p.jy) * k;
      var dy = p.tyaw - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.yaw += dy * k;
      var sp = Math.hypot(p.x - ox, p.z - oz) / Math.max(dt, 0.001);
      p.walk = sp > 0.4 ? Math.min(1, p.walk + dt * 6) : Math.max(0, p.walk - dt * 4);
      p.g.position.set(p.x, p.jy, p.z); p.g.rotation.y = p.yaw + Math.PI;
      if (p.ent) { p.flags.wave = nowMs < p.waveUntil; p.flags.talk = !!p.bubble && p.bubbleT > 0 && !p.flags.wave; p.flags.look = [P.x, P.z]; }
      else try { // 엔진에 사람 움직임이 없을 때만 직접 흔들어요
        var a = p.g.userData.anim;
        if (a && a.armL && a.legL) {
          var sw = Math.sin(t * 9 + p.ph) * 0.7 * p.walk;
          a.armL.rotation.x = sw; a.armR.rotation.x = -sw; a.legL.rotation.x = -sw * 0.8; a.legR.rotation.x = sw * 0.8;
        }
      } catch (e) {}
      if (p.bubble && (p.bubbleT -= dt) <= 0) { p.g.remove(p.bubble); p.bubble = null; }
      p.d = Math.hypot(p.x - P.x, p.z - P.z);
      if (p.st && p.d < bd) { bd = p.d; best = p; }
      // 도와 달라는 친구에게 가면
      if (p.st && p.st.h && !p.helped && p.d < 3 && G.started) {
        p.helped = true; send('e', 5, p.id);
        toast('🤝 ' + esc(p.st.k) + '에게 왔어요! ' + (p.st.st >= 6 ? '' : '미션 ' + (p.st.st + 1) + '을 하고 있어요. ') + '같이 해 봐요.', 3200);
        reward(p, '친구를 도와주러 갔어요!'); questAdd(2, 1);
      }
    }
    followTick();
    var npc = G.nearNPC;
    nearFriend = best && G.started && !G.dlgOpen && !(npc && npc.talk) ? best : null;
    if (nearFriend) {
      try {
        G.prompt.style.display = 'block';
        G.prompt.innerHTML = (G.isTouch ? '👆 ' : '<b>E</b> ') + esc(nearFriend.st.k) + '에게 영어로 묻기 💬';
        var ab = document.getElementById('actBtn'); if (ab) ab.classList.add('ready');
      } catch (e) {}
    }
  }
  function interact() {
    if (panelOpen) return true;
    if (pendingIn && nearFriend && nearFriend.id === pendingIn.from) { openAnswer(); return true; }
    if (!nearFriend || !room) return false;
    openAsk(nearFriend);
    return true;
  }
  function drawMap(ctx, tx, tz) {
    try {
      peerList().forEach(function (p) {
        if (!p.has || !p.st) return;
        var x = tx(p.x), y = tz(p.z);
        if (p.id === followId) { ctx.strokeStyle = '#2a9d8f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9 + Math.sin(Date.now() / 200) * 2, 0, 7); ctx.stroke(); }
        if (p.st.h) { ctx.strokeStyle = '#ff9f1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.stroke(); }
        ctx.fillStyle = '#2a9d8f'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); ctx.stroke();
      });
    } catch (e) {}
  }

  window.MULTI = {
    tick: function (dt, t) { try { tick(dt, t); } catch (e) {} },
    interact: function () { try { return interact(); } catch (e) { return false; } },
    map: drawMap,
    emote: emote,
    debug: function () {
      return { status: status, strat: STRATS[stratI], room: me ? roomId() : '', group: group, sum: groupSum(), pendingIn: !!pendingIn, pendingOut: !!pendingOut, quest: (function () { var q = questInfo(); return { e: quest.e, type: quest.e % QUESTS.length, p: quest.p, sum: q.sum, goal: q.goal, done: q.done }; })(), follow: followId,
        peers: peerList().map(function (p) { return { id: p.id, k: p.st && p.st.k, n: p.st && p.st.n, av: p.st && p.st.av, d: r2(p.d), st: p.st && p.st.st, s: p.st && p.st.s, h: p.st && p.st.h, x: r2(p.tx), z: r2(p.tz), has: p.has, vis: !!(p.g && p.g.visible) }; }) };
    },
    _test: isDev ? { openAsk: function () { var p = liveList()[0]; if (p) openAsk(p); }, openAnswer: openAnswer, pick: function (i) { if (panelKeys && panelKeys[i]) panelKeys[i].click(); }, group: openGroupPanel, setGroup: setGroup, leave: function () { leave(); status = 'off'; }, askN: function (n) { var p = liveList().filter(function (x) { return x.st.n === n; })[0]; if (p) openAsk(p); }, follow: function (n) { var p = liveList().filter(function (x) { return x.st.n === n; })[0]; if (p) startFollow(p); }, questType: function (ty) { qEpoch = function () { return ty; }; questRoll(); quest.done = false; quest.p = 0; } } : null
  };

  // 개발용 기록: ?mplog=1 (로컬에서만)
  if (isDev && qs.has('mplog')) {
    setInterval(function () {
      try { fetch('/log', { method: 'POST', body: (qs.get('mplog') || '') + ' ' + JSON.stringify(window.MULTI.debug()) }).catch(noop); } catch (e) {}
    }, 2000);
  }
})();
