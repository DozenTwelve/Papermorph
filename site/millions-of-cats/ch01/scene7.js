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
  s7_SAID = s7_T(15.82), s7_SIP = s7_T(15.88), s7_GONE = s7_T(19.22);
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
  // the pond's mask: a white ellipse that shrinks to nothing round the hollow's middle, so the water (Gág's ripple dashes with it) steps away
  // to the plain paper of the set's base (the water layer's box is 751..1282 x 366..520)
  const WC = [1016, 443], WRX = 340, WRY = 130;
  defs.innerHTML = `<mask id="s7_drain" maskUnits="userSpaceOnUse" x="700" y="300" width="640" height="300"><ellipse id="s7_hole" cx="${WC[0]}" cy="${WC[1]}" rx="${WRX}" ry="${WRY}" fill="#fff"/></mask>`;
  const hole = defs.querySelector('#s7_hole');
  // Why the pond did not seem to shrink: the set's 'water' layer holds only Gág's ripple dashes (the pond itself is bare paper inside her bank), so
  // scaling it moved a few dashes. The mud is drawn here instead: a ring of Gág's two inks (diagonal hatching) between the pond's outline and a water
  // ellipse that pulls in on twos, so the dry hollow of page 19 grows from the bank. PC/PRX/PRY: the pond's paper as seen on page 18.
  const PC = [1066, 468], PRX = 296, PRY = 78;
  defs.insertAdjacentHTML('beforeend', `<mask id="s7_mud" maskUnits="userSpaceOnUse" x="${PC[0] - PRX - 20}" y="${PC[1] - PRY - 20}" width="${2 * PRX + 40}" height="${2 * PRY + 40}"><ellipse cx="${PC[0]}" cy="${PC[1]}" rx="${PRX}" ry="${PRY}" fill="#fff"/><ellipse id="s7_pool" cx="${PC[0]}" cy="${PC[1]}" rx="${PRX}" ry="${PRY}" fill="#000"/></mask>`);
  const pool = defs.querySelector('#s7_pool');

  // P: Gág's page 18, the pond; puppets stand in front of the water layer
  const P = paperCam(p, 'p18', { x: 800, y: 330, z: 1.2 }, { after: 'water' });
  P.layer('water').setAttribute('mask', 'url(#s7_drain)');
  // hand strokes like the bank's own hatching: short curved arcs of 10–30 px that follow the pond's rings, uneven in length, spacing and weight, seeded once
  const mudG = mk('g', { fill: 'none', stroke: '#1e1a16', 'stroke-linecap': 'round' }), mudD = [];
  for (let ring = 0, n = 0; ring < 22; ring++) {
    const f = 1.04 - ring * .043 + (rnd(ring * 13 + 1) - .5) * .03;
    for (let a = rnd(ring + 70) * .3; a < 6.283; n++) {
      const len = 10 + rnd(n * 7 + 3) * 20, rx = PRX * f, ry = PRY * f, da = len / rx, a1 = a + da, am = a + da / 2;
      const pt = t => [PC[0] + Math.cos(t) * rx, PC[1] + Math.sin(t) * ry + (rnd(n * 3 + 9) - .5) * 4];
      const [x0, y0] = pt(a), [x1, y1] = pt(a1), [xm, ym] = pt(am), bend = (rnd(n * 5 + 2) - .5) * 5;
      mudD.push(`M${x0.toFixed(1)},${y0.toFixed(1)} Q${(xm + bend * .3).toFixed(1)},${(ym + bend).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`);
      a += da + .02 + rnd(n * 11 + 4) * .1;
    }
  }
  mudG.innerHTML = `<path d="${mudD.filter((_, i) => i % 3).join(' ')}" stroke-width="1.7"/><path d="${mudD.filter((_, i) => !(i % 3)).join(' ')}" stroke-width="3"/>`;
  mudG.setAttribute('mask', 'url(#s7_mud)');
  P.layer('water').after(mudG);
  // the ripple breathes; from "Each cat took a sip" the whole pond pulls in about its centre on twos, down to 0.3, the bank showing as it goes
  const pondK = q => 1 - .7 * Math.floor(ease(k01(q, s7_SIP, s7_GONE - .1 - s7_SIP)) * 12) / 12;
  P.move('water', q => `translate(${(3 * Math.sin(q * 1.4)).toFixed(1)} ${(1.5 * Math.sin(q * 2.1)).toFixed(1)}) translate(${WC[0]} ${WC[1]}) scale(${pondK(q).toFixed(3)}) translate(${-WC[0]} ${-WC[1]})`);
  const at18 = pagePos('p18', 'man18'), man = cutPuppet(P.stage, 'man18');
  P.to({ x: 780, y: 360, z: 1.4 }, 0, s7_C0 + .1)
   .cut({ x: 1000, y: 410, z: 2 }, s7_C0).cut({ x: 1060, y: 410, z: 2 }, s7_B2)
   .cut({ x: 800, y: 335, z: 1.25 }, s7_WIDE).cut({ x: 800, y: 297, z: 1.12 }, s7_WIDE + .5).to({ x: 800, y: 292, z: 1.06 }, s7_WIDE + .5, s7_REF - s7_WIDE)
   .cut({ x: 800, y: 330, z: 1.55 }, s7_WELL).to({ x: 760, y: 335, z: 1.72 }, s7_WELL, s7_SIP - .3 - s7_WELL)
   .cut({ x: 1010, y: 405, z: 1.9 }, s7_SIP - .3).to({ x: 1010, y: 415, z: 1.98 }, s7_SIP - .3, s7_GONE - s7_SIP + .6);
  // cats for the wide shots and the lapping: a crowd that fills the bank on each refrain line
  const L18 = lettering(P.stage, s7_kids.flat(), { x: 800, y: 0, s: 1.3 });
  const bankL = catCrowd(P.stage, { names: s7_CATS, n: 18, box: [300, 400, 700, 560], seed: 7, s: [1.1, .8] });
  const lapCats = [['cat8a', 720, 500, 1.5, false], ['cat22c', 780, 470, 1.3, false], ['cat8b', 1200, 560, 1.4, true], ['cat23d', 1090, 570, 1.1, true],
    ['cat25a', 990, 540, 1.3, false], ['cat22d', 880, 545, 1.2, false]].map(([n, x, y, s, flip], i) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  // the close-up cats (shots B): big paper cats at the bank; Gág's own page is blurred behind
  const bigA = [['cat8a', 720, 535, 1.3, false, 0], ['cat8c', 830, 540, 1.5, false, 1], ['cat23b', 950, 540, 1.4, false, 2]].map(([n, x, y, s, flip, i]) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  const bigB = [['cat23a', 760, 540, 1.4, false, 3], ['cat8c', 880, 540, 1.6, true, 4], ['cat8d', 1000, 540, 1.3, false, 5]].map(([n, x, y, s, flip, i]) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  P.soft(s7_C0 - .01, true).soft(s7_WIDE - .01, false);

  // Q: Gág's page 19, the dry hollow ("and the pond was gone!"), with the old man and the cats sitting round it
  const Q = paperCam(p, 'p19', { x: 800, y: 450, z: 1.3 });
  const at19 = pagePos('p19', 'man19'), man19 = cutPuppet(Q.stage, 'man19');
  Q.cut({ x: 820, y: 550, z: 1.3 }, s7_GONE).to({ x: 880, y: 560, z: 1.4 }, s7_GONE, 3);

  const lapping0 = q => q > s7_SIP;
  const turnOut = pageTurn(p, 0, .45, 'out'), turnIn = pageTurn(p, D - .1, .45, 'in');
  stopClock(D, (q, f) => {
    const inQ = q >= s7_GONE;
    vis(P.root, !inQ); vis(Q.root, inQ);
    P.apply(q, f); Q.apply(q, f);
    const wide = (q < s7_C0 || q >= s7_WIDE) && !inQ, closeA = q >= s7_C0 && q < s7_B2, closeB = q >= s7_B2 && q < s7_WIDE;
    // the old man at the left of the pond: breathes, rocks, looks at the water; on "Well, here is a great deal of water" he leans to it
    vis(man.g, wide && q < s7_SIP - .3);
    const lean = ease(k01(q, s7_WELL, .7)) * (q < s7_SIP ? 1 : 0), nod = q >= s7_WELL && q < s7_SAID ? Math.max(0, Math.sin((q - s7_WELL) * 4.2)) : 0;
    man.pose({ x: at18.x, y: at18.y, s: at18.s, sq: 1 + .02 * Math.sin(q * 2.2) - lean * .012 - nod * .008, rot: Math.sin(q * 1.5) * 1.8 + lean * 6 + nod * 1.2, bob: 2 * Math.abs(Math.sin(q * 1.1)),
      parts: { head: nod * 14 + lean * 10 + Math.sin(q * 1.7) * 3, bundle: Math.sin(q * 2.2) * 2 - lean * 4 } }, f);
    // the bank cats: Gág's page already has hers; ours come in a few at a time, A trots in, C packs on each word
    bankL.pose(q, f, { from: .8, every: i => i < 6 ? i * .22 : s7_REF - 6.5 + (i - 6) * .55, walk: { v: 60, t0: .8, t1: s7_C0 - .1 }, seethe: q >= s7_WIDE ? .3 : 0 });   // arriving on legs; then a slow shuffle
    vis(bankL.g, !(q >= s7_C0 && q < s7_WIDE) && q < s7_SIP - .3);
    // the refrain's lettering over the sky
    const times = {}; for (const n in s7_RW) times[n] = s7_T(s7_RW[n]);
    vis(L18.g, q >= s7_WIDE && q < s7_WELL); L18.show(q, times, f, { hideAt: s7_WELL });
    // close-ups: each mew a head bob; the cats breathe
    const mewT = [s7_T(2.29), s7_T(2.55), s7_T(2.81), s7_T(3.25), s7_T(3.55)];
    const bob = (c, ts) => { let b = 0; for (const t of ts) { const u = q - t - c.i * .04; if (u >= 0 && u < .3) b = Math.max(b, Math.sin(u / .3 * Math.PI)); } return b; };
    bigA.forEach(c => { const L = catLife(q, c.i, { head: 7 }); L.parts.head += 14 * bob(c, mewT); vis(c.p.g, closeA); c.p.pose({ parts: L.parts, x: c.x, y: c.y, s: c.s * (1 + .02 * bob(c, mewT)), flip: c.flip, sq: 1 + .012 * Math.sin(q * 2.3 + c.i) + .05 * bob(c, mewT), rot: Math.sin(q * 1.6 + c.i) * 1 - bob(c, mewT) * 2 }, f + c.i); });
    bigB.forEach(c => { const L = catLife(q, c.i, { head: 7 }); L.parts.head += 14 * bob(c, mewT); vis(c.p.g, closeB); c.p.pose({ parts: L.parts, x: c.x, y: c.y, s: c.s, flip: c.flip, sq: 1 + .012 * Math.sin(q * 2.3 + c.i) + .06 * bob(c, mewT), rot: Math.sin(q * 1.6 + c.i) * 1 - bob(c, mewT) * 2 }, f + c.i); });
    // the sips: the cats gather at the water on his word; each dips its head a few times; from "Each cat took a sip" the water steps away on twos
    const lapOn = q >= s7_WELL + .4 && !inQ;
    const wk = pondK(q); pool.setAttribute('rx', (PRX * wk).toFixed(1)); pool.setAttribute('ry', (PRY * wk).toFixed(1));
    const drain = k01(q, s7_SIP, s7_GONE - .2 - s7_SIP), steps = Math.floor(ease(drain) * 12) / 12;
    for (const c of lapCats) {
      vis(c.p.g, lapOn);
      const LL = catLife(q, c.i); if (lapping0(q)) LL.parts.head += 45 * Math.max(0, Math.sin((q - s7_SIP) * 5.5 + c.i * 1.7));
      const lapping = q > s7_SIP, lap = Math.max(0, Math.sin((q - s7_SIP) * 5.5 + c.i * 1.7));
      c.p.pose({ parts: LL.parts, x: c.x, y: c.y, bob: lapping ? -8 * lap : 0, s: c.s, flip: c.flip, rot: (c.flip ? -1 : 1) * (lapping ? lap * 16 : 0) + Math.sin(q * 1.5 + c.i), sq: 1 + .012 * Math.sin(q * 2 + c.i) - (lapping ? lap * .05 : 0) }, f + c.i);
    }
    // page 19: the dry hollow; the old man spreads his hand over it
    vis(man19.g, inQ);
    const bend = ease(k01(q, s7_GONE + .2, .6));
    man19.pose({ x: at19.x, y: at19.y, s: at19.s, sq: 1 + .02 * Math.sin(q * 2.2), rot: -bend * 2 + Math.sin(q * 1.5) * 1.4, bob: 2 * Math.abs(Math.sin(q * 1.2)),
      parts: { head: Math.sin(q * 1.6) * 3 + bend * 5 + Math.sin((q - s7_GONE) * 3) * 3 * bend, armR: -bend * 28 + Math.sin((q - s7_GONE) * 3) * (4 + 14 * bend) } }, f);
    turnOut(q); turnIn(q);
  });
}
