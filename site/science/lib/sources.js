// Papermorph science book: power plants and energy sources (chapter 17 on). Load after electric.js (route, wire,
// eFlow), energy.js and thermal.js (thAtt). Every moving part is set from the beat clock (x.set(...) inside
// clockRun), so pause, seek and replay show the same frame.
'use strict';
// Water blue (as ch16's), steam white-grey, smoke grey, magma orange, plants green; power lines copper-white.
const WATER = '#3f7fb0', STEAM = '#dfe8ea', SMOKE = '#8a918e', MAGMA = '#e8603c', PLANT = '#6dbf6a', CABLE = '#e9e2cf';

// Static shapes drawn by draw(q) into one picture: an <image> of their SVG in box [x, y, w, h] (strokes included).
// Under a zooming camera Firefox repaints one image far faster than the shapes (turbine close-up: 31 -> 20 ms a frame).
function flatPic(p, [x, y, w, h], draw) {
  const q = G(p); draw(q); q.remove();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">${q.innerHTML}</svg>`;
  return mk('image', { href: 'data:image/svg+xml,' + encodeURIComponent(svg), x, y, width: w, height: h }, p);
}

// A turbine and its generator, side view, the shaft along +x: the bladed rotor centred on the origin (R each way
// from the shaft, L long, `rows` rings of n blades), the shaft running right into the generator housing (gen: false
// leaves the generator out: a bare propeller). In the housing's window a wire loop turns between an N strip (top,
// blue) and an S strip (bottom, red), the ch16 generator in miniature. tg.set(a) turns rotor and loop to angle a
// (radians: phaseOf for a spin-up, a falling angle turns it backwards). tg.term is the generator's terminal and
// tg.pt(x, y) maps the group's own coordinates to the parent's (for wires).
function turbineGen(p, { x = 0, y = 0, s = 1, r = 0, o = 1, R = 80, L = 140, rows = 3, n = 6, gap = 50, GW = 170, gen = true } = {}) {
  const g = G(p, { x, y, s, r, o }), x0 = L / 2 + gap, gh = R + 16, hubR = 20;
  const sx = gen ? x0 + GW / 2 : L / 2 + 26;
  flatPic(g, [-L / 2 - 30, -13, sx + L / 2 + 34, 26], q => phBlock(q, -L / 2 - 26, -9, sx + L / 2 + 26, 18, '#9aa5a8', { top: 4 }));
  const bk = path(g, '', { fill: '#6f7c7a', ...phLine(2) });
  mk('rect', { x: -L / 2, y: -hubR, width: L, height: 2 * hubR, rx: 12, fill: '#5d6a6a', ...phLine() }, g);
  const fr = path(g, '', { fill: '#c9d2d0', ...phLine(2) });
  const xs = Array.from({ length: rows }, (_, i) => -L / 2 + L * (i + .5) / rows), bw = Math.min(30, L / rows * .62);
  let coil = null, coilB = null, wy = 0, lx0 = 0, lx1 = 0;
  if (gen) {
    const wx0 = x0 + 16, wx1 = x0 + GW - 16; wy = R - 6;
    flatPic(g, [x0 - 6, -gh - 22, GW + 12, 2 * gh + 28], q => {   // housing, window, magnets, field lines, terminal
      mk('rect', { x: x0, y: -gh, width: GW, height: 2 * gh, rx: 16, fill: '#4a5458', ...phLine() }, q);
      mk('rect', { x: wx0, y: -wy, width: wx1 - wx0, height: 2 * wy, rx: 8, fill: '#1b2422' }, q);
      mk('rect', { x: wx0, y: -wy, width: wx1 - wx0, height: 16, fill: MAG_N }, q);
      mk('rect', { x: wx0, y: wy - 16, width: wx1 - wx0, height: 16, fill: MAG_S }, q);
      path(q, [.25, .5, .75].map(k => `M${wx0 + (wx1 - wx0) * k} ${-wy + 18}V${wy - 18}`).join(''), { stroke: MAGF, 'stroke-width': 2.5, 'stroke-dasharray': '7 8', opacity: .7 });
      phBlock(q, x0 + GW / 2 - 9, -gh - 16, 18, 16, '#c3ccce', { top: 0 });
    });
    lx0 = wx0 + 14; lx1 = wx1 - 14;
    coilB = path(g, '', { stroke: dk(COPPER, .35), 'stroke-width': 7, fill: 'none' });
    mk('rect', { x: wx0, y: -4, width: wx1 - wx0, height: 8, fill: '#9aa5a8' }, g);
    coil = path(g, '', { stroke: COPPER, 'stroke-width': 8, fill: 'none', 'stroke-linejoin': 'round' });
  }
  const c = Math.cos(r * Math.PI / 180), sn = Math.sin(r * Math.PI / 180);
  const pt = (lx, ly) => [x + s * (lx * c - ly * sn), y + s * (lx * sn + ly * c)];
  return Object.assign(g, {
    pt, term: gen ? pt(x0 + GW / 2, -gh - 16) : null, R, L, x0, GW,
    set(a) {
      let df = '', db = '';
      for (const xi of xs) for (let k = 0; k < n; k++) {
        const ph = a + k * TAU / n + xi * .004, cc = Math.cos(ph), ss = Math.sin(ph), sk = ss * bw * .7;
        const q = `M${(xi - bw / 2).toFixed(1)} ${(-hubR * cc).toFixed(1)}L${(xi + bw / 2).toFixed(1)} ${(-hubR * cc).toFixed(1)}L${(xi + bw / 2 + sk).toFixed(1)} ${(-R * cc).toFixed(1)}L${(xi - bw / 2 + sk).toFixed(1)} ${(-R * cc).toFixed(1)}Z`;
        if (ss > 0) df += q; else db += q;
      }
      thAtt(fr, 'd', df); thAtt(bk, 'd', db);
      if (coil) {
        const h = (wy - 26) * Math.cos(a), front = Math.sin(a) > 0;
        const d = `M${lx0} -4V${(-h).toFixed(1)}H${lx1}V${h.toFixed(1)}H${lx0}V4`;
        thAtt(coil, 'd', front ? d : `M${lx0} -4V${(-h).toFixed(1)}M${lx1} ${(-h).toFixed(1)}V${h.toFixed(1)}`);
        thAtt(coilB, 'd', front ? '' : `M${lx0} ${(-h).toFixed(1)}H${lx1}M${lx1} ${h.toFixed(1)}H${lx0}V4`);
      }
      return g;
    },
  }).set(0);
}

// A wind turbine standing on its origin, facing us: a tapered tower h tall, the nacelle and hub on top, three blades
// bl long. w.set(deg) turns the blades (clockwise as deg grows); w.hub is the hub in parent coordinates.
function windTurbine(p, { x = 0, y = 0, h = 420, bl = 190, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  path(g, `M-14 0L-6 ${-h}H6L14 0Z`, { fill: '#dfe4e2', ...phLine() });
  phBlock(g, -26, -h - 20, 52, 34, '#c9d0ce', { top: 4 });
  const bl_ = G(g, { y: -h });
  [0, 120, 240].forEach(a => path(G(bl_, { r: a }), `M-7 0L-12 ${-bl * .25}Q-5 ${-bl * .9} 0 ${-bl}Q9 ${-bl * .7} 10 ${-bl * .2}L7 0Z`, { fill: '#eef1ef', ...phLine(2) }));
  mk('circle', { cy: -h, r: 15, fill: '#c9d0ce', ...phLine() }, g);
  return Object.assign(g, { blades: bl_, hub: [x, y - h * s], set(deg) { put(bl_, { r: deg }); return g; } });
}

// A power-line tower standing on its origin, h tall: lattice legs and a cross-arm. pl.top is where the line hangs
// (the arm's right end), in parent coordinates.
function pylon(p, { x = 0, y = 0, h = 240, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o }), w = h * .2, hw = yy => w + (6 - w) * (-yy / h);
  let d = `M${-w} 0L-6 ${-h}M${w} 0L6 ${-h}M${-h * .3} ${-h * .82}H${h * .3}M${-h * .3} ${-h * .82}L-6 ${-h * .7}M${h * .3} ${-h * .82}L6 ${-h * .7}`;
  for (let k = 0; k < 5; k++) { const ya = -k * h * .18, yb = -(k + 1) * h * .18; d += `M${-hw(ya)} ${ya}L${hw(yb)} ${yb}M${hw(ya)} ${ya}L${-hw(yb)} ${yb}`; }
  path(g, d, { stroke: '#aab4b6', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' });
  return Object.assign(g, { top: [x + h * .28 * s, y - h * .82 * s + 4] });
}
// A power line hung through points (pylon tops) with a little sag in each span, electrons running along it:
// pl.set(s) moves them s px along. pl.R is its route.
function powerLine(p, pts, { sag = 22, w = 5, gap = 46, r = 6 } = {}) {
  const P = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    for (let k = 1; k <= 6; k++) { const q = k / 6; P.push([ax + (bx - ax) * q, ay + (by - ay) * q + sag * 4 * q * (1 - q)]); }
  }
  const R = route(P), g = G(p); wire(g, R, { w, color: CABLE });
  const flow = eFlow(g, R, { gap, r });
  return Object.assign(g, { R, flow, set(s) { flow.set(s); return g; } });
}

// Puffs rising from (x, y): n circles that grow, drift and fade on a loop of `per` seconds. pf.set(t, k) draws them
// at time t, k (0..1) how strongly (0: none). Steam white by default; pass SMOKE for smoke.
function puffs(p, x, y, { n = 6, color = STEAM, rise = 160, drift = 50, r0 = 12, r1 = 42, per = 3, op = .85 } = {}) {
  const g = G(p), cs = Array.from({ length: n }, () => mk('circle', { r: r0, fill: color, opacity: 0 }, g));
  return Object.assign(g, {
    set(t, k = 1) {
      cs.forEach((c, i) => {
        const q = (((t / per + i / n) % 1) + 1) % 1;
        thAtt(c, 'cx', x + drift * q + 8 * Math.sin(t * 1.3 + i * 2)); thAtt(c, 'cy', y - rise * q); thAtt(c, 'r', r0 + (r1 - r0) * q);
        thAtt(c, 'opacity', (k * op * Math.min(1, q * 6) * (1 - q)).toFixed(2));
      });
      return g;
    },
  });
}

// A pipe along a route with what it carries moving through it: a wall, a core of colour `color` and lighter dashes
// that travel along it. pf.set(s, k): the dashes s px along (negative runs backwards), k (0..1) how full the pipe
// is (0 empty). walls: false draws an open stream. pf.core and pf.dash take c_stroke tweens.
function pipeFlow(p, R, { w = 26, color = WATER, dash = [28, 24], walls = true } = {}) {
  const g = G(p), at = { fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': walls ? 'butt' : 'round' };
  if (walls) { path(g, R.d, { stroke: PH.out, 'stroke-width': w + 14, ...at }); path(g, R.d, { stroke: '#5d6a6a', 'stroke-width': w + 8, ...at }); path(g, R.d, { stroke: '#1b2422', 'stroke-width': w, ...at }); }
  const core = path(g, R.d, { stroke: color, 'stroke-width': w, ...at });
  const dsh = path(g, R.d, { stroke: lt(color, .5), 'stroke-width': Math.max(3, w * .3), 'stroke-dasharray': dash.join(' '), ...at });
  return Object.assign(g, { core, dash: dsh, R, set(s, k = 1) { thAtt(dsh, 'stroke-dashoffset', -s); const v = k.toFixed(2); thAtt(core, 'opacity', v); thAtt(dsh, 'opacity', v); return g; } });
}

// Wind: n short streaks drifting right across [x0, x1] between rows y0 and y1, wrapping round. wl.set(s) moves them
// s px along (each at its own pace around that). One path.
function windLines(p, { x0 = 0, x1 = 1600, y0 = 100, y1 = 600, n = 16, len = 110, color = '#cfe6f0', w = 4 } = {}) {
  const g = G(p), el = path(g, '', { stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', opacity: .8 }), W = x1 - x0;
  const rows = Array.from({ length: n }, (_, i) => [phHash(i, 3) * W, y0 + (y1 - y0) * phHash(i, 11), .75 + .5 * phHash(i, 7)]);
  return Object.assign(g, {
    set(s) {
      let d = '';
      rows.forEach(([o, yy, k]) => { const xa = x0 + (((o + s * k) % W) + W) % W - len; d += `M${xa.toFixed(1)} ${yy.toFixed(1)}q${len / 4} -9 ${len / 2} 0t${len / 2} 0`; });
      thAtt(el, 'd', d); return g;
    },
  });
}

// A boiler standing on its origin: a brick furnace with a door (fire: false leaves the fire out, for a reactor) under
// a steel tank of water. b.set(t, heat): the flame's size and flicker (heat 0..1) and the water boiling (bubbles
// once heat passes .4). b.out is the steam outlet on the tank's top, b.door the furnace door, in parent coordinates.
function boiler(p, { x = 0, y = 0, w = 220, fh = 120, th = 150, fire = true, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o }), ty = -fh - th;
  phBlock(g, -w / 2, -fh, w, fh, '#8a4e3c', { top: 6 });
  path(g, Array.from({ length: 4 }, (_, i) => `M${-w / 2} ${-fh + 24 + i * 26}H${w / 2}`).join(''), { stroke: '#6b3a2c', 'stroke-width': 3 });
  let flame = null;
  if (fire) {
    mk('rect', { x: -w * .3, y: -fh + 28, width: w * .6, height: fh - 36, rx: 10, fill: '#1b1410', ...phLine() }, g);
    flame = G(g, { y: -10, s: 0 });
    path(flame, 'M0 0C-60 0 -50 -60 -20 -90C-20 -60 0 -60 0 -120C30 -80 60 -60 40 -20C60 -40 50 0 0 0Z', { fill: '#f08c3a', ...phLine(2) });
    path(flame, 'M0 0C-30 0 -26 -34 -8 -56C-6 -38 8 -40 10 -66C26 -40 32 -20 0 0Z', { fill: '#f6d36a' });
  }
  mk('rect', { x: -w / 2 - 6, y: ty, width: w + 12, height: th, rx: 22, fill: '#9aa5a8', ...phLine() }, g);
  const wl = ty + th * .3;
  mk('rect', { x: -w / 2 + 8, y: wl, width: w - 16, height: th * .7 - 10, rx: 14, fill: WATER }, g);
  const bub = path(g, '', { fill: 'none', stroke: lt(WATER, .6), 'stroke-width': 3 });
  phBlock(g, w / 2 - 44, ty - 26, 24, 28, '#9aa5a8', { top: 0 });
  const P = (lx, ly) => [x + lx * s, y + ly * s];
  return Object.assign(g, {
    flame, out: P(w / 2 - 32, ty - 26), door: P(0, -fh / 2), top: P(0, ty), waterY: wl,
    set(t, heat = 1) {
      if (flame) put(flame, { s: heat * (.85 + .08 * Math.sin(t * 13) + .05 * Math.sin(t * 7.3)), x: 3 * Math.sin(t * 9) });
      let d = '';
      if (heat > .4) for (let i = 0; i < 9; i++) { const q = ((t * (.7 + .1 * (i % 3)) + i * .37) % 1), bx = -w / 2 + 24 + (w - 48) * phHash(i, 5) + 6 * Math.sin(t * 5 + i), by = -fh - 14 - q * (th * .7 - 30), rr = 4 + 5 * q; d += `M${(bx - rr).toFixed(1)} ${by.toFixed(1)}a${rr} ${rr} 0 1 0 ${(2 * rr).toFixed(1)} 0a${rr} ${rr} 0 1 0 ${(-2 * rr).toFixed(1)} 0`; }
      thAtt(bub, 'd', d); return g;
    },
  });
}

// A cooling tower standing on its origin, h tall (the waisted shape of power stations). ct.top: its mouth's centre.
function coolingTower(p, { x = 0, y = 0, h = 280, w = 220, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  path(g, `M${-w / 2} 0Q${-w * .2} ${-h * .55} ${-w * .33} ${-h}H${w * .33}Q${w * .2} ${-h * .55} ${w / 2} 0Z`, { fill: '#b7bfbd', ...phLine() });
  path(g, `M${-w * .33} ${-h}H${w * .33}`, { stroke: '#dfe4e2', 'stroke-width': 6 });
  return Object.assign(g, { top: [x, y - h * s] });
}

// A photovoltaic panel at a slant, centred on its origin: w × h with a grid of cells.
function solarPanel(p, { x = 0, y = 0, w = 240, h = 110, sk = 50, s = 1, o = 1, r = 0 } = {}) {
  const g = G(p, { x, y, s, o, r });
  const A = [-w / 2 + sk / 2, -h / 2], B = [w / 2 + sk / 2, -h / 2], C = [w / 2 - sk / 2, h / 2], D = [-w / 2 - sk / 2, h / 2];
  path(g, `M${A}L${B}L${C}L${D}Z`, { fill: '#2a4f8a', ...phLine(3) });
  let d = '';
  for (let i = 1; i < 6; i++) { const q = i / 6; d += `M${A[0] + (B[0] - A[0]) * q} ${A[1]}L${D[0] + (C[0] - D[0]) * q} ${D[1]}`; }
  for (let j = 1; j < 3; j++) { const q = j / 3; d += `M${A[0] + (D[0] - A[0]) * q} ${A[1] + h * q}L${B[0] + (C[0] - B[0]) * q} ${B[1] + h * q}`; }
  path(g, d, { stroke: '#7fa6d8', 'stroke-width': 2.5 });
  return g;
}

// The house sprite with its windows dark until h.set(k) lights them (0 dark, 1 lit).
function litHouse(p, o = {}) {
  const g = phSprite(p, 'house', o), sh = path(g, 'M-48 -48h16v16h-16zM24 -48h16v16h-16z', { fill: '#2a2f2c' });
  return Object.assign(g, { set(k) { thAtt(sh, 'opacity', (1 - Math.max(0, Math.min(1, k))).toFixed(2)); return g; } });
}
