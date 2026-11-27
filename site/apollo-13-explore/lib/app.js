// Apollo 13, the way home: a schematic Earth–Moon drawing, a mission clock and eight stops.
// The Moon's place is real (JPL Horizons, lib/moon.js). The spacecraft's line is a sketch that passes NASA's measured
// distances from Earth (Mission Report Table 4-II) at the moments it lists; its direction between them is drawn by hand.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const D2R = Math.PI / 180;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const hours = met => { const [h, m, s] = met.split(':').map(Number); return h + m / 60 + s / 3600; };
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const fmtMET = t => { const s = Math.round(t * 3600); return `${pad(Math.floor(s / 3600), 3)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
  const fmtUTC = (t, sec) => {
    const d = new Date(LAUNCH_UTC + Math.round(t * 3600) * 1000);
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
    return `${d.getUTCDate()} ${mon} 1970, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}${sec ? ':' + pad(d.getUTCSeconds()) : ''} UTC`;
  };
  const smooth = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const lerp = (a, b, f) => a + (b - a) * f;
  const mix = (p, q, f) => [lerp(p[0], q[0], f), lerp(p[1], q[1], f)];
  const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];

  // ---- the Moon, hour by hour, turned so it sits to the right at the flyby ----
  const T_END = hours(END_MET), T_PERI = hours('077:20:57'), T_PC2 = hours('079:27:39'), T_FREE_END = 152;
  const ROW0 = (Date.parse(MOON.start) - LAUNCH_UTC) / 3.6e6;   // MET of the first row (−13 min)
  function moon3(t) {
    const f = Math.min(Math.max((t - ROW0) / MOON.stepHours, 0), MOON.xyz.length - 1.0001), i = Math.floor(f), k = f - i;
    const a = MOON.xyz[i], b = MOON.xyz[i + 1];
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }
  const rot0 = (([x, y]) => -Math.atan2(y, x))(moon3(T_PERI));
  const moon = t => { const [x, y] = moon3(t), c = Math.cos(rot0), s = Math.sin(rot0); return [x * c - y * s, x * s + y * c]; };
  const moonDist = t => Math.hypot(...moon3(t));
  const ang = p => Math.atan2(p[1], p[0]);

  // ---- the spacecraft's schematic line ----
  const RE = 6378, E_DISP = 17000, M_DISP = 13000;   // km; Earth and Moon drawn larger than true size
  // centre distances: NASA altitude + Earth radius (Table 4-II); near the Moon, distance from the Moon's centre
  const OUT = [[2.596, 6573], [2.696, 6716], [30.681, 231177], [61.495, 355242], [T_PERI, Math.hypot(...moon(T_PERI))]];
  const BACK = [[T_PC2, Math.hypot(...moon(T_PC2)) - 11859], [105.308, 288297], [137.664, 76399], [138.030, 72485],
    [141.5, 27227], [142.679, 6500], [T_END, RE]];
  function along(table, t) {   // interpolated in r^1.5: fast near Earth, slow far out, as a coasting craft is
    if (t <= table[0][0]) return table[0][1];
    for (let i = 1; i < table.length; i++) if (t <= table[i][0]) {
      const [t0, r0] = table[i - 1], [t1, r1] = table[i];
      return lerp(r0 ** 1.5, r1 ** 1.5, (t - t0) / (t1 - t0)) ** (1 / 1.5);
    }
    return table[table.length - 1][1];
  }
  const lift = r => r + (E_DISP - RE) * Math.exp(-(r - RE) / 50000);   // keep the line off the enlarged Earth
  const RA = OUT[OUT.length - 1][1], RD = BACK[0][1], TH_D = ang(moon(T_PC2)) - 2.5 * D2R, LOOP0 = 21000;
  const planDelta = t => (t < 30.681 ? 0 : -3 * D2R * smooth((t - 30.681) / 43));
  const flownDelta = t => (t < 61.495 ? planDelta(t) : planDelta(61.495) * (1 - smooth((t - 61.495) / 10)));
  function outbound(t, delta) {
    if (t < 2.596) return polar(lift(6573), -143 * D2R - (2.596 - t) * 245 * D2R);   // circling Earth, one turn in ~1.5 h
    const r = along(OUT, t);
    return polar(lift(r), -150 * D2R * (1 - r / RA) ** 3 + delta(t));
  }
  function homeward(t, bulge) {
    const r = along(BACK, t), s = (t - T_PC2) / (T_END - T_PC2);
    return polar(lift(r), TH_D + 150 * D2R * (1 - r / RD) ** 3 + bulge * Math.sin(Math.PI * Math.min(Math.max(s, 0), 1)));
  }
  // The line is a centripetal Catmull–Rom spline through key points, so it bends without kinks or loops of its own.
  // Far from the Moon the keys come from outbound() and homeward(); near it they are placed by hand, relative to where
  // the Moon is at that hour, going clockwise around its far side (as a free return does).
  const rel = (t, deg, d) => { const m = moon(t), a = ang(m) + deg * D2R; return [m[0] + d * Math.cos(a), m[1] + d * Math.sin(a)]; };
  function spline(keys) {
    const T = keys.map(k => k[0]), P = keys.map(k => k[1]);
    return t => {
      let i = 0;
      while (i < T.length - 2 && t > T[i + 1]) i++;
      const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, P.length - 1)];
      const u = Math.min(Math.max((t - T[i]) / (T[i + 1] - T[i]), 0), 1);
      const d = (a, b) => Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5, 1e-6);
      const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3), tt = lerp(t1, t2, u);
      const L = (a, b, ta, tb) => (ta === tb ? a : [0, 1].map(j => ((tb - tt) * a[j] + (tt - ta) * b[j]) / (tb - ta)));
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      return L(L(A1, A2, t0, t2), L(A2, A3, t1, t3), t1, t2);
    };
  }
  const OUT_T = [2.596, 3.5, 5, 7, 10, 14, 19, 25, 30.681, 38, 46, 55.915, 61.495, 66, 70];
  const LOOP = [[73, rel(73, 118, 26000)], [75.5, rel(75.5, 78, 22500)], [T_PERI, rel(T_PERI, 0, LOOP0)],
    [T_PC2, rel(T_PC2, -78, 23000)], [81.5, rel(81.5, -116, 29000)]];
  const BACK_T = [84, 88, 94, 100, 105.308, 112, 120, 128, 134, 137.664, 140.2, 141.5, 142.3, 142.679, T_END];
  const flownLine = spline([...OUT_T.map(t => [t, outbound(t, flownDelta)]), ...LOOP, ...BACK_T.map(t => [t, homeward(t, 0)])]);
  const flown = t => (t < 2.596 ? outbound(t, flownDelta) : flownLine(t));
  // free return only: the same until PC+2, then stretched to land at about 152 h, a little wider
  const stretch = t => T_PC2 + (t - T_PC2) * (T_END - T_PC2) / (T_FREE_END - T_PC2);
  const freeOnly = spline([...LOOP.slice(0, 4), [82.5, rel(82.5, -108, 31000)],
    ...[88, 96, 104, 114, 124, 134, 142, 147, 150, 151.4, T_FREE_END].map(t => [t, homeward(stretch(t), 9 * D2R)])]);
  // the plan: the landing route, into orbit around the Moon
  const T_LOI = 77, R_ORBIT = M_DISP + 6000;
  const planned = spline([...OUT_T.slice(8).map(t => [t, outbound(t, planDelta)]), [73, rel(73, 122, 27000)], [T_LOI, rel(T_LOI, 90, R_ORBIT)]]);
  const ORBIT = (() => { const m = moon(T_LOI), a0 = ang(m) + 90 * D2R, o = [];
    for (let i = 0; i <= 48; i++) { const a = a0 - i / 48 * 2 * Math.PI; o.push([m[0] + R_ORBIT * Math.cos(a), m[1] + R_ORBIT * Math.sin(a)]); }
    return o; })();
  const sample = (f, a, b, n) => Array.from({ length: n + 1 }, (_, i) => f(lerp(a, b, i / n)));
  const LINES = {
    flown: sample(flown, 0, T_END, 900),
    free: sample(freeOnly, T_PC2, T_FREE_END, 400),
    planned: sample(planned, 30.681, T_LOI, 300).concat(ORBIT),
  };
  const MOON_TRACK = sample(moon, 0, T_END, 200);

  // ---- state ----
  const EV = EVENTS.map((e, i) => ({ ...e, n: i + 1, t: hours(e.met) }));
  let t = 0, route = 'flown', open = null, playing = false, glide = null;
  const svg = $('#map'), slider = $('#met');
  slider.max = Math.round(T_END * 3600);
  let view = null;   // { s, ox, oy } km → px

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const px = p => [view.ox + p[0] * view.s, view.oy - p[1] * view.s];
  const pathD = pts => 'M' + pts.map(p => px(p).map(v => v.toFixed(1)).join(',')).join('L');

  // ---- drawing (rebuilt on resize; the moving parts updated per frame) ----
  let dyn = {};
  // two framings: the whole trip, and close to the Moon (stops 1 to 6 happen within a day's travel of it)
  const CLOSE = [52, 95];
  function box(pts, padE) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x - padE); x1 = Math.max(x1, x + padE); y0 = Math.min(y0, y - padE); y1 = Math.max(y1, y + padE); }
    return [x0, x1, y0, y1];
  }
  const BOX = {
    whole: box([...LINES.flown, ...LINES.free, ...LINES.planned, ...MOON_TRACK, [-E_DISP, -E_DISP], [E_DISP, E_DISP]], M_DISP),
    close: box([...sample(flown, CLOSE[0], CLOSE[1], 200), ...sample(moon, CLOSE[0], CLOSE[1], 40)], M_DISP + 6000),
  };
  let zoom = 'whole', pinned = null, cam = null, camAnim = null;
  const zoneOf = v => (v >= CLOSE[0] && v <= CLOSE[1] ? 'close' : 'whole');
  function fit(b, w, h) {
    const m = Math.max(28, Math.min(w, h) * 0.07), top = 58;   // the zoom button sits in the top band
    const s = Math.min((w - 2 * m) / (b[1] - b[0]), (h - m - top) / (b[3] - b[2]));
    return { s, cx: (b[0] + b[1]) / 2, cy: (b[2] + b[3]) / 2 + (top - m) / 2 / s };
  }
  function setView(c) {
    const w = svg.clientWidth, h = svg.clientHeight;
    view = { s: c.s, ox: w / 2 - c.cx * c.s, oy: h / 2 + c.cy * c.s, w, h };
  }
  function layout() {
    const w = svg.clientWidth, h = svg.clientHeight;
    if (!w || !h) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    cancelAnimationFrame(camAnim);
    cam = fit(BOX[zoom], w, h);
    setView(cam);
    draw();
  }
  function setZoom(z) {
    if (z === zoom) return;
    zoom = z;
    $('#zoom').textContent = z === 'close' ? 'Show the whole trip' : 'Zoom in on the Moon';
    $('#zoom').setAttribute('aria-pressed', z === 'close' ? 'true' : 'false');
    const w = svg.clientWidth, h = svg.clientHeight, from = cam, to = fit(BOX[z], w, h);
    cancelAnimationFrame(camAnim);
    if (reduce.matches || !view) { cam = to; setView(cam); return draw(); }
    const t0 = performance.now();
    const step = now => {   // ease the scale on a log scale, so zooming in and out feel the same
      const k = smooth((now - t0) / 700);
      cam = { s: Math.exp(lerp(Math.log(from.s), Math.log(to.s), k)), cx: lerp(from.cx, to.cx, k), cy: lerp(from.cy, to.cy, k) };
      setView(cam); draw();
      if (k < 1) camAnim = requestAnimationFrame(step);
    };
    camAnim = requestAnimationFrame(step);
  }
  function follow() {   // the camera follows the clock unless the reader chose a framing for this part of the trip
    const z = zoneOf(t);
    if (pinned && pinned.zone !== z) pinned = null;
    setZoom(pinned ? pinned.zoom : z);
  }

  function draw() {
    svg.textContent = '';
    const s = view.s, small = view.w < 520;
    const bg = el('g', { class: 'bg' }, svg);
    const e = px([0, 0]), g = px(moon(T_PERI));
    const placed = [{ x: e[0], y: e[1], r: E_DISP * s + 4 }, { x: g[0], y: g[1], r: M_DISP * s + 2 }];
    // the Moon's real track, a dot at each midnight UTC
    el('path', { d: pathD(MOON_TRACK), class: 'moon-track' }, bg);
    for (let day = 12; day <= 17; day++) {
      const tm = (Date.UTC(1970, 3, day) - LAUNCH_UTC) / 3.6e6, p = px(moon(tm));
      if (Math.hypot(p[0] - g[0], p[1] - g[1]) < M_DISP * s + 30) continue;   // under the flyby loop: leave it out
      el('circle', { cx: p[0], cy: p[1], r: 2.5, class: 'moon-day' }, bg);
      const lab = el('text', { x: p[0] + 8, y: p[1] + 4, class: 'day', 'data-t': tm }, bg);
      lab.textContent = `${day} Apr`;
      placed.push({ x: p[0] + 26, y: p[1], r: 16 });
    }
    // where the Moon was at the flyby: the loop is drawn around it
    el('circle', { cx: g[0], cy: g[1], r: M_DISP * s, class: 'ghost' }, bg);
    // the three routes; the chosen one drawn last, on top
    const routes = el('g', { class: 'routes' }, svg);
    dyn.route = {};
    for (const k of ['planned', 'free', 'flown'].sort((a, b) => (a === route) - (b === route))) {
      const p = el('path', { d: pathD(LINES[k]), class: `route ${k}${k === route ? ' on' : ''}` }, routes);
      dyn.route[k] = p;
    }
    // the trail so far: the way out, and (once past the Moon) the way home on top, the way out dimmed under it
    dyn.trailOut = el('path', { class: 'trail out' + (route === 'flown' ? '' : ' off') }, routes);
    dyn.trailHome = el('path', { class: 'trail' + (route === 'flown' ? '' : ' off') }, routes);
    // Earth
    el('circle', { cx: e[0], cy: e[1], r: E_DISP * s, class: 'earth' }, svg);
    const el1 = el('text', { x: e[0], y: e[1] + E_DISP * s + 18, class: 'body-label', 'text-anchor': 'middle' }, svg);
    el1.textContent = 'Earth';
    // the Moon now
    dyn.moon = el('circle', { r: M_DISP * s, class: 'moon' }, svg);
    dyn.moonLabel = el('text', { class: 'body-label', 'text-anchor': 'end' }, svg);
    dyn.moonLabel.textContent = 'Moon';
    // the eight stops, numbered, labels kept off one another and off Earth and the Moon
    const marks = el('g', { class: 'marks' }, svg);
    const R = small ? 9 : 11, dist = small ? 20 : 26;
    const dots = EV.map(ev => px(flown(ev.t)));
    dots.forEach(p => placed.push({ x: p[0], y: p[1], r: 5 }));
    dyn.marks = EV.map((ev, i) => {
      const p = dots[i];
      let best = null;
      for (let k = 0; k < 16 && !best; k++) for (const d of [dist, dist * 1.6, dist * 2.3]) {
        const a = (k * 22.5 + 45) * D2R, q = { x: p[0] + d * Math.cos(a), y: p[1] - d * Math.sin(a), r: R + 2 };
        if (q.x < R || q.x > view.w - R || q.y < R || q.y > view.h - R) continue;
        if (!placed.some(o => Math.hypot(o.x - q.x, o.y - q.y) < o.r + q.r)) { best = q; break; }
      }
      best = best || { x: p[0], y: p[1] - dist, r: R };
      placed.push(best);
      const a = el('g', { class: 'mark', 'data-id': ev.id, 'aria-hidden': 'true' }, marks);
      el('line', { x1: p[0], y1: p[1], x2: best.x, y2: best.y, class: 'leader' }, a);
      el('circle', { cx: p[0], cy: p[1], r: 3.5, class: 'dot' }, a);
      el('circle', { cx: best.x, cy: best.y, r: R, class: 'badge' }, a);
      const n = el('text', { x: best.x, y: best.y + 4.5, 'text-anchor': 'middle', class: 'num' }, a);
      n.textContent = ev.n;
      el('circle', { cx: best.x, cy: best.y, r: R + 8, class: 'hit' }, a);   // a finger-sized target
      a.addEventListener('click', () => openEvent(ev.id));
      return a;
    });
    // the spacecraft
    dyn.craft = el('g', { class: 'craft' }, svg);
    el('circle', { r: 9, class: 'halo' }, dyn.craft);
    el('path', { d: 'M0,-6 L5,4 L-5,4 Z', class: 'ship' }, dyn.craft);
    update();
  }

  function update() {
    if (!view) return;
    const m = px(moon(t));
    dyn.moon.setAttribute('cx', m[0]); dyn.moon.setAttribute('cy', m[1]);
    dyn.moonLabel.setAttribute('x', m[0] - M_DISP * view.s - 8);
    dyn.moonLabel.setAttribute('y', m[1] + 5);
    dyn.moonLabel.style.display = zoom === 'close' ? 'none' : '';   // close up, the Moon needs no name and the stops need the room
    svg.querySelectorAll('.day').forEach(d => { d.style.display = Math.abs(d.dataset.t - t) < 9 ? 'none' : ''; });   // under the Moon now
    const n = Math.floor(t / T_END * 900), nP = Math.floor(T_PERI / T_END * 900), now = flown(t);
    dyn.trailOut.setAttribute('d', n ? pathD(LINES.flown.slice(0, Math.min(n, nP) + 1).concat(t < T_PERI ? [now] : [])) : '');
    dyn.trailHome.setAttribute('d', t > T_PERI ? pathD(LINES.flown.slice(nP, n + 1).concat([now])) : '');
    dyn.trailOut.classList.toggle('behind', t > T_PERI);
    const c = px(flown(t));
    dyn.craft.setAttribute('transform', `translate(${c[0].toFixed(1)},${c[1].toFixed(1)})`);
    dyn.marks.forEach((a, i) => { a.classList.toggle('past', EV[i].t <= t + 1e-6); a.classList.toggle('open', open === EV[i].id); });
    // the readouts
    const phase = PHASES.filter(p => p[0] <= t + 1e-6).pop()[1];
    $('#now-met').textContent = fmtMET(t);
    $('#now-utc').textContent = fmtUTC(t);
    $('#now-phase').textContent = phase;
    $('#now-moon').textContent = Math.round(moonDist(t)).toLocaleString('en-US');
    slider.value = Math.round(t * 3600);
    slider.setAttribute('aria-valuetext', `Mission clock ${fmtMET(t)}, ${fmtUTC(t)}. ${phase}.`);
    const last = EV.filter(e => e.t <= t + 1e-6).pop();
    document.querySelectorAll('#events li').forEach(li => li.classList.toggle('reached', !!last && EV.find(e => e.id === li.dataset.id).t <= t + 1e-6));
  }

  function setT(v) { t = Math.min(Math.max(v, 0), T_END); follow(); update(); }

  // glide the clock to a time (no glide for reduced motion)
  function glideTo(v) {
    cancelAnimationFrame(glide);
    if (reduce.matches) return setT(v);
    const from = t, t0 = performance.now(), dur = Math.min(900, 250 + Math.abs(v - from) * 12);
    const step = now => { const k = smooth((now - t0) / dur); setT(lerp(from, v, k)); if (k < 1) glide = requestAnimationFrame(step); };
    glide = requestAnimationFrame(step);
  }

  // ---- the card ----
  const card = $('#card');
  function openEvent(id, focus = true) {
    const ev = EV.find(e => e.id === id);
    open = id;
    stopPlay();
    glideTo(ev.t);
    $('#card-n').textContent = ev.n;
    $('#card-h').textContent = ev.title;
    $('#card-when').innerHTML = `<b>MET ${ev.met.replace(/\.\d+$/, '')}</b> <span>${fmtUTC(ev.t, true)}</span>`;
    const figs = $('#card-figs');
    figs.textContent = '';
    for (const p of ev.pics) {
      const f = document.createElement('figure');
      f.innerHTML = `<img src="${p.src}" width="${p.w}" height="${p.h}" alt="" loading="lazy"><figcaption></figcaption>`;
      f.querySelector('img').alt = p.alt;
      f.querySelector('figcaption').textContent = p.cap;
      figs.appendChild(f);
    }
    figs.classList.toggle('two', ev.pics.length > 1);
    $('#card-text').innerHTML = ev.text.map(() => '<p></p>').join('');
    $('#card-text').querySelectorAll('p').forEach((p, i) => { p.textContent = ev.text[i]; });
    $('#card-facts').textContent = ev.facts;
    $('#card-src').textContent = ev.source;
    $('#card-audio').hidden = !ev.audio;
    if (!ev.audio) document.querySelectorAll('#card-audio audio').forEach(a => a.pause());
    const prev = EV[ev.n - 2], next = EV[ev.n];
    $('#prev').hidden = !prev; $('#next').hidden = !next;
    if (prev) $('#prev span').textContent = prev.short;
    if (next) $('#next span').textContent = next.short;
    card.hidden = false;
    document.querySelectorAll('#events button').forEach(b => b.setAttribute('aria-current', b.dataset.id === id ? 'true' : 'false'));
    update();
    if (focus) {
      $('#card-h').focus({ preventScroll: true });
      // phones: the card is below the drawing; desktop: the card may have been scrolled past, reading the list
      if (matchMedia('(max-width: 899px)').matches || card.getBoundingClientRect().top < 0)
        card.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  function closeCard() {
    if (!open) return;
    const id = open;
    open = null;
    card.hidden = true;
    document.querySelectorAll('#card-audio audio').forEach(a => a.pause());
    document.querySelectorAll('#events button').forEach(b => b.setAttribute('aria-current', 'false'));
    update();
    $(`#events button[data-id="${id}"]`).focus();
  }
  $('#close').addEventListener('click', closeCard);
  $('#prev').addEventListener('click', () => openEvent(EV[EV.findIndex(e => e.id === open) - 1].id));
  $('#next').addEventListener('click', () => openEvent(EV[EV.findIndex(e => e.id === open) + 1].id));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });

  // the recordings and their words
  const audioBox = $('#card-audio');
  for (const c of CLIPS) {
    const d = document.createElement('div');
    d.className = 'clip';
    d.innerHTML = `<p class="clip-name"></p><audio controls preload="none"></audio>
      <details><summary>Read the words</summary><ol class="transcript"></ol></details>`;
    d.querySelector('.clip-name').textContent = `${c.name} (${c.len})`;
    d.querySelector('audio').src = c.src;
    const ol = d.querySelector('ol');
    for (const [met, who, words] of c.lines) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="met"></span> <b></b> <span class="w"></span>';
      li.querySelector('.met').textContent = met;
      li.querySelector('b').textContent = who + ':';
      li.querySelector('.w').textContent = words;
      ol.appendChild(li);
    }
    audioBox.appendChild(d);
  }
  audioBox.addEventListener('play', e => audioBox.querySelectorAll('audio').forEach(a => a !== e.target && a.pause()), true);
  const note = document.createElement('p');
  note.className = 'clip-note';
  note.textContent = CLIP_NOTE + ' The words are from NASA’s transcript; the longer recording skips some quiet stretches, and fillers such as “uh” are left out.';
  audioBox.appendChild(note);

  // ---- the event list ----
  const list = $('#events');
  for (const ev of EV) {
    const li = document.createElement('li');
    li.dataset.id = ev.id;
    li.innerHTML = `<button type="button" data-id="${ev.id}" aria-current="false"><span class="n">${ev.n}</span><span class="t"></span><span class="m">MET ${ev.met.replace(/\.\d+$/, '').replace(/^0/, '')}</span></button>`;
    li.querySelector('.t').textContent = ev.title;
    li.querySelector('button').addEventListener('click', () => openEvent(ev.id));
    list.appendChild(li);
  }
  // ticks under the slider (pointer only; the list is the keyboard way)
  const ticks = $('#ticks');
  for (const ev of EV) {
    const b = document.createElement('button');
    b.type = 'button'; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true');
    b.textContent = ev.n; b.title = ev.title;
    b.style.left = `${ev.t / T_END * 100}%`;
    b.addEventListener('click', () => openEvent(ev.id, false));
    ticks.appendChild(b);
  }

  // ---- the clock ----
  slider.addEventListener('input', () => { stopPlay(); cancelAnimationFrame(glide); setT(slider.value / 3600); });
  slider.addEventListener('keydown', e => {
    const k = e.key;
    let v = null;
    if (k === 'ArrowRight' || k === 'ArrowUp') v = t + (e.shiftKey ? 1 / 6 : 1);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') v = t - (e.shiftKey ? 1 / 6 : 1);
    else if (k === 'PageUp') { const n = EV.find(ev => ev.t > t + 1e-3); if (n) { e.preventDefault(); openEvent(n.id, false); } return; }
    else if (k === 'PageDown') { const p = EV.filter(ev => ev.t < t - 1e-3).pop(); if (p) { e.preventDefault(); openEvent(p.id, false); } return; }
    else if (k === 'Home') v = 0;
    else if (k === 'End') v = T_END;
    else if (k === 'Enter') { const p = EV.filter(ev => ev.t <= t + 1e-3).pop(); if (p) openEvent(p.id); return; }
    if (v === null) return;
    e.preventDefault(); stopPlay(); cancelAnimationFrame(glide); setT(v);
  });

  // play: the clock runs at 6 hours a second and stops at each stop with its card open
  const playBtn = $('#play');
  let last = 0;
  function frame(now) {
    if (!playing) return;
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const v = t + dt * 6, n = EV.find(ev => ev.t > t + 1e-6 && ev.t <= v);
    if (n) { setT(n.t); openEvent(n.id, false); playBtn.querySelector('span').textContent = n.n < EV.length ? 'Go on' : 'Play again'; return; }
    setT(v);
    if (t >= T_END) { stopPlay(); return; }
    requestAnimationFrame(frame);
  }
  function stopPlay() {
    if (!playing) return;
    playing = false;
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.querySelector('span').textContent = t >= T_END - 1e-6 ? 'Play again' : 'Go on';
  }
  playBtn.addEventListener('click', () => {
    if (playing) return stopPlay();
    cancelAnimationFrame(glide);
    if (t >= T_END - 1e-6) setT(0);
    if (open) {
      open = null; card.hidden = true;
      document.querySelectorAll('#card-audio audio').forEach(a => a.pause());
      document.querySelectorAll('#events button').forEach(b => b.setAttribute('aria-current', 'false'));
    }
    playing = true; last = performance.now();
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.querySelector('span').textContent = 'Pause';
    requestAnimationFrame(frame);
  });

  // ---- the routes ----
  document.querySelectorAll('input[name="route"]').forEach(r => r.addEventListener('change', () => {
    route = r.value;
    $('#route-text').textContent = ROUTES[route].text;
    draw();
    // the plan differs from what flew only near the Moon: show it there
    if (route === 'planned' && zoom !== 'close') { pinned = { zone: zoneOf(t), zoom: 'close' }; setZoom('close'); }
  }));
  $('#route-text').textContent = ROUTES[route].text;

  $('#zoom').addEventListener('click', () => { const z = zoom === 'close' ? 'whole' : 'close'; pinned = { zone: zoneOf(t), zoom: z }; setZoom(z); });

  new ResizeObserver(() => layout()).observe(svg);
  layout();
  // a test hook: the stops, the clock and the routes, for the page's own checks
  window.APOLLO = { events: EV.map(e => e.id), open: openEvent, close: closeCard, setT: v => { cancelAnimationFrame(glide); stopPlay(); setT(v); }, get t() { return t; }, get open() { return open; },
    endMET: T_END, ready: true };
  document.body.classList.add('ready');
})();
