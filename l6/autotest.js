// Lesson 6 자동 통과 테스트 (?autotest&stage=0) — 개발용
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
        if (r) r.click(); else if (nx.style.display !== 'none') nx.click();
      }
      await wait(60);
    }
  })();
  const go = (x, z) => { G.P.x = x; G.P.z = z; };
  const dlgShown = () => document.getElementById('dlg').classList.contains('show');
  const waitIdle = async () => { for (let i = 0; i < 400; i++) { await wait(100); if (!G.busy && !dlgShown()) return; } log('TIMEOUT idle'); throw new Error('idle'); };
  const talk = async (id) => { const p = G.NPC[id].g.position; const vx = -p.x, vz = 5 - p.z, vl = Math.hypot(vx, vz) || 1; go(p.x + vx / vl * 1.0, p.z + vz / vl * 1.0); await wait(150); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' })); await wait(200); await waitIdle(); };
  const pick = async () => { await wait(300); const it = G.items().find(i => i.alive && !i.bonus); if (!it) throw new Error('no item'); go(it.x, it.z + 0.5); await wait(300); await waitIdle(); };
  try {
    const want = (n) => { if (G.S.stage !== n) throw new Error('stage ' + G.S.stage + ' != ' + n); };
    if (G.S.stage === 0) { await talk('rani'); await pick(); await talk('rani'); await talk('olivia'); await pick(); await talk('olivia'); await wait(400); want(1); log('s1 ok'); }
    if (G.S.stage === 1) {
      await talk('guide'); for (const p of L.pockets) await talk(p.id); await talk('guide');
      for (let k = 0; k < 3; k++) {
        await wait(300); const it = G.items().find(i => i.alive && i.word === G.st.target); if (!it) throw new Error('no card ' + k);
        go(it.x, it.z); await wait(300); await waitIdle(); go(-22, -2); await wait(200);
      }
      await wait(400); want(2); log('s2 ok');
    }
    if (G.S.stage === 2) { await talk('kai'); await talk('joel'); await pick(); await talk('rani'); await talk('hajun'); await pick(); await pick(); await talk('nara'); await wait(400); want(3); log('s3 ok'); }
    if (G.S.stage === 3) {
      await talk('guide');
      for (let s = 0; s < L.sentences.length; s++) {
        while (G.st.words && G.st.wi < G.st.words.length) {
          const w = G.st.words[G.st.wi]; const it = G.items().find(i => i.alive && i.word === w);
          go(it.x + 0.2, it.z); await wait(200); go(0, 20); await wait(100);
        }
        await waitIdle(); await wait(300);
      }
      await wait(400); want(4); log('s4 ok');
    }
    if (G.S.stage === 4) { await talk('ella'); await talk('ranger'); await wait(400); want(5); log('s5 ok'); }
    if (G.S.stage === 5) {
      await talk('diego'); await wait(300);
      document.getElementById('wMe').value = 'Minsu'; document.getElementById('wC').value = 2; document.getElementById('writer').dispatchEvent(new Event('change'));
      ['chk1', 'chk2', 'chk3'].forEach(i => document.getElementById(i).checked = true);
      document.getElementById('wDone').click(); await wait(1500);
      log('s6 end=' + document.getElementById('end').classList.contains('show') + ' card=' + (G.S.card ? G.S.card.c : 'none'));
    }
    log('DONE stage=' + G.S.stage + ' stars=' + G.S.stars + ' correct=' + G.S.correct + '/' + G.S.tries + ' err=' + document.getElementById('err').textContent + ' | ' + (window.__log || []).join(','));
  } catch (e) { log('FAIL ' + e.message + ' obj=' + document.getElementById('objText').textContent + ' items=' + G.items().length + ' | ' + (window.__log || []).join(',') + ' err=' + document.getElementById('err').textContent); }
  clicking = false;
})();
