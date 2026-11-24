/* 영어 3D · 함께 하기 (같은 반 · 같은 단원 친구가 모두 한 공간에서 만나요. 최대 30명)
 * - 반에 참여한 학생만 켜져요. 연결이 안 되면 조용히 혼자 하기로 돌아가요. 게임은 절대 막지 않아요.
 * - 서버 없이 브라우저끼리 바로 연결해요(WebRTC). 처음 만날 때만 공개 중계소를 잠깐 써요.
 * - 오가는 것: 위치·방향, 별명·번호, 옷 색, 미션 번호·별 수, 정해진 이모트/문장 번호. 자유 글은 보내지 않아요.
 * - 끄기: net-config.js 에 multiplayer: false
 */
(function () {
  'use strict';
  var G = window.__mp;
  if (!G || window.MULTI) return;
  if (G.L && G.L.noMulti) return; // 단원이 함께 하기를 끈 경우 (롯데월드 안전교육)
  var qs; try { qs = new URLSearchParams(location.search); } catch (e) { return; }
  var cfg = window.NET_CONFIG || {};
  var isDev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  var devMp = isDev && qs.has('mp');
  var devStrat = isDev ? parseInt(qs.get('mpstrat'), 10) : NaN; // 개발용: 처음 길을 일부러 다르게
  if (cfg.multiplayer === false && !devMp) return;
  if (qs.has('autotest') && !devMp) return;
  if (!window.RTCPeerConnection || !window.crypto || !crypto.subtle || !window.THREE) return;

  var APP = 'emelmusekor.github.io/english3d';
  var VER = '0.27.0';
  var STRATS = ['trystero', '@trystero-p2p/torrent', '@trystero-p2p/mqtt']; // 앞의 것이 막히면 다음 것으로
  var MAX = 30;           // 한 반(방) 최대 인원
  var DIRECT = 8;         // 직접 연결하는 이웃 수 (나머지 친구는 이웃을 거쳐 전해져요)
  try { var dd = isDev ? parseInt(qs.get('mpdirect'), 10) : 0; if (dd >= 4 && dd <= 32) DIRECT = dd; } catch (e) {} // 개발용: ?mpdirect=4
  var SEND_MS = 200;      // 위치 보내기 간격 (5Hz, 사람이 많으면 느리게)
  var AWAY_MS = 7000;     // 이만큼 소식이 없으면 '잠깐 끊김'
  var GRACE_MS = 15000;   // 끊긴 뒤 이만큼 기다렸다가 내보내요
  var QUIET_N = 10;       // 친구가 이보다 많으면 들어옴·나감 알림을 줄여요
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
  function fire(type) { try { window.dispatchEvent(new CustomEvent('e3d', { detail: { type: type } })); } catch (e) {} } // 게임성 층(fun.js)에 알려요 (배지)

  // ------------------------------------------------------------ 내 정보
  var me = null;          // { code, num, nick }
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
    var dc = typeof a.deco === 'number' && a.deco === Math.floor(a.deco) && a.deco >= 1 && a.deco <= 9 ? a.deco : 0; // 꾸미기 번호: 정수 1~9만 (0·없음이면 보내지 않아요)
    if (typeof kk === 'string' && /^(Nara|Hajun|Olivia|Kai|Rani|Joel)$/.test(kk)) return dc ? { look: kk, deco: dc } : { look: kk };
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
    return { k: me.nick, n: me.num, av: myAvatar(), st: int(S.stage, 0, 6), s: int(S.stars, 0, 99999), h: Date.now() < helpUntil ? 1 : 0, qe: quest.e, qp: quest.p, pt: myPet() };
  }
  function myPet() { try { var pp = window.PLAY && typeof window.PLAY.pet === 'function' ? window.PLAY.pet() : null; return pp ? int(pp.skin, 0, 2) + 1 : 0; } catch (e) { return 0; } }
  function cleanState(v) {
    if (!v || typeof v !== 'object') return null;
    return { k: clean(v.k, 12) || '친구', n: int(v.n, 1, 99), av: cleanAv(v.av), st: int(v.st, 0, 6), s: int(v.s, 0, 99999), h: v.h ? 1 : 0, qe: int(v.qe, 0, 1e9), qp: int(v.qp, 0, 2), pt: int(v.pt, 0, 3) };
  }

  // ------------------------------------------------------------ 이 단원에서 주고받을 말
  var SENT = (G.L && Array.isArray(G.L.sentences) ? G.L.sentences : []).filter(function (s) { return s && typeof s.en === 'string'; }).slice(0, 8);
  var QS = SENT.filter(function (s) { return /\?\s*$/.test(s.en); });
  var AS = SENT.filter(function (s) { return !/\?\s*$/.test(s.en); });
  if (!QS.length) QS = SENT.slice();
  if (!AS.length) AS = SENT.slice();

  // ------------------------------------------------------------ 연결
  var T = null, room = null, act = {}, ust = null;
  var stratI = 0, joinedAt = 0, connecting = false, status = 'off', watchTo = null, retryTo = null, gen = 0;
  var peers = {};         // userId → peer
  var lastSent = '', lastSentT = 0, lastStateSig = '', leaving = false;

  function roomId() { return me.code + '-' + lessonId + '-all'; } // 반 전체가 한 방
  function peerList() { return Object.keys(peers).map(function (k) { return peers[k]; }); }
  function liveList() { return peerList().filter(function (p) { return p.st && !p.away; }); }
  function quiet() { return liveList().length > QUIET_N; }

  function connect() {
    if (room || connecting || !me) return;
    joinedAt = Date.now(); heal.lastJoin = joinedAt;
    connecting = true; setStatus('wait');
    // 같은 반 친구들이 시작 자리에서 한데 겹쳐 서지 않게 번호에 따라 줄을 맞춰 서요 (7명씩 7줄, 가운데 길을 따라)
    try { var P0 = G.P, i0 = (me.num - 1) % 49; if (Math.abs(P0.x) < 0.01 && Math.abs(P0.z - 40) < 0.01) { P0.x = (i0 % 7 - 3) * 1.1; P0.z = 40 - Math.floor(i0 / 7) * 1.2; } } catch (e) {}
    if (isFinite(devStrat) && devStrat >= 0 && devStrat < STRATS.length && !connect.used) { connect.used = 1; stratI = devStrat; }
    var my = ++gen, name = STRATS[stratI];
    withTimeout(import('https://cdn.jsdelivr.net/npm/' + name + '@' + VER + '/+esm'), 15000).then(function (mod) {
      if (my !== gen) return;
      connecting = false;
      T = mod;
      var opt = { appId: APP, identity: 'none', maxUsers: MAX, relayConfig: { warnOnRelayFailure: false, redundancy: name === 'trystero' ? 8 : undefined } };
      // 큰 방: 이웃 몇 명하고만 직접 연결하고 나머지는 건너서 전해요(30명이 서로 다 직접 연결하면 기기가 버티지 못해요)
      try { if (typeof mod.scale === 'function') opt.use = [mod.scale({ maxDirectPeers: DIRECT })]; } catch (e) {}
      var r = mod.joinRoom(opt, roomId());
      room = r;
      wire(r, my);
      clearTimeout(watchTo);
      watchTo = setTimeout(function () { checkRelays(my); }, 12000);
      setTimeout(function () { if (my === gen) beat(true); }, 20000);
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
        if (code === 'peer-connect-failed') heal.fail++;
        if (code === 'relay-failed' && !peerList().length) nextStrategy();
        else if (code === 'room-full' && !peerList().length) { setStatus('full'); toast('👥 지금은 우리 반 방이 꽉 찼어요(' + MAX + '명). 혼자 하기로 계속해요.', 3500); }
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
        seen(c.userId);
        lastSent = ''; // 새 친구에게 내 위치를 바로 알려요
        setStatus('on');
      });
      // 나간 친구는 바로 지우지 않고 잠깐 기다려요(금방 다시 들어올 수 있어요)
      r.onUserLeave(function (c) { if (my === gen) { var p = peers[c.userId]; if (p) { if (p.st && p.has) { p.left = Date.now(); setAway(p); } else dropPeer(c.userId, true); } refreshChip(); } });
      act.p = r.makeAction('p'); act.e = r.makeAction('e'); act.q = r.makeAction('q'); act.a = r.makeAction('a'); act.g = r.makeAction('g');
      act.p.onMessage(function (d, c) { if (my === gen) { seen(c.userId); onPos(c.userId, d); } });
      act.e.onMessage(function (d, c) { if (my === gen) { seen(c.userId); onEmote(c.userId, d); } });
      act.q.onMessage(function (d, c) { if (my === gen) { seen(c.userId); onAsk(c.userId, d); } });
      act.a.onMessage(function (d, c) { if (my === gen) { seen(c.userId); onAnswer(c.userId, d); } });
      act.g.onMessage(function (d, c) { if (my === gen) { seen(c.userId); try { onGame(c.userId, d); } catch (e) {} } });
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
    if (Object.keys(peers).length >= MAX + 4) return null;
    var p = peers[id] = { id: id, seenT: Date.now(), away: false, awayT: 0, left: 0, st: null, g: null, sig: '', x: 0, z: 40, yaw: 0, jy: 0, tx: 0, tz: 40, tyaw: 0, tjy: 0, has: false, walk: 0, ph: Math.random() * 10,
      bubble: null, bubbleT: 0, beam: null, fbeam: null, lastEmo: 0, helped: false, d: 99, flags: { wave: false, talk: false, look: null }, ent: null, waveT: 0, waveUntil: 0, hfT: 0 };
    return p;
  }
  // ------------------------------------------------------------ 끊긴 친구: 잠깐 기다렸다가 내보내기
  function seen(id) {
    var p = peers[id];
    if (!p) { // 내보낸 뒤에 다시 소식이 오면 되살려요
      p = ensurePeer(id); if (!p) return;
      try { setPeerState(id, ust.get(id)); } catch (e) {}
    }
    p.seenT = Date.now(); p.left = 0;
    if (p.away) { p.away = false; if (p.bubble && p.g) { p.g.remove(p.bubble); p.bubble = null; } refreshChip(); }
    rejoinAt = 0; rejoinN = 0;
  }
  function setAway(p) {
    if (p.away) return;
    p.away = true; p.awayT = Date.now();
    bubble(p, '💤 잠깐 끊겼어요', 999);
    if (followId === p.id) stopFollow();
    if (pendingOut && pendingOut.to === p.id) pendingOut = null;
    if (pendingIn && pendingIn.from === p.id) clearIncoming(false);
    if (invite && invite.from === p.id) clearInvite(false);
    if (rps && rps.to === p.id) rps = null; if (rpsIn && rpsIn.from === p.id) rpsIn = null;
    refreshChip();
  }
  var rejoinAt = 0, rejoinN = 0;
  function watchPeers() {
    var now = Date.now(), list = peerList(), lost = false;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!p.away && p.has && now - p.seenT > AWAY_MS) setAway(p);          // 소식이 끊김
      if (p.away && now - p.awayT > GRACE_MS) { dropPeer(p.id); lost = true; } // 조금 기다렸는데도 안 오면 내보내요
    }
    // 친구가 모두 끊겼다면 내 쪽 연결이 끊긴 것일 수 있어요 → 조금 뒤 스스로 다시 들어가요
    if (lost && !peerList().length && !rejoinAt && rejoinN < 5) rejoinAt = now + 8000;
    if (rejoinAt && now >= rejoinAt && room && !connecting) {
      if (peerList().length) rejoinAt = 0;
      else { rejoinN++; rejoinAt = rejoinN < 5 ? now + 60000 : 0; var s = stratI; leave(); stratI = s; connect(); }
    }
  }
  addEventListener('online', function () { if (room && !liveList().length) { rejoinN = 0; rejoinAt = Date.now() + 1500; } });

  function dropPeer(id, silent) {
    var p = peers[id]; if (!p) return;
    if (p.st && G.started && !leaving && !silent && !quiet()) toast('👋 ' + esc(p.st.k) + iga(p.st.k) + ' 나갔어요.', 1800);
    unlist(p);
    if (p.g) { try { G.scene.remove(p.g); } catch (e) {} }
    if (p.pet) { try { G.scene.remove(p.pet.g); } catch (e) {} p.pet = null; }
    if (followId === id) followId = null;
    delete peers[id];
    if (pendingOut && pendingOut.to === id) pendingOut = null;
    if (pendingIn && pendingIn.from === id) clearIncoming(false);
    if (invite && invite.from === id) clearInvite(false);
    if (rps && rps.to === id) rps = null; if (rpsIn && rpsIn.from === id) rpsIn = null;
  }
  function buildAvatar(p) {
    try {
      unlist(p);
      if (p.g) G.scene.remove(p.g);
      var o = Object.assign({}, p.st.av, { name: p.st.k });
      var g = G.makePerson(o);
      g.position.set(p.x, 0, p.z); g.rotation.y = p.yaw + Math.PI; g.visible = p.has;
      G.scene.add(g); p.g = g; p.bubble = null; p.beam = null; p.fbeam = null; p.bmark = null;
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
      var back = false;
      peerList().forEach(function (q) { if (q !== p && q.st && q.st.n === st.n && q.st.k === st.k && (q.away || Date.now() - q.seenT > 3000)) { back = true; dropPeer(q.id, true); } });
      if (G.started && !quiet()) { toast((back ? '🙌 ' + esc(st.k) + iga(st.k) + ' 다시 왔어요!' : '🙌 ' + esc(st.k) + iga(st.k) + ' 왔어요!'), 2200); sfx('get'); }
      baseMilestone();
    } else {
      if (st.st > old.st && G.started && !quiet()) { toast('👏 ' + esc(st.k) + iga(st.k) + ' 미션 ' + st.st + '을 끝냈어요!', 2600); sfx('get'); }
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
    fire('mp_five');
    if (!G.dlgOpen) setTimeout(function () { try { G.speak('High five!', '나'); } catch (e) {} }, 700);
  }

  // ------------------------------------------------------------ 우리 반 퀘스트 (5분마다 바뀌는 선택 활동)
  var QUEST_MS = 300000, QUEST_DAY = 6;
  var quest = { e: 0, p: 0, done: false, told: 0 };
  var QUESTS = [
    { t: '친구에게 영어로 묻고 대답 듣기', how: '친구 옆에서 E 를 눌러 영어로 물어봐요.', goal: function (m) { return Math.max(2, Math.min(m, 4)); } },
    { t: '친구 옆에 모여 👋 Hi! 하기', how: '친구 가까이 가서 숫자 키 1 (👋) 을 눌러요.', goal: function (m) { return Math.max(2, Math.min(12, Math.ceil(m * 0.6))); } },
    { t: '도와 달라는 친구에게 가 주기', how: '누가 5 (🆘) 를 누르면 주황 빛기둥으로 가요.', goal: function () { return 2; } },
    { t: '친구와 가위바위보 하기', how: '친구 옆에서 E 를 누르고 ✊ 가위바위보를 골라요.', goal: function (m) { return Math.max(2, Math.min(m, 6)); } }
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
      toast('🎯 <b>우리 반 퀘스트</b>: ' + qi.q.t + '<br><small>' + qi.q.how + '</small>', 4200);
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
      toast('🎉 <b>우리 반 퀘스트 성공!</b> 모두 별 +1 ⭐', 3600);
    } else toast('🎉 <b>우리 반 퀘스트 성공!</b> 다 같이 잘했어요!', 3600);
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

  // ------------------------------------------------------------ 창 (묻기·대답하기·우리 반)
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
    if (e.code === 'KeyT' && (pendingIn || invite)) openIncoming();
    if (e.code === 'KeyP' && liveList().length) takePhoto();
  });

  // ----- 친구에게 영어로 묻기
  var pendingOut = null;  // { id, to, t }
  var pendingIn = null;   // { id, from, q, t }
  var note = el('button'); note.id = 'mpNote'; note.type = 'button'; document.body.appendChild(note);
  note.onclick = function () { openIncoming(); };

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
          fire('mp_ask');
          toast('🗣 “' + esc(q.en) + '” 대답을 기다려요…', 3000);
        } };
      })
    });
  }
  function onAsk(id, d) {
    var p = peers[id]; if (!p || !p.st || !d || typeof d !== 'object') return;
    var qi = int(d.i, 0, QS.length - 1), rid = int(d.id, 0, 1e9);
    if (pendingIn || invite || !G.started || !QS.length) { send('a', { i: -1, id: rid }, id); return; }
    pendingIn = { id: rid, from: id, q: qi, t: Date.now() };
    bubble(p, QS[qi].en, 8);
    note.textContent = '💬 ' + p.st.k + iga(p.st.k) + ' 물어봐요! 눌러서 대답해요' + (G.isTouch ? '' : ' (T)');
    note.classList.add('show'); sfx('get');
    if (!G.dlgOpen && !G.busy && p.d < 6) openAnswer();
  }
  function clearIncoming(tellBusy) {
    if (!pendingIn) return;
    if (tellBusy) send('a', { i: -1, id: pendingIn.id }, pendingIn.from);
    pendingIn = null; if (!invite) note.classList.remove('show');
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
          pendingIn = null; if (!invite) note.classList.remove('show');
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


  // ------------------------------------------------------------ 친구와 함께 하는 놀이 (가위바위보 · 칭찬 스티커 · 같이 사진 · 짝꿍 · 같이 점프)
  // 오가는 것은 정해진 번호뿐이에요(자유 글 없음). 모두 선택 활동이라 미션을 막지 않아요.
  var RPS = ['✊', '✌️', '🖐️'], RPS_KO = ['바위', '가위', '보'];
  var STK = ['👍 잘했어요', '💪 힘내요', '😊 고마워요', '🌟 멋져요'];
  var rps = null;      // 내가 건 가위바위보 { id, to, mine, t }
  var rpsIn = null;    // 내가 받은 가위바위보 { id, from, mine, t }
  var invite = null;   // 받은 초대 { kind: 'rps'|'buddy', from, id, t }
  var buddy = lsGet('english3d_mp_buddy'); if (!buddy || typeof buddy !== 'object' || Date.now() - (buddy.t || 0) > 3 * 3600000) buddy = null; // { n, k, t }
  var buddyOut = null, buddyFarT = 0, buddyToldT = 0;
  var stkT = {}, stkInT = {}, lastShotT = 0, lastShotIn = 0, myJumpT = 0, wasJump = false;
  function freeNow() { return G.started && !G.dlgOpen && !G.busy && !panelOpen; }
  function busyFor() { return !G.started || !!invite || !!pendingIn || !!rpsIn; }
  function showNote(text) { note.textContent = text + (G.isTouch ? '' : ' (T)'); note.classList.add('show'); sfx('get'); }
  function hideNote() { if (!pendingIn && !invite) note.classList.remove('show'); }
  function clearInvite(tellBusy) {
    if (!invite) return;
    if (tellBusy) send('g', invite.kind === 'rps' ? { t: 'r', s: 0, id: invite.id } : { t: 'b', s: 0 }, invite.from);
    invite = null; hideNote();
    if (panelOpen && panelClose === inviteClosed) closePanel(true);
  }
  function inviteClosed() { /* 닫아도 쪽지는 남아 있어요 */ }
  function openIncoming() { if (invite) openInvite(); else openAnswer(); }

  // 친구 옆에서 E → 무엇을 할지 고르기
  function openFriendMenu(p) {
    if (!p || !p.st) return;
    var ch = [];
    if (QS.length) ch.push({ en: '💬 영어로 묻기', ko: '물으면 친구가 영어로 대답해 줘요', fn: function () { closePanel(true); openAsk(p); } });
    ch.push({ en: '✊ 가위바위보', ko: '누가 이길까요?', fn: function () { closePanel(true); openRps(p); } });
    ch.push({ en: '🌟 칭찬 스티커 주기', ko: '친구에게 좋은 말을 보내요', fn: function () { closePanel(true); openSticker(p); } });
    ch.push({ en: '📸 같이 사진 찍기', ko: '가까이 모여서 찰칵!', fn: function () { closePanel(true); takePhoto(); } });
    if (isBuddy(p)) ch.push({ en: '🤝 짝꿍 그만하기', ko: '', fn: function () { closePanel(true); endBuddy(true); } });
    else ch.push({ en: '🤝 짝꿍 하기', ko: '짝꿍과 멀어지면 알려 줘요', fn: function () { closePanel(true); askBuddy(p); } });
    openPanel({ title: '🙌 ' + p.st.k + wa(p.st.k) + ' 함께 하기', ko: '하고 싶은 것을 골라요. (숫자 키로도 골라요)', choices: ch.map(function (c) { return { en: c.en, ko: c.ko, fn: c.fn }; }) });
    // 설명 글은 '한글 도움'을 꺼도 보여요
    try { if (!(G.S && G.S.koHelp)) ch.forEach(function (c, i) { if (c.ko && panelKeys[i]) panelKeys[i].appendChild(el('small', '', c.ko)); }); } catch (e) {}
  }

  // ----- 가위바위보
  function openRps(p) {
    if (rps && Date.now() - rps.t < 25000) { toast('친구가 내기를 기다리는 중이에요…', 1500); return; }
    openPanel({
      title: '✊ ' + p.st.k + wa(p.st.k) + ' 가위바위보', ko: '무엇을 낼까요? 친구가 고르면 함께 펼쳐져요.',
      choices: RPS.map(function (e, i) { return { en: e + ' ' + RPS_KO[i], fn: function () {
        closePanel(true); if (!peers[p.id]) return;
        rps = { id: Math.floor(Math.random() * 1e9), to: p.id, mine: i, t: Date.now() };
        send('g', { t: 'r', s: 1, id: rps.id }, p.id);
        toast('✊ 가위… 바위… ' + esc(p.st.k) + iga(p.st.k) + ' 고르는 중이에요', 3000);
      } }; })
    });
  }
  function rpsResult(p, mine, theirs) {
    var win = (theirs - mine + 3) % 3 === 1, draw = mine === theirs;
    bubble(p, RPS[theirs] + ' ' + RPS_KO[theirs], 5);
    if (win) { try { G.confetti(26); } catch (e) {} sfx('star'); } else sfx(draw ? 'get' : 'bad');
    toast('나 ' + RPS[mine] + ' vs ' + RPS[theirs] + ' ' + esc(p.st.k) + ' — <b>' + (draw ? '비겼어요! 한 번 더?' : win ? '이겼어요! 🎉' : '졌어요. 다음엔 이길 거예요!') + '</b>', 3600);
    questAdd(3, 2); fire('mp_rps');
  }
  function openInvite() {
    var inv = invite; if (!inv || panelOpen || G.dlgOpen || G.busy) return;
    var p = peers[inv.from]; if (!p || !p.st) { clearInvite(false); return; }
    if (inv.kind === 'rps') openPanel({
      title: '✊ ' + p.st.k + iga(p.st.k) + ' 가위바위보 하재요', ko: '무엇을 낼까요?', onClose: inviteClosed,
      choices: RPS.map(function (e, i) { return { en: e + ' ' + RPS_KO[i], fn: function () {
        if (invite !== inv) { closePanel(true); return; }
        invite = null; hideNote(); closePanel(true);
        rpsIn = { id: inv.id, from: inv.from, mine: i, t: Date.now() };
        send('g', { t: 'r', s: 2, id: inv.id, c: i }, inv.from);
      } }; })
    });
    else openPanel({
      title: '🤝 ' + p.st.k + iga(p.st.k) + ' 짝꿍 하재요', ko: '짝꿍이 되면 서로 멀어질 때 알려 줘요. 같이 다녀요!', onClose: inviteClosed,
      choices: [
        { en: '😀 좋아요!', fn: function () { if (invite !== inv) { closePanel(true); return; } invite = null; hideNote(); closePanel(true); send('g', { t: 'b', s: 2 }, inv.from); setBuddy(p); } },
        { en: '🙂 다음에 해요', fn: function () { if (invite !== inv) { closePanel(true); return; } invite = null; hideNote(); closePanel(true); send('g', { t: 'b', s: 0 }, inv.from); } }
      ]
    });
  }

  // ----- 칭찬 스티커
  function stickerCount() { var r = lsGet('english3d_mp_stk'); return r && r.n > 0 ? int(r.n, 0, 99999) : 0; }
  function openSticker(p) {
    var key = p.st.n, now = Date.now();
    if (now - (stkT[key] || 0) < 60000) { toast('🌟 방금 줬어요. 조금 뒤에 또 줄 수 있어요.', 1800); return; }
    openPanel({
      title: '🌟 ' + p.st.k + '에게 칭찬 스티커', ko: '어떤 말을 보낼까요?',
      choices: STK.map(function (s, i) { return { en: s, fn: function () {
        closePanel(true); if (!peers[p.id]) return;
        stkT[key] = Date.now(); send('g', { t: 's', k: i }, p.id);
        toast('🌟 ' + esc(p.st.k) + '에게 “' + s + '” 스티커를 줬어요.', 2400); sfx('get'); fire('mp_sticker');
      } }; })
    });
  }

  // ----- 같이 사진 찍기
  var shotEl = null;
  function flashScreen() { try { var f = el('div'); f.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:60;opacity:.9;transition:opacity .5s;pointer-events:none'; document.body.appendChild(f); setTimeout(function () { f.style.opacity = '0'; }, 60); setTimeout(function () { f.remove(); }, 700); } catch (e) {} }
  function takePhoto() {
    var now = Date.now(); if (now - lastShotT < 6000 || !G.started) return; lastShotT = now;
    send('g', { t: 'p' });
    var n = 0; liveList().forEach(function (p) { if (p.has && p.d < 10) { n++; p.waveUntil = now + 3200; } });
    var steps = ['📸 3', '📸 2', '📸 1'];
    steps.forEach(function (s, i) { setTimeout(function () { toast('<b style="font-size:26px">' + s + '</b>' + (i ? '' : n ? ' · 친구들과 포즈~ ✌️' : ' · 혼자 찍어요'), 700); sfx('click'); }, i * 700); });
    setTimeout(function () {
      var url = null; try { url = G.shot && G.shot(); } catch (e) {}
      flashScreen(); sfx('get');
      if (!url) { toast('📸 찰칵! (이 기기에서는 사진을 보여 줄 수 없어요)', 2200); return; }
      showPhoto(url); fire('mp_photo');
    }, 2100);
  }
  function showPhoto(url) {
    try {
      if (shotEl) shotEl.remove();
      var d = el('div'); d.id = 'mpShot';
      d.style.cssText = 'position:fixed;right:16px;bottom:96px;z-index:30;background:#fff;padding:10px 10px 8px;border-radius:10px;box-shadow:0 8px 26px rgba(0,0,0,.35);transform:rotate(-2deg);max-width:min(360px,70vw);font-size:15px;text-align:center';
      var im = document.createElement('img'); im.src = url; im.alt = '같이 찍은 사진'; im.style.cssText = 'display:block;width:100%;border-radius:4px';
      var cap = el('div', '', '📸 ' + new Date().toLocaleDateString('ko-KR') + ' · 친구들과'); cap.style.cssText = 'margin:6px 0 4px;color:#495057';
      var row = el('div'); row.style.cssText = 'display:flex;gap:6px;justify-content:center';
      var a = document.createElement('a'); a.href = url; a.download = 'english3d-photo.jpg'; a.textContent = '💾 저장'; a.style.cssText = 'background:#2a9d8f;color:#fff;border-radius:8px;padding:4px 12px;text-decoration:none';
      var x = el('button', '', '닫기'); x.type = 'button'; x.style.cssText = 'border:0;background:#e2e8f0;border-radius:8px;padding:4px 12px;font:inherit;cursor:pointer';
      x.onclick = function () { d.remove(); if (shotEl === d) shotEl = null; };
      row.appendChild(a); row.appendChild(x); d.appendChild(im); d.appendChild(cap); d.appendChild(row);
      document.body.appendChild(d); shotEl = d;
      setTimeout(function () { if (shotEl === d) { d.remove(); shotEl = null; } }, 30000);
    } catch (e) {}
  }

  // ----- 짝꿍
  function isBuddy(p) { return !!(buddy && p && p.st && p.st.n === buddy.n && p.st.k === buddy.k); }
  function buddyPeer() { if (!buddy) return null; var l = liveList(); for (var i = 0; i < l.length; i++) if (isBuddy(l[i])) return l[i]; return null; }
  function setBuddy(p) {
    buddy = { n: p.st.n, k: p.st.k, t: Date.now() }; lsSet('english3d_mp_buddy', buddy); buddyFarT = 0;
    try { G.confetti(20); } catch (e) {} sfx('star');
    toast('🤝 <b>' + esc(p.st.k) + '</b>' + wa(p.st.k) + ' 짝꿍이 됐어요! 같이 다녀요.', 3000); fire('mp_buddy');
  }
  function askBuddy(p) {
    if (buddyOut && Date.now() - buddyOut.t < 20000) { toast('대답을 기다리는 중이에요…', 1500); return; }
    buddyOut = { to: p.id, t: Date.now() }; send('g', { t: 'b', s: 1 }, p.id);
    toast('🤝 ' + esc(p.st.k) + '에게 짝꿍 하자고 했어요.', 2200);
  }
  function endBuddy(tell) {
    var p = buddyPeer(); if (tell && p) send('g', { t: 'b', s: 9 }, p.id);
    if (p && p.bmark && p.g) { p.g.remove(p.bmark); p.bmark = null; }
    buddy = null; lsSet('english3d_mp_buddy', null); toast('🤝 짝꿍을 그만했어요.', 1800);
  }
  function buddyTick(nowMs) {
    var p = buddyPeer();
    if (!p || !p.g || !p.has) return null;
    if (!p.bmark) { try { var s = G.textSprite('🤝', 0.5, { fs: 64, bg: null }); s.position.y = 3.35; p.g.add(s); p.bmark = s; } catch (e) {} }
    if (p.d > 14) { if (!buddyFarT) buddyFarT = nowMs; } else buddyFarT = 0;
    var far = buddyFarT && nowMs - buddyFarT > 4000;
    if (far && nowMs - buddyToldT > 40000 && freeNow()) { buddyToldT = nowMs; toast('🤝 짝꿍 <b>' + esc(p.st.k) + '</b>' + wa(p.st.k) + ' 멀어졌어요. 화살표를 따라 다시 만나요!', 3200); }
    return far ? p : null;
  }

  // ----- 받는 쪽
  function onGame(id, d) {
    var p = peers[id]; if (!p || !p.st || !d || typeof d !== 'object') return;
    var now = Date.now(), s = int(d.s, 0, 9);
    if (d.t === 'r') {
      var rid = int(d.id, 0, 1e9);
      if (s === 1) { // 가위바위보 하자는 초대
        if (busyFor()) { send('g', { t: 'r', s: 0, id: rid }, id); return; }
        invite = { kind: 'rps', from: id, id: rid, t: now };
        bubble(p, '✊ 가위바위보!', 6); showNote('✊ ' + p.st.k + iga(p.st.k) + ' 가위바위보 하재요! 눌러서 내요');
        if (freeNow() && p.d < 6) openInvite();
      } else if (s === 0) { if (rps && rps.to === id && rps.id === rid) { rps = null; toast('🙂 ' + esc(p.st.k) + iga(p.st.k) + ' 지금 바빠요. 조금 뒤에 다시 해요.', 2400); } }
      else if (s === 2) { if (rps && rps.to === id && rps.id === rid) { var mine = rps.mine, c = int(d.c, 0, 2); rps = null; send('g', { t: 'r', s: 3, id: rid, c: mine }, id); rpsResult(p, mine, c); } }
      else if (s === 3) { if (rpsIn && rpsIn.from === id && rpsIn.id === rid) { var m2 = rpsIn.mine; rpsIn = null; rpsResult(p, m2, int(d.c, 0, 2)); } }
    } else if (d.t === 's') { // 칭찬 스티커를 받았어요
      if (now - (stkInT[id] || 0) < 30000) return; stkInT[id] = now;
      var k = int(d.k, 0, STK.length - 1), n = stickerCount() + 1; lsSet('english3d_mp_stk', { n: n });
      bubble(p, STK[k], 5); try { G.confetti(12); } catch (e) {} sfx('star');
      if (G.started) toast('🌟 <b>' + esc(p.st.k) + '</b>' + iga(p.st.k) + ' 칭찬 스티커를 줬어요: “' + STK[k] + '” (모은 스티커 ' + n + '개)', 3600);
    } else if (d.t === 'p') { // 가까운 친구가 사진을 찍어요
      if (now - lastShotIn < 5000 || !p.has || p.d > 10 || !G.started) return; lastShotIn = now;
      bubble(p, '📸 3, 2, 1!', 3);
      if (!G.dlgOpen) toast('📸 ' + esc(p.st.k) + iga(p.st.k) + ' 사진을 찍어요! 포즈~ ✌️', 2000);
      setTimeout(function () { if (!G.dlgOpen) { flashScreen(); sfx('get'); } }, 2100);
    } else if (d.t === 'b') {
      if (s === 1) { // 짝꿍 하자는 초대
        if (isBuddy(p)) { send('g', { t: 'b', s: 2 }, id); return; }
        if (busyFor()) { send('g', { t: 'b', s: 0 }, id); return; }
        invite = { kind: 'buddy', from: id, id: 0, t: now };
        showNote('🤝 ' + p.st.k + iga(p.st.k) + ' 짝꿍 하재요! 눌러서 대답해요');
        if (freeNow() && p.d < 6) openInvite();
      } else if (s === 2) { if (buddyOut && buddyOut.to === id) { buddyOut = null; setBuddy(p); } }
      else if (s === 0) { if (buddyOut && buddyOut.to === id) { buddyOut = null; toast('🙂 ' + esc(p.st.k) + iga(p.st.k) + ' 지금은 어렵대요. 다음에 또 물어봐요.', 2400); } }
      else if (s === 9) { if (isBuddy(p)) { if (p.bmark && p.g) { p.g.remove(p.bmark); p.bmark = null; } buddy = null; lsSet('english3d_mp_buddy', null); toast('🤝 ' + esc(p.st.k) + iga(p.st.k) + ' 짝꿍을 그만했어요.', 2200); } }
    }
  }
  // ----- 같이 점프: 가까운 친구와 거의 같은 때 뛰면
  function jumpTick(list, nowMs) {
    var P = G.P, j = (P.jy || 0) > 0.05;
    if (j && !wasJump) myJumpT = nowMs; wasJump = j;
    for (var i = 0; i < list.length; i++) {
      var p = list[i]; if (!p.has || !p.st) continue;
      var pj = p.tjy > 0.05; if (pj && !p.wasJ) p.jumpT = nowMs; p.wasJ = pj;
      if (p.d < 4.5 && p.jumpT && myJumpT && Math.abs(p.jumpT - myJumpT) < 800 && nowMs - (p.jpT || 0) > 8000 && nowMs - myJumpT < 900) {
        p.jpT = nowMs; bubble(p, '🦘 점프!', 2.5);
        try { G.confetti(12); } catch (e) {} sfx('combo');
        toast('🦘 <b>같이 점프!</b> ' + esc(p.st.k) + wa(p.st.k) + ' 호흡이 척척!', 2200); fire('mp_jump');
      }
    }
  }

  // ------------------------------------------------------------ 우리 반 칸 (HUD)
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
    if (status === 'wait' && !n) chipText.textContent = '📡 우리 반 · 연결하는 중…';
    else if (status === 'solo') chipText.textContent = '🙂 혼자 하는 중 (연결 안 됨)';
    else if (status === 'full') chipText.textContent = '👥 우리 반 방이 꽉 찼어요';
    else if (!n && heal.blocked) chipText.textContent = '📡 친구와 연결이 안 돼요 · 눌러서 다시 연결';
    else if (!n && heal.others.length) chipText.textContent = '📡 친구 ' + heal.others.length + '명 접속 중 · 연결하는 중…';
    else if (!n) chipText.textContent = '🟢 우리 반 · 친구 0명 · 기다려요';
    else {
      var step = 15 * (n + 1), sum = groupSum();
      chipText.textContent = '🟢 우리 반 · ' + (n + 1) + '명 · 모은 별 ⭐ ' + sum;
      var qi = questInfo();
      chipQuest.textContent = qi.done ? '🎯 우리 반 퀘스트 성공! 🎉' : '🎯 ' + qi.q.t + ' ' + qi.sum + '/' + qi.goal;
      chipQuest.classList.toggle('done', qi.done);
      chipFill.style.width = Math.round((sum % step) / step * 100) + '%';
      if (mileMembers !== n + 1 || mileBase < 0) baseMilestone();
      else {
        var m = Math.floor(sum / step);
        if (m > mileBase) {
          mileBase = m;
          if (G.started) { try { G.confetti(45); } catch (e) {} sfx('star'); toast('🎉 우리 반 별 ' + (m * step) + '개 달성! 다 같이 잘했어요!', 3200); }
        } else if (m < mileBase) mileBase = m;
      }
    }
  }
  function openGroupPanel() {
    openPanel({
      title: '👥 함께 하기 · 우리 반 ' + (liveList().length + 1) + '명',
      ko: status === 'solo' ? '지금은 연결이 안 돼서 혼자 하는 중이에요. 조금 뒤에 다시 이어 볼게요.' : '같은 반 친구와 한 공간에서 만나요. 친구 옆에서 E 를 누르면 영어로 물어볼 수 있어요.',
      build: function (body) {
        var list = el('div', 'mpList'); list.style.maxHeight = '34vh'; list.style.overflowY = 'auto';
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
          qd.appendChild(el('b', '', '🎯 우리 반 퀘스트 · ' + (qi.done ? '성공! 🎉' : qi.sum + '/' + qi.goal)));
          qd.appendChild(el('span', '', qi.q.t + ' — ' + (qi.done ? '조금 뒤에 새 퀘스트가 나와요.' : qi.q.how)));
          body.appendChild(qd);
        } else body.appendChild(el('div', 'mpSub', '친구가 들어오면 우리 반 퀘스트가 시작돼요. 같은 반, 같은 단원 친구가 보여요.'));
        body.appendChild(el('div', 'mpSub', '친구 옆에서 E: ✊ 가위바위보 · 🌟 칭찬 스티커 · 📸 같이 사진(P) · 🤝 짝꿍 · 같이 뛰면 🦘'));
        var sn = stickerCount(), bp = buddyPeer();
        if (sn || buddy) body.appendChild(el('div', 'mpSub', (sn ? '🌟 받은 칭찬 스티커 ' + sn + '개' : '') + (sn && buddy ? ' · ' : '') + (buddy ? '🤝 내 짝꿍: ' + buddy.k + (bp ? '' : ' (지금 없어요)') : '')));
        body.appendChild(el('div', 'mpSub', '인사말 (숫자 키 1~5) · 가까이서 서로 👋 하면 하이파이브!'));
        var em = el('div', 'mpEmo');
        EMO.slice(0, 5).forEach(function (e, i) {
          var b = el('button', '', e.e + ' ' + e.en); b.type = 'button';
          b.onclick = function () { closePanel(true); emote(i); };
          em.appendChild(b);
        });
        if (liveList().length) { var pb = el('button', '', '📸 같이 사진'); pb.type = 'button'; pb.onclick = function () { closePanel(true); takePhoto(); }; em.appendChild(pb); }
        body.appendChild(em);
        var rc = el('button', '', '🔄 다시 연결'); rc.type = 'button'; rc.title = '친구가 안 보이면 눌러요'; rc.onclick = function () { closePanel(true); reconnectNow(); };
        var rw = el('div', 'mpEmo'); rw.appendChild(rc);
        if (!liveList().length && heal.others.length) rw.appendChild(el('span', 'mpSub', '지금 접속한 친구: ' + heal.others.map(function (o) { return o.num + '번 ' + o.nick; }).slice(0, 8).join(', ')));
        body.appendChild(rw);
      }
    });
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
    var nn = peerList().length; if (now - lastSentT < (nn > 25 ? 580 : nn > 10 ? 380 : 0)) return; // 11명부터 0.4초, 26명부터 0.6초마다
    lastSent = sig; lastSentT = now;
    send('p', msg);
  }, SEND_MS);
  setInterval(function () {
    if (!me) {
      me = readProfile();
    }
    if (me && G.started && !room && !connecting && status === 'off') connect();
    if (!room) return;
    pushState();
    var now = Date.now();
    if (pendingOut && now - pendingOut.t > 30000) { var p = peers[pendingOut.to]; pendingOut = null; if (p && p.st) toast('🙂 ' + esc(p.st.k) + iga(p.st.k) + ' 바쁜가 봐요. 조금 뒤에 다시 물어봐요.', 2400); }
    if (pendingIn && now - pendingIn.t > 25000 && !(panelOpen && panelClose === answerClosed)) clearIncoming(true);
    if (invite && now - invite.t > 25000 && !(panelOpen && panelClose === inviteClosed)) clearInvite(true);
    if (rps && now - rps.t > 30000) { var rp = peers[rps.to]; rps = null; if (rp && rp.st) toast('🙂 ' + esc(rp.st.k) + iga(rp.st.k) + ' 바쁜가 봐요. 조금 뒤에 다시 해요.', 2200); }
    if (rpsIn && now - rpsIn.t > 15000) rpsIn = null;
    if (buddyOut && now - buddyOut.t > 30000) buddyOut = null;
    watchPeers();
    questCheck();
    refreshChip();
    beat(false);
  }, 1000);
  addEventListener('pagehide', function () { leave(); status = 'off'; });


  // ------------------------------------------------------------ 혼자 떨어지지 않게 (서버에 연결 상태 알리기 + 다시 붙기)
  var heal = { fail: 0, lastJoin: 0, lastBeat: 0, aloneSince: 0, tries: 0, nextTry: 0, others: [], blocked: false, busy: false };
  var HEAL_BEAT = 30000;
  function endpoint() { try { return String((window.NET_CONFIG && window.NET_CONFIG.endpoint) || ''); } catch (e) { return ''; } }
  function beat(force) {
    var ep = endpoint(), now = Date.now();
    if (!ep || !me || heal.busy || (!force && now - heal.lastBeat < HEAL_BEAT)) return;
    if (devMp && !qs.has('mpserver')) return; // 개발용 접속(가짜 반 코드)은 서버에 알리지 않아요
    heal.lastBeat = now; heal.busy = true;
    var body = { action: 'presence', code: me.code, num: me.num, nick: me.nick, lesson: lessonId, strat: stratI, peers: liveList().length, fail: heal.fail, status: status };
    fetch(ep, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (res) { heal.busy = false; if (res && res.ok && Array.isArray(res.others)) { heal.others = res.others.filter(function (o) { return o && o.age <= 90; }); healCheck(); } })
      .catch(function () { heal.busy = false; });
  }
  function healCheck() {
    if (!me || !G.started || connecting) return;
    var now = Date.now(), live = liveList().length, others = heal.others;
    if (live > 0 || !others.length) { heal.aloneSince = 0; if (live > 0) { heal.tries = 0; heal.blocked = false; } return; }
    // 친구가 접속해 있는데 나는 0명
    if (!heal.aloneSince) heal.aloneSince = now;
    if (now - heal.lastJoin < 35000 || now - heal.aloneSince < 25000 || now < heal.nextTry) return;
    // 친구들이 가장 많이 쓰는 길
    // (나도 세고, 수가 같으면 앞쪽 길로 — 둘이 동시에 서로의 길로 엇갈려 옮기지 않게)
    var cnt = {}, best = stratI, bn = 0;
    cnt[stratI] = 1;
    others.forEach(function (o) { var s = int(o.strat, 0, STRATS.length - 1); cnt[s] = (cnt[s] || 0) + 1; });
    Object.keys(cnt).forEach(function (k) { var s = +k; if (cnt[s] > bn || (cnt[s] === bn && s < best)) { bn = cnt[s]; best = s; } });
    // 친구들도 서로 0명이면(모두 막힌 경우) 나만 옮겨 봐야 소용없어요 → 같은 길에서 다시
    var friendsConnected = others.some(function (o) { return o.peers > 0; });
    if (best !== stratI) {
      heal.tries++; heal.nextTry = now + 40000;
      toast('📡 친구들이 있는 곳으로 다시 연결해요…', 2600);
      leave(); stratI = best; status = 'off'; connect();
      return;
    }
    // 다른 길에 있는 친구가 이쪽으로 옮겨 올 차례예요 → 나는 기다려요
    if (others.some(function (o) { return int(o.strat, 0, STRATS.length - 1) !== stratI; })) { heal.nextTry = now + 30000; return; }
    if (heal.tries >= 4) { // 여러 번 다시 들어가도 안 되면: 학교 인터넷이 친구와 바로 연결을 막고 있을 수 있어요
      if (!heal.blocked) { heal.blocked = true; refreshChip(); toast('📡 친구 ' + others.length + '명이 접속해 있는데 연결이 안 돼요. 학교 인터넷이 막고 있을 수 있어요. 게임은 그대로 할 수 있어요.', 5200); }
      heal.nextTry = now + 180000; heal.tries = 2; // 3분 뒤에 다시 시도
      return;
    }
    heal.tries++; heal.nextTry = now + 30000 * heal.tries;
    if (heal.tries > 1) toast('📡 친구들과 다시 연결하는 중…', 2200);
    var s = stratI; leave(); stratI = s; status = 'off'; connect();
  }
  function reconnectNow() {
    heal.tries = 0; heal.nextTry = 0; heal.blocked = false; heal.fail = 0;
    toast('📡 다시 연결해요…', 2000);
    var s = stratI; leave(); stratI = s; status = 'off'; connect();
    setTimeout(function () { beat(true); }, 20000);
  }

  // ------------------------------------------------------------ 게임 쪽에서 부르는 것
  var nearFriend = null;

  // ------------------------------------------------------------ 친구의 고양이 (친구가 길들인 고양이가 친구 옆을 따라다녀요)
  function catModel(skin) {
    try { if (window.PLAY && typeof window.PLAY.makeCat === 'function') { var c = window.PLAY.makeCat(skin); if (c) return c; } } catch (e) {}
    // play.js 가 없을 때를 위한 간단한 고양이
    var g = new THREE.Group(), col = skin === 1 ? 0x9aa1a8 : 0xf08c2e, m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 });
    var body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.34, 4, 10), m); body.rotation.x = Math.PI / 2; body.position.y = 0.3; g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), m); head.position.set(0, 0.46, 0.27); g.add(head);
    [-0.07, 0.07].forEach(function (x) { var e = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), m); e.position.set(x, 0.6, 0.27); g.add(e); });
    var tail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.36, 6), m); tail.position.set(0, 0.45, -0.3); tail.rotation.x = -0.5; g.add(tail);
    [[-0.08, 0.15], [0.08, 0.15], [-0.08, -0.15], [0.08, -0.15]].forEach(function (q) { var l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), m); l.position.set(q[0], 0.1, q[1]); g.add(l); });
    g.userData.pose = function (tt, mode) { tail.rotation.z = Math.sin(tt * 3) * 0.4; body.position.y = mode === 'sit' ? 0.24 : 0.3 + Math.abs(Math.sin(tt * (mode === 'run' ? 14 : 9))) * 0.03; };
    return g;
  }
  function petTick(p, dt, t) {
    var want = p.st && p.st.pt && p.has && !p.away ? p.st.pt : 0;
    if (!want) { if (p.pet) { try { G.scene.remove(p.pet.g); } catch (e) {} p.pet = null; } return; }
    if (!p.pet || p.pet.kind !== want) {
      if (p.pet) { try { G.scene.remove(p.pet.g); } catch (e) {} }
      var g = catModel(want - 1); if (!g) return;
      g.traverse(function (o) { o.userData.ns = 1; });
      var side = -0.9, s0 = Math.sin(p.yaw), c0 = Math.cos(p.yaw);
      g.position.set(p.x - s0 * 0.9 + c0 * side, 0, p.z - c0 * 0.9 - s0 * side);
      try { var hs = G.textSprite('❤️', 0.3, { fs: 64, bg: null }); hs.position.y = 0.95; g.add(hs); } catch (e) {}
      G.scene.add(g); p.pet = { g: g, kind: want, mode: 'sit' };
    }
    var c = p.pet, s = Math.sin(p.yaw), co = Math.cos(p.yaw);
    // 친구의 왼쪽 조금 뒤에 서요
    var tx = p.x + co * 0.85 + s * 0.55, tz = p.z - s * 0.85 + co * 0.55;
    var dx = tx - c.g.position.x, dz = tz - c.g.position.z, d = Math.hypot(dx, dz);
    if (d > 8) { c.g.position.x = tx; c.g.position.z = tz; d = 0; }
    var sp = d > 0.25 ? Math.min(d, Math.max(1.6, d * 3) * dt) : 0;
    if (sp > 0) { c.g.position.x += dx / d * sp; c.g.position.z += dz / d * sp; c.g.rotation.y = Math.atan2(dx, dz); }
    else { var ry = p.yaw + Math.PI, dr = Math.atan2(Math.sin(ry - c.g.rotation.y), Math.cos(ry - c.g.rotation.y)); c.g.rotation.y += dr * Math.min(1, dt * 3); }
    c.mode = d > 2.2 ? 'run' : d > 0.3 ? 'walk' : 'sit';
    try { if (c.g.userData.pose) c.g.userData.pose(t, c.mode); } catch (e) {}
  }
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
      try { petTick(p, dt, t); } catch (e) {}
      p.d = Math.hypot(p.x - P.x, p.z - P.z);
      if (p.st && !p.away && p.d < bd) { bd = p.d; best = p; }
      // 도와 달라는 친구에게 가면
      if (p.st && p.st.h && !p.helped && p.d < 3 && G.started) {
        p.helped = true; send('e', 5, p.id);
        toast('🤝 ' + esc(p.st.k) + '에게 왔어요! ' + (p.st.st >= 6 ? '' : '미션 ' + (p.st.st + 1) + '을 하고 있어요. ') + '같이 해 봐요.', 3200);
        reward(p, '친구를 도와주러 갔어요!'); questAdd(2, 1);
      }
    }
    try { jumpTick(list, nowMs); } catch (e) {}
    var farB = null; try { farB = buddyTick(nowMs); } catch (e) {}
    followTick();
    if (!followId && farB) { // 짝꿍과 멀어지면 화살표로 알려 줘요
      var relB = Math.atan2(-(farB.x - P.x), -(farB.z - P.z)) - P.yaw; relB = Math.atan2(Math.sin(relB), Math.cos(relB));
      followArrow.style.transform = 'rotate(' + (-relB).toFixed(2) + 'rad)'; followText.textContent = '🤝 짝꿍 ' + farB.st.k + ' ' + Math.round(farB.d) + 'm';
      followEl.classList.toggle('show', G.started && !G.dlgOpen && !panelOpen);
    }
    var npc = G.nearNPC;
    nearFriend = best && G.started && !G.dlgOpen && !(npc && npc.talk) ? best : null;
    if (nearFriend) {
      try {
        G.prompt.style.display = 'block';
        G.prompt.innerHTML = (G.isTouch ? '👆 ' : '<b>E</b> ') + esc(nearFriend.st.k) + wa(nearFriend.st.k) + ' 함께 하기 🙌';
        var ab = document.getElementById('actBtn'); if (ab) ab.classList.add('ready');
      } catch (e) {}
    }
  }
  function interact() {
    if (panelOpen) return true;
    if (pendingIn && nearFriend && nearFriend.id === pendingIn.from) { openAnswer(); return true; }
    if (invite && nearFriend && nearFriend.id === invite.from) { openInvite(); return true; }
    if (!nearFriend || !room) return false;
    openFriendMenu(nearFriend);
    return true;
  }
  function drawMap(ctx, tx, tz) {
    try {
      peerList().forEach(function (p) {
        if (!p.has || !p.st) return;
        var x = tx(p.x), y = tz(p.z);
        if (p.id === followId) { ctx.strokeStyle = '#2a9d8f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9 + Math.sin(Date.now() / 200) * 2, 0, 7); ctx.stroke(); }
        if (p.st.h) { ctx.strokeStyle = '#ff9f1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.stroke(); }
        ctx.fillStyle = isBuddy(p) ? '#e64980' : '#2a9d8f'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
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
      return { heal: { others: heal.others.length, tries: heal.tries, fail: heal.fail, blocked: heal.blocked, alone: heal.aloneSince ? Math.round((Date.now() - heal.aloneSince) / 1000) : 0 }, myPet: myPet(), status: status, strat: STRATS[stratI], buddy: buddy, stickers: stickerCount(), invite: invite && invite.kind, rps: !!rps, rpsIn: !!rpsIn, room: me ? roomId() : '', sum: groupSum(), pendingIn: !!pendingIn, pendingOut: !!pendingOut, quest: (function () { var q = questInfo(); return { e: quest.e, type: quest.e % QUESTS.length, p: quest.p, sum: q.sum, goal: q.goal, done: q.done }; })(), follow: followId,
        peers: peerList().map(function (p) { return { pet: p.st && p.st.pt, petShown: !!p.pet, id: p.id, k: p.st && p.st.k, n: p.st && p.st.n, av: p.st && p.st.av, d: r2(p.d), st: p.st && p.st.st, s: p.st && p.st.s, h: p.st && p.st.h, x: r2(p.tx), z: r2(p.tz), has: p.has, away: p.away, vis: !!(p.g && p.g.visible) }; }) };
    },
    _test: isDev ? { beat: function () { heal.lastBeat = 0; beat(true); }, heal: healCheck, reconnect: reconnectNow, setOthers: function (o) { heal.others = o; }, menu: function () { var p = liveList()[0]; if (p) openFriendMenu(p); }, rps: function () { var p = liveList()[0]; if (p) openRps(p); }, sticker: function () { var p = liveList()[0]; if (p) openSticker(p); }, photo: takePhoto, buddyAsk: function () { var p = liveList()[0]; if (p) askBuddy(p); }, incoming: openIncoming, openAsk: function () { var p = liveList()[0]; if (p) openAsk(p); }, openAnswer: openAnswer, pick: function (i) { if (panelKeys && panelKeys[i]) panelKeys[i].click(); }, group: openGroupPanel, leave: function () { leave(); status = 'off'; }, askN: function (n) { var p = liveList().filter(function (x) { return x.st.n === n; })[0]; if (p) openAsk(p); }, follow: function (n) { var p = liveList().filter(function (x) { return x.st.n === n; })[0]; if (p) startFollow(p); }, questType: function (ty) { qEpoch = function () { return ty; }; questRoll(); quest.done = false; quest.p = 0; } } : null
  };

  // 개발용 기록: ?mplog=1 (로컬에서만)
  if (isDev && qs.has('mplog')) {
    setInterval(function () {
      try { fetch('/log', { method: 'POST', body: (qs.get('mplog') || '') + ' ' + JSON.stringify(window.MULTI.debug()) }).catch(noop); } catch (e) {}
    }, 2000);
  }
})();
