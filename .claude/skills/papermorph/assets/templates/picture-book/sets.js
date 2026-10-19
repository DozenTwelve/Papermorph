// Paper sets, drawn once and baked to bitmaps: uv run --with playwright --with pillow python SKILL/scripts/bake_sets.py
//   books/<book>/art/sets.js site/<book>
// The paper filters are too heavy to run on large layers every frame. Each set is a function returning a list of
// layers back to front: {name, k, box: [x, y, w, h] in world px, scale, svg, soft?}.
//   k      parallax: 1 moves with the puppets' plane, below 1 is farther (slides less when the camera pans).
//   scale  bitmap pixels per world px (1.2 is plenty for a 1600 x 900 frame; raise it for layers a close-up fills).
//   soft   false skips the blurred -soft copy (use it for small foreground pieces); the camera swaps the copy in for
//          shallow focus on close shots.
// The puppets stand on the first k = 1 layer ('floor' below) and in front of it; layers after it hide them (the table).
// Give a layer more room than the 1600 x 900 frame (here -100 … 1700) so a pan or shake never shows its edge.
// These sketches are a finished look on their own (free) and the composition reference an image model repaints:
// bake one, give the picture to paint.py as a reference, and put the result in with painted.py.
const DEFS = `<defs>
  <filter id="paper" x="-15%" y="-15%" width="130%" height="135%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="cut"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="7" result="fib"/>
    <feColorMatrix in="fib" type="matrix" values="0 0 0 0 .25  0 0 0 0 .17  0 0 0 0 .08  .5 0 0 0 -.14" result="tint"/>
    <feComposite in="tint" in2="cut" operator="in" result="grain"/>
    <feMerge result="tex"><feMergeNode in="cut"/><feMergeNode in="grain"/></feMerge>
    <feDropShadow in="tex" dx="2.5" dy="3.5" stdDeviation="2.2" flood-color="#2a1608" flood-opacity=".38"/>
  </filter>
  <filter id="paperBig" x="-5%" y="-10%" width="110%" height="125%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="cut"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="11" result="fib"/>
    <feColorMatrix in="fib" type="matrix" values="0 0 0 0 .25  0 0 0 0 .17  0 0 0 0 .08  .5 0 0 0 -.15" result="tint"/>
    <feComposite in="tint" in2="cut" operator="in" result="grain"/>
    <feMerge result="tex"><feMergeNode in="cut"/><feMergeNode in="grain"/></feMerge>
    <feDropShadow in="tex" dx="4" dy="6" stdDeviation="5" flood-color="#2a1608" flood-opacity=".32"/>
  </filter>
</defs>`;
// Wrap shapes in the paper filter: 'paper' for pieces, 'paperBig' for large flat areas.
const P = (body, f = 'paper') => `<g filter="url(#${f})">${body}</g>`;
const win = (x, y, w, h, glass = '#9cc6de', frame = '#f4f1ea') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${glass}"/><path d="M${x},${y} h${w} v${h} h${-w} Z M${x + w / 2},${y} v${h}" fill="none" stroke="${frame}" stroke-width="6"/>`;

// A room: back wall with a window and a picture, a floor, and a table in front of the puppets.
function room() {
  const wall = P(`<rect x="-100" y="-60" width="1800" height="800" fill="#f3ecd9"/>`, 'paperBig')
    + P(`${win(1100, 140, 260, 300)}<path d="M1090,130 h280 v320 h-280 Z" fill="none" stroke="#c9bfa6" stroke-width="10"/>`)
    + P(`<rect x="300" y="170" width="260" height="170" fill="#7ec0e0"/><path d="M300,340 l70,-90 l60,60 l50,-70 l80,100 Z" fill="#6f9a6a"/><circle cx="480" cy="230" r="22" fill="#ffe08a"/>`);
  const floor = P(`<rect x="-100" y="700" width="1800" height="320" fill="#c69a64"/>${Array.from({ length: 8 }, (_, i) => `<path d="M-100,${730 + i * 36} h1800" stroke="#b78a55" stroke-width="3"/>`).join('')}`, 'paperBig');
  const table = P(`<rect x="1040" y="660" width="440" height="30" rx="6" fill="#8a5a36"/><rect x="1070" y="690" width="24" height="170" fill="#8a5a36"/><rect x="1430" y="690" width="24" height="170" fill="#8a5a36"/>
      <circle cx="1420" cy="636" r="26" fill="#e9dcc4"/><rect x="1400" y="610" width="40" height="8" fill="#c8322f"/>`);
  return [
    { name: 'wall', k: .85, box: [-100, -60, 1800, 800], scale: 1.2, svg: wall },
    { name: 'floor', k: 1, box: [-100, 690, 1800, 330], scale: 1.2, svg: floor },
    { name: 'table', k: 1, box: [1000, 590, 520, 290], scale: 1.5, soft: false, svg: table },
  ];
}

const SETS = { room };
if (typeof window !== 'undefined') window.SETS = SETS, window.SET_DEFS = DEFS;
