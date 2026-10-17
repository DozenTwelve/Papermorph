// Papermorph science book: waves, rays and the electromagnetic spectrum (chapter 15 on). Load after thermal.js
// (it uses thAtt) and energy.js (LIGHT, SOUND).
'use strict';
// What each measurement of a wave is drawn in: amplitude green (energy), wavelength pink (distance), frequency blue
// (time), wave speed yellow (velocity).
const AMP = COL.irr, WLEN = COL.rat, FREQ = COL.whole, WSPD = COL.int;
const ROYGBIV = ['#ff4b3e', '#ff9a2e', '#ffe14a', '#5fd36a', '#4a8dff', '#5a4fd8', '#a45ce8'];
const TAU = Math.PI * 2;
// A wave's height above its resting line at x: crest up. Phase ph grows with time for a wave travelling right.
const waveY = (x, x0, A, wl, ph) => -A * Math.sin(TAU * (x - x0) / wl - ph);
// A travelling wave on a resting line y from x0 to x1: one path. w.set(A, wl, ph, { from, to, env }) redraws it
// (from/to clip it; env(x) scales the height, e.g. a front that has not reached x yet). w.at(x) is the screen y at x
// of the last drawn wave. fill: a colour fills under the surface down to y + depth (water).
function waveLine(p, { x0, x1, y, color = COL.chalk, w = 6, step = 5, fill, depth = 300, o = 1 } = {}) {
  const g = G(p, { o }), body = fill ? path(g, '', { fill, opacity: .5 }) : null;
  const el = path(g, '', { stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  let last = [0, 100, 0, null];
  return Object.assign(g, {
    el, body,
    set(A, wl, ph = 0, { from = x0, to = x1, env } = {}) {
      last = [A, wl, ph, env];
      let d = '';
      for (let x = from; x <= to + .01; x += step) { const xx = Math.min(x, to); d += `${x === from ? 'M' : 'L'}${xx.toFixed(1)} ${(y + waveY(xx, x0, A * (env ? env(xx) : 1), wl, ph)).toFixed(1)}`; }
      thAtt(el, 'd', d);
      if (body) thAtt(body, 'd', d + `L${to} ${y + depth}L${from} ${y + depth}Z`);
      return g;
    },
    at(x) { const [A, wl, ph, env] = last; return y + waveY(x, x0, A * (env ? env(x) : 1), wl, ph); },
  });
}
// A wave whose wavelength shrinks evenly on a log scale from wl0 at x0 to wl1 at x1 (long to short): one path.
function chirp(p, { x0, x1, y, A = 26, wl0 = 300, wl1 = 8, color = COL.chalk, w = 4 }) {
  const r = wl1 / wl0, L = x1 - x0, k = L / (wl0 * Math.log(r));
  const phase = x => { const u = (x - x0) / L; return TAU * k * (1 - Math.pow(r, -u)) * -1; };
  const el = path(p, '', { stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linejoin': 'round' });
  // el.set(ph) redraws it with every crest moved on by ph radians (the wave travels right as ph grows)
  el.set = (ph = 0) => {
    let d = '';
    for (let x = x0; x <= x1; ) { d += `${x === x0 ? 'M' : 'L'}${x.toFixed(1)} ${(y - A * Math.sin(phase(x) - ph)).toFixed(1)}`; x += Math.max(.8, wl0 * Math.pow(r, (x - x0) / L) / 12); }
    thAtt(el, 'd', d); return el;
  };
  return el.set(0);
}
// The electromagnetic spectrum as a bar from x (wavelength 10^4 m) to x + w (10^-12 m), true to a log scale, so the
// visible slice (700–400 nm) is as thin as it really is. b.xOf(e) is the x of wavelength 10^e m; b.bands[name] a group
// (rect + label) to dim or highlight; b.ticks the axis group. Bands' order: low energy (left) to high (right).
const EM_BANDS = [['radio', 4, -.5, 'radio'], ['micro', -.5, -2.5, 'microwaves'], ['ir', -2.5, -6.155, 'infrared'],
  ['vis', -6.155, -6.398, ''], ['uv', -6.398, -8, 'ultraviolet'], ['x', -8, -11, 'X-rays'], ['gamma', -11, -12, 'gamma']];
function spectrumBar(p, { x = 100, y = 420, w = 1400, h = 80, size = 24, ticks = true } = {}) {
  const g = G(p), xOf = e => x + (4 - e) / 16 * w, bands = {};
  EM_BANDS.forEach(([k, e0, e1, name], i) => {
    const b = G(g), x0 = xOf(e0), x1 = xOf(e1);
    if (k === 'vis') { const sw = (x1 - x0) / 7; ROYGBIV.forEach((c, j) => mk('rect', { x: x0 + j * sw, y, width: sw + .4, height: h, fill: c }, b)); }
    else mk('rect', { x: x0, y, width: x1 - x0, height: h, fill: i % 2 ? '#3b5650' : '#2f4842' }, b);
    if (name) T(b, name, { x: (x0 + x1) / 2, y: y + h / 2 + size * .35, size, fill: COL.chalk, anchor: 'middle', weight: 700 });
    bands[k] = b;
  });
  mk('rect', { x, y, width: w, height: h, fill: 'none', stroke: COL.dim, 'stroke-width': 2 }, g);
  const tk = G(g);
  if (ticks) {
    let d = '';
    for (let e = 4; e >= -12; e -= 2) { d += `M${xOf(e)} ${y + h}v14`; T(tk, '10' + supNum(e), { x: xOf(e), y: y + h + 46, size: 24, fill: COL.dim, anchor: 'middle', weight: 600 }); }
    path(tk, d, { stroke: COL.dim, 'stroke-width': 2.5 });
    T(tk, 'wavelength (meters)', { x: x + w / 2, y: y + h + 86, size: 24, fill: WLEN, anchor: 'middle', weight: 600 });
  }
  return Object.assign(g, { xOf, bands, ticks: tk, y, h, box: k => { const [, e0, e1] = EM_BANDS.find(b => b[0] === k); return [xOf(e0), y, xOf(e1) - xOf(e0), h]; } });
}
const supNum = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '-' ? '⁻' : c)).join('');
// A sound wave as molecules: a grid of dots [x, y, w, h], each displaced along x by A·sin(k·x − ph), so they crowd
// (compressions) and spread (expansions) along the direction of travel. f.set(ph, A, wl, reach) moves them (reach:
// the wave's front, dots past it stay put); f.xAt(i, ph, A, wl) is dot column i's x; f.comp(ph, wl, n) the x of the
// n-th compression's centre (where dots crowd most).
function longField(p, { x, y, w, h, cols = 48, rows = 8, r = 6, color = SOUND, o = 1, seed = 1 } = {}) {
  const g = G(p, { o }), el = path(g, '', { fill: color }), dx = w / (cols - 1), dy = h / (rows - 1);
  const base = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) base.push([x + i * dx + (phHash(i + j * 97, seed) - .5) * dx * .3, y + j * dy + (phHash(i, j + seed) - .5) * dy * .4]);
  const shift = (bx, ph, A, wl, reach) => (bx > reach ? 0 : A * Math.sin(TAU * (bx - x) / wl - ph));
  return Object.assign(g, {
    el,
    set(ph, A = 14, wl = 160, reach = Infinity) {
      let d = '';
      base.forEach(([bx, by]) => { const px = bx + shift(bx, ph, A, wl, reach); d += `M${(px - r).toFixed(1)} ${by.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`; });
      thAtt(el, 'd', d); return g;
    },
    xAt(i, j, ph, A, wl, reach = Infinity) { const [bx, by] = base[j * cols + i]; return [bx + shift(bx, ph, A, wl, reach), by]; },
    // s = A sin(k(x − x0) − ph) crowds the dots where its slope is most negative: k(x − x0) − ph = π (mod 2π)
    comp(ph, wl, n = 0) { return x + (Math.PI + ph) / TAU * wl + n * wl - Math.floor((Math.PI + ph) / TAU) * wl; },
  });
}
// A light ray along points [[x, y], …]: g.line (drawable, {d: 0}) and an arrowhead in the middle of each segment.
// drawn: true makes it already drawn (no draw-on).
function lightRay(p, pts, { color = LIGHT, w = 6, heads = true, o = 1, dash, drawn = false } = {}) {
  const g = G(p, { o });
  const line = path(g, pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(''), { stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(dash ? { 'stroke-dasharray': dash } : {}) }, dash || drawn ? {} : { d: 0 });
  let hd = '';
  if (heads) for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, mx = ax + ux * L * .55, my = ay + uy * L * .55, k = 10 + w;
    hd += `M${(mx - ux * k - uy * k * .7).toFixed(1)} ${(my - uy * k + ux * k * .7).toFixed(1)}L${mx.toFixed(1)} ${my.toFixed(1)}L${(mx - ux * k + uy * k * .7).toFixed(1)} ${(my - uy * k - ux * k * .7).toFixed(1)}`;
  }
  const head = path(g, hd, { stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  return Object.assign(g, { line, head });
}
// An angle arc of radius r about (cx, cy) from screen angle a0 to a1 (degrees, 0 right, 90 down).
function angleArc(p, cx, cy, r, a0, a1, { color = COL.chalk, w = 4 } = {}) {
  const P = a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)], [x0, y0] = P(a0), [x1, y1] = P(a1);
  return path(p, `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${x1.toFixed(1)} ${y1.toFixed(1)}`, { stroke: color, 'stroke-width': w, fill: 'none' });
}
// Snell's law for a unit direction d crossing a surface with unit normal nrm (pointing back toward the incoming side),
// from index n1 into n2: the new unit direction (null on total internal reflection). reflectDir mirrors d in it.
function refractDir([dx, dy], [nx, ny], n1, n2) {
  const c = -(dx * nx + dy * ny), r = n1 / n2, k = 1 - r * r * (1 - c * c);
  if (k < 0) return null;
  const q = r * c - Math.sqrt(k); return [r * dx + q * nx, r * dy + q * ny];
}
const reflectDir = ([dx, dy], [nx, ny]) => { const c = dx * nx + dy * ny; return [dx - 2 * c * nx, dy - 2 * c * ny]; };
