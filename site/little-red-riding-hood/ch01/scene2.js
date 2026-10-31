/* scene2.js — the woods. */
'use strict';
const PRE2 = .9;
function scene2(p, D) {
  const EYES = PRE2 + TIMINGS.scene2.marks['s02.eyes'], BX = 1180, BY = 742;
  const cam = paperCam(p, 'forest', { x: 460, y: 470, z: 1 });
  prop(cam.stage, bushBackSVG(BX, BY)); const eyes = bushEyes(cam.stage, BX, BY - 50); prop(cam.stage, bushFrontSVG(BX, BY));
  const red = redPuppet(cam.stage), wipe = trunkWipe(p, 0, .8, 'out');
  const go = walker(300, .6, { period: .95, A: 24 });
  // 2.1 follow her along the path; 2.2 at "But someone was watching" the camera stops and pushes in on the bush
  // she has just passed; 2.3 the eyes, close, watching her go.
  cam.to({ x: t => go(t).x + 160 }, 0, .01).to({ x: BX, y: 650, z: 2.3 }, EYES, 1.3).cut({ x: BX, y: BY - 50, z: 5.5 }, EYES + 2.1);
  stopClock(D, (q, f) => {
    cam.apply(q, f); wipe(q);
    const w = go(q), s = .6;
    red.pose({ x: w.x, y: hipOn(WOODS, s) + w.drop * s, s, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar,
      cape: 3 + 3 * Math.sin(2 * w.ph + .6), ua: -8 + 6 * Math.sin(w.ph), fa: -78, swing: 9 * Math.sin(w.ph - 1), headR: 2 * Math.sin(2 * w.ph), shut: blinking(q, [2.6]) }, f);
    const o = q < EYES + .8 ? 0 : q < EYES + .9 ? .3 : between(q, EYES + 3.4, EYES + 3.57) ? .1 : 1;
    eyes(o, q < EYES + 2.3 ? .4 : Math.min(1, .4 + (q - EYES - 2.3) * .5));
  });
}
