// Papermorph clay kit, page side: the pictures claykit.py rendered in Blender. Load after engine.js and the manifest
// (../img/clay/clay.js, window.CLAY). Plates (a set without its movers) and sprites (one mover with its shadow, on a
// transparent film) are clImg; strips (a wheel or a ball at N angles, a walker's N poses, side by side) are clStrip.
// The page moves them on the beat clock. Orthographic projection preserves size; keep the sprite's light, depth of
// field and receiving ground appropriate along its path (references/core/clay.md). Labels stay SVG over them.
'use strict';
const CL = window.CLAY, CLI = CL.img;
const clSrc = name => `${CL.base || '../img/clay/'}${name}.webp`;   // the manifest says where it is (claykit.py writes CLAY.base)
const clOf = name => CLI[name] || (() => { throw new Error(`clay.js: no picture '${name}' in the manifest (render it with the scene's --only ${name})`); })();
const clLoaded = new Map();
function clayReady(names = Object.keys(CLI)) {
  return Promise.all(names.map(name => {
    clOf(name);
    if (!clLoaded.has(name)) {
      const im = new Image(); im.src = clSrc(name);
      clLoaded.set(name, im.decode().catch(() => { throw new Error(`clay.js: ${clSrc(name)} did not load or decode; render it again or check the manifest folder`); }));
    }
    return clLoaded.get(name);
  }));
}

// Boot the page once its pictures decode. Until then clicks and keys stop at the window (links still open): a start
// pressed while loading would be undone by boot's seek(0), leaving the cover gone and the lesson paused.
function clayBoot(names) {
  const hold = e => e.stopImmediatePropagation(), types = ['click', 'keydown'];
  for (const t of types) addEventListener(t, hold, true);
  return Promise.resolve(names).then(clayReady).finally(() => { for (const t of types) removeEventListener(t, hold, true); }).then(boot);   // a failed decode frees the keys (help still opens) but never boots
}

// A plate (at its page place), or a sprite placed by its anchor (a vehicle: the middle of its lane under its centre; a person: the feet).
function clImg(p, name, o = {}) {
  const m = clOf(name), g = G(p, o);
  mk('image', { href: clSrc(name), x: m.x, y: m.y, width: m.w, height: m.h }, g);
  return g;
}
// A strip: frame k of n shows through a window (wheels and balls turn by showing the next angle).
function clStrip(p, name, o = {}) {
  const m = clOf(name), g = G(p, o);
  const v = mk('svg', { x: m.x, y: m.y, width: m.w, height: m.h, viewBox: `0 0 ${m.w} ${m.h}` }, g);
  mk('image', { href: clSrc(name), width: m.w * m.n, height: m.h }, v);
  g._k = 0; g._n = m.n; g._r = m.r;
  g._frame = k => { k = ((k % m.n) + m.n) % m.n; if (k !== g._k) v.setAttribute('viewBox', `${(g._k = k) * m.w} 0 ${m.w} ${m.h}`); };
  return g;
}
// The frame for a thing of rolling radius r that has rolled `dist` px to the right: the nearest of the n angles.
// A walker: clStrip's frame round(dist / step * n), step its stride_length (clayprops.py) in the manifest.
const clTurn = (s, dist, r = s._r, lead = 0) => s._frame(Math.round(dist / r / (2 * Math.PI) * s._n) + lead);
// A prop that holds text (clayprops.board: a chalkboard, a pinned card), placed by its feet at (x, y). Returns its
// group and its panel's page rectangle, to lay the text out on.
function clBoard(p, name, x, y, o = {}) {
  const g = clImg(p, name, { x, y, ...o }), [x0, y0, x1, y1] = clOf(name).panel;
  return { g, x0: x + x0, y0: y + y0, x1: x + x1, y1: y + y1, cx: x + (x0 + x1) / 2, cy: y + (y0 + y1) / 2 };
}
