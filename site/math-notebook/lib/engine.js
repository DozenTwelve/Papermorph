// Papermorph lesson engine: stage, drawing, timeline, questions, player.
// A chapter page loads this file, defines CHAPTER and BEATS, then calls boot().
'use strict';
// A fast follow-up navigation can abort the incoming page transition.
addEventListener('pagereveal', e => e.viewTransition?.ready.catch(() => {}));
document.body.insertAdjacentHTML('afterbegin', `<div id="frame">
  <svg id="stage" viewBox="0 0 1600 900" role="img" aria-label="Lesson animation">
    <g id="scene"></g>
  </svg>
  <div id="ui"></div>
  <div class="paused-mark"><div>Paused. Press space or click to continue.</div></div>
  <div class="caption" id="caption" hidden></div>
  <div class="help" id="help" hidden role="dialog" aria-label="Keyboard shortcuts">
    <div class="help-box">
      <h2>Keyboard shortcuts</h2>
      <div class="help-cols">
        <div><h3>Lesson</h3><dl>
          <dt><kbd>Space</kbd></dt><dd>Play or pause</dd>
          <dt><kbd>←</kbd><kbd>→</kbd></dt><dd>Previous or next step</dd>
          <dt><kbd>Shift</kbd><kbd>←</kbd><kbd>→</kbd></dt><dd>Change step during a question</dd>
          <dt><kbd>Home</kbd></dt><dd>Start over</dd>
          <dt><kbd>C</kbd></dt><dd>Captions on or off</dd>
          <dt><kbd>F</kbd></dt><dd>Full screen</dd>
          <dt><kbd>?</kbd></dt><dd>Show this list</dd>
        </dl></div>
        <div><h3>Questions</h3><dl>
          <dt><kbd>1</kbd>–<kbd>6</kbd></dt><dd>Choose an answer or a ring</dd>
          <dt><kbd>T</kbd><kbd>F</kbd></dt><dd>True or false</dd>
          <dt><kbd>↑</kbd><kbd>↓</kbd></dt><dd>Move between rows</dd>
          <dt><kbd>←</kbd><kbd>→</kbd></dt><dd>Move along the number line, or pick a number to sort</dd>
          <dt><kbd>Enter</kbd></dt><dd>Check, then continue</dd>
          <dt><kbd>S</kbd></dt><dd>Show the answer</dd>
          <dt><kbd>Esc</kbd></dt><dd>Leave an answer box</dd>
        </dl></div>
      </div>
      <p class="help-close">Press <kbd>Esc</kbd> to close.</p>
    </div>
  </div>
  <p class="sound-note" id="soundNote" hidden>Sound could not play. The lesson continues with the on-screen text.</p>
  <button class="cover" id="cover"><div>
    <p class="cover-k" id="coverK"></p>
    <h1 class="cover-t" id="coverT"></h1>
    <span class="go"><svg width="24" height="24" viewBox="0 0 18 18"><path d="M3 1.5v15l13-7.5z" fill="currentColor"/></svg>Start lesson</span>
    <small><span id="coverMeta"></span> Press <kbd>Space</kbd> to start, <kbd>?</kbd> for shortcuts.</small>
  </div></button>
  <div id="bar">
    <a class="icon" id="bHome" href="../" aria-label="All chapters" title="All chapters">
      <svg viewBox="0 0 18 18"><path d="M2 2h6v6H2zM10 2h6v6h-6zM2 10h6v6H2zM10 10h6v6h-6z"/></svg>
    </a>
    <button class="icon" id="bPlay" aria-label="Play or pause (space)">
      <svg class="i-play" viewBox="0 0 18 18"><path d="M4 2v14l12-7z"/></svg>
      <svg class="i-pause" viewBox="0 0 18 18"><path d="M3.5 2h4v14h-4zM10.5 2h4v14h-4z"/></svg>
    </button>
    <button class="icon" id="bBack" aria-label="Previous step (left arrow)">
      <svg viewBox="0 0 18 18"><path d="M3 2h2.5v14H3zM16 2v14L6.5 9z"/></svg>
    </button>
    <button class="icon" id="bRestart" aria-label="Restart lesson">
      <svg viewBox="0 0 18 18"><path d="M9 2.5a6.5 6.5 0 1 1-6.3 8.1l2-.5A4.5 4.5 0 1 0 9 4.5V7L4.5 3.5 9 0z"/></svg>
    </button>
    <div class="segs" id="segs"></div>
    <div class="step" id="stepName"></div>
    <button class="icon txt" id="bHelp" aria-label="Keyboard shortcuts (?)" title="Keyboard shortcuts (?)">?</button>
    <button class="icon cc" id="bCC" aria-pressed="false" aria-label="Captions (C)" title="Captions (C)">CC</button>
    <button class="icon" id="bFull" aria-label="Full screen">
      <svg viewBox="0 0 18 18"><path d="M1 1h6v2H3v4H1zM11 1h6v6h-2V3h-4zM1 11h2v4h4v2H1zM15 11h2v6h-6v-2h4z"/></svg>
    </button>
  </div>
</div>`);

// Board colour, grain and vignette are a static CSS background of #stage (engine.css). The grain is a small noise
// texture made once here: an SVG turbulence filter behind animated content is recomputed on every frame in Firefox.
{
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), d = x.createImageData(256, 256);
  for (let i = 0, s = 7; i < d.data.length; i += 4) { s = s * 16807 % 2147483647; d.data.set([235, 242, 230, 4 + s % 12], i); }
  x.putImageData(d, 0, 0);
  document.getElementById('stage').style.setProperty('--grain', `url(${c.toDataURL()})`);
}

/* ---------- drawing helpers ---------- */
const NS = 'http://www.w3.org/2000/svg';
const COL = { nat: '#f4a48c', whole: '#86c9e8', int: '#f3c95c', rat: '#e8a0c8', irr: '#8fd6b0', real: '#bba8ee',
  chalk: '#ece8dc', dim: '#9aaba3', faint: '#5d7068', task: '#f0b45a', good: '#8fd6b0', bad: '#f08c7a', board: '#1d2b27' };
const UI = '"Avenir Next","Segoe UI","Helvetica Neue",Arial,sans-serif';
// Book settings (lib/book.css, next to engine.css and imported by it): --math-font for numbers and formulas,
// --progress-key for the localStorage key the cover and chapters share.
const BOOK = getComputedStyle(document.documentElement);
const bookSetting = name => BOOK.getPropertyValue(name).trim().replace(/^(["'])([^"']*)\1$/, '$2');   // unquote a lone string only
const MATH = bookSetting('--math-font') || '"STIX Two Text","Cambria Math","Iowan Old Style",Palatino,Georgia,serif';
const NAME = { nat: 'Natural', whole: 'Whole', int: 'Integers', rat: 'Rational', irr: 'Irrational', real: 'Real' };
// Card positions inside the 1600×900 picture.
const BAND = { x: 96, y: 686, w: 1408, cls: 'band' };      // bottom band (moves up when taller than the space left)
const RIGHT = { x: 1258, y: 546, w: 330, cls: 'side', maxH: 346 };    // right of the number map
const TOPR = { x: 960, y: 70, w: 624, cls: 'side', maxH: 470 };   // top right, above the number line
const SCREEN = { x: 0, y: 0, w: 1600, cls: 'screen' };
const SORT_SCREEN = { x: 0, y: 0, w: 1600, cls: 'screen sort' };
const $m = (...parts) => ({ m: parts });

function mk(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
// Every animated element keeps a small state object; render() writes it to the DOM.
// Keys: x y s r o (transform/opacity), d (0..1 stroke drawn), a_<attr> numeric attr, c_<attr> hex colour.
function st(e) { return e._st || (e._st = { x: 0, y: 0, s: 1, r: 0, o: 1 }); }
function put(e, o) { Object.assign(st(e), o); render(e); return e; }
// Unchanged transform/opacity are not rewritten: per-frame updates of still elements cost repaints (notably in Firefox).
function render(e) {
  const s = e._st, tf = s.x || s.y || s.s !== 1 || s.r ? `translate(${s.x},${s.y}) rotate(${s.r}) scale(${s.s})` : null;
  if (tf !== e._tf) { if (tf) e.setAttribute('transform', tf); else e.removeAttribute('transform'); e._tf = tf; }
  if (s.o !== e._o) { e.setAttribute('opacity', s.o); e._o = s.o; }
  if (s.d !== undefined) {
    e.setAttribute('stroke-dashoffset', 1 - s.d);
    e.style.visibility = s.d < .002 ? 'hidden' : '';
  }
  for (const k in s) {
    if (k.startsWith('a_')) e.setAttribute(k.slice(2), s[k]);
    else if (k.startsWith('c_')) e.setAttribute(k.slice(2), s[k]);
  }
}
function G(parent, o = {}) { return put(mk('g', {}, parent), o); }
function path(parent, d, attrs = {}, o = {}) {
  const p = mk('path', { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs }, parent);
  if (o.d !== undefined) { p.setAttribute('pathLength', 1); p.setAttribute('stroke-dasharray', '1 1'); }
  return put(p, o);
}
function T(parent, str, { x = 0, y = 0, size = 30, fill = COL.chalk, font = UI, weight = 500, anchor = 'start', o = 1 } = {}) {
  const t = mk('text', { 'font-size': size, fill, 'font-family': font, 'font-weight': weight, 'text-anchor': anchor }, parent);
  t.textContent = str;
  t.style.whiteSpace = 'pre';
  return put(t, { x, y, o });
}
const ctx2d = document.createElement('canvas').getContext('2d');
function textW(str, size, italic = false) { ctx2d.font = `${italic ? 'italic ' : ''}${size}px ${MATH}`; return ctx2d.measureText(str).width; }
const VAR = /(?<![A-Za-z°])(?:(?!(?:of|in|is|to|or|at|on|by|as|an|if|it|be|no|so|up|we|my)(?![A-Za-z]))[a-z]{1,2}|(?!(?:If|In|It|Is|On|At|No|So|Or|An|As|To|By|Up)(?![A-Za-z]))[a-z]?[A-Z]{1,3}[a-z]?)(?![A-Za-z])/g;   // capitals: A, PV, nRT   // short lowercase runs are variables (a, x, ab), except short English words
const F = (n, d) => ({ f: [String(n), String(d)] });   // fraction
const R = (x, i) => ({ r: x && x.f ? x : String(x), i: i && String(i) });   // root of a number or of F(n, d); i = index, e.g. 3 for a cube root
const E = x => ({ sup: String(x) });                    // exponent, raised after the part before it
const OV = x => ({ ov: String(x) });                    // digits under a repeat bar: ['0.', OV('3')] is 0.333…
// Math expression from parts: 'text' | F(n,d) | R(x) | E(exp) | OV(digits). Baseline at y; anchor start/middle/end.
function M(parent, parts, { x = 0, y = 0, size = 36, fill = COL.chalk, anchor = 'middle', o = 1, s = 1 } = {}) {
  const g = G(parent, { x, y, o, s });
  const inner = mk('g', {}, g);
  const lw = size * .05;
  const text = (str, tx, ty, sz) => {
    const t = mk('text', { x: tx, y: ty, 'font-size': sz, 'font-family': MATH, fill }, inner);
    t.style.whiteSpace = 'pre';
    let w = 0, last = 0;
    const run = (piece, italic) => {
      if (!piece) return;
      mk('tspan', italic ? { 'font-style': 'italic' } : {}, t).textContent = piece;
      w += textW(piece, sz, italic);
    };
    for (const m of str.matchAll(VAR)) { run(str.slice(last, m.index), false); run(m[0], true); last = m.index + m[0].length; }
    run(str.slice(last), false);
    return w;
  };
  const rule = (x1, x2, yy) => mk('path', { d: `M${x1} ${yy}H${x2}`, stroke: fill, 'stroke-width': lw, 'stroke-linecap': 'round' }, inner);
  let cx = 0;
  for (const p of parts) {
    if (typeof p === 'string') cx += text(p, cx, 0, size);
    else if (p.f) {
      const fs = size * .72, [n, d] = p.f, wn = textW(n, fs), wd = textW(d, fs);
      const w = Math.max(wn, wd) + size * .2, bar = -size * .3;
      text(n, cx + (w - wn) / 2, bar - size * .12, fs);
      text(d, cx + (w - wd) / 2, bar + size * .62, fs);
      rule(cx + size * .04, cx + w - size * .04, bar);
      cx += w + size * .04;
    } else if (p.r) {
      const fr = typeof p.r === 'object', mid = fr ? -size * .12 : -size * .3, bot = fr ? size * .45 : size * .06, top = fr ? -size * 1.12 : -size * .82;
      let x0 = cx + size * .04;
      if (p.i) { const iw = textW(p.i, size * .42); text(p.i, x0, mid - size * .14, size * .42); x0 += Math.max(0, iw - size * .12); }   // index in the radical's crook
      let w;
      if (fr) {   // a fraction under the radical, laid out like F()
        const fs = size * .72, [n, d] = p.r.f, wn = textW(n, fs), wd = textW(d, fs), bx = x0 + size * .56, bar = -size * .3;
        w = Math.max(wn, wd) + size * .2;
        text(n, bx + (w - wn) / 2, bar - size * .12, fs);
        text(d, bx + (w - wd) / 2, bar + size * .62, fs);
        mk('path', { d: `M${bx + size * .04} ${bar}H${bx + w - size * .04}`, stroke: fill, 'stroke-width': lw, 'stroke-linecap': 'round' }, inner);
      } else { w = textW(p.r, size); text(p.r, x0 + size * .56, 0, size); }
      mk('path', { d: `M${x0} ${mid}L${x0 + size * .1} ${mid - size * .06}L${x0 + size * .27} ${bot}L${x0 + size * .45} ${top}H${x0 + size * .56 + w + size * .06}`,
        fill: 'none', stroke: fill, 'stroke-width': lw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, inner);
      cx = x0 + size * .56 + w + size * .1;
    } else if (p.sup !== undefined) {
      cx += text(p.sup, cx + size * .03, -size * .45, size * .62) + size * .06;
    } else if (p.ov !== undefined) {
      const w = text(p.ov, cx, 0, size);
      rule(cx + size * .04, cx + w - size * .02, -size * .8);
      cx += w;
    }
  }
  const dx = anchor === 'middle' ? -cx / 2 : anchor === 'end' ? -cx : 0;
  inner.setAttribute('transform', `translate(${dx},0)`);
  g._w = cx;
  return g;
}
// Pill-shaped number token, centred on (x, y).
function chip(parent, parts, color, { x = 0, y = 0, o = 1, s = 1, size = 34 } = {}) {
  const g = G(parent, { x, y, o, s });
  const rect = mk('rect', {}, g);
  const m = M(g, parts, { size, y: size * .3 });
  const w = Math.max(m._w + 36, 64), h = size * (parts.some(p => p.f) ? 1.75 : 1.45);
  for (const [k, v] of Object.entries({ x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: COL.board, stroke: color, 'stroke-width': 2.5 })) rect.setAttribute(k, v);
  g._rect = rect;
  return g;
}
// A row of math tokens laid out left to right. Items: string | parts array | { t, fill }.
// Each token is centred on its own x, so it can move alone (swaps, sliding parentheses). Spacing comes from the strings.
function tokens(parent, items, { x = 0, y = 0, size = 44, fill = COL.chalk, anchor = 'start', o = 1 } = {}) {
  const els = items.map(it => {
    const spec = it && it.t !== undefined ? it : { t: it };
    return M(parent, [].concat(spec.t), { size, fill: spec.fill || fill, o });
  });
  return layRow(els, { x, y, size, anchor }, e => put(e, { x: e._px, y }));
}
// Place a row's tokens side by side. Each token keeps its planned centre in _px, so later steps
// can be planned before earlier tweens have run.
function layRow(els, { x, y, size, anchor }, move) {
  const total = els.reduce((a, e) => a + e._w, 0);
  let cx = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x;
  for (const e of els) { e._px = cx + e._w / 2; move(e); cx += e._w; }
  return Object.assign(els, { w: total, x, y, size, anchor });
}
// One simplification step: box tokens i..j, shrink them into a single result token, then close the gap.
// Returns the new row. live = true runs on the question clock (inside ask) instead of the lesson clock.
function collapse(row, i, j, parts, t0, { color = COL.task, fill = COL.chalk, live = false } = {}) {
  const run = live ? fx : tw, p = row[0].parentNode, { size, y } = row;
  const left = row[i]._px - row[i]._w / 2, right = row[j]._px + row[j]._w / 2;
  const box = put(mk('rect', { rx: 10, fill: 'none', stroke: color, 'stroke-width': 3 }, p),
    { o: 0, a_x: left - 8, a_y: y - size * .95, a_width: right - left + 16, a_height: size * 1.3 });
  run(box, { o: 1 }, t0, .3);
  run(box, { o: 0 }, t0 + 1.2, .3);
  const res = M(p, parts, { size, fill, o: 0, x: (left + right) / 2, y });
  for (let k = i; k <= j; k++) run(row[k], { o: 0, s: .6 }, t0 + .8, .35);
  run(res, { o: 1 }, t0 + .95, .35);
  const next = [...row.slice(0, i), res, ...row.slice(j + 1)];
  return layRow(next, row, e => run(e, { x: e._px }, t0 + 1.3, .5));
}
// Vertical number line at x; Yf maps a value to its y. Labels sit on the left.
function vAxis(p, { x, Yf, lo, hi, step = 1, t0 = .1, unit = '' }) {
  draw(path(p, `M${x} ${Yf(lo - .5)}V${Yf(hi + .5)}`, { stroke: COL.chalk, 'stroke-width': 3 }, { d: 0 }), t0, .8);
  for (let v = lo; v <= hi; v += step) {
    const g = G(p, { o: 0 });
    path(g, `M${x - 9} ${Yf(v)}H${x + 9}`, { stroke: COL.dim, 'stroke-width': 2.5 });
    T(g, num(v) + unit, { x: x - 46, y: Yf(v) + 9, size: 24, fill: v === 0 ? COL.chalk : COL.dim, font: MATH, anchor: 'end' });
    show(g, t0 + .2 + Math.abs(v - lo) * .02);
  }
}
// Thermometer from lo (bottom) to hi (top). set(v, t0, run) moves the column; run = tw (lesson) or fx (answer).
function thermometer(p, { x = 800, bottom = 600, top = 200, lo = -10, hi = 15, step = 5, value = 0, color = COL.nat } = {}) {
  const Yt = v => bottom - (v - lo) / (hi - lo) * (bottom - top), bulb = bottom + 32, g = G(p);
  mk('rect', { x: x - 18, y: top - 24, width: 36, height: bulb - top + 24, rx: 18, fill: COL.board, stroke: COL.dim, 'stroke-width': 2.5 }, g);
  mk('circle', { cx: x, cy: bulb, r: 26, fill: color }, g);
  const merc = put(mk('rect', { x: x - 9, width: 18, rx: 9, fill: color }, g), { a_y: Yt(value), a_height: bulb - Yt(value) });
  for (let v = lo; v <= hi; v += step) {
    path(g, `M${x - 30} ${Yt(v)}H${x - 18}`, { stroke: COL.dim, 'stroke-width': 2 });
    T(g, `${num(v)}°`, { x: x - 40, y: Yt(v) + 9, size: 24, fill: v === 0 ? COL.chalk : COL.dim, font: MATH, anchor: 'end' });
  }
  return { g, merc, Yt, set: (v, t0, run = tw, dur = 1.2) => run(merc, { a_y: Yt(v), a_height: bulb - Yt(v) }, t0, dur) };
}
/* ---------- fractions: rows with strikable parts, bars and brackets ---------- */
// A row of fractions and symbols whose numerators and denominators can be struck out one by one.
// items: { f: [n, d], fill } | 'symbol text'. The fraction bars sit on y.
function fracRow(p, items, { x = 800, y = 300, size = 60, anchor = 'middle', o = 0 } = {}) {
  const fs = size * .8, g = G(p, { o });
  const els = items.map(it => {
    if (typeof it === 'string') {
      const w = textW(it, size);
      return { w, draw(cx) { this.cx = cx; T(g, it, { x: cx, y: y + size * .33, size, font: MATH, fill: COL.chalk, anchor: 'middle' }); } };
    }
    const [n, d] = it.f.map(String), w = Math.max(textW(n, fs), textW(d, fs)) + size * .35, fill = it.fill || COL.chalk;
    return { w, n, d, draw(cx) {
      this.cx = cx;
      path(g, `M${cx - w / 2 + 4} ${y}H${cx + w / 2 - 4}`, { stroke: fill, 'stroke-width': size * .055 });
      this.num = T(g, n, { x: cx, y: y - size * .18, size: fs, font: MATH, fill, anchor: 'middle' });
      this.den = T(g, d, { x: cx, y: y + size * .78, size: fs, font: MATH, fill, anchor: 'middle' });
    } };
  });
  const total = els.reduce((a, e) => a + e.w, 0);
  let cx = anchor === 'middle' ? x - total / 2 : x;
  for (const e of els) { e.draw(cx + e.w / 2); cx += e.w; }
  return Object.assign(els, { g, y, size, x0: anchor === 'middle' ? x - total / 2 : x, w: total });
}
// Strike the numerator ('num') or denominator ('den') of fraction k and write its reduced value beside it.
function reduce(row, k, part, value, color, t0, run = tw) {
  const e = row[k], { y, size } = row, top = part === 'num';
  const cy = top ? y - size * .42 : y + size * .52, g = row.g;
  const slash = path(g, `M${e.cx - size * .28} ${cy + size * .3}L${e.cx + size * .28} ${cy - size * .3}`, { stroke: color, 'stroke-width': 3.5 }, { d: 0 });
  const nv = T(g, String(value), { x: e.cx + size * .02, y: top ? y - size * .92 : y + size * 1.36, size: size * .5, font: MATH, fill: color, anchor: 'middle', o: 0 });
  run(slash, { d: 1 }, t0, .4); run(nv, { o: 1 }, t0 + .3, .4);
  run(e[part], { o: .45 }, t0 + .3, .4);
}
function rect(p, x, y, w, h, fill, o = 0, stroke = 'none') {
  return put(mk('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': 2.5 }, p), { o });
}
function bracketH(p, x1, x2, y, label, color, t0) {
  draw(path(p, `M${x1} ${y - 10}V${y}H${x2}V${y - 10}`, { stroke: color, 'stroke-width': 3 }, { d: 0 }), t0, .5);
  show(T(p, label, { x: (x1 + x2) / 2, y: y + 32, size: 26, fill: color, font: MATH, anchor: 'middle', o: 0 }), t0 + .3);
}

/* ---------- decimal point that hops between digits (ch10, ch20) ---------- */
// Digits in evenly spaced slots with a decimal point that can hop between them.
// places = digits after the point (0 = point at the far right, hidden).
function pointRow(p, digits, x, y, places, { size = 72, fill = COL.chalk, sign = '' } = {}) {
  const g = G(p, { o: 0 }), w = size * .7, n = digits.length, x0 = x - n * w / 2;
  if (sign) T(g, sign, { x: x0 - w * .6, y, size, fill, font: MATH, anchor: 'middle' });
  const ds = [...digits].map((c, i) => T(g, c, { x: x0 + i * w + w / 2, y, size, fill, font: MATH, anchor: 'middle' }));
  const px = k => x0 + (n - k) * w;
  const dot = mk('circle', { r: size * .065, fill: COL.task }, g);
  put(dot, { x: px(places), y: y - size * .02, o: places ? 1 : 0 });
  const trail = path(g, '', { stroke: COL.task, 'stroke-width': 2.5, 'stroke-dasharray': '5 6' });
  return { g, ds, dot, px, w,
    hop(from, to, t0, run = tw, dur = .55) {
      const steps = Math.abs(to - from);
      run(dot, { o: 1 }, t0, .2);
      let d = '';
      for (let k = 0; k < steps; k++) {
        const a = px(from + Math.sign(to - from) * k), b = px(from + Math.sign(to - from) * (k + 1));
        d += `M${a} ${y - 10}Q${(a + b) / 2} ${y - size * .9} ${b} ${y - 10}`;
      }
      trail.setAttribute('d', d);
      put(trail, { o: 0 }); run(trail, { o: .9 }, t0 + steps * dur, .3);
      (run === tw ? prog : fxp)(q => {
        const s = q * steps, k = Math.min(steps - 1, Math.floor(s)), f = s - k;
        const a = px(from + Math.sign(to - from) * k), b = px(from + Math.sign(to - from) * (k + 1));
        put(dot, { x: a + (b - a) * f, y: y - size * .02 - Math.sin(Math.PI * f) * size * .7 });
      }, t0, steps * dur, lin);
    } };
}

/* ---------- balance scale for equations (ch24, ch25) ---------- */
// A balance scale. Its pans hang from the beam ends; tilt(deg, t0) rocks it (positive: left side down).
function balance(p, { x = 800, y = 330, L = 300 } = {}) {
  const g = G(p, { o: 0 });
  path(g, `M${x} ${y}L${x - 50} ${y + 330}H${x + 50}Z`, { stroke: COL.dim, 'stroke-width': 3, fill: mix(COL.board, COL.dim, .15) });
  const beam = G(g, { x, y });
  path(beam, `M${-L} 0H${L}`, { stroke: COL.chalk, 'stroke-width': 6 });
  mk('circle', { r: 10, fill: COL.chalk }, beam);
  const pan = side => {
    const pg = G(g, { x: x + side * L, y });
    path(pg, 'M0 0L-90 110M0 0L90 110', { stroke: COL.dim, 'stroke-width': 2 });
    path(pg, 'M-110 110Q0 150 110 110Z', { stroke: side < 0 ? COL.whole : COL.nat, 'stroke-width': 3, fill: mix(COL.board, side < 0 ? COL.whole : COL.nat, .2) });
    return pg;
  };
  const Lp = pan(-1), Rp = pan(1);
  let angle = 0;
  const place = a => {
    const r = a * Math.PI / 180, dx = L * Math.cos(r), dy = L * Math.sin(r);
    put(beam, { r: -a }); put(Lp, { x: x - dx, y: y + dy }); put(Rp, { x: x + dx, y: y - dy });
  };
  return {
    g, L: Lp, R: Rp,
    // Content sits on a pan: text or math at (0, 90) in pan coordinates.
    load(side, parts, color, t0, size = 44) { const e = M(side < 0 ? Lp : Rp, parts, { y: 96, size, fill: color, o: 0 }); show(e, t0); return e; },
    tilt(a, t0, run = prog) { const from = angle; angle = a; run(q => place(from + (a - from) * back(q)), t0, .9); },
  };
}
/* ---------- algebra tiles (ch23, ch25) ---------- */
const XL = 120, UN = 30;            // length of x, size of 1
const TS = { x2: [XL, XL, COL.real], x: [UN, XL, COL.whole], y: [UN, 90, COL.nat], one: [UN, UN, COL.int] };
function atile(p, kind, x, y, neg = false, o = 0) {
  const [w, h, c] = TS[kind], g = G(p, { x, y, o, s: o ? 1 : .6 });
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 5, fill: neg ? COL.board : mix(COL.board, c, .55), stroke: neg ? COL.bad : c, 'stroke-width': neg ? 3.5 : 2.5, 'stroke-dasharray': neg ? '7 5' : '' }, g);
  g.kind = kind; g.neg = neg;
  return g;
}
const popIn = (els, t0, step = .08) => els.forEach((e, i) => tw(e, { o: 1, s: 1 }, t0 + i * step, .35, back));
// n tiles of a kind in a row starting at x.
const tileRow = (p, kind, n, x, y, neg = false, gap = 12) => Array.from({ length: n }, (_, i) => atile(p, kind, x + i * (TS[kind][0] + gap), y, neg));
// Pair each negative tile with a positive one: they move together and vanish.
function cancel(pos, negs, t0) {
  negs.forEach((n, i) => {
    const a = pos[i];
    tw(n, { x: st(a).x, y: st(a).y }, t0 + i * .3, .6);
    tw(n, { o: 0, s: .5 }, t0 + i * .3 + .7, .3); tw(a, { o: 0, s: .5 }, t0 + i * .3 + .7, .3);
  });
}
/* ---------- inequality graphs (ch26, ch27) ---------- */
// Solution ray on the number line: endpoint v, closed or open circle, dir +1 (right) or −1 (left).
function ray(p, v, closed, dir, t0, color = COL.task, run = tw) {
  const end = X(dir > 0 ? 5.7 : -5.7), g = G(p, { o: 1 });
  const line = path(g, `M${X(v)} ${Y0}H${end}`, { stroke: color, 'stroke-width': 7 }, { d: 0 });
  const head = path(g, `M${end - 18 * dir} ${Y0 - 13}L${end} ${Y0}L${end - 18 * dir} ${Y0 + 13}`, { stroke: color, 'stroke-width': 6 }, { o: 0 });
  const dot = G(g, { x: X(v), y: Y0, s: 0, o: 0 });
  mk('circle', { r: 13, fill: closed ? color : COL.board, stroke: color, 'stroke-width': 4 }, dot);
  run(dot, { s: 1, o: 1 }, t0, .4, back);
  run(line, { d: 1 }, t0 + .3, .8); run(head, { o: 1 }, t0 + 1, .2);
  return g;
}
// Segment between a and b on the number line, each end open or closed.
function segment(p, a, b, ca, cb, t0, color = COL.task, run = tw) {
  const g = G(p, { o: 1 });
  const line = path(g, `M${X(a)} ${Y0}H${X(b)}`, { stroke: color, 'stroke-width': 7 }, { d: 0 });
  const ends = [[a, ca], [b, cb]].map(([v, c]) => {
    const d = G(g, { x: X(v), y: Y0, s: 0, o: 0 });
    mk('circle', { r: 13, fill: c ? color : COL.board, stroke: color, 'stroke-width': 4 }, d);
    run(d, { s: 1, o: 1 }, t0, .4, back);
    return d;
  });
  run(line, { d: 1 }, t0 + .3, .8);
  g.parentNode.appendChild(g); ends.forEach(e => g.appendChild(e));
  return g;
}
/* ---------- equation steps (ch25 onward) ---------- */
// One line of an equation or inequality with its sign at xEq, so a column of steps lines up. note: grey hint on the right.
function eqLine(p, L, R, y, t0, { xEq = 760, fill = COL.chalk, size = 50, note, sym = '=', symFill, noteX = 1180 } = {}) {
  const g = G(p, { o: 0 });
  M(g, [].concat(L), { x: xEq - size * .6, y, size, fill, anchor: 'end' });
  M(g, [sym], { x: xEq, y, size, fill: symFill || fill });
  M(g, [].concat(R), { x: xEq + size * .6, y, size, fill, anchor: 'start' });
  if (note) T(g, note, { x: noteX, y: y - 8, size: 26, fill: COL.task, weight: 600 });
  show(g, t0);
  return g;
}
/* ---------- data on a number line: dot plots (unit 7) ---------- */
// Axis for data from lo to hi drawn between x0 and x1 at baseline y; every: label every n-th tick.
// shape 'x' draws line-plot crosses instead of dots.
// Returns D: D.V(value) -> x; D.dot(v, color, t0) stacks a dot above v; D.mark(v, color, t0, label) is a
// balance triangle under the axis that can slide with D.slide(mark, v, t0).
function dataLine(p, { lo, hi, x0 = 200, x1 = 1400, y = 600, step = 1, every = 1, t0 = .1, r = 13, size = 22, shape = 'dot' }) {
  const V = v => x0 + (v - lo) / (hi - lo) * (x1 - x0), g = G(p, { o: 0 });
  path(g, `M${x0 - 24} ${y}H${x1 + 24}`, { stroke: COL.dim, 'stroke-width': 3 });
  for (let v = lo, i = 0; v <= hi + 1e-9; v += step, i++) {
    path(g, `M${V(v)} ${y - 7}V${y + 7}`, { stroke: COL.dim, 'stroke-width': 2 });
    if (i % every === 0) T(g, num(+v.toFixed(6)), { x: V(v), y: y + 26 + size, size, fill: COL.dim, font: MATH, anchor: 'middle' });
  }
  show(g, t0);
  const D = {
    g, V, y, r, count: {},
    top: v => y - 6 - r - ((D.count[v] || 1) - 1) * (2 * r + 5),
    dot(v, color, t0, { run = tw, into = p, from } = {}) {
      D.count[v] = (D.count[v] || 0) + 1;
      let d;
      if (shape === 'x') { d = G(into); path(d, `M${-r * .75} ${-r * .75}L${r * .75} ${r * .75}M${r * .75} ${-r * .75}L${-r * .75} ${r * .75}`, { stroke: color, 'stroke-width': 5 }); }
      else d = mk('circle', { r, fill: color, stroke: COL.board, 'stroke-width': 2 }, into);
      put(d, { x: V(v), y: D.top(v), s: 0, o: 0 });
      if (from !== undefined) { put(d, { y: from, s: 1 }); run(d, { o: 1 }, t0, .2); run(d, { y: D.top(v) }, t0, .7, back); }
      else run(d, { s: 1, o: 1 }, t0, .45, back);
      return d;
    },
    dots: (vals, color, t0, gap = .15, opts) => vals.map((v, i) => D.dot(v, color, t0 + i * gap, opts)),
    mark(v, color, t0, label, { run = tw, into = p } = {}) {
      const m = G(into, { x: V(v), y, o: 0 });
      path(m, 'M0 4L-17 30H17Z', { fill: color, stroke: COL.board, 'stroke-width': 2 });
      if (label) T(m, label, { y: 64 + size, size: 24, fill: color, weight: 600, anchor: 'middle' });
      run(m, { o: 1 }, t0, .4);
      return m;
    },
    slide: (m, v, t0, run = tw, dur = 1.2) => run(m, { x: V(v) }, t0, dur),
    // Bracket above the data from a to b at height yb, with a label.
    span(a, b, yb, label, color, t0, { run = tw, into = p } = {}) {
      const g = G(into), l = path(g, `M${V(a)} ${yb + 12}V${yb}H${V(b)}V${yb + 12}`, { stroke: color, 'stroke-width': 3 }, { d: 0 });
      run(l, { d: 1 }, t0, .6);
      const t = M(g, [label], { x: (V(a) + V(b)) / 2, y: yb - 14, size: 28, fill: color, o: 0 });
      run(t, { o: 1 }, t0 + .4, .4);
      return g;
    },
  };
  return D;
}
/* ---------- chance: number cubes, coins, spinners (unit 7) ---------- */
// A number cube face showing n pips, centred on (x, y).
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function die(p, n, x, y, s = 96, o = 0) {
  const g = G(p, { x, y, o, s: o ? 1 : .6 });
  g._box = mk('rect', { x: -s / 2, y: -s / 2, width: s, height: s, rx: s * .18, fill: mix(COL.board, COL.chalk, .1), stroke: COL.chalk, 'stroke-width': 3 }, g);
  PIPS[n].forEach(([a, b]) => mk('circle', { cx: a * s * .26, cy: b * s * .26, r: s * .085, fill: COL.chalk }, g));
  return g;
}
// Spinner with equal sections; pointer starts straight up. land(k) is the rotation that points at section k.
const SPIN = [COL.whole, COL.nat, COL.int, COL.whole, COL.irr, COL.nat, COL.whole, COL.int];
function spinner(p, cx, cy, r, t0, cols = SPIN) {
  const g = G(p, { x: cx, y: cy, o: 0 }), n = cols.length, secs = [];
  cols.forEach((c, i) => {
    const a1 = (-90 + i * 360 / n) * Math.PI / 180, a2 = (-90 + (i + 1) * 360 / n) * Math.PI / 180;
    secs.push(path(g, `M0 0L${r * Math.cos(a1)} ${r * Math.sin(a1)}A${r} ${r} 0 0 1 ${r * Math.cos(a2)} ${r * Math.sin(a2)}Z`,
      { fill: mix(COL.board, c, .7), stroke: COL.board, 'stroke-width': 3 }));
  });
  mk('circle', { r, fill: 'none', stroke: COL.chalk, 'stroke-width': 3 }, g);
  const ptr = G(g);
  path(ptr, `M0 ${r * .12}V${-r * .78}M-14 ${-r * .66}L0 ${-r * .8}L14 ${-r * .66}`, { stroke: COL.chalk, 'stroke-width': 7 });
  mk('circle', { r: 12, fill: COL.chalk }, g);
  show(g, t0);
  return { g, secs, ptr, land: k => (k + .5) * 360 / n };
}
// Outline some spinner sections: a bright border that fades in.
function outline(p, sp, ks, color, t0, run = tw) {
  return ks.map(k => { const e = sp.secs[k].cloneNode(); e.setAttribute('fill', 'none'); e.setAttribute('stroke', color); e.setAttribute('stroke-width', 7); sp.g.insertBefore(e, sp.ptr); put(e, { o: 0 }); run(e, { o: 1 }, t0, .4); return e; });
}
// A coin face.
function coin(p, side, x, y, t0, r = 34, run = tw) {
  const g = G(p, { x, y, s: .5, o: 0 });
  mk('circle', { r, fill: mix(COL.board, side === 'H' ? COL.int : COL.rat, .5), stroke: side === 'H' ? COL.int : COL.rat, 'stroke-width': 3 }, g);
  T(g, side, { y: r * .36, size: r, fill: COL.chalk, weight: 700, anchor: 'middle' });
  run(g, { s: 1, o: 1 }, t0, .45, back);
  return g;
}
/* ---------- scaled axes for data and real-world graphs (ch41 onward) ---------- */
// Axes with a scale on each; returns value -> pixel maps. ybreak draws a zigzag when y does not start at 0.
function axes(p, { x0, y0, w, h, xs: [xlo, xhi, xst], ys: [ylo, yhi, yst], xl, yl, t0, ybreak }) {
  const PX = v => x0 + (v - xlo) / (xhi - xlo) * w, PY = v => y0 - (v - ylo) / (yhi - ylo) * h, g = G(p, { o: 0 });
  let d = '';
  for (let v = xlo + xst; v <= xhi + 1e-9; v += xst) d += `M${PX(v)} ${y0}V${y0 - h}`;
  for (let v = ylo + yst; v <= yhi + 1e-9; v += yst) d += `M${x0} ${PY(v)}H${x0 + w}`;
  mk('path', { d, stroke: COL.chalk, 'stroke-opacity': .1, 'stroke-width': 1.5, fill: 'none' }, g);
  path(g, `M${x0} ${y0 - h - 20}V${y0}H${x0 + w + 20}`, { stroke: COL.chalk, 'stroke-width': 3 });
  if (ybreak) path(g, `M${x0 - 10} ${y0 - 22}L${x0 + 10} ${y0 - 30}M${x0 - 10} ${y0 - 34}L${x0 + 10} ${y0 - 42}`, { stroke: COL.chalk, 'stroke-width': 3 });
  for (let v = xlo; v <= xhi + 1e-9; v += xst) T(g, String(v), { x: PX(v), y: y0 + 30, size: 20, fill: COL.dim, font: MATH, anchor: 'middle' });
  for (let v = ylo; v <= yhi + 1e-9; v += yst) T(g, String(v), { x: x0 - 14, y: PY(v) + 7, size: 20, fill: COL.dim, font: MATH, anchor: 'end' });
  T(g, xl, { x: x0 + w / 2, y: y0 + 66, size: 24, fill: COL.dim, anchor: 'middle' });
  T(g, yl, { x: x0, y: y0 - h - 36, size: 24, fill: COL.dim, anchor: 'middle' });
  show(g, t0);
  return { PX, PY };
}
/* ---------- area grids for multiplying and factoring polynomials (ch51 onward) ---------- */
// Area grid from (x0, y0): column widths ws, row heights hs, factor terms along the top and the left side.
function areaGrid(p, x0, y0, ws, hs, colLab, rowLab, t0, { size = 40 } = {}) {
  const xs = [x0], ys = [y0];
  ws.forEach(w => xs.push(xs.at(-1) + w)); hs.forEach(h => ys.push(ys.at(-1) + h));
  let d = '';
  xs.forEach(x => { d += `M${x} ${y0}V${ys.at(-1)}`; }); ys.forEach(y => { d += `M${x0} ${y}H${xs.at(-1)}`; });
  draw(path(p, d, { stroke: COL.chalk, 'stroke-width': 3 }, { d: 0 }), t0, .9);
  colLab.forEach((l, j) => show(M(p, [].concat(l), { x: (xs[j] + xs[j + 1]) / 2, y: y0 - 22, size, fill: COL.whole, o: 0 }), t0 + .3 + j * .15));
  rowLab.forEach((l, i) => show(M(p, [].concat(l), { x: x0 - 24, y: (ys[i] + ys[i + 1]) / 2 + size * .35, size, fill: COL.nat, anchor: 'end', o: 0 }), t0 + .3 + i * .15));
  const box = (i, j, pad) => ({ x: xs[j] + pad, y: ys[i] + pad, width: xs[j + 1] - xs[j] - 2 * pad, height: ys[i + 1] - ys[i] - 2 * pad });
  return {
    xs, ys,
    cell(i, j, parts, t0, { fill = COL.chalk, tint, run = tw, into = p } = {}) {
      if (tint) { const r = put(mk('rect', { ...box(i, j, 3), fill: tint }, into), { o: 0 }); into.insertBefore(r, into.firstChild); run(r, { o: .3 }, t0, .4); }
      const e = M(into, [].concat(parts), { x: (xs[j] + xs[j + 1]) / 2, y: (ys[i] + ys[i + 1]) / 2 + size * .35, size, fill, o: 0, s: .6 });
      run(e, { o: 1, s: 1 }, t0, .4, back);
      return e;
    },
    ring(i, j, color, t0, run = tw, into = p) { const r = put(mk('rect', { ...box(i, j, 8), rx: 12, fill: 'none', stroke: color, 'stroke-width': 4.5 }, into), { o: 0 }); run(r, { o: 1 }, t0, .3); return r; },
  };
}
// A curved arrow from (x1, y1) to (x2, y2) bending up (h < 0) or down (h > 0).
function arc(p, x1, y1, x2, y2, h, color, t0, run = tw) {
  const mx = (x1 + x2) / 2, l = path(p, `M${x1} ${y1}Q${mx} ${y1 + h} ${x2} ${y2}`, { stroke: color, 'stroke-width': 3.5 }, { d: 0 });
  run(l, { d: 1 }, t0, .5);
  return l;
}

/* ---------- built-up fractions with math above and below the bar (ch60 onward) ---------- */
// Width of math parts at a size, without leaving anything on the stage.
function mathW(parts, size) { const e = M(scene, [].concat(parts), { size, o: 0 }), w = e._w; e.remove(); return w; }
// A built-up fraction whose top and bottom are math parts (they may hold radicals); bar on y. Returns { g, w, t, b, x0 }.
function frac(p, top, bot, x, y, t0, { size = 56, fill = COL.chalk, anchor = 'start', topFill, botFill } = {}) {
  const g = G(p, { o: 0 });
  const w = Math.max(mathW(top, size), mathW(bot, size)) + size * .3;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  const t = M(g, [].concat(top), { x: x0 + w / 2, y: y - size * .25, size, fill: topFill || fill });
  const b = M(g, [].concat(bot), { x: x0 + w / 2, y: y + size * 1.05, size, fill: botFill || fill });
  path(g, `M${x0} ${y}H${x0 + w}`, { stroke: fill, 'stroke-width': size * .05 });
  if (t0 !== undefined) show(g, t0);
  return { g, w, t, b, x0 };
}

/* ---------- coordinate plane (unit 6 onward) ---------- */
// Grid centred on the origin at (cx, cy); u pixels per unit; x from x0 to x1, y from y0 to y1.
// Returns { g, PX, PY, u, ... } with helpers to plot points, walk to a point, and draw lines.
// The grid stays in p; marks go into P.layer (set it to the current panel so marks clear with the step) or opts.into.
function plane(p, { cx = 800, cy = 450, u = 50, x0 = -6, x1 = 6, y0 = -6, y1 = 6, t0 = .1, labels = true, step = 1 } = {}) {
  const PX = x => cx + x * u, PY = y => cy - y * u, g = G(p, { o: 0 });
  let d = '';
  for (let x = x0; x <= x1; x++) if (x) d += `M${PX(x)} ${PY(y0)}V${PY(y1)}`;
  for (let y = y0; y <= y1; y++) if (y) d += `M${PX(x0)} ${PY(y)}H${PX(x1)}`;
  mk('path', { d, stroke: COL.chalk, 'stroke-opacity': .1, 'stroke-width': 1.5, fill: 'none' }, g);
  const ax = { stroke: COL.chalk, 'stroke-width': 3 };
  path(g, `M${PX(x0 - .5)} ${cy}H${PX(x1 + .5)}M${PX(x1 + .5) - 14} ${cy - 9}L${PX(x1 + .5)} ${cy}L${PX(x1 + .5) - 14} ${cy + 9}`, ax);
  path(g, `M${cx} ${PY(y0 - .5)}V${PY(y1 + .5)}M${cx - 9} ${PY(y1 + .5) + 14}L${cx} ${PY(y1 + .5)}L${cx + 9} ${PY(y1 + .5) + 14}`, ax);
  T(g, 'x', { x: PX(x1 + .5) + 10, y: cy + 30, size: 28, fill: COL.dim, font: MATH, anchor: 'middle' }).setAttribute('font-style', 'italic');
  T(g, 'y', { x: cx - 26, y: PY(y1 + .5) + 10, size: 28, fill: COL.dim, font: MATH, anchor: 'middle' }).setAttribute('font-style', 'italic');
  if (labels) {
    for (let x = x0; x <= x1; x += step) if (x) T(g, num(x), { x: PX(x), y: cy + 26, size: 18, fill: COL.dim, font: MATH, anchor: 'middle' });
    for (let y = y0; y <= y1; y += step) if (y) T(g, num(y), { x: cx - 12, y: PY(y) + 6, size: 18, fill: COL.dim, font: MATH, anchor: 'end' });
  }
  show(g, t0, .5);
  const P = {
    g, PX, PY, u, cx, cy, x0, x1, y0, y1, layer: null,
    dot(x, y, color, t0, { r = 10, label, run = tw, dx = 14, dy = -14, anchor = 'start', into = P.layer || p, open = false } = {}) {
      const d = G(into, { x: PX(x), y: PY(y), s: 0, o: 0 });
      mk('circle', open ? { r, fill: COL.board, stroke: color, 'stroke-width': 3.5 } : { r, fill: color, stroke: COL.board, 'stroke-width': 2 }, d);
      run(d, { s: 1, o: 1 }, t0, .4, back);
      if (label) { const l = M(into, [label], { x: PX(x) + dx, y: PY(y) + dy, size: 26, fill: color, anchor, o: 0 }); run(l, { o: 1 }, t0 + .2, .3); }
      return d;
    },
    // Walk from the origin: along x, then along y, drawing arrows; then a dot.
    walk(x, y, t0, { cx: colX = COL.whole, cy: colY = COL.nat, run = tw, color = COL.task, label, into = P.layer || p } = {}) {
      const a = path(into, `M${PX(0)} ${PY(0)}H${PX(x)}`, { stroke: colX, 'stroke-width': 5 }, { d: 0 });
      const b = path(into, `M${PX(x)} ${PY(0)}V${PY(y)}`, { stroke: colY, 'stroke-width': 5 }, { d: 0 });
      run(a, { d: 1 }, t0, .3 + Math.abs(x) * .12, lin);
      run(b, { d: 1 }, t0 + .4 + Math.abs(x) * .12, .3 + Math.abs(y) * .12, lin);
      return P.dot(x, y, color, t0 + .8 + (Math.abs(x) + Math.abs(y)) * .12, { run, label, into });
    },
    // Arrow from (xa, ya) to (xb, yb) with an optional label beside its middle.
    arrow(xa, ya, xb, yb, color, t0, { label, run = tw, into = P.layer || p } = {}) {
      const a = [PX(xa), PY(ya)], b = [PX(xb), PY(yb)], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      const l = path(into, `M${a[0]} ${a[1]}L${b[0]} ${b[1]}M${b[0] - 12 * ux - 8 * uy} ${b[1] - 12 * uy + 8 * ux}L${b[0]} ${b[1]}L${b[0] - 12 * ux + 8 * uy} ${b[1] - 12 * uy - 8 * ux}`, { stroke: color, 'stroke-width': 4 }, { d: 0 });
      run(l, { d: 1 }, t0, .5);
      if (label !== undefined) {
        const vert = Math.abs(uy) > Math.abs(ux);
        const t = M(into, [label], { x: (a[0] + b[0]) / 2 + (vert ? -24 : 0), y: (a[1] + b[1]) / 2 + (vert ? 9 : -12), size: 26, fill: color, anchor: vert ? 'end' : 'middle', o: 0 });
        run(t, { o: 1 }, t0 + .3, .3);
      }
      return l;
    },
    // One slope step from (x, y): rise first (irr green), then run (real violet).
    stair(x, y, rise, runX, t0, { run = tw, into = P.layer || p, labels = true } = {}) {
      P.arrow(x, y, x, y + rise, COL.irr, t0, { label: labels ? num(rise) : undefined, run, into });
      P.arrow(x, y + rise, x + runX, y + rise, COL.real, t0 + .6, { label: labels ? num(runX) : undefined, run, into });
    },
    // Shade the region where every a·x + b·y ≥ c in the list holds, clipped to the grid.
    region(list, color, t0, { run = tw, into = P.layer || p, o = .22 } = {}) {
      let pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      for (const [a, b, c] of list) {
        const f = ([x, y]) => a * x + b * y - c, next = [];
        pts.forEach((v, i) => {
          const w = pts[(i + 1) % pts.length], fv = f(v), fw = f(w);
          if (fv >= 0) next.push(v);
          if (fv * fw < 0) { const t = fv / (fv - fw); next.push([v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]); }
        });
        pts = next;
      }
      const e = path(into, pts.length ? 'M' + pts.map(([x, y]) => `${PX(x)} ${PY(y)}`).join('L') + 'Z' : '', { fill: color, stroke: 'none' }, { o: 0 });
      into.insertBefore(e, into.firstChild);
      run(e, { o }, t0, .6);
      return e;
    },
    half: (a, b, c, color, t0, opts) => P.region([[a, b, c]], color, t0, opts),
    // Graph of y = f(x) for x from xa to xb, drawn on; the part outside the grid's y range is cut off.
    fn(f, xa, xb, color, t0, { run = tw, w = 4, into = P.layer || p, n = 160, dur = 1.2 } = {}) {
      let d = '', pen = false;
      for (let i = 0; i <= n; i++) {
        const x = xa + (xb - xa) * i / n, y = f(x), inside = y >= y0 - .5 && y <= y1 + .5;
        if (inside) { d += `${pen ? 'L' : 'M'}${PX(x).toFixed(1)} ${PY(y).toFixed(1)}`; pen = true; } else pen = false;
      }
      const l = path(into, d, { stroke: color, 'stroke-width': w }, { d: 0 });
      run(l, { d: 1 }, t0, dur);
      return l;
    },
    // Line through two points, extended to the edge of the grid.
    line(xa, ya, xb, yb, color, t0, { run = tw, w = 4, dash, into = P.layer || p } = {}) {
      const dx = xb - xa, dy = yb - ya, ts = [];
      const clip = (t, v, lo, hi) => { if (v >= lo - 1e-9 && v <= hi + 1e-9) ts.push(t); };
      if (dx) { for (const X of [x0, x1]) { const t = (X - xa) / dx; clip(t, ya + t * dy, y0, y1); } }
      if (dy) { for (const Y of [y0, y1]) { const t = (Y - ya) / dy; clip(t, xa + t * dx, x0, x1); } }
      const t1 = Math.min(...ts), t2 = Math.max(...ts);
      // A dashed line fades in: drawing it on would need the dash array for the reveal.
      const l = path(into, `M${PX(xa + t1 * dx)} ${PY(ya + t1 * dy)}L${PX(xa + t2 * dx)} ${PY(ya + t2 * dy)}`, { stroke: color, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }, dash ? { o: 0 } : { d: 0 });
      run(l, dash ? { o: 1 } : { d: 1 }, t0, dash ? .6 : 1);
      return l;
    },
  };
  return P;
}
// Question: pick a grid point. ans = [x, y]; no(x, y) explains a wrong pick. Arrows move a cursor, Enter picks.
// test(x, y), when given, accepts any point it approves; ans is then the point Show answer uses.
const pickPoint = (P, ans, yes, no, onRight, test) => (body, api) => {
  const L = qlayer();
  let cur = [0, 0], locked = false;
  const cursor = G(L, { x: P.PX(0), y: P.PY(0) });
  mk('circle', { r: 16, fill: 'none', stroke: COL.task, 'stroke-width': 3 }, cursor);
  let tag = null;
  const moveTo = (x, y) => {
    cur = [Math.max(P.x0, Math.min(P.x1, x)), Math.max(P.y0, Math.min(P.y1, y))];
    put(cursor, { x: P.PX(cur[0]), y: P.PY(cur[1]) });
    tag?.remove();
    tag = M(L, [`(${num(cur[0])}, ${num(cur[1])})`], { x: P.PX(cur[0]) + 22, y: P.PY(cur[1]) - 18, size: 24, fill: COL.task, anchor: 'start' });
  };
  moveTo(0, 0);
  const pick = () => {
    if (locked) return;
    const [x, y] = cur;
    if (test ? test(x, y) : x === ans[0] && y === ans[1]) { P.dot(x, y, COL.good, 0, { run: fx, into: L }); onRight?.(); api.grade(true, typeof yes === 'function' ? yes(x, y) : yes); }
    else { const d = P.dot(x, y, COL.bad, 0, { run: fx, r: 8, into: L }); fx(d, { o: 0 }, 1.2, .4); shakeFx(cursor); api.grade(false, no(x, y)); }
  };
  const hit = mk('rect', { x: P.PX(P.x0 - .5), y: P.PY(P.y1 + .5), width: (P.x1 - P.x0 + 1) * P.u, height: (P.y1 - P.y0 + 1) * P.u, fill: 'transparent' }, L);
  L.insertBefore(hit, L.firstChild);
  hit.style.cursor = 'crosshair';
  hit.addEventListener('click', e => {
    if (locked) return;
    const s = $('stage'), pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(s.getScreenCTM().inverse());
    moveTo(Math.round((q.x - P.cx) / P.u), Math.round((P.cy - q.y) / P.u));
    pick();
  });
  return {
    reveal() { moveTo(...ans); P.dot(ans[0], ans[1], COL.good, 0, { run: fx, into: L }); onRight?.(); return typeof yes === 'function' ? yes(...ans) : yes; },
    lock() { locked = true; },
    hint: [kbd('←'), kbd('↑'), kbd('↓'), kbd('→'), ' move, ', kbd('Enter'), ' choose, or click the grid'],
    key(e) {
      if (locked) return false;
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (d) { moveTo(cur[0] + d[0], cur[1] + d[1]); return true; }
      if (e.key === 'Enter') { pick(); return true; }
      return false;
    },
  };
};
/* ---------- signed numbers: number-line moves and plus/minus tiles ---------- */
const POS = COL.whole, NEG = COL.nat;           // positive: blue, negative: coral
// Integer number line from lo to hi with arrows at both ends, drawn into S.line.
function numberLine(t0 = .1, lo = -8, hi = 8) {
  const L = S.line;
  draw(path(L, `M${X(lo - .7)} ${Y0}H${X(hi + .7)}`, { stroke: COL.chalk, 'stroke-width': 3 }, { d: 0 }), t0, .8);
  for (const [x, d] of [[X(hi + .7), 1], [X(lo - .7), -1]]) {
    show(path(L, `M${x - 15 * d} ${Y0 - 10}L${x} ${Y0}L${x - 15 * d} ${Y0 + 10}`, { stroke: COL.chalk, 'stroke-width': 3 }, { o: 0 }), t0 + .7, .3);
  }
  for (let v = lo; v <= hi; v++) show(tick(v), t0 + .2 + Math.abs(v) * .04, .4);
}
// A move along the number line from a to b, drawn as an arrow at height y. run = tw (lesson) or fx (answer).
function move(p, a, b, y, t0, run = tw) {
  const x1 = X(a), x2 = X(b), d = Math.sign(b - a), color = d > 0 ? POS : NEG;
  const dur = .35 + Math.abs(b - a) * .09;
  const line = path(p, `M${x1} ${y}H${x2}`, { stroke: color, 'stroke-width': 5 }, { d: 0 });
  const head = path(p, `M${x2 - 15 * d} ${y - 11}L${x2} ${y}L${x2 - 15 * d} ${y + 11}`, { stroke: color, 'stroke-width': 5 }, { o: 0 });
  const lab = T(p, (d > 0 ? '+' : '−') + Math.abs(b - a), { x: (x1 + x2) / 2, y: y - 16, size: 28, fill: color, font: MATH, anchor: 'middle', o: 0 });
  const drop = path(p, `M${x2} ${y + 12}V${Y0 - 14}`, { stroke: color, 'stroke-width': 2, 'stroke-dasharray': '5 6' }, { o: 0 });
  run(line, { d: 1 }, t0, dur, lin); run(head, { o: 1 }, t0 + dur - .1, .15);
  run(lab, { o: 1 }, t0 + .2, .3); run(drop, { o: .8 }, t0 + dur, .3);
}
function landDot(p, v, t0, color = COL.chalk, run = tw) {
  const g = G(p, { x: X(v), y: Y0, s: 0, o: 0 });
  mk('circle', { r: 12, fill: color, stroke: COL.board, 'stroke-width': 2 }, g);
  run(g, { s: 1, o: 1 }, t0, .45, back);
  return g;
}
function tile(p, sign, x, y, o = 0) {
  const c = sign > 0 ? POS : NEG, g = G(p, { x, y, o, s: o ? 1 : .6 });
  mk('rect', { x: -27, y: -27, width: 54, height: 54, rx: 10, fill: mix(COL.board, c, .45), stroke: c, 'stroke-width': 2.5 }, g);
  M(g, [sign > 0 ? '+' : '−'], { y: 13, size: 40 });
  return g;
}
const tiles = (p, n, sign, x0, y, gap = 70) => Array.from({ length: n }, (_, i) => tile(p, sign, x0 + i * gap, y));
const popAll = (els, t0, step = .08) => els.forEach((e, i) => tw(e, { o: 1, s: 1 }, t0 + i * step, .35, back));
// Circle each plus/minus pair, then let the pairs vanish: they make zero.
function cancelPairs(p, tops, bottoms, t0) {
  tops.forEach((a, i) => {
    const b = bottoms[i], x = st(a).x, y1 = st(a).y, y2 = st(b).y;
    const ring = put(mk('rect', { rx: 18, fill: 'none', stroke: COL.dim, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }, p),
      { o: 0, a_x: x - 38, a_y: y1 - 38, a_width: 76, a_height: y2 - y1 + 76 });
    tw(ring, { o: 1 }, t0 + i * .2, .3);
    for (const e of [a, b, ring]) tw(e, { o: 0, ...(e === ring ? {} : { s: .5 }) }, t0 + 1.4 + i * .1, .4);
  });
}
function brace(p, a, b, y, label, color, t0) {
  const x1 = X(a), x2 = X(b);
  draw(path(p, `M${x1} ${y - 10}V${y}H${x2}V${y - 10}`, { stroke: color, 'stroke-width': 3 }, { d: 0 }), t0, .6);
  show(T(p, label, { x: (x1 + x2) / 2, y: y + 34, size: 26, fill: color, anchor: 'middle', o: 0 }), t0 + .4);
}

// Inline math for HTML text.
function mathEl(parts, size = 22) {
  const svg = mk('svg', { class: 'm', 'font-weight': 400 });   // widths are measured at normal weight, so a bold prompt must not thicken the math
  const m = M(svg, parts, { size, anchor: 'start', fill: 'currentColor' });
  const top = size * 1.05, h = size * 1.5;
  svg.setAttribute('viewBox', `0 ${-top} ${m._w + 2} ${h}`);
  svg.setAttribute('width', m._w + 2);
  svg.setAttribute('height', h);
  svg.style.verticalAlign = `${-size * .45}px`;  // line up the math baseline with the text baseline
  return svg;
}

/* ---------- number map geometry ---------- */
const RINGS = {
  real: { cx: 640, cy: 470, rx: 610, ry: 390, lx: 640, ly: 128 },
  rat: { cx: 500, cy: 480, rx: 400, ry: 320, lx: 500, ly: 202 },
  int: { cx: 500, cy: 510, rx: 300, ry: 250, lx: 500, ly: 302 },
  whole: { cx: 500, cy: 540, rx: 210, ry: 180, lx: 500, ly: 400 },
  nat: { cx: 500, cy: 570, rx: 125, ry: 110, lx: 500, ly: 500 },
  irr: { cx: 1060, cy: 480, rx: 140, ry: 170, lx: 1060, ly: 360 },
};
const CHAIN = { nat: ['nat', 'whole', 'int', 'rat', 'real'], whole: ['whole', 'int', 'rat', 'real'], int: ['int', 'rat', 'real'], rat: ['rat', 'real'], irr: ['irr', 'real'], real: ['real'] };
const ell = r => `M${r.cx} ${r.cy - r.ry}A${r.rx} ${r.ry} 0 1 1 ${r.cx} ${r.cy + r.ry}A${r.rx} ${r.ry} 0 1 1 ${r.cx} ${r.cy - r.ry}`;
const inRing = (k, x, y) => { const r = RINGS[k]; return ((x - r.cx) / r.rx) ** 2 + ((y - r.cy) / r.ry) ** 2 <= 1; };
function regionAt(x, y) {
  for (const k of ['nat', 'whole', 'int', 'rat', 'irr', 'real']) if (inRing(k, x, y)) return k;
  return null;
}
function buildVenn(parent, hidden) {
  const out = {};
  for (const k of ['real', 'rat', 'int', 'whole', 'nat', 'irr']) {
    const r = RINGS[k], g = G(parent);
    const fill = path(g, ell(r), { fill: mix(COL.board, COL[k], k === 'real' ? .1 : .16), stroke: 'none' }, { o: hidden ? 0 : 1 });
    const stroke = path(g, ell(r), { stroke: COL[k], 'stroke-width': 3 }, hidden ? { d: 0, 'a_stroke-width': 3 } : { 'a_stroke-width': 3 });
    const lab = T(g, NAME[k], { x: r.lx, y: r.ly, size: 26, fill: COL[k], weight: 600, anchor: 'middle', o: hidden ? 0 : 1 });
    out[k] = { g, fill, stroke, lab };
  }
  return out;
}

/* ---------- timeline ---------- */
let TW = [];
const io = p => p < .5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
const out = p => 1 - (1 - p) ** 3;
const back = p => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;
const lin = p => p;
function tw(e, to, t0, dur = .6, ease = io) { TW.push({ e, to, t0, dur, ease }); }
function prog(pf, t0, dur, ease = io) { TW.push({ pf, t0, dur, ease }); }
const show = (e, t0, dur = .5) => tw(e, { o: 1 }, t0, dur);
const hide = (e, t0, dur = .5) => tw(e, { o: 0 }, t0, dur);
const draw = (e, t0, dur = .9) => tw(e, { d: 1 }, t0, dur);
const pop = (e, t0) => tw(e, { s: 1, o: 1 }, t0, .45, back);
function pulse(e, t0, k = 1.7) { tw(e, { s: k }, t0, .22, out); tw(e, { s: 1 }, t0 + .22, .4); }
function glow(key, t0) {
  const s = S.ring[key].stroke;
  tw(s, { 'a_stroke-width': 9 }, t0, .22, out); tw(s, { 'a_stroke-width': 3 }, t0 + .25, .5);
}
function glowRun(key, t0) { CHAIN[key].forEach((k, i) => glow(k, t0 + i * .3)); }
function stream(t, str, t0, dur) { prog(q => { t.textContent = str.slice(0, Math.round(q * str.length)); }, t0, dur, lin); }
function mix(a, b, q) {
  const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * q).toString(16).padStart(2, '0')).join('');
}
// A colour or attribute tween with no starting value in the state starts from the element's attribute.
const fromAttr = (e, k) => k.startsWith('c_') ? e.getAttribute(k.slice(2)) : k.startsWith('a_') ? parseFloat(e.getAttribute(k.slice(2))) : undefined;
function evalTo(t, list = TW) {
  for (const w of list) {
    if (w.done || t < w.t0) continue;
    if (!w.go) { w.go = 1; if (w.e) { const s = st(w.e); w.from = {}; for (const k in w.to) w.from[k] = s[k] ?? fromAttr(w.e, k); } }
    const p = w.dur ? Math.min(1, (t - w.t0) / w.dur) : 1, q = w.ease(p);
    if (w.e) {
      const s = st(w.e);
      for (const k in w.to) s[k] = k.startsWith('c_') ? mix(w.from[k], w.to[k], q) : w.from[k] + (w.to[k] - w.from[k]) * q;
      render(w.e);
    } else w.pf(q);
    if (p >= 1) w.done = 1;
  }
}

/* ---------- world clock and camera ---------- */
const soft = p => (1 - Math.cos(Math.PI * p)) / 2;   // gentle in-out, for camera moves
// Continuous motion: f(t) runs on every frame of the beat with t in seconds from its start (0..D).
// Keep f a pure function of t, so pause, seek and ?beat=N&t=S show the same frame.
const clockRun = (f, D) => { f(0); prog(q => f(q * D), 0, D, lin); };
// A camera looks at a world group through the stage (or a box, for split screen and picture-in-picture).
// The view {x, y, z, r} is the world point at the centre, the zoom (screen px per world px) and the roll in degrees.
// Moves are keyed on the beat clock: to(view, t0, dur, ease) blends each given key from its value at t0; a key may be a
// function of t (follow). Unspecified keys keep following the earlier moves. dur 0 is a hard cut.
let camN = 0;
function camera(p, D, { box, x = 800, y = 450, z, r = 0, bg = COL.board } = {}) {
  const [bx, by, bw, bh] = box || [0, 0, 1600, 900];
  const el = G(p, { x: bx + bw / 2, y: by + bh / 2 });
  let hold = el;
  if (box) {
    const id = 'cam' + (++camN);
    mk('rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, rx: 18 }, mk('clipPath', { id }, mk('defs', {}, el)));
    hold = G(el); hold.setAttribute('clip-path', `url(#${id})`);
    mk('rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, fill: bg }, hold);
  }
  const view = mk('g', {}, hold), world = G(view);
  if (box) mk('rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, rx: 18, fill: 'none', stroke: COL.faint, 'stroke-width': 2 }, el);
  const v0 = { x, y, z: z ?? (box ? Math.min(bw / 1600, bh / 900) : 1), r };
  const ops = [], shakes = [], layers = [];
  const val = (v, t) => typeof v === 'function' ? v(t) : v;
  // The view at time t after the first n moves; each move remembers the view it starts from.
  function at(t, n = ops.length) {
    const s = { ...v0 };
    for (let i = 0; i < n && ops[i].t0 <= t; i++) {
      const o = ops[i], a = o.from || (o.from = at(o.t0, i));
      const q = o.dur ? o.ease(Math.min(1, (t - o.t0) / o.dur)) : 1, b = {};
      for (const k in o.v) b[k] = val(o.v[k], t);
      if ('z' in b) s.z = a.z * (b.z / a.z) ** q;   // even zoom speed
      // While zooming, x/y move so that one world point stays put on screen (when start and end allow it).
      const u = 'z' in b && Math.abs(b.z - a.z) > 1e-6 * a.z ? (1 / s.z - 1 / a.z) / (1 / b.z - 1 / a.z) : q;
      for (const k of ['x', 'y']) if (k in b) s[k] = a[k] + (b[k] - a[k]) * u;
      if ('r' in b) s.r = a.r + (b.r - a.r) * q;
    }
    return s;
  }
  function apply(t) {
    const s = at(t);
    let sx = 0, sy = 0;
    for (const k of shakes) if (t > k.t0 && t < k.t0 + k.dur) {
      const e = k.amp * Math.min(1, (t - k.t0) / .3, (k.t0 + k.dur - t) / .3), w = 2 * Math.PI * k.hz * t;
      sx += e * (Math.sin(w) + .5 * Math.sin(2.3 * w + 1)) / 1.5; sy += e * (Math.sin(1.7 * w + 2) + .5 * Math.sin(3.1 * w)) / 1.5;
    }
    const tf = `translate(${sx} ${sy}) rotate(${-s.r}) scale(${s.z}) translate(${-s.x} ${-s.y})`;
    if (tf !== view._tf) view.setAttribute('transform', view._tf = tf);
    const dx = s.x - v0.x, dy = s.y - v0.y;
    for (const L of layers) put(L.g, { x: L.wrap ? dx - ((L.k * dx) % L.wrap + L.wrap) % L.wrap : (1 - L.k) * dx, y: (1 - L.k) * dy });
  }
  const cam = { el, world, at,
    to(v, t0, dur = 1, ease = soft) { ops.push({ v, t0, dur, ease }); ops.sort((a, b) => a.t0 - b.t0); ops.forEach(o => delete o.from); return cam; },
    cut: (v, t0) => cam.to(v, t0, 0),
    shake(amp, t0, dur, hz = 7) { shakes.push({ amp, t0, dur, hz }); return cam; },
    // Parallax layer: k < 1 is far (moves slower than the camera), k > 1 near. With wrap = W the layer's content
    // repeats every W world px: draw one period plus the widest view, and the layer never runs out.
    layer(k = 1, wrap) { const g = G(world); layers.push({ g, k, wrap }); return g; },
    // Screen position of a world point at time t (k = 1 layers, no shake): for labels that track an object.
    screen(wx, wy, t) {
      const s = at(t), a = -s.r * Math.PI / 180, ux = (wx - s.x) * s.z, uy = (wy - s.y) * s.z;
      return [bx + bw / 2 + ux * Math.cos(a) - uy * Math.sin(a), by + bh / 2 + ux * Math.sin(a) + uy * Math.cos(a)];
    },
    // Put a screen-space label (text, anchor middle, outside the camera) over world point (wx, wy) at time t, kept
    // inside the frame or box by margin m; it fades out once the point itself leaves. Fade it in with a wrapper group.
    track(el, wx, wy, t, m = 24) {
      const [sx, sy] = cam.screen(wx, wy, t), str = el.textContent;
      if (el._tw?.[0] !== str) el._tw = [str, el.getComputedTextLength() / 2];
      const h = el._tw[1], away = Math.max(bx - sx, sx - bx - bw, 0);
      put(el, { x: Math.min(bx + bw - m - h, Math.max(bx + m + h, sx)), y: sy, o: Math.max(0, 1 - away / 80) });
    },
  };
  clockRun(apply, D);
  return cam;
}

/* ---------- scene ---------- */
const scene = document.getElementById('scene');
const S = {};
const AXIS = { o: 800, u: 120 };             // number line: x of 0, pixels per unit; a chapter may change it
const X = v => AXIS.o + AXIS.u * v, Y0 = 610;
const num = v => (v < 0 ? '−' : '') + Math.abs(v);
function reset() {
  scene.replaceChildren();
  for (const k in S) delete S[k];
  Object.assign(S, { dots: {}, tick: {}, rows: [], chips: [], samples: [], list: G(scene), line: G(scene), venn: G(scene) });
}
function tick(v) {
  const g = G(S.line, { o: 0 });
  path(g, `M${X(v)} ${Y0 - 11}V${Y0 + 11}`, { stroke: COL.dim, 'stroke-width': 2.5 });
  T(g, num(v), { x: X(v), y: Y0 + 50, size: 30, fill: COL.dim, font: MATH, anchor: 'middle' });
  return (S.tick[v] = g);
}
function dot(key, v, r = 9, name = v) {
  const g = G(S.line, { x: X(v), y: Y0, s: 0, o: 0 });
  mk('circle', { r, fill: COL[key], stroke: COL.board, 'stroke-width': 2 }, g);
  return (S.dots[name] = g);
}
const arrow = (x, dir) => `M${x - 15 * dir} ${Y0 - 10}L${x} ${Y0}L${x - 15 * dir} ${Y0 + 10}`;
function panel(t0) {
  if (t0 < .5) S.cleared = true;   // the old panel fades, or this is the first panel after the title
  const old = S.panel;
  if (old && t0 < .5) retire(old);
  else if (old) {   // a panel change later in the beat stays on the beat clock
    hide(old, t0, .4);
    prog(q => { if (q === 1) old.style.display = 'none'; }, t0 + .4, 0, lin);
  }
  return (S.panel = G(scene));
}
// Take a beat's old picture away on wall time: a 150 ms fade, then out of rendering. On the beat clock the fade would
// wait for the new clip's audio to start (a few hundred ms in Firefox) with the old, frozen scene still showing.
// While seeking, the pictures passed on the way were never seen: they go at once.
let seeking = false;
function retire(e) {
  if (seeking) { e.style.display = 'none'; return; }
  e.style.transition = 'opacity .15s linear';
  e.style.opacity = '0';
  setTimeout(() => { e.style.display = 'none'; }, 160);
}
function header(p, str, t0, x = 1000, y = 170) {
  const h = T(p, str, { x, y, size: 30, fill: COL.dim, weight: 600, o: 0 });
  show(h, t0);
  return h;
}

/* ---------- question effects: run on wall time, independent of the lesson clock ---------- */
let FX = [], clock = 0;
function fx(e, to, delay = 0, dur = .5, ease = io) { FX.push({ e, to, t0: clock + delay, dur, ease }); }
function fxp(pf, delay, dur, ease = io) { FX.push({ pf, t0: clock + delay, dur, ease }); }
function finishFx() { FX.sort((a, b) => a.t0 - b.t0); evalTo(Infinity, FX); FX = []; }
const pulseFx = (e, k = 1.8) => { if (!e) return; fx(e, { s: k }, 0, .22, out); fx(e, { s: 1 }, .22, .45); };
const shakeFx = e => { if (!e) return; const x0 = st(e).x; fxp(q => put(e, { x: x0 + Math.sin(q * Math.PI * 6) * (1 - q) * 12 }), 0, .55, lin); };
const glowFx = (key, delay = 0) => CHAIN[key].forEach((k, i) => {
  const s = S.ring[k].stroke;
  fx(s, { 'a_stroke-width': 9 }, delay + i * .28, .22, out); fx(s, { 'a_stroke-width': 3 }, delay + i * .28 + .25, .5);
});
function popDotFx(key, v, label) {
  const L = S.q || qlayer();
  const g = G(L, { x: X(v), y: Y0, s: 0, o: 0 });
  mk('circle', { r: 7, fill: COL[key], stroke: COL.board, 'stroke-width': 2 }, g);
  fx(g, { s: 1, o: 1 }, 0, .45, back);
  if (label) fx(M(L, label, { x: X(v) + 10, y: Y0 + 56, size: 28, fill: COL[key], o: 0 }), { o: 1 }, .3, .4);
}
function floatText(str, x, y, colr) {
  const t = T(S.q || qlayer(), str, { x, y: y + 14, size: 24, fill: colr, anchor: 'middle', weight: 600, o: 0 });
  fx(t, { o: 1, y }, 0, .5, out);
}
function hopsFx(n) {
  for (let k = 1; k <= -n; k++) {
    const a = X(1 - k), b = X(-k);
    fx(path(S.q, `M${a} ${Y0 - 12}Q${(a + b) / 2} ${Y0 - 84} ${b} ${Y0 - 12}`, { stroke: COL.int, 'stroke-width': 3 }, { d: 0 }), { d: 1 }, (k - 1) * .35, .35, lin);
  }
  floatText(`${-n} steps left of 0`, X(n / 2), Y0 - 100, COL.int);
}

/* ---------- shared answer columns ---------- */
const FAMILIES = ['nat', 'whole', 'int', 'rat', 'irr', 'real'];
const FAM_COLS = FAMILIES.map(k => [k, k === 'int' ? 'Integer' : NAME[k], COL[k]]);
const TF = [['t', 'True', null, 'T'], ['f', 'False', null, 'F']];
function finishCard() {
  const c = card(SCREEN, 'fin');
  const sum = pre => Object.entries(SCORE).filter(([k]) => k.startsWith(pre)).reduce((a, [, v]) => [a[0] + v.right, a[1] + v.total], [0, 0]);
  const line = (name, [r, t]) => h('p', 'fb', t ? `${name}: ${r} of ${t} right on the first try.` : `${name}: not attempted.`);
  progress(p => { p.done = [...new Set([...(p.done || []), CHAPTER.number])]; });
  const home = h('a', 'btn quiet', 'All chapters');
  home.href = $('bHome').href;
  const again = h('button', 'btn' + (CHAPTER.next ? ' quiet' : ' go'), ['Watch again', kbd(CHAPTER.next ? 'R' : 'Enter')]);
  again.onclick = restart;
  const next = CHAPTER.next && h('button', 'btn go', ['Next chapter', kbd('Enter')]);
  if (next) next.onclick = () => { location.href = CHAPTER.next; };
  P.keys = e => e.key === 'Enter' ? ((next ? next.onclick() : restart()), true)
    : (e.key === 'r' || e.key === 'R') ? (restart(), true) : false;
  const guide = mascotEl(240);
  c.append(h('div', 'finwrap', [guide, h('p', 'kicker', `Chapter ${CHAPTER.number} complete`), h('p', 'prompt', CHAPTER.title),
    line('Quick checks', sum('c-')), line('Chapter practice', sum('p-')), h('div', 'acts', next ? [home, again, next] : [home, again])]));
  setTimeout(() => mood(guide, 'happy'), 400);
}

/* ---------- in-picture cards ---------- */
const $ = id => document.getElementById(id);
// The volume control (volume.js, volume.css) lives in its own files next to this one, the same in every book.
document.head.append(Object.assign(document.createElement('script'), { src: new URL('volume.js', document.currentScript.src) }));
const kbd = s => h('kbd', '', s);
const uiW = (str, size) => { ctx2d.font = `600 ${size}px ${UI}`; return ctx2d.measureText(str).width; };
const RING_KEYS = ['nat', 'whole', 'int', 'rat', 'irr', 'real'];   // number keys 1–6 in sorting questions
const SCORE = {};                                          // question id -> first-attempt {right, total}

function h(tag, cls, kids = []) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of [].concat(kids)) e.append(k);
  return e;
}
// Rich text: strings, DOM nodes, or $m(...) inline math.
function rich(parts, size = 28) {
  const s = document.createElement('span');
  for (const p of [].concat(parts)) s.append(typeof p === 'string' || p instanceof Node ? p : mathEl(p.m, size));
  return s;
}
// A card at pos; a band card keeps its bottom on the stage: when its content grows (a long question, feedback),
// it moves up rather than running under the player bar.
function card(pos, cls) {
  const c = h('div', `card ${pos.cls} ${cls}`);
  Object.assign(c.style, { left: pos.x + 'px', top: pos.y + 'px', width: pos.w + 'px' });
  if (pos.maxH) c.style.maxHeight = pos.maxH + 'px';
  $('ui').append(c);
  if (pos.cls === 'band') {
    const fit = () => { c.style.top = Math.max(16, Math.min(pos.y, 900 - 16 - c.offsetHeight)) + 'px'; };
    const ro = new ResizeObserver(fit);
    ro.observe(c); fit();
    P.cleanup.push(() => ro.disconnect());
  }
  return c;
}
// The guide: an infinity sign whose two loops are its eyes. Drawn in SVG so it can blink, hop and wobble.
function lemniscate(cx, cy, a, k) {
  let d = '';
  for (let i = 0; i <= 96; i++) {
    const t = i / 96 * 2 * Math.PI, sn = Math.sin(t), q = 1 + sn * sn;
    d += (i ? 'L' : 'M') + (cx + a * Math.cos(t) / q).toFixed(1) + ' ' + (cy + k * a * sn * Math.cos(t) / q).toFixed(1);
  }
  return d + 'Z';
}
function mascotEl(size = 100) {
  const svg = mk('svg', { class: 'mascot', viewBox: '0 0 120 84', width: size, height: size * .7, 'aria-hidden': 'true' });
  const body = mk('g', { class: 'mbody' }, svg);
  const line = { fill: 'none', stroke: COL.chalk, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  mk('path', { d: lemniscate(60, 40, 52, 1.5), ...line, 'stroke-width': 6 }, body);
  const eyes = mk('g', { class: 'eyes' }, body);
  for (const x of [33, 87]) {
    mk('circle', { class: 'pupil', cx: x, cy: 40, r: 6.5, fill: COL.chalk }, eyes);
    mk('path', { class: 'joy', d: `M${x - 7} 43Q${x} 32 ${x + 7} 43`, ...line, 'stroke-width': 4 }, body);
  }
  mk('path', { class: 'smile', d: 'M55 62Q60 67 65 62', ...line, 'stroke-width': 3.5 }, body);
  mk('path', { class: 'flat', d: 'M55 64H65', ...line, 'stroke-width': 3.5 }, body);
  return svg;
}
function mood(el, m) {
  el.classList.remove('happy', 'oops');
  void el.getBoundingClientRect();  // restart the CSS animation
  if (m) el.classList.add(m);
}
// A sequence of questions in one card. Each question: { id, prompt, build(body, api) -> { check?, reveal, lock? } }.
function quiz(pos, qs, done, label = 'Quick check') {
  const c = card(pos, 'quiz');
  let k = 0;
  const show = () => {
    const q = qs[k];
    let first = true, resolved = false;
    const fb = h('div', 'fb'), body = h('div', 'body'), acts = h('div', 'acts');
    const bCheck = h('button', 'btn', ['Check', kbd('Enter')]), bShow = h('button', 'btn quiet', ['Show answer', kbd('S')]);
    const bNext = h('button', 'btn go', [k < qs.length - 1 ? 'Next question' : 'Continue', kbd('Enter')]);
    bShow.hidden = bNext.hidden = true;
    const guide = pos.cls === 'band' || pos.cls === 'side' ? mascotEl(pos.cls === 'band' ? 108 : 70) : null;
    const say = (cls, parts) => { fb.className = 'fb ' + cls; fb.replaceChildren(rich(parts, 24)); fb.style.animation = 'none'; void fb.offsetWidth; fb.style.animation = ''; };
    const resolve = () => {
      resolved = true;
      bCheck.hidden = bShow.hidden = true;
      ctl.lock?.();
      bNext.hidden = false;
      bNext.focus({ preventScroll: true });
    };
    const api = {
      grade(ok, msg, score) {
        if (resolved) return;
        if (first) { if (!Object.hasOwn(SCORE, q.id)) SCORE[q.id] = score || { right: +ok, total: 1 }; first = false; }
        say(ok ? 'ok' : 'no', [ok ? 'Correct. ' : 'Not quite. ', ...[].concat(msg || [])]);
        if (guide) {
          mood(guide, ok ? 'happy' : 'oops');
          if (!ok) setTimeout(() => { if (guide.classList.contains('oops')) mood(guide, null); }, 1600);
        }
        if (ok) resolve(); else bShow.hidden = false;
      },
    };
    const ctl = q.build(body, api);
    if (ctl.check) { bCheck.onclick = () => ctl.check(); acts.append(bCheck); }
    acts.append(bShow, bNext);
    bShow.onclick = () => { say('', ['Answer: ', ...[].concat(ctl.reveal())]); resolve(); };
    bNext.onclick = () => { if (k < qs.length - 1) { k++; show(); } else done(); };
    P.keys = e => {
      if (e.key === 'Enter' && resolved) { bNext.click(); return true; }
      if (!resolved && ctl.key?.(e)) return true;
      if (e.key === 'Enter' && !resolved && ctl.check) { bCheck.click(); return true; }
      if ((e.key === 's' || e.key === 'S') && !bShow.hidden) { bShow.click(); return true; }
      return false;
    };
    const kick = label + (qs.length > 1 ? `   ${k + 1} of ${qs.length}` : '');
    const head = h('div', 'head', [h('p', 'kicker', kick), h('p', 'prompt', [rich(q.prompt, pos.cls.startsWith('screen') ? 38 : 28)])]);   // match the prompt's type size
    if (ctl.hint) head.append(h('p', 'keys', ['Keys: ', ...ctl.hint]));
    c.replaceChildren(...(guide ? [guide] : []), head, fb, body, acts);
  };
  show();
}
function qlayer() {
  S.q?.remove();
  S.q = G(scene);
  S.q.classList.add('qlayer');
  return S.q;
}
const keyAct = (el, fn) => el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });

/* ---------- question builders ---------- */
// Single answer from buttons; each wrong option has its own explanation.
const choice = (opts, right, yes, no, onRight) => (body, api) => {
  const row = h('div', 'opts');
  const bs = opts.map((o, i) => {
    const b = h('button', 'opt', [kbd(String(i + 1)), rich(o, 32)]);
    b.onclick = () => {
      if (i === right) { b.classList.add('good'); onRight?.(); api.grade(true, yes); }
      else { b.classList.add('bad'); b.disabled = true; api.grade(false, no[i]); }
    };
    row.append(b);
    return b;
  });
  body.append(row);
  return {
    reveal() { bs[right].classList.add('good'); onRight?.(); return yes; },
    lock() { bs.forEach(b => { b.disabled = true; }); },
    key(e) { const b = bs[+e.key - 1]; if (!b || b.disabled) return false; b.click(); return true; },
  };
};
// Tap a point on the stage number line.
const tap = (values, right, yes, no, onRight) => (body, api) => {
  const L = qlayer(), hits = {};
  let locked = false;
  for (const v of values) {
    const g = G(L, { x: X(v), y: Y0 });
    g.classList.add('hit');
    g.setAttribute('tabindex', 0);
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `The point ${num(v)}`);
    mk('circle', { r: 30, class: 'ring' }, g);
    const act = () => {
      if (locked) return;
      if (v === right) { g.classList.add('good'); onRight?.(); api.grade(true, yes); }
      else { g.classList.add('bad'); shakeFx(S.dots[v]); api.grade(false, no(v)); }
    };
    g.addEventListener('click', act);
    keyAct(g, act);
    hits[v] = g;
  }
  const gs = values.map(v => hits[v]);
  let cur = -1;
  return {
    reveal() { hits[right].classList.add('good'); onRight?.(); return yes; },
    lock() { locked = true; },
    hint: [kbd('←'), kbd('→'), ' move along the line, ', kbd('Enter'), ' choose'],
    key(e) {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d || locked) return false;
      cur = cur < 0 ? (d > 0 ? 0 : gs.length - 1) : (cur + d + gs.length) % gs.length;
      gs[cur].focus();
      return true;
    },
  };
};
// Tap one token of a stage token row, e.g. the operation to do first. idx: tappable token indexes.
const tapEls = (row, idx, right, yes, no, onRight) => (body, api) => {
  const L = qlayer();
  let locked = false, cur = -1;
  const hits = idx.map(i => {
    const e = row[i], w = e._w + 18, g = G(L, { x: e._px, y: row.y });
    g.classList.add('hit');
    g.setAttribute('tabindex', 0);
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', e.textContent.trim());
    mk('rect', { class: 'ring', x: -w / 2, y: -row.size * .95, width: w, height: row.size * 1.3, rx: 12 }, g);
    const act = () => {
      if (locked) return;
      if (i === right) { g.classList.add('good'); onRight?.(); api.grade(true, yes); }
      else { g.classList.add('bad'); shakeFx(e); api.grade(false, no(i)); }
    };
    g.addEventListener('click', act);
    keyAct(g, act);
    return g;
  });
  return {
    reveal() { hits[idx.indexOf(right)].classList.add('good'); onRight?.(); return yes; },
    lock() { locked = true; },
    hint: [kbd('←'), kbd('→'), ' move, ', kbd('Enter'), ' choose'],
    key(e) {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d || locked) return false;
      cur = cur < 0 ? (d > 0 ? 0 : hits.length - 1) : (cur + d + hits.length) % hits.length;
      hits[cur].focus();
      return true;
    },
  };
};
// Click one of several stage objects (table cells, bars, small graphs). items: [{ el, box: [x, y, w, h], label }].
const pickEls = (items, right, yes, no, onRight) => (body, api) => {
  const L = qlayer();
  let locked = false, cur = -1;
  const hits = items.map((it, i) => {
    const [x, y, w, hh] = it.box, g = G(L);
    g.classList.add('hit');
    g.setAttribute('tabindex', 0);
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', it.label);
    mk('rect', { class: 'ring', x, y, width: w, height: hh, rx: 12 }, g);
    const act = () => {
      if (locked) return;
      if (i === right) { g.classList.add('good'); onRight?.(); api.grade(true, yes); }
      else { g.classList.add('bad'); shakeFx(it.el); api.grade(false, no(i)); }
    };
    g.addEventListener('click', act);
    keyAct(g, act);
    return g;
  });
  return {
    reveal() { hits[right].classList.add('good'); onRight?.(); return yes; },
    lock() { locked = true; },
    hint: [kbd('←'), kbd('→'), ' move, ', kbd('Enter'), ' choose, or click'],
    key(e) {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d || locked) return false;
      cur = cur < 0 ? (d > 0 ? 0 : hits.length - 1) : (cur + d + hits.length) % hits.length;
      hits[cur].focus();
      return true;
    },
  };
};
// Rows of toggles. items: { parts, ans: [keys], why }. parts are math parts (strings, F, R) unless text: true,
// where they are rich text (strings and $m(...)). cols: [[key, label, colour?, shortcut?]]. multi: several per row.
const grid = (items, cols, { multi = true, text = false } = {}) => (body, api) => {
  const wrap = h('div', 'grid' + (text ? ' text' : ''));
  const hot = cols.map((c, j) => c[3] || String(j + 1));
  let cur = 0, locked = false;
  const rows = items.map((it, ri) => {
    const opts = h('div', 'opts'), mark = h('div', 'mark'), why = h('div', 'why');
    const bs = cols.map(([key, lab, colr], j) => {
      const b = h('button', 'opt', [kbd(hot[j]), lab]);
      if (colr) b.style.setProperty('--c', colr);
      b.setAttribute('aria-pressed', 'false');
      b.onclick = () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        if (!multi) bs.forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', String(on));
      };
      opts.append(b);
      return b;
    });
    const el = h('div', 'row', [h('div', 'num', [text ? rich(it.parts, 26) : mathEl(it.parts, 32)]), opts, mark, why]);
    el.addEventListener('click', () => { cur = ri; showCur(); });
    wrap.append(el);
    const picked = () => cols.filter((c, i) => bs[i].getAttribute('aria-pressed') === 'true').map(c => c[0]);
    return { it, bs, mark, why, picked, el, played: false };
  });
  const single = rows.length === 1;
  const showCur = () => rows.forEach((r, i) => {
    const on = !single && !locked && i === cur;
    r.el.classList.toggle('cur', on);
    if (on && r.el.isConnected) r.el.scrollIntoView({ block: 'nearest' });   // a long practice list scrolls
  });
  showCur();
  body.append(wrap);
  const judge = r => {
    const p = r.picked(), ok = p.length === r.it.ans.length && r.it.ans.every(k => p.includes(k));
    r.mark.className = 'mark ' + (ok ? 'good' : 'bad');
    r.mark.textContent = ok ? '✓' : '✗';
    r.why.replaceChildren(ok || single ? '' : rich(r.it.why, 20));
    if (ok && !r.played) { r.played = true; r.it.fx?.(); }
    return ok;
  };
  return {
    check() {
      const right = rows.filter(judge).length;
      const all = right === rows.length;
      api.grade(all, single ? rows[0].it.why : all ? [] : [`${right} of ${rows.length} right. Fix the rows marked ✗ and check again.`], { right, total: rows.length });
    },
    reveal() {
      for (const r of rows) {
        r.bs.forEach((b, i) => b.setAttribute('aria-pressed', String(r.it.ans.includes(cols[i][0]))));
        judge(r);
        if (!single) r.why.replaceChildren(rich(r.it.why, 20));
      }
      return single ? rows[0].it.why : 'the correct choices are now selected.';
    },
    lock() { locked = true; showCur(); rows.forEach(r => r.bs.forEach(b => { b.disabled = true; })); },
    hint: [...(single ? [] : [kbd('↑'), kbd('↓'), ' row, ']), ...(/\d/.test(hot[0]) ? [kbd(hot[0]), '–', kbd(hot[hot.length - 1])] : hot.map(kbd)), ' choose'],
    key(e) {
      if (locked) return false;
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !single) {
        cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
        showCur();
        return true;
      }
      const j = hot.findIndex(x => x.toLowerCase() === e.key.toLowerCase());
      if (j < 0) return false;
      rows[cur].bs[j].click();
      if (!multi && cur < rows.length - 1) { cur++; showCur(); }
      return true;
    },
  };
};
// Exact value of a typed answer: integer, decimal, fraction a/b or mixed number "w a/b"; returns [num, den] or null.
// Accepts −, – or - as the sign. Never evaluates the text as code.
function rat(str) {
  const t = String(str).trim().replace(/^[−–]/, '-').replace(/\s+/g, ' ');
  let m = t.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (m) { const d = 10 ** (m[3] || '').length, n = (m[1] ? -1 : 1) * (Number(m[2]) * d + Number(m[3] || 0)); return Number.isSafeInteger(n) && Number.isSafeInteger(d) ? [n, d] : null; }
  m = t.match(/^(-?)(?:(\d+) )?(\d+) ?\/ ?(\d+)$/);
  if (m && Number(m[4]) > 0) { const d = Number(m[4]), n = (m[1] ? -1 : 1) * (Number(m[2] || 0) * d + Number(m[3])); return Number.isSafeInteger(n) && Number.isSafeInteger(d) ? [n, d] : null; }
  return null;
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lowest = ([n, d]) => gcd(n, d) === 1;
// Fill-in boxes inside math. rows: [{ parts: [math parts and { box: '21' }], why, hint?, fx? }].
// test(values), when given, judges the whole row from the typed numbers (e.g. a factor pair in either order); the boxes' answers are still what Show answer fills in.
// Answers are exact numbers: "−5", "-5", "0.5", "3/4" and "2 1/4" all work, and equal values match ("6/8" = "3/4")
// unless the box has lowest: true. hint is shown after a wrong try, why after a right one.
const blanks = rowsIn => (body, api) => {
  const all = [];
  const rows = rowsIn.map(it => {
    const line = h('div', 'bline'), mark = h('span', 'mark'), why = h('div', 'why');
    let run = [];
    const flush = () => { if (run.length) line.append(mathEl(run, 34)); run = []; };
    const boxes = [];
    for (const p of it.parts) {
      if (p && p.box !== undefined) {
        flush();
        const b = h('input', 'box');
        Object.assign(b, { type: 'text', inputMode: 'decimal', autocomplete: 'off', spellcheck: false });
        b.setAttribute('aria-label', 'Answer');
        b.dataset.ans = p.box;
        if (p.lowest) b.dataset.lowest = '1';
        b.style.width = `${Math.max(2, String(p.box).length) + 2}ch`;
        line.append(b);
        boxes.push(b);
        all.push(b);
      } else run.push(p);
    }
    flush();
    line.append(mark);
    body.append(h('div', 'brow', [line, why]));
    return { it, boxes, mark, why, played: false };
  });
  body.classList.add('blanks');
  const single = rows.length === 1;
  const judge = r => {
    let ok = true;
    if (r.it.test) {               // the row is judged as a whole, e.g. two factors in either order
      const vals = r.boxes.map(b => rat(b.value));
      ok = vals.every(Boolean) && !!r.it.test(vals.map(([n, d]) => n / d));
      r.boxes.forEach(b => { b.classList.toggle('good', ok); b.classList.toggle('bad', !ok); });
    } else for (const b of r.boxes) {
      const want = rat(b.dataset.ans), got = rat(b.value);
      const good = !!got && !!want && BigInt(got[0]) * BigInt(want[1]) === BigInt(want[0]) * BigInt(got[1]) && (!b.dataset.lowest || lowest(got));
      b.classList.toggle('good', good);
      b.classList.toggle('bad', !good);
      ok = ok && good;
    }
    r.mark.className = 'mark ' + (ok ? 'good' : 'bad');
    r.mark.textContent = ok ? '✓' : '✗';
    r.why.replaceChildren(ok || single ? '' : rich(r.it.hint ?? r.it.why, 20));
    if (ok && !r.played) { r.played = true; r.it.fx?.(); }
    return ok;
  };
  requestAnimationFrame(() => all[0]?.focus({ preventScroll: true }));
  return {
    check() {
      const right = rows.filter(judge).length, done = right === rows.length;
      const msg = single ? (done ? rows[0].it.why : rows[0].it.hint ?? rows[0].it.why)
        : done ? [] : [`${right} of ${rows.length} right. Fix the rows marked ✗ and check again.`];
      api.grade(done, msg, { right, total: rows.length });
    },
    reveal() {
      for (const r of rows) {
        r.boxes.forEach(b => { b.value = b.dataset.ans.replace('-', '−'); });   // shown exactly as authored
        judge(r);
        if (!single) r.why.replaceChildren(rich(r.it.why, 20));
      }
      return single ? rows[0].it.why : 'the correct numbers are filled in.';
    },
    lock() { all.forEach(b => { b.disabled = true; }); },
    hint: [all.some(b => b.dataset.ans.includes('/')) ? 'type numbers like 3/4 or −2 1/4, ' : 'type the number, ', kbd('Tab'), ' next box, ', kbd('Enter'), ' check, ', kbd('Esc'), ' leave the box'],
  };
};
// Drag number chips into the stage number map. items: [parts, smallest ring, explanation].
const slot = (k, n) => {
  if (k === 'real') return [[940, 210], [1000, 760], [820, 800]][n % 3];   // inside Real, outside every other ring
  const r = RINGS[k];
  return [r.lx + [-72, 72, 0][n % 3], r.ly + 50 + 56 * Math.floor(n / 2)];
};
const plain = parts => parts.map(p => typeof p === 'string' ? p : p.ov !== undefined ? p.ov + ' repeating' : p.f ? p.f.join('/') : p.sup !== undefined ? '^' + p.sup : (p.i ? p.i : '') + '√' + (p.r.f ? p.r.f.join('/') : p.r)).join('');
const sorter = (items, trayXY) => (body, api) => {
  const L = qlayer();
  const bg = mk('rect', { width: 1600, height: 900, fill: 'transparent' }, L);
  const svg = $('stage');
  const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let sel = null, drag = null, locked = false;
  const label = c => c.setAttribute('aria-label', `${c.say}, ${c.region ? 'placed in ' + NAME[c.region] : 'not placed'}`);
  const outline = (c, colr, w = 2.5) => { c._rect.setAttribute('stroke', colr); c._rect.setAttribute('stroke-width', w); };
  const choose = c => {
    if (sel) outline(sel, COL.chalk);
    sel = c;
    if (sel) { outline(sel, COL.task, 4); L.append(sel); }
  };
  const select = c => choose(sel === c ? null : c);
  // Number badges next to the ring names, for keys 1–6.
  RING_KEYS.forEach((k, i) => {
    const r = RINGS[k], g = G(L, { x: r.lx - uiW(NAME[k], 26) / 2 - 24, y: r.ly - 9 });
    g.style.pointerEvents = 'none';
    mk('circle', { r: 14, fill: COL.board, stroke: COL[k], 'stroke-width': 1.5 }, g);
    T(g, String(i + 1), { y: 6.5, size: 18, fill: COL[k], anchor: 'middle', weight: 600 });
  });
  const place = (c, x, y) => {
    c.region = regionAt(x, y);
    if (!c.region) [x, y] = c.home;
    put(c, { x, y });
    outline(c, COL.chalk);
    c.querySelector('.mark')?.remove();
    if (sel === c) sel = null;
    label(c);
  };
  const chips = items.map(([parts, answer, why], i) => {
    const [x, y] = trayXY(i);
    const c = chip(L, parts, COL.chalk, { x, y, size: 32 });
    Object.assign(c, { answer, why, home: [x, y], region: null, say: plain(parts) });
    c.classList.add('tok');
    c.setAttribute('tabindex', 0);
    c.setAttribute('role', 'button');
    label(c);
    c.addEventListener('pointerdown', e => {
      if (locked) return;
      e.preventDefault();
      const p = pt(e);
      drag = { dx: p.x - st(c).x, dy: p.y - st(c).y, sx: p.x, sy: p.y, moved: false };
      L.append(c);  // re-parent before capturing: moving a node drops its capture
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = pt(e);
      if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) drag.moved = true;
      if (drag.moved) put(c, { x: p.x - drag.dx, y: p.y - drag.dy });
    });
    c.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (moved) place(c, st(c).x, st(c).y); else select(c);
    });
    keyAct(c, () => { if (!locked) select(c); });
    return c;
  });
  bg.addEventListener('pointerup', e => { if (sel && !locked) { const p = pt(e); place(sel, p.x, p.y); } });
  return {
    check() {
      let right = 0;
      const notes = h('ul');
      for (const c of chips) {
        c.querySelector('.mark')?.remove();
        if (!c.region) { notes.append(h('li', '', `${c.say} is not placed yet.`)); continue; }
        const ok = c.region === c.answer;
        right += ok;
        outline(c, ok ? COL.good : COL.bad, 4);
        if (ok) { pulseFx(c, 1.25); glowFx(c.answer, right * .15); } else shakeFx(c);
        const w = +c._rect.getAttribute('width');
        T(c, ok ? '✓' : '✗', { x: w / 2 + 4, y: -16, size: 26, fill: ok ? COL.good : COL.bad, weight: 700 }).classList.add('mark');
        if (!ok) notes.append(h('li', '', c.region === 'real'
          ? `${c.say}: every real number is rational or irrational, so that space has no numbers of its own.`
          : c.why));
      }
      const all = right === chips.length;
      api.grade(all, all ? [] : [`${right} of ${chips.length} in the right ring.`, notes], { right, total: chips.length });
    },
    reveal() {
      const count = {};
      chips.forEach((c, i) => {
        const n = count[c.answer] = (count[c.answer] ?? -1) + 1;
        const [x, y] = slot(c.answer, n);
        c.region = c.answer;
        c.querySelector('.mark')?.remove();
        outline(c, COL.good, 4);
        fx(c, { x, y }, i * .12, .8);
      });
      return 'every number is now in its smallest ring.';
    },
    lock() { locked = true; choose(null); },
    hint: [kbd('←'), kbd('→'), ' pick a number, ', kbd('1'), '–', kbd('6'), ' choose its ring'],
    key(e) {
      if (locked) return false;
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (d) {
        const i = sel ? chips.indexOf(sel) : d > 0 ? -1 : 0;
        choose(chips[(i + d + chips.length) % chips.length]);
        return true;
      }
      const ring = RING_KEYS[+e.key - 1];
      if (!ring || !sel) return false;
      const c = sel;
      place(c, ...slot(ring, chips.filter(x => x.region === ring && x !== c).length));
      choose(chips.find(x => !x.region) || null);
      return true;
    },
  };
};

/* ---------- player ---------- */
const P = { i: 0, t: 0, end: 1, playing: false, waiting: false, done: false, started: false, audio: null, afail: false, stall: 0, cleanup: [] };
function runBeat(i) {
  TW = [];
  const b = BEATS[i], tm = TIMINGS[b.id];
  const m = (k, off = 0) => {
    if (!(k in tm.marks)) throw new Error(`${b.id}: missing mark ${k}`);
    return tm.marks[k] + off;
  };
  S.cleared = false;
  b.run(m, tm.dur);
  if (S.cleared && b.lead !== false) leadIn();
  TW.sort((a, c) => a.t0 - c.t0);
  return Math.max(tm.dur, ...TW.map(w => w.t0 + w.dur)) + .6;
}
// A beat that clears the picture must not leave it empty while the narration has started.
// If nothing appears before LEAD_MAX, the opening group (every tween that starts within LEAD_GROUP s of the
// first reveal) moves earlier so it begins at LEAD_AT, just after the old panel has faded. Later steps keep their word timing.
const LEAD_AT = .4, LEAD_MAX = .8, LEAD_GROUP = 1.2;
function leadIn() {
  const reveals = TW.filter(w => {
    if (!w.e) return false;
    const s = st(w.e), to = w.to;
    return (to.o > 0 && s.o === 0) || (to.s > 0 && s.s === 0) || (to.d > 0 && (s.d ?? 1) === 0);
  });
  if (!reveals.length) return;
  const first = Math.min(...reveals.map(w => w.t0));
  if (first <= LEAD_MAX) return;
  for (const w of TW) if (w.t0 >= first && w.t0 < first + LEAD_GROUP) w.t0 -= first - LEAD_AT;
}
function stopAudio() {
  const a = P.audio;
  if (!a) return;
  a.onerror = null; a.pause(); a.removeAttribute('src'); a.load();
  P.audio = null;
}
function clearCards() {
  $('ui').replaceChildren();
  P.cleanup.forEach(f => f());
  P.cleanup = [];
  finishFx();
  P.keys = null;
  S.q?.remove();
  delete S.q;
}
// Rebuild the scene from scratch and fast-forward every earlier beat, so any step starts from its exact picture.
function seek(i, play = P.playing) {
  stopAudio(); clearCards(); reset();
  seeking = true;
  try {
    for (let k = 0; k < i; k++) { runBeat(k); evalTo(Infinity); }
    start(i, play);
  } finally { seeking = false; }
}
function start(i, play) {
  stopAudio(); clearCards();
  Object.assign(P, { i, t: 0, waiting: false, done: false, afail: false, stall: 0 });
  P.end = runBeat(i);
  evalTo(0);
  const a = P.audio = new Audio(`audio/${CHAPTER.language || 'en'}/${BEATS[i].id}.mp3`);
  a.preload = 'auto';
  a.volume = +($('volume')?.value ?? 1);
  // An aborted or superseded load (fast stepping, a reload) is not a failure: only a real error for the current clip
  // shows the note, and the note goes away as soon as a clip plays.
  a.onerror = () => { if (P.audio === a && a.error && a.error.code !== MediaError.MEDIA_ERR_ABORTED) soundFailed(); };
  a.onplaying = () => {
    if (P.audio !== a) return;
    $('soundNote').hidden = true;
    if (P.afail) { P.afail = false; a.currentTime = P.t; }   // sound came back late: rejoin the picture where it is
  };
  const b = BEATS[i];
  if (b.ask) b.ask(() => { if (P.i === i) { evalTo(Infinity); start(i + 1, true); } });
  setPlaying(play);
}
function soundFailed() { P.afail = true; $('soundNote').hidden = false; }
function setPlaying(v) {
  P.playing = v;
  const a = P.audio;
  if (!a) return;
  if (v && !P.waiting && !a.ended && !P.afail) a.play().catch(e => { if (P.audio === a && e.name === 'NotAllowedError') soundFailed(); });
  else a.pause();
}
function beatDone() {
  evalTo(Infinity);
  const b = BEATS[P.i];
  if (b.ask) P.waiting = true;
  else if (P.i < BEATS.length - 1) start(P.i + 1, true);
  else { P.done = true; setPlaying(false); }
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000);
  last = now;
  clock += dt;
  if (FX.length) { evalTo(clock, FX); FX = FX.filter(w => !w.done); }
  if (P.playing && !P.waiting && !P.done) {
    const a = P.audio;
    // While the clip plays, its clock drives the picture; before it starts or after it ends, wall time does.
    if (a && !P.afail && !a.ended) {
      if (a.currentTime > 0) { P.t = Math.max(P.t, a.currentTime); P.stall = 0; }
      else if ((P.stall += dt) > (a.readyState < 2 ? 8 : 15)) soundFailed();   // nothing to play after 8 s, or stuck for 15
    } else P.t += dt;
    evalTo(P.t);
    if (P.t >= P.end) beatDone();
  }
  ui();
  requestAnimationFrame(frame);
}
let segs = [];
function buildSegs() {
  segs = BEATS.map((b, i) => {
  const s = h('button', 'seg' + (b.ask ? ' ask' : ''), [h('i')]);
  s.style.flex = TIMINGS[b.id].dur + (b.ask ? 12 : 0);
  s.title = b.title;
  s.setAttribute('aria-label', `Go to step ${i + 1}: ${b.title}`);
  s.onclick = () => { hideCover(); seek(i, true); };
  $('segs').append(s);
  return s.firstChild;
  });
}
function ui() {
  segs.forEach((f, k) => { f.style.width = (k < P.i || P.done ? 100 : k > P.i ? 0 : Math.min(100, P.t / P.end * 100)) + '%'; });
  $('frame').classList.toggle('is-playing', P.playing && !P.done && !P.waiting);
  $('frame').classList.toggle('paused', P.started && !P.playing && !P.waiting && !P.done && !BEATS[P.i].ask);
  $('stepName').textContent = `${P.i + 1} / ${BEATS.length}   ${BEATS[P.i].title}`;
  const b = BEATS[P.i];
  let text = '';
  if (captions && P.started && !b.ask && !P.done) {
    for (const [t, line] of TIMINGS[b.id].cues) { if (t > P.t + .05) break; text = line; }
  }
  if (text !== capText) { capText = text; $('caption').textContent = text; $('caption').hidden = !text; }
}
let captions = false, capText = '';
try { captions = localStorage.getItem('captions') === '1'; } catch {}
function setCaptions(on) {
  captions = on;
  $('bCC').setAttribute('aria-pressed', String(on));
  try { localStorage.setItem('captions', on ? '1' : '0'); } catch {}
}
setCaptions(captions);
function hideCover() { P.started = true; $('cover').hidden = true; }
function togglePlay() {
  if (!P.started) { hideCover(); return setPlaying(true); }
  if (P.waiting || P.done) return;
  setPlaying(!P.playing);
}
const back1 = () => seek(P.t > 2.5 || P.i === 0 ? P.i : P.i - 1);
const restart = () => { for (const k in SCORE) delete SCORE[k]; hideCover(); seek(0, true); };
$('cover').onclick = togglePlay;
$('stage').addEventListener('click', e => {
  const b = BEATS[P.i];
  if (!b.ask && !e.target.closest('.qlayer')) togglePlay();
});
$('bPlay').onclick = togglePlay;
$('bBack').onclick = () => { hideCover(); back1(); };
$('bRestart').onclick = restart;
$('bCC').onclick = () => setCaptions(!captions);
$('bFull').onclick = () => toggleFull();
const toggleFull = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
let helpResume = false;
function toggleHelp() {
  const open = $('help').hidden;
  $('help').hidden = !open;
  if (open) { helpResume = P.playing; if (P.playing) setPlaying(false); }
  else if (helpResume) setPlaying(true);
}
// Every action has a key. A question's own keys (P.keys) come first; Shift reaches the player during a question.
document.addEventListener('keydown', e => {
  if (e.altKey || e.metaKey || e.ctrlKey) return;
  const k = e.key;
  if (!$('help').hidden) { if (k === 'Escape' || k === '?') { e.preventDefault(); toggleHelp(); } return; }
  if (e.target.matches?.('input')) {        // Keep native input keys; only answer boxes use Enter to check.
    if (k === 'Enter' && e.target.type !== 'range' && P.keys) { e.preventDefault(); P.keys(e); }
    else if (k === 'Escape') e.target.blur();
    return;
  }
  if (k === '?') { e.preventDefault(); toggleHelp(); return; }
  if ((k === 'Enter' || k === ' ') && e.target.closest?.('button, [tabindex], a')) return;  // a Tab-focused control acts itself
  if (!P.started) { if (k === ' ' || k === 'Enter') { e.preventDefault(); togglePlay(); } return; }
  if (P.keys && !e.shiftKey && P.keys(e)) { e.preventDefault(); return; }
  const free = e.shiftKey || !P.keys;
  let used = true;
  if (k === ' ') togglePlay();
  else if (k === 'ArrowLeft' && free) back1();
  else if (k === 'ArrowRight' && free) { if (P.i < BEATS.length - 1) seek(P.i + 1); }
  else if (k === 'Home') restart();
  else if (k === 'c' || k === 'C') setCaptions(!captions);
  else if (k === 'f' || k === 'F') toggleFull();
  else used = false;
  if (used) e.preventDefault();
});
// Mouse clicks should not leave focus on a control, so Enter and Space keep meaning "check" and "play".
$('frame').addEventListener('mousedown', e => { if (e.target.closest('button, [tabindex]')) e.preventDefault(); });
$('bHelp').onclick = toggleHelp;
const fit = () => document.documentElement.style.setProperty('--k', Math.min(innerWidth / 1640, (innerHeight - (innerWidth <= 700 ? 120 : 0)) / 1000));
addEventListener('resize', fit);
fit();

// Start the lesson once the chapter page has defined CHAPTER and BEATS.
// ?beat=N&t=S opens a paused frame, for reviewing a single moment.
// Per-book progress shared with the cover/contents at the parent URL folder.
const BOOK_PROGRESS_KEY = bookSetting('--progress-key') || 'animebook:progress:' + new URL('../', location.href).pathname;
function progress(f) {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOK_PROGRESS_KEY) || '{}');
    const p = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    p.done = Array.isArray(p.done) ? p.done.filter(n => Number.isInteger(n) && n > 0) : [];
    f(p); localStorage.setItem(BOOK_PROGRESS_KEY, JSON.stringify(p));
  } catch {}
}
function boot() {
  $('coverK').textContent = `Chapter ${CHAPTER.number}`;
  $('coverT').textContent = CHAPTER.title;
  $('bHome').href = `../#ch${String(CHAPTER.number).padStart(2, '0')}`;
  progress(p => { p.last = CHAPTER.number; });
  document.getElementById('stage').setAttribute('aria-label', `Lesson animation: ${CHAPTER.title}`);
  $('coverMeta').textContent = `About ${CHAPTER.minutes} minutes, with sound and quick checks.`;
  buildSegs();
  const qs = new URLSearchParams(location.search);
  if (qs.has('beat')) {
    $('cover').hidden = true;
    seek(+qs.get('beat'), false);
    P.t = +(qs.get('t') || 0);
    evalTo(P.t);
  } else seek(0, false);
  requestAnimationFrame(frame);
}
