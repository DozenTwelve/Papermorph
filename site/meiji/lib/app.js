/* The Map Redrawn: a map you explore. Each year plays its events on the map (camera, pin, card, a region lit), then the
   four people walk their routes; the map itself changes state (domains, prefectures, ...) as the story says.
   Engine adapted from "Time of the Magicians" (Papermorph, MIT licence, LICENSE-engine.txt).
   Data: data/japan-1868.topo.json and domains-1868.json (the map), lib/states.js (STATES), lib/story.js (INTRO, PEOPLE,
   PLACES, START, YEARS), lib/events.js (EVENTS), lib/voiced.js (VOICED clips, MUSIC tracks), lib/sprite.js (figureSprite).
   World units are kilometres on one Lambert conic; SVG y points down. */
'use strict';
(async () => {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = s => document.querySelector(s);
  const svg = $('#map'), params = new URLSearchParams(location.search);
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const YEAR_KEYS = Object.keys(YEARS).map(Number), FIRST = Math.min(...YEAR_KEYS), LAST = Math.max(...YEAR_KEYS), WHO = Object.keys(PEOPLE);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = +params.get('speed') || 1;   // ?speed=4 plays the film four times faster (for checks)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- timers: everything that waits is counted, so a stopped scene leaves nothing behind ---------- */
  const timers = new Set(), frames = new Set(), waits = new Set();   // waits: what the film is waiting on; wake() ends them all
  const wake = () => { for (const f of [...waits]) f(); };
  function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; }
  function raf(fn) { const f = requestAnimationFrame(t => { frames.delete(f); fn(t); }); frames.add(f); return f; }
  function cancelAll() { for (const t of timers) clearTimeout(t); for (const f of frames) cancelAnimationFrame(f); timers.clear(); frames.clear(); }
  let film = null, epoch = 0;   // film: the year playing { y, skip }; epoch changes whenever a scene is stopped

  // a pause the film can be woken from; ends at once when the year is being skipped
  function hold(ms) {
    return new Promise(r => {
      if (film?.skip) return r();
      const done = () => { clearTimeout(t); timers.delete(t); waits.delete(done); r(); }, t = setTimeout(done, ms / SPEED);
      timers.add(t); waits.add(done);
    });
  }

  /* ---------- the map data ---------- */
  const [topo, info] = await Promise.all([fetch('data/japan-1868.topo.json').then(r => r.json()), fetch('data/domains-1868.json').then(r => r.json())]);
  const PORTRAIT = innerWidth <= 700 && innerHeight > 520;   // a phone held upright
  const ROT = (params.has('rot') ? +params.get('rot') : PORTRAIT ? -60 : 30) * Math.PI / 180, COS = Math.cos(ROT), SIN = Math.sin(ROT);   // the map is turned clockwise so the islands lie across the screen; on an upright phone, 60 degrees the other way so they stand along it
  const arcs = Topo.decode(topo), M = (m => [COS * m[0], SIN * m[0], -SIN * m[3], COS * m[3], COS * m[4] - SIN * m[5], SIN * m[4] + COS * m[5]])(Topo.matrix(topo));
  const toKm = q => [M[0] * q[0] + M[2] * q[1] + M[4], M[1] * q[0] + M[3] * q[1] + M[5]];   // quantised file units -> km on screen
  const toQ = p => { const det = M[0] * M[3] - M[1] * M[2], x = p[0] - M[4], y = p[1] - M[5]; return [(M[3] * x - M[2] * y) / det, (M[0] * y - M[1] * x) / det]; };
  const infoOf = Object.fromEntries(info.map(d => [d.lord, d]));
  const domGeoms = topo.objects.domains.geometries, provGeoms = topo.objects.provinces.geometries;
  // one piece per lord, 1871 prefecture (ken) and 1876 prefecture (k76); provinces: the ones this piece covers, biggest first
  const domains = domGeoms.map(g => ({ lord: g.properties.lord, kind: g.properties.kind, ken: g.properties.ken, k76: g.properties.k76, provinces: g.properties.provs ? g.properties.provs.split('、') : infoOf[g.properties.lord]?.provinces || [] }));
  const owner = Topo.owners(domGeoms);
  const nbr = domGeoms.map(() => new Set());   // domains that touch
  for (const gs of owner.values()) if (gs.length === 2) { nbr[gs[0]].add(gs[1]); nbr[gs[1]].add(gs[0]); }

  /* projection: the one the map was built with (Lambert conic, parallels 33 and 38, origin 36N 136E, GRS80) */
  const xy = (() => {
    const a = 6378137, f = 1 / 298.257222101, e = Math.sqrt(f * (2 - f)), r = Math.PI / 180;
    const mm = p => Math.cos(r * p) / Math.sqrt(1 - e * e * Math.sin(r * p) ** 2);
    const tt = p => Math.tan(Math.PI / 4 - r * p / 2) / ((1 - e * Math.sin(r * p)) / (1 + e * Math.sin(r * p))) ** (e / 2);
    const n = (Math.log(mm(33)) - Math.log(mm(38))) / (Math.log(tt(33)) - Math.log(tt(38)));
    const F = mm(33) / (n * tt(33) ** n), rho = p => a * F * tt(p) ** n;
    return (lon, lat) => { const th = n * r * (lon - 136), x = rho(lat) * Math.sin(th) / 1000, y = -(rho(36) - rho(lat) * Math.cos(th)) / 1000; return [COS * x - SIN * y, SIN * x + COS * y]; };
  })();
  const P = {};   // the placeholder route stops, projected
  for (const [key, [name, lon, lat, side]] of Object.entries(PLACES)) P[key] = { key, name, side: side || 'r', p: xy(lon, lat), p0: xy(lon, lat) };   // p0: where it truly lies; p may be moved to keep it on screen

  /* ---------- checks: say what the story asks for that the map cannot do ---------- */
  const where = { [FIRST - 1]: { ...START } };   // where[y][w]: the resting place at the end of year y
  for (let y = FIRST; y <= LAST; y++) {
    where[y] = {};
    for (const w of WHO) {
      const c = YEARS[y]?.[w];
      if (!c) { console.error(`story.js: ${y} has no card for ${w}`); where[y][w] = where[y - 1][w]; continue; }
      for (const k of [...c.route, c.at]) if (!P[k]) console.error(`story.js: ${y} ${w}: no place '${k}' in PLACES`);
      if (c.route.length && c.route.at(-1) !== c.at) console.error(`story.js: ${y} ${w}: route ends at ${c.route.at(-1)}, card says ${c.at}`);
      where[y][w] = c.at;
    }
    if (!EVENTS[y]?.length) console.error(`events.js: no EVENTS[${y}]`);
    for (const e of EVENTS[y] || []) if (e.state && !STATES.some(s => s.id === e.state)) console.error(`events.js: ${y}: no state '${e.state}'`);
  }
  const stateEnd = y => { let id = STATES[0].id; for (let k = FIRST; k <= y; k++) for (const e of EVENTS[k]) if (e.state) id = e.state; return id; };

  /* ---------- the map layers ---------- */
  const geo = el('g', { id: 'geo', transform: `matrix(${M.join(' ')})` }, svg);   // quantised file units -> km
  const landD = Topo.rings(arcs, Topo.polygons(topo.objects.land.geometries[0]));
  const landEl = el('path', { class: 'land', d: landD }, geo);
  const isLand = p => landEl.isPointInFill(new DOMPoint(...toQ(p)));
  const domG = el('g', {}, geo);
  const domEl = domGeoms.map(g => { const p = el('path', { class: 'dom', d: Topo.rings(arcs, Topo.polygons(g)) }, domG); el('title', {}, p); return p; });
  // province lines: the arcs between two provinces
  const provOwner = Topo.owners(provGeoms);
  const provLines = el('path', { class: 'prov', d: Topo.lines(arcs, [...provOwner].filter(([, g]) => g.length === 2).map(([id]) => id)) }, geo);
  const bordKept = el('path', { class: 'bord' }, geo), bordGone = el('path', { class: 'bord gone' }, geo), bordNew = el('path', { class: 'bord new' }, geo);
  const glowG = el('g', {}, geo);
  el('path', { class: 'coast', d: landD }, geo);
  // paper grain, baked once into a small tile and multiplied over the whole map
  const tile = document.createElement('canvas'); tile.width = tile.height = 160;
  const tc = tile.getContext('2d'), grain = tc.createImageData(160, 160);
  for (let i = 0; i < grain.data.length; i += 4) { const v = 205 + Math.random() * 50; grain.data[i] = v; grain.data[i + 1] = v * .98; grain.data[i + 2] = v * .94; grain.data[i + 3] = 255; }
  tc.putImageData(grain, 0, 0);
  $('#paper').style.backgroundImage = `url(${tile.toDataURL()})`;
  const defs = el('defs', {}, svg);
  const trails = el('g', { id: 'trails' }, svg);
  for (const w of WHO) {   // the arrowhead at a trail's end, in its walker's colour
    const m = el('marker', { id: `arrow-${w}`, viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 3, markerHeight: 3, orient: 'auto' }, defs);
    el('path', { d: 'M0,1L10,5L0,9z', fill: PEOPLE[w].color }, m);
  }
  const labelsG = el('g', { id: 'labels' }, svg), pinsG = el('g', { id: 'pins' }, svg), figsG = el('g', { id: 'figs' }, svg);

  /* ---------- map states: the grouping of lords, recoloured and re-lined as the story moves ---------- */
  // the page's own woodblock colours for the palette names a state asks for (states.js says which, this says what)
  const PAL = {
    domains: ['#d3a88f', '#a2b7b2', '#cdc597', '#b9aabb', '#a9bb98', '#97aac0', '#d8b682', '#cba0a0', '#bbbfa6', '#a3bec8'],
    prefectures: ['#bc8a72', '#86a19c', '#b2ae78', '#a08ca6', '#8fa781', '#7791ab', '#c8a164', '#b58c91', '#939f88', '#82a6b2'],
    consolidated: ['#e0a98f', '#9cc0bd', '#d6cc8c', '#bba7c6', '#a5c48f', '#8fadcf', '#e2b86e', '#d29ca3', '#b3bd9c', '#8dbfd2'],
  };
  const KINDS = { bakufu: '#f1e8d2', hatamoto: '#d2b98c', religious: '#c4bcae', court: '#dfcbc6', other: '#e5d8b0', unknown: '#a9aaa3' };
  const built = {};   // state id -> { of: group of each domain, groups, borders: the arcs between different groups }
  function buildState(s) {
    const byKey = new Map(), groups = [], of = [];
    domains.forEach((d, i) => {
      const g = s.group(d);
      let G = byKey.get(g.key);
      if (!G) { G = { key: g.key, name: g.name, color: g.color, kind: g.kind, kinds: new Set(), nbr: new Set() }; byKey.set(g.key, G); groups.push(G); }
      G.kinds.add(d.kind); of[i] = G;
    });
    nbr.forEach((set, i) => { for (const j of set) if (of[j] !== of[i]) of[i].nbr.add(of[j]); });
    // han take palette colours, most-connected first, each avoiding what its neighbours already wear
    const pal = PAL[s.palette] || PAL.domains, used = new Map(pal.map(c => [c, 0]));
    // land that is not han keeps its colour by kind; a group of mixed kinds (a prefecture) is coloured like han
    for (const g of groups) { g.kind ||= g.kinds.size === 1 ? [...g.kinds][0] : 'han'; if (!g.color && g.kind !== 'han' && KINDS[g.kind]) g.color = KINDS[g.kind]; }
    for (const g of groups.filter(g => !g.color).sort((a, b) => b.nbr.size - a.nbr.size)) {
      const near = new Set([...g.nbr].map(n => n.color));
      g.color = pal.filter(c => !near.has(c)).sort((a, b) => used.get(a) - used.get(b))[0] || pal[groups.indexOf(g) % pal.length];
      used.set(g.color, (used.get(g.color) || 0) + 1);
    }
    const borders = new Set();
    for (const [id, gs] of owner) if (gs.length === 2 && of[gs[0]] !== of[gs[1]]) borders.add(id);
    return { of, groups, borders };
  }
  let stateId = null, shownBorders = null, settleTimer = 0;
  // swap to the settled border set: the lines that stay, with none left over from a fade
  function commitBorders() {
    if (settleTimer) { clearTimeout(settleTimer); timers.delete(settleTimer); settleTimer = 0; }
    if (!shownBorders) return;
    bordKept.setAttribute('d', Topo.lines(arcs, shownBorders)); bordGone.setAttribute('d', ''); bordNew.setAttribute('d', '');
  }
  // go to a state: fills fade to the new groups' colours; lines between merged parts fade out, new lines fade in
  function setState(id, animate) {
    const s = STATES.find(x => x.id === id);
    if (!s || id === stateId) return;
    built[id] ||= buildState(s);
    const b = built[id];
    commitBorders();
    domEl.forEach((p, i) => {
      p.style.transition = animate && !reduced ? '' : 'none';
      p.style.fill = p.style.stroke = b.of[i].color;
      p.firstChild.textContent = `${b.of[i].name}`;
    });
    if (animate && shownBorders && !reduced) {
      const keep = [...b.borders].filter(a => shownBorders.has(a)), gone = [...shownBorders].filter(a => !b.borders.has(a)), add = [...b.borders].filter(a => !shownBorders.has(a));
      bordKept.setAttribute('d', Topo.lines(arcs, keep)); bordGone.setAttribute('d', Topo.lines(arcs, gone)); bordNew.setAttribute('d', Topo.lines(arcs, add));
      // the lines that go (or arrive) are drawn in vermilion at any zoom, then fade; the rest of the lines stay in ink
      bordGone.style.transition = bordNew.style.transition = 'none'; bordGone.style.opacity = 1; bordNew.style.opacity = 0;
      for (const p of [bordGone, bordNew]) { p.style.display = ''; p.style.strokeOpacity = 1; p.style.strokeWidth = '1px'; }
      void bordNew.getBoundingClientRect();
      bordGone.style.transition = bordNew.style.transition = ''; bordGone.style.opacity = 0; bordNew.style.opacity = 1;
      shownBorders = b.borders; settleTimer = later(commitBorders, 2800);
    } else { shownBorders = b.borders; commitBorders(); }
    provLines.classList.toggle('off', !s.provinceLines);
    stateId = id; lineFloor = b.groups.length <= 120 ? .55 : 0; lineStyle();
    const cap = $('#mapstate'); cap.textContent = s.label;
    if (s.note) { const n = document.createElement('span'); n.className = 'note'; n.textContent = s.note; cap.append(n); }
  }

  /* a province to light for an event: its outline, filled, above the lords' colours */
  const provEl = {};
  function glow(name, on) {
    if (!provEl[name]) {
      const g = provGeoms.find(g => g.properties.prov === name);
      if (!g) { console.error(`events.js: no province '${name}'`); return null; }
      provEl[name] = { g, p: el('path', { class: 'glow', d: Topo.rings(arcs, Topo.polygons(g)) }, glowG), c: Topo.centre(arcs, g) };
    }
    provEl[name].p.classList.toggle('on', on);
    return provEl[name];
  }

  /* ---------- the figures: one sprite each, a name tag, and a ring for the keyboard ---------- */
  const F = {}, leadG = el('g', {}, figsG);
  for (const w of WHO) {
    const who = PEOPLE[w];
    const lead = el('g', { class: 'lead' }, leadG);   // a thin line from the place to where the figure stands
    el('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: who.color }, lead); el('circle', { r: 2.6, fill: who.color }, lead);
    const g = el('g', { class: 'fig idle', tabindex: 0, role: 'button' }, figsG);
    const inner = el('g', {}, g);   // the body, scaled with the camera; the name tag is not
    const bob = el('g', { class: 'bob' }, inner), sway = el('g', { class: 'sway' }, bob), flip = el('g', {}, sway);
    const sp = figureSprite(w), art = el('g', {}, flip);
    art.innerHTML = sp.markup;
    const ring = el('rect', { class: 'ring', rx: 6 }, inner);
    const tag = el('g', { class: 'tag' }, g), tr = el('rect', { rx: 3 }, tag), tt = el('text', {}, tag);
    tt.textContent = who.short;
    g.addEventListener('click', e => { e.stopPropagation(); openPerson(w); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPerson(w); } });
    F[w] = { g, inner, lead, bob, flip, art, sp, ring, tag, tr, tt, pos: P[START[w]].p.slice(), off: [0, 0], tagShift: [0, 0], box: null };
    const b = document.createElement('button');
    b.textContent = who.short; b.style.setProperty('--c', who.color);
    b.addEventListener('click', () => openPerson(w, b));
    $('#people').appendChild(b);
  }

  /* ---------- the view: what part of the map the screen shows ---------- */
  let view = [0, 0, 1, 1], home = view;   // [x, y, width, height] in km
  const W = () => svg.clientWidth, H = () => svg.clientHeight;
  const Kpx = () => view[2] / W();   // km per screen pixel
  let FHN = 65, FHX = 110, FH = FHN;   // a figure's height in screen px: FHN at the whole-Japan view, growing with the zoom up to FHX
  const narrow = () => W() <= 700 && H() > 520;   // a phone held upright: cards go under the map
  function setView(v) {
    view = v; svg.setAttribute('viewBox', v.join(' '));
    FH = Math.min(FHX, FHN * Math.sqrt(home[2] / v[2]));
    lineStyle(); rescale();
  }
  // parcel outlines come in with the zoom: none at the whole-Japan view, full when close. A state of few big areas
  // (the 75 prefectures) keeps its outlines at every zoom.
  let lineFloor = 0;
  function lineStyle() {
    const t = Math.max(lineFloor, clamp((home[2] / view[2] - 1.3) / 2, 0, 1));
    bordKept.style.display = t < .02 ? 'none' : ''; bordKept.style.strokeOpacity = (.62 * t).toFixed(2); bordKept.style.strokeWidth = (.45 + .4 * t).toFixed(2) + 'px';
  }

  /* the map's own box on the screen: where the camera may look without a control or card on top */
  const rectOf = s => $(s).getBoundingClientRect();
  let sheetH = 0;   // height of the bottom sheet the next event will show, px (measured by sheetFor)
  function freeRect(side) {
    const w = W(), h = H();
    let top = rectOf('#yearbar').bottom + 4, bottom = h - 8, left = 0, right = w;
    if (narrow()) {   // below the year plate, above the four (and the replay button above them) or the card's sheet
      top = rectOf('#top').bottom + 8;
      bottom = side === 'bottom' ? h - sheetH - 14 : rectOf('#people').top - 58;
    } else { bottom = h - 56; if (!side) top = rectOf('#top').bottom + 16; }   // the whole-map frame clears the hint
    if (side === 'bottom' && !narrow()) bottom = h * .5 - 10;
    if (side === 'left') left = Math.min(460, w * .4) + 40;
    if (side === 'right') right = w - Math.min(460, w * .4) - 40;
    return [left, top, right, bottom];
  }
  // a view with the points (km) in the middle of the free rect, as close as the points allow
  function viewFor(pts, side, kmWide) {
    const [l, t, r, b] = freeRect(side), fw = r - l, fh = b - t, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min(fw / Math.max(x1 - x0, 1) / 1.1, fh / Math.max(y1 - y0, 1) / 1.1, fw / kmWide);   // px per km
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return [cx - (l + fw / 2) / s, cy - (t + fh / 2) / s, W() / s, H() / s];
  }
  // everything that is ever drawn (not Okinawa), for the whole-Japan frame
  const JAPAN = [[129.6, 31.0], [129.7, 34.6], [141.6, 41.6], [142.2, 39.5], [140.9, 35.0], [135.7, 33.4], [131, 31.1]].map(([lo, la]) => xy(lo, la));
  function fit() {
    const w = W(), h = H();
    [FHN, FHX] = narrow() ? [40, 64] : h < 520 ? [34, 52] : [50, 84];
    home = viewFor(JAPAN, null, 0);
    placeAbroad();
    if (!film && !walking && !zoomed) setView(home); else setView(view);
    for (const wh of WHO) sizeFigure(wh);
    standIn(); layout();
  }
  let zoomed = false;   // the camera is on a close-up
  // 'abroad' is a marker in the sea for people overseas. It sits where it truly lies if the whole-Japan frame shows that with
  // room around it for the name and the figures; otherwise it is moved to the nearest spot inside the frame that does.
  function placeAbroad() {
    const a = P.abroad;
    if (!a) return;
    const [l, t, r, b] = freeRect(null), k = home[2] / W(), mx = 70, my = 90;
    // on a wide screen a person's card stands in the bottom right: keep the marker above where it reaches
    const px = clamp((a.p0[0] - home[0]) / k, l + mx, r - mx), py = clamp((a.p0[1] - home[1]) / k, t + my, narrow() ? b - 30 : Math.min(b - 30, H() * .6));
    a.p[0] = home[0] + px * k; a.p[1] = home[1] + py * k;
  }

  /* the camera: ease the view to another; a wake() jumps it to the end */
  let camRun = 0;
  function cam(to, ms) {
    const from = view.slice(), id = ++camRun, ep = epoch;
    zoomed = to !== home;
    svg.classList.add('cam', 'lite');
    const end = () => { if (id === camRun) { setView(to); svg.classList.remove('cam'); if (!walking) svg.classList.remove('lite'); layout(); } };
    if (reduced || film?.skip || !ms) { end(); return Promise.resolve(); }
    return new Promise(r => {
      const t0 = performance.now(), ms2 = ms / SPEED;
      const done = () => { waits.delete(done); end(); r(); };
      waits.add(done);
      (function tick(now) {
        if (!waits.has(done) || ep !== epoch) return;
        const q = Math.min(1, (now - t0) / ms2), e = q < .5 ? 4 * q * q * q : 1 - (-2 * q + 2) ** 3 / 2;
        // zoom on a log scale so a long move feels even; the centre slides linearly
        const w = Math.exp(Math.log(from[2]) + (Math.log(to[2]) - Math.log(from[2])) * e), h = w * H() / W();
        const cx = (from[0] + from[2] / 2) + ((to[0] + to[2] / 2) - (from[0] + from[2] / 2)) * e, cy = (from[1] + from[3] / 2) + ((to[1] + to[3] / 2) - (from[1] + from[3] / 2)) * e;
        setView([cx - w / 2, cy - h / 2, w, h]);
        if (q < 1) raf(tick); else done();
      })(t0);
    });
  }

  /* ---------- placing the things drawn at screen size: figures, pins, labels ---------- */
  function sizeFigure(w) {
    const f = F[w], s = FHX / 252;   // drawn at its biggest; the camera scales the group down
    f.art.setAttribute('transform', `scale(${s}) translate(-60,${-f.sp.feet})`);
    f.hw = f.sp.width * s / 2 + 2;   // half the body's width, px
    f.ring.setAttribute('x', -f.hw - 4); f.ring.setAttribute('y', -FHX - 24); f.ring.setAttribute('width', 2 * f.hw + 8); f.ring.setAttribute('height', FHX + 28);
    f.tw = f.tt.getComputedTextLength() + 12;
    f.tr.setAttribute('x', -f.tw / 2); f.tr.setAttribute('y', 0); f.tr.setAttribute('width', f.tw); f.tr.setAttribute('height', 15);
    f.tt.setAttribute('x', 0); f.tt.setAttribute('y', 11.5);
  }
  const labels = [];   // { g, t, at: [x, y] km, w, h px, box: world box once placed }
  function makeLabel(cls, text, at, parent) {
    const g = el('g', { class: `lab ${cls}` }, parent || labelsG), t = el('text', {}, g);
    t.textContent = text;
    const L = { g, t, at, box: null, cls: cls.split(' ')[0] };
    measure(L); labels.push(L);
    return L;
  }
  // a name's size, and where its text sits from its x and y
  function measure(L) {
    const x = +L.t.getAttribute('x') || 0, y = +L.t.getAttribute('y') || 0, bb = L.t.getBBox();
    Object.assign(L, { w: bb.width + 2, h: bb.height, bx: bb.x - x, by: bb.y - y });
  }
  function dropLabel(L) { L.g.remove(); labels.splice(labels.indexOf(L), 1); }
  function rescale() {
    const k = Kpx();
    for (const w of WHO) setFig(w, k);
    trails.style.setProperty('--k', k.toFixed(4));
    for (const p of pinList) p.g.setAttribute('transform', `translate(${p.at[0].toFixed(2)},${p.at[1].toFixed(2)}) scale(${k.toFixed(4)})`);
    for (const L of labels) L.g.setAttribute('transform', `translate(${L.at[0].toFixed(2)},${L.at[1].toFixed(2)}) scale(${k.toFixed(4)})`);
  }
  // a figure at its place plus its fan-out offset, at the camera's scale; the leader joins it to the place
  function setFig(w, k = Kpx()) {
    const f = F[w], x = f.pos[0] + f.off[0], y = f.pos[1] + f.off[1], ks = k.toFixed(4);
    f.g.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${ks})`);
    f.inner.setAttribute('transform', `scale(${(FH / FHX).toFixed(4)})`);
    f.tag.setAttribute('transform', `translate(${f.tagShift[0]},${(f.tagShift[1] - FH - 24).toFixed(1)})`);
    f.lead.setAttribute('transform', `translate(${f.pos[0].toFixed(2)},${f.pos[1].toFixed(2)}) scale(${ks})`);
    const l = f.lead.firstChild; l.setAttribute('x2', (f.off[0] / k).toFixed(1)); l.setAttribute('y2', (f.off[1] / k).toFixed(1));
  }
  function place(w, bobY = 0, tilt = 0) {
    const f = F[w];
    setFig(w);
    f.bob.setAttribute('transform', `translate(0,${bobY.toFixed(2)}) rotate(${tilt.toFixed(2)})`);
    f.g.setAttribute('aria-label', `${PEOPLE[w].name}, ${year}, ${P[where[year][w]].name}: open their card`);
  }
  const face = (w, dx) => { if (Math.abs(dx) > .001) F[w].flip.setAttribute('transform', dx < 0 ? 'scale(-1,1)' : ''); };

  /* ---------- walking ---------- */
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  // the points walked in year y, from where w stood at the end of y - 1
  // (a figure that is gone walks nowhere; stops at the same point, such as Edo and Tokyo, count once)
  function routeOf(y, w) {
    if (YEARS[y][w].gone) return [P[where[y - 1][w]].p];
    const keys = [where[y - 1][w], ...YEARS[y][w].route].filter((k, i, a) => i === 0 || k !== a[i - 1]);
    return keys.map(k => P[k].p).filter((p, i, a) => i === 0 || len(p, a[i - 1]) > .5);
  }
  // the point d km along a polyline, and which way it is heading
  function at(pts, d) {
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

  /* people in one town fan out into the sea: each group stands off the coast, clear of the land, and a thin leader
     joins each to the place. Returns the offset in km of every figure from its place. */
  const DIRS = [0, 180, 45, 135, -45, -135, 90, -90, 22, 158, -22, -158, 68, 112, -68, -112].map(a => a * Math.PI / 180);
  function fanOffsets(y) {
    const k = home[2] / W(), r = FHN * k * 1.5, gap = FHN * k * .7, groups = [], out = {}, [fl, ft, fr, fb] = freeRect(null);
    for (const w of WHO) out[w] = [0, 0];
    for (const w of WHO.filter(w => !YEARS[y]?.[w]?.gone)) {   // a figure that is gone takes no room
      const p = P[where[y][w]].p, g = groups.find(g => g.some(v => len(P[where[y][v]].p, p) < FHN * k * 2));
      if (g) g.push(w); else groups.push([w]);
    }
    for (const ws of groups) {
      ws.sort((a, b) => WHO.indexOf(a) - WHO.indexOf(b));
      const c = [0, 1].map(i => ws.reduce((s, w) => s + P[where[y][w]].p[i], 0) / ws.length);
      let best = null;
      for (const a of DIRS) {
        const pos = ws.map((w, i) => { const t = (i - (ws.length - 1) / 2) * gap; return [c[0] + Math.cos(a) * r - Math.sin(a) * t, c[1] + Math.sin(a) * r + Math.cos(a) * t]; });
        // a point on the sea under the feet, the waist and the head counts for one
        // a figure that would stand off the screen, or under the year plate, counts against the direction
        const score = pos.reduce((s, p) => {
          const px = (p[0] - home[0]) / k, py = (p[1] - home[1]) / k, hw = FHN * .45;
          return s + [0, .5, 1].filter(h => !isLand([p[0], p[1] - h * FHN * k])).length - (px - hw < fl || px + hw > fr || py - FHN - 22 < ft || py + 4 > H() - 8 ? 6 : 0);
        }, 0);
        if (!best || score > best.score) best = { score, pos };
      }
      ws.forEach((w, i) => { const p = P[where[y][w]].p; out[w] = [best.pos[i][0] - p[0], best.pos[i][1] - p[1]]; });
    }
    return out;
  }
  // everyone where the end of year y left them, no walking
  let standing = FIRST - 1;
  function standAt(y) {
    standing = y;
    const off = fanOffsets(y);
    for (const w of WHO) {
      const f = F[w], gone = !!YEARS[y]?.[w]?.gone;
      f.pos = P[where[y][w]].p.slice(); f.off = off[w]; f.gone = gone;
      f.g.classList.toggle('gone', gone); f.lead.classList.toggle('gone', gone);
      place(w);
    }
  }
  const standIn = () => { if (!walking) standAt(standing); };

  function drawTrails(y, old) {
    trails.replaceChildren();
    for (const w of WHO) {
      const pts = routeOf(y, w);
      if (pts.length < 2) continue;
      const g = el('g', { class: 'route' + (old ? ' old' : ''), 'data-w': w }, trails), d = old ? dpath(pts) : 'M0,0';
      el('path', { class: 'case', d }, g);   // a paper edge under the dashes, so the line reads over borders
      el('path', { class: 'trail', d, stroke: PEOPLE[w].color, 'marker-end': `url(#arrow-${w})` }, g);
    }
  }
  const setTrail = (g, pts) => { if (g) for (const p of g.children) p.setAttribute('d', dpath(pts)); };
  const fullTrails = (y, old) => { drawTrails(y, old); for (const g of trails.children) setTrail(g, routeOf(y, g.dataset.w)); };

  /* walk people along their routes. items: [{ w, pts, off0, off1 }] all at once; follow: the camera stays on the first.
     Each leg eases in and out with a short rest at each stop. Resolves when all have arrived (or on wake()). */
  let walking = false;
  const legTime = l => clamp(l * 4, 700, 2200);
  const REST = 250;
  function walkFigs(items, follow) {
    const ep = epoch;
    walking = true;
    const rows = items.map(it => {
      const legs = it.pts.slice(1).map((q, i) => len(it.pts[i], q)), durs = legs.map(legTime), L = legs.reduce((a, b) => a + b, 0);
      const T = durs.reduce((a, b) => a + b, 0) + REST * Math.max(0, legs.length - 1);
      return { ...it, legs, durs, L, T, trail: trails.querySelector(`[data-w="${it.w}"]`) };
    });
    for (const r of rows) F[r.w].g.classList.remove('idle');
    if (follow) svg.classList.add('lite');
    return new Promise(res => {
      let t0 = 0, vw = null, last = 0;
      const end = () => {
        waits.delete(end); walking = false; svg.classList.remove('lite');
        for (const r of rows) {
          const f = F[r.w]; f.pos = r.pts.at(-1).slice(); f.off = r.off1; place(r.w); f.g.classList.add('idle'); setTrail(r.trail, r.fwd ? r.pts : r.out);
        }
        res();
      };
      waits.add(end);
      const go = () => {
        if (!waits.has(end) || ep !== epoch) return;
        if (reduced) return end();
        t0 = last = performance.now(); raf(tick);
      };
      if (follow) cam(followView(rows[0]), 700).then(go); else go();
      function tick(now) {
        if (!waits.has(end) || ep !== epoch) return;
        const dt = now - last; last = now;
        let busy = false;
        for (const r of rows) {
          // where along the route at this time: each leg eases, with a rest at each stop between
          const elapsed = (now - t0) * SPEED;
          let t = elapsed, d = 0, moving = false;
          for (let i = 0; i < r.legs.length; i++) {
            if (t < r.durs[i]) { const q = t / r.durs[i]; d += r.legs[i] * (q < .5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2); moving = true; break; }
            t -= r.durs[i]; d += r.legs[i];
            if (i + 1 < r.legs.length) { if (t < REST) break; t -= REST; }
          }
          const e = Math.min(1, elapsed / r.T), f = F[r.w], [p, dx] = at(r.pts, d), ph = d / (Kpx() * FH * .22);
          f.pos = p; f.off = r.off0.map((o, i) => o + (r.off1[i] - o) * e);
          face(r.w, dx);
          place(r.w, moving ? -Math.abs(Math.sin(ph)) * FH * .035 : 0, moving ? Math.sin(ph) * 1.5 : 0);
          setTrail(r.trail, r.fwd ? partial(r.pts, d) : partial(r.out, r.L - d));
          if (elapsed < r.T + 250) busy = true;
        }
        if (follow) {   // the camera eases after the first walker; the centre stays inside the free rect
          const f = F[rows[0].w], target = followView({ w: rows[0].w, mid: [f.pos[0] + f.off[0], f.pos[1] + f.off[1] - Kpx() * FH * .5] });
          const a = 1 - Math.exp(-dt / 140);
          vw = view.map((v, k) => v + (target[k] - v) * a);
          setView(vw);
        }
        if (busy) raf(tick); else end();
      }
    });
  }
  // the follow shot: wide enough to see where the walker is going, the walker in the middle of the free rect
  function followView(r) {
    const f = F[r.w], mid = r.mid || [f.pos[0] + f.off[0], f.pos[1] + f.off[1] - Kpx() * FH * .5];
    return viewFor([mid], null, narrow() ? 380 : 900);
  }

  /* ---------- labels: one pass places every name the scene needs, clear of each other and of what is on top ---------- */
  let onPlaces = new Set();   // the route stops named this year
  const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const overlaps = (b, list) => list.reduce((s, o) => s + overlap(b, o), 0);
  const SIDES = {   // a name's box relative to its point, in px: [x of left edge, y of top edge] from (w, h)
    r: (w, h) => [8, -h / 2], l: (w, h) => [-8 - w, -h / 2], t: (w, h) => [-w / 2, -h - 7], b: (w, h) => [-w / 2, 8],
    tr: (w, h) => [6, -h - 5], tl: (w, h) => [-6 - w, -h - 5], br: (w, h) => [6, 7], bl: (w, h) => [-6 - w, 7],
    t2: (w, h) => [-w / 2, -2 * h - 9], b2: (w, h) => [-w / 2, h + 9], c: (w, h) => [-w / 2, -h / 2],
    cu: (w, h) => [-w / 2, -h * 1.7], cd: (w, h) => [-w / 2, h * .7],
    r2: (w, h) => [26, -h / 2], l2: (w, h) => [-26 - w, -h / 2], r3: (w, h) => [26, 4], l3: (w, h) => [-26 - w, 4],
  };
  // what the page draws over the map, in km, so names keep out from under it
  function screenBoxes() {
    const k = Kpx(), sr = svg.getBoundingClientRect(), out = [];
    for (const s of ['#yearbar', '#mapstate', '#north', '#brand', '#corner', '#people', '#event:not([hidden])', '#person:not([hidden])', '#credits:not([hidden])', '#intro:not([hidden])',
      '#filmbar:not([hidden])', '#move:not([hidden])', '#replay:not([hidden])', '#hint']) {
      const e = $(s);
      if (!e || getComputedStyle(e).opacity === '0' || getComputedStyle(e).visibility === 'hidden') continue;
      const r = e.getBoundingClientRect();
      if (!r.width) continue;
      out.push([view[0] + (r.left - sr.left - 4) * k, view[1] + (r.top - sr.top - 4) * k, view[0] + (r.right - sr.left + 4) * k, view[1] + (r.bottom - sr.top + 4) * k]);
    }
    return out;
  }
  function layout() {
    const k = Kpx(), v = view, ui = screenBoxes(), solid = ui.slice();
    const out = b => b[0] < v[0] || b[1] < v[1] || b[2] > v[0] + v[2] || b[3] > v[1] + v[3];   // off the screen
    const showFigs = !document.body.classList.contains('film'), live = showFigs ? WHO.filter(w => !F[w].gone) : [];   // a figure that is gone has no box, tag or place name
    const fx = w => F[w].pos[0] + F[w].off[0], fy = w => F[w].pos[1] + F[w].off[1], hw = f => f.hw * FH / FHX;
    for (const w of live) { const f = F[w], x = fx(w), y = fy(w); f.box = [x - hw(f) * k, y - FH * k, x + hw(f) * k, y + 3 * k]; solid.push(f.box); }
    // the dots: figures stand on them, pins mark events
    const dots = {};
    for (const key of onPlaces) { const [x, y] = P[key].p; dots[key] = [x - 4 * k, y - 4 * k, x + 4 * k, y + 4 * k]; }
    for (const p of pinList) { const [x, y] = p.at; solid.push([x - 8 * k, y - 8 * k, x + 8 * k, y + 8 * k]); }
    const tags = [];
    for (const w of live) {   // name tags: above the head, beside it, higher, or under the feet: where no figure, tag or panel is
      const f = F[w], x = fx(w), y = fy(w), top0 = -FH - 24, sh = f.tw * .6 + 4;
      const others = solid.filter(b => b !== f.box).concat(tags);
      const opts = [[0, top0], [-sh, top0], [sh, top0], [0, top0 - 17], [-sh, top0 - 17], [sh, top0 - 17], [0, top0 - 34], [-sh, top0 - 34], [sh, top0 - 34], [-2 * sh, top0], [2 * sh, top0], [0, top0 - 51], [0, top0 + 14], [-sh, top0 + 14], [sh, top0 + 14], [0, 8], [-sh, 8], [sh, 8]];
      let best = null;
      for (const [dx, top] of opts) {
        const b = [x + (dx - f.tw / 2) * k, y + top * k, x + (dx + f.tw / 2) * k, y + (top + 15) * k], cost = overlaps(b, others) + (out(b) || overlaps(b, ui) ? 1e9 : 0);
        if (!best || cost < best.cost) best = { cost, dx, top, b };
        if (!cost) break;
      }
      f.tagShift = [best.dx, best.top - top0];
      f.tag.classList.toggle('off', best.cost > 0);   // no free room clear of panels, figures and other tags: no tag (the colour and the legend name them)
      tags.push(best.b);
    }
    // names, most needed first: where an event is, the lit region, where someone stands, then places only passed through
    const stand = new Set(live.map(w => where[standing][w]));
    const order = [...labels.filter(L => L.cls === 'pinname'), ...labels.filter(L => L.cls === 'region'),
      ...labels.filter(L => L.cls === 'city' && stand.has(L.key)), ...labels.filter(L => L.cls === 'city' && !stand.has(L.key))];
    const placed = [];
    for (const L of order) {
      const must = L.cls === 'pinname';   // an event's name always shows; the rest give way
      if (L.cls === 'city' && (!showFigs || !onPlaces.has(L.key))) { L.g.classList.add('drop'); L.box = null; continue; }
      const sides = L.cls === 'city' ? [L.side, 'r', 'l', 'b', 't', 'br', 'bl', 'tr', 'tl', 'r2', 'l2']
        : L.cls === 'region' ? ['c', 'cu', 'cd', 't', 'b'] : ['t', 'tr', 'tl', 't2', 'b', 'r', 'l'];
      const obstacles = solid.concat(tags, placed, Object.entries(dots).filter(([key]) => key !== L.key).map(([, b]) => b));
      let best = null;
      for (const s of sides) {
        const [ox, oy] = SIDES[s](L.w, L.h), b = [L.at[0] + ox * k, L.at[1] + oy * k, L.at[0] + (ox + L.w) * k, L.at[1] + (oy + L.h) * k];
        const cost = overlaps(b, obstacles) + (out(b) || overlaps(b, ui) ? 1e9 : 0);
        if (!best || cost < best.cost) best = { cost, ox, oy, b };
        if (!cost) break;
      }
      const drop = best.cost >= 1e9 || (best.cost > 0 && !must);   // never under a panel; a name that must show only gives way to other names
      L.g.classList.toggle('drop', drop);
      L.t.setAttribute('x', best.ox - L.bx); L.t.setAttribute('y', best.oy - L.by);
      L.box = drop ? null : best.b;
      if (!drop) placed.push(best.b);
      if (must && best.cost > 0) console.info(`labels: no clear room for ${L.t.textContent}`);
    }
    rescale();
  }

  // the route stops of the year shown (city names on the map)
  for (const p of Object.values(P)) { const L = makeLabel('city drop', p.name, p.p); L.key = p.key; L.side = p.side; }
  function showYear(y) {
    year = y;
    $('#year').textContent = y;
    $('#prev').disabled = y <= FIRST; $('#next').disabled = y >= LAST;
    $('#replay span').textContent = y;
    const on = new Set(), nm = k => (k === 'edo' && y >= 1869 ? 'tokyo' : k);   // same spot, and the city is Tokyo from 1869
    WHO.forEach((w, i) => {
      const gone = !!YEARS[y][w].gone;
      const chip = $('#people').children[i];   // the legend chip stays and opens the card, drawn hollow: the figure is not on the map
      chip?.classList.toggle('gone', gone); if (chip) chip.title = gone ? `${PEOPLE[w].short} is no longer on the map; the card tells why` : '';
      if (gone) return;
      on.add(nm(where[y - 1][w])); for (const k of YEARS[y][w].route) on.add(nm(k)); on.add(nm(where[y][w]));
    });
    onPlaces = on;
    document.dispatchEvent(new CustomEvent('year', { detail: y }));   // the music listens: its track depends on the year
  }

  /* ---------- cards ---------- */
  const evCard = $('#event'), voice = $('#voice');
  let opener = null;
  const dialogs = () => [...document.querySelectorAll('#person, #credits')];
  const openDialog = () => dialogs().find(c => !c.hidden);
  let peeked = false;   // the camera moved aside so that a person's sheet does not cover the figure
  function closeCards(restore = true) {
    if (!film) stopVoice();   // a person's clip ends with their card
    for (const c of dialogs()) c.hidden = true;
    if (peeked) { peeked = false; if (restore) cam(home, 400); }
    document.body.classList.remove('card-open', 'credits-open');
    if (opener && document.contains(opener)) opener.focus?.();
    opener = null;
    layout();
  }
  function openCard(card, from) {
    for (const c of dialogs()) if (c !== card) c.hidden = true;
    opener = from || document.activeElement; card.hidden = false; card.tabIndex = -1; card.focus();
    document.body.classList.add('card-open');
    document.body.classList.toggle('credits-open', card.id === 'credits');
    layout();
  }
  // a person's card for the year shown
  function openPerson(w, from) {
    if (film || walking) return;
    const c = YEARS[year][w], card = $('#person'), who = PEOPLE[w];
    card.style.setProperty('--c', who.color);
    const portrait = card.querySelector('.head img');
    portrait.onload = () => layout();   // the card changes size when the portrait arrives
    portrait.src = who.img;
    card.querySelector('h2').textContent = who.name;
    card.querySelector('.jp').textContent = who.jp;
    card.querySelector('.where').textContent = `${year} · ${c.place}`;
    card.querySelector('.text').textContent = c.text;
    openCard(card, from || F[w].g);
    // on a phone the sheet covers the foot of the map: if the figure stands there, slide the map up until it is clear of the sheet
    if (narrow() && !F[w].gone) {
      const k = Kpx(), sr = svg.getBoundingClientRect(), f = F[w], feet = (f.pos[1] + f.off[1] - view[1]) / k;
      const room = card.getBoundingClientRect().top - sr.top - 12, headRoom = feet - FH - 24 - (rectOf('#top').bottom - sr.top + 6);
      const dy = Math.min(feet - room, headRoom);
      if (dy > 1) { peeked = true; cam([view[0], view[1] + dy * k, view[2], view[3]], 450); }
    }
    speak(`${year}-${w}`);
  }
  for (const c of document.querySelectorAll('.card')) {
    c.querySelector('.close')?.addEventListener('click', () => closeCards());
    c.addEventListener('click', e => e.stopPropagation());
  }
  $('#credits-open').addEventListener('click', e => { e.stopPropagation(); openCard($('#credits'), e.currentTarget); });

  /* ---------- sound: a narration clip if one is listed, else a reading time; music if there are tracks ---------- */
  const VOICED = new Set(window.VOICED || []);
  const readMs = text => clamp(1800 + text.length * 55, 2400, 12000);
  // play a person's clip, with a Listen / Pause button on their card
  const playBtn = $('#person .play');
  function speak(id) {
    stopVoice(); playBtn.hidden = !VOICED.has(id);
    if (playBtn.hidden) return;
    voice.src = `audio/en/${id}.mp3`; voice.play().catch(() => {});
  }
  playBtn.addEventListener('click', () => { if (voice.paused) { if (voice.ended) voice.currentTime = 0; voice.play().catch(() => {}); } else voice.pause(); });
  for (const ev of ['play', 'pause', 'ended', 'emptied']) voice.addEventListener(ev, () => { playBtn.textContent = voice.paused ? '▶ Listen' : '❚❚ Pause'; });
  function stopVoice() { voice.onended = voice.onerror = null; voice.pause(); voice.removeAttribute('src'); voice.load(); }
  // a card's narration in the film: the clip to its end, or a pause as long as the text takes to read
  function narrate(id, text) {
    if (!VOICED.has(id)) return hold(readMs(text));
    return new Promise(r => {
      if (film?.skip) return r();
      let t = 0;
      const done = () => { clearTimeout(t); timers.delete(t); waits.delete(done); voice.onended = voice.onerror = null; r(); };
      const late = () => { console.warn(`film: clip ${id} did not play`); t = setTimeout(done, readMs(text) / SPEED); timers.add(t); };
      waits.add(done);
      voice.onended = done; voice.onerror = late;
      voice.src = `audio/en/${id}.mp3`;
      voice.play().catch(err => { if (err.name !== 'AbortError') late(); });
    });
  }
  // music: one track per era (window.MUSIC: [{ from: year, src }], looping), crossfaded when the year crosses into another;
  // quiet under the narration (ducked while a clip plays), through Web Audio where it can (an iPhone ignores an audio element's volume)
  const bgm = $('#bgm'), eras = (window.MUSIC || []).slice().sort((a, b) => a.from - b.from);
  const BGM = +(params.get('bgm') ?? .45), DUCK = .3, FADE = 1.2;   // ?bgm= to set the level by ear
  let musicOn = true, actx = null, gain = null, fading = 0, swapT = 0;
  bgm.loop = true;
  const eraFor = y => eras.filter(e => e.from <= y).pop() || eras[0];
  function level() {
    const v = fading ? 0 : BGM * (!voice.paused && !voice.ended ? DUCK : 1);
    if (gain) gain.gain.setTargetAtTime(v, actx.currentTime, fading ? FADE / 4 : .25); else bgm.volume = Math.min(1, v);
  }
  for (const ev of ['play', 'pause', 'ended']) voice.addEventListener(ev, level);
  function startMusic() {   // on the first click: browsers start sound only after one
    if (!eras.length) return;
    if (!actx) {
      try { actx = new AudioContext(); gain = actx.createGain(); actx.createMediaElementSource(bgm).connect(gain).connect(actx.destination); }
      catch (err) { console.warn('music: no Web Audio, the volume steps instead', err); actx = gain = null; }
      level();
    }
    actx?.resume();
    if (!bgm.getAttribute('src')) bgm.src = eraFor(year).src;
    if (musicOn && bgm.paused) bgm.play().catch(() => {});
  }
  // a new era: fade the old track out, start the new one from its beginning, fade it in
  document.addEventListener('year', e => {
    const want = eraFor(e.detail)?.src;
    if (!want || !bgm.getAttribute('src') || bgm.getAttribute('src') === want) return;
    clearTimeout(swapT); fading = 1; level();
    swapT = setTimeout(() => {
      bgm.src = eraFor(year).src; fading = 0; level();
      if (musicOn) bgm.play().catch(() => {});
    }, gain && !reduced ? FADE * 1000 : 0);
  });
  $('#music').addEventListener('click', e => {
    e.stopPropagation(); musicOn = !musicOn; e.currentTarget.setAttribute('aria-pressed', musicOn);
    if (musicOn) startMusic(); else bgm.pause();
  });

  /* ---------- the film: a new year plays its events on the map, then the four walk on ---------- */
  // what a picture is, where it is not a photograph of the moment
  const PIC_NOTES = { 'img/journey.jpg': 'illustration published in 1869' };
  const pinList = [];   // { g, at, label, region }
  // an event's pin: drops at its place, the name beside it
  function pin(ev, k) {
    const [name, lon, lat] = ev.at, at = xy(lon, lat);
    const g = el('g', { class: 'pin' }, pinsG), d = el('g', { class: 'drop' }, g);
    el('circle', { class: 'pulse', r: 8 }, d); el('circle', { class: 'dot', r: 6.5 }, d);
    const p = { g, at, label: makeLabel('pinname', name, at) };
    pinList.push(p);
    return p;
  }
  function clearPins(fade) {
    for (const p of pinList.splice(0)) {
      if (labels.includes(p.label)) dropLabel(p.label);
      p.g.classList.add('gone');
      if (fade && !reduced) later(() => p.g.remove(), 700); else p.g.remove();
    }
    for (const L of [...labels].filter(L => L.cls === 'region')) dropLabel(L);
    for (const g of glowG.children) g.classList.remove('on');
  }
  function showEvent(y, i, e, side) {
    const fig = evCard.querySelector('figure'), img = fig.querySelector('img');
    evCard.className = `card ${side}`;
    evCard.querySelector('h2').textContent = e.title;
    fig.hidden = e.pic === false;
    if (!fig.hidden) { img.onerror = () => { console.error(`events: no ${e.pic}`); fig.hidden = true; }; img.src = e.pic; }
    fig.querySelector('figcaption').textContent = (e.caption || `${e.at[0]}, ${y}${PIC_NOTES[e.pic] ? ' · ' + PIC_NOTES[e.pic] : ''}`).replace(/–/g, '\u2060–\u2060');   // no line break inside a year range
    evCard.querySelector('.text').textContent = e.text;
  }
  // on a phone: fill the card unseen and measure it, so the camera can leave the place clear above the sheet
  async function sheetFor(y, i, e, side) {
    showEvent(y, i, e, side);
    if (e.pic) await evCard.querySelector('img').decode().catch(() => {});   // the picture's own height counts
    evCard.style.animation = 'none'; evCard.style.visibility = 'hidden'; evCard.hidden = false;
    const r = evCard.getBoundingClientRect();
    evCard.hidden = true; evCard.style.animation = evCard.style.visibility = '';
    return Math.ceil(r.height + (H() - r.bottom));
  }
  async function playYear(y) {
    const run = film = { y, skip: false, ep: epoch };
    const live = () => film === run;
    document.body.classList.add('film'); document.body.classList.remove('moves');
    $('#filmbar').hidden = false; $('#replay').hidden = true;
    clearPins(false); trails.replaceChildren();
    const yr = $('#year'); yr.classList.remove('pop'); void yr.offsetWidth; yr.classList.add('pop');
    layout();
    await hold(700);   // the four fade out
    const evs = EVENTS[y];
    for (let i = 0; i < evs.length && live() && !run.skip; i++) {
      const e = evs[i], spot = xy(e.at[1], e.at[2]);
      // the card goes on the side of the screen away from the place; on a phone it goes underneath
      let side = narrow() ? 'bottom' : (spot[0] - home[0]) / home[2] > .5 ? 'left' : 'right';
      if (side === 'bottom') sheetH = await sheetFor(y, i, e, side);
      await cam(viewFor([spot], side, e.state ? 1500 : 430), 1300);   // a map change is shown wide, so it can be seen
      if (!live() || run.skip) break;
      if (e.state) setState(e.state, true);
      const p = pin(e);
      const gl = e.glow && glow(e.glow, true);
      if (gl) makeLabel('region', e.glow, toKm(gl.c));
      showEvent(y, i, e, side); evCard.hidden = false; evCard.scrollTop = 0;
      layout();
      await hold(300);
      await narrate(`${y}-e${i + 1}`, e.text);
      await hold(700);
      if (!live()) return;
      evCard.hidden = true;
      for (const L of labels.filter(L => L.cls === 'region')) dropLabel(L);
      if (gl) glow(e.glow, false);
      p.g.classList.add('past'); dropLabel(p.label);
    }
    if (!live()) return;
    await moves(run);
    if (live()) endFilm();
  }

  // the four come back; each who travels this year walks it in a close-up the camera follows, one after another
  async function moves(run) {
    const y = run.y, live = () => film === run;
    evCard.hidden = true;
    clearPins(true);
    document.body.classList.replace('film', 'moves');
    setState(stateEnd(y), true);
    await cam(home, 1100);
    if (!live()) return;
    standAt(y - 1);
    const off0 = Object.fromEntries(WHO.map(w => [w, F[w].off])), off1 = fanOffsets(y);
    drawTrails(y, false);
    layout();
    const movers = WHO.filter(w => total(routeOf(y, w)) > 1);
    await hold(800);
    for (const w of movers) {
      if (!live() || run.skip) break;
      for (const v of WHO) F[v].g.classList.toggle('aside', v !== w);   // the others step back while one walks
      const cap = $('#move');
      cap.style.setProperty('--c', PEOPLE[w].color);
      cap.querySelector('b').textContent = PEOPLE[w].short;
      cap.querySelector('span').textContent = [where[y - 1][w], ...YEARS[y][w].route].filter((k, i, a) => i === 0 || k !== a[i - 1]).map(k => P[k].name).join(' → ');  
      cap.hidden = false;
      await walkFigs([{ w, pts: routeOf(y, w), off0: off0[w], off1: off1[w], fwd: true }], true);
      cap.hidden = true;
      await hold(300);
    }
    for (const v of WHO) F[v].g.classList.remove('aside');
    if (!live()) return;
    $('#move').hidden = true;
    standAt(y); fullTrails(y);   // anyone who did not walk (or the year was skipped) stands where the year ends
  }
  // the film ends: the camera back on the whole map; the four can be clicked
  function endFilm() {
    const run = film;
    clearFilmUi(true);
    film = null;
    zoomed = false;
    const to = cam(home, reduced || run.skip ? 0 : 1100);
    $('#replay').hidden = false;
    to.then(() => { layout(); });
  }
  // everything the film put on screen goes; the caller says what the four do next
  function clearFilmUi(fade) {
    evCard.hidden = true; $('#filmbar').hidden = true; $('#move').hidden = true;
    document.body.classList.remove('film', 'moves');
    for (const v of WHO) F[v].g.classList.remove('aside');
    clearPins(fade);
    for (const g of glowG.children) g.classList.remove('on');
  }
  // stop whatever is playing, at once: nothing is left waiting, no clip playing, and the camera stays where it is
  function stopAll() {
    epoch++; camRun++; wake(); cancelAll(); walking = false; zoomed = false;
    film = null; stopVoice();
    commitBorders();
    clearFilmUi(false);
    svg.classList.remove('cam', 'lite');
  }
  const nextStep = () => { if (film) { voice.pause(); wake(); } };   // a click in the film: on to the next card, or the next walker
  function skip() { if (film) { film.skip = true; voice.pause(); wake(); } }
  evCard.addEventListener('click', nextStep);
  $('#skip').addEventListener('click', e => { e.stopPropagation(); skip(); });

  /* ---------- moving through the years ---------- */
  let year = FIRST, begun = false;
  function begin() {
    if (begun) return false;
    begun = true; $('#intro').hidden = true; startMusic(); layout();
    svg.focus({ preventScroll: true });   // arrows and Tab work from here; nothing is ringed
    return true;
  }
  // the scene as the end of `from` left it, before anything plays
  function resetScene(from, to) {
    stopAll();
    closeCards(false);
    clearPins(false); trails.replaceChildren();
    for (const w of WHO) { F[w].g.classList.add('idle'); F[w].g.classList.remove('aside'); }
    setView(home);
  }
  function go(d) {
    const to = year + d;
    if (!begun || to < FIRST || to > LAST) return;
    const from = year;
    resetScene(from, to);
    showYear(to);
    $('#replay').hidden = true;
    if (d > 0) { standAt(from); setState(stateEnd(from), false); playYear(to); }
    else backTo(from, to);
  }
  // going back: the map state returns, and the four walk back along the year they leave
  async function backTo(from, to) {
    const ep = epoch;
    standAt(from); setState(stateEnd(to), true);
    fullTrails(from, true); layout();
    const off1 = fanOffsets(to), items = WHO.filter(w => total(routeOf(from, w)) > 1)
      .map(w => ({ w, pts: routeOf(from, w).slice().reverse(), out: routeOf(from, w), off0: F[w].off, off1: off1[w], fwd: false }));
    if (items.length) await walkFigs(items, false);
    if (ep !== epoch) return;
    standAt(to); fullTrails(to, false); layout();
    $('#replay').hidden = false;
  }
  function replay() {
    if (!begun) return;
    const y = year;
    resetScene(y - 1, y);
    showYear(y); standAt(y - 1); setState(stateEnd(y - 1), false); playYear(y);
  }
  $('#begin').addEventListener('click', e => { e.stopPropagation(); begin(); replay(); });
  $('#replay').addEventListener('click', e => { e.stopPropagation(); replay(); });
  $('#prev').addEventListener('click', e => { e.stopPropagation(); go(-1); });
  $('#next').addEventListener('click', e => { e.stopPropagation(); go(1); });
  svg.addEventListener('click', e => {
    if (film) return nextStep();
    if (openDialog()) closeCards();
  });
  document.addEventListener('keydown', e => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    const dlg = openDialog() || (!$('#intro').hidden && $('#intro'));
    if (e.key === 'Tab' && dlg) {   // focus stays inside an open card
      const f = [...dlg.querySelectorAll('button, a[href]')].filter(x => !x.disabled && x.offsetParent);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    } else if (e.key === 'Escape') { if (openDialog()) closeCards(); else if (film) skip(); }
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (film && (e.key === ' ' || e.key === 'Enter') && !e.target.closest?.('button')) { e.preventDefault(); nextStep(); }
  });
  // a north mark, drawn only when the map is turned
  if (ROT) {
    const n = $('#north'); n.removeAttribute('hidden');
    n.firstChild.setAttribute('transform', `rotate(${ROT * 180 / Math.PI})`);
    const t = n.querySelector('text'); t.setAttribute('x', 20 * SIN); t.setAttribute('y', -20 * COS + 4);
  }
  // turning the phone changes the map's own rotation, which is fixed at load: start over, as a fresh visit
  addEventListener('resize', () => { if (!params.has('rot') && PORTRAIT !== (innerWidth <= 700 && innerHeight > 520)) location.reload(); else fit(); });
  document.fonts?.ready.then(() => { labels.forEach(measure); fit(); });

  /* ---------- start: 1868 under the title sheet, the film waiting for Begin ---------- */
  $('#intro-h').textContent = INTRO.title; $('#intro .sub').textContent = INTRO.sub; $('#intro .text').textContent = INTRO.text;
  $('#title').firstChild.textContent = INTRO.title + ' '; $('#title span').textContent = INTRO.sub;
  for (const list of Object.values(EVENTS)) for (const e of list) if (e.pic) new Image().src = e.pic;   // card pictures ready before their turn
  setState(STATES[0].id, false);
  showYear(FIRST);
  fit();
  standAt(FIRST - 1);
  $('#begin').disabled = false; $('#begin').focus();
  document.body.classList.add('ready');
  // for the checks: the engine's hands and a count of what is still waiting
  window.MAP = {
    go, skip, replay, next: nextStep, begin, setState, openPerson, cam, viewFor, xy, F, P, where, view: () => view, home: () => home,
    get year() { return year; }, get film() { return film; }, get walking() { return walking; }, get state() { return stateId; },
    pending: () => ({ timers: timers.size, frames: frames.size, waits: waits.size, audio: !voice.paused }),
  };
})();
