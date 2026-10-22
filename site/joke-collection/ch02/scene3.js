/* scene3.js — the tip. Amy digs out a 100-yen coin and leaves it on the counter ("And this is for you!"); the clerk
   is frozen (nobody tips in Japan); Me walks up, says in Japanese that she is his friend and is paying for his coffee
   too, puts the coffee on the counter; the clerk is relieved and bows; last wide: Amy waves, Me takes his coffee back.
   The coin stays on the counter (paid); the tea stays too (Amy collects it as they leave; scene 4 opens outside). */
'use strict';
const PRE3 = 0.8;   // the end of scene 2 held a moment, then the hole of s10 (1.25 s) for the pocket dig
const s3v = (clip, t = 0) => clipAt('scene3', PRE3, clip, t);

/* ---------- timeline (beat time, s) ---------- */
const S3 = {
  dig: .9, up: 1.45, put: 1.9, slideEnd: 2.45,                       // Amy: hand in the pocket, coin up, coin on the counter
  coinCU: 4.3, clerkCU: 5.4, wide1: 10.8, clerkCU2: 12.5, amyCU: 14.85, wide2: s3v('s12'),   // s11: coin, clerk, wide, clerk, Amy
  walk0: s3v('s12') + .25, walk1: s3v('s12') + 1.75,                 // Me crosses during the hole of s12
  meCU: s3v('s12', 3.05), meMed: s3v('s12', 6.3),                    // his close-up, then the medium with the counter
  setCoffee: s3v('s12', 7.15), takeBack: 34.35,                       // coffee reaches the counter on コーヒー; he takes it back at the end
  clerkCU3: s3v('s12', 11.6), wide3: s3v('s13', 4.7),                // relief close-up, final wide
  grab: s3v('s13', .65 + 0.6), bow: s3v('s13', .65 + 2.25),
};
sfx('scene3', S3.put, 'coin');
sfx('scene3', s3v('s11'), 'crickets');
sfx('scene3', S3.bow + 1.5, 'beep');

/* ---------- small helpers ---------- */
// Piecewise eased keyframes [[t, v], …].
const s3k = (q, pts) => {
  if (q <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (q < pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * ease((q - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return pts[pts.length - 1][1];
};
// Where somebody is looking: [[t, {look, eyeX, eyeY}], …]; each change takes 0.2 s.
const s3gaze = (q, list) => {
  let i = 0; while (i + 1 < list.length && q >= list[i + 1][0]) i++;
  const a = (list[i - 1] || list[i])[1], b = list[i][1], u = span(q, list[i][0], list[i][0] + .2), o = {};
  for (const k of ['look', 'eyeX', 'eyeY']) o[k] = (a[k] || 0) + ((b[k] || 0) - (a[k] || 0)) * u;
  return o;
};
const s3flick = (q, k, amp = .12) => amp * jit(Math.floor(q * 2.5), k);   // tiny eye moves
const FRONT = {}, TO_COIN = { look: -.2, eyeX: -.5, eyeY: .9 }, TO_AMY = { look: -.6, eyeX: -1 }, TO_ME = { look: -.7, eyeX: -1, eyeY: .1 };
const DOWN_LEFT = { look: -.6, eyeX: -1, eyeY: .85 };   // at the cup and the coin on the counter
const TO_CLERK = { look: .6, eyeX: 1 }, TO_ME_A = { look: -.5, eyeX: -1 }, TO_AMY_M = { look: .5, eyeX: 1 };

function scene3(p, D) {
  const S = shopSet(p), cam = S.cam, ME_MED = { x: 960, y: 560, z: 1.8 }, COIN_CU = { x: 895, y: 540, z: 8 }, TOP_CU = { x: 940, y: 575, z: 3.3 };
  const COF_X = 957, COIN_X = 920;   // Amy's left hand reaches the counter at ~920, just left of where Me's cup goes
  // 10 wide: the dig and the coin   11 the coin alone, then the clerk's close-up, a wide of all three, the clerk again, Amy waiting
  cam.cut(SHOP_WIDE, 0).cut(COIN_CU, S3.coinCU).soft(S3.coinCU, true)
    .cut(CU.clerk, S3.clerkCU).cut(SHOP_WIDE, S3.wide1).soft(S3.wide1, false)
    .cut(CU.clerk, S3.clerkCU2).soft(S3.clerkCU2, true).cut(CU.amy, S3.amyCU)
    // 12 wide: Me walks up   13 Me's close-up, then the medium (counter in view) for the coffee
    .cut(SHOP_WIDE, S3.wide2).soft(S3.wide2, false).cut(CU.meUp, S3.meCU).soft(S3.meCU, true)
    .cut(ME_MED, S3.meMed).soft(S3.meMed, false)
    .cut(TOP_CU, S3.setCoffee + .45).soft(S3.setCoffee + .45, true).cut(ME_MED, S3.setCoffee + 1.5).soft(S3.setCoffee + 1.5, false)   // the cup and the coin side by side
    // 14 clerk, relieved   15 last wide
    .cut(CU.clerk, S3.clerkCU3).soft(S3.clerkCU3, true).cut(SHOP_WIDE, S3.wide3).soft(S3.wide3, false);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const mouth = (rest, ...clips) => { const m = lips(q, 'scene3', PRE3, ...clips); return m === 'X' ? rest : m; };

    /* ---------- Amy ---------- */
    const dig = between(q, S3.dig, S3.up), up = between(q, S3.up, S3.put);
    const lean = s3k(q, [[S3.up, 0], [S3.put, -20], [S3.slideEnd, -20], [S3.slideEnd + .5, 0]]);   // steps toward Me to reach
    let lArm = 0, aArm = 0;   // her screen-left hand does the pocket and the coin
    if (q >= S3.dig) lArm = dig ? 3 + 7 * onTwos(q) : s3k(q, [[S3.up, 5], [S3.up + .25, 50], [S3.put - .1, 62], [S3.put, 77], [S3.slideEnd, 77], [S3.slideEnd + .5, 16]]);
    if (q >= S3.slideEnd + .5) lArm = 16 + 2 * s3flick(q, 3, 1);
    const wave = q >= S3.wide3 + .35 ? 1 : 0;
    if (wave) aArm = s3k(q, [[S3.wide3 + .35, 6], [S3.wide3 + .75, 108]]) + (q > S3.wide3 + .75 ? 18 * onTwos(q) : 0);
    // her gaze: down at the pocket, the clerk, the coin, Me while he walks and talks, the clerk; Me again for the wave
    const aGaze = s3gaze(q, [[0, TO_CLERK], [S3.dig, { look: .2, eyeX: .3, eyeY: .9 }], [S3.up + .3, TO_CLERK], [S3.coinCU + 1, TO_CLERK],
      [S3.wide2 + .8, TO_ME_A], [S3.meCU + 3.6, TO_CLERK], [s3v('s12', 6.2), TO_ME_A], [S3.clerkCU3, TO_CLERK], [S3.wide3, TO_ME_A]]);
    const tidy = q > S3.put + 1.5;
    S.amy.pose({ x: SHOP.amy + lean, y: SHOP.ground, s: SHOP.s, ...aGaze, eyeY: aGaze.eyeY + (q > S3.up + .3 ? s3flick(q, 5) : 0),
      shut: blinking(q, [.35, 3.5, 3.58, 6.9, 11.8, 15.3, 20.6, 25.4, 30.2, 34.0]) && !(q > 3.4 && q < 3.8 && false),
      mouth: q > S3.put && q < s3v('s10', 3.2) ? mouth('smile', 's10') : (q > s3v('s10', 3.2) && q < S3.wide2 ? 'grin' : (q >= S3.wide2 && q < S3.wide3 ? (q > S3.wide2 + .8 ? 'smile' : 'grin') : 'smile')),
      lids: 0, brow: 0,
      headR: dig ? -6 : tidy ? 4 * (q > S3.wide3 ? -1 : 1) * (q < S3.meCU ? 1 : .3) : 0,
      holdL: up ? 'coin' : null, armR: aArm, armL: lArm }, f);

    /* ---------- the coin and the tea on the counter ---------- */
    vis(S.on.coin, q >= S3.put);   // stays there to the end: paid
    tf(S.on.coin, `translate(${(COIN_X + s3k(q, [[S3.put + .05, 0], [S3.slideEnd, 5]])).toFixed(1)},${SHOP.top})`);
    vis(S.on.drink, true); tf(S.on.drink, `translate(${SHOP.drink},${SHOP.top})`);

    /* ---------- Me ---------- */
    const walking = between(q, S3.walk0, S3.walk1);
    const mx = SHOP.me + (SHOP.meUp - SHOP.me) * Math.min(1, Math.max(0, (q - S3.walk0) / (S3.walk1 - S3.walk0)));
    const w = walking ? spWalk(q - S3.walk0) : {};
    const V12 = s3v('s12', 3.05), wd = t => V12 + t;   // word times of s12
    const havePut = q >= S3.setCoffee, haveBack = q >= S3.takeBack + .12;
    const mArm = s3k(q, [
      [0, 30], [S3.walk0 - .2, 30], [11.7, 30], [12.5, 124], [13.5, 124], [14.2, 30],                       // sips once in the queue
      [wd(.4), 30], [wd(.75), 124], [wd(2.0), 128], [wd(2.8), 126], [wd(3.05), 134],                         // points at Amy with the cup
      [S3.setCoffee, 80], [S3.setCoffee + .4, 42], [wd(5.0), 42], [wd(5.3), 48], [wd(5.8), 48], [wd(6.4), 30],                        // sets it down, an open hand
      [wd(6.85), 58], [wd(7.1), 44], [wd(7.35), 58], [wd(7.8), 20], [S3.wide3 + 1.2, 22], [S3.takeBack, 80], [S3.takeBack + .12, 80], [S3.takeBack + .7, 22]]);
    const wob = between(q, wd(6.9), wd(7.5)) ? 8 * onTwos(q) : 0;
    const speaking = q >= V12 && q < V12 + 8.6;
    const meGaze = s3gaze(q, [[0, TO_AMY_M], [S3.walk0, TO_AMY_M], [S3.walk1, TO_AMY_M], [wd(.4), { look: .55, eyeX: 1 }], [wd(1.7), { look: .55, eyeX: 1, eyeY: .1 }],
      [wd(3.2), { look: .1, eyeX: .3, eyeY: .8 }], [wd(4.6), { look: .6, eyeX: 1 }], [wd(5.6), { look: .45, eyeX: 1 }], [wd(6.8), { look: .5, eyeX: .9 }], [S3.wide3, TO_AMY_M]]);
    const nod = between(q, wd(1.35), wd(1.75)) ? 6 : between(q, S3.wide3 + .6, S3.wide3 + 1.0) ? 8 * onTwos(q) : 0;
    S.me.pose({ x: mx, y: SHOP.ground, s: SHOP.s, ...meGaze, ...(walking ? { legL: w.legL, legR: w.legR, bob: w.bob, armL: w.armL } : {}),
      armR: mArm + wob, hold: havePut && !haveBack ? null : 'coffee', headR: nod,
      shut: blinking(q, [1.7, 5.6, 9.9, 13.9, 17.8, 21.6, 25.9, 29.3, 34.9]),
      mouth: speaking ? mouth('smile', 's12') : (q > wd(6.8) ? 'smile' : 'flat'), lids: .12 }, f);
    vis(S.on.coffee, havePut && !haveBack); tf(S.on.coffee, `translate(${COF_X},${SHOP.top})`);

    /* ---------- the clerk ---------- */
    const stun = q >= 4.3 && q < s3v('s12', 8.7);
    const cGaze = s3gaze(q, [[0, TO_AMY], [S3.put + .3, DOWN_LEFT], [6.5, TO_AMY], [7.8, DOWN_LEFT], [9.3, TO_AMY], [10.1, DOWN_LEFT], [12.6, TO_AMY], [13.5, DOWN_LEFT], [14.4, TO_AMY],
      [S3.walk0 + .4, TO_ME], [S3.meCU, TO_ME], [wd(1.6), TO_AMY], [wd(3.3), DOWN_LEFT], [wd(5.0), TO_ME], [wd(6.4), TO_AMY],
      [S3.clerkCU3, TO_ME], [s3v('s13', .55), TO_AMY], [s3v('s13', 1.2), DOWN_LEFT], [S3.bow + 1.4, TO_AMY], [S3.wide3, TO_AMY]]);
    const bowing = between(q, S3.bow, S3.bow + 1.45);
    const bob = s3k(q, [[S3.bow, 0], [S3.bow + .45, 40], [S3.bow + 1.0, 40], [S3.bow + 1.45, 0]]);
    const cMouth = q >= s3v('s13') + .6 && q < s3v('s13', 4.6) ? mouth('grin', 's13')
      : stun ? (between(q, 6.45, 7.0) || between(q, 13.4, 13.9) ? 'O' : 'flat')
      : q >= wd(6.2) ? 'smile' : 'flat';
    S.clerk.pose({ ...SHOP.clerk, ...cGaze, eyeY: (cGaze.eyeY || 0) + (stun ? s3flick(q, 8) : 0), eyeX: (cGaze.eyeX || 0) + (stun ? s3flick(q, 9, .1) : 0),
      shut: bowing || blinking(q, [3.1, 7.2, 8.9, 11.3, 15.1, 20.2, 24.1, 33.4]), bob,
      mouth: cMouth, lids: stun ? .3 : s3k(q, [[wd(6.0), 0], [wd(7.2), .12]]), brow: stun ? -.35 : 0,
      headR: bowing ? 12 * Math.sin(Math.PI * span(q, S3.bow, S3.bow + 1.45)) : stun ? -6 * (between(q, 8.5, 10.8) || between(q, 13.7, 14.8) || between(q, wd(2), wd(4)) ? 1 : 0) : 0,
      armL: 0, armR: 0 }, f);
  });
}
