/* 영어 3D 학교 · 우리 반 기록 보내기 (선택 기능)
 * - net-config.js 의 endpoint 가 비어 있으면 아무것도 안 해요.
 * - 반에 참여하지 않으면 아무것도 안 보내요. 혼자 하기는 언제나 그대로 돼요.
 * - 어떤 경우에도 오류를 밖으로 던지지 않아요.
 * - 이어하기 저장: 반 코드 + 번호 + 비밀번호 4자리로 들어오면 진행 상황을 서버에 올리고, 다른 컴퓨터에서도 내려받아요.
 *
 * 쓰는 법 (게임 쪽):
 *   NET.init({ lesson: 'L1' });                 // 시작 화면이 준비된 뒤 한 번
 *   NET.track('answer', { stage: 1, q: 'What grade are you in?', ok: true, first: true });
 */
(function () {
  'use strict';
  var PROFILE_KEY = 'english3d_class';
  var QUEUE_KEY = 'english3d_netq';
  var QUEUE_MAX = 300;
  var BATCH = 50;
  var FLUSH_MS = 10000;
  var MAX_BACKOFF_MS = 120000;
  var TIMEOUT_MS = 15000;

  var endpoint = '';
  try { endpoint = String((window.NET_CONFIG && window.NET_CONFIG.endpoint) || '').trim(); } catch (e) {}
  if (endpoint && !/^https?:\/\//i.test(endpoint)) endpoint = '';

  var lesson = 'L1';
  var profile = null;   // { code, num, nick, name }
  var queue = [];       // { c, n, k, l, e }
  var sending = false;
  var timer = null;
  var soon = null;
  var failCount = 0;
  var nextTry = 0;
  var lastState = '';
  var inited = false;
  var ui = null;
  var note = '';        // 참여 중 줄에 덧붙이는 안내

  // ------------------------------------------------------------ 저장소
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function loadProfile() {
    var p = lsGet(PROFILE_KEY);
    if (p && /^[A-Z0-9]{5}$/.test(p.code) && p.num >= 1 && p.num <= 99 && p.nick) { p.tok = typeof p.tok === 'string' && /^[0-9a-f]{40}$/.test(p.tok) ? p.tok : ''; return p; }
    return null;
  }
  function saveQueue() {
    if (queue.length > QUEUE_MAX) queue = queue.slice(queue.length - QUEUE_MAX);
    lsSet(QUEUE_KEY, queue.length ? queue : null);
  }

  // ------------------------------------------------------------ 값 다듬기
  function str(v, max) {
    var s;
    if (v == null) return '';
    if (typeof v === 'object') {
      try { s = Object.keys(v).map(function (k) { return v[k]; }).filter(function (x) { return x != null && x !== ''; }).join(' / '); } catch (e) { s = ''; }
    } else s = String(v);
    s = s.replace(/[<>]/g, '').trim();
    return s.length > max ? s.slice(0, max) : s;
  }
  function int(v) { var n = Math.round(Number(v)); return isFinite(n) && n >= 0 ? n : 0; }
  function cleanText(v, max) { return String(v == null ? '' : v).replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }

  function makeEvent(type, d) {
    d = d || {};
    var e = { type: type, t: Date.now() };
    if (d.stage != null) e.stage = Math.min(6, int(d.stage));
    ['stars', 'correct', 'tries', 'best'].forEach(function (k) { if (d[k] != null) e[k] = int(d[k]); });
    if (type === 'answer') { e.q = str(d.q, 80); e.ok = !!d.ok; e.first = !!d.first; }
    if ((type === 'finish' || type === 'state') && d.card != null && d.card !== '') e.card = str(d.card, 1000);
    return e;
  }

  // ------------------------------------------------------------ 보내기
  function post(body) {
    var ctrl = null, to = null;
    try { ctrl = new AbortController(); to = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, TIMEOUT_MS); } catch (e) {}
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(to);
      return j && typeof j === 'object' ? j : { ok: false, error: 'server' };
    }, function () {
      clearTimeout(to);
      return { ok: false, error: 'network' };
    });
  }

  function nextBatch() {
    if (!queue.length) return null;
    var h = queue[0], items = [];
    for (var i = 0; i < queue.length && items.length < BATCH; i++) {
      var q = queue[i];
      if (q.c === h.c && q.n === h.n && q.l === h.l) items.push(q);
    }
    return {
      items: items,
      body: { action: 'events', code: h.c, num: h.n, nick: h.k, lesson: h.l, events: items.map(function (q) { return q.e; }) }
    };
  }
  function removeItems(items) {
    queue = queue.filter(function (q) { return items.indexOf(q) < 0; });
    saveQueue();
  }

  function flush(force) {
    try {
      if (!endpoint || sending || !queue.length) return;
      if (!force && Date.now() < nextTry) return;
      var b = nextBatch();
      if (!b) return;
      sending = true;
      post(b.body).then(function (res) {
        sending = false;
        if (res.ok) {
          failCount = 0; nextTry = 0;
          removeItems(b.items);
          if (queue.length) setTimeout(function () { flush(true); }, 300);
          return;
        }
        if (res.error === 'noclass' || res.error === 'closed' || res.error === 'bad' || res.error === 'full') { // full: 서버 기록장이 가득 참 → 더 보내지 않아요(게임은 그대로)
          // 다시 보내도 안 되는 기록은 버려요
          var dead = (res.error === 'bad' || res.error === 'full') ? b.items : queue.filter(function (q) { return q.c === b.body.code; });
          removeItems(dead);
          if (profile && profile.code === b.body.code) {
            if (res.error === 'noclass') { setProfile(null); note = '반이 없어져서 혼자 하기로 바뀌었어요.'; }
            if (res.error === 'closed') note = '반이 닫혀 있어서 기록은 보내지 않아요.';
            render();
          }
          return;
        }
        failCount++;
        nextTry = Date.now() + Math.min(MAX_BACKOFF_MS, FLUSH_MS * Math.pow(2, failCount - 1));
      });
    } catch (e) { sending = false; }
  }

  function beaconFlush() {
    try {
      if (!endpoint || !queue.length || !navigator.sendBeacon) return;
      for (var guard = 0; guard < 6 && queue.length; guard++) {
        var b = nextBatch();
        var blob = new Blob([JSON.stringify(b.body)], { type: 'text/plain;charset=UTF-8' });
        if (!navigator.sendBeacon(endpoint, blob)) break;
        removeItems(b.items);
      }
    } catch (e) {}
  }

  function startTimer() {
    if (timer || !endpoint) return;
    timer = setInterval(function () { flush(false); }, FLUSH_MS);
  }

  // ------------------------------------------------------------ 기록하기
  function track(type, data) {
    try {
      if (!endpoint || !profile) return;
      if (!/^(start|answer|stage_done|finish|state)$/.test(String(type))) return;
      var e = makeEvent(String(type), data);
      var item = { c: profile.code, n: profile.num, k: profile.nick, l: lesson, e: e };
      if (type === 'state') {
        var sig = JSON.stringify([item.c, item.n, item.l, e.stage, e.stars, e.correct, e.tries, e.best, e.card]);
        if (sig === lastState) return;
        lastState = sig;
        // 아직 못 보낸 이전 state 는 새 것으로 바꿔요
        queue = queue.filter(function (q) { return !(q.e.type === 'state' && q.c === item.c && q.n === item.n && q.l === item.l); });
      }
      queue.push(item);
      saveQueue();
      startTimer();
      if (type === 'finish' || type === 'stage_done') {
        clearTimeout(soon);
        soon = setTimeout(function () { flush(true); }, 1000);
        clearTimeout(saveSoon);
        saveSoon = setTimeout(function () { pushSave(false); }, 2500); // 미션을 끝내면 이어하기 저장도 바로
      }
    } catch (e) {}
  }

  // ------------------------------------------------------------ 참여하기
  function setProfile(p) {
    profile = p;
    lsSet(PROFILE_KEY, p);
    lastState = '';
  }

  function join(code, num, nick, cb) {
    post({ action: 'join', code: code, num: num, nick: nick, lesson: lesson }).then(function (res) {
      try { cb(res); } catch (e) {}
    });
  }

  // ------------------------------------------------------------ 이어하기 저장 (반 코드 + 번호 + 비밀번호 4자리)
  // 들어오면 서버가 '표(tok)'를 줘요. 그 표로 진행 상황을 서버에 올리고, 다른 컴퓨터에서 들어오면 내려받아요.
  // 서버에는 언제나 "더 많이 한 쪽"을 남겨요(뒤로 가지 않아요). 이 컴퓨터의 기록이 누구 것인지(OWNER_KEY)도 적어 둬요.
  var OWNER_KEY = 'english3d_owner';
  var SAVE_MS = 90000;
  var remote = null;      // 마지막으로 알고 있는 서버 저장
  var lastPushed = '';
  var saveTimer = null, saveSoon = null, savePending = false;
  function lsRaw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsRawSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, String(v)); } catch (e) {} }
  function deepClean(v, depth) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.replace(/[<>&"`]/g, '').slice(0, 200);
    if (depth >= 5) return null;
    if (Array.isArray(v)) return v.slice(0, 60).map(function (x) { return deepClean(x, depth + 1); });
    if (typeof v === 'object') { var o = {}; Object.keys(v).slice(0, 60).forEach(function (k) { if (/^[A-Za-z0-9_]{1,24}$/.test(k)) o[k] = deepClean(v[k], depth + 1); }); return o; }
    return null;
  }
  function cleanLesson(s) {
    s = deepClean(s, 0); if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
    s.v = 1; // 게임은 v === 1 인 저장만 읽어요
    s.stage = Math.max(0, Math.min(6, int(s.stage)));
    ['stars', 'correct', 'tries', 'best', 'gems'].forEach(function (k) { if (s[k] != null) s[k] = Math.min(99999, int(s[k])); });
    if (!Array.isArray(s.th)) s.th = []; s.th = s.th.filter(function (x) { return typeof x === 'string' && x; }).slice(0, 12);
    if (Array.isArray(s.medals)) s.medals = s.medals.slice(0, 7).map(function (m) { return Math.max(0, Math.min(3, int(m))); }); else delete s.medals;
    if (s.card != null && (typeof s.card !== 'object' || Array.isArray(s.card))) s.card = null;
    return s;
  }
  function collect() {
    var b = { v: 1, L: {} };
    for (var n = 1; n <= 13; n++) { var s = lsGet('english3d_l' + n + '_v1'); if (s && typeof s === 'object') { s = cleanLesson(s); if (s) b.L[n] = s; } }
    var f = lsGet('english3d_fun_v1'); if (f && typeof f === 'object') b.fun = deepClean(f, 0);
    var d = int(lsRaw('english3d_deco')); if (d >= 1 && d <= 9) b.deco = d;
    var a = lsRaw('english3d_avatar'); if (a && /^[A-Za-z]{2,12}$/.test(a)) b.avatar = a;
    return b;
  }
  function hasProgress(b) {
    if (!b) return false;
    for (var k in (b.L || {})) { var s = b.L[k]; if (s && (s.stage > 0 || s.stars > 0)) return true; }
    return false;
  }
  function better(a, b) { return a.stage > b.stage || (a.stage === b.stage && (a.stars || 0) >= (b.stars || 0)) ? a : b; }
  function mergeLesson(a, b) {
    a = a ? cleanLesson(a) : null; b = b ? cleanLesson(b) : null;
    if (!a) return b; if (!b) return a;
    var w = better(a, b), o = w === a ? b : a, out = JSON.parse(JSON.stringify(w));
    var ma = a.medals || [], mb = b.medals || [], m = [];
    for (var i = 0; i < Math.max(ma.length, mb.length); i++) m.push(Math.max(ma[i] || 0, mb[i] || 0));
    if (m.length) out.medals = m;
    o.th.forEach(function (x) { if (out.th.indexOf(x) < 0 && out.th.length < 12) out.th.push(x); });
    out.gems = Math.max(a.gems || 0, b.gems || 0); out.best = Math.max(a.best || 0, b.best || 0);
    if (!out.card && o.card) out.card = o.card;
    return out;
  }
  function mergeBlob(a, b) {
    a = a || { L: {} }; b = b || { L: {} };
    var out = { v: 1, L: {} };
    for (var n = 1; n <= 13; n++) { var m = mergeLesson((a.L || {})[n], (b.L || {})[n]); if (m) out.L[n] = m; }
    var fa = a.fun && typeof a.fun === 'object' ? a.fun : null, fb = b.fun && typeof b.fun === 'object' ? b.fun : null;
    if (fa || fb) {
      var f = deepClean(fa || fb, 0), g = fa && fb ? fb : null;
      if (g) {
        ['gems', 'stars', 'decoMax'].forEach(function (k) { f[k] = Math.max(int(f[k]), int(g[k])); });
        f.badges = f.badges && typeof f.badges === 'object' ? f.badges : {};
        Object.keys(g.badges && typeof g.badges === 'object' ? g.badges : {}).forEach(function (k) { var t = int(g.badges[k]); if (!f.badges[k] || (t && t < f.badges[k])) f.badges[k] = t || 1; });
      }
      f.fresh = [];
      out.fun = f;
    }
    out.deco = a.deco || b.deco || 0; if (!out.deco) delete out.deco;
    out.avatar = a.avatar || b.avatar || ''; if (!out.avatar) delete out.avatar;
    return out;
  }
  function sigOf(b) { try { return JSON.stringify([b.L, b.fun ? [b.fun.gems, b.fun.badges, b.fun.decoMax] : 0, b.deco || 0, b.avatar || '']); } catch (e) { return ''; } }
  function applyBlob(b) {
    for (var n = 1; n <= 13; n++) { var s = b && b.L ? cleanLesson(b.L[n]) : null; lsSet('english3d_l' + n + '_v1', s); }
    lsSet('english3d_fun_v1', b && b.fun ? deepClean(b.fun, 0) : null);
    lsRawSet('english3d_deco', b && b.deco ? int(b.deco) : null);
    if (b && b.avatar && /^[A-Za-z]{2,12}$/.test(b.avatar)) lsRawSet('english3d_avatar', b.avatar);
  }
  function titleShowing() { try { var t = document.querySelector('#title'); return !!(t && t.classList.contains('show')); } catch (e) { return false; } }
  /** 서버 저장(save)을 받아 이 컴퓨터 기록과 맞춰요. mode: 'merge'(내 기록) / 'server'(서버 것으로) / 'local'(이 컴퓨터 것을 내 것으로) / 'fresh'(처음부터) */
  function syncWith(save, mode) {
    var local = collect(), fin;
    remote = save && typeof save === 'object' ? save : null;
    if (mode === 'merge') fin = mergeBlob(local, remote);
    else if (mode === 'server') fin = mergeBlob(remote, null);
    else if (mode === 'local') fin = local;
    else fin = { v: 1, L: {} };
    lsRawSet(OWNER_KEY, profile ? profile.code + '|' + profile.num : null);
    var changed = sigOf(local) !== sigOf(fin);
    if (changed) applyBlob(fin);
    if (sigOf(fin) !== sigOf(mergeBlob(remote, null))) pushSave(true);
    else lastPushed = sigOf(fin);
    return changed;
  }
  function pushSave(force) {
    try {
      if (!endpoint || !profile || !profile.tok || savePending) return;
      var b = mergeBlob(collect(), remote), sig = sigOf(b);
      if (!force && sig === lastPushed) return;
      if (!hasProgress(b) && !b.fun) { lastPushed = sig; return; }
      savePending = true; var p = profile;
      post({ action: 'save', code: p.code, num: p.num, token: p.tok, data: b }).then(function (res) {
        savePending = false;
        if (res.ok) { lastPushed = sig; remote = b; if (note === NOTE_OFFLINE) { note = ''; render(); } }
        else if (res.error === 'auth' && profile === p) { p.tok = ''; lsSet(PROFILE_KEY, p); note = NOTE_REAUTH; render(); }
      });
    } catch (e) { savePending = false; }
  }
  function beaconSave() {
    try {
      if (!endpoint || !profile || !profile.tok || !navigator.sendBeacon) return;
      var b = mergeBlob(collect(), remote), sig = sigOf(b);
      if (sig === lastPushed || (!hasProgress(b) && !b.fun)) return;
      var blob = new Blob([JSON.stringify({ action: 'save', code: profile.code, num: profile.num, token: profile.tok, data: b })], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon(endpoint, blob)) lastPushed = sig;
    } catch (e) {}
  }
  function startSaveTimer() { if (saveTimer || !endpoint) return; saveTimer = setInterval(function () { pushSave(false); }, SAVE_MS); }
  var NOTE_REAUTH = '비밀번호가 초기화됐어요. "바꾸기"를 눌러 새 비밀번호를 정하면 다시 저장돼요.';
  var NOTE_NOPIN = '"바꾸기"를 눌러 비밀번호를 정하면 다른 컴퓨터에서도 이어서 할 수 있어요.';
  var NOTE_OFFLINE = '';

  // ------------------------------------------------------------ 시작 화면 UI
  var CSS = [
    '.net-box{margin:14px auto 4px;max-width:520px;text-align:left;font-size:16px;color:var(--ink,#1d3557)}',
    '.net-open{display:block;width:100%;border:2px dashed var(--teal,#2a9d8f);background:#f0faf8;color:var(--ink,#1d3557);border-radius:14px;padding:10px 14px;font:inherit;font-size:17px;cursor:pointer}',
    '.net-open:hover{background:#e3f5f1}',
    '.net-form{background:#f0faf8;border:2px solid var(--teal,#2a9d8f);border-radius:14px;padding:12px 14px}',
    '.net-form .net-title{font-size:17px;margin-bottom:8px}',
    '.net-row{display:flex;gap:8px;flex-wrap:wrap}',
    '.net-row label{display:flex;flex-direction:column;gap:3px;font-size:14px;flex:1 1 90px}',
    '.net-row label.net-wide{flex:2 1 140px}',
    '.net-box input{font:inherit;font-size:18px;padding:7px 9px;border-radius:10px;border:2px solid #cbd5e1;color:var(--ink,#1d3557);width:100%;box-sizing:border-box;-webkit-user-select:text;user-select:text}',
    '.net-box input:focus{outline:none;border-color:var(--teal,#2a9d8f)}',
    '.net-code{text-transform:uppercase;letter-spacing:3px}',
    '.net-btns{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}',
    '.net-btns button{border:0;border-radius:12px;padding:9px 16px;font:inherit;font-size:17px;cursor:pointer;background:var(--teal,#2a9d8f);color:#fff}',
    '.net-btns button.net-ghost{background:#e2e8f0;color:var(--ink,#1d3557)}',
    '.net-btns button:disabled{opacity:.6;cursor:wait}',
    '.net-msg{min-height:1.2em;margin-top:6px;font-size:14.5px;color:#c92a2a}',
    '.net-msg.net-good{color:var(--teal,#2a9d8f)}',
    '.net-hint{font-size:13.5px;color:#5c677d;margin-top:6px}',
    '.net-joined{background:#f0faf8;border-radius:14px;padding:9px 14px;font-size:16px;text-align:center}',
    '.net-joined b{color:var(--teal,#2a9d8f)}',
    '.net-link{background:none;border:0;padding:0;color:var(--accent,#e76f51);text-decoration:underline;cursor:pointer;font:inherit}',
    '.net-note{font-size:14px;color:#5c677d;margin-top:3px}',
    '.net-ask{margin-top:8px;padding:9px 11px;border-radius:12px;background:#fff8e6;border:2px solid #f4d58d;font-size:15.5px}',
    '.net-pin{letter-spacing:6px}'
  ].join('\n');

  // 받침에 따라 '로' / '으로'
  function josa(word) {
    var c = String(word).charCodeAt(String(word).length - 1) - 0xAC00;
    if (c < 0 || c > 11171) return '(으)로';
    var j = c % 28;
    return j === 0 || j === 8 ? '로' : '으로';
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildUI() {
    var panel = document.querySelector('#title .panel');
    if (!panel || document.querySelector('.net-box')) return;
    var st = el('style'); st.textContent = CSS; document.head.appendChild(st);

    var box = el('div', 'net-box');
    var openBtn = el('button', 'net-open', '🏫 우리 반으로 참여하기 (선택)');
    openBtn.type = 'button';

    var form = el('form', 'net-form');
    form.setAttribute('autocomplete', 'off');
    form.appendChild(el('div', 'net-title', '🏫 우리 반으로 참여하기'));
    var row = el('div', 'net-row');
    function field(label, attrs, cls) {
      var l = el('label', cls || '', label);
      var i = el('input');
      Object.keys(attrs).forEach(function (k) { i.setAttribute(k, attrs[k]); });
      l.appendChild(i); row.appendChild(l);
      return i;
    }
    var inCode = field('반 코드', { maxlength: '5', placeholder: 'ABCDE', class: 'net-code', autocapitalize: 'characters', spellcheck: 'false' });
    var inNum = field('번호', { type: 'number', min: '1', max: '99', inputmode: 'numeric', placeholder: '3' });
    var inNick = field('별명', { maxlength: '12', placeholder: '예: 별빛토끼', spellcheck: 'false' }, 'net-wide');
    var inPin = field('비밀번호 (숫자 4자리)', { type: 'password', maxlength: '4', inputmode: 'numeric', pattern: '[0-9]*', placeholder: '····', autocomplete: 'off', class: 'net-pin' }, 'net-wide');
    form.appendChild(row);
    var btns = el('div', 'net-btns');
    var goBtn = el('button', '', '참여'); goBtn.type = 'submit';
    var leaveBtn = el('button', 'net-ghost', '반 나가기 (혼자 하기)'); leaveBtn.type = 'button';
    var closeBtn = el('button', 'net-ghost', '닫기'); closeBtn.type = 'button';
    btns.appendChild(goBtn); btns.appendChild(leaveBtn); btns.appendChild(closeBtn);
    form.appendChild(btns);
    var msg = el('div', 'net-msg');
    form.appendChild(msg);
    form.appendChild(el('div', 'net-hint', '🔑 비밀번호는 처음에 내가 정해요. 다음부터 같은 번호와 비밀번호로 들어오면 다른 컴퓨터에서도 이어서 할 수 있어요. 잊었으면 선생님께 말해요.'));
    form.appendChild(el('div', 'net-hint', '진짜 이름은 쓰지 말고 별명을 써요. 참여하지 않아도 게임은 그대로 할 수 있어요.'));
    var ask = el('div', 'net-ask'); ask.style.display = 'none'; form.appendChild(ask);

    var joined = el('div', 'net-joined');

    box.appendChild(openBtn); box.appendChild(form); box.appendChild(joined);
    var links = panel.querySelector('.links');
    if (links) panel.insertBefore(box, links); else panel.appendChild(box);

    ui = { box: box, openBtn: openBtn, form: form, joined: joined, inCode: inCode, inNum: inNum, inNick: inNick, inPin: inPin, ask: ask, goBtn: goBtn, leaveBtn: leaveBtn, msg: msg, editing: false };
    inPin.addEventListener('input', function () { var v = inPin.value.replace(/\D/g, '').slice(0, 4); if (v !== inPin.value) inPin.value = v; });

    openBtn.onclick = function () { ui.editing = true; msg.textContent = ''; render(); try { inCode.focus(); } catch (e) {} };
    closeBtn.onclick = function () { ui.editing = false; render(); };
    leaveBtn.onclick = function () {
      setProfile(null); note = ''; ui.editing = false; render();
    };
    inCode.addEventListener('input', function () {
      var v = inCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
      if (v !== inCode.value) inCode.value = v;
    });
    form.onsubmit = function (ev) {
      try { ev.preventDefault(); } catch (e) {}
      var code = inCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      var num = parseInt(inNum.value, 10);
      var nick = cleanText(inNick.value, 12);
      msg.className = 'net-msg';
      if (code.length !== 5) { msg.textContent = '반 코드 5글자를 적어 주세요.'; return false; }
      if (!(num >= 1 && num <= 99)) { msg.textContent = '번호를 1~99 숫자로 적어 주세요.'; return false; }
      if (!nick) { msg.textContent = '별명을 적어 주세요.'; return false; }
      var pin = inPin.value.replace(/\D/g, '');
      if (pin.length !== 4) { msg.textContent = '비밀번호 숫자 4자리를 적어 주세요. (처음이면 내가 정해요)'; try { inPin.focus(); } catch (e) {} return false; }
      goBtn.disabled = true; goBtn.textContent = '확인 중…'; msg.textContent = ''; ask.style.display = 'none';
      var done = function (res, mode) {
        setProfile({ code: code, num: num, nick: res.nick || nick, name: cleanText(res.name, 20), tok: typeof res.token === 'string' ? res.token : '' });
        note = ''; ui.editing = false; inPin.value = '';
        startTimer(); flush(true); startSaveTimer();
        var changed = false;
        if (profile.tok) changed = syncWith(res.save || null, mode);
        if (changed && titleShowing()) { try { sessionStorage.setItem('english3d_synced', res.save ? '저장된 기록을 불러왔어요. 이어서 해요!' : '처음부터 시작해요!'); } catch (e) {} window.__e3dReloading = true; location.reload(); return; }
        if (profile.tok) note = res.isNew ? '☁️ 비밀번호를 정했어요. 이제 자동으로 저장돼요.' : '☁️ 자동으로 저장돼요.';
        render();
      };
      post({ action: 'login', code: code, num: num, nick: nick, pin: pin, lesson: lesson }).then(function (res) {
        goBtn.disabled = false; goBtn.textContent = '참여';
        if (res.ok) {
          var me = code + '|' + num, owner = lsRaw(OWNER_KEY), local = collect();
          if (res.save) { done(res, owner === me ? 'merge' : 'server'); return; }
          if (owner === me || !hasProgress(local)) { done(res, 'local'); return; }
          if (owner && owner !== me) { done(res, 'fresh'); return; }
          // 이 컴퓨터에 주인 없는 기록이 있어요: 내 것인지 물어봐요 (같이 쓰는 컴퓨터에서 남의 기록을 이어받지 않게)
          ask.textContent = ''; ask.style.display = '';
          ask.appendChild(el('div', '', '이 컴퓨터에 하던 기록이 남아 있어요. 내가 하던 건가요?'));
          var bs = el('div', 'net-btns');
          var y = el('button', '', '네, 이어서 할게요'); y.type = 'button';
          var n = el('button', 'net-ghost', '아니요, 처음부터 할게요'); n.type = 'button';
          y.onclick = function () { ask.style.display = 'none'; done(res, 'local'); };
          n.onclick = function () { ask.style.display = 'none'; done(res, 'fresh'); };
          bs.appendChild(y); bs.appendChild(n); ask.appendChild(bs);
        } else if (res.error === 'network') {
          msg.textContent = '연결이 안 돼요. 인터넷을 확인하거나, 혼자 하기로 계속해도 돼요.';
        } else if (res.error === 'bad' && /알 수 없는/.test(String(res.msg || ''))) {
          // 서버가 아직 예전 판이면 저장 없이 참여만 해요
          join(code, num, nick, function (r2) {
            if (r2.ok) { setProfile({ code: code, num: num, nick: r2.nick || nick, name: cleanText(r2.name, 20), tok: '' }); note = '저장 기능은 아직 준비 중이에요. 기록은 이 컴퓨터에 남아요.'; ui.editing = false; startTimer(); flush(true); render(); }
            else msg.textContent = r2.msg || '참여하지 못했어요. 반 코드를 다시 확인해 주세요.';
          });
        } else {
          msg.textContent = res.msg || '참여하지 못했어요. 반 코드를 다시 확인해 주세요.';
          if (res.error === 'pin' || res.error === 'locked') { inPin.value = ''; try { inPin.focus(); } catch (e) {} }
        }
      });
      return false;
    };

    // 주소에 ?class=ABCDE 가 있으면 반 코드를 미리 넣어 줘요
    try {
      var m = /[?&]class=([A-Za-z0-9]{5})(?:&|$)/.exec(location.search);
      if (m) {
        var c = m[1].toUpperCase();
        if (!profile || profile.code !== c) { inCode.value = c; ui.editing = true; }
      }
    } catch (e) {}
    render();
  }

  function render() {
    if (!ui) return;
    var on = !!profile;
    ui.openBtn.style.display = !on && !ui.editing ? '' : 'none';
    ui.form.style.display = ui.editing ? '' : 'none';
    ui.joined.style.display = on && !ui.editing ? '' : 'none';
    ui.leaveBtn.style.display = on ? '' : 'none';
    ui.joined.textContent = '';
    if (on) {
      ui.joined.appendChild(document.createTextNode('🏫 '));
      var b = el('b', '', (profile.name ? profile.name + ' ' : '') + profile.num + '번 ' + profile.nick);
      ui.joined.appendChild(b);
      ui.joined.appendChild(document.createTextNode(josa(profile.nick) + ' 참여 중 · '));
      var ch = el('button', 'net-link', '바꾸기'); ch.type = 'button';
      ch.onclick = function () {
        ui.editing = true; ui.msg.textContent = '';
        ui.inCode.value = profile.code; ui.inNum.value = profile.num; ui.inNick.value = profile.nick;
        render();
      };
      ui.joined.appendChild(ch);
      if (!note && !profile.tok) note = NOTE_NOPIN;
      if (note) ui.joined.appendChild(el('div', 'net-note', note));
      else if (profile.tok) ui.joined.appendChild(el('div', 'net-note', '☁️ 자동으로 저장돼요.'));
    } else if (note && !ui.editing) {
      ui.openBtn.textContent = '🏫 우리 반으로 참여하기 (선택) · ' + note;
    } else {
      ui.openBtn.textContent = '🏫 우리 반으로 참여하기 (선택)';
    }
  }

  // ------------------------------------------------------------ 시작
  function init(opts) {
    try {
      if (inited) return;
      inited = true;
      if (opts && /^L\d{1,2}$/i.test(String(opts.lesson || ''))) lesson = String(opts.lesson).toUpperCase();
      if (!endpoint) return;
      profile = loadProfile();
      var q = lsGet(QUEUE_KEY);
      queue = Array.isArray(q) ? q.filter(function (x) { return x && x.e && x.c && x.l; }) : [];

      var ready = function () { try { buildUI(); } catch (e) {} };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') { beaconFlush(); beaconSave(); } else flush(true);
      });
      window.addEventListener('pagehide', function () { beaconFlush(); beaconSave(); });
      window.addEventListener('online', function () { flush(true); });

      if (profile) {
        // 반이 아직 있는지 조용히 확인해요 (이 단원 참여도 같이 알려요)
        var p = profile;
        join(p.code, p.num, p.nick, function (res) {
          if (res.ok) {
            if (res.name && profile === p) { p.name = cleanText(res.name, 20); lsSet(PROFILE_KEY, p); render(); }
            if (note && note.indexOf('☁️') !== 0 && note !== NOTE_REAUTH) { note = ''; render(); }
          } else if (res.error === 'noclass' && profile === p) {
            setProfile(null); note = '반이 없어져서 혼자 하기로 바뀌었어요.'; render();
          } else if (res.error === 'closed' && profile === p) {
            note = '반이 닫혀 있어서 기록은 보내지 않아요.'; render();
          }
        });
      }
      if (profile && profile.tok) {
        var p2 = profile;
        post({ action: 'load', code: p2.code, num: p2.num, token: p2.tok }).then(function (res) {
          if (profile !== p2) return;
          if (res.ok) {
            var owner = lsRaw(OWNER_KEY), me = p2.code + '|' + p2.num;
            var changed = syncWith(res.save || null, owner && owner !== me ? 'server' : 'merge');
            var once = false; try { once = !sessionStorage.getItem('english3d_reloaded'); } catch (e) {}
            if (changed && titleShowing() && once) { try { sessionStorage.setItem('english3d_reloaded', '1'); sessionStorage.setItem('english3d_synced', '다른 곳에서 하던 기록을 불러왔어요!'); } catch (e) {} window.__e3dReloading = true; location.reload(); }
          } else if (res.error === 'auth') { p2.tok = ''; lsSet(PROFILE_KEY, p2); note = NOTE_REAUTH; render(); }
        });
        startSaveTimer();
      }
      try { var sm = sessionStorage.getItem('english3d_synced'); if (sm) { sessionStorage.removeItem('english3d_synced'); note = '☁️ ' + sm; setTimeout(render, 0); } } catch (e) {}
      if (queue.length || profile) { startTimer(); setTimeout(function () { flush(true); }, 1500); }
    } catch (e) {}
  }

  window.NET = {
    init: init,
    track: track,
    flush: function () { flush(true); },
    enabled: function () { return !!endpoint; },
    joined: function () { return !!(endpoint && profile); },
    profile: function () { return profile ? { code: profile.code, num: profile.num, nick: profile.nick, name: profile.name || '' } : null; },
    pending: function () { return queue.length; },
    saving: function () { return !!(endpoint && profile && profile.tok); },
    saveNow: function () { pushSave(true); }
  };
})();
