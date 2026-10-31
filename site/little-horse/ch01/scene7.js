/* scene7.js — Let me try (river): Little Horse comes back, Squirrel shouts, "Let me try", the careful wade, the water
   at his knees, the far bank, and the two advisers' stare. Beat clock = PRE7 + scene-clip time (narration.en.words.txt). */
'use strict';
const PRE7 = 1.0;
const s7_T = c => PRE7 + c;                      // scene-clip time → beat clock
const s7_K = TIMINGS.scene7.marks['n07c.knees'];  // "It came just up to Little Horse's knees."
const s7_GAIT = { walk: [{ nh: 0, nf: .25, fh: .5, ff: .75 }, .64], trot: [{ nh: 0, ff: 0, fh: .5, nf: .5 }, .5] };   // cast.js GAITS (L 74)

// Where a leg (hip → knee → hoof) crosses the waterline, or null when the hoof is dry.
function s7_atWater(pup, k) {
  const h = pup.at(k + 'Hoof'), kn = pup.at(k + 'k'), hp = pup.at(k);
  if (h[1] <= WATER) return null;
  const [a, b] = kn[1] <= WATER ? [kn, h] : [hp, kn];
  const u = Math.min(1, Math.max(0, (WATER - a[1]) / (b[1] - a[1] || 1)));
  return a[0] + (b[0] - a[0]) * u;
}
// Swing progress 0..1 of a leg at distance d (cast.js gait), or -1 while its hoof is planted.
const s7_swing = (d, k, g = 'walk') => { const [ph, b] = s7_GAIT[g], r = ((d / 74 + ph[k]) % 1 + 1) % 1; return r < b ? -1 : (r - b) / (1 - b); };

// Ripples on the waterline: a foam collar round each wading leg and two crests running out from it, plus thrown drops.
function s7_water(parent, n) {
  const legs = Array.from({ length: n }, () => {
    const g = mk('g', {}, parent);
    return { g, crest2: mk('path', { fill: 'none', stroke: '#f6fcf8', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g),
      crest: mk('path', { fill: 'none', stroke: '#f6fcf8', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g),
      drops: [0, 1, 2].map(() => mk('circle', { r: 4, fill: '#d8eef2', stroke: '#9ccad6', 'stroke-width': 1 }, g)) };
  });
  // each item: { x, w (leg width at the line), u (ripple phase), a (strength 0..1), sw (swing progress or -1), dir }
  return items => legs.forEach((L, i) => {
    const it = items[i]; vis(L.g, !!it); if (!it) return;
    const { x, w, u, a, sw, dir } = it;
    [[L.crest, u], [L.crest2, (u + .5) % 1]].forEach(([el, v]) => {
      const r = w * .5 + 3 + 40 * v, hgt = (-6 * a * (1 - .5 * v)).toFixed(1);
      el.setAttribute('d', `M${(x - r - 18).toFixed(1)},${WATER + 1} q9,${hgt} 18,0 M${(x + r).toFixed(1)},${WATER + 1} q9,${hgt} 18,0`);
      el.setAttribute('opacity', ((1 - v) * a).toFixed(2));
    });
    L.drops.forEach((c, j) => {
      const on = sw >= 0 && sw < .8 && a > .3; vis(c, on); if (!on) return;
      const v = sw / .8, h = (22 + 10 * j) * a * Math.sin(Math.PI * v);
      c.setAttribute('cx', (x + dir * (6 + (12 + 9 * j) * v)).toFixed(1)); c.setAttribute('cy', (WATER - h).toFixed(1));
      c.setAttribute('r', (3.6 - .8 * j).toFixed(1));
    });
  });
}

// Drops flung off when he shakes himself dry, around (cx, cy), u 0..1.
function s7_shakeDrops(parent) {
  const D = Array.from({ length: 14 }, (_, i) => ({ a: -Math.PI * (.08 + .84 * ((i * 7) % 14) / 13), v: 120 + 70 * ((i * 5) % 3), r: 3 + (i % 3),
    e: mk('circle', { fill: '#d8eef2', stroke: '#9ccad6', 'stroke-width': 1 }, parent) }));
  return (u, cx, cy) => D.forEach((d, i) => {
    const uu = u - (i % 4) * .06, on = uu > 0 && uu < 1; vis(d.e, on); if (!on) return;
    d.e.setAttribute('cx', (cx + Math.cos(d.a) * d.v * uu * 1.6).toFixed(1));
    d.e.setAttribute('cy', (cy + Math.sin(d.a) * d.v * uu + 260 * uu * uu).toFixed(1));
    d.e.setAttribute('r', (d.r * (1 - .4 * uu)).toFixed(1));
  });
}

// The dashed waterline (scene 9's language): drawn in from x0 to x1 at y as u goes 0..1, with a slow ripple.
function s7_dash(parent) {
  const g = mk('g', { 'pointer-events': 'none' }, parent);
  const line = mk('path', { fill: 'none', stroke: '#f4fbff', 'stroke-width': 4, 'stroke-dasharray': '12 8', 'stroke-linecap': 'round' }, g);
  return (on, x0, x1, y, u, q) => {
    vis(g, on); if (!on) return;
    const xe = x0 + (x1 - x0) * Math.max(.001, u);
    let d = `M${x0.toFixed(0)},${y}`;
    for (let x = x0 + 10; x <= xe; x += 10) d += ` L${x.toFixed(0)},${(y + 2 * Math.sin(x / 15 + q * 4)).toFixed(1)}`;
    line.setAttribute('d', d);
  };
}

/* A torn-paper vignette over Squirrel: the river cut side-on with him standing on its bed, the water (and the dashed
   waterline) over his head, air bubbles rising. Drawn around (0, 0) in its own units: waterline y -20, bed y 80; the
   little squirrel is at his true size (s .6, 78 tall), so the water is 22 over his head. */
function s7_vignette(parent) {
  const outer = mk('g', {}, parent), W = 140, H = 92;
  // torn edge: a jagged outline from seeded noise
  const torn = (dw, dh) => { const pts = []; const n = 44; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, j = 1 + .035 * jit(i, 7 + dw);
    const x = Math.cos(a), y = Math.sin(a), k = 1 / Math.max(Math.abs(x) / (W + dw), Math.abs(y) / (H + dh)) ** 1 * .985;
    pts.push(`${(x * k * j).toFixed(1)},${(y * k * j).toFixed(1)}`); } return `M${pts.join(' L')} Z`; };
  const wave = Array.from({ length: 8 }, (_, i) => `Q${-160 + i * 40 + 10},-25 ${-160 + i * 40 + 20},-20 T${-160 + i * 40 + 40},-20`).join(' ');
  outer.innerHTML = `<clipPath id="s7clip"><path d="${torn(0, 0)}"/></clipPath>
    <g filter="url(#paper)"><path d="${torn(7, 7)}" fill="#fbf6ea"/></g>
    <g clip-path="url(#s7clip)">
      <g filter="url(#paper)"><rect x="-160" y="-110" width="320" height="220" fill="#dcecef"/>
        <path d="M-160,-34 C-100,-48 -40,-38 20,-46 C80,-54 120,-40 160,-48 L160,-20 L-160,-20 Z" fill="#b8cfa4"/>
        <rect x="-160" y="-20" width="320" height="130" fill="#b9dcea"/>
        <path d="M-160,80 C-80,76 40,84 160,78 L160,110 L-160,110 Z" fill="#c9ad74"/></g>
      <g class="s7sq"></g>
      <g filter="url(#paper)"><path d="M-160,-20 ${wave} L160,110 L-160,110 Z" fill="#5f9fc0" opacity=".32"/></g>
      <path d="M-150,-20 L150,-20" stroke="#f4fbff" stroke-width="4" stroke-dasharray="12 8" stroke-linecap="round"/>
      <g class="s7air"></g>
    </g>`;
  const sq = squirrelPuppet(outer.querySelector('.s7sq'));
  const air = outer.querySelector('.s7air'), bubs = Array.from({ length: 3 }, () => mk('circle', { r: 4.5, fill: '#f4fbff', 'fill-opacity': .4, stroke: '#ffffff', 'stroke-width': 2.5 }, air));
  bakeAll(outer);
  return (q, f, sc, x, y) => {
    vis(outer, sc > 0); if (!(sc > 0)) return;
    tf(outer, `translate(${x},${y}) scale(${sc.toFixed(3)})`);
    sq.pose({ x: 10, y: 80, s: .6, turn: 1, paw: -40 + 25 * Math.sin(q * 6), pawF: -30 + 25 * Math.sin(q * 6 + 1.5), brow: -1, ear: -.5,
      tail: 10 * Math.sin(q * 3), tail2: 12 * Math.sin(q * 3 + 1), hop: 3 + 3 * Math.sin(q * 4), mouth: 'B', shut: false }, f);
    bubs.forEach((b, i) => {
      const v = ((q / 1.4 + i / 3) % 1 + 1) % 1;
      b.setAttribute('cx', (34 + 5 * Math.sin(v * 9 + i * 2)).toFixed(1)); b.setAttribute('cy', (28 - v * 48).toFixed(1)); b.setAttribute('opacity', v < .94 ? '1' : '0');
    });
  };
}

function scene7(p, D) {
  const T = s7_T;
  // the river camera, with one extra k = 1 layer just in front of the water for the ripples and the dashed waterline
  const cam = paperCam(p, 'river', { x: 800, y: 470, z: 1.05 }, { after: 'tree', stages: ['water'] });
  const ox = oxPuppet(cam.stage), lh = horsePuppet(cam.stage), sq = squirrelPuppet(cam.stage);   // the Ox behind, Squirrel's rock nearest us
  const ripples = s7_water(cam.stageAt.water, 8), shake = s7_shakeDrops(cam.stageAt.water), dash = s7_dash(cam.stageAt.water);
  const vign = s7_vignette(cam.root);   // over the picture, in frame coordinates
  // A see-through copy of the set's water (books/little-horse/art/sets.js) for the depth shots: with the set's opaque
  // water hidden, the legs under the line show faintly through it, so the child sees how much leg is under.
  let s7crest = 'M560,724'; for (let x = 560; x <= 1360; x += 40) s7crest += ' q10,-5 20,0 q10,5 20,0';
  const glass = prop(cam.stageAt.water, `<g filter="url(#paper)" opacity=".7"><path d="${s7crest} L1360,1060 L560,1060 Z" fill="#6fa6b8"/>
    <path d="M560,744 C800,752 1100,738 1360,748 L1360,1060 L560,1060 Z" fill="#5d93a8" fill-opacity=".6"/>
    ${Array.from({ length: 16 }, (_, i) => `<path d="M${600 + i * 46},${742 + (i % 4) * 16} q16,-5 32,0" stroke="#b8dde6" stroke-width="3" fill="none"/>`).join('')}</g>`);
  cam.stageAt.water.insertBefore(glass, cam.stageAt.water.firstChild);   // under the ripples and the dashed line

  /* ---------- places (REWORK2) ----------
     Uncle Ox grazes in OPEN WATER facing the far bank (x OX, y WATER + 50: his legs and the waterline in view, clear of
     the far-bank mound). Little Horse's hooves are hidden by the water too, so the bed under him drops as he goes in
     until the water is at his knee pins (y WATER + KNEE) where he stops (DEEP), with clear air before the Ox's tail.
     While the foal crosses on (out of shot, during Squirrel's cutaway) the Ox turns and wades back to the near shallows
     (OX2), so the two never share a frame there and the stare can be nose to nose. */
  const LH_S = 1.05, X0 = 20, EDGE = 650, DEEP = 730, FAR = 1580, KNEE = 66, OX = 1150, OX2 = 830, OX_Y = WATER + 50;
  const SQ_ROCK = [470, 650], SQ_LIP = [572, 700];
  const lhY = x => x <= EDGE ? RIVER_BED(x) : x <= DEEP ? RIVER_BED(EDGE) + (WATER + KNEE - RIVER_BED(EDGE)) * ease((x - EDGE) / (DEEP - EDGE))
    : Math.min(WATER + KNEE, x < 1000 ? WATER + KNEE : RIVER_BED(x));
  const g7 = c => c < 4 || c > 25.4 ? 'trot' : 'walk';   // trot in; walk the careful wade; trot on, sure now (switched while standing)
  const keys = [[T(-1), X0], [T(2.1), EDGE], [T(9.0), EDGE]];
  {   // one hoof at a time: a pause at each hoof's highest lift (quarter strides)
    const d0 = (EDGE - X0) / LH_S, stops = [];
    for (let n = Math.ceil((d0 / 74 - .07) / .25 + 1e-6); ; n++) { const x = EDGE + ((.07 + .25 * n) * 74 - d0) * LH_S; if (x >= DEEP - 8) break; stops.push(x); }
    const dt = (T(16.6) - T(9.0)) / (stops.length + 1);
    stops.forEach((x, i) => keys.push([T(9.0) + dt * (i + 1), x]));
    keys.push([T(16.6), DEEP], [T(25.6), DEEP], [T(27.0), 1350], [T(28.3), FAR]);
  }
  const lhAt = q => route(q, keys, LH_S);
  const oxAt = q => route(q, [[T(25.7), OX], [T(29.2), OX2]], 1.4);

  // a slosh at each lift of the near fore hoof in the water (one a stride), a splash at the first step in
  {
    let last = null, first = true;
    for (let q = T(9.0); q < T(28.4); q += 1 / 24) {
      const r = lhAt(q), now = s7_swing(r.d, 'nf', g7(q - PRE7)) >= 0, seen = q < T(25.6) || q > T(27.0);
      if (last === false && now && seen && r.stand < .5 && lhY(r.x) > WATER + 2) {
        if (first) { sfx('scene7', +q.toFixed(2), 'splash', .35); first = false; }
        else sfx('scene7', +q.toFixed(2), 'slosh', q > T(25) ? .3 : .22);
      }
      last = now;
    }
  }

  /* ---------- the shots ---------- */
  const lhx = q => lhAt(q).x;
  const SQV = T(20.75), KN = PRE7 + s7_K;
  cam.to({ x: 760, z: 1.25 }, T(-1), 3.2)                                    // wide: he trots back to the river
    .cut({ x: 600, y: 590, z: 2.2 }, T(2.2))                                  // medium: at the edge, the hoof lifts; "What?"
    .cut({ x: 478, y: 600, z: 3.5 }, T(5.45))                                 // Squirrel: "Do you want to drown?"
    .cut({ x: 565, y: 530, z: 2.8 }, T(7.3))                                  // Little Horse, calm: "Let me try."
    .cut({ x: q => lhx(q) + 90, y: 600, z: 2.2 }, T(8.75))                     // he steps in
    .cut({ x: q => lhx(q) + 40, y: 690, z: 3.4 }, T(10.5))                     // insert: the hooves, one careful step
    .cut({ x: 890, y: 560, z: 1.3 }, T(12.45))                                // wide: Squirrel hops down to the lip; the Ox grazing
    .to({ x: 930, y: 580, z: 1.45 }, T(13.6), 3.4)
    .cut({ x: 1025, y: 615, z: 1.85 }, T(17.65))                              // "Uncle Ox": one waterline, his shins, the foal's knees
    .cut({ x: 650, y: 600, z: 2.8 }, SQV)                                     // "Squirrel": the vignette, the water over his head
    .cut({ x: 765, y: 632, z: 2.5 }, KN)                                      // "knees": his face dips to the water, comes up delighted
    .cut({ x: 525, y: 625, z: 3.2 }, T(25.6))                                 // Squirrel watches him go, hops back up (cutaway)
    .cut({ x: 1640, y: 590, z: 2.2 }, T(27.0))                                // the far bank: out, shake, a proud look back
    .cut({ x: 650, y: 560, z: 2.6 }, T(29.55))                                // Ox, back in the near shallows: "Told you it was shallow."
    .cut({ x: 485, y: 600, z: 3.4 }, T(31.3))                                 // Squirrel: "Told you it was deep!"
    .cut({ x: 610, y: 545, z: 3.2 }, T(33.4))                                 // the stare: the Ox looks at Squirrel…
    .cut({ x: 470, y: 600, z: 3.5 }, T(34.0))                                 // …Squirrel looks at the Ox…
    .cut({ x: 535, y: 575, z: 2.9 }, T(34.6));                                // …both faces, eyes meeting, held
  [[T(2.2), true], [T(8.75), false], [T(10.5), true], [T(12.45), false], [T(17.65), true]].forEach(([t, on]) => cam.soft(t, on));

  /* ---------- sound ---------- */
  sfx('scene7', 0, 'river', .5); sfx('scene7', 0, 'birds', .4);
  sfx('scene7', .05, 'trot', .4);
  sfx('scene7', T(4.88), 'squeak', .35);
  sfx('scene7', T(13.75), 'hop', .25); sfx('scene7', T(25.95), 'hop', .22);
  sfx('scene7', SQV + .2, 'pop', .3);
  sfx('scene7', T(28.4), 'splash', .3);   // the shake

  const blinkLH = [T(1.6), T(6.5), T(11.9), T(15.2), T(19.9), T(22.6), T(26.2), T(31.5)];
  const blinkOx = [T(.9), T(5.7), T(9.6), T(14.4), T(18.9), T(22.8), T(27.9), T(31.0), T(35.2)];
  const blinkSq = [T(2.6), T(8.1), T(12.8), T(16.6), T(19.6), T(25.3), T(33.0), T(35.45)];

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const c = q - PRE7;
    const seeThrough = between(q, T(17.65), SQV) || between(q, KN, T(25.6));   // the two-shot and the knees shot
    cam.show('water', !seeThrough); vis(glass, seeThrough);

    /* Little Horse */
    const r = lhAt(q), y = lhY(r.x);
    const turn = c < 6.3 ? 1 : c < 7.75 ? -1 : c < 28.85 ? 1 : tween(c, 28.85, .3, 1, -1);   // turns on the cuts, and on the far bank
    const lift = c < 4.95 ? tween(c, 3.0, .45, 0, 1) : tween(c, 4.95, .15, 1, 0);
    const wading = between(c, 8.8, 25.6), shaking = between(c, 28.3, 28.8), sh = shaking ? Math.sin((c - 28.3) * 2 * Math.PI * 5) : 0;
    const proud = c > 29.15, delighted = between(c, 23.95, 29.4);
    const startle = between(c, 4.95, 5.6);
    let neck = c < 2.1 ? -4 : c < 4.9 ? 12 : c < 6.3 ? 4 : 14;
    if (c > 7.4 && c < 8.8) neck = 10;
    if (wading) neck = c > 16.6 ? 6 : 16;
    if (between(c, 22.5, 23.95)) neck = tween(c, 22.5, .45, 6, 34);           // "It came just up to…": head and eyes dip to the water
    else if (between(c, 23.95, 25.6)) neck = tween(c, 23.95, .35, 34, -10);   // …"knees": up, delighted, held
    else if (c >= 25.6) neck = proud ? -12 : -4;
    const dip = between(c, 22.7, 23.95);
    lh.pose({ x: r.x, y, s: LH_S, d: r.d, stand: r.stand, gait: g7(c), turn, sack: true,
      neck: neck + sh * 6 + (startle ? -8 : 0), nod: between(c, 7.55, 8.15) ? 10 * Math.sin((c - 7.55) / .6 * Math.PI) : dip ? 8 : 0,
      tilt: (startle ? -4 : 0) + sh * 4 + (proud ? -3 : 0) + (between(c, 24.0, 24.4) ? -5 * Math.sin((c - 24) / .4 * Math.PI) : 0),
      legs: { nf: [16 * lift, 30 * lift] },
      ear: startle ? .7 : shaking ? sh : delighted || proud ? -1 : wading ? -.5 : c > 7.4 ? -.4 : -.2,
      // brow: + cross/determined, - worried/surprised/happy-lifted (REWORK1)
      brow: startle ? -1 : between(c, 5.6, 7.3) ? -.5 : c > 7.3 && c < 8.8 ? .35 : delighted ? -.5 : dip ? -.3 : wading ? .2 : 0,
      lid: between(c, 7.3, 8.6) ? .15 : 0,
      look: startle ? -1 : between(c, 5.6, 6.3) ? -1 : between(c, 6.3, 8.8) ? .3 : dip ? .2 : wading ? .4 : 0,
      tail: shaking ? sh * 25 : delighted || proud ? 14 * Math.sin(c * 5) : 4 * Math.sin(c * 1.3),
      mouth: lips(q, 'scene7', PRE7, 'h07'), shut: blinking(q, blinkLH) || (shaking && sh > .6) }, f);

    /* Uncle Ox: grazing in open water facing the far bank; wades back to the near shallows while the foal crosses on
       (both out of shot); speaks and stares from there. Grass while he munches only. */
    const o = oxAt(q), oxTalk = lips(q, 'scene7', PRE7, 'o07'), oxSpeaks = between(c, 29.4, 31.1), stare = c > 33.4;
    ox.pose({ x: o.x, y: OX_Y, s: 1.4, turn: c < 25.7 ? 1 : -1, d: o.d, stand: o.stand, gait: 'walk',
      grass: !oxSpeaks && !stare, chew: !oxSpeaks && !stare ? q * 1.4 : 0,
      mouth: oxSpeaks ? oxTalk : 'X', neck: stare ? tween(c, 33.5, .4, 6, 14) : c < 25.7 ? 12 : 6, lid: stare ? .05 : .3,
      look: stare ? 1 : c < 25.7 ? -.3 : .5, brow: stare ? .25 : 0,
      tail: 6 * Math.sin(c * .9), ear: .2 * Math.sin(c * .7), shut: blinking(q, blinkOx) }, f);

    /* Squirrel: on the rock; hops down to the bank lip to watch the wade, back up while the foal crosses on */
    const sqTalk = lips(q, 'scene7', PRE7, 's07', 's07b');
    const down = span(c, 13.4, 13.9) * (1 - span(c, 25.95, 26.45));
    const sx = SQ_ROCK[0] + (SQ_LIP[0] - SQ_ROCK[0]) * down, sy = SQ_ROCK[1] + (SQ_LIP[1] - SQ_ROCK[1]) * down;
    const leap = between(c, 13.4, 13.9) ? Math.sin((c - 13.4) / .5 * Math.PI) : between(c, 25.95, 26.45) ? Math.sin((c - 25.95) / .5 * Math.PI) : 0;
    const shout = between(c, 4.85, 7.4), atLip = between(c, 19.7, 22.4), worried = between(c, 8.8, 22.4), crossed = between(c, 31.1, 33.4);
    const hop = between(c, 4.85, 5.3) ? 24 * Math.sin((c - 4.85) / .45 * Math.PI) : 28 * leap;
    const amazed = between(c, 24.0, 31.1);
    // at the lip: looks down at the water, then at the foal, a worried nod
    const lipHead = atLip ? (c < 20.4 ? 22 : c < 20.9 ? -8 : -8 + 12 * Math.sin((c - 20.9) * 9)) : 0;
    sq.pose({ x: sx, y: sy, s: .6, hop, stretch: leap * .4 + (between(c, 4.85, 5.3) ? .3 : 0),
      paw: shout ? -45 : atLip ? -150 : worried ? -95 : crossed ? 80 : stare ? 20 : amazed ? -20 : 0,
      pawF: shout ? -30 : atLip ? -140 : worried ? -100 : crossed ? 70 : stare ? 15 : amazed ? -15 : 0,
      lean: shout ? 6 : atLip ? 10 : worried ? 8 + 2 * Math.sin(c * 3) : crossed ? -5 : stare ? 4 : 0,
      headR: crossed ? -12 : stare ? 4 : atLip ? lipHead : worried ? 4 : between(c, 7.2, 8.8) ? -14 : amazed ? -6 : 0,
      brow: shout || worried ? -1 : crossed ? .6 : amazed ? -.6 : stare ? .3 : 0, ear: shout ? -.6 : amazed ? -.8 : 0,
      tail: 6 * Math.sin(c * 2.3) + (shout ? 10 : 0), tail2: 8 * Math.sin(c * 3.1 + 1) + (worried ? 6 * Math.sin(c * 9) : 0),
      mouth: sqTalk, shut: blinking(q, blinkSq) || (crossed && between(c, 32.15, 32.55)) }, f);

    /* the dashed waterline across both in the two-shot, and across his knees */
    if (between(q, T(17.75), SQV)) dash(true, 600, 1460, WATER, span(q, T(17.75), T(18.2)), q);
    else if (between(q, KN + .3, T(25.6))) dash(true, 560, 960, WATER, span(q, KN + .3, KN + .8), q);
    else dash(false);
    // the vignette over Squirrel: pops open, the water over his head; in frame coordinates of the SQV shot
    const vs = between(q, SQV + .2, KN) ? Math.min(1, (q - SQV - .2) / .2) * (1 + .08 * Math.max(0, 1 - (q - SQV - .4) / .2)) : 0;
    vign(q, f, vs * 2.2, 430, 230);   // in the sky above Squirrel, clear of the foal's head

    /* the water round every leg that stands in it */
    const items = [];
    for (const k of ['nf', 'ff', 'nh', 'fh']) {
      const x = s7_atWater(lh, k);
      items.push(x == null ? null : { x, w: (k[1] === 'f' ? 14 : 18) * LH_S, u: ((q / 1.3 + 'nfnhffh'.indexOf(k) * .17) % 1), a: r.stand < .5 ? 1 : .55,
        sw: r.stand < .5 && (wading || between(c, 27.0, 28.3)) ? s7_swing(r.d, k, g7(c)) : -1, dir: turn > 0 ? 1 : -1 });
    }
    for (const k of ['nf', 'ff', 'nh', 'fh']) {
      const x = s7_atWater(ox, k);
      items.push(x == null ? null : { x, w: 26, u: ((q / 2.1 + 'nfnhffh'.indexOf(k) * .23) % 1), a: o.stand < .5 ? .9 : .5, sw: -1, dir: 1 });
    }
    ripples(items);
    const back = lh.at('back');
    shake(between(c, 28.3, 29.2) ? (c - 28.3) / .9 : -1, back[0], back[1] + 20);
  });
}
