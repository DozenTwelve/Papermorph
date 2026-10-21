/* scene5.js — "Vaca. Cow. Not baka." A held silence on the wide, then the narrator counts it out on Luna's close-up
   (s06): she comes up from the grass, chews, and dips her head once — agreeing. Yui bursts out laughing in p4's hole;
   at the worst moment Luna swings her head up and MOOS; Pedro takes it as a second opinion — ¿Ves? Está de acuerdo. */
'use strict';
const PRE5 = 1.0, S5 = TIMINGS.scene5;
const N5 = { v1: PRE5 + S5.marks['s06.v1'], c1: PRE5 + S5.marks['s06.c1'], b1: PRE5 + S5.marks['s06.b1'],
  laugh: PRE5 + S5.parts.s06 + 4.2, moo: PRE5 + S5.parts.p4 + .55, sp4: PRE5 + S5.parts.p4 + 1.92 };

sfx('scene5', N5.moo, 'moo', .9);

function scene5(p, D) {
  const R = pastSet(p), cam = R.cam;
  // 5.1 wide (the held silence)  5.2 Luna close for the counting  5.3 Yui's laugh  5.4 Luna moos  5.5 Pedro beams
  cam.cut(BK.pastView, 0).cut(BK.cowCU, N5.v1 - .25).soft(N5.v1 - .25, true)
    .cut(BK.yuiCU, N5.laugh).soft(N5.laugh, true).cut(BK.cowCU, N5.moo - .05)
    .cut(BK.pedroCU, N5.sp4 - .2).soft(N5.sp4 - .2, true);
  const b = (q, ...t) => blinking(q, t);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const hold = q < N5.laugh, laughing = between(q, N5.laugh, N5.moo - .05);
    const verdict = q >= N5.sp4 - .2;

    /* --- Pedro: still and pleased through the naming; then the proud dad's verdict --- */
    const beam = span(q, N5.sp4 + .1, N5.sp4 + .7);
    const pedro = { x: BK.PAST.pedro, y: BK.GROUND, s: .92, look: 0, eyeX: 0,
      mouth: verdict ? (lips(q, 'scene5', PRE5, 'p4') !== 'X' ? lips(q, 'scene5', PRE5, 'p4') : 'grin')
        : laughing ? 'grin' : 'smile',
      armR: 24 + 70 * beam, armL: 24 + 40 * beam, headR: 2 + 4 * beam,
      bob: -3 * beam, brow: -.25 * beam, shut: b(q, 1.5, 5.6, 9.4) };

    /* --- Yui: breath held through the counting, then the laugh bursts out of her --- */
    const burst = span(q, N5.laugh + .1, N5.laugh + .4) * (1 - span(q, N5.moo - .25, N5.moo + .1));
    const yui = { x: BK.PAST.yui, y: BK.GROUND, s: .95, look: 0, eyeX: 0, eyeY: 0,
      mouth: burst > .3 ? (onTwos(q) > 0 ? 'D' : 'C') : hold ? 'X' : 'grin',
      headR: -7 * burst + 2 * onTwos(q) * burst, bob: -8 * Math.abs(Math.sin(q * 7)) * burst,
      squash: .05 * Math.abs(Math.sin(q * 7)) * burst,
      shut: burst > .3, lids: burst > .3 ? 0 : hold ? .2 : 0, brow: burst > .3 ? -.4 : hold ? -.25 : 0 };

    /* --- me: frozen with the rest of them, then a slow relief smile --- */
    const me = { x: BK.PAST.me, y: BK.GROUND, s: .92, look: -.2, eyeX: -.4,
      mouth: q > N5.b1 ? 'smile' : 'flat', brow: 0, shut: b(q, 2.0, 8.2) };

    /* --- Luna: up from the grass to be counted; dips a nod; moos at the worst moment --- */
    const up = span(q, .3, N5.v1 - .1) * .85, dip = span(q, N5.b1 + .1, N5.b1 + .8) * .5;
    const moo = between(q, N5.moo - .1, N5.moo + 1.35);
    const cow = { x: BK.PAST.cow.x, y: BK.PAST.cow.y, s: BK.PAST.cow.s, dir: -1,
      headR: 20 - 26 * up + 6 * dip - 14 * between(q, N5.moo, N5.moo + 1.2),
      jaw: moo ? 1 : .3 + .25 * onTwos(q), eyeX: 1, eyeY: moo ? -.35 : -.15,
      ear: moo ? 16 : 6 * onTwos(q), lids: moo ? .05 : .15, brow: 0,
      tail: 5 * Math.sin(q * .9), shut: false };

    R.pedro.pose(pedro, f); R.me.pose(me, f); R.yui.pose(yui, f); R.cow.pose(cow, f);
  });
}
