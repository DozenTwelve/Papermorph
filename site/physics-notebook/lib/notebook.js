'use strict';
// The notebook look shared by the Energy unit (style.json "look", "components"). Load after engine.js.
// The engine draws for a dark board; its palette is redefined here to ink on lined paper (book.css does the same
// for the CSS colours). Text helpers write in a hand font; highlighter swipes and definition cards are the book's
// own way of marking a term.

Object.assign(COL, { chalk: '#26241f', dim: '#6c665a', faint: '#b9b1a0', board: '#fcfaf3',
  task: '#e89a00', good: '#2f9a5c', bad: '#d9473a' });
const INK = COL.chalk;
const HAND = '"Patrick Hand","Avenir Next",sans-serif';
const HEAD = '"Luckiest Guy","Patrick Hand",sans-serif';
// One colour per form of energy, the same in every chapter of the unit.
const EN = { light: '#ffc928', chemical: '#7dbb35', kinetic: '#f0568f', potential: '#2fa3e0', thermal: '#f2653a',
  sound: '#9a68d8', electric: '#14ada0', elastic: '#5468d4', nuclear: '#ff9419' };
// Pale highlighter versions (the book's marker colours) for swipes and cards.
const HL = { yellow: '#fff06a', pink: '#f7a8c8', green: '#c5e15a', blue: '#8fd3f5', orange: '#ffc477', lilac: '#d6c2f2' };

// Fonts must be ready before anything is measured or drawn: call nbBoot() instead of boot().
function nbBoot() {
  return Promise.all(['40px "Patrick Hand"', '40px "Luckiest Guy"'].map(f => document.fonts.load(f))).finally(boot);
}

// Text in the hand font (o: 0 unless shown later).
function hand(p, str, x, y, { size = 34, fill = INK, anchor = 'middle', o = 1, weight = 400 } = {}) {
  return T(p, str, { x, y, size, fill, anchor, o, font: HAND, weight });
}
// A heading in the book's chunky capitals.
function head(p, str, x, y, { size = 52, fill = INK, anchor = 'middle', o = 1 } = {}) {
  const t = T(p, str.toUpperCase(), { x, y, size, fill, anchor, o, font: HEAD, weight: 400 });
  t.setAttribute('letter-spacing', '1.5');
  return t;
}
const handW = (str, size, font = HAND) => { ctx2d.font = `${size}px ${font}`; return ctx2d.measureText(str).width; };

// A highlighter swipe from x to x + w with its middle at y, drawn on left to right at t0.
// Slightly tilted and ragged like a real marker. Create it before the text it sits behind.
function swipe(p, x, y, w, { h = 44, color = HL.yellow, t0 = 0, dur = .45, o = .9 } = {}) {
  const d = `M${x} ${y + 3}C${x + w * .3} ${y - 1} ${x + w * .7} ${y + 2} ${x + w} ${y - 2}`;
  const s = path(p, d, { stroke: color, 'stroke-width': h, 'stroke-linecap': 'butt', opacity: o }, { d: 0 });
  tw(s, { d: 1 }, t0, dur, out);
  return s;
}
// A term with a swipe behind it: { g, w } with the text centred on x (or starting at x for anchor 'start').
function term(p, str, x, y, { size = 40, color = HL.yellow, t0 = 0, font = HEAD, anchor = 'middle', fill = INK } = {}) {
  const g = G(p);
  const w = handW(font === HEAD ? str.toUpperCase() : str, size, font) + (font === HEAD ? str.length * 1.5 : 0);
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  swipe(g, x0 - 12, y - size * .33, w + 24, { h: size * 1.05, color, t0 });
  const t = font === HEAD ? head(g, str, x0, y, { size, anchor: 'start', o: 0, fill })
    : hand(g, str, x0, y, { size, anchor: 'start', o: 0, fill });
  show(t, t0 + .1, .3);
  return { g, w, t };
}

// A definition card like the book's: a tilted block with an ink edge and a darker side for depth.
// Centred on (x, y); lines: [[text, size, font?]]. Pops in at t0 (pass t0 = null to build it hidden).
function defCard(p, x, y, w, h, lines, { color = HL.blue, tilt = -2, t0 = 0 } = {}) {
  const g = G(p, { x, y, r: tilt, s: .85, o: 0 });
  const side = mix(color, '#000000', .25);
  mk('path', { d: `M${-w / 2 + 10} ${h / 2}L${w / 2} ${h / 2}L${w / 2 + 12} ${h / 2 - 12}L${w / 2 + 12} ${-h / 2 + 4}L${w / 2} ${-h / 2}Z`,
    fill: side, stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: color, stroke: INK, 'stroke-width': 3, rx: 3 }, g);
  const total = lines.reduce((a, [, s]) => a + s * 1.15, 0);
  let yy = -total / 2;
  for (const [str, size, font] of lines) {
    yy += size * 1.15;
    font === 'head' ? head(g, str, 0, yy - size * .22, { size }) : hand(g, str, 0, yy - size * .22, { size });
  }
  if (t0 !== null) pop(g, t0);
  return g;
}

// A speech bubble pointing down-left to (tx, ty), text centred on (x, y).
function bubble(p, str, x, y, tx, ty, { size = 32, t0 = 0 } = {}) {
  const w = handW(str, size) + 40, h = size + 30;
  const g = G(p, { o: 0, s: .7, x, y });
  const bx = tx - x, by = ty - y;
  mk('path', { d: `M${-w / 2 + 18} ${h / 2 - 2}L${bx} ${by}L${-w / 2 + 44} ${h / 2 - 2}`, fill: '#fff', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: '#fff', stroke: INK, 'stroke-width': 3 }, g);
  mk('rect', { x: -w / 2 + 16, y: h / 2 - 6, width: 32, height: 8, fill: '#fff' }, g);
  hand(g, str, 0, size * .34, { size });
  if (t0 !== null) pop(g, t0);
  return g;
}

// A hand-drawn arrow from (x1, y1) to (x2, y2), bending by `bend` px; drawn on at t0.
function inkArrow(p, x1, y1, x2, y2, { bend = 40, color = INK, width = 4, t0 = 0, dur = .6 } = {}) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const cx = mx - dy / L * bend, cy = my + dx / L * bend;
  const a = Math.atan2(y2 - cy, x2 - cx), k = 18;
  const g = G(p);
  const line = path(g, `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`, { stroke: color, 'stroke-width': width }, { d: 0 });
  const tip = path(g, `M${x2 - k * Math.cos(a - .45)} ${y2 - k * Math.sin(a - .45)}L${x2} ${y2}L${x2 - k * Math.cos(a + .45)} ${y2 - k * Math.sin(a + .45)}`,
    { stroke: color, 'stroke-width': width }, { o: 0 });
  draw(line, t0, dur); show(tip, t0 + dur * .85, .15);
  return g;
}
