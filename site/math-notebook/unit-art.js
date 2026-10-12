// Chalk sketches for the unit headers on the contents page, one per unit, drawn in the unit's colour.
// Each entry is the inside of an SVG with viewBox 0 0 600 180; keep the left ~200 px light (the unit title sits there
// on narrow screens). Classes, styled in lib/units.css:
//   d  a stroke that draws itself in when the unit scrolls into view (--k orders the strokes)
//   t  text or a filled shape that fades in
//   a  faint chalk white instead of the unit colour;  faint  even fainter
// A sketch may add one looping motion after it is drawn: give an element a class and add a .seen .unit-art .NAME
// rule with its keyframes in book.html (see the examples there: swap-a, hop, spin, tilt, breathe, ...).
'use strict';
(() => {
  let k = 0;
  const P = (d, cls = '', extra = '') => `<path class="d ${cls}" pathLength="1" style="--k:${k++}" d="${d}" ${extra}/>`;
  const Tx = (x, y, s, size = 24, cls = '', anchor = 'start') => `<text class="t ${cls}" style="--k:${k++}" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${s}</text>`;
  const C = (cx, cy, r, cls = '') => `<circle class="d ${cls}" pathLength="1" style="--k:${k++}" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const reset = s => { k = 0; return s; };

  window.UNIT_ART = [
    // 1 The Number System: nested rings of number families, and a dot hopping along a number line.
    reset(`<ellipse class="d a" pathLength="1" style="--k:${k++}" cx="470" cy="78" rx="110" ry="58"/>` +
      `<ellipse class="d" pathLength="1" style="--k:${k++}" cx="450" cy="84" rx="70" ry="40"/>` +
      `<ellipse class="d" pathLength="1" style="--k:${k++}" cx="440" cy="90" rx="36" ry="22"/>` +
      Tx(440, 98, '1 2 3', 20, '', 'middle') + Tx(546, 62, 'π', 26, 'a', 'middle') +
      P('M240 150H580') + Array.from({ length: 7 }, (_, i) => P(`M${260 + i * 50} 143v14`, 'a')).join('') +
      `<circle class="t hop" r="7" fill="currentColor" stroke="none" style="--k:${k++};offset-path:path('M260 140Q285 112 310 140Q335 112 360 140Q385 112 410 140')"/>`),
    // 2 Ratios, Proportions, and Percents: one marked object to three others; one of four is 25%.
    reset(C(275, 48, 10) + C(350, 48, 10, 'a') + C(385, 48, 10, 'a') + C(420, 48, 10, 'a') +
      `<circle class="t" style="--k:${k++}" cx="275" cy="48" r="5" fill="currentColor" stroke="none"/>` +
      Tx(347, 100, '1 : 3', 32, '', 'middle') + P('M258 119v9h180v-9', 'a') +
      Tx(347, 163, '1 / 4', 28, 'a', 'middle') + C(522, 88, 48) +
      `<path d="M522 88V40A48 48 0 0 1 570 88Z" fill="currentColor" stroke="none" opacity=".14"/>` +
      `<path class="cut" d="M522 88V40A48 48 0 0 1 570 88Z" fill="currentColor" stroke="none"/>` +
      P('M522 40V88H570', 'a') + Tx(522, 163, '25%', 26, '', 'middle')),
  ];
})();
