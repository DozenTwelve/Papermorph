/* sample.js — the kit's sample scene (books/cwtfigo-shorts/KIT.md): the opener over a moving wide of the garage, a
   single of Claude, the terminal, the notebook, then the end card. Wordless beats ({ dur }), so it plays before any
   voice exists; an episode's scenes time the same calls to their clips with clipAt() and talk(). */
'use strict';
function sampleHook(p, D) {
  const st = garageStage(p);
  const term = termScreen(p, [{ at: 4.6, kind: 'cmd', text: 'cw status' }, { at: 5.1, kind: 'ok', text: 'OK   martin-laptop: 3 visits, 0 open' }]);
  const book = notebook(p, { left: [{ date: '11-08', text: 'martin-laptop: omarchy update, networkd → NetworkManager', at: 6.2 }],
    right: [{ date: '11-10', text: 'same again.', at: 6.6, ink: NOTE_RED }] });
  const shots = [{ ...shot(0, 'wide'), view: { ...WIDE, z: WIDE.z } }, shot(2.8, 'single', 'claude'), shot(4.5, 'screen', null, { over: 'term' }),
    shot(6, 'insert', null, { over: 'book' })];
  st.cam.to({ z: WIDE.z * 1.12 }, 0, 2.8);   // the first picture is already moving under the hook
  const S = shooter(st, shots, { term: term.g, book: book.g });
  const open = cwOpener(p, 'hook', ['SAME BUG', 'SECOND TIME']);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'term') term.draw(q);
    if (cur.over === 'book') book.draw(q);
    st.frame(q, f, { door: 1, lap: { open: true, screen: 'term' } });
    castPose(st, cur, f, {
      doc: { x: PLACE.doc[0], y: PLACE.doc[1], look: .4, eyeX: .8, shut: blinkAt(q, 1) },
      martin: { x: PLACE.martin[0], y: PLACE.martin[1], brow: 1, mouth: 'wobble', bob: 6 * Math.abs(Math.sin(q * 7)), shut: blinkAt(q, 2) },
      claude: { x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S, lids: .42, spin: q * 60, mouth: 0, shut: blinkAt(q, 3) },
    });
    open.draw(q);
  });
}
function sampleEnd(p, D) { const e = cwEnd(p); stopClock(D, (q, f) => e.draw(q, f)); }
