/* scene8.js — the grass (Gág's pages 20 and 21; storyboard scene8).
   Shots (beat clock = PRE8 + clip time): A (0 – .9) wide on page 20, the long furry hill, the old man tiny on it;
   B (.9 – 3.5) close-ups of hungry cats, "Mew, mew! Now we are hungry!"; C (3.5 – 11.3) wide again, the refrain's
   lines 3–5 in Gág's lettering over the sky, cats packing in on each word; D (11.36 – 15.8) page 21, the old man tiny
   at the foot of the hill ("There is much grass on the hills"); E (15.9 – 19.2) back on page 20, closer: each cat
   eats a mouthful and the grass goes in patches, on twos, with munching; F (19.24 – end) the bare hill, "not a blade
   was left!" */
'use strict';
const PRE8 = .5;
const s8_T = t => PRE8 + t;
const s8_B = s8_T(.5), s8_WIDE = s8_T(2.97), s8_REF = s8_T(10.81), s8_SAY = s8_T(10.86), s8_ATE = s8_T(15.4), s8_LEFT = s8_T(18.74);
const s8_kids = [['rf-hundreds', 'rf-of1', 'rf-cats4'], ['rf-thousands', 'rf-of2', 'rf-cats5'], ['rf-millions', 'rf-and2', 'rf-billions', 'rf-and3', 'rf-trillions', 'rf-of3', 'rf-cats6']];
const s8_RW = { 'rf-hundreds': 4.3, 'rf-of1': 4.68, 'rf-cats4': 4.94, 'rf-thousands': 5.73, 'rf-of2': 6.12, 'rf-cats5': 6.46,
  'rf-millions': 7.29, 'rf-and2': 7.6, 'rf-billions': 8.08, 'rf-and3': 8.46, 'rf-trillions': 8.9, 'rf-of3': 9.3, 'rf-cats6': 9.78 };
const s8_CATS = ['cat22a', 'cat22b', 'cat22c', 'cat22d', 'cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat25a', 'cat25b', 'cat8a', 'cat8b', 'cat8c', 'cat8d'];
sfx('scene8', 0, 'meadow', .5, { loop: true });
sfx('scene8', .05, 'page', .8);
sfx('scene8', s8_T(.52), 'mew1', .5); sfx('scene8', s8_T(.78), 'mew2', .5); sfx('scene8', s8_T(1.04), 'mew3', .4);
sfx('scene8', s8_T(1.68), 'mew4', .55); sfx('scene8', s8_T(1.8), 'mews', .35);
sfx('scene8', s8_T(4.2), 'mews', .35); sfx('scene8', s8_T(7.2), 'mews', .3);
sfx('scene8', s8_ATE - .1, 'munch', .8); sfx('scene8', s8_ATE + 3.4, 'munch', .6);

function scene8(p, D) {
  const k01 = (q, a, d) => Math.min(1, Math.max(0, (q - a) / d));
  const defs = mk('defs', {}, p);
  // the grass's mask: white all over, with dark patches added one by one as the cats eat (the layer's box is 305..1384 × 239..571)
  const BX = 305.4, BY = 239.1, BW = 1078.6, BH = 331.5, COLS = 9, ROWS = 4, NP = COLS * ROWS;
  // one patch to a cell of a jittered grid (so the whole hill is covered in the end), eaten in a shuffled order
  const order = Array.from({ length: NP }, (_, i) => i).sort((a, b) => rnd(a * 7 + 3) - rnd(b * 7 + 3));
  const patches = Array.from({ length: NP }, (_, i) => ({ x: BX + (i % COLS + .2 + rnd(i * 5 + 1) * .6) * BW / COLS, y: BY + (Math.floor(i / COLS) + .2 + rnd(i * 5 + 2) * .6) * BH / ROWS,
    r: 62 + rnd(i * 5 + 3) * 22, t: order.indexOf(i) / NP }));
  // each bite is a rounded, ragged blob (a ring of 16 points, a few nicked in), drawn at unit size and scaled by transform
  const blob = i => Array.from({ length: 16 }, (_, k) => { const a = k / 16 * 6.2832, r = (k % 5 === 2 ? .66 : 1) * (.86 + .3 * rnd(i * 31 + k)); return `${(Math.cos(a) * r * 1.2).toFixed(2)},${(Math.sin(a) * r * 1.2).toFixed(2)}`; }).join(' ');
  defs.innerHTML = `<mask id="s8_eat" maskUnits="userSpaceOnUse" x="${BX - 20}" y="${BY - 20}" width="${BW + 40}" height="${BH + 40}"><rect x="${BX - 20}" y="${BY - 20}" width="${BW + 40}" height="${BH + 40}" fill="#fff"/>
      <g id="s8_bites" fill="#000">${patches.map((a, i) => `<polygon id="s8_b${i}" points="${blob(i)}" transform="translate(${a.x.toFixed(0)} ${a.y.toFixed(0)}) scale(0)"/>`).join('')}</g><polygon points="926,428 985,452 1114,482 1276,519 1362,541 1379,571 1114,571 996,557 942,509" fill="#fff"/></mask>
    <filter id="s8_grow" x="-5%" y="-10%" width="110%" height="120%"><feMorphology operator="dilate" radius="4"/></filter>
    <mask id="s8_bedMask" maskUnits="userSpaceOnUse" x="${BX - 20}" y="${BY - 20}" width="${BW + 40}" height="${BH + 40}"><image href="../img/sets/p20/grass.webp" x="${BX}" y="${BY}" width="${BW}" height="${BH}" preserveAspectRatio="none" filter="url(#s8_grow)"/></mask>`;
  const bites = patches.map((a, i) => defs.querySelector('#s8_b' + i));

  // P: page 20, the hill and its grass; puppets stand in front of the grass layer
  const P = paperCam(p, 'p20', { x: 800, y: 380, z: 1.3 }, { after: 'grass' });
  P.layer('grass').setAttribute('mask', 'url(#s8_eat)');
  // the bare hill under the grass is plain paper; a few short ticks of Gág's ink stay as stubble
  const bed = mk('g', { mask: 'url(#s8_bedMask)' }), tk = [];
  for (let i = 0; i < 9; i++) { const cx = BX + rnd(i * 7 + 1) * BW, cy = BY + rnd(i * 7 + 2) * BH;   // little tufts of three or four strokes
    for (let k = 0; k < 3 + (i % 2); k++) { const x = cx + (rnd(i * 17 + k * 3) - .5) * 40, y = cy + (rnd(i * 17 + k * 3 + 1) - .5) * 22, l = 5 + rnd(i * 17 + k) * 12, a = (rnd(i * 17 + k * 5 + 2) - .5) * 1.4;
      tk.push(`M${x.toFixed(0)},${y.toFixed(0)} l${(Math.sin(a) * l).toFixed(0)},${(-Math.cos(a) * l).toFixed(0)}`); } }
  bed.innerHTML = `<path d="${tk.join(' ')}" fill="none" stroke="#1e1a16" stroke-width="2" stroke-linecap="round" opacity=".75"/>`;
  P.layer('grass').parentNode.insertBefore(bed, P.layer('grass'));
  const at20 = pagePos('p20', 'man20'), man = cutPuppet(P.stage, 'man20');
  P.to({ x: 800, y: 380, z: 1.3 }, 0, s8_B)
   .cut({ x: 480, y: 400, z: 2 }, s8_B).cut({ x: 500, y: 400, z: 2 }, s8_T(1.55))
   .cut({ x: 800, y: 425, z: 1 }, s8_WIDE).to({ x: 800, y: 420, z: .98 }, s8_WIDE, s8_REF - s8_WIDE)
   .cut({ x: 800, y: 400, z: 1.5 }, s8_ATE - .5).to({ x: 900, y: 400, z: 1.7 }, s8_ATE - .5, 3.8)
   .cut({ x: 850, y: 390, z: 1.15 }, s8_LEFT + .5).to({ x: 850, y: 400, z: 1.3 }, s8_LEFT + .5, 2.4);
  const L = lettering(P.stage, s8_kids.flat(), { x: 800, y: 770, s: 1.15 });
  const hillC = catCrowd(P.stage, { names: s8_CATS, n: 18, box: [380, 440, 1250, 505], seed: 8, s: [.85, .55] });
  const bigA = [['cat8a', 340, 490, 1.3, false, 0], ['cat8c', 460, 495, 1.5, false, 1], ['cat23b', 580, 495, 1.4, false, 2]].map(([n, x, y, s, flip, i]) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  const bigB = [['cat23a', 380, 495, 1.4, false, 3], ['cat8c', 500, 495, 1.6, true, 4], ['cat8d', 620, 495, 1.3, false, 5]].map(([n, x, y, s, flip, i]) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  const eaters = [['cat8a', 420, 480, .8, false], ['cat22c', 620, 495, .7, false], ['cat23d', 820, 500, .7, false], ['cat8b', 1060, 505, .8, true], ['cat25a', 1200, 505, .7, true], ['cat22d', 740, 510, .65, false]]
    .map(([n, x, y, s, flip], i) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  P.soft(s8_B - .01, true).soft(s8_WIDE - .01, false).soft(s8_ATE - .51, true).soft(s8_LEFT + .49, false);

  // Q: page 21, the tiny old man at the foot of the hill
  const Q = paperCam(p, 'p21', { x: 1100, y: 640, z: 1.6 });
  const at21 = pagePos('p21', 'man21'), man21 = cutPuppet(Q.stage, 'man21');
  Q.to({ x: 1160, y: 660, z: 2.2 }, s8_SAY, 4.4);

  const turnOut = pageTurn(p, 0, .45, 'out'), turnIn = pageTurn(p, D - .1, .45, 'in');
  stopClock(D, (q, f) => {
    const inQ = q >= s8_SAY && q < s8_ATE - .5;
    vis(P.root, !inQ); vis(Q.root, inQ);
    P.apply(q, f); Q.apply(q, f);
    const closeA = q >= s8_B && q < s8_T(1.55), closeB = q >= s8_T(1.55) && q < s8_WIDE, wide = !closeA && !closeB && !inQ;
    vis(man.g, !closeA && !closeB && !inQ);
    man.pose({ x: at20.x, y: at20.y, s: at20.s, sq: 1 + .012 * Math.sin(q * 2.2), rot: Math.sin(q * 1.3) * .8 }, f);
    hillC.pose(q, f, { from: .6, every: i => i < 8 ? i * .2 : s8_T(4.3) - .6 + (i - 8) * .55 });
    vis(hillC.g, wide && q < s8_ATE - .5);
    const times = {}; for (const n in s8_RW) times[n] = s8_T(s8_RW[n]);
    vis(L.g, q >= s8_WIDE && q < s8_SAY); L.show(q, times, f, { hideAt: s8_SAY });
    const mewT = [s8_T(.52), s8_T(.78), s8_T(1.04), s8_T(1.22), s8_T(1.56), s8_T(1.68)];
    const bob = (c, ts) => { let b = 0; for (const t of ts) { const u = q - t - c.i * .04; if (u >= 0 && u < .3) b = Math.max(b, Math.sin(u / .3 * Math.PI)); } return b; };
    for (const [arr, on] of [[bigA, closeA], [bigB, closeB]]) arr.forEach(c => { vis(c.p.g, on); c.p.pose({ x: c.x, y: c.y, s: c.s * (1 + .02 * bob(c, mewT)), flip: c.flip, sq: 1 + .012 * Math.sin(q * 2.3 + c.i) + .05 * bob(c, mewT), rot: Math.sin(q * 1.6 + c.i) - bob(c, mewT) * 2 }, f + c.i); });
    // the bites: each patch opens in a few steps on twos as its moment comes, so the grass goes patch by patch
    const span8 = s8_LEFT + .3 - s8_ATE;
    patches.forEach((a, i) => { const u = k01(q, s8_ATE + a.t * span8 * .85, .45), st = Math.floor(u * 4) / 4; const r = a.r * (.7 + .8 * st) * (1 + .5 * k01(q, s8_LEFT - .7, 1.2)) * (st ? 1 : 0); bites[i].setAttribute('transform', `translate(${a.x.toFixed(0)} ${a.y.toFixed(0)}) scale(${r.toFixed(1)} ${(r * .85).toFixed(1)})`); });
    // the eaters: heads down, munching (a quick small dip) while there is grass; sitting up after
    const eatOn = q >= s8_ATE - .5 && q < s8_LEFT + .5 || q >= s8_LEFT + .5;
    for (const c of eaters) {
      vis(c.p.g, eatOn);
      const m = q > s8_ATE && q < s8_LEFT + .2 ? Math.max(0, Math.sin((q - s8_ATE) * 7 + c.i * 1.9)) : 0;
      c.p.pose({ x: c.x, y: c.y, s: c.s, flip: c.flip, rot: (c.flip ? -1 : 1) * m * 6 + Math.sin(q * 1.5 + c.i), sq: 1 + .012 * Math.sin(q * 2 + c.i) - m * .05 }, f + c.i);
    }
    // page 21: the tiny old man speaks (a small bob with the voice)
    vis(man21.g, inQ);
    const say = lips(q, 'scene8', PRE8, 'm07') !== 'X';
    man21.pose({ x: at21.x, y: at21.y, s: at21.s, sq: 1 + .012 * Math.sin(q * 2.2) + (say ? .012 * Math.sin(q * 30) : 0), rot: Math.sin(q * 1.3) * .8 }, f);
    turnOut(q); turnIn(q);
  });
}
