/* ep.js — ch02 "Many machines": the episode's own pieces on top of the series kit (lib/kit.js). The three machines
   that blame each other (the NAS and the Steam Deck on Doc's bench, the router on top of the left monitor), drawn as
   cut-outs in the cast's style: flat colours, the ink outline, two touching South Park eyes and thin paper arms with
   mittens that point. Also their balloons, the SSH lines from the laptop, the two-panel reject / approve meme and
   Doc's poses at his bench. World coordinates are garage units, as the stage's. */
'use strict';
// Where each machine stands (its foot, world) and the size it is drawn at.
const MACH = {   // the three in a row on Doc's bench, Doc's head above them
  nas: { x: 356, y: 766, s: .85 },
  router: { x: 478, y: 766, s: .9 },
  deck: { x: 614, y: 766, s: .85 },   // leaning on its kickstand
};
// The middle of each machine (what the others point at, where the SSH lines end).
const MID = { nas: [356, 706], router: [478, 742], deck: [614, 732] };
const BLAME = { nas: 'router', router: 'deck', deck: 'nas' };   // who points at whom in the hook
const RED = '#ff3b2f', GREEN = '#3cff5a';

// Two touching white eyes looking along (dx, dy) (-1 … 1), lids (0 … 1), brows: 1 angry (inner ends down), 0 none.
function eyesSVG(cx, cy, r, { dx = 0, dy = 0, lids = 0, angry = 0, shut = false } = {}) {
  let s = '';
  for (const side of [-1, 1]) {
    const ex = cx + side * r * .92, ey = cy;
    s += `<ellipse cx="${ex}" cy="${ey}" rx="${r}" ry="${r * 1.1}" fill="#fbf8f0" stroke="${CW_INK}" stroke-width="${r * .22}"/>`;
    if (shut) { s += `<ellipse cx="${ex}" cy="${ey}" rx="${r}" ry="${r * 1.1}" fill="#5d6470"/><path d="M${ex - r},${ey} H${ex + r}" stroke="${CW_INK}" stroke-width="${r * .25}" stroke-linecap="round"/>`; continue; }
    s += `<circle cx="${(ex + dx * r * .45 - side * r * .08).toFixed(1)}" cy="${(ey + dy * r * .45).toFixed(1)}" r="${r * .3}" fill="${CW_INK}"/>`;
    if (lids > .02) { const y0 = ey - r * 1.1 + 2 * r * 1.1 * lids; s += `<path d="M${ex - r},${y0} H${ex + r}" stroke="${CW_INK}" stroke-width="${r * .25}" stroke-linecap="round"/><path d="M${ex - r * .98},${y0} A${r},${r * 1.1} 0 0 1 ${ex + r * .98},${y0} Z" fill="#5d6470"/>`; }
    if (angry) s += `<path d="M${ex - side * r * .1},${ey - r * 1.05 + r * .45 * angry} L${ex + side * r * 1.1},${ey - r * 1.5}" stroke="${CW_INK}" stroke-width="${r * .3}" stroke-linecap="round"/>`;
  }
  return s;
}
// A thin paper arm from the shoulder (sx, sy) towards (tx, ty), len long, ending in a white mitten; point: a finger out.
function armSVG(sx, sy, tx, ty, len, s, point = true) {
  const a = Math.atan2(ty - sy, tx - sx), hx = sx + Math.cos(a) * len, hy = sy + Math.sin(a) * len;
  const fx = hx + Math.cos(a) * 24 * s, fy = hy + Math.sin(a) * 24 * s, seg = `M${sx.toFixed(1)},${sy.toFixed(1)} L${hx.toFixed(1)},${hy.toFixed(1)}`;
  return `<path d="${seg}" stroke="${CW_INK}" stroke-width="${17 * s}" stroke-linecap="round"/><path d="${seg}" stroke="#9aa2ad" stroke-width="${9 * s}" stroke-linecap="round"/>` +
    (point ? `<path d="M${hx.toFixed(1)},${hy.toFixed(1)} L${fx.toFixed(1)},${fy.toFixed(1)}" stroke="${CW_INK}" stroke-width="${15 * s}" stroke-linecap="round"/><path d="M${hx.toFixed(1)},${hy.toFixed(1)} L${fx.toFixed(1)},${fy.toFixed(1)}" stroke="#fbf8f0" stroke-width="${8 * s}" stroke-linecap="round"/>` : '') +
    `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${(point ? 19 : 15) * s}" fill="#fbf8f0" stroke="${CW_INK}" stroke-width="${5 * s}"/>`;
}
// A paper flame of three tongues, its shape swapped on twos (f), base at (x, y), h tall.
function flameSVG(x, y, h, f) {
  const k = Math.floor(f / 2), t = (i, w, hh) => { const j = jit(k, 60 + i) * .18, lean = jit(k, 70 + i) * 10;
    return `M${x + w - hh * .25},${y} Q${x + w - hh * .3},${y - hh * .5} ${x + w + lean},${y - hh * (1 + j)} Q${x + w + hh * .3},${y - hh * .45} ${x + w + hh * .25},${y} Z`; };
  return `<path d="${t(0, -18, h * .7)} ${t(1, 0, h)} ${t(2, 20, h * .6)}" fill="#ff8a1c" stroke="${CW_INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="${t(3, -6, h * .45)} ${t(4, 9, h * .55)}" fill="#ffd23f"/>`;
}

// One machine at its place: o { point: [x, y] world or null, look: [dx, dy], alarm (0 … 1, lights and brows),
// ok (all lights green), jab (pointing arm jabs on twos), lids, shut, arms: 'point' | 'down' | 'up', fire, screen }.
function machineSVG(kind, q, f, o = {}) {
  const { x, y, s } = MACH[kind], A = o.alarm || 0, blink = Math.floor(q * 4) % 2;
  const jab = o.jab ? (Math.floor(q * 7) % 2) * 18 * s : 0;
  const tgt = o.point, look = o.look || (tgt ? [Math.sign(tgt[0] - MID[kind][0]) * .9, Math.sign(tgt[1] - MID[kind][1]) * .7] : [0, 0]);
  const led = (cx, cy, r, bad) => { const c = bad ? (blink ? RED : '#4a1410') : GREEN;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>${c === '#4a1410' ? '' : `<circle cx="${cx}" cy="${cy}" r="${r * 2}" fill="${c}" opacity=".3"/>`}`; };
  let body = '', sh = [], eyes = [], arms = '';
  if (kind === 'nas') {
    const w = 120 * s, h = 140 * s;
    body = `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${10 * s}" fill="#4a4f58" stroke="${CW_INK}" stroke-width="${6 * s}"/>` +
      [-45, -15, 15, 45].map((bx, i) => `<rect x="${x + (bx - 11) * s}" y="${y - 88 * s}" width="${22 * s}" height="${72 * s}" rx="${3 * s}" fill="${o.dark === i ? '#15171a' : '#2a2d33'}" stroke="${CW_INK}" stroke-width="${3 * s}"/>` +
        `<path d="M${x + (bx - 6) * s},${y - 50 * s} h${12 * s}" stroke="#5d6470" stroke-width="${3 * s}"/>` + (o.dark === i ? '' : led(x + bx * s, y - 78 * s, 3.5 * s, i === 2 && !o.ok && A > 0))).join('');
    sh = [[x - w / 2 + 4 * s, y - 82 * s], [x + w / 2 - 4 * s, y - 82 * s]]; eyes = [x, y - 114 * s, 15 * s];
  } else if (kind === 'router') {
    const w = 132 * s, h = 48 * s;
    body = `<path d="M${x - w / 2 + 12 * s},${y - h} l${-14 * s},${-70 * s} M${x + w / 2 - 12 * s},${y - h} l${14 * s},${-70 * s}" stroke="${CW_INK}" stroke-width="${9 * s}" stroke-linecap="round"/>` +
      `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${8 * s}" fill="#24262a" stroke="${CW_INK}" stroke-width="${6 * s}"/>` +
      [0, 1, 2, 3, 4].map(i => led(x + (14 + i * 11) * s, y - 14 * s, 3.4 * s, !o.ok && A > 0 && i > 1)).join('');
    sh = [[x - w / 2 + 3 * s, y - 26 * s], [x + w / 2 - 3 * s, y - 26 * s]]; eyes = [x - 30 * s, y - 25 * s, 12 * s];
  } else {   // the deck: a handheld leaning back on its kickstand, the face on its screen
    const w = 184 * s, h = 80 * s, top = y - h;
    const scr = o.screen || 'full';
    body = `<path d="M${x + 20 * s},${y} l${30 * s},${-46 * s}" stroke="${CW_INK}" stroke-width="${6 * s}" stroke-linecap="round"/>` +
      `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" rx="${30 * s}" fill="#2c2e33" stroke="${CW_INK}" stroke-width="${6 * s}"/>` +
      `<rect x="${x - 50 * s}" y="${top + 10 * s}" width="${100 * s}" height="${60 * s}" rx="${3 * s}" fill="${scr === 'full' ? (A > 0 && blink ? '#5a1010' : '#2a0c0c') : '#0e2a14'}" stroke="${CW_INK}" stroke-width="${3 * s}"/>` +
      `<text x="${x}" y="${top + 62 * s}" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="${(scr === 'full' ? 12 : 11) * s}" fill="${scr === 'full' ? RED : GREEN}">${scr === 'full' ? 'STORAGE FULL' : '61 GB free'}</text>` +
      [-1, 1].map(k => `<circle cx="${x + k * 70 * s}" cy="${top + 28 * s}" r="${11 * s}" fill="#1b1c1f" stroke="#5d6470" stroke-width="${3 * s}"/>`).join('') +
      `<path d="M${x - 76 * s},${top + 56 * s} h${12 * s} M${x - 70 * s},${top + 50 * s} v${12 * s}" stroke="#5d6470" stroke-width="${4 * s}" stroke-linecap="round"/>` +
      [[64, 52], [76, 52], [70, 46], [70, 58]].map(([dx, dy]) => `<circle cx="${x + dx * s}" cy="${top + dy * s}" r="${3.6 * s}" fill="#5d6470"/>`).join('');
    sh = [[x - w / 2 + 6 * s, top + 40 * s], [x + w / 2 - 6 * s, top + 40 * s]]; eyes = [x, top + 32 * s, 11 * s];
  }
  // arms: the one nearer the target points (and jabs), the other shakes a fist in alarm, or both hang
  const L = 100 * s * (o.reach || 1), mode = o.arms || (tgt ? 'point' : 'down');
  const pi = tgt ? (tgt[0] >= MID[kind][0] ? 1 : 0) : -1;   // the shoulder on the target's side points
  sh.forEach(([sx, sy], i) => {
    const side = i ? 1 : -1;
    if (mode === 'point' && i === pi) arms += armSVG(sx, sy, tgt[0], tgt[1], L + jab, s);
    else if (mode === 'up' || (mode === 'point' && A > 0)) { const wav = Math.floor(q * 6 + i) % 2 ? 18 : -6;
      arms += armSVG(sx, sy, sx + side * 40, sy - 70 - wav, L * .7, s, false); }
    else arms += armSVG(sx, sy, sx + side * 14, sy + 60, L * .55, s, false);
  });
  const [ex, ey, er] = eyes;
  const face = eyesSVG(ex, ey, er, { dx: look[0], dy: look[1], lids: o.lids || 0, angry: A > 0 ? 1 : 0, shut: o.shut });
  let fire = '';
  if (o.fire) fire = flameSVG(x - 10 * s, y - 140 * s + 2, 54 * o.fire * s, f);
  return arms + body + face + fire;
}

// A speech balloon in world units: text, centred at (x, y), its tail to (tx, ty); u (0 … 1) pops it in.
function balloonSVG(text, x, y, tx, ty, u = 1, size = 34) {
  if (u <= 0) return '';
  const k = u < 1 ? .6 + .4 * ease(u) + .15 * Math.sin(u * Math.PI) : 1, w = Math.max(90, text.length * size * .58 + 40), h = size * 1.6;
  return `<g transform="translate(${x} ${y}) scale(${k.toFixed(3)})"><path d="M${-w * .15},${h / 2 - 6} L${tx - x},${ty - y} L${w * .15},${h / 2 - 6} Z" fill="#fff" stroke="${CW_INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="#fff" stroke="${CW_INK}" stroke-width="5"/>` +
    `<path d="M${-w * .15 + 6},${h / 2 - 3} H${w * .15 - 6}" stroke="#fff" stroke-width="7"/>` +
    `<text x="0" y="${size * .36}" text-anchor="middle" font-family="${MARKER}" font-size="${size}" fill="${CW_INK}">${esc(text)}</text></g>`;
}
// Where each blaming balloon sits (world) when its machine shouts at the next.
const BAL = { nas: ['ROUTER!', 335, 585], router: ['DECK!', 470, 862], deck: ['NAS!', 712, 610] };

// The machines layer on the stage: in front of the cast (they stand on the bench before Doc). draw(q, f, per) where
// per = { nas: o, router: o, deck: o, balloons: { nas: u, … }, red: alarm wash 0 … 1 }; hidden: vis(layer.g, false).
function machinesLayer(st) {
  const g = mk('g', {}, st.cam.stage), wash = mk('rect', { x: -60, y: -34, width: 1720, height: 968, fill: RED, opacity: 0 }, g), m = mk('g', {}, g);
  st.cam.stage.insertBefore(g, st.fx);   // under the effects (smoke, puffs) but over the cast
  let key = '';
  return { g, draw(q, f, per) {
    wash.setAttribute('opacity', ((per.red || 0) * (.04 + .12 * (Math.floor(q * 4) % 2))).toFixed(3));
    let s = ['nas', 'router', 'deck'].map(k => per[k] === null ? '' : machineSVG(k, q, f, per[k] || {})).join('');
    for (const [k, u] of Object.entries(per.balloons || {})) { const [t, bx, by] = BAL[k]; s += balloonSVG(t, bx, by, MID[k][0], MID[k][1], u); }
    if (per.extra) s += per.extra;
    if (s !== key) { key = s; m.innerHTML = s; }
  } };
}
// The hook's blame: everyone pointing at the next, jabbing, alarmed.
const blaming = (fire = 1) => ({ nas: { point: MID[BLAME.nas], alarm: 1, jab: true, fire }, router: { point: MID[BLAME.router], alarm: 1, jab: true },
  deck: { point: MID[BLAME.deck], alarm: 1, jab: true } });

// Doc at his bench (seated behind it): o's keys override. hands: 'head' (on his head), 'up', 'brow' (wipes it), null (on the bench)
function docAt(st, q, extra = {}, hands = null) {
  const base = { x: PLACE.doc[0], y: PLACE.doc[1], look: 0, lids: .1, frontL: true, frontR: true, shut: blinkAt(q, 1), ...extra };
  const P = pt => st.doc.point({ ...base, lean: 0 }, pt);
  if (hands === 'head') { const w = 25 * Math.sin(q * 13); return { ...base, ...st.doc.aim(base, 'L', P([270, 170 + w])), ...st.doc.aim(base, 'R', P([754, 170 - w])) }; }   // clutching, shaking
  if (hands === 'up') return { ...base, armL: 150, armR: 150, reachL: 1, reachR: 1, frontL: false, frontR: false };
  if (hands === 'brow') return { ...base, ...st.doc.aim(base, 'R', P([560 - 120 * Math.sin(q * 9), 300])), armL: 10, reachL: .9 };
  return { ...base, ...st.doc.aim(base, 'L', [BENCH.x0 + 150, BENCH.y - 6]), ...st.doc.aim(base, 'R', [BENCH.x1 - 110, BENCH.y - 6]) };
}

// The SSH lines from the laptop's screen to each machine: u (0 … 1) draws each on; a tag (`ssh nas`) at its end.
const LAP_SCR = [PLACE.laptop[0] - 123, PLACE.laptop[1] - 127];   // the screen's top-left corner, clear of Claude
function sshSVG(us) {
  const tags = { nas: [352, 600], router: [478, 838], deck: [664, 628] };
  // each line goes round Doc, not across his face: over his left shoulder, under the bench lip, down his right side
  const via = { nas: [330, 230], router: [640, 780], deck: [690, 600] };
  return Object.entries(us).map(([k, u]) => {
    if (u <= 0) return '';
    const [x0, y0] = LAP_SCR, [x1, y1] = MID[k], [mx, my] = via[k];
    const len = Math.hypot(x1 - x0, y1 - y0) * 1.9, v = Math.min(1, u), b = 1 - v, px = b * b * x0 + 2 * b * v * mx + v * v * x1, py = b * b * y0 + 2 * b * v * my + v * v * y1;
    const path = `M${x0},${y0} Q${mx},${my} ${x1},${y1}`;
    const tag = u >= 1 ? `<g transform="translate(${tags[k][0]} ${tags[k][1]})"><rect x="-78" y="-26" width="156" height="42" rx="8" fill="#0d1014" stroke="#2b5fb3" stroke-width="4"/><text x="0" y="5" text-anchor="middle" font-family="${MONO}" font-size="24" fill="#9fd0ff">ssh ${k}</text></g>` : '';
    return `<path d="${path}" fill="none" stroke="#9fd0ff" stroke-width="14" opacity=".35" stroke-dasharray="${len}" stroke-dashoffset="${(len * (1 - u)).toFixed(1)}"/>` +
      `<path d="${path}" fill="none" stroke="#2b5fb3" stroke-width="6" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${(len * (1 - u)).toFixed(1)}"/>` +
      (u < 1 ? `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="13" fill="#e8f4ff" stroke="#2b5fb3" stroke-width="5"/>` : '') + tag;
  }).join('');
}

// The two-panel reject / approve meme, filling the band: Claude on the left of each panel, the words on the right.
// draw(q, f, { lit: 0 top | 1 bottom, mouth }).
function rejectApprove(p, top = 'Walk to every box', bottom = 'ssh from one laptop') {
  const g = mk('g', {}, p), B = CW_BAND.y, H = CW_BAND.h / 2, W = SW;
  mk('rect', { width: SW, height: SH, fill: '#16130f' }, g);
  const panels = [0, 1].map(i => {
    const y0 = B + i * H, pg = mk('g', {}, g), id = `ra${i}${Math.random().toString(36).slice(2, 6)}`;
    pg.innerHTML = `<clipPath id="${id}"><rect x="0" y="${y0}" width="${W}" height="${H}"/></clipPath>
      <rect x="0" y="${y0}" width="${W * .52}" height="${H}" fill="${i ? '#f2c14e' : '#e9894a'}"/><rect x="0" y="${y0}" width="${W * .52}" height="${H}" fill="url(#cwDots)"/>
      <rect x="${W * .52}" y="${y0}" width="${W * .48}" height="${H}" fill="#fbf8f0"/>
      <rect x="0" y="${y0}" width="${W}" height="${H}" fill="none" stroke="${CW_INK}" stroke-width="10"/><path d="M${W * .52},${y0} V${y0 + H}" stroke="${CW_INK}" stroke-width="8"/>`;
    const fig = mk('g', { 'clip-path': `url(#${id})` }, pg), pup = cwPuppet(fig, 'claude');
    const words = mk('g', {}, pg), lines = (i ? bottom : top).split(' ').reduce((a, w) => { const l = a[a.length - 1]; if (l && (l + ' ' + w).length <= 10) a[a.length - 1] = l + ' ' + w; else a.push(w); return a; }, []);
    words.innerHTML = lines.map((l, j) => `<text x="${W * .76}" y="${y0 + H * (i ? .36 : .44) + (j - (lines.length - 1) / 2) * 62}" text-anchor="middle" font-family="${i ? MONO : MARKER}" font-weight="${i ? 800 : 400}" font-size="${i ? 46 : 54}" fill="${CW_INK}">${esc(l)}</text>`).join('');
    const dim = mk('rect', { x: 0, y: y0, width: W, height: H, fill: '#000', opacity: 0 }, pg);
    return { pup, dim, y0 };
  });
  return { g, draw(q, f, { lit = 0, mouth = 0 } = {}) {
    panels.forEach(({ pup, dim, y0 }, i) => {
      dim.setAttribute('opacity', i === lit ? 0 : .45);
      const talking = i === lit ? mouth : 0;
      const base = { x: W * .2, y: y0 + H + 120, s: 2.4, spin: q * 60, lids: .42 };   // head, shoulders and arms in the panel
      // top: face turned away, eyes shut, the mitten up against the label; bottom: a big grin, the arm out at the label
      if (i === 0) pup.pose({ ...base, back: true, lean: -6, armR: 150, reachR: .95, armL: 15 }, 0);   // his back to the label, a mitten up: no
      else pup.pose({ ...base, look: .7, eyeX: 1, eyeY: -.3, lids: 0, brow: 1, mouth: talking === 0 ? .55 : talking, lean: 4, armR: 96 + 3 * Math.sin(q * 6), reachR: 1.75, frontR: true, armL: 15, cigar: true }, 0);   // grin, the arm out at the label
    });
  } };
}

// The kit's comic panel leaves its figure unclipped (the promo's ran off the frame's foot); upright its foot is above the
// captions, so the figure is clipped to the panel here: head and shoulders only.
function clippedPanel(p, who, side) {
  const c = comicPanel(p, who, side), cp = c.g.querySelector('clipPath'), fig = cp.parentNode.querySelector(':scope > g');
  fig.setAttribute('clip-path', `url(#${cp.id})`);
  return c;
}
