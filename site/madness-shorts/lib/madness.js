/* madness.js: Madness and Civilization's own pieces for the upright films, loaded after shorts.js (with lines.js and
   europe.js from the documentary's lib). Pure functions of the beat clock, like the kit. */
'use strict';

// the board's burgundy (lib/book.css --board), which the chapters draw with
const BURG = '#5a0e16';

// a Foucault line drawing (LINES from the documentary's trace.py), drawn on stroke by stroke over `draw` s
function traced(p, name, { x = CX, y = 800, h = 600, at = 0, draw: dd = 1.5, colour = LIGHT } = {}) {
  const L = LINES[name], [x0, y0, x1, y1] = L.box, k = h / (y1 - y0);
  const g = G(p, { x, y });
  const inner = mk('g', { transform: `scale(${k}) translate(${-(x0 + x1) / 2},${-(y0 + y1) / 2})` }, g);
  const total = L.l.reduce((a, b) => a + b, 0);
  let acc = 0;
  L.p.forEach((d, i) => {
    const e = path(inner, d, { stroke: colour, 'stroke-width': 3 / k }, { d: 0 });
    draw(e, at + dd * acc / total, Math.max(.04, dd * L.l[i] / total), lin); acc += L.l[i];
  });
  return g;
}

// Europe's coastline (Natural Earth) with the leper-house dots, w px wide, its top-left at (x, y); dots hidden
function europeMap(g, x, y, w, t0) {
  const [bx, by, bw, bh] = EUROPE.box, k = w / bw, m = G(g, { x: x - bx * k, y: y - by * k, s: k, o: 0 });
  const id = 'eu' + (++fxN), cp = mk('clipPath', { id }, mk('defs', {}, m));
  mk('rect', { x: bx, y: by, width: bw, height: bh }, cp);
  mk('path', { d: EUROPE.d, fill: 'none', stroke: LIGHT, 'stroke-width': 1.6 / k, 'stroke-opacity': .7, 'clip-path': `url(#${id})` }, m);
  const el = EUROPE.dots.map(([cx, cy]) => put(mk('circle', { cx, cy, r: 5 / k, fill: RED }, m), { o: 0 }));
  if (t0 <= .01) put(m, { o: 1 }); else show(m, t0, .4);
  return { g: m, el };
}

// the series card: four episodes, `n` (1-based) lit at tLit; the rest dim
const EPISODES = [['The ship', 'fool-boat'], ['Locked up', 'bars'], ['Liberation', 'chain'], ['The last voices', 'fool-vangogh']];
function seriesCard(s, t0, n, tLit) {
  word(s, 'Madness &', CX, 250, t0, { size: 96, fill: LIGHT });
  word(s, 'Civilization', CX, 360, t0 + .15, { size: 96, fill: LIGHT });
  T(s, 'AFTER MICHEL FOUCAULT, 1961', { x: CX, y: 430, size: 42, fill: MUTED, font: SANS, weight: 500, anchor: 'middle' });
  sfx(BEAT_ID, t0, 'thud', 1);
  const pos = [[250, 640], [650, 640], [250, 1040], [650, 1040]], sz = 340;
  const tiles = EPISODES.map(([title, img], i) => {
    const [x, y] = pos[i], c = G(s, { x, y, o: 0 });
    rect(c, -sz / 2, -sz / 2, sz, sz, { rx: 18, fill: DARK });
    const [iw, ih] = ART[img], k = Math.min((sz - 70) / iw, (sz - 110) / ih);
    mk('image', { href: `../img/${img}.webp`, x: -iw * k / 2, y: -ih * k / 2 - 18, width: iw * k, height: ih * k }, c);
    T(c, String(i + 1), { x: -sz / 2 + 22, y: -sz / 2 + 62, size: 56, fill: LIGHT, font: SANS, weight: 600 });
    T(c, title.toUpperCase(), { x: 0, y: sz / 2 - 22, size: 42, fill: LIGHT, font: SANS, weight: 600, anchor: 'middle' });
    tw(c, { o: 1 }, t0 + .3 + i * .12, .25);
    return c;
  });
  const [x, y] = pos[n - 1];
  const rim = put(rect(s, x - sz / 2 - 8, y - sz / 2 - 8, sz + 16, sz + 16, { rx: 24, fill: 'none', stroke: RED, 'stroke-width': 10 }), { o: 0 });
  show(rim, tLit, .15, lin); sfx(BEAT_ID, tLit, 'tick', 1.2);
  tiles.forEach((c, i) => { if (i !== n - 1) tw(c, { o: .3 }, tLit, .3); else tw(c, { s: 1.06 }, tLit, .25, back); });
  return tiles;
}

// a line through a word (`word()` returns it with _w); drawn left to right
function strike(g, e, x, y, t0, size, colour = RED) {
  const w = e._w + 20, l = path(g, `M${x - w / 2} ${y - size * .32}H${x + w / 2}`, { stroke: colour, 'stroke-width': size / 9, 'stroke-linecap': 'round' }, { d: 0 });
  draw(l, t0, .25, out);
  return l;
}

// a quote in the serif, centred lines, shown whole at t0
function quote(g, lines, y, t0, { size = 74, fill = LIGHT, lh = 1.2 } = {}) {
  const e = G(g, { o: 0, y: 20 });
  lines.forEach((l, i) => T(e, l, { x: CX, y: y + i * size * lh, size, fill, font: SERIF, weight: 400, anchor: 'middle' }).setAttribute('font-style', 'italic'));
  tw(e, { o: 1, y: 0 }, t0, .3, out);
  return e;
}
