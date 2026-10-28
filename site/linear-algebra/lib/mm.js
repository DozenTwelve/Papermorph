// Matrix times matrix: A B = AB on one line, every number of A and B scrubbable, the product computed live, and the
// working under it in the way the beat explains: column by column (A times each column of B), entry by entry (row i of
// A times column j of B, multiplied number by number and added), row by row (each row of A mixes the rows of B), and as
// a sum of column-times-row pieces. The sizes stand under each matrix ("2 × 3"); when the inner sizes differ the product
// is refused in red. A grid2 picture can be linked: its x is one column of B, its Ax the same column of AB.
//
//   const P = mm(p, { A: [[2, 1], [1, 3]], B: [[1, 2], [1, -1]], at: [70, 300] });
//   P.show('cols', 0, at, { times })        // column 1 of B and of AB lit; under them 1·[2;1] + 1·[1;3] = [2;1] + [1;3] = [3;4]
//   P.show('entry', [1, 0], at, { times })  // row 2 of A, column 1 of B, entry (2, 1) of AB lit; 1·1 + 3·1 = 1 + 3 = 4
//   P.show('rows', 0, at) · P.show('outer', 1, at) · P.show('sum', null, at) · P.show(null, null, at)
//   P.to({ b01: 3 }, at, dur)               // beat clock: numbers (and sizes mA nA nB pB) move, the product follows
//   P.reveal({ col: 0 }, at)                // with hideC: true the product shows ? until revealed ('all', {col}, {row}, {cell: [i, j]})
//   P.link(g, { col: 0 })                   // a grid2 made with x: A and column `col` of B drive it, its drags drive them
//                                           (Ax and the dots follow reveal(): the picture never shows what AB still hides;
//                                           a legend under the plane says which column of B and of AB x and Ax are)
//   P.live(true, { only: ['b01', 'b11'], sizes: false })   // hands on; mmTask is the question type; playAsk works
//
// Keys: a<i><j>, b<i><j> (rows and columns from 0), the sizes mA × nA and nB × pB (1 … 3). Loads after engine.js.
const MM_ROW = [COL.whole, COL.nat, COL.int], MM_COL = [COL.irr, COL.real, COL.rat];

// exact numbers at rest, one decimal while they move
const mmParts = v => { const r = Math.round(v); return [num(Math.abs(v - r) < 1e-9 ? r : Math.round(v * 10) / 10)]; };
const mmKey = ps => ps.join('');
// a factor in a product: negatives in brackets, as chapter 9 writes them
const mmFac = v => v < -1e-9 ? ['(', ...mmParts(v), ')'] : mmParts(v);
// a sum of numbers as it is read: 6 − 2 + 0
const mmSum = vs => vs.flatMap((v, k) => k === 0 ? mmParts(v) : [v < -1e-9 ? ' − ' : ' + ', ...mmParts(Math.abs(v))]);

// A small matrix in brackets inside a group, its middle at ymid; fill(i, j) colours each number. Returns the width.
function mmSmall(g, rows, x, ymid, { size = 30, fill = () => COL.chalk, cw = null, rhk = 1.22 } = {}) {
  const n = rows.length, m = rows[0].length, rh = size * rhk;
  const w0 = Math.max(...rows.flat().map(v => mmKey(mmParts(v)).length));
  const c = cw || size * (.55 * w0 + .75), W = m * c + 20;
  const top = ymid - n * rh / 2 - 2, bot = ymid + n * rh / 2 + 2;
  path(g, `M${x + 9} ${top}H${x}V${bot}H${x + 9}M${x + W - 9} ${top}H${x + W}V${bot}H${x + W - 9}`, { stroke: COL.chalk, 'stroke-width': 2.5, fill: 'none' });
  rows.forEach((r, i) => r.forEach((v, j) => M(g, mmParts(v), { x: x + 10 + c * (j + .5), y: ymid - n * rh / 2 + (i + .5) * rh + size * .36, size, fill: fill(i, j), anchor: 'middle' })));
  return W;
}

// The same as an HTML element, for prompts and grids.
function mmEl(rows, { size = 26, fill = () => 'currentColor' } = {}) {
  const n = rows.length, m = rows[0].length, cw = size * 1.7, rh = size * 1.3, w = cw * m + 16, hh = rh * n + size * .3;
  const svg = mk('svg', { class: 'm', viewBox: `0 0 ${w} ${hh}`, width: w, height: hh });
  svg.style.verticalAlign = 'middle';
  path(svg, `M12 2H3V${hh - 2}H12M${w - 12} 2H${w - 3}V${hh - 2}H${w - 12}`, { stroke: 'currentColor', 'stroke-width': 2.5, fill: 'none' });
  rows.forEach((r, i) => r.forEach((v, j) => T(svg, num(v), { x: 8 + cw * (j + .5), y: rh * (i + .5) + size * .5, size, fill: fill(i, j), font: MATH, anchor: 'middle' })));
  return svg;
}

function mm(p, { A, B, at: [x0, y0] = [70, 300], size = 40, cw = 62, cwC = null, rh = 60, gap = 44, names = ['A', 'B', 'AB'],
  tintA = null, tintB = null, hideC = false, fillC = COL.task, t0 = .1, work: wpos = null, wsize = 36, sizes = true, o = 0, range = 9 } = {}) {
  const svg = $('stage'), K3 = [0, 1, 2];
  const s = { mA: A.length, nA: A[0].length, nB: B.length, pB: B[0].length };
  K3.forEach(i => K3.forEach(j => { s[`a${i}${j}`] = A[i]?.[j] ?? 0; s[`b${i}${j}`] = B[i]?.[j] ?? 0; }));
  let plan = { ...s };
  const known = K3.map(() => K3.map(() => !hideC));
  const g = G(p, { o });
  show(g, t0 + .2);
  const cwc = cwC || cw * 1.2;
  const D = () => ({ mA: Math.round(s.mA), nA: Math.round(s.nA), nB: Math.round(s.nB), pB: Math.round(s.pB) });
  const prod = () => {
    const { mA, nA, nB, pB } = D();
    if (nA !== nB) return null;
    return [...Array(mA).keys()].map(i => [...Array(pB).keys()].map(j => [...Array(nA).keys()].reduce((t, k) => t + s[`a${i}${k}`] * s[`b${k}${j}`], 0)));
  };
  const tint = (t, i, j) => t === 'cols' ? MM_COL[j] : t === 'rows' ? MM_ROW[i] : COL.chalk;
  const hitOf = which => (i, j) => which === 'all' || which.col === j || which.row === i || (!!which.cell && which.cell[0] === i && which.cell[1] === j);

  /* ---------- hands on: each box takes its own drag and keys (boxes are rebuilt when a size changes) ---------- */
  const cells = [];   // every scrubbable box: { k, box }
  let live = false, allowed = null, sizesLive = false;
  const can = k => live && (k.length === 2 ? sizesLive : (!allowed || allowed.has(k)));
  const step = (k, v) => edit({ [k]: k.length === 2 ? Math.round(v) : Math.max(-range, Math.min(range, Math.round(v))) });
  function wire(box, k) {
    box.setAttribute('aria-label', k);
    cells.push({ k, box });
    let drag = null;
    box.addEventListener('pointerdown', e => {
      if (!can(k)) return;
      e.preventDefault(); drag = { x: e.clientX, from: Math.round(s[k]) }; box.setPointerCapture(e.pointerId);
      if (k.length === 3) follow(k);
    });
    box.addEventListener('pointermove', e => { if (!drag) return; const kx = svg.getScreenCTM().a; step(k, drag.from + Math.round((e.clientX - drag.x) / kx / (k.length === 2 ? 40 : 24))); });
    const end = () => { drag = null; };
    box.addEventListener('pointerup', end); box.addEventListener('lostpointercapture', end);
    box.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); box.blur(); P.keys?.(e); return; }
      if (!can(k)) return;
      const dd = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!dd) return;
      e.preventDefault(); e.stopPropagation();
      if (k.length === 3) follow(k);
      step(k, Math.round(s[k]) + dd);
      if (!box.isConnected) g.querySelector(`[aria-label="${k}"][tabindex]`)?.focus();   // a size change rebuilt the boxes
    });
  }
  function boxesLive() {
    cells.forEach(c => {
      const ok = can(c.k);
      c.box.style.cursor = ok ? 'ew-resize' : '';
      c.box.setAttribute('stroke', ok ? COL.faint : 'none');
      if (ok) c.box.setAttribute('tabindex', 0); else c.box.removeAttribute('tabindex');
    });
  }

  /* ---------- the three matrices (rebuilt when a size changes) ---------- */
  const body = G(g, {});
  let L = null, shape = '', innerOn = false, outerOn = false;
  function mat(key, rows, cols, x, c, tn, name) {
    const mg = G(body, {}), back = G(mg, {});
    const top = y0 - size * .95, bot = y0 + (rows - 1) * rh + size * .35, W = cols * c + 24;
    path(mg, `M${x + 13} ${top}H${x}V${bot}H${x + 13}M${x + W - 13} ${top}H${x + W}V${bot}H${x + W - 13}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
    const cx = j => x + 12 + c * (j + .5), ry = i => y0 + i * rh;
    const cs = [...Array(rows).keys()].map(i => [...Array(cols).keys()].map(j => {
      const cg = G(mg, { x: cx(j), y: ry(i) });
      const glow = mk('rect', { x: -c / 2 + 3, y: -size * .9, width: c - 6, height: size * 1.2, rx: 10, fill: COL.chalk }, cg);
      put(glow, { o: 0 });
      const holder = G(cg, {});
      holder.style.pointerEvents = 'none';
      if (key !== 'c') wire(mk('rect', { x: -c / 2 + 3, y: -size * .92, width: c - 6, height: size * 1.24, rx: 9, fill: 'transparent', 'stroke-dasharray': '4 6' }, cg), `${key}${i}${j}`);
      return { k: `${key}${i}${j}`, glow, holder, txt: null, fill: key === 'c' ? fillC : tint(tn, i, j) };
    }));
    M(mg, [name], { x: x + W / 2, y: top - 16, size: 28, fill: COL.dim, anchor: 'middle' });
    return { g: mg, back, x, W, top, bot, cx, ry, c, cs, rows, cols };
  }
  // the size under a matrix: "2 × 3", each number scrubbable when sizes are live. It lives in its matrix's group, so a
  // matrix hidden on the beat clock hides its size too.
  function sizeLab(m, kr, kc, rows, cols, yS) {
    const mid = m.x + m.W / 2, sg = G(m.g, {});
    if (!sizes) put(sg, { o: 0 });
    const part = (k, v, dx) => {
      const t = T(sg, String(v), { x: mid + dx, y: yS, size: 28, fill: COL.dim, font: MATH, anchor: 'middle', weight: 600 });
      t.style.pointerEvents = 'none';
      if (k) wire(mk('rect', { x: mid + dx - 20, y: yS - 26, width: 40, height: 34, rx: 8, fill: 'transparent', 'stroke-dasharray': '4 5' }, sg), k);
      return t;
    };
    part(kr, rows, -30); part(kc, cols, 30);
    T(sg, '×', { x: mid, y: yS, size: 26, fill: COL.dim, font: MATH, anchor: 'middle' });
    return { g: sg, y: yS, xr: mid - 30, xc: mid + 30 };
  }
  function layout() {
    const d = D(), sh = [d.mA, d.nA, d.nB, d.pB].join();
    if (sh === shape) return;
    shape = sh;
    body.replaceChildren(); cells.length = 0;
    const a = mat('a', d.mA, d.nA, x0, cw, tintA, names[0]);
    const b = mat('b', d.nB, d.pB, a.x + a.W + gap, cw, tintB, names[1]);
    const eqx = b.x + b.W + 40, cx0 = eqx + 40;
    const midY = y0 + (d.mA - 1) * rh / 2 + size * .3;   // level with the middle of A and AB (B may be taller)
    const ok = d.nA === d.nB;
    const c = ok ? mat('c', d.mA, d.pB, cx0, cwc, null, names[2]) : null;
    const eq = M(ok ? c.g : body, ['='], { x: eqx, y: midY, size: size * 1.1, fill: COL.chalk, anchor: 'middle' });   // comes with the product
    const yS = y0 + (Math.max(d.mA, d.nB) - 1) * rh + size * .35 + 42;
    const sa = sizeLab(a, 'mA', 'nA', d.mA, d.nA, yS), sb = sizeLab(b, 'nB', 'pB', d.nB, d.pB, yS);
    const sc = ok ? sizeLab(c, null, null, d.mA, d.pB, yS) : null;
    const sz = G(body, {});   // the "must match" join and the rings (the size labels themselves are in the matrices)
    if (!sizes) put(sz, { o: 0 });
    // the inner sizes joined under the matrices: they must match
    const yA = yS + 14, inner = G(sz, { o: innerOn || !ok ? 1 : 0 });
    path(inner, `M${sa.xc} ${yA}V${yA + 22}H${sb.xr}V${yA}`, { stroke: ok ? COL.good : COL.bad, 'stroke-width': 3, fill: 'none' });
    T(inner, ok ? 'must match' : `${d.nA} ≠ ${d.nB}`, { x: (sa.xc + sb.xr) / 2, y: yA + 52, size: 24, fill: ok ? COL.good : COL.bad, anchor: 'middle', weight: 600 });
    // the outer sizes give the size of the answer
    const outer = G(sz, { o: outerOn && ok ? 1 : 0 });
    if (ok) [sa.xr, sb.xc, sc.xr, sc.xc].forEach(x => mk('ellipse', { cx: x, cy: yS - 9, rx: 19, ry: 21, fill: 'none', stroke: COL.task, 'stroke-width': 2.5 }, outer));
    // the refusal where the product would be
    let no = null;
    if (!ok) {
      no = G(body, {});
      const top = y0 - size * .95, hh = Math.max(d.mA, d.nB) * rh + 10, bw = 420;
      mk('rect', { x: cx0, y: top, width: bw, height: hh, rx: 14, fill: COL.bad, 'fill-opacity': .1, stroke: COL.bad, 'stroke-width': 3, 'stroke-dasharray': '8 6' }, no);
      T(no, 'no product', { x: cx0 + bw / 2, y: top + hh / 2 - 4, size: 34, fill: COL.bad, anchor: 'middle', weight: 700 });
      T(no, `a row of ${names[0]} has ${d.nA}, a column of ${names[1]} has ${d.nB}`, { x: cx0 + bw / 2, y: top + hh / 2 + 32, size: 21, fill: COL.bad, anchor: 'middle', weight: 600 });
    }
    L = { a, b, c, eq, ok, sz, inner, outer, no, sa, sb, sc, right: ok ? c.x + c.W : cx0 + 420, bottom: yA + 66 };
    rebands();
    boxesLive();
  }

  /* ---------- lit rows, columns and entries ---------- */
  // Each show() lights its parts from its time until the next show(): a soft band behind the numbers.
  let lit = [];   // [{ m: 'a' | 'b' | 'c', kind: 'row' | 'col' | 'cell', i, j, e }]
  const bandRect = (m, kind, i, j) => {
    if (!m || (kind !== 'col' && i >= m.rows) || (kind !== 'row' && j >= m.cols)) return null;
    const h0 = size * 1.24;
    let x, y, w, hh;
    if (kind === 'row') { x = m.x + 4; y = m.ry(i) - size * .95; w = m.W - 8; hh = h0; }
    else if (kind === 'col') { x = m.cx(j) - m.c / 2 + 2; y = m.top + 2; w = m.c - 4; hh = m.bot - m.top - 4; }
    else { x = m.cx(j) - m.c / 2 + 2; y = m.ry(i) - size * .95; w = m.c - 4; hh = h0; }
    return mk('rect', { x: x - 3, y, width: w + 6, height: hh, rx: 12, fill: COL.chalk, 'fill-opacity': .13, stroke: COL.chalk, 'stroke-opacity': .6, 'stroke-width': 2.5 }, m.back);
  };
  function rebands() { lit.forEach(b => { b.e = bandRect(L[b.m], b.kind, b.i, b.j); }); }
  const partsOf = (mode, idx) => mode === 'cols' ? [['b', 'col', 0, idx], ['c', 'col', 0, idx]]
    : mode === 'entry' ? [['a', 'row', idx[0], 0], ['b', 'col', 0, idx[1]], ['c', 'cell', idx[0], idx[1]]]
    : mode === 'rows' ? [['a', 'row', idx, 0], ['c', 'row', idx, 0]]
    : mode === 'outer' ? [['a', 'col', 0, idx], ['b', 'row', idx, 0]] : [];
  const setLit = (mode, idx) => {
    lit.forEach(b => b.e?.remove());
    lit = partsOf(mode, idx).map(([m, kind, i, j]) => ({ m, kind, i, j }));
    rebands();
  };

  /* ---------- the working ---------- */
  const W = G(g, {});
  let wMode = null, wIdx = null, wN = 99, wKey = '';
  const wx = () => wpos ? wpos[0] : x0, wy = () => wpos ? wpos[1] : L.bottom + 104;
  function drawWork() {
    const C = prod();
    if (wMode === null || !C) { if (wKey) { W.replaceChildren(); wKey = ''; } return; }
    const d = D(), n = d.nA;
    const Arow = r => [...Array(n).keys()].map(k => s[`a${r}${k}`]), Bcol = j => [...Array(n).keys()].map(k => s[`b${k}${j}`]);
    const Brow = k => [...Array(d.pB).keys()].map(j => s[`b${k}${j}`]), Acol = k => [...Array(d.mA).keys()].map(i => s[`a${i}${k}`]);
    const kk = [wMode, JSON.stringify(wIdx), wN, shape, ...K3.flatMap(i => K3.flatMap(j => [s[`a${i}${j}`], s[`b${i}${j}`]])).map(v => mmKey(mmParts(v)))].join('|');
    if (kk === wKey) return;
    wKey = kk;
    W.replaceChildren();
    let y = wy(), x = wx();
    const fs = wsize;
    const txt = (st, str, fill = COL.chalk) => { if (st > wN) return; const e = M(W, [].concat(str), { x, y: y + fs * .36, size: fs, fill, anchor: 'start' }); x += (e._w || 20) + 10; };
    const sm = (st, rows, fill) => { if (st > wN) return; x += mmSmall(W, rows, x, y, { size: fs, fill }) + 10; };
    // a second line, under the first, for working too long for one (a row way at full size)
    const nl = st => { if (st > wN) return; y += fs * 1.75; x = wx() + fs * .8; };
    const tall = Math.max(wMode === 'rows' ? 1 : d.mA, 1);
    const cap = str => T(W, str, { x: wx(), y: y - Math.max(48, tall * fs * .55 + 30), size: 26, fill: COL.dim, weight: 600 });
    const col = v => v.map(q => [q]);
    const [nA, nB, nC] = names;
    if (wMode === 'cols') {
      const j = wIdx, xs = Bcol(j);
      cap(`column ${j + 1} of ${nC}  =  ${nA} times column ${j + 1} of ${nB}`);
      xs.forEach((v, k) => { if (k) txt(1, '+'); txt(1, [...mmFac(v), '·']); sm(1, col(Acol(k)), () => tint(tintA, 0, k)); });
      txt(2, '=');
      xs.forEach((v, k) => { if (k) txt(2, '+'); sm(2, col(Acol(k).map(a => a * v)), () => tint(tintA, 0, k)); });
      txt(3, '='); sm(3, col(C.map(r => r[j])), () => fillC);
    } else if (wMode === 'entry') {
      const [i, j] = wIdx, a = Arow(i), b = Bcol(j);
      cap(`entry (${i + 1}, ${j + 1}) of ${nC}  =  row ${i + 1} of ${nA}  times  column ${j + 1} of ${nB}`);
      txt(1, a.flatMap((v, k) => [...(k ? [' + '] : []), ...mmFac(v), '·', ...mmFac(b[k])]));
      txt(2, ['=', ' ', ...mmSum(a.map((v, k) => v * b[k]))]);
      txt(3, '='); txt(3, mmParts(C[i][j]), fillC);
    } else if (wMode === 'rows') {
      const i = wIdx, a = Arow(i);
      cap(`row ${i + 1} of ${nC}  =  row ${i + 1} of ${nA} times ${nB}: a mix of the rows of ${nB}`);
      a.forEach((v, k) => { if (k) txt(1, '+'); txt(1, [...mmFac(v), '·']); sm(1, [Brow(k)], () => tint(tintB, k, 0)); });
      if (fs > 30) nl(2);
      txt(2, '=');
      a.forEach((v, k) => { if (k) txt(2, '+'); sm(2, [Brow(k).map(b => b * v)], () => tint(tintB, k, 0)); });
      txt(3, '='); sm(3, [C[i]], () => fillC);
    } else if (wMode === 'outer') {
      const k = wIdx;
      cap(`column ${k + 1} of ${nA}  times  row ${k + 1} of ${nB}: a whole matrix`);
      sm(1, col(Acol(k)), () => tint(tintA, 0, k)); sm(1, [Brow(k)], () => tint(tintB, k, 0));
      txt(2, '='); sm(2, Acol(k).map(a => Brow(k).map(b => a * b)), () => COL.chalk);
    } else if (wMode === 'sum') {
      cap(`${nC}  =  (column 1)(row 1) + (column 2)(row 2)${n > 2 ? ' + (column 3)(row 3)' : ''}`);
      [...Array(n).keys()].forEach(k => { if (k) txt(1, '+'); sm(1, Acol(k).map(a => Brow(k).map(b => a * b)), () => COL.chalk); });
      txt(2, '='); sm(2, C, () => fillC);
    }
  }

  // Light the parts that the way uses and write its working, from `at` until the next show; times: [t1, t2, t3] brings
  // in the working's pieces one at a time (the terms, the products, the answer; for 'outer' and 'sum' two pieces).
  // The latest show by time wins, so seeking and playing give the same frame.
  let bandStamp = -1, workStamp = -1;
  function showWay(mode, idx, at, { times = null, dur = .35 } = {}) {
    const t1 = times ? times[0] : at;
    const ev = (t, f) => prog(q => { if (q > 0 && t >= workStamp) { workStamp = t; f(); } }, t, 0, lin);
    prog(q => { if (q > 0 && at >= bandStamp) { bandStamp = at; setLit(mode, idx); lit.forEach(b => b.e && put(b.e, { o: 0 })); } }, at, 0, lin);
    prog(q => { if (bandStamp === at) lit.forEach(b => b.e && put(b.e, { o: q })); }, at, dur, lin);
    ev(t1, () => { wMode = mode; wIdx = idx; wN = times ? 1 : 99; wKey = ''; drawWork(); });
    if (times) times.slice(1).forEach((t, k) => ev(t, () => { wN = k + 2; wKey = ''; drawWork(); }));
  }

  /* ---------- a linked grid2: A moves the plane, x is a column of B, Ax that column of AB ---------- */
  let pic = null, picCol = 0, quiet = false, picStamp = -1;
  // cols: x is column picCol of B (the plane's matrix is A). rows: x is row picCol of A (the plane's matrix has the rows
  // of B as its columns), Ax is that row of AB.
  const fits = () => { const d = D(); return d.nA === 2 && d.nB === 2 && (pic?.rows ? d.pB === 2 && picCol < d.mA : d.mA === 2 && picCol < d.pB); };
  function syncPic() {
    if (!pic || !fits()) return;
    quiet = true;
    const c = picCol;
    pic.g.set(pic.rows ? { a00: s.b00, a01: s.b10, a10: s.b01, a11: s.b11, x0: s[`a${c}0`], x1: s[`a${c}1`] }
      : { a00: s.a00, a01: s.a01, a10: s.a10, a11: s.a11, x0: s[`b0${c}`], x1: s[`b1${c}`] });
    quiet = false;
    // The picture never shows a number AB still hides: Ax (the arrow, its steps and its label) and the numbered dots
    // appear when their column (row) of AB is revealed. The dot of the column in the picture is Ax itself.
    const d = D(), n = pic.rows ? d.mA : d.pB;
    const shown = j => pic.rows ? known[j].slice(0, d.pB).every(Boolean) : known.slice(0, d.mA).every(r => r[j]);
    const axOn = shown(c);
    [pic.g.axArrow, pic.g.axDot, pic.g.axLab, ...pic.g.combo].forEach(e => { e.style.visibility = axOn ? '' : 'hidden'; });
    if (pic.dots) {
      const C = prod();
      pic.dots.forEach((dt, j) => {
        const on = j < n && j !== c && shown(j);
        dt.style.display = on ? '' : 'none';
        if (on) put(dt, pic.rows ? { x: pic.g.P.PX(C[j][0]), y: pic.g.P.PY(C[j][1]) } : { x: pic.g.P.PX(C[0][j]), y: pic.g.P.PY(C[1][j]) });
      });
    }
    // grid2 calls the ring x and the arrow Ax; say which column of B and of AB they are here
    if (pic.say) {
      const [nA, nB, nC] = names, what = pic.rows ? 'row' : 'column', of = pic.rows ? nA : nB;
      pic.say.textContent = `here x is ${what} ${c + 1} of ${of},  and Ax is ${what} ${c + 1} of ${nC}`;
    }
  }
  // a number the reader touches brings its column of B (or row of A) into the picture
  function follow(k) { if (pic && (pic.rows ? k[0] === 'a' : k[0] === 'b')) followCol(+(pic.rows ? k[1] : k[2])); }
  function followCol(j) { if (pic && j !== picCol) { picCol = j; syncPic(); } }

  /* ---------- numbers ---------- */
  const listeners = [];
  function draw() {
    layout();
    const C = prod();
    [L.a, L.b].forEach(m => m.cs.flat().forEach(cl => {
      const ps = mmParts(s[cl.k]), kk = mmKey(ps);
      if (kk === cl.txt) return;
      cl.txt = kk; cl.holder.replaceChildren();
      M(cl.holder, ps, { size, fill: cl.fill, anchor: 'middle' });
    }));
    if (L.c) L.c.cs.forEach((r, i) => r.forEach((cl, j) => {
      const ps = known[i][j] ? mmParts(C[i][j]) : ['?'], kk = mmKey(ps);
      if (kk === cl.txt) return;
      cl.txt = kk; cl.holder.replaceChildren();
      M(cl.holder, ps, { size, fill: known[i][j] ? cl.fill : COL.dim, anchor: 'middle' });
    }));
    drawWork();
    syncPic();
    listeners.forEach(f => f(s));
  }
  function edit(to) {
    let ch = false;
    for (const k in to) {
      const v = k.length === 2 ? Math.max(1, Math.min(3, to[k])) : to[k];
      if (s[k] !== v) { s[k] = v; ch = true; }
    }
    if (ch) draw();
  }

  draw();
  const api = {
    g, W, get L() { return L; }, get v() { return { ...s }; }, get plan() { return plan; },
    C: prod,
    set(vals) { edit(vals); },
    // Move numbers (and sizes) over dur seconds on the beat clock; the product, the working and the picture follow.
    // Sizes jump at the end of the move.
    to(next, at, dur = 1.4, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      const goal = { ...plan }, ks = Object.keys(next);
      prog(q => edit(Object.fromEntries(ks.map(k => [k, k.length === 2 ? (q < 1 ? from[k] : goal[k]) : from[k] + (goal[k] - from[k]) * q]))), at, dur, ease);
      return at + dur;
    },
    show: showWay,
    // the product's ? turn into numbers at `at`: 'all', { col: j }, { row: i } or { cell: [i, j] }
    reveal(which, at, { flash = true } = {}) {
      prog(q => { if (q > 0) api.uncover(which); }, at, 0, lin);
      if (flash) api.flash('c', which, at);
    },
    // the same at once (an answer shown inside a question)
    uncover(which) {
      const hit = hitOf(which);
      K3.forEach(i => K3.forEach(j => { if (hit(i, j)) known[i][j] = true; }));
      L.c?.cs.flat().forEach(cl => { cl.txt = null; });
      draw();
    },
    // a short glow behind numbers: m 'a' | 'b' | 'c', which as for reveal
    flash(m, which, at, { color = COL.chalk } = {}) {
      const hit = hitOf(which), env = t => t < .25 ? t / .25 : t < 1.1 ? 1 : t < 1.7 ? 1 - (t - 1.1) / .6 : 0;
      // the cells are looked up as the glow runs, so a flash still lands after a size change rebuilt them
      prog(q => L[m]?.cs.forEach((r, i) => r.forEach((cl, j) => {
        if (!hit(i, j)) return;
        cl.glow.setAttribute('fill', color);
        put(cl.glow, { o: .32 * env(q * 1.7) });
      })), at, 1.7, lin);
    },
    // the inner sizes joined ("must match"), and the outer sizes ringed (the size of the answer), from `at`
    inner(at, on = true) { prog(q => { if (q > 0) { innerOn = on; put(L.inner, { o: on || !L.ok ? 1 : 0 }); } }, at, 0, lin); },
    outer(at, on = true) { prog(q => { if (q > 0) { outerOn = on; put(L.outer, { o: on && L.ok ? 1 : 0 }); } }, at, 0, lin); },
    live(on, { only = null, sizes: sz = false } = {}) {
      live = on; allowed = on && only ? new Set(only) : null; sizesLive = on && sz;
      const bc = only?.find(k => k[0] === (pic?.rows ? 'a' : 'b'));
      if (bc) follow(bc);
      boxesLive();
      if (pic) {
        const what = [];
        const [ka, kx] = pic.rows ? ['b', 'a'] : ['a', 'b'];
        if (on && (!only || only.some(k => k[0] === ka))) what.push('cols');
        if (on && (!only || only.some(k => k[0] === kx))) what.push('x');
        pic.g.live(on && what.length > 0, what);
      }
    },
    onChange(f) { listeners.push(f); },
    // Link a grid2 (made with x) so that its matrix is A and its x is column `col` of B; with dots, every column of
    // AB is an amber dot labelled with its number. linkCol(j, at) moves x to another column on the beat clock.
    // With rows: true the plane shows the row way: its arrows are the rows of B, x is row `col` of A, Ax that row of AB.
    link(gr, { col = 0, dots = false, rows = false } = {}) {
      picCol = col;
      pic = { g: gr, dots: null, rows };
      const P2 = gr.P;
      // the legend sits with the ring x, so it is hidden whenever x is
      pic.say = T(gr.parts.x, '', { x: P2.cx, y: P2.PY(P2.y0) + 44, size: 24, fill: COL.dim, weight: 600, anchor: 'middle' });
      pic.say.style.pointerEvents = 'none';
      if (dots) {
        pic.dotsG = G(gr.P.g, {});
        pic.dotsG.style.pointerEvents = 'none';   // never over a handle
        pic.dots = K3.map(j => { const d0 = G(pic.dotsG, {}); mk('circle', { r: 9, fill: COL.task, stroke: COL.board, 'stroke-width': 2.5 }, d0); T(d0, `${j + 1}`, { x: 15, y: 24, size: 20, fill: COL.task, weight: 700, anchor: 'middle' }); return d0; });
      }
      gr.onChange(v => {
        if (quiet || !live || !fits()) return;
        const c = picCol;
        edit(pic.rows ? { b00: v.a00, b10: v.a01, b01: v.a10, b11: v.a11, [`a${c}0`]: v.x0, [`a${c}1`]: v.x1 }
          : { a00: v.a00, a01: v.a01, a10: v.a10, a11: v.a11, [`b0${c}`]: v.x0, [`b1${c}`]: v.x1 });
      });
      syncPic();
      return pic;
    },
    linkCol(j, at) { prog(q => { if (q > 0 && at >= picStamp) { picStamp = at; picCol = j; syncPic(); } }, at, 0, lin); },
    get col() { return picCol; },
  };
  return api;
}

// A question on the numbers (and sizes) of A B: the reader scrubs the keys in only until test(v, AB) holds.
const mmTask = (P_, test, why, hint, reveal, { only = null, sizes = false } = {}) => (body, api) => {
  P_.live(true, { only, sizes });
  return {
    check: () => { const v = P_.v, C = P_.C(), ok = !!C && test(v, C); api.grade(ok, ok ? why : typeof hint === 'function' ? hint(v, C) : hint); },
    reveal: () => { reveal?.(); return why; },
    lock: () => P_.live(false),
    hint: [kbd('Tab'), ' to a number, ', kbd('↑'), kbd('↓'), ' to change it, or drag it sideways'],
  };
};
