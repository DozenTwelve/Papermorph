/* scene2.js — the woods. A side-on follow of Red along the path, the layers sliding past; on "three big oak trees" she
   looks up at three far crowns over the treetops. She passes a bush; on "But someone was watching" the camera stops
   and pushes in on it as she walks out of frame; on "watching" two eyes open in its dark and follow her; the close-up
   holds on them through the silence (eyes2). Scene 3's wolf comes out of this same bush (BX, BY): keep it here.
   Beat clock = PRE2 + the scene-clip word times. */
'use strict';
const PRE2 = .9;
const s2_BX = 1180, s2_BY = 742;   // the bush
// Three far oaks on a rise over the forest's back trees, drawn in the far layer (k .35) so they slide slowly.
const s2_OAKS = `<g filter="url(#paper)"><path d="M1060,470 Q1230,330 1400,470 Z" fill="#9db69a"/></g>
  <g filter="url(#paper)">${[[1146, 350, 38], [1222, 326, 45], [1300, 348, 37]].map(([x, y, r]) => `<rect x="${x - 4}" y="${y + r - 8}" width="8" height="${70 - r}" fill="#8b7a62"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#64936b"/><circle cx="${x - r * .45}" cy="${y + r * .3}" r="${r * .62}" fill="#64936b"/><circle cx="${x + r * .45}" cy="${y + r * .3}" r="${r * .62}" fill="#64936b"/>`).join('')}</g>`;

function scene2(p, D) {
  const P = PRE2, T = (c, t = 0) => clipAt('scene2', P, c, t);
  const OAKS = T('s02', 2.78), BUT = T('s02', 5.12), WATCH = T('s02', 6.14);   // "three big oak trees", "But someone was watching."
  const PASS = T('s02', 4.9);                                                   // Red level with the bush, just before "But"
  const CLOSE = T('eyes2', .2);                                                 // the eyes, close, in the silence
  const OPEN = WATCH - .15, NARROW = CLOSE + 1.0, BLINK = CLOSE + 1.9;
  // Her walk, timed so that she is at the bush at PASS (speed: one step of 2·L·sin A every half period, at scale .6).
  const S = .6, PER = .95, A = 24, V = 2 * 166 * Math.sin(A * Math.PI / 180) / (PER / 2) * S;
  const go = walker(s2_BX + 30 - V * PASS, S, { period: PER, A });

  const cam = paperCam(p, 'forest', { x: go(0).x + 160, y: 470, z: 1 }, { stages: ['far'] });
  prop(cam.stageAt.far, s2_OAKS);
  prop(cam.stage, bushBackSVG(s2_BX, s2_BY)); const eyes = bushEyes(cam.stage, s2_BX, s2_BY - 50);
  const front = prop(cam.stage, bushFrontSVG(s2_BX, s2_BY));
  const red = redPuppet(cam.stage), wipe = trunkWipe(p, 0, .8, 'out');
  // 2.1 follow her along the path; 2.2 at "But" the camera stops and pushes in on the bush she has just passed while
  // she walks on out of frame; 2.3 the eyes, close, still watching where she went.
  cam.to({ x: t => go(t).x + 160 }, 0, .01)
    .to({ x: s2_BX + 90, y: 640, z: 2.0 }, BUT, 1.5)
    .cut({ x: s2_BX + 10, y: s2_BY - 62, z: 3.5 }, CLOSE).to({ x: s2_BX + 4, y: s2_BY - 56 }, CLOSE, D + .6 - CLOSE);   // z 3.5 is the layered sets' limit
  cam.soft(CLOSE, true);

  sfx('scene2', 0, 'forest', .52, { loop: true });   // a bed: it repeats to the end of the scene
  for (let k = 0, t; (t = PER * (.25 + .5 * k)) < BUT + 2.4; k++) sfx('scene2', +t.toFixed(2), 'step' + (1 + k % 3), t < BUT ? .6 : .6 - .3 * Math.min(1, (t - BUT) / 2));
  sfx('scene2', OPEN - .1, 'rustle', 1.1);

  stopClock(D, (q, f) => {
    cam.apply(q, f); wipe(q);
    const w = go(q), look = OAKS - .1 < q && q < OAKS + 1.5;   // she looks up at the oaks and points
    const point = span(q, OAKS, OAKS + .3) * (1 - span(q, OAKS + 1.2, OAKS + 1.5));
    red.pose({ x: w.x, y: hipOn(WOODS, S) + w.drop * S, s: S, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar,
      cape: 3 + 3 * Math.sin(2 * w.ph + .6), ua: -8 + 6 * Math.sin(w.ph), fa: -78, swing: 9 * Math.sin(w.ph - 1),
      headR: look ? -9 * span(q, OAKS - .1, OAKS + .2) * (1 - span(q, OAKS + 1.2, OAKS + 1.5)) : 2 * Math.sin(2 * w.ph),
      fua: point > .05 ? -20 - 85 * point : null, ffa: -10 + 5 * point, shut: blinking(q, [1.9, OAKS + 1.9, BUT + .4]) }, f);
    // The bush shivers as the eyes open.
    const shiver = between(q, OPEN - .1, OPEN + .5) ? 2.2 * onTwos(q) : 0;
    tf(front, `rotate(${shiver},${s2_BX},${s2_BY})`);
    // The eyes: shut until "watching", open in three frames, follow her out of frame; in the close-up they keep looking
    // where she went, narrow (sly), and blink once.
    const o = q < OPEN ? 0 : q < OPEN + 1 / FPS ? .25 : q < OPEN + 2 / FPS ? .7 : q < NARROW ? 1
      : between(q, BLINK, BLINK + 2 / FPS) ? .08 : 1 - .45 * span(q, NARROW, NARROW + .25);
    eyes(o, Math.max(-.2, Math.min(1, (w.x - s2_BX) / 320)));
  });
}
