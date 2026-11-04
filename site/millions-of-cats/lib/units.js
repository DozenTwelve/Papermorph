// The unit headers of a book's contents page, the same in every book; styled by units.css. The sketches come from
// the book's own unit-art.js (window.UNIT_ART, one SVG body per unit, viewBox 0 0 600 180).
//   Units.header(u, label, title)  the sketch and heading for unit u, as HTML to put first in its <section class="unit">
//   Units.watch()                  draw each sketch the first time its unit scrolls into view, and run its loop only
//                                  while the unit is on screen
'use strict';
(() => {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const header = (u, label, title) =>
    `<svg class="unit-art" viewBox="0 0 600 180" aria-hidden="true">${window.UNIT_ART?.[u] || ''}</svg>` +
    `<h2><span class="label">${esc(label)}</span><span class="title">${esc(title)}</span></h2>`;

  function watch(root = document) {
    const units = root.querySelectorAll('.unit');
    if (!('IntersectionObserver' in window)) return units.forEach(u => u.classList.add('seen', 'live'));
    // The first sight draws the sketch; leaving the screen (or sliding under the sticky bar) pauses it.
    const first = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('seen'); first.unobserve(e.target); }
    }), { threshold: .25 });
    const live = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)),
      { rootMargin: '-64px 0px 0px 0px' });
    units.forEach(u => { first.observe(u); live.observe(u); });
  }

  window.Units = { header, watch };
})();
