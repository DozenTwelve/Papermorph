// Named 2D vectors drawn two ways from one state: columns of numbers in brackets, and arrows in the plane.
// Every number on screen is the same value: scrub one (drag sideways, or focus it and press ↑/↓) and its arrow moves;
// drag an arrow's tip and its numbers follow. Two scalars c and d make the combination c·v + d·w, drawn tip to tail:
// 'cv' from the origin, 'dw' from the tip of 'cv', and 'sum' from the origin to where they end. With solve mode on,
// dragging the tip of 'sum' (or scrubbing its numbers) finds c and d.
// The beat moves it with vs.to(); a question turns the reader's hands on with vs.live(true).
// Loads after engine.js and math.js (it uses plane() and mathW()); linsys.js is not needed.
//
//   const vs = vecs(p, { vecs: { v: [2, −1], w: [−1, 2] }, c: 1, d: 2, show: ['cv', 'dw', 'sum'], plane: { cx, cy, u, step },
//                        snap: 1 | .5, steps: { c: .5 }, range: { c: [−5, 5] }, labelSize, hidePlane,
//                        extra: { k: 0 }  more numbers in the state (scrubbable in rows, moved by to()),  colors: { sum: COL.chalk },
//                        onto: (name, q, inBox) => [X, Y]  where a dragged tip of a named vector lands (default inBox(q): the grid),
//                        fix: (v, changedKeys) => {}  run after every change, to put the state back in order (a point kept on a line) })
//   state vs.v = { v0, v1, w0, w1, c, d };  arrows vs.A[id] (id: each name, 'cv', 'dw', 'dw0', 'cv1', 'sum') with .g .path .lab
//   vs.row(items, { x, y, size, o })   the algebra, live (see row below);  vs.to(next, t0, dur);  vs.set(next);  vs.onChange(f)
//   vs.show / hide / dim(ids, t0);  vs.legs(ids, t0, on);  vs.label(id, parts | v => parts, 'tip' | 'mid', [dx, dy]);  vs.lattice(t0)
//   vs.solve(on);  vs.solveFor(x, y) → { c, d };  vs.flash(key, t0);  vs.num(key);  vs.fmt(n), vs.parts(n), vs.paren(n), vs.nice(n)
//   vs.live(on, { drag: ids, move, only: keys });  questions: vsTask(vs, test, why, hint, reveal, opts), vcolBlanks(rows, { cols }), hcol(top, bottom, colour)
const VS_COL = [COL.irr, COL.real, COL.rat];   // first, second, third vector: green, violet, pink (the columns of A later)

function vecs(p, { vecs: list = { v: [3, 2] }, c = 1, d = 1, plane: po = {}, snap = 1, steps = {}, range = {}, show: shown, size = 46, labelSize = 32, t0 = .1, hidePlane = false,
                   extra = {}, colors = {}, onto = null, fix = null } = {}) {
  const names = Object.keys(list), [n1, n2 = n1] = names;
  const v = { c, d, ...extra };
  names.forEach(n => { v[n + '0'] = list[n][0]; v[n + '1'] = list[n][1]; });
  const holder = G(p, { o: hidePlane ? 0 : 1 });
  const P2 = plane(holder, { cx: 1160, cy: 450, u: 52, x0: -6, x1: 6, y0: -6, y1: 6, t0, ...po });
  const { PX, PY } = P2, svg = $('stage');
  const listeners = [], slots = [];
  let live = false, solving = false, plan = { ...v }, dragSet = null, moveVec = false, only = null;
  const colorOf = Object.fromEntries(names.map((n, i) => [n, VS_COL[i % 3]]));
  Object.assign(colorOf, { cv: colorOf[n1], dw: colorOf[n2], dw0: colorOf[n2], cv1: colorOf[n1], sum: COL.task }, colors);

  /* ---------- numbers ---------- */
  const isInt = n => Math.abs(n - Math.round(n)) < 1e-9;
  // A value as math parts: whole numbers, fractions in lowest terms (denominators up to 12; a value rounded to 6 places,
  // like 0.666667, still reads 2/3), else one decimal.
  const parts = n => {
    if (isInt(n)) return [num(Math.round(n) || 0)];
    for (let q = 2; q <= 12; q++) { const k = Math.round(n * q); if (Math.abs(n * q - k) < 5e-6) return [k < 0 ? '−' : '', F(Math.abs(k), q)]; }
    const r = Math.round(n * 10) / 10;   // a value in passing: always with its decimal sign (−0.97 is "−1.0", not a whole −1)
    return [num(r) + (Number.isInteger(r) ? DECIMAL_SIGN + '0' : '')];
  };
  const fmt = n => parts(n).map(x => typeof x === 'string' ? x : x.f.join('/')).join('');
  const vec = n => [v[n + '0'], v[n + '1']];
  const calc = () => {
    const a = vec(n1), b = vec(n2), cv = [v.c * a[0], v.c * a[1]], dw = [v.d * b[0], v.d * b[1]];
    return { cv, dw, sum: [cv[0] + dw[0], cv[1] + dw[1]] };
  };
  const get = key => {
    if (key in v) return v[key];
    const m = /^(cv|dw|sum)([01])$/.exec(key);
    return m ? calc()[m[1]][+m[2]] : NaN;
  };
  const scalar = k => k === 'c' || k === 'd';
  const step = k => steps[k] ?? (scalar(k) ? 1 : snap);
  const lim = k => range[k] ?? (scalar(k) ? [-5, 5] : /1$/.test(k) ? [P2.y0, P2.y1] : [P2.x0, P2.x1]);
  const clamp = (k, n) => Math.max(lim(k)[0], Math.min(lim(k)[1], n));
  const snapTo = (n, s) => Math.round(n / s) * s;

  // c and d that make c·v + d·w land on (X, Y); along v alone when v and w are parallel.
  const solveFor = (X, Y) => {
    const [a0, a1] = vec(n1), [b0, b1] = vec(n2), det = a0 * b1 - b0 * a1;
    if (Math.abs(det) > 1e-9) return { c: (X * b1 - b0 * Y) / det, d: (a0 * Y - X * a1) / det };
    const L = a0 * a0 + a1 * a1 || 1;
    return { c: (X * a0 + Y * a1) / L, d: 0 };
  };
  const setKey = (key, n) => {
    if (key in v) return edit({ [key]: clamp(key, n) });
    if (!solving) return;
    const s = calc().sum, i = +key.slice(-1);
    s[i] = Math.max(i ? P2.y0 : P2.x0, Math.min(i ? P2.y1 : P2.x1, n));
    edit(solveFor(s[0], s[1]));
  };
  const canScrub = key => (!only || only.includes(key)) && (key in v || (solving && /^sum/.test(key)));

  /* ---------- numbers you can scrub ---------- */
  // A slot shows one value; its ink is redrawn when the value's text changes and keeps its colour in `color`,
  // so a flash (c_color) survives the redraw. The box under it takes the drag; the text never does.
  // coef: a number written in front of a letter or a column; a 1 there is not written (−1 is "−") unless the reader can scrub it.
  function slot(g, key, x, y, { w = size * 1.7, sz = size, fill = COL.chalk, anchor = 'middle', scrub = true, pf, coef = false } = {}) {
    const bx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    const box = scrub ? mk('rect', { x: bx, y: y - sz * .95, width: w, height: sz * 1.3, rx: 10, fill: 'transparent' }, g) : null;
    const ink = G(g, {}); ink.setAttribute('color', fill); ink.style.pointerEvents = 'none';
    let shownKey = '';
    const s = {
      key, box, ink, fill, coef, held: false,
      set() {
        let pp = pf ? pf(v) : parts(get(key));
        if (coef && !s.held && pp.length === 1 && /^−?1$/.test(pp[0])) pp = [pp[0].slice(0, -1)];
        const k = JSON.stringify(pp);
        if (k === shownKey) return;
        shownKey = k; ink.replaceChildren();
        const long = pp.some(q => typeof q === 'string' && q.includes(DECIMAL_SIGN));   // a value passing between whole numbers
        M(ink, pp, { x, y: long ? y - sz * .06 : y, size: long ? sz * .78 : sz, fill: 'currentColor', anchor });
      },
    };
    if (box) {
      box.setAttribute('aria-label', key);
      let drag = null;
      box.addEventListener('pointerdown', e => {
        if (!live || !canScrub(key)) return;
        e.preventDefault();
        drag = { x: e.clientX, from: snapTo(get(key), step(key)) };
        box.setPointerCapture(e.pointerId);
      });
      box.addEventListener('pointermove', e => {
        if (!drag) return;
        const k = svg.getScreenCTM().a;   // screen px per stage px
        setKey(key, drag.from + Math.round((e.clientX - drag.x) / k / 22) * step(key));
      });
      const end = () => { drag = null; };
      box.addEventListener('pointerup', end);
      box.addEventListener('lostpointercapture', end);
      box.addEventListener('keydown', e => {
        if (!live || !canScrub(key)) return;
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); box.blur(); P.keys?.(e); return; }   // Enter checks, as in an answer box
        const dd = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
        if (!dd) return;
        e.preventDefault(); e.stopPropagation();   // the player's ←/→ must not leave the beat
        setKey(key, snapTo(get(key), step(key)) + dd * step(key));
      });
    }
    slots.push(s);
    s.set();
    return s;
  }

  /* ---------- rows of algebra ---------- */
  // items, laid out left to right on one baseline:
  //   'string'            math text in chalk ('=', '+', '−', 'v', 'c', '·')
  //   { t, fill }         math text in a colour (a vector's letter)
  //   { col: id }         a column in brackets: a vector's name, 'cv', 'dw' or 'sum'; its numbers scrub when they are state
  //   { col: id, fixed: true }   the same column, numbers not scrubbable
  //   { fn: v => [top, bottom], w, fill }   a column of computed math parts, e.g. ['3 + 1'] (see vs.paren)
  //   { key: 'c' }        one scrubbable number (a scalar), chalk
  //   { key: 'd', signed: true }   the same, with its sign drawn as the + or − before it (for a second term: c v − 2w)
  //   A scalar in front of a letter or a column is a coefficient: a 1 is not written (−1 shows as −) unless the reader
  //   can scrub it; { key: 'c', one: true } writes it anyway (a beat whose voice reads "one times v").
  // Each item is its own group in .parts, so a beat can reveal them one by one; o: 0 starts them all hidden.
  function row(items, { x = 90, y = 250, size: sz = size, o = 1, gap = sz * .28 } = {}) {
    const g = G(p, {}), out = [], mid = y - sz * .32, rh = sz * 1.3;
    let cx = x;
    for (const it of items) {
      const part = G(g, { o });
      if (typeof it === 'string' || it.t !== undefined) {
        const str = typeof it === 'string' ? it : it.t, fill = it.fill ?? COL.chalk;
        const w = mathW([str], sz);
        M(part, [str], { x: cx, y, size: sz, fill, anchor: 'start' });
        cx += w + gap;
      } else if (it.col) {
        const id = it.col, w = sz * 1.9, fill = colorOf[id] ?? COL.chalk;
        const top = mid - sz * 1.32, bot = mid + sz * 1.32;
        path(part, `M${cx + 14} ${top}H${cx}V${bot}H${cx + 14}M${cx + w - 14} ${top}H${cx + w}V${bot}H${cx + w - 14}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
        [0, 1].forEach(i => slot(part, id + i, cx + w / 2, mid - sz * .31 + i * rh, { sz, fill, w: w - 16, scrub: !it.fixed }));
        cx += w + gap;
      } else if (it.fn) {
        const w = it.w ?? sz * 4, fill = it.fill ?? COL.chalk;
        const top = mid - sz * 1.32, bot = mid + sz * 1.32;
        path(part, `M${cx + 14} ${top}H${cx}V${bot}H${cx + 14}M${cx + w - 14} ${top}H${cx + w}V${bot}H${cx + w - 14}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
        [0, 1].forEach(i => slot(part, 'fn', cx + w / 2, mid - sz * .31 + i * rh, { sz, fill, scrub: false, pf: vv => [].concat(it.fn(vv)[i]) }));
        cx += w + gap;
      } else if (it.key) {
        if (it.signed) {
          slot(part, 'sign', cx + sz * .3, y, { sz, scrub: false, pf: vv => [vv[it.key] < -1e-9 ? '−' : '+'] });
          cx += sz * .45 + gap * .5;
        }
        const w = sz * 1.15, k = it.key, nx = items[items.indexOf(it) + 1], coef = !it.one && !!nx && typeof nx === 'object' && (nx.t !== undefined || !!nx.col || !!nx.fn);
        slot(part, k, cx + w, y, { sz, fill: it.fill ?? COL.chalk, w, anchor: 'end', coef, pf: it.signed ? vv => parts(Math.abs(vv[k])) : undefined });
        cx += w + gap * .5 + (nx?.col || nx?.fn ? sz * .14 : 0);   // clear of a bracket after it: "1[" must not touch
      }
      out.push(part);
    }
    return { g, parts: out, w: cx - x };
  }

  /* ---------- arrows in the plane ---------- */
  const layer = G(P2.g, {}), latG = G(layer, { o: 0 }), legG = G(layer, {}), arrG = G(layer, {}), labG = G(layer, {}), hanG = G(layer, {});
  [latG, legG, arrG, labG].forEach(e => { e.style.pointerEvents = 'none'; });   // only the tip handles take the pointer (a hidden leg would cover what is under it)
  const arrowD = (xa, ya, xb, yb) => {
    const a = [PX(xa), PY(ya)], b = [PX(xb), PY(yb)], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1) return '';
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, hl = Math.min(20, L * .45);
    return `M${a[0]} ${a[1]}L${b[0] - ux * hl * .6} ${b[1] - uy * hl * .6}M${b[0] - hl * ux - 10 * uy} ${b[1] - hl * uy + 10 * ux}L${b[0]} ${b[1]}L${b[0] - hl * ux + 10 * uy} ${b[1] - hl * uy - 10 * ux}Z`;
  };
  // id → [tail, tip] in plane units
  const ends = id => {
    const k = calc();
    if (id in colorOf && names.includes(id)) return [[0, 0], vec(id)];
    return { cv: [[0, 0], k.cv], dw: [k.cv, k.sum], dw0: [[0, 0], k.dw], cv1: [k.dw, k.sum], sum: [[0, 0], k.sum] }[id];
  };
  // A value passing between whole numbers (a decimal) gets no label: "1.3v" flickering by is noise.
  const nice = n => !fmt(n).includes(DECIMAL_SIGN);
  const defaultLabel = {
    cv: () => !nice(v.c) ? [] : v.c === 1 ? [n1] : v.c === -1 ? ['−' + n1] : [...parts(v.c), n1],
    dw: () => !nice(v.d) ? [] : v.d === 1 ? [n2] : v.d === -1 ? ['−' + n2] : [...parts(v.d), n2],
    sum: () => [],
  };
  defaultLabel.cv1 = defaultLabel.cv; defaultLabel.dw0 = defaultLabel.dw;
  const ids = [...names, 'cv', 'dw', 'dw0', 'cv1', 'sum'];
  const show0 = shown ?? names;
  const A = {};
  // Placed arrows ('dw', 'cv1') go under the ones from the origin; the sum on top.
  const order = ['dw0', 'cv1', 'dw', 'cv', ...names, 'sum'];
  for (const id of order) {
    const g = G(arrG, { o: show0.includes(id) ? 1 : 0 }), color = colorOf[id];
    const pa = path(g, '', { stroke: color, fill: color, 'stroke-width': id === 'sum' ? 6 : 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const zero = mk('circle', { r: 7, fill: color, cx: PX(0), cy: PY(0) }, g);
    const lab = G(labG, { o: show0.includes(id) ? 1 : 0 }), labInk = G(lab, {});
    const leg = G(legG, { o: 0 });
    const legP = path(leg, '', { stroke: color, 'stroke-width': 3, 'stroke-dasharray': '7 7', fill: 'none' });
    const legX = G(leg, {}), legY = G(leg, {});
    const h = G(hanG, {});
    mk('circle', { r: 24, fill: 'transparent' }, h);
    const ring = mk('circle', { r: 14, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-dasharray': '4 4' }, h);
    ring.style.opacity = 0; h.style.pointerEvents = 'none';
    A[id] = { g, path: pa, zero, lab, labInk, labKey: '', label: defaultLabel[id] || (() => [id]), at: /^(dw|cv1)$/.test(id) ? 'mid' : 'tip', leg, legP, legX, legY, legKey: '', h, ring };
  }
  const tipCtl = { lab: 30 };

  /* ---------- the lattice: every c·v + d·w with whole c and d ---------- */
  const latLines = [0, 1].map(i => path(latG, '', { stroke: colorOf[i ? n2 : n1], 'stroke-width': 1.5, 'stroke-opacity': .45, fill: 'none' }));
  const latDots = path(latG, '', { stroke: COL.chalk, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-opacity': .55, fill: 'none' });
  const span = path(latG, '', { stroke: COL.task, 'stroke-width': 5, 'stroke-opacity': .5, fill: 'none', 'stroke-linecap': 'round' });
  let latOn = false;
  // The part of the line through point q with direction e inside the grid, as a path piece.
  const clipDir = (q, e) => {
    const ts = [];
    const tryT = (t, val, lo, hi) => { if (val >= lo - 1e-9 && val <= hi + 1e-9) ts.push(t); };
    if (Math.abs(e[0]) > 1e-9) for (const X of [P2.x0, P2.x1]) { const t = (X - q[0]) / e[0]; tryT(t, q[1] + t * e[1], P2.y0, P2.y1); }
    if (Math.abs(e[1]) > 1e-9) for (const Y of [P2.y0, P2.y1]) { const t = (Y - q[1]) / e[1]; tryT(t, q[0] + t * e[0], P2.x0, P2.x1); }
    if (ts.length < 2) return '';
    const a = Math.min(...ts), b = Math.max(...ts);
    if (b - a < 1e-9) return '';
    return `M${PX(q[0] + a * e[0])} ${PY(q[1] + a * e[1])}L${PX(q[0] + b * e[0])} ${PY(q[1] + b * e[1])}`;
  };
  function drawLattice() {
    const a = vec(n1), b = vec(n2), det = a[0] * b[1] - b[0] * a[1];
    let d1 = '', d2 = '', dots = '', sp = '';
    if (Math.abs(det) > 1e-9) {
      const cs = [], ds = [];
      for (const X of [P2.x0, P2.x1]) for (const Y of [P2.y0, P2.y1]) { const s = solveFor(X, Y); cs.push(s.c); ds.push(s.d); }
      const cr = [Math.ceil(Math.min(...cs)), Math.floor(Math.max(...cs))], dr = [Math.ceil(Math.min(...ds)), Math.floor(Math.max(...ds))];
      // ponytail: nearly parallel vectors need ever more lines; past 300 the grid is left out (it is a smear by then)
      if (cr[1] - cr[0] < 300 && dr[1] - dr[0] < 300) {
        for (let k = dr[0]; k <= dr[1]; k++) d1 += clipDir([k * b[0], k * b[1]], a);   // lines along v
        for (let k = cr[0]; k <= cr[1]; k++) d2 += clipDir([k * a[0], k * a[1]], b);   // lines along w
      }
      if ((cr[1] - cr[0] + 1) * (dr[1] - dr[0] + 1) < 6000) {
        for (let i = cr[0]; i <= cr[1]; i++) for (let j = dr[0]; j <= dr[1]; j++) {
          const X = i * a[0] + j * b[0], Y = i * a[1] + j * b[1];
          if (X >= P2.x0 - 1e-9 && X <= P2.x1 + 1e-9 && Y >= P2.y0 - 1e-9 && Y <= P2.y1 + 1e-9) dots += `M${PX(X)} ${PY(Y)}h0`;
        }
      }
    } else {
      const e = Math.hypot(...a) > 1e-9 ? a : b;
      if (Math.hypot(...e) > 1e-9) sp = clipDir([0, 0], e);
    }
    latLines[0].setAttribute('d', d1); latLines[1].setAttribute('d', d2); latDots.setAttribute('d', dots); span.setAttribute('d', sp);
  }

  /* ---------- one state, drawn everywhere ---------- */
  function draw() {
    slots.forEach(s => s.set());
    for (const id of ids) {
      const a = A[id], [[xa, ya], [xb, yb]] = ends(id), L = Math.hypot(xb - xa, yb - ya);
      const dd = arrowD(xa, ya, xb, yb);
      if (a.path.getAttribute('d') !== dd) a.path.setAttribute('d', dd);
      a.zero.style.opacity = L < .3 ? 1 : 0;   // the zero vector: a dot where the arrow would be
      put(a.zero, { x: PX(xa) - PX(0), y: PY(ya) - PY(0) });
      put(a.h, { x: PX(xb), y: PY(yb) });
      // label: beside the tip (pushed out along the arrow) or beside the middle (on the side away from the origin)
      const pp = L < .3 && id !== 'sum' ? [] : a.label(v), key = JSON.stringify(pp);   // no label on an arrow too short to see
      if (key !== a.labKey) { a.labKey = key; a.labInk.replaceChildren(); if (pp.length) M(a.labInk, pp, { size: labelSize, fill: colorOf[id], anchor: 'middle' }); }
      const ux = L > 1e-9 ? (xb - xa) / L : .7, uy = L > 1e-9 ? (yb - ya) / L : .7;
      let lx, ly;
      if (a.at === 'tip') {
        lx = PX(xb) + ux * tipCtl.lab + (Math.abs(ux) > .5 ? Math.sign(ux) * 8 : 0); ly = PY(yb) - uy * tipCtl.lab + 11;
        if (Math.abs(uy) < .3) ly += yb < -1e-9 ? 22 : -24;   // off the x-axis line, away from it
        if (Math.abs(ux) < .3) lx += 22;   // off the y-axis line
      }
      else {
        const mx = (xa + xb) / 2, my = (ya + yb) / 2;
        let nx = -uy, ny = ux;
        if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
        lx = PX(mx) + nx * 30; ly = PY(my) - ny * 30 + 11;
      }
      put(a.lab, { x: lx + (a.nudge?.[0] ?? 0), y: ly + (a.nudge?.[1] ?? 0) });
      // legs: across, then up, from the tail to the tip, each with its length
      const legD = L < 1e-9 ? '' : `M${PX(xa)} ${PY(ya)}H${PX(xb)}V${PY(yb)}`;
      if (a.legP.getAttribute('d') !== legD) a.legP.setAttribute('d', legD);
      const lk = fmt(xb - xa) + '|' + fmt(yb - ya) + '|' + [xa, ya, xb, yb].join();
      if (lk !== a.legKey) {
        a.legKey = lk; a.legX.replaceChildren(); a.legY.replaceChildren();
        // Going up, the across number sits inside the corner (between the leg and the arrow) when the rise leaves room,
        // else under the leg; going down, always above it (clear of the x-axis numbers). The up number sits beside its leg, away from the tail.
        const rise = yb - ya, inside = Math.abs(rise) >= 1.5;
        const hy = rise >= 0 ? (inside ? -12 : 50) : -14;   // pointing down: above the leg, clear of the x-axis numbers
        if (Math.abs(xb - xa) > 1e-9) M(a.legX, parts(xb - xa), { x: (PX(xa) + PX(xb)) / 2, y: PY(ya) + hy, size: 28, fill: colorOf[id], anchor: 'middle' });
        const run = xb - xa, toTail = Math.abs(run) >= 1.5, right = (run >= 0) !== toTail;
        if (Math.abs(rise) > 1e-9) M(a.legY, parts(rise), { x: PX(xb) + (right ? 14 : -14), y: (PY(ya) + PY(yb)) / 2 + 10, size: 28, fill: colorOf[id], anchor: right ? 'start' : 'end' });
      }
    }
    if (latOn) drawLattice();
    listeners.forEach(f => f(v, calc()));
  }
  function edit(to) {
    const changed = Object.keys(to).filter(k => v[k] !== to[k]);
    changed.forEach(k => { v[k] = to[k]; });
    if (changed.length) { fix?.(v, changed); draw(); }   // fix: the owner's rule that puts the state back in order (a point kept on a line)
  }

  /* ---------- dragging in the plane ---------- */
  const pt = e => { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const w = q.matrixTransform(P2.g.getScreenCTM().inverse()); return [(w.x - P2.cx) / P2.u, (P2.cy - w.y) / P2.u]; };
  const inBox = ([X, Y]) => [Math.max(P2.x0, Math.min(P2.x1, snapTo(X, snap))), Math.max(P2.y0, Math.min(P2.y1, snapTo(Y, snap)))];
  const proj = (q, e) => { const L = e[0] * e[0] + e[1] * e[1]; return L > 1e-9 ? (q[0] * e[0] + q[1] * e[1]) / L : 0; };
  // With move on, the tip of 'cv' or 'dw' carries its vector (v = tip / c, w = (tip − c·v) / d); else it sets c or d.
  const onDrag = {
    cv: q => {
      if (moveVec && Math.abs(v.c) > 1e-9) { const [X, Y] = inBox(q); return edit({ [n1 + '0']: X / v.c, [n1 + '1']: Y / v.c }); }
      edit({ c: clamp('c', snapTo(proj(q, vec(n1)), step('c'))) });
    },
    dw: q => {
      const k = calc();
      if (moveVec && Math.abs(v.d) > 1e-9) { const [X, Y] = inBox(q); return edit({ [n2 + '0']: (X - k.cv[0]) / v.d, [n2 + '1']: (Y - k.cv[1]) / v.d }); }
      edit({ d: clamp('d', snapTo(proj([q[0] - k.cv[0], q[1] - k.cv[1]], vec(n2)), step('d'))) });
    },
    sum: q => { if (solving) { const [X, Y] = inBox(q); edit(solveFor(X, Y)); } },
  };
  names.forEach(n => { onDrag[n] = q => { const [X, Y] = onto ? onto(n, q, inBox) : inBox(q); edit({ [n + '0']: X, [n + '1']: Y }); }; });
  for (const id of ['sum', ...names, 'cv', 'dw']) {
    const h = A[id].h;
    let on = false;
    h.addEventListener('pointerdown', e => { if (!live) return; e.preventDefault(); hanG.append(h); on = true; h.setPointerCapture(e.pointerId); onDrag[id](pt(e)); });
    h.addEventListener('pointermove', e => { if (on) onDrag[id](pt(e)); });
    h.addEventListener('pointerup', () => { on = false; });
    h.addEventListener('lostpointercapture', () => { on = false; });
  }

  draw();

  const vs = {
    v, P: P2, stage: holder, A, names, calc, solveFor, parts, fmt, row, latticeG: latG, layer, colorOf, clip: clipDir, at: pt,   // vs.lattice() shows it; vs.latticeG is the group
    paren: n => n < 0 ? `(${fmt(n)})` : fmt(n),   // a number inside a sum: 1 + (−4)
    nice: n => !fmt(n).includes(DECIMAL_SIGN),   // whole, or a simple fraction (not a value in passing)
    // Move the numbers to new values over dur seconds, on the beat clock (deterministic, so seeking replays it).
    to(next, at, dur = 1.2, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      fix?.(plan, Object.keys(next));   // the goal in order too (a point on a line that slides goes with it)
      const goal = { ...plan };
      prog(q => edit(Object.fromEntries(Object.keys(goal).map(k => [k, from[k] + (goal[k] - from[k]) * q]))), at, dur, ease);
    },
    // Show or hide arrows (with their labels) on the beat clock: vs.show(['cv', 'dw'], t0).
    show(list, at, dur = .5) { [].concat(list).forEach(id => { show(A[id].g, at, dur); show(A[id].lab, at, dur); }); },
    hide(list, at, dur = .5) { [].concat(list).forEach(id => { hide(A[id].g, at, dur); hide(A[id].lab, at, dur); }); },
    dim(list, at, o = .3, dur = .5) { [].concat(list).forEach(id => { tw(A[id].g, { o }, at, dur); tw(A[id].lab, { o: 0 }, at, dur); }); },   // a ghost keeps no label
    // The dashed walk across then up, with its numbers.
    legs(list, at, on = true, dur = .5) { [].concat(list).forEach(id => tw(A[id].leg, { o: on ? 1 : 0 }, at, dur)); },
    // A label is a function of the state returning math parts; where = 'tip' or 'mid'; nudge = [dx, dy] in stage px.
    label(id, f, where, nudge) { A[id].label = typeof f === 'function' ? f : () => [].concat(f); if (where) A[id].at = where; if (nudge) A[id].nudge = nudge; A[id].labKey = ''; draw(); },
    lattice(at, on = true, dur = .8) { latOn = true; drawLattice(); tw(latG, { o: on ? 1 : 0 }, at, dur); },
    // Solve mode: the tip of 'sum' and its numbers can be moved, and c and d follow.
    solve(on = true) { solving = on; },
    // Hands on: scrub numbers and drag tips. drag lists the arrows whose tips move (default: every arrow showing);
    // move: true makes the tips of 'cv' and 'dw' carry v and w instead of changing c and d.
    live(on, { drag, move = false, only: keys = null } = {}) {
      live = on; dragSet = drag ?? null; moveVec = move; only = keys;
      for (const s of slots) {
        const ok = on && s.box && canScrub(s.key) && st(s.box.parentNode).o > .3;
        if (!s.box) continue;
        s.box.style.cursor = ok ? 'ew-resize' : '';
        s.box.style.touchAction = ok ? 'none' : '';   // a finger scrubs the number instead of scrolling the page
        s.box.setAttribute('stroke', ok ? COL.faint : 'none');
        s.box.setAttribute('stroke-dasharray', '4 6');
        if (ok) s.box.setAttribute('tabindex', 0); else s.box.removeAttribute('tabindex');
        if (s.coef && s.held !== ok) { s.held = ok; s.set(); }   // a 1 the reader can grab is written
      }
      for (const id of ids) {
        const a = A[id], can = on && (id === 'sum' ? solving : id in onDrag) && (dragSet ? dragSet.includes(id) : st(a.g).o > .3);
        a.h.style.pointerEvents = can ? '' : 'none';
        a.h.style.cursor = can ? 'grab' : '';
        a.h.style.touchAction = can ? 'none' : '';
        a.ring.style.opacity = can ? 1 : 0;
      }
    },
    set: edit,   // at once, for a reader's action or an answer shown
    num: key => slots.filter(s => s.key === key).map(s => s.ink),   // every copy of this value on screen
    // Light a value up in amber and back, wherever it shows.
    flash(key, at) { slots.filter(s => s.key === key).forEach(s => { tw(s.ink, { c_color: COL.task }, at, .25); tw(s.ink, { c_color: s.fill }, at + 1.2, .6); }); },
    onChange(f) { listeners.push(f); },
    redraw: draw,
  };
  return vs;
}

// A question that is a task on the vectors: the reader changes them until test(v, calc) holds, then checks.
const vsTask = (vs, test, why, hint, reveal, opts) => (body, api) => {
  vs.live(true, opts);
  return {
    check: () => { const ok = !!test(vs.v, vs.calc()); api.grade(ok, typeof (ok ? why : hint) === 'function' ? (ok ? why : hint)(vs.v, vs.calc()) : ok ? why : hint); },
    reveal: () => { reveal?.(); return typeof why === 'function' ? why(vs.v, vs.calc()) : why; },
    lock: () => vs.live(false),
    hint: [kbd('Tab'), ' pick a number ', kbd('↑'), kbd('↓'), ' change it, or drag a tip'],
  };
};

// A column vector in HTML text (prompts, feedback, grid rows): hcol(3, −2, COL.irr). Numbers are written as given.
const hcol = (top, bot, color) => {
  const e = h('span', 'vcol', [h('span', '', [String(top).replace('-', '−')]), h('span', '', [String(bot).replace('-', '−')])]);
  if (color) e.style.color = color;
  return e;
};
document.head.append(Object.assign(document.createElement('style'), { textContent:
  '.vcol{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.08;padding:.08em .42em;margin:0 .12em;position:relative;font-family:var(--math-font,serif);min-width:1.1em}' +
  '.vcol::before,.vcol::after{content:"";position:absolute;top:0;bottom:0;width:.28em;border:.09em solid currentColor}' +
  '.vcol::before{left:0;border-right:none}.vcol::after{right:0;border-left:none}' }));

// Questions whose answer is a column: each row shows q (rich text, columns by hcol) = [box over box].
// rows: { q, ans: [top, bottom], why, hint, fx }. Graded by blanks (any equal value, fractions too).
// { cols: n } lays the rows out n to a line (one system's three columns side by side).
const vcolBlanks = (rowsIn, { cols } = {}) => (body, api) => {
  const ctl = blanks(rowsIn.map(r => ({ ...r, parts: [{ box: String(r.ans[0]) }, { box: String(r.ans[1]) }] })))(body, api);
  body.querySelectorAll('.bline').forEach((line, i) => {
    const bs = line.querySelectorAll('input.box');
    line.prepend(...(rowsIn[i].q ? [rich(rowsIn[i].q, 30), h('span', 'veq', ' = ')] : []), h('span', 'vcol vin', [bs[0], bs[1]]));
  });
  if (cols) { body.classList.add('vgrid'); body.style.gridTemplateColumns = `repeat(${cols}, auto)`; }
  else if (rowsIn.length > 3) body.classList.add('vgrid');   // many rows: two columns, so a full-screen set fits
  return ctl;
};
document.head.append(Object.assign(document.createElement('style'), { textContent:
  '.blanks.vgrid{display:grid;grid-template-columns:1fr 1fr;column-gap:2.5em}' +
  '.vcol.vin{padding:.15em .5em;gap:.18em;font-size:30px}.vcol.vin input{margin:0}.bline .veq{font-family:var(--math-font,serif);font-size:30px;margin:0 .3em}' }));

/* ---------- the subspace test in the plane ---------- */
// A set S drawn in blue (row 1's colour: S is an equation's line), two vectors u and w kept inside S, the numbers c and d,
// and the combination c·u + d·w from the origin with a ring at its tip: green while it stays in S, red once it leaves.
// It is vecs underneath (sb.vs), so it is one state (sb.v: u0 u1 w0 w1 c d a b k): scrub a number and the picture moves,
// drag a tip (it slides along S) or the line itself (it slides, k follows) and the numbers move.
//   set: 'line'  the line a·x + b·y = k       'zero'  the zero vector alone
//        'all'   every vector of the plane    'quad'  the quarter where x ≥ 0 and y ≥ 0
//   const sb = subspace2(p, { set, line: [a, b, k], u: [2, 1], w: [−4, −2], c, d, plane, show, snap, t0, hidePlane })
//   sb.eq({ x, y, size })      the equation a x + b y = k, scrubbable, with a blue bar; returns the row (its .parts)
//   sb.readout({ x, y, size }) the test, live: c·u + d·w put into S's rule (6 − 2·3 = 0), then the verdict in words
//   sb.check(id, { x, y, size }) one vector ('u', 'w', 'cv', 'sum') put into the rule, live, with ✓ or ✗
//   sb.kind(name, t0)          another set (u and w move into it);  sb.kindNow()
//   sb.multiples(t0, on)       the dashed line of every multiple of u (where c·u can go)
//   sb.ok() is c·u + d·w in S;  sb.inSet([x, y]);  sb.setG, sb.ring (groups to show or hide);  sb.row (vs.row)
//   sb.to / set / onChange / flash / num as in vecs;  sb.live(on, { only: keys, drag: ids, slide })
//   sbTask(sb, test, why, hint, reveal, opts): a hands-on question; test(v, sb) decides.
function subspace2(p, { set = 'line', line: L0 = [1, -2, 0], u = [2, 1], w = [-4, -2], c = 1, d = 1, plane: po = {}, show: shown = ['u', 'w', 'dw', 'sum'],
                        snap = 1, labelSize = 30, t0 = .1, hidePlane = false, size = 46, range = {} } = {}) {
  // The kind of set is part of the state (v.kind, an index into KINDS), so a move planned for later uses the set it will
  // be then: sb.kind('all', t) is a step of the state on the beat clock like any other.
  const KINDS = ['line', 'zero', 'all', 'quad'], kindOf = v => KINDS[Math.round(v.kind)] ?? 'line';
  let vs = null, live = false, onlyKeys = null, slideOn = true;
  const SET = COL.whole, x0 = po.x0 ?? -6, x1 = po.x1 ?? 6, y0 = po.y0 ?? -6, y1 = po.y1 ?? 6;
  const lineOK = v => Math.abs(v.a) + Math.abs(v.b) > 1e-9;
  const inSet = ([x, y], v = vs.v, kind = kindOf(v)) => kind === 'all' ? true : kind === 'zero' ? Math.hypot(x, y) < 1e-6
    : kind === 'quad' ? x > -1e-9 && y > -1e-9 : lineOK(v) && Math.abs(v.a * x + v.b * y - v.k) < 1e-6 * (1 + Math.abs(v.k));
  // Which coordinate of a point stays when it is put back on the line: the one just changed, else the one along which
  // the line is flatter (a point on a steep line keeps its height), so the other changes least.
  const keepX = (v, n, changed) => {
    if (changed.includes(n + '1') && !changed.includes(n + '0') && Math.abs(v.a) > 1e-9) return false;
    if (changed.includes(n + '0') && !changed.includes(n + '1') && Math.abs(v.b) > 1e-9) return true;
    return Math.abs(v.b) >= Math.abs(v.a);
  };
  const fix = (v, changed = []) => {
    const kind = kindOf(v);
    for (const n of ['u', 'w']) {
      if (kind === 'zero') { v[n + '0'] = 0; v[n + '1'] = 0; }
      else if (kind === 'quad') { v[n + '0'] = Math.max(0, v[n + '0']); v[n + '1'] = Math.max(0, v[n + '1']); }
      else if (kind === 'line' && lineOK(v)) {
        if (keepX(v, n, changed)) v[n + '1'] = (v.k - v.a * v[n + '0']) / v.b || 0;
        else v[n + '0'] = (v.k - v.b * v[n + '1']) / v.a || 0;
      }
    }
  };
  // A dragged tip lands on S: the foot of the pointer on the line, its free coordinate on the grid (and kept so the
  // other one stays on the board).
  const onto = (n, q, inBox) => {
    const v = vs.v, r = t => Math.round(t / snap) * snap, kind = kindOf(v);
    if (kind === 'zero') return [0, 0];
    if (kind === 'all') return inBox(q);
    if (kind === 'quad') { const [X, Y] = inBox(q); return [Math.max(0, X), Math.max(0, Y)]; }
    if (!lineOK(v)) return inBox(q);
    const L = v.a * v.a + v.b * v.b, e = (v.a * q[0] + v.b * q[1] - v.k) / L, f = [q[0] - e * v.a, q[1] - e * v.b];
    const byX = Math.abs(v.b) >= Math.abs(v.a), [P, Q] = byX ? [v.a, v.b] : [v.b, v.a], [lo, hi] = byX ? [y0, y1] : [x0, x1], [flo, fhi] = byX ? [x0, x1] : [y0, y1];
    // the free coordinate t keeps the other, (k − P t) / Q, inside [lo, hi]
    let tlo = flo, thi = fhi;
    if (Math.abs(P) > 1e-9) { const A = (v.k - Q * hi) / P, B = (v.k - Q * lo) / P; tlo = Math.max(tlo, Math.min(A, B)); thi = Math.min(thi, Math.max(A, B)); }
    const t = Math.max(Math.ceil(tlo / snap - 1e-9) * snap, Math.min(Math.floor(thi / snap + 1e-9) * snap, r(byX ? f[0] : f[1])));
    const o = (v.k - P * t) / Q || 0;
    return byX ? [t, o] : [o, t];
  };
  const st0 = { u0: u[0], u1: u[1], w0: w[0], w1: w[1], a: L0[0], b: L0[1], k: L0[2], kind: KINDS.indexOf(set) };
  fix(st0);
  vs = vecs(p, { vecs: { u: [st0.u0, st0.u1], w: [st0.w0, st0.w1] }, c, d, extra: { a: st0.a, b: st0.b, k: st0.k, kind: st0.kind }, colors: { sum: COL.chalk },
    onto, fix, show: shown, plane: po, snap, labelSize, t0, hidePlane, size,
    range: { a: [-6, 6], b: [-6, 6], k: [-12, 12], ...range } });
  const P2 = vs.P, { PX, PY } = P2, svg = $('stage');
  const term = (k, n) => Math.abs(k - 1) < 1e-9 ? n : Math.abs(k + 1) < 1e-9 ? '−' + n : vs.fmt(k) + n;
  vs.label('sum', v => {
    if (!vs.nice(v.c) || !vs.nice(v.d)) return [];
    if (!v.c && !v.d) return ['0'];
    if (!v.d) return [term(v.c, 'u')];
    if (!v.c) return [term(v.d, 'w')];
    return [`${term(v.c, 'u')} ${v.d < 0 ? '−' : '+'} ${term(Math.abs(v.d), 'w')}`];
  });

  /* ---------- the set, under the arrows ---------- */
  const sg = G(P2.g, {});
  P2.g.insertBefore(sg, vs.layer);
  const shade = path(sg, '', { fill: SET, 'fill-opacity': .13, stroke: 'none' });
  const edge = path(sg, '', { stroke: SET, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' });
  const zdot = mk('circle', { cx: PX(0), cy: PY(0), r: 11, fill: SET }, sg);
  const mult = G(P2.g, { o: 0 });
  P2.g.insertBefore(mult, vs.layer);
  const multP = path(mult, '', { stroke: COL.chalk, 'stroke-width': 2.5, 'stroke-dasharray': '8 9', 'stroke-opacity': .7, fill: 'none' });
  const hit = path(sg, '', { stroke: 'transparent', 'stroke-width': 30, fill: 'none' });
  hit.setAttribute('aria-label', 'the line');
  // the ring at the tip of c·u + d·w: green in S, red out of it; over the arrows
  const ring = G(P2.g, { o: shown.includes('sum') ? 1 : 0 });
  ring.style.pointerEvents = 'none';
  const ringC = mk('circle', { r: 17, fill: 'none', 'stroke-width': 4 }, ring);
  let setKey = '';
  const drawSet = v => {
    const L = lineOK(v) ? v.a * v.a + v.b * v.b : 1, foot = [v.k * v.a / L, v.k * v.b / L], kind = kindOf(v);
    const key = [kind, v.a, v.b, v.k].join();
    if (key !== setKey) {
      setKey = key;
      const box = `M${PX(x0)} ${PY(y1)}H${PX(x1)}V${PY(y0)}H${PX(x0)}Z`;
      const ld = kind === 'line' && lineOK(v) ? vs.clip(foot, [-v.b, v.a]) : '';
      shade.setAttribute('d', kind === 'all' ? box : kind === 'quad' ? `M${PX(0)} ${PY(y1)}H${PX(x1)}V${PY(0)}H${PX(0)}Z` : '');
      edge.setAttribute('d', kind === 'line' ? ld : kind === 'quad' ? `M${PX(0)} ${PY(y1)}V${PY(0)}H${PX(x1)}` : '');
      hit.setAttribute('d', ld);
      zdot.style.opacity = kind === 'zero' ? 1 : 0;
    }
    const s = vs.calc().sum, ok = inSet(s, v);
    put(ring, { x: PX(s[0]), y: PY(s[1]) });
    ringC.setAttribute('stroke', ok ? COL.good : COL.bad);
    multP.setAttribute('d', Math.hypot(v.u0, v.u1) > 1e-9 ? vs.clip([0, 0], [v.u0, v.u1]) : '');
  };
  vs.onChange(drawSet); drawSet(vs.v);

  /* ---------- sliding the line by hand ---------- */
  const canSlide = () => live && slideOn && kindOf(vs.v) === 'line' && (!onlyKeys || onlyKeys.includes('k'));
  let sliding = false;
  hit.addEventListener('pointerdown', e => {
    if (!canSlide()) return;
    e.preventDefault(); e.stopPropagation();
    sliding = true; hit.setPointerCapture(e.pointerId);
  });
  hit.addEventListener('pointermove', e => {
    if (!sliding) return;
    const q = vs.at(e), v = vs.v, [lo, hi] = range.k ?? [-12, 12];
    vs.set({ k: Math.max(lo, Math.min(hi, Math.round(v.a * q[0] + v.b * q[1]))) });
  });
  const stop = () => { sliding = false; };
  hit.addEventListener('pointerup', stop);
  hit.addEventListener('lostpointercapture', stop);
  hit.addEventListener('pointerenter', () => { if (canSlide()) edge.setAttribute('stroke-width', 9); });
  hit.addEventListener('pointerleave', () => edge.setAttribute('stroke-width', 6));

  /* ---------- the test in words ---------- */
  const pp = n => n < -1e-9 ? ['(', ...vs.parts(n), ')'] : vs.parts(n);
  const coefT = (a, s) => Math.abs(a - 1) < 1e-9 ? pp(s) : Math.abs(a + 1) < 1e-9 ? ['−', ...pp(s)] : [...vs.parts(a), '·', ...pp(s)];
  const testParts = (v, s) => {
    if (kindOf(v) === 'line') return [...coefT(v.a, s[0]), v.b < -1e-9 ? ' − ' : ' + ', ...coefT(Math.abs(v.b), s[1]), ' = ', ...vs.parts(v.a * s[0] + v.b * s[1])];
    return ['(', ...vs.parts(s[0]), ', ', ...vs.parts(s[1]), ')'];
  };
  const verdict = (v, s, ok, kind = kindOf(v)) => kind === 'line' ? (ok ? `${vs.fmt(v.k)}, as the line needs: on the line ✓` : `not ${vs.fmt(v.k)}: off the line ✗`)
    : kind === 'zero' ? (ok ? 'the zero vector: still inside ✓' : 'not the zero vector: outside ✗')
    : kind === 'quad' ? (ok ? 'no negative number: inside ✓' : 'a negative number: outside ✗')
    : 'a vector of the plane: inside ✓';

  const sb = {
    vs, v: vs.v, P: P2, setG: sg, ring, mult, row: vs.row, inSet: q => inSet(q),
    ok: () => inSet(vs.calc().sum),
    kindNow: () => kindOf(vs.v),
    to: (next, at, dur, ease) => vs.to(next, at, dur, ease),
    set: to => vs.set(to),
    onChange: f => vs.onChange(f),
    flash: (key, at) => vs.flash(key, at),
    num: key => vs.num(key),
    show: (ids, at, dur) => { vs.show(ids, at, dur); if ([].concat(ids).includes('sum')) show(ring, at, dur); },
    hide: (ids, at, dur) => { vs.hide(ids, at, dur); if ([].concat(ids).includes('sum')) hide(ring, at, dur); },
    // another set from t0 (at once without t0): u and w are put into it
    kind(name, at) {
      const n = KINDS.indexOf(name);
      if (at === undefined) vs.set({ kind: n }); else vs.to({ kind: n }, at, 0);
    },
    multiples(at, on = true, dur = .6) { tw(mult, { o: on ? 1 : 0 }, at, dur); },
    eq({ x = 90, y = 200, size: sz = 46, o = 1 } = {}) {
      const r = vs.row([{ key: 'a' }, { t: 'x' }, { key: 'b', signed: true }, { t: 'y' }, '=', { key: 'k' }], { x, y, size: sz, o });
      mk('rect', { x: x - 30, y: y - sz * .7, width: 8, height: sz * .8, rx: 4, fill: SET }, r.g);
      return r;
    },
    // One vector put into S's rule, live: 'u', 'w', 'cv' or 'sum' → "2 − 2·1 = 0 ✓" (✓ green, ✗ red).
    check(id, { x = 90, y = 430, size: sz = 28, o = 1, anchor = 'start' } = {}) {
      const g = G(p, { o });
      let key = '';
      const upd = v => {
        const q = id === 'sum' ? vs.calc().sum : id === 'cv' ? vs.calc().cv : [v[id + '0'], v[id + '1']], ok = inSet(q, v), tp = [...testParts(v, q), ok ? '  ✓' : '  ✗'];
        const k = JSON.stringify(tp);
        if (k === key) return;
        key = k; g.replaceChildren();
        const e = M(g, tp.slice(0, -1), { x, y, size: sz, fill: COL.chalk, anchor });
        T(g, tp[tp.length - 1], { x: anchor === 'start' ? x + e._w : x + e._w / 2, y, size: sz, fill: ok ? COL.good : COL.bad, weight: 700, anchor: anchor === 'start' ? 'start' : 'start' });
      };
      vs.onChange(upd); upd(vs.v);
      return g;
    },
    readout({ x = 90, y = 600, size: sz = 34, o = 1 } = {}) {
      const g = G(p, { o }), a = G(g, {}), b = G(g, {});
      let key = '';
      const upd = v => {
        const s = vs.calc().sum, ok = inSet(s, v), tp = testParts(v, s), w = verdict(v, s, ok), k = JSON.stringify([tp, w]);
        if (k === key) return;
        key = k; a.replaceChildren(); b.replaceChildren();
        M(a, tp, { x, y, size: sz, fill: COL.chalk, anchor: 'start' });
        T(b, w, { x, y: y + sz * 1.35, size: sz * .82, fill: ok ? COL.good : COL.bad, weight: 600 });
      };
      vs.onChange(upd); upd(vs.v);
      return g;
    },
    live(on, { only = null, drag, slide = true } = {}) {
      live = on; onlyKeys = only; slideOn = slide;
      const ids = drag ?? ['u', 'w', 'cv', 'dw'].filter(id => st(vs.A[id].g).o > .3);
      vs.live(on, { drag: ids, only });
      hit.style.cursor = canSlide() ? 'move' : '';
      hit.style.pointerEvents = canSlide() ? '' : 'none';
      hit.style.touchAction = canSlide() ? 'none' : '';
    },
    redraw: () => vs.redraw(),
  };
  hit.style.pointerEvents = 'none';
  return sb;
}

// A question that is a task on the subspace test: the reader changes it until test(v, sb) holds, then checks.
const sbTask = (sb, test, why, hint, reveal, opts) => (body, api) => {
  sb.live(true, opts);
  const say = f => typeof f === 'function' ? f(sb.v, sb) : f;
  return {
    check: () => { const ok = !!test(sb.v, sb); api.grade(ok, say(ok ? why : hint)); },
    reveal: () => { reveal?.(); return say(why); },
    lock: () => sb.live(false),
    hint: [kbd('Tab'), ' pick a number ', kbd('↑'), kbd('↓'), ' change it; drag the line to slide it, a tip to move it along'],
  };
};
