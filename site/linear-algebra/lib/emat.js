// Row exchanges on an elim table, and a matrix on the left (or right) of a system, shown as a product computed row by row.
//
//   elSwap(el, sys, 1, 2, at)          // (in elim.js since 10-28; el.swap does the same) rows of [A | b] slide past each other
//
// Loads after engine.js, elim.js (and linsys.js or space3.js).
const EM_ROW = [COL.whole, COL.nat, COL.int], EM_COL = [COL.irr, COL.real, COL.rat];

/* ---------- a matrix times [A | b], computed row by row ---------- */
// emat draws  E · [A | b] = [EA | Eb]  (side 'left') or  A · P = [AP | b]  (side 'right': A first, then P), in one line from `at`.
// The product is the system sys (a linsys or lin3) shows: change a number of E, or of A and b, and the product, the
// lines or planes and the working all follow. E's numbers are drawn here; [A | b] and the product are elim tables
// (read-only uses of elim.js), so their rings, flashes and working rows are elim's.
//
//   const em = emat(p, sys, { A, b, at: [70, 270] });   // E starts as the identity
//   em.to({ e10: -3 }, at, 2)                            // on the beat clock: row 2 of E becomes (−3, 1); the coral line turns
//   em.work(1, at)                                       // under [A | b]: −3 × row 1, 1 × row 2, a rule, their sum = row 2 of EA
//   em.ringE(1, 0, at)                                   // a circle round E's entry in row 2, column 1
//   em.live(true, { only: ['e10'] })                     // the reader scrubs E's entry (drag sideways, or Tab and ↑/↓)
//
// em.v and em.set work for playAsk; emTask is the question type. Keys: e<i><j> for E, a<i><j> and b<i> for A and b.
function emat(p, sys, { A, b, E = null, at: [x0, y0] = [70, 270], size = 40, cw = 70, ecw = 60, rh = 62, gap = 70, t0 = .1, dens = [1, 2], side = 'left', name = 'E', names = null, noB = false, step: eStep = 1, o = 0 } = {}) {
  const n = A.length, I = [...Array(n).keys()], svg = $('stage');
  const g = G(p, { o });
  show(g, t0 + .2);
  const st0 = {};
  I.forEach(i => { I.forEach(j => { st0[`e${i}${j}`] = E ? E[i][j] : +(i === j); st0[`a${i}${j}`] = A[i][j]; }); st0[`b${i}`] = b[i]; });
  const s = { ...st0 };
  let plan = { ...s };
  
  // exact numbers at rest (whole, or a fraction over dens), one decimal while they move
  const parts = v => {
    const r = Math.round(v);
    if (Math.abs(v - r) < 1e-9) return [num(r)];
    for (const d of dens) { const k = Math.round(v * d); if (d > 1 && Math.abs(v * d - k) < 1e-9) { const gg = gcd(Math.abs(k), d); return k < 0 ? ['−', F(Math.abs(k) / gg, d / gg)] : [F(k / gg, d / gg)]; } }
    return [num(Math.round(v * 10) / 10)];
  };
  const key = ps => ps.map(q => typeof q === 'string' ? q : q.f.join('/')).join('');

  /* ---------- E ---------- */
  // left: E, then [A | b]; right: A alone, then P (whose row bars are hidden: on the right P mixes columns)
  const right = side === 'right', BW = right || noB ? n * cw : n * cw + 24 + cw, EW0 = n * ecw;
  const bx = right ? x0 + 52 : x0 + 30 + EW0 + gap + 16;
  const ex = right ? bx + BW + gap : x0 + 30, ecx = j => ex + ecw * (j + .5), ry = i => y0 + i * rh;
  const top = y0 - size * .95, bot = y0 + (n - 1) * rh + size * .35, EW = n * ecw;
  const Eg = G(g, {});
  path(Eg, `M${ex - 2} ${top}H${ex - 14}V${bot}H${ex - 2}M${ex + EW + 2} ${top}H${ex + EW + 14}V${bot}H${ex + EW + 2}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
  const Ebars = I.map(i => mk('rect', { x: ex - 34, y: ry(i) - size * .7, width: 7, height: size * .8, rx: 3.5, fill: EM_ROW[i] }, Eg));
  if (right) Ebars.forEach(e => put(e, { o: 0 }));
  const Ename = G(Eg, {});
  const setName = nm => { Ename.replaceChildren(); M(Ename, [].concat(nm), { x: ex + EW / 2, y: top - 16, size: 28, fill: COL.dim, anchor: 'middle' }); };
  setName(name);
  const ecells = I.map(i => I.map(j => {
    const k = `e${i}${j}`, c = G(Eg, { x: ecx(j), y: ry(i) });
    const glow = mk('rect', { x: -ecw / 2 + 4, y: -size * .9, width: ecw - 8, height: size * 1.2, rx: 10, fill: COL.chalk }, c);
    put(glow, { o: 0 });
    const holder = G(c, {});
    holder.style.pointerEvents = 'none';
    const box = mk('rect', { x: -ecw / 2 + 3, y: -size * .92, width: ecw - 6, height: size * 1.24, rx: 9, fill: 'transparent', 'stroke-dasharray': '4 6' }, c);
    box.setAttribute('aria-label', k);
    return { k, c, glow, holder, box, txt: null };
  }));

  /* ---------- [A | b] (a bare system drawn by elim) and the product ---------- */
  const base = { v: {}, fs: [], set(to) { Object.assign(this.v, to); this.fs.forEach(f => f(this.v)); }, onChange(f) { this.fs.push(f); }, to() {}, solve: () => ({}), live() {} };
  I.forEach(i => { I.forEach(j => { base.v[`a${i}${j}`] = s[`a${i}${j}`]; }); base.v[`b${i}`] = s[`b${i}`]; });
  const B = elim(g, base, { at: [bx, y0], size, cw, rh, t0: -1, dens, noB: right || noB });
  const last = right ? ex + EW : bx + B.W, px = last + 120;
  const eqSign = M(g, ['='], { x: last + 42, y: y0 + (n - 1) * rh / 2 + 12, size: size * 1.1, fill: COL.chalk, anchor: 'middle' });
  const Pt = elim(g, sys, { at: [px, y0], size, cw, rh, t0: -1, dens, noB });
  const label = (el, a, bb) => { el.names.replaceChildren(); [[a, el.cx(0) + (el.cx(n - 1) - el.cx(0)) / 2], [bb, el.cx(n)]].forEach(([t, x]) => { if (t) M(el.names, [t], { x, y: top - 16, size: 28, fill: COL.dim, anchor: 'middle' }); }); };
  // names: [over A, over b, over the product's A part, over its b part]; noB hides the b columns (a matrix times a matrix)
  let nm = names || (side === 'right' ? ['A', '', 'AP', 'b'] : ['A', 'b', 'EA', 'Eb']);
  const relabel = to => { nm = to; label(B, nm[0], nm[1]); label(Pt, nm[2], nm[3]); workKey = ''; drawWork(); };
  label(B, nm[0], nm[1]); label(Pt, nm[2], nm[3]);
  put(B.names, { o: 1 }); put(Pt.names, { o: 1 });

  const prod = v => {
    const out = {};
    I.forEach(i => {
      I.forEach(j => { out[`a${i}${j}`] = side === 'left' ? I.reduce((t, k) => t + v[`e${i}${k}`] * v[`a${k}${j}`], 0) : I.reduce((t, k) => t + v[`a${i}${k}`] * v[`e${k}${j}`], 0); });
      out[`b${i}`] = side === 'left' ? I.reduce((t, k) => t + v[`e${i}${k}`] * v[`b${k}`], 0) : v[`b${i}`];
    });
    return out;
  };
  const listeners = [];
  let quiet = false;
  function draw() {
    ecells.flat().forEach(cl => {
      const ps = parts(s[cl.k]), kk = key(ps);
      if (kk === cl.txt) return;
      cl.txt = kk; cl.holder.replaceChildren();
      M(cl.holder, ps, { size, fill: COL.chalk, anchor: 'middle' });
    });
    const bv = {}; I.forEach(i => { I.forEach(j => { bv[`a${i}${j}`] = s[`a${i}${j}`]; }); bv[`b${i}`] = s[`b${i}`]; });
    base.set(bv);
    quiet = true; sys.set(prod(s)); quiet = false;
    drawWork();
    listeners.forEach(f => f(s));
  }
  const edit = to => { let ch = false; for (const k in to) if (s[k] !== to[k]) { s[k] = to[k]; ch = true; } if (ch) draw(); };

  /* ---------- the working: row i of the product as a sum of rows of A ---------- */
  const W = G(g, { o: 0 });
  let workRow = null, workKey = '', workN = 99;   // workN: how many lines of the working show (the rows, then the rule and the sum)
  function drawWork() {
    if (workRow === null || side !== 'left') return;
    const i = workRow, rows = I.map(k => [...I.map(j => s[`e${i}${k}`] * s[`a${k}${j}`]), s[`e${i}${k}`] * s[`b${k}`]]);
    const pr = prod(s), sum = [...I.map(j => pr[`a${i}${j}`]), pr[`b${i}`]];
    const kk = i + '|' + workN + '|' + rows.flat().concat(sum).map(v => key(parts(v))).join(',');
    if (kk === workKey) return;
    workKey = kk;
    W.replaceChildren();
    const y = r => y0 + (n + r) * rh + 6;
    rows.forEach((vals, k) => {
      if (k >= workN) return;
      const e = s[`e${i}${k}`], zero = Math.abs(e) < 1e-9, fill = zero ? COL.faint : COL.chalk;
      vals.forEach((v, j) => (j < n || !noB) && M(W, parts(v), { x: B.cx(j), y: y(k), size: size * .8, fill: j === n ? (zero ? COL.faint : COL.task) : fill, anchor: 'middle' }));
      M(W, [...parts(e), ' × '], { x: bx - 36, y: y(k), size: 28, fill: zero ? COL.faint : COL.chalk, anchor: 'end' });
      T(W, `row ${k + 1}`, { x: bx - 36, y: y(k) + 26, size: 18, fill: zero ? COL.faint : EM_ROW[k], weight: 700, anchor: 'end' });
    });
    if (workN <= n) return;
    path(W, `M${bx - 10} ${y(n - 1) + size * .45}H${bx + (noB ? n * cw : B.W)}`, { stroke: COL.chalk, 'stroke-width': 2.5 });
    sum.forEach((v, j) => (j < n || !noB) && M(W, parts(v), { x: B.cx(j), y: y(n) + 8, size: size * .85, fill: j === n ? COL.task : COL.chalk, anchor: 'middle' }));
    T(W, `row ${i + 1} of ${nm[2]}`, { x: bx - 36, y: y(n) + 4, size: 24, fill: EM_ROW[i], weight: 700, anchor: 'end' });
  }
  // Show the working for row i (null: hide it) at `at`; it stays live while the numbers move.
  // { times: [t1, …] } brings its lines in one at a time: the first row of A's share at t1, the next at t2, …, and
  // the rule with the sum at the last time (n + 1 times in all), so each piece shows when the voice names it.
  function work(i, at, { dur = .4, times = null } = {}) {
    prog(q => { if (q > 0 && i !== null && (workRow !== i || times)) { workRow = i; workN = times ? 1 : 99; workKey = ''; drawWork(); } }, times ? times[0] : at, 0, lin);
    if (times) times.slice(1).forEach((t, k) => prog(q => { if (q > 0) { workN = k + 2; drawWork(); } }, t, 0, lin));
    if (i === null) hide(W, at, dur); else { put(W, { o: 0 }); show(W, times ? times[0] : at, dur); }
  }

  /* ---------- hands on ---------- */
  let live = false, allowed = null;
  const can = k => live && (!allowed || allowed.has(k));
  ecells.flat().forEach(cl => {
    let drag = null;
    const set1 = v => edit({ [cl.k]: Math.max(-9, Math.min(9, Math.round(v / eStep) * eStep)) });
    cl.box.addEventListener('pointerdown', e => { if (!can(cl.k)) return; e.preventDefault(); drag = { x: e.clientX, from: s[cl.k] }; cl.box.setPointerCapture(e.pointerId); });
    cl.box.addEventListener('pointermove', e => { if (!drag) return; const k = svg.getScreenCTM().a; set1(drag.from + Math.round((e.clientX - drag.x) / k / 24) * eStep); });
    const end = () => { drag = null; };
    cl.box.addEventListener('pointerup', end);
    cl.box.addEventListener('lostpointercapture', end);
    cl.box.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cl.box.blur(); P.keys?.(e); return; }
      if (!can(cl.k)) return;
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      set1(s[cl.k] + d * eStep);
    });
  });
  // [A | b] scrubs like elim's cells (whole steps); the base table's own boxes take the pointer.
  B.cells.flat().forEach(cl => {
    let drag = null;
    const R = () => cl.k[0] === 'b' ? 30 : 9, set1 = v => edit({ [cl.k]: Math.max(-R(), Math.min(R(), Math.round(v))) });
    cl.box.addEventListener('pointerdown', e => { if (!can(cl.k)) return; e.preventDefault(); drag = { x: e.clientX, from: s[cl.k] }; cl.box.setPointerCapture(e.pointerId); });
    cl.box.addEventListener('pointermove', e => { if (!drag) return; const k = svg.getScreenCTM().a; set1(drag.from + Math.round((e.clientX - drag.x) / k / 22)); });
    const end = () => { drag = null; };
    cl.box.addEventListener('pointerup', end);
    cl.box.addEventListener('lostpointercapture', end);
    cl.box.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cl.box.blur(); P.keys?.(e); return; }
      if (!can(cl.k)) return;
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      set1(s[cl.k] + d);
    });
  });
  const boxesLive = () => [...ecells.flat(), ...B.cells.flat()].forEach(cl => {
    const ok = can(cl.k) && !((side === 'right' || noB) && cl.k[0] === 'b');
    cl.box.style.cursor = ok ? 'ew-resize' : '';
    cl.box.setAttribute('stroke', ok ? COL.faint : 'none');
    if (ok) cl.box.setAttribute('tabindex', 0); else cl.box.removeAttribute('tabindex');
  });
  // A line or plane dragged in the picture changes the product; [A | b] follows (undone by E), when E can be undone.
  const inv = M_ => {
    if (n === 2) { const d = M_[0][0] * M_[1][1] - M_[0][1] * M_[1][0]; return Math.abs(d) < 1e-9 ? null : [[M_[1][1] / d, -M_[0][1] / d], [-M_[1][0] / d, M_[0][0] / d]]; }
    const d = S3_det(M_);
    if (Math.abs(d) < 1e-9) return null;
    const c = (i, j) => { const r = I.filter(x => x !== i), k = I.filter(x => x !== j); return ((i + j) % 2 ? -1 : 1) * (M_[r[0]][k[0]] * M_[r[1]][k[1]] - M_[r[0]][k[1]] * M_[r[1]][k[0]]); };
    return I.map(i => I.map(j => c(j, i) / d));
  };
  sys.onChange(v => {
    if (quiet || !live) return;
    const Ei = inv(I.map(i => I.map(j => s[`e${i}${j}`])));
    if (!Ei) { quiet = true; sys.set(prod(s)); quiet = false; return; }
    const next = {};
    if (side === 'left') I.forEach(i => { I.forEach(j => { next[`a${i}${j}`] = I.reduce((t, k) => t + Ei[i][k] * v[`a${k}${j}`], 0); }); next[`b${i}`] = I.reduce((t, k) => t + Ei[i][k] * v[`b${k}`], 0); });
    else I.forEach(i => { I.forEach(j => { next[`a${i}${j}`] = I.reduce((t, k) => t + v[`a${i}${k}`] * Ei[k][j], 0); }); next[`b${i}`] = v[`b${i}`]; });
    for (const k in next) next[k] = Math.round(next[k] * 1e6) / 1e6;
    Object.assign(s, next);
    quiet = true; draw(); quiet = false;
  });

  draw();
  const api = {
    g, n, side, Eg, ecells, Ebars, B, Pt, eqSign, W, ecx, ry, bx, px, setName, names: relabel,
    get plan() { return plan; },
    // Move numbers of E (e..) and of [A | b] (a.., b..) over dur seconds on the beat clock; product and picture follow.
    to(next, at, dur = 1.4, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      const goal = { ...plan }, ks = Object.keys(next);
      prog(q => edit(Object.fromEntries(ks.map(k => [k, from[k] + (goal[k] - from[k]) * q]))), at, dur, ease);
      return at + dur;
    },
    work,
    flashE(i, at, j = null) { ecells[i].forEach((cl, c) => { if (j === null || j === c) { tw(cl.glow, { o: .3 }, at, .25); tw(cl.glow, { o: 0 }, at + 1.1, .6); } }); },
    ringE(i, j, at, { color = COL.chalk, dash = false } = {}) {
      const rg = G(Eg, { x: ecx(j), y: ry(i) - size * .32, o: 0 });
      mk('ellipse', { rx: ecw * .46, ry: size * .62, fill: 'none', stroke: color, 'stroke-width': 3.5, ...(dash ? { 'stroke-dasharray': '7 6' } : {}) }, rg);
      show(rg, at, .35);
      return rg;
    },
    // Dim all of E but row i (null: all rows back).
    focusE(i, at, dur = .4) { I.forEach(r => [Ebars[r], ...ecells[r].map(c => c.c)].forEach(e => tw(e, { o: i === null || i === r ? 1 : .3 }, at, dur))); },
    get v() { return { ...s }; },
    set(vals) { edit(vals); },
    live(on, { only = null } = {}) {
      live = on;
      allowed = on && only ? new Set(only) : null;
      boxesLive();
      // the picture can be dragged only when every number of [A | b] is free
      if (sys.lock) { sys.lock(on && !only ? null : []); sys.live(on); } else sys.live(on && !only, {});
    },
    onChange(f) { listeners.push(f); },
    prod: () => prod(s),
  };
  return api;
}

// A question on E (or on [A | b]): the reader scrubs the numbers named in only until test(v, product) holds.
const emTask = (em, test, why, hint, reveal, { only = null } = {}) => (body, api) => {
  em.live(true, { only });
  return {
    check: () => { const v = em.v, pr = em.prod(), ok = test(v, pr); api.grade(ok, ok ? why : typeof hint === 'function' ? hint(v, pr) : hint); },
    reveal: () => { reveal?.(); return why; },
    lock: () => em.live(false),
    hint: [kbd('Tab'), ' to a number of the matrix, ', kbd('↑'), kbd('↓'), ' to change it, or drag it sideways'],
  };
};

// Swap rows i and j of E on the beat clock (a row exchange done by a matrix): E's rows and, on the left, the product's
// rows slide past each other while the product's row colours (and a linsys's lines) trade; then E takes the swapped
// rows. { cols: true } swaps E's columns instead; on the right (side 'right') the product's columns slide past each
// other, and the picture jumps to the swapped system at the end. sys: the linsys whose line colours should trade.
// { base: true } swaps rows i and j of [A | b] instead (E stays): its rows and the product's slide, as when the answer
// PA is put back in to be multiplied again.
function emSwap(em, i, j, at, dur = 1.4, { cols = false, sys = null, base = false } = {}) {
  const n = em.n, I = [...Array(n).keys()], E = em.plan, next = {};
  if (base) {
    const ks = r => [...I.map(c => `a${r}${c}`), `b${r}`];
    ks(i).forEach((k, c) => { next[k] = E[ks(j)[c]]; next[ks(j)[c]] = E[k]; });
  } else I.forEach(r => I.forEach(c => {
    const [r2, c2] = cols ? [r, c === i ? j : c === j ? i : c] : [r === i ? j : r === j ? i : r, c];
    next[`e${r}${c}`] = E[`e${r2}${c2}`];
  }));
  const Pt = em.Pt, rowsMove = !cols, lines = !cols && sys?.lines?.[0]?.l ? sys.lines.map(l => l.l) : [];
  const right = em.side === 'right';
  prog(q => {
    const s = q < 1 ? q : 0, c = (a, b) => q < 1 ? mix(a, b, q) : a;
    if (rowsMove) {
      const dy = em.ry(j) - em.ry(i), moving = base ? em.B.cells : em.ecells;
      moving[i].forEach(cl => put(cl.c, { y: em.ry(i) + dy * s })); moving[j].forEach(cl => put(cl.c, { y: em.ry(j) - dy * s }));
      if (!right) {
        Pt.cells[i].forEach(cl => put(cl.c, { y: Pt.ry(i) + dy * s })); Pt.cells[j].forEach(cl => put(cl.c, { y: Pt.ry(j) - dy * s }));
        Pt.bars[i].setAttribute('fill', c(EM_ROW[i], EM_ROW[j])); Pt.bars[j].setAttribute('fill', c(EM_ROW[j], EM_ROW[i]));
        if (lines[i] && lines[j]) { lines[i].setAttribute('stroke', c(EM_ROW[i], EM_ROW[j])); lines[j].setAttribute('stroke', c(EM_ROW[j], EM_ROW[i])); }
      }
    } else {
      const dx = em.ecx(j) - em.ecx(i), px = Pt.cx(j) - Pt.cx(i);
      I.forEach(r => {
        put(em.ecells[r][i].c, { x: em.ecx(i) + dx * s }); put(em.ecells[r][j].c, { x: em.ecx(j) - dx * s });
        if (right) { put(Pt.cells[r][i].c, { x: Pt.cx(i) + px * s }); put(Pt.cells[r][j].c, { x: Pt.cx(j) - px * s }); }
      });
    }
  }, at, dur);
  em.to(next, at + dur, 0);
  return next;
}
