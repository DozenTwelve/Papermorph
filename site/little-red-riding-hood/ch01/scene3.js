/* scene3.js — the wolf meets Red on the path (storyboard v2, scene 3).
   Shots (beat clock): 1 two-shot, the wolf pops out of scene 2's bush, Red startles and turns (0 – s03 -.05);
   2 the wolf's close-up bow, cap off ("Good morning, Little Red Riding Hood!"); 3 two-shot, "Where are you off to?",
   Red listening; 4 Red's medium close-up over the wolf's blurred head and ear, she points ahead (s03b);
   5 insert: his paw lifts the cloth off her basket, the cake ("Cake…"); 6 the wolf front, rubbing paws, Red blurred
   behind and unaware, a slow push in and the hold on the rub (to the end). */
'use strict';
const PRE3 = 2.2;
const s3_C = (c, t = 0) => clipAt('scene3', PRE3, c, t);
const s3_BX = 1180, s3_BY = 742, s3_POP = .35, s3_HOP = .8, s3_LAND = 1.2;
sfx('scene3', 0, 'forest', .5, 10);   // the bed: shared.js lays it again every 9.5 s; 10 s long, so a seek joins it part-way
sfx('scene3', .3, 'rustle', 1.6);
sfx('scene3', s3_HOP, 'whoosh', .8); sfx('scene3', s3_LAND, 'pad', 1.6);
[[.24, 'step1'], [.71, 'step2'], [1.42, 'step3'], [2.05, 'step1']].forEach(([t, n]) => sfx('scene3', t, n, 1.2));
sfx('scene3', s3_C('s03', .12), 'whoosh', .5);   // the cap swept off

function scene3(p, D) {
  const C = s3_C, k01 = (q, a, d) => Math.min(1, Math.max(0, (q - a) / d)), arc = (q, a, d) => Math.sin(Math.PI * k01(q, a, d));
  const defs = mk('defs', {}, p);
  defs.innerHTML = `<filter id="s3_blurR" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="s3_blurC" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <clipPath id="s3_hide" clipPathUnits="userSpaceOnUse"><path d="M-5000,-5000 H1325 V758 H-5000 Z M1325,-5000 H9000 V9000 H1325 Z"/></clipPath>`;
  const S1 = C('s03', -.05), S2 = C('s03', 2.55), S3 = C('s03b', -.15), S4 = C('s03c', -.1), S5 = C('s03c', 1.15);

  // A: the path by the bush (shots 1–3). The wolf hides behind the bush (clipped below its foot until he is out).
  const A = paperCam(p, 'forest', { x: 1430, y: 600, z: 1.9 });
  const wolfWrap = mk('g', { 'clip-path': 'url(#s3_hide)' }, A.stage), wolf = wolfPuppet(wolfWrap);
  const bushB = prop(A.stage, bushBackSVG(s3_BX, s3_BY)), eyes = bushEyes(A.stage, s3_BX, s3_BY - 50), bushF = prop(A.stage, bushFrontSVG(s3_BX, s3_BY));
  const red = redPuppet(A.stage), go = walker(1560, .6, { period: .95, A: 24 }, 1, 2);
  A.to({ x: 1490, z: 2 }, s3_HOP, 1.2).cut({ x: 1470, y: 565, z: 3.4 }, S1).cut({ x: 1570, y: 610, z: 2.15 }, S2);

  // R: the wolf's view of her (forestRev), his head and ear big and soft at the left.
  const R = paperCam(p, 'forestRev', { x: 820, y: 450, z: 1 }).soft(0, 'all'), redR = redPuppet(R.stage);
  const wolfR = wolfPuppet(mk('g', { filter: 'url(#s3_blurR)' }, R.stage));
  R.to({ x: 870, y: 430, z: 1.12 }, S3 + .2, 3.2);

  // I: insert of her basket, his paw lifting the cloth (the soft woods behind).
  const I = paperCam(p, 'forest', { x: 1700, y: 600, z: 2.2 }).soft(0, 'all'), bWrap = mk('g', {}, I.stage), basket = basketProp(bWrap);
  const BXI = 1700, BYI = 720, BS = .8, HY = BYI - 240 * BS;
  prop(bWrap, `<g filter="url(#paper)"><rect x="${BXI - 11}" y="${HY - 300}" width="22" height="300" rx="9" fill="#f4efe2"/><circle cx="${BXI}" cy="${HY}" r="15" fill="#f6d2b5"/></g>`);
  const paw = prop(I.stage, `<g filter="url(#paper)"><rect x="-420" y="-13" width="420" height="26" rx="12" fill="${ARM}"/><circle cx="0" cy="0" r="19" fill="${FUR2}"/>
    <path d="M14,-12 l12,-4 M16,0 l13,0 M14,12 l12,4" stroke="#f6efe0" stroke-width="3.5" stroke-linecap="round"/></g>`);
  I.to({ z: 2.4, y: 610 }, S4, 1.1);

  // C: the wolf to us, close; Red small and soft behind him on the path, the bush soft at the left.
  const Cm = paperCam(p, 'forest', { x: 1500, y: 600, z: 2.4 }).soft(0, 'all'), back = mk('g', { filter: 'url(#s3_blurC)' }, Cm.stage);
  prop(back, bushBackSVG(s3_BX, s3_BY)); prop(back, bushFrontSVG(s3_BX, s3_BY));
  const redC = redPuppet(back), wolfC = wolfPuppet(Cm.stage);
  Cm.to({ x: 1460, y: 578, z: 2.85 }, S5 + .1, 4.4);

  stopClock(D, (q, f) => {
    const shot = q < S3 ? 'A' : q < S4 ? 'R' : q < S5 ? 'I' : 'C';
    vis(A.root, shot === 'A'); vis(R.root, shot === 'R'); vis(I.root, shot === 'I'); vis(Cm.root, shot === 'C');
    const wag = 8 * Math.sin(q * 5);

    if (shot === 'A') {
      A.apply(q, f);
      // the bush shakes, the eyes go, he rises behind it, peeks, hops out onto the path
      const shake = between(q, .3, .78) ? 3 * jit(f, 41) : 0;
      tf(bushB, `rotate(${shake.toFixed(2)},${s3_BX},${s3_BY})`); tf(bushF, `rotate(${(-shake * .7).toFixed(2)},${s3_BX},${s3_BY})`);
      eyes(q < s3_POP ? 1 : 0, 1);
      const rise = 220 - 180 * span(q, s3_POP, s3_POP + .15), u = k01(q, s3_HOP, s3_LAND - s3_HOP), air = arc(q, s3_HOP, s3_LAND - s3_HOP);
      const land = between(q, s3_LAND, s3_LAND + 2 / FPS) ? 8 : 0, s = .6;
      const bow = span(q, C('s03', .05), C('s03', .45)) * (1 - span(q, C('s03', 1.95), C('s03', 2.3)));
      const capOff = between(q, C('s03', .1), C('s03', 2.3)), capOn = between(q, C('s03', 2.3), C('s03', 2.5));
      const preen = between(q, 1.5, 1.95), ask = between(q, C('s03', 2.6), C('s03', 4.1));
      wolf.pose({ x: s3_BX + (1400 - s3_BX) * ease(u), y: hipOn(WOODS, s, 200) + rise * (1 - ease(u)) - 80 * air + land, s, turn: 1,
        near: -25 * air, far: 25 * air, kNear: 55 * air, kFar: 55 * air,
        lean: 28 * bow + (ask ? 8 : 0), cap: capOff ? 'hand' : 'on',
        ua: capOff ? 5 : capOn ? -150 : preen ? -20 : ask ? -46 : 6, fa: capOff ? -85 * bow : capOn ? -30 : preen ? -100 : ask ? -20 : -6,
        headR: -10 * bow + (ask ? -4 : 0), tail: q < s3_LAND ? 30 * air : wag, look: 1, ear: between(q, .55, .7) ? 1 : 0,
        brow: between(q, .5, s3_HOP) ? -1 : 0, mouth: lips(q, 'scene3', PRE3, 's03'),
        shut: blinking(q, [.65, C('s03', 1.2), C('s03', 3.5)]) }, f);
      // Red: two steps on, the hop of fright, the whole-body turn to him, a hop back; then she listens
      const w = go(q), turn = 1 - 2 * span(q, 1.45, 1.78);
      const jump = 16 * arc(q, 1.25, .17) + 10 * arc(q, 1.85, .2), fright = between(q, 1.25, 1.6);
      red.pose({ x: w.x + 26 * span(q, 1.85, 2.05), y: hipOn(WOODS, s) + w.drop * s - jump, s, turn,
        near: w.near, far: w.far, kNear: w.kNear * (1 - span(q, .95, 1.12)) + 30 * arc(q, 1.85, .2), kFar: w.kFar + 30 * arc(q, 1.85, .2),
        cape: 3 + 3 * Math.sin(2 * w.ph + .6) + 9 * (jump > 1), ua: fright ? -30 : -8 + 6 * Math.sin(w.ph), fa: fright ? -100 : -78,
        swing: q < .95 ? 9 * Math.sin(w.ph - 1) : 4 * Math.sin(q * 2.2), headR: q > C('s03', 3) && q < S3 ? 5 : 2 * Math.sin(2 * w.ph),
        mouth: fright ? 'E' : 'X', brow: between(q, 1.25, 2.4) ? 1 : 0,
        shut: blinking(q, [C('s03', .9), C('s03', 3.2)]) }, f);
      return;
    }

    if (shot === 'R') {
      R.apply(q, f);
      const lift = span(q, C('s03b', 0), C('s03b', .3)) * (1 - span(q, C('s03b', 1.0), C('s03b', 1.3)));
      const pt = span(q, C('s03b', 1.15), C('s03b', 1.45)) * (1 - span(q, C('s03b', 2.9), C('s03b', 3.25)));
      redR.pose({ x: 880, y: 430 + 194 * 2, s: 2, head: 'F', mouth: lips(q, 'scene3', PRE3, 's03b'),
        nod: 6 * arc(q, C('s03b', .45), .3), headR: 3 * Math.sin(q * 1.7) - 6 * pt,
        rua: 6 - 34 * lift, rfa: -4 - 30 * lift, lua: -6 + 146 * pt, lfa: 4 + 16 * pt, swing: 3 * Math.sin(q * 2),
        shut: blinking(q, [C('s03b', 1.6), C('s03b', 3.3)]) }, f);
      // his ear jumps at "Grandma's" and at "three big oaks"; his jaw drops a little at "house"
      wolfR.pose({ x: 210, y: 1150 + 4 * Math.sin(q * 3), s: 2.6, turn: 1, cap: 'on', look: 1,
        ear: between(q, C('s03b', .1), C('s03b', .45)) || between(q, C('s03b', 1.85), C('s03b', 2.2)) ? 1 : 0,
        jaw: .25 * arc(q, C('s03b', .55), .8), headR: -3 + 2 * Math.sin(q * 1.3), tail: wag,
        shut: blinking(q, [C('s03b', 2.6)]) }, f);
      return;
    }

    if (shot === 'I') {
      I.apply(q, f);
      const k = q - S4, open = .55 * span(k, .25, .55), sw = 2.5 * Math.sin(q * 2.2);
      tf(bWrap, `rotate(${sw.toFixed(2)},${BXI},${HY})`);
      basket.pose(BXI, BYI, BS, open);
      // his paw follows the cloth's left corner, then slips away
      const cx = BXI + (-138 - 190 * open) * BS - 6, cy = BYI + (-150 + 120 * open) * BS + 6 - 30;
      const inn = span(k, 0, .25), out = span(k, .75, .95);
      tf(paw, `translate(${(cx - 300 * (1 - inn) - 420 * out).toFixed(1)},${cy.toFixed(1)}) rotate(${(-12 + 4 * jit(f, 43)).toFixed(1)})`);
      return;
    }

    Cm.apply(q, f);
    const k = q - C('s03c'), slow = Math.floor(q * FPS / 4) % 2 ? 1 : -1, rub = k > 2.8 ? onTwos(q) : k > 1.35 ? slow : 0;
    const look = k < 1.2 ? 1 : between(k, 2.6, 2.85) ? 1 : 0;
    const brow = k < 1.2 ? 1 : k < 2.8 ? -.8 : k < 4.7 ? 1 : (Math.floor(q * FPS / 3) % 2 ? 1 : .3);
    wolfC.pose({ x: 1400, y: 745, s: 1.05, turn: 0, head: 'F', cap: 'on', look, brow, mouth: lips(q, 'scene3', PRE3, 's03c'),
      rua: -25, rfa: 130 + 10 * rub, lua: 25, lfa: -130 + 10 * rub, headR: 3 * Math.sin(q * 1.6), nod: 3 * Math.sin(q * 3.1),
      shut: blinking(q, [C('s03c', 2.3), C('s03c', 5.0)]) }, f);
    redC.pose({ x: 1700, y: hipOn(765, .42), s: .42, turn: 1, swing: 6 * Math.sin(q * 2.2), headR: k > 3.1 && k < 4.3 ? 8 : 2 * Math.sin(q * 1.1),
      cape: 3 + 2 * Math.sin(q * 1.4), shut: blinking(q, [C('s03c', 1.6), C('s03c', 4.8)]) }, f);
  });
}
