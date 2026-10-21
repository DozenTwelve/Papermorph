/* scene4.js — "The whisper". Yui tiptoes to Luna and whispers into the great ear (がんばって); Luna dips her head to
   listen. Pedro, watching from the side, lights up — ¡Eso es! ¡La vaca! — and Yui turns to the cow and bows an apology
   (ごめんなさい); Luna softens. All on one wide of Luna's end of the pasture. */
'use strict';
const PRE4 = 1.0, S4 = TIMINGS.scene4;
const N4 = { p3: PRE4 + S4.parts.p3, sp3: PRE4 + S4.parts.p3 + .75, y2: PRE4 + S4.parts.y2 };

function scene4(p, D) {
  const R = pastSet(p), cam = R.cam;
  cam.cut(BK.pastLuna, 0).soft(N4.p3, false).cut(BK.pedroCU, N4.p3).soft(N4.p3, true)
    .cut(BK.pastLuna, N4.y2 - .5).soft(N4.y2 - .5, true);
  const b = (q, ...t) => blinking(q, t);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const onPedro = q >= N4.p3 && q < N4.y2 - .5;

    /* --- Yui: three steps to the great ear, the lean, the whisper; then the bow of apology --- */
    const step = q < N4.p3, bow = span(q, N4.y2 + .1, N4.y2 + .8);
    const yui = { x: 830 + 115 * span(q, .2, 1.0), y: BK.GROUND, s: .95,
      look: 0, eyeX: 0, eyeY: 0, mouth: 'X', brow: 0, lids: .2,
      headR: 0, bob: 0, squash: 0, armR: 0,
      shut: b(q, 1.5, 5.4, 8.9) };
    if (q < 1.0) Object.assign(yui, spWalk(q, 2.6), { armL: 4, armR: -6 });
    if (q >= 1.0 && step) {   // the lean in: hand up by her own mouth, head tipped to the ear
      const lean = span(q, 1.0, 1.5);
      Object.assign(yui, { look: 0, eyeX: 0, eyeY: -0.2, headR: 10 * lean, bob: -3 * lean, squash: .04 * lean,
        armR: 118 * lean, brow: .25 * lean, lids: .35 * lean,
        mouth: lips(q, 'scene4', PRE4, 'y1') });
    }
    if (q >= N4.sp3 - .2 && !bow) Object.assign(yui, { headR: 2, armR: 0, mouth: 'X', lids: .25, brow: 0 });   // straightens to watch Pedro's reaction
    if (bow) {   // the apology bow, all the way down
      Object.assign(yui, { look: 0, eyeX: 0, headR: 16 * bow, bob: 9 * bow, squash: .13 * bow,
        brow: .5 * bow, lids: .6 * bow, mouth: lips(q, 'scene4', PRE4, 'y2'), armR: 0 });
    }

    /* --- Pedro: beams over his cow's cleverness --- */
    const beam = span(q, N4.p3, N4.p3 + .7), punch = span(q, N4.sp3 + 1.9, N4.sp3 + 2.2) * (1 - span(q, N4.sp3 + 3.4, N4.sp3 + 3.9));
    const pedro = { x: BK.PAST.pedro, y: BK.GROUND, s: .92,
      look: 0, eyeX: 0, mouth: 'grin',
      armR: 60 + 38 * beam + 14 * punch, armL: 20, headR: 3 + 3 * onTwos(q), brow: -.2,
      bob: -4 * punch, shut: b(q, 4.4, 6.9) };
    if (q >= N4.sp3 - .1) pedro.mouth = lips(q, 'scene4', PRE4, 'p3');

    /* --- me, at the frame's left edge: watching, charmed --- */
    const me = { x: BK.PAST.me, y: BK.GROUND, s: .92, look: .6, eyeX: 1, mouth: between(q, 1, N4.p3) ? 'X' : 'smile',
      brow: .1, armR: 0, shut: b(q, 2.1, 7.6) };

    /* --- Luna dips her head to listen, then softens at the apology --- */
    const dip = span(q, 1.0, 1.9), soft = span(q, N4.y2 - .4, N4.y2 + .8);
    const cow = { x: BK.PAST.cow.x, y: BK.PAST.cow.y, s: BK.PAST.cow.s, dir: -1,
      headR: -4 + 6 * dip - 4 * soft, jaw: .25, eyeX: 1, eyeY: -1 * dip,
      ear: dip > .6 ? 12 : 0, lids: soft > .5 ? .3 : 0, brow: 0,
      tail: 3 * Math.sin(q * 1.1), shut: false };

    R.yui.pose(yui, f); R.me.pose(me, f); R.pedro.pose(pedro, f); R.cow.pose(cow, f);
  });
}
