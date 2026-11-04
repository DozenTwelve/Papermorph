/* scene9.js — She sees them (p22, p23). Shots (beat clock = PRE9 + the joined clip's time):
   1 wide at the door: the old man strides in with his armful, the cats behind him; she sees them (0 – s9_S2);
   2 close on her: "My dear!", her arm jabs (s9_S2 – s9_S3); 3 insert, him and the armful, "she cried" (s9_S3 – s9_S4);
   4 close on her: "What are you doing?" (s9_S4 – s9_S5); 5 two-shot, "I asked for one little cat" (s9_S5 – s9_S6);
   6 very close on her, "and what do I see?" (s9_S6 – s9_S7); 7 cut to p23: the long line of cats under the black band, and the
   refrain in Gág's lettering word by word, the line thickening on every number (s9_S7 – end). */
'use strict';
const PRE9 = .5;
CUT_FACE.woman22 = { at: [744, 957], w: 14, h: 9 };   // her drawn mouth (profile, between nose and chin), page px of p22 (grid crop); small, so it stays inside her face

const s9_T = t => PRE9 + t;   // scene-clip time -> beat clock
const s9_S2 = s9_T(3.35), s9_S3 = s9_T(5.1), s9_S4 = s9_T(6.5), s9_S5 = s9_T(7.85), s9_S6 = s9_T(9.75), s9_S7 = s9_T(10.85);
const s9_WALK0 = .9, s9_WALKN = 2;   // two half-cycles from .9 s: legs level when he stops; a short walk, so the smear Gag left under his old place stays behind the cats
const s9_PER = 1.1, s9_L = 170, s9_A = 14;
sfx('scene9', 0, 'meadow', .45, { loop: true });
sfx('scene9', .05, 'page', .8);
for (let k = 0; k < s9_WALKN; k++) sfx('scene9', +(s9_WALK0 + .12 + k * s9_PER / 2).toFixed(2), 'step' + (k % 3 + 1), 1);
sfx('scene9', s9_S7, 'whoosh', .6);
// the refrain's words in time (words file, scene-clip s)
const s9_RF = [['rf-cats1', 12.23], ['rf-here', 12.39], ['rf-cats2', 13.07], ['rf-there', 13.19], ['rf-cats3', 14.04], ['rf-and1', 14.19],
  ['rf-kittens', 14.43], ['rf-everywhere', 14.67], ['rf-hundreds', 16.05], ['rf-of1', 16.37], ['rf-cats4', 16.63], ['rf-thousands', 17.19],
  ['rf-of2', 17.59], ['rf-cats5', 17.89], ['rf-millions', 18.61], ['rf-and2', 18.85], ['rf-billions', 19.31], ['rf-and3', 19.61],
  ['rf-trillions', 20.01], ['rf-of3', 20.37], ['rf-cats6', 20.83]];
[12.23, 14.04].forEach((t, i) => sfx('scene9', s9_T(t), 'mews', .3 + i * .1));
sfx('scene9', s9_T(16.05), 'pop', .6); sfx('scene9', s9_T(16.05), 'mews', .45);
sfx('scene9', s9_T(17.19), 'pop', .6); sfx('scene9', s9_T(17.4), 'mews', .5);
sfx('scene9', s9_T(18.61), 'pop', .7); sfx('scene9', s9_T(18.8), 'mews', .6);
sfx('scene9', s9_T(20.01), 'chime', .5); sfx('scene9', s9_T(20.1), 'mews', .6);

function scene9(p, D) {
  const pk = (q, t, w = .2) => Math.max(0, 1 - Math.abs(q - t) / w);   // a small peak in time: a stressed word
  const turnOut = pageTurn(p, 0, .6, 'out');

  // ---- p22: the door ----
  const A = paperCam(p, 'p22', { x: 760, y: 470, z: 1.36 });
  A.to({ x: 700, y: 440, z: 1.5 }, .6, s9_S2 - .6)
   .cut({ x: 600, y: 395, z: 2.8 }, s9_S2).to({ z: 3.1 }, s9_S2, s9_S3 - s9_S2)
   .cut({ x: 790, y: 420, z: 2.3 }, s9_S3).to({ z: 2.5 }, s9_S3, s9_S4 - s9_S3)
   .cut({ x: 610, y: 390, z: 2.8 }, s9_S4).to({ z: 3.2 }, s9_S4, s9_S5 - s9_S4)
   .cut({ x: 650, y: 410, z: 2.3 }, s9_S5).to({ x: 620 }, s9_S5, s9_S6 - s9_S5)
   .cut({ x: 615, y: 385, z: 3.0 }, s9_S6).to({ z: 3.4 }, s9_S6, s9_S7 - s9_S6);
  const wAt = pagePos('p22', 'woman22'), mAt = pagePos('p22', 'man22');
  const woman = cutPuppet(A.stage, 'woman22'), man = cutPuppet(A.stage, 'man22');
  const line = ['cat22a', 'cat22b', 'cat22c', 'cat22d'].map((n, i) => ({ p: cutPuppet(A.stage, n), at: pagePos('p22', n), ph: i * .37 }));
  const dEnd = walk(s9_WALKN * s9_PER / 2, { L: s9_L, A: s9_A, period: s9_PER, knee: 0 }).d;
  // the cats behind him start dEnd to the right and walk in with him (legs by catLife), freezing where Gag drew them
  const s9_TW = s9_WALKN * s9_PER / 2, s9_V = -dEnd / s9_TW;
  const tail = catCrowd(A.stage, { names: ['cat22a', 'cat22b', 'cat22c', 'cat22d'], n: 18, box: [760 + dEnd, 585, 1380 + dEnd, 630], seed: 9, s: [1, .85] });

  // ---- p23: the long line ----
  const B = paperCam(p, 'p23', { x: 800, y: 430, z: 1 });
  B.to({ x: 800, y: 600, z: 1.32 }, s9_S7 + .1, 1.5).to({ x: 770, y: 610, z: 1.36 }, s9_T(12.23), 3.5)
   .to({ x: 800, y: 610, z: 1.3 }, s9_T(16), 1.6).to({ x: 800, y: 600, z: 1.18 }, s9_T(19.9), .9);
  B.shake(s9_T(20.01), .5, 5);
  // the long line is a procession: every cat walks left at s9_V2 from the cut for s9_DX px, the box starting that far in from the
  // band's right end, so every cat stands on Gag's drawn ground from its first frame to its last (band world x 235 .. 1365)
  const s9_V2 = -18, s9_DX = 230, s9_T1 = s9_S7 + s9_DX / -s9_V2;
  const names = ['cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat23e', 'cat23f', 'cat23g', 'cat23h', 'cat22a', 'cat22b', 'cat22c', 'cat22d'];
  const N = 64, crowd = catCrowd(B.stage, { names, n: N, box: [235 + s9_DX, 588, 1365, 655], seed: 23, s: [1.15, .85] });
  const when = i => (i < 14 ? s9_S7 + i * .08 : s9_T(i < 20 ? 12.8 + (i - 14) * .2 : i < 28 ? 16.5 + (i - 12) * .06 : i < 44 ? 17.7 + (i - 28) * .05 : 19.1 + (i - 44) * .07));
  // big cats walking past in the foreground, under the lettering and in front of the band: a parade from the right, so the frame is never just paper and words
  const s9_FV = -130;
  const fore = catCrowd(B.stage, { names, n: 11, box: [700, 912, 2700, 932], seed: 91, s: [1.95, 1.75] });
  const L = lettering(B.stage, s9_RF.map(w => w[0]), { x: 778, y: 763, s: .98 });
  const times = {}; for (const [n, t] of s9_RF) times[n] = s9_T(t);

  const turn = pageTurn(p, D - .1, .6, 'in');
  stopClock(D, (q, f) => {
    vis(A.root, q < s9_S7); vis(B.root, q >= s9_S7);
    if (q < s9_S7) {
      A.apply(q, f);
      // her: breath, a lean, the arm on its pin: a jab on each stressed word, up on "one"
      const arm = -10 * pk(q, s9_T(3.62)) - 7 * pk(q, s9_T(3.42), .15) - 8 * (pk(q, s9_T(6.83), .15) + pk(q, s9_T(6.96), .15))
        - 20 * span(q, s9_T(7.99), s9_T(8.6)) * (q < s9_S6 ? 1 : 0) * (1 - span(q, s9_T(9.9), s9_T(10.2))) - 9 * pk(q, s9_T(10.25), .25) - 5 * pk(q, s9_T(2.1), .5)
        + 2.5 * Math.sin(q * 3);
      const talk = (q >= s9_S2 && q < s9_S3) || (q >= s9_S4 && q < s9_S7);
      // head: a nod on each stressed word (forward is +), tipped back as she sees them; far hand waving up with her cries
      const st = pk(q, s9_T(3.42), .15) + pk(q, s9_T(3.62), .15) + pk(q, s9_T(6.83), .15) + pk(q, s9_T(6.96), .15) + pk(q, s9_T(8.0), .15) + pk(q, s9_T(10.25), .2);
      const head = 7 * st - 6 * span(q, s9_T(1.7), s9_T(2.6)) * (1 - span(q, s9_T(3.2), s9_T(3.5))) + 1.5 * Math.sin(q * 1.9);
      const armL = -16 * (pk(q, s9_T(3.5), .3) + pk(q, s9_T(6.9), .3) + pk(q, s9_T(10.2), .3)) - 10 * span(q, s9_T(2.0), s9_T(3.0)) * (1 - span(q, s9_T(3.3), s9_T(3.6))) + 2 * Math.sin(q * 2.6);
      woman.pose({ ...wAt, flip: false, sq: 1 + .012 * Math.sin(q * 2.2) + (talk ? .01 * pk(q % .5, .1, .12) : 0), rot: Math.sin(q * 1.3) * .8 + (talk ? -1.4 * pk(q, s9_T(3.62), .3) : 0),
        parts: { armR: arm, armL, head }, mouth: lips(q, 'scene9', PRE9, 'w08', 'w08b') }, f);
      // him: strides in on pins, stops, breathes under the armful, a bob when she cries out
      const tau = Math.min(Math.max(q - s9_WALK0, 0), s9_WALKN * s9_PER / 2), w = cutWalk(tau, { L: s9_L, A: s9_A, period: s9_PER }), moving = q > s9_WALK0 && tau < s9_WALKN * s9_PER / 2;
      const wd = walk(tau, { L: s9_L, A: s9_A, period: s9_PER, knee: 0 }).d;
      man.pose({ x: mAt.x + (dEnd - wd) * 1, y: mAt.y, flip: false, bob: moving ? w.bob : 0, sq: 1 + .012 * Math.sin(q * 2.3 + 1) - (q > s9_T(3.5) ? .01 * pk(q, s9_T(3.8), .25) : 0),
        rot: moving ? Math.sin(q * 5.7) * .8 : Math.sin(q * 1.1) * .6 - 1.5 * pk(q, s9_T(3.8), .35), parts: { legL: moving ? w.legL : 0, legR: moving ? w.legR : 0,
          head: -(moving ? 3.5 * Math.sin(q * Math.PI * 4 / s9_PER) : 1.2 * Math.sin(q * 1.4)) - 6 * pk(q, s9_T(3.9), .3) - 4 * pk(q, s9_T(6.95), .3) } }, f);
      // the line of cats behind him, trotting on the spot, and more popping in behind
      for (const c of line) {
        const L = catLife(q, c.ph, { d: moving ? wd * 1.2 : null, L: 60, A: 16 });
        c.p.pose({ ...c.at, x: c.at.x + (dEnd - wd), bob: L.bob, rot: L.rot, parts: L.parts }, f);
      }
      tail.pose(q, f, { from: .0, every: .04, walk: { v: s9_V, t0: s9_WALK0, t1: s9_WALK0 + s9_TW } });
    } else {
      B.apply(q, f);
      crowd.pose(q, f, { from: 0, every: i => when(i), walk: { v: s9_V2, t0: s9_S7, t1: s9_T1 } });
      L.show(q, times, f);
      fore.pose(q, f, { from: -20, every: 0, walk: { v: s9_FV, t0: s9_S7 } });
    }
    turnOut(q); turn(q);
  });
}
