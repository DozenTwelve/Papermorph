// Papermorph science book: heat and temperature (chapter 14 on). Load after energy.js (it uses HEAT, KIN).
'use strict';
const COLD = COL.whole;      // cool molecules, cold water, cool air: blue-grey (heat stays HEAT red)
const LIQ = '#e2553f';       // thermometer liquid
const GLASS = '#c8e0ff';
// Write an attribute only when its rounded value changes.
const thAtt = (e, k, v) => { if (typeof v === 'number') v = Math.round(v * 10) / 10; if (e['_' + k] !== v) e.setAttribute(k, e['_' + k] = v); };
// Distance travelled at time t when the speed changes linearly between keys [[t0, v0], [t1, v1], …] (constant before
// the first key and after the last): a pure function of t, so molecules and air parcels can speed up or slow down and
// still replay exactly.
function phaseOf(t, keys) {
  let s = keys[0][1] * Math.min(t, keys[0][0]);
  for (let i = 0; i < keys.length; i++) {
    const [a, va] = keys[i], [b, vb] = keys[i + 1] || [Infinity, va];
    if (t <= a) break;
    const e = Math.min(t, b), q = (e - a) / (b - a || 1);
    s += (e - a) * (va + (va + (vb - va) * (isFinite(b) ? q : 0))) / 2;
  }
  return s;
}
// A glass thermometer, origin at the bulb's centre, tube rising len px. t.set(f) fills the tube to fraction f (0..1);
// t.yAt(f) is the local y of fraction f.
function thermoTube(p, { len = 400, w = 30, bulb = 30, o = 1, x = 0, y = 0, s = 1 } = {}) {
  const g = G(p, { x, y, s, o }), top = -bulb - len;
  mk('rect', { x: -w / 2, y: top - w / 2, width: w, height: len + w / 2 + bulb, rx: w / 2, fill: '#22322d', stroke: GLASS, 'stroke-width': 3 }, g);
  const liq = mk('rect', { x: -w * .28, width: w * .56, y: -bulb, height: bulb, fill: LIQ }, g);
  mk('circle', { r: bulb, fill: LIQ, stroke: GLASS, 'stroke-width': 3 }, g);
  mk('rect', { x: -w * .32, y: top, width: 4, height: len, rx: 2, fill: GLASS, opacity: .35 }, g);
  mk('circle', { cx: -bulb * .35, cy: -bulb * .35, r: bulb * .22, fill: '#fff', opacity: .45 }, g);
  const yAt = f => -bulb - f * len;
  return Object.assign(g, { yAt, set(f) { const yy = yAt(f); thAtt(liq, 'y', yy); thAtt(liq, 'height', -yy); return g; } });
}
// Molecules in a box [x, y, w, h]: one path of dots and one of speed trails (cheap to redraw). Each molecule flies
// straight and bounces off the walls, at its own speed around the field's (a spread, so temperature is an average).
//   f.set(phase, speed, box?)  phase: distance flown (phaseOf, or speed × t); trails are as long as the speed; box
//                              optionally resizes the field (a liquid column that expands)
//   lattice: true              a solid instead: molecules vibrate about grid places; set(t, amp) where amp is a number
//                              or (i, col, row) => amplitude, so heat can spread through the grid column by column
// f.pos[i] is molecule i's last position; f.dots and f.trails are the two paths (recolour them freely).
function molField(p, { x, y, w, h, n = 16, r = 9, color = HEAT, trail = KIN, seed = 1, lattice = false, cols = 6, trailK = .09 } = {}) {
  const g = G(p), rnd = i => { const v = Math.sin((i + 1) * 91.7 + seed * 47.3) * 43758.5453; return v - Math.floor(v); };
  const trails = path(g, '', { stroke: trail, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', opacity: .75 });
  const dots = path(g, '', { fill: color, ...phLine(2) });
  const tri = z => { const m = ((z % 2) + 2) % 2; return m < 1 ? m : 2 - m; };
  const M = Array.from({ length: n }, (_, i) => {
    const a = rnd(i * 3) * 2 * Math.PI;
    return { a, k: .65 + .7 * rnd(i * 3 + 1), u: rnd(i * 3 + 2) * 2, v: rnd(i * 5 + 7) * 2, ph: rnd(i * 7 + 3) * 6.3, col: i % cols, row: Math.floor(i / cols) };
  });
  const box = [x, y, w, h], pos = M.map(() => [0, 0]);
  const at = (m, s, [bx, by, bw, bh]) => [bx + r + (bw - 2 * r) * tri(m.u + s * m.k * Math.cos(m.a) / Math.max(1, bw - 2 * r)),
                                          by + r + (bh - 2 * r) * tri(m.v + s * m.k * Math.sin(m.a) / Math.max(1, bh - 2 * r))];
  const dot = ([px, py]) => `M${(px - r).toFixed(1)} ${py.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  return Object.assign(g, {
    pos, dots, trails,
    set(s, v, b = box) {
      let dd = '', dt = '';
      M.forEach((m, i) => {
        if (lattice) {
          const gw = b[2] / cols, rows = Math.ceil(n / cols), gh = b[3] / rows, A = typeof v === 'function' ? v(i, m.col, m.row) : v;
          pos[i] = [b[0] + gw * (m.col + .5) + A * Math.sin(11.3 * s + m.ph), b[1] + gh * (m.row + .5) + A * Math.cos(9.1 * s + m.ph * 1.7)];
        } else {
          pos[i] = at(m, s, b);
          const L = trailK * v * 3;
          if (L > 2) { const q = at(m, s - L, b), h2 = at(m, s - L / 2, b); dt += `M${q[0].toFixed(1)} ${q[1].toFixed(1)}L${h2[0].toFixed(1)} ${h2[1].toFixed(1)}L${pos[i][0].toFixed(1)} ${pos[i][1].toFixed(1)}`; }
        }
        dd += dot(pos[i]);
      });
      thAtt(dots, 'd', dd); thAtt(trails, 'd', dt);
      return g;
    },
  });
}
// A rounded-rectangle loop from (x0, y0) to (x1, y1), corner radius r, travelled clockwise on screen starting at the
// bottom of the left side going up: L.len, L.d (its path), L.at(s) → [x, y, heading in degrees] at distance s.
function rrLoop(x0, y0, x1, y1, r) {
  const W = x1 - x0 - 2 * r, H = y1 - y0 - 2 * r, A = Math.PI * r / 2;
  const segs = [   // [length, f(q) → [x, y, heading]]
    [H, q => [x0, y1 - r - q * H, -90]],
    [A, q => { const a = Math.PI + q * Math.PI / 2; return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a), -90 + 90 * q]; }],
    [W, q => [x0 + r + q * W, y0, 0]],
    [A, q => { const a = -Math.PI / 2 + q * Math.PI / 2; return [x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a), 90 * q]; }],
    [H, q => [x1, y0 + r + q * H, 90]],
    [A, q => { const a = q * Math.PI / 2; return [x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a), 90 + 90 * q]; }],
    [W, q => [x1 - r - q * W, y1, 180]],
    [A, q => { const a = Math.PI / 2 + q * Math.PI / 2; return [x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a), 180 + 90 * q]; }],
  ];
  const len = segs.reduce((a, [l]) => a + l, 0);
  return {
    len,
    d: `M${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    at(s) { s = ((s % len) + len) % len; for (const [l, f] of segs) { if (s <= l) return f(s / l); s -= l; } return segs[0][1](0); },
  };
}
// Parcels of a moving fluid along a loop (rrLoop): n chevrons, gap px apart, the first one s px along; a parcel not yet
// released (behind the start) is hidden. colorAt(sAlongLoop) colours each one (warm red rising, cool blue sinking).
function loopFlow(p, loop, { n = 16, gap = loop.len / n, size = 22, colorAt = () => HEAT } = {}) {
  const g = G(p), ch = Array.from({ length: n }, () => path(g, `M${-size * .6} ${-size * .7}L${size * .5} 0L${-size * .6} ${size * .7}`, { stroke: HEAT, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return Object.assign(g, {
    set(s) {
      ch.forEach((c, i) => {
        const si = s - i * gap;
        if (si < 0) { thAtt(c, 'opacity', 0); return; }
        const [x, y, a] = loop.at(si);
        thAtt(c, 'opacity', 1); thAtt(c, 'transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})`);
        thAtt(c, 'stroke', colorAt(((si % loop.len) + loop.len) % loop.len));
      });
      return g;
    },
  });
}
// Wavy rays (radiation) from (x0, y0) towards (x1, y1), fanned over `spread` px at the far end: one path.
// r.set(phase, reach) draws them out to fraction `reach` of the way, the waves travelling with the phase.
function waveRays(p, { x0, y0, x1, y1, n = 3, spread = 120, amp = 12, wl = 46, color = '#ffe9a0', w = 5 } = {}) {
  const g = G(p), el = path(g, '', { stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round' });
  return Object.assign(g, {
    set(ph, reach = 1) {
      let d = '';
      for (let i = 0; i < n; i++) {
        const ex = x1, ey = y1 + (n > 1 ? (i / (n - 1) - .5) * spread : 0), L = Math.hypot(ex - x0, ey - y0), ux = (ex - x0) / L, uy = (ey - y0) / L;
        const end = L * Math.max(0, Math.min(1, reach));
        for (let s = 0; s <= end; s += 6) {
          const o = amp * Math.sin(2 * Math.PI * (s / wl) - ph) * Math.min(1, s / 30);
          d += `${s ? 'L' : 'M'}${(x0 + ux * s - uy * o).toFixed(1)} ${(y0 + uy * s + ux * o).toFixed(1)}`;
        }
      }
      thAtt(el, 'd', d); return g;
    },
  });
}
// Logs with a flame (from ch13): g.flame sits on them; scale it in from 0, flicker with put(g.flame, {s}).
function campfire(p, o = {}) {
  const g = G(p, o);
  path(g, 'M-80 -6L70 -40M-70 -40L80 -6', { stroke: '#7a5236', 'stroke-width': 22, 'stroke-linecap': 'round' });
  path(g, 'M-80 -6L70 -40M-70 -40L80 -6', { stroke: '#9a6a46', 'stroke-width': 8, 'stroke-linecap': 'round' });
  const flame = G(g, { y: -30, s: 0 });
  path(flame, 'M0 0C-60 0 -50 -60 -20 -90C-20 -60 0 -60 0 -120C30 -80 60 -60 40 -20C60 -40 50 0 0 0Z', { fill: '#f08c3a', ...phLine(2) });
  path(flame, 'M0 0C-30 0 -26 -34 -8 -56C-6 -38 8 -40 10 -66C26 -40 32 -20 0 0Z', { fill: '#f6d36a' });
  return Object.assign(g, { flame });
}
