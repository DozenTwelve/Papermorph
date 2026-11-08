/* scene8.js — Tag. Only Doc and Claude are left. Doc sidles up beside Claude (wide), whispers the question (close),
   the sign snaps up before he finishes (Claude's single), "NO." (a tighter close), black. */
'use strict';
const PRE8 = 1.9;
const DOC_TAG = [835, 836];
function scene8(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene8', PRE8, c, t);
  const black = blackOverlay(p);
  const snap = at('d04') + .12, v = singleView('doc', { x: DOC_TAG[0], y: DOC_TAG[1], close: true });
  const shots = [shot(0, 'wide'), shot(at('d03', -.1), 'close', 'doc', { x: DOC_TAG[0], y: DOC_TAG[1] }), shot(at('d04') - .02, 'single', 'claude'),
    { ...shot(at('d04', 1.1) - .08, 'close', 'doc'), view: { ...v, z: v.z * 1.15, y: v.y + 18 } }, shot(PRE8 + D - .45, 'black')];
  const S = shooter(st, shots, { black });
  stingAt('scene8');
  sfx('scene8', 0, 'rain', .2, { loop: true }); sfx('scene8', 0, 'hum', .3, { loop: true });
  sfx('scene8', snap - .05, 'whoosh', 1); sfx('scene8', snap + .1, 'flap', 1.5);
  stopClock(D, (q, f) => {
    const cur = S(q);
    const dt = talk(q, 'scene8', PRE8, 'd03', 'd04');
    const u = span(q, .2, 1.7);
    const doc = { x: PLACE.doc[0] + (DOC_TAG[0] - PLACE.doc[0]) * u, y: DOC_TAG[1], bob: u > 0 && u < 1 ? 7 * Math.abs(Math.sin(q * 10)) : 0,
      look: .7, eyeX: 1, eyeY: q < at('d03') ? 0 : .1, lids: q < at('d04') ? .35 : 0, lean: 5 * u, mouth: dt,
      brow: q >= at('d04') ? -1.2 : .3, ...(q >= at('d04', 1.1) - .1 ? { lids: .15, look: 0, eyeX: 0 } : {}), headR: q >= at('d04', 1.1) ? 2 * jit(f, 31) : 0, shut: blinkAt(q, 18),
      ...(q >= at('d04', 1.1) - .1 ? { armL: 30, armR: 30 } : {}) };
    const up = span(q, snap, snap + .1);
    const cl = { x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S, eyeY: q < snap ? .9 : 0, eyeX: q < snap ? -.2 : 0,
      lids: q < snap ? .55 : 0, brow: q < snap ? 0 : .7, mouth: q < snap ? 0 : .15, spin: q * 60, shut: q < snap && blinkAt(q, 19),
      frontL: true, frontR: true, armL: 70, reachL: .8, holdL: { name: 'notebook', w: 240, upright: true, r: -8 },
      armR: 20 + 85 * up, hold: up > 0 ? SIGN('Mind if I look?\n[y/n]') : null };
    st.frame(q, f, { door: 0, ledsOk: true, lap: null, plug: { at: [905, 830] } });
    castPose(st, cur, f, { doc, martin: null, claude: cl });
    st.fxHTML = '';
  });
}
function endScene(p, D) { const e = cwEndCard(p); stopClock(D, (q, f) => e.draw(q, f)); }
