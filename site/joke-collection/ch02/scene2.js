/* scene2.js — the currency exchange. Clerk close-up (thought bubble "$ → ¥ ?", then 「両替はしておりません。」and a small bow),
   wide: Amy fishes out her card, Amy close-up: "I'd like to pay by credit card.", clerk close-up lights up (「あ、はい！」),
   wide: Amy taps the card reader (card), the clerk bows deeply (「ありがとうございました！」). Ends on the shop wide scene 3 opens on. */
'use strict';
const PRE2 = 1;   // the clerk's blank stare before her thought; the s06 hole follows

const S2 = { A6: clipAt('scene2', PRE2, 's06'), A7: clipAt('scene2', PRE2, 's07'), A8: clipAt('scene2', PRE2, 's08'), A9: clipAt('scene2', PRE2, 's09') };
Object.assign(S2, {
  bub0: 1.5, bub1: 3.05,                         // the thought bubble is up (the camera tilts up to it)
  bow0: S2.A6 + 3.9,                             // the small bow ends s06
  toWide: S2.A6 + 4.75, toAmy: S2.A7 + 1,        // cut to the wide in the s07 hole; Amy close-up as she starts to speak
  toClerk: S2.A7 + 3.35, toWide2: S2.A8 + 1.5,   // 0.5 s after Amy; wide after the clerk has pointed
  step: S2.A8 + 1.55, tap: S2.A9 + .05,          // Amy steps right; card touches the reader
  bow1: S2.A9 + 2.1,                             // the deep bow, down as the voice starts
});
sfx('scene2', S2.tap, 'card');

// A value that eases through [time, value] keys.
function s2k(q, pts) {
  if (q <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (q < pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * ease((q - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  return pts[pts.length - 1][1];
}

function scene2(p, D) {
  const S = shopSet(p), T = S2, cam = S.cam;
  const bub = bubble(cam.stage, { fx: bubbleText('$ → ¥ ?', 50) });
  const CLERK_UP = { x: 1330, y: 335, z: 2.2 };   // tilted up to give the bubble room
  // 6 clerk close-up (tilts up to the bubble and back)   7 wide, then Amy close-up   8 clerk close-up   9 wide to the end
  cam.cut(CU.clerk, 0).soft(0, true).to(CLERK_UP, T.bub0 - .2, .5).to(CU.clerk, T.bub1 - .1, .35)
    .cut(SHOP_WIDE, T.toWide).soft(T.toWide, false)
    .cut(CU.amy, T.toAmy).soft(T.toAmy, true)
    .cut(CU.clerk, T.toClerk)
    .cut(SHOP_WIDE, T.toWide2).soft(T.toWide2, false);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    vis(S.on.drink, true); tf(S.on.drink, `translate(${SHOP.drink},${SHOP.top})`);
    const say6 = between(q, T.A6 + 2.2, T.A6 + 4.3), say7 = between(q, T.A7 + 1, T.A7 + 3), say8 = between(q, T.A8, T.A8 + 1.3), say9 = between(q, T.A9 + 2.2, T.A9 + 4.1);

    /* ---- clerk ---- */
    const up = between(q, T.bub0 + .15, T.bub1);    // eyes on her own thought
    const lit = q >= T.A8 - .4;                      // the penny drops
    const bow0 = s2k(q, [[T.bow0 - .1, 0], [T.bow0 + .3, 1], [T.bow0 + .6, 1], [T.bow0 + 1.0, 0]]);
    const bow1 = s2k(q, [[T.bow1 - .15, 0], [T.bow1 + .3, 1], [T.bow1 + .55, 1], [T.bow1 + 1.0, 0]]);
    const point = s2k(q, [[T.A8 + .15, 0], [T.A8 + .45, 1], [T.toWide2 + .9, 1], [T.toWide2 + 1.4, 0]]);
    let cm = 'A';
    if (say6) cm = lips(q, 'scene2', PRE2, 's06'); else if (say8) cm = lips(q, 'scene2', PRE2, 's08'); else if (say9) cm = lips(q, 'scene2', PRE2, 's09');
    else if (lit) cm = q < T.A8 ? 'grin' : 'smile'; else if (up) cm = 'frown';
    if (say6 && cm === 'X') cm = 'A';
    S.clerk.pose({ ...SHOP.clerk, mouth: cm,
      look: lit ? -.5 : -.3, eyeX: up ? 0 : lit ? -1 : -.6, eyeY: up ? -1 : lit ? -.3 : 0,
      lids: lit ? 0 : .25, shut: bow0 > .5 || bow1 > .5 || blinking(q, [.55, 1.25, 2.45, 6.6, 8.2, 11.9, 13.2, 15.6]),
      brow: lit ? s2k(q, [[T.A8 - .4, -.4], [T.A8 - .1, 0]]) : s2k(q, [[0, 0], [T.bub0, 0], [T.bub0 + .3, -.5], [T.bow0 + .5, -.5], [T.toWide + 1, -.35]]),
      bob: 10 * bow0 + 40 * bow1, headR: 3 * bow0 + 6 * bow1,
      armL: 70 * point }, f);

    /* ---- Amy: empty hands, fishes out her card, holds it up, then taps the reader ---- */
    const walking = between(q, T.step, T.step + .55) || between(q, T.tap + .9, T.tap + 1.25), w = walking ? spWalk(q) : {};
    const fish = between(q, T.toWide + .1, T.toWide + .75);
    const armR = fish ? 18 + 8 * onTwos(q)
      : s2k(q, [[T.toWide + .75, 18], [T.A7 + .1, 105], [T.A7 + 3, 105], [T.A8 + .3, 85], [T.tap - .2, 85], [T.tap, 86], [T.tap + .9, 86], [T.tap + 1.4, 8]]);
    S.amy.pose({ x: s2k(q, [[T.step, SHOP.amy], [T.step + .55, 1116], [T.tap + .9, 1116], [T.tap + 1.25, SHOP.amy]]), y: SHOP.ground, s: SHOP.s,
      ...w, bob: w.bob || 0, legL: w.legL || 0, legR: w.legR || 0,
      look: .6, eyeX: 1, eyeY: fish ? .9 : between(q, T.tap, T.tap + .9) ? .5 : 0, headR: fish ? 7 : 0,
      shut: blinking(q, [6.1, 8.1, 10.4, 13.0, 15.4]),
      mouth: say7 ? lips(q, 'scene2', PRE2, 's07') : q > T.tap + 1.4 ? 'smile' : fish ? 'A' : 'X',
      armL: 0, armR: w.armR !== undefined && armR < 20 ? armR : armR,
      hold: q >= T.toWide + .75 && q < T.tap + 1.3 ? 'card' : null }, f);

    /* ---- Me in the queue: blinks, glances between the two, one sip while Amy taps ---- */
    const sip = s2k(q, [[T.tap + .3, 0], [T.tap + .6, 1], [T.tap + 1.2, 1], [T.tap + 1.5, 0]]);
    const toClerk = between(q, T.A7 + 1.4, T.A7 + 2.2) || between(q, T.bow1 - .2, T.bow1 + 1.2);
    S.me.pose({ x: SHOP.me, y: SHOP.ground, s: SHOP.s, hold: 'coffee', armR: 30 + 112 * sip, headR: 6 * sip,
      look: toClerk ? .9 : .4, eyeX: 1, eyeY: sip > .5 ? -.6 : 0, lids: sip > .5 ? .5 : 0,
      mouth: q > T.bow1 + .8 ? 'smile' : 'X', shut: blinking(q, [6.3, 9.0, 11.6, 14.0, 15.8]) }, f);

    /* ---- the thought bubble over the clerk's head ---- */
    bub.pose({ x: 1330, y: 718 - 450 * .9 + 8, s: .8, show: between(q, T.bub0, T.bub1) ? 'fx' : null, pop: Math.min(1, (q - T.bub0) / .17) }, f);
  });
}
