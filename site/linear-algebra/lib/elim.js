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
//   el.opNow(2, 1)                               // inside a question: open "row 3 − ℓ × row 2" at once
//
// While elim is attached, move the system through el.to(next, at, dur) (or el.step, el.mult): elim keeps the plan
// that the next step starts from. Hands on: el.scrub(true) makes the open operation's multiplier a number to drag
// sideways (or Tab to it and press ↑/↓); el.v, el.set and el.live make it a component for playAsk; elTask is the
// question type ("find the multiplier that makes it flat").
// Loads after engine.js (and linsys.js or space3.js).
const EL_ROW = [COL.whole, COL.nat, COL.int];

function elim(p, sys, { at: [x0, y0] = [130, 450], size = 46, cw = 96, rh = 70, t0 = .1, dens = [1], step: lStep = 1, o = 0, labelX = null } = {}) {
  const n = 'a22' in sys.v ? 3 : 2, I = [...Array(n).keys()], svg = $('stage');
  const keysOf = i => [...I.map(j => `a${i}${j}`), `b${i}`];
  const g = G(p, { o });
  show(g, t0 + .2);
  const W = n * cw + 24 + cw;   // A, the divider, b
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
  T(names, 'b', { x: cx(n), y: top - 16, size: 28, fill: COL.dim, font: MATH, weight: 700, anchor: 'middle' });
  put(names, { o: 0 });

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
      const mx = w1 + 14 + w2 + 16;
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
  }

  /* ---------- hands on: the multiplier as a number to drag ---------- */
  let live = false, scrubOn = false, lNow = 0, bound = false;
  const RANGE = 9;
  // The reader's state: the system's numbers and the multiplier. Row i of the open operation is always
  // base − l × row j; base follows whatever the reader changes in the system itself.
  let base = null, quiet = false;
  const apply = () => { quiet = true; sys.set(minus(base, cur.i, cur.j, lNow, sys.v)); quiet = false; cur.lab.lay(lNow); };
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
  return {
    g, n, cells, rowG, bars, names, divider, W, cx, ry, size, rh,
    get plan() { return plan; },
    get l() { return lNow; },
    get op_() { return cur; },
    op, opNow, mult, step, ring, line, rule, flash, focus, to, load,
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
  };
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
