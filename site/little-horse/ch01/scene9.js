/* scene9.js — The little rabbit (river, going home): the end gag. Little Horse nearly tells the rabbit the river's depth
   by his own legs, looks at its tiny ones, and carries it across on his back. Beat clock = PRE9 + scene9's clip times.
   Uncle Ox stands in the far-side shallows facing left (behind Little Horse); Squirrel on the rock at 470. */
'use strict';
const PRE9 = 1.5;
const s9_T = (clip, t = 0) => clipAt('scene9', PRE9, clip, t);

// Eased keys [[t, v], …]: v holds before the first and after the last key, eases between neighbours.
function s9_kf(q, keys) {
  if (q <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t0, a] = keys[i - 1], [t1, b] = keys[i];
    if (q < t1) return a + (b - a) * ease((q - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
}
// A long walk at an even pace (ease in and out over r s only), from a to b between t0 and t1, for a puppet of scale s:
// x, the distance walked in its own units (d) and stand, like route().
function s9_glide(q, t0, t1, a, b, s, r = .5) {
  const T = t1 - t0, v = (b - a) / (T - r), t = Math.min(T, Math.max(0, q - t0));
  const x = a + (t < r ? v * t * t / (2 * r) : t > T - r ? (b - a) - v * (T - t) ** 2 / (2 * r) : v * (t - r / 2));
  const stand = q < t0 ? 1 : q < t1 ? Math.max(0, 1 - (q - t0) / .25) : Math.min(1, (q - t1) / .25);
  return { x, d: Math.abs(x - a) / s, stand };
}
// A rabbit hop from a to b (points) over u 0..1: height leads, the sideways move comes late, so it clears what is
// between (his neck and mane). Returns [x, y].
function s9_hop(a, b, u, h) {
  const ux = ease(Math.min(1, Math.max(0, (u - .3) / .7))), uy = Math.sin(Math.PI / 2 * Math.min(1, u / .55));
  const top = Math.min(a[1], b[1]) - h;
  const y = u < .55 ? a[1] + (top - a[1]) * uy : top + (b[1] - top) * ease((u - .55) / .45);
  return [a[0] + (b[0] - a[0]) * ux, y];
}

function scene9(p, D) {
  // The river is the rabbit's: they meet at the far bank's lip; Uncle Ox grazes on the near bank (left, head kept under the tree's branch) with Squirrel.
  const SH = 1.05, SR = .55, OX = -250, RX = 1340, STOP = 1500, BANK = 605;   // ox well clear of the trunk; all four hooves on land at 605
  const tRab = s9_T('n09', 2.2), tWater = s9_T('n09', 5.2), tLH = s9_T('n09', 6.28), tH09 = s9_T('h09');   // "little rabbit", "then at Little Horse"
  const tMy = s9_T('h09', 2.52), tLook = s9_T('look9'), tIns = tMy + 1.2, tBack = tIns + 2.5, tHmm = s9_T('h09b');
  const tFor = s9_T('h09b', .85), tHop = s9_T('h09b', 3.26);
  const tSquat = s9_T('hop9', .05), tJump = tSquat + .3, tLand = tJump + .7, tGo = tLand + .15;
  const tReact = s9_T('n09b', 2.5), tWide = s9_T('end9', .15), tBank = s9_T('end9', 1.2), tCard = tBank + .6;
  const B = RIVER_BED;
  const walkIn = q => route(q, [[0, 1760], [4.9, STOP]], SH);
  const wade = q => s9_glide(q, tGo, tBank, STOP, BANK, SH);
  const s9_x = q => q >= tGo ? wade(q).x : walkIn(q).x;
  const CLOSE = { x: 1390, y: 576, z: 2.6 };                                // his close-up, the rabbit's ears at the bottom

  const cam = setCam(p, 'river', { x: 1200, y: 450, z: 1 });
  cam.to({ x: 1330, y: 480, z: 1.15 }, .3, 3.6)                          // wide, drifting in on the far bank
    .cut({ x: RX + 30, y: 655, z: 3.5 }, tRab)                              // the rabbit at the water's lip
    .cut({ x: 1425, y: 572, z: 2.2 }, tLH)                                  // "then at Little Horse": the two of them, his face in
    .to({ z: 2.35 }, tLH + .2, 1.3)
    .cut(CLOSE, tH09)                                                       // "Oh, don't worry! … up to my—": head and eyes drop
    .cut({ x: 1415, y: 640, z: 3.5 }, tIns)                                 // insert: his legs, the rabbit, the waterline
    .cut(CLOSE, tBack)                                                      // back to him: slow blink, "Hmm."
    .cut({ x: 1450, y: 572, z: 2.15 }, tFor)                                // the two-shot: "Hop on!", the hop
    .cut({ x: q => s9_x(q) - 60, y: 600, z: 2 }, s9_T('n09b'))             // the two of them crossing, water at his knees
    .cut({ x: 190, y: 565, z: 2.2 }, tReact)                                // Squirrel and Uncle Ox on the near bank
    .cut({ x: 560, y: 450, z: 1 }, tWide)                                   // the wide: up the bank, then the hold
    .to({ z: .95 }, tWide + .3, 3);
  cam.soft(tRab, true).soft(tWide, false);

  const st = cam.stage;
  const ox = oxPuppet(st), sq = squirrelPuppet(st), lh = horsePuppet(st), rb = rabbitPuppet(st);
  // The ghost waterline in the insert: the river at his knee, drawn over the rabbit standing beside him.
  const ghost = mk('g', { 'pointer-events': 'none' }, st);
  const gFill = mk('path', { fill: '#7fb3d6', opacity: .28 }, ghost), gLine = mk('path', { fill: 'none', stroke: '#e9f4fb', 'stroke-width': 3.5, 'stroke-dasharray': '10 7', 'stroke-linecap': 'round' }, ghost);
  const card = endCard(p, tCard, 'The End', { x: 800, y: 150, size: 72 });

  // sound: beds, hooves in, the hops, the wade, the climb
  sfx('scene9', 0, 'river', .5); sfx('scene9', 0, 'birds', .4);
  [.3, .95, 1.6, 2.3, 3.0, 3.8].forEach(t => sfx('scene9', t, 'hoof', .25));
  sfx('scene9', tJump, 'hop', .5); sfx('scene9', tLand, 'pop', .3);
  let tWet = tGo, tDry = tGo; while (wade(tWet).x > 1320) tWet += .02; while (wade(tDry).x > 690) tDry += .02;   // into and out of the water
  sfx('scene9', tWet, 'splash', .4);
  for (let t = tWet + .8; t < tDry; t += .8) sfx('scene9', +t.toFixed(2), 'slosh', .3);
  [tDry + .1, tBank - .3].forEach(t => sfx('scene9', +t.toFixed(2), 'hoof', .3));
  sfx('scene9', tCard, 'chime', .45);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    card(q);

    /* ---- Uncle Ox on the near bank by the tree: grazing, then head up to watch them come; a nod at the end ---- */
    const watching = q > tReact - .3;
    ox.pose({ x: OX, y: 700, s: 1.4, turn: 1, grass: !watching, chew: watching ? 0 : q * 1.4,
      neck: watching ? s9_kf(q, [[tReact - .3, 24], [tReact + .3, 12], [tCard + .2, 12], [tCard + .6, 22], [tCard + 1, 12]]) : 24 + 2 * Math.sin(q * 1.3),
      look: watching ? 1 : 0, ear: watching ? -.3 : 0,
      shut: blinking(q, [2.2, 6.9, 12.5, 17.8, 23.6, tReact + .8, tCard + 2.1]) }, f);

    /* ---- Squirrel on the rock: tail alive; cheers them across, claps at the end ---- */
    const wave = q > tReact - .3 && q < tCard, clap = q >= tCard && q < tCard + 1.5;
    sq.pose({ x: 470, y: 648, s: .6, turn: 1, tail: 6 * Math.sin(q * 2.2), tail2: 8 * Math.sin(q * 2.2 - .8),
      paw: wave ? -95 + 28 * Math.sin(q * 10) : clap ? -55 + 18 * onTwos(q) : 0,
      pawF: clap ? -55 - 18 * onTwos(q) : 0, lean: wave ? -6 : clap ? 4 : 0,
      headR: wave || clap ? -8 : 0, mouth: wave || clap ? 'C' : 'X',
      hop: clap && q < tCard + 1.6 ? 8 * Math.max(0, Math.sin((q - tCard) * 6)) : 0,
      shut: blinking(q, [1.4, 5.1, 10.8, 16.5, 22.6, tReact + .5, tCard + 2.4]) }, f);

    /* ---- Little Horse: walks in, talks, catches himself, kneels, wades home and climbs the near bank ---- */
    // on the bank he turns round to look back at the river he crossed (in the wide)
    const hTurn = s9_kf(q, [[tBank + .1, -1], [tBank + .45, 1]]);
    const r1 = walkIn(q), r2 = wade(q), crossing = q >= tGo;
    const x = crossing ? r2.x : r1.x, stand = crossing ? r2.stand : r1.stand;
    const crouch = s9_kf(q, [[tHop + .1, 0], [tHop + .7, 34], [tLand + .05, 34], [tGo + .35, 0]]);
    const dir = hTurn > 0 ? 1 : -1, front = x + dir * 46 * SH, hind = x - dir * 46 * SH, y0 = (B(front) + B(hind)) / 2;
    const slope = Math.atan2(B(front) - B(hind), 92 * SH) * 180 / Math.PI;     // facing left: front lower = tilt +
    const lf = (y0 - B(front)) / SH, lb = (y0 - B(hind)) / SH, cl = crouch / SH;
    const lift = s9_kf(q, [[s9_T('h09', 1.4), 0], [s9_T('h09', 1.8), 15], [tIns + .3, 15], [tIns + .65, 0]]);
    const hm = lips(q, 'scene9', PRE9, 'h09', 'h09b');
    lh.pose({ x, y: y0 + crouch, s: SH, turn: hTurn, d: r1.d + r2.d, stand, gait: 'walk', sack: false, cloth: true,
      tilt: slope * .25 + crouch * .2 + s9_kf(q, [[tH09 - .1, 0], [tH09 + .3, -3], [tMy, -3], [tMy + .3, 0]]),
      bob: 1.2 * Math.sin(q * 2.4) * stand,
      legs: { nf: [0, lf + cl + lift], ff: [0, lf + cl], nh: [0, lb + cl], fh: [0, lb + cl] },
      neck: s9_kf(q, [[tRab - .5, 0], [tRab - .1, -20], [tLH - .05, -10], [tLH + .3, 12], [tH09 - .1, 12], [tH09 + .25, -14], [tMy, -14], [tMy + .35, 12],
        [tIns, 12], [tIns + .01, -18], [tBack - .01, -18], [tBack, 12], [tFor - .1, 12], [tFor + .3, 16], [tHop - .1, 16], [tHop + .5, 22],
        [tLand, 22], [tGo, 6], [tReact, 4], [tBank - .3, -4], [tBank + .3, -20]]),
      nod: s9_kf(q, [[tMy, 0], [tMy + .35, 14], [tIns, 14], [tIns + .01, 0], [tBack - .01, 0], [tBack, 12], [tFor + .3, 12], [tHop, 10], [tHop + .4, 2], [tJump, 0], [tLand + .3, -4], [tGo, 0]]),
      look: s9_kf(q, [[tLH, .4], [tH09, .4], [tH09 + .2, 1], [tMy, 1], [tMy + .3, .8], [tFor + .2, .6],
        [tSquat, .6], [tJump + .2, -1], [tLand + .2, -1], [tGo, .7]]),
      brow: s9_kf(q, [[tH09 - .1, 0], [tH09 + .2, .2], [tMy, .2], [tMy + .25, -.8], [tHmm + 1.2, -.8], [tHop - .1, -.5], [tHop + .1, -.2]]),
      ear: s9_kf(q, [[4.6, 0], [5.0, -.5], [tMy, -.6], [tMy + .25, .4], [tHop - .1, .3], [tHop + .1, -.6]]),
      tail: q < tBank ? 7 * Math.sin(q * 2.1) : q < tCard + 1.5 ? -12 + 6 * Math.sin(q * 5) : -12,   // tucked: clear of Squirrel
      mouth: q >= tMy + .7 && q < tLook + .4 ? 'B' : hm,
      shut: between(q, tBack + .2, tBack + .2 + 5 / FPS) || blinking(q, [2.6, 6.2, 9.4, tFor + 1.2, tGo + 1.4, tReact + 1.0, tCard + 1.3, tCard + 3.2]) }, f);

    /* ---- the rabbit: at the water's lip; looks down, then up at him; hops to his side, up onto his back, rides home ---- */
    const back = lh.at('back'), seat = [back[0], back[1] + 3];
    const side = s9_kf(q, [[s9_T('h09b', 4.0), RX], [s9_T('h09b', 4.45), RX + 45], [s9_T('h09b', 4.75), RX + 65], [s9_T('h09b', 5.2), STOP - 30]]);
    const sideHop = [s9_T('h09b', 4.0), s9_T('h09b', 4.75)].reduce((a, t0) => a + (between(q, t0, t0 + .45) ? 16 * Math.sin((q - t0) / .45 * Math.PI) : 0), 0);
    let rx = side, ry = 706 - sideHop, lean = s9_kf(q, [[tSquat, 0], [tJump - .05, 14]]);
    if (q >= tJump && q < tLand) { [rx, ry] = s9_hop([STOP - 30, 706], seat, (q - tJump) / (tLand - tJump), 70); lean = -16 + 22 * (q - tJump) / (tLand - tJump); }
    else if (q >= tLand) { [rx, ry] = seat; lean = s9_kf(q, [[tLand, 12], [tLand + .25, 0]]); }
    const squat = q >= tSquat && q < tJump ? 5 * Math.sin((q - tSquat) / .3 * Math.PI) : 0;
    const happyHop = between(q, tHop + .1, tHop + .5) ? 14 * Math.sin((q - tHop - .1) / .4 * Math.PI) : 0;
    rb.pose({ x: rx, y: ry - happyHop + squat, s: SR,
      turn: q < tLH ? -1 : q < s9_T('n09b') ? 1 : hTurn,
      headR: s9_kf(q, [[tWater, 0], [tWater + .3, 20], [tLH, 20], [tLH + .01, -28], [tFor, -26], [s9_T('h09b', 1.7), -20], [s9_T('h09b', 2.0), 8],
        [tHop - .1, 8], [tHop + .05, -18], [tSquat, -10], [tLand + .3, 0], [tReact, 6], [tBank, -10]]) + (q > tLand ? 3 * Math.sin(q * 3.1) : 0),
      ears: s9_kf(q, [[tH09, 0], [tH09 + .4, -6], [tFor, -6], [tFor + .3, 10], [s9_T('h09b', 1.7), 10], [s9_T('h09b', 2.1), 40],
        [tHop - .1, 40], [tHop + .1, -10], [tLand, 25], [tLand + .3, -8]])
        + (q < tLH ? 7 * Math.max(0, Math.sin(q * 11)) : 4 * Math.sin(q * 3.7)) + (q > tGo ? 5 * Math.sin(q * 9) * (1 - stand) : 0),
      ear2: q < tLH ? 9 * Math.max(0, Math.sin(q * 7 + 1)) : 3 * Math.sin(q * 2.9),
      look: q < tLH ? .5 : q > tBank ? .6 : 0, lean, sniff: q < tWater || between(q, tIns, tBack),
      shut: blinking(q, [3.1, tRab + .9, tLH + .6, s9_T('h09', 1.6), tIns + .55, s9_T('h09b', 2.6), tGo + 2.2, tCard + .7, tCard + 2.7]) }, f);

    /* ---- the ghost waterline at his knee, drawn in across the insert ---- */
    const gu = span(q, tIns + .25, tIns + .75);
    vis(ghost, q >= tIns + .25 && q < tBack);
    if (q >= tIns + .25 && q < tBack) {
      const ky = lh.at('nfk')[1], x0 = 1160, x1 = x0 + 480 * gu, ph = q * 5;
      let d = `M${x0},${ky}`;
      for (let xx = x0 + 10; xx <= x1; xx += 10) d += ` L${xx},${(ky + 2.5 * Math.sin(xx / 14 + ph)).toFixed(1)}`;
      gLine.setAttribute('d', d);
      gFill.setAttribute('d', `${d} L${x1},706 L${x0},706 Z`);
    }
  });
}
