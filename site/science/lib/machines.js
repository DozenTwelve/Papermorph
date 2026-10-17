// Papermorph science book: work and simple-machine helpers (chapter 12 on). Load after physics.js.
'use strict';
const WORK = COL.irr, POWER = COL.real, HEAT = COL.bad;   // work and energy green, power lilac, heat red
const WOOD = '#b08a5a';
// A line of coloured runs that can be rewritten: r.set(...strings) writes run i (null keeps it).
function readout(p, cols, { x = 0, y = 0, size = 44, anchor = 'middle', weight = 700, o = 1 } = {}) {
  const t = T(p, '', { x, y, size, anchor, weight, o });
  const sp = cols.map(c => mk('tspan', { fill: c || COL.chalk }, t));
  return Object.assign(t, { set(...ss) { ss.forEach((s, i) => { if (s != null) phText(sp[i], String(s)); }); return t; } });
}
// "20 N × 1.5 m = 30 J": force orange, distance pink, work green. set(F, d, W) takes numbers or strings ('?').
function workMeter(p, o) {
  const r = readout(p, [FORCE, COL.chalk, DIST, COL.chalk, WORK], o), set = r.set;
  return Object.assign(r, { set(F, d, W = typeof F === 'number' && typeof d === 'number' ? +(F * d).toFixed(1) : '?') { return set(`${F} N`, ' × ', `${d} m`, ' = ', `${W} J`); } });
}
// A distance marker: a line from (x0, y0) to (x1, y1) with end ticks (or an arrowhead at the far end, head: true)
// and its label beside the middle (side as in forceArrow). len 0 hides it.
function distBar(p, { color = DIST, w = 5, size = 30, head = false } = {}) {
  const g = G(p), ln = path(g, '', { stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', fill: 'none' }), lab = phLabel(g, '', { size, fill: color });
  return Object.assign(g, {
    set(x0, y0, x1, y1, text = '', side) {
      const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0), c = Math.cos(a), s = Math.sin(a), k = 12;
      if (L < 2) { ln.setAttribute('d', ''); phText(lab, ''); put(lab, { x: x0, y: y0 }); return g; }   // a fixed spot, so replays match
      if (head) arrowAt(ln, x0, y0, L, a * 180 / Math.PI, 12 + w);
      else ln.setAttribute('d', `M${x0} ${y0}L${x1} ${y1}M${x0 - k * s} ${y0 + k * c}L${x0 + k * s} ${y0 - k * c}M${x1 - k * s} ${y1 + k * c}L${x1 + k * s} ${y1 - k * c}`);
      phText(lab, text);
      const [lx, ly] = arrowLabelAt(x0, y0, L, a * 180 / Math.PI, text, size, w, side); put(lab, { x: lx, y: ly });
      return g;
    },
  });
}
// A ramp: a plank from its foot (x, y) up to (x + run, y − rise); solid: true fills the wedge under it (a stone or
// earth ramp). at(s) returns [x, y, angle°] of the point s px up the slope from the foot (angle < 0 when it rises
// to the right). len: the slope's length.
function incline(p, { x, y, run, rise, color = WOOD, thick = 20, solid = false, rough = false } = {}) {
  const g = G(p), L = Math.hypot(run, rise), c = run / L, s = -rise / L, x1 = x + run, y1 = y - rise;
  if (solid) path(g, `M${x} ${y}L${x1} ${y1}V${y}Z`, { fill: dk(color, .25), ...phLine() });
  else path(g, `M${x1 - 10 * Math.sign(run)} ${y1 + thick}V${y}`, { stroke: dk(color, .35), 'stroke-width': 10 });   // a prop under the top end
  path(g, `M${x} ${y}L${x1} ${y1}L${x1 + thick * -s} ${y1 + thick * c}L${x + thick * -s} ${y + thick * c}Z`.replace(/NaN/g, 0), { fill: color, ...phLine() });
  if (rough) { let d = ''; for (let u = 20; u < L - 10; u += 26) d += `M${x + u * c} ${y + u * s}l${8 * c + 5 * s} ${8 * s - 5 * c}`; path(g, d, { stroke: dk(color, .45), 'stroke-width': 4 }); }
  return Object.assign(g, { len: L, ang: Math.atan2(-rise, run) * 180 / Math.PI, at: u => [x + u * c, y + u * s, Math.atan2(-rise, run) * 180 / Math.PI] });
}
// A lever: a fulcrum triangle standing on y at x (apex h above it) and a plank len long resting on the apex.
// set(angle°) tilts it (positive: the right end goes down); at(u) is the point on the plank's top surface u px from
// the pivot (negative: left of it), as [x, y].
function lever(p, { x, y, h = 110, len = 1100, plank = 22, color = WOOD, base = '#8d8a80' } = {}) {
  const g = G(p), bar = G(g, { x, y: y - h });
  phBlock(bar, -len / 2, -plank, len, plank, color, { top: 5, ol: OL });
  path(g, `M${x} ${y - h}L${x - h * .62} ${y}H${x + h * .62}Z`, { fill: base, ...phLine() });
  let a = 0;
  return Object.assign(g, {
    bar, set(deg) { a = deg * Math.PI / 180; put(bar, { r: deg }); return g; },
    at(u) { const c = Math.cos(a), s = Math.sin(a); return [x + u * c + plank * s, y - h + u * s - plank * c]; },
  });
}
// Work as an area: a rectangle from its bottom-left corner (x, y), F × fu px tall and d × du px wide; the left edge
// is the force (orange), the bottom edge the distance (pink), the area the work (green). set(F, d) redraws it.
function workArea(p, { x, y, fu, du, size = 30 }) {
  const g = G(p), box = mk('rect', { x, fill: WORK, opacity: .32 }, g);
  const fe = path(g, '', { stroke: FORCE, 'stroke-width': 7 }), de = path(g, '', { stroke: DIST, 'stroke-width': 7 });
  const fl = phLabel(g, '', { size, fill: FORCE, anchor: 'end' }), dl = phLabel(g, '', { size, fill: DIST }), wl = phLabel(g, '', { size: size + 4, fill: WORK });
  return Object.assign(g, {
    set(F, d, W = `${+(F * d).toFixed(1)} J`) {
      const h = F * fu, w = d * du;
      box.setAttribute('y', y - h); box.setAttribute('width', w); box.setAttribute('height', h);
      fe.setAttribute('d', `M${x} ${y}V${y - h}`); de.setAttribute('d', `M${x} ${y}H${x + w}`);
      phText(fl, `${F} N`); put(fl, { x: x - 16, y: y - h / 2 + 10 });
      phText(dl, `${d} m`); put(dl, { x: x + w / 2, y: y + size + 12 });
      phText(wl, W); put(wl, { x: x + w / 2, y: y - h / 2 + 12 });
      return g;
    },
  });
}
// A wooden crate shoved up a ramp sits rotated on the slope: place it at incline point [x, y, ang].
const onSlope = (e, [x, y, a]) => put(e, { x, y, r: a });
