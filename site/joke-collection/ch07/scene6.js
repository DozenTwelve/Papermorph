/* scene6.js — "Mi casa / Mikasa". Dusk at the stable: crickets, lantern light. Pedro herds everyone home (p5) — ¡Vamos,
   mi casa! — pointing at the farmhouse; Yui points back at the BARN with her one fluent word — Mi… baka? (y3). In s07's
   hole Pedro crosses to the barn; on MIKASA (mk1) the letters M I K A S A drop onto the blank board one by one, with
   drips. Nobody corrects him (s08); the cow looks up at her new name and nods; the episode's card. */
'use strict';
const PRE6 = 1.0, S6 = TIMINGS.scene6;
const N6 = { y3: PRE6 + S6.parts.y3, y3sp: PRE6 + S6.parts.y3 + .42, s07: PRE6 + S6.parts.s07,
  sp7: PRE6 + S6.parts.s07 + .85, mk1: PRE6 + S6.marks['s07.mk1'], cue2: cueAt('scene6', PRE6, 3),
  s08: PRE6 + S6.parts.s08, an1: PRE6 + S6.marks['s08.an1'], card: PRE6 + S6.parts.s08 + 3.0 };

const YUI_PT = { x: 720, y: 480, z: 1.7 };   // Yui's pointer + Pedro over her shoulder

sfx('scene6', .4, 'crickets', .22);
sfx('scene6', 8.2, 'crickets', .18);
sfx('scene6', N6.s07 + .4, 'whoosh', .2);     // Pedro crossing to the barn
sfx('scene6', N6.mk1 - .25, 'chime', .2);     // the first letter goes up

function scene6(p, D) {
  const R = stabSet(p), cam = R.cam, card = bkTitleCard(p);
  const L = [...Array(6)].map((_, i) => pieces(R.sign)['l' + i]);
  const LX = i => (i - 2.5) * 58;
  // 6.1 dusk wide  6.2 Yui's pointer  6.3 the board (letters drop)  6.4 back wide (the nod, the card)
  cam.cut(BK.stabView, 0).cut(YUI_PT, N6.y3sp - .5).soft(N6.y3sp - .5, true)
    .cut(BK.stabView, N6.s07 - .1).cut(BK.stabSign, N6.mk1 - .55).soft(N6.mk1 - .55, true)
    .cut(BK.stabView, N6.s08 - .1);
  const b = (q, ...t) => blinking(q, t);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const pt = between(q, N6.y3sp - .5, N6.s07 - .1), painting = between(q, N6.mk1 - .55, N6.s08 - .1);

    /* --- Pedro: ¡Vamos, mi casa! (pointing at the farmhouse); crosses to the barn; paints; steps back proud --- */
    const walkHome = span(q, 1.2, 3.2), walkBarn = span(q, N6.s07, N6.sp7 - .1);
    const px = 560 + 200 * walkHome + 240 * walkBarn - 60 * span(q, N6.cue2 + .5, N6.cue2 + 1.2);
    const pedro = { x: px, y: BK.GROUND, s: .92, look: 0, eyeX: 0, mouth: 'grin', headR: 2,
      armR: 24, armL: 24, brow: 0, shut: b(q, 1.6, 5.2, 9.0, 14.6) };
    if (q < N6.y3) Object.assign(pedro, { mouth: lips(q, 'scene6', PRE6, 'p5') !== 'X' ? lips(q, 'scene6', PRE6, 'p5') : 'grin',
      armL: 88, look: -.6, eyeX: -1, headR: -3 });
    if (between(q, 1.2, 3.2)) Object.assign(pedro, spWalk(q, 2.2), { armL: 90, armR: 8 });
    else if (between(q, N6.s07, N6.sp7 - .1) || between(q, N6.cue2 + .5, N6.cue2 + 1.2))
      Object.assign(pedro, spWalk(q, 2.2));   // leg cycle only inside a translation
    if (q >= N6.y3 && q < N6.s07) {   // listens to Yui: a delighted, very wrong 'O' of realization
      Object.assign(pedro, { look: 1, eyeX: 1, mouth: between(q, N6.y3sp + 1.4, N6.y3sp + 2.1) ? 'O' : 'grin',
        armL: 0, armR: 0, brow: -.1, bob: -2 * onTwos(q) });
    }
    if (q >= N6.s07 && q < N6.s08) {   // to the barn; painting with a steady scrubbing arm
      Object.assign(pedro, { look: 1, eyeX: 1, eyeY: -.5, mouth: 'X', brow: 0,
        armR: painting ? 118 + 5 * onTwos(q) : 70 + 6 * onTwos(q), armL: 0, headR: 0 });
    }
    if (q >= N6.cue2) {   // steps back to admire it, arms wide
      const back = span(q, N6.cue2 + .5, N6.cue2 + 1.1);
      Object.assign(pedro, { mouth: 'grin', armR: 50, armL: 50, headR: 4, eyeY: -.3, look: 0, eyeX: 0,
        bob: -2 * back });
    }

    /* --- Yui: one fluent word, whole confident, at the barn --- */
    const yui = { x: BK.STAB.yui, y: BK.GROUND, s: .95, look: 0, eyeX: 0, mouth: 'X', brow: 0,
      lids: 0, shut: b(q, .9, 4.6, 12.8, 16.2) };
    if (q >= N6.y3 - .4) {   // the finger comes up at the barn
      const up = span(q, N6.y3 - .4, N6.y3 + .1);
      Object.assign(yui, { look: 1, eyeX: 1, armR: 88 * up, headR: 4 * up,
        mouth: lips(q, 'scene6', PRE6, 'y3') !== 'X' ? lips(q, 'scene6', PRE6, 'y3') : 'X',
        brow: .3 * up, lids: .15 * up });
    }
    if (q >= N6.s07 && q < N6.s08) { yui.look = 1; yui.eyeX = 1; yui.armR = 0; }   // watching him paint
    if (q >= N6.s08) {   // the shrug: nobody corrected him
      const shrug = span(q, N6.s08 + .2, N6.s08 + .7);
      Object.assign(yui, { armL: 32 * shrug, armR: 30 * shrug, brow: .4 * shrug, mouth: 'flat',
        headR: -3 * shrug, look: 0, eyeX: 0 });
    }

    /* --- me: trails in behind, watches the naming with his hands in his pockets --- */
    const me = { x: BK.STAB.me, y: BK.GROUND, s: .92, look: .55, eyeX: 1, mouth: 'flat', brow: .1,
      armR: 0, shut: b(q, 2.3, 8.8, 15.4) };
    if (q >= N6.s08) {   // a small hand on Yui's shoulder at "nobody corrected him"
      const pat = span(q, N6.s08 + .5, N6.s08 + 1.0);
      Object.assign(me, { armR: 38 * pat, look: 0, eyeX: 0 });
    }

    /* --- Luna: under the board; at an1 she looks up at her new name and nods — the whole nod (up and return) resolves
       ~135 ms before the card appears at 17.89, so nothing of it plays behind the card --- */
    const lookUp = span(q, N6.an1 - .1, N6.an1 + .6), nod = span(q, N6.an1 + .6, N6.an1 + .95) * (1 - span(q, N6.an1 + 1.05, N6.an1 + 1.25));
    const cow = { x: BK.STAB.cow.x, y: BK.STAB.cow.y, s: BK.STAB.cow.s, dir: -1,
      headR: 14 - 24 * lookUp + 6 * nod, jaw: .25, eyeX: 1, eyeY: -1 * lookUp,
      ear: 14 * lookUp, lids: 0, brow: 0, tail: 4 * Math.sin(q * .8), shut: false };

    /* --- the letters drop one by one onto the board --- */
    L.forEach((el, i) => {
      const t0 = N6.mk1 - .25 + i * .38;
      const k = bkPop(q, t0, .45);
      if (k <= 0) { vis(el, false); return; }
      vis(el, true);
      const r = (i % 2 ? 3 : -2);   // the baked tilt, straightening as the letter settles
      tf(el, `translate(${LX(i)},0) scale(${k.toFixed(3)}) rotate(${(r * (1 - k)).toFixed(2)})`);
    });

    R.pedro.pose(pedro, f); R.me.pose(me, f); R.yui.pose(yui, f); R.cow.pose(cow, f);
    card.on(q >= N6.card);
  });
}
