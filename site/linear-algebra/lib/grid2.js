// A 2 × 2 matrix A carrying the whole plane, drawn from one state: the matrix in brackets (and, when given, a vector x
// and the product Ax beside it) and the plane, where every grid line, the unit square, a small shape and some points are
// moved by A while the original grid stays faint behind. The columns of A are the green and violet arrows: their tips are
// where [1, 0] and [0, 1] land. Drag a tip and the grid and the numbers follow; scrub a number and the grid follows.
// The beat moves it with g.to(); a question turns the reader's hands on with g.live(true). Same shape as linsys.js.
// Loads after engine.js and math.js (it uses plane()).
const G2_COLS = [COL.irr, COL.real], G2_AX = COL.task;
// A small flag: a pole and a pennant pointing right, so a flip or a turn shows at once.
const G2_FLAG = [[.3, .25], [.45, .25], [.45, 1.05], [1.2, 1.3], [.45, 1.55], [.45, 1.75], [.3, 1.75]];

function grid2(p, { A = [[1, 0], [0, 1]], x = null, mat = [90, 300], size = 54, plane: po = {}, grid = true, square = true, shape = false,
  units = true, pts = [], t0 = .1, hidePlane = false, result = true, showMat = true } = {}) {
  const v = { a00: A[0][0], a01: A[0][1], a10: A[1][0], a11: A[1][1], x0: x ? x[0] : 0, x1: x ? x[1] : 0 };
  const RANGE = { a00: 9, a01: 9, a10: 9, a11: 9, x0: 9, x1: 9 }, K = 14;   // grid lines k = −K … K
  const holder = G(p, { o: hidePlane ? 0 : 1 });
  const P2 = plane(holder, { cx: 1160, cy: 450, u: 52, x0: -6, x1: 6, y0: -6, y1: 6, t0, ...po });
  const { PX, PY } = P2, box = [P2.x0 - .4, P2.x1 + .4, P2.y0 - .4, P2.y1 + .4];
  const svg = $('stage'), listeners = [], slots = [], drags = [];
  let live = false, plan = { ...v };
  const fmt = n => { const r = Math.round(n * 10) / 10; return (r < 0 ? '−' : '') + (Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1)); };
  const setText = (e, s) => { if (e.textContent !== s) e.textContent = s; };
  const setD = (e, d) => { if (e.getAttribute('d') !== d) e.setAttribute('d', d); };
  const clamp = (k, n) => Math.max(-RANGE[k], Math.min(RANGE[k], n));
  const pt = e => { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const w = q.matrixTransform(P2.g.getScreenCTM().inverse()); return [(w.x - P2.cx) / P2.u, (P2.cy - w.y) / P2.u]; };
  const map = ([a, b]) => [v.a00 * a + v.a01 * b, v.a10 * a + v.a11 * b];
  const XY = ([a, b]) => `${PX(a).toFixed(1)} ${PY(b).toFixed(1)}`;

  /* ---------- numbers you can scrub ---------- */
  function slot(g, key, x, y, fill) {
    const bx = mk('rect', { x: x - 44, y: y - size * .85, width: 88, height: size * 1.1, rx: 10, fill: 'transparent' }, g);
    const t = T(g, '', { x, y, size, fill, font: MATH, anchor: 'middle' });
    t.style.pointerEvents = 'none';
    bx.setAttribute('aria-label', key);
    const s = { key, t, box: bx, set: () => setText(t, fmt(v[key])) };
    let drag = null;
    bx.addEventListener('pointerdown', e => { if (!live || !s.on) return; e.preventDefault(); drag = { x: e.clientX, from: Math.round(v[key]) }; bx.setPointerCapture(e.pointerId); });
    bx.addEventListener('pointermove', e => { if (!drag) return; const k = svg.getScreenCTM().a; edit({ [key]: clamp(key, drag.from + Math.round((e.clientX - drag.x) / k / 22)) }); });
    const end = () => { drag = null; };
    bx.addEventListener('pointerup', end); bx.addEventListener('lostpointercapture', end);
    bx.addEventListener('keydown', e => {
      if (!live || !s.on) return;
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); bx.blur(); P.keys?.(e); return; }
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      edit({ [key]: clamp(key, Math.round(v[key]) + d) });
    });
    slots.push(s);
    return s;
  }

  /* ---------- the matrix (and x, Ax) in brackets ---------- */
  const Mx = G(p, { o: 0 }), cw = size * 1.7, rh = size * 1.35;
  const bracket = (x0, w, color = COL.chalk) => {
    const top = mat[1] - size * .95, bot = mat[1] + rh + size * .35;
    path(Mx, `M${x0 + 14} ${top}H${x0}V${bot}H${x0 + 14}M${x0 + w - 14} ${top}H${x0 + w}V${bot}H${x0 + w - 14}`, { stroke: color, 'stroke-width': 3, fill: 'none' });
  };
  const [mx, my] = mat || [0, 0], lay = {};
  if (mat) {
    bracket(mx, cw * 2 + 20);
    lay.A = [[0, 1].map(j => mx + 10 + cw * (j + .5)), [my, my + rh]];
    [0, 1].forEach(i => [0, 1].forEach(j => slot(Mx, `a${i}${j}`, lay.A[0][j], my + rh * i, G2_COLS[j])));
    T(Mx, 'A', { x: mx + cw + 10, y: my + rh + size * 1.25, size: 34, fill: COL.dim, font: MATH, anchor: 'middle', weight: 700 });
    if (x) {
      const xa = mx + cw * 2 + 44, wx = cw * .95;
      bracket(xa, wx);
      [0, 1].forEach(i => slot(Mx, `x${i}`, xa + wx / 2, my + rh * i, COL.chalk));
      T(Mx, 'x', { x: xa + wx / 2, y: my + rh + size * 1.25, size: 34, fill: COL.dim, font: MATH, anchor: 'middle' }).setAttribute('font-style', 'italic');
      lay.x = xa + wx / 2;
      if (result) {
        T(Mx, '=', { x: xa + wx + 40, y: my + rh / 2 + size * .3, size, fill: COL.chalk, font: MATH, anchor: 'middle' });
        const xr = xa + wx + 80, wr = cw * 1.25;
        bracket(xr, wr);
        lay.r = xr + wr / 2;
        lay.res = [0, 1].map(i => T(Mx, '', { x: xr + wr / 2, y: my + rh * i, size, fill: G2_AX, font: MATH, anchor: 'middle' }));
        const lab = T(Mx, 'Ax', { x: xr + wr / 2, y: my + rh + size * 1.25, size: 34, fill: COL.dim, font: MATH, anchor: 'middle' });
        lab.setAttribute('font-style', 'italic');
      }
    }
  }

  /* ---------- the plane: the moved grid, square, shape, points; the columns; x and Ax ---------- */
  const layer = (o = 1) => G(P2.g, { o });
  const gridG = layer(grid ? 1 : 0), sqG = layer(square ? 1 : 0), shG = layer(shape ? 1 : 0), unG = layer(units ? 1 : 0);
  const ptG = layer(), colG = layer(), xG = layer(x ? 1 : 0);
  const gl = path(gridG, '', { stroke: COL.chalk, 'stroke-opacity': .32, 'stroke-width': 1.6, fill: 'none' });
  const axs = G2_COLS.map(c => path(gridG, '', { stroke: c, 'stroke-opacity': .75, 'stroke-width': 3, fill: 'none' }));
  const sq = path(sqG, '', { fill: COL.chalk, 'fill-opacity': .12, stroke: COL.chalk, 'stroke-opacity': .7, 'stroke-width': 2.5 });
  const sh = path(shG, '', { fill: COL.chalk, 'fill-opacity': .45, stroke: COL.chalk, 'stroke-width': 2, 'stroke-linejoin': 'round' });
  path(unG, `M${PX(0)} ${PY(0)}H${PX(1)}M${PX(0)} ${PY(0)}V${PY(1)}`, { stroke: COL.chalk, 'stroke-opacity': .45, 'stroke-width': 3, 'stroke-dasharray': '5 6' });
  [[.5, 0, '[1, 0]', 0, -12, 'middle'], [0, .5, '[0, 1]', -10, 7, 'end']].forEach(([a, b, s, dx, dy, anchor]) => T(unG, s, { x: PX(a) + dx, y: PY(b) + dy, size: 20, fill: COL.dim, font: MATH, anchor }));   // beside the dashed arrows, clear of the axis numbers
  const arrowD = (a, c, hl0 = 18) => {
    const A1 = [PX(a[0]), PY(a[1])], C = [PX(c[0]), PY(c[1])], L = Math.hypot(C[0] - A1[0], C[1] - A1[1]);
    if (L < 1) return '';
    const ux = (C[0] - A1[0]) / L, uy = (C[1] - A1[1]) / L, hl = Math.min(hl0, L * .45);
    return `M${A1[0]} ${A1[1]}L${C[0] - ux * hl * .6} ${C[1] - uy * hl * .6}M${C[0] - hl * ux - 9 * uy} ${C[1] - hl * uy + 9 * ux}L${C[0]} ${C[1]}L${C[0] - hl * ux + 9 * uy} ${C[1] - hl * uy - 9 * ux}Z`;
  };
  const arrow = (g, color, w = 5, dash) => path(g, '', { stroke: color, fill: color, 'stroke-width': w, 'stroke-linejoin': 'round', ...(dash ? { 'stroke-dasharray': dash, 'fill-opacity': .5 } : {}) });
  const ptDots = pts.map(q => {
    const g = G(ptG, {});
    mk('circle', { r: 8, fill: COL.chalk, stroke: COL.board, 'stroke-width': 2 }, g);
    const lab = q.label ? T(g, q.label, { x: 12, y: -12, size: 22, fill: COL.chalk, font: MATH }) : null;
    return { g, q, lab };
  });
  const combo = [arrow(xG, G2_COLS[0], 4, '10 8'), arrow(xG, G2_COLS[1], 4, '10 8')];   // x·col 1, then y·col 2 from its tip
  const axArrow = arrow(xG, G2_AX, 6);
  const xRing = G(xG, {});
  mk('circle', { r: 22, fill: 'transparent' }, xRing);
  mk('circle', { r: 9, fill: COL.board, stroke: COL.chalk, 'stroke-width': 3 }, xRing);
  const xLab = T(xG, '', { size: 24, fill: COL.chalk, font: MATH, anchor: 'end' });
  const axDot = G(xG, {});
  mk('circle', { r: 10, fill: G2_AX, stroke: COL.board, 'stroke-width': 3 }, axDot);
  const axLab = T(xG, '', { size: 26, fill: G2_AX, font: MATH, weight: 600 });
  [...combo, axArrow, axDot, axLab, xLab].forEach(e => { e.style.pointerEvents = 'none'; });   // only the ring under x takes the pointer
  const cols = G2_COLS.map(c => arrow(colG, c));
  const tips = G2_COLS.map(c => {
    const g = G(colG, {});
    mk('circle', { r: 24, fill: 'transparent' }, g);
    const ring = mk('circle', { r: 14, fill: 'none', stroke: c, 'stroke-width': 3, 'stroke-dasharray': '4 4' }, g);
    ring.style.opacity = 0;
    g._ring = ring;
    return g;
  });
  const tipLabels = [0, 1].map(() => G(colG, {}));

  // Drag in the plane: a column tip or x follows the pointer (to a tenth), and lands on the nearest whole numbers when let go.
  const dragIn = (el, keys, what) => {
    let on = false;
    const to = ([X, Y], snap) => { const r = n => snap ? Math.round(n) : Math.round(n * 10) / 10; edit({ [keys[0]]: clamp(keys[0], r(X)), [keys[1]]: clamp(keys[1], r(Y)) }); };
    el.addEventListener('pointerdown', e => { if (!live || !drags.includes(what)) return; e.preventDefault(); on = true; el.setPointerCapture(e.pointerId); to(pt(e), false); });
    el.addEventListener('pointermove', e => { if (on) to(pt(e), false); });
    const end = () => { if (!on) return; on = false; to([v[keys[0]], v[keys[1]]], true); };
    el.addEventListener('pointerup', end); el.addEventListener('lostpointercapture', end);
  };
  dragIn(tips[0], ['a00', 'a10'], 'cols'); dragIn(tips[1], ['a01', 'a11'], 'cols'); dragIn(xRing, ['x0', 'x1'], 'x');

  /* ---------- one state, drawn everywhere ---------- */
  // The part of the line P + s·d, s in [s0, s1], inside the box, as a path piece (Liang–Barsky).
  const seg = (P0, d, s0, s1) => {
    let a = s0, b = s1;
    for (const [p0, dd, lo, hi] of [[P0[0], d[0], box[0], box[1]], [P0[1], d[1], box[2], box[3]]]) {
      if (Math.abs(dd) < 1e-9) { if (p0 < lo || p0 > hi) return ''; continue; }
      let t1 = (lo - p0) / dd, t2 = (hi - p0) / dd;
      if (t1 > t2) [t1, t2] = [t2, t1];
      a = Math.max(a, t1); b = Math.min(b, t2);
      if (a > b) return '';
    }
    return `M${XY([P0[0] + a * d[0], P0[1] + a * d[1]])}L${XY([P0[0] + b * d[0], P0[1] + b * d[1]])}`;
  };
  // A polygon cut to the box (Sutherland–Hodgman), so a big stretch never draws past the plane.
  const poly = pts => {
    for (const [k, lim, keep] of [[0, box[0], 1], [0, box[1], -1], [1, box[2], 1], [1, box[3], -1]]) {
      const out = [];
      pts.forEach((a, i) => {
        const b = pts[(i + 1) % pts.length], fa = (a[k] - lim) * keep, fb = (b[k] - lim) * keep;
        if (fa >= 0) out.push(a);
        if (fa * fb < 0) { const t = fa / (fa - fb); out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); }
      });
      pts = out;
      if (!pts.length) return '';
    }
    return 'M' + pts.map(XY).join('L') + 'Z';
  };
  function draw() {
    slots.forEach(s => s.set());
    const c0 = [v.a00, v.a10], c1 = [v.a01, v.a11], ax = map([v.x0, v.x1]);
    if (lay.res) lay.res.forEach((t, i) => setText(t, fmt(ax[i])));
    if (grid) {
      let d = '';
      for (let k = -K; k <= K; k++) {
        if (!k) continue;
        d += seg([k * c0[0], k * c0[1]], c1, -K, K);   // the image of the line x = k
        d += seg([k * c1[0], k * c1[1]], c0, -K, K);   // the image of the line y = k
      }
      setD(gl, d);
      setD(axs[0], seg([0, 0], c0, -K, K));   // the x-axis lands along column 1
      setD(axs[1], seg([0, 0], c1, -K, K));   // the y-axis along column 2
    }
    if (square) setD(sq, poly([[0, 0], c0, [c0[0] + c1[0], c0[1] + c1[1]], c1]));
    if (shape) setD(sh, poly(G2_FLAG.map(map)));
    ptDots.forEach(({ g, lab }, i) => {
      const [a, b] = map(ptDots[i].q.p);
      put(g, { x: PX(a), y: PY(b) });
    });
    [c0, c1].forEach((c, j) => {
      setD(cols[j], arrowD([0, 0], c));
      put(tips[j], { x: PX(c[0]), y: PY(c[1]) });
      const n = Math.hypot(...c) || 1;
      put(tipLabels[j], { x: PX(c[0]) + c[0] / n * 30, y: PY(c[1]) - c[1] / n * 30 + 10 });
    });
    if (x) {
      const m1 = [v.x0 * c0[0], v.x0 * c0[1]];
      setD(combo[0], arrowD([0, 0], m1, 14));
      setD(combo[1], arrowD(m1, ax, 14));
      setD(axArrow, arrowD([0, 0], ax));
      put(xRing, { x: PX(v.x0), y: PY(v.x1) });
      put(xLab, { x: PX(v.x0) - 14, y: PY(v.x1) + 30 });
      setText(xLab, `x = (${fmt(v.x0)}, ${fmt(v.x1)})`);
      put(axDot, { x: PX(ax[0]), y: PY(ax[1]) });
      const n = Math.hypot(...ax) || 1;
      let lx = PX(ax[0]) + ax[0] / n * 26 + (ax[0] < 0 ? -150 : 8);
      if (lx + 170 > 1590) lx = PX(ax[0]) - 180;   // near the right edge: put the label on the left
      put(axLab, { x: lx, y: PY(ax[1]) - ax[1] / n * 26 + (ax[1] < 0 ? 24 : -8) });
      setText(axLab, `Ax = (${fmt(ax[0])}, ${fmt(ax[1])})`);
    }
    listeners.forEach(f => f(v));
  }
  function edit(to) {
    let changed = false;
    for (const k in to) if (v[k] !== to[k]) { v[k] = to[k]; changed = true; }
    if (changed) draw();
  }
  draw();
  if (mat && showMat) show(Mx, t0 + .3);   // showMat: false keeps the matrix hidden (a question that asks for it)

  const api = {
    v, P: P2, stage: holder, M: Mx, lay, cols, tips, combo, axArrow, axDot, xRing, xLab, axLab,
    parts: { grid: gridG, square: sqG, shape: shG, units: unG, pts: ptG, cols: colG, x: xG },
    // Move the numbers to new values over dur seconds, on the beat clock (deterministic, so seeking replays it).
    to(next, at, dur = 1.2, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      const goal = { ...plan };
      prog(q => edit(Object.fromEntries(Object.keys(goal).map(k => [k, from[k] + (goal[k] - from[k]) * q]))), at, dur, ease);
    },
    // Turn the plane from deg0 to deg1 degrees (counterclockwise) on the beat clock: a true turn, where a straight blend
    // of the numbers would shrink the plane halfway. Later g.to() calls start from where the turn ends.
    turn(deg0, deg1, at, dur = 1.6, ease = io) {
      const rot = d => { const a = d * Math.PI / 180, k = n => Math.round(n * 1e6) / 1e6; return { a00: k(Math.cos(a)), a01: k(-Math.sin(a)), a10: k(Math.sin(a)), a11: k(Math.cos(a)) }; };
      plan = { ...plan, ...rot(deg1) };
      prog(q => edit(rot(deg0 + (deg1 - deg0) * q)), at, dur, ease);
    },
    // Hands on. what: which parts take the reader's hands: 'A' the matrix numbers, 'cols' the column tips, 'x' the point x and its numbers.
    live(on, what = ['A', 'cols', 'x']) {
      live = on;
      drags.splice(0, drags.length, ...(on ? what : []));
      for (const s of slots) {
        s.on = on && what.includes(s.key[0] === 'a' ? 'A' : 'x');
        s.box.style.cursor = s.on ? 'ew-resize' : '';
        s.box.setAttribute('stroke', s.on ? COL.faint : 'none');
        s.box.setAttribute('stroke-dasharray', '4 6');
        if (s.on) s.box.setAttribute('tabindex', 0); else s.box.removeAttribute('tabindex');
      }
      const cOn = on && what.includes('cols'), xOn = on && what.includes('x');
      tips.forEach(g => { g.style.cursor = cOn ? 'grab' : ''; g._ring.style.opacity = cOn ? 1 : 0; g.style.pointerEvents = cOn ? '' : 'none'; });
      xRing.style.cursor = xOn ? 'grab' : ''; xRing.style.pointerEvents = xOn ? '' : 'none';   // a handle not in play never hides one that is
    },
    set: edit,   // at once, for a reader's action or an answer shown
    num: key => slots.filter(s => s.key === key).map(s => s.t),   // the text that shows this value (to flash it)
    res: i => lay.res?.[i],
    onChange(f) { listeners.push(f); },
    col: j => j ? [v.a01, v.a11] : [v.a00, v.a10],
    Ax: () => map([v.x0, v.x1]),
    map,
    labels(names) { names.forEach((n, i) => { tipLabels[i].replaceChildren(); M(tipLabels[i], [n], { size: 28, fill: G2_COLS[i] }); }); },
  };
  return api;
}

// A question that is a task on the moved plane: the reader changes it until test(v) holds, then checks.
// what: the parts the reader may move (see g.live).
const g2Task = (g, test, why, hint, reveal, what) => (body, api) => {
  g.live(true, what);
  const parts = what || ['A', 'cols', 'x'];
  return {
    check: () => { const ok = test(g.v); api.grade(ok, ok ? why : hint); },
    reveal: () => { reveal?.(); return why; },
    lock: () => g.live(false),
    hint: parts.includes('A') || parts.includes('x') ? [kbd('Tab'), 'pick a number', kbd('↑'), kbd('↓'), 'change it, or drag in the picture'] : ['drag in the picture'],
  };
};
