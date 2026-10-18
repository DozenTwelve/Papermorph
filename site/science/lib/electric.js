// Papermorph science book: electricity and magnetism (chapter 16 on). Load after waves.js (it uses thAtt and TAU)
// and energy.js. Every moving part is set from the beat clock (x.set(...) inside clockRun), so replays match.
'use strict';
// Charges: positive red, negative blue (electrons are blue wherever they appear). Current I blue, voltage amber,
// resistance pink, magnetic field green; a magnet's N end is blue and its S end red (letters, not + and −).
const CHG_P = '#ff7a6e', CHG_N = '#7f9cf5', AMPS = COL.whole, VOLT = COL.task, OHMS = COL.rat, MAGF = COL.irr;
const MAG_N = CHG_N, MAG_S = CHG_P, COPPER = '#d98a4e', JACKET = '#5b6b72';
const signD = (sign, k) => `M${-k} 0H${k}` + (sign > 0 ? `M0 ${-k}V${k}` : '');

// A charge: a ball with + or −, centred on its origin. c.setSign(±1) swaps it.
function chargeBall(p, sign, { x = 0, y = 0, r = 34, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  const ball = mk('circle', { r, fill: sign > 0 ? CHG_P : CHG_N, ...phLine(3) }, g);
  mk('circle', { cx: -r * .35, cy: -r * .38, r: r * .22, fill: '#fff', opacity: .45 }, g);
  const gl = path(g, signD(sign, r * .46), { stroke: '#fff', 'stroke-width': Math.max(3, r * .2), 'stroke-linecap': 'round' });
  return Object.assign(g, { ball, sign, setSign(sg) { if (sg !== g.sign) { g.sign = sg; ball.setAttribute('fill', sg > 0 ? CHG_P : CHG_N); gl.setAttribute('d', signD(sg, r * .46)); } return g; } });
}
// A small + or − mark (no ball), for charges sitting on a surface. One path; m.setSign(±1).
function signMark(p, sign, { x = 0, y = 0, k = 11, w = 6, o = 1 } = {}) {
  const e = path(p, signD(sign, k), { stroke: sign > 0 ? CHG_P : CHG_N, 'stroke-width': w, 'stroke-linecap': 'round' });
  put(e, { x, y, o });
  return e;
}

/* ---------- wires and flowing charges ---------- */
// A route through points, open or closed: R.len, R.d (its path), R.at(s) → [x, y, heading°]; a closed route wraps s.
function route(pts, closed = false) {
  const P = closed ? [...pts, pts[0]] : pts, segs = [];
  let len = 0;
  for (let i = 1; i < P.length; i++) {
    const [ax, ay] = P[i - 1], [bx, by] = P[i], L = Math.hypot(bx - ax, by - ay) || 1e-6;
    segs.push([len, L, ax, ay, (bx - ax) / L, (by - ay) / L]); len += L;
  }
  return {
    len, closed, pts: P,
    d: P.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('') + (closed ? 'Z' : ''),
    at(s) {
      s = closed ? ((s % len) + len) % len : Math.max(0, Math.min(len, s));
      let k = 0; while (k < segs.length - 1 && s > segs[k][0] + segs[k][1]) k++;
      const [s0, , ax, ay, ux, uy] = segs[k], u = s - s0;
      return [ax + ux * u, ay + uy * u, Math.atan2(uy, ux) * 180 / Math.PI];
    },
  };
}
// A copper wire along a route, with a dark outline.
function wire(p, R, { w = 12, color = COPPER } = {}) {
  const g = G(p), at = { fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  path(g, R.d, { stroke: PH.out, 'stroke-width': w + 6, ...at }); g.core = path(g, R.d, { stroke: color, 'stroke-width': w, ...at });
  return g;
}
// Electrons along a route, `gap` px apart, all moved s px along (s grows as they flow: phaseOf for a current that
// starts and stops). One path of dots. Options: skip(u) hides dots at arc length u (inside a battery); warp(u) maps
// an even spacing to arc length, so the dots crowd where the flow is slow (the same current everywhere).
// On a closed route the gap is rounded so a whole number of dots fits the loop and there is no seam.
function eFlow(p, R, { gap = 56, r = 8, color = CHG_N, skip, warp, len } = {}) {
  const L = len ?? R.len, n = Math.max(1, Math.round(L / gap)), gp = R.closed ? L / n : gap;
  const g = G(p), el = path(g, '', { fill: color, stroke: PH.out, 'stroke-width': 2 });
  return Object.assign(g, {
    el,
    set(s) {
      let d = ''; const off = ((s % gp) + gp) % gp;
      for (let u = off; u < L; u += gp) {
        if (!R.closed && u > L) break;
        const a = warp ? warp(u) : u;
        if (!R.closed && a > R.len) break;
        if (skip && skip(a)) continue;
        const [x, y] = R.at(a);
        d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
      }
      thAtt(el, 'd', d); return g;
    },
  });
}

/* ---------- circuit parts ---------- */
// A battery lying along +x, centred on its origin, w long: the − end at −w/2, the + end (with the nub) at +w/2.
// Rotate it with r; its + and − marks stay drawn shapes, so they turn with it.
function battery(p, { x = 0, y = 0, w = 200, h = 84, r = 0, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, r, s, o }), k = w * .58;
  phBlock(g, -w / 2, -h / 2, k, h, '#2f3a3d', { top: 6 });
  phBlock(g, -w / 2 + k, -h / 2, w - k, h, '#e0a83a', { top: 6 });
  phBlock(g, w / 2, -h * .2, 14, h * .4, '#c3ccce', { top: 2 });
  path(g, signD(-1, h * .16), { stroke: '#e9e4d6', 'stroke-width': h * .09, 'stroke-linecap': 'butt' }).setAttribute('transform', `translate(${-w / 2 + h * .36} 0)`);
  path(g, signD(1, h * .16), { stroke: '#2f3a3d', 'stroke-width': h * .09, 'stroke-linecap': 'butt' }).setAttribute('transform', `translate(${w / 2 - h * .36} 0)`);
  return Object.assign(g, { w });
}
// A light bulb standing on its base at the origin (pointing up; rotate with r). b.set(k) lights it, 0 dark to 1 full.
function bulb(p, { x = 0, y = 0, s = 1, r = 0, o = 1 } = {}) {
  const g = G(p, { x, y, s, r, o });
  const glow = mk('circle', { cy: -104, r: 120, fill: LIGHT, opacity: 0 }, g);
  const glow2 = mk('circle', { cy: -104, r: 76, fill: LIGHT, opacity: 0 }, g);
  phBlock(g, -22, -44, 44, 44, '#9aa5a8', { top: 0 });
  path(g, 'M-22 -34H22M-22 -22H22M-22 -10H22', { stroke: '#6d7a78', 'stroke-width': 4 });
  const glass = path(g, 'M-20 -44C-24 -64 -54 -80 -54 -112A54 54 0 1 1 54 -112C54 -80 24 -64 20 -44Z', { fill: '#3a4a46', 'fill-opacity': .85, stroke: '#c8e0ff', 'stroke-width': 4 });
  path(g, 'M-10 -46V-96M10 -46V-96', { stroke: '#7d8a86', 'stroke-width': 4 });
  const fil = path(g, 'M-10 -96L-6 -112L-2 -96L2 -112L6 -96L10 -112', { stroke: '#8a7a6a', 'stroke-width': 4, fill: 'none' });
  let k0 = -1;
  return Object.assign(g, {
    set(k) {
      k = Math.round(Math.max(0, Math.min(1, k)) * 50) / 50; if (k === k0) return g; k0 = k;
      glow.setAttribute('opacity', (.28 * k).toFixed(2)); glow2.setAttribute('opacity', (.4 * k).toFixed(2));
      glass.setAttribute('fill', mix('#3a4a46', '#fff3c0', k)); fil.setAttribute('stroke', mix('#8a7a6a', '#ffffff', k));
      return g;
    },
  }).set(0);
}
// A knife switch from its hinge (origin) to the far post at (len, 0): sw.set(open) lifts the blade, 0 closed to 1 open.
function knifeSwitch(p, { x = 0, y = 0, len = 120, r = 0, s = 1 } = {}) {
  const g = G(p, { x, y, r, s });
  phBlock(g, -24, 6, len + 48, 18, '#4a5458', { top: 3 });
  const blade = G(g); phBlock(blade, -4, -7, len + 8, 14, '#c3ccce', { top: 3 });
  phBlock(blade, len - 10, -40, 12, 36, '#2f3a3d', { top: 0 });
  [0, len].forEach(cx => mk('circle', { cx, r: 12, fill: '#9aa5a8', ...phLine() }, g));
  return Object.assign(g, { blade, set(open) { put(blade, { r: -50 * open }); return g; } });
}

/* ---------- fields ---------- */
// Field lines between a source (+ charge, N pole) at src and a sink (− charge, S pole) at snk, each [x, y, strength]
// (either may be null). Lines start on a small circle round the source (or end on one round the sink when there is no
// source) at the given angles (degrees) and follow the field until they reach the other pole or leave box
// [x0, y0, x1, y1]. One path for the lines and one for the arrowheads, which crawl along them: f.set(phase) (one
// unit of phase moves each head on by one spacing). f.B(x, y) is the field there; f.lines the traced polylines.
function fieldLines(p, src, snk, { angles, r0 = 30, box = [0, 0, 1600, 900], color = COL.chalk, w = 4, step = 5, every = 150, head = 13, skip } = {}) {
  const B = (x, y) => {
    let bx = 0, by = 0;
    for (const [q, sg] of [[src, 1], [snk, -1]]) {
      if (!q) continue;
      const dx = x - q[0], dy = y - q[1], d2 = dx * dx + dy * dy, d3 = d2 * Math.sqrt(d2) || 1e-9;
      bx += sg * q[2] * dx / d3; by += sg * q[2] * dy / d3;
    }
    return [bx, by];
  };
  // trace from pole q at angle a (degrees), with the field (dir 1) or against it (−1), until the other pole or the box
  const trace = (q, a, dir, other) => {
    let x = q[0] + r0 * Math.cos(a * Math.PI / 180), y = q[1] + r0 * Math.sin(a * Math.PI / 180), hit = false;
    const pts = [[x, y]];
    for (let i = 0; i < 4000; i++) {
      const [bx, by] = B(x, y), L = Math.hypot(bx, by) || 1e-9;
      x += dir * step * bx / L; y += dir * step * by / L; pts.push([x, y]);
      if (x < box[0] || x > box[2] || y < box[1] || y > box[3]) break;
      if (other && Math.hypot(x - other[0], y - other[1]) < r0) { hit = true; break; }
    }
    if (dir < 0) pts.reverse();
    return [pts, hit];
  };
  const lines = [], add = pts => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); lines.push({ pts, cum, len: cum[cum.length - 1] }); };
  const phi = src && snk ? Math.atan2(snk[1] - src[1], snk[0] - src[0]) * 180 / Math.PI : 0;
  for (const a of angles) {
    const [pts, hit] = src ? trace(src, a, 1, snk) : trace(snk, a, -1, null);
    add(pts);
    // a line that left the box before reaching the other pole: draw its mirror image arriving at the other pole
    if (src && snk && !hit) add(trace(snk, 2 * phi + 180 - a, -1, src)[0]);
  }
  const g = G(p);
  let d = '';
  lines.forEach(l => { if (!skip?.(l)) d += l.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(''); });
  const el = path(g, d, { stroke: color, 'stroke-width': w, fill: 'none' }), hd = path(g, '', { stroke: color, 'stroke-width': w, fill: 'none' });
  const pointAt = (l, s) => { let i = 1; while (i < l.cum.length - 1 && l.cum[i] < s) i++; const [ax, ay] = l.pts[i - 1], [bx, by] = l.pts[i], u = (s - l.cum[i - 1]) / ((l.cum[i] - l.cum[i - 1]) || 1); return [ax + (bx - ax) * u, ay + (by - ay) * u, bx - ax, by - ay]; };
  return Object.assign(g, {
    el, hd, B, lines,
    set(ph = 0) {
      let h = '';
      lines.forEach(l => {
        if (skip?.(l)) return;
        const n = Math.max(1, Math.round(l.len / every)), gp = l.len / n;
        for (let k = 0; k < n; k++) {
          const s = (((k + ph) % n) + n) % n * gp + gp / 2; if (s < 24 || s > l.len - 24) continue;
          const [x, y, dx, dy] = pointAt(l, s), L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
          h += `M${(x - ux * head - uy * head * .7).toFixed(1)} ${(y - uy * head + ux * head * .7).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${(x - ux * head + uy * head * .7).toFixed(1)} ${(y - uy * head - ux * head * .7).toFixed(1)}`;
        }
      });
      thAtt(hd, 'd', h); return g;
    },
  }).set(0);
}
// A bar magnet along +x centred on its origin: S half red at −x, N half blue at +x. The letters keep upright when
// the magnet turns: m.turn(deg) sets its rotation and counter-rotates the letters.
function barMagnet(p, { x = 0, y = 0, len = 360, h = 90, r = 0, s = 1, o = 1, size } = {}) {
  const g = G(p, { x, y, s, o });
  const body = G(g);
  phBlock(body, -len / 2, -h / 2, len / 2, h, MAG_S, { top: 8 }); phBlock(body, 0, -h / 2, len / 2, h, MAG_N, { top: 8 });
  const fs = size || h * .62;
  const lS = G(body, { x: -len / 4 }), lN = G(body, { x: len / 4 });
  T(lS, 'S', { y: fs * .36, size: fs, weight: 800, fill: '#fff', anchor: 'middle' }); T(lN, 'N', { y: fs * .36, size: fs, weight: 800, fill: '#fff', anchor: 'middle' });
  return Object.assign(g, { len, body, turn(deg) { put(body, { r: deg }); put(lS, { r: -deg }); put(lN, { r: -deg }); return g; } }).turn(r);
}
// A compass, centred on its origin: c.set(deg) points the needle's N end (blue) at deg (0 right, −90 up).
function compass(p, { x = 0, y = 0, r = 54, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  mk('circle', { r: r + 8, fill: '#9aa5a8', ...phLine(3) }, g); mk('circle', { r, fill: '#ebe6d8' }, g);
  path(g, Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a), k = i % 2 ? .86 : .78; return `M${(c * r * k).toFixed(1)} ${(sn * r * k).toFixed(1)}L${(c * r * .94).toFixed(1)} ${(sn * r * .94).toFixed(1)}`; }).join(''), { stroke: '#7d8a86', 'stroke-width': 3 });
  const needle = G(g), L = r * .82, W = r * .2;
  path(needle, `M0 ${-W}L${L} 0L0 ${W}Z`, { fill: MAG_N, ...phLine(2) }); path(needle, `M0 ${-W}L${-L} 0L0 ${W}Z`, { fill: MAG_S, ...phLine(2) });
  mk('circle', { r: W * .5, fill: '#2f3a3d' }, g);
  return Object.assign(g, { needle, set(deg) { put(needle, { r: deg }); return g; } });
}
// A needle settling on `to` (degrees) after being released at t0 from `from`: a damped swing, a pure function of t.
const settle = (t, t0, from, to, { k = 1.6, hz = 1.1 } = {}) => t < t0 ? from : to + (from - to) * Math.exp(-k * (t - t0)) * Math.cos(TAU * hz * (t - t0));
// A coil of copper wire along x, centred on its origin, len long and 2r tall, on a grey iron core: c.set(turns)
// redraws it. The front of each turn is bright, the back dim.
function coilEl(p, { x = 0, y = 0, len = 360, r = 70, turns = 6, w = 10, core = true } = {}) {
  const g = G(p, { x, y });
  if (core) phBlock(g, -len / 2 - 40, -r * .55, len + 80, r * 1.1, '#7d8a86', { top: 6 });
  const back = path(g, '', { stroke: dk(COPPER, .35), 'stroke-width': w, fill: 'none' }), front = path(g, '', { stroke: COPPER, 'stroke-width': w, fill: 'none' });
  return Object.assign(g, {
    set(n) {
      const pt = len / n; let b = '', f = '';
      for (let i = 0; i < n; i++) { const x0 = -len / 2 + i * pt; f += `M${x0.toFixed(1)} ${r}L${(x0 + pt / 2).toFixed(1)} ${-r}`; b += `M${(x0 + pt / 2).toFixed(1)} ${-r}L${(x0 + pt).toFixed(1)} ${r}`; }
      thAtt(back, 'd', b); thAtt(front, 'd', f); return g;
    },
  }).set(turns);
}
// A motor or generator: a rectangular loop of wire turning on an axle that runs into the picture (oblique view)
// between an N magnet (left) and an S magnet (right). The loop's long sides sit R from the axle; dep is the depth
// vector of the axle in screen px. a.set(theta, s) turns the loop to theta (radians; it turns clockwise on screen as
// theta grows) and moves its electrons s px along it. a.side(theta, i) is the screen centre of long side i, for force
// arrows; a.front is the axle's front end, where the brushes and a pulley or fan sit.
function armature(p, { x = 0, y = 0, R = 130, dep = [190, -120], gap = 70 } = {}) {
  const g = G(p, { x, y }), [dx, dy] = dep;
  const mag = (x0, w, c, letter) => {   // a magnet block: front face plus an oblique top and side
    const m = G(g), top = -R - 40, h = 2 * R + 80;
    path(m, `M${x0} ${top}l${dx} ${dy}h${w}l${-dx} ${-dy}Z`, { fill: lt(c, .25), ...phLine() });
    path(m, `M${x0 + w} ${top}l${dx} ${dy}v${h}l${-dx} ${-dy}Z`, { fill: dk(c, .25), ...phLine() });
    mk('rect', { x: x0, y: top, width: w, height: h, fill: c, ...phLine() }, m);
    T(m, letter, { x: x0 + w / 2, y: top + 70, size: 72, weight: 800, fill: '#fff', anchor: 'middle' });   // high on the face, clear of the force arrows
    return m;
  };
  const W = 120, left = mag(-R - gap - W, W, MAG_N, 'N');
  const lines = path(g, '', { stroke: MAGF, 'stroke-width': 3, 'stroke-dasharray': '10 12', opacity: .8 });
  const axle = path(g, `M${-dx * .9} ${-dy * .9}L${dx * 1.15} ${dy * 1.15}`, { stroke: '#9aa5a8', 'stroke-width': 10 });
  const back = path(g, '', { stroke: dk(COPPER, .3), 'stroke-width': 11, fill: 'none' });
  const loopF = path(g, '', { stroke: COPPER, 'stroke-width': 12, fill: 'none', 'stroke-linejoin': 'round' });
  const dots = path(g, '', { fill: CHG_N, stroke: PH.out, 'stroke-width': 2 });
  const right = mag(R + gap, W, MAG_S, 'S');
  // the field: straight dashed lines from N to S, drawn at a few heights and depths
  let ld = ''; [-.7, -.2, .3, .8].forEach(k => [0, .5].forEach(q => { const yy = k * R + q * dy, x0 = -R - gap + q * dx, x1 = R + gap + q * dx; ld += `M${x0.toFixed(1)} ${yy.toFixed(1)}H${x1.toFixed(1)}`; }));
  lines.setAttribute('d', ld);
  const front = [-dx * .9, -dy * .9];
  const ring = mk('circle', { cx: front[0] * .55, cy: front[1] * .55, r: 18, fill: '#d9a440', ...phLine(2) }, g);
  const corner = th => { const c = Math.cos(th), s = Math.sin(th); return [[R * c, R * s], [-R * c, -R * s]]; };
  return Object.assign(g, {
    left, right, lines, front, axle, ring,
    side(th, i) { const [P1, P2] = corner(th), P = i ? P2 : P1; return [P[0] + dx / 2, P[1] + dy / 2]; },
    set(th, s = 0) {
      const [[ax, ay], [bx, by]] = corner(th);
      const pts = [[ax, ay], [ax + dx, ay + dy], [bx + dx, by + dy], [bx, by]];
      thAtt(back, 'd', `M${(ax + dx).toFixed(1)} ${(ay + dy).toFixed(1)}L${(bx + dx).toFixed(1)} ${(by + dy).toFixed(1)}`);
      thAtt(loopF, 'd', `M${(ax + dx).toFixed(1)} ${(ay + dy).toFixed(1)}L${ax.toFixed(1)} ${ay.toFixed(1)}L${(ax * .2).toFixed(1)} ${(ay * .2).toFixed(1)}M${(bx * .2).toFixed(1)} ${(by * .2).toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}L${(bx + dx).toFixed(1)} ${(by + dy).toFixed(1)}`);
      // electrons: along side a into the picture, across the back, out along side b
      const segL = [Math.hypot(dx, dy), 2 * R, Math.hypot(dx, dy)], tot = segL[0] * 2 + segL[1];
      let d = ''; const gp = tot / 7;
      for (let u = ((s % gp) + gp) % gp; u < tot; u += gp) {
        let k = 0, v = u; while (k < 2 && v > segL[k]) { v -= segL[k]; k++; }
        const q = v / segL[k], [x0, y0] = pts[k], [x1, y1] = pts[k + 1], px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q;
        d += `M${(px - 7).toFixed(1)} ${py.toFixed(1)}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`;
      }
      thAtt(dots, 'd', d);
      return g;
    },
  }).set(0);
}
