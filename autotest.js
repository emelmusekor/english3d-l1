// 자동 통과 테스트 (?autotest&stage=0) — 개발용
(async () => {
  const G = window.__game, log = (m) => { document.title = 'T:' + m; console.log(m); (window.__log = window.__log || []).push(m); };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let clicking = true; setInterval(() => G.tick(0.05), 50);
  (async function clicker() {
    while (clicking) {
      const dlg = document.getElementById('dlg');
      if (dlg.classList.contains('show')) {
        const nx = document.getElementById('dlgNext');
        const r = document.querySelector('.choice[data-r]:not(:disabled)');
        const ord = [...document.querySelectorAll('.orderPool .choice')].sort((a, b) => a.dataset.i - b.dataset.i)[0];
        if (r) r.click(); else if (ord) ord.click(); else if (nx.style.display !== 'none') nx.click();
      }
      await wait(60);
    }
  })();
  const go = (x, z) => { G.P.x = x; G.P.z = z; };
  const talk = async (id) => { const p = G.NPC[id].g.position; go(p.x, p.z + 1.2); await wait(150); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' })); await waitIdle(); };
  const waitIdle = async () => { for (let i = 0; i < 400; i++) { await wait(100); if (!G.busy && !document.getElementById('dlg').classList.contains('show')) return; } log('TIMEOUT idle'); };
  const room = async (gr) => { const r = G.roomInfo[gr]; go(0, -26); await wait(150); go(r.cx, -34); await wait(300); await waitIdle(); };
  const booth = async (id) => { const b = G.boothInfo[id]; go(0, b.z); await wait(150); go(b.cx, b.z); await wait(300); };
  try {
    log('stage ' + G.S.stage);
    if (G.S.stage === 0) { await talk('kai'); await room('fourth'); await room('second'); await wait(500); log('after s1 stage=' + G.S.stage); }
    if (G.S.stage === 1) {
      await talk('white');
      for (const s of window.LESSON.students) { await talk(s.id); await room(s.grade === 'first' ? 'sixth' : s.grade); if (s.grade === 'first') await room('first'); }
      await talk('white'); await wait(500); log('after s2 stage=' + G.S.stage);
    }
    if (G.S.stage === 2) {
      await talk('hajun');
      for (let k = 0; k < 6; k++) {
        const it = G.items().find(i => !i.bonus && i.alive); go(it.x, it.z); await wait(250);
        await booth(G.held.club === 'book' ? 'cooking' : G.held.club); if (G.held) await booth(G.held.club);
      }
      await talk('joel'); await wait(500); log('after s3 stage=' + G.S.stage);
    }
    if (G.S.stage === 3) {
      await talk('white');
      for (let s = 0; s < 4; s++) {
        while (G.st.words && G.st.wi < G.st.words.length) {
          const w = G.st.words[G.st.wi]; const it = G.items().find(i => i.alive && i.word === w);
          go(it.x + 0.2, it.z); await wait(200); go(0, 20); await wait(100);
        }
        await waitIdle(); await wait(300);
      }
      await wait(500); log('after s4 stage=' + G.S.stage);
    }
    if (G.S.stage === 4) {
      for (const id of ['miso', 'julia', 'kamal']) await talk(id);
      await talk('miso'); await wait(500); log('after s5 stage=' + G.S.stage);
    }
    if (G.S.stage === 5) {
      await talk('jiho'); await wait(300);
      document.getElementById('wName').value = 'Minsu';
      ['chk1', 'chk2', 'chk3'].forEach(i => document.getElementById(i).checked = true);
      document.getElementById('wDone').click(); await wait(1500);
      log('after s6 stage=' + G.S.stage + ' end=' + document.getElementById('end').classList.contains('show'));
    }
    log('DONE stars=' + G.S.stars + ' correct=' + G.S.correct + '/' + G.S.tries + ' err=' + document.getElementById('err').textContent);
  } catch (e) { log('FAIL ' + e.message + ' ' + e.stack); }
  clicking = false;
})();
