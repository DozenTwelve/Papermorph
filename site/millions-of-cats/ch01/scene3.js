/* scene3.js — The hill of cats, and the refrain. Opens on the p08 picture scene2 ended on (he stands, arms up, before the hill of cats), a hush; then a leaf turns to Gág's blank page (set
   `refrain`) where her own letters stamp in word by word, each as the narrator says it, while cats pop up: here (left),
   there (right), everywhere, then hundreds, thousands, millions, billions, trillions, and the camera pulls back until
   the letters sit in a sea of them. Beat clock = PRE3 + the scene-clip word times (the clip starts with "Cats here"). */
'use strict';
const PRE3 = 1.5;                    // scene2 ended on p08 with his arms up; the same picture holds in hush, then the leaf turns to the refrain
const S3_NAMES = ['cat8a', 'cat8b', 'cat8c', 'cat8d', 'cat8e', 'cat8f', 'cat22a', 'cat22b', 'cat22c', 'cat22d',
  'cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat23e', 'cat23f', 'cat23g', 'cat23h', 'cat25a', 'cat25b', 'cat25c', 'cat25d'];
// The refrain's words in her order, and the second (on the clip's clock) each is spoken.
const S3_WORDS = [['rf-cats1', 0], ['rf-here', .16], ['rf-cats2', .84], ['rf-there', .96], ['rf-cats3', 1.81], ['rf-and1', 1.96],
  ['rf-kittens', 2.2], ['rf-everywhere', 2.44], ['rf-hundreds', 3.82], ['rf-of1', 4.14], ['rf-cats4', 4.4], ['rf-thousands', 4.96],
  ['rf-of2', 5.36], ['rf-cats5', 5.66], ['rf-millions', 6.38], ['rf-and2', 6.62], ['rf-billions', 7.08], ['rf-and3', 7.38],
  ['rf-trillions', 7.78], ['rf-of3', 8.14], ['rf-cats6', 8.6]];
// The p08 hush, alive: scene2's hill picture with his arms still swinging up and down and the head turning, and each of
// the hill's cats tail-swishing, head-turning and hopping (catLife). Local to scene3 (scene2's own s2_hill is another worker's).
function s3_hill(cam) {
  const man = cutPuppet(cam.stage, 'man8'), at = pagePos('cathill', 'man8');
  const pets = ['cat8a', 'cat8c', 'cat8d', 'cat8e'].map((n, i) => ({ n, i, p: cutPuppet(cam.stage, n), at: pagePos('cathill', n) }));
  cam.world.insertBefore(mk('rect', { x: -3000, y: -2000, width: 8000, height: 5000, fill: '#eee8d6' }), cam.world.firstChild);
  return (q, f) => {
    const wave = Math.sin(q * 5.5);   // arms up, waving over the cats: "here they are!"
    man.pose({ x: at.x, y: at.y, s: at.s, sq: 1 + .014 * Math.sin(q * 2.6), rot: Math.sin(q * 1.9) * .9, bob: Math.abs(Math.sin(q * 2.8)) * 3,
      parts: { armL: wave * 9, armR: -wave * 9, head: -7 + Math.sin(q * 2.2) * 4 } }, f);
    for (const c of pets) {
      const L = catLife(q, c.i * 1.9, { tail: 20, head: 11 }), w = (q + c.i * 1.1) % 1.7, hop = w < .3 ? Math.sin(w / .3 * Math.PI) * 7 : 0;
      c.p.pose({ x: c.at.x, y: c.at.y, s: c.at.s, rot: Math.sin(q * 2.4 + c.i * 2) * 1.8 + L.rot, sq: 1 + .014 * Math.sin(q * 2.6 + c.i), bob: hop + L.bob, parts: L.parts }, f + c.i);
    }
  };
}
const S3_TXT = [260, 300, 1340, 640];   // where the letters sit on the page (x0, y0, x1, y1): early cats keep out of it

function scene3(p, D) {
  const P = PRE3, T = (c, t = 0) => clipAt('scene3', P, c, t);
  const cam1 = paperCam(p, 'cathill'), cam2 = paperCam(p, 'refrain');
  cam2.world.insertBefore(mk('rect', { x: -3000, y: -2000, width: 8000, height: 5000, fill: '#eee8d6' }), cam2.world.firstChild);
  const turn = pageTurn(p, D - .1, .6, 'in');

  // ---- p08: the same picture scene2 ended on (its last framing), held in hush ----
  const hill = s3_hill(cam1);
  cam1.cut(S2_HILLCAM, 0);
  const TS = P - .65, SW = P - .35;     // the leaf turns in and out just before her first word
  const tin = pageTurn(p, TS, .3, 'in'), tout = pageTurn(p, SW, .3, 'out');

  // ---- the refrain page: her letters, the crowd ----
  const L = lettering(cam2.stage, S3_WORDS.map(w => w[0]), { x: 800, y: 440, s: 1.4 });
  const times = {}; for (const [n, c] of S3_WORDS) times[n] = T('rf', c);
  // Waves of cats, each from its word: [box, count, from, to, near, far]. Letters stay clear until the last waves.
  const WAVES = [
    [[300, 640, 560, 840], 5, T('rf', .16), T('rf', .6), 1.5, 1.25],        // here: left
    [[1040, 640, 1300, 840], 5, T('rf', .96), T('rf', 1.4), 1.5, 1.25],      // there: right
    [[200, 110, 1400, 860], 14, T('rf', 1.9), T('rf', 3.3), 1.5, 1.0],       // cats and kittens everywhere
    [[100, 60, 1500, 920], 40, T('rf', 3.82), T('rf', 4.9), 1.5, .85],       // hundreds
    [[-250, -20, 1850, 1020], 100, T('rf', 4.96), T('rf', 6.3), 1.5, .8],    // thousands
    [[-450, -80, 2050, 1100], 150, T('rf', 6.38), T('rf', 7.0), 1.5, .75],   // millions
    [[-550, -120, 2150, 1160], 160, T('rf', 7.08), T('rf', 7.7), 1.5, .75],  // billions
    [[-650, -150, 2250, 1200], 190, T('rf', 7.78), T('rf', 9.2), 1.5, .75],  // trillions
  ];
  const sea = mk('g', {}, cam2.stage), cats = [];
  WAVES.forEach(([box, n, from, to, near, far], wi) => {
    const crowd = catCrowd(sea, { names: S3_NAMES, n, box, seed: 11 + wi * 7, s: [near, far] });
    crowd.cats.forEach((c, i) => {
      c.t = from + (to - from) * (i / n) ** 1.2; c.wi = wi;
      // the first cats keep clear of her letters; from the hundreds on a paper slip behind the letters holds them
      const inside = c.x > S3_TXT[0] && c.x < S3_TXT[2] && c.y > S3_TXT[1] && c.y < S3_TXT[3];
      if (inside && wi < 3) { c.y = rnd(wi * 313 + i) < .5 ? 90 + rnd(i + wi * 9) * 200 : 650 + rnd(i * 3 + wi) * 190; c.s = Math.max(far, near - (near - far) * (1 - (c.y - box[1]) / (box[3] - box[1]))); }
      cats.push(c);
    });
  });
  cats.sort((a, b) => a.y - b.y); for (const c of cats) sea.appendChild(c.p.g);   // one depth order for all waves
  // her letters stamp in above the crowd
  // no card: her letters stand on the paper, with only a soft borderless cream glow behind them (radial, feathered to nothing)
  // so the sea of cats never swallows them
  const box = L.items.reduce((b, it) => { const C = it.p.C, k = 1.4, l = it.x - C.ax * k, t = it.y - C.ay * k, w = C.parts[0].w * k, h = C.parts[0].h * k;
    return [Math.min(b[0], l), Math.min(b[1], t), Math.max(b[2], l + w), Math.max(b[3], t + h)]; }, [1e9, 1e9, -1e9, -1e9]);
  const slip = prop(cam2.stage, `<defs><radialGradient id="s3glow"><stop offset="0" stop-color="#efe8d6" stop-opacity="1"/><stop offset=".93" stop-color="#efe8d6" stop-opacity="1"/><stop offset="1" stop-color="#efe8d6" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="${(box[0] + box[2]) / 2}" cy="${(box[1] + box[3]) / 2}" rx="${(box[2] - box[0]) * .68}" ry="${(box[3] - box[1]) * .95}" fill="url(#s3glow)"/>`);
  const SLIP = T('rf', 3.7);
  cam2.stage.appendChild(slip); cam2.stage.appendChild(L.g);

  // Cameras: the page fills the frame for the first words, then the pull-back: each big number a thump and a step out.
  cam2.cut({ x: 800, y: 440, z: 1.2 }, 0)
    .to({ x: 800, y: 445, z: 1.08 }, T('rf', 2.2), 1.4)
    .to({ x: 800, y: 450, z: .95 }, T('rf', 3.8), 1.2)
    .to({ x: 800, y: 450, z: .85 }, T('rf', 4.95), 1.3)
    .to({ x: 800, y: 450, z: .78 }, T('rf', 6.35), 1.2)
    .to({ x: 800, y: 450, z: .72 }, T('rf', 7.75), 2.0);
  for (const [c, a] of [[3.82, 5], [4.96, 6], [6.38, 7], [7.08, 7], [7.78, 8]]) cam2.shake(T('rf', c), .22, a);

  // ---- sound ----
  sfx('scene3', 0, 'meadow', .5, { loop: true, to: P }); sfx('scene3', TS, 'page', .5); sfx('scene3', P - 1.0, 'mew1', .2);
  sfx('scene3', T('rf', .16), 'mew2', .3); sfx('scene3', T('rf', .96), 'mew3', .3); sfx('scene3', T('rf', 2.2), 'mew1', .35);
  for (const [c, v] of [[3.82, .3], [4.96, .38], [6.38, .46], [7.78, .5]]) sfx('scene3', T('rf', c), 'mews', v);
  for (const c of [.16, .96, 1.9, 2.2, 3.82, 4.96]) sfx('scene3', T('rf', c), 'pop', .4);
  sfx('scene3', D - .15, 'page', .6);

  stopClock(D, (q, f) => {
    const first = q < SW;
    vis(cam1.root, first); vis(cam2.root, !first);
    if (first) {
      cam1.apply(q, f);
      hill(q, f);
      tin(q); tout(1e9);
    } else {
      cam2.apply(q, f);
      L.show(q, times, f);
      vis(slip, q >= SLIP); slip.setAttribute('opacity', 1);   // on a frame, no fade: a fading slip read as a soft wipe over the cats
      cats.forEach(c => {   // the same pop in and hop as catCrowd's, now on one depth order, each cat living (catLife); the early ones hop often
        const u = q - c.t; vis(c.p.g, u >= 0); if (u < 0) return;
        const early = c.wi < 3, pop = u < .34 ? Math.sin(u / .34 * Math.PI) * 18 : 0, per = early ? 1.6 : 1.8, w = (q + c.ph) % per, live = w < .34 ? Math.sin(w / .34 * Math.PI) * (early ? 12 : 15) : 0;
        // from "hundreds" a wave runs through the sea, and goes on to the end
        const surge = Math.max(0, Math.sin(q * 3 - c.x * .006 + c.y * .004)) * 5 * span(q, T('rf', 3.8), T('rf', 4.4));
        // the first cats (here, there, everywhere) pace to and fro on their spot, turned the way they go, legs keeping pace
        const a = q * .9 + c.ph, pace = early ? 48 * Math.sin(a) : 0;
        const L = catLife(q, c.ph, { d: early ? q * 16 / c.s : null, L: 70, A: 20, tail: early ? 24 : 18, head: early ? 14 : 10 });
        const fl = early ? Math.cos(a) < 0 !== ((CUT[c.name].faces ?? 1) < 0) : c.flip;
        c.p.pose({ x: c.x + pace, y: c.y, s: c.s, flip: fl, bob: pop + live + surge + L.bob + (early ? 0 : 2.6 * Math.abs(Math.sin(q * 2.3 + c.ph))), rot: Math.sin((q + c.ph) * 1.7) * (early ? 1.2 : 3) + L.rot, parts: L.parts }, f + c.i);
      });
    }
    if (!first) { tin(0); tout(q); }
    turn(q);
  });
}
