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
    // Unit 4, Energy: a ball rolls up a hill and back, the sun shines, two bars trade height.
    reset(P('M220 150H300C380 150 420 60 520 56H580') +
      `<circle class="t hop" r="11" fill="currentColor" stroke="none" style="--k:${k++};offset-path:path('M290 139C370 139 410 58 470 52C410 58 370 139 290 139')"/>` +
      C(540, 30, 14, 'a') + P('M520 30h-10M560 30h10M540 10v-8M540 50v8', 'a') +
      P('M240 120V70', '', 'stroke-width="14"') + P('M262 120V100', '', 'stroke-width="14"') +
      Tx(240, 172, 'energy changes form', 20, 'a')),
  ];
})();
