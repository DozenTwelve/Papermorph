/* scene5.js — Them all (Gág's page 14; storyboard scene5).
   Shots (beat clock = PRE5 + clip time): A (0 – 2.5) medium on the old man among the cats; B (2.5 – 3.4) "looked up": his
   head lifts and the camera follows his eyes to the right; C (3.4 – 4.84) insert on the hillock, "another cat" pops up
   on it; D (4.84 – 7.9) back on him, wider, one more look up and more cats around his feet; E (7.9 – 9.1) closer and
   quicker, "before he knew it"; F (9.1 – end) "chosen them all": the camera pulls back over a crowd that fills the page.
   Every look up is a head lift (part `head`) and, a moment later, new cats pop in. Every cat stands inside Gág's arched
   vignette (world x 330 – 1250, feet no lower than y 792): they crowd up to its edge and stop there. */
'use strict';
const PRE5 = .5;
const S5_NAMES = ['cat8a', 'cat8b', 'cat8c', 'cat8d', 'cat8e', 'cat8f', 'cat22a', 'cat22b', 'cat22d', 'cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat23e',
  'cat23f', 'cat23g', 'cat23h'];
// His looks up (clip seconds): "looked up", "saw another cat", "so pretty", "could not bear", "before he knew it" x2.
const S5_LOOK = [2.46, 3.4, 4.84, 6.1, 7.0, 7.93, 8.64];
// The cats that come with each look: [look index, piece, x, y, scale, flip, delay]. World px of set p14 (the ground band
// is y 760-830, the hillock rises at x 1090-1300).
const S5_CATS = [
  [1, 'cat8a', 1120, 470, 1.26, 0, .2], [1, 'cat8f', 1230, 560, 1.08, 1, .5],
  [2, 'cat8c', 1180, 640, 1.44, 1, .2], [2, 'cat23h', 1010, 790, 1.62, 1, .5], [2, 'cat8d', 1250, 760, 1.44, 1, .7],
  [3, 'cat8e', 900, 790, 1.62, 0, .2], [3, 'cat23b', 1100, 800, 1.62, 1, .5], [3, 'cat8b', 440, 780, 1.44, 0, .7], [3, 'cat8a', 1150, 560, 1.08, 0, .9],
  [4, 'cat23c', 380, 800, 1.62, 0, .15], [4, 'cat22b', 780, 805, 1.62, 1, .35], [4, 'cat23d', 1180, 810, 1.62, 1, .5], [4, 'cat8c', 520, 820, 1.62, 0, .7], [4, 'cat8d', 960, 820, 1.8, 1, .85],
  [5, 'cat22a', 330, 760, 1.62, 0, .1], [5, 'cat23a', 560, 815, 1.8, 0, .25], [5, 'cat8f', 840, 830, 1.8, 1, .4], [5, 'cat23e', 1080, 830, 1.8, 1, .55], [5, 'cat8e', 470, 835, 1.8, 0, .7], [5, 'cat22d', 1290, 800, 1.62, 1, .85],
  [6, 'cat23g', 600, 780, 1.62, 0, .1], [6, 'cat8b', 700, 830, 1.89, 0, .2], [6, 'cat23f', 910, 835, 1.89, 1, .3], [6, 'cat8a', 420, 830, 1.98, 0, .4], [6, 'cat23h', 1010, 835, 1.8, 1, .5], [6, 'cat8c', 1330, 815, 1.62, 1, .6],
];

function scene5(p, D) {
  const P = PRE5, T = t => P + t;
  const cam = paperCam(p, 'p14');
  cam.world.insertBefore(mk('rect', { x: -3000, y: -2000, width: 8000, height: 5000, fill: '#eee8d6' }), cam.world.firstChild);
  // Gág's three clouds drift a few px (layers lifted off p14: the hole they leave is paper, so they stay within about 8 px)
  [1, 2, 3].forEach(k => cam.move('cloud' + k, q => `translate(${(8 * Math.sin(q * .5 + k * 2)).toFixed(1)} ${(2.5 * Math.sin(q * .37 + k)).toFixed(1)})`));
  const out = pageTurn(p, 0, .6, 'out'), turn = pageTurn(p, D - .1, .6, 'in');
  const man = cutPuppet(cam.stage, 'man14'), at = pagePos('p14', 'man14');
  // the cats: those of each look, then the great crowd at "chosen them all"
  const cats = S5_CATS.map(([k, n, x, y, s, fl, d], i) => ({ i, t: T(S5_LOOK[k] + d), x: Math.min(1250, Math.max(330, x)), y: Math.min(792, y), s, flip: !!fl, p: cutPuppet(cam.stage, n), ph: rnd(i * 5 + 2) * 7 }));
  const ALL = T(9.12);
  const crowd = [
    catCrowd(cam.stage, { names: S5_NAMES, n: 24, box: [330, 745, 1250, 792], seed: 5, s: [1.9, 1.4] }),
    catCrowd(cam.stage, { names: S5_NAMES, n: 40, box: [330, 700, 1250, 792], seed: 6, s: [1.9, 1.0] }),
    catCrowd(cam.stage, { names: S5_NAMES, n: 70, box: [330, 640, 1250, 792], seed: 7, s: [2.1, 1.0] }),
  ];
  const wave = [[ALL, .05], [ALL + .5, .04], [ALL + 1.1, .035]];
  // in front of the man's hole at his feet, over the stand-in: a few cats stay round him from the first look
  cam.stage.appendChild(man.g);   // man stays beneath the late crowd but above nothing else; crowds were created after him below
  for (const c of crowd) cam.stage.appendChild(c.g);
  for (const c of cats) cam.stage.appendChild(c.p.g);

  // ---- cameras ----
  cam.cut({ x: 760, y: 500, z: 1.4 }, 0).to({ x: 720, y: 490, z: 1.5 }, 0, T(2.46))
    .to({ x: 860, y: 470, z: 1.28 }, T(2.46), .9)
    .cut({ x: 1170, y: 560, z: 2.3 }, T(3.4)).to({ x: 1190, y: 540, z: 2.0 }, T(3.4), 1.4)
    .cut({ x: 800, y: 520, z: 1.12 }, T(4.84)).to({ x: 790, y: 520, z: 1.05 }, T(4.84), 3)
    .cut({ x: 660, y: 450, z: 1.5 }, T(7.9)).to({ x: 720, y: 470, z: 1.25 }, T(7.9), 1.2)
    .to({ x: 800, y: 520, z: 1.0 }, ALL - .2, .7)
    .to({ x: 800, y: 540, z: .85 }, ALL + .5, 1.6).to({ x: 800, y: 560, z: .58 }, ALL + 2.2, 2.6);
  cam.soft(T(3.4) - .01, true).soft(T(4.84) - .01, false);

  // ---- sound ----
  sfx('scene5', 0, 'meadow', .45, { loop: true });
  sfx('scene5', .02, 'page', .7);
  for (const c of cats) { sfx('scene5', c.t, 'pop', .4); }
  S5_LOOK.slice(1).forEach((l, i) => sfx('scene5', T(l) + .35, ['mew1', 'mew2', 'mew3', 'mew4', 'mew1', 'mew2'][i], .35));
  sfx('scene5', ALL, 'mews', .4); sfx('scene5', ALL + .6, 'mews', .45); sfx('scene5', ALL + 1.3, 'mews', .5);
  for (const [t] of wave) sfx('scene5', t, 'pop', .5);
  sfx('scene5', D - .15, 'page', .6);

  // His head: up on each look, down in between (up = counter-clockwise: he faces right).
  const bump = (q, t) => span(q, t, t + .2) * (1 - span(q, t + .55, t + .95));
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    let up = 0; for (const l of S5_LOOK) up = Math.max(up, bump(q, T(l)));
    man.pose({ x: at.x, y: at.y, s: at.s, sq: 1 + .012 * Math.sin(q * 2.2), rot: Math.sin(q * 1.3) * .6 + (up > .1 ? -.8 * up : 0),
      bob: Math.abs(Math.sin(q * 1.6)) * 2.2 + up * 4,   // he shifts his weight, and rises on his toes at each look
      parts: { head: 4 - 18 * up + Math.sin(q * 1.9) * 1.2 + Math.sin(q * .7) * 2.5, armF: Math.sin(q * 2.1) * 2.5 - 9 * up + Math.sin(q * 5.3) * 1.2 * (1 - up) } }, f);
    for (const c of cats) {
      const u = q - c.t; vis(c.p.g, u >= 0); if (u < 0) continue;
      const pop = u < .34 ? Math.sin(u / .34 * Math.PI) * 18 : 0, w = (q + c.ph) % 4.2, live = w < .34 ? Math.sin(w / .34 * Math.PI) * 6 : 0;
      const L = catLife(q, c.ph, { tail: 20, head: 11 });   // tail, head (and legs once split) alive; each cat looks at him now and then
      c.p.pose({ x: c.x, y: c.y, s: c.s, flip: c.flip, bob: pop + live + L.bob, rot: Math.sin((q + c.ph) * 1.7) * 1.4 + L.rot, parts: L.parts }, f + c.i);
    }
    crowd.forEach((c, k) => c.pose(q, f, { from: wave[k][0], every: wave[k][1] }));
    out(q); turn(q);
  });
}
