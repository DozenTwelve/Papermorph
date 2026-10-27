// Space in three dimensions, drawn in SVG, and lin3: the 3 × 3 twin of linsys (equations, matrix form and space).
// World axes: x to the right, y into the page (depth), z up; the floor is z = 0. The camera turns about the z axis (yaw)
// and looks down at the floor (pitch); the projection is orthographic with a gentle perspective, so the near side of
// the cube is a little larger and depth reads in motion. Everything re-projects when the camera moves: a beat turns it
// on the beat clock (view.turn, view.drift), so seeking replays it; the reader orbits it by dragging empty space while
// it is live (an ask), as an offset of its own that the beat clock never touches and a rebuilt beat starts without.
// Loads after engine.js (and linsys.js, whose lsTask works on lin3 as it is).
const S3_ROW = [COL.whole, COL.nat, COL.int], S3_COLS = [COL.irr, COL.real, COL.rat], S3_B = COL.task;
const S3_DIST = 10;   // camera distance in half-widths of the cube: larger is flatter

const S3_det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
const S3_cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const S3_dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// Rank of a matrix given as rows, by elimination.
function S3_rank(rows) {
  const m = rows.map(r => [...r]);
  let rank = 0;
  for (let c = 0; c < m[0].length && rank < m.length; c++) {
    let piv = rank;
    for (let r = rank + 1; r < m.length; r++) if (Math.abs(m[r][c]) > Math.abs(m[piv][c])) piv = r;
    if (Math.abs(m[piv][c]) < 1e-9) continue;
    [m[rank], m[piv]] = [m[piv], m[rank]];
    for (let r = 0; r < m.length; r++) if (r !== rank) { const f = m[r][c] / m[rank][c]; m[r] = m[r].map((x, j) => x - f * m[rank][j]); }
    rank++;
  }
  return rank;
}
// The part of a·x + b·y + c·z = d inside the cube ±R, as its corners in order around the edge, or null.
function S3_cut(a, b, c, d, R) {
  const n = [a, b, c];
  if (Math.hypot(a, b, c) < 1e-9) return null;
  const pts = [];
  for (let i = 0; i < 3; i++) for (const s of [-R, R]) for (const t of [-R, R]) {   // the 12 edges, axis i along each
    const A = [0, 0, 0];
    A[(i + 1) % 3] = s; A[(i + 2) % 3] = t;
    const B = [...A];
    A[i] = -R; B[i] = R;
    const fa = S3_dot(n, A) - d, fb = S3_dot(n, B) - d;
    if (fa * fb > 0 || fa === fb) continue;
    const q = fa / (fa - fb), P = A.map((x, j) => x + (B[j] - x) * q);
    if (!pts.some(o => Math.hypot(o[0] - P[0], o[1] - P[1], o[2] - P[2]) < 1e-6)) pts.push(P);
  }
  if (pts.length < 3) return null;
  const m = [0, 1, 2].map(j => pts.reduce((s, p) => s + p[j], 0) / pts.length);
  const ax = [0, 0, 0];
  ax[[0, 1, 2].reduce((lo, j) => Math.abs(n[j]) < Math.abs(n[lo]) ? j : lo, 0)] = 1;
  const u = S3_cross(n, ax), w = S3_cross(n, u), ang = p => { const r = p.map((x, j) => x - m[j]); return Math.atan2(S3_dot(w, r), S3_dot(u, r)); };
  return pts.sort((p, q) => ang(p) - ang(q));
}
// The line where two planes [a, b, c, d] meet, clipped to the cube, as [from, to], or null.
function S3_meet(P, Q, R) {
  const u = S3_cross(P, Q);
  if (Math.hypot(...u) < 1e-9) return null;
  const M = [P.slice(0, 3), Q.slice(0, 3), u], r = [P[3], Q[3], 0], D = S3_det(M);
  const o = [0, 1, 2].map(j => S3_det(M.map((row, i) => row.map((c, l) => l === j ? r[i] : c))) / D);
  let lo = -Infinity, hi = Infinity;
  for (let j = 0; j < 3; j++) {
    if (Math.abs(u[j]) < 1e-12) { if (Math.abs(o[j]) > R) return null; continue; }
    const t1 = (-R - o[j]) / u[j], t2 = (R - o[j]) / u[j];
    lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
  }
  return hi - lo > 1e-9 ? [o.map((x, j) => x + u[j] * lo), o.map((x, j) => x + u[j] * hi)] : null;
}

function space3(p, { cx = 1150, cy = 450, size = 640, range: R = 4, yaw = -30, pitch = 22, t0 = .1 } = {}) {
  const g = G(p, { o: 0 }), svg = $('stage'), k = size / (3.4 * R), dist = S3_DIST * R;
  const cam = { yaw, pitch }, user = { yaw: 0, pitch: 0 }, drifts = [], items = [], sorted = [], hooks = [];
  let plan = { yaw, pitch }, live = false, queued = false, sortKey = '', ca = 1, sa = 0, cb = 1, sb = 0;
  const PITCH = [-15, 80];

  const proj = ([x, y, z]) => {
    const xr = x * ca - y * sa, yr = x * sa + y * ca, up = z * cb + yr * sb, dep = yr * cb - z * sb, f = dist / (dist + dep);
    return [cx + k * f * xr, cy - k * f * up, dep];
  };
  // The world point shown at (sx, sy) at depth dep: a point dragged in the plane facing the reader keeps its depth.
  const unproj = (sx, sy, dep) => {
    const f = dist / (dist + dep), xr = (sx - cx) / k / f, up = (cy - sy) / k / f, yr = up * sb + dep * cb, z = up * cb - dep * sb;
    return [xr * ca + yr * sa, -xr * sa + yr * ca, z];
  };
  const n1 = n => Math.round(n * 10) / 10;
  const D = pts => pts.map((q, i) => (i ? 'L' : 'M') + n1(q[0]) + ' ' + n1(q[1])).join('');
  const att = (e, key, val) => { if (e.getAttribute(key) !== val) e.setAttribute(key, val); };
  // An arrow in screen space; its head shrinks with the arrow, so a foreshortened arrow keeps its shape.
  const arrowD = (a, c, w = 9) => {
    const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (L < 1) return '';
    const ux = (c[0] - a[0]) / L, uy = (c[1] - a[1]) / L, hl = Math.min(18, L * .45), hw = w * Math.min(1, L / 40);
    return `M${n1(a[0])} ${n1(a[1])}L${n1(c[0] - ux * hl * .6)} ${n1(c[1] - uy * hl * .6)}M${n1(c[0] - hl * ux - hw * uy)} ${n1(c[1] - hl * uy + hw * ux)}L${n1(c[0])} ${n1(c[1])}L${n1(c[0] - hl * ux + hw * uy)} ${n1(c[1] - hl * uy - hw * ux)}Z`;
  };

  // One redraw per frame however many tweens moved the camera or the data: queued, run before the browser paints.
  function redraw() {
    queued = false;
    const a = (cam.yaw + drifts.reduce((s, d) => s + d, 0) + user.yaw) * Math.PI / 180;
    const b = Math.max(PITCH[0], Math.min(PITCH[1], cam.pitch + user.pitch)) * Math.PI / 180;
    ca = Math.cos(a); sa = Math.sin(a); cb = Math.cos(b); sb = Math.sin(b);
    items.forEach(f => f());
    hooks.forEach(f => f(proj));
    // Painter's order for the polygons: far first. Each sits in a group of polygons only, so appending reorders them.
    const order = sorted.filter(it => it.e.isConnected).sort((m, n) => n.dep - m.dep), key = order.map(it => it.id).join();
    if (key !== sortKey) { sortKey = key; order.forEach(it => it.e.parentNode.appendChild(it.e)); }
  }
  const dirty = () => { if (!queued) { queued = true; queueMicrotask(redraw); } };

  /* ---------- the frame: floor grid, cube, axes ---------- */
  const orbit = mk('rect', { x: cx - size / 2 - 60, y: cy - 420, width: size + 120, height: 840, fill: 'transparent' }, g);
  const frame = G(g), content = G(g), polys = G(content);
  const floor = path(frame, '', { stroke: COL.chalk, 'stroke-opacity': .09, 'stroke-width': 1.5 });
  const cube = path(frame, '', { stroke: COL.chalk, 'stroke-opacity': .16, 'stroke-width': 1.5 });
  const C = [-R, R];
  items.push(() => {
    let d = '';
    for (let i = -R; i <= R; i++) d += D([proj([i, -R, 0]), proj([i, R, 0])]) + D([proj([-R, i, 0]), proj([R, i, 0])]);
    att(floor, 'd', d);
    d = '';
    for (const s of C) for (const t of C) d += D([proj([-R, s, t]), proj([R, s, t])]) + D([proj([s, -R, t]), proj([s, R, t])]) + D([proj([s, t, -R]), proj([s, t, R])]);
    att(cube, 'd', d);
  });
  ['x', 'y', 'z'].forEach((name, i) => {
    const at = s => { const q = [0, 0, 0]; q[i] = s; return proj(q); };
    const line = path(frame, '', { stroke: COL.chalk, fill: COL.chalk, 'stroke-width': 3 });
    const ticks = path(frame, '', { stroke: COL.dim, 'stroke-width': 2 });
    const ints = [];
    for (let j = -R; j <= R; j++) if (j) ints.push(j);
    const shown = ints.filter(j => R < 4 || j % 2 === 0), nums = shown.map(j => T(frame, num(j), { size: 17, fill: COL.dim, font: MATH, anchor: 'middle' }));
    const label = T(frame, name, { size: 32, fill: COL.chalk, font: MATH, anchor: 'middle' });
    label.setAttribute('font-style', 'italic');
    items.push(() => {
      const A = at(-R), B = at(R + .7), L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
      let nx = (A[1] - B[1]) / L, ny = (B[0] - A[0]) / L;   // the side of the axis below it, or left of an upright one
      if (ny - nx < 0) { nx = -nx; ny = -ny; }
      att(line, 'd', arrowD(A, B));
      att(ticks, 'd', ints.map(j => { const q = at(j); return D([[q[0] - nx * 6, q[1] - ny * 6], [q[0] + nx * 6, q[1] + ny * 6]]); }).join(''));
      const o = L / (2 * R + .7) < 28 ? 0 : 1;   // numbers on an axis that points at the reader would pile up
      shown.forEach((j, n) => { const q = at(j); put(nums[n], { x: n1(q[0] + nx * 20), y: n1(q[1] + ny * 20 + 6), o }); });
      const q = at(R + 1.1);
      put(label, { x: n1(q[0]), y: n1(q[1] + 11) });
    });
  });

  /* ---------- things in space: they re-project with the camera; set() moves them ---------- */
  function point(pos, { color = COL.chalk, r = 10, label = '', size: ls = 28, into = content } = {}) {
    const e = G(into, {});
    mk('circle', { r, fill: color, stroke: COL.board, 'stroke-width': 3 }, e);
    const t = T(e, label, { x: r + 8, y: -r - 6, size: ls, fill: color, font: MATH, weight: 600 });
    const it = { e, pos, t, set(q) { it.pos = q; dirty(); }, label(s) { if (t.textContent !== s) t.textContent = s; } };
    items.push(() => { const q = it.pos && proj(it.pos); put(e, q ? { x: n1(q[0]), y: n1(q[1]), o: 1 } : { o: 0 }); });
    dirty();
    return it;
  }
  function line(a, b, { color = COL.chalk, w = 3, dash, head = false, into = content } = {}) {
    const e = path(into, '', { stroke: color, 'stroke-width': w, ...(head ? { fill: color } : {}), ...(dash ? { 'stroke-dasharray': dash, 'fill-opacity': .5 } : {}) });
    const it = { e, a, b, set(a2, b2) { it.a = a2; it.b = b2; dirty(); } };
    items.push(() => {
      const A = it.a && proj(it.a), B = it.b && proj(it.b);
      att(e, 'd', !A || !B ? '' : head ? arrowD(A, B, w + 5) : D([A, B]));
    });
    dirty();
    return it;
  }
  let polyN = 0;
  function poly(pts, { color = COL.chalk, fo = .14, w = 3, into = polys } = {}) {
    const e = path(into, '', { stroke: color, fill: color, 'fill-opacity': fo, 'stroke-width': w });
    e.style.pointerEvents = 'none';
    const it = { e, pts, dep: 0, id: polyN++, set(q) { it.pts = q; dirty(); } };
    items.push(() => {
      const S = it.pts && it.pts.length > 2 ? it.pts.map(proj) : null;
      att(e, 'd', S ? D(S) + 'Z' : '');
      it.dep = S ? S.reduce((s, q) => s + q[2], 0) / S.length : 0;
    });
    sorted.push(it);
    dirty();
    return it;
  }
  // The plane a·x + b·y + c·z = d, as far as it lies inside the cube; hidden when a, b and c are all 0.
  function plane(a, b, c, d, opts) {
    const it = poly(null, opts);
    it.set = (...q) => { it.coef = q; it.pts = S3_cut(...q, R); dirty(); };
    it.set(a, b, c, d);
    return it;
  }

  /* ---------- the camera ---------- */
  // The reader turns the view by dragging empty space, only while it is live.
  let drag = null;
  orbit.addEventListener('pointerdown', e => {
    if (!live) return;
    e.preventDefault();
    drag = { x: e.clientX, y: e.clientY, yaw: user.yaw, pitch: user.pitch, k: svg.getScreenCTM().a };
    orbit.setPointerCapture(e.pointerId);
  });
  orbit.addEventListener('pointermove', e => {
    if (!drag) return;
    user.yaw = drag.yaw + (e.clientX - drag.x) / drag.k * .4;
    user.pitch = Math.max(PITCH[0] - cam.pitch, Math.min(PITCH[1] - cam.pitch, drag.pitch + (e.clientY - drag.y) / drag.k * .4));
    dirty();
  });
  const end = () => { drag = null; };
  orbit.addEventListener('pointerup', end);
  orbit.addEventListener('lostpointercapture', end);

  dirty();
  show(g, t0, .5);
  return {
    g, content, polys, k, R, proj, unproj, point, line, poly, plane,
    arrow: (a, b, opts) => line(a, b, { w: 5, ...opts, head: true }),
    seg: line,
    redraw: dirty,
    // f(proj) runs after every redraw: for chapter drawing that follows the camera (a label, a hit box).
    on(f) { hooks.push(f); dirty(); },
    // A pointer event in the view's own coordinates (the stage's, unless the panel moved).
    local(e) { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const w = q.matrixTransform(g.getScreenCTM().inverse()); return [w.x, w.y]; },
    // Turn the camera to { yaw, pitch } (degrees) over dur seconds on the beat clock, from where earlier turns left it.
    turn(next, at, dur = 1.5, ease = soft) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      const goal = { ...plan };
      prog(q => { cam.yaw = from.yaw + (goal.yaw - from.yaw) * q; cam.pitch = from.pitch + (goal.pitch - from.pitch) * q; dirty(); }, at, dur, ease);
    },
    // A slow turn about z, added to the turns: from `at` for dur seconds, or to the end of the beat without lengthening it.
    drift(degPerSec, at = 0, dur) {
      const i = drifts.push(0) - 1;
      if (dur === undefined) clockRun(t => { drifts[i] = degPerSec * Math.max(0, t - at); dirty(); }, 0, { tail: true });
      else prog(q => { drifts[i] = degPerSec * dur * q; dirty(); }, at, dur, lin);
    },
    live(on) { live = on; orbit.style.cursor = on ? 'grab' : ''; },
  };
}

/* ---------- lin3: a 3 × 3 system, equations, matrix form and space from one state ---------- */
// Every number on screen is the same value: scrub one (drag sideways, or focus it and press ↑/↓) and the planes, the
// columns and the other copy follow; drag a plane by its edge (it slides along its normal: d changes) or an arrow tip
// (it moves in the plane facing you, to the nearest lattice point) and the numbers follow.
function lin3(p, { A = [[2, -1, 0], [-1, 2, -1], [0, -3, 4]], b = [0, -1, 4], eq = [90, 180], mat = [100, 490], size = 46, space: so = {}, view = 'row', sol: readout = true, t0 = .1 } = {}) {
  const I = [0, 1, 2], v = {}, RANGE = {};
  I.forEach(i => { I.forEach(j => { v[`a${i}${j}`] = A[i][j]; RANGE[`a${i}${j}`] = 9; }); v[`b${i}`] = b[i]; RANGE[`b${i}`] = 30; });
  const V = space3(p, { t0, ...so }), R = V.R, svg = $('stage'), listeners = [], slots = [];
  let live = false, plan = { ...v };

  const fmt = (n, one = false) => {
    const r = Math.round(n * 10) / 10, s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1);
    return (r < 0 ? '−' : '') + (one && Math.abs(r) === 1 ? '' : s);
  };
  const setText = (e, s) => { if (e.textContent !== s) e.textContent = s; };
  const clamp = (key, n) => Math.max(-RANGE[key], Math.min(RANGE[key], n));
  const col = j => [v[`a0${j}`], v[`a1${j}`], v[`a2${j}`]], bv = () => [v.b0, v.b1, v.b2];
  const Am = () => I.map(i => I.map(j => v[`a${i}${j}`]));

  /* ---------- numbers you can scrub (as in linsys) ---------- */
  function slot(g, key, x, y, { anchor = 'end', letter = '', one = false, fill = COL.chalk, w = 80, fs = size } = {}) {
    const box = mk('rect', { x: anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x, y: y - fs * .85, width: w + (letter ? fs * .6 : 0), height: fs * 1.1, rx: 10, fill: 'transparent' }, g);
    const t = T(g, '', { x, y, size: fs, fill, font: MATH, anchor });
    const l = letter ? T(g, letter, { x: x + 3, y, size: fs, fill, font: MATH }) : null;
    l?.setAttribute('font-style', 'italic');
    t.style.pointerEvents = 'none';   // Firefox hit-tests the text over the box: the box must get the pointer
    if (l) l.style.pointerEvents = 'none';
    const s = { key, t, l, box, one, set: () => setText(t, fmt(v[key], one) || (one ? '' : '0')) };
    box.setAttribute('aria-label', key);
    let drag = null;
    box.addEventListener('pointerdown', e => {
      if (!live) return;
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
      if (!live) return;
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();   // the player's ←/→ must not leave the beat
      edit({ [key]: clamp(key, Math.round(v[key]) + d) });
    });
    slots.push(s);
    return s;
  }

  /* ---------- the equations: a x + b y + c z = d ---------- */
  const E = G(p, { o: 0 });
  I.forEach(i => {
    const y = eq[1] + i * 70, x = eq[0];
    mk('rect', { x: x - 34, y: y - size * .7, width: 8, height: size * .8, rx: 4, fill: S3_ROW[i] }, E);
    const terms = ['x', 'y', 'z'].map((n, j) => ({ s: slot(E, `a${i}${j}`, x + 92 + 135 * j, y, { letter: n, one: true }), sign: j ? T(E, '+', { x: x + 30 + 135 * j, y, size, fill: COL.chalk, font: MATH, anchor: 'middle' }) : null }));
    T(E, '=', { x: x + 442, y, size, fill: COL.chalk, font: MATH, anchor: 'middle' });
    slot(E, `b${i}`, x + 475, y, { anchor: 'start' });
    // Later terms show their size and the sign before them carries their sign; a term that is 0 stays, faint.
    terms.forEach(({ s, sign }, j) => {
      const key = `a${i}${j}`;
      s.set = () => {
        const n = v[key], zero = Math.round(n * 10) === 0, o = zero ? '.35' : '';
        if (sign) { setText(sign, n < 0 ? '−' : '+'); sign.style.opacity = o; }
        setText(s.t, zero ? '0' : fmt(sign ? Math.abs(n) : n, true));
        s.t.style.opacity = o; s.l.style.opacity = o;
      };
    });
  });
  const sol = G(E, {});

  /* ---------- the matrix form ---------- */
  const Mx = G(p, { o: 0 });
  if (mat) {
    const [mx, my] = mat, cw = 76, rh = 50, ms = Math.round(size * .85);
    const bracket = (x, w) => {
      const top = my - ms * .95, bot = my + 2 * rh + ms * .35;
      path(Mx, `M${x + 14} ${top}H${x}V${bot}H${x + 14}M${x + w - 14} ${top}H${x + w}V${bot}H${x + w - 14}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
    };
    bracket(mx, cw * 3 + 20);
    I.forEach(i => I.forEach(j => slot(Mx, `a${i}${j}`, mx + 10 + cw * (j + .5), my + rh * i, { anchor: 'middle', fill: S3_COLS[j], w: 66, fs: ms })));
    const xv = mx + cw * 3 + 40;
    bracket(xv, 64);
    ['x', 'y', 'z'].forEach((n, i) => T(Mx, n, { x: xv + 32, y: my + rh * i, size: ms, fill: COL.chalk, font: MATH, anchor: 'middle' }).setAttribute('font-style', 'italic'));
    T(Mx, '=', { x: xv + 110, y: my + rh + 12, size: ms, fill: COL.chalk, font: MATH, anchor: 'middle' });
    bracket(xv + 150, 96);
    I.forEach(i => slot(Mx, `b${i}`, xv + 198, my + rh * i, { anchor: 'middle', fill: S3_B, w: 80, fs: ms }));
    [['A', mx + 10 + cw * 1.5], ['x', xv + 32], ['b', xv + 198]].forEach(([n, x]) => {
      const t = T(Mx, n, { x, y: my + 2 * rh + 58, size: 28, fill: COL.dim, font: MATH, anchor: 'middle', weight: n === 'x' ? 400 : 700 });
      if (n === 'x') t.setAttribute('font-style', 'italic');
    });
  }

  /* ---------- the space: rows as planes, columns as arrows ---------- */
  const ROWV = G(V.content, { o: view === 'col' ? 0 : 1 }), COLV = G(V.content, { o: view === 'row' ? 0 : 1 });
  const usable = (g, on) => { g.style.pointerEvents = on ? '' : 'none'; };
  usable(ROWV, view !== 'col'); usable(COLV, view !== 'row');
  const planeG = G(ROWV, {});
  const planes = I.map(i => V.plane(0, 0, 0, 0, { color: S3_ROW[i], into: planeG }));
  const lines = I.map(() => V.seg(null, null, { color: COL.chalk, w: 2.5, dash: '7 7', into: ROWV }));
  lines.forEach(l => l.e.setAttribute('stroke-opacity', .75));
  const meet = V.point(null, { color: COL.chalk, r: 11, into: ROWV });
  // A plane is dragged by its edge: a wide, invisible copy of its outline.
  const hits = planes.map((pl, i) => {
    const h = path(ROWV, '', { stroke: 'transparent', 'stroke-width': 26, fill: 'none' });
    h.addEventListener('pointerenter', () => { if (live) pl.e.setAttribute('stroke-width', 6); });
    h.addEventListener('pointerleave', () => pl.e.setAttribute('stroke-width', 3));
    return h;
  });

  const combo = I.map(j => V.arrow(null, null, { color: S3_COLS[j], w: 4, dash: '10 8', into: COLV }));   // x·col1, y·col2, z·col3 tip to tail
  // b goes under the columns and wider: when b is a column (z = 1 and the rest 0) both still show
  const bArrow = V.arrow(null, null, { color: S3_B, w: 9, into: COLV }), cols = I.map(j => V.arrow(null, null, { color: S3_COLS[j], into: COLV }));
  const tipKeys = [0, 1, 2, 'b'], tipColor = [...S3_COLS, S3_B];
  const tipOf = k => k === 'b' ? bv() : col(k);
  const tips = tipKeys.map((k, n) => {
    const g = G(COLV, {});
    mk('circle', { r: 22, fill: 'transparent' }, g);
    const ring = mk('circle', { r: 13, fill: 'none', stroke: tipColor[n], 'stroke-width': 3, 'stroke-dasharray': '4 4' }, g);
    ring.style.opacity = 0;
    return { g, ring, k };
  });
  const tipLabels = tipKeys.map((k, n) => T(COLV, '', { size: 28, fill: tipColor[n], font: MATH, weight: 600 }));
  V.on(proj => {
    planes.forEach((pl, i) => { const d = pl.e.getAttribute('d'); if (hits[i].getAttribute('d') !== d) hits[i].setAttribute('d', d); });
    const O = proj([0, 0, 0]);
    tips.forEach(({ g, k }, n) => {
      const q = proj(tipOf(k)), L = Math.hypot(q[0] - O[0], q[1] - O[1]) || 1, ux = (q[0] - O[0]) / L, uy = (q[1] - O[1]) / L;
      put(g, { x: Math.round(q[0] * 10) / 10, y: Math.round(q[1] * 10) / 10 });
      // beside the tip, a column's on the arrow's right-hand side and b's on its left (b often lies along a column);
      // past the tip is where a dashed mix often runs on
      const side = k === 'b' ? -1 : 1, nx = -uy * side, ny = ux * side, t = tipLabels[n], anchor = nx > .35 ? 'start' : nx < -.35 ? 'end' : 'middle';
      if (t.getAttribute('text-anchor') !== anchor) t.setAttribute('text-anchor', anchor);
      put(t, { x: Math.round(q[0] + ux * 14 + nx * 20), y: Math.round(q[1] + uy * 14 + ny * 24 + 9) });
    });
  });

  const dragIn = (el, onDown, onMove) => {
    let on = null;
    el.addEventListener('pointerdown', e => { if (!live) return; e.preventDefault(); e.stopPropagation(); on = onDown(V.local(e)); el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (on) onMove(on, V.local(e)); });
    el.addEventListener('pointerup', () => { on = null; });
    el.addEventListener('lostpointercapture', () => { on = null; });
  };
  // A plane slides along its normal n = (a, b, c): moving it by t·n raises d by t·|n|²; t comes from the pointer's
  // motion along the normal as drawn on screen.
  hits.forEach((h, i) => dragIn(h, at => {
    const n = I.map(j => v[`a${i}${j}`]), c = planes[i].pts ? I.map(j => planes[i].pts.reduce((s, q) => s + q[j], 0) / planes[i].pts.length) : [0, 0, 0];
    const P0 = V.proj(c), P1 = V.proj(c.map((x, j) => x + n[j]));
    return { at, d0: v[`b${i}`], n2: S3_dot(n, n), ns: [P1[0] - P0[0], P1[1] - P0[1]] };
  }, (s, [x, y]) => {
    const t = ((x - s.at[0]) * s.ns[0] + (y - s.at[1]) * s.ns[1]) / Math.max(s.ns[0] ** 2 + s.ns[1] ** 2, 400);
    edit({ [`b${i}`]: clamp(`b${i}`, Math.round(s.d0 + t * s.n2)) });
  }));
  const lattice = n => Math.max(-R, Math.min(R, Math.round(n))) || 0;   // never −0
  tips.forEach(({ g, k }) => dragIn(g, () => ({ dep: V.proj(tipOf(k))[2] }), (s, [x, y]) => {
    const q = V.unproj(x, y, s.dep).map(lattice);
    edit(k === 'b' ? { b0: q[0], b1: q[1], b2: q[2] } : { [`a0${k}`]: q[0], [`a1${k}`]: q[1], [`a2${k}`]: q[2] });
  }));

  /* ---------- one state, drawn everywhere ---------- */
  const solve = () => {
    const M = Am(), bb = bv(), det = S3_det(M);
    if (Math.abs(det) > 1e-9) {
      const [x, y, z] = I.map(j => S3_det(M.map((r, i) => r.map((c, l) => l === j ? bb[i] : c))) / det);
      return { x, y, z };
    }
    const rA = S3_rank(M), rAb = S3_rank(M.map((r, i) => [...r, bb[i]]));
    return rA < rAb ? { none: true } : { many: true, rank: rA };
  };
  const exact = n => {   // a fraction in lowest terms when the numbers are whole, else one decimal
    const det = Math.round(S3_det(Am())), num = Math.round(n * det);
    if (!Object.values(v).every(Number.isInteger) || !det) return [fmt(n)];
    const g = gcd(Math.abs(num), Math.abs(det)) || 1, nn = num / g * Math.sign(det), dd = Math.abs(det) / g;
    return dd === 1 ? [fmt(nn)] : [nn < 0 ? '−' : '', F(Math.abs(nn), dd)];
  };
  const MANY = ['every point solves all three', 'infinitely many solutions: the three planes are one plane', 'infinitely many solutions: the planes share a line'];
  let solKey = '';
  function draw() {
    slots.forEach(s => s.set());
    const rows = I.map(i => [v[`a${i}0`], v[`a${i}1`], v[`a${i}2`], v[`b${i}`]]);
    planes.forEach((pl, i) => pl.set(...rows[i]));
    [[0, 1], [0, 2], [1, 2]].forEach(([i, j], n) => lines[n].set(...(S3_meet(rows[i], rows[j], R) || [null, null])));
    const s = solve(), one = s.x !== undefined, X = one ? [s.x, s.y, s.z] : null;
    const inCube = one && X.every(c => Math.abs(c) <= R + 1e-9);
    meet.set(inCube ? X : null);
    if (inCube) meet.label(`(${X.map(c => fmt(c)).join(', ')})`);
    const O = [0, 0, 0], bb = bv();
    I.forEach(j => cols[j].set(O, col(j)));
    bArrow.set(O, bb);
    const reach = one && X.every(c => Math.abs(c) <= 12);
    let at = O;
    I.forEach(j => { const nxt = j === 2 ? bb : at.map((c, l) => c + X?.[j] * col(j)[l]); combo[j].set(reach ? at : null, reach ? nxt : null); at = reach ? nxt : O; });
    const key = one ? X.map(c => exact(c).join()).join('|') : s.none ? 'none' : 'many' + s.rank;
    if (readout && key !== solKey) {
      solKey = key;
      sol.replaceChildren();
      const y = eq[1] + 2 * 70 + 78;
      if (one) M(sol, ['x = ', ...exact(s.x), ',   y = ', ...exact(s.y), ',   z = ', ...exact(s.z)], { x: eq[0], y, size: 38, fill: COL.task, anchor: 'start' });
      else T(sol, s.none ? 'no solution: no point lies on all three planes' : MANY[s.rank], { x: eq[0], y: y - 4, size: 28, fill: COL.task, weight: 600 });
    }
    listeners.forEach(f => f(v, s));
  }
  function edit(to) {
    let changed = false;
    for (const key in to) if (v[key] !== to[key]) { v[key] = to[key]; changed = true; }
    if (changed) draw();
  }
  draw();
  show(E, t0 + .2); show(Mx, t0 + .4);

  return {
    v, space: V, E, M: Mx, planes, lines, meet, cols, bArrow, combo, ROWV, COLV, solve,
    // Move the numbers to new values over dur seconds, on the beat clock (deterministic, so seeking replays it).
    to(next, at, dur = 1.2, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      const goal = { ...plan };
      prog(q => edit(Object.fromEntries(Object.keys(goal).map(key => [key, from[key] + (goal[key] - from[key]) * q]))), at, dur, ease);
    },
    // Show the row picture, the column picture, or both; only what shows can be dragged.
    view(which, at, dur = .6) {
      tw(ROWV, { o: which === 'col' ? 0 : 1 }, at, dur);
      tw(COLV, { o: which === 'row' ? 0 : 1 }, at, dur);
      prog(() => { usable(ROWV, which !== 'col'); usable(COLV, which !== 'row'); }, at, 0, lin);
    },
    // Hands on: scrub numbers, drag planes and tips, orbit the space. Turned off by sys.live(false) or by leaving the beat.
    live(on) {
      live = on;
      V.live(on);
      for (const s of slots) {
        s.box.style.cursor = on ? 'ew-resize' : '';
        s.box.setAttribute('stroke', on ? COL.faint : 'none');
        s.box.setAttribute('stroke-dasharray', '4 6');
        if (on) s.box.setAttribute('tabindex', 0); else s.box.removeAttribute('tabindex');
      }
      hits.forEach(h => { h.style.cursor = on ? 'move' : ''; });
      tips.forEach(({ g, ring }) => { g.style.cursor = on ? 'grab' : ''; ring.style.opacity = on ? 1 : 0; });
    },
    set: edit,   // at once, for a reader's action or an answer shown
    onChange(f) { listeners.push(f); },
    // Names beside the arrow tips: col 1, col 2, col 3, b.
    labels(names) { names.forEach((n, i) => { tipLabels[i].textContent = n; tipLabels[i].setAttribute('font-style', /^[a-z]$/.test(n) ? 'italic' : 'normal'); }); },
  };
}
