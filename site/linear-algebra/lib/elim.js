// Elimination on the augmented matrix [A | b] of a linsys (2 × 2) or lin3 (3 × 3) system, linked to its picture.
// The matrix is drawn from the system's own numbers, so every entry changes in place while the system moves; a row
// operation "row 2 − 3 × row 1" is a label beside the row it changes, with its multiplier boxed, and the step itself is
// a continuous change: row 2 → row 2 − q·ℓ·row 1, q from 0 to 1. Every stage of that change is still true of the
// solution, so the line (or plane) of row 2 turns about the meeting point, which never moves.
//
//   const el = elim(p, sys, { at: [x, y] });   // sys: linsys(…) or lin3(…); rows at y, y + rh, …
//   el.op(1, 0, 3, at)                          // the label "row 2 − 3 × row 1" beside row 2 (rows count from 0)
//   el.step(1, 0, 3, at, dur)                    // the label and the step: row 2 − 3 × row 1, on the beat clock
//   el.mult(2, at, dur)                          // the open operation with another multiplier (its label counts)
//   el.ring(0, 0, at)                            // a circle round an entry: the pivot
//   el.diag(at); el.upper(at)                    // behind the numbers: the diagonal band, the upper triangle (U)
//   el.opNow(2, 1)                               // inside a question: open "row 3 − ℓ × row 2" at once
//   el.swap(1, 2, at, dur, { label: [x, y] })    // rows 2 and 3 slide past each other (elSwap, below)
//   elim(p, sys, { noB: true })                  // A alone: no divider, no b column (a matrix times a matrix)
//   const L = elL(p, el, { at: [x, y] })        // (10-28) L beside the table: L.step(1, 0, 2, at) flies each multiplier into place
//   el.onL(f)                                   // (10-28) f(i, j, l) whenever the reader scrubs the multiplier
//
// While elim is attached, move the system through el.to(next, at, dur) (or el.step, el.mult): elim keeps the plan
// that the next step starts from. Hands on: el.scrub(true) makes the open operation's multiplier a number to drag
// sideways (or Tab to it and press ↑/↓); el.v, el.set and el.live make it a component for playAsk; elTask is the
// question type ("find the multiplier that makes it flat").
// Loads after engine.js (and linsys.js or space3.js).
const EL_ROW = [COL.whole, COL.nat, COL.int];

function elim(p, sys, { at: [x0, y0] = [130, 450], size = 46, cw = 96, rh = 70, t0 = .1, dens = [1], step: lStep = 1, o = 0, labelX = null, noB = false } = {}) {
  const n = 'a22' in sys.v ? 3 : 2, I = [...Array(n).keys()], svg = $('stage');
  const keysOf = i => [...I.map(j => `a${i}${j}`), `b${i}`];
  const g = G(p, { o });
  show(g, t0 + .2);
  const W = noB ? n * cw : n * cw + 24 + cw;   // A, the divider, b (A alone with noB)
  const cx = j => j < n ? x0 + cw * (j + .5) : x0 + n * cw + 24 + cw / 2;
  const ry = i => y0 + i * rh;
  let plan = { ...sys.v };

  // exact where the number is: whole, or a fraction whose denominator is in dens; one decimal while it moves
  const parts = (v, paren = false) => {
    const r = Math.round(v);
    if (Math.abs(v - r) < 1e-9) return [(paren && r < 0) ? `(−${-r})` : num(r)];
    for (const d of dens) {
      const k = Math.round(v * d);
      if (d > 1 && Math.abs(v * d - k) < 1e-9) {
        const gg = gcd(Math.abs(k), d), nn = Math.abs(k) / gg, dd = d / gg;
        return k < 0 ? (paren ? ['(−', F(nn, dd), ')'] : ['−', F(nn, dd)]) : [F(nn, dd)];
      }
    }
    const s = num(Math.round(v * 10) / 10);
    return [paren && v < 0 ? `(${s})` : s];
  };
  const key = ps => ps.map(q => typeof q === 'string' ? q : q.f.join('/')).join('');

  /* ---------- the matrix ---------- */
  const top = y0 - size * .95, bot = y0 + (n - 1) * rh + size * .35;
  path(g, `M${x0 - 2} ${top}H${x0 - 16}V${bot}H${x0 - 2}M${x0 + W + 2} ${top}H${x0 + W + 16}V${bot}H${x0 + W + 2}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
  const divider = path(g, `M${x0 + n * cw + 12} ${top + 6}V${bot - 6}`, { stroke: COL.dim, 'stroke-width': 2.5, 'stroke-dasharray': '6 6', fill: 'none' });
  const rowG = I.map(i => G(g, {}));
  const bars = I.map(i => mk('rect', { x: x0 - 52, y: ry(i) - size * .7, width: 8, height: size * .8, rx: 4, fill: EL_ROW[i] }, rowG[i]));
  const cells = I.map(i => keysOf(i).map((k, j) => {
    const c = G(rowG[i], { x: cx(j), y: ry(i) });
    const glow = mk('rect', { x: -cw / 2 + 6, y: -size * .9, width: cw - 12, height: size * 1.2, rx: 12, fill: COL.task }, c);
    put(glow, { o: 0 });
    const holder = G(c, {});
    holder.style.pointerEvents = 'none';   // the box under the number takes the drag
    const box = mk('rect', { x: -cw / 2 + 4, y: -size * .92, width: cw - 8, height: size * 1.24, rx: 10, fill: 'transparent', 'stroke-dasharray': '4 6' }, c);
    box.setAttribute('aria-label', k);
    return { k, c, glow, holder, box, txt: null, fill: j === n ? COL.task : COL.chalk };
  }));
  const names = G(g, {});   // "A" over the numbers in front of the letters, "b" over the right sides
  T(names, 'A', { x: x0 + n * cw / 2, y: top - 16, size: 28, fill: COL.dim, font: MATH, weight: 700, anchor: 'middle' });
  if (!noB) T(names, 'b', { x: cx(n), y: top - 16, size: 28, fill: COL.dim, font: MATH, weight: 700, anchor: 'middle' });
  put(names, { o: 0 });
  if (noB) { put(divider, { o: 0 }); I.forEach(i => put(cells[i][n].c, { o: 0 })); }

  function draw() {
    const v = sys.v;
    cells.forEach(row => row.forEach(cl => {
      const ps = parts(v[cl.k]), s = key(ps);
      if (s === cl.txt) return;
      cl.txt = s;
      cl.holder.replaceChildren();
      M(cl.holder, ps, { size, fill: cl.fill, anchor: 'middle' });
    }));
  }

  /* ---------- the row operation: label, multiplier, the step ---------- */
  let cur = null;   // the open operation: { i, j, base (row i before it), l (planned), shown, lab }
  const fs = 34;
  function label(i, j, at, place) {
    const [lx, ly] = place || [labelX ?? x0 + W + 60, ry(i) - 4];
    const lg = G(g, { x: lx, y: ly, o: 0 });
    const t1 = T(lg, `row ${i + 1}`, { size: fs, fill: EL_ROW[i], weight: 600 });
    const t2 = T(lg, '−', { size: fs, fill: COL.chalk, weight: 600 });
    const mg = G(lg, {}), mbox = mk('rect', { rx: 10, fill: 'none', stroke: COL.chalk, 'stroke-width': 2.5 }, mg), mh = G(mg, {});
    const t3 = T(lg, '×', { size: fs, fill: COL.chalk, weight: 600 });
    const t4 = T(lg, `row ${j + 1}`, { size: fs, fill: EL_ROW[j], weight: 600 });
    const hit = mk('rect', { rx: 10, fill: 'transparent' }, lg);
    [t1, t2, t3, t4].forEach(t => { t.style.pointerEvents = 'none'; });
    mg.style.pointerEvents = 'none';
    let shownKey = null;
    const lay = l => {   // the multiplier as math, boxed; the words after it move along when it grows
      const ps = parts(l, true), s = key(ps);
      if (s === shownKey) return;
      shownKey = s;
      mh.replaceChildren();
      const m = M(mh, ps, { size: fs + 2, fill: COL.chalk, anchor: 'start' });
      const w1 = t1.getComputedTextLength() || 80, w2 = t2.getComputedTextLength() || 14, mw = m._w || 20, frac = ps.some(q => q.f);
      put(t2, { x: w1 + 14 });
      const mx = w1 + 14 + w2 + 22;
      put(mg, { x: mx });
      const hgt = frac ? fs * 1.75 : fs * 1.3, ytop = frac ? -fs * 1.12 : -fs * .98;
      for (const [a, b] of Object.entries({ x: -9, y: ytop, width: mw + 18, height: hgt })) mbox.setAttribute(a, b);
      for (const [a, b] of Object.entries({ x: mx - 14, y: ytop - 6, width: mw + 28, height: hgt + 12 })) hit.setAttribute(a, b);
      put(t3, { x: mx + mw + 22 });
      put(t4, { x: mx + mw + 22 + (t3.getComputedTextLength() || 18) + 14 });
    };
    lay(0);
    if (at === null) put(lg, { o: 1 }); else show(lg, at, .5);   // null: at once (a question's build)
    return { g: lg, i, j, lay, mbox, hit, words: [t1, t2, t3, t4], mult: mg };
  }
  const rowOf = (s, i) => Object.fromEntries(keysOf(i).map(k => [k, s[k]]));
  const minus = (base, i, j, l, s) => Object.fromEntries(keysOf(i).map((k, c) => [k, base[k] - l * s[keysOf(j)[c]]]));

  // Open the operation "row i − l × row j" (shown at `at`); the rows do not change until step or mult.
  // place: [x, y] puts the label elsewhere than beside row i (under a small matrix, say).
  function op(i, j, l, at, { shown = l, place = null } = {}) {
    if (cur?.lab && cur.lab.g.parentNode) hide(cur.lab.g, at, .3);
    const lab = label(i, j, at, place);
    cur = { i, j, base: rowOf(plan, i), l: 0, shown, lab };
    prog(() => lab.lay(shown), at, 0, lin);
    return lab;
  }
  // Open "row i − ℓ × row j" at once, from the system as it is now (inside a question: several steps in turn).
  function opNow(i, j) {
    if (cur?.lab) put(cur.lab.g, { o: 0 });
    const lab = label(i, j, null);
    plan = { ...sys.v };
    cur = { i, j, base: rowOf(plan, i), l: 0, shown: 0, lab };
    lNow = 0;
    return lab;
  }
  // Row i of the open operation becomes base − l × row j, over dur seconds; with count the boxed multiplier runs
  // from the last value shown to l along with it.
  function mult(l, at, dur = 1.6, { count = true, ease = io } = {}) {
    const c = cur, next = minus(c.base, c.i, c.j, l, plan), from = c.shown;
    plan = { ...plan, ...next };
    sys.to(next, at, dur, ease);
    if (count && from !== l) prog(q => c.lab.lay(Math.abs(q - 1) < 1e-9 ? l : from + (l - from) * q), at, dur, ease);
    else prog(() => c.lab.lay(l), at, 0, lin);
    c.l = c.shown = l;
    return at + dur;
  }
  // The whole step: label at `at`, the change from at + lead.
  function step(i, j, l, at, dur = 1.8, { lead = .8, count = false, place = null } = {}) {
    op(i, j, l, at, { shown: count ? 0 : l, place });
    return mult(l, at + lead, dur, { count });
  }

  /* ---------- marks on the matrix ---------- */
  // A circle round entry (i, j) (j = n is the right side): the pivot, solid; { dash: true } for the number to remove.
  function ring(i, j, at, { color = COL.chalk, dash = false, label: words = '', below = true } = {}) {
    const rg = G(g, { x: cx(j), y: ry(i) - size * .32, o: 0 });
    mk('ellipse', { rx: cw * .44, ry: size * .62, fill: 'none', stroke: color, 'stroke-width': 3.5, ...(dash ? { 'stroke-dasharray': '7 6' } : {}) }, rg);
    if (words) T(rg, words, { x: 0, y: below ? size * 1.15 : -size * .8, size: 22, fill: color, weight: 700, anchor: 'middle' });
    show(rg, at, .35);
    return rg;
  }
  // A row of numbers in the matrix's columns at row position r (r = n, n + 1, … are under the matrix), with a label
  // after it: a line of working such as "3 × row 1".
  function line(vals, r, at, { label: words = '', color = COL.dim, fill = COL.chalk, sign = '' } = {}) {
    const lg = G(g, { o: 0 }), y = y0 + r * rh;
    vals.forEach((v, j) => { if (v !== null) M(lg, parts(v), { x: cx(j), y, size: size * .9, fill: j === n ? COL.task : fill, anchor: 'middle' }); });   // null: an empty place
    if (sign) M(lg, [sign], { x: x0 - 30, y, size: size * .9, fill, anchor: 'middle' });
    if (Array.isArray(words)) M(lg, words, { x: labelX ?? x0 + W + 60, y: y - 4, size: 30, fill: color, anchor: 'start' });   // math parts: F(3, 2), …
    else if (words) T(lg, words, { x: labelX ?? x0 + W + 60, y: y - 4, size: 30, fill: color, weight: 600 });
    show(lg, at, .4);
    return lg;
  }
  // A rule under row r (for working written as a sum), across the matrix.
  function rule(r, at) {
    const e = path(g, `M${x0 - 40} ${y0 + r * rh + size * .45}H${x0 + W}`, { stroke: COL.chalk, 'stroke-width': 2.5 }, { d: 0 });
    draw_(e, at, .5);
    return e;
  }
  const draw_ = (e, at, dur) => tw(e, { d: 1 }, at, dur);
  // Behind the numbers (so nothing is struck through): the diagonal as a soft band through the pivot places, and the
  // upper triangle as a staircase round the entries on and above it (A only, not b).
  const behind = e => { g.insertBefore(e, rowG[0]); return e; };
  const mid = i => ry(i) - size * .32;
  function diag(at, { color = COL.task, dur = .5 } = {}) {
    const e = behind(path(g, `M${cx(0)} ${mid(0)}L${cx(n - 1)} ${mid(n - 1)}`, { stroke: color, 'stroke-width': size * 1.3, 'stroke-linecap': 'round', 'stroke-opacity': .2, fill: 'none' }, { o: 0 }));
    show(e, at, dur);
    return e;
  }
  function upper(at, { color = COL.task, dur = .6 } = {}) {
    const L = j => cx(j) - cw / 2 + 2, R = cx(n - 1) + cw / 2 - 2, B = i => mid(i) + rh / 2 - 3;
    let d = `M${L(0)} ${mid(0) - rh / 2 + 3}H${R}V${B(n - 1)}`;
    for (let i = n - 1; i > 0; i--) d += `H${L(i)}V${B(i - 1)}`;
    d += `H${L(0)}Z`;
    const e = behind(path(g, d, { fill: color, 'fill-opacity': .12, stroke: color, 'stroke-opacity': .75, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, { o: 0 }));
    show(e, at, dur);
    return e;
  }
  // Light the entries of row i (one entry with j) for a moment.
  function flash(i, at, j = null) {
    cells[i].forEach((cl, c) => { if (j === null || j === c) { tw(cl.glow, { o: .32 }, at, .25); tw(cl.glow, { o: 0 }, at + 1.1, .6); } });
  }
  // Bring some rows forward (an index, a list, or null for all) and dim the rest.
  function focus(which, at, dur = .5) {
    const on = which === null ? I : [].concat(which);
    I.forEach(i => tw(rowG[i], { o: on.includes(i) ? 1 : .3 }, at, dur));
  }
  // Move the system (the picture and the matrix) and keep the plan.
  function to(next, at, dur = 1.2, ease = io) {
    plan = { ...plan, ...next };
    sys.to(next, at, dur, ease);
    if (cur) keysOf(cur.i).forEach(k => { if (k in next) cur.base[k] = next[k]; });
  }
  // At once, outside the beat clock (a question that sets up a new system): the system takes the numbers, and the open
  // operation starts again from multiplier 0 on the new rows.
  function load(next) {
    sys.set(next);
    plan = { ...sys.v };
    if (!cur) return;
    cur.base = rowOf(plan, cur.i); cur.l = cur.shown = 0; lNow = 0;
    if (scrubOn) base = { ...cur.base };
    cur.lab.lay(0);
    lfs.forEach(f => f(cur.i, cur.j, 0));
  }

  /* ---------- hands on: the multiplier as a number to drag ---------- */
  let live = false, scrubOn = false, lNow = 0, bound = false;
  const RANGE = 9;
  // The reader's state: the system's numbers and the multiplier. Row i of the open operation is always
  // base − l × row j; base follows whatever the reader changes in the system itself.
  let base = null, quiet = false;
  const lfs = [];   // el.onL(f): f(i, j, l) whenever the reader's multiplier changes (elL follows it)
  const apply = () => { quiet = true; sys.set(minus(base, cur.i, cur.j, lNow, sys.v)); quiet = false; cur.lab.lay(lNow); lfs.forEach(f => f(cur.i, cur.j, lNow)); };
  const bind = () => {
    if (bound || !cur) return;
    bound = true;
    sys.onChange(v => { if (!quiet && cur && scrubOn) base = Object.fromEntries(keysOf(cur.i).map((k, c) => [k, v[k] + lNow * v[keysOf(cur.j)[c]]])); });
  };
  const setL = l => { lNow = Math.max(-RANGE, Math.min(RANGE, Math.round(l / lStep) * lStep)); if (base) apply(); };
  function scrub(on) {
    if (!cur) return;
    scrubOn = on;
    if (on) {
      bind();
      lNow = cur.l;
      base = Object.fromEntries(keysOf(cur.i).map((k, c) => [k, sys.v[k] + lNow * sys.v[keysOf(cur.j)[c]]]));
    }
    const h = cur.lab.hit;
    h.style.cursor = on ? 'ew-resize' : '';
    cur.lab.mbox.setAttribute('stroke-dasharray', on ? '5 5' : '');
    cur.lab.mbox.setAttribute('stroke', on ? COL.task : COL.chalk);
    if (on) h.setAttribute('tabindex', 0); else h.removeAttribute('tabindex');
    h.setAttribute('aria-label', 'multiplier');
    if (h._wired) return;
    h._wired = true;
    let drag = null;
    h.addEventListener('pointerdown', e => {
      if (!scrubOn) return;
      e.preventDefault();
      drag = { x: e.clientX, from: lNow };
      h.setPointerCapture(e.pointerId);
    });
    h.addEventListener('pointermove', e => {
      if (!drag) return;
      const k = svg.getScreenCTM().a;
      setL(drag.from + Math.round((e.clientX - drag.x) / k / 26) * lStep);
    });
    const end = () => { drag = null; };
    h.addEventListener('pointerup', end);
    h.addEventListener('lostpointercapture', end);
    h.addEventListener('keydown', e => {
      if (!scrubOn) return;
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); h.blur(); P.keys?.(e); return; }
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      setL(lNow + d * lStep);
    });
  }

  // Every entry can be scrubbed while the matrix is live (only the keys allowed): whole steps, as in linsys.
  let allowed = null;
  const canCell = k => live && (!allowed || allowed.has(k));
  cells.flat().forEach(cl => {
    let drag = null;
    cl.box.addEventListener('pointerdown', e => {
      if (!canCell(cl.k)) return;
      e.preventDefault();
      drag = { x: e.clientX, from: Math.round(sys.v[cl.k]) };
      cl.box.setPointerCapture(e.pointerId);
    });
    cl.box.addEventListener('pointermove', e => {
      if (!drag) return;
      const k = svg.getScreenCTM().a, R = cl.k[0] === 'b' ? 30 : 9;
      sys.set({ [cl.k]: Math.max(-R, Math.min(R, drag.from + Math.round((e.clientX - drag.x) / k / 22))) });
    });
    const end = () => { drag = null; };
    cl.box.addEventListener('pointerup', end);
    cl.box.addEventListener('lostpointercapture', end);
    cl.box.addEventListener('keydown', e => {
      if (!canCell(cl.k)) return;
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cl.box.blur(); P.keys?.(e); return; }
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      const R = cl.k[0] === 'b' ? 30 : 9;
      sys.set({ [cl.k]: Math.max(-R, Math.min(R, Math.round(sys.v[cl.k]) + d)) });
    });
  });
  const cellsLive = () => cells.flat().forEach(cl => {
    const ok = canCell(cl.k);
    cl.box.style.cursor = ok ? 'ew-resize' : '';
    cl.box.setAttribute('stroke', ok ? COL.faint : 'none');
    if (ok) cl.box.setAttribute('tabindex', 0); else cl.box.removeAttribute('tabindex');
  });

  draw();
  sys.onChange(draw);
  const api = {
    g, n, cells, rowG, bars, names, divider, W, cx, ry, size, rh,
    get plan() { return plan; },
    get l() { return lNow; },
    get op_() { return cur; },
    op, opNow, mult, step, ring, line, rule, flash, focus, to, load, diag, upper,
    scrub,
    // playAsk and elTask: the system's numbers plus the multiplier l
    get v() { return { ...sys.v, l: lNow }; },
    set(vals) {
      const { l, ...rest } = vals, has = Object.keys(rest).length > 0;
      if (l === undefined || !cur || !scrubOn) { if (has) sys.set(rest); return; }
      if (!has) { setL(l); return; }   // the multiplier alone: row i follows it
      lNow = l;   // the whole state (a reset): the numbers as given, and base read back from them
      sys.set(rest);
      base = Object.fromEntries(keysOf(cur.i).map((k, c) => [k, sys.v[k] + lNow * sys.v[keysOf(cur.j)[c]]]));
      cur.lab.lay(lNow);
    },
    setL,
    // only: the system's numbers the reader may change besides the multiplier ([] for none; null for all)
    live(on, { only = null } = {}) {
      live = on;
      allowed = on && only ? new Set(only) : null;
      cellsLive();
      if (sys.lock) { sys.lock(only); sys.live(on); } else sys.live(on, only ? { only } : {});
      scrub(on);
    },
    solve: () => sys.solve(),
    onL: f => lfs.push(f),
    swap: (i, j, at, dur, opts) => elSwap(api, sys, i, j, at, dur, opts),
  };
  return api;
}

// Swap rows i and j of an elim table and of its system, on the beat clock (or on the answer clock with { now: true },
// inside a question). The numbers slide past each other while the row colours trade (the table's bars, the equations'
// bars and, in 2D, the lines), then the system takes the swapped numbers. Lines and planes stay where they are: the same
// equations in a new order. label: [x, y] writes "row i ↔ row j" there (the open operation's label goes as it comes).
function elSwap(el, sys, i, j, at, dur = 1.4, { label = null, now = false } = {}) {
  const n = el.n, keys = r => [...[...Array(n).keys()].map(c => `a${r}${c}`), `b${r}`];
  const from = now ? { ...sys.v } : { ...el.plan }, next = {};
  keys(i).forEach((k, c) => { const k2 = keys(j)[c]; next[k] = from[k2]; next[k2] = from[k]; });
  const dy = el.ry(j) - el.ry(i);
  const eqs = sys.eqRows ? sys.eqRows.map(r => r.g) : sys.rows || [];
  const eqBar = g => g?.querySelector('rect');
  const eqDy = eqs[i] && eqs[j] ? +eqBar(eqs[j]).getAttribute('y') - +eqBar(eqs[i]).getAttribute('y') : 0;
  const lines = sys.lines?.[0]?.l ? sys.lines.map(l => l.l) : [];   // 2D lines (lin3's lines are its meeting lines)
  let lab = null;
  if (label && !now) {
    if (el.op_?.lab?.g.parentNode) hide(el.op_.lab.g, at - .7, .3);
    lab = G(el.g, { x: label[0], y: label[1], o: 0 });
    M(lab, [`row ${i + 1}`], { size: 34, fill: EL_ROW[i], anchor: 'start' });
    M(lab, ['↔'], { x: 112, size: 34, fill: COL.chalk, anchor: 'start' });
    M(lab, [`row ${j + 1}`], { x: 166, size: 34, fill: EL_ROW[j], anchor: 'start' });
    show(lab, at - .4, .4);
  }
  const frame = q => {
    const s = q < 1 ? q : 0, c = (a, b) => q < 1 ? mix(a, b, q) : a;
    el.cells[i].forEach(cl => put(cl.c, { y: el.ry(i) + dy * s }));
    el.cells[j].forEach(cl => put(cl.c, { y: el.ry(j) - dy * s }));
    el.bars[i].setAttribute('fill', c(EL_ROW[i], EL_ROW[j])); el.bars[j].setAttribute('fill', c(EL_ROW[j], EL_ROW[i]));
    if (eqs[i] && eqs[j]) {
      put(eqs[i], { y: eqDy * s }); put(eqs[j], { y: -eqDy * s });
      eqBar(eqs[i]).setAttribute('fill', c(EL_ROW[i], EL_ROW[j])); eqBar(eqs[j]).setAttribute('fill', c(EL_ROW[j], EL_ROW[i]));
    }
    if (lines[i] && lines[j]) { lines[i].setAttribute('stroke', c(EL_ROW[i], EL_ROW[j])); lines[j].setAttribute('stroke', c(EL_ROW[j], EL_ROW[i])); }
    if (q >= 1 && now) el.load(next);
  };
  if (now) { fxp(frame, 0, dur); return next; }
  prog(frame, at, dur);
  el.to(next, at + dur, 0);
  return lab;
}

// L beside an elimination (added 10-28, chapter 30): the matrix L that keeps the multipliers. It starts as the identity
// with an empty place under the diagonal for each step; L.step runs el.step and then flies the boxed multiplier into
// its place in L (row i, column j: the row it changed, the row it used). Draw it in the same parent as el.
//
//   const L = elL(p, el, { at: [x, y] });   // size, cw, rh, name ('L'), dens
//   L.step(1, 0, 2, at, dur)                 // row 2 − 2 × row 1 on the table; then the 2 lands in row 2, column 1 of L
//   L.put(2, 0, 0, at)                       // a place filled at once (0: no step was needed there); null empties it
//   L.tri(at); L.ring(i, j, at); L.flash(i, j, at)
//   L.follow(true)                           // inside a question: the open operation's multiplier shows in its place
//   L.clear()                                // every place under the diagonal empty again, at once
function elL(p, el, { at: [x0, y0] = [100, 600], size = 38, cw = 60, rh = 56, name = 'L', t0 = .1, o = 0, dens = [1, 2, 3, 4, 5] } = {}) {
  const n = el.n, I = [...Array(n).keys()];
  const g = G(p, { o });
  show(g, t0 + .2);
  const cx = j => x0 + cw * (j + .5), ry = i => y0 + i * rh;
  const top = y0 - size * .95, bot = y0 + (n - 1) * rh + size * .35, W = n * cw;
  path(g, `M${x0 + 12} ${top}H${x0}V${bot}H${x0 + 12}M${x0 + W - 12} ${top}H${x0 + W}V${bot}H${x0 + W - 12}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
  const nameG = M(g, [].concat(name), { x: x0 + W / 2, y: top - 16, size: 28, fill: COL.dim, anchor: 'middle' });
  const parts = v => {
    const r = Math.round(v);
    if (Math.abs(v - r) < 1e-9) return [num(r)];
    for (const d of dens) { const k = Math.round(v * d); if (d > 1 && Math.abs(v * d - k) < 1e-9) { const gg = gcd(Math.abs(k), d); return k < 0 ? ['−', F(Math.abs(k) / gg, d / gg)] : [F(k / gg, d / gg)]; } }
    return [num(Math.round(v * 10) / 10)];
  };
  const cells = I.map(i => I.map(j => {
    const c = G(g, { x: cx(j), y: ry(i) });
    const glow = mk('rect', { x: -cw / 2 + 4, y: -size * .9, width: cw - 8, height: size * 1.2, rx: 10, fill: COL.chalk }, c);
    put(glow, { o: 0 });
    let slot = null;
    if (i > j) { slot = mk('rect', { x: -cw / 2 + 8, y: -size * .82, width: cw - 16, height: size * 1.04, rx: 8, fill: 'none', stroke: COL.faint, 'stroke-width': 2, 'stroke-dasharray': '5 5' }, c); }
    const holder = G(c, {});
    if (i <= j) M(holder, [i === j ? '1' : '0'], { size, fill: i === j ? COL.chalk : COL.dim, anchor: 'middle' });
    return { c, glow, slot, holder, v: i === j ? 1 : i < j ? 0 : null };
  }));
  const setCell = (i, j, v) => {
    const cl = cells[i][j];
    if (i <= j || cl.v === v) return;
    cl.v = v;
    cl.holder.replaceChildren();
    cl.slot.setAttribute('stroke-opacity', v === null ? 1 : 0);
    if (v !== null) M(cl.holder, parts(v), { size, fill: COL.chalk, anchor: 'middle' });
  };
  const flash = (i, j, at) => { tw(cells[i][j].glow, { o: .3 }, at, .25); tw(cells[i][j].glow, { o: 0 }, at + 1.1, .6); };
  let following = false;
  el.onL((i, j, l) => { if (following) setCell(i, j, l); });
  const api = {
    g, cells, cx, ry, nameG, W,
    get v() { return cells.map(r => r.map(c => c.v)); },
    put(i, j, v, at) { prog(q => { if (q > 0) setCell(i, j, v); }, at, 0, lin); if (v !== null) flash(i, j, at); },
    // el.step, then the multiplier flies from its box into L: { fly } is the flight's length, { lag } its start after the step
    step(i, j, l, at, dur = 1.8, { fly = 1, lag = .2, ...opts } = {}) {
      const end = el.step(i, j, l, at, dur, opts), lab = el.op_.lab, f0 = end + lag;
      const fg = G(g, { o: 0 });
      M(fg, parts(l), { size: 36, fill: COL.chalk, anchor: 'middle' });
      let from = null;
      prog(q => {
        if (!from) { const w = +lab.mbox.getAttribute('width') || 38; from = [st(lab.g).x + st(lab.mult).x + (w - 18) / 2, st(lab.g).y]; }
        put(fg, { x: from[0] + (cx(j) - from[0]) * q, y: from[1] + (ry(i) - from[1]) * q, s: 1 + (size / 36 - 1) * q });
      }, f0, fly, io);
      tw(fg, { o: 1 }, f0, .15);
      tw(fg, { o: 0 }, f0 + fly, 0);
      api.put(i, j, l, f0 + fly);
      return f0 + fly;
    },
    tri(at, { color = COL.chalk, dur = .6 } = {}) {
      const L = j => cx(j) - cw / 2 + 2, R = j => cx(j) + cw / 2 - 2, mid = i => ry(i) - size * .32, T_ = i => mid(i) - rh / 2 + 3, B_ = i => mid(i) + rh / 2 - 3;
      let d = `M${L(0)} ${T_(0)}H${R(0)}`;
      for (let i = 0; i < n - 1; i++) d += `V${B_(i)}H${R(i + 1)}`;
      d += `V${B_(n - 1)}H${L(0)}Z`;
      const e = path(g, d, { fill: color, 'fill-opacity': .12, stroke: color, 'stroke-opacity': .75, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, { o: 0 });
      g.insertBefore(e, g.firstChild);
      show(e, at, dur);
      return e;
    },
    ring(i, j, at, { color = COL.chalk, dash = false } = {}) {
      const rg = G(g, { x: cx(j), y: ry(i) - size * .32, o: 0 });
      mk('ellipse', { rx: cw * .46, ry: size * .62, fill: 'none', stroke: color, 'stroke-width': 3.5, ...(dash ? { 'stroke-dasharray': '7 6' } : {}) }, rg);
      show(rg, at, .35);
      return rg;
    },
    flash,
    follow(on) { following = on; const c = el.op_; if (on && c) setCell(c.i, c.j, el.l); },
    clear() { I.forEach(i => I.forEach(j => { if (i > j) setCell(i, j, null); })); },
  };
  return api;
}

// A question on the multiplier: the reader scrubs it (and, with only, some of the system's numbers) until test holds.
const elTask = (el, test, why, hint, reveal, { only = [] } = {}) => (body, api) => {
  el.live(true, { only });
  return {
    check: () => { const v = el.v, ok = test(v, el.l); api.grade(ok, ok ? why : typeof hint === 'function' ? hint(v, el.l) : hint); },
    reveal: () => { reveal?.(); return why; },
    lock: () => el.live(false),
    hint: ['drag the boxed number sideways, or ', kbd('Tab'), ' to it and ', kbd('↑'), kbd('↓')],
  };
};
