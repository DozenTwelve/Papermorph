// Inverses (chapters 26–28): matrices with exact fractions, a product checked entry by entry, and the Gauss–Jordan
// table [A | I], whose numbers change in place while each row operation runs (and, for 2 × 2, move a linked grid2).
// Loads after engine.js, math.js and grid2.js (it uses g2val, g2parts).
//
//   const m = ivMat(p, [[1, 3], [2, 7]], { x, y, size, name: 'A', fill: (i, j) => colour })   // .cells[i][j] (g2val), .set(rows), .w, .cx(j), .ry(i)
//   const pr = ivProd(p, L, R, { at: [x, y], names: ['A⁻¹', 'A', 'I'], work: [x, y] })     // L · R = C, C's entries hidden
//   pr.entry(i, j, at, dur)      row i of L and column j of R light up, the working "1·7 + 3·(−2) = 1" shows, C's entry appears
//   pr.all(at, gap)              every entry in turn; pr.fill(at) all of C at once
//
//   const t = gj(p, A, { at: [x, y], link: g })   // [A | I]; link: a grid2 whose A follows the left block (2 × 2)
//   t.sub(i, j, l, at, dur)      row i − l × row j, as a continuous change (rows count from 0); its label beside the row
//   t.div(i, k, at, dur)         row i ÷ k
//   t.ring(i, j, at, t1), t.flash(i, j, at), t.block(0 | 1, at, t1) (a band behind the left or right block), t.names([…], at)
//   t.done(at)                   hides the open label
// Hands on: t.open(i, j) opens "row i − ℓ × row j" at once with ℓ = 0; t.live(true) makes ℓ a number to drag sideways
// (or Tab to it, ↑/↓); t.v (the table's numbers c<i><j> and l), t.set, t.load(rows) work for playAsk; gjTask is the
// question type. Numbers are exact at rest (whole or fractions), one decimal while they move.
const IV_ROW = [COL.whole, COL.nat, COL.int], IV_COL = [COL.irr, COL.real, COL.rat];

const ivParts = v => typeof v === 'number' ? g2parts(v) : [].concat(v);   // a number, or math parts (letters)
function ivMat(p, rows, { x = 0, y = 0, size = 40, cw = size * 1.9, rh = size * 1.5, fill = () => COL.chalk, name = null, o = 1 } = {}) {
  const n = rows.length, m = rows[0].length, g = g2mid(G(p, { o }));
  const w = cw * m + 20, top = y - size * .95, bot = y + (n - 1) * rh + size * .45;
  path(g, `M${x + 12} ${top}H${x}V${bot}H${x + 12}M${x + w - 12} ${top}H${x + w}V${bot}H${x + w - 12}`, { stroke: COL.chalk, 'stroke-width': 2.5, fill: 'none' });
  const cx = j => x + 10 + cw * (j + .5), ry = i => y + i * rh;
  const cells = rows.map((r, i) => r.map((v, j) => { const c = g2val(g2mid(G(g, {})), { x: cx(j), y: ry(i), size, fill: fill(i, j) }); c.set(0, fill(i, j), ivParts(v)); return c; }));
  let lab = null;
  if (name) lab = M(g, [].concat(name), { x: x + w / 2, y: bot + size * .95, size: size * .75, fill: COL.dim, anchor: 'middle' });
  return { g, cells, w, cw, cx, ry, top, bot, x, y, n, m, lab, set(r2) { r2.forEach((r, i) => r.forEach((v, j) => cells[i][j].set(0, fill(i, j), ivParts(v)))); } };
}

const ivMul = (L, R) => L.map(r => R[0].map((_, j) => r.reduce((s, x, k) => s + x * R[k][j], 0)));
// a number inside a working line: negatives in brackets after a times sign
const ivPP = x => { const q = g2parts(x); return x < 0 ? ['(', ...q, ')'] : q; };

// C and works: a product of letters (C's entries as parts, works(i, j) the working line's parts); numbers by default.
function ivProd(p, L, R, { at: [x, y] = [90, 260], size = 40, names = ['A', 'B', 'AB'], gap = 34, work = null, workSize = 34, o = 1, C: C0 = null, works = null, cw = size * 1.9, cwC = cw } = {}) {
  const g = G(p, { o }), C = C0 || ivMul(L, R);
  const A = ivMat(g, L, { x, y, size, cw, name: names[0] });
  const B = ivMat(g, R, { x: x + A.w + gap, y, size, cw, name: names[1] });
  const ex = B.x + B.w + gap * .9;
  const midY = (A.top + A.bot) / 2 + size * .3;
  M(g, ['='], { x: ex, y: midY, size, anchor: 'middle' });
  const Cm = ivMat(g, C, { x: ex + gap * .9, y, size, cw: cwC, name: names[2] });
  Cm.cells.flat().forEach(c => put(c.g.parentNode, { o: 0 }));
  const [wx, wy] = work || [x, A.bot + size * 2.2];
  const band = (bx, by, bw, bh, c) => { const r = mk('rect', { x: bx, y: by, width: bw, height: bh, rx: 12, fill: c }, g); g.insertBefore(r, g.firstChild); put(r, { o: 0 }); return r; };
  const entry = (i, j, t, dur = 2.6) => {
    const rb = band(A.x + 4, A.ry(i) - size * .85, A.w - 8, size * 1.15, IV_ROW[i % 3]);
    const cb = band(B.cx(j) - B.cw / 2 + 4, B.top + 4, B.cw - 8, B.bot - B.top - 8, IV_COL[j % 3]);
    tw(rb, { o: .22 }, t, .3); tw(cb, { o: .22 }, t + .2, .3); tw(rb, { o: 0 }, t + dur, .4); tw(cb, { o: 0 }, t + dur, .4);
    // the working: the products first, "= result" a little later, when it is said (with C's entry)
    const tr = t + Math.max(.9, Math.min(dur * .6, dur - 1));
    if (works) {
      const wl = M(g, works(i, j), { x: wx, y: wy, size: workSize, anchor: 'start', o: 0 });
      show(wl, t + .3, .3); hide(wl, t + dur, .3);
    } else {
      const lhs = [];
      L[i].forEach((a, k) => { if (k) lhs.push(' + '); lhs.push(...(k ? ivPP(a) : g2parts(a)), '·', ...ivPP(R[k][j])); });   // 1·7 + (−1)·1
      const wl = M(g, lhs, { x: wx, y: wy, size: workSize, anchor: 'start', o: 0 });
      const wr = M(g, ['  =  ', ...g2parts(C[i][j])], { x: wx + wl._w, y: wy, size: workSize, anchor: 'start', o: 0 });
      show(wl, t + .3, .3); hide(wl, t + dur, .3); show(wr, tr, .3); hide(wr, t + dur, .3);
    }
    const ce = Cm.cells[i][j].g.parentNode, at = works ? t + .9 : tr;
    show(ce, at, .4); pulse(ce, at, 1);
  };
  return {
    g, A, B, C: Cm, prod: C, entry,
    all(t, step = 1.2, dur = 1.1) { let k = 0; C.forEach((r, i) => r.forEach((_, j) => entry(i, j, t + step * k++, dur))); },
    fill(t) { Cm.cells.flat().forEach(c => show(c.g.parentNode, t, .4)); },
  };
}

/* ---------- Gauss–Jordan: [A | I] → [I | A⁻¹] ---------- */
function gj(p, A, { at: [x0, y0] = [110, 300], size = 42, cw = size * 2.05, rh = size * 1.55, right = true, link = null, t0 = .1, labelX = null, names: nm = ['A', 'I'], o = 0 } = {}) {
  const n = A.length, mcols = right ? 2 * n : n, I = [...Array(n).keys()], J = [...Array(mcols).keys()], svg = $('stage');
  const key = (i, j) => `c${i}${j}`;
  const v = { l: 0 };
  I.forEach(i => J.forEach(j => { v[key(i, j)] = j < n ? A[i][j] : +(j - n === i); }));
  let plan = { ...v };
  const g = G(p, { o });
  show(g, t0 + .2);
  const cx = j => x0 + cw * (j + .5) + (j >= n ? 28 : 0), ry = i => y0 + i * rh;
  const W = cw * mcols + (right ? 28 : 0);
  const top = y0 - size * .95, bot = y0 + (n - 1) * rh + size * .45;
  path(g, `M${x0 - 6} ${top}H${x0 - 18}V${bot}H${x0 - 6}M${x0 + W + 6} ${top}H${x0 + W + 18}V${bot}H${x0 + W + 6}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
  const divider = right ? path(g, `M${x0 + cw * n + 14} ${top + 6}V${bot - 6}`, { stroke: COL.dim, 'stroke-width': 2.5, 'stroke-dasharray': '6 6', fill: 'none' }) : null;
  const bars = I.map(i => mk('rect', { x: x0 - 52, y: ry(i) - size * .7, width: 8, height: size * .8, rx: 4, fill: IV_ROW[i] }, g));
  const fillOf = j => j < n ? COL.chalk : COL.task;
  const cells = I.map(i => J.map(j => g2val(g2mid(G(g, {})), { x: cx(j), y: ry(i), size, fill: fillOf(j) })));
  const nameG = [G(g, {}), G(g, {})];
  const setNames = (ns) => ns.forEach((s, k) => { if (k && !right) return; nameG[k].replaceChildren(); M(nameG[k], [].concat(s), { x: k ? (cx(n) + cx(mcols - 1)) / 2 : (cx(0) + cx(n - 1)) / 2, y: top - 18, size: size * .7, fill: k ? COL.task : COL.dim, anchor: 'middle' }); });
  setNames(nm);
  const listeners = [];
  function draw() {
    I.forEach(i => J.forEach(j => cells[i][j].set(v[key(i, j)], fillOf(j))));
    if (link && n === 2) link.set({ a00: v.c00, a01: v.c01, a10: v.c10, a11: v.c11 });
    listeners.forEach(f => f(v));
  }
  function edit(to) { let ch = false; for (const k in to) if (v[k] !== to[k]) { v[k] = to[k]; ch = true; } if (ch) draw(); }
  draw();
  const rowOf = (s, i) => J.map(j => s[key(i, j)]);
  const withRow = (s, i, r) => ({ ...s, ...Object.fromEntries(J.map(j => [key(i, j), r[j]])) });
  const lerp = (a, b) => q => edit(Object.fromEntries(Object.keys(b).filter(k => k !== 'l').map(k => [k, a[k] + (b[k] - a[k]) * q])));

  /* labels beside the rows: "row 2 − 3 × row 1", "row 1 ÷ 2" */
  const lx = labelX ?? x0 + W + 50;
  let open = null;
  function label(i, words, t) {
    if (open && t !== null) hide(open, t - .05, .3);
    const lg = G(g, { o: 0 }); let x = lx;
    words.forEach(([s, c, box]) => {
      const holder = G(lg, {}), e = M(holder, [].concat(s), { x, y: ry(i), size: size * .78, fill: c, anchor: 'start' });
      const w = box ? Math.max(e._w, size * .9) : e._w;
      if (box) { const r = mk('rect', { x: x - 8, y: ry(i) - size * .78, width: w + 16, height: size * 1.02, rx: 8, fill: 'none', stroke: c, 'stroke-width': 2 }, lg); lg._box = r; lg._num = holder; lg._numX = x; lg._row = i; }
      x += w + size * .3 + (box ? 12 : 0);
    });
    if (t !== null) show(lg, t, .35);
    open = lg;
    return lg;
  }
  const rowW = (i, c = IV_ROW[i]) => [`row ${i + 1}`, c];
  function sub(i, j, l, t, dur = 1.8, { lead = .8 } = {}) {
    label(i, [rowW(i), ['−', COL.chalk], [g2parts(l), COL.chalk, true], ['×', COL.chalk], rowW(j)], t - lead);
    const from = { ...plan }, to = withRow(plan, i, rowOf(plan, i).map((x, c) => x - l * plan[key(j, c)]));
    plan = to;
    prog(lerp(from, to), t, dur);
    return to;
  }
  function div(i, k, t, dur = 1.6, { lead = .8 } = {}) {
    label(i, [rowW(i), ['÷', COL.chalk], [g2parts(k), COL.chalk, true]], t - lead);
    const from = { ...plan }, to = withRow(plan, i, rowOf(plan, i).map(x => x / k));
    plan = to;
    prog(lerp(from, to), t, dur);
    return to;
  }
  function ring(i, j, t, t1, { color = COL.chalk, dash = false } = {}) {
    const c = mk('circle', { cx: cx(j), cy: ry(i) - size * .32, r: size * .78, fill: 'none', stroke: color, 'stroke-width': 3, ...(dash ? { 'stroke-dasharray': '6 5' } : {}) }, g);
    put(c, { o: 0 }); show(c, t, .3); if (t1 !== undefined) hide(c, t1, .3);
    return c;
  }
  function flash(i, j, t) { const e = cells[i][j].g.parentNode; tw(e, { c_fill: COL.task }, t, .2); pulse(e, t, 1.2); }
  function block(k, t, t1, color = k ? COL.task : COL.chalk) {
    const bx = k ? cx(n) - cw / 2 : cx(0) - cw / 2, r = mk('rect', { x: bx - 4, y: top - 6, width: cw * n + 8, height: bot - top + 12, rx: 14, fill: color }, g);
    g.insertBefore(r, g.firstChild); put(r, { o: 0 }); tw(r, { o: .13 }, t, .4); if (t1 !== undefined) tw(r, { o: 0 }, t1, .4);
    return r;
  }

  /* hands on: one open operation whose multiplier the reader sets */
  let cur = null, live = false;
  const apply = () => { if (!cur) return; edit(withRow(v, cur.i, cur.base.map((x, c) => x - v.l * v[key(cur.j, c)]))); cur.lg._num.replaceChildren(); M(cur.lg._num, g2parts(v.l), { x: cur.lg._numX, y: ry(cur.lg._row), size: size * .78, fill: COL.chalk, anchor: 'start' }); };
  const RANGE = 9;
  function openNow(i, j) {
    if (open) put(open, { o: 0 });
    if (cur) cur.hit.remove();   // one live multiplier at a time
    v.l = 0;
    const lg = label(i, [rowW(i), ['−', COL.chalk], [['0'], COL.chalk, true], ['×', COL.chalk], rowW(j)], null);
    put(lg, { o: 1 });
    const hit = mk('rect', { x: lg._numX - 14, y: ry(i) - size * .95, width: 64, height: size * 1.35, rx: 8, fill: 'transparent' }, lg);
    hit.setAttribute('aria-label', 'multiplier');
    cur = { i, j, base: rowOf(v, i), lg, hit };
    let drag = null;
    hit.addEventListener('pointerdown', e => { if (!live) return; e.preventDefault(); drag = { x: e.clientX, from: v.l }; hit.setPointerCapture(e.pointerId); });
    hit.addEventListener('pointermove', e => { if (!drag) return; const k = svg.getScreenCTM().a; setL(drag.from + Math.round((e.clientX - drag.x) / k / 26)); });
    const end = () => { drag = null; };
    hit.addEventListener('pointerup', end); hit.addEventListener('lostpointercapture', end);
    hit.addEventListener('keydown', e => {
      if (!live) return;
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); hit.blur(); P.keys?.(e); return; }
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation(); setL(v.l + d);
    });
    liveNow();
    return cur;
  }
  const setL = l => { v.l = Math.max(-RANGE, Math.min(RANGE, l)); apply(); };
  function liveNow() {
    if (!cur) return;
    cur.hit.style.cursor = live ? 'ew-resize' : '';
    if (live) cur.hit.setAttribute('tabindex', 0); else cur.hit.removeAttribute('tabindex');
    cur.lg._box.setAttribute('stroke-dasharray', live ? '5 5' : '');
  }
  function commit() { if (cur) cur.hit.remove(); cur = null; v.l = 0; plan = { ...v }; }
  function load(rows) { commit(); const s = {}; I.forEach(i => J.forEach(j => { s[key(i, j)] = rows[i][j]; })); edit(s); plan = { ...v }; }

  return {
    g, v, n, cells, cx, ry, top, bot, W, bars, divider, nameG,
    get plan() { return plan; },
    sub, div, ring, flash, block, label,
    names(ns, t) {   // the old names keep their own timeline (a reveal set on them still runs) and fade at t; new ones take their place
      nameG.forEach((e, k) => { hide(e, t, .3); nameG[k] = G(g, { o: 0 }); show(nameG[k], t + .2, .4); });
      setNames(ns);
    },
    done(t) { if (open) hide(open, t, .3); },
    to(next, t, dur = 1.2) { const from = { ...plan }; plan = { ...plan, ...next }; prog(lerp(from, plan), t, dur); },
    open: openNow, commit, load,
    rows: () => I.map(i => rowOf(v, i)),
    live(on) { live = on; liveNow(); },
    // { l } alone moves the open operation's multiplier (and its row); with the table's numbers it restores a whole
    // state (playAsk's reset): the numbers as given, the multiplier as given, the open row's base worked back from them
    set(vals) {
      const { l, ...rest } = vals;
      if (!Object.keys(rest).length) { if (l !== undefined && cur) setL(l); return; }
      if (l !== undefined) v.l = l;
      edit(rest);
      if (cur) { cur.base = rowOf(v, cur.i).map((x, c) => x + v.l * v[key(cur.j, c)]); apply(); }
    },
    onChange(f) { listeners.push(f); },
  };
}

// A question on an open operation: the reader sets the multiplier until test(v) holds, then checks.
const gjTask = (t, test, why, hint, reveal) => (body, api) => {
  t.live(true);
  return {
    check: () => { const ok = test(t.v); api.grade(ok, ok ? why : (typeof hint === 'function' ? hint(t.v) : hint)); },
    reveal: () => { reveal?.(); return why; },
    lock: () => t.live(false),
    hint: [kbd('Tab'), 'pick the multiplier', kbd('↑'), kbd('↓'), 'change it, or drag it sideways'],
  };
};
