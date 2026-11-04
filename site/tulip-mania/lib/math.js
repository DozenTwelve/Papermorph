// Papermorph maths helpers: number lines, tiles, fractions, planes, dice, the number map, sorter.
// A maths chapter loads this right after engine.js; it uses the engine's globals as it loads.
'use strict';
// Vertical number line at x; Yf maps a value to its y. Labels sit on the left.
function vAxis(p, { x, Yf, lo, hi, step = 1, t0 = .1, unit = '' }) {
  draw(path(p, `M${x} ${Yf(lo - .5)}V${Yf(hi + .5)}`, { stroke: COL.chalk, 'stroke-width': 3 }, { d: 0 }), t0, .8);
  for (let v = lo; v <= hi; v += step) {
    const g = G(p, { o: 0 });
    path(g, `M${x - 9} ${Yf(v)}H${x + 9}`, { stroke: COL.dim, 'stroke-width': 2.5 });
    T(g, num(v) + unit, { x: x - 46, y: Yf(v) + 9, size: 24, fill: v === 0 ? COL.chalk : COL.dim, font: MATH, anchor: 'end' });
    show(g, t0 + .2 + Math.abs(v - lo) * .02);
  }
}
// Thermometer from lo (bottom) to hi (top). set(v, t0, run) moves the column; run = tw (lesson) or fx (answer).
function thermometer(p, { x = 800, bottom = 600, top = 200, lo = -10, hi = 15, step = 5, value = 0, color = COL.nat } = {}) {
  const Yt = v => bottom - (v - lo) / (hi - lo) * (bottom - top), bulb = bottom + 32, g = G(p);
  mk('rect', { x: x - 18, y: top - 24, width: 36, height: bulb - top + 24, rx: 18, fill: COL.board, stroke: COL.dim, 'stroke-width': 2.5 }, g);
  mk('circle', { cx: x, cy: bulb, r: 26, fill: color }, g);
  const merc = put(mk('rect', { x: x - 9, width: 18, rx: 9, fill: color }, g), { a_y: Yt(value), a_height: bulb - Yt(value) });
  for (let v = lo; v <= hi; v += step) {
    path(g, `M${x - 30} ${Yt(v)}H${x - 18}`, { stroke: COL.dim, 'stroke-width': 2 });
    T(g, `${num(v)}°`, { x: x - 40, y: Yt(v) + 9, size: 24, fill: v === 0 ? COL.chalk : COL.dim, font: MATH, anchor: 'end' });
  }
  return { g, merc, Yt, set: (v, t0, run = tw, dur = 1.2) => run(merc, { a_y: Yt(v), a_height: bulb - Yt(v) }, t0, dur) };
}
/* ---------- fractions: rows with strikable parts, bars and brackets ---------- */
// A row of fractions and symbols whose numerators and denominators can be struck out one by one.
// items: { f: [n, d], fill } | 'symbol text'. The fraction bars sit on y.
function fracRow(p, items, { x = 800, y = 300, size = 60, anchor = 'middle', o = 0 } = {}) {
  const fs = size * .8, g = G(p, { o });
  const els = items.map(it => {
    if (typeof it === 'string') {
      const w = textW(it, size);
      return { w, draw(cx) { this.cx = cx; T(g, it, { x: cx, y: y + size * .33, size, font: MATH, fill: COL.chalk, anchor: 'middle' }); } };
    }
    const [n, d] = it.f.map(String), w = Math.max(textW(n, fs), textW(d, fs)) + size * .35, fill = it.fill || COL.chalk;
    return { w, n, d, draw(cx) {
      this.cx = cx;
      path(g, `M${cx - w / 2 + 4} ${y}H${cx + w / 2 - 4}`, { stroke: fill, 'stroke-width': size * .055 });
      this.num = T(g, n, { x: cx, y: y - size * .18, size: fs, font: MATH, fill, anchor: 'middle' });
      this.den = T(g, d, { x: cx, y: y + size * .78, size: fs, font: MATH, fill, anchor: 'middle' });
    } };
  });
  const total = els.reduce((a, e) => a + e.w, 0);
  let cx = anchor === 'middle' ? x - total / 2 : x;
  for (const e of els) { e.draw(cx + e.w / 2); cx += e.w; }
  return Object.assign(els, { g, y, size, x0: anchor === 'middle' ? x - total / 2 : x, w: total });
}
// Strike the numerator ('num') or denominator ('den') of fraction k and write its reduced value beside it.
function reduce(row, k, part, value, color, t0, run = tw) {
  const e = row[k], { y, size } = row, top = part === 'num';
  const cy = top ? y - size * .42 : y + size * .52, g = row.g;
  const slash = path(g, `M${e.cx - size * .28} ${cy + size * .3}L${e.cx + size * .28} ${cy - size * .3}`, { stroke: color, 'stroke-width': 3.5 }, { d: 0 });
  const nv = T(g, String(value), { x: e.cx + size * .02, y: top ? y - size * .92 : y + size * 1.36, size: size * .5, font: MATH, fill: color, anchor: 'middle', o: 0 });
  run(slash, { d: 1 }, t0, .4); run(nv, { o: 1 }, t0 + .3, .4);
  run(e[part], { o: .45 }, t0 + .3, .4);
}
function rect(p, x, y, w, h, fill, o = 0, stroke = 'none') {
  return put(mk('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': 2.5 }, p), { o });
}
function bracketH(p, x1, x2, y, label, color, t0) {
  draw(path(p, `M${x1} ${y - 10}V${y}H${x2}V${y - 10}`, { stroke: color, 'stroke-width': 3 }, { d: 0 }), t0, .5);
  show(T(p, label, { x: (x1 + x2) / 2, y: y + 32, size: 26, fill: color, font: MATH, anchor: 'middle', o: 0 }), t0 + .3);
}

/* ---------- decimal point that hops between digits (ch10, ch20) ---------- */
// Digits in evenly spaced slots with a decimal point that can hop between them.
// places = digits after the point (0 = point at the far right, hidden).
function pointRow(p, digits, x, y, places, { size = 72, fill = COL.chalk, sign = '' } = {}) {
  const g = G(p, { o: 0 }), w = size * .7, n = digits.length, x0 = x - n * w / 2;
  if (sign) T(g, sign, { x: x0 - w * .6, y, size, fill, font: MATH, anchor: 'middle' });
  const ds = [...digits].map((c, i) => T(g, c, { x: x0 + i * w + w / 2, y, size, fill, font: MATH, anchor: 'middle' }));
  const px = k => x0 + (n - k) * w;
  const dot = mk('circle', { r: size * .065, fill: COL.task }, g);
  put(dot, { x: px(places), y: y - size * .02, o: places ? 1 : 0 });
  const trail = path(g, '', { stroke: COL.task, 'stroke-width': 2.5, 'stroke-dasharray': '5 6' });
  return { g, ds, dot, px, w,
    hop(from, to, t0, run = tw, dur = .55) {
      const steps = Math.abs(to - from);
      run(dot, { o: 1 }, t0, .2);
      let d = '';
      for (let k = 0; k < steps; k++) {
        const a = px(from + Math.sign(to - from) * k), b = px(from + Math.sign(to - from) * (k + 1));
        d += `M${a} ${y - 10}Q${(a + b) / 2} ${y - size * .9} ${b} ${y - 10}`;
      }
      trail.setAttribute('d', d);
      put(trail, { o: 0 }); run(trail, { o: .9 }, t0 + steps * dur, .3);
      (run === tw ? prog : fxp)(q => {
        const s = q * steps, k = Math.min(steps - 1, Math.floor(s)), f = s - k;
        const a = px(from + Math.sign(to - from) * k), b = px(from + Math.sign(to - from) * (k + 1));
        put(dot, { x: a + (b - a) * f, y: y - size * .02 - Math.sin(Math.PI * f) * size * .7 });
      }, t0, steps * dur, lin);
    } };
}

/* ---------- balance scale for equations (ch24, ch25) ---------- */
// A balance scale. Its pans hang from the beam ends; tilt(deg, t0) rocks it (positive: left side down).
function balance(p, { x = 800, y = 330, L = 300 } = {}) {
  const g = G(p, { o: 0 });
  path(g, `M${x} ${y}L${x - 50} ${y + 330}H${x + 50}Z`, { stroke: COL.dim, 'stroke-width': 3, fill: mix(COL.board, COL.dim, .15) });
  const beam = G(g, { x, y });
  path(beam, `M${-L} 0H${L}`, { stroke: COL.chalk, 'stroke-width': 6 });
  mk('circle', { r: 10, fill: COL.chalk }, beam);
  const pan = side => {
    const pg = G(g, { x: x + side * L, y });
    path(pg, 'M0 0L-90 110M0 0L90 110', { stroke: COL.dim, 'stroke-width': 2 });
    path(pg, 'M-110 110Q0 150 110 110Z', { stroke: side < 0 ? COL.whole : COL.nat, 'stroke-width': 3, fill: mix(COL.board, side < 0 ? COL.whole : COL.nat, .2) });
    return pg;
  };
  const Lp = pan(-1), Rp = pan(1);
  let angle = 0;
  const place = a => {
    const r = a * Math.PI / 180, dx = L * Math.cos(r), dy = L * Math.sin(r);
    put(beam, { r: -a }); put(Lp, { x: x - dx, y: y + dy }); put(Rp, { x: x + dx, y: y - dy });
  };
  return {
    g, L: Lp, R: Rp,
    // Content sits on a pan: text or math at (0, 90) in pan coordinates.
    load(side, parts, color, t0, size = 44) { const e = M(side < 0 ? Lp : Rp, parts, { y: 96, size, fill: color, o: 0 }); show(e, t0); return e; },
    tilt(a, t0, run = prog) { const from = angle; angle = a; run(q => place(from + (a - from) * back(q)), t0, .9); },
  };
}
/* ---------- algebra tiles (ch23, ch25) ---------- */
const XL = 120, UN = 30;            // length of x, size of 1
const TS = { x2: [XL, XL, COL.real], x: [UN, XL, COL.whole], y: [UN, 90, COL.nat], one: [UN, UN, COL.int] };
function atile(p, kind, x, y, neg = false, o = 0) {
  const [w, h, c] = TS[kind], g = G(p, { x, y, o, s: o ? 1 : .6 });
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 5, fill: neg ? COL.board : mix(COL.board, c, .55), stroke: neg ? COL.bad : c, 'stroke-width': neg ? 3.5 : 2.5, 'stroke-dasharray': neg ? '7 5' : '' }, g);
  g.kind = kind; g.neg = neg;
  return g;
}
const popIn = (els, t0, step = .08) => els.forEach((e, i) => tw(e, { o: 1, s: 1 }, t0 + i * step, .35, back));
// n tiles of a kind in a row starting at x.
const tileRow = (p, kind, n, x, y, neg = false, gap = 12) => Array.from({ length: n }, (_, i) => atile(p, kind, x + i * (TS[kind][0] + gap), y, neg));
// Pair each negative tile with a positive one: they move together and vanish.
function cancel(pos, negs, t0) {
  negs.forEach((n, i) => {
    const a = pos[i];
    tw(n, { x: st(a).x, y: st(a).y }, t0 + i * .3, .6);
    tw(n, { o: 0, s: .5 }, t0 + i * .3 + .7, .3); tw(a, { o: 0, s: .5 }, t0 + i * .3 + .7, .3);
  });
}
/* ---------- inequality graphs (ch26, ch27) ---------- */
// Solution ray on the number line: endpoint v, closed or open circle, dir +1 (right) or −1 (left).
function ray(p, v, closed, dir, t0, color = COL.task, run = tw) {
  const end = X(dir > 0 ? 5.7 : -5.7), g = G(p, { o: 1 });
  const line = path(g, `M${X(v)} ${Y0}H${end}`, { stroke: color, 'stroke-width': 7 }, { d: 0 });
  const head = path(g, `M${end - 18 * dir} ${Y0 - 13}L${end} ${Y0}L${end - 18 * dir} ${Y0 + 13}`, { stroke: color, 'stroke-width': 6 }, { o: 0 });
  const dot = G(g, { x: X(v), y: Y0, s: 0, o: 0 });
  mk('circle', { r: 13, fill: closed ? color : COL.board, stroke: color, 'stroke-width': 4 }, dot);
  run(dot, { s: 1, o: 1 }, t0, .4, back);
  run(line, { d: 1 }, t0 + .3, .8); run(head, { o: 1 }, t0 + 1, .2);
  return g;
}
// Segment between a and b on the number line, each end open or closed.
function segment(p, a, b, ca, cb, t0, color = COL.task, run = tw) {
  const g = G(p, { o: 1 });
  const line = path(g, `M${X(a)} ${Y0}H${X(b)}`, { stroke: color, 'stroke-width': 7 }, { d: 0 });
  const ends = [[a, ca], [b, cb]].map(([v, c]) => {
    const d = G(g, { x: X(v), y: Y0, s: 0, o: 0 });
    mk('circle', { r: 13, fill: c ? color : COL.board, stroke: color, 'stroke-width': 4 }, d);
    run(d, { s: 1, o: 1 }, t0, .4, back);
    return d;
  });
  run(line, { d: 1 }, t0 + .3, .8);
  g.parentNode.appendChild(g); ends.forEach(e => g.appendChild(e));
  return g;
}
/* ---------- equation steps (ch25 onward) ---------- */
// One line of an equation or inequality with its sign at xEq, so a column of steps lines up. note: grey hint on the right.
function eqLine(p, L, R, y, t0, { xEq = 760, fill = COL.chalk, size = 50, note, sym = '=', symFill, noteX = 1180 } = {}) {
  const g = G(p, { o: 0 });
  M(g, [].concat(L), { x: xEq - size * .6, y, size, fill, anchor: 'end' });
  M(g, [sym], { x: xEq, y, size, fill: symFill || fill });
  M(g, [].concat(R), { x: xEq + size * .6, y, size, fill, anchor: 'start' });
  if (note) T(g, note, { x: noteX, y: y - 8, size: 26, fill: COL.task, weight: 600 });
  show(g, t0);
  return g;
}
/* ---------- data on a number line: dot plots (unit 7) ---------- */
// Axis for data from lo to hi drawn between x0 and x1 at baseline y; every: label every n-th tick.
// shape 'x' draws line-plot crosses instead of dots.
// Returns D: D.V(value) -> x; D.dot(v, color, t0) stacks a dot above v; D.mark(v, color, t0, label) is a
// balance triangle under the axis that can slide with D.slide(mark, v, t0).
function dataLine(p, { lo, hi, x0 = 200, x1 = 1400, y = 600, step = 1, every = 1, t0 = .1, r = 13, size = 22, shape = 'dot' }) {
  const V = v => x0 + (v - lo) / (hi - lo) * (x1 - x0), g = G(p, { o: 0 });
  path(g, `M${x0 - 24} ${y}H${x1 + 24}`, { stroke: COL.dim, 'stroke-width': 3 });
  for (let v = lo, i = 0; v <= hi + 1e-9; v += step, i++) {
    path(g, `M${V(v)} ${y - 7}V${y + 7}`, { stroke: COL.dim, 'stroke-width': 2 });
    if (i % every === 0) T(g, num(+v.toFixed(6)), { x: V(v), y: y + 26 + size, size, fill: COL.dim, font: MATH, anchor: 'middle' });
  }
  show(g, t0);
  const D = {
    g, V, y, r, count: {},
    top: v => y - 6 - r - ((D.count[v] || 1) - 1) * (2 * r + 5),
    dot(v, color, t0, { run = tw, into = p, from } = {}) {
      D.count[v] = (D.count[v] || 0) + 1;
      let d;
      if (shape === 'x') { d = G(into); path(d, `M${-r * .75} ${-r * .75}L${r * .75} ${r * .75}M${r * .75} ${-r * .75}L${-r * .75} ${r * .75}`, { stroke: color, 'stroke-width': 5 }); }
      else d = mk('circle', { r, fill: color, stroke: COL.board, 'stroke-width': 2 }, into);
      put(d, { x: V(v), y: D.top(v), s: 0, o: 0 });
      if (from !== undefined) { put(d, { y: from, s: 1 }); run(d, { o: 1 }, t0, .2); run(d, { y: D.top(v) }, t0, .7, back); }
      else run(d, { s: 1, o: 1 }, t0, .45, back);
      return d;
    },
    dots: (vals, color, t0, gap = .15, opts) => vals.map((v, i) => D.dot(v, color, t0 + i * gap, opts)),
    mark(v, color, t0, label, { run = tw, into = p } = {}) {
      const m = G(into, { x: V(v), y, o: 0 });
      path(m, 'M0 4L-17 30H17Z', { fill: color, stroke: COL.board, 'stroke-width': 2 });
      if (label) T(m, label, { y: 64 + size, size: 24, fill: color, weight: 600, anchor: 'middle' });
      run(m, { o: 1 }, t0, .4);
      return m;
    },
    slide: (m, v, t0, run = tw, dur = 1.2) => run(m, { x: V(v) }, t0, dur),
    // Bracket above the data from a to b at height yb, with a label.
    span(a, b, yb, label, color, t0, { run = tw, into = p } = {}) {
      const g = G(into), l = path(g, `M${V(a)} ${yb + 12}V${yb}H${V(b)}V${yb + 12}`, { stroke: color, 'stroke-width': 3 }, { d: 0 });
      run(l, { d: 1 }, t0, .6);
      const t = M(g, [label], { x: (V(a) + V(b)) / 2, y: yb - 14, size: 28, fill: color, o: 0 });
      run(t, { o: 1 }, t0 + .4, .4);
      return g;
    },
  };
  return D;
}
/* ---------- chance: number cubes, coins, spinners (unit 7) ---------- */
// A number cube face showing n pips, centred on (x, y).
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function die(p, n, x, y, s = 96, o = 0) {
  const g = G(p, { x, y, o, s: o ? 1 : .6 });
  g._box = mk('rect', { x: -s / 2, y: -s / 2, width: s, height: s, rx: s * .18, fill: mix(COL.board, COL.chalk, .1), stroke: COL.chalk, 'stroke-width': 3 }, g);
  PIPS[n].forEach(([a, b]) => mk('circle', { cx: a * s * .26, cy: b * s * .26, r: s * .085, fill: COL.chalk }, g));
  return g;
}
// Spinner with equal sections; pointer starts straight up. land(k) is the rotation that points at section k.
const SPIN = [COL.whole, COL.nat, COL.int, COL.whole, COL.irr, COL.nat, COL.whole, COL.int];
function spinner(p, cx, cy, r, t0, cols = SPIN) {
  const g = G(p, { x: cx, y: cy, o: 0 }), n = cols.length, secs = [];
  cols.forEach((c, i) => {
    const a1 = (-90 + i * 360 / n) * Math.PI / 180, a2 = (-90 + (i + 1) * 360 / n) * Math.PI / 180;
    secs.push(path(g, `M0 0L${r * Math.cos(a1)} ${r * Math.sin(a1)}A${r} ${r} 0 0 1 ${r * Math.cos(a2)} ${r * Math.sin(a2)}Z`,
      { fill: mix(COL.board, c, .7), stroke: COL.board, 'stroke-width': 3 }));
  });
  mk('circle', { r, fill: 'none', stroke: COL.chalk, 'stroke-width': 3 }, g);
  const ptr = G(g);
  path(ptr, `M0 ${r * .12}V${-r * .78}M-14 ${-r * .66}L0 ${-r * .8}L14 ${-r * .66}`, { stroke: COL.chalk, 'stroke-width': 7 });
  mk('circle', { r: 12, fill: COL.chalk }, g);
  show(g, t0);
  return { g, secs, ptr, land: k => (k + .5) * 360 / n };
}
// Outline some spinner sections: a bright border that fades in.
function outline(p, sp, ks, color, t0, run = tw) {
  return ks.map(k => { const e = sp.secs[k].cloneNode(); e.setAttribute('fill', 'none'); e.setAttribute('stroke', color); e.setAttribute('stroke-width', 7); sp.g.insertBefore(e, sp.ptr); put(e, { o: 0 }); run(e, { o: 1 }, t0, .4); return e; });
}
// A coin face.
function coin(p, side, x, y, t0, r = 34, run = tw) {
  const g = G(p, { x, y, s: .5, o: 0 });
  mk('circle', { r, fill: mix(COL.board, side === 'H' ? COL.int : COL.rat, .5), stroke: side === 'H' ? COL.int : COL.rat, 'stroke-width': 3 }, g);
  T(g, side, { y: r * .36, size: r, fill: COL.chalk, weight: 700, anchor: 'middle' });
  run(g, { s: 1, o: 1 }, t0, .45, back);
  return g;
}
/* ---------- scaled axes for data and real-world graphs (ch41 onward) ---------- */
// Axes with a scale on each; returns value -> pixel maps. ybreak draws a zigzag when y does not start at 0.
function axes(p, { x0, y0, w, h, xs: [xlo, xhi, xst], ys: [ylo, yhi, yst], xl, yl, t0, ybreak }) {
  const PX = v => x0 + (v - xlo) / (xhi - xlo) * w, PY = v => y0 - (v - ylo) / (yhi - ylo) * h, g = G(p, { o: 0 });
  let d = '';
  for (let v = xlo + xst; v <= xhi + 1e-9; v += xst) d += `M${PX(v)} ${y0}V${y0 - h}`;
  for (let v = ylo + yst; v <= yhi + 1e-9; v += yst) d += `M${x0} ${PY(v)}H${x0 + w}`;
  mk('path', { d, stroke: COL.chalk, 'stroke-opacity': .1, 'stroke-width': 1.5, fill: 'none' }, g);
  path(g, `M${x0} ${y0 - h - 20}V${y0}H${x0 + w + 20}`, { stroke: COL.chalk, 'stroke-width': 3 });
  if (ybreak) path(g, `M${x0 - 10} ${y0 - 22}L${x0 + 10} ${y0 - 30}M${x0 - 10} ${y0 - 34}L${x0 + 10} ${y0 - 42}`, { stroke: COL.chalk, 'stroke-width': 3 });
  for (let v = xlo; v <= xhi + 1e-9; v += xst) T(g, String(v), { x: PX(v), y: y0 + 30, size: 20, fill: COL.dim, font: MATH, anchor: 'middle' });
  for (let v = ylo; v <= yhi + 1e-9; v += yst) T(g, String(v), { x: x0 - 14, y: PY(v) + 7, size: 20, fill: COL.dim, font: MATH, anchor: 'end' });
  T(g, xl, { x: x0 + w / 2, y: y0 + 66, size: 24, fill: COL.dim, anchor: 'middle' });
  T(g, yl, { x: x0, y: y0 - h - 36, size: 24, fill: COL.dim, anchor: 'middle' });
  show(g, t0);
  return { PX, PY };
}
/* ---------- area grids for multiplying and factoring polynomials (ch51 onward) ---------- */
// Area grid from (x0, y0): column widths ws, row heights hs, factor terms along the top and the left side.
function areaGrid(p, x0, y0, ws, hs, colLab, rowLab, t0, { size = 40 } = {}) {
  const xs = [x0], ys = [y0];
  ws.forEach(w => xs.push(xs.at(-1) + w)); hs.forEach(h => ys.push(ys.at(-1) + h));
  let d = '';
  xs.forEach(x => { d += `M${x} ${y0}V${ys.at(-1)}`; }); ys.forEach(y => { d += `M${x0} ${y}H${xs.at(-1)}`; });
  draw(path(p, d, { stroke: COL.chalk, 'stroke-width': 3 }, { d: 0 }), t0, .9);
  colLab.forEach((l, j) => show(M(p, [].concat(l), { x: (xs[j] + xs[j + 1]) / 2, y: y0 - 22, size, fill: COL.whole, o: 0 }), t0 + .3 + j * .15));
  rowLab.forEach((l, i) => show(M(p, [].concat(l), { x: x0 - 24, y: (ys[i] + ys[i + 1]) / 2 + size * .35, size, fill: COL.nat, anchor: 'end', o: 0 }), t0 + .3 + i * .15));
  const box = (i, j, pad) => ({ x: xs[j] + pad, y: ys[i] + pad, width: xs[j + 1] - xs[j] - 2 * pad, height: ys[i + 1] - ys[i] - 2 * pad });
  return {
    xs, ys,
    cell(i, j, parts, t0, { fill = COL.chalk, tint, run = tw, into = p } = {}) {
      if (tint) { const r = put(mk('rect', { ...box(i, j, 3), fill: tint }, into), { o: 0 }); into.insertBefore(r, into.firstChild); run(r, { o: .3 }, t0, .4); }
      const e = M(into, [].concat(parts), { x: (xs[j] + xs[j + 1]) / 2, y: (ys[i] + ys[i + 1]) / 2 + size * .35, size, fill, o: 0, s: .6 });
      run(e, { o: 1, s: 1 }, t0, .4, back);
      return e;
    },
    ring(i, j, color, t0, run = tw, into = p) { const r = put(mk('rect', { ...box(i, j, 8), rx: 12, fill: 'none', stroke: color, 'stroke-width': 4.5 }, into), { o: 0 }); run(r, { o: 1 }, t0, .3); return r; },
  };
}
// A curved arrow from (x1, y1) to (x2, y2) bending up (h < 0) or down (h > 0).
function arc(p, x1, y1, x2, y2, h, color, t0, run = tw) {
  const mx = (x1 + x2) / 2, l = path(p, `M${x1} ${y1}Q${mx} ${y1 + h} ${x2} ${y2}`, { stroke: color, 'stroke-width': 3.5 }, { d: 0 });
  run(l, { d: 1 }, t0, .5);
  return l;
}

/* ---------- built-up fractions with math above and below the bar (ch60 onward) ---------- */
// Width of math parts at a size, without leaving anything on the stage.
function mathW(parts, size) { const e = M(scene, [].concat(parts), { size, o: 0 }), w = e._w; e.remove(); return w; }
// A built-up fraction whose top and bottom are math parts (they may hold radicals); bar on y. Returns { g, w, t, b, x0 }.
function frac(p, top, bot, x, y, t0, { size = 56, fill = COL.chalk, anchor = 'start', topFill, botFill } = {}) {
  const g = G(p, { o: 0 });
  const w = Math.max(mathW(top, size), mathW(bot, size)) + size * .3;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  const t = M(g, [].concat(top), { x: x0 + w / 2, y: y - size * .25, size, fill: topFill || fill });
  const b = M(g, [].concat(bot), { x: x0 + w / 2, y: y + size * 1.05, size, fill: botFill || fill });
  path(g, `M${x0} ${y}H${x0 + w}`, { stroke: fill, 'stroke-width': size * .05 });
  if (t0 !== undefined) show(g, t0);
  return { g, w, t, b, x0 };
}

/* ---------- coordinate plane (unit 6 onward) ---------- */
// Grid centred on the origin at (cx, cy); u pixels per unit; x from x0 to x1, y from y0 to y1.
// Returns { g, PX, PY, u, ... } with helpers to plot points, walk to a point, and draw lines.
// The grid stays in p; marks go into P.layer (set it to the current panel so marks clear with the step) or opts.into.
function plane(p, { cx = 800, cy = 450, u = 50, x0 = -6, x1 = 6, y0 = -6, y1 = 6, t0 = .1, labels = true, step = 1 } = {}) {
  const PX = x => cx + x * u, PY = y => cy - y * u, g = G(p, { o: 0 });
  let d = '';
  for (let x = x0; x <= x1; x++) if (x) d += `M${PX(x)} ${PY(y0)}V${PY(y1)}`;
  for (let y = y0; y <= y1; y++) if (y) d += `M${PX(x0)} ${PY(y)}H${PX(x1)}`;
  mk('path', { d, stroke: COL.chalk, 'stroke-opacity': .1, 'stroke-width': 1.5, fill: 'none' }, g);
  const ax = { stroke: COL.chalk, 'stroke-width': 3 };
  path(g, `M${PX(x0 - .5)} ${cy}H${PX(x1 + .5)}M${PX(x1 + .5) - 14} ${cy - 9}L${PX(x1 + .5)} ${cy}L${PX(x1 + .5) - 14} ${cy + 9}`, ax);
  path(g, `M${cx} ${PY(y0 - .5)}V${PY(y1 + .5)}M${cx - 9} ${PY(y1 + .5) + 14}L${cx} ${PY(y1 + .5)}L${cx + 9} ${PY(y1 + .5) + 14}`, ax);
  T(g, 'x', { x: PX(x1 + .5) + 10, y: cy + 30, size: 28, fill: COL.dim, font: MATH, anchor: 'middle' }).setAttribute('font-style', 'italic');
  T(g, 'y', { x: cx - 26, y: PY(y1 + .5) + 10, size: 28, fill: COL.dim, font: MATH, anchor: 'middle' }).setAttribute('font-style', 'italic');
  if (labels) {
    for (let x = x0; x <= x1; x += step) if (x) T(g, num(x), { x: PX(x), y: cy + 26, size: 18, fill: COL.dim, font: MATH, anchor: 'middle' });
    for (let y = y0; y <= y1; y += step) if (y) T(g, num(y), { x: cx - 12, y: PY(y) + 6, size: 18, fill: COL.dim, font: MATH, anchor: 'end' });
  }
  show(g, t0, .5);
  const P = {
    g, PX, PY, u, cx, cy, x0, x1, y0, y1, layer: null,
    dot(x, y, color, t0, { r = 10, label, run = tw, dx = 14, dy = -14, anchor = 'start', into = P.layer || p, open = false } = {}) {
      const d = G(into, { x: PX(x), y: PY(y), s: 0, o: 0 });
      mk('circle', open ? { r, fill: COL.board, stroke: color, 'stroke-width': 3.5 } : { r, fill: color, stroke: COL.board, 'stroke-width': 2 }, d);
      run(d, { s: 1, o: 1 }, t0, .4, back);
      if (label) { const l = M(into, [label], { x: PX(x) + dx, y: PY(y) + dy, size: 26, fill: color, anchor, o: 0 }); run(l, { o: 1 }, t0 + .2, .3); }
      return d;
    },
    // Walk from the origin: along x, then along y, drawing arrows; then a dot.
    walk(x, y, t0, { cx: colX = COL.whole, cy: colY = COL.nat, run = tw, color = COL.task, label, into = P.layer || p } = {}) {
      const a = path(into, `M${PX(0)} ${PY(0)}H${PX(x)}`, { stroke: colX, 'stroke-width': 5 }, { d: 0 });
      const b = path(into, `M${PX(x)} ${PY(0)}V${PY(y)}`, { stroke: colY, 'stroke-width': 5 }, { d: 0 });
      run(a, { d: 1 }, t0, .3 + Math.abs(x) * .12, lin);
      run(b, { d: 1 }, t0 + .4 + Math.abs(x) * .12, .3 + Math.abs(y) * .12, lin);
      return P.dot(x, y, color, t0 + .8 + (Math.abs(x) + Math.abs(y)) * .12, { run, label, into });
    },
    // Arrow from (xa, ya) to (xb, yb) with an optional label beside its middle.
    arrow(xa, ya, xb, yb, color, t0, { label, run = tw, into = P.layer || p } = {}) {
      const a = [PX(xa), PY(ya)], b = [PX(xb), PY(yb)], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      const l = path(into, `M${a[0]} ${a[1]}L${b[0]} ${b[1]}M${b[0] - 12 * ux - 8 * uy} ${b[1] - 12 * uy + 8 * ux}L${b[0]} ${b[1]}L${b[0] - 12 * ux + 8 * uy} ${b[1] - 12 * uy - 8 * ux}`, { stroke: color, 'stroke-width': 4 }, { d: 0 });
      run(l, { d: 1 }, t0, .5);
      if (label !== undefined) {
        const vert = Math.abs(uy) > Math.abs(ux);
        const t = M(into, [label], { x: (a[0] + b[0]) / 2 + (vert ? -24 : 0), y: (a[1] + b[1]) / 2 + (vert ? 9 : -12), size: 26, fill: color, anchor: vert ? 'end' : 'middle', o: 0 });
        run(t, { o: 1 }, t0 + .3, .3);
      }
      return l;
    },
    // One slope step from (x, y): rise first (irr green), then run (real violet).
    stair(x, y, rise, runX, t0, { run = tw, into = P.layer || p, labels = true } = {}) {
      P.arrow(x, y, x, y + rise, COL.irr, t0, { label: labels ? num(rise) : undefined, run, into });
      P.arrow(x, y + rise, x + runX, y + rise, COL.real, t0 + .6, { label: labels ? num(runX) : undefined, run, into });
    },
    // Shade the region where every a·x + b·y ≥ c in the list holds, clipped to the grid.
    region(list, color, t0, { run = tw, into = P.layer || p, o = .22 } = {}) {
      let pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      for (const [a, b, c] of list) {
        const f = ([x, y]) => a * x + b * y - c, next = [];
        pts.forEach((v, i) => {
          const w = pts[(i + 1) % pts.length], fv = f(v), fw = f(w);
          if (fv >= 0) next.push(v);
          if (fv * fw < 0) { const t = fv / (fv - fw); next.push([v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]); }
        });
        pts = next;
      }
      const e = path(into, pts.length ? 'M' + pts.map(([x, y]) => `${PX(x)} ${PY(y)}`).join('L') + 'Z' : '', { fill: color, stroke: 'none' }, { o: 0 });
      into.insertBefore(e, into.firstChild);
      run(e, { o }, t0, .6);
      return e;
    },
    half: (a, b, c, color, t0, opts) => P.region([[a, b, c]], color, t0, opts),
    // Graph of y = f(x) for x from xa to xb, drawn on; the part outside the grid's y range is cut off.
    fn(f, xa, xb, color, t0, { run = tw, w = 4, into = P.layer || p, n = 160, dur = 1.2 } = {}) {
      let d = '', pen = false;
      for (let i = 0; i <= n; i++) {
        const x = xa + (xb - xa) * i / n, y = f(x), inside = y >= y0 - .5 && y <= y1 + .5;
        if (inside) { d += `${pen ? 'L' : 'M'}${PX(x).toFixed(1)} ${PY(y).toFixed(1)}`; pen = true; } else pen = false;
      }
      const l = path(into, d, { stroke: color, 'stroke-width': w }, { d: 0 });
      run(l, { d: 1 }, t0, dur);
      return l;
    },
    // Line through two points, extended to the edge of the grid.
    line(xa, ya, xb, yb, color, t0, { run = tw, w = 4, dash, into = P.layer || p } = {}) {
      const dx = xb - xa, dy = yb - ya, ts = [];
      const clip = (t, v, lo, hi) => { if (v >= lo - 1e-9 && v <= hi + 1e-9) ts.push(t); };
      if (dx) { for (const X of [x0, x1]) { const t = (X - xa) / dx; clip(t, ya + t * dy, y0, y1); } }
      if (dy) { for (const Y of [y0, y1]) { const t = (Y - ya) / dy; clip(t, xa + t * dx, x0, x1); } }
      const t1 = Math.min(...ts), t2 = Math.max(...ts);
      // A dashed line fades in: drawing it on would need the dash array for the reveal.
      const l = path(into, `M${PX(xa + t1 * dx)} ${PY(ya + t1 * dy)}L${PX(xa + t2 * dx)} ${PY(ya + t2 * dy)}`, { stroke: color, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }, dash ? { o: 0 } : { d: 0 });
      run(l, dash ? { o: 1 } : { d: 1 }, t0, dash ? .6 : 1);
      return l;
    },
  };
  return P;
}
// Question: pick a grid point. ans = [x, y]; no(x, y) explains a wrong pick. Arrows move a cursor, Enter picks.
// test(x, y), when given, accepts any point it approves; ans is then the point Show answer uses.
const pickPoint = (P, ans, yes, no, onRight, test) => (body, api) => {
  const L = qlayer();
  let cur = [0, 0], locked = false;
  const cursor = G(L, { x: P.PX(0), y: P.PY(0) });
  mk('circle', { r: 16, fill: 'none', stroke: COL.task, 'stroke-width': 3 }, cursor);
  let tag = null;
  const moveTo = (x, y) => {
    cur = [Math.max(P.x0, Math.min(P.x1, x)), Math.max(P.y0, Math.min(P.y1, y))];
    put(cursor, { x: P.PX(cur[0]), y: P.PY(cur[1]) });
    tag?.remove();
    tag = M(L, [`(${num(cur[0])}, ${num(cur[1])})`], { x: P.PX(cur[0]) + 22, y: P.PY(cur[1]) - 18, size: 24, fill: COL.task, anchor: 'start' });
  };
  moveTo(0, 0);
  const pick = () => {
    if (locked) return;
    const [x, y] = cur;
    if (test ? test(x, y) : x === ans[0] && y === ans[1]) { P.dot(x, y, COL.good, 0, { run: fx, into: L }); onRight?.(); api.grade(true, typeof yes === 'function' ? yes(x, y) : yes); }
    else { const d = P.dot(x, y, COL.bad, 0, { run: fx, r: 8, into: L }); fx(d, { o: 0 }, 1.2, .4); shakeFx(cursor); api.grade(false, no(x, y)); }
  };
  const hit = mk('rect', { x: P.PX(P.x0 - .5), y: P.PY(P.y1 + .5), width: (P.x1 - P.x0 + 1) * P.u, height: (P.y1 - P.y0 + 1) * P.u, fill: 'transparent' }, L);
  L.insertBefore(hit, L.firstChild);
  hit.style.cursor = 'crosshair';
  hit.addEventListener('click', e => {
    if (locked) return;
    const s = $('stage'), pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(s.getScreenCTM().inverse());
    moveTo(Math.round((q.x - P.cx) / P.u), Math.round((P.cy - q.y) / P.u));
    pick();
  });
  return {
    reveal() { moveTo(...ans); P.dot(ans[0], ans[1], COL.good, 0, { run: fx, into: L }); onRight?.(); return typeof yes === 'function' ? yes(...ans) : yes; },
    lock() { locked = true; },
    hint: [kbd('←'), kbd('↑'), kbd('↓'), kbd('→'), translate('hintMove'), kbd('Enter'), translate('hintChooseOrClickGrid')],
    key(e) {
      if (locked) return false;
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (d) { moveTo(cur[0] + d[0], cur[1] + d[1]); return true; }
      if (e.key === 'Enter') { pick(); return true; }
      return false;
    },
  };
};
/* ---------- signed numbers: number-line moves and plus/minus tiles ---------- */
const POS = COL.whole, NEG = COL.nat;           // positive: blue, negative: coral
// Integer number line from lo to hi with arrows at both ends, drawn into S.line.
function numberLine(t0 = .1, lo = -8, hi = 8) {
  const L = S.line;
  draw(path(L, `M${X(lo - .7)} ${Y0}H${X(hi + .7)}`, { stroke: COL.chalk, 'stroke-width': 3 }, { d: 0 }), t0, .8);
  for (const [x, d] of [[X(hi + .7), 1], [X(lo - .7), -1]]) {
    show(path(L, `M${x - 15 * d} ${Y0 - 10}L${x} ${Y0}L${x - 15 * d} ${Y0 + 10}`, { stroke: COL.chalk, 'stroke-width': 3 }, { o: 0 }), t0 + .7, .3);
  }
  for (let v = lo; v <= hi; v++) show(tick(v), t0 + .2 + Math.abs(v) * .04, .4);
}
// A move along the number line from a to b, drawn as an arrow at height y. run = tw (lesson) or fx (answer).
function move(p, a, b, y, t0, run = tw) {
  const x1 = X(a), x2 = X(b), d = Math.sign(b - a), color = d > 0 ? POS : NEG;
  const dur = .35 + Math.abs(b - a) * .09;
  const line = path(p, `M${x1} ${y}H${x2}`, { stroke: color, 'stroke-width': 5 }, { d: 0 });
  const head = path(p, `M${x2 - 15 * d} ${y - 11}L${x2} ${y}L${x2 - 15 * d} ${y + 11}`, { stroke: color, 'stroke-width': 5 }, { o: 0 });
  const lab = T(p, (d > 0 ? '+' : '−') + Math.abs(b - a), { x: (x1 + x2) / 2, y: y - 16, size: 28, fill: color, font: MATH, anchor: 'middle', o: 0 });
  const drop = path(p, `M${x2} ${y + 12}V${Y0 - 14}`, { stroke: color, 'stroke-width': 2, 'stroke-dasharray': '5 6' }, { o: 0 });
  run(line, { d: 1 }, t0, dur, lin); run(head, { o: 1 }, t0 + dur - .1, .15);
  run(lab, { o: 1 }, t0 + .2, .3); run(drop, { o: .8 }, t0 + dur, .3);
}
function landDot(p, v, t0, color = COL.chalk, run = tw) {
  const g = G(p, { x: X(v), y: Y0, s: 0, o: 0 });
  mk('circle', { r: 12, fill: color, stroke: COL.board, 'stroke-width': 2 }, g);
  run(g, { s: 1, o: 1 }, t0, .45, back);
  return g;
}
function tile(p, sign, x, y, o = 0) {
  const c = sign > 0 ? POS : NEG, g = G(p, { x, y, o, s: o ? 1 : .6 });
  mk('rect', { x: -27, y: -27, width: 54, height: 54, rx: 10, fill: mix(COL.board, c, .45), stroke: c, 'stroke-width': 2.5 }, g);
  M(g, [sign > 0 ? '+' : '−'], { y: 13, size: 40 });
  return g;
}
const tiles = (p, n, sign, x0, y, gap = 70) => Array.from({ length: n }, (_, i) => tile(p, sign, x0 + i * gap, y));
const popAll = (els, t0, step = .08) => els.forEach((e, i) => tw(e, { o: 1, s: 1 }, t0 + i * step, .35, back));
// Circle each plus/minus pair, then let the pairs vanish: they make zero.
function cancelPairs(p, tops, bottoms, t0) {
  tops.forEach((a, i) => {
    const b = bottoms[i], x = st(a).x, y1 = st(a).y, y2 = st(b).y;
    const ring = put(mk('rect', { rx: 18, fill: 'none', stroke: COL.dim, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }, p),
      { o: 0, a_x: x - 38, a_y: y1 - 38, a_width: 76, a_height: y2 - y1 + 76 });
    tw(ring, { o: 1 }, t0 + i * .2, .3);
    for (const e of [a, b, ring]) tw(e, { o: 0, ...(e === ring ? {} : { s: .5 }) }, t0 + 1.4 + i * .1, .4);
  });
}
function brace(p, a, b, y, label, color, t0) {
  const x1 = X(a), x2 = X(b);
  draw(path(p, `M${x1} ${y - 10}V${y}H${x2}V${y - 10}`, { stroke: color, 'stroke-width': 3 }, { d: 0 }), t0, .6);
  show(T(p, label, { x: (x1 + x2) / 2, y: y + 34, size: 26, fill: color, anchor: 'middle', o: 0 }), t0 + .4);
}

/* ---------- number map geometry ---------- */
const RINGS = {
  real: { cx: 640, cy: 470, rx: 610, ry: 390, lx: 640, ly: 128 },
  rat: { cx: 500, cy: 480, rx: 400, ry: 320, lx: 500, ly: 202 },
  int: { cx: 500, cy: 510, rx: 300, ry: 250, lx: 500, ly: 302 },
  whole: { cx: 500, cy: 540, rx: 210, ry: 180, lx: 500, ly: 400 },
  nat: { cx: 500, cy: 570, rx: 125, ry: 110, lx: 500, ly: 500 },
  irr: { cx: 1060, cy: 480, rx: 140, ry: 170, lx: 1060, ly: 360 },
};
const CHAIN = { nat: ['nat', 'whole', 'int', 'rat', 'real'], whole: ['whole', 'int', 'rat', 'real'], int: ['int', 'rat', 'real'], rat: ['rat', 'real'], irr: ['irr', 'real'], real: ['real'] };
const ell = r => `M${r.cx} ${r.cy - r.ry}A${r.rx} ${r.ry} 0 1 1 ${r.cx} ${r.cy + r.ry}A${r.rx} ${r.ry} 0 1 1 ${r.cx} ${r.cy - r.ry}`;
const inRing = (k, x, y) => { const r = RINGS[k]; return ((x - r.cx) / r.rx) ** 2 + ((y - r.cy) / r.ry) ** 2 <= 1; };
function regionAt(x, y) {
  for (const k of ['nat', 'whole', 'int', 'rat', 'irr', 'real']) if (inRing(k, x, y)) return k;
  return null;
}
function buildVenn(parent, hidden) {
  const out = {};
  for (const k of ['real', 'rat', 'int', 'whole', 'nat', 'irr']) {
    const r = RINGS[k], g = G(parent);
    const fill = path(g, ell(r), { fill: mix(COL.board, COL[k], k === 'real' ? .1 : .16), stroke: 'none' }, { o: hidden ? 0 : 1 });
    const stroke = path(g, ell(r), { stroke: COL[k], 'stroke-width': 3 }, hidden ? { d: 0, 'a_stroke-width': 3 } : { 'a_stroke-width': 3 });
    const lab = T(g, NAME[k], { x: r.lx, y: r.ly, size: 26, fill: COL[k], weight: 600, anchor: 'middle', o: hidden ? 0 : 1 });
    out[k] = { g, fill, stroke, lab };
  }
  return out;
}
function glow(key, t0) {
  const s = S.ring[key].stroke;
  tw(s, { 'a_stroke-width': 9 }, t0, .22, out); tw(s, { 'a_stroke-width': 3 }, t0 + .25, .5);
}
function glowRun(key, t0) { CHAIN[key].forEach((k, i) => glow(k, t0 + i * .3)); }
const glowFx = (key, delay = 0) => CHAIN[key].forEach((k, i) => {
  const s = S.ring[k].stroke;
  fx(s, { 'a_stroke-width': 9 }, delay + i * .28, .22, out); fx(s, { 'a_stroke-width': 3 }, delay + i * .28 + .25, .5);
});
function popDotFx(key, v, label) {
  const L = S.q || qlayer();
  const g = G(L, { x: X(v), y: Y0, s: 0, o: 0 });
  mk('circle', { r: 7, fill: COL[key], stroke: COL.board, 'stroke-width': 2 }, g);
  fx(g, { s: 1, o: 1 }, 0, .45, back);
  if (label) fx(M(L, label, { x: X(v) + 10, y: Y0 + 56, size: 28, fill: COL[key], o: 0 }), { o: 1 }, .3, .4);
}
function hopsFx(n) {
  for (let k = 1; k <= -n; k++) {
    const a = X(1 - k), b = X(-k);
    fx(path(S.q, `M${a} ${Y0 - 12}Q${(a + b) / 2} ${Y0 - 84} ${b} ${Y0 - 12}`, { stroke: COL.int, 'stroke-width': 3 }, { d: 0 }), { d: 1 }, (k - 1) * .35, .35, lin);
  }
  floatText(translate('stepsLeftOfZero', { n: -n }), X(n / 2), Y0 - 100, COL.int);
}
const FAMILIES = ['nat', 'whole', 'int', 'rat', 'irr', 'real'];
const FAM_COLS = FAMILIES.map(k => [k, k === 'int' ? translate('integerColumn') : NAME[k], COL[k]]);
const RING_KEYS = ['nat', 'whole', 'int', 'rat', 'irr', 'real'];   // number keys 1–6 in sorting questions
// Drag number chips into the stage number map. items: [parts, smallest ring, explanation].
const slot = (k, n) => {
  if (k === 'real') return [[940, 210], [1000, 760], [820, 800]][n % 3];   // inside Real, outside every other ring
  const r = RINGS[k];
  return [r.lx + [-72, 72, 0][n % 3], r.ly + 50 + 56 * Math.floor(n / 2)];
};
const plain = parts => parts.map(p => typeof p === 'string' ? p : p.ov !== undefined ? p.ov + ' repeating' : p.tex !== undefined ? p.tex : p.f ? p.f.join('/') : p.sup !== undefined ? '^' + p.sup : (p.i ? p.i : '') + '√' + (p.r.f ? p.r.f.join('/') : p.r)).join('');
const sorter = (items, trayXY) => (body, api) => {
  const L = qlayer();
  const bg = mk('rect', { width: 1600, height: 900, fill: 'transparent' }, L);
  const svg = $('stage');
  const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let sel = null, drag = null, locked = false;
  const label = c => c.setAttribute('aria-label', c.region ? translate('chipPlaced', { x: c.say, ring: NAME[c.region] }) : translate('chipNotPlaced', { x: c.say }));
  const outline = (c, colr, w = 2.5) => { c._rect.setAttribute('stroke', colr); c._rect.setAttribute('stroke-width', w); };
  const choose = c => {
    if (sel) outline(sel, COL.chalk);
    sel = c;
    if (sel) { outline(sel, COL.task, 4); L.append(sel); }
  };
  const select = c => choose(sel === c ? null : c);
  // Number badges next to the ring names, for keys 1–6.
  RING_KEYS.forEach((k, i) => {
    const r = RINGS[k], g = G(L, { x: r.lx - uiW(NAME[k], 26) / 2 - 24, y: r.ly - 9 });
    g.style.pointerEvents = 'none';
    mk('circle', { r: 14, fill: COL.board, stroke: COL[k], 'stroke-width': 1.5 }, g);
    T(g, String(i + 1), { y: 6.5, size: 18, fill: COL[k], anchor: 'middle', weight: 600 });
  });
  const place = (c, x, y) => {
    c.region = regionAt(x, y);
    if (!c.region) [x, y] = c.home;
    put(c, { x, y });
    outline(c, COL.chalk);
    c.querySelector('.mark')?.remove();
    if (sel === c) sel = null;
    label(c);
  };
  const chips = items.map(([parts, answer, why], i) => {
    const [x, y] = trayXY(i);
    const c = chip(L, parts, COL.chalk, { x, y, size: 32 });
    Object.assign(c, { answer, why, home: [x, y], region: null, say: plain(parts) });
    c.classList.add('tok');
    c.setAttribute('tabindex', 0);
    c.setAttribute('role', 'button');
    label(c);
    c.addEventListener('pointerdown', e => {
      if (locked) return;
      e.preventDefault();
      const p = pt(e);
      drag = { dx: p.x - st(c).x, dy: p.y - st(c).y, sx: p.x, sy: p.y, moved: false };
      L.append(c);  // re-parent before capturing: moving a node drops its capture
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = pt(e);
      if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) drag.moved = true;
      if (drag.moved) put(c, { x: p.x - drag.dx, y: p.y - drag.dy });
    });
    c.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (moved) place(c, st(c).x, st(c).y); else select(c);
    });
    // A cancelled drag (a system gesture, a lost capture) drops the chip where it is instead of leaving it stuck to no pointer.
    c.addEventListener('lostpointercapture', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (moved) place(c, st(c).x, st(c).y);
    });
    keyAct(c, () => { if (!locked) select(c); });
    return c;
  });
  bg.addEventListener('pointerup', e => { if (sel && !locked) { const p = pt(e); place(sel, p.x, p.y); } });
  return {
    check() {
      let right = 0;
      const notes = h('ul');
      for (const c of chips) {
        c.querySelector('.mark')?.remove();
        if (!c.region) { notes.append(h('li', '', translate('notPlacedYet', { x: c.say }))); continue; }
        const ok = c.region === c.answer;
        right += ok;
        outline(c, ok ? COL.good : COL.bad, 4);
        if (ok) { pulseFx(c, 1.25); glowFx(c.answer, right * .15); } else shakeFx(c);
        const w = +c._rect.getAttribute('width');
        T(c, ok ? '✓' : '✗', { x: w / 2 + 4, y: -16, size: 26, fill: ok ? COL.good : COL.bad, weight: 700 }).classList.add('mark');
        if (!ok) notes.append(h('li', '', c.region === 'real'
          ? translate('realRingIsEmpty', { x: c.say })
          : c.why));
      }
      const all = right === chips.length;
      api.grade(all, all ? [] : [translate('ringsRight', { r: right, n: chips.length }), notes], { right, total: chips.length });
    },
    reveal() {
      const count = {};
      chips.forEach((c, i) => {
        const n = count[c.answer] = (count[c.answer] ?? -1) + 1;
        const [x, y] = slot(c.answer, n);
        c.region = c.answer;
        c.querySelector('.mark')?.remove();
        outline(c, COL.good, 4);
        fx(c, { x, y }, i * .12, .8);
      });
      return translate('ringsShown');
    },
    lock() { locked = true; choose(null); },
    hint: [kbd('←'), kbd('→'), translate('hintPickNumber'), kbd('1'), '–', kbd('6'), translate('hintPickRing')],
    key(e) {
      if (locked) return false;
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (d) {
        const i = sel ? chips.indexOf(sel) : d > 0 ? -1 : 0;
        choose(chips[(i + d + chips.length) % chips.length]);
        return true;
      }
      const ring = RING_KEYS[+e.key - 1];
      if (!ring || !sel) return false;
      const c = sel;
      place(c, ...slot(ring, chips.filter(x => x.region === ring && x !== c).length));
      choose(chips.find(x => !x.region) || null);
      return true;
    },
  };
};
