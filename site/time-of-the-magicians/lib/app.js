/* The map you explore: each new year plays its events on the map, then each of the four who travels walks it in a
   close-up; a card for each of them.
   Data: lib/borders.js (BORDERS, made by books/time-of-the-magicians/borders.py), lib/story.js (PEOPLE, PLACES,
   START, COUNTRIES, SEAS, YEARS), lib/events.js (EVENTS), img/cards/pictures.js (CARD_PICS), audio/voiced.js (VOICED: the card clips that exist, e.g. '1923-h'). */
'use strict';
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = s => document.querySelector(s);
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const B = window.BORDERS, svg = $('#map');
  const FIRST = 1919, LAST = 1929, WHO = Object.keys(PEOPLE);
  const VOICED = new Set(window.VOICED || []);
  const CARD_PICS = new Set(window.CARD_PICS || []);   // img/cards/pictures.js, written by books/.../credits.py
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- projection: the one borders.py used ---------- */
  const R = Math.PI / 180, S0 = Math.sin(B.lat0 * R), C0 = Math.cos(B.lat0 * R);
  function xy(lon, lat) {
    const l = (lon - B.lon0) * R, f = lat * R;
    const k = Math.sqrt(2 / (1 + S0 * Math.sin(f) + C0 * Math.cos(f) * Math.cos(l)));
    const x = k * Math.cos(f) * Math.sin(l), y = k * (C0 * Math.sin(f) - S0 * Math.cos(f) * Math.cos(l));
    return [B.w / 2 + B.scale * (x - B.xc), B.h / 2 - B.scale * (y - B.yc)];
  }
  const P = {};
  for (const [key, [name, lon, lat, side]] of Object.entries(PLACES)) P[key] = { key, name, side: side || 'r', p: xy(lon, lat) };

  /* ---------- checks: say what the story asks for that the map cannot do ---------- */
  const where = {};   // where[year][who]: the resting place at the end of that year; where[FIRST - 1] the start
  where[FIRST - 1] = { ...START };
  for (let y = FIRST; y <= LAST; y++) {
    const Y = YEARS[y];
    if (!Y) { console.error(`story.js: no YEARS[${y}]`); continue; }
    where[y] = {};
    for (const w of WHO) {
      const c = Y[w];
      if (!c) { console.error(`story.js: ${y} has no card for ${w}`); where[y][w] = where[y - 1][w]; continue; }
      for (const k of c.route || []) if (!P[k]) console.error(`story.js: ${y} ${w}: no place '${k}' in PLACES`);
      if (!P[c.at]) console.error(`story.js: ${y} ${w}: no place '${c.at}' in PLACES`);
      if (c.route?.length && c.route[c.route.length - 1] !== c.at) console.error(`story.js: ${y} ${w}: route ends at ${c.route.at(-1)}, card says ${c.at}`);
      where[y][w] = c.at;
    }
  }
  for (const w of WHO) if (!P[START[w]]) console.error(`story.js: START.${w}: no place '${START[w]}'`);

  /* ---------- the map ---------- */
  el('rect', { class: 'sea', x: -2000, y: -2000, width: B.w + 4000, height: B.h + 4000 }, svg);
  const states = el('g', {}, svg);
  const paths = B.states.map(([name, a, b, d]) => { const p = el('path', { class: 'state', d }, states); p.dataset.a = a; p.dataset.b = b; el('title', {}, p).textContent = name; return p; });
  // paper grain, baked once into a small tile and multiplied over the land
  const tile = document.createElement('canvas'); tile.width = tile.height = 160;
  const tc = tile.getContext('2d'), img = tc.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) { const v = 200 + Math.random() * 55; img.data[i] = v; img.data[i + 1] = v * .98; img.data[i + 2] = v * .94; img.data[i + 3] = 255; }
  tc.putImageData(img, 0, 0);
  const defs = el('defs', {}, svg);
  const pat = el('pattern', { id: 'grain', width: 160, height: 160, patternUnits: 'userSpaceOnUse' }, defs);
  el('image', { href: tile.toDataURL(), width: 160, height: 160 }, pat);
  el('rect', { class: 'grain', x: -400, y: -300, width: B.w + 800, height: B.h + 600, fill: 'url(#grain)' }, svg);
  const labels = el('g', {}, svg);
  const countries = COUNTRIES.map(([name, lon, lat, a = FIRST, b = LAST]) => {
    const [x, y] = xy(lon, lat), t = el('text', { class: 'country', x, y }, labels);
    t.textContent = name; t.dataset.a = a; t.dataset.b = b; t.dataset.x = x; t.dataset.y = y; return t;
  });
  for (const [name, lon, lat] of SEAS) { const [x, y] = xy(lon, lat); el('text', { class: 'seaname', x, y }, labels).textContent = name; }
  const trails = el('g', { id: 'trails' }, svg);
  for (const w of WHO) {   // the arrowhead at a trail's end, in its walker's colour
    const m = el('marker', { id: `arrow-${w}`, viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 3, markerHeight: 3, orient: 'auto' }, defs);
    el('path', { d: 'M0,1L10,5L0,9z', fill: PEOPLE[w].color }, m);
  }
  const placesG = el('g', {}, svg);
  for (const p of Object.values(P)) {
    const g = el('g', { class: 'place off' }, placesG), [x, y] = p.p;
    el('circle', { cx: x, cy: y, r: 3.2 }, g);
    const t = el('text', { x: x + (p.side === 'l' ? -7 : 7), y: y + (p.side === 'b' ? 16 : p.side === 't' ? -8 : 4), 'text-anchor': p.side === 'l' ? 'end' : p.side === 'r' ? 'start' : 'middle' }, g);
    t.textContent = p.name; p.g = g;
  }
  const pinsG = el('g', { id: 'pins' }, svg);
  const figsG = el('g', { id: 'figs' }, svg);

  /* ---------- the figures ---------- */
  const F = {};
  for (const w of WHO) {
    const who = PEOPLE[w];
    const g = el('g', { class: 'fig idle', tabindex: 0, role: 'button' }, figsG);
    const bob = el('g', { class: 'bob' }, g);
    el('ellipse', { class: 'shadow', cx: 0, cy: 0, rx: 15, ry: 4.5 }, bob);
    const sway = el('g', { class: 'sway' }, bob);
    const flip = el('g', {}, sway);
    const image = el('image', { href: who.img, preserveAspectRatio: 'xMidYMax meet' }, flip);
    const ring = el('rect', { class: 'ring', rx: 6 }, g);
    const tag = el('g', { class: 'tag' }, g);
    const tr = el('rect', { rx: 4 }, tag), tt = el('text', {}, tag);
    tt.textContent = who.short;
    g.addEventListener('click', e => { e.stopPropagation(); openPerson(w); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPerson(w); } });
    F[w] = { g, bob, flip, image, ring, tag, tr, tt, pos: P[START[w]].p.slice(), off: [0, 0] };
    const b = document.createElement('button');
    b.textContent = who.short; b.style.setProperty('--c', who.color);
    b.addEventListener('click', () => openPerson(w));
    $('#people').appendChild(b);
  }

  /* sizes in map units grow on a small screen so a figure stays about 60 px tall */
  let K = 1, FH = 80;
  function sizeFigures() {
    for (const w of WHO) {
      const f = F[w], h = FH, wd = h * (PEOPLE[w].aspect || .5);
      f.image.setAttribute('x', -wd / 2); f.image.setAttribute('y', -h); f.image.setAttribute('width', wd); f.image.setAttribute('height', h);
      f.ring.setAttribute('x', -wd / 2 - 4); f.ring.setAttribute('y', -h - 22 * K); f.ring.setAttribute('width', wd + 8); f.ring.setAttribute('height', h + 26 * K);
      f.tt.setAttribute('x', 0); f.tt.setAttribute('y', -h - 11 * K);
      const tw = f.tt.getComputedTextLength() + 10 * K;
      f.tr.setAttribute('x', -tw / 2); f.tr.setAttribute('y', -h - 18 * K); f.tr.setAttribute('width', tw); f.tr.setAttribute('height', 14 * K); f.tw = tw;
    }
  }

  /* the view: the places of the decade in frame, at the screen's shape */
  const MX = 340, MY = 220;
  let home = null, shot = null;   // the whole view, and the film's close-up while it lasts
  const ALL = (() => { const xs = Object.values(P).map(p => p.p[0]), ys = Object.values(P).map(p => p.p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; })();
  function fit() {
    const W = svg.clientWidth, H = svg.clientHeight, a = W / H;
    let [x0, y0, x1, y1] = [ALL[0] - 90, ALL[1] - 150, ALL[2] + 90, ALL[3] + 70];
    let w = x1 - x0, h = y1 - y0;
    if (w / h < a) { const nw = h * a; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / a; y0 -= (nh - h) / 2; h = nh; }
    // wider than the data (borders.py cuts the outlines MX, MY beyond its frame): crop instead of showing where they stop
    if (w > B.w + 2 * MX) { const nh = (B.w + 2 * MX) / a; y0 += (h - nh) / 2; h = nh; x0 = -MX; w = B.w + 2 * MX; }
    if (h > B.h + 2 * MY) { const nw = (B.h + 2 * MY) * a; x0 += (w - nw) / 2; w = nw; y0 = -MY; h = B.h + 2 * MY; }
    // keep the view on the data's frame where it can be
    x0 = Math.min(Math.max(x0, -MX), B.w + MX - w); y0 = Math.min(Math.max(y0, -MY), B.h + MY - h);
    home = [x0, y0, w, h];
    svg.setAttribute('viewBox', (shot || home).join(' '));
    const s = W / w;   // screen px per map unit
    K = Math.max(1, .85 / s); FH = Math.max(96, (H < 520 ? 58 : 84) / s);
    svg.style.setProperty('--k', K); svg.style.setProperty('--kc', Math.max(1, .6 / s));
    sizeFigures(); if (!walk) spread(standing); for (const w2 of WHO) place(w2);
    layout();
  }

  /* ---------- the year ---------- */
  let year = FIRST, shown = null;   // shown: the year the borders and labels show
  function showYear(y) {
    shown = y;
    for (const p of paths) p.classList.toggle('off', !(p.dataset.a <= y && y <= p.dataset.b));
    for (const t of countries) t.classList.toggle('off', !(t.dataset.a <= y && y <= t.dataset.b));
    $('#year').textContent = y;
    $('#prev').disabled = y <= FIRST; $('#next').disabled = y >= LAST;
    // the places of this year's routes, and where everyone stands
    const on = new Set();
    for (const w of WHO) { on.add(where[y - 1][w]); for (const k of YEARS[y][w].route || []) on.add(k); on.add(where[y][w]); }
    for (const p of Object.values(P)) p.g.classList.toggle('off', !on.has(p.key));
    onPlaces = on; layout();
  }

  /* ---------- walking ---------- */
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  function routeOf(y, w) {   // the points walked in year y, from where w stood at the end of y - 1
    const keys = [where[y - 1][w], ...(YEARS[y][w].route || [])].filter((k, i, a) => i === 0 || k !== a[i - 1]);
    return keys.map(k => P[k].p);
  }
  function at(pts, d) {   // the point d along a polyline, and the direction there
    for (let i = 1; i < pts.length; i++) {
      const L = len(pts[i - 1], pts[i]);
      if (d <= L || i === pts.length - 1) { const q = L ? Math.min(1, d / L) : 1; return [[pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q], pts[i][0] - pts[i - 1][0]]; }
      d -= L;
    }
    return [pts[0].slice(), 0];
  }
  const total = pts => pts.slice(1).reduce((s, p, i) => s + len(pts[i], p), 0);
  const partial = (pts, d) => { const o = [pts[0]]; for (let i = 1; i < pts.length; i++) { const L = len(pts[i - 1], pts[i]); if (d >= L) { o.push(pts[i]); d -= L; } else { o.push(at([pts[i - 1], pts[i]], d)[0]); break; } } return o; };
  const dpath = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');

  /* stand two figures in one town side by side */
  function spread(y) {   // figures standing closer than a figure's width apart share one group, side by side
    const groups = [];
    for (const w of WHO) {
      const p = P[where[y][w]].p, g = groups.find(g => g.some(v => len(P[where[y][v]].p, p) < FH * .7));
      if (g) g.push(w); else groups.push([w]);
    }
    for (const ws of groups) {
      const cx = ws.reduce((s, w) => s + P[where[y][w]].p[0], 0) / ws.length;
      ws.sort((a, b) => P[where[y][a]].p[0] - P[where[y][b]].p[0]);
      ws.forEach((w, i) => { F[w].off = [cx + (i - (ws.length - 1) / 2) * FH * .8 - P[where[y][w]].p[0], 0]; });
    }
  }
  function place(w, bobY = 0, tilt = 0) {
    const f = F[w], [x, y] = f.pos;
    f.g.setAttribute('transform', `translate(${(x + f.off[0]).toFixed(1)},${(y + f.off[1]).toFixed(1)})`);
    f.bob.setAttribute('transform', `translate(0,${bobY.toFixed(2)}) rotate(${tilt.toFixed(2)})`);
    f.g.setAttribute('aria-label', `${PEOPLE[w].name}, ${shown}, ${P[where[shown ?? FIRST][w]]?.name || ''}: open his card`);
  }
  function face(w, dx) { if (Math.abs(dx) > .5) F[w].flip.setAttribute('transform', dx < 0 ? 'scale(-1,1)' : ''); }

  /* ---------- labels: city names and name tags stay clear of the figures and of each other; countries yield ---------- */
  let onPlaces = new Set();   // the places shown this year
  const hit = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const hits = (b, list) => list.reduce((s, o) => s + hit(b, o), 0);
  function layout() {
    if (walk) return;
    const solid = [], tags = [], v = svg.viewBox.baseVal;
    const out = b => b[0] < v.x || b[1] < v.y || b[2] > v.x + v.width || b[3] > v.y + v.height;   // off the screen
    for (const w of WHO) {   // the figures, as they stand
      const f = F[w], x = f.pos[0] + f.off[0], y = f.pos[1] + f.off[1], hw = FH * (PEOPLE[w].aspect || .5) / 2 + 2;
      f.box = [x - hw, y - FH - 2, x + hw, y + 3]; solid.push(f.box);
    }
    for (const w of WHO) {   // name tags: above the head, beside it, higher, over the hat, or under the feet: where no other figure or tag is
      const f = F[w], x = f.pos[0] + f.off[0], y = f.pos[1] + f.off[1], top0 = -FH - 18 * K;
      const others = solid.filter(b => b !== f.box).concat(tags);
      const sh = f.tw * .6, tops = [[0, top0], [-sh, top0], [sh, top0], [0, top0 - 16 * K], [-sh, top0 - 16 * K], [sh, top0 - 16 * K], [0, top0 - 32 * K], [0, top0 + 12 * K], [-sh, top0 + 12 * K], [sh, top0 + 12 * K], [0, 6 * K]];
      const [dx, top] = tops.find(([d, t]) => { const b = [x + d - f.tw / 2, y + t, x + d + f.tw / 2, y + t + 14 * K]; return !out(b) && !hits(b, others); }) ?? [0, top0];
      f.tag.setAttribute('transform', `translate(${dx},${top - top0})`);
      tags.push([x + dx - f.tw / 2 - 1, y + top - 1, x + dx + f.tw / 2 + 1, y + top + 14 * K + 1]);
    }
    const stand = new Set(WHO.map(w => where[standing][w]));
    const S = { r: [7, 5, 'start'], l: [-7, 5, 'end'], b: [0, 18, 'middle'], t: [0, -9, 'middle'], br: [7, 18, 'start'], bl: [-7, 18, 'end'],
      tr: [7, -9, 'start'], tl: [-7, -9, 'end'], b2: [0, 32, 'middle'], b3: [0, 46, 'middle'], r2: [24, 18, 'start'], l2: [-24, 18, 'end'] };
    // a city where someone stands first (its name goes under his feet), then the places only passed through
    function placeCities(keys) {
      const dots = {}, placed = [], squeezed = [];
      for (const k of onPlaces) { const [x, y] = P[k].p; dots[k] = [x - 4, y - 4, x + 4, y + 4]; }
      for (const k of keys) {
        const p = P[k], t = p.g.querySelector('text'), [x, y] = p.p;
        const order = stand.has(k) ? ['b', 'br', 'bl', 'b2', 'r2', 'l2', 'b3', p.side, 'r', 'l', 't', 'tr', 'tl']
          : [p.side, 'r', 'l', 'b', 't', 'br', 'bl', 'tr', 'tl', 'b2', 'r2', 'l2', 'b3'];
        const obstacles = solid.concat(tags, placed, Object.entries(dots).filter(([k2]) => k2 !== k).map(([, b]) => b));
        const cands = order.map(side => { const [dx, dy, anchor] = S[side] || S.r; return [x + dx * K, y + dy * K, anchor]; });
        if (stand.has(k)) {   // beside the body of whoever stands here, at the feet and at the waist
          const bs = WHO.filter(w => where[standing][w] === k).map(w => F[w].box);
          const u = [Math.min(...bs.map(b => b[0])), Math.min(...bs.map(b => b[1])), Math.max(...bs.map(b => b[2])), Math.max(...bs.map(b => b[3]))];
          cands.splice(3, 0, [u[2] + 4, y + 5 * K, 'start'], [u[0] - 4, y + 5 * K, 'end'], [u[2] + 4, (u[1] + u[3]) / 2, 'start'], [u[0] - 4, (u[1] + u[3]) / 2, 'end']);
        }
        let best = null;
        for (const [ax, by, anchor] of cands) {
          t.setAttribute('x', ax); t.setAttribute('y', by); t.setAttribute('text-anchor', anchor);
          const r = t.getBBox(), box = [r.x - 2, r.y, r.x + r.width + 2, r.y + r.height], cost = hits(box, obstacles) + (out(box) ? 1e4 : 0);
          if (!best || cost < best.cost) best = { cost, ax, by, anchor, box };
          if (!cost) break;
        }
        // a place only passed through gives up its name when there is no room for it; a place where someone stands never does
        const drop = best.cost > 0 && !stand.has(k);
        if (best.cost > 0 && stand.has(k)) squeezed.push(k);
        t.classList.toggle('drop', drop);
        t.setAttribute('x', best.ax); t.setAttribute('y', best.by); t.setAttribute('text-anchor', best.anchor);
        if (!drop) placed.push(best.box);
        else delete dots[k];
      }
      return { placed, squeezed };
    }
    // two names where people stand may want one spot: try again with the squeezed one placed first
    let keys = [...onPlaces].sort((a, b) => stand.has(b) - stand.has(a)), res = placeCities(keys), bestKeys = keys;
    for (let i = 0; i < 3 && res.squeezed.length; i++) {
      keys = [...res.squeezed, ...keys.filter(k => !res.squeezed.includes(k))];
      const next = placeCities(keys);
      if (next.squeezed.length < res.squeezed.length) { res = next; bestKeys = keys; }
    }
    if (bestKeys !== keys) res = placeCities(bestKeys);   // the labels on the page are the last try's: put the best back
    if (res.squeezed.length) console.info(`labels ${shown}: no clear room for ${res.squeezed.map(k => P[k].name).join(', ')}`);
    const placed = res.placed;
    // country names move a little, or fade, where a city name, a tag or a figure needs the room
    const busy = solid.concat(tags, placed);
    for (const t of countries) {
      t.setAttribute('x', t.dataset.x); t.setAttribute('y', t.dataset.y);
      if (t.classList.contains('off')) { t.classList.remove('yield'); continue; }
      const b0 = t.getBBox(), cfs = b0.height, ok = [];
      for (const [dx, dy] of [[0, 0], [0, -1.2 * cfs], [0, 1.2 * cfs], [-.35 * b0.width, 0], [.35 * b0.width, 0], [0, -2.4 * cfs], [0, 2.4 * cfs]]) {
        const box = [b0.x + dx, b0.y + dy, b0.x + b0.width + dx, b0.y + b0.height + dy];
        if (!hits(box, busy)) { ok.push([dx, dy]); busy.push(box); break; }
      }
      t.classList.toggle('yield', !ok.length);
      if (ok.length) { t.setAttribute('x', +t.dataset.x + ok[0][0]); t.setAttribute('y', +t.dataset.y + ok[0][1]); }
    }
  }

  let walk = null;   // { start, items: [{w, pts, L, dur, trail, off0, off1}], fwd, y, to }; the film's walks set one with no items
  let standing = FIRST - 1;   // the year whose end the figures stand at
  function drawTrails(y, old) {
    trails.replaceChildren();
    for (const w of WHO) {
      const pts = routeOf(y, w);
      if (pts.length < 2) continue;
      const g = el('g', { class: 'route' + (old ? ' old' : '') }, trails), d = old ? dpath(pts) : 'M0,0';
      el('path', { class: 'case', d }, g);   // a paper edge under the dashes, so the line reads over borders and names
      el('path', { class: 'trail', d, stroke: PEOPLE[w].color, 'marker-end': `url(#arrow-${w})` }, g);
      g.dataset.w = w;
    }
  }
  const setTrail = (g, pts) => { if (g) for (const p of g.children) p.setAttribute('d', dpath(pts)); };
  function fullTrails(y) { drawTrails(y, false); for (const g of trails.children) setTrail(g, routeOf(y, g.dataset.w)); }
  function startWalk(from, to) {   // walk from the end of year `from` to the end of `to` (one step either way)
    finishWalk();
    for (const w of WHO) F[w].tag.removeAttribute('transform');
    const fwd = to > from, y = fwd ? to : from;
    drawTrails(y, false);
    const offs0 = Object.fromEntries(WHO.map(w => [w, F[w].off.slice()]));
    spread(to);
    const items = WHO.map(w => {
      let pts = routeOf(y, w); if (!fwd) pts = pts.slice().reverse();
      const L = total(pts), dur = L < 1 ? 0 : Math.min(2.4, Math.max(.9, L / 420)) * 1000;
      return { w, pts, out: routeOf(y, w), L, dur, trail: trails.querySelector(`[data-w="${w}"]`), off0: offs0[w], off1: F[w].off.slice() };
    });
    for (const it of items) F[it.w].g.classList.remove('idle');
    walk = { start: performance.now(), items, fwd, y, to };
    if (reduced) finishWalk(); else requestAnimationFrame(step);
  }
  function step(now) {
    if (!walk) return;
    let busy = false;
    for (const it of walk.items) {
      const f = F[it.w], q = it.dur ? Math.min(1, (now - walk.start) / it.dur) : 1;
      const e = q < .5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2, d = it.L * e;
      const [p, dx] = at(it.pts, d);
      f.pos = p; f.off = it.off0.map((o, i) => o + (it.off1[i] - o) * e);
      face(it.w, dx);
      const ph = d / (FH * .22), moving = q > 0 && q < 1;
      place(it.w, moving ? -Math.abs(Math.sin(ph)) * FH * .035 : 0, moving ? Math.sin(ph) * 1.5 : 0);
      setTrail(it.trail, walk.fwd ? partial(it.pts, d) : partial(it.out, it.L - d));
      if (q < 1) busy = true;
    }
    if (busy) requestAnimationFrame(step); else finishWalk();
  }
  function finishWalk() {
    if (!walk) return;
    const w0 = walk; walk = null; standing = w0.to;
    for (const it of w0.items) {
      const f = F[it.w]; f.pos = it.pts[it.pts.length - 1].slice(); f.off = it.off1.slice(); place(it.w); f.g.classList.add('idle');
      setTrail(it.trail, it.pts);
    }
    if (!w0.fwd) fullTrails(w0.y - 1);
    layout();
  }

  /* ---------- cards ---------- */
  let opener = null;
  const voice = $('#voice'), evCard = $('#event');
  function play(card, id) {
    const a = card.querySelector('audio'), b = card.querySelector('.play');
    a.pause();
    if (!VOICED.has(id)) { b.hidden = true; a.removeAttribute('src'); return; }
    b.hidden = false; a.src = `audio/en/${id}.mp3`;
    b.onclick = () => { if (a.paused) { a.currentTime = 0; a.play().catch(() => {}); } else a.pause(); };
    a.onplay = () => { b.textContent = '❚❚ Pause'; }; a.onpause = a.onended = () => { b.textContent = '▶ Listen'; };
    a.play().catch(() => {});
  }
  const dialogs = () => document.querySelectorAll('#person, #credits');
  function closeCards() {
    for (const c of dialogs()) { if (!c.hidden) { c.querySelector('audio')?.pause(); c.hidden = true; } }
    if (opener) { opener.focus?.(); opener = null; }
  }
  function openCard(card, from) {
    for (const c of dialogs()) if (c !== card && !c.hidden) { c.querySelector('audio')?.pause(); c.hidden = true; }
    opener = from || document.activeElement; card.hidden = false; card.tabIndex = -1; card.focus();
  }
  function openPerson(w) {
    if (film) return;
    const c = YEARS[shown][w], card = $('#person'), who = PEOPLE[w];
    const m = MEETINGS[shown]?.who.includes(w) && MEETINGS[shown];   // the year two of them meet: one card for both
    const [one, two] = card.querySelectorAll('.head img');
    card.style.setProperty('--c', m ? 'var(--ink)' : who.color);
    one.src = m ? PEOPLE[m.who[0]].img : who.img;
    two.hidden = !m; if (m) two.src = PEOPLE[m.who[1]].img;
    card.querySelector('h2').textContent = m ? m.title : who.name;
    card.querySelector('.where').textContent = `${shown} · ${m ? m.place : c.place || P[c.at].name}`;
    card.querySelector('.text').textContent = m ? m.text : c.text;
    const fig = card.querySelector('figure'), id = m ? m.pic : `${shown}-${w}`;   // a period picture of what the card tells, where one was found
    fig.hidden = !CARD_PICS.has(id);
    if (!fig.hidden) fig.querySelector('img').src = `img/cards/${id}.webp`;
    openCard(card, F[w].g);
    play(card, m ? `${shown}-${m.who.join('')}` : `${shown}-${w}`);
  }
  for (const c of document.querySelectorAll('.card')) {
    c.querySelector('.close')?.addEventListener('click', () => closeCards());
    c.addEventListener('click', e => e.stopPropagation());
  }
  $('#credits-open').addEventListener('click', e => { e.stopPropagation(); openCard($('#credits'), e.currentTarget); });

  /* ---------- music: dance records of the 1920s (audio/bgm), lower under every spoken line ---------- */
  const TRACKS = ['1-april-showers', '2-limehouse-blues', '3-japanese-sandman'].map(n => `audio/bgm/${n}.mp3`);
  const BGM = +(new URLSearchParams(location.search).get('bgm') ?? .45), DUCK = .3;   // ?bgm= to set it by ear
  const bgm = $('#bgm'), speakers = [voice, ...document.querySelectorAll('.card audio')];
  let track = 0, musicOn = true, actx = null, gain = null;
  bgm.src = TRACKS[0];
  bgm.addEventListener('ended', () => { track = (track + 1) % TRACKS.length; bgm.src = TRACKS[track]; bgm.play().catch(() => {}); });
  function level() {   // Web Audio where it can (an iPhone ignores an audio element's volume)
    const v = BGM * (speakers.some(a => !a.paused && !a.ended) ? DUCK : 1);
    if (gain) gain.gain.setTargetAtTime(v, actx.currentTime, .25); else bgm.volume = Math.min(1, v);
  }
  for (const a of speakers) for (const ev of ['play', 'pause', 'ended']) a.addEventListener(ev, level);
  function startMusic() {   // on the first click: browsers start sound only after one
    if (!actx) {
      try { actx = new AudioContext(); gain = actx.createGain(); actx.createMediaElementSource(bgm).connect(gain).connect(actx.destination); }
      catch (err) { console.warn('music: no Web Audio, the volume steps instead', err); actx = gain = null; }
      level();
    }
    actx?.resume();
    if (musicOn && bgm.paused) bgm.play().catch(() => {});
  }
  $('#music').addEventListener('click', e => {
    e.stopPropagation(); musicOn = !musicOn; e.currentTarget.setAttribute('aria-pressed', musicOn);
    if (musicOn) startMusic(); else bgm.pause();
  });

  /* ---------- the film: a new year plays its events on the map, then the four walk on ---------- */
  const Z = 1.8;   // how far the camera closes in on an event
  let film = null;   // the year playing: { y, from, skip }
  const waits = new Set();   // what the film is waiting on; wake() ends them all at once (a click, Skip)
  const wake = () => { for (const f of [...waits]) f(); };
  function hold(ms) {
    return new Promise(r => {
      if (film?.skip) return r();
      const done = () => { clearTimeout(t); waits.delete(done); r(); }, t = setTimeout(done, ms);
      waits.add(done);
    });
  }
  function say(id) {   // a clip to its end; one that will not play holds for a reading time instead
    return new Promise(r => {
      if (film?.skip) return r();
      let t = 0;
      const done = () => { clearTimeout(t); waits.delete(done); voice.onended = voice.onerror = null; r(); };
      const late = () => { console.warn(`film: clip ${id} did not play`); t = setTimeout(done, 3500); };
      waits.add(done);
      voice.onended = done; voice.onerror = late;
      voice.src = `audio/en/${id}.mp3`;
      voice.play().catch(err => { if (err.name !== 'AbortError') late(); });
    });
  }
  let camRun = 0;
  function cam(to, ms) {   // move the view to `to` ([x, y, w, h]); a wake() jumps to the end
    const v = svg.viewBox.baseVal, f = [v.x, v.y, v.width, v.height], id = ++camRun;
    shot = to === home ? null : to;
    if (reduced || film?.skip || !ms) { svg.setAttribute('viewBox', to.join(' ')); return Promise.resolve(); }
    return new Promise(r => {
      const t0 = performance.now();
      const done = () => { waits.delete(done); if (id === camRun) svg.setAttribute('viewBox', to.join(' ')); r(); };
      waits.add(done);
      (function tick(now) {
        if (!waits.has(done)) return;
        const q = Math.min(1, (now - t0) / ms), e = q < .5 ? 4 * q * q * q : 1 - (-2 * q + 2) ** 3 / 2;
        svg.setAttribute('viewBox', f.map((a, i) => a + (to[i] - a) * e).join(' '));
        if (q < 1) requestAnimationFrame(tick); else done();
      })(t0);
    });
  }
  const narrow = () => svg.clientWidth <= 700 && svg.clientHeight > 520;   // the card goes under the map
  const inData = ([x, y]) => x > -MX + 30 && x < B.w + MX - 30 && y > -MY + 30 && y < B.h + MY - 30;
  function shotOn(pts, side) {   // a close view of the points, clear of the card on `side`
    const a = svg.clientWidth / svg.clientHeight, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    let w = Math.max(home[2] / Z, bw * (side === 'bottom' ? 1.4 : 2.4), bh * 2 * a);
    w = Math.min(w, home[2]); const h = w / a;
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const fx = side === 'left' ? .7 : side === 'right' ? .3 : .5, fy = side === 'bottom' ? .3 : .52;
    const x0 = Math.min(Math.max(cx - fx * w, -MX), B.w + MX - w), y0 = Math.min(Math.max(cy - fy * h, -MY), B.h + MY - h);
    return [x0, y0, w, h];
  }
  function pin([name, lon, lat], k) {   // k: map units per screen pixel in the shot
    const [x, y] = xy(lon, lat), g = el('g', { class: 'pin', transform: `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${k.toFixed(3)})` }, pinsG);
    const d = el('g', { class: 'drop' }, g);
    el('circle', { class: 'pulse', r: 8 }, d); el('circle', { class: 'dot', r: 6.5 }, d);
    el('text', { y: -16 }, d).textContent = name;
    return g;
  }
  const glow = (name, y, on) => { for (const p of paths) if (p.querySelector('title').textContent === name && p.dataset.a <= y && y <= p.dataset.b) p.classList.toggle('glow', on); };
  function showEvent(y, i, ev, side) {
    const fig = evCard.querySelector('figure'), img = fig.querySelector('img');
    evCard.className = `card ${side}`;
    evCard.querySelector('h2').textContent = ev.title;
    fig.hidden = ev.pic === false; img.onerror = () => { console.error(`events: no img/events/${y}-${i + 1}.webp`); fig.hidden = true; };
    if (!fig.hidden) img.src = `img/events/${y}-${i + 1}.webp`;
    fig.querySelector('figcaption').textContent = `${ev.also ? ev.at[0] + ' · ' + ev.also[0] : ev.at[0]}, ${y}`;
    evCard.querySelector('.text').textContent = ev.text;
    evCard.hidden = false;
    if (EVENTS[y][i + 1] && EVENTS[y][i + 1].pic !== false) new Image().src = `img/events/${y}-${i + 2}.webp`;
  }
  async function playYear(y, from) {
    const run = film = { y, from, skip: false };
    document.body.classList.add('film');
    $('#filmbar').hidden = false; $('#replay').hidden = true;
    pinsG.replaceChildren(); trails.replaceChildren();
    $('#year').classList.remove('pop'); void $('#year').offsetWidth; $('#year').classList.add('pop');
    await hold(900);   // the four fade out, the borders change
    if (film !== run) return;
    await say(`${y}-e0`);   // "Europe in 1923."
    const evs = EVENTS[y] || [];
    if (!evs.length) console.error(`events.js: no EVENTS[${y}]`);
    for (let i = 0; i < evs.length && film === run && !run.skip; i++) {
      const ev = evs[i], spots = [ev.at, ev.also].filter(Boolean), pts = spots.map(a => xy(a[1], a[2])), on = pts.every(inData);
      if (!on) console.info(`film ${y}: ${ev.at[0]} is off the map, the card plays alone`);
      // a close-up beside the card; places far apart (Dublin and Moscow) or off the map: the whole map, the card mid
      let side = narrow() ? 'bottom' : (pts[0][0] - home[0]) / home[2] > .5 ? 'left' : 'right', view = on && shotOn(pts, side);
      if (!view || view[2] >= home[2]) { view = home; if (side !== 'bottom') side = 'mid'; }
      await cam(view, 1300);
      if (film !== run || run.skip) break;
      const k = (shot || home)[2] / svg.clientWidth, pins = on ? spots.map(a => pin(a, k)) : [];
      if (ev.glow) glow(ev.glow, y, true);
      showEvent(y, i, ev, side);
      await hold(300);
      await say(`${y}-e${i + 1}`);
      await hold(1000);
      evCard.hidden = true;
      if (ev.glow) glow(ev.glow, y, false);
      for (const p of pins) p.classList.add('past');
    }
    if (film !== run) return;
    await moves(run);
    if (film === run) endFilm();
  }

  /* the four come back; each who travels this year walks it in a close-up the camera follows, one after another */
  const ZF = 2.4, REST = 250, MEET = 2200;   // the follow shot's zoom; the rest at a stop on the way
  const legTime = l => Math.min(2200, Math.max(700, l / .16));   // ms for a stretch of l map units
  function follow(p, v) {   // the view centred on p (a figure's middle), at the follow shot's width; v: the view to ease from
    const a = svg.clientWidth / svg.clientHeight, w = Math.min(home[2], home[2] / ZF * Math.max(1, a < 1 ? 1.6 : 1)), h = w / a;
    const t = [Math.min(Math.max(p[0] - w / 2, -MX), B.w + MX - w), Math.min(Math.max(p[1] - h * .55, -MY), B.h + MY - h), w, h];
    return v ? v.map((x, i) => x + (t[i] - x) * .1) : t;
  }
  function walkOne(w, y, off0, off1) {
    const f = F[w], pts = routeOf(y, w), legs = pts.slice(1).map((q, i) => len(pts[i], q));
    const keys = [where[y - 1][w], ...(YEARS[y][w].route || [])].filter((k, i, a) => i === 0 || k !== a[i - 1]);
    // a meeting on the way: the walk rests longer at the stop where the other stands, the caption says so
    const m = MEETINGS[y]?.who.includes(w) && MEETINGS[y], other = m && m.who.find(v => v !== w);
    const meet = m ? keys.findIndex((k, i) => i > 0 && k === m.at && len(P[k].p, F[other].pos) < 1) : -1;
    const rests = keys.map((k, i) => i === meet ? MEET : REST);   // rests[i]: the rest at stop i
    const durs = legs.map(legTime), L = total(pts);
    const T = durs.reduce((a, b) => a + b, 0) + rests.slice(1, -1).reduce((a, b) => a + b, 0) + (meet === keys.length - 1 ? MEET : 0);
    const g = trails.querySelector(`[data-w="${w}"]`);
    const mid = () => [f.pos[0] + f.off[0], f.pos[1] + f.off[1] - FH * .5];
    const cap = $('#move'), route = keys.map(k => P[k].name).join(' → ');
    cap.style.setProperty('--c', PEOPLE[w].color);
    cap.querySelector('b').textContent = PEOPLE[w].short;
    cap.querySelector('span').textContent = route;
    cap.hidden = false;
    f.g.classList.remove('idle');
    return new Promise(r => {
      let t0 = 0, view = null;
      const end = () => {
        waits.delete(end); cap.hidden = true;
        f.pos = pts.at(-1).slice(); f.off = off1.slice(); place(w); f.g.classList.add('idle'); setTrail(g, pts); r();
      };
      waits.add(end);
      cam(follow(mid()), 700).then(() => {
        if (!waits.has(end)) return;
        if (reduced) return end();
        t0 = performance.now(); requestAnimationFrame(tick);
      });
      function tick(now) {
        if (!waits.has(end)) return;
        // where along the route at time t: each stretch eases in and out, with a rest at each stop between
        let t = now - t0, d = 0, i = 0;
        for (; i < legs.length; i++) {
          if (t < durs[i]) { const q = t / durs[i]; d += legs[i] * (q < .5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2); break; }
          t -= durs[i] + (i + 1 < legs.length || meet === legs.length ? rests[i + 1] : 0); d += legs[i];
          if (t < 0) break;   // resting at the stop
        }
        const meeting = meet > 0 && i === meet - 1 && t < 0;   // resting at the stop where the two meet
        cap.querySelector('b').textContent = meeting ? '' : PEOPLE[w].short;
        cap.querySelector('span').textContent = meeting ? m.line : route;
        cap.classList.toggle('meet', meeting);
        if (m) F[other].g.classList.toggle('aside', !meeting);   // the one he meets steps forward too
        const e = Math.min(1, (now - t0) / T), [p, dx] = at(pts, Math.min(d, L));
        f.pos = p; f.off = off0.map((o, k) => o + (off1[k] - o) * e);
        if (meet > 0 && meet < keys.length - 1) f.off[0] += FH * .75 * Math.max(0, 1 - len(p, P[m.at].p) / FH);   // beside the other, not on him (at the end of a walk spread() does it)
        face(w, dx);
        const ph = d / (FH * .22), moving = i < legs.length && t >= 0;
        place(w, moving ? -Math.abs(Math.sin(ph)) * FH * .035 : 0, moving ? Math.sin(ph) * 1.5 : 0);
        setTrail(g, partial(pts, Math.min(d, L)));
        view = follow(mid(), view || (shot || home)); shot = view; svg.setAttribute('viewBox', view.join(' '));
        if (now - t0 < T + 250) requestAnimationFrame(tick); else end();
      }
    });
  }
  async function moves(run) {
    const y = run.y;
    evCard.hidden = true;
    for (const p of pinsG.children) p.classList.add('gone');
    document.body.classList.replace('film', 'moves');
    await cam(home, 1100);
    if (film !== run) return;
    for (const w of WHO) F[w].tag.removeAttribute('transform');
    drawTrails(y, false);
    const off0 = Object.fromEntries(WHO.map(w => [w, F[w].off.slice()]));
    spread(y);
    const off1 = Object.fromEntries(WHO.map(w => [w, F[w].off.slice()]));
    for (const w of WHO) F[w].off = off0[w];
    walk = { items: [], fwd: true, y, to: y };   // layout() waits while anyone walks
    const movers = WHO.filter(w => total(routeOf(y, w)) > 1);
    await hold(800);
    for (const w of movers) {
      if (film !== run || run.skip) break;
      for (const v of WHO) F[v].g.classList.toggle('aside', v !== w);   // the others step back while he walks
      await walkOne(w, y, off0[w], off1[w]);
      await hold(300);
    }
    for (const v of WHO) F[v].g.classList.remove('aside');
    if (film !== run) return;
    for (const w of WHO) { F[w].pos = P[where[y][w]].p.slice(); F[w].off = off1[w].slice(); place(w); F[w].g.classList.add('idle'); }
    for (const g of trails.children) setTrail(g, routeOf(y, g.dataset.w));
    finishWalk();
  }
  function stopFilm() {   // the film ends now; the caller decides what the four do
    if (!film) return null;
    const run = film; film = null; wake(); voice.pause(); camRun++;
    evCard.hidden = true; $('#filmbar').hidden = true;
    for (const p of document.querySelectorAll('.state.glow')) p.classList.remove('glow');
    for (const p of pinsG.children) p.classList.add('gone');
    setTimeout(() => { for (const p of [...pinsG.querySelectorAll('.gone')]) p.remove(); }, 700);
    document.body.classList.remove('film', 'moves'); $('#move').hidden = true;
    for (const v of WHO) F[v].g.classList.remove('aside');
    return run;
  }
  function endFilm() {   // the camera back on the whole map; the four can be clicked
    const run = stopFilm();
    cam(home, reduced || run.skip ? 0 : 1100).then(layout);
    $('#replay span').textContent = run.y; $('#replay').hidden = false;
  }
  function nextStep() { if (film) { voice.pause(); wake(); } }   // a click in the film: on to the next card, or the next walker
  function skip() { if (film) { film.skip = true; voice.pause(); wake(); } }
  evCard.addEventListener('click', nextStep);
  $('#skip').addEventListener('click', e => { e.stopPropagation(); skip(); });

  /* ---------- moving through the years ---------- */
  function standAt(y) {   // everyone where the end of year y left them, with no walking
    finishWalk(); standing = y; spread(y);
    for (const w of WHO) { F[w].pos = P[where[y][w]].p.slice(); place(w); }
  }
  function begin() {
    if ($('#intro').hidden) return false;
    $('#intro').hidden = true; startMusic(); return true;
  }
  function go(d) {
    const to = year + d;
    begin();
    if (to < FIRST || to > LAST) return;
    if (stopFilm()) { shot = null; svg.setAttribute('viewBox', home.join(' ')); }
    closeCards();
    const from = year; year = to;
    standAt(from);
    showYear(to);
    if (d > 0) playYear(to, from);
    else { fullTrails(from); startWalk(from, to); $('#replay span').textContent = to; $('#replay').hidden = false; }
  }
  function replay() {
    if (stopFilm()) { shot = null; svg.setAttribute('viewBox', home.join(' ')); }
    closeCards(); standAt(year - 1); showYear(year); playYear(year, year - 1);
  }
  $('#begin').addEventListener('click', e => { e.stopPropagation(); begin(); replay(); });
  $('#replay').addEventListener('click', e => { e.stopPropagation(); replay(); });
  $('#prev').addEventListener('click', e => { e.stopPropagation(); go(-1); });
  $('#next').addEventListener('click', e => { e.stopPropagation(); go(1); });
  svg.addEventListener('click', e => {
    if (film) { nextStep(); return; }
    if (document.querySelector('#person:not([hidden]), #credits:not([hidden])')) { closeCards(); return; }
    if (!$('#intro').hidden) return;
    const x = e.clientX / svg.clientWidth;
    if (x > .7) go(1); else if (x < .3) go(-1);
  });
  svg.addEventListener('mousemove', e => {
    const x = e.clientX / svg.clientWidth, still = !film && $('#intro').hidden && !document.querySelector('#person:not([hidden]), #credits:not([hidden])');
    svg.classList.toggle('to-next', still && x > .7 && year < LAST);
    svg.classList.toggle('to-prev', still && x < .3 && year > FIRST);
  });
  document.addEventListener('keydown', e => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === 'Escape') { if (film) skip(); else closeCards(); }
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (film && (e.key === ' ' || e.key === 'Enter') && !e.target.closest?.('button')) { e.preventDefault(); nextStep(); }
  });
  addEventListener('resize', fit);
  document.fonts?.ready.then(layout);   // text widths change when the fonts arrive

  /* ---------- start: 1919, from where the war left them, the film waiting for Begin ---------- */
  showYear(FIRST);
  fit();
  $('#begin').focus();
  window.MAGICIANS = { go, skip, replay, next: nextStep, get year() { return year; }, get film() { return film; }, F, P, where, finishWalk, get walking() { return !!walk; } };   // for the checks
})();
