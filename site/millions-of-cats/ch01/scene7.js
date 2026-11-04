/* scene7.js — the pond (Gág's pages 18 and 19; storyboard scene7).
   Shots (beat clock = PRE7 + clip time): A (0 – 2.2) wide on the pond, the old man at the left, cats trotting in to
   the bank; B (2.27 – 5.2) two close-ups of cats at the bank, "Mew, mew!" then "We are thirsty!", each mew a
   head-bob and a mew; C (5.25 – 13.15) wide again, the refrain's lines 3–5 in Gág's lettering over the sky, the bank
   packing with more cats on each word; D (13.2 – 18.4) her page 19: the old man bends and holds his hand out
   ("Well, here is a great deal of water"); E (18.4 – 21.7) back to the pond, closer: each cat takes a sip and the water
   shrinks in steps, with lapping; F (21.7 – end) the dry hollow, "and the pond was gone!", the cats sitting round it. */
'use strict';
const PRE7 = .5;
const s7_T = (t) => PRE7 + t;
const s7_TURN = .6, s7_C0 = s7_T(1.77), s7_B2 = s7_T(3.2), s7_WIDE = s7_T(4.747), s7_REF = s7_T(12.65), s7_WELL = s7_T(12.7),
  s7_SAID = s7_T(15.82), s7_SIP = s7_T(17.92), s7_GONE = s7_T(21.26);
const s7_kids = [['rf-hundreds', 'rf-of1', 'rf-cats4'], ['rf-thousands', 'rf-of2', 'rf-cats5'], ['rf-millions', 'rf-and2', 'rf-billions', 'rf-and3', 'rf-trillions', 'rf-of3', 'rf-cats6']];
// the refrain's words and when each lands in the scene clip 'r' (words file; marks give the first word of each line)
const s7_RW = { 'rf-hundreds': 6.14, 'rf-of1': 6.52, 'rf-cats4': 6.78, 'rf-thousands': 7.57, 'rf-of2': 7.96, 'rf-cats5': 8.3,
  'rf-millions': 9.14, 'rf-and2': 9.44, 'rf-billions': 9.92, 'rf-and3': 10.3, 'rf-trillions': 10.74, 'rf-of3': 11.14, 'rf-cats6': 11.62 };
const s7_CATS = ['cat22a', 'cat22b', 'cat22c', 'cat22d', 'cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat25a', 'cat25b', 'cat8a', 'cat8b', 'cat8c', 'cat8d'];
sfx('scene7', 0, 'birds', .35, { loop: true });
sfx('scene7', .05, 'page', .8);
for (let i = 0; i < 6; i++) sfx('scene7', .8 + i * .22, i % 2 ? 'step2' : 'step3', .5);
sfx('scene7', s7_T(2.29), 'mew1', .5); sfx('scene7', s7_T(2.55), 'mew2', .5);
sfx('scene7', s7_T(2.81), 'mew3', .4); sfx('scene7', s7_T(3.25), 'mew4', .5); sfx('scene7', s7_T(3.4), 'mews', .35);
sfx('scene7', s7_T(6.1), 'mews', .35); sfx('scene7', s7_T(9.0), 'mews', .3);
sfx('scene7', s7_WELL + .6, 'hop', .5);
sfx('scene7', s7_SIP, 'laps', .8); sfx('scene7', s7_SIP + 2.5, 'lap', .6);

function scene7(p, D) {
  const k01 = (q, a, d) => Math.min(1, Math.max(0, (q - a) / d));
  const defs = mk('defs', {}, p);
  // the pond's mask: a white ellipse that shrinks round the hollow's middle (the water layer's box is 751..1282 × 366..520)
  const WC = [1016, 443], WRX = 275, WRY = 85;
  defs.innerHTML = `<mask id="s7_drain" maskUnits="userSpaceOnUse" x="700" y="300" width="640" height="300"><ellipse id="s7_hole" cx="${WC[0]}" cy="${WC[1]}" rx="${WRX}" ry="${WRY}" fill="#fff"/></mask>
    <filter id="s7_grow" x="-5%" y="-10%" width="110%" height="120%"><feMorphology operator="dilate" radius="4"/></filter>
    <mask id="s7_bedMask" maskUnits="userSpaceOnUse" x="700" y="300" width="640" height="300"><image href="../img/sets/p18/water.webp" x="751.1" y="366.2" width="530.9" height="153.6" preserveAspectRatio="none" filter="url(#s7_grow)"/></mask>`;
  const hole = defs.querySelector('#s7_hole');

  // P: Gág's page 18, the pond; puppets stand in front of the water layer
  const P = paperCam(p, 'p18', { x: 800, y: 330, z: 1.2 }, { after: 'water' });
  P.layer('water').setAttribute('mask', 'url(#s7_drain)');
  // the dry hollow under the water: dull mud with a few cracks in Gág's ink, so the pond leaves a bed, not a hole in the page
  const bed = mk('g', { mask: 'url(#s7_bedMask)' }), cr = [];
  for (let i = 0; i < 34; i++) { const x = 770 + rnd(i * 3 + 1) * 500, y = 380 + rnd(i * 3 + 2) * 130, a = rnd(i * 3 + 3) * 6.3, l = 14 + rnd(i + 90) * 26;
    cr.push(`M${x.toFixed(0)},${y.toFixed(0)} l${(Math.cos(a) * l).toFixed(0)},${(Math.sin(a) * l * .5).toFixed(0)} l${(Math.cos(a + 1.1) * l * .6).toFixed(0)},${(Math.sin(a + 1.1) * l * .3).toFixed(0)}`); }
  bed.innerHTML = `<rect x="700" y="300" width="640" height="300" fill="#d8ccae"/><path d="${cr.join(' ')}" fill="none" stroke="#1e1a16" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>`;
  P.layer('water').parentNode.insertBefore(bed, P.layer('water'));
  const at18 = pagePos('p18', 'man18'), man = cutPuppet(P.stage, 'man18');
  P.to({ x: 780, y: 360, z: 1.4 }, 0, s7_C0 + .1)
   .cut({ x: 620, y: 430, z: 2.4 }, s7_C0).cut({ x: 660, y: 430, z: 2.4 }, s7_B2)
   .cut({ x: 800, y: 335, z: 1.25 }, s7_WIDE).to({ x: 800, y: 352, z: 1.1 }, s7_WIDE, s7_REF - s7_WIDE)
   .cut({ x: 1010, y: 440, z: 2.1 }, s7_SIP - .6).to({ x: 1010, y: 450, z: 2.3 }, s7_SIP - .6, 3.4)
   .cut({ x: 1010, y: 450, z: 1.3 }, s7_GONE).to({ x: 1010, y: 470, z: 1.8 }, s7_GONE, 2.4);
  // cats for the wide shots and the lapping: a crowd that fills the bank on each refrain line
  const L18 = lettering(P.stage, s7_kids.flat(), { x: 800, y: 50, s: 1.3 });
  const bankL = catCrowd(P.stage, { names: s7_CATS, n: 18, box: [300, 400, 700, 560], seed: 7, s: [1.1, .8] });
  const lapCats = [['cat8a', 720, 500, 1.5, false], ['cat22c', 780, 470, 1.3, false], ['cat8b', 1200, 560, 1.4, true], ['cat23d', 1090, 570, 1.1, true],
    ['cat25a', 990, 540, 1.3, false], ['cat22d', 880, 545, 1.2, false]].map(([n, x, y, s, flip], i) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  // the close-up cats (shots B): big paper cats at the bank; Gág's own page is blurred behind
  const bigA = [['cat8a', 500, 530, 2.1, false, 0], ['cat8c', 610, 535, 2.7, false, 1], ['cat23b', 730, 535, 2.5, false, 2]].map(([n, x, y, s, flip, i]) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  const bigB = [['cat23a', 560, 535, 2.4, false, 3], ['cat8c', 680, 535, 3.0, true, 4], ['cat8d', 790, 535, 2.2, false, 5]].map(([n, x, y, s, flip, i]) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  P.soft(s7_C0 - .01, true).soft(s7_WIDE - .01, false).soft(s7_SIP - .61, true).soft(s7_GONE - .01, false);

  // Q: Gág's page 19, the old man bends with his hand out
  const Q = paperCam(p, 'p19', { x: 640, y: 420, z: 1.9 });
  const at19 = pagePos('p19', 'man19'), man19 = cutPuppet(Q.stage, 'man19');
  Q.to({ x: 640, y: 440, z: 2.1 }, s7_WELL, 5.4);

  const turnOut = pageTurn(p, 0, s7_TURN, 'out'), turnIn = pageTurn(p, D - .1, .6, 'in');
  stopClock(D, (q, f) => {
    const inQ = q >= s7_WELL && q < s7_SIP - .6 + 0;
    vis(P.root, !inQ); vis(Q.root, inQ);
    P.apply(q, f); Q.apply(q, f);
    const wide = (q < s7_C0 || q >= s7_WIDE) && !inQ, closeA = q >= s7_C0 && q < s7_B2, closeB = q >= s7_B2 && q < s7_WIDE;
    // the old man at the left of the pond: breathes, rocks, looks at the water; hides in the close-ups
    vis(man.g, wide);
    man.pose({ x: at18.x, y: at18.y, s: at18.s, sq: 1 + .012 * Math.sin(q * 2.2), rot: Math.sin(q * 1.3) * .8 }, f);
    // the bank cats: Gág's page already has hers; ours come in a few at a time, A trots in, C packs on each word
    bankL.pose(q, f, { from: .8, every: i => i < 6 ? i * .22 : s7_REF - 6.5 + (i - 6) * .55 });
    vis(bankL.g, !inQ && !(q >= s7_C0 && q < s7_WIDE) && q < s7_SIP - .6);
    // the refrain's lettering over the sky
    const times = {}; for (const n in s7_RW) times[n] = s7_T(s7_RW[n]);
    vis(L18.g, q >= s7_WIDE && q < s7_WELL); L18.show(q, times, f, { hideAt: s7_WELL });
    // close-ups: each mew a head bob; the cats breathe
    const mewT = [s7_T(2.29), s7_T(2.55), s7_T(2.81), s7_T(3.25), s7_T(3.55)];
    const bob = (c, ts) => { let b = 0; for (const t of ts) { const u = q - t - c.i * .04; if (u >= 0 && u < .3) b = Math.max(b, Math.sin(u / .3 * Math.PI)); } return b; };
    bigA.forEach(c => { vis(c.p.g, closeA); c.p.pose({ x: c.x, y: c.y, s: c.s * (1 + .02 * bob(c, mewT)), flip: c.flip, sq: 1 + .012 * Math.sin(q * 2.3 + c.i) + .05 * bob(c, mewT), rot: Math.sin(q * 1.6 + c.i) * 1 - bob(c, mewT) * 2 }, f + c.i); });
    bigB.forEach(c => { vis(c.p.g, closeB); c.p.pose({ x: c.x, y: c.y, s: c.s, flip: c.flip, sq: 1 + .012 * Math.sin(q * 2.3 + c.i) + .06 * bob(c, mewT), rot: Math.sin(q * 1.6 + c.i) * 1 - bob(c, mewT) * 2 }, f + c.i); });
    // the sips: each cat dips its head to the water a few times; the pond shrinks in steps
    const lapOn = q >= s7_SIP - .6;
    const drain = k01(q, s7_SIP, s7_GONE - s7_SIP + .4), steps = Math.floor(ease(drain) * 10) / 10;
    hole.setAttribute('rx', (WRX * (1 - steps)).toFixed(1)); hole.setAttribute('ry', (WRY * (1 - steps)).toFixed(1));
    for (const c of lapCats) {
      vis(c.p.g, lapOn);
      const lap = Math.max(0, Math.sin((q - s7_SIP) * 5.5 + c.i * 1.7)), sitting = q > s7_GONE ? 1 : 0;
      c.p.pose({ x: c.x, y: c.y, s: c.s, flip: c.flip, rot: (c.flip ? -1 : 1) * (q > s7_SIP && !sitting ? lap * 7 : 0) + Math.sin(q * 1.5 + c.i), sq: 1 + .012 * Math.sin(q * 2 + c.i) - (q > s7_SIP && !sitting ? lap * .05 : 0) }, f + c.i);
    }
    // page 19: the old man bends, hand out; his mouth is the voice (a small pulse while he talks)
    vis(man19.g, inQ);
    const say = lips(q, 'scene7', PRE7, 'm06', 'n06c') !== 'X';
    const bend = ease(k01(q, s7_WELL, .6)), pulse = say ? .01 * Math.sin(q * 30) : 0;
    man19.pose({ x: at19.x, y: at19.y, s: at19.s, sq: 1 + .012 * Math.sin(q * 2.2) + pulse, rot: -bend * 2 + Math.sin(q * 1.3) * .6,
      parts: { armR: -bend * 28 + Math.sin((q - s7_WELL) * 3) * 4 } }, f);
    turnOut(q); turnIn(q);
  });
}
