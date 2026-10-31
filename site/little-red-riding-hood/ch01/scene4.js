/* scene4.js — flowers. */
'use strict';
const PRE4 = .3;
function scene4(p, D) {
  const C = (c, t) => clipAt('scene4', PRE4, c, t), PICK = PRE4 + TIMINGS.scene4.marks['s04b.pick'], RUN = PRE4 + TIMINGS.scene4.marks['s04b.run'];
  const cam = paperCam(p, 'forest', { x: 2000, y: 560, z: 1.5 });
  const red = redPuppet(cam.stage), wolf = wolfPuppet(cam.stage);
  // 4.1 he sweeps a paw at the meadow and the camera follows it; 4.2 she skips into the flowers and picks;
  // 4.3 low, running with him along the path (she is a blur behind, still picking)
  cam.to({ x: 3250, y: 500, z: 1.05 }, C('s04', 2.1), 2.6);
  const RX = 2950, runner = walker(2600, .6, { L: 196, A: 26, period: .5, knee: 60 });
  cam.cut({ x: 2700, y: 620, z: 1.7 }, RUN).to({ x: t => Math.min(3600, runner(t - RUN).x + 100) }, RUN, .01);
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const s = .6, run = q >= RUN;
    if (!run) {
      const sweep = span(q, C('s04', 1.7), C('s04', 2.1));
      wolf.pose({ x: 2120, y: hipOn(WOODS, s, 200), s, turn: q < C('s04', 1.6) ? -1 : q < C('s04', 1.9) ? .2 : 1,
        lean: q < C('s04', 1.5) ? 8 * span(q, C('s04', 0), C('s04', .3)) : 0, ua: q < C('s04', 1.5) ? -50 : -60 - 50 * sweep, fa: -20,
        mouth: lips(q, 'scene4', PRE4, 's04'), tail: 8 * Math.sin(q * 5), shut: blinking(q, [1.1]) }, f);
    } else {
      const w = runner(q - RUN);
      wolf.pose({ x: w.x, y: hipOn(WOODS, s, 200) + w.drop * s - 6, s, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar,
        lean: 28, ua: -30 + 45 * Math.sin(w.ph), fa: -40, tail: -25 + 6 * Math.sin(2 * w.ph), mouth: 'D', jaw: .5 }, f);
    }
    // Red: before the pan she stands at the bend; off-screen she runs on; in the meadow she skips in and picks
    if (q < PICK) {
      red.pose({ x: 1883, y: hipOn(WOODS, s), s, ua: -8, fa: -78, headR: -3, shut: blinking(q, [2.4]) }, f);
    } else {
      const sm = .44, gy = 722, w = walk(Math.min(q - PICK, 1.9), { period: .7, A: 24 }), x = 2440 + w.d * sm;   // out in the meadow, beyond the path
      const picks = [7.3, 8.0, 8.7, 9.4, 10.6, 11.4, 12.2].map(t => t + PRE4), done = picks.filter(t => q >= t + .35).length;
      const bend = picks.some(t => between(q, t, t + .35));
      red.pose({ x: x + 40 * done, y: hipOn(gy, sm) + w.drop * sm - (q - PICK < 1.9 ? 8 * Math.abs(Math.sin(w.ph)) : 0) + (bend ? 10 : 0), s: sm,
        near: w.near, far: w.far, kNear: bend ? 30 : w.kNear, kFar: bend ? 20 : w.kFar, ua: bend ? 40 : -8, fa: bend ? 30 : -78,
        headR: bend ? 14 : -2, bouquet: done, shut: blinking(q, [9.0]) }, f);
    }
  });
}
