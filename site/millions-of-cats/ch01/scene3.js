/* scene3.js — The hill of cats, and the refrain. First the old man seen from behind on p08 (set `cathill`, man8, his arms
   rising on their pins) before the hill of cats; then, on the beat of the first word, a cut to Gág's blank page (set
   `refrain`) where her own letters stamp in word by word, each as the narrator says it, while cats pop up: here (left),
   there (right), everywhere, then hundreds, thousands, millions, billions, trillions, and the camera pulls back until
   the letters sit in a sea of them. Beat clock = PRE3 + the scene-clip word times (the clip starts with "Cats here"). */
'use strict';
const PRE3 = 3.0;                    // the p08 shot: he arrives, sees the hill, his arms go up
const S3_NAMES = ['cat8a', 'cat8b', 'cat8c', 'cat8d', 'cat8e', 'cat8f', 'cat22a', 'cat22b', 'cat22c', 'cat22d',
  'cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat23e', 'cat23f', 'cat23g', 'cat23h', 'cat25a', 'cat25b', 'cat25c', 'cat25d'];
// The refrain's words in her order, and the second (on the clip's clock) each is spoken.
const S3_WORDS = [['rf-cats1', 0], ['rf-here', .16], ['rf-cats2', .84], ['rf-there', .96], ['rf-cats3', 1.81], ['rf-and1', 1.96],
  ['rf-kittens', 2.2], ['rf-everywhere', 2.44], ['rf-hundreds', 3.82], ['rf-of1', 4.14], ['rf-cats4', 4.4], ['rf-thousands', 4.96],
  ['rf-of2', 5.36], ['rf-cats5', 5.66], ['rf-millions', 6.38], ['rf-and2', 6.62], ['rf-billions', 7.08], ['rf-and3', 7.38],
  ['rf-trillions', 7.78], ['rf-of3', 8.14], ['rf-cats6', 8.6]];
const S3_TXT = [260, 300, 1340, 640];   // where the letters sit on the page (x0, y0, x1, y1): early cats keep out of it

function scene3(p, D) {
  const P = PRE3, T = (c, t = 0) => clipAt('scene3', P, c, t);
  const cam1 = paperCam(p, 'cathill'), cam2 = paperCam(p, 'refrain');
  for (const c of [cam1, cam2]) c.world.insertBefore(mk('rect', { x: -3000, y: -2000, width: 8000, height: 5000, fill: '#eee8d6' }), c.world.firstChild);
  const out = pageTurn(p, 0, .6, 'out'), turn = pageTurn(p, D - .1, .6, 'in');

  // ---- p08: the old man from behind, before the hill of cats ----
  const man = cutPuppet(cam1.stage, 'man8'), at = pagePos('cathill', 'man8');
  const s3_pets = ['cat8a', 'cat8c', 'cat8d', 'cat8e'].map((n, i) => ({ n, i, p: cutPuppet(cam1.stage, n), at: pagePos('cathill', n) }));
  const UP = .95, UPEND = 1.45;       // his arms go up
  cam1.cut({ x: 800, y: 470, z: 1.36 }, 0).to({ x: 640, y: 560, z: 1.95 }, .5, P - .5 + .3);

  // ---- the refrain page: her letters, the crowd ----
  const L = lettering(cam2.stage, S3_WORDS.map(w => w[0]), { x: 800, y: 440, s: 1.4 });
  const times = {}; for (const [n, c] of S3_WORDS) times[n] = T('rf', c);
  // Waves of cats, each from its word: [box, count, from, to, near, far]. Letters stay clear until the last waves.
  const WAVES = [
    [[300, 640, 560, 840], 3, T('rf', .16), T('rf', .6), 1.5, 1.25],        // here: left
    [[1040, 640, 1300, 840], 3, T('rf', .96), T('rf', 1.4), 1.5, 1.25],      // there: right
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
      c.t = from + (to - from) * (i / n) ** 1.2;
      // the first cats keep clear of her letters; from the hundreds on a paper slip behind the letters holds them
      const inside = c.x > S3_TXT[0] && c.x < S3_TXT[2] && c.y > S3_TXT[1] && c.y < S3_TXT[3];
      if (inside && wi < 3) { c.y = rnd(wi * 313 + i) < .5 ? 90 + rnd(i + wi * 9) * 200 : 650 + rnd(i * 3 + wi) * 190; c.s = Math.max(far, near - (near - far) * (1 - (c.y - box[1]) / (box[3] - box[1]))); }
      cats.push(c);
    });
  });
  cats.sort((a, b) => a.y - b.y); for (const c of cats) sea.appendChild(c.p.g);   // one depth order for all waves
  // her letters stamp in above the crowd
  // a slip of paper under her letters, as wide as the words (read off the pieces), so the sea of cats never swallows them
  const box = L.items.reduce((b, it) => { const C = it.p.C, k = 1.4, l = it.x - C.ax * k, t = it.y - C.ay * k, w = C.parts[0].w * k, h = C.parts[0].h * k;
    return [Math.min(b[0], l), Math.min(b[1], t), Math.max(b[2], l + w), Math.max(b[3], t + h)]; }, [1e9, 1e9, -1e9, -1e9]);
  const slip = prop(cam2.stage, `<g filter="url(#paper)"><rect x="${box[0] - 45}" y="${box[1] - 40}" width="${box[2] - box[0] + 90}" height="${box[3] - box[1] + 80}" rx="18" fill="#fffefa"/></g>`);
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
  sfx('scene3', 0, 'meadow', .5, { loop: true, to: P }); sfx('scene3', .9, 'whoosh', .22); sfx('scene3', 1.7, 'mew1', .3);
  sfx('scene3', P, 'pop', .6); sfx('scene3', T('rf', .16), 'mew2', .3); sfx('scene3', T('rf', .96), 'mew3', .3); sfx('scene3', T('rf', 2.2), 'mew1', .35);
  for (const [c, v] of [[3.82, .3], [4.96, .38], [6.38, .46], [7.78, .5]]) sfx('scene3', T('rf', c), 'mews', v);
  for (const c of [.16, .96, 1.9, 2.2, 3.82, 4.96]) sfx('scene3', T('rf', c), 'pop', .4);
  sfx('scene3', D - .15, 'page', .6);

  stopClock(D, (q, f) => {
    const first = q < P - .001;
    vis(cam1.root, first); vis(cam2.root, !first);
    if (first) {
      cam1.apply(q, f);
      // arms on pins: down at his sides, then up with a little hop; he trembles with surprise and looks up at the hill
      const u = span(q, UP, UPEND), flutter = q > UPEND ? Math.sin(q * 11) * 2.5 * span(q, UPEND, UPEND + .4) : 0;
      man.pose({
        x: at.x, y: at.y, s: at.s, sq: 1 + .012 * Math.sin(q * 2.2), rot: Math.sin(q * 1.3) * .5,
        bob: u > 0 && u < 1 ? Math.sin(u * Math.PI) * 9 : 0,
        hide: u < .85 ? ['shadow'] : [],   // its soft shadow is of the arms up: it comes in as they get there
        parts: { armL: -75 * (1 - u) + flutter, armR: 75 * (1 - u) - flutter, head: -7 * u + Math.sin(q * 1.8) * 1.2 },
      }, f);
      for (const c of s3_pets) c.p.pose({ x: c.at.x, y: c.at.y, s: c.at.s, rot: Math.sin(q * 2.4 + c.i * 2) * 1.6, sq: 1 + .012 * Math.sin(q * 2.6 + c.i), bob: (q + c.i * 1.1) % 2.3 < .2 ? Math.sin(((q + c.i * 1.1) % 2.3) / .2 * Math.PI) * 4 : 0 }, f + c.i);
    } else {
      cam2.apply(q, f);
      L.show(q, times, f);
      vis(slip, q >= SLIP); slip.setAttribute('opacity', Math.min(1, (q - SLIP) / .25).toFixed(2));
      cats.forEach(c => {   // the same pop in and hop as catCrowd's, now on one depth order
        const u = q - c.t; vis(c.p.g, u >= 0); if (u < 0) return;
        const pop = u < .34 ? Math.sin(u / .34 * Math.PI) * 18 : 0, w = (q + c.ph) % 4.2, live = w < .34 ? Math.sin(w / .34 * Math.PI) * 7 : 0;
        c.p.pose({ x: c.x, y: c.y, s: c.s, flip: c.flip, bob: pop + live, rot: Math.sin((q + c.ph) * 1.7) * 1.2 }, f + c.i);
      });
    }
    out(q); turn(q);
  });
}
