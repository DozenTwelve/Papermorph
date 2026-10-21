/* scene2.js — "The queen of the house". Pasture wide: Pedro presents Luna with a grand sweep (p1), Luna lifts her head
   to be admired; the narration gives the one rule (s03) over a cut to his close-up, and on "you never joke about the
   cow" the finger comes up and the moustache goes very serious. */
'use strict';
const PRE2 = 1.0, S2 = TIMINGS.scene2;
const N2 = { look: cueAt('scene2', PRE2, 1), pet: cueAt('scene2', PRE2, 2),
  joke: cueAt('scene2', PRE2, 4) };

function scene2(p, D) {
  const R = pastSet(p), cam = R.cam;
  // 2.1 pasture wide  2.2 Pedro close-up for the serious half of the rule
  cam.cut(BK.pastView, 0).cut(BK.pedroCU, N2.look - .45).soft(N2.look - .45, true);
  const b = (q, ...t) => blinking(q, t);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const cu = q >= N2.look - .45;

    /* --- Pedro, presenting: the sweep on "the queen of the house", then the rule --- */
    const sweep = span(q, PRE2, PRE2 + .9) * (1 - span(q, 3.3, 3.9));
    const wag = q >= N2.joke ? 8 * onTwos(q) : 0;
    const pedro = { x: BK.PAST.pedro, y: BK.GROUND, s: .92,
      look: q < N2.look - .45 ? .8 : 0, eyeX: q < N2.look - .45 ? 1 : 0,
      mouth: lips(q, 'scene2', PRE2, 'p1') !== 'X' ? lips(q, 'scene2', PRE2, 'p1')
        : q >= N2.joke ? 'X' : q >= N2.look - .45 ? 'flat' : 'grin',
      armR: q < N2.look - .45 ? 24 + 88 * sweep : 92 + wag, armL: q >= N2.look - .45 ? 40 : 10,
      brow: q >= N2.joke ? -.55 : 0, headR: 4 + 2 * onTwos(q),
      shut: b(q, 1.7, 6.9, 9.3, 11.2) };

    /* --- the kids watching --- */
    const me = { x: BK.PAST.me, y: BK.GROUND, s: .92, look: -.7, eyeX: -1, mouth: 'flat',
      brow: q > N2.joke ? .25 : 0, shut: b(q, 2.6, 8.4) };
    const yui = { x: BK.PAST.yui, y: BK.GROUND, s: .95, look: -.85, eyeX: -1, mouth: 'flat',
      eyeY: q > N2.look ? -.15 : 0, shut: b(q, 1.2, 7.9, 11.6) };

    /* --- Luna: grazing, but she raises her head to be presented (on "reina") --- */
    const up = span(q, 2.5, 3.9) * .8 + span(q, 5.6, 7.2) * .2;
    const cow = { x: BK.PAST.cow.x, y: BK.PAST.cow.y, s: BK.PAST.cow.s, dir: -1,
      headR: 22 - 26 * up, jaw: q > 2.5 ? .3 + .2 * onTwos(q) : .25 + .15 * onTwos(q * 2),
      eyeX: up > .5 ? 1 : 0, eyeY: 0, ear: up > .5 ? 10 : 0, brow: 0,
      tail: 4 * Math.sin(q * .9), shut: false, lids: 0 };

    R.pedro.pose(pedro, f); R.me.pose(me, f); R.yui.pose(yui, f); R.cow.pose(cow, f);
  });
}
