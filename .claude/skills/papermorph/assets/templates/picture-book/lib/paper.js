/* paper.js — a paper-cutout stop-motion kit on top of the engine.
   Sets are baked bitmaps (img/sets/, from SKILL/scripts/bake_sets.py or painted.py); puppets are live SVG pieces with the
   same paper filter. Everything moves on a 12 fps clock (on twos), each frame with its own small hand jitter, so
   pause, seek and ?beat=N&t=S show exactly the frame a viewer would see. */
'use strict';
const FPS = 12;

// Filters, mouths and patterns live in their own hidden SVG: the engine clears the scene at every beat.
const PAPER_DEFS = `<defs>
  <filter id="paper" x="-15%" y="-15%" width="130%" height="135%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="cut"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="7" result="fib"/>
    <feColorMatrix in="fib" type="matrix" values="0 0 0 0 .25  0 0 0 0 .17  0 0 0 0 .08  .5 0 0 0 -.14" result="tint"/>
    <feComposite in="tint" in2="cut" operator="in" result="grain"/>
    <feMerge result="tex"><feMergeNode in="cut"/><feMergeNode in="grain"/></feMerge>
    <feDropShadow in="tex" dx="2.5" dy="3.5" stdDeviation="2.2" flood-color="#2a1608" flood-opacity=".38"/>
  </filter>
  <pattern id="check" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect width="10" height="10" fill="#f6efe0"/><rect width="5" height="5" fill="#c8322f"/><rect x="5" y="5" width="5" height="5" fill="#c8322f"/>
  </pattern>
  <g id="mX"><path d="M-8,-1 Q0,6 8,-1" fill="none" stroke="#5a2a1e" stroke-width="2.6" stroke-linecap="round"/></g>
  <g id="mA"><path d="M-7,1 L7,1" fill="none" stroke="#5a2a1e" stroke-width="2.6" stroke-linecap="round"/></g>
  <g id="mB"><ellipse rx="6.5" ry="2.6" fill="#6b1f1f"/></g>
  <g id="mC"><ellipse rx="7" ry="4.6" fill="#6b1f1f"/><ellipse cy="2.6" rx="4" ry="1.8" fill="#e07a78"/></g>
  <g id="mD"><path d="M-9,-3 Q0,-5 9,-3 Q8,9 0,10 Q-8,9 -9,-3Z" fill="#6b1f1f"/><ellipse cy="6.5" rx="5" ry="2.6" fill="#e07a78"/></g>
  <g id="mE"><ellipse rx="5" ry="6" fill="#6b1f1f"/></g>
  <g id="mF"><circle r="3.6" fill="#6b1f1f"/></g>
  <g id="mG"><ellipse rx="6.5" ry="2.6" fill="#6b1f1f"/><path d="M-5,-1.5 h10" stroke="#f6efe0" stroke-width="2"/></g>
  <g id="mH"><ellipse rx="6" ry="3.8" fill="#6b1f1f"/><ellipse cy="-1" rx="2.6" ry="1.6" fill="#e07a78"/></g>
  <radialGradient id="vignette" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#1e0f05" stop-opacity="0"/><stop offset="100%" stop-color="#1e0f05" stop-opacity=".45"/></radialGradient>
</defs>`;
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${PAPER_DEFS}</svg>`);
// The exposure flicker is an HTML layer over the stage: changing it every frame inside the SVG would repaint the whole picture.
const FLICKER = document.getElementById('stage').insertAdjacentElement('afterend', Object.assign(document.createElement('div'),
  { style: 'position:absolute;left:0;top:0;width:1600px;height:900px;background:#000;opacity:0;pointer-events:none;will-change:opacity' }));

// Seeded noise in [-1, 1]: the same frame always gets the same jitter.
function jit(f, k) { let h = Math.imul(f * 374761393 + k * 668265263, 1274126177); h ^= h >>> 13; h = Math.imul(h, 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 2147483648 - 1; }
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const span = (t, a, b) => ease((t - a) / (b - a));

// draw(q, f) runs once per 12 fps frame with q the frame's time; a pure function of time, like every beat clock.
// It runs to the beat's end, through the engine's hold after D (HOLD s), so a scene poses sensibly for q up to D + HOLD.
function stopClock(D, draw) { let last = null; clockRun(t => { const f = Math.floor(t * FPS + 1e-6); if (f === last) return; last = f; draw(f / FPS, f); }, D, { tail: true }); }

/* ---------- camera over a baked set ----------
   A view {x, y, z} is the world point at the frame's centre and the zoom. Moves: to(view, t0, dur) eases each given
   key from where the camera is at t0 (zooms keep one world point still, as the engine's camera does); cut(view, t0).
   Layers slide by their parallax factor k against the base view. soft(t0, on) swaps the far layers (k < 1) for their
   blurred copies: shallow focus on close shots (on = 'all' blurs the puppets' plane too, for a set seen behind a close-up). Puppets go in cam.stage, on the k = 1 plane in front of `after`. */
function paperCam(p, setName, v0 = {}, { after = null, stages = [] } = {}) {
  const root = mk('g', {}, p), view = mk('g', {}, root), world = mk('g', {}, view), layers = [], ops = [], softs = [], shakes = [];
  let stage = null; const stageAt = {};
  for (const L of SETS[setName]) {
    const g = mk('g', {}, world), [x, y, width, height] = L.box, img = { x, y, width, height, preserveAspectRatio: 'none' };
    const sharp = mk('image', { href: `../img/sets/${setName}/${L.name}.webp`, ...img }, g);
    const blur = L.soft ? mk('image', { href: `../img/sets/${setName}/${L.name}-soft.webp`, ...img, visibility: 'hidden' }, g) : null;
    layers.push({ g, k: L.k, sharp, blur, name: L.name });
    if (stages.includes(L.name)) layers.push({ g: stageAt[L.name] = mk('g', {}, world), k: L.k });
    if (L.name === after || (!after && L.k === 1 && !stage)) layers.push({ g: stage = mk('g', {}, world), k: 1 });
  }
  mk('rect', { width: 1600, height: 900, fill: 'url(#vignette)' }, root);
  // Parallax is measured from the set's own framing (base), wherever the beat's first view is.
  const base = { x: 800, y: 450, z: 1 }, start = { ...base, ...v0 };
  function at(t, n = ops.length) {
    const s = { ...start };
    for (let i = 0; i < n && ops[i].t0 <= t; i++) {
      const o = ops[i], a = o.from || (o.from = at(o.t0, i)), q = o.dur ? ease(Math.min(1, (t - o.t0) / o.dur)) : 1;
      const v = {}; for (const k in o.v) v[k] = typeof o.v[k] === 'function' ? o.v[k](t) : o.v[k];   // a key may follow
      if ('z' in v) s.z = a.z * (v.z / a.z) ** q;
      const u = 'z' in v && Math.abs(v.z - a.z) > 1e-6 ? (1 / s.z - 1 / a.z) / (1 / v.z - 1 / a.z) : q;
      for (const k of ['x', 'y']) if (k in v) s[k] = a[k] + (v[k] - a[k]) * u;
    }
    return s;
  }
  const cam = { root, world, stage, stageAt, at,
    to(v, t0, dur = 1) { ops.push({ v, t0, dur }); ops.sort((a, b) => a.t0 - b.t0); ops.forEach(o => delete o.from); return cam; },
    cut: (v, t0) => cam.to(v, t0, 0),
    show(name, on) { for (const L of layers) if (L.name === name) vis(L.g, on); return cam; },   // swap a set layer (weather)
    soft(t0, on) { softs.push([t0, on]); softs.sort((a, b) => a[0] - b[0]); return cam; },
    shake(t0, dur, amp = 10) { shakes.push([t0, dur, amp]); return cam; },
    apply(q, f) {
      const s = at(q);
      let sx = 0, sy = 0;
      for (const [t0, d, amp] of shakes) if (q >= t0 && q < t0 + d) { sx += jit(f, 91) * amp; sy += jit(f, 92) * amp; }
      view.setAttribute('transform', `translate(${800 + sx} ${450 + sy}) scale(${s.z}) translate(${-s.x} ${-s.y})`);
      const dx = s.x - base.x, dy = s.y - base.y;
      let soft = false; for (const [t0, on] of softs) if (q >= t0) soft = on;
      for (const L of layers) {
        L.g.setAttribute('transform', `translate(${((1 - L.k) * dx).toFixed(1)} ${((1 - L.k) * dy).toFixed(1)})`);
        if (L.blur) { const b = soft === 'all' || (soft && L.k < 1); vis(L.blur, b); vis(L.sharp, !b); }   // never 'visible': it would show through a hidden camera
      }
      FLICKER.style.opacity = (.02 + .02 * jit(f, 30)).toFixed(3);   // the exposure flicker of real frames
    },
  };
  return cam;
}

/* ---------- small live pieces ---------- */
// Chimney smoke: paper puffs that rise, drift and fade, one cycle every `every` seconds.
function smoke(parent, x, y, n = 4, every = 3.2) {
  const puffs = Array.from({ length: n }, () => { const g = mk('g', {}, parent); g.innerHTML = '<g filter="url(#paper)"><circle r="20" fill="#f4ecdc"/></g>'; return g; });
  bakeAll(parent);
  return q => puffs.forEach((g, i) => {
    const u = ((q / every + i / n) % 1 + 1) % 1;
    tf(g, `translate(${(x + 60 * u + 12 * Math.sin(u * 6)).toFixed(1)},${(y - 190 * u).toFixed(1)}) scale(${((14 + 30 * u) / 20).toFixed(3)})`);
    g.setAttribute('opacity', (Math.min(1, u * 5) * (1 - u) * .95).toFixed(2));
  });
}

// The mouth shape a clip's cues give `t` seconds into it ('X' rest before and after).
const mouthAt = (clip, t) => { let m = 'X'; if (t < 0) return m; for (const [at, k] of MOUTHS[clip] || []) { if (at > t) break; m = k; } return m; };

/* ---------- puppets ----------
   A puppet is paper pieces on brass pins, built at its hip (0, 0) facing right, feet near y 166. pose(o, f) sets the
   whole state for frame f; any key left out keeps its rest value. A profile puppet that turns round squashes its
   side figure, shows its whole front figure through the thin middle of the turn and comes out mirrored (puppets.md). */
const pinAt = (x, y) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#caa24c" stroke="#7d5f22" stroke-width="1.2"/>`;
const tf = (el, s) => { if (el._t !== s) el.setAttribute('transform', el._t = s); };
const vis = (el, on) => { const v = on ? 'inherit' : 'hidden'; if (el._v !== v) el.setAttribute('visibility', el._v = v); };

function pieces(g) { const o = {}; g.querySelectorAll('[data-p]').forEach(e => o[e.dataset.p] = e); return o; }
function face(h, o) {   // eyes and mouth of one head
  h.querySelectorAll('.eyeO').forEach(e => vis(e, !o.shut)); h.querySelectorAll('.eyeC').forEach(e => vis(e, !!o.shut));
  h.querySelectorAll('.mouth').forEach(e => { const m = '#m' + (o.mouth || 'X'); if (e._m !== m) e.setAttribute('href', e._m = m); });
}
// Blinks: closed for two frames at each listed time.
const blinking = (q, times) => times.some(b => q >= b && q < b + 2 / FPS);

/* ---------- baking puppet pieces ----------
   Running the paper filter live on every piece costs too much once a close-up enlarges them, so every filtered
   piece is drawn once to a bitmap (at RES px per unit) and replaced by that image. Parts that change (eyes, mouths,
   brows, pieces with data-p) stay live; a filtered live part is baked on its own. Identical pieces share one bitmap. */
const RES = 4, bakedReady = new Map(), bakedJobs = new Map(), PAPER_EXTRA = [];   // extra defs (patterns) other files add
// Pieces baked ahead of time (SKILL/scripts/bake_puppets.py): img/puppets/<hash>.webp, listed in
// window.BAKED. A piece missing from it (just edited) is baked here in the browser; ?bake ignores the list.
const BAKED = new URLSearchParams(location.search).has('bake') ? {} : (window.BAKED || {});
const keyHash = k => { let h = 2166136261; for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619); return (h >>> 0).toString(16).padStart(8, '0'); };
const isLive = e => e.hasAttribute('data-p') || ['eyeO', 'eyeC', 'mouth'].some(c => e.classList.contains(c));
function rasterize(svg, w, h) {
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(img.src); c.toBlob(b => ok(URL.createObjectURL(b))); };
    img.onerror = no;
    img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  });
}
function bakeAll(root) {
  // Measure everything first, then change the DOM: a getBBox after each change would lay the page out again every time.
  const covered = el => { for (let c = el, a = el.parentNode; a && a !== root; c = a, a = a.parentNode) if (isLive(c)) return false; else if (a.hasAttribute?.('filter')) return true; return false; };
  const items = [];
  for (const el of root.querySelectorAll('[filter]')) {
    if (covered(el)) continue;   // drawn into a filtered ancestor's bitmap
    const bb = el.getBBox(), x = Math.floor(bb.x - 10), y = Math.floor(bb.y - 10), w = Math.ceil(bb.width + 22), h = Math.ceil(bb.height + 24);
    const clone = el.cloneNode(true);
    ['transform', 'visibility', 'data-p', 'opacity'].forEach(a => clone.removeAttribute(a));
    [...clone.children].forEach((c, i) => { if (isLive(el.children[i])) c.remove(); });
    items.push({ el, x, y, w, h, html: clone.outerHTML });
  }
  const jobs = [];
  for (const { el, x, y, w, h, html } of items) {
    const key = `${x} ${y} ${w} ${h}|${html}`;
    const apply = url => {
      if (!el.hasAttribute('filter')) return;
      el.removeAttribute('filter');
      [...el.children].forEach(c => { if (!isLive(c)) c.remove(); });
      el.insertBefore(mk('image', { href: url, x, y, width: w, height: h }), el.firstChild);
    };
    const file = BAKED[keyHash(key)];
    if (file) { apply(`../img/puppets/${file}`); continue; }
    if (bakedReady.has(key)) { apply(bakedReady.get(key)); continue; }
    if (!bakedJobs.has(key)) bakedJobs.set(key, rasterize(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w * RES}" height="${h * RES}" viewBox="${x} ${y} ${w} ${h}">${PAPER_DEFS}<defs>${PAPER_EXTRA.join('')}</defs>${html}</svg>`, w * RES, h * RES)
      .then(url => (bakedReady.set(key, url), url)));
    jobs.push(bakedJobs.get(key).then(apply));
  }
  return Promise.all(jobs);
}
// Build the book's pieces once at load, off screen, so their bitmaps are ready before the first beat needs them.
function paperWarm(build) {
  const svg = mk('svg', { width: 1, height: 1, style: 'position:absolute;left:-10px;top:-10px' });
  document.body.appendChild(svg);
  build(mk('g', {}, svg));
  return bakeAll(svg).then(() => svg.remove());
}

/* ---------- walking ----------
   A compass walk: the stance foot stays planted while the hip rides over it, so feet never slide. tau seconds into
   the walk, `period` s per two steps; returns leg angles and knee bends (degrees), how far the hip has travelled (d)
   and how far it has dropped from standing (drop), both in the puppet's own units. */
function walk(tau, { L = 166, A = 22, period = 1, knee = 38 } = {}) {
  tau = Math.max(0, tau);
  const a = A * Math.PI / 180, ph = 2 * Math.PI * tau / period, j = Math.floor((ph + Math.PI / 2) / Math.PI);
  const ts = (j % 2 ? 1 : -1) * a * Math.sin(ph), near = a * Math.sin(ph) * 180 / Math.PI;
  const swing = knee * Math.max(0, Math.cos(ph - j * Math.PI)), nearStance = j % 2 === 1;
  return { ph, d: j * 2 * L * Math.sin(a) - L * Math.sin(ts), drop: L * (1 - Math.cos(ts)),
           near, far: -near, kNear: nearStance ? 0 : swing, kFar: nearStance ? swing : 0 };
}

// A piece of the set that sits in front of puppets (a trunk, a bush, a blanket): drawn like a puppet piece, baked.
function prop(parent, svg, attrs = {}) { const g = mk('g', attrs, parent); g.innerHTML = svg; bakeAll(g); return g; }

// The iris closing on (cx, cy) between t0 and t0 + dur, as in old films; then black.
function iris(p, t0, dur, cx, cy) {
  const e = mk('path', { fill: '#120a05', 'fill-rule': 'evenodd' }, p);
  return q => {
    const u = (q - t0) / dur; vis(e, u > 0);
    if (u <= 0) return;
    const r = Math.max(0, 1900 * (1 - ease(Math.min(1, u))));
    e.setAttribute('d', `M-50,-50 H1650 V950 H-50 Z M${cx - r},${cy} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0 Z`);
  };
}
// A scene change: a tree trunk (or any dark foreground, redraw it) passing close in front of the camera, right to left: 'in' ends with the frame covered (a scene
// ends), 'out' starts covered and uncovers it (the next scene begins).
function trunkWipe(p, t0, dur, mode = 'in') {
  const g = mk('g', {}, p);
  g.innerHTML = `<g filter="url(#paper)"><path d="M0,-40 C40,200 -30,600 20,940 L2100,940 L2100,-40 Z" fill="#5a3b24"/>
    ${[160, 420, 700, 980, 1300, 1600].map((x, i) => `<path d="M${x},-40 C${x + 30},${200 + i * 40} ${x - 40},${560 - i * 30} ${x + 10},940" stroke="#46301d" stroke-width="${10 + (i % 3) * 5}" fill="none"/>`).join('')}</g>`;
  bakeAll(g);
  const [a, b] = mode === 'in' ? [1650, -200] : [-200, -2150];
  return q => { const u = Math.min(1, Math.max(0, (q - t0) / dur)); vis(g, mode === 'in' ? u > 0 : u < 1); tf(g, `translate(${(a + (b - a) * ease(u)).toFixed(0)},0)`); };
}
// The title card at the end: a paper label that drops in on its pin, as wide as its words. Give the words in the book's
// language; { x, y } is the card's centre (default the frame's centre), size the letters' height in px (a title too long
// for the frame gets smaller letters). Put it where it covers nothing the last shot needs (a score, a face).
function endCard(p, t0, words = 'The End', { x = 800, y = 450, size = 78 } = {}) {
  const c = document.createElement('canvas').getContext('2d'), wide = s => (c.font = `italic ${s}px Georgia, serif`, c.measureText(words).width + 2.2 * s);
  if (wide(size) > 1500) size = Math.floor(size * 1500 / wide(size));
  const w = Math.max(480, Math.ceil(wide(size))), h = Math.round(size * 3.08), L = Math.round(x - w / 2), T = Math.round(y - h / 2);
  const g = prop(p, `<g filter="url(#paper)"><rect x="${L}" y="${T}" width="${w}" height="${h}" rx="14" fill="#f3e9d2"/><rect x="${L + 20}" y="${T + 20}" width="${w - 40}" height="${h - 40}" rx="8" fill="none" stroke="#c8322f" stroke-width="5"/></g>
    <text x="${x}" y="${Math.round(y + size * .36)}" text-anchor="middle" font-family="Georgia, serif" font-size="${size}" font-style="italic" fill="#5a2a1e">${words}</text>${pinAt(x, T + 12)}`);
  return q => { const u = (q - t0) * FPS; vis(g, u >= 0); const d = [-60, -20, 8, -3, 0][Math.min(4, Math.max(0, Math.floor(u / 2)))]; tf(g, `translate(0,${d})`); };
}
