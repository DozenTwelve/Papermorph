// Papermorph science book: energy helpers (chapter 13 on). Load after machines.js (it uses HEAT and WORK).
'use strict';
// The forms of energy: kinetic takes velocity's yellow (energy of motion), potential blue, chemical lime, light pale
// gold, sound grey-white; heat stays HEAT (red).
const KIN = COL.int, POT = '#7f9cf5', CHEM = '#b5dd5a', LIGHT = '#ffe9a0', SOUND = '#cfd8d4';
// One energy block, centred on its origin: b.set(colour) recolours it (the form it is in), writing only on change.
// b.color() is its current colour. Blocks move between objects and change colour but never appear or vanish: that is conservation.
function eBlock(p, color, { size = 30, x = 0, y = 0, o = 1 } = {}) {
  const g = G(p, { x, y, o }), r = mk('rect', { x: -size / 2, y: -size / 2, width: size, height: size, rx: size * .2, fill: color, ...phLine(2) }, g);
  mk('rect', { x: -size * .32, y: -size * .32, width: size * .34, height: size * .16, rx: 2, fill: '#fff', opacity: .5 }, g);
  r._c = color;
  return Object.assign(g, { set(c) { if (r._c !== c) r.setAttribute('fill', r._c = c); return g; }, color: () => r._c });
}
const eBlocks = (p, n, color, o) => Array.from({ length: n }, () => eBlock(p, color, o));
// Where block i of a pile sits: a pile cols wide, centred on x, its bottom row resting on y.
const heapAt = (i, x, y, { cols = 3, size = 30, gap = 6 } = {}) => {
  const n = size + gap;
  return [x + ((i % cols) - (cols - 1) / 2) * n, y - size / 2 - Math.floor(i / cols) * n];
};
// Energy bars: one column per form standing on a baseline from x at y, unit px per unit of energy, and a dashed line
// at the total, which never moves. cols: [[name, colour], …]. set(...values): a number fills the column in its own
// colour; [a, b, colourB] stacks b in colourB on top of a (one object changing form).
function energyBars(p, { x, y, cols, total, unit = 30, w = 90, gap = 44, size = 28, title = '' }) {
  const g = G(p), W = cols.length * w + (cols.length - 1) * gap;
  g.classList.add('ebars');   // tests read the columns' heights here
  const segs = cols.map(([name, c], i) => {
    const bx = x + i * (w + gap);
    phLabel(g, name, { x: bx + w / 2, y: y + size + 12, size, fill: c });
    return [mk('rect', { x: bx, y, width: w, height: 0, fill: c }, g), mk('rect', { x: bx, y, width: w, height: 0, fill: c }, g)];
  });
  path(g, `M${x - 20} ${y}H${x + W + 20}`, { stroke: COL.chalk, 'stroke-width': 4 });
  if (total) {
    const ty = y - total * unit;
    path(g, `M${x - 20} ${ty}H${x + W + 20}`, { stroke: COL.chalk, 'stroke-width': 3, 'stroke-dasharray': '12 9' });
    phLabel(g, 'total', { x: x + W + 30, y: ty + 9, size: size - 2, fill: COL.chalk, anchor: 'start' });
  }
  if (title) phLabel(g, title, { x: x + W / 2, y: y - (total || 0) * unit - 34, size: size + 2 });
  const att = (e, k, v) => { v = Math.round(v * 10) / 10; if (e['_' + k] !== v) e.setAttribute(k, e['_' + k] = v); };
  return Object.assign(g, {
    set(...vals) {
      vals.forEach((v, i) => {
        const [a, b = 0, cb] = Array.isArray(v) ? v : [v], [r1, r2] = segs[i], h1 = Math.max(0, a) * unit, h2 = Math.max(0, b) * unit;
        att(r1, 'y', y - h1); att(r1, 'height', h1); att(r2, 'y', y - h1 - h2); att(r2, 'height', h2);
        if (cb && r2._fill !== cb) r2.setAttribute('fill', r2._fill = cb);
      });
      return g;
    },
  });
}
// Wavy lines rising from (x, y) in colour c (heat by default): a group to place and fade.
function riseLines(p, x, y, { n = 3, c = HEAT, h = 36 } = {}) {
  const g = G(p, { x, y, o: 0 });
  for (let i = 0; i < n; i++) path(g, `M${(i - (n - 1) / 2) * 22} 0c-10 ${-h / 3} 10 ${-2 * h / 3} 0 ${-h}s10 ${-2 * h / 3} 0 ${-h}`, { stroke: c, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' });
  return g;
}
// Sound arcs spreading from (x, y) towards dir (1 right, −1 left): a.set(k) draws n arcs at phase k (0..1 loops).
function soundArcs(p, x, y, { n = 3, dir = 1, r0 = 20, step = 26, c = SOUND } = {}) {
  const g = G(p, { x, y }), arcs = Array.from({ length: n }, () => path(g, '', { stroke: c, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }));
  return Object.assign(g, {
    set(k) {
      arcs.forEach((a, i) => {
        const f = (i + k) / n, r = r0 + f * step * n, s = Math.sin(.7);
        a.setAttribute('d', `M${dir * r * Math.cos(.7)} ${-r * s}A${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${dir * r * Math.cos(.7)} ${r * s}`);
        a.setAttribute('opacity', (1 - f).toFixed(2));
      });
      return g;
    },
  });
}
