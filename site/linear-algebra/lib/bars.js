// Vectors with any number of numbers, drawn as bars: each number is a bar that grows up (positive) or down (negative)
// from its own zero line, with the number beside it. Entry 1 is on top, as in a written column, so reading down a
// group is a column and reading across a band is one equation (row i of every column, of A x and of b).
//
// bars(p, { A, b, mix }) draws a system A x = b as
//   x₁·[col 1] + x₂·[col 2] + … = [A x]  =/≠  [b]
// with A x (the combination, chalk) beside b (amber); b's heights are also drawn as dashed outlines on A x, so the
// reader sees each bar of A x reach its target, and a row that matches turns green with "=". Without A (A: []) it
// draws b alone, as filled amber bars: one vector, to sit beside an arrow that shows the same numbers.
// One state v (a{i}{j}, b{i}, x{j}) is drawn everywhere. The beat moves it with bars.to() (on the beat clock, so
// seeking replays it); bars.live(true, { only }) lets the reader scrub numbers (drag, or Tab then ↑/↓) and drag bars
// up and down; bars.set() changes it at once; bars.num(key) gives every text showing a value (to flash it).
// Loads after engine.js.
const BR_SUB = '₀₁₂₃₄₅₆₇₈₉';
const BR_COLS = [COL.irr, COL.real, COL.rat, '#7fd8d8'];   // columns 1–3 as style.json; column 4 teal (no hue left)

function bars(p, { A = [], b = [], mix = null, x0 = 120, top = 250, band = 110, unit = 10, bw = 40, size = 30, numbers = true,
  names = null, colors = null, gap = 28, mw = 72, t0 = .1, range = 9 } = {}) {
  const n = b.length, m = A.length ? A[0].length : 0, svg = $('stage'), listeners = [], slots = [];
  const v = {};
  for (let i = 0; i < n; i++) { v[`b${i}`] = b[i]; for (let j = 0; j < m; j++) v[`a${i}${j}`] = A[i][j]; }
  for (let j = 0; j < m; j++) v[`x${j}`] = mix ? mix[j] : 0;
  let plan = { ...v }, live = false, allowed = null;
  const can = k => live && (!allowed || allowed.has(k));
  const colorOf = j => (colors || BR_COLS)[j % 4];
  const g = G(p, { o: 0 });
  g.style.userSelect = 'none';

  const fmt = x => { const r = Math.round(x * 10) / 10, s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1); return (r < 0 ? '−' : '') + s; };
  const setText = (e, s) => { if (e.textContent !== s) e.textContent = s; };
  const att = (e, k, x) => { if (e.getAttribute(k) !== String(x)) e.setAttribute(k, x); };
  const zeroY = i => top + i * band + band / 2;
  const H = band / 2 - 8;                        // the tallest bar; a bigger number is cut there (its number still says it)
  const hOf = x => Math.max(-H, Math.min(H, x * unit));
  const ax = (s = v) => Array.from({ length: n }, (_, i) => { let t = 0; for (let j = 0; j < m; j++) t += s[`a${i}${j}`] * s[`x${j}`]; return t; });
  const close = (a, c) => Math.abs(a - c) < 1e-6;

  /* ---------- numbers you can scrub (as in linsys): drag sideways or up, or Tab to it and press ↑/↓ ---------- */
  function slot(into, key, x, y, { anchor = 'start', fill = COL.chalk, fs = size, w = fs * 1.9 } = {}) {
    const box = mk('rect', { x: anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x - 6, y: y - fs * .85, width: w + 6, height: fs * 1.15, rx: 8, fill: 'transparent' }, into);
    const t = T(into, '', { x, y, size: fs, fill, font: MATH, anchor });
    t.style.pointerEvents = 'none';   // Firefox hit-tests the text over the box: the box must get the pointer
    const s = { key, t, box, set: () => setText(t, fmt(v[key])) };
    box.setAttribute('aria-label', key);
    let drag = null;
    box.addEventListener('pointerdown', e => {
      if (!can(key)) return;
      e.preventDefault();
      drag = { x: e.clientX, y: e.clientY, from: Math.round(v[key]) };
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', e => {
      if (!drag) return;
      const k = svg.getScreenCTM().a;
      edit({ [key]: clamp(drag.from + Math.round((e.clientX - drag.x - (e.clientY - drag.y)) / k / 22)) });
    });
    const end = () => { drag = null; };
    box.addEventListener('pointerup', end);
    box.addEventListener('lostpointercapture', end);
    box.addEventListener('keydown', e => {
      if (!can(key)) return;
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); box.blur(); P.keys?.(e); return; }   // Enter checks
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();   // the player's ←/→ must not leave the beat
      edit({ [key]: clamp(Math.round(v[key]) + d) });
    });
    slots.push(s);
    return s;
  }
  const clamp = x => Math.max(-range, Math.min(range, x));

  // A bar can be dragged up and down too: the band's strip under it is its hit box.
  function grab(into, key, x, i) {
    const r = mk('rect', { x: x - bw / 2 - 6, y: top + i * band + 4, width: bw + 12, height: band - 8, fill: 'transparent' }, into);
    r.setAttribute('aria-hidden', 'true');
    let on = false;
    const to = e => {
      const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY;
      const y = q.matrixTransform(g.getScreenCTM().inverse()).y;
      edit({ [key]: clamp(Math.round((zeroY(i) - y) / unit)) });
    };
    r.addEventListener('pointerdown', e => { if (!can(key)) return; e.preventDefault(); on = true; r.setPointerCapture(e.pointerId); to(e); });
    r.addEventListener('pointermove', e => { if (on) to(e); });
    r.addEventListener('pointerup', () => { on = false; });
    r.addEventListener('lostpointercapture', () => { on = false; });
    return r;
  }

  /* ---------- the layout, left to right ---------- */
  const bracketD = (xa, xb) => { const y0 = top + 6, y1 = top + n * band - 6; return `M${xa + 12} ${y0}H${xa}V${y1}H${xa + 12}M${xb - 12} ${y0}H${xb}V${y1}H${xb - 12}`; };
  const groupW = bw + (numbers ? size * 2 : 0) + 30;   // bar, number, padding
  const mid = top + n * band / 2;
  const zeros = G(g, {});   // a faint zero line across each band: read across it and you read one equation
  const group = (gx, color, { name, keys, filled = true, num = numbers, dashed = false, grabbable = true }) => {
    const gg = G(g, {}), bx = gx + 15 + bw / 2;
    path(gg, bracketD(gx, gx + groupW), { stroke: COL.chalk, 'stroke-width': 2.5, fill: 'none', 'stroke-opacity': .8 });
    const rows = [];
    for (let i = 0; i < n; i++) {
      const bar = mk('rect', { x: bx - bw / 2, width: bw, y: zeroY(i), height: 0, rx: 3, fill: filled ? color : 'none', 'fill-opacity': .85, stroke: dashed ? color : 'none', 'stroke-width': 2.5, ...(dashed ? { 'stroke-dasharray': '6 5' } : {}) }, gg);
      bar.style.pointerEvents = 'none';
      const hit = keys && grabbable ? grab(gg, keys[i], bx, i) : null;
      const s = num ? (keys ? slot(gg, keys[i], bx + bw / 2 + 10, zeroY(i) + size * .35, { fill: color }) : { t: T(gg, '', { x: bx + bw / 2 + 10, y: zeroY(i) + size * .35, size, fill: color, font: MATH }) }) : null;
      rows.push({ bar, hit, s });
    }
    const label = name ? M(gg, [name], { x: gx + groupW / 2, y: top + n * band + 40, size: 30, fill: COL.dim, anchor: 'middle' }) : null;
    return { g: gg, rows, bx, x: gx, label };
  };
  const plusSigns = [], mixG = [], cols = [];
  let x = x0;
  for (let j = 0; j < m; j++) {
    if (j) { plusSigns.push(T(g, '+', { x: x + 4, y: mid + 14, size: 40, fill: COL.chalk, font: MATH, anchor: 'middle' })); x += gap; }
    const mg = mixG[j] = G(g, {});
    M(mg, ['x' + BR_SUB[j + 1]], { x: x + mw / 2, y: top - 12, size: 26, fill: COL.dim, anchor: 'middle' });
    slot(mg, `x${j}`, x + mw - 10, mid + size * .35, { anchor: 'end', fs: size + 6, fill: COL.chalk });
    x += mw;
    cols.push(group(x, colorOf(j), { name: names?.[j] ?? `col ${j + 1}`, keys: Array.from({ length: n }, (_, i) => `a${i}${j}`) }));
    x += groupW + gap;
  }
  let axG = null, eqs = [], eqSign = null;
  if (m) {
    eqSign = T(g, '=', { x: x, y: mid + 14, size: 40, fill: COL.chalk, font: MATH, anchor: 'middle' });
    x += gap;
    axG = group(x, COL.chalk, { name: names?.[m] ?? 'A x', keys: null });
    // b's heights over A x: dashed outlines, the targets each bar of A x must reach
    axG.goal = Array.from({ length: n }, () => { const r = mk('rect', { x: axG.bx - bw / 2 - 3, width: bw + 6, rx: 4, fill: 'none', stroke: COL.task, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, axG.g); r.style.pointerEvents = 'none'; return r; });
    x += groupW + 14;
    eqs = Array.from({ length: n }, (_, i) => T(g, '', { x: x + 22, y: zeroY(i) + Math.min(38, band * .45) * .34, size: Math.min(38, band * .45), fill: COL.dim, font: MATH, anchor: 'middle', weight: 600 }));
    x += 44;
  }
  const bG = n ? group(x, COL.task, { name: names?.[m + 1] ?? 'b', keys: Array.from({ length: n }, (_, i) => `b${i}`) }) : null;
  x += groupW;
  for (let i = 0; i < n; i++) path(zeros, `M${x0 - 10} ${zeroY(i)}H${x + 10}`, { stroke: COL.chalk, 'stroke-opacity': .12, 'stroke-width': 1.5 });

  /* ---------- one state, drawn everywhere ---------- */
  const barTo = (bar, val, dx = 0) => {
    const h = hOf(val), y = zeroY(+bar.dataset.i);
    att(bar, 'y', Math.round((h > 0 ? y - h : y) * 10) / 10);
    att(bar, 'height', Math.round(Math.abs(h) * 10) / 10);
  };
  [...cols, axG, bG].filter(Boolean).forEach(G_ => G_.rows.forEach((r, i) => { r.bar.dataset.i = i; }));
  axG?.goal.forEach((r, i) => { r.dataset.i = i; });
  function draw() {
    slots.forEach(s => s.set());
    cols.forEach((c, j) => c.rows.forEach((r, i) => barTo(r.bar, v[`a${i}${j}`])));
    bG?.rows.forEach((r, i) => barTo(r.bar, v[`b${i}`]));
    const s = ax(), ok = [];
    axG?.rows.forEach((r, i) => {
      barTo(r.bar, s[i]);
      const hit = close(s[i], v[`b${i}`]);
      ok.push(hit);
      att(r.bar, 'fill', hit ? COL.good : COL.chalk);
      if (r.s) { setText(r.s.t, fmt(s[i])); att(r.s.t, 'fill', hit ? COL.good : COL.chalk); }
      // a target of 0 is a short dashed line on the zero line
      const goal = axG.goal[i], h = hOf(v[`b${i}`]), y = zeroY(i);
      att(goal, 'y', Math.round((h > 0 ? y - h : y) * 10) / 10 - (Math.abs(h) < 1 ? 1.5 : 0));
      att(goal, 'height', Math.max(3, Math.round(Math.abs(h) * 10) / 10));
      setText(eqs[i], hit ? '=' : '≠');
      att(eqs[i], 'fill', hit ? COL.good : COL.faint);
    });
    listeners.forEach(f => f(v, s, ok.length > 0 && ok.every(Boolean)));
  }
  function edit(to) {
    let changed = false;
    for (const k in to) if (k in v && v[k] !== to[k]) { v[k] = to[k]; changed = true; }
    if (changed) draw();
  }
  draw();
  show(g, t0, .5);

  return {
    v, g, cols, ax: axG, b: bG, mixG, plusSigns, eqSign, eqs, zeros, zeroY, size,
    combo: () => ax(),
    match: () => n > 0 && m > 0 && ax().every((t, i) => close(t, v[`b${i}`])),
    // Move the numbers to new values over dur seconds, on the beat clock (deterministic, so seeking replays it).
    to(next, at, dur = 1, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      const goal = { ...plan }, keys = Object.keys(next);
      prog(q => edit(Object.fromEntries(keys.map(k => [k, from[k] + (goal[k] - from[k]) * q]))), at, dur, ease);
    },
    set(to) { edit(to); plan = { ...plan, ...to }; },   // at once, for a reader's action or an answer shown
    // Hands on: scrub numbers and drag bars. { only: ['x0', …] } unlocks only those; off with live(false) or a new beat.
    live(on, { only } = {}) {
      live = on;
      allowed = on && only ? new Set(only) : null;
      for (const s of slots) {
        const ok = can(s.key);
        s.box.style.cursor = ok ? 'ns-resize' : '';
        s.box.setAttribute('stroke', ok ? COL.faint : 'none');
        s.box.setAttribute('stroke-dasharray', '4 6');
        if (ok) s.box.setAttribute('tabindex', 0); else s.box.removeAttribute('tabindex');
      }
      [...cols, bG].filter(Boolean).forEach(c => c.rows.forEach(r => { if (r.hit) r.hit.style.cursor = can(r.s?.key ?? '') ? 'ns-resize' : ''; }));
    },
    num: key => slots.filter(s => s.key === key).map(s => s.t),
    onChange(f) { listeners.push(f); },
  };
}

// A question that is a task on the bars: the reader changes the numbers until test(v, combo, match) holds, then checks.
const barsTask = (bs, test, why, hint, reveal, { only } = {}) => (body, api) => {
  bs.live(true, { only });
  return {
    check: () => { const ok = test(bs.v, bs.combo(), bs.match()); api.grade(ok, ok ? why : typeof hint === 'function' ? hint(bs.v, bs.combo()) : hint); },
    reveal: () => { reveal?.(); return why; },
    lock: () => bs.live(false),
    hint: [kbd('Tab'), ' pick a number ', kbd('↑'), kbd('↓'), ' change it, or drag it'],
  };
};
