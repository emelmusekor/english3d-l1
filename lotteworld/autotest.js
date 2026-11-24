// 롯데월드 안전교육 자동 통과 테스트 (?autotest&stage=0) — 개발용
(async () => {
  const G = window.__game;
  const log = (m) => { document.title = 'T:' + m; (window.__log = window.__log || []).push(m); };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let clicking = true; setInterval(() => G.tick(0.05), 50);
  (async function clicker() {
    while (clicking) {
      if (document.getElementById('dlg').classList.contains('show')) {
        const nx = document.getElementById('dlgNext');
        const r = document.querySelector('.choice[data-r]:not(:disabled)');
        if (r) r.click(); else if (nx.style.display !== 'none') nx.click();
      }
      await wait(60);
    }
  })();
  const go = (x, z) => { G.P.x = x; G.P.z = z; };
  const dlgShown = () => document.getElementById('dlg').classList.contains('show');
  const waitIdle = async () => { for (let i = 0; i < 600; i++) { await wait(100); if (!G.busy && !dlgShown()) return; } log('TIMEOUT idle'); throw new Error('idle'); };
  const talk = async (id, dx = 0, dz = 1) => {
    const p = G.NPC[id].g.position; go(p.x + dx, p.z + dz); await wait(200);
    if (!G.NPC[id].talk) throw new Error('no talk: ' + id);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' })); await wait(250); await waitIdle();
  };
  const at = async (x, z) => { // 그 자리의 노란 고리 밟기
    await wait(250); const it = G.items().find(i => i.alive && !i.bonus && Math.hypot(i.x - x, i.z - z) < 0.6); if (!it) throw new Error('no spot at ' + x + ',' + z);
    go(it.x, it.z); await wait(300); await waitIdle();
  };
  const tag = async (t) => { await wait(250); const it = G.items().find(i => i.alive && i.tag === t); if (!it) throw new Error('no item: ' + t); go(it.x, it.z); await wait(300); await waitIdle(); };
  try {
    const want = async (n) => { await wait(500); if (G.S.stage !== n) throw new Error('stage ' + G.S.stage + ' != ' + n); };
    if (G.S.stage === 0) {
      await talk('teacher'); await at(29.9, 38); await at(29.9, 27.5); await at(29.9, 17.3);
      await talk('teacher', 1, -0.4); await at(15.8, 17.2); await tag('bus3').catch(() => {}); await wait(2800); await tag('bus' + (G.S.cls || 1));
      await want(1); log('s1 ok');
    }
    if (G.S.stage === 1) {
      await at(-1.6, 1.3); await tag('hammer'); await tag('ext'); await tag('exit'); await at(-1.6, 1.3);
      await want(2); log('s2 ok');
    }
    if (G.S.stage === 2) {
      await talk('guide', -1, 0); await at(-24.4, -6.1); await talk('teacher'); await at(11, -14.6); await talk('teacher', -1, 0.3);
      await tag('info'); await tag('aid'); await tag('lost'); await talk('teacher', -1, 0.3);
      await want(3); log('s3 ok');
    }
    if (G.S.stage === 3) {
      await talk('cast_fly', -1, 0); await talk('cast_flume', 0, -1); await at(-36.6, -19); await at(-42, -29.9); await talk('cast_gyro', -0.2, 1);
      await want(4); log('s4 ok');
    }
    if (G.S.stage === 4) {
      await tag('foodNo'); await wait(300); await tag('foodOk'); await tag('wash'); await talk('clerk', 0, -1);
      await talk('cast_plaza'); await at(15.8, -16.6); await at(-21.2, -22.2); await tag('lift'); await wait(300); await tag('exit');
      await want(5); log('s5 ok');
    }
    if (G.S.stage === 5) {
      await talk('jiho'); await talk('teacher', -1, 0.3); await at(11, -8.2); await at(-33.4, -6.1); await at(29.9, 38); await talk('teacher', 0, 1);
      await wait(300);
      document.getElementById('wName').value = '김민수';
      ['chk1', 'chk2', 'chk3'].forEach(i => document.getElementById(i).checked = true);
      document.getElementById('wDone').click(); await wait(2500);
      log('s6 end=' + document.getElementById('end').classList.contains('show') + ' card=' + (G.S.card ? G.S.card.p.join('') : 'x'));
    }
    log('DONE stage=' + G.S.stage + ' stars=' + G.S.stars + ' correct=' + G.S.correct + '/' + G.S.tries + ' err=' + document.getElementById('err').textContent + ' | ' + (window.__log || []).join(','));
  } catch (e) { log('FAIL ' + e.message + ' stage=' + G.S.stage + ' obj=' + document.getElementById('objText').textContent + ' items=' + G.items().length + ' | ' + (window.__log || []).join(',') + ' err=' + document.getElementById('err').textContent); }
  clicking = false;
})();
