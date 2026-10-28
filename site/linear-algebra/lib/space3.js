// Space in three dimensions, drawn in SVG, and lin3: the 3 × 3 twin of linsys (equations, matrix form and space).
// World axes: x to the right, y into the page (depth), z up; the floor is z = 0. The camera turns about the z axis (yaw)
// and looks down at the floor (pitch; 90 looks straight down, so x runs right and y up, as in a flat 2D plane); the
// projection is orthographic with a gentle perspective, so the near side of the cube is a little larger and depth reads
// in motion. Everything re-projects when the camera moves: a beat turns it on the beat clock (view.turn, view.drift), so
// seeking replays it; the reader orbits it while it is live (an ask) by dragging empty space, or by focusing the view
// (Tab) and pressing the arrow keys, as an offset of its own that the beat clock never touches.
// Planes are cut along the lines where they meet each other and the pieces are painted far to near, so the plane in
// front covers the one behind; plane.fade(k) and lin3's focus() light one plane and dim the others.
// Loads after engine.js (and linsys.js, whose lsTask works on lin3 as it is; lin3Task adds the 3D keys to its hint).
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
// The part of a convex polygon on one side (s = 1 or −1) of the plane n·p = d.
function S3_half(poly, n, d, s) {
  const out = [], f = p => s * (S3_dot(n, p) - d);
  poly.forEach((P, i) => {
    const Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
    if (fp >= -1e-9) out.push(P);
    if ((fp > 1e-9 && fq < -1e-9) || (fp < -1e-9 && fq > 1e-9)) { const t = fp / (fp - fq); out.push(P.map((x, j) => x + (Q[j] - x) * t)); }
  });
  return out.length > 2 ? out : null;
}
// The segment a–b clipped to the cube ±R, or null.
function S3_clipSeg(a, b, R) {
  let lo = 0, hi = 1;
  for (let j = 0; j < 3; j++) {
    const d = b[j] - a[j];
    if (Math.abs(d) < 1e-12) { if (Math.abs(a[j]) > R + 1e-9) return null; continue; }
    const t1 = (-R - a[j]) / d, t2 = (R - a[j]) / d;
    lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
  }
  return hi - lo > 1e-9 ? [a.map((x, j) => x + (b[j] - x) * lo), a.map((x, j) => x + (b[j] - x) * hi)] : null;
}

// Labels that place themselves. S3_hitSeg: does the segment [[x0, y0], [x1, y1]] touch the box [x0, y0, x1, y1]?
function S3_hitSeg(r, [[x0, y0], [x1, y1]]) {
  let lo = 0, hi = 1;
  const dx = x1 - x0, dy = y1 - y0;
  for (const [p, q] of [[-dx, x0 - r[0]], [dx, r[2] - x0], [-dy, y0 - r[1]], [dy, r[3] - y0]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > hi) return false; lo = Math.max(lo, t); } else { if (t < lo) return false; hi = Math.min(hi, t); }
  }
  return true;
}
// Of the candidate boxes, the index of the one that covers the obstacles least (boxes by overlapping area, segments
// such as the axes by crossing), the earliest on a tie; bounds [x0, y0, x1, y1]: what falls outside counts too.
function S3_pick(cands, boxes, segs = [], bounds = null) {
  let best = 0, low = Infinity;
  cands.forEach((r, k) => {
    let s = k * 4;
    for (const o of boxes) { const w = Math.min(r[2], o[2]) - Math.max(r[0], o[0]), h = Math.min(r[3], o[3]) - Math.max(r[1], o[1]); if (w > 0 && h > 0) s += w * h; }
    for (const g of segs) if (S3_hitSeg(r, g)) s += 160;
    if (bounds) s += 40 * (Math.max(0, bounds[0] - r[0]) + Math.max(0, r[2] - bounds[2]) + Math.max(0, bounds[1] - r[1]) + Math.max(0, r[3] - bounds[3]));
    if (s < low) { low = s; best = k; }
  });
  return best;
}

function space3(p, { cx = 1150, cy = 450, size = 640, range: R = 4, yaw = -30, pitch = 22, t0 = .1 } = {}) {
  const g = G(p, { o: 0 }), svg = $('stage'), k = size / (3.4 * R), dist = S3_DIST * R;
  const cam = { yaw, pitch }, user = { yaw: 0, pitch: 0 }, drifts = [], items = [], sorted = [], hooks = [], avoids = [], planeItems = [];
  let plan = { yaw, pitch }, live = false, queued = false, sortKey = '', ca = 1, sa = 0, cb = 1, sb = 0;
  const PITCH = [-15, 80];   // what the reader may reach; a beat may turn the camera up to 90 (straight down)

  const proj = ([x, y, z]) => {
    const xr = x * ca - y * sa, yr = x * sa + y * ca, up = z * cb + yr * sb, dep = yr * cb - z * sb, f = dist / (dist + dep);
    return [cx + k * f * xr, cy - k * f * up, dep];
  };
  // The world point shown at (sx, sy) at depth dep.
  const unproj = (sx, sy, dep) => {
    const f = dist / (dist + dep), xr = (sx - cx) / k / f, up = (cy - sy) / k / f, yr = up * sb + dep * cb, z = up * cb - dep * sb;
    return [xr * ca + yr * sa, -xr * sa + yr * ca, z];
  };
  const n1 = n => Math.round(n * 10) / 10;
  const D = pts => pts.map((q, i) => (i ? 'L' : 'M') + n1(q[0]) + ' ' + n1(q[1])).join('');
  const att = (e, key, val) => { if (e.getAttribute(key) !== String(val)) e.setAttribute(key, val); };
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
    const b = Math.max(PITCH[0], Math.min(90, cam.pitch + user.pitch)) * Math.PI / 180;
    ca = Math.cos(a); sa = Math.sin(a); cb = Math.cos(b); sb = Math.sin(b);
    planeItems.forEach(cutPlane);
    items.forEach(f => f());
    hooks.forEach(f => f(proj));
    // Painter's order for the polygons: far first. Each sits in a group of polygons only, so appending reorders them.
    const order = sorted.filter(it => it.e.isConnected && it.on !== false).sort((m, n) => n.dep - m.dep), key = order.map(it => it.id).join();
    if (key !== sortKey) { sortKey = key; order.forEach(it => it.e.parentNode.appendChild(it.e)); }
  }
  const dirty = () => { if (!queued) { queued = true; queueMicrotask(redraw); } };

  /* ---------- the frame: floor grid, cube, axes ---------- */
  const orbit = mk('rect', { x: cx - size / 2 - 60, y: cy - 420, width: size + 120, height: 840, fill: 'transparent', rx: 18 }, g);
  orbit.setAttribute('aria-label', '3D view: drag, or press the arrow keys, to turn it');
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
  // Each axis in its own group (V.axes[i]), so a beat can bring them in one at a time.
  const axes = ['x', 'y', 'z'].map((name, i) => {
    const ag = G(frame, {}), at = s => { const q = [0, 0, 0]; q[i] = s; return proj(q); };
    const line = path(ag, '', { stroke: COL.chalk, fill: COL.chalk, 'stroke-width': 3 });
    const ticks = path(ag, '', { stroke: COL.dim, 'stroke-width': 2 });
    const ints = [];
    for (let j = -R; j <= R; j++) if (j) ints.push(j);
    const shown = ints.filter(j => R < 4 || j % 2 === 0), nums = shown.map(j => T(ag, num(j), { size: 17, fill: COL.dim, font: MATH, anchor: 'middle' }));
    const label = T(ag, name, { size: 32, fill: COL.chalk, font: MATH, anchor: 'middle' });
    label.setAttribute('font-style', 'italic');
    return { g: ag, at, line, ticks, ints, shown, nums, label };
  });
  items.push(() => {
    // labels first, so that tick numbers can keep clear of every label (an axis label, a tip label)
    const lab = axes.map(A => {
      const q = A.at(R + 1.1), L = Math.hypot(...[0, 1].map(j => A.at(R)[j] - A.at(-R)[j])) / (2 * R);
      return { x: q[0], y: q[1], o: L < 9 ? 0 : 1 };   // an axis pointing straight at the reader has no room for its name
    });
    const avoidPts = avoids.flatMap(f => f(proj) || []);
    const placed = placeLabels(proj, lab, avoidPts);
    const keep = [...lab.filter(l => l.o).map(l => [l.x, l.y - 11]), ...avoidPts,
      ...placed.flatMap(b => { const ks = [], y = (b[1] + b[3]) / 2; for (let x = b[0] + 10; x < b[2]; x += 28) ks.push([x, y]); return ks; })];
    axes.forEach((A, i) => {
      const P = A.at(-R), B = A.at(R + .7), L = Math.hypot(B[0] - P[0], B[1] - P[1]) || 1;
      let nx = (P[1] - B[1]) / L, ny = (B[0] - P[0]) / L;   // the side of the axis below it, or left of an upright one
      if (ny - nx < 0) { nx = -nx; ny = -ny; }
      att(A.line, 'd', arrowD(P, B));
      att(A.ticks, 'd', A.ints.map(j => { const q = A.at(j); return D([[q[0] - nx * 6, q[1] - ny * 6], [q[0] + nx * 6, q[1] + ny * 6]]); }).join(''));
      const crowded = L / (2 * R + .7) < 28;   // numbers on an axis that points at the reader would pile up
      A.shown.forEach((j, n) => {
        const q = A.at(j), x = q[0] + nx * 20, y = q[1] + ny * 20;
        const near = keep.some(([kx, ky]) => Math.abs(kx - x) < 34 && Math.abs(ky - y) < 24);
        put(A.nums[n], { x: n1(x), y: n1(y + 6), o: crowded || near ? 0 : 1 });
      });
      put(A.label, { x: n1(lab[i].x), y: n1(lab[i].y + 11), o: lab[i].o });
    });
  });

  // Point labels without dx/dy place themselves each redraw: of six spots round the dot (above right first), the one
  // that covers least of the axes, their names, the other dots and labels and the arrow-tip labels (avoid), and stays
  // inside the view. Returns every visible label's box, so tick numbers can step aside.
  const pts = [];
  const seen = e => { for (let n = e; n && n !== g; n = n.parentNode) if (n._st && n._st.o < .05) return false; return true; };
  function placeLabels(proj, lab, avoidPts) {
    // a dot just given a position is still hidden until its own redraw below: it counts as shown
    const vis = pts.filter(it => it.pos && (it.hid || st(it.e).o >= .05) && seen(it.e.parentNode)), out = [];
    const named = it => it.t.textContent.trim() && st(it.t).o >= .05;
    const segs = axes.filter(A => seen(A.g)).map(A => [A.at(-R), A.at(R + .7)]);
    const boxes = [...lab.filter(l => l.o).map(l => [l.x - 13, l.y - 15, l.x + 13, l.y + 14]),
      ...avoidPts.map(([x, y]) => [x - 30, y - 12, x + 30, y + 10]),
      ...vis.map(it => { const q = proj(it.pos); return [q[0] - it.r - 2, q[1] - it.r - 2, q[0] + it.r + 2, q[1] + it.r + 2]; })];
    const bounds = [cx - size / 2 - 60, cy - 420, cx + size / 2 + 60, cy + 420];
    const boxAt = (it, q, [ox, oy]) => { const w = it.t.textContent.length * it.ls * .5; return [q[0] + ox, q[1] + oy - it.ls * .78, q[0] + ox + w, q[1] + oy + it.ls * .22]; };
    vis.filter(it => !it.auto && named(it)).forEach(it => { const b = boxAt(it, proj(it.pos), it.off); boxes.push(b); out.push(b); });
    vis.filter(it => it.auto && named(it)).forEach(it => {
      const q = proj(it.pos), r = it.r, ls = it.ls, w = it.t.textContent.length * ls * .5;
      const offs = [[r + 6, -r - 4], [r + 6, r + ls * .8], [-r - 6 - w, -r - 4], [-r - 6 - w, r + ls * .8], [-w / 2, -r - 8], [-w / 2, r + ls * .85 + 2]];
      const cands = offs.map(o => boxAt(it, q, o)), k = S3_pick(cands, boxes, segs, bounds);
      it.off = offs[k];
      boxes.push(cands[k]); out.push(cands[k]);
    });
    return out;
  }

  /* ---------- things in space: they re-project with the camera; set() moves them ---------- */
  // A dot with a label; stem: true adds its shadow on the floor and a dashed line down to it, so its height reads.
  // Without dx/dy the label finds a free spot round the dot by itself.
  // halo: a dark rim round the label's letters, so it stays readable over a plane's edge or an axis.
  function point(pos, { color = COL.chalk, r = 10, label = '', size: ls = 28, into = content, stem = false, dx, dy, halo = false } = {}) {
    const e = G(into, {});
    const st_ = stem ? path(into, '', { stroke: color, 'stroke-width': 2, 'stroke-dasharray': '5 6', 'stroke-opacity': .7, fill: 'none' }) : null;
    const sh = stem ? mk('ellipse', { rx: 7, ry: 3.5, fill: color, 'fill-opacity': .45 }, into) : null;
    if (st_) into.insertBefore(st_, e), into.insertBefore(sh, e);
    mk('circle', { r, fill: color, stroke: COL.board, 'stroke-width': 3 }, e);
    const t = T(e, label, { x: dx ?? r + 8, y: dy ?? -r - 6, size: ls, fill: color, font: MATH, weight: 600 });
    if (halo) for (const [k, v] of Object.entries({ stroke: COL.board, 'stroke-width': 6, 'stroke-linejoin': 'round', 'paint-order': 'stroke' })) t.setAttribute(k, v);
    const it = { e, pos, t, stemEl: st_, set(q) { it.pos = q; dirty(); }, label(s) { if (t.textContent !== s) { t.textContent = s; dirty(); } } };
    Object.assign(it, { r, ls, auto: dx === undefined && dy === undefined, off: [dx ?? r + 8, dy ?? -r - 6] });
    pts.push(it);
    items.push(() => {
      if (it.auto) { const s = st(t), ox = n1(it.off[0]), oy = n1(it.off[1]); if (s.x !== ox || s.y !== oy) put(t, { x: ox, y: oy }); }
      // hidden while pos is null; otherwise its opacity is the beat's to tween
      const q = it.pos && proj(it.pos);
      if (!q) { if (!it.hid) { it.hid = 1; put(e, { o: 0 }); } } else { put(e, { x: n1(q[0]), y: n1(q[1]), ...(it.hid ? { o: 1 } : {}) }); it.hid = 0; }
      if (st_) {
        const f = it.pos && Math.abs(it.pos[2]) > .05 ? proj([it.pos[0], it.pos[1], 0]) : null;
        att(st_, 'd', f ? D([q, f]) : '');
        if (f) { sh.setAttribute('cx', n1(f[0])); sh.setAttribute('cy', n1(f[1])); }
        sh.style.opacity = f ? 1 : 0;
      }
    });
    dirty();
    return it;
  }
  function line(a, b, { color = COL.chalk, w = 3, dash, head = false, into = content, clip = false } = {}) {
    const e = path(into, '', { stroke: color, 'stroke-width': w, ...(head ? { fill: color } : {}), ...(dash ? { 'stroke-dasharray': dash, 'fill-opacity': .5 } : {}) });
    const it = { e, a, b, set(a2, b2) { it.a = a2; it.b = b2; dirty(); } };
    items.push(() => {
      // clip: true keeps the part inside the cube (one unit of margin), so a long path never leaves the stage
      const s = it.a && it.b ? (clip ? S3_clipSeg(it.a, it.b, R + 1) : [it.a, it.b]) : null;
      const cut = s && clip && Math.hypot(...s[1].map((x, j) => x - it.b[j])) > 1e-6;
      const A = s && proj(s[0]), B = s && proj(s[1]);
      att(e, 'd', !s ? '' : head && !cut ? arrowD(A, B, w + 5) : D([A, B]));
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
  // The plane a·x + b·y + c·z = d, as far as it lies inside the cube; hidden when a, b and c are all 0. It is drawn
  // as pieces, cut where other planes (visible ones) cross it, each piece in painter's order; e is its whole outline
  // (not painted), for hit boxes. fade(k, at, dur) dims it (1 full, 0.2 a ghost); width(w) thickens its edges.
  function plane(a, b, c, d, { color = COL.chalk, fo = .2, w = 3, into = polys } = {}) {
    const e = path(into, '', { stroke: 'none', fill: 'none' });
    e.style.pointerEvents = 'none';
    let kPlan = 1;
    const it = {
      e, color, fo, w, into, k: 1, visible: true, coef: null, pts: null, frags: [],
      set(...q) { it.coef = q; it.pts = S3_cut(...q, R); dirty(); },
      fade(to, at, dur = .6) { const from = kPlan; kPlan = to; prog(q => { it.k = from + (to - from) * q; dirty(); }, at, dur); },
      width(px) { it.w = px; dirty(); },
    };
    planeItems.push(it);
    it.set(a, b, c, d);
    return it;
  }
  function cutPlane(it) {
    let pieces = it.pts && it.visible ? [it.pts] : [];
    const n = it.coef && it.coef.slice(0, 3);
    for (const o of planeItems) {
      if (o === it || !o.pts || !o.visible || o.k < .02 || !pieces.length) continue;   // a faded-out plane cuts nothing
      const m = o.coef.slice(0, 3), L = Math.hypot(...m);
      if (Math.hypot(...S3_cross(n, m)) < 1e-9 * L * Math.hypot(...n) + 1e-12) continue;   // parallel: no cut
      const mn = m.map(x => x / L), dn = o.coef[3] / L;
      pieces = pieces.flatMap(pc => [S3_half(pc, mn, dn, 1), S3_half(pc, mn, dn, -1)].filter(Boolean));
    }
    att(it.e, 'd', it.pts && it.visible ? D(it.pts.map(proj)) + 'Z' : '');
    pieces.forEach((pc, i) => {
      if (!it.frags[i]) {
        const fe = path(it.into, '', { stroke: it.color, fill: it.color, 'stroke-linejoin': 'round' });
        fe.style.pointerEvents = 'none';
        it.frags[i] = { e: fe, dep: 0, id: polyN++ };
        sorted.push(it.frags[i]);
      }
      const f = it.frags[i], S = pc.map(proj);
      f.on = true;
      att(f.e, 'd', D(S) + 'Z');
      att(f.e, 'fill-opacity', n1(it.fo * it.k * 100) / 100);
      att(f.e, 'stroke-opacity', n1(it.k * 100) / 100);
      att(f.e, 'stroke-width', it.w);
      f.dep = S.reduce((s, q) => s + q[2], 0) / S.length;
    });
    it.frags.slice(pieces.length).forEach(f => { f.on = false; att(f.e, 'd', ''); });
  }
  // A walk from the origin to pos: along x, then along y, then up (or down) z, each leg drawn on in turn from t0 (dur
  // in all), or each from its own time (at: [tx, ty, tz], legs of dur / 3), ending in a dot. The legs stay; returns
  // { legs, dot, end } (end: when the dot lands). A leg of length 0 is skipped.
  function walk(pos, t0, { dur = 2.4, at, colors = [COL.whole, COL.nat, COL.int], color = COL.task, label = '', into = content, w = 5, dot: withDot = true } = {}) {
    const corners = [[0, 0, 0], [pos[0], 0, 0], [pos[0], pos[1], 0], pos];
    const lens = [0, 1, 2].map(j => Math.abs(pos[j])), total = lens.reduce((s, x) => s + x, 0) || 1;
    let t = t0;
    const legs = [0, 1, 2].map(j => {
      const l = line(null, null, { color: colors[j], w, into });
      l.e.setAttribute('stroke-linecap', 'round');
      const d = !lens[j] ? 0 : at ? dur / 3 : .25 + dur * .8 * lens[j] / total, from = corners[j], to = corners[j + 1];
      if (at) t = at[j];
      if (d) prog(q => l.set(from, from.map((x, i) => x + (to[i] - x) * q)), t, d, at ? io : lin);
      t += d + (d && !at ? .12 : 0);
      return l;
    });
    const dt = withDot ? point(null, { color, label, into }) : null;
    if (dt) { prog(() => dt.set(pos), t, 0, lin); pulse(dt.e, t); }
    return { legs, dot: dt, end: t };
  }

  /* ---------- the camera ---------- */
  // The reader turns the view by dragging empty space, or with the arrow keys once the view has focus; only while live.
  let drag = null;
  const turnBy = (dy, dp) => {
    user.yaw += dy;
    user.pitch = Math.max(PITCH[0] - cam.pitch, Math.min(PITCH[1] - cam.pitch, user.pitch + dp));
    dirty();
  };
  orbit.addEventListener('pointerdown', e => {
    if (!live) return;
    e.preventDefault();
    drag = { x: e.clientX, y: e.clientY, yaw: user.yaw, pitch: user.pitch, k: svg.getScreenCTM().a };
    orbit.setPointerCapture(e.pointerId);
  });
  orbit.addEventListener('pointermove', e => {
    if (!drag) return;
    user.yaw = drag.yaw; user.pitch = drag.pitch;
    turnBy((e.clientX - drag.x) / drag.k * .4, (e.clientY - drag.y) / drag.k * .4);
  });
  const end = () => { drag = null; };
  orbit.addEventListener('pointerup', end);
  orbit.addEventListener('lostpointercapture', end);
  orbit.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); e.currentTarget.blur(); P.keys?.(e); return; }   // Enter checks (or goes on), as in an answer box
    if (!live) return;
    const d = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
    if (!d) return;
    e.preventDefault(); e.stopPropagation();   // the player's ←/→ must not leave the beat
    turnBy(...d);
  });
  orbit.addEventListener('focus', () => { if (live) { orbit.setAttribute('stroke', COL.faint); orbit.setAttribute('stroke-dasharray', '6 8'); } });
  orbit.addEventListener('blur', () => orbit.removeAttribute('stroke'));

  dirty();
  show(g, t0, .5);
  return {
    g, content, polys, frame, k, R, proj, unproj, point, line, poly, plane, walk,
    floor, cube, axes: axes.map(A => A.g),
    arrow: (a, b, opts) => line(a, b, { w: 5, ...opts, head: true }),
    seg: line,
    redraw: dirty,
    // f(proj) runs after every redraw: for chapter drawing that follows the camera (a label, a hit box).
    on(f) { hooks.push(f); dirty(); },
    // f(proj) returns screen points of labels drawn over the view; axis numbers near them step aside (hide).
    avoid(f) { avoids.push(f); dirty(); },
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
    // A gentle sway about z (amp degrees, period seconds) from `at` to the end of the beat: the view never stands still,
    // so depth keeps reading, yet the picture stays near the angle a beat chose.
    sway(amp = 6, period = 14, at = 0) {
      const i = drifts.push(0) - 1;
      clockRun(t => { drifts[i] = amp * Math.sin(2 * Math.PI * Math.max(0, t - at) / period); dirty(); }, 0, { tail: true });
    },
    live(on) {
      live = on;
      orbit.style.cursor = on ? 'grab' : '';
      if (on) orbit.setAttribute('tabindex', 0); else { orbit.removeAttribute('tabindex'); orbit.removeAttribute('stroke'); }
    },
  };
}

/* ---------- lin3: a 3 × 3 system, equations, matrix form and space from one state ---------- */
// Every number on screen is the same value: scrub one (drag sideways, or focus it and press ↑/↓) and the planes, the
// columns and the other copies follow; drag a plane by its edge (it slides along its normal: d changes) or an arrow tip
// and the numbers follow. A tip moves along one axis per drag (the axis nearest the pointer's first motion, shown as a
// guide), from lattice point to lattice point; focused, ←/→ move it along x, ↑/↓ along z, Shift+↑/↓ (or PgUp/PgDn)
// along y.
// rows: 1 shows only the first equation and its plane. mix: [x, y] adds the column form
// x·[col 1] + y·[col 2] + z·[col 3] = [b] there, with x, y, z (keys x0, x1, x2) scrubbable: changing them (or A) moves
// b to A times the mix; changing b solves for the mix again. mixAt: when the column form fades in (false: never by
// itself).
function lin3(p, { A = [[2, -1, 0], [-1, 2, -1], [0, -3, 4]], b = [0, -1, 4], eq = [90, 180], mat = [100, 490], size = 46, space: so = {}, view = 'row', sol: readout = true, rows = 3, mix = null, mixAt, focusDim = .18, t0 = .1 } = {}) {
  const I = [0, 1, 2], RI = I.slice(0, rows), v = {}, RANGE = {};
  I.forEach(i => { I.forEach(j => { v[`a${i}${j}`] = A[i][j]; RANGE[`a${i}${j}`] = 9; }); v[`b${i}`] = b[i]; RANGE[`b${i}`] = 30; });
  if (rows < 3) { mat = null; readout = false; }
  const V = space3(p, { t0, ...so }), R = V.R, svg = $('stage'), listeners = [], slots = [];
  let live = false;

  const fmt = (n, one = false) => {
    const r = Math.round(n * 10) / 10, s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1);
    return (r < 0 ? '−' : '') + (one && Math.abs(r) === 1 ? '' : s);
  };
  const setText = (e, s) => { if (e.textContent !== s) e.textContent = s; };
  let moving = false;
  // A value at rest that is a fraction with a small denominator, as [numerator, denominator], else null: 2.5 is 5/2.
  const niceFrac = (n, maxQ = 12) => {
    if (moving || Math.abs(n - Math.round(n)) < 5e-6) return null;   // a whole number, or as good as
    for (let q = 2; q <= maxQ; q++) { const k = Math.round(n * q); if (Math.abs(n * q - k) < 5e-6) return [k, q]; }
    return null;
  };
  const clamp = (key, n) => Math.max(-RANGE[key], Math.min(RANGE[key], n));
  const Am = (s = v) => I.map(i => I.map(j => s[`a${i}${j}`]));
  const col = j => [v[`a0${j}`], v[`a1${j}`], v[`a2${j}`]], bv = () => [v.b0, v.b1, v.b2];
  const solveOf = s => {
    const M = Am(s), bb = [s.b0, s.b1, s.b2], det = S3_det(M);
    if (Math.abs(det) > 1e-9) {
      const [x, y, z] = I.map(j => S3_det(M.map((r, i) => r.map((c, l) => l === j ? bb[i] : c))) / det);
      return { x, y, z };
    }
    const rA = S3_rank(M), rAb = S3_rank(M.map((r, i) => [...r, bb[i]]));
    return rA < rAb ? { none: true } : { many: true, rank: rA };
  };
  // In mix mode the mix and b are tied: a changed mix (or A) moves b; a changed b alone re-solves the mix.
  const derive = (s, changed) => {
    if (!mix) return;
    if (changed.some(k => k[0] === 'x' || k[0] === 'a')) I.forEach(i => { s[`b${i}`] = I.reduce((t, j) => t + s[`a${i}${j}`] * s[`x${j}`], 0); });
    else if (changed.some(k => k[0] === 'b')) { const r = solveOf(s); if (r.x !== undefined) [s.x0, s.x1, s.x2] = [r.x, r.y, r.z]; }
  };
  if (mix) { const r = solveOf(v); [v.x0, v.x1, v.x2] = r.x !== undefined ? [r.x, r.y, r.z] : [0, 0, 0]; I.forEach(j => { RANGE[`x${j}`] = 9; }); }
  let plan = { ...v };

  /* ---------- numbers you can scrub (as in linsys) ---------- */
  function slot(g, key, x, y, { anchor = 'end', letter = '', one = false, fill = COL.chalk, w = 80, fs = size } = {}) {
    const box = mk('rect', { x: anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x, y: y - fs * .85, width: w + (letter ? fs * .6 : 0), height: fs * 1.1, rx: 10, fill: 'transparent' }, g);
    const t = T(g, '', { x, y, size: fs, fill, font: MATH, anchor });
    const l = letter ? T(g, letter, { x: x + 3, y, size: fs, fill, font: MATH }) : null;
    l?.setAttribute('font-style', 'italic');
    t.style.pointerEvents = 'none';   // Firefox hit-tests the text over the box: the box must get the pointer
    if (l) l.style.pointerEvents = 'none';
    // A fraction at rest is drawn stacked in its own group beside the (then empty) text; a value moving shows one decimal.
    const fg = G(g, {}); fg.style.pointerEvents = 'none'; fg.classList.add('ls-frac');
    let fkey = '';
    const show = (n, one1) => {
      const q = niceFrac(n), k = q ? q.join('/') + (t.getAttribute('font-size') || fs) : '';
      setText(t, q ? '' : fmt(n, one1) || (one1 ? '' : '0'));
      if (k === fkey) return;
      fkey = k; fg.replaceChildren();
      if (q) M(fg, [q[0] < 0 ? '−' : '', F(Math.abs(q[0]), q[1])], { x, y, size: +(t.getAttribute('font-size') || fs), fill, anchor });
    };
    const s = { key, t, l, box, one, show, frac: fg, set: () => show(v[key], one) };
    box.setAttribute('aria-label', key);
    let drag = null;
    box.addEventListener('pointerdown', e => {
      if (!live || s.locked) return;
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
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); e.currentTarget.blur(); P.keys?.(e); return; }   // Enter checks (or goes on), as in an answer box
      if (!live || s.locked) return;
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();   // the player's ←/→ must not leave the beat
      edit({ [key]: clamp(key, Math.round(v[key]) + d) });
    });
    slots.push(s);
    return s;
  }

  /* ---------- the equations: a x + b y + c z = d ---------- */
  const E = G(p, { o: 0 }), rowG = [];
  RI.forEach(i => {
    const y = eq[1] + i * 70, x = eq[0], R_ = rowG[i] = G(E, {});
    mk('rect', { x: x - 34, y: y - size * .7, width: 8, height: size * .8, rx: 4, fill: S3_ROW[i] }, R_);
    const terms = ['x', 'y', 'z'].map((n, j) => ({ s: slot(R_, `a${i}${j}`, x + 92 + 135 * j, y, { letter: n, one: true }), sign: j ? T(R_, '+', { x: x + 30 + 135 * j, y, size, fill: COL.chalk, font: MATH, anchor: 'middle' }) : null }));
    T(R_, '=', { x: x + 442, y, size, fill: COL.chalk, font: MATH, anchor: 'middle' });
    slot(R_, `b${i}`, x + 475, y, { anchor: 'start' });
    // Later terms show their size and the sign before them carries their sign; a term that is 0 stays, faint.
    terms.forEach(({ s, sign }, j) => {
      const key = `a${i}${j}`;
      s.set = () => {
        // whole numbers while moving (a passing 2.3 would run into the sign); a fraction at rest exactly (5/2)
        const n = niceFrac(v[key]) ? v[key] : Math.round(v[key]), zero = n === 0, o = zero ? '.35' : '';
        if (sign) { setText(sign, n < 0 ? '−' : '+'); sign.style.opacity = o; }
        s.show(sign ? Math.abs(n) : n, true);
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

  /* ---------- the column form: x·[col 1] + y·[col 2] + z·[col 3] = [b] ---------- */
  const CF = G(p, { o: 0 }), mixG = [], colG = [], cfB = G(CF, {});
  if (mix) {
    const [fx_, fy] = mix, ms = Math.round(size * .85), rh = 50, top = fy - ms * .95, bot = fy + 2 * rh + ms * .35, cw = 66;
    const bracket = (g, x, w) => path(g, `M${x + 12} ${top}H${x}V${bot}H${x + 12}M${x + w - 12} ${top}H${x + w}V${bot}H${x + w - 12}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
    let x = fx_;
    I.forEach(j => {
      if (j) { T(CF, '+', { x: x + 26, y: fy + rh + 12, size: ms, fill: COL.chalk, font: MATH, anchor: 'middle' }); x += 38; }
      mixG[j] = G(CF, {});
      slot(mixG[j], `x${j}`, x + 56, fy + rh + 12, { anchor: 'end', fill: COL.chalk, w: 62, fs: ms });
      colG[j] = G(CF, {});
      bracket(colG[j], x + 64, cw);
      I.forEach(i => slot(colG[j], `a${i}${j}`, x + 64 + cw / 2, fy + rh * i, { anchor: 'middle', fill: S3_COLS[j], w: 56, fs: ms }));
      x += 64 + cw + 6;
    });
    T(CF, '=', { x: x + 23, y: fy + rh + 12, size: ms, fill: COL.chalk, font: MATH, anchor: 'middle' });
    bracket(cfB, x + 52, 84);
    I.forEach(i => slot(cfB, `b${i}`, x + 94, fy + rh * i, { anchor: 'middle', fill: S3_B, w: 72, fs: ms }));
  }

  /* ---------- the space: rows as planes, columns as arrows ---------- */
  const ROWV = G(V.content, { o: view === 'col' ? 0 : 1 }), COLV = G(V.content, { o: view === 'row' ? 0 : 1 });
  const usable = (g, on) => { g.style.pointerEvents = on ? '' : 'none'; };
  usable(ROWV, view !== 'col'); usable(COLV, view !== 'row');
  const planeG = G(ROWV, {});
  const planes = I.map(i => V.plane(0, 0, 0, 0, { color: S3_ROW[i], into: planeG }));
  planes.forEach((pl, i) => { pl.visible = i < rows; });
  const lines = I.map(() => V.seg(null, null, { color: COL.chalk, w: 2.5, dash: '7 7', into: ROWV }));
  lines.forEach(l => l.e.setAttribute('stroke-opacity', .75));
  const meet = V.point(null, { color: COL.chalk, r: 11, into: ROWV, halo: true });
  // A plane is dragged by its edge: a wide, invisible copy of its outline.
  const hits = planes.map(pl => {
    const h = path(ROWV, '', { stroke: 'transparent', 'stroke-width': 26, fill: 'none' });
    h.addEventListener('pointerenter', () => { if (live) pl.width(6); });
    h.addEventListener('pointerleave', () => pl.width(3));
    return h;
  });

  const combo = I.map(j => V.arrow(null, null, { color: S3_COLS[j], w: 4, dash: '10 8', into: COLV, clip: true }));   // x·col1, y·col2, z·col3 tip to tail
  // b goes under the columns and wider: when b is a column (z = 1 and the rest 0) both still show
  const bArrow = V.arrow(null, null, { color: S3_B, w: 9, into: COLV }), cols = I.map(j => V.arrow(null, null, { color: S3_COLS[j], into: COLV }));
  const guide = V.seg(null, null, { color: COL.chalk, w: 2, dash: '3 7', into: COLV });
  const tipKeys = [0, 1, 2, 'b'], tipColor = [...S3_COLS, S3_B];
  const tipOf = k => k === 'b' ? bv() : col(k);
  const tips = tipKeys.map((k, n) => {
    const g = G(COLV, {});
    mk('circle', { r: 22, fill: 'transparent' }, g);
    const ring = mk('circle', { r: 13, fill: 'none', stroke: tipColor[n], 'stroke-width': 3, 'stroke-dasharray': '4 4' }, g);
    ring.style.opacity = 0;
    g.setAttribute('aria-label', k === 'b' ? 'tip of b' : `tip of column ${k + 1}`);
    return { g, ring, k };
  });
  const tipLabels = tipKeys.map((k, n) => T(COLV, '', { size: 28, fill: tipColor[n], font: MATH, weight: 600 }));
  // beside the tip, a column's on the arrow's right-hand side and b's on its left (b often lies along a column), unless
  // that side covers an axis, an axis name, another arrow or an earlier label and the other side does not;
  // past the tip is where a dashed mix often runs on
  const tipPlace = proj => {
    const O = proj([0, 0, 0]), ends = tipKeys.map(k => proj(tipOf(k)));
    const segs = I.map(j => { const a = [0, 0, 0], b = [0, 0, 0]; a[j] = -R; b[j] = R + .7; return [proj(a), proj(b)]; });
    const boxes = I.map(j => { const q = [0, 0, 0]; q[j] = R + 1.1; const s = proj(q); return [s[0] - 13, s[1] - 15, s[0] + 13, s[1] + 14]; });
    return tipKeys.map((k, n) => {
      const q = ends[n], L = Math.hypot(q[0] - O[0], q[1] - O[1]) || 1, ux = (q[0] - O[0]) / L, uy = (q[1] - O[1]) / L, w = tipLabels[n].textContent.length * 14;
      const cand = [k === 'b' ? -1 : 1, k === 'b' ? 1 : -1].map(side => {
        const nx = -uy * side, ny = ux * side, x = Math.round(q[0] + ux * 14 + nx * 20), y = Math.round(q[1] + uy * 14 + ny * 24 + 9);
        const anchor = nx > .35 ? 'start' : nx < -.35 ? 'end' : 'middle', x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
        return { q, x, y, anchor, box: [x0, y - 22, x0 + w, y + 6] };
      });
      const c = cand[S3_pick(cand.map(c => c.box), boxes, [...segs, ...ends.filter((_, m) => m !== n).map(e => [O, e])])];
      if (tipLabels[n].textContent) boxes.push(c.box);
      return c;
    });
  };
  V.avoid(proj => { if (st(COLV).o <= .05) return []; const P = tipPlace(proj); return tipLabels.flatMap((t, n) => t.textContent ? [[P[n].x, P[n].y - 9]] : []); });
  V.on(proj => {
    planes.forEach((pl, i) => { const d = pl.e.getAttribute('d'); if (hits[i].getAttribute('d') !== d) hits[i].setAttribute('d', d); });
    // a meeting line is as bright as the dimmer of its two planes
    [[0, 1], [0, 2], [1, 2]].forEach(([i, j], n) => { const o = String(Math.round(.75 * Math.min(planes[i].k, planes[j].k) * 100) / 100); if (lines[n].e.getAttribute('stroke-opacity') !== o) lines[n].e.setAttribute('stroke-opacity', o); });
    const P = tipPlace(proj);
    tips.forEach(({ g }, n) => {
      const L = P[n], t = tipLabels[n];
      put(g, { x: Math.round(L.q[0] * 10) / 10, y: Math.round(L.q[1] * 10) / 10 });
      if (t.getAttribute('text-anchor') !== L.anchor) t.setAttribute('text-anchor', L.anchor);
      put(t, { x: L.x, y: L.y });
    });
  });

  const dragIn = (el, onDown, onMove, onUp) => {
    let on = null;
    const up = () => { if (on) onUp?.(on); on = null; };
    el.addEventListener('pointerdown', e => { if (!live) return; e.preventDefault(); e.stopPropagation(); on = onDown(V.local(e)); if (on) el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (on) onMove(on, V.local(e)); });
    el.addEventListener('pointerup', up);
    el.addEventListener('lostpointercapture', up);
  };
  // A plane slides along its normal n = (a, b, c): moving it by t·n raises d by t·|n|²; t comes from the pointer's
  // motion along the normal as drawn on screen.
  const free = keys => keys.every(key => slots.every(s => s.key !== key || !s.locked));
  hits.forEach((h, i) => dragIn(h, at => {
    if (!free([`b${i}`])) return null;
    const n = I.map(j => v[`a${i}${j}`]), c = planes[i].pts ? I.map(j => planes[i].pts.reduce((s, q) => s + q[j], 0) / planes[i].pts.length) : [0, 0, 0];
    const P0 = V.proj(c), P1 = V.proj(c.map((x, j) => x + n[j]));
    return { at, d0: v[`b${i}`], n2: S3_dot(n, n), ns: [P1[0] - P0[0], P1[1] - P0[1]] };
  }, (s, [x, y]) => {
    const t = ((x - s.at[0]) * s.ns[0] + (y - s.at[1]) * s.ns[1]) / Math.max(s.ns[0] ** 2 + s.ns[1] ** 2, 400);
    edit({ [`b${i}`]: clamp(`b${i}`, Math.round(s.d0 + t * s.n2)) });
  }));
  const lattice = n => Math.max(-R, Math.min(R, Math.round(n))) || 0;   // never −0
  const putTip = (k, q) => edit(k === 'b' ? { b0: q[0], b1: q[1], b2: q[2] } : { [`a0${k}`]: q[0], [`a1${k}`]: q[1], [`a2${k}`]: q[2] });
  // One axis per drag: after the pointer has moved 10 px, the axis whose drawn direction is nearest its motion is
  // chosen and shown as a guide line through the tip; the tip then steps along it from lattice point to lattice point.
  const tipKeysOf = k => k === 'b' ? ['b0', 'b1', 'b2'] : I.map(i => `a${i}${k}`);
  tips.forEach(({ g, k }) => dragIn(g, at => free(tipKeysOf(k)) ? { at, start: tipOf(k).map(lattice), axis: null } : null, (s, [x, y]) => {
    const dx = x - s.at[0], dy = y - s.at[1];
    if (s.axis === null) {
      const L = Math.hypot(dx, dy);
      if (L < 10) return;
      const O = V.proj(s.start);
      let best = -1;
      I.forEach(j => {
        const e = [...s.start]; e[j] += 1;
        const P = V.proj(e), ux = P[0] - O[0], uy = P[1] - O[1], Lu = Math.hypot(ux, uy);
        if (Lu < 6) return;
        const c = Math.abs(dx * ux + dy * uy) / Lu / L;
        if (c > best) { best = c; s.axis = j; s.u = [ux / Lu, uy / Lu]; s.L = Lu; }
      });
      if (s.axis === null) return;
      const a = [...s.start], b = [...s.start]; a[s.axis] = -R; b[s.axis] = R;
      guide.e.setAttribute('stroke', S3_ROW[s.axis]);
      guide.set(a, b);
    }
    const q = [...s.start];
    q[s.axis] = lattice(s.start[s.axis] + (dx * s.u[0] + dy * s.u[1]) / s.L);
    putTip(k, q);
  }, () => guide.set(null, null)));
  tips.forEach(({ g, k }) => g.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); e.currentTarget.blur(); P.keys?.(e); return; }   // Enter checks (or goes on), as in an answer box
    if (!live || !free(tipKeysOf(k))) return;
    const up = e.key === 'ArrowUp' || e.key === 'PageUp' ? 1 : e.key === 'ArrowDown' || e.key === 'PageDown' ? -1 : 0;
    const j = e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? 0 : up && (e.shiftKey || e.key.startsWith('Page')) ? 1 : up ? 2 : -1;
    if (j < 0) return;
    e.preventDefault(); e.stopPropagation();
    const q = tipOf(k).map(lattice);
    q[j] = lattice(q[j] + (j === 0 ? (e.key === 'ArrowRight' ? 1 : -1) : up));
    putTip(k, q);
  }));

  /* ---------- one state, drawn everywhere ---------- */
  const solve = () => solveOf(v);
  const exact = n => {   // a fraction in lowest terms when the numbers are whole, else one decimal
    const det = Math.round(S3_det(Am())), num = Math.round(n * det);
    if (!Object.values(v).every(Number.isInteger) || !det) { const q = niceFrac(n, 99); return q ? [q[0] < 0 ? '−' : '', F(Math.abs(q[0]), q[1])] : [fmt(n)]; }   // numbers at rest like 5/2: still exact
    const g = gcd(Math.abs(num), Math.abs(det)) || 1, nn = num / g * Math.sign(det), dd = Math.abs(det) / g;
    return dd === 1 ? [fmt(nn)] : [nn < 0 ? '−' : '', F(Math.abs(nn), dd)];
  };
  const MANY = ['every point solves all three', 'infinitely many solutions: the three planes are one plane', 'infinitely many solutions: the planes share a line'];
  let solKey = '';
  function draw() {
    slots.forEach(s => s.set());
    const rws = I.map(i => i < rows ? [v[`a${i}0`], v[`a${i}1`], v[`a${i}2`], v[`b${i}`]] : [0, 0, 0, 0]);
    planes.forEach((pl, i) => pl.set(...rws[i]));
    [[0, 1], [0, 2], [1, 2]].forEach(([i, j], n) => lines[n].set(...(rows === 3 && S3_meet(rws[i], rws[j], R) || [null, null])));
    const s = solve(), one = s.x !== undefined, X = mix ? [v.x0, v.x1, v.x2] : one ? [s.x, s.y, s.z] : null;
    const inCube = rows === 3 && one && [s.x, s.y, s.z].every(c => Math.abs(c) <= R + 1e-9);
    meet.set(inCube ? [s.x, s.y, s.z] : null);
    const txt = parts => parts.map(q => typeof q === 'string' ? q : q.f.join('/')).join('');   // a fraction part is { f: [n, d] }, not text
    if (inCube) meet.label(`(${[s.x, s.y, s.z].map(c => txt(exact(c))).join(', ')})`);   // exact, as the readout: (4/3, 1, 0)
    const O = [0, 0, 0], bb = bv();
    I.forEach(j => cols[j].set(O, col(j)));
    bArrow.set(O, bb);
    const reach = X && X.every(c => Math.abs(c) <= 12);
    let at = O;
    I.forEach(j => { const nxt = j === 2 && !mix ? bb : at.map((c, l) => c + X?.[j] * col(j)[l]); combo[j].set(reach ? at : null, reach ? nxt : null); at = reach ? nxt : O; });
    const key = one ? [s.x, s.y, s.z].map(c => txt(exact(c))).join('|') : s.none ? 'none' : 'many' + s.rank;
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
    const changed = Object.keys(to).filter(key => v[key] !== to[key]);
    if (!changed.length) return;
    changed.forEach(key => { v[key] = to[key]; });
    derive(v, changed);
    draw();
  }
  draw();
  show(E, t0 + .2); show(Mx, t0 + .4);
  if (mixAt !== false) show(CF, mixAt ?? t0 + .4);   // mixAt: when the column form appears (false: the beat shows it)

  return {
    v, space: V, E, M: Mx, CF, rows: rowG, mixG, colG, mixB: cfB, sol, planes, hits, tips, tipLabels, lines, meet, cols, bArrow, combo, ROWV, COLV, solve,
    // Move the numbers to new values over dur seconds, on the beat clock (deterministic, so seeking replays it).
    to(next, at, dur = 1.2, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      derive(plan, Object.keys(next));
      const goal = { ...plan }, keys = Object.keys(next);
      prog(q => { moving = q < 1; edit(Object.fromEntries(keys.map(key => [key, from[key] + (goal[key] - from[key]) * q]))); moving = false; }, at, dur, ease);   // numbers on the way: whole or one decimal
    },
    // Show the row picture, the column picture, or both; only what shows can be dragged.
    view(which, at, dur = .6) {
      tw(ROWV, { o: which === 'col' ? 0 : 1 }, at, dur);
      tw(COLV, { o: which === 'row' ? 0 : 1 }, at, dur);
      prog(() => { usable(ROWV, which !== 'col'); usable(COLV, which !== 'row'); V.redraw(); }, at, 0, lin);
    },
    // Light some planes (an index, a list, or null for all) and dim the rest, with their equations.
    // { dim } is how much of the other planes is left (default lin3's focusDim, .18); steep planes that crowd want .06.
    focus(which, at, dur = .6, { dim = focusDim } = {}) {
      const on = which === null || which === undefined ? I : [].concat(which);
      I.forEach(i => {
        planes[i].fade(on.includes(i) ? 1 : dim, at, dur);
        if (rowG[i]) tw(rowG[i], { o: on.includes(i) ? 1 : .35 }, at, dur);
      });
    },
    // Hands on: scrub numbers, drag planes and tips, orbit the space. Turned off by sys.live(false) or by leaving the beat.
    live(on) {
      live = on;
      V.live(on);
      for (const s of slots) {
        const o = on && !s.locked;
        s.box.style.cursor = o ? 'ew-resize' : '';
        s.box.setAttribute('stroke', o ? COL.faint : 'none');
        s.box.setAttribute('stroke-dasharray', '4 6');
        if (o) s.box.setAttribute('tabindex', 0); else s.box.removeAttribute('tabindex');
      }
      hits.forEach((h, i) => { h.style.cursor = on && free([`b${i}`]) ? 'move' : ''; });
      tips.forEach(({ g, ring, k }) => {
        const o = on && free(tipKeysOf(k));
        g.style.cursor = o ? 'grab' : ''; ring.style.opacity = o ? 1 : 0;
        if (o) g.setAttribute('tabindex', 0); else g.removeAttribute('tabindex');
      });
    },
    // Only these keys can be scrubbed by the reader (the rest stay put, without a dashed box); null: all of them.
    // Call it before live(true).
    lock(keys) { slots.forEach(s => { s.locked = !!keys && !keys.includes(s.key); }); },
    set: edit,   // at once, for a reader's action or an answer shown
    onChange(f) { listeners.push(f); f(v, solve()); },
    // The text elements showing one number (every copy of it), e.g. to flash it.
    num: key => slots.filter(s => s.key === key).map(s => s.t),
    // Names beside the arrow tips: col 1, col 2, col 3, b.
    labels(names) { names.forEach((n, i) => { tipLabels[i].textContent = n; tipLabels[i].setAttribute('font-style', /^[a-z]$/.test(n) ? 'italic' : 'normal'); }); V.redraw(); },
  };
}

// lsTask for lin3, with the 3D view's own keys in the hint; keys (optional) are the only numbers the reader may change.
const lin3Task = (sys, test, why, hint, reveal, keys = null) => (body, api) => {
  sys.lock(keys);
  sys.live(true);
  return {
    check: () => { const ok = test(sys.v, sys.solve()); api.grade(ok, ok ? why : hint); },
    reveal: () => { reveal?.(); return why; },
    lock: () => sys.live(false),
    hint: [kbd('Tab'), 'pick a number', kbd('↑'), kbd('↓'), 'change it; drag the picture to turn it'],
  };
};

/* ---------- numbers and columns you can scrub, for the components below ---------- */
// A value as math parts: a whole number, a fraction in lowest terms (denominators up to 12), else one decimal.
function S3_parts(n) {
  if (Math.abs(n - Math.round(n)) < 1e-9) return [num(Math.round(n) || 0)];
  for (let q = 2; q <= 12; q++) { const k = Math.round(n * q); if (Math.abs(n * q - k) < 5e-6) return [k < 0 ? '−' : '', F(Math.abs(k), q)]; }
  const r = Math.round(n * 10) / 10;
  return [num(r) + (Number.isInteger(r) ? DECIMAL_SIGN + '0' : '')];
}
const S3_fmt = n => S3_parts(n).map(x => typeof x === 'string' ? x : x.f.join('/')).join('');
const S3_pp = n => n < -1e-9 ? ['(', ...S3_parts(n), ')'] : S3_parts(n);   // a number inside a sum: 1 + (−4)
// One number on screen that the reader can scrub (drag sideways, or focus it and press ↑/↓), as in vecs and lin3.
// ctx: { v, edit(to), live() → bool, can(key) → bool, step(key), clamp(key, n), slots: [] }.
// coef: a number in front of a letter; a 1 there is not written (−1 is "−") unless the reader can scrub it.
// pf: v → parts, for a computed number (no box).
// abs: the number's size only (a later term, whose sign is drawn before it).
function S3_slot(g, key, x, y, ctx, { size = 40, fill = COL.chalk, w = size * 1.6, anchor = 'middle', coef = false, pf = null, abs = false } = {}) {
  const scrub = !pf, svg = $('stage');
  const bx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const box = scrub ? mk('rect', { x: bx, y: y - size * .95, width: w, height: size * 1.3, rx: 10, fill: 'transparent' }, g) : null;
  const ink = G(g, {}); ink.style.pointerEvents = 'none'; ink.setAttribute('color', fill);
  let shown = '';
  const s = {
    key, box, ink, fill, coef, held: false,
    set() {
      let pp = pf ? pf(ctx.v) : S3_parts(abs ? Math.abs(ctx.v[key]) : ctx.v[key]);
      if (coef && !s.held && pp.length === 1 && /^−?1$/.test(pp[0])) pp = [pp[0].slice(0, -1)];
      const k = JSON.stringify(pp);
      if (k === shown) return;
      shown = k; ink.replaceChildren();
      const long = pp.some(q => typeof q === 'string' && q.includes(DECIMAL_SIGN));
      M(ink, pp, { x, y: long ? y - size * .06 : y, size: long ? size * .78 : size, fill: 'currentColor', anchor });
    },
    paint(on) {
      if (!box) return;
      const ok = on && ctx.can(key);
      box.style.cursor = ok ? 'ew-resize' : '';
      box.style.touchAction = ok ? 'none' : '';
      box.setAttribute('stroke', ok ? COL.faint : 'none');
      box.setAttribute('stroke-dasharray', '4 6');
      if (ok) box.setAttribute('tabindex', 0); else box.removeAttribute('tabindex');
      if (coef && s.held !== ok) { s.held = ok; s.set(); }
    },
  };
  if (box) {
    box.setAttribute('aria-label', key);
    let drag = null;
    const snapTo = n => Math.round(n / ctx.step(key)) * ctx.step(key);
    box.addEventListener('pointerdown', e => {
      if (!ctx.live() || !ctx.can(key)) return;
      e.preventDefault();
      drag = { x: e.clientX, from: snapTo(ctx.v[key]) };
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', e => {
      if (!drag) return;
      const k = svg.getScreenCTM().a;
      ctx.edit({ [key]: ctx.clamp(key, drag.from + Math.round((e.clientX - drag.x) / k / 22) * ctx.step(key)) });
    });
    const end = () => { drag = null; };
    box.addEventListener('pointerup', end);
    box.addEventListener('lostpointercapture', end);
    box.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); box.blur(); P.keys?.(e); return; }   // Enter checks, as in an answer box
      if (!ctx.live() || !ctx.can(key)) return;
      const dd = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!dd) return;
      e.preventDefault(); e.stopPropagation();   // the player's ←/→ must not leave the beat
      ctx.edit({ [key]: ctx.clamp(key, snapTo(ctx.v[key]) + dd * ctx.step(key)) });
    });
  }
  ctx.slots.push(s);
  s.set();
  return s;
}
// A column of three numbers in brackets, centred at x, its middle number on baseline y; keys [k0, k1, k2] (scrubbable)
// or pf: [v → parts, …] (computed). Returns { g, w }.
function S3_col(g, keys, x, y, ctx, { size = 38, fill = COL.chalk, w = size * 2, pf = null } = {}) {
  const rh = size * 1.18, top = y - rh - size * .95, bot = y + rh + size * .38, x0 = x - w / 2, x1 = x + w / 2;
  path(g, `M${x0 + 12} ${top}H${x0}V${bot}H${x0 + 12}M${x1 - 12} ${top}H${x1}V${bot}H${x1 - 12}`, { stroke: COL.chalk, 'stroke-width': 3, fill: 'none' });
  [0, 1, 2].forEach(i => S3_slot(g, keys?.[i], x, y + (i - 1) * rh, ctx, { size, fill, w: w - 14, pf: pf?.[i] }));
  return { g, w };
}

/* ---------- the subspace test in space ---------- */
// A set S in space drawn in blue (row 1's colour: S is an equation's plane, or a line), two vectors u and w kept inside
// S, the numbers c and d, and the combination c·u + d·w from the origin with a ring at its tip: green while it stays in
// S, red once it leaves. One state (sb.v), so the numbers and the picture move together: scrub any number, drag a tip
// (it slides in S), drag the plane by its edge (it slides along its normal, k follows), orbit by dragging empty space.
//   set: 'plane'  n0·x + n1·y + n2·z = k             'line'  every p + t·e (through the origin when p = 0)
//        'zero'   the zero vector alone              'all'   every vector of space
//   const sb = subspace3(p, { set, plane: [n0, n1, n2, k], line: { dir: e, at: p }, u, w, c, d, space: { cx, cy, size, range, yaw, pitch } })
//   state sb.v = { n0 n1 n2 k  e0 e1 e2  p0 p1 p2  u0 u1 u2  w0 w1 w2  c d }
//   sb.eq({ x, y, size })          the plane's equation, scrubbable, with a blue bar
//   sb.lineRow({ x, y, size })     the line: [p] + t·[e] (or t·[e] when p is 0 and nothing moves it), scrubbable
//   sb.vec('u' | 'w', { x, y, size })   u = [ ] as a column;  sb.combo({ x, y, size })  c u + d w = [ ]
//   sb.check(id, { x, y, size })   one vector ('u', 'w', 'sum') put into S's rule, live, with ✓ or ✗
//   sb.readout({ x, y, size })     the test of c u + d w with the verdict in words
//   sb.kind(name, t0);  sb.ok();  sb.inSet(q);  sb.calc() → { cu, dw, sum };  sb.multiples(t0, on)
//   sb.to / set / onChange / flash / num / show / hide (ids: 'u', 'w', 'cv', 'dw', 'sum', 'set')
//   sb.live(on, { only: keys, drag: ['u', 'w'], slide: true });  sub3Task(sb, test, why, hint, reveal, opts)
function subspace3(p, { set = 'plane', plane: N0 = [1, 1, 1, 0], line: L0 = { dir: [1, 2, 2], at: [0, 0, 0] }, u = [1, 0, -1], w = [0, 1, -1], c = 1, d = 1,
                        space: so = {}, show: shown = ['u', 'w', 'dw', 'sum'], t0 = .1, snap = 1, range = {} } = {}) {
  const V = space3(p, { t0, ...so }), R = V.R, SET = COL.whole, I = [0, 1, 2], listeners = [], slots = [];
  // the kind of set is part of the state (v.kind, an index into KINDS): a move planned for later uses the set it will be then
  const KINDS = ['plane', 'line', 'zero', 'all'], kindOf = s => KINDS[Math.round(s.kind)] ?? 'plane';
  let live = false, only = null, dragOn = ['u', 'w'], slideOn = true;
  const v = { c, d, k: N0[3], kind: KINDS.indexOf(set) }, K = () => kindOf(v);
  I.forEach(j => { v['n' + j] = N0[j]; v['e' + j] = L0.dir[j]; v['p' + j] = (L0.at ?? [0, 0, 0])[j]; v['u' + j] = u[j]; v['w' + j] = w[j]; });
  const vec = (n, s = v) => I.map(j => s[n + j]);
  const nrm = (s = v) => vec('n', s), nOK = s => Math.hypot(...nrm(s)) > 1e-9, eOK = s => Math.hypot(...vec('e', s)) > 1e-9;
  const calc = (s = v) => { const cu = vec('u', s).map(x => s.c * x), dw = vec('w', s).map(x => s.d * x); return { cu, dw, sum: cu.map((x, j) => x + dw[j]) }; };
  const inSet = (q, s = v) => {
    const kind = kindOf(s);
    if (kind === 'all') return true;
    if (kind === 'zero') return Math.hypot(...q) < 1e-6;
    if (kind === 'plane') return nOK(s) && Math.abs(S3_dot(nrm(s), q) - s.k) < 1e-6 * (1 + Math.abs(s.k));
    const r = q.map((x, j) => x - s['p' + j]), e = vec('e', s);
    return eOK(s) ? Math.hypot(...S3_cross(r, e)) < 1e-6 * (1 + Math.hypot(...r)) : Math.hypot(...r) < 1e-6;
  };
  // The coordinate of a point that is solved for on the plane: not one just changed, the largest |n_j| among the rest.
  const dep = (s, n, changed) => {
    const free = I.filter(j => !changed.includes(n + j) && Math.abs(s['n' + j]) > 1e-9);
    const pool = free.length ? free : I.filter(j => Math.abs(s['n' + j]) > 1e-9);
    return pool.reduce((a, j) => Math.abs(s['n' + j]) > Math.abs(s['n' + a]) ? j : a, pool[0]);
  };
  const fix = (s, changed = []) => {
    const kind = kindOf(s);
    for (const n of ['u', 'w']) {
      if (kind === 'zero') I.forEach(j => { s[n + j] = 0; });
      else if (kind === 'plane' && nOK(s)) {
        const j = dep(s, n, changed);
        s[n + j] = (s.k - I.filter(i => i !== j).reduce((t, i) => t + s['n' + i] * s[n + i], 0)) / s['n' + j] || 0;
      } else if (kind === 'line' && eOK(s)) {
        const e = vec('e', s), pt = vec('p', s), q = vec(n, s), ch = I.find(j => changed.includes(n + j) && Math.abs(e[j]) > 1e-9 && !I.some(i => i !== j && changed.includes(n + i)));
        const t = ch !== undefined ? (q[ch] - pt[ch]) / e[ch] : S3_dot(q.map((x, j) => x - pt[j]), e) / S3_dot(e, e);
        I.forEach(j => { s[n + j] = pt[j] + t * e[j] || 0; });
      }
    }
  };
  fix(v);
  let plan = { ...v };
  const RANGE = key => range[key] ?? (key === 'c' || key === 'd' ? [-5, 5] : key === 'k' ? [-12, 12] : /^[ne]/.test(key) ? [-6, 6] : [-R, R]);
  const ctx = {
    v, slots, live: () => live,
    can: key => key in v && (!only || only.includes(key)),
    step: key => key === 'c' || key === 'd' ? 1 : snap,
    clamp: (key, n) => Math.max(RANGE(key)[0], Math.min(RANGE(key)[1], n)),
    edit: to => edit(to),
  };

  /* ---------- the picture ---------- */
  const setG = G(V.content, {}), planeIt = V.plane(0, 0, 0, 0, { color: SET, fo: .2, into: V.polys });
  const lineIt = V.seg(null, null, { color: SET, w: 6, into: setG });
  lineIt.e.setAttribute('stroke-linecap', 'round');
  const zeroIt = V.point(null, { color: SET, r: 12, into: setG });
  const faces = [];   // 'all': the cube's faces, faintly
  for (const j of I) for (const sgn of [-1, 1]) {
    const a = (j + 1) % 3, b = (j + 2) % 3, q = (x, y) => { const r = [0, 0, 0]; r[j] = sgn * R; r[a] = x; r[b] = y; return r; };
    faces.push(V.poly([q(-R, -R), q(R, -R), q(R, R), q(-R, R)], { color: SET, fo: .05, w: 0 }));
  }
  const multL = V.seg(null, null, { color: COL.chalk, w: 2.5, dash: '8 9', into: setG });
  const multG = G(setG, { o: 0 }); multG.append(multL.e);
  const COLR = { u: S3_COLS[0], w: S3_COLS[1], cv: S3_COLS[0], dw: S3_COLS[1], sum: COL.chalk };
  const arrG = G(V.content, {}), A = {};
  for (const id of ['cv', 'dw', 'u', 'w', 'sum']) {
    const g = G(arrG, { o: shown.includes(id) ? 1 : 0 });
    const a = V.arrow(null, null, { color: COLR[id], w: id === 'sum' ? 6 : 5, into: g, ...(id === 'cv' || id === 'dw' ? { dash: '10 8' } : {}) });
    const lab = V.point(null, { color: COLR[id], r: .1, label: '', size: 28, into: g, halo: true });
    A[id] = { g, a, lab };
  }
  const ringP = V.point(null, { color: COL.good, r: 17, into: arrG });
  const ringC = ringP.e.firstChild;
  Object.entries({ fill: 'none', 'stroke-width': 4 }).forEach(([k, x]) => ringC.setAttribute(k, x));
  const ring = G(arrG, { o: shown.includes('sum') ? 1 : 0 }); ring.append(ringP.e);
  const term = (k, n) => Math.abs(k - 1) < 1e-9 ? n : Math.abs(k + 1) < 1e-9 ? '−' + n : S3_fmt(k) + n;
  const nice = n => !S3_fmt(n).includes(DECIMAL_SIGN);
  const sumLabel = s => {
    if (!nice(s.c) || !nice(s.d)) return '';
    if (!s.c && !s.d) return '0';
    if (!s.d) return term(s.c, 'u');
    if (!s.c) return term(s.d, 'w');
    return `${term(s.c, 'u')} ${s.d < 0 ? '−' : '+'} ${term(Math.abs(s.d), 'w')}`;
  };

  // tip handles for u and w
  const tips = ['u', 'w'].map(n => {
    const g = G(V.content, {});
    mk('circle', { r: 22, fill: 'transparent' }, g);
    const rg = mk('circle', { r: 13, fill: 'none', stroke: COLR[n], 'stroke-width': 3, 'stroke-dasharray': '4 4' }, g);
    rg.style.opacity = 0; g.style.pointerEvents = 'none';
    g.setAttribute('aria-label', 'tip of ' + n);
    return { n, g, rg };
  });
  const planeHit = path(V.content, '', { stroke: 'transparent', 'stroke-width': 26, fill: 'none' });
  planeHit.style.pointerEvents = 'none';
  planeHit.setAttribute('aria-label', 'the plane');
  V.on(proj => {
    const d = planeIt.e.getAttribute('d');
    if (planeHit.getAttribute('d') !== d) planeHit.setAttribute('d', d);
    tips.forEach(t => { const q = proj(vec(t.n)); put(t.g, { x: Math.round(q[0] * 10) / 10, y: Math.round(q[1] * 10) / 10 }); });
  });

  function draw() {
    slots.forEach(s => s.set());
    planeIt.visible = K() === 'plane';
    planeIt.set(...nrm(), v.k);
    let la = null, lb = null;
    if (K() === 'line' && eOK(v)) { const e = vec('e'), L = Math.hypot(...e), pt = vec('p'), f = 6 * R / L; [la, lb] = S3_clipSeg(pt.map((x, j) => x - f * e[j]), pt.map((x, j) => x + f * e[j]), R) || [null, null]; }
    lineIt.set(la, lb);
    zeroIt.set(K() === 'zero' ? [0, 0, 0] : null);
    faces.forEach(f => { f.on = K() === 'all'; f.e.style.display = K() === 'all' ? '' : 'none'; });
    const uu = vec('u');
    const f = Math.hypot(...uu) > 1e-9 ? 6 * R / Math.hypot(...uu) : 0;
    multL.set(...(f && S3_clipSeg(uu.map(x => -f * x), uu.map(x => f * x), R) || [null, null]));
    const k = calc(), O = [0, 0, 0], ends = { u: [O, uu], w: [O, vec('w')], cv: [O, k.cu], dw: [k.cu, k.sum], sum: [O, k.sum] };
    for (const id in A) {
      const [a, b] = ends[id], L = Math.hypot(...b.map((x, j) => x - a[j]));
      A[id].a.set(L > 1e-6 ? a : null, L > 1e-6 ? b : null);
      A[id].lab.set(id === 'sum' || L > .3 ? b : null);
      A[id].lab.label(id === 'sum' ? sumLabel(v) : id === 'cv' ? (nice(v.c) && Math.abs(v.c - 1) > 1e-9 ? term(v.c, 'u') : '') : id === 'dw' ? (nice(v.d) && Math.abs(v.d - 1) > 1e-9 ? term(v.d, 'w') : '') : id);
    }
    ringP.set(k.sum);
    ringC.setAttribute('stroke', inSet(k.sum) ? COL.good : COL.bad);
    listeners.forEach(f => f(v, k));
    V.redraw();
  }
  function edit(to) {
    const changed = Object.keys(to).filter(key => v[key] !== to[key]);
    if (!changed.length) return;
    changed.forEach(key => { v[key] = to[key]; });
    fix(v, changed);
    draw();
  }

  /* ---------- dragging in space ---------- */
  // The point on the plane n·q = kk under the pointer: the screen point at depth t is affine in t, so one division finds it.
  const onPlane = (sx, sy, n, kk) => {
    const P0 = V.unproj(sx, sy, 0), P1 = V.unproj(sx, sy, 1).map((x, j) => x - P0[j]), den = S3_dot(n, P1);
    if (Math.abs(den) < 1e-9) return null;
    const t = (kk - S3_dot(n, P0)) / den;
    return P0.map((x, j) => x + t * P1[j]);
  };
  const snapTo = x => Math.round(x / snap) * snap;
  // Where a dragged tip lands in S, from the pointer's place on screen.
  const landing = (n, [sx, sy]) => {
    if (K() === 'zero') return null;
    if (K() === 'line') {
      if (!eOK(v)) return null;
      const pt = vec('p'), e = vec('e'), A0 = V.proj(pt), B0 = V.proj(pt.map((x, j) => x + e[j])), dx = B0[0] - A0[0], dy = B0[1] - A0[1], L2 = dx * dx + dy * dy;
      if (L2 < 1) return null;
      const t = snapTo(((sx - A0[0]) * dx + (sy - A0[1]) * dy) / L2), q = pt.map((x, j) => x + t * e[j]);
      return q.every(x => Math.abs(x) <= R + 1e-9) ? q : null;
    }
    const nn = K() === 'plane' ? nrm() : [0, 0, 1], kk = K() === 'plane' ? v.k : v[n + '2'];
    if (K() === 'plane' && !nOK(v)) return null;
    const q = onPlane(sx, sy, nn, kk);
    if (!q) return null;
    const j = I.reduce((a, i) => Math.abs(nn[i]) > Math.abs(nn[a]) ? i : a, 0);
    I.forEach(i => { if (i !== j) q[i] = Math.max(-R, Math.min(R, snapTo(q[i]))); });
    q[j] = (kk - I.filter(i => i !== j).reduce((t, i) => t + nn[i] * q[i], 0)) / nn[j];
    return Math.abs(q[j]) <= R + 1e-9 ? q : null;
  };
  const tipOK = n => live && dragOn.includes(n) && K() !== 'zero' && I.every(j => ctx.can(n + j));
  tips.forEach(({ n, g }) => {
    let on = false;
    g.addEventListener('pointerdown', e => { if (!tipOK(n)) return; e.preventDefault(); e.stopPropagation(); on = true; g.setPointerCapture(e.pointerId); });
    g.addEventListener('pointermove', e => { if (!on) return; const q = landing(n, V.local(e)); if (q) edit(Object.fromEntries(I.map(j => [n + j, q[j]]))); });
    const up = () => { on = false; };
    g.addEventListener('pointerup', up);
    g.addEventListener('lostpointercapture', up);
    // keys: ←/→ and ↑/↓ step the two free coordinates on a plane (or t along a line); in 'all' ←/→ x, ↑/↓ z, Shift+↑/↓ y
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); g.blur(); P.keys?.(e); return; }
      if (!tipOK(n)) return;
      const lr = { ArrowLeft: -1, ArrowRight: 1 }[e.key], ud = { ArrowDown: -1, ArrowUp: 1 }[e.key];
      if (!lr && !ud) return;
      e.preventDefault(); e.stopPropagation();
      const q = vec(n);
      if (K() === 'line') { const pt = vec('p'), ee = vec('e'), t = snapTo(S3_dot(q.map((x, j) => x - pt[j]), ee) / S3_dot(ee, ee)) + (lr || ud) * snap; const r = pt.map((x, j) => x + t * ee[j]); if (r.every(x => Math.abs(x) <= R + 1e-9)) edit(Object.fromEntries(I.map(j => [n + j, r[j]]))); return; }
      const free = K() === 'plane' ? I.filter(j => j !== dep(v, n, [])) : [0, e.shiftKey ? 1 : 2];
      const j = lr ? free[0] : free[1];
      edit({ [n + j]: ctx.clamp(n + j, snapTo(q[j]) + (lr || ud) * snap) });
    });
  });
  // The plane slides along its normal: moving it by t·n raises k by t·|n|²; t from the pointer's motion along the normal
  // as drawn on screen (as lin3's planes).
  const slideOK = () => live && slideOn && K() === 'plane' && ctx.can('k');
  let sl = null;
  planeHit.addEventListener('pointerdown', e => {
    if (!slideOK()) return;
    e.preventDefault(); e.stopPropagation();
    const n = nrm(), c0 = planeIt.pts ? I.map(j => planeIt.pts.reduce((s, q) => s + q[j], 0) / planeIt.pts.length) : [0, 0, 0];
    const P0 = V.proj(c0), P1 = V.proj(c0.map((x, j) => x + n[j]));
    sl = { at: V.local(e), k0: v.k, n2: S3_dot(n, n), ns: [P1[0] - P0[0], P1[1] - P0[1]] };
    planeHit.setPointerCapture(e.pointerId);
  });
  planeHit.addEventListener('pointermove', e => {
    if (!sl) return;
    const [x, y] = V.local(e), t = ((x - sl.at[0]) * sl.ns[0] + (y - sl.at[1]) * sl.ns[1]) / Math.max(sl.ns[0] ** 2 + sl.ns[1] ** 2, 400);
    edit({ k: ctx.clamp('k', Math.round(sl.k0 + t * sl.n2)) });
  });
  const slEnd = () => { sl = null; };
  planeHit.addEventListener('pointerup', slEnd);
  planeHit.addEventListener('lostpointercapture', slEnd);
  planeHit.addEventListener('pointerenter', () => { if (slideOK()) planeIt.width(6); });
  planeHit.addEventListener('pointerleave', () => planeIt.width(3));

  /* ---------- the algebra on the left ---------- */
  const testParts = (q, short = false) => {
    if (K() === 'plane') {
      const out = [];
      I.forEach(j => {
        const a = v['n' + j];
        if (Math.abs(a) < 1e-9) return;
        const neg = a < 0, m = Math.abs(a), t = Math.abs(m - 1) < 1e-9 ? S3_pp(q[j]) : [...S3_parts(m), '·', ...S3_pp(q[j])];
        out.push(...(out.length ? [neg ? ' − ' : ' + '] : neg ? ['−'] : []), ...t);
      });
      return [...out, ' = ', ...S3_parts(S3_dot(nrm(), q))];
    }
    const col = q.map(S3_fmt).join(', ');
    if (K() === 'line') {
      const pt = vec('p'), e = vec('e'), r = q.map((x, j) => x - pt[j]), t = eOK(v) ? S3_dot(r, e) / S3_dot(e, e) : 0, off = Math.hypot(...pt) > 1e-9;
      if (short) return inSet(q) ? ['t = ', ...S3_parts(t)] : ['not on the line'];   // one vector's check: which multiple it is
      return inSet(q) ? [off ? `(${col}) = (${pt.map(S3_fmt).join(', ')}) + ` : `(${col}) = `, ...S3_parts(t), `·(${e.map(S3_fmt).join(', ')})`] : [`(${col})`];
    }
    return [`(${col})`];
  };
  const verdict = (q, ok) => K() === 'plane' ? (ok ? `${S3_fmt(v.k)}, as the plane needs: in the plane ✓` : `not ${S3_fmt(v.k)}: off the plane ✗`)
    : K() === 'line' ? (ok ? 'on the line ✓' : 'not on the line ✗')
    : K() === 'zero' ? (ok ? 'the zero vector: still inside ✓' : 'not the zero vector: outside ✗')
    : 'a vector of space: inside ✓';
  const live_ = (g, f) => { let key = ''; const upd = () => { const k = f(null); const s = JSON.stringify(k[0]); if (s === key) return; key = s; g.replaceChildren(); k[1](); }; listeners.push(upd); upd(); return g; };
  const sb = {
    V, space: V, v, calc: () => calc(), inSet: q => inSet(q), ok: () => inSet(calc().sum), kindNow: K, A, ring, setG, plane: planeIt, line: lineIt, mult: multG, faces,
    to(next, at, dur = 1.2, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      fix(plan, Object.keys(next));
      const goal = { ...plan };
      prog(q => edit(Object.fromEntries(Object.keys(goal).map(k => [k, from[k] + (goal[k] - from[k]) * q]))), at, dur, ease);
    },
    set: to => edit(to),
    onChange(f) { listeners.push(f); f(v, calc()); },
    num: key => slots.filter(s => s.key === key).map(s => s.ink),
    flash(key, at) { slots.filter(s => s.key === key).forEach(s => { tw(s.ink, { c_color: COL.task }, at, .25); tw(s.ink, { c_color: s.fill }, at + 1.2, .6); }); },
    show(ids, at, dur = .5) { [].concat(ids).forEach(id => { show(id === 'set' ? setG : A[id].g, at, dur); if (id === 'sum') show(ring, at, dur); if (id === 'set') planeIt.fade(1, at, dur); }); },
    hide(ids, at, dur = .5) { [].concat(ids).forEach(id => { hide(id === 'set' ? setG : A[id].g, at, dur); if (id === 'sum') hide(ring, at, dur); if (id === 'set') planeIt.fade(0, at, dur); }); },
    kind(name, at) {
      const n = KINDS.indexOf(name);
      if (at === undefined) { plan.kind = n; edit({ kind: n }); } else sb.to({ kind: n }, at, 0);
    },
    multiples(at, on = true, dur = .6) { tw(multG, { o: on ? 1 : 0 }, at, dur); },
    eq({ x = 90, y = 200, size: sz = 44, o = 1 } = {}) {
      const g = G(p, { o });
      mk('rect', { x: x - 30, y: y - sz * .7, width: 8, height: sz * .8, rx: 4, fill: SET }, g);
      const sp = sz * 2.7;
      ['x', 'y', 'z'].forEach((L, j) => {
        const sx = x + j * sp, key = 'n' + j;
        if (j) S3_slot(g, null, sx - sz * .5, y, ctx, { size: sz, pf: s => [s[key] < -1e-9 ? '−' : '+'] });
        S3_slot(g, key, sx + sz * 1.0, y, ctx, { size: sz, anchor: 'end', w: sz * 1.25, coef: true, abs: j > 0 });
        const t = T(g, L, { x: sx + sz * 1.06, y, size: sz, fill: COL.chalk, font: MATH }); t.setAttribute('font-style', 'italic');
      });
      const ex = x + 3 * sp - sz * .6;
      T(g, '=', { x: ex, y, size: sz, fill: COL.chalk, font: MATH, anchor: 'middle' });
      S3_slot(g, 'k', ex + sz * .75, y, ctx, { size: sz, anchor: 'start', w: sz * 1.4 });
      draw();
      return g;
    },
    lineRow({ x = 90, y = 210, size: sz = 34, o = 1, at = true } = {}) {
      const g = G(p, { o }), w = sz * 2, gp = G(g, {});
      mk('rect', { x: x - 30, y: y - sz * .7, width: 8, height: sz * .8, rx: 4, fill: SET }, g);
      let cx = x;
      if (at) { S3_col(gp, ['p0', 'p1', 'p2'], cx + w / 2, y, ctx, { size: sz, w }); T(gp, '+', { x: cx + w + sz * .5, y: y + sz * .3, size: sz, fill: COL.chalk, font: MATH, anchor: 'middle' }); cx += w + sz; }
      const t = T(g, 't', { x: cx + sz * .2, y: y + sz * .3, size: sz, fill: COL.chalk, font: MATH }); t.setAttribute('font-style', 'italic');
      T(g, '·', { x: cx + sz * .7, y: y + sz * .3, size: sz, fill: COL.chalk, font: MATH });
      S3_col(g, ['e0', 'e1', 'e2'], cx + sz * 1.2 + w / 2, y, ctx, { size: sz, w, fill: SET });
      draw();
      return { g, at: gp };
    },
    vec(n, { x = 90, y = 360, size: sz = 34, o = 1 } = {}) {
      const g = G(p, { o }), w = sz * 2;
      const t = T(g, n, { x, y: y + sz * .3, size: sz * 1.1, fill: COLR[n], font: MATH }); t.setAttribute('font-style', 'italic');
      T(g, '=', { x: x + sz * 1.15, y: y + sz * .3, size: sz, fill: COL.chalk, font: MATH, anchor: 'middle' });
      S3_col(g, [n + '0', n + '1', n + '2'], x + sz * 1.7 + w / 2, y, ctx, { size: sz, w, fill: COLR[n] });
      draw();
      return g;
    },
    combo({ x = 90, y = 560, size: sz = 34, o = 1 } = {}) {
      const g = G(p, { o }), w = sz * 2;
      let cx = x;
      S3_slot(g, 'c', cx + sz * .9, y + sz * .3, ctx, { size: sz, anchor: 'end', w: sz * 1.2, coef: true });
      const t1 = T(g, 'u', { x: cx + sz * .95, y: y + sz * .3, size: sz * 1.1, fill: COLR.u, font: MATH }); t1.setAttribute('font-style', 'italic');
      cx += sz * 1.75;
      S3_slot(g, null, cx + sz * .3, y + sz * .3, ctx, { size: sz, pf: s => [s.d < -1e-9 ? '−' : '+'] });
      S3_slot(g, 'd', cx + sz * 1.75, y + sz * .3, ctx, { size: sz, anchor: 'end', w: sz * 1.2, coef: true, abs: true });
      const t2 = T(g, 'w', { x: cx + sz * 1.8, y: y + sz * .3, size: sz * 1.1, fill: COLR.w, font: MATH }); t2.setAttribute('font-style', 'italic');
      cx += sz * 2.8;
      T(g, '=', { x: cx + sz * .3, y: y + sz * .3, size: sz, fill: COL.chalk, font: MATH, anchor: 'middle' });
      S3_col(g, null, cx + sz * .8 + w / 2, y, ctx, { size: sz, w, pf: I.map(j => s => S3_parts(calc(s).sum[j])) });
      draw();
      return g;
    },
    check(id, { x = 90, y = 470, size: sz = 26, o = 1 } = {}) {
      const g = G(p, { o });
      return live_(g, () => {
        const q = id === 'sum' ? calc().sum : vec(id), ok = inSet(q), tp = testParts(q, id !== 'sum');
        return [[tp, ok, K()], () => { const e = M(g, tp, { x, y, size: sz, fill: COL.chalk, anchor: 'start' }); T(g, ok ? '  ✓' : '  ✗', { x: x + e._w, y, size: sz, fill: ok ? COL.good : COL.bad, weight: 700 }); }];
      });
    },
    readout({ x = 90, y = 680, size: sz = 32, o = 1 } = {}) {
      const g = G(p, { o });
      return live_(g, () => {
        const q = calc().sum, ok = inSet(q), tp = testParts(q), w = verdict(q, ok);
        return [[tp, w], () => { M(g, tp, { x, y, size: sz, fill: COL.chalk, anchor: 'start' }); T(g, w, { x, y: y + sz * 1.35, size: sz * .82, fill: ok ? COL.good : COL.bad, weight: 600 }); }];
      });
    },
    live(on, { only: keys = null, drag = ['u', 'w'], slide = true } = {}) {
      live = on; only = keys; dragOn = drag; slideOn = slide;
      V.live(on);
      slots.forEach(s => s.paint(on));
      tips.forEach(({ n, g, rg }) => {
        const ok = tipOK(n) && st(A[n].g).o > .3;
        g.style.pointerEvents = ok ? '' : 'none'; g.style.cursor = ok ? 'grab' : ''; rg.style.opacity = ok ? 1 : 0;
        if (ok) g.setAttribute('tabindex', 0); else g.removeAttribute('tabindex');
      });
      planeHit.style.pointerEvents = slideOK() ? '' : 'none';
      planeHit.style.cursor = slideOK() ? 'move' : '';
    },
    redraw: draw,
  };
  draw();
  return sb;
}

// A question that is a task on the 3D subspace test: the reader changes it until test(v, sb) holds, then checks.
const sub3Task = (sb, test, why, hint, reveal, opts) => (body, api) => {
  sb.live(true, opts);
  const say = f => typeof f === 'function' ? f(sb.v, sb) : f;
  return {
    check: () => { const ok = !!test(sb.v, sb); api.grade(ok, say(ok ? why : hint)); },
    reveal: () => { reveal?.(); return say(why); },
    lock: () => sb.live(false),
    hint: [kbd('Tab'), ' pick a number ', kbd('↑'), kbd('↓'), ' change it; drag a tip, the plane by its edge, or empty space to turn'],
  };
};

/* ---------- the column space of a 3 × 2 matrix ---------- */
// Two columns in space, everything they can make, C(A), and a target b. One state, cs.v = { a00 a01 a10 a11 a20 a21
// b0 b1 b2 x0 x1 } (x0, x1: the mix x, y). A changed mix (or A) moves b to A x, so b rides in C(A); a changed b solves
// for the mix again when b is in C(A) and leaves it when b is off (then no mix reaches b).
// Picture: column 1 green, column 2 violet, C(A) amber (where b can be: a plane, a line or the origin alone), b amber;
// the mix drawn tip to tail (x·col 1, then y·col 2, dashed) when it reaches b; when b is off C(A), a red ring on b and
// a dashed drop from b to C(A). b's tip and the columns' tips drag one axis at a time, as lin3's.
//   const cs = colsp3(p, { A, b, space: { cx, cy, size, range, yaw, pitch }, rows2: { cx, cy, u, r } })
//   cs.form({ x, y, size })      x·[col 1] + y·[col 2] = [b], every number scrubbable
//   cs.eqs({ x, y, size })       the three equations a·x + b·y = bᵢ, with their row colours
//   cs.readout({ x, y, size })   "x = 1,  y = 1" (amber), "many mixes …" or "no mix: b is not in C(A)"
//   rows2: the row picture: each equation a line in the x y plane (blue, coral, yellow), the mix a dot where all three meet
//   cs.solve() → { x, y } | { many: true, x, y (one of them) } | { none: true };  cs.inC(q);  cs.span() → 'plane' | 'line' | 'zero'
//   cs.to / set / onChange / flash / num / live(on, { only: keys, drag: ['b', 0, 1] });  cs.cols, cs.bArrow, cs.CA, cs.R2
//   csTask(cs, test, why, hint, reveal, opts): a hands-on question.
function colsp3(p, { A = [[1, 3], [2, 3], [4, 1]], b = [4, 5, 5], space: so = {}, rows2 = null, t0 = .1 } = {}) {
  const V = space3(p, { t0, ...so }), R = V.R, I = [0, 1, 2], J = [0, 1], listeners = [], slots = [], svg = $('stage');
  let live = false, only = null, dragOn = ['b', 0, 1];
  const v = { x0: 0, x1: 0 };
  I.forEach(i => { J.forEach(j => { v[`a${i}${j}`] = A[i][j]; }); v['b' + i] = b[i]; });
  const col = (j, s = v) => I.map(i => s[`a${i}${j}`]), bv = (s = v) => I.map(i => s['b' + i]);
  const Ax = (s = v) => I.map(i => s[`a${i}0`] * s.x0 + s[`a${i}1`] * s.x1);
  const nrm = (s = v) => S3_cross(col(0, s), col(1, s));
  const spanOf = s => Math.hypot(...nrm(s)) > 1e-9 ? 'plane' : Math.hypot(...col(0, s)) + Math.hypot(...col(1, s)) > 1e-9 ? 'line' : 'zero';
  const inC = (q, s = v) => {
    const k = spanOf(s), L = Math.hypot(...q);
    if (k === 'plane') return Math.abs(S3_dot(nrm(s), q)) < 1e-6 * (1 + Math.hypot(...nrm(s)) * L);
    if (k === 'line') { const e = Math.hypot(...col(0, s)) > 1e-9 ? col(0, s) : col(1, s); return Math.hypot(...S3_cross(q, e)) < 1e-6 * (1 + L * Math.hypot(...e)); }
    return L < 1e-6;
  };
  const solveOf = s => {
    const q = bv(s);
    if (!inC(q, s)) return { none: true };
    if (spanOf(s) !== 'plane') {   // many mixes; one of them along the first column that is not zero
      const j = Math.hypot(...col(0, s)) > 1e-9 ? 0 : 1, c = col(j, s), t = Math.hypot(...c) > 1e-9 ? S3_dot(c, q) / S3_dot(c, c) : 0;
      return { many: true, x: j ? 0 : t, y: j ? t : 0, one: false };
    }
    const c0 = col(0, s), c1 = col(1, s), g00 = S3_dot(c0, c0), g01 = S3_dot(c0, c1), g11 = S3_dot(c1, c1), r0 = S3_dot(c0, q), r1 = S3_dot(c1, q), det = g00 * g11 - g01 * g01;
    const fix = n => Math.abs(n - Math.round(n)) < 1e-9 ? Math.round(n) : n;
    return { x: fix((r0 * g11 - g01 * r1) / det), y: fix((g00 * r1 - g01 * r0) / det) };
  };
  const derive = (s, changed) => {
    if (changed.some(k => k[0] === 'x' || k[0] === 'a')) I.forEach(i => { s['b' + i] = s[`a${i}0`] * s.x0 + s[`a${i}1`] * s.x1; });
    else if (changed.some(k => k[0] === 'b')) { const r = solveOf(s); if (r.x !== undefined) { s.x0 = r.x; s.x1 = r.y; } }
  };
  { const r = solveOf(v); if (r.x !== undefined) { v.x0 = r.x; v.x1 = r.y; } }
  const unique = r => r.x !== undefined && !r.many;
  let plan = { ...v };
  const RANGE = key => key[0] === 'b' ? [-R, R] : key[0] === 'x' ? [-6, 6] : [-9, 9];
  const ctx = {
    v, slots, live: () => live,
    can: key => key in v && (!only || only.includes(key)),
    step: () => 1,
    clamp: (key, n) => Math.max(RANGE(key)[0], Math.min(RANGE(key)[1], n)),
    edit: to => edit(to),
  };

  /* ---------- space ---------- */
  const CAg = G(V.content, {});
  const CA = V.plane(0, 0, 0, 0, { color: S3_B, fo: .08, w: 2, into: V.polys });
  const CAline = V.seg(null, null, { color: S3_B, w: 6, into: CAg });
  CAline.e.setAttribute('stroke-opacity', .55);
  const legs = J.map(j => V.arrow(null, null, { color: S3_COLS[j], w: 4, dash: '10 8' }));
  const drop = V.seg(null, null, { color: COL.bad, w: 3, dash: '5 6' });
  const bArrow = V.arrow(null, null, { color: S3_B, w: 9 });
  const cols = J.map(j => V.arrow(null, null, { color: S3_COLS[j] }));
  const badRing = V.point(null, { color: COL.bad, r: 17 });
  Object.entries({ fill: 'none', stroke: COL.bad, 'stroke-width': 4 }).forEach(([k, x]) => badRing.e.firstChild.setAttribute(k, x));
  const labs = ['col 1', 'col 2', 'b'].map((L, n) => V.point(null, { color: [...S3_COLS.slice(0, 2), S3_B][n], r: .1, label: L, size: 26, halo: true }));
  const guide = V.seg(null, null, { color: COL.chalk, w: 2, dash: '3 7' });
  const tipKeys = ['b', 0, 1], tipColor = [S3_B, ...S3_COLS.slice(0, 2)];
  const tipOf = k => k === 'b' ? bv() : col(k);
  const tips = tipKeys.map((k, n) => {
    const g = G(V.content, {});
    mk('circle', { r: 22, fill: 'transparent' }, g);
    const rg = mk('circle', { r: 13, fill: 'none', stroke: tipColor[n], 'stroke-width': 3, 'stroke-dasharray': '4 4' }, g);
    rg.style.opacity = 0; g.style.pointerEvents = 'none';
    g.setAttribute('aria-label', k === 'b' ? 'tip of b' : `tip of column ${k + 1}`);
    return { k, g, rg };
  });
  V.on(proj => tips.forEach(({ k, g }) => { const q = proj(tipOf(k)); put(g, { x: Math.round(q[0] * 10) / 10, y: Math.round(q[1] * 10) / 10 }); }));

  /* ---------- the row picture: three lines in the x y plane ---------- */
  let R2 = null;
  if (rows2) {
    const { cx, cy, u = 22, r = 6 } = rows2;
    const P2 = plane(p, { cx, cy, u, x0: -r, x1: r, y0: -r, y1: r, t0, step: 2 });
    const ls = I.map(i => path(P2.g, '', { stroke: S3_ROW[i], 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }));
    const dot = mk('circle', { r: 9, fill: COL.chalk, stroke: COL.board, 'stroke-width': 3 }, P2.g);
    R2 = { P: P2, lines: ls, dot, draw() {
      I.forEach(i => {
        const a = v[`a${i}0`], c = v[`a${i}1`], k = v['b' + i], pts = [];
        if (Math.abs(c) > 1e-9) for (const X of [-r, r]) { const Y = (k - a * X) / c; if (Y >= -r - 1e-9 && Y <= r + 1e-9) pts.push([X, Y]); }
        if (Math.abs(a) > 1e-9) for (const Y of [-r, r]) { const X = (k - c * Y) / a; if (X > -r + 1e-9 && X < r - 1e-9) pts.push([X, Y]); }
        const d = pts.length >= 2 ? `M${P2.PX(pts[0][0]).toFixed(1)} ${P2.PY(pts[0][1]).toFixed(1)}L${P2.PX(pts[1][0]).toFixed(1)} ${P2.PY(pts[1][1]).toFixed(1)}` : '';
        if (ls[i].getAttribute('d') !== d) ls[i].setAttribute('d', d);
      });
      const s = solveOf(v), on = unique(s) && Math.abs(s.x) <= r && Math.abs(s.y) <= r;
      dot.style.opacity = on ? 1 : 0;
      if (on) { dot.setAttribute('cx', P2.PX(s.x).toFixed(1)); dot.setAttribute('cy', P2.PY(s.y).toFixed(1)); }
    } };
  }

  function draw() {
    slots.forEach(s => s.set());
    const span = spanOf(v), n = nrm(), O = [0, 0, 0], q = bv(), on = inC(q);
    CA.visible = span === 'plane';
    CA.set(...n, 0);
    let la = null, lb = null;
    if (span === 'line') { const e = Math.hypot(...col(0)) > 1e-9 ? col(0) : col(1), f = 6 * R / Math.hypot(...e); [la, lb] = S3_clipSeg(e.map(x => -f * x), e.map(x => f * x), R) || [null, null]; }
    CAline.set(la, lb);
    J.forEach(j => cols[j].set(O, col(j)));
    bArrow.set(O, q);
    // the mix tip to tail, when it reaches b
    const m1 = col(0).map(x => x * v.x0), show_ = on && solveOf(v).x !== undefined;   // with many mixes, the one along a column
    legs[0].set(show_ && Math.abs(v.x0) > 1e-9 ? O : null, m1);
    legs[1].set(show_ && Math.abs(v.x1) > 1e-9 ? m1 : null, q);
    // off C(A): a red ring on b and a dashed drop to the nearest point of C(A)
    let foot = null;
    if (!on) {
      if (span === 'plane') { const t = S3_dot(n, q) / S3_dot(n, n); foot = q.map((x, j) => x - t * n[j]); }
      else if (span === 'line') { const e = Math.hypot(...col(0)) > 1e-9 ? col(0) : col(1), t = S3_dot(q, e) / S3_dot(e, e); foot = e.map(x => t * x); }
      else foot = O;
    }
    drop.set(foot ? q : null, foot);
    badRing.set(on ? null : q);
    [col(0), col(1), q].forEach((t, i) => labs[i].set(Math.hypot(...t) > .2 ? t : null));
    R2?.draw();
    listeners.forEach(f => f(v, solveOf(v)));
    V.redraw();
  }
  function edit(to) {
    const changed = Object.keys(to).filter(key => v[key] !== to[key]);
    if (!changed.length) return;
    changed.forEach(key => { v[key] = to[key]; });
    derive(v, changed);
    draw();
  }

  /* ---------- tips: one axis per drag (as lin3) ---------- */
  const lattice = n => Math.max(-R, Math.min(R, Math.round(n))) || 0;
  const keysOf = k => k === 'b' ? I.map(i => 'b' + i) : I.map(i => `a${i}${k}`);
  const putTip = (k, q) => edit(Object.fromEntries(keysOf(k).map((key, i) => [key, q[i]])));
  const tipOK = k => live && dragOn.includes(k) && keysOf(k).every(ctx.can);
  tips.forEach(({ k, g }) => {
    let s = null;
    g.addEventListener('pointerdown', e => { if (!tipOK(k)) return; e.preventDefault(); e.stopPropagation(); s = { at: V.local(e), start: tipOf(k).map(lattice), axis: null }; g.setPointerCapture(e.pointerId); });
    g.addEventListener('pointermove', e => {
      if (!s) return;
      const [x, y] = V.local(e), dx = x - s.at[0], dy = y - s.at[1];
      if (s.axis === null) {
        const L = Math.hypot(dx, dy);
        if (L < 10) return;
        const O = V.proj(s.start);
        let best = -1;
        I.forEach(j => {
          const ee = [...s.start]; ee[j] += 1;
          const P1 = V.proj(ee), ux = P1[0] - O[0], uy = P1[1] - O[1], Lu = Math.hypot(ux, uy);
          if (Lu < 6) return;
          const c = Math.abs(dx * ux + dy * uy) / Lu / L;
          if (c > best) { best = c; s.axis = j; s.u = [ux / Lu, uy / Lu]; s.L = Lu; }
        });
        if (s.axis === null) return;
        const a = [...s.start], bb = [...s.start]; a[s.axis] = -R; bb[s.axis] = R;
        guide.e.setAttribute('stroke', S3_ROW[s.axis]);
        guide.set(a, bb);
      }
      const q = [...s.start];
      q[s.axis] = lattice(s.start[s.axis] + (dx * s.u[0] + dy * s.u[1]) / s.L);
      putTip(k, q);
    });
    const up = () => { s = null; guide.set(null, null); };
    g.addEventListener('pointerup', up);
    g.addEventListener('lostpointercapture', up);
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); g.blur(); P.keys?.(e); return; }
      if (!tipOK(k)) return;
      const upk = e.key === 'ArrowUp' || e.key === 'PageUp' ? 1 : e.key === 'ArrowDown' || e.key === 'PageDown' ? -1 : 0;
      const j = e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? 0 : upk && (e.shiftKey || e.key.startsWith('Page')) ? 1 : upk ? 2 : -1;
      if (j < 0) return;
      e.preventDefault(); e.stopPropagation();
      const q = tipOf(k).map(lattice);
      q[j] = lattice(q[j] + (j === 0 ? (e.key === 'ArrowRight' ? 1 : -1) : upk));
      putTip(k, q);
    });
  });

  const live_ = (g, f) => { let key = ''; const upd = () => { const [k, paint] = f(); const s = JSON.stringify(k); if (s === key) return; key = s; g.replaceChildren(); paint(); }; listeners.push(upd); upd(); return g; };
  const cs = {
    V, space: V, v, cols, bArrow, legs, drop, badRing, CA, CAline, labels: labs, R2,
    solve: () => solveOf(v), inC: q => inC(q), span: () => spanOf(v), Ax: () => Ax(),
    to(next, at, dur = 1.2, ease = io) {
      const from = { ...plan };
      plan = { ...plan, ...next };
      derive(plan, Object.keys(next));
      const goal = { ...plan }, keys = Object.keys(goal);
      prog(q => edit(Object.fromEntries(keys.map(k => [k, from[k] + (goal[k] - from[k]) * q]))), at, dur, ease);
    },
    set: to => edit(to),
    onChange(f) { listeners.push(f); f(v, solveOf(v)); },
    num: key => slots.filter(s => s.key === key).map(s => s.ink),
    flash(key, at) { slots.filter(s => s.key === key).forEach(s => { tw(s.ink, { c_color: COL.task }, at, .25); tw(s.ink, { c_color: s.fill }, at + 1.2, .6); }); },
    form({ x = 90, y = 230, size: sz = 32, o = 1 } = {}) {
      const g = G(p, { o }), w = sz * 2.1, parts = {};
      let cx = x;
      parts.x = G(g, {}); S3_slot(parts.x, 'x0', cx + sz * .95, y + sz * .3, ctx, { size: sz, anchor: 'end', w: sz * 1.2 });
      parts.c0 = G(g, {}); S3_col(parts.c0, I.map(i => `a${i}0`), cx + sz * 1.2 + w / 2, y, ctx, { size: sz, w, fill: S3_COLS[0] });
      cx += sz * 1.2 + w;
      parts.plus = G(g, {}); T(parts.plus, '+', { x: cx + sz * .45, y: y + sz * .3, size: sz, fill: COL.chalk, font: MATH, anchor: 'middle' });
      cx += sz * .9;
      parts.y = G(g, {}); S3_slot(parts.y, 'x1', cx + sz * .95, y + sz * .3, ctx, { size: sz, anchor: 'end', w: sz * 1.2 });
      parts.c1 = G(g, {}); S3_col(parts.c1, I.map(i => `a${i}1`), cx + sz * 1.2 + w / 2, y, ctx, { size: sz, w, fill: S3_COLS[1] });
      cx += sz * 1.2 + w;
      parts.eq = G(g, {}); T(parts.eq, '=', { x: cx + sz * .5, y: y + sz * .3, size: sz, fill: COL.chalk, font: MATH, anchor: 'middle' });
      cx += sz;
      parts.b = G(g, {}); S3_col(parts.b, I.map(i => 'b' + i), cx + w / 2, y, ctx, { size: sz, w, fill: S3_B });
      draw();
      return { g, parts, w: cx + w - x };
    },
    eqs({ x = 90, y = 400, size: sz = 30, gap = sz * 1.45, o = 1 } = {}) {
      const g = G(p, { o }), rowsG = [];
      I.forEach(i => {
        const r = G(g, {}), yy = y + i * gap;
        rowsG.push(r);
        mk('rect', { x: x - 26, y: yy - sz * .7, width: 7, height: sz * .8, rx: 3, fill: S3_ROW[i] }, r);
        S3_slot(r, `a${i}0`, x + sz * .9, yy, ctx, { size: sz, anchor: 'end', w: sz * 1.1, coef: true });
        T(r, 'x', { x: x + sz * .95, y: yy, size: sz, fill: COL.chalk, font: MATH }).setAttribute('font-style', 'italic');
        S3_slot(r, null, x + sz * 2.15, yy, ctx, { size: sz, pf: s => [s[`a${i}1`] < -1e-9 ? '−' : '+'] });
        S3_slot(r, `a${i}1`, x + sz * 3.35, yy, ctx, { size: sz, anchor: 'end', w: sz * 1.1, coef: true, abs: true });
        T(r, 'y', { x: x + sz * 3.4, y: yy, size: sz, fill: COL.chalk, font: MATH }).setAttribute('font-style', 'italic');
        T(r, '=', { x: x + sz * 4.55, y: yy, size: sz, fill: COL.chalk, font: MATH, anchor: 'middle' });
        S3_slot(r, 'b' + i, x + sz * 5.1, yy, ctx, { size: sz, anchor: 'start', w: sz * 1.5, fill: S3_B });
      });
      draw();
      return { g, rows: rowsG };
    },
    readout({ x = 90, y = 600, size: sz = 34, o = 1 } = {}) {
      const g = G(p, { o });
      return live_(g, () => {
        const s = solveOf(v);
        if (unique(s)) return [['m', s.x, s.y], () => M(g, ['x = ', ...S3_parts(s.x), ',   y = ', ...S3_parts(s.y)], { x, y, size: sz, fill: S3_B, anchor: 'start' })];
        if (s.many) return [['many'], () => T(g, 'b is in C(A): many mixes reach it', { x, y: y - 4, size: sz * .8, fill: S3_B, weight: 600 })];
        return [['none'], () => T(g, 'no mix: b is not in C(A)', { x, y: y - 4, size: sz * .8, fill: COL.bad, weight: 600 })];
      });
    },
    live(on, { only: keys = null, drag = ['b', 0, 1] } = {}) {
      live = on; only = keys; dragOn = drag;
      V.live(on);
      slots.forEach(s => s.paint(on));
      tips.forEach(({ k, g, rg }) => { const ok = tipOK(k); g.style.pointerEvents = ok ? '' : 'none'; g.style.cursor = ok ? 'grab' : ''; rg.style.opacity = ok ? 1 : 0; if (ok) g.setAttribute('tabindex', 0); else g.removeAttribute('tabindex'); });
    },
    redraw: draw,
  };
  draw();
  return cs;
}
const csTask = (cs, test, why, hint, reveal, opts) => (body, api) => {
  cs.live(true, opts);
  const say = f => typeof f === 'function' ? f(cs.v, cs) : f;
  return {
    check: () => { const ok = !!test(cs.v, cs); api.grade(ok, say(ok ? why : hint)); },
    reveal: () => { reveal?.(); return say(why); },
    lock: () => cs.live(false),
    hint: [kbd('Tab'), ' pick a number ', kbd('↑'), kbd('↓'), ' change it; drag b’s tip along an axis, or empty space to turn'],
  };
};
