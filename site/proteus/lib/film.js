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

/* ---------- Proteus: one cut-paper body that changes shape ----------
   Each shape is a polygon drawn around its feet (0, 0), resampled to the same number of points so any shape can melt
   into any other; between shapes the body turns to water (its own blue) and ripples. drawPro() is a pure function of
   the beat clock, so pause, seek and the export agree. */
const SHEET = '#fbf7ee', WATER = '#6fb3c8', DEEP = '#2b6f8f',
  RED = '#b5383c', BLUE = '#2b78a6', PURPLE = '#6a3f9c', BROWN = '#5b3c2d', OCHRE = '#d4952a', TEAL = '#2f8f7a', WOOD = '#8a6240';
const NPTS = 180;
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const tint = (a, b, q) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * q).toString(16).padStart(2, '0')).join('');
function resample(pts, n = NPTS) {
  let area = 0;
  pts.forEach(([x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]; area += x * v - u * y; });
  if (area < 0) pts = pts.slice().reverse();
  const L = [0];
  pts.forEach(([x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]; L.push(L[i] + Math.hypot(u - x, v - y)); });
  const out = [];
  for (let k = 0, j = 0; k < n; k++) {
    const d = L[pts.length] * k / n;
    while (L[j + 1] < d) j++;
    const [x, y] = pts[j], [u, v] = pts[(j + 1) % pts.length], q = (d - L[j]) / (L[j + 1] - L[j] || 1);
    out.push([x + (u - x) * q, y + (v - y) * q]);
  }
  const cx = out.reduce((s, p) => s + p[0], 0) / n;   // start every outline at its bottom middle, so shapes line up
  let best = 0;
  out.forEach(([x, y], i) => { if (Math.hypot(x - cx, y - 400) < Math.hypot(out[best][0] - cx, out[best][1] - 400)) best = i; });
  return out.slice(best).concat(out.slice(0, best));
}
// a serpent from its centre line: half-widths, spikes on the back every other point
function serpent(line, wid, head) {
  const top = [], bot = [];
  line.forEach(([x, y], i) => {
    const [a, b] = line[Math.max(0, i - 1)], [c, d] = line[Math.min(line.length - 1, i + 1)];
    const l = Math.hypot(c - a, d - b), nx = (d - b) / l, ny = -(c - a) / l, w = wid[i];
    top.push([x + nx * w, y + ny * w]);
    if (i % 2 && i < line.length - 1) top.push([x + nx * (w + 34), y + ny * (w + 34)]);
    bot.push([x - nx * w, y - ny * w]);
  });
  return [...top, ...head, ...bot.reverse()];
}
// the mane: rays round the head, long and short in turn, from angle a0 to a1 (degrees, clockwise on screen)
const mane = (cx, cy, a0, a1, n, r0, r1) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180, r = i % 2 ? r1 : r0;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});
const SHAPES = {
  page: { col: SHEET, x: 800, y: 790, s: 1, lines: 1, eyes: [],
    pts: [[-160, 0], [-160, -420], [160, -420], [160, 0]] },
  water: { col: WATER, x: 470, y: 760, s: 1, eyes: [[-30, -205], [28, -210]],
    pts: [[-175, 0], [-160, -70], [-120, -160], [-70, -240], [-15, -295], [40, -318], [95, -300], [128, -258], [122, -212],
      [92, -192], [64, -204], [74, -162], [115, -112], [155, -58], [180, 0]] },
  lion: { col: RED, x: 470, y: 760, s: 1, eyes: [[188, -228]],
    pts: [[-300, -205], [-286, -228], [-266, -208], [-240, -172], [-205, -158], [-120, -175], [-20, -182], [30, -188],
      ...mane(115, -212, 150, 330, 12, 92, 128), [215, -238], [244, -216], [238, -188], [205, -178],
      ...mane(115, -212, 40, 100, 4, 92, 120), [150, -110], [142, -60], [152, 0], [120, 0], [110, -70], [90, -70],
      [85, 0], [55, 0], [50, -95], [-40, -96], [-110, -100], [-115, 0], [-145, 0], [-150, -60], [-170, -60], [-180, 0],
      [-210, 0], [-216, -110], [-212, -148], [-242, -158], [-272, -192], [-294, -192]] },
  dragon: { col: BLUE, x: 1130, y: 760, s: 1, f: -1, eyes: [[186, -276]],
    pts: serpent([[-320, -14], [-260, -40], [-190, -66], [-120, -56], [-50, -30], [20, -40], [80, -96], [112, -170], [140, -236]],
      [3, 12, 22, 28, 30, 30, 28, 26, 24],
      [[118, -300], [146, -284], [176, -294], [238, -278], [252, -258], [214, -250], [240, -236], [192, -226]]) },
  leopard: { col: PURPLE, x: 470, y: 760, s: 1, eyes: [[244, -150]],
    pts: [[-330, -232], [-318, -252], [-298, -246], [-304, -222], [-288, -190], [-250, -152], [-200, -142], [-100, -152],
      [0, -152], [90, -146], [160, -152], [198, -168], [210, -194], [226, -172], [260, -162], [286, -140], [280, -120],
      [250, -110], [215, -106], [190, -92], [205, 0], [175, 0], [160, -60], [140, -60], [135, 0], [105, 0], [100, -80],
      [0, -76], [-100, -80], [-110, 0], [-140, 0], [-150, -55], [-170, -55], [-185, 0], [-215, 0], [-225, -90],
      [-240, -130], [-280, -178], [-300, -214], [-316, -236]] },
  boar: { col: OCHRE, x: 1130, y: 760, s: 1.05, f: -1, eyes: [[176, -152]],
    pts: [[-256, -136], [-240, -152], [-200, -170], [-160, -196], [-145, -212], [-120, -206], [-100, -226], [-75, -219],
      [-55, -242], [-30, -231], [-5, -247], [20, -229], [45, -236], [70, -211], [110, -192], [124, -218], [142, -186],
      [190, -152], [250, -112], [266, -104], [268, -70], [246, -64], [262, -40], [234, -52], [190, -70], [160, -60],
      [165, 0], [140, 0], [130, -45], [110, -45], [105, 0], [80, 0], [70, -60], [-60, -66], [-130, -70], [-140, 0],
      [-165, 0], [-172, -40], [-190, -40], [-195, 0], [-220, 0], [-232, -82], [-244, -112]] },
  // running water: a low stream; its crests run (live)
  stream: { col: TEAL, x: 470, y: 760, s: 1, eyes: [[178, -112], [214, -118]], run: 1,
    pts: [[-330, 0], ...Array.from({ length: 18 }, (_, i) => [-320 + i * 25, -34 - 8 * Math.sin(i * .9) - i * 1.6]),
      [130, -84], [160, -134], [196, -166], [238, -176], [270, -160], [282, -130], [266, -110], [246, -120], [234, -102],
      [262, -60], [300, -24], [330, 0]] },
  tree: { col: WOOD, x: 560, y: 820, s: 1, eyes: [],
    pts: [[-95, 0], [-55, -40], [-45, -180], [-120, -212], [-330, -250], [-334, -274], [-120, -246], [-44, -262],
      [-38, -360], [-110, -394], [-292, -420], [-294, -444], [-110, -428], [-36, -404], [-30, -520], [-18, -600],
      [-92, -610], [-92, -634], [92, -634], [92, -610], [18, -600], [26, -520], [35, -462], [300, -497], [302, -475],
      [40, -432], [45, -300], [50, -288], [330, -332], [332, -310], [55, -256], [60, -40], [98, 0]] },
};
for (const k in SHAPES) SHAPES[k].pts = resample(SHAPES[k].pts);
// the upright stage: Proteus stands in the middle of the lower half (his cards and words go above him), and every
// change is a hop in place rather than a leap across
const GROUND = PORTRAIT ? 1250 : 770;
if (PORTRAIT) for (const k in SHAPES) Object.assign(SHAPES[k], { x: 450, y: GROUND + SHAPES[k].y - 760 });
// what each animal does once it has its shape (u: seconds since it settled): a move of the whole body, and a bend of
// its outline; each comes with its sound in the chapter
const bump = (u, a, b) => Math.sin(Math.PI * span01(u, a, b));
const tail = (x, x0, w) => Math.min(1, Math.max(0, (x0 - x) / w));   // 0 at the body, 1 at the tail's tip
Object.assign(SHAPES.water, { bend: (x, y, u) => [x * (1 - .1 * bump(u, 0, .7)), y * (1 + .06 * bump(u, 0, .7))] });   // squeezed in the hands
Object.assign(SHAPES.lion, {   // rears back and roars; then swishes his tail
  act: u => ({ r: -7 * bump(u, 0, 1) }),
  bend: (x, y, u) => [x, y + 9 * Math.sin(u * 5) * tail(x, -215, 85)] });
Object.assign(SHAPES.dragon, { bend: (x, y, u) => [x, y + 12 * Math.sin(x / 55 + u * 6) * (x > 100 ? .3 : 1)] });   // slithers, hissing
Object.assign(SHAPES.leopard, {   // crouches, springs, then flicks its tail
  bend: (x, y, u) => [x + 8 * Math.sin(u * 6) * tail(x, -250, 80), y * (1 - .14 * bump(u, 0, .3)) + 10 * Math.cos(u * 6) * tail(x, -250, 80)],
  act: u => ({ y: -80 * bump(u, .25, .75), r: -6 * bump(u, .25, .5) + 4 * bump(u, .5, .75) }) });
Object.assign(SHAPES.boar, {   // stamps and snorts, charges at its card, and stamps again
  act: u => ({ y: -6 * Math.abs(Math.sin(u * 14)) * (u % 2.2 < .5 ? 1 : 0), x: -90 * bump(u, .5, 1.4), r: 4 * bump(u, .5, .9) }) });
Object.assign(SHAPES.stream, { act: u => ({ x: 14 * Math.sin(u * 2.4) }) });   // the stream surges
Object.assign(SHAPES.tree, { act: u => ({ r: 1.4 * Math.sin(u * 1.7) * span01(u, 0, .6) }) });   // sways
// a second layer of paper on each shape, in its own colour: [d, fill, extra attributes]
const ring = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const poly = pts => 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
const DECOR = {
  lion: [[poly(mane(115, -212, 0, 360, 22, 78, 104)) + ring(150, -208, 64), '#7d2326', { 'fill-rule': 'evenodd' }],
    [poly([[-300, -205], [-286, -228], [-266, -208], [-282, -196]]), '#7d2326']],
  dragon: [[[[-230, -54], [-160, -64], [-90, -46], [-20, -36], [50, -64], [96, -130], [124, -200]]
    .map(([x, y]) => `M${x - 12} ${y - 6}l12 10l12 -10`).join(''), 'none', { stroke: '#8fc0de', 'stroke-width': 5, 'stroke-linejoin': 'round' }],
    [poly([[118, -300], [146, -284], [132, -282]]), '#1d4f70']],
  leopard: [[poly([[100, -80], [0, -76], [-100, -80], [-96, -96], [0, -92], [96, -96]]), '#8d67bd']],
  boar: [[poly([[-200, -170], [-160, -196], [-145, -212], [-120, -206], [-100, -226], [-75, -219], [-55, -242], [-30, -231],
    [-5, -247], [20, -229], [45, -236], [70, -211], [110, -192], [70, -186], [0, -206], [-80, -196], [-160, -176]]), '#9c6a16'],
    [poly([[244, -64], [262, -40], [234, -52]]), SHEET]],
  stream: [['M150 -126Q190 -170 238 -172Q266 -164 276 -138', 'none', { stroke: SHEET, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: .8 }]],
  tree: [['M-30 -90h22M10 -150h26M-34 -230h18M8 -330h24M-30 -430h20M6 -540h18M-200 -232h30M180 -320h28M-180 -416h24M160 -482h26',
    'none', { stroke: '#3b2a1c', 'stroke-width': 6, 'stroke-linecap': 'round' }]],
};

// the body, its paper shadow, eyes, and the page's text lines; kept on S so every beat moves the same Proteus
function proteus() {
  const back = G(scene, {});
  const disc = mk('circle', { r: 300, fill: WATER }, back);
  put(disc, PORTRAIT ? { x: 450, y: 480, o: .16 } : { x: 1130, y: 410, o: .16 });
  path(back, PORTRAIT ? 'M-20 1250L140 1244L330 1252L520 1243L700 1251L920 1245V1620H-20Z'
    : 'M-20 770L120 764L300 772L520 762L760 770L980 763L1220 771L1440 764L1620 770V920H-20Z', { fill: '#e8d9b8' });
  const waves = [['#9cc6d8', SH - 48, 0], ['#6fb3c8', SH - 24, 60]].map(([fill, y, dx]) => {
    const w = G(scene, {});
    path(w, 'M-200 0' + Array.from({ length: 22 }, (_, i) => `q50 -26 100 0`).join('') + 'V60H-200Z', { fill, transform: `translate(${dx} ${y})` });
    return w;
  });
  const g = G(scene, {});
  mk('ellipse', { cx: 0, cy: 6, rx: 230, ry: 14, fill: 'rgba(60,40,20,.10)' }, g);
  const shadow = mk('path', { fill: 'rgba(60,40,20,.20)', transform: 'translate(7 9)' }, g);
  const body = mk('path', {}, g);
  const decor = {};
  for (const k in DECOR) {
    decor[k] = G(g, { o: 0 });
    decor[k]._in = mk('g', {}, decor[k]);   // its own transform: the flip
    DECOR[k].forEach(([d, fill, extra = {}]) => path(decor[k]._in, d, { fill, ...extra }));
  }
  const lines = G(g, {});
  path(lines, 'M-120 -380H60', { stroke: INK, 'stroke-width': 10, 'stroke-linecap': 'round' });
  mk('rect', { x: -120, y: -345, width: 110, height: 90, fill: WATER, opacity: .55 }, lines);
  [-340, -318, -296, -274, -230, -208, -186, -164, -142, -120, -98, -76, -54].forEach((y, i) =>
    path(lines, `M${y > -260 ? -120 : 4} ${y}H${i % 4 === 3 ? 60 : 120}`, { stroke: '#b9ad97', 'stroke-width': 7, 'stroke-linecap': 'round' }));
  const eyes = [0, 1].map(() => {
    const e = G(g, {});
    mk('circle', { r: 11, fill: SHEET }, e);
    const pupil = mk('ellipse', { cx: 2, rx: 5, ry: 5.5, fill: INK }, e);
    return { e, pupil };
  });
  const drops = Array.from({ length: 9 }, () => mk('circle', { r: 9, fill: WATER, opacity: 0 }, scene));
  return (S.pro = { g, shadow, body, lines, eyes, decor, drops, disc, waves, at: 'page' });
}
// write an attribute only when it changes: Firefox restyles on every write
const setOnce = (e, k, v) => { if (e['_' + k] !== v) { e['_' + k] = v; e.setAttribute(k, v); } };
// draw Proteus between shapes a and b at q (0..1) at beat time t
function drawPro(a, b, q, t, u = -1) {
  const A = SHAPES[a], B = SHAPES[b], pr = S.pro, k = Math.sin(Math.PI * q);
  const f = (A.f || 1) + ((B.f || 1) - (A.f || 1)) * q;   // a shape on the right faces left, toward its card
  const amp = 1.6 + 18 * k, pts = [];
  for (let i = 0; i < NPTS; i++) {
    const [x0, y0] = A.pts[i], [x1, y1] = B.pts[i];
    let x = (x0 * (A.f || 1) + (x1 * (B.f || 1) - x0 * (A.f || 1)) * q), y = y0 + (y1 - y0) * q;
    const run = ((A.run || 0) * (1 - q) + (B.run || 0) * q) * (y < -20 ? 1 : 0) * (x < 110 ? 1.6 : .3);   // the crest, round the eyes, barely moves
    y += run * 10 * Math.sin(x / 38 - t * 7);
    if (q === 1 && b !== 'page' && y < -20) y *= 1 + .012 * Math.sin(t * 2.6);   // breathing
    pts.push(q === 1 && B.bend ? B.bend(x, y, u) : [x, y]);
  }
  const d = pts.map(([x, y], i) => {
    const [u, v] = pts[(i + NPTS - 1) % NPTS], [w, z] = pts[(i + 1) % NPTS], l = Math.hypot(w - u, z - v) || 1;
    const o = amp * Math.sin(i * .42 + t * 4.2) * (y > -6 ? .2 : 1);   // the feet stay on the ground
    return (i ? 'L' : 'M') + (x + (z - v) / l * o).toFixed(1) + ' ' + (y - (w - u) / l * o).toFixed(1);
  }).join('') + 'Z';
  const col = q < .5 ? tint(A.col, WATER, q * 2) : tint(WATER, B.col, q * 2 - 1);
  pr.body.setAttribute('d', d); pr.shadow.setAttribute('d', d); setOnce(pr.body, 'fill', col);
  const gx = A.x + (B.x - A.x) * q, gy = A.y + (B.y - A.y) * q - (Math.abs(B.x - A.x) > 100 || PORTRAIT && a !== b ? 160 * k : 0);   // a leap
  const act = q === 1 && B.act ? B.act(u) : {};
  put(pr.g, { x: gx + (act.x || 0), y: gy + (act.y || 0), s: A.s + (B.s - A.s) * q, r: act.r || 0 });
  for (const n in pr.decor) {
    put(pr.decor[n], { o: n === a && n === b ? 1 : n === a ? (1 - q) ** 4 : n === b ? q ** 4 : 0 });
    setOnce(pr.decor[n]._in, 'transform', `scale(${n === a ? A.f || 1 : B.f || 1} 1)`);
  }
  pr.drops.forEach((e, i) => {   // splashes while the body is water
    const u = (q * 1.6 + i * .07) % 1, a0 = -Math.PI / 2 + (i - 4) * .3, v = 260 + (i % 3) * 60;
    put(e, { x: gx + Math.cos(a0) * v * u, y: A.y + (B.y - A.y) * q - 120 + Math.sin(a0) * v * u + 420 * u * u, o: q > .02 && q < .95 ? .9 * (1 - u) : 0 });
  });
  put(pr.lines, { o: Math.max(A.lines ? 1 - q * 2.5 : 0, B.lines ? (q - .6) / .4 : 0, 0) });
  const blink = t % 3.3 < .13 ? .15 : 1;
  pr.eyes.forEach(({ e, pupil }, i) => {
    const ea = A.eyes[i] || A.eyes[0] || B.eyes[i] || B.eyes[0] || [0, -200], eb = B.eyes[i] || B.eyes[0] || ea;
    const oa = A.eyes[i] ? 1 : 0, ob = B.eyes[i] ? 1 : 0;
    put(e, { x: ea[0] * (A.f || 1) + (eb[0] * (B.f || 1) - ea[0] * (A.f || 1)) * q, y: ea[1] + (eb[1] - ea[1]) * q, o: oa && ob ? 1 : oa ? (1 - q) ** 3 : ob * q * q });
    setOnce(pupil, 'ry', (5.5 * blink).toFixed(2)); setOnce(pupil, 'cx', f < 0 ? -2 : 2);
  });
}
// one beat of Proteus: hold `from`, melt into `to` from t0 over dur, then live in it until the beat's end; its act
// (and its call, in the chapter) starts at actAt
function morph(D, from, to, t0, dur = 1, actAt = t0 + dur) {
  clockRun(t => drawPro(from, to, smooth01(span01(t, t0, t0 + dur)), t, t - actAt), D, { tail: true });
  sea(D);
  S.pro.at = to;
}
// the waves run on the film's own clock: S.at0 is the film time at this beat's start (set by the chapter, whose beats
// have fixed lengths, FILM_LEN in all), and they drift a whole number of crests over the film, so the loop has no seam
function sea(D) {
  const T = S.at0 || 0, L = window.FILM_LEN, v = L ? Math.round(L * .3) * 100 / L : 30;
  clockRun(t => S.pro.waves.forEach((w, i) => { const x = (v * (T + t)) % 100; put(w, { x: i ? -x : x }); }), D, { tail: true });
}

// a shape card: a sheet with the tier's colour along its top, popping in at t0
function sheet(p, x, y, col, t0, { w = 520, h = 330, s = 1 } = {}) {
  const g = G(p, { x, y, s: s * .92, o: 0 });
  mk('rect', { x: -w / 2 + 8, y: -h / 2 + 10, width: w, height: h, fill: 'rgba(60,40,20,.14)' }, g);
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: SHEET }, g);
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: 10, fill: col }, g);
  tw(g, { s, o: 1 }, t0, .5, back);
  return g;
}
const arrowTo = (p, x0, y0, x1, y1, col, t0, w = 6) => {
  const a = Math.atan2(y1 - y0, x1 - x0), hx = x1 - 18 * Math.cos(a), hy = y1 - 18 * Math.sin(a);
  draw(path(p, `M${x0} ${y0}L${hx} ${hy}`, { stroke: col, 'stroke-width': w, 'stroke-linecap': 'round' }, { d: 0 }), t0, .5);
  const head = path(p, `M${x1} ${y1}L${hx - 9 * Math.sin(a)} ${hy + 9 * Math.cos(a)}L${hx + 9 * Math.sin(a)} ${hy - 9 * Math.cos(a)}Z`, { fill: col, o: 0 });
  show(head, t0 + .45, .15);
};
// the five shapes' cards, each drawn around (0, 0) inside a card made by sheet(); t0 starts its motion
const CARDS = {
  lesson(g, t0) {
    for (let x = -220; x <= 220; x += 40) path(g, `M${x} -130V140`, { stroke: '#ebe2d2', 'stroke-width': 2 });
    for (let y = -130; y <= 140; y += 40) path(g, `M-220 ${y}H220`, { stroke: '#ebe2d2', 'stroke-width': 2 });
    path(g, 'M-220 110H220M-140 -130V140', { stroke: '#b9ad97', 'stroke-width': 3 });
    arrowTo(g, -140, 110, 20, 70, RED, t0 + .2);
    arrowTo(g, -140, 110, -80, -40, RED, t0 + .7);
    draw(path(g, 'M20 70L80 -80M-80 -40L80 -80', { stroke: RED, 'stroke-width': 3, 'stroke-dasharray': '8 8', opacity: .6 }, { d: 0 }), t0 + 1.2, .5);
    arrowTo(g, -140, 110, 80, -80, '#7d2326', t0 + 1.6, 7);
    [['a', 0, 104], ['b', -126, -40], ['a + b', 96, -84]].forEach(([s, x, y], i) =>
      show(T(g, s, { x, y, size: 30, fill: i === 2 ? '#7d2326' : RED, font: SER, o: 0 }), t0 + [.6, 1.1, 2][i], .3));
    g.querySelectorAll('text').forEach(e => e.setAttribute('font-style', 'italic'));
  },
  book(g, t0) {
    mk('circle', { cx: 150, cy: -70, r: 34, fill: '#fffaf0' }, g);
    path(g, 'M-260 70C-160 0 -60 10 40 60S200 30 260 50V165H-260Z', { fill: '#9cc2da' });
    path(g, 'M-260 120C-140 70 20 90 120 110S220 90 260 100V165H-260Z', { fill: BLUE });
    path(g, 'M-150 100L-150 30M-150 -40L-190 40H-110Z', { fill: '#1d4f70', stroke: '#1d4f70', 'stroke-width': 8 });
    // a paper puppet: three pieces of a dragon pinned together, on two sticks; it swims and its jaw flaps
    const pup = G(g, { x: 30, y: 0 }), sticks = path(g, 'M0 0', { stroke: '#7a6a55', 'stroke-width': 4 });
    const seg = (parent, d, x) => { const e = G(parent, { x }); path(e, d, { fill: BLUE }); return e; };
    const s1 = seg(pup, 'M0 -16L-70 -4L-110 12L-60 8L0 16Z', -60);
    const s2 = seg(pup, 'M-60 -18L-40 -40L-20 -20L0 -36L20 -18L60 -16L60 16L-60 16Z', 0);
    const s3 = seg(pup, 'M0 -14L30 -30L62 -24L74 -8L40 -4L0 14Z', 60);
    const jaw = G(s3, { x: 30, y: 2 });
    path(jaw, 'M-30 8L44 -2L40 10L-24 18Z', { fill: '#1d4f70' });
    mk('circle', { cx: 50, cy: -18, r: 4, fill: SHEET }, s3);
    [[-60, 0], [0, 0], [60, 0]].forEach(([x]) => mk('circle', { cx: x, cy: 0, r: 5, fill: SHEET, stroke: '#1d4f70', 'stroke-width': 2 }, pup));
    clockRun(t => {
      const u = Math.max(0, t - t0), x = 30 + 40 * Math.sin(u * 1.1), y = -50 + 12 * Math.sin(u * 2.4);
      put(pup, { x, y, r: 4 * Math.sin(u * 2.4) });
      put(s1, { x: -60, r: 14 * Math.sin(u * 3.2) }); put(s3, { x: 60, r: -10 * Math.sin(u * 3.2 + 1) });
      put(jaw, { x: 30, y: 2, r: 12 * Math.max(0, Math.sin(u * 7)) });
      sticks.setAttribute('d', `M${(x - 40).toFixed(1)} ${y.toFixed(1)}L${(x - 30).toFixed(1)} 165M${(x + 50).toFixed(1)} ${y.toFixed(1)}L${(x + 60).toFixed(1)} 165`);
    }, 0, { tail: true });
  },
  film(g, t0) {
    mk('rect', { x: -260, y: -165, width: 520, height: 330, fill: '#2d1a40' }, g);
    path(g, 'M-260 -126H260M-260 126H260', { stroke: '#4a2f66', 'stroke-width': 3 });
    const ship = G(g, { x: 0, y: 10 });
    ['M-120 50Q0 90 120 50L100 30H-100Z', 'M-10 30V-90M-10 -86L60 0H-10M-10 -70L-80 10H-10', 'M-150 66Q-110 56 -70 66T10 66T90 66T170 66']
      .forEach((d, i) => draw(path(ship, d, { stroke: '#f3ede0', 'stroke-width': 5, fill: 'none', 'stroke-linejoin': 'round' }, { d: 0 }), t0 - .1 + i * .25, .6));
    tw(ship, { s: 1.08 }, t0, 1.4, lin);
    const sub = G(g, { o: 0 });   // a subtitle strip: the film is narrated
    mk('rect', { x: -170, y: 80, width: 340, height: 34, rx: 6, fill: 'rgba(0,0,0,.55)' }, sub);
    T(sub, 'In 1494, a ship of fools set sail…', { x: 0, y: 104, size: 21, fill: '#f3ede0', font: SER, anchor: 'middle' });
    show(sub, t0 + .5, .3);
  },
  short(g, t0, { w0 = 500, h0 = 310 } = {}) {
    const fr = mk('rect', { fill: '#2d1a40' }, g), bar = mk('rect', { fill: '#f3ede0', height: 12, rx: 6 }, g);
    const boar = G(g, { s: .34, o: 0 });
    path(boar, 'M' + SHAPES.boar.pts.map(p => p.join(' ')).join('L') + 'Z', { fill: '#f0c069' });
    const cap = [mk('rect', { fill: '#f3ede0', height: 12, rx: 6, opacity: 0 }, g), mk('rect', { fill: '#f3ede0', height: 12, rx: 6, opacity: 0 }, g)];
    clockRun(t => {
      const q = smooth01(span01(t, t0, t0 + .8)), w = w0 + (190 - w0) * q, h = h0 + (338 - h0) * q;
      Object.entries({ x: -w / 2, y: -h / 2, width: w, height: h, rx: 22 * q }).forEach(([k, v]) => fr.setAttribute(k, v.toFixed(1)));
      bar.setAttribute('x', (-w / 2 + 14).toFixed(1)); bar.setAttribute('y', (-h / 2 + 14).toFixed(1));
      bar.setAttribute('width', ((w - 28) * span01(t, t0 + .6, t0 + 2.6)).toFixed(1));
      put(boar, { x: 10 * Math.sin(t * 3), y: 40 + 3 * Math.abs(Math.sin(t * 9)), o: q });
      cap.forEach((c, i) => { c.setAttribute('x', -60 + i * 20); c.setAttribute('y', 92 + i * 22); c.setAttribute('width', 120 - i * 40); c.setAttribute('opacity', q); });
    }, 0, { tail: true });
  },
  map(g, t0) {
    mk('rect', { x: -260, y: -155, width: 520, height: 320, fill: '#d6e6ea' }, g);
    path(g, 'M-260 -155H120L90 -100L130 -40L60 10L100 80L20 165H-260Z', { fill: '#e8dcc0', stroke: BROWN, 'stroke-width': 3 });
    path(g, 'M150 -60L230 -90L250 20L180 60Z', { fill: '#e8dcc0', stroke: BROWN, 'stroke-width': 3 });
    const reg = path(g, 'M-90 -40L10 -60L40 20L-40 60L-110 20Z', { fill: TEAL, stroke: TEAL, 'stroke-width': 2 }, { o: 0 });
    path(g, 'M-90 -40L-170 -90M10 -60L30 -155M40 20L80 80M-110 20L-200 70M-40 60L-60 165', { stroke: BROWN, 'stroke-width': 2, 'stroke-dasharray': '6 6', opacity: .6 });
    path(g, 'M-90 -40L10 -60L40 20L-40 60L-110 20Z', { fill: 'none', stroke: BROWN, 'stroke-width': 2, opacity: .6 });
    ['M-240 -130Q-150 -60 -100 -20T20 40T75 130', 'M-60 -150Q-40 -90 -30 -50T-20 40'].forEach((d, i) =>
      draw(path(g, d, { stroke: DEEP, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, { d: 0 }), t0 + .1 + i * .3, 1));
    const cur = G(g, { x: 180, y: 140, o: 0 });
    path(cur, 'M0 0L0 34L9 25L16 40L23 37L16 22L28 22Z', { fill: INK, stroke: SHEET, 'stroke-width': 2 });
    show(cur, t0 + .4, .3); tw(cur, { x: -40, y: 0 }, t0 + .5, .9, soft);
    tw(cur, { s: .8 }, t0 + 1.45, .1); tw(cur, { s: 1 }, t0 + 1.55, .15);
    show(reg, t0 + 1.5, .3);
  },
};
