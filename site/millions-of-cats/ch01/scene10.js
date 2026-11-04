/* scene10.js — Which one is the prettiest? (p22 closer, then cats on paper). Shots (clip seconds of the joined scene; beat clock = PRE10 + clip):
   0 – 2.0 two-shot at the door, "But we can never feed them all"; 2.0 close on her, "They will eat us out of house and home";
   4.5 two-shot, "said the very old woman"; 6.65 close on him, "I never thought of that. What shall we do?"; 11.3 close on her thinking;
   15.9 closer on her, finger up on "I know!", 17.5 two-shot "We will let the cats decide"; 21.4 him, "Oh yes!"; 25.3 he turns to the cats
   (his line of cats behind him), 27.7 "Which one of you is the prettiest?"; then fast cuts of single cats big on plain paper,
   one popping in on each "I am!", the cuts quicker and the cats more (i1…i6), two of them close-ups into p23's crowd; at n09d
   the whole crowd shouts, a tier of cats on each of hundreds, thousands, millions, billions, trillions. */
'use strict';
const PRE10 = .5;
CUT_FACE.woman22 = { at: [733, 982], w: 30, h: 22 };   // the drawn mouth, page px of p22 (as scene9)
// no CUT_FACE for man22: his drawn mouth sits in the black beard, where the kit's dark mouth cannot be seen; he speaks with a pulse and a nod

const s10_C = (clip, t = 0) => clipAt('scene10', PRE10, clip, t);   // clip start + offset (words file) -> beat clock
const s10_S = t => PRE10 + t;                                          // scene-clip second -> beat clock
const s10_HUN = markAt('scene10', PRE10, 'n09d.hun'), s10_THOU = markAt('scene10', PRE10, 'n09d.thou'), s10_MIL = markAt('scene10', PRE10, 'n09d.mil'),
  s10_BIL = markAt('scene10', PRE10, 'n09d.bil'), s10_TRIL = markAt('scene10', PRE10, 'n09d.tril');

// ---- the dialogue cuts on p22 ----
const s10_CUTS = [   // [beat time, view]
  [0, { x: 640, y: 425, z: 1.9 }], [s10_S(2.0), { x: 505, y: 392, z: 3.4 }], [s10_S(4.5), { x: 655, y: 420, z: 2.4 }],
  [s10_S(6.65), { x: 780, y: 395, z: 3.1 }], [s10_S(11.3), { x: 505, y: 392, z: 2.7 }], [s10_S(15.9), { x: 505, y: 380, z: 3.5 }],
  [s10_S(17.5), { x: 640, y: 405, z: 2.1 }], [s10_S(21.4), { x: 780, y: 395, z: 3.2 }], [s10_S(25.3), { x: 1010, y: 440, z: 2.0 }],
  [s10_S(27.7), { x: 900, y: 405, z: 2.7 }]];

// ---- plain paper: the cats pile up. Each stays as the next pops in; the shouts are the big ones in front, between them
// smaller cats pop in on mews, the gaps shrinking from .7 s to .17 s, so the paper fills faster and faster up to the crowd ----
const s10_PH = ['cat8b', 'cat25d', 'cat14a', 'cat22c', 'cat11w', 'cat23f', 'cat25b', 'cat8a', 'cat10bw', 'cat12', 'cat23e', 'cat13', 'cat8e', 'cat14b', 'cat25a', 'cat23a', 'cat8d', 'cat22d', 'cat25c'];
const s10_SHOUT = [31.26, 33.22, 35.44, 37.83, 41.11, 43.33, 45.42, 46.97];   // each "I am!" in the clip
const s10_HERO = [[-120, 300, 4.6, 0], [330, 310, 4.2, 1], [-400, 300, 4.4, 0], [0, 335, 5.0, 1], [430, 330, 4.2, 0], [-490, 330, 4.0, 1], [230, 345, 4.4, 0], [-170, 345, 4.6, 1]];
const s10_POP = []; {
  const t0 = 31.6, t1 = 48.6;
  for (let t = t0, k = 0; t < t1; t += Math.max(.17, .7 - (t - t0) * .032), k++) {
    if (s10_SHOUT.some(h => Math.abs(h - t) < .12)) continue;
    const r = rnd(k * 29 + 3), r2 = rnd(k * 13 + 5), pr = (t - t0) / (t1 - t0);
    s10_POP.push({ n: s10_PH[Math.floor(rnd(k * 41 + 1) * s10_PH.length)], x: -620 + 1240 * r, y: 150 + 200 * r2, s: (3.4 - 1.3 * pr) * (.9 + .25 * rnd(k * 7 + 2)), flip: rnd(k * 53 + 9) > .5, pop: s10_S(t), hero: false });
  }
  s10_SHOUT.forEach((t, i) => { const h = s10_HERO[i]; s10_POP.push({ n: ['cat8b', 'cat10bw', 'cat25b', 'cat14a', 'cat12', 'cat23f', 'cat8a', 'cat13'][i], x: h[0], y: h[1], s: h[2], flip: !!h[3], pop: s10_S(t), hero: true }); });
}
const s10_CATEND = s10_S(31.26) - .04;   // the first cat on paper: the cut lands on its pop
s10_POP.find(c => c.hero).pop = s10_CATEND;
const s10_CROWD0 = s10_C('n09d', .15), s10_PILEEND = s10_THOU + .25;   // the pile stays under the crowd's first tiers

// sound: the meadow under the dialogue, a pop and a small mew on each cat, the crowd's mews on the tiers
sfx('scene10', 0, 'meadow', .3, { loop: true, to: s10_C('i1', 0) });
s10_POP.forEach((c, j) => { sfx('scene10', +(c.pop).toFixed(2), 'pop', c.hero ? .5 : .35); sfx('scene10', +(c.pop + .05).toFixed(2), 'mew' + ((Math.floor(c.pop * 7) + j) % 4 + 1), c.hero ? .4 : .3); });
sfx('scene10', s10_CROWD0, 'pop', .6); sfx('scene10', s10_CROWD0, 'mews', .35);
[[s10_HUN, .45], [s10_THOU, .5], [s10_MIL, .6], [s10_BIL, .65], [s10_TRIL, .75]].forEach(([t, v]) => { sfx('scene10', t, 'pop', .7); sfx('scene10', t + .05, 'mews', v); });
sfx('scene10', s10_C('n09c', 1.7), 'mew2', .3);

function scene10(p, D) {
  const pk = (q, t, w = .2) => Math.max(0, 1 - Math.abs(q - t) / w);
  const turnOut = pageTurn(p, 0, .6, 'out');

  // ---- p22: the door, closer than scene9 ----
  const A = paperCam(p, 'p22', s10_CUTS[0][1]);
  A.to({ z: 2.05 }, 0, s10_S(2.0));
  s10_CUTS.slice(1).forEach(([t, v], i) => { A.cut(v, t); const nx = s10_CUTS[i + 2]; if (nx) A.to({ z: v.z * 1.06 }, t, nx[0] - t); });
  const wAt = pagePos('p22', 'woman22'), mAt = pagePos('p22', 'man22');
  const woman = cutPuppet(A.stage, 'woman22'), man = cutPuppet(A.stage, 'man22');
  const line = ['cat22a', 'cat22b', 'cat22c', 'cat22d'].map((n, i) => ({ p: cutPuppet(A.stage, n), at: pagePos('p22', n), ph: i * .37 }));
  const tail = catCrowd(A.stage, { names: ['cat22a', 'cat22b', 'cat22c', 'cat22d'], n: 18, box: [760, 585, 1380, 630], seed: 9, s: [1, .85] });
  const tHop = s10_C('n09c', 2.5);   // "to the cats": they hop up

  // ---- close-ups into p23's crowd ----
  const B = paperCam(p, 'p23', { x: 500, y: 600, z: 3 });
  const bc = catCrowd(B.stage, { names: ['cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat23e', 'cat23f', 'cat23g', 'cat23h'], n: 40, box: [235, 588, 1365, 655], seed: 7, s: [1.15, .85] });
  const bv = [[s10_C('i5', .0), { x: 560, y: 600, z: 4.5 }, 0], [s10_C('i5', .62), { x: 930, y: 600, z: 5 }, 0]];   // [cut, view, index of the cat that speaks]
  bv.forEach(([t, v]) => B.cut(v, t));
  B.to({ z: 4.8 }, bv[0][0], bv[1][0] - bv[0][0]).to({ z: 5.3 }, bv[1][0], .9);
  for (const b of bv) { let best = 1e9; bc.cats.forEach((c, i) => { const d = Math.hypot(c.x - b[1].x, c.y - b[1].y - 20); if (d < best) { best = d; b[2] = i; } }); }

  // ---- plain paper: the single cats, then the whole crowd ----
  const E = paperCam(p, 'p22', { x: -900, y: 450, z: 1 });
  const s10_cx = x => -900 + x, s10_cy = y => 450 + y;   // shot coordinates -> world
  const shotCats = s10_POP.slice().sort((a, b) => a.hero - b.hero).map(c => ({ ...c, p: cutPuppet(E.stage, c.n) }));   // the shouts in front of the mews
  const names = ['cat8a', 'cat8b', 'cat8c', 'cat8d', 'cat8e', 'cat8f', 'cat22a', 'cat22b', 'cat22c', 'cat22d', 'cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat23e', 'cat23f', 'cat23g', 'cat23h',
    'cat25a', 'cat25b', 'cat25c', 'cat25d', 'cat10bw', 'cat11w', 'cat12', 'cat13', 'cat14a', 'cat14b'];
  const NC = 170, tiers = [[0, 24, s10_CROWD0], [24, 64, s10_HUN], [64, 100, s10_THOU], [100, 132, s10_MIL], [132, 154, s10_BIL], [154, NC, s10_TRIL]];
  const crowd = catCrowd(E.stage, { names, n: NC, box: [-1900, 360, 0, 900], seed: 10, s: [4.4, 2.2] });
  const tierT = i => { for (const [a, b, t] of tiers) if (i >= a && i < b) return t + (i - a) * .025; return s10_TRIL; };
  E.cut({ x: -900, y: 450, z: 1.3 }, 0).to({ z: 1.42 }, s10_CATEND, s10_CROWD0 - s10_CATEND).to({ z: 1.0 }, s10_HUN, s10_TRIL - s10_HUN + 1).to({ z: .86 }, s10_TRIL + 1, 3);
  const SH = 3;   // a little camera knock on each tier
  [s10_HUN, s10_THOU, s10_MIL, s10_BIL, s10_TRIL].forEach((t, i) => E.shake(t, .35, SH + i));
  s10_POP.filter(c => c.hero).forEach((c, i) => E.shake(c.pop, .25, 1.5 + i * .3));

  const turn = pageTurn(p, D - .1, .6, 'in');
  stopClock(D, (q, f) => {
    const dia = q < s10_CATEND, closeup = q >= bv[0][0] && q < s10_C('i5', 1.0);
    vis(A.root, dia); vis(B.root, closeup); vis(E.root, !dia && !closeup);
    if (dia) {
      A.apply(q, f);
      const k = i => q >= s10_CUTS[i][0] && (i + 1 >= s10_CUTS.length || q < s10_CUTS[i + 1][0]);
      // her: breath, a lean; the finger up on "I know!" and held through the plan, lowered after "keep"
      const upT = s10_C('w09b', .2), dnT = s10_C('w09b', 4.6);
      const arm = -48 * span(q, upT - .12, upT + .16) * (1 - span(q, dnT, dnT + .35)) - 5 * pk(q, s10_C('w09b', 1.8), .15) * (q > upT ? 1 : 0)
        - 7 * (pk(q, s10_C('w09', .45), .15) + pk(q, s10_C('w09', 2.4), .15)) + 2 * Math.sin(q * 3) * (q > upT && q < dnT ? 0 : 1);
      const talkW = lips(q, 'scene10', PRE10, 'w09', 'w09b') !== 'X';
      const think = span(q, s10_C('n09b', .3), s10_C('n09b', 1.0)) * (1 - span(q, s10_C('n09b', 3.0), s10_C('n09b', 3.6)));
      woman.pose({ ...wAt, flip: false, sq: 1 + .012 * Math.sin(q * 2.2) + (talkW ? .008 * pk(q % .45, .1, .12) : 0),
        rot: Math.sin(q * 1.3) * .8 - 1.2 * pk(q, s10_C('w09b', .1), .3) + 1.4 * think, parts: { armR: arm },
        mouth: lips(q, 'scene10', PRE10, 'w09', 'w09b') }, f);
      // him: stands near his spot, breathes under the armful, a nod on "I never thought of that", on "Oh yes!", then turns to the cats
      const nod = pk(q, s10_C('m09', .35), .2) + pk(q, s10_C('m09', .6), .2) * .6 + pk(q, s10_C('m09b', .3), .22) + pk(q, s10_C('m09b', .62), .18) * .7;
      const faceCats = q >= s10_C('n09c', 1.55);
      const sayM = lips(q, 'scene10', PRE10, 'm09', 'm09b', 'm09c');
      man.pose({ x: mAt.x, y: mAt.y, flip: faceCats, sq: 1 + .012 * Math.sin(q * 2.3 + 1) - .013 * nod - (sayM !== 'X' ? .014 * pk(q % .4, .1, .12) : 0),
        rot: Math.sin(q * 1.1) * .6 + 1.4 * nod * (faceCats ? -1 : 1) + (faceCats ? 1.2 * pk(q, s10_C('m09c', .5), .5) : 0) }, f);
      // the line of cats: breathing, an ear-twitch rock; they hop when he calls and turn up to him
      line.forEach((c, i) => c.p.pose({ ...c.at, sq: 1 + .02 * Math.sin(q * 2.4 + i), rot: Math.sin(q * 1.6 + c.ph * 5) * 1.6, bob: 10 * pk(q, tHop + i * .09, .2) }, f));
      tail.pose(q, f, { from: -20, every: 0 });
    } else if (closeup) {
      B.apply(q, f);
      bc.pose(q, f, { from: -20, every: 0 });
      bv.forEach(([t, , k], j) => { const c = bc.cats[k]; if (q < t || j === 0 && q >= bv[1][0]) return;
        c.p.pose({ x: c.x, y: c.y, s: c.s * (1 + .06 * pk(q, t + .3, .3)), flip: c.flip, bob: pk(q, t + .22, .25) * 26, rot: Math.sin(q * 6) * 2 * pk(q, t + .4, .5) }, f + 900);
      });
    } else {
      E.apply(q, f);
      for (const c of shotCats) {
        const on = q >= c.pop - .01 && q < s10_PILEEND; vis(c.p.g, on); if (!on) continue;
        const u = q - c.pop, pop = u < .3 ? Math.sin(u / .3 * Math.PI) * 30 : 0, say = c.hero ? pk(q, c.pop + .12, .3) : pk(q, c.pop + .1, .15) * .5;
        c.p.pose({ x: s10_cx(c.x), y: s10_cy(c.y), s: c.s * (1 + .08 * say + (u < .08 ? .1 : 0)), flip: c.flip, bob: pop + 8 * pk(q, c.pop + .3, .15),
          sq: 1 + .016 * Math.sin(q * 2.4 + c.x), rot: Math.sin(q * 3 + c.x) * (1.5 + 3 * say) }, f + Math.round(c.x));
      }
      crowd.pose(q, f, { from: 0, every: i => tierT(i) });
    }
    turnOut(q); turn(q);
  });
}
