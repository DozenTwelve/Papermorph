/* scene3.js — "The collision". Pedro raves the cow's praises (p2); praised, Yui starts the polite bow — and freezes
   mid-bow as the thought bubble pops above her with バカ (the hole at the top of s04). The narration explains
   baka/vaca over her close-up, the word pulsing on each name. s05 pulls back: Pedro, prouder than ever, has no idea;
   Yui stays rigid; me glances between them, and on "Three times." he covers his face. */
'use strict';
const PRE3 = 1.0, S3 = TIMINGS.scene3;
const N3 = { cut: PRE3 + S3.parts.s04 - .35, bub: PRE3 + S3.parts.s04 + 1.55,
  ba1: PRE3 + S3.marks['s04.ba1'], va1: PRE3 + S3.marks['s04.va1'],
  s05: PRE3 + S3.parts.s05, th1: PRE3 + S3.marks['s05.th1'] };
sfx('scene3', N3.bub, 'chime', .35);

function scene3(p, D) {
  const R = pastSet(p), cam = R.cam;
  const bub = bkBubble(cam.stage);
  // 3.1 pasture wide (Pedro raving)  3.2 Yui close-up (the freeze + bubble)  3.3 tight trio
  cam.cut(BK.pastView, 0).cut(BK.yuiCU, N3.cut).soft(N3.cut, true).cut(BK.pastTrio, N3.s05 - .15);
  const b = (q, ...t) => blinking(q, t);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const cu = q >= N3.cut && q < N3.s05 - .15;

    /* --- Pedro: proud raving, oblivious the whole way through --- */
    const wide = !cu && q < N3.s05 - .15;
    const rave = span(q, PRE3, PRE3 + 1.0);
    const pedro = { x: BK.PAST.pedro, y: BK.GROUND, s: .92,
      look: wide ? 0 : -.6, eyeX: wide ? 0 : -1,
      mouth: lips(q, 'scene3', PRE3, 'p2') !== 'X' ? lips(q, 'scene3', PRE3, 'p2') : 'grin',   // he raves happily even when it is narration
      armL: wide ? 55 + 45 * rave : 25, armR: wide ? 55 + 50 * rave : 25 + 8 * onTwos(q),
      headR: 3 + (q >= N3.s05 ? 5 * onTwos(q) : 2 * onTwos(q)), bob: wide ? -3 * rave : 0,
      shut: b(q, 1.6, 6.2, 12.4) };

    /* --- Yui: polite bow at the praise, frozen mid-bow by what she thinks she heard --- */
    const bow = span(q, 2.9, 3.6) * (q < N3.s05 ? .8 : .25);
    const cringe = between(q, N3.ba1 - .05, N3.ba1 + .5);
    const yui = { x: BK.PAST.yui, y: BK.GROUND, s: .95,
      look: q < N3.cut ? -.6 : 0, eyeX: q < N3.cut ? -1 : 0,
      mouth: 'X', brow: q < N3.cut ? 0 : q < N3.s05 ? -.45 : .3,
      lids: q < N3.cut ? 0 : cringe ? 1 : .15,      // frozen wide-eyed, then a cringe on "stupid"
      headR: 14 * bow, bob: 6 * bow, squash: .12 * bow,
      shut: b(q, 1.1) };
    if (q >= N3.s05) { yui.mouth = 'frown'; yui.eyeX = -.6; }   // released but withered

    /* --- me: watching; on "Three times." he covers his face --- */
    const face = span(q, N3.th1, N3.th1 + .5);
    const me = { x: BK.PAST.me, y: BK.GROUND, s: .92,
      look: q < N3.cut ? -.6 : q >= N3.s05 ? -.9 : 0, eyeX: q < N3.cut ? -1 : 0, mouth: 'flat',
      armR: 132 * face, brow: q >= N3.cut ? .3 : 0, headR: -4 * face,
      shut: b(q, 2.2, 9.0, 13.8) };

    /* --- Luna, chewing through all of it --- */
    const cow = { x: BK.PAST.cow.x, y: BK.PAST.cow.y, s: BK.PAST.cow.s, dir: -1,
      headR: -6 + .8 * Math.sin(q * .7), jaw: .3 + .2 * onTwos(q), eyeX: 1,
      tail: 4 * Math.sin(q * .8), ear: 8 * onTwos(q), shut: false, lids: 0 };

    /* --- the bubble: pops above her head, pulses on each name, collapses on the pull-back --- */
    const pk = q < N3.bub ? 0 : q < N3.s05 - .5 ? bkPop(q, N3.bub, .35) * (1 + .1 * span(q, N3.ba1, N3.ba1 + .2) - .1 * span(q, N3.ba1 + .35, N3.ba1 + .6))
      : Math.max(0, 1 - span(q, N3.s05 - .5, N3.s05 - .2));
    if (q < N3.cut + .3) bub.pose({ x: BK.PAST.yui + 120, y: 415, k: 0 }, f);
    else bub.pose({ x: BK.PAST.yui + 120, y: 415, k: pk }, f);

    R.pedro.pose(pedro, f); R.me.pose(me, f); R.yui.pose(yui, f); R.cow.pose(cow, f);
  });
}
