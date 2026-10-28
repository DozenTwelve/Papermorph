// Named 2D vectors drawn two ways from one state: columns of numbers in brackets, and arrows in the plane.
// Every number on screen is the same value: scrub one (drag sideways, or focus it and press ↑/↓) and its arrow moves;
// drag an arrow's tip and its numbers follow. Two scalars c and d make the combination c·v + d·w, drawn tip to tail:
// 'cv' from the origin, 'dw' from the tip of 'cv', and 'sum' from the origin to where they end. With solve mode on,
// dragging the tip of 'sum' (or scrubbing its numbers) finds c and d.
// The beat moves it with vs.to(); a question turns the reader's hands on with vs.live(true).
// Loads after engine.js and math.js (it uses plane() and mathW()); linsys.js is not needed.
//
//   const vs = vecs(p, { vecs: { v: [2, −1], w: [−1, 2] }, c: 1, d: 2, show: ['cv', 'dw', 'sum'], plane: { cx, cy, u, step },
//                        snap: 1 | .5, steps: { c: .5 }, range: { c: [−5, 5] }, labelSize, hidePlane })
//   state vs.v = { v0, v1, w0, w1, c, d };  arrows vs.A[id] (id: each name, 'cv', 'dw', 'dw0', 'cv1', 'sum') with .g .path .lab
//   vs.row(items, { x, y, size, o })   the algebra, live (see row below);  vs.to(next, t0, dur);  vs.set(next);  vs.onChange(f)
//   vs.show / hide / dim(ids, t0);  vs.legs(ids, t0, on);  vs.label(id, parts | v => parts, 'tip' | 'mid', [dx, dy]);  vs.lattice(t0)
//   vs.solve(on);  vs.solveFor(x, y) → { c, d };  vs.flash(key, t0);  vs.num(key);  vs.fmt(n), vs.parts(n), vs.paren(n), vs.nice(n)
//   vs.live(on, { drag: ids, move });  questions: vsTask(vs, test, why, hint, reveal, opts), vcolBlanks(rows, { cols }), hcol(top, bottom, colour)
const VS_COL = [COL.irr, COL.real, COL.rat];   // first, second, third vector: green, violet, pink (the columns of A later)

function vecs(p, { vecs: list = { v: [3, 2] }, c = 1, d = 1, plane: po = {}, snap = 1, steps = {}, range = {}, show: shown, size = 46, labelSize = 32, t0 = .1, hidePlane = false } = {}) {
  const names = Object.keys(list), [n1, n2 = n1] = names;
  const v = { c, d };
  names.forEach(n => { v[n + '0'] = list[n][0]; v[n + '1'] = list[n][1]; });
  const holder = G(p, { o: hidePlane ? 0 : 1 });
  const P2 = plane(holder, { cx: 1160, cy: 450, u: 52, x0: -6, x1: 6, y0: -6, y1: 6, t0, ...po });
  const { PX, PY } = P2, svg = $('stage');
  const listeners = [], slots = [];
  let live = false, solving = false, plan = { ...v }, dragSet = null, moveVec = false;
  const colorOf = Object.fromEntries(names.map((n, i) => [n, VS_COL[i % 3]]));
  Object.assign(colorOf, { cv: colorOf[n1], dw: colorOf[n2], dw0: colorOf[n2], cv1: colorOf[n1], sum: COL.task });

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
  const canScrub = key => key in v || (solving && /^sum/.test(key));

  /* ---------- numbers you can scrub ---------- */
  // A slot shows one value; its ink is redrawn when the value's text changes and keeps its colour in `color`,
  // so a flash (c_color) survives the redraw. The box under it takes the drag; the text never does.
  function slot(g, key, x, y, { w = size * 1.7, sz = size, fill = COL.chalk, anchor = 'middle', scrub = true, pf } = {}) {
    const bx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    const box = scrub ? mk('rect', { x: bx, y: y - sz * .95, width: w, height: sz * 1.3, rx: 10, fill: 'transparent' }, g) : null;
    const ink = G(g, {}); ink.setAttribute('color', fill); ink.style.pointerEvents = 'none';
    let shownKey = '';
    const s = {
      key, box, ink, fill,
      set() {
        const pp = pf ? pf(v) : parts(get(key)), k = JSON.stringify(pp);
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
        const w = sz * 1.15, k = it.key;
        slot(part, k, cx + w, y, { sz, fill: it.fill ?? COL.chalk, w, anchor: 'end', pf: it.signed ? vv => parts(Math.abs(vv[k])) : undefined });
        cx += w + gap * .5;   // clear of a bracket after it
      }
      out.push(part);
    }
    return { g, parts: out, w: cx - x };
  }

  /* ---------- arrows in the plane ---------- */
  const layer = G(P2.g, {}), latG = G(layer, { o: 0 }), legG = G(layer, {}), arrG = G(layer, {}), labG = G(layer, {}), hanG = G(layer, {});
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
    let changed = false;
    for (const k in to) if (v[k] !== to[k]) { v[k] = to[k]; changed = true; }
    if (changed) draw();
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
  names.forEach(n => { onDrag[n] = q => { const [X, Y] = inBox(q); edit({ [n + '0']: X, [n + '1']: Y }); }; });
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
    v, P: P2, stage: holder, A, names, calc, solveFor, parts, fmt, row, latticeG: latG,   // vs.lattice() shows it; vs.latticeG is the group
    paren: n => n < 0 ? `(${fmt(n)})` : fmt(n),   // a number inside a sum: 1 + (−4)
    nice: n => !fmt(n).includes(DECIMAL_SIGN),   // whole, or a simple fraction (not a value in passing)
    // Move the numbers to new values over dur seconds, on the beat clock (deterministic, so seeking replays it).
    to(next, at, dur = 1.2, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
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
    live(on, { drag, move = false } = {}) {
      live = on; dragSet = drag ?? null; moveVec = move;
      for (const s of slots) {
        const ok = on && s.box && canScrub(s.key) && st(s.box.parentNode).o > .3;
        if (!s.box) continue;
        s.box.style.cursor = ok ? 'ew-resize' : '';
        s.box.style.touchAction = ok ? 'none' : '';   // a finger scrubs the number instead of scrolling the page
        s.box.setAttribute('stroke', ok ? COL.faint : 'none');
        s.box.setAttribute('stroke-dasharray', '4 6');
        if (ok) s.box.setAttribute('tabindex', 0); else s.box.removeAttribute('tabindex');
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
