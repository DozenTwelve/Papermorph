// Chalk sketches for the unit headers on the contents page, one per unit, drawn in the unit's colour.
// Each entry is the inside of an SVG with viewBox 0 0 600 180; keep the left ~200 px light (the unit title sits there
// on narrow screens). Classes, styled in lib/units.css:
//   d  a stroke that draws itself in when the unit scrolls into view (--k orders the strokes)
//   t  text or a filled shape that fades in
//   a  faint chalk white instead of the unit colour;  faint  even fainter
// A sketch may add one looping motion after it is drawn: give an element a class that lib/units.css animates (swap-a,
// hop, orbit, ride, spin, tilt, breathe, ...), or add your own .seen .unit-art .NAME rule and keyframes in a <style> in index.html.
'use strict';
(() => {
  let k = 0;
  const P = (d, cls = '', extra = '') => `<path class="d ${cls}" pathLength="1" style="--k:${k++}" d="${d}" ${extra}/>`;
  const Tx = (x, y, s, size = 24, cls = '', anchor = 'start') => `<text class="t ${cls}" style="--k:${k++}" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${s}</text>`;
  const C = (cx, cy, r, cls = '') => `<circle class="d ${cls}" pathLength="1" style="--k:${k++}" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const reset = s => { k = 0; return s; };

  window.UNIT_ART = [
    // 1 The geometry of linear equations: two lines meet at a point; the same point is a mix of two arrows.
    reset(P('M240 160L420 20') + P('M232 60L428 140', 'a') +
      `<circle class="t ping" cx="330" cy="91" r="9" fill="currentColor" stroke="none" style="--k:${k++}"/>` +
      P('M470 150L540 120', '', 'stroke-width="5"') + P('M540 120L520 60', 'a', 'stroke-width="5"') + P('M470 150L520 60', 'faint', 'stroke-dasharray="6 6"') +
      Tx(230, 176, 'row picture', 18, 'a') + Tx(470, 176, 'column picture', 18, 'a')),
  ];
})();
