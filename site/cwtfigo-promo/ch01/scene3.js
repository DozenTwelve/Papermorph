/* scene3.js — Pop. The laptop screen percolates (insert); POOF on the stage: Claude springs out of the laptop small and
   grows to Doc's height as he lands; then his smug single with the cigar, the sign flipped up, and Martin's "…y?". */
'use strict';
const PRE3 = 3.0;
// Claude's sign: the cardboard on its stick, held up beside his head, the words in hand lettering.
const SIGN = (text, size = 62, w = 560) => ({ name: 'sign', w, x: 40, y: -w * .42, upright: true, text, size });
function scene3(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene3', PRE3, c, t);
  const perc = percolating(p);
  const T_POP = 1.25, T_LAND = 2.35;
  const shots = [shot(0, 'insert', null, { over: 'perc' }), shot(1.05, 'wide'), shot(at('c01', -.1), 'single', 'claude'),
    shot(at('m04', -.05), 'single', 'martin')];
  const S = shooter(st, shots, { perc: perc.g });
  stingAt('scene3');
  st.cam.shake(T_POP, .35, 8);
  sfx('scene3', 0, 'whirr', .9); sfx('scene3', T_POP, 'pop', 1.8); sfx('scene3', T_POP + .05, 'whoosh', .8);
  sfx('scene3', T_LAND, 'boing', 1); sfx('scene3', 1.05, 'rain', .3, { loop: true });
  const flip = at('c02', .25);
  sfx('scene3', flip, 'whoosh', .7); sfx('scene3', flip + .18, 'flap', 1.2);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'perc') perc.draw(q);
    st.frame(q, f, { door: 1, lap: null });
    // the spring: out of the laptop on an arc, small to full size, a squash on landing
    const u = span(q, T_POP, T_LAND), air = q >= T_POP;
    const [ox, oy] = [PLACE.martin[0], 720];   // the laptop's screen, in Martin's hands
    const cx = ox + (PLACE.claude[0] - ox) * u;
    const cy = oy + (PLACE.claude[1] - oy) * u - 260 * Math.sin(Math.PI * u);
    const land = q > T_LAND && q < T_LAND + .25 ? .86 : 1;
    const ct = talk(q, 'scene3', PRE3, 'c01', 'c02'), signUp = span(q, flip, flip + .2);
    const polite = q >= flip + .2;
    const claude = air ? { x: cx, y: cy, s: .35 + (CLAUDE_S - .35) * u, squash: land, spin: q * 480, lids: polite ? 0 : .42,
      mouth: ct === 'X' ? 0 : ct, brow: polite ? .7 : 0, cigar: !polite && q > T_LAND, eyeX: polite ? 0 : .2 * Math.sin(q),
      armL: u < 1 ? 120 : 20, armR: u < 1 ? 120 : 20 + 85 * signUp, frontR: signUp > 0,
      hold: signUp > 0 ? SIGN('Mind if I look?\n[y/n]') : null, shut: !polite && blinkAt(q, 7) } : null;
    const startle = span(q, T_POP, T_POP + .2) - span(q, T_LAND + .6, T_LAND + 1.4);
    castPose(st, cur, f, {
      doc: docSolder(st, q, f, { look: .8 * startle, eyeX: startle, eyeY: 1 - startle, lids: .45 * (1 - startle), lean: -7 * startle,
        mouth: startle > .3 ? 'O' : 'X' }, Math.max(startle, span(q, T_LAND + .6, T_LAND + 1)) ),
      martin: { x: PLACE.martin[0], y: PLACE.martin[1], look: .7, eyeX: 1, eyeY: -.3 * startle, brow: 1, lids: 0,
        lean: -9 * startle, mouth: cur.who === 'martin' ? talk(q, 'scene3', PRE3, 'm04') : startle > .3 ? 'O' : 'wobble',
        frontL: true, frontR: true, armL: -18 + 12 * startle, armR: -18 + 12 * startle, reachL: .8, reachR: .8, shut: blinkAt(q, 8),
        chest: { name: 'laptop-open', w: 420, y: -330 - 40 * startle, r: -6 * startle, screen: `<rect x="-152" y="-106" width="304" height="144" fill="#0d1014"/>` } },
      claude,
    });
    // the puff of smoke out of the laptop, then the cigar's own smoke in his single
    const puff = span(q, T_POP, T_POP + .15) * (1 - span(q, T_POP + .5, T_POP + 1.3));
    let fx = '';
    if (puff > 0) fx += `<g transform="translate(${ox} ${oy - 40}) scale(${(.6 + .8 * span(q, T_POP, T_POP + .9)).toFixed(2)})" opacity="${puff.toFixed(2)}">${
      [[-70, 10, 55], [60, 0, 60], [0, -50, 70], [-35, 45, 45], [45, 50, 50]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#efe9de" stroke="${CW_INK}" stroke-width="5"/>`).join('')}</g>`;
    if (claude && claude.cigar) fx += smokeSVG(...emberAt(st, claude), q, 4, 1);
    st.fxHTML = fx;
  });
}
