/* scene3.js — the wolf meets Red on the path (storyboard v2, scene 3).
   Shots (beat clock): 1 two-shot, the wolf pops out of scene 2's bush, Red startles and turns (0 – s03 -.05);
   2 her view of him, close: he faces her, lifts the cap high off his head, sweeps it out to his side at chest height
   and bows deep, paw on his heart, peeks up, then puts the cap back ("Good morning, Little Red Riding Hood!"), her
   hood soft at the right edge; 3 two-shot, "Where are you off to?", Red listening; 4 Red's medium close-up over the
   wolf's blurred head and ear, she points ahead (s03b), and a torn-paper picture of the three oaks over Grandma's
   house pops up where she points (grandmaOut's wide, "It's under the three big oaks");
   5 insert: his paw lifts the cloth off her basket, the cake ("Cake…"); 6 the wolf front, rubbing paws, Red blurred
   behind and unaware, a slow push in and the hold on the rub (to the end). */
'use strict';
const PRE3 = 2.2;
const s3_C = (c, t = 0) => clipAt('scene3', PRE3, c, t);
const s3_BX = 1180, s3_BY = 742, s3_POP = .35, s3_HOP = .8, s3_LAND = 1.2;
sfx('scene3', 0, 'forest', .5, { loop: true });   // a bed: it repeats to the end of the scene
sfx('scene3', .3, 'rustle', 1.6);
sfx('scene3', s3_HOP, 'whoosh', .8); sfx('scene3', s3_LAND, 'pad', 1.6);
[[.24, 'step1'], [.71, 'step2'], [1.42, 'step3'], [2.05, 'step1']].forEach(([t, n]) => sfx('scene3', t, n, 1.2));
sfx('scene3', s3_C('s03', .32), 'whoosh', .6);   // the cap swept off and out

// A torn paper rectangle w × h round (0, 0), for the oaks picture's frame and clip (scene 4's thought picture).
function s3_torn(w, h, seed) {
  const pts = [], n = 9;
  const side = (x0, y0, x1, y1, k) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + 9 * jit(seed, k + i), y0 + (y1 - y0) * u + 9 * jit(seed, k + 40 + i)]); } };
  side(-w / 2, -h / 2, w / 2, -h / 2, 0); side(w / 2, -h / 2, w / 2, h / 2, 100); side(w / 2, h / 2, -w / 2, h / 2, 200); side(-w / 2, h / 2, -w / 2, -h / 2, 300);
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L') + ' Z';
}
// The oaks picture flickers in on paper (on twos) and fades out: 0 hidden … 1 full.
const s3_pop = (q, t0, t1) => q < t0 || q >= t1 + .5 ? 0 : q >= t1 ? [.7, .45, .2, .08, 0, 0][Math.floor((q - t1) * FPS)] : [.5, .15, .8, .4, 1][Math.min(4, Math.floor((q - t0) * FPS))];
const s3_OAKS_VIEW = { x: 960, y: 420, z: .85 };   // grandmaOut's wide that counts the three oaks (sets report)
// The front right arm's joints (cast.js: shoulder 38,-140, elbow 38,-82, hand 38,-26) and the lift to the cap: the paw
// goes up the outside, elbow out (a quadratic in joint angles through LIFT_MID), to the cap's right brim at LIFT_END.
const s3_LIFT_MID = [-60, -140], s3_LIFT_END = [-156.5, -36];   // rua, rfa; LIFT_END puts the paw at (49, -248), on the brim's tip
const s3_rot = (x, y, cx, cy, a) => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
const s3_hand = (ua, fa) => s3_rot(...s3_rot(38, -26, 38, -82, fa), 38, -140, ua);   // the paw's centre in the puppet's frame

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

  // B: her view of him for the bow: the wolf to us (to her), close; the bush soft behind him, her hood soft at the right
  const B = paperCam(p, 'forest', { x: 1425, y: 572, z: 2.7 }).soft(0, 'all'), backB = mk('g', { filter: 'url(#s3_blurC)' }, B.stage);
  prop(backB, bushBackSVG(s3_BX, s3_BY)); prop(backB, bushFrontSVG(s3_BX, s3_BY));
  const bowG = mk('g', {}, B.stage), wolfB = wolfPuppet(bowG), redB = redPuppet(mk('g', { filter: 'url(#s3_blurR)' }, B.stage));
  // the cap in his paw from the frame they touch: the head's cap (cast.js capF), drawn over the head (the puppet's arm is
  // under it), held on the forearm; on the sweep out it settles into the puppet's own cap-in-hand, which takes over
  const capT = mk('g', {}, wolfB.g);
  prop(capT, `<g filter="url(#paper)"><path d="M-46,-248 C-44,-288 44,-288 46,-248 Q0,-238 -46,-248 Z" fill="#6e4a30"/></g>`);
  const capBrim = prop(capT, `<g filter="url(#paper)"><path d="M-40,-246 Q0,-232 40,-246 L44,-240 Q0,-226 -44,-240 Z" fill="#5a3b24"/></g>`);
  B.to({ x: 1415, y: 580, z: 2.8 }, S1, S2 - S1);

  // R: the wolf's view of her (forestRev), his head and ear big and soft at the left.
  const R = paperCam(p, 'forestRev', { x: 820, y: 450, z: 1 }).soft(0, 'all'), redR = redPuppet(R.stage);
  const wolfR = wolfPuppet(mk('g', { filter: 'url(#s3_blurR)' }, R.stage));
  R.to({ x: 870, y: 430, z: 1.12 }, S3 + .2, 3.2);

  // the oaks picture over R: grandmaOut's wide in a torn paper frame, up where her arm points
  const OK0 = C('s03b', 1.15), OK1 = C('s03b', 2.85), oaks = mk('g', {}, p), oaksIn = mk('g', {}, oaks);
  prop(oaksIn, `<g filter="url(#paper)"><path d="${s3_torn(1640, 940, 311)}" fill="#2a1c12" opacity=".25" transform="translate(22,26)"/><path d="${s3_torn(1640, 940, 312)}" fill="#f6efe0"/></g>`);
  mk('path', { d: s3_torn(1540, 840, 313) }, mk('clipPath', { id: 's3_oaksClip' }, defs));
  const OV = paperCam(mk('g', { transform: 'translate(-800,-450)' }, mk('g', { 'clip-path': 'url(#s3_oaksClip)' }, oaksIn)), 'grandmaOut', s3_OAKS_VIEW, { after: 'house', stages: ['inside'] });
  OV.to({ ...s3_OAKS_VIEW, z: s3_OAKS_VIEW.z * 1.06 }, OK0, OK1 - OK0 + .5);

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
    const shot = q < S1 ? 'A' : q < S2 ? 'B' : q < S3 ? 'A' : q < S4 ? 'R' : q < S5 ? 'I' : 'C', pop = shot === 'R' ? s3_pop(q, OK0, OK1) : 0;
    vis(A.root, shot === 'A'); vis(B.root, shot === 'B'); vis(R.root, shot === 'R'); vis(oaks, pop > 0); vis(I.root, shot === 'I'); vis(Cm.root, shot === 'C');
    const wag = 8 * Math.sin(q * 5);

    if (shot === 'A') {
      A.apply(q, f);
      // the bush shakes, the eyes go, he rises behind it, peeks, hops out onto the path
      const shake = between(q, .3, .78) ? 3 * jit(f, 41) : 0;
      tf(bushB, `rotate(${shake.toFixed(2)},${s3_BX},${s3_BY})`); tf(bushF, `rotate(${(-shake * .7).toFixed(2)},${s3_BX},${s3_BY})`);
      eyes(q < s3_POP ? 1 : 0, 1);
      const rise = 220 - 180 * span(q, s3_POP, s3_POP + .15), u = k01(q, s3_HOP, s3_LAND - s3_HOP), air = arc(q, s3_HOP, s3_LAND - s3_HOP);
      const land = between(q, s3_LAND, s3_LAND + 2 / FPS) ? 8 : 0, s = .6;
      const preen = between(q, 1.5, 1.95), ask = between(q, C('s03', 2.6), C('s03', 4.1));
      wolf.pose({ x: s3_BX + (1400 - s3_BX) * ease(u), y: hipOn(WOODS, s, 200) + rise * (1 - ease(u)) - 80 * air + land, s, turn: 1,
        near: -25 * air, far: 25 * air, kNear: 55 * air, kFar: 55 * air,
        lean: ask ? 8 : 0, cap: 'on', ua: preen ? -20 : ask ? -46 : 6, fa: preen ? -100 : ask ? -20 : -6, headR: ask ? -4 : 0, tail: q < s3_LAND ? 30 * air : wag, look: 1, ear: between(q, .55, .7) ? 1 : 0,
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

    if (shot === 'B') {
      B.apply(q, f);
      // the paw goes up the outside to the cap, takes it off, sweeps it out to his side (never across his face);
      // the bow: head down, eyes shut, the other paw on his heart, a dip; he peeks up on "Hood!"; the cap goes back on
      const TOUCH = C('s03', .3), HELD = C('s03', .65), up = span(q, C('s03', .0), TOUCH), out = span(q, TOUCH, HELD);
      const back = span(q, C('s03', 2.08), C('s03', 2.28)), down = span(q, C('s03', 2.32), C('s03', 2.55));
      const bow = span(q, C('s03', .35), C('s03', .75)) * (1 - span(q, C('s03', 1.85), C('s03', 2.1)));
      const [MU, MF] = s3_LIFT_MID, [EU, EF] = s3_LIFT_END, lift = (a, m, e) => (1 - up) * (1 - up) * a + 2 * up * (1 - up) * m + up * up * e;
      const rua = q < TOUCH ? lift(6, MU, EU) : q < C('s03', 2.08) ? EU + (-95 - EU) * out : q < C('s03', 2.32) ? -95 - 89 * back : -184 + 190 * down;
      const rfa = q < TOUCH ? lift(-4, MF, EF) : q < C('s03', 2.08) ? EF + (40 - EF) * out : q < C('s03', 2.32) ? 40 - 50 * back : -10 + 6 * down;
      const headR = 7 * bow + 2 * Math.sin(q * 1.5), nod = 52 * bow, X = 1400, FEET = 760 + 200 * 1.15;
      const grip = q >= TOUCH - 1e-3 && q < HELD - 1e-3, cap = q < TOUCH - 1e-3 || q >= C('s03', 2.28) ? 'on' : grip ? 'off' : 'hand';
      tf(bowG, `translate(${X},${FEET}) scale(${(1 + .03 * bow).toFixed(3)},${(1 - .1 * bow).toFixed(3)}) translate(${-X},${-FEET})`);
      vis(capT, grip);
      if (grip) {   // the cap goes with the paw from where it sat on his head at the touch (offset v0 from the paw), sliding
        // into the paw's grip as it sweeps out, where it matches the puppet's cap-in-hand (cast.js capInHand: 60 wide, centred
        // 10 below the paw's centre along the forearm), which takes over at HELD
        const fT = Math.round(TOUCH * FPS), hT = 7 * span(TOUCH, C('s03', .35), C('s03', .75)) + 2 * Math.sin(TOUCH * 1.5) + jit(fT, 9) * .7;
        const onHead = s3_rot(0, -248, 8, -160, hT), pT = s3_hand(EU + jit(fT, 21) * .6, EF + jit(fT, 22) * .6);
        const u = out, ua = rua + jit(f, 21) * .6, fa = rfa + jit(f, 22) * .6, h = s3_hand(ua, fa), v1 = s3_rot(0, 10, 0, 0, ua + fa);
        const x = h[0] + (onHead[0] - pT[0]) * (1 - u) + v1[0] * u, y = h[1] + (onHead[1] - pT[1]) * (1 - u) + v1[1] * u;
        const r = hT * (1 - u) + (ua + fa - (EU + EF + 55) * (1 - u)) * u,   /* the forearm's angle when held (-95 + 40), eased to from upright */ sx = 1 + (.652 - 1) * u, sy = 1 + (.6 - 1) * u;
        tf(capT, `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${r.toFixed(2)}) scale(${sx.toFixed(3)},${sy.toFixed(3)}) translate(0,248)`);
        capBrim.setAttribute('opacity', (1 - u).toFixed(2));
      }
      wolfB.pose({ x: X, y: 760 + 3 * Math.sin(q * 2.4), s: 1.15, turn: 0, head: 'F', cap, rua, rfa,
        lua: -6 - 16 * bow, lfa: 4 - 114 * bow, nod, headR, look: bow > .5 ? .4 : 0,
        brow: bow > .5 && q > C('s03', 1.3) ? -.6 : 0, ear: between(q, C('s03', .3), C('s03', .45)) ? 1 : 0,
        mouth: lips(q, 'scene3', PRE3, 's03'), shut: between(q, C('s03', .7), C('s03', 1.3)) || blinking(q, [C('s03', 2.4)]) }, f);
      redB.pose({ x: 1795, y: 990 + 3 * Math.sin(q * 2.2 + 1), s: 2.2, turn: -1, headR: 3 * Math.sin(q * 1.3), cape: 3 + 2 * Math.sin(q * 1.4),
        brow: 1, shut: blinking(q, [C('s03', 1.0)]) }, f);
      return;
    }

    if (shot === 'R') {
      R.apply(q, f);
      if (pop > 0) {   // the oaks picture: up at the left, where her hand points
        OV.apply(q, f); oaks.setAttribute('opacity', Math.min(1, pop * 1.4).toFixed(2));
        tf(oaksIn, `translate(385,212) scale(${(.38 * (.85 + .15 * Math.min(1, pop))).toFixed(4)}) rotate(${(-2 + .6 * jit(f, 47)).toFixed(2)})`);
      }
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
