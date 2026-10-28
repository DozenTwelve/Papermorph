// A 2 × 2 system (or one equation, rows: 1) drawn three ways from one state: the equations, the matrix form and the plane.
// Every number on screen is the same value: scrub one (drag sideways, or focus it and press ↑/↓) and the lines,
// the columns and the other copy follow; drag a line or an arrow tip in the plane and the numbers follow.
// The beat moves it with sys.to(); a question turns the reader's hands on with sys.live(true).
// Loads after engine.js and math.js (it uses plane()).
const LS_ROW = [COL.whole, COL.nat], LS_COLS = [COL.irr, COL.real], LS_B = COL.task;

function linsys(p, { A = [[2, -1], [-1, 2]], b = [0, 3], eq = [90, 250], mat = [90, 560], size = 54, plane: po = {}, view = 'row', rows = 2, hidePlane = false, sol: readout = rows === 2, t0 = .1 } = {}) {
  const RI = rows === 2 ? [0, 1] : [0];
  if (rows === 1) mat = null;
  const v = { a00: A[0][0], a01: A[0][1], a10: A[1][0], a11: A[1][1], b0: b[0], b1: b[1] };
  const RANGE = { a00: 9, a01: 9, a10: 9, a11: 9, b0: 30, b1: 30 };
  // The plane sits in its own holder, so a beat can keep it hidden (hidePlane) and show sys.stage later.
  const holder = G(p, { o: hidePlane ? 0 : 1 });
  holder.style.userSelect = 'none';   // a drag that misses a line must not select the axis numbers
  const P2 = plane(holder, { cx: 1160, cy: 450, u: 52, x0: -6, x1: 6, y0: -6, y1: 6, t0, ...po });
  const { PX, PY } = P2, bx = [P2.x0, P2.x1], by = [P2.y0, P2.y1];
  const svg = $('stage'), listeners = [], slots = [];
  let live = false, plan = { ...v }, allowed = null;
  const can = k => live && (!allowed || allowed.has(k));   // live(true, { only }) unlocks only the named numbers

  const fmt = (n, one = false) => {
    const r = Math.round(n * 10) / 10, s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1);
    return (r < 0 ? '−' : '') + (one && Math.abs(r) === 1 ? '' : s);
  };
  const setText = (e, s) => { if (e.textContent !== s) e.textContent = s; };
  const pt = e => { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const w = q.matrixTransform(P2.g.getScreenCTM().inverse()); return [(w.x - P2.cx) / P2.u, (P2.cy - w.y) / P2.u]; };
  const clamp = (k, n) => Math.max(-RANGE[k], Math.min(RANGE[k], n));

  /* ---------- numbers you can scrub ---------- */
  // A slot is a number (and the letter after it) with a hit box; key names which value it shows.
  function slot(g, key, x, y, { anchor = 'end', letter = '', one = false, fill = COL.chalk, w = 96 } = {}) {
    const box = mk('rect', { x: anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x, y: y - size * .85, width: w + (letter ? size * .6 : 0), height: size * 1.1, rx: 10, fill: 'transparent' }, g);
    const t = T(g, '', { x, y, size, fill, font: MATH, anchor });
    const l = letter ? T(g, letter, { x: x + 3, y, size, fill, font: MATH }) : null;
    l?.setAttribute('font-style', 'italic');
    t.style.pointerEvents = 'none'; if (l) l.style.pointerEvents = 'none';   // the box under them takes the drag
    // A number with a letter after it keeps its hit box tight around what shows: a hidden 1 leaves just the letter.
    const fit = () => {
      if (!letter || anchor !== 'end') return;
      const tw0 = t.textContent ? t.getComputedTextLength() : 0, lw = l.getComputedTextLength() || size * .5, bx0 = x - tw0 - 10;
      if (+box.getAttribute('x') !== bx0) { box.setAttribute('x', bx0); box.setAttribute('width', tw0 + lw + 23); }
    };
    const s = { key, t, l, box, one, fit, set: () => { setText(t, fmt(v[key], one) || (one ? '' : '0')); fit(); } };
    box.setAttribute('aria-label', key);
    let drag = null;
    box.addEventListener('pointerdown', e => {
      if (!can(key)) return;
      e.preventDefault();
      drag = { x: e.clientX, from: Math.round(v[key]) };
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', e => {
      if (!drag) return;
      const k = svg.getScreenCTM().a;   // screen px per stage px
      edit({ [key]: clamp(key, drag.from + Math.round((e.clientX - drag.x) / k / 22)) });
    });
    const end = () => { drag = null; };
    box.addEventListener('pointerup', end);
    box.addEventListener('lostpointercapture', end);
    box.addEventListener('keydown', e => {
      if (!can(key)) return;
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); box.blur(); P.keys?.(e); return; }   // Enter checks, as in an answer box
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();   // the player's ←/→ must not leave the beat
      edit({ [key]: clamp(key, Math.round(v[key]) + d) });
    });
    slots.push(s);
    return s;
  }

  /* ---------- the equations ---------- */
  const E = G(p, { o: 0 }), eqRows = [];
  RI.forEach(i => {
    const y = eq[1] + i * 92, x = eq[0], g = G(E, {});   // each row in its own group, so focus() can dim the other
    const bar = mk('rect', { x: x - 34, y: y - size * .7, width: 8, height: size * .8, rx: 4, fill: LS_ROW[i] }, g);
    const a = slot(g, `a${i}0`, x + 110, y, { letter: 'x', one: true });
    const sign = T(g, '+', { x: x + 190, y, size, fill: COL.chalk, font: MATH, anchor: 'middle' });
    const bb = slot(g, `a${i}1`, x + 270, y, { letter: 'y', one: true });
    T(g, '=', { x: x + 338, y, size, fill: COL.chalk, font: MATH, anchor: 'middle' });
    const c = slot(g, `b${i}`, x + 376, y, { anchor: 'start' });
    eqRows.push({ g, bar, a, sign, bb, c });
  });
  // The second term shows its size; the sign between carries its sign and sits halfway between the two terms,
  // so "x + y", "2x + 3y" and "2.5x − 2.5y" are evenly spaced.
  eqRows.forEach((r, i) => {
    const right = eq[0] + 270, xEnd = eq[0] + 113 + (r.a.l.getComputedTextLength() || size * .5);
    r.bb.set = () => {
      setText(r.sign, v[`a${i}1`] < 0 ? '−' : '+');
      setText(r.bb.t, fmt(Math.abs(v[`a${i}1`]), true));
      r.bb.fit();
      const x = Math.round((xEnd + right - (r.bb.t.textContent ? r.bb.t.getComputedTextLength() : 0)) / 2);
      if (st(r.sign).x !== x) put(r.sign, { x });
    };
  });
  const sol = G(E, {});

  /* ---------- the matrix form ---------- */
  const Mx = G(p, { o: 0 });
  if (mat) {
    const [mx, my] = mat, cw = 92, rh = 74, ms = size * .85;
    const bracket = (x, w, color = COL.chalk) => {
      const top = my - ms * .95, bot = my + rh + ms * .35;
      path(Mx, `M${x + 14} ${top}H${x}V${bot}H${x + 14}M${x + w - 14} ${top}H${x + w}V${bot}H${x + w - 14}`, { stroke: color, 'stroke-width': 3, fill: 'none' });
    };
    bracket(mx, cw * 2 + 20);
    const msl = (key, x, y, fill) => { const s = slot(Mx, key, x, y, { anchor: 'middle', fill, w: 80 }); s.t.setAttribute('font-size', ms); return s; };
    [0, 1].forEach(i => [0, 1].forEach(j => msl(`a${i}${j}`, mx + 10 + cw * (j + .5), my + rh * i, LS_COLS[j])));
    bracket(mx + cw * 2 + 40, 70);
    ['x', 'y'].forEach((n, i) => T(Mx, n, { x: mx + cw * 2 + 75, y: my + rh * i, size: ms, fill: COL.chalk, font: MATH, anchor: 'middle' }).setAttribute('font-style', 'italic'));
    T(Mx, '=', { x: mx + cw * 2 + 150, y: my + rh / 2 + 10, size: ms, fill: COL.chalk, font: MATH, anchor: 'middle' });
    bracket(mx + cw * 2 + 190, 100);
    [0, 1].forEach(i => msl(`b${i}`, mx + cw * 2 + 240, my + rh * i, LS_B));
    [['A', mx + cw + 10], ['x', mx + cw * 2 + 75], ['b', mx + cw * 2 + 240]].forEach(([n, x]) => {
      const t = T(Mx, n, { x, y: my + rh + 78, size: 34, fill: COL.dim, font: MATH, anchor: 'middle', weight: n === 'x' ? 400 : 700 });
      if (n === 'x') t.setAttribute('font-style', 'italic');
    });
  }

  /* ---------- the plane: rows as lines, columns as arrows ---------- */
  const ROWV = G(P2.g, { o: view === 'col' ? 0 : 1 }), COLV = G(P2.g, { o: view === 'row' || rows === 1 ? 0 : 1 });
  if (rows === 1) COLV.style.display = 'none';
  // A hidden picture must not catch the pointer: the column arrows lie over the lines and would take their drags.
  const hits = which => { ROWV.style.pointerEvents = which === 'col' ? 'none' : ''; COLV.style.pointerEvents = which === 'row' ? 'none' : ''; };
  hits(view);
  // The part of a·x + b·y = c inside the grid, as [x1, y1, x2, y2] in plane units, or null.
  const clipLine = (a, b2, c) => {
    const ps = [];
    if (Math.abs(b2) > 1e-9) for (const X of bx) { const Y = (c - a * X) / b2; if (Y >= by[0] - 1e-9 && Y <= by[1] + 1e-9) ps.push([X, Y]); }
    if (Math.abs(a) > 1e-9) for (const Y of by) { const X = (c - b2 * Y) / a; if (X >= bx[0] - 1e-9 && X <= bx[1] + 1e-9) ps.push([X, Y]); }
    if (ps.length < 2) return null;
    ps.sort((m, n) => m[0] - n[0] || m[1] - n[1]);
    return [...ps[0], ...ps[ps.length - 1]];
  };
  const lines = RI.map(i => {
    const g = G(ROWV, {});
    const hit = path(g, '', { stroke: 'transparent', 'stroke-width': 30, fill: 'none' });
    const l = path(g, '', { stroke: LS_ROW[i], 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' });
    l.style.pointerEvents = 'none';
    return { g, hit, l };
  });
  // The meeting point's trail: dotted amber, under the point. A trail from to(…, { trail: true }) is its own path,
  // drawn from the tween's progress, so seeking shows the same frame; sys.trail(true) records the reader's moves.
  const trailG = G(ROWV, {});
  const trailAttrs = { stroke: COL.task, 'stroke-width': 5, 'stroke-dasharray': '0 13', 'stroke-linecap': 'round', fill: 'none', opacity: .75 };
  const liveTrail = path(trailG, '', trailAttrs);
  let liveOn = false, livePts = [];
  const meetBox = G(ROWV, {});   // the chapter can hide the point (meetBox) while draw() keeps setting meet itself
  const meet = G(meetBox, { o: 0 });
  meetBox.style.pointerEvents = trailG.style.pointerEvents = 'none';   // a drag at the crossing reaches the lines under it
  mk('circle', { r: 11, fill: COL.chalk, stroke: COL.board, 'stroke-width': 3 }, meet);
  const meetT = T(meet, '', { x: 18, y: -16, size: 30, fill: COL.chalk, font: MATH, weight: 600 });

  const arrowD = (xa, ya, xb, yb) => {
    const a = [PX(xa), PY(ya)], c = [PX(xb), PY(yb)], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (L < 1) return '';
    const ux = (c[0] - a[0]) / L, uy = (c[1] - a[1]) / L, hl = Math.min(18, L * .45);
    return `M${a[0]} ${a[1]}L${c[0] - ux * hl * .6} ${c[1] - uy * hl * .6}M${c[0] - hl * ux - 9 * uy} ${c[1] - hl * uy + 9 * ux}L${c[0]} ${c[1]}L${c[0] - hl * ux + 9 * uy} ${c[1] - hl * uy - 9 * ux}Z`;
  };
  const arrow = (color, w = 5, dash) => path(COLV, '', { stroke: color, fill: color, 'stroke-width': w, 'stroke-linejoin': 'round', ...(dash ? { 'stroke-dasharray': dash, 'fill-opacity': .5 } : {}) });
  const combo = [arrow(LS_COLS[0], 4, '10 8'), arrow(LS_COLS[1], 4, '10 8')];   // x·col1, then y·col2 from its tip
  const cols = [arrow(LS_COLS[0]), arrow(LS_COLS[1])], bArrow = arrow(LS_B, 6);
  const tips = [[LS_COLS[0], 'col0'], [LS_COLS[1], 'col1'], [LS_B, 'b']].map(([color, k]) => {
    const g = G(COLV, {});
    mk('circle', { r: 22, fill: 'transparent' }, g);
    const ring = mk('circle', { r: 13, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-dasharray': '4 4' }, g);
    ring.style.opacity = 0;
    return { g, ring, k };
  });
  const tipLabels = [0, 1, 2].map(() => G(COLV, {}));

  // Drag in the plane: a line slides to pass through the pointer (its right side changes);
  // an arrow tip goes to the nearest grid point (a column of A, or b).
  const dragIn = (el, onPoint) => {
    let on = false;
    el.addEventListener('pointerdown', e => { if (!live) return; e.preventDefault(); on = true; el.setPointerCapture(e.pointerId); onPoint(pt(e)); });
    el.addEventListener('pointermove', e => { if (on) onPoint(pt(e)); });
    el.addEventListener('pointerup', () => { on = false; });
    el.addEventListener('lostpointercapture', () => { on = false; });
  };
  lines.forEach(({ hit }, i) => dragIn(hit, ([X, Y]) => can(`b${i}`) && edit({ [`b${i}`]: clamp(`b${i}`, Math.round(v[`a${i}0`] * X + v[`a${i}1`] * Y)) })));
  const grid = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(n)));
  const tipKeys = { b: ['b0', 'b1'], col0: ['a00', 'a10'], col1: ['a01', 'a11'] };
  tips.forEach(({ g, k }) => dragIn(g, ([X, Y]) => {
    if (!tipKeys[k].every(can)) return;
    const x = grid(X, bx[0], bx[1]), y = grid(Y, by[0], by[1]);
    edit(k === 'b' ? { b0: x, b1: y } : k === 'col0' ? { a00: x, a10: y } : { a01: x, a11: y });
  }));

  /* ---------- one state, drawn everywhere ---------- */
  const solve = () => {
    if (rows === 1) return {};
    const det = v.a00 * v.a11 - v.a01 * v.a10;
    if (Math.abs(det) > 1e-9) return { x: (v.b0 * v.a11 - v.a01 * v.b1) / det, y: (v.a00 * v.b1 - v.b0 * v.a10) / det };
    const same = Math.abs(v.a00 * v.b1 - v.b0 * v.a10) < 1e-9 && Math.abs(v.a01 * v.b1 - v.b0 * v.a11) < 1e-9;
    return { none: !same, many: same };
  };
  const frac = n => {   // exact when the numbers are whole: a fraction in lowest terms, else one decimal
    const det = Math.round(v.a00 * v.a11 - v.a01 * v.a10), num = Math.round(n * det);
    if (!Object.values(v).every(Number.isInteger) || !det) return [fmt(n)];
    const g = gcd(Math.abs(num), Math.abs(det)) || 1, nn = num / g * Math.sign(det), dd = Math.abs(det) / g;
    return dd === 1 ? [fmt(nn)] : [nn < 0 ? '−' : '', F(Math.abs(nn), dd)];
  };
  const fracText = n => {   // the same exact value as plain text, for the label beside the meeting point: 4/3
    const f = frac(n);
    return f.length === 1 ? f[0] : f[0] + f[1].f.join('/');
  };
  let solKey = '';
  function draw() {
    slots.forEach(s => s.set());
    lines.forEach(({ hit, l }, i) => {
      const c = clipLine(v[`a${i}0`], v[`a${i}1`], v[`b${i}`]), d = c ? `M${PX(c[0])} ${PY(c[1])}L${PX(c[2])} ${PY(c[3])}` : '';
      if (l.getAttribute('d') !== d) { l.setAttribute('d', d); hit.setAttribute('d', d); }
    });
    const s = solve(), inGrid = s.x !== undefined && s.x >= bx[0] && s.x <= bx[1] && s.y >= by[0] && s.y <= by[1];
    put(meet, { x: inGrid ? PX(s.x) : 0, y: inGrid ? PY(s.y) : 0, o: inGrid ? 1 : 0 });
    setText(meetT, inGrid ? `(${fracText(s.x)}, ${fracText(s.y)})` : '');   // cleared off the grid, so a seek and a play leave the same page
    const c0 = [v.a00, v.a10], c1 = [v.a01, v.a11], bb = [v.b0, v.b1];
    [[cols[0], c0], [cols[1], c1], [bArrow, bb]].forEach(([e, [x, y]], i) => {
      e.setAttribute('d', arrowD(0, 0, x, y));
      put(tips[i].g, { x: PX(x), y: PY(y) });
      const n = Math.hypot(x, y) || 1;
      put(tipLabels[i], { x: PX(x) + x / n * 30, y: PY(y) - y / n * 30 + 10 });
    });
    const reach = s.x !== undefined && Math.abs(s.x) <= 12 && Math.abs(s.y) <= 12;
    combo[0].setAttribute('d', reach ? arrowD(0, 0, s.x * c0[0], s.x * c0[1]) : '');
    combo[1].setAttribute('d', reach ? arrowD(s.x * c0[0], s.x * c0[1], bb[0], bb[1]) : '');
    // The readout under the equations, rebuilt only when it changes.
    const txt = parts => parts.map(q => typeof q === 'string' ? q : q.f.join('/')).join('');   // a fraction part is { f: [n, d] }, not text
    const key = s.x !== undefined ? txt(frac(s.x)) + '|' + txt(frac(s.y)) : s.none ? 'none' : 'many';
    if (readout && key !== solKey) {
      solKey = key;
      sol.replaceChildren();
      const y = eq[1] + 92 + 104;
      if (s.x !== undefined) M(sol, ['x = ', ...frac(s.x), ',   y = ', ...frac(s.y)], { x: eq[0], y, size: 40, fill: COL.task, anchor: 'start' });
      else T(sol, s.none ? 'parallel lines: no solution' : 'the same line: every point on it solves both', { x: eq[0], y: y - 4, size: 32, fill: COL.task, weight: 600 });
    }
    if (liveOn && inGrid) {
      const q = livePts[livePts.length - 1];
      if (!q || Math.hypot(q[0] - s.x, q[1] - s.y) > .15) { livePts.push([s.x, s.y]); liveTrail.setAttribute('d', trailD(livePts)); }
    }
    listeners.forEach(f => f(v, s));
  }
  const trailD = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${PX(x).toFixed(1)} ${PY(y).toFixed(1)}`).join('');
  function edit(to) {
    let changed = false;
    for (const k in to) if (v[k] !== to[k]) { v[k] = to[k]; changed = true; }
    if (changed) draw();
  }
  draw();
  show(E, t0 + .2); show(Mx, t0 + .4);

  const lsMix = (from, goal, q) => Object.fromEntries(Object.keys(goal).map(k => [k, from[k] + (goal[k] - from[k]) * q]));
  // Where the lines of state w meet, or null (parallel, or off the grid).
  const meetOf = w => {
    const det = w.a00 * w.a11 - w.a01 * w.a10;
    if (Math.abs(det) < 1e-9) return null;
    const x = (w.b0 * w.a11 - w.a01 * w.b1) / det, y = (w.a00 * w.b1 - w.b0 * w.a10) / det;
    return x >= bx[0] && x <= bx[1] && y >= by[0] && y <= by[1] ? [x, y] : null;
  };

  return {
    v, P: P2, stage: holder, E, M: Mx, lines, cols, bArrow, combo, meet, meetBox, readout: sol, ROWV, COLV, solve,
    // Move the numbers to new values over dur seconds, on the beat clock (deterministic, so seeking replays it).
    // { trail: true } leaves the meeting point's dotted path for this move and returns it (hide it when done).
    to(next, at, dur = 1.2, ease = io, { trail = false } = {}) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      const goal = { ...plan };
      const tr = trail ? path(trailG, '', { ...trailAttrs }) : null;
      prog(q => {
        edit(lsMix(from, goal, q));
        if (!tr) return;
        const pts = [], n = Math.ceil(60 * q);
        for (let i = 0; i <= n; i++) { const p = meetOf(lsMix(from, goal, n ? q * i / n : 0)); if (p) pts.push(p); }
        const d = trailD(pts);
        if (tr.getAttribute('d') !== d) tr.setAttribute('d', d);
      }, at, dur, ease);
      return tr;
    },
    // Bring row i (0 or 1) forward: its equation and its line; the other row dims. focus(null, at) shows both again.
    // { lines: false } leaves the lines as they are (a beat that keeps them hidden until later).
    focus(i, at, dur = .5, { lines: withLines = true } = {}) {
      RI.forEach(j => {
        const on = i === null || i === j;
        tw(eqRows[j].g, { o: on ? 1 : .28 }, at, dur);
        if (withLines) tw(lines[j].g, { o: on ? 1 : .28 }, at, dur);
        tw(lines[j].l, { 'a_stroke-width': i === j ? 8 : 5 }, at, dur);
      });
    },
    // Record the meeting point's path while the reader moves the numbers (true), or clear it (false).
    trail(on) { liveOn = on; livePts = []; liveTrail.setAttribute('d', ''); },
    // Show the row picture, the column picture, or both.
    view(which, at, dur = .6) {
      hits(which);   // the picture that ends up shown takes the pointer
      tw(ROWV, { o: which === 'col' ? 0 : 1 }, at, dur);
      tw(COLV, { o: which === 'row' ? 0 : 1 }, at, dur);
    },
    // Hands on: scrub numbers and drag in the plane. Turned off by sys.live(false) or by leaving the beat.
    // { only: ['b0', 'b1'] } unlocks only those numbers (and only the lines and tips they move); the rest stay put.
    live(on, { only } = {}) {
      live = on;
      allowed = on && only ? new Set(only) : null;
      for (const s of slots) {
        const ok = can(s.key);
        s.box.style.cursor = ok ? 'ew-resize' : '';
        s.box.setAttribute('stroke', ok ? COL.faint : 'none');
        s.box.setAttribute('stroke-dasharray', '4 6');
        if (ok) s.box.setAttribute('tabindex', 0); else s.box.removeAttribute('tabindex');
      }
      lines.forEach(({ hit }, i) => { hit.style.cursor = can(`b${i}`) ? 'move' : ''; });
      tips.forEach(({ g, ring, k }) => { const ok = tipKeys[k].every(can); g.style.cursor = ok ? 'grab' : ''; ring.style.opacity = ok ? 1 : 0; });
    },
    set: edit,   // at once, for a reader's action or an answer shown
    num: key => slots.filter(s => s.key === key).map(s => s.t),   // every text that shows this value (to flash it)
    eqRows,
    onChange(f) { listeners.push(f); },
    labels(names) { names.forEach((n, i) => { tipLabels[i].replaceChildren(); M(tipLabels[i], [n], { size: 30, fill: [LS_COLS[0], LS_COLS[1], LS_B][i] }); }); },
  };
}

// A question that is a task on the system: the reader changes it until test(v, s) holds, then checks.
// opts.only names the numbers the reader may change (sys.live(true, { only })); opts.trail records the meeting point's path.
const lsTask = (sys, test, why, hint, reveal, { only, trail = false } = {}) => (body, api) => {
  sys.live(true, { only });
  if (trail) sys.trail?.(true);
  return {
    check: () => { const v = sys.v, s = sys.solve(), ok = test(v, s); api.grade(ok, ok ? why : typeof hint === 'function' ? hint(v, s) : hint); },   // a hint may say where the reader is now
    reveal: () => { reveal?.(); return why; },
    lock: () => sys.live(false),
    hint: [kbd('Tab'), ' pick a number ', kbd('↑'), kbd('↓'), ' change it, or drag in the picture'],
  };
};
