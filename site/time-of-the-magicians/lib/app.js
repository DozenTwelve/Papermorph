/* The map you explore: the year top left, the four walking between years, a card for each.
   Data: lib/borders.js (BORDERS, made by books/time-of-the-magicians/borders.py), lib/story.js (PEOPLE, PLACES,
   START, COUNTRIES, SEAS, YEARS), audio/voiced.js (VOICED: the clips that exist, e.g. '1923-h', '1923-europe'). */
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
    t.textContent = name; t.dataset.a = a; t.dataset.b = b; return t;
  });
  for (const [name, lon, lat] of SEAS) { const [x, y] = xy(lon, lat); el('text', { class: 'seaname', x, y }, labels).textContent = name; }
  const trails = el('g', {}, svg);
  const placesG = el('g', {}, svg);
  for (const p of Object.values(P)) {
    const g = el('g', { class: 'place off' }, placesG), [x, y] = p.p;
    el('circle', { cx: x, cy: y, r: 3.2 }, g);
    const t = el('text', { x: x + (p.side === 'l' ? -7 : 7), y: y + (p.side === 'b' ? 16 : p.side === 't' ? -8 : 4), 'text-anchor': p.side === 'l' ? 'end' : p.side === 'r' ? 'start' : 'middle' }, g);
    t.textContent = p.name; p.g = g;
  }
  const figsG = el('g', {}, svg);

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
      f.tr.setAttribute('x', -tw / 2); f.tr.setAttribute('y', -h - 18 * K); f.tr.setAttribute('width', tw); f.tr.setAttribute('height', 14 * K);
    }
  }

  /* the view: the places of the decade in frame, at the screen's shape */
  const MX = 340, MY = 220;
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
    svg.setAttribute('viewBox', `${x0} ${y0} ${w} ${h}`);
    const s = W / w;   // screen px per map unit
    K = Math.max(1, .85 / s); FH = Math.max(96, (H < 520 ? 58 : 84) / s);
    svg.style.setProperty('--k', K); svg.style.setProperty('--kc', Math.max(1, .6 / s));
    sizeFigures(); if (!walk) spread(standing); for (const w2 of WHO) place(w2);
  }

  /* ---------- the year ---------- */
  let year = FIRST, shown = null;   // shown: the year the borders and labels show
  function showYear(y) {
    shown = y;
    for (const p of paths) p.classList.toggle('off', !(p.dataset.a <= y && y <= p.dataset.b));
    for (const t of countries) t.style.opacity = t.dataset.a <= y && y <= t.dataset.b ? 1 : 0;
    $('#year').textContent = y;
    $('#prev').disabled = y <= FIRST; $('#next').disabled = y >= LAST;
    // the places of this year's routes, and where everyone stands
    const on = new Set();
    for (const w of WHO) { on.add(where[y - 1][w]); for (const k of YEARS[y][w].route || []) on.add(k); on.add(where[y][w]); }
    for (const p of Object.values(P)) p.g.classList.toggle('off', !on.has(p.key));
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

  let walk = null;   // { start, items: [{w, pts, L, dur, trail, off0, off1}], fwd, y, to }
  let standing = FIRST - 1;   // the year whose end the figures stand at
  function drawTrails(y, old) {
    trails.replaceChildren();
    for (const w of WHO) {
      const pts = routeOf(y, w);
      if (pts.length < 2) continue;
      const t = el('path', { class: 'trail' + (old ? ' old' : ''), d: old ? dpath(pts) : 'M0,0', stroke: PEOPLE[w].color }, trails);
      t.dataset.w = w;
    }
  }
  function fullTrails(y) { drawTrails(y, false); for (const t of trails.querySelectorAll('.trail')) t.setAttribute('d', dpath(routeOf(y, t.dataset.w))); }
  function startWalk(from, to) {   // walk from the end of year `from` to the end of `to` (one step either way)
    finishWalk();
    const fwd = to > from, y = fwd ? to : from;
    drawTrails(y, false);
    const offs0 = Object.fromEntries(WHO.map(w => [w, F[w].off.slice()]));
    spread(to);
    const items = WHO.map(w => {
      let pts = routeOf(y, w); if (!fwd) pts = pts.slice().reverse();
      const L = total(pts), dur = L < 1 ? 0 : Math.min(6, Math.max(1.6, L / 170)) * 1000;
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
      if (it.trail) it.trail.setAttribute('d', dpath(walk.fwd ? partial(it.pts, d) : partial(it.out, it.L - d)));
      if (q < 1) busy = true;
    }
    if (busy) requestAnimationFrame(step); else finishWalk();
  }
  function finishWalk() {
    if (!walk) return;
    const w0 = walk; walk = null; standing = w0.to;
    for (const it of w0.items) {
      const f = F[it.w]; f.pos = it.pts[it.pts.length - 1].slice(); f.off = it.off1.slice(); place(it.w); f.g.classList.add('idle');
      if (it.trail) it.trail.setAttribute('d', dpath(it.pts));
    }
    if (!w0.fwd) fullTrails(w0.y - 1);
  }

  /* ---------- cards ---------- */
  let opener = null;
  function play(card, id) {
    const a = card.querySelector('audio'), b = card.querySelector('.play');
    a.pause();
    if (!VOICED.has(id)) { b.hidden = true; a.removeAttribute('src'); return; }
    b.hidden = false; a.src = `audio/en/${id}.mp3`;
    b.onclick = () => { if (a.paused) { a.currentTime = 0; a.play().catch(() => {}); } else a.pause(); };
    a.onplay = () => { b.textContent = '❚❚ Pause'; }; a.onpause = a.onended = () => { b.textContent = '▶ Listen'; };
    a.play().catch(() => {});
  }
  function closeCards(start = true) {
    for (const c of document.querySelectorAll('.card')) { if (!c.hidden) { c.querySelector('audio')?.pause(); c.hidden = true; } }
    if (pending && start) { const p = pending; pending = null; startWalk(p[0], p[1]); }
    if (opener) { opener.focus?.(); opener = null; }
  }
  function openCard(card, from) {
    for (const c of document.querySelectorAll('.card')) if (c !== card && !c.hidden) { c.querySelector('audio')?.pause(); c.hidden = true; }
    opener = from || document.activeElement; card.hidden = false; card.tabIndex = -1; card.focus();
  }
  function openPerson(w) {
    if (pending) { const p = pending; pending = null; startWalk(p[0], p[1]); }
    const c = YEARS[shown][w], card = $('#person'), who = PEOPLE[w];
    card.style.setProperty('--c', who.color);
    card.querySelector('img').src = who.img;
    card.querySelector('h2').textContent = who.name;
    card.querySelector('.where').textContent = `${shown} · ${c.place || P[c.at].name}`;
    card.querySelector('.text').textContent = c.text;
    openCard(card, F[w].g);
    play(card, `${shown}-${w}`);
  }
  function openEurope(y) {
    const card = $('#europe'), E = YEARS[y].europe;
    card.querySelector('h2 span').textContent = y;
    card.querySelector('ul').replaceChildren(...E.map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));
    card.querySelector('.go').textContent = pending && !(pending[1] > pending[0]) ? 'Walk them back →' : 'See where they go →';
    const step = document.activeElement?.classList.contains('step') && !document.activeElement.disabled ? document.activeElement : y < LAST ? $('#next') : $('#prev');
    openCard(card, step);   // focus comes back to the year buttons
    play(card, `${y}-europe`);
  }
  for (const c of document.querySelectorAll('.card')) {
    c.querySelector('.close').addEventListener('click', () => closeCards());
    c.addEventListener('click', e => e.stopPropagation());
  }
  $('#europe .go').addEventListener('click', () => closeCards());
  $('#credits-open').addEventListener('click', e => { e.stopPropagation(); openCard($('#credits'), e.currentTarget); });

  /* ---------- moving through the years ---------- */
  let pending = null;   // [from, to]: the walk that starts when the Europe card closes
  function go(d) {
    const to = year + d;
    if (to < FIRST || to > LAST) return;
    finishWalk(); closeCards(false); pending = null;
    const from = year; year = to;
    // stand everyone where `from` left them, then show the new year and its card
    standing = from; spread(from);
    for (const w of WHO) { F[w].pos = P[where[from][w]].p.slice(); place(w); }
    showYear(to);
    if (d < 0) fullTrails(from); else drawTrails(from, true);
    pending = [from, to];
    openEurope(to);
  }
  $('#prev').addEventListener('click', e => { e.stopPropagation(); go(-1); });
  $('#next').addEventListener('click', e => { e.stopPropagation(); go(1); });
  svg.addEventListener('click', e => {
    if (document.querySelector('.card:not([hidden])')) { closeCards(); return; }
    const x = e.clientX / svg.clientWidth;
    if (x > .7) go(1); else if (x < .3) go(-1);
  });
  svg.addEventListener('mousemove', e => {
    const x = e.clientX / svg.clientWidth, open = document.querySelector('.card:not([hidden])');
    svg.classList.toggle('to-next', !open && x > .7 && year < LAST);
    svg.classList.toggle('to-prev', !open && x < .3 && year > FIRST);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCards();
    else if (e.key === 'ArrowRight' && !e.altKey) go(1);
    else if (e.key === 'ArrowLeft' && !e.altKey) go(-1);
  });
  addEventListener('resize', fit);

  /* ---------- start: 1919, from where the war left them ---------- */
  showYear(FIRST);
  fit();
  pending = [FIRST - 1, FIRST];
  openEurope(FIRST);
  window.MAGICIANS = { go, get year() { return year; }, F, P, where, finishWalk, get walking() { return !!walk; } };   // for the checks
})();
