/* How a walking figure is drawn. figureSprite(id) is the only way the page asks for one: it returns SVG markup on a
   120 x 260 base, the feet at (60, feet), facing right (the page mirrors it to walk left), and its width and height.
   The sample draws a paper cut-out in the person's colour; a book replaces it with its own drawing, or a painted
   cut-out: `<image href="img/figures/${id}.webp" x=... y=... width=... height=...>` (The Map Redrawn does). */
'use strict';
window.figureSprite = id => {
  const c = PEOPLE[id].color, ink = '#2a2520', skin = '#e9c9a8';
  const markup = `<g stroke="${ink}" stroke-width="3" stroke-linejoin="round">
    <path d="M48,180 L44,248 L58,248 L60,196 L62,248 L76,248 L72,180Z" fill="${ink}"/>
    <path d="M38,92 Q60,80 82,92 L90,188 Q60,198 30,188Z" fill="${c}"/>
    <path d="M38,98 L24,160 L34,163 L46,120Z M82,98 L96,160 L86,163 L74,120Z" fill="${c}"/>
    <circle cx="60" cy="64" r="20" fill="${skin}"/>
    <path d="M36,50 L84,50 L76,44 L72,24 L48,24 L44,44Z" fill="${ink}"/>
  </g>`;
  return { markup, feet: 252, width: 76, height: 230 };
};
