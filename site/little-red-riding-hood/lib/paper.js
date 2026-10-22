/* paper.js — a paper-cutout stop-motion kit on top of the engine.
   Sets are baked bitmaps (img/sets/, baked from SVG set sketches); puppets are live SVG pieces with the
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
function stopClock(D, draw) { let last = null; clockRun(t => { const f = Math.floor(t * FPS + 1e-6); if (f === last) return; last = f; draw(f / FPS, f); }, D); }

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
    layers.push({ g, k: L.k, sharp, blur });
    if (stages.includes(L.name)) layers.push({ g: stageAt[L.name] = mk('g', {}, world), k: L.k });
    if (L.name === (after || 'house') || (!after && L.k === 1 && !stage)) layers.push({ g: stage = mk('g', {}, world), k: 1 });
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
   whole state for frame f; any key left out keeps its rest value. turn (1 … -1) squashes the flat figure to turn it
   round: through the thin middle (|turn| < .55) the front head shows, past it the figure is the mirrored profile. */
const pinAt = (x, y) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#caa24c" stroke="#7d5f22" stroke-width="1.2"/>`;
const tf = (el, s) => { if (el._t !== s) el.setAttribute('transform', el._t = s); };
const vis = (el, on) => { const v = on ? 'inherit' : 'hidden'; if (el._v !== v) el.setAttribute('visibility', el._v = v); };
function legPiece(id, sock, shoe, thigh = 94, shin = 82, w = 18) {
  const k = thigh - 8, f = k + shin - 10;
  return `<g data-p="${id}"><g filter="url(#paper)"><rect x="${-w / 2}" y="-4" width="${w}" height="${thigh}" rx="8" fill="${sock}"/></g>
    <g data-p="${id}k"><g filter="url(#paper)"><rect x="${-w / 2 + 1}" y="${k - 6}" width="${w - 2}" height="${shin}" rx="7" fill="${sock}"/><path d="M-10,${f} h22 q13,0 13,10 v4 h-37 z" fill="${shoe}"/></g>${pinAt(0, k)}</g></g>`;
}
// The basket with its checked cloth; its handle hangs from (14.5 + dx, -64 + dy).
const basketSVG = (dx, dy, id = 'basket') => `<g data-p="${id}" filter="url(#paper)"><g transform="translate(${dx},${dy})">
  <path d="M-18,-22 Q14,-86 46,-22" fill="none" stroke="#8a5a2a" stroke-width="6"/>
  <path d="M-26,-24 L54,-24 L45,20 L-17,20 Z" fill="#b07a3e"/><path d="M-22,-8 L50,-8 M-19,6 L47,6" stroke="#8a5a2a" stroke-width="2.5"/>
  <path d="M-24,-26 Q14,-42 52,-26 L54,-18 L-26,-18 Z" fill="url(#check)"/></g></g>`;
// A front arm hanging from its shoulder (x, y): sleeve, forearm, hand; extra goes in the hand group.
const frontArm = (id, x, y, sleeve, skin, up = 60, fore = 56, extra = '') => `<g data-p="${id}"><g filter="url(#paper)"><rect x="${x - 8.5}" y="${y - 6}" width="17" height="${up + 6}" rx="8" fill="${sleeve}"/></g>
  <g data-p="${id}f"><g filter="url(#paper)"><rect x="${x - 6.5}" y="${y + up - 6}" width="13" height="${fore}" rx="6" fill="${skin}"/><circle cx="${x}" cy="${y + up + fore - 4}" r="9.5" fill="${skin}"/>${extra}</g>
  ${pinAt(x, y + up - 2)}</g>${pinAt(x, y)}</g>`;
// The raised index finger (with its thumb) on the hand at (x, y): on the face side, so it never reads as another gesture.
const fingerSVG = (x, y, skin) => `<g data-p="finger" filter="url(#paper)"><rect x="${x + 2.5}" y="${y + 2}" width="6.5" height="24" rx="3.2" fill="${skin}"/><ellipse cx="${x - 9.5}" cy="${y - 4}" rx="5" ry="7.5" transform="rotate(-35,${x - 9.5},${y - 4})" fill="${skin}"/><path d="M${x - 6.5},${y + 5} q3,4 7,0" stroke="#c99878" stroke-width="1.6" fill="none"/></g>`;
function armsF(P, o, j, sx, sy, up) {   // the two front arms: r = screen right, l = screen left; 0 hangs down
  tf(P.rArm, `rotate(${(o.rua + j(21) * .6).toFixed(2)},${sx},${sy})`); tf(P.rArmf, `rotate(${(o.rfa + j(22) * .6).toFixed(2)},${sx},${sy + up - 2})`);
  tf(P.lArm, `rotate(${(o.lua + j(23) * .6).toFixed(2)},${-sx},${sy})`); tf(P.lArmf, `rotate(${(o.lfa + j(24) * .6).toFixed(2)},${-sx},${sy + up - 2})`);
}
// A bunch of flowers held at (x, y), kept upright by its group; `n` of its seven flowers show (bouquet: 0 … 7).
const FLOWER_COLS = ['#d6493f', '#f6efe0', '#efae48', '#d6493f', '#e88ab0', '#f6efe0', '#efae48'];
const bouquetSVG = (x, y, id) => `<g data-p="${id}"><g filter="url(#paper)"><path d="M${x},${y} l-14,-46 M${x},${y} l0,-54 M${x},${y} l14,-46 M${x},${y} l-24,-34 M${x},${y} l24,-34" stroke="#4f7a34" stroke-width="3"/></g>
  ${FLOWER_COLS.map((c, i) => { const a = (-60 + i * 20) * Math.PI / 180, r = 44 + (i % 2) * 12;
    return `<g data-p="${id}${i}" filter="url(#paper)"><circle cx="${(x + r * Math.sin(a)).toFixed(1)}" cy="${(y - r * Math.cos(a)).toFixed(1)}" r="9" fill="${c}"/><circle cx="${(x + r * Math.sin(a)).toFixed(1)}" cy="${(y - r * Math.cos(a)).toFixed(1)}" r="3" fill="#efae48"/></g>`; }).join('')}</g>`;
function bouquetPose(P, id, n, rot, x, y) {
  vis(P[id], n > 0); tf(P[id], `rotate(${rot.toFixed(2)},${x},${y})`);
  for (let i = 0; i < 7; i++) vis(P[id + i], i < n);
}
function pieces(g) { const o = {}; g.querySelectorAll('[data-p]').forEach(e => o[e.dataset.p] = e); return o; }
function face(h, o) {   // eyes and mouth of one head
  h.querySelectorAll('.eyeO').forEach(e => vis(e, !o.shut)); h.querySelectorAll('.eyeC').forEach(e => vis(e, !!o.shut));
  h.querySelectorAll('.mouth').forEach(e => { const m = '#m' + (o.mouth || 'X'); if (e._m !== m) e.setAttribute('href', e._m = m); });
}
const REST_RED = { x: 0, y: 0, s: 1, turn: 1, near: 0, far: 0, kNear: 0, kFar: 0, cape: 3, ua: -8, fa: -78, basket: true, swing: 0, headR: 0, nod: 0, head: 'P', mouth: 'X', shut: false, hop: 0, rua: 6, rfa: -4, lua: -6, lfa: 4, bouquet: 0 };
function redPuppet(parent) {
  const g = mk('g', {}, parent);
  g.innerHTML = `<g data-p="body">
    <g data-p="capeB" filter="url(#paper)"><path d="M-12,-138 C-46,-118 -78,-30 -100,50 Q-40,64 14,44 L22,-118 Z" fill="#a92a27"/></g>
    ${legPiece('legF', '#d8d1c2', '#2b1a10')}${legPiece('legN', '#f2ede1', '#3a2418')}
    <g filter="url(#paper)"><path d="M-38,-46 L38,-46 C48,0 58,30 64,56 Q0,70 -64,56 C-58,30 -48,0 -38,-46 Z" fill="#2d4f86"/></g>
    <g filter="url(#paper)"><path d="M6,-42 L36,-42 C44,0 50,30 54,52 Q30,60 8,58 Z" fill="#f4efe2"/></g>
    <g filter="url(#paper)"><path d="M-28,-128 L26,-128 L34,-42 L-34,-42 Z" fill="#2d4f86"/><rect x="-8" y="-150" width="16" height="28" fill="#f6d2b5"/></g>
    <g filter="url(#paper)"><path d="M-30,-152 Q5,-160 28,-140 L36,-94 Q0,-84 -50,-88 Q-48,-122 -30,-152 Z" fill="#c8322f"/></g>
    <g data-p="headP"><g filter="url(#paper)">
      <path d="M-50,-190 C-55,-252 32,-264 54,-214 C64,-188 58,-160 40,-148 L-40,-140 C-56,-150 -52,-172 -50,-190 Z" fill="#c8322f"/>
      <circle cx="14" cy="-192" r="40" fill="#f6d2b5"/><circle cx="53" cy="-189" r="7" fill="#f6d2b5"/>
      <path d="M-18,-214 Q16,-242 52,-210 Q32,-220 12,-205 Q-4,-214 -18,-198 Z" fill="#6b3b22"/>
      <path d="M-46,-195 C-46,-247 42,-260 60,-212 C42,-240 -8,-242 -20,-196 C-24,-170 -16,-150 -6,-142 L-40,-140 C-52,-155 -48,-176 -46,-195 Z" fill="#b02c29"/>
      <circle cx="31" cy="-176" r="8.5" fill="#ef9a8a" opacity=".8"/>
      <g class="eyeO"><ellipse cx="34" cy="-198" rx="4.5" ry="6.2" fill="#22150e"/></g>
      <g class="eyeC"><path d="M29,-197 Q34,-193 39,-197" fill="none" stroke="#22150e" stroke-width="2.4" stroke-linecap="round"/></g>
      <use class="mouth" href="#mX" transform="translate(41,-172) scale(.85)"/></g>${pinAt(0, -146)}</g>
    <g data-p="arm"><g filter="url(#paper)"><rect x="6" y="-134" width="17" height="64" rx="8" fill="#f4efe2"/></g>
      <g data-p="fore"><g filter="url(#paper)"><rect x="8.5" y="-80" width="12" height="54" rx="6" fill="#f6d2b5"/><circle cx="14.5" cy="-26" r="9" fill="#f6d2b5"/></g>
        ${basketSVG(0, 0)}${bouquetSVG(14.5, -26, 'bq')}${pinAt(14.5, -76)}</g>
      ${pinAt(14.5, -128)}</g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><path d="M-36,-140 L36,-140 L72,50 Q0,64 -72,50 Z" fill="#a92a27"/></g>
    <g filter="url(#paper)"><rect x="-21" y="46" width="16" height="114" rx="7" fill="#f2ede1"/><rect x="5" y="46" width="16" height="114" rx="7" fill="#f2ede1"/>
      <ellipse cx="-13" cy="164" rx="12" ry="7" fill="#3a2418"/><ellipse cx="13" cy="164" rx="12" ry="7" fill="#3a2418"/></g>
    <g filter="url(#paper)"><path d="M-40,-46 L40,-46 C52,0 62,30 68,56 Q0,70 -68,56 C-62,30 -52,0 -40,-46 Z" fill="#2d4f86"/></g>
    <g filter="url(#paper)"><path d="M-20,-42 L20,-42 L28,52 Q0,58 -28,52 Z" fill="#f4efe2"/></g>
    <g filter="url(#paper)"><path d="M-30,-128 L30,-128 L38,-42 L-38,-42 Z" fill="#2d4f86"/><rect x="-8" y="-150" width="16" height="28" fill="#f6d2b5"/></g>
    ${frontArm('lArm', -30, -126, '#f4efe2', '#f6d2b5', 54, 50, bouquetSVG(-30, -26, 'bqF'))}
    ${frontArm('rArm', 30, -126, '#f4efe2', '#f6d2b5', 54, 50, basketSVG(15.5, 38, 'basketF'))}
    <g filter="url(#paper)"><path d="M-40,-152 Q0,-166 40,-152 L52,-96 Q0,-82 -52,-96 Z" fill="#c8322f"/></g>
  </g>
  <g data-p="headF"><g filter="url(#paper)">
    <ellipse cx="0" cy="-194" rx="62" ry="64" fill="#c8322f"/><circle cx="0" cy="-188" r="42" fill="#f6d2b5"/>
    <path d="M-38,-200 Q0,-246 38,-200 Q20,-212 0,-210 Q-20,-212 -38,-200 Z" fill="#6b3b22"/>
    <path d="M-61,-192 C-61,-264 61,-264 61,-192 C50,-238 -50,-238 -61,-192 Z" fill="#b02c29"/>
    <circle cx="-23" cy="-176" r="8" fill="#ef9a8a" opacity=".8"/><circle cx="23" cy="-176" r="8" fill="#ef9a8a" opacity=".8"/>
    <g class="eyeO"><ellipse cx="-14" cy="-196" rx="4.5" ry="6.2" fill="#22150e"/><ellipse cx="14" cy="-196" rx="4.5" ry="6.2" fill="#22150e"/></g>
    <g class="eyeC"><path d="M-19,-195 Q-14,-191 -9,-195 M9,-195 Q14,-191 19,-195" fill="none" stroke="#22150e" stroke-width="2.4" stroke-linecap="round"/></g>
    <use class="mouth" href="#mX" transform="translate(0,-166)"/></g></g>`;
  bakeAll(g);
  const P = pieces(g);
  return { g, pose(o, f) {
    o = { ...REST_RED, ...o };
    const j = k => jit(f, k), front = o.head === 'F' || Math.abs(o.turn) < .55;
    tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + o.hop + j(2) * .6).toFixed(1)}) scale(${o.s}) rotate(${(j(3) * .5).toFixed(2)})`);
    tf(P.body, `scale(${o.turn.toFixed(3)},1)`); vis(P.body, !front); vis(P.bodyF, front);
    armsF(P, o, j, 30, -126, 54);
    tf(P.basketF, `rotate(${(-(o.rua + o.rfa) + o.swing).toFixed(2)},45.5,-26)`); vis(P.basketF, o.basket);
    bouquetPose(P, 'bqF', o.bouquet, -(o.lua + o.lfa), -30, -26);
    tf(P.legN, `rotate(${(o.near + j(4) * .6).toFixed(2)})`); tf(P.legNk, `rotate(${o.kNear.toFixed(2)},0,86)`);
    tf(P.legF, `rotate(${(o.far + j(5) * .6).toFixed(2)})`); tf(P.legFk, `rotate(${o.kFar.toFixed(2)},0,86)`);
    tf(P.capeB, `rotate(${(o.cape + j(6) * .5).toFixed(2)},-12,-138)`);
    const ua = o.ua + j(7) * .6, fa = o.fa + j(8) * .6;
    tf(P.arm, `rotate(${ua.toFixed(2)},14.5,-128)`); tf(P.fore, `rotate(${fa.toFixed(2)},14.5,-76)`);
    tf(P.basket, `rotate(${(-(ua + fa) + o.swing).toFixed(2)},14.5,-64)`); vis(P.basket, o.basket);
    bouquetPose(P, 'bq', o.bouquet, -(ua + fa) + 10, 14.5, -26);
    vis(P.headP, !front); vis(P.headF, front);
    const hr = `translate(0,${o.nod.toFixed(1)}) rotate(${(o.headR + j(9) * .7).toFixed(2)},0,-146)`;
    tf(P.headP, hr); tf(P.headF, hr);
    face(front ? P.headF : P.headP, o);
  } };
}
// Blinks: closed for two frames at each listed time.
const blinking = (q, times) => times.some(b => q >= b && q < b + 2 / FPS);

// Mother: long green dress and apron, hair in a bun; one arm (the near one) that holds out, points or waves.
// Feet at y 212. Her basket hangs from her hand.
const REST_MOM = { x: 0, y: 0, s: 1, turn: 1, ua: 6, fa: -6, basket: false, finger: false, swing: 0, head: 'P', headR: 0, brow: 0, mouth: 'X', shut: false, hop: 0, rua: 6, rfa: -4, lua: -6, lfa: 4 };
function motherPuppet(parent) {
  const g = mk('g', {}, parent), skin = '#f2c9a6', dress = '#4f7a5a', hair = '#6b3b22', ink = '#22150e';
  g.innerHTML = `<g data-p="body">
    <g filter="url(#paper)"><path d="M20,198 h30 q12,0 12,9 v5 h-42 z M-14,198 h26 q10,0 10,9 v5 h-36 z" fill="#3a2418"/></g>
    <g filter="url(#paper)"><path d="M-44,-14 L44,-14 C56,60 70,140 78,200 Q0,214 -78,200 C-70,140 -56,60 -44,-14 Z" fill="${dress}"/></g>
    <g filter="url(#paper)"><path d="M10,-10 L44,-10 C54,60 62,130 68,190 Q40,198 14,196 Z" fill="#f4efe2"/></g>
    <g filter="url(#paper)"><path d="M-34,-150 L30,-150 L44,-10 L-44,-10 Z" fill="${dress}"/><rect x="-9" y="-178" width="18" height="32" fill="${skin}"/>
      <path d="M-28,-152 Q4,-140 32,-152 L34,-136 Q4,-124 -30,-136 Z" fill="#f4efe2"/></g>
    <g data-p="headP"><g filter="url(#paper)">
      <circle cx="-32" cy="-240" r="22" fill="${hair}"/>
      <circle cx="14" cy="-212" r="42" fill="${skin}"/><circle cx="55" cy="-209" r="7.5" fill="${skin}"/>
      <path d="M-38,-206 C-42,-262 40,-274 58,-226 Q30,-248 4,-238 Q-10,-228 -14,-202 Q-20,-180 -10,-170 L-34,-176 C-42,-188 -40,-198 -38,-206 Z" fill="${hair}"/>
      <circle cx="33" cy="-196" r="8" fill="#ef9a8a" opacity=".7"/>
      <g class="eyeO"><ellipse cx="36" cy="-218" rx="4.5" ry="6" fill="${ink}"/></g>
      <g class="eyeC"><path d="M31,-217 Q36,-213 41,-217" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
      <path data-p="browP" d="M28,-233 L44,-231" stroke="${hair}" stroke-width="3.5" stroke-linecap="round"/>
      <use class="mouth" href="#mX" transform="translate(42,-190) scale(.85)"/></g>${pinAt(0, -174)}</g>
    <g data-p="arm"><g filter="url(#paper)"><rect x="8" y="-148" width="17" height="62" rx="8" fill="#f4efe2"/></g>
      <g data-p="fore"><g filter="url(#paper)"><rect x="10" y="-92" width="13" height="58" rx="6" fill="${skin}"/><circle cx="16.5" cy="-32" r="10" fill="${skin}"/>
        ${fingerSVG(16.5, -32, skin)}</g>
        ${basketSVG(2, 32)}${pinAt(16.5, -88)}</g>${pinAt(16.5, -142)}</g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><ellipse cx="-18" cy="206" rx="13" ry="7" fill="#3a2418"/><ellipse cx="18" cy="206" rx="13" ry="7" fill="#3a2418"/></g>
    <g filter="url(#paper)"><path d="M-46,-14 L46,-14 C58,60 72,140 80,200 Q0,214 -80,200 C-72,140 -58,60 -46,-14 Z" fill="${dress}"/></g>
    <g filter="url(#paper)"><path d="M-26,-10 L26,-10 L36,192 Q0,198 -36,192 Z" fill="#f4efe2"/></g>
    <g filter="url(#paper)"><path d="M-36,-150 L36,-150 L46,-10 L-46,-10 Z" fill="${dress}"/><rect x="-9" y="-178" width="18" height="32" fill="${skin}"/>
      <path d="M-30,-152 Q0,-138 30,-152 L32,-140 Q0,-124 -32,-140 Z" fill="#f4efe2"/></g>
    ${frontArm('lArm', -32, -142, '#f4efe2', skin, 56, 58)}
    ${frontArm('rArm', 32, -142, '#f4efe2', skin, 56, 58, fingerSVG(32, -32, skin).replace('data-p="finger"', 'data-p="fingerF"'))}
  </g>
  <g data-p="headF"><g filter="url(#paper)">
    <circle cx="0" cy="-262" r="20" fill="${hair}"/><circle cx="0" cy="-210" r="44" fill="${skin}"/>
    <path d="M-47,-206 C-50,-272 50,-272 47,-206 Q34,-240 0,-238 Q-34,-240 -47,-206 Z" fill="${hair}"/>
    <circle cx="-25" cy="-194" r="8" fill="#ef9a8a" opacity=".7"/><circle cx="25" cy="-194" r="8" fill="#ef9a8a" opacity=".7"/>
    <g class="eyeO"><ellipse cx="-15" cy="-214" rx="4.5" ry="6" fill="${ink}"/><ellipse cx="15" cy="-214" rx="4.5" ry="6" fill="${ink}"/></g>
    <g class="eyeC"><path d="M-20,-213 Q-15,-209 -10,-213 M10,-213 Q15,-209 20,-213" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
    <path data-p="browL" d="M-23,-229 L-8,-228" stroke="${hair}" stroke-width="3.5" stroke-linecap="round"/>
    <path data-p="browR" d="M8,-228 L23,-229" stroke="${hair}" stroke-width="3.5" stroke-linecap="round"/>
    <use class="mouth" href="#mX" transform="translate(0,-186)"/></g></g>`;
  bakeAll(g);
  const P = pieces(g);
  return { g, pose(o, f) {
    o = { ...REST_MOM, ...o };
    const j = k => jit(f, k), front = o.head === 'F' || Math.abs(o.turn) < .55;
    tf(g, `translate(${(o.x + j(11) * .8).toFixed(1)},${(o.y + o.hop + j(12) * .6).toFixed(1)}) scale(${o.s}) rotate(${(j(13) * .5).toFixed(2)})`);
    tf(P.body, `scale(${o.turn.toFixed(3)},1)`); vis(P.body, !front); vis(P.bodyF, front);
    armsF(P, o, j, 32, -142, 56); vis(P.fingerF, o.finger);
    const ua = o.ua + j(17) * .6, fa = o.fa + j(18) * .6;
    tf(P.arm, `rotate(${ua.toFixed(2)},16.5,-142)`); tf(P.fore, `rotate(${fa.toFixed(2)},16.5,-88)`);
    tf(P.basket, `rotate(${(-(ua + fa) + o.swing).toFixed(2)},16.5,-32)`); vis(P.basket, o.basket); vis(P.finger, o.finger);
    vis(P.headP, !front); vis(P.headF, front);
    const hr = `rotate(${(o.headR + j(19) * .7).toFixed(2)},0,-174)`;
    tf(P.headP, hr); tf(P.headF, hr);
    // brow > 0: worried (inner ends up)
    tf(P.browP, `rotate(${(-12 * o.brow).toFixed(1)},28,-233)`);
    tf(P.browL, `rotate(${(-14 * o.brow).toFixed(1)},-8,-228)`); tf(P.browR, `rotate(${(14 * o.brow).toFixed(1)},8,-228)`);
    face(front ? P.headF : P.headP, o);
  } };
}

/* ---------- baking puppet pieces ----------
   Running the paper filter live on every piece costs too much once a close-up enlarges them, so every filtered
   piece is drawn once to a bitmap (at RES px per unit) and replaced by that image. Parts that change (eyes, mouths,
   brows, pieces with data-p) stay live; a filtered live part is baked on its own. Identical pieces share one bitmap. */
const RES = 4, bakedReady = new Map(), bakedJobs = new Map(), PAPER_EXTRA = [];   // extra defs (patterns) other files add
// Pieces baked ahead of time (the Skill's scripts/bake_puppets.py): img/puppets/<hash>.webp, listed in
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

// A tree trunk passing close in front of the camera, right to left: 'in' ends with the frame covered (a scene
// ends), 'out' starts covered and uncovers it (the next scene begins).
function trunkWipe(p, t0, dur, mode = 'in') {
  const g = mk('g', {}, p);
  g.innerHTML = `<g filter="url(#paper)"><path d="M0,-40 C40,200 -30,600 20,940 L2100,940 L2100,-40 Z" fill="#5a3b24"/>
    ${[160, 420, 700, 980, 1300, 1600].map((x, i) => `<path d="M${x},-40 C${x + 30},${200 + i * 40} ${x - 40},${560 - i * 30} ${x + 10},940" stroke="#46301d" stroke-width="${10 + (i % 3) * 5}" fill="none"/>`).join('')}</g>`;
  bakeAll(g);
  const [a, b] = mode === 'in' ? [1650, -200] : [-200, -2150];
  return q => { const u = Math.min(1, Math.max(0, (q - t0) / dur)); vis(g, mode === 'in' ? u > 0 : u < 1); tf(g, `translate(${(a + (b - a) * ease(u)).toFixed(0)},0)`); };
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
// The title card at the end: a paper label that drops in on its pin.
function endCard(p, t0) {
  const g = prop(p, `<g filter="url(#paper)"><rect x="560" y="330" width="480" height="240" rx="14" fill="#f3e9d2"/><rect x="580" y="350" width="440" height="200" rx="8" fill="none" stroke="#c8322f" stroke-width="5"/></g>
    <text x="800" y="478" text-anchor="middle" font-family="Georgia, serif" font-size="78" font-style="italic" fill="#5a2a1e">The End</text>${pinAt(800, 342)}`);
  return q => { const u = (q - t0) * FPS; vis(g, u >= 0); const d = [-60, -20, 8, -3, 0][Math.min(4, Math.max(0, Math.floor(u / 2)))]; tf(g, `translate(0,${d})`); };
}
