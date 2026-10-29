// How much work is elimination (chapter 33): an n × n matrix counted cell by cell, drawn three ways from one state.
// One operation = one number of a row below the pivot changing: "new = old − ℓ × the number above it" is a multiply and a
// subtract; the first number of the row becomes 0, and its operation is the division that finds ℓ. Stage s (pivot in
// row s, column s, counting from 1) has n − s rows below the pivot and n − s + 1 numbers in each: (k − 1) · k operations
// for the k × k corner still to do, and the total for A is n(n − 1) + … + 2·1 = (n³ − n)/3, about n³/3.
//
//   const ce = cost(p, { n: 3, A, grid: { x, y, w, work: [x, y] }, chart: { x, y, w, h, N }, pyr: { x, y, size }, read: { x, y } })
//   ce.v → { n, c }       c = operations counted so far (0 … coTotal(n)); set({ n }) alone counts everything
//   ce.to({ c: 8 }, at, dur)     on the beat clock: cells light one by one, the counter, the chart's bar and the pyramid follow
//   ce.count(s, at, dur)         just stage s (its cells from coStart(n, s) to coStart(n, s + 1))
//   ce.to({ n: 10 }, at, dur)    n steps through the sizes (each fully counted): the chart's bars grow one by one
//   ce.live(on)                  the reader scrubs n (drag the n number sideways, or Tab to it and ↑/↓); playAsk works
//   costTask(ce, test(v), why, hint, reveal) is the question type
//
// grid: the matrix seen flat, cells (A's numbers for its own n when A is given, with the working of the last operation
//   at work); the current stage's corner outlined, its counted cells lit, its pivot boxed, the zeros left empty.
// chart: bars of (m³ − m)/3 for m = 2 … n (the bar for n grows while counting) under the dashed curve m³/3; N is the
//   least width of the n axis (it widens past N as n grows, and the scale with it).
// pyr: the stages stacked as layers on the matrix (stage s = layer s, its top face = its cells): a stepped pyramid in the
//   dashed n × n × n box; ce.parts.cone is the smooth pyramid (a third of the box) to show on a word.
// read: "n = 4", "operations: 20", "n³/3 ≈ 21.3" (parts.read.n / .ops / .third / .ratio, each a group to show).
// Loads after engine.js.
const coTotal = n => (n * n * n - n) / 3;
const coStage = (n, s) => (n - s) * (n - s + 1);
const coStart = (n, s) => { let t = 0; for (let k = 1; k < s; k++) t += coStage(n, k); return t; };
const coFmt = v => (v < 0 ? '−' : '') + Math.round(Math.abs(v)).toLocaleString('en-US');
const coThird = n => { const v = n * n * n / 3; return Math.abs(v - Math.round(v)) < 1e-9 ? coFmt(v) : (v >= 1000 ? coFmt(v) : (Math.round(v * 10) / 10).toFixed(1)); };
// the cell counted as operation k (from 0): stage s, row r, column j (rows and columns from 0)
const coCell = (n, k) => { let s = 1; while (s < n - 1 && k >= coStage(n, s)) { k -= coStage(n, s); s++; } const w = n - s + 1; return { s, r: s + Math.floor(k / w), j: s - 1 + k % w }; };
const coParts = v => {
  const r = Math.round(v);
  if (Math.abs(v - r) < 1e-9) return [num(r)];
  for (let d = 2; d <= 60; d++) { const k = Math.round(v * d); if (Math.abs(v * d - k) < 1e-9) return k < 0 ? ['−', F(-k, d)] : [F(k, d)]; }
  return [num(Math.round(v * 100) / 100)];
};
const CO = { top: '#3d4f48', front: '#2a3833', left: '#33443e', lit: '#a9a596', cur: '#ece8dc' };

function cost(p, { n = 3, A = null, grid = null, chart = null, pyr = null, read = null, t0 = .1, max = 60, o = 0 } = {}) {
  const svg = $('stage'), s = { n, c: coTotal(n) };
  let plan = { ...s };
  const g = G(p, { o });
  show(g, t0 + .2);
  const parts = {};
  const listeners = [];
  const keyOf = () => `${s.n}|${Math.floor(s.c + 1e-9)}`;
  let drawn = '';

  /* ---------- the flat matrix ---------- */
  let GR = null;
  if (grid) {
    const gg = G(g, {});
    const pl = path(gg, '', { fill: COL.chalk, 'fill-opacity': .1, stroke: 'none' });
    const blk = path(gg, '', { fill: COL.chalk, 'fill-opacity': .1, stroke: 'none' });
    const lit = path(gg, '', { fill: COL.chalk, 'fill-opacity': .5, stroke: 'none' });
    const lines = path(gg, '', { fill: 'none', stroke: COL.faint, 'stroke-width': 1.5 });
    const frame = path(gg, '', { fill: 'none', stroke: COL.chalk, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' });
    const piv = path(gg, '', { fill: 'none', stroke: COL.chalk, 'stroke-width': 4 });
    const nums = G(gg, {}), work = G(g, {});
    GR = { gg, pl, blk, lit, lines, frame, piv, nums, work };
    parts.grid = gg; parts.work = work;
  }
  const cellR = (x, y, w) => `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${w.toFixed(1)}h${(-w).toFixed(1)}z`;
  function simulate(N, upto) {   // A's numbers after `upto` operations, and the working of the last one
    const a = A.map(r => r.slice()), ls = {};
    let last = null;
    for (let k = 0; k < upto; k++) {
      const { s: st, r, j } = coCell(N, k), pr = st - 1;
      if (j === pr) { const l = a[r][j] / a[pr][pr]; last = { kind: 'l', num: a[r][j], piv: a[pr][pr], l, r, j }; ls[r] = l; a[r][j] = 0; }
      else { const old = a[r][j], nw = old - ls[r] * a[pr][j]; last = { kind: 'ms', old, l: ls[r], top: a[pr][j], nw, r, j }; a[r][j] = nw; }
    }
    return { a, last };
  }
  function drawGrid(N, c) {
    const { x, y, w } = grid, cs = w / N, TT = coTotal(N), cur = c < TT ? coCell(N, c).s : null;
    const idx = (st, i, j) => coStart(N, st) + (i - st) * (N - st + 1) + (j - st + 1);
    let pl = '', blk = '', lit = '';
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const r = cellR(x + j * cs, y + i * cs, cs);
      if (i > j && idx(j + 1, i, j) < c) continue;              // a zero: left empty
      if (cur && i >= cur && j >= cur - 1) { if (idx(cur, i, j) < c) lit += r; else blk += r; }
      else pl += r;
    }
    GR.pl.setAttribute('d', pl); GR.blk.setAttribute('d', blk); GR.lit.setAttribute('d', lit);
    let ln = '';
    if (N <= 40) for (let k = 0; k <= N; k++) ln += `M${x} ${(y + k * cs).toFixed(1)}h${w}M${(x + k * cs).toFixed(1)} ${y}v${w}`;
    else ln = `M${x} ${y}h${w}v${w}h${-w}z`;
    GR.lines.setAttribute('d', ln);
    GR.frame.setAttribute('d', cur ? `M${x + (cur - 1) * cs} ${y + cur * cs}h${(N - cur + 1) * cs}v${(N - cur) * cs}h${-(N - cur + 1) * cs}z` : '');
    GR.piv.setAttribute('d', cur ? cellR(x + (cur - 1) * cs, y + (cur - 1) * cs, cs) : '');
    GR.nums.replaceChildren(); GR.work.replaceChildren();
    if (!A || A.length !== N) return;
    const { a, last } = simulate(N, c), fs = Math.min(40, cs * .4);
    a.forEach((row, i) => row.forEach((v, j) => {
      const zero = i > j && idx(j + 1, i, j) < c;
      M(GR.nums, coParts(v), { x: x + (j + .5) * cs, y: y + (i + .5) * cs + fs * .36, size: fs, fill: zero ? COL.faint : COL.chalk, anchor: 'middle' });
    }));
    if (!grid.work || !last) return;
    const [wx, wy] = grid.work, pf = v => v < 0 ? ['(', ...coParts(v), ')'] : coParts(v);
    const ps = last.kind === 'l' ? ['ℓ = ', ...coParts(last.num), ' ÷ ', ...pf(last.piv), ' = ', ...coParts(last.l), ',   so it becomes 0']
      : [...coParts(last.old), ' − ', ...pf(last.l), ' × ', ...pf(last.top), ' = ', ...coParts(last.nw)];
    M(GR.work, ps, { x: wx, y: wy, size: 34, fill: COL.chalk, anchor: 'start' });
    T(GR.work, `row ${last.r + 1}, column ${last.j + 1}`, { x: wx, y: wy + 38, size: 22, fill: COL.dim, weight: 600 });
  }

  /* ---------- the chart ---------- */
  let CH = null;
  if (chart) {
    const cg = G(g, {});
    const axes = path(cg, '', { fill: 'none', stroke: COL.dim, 'stroke-width': 2.5 });
    const ticks = G(cg, {});
    const old = path(cg, '', { fill: COL.chalk, 'fill-opacity': .32, stroke: 'none' });
    const bar = path(cg, '', { fill: COL.chalk, 'fill-opacity': .85, stroke: 'none' });
    const curve = path(cg, '', { fill: 'none', stroke: COL.chalk, 'stroke-width': 3, 'stroke-dasharray': '9 7' });
    const lab = G(cg, {});
    CH = { cg, axes, ticks, old, bar, curve, lab, key: '' };
    parts.chart = cg; parts.curve = curve;
  }
  const nice = v => { const e = 10 ** Math.floor(Math.log10(v)); for (const m of [1, 2, 2.5, 5, 10]) if (m * e >= v) return m * e; return 10 * e; };
  function drawChart(N, c) {
    const { x, y, w, h, N: N0 = 10 } = chart, xm = Math.max(N0, N), top = (xm + .3) ** 3 / 3, stp = nice(top / 4), ym = Math.ceil(top / stp) * stp;
    const X = m => x + w * m / (xm + .6), Y = v => y - h * v / ym, bw = Math.max(1.5, w / (xm + .6) * .62);
    const sk = `${xm}|${ym}`;
    if (sk !== CH.key) {
      CH.key = sk;
      CH.axes.setAttribute('d', `M${x} ${y - h - 10}V${y}H${x + w + 10}`);
      CH.ticks.replaceChildren();
      const every = xm <= 12 ? 1 : xm <= 30 ? 5 : xm <= 60 ? 10 : 20;
      for (let m = 1; m <= xm; m++) if (m % every === 0 || (every === 1 && m >= 1)) T(CH.ticks, String(m), { x: X(m), y: y + 30, size: 22, fill: COL.dim, anchor: 'middle' });
      for (let k = 1; k * stp <= ym + 1e-9; k++) {
        const v = k * stp;
        path(CH.ticks, `M${x - 8} ${Y(v)}H${x + w}`, { stroke: COL.faint, 'stroke-width': 1, 'stroke-opacity': .5 });
        T(CH.ticks, coFmt(v), { x: x - 14, y: Y(v) + 8, size: 22, fill: COL.dim, anchor: 'end' });
      }
      M(CH.ticks, ['n'], { x: x + w + 24, y: y + 8, size: 30, fill: COL.dim, anchor: 'start' });
      T(CH.ticks, 'operations', { x, y: y - h - 24, size: 24, fill: COL.dim, weight: 600, anchor: 'start' });
      let d = '';
      for (let q = 0; q <= 120; q++) { const m = (xm + .3) * q / 120; d += `${q ? 'L' : 'M'}${X(m).toFixed(1)} ${Y(m ** 3 / 3).toFixed(1)}`; }
      CH.curve.setAttribute('d', d);
    }
    let od = '';
    for (let m = 2; m < N; m++) od += `M${(X(m) - bw / 2).toFixed(1)} ${y}V${Y(coTotal(m)).toFixed(1)}h${bw.toFixed(1)}V${y}z`;
    CH.old.setAttribute('d', od);
    const cv = Math.min(c, coTotal(N));
    CH.bar.setAttribute('d', N >= 2 ? `M${(X(N) - bw / 2).toFixed(1)} ${y}V${Y(cv).toFixed(1)}h${bw.toFixed(1)}V${y}z` : '');
    CH.lab.replaceChildren();
    T(CH.lab, coFmt(cv), { x: X(N), y: Y(cv) - 14, size: 26, fill: COL.task, weight: 700, anchor: N > xm * .75 ? 'end' : 'middle' });
    M(CH.lab, ['n³/3'], { x: X(xm + .3) + 6, y: Y((xm + .3) ** 3 / 3) + 30, size: 26, fill: COL.chalk, anchor: 'start' });
  }

  /* ---------- the pyramid ---------- */
  let PY = null;
  const K = .5, ca = Math.cos(Math.PI * 35 / 180), sa = Math.sin(Math.PI * 35 / 180);
  if (pyr) {
    const pg = G(g, {});
    const floor = path(pg, '', { fill: COL.chalk, 'fill-opacity': .06, stroke: COL.faint, 'stroke-width': 1.2 });
    const layers = G(pg, {});
    const box = path(pg, '', { fill: 'none', stroke: COL.dim, 'stroke-width': 2, 'stroke-dasharray': '6 7' });
    const cone = path(pg, '', { fill: COL.chalk, 'fill-opacity': 0, stroke: COL.chalk, 'stroke-width': 3, 'stroke-dasharray': '12 8' });
    put(cone, { o: 0 });
    PY = { pg, floor, layers, box, cone };
    parts.pyr = pg; parts.cone = cone; parts.box = box;
  }
  function drawPyr(N, c) {
    const { x, y, size } = pyr, u = size / N;
    const P_ = (cc, d, hh) => `${(x + cc * u - d * u * K * ca).toFixed(1)} ${(y - d * u * K * sa - hh * u).toFixed(1)}`;
    const poly = pts => `M${pts.map(q => P_(...q)).join('L')}z`;
    let fl = poly([[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0]]);
    if (N <= 40) for (let k = 1; k < N; k++) fl += `M${P_(k, 0, 0)}L${P_(k, N, 0)}M${P_(0, k, 0)}L${P_(N, k, 0)}`;
    PY.floor.setAttribute('d', fl);
    const B = (a, b) => `M${P_(...a)}L${P_(...b)}`;
    PY.box.setAttribute('d', [B([0, 0, N], [N, 0, N]), B([N, 0, N], [N, N, N]), B([N, N, N], [0, N, N]), B([0, N, N], [0, 0, N]),
      B([0, 0, 0], [0, 0, N]), B([N, 0, 0], [N, 0, N]), B([0, N, 0], [0, N, N]), B([N, N, 0], [N, N, N])].join(''));
    PY.cone.setAttribute('d', `M${P_(0, 0, 0)}L${P_(N, 0, N)}M${P_(0, N, 0)}L${P_(N, 0, N)}M${P_(N, N, 0)}L${P_(N, 0, N)}M${P_(N, 0, 0)}L${P_(N, 0, N)}` + poly([[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0]]));
    PY.layers.replaceChildren();
    const T_ = coTotal(N), cs = c < T_ ? coCell(N, c).s : null;
    for (let st = 1; st < N; st++) {
      const s0 = coStart(N, st), done = Math.min(Math.max(c - s0, 0), coStage(N, st));
      if (done <= 0) break;
      const L = st - 1, D = N - st, lo = st - 1, hi = st, curSt = st === cs;
      path(PY.layers, poly([[L, 0, lo], [L, D, lo], [L, D, hi], [L, 0, hi]]), { fill: CO.left, stroke: COL.board, 'stroke-width': 1 });
      path(PY.layers, poly([[L, 0, lo], [N, 0, lo], [N, 0, hi], [L, 0, hi]]), { fill: CO.front, stroke: COL.board, 'stroke-width': 1 });
      path(PY.layers, poly([[L, 0, hi], [N, 0, hi], [N, D, hi], [L, D, hi]]), { fill: CO.top, stroke: COL.board, 'stroke-width': 1 });
      // the counted cells of this stage on its top face: row r of the matrix is depth N − r − 1 … N − r
      const w = N - st + 1;
      let lit = '';
      for (let k = 0; k < Math.floor(done); k++) {
        const r = st + Math.floor(k / w), j = L + k % w, d0 = N - r - 1;
        lit += poly([[j, d0, hi], [j + 1, d0, hi], [j + 1, d0 + 1, hi], [j, d0 + 1, hi]]);
      }
      path(PY.layers, lit, { fill: curSt ? CO.cur : CO.lit, 'fill-opacity': curSt ? .75 : .5, stroke: N <= 30 ? COL.board : 'none', 'stroke-width': 1 });
    }
  }

  /* ---------- the readout ---------- */
  let RD = null;
  if (read) {
    const rg = G(g, {}), { x, y, gap = 54, size = 34 } = read;
    const ng = G(rg, {}), og = G(rg, {}), tg = G(rg, {}), qg = G(rg, {});
    M(ng, ['n ='], { x, y, size, fill: COL.chalk, anchor: 'start' });
    const nBox = mk('rect', { x: x + 64, y: y - size * .95, width: 92, height: size * 1.3, rx: 10, fill: 'transparent', 'stroke-dasharray': '4 6' }, ng);
    nBox.setAttribute('aria-label', 'n');
    const nT = G(ng, {}); nT.style.pointerEvents = 'none';
    T(og, 'operations:', { x, y: y + gap, size: size * .85, fill: COL.chalk, weight: 600 });
    const oT = G(og, {});
    const tT = G(tg, {}), qT = G(qg, {});
    RD = { rg, ng, og, tg, qg, nBox, nT, oT, tT, qT, x, y, gap, size };
    parts.read = { g: rg, n: ng, ops: og, third: tg, ratio: qg };
  }
  function drawRead(N, c) {
    const { x, y, gap, size } = RD;
    RD.nT.replaceChildren(); T(RD.nT, String(N), { x: x + 110, y, size, fill: COL.chalk, font: MATH, anchor: 'middle' });
    RD.oT.replaceChildren(); T(RD.oT, coFmt(Math.min(c, coTotal(N))), { x: x + 190, y: y + gap, size, fill: COL.task, weight: 700 });
    RD.tT.replaceChildren(); M(RD.tT, ['n³/3 ≈ ', coThird(N)], { x, y: y + 2 * gap, size: size * .9, fill: COL.chalk, anchor: 'start' });
    RD.qT.replaceChildren(); T(RD.qT, `operations ÷ n³/3 = ${(Math.min(c, coTotal(N)) / (N ** 3 / 3)).toFixed(3)}`, { x, y: y + 3 * gap, size: size * .75, fill: COL.dim, weight: 600 });
  }

  function draw() {
    const k = keyOf();
    if (k === drawn) return;
    drawn = k;
    const N = s.n, c = Math.floor(s.c + 1e-9);
    if (GR) drawGrid(N, c);
    if (CH) drawChart(N, c);
    if (PY) drawPyr(N, c);
    if (RD) drawRead(N, c);
    listeners.forEach(f => f({ ...s }));
  }
  const edit = to => {
    if ('n' in to) { s.n = Math.max(2, Math.min(max, Math.round(to.n))); s.c = 'c' in to ? Math.max(0, Math.min(coTotal(s.n), to.c)) : coTotal(s.n); }
    else if ('c' in to) s.c = Math.max(0, Math.min(coTotal(s.n), to.c));
    draw();
  };

  /* ---------- hands on: n ---------- */
  let live = false;
  if (RD) {
    const bx = RD.nBox;
    let drag = null;
    bx.addEventListener('pointerdown', e => { if (!live) return; e.preventDefault(); drag = { x: e.clientX, from: s.n }; bx.setPointerCapture(e.pointerId); });
    bx.addEventListener('pointermove', e => { if (!drag) return; const k = svg.getScreenCTM().a; edit({ n: drag.from + Math.round((e.clientX - drag.x) / k / 22) }); });
    const end = () => { drag = null; };
    bx.addEventListener('pointerup', end);
    bx.addEventListener('lostpointercapture', end);
    bx.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); bx.blur(); P.keys?.(e); return; }
      if (!live) return;
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      edit({ n: s.n + d });
    });
  }

  draw();
  return {
    g, parts, total: coTotal, stage: n_ => coStage(s.n, n_), start: st => coStart(s.n, st),
    get v() { return { ...s }; },
    get plan() { return plan; },
    set(vals) { edit(vals); plan = { ...s }; },
    // on the beat clock: n and c move together (n in whole steps; with n alone every size is fully counted)
    to(next, at, dur = 1.4, ease = io) {
      const from = { ...plan }, goal = { ...plan, ...next };
      if ('n' in next && !('c' in next)) goal.c = coTotal(goal.n);
      plan = goal;
      prog(q => {
        if ('n' in next && !('c' in next)) { const nn = Math.round(from.n + (goal.n - from.n) * q); edit({ n: nn }); }
        else edit({ n: Math.round(from.n + (goal.n - from.n) * q), c: from.c + (goal.c - from.c) * q });
      }, at, dur, ease);
      return at + dur;
    },
    count(st, at, dur = 2, ease = lin) { return this.to({ c: coStart(plan.n, st + 1) }, at, dur, ease); },
    live(on) {
      live = on;
      if (!RD) return;
      RD.nBox.style.cursor = on ? 'ew-resize' : '';
      RD.nBox.setAttribute('stroke', on ? COL.faint : 'none');
      if (on) RD.nBox.setAttribute('tabindex', 0); else RD.nBox.removeAttribute('tabindex');
    },
    onChange(f) { listeners.push(f); },
  };
}

// A question on n: the reader scrubs n until test(v) holds.
const costTask = (ce, test, why, hint, reveal) => (body, api) => {
  ce.live(true);
  return {
    check: () => { const v = ce.v, ok = test(v); api.grade(ok, ok ? why : typeof hint === 'function' ? hint(v) : hint); },
    reveal: () => { reveal?.(); return why; },
    lock: () => ce.live(false),
    hint: [kbd('Tab'), ' to n, ', kbd('↑'), kbd('↓'), ' to change it, or drag it sideways'],
  };
};
