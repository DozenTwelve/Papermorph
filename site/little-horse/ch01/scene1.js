/* scene1.js — Home (the stable). The valley and the stable; Mother and Little Horse side by side, a foal glued to
   his mother; she asks him to carry the half sack of wheat to the mill, he says yes, she swings the sack onto his
   back with her teeth, and he turns proud to the road. Beat clock = PRE1 + the scene-clip word times. */
'use strict';
const PRE1 = 2.0;
const s1_S = 1.05;                                   // the loose sack, the size of the one drawn on Little Horse's back
const s1_SACK = [688, 780 - 75 * s1_S];             // its tie, sitting on the ground beside the stable door
const s1_LY = 786;                                   // Little Horse stands on the near side of her, a little lower
// A whole-body turn from a to b over four frames, through a thin squash (never quite 0).
const s1_turn = (q, t0, a, b) => { const v = tween(q, t0, 4 / FPS, a, b); return Math.abs(v) < .12 ? .12 * Math.sign(b) : v; };
// A paper bird: two wing positions on twos.
const s1_BIRD = (up) => `<g filter="url(#paper)"><ellipse rx="9" ry="4" fill="#6b5a4a"/><circle cx="8" cy="-2" r="3.6" fill="#6b5a4a"/>
  <path d="${up ? 'M-2,-1 C-8,-16 -18,-20 -26,-18 C-16,-12 -10,-6 -4,0 Z M2,-1 C6,-15 14,-21 22,-20 C14,-12 8,-6 4,0 Z' : 'M-2,0 C-10,6 -18,12 -26,16 C-16,6 -10,2 -4,-1 Z M2,0 C8,6 14,12 22,14 C14,6 8,2 4,-1 Z'}" fill="#5a4a3c"/></g>`;
// Walking along route keys, but after each stop the legs square up one hoof at a time (lifted and set down on its rest
// place) instead of all four sliding back together: the planted hooves stay put.
function s1_walk(q, keys, s) {
  const r = route(q, keys, s);
  let stop = null;
  for (let i = 1; i < keys.length; i++) if (keys[i - 1][1] !== keys[i][1] && q >= keys[i][0]) stop = keys[i][0];
  if (stop === null || q - stop >= .8) return { ...r, legs: {} };
  const g = gait(r.d, 'walk', HORSE_GEO.L, HORSE_GEO.H), legs = {};
  ['nf', 'ff', 'nh', 'fh'].sort((a, b) => g[b][1] - g[a][1] || Math.abs(g[b][0]) - Math.abs(g[a][0])).forEach((k, i) => {
    const t0 = stop + i * .14, u = span(q, t0, t0 + .18), lift = Math.abs(g[k][0]) > 2 || g[k][1] > 0 ? 9 * Math.sin(Math.PI * Math.min(1, Math.max(0, (q - t0) / .18))) : 0;
    legs[k] = [-g[k][0] * u, -g[k][1] * u + lift];
  });
  return { ...r, stand: 0, legs };
}

function scene1(p, D) {
  const P = PRE1, T = (c, t = 0) => clipAt('scene1', P, c, t);
  const cam = setCam(p, 'stable', { x: 800, y: 420, z: .9 });
  const ma = motherPuppet(cam.stage), lh = horsePuppet(cam.stage);   // he is on the near side of her, his head under her chin
  const sack = prop(cam.stage, SACK);                // after the puppets: in front of Mother's muzzle and Little Horse's back
  const birds = [0, 1, 2].map(i => ({ up: prop(cam.stage, s1_BIRD(true)), dn: prop(cam.stage, s1_BIRD(false)), i }));

  // Times on the beat clock.
  const GAG = T('n01', 7.0), GRAZE = T('n01', 8.9), ALONE = T('n01', 10.2);
  const M01 = T('m01'), THIS = T('m01', 17.19 - 13.15), HALF = T('m01', 17.43 - 13.15), MILL = T('m01', 18.37 - 13.15);
  const BIG = T('m01', 14.07 - 13.15), HELP = T('m01', 15.39 - 13.15);
  const H01 = T('h01'), CAN = T('h01', 1.2), LOAD = T('load1');
  // The hand-over: Mother turns to the sack, head down, grip, lift, turn round, a step to him lowering it onto his back.
  const FETCH = H01 + 1.95, DOWN = LOAD - .1, GRIP = DOWN + .55, LIFT = GRIP + .17, SWING = LIFT + .42, LOWER = SWING + 4 / FPS, LAND = LOWER + .45;
  const PROUD = LAND + .5, READY = PROUD + .35;

  // Cameras: a drift in over the valley, then closer and closer on the two of them.
  cam.to({ x: 830, y: 560, z: 1.25 }, .15, T('n01', 2.6) - .15)
    .cut({ x: 950, y: 600, z: 2.0 }, T('n01', 2.62)).to({ x: 975, y: 595, z: 2.2 }, T('n01', 2.62), 4)                 // the two of them
    .cut({ x: 910, y: 610, z: 1.6 }, T('n01', 6.78)).to({ x: 960, y: 610, z: 1.65 }, GAG, 2)                            // the step together
    .cut({ x: 1030, y: 565, z: 2.6 }, T('n01', 10.65)).to({ x: 1040, y: 565, z: 2.85 }, T('n01', 10.65), 2.4)            // never alone
    .cut({ x: 990, y: 590, z: 2.1 }, M01 - .1)                                                                          // "Little one"
    .cut({ x: 1150, y: 545, z: 3.2 }, BIG - .06)                                                                         // his eager face, ears up: "you're big now"
    .cut({ x: 1030, y: 545, z: 3.0 }, HELP - .08)                                                                        // her close-up, his face below; her eyes go to the sack
    .cut({ x: 700, y: 712, z: 3.2 }, HALF - .05)                                                                         // insert: the sack by the door
    .cut({ x: 1150, y: 545, z: 3.2 }, MILL - .02)                                                                        // "to the mill?": his eyes go to the road
    .cut({ x: 1080, y: 600, z: 2.25 }, H01 - .12)                                                                        // him, rearing, hooves and all
    .cut({ x: 925, y: 615, z: 2.0 }, FETCH)                                                                              // the hand-over: she turns on the cut
    .to({ x: 1130, y: 600, z: 2.0 }, PROUD - .2, D + .6 - PROUD + .2);                                                  // then him, setting off
  cam.soft(T('n01', 10.65), true).soft(M01 - .1, false).soft(BIG - .06, true).soft(HALF - .05, false).soft(MILL - .02, true).soft(FETCH, false);

  sfx('scene1', 0, 'birds', .5); sfx('scene1', 0, 'wind', .25);
  sfx('scene1', GAG + .45, 'hoof', .25); sfx('scene1', GAG + .95, 'hoof', .2);
  sfx('scene1', H01 + .78, 'hoof', .45);
  sfx('scene1', FETCH + .6, 'hoof', .2); sfx('scene1', FETCH + 1.05, 'hoof', .2);
  sfx('scene1', SWING, 'whoosh', .35); sfx('scene1', LAND, 'thud', .8);
  sfx('scene1', READY + .55, 'hoof', .3); sfx('scene1', READY + 1.0, 'hoof', .3);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const breath = k => 1.2 * Math.sin((q + k) * 2 * Math.PI / 3.1);

    // ---- birds: three across the sky while the camera drifts in ----
    for (const b of birds) {
      const u = (q - .2 - b.i * .35) / 5.2, on = u > 0 && u < 1, flap = (f + b.i) % 4 < 2;
      vis(b.up, on && flap); vis(b.dn, on && !flap);
      const x = 300 + 1100 * u + b.i * 70, y = 250 - 90 * u + 26 * Math.sin(u * 5 + b.i) - b.i * 30;
      tf(b.up, `translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${(1 - .15 * b.i).toFixed(2)})`); tf(b.dn, b.up._t);
    }

    // ---- Mother ----
    const mr = s1_walk(q, [[0, 800], [GAG, 800], [GAG + 1.3, 860], [FETCH + .3, 860], [FETCH + 1.25, 808], [LOWER, 808], [LAND, 840]], 1.3);
    const mTurn = q < FETCH ? 1 : q < SWING ? s1_turn(q, FETCH, 1, -1) : s1_turn(q, SWING, -1, 1);
    // grazing in the wide shot; then her head comes up and nuzzles his mane
    let mNeck = 80 + 3 * Math.sin(q * 1.3), mNod = -8, mTilt = 8, mLook = 0, mBrow = -.2, mChew = q * 1.6, mEar = 0;
    if (q >= 4.1) { const u = span(q, 4.1, 4.9); mNeck = 80 + (20 + 3 * Math.sin(q * 1.4) - 80) * u; mNod = -8 + (8 + 3 * Math.sin(q * .9) + 8) * u; mTilt = 8 * (1 - u); mChew = u < .5 ? q * 1.6 : 0; }
    if (q >= GAG - .4) mNeck = tween(q, GAG - .4, .4, 20, -2), mNod = 6;
    if (q >= GRAZE) mNeck = tween(q, GRAZE, .5, -2, -30), mNod = tween(q, GRAZE, .5, 6, -12), mTilt = tween(q, GRAZE, .5, 0, -3), mChew = q > GRAZE + .6 ? q * 1.6 : 0;   // stretches up to nibble the willow
    if (q >= ALONE) mNeck = tween(q, ALONE, .5, -30, 16), mNod = tween(q, ALONE, .5, -12, 8), mTilt = tween(q, ALONE, .5, -3, 0), mChew = 0;      // down first; then her muzzle to his mane
    if (q >= M01 - .4) mNeck = tween(q, M01 - .4, .4, 16, 4), mNod = tween(q, M01 - .4, .4, 8, 6);            // to talk to him
    if (q >= THIS) mLook = tween(q, THIS, .2, 0, -1);                                                          // eyes go to the sack
    if (q >= MILL) mLook = tween(q, MILL, .2, -1, 1), mNeck = tween(q, MILL, .4, 4, -6), mNod = tween(q, MILL, .4, 6, -4);   // and to the road
    if (q >= H01 - .2) mLook = tween(q, H01 - .2, .2, 1, .7), mNeck = tween(q, H01 - .2, .35, -6, -22), mNod = tween(q, H01 - .2, .35, -4, -10), mBrow = tween(q, H01, .3, -.2, -.7);   // he rears: she draws her head back and up, delighted
    if (q >= FETCH) mLook = 0, mBrow = -.2, mNeck = tween(q, FETCH, .4, -22, 4), mNod = tween(q, FETCH, .4, -10, 4);
    if (q >= DOWN) mNeck = tween(q, DOWN, .5, 4, 74), mNod = tween(q, DOWN, .5, 4, -6), mTilt = tween(q, DOWN, .5, 0, 9);
    if (q >= LIFT) mNeck = tween(q, LIFT, .38, 74, -8), mNod = tween(q, LIFT, .38, -6, 2), mTilt = tween(q, LIFT, .38, 9, -2);
    if (q >= LOWER) mNeck = tween(q, LOWER, .45, -8, 8), mNod = tween(q, LOWER, .45, 2, 6), mTilt = tween(q, LOWER, .45, -2, 0);
    if (q >= LAND + .1) mNeck = tween(q, LAND + .1, .4, 8, -12), mNod = tween(q, LAND + .1, .4, 6, 6), mLook = .4, mBrow = tween(q, LAND + .1, .4, -.2, -.5);   // proud of him
    const mMouth = q >= GRIP && q < LAND + .05 ? 'A' : lips(q, 'scene1', P, 'm01');
    ma.pose({ x: mr.x, y: 780, s: 1.3, turn: mTurn, d: mr.d, stand: mr.stand, legs: mr.legs, gait: 'walk', neck: mNeck, nod: mNod, tilt: mTilt,
      chew: mChew, mouth: mMouth, look: mLook, brow: mBrow, ear: mEar, lid: 0, bob: breath(.7),
      tail: 6 * Math.sin(q * 1.1) + (q > 3.2 && q < 4 ? 14 * Math.sin((q - 3.2) * 16) : 0),
      shut: blinking(q, [1.6, 5.9, 9.9, T('n01', 9.3), T('m01', 1.9), T('m01', 5.3), H01 + 1.5, PROUD + .3]) }, f);

    // ---- Little Horse ----
    const lr = s1_walk(q, [[0, 965], [GAG + .3, 965], [GAG + 1.55, 1025], [READY + .3, 1025], [READY + 1.7, 1135]], 1.05);   // and off he goes
    let lNeck = 8, lNod = -10, lLook = -.6, lEar = 0, lBrow = 0, lTilt = 0, lBob = breath(0), lLegs = {}, lShut = false;
    if (q >= GAG - .1) lLook = tween(q, GAG - .1, .2, -.6, -1), lEar = -.6;                                   // she moves: he is with her at once
    if (q >= GAG + .3) lNeck = tween(q, GAG + .3, .3, 8, -2), lNod = -4;
    if (q >= GRAZE + .4) lNeck = tween(q, GRAZE + .4, .5, -2, -34), lNod = tween(q, GRAZE + .4, .5, -4, -14), lTilt = tween(q, GRAZE + .4, .5, 0, -6), lLook = -1, lEar = -.8;   // copies her a beat late: stretches up, too small to reach
    if (q >= ALONE + .45) lNeck = tween(q, ALONE + .45, .5, -34, 4), lTilt = tween(q, ALONE + .45, .5, -6, 0), lNod = tween(q, ALONE + .45, .5, -14, -6), lLook = 0, lEar = .3;   // down after her
    if (q >= ALONE + 1.1) lShut = q < M01 - .5;                                                                // eyes shut, content, under her nuzzle
    if (q >= M01 - .4) lLook = tween(q, M01 - .4, .2, 0, -1), lNod = -12, lNeck = 4, lEar = .1;   // "Little one": looks up at her
    if (q >= BIG) lNeck = tween(q, BIG, .3, 4, -6), lBrow = tween(q, BIG, .2, 0, -.6), lTilt = -2, lEar = tween(q, BIG + .15, 2 / FPS, .1, -1);   // "big now": ears snap up, eager, stands taller
    if (q >= THIS + .1) lLook = -1, lNeck = tween(q, THIS + .1, .3, -6, 6), lNod = 0, lEar = .2;                          // follows her eyes to the sack
    if (q >= MILL + .1) lLook = tween(q, MILL + .1, .2, -1, 1), lNeck = tween(q, MILL + .1, .3, 6, -6), lNod = -6, lBrow = -.8, lEar = tween(q, MILL + .25, 2 / FPS, .2, -1);   // the road, the mill: wide-eyed, ears snap up
    if (q >= H01) {                                                                                            // "Yes, Mama!": rears with joy
      const up = span(q, H01 - .05, H01 + .25) * (1 - span(q, H01 + .6, H01 + .8));
      lTilt = -12 * up; lLegs = { nf: [18 * up, 40 * up], ff: [14 * up, 32 * up] }; lNeck = -8 - 6 * up; lNod = -6; lEar = -1; lBrow = -.8;
      lLook = q < H01 + .7 ? -1 : 0;
    }
    if (q >= CAN) lNeck = -10, lNod = -8 + 3 * Math.sin((q - CAN) * 9) * (1 - span(q, CAN, CAN + 1)), lTilt = -3, lEar = -1, lLook = .4, lBrow = .5;   // "I can do it!": determined
    if (q >= FETCH + .3) lLook = tween(q, FETCH + .3, .2, .4, -1), lNeck = -6, lTilt = 0, lBrow = -.3;        // watches her fetch it
    if (q >= SWING) lNeck = tween(q, SWING, .3, -6, 10), lNod = 4, lEar = .4, lShut = between(q, LOWER + .2, LAND + .25);   // braces for it
    if (q >= LAND) {                                                                                           // the weight lands: wobble, brace
      const w = Math.exp(-(q - LAND) * 5) * Math.sin((q - LAND) * 26);
      lTilt = 4 * w; lBob = 7 * Math.exp(-(q - LAND) * 4) + breath(0); lNeck = 10 + 6 * w; lBrow = .7;
      lLegs = { nf: [-6 * span(q, LAND, LAND + .1), 0], nh: [8 * span(q, LAND, LAND + .1), 0] };
    }
    if (q >= PROUD) lNeck = tween(q, PROUD, .35, 10, -12), lNod = tween(q, PROUD, .35, 4, -6), lTilt = tween(q, PROUD, .35, 0, -3), lEar = -1, lBrow = .3, lLook = tween(q, PROUD, .2, -1, -.6),
      lLegs = { nf: [-6, 0], nh: [8, 0] }, lBob = breath(0);
    if (q >= READY) lLook = tween(q, READY, .2, -.6, 1), lNeck = -14, lLegs = { nf: [-6 * (1 - span(q, READY, READY + .3)), 0], nh: [8 * (1 - span(q, READY, READY + .3)), 0] };
    const tuck = q < FETCH ? -14 : 0;                                                                          // tail tucked in while he is pressed to her
    lh.pose({ x: lr.x, y: s1_LY, s: 1.05, d: lr.d, stand: lr.stand, gait: 'walk', neck: lNeck, nod: lNod, tilt: lTilt, look: lLook, ear: lEar,
      brow: lBrow, legs: { ...lr.legs, ...lLegs }, bob: lBob, sack: q >= LAND, chew: between(q, GRAZE + .9, ALONE + .45) ? q * 1.8 : 0, mouth: lips(q, 'scene1', P, 'h01'),
      tail: tuck + 5 * Math.sin(q * 1.7 + 1) + (between(q, 6, 7.2) || between(q, LAND + .6, LAND + 1.4) ? 14 * Math.sin(q * 14) : 0),
      shut: lShut || blinking(q, [3.1, 7.1, T('n01', 5.0), T('m01', 2.6), MILL + .6, CAN + .8]) }, f);

    // ---- the sack: on the ground, in Mother's teeth, onto his back ----
    let sx = s1_SACK[0], sy = s1_SACK[1], rot = 0, sq = 1;
    if (q >= GRIP && q < LAND) {
      [sx, sy] = ma.at('mouth');
      sy += 2;
      if (q < LIFT) rot = -4 * span(q, GRIP, LIFT);                                              // the tug
      else rot = 16 * Math.sin((q - LIFT) * 9) * Math.exp(-(q - LIFT) * 1.5) * mTurn;           // it swings from her teeth
      if (q >= LOWER) {                                                                           // onto his back
        const [bx, by] = lh.at('back'), u = span(q, LOWER, LAND);
        sx += (bx + 2 * s1_S - sx) * u; sy += (by - 35 * s1_S - sy) * u; rot *= 1 - u;
        sq = 1 - .25 * span(q, LAND - 2 / FPS, LAND);
      }
    }
    vis(sack, q < LAND);
    tf(sack, `translate(${sx.toFixed(1)},${sy.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s1_S},${(s1_S * sq).toFixed(3)}) translate(-2,35)`);
  });
}
