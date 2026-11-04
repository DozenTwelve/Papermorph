/* film.js — the documentary kit: found pictures, line drawings, words and maps on the engine's beat clock.
   This is the book's own copy: its look is set in lib/book.css (colours) and lib/fonts.css; add the film's recurring
   pieces at the end. Every helper is a pure function of the beat clock, so pause, seek, ?beat=N&t=S and export.py agree.
   Pictures are img/<name>.webp with their sizes in ART (img/art.js, from prep.py); traced drawings are LINES (lib/lines.js,
   from trace.py); clips are FRAMES (img/frames.js, from frames.py). The fonts must be loaded before boot(): words are
   measured on a canvas (chapter.html does this). */
'use strict';
/* ---------- the look ---------- */
const KEY = '"Oswald", "Arial Narrow", sans-serif', SER = '"EB Garamond", Georgia, serif';   // titles and key words; quotes and captions
// colours from lib/book.css (read by the engine into COL, or with bookSetting): ink on the ground, the accent, captions,
// a document's paper, ink on paper, a document's heading
const CREAM = COL.chalk, SOFT = COL.dim, HOT = bookSetting('--accent') || '#f08a4b', PAPER = bookSetting('--paper') || CREAM,
  INK = bookSetting('--paper-ink') || '#3a2a24', STAMP = bookSetting('--stamp') || '#7a1a20';

// a picture from img/: centred on (x, y), h or w in stage px; `at` makes it enter (from offset dx, dy) at that time
function pic(p, name, { x = 800, y = 450, h = 600, w, r = 0, s = 1, at, from = [0, 40], dur = .9, o = 1, back = false } = {}) {
  const sz = ART[name];
  const g = G(p, at === undefined ? { x, y, r, s, o } : { x: x + from[0], y: y + from[1], r, s, o: 0 });
  const k = w ? w / sz[0] : h / sz[1], W = sz[0] * k, H = sz[1] * k;
  if (back) mk('rect', { x: -W / 2 + 4, y: -H / 2 + 4, width: W - 8, height: H - 8, fill: COL.board }, g);   // a solid line drawing (a door)
  mk('image', { href: `../img/${name}.webp`, x: -W / 2, y: -H / 2, width: W, height: H }, g);
  g._w = W; g._h = H; g._x = x; g._y = y;
  if (at !== undefined) tw(g, { x, y, o }, at, dur, out);
  return g;
}
const leave = (g, t0, dx = 0, dy = 0, dur = .7) => tw(g, { x: g._x + dx, y: g._y + dy, o: 0 }, t0, dur, io);
const push = (g, t0, t1, s1 = 1.06, dx = 0, dy = 0) => tw(g, { s: s1, x: g._x + dx, y: g._y + dy }, t0, t1 - t0, lin);   // slow Ken Burns
// one picture turning into another in place (a figure changing era)
const dissolve = (a, b, t0, dur = 1.2) => { hide(a, t0, dur, lin); show(b, t0, dur, lin); };

// a line drawing traced into strokes (LINES[name] from trace.py): drawn on stroke by stroke over `draw` s, or shown whole
function traced(p, name, { x = 800, y = 450, h = 600, at = 0, draw: dd = 0, o = 1, flip = false } = {}) {
  const L = LINES[name], [x0, y0, x1, y1] = L.box, k = h / (y1 - y0);
  const g = G(p, { x, y, o: dd ? 1 : 0 });
  const inner = mk('g', { transform: `scale(${flip ? -k : k},${k}) translate(${-(x0 + x1) / 2},${-(y0 + y1) / 2})` }, g);
  const total = L.l.reduce((a, b) => a + b, 0);
  let acc = 0;
  L.p.forEach((d, i) => {
    const e = path(inner, d, { stroke: CREAM, 'stroke-width': 2.4 / k }, dd ? { d: 0 } : {});
    if (dd) { draw(e, at + dd * acc / total, Math.max(.04, dd * L.l[i] / total), lin); acc += L.l[i]; }
  });
  if (!dd) tw(g, { o }, at, .6);
  g._x = x; g._y = y; g._h = h;
  return g;
}
// words in a font measured on a canvas (fonts are loaded before boot)
const CTX = document.createElement('canvas').getContext('2d');
const wid = (str, size, font, style = '', weight = 400) => { CTX.font = `${style} ${weight} ${size}px ${font}`; return CTX.measureText(str).width; };

// big condensed word(s)
function key(p, str, x, y, t0, { size = 96, fill = CREAM, anchor = 'middle', from = 24, o = 1 } = {}) {
  const e = T(p, str.toUpperCase(), { x, y: y + from, size, fill, font: KEY, weight: 600, anchor, o: 0 });
  e.setAttribute('letter-spacing', '.02em');
  e._w = wid(str.toUpperCase(), size, KEY, '', 600) * 1.02;
  tw(e, { y, o }, t0, .55, out);
  return e;
}
// a line struck through a key word (the word's own width)
function strike(p, e, x, y, t0, size, anchor = 'middle') {
  const x0 = anchor === 'middle' ? x - e._w / 2 : anchor === 'end' ? x - e._w : x;
  return line(p, `M${x0 - 16} ${y - size * .32}H${x0 + e._w + 16}`, t0, .4, Math.max(5, size / 12), { stroke: HOT });
}
// serif lines typed word by word between t0 and t1 (Chinese, Japanese and Korean characters one by one)
const CJK = /[⺀-鿿가-힯豈-﫿＀-￯]|[^⺀-鿿가-힯豈-﫿＀-￯]+/g;
function say(p, lines, x, y, t0, t1, { size = 44, fill = CREAM, italic = true, anchor = 'start', lh = 1.3, weight = 400 } = {}) {
  const g = G(p, {}), style = italic ? 'italic' : '', words = [];
  const sp = wid(' ', size, SER, style, weight);
  lines.forEach((ln, i) => {
    const W = wid(ln, size, SER, style, weight);
    let cx = anchor === 'middle' ? x - W / 2 : anchor === 'end' ? x - W : x;
    ln.split(' ').forEach(word => (word.match(CJK) || ['']).forEach((w, j, ws) => {
      const e = T(g, w, { x: cx, y: y + i * size * lh, size, fill, font: SER, weight, o: 0 });
      if (italic) e.setAttribute('font-style', 'italic');
      words.push(e); cx += wid(w, size, SER, style, weight) + (j === ws.length - 1 ? sp : 0);
    }));
  });
  const chars = words.map(e => e.textContent.length + 1), all = chars.reduce((a, b) => a + b, 0);
  let acc = 0;
  words.forEach((e, i) => { show(e, t1 === t0 ? t0 : t0 + (t1 - t0) * acc / all, .25, lin); acc += chars[i]; });
  return g;
}
// a small caption under a picture (a credit or a name tag)
function tag(p, str, x, y, t0, { size = 24, anchor = 'start', fill = SOFT } = {}) {
  const e = T(p, str, { x, y, size, fill, font: SER, anchor, o: 0 });
  e.setAttribute('font-style', 'italic');
  show(e, t0, .5);
  return e;
}
// the era at the top left, like a chapter opener: the year in italic, a hairline, the place or topic in spaced capitals
function dateChip(p, year, topic, t0 = .2) {
  const g = G(p, { x: 80, y: 112, o: 0 });
  T(g, year, { size: 72, font: SER, weight: 400, fill: HOT }).setAttribute('font-style', 'italic');
  const tw_ = wid(topic.toUpperCase(), 26, SER) * 1.3 + 8;   // letter-spacing .28em widens the caps by about 30 %
  const rule = path(g, `M3 22H${Math.max(220, tw_)}`, { stroke: CREAM, 'stroke-width': 1.4, opacity: .7 }, { d: 0 });
  T(g, topic.toUpperCase(), { x: 3, y: 58, size: 26, font: SER, weight: 400, fill: CREAM }).setAttribute('letter-spacing', '.28em');
  tw(g, { o: 1 }, t0, .6); draw(rule, t0 + .2, .6);
  return g;
}
// cream line, drawn on
const line = (p, d, t0, dur = .8, w = 3, extra = {}) => { const e = path(p, d, { stroke: CREAM, 'stroke-width': w, ...extra }, { d: 0 }); draw(e, t0, dur); return e; };
// wavy water lines that flow forever (pure function of the beat clock); amp may be a function of t
function water(p, y0, D, { rows = 3, amp = 8, len = 1700, x0 = -50, gap = 26, o = .75 } = {}) {
  const g = G(p, { o: 0 }); tw(g, { o }, 0, .6);
  const ps = [...Array(rows)].map((_, i) => path(g, '', { stroke: CREAM, 'stroke-width': 2.2, opacity: 1 - i * .25 }));
  clockRun(t => { const a = typeof amp === 'function' ? amp(t) : amp; ps.forEach((e, i) => {
    let d = ''; for (let x = 0; x <= len; x += 20) d += `${x ? 'L' : 'M'}${x0 + x} ${(y0 + i * gap * (a / 8) ** .5 + a * Math.sin(x / 70 + t * 1.6 + i)).toFixed(1)}`;
    e.setAttribute('d', d);
  }); }, D, { tail: true });
  return g;
}
// something that bobs on the water (a boat); x may follow a function of t
const bob = (g, D, a = 6, xf) => clockRun(t => put(g, { y: g._y + a * Math.sin(t * 1.6), r: 1.5 * Math.sin(t * 1.1), ...(xf ? { x: xf(t) } : {}) }), D, { tail: true });
const span01 = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const smooth01 = q => q * q * (3 - 2 * q);
// a speech balloon, cream outline, its tail to (tx, ty)
function balloon(p, x, y, w, h, tx, ty, t0) {
  const bx = Math.min(Math.max(tx, x + 60), x + w - 100);
  const d = `M${x + 30} ${y}H${x + w - 30}Q${x + w} ${y} ${x + w} ${y + 30}V${y + h - 30}Q${x + w} ${y + h} ${x + w - 30} ${y + h}H${bx + 40}L${tx} ${ty}L${bx} ${y + h}H${x + 30}Q${x} ${y + h} ${x} ${y + h - 30}V${y + 30}Q${x} ${y} ${x + 30} ${y}Z`;
  return line(p, d, t0, .7, 3);
}
// a field of dots: positions from a fixed seed so every replay is the same
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function dots(p, n, box, r, seed, fill = CREAM) {
  const R = rng(seed), g = G(p, {});
  return { g, el: [...Array(n)].map(() => mk('circle', { cx: box[0] + R() * box[2], cy: box[1] + R() * box[3], r, fill }, g)).map(e => put(e, { o: 0 })) };
}
// close-ups inside a print as their words are spoken: shots [[mark, fx, fy, label, zoom]], fx/fy the point in the picture
// (0..1 of the picture inside its border); the view never leaves the picture; a band names each one; back to the whole after
function closeups(p, g, name, shots, m, tBack, home) {
  const [W, H] = ART[name], k = g._w / W, iw = (W - 112) * k, ih = (H - 112) * k;   // a print's picture sits 56 px in
  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));
  shots.forEach(([mark, fx, fy, label, Z = 3], i) => {
    const dx = clamp((fx - .5) * iw, iw / 2 - 800 / Z), dy = clamp((fy - .5) * ih, ih / 2 - 450 / Z), t0 = m(mark) - .15;
    tw(g, { s: Z, x: 800 - Z * dx, y: 450 - Z * dy, r: 0 }, t0, .35, out);
    const l = G(p, { x: 800, y: fy > .7 ? 130 : 820, o: 0 }), lw = wid(label.toUpperCase(), 72, KEY, '', 600) + 70;   // clear of a low subject
    mk('rect', { x: -lw / 2, y: -68, width: lw, height: 92, fill: COL.board }, l);
    T(l, label.toUpperCase(), { y: 0, size: 72, font: KEY, weight: 600, fill: CREAM, anchor: 'middle' });
    show(l, t0, .12);
    hide(l, i < shots.length - 1 ? m(shots[i + 1][0]) - .15 : tBack, .15);
  });
  if (home) tw(g, { s: 1, ...home }, tBack, .8, soft);   // no home: stay on the last close-up
}
// a generated clip as cream-line frames on one sprite sheet (frames.py), played on the beat clock from t0:
// the frame is a pure function of the time, so pausing, seeking and the export all show the same picture
function anim(p, name, { x = 800, y = 450, size = 600, at = 0, t0 = at, D, o = 1 } = {}) {
  const F = FRAMES[name], rows = Math.ceil(F.n / F.cols);
  const g = G(p, { x, y, o: 0 });
  const v = mk('svg', { x: -size / 2, y: -size / 2, width: size, height: size, viewBox: `0 0 ${F.fw} ${F.fh}` }, g);
  mk('image', { href: `../img/${name}-sheet.webp`, width: F.cols * F.fw, height: rows * F.fh }, v);
  let last = -1;
  clockRun(t => {
    const f = Math.max(0, Math.min(F.n - 1, Math.floor((t - t0) * F.fps)));
    if (f !== last) { last = f; v.setAttribute('viewBox', `${(f % F.cols) * F.fw} ${Math.floor(f / F.cols) * F.fh} ${F.fw} ${F.fh}`); }
  }, D, { tail: true });
  tw(g, { o }, at, .8);
  return g;
}
// an old document: paper, lines of ink, a label
function doc(p, label, x, y, r, t0, seed) {
  const R = rng(seed), g = G(p, { x: x - 700, y, r, o: 0 });
  mk('rect', { x: -150, y: -200, width: 300, height: 400, fill: PAPER, stroke: '#cdbfa6' }, g);
  for (let i = 0; i < 13; i++) {
    const yy = -130 + i * 24, ww = 160 + R() * 70;
    path(g, `M-118 ${yy}q${ww / 4} ${-3 + R() * 6} ${ww / 2} 0t${ww / 2} 0`, { stroke: INK, 'stroke-width': 2, opacity: .7 });
  }
  T(g, label.toUpperCase(), { y: -160, size: 22, font: KEY, weight: 600, fill: STAMP, anchor: 'middle' }).setAttribute('letter-spacing', '.06em');
  tw(g, { x, o: 1 }, t0, .8, out);
  g._x = x; g._y = y;
  return g;
}
// a point moving along a polyline [[x, y], …] as q goes 0..1
function along(pts, q) {
  const seg = pts.slice(1).map((b, i) => Math.hypot(b[0] - pts[i][0], b[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0);
  let d = q * L, i = 0;
  while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
  const f = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

// a picture with its credit or name under it, and a quote typed beside it (an epigraph): portrait left, the quote large
function epigraph(p, name, who, lines, tin, tq, tq1, tout) {
  const g = G(p, {});
  pic(g, name, { x: 330, y: 430, h: 440, r: -2, at: tin, from: [-500, 0] });
  tag(g, who, 330, 690, tin + .5, { anchor: 'middle', size: 30, fill: CREAM });
  say(g, lines, 620, 330, tq, tq1, { size: 62 });
  if (tout !== undefined) tw(g, { x: -200, o: 0 }, tout, .7, io);
  return g;
}

/* ---------- this film's own pieces ---------- */

// Tulip Mania's maps. The kit's data are today's coast; Holland in the 1630s had the Zuiderzee open to the sea (the
// polders of Flevoland and the Wieringermeer are 20th-century) and the Haarlem lake not yet drained (1849), so both are
// painted back in sea over the modern land. Rough outlines from 17th-century maps, good at Holland's scale.
const ZUIDERZEE = [[4.98, 52.96], [4.95, 52.86], [5.04, 52.80], [5.10, 52.77], [5.29, 52.70], [5.10, 52.66], [5.06, 52.64],
  [5.07, 52.55], [5.05, 52.51], [5.04, 52.46], [4.95, 52.40], [5.07, 52.33], [5.24, 52.30], [5.45, 52.29], [5.62, 52.35],
  [5.83, 52.45], [5.91, 52.56], [5.95, 52.68], [5.96, 52.73], [5.71, 52.84], [5.36, 52.88], [5.44, 52.98], [5.40, 53.05],
  [5.39, 53.10], [5.10, 53.05]];
const HAARLEMMERMEER = [[4.64, 52.35], [4.70, 52.345], [4.79, 52.32], [4.80, 52.27], [4.72, 52.21], [4.60, 52.22],
  [4.58, 52.26], [4.61, 52.31]];
const TOWNS = ['Haarlem', 'Amsterdam', 'Leiden', 'Alkmaar', 'Utrecht'];
// paperMap with the 1630s waters and the film's ground around the disc
function oldMap(p, D, view, opts = {}) {
  const old = [[[ZUIDERZEE], () => 1, { fill: MAP_COL.sea, line: null }], [[HAARLEMMERMEER], () => 1, { fill: MAP_COL.sea, line: null }]];
  return paperMap(p, D, view, { bg: COL.board, detail: 'Holland', ...opts, areas: [...old, ...(opts.areas || [])] });
}
// a key word on a ground-coloured band, readable over a map; returns the group (fade it with hide)
function band(p, str, x, y, t0, { size = 72, fill = CREAM, anchor = 'middle', sub } = {}) {
  const w = Math.max(wid(str.toUpperCase(), size, KEY, '', 600) * 1.02, sub ? wid(sub, size * .4, SER, 'italic') : 0) + size * .9, g = G(p, { x, y, o: 0 });
  const x0 = anchor === 'middle' ? -w / 2 : anchor === 'end' ? -w : 0;
  mk('rect', { x: x0, y: -size * 1.02, width: w, height: size * 1.32 + (sub ? size * .62 : 0), fill: COL.board, opacity: .94 }, g);
  const e = T(g, str.toUpperCase(), { x: x0 + w / 2, y: 0, size, fill, font: KEY, weight: 600, anchor: 'middle' });
  e.setAttribute('letter-spacing', '.02em');
  if (sub) { const s = T(g, sub, { x: x0 + w / 2, y: size * .66, size: size * .4, fill: SOFT, font: SER, anchor: 'middle' }); s.setAttribute('font-style', 'italic'); }
  g._w = w; tw(g, { o: 1 }, t0, .35, out);
  return g;
}
// a caption in map ink, for a picture laid on a map (the kit's cream tag() vanishes on the paper); hidden with its picture
const mtag = (p, str, x, y, t0, t1, opts = {}) => { const e = tag(p, str, x, y, t0, { anchor: 'middle', size: 26, fill: MAP_COL.ink, ...opts }); if (t1 !== undefined) hide(e, t1, .4); return e; };
// own red marks on a map that can grey later: one circle per town, following the map's view, popping in at times[i]
function townDots(p, M, names, times, D, r = 11) {
  const cs = names.map((n, i) => { const c = mk('circle', { cx: 0, cy: 0, r, fill: MAP_COL.hot, stroke: MAP_COL.land, 'stroke-width': 3 }, p);
    put(c, { x: -99, y: -99, s: 0, o: 1 }); tw(c, { s: 1 }, times[i], .35, back); return c; });
  clockRun(t => names.forEach((n, i) => { const q = M.xy(CITIES[n], t) || [-99, -99]; put(cs[i], { x: q[0], y: q[1] }); }), D, { tail: true });
  return cs;
}
// a route in ink, for what is not the tulip trade (grain, spices, a court's referral, the story): the kit's routes
// are always red. pts is [[lon, lat]...], drawn on through a curve between t0 and t0 + dur, following the map's view
function inkRoute(p, M, pts, t0, dur, D, { width = 3.5, dash = '10 8', o = .9 } = {}) {
  const e = path(p, '', { stroke: MAP_COL.ink, 'stroke-width': width, 'stroke-dasharray': dash, 'stroke-linecap': 'round', opacity: o });
  let last = '';
  clockRun(t => {
    const q = Math.min(1, Math.max(0, (t - t0) / dur)), P = pts.map(ll => M.xy(ll, t));
    if (!q || P.some(x => !x)) { if (last) e.setAttribute('d', last = ''); return; }
    // a gentle arc through each leg, sampled; the first q of the whole length is drawn
    const S = [];
    P.slice(1).forEach((B, i) => { const A = P[i], lift = Math.hypot(B[0] - A[0], B[1] - A[1]) * (pts.length > 2 ? .08 : .2), mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - lift;
      for (let j = i ? 1 : 0; j <= 16; j++) { const u = j / 16; S.push([(1 - u) ** 2 * A[0] + 2 * u * (1 - u) * mx + u * u * B[0], (1 - u) ** 2 * A[1] + 2 * u * (1 - u) * my + u * u * B[1]]); } });
    const n = Math.max(2, Math.round(q * S.length)), d = 'M' + S.slice(0, n).map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join('L');
    if (d !== last) e.setAttribute('d', last = d);
  }, D, { tail: true });
  return e;
}
// the era on a ground-coloured card, so it reads over a map: the year in italic, the place or span under it
function mapChip(p, year, topic, t0) {
  const tw_ = Math.max(wid(year, 64, SER, 'italic'), wid(topic.toUpperCase(), 30, SER) * 1.2) + 56;
  const g = G(p, { x: 56, y: 30, o: 0 });
  mk('rect', { x: 0, y: 0, width: tw_, height: 132, fill: COL.board, opacity: .94 }, g);
  T(g, year, { x: 26, y: 64, size: 64, font: SER, fill: HOT }).setAttribute('font-style', 'italic');
  T(g, topic.toUpperCase(), { x: 28, y: 110, size: 30, font: SER, fill: CREAM }).setAttribute('letter-spacing', '.16em');
  tw(g, { o: 1 }, t0, .6);
  return g;
}
// town labels of our own, like the kit's but with an end: [[name, t0, t1, side]], following the map's view
function mapLabels(p, M, list, D, size = 36) {
  const L = list.map(([n, t0, t1, side = 'r']) => {
    const e = T(p, n.toUpperCase(), { x: 0, y: 0, size, fill: MAP_COL.ink, font: KEY, weight: 600, anchor: side === 'l' ? 'end' : 'start' });
    e.setAttribute('stroke', MAP_COL.land); e.setAttribute('stroke-width', size / 5); e.setAttribute('paint-order', 'stroke'); e.setAttribute('stroke-linejoin', 'round');
    const d = mk('circle', { cx: 0, cy: 0, r: 5, fill: MAP_COL.ink }, p);
    [e, d].forEach(x => { put(x, { x: -999, y: -999, o: 0 }); show(x, t0, .3); if (t1 !== undefined) hide(x, t1, .4); });
    return { n, e, d, side };
  });
  clockRun(t => L.forEach(({ n, e, d, side }) => { const q = M.xy(CITIES[n], t) || [-999, -999];
    put(d, { x: q[0], y: q[1] }); put(e, { x: q[0] + (side === 'l' ? -14 : 14), y: q[1] + size * .3 }); }), D, { tail: true });
  return L;
}
