/* cut.js — paper puppets cut from the book's own drawings (SKILL/scripts/lift.py writes img/cut/*.webp and
   img/cut/cut.js, window.CUT). Load it after paper.js and img/cut/cut.js.

   cutPuppet(parent, name) builds one lifted figure: its parts (as lift.py split it) each on a pin at its pivot, the
   whole placed by its anchor (the feet). pose(o, f) once per frame:
     x, y      where the anchor goes (parent's px)        s     scale (1 = the size it had on its page's set)
     flip      true mirrors it (faces the other way)       rot   degrees about the anchor (a lean, a rock)
     bob       px up (a step's lift, a breath)             sq    vertical squash about the anchor (1 + a breath)
     parts     { part: degrees }  each part turned about its pivot (+ clockwise on screen before any flip)
     move      { part: [dx, dy] } each part slid (page-scale px)
     hide      [part …]           parts not drawn          mouth  a mouth shape ('X' rest … 'D' wide, mouths.py)
     op        opacity
   A hand-jitter of a third of a pixel per frame comes from `f` (pass the frame number), as the paper kit's puppets do.
   pagePos(set, name) gives { x, y } where the piece's anchor stood on its own page, in that set's world px (sets
   lifted from the same page), so a figure lifted off a set goes back exactly where Gág drew it. */
'use strict';
const CUT_INK = '#1e1a16';
// A mouth over a lifted face, for close-ups: where it is (page px) and how wide, per piece. Gág's mouths are tiny
// lines; when the voice opens the mouth an ink oval opens over the drawn one.
window.CUT_FACE = window.CUT_FACE || {};
const MOUTH_OPEN = { X: 0, A: .15, B: .35, C: .6, D: 1, E: .8, F: .45, G: .3, H: .55, chew: .3 };

function cutPuppet(parent, name) {
  const C = CUT[name];
  if (!C) throw new Error(`cutPuppet: no piece '${name}' in img/cut/cut.js`);
  const g = mk('g', {}, parent), inner = mk('g', {}, g), part = {}, piv = {};
  for (const p of C.parts) {
    const pg = mk('g', {}, inner);
    mk('image', { href: `../img/cut/${p.f}`, x: p.x - C.ax, y: p.y - C.ay, width: p.w, height: p.h }, pg);
    part[p.n] = pg; piv[p.n] = [p.px - C.ax, p.py - C.ay];
  }
  let mouth = null;
  const F = CUT_FACE[name];
  if (F) {
    const host = part[F.part || 'head'] || part.body || inner;
    const [mx, my] = [(F.at[0] - C.pa[0]) * C.sc, (F.at[1] - C.pa[1]) * C.sc];
    mouth = mk('ellipse', { cx: mx, cy: my, rx: (F.w || 8) * C.sc / 2, ry: 0, fill: CUT_INK, visibility: 'hidden' }, host);
  }
  const pose = (o = {}, f = 0) => {
    const s = o.s ?? 1, fl = o.flip ? -1 : 1, sq = o.sq ?? 1;
    const jx = jit(f, 11) * .33, jy = jit(f, 12) * .33;
    tf(g, `translate(${((o.x ?? 0) + jx).toFixed(2)} ${((o.y ?? 0) - (o.bob ?? 0) + jy).toFixed(2)}) rotate(${(o.rot ?? 0).toFixed(2)}) scale(${(s * fl).toFixed(4)} ${(s * sq).toFixed(4)})`);
    for (const n in part) {
      const k = n === 'shadow' ? 'body' : n, a = o.parts?.[k] ?? 0, m = o.move?.[k], [px, py] = piv[k] || piv[n];   // the figure's one shadow moves with its body
      tf(part[n], (a ? `rotate(${a.toFixed(2)} ${px} ${py})` : '') + (m ? ` translate(${m[0].toFixed(2)} ${m[1].toFixed(2)})` : ''));
      vis(part[n], !(o.hide && o.hide.includes(k)));
    }
    if (mouth) {
      const k = MOUTH_OPEN[o.mouth || 'X'] ?? .3;
      vis(mouth, k > 0); if (k > 0) mouth.setAttribute('ry', ((F.h || 6) * C.sc * k / 2).toFixed(2));
    }
    if (o.op !== undefined) g.setAttribute('opacity', o.op); else g.removeAttribute('opacity');
  };
  return { g, part, C, pose, pivot: n => piv[n] };
}

// Where a lifted piece's anchor stood on its own page, in the world px of a set lifted from that page (or spread).
function pagePos(setName, name) {
  const C = CUT[name], S = SETS[setName]?.[0]?.page;
  if (!C || !S) throw new Error(`pagePos: no piece '${name}' or no page data in set '${setName}'`);
  let off = 0;
  for (const [pg, w] of S.pages) { if (pg === C.page) break; off += w; }
  if (!S.pages.some(([pg]) => pg === C.page)) console.warn(`pagePos: '${name}' is from ${C.page}, not a page of set '${setName}'`);
  return { x: S.wx + (C.pa[0] + off - S.x0) * S.s, y: S.wy + (C.pa[1] - S.y0) * S.s, s: S.s / C.sc };
}

// A two-legged lifted figure's walk: legs swing on pins at the hips as paper.js's compass walk does, so the planted
// foot stays put while the body rides over it. L is the leg's length (hip pin to sole, page-scale px), A the swing
// in degrees. Returns { legL, legR, d, bob }: spread legL/legR into pose's `parts`, move the figure by d·s (forward
// for the way it faces), bob it by `bob`. tau is seconds into the walk; on twos like everything else.
function cutWalk(tau, { L = 60, A = 16, period = 1 } = {}) {
  const w = walk(Math.floor(Math.max(0, tau) * FPS / 2) * 2 / FPS, { L, A, period, knee: 0 });
  return { legL: w.near, legR: w.far, d: w.d, bob: -w.drop };
}

// A cat (or any small lifted figure) trotting: a hop on twos and a small rock, out of step with its neighbours by `ph`.
function trot(q, ph = 0, rate = 3) {
  const u = Math.floor((q + ph) * FPS / 2) * 2 / FPS * rate * Math.PI * 2;
  return { bob: Math.abs(Math.sin(u)) * 4, rot: Math.sin(u) * 3 };
}

// The refrain in Gág's own hand lettering (pieces rf-… lifted from page 9, word by word, kept where she lettered them):
// lettering(parent, words, opts) lays the words out as on the page around (x, y) at scale s; show(q, times) pops each
// word in when its time comes (times: { 'rf-hundreds': t, … }, missing = always shown) with a stamp: a little large
// for two frames, then still. hideAt: words go again.
function lettering(parent, words, { x = 800, y = 450, s = 1 } = {}) {
  const g = mk('g', {}, parent), items = [];
  const box = words.reduce((b, n) => { const C = CUT[n]; if (!C) throw new Error(`lettering: no piece '${n}'`);
    return [Math.min(b[0], C.pa[0]), Math.min(b[1], C.pa[1]), Math.max(b[2], C.pa[0]), Math.max(b[3], C.pa[1])]; }, [1e9, 1e9, -1e9, -1e9]);
  const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
  for (const n of words) {
    const p = cutPuppet(g, n), C = CUT[n];
    items.push({ n, p, x: x + (C.pa[0] - cx) * C.sc * s, y: y + (C.pa[1] - cy) * C.sc * s });
  }
  return { g, items,
    show(q, times = {}, f = 0, { hideAt = Infinity, big = 1.25 } = {}) {
      for (const it of items) {
        const t = times[it.n] ?? -1, on = q >= t && q < hideAt, u = q - t;
        vis(it.p.g, on);
        if (on) it.p.pose({ x: it.x, y: it.y, s: s * (u < 2 / FPS ? big : u < 4 / FPS ? 1 + (big - 1) / 3 : 1) }, f);
      }
    } };
}
