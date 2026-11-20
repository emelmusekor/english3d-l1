// Lesson 10 자동 통과 테스트 (?autotest&stage=0) — 개발용
(async () => {
  const G = window.__game, L = window.LESSON;
  const log = (m) => { document.title = 'T:' + m; (window.__log = window.__log || []).push(m); };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let clicking = true; setInterval(() => G.tick(0.05), 50);
  (async function clicker() {
    while (clicking) {
      if (document.getElementById('dlg').classList.contains('show')) {
        const nx = document.getElementById('dlgNext');
        const r = document.querySelector('.choice[data-r]:not(:disabled)');
        const pool = document.querySelector('.orderPool');
        if (pool && pool.children.length) { const k = document.querySelectorAll('.orderAns .chip').length; const b = pool.querySelector(`[data-i="${k}"]`); if (b) b.click(); }
        else if (r) r.click(); else if (nx.style.display !== 'none') nx.click();
      }
      await wait(60);
    }
  })();
  const go = (x, z) => { G.P.x = x; G.P.z = z; };
  const dlgShown = () => document.getElementById('dlg').classList.contains('show');
  const waitIdle = async () => { for (let i = 0; i < 400; i++) { await wait(100); if (!G.busy && !dlgShown()) return; } log('TIMEOUT idle'); throw new Error('idle'); };
  const talk = async (id) => { const p = G.NPC[id].g.position; const vx = -p.x, vz = 5 - p.z, vl = Math.hypot(vx, vz) || 1; go(p.x + vx / vl * 1.0, p.z + vz / vl * 1.0); await wait(150); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' })); await wait(200); await waitIdle(); };
  try {
    const want = (n) => { if (G.S.stage !== n) throw new Error('stage ' + G.S.stage + ' != ' + n); };
    const pick = async () => { await wait(300); const it = G.items().find(i => i.alive && !i.bonus); go(it.x, it.z + 0.5); await wait(300); await waitIdle(); };
    if (G.S.stage === 0) { await talk('kai'); await pick(); await talk('boy'); await pick(); await pick(); await pick(); await talk('kai'); await wait(400); want(1); log('s1 ok'); }
    if (G.S.stage === 1) { await talk('green'); for (let k = 0; k < 6; k++) await pick(); await talk('green'); await wait(400); want(2); log('s2 ok'); }
    if (G.S.stage === 2) { await talk('host'); await talk('mia'); await talk('tom'); await wait(400); want(3); log('s3 ok'); }
    if (G.S.stage === 3) {
      await talk('green');
      for (let s = 0; s < L.sentences.length; s++) {
        while (G.st.words && G.st.wi < G.st.words.length) {
          const w = G.st.words[G.st.wi]; const it = G.items().find(i => i.alive && i.word === w);
          go(it.x + 0.2, it.z); await wait(200); go(0, 20); await wait(100);
        }
        await waitIdle(); await wait(300);
      }
      await wait(400); want(4); log('s4 ok');
    }
    if (G.S.stage === 4) { await talk('alice'); await talk('rabbit'); await talk('rabbit'); await talk('alice'); await wait(400); want(5); log('s5 ok'); }
    if (G.S.stage === 5) {
      await talk('hana'); await wait(300);
      document.getElementById('wName').value = 'Stacy'; document.getElementById('wMe').value = 'Minsu';
      ['chk1', 'chk2', 'chk3'].forEach(i => document.getElementById(i).checked = true);
      document.getElementById('wDone').click(); await wait(1500);
      log('s6 ok end=' + document.getElementById('end').classList.contains('show'));
    }
    log('DONE stage=' + G.S.stage + ' stars=' + G.S.stars + ' correct=' + G.S.correct + '/' + G.S.tries + ' err=' + document.getElementById('err').textContent + ' | ' + (window.__log || []).join(','));
  } catch (e) { log('FAIL ' + e.message + ' obj=' + document.getElementById('objText').textContent + ' items=' + G.items().length + ' | ' + (window.__log || []).join(',') + ' err=' + document.getElementById('err').textContent); }
  clicking = false;
})();
