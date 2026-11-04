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
     op        opacity                                     sk    skew in degrees about the anchor (grass, a flower, a
     w         width factor (1.2: a kitten grown plump)          tail in the wind swaying from where it stands)
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
  // every part's shadow is drawn under all the parts, so the shadow of a cut edge (a hip, a shoulder) never shows
  const g = mk('g', {}, parent), inner = mk('g', {}, g), shadows = mk('g', {}, inner), part = {}, piv = {}, shade = {};
  for (const p of C.parts) {
    const box = { x: p.x - C.ax, y: p.y - C.ay, width: p.w, height: p.h };
    if (p.sf) mk('image', { href: `../img/cut/${p.sf}`, ...box }, shade[p.n] = mk('g', {}, shadows));
    const pg = mk('g', {}, inner);
    mk('image', { href: `../img/cut/${p.f}`, ...box }, pg);
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
    tf(g, `translate(${((o.x ?? 0) + jx).toFixed(2)} ${((o.y ?? 0) - (o.bob ?? 0) + jy).toFixed(2)}) rotate(${(o.rot ?? 0).toFixed(2)})${o.sk ? ` skewX(${(o.sk * fl).toFixed(2)})` : ''} scale(${(s * fl * (o.w ?? 1)).toFixed(4)} ${(s * sq).toFixed(4)})`);
    for (const n in part) {
      const a = o.parts?.[n] ?? 0, m = o.move?.[n], [px, py] = piv[n], hid = o.hide && o.hide.includes(n);
      const t = (a ? `rotate(${a.toFixed(2)} ${px} ${py})` : '') + (m ? ` translate(${m[0].toFixed(2)} ${m[1].toFixed(2)})` : '');
      tf(part[n], t); vis(part[n], !hid);
      if (shade[n]) { tf(shade[n], t); vis(shade[n], !hid); }
    }
    if (mouth) {
      const k = MOUTH_OPEN[o.mouth || 'X'] ?? .3;
      vis(mouth, k > 0); if (k > 0) mouth.setAttribute('ry', ((F.h || 6) * C.sc * k / 2).toFixed(2));
    }
    if (o.op !== undefined) g.setAttribute('opacity', o.op); else g.removeAttribute('opacity');
  };
  return { g, part, shade, C, pose, pivot: n => piv[n] };
}

// Where a lifted piece's anchor stood on its own page, in the world px of a set lifted from that page (or spread).
function pagePos(setName, name) {
  const C = CUT[name], S = SETS[setName]?.[0]?.page;
  if (!C || !S) throw new Error(`pagePos: no piece '${name}' or no page data in set '${setName}'`);
  // a piece lifted from a spread (page: ['p30', 'p31']) counts from the spread's left page, as the set does
  const first = Array.isArray(C.page) ? C.page[0] : C.page;
  let off = 0;
  for (const [pg, w] of S.pages) { if (pg === first) break; off += w; }
  if (!S.pages.some(([pg]) => pg === first)) console.warn(`pagePos: '${name}' is from ${C.page}, not a page of set '${setName}'`);
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
// for two frames (`big`, 1.1: at 1.25 two words said close together met and read "Catshere"), then still. hideAt:
// words go again.
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
    show(q, times = {}, f = 0, { hideAt = Infinity, big = 1.1 } = {}) {
      for (const it of items) {
        const t = times[it.n] ?? -1, on = q >= t && q < hideAt, u = q - t;
        vis(it.p.g, on);
        if (on) it.p.pose({ x: it.x, y: it.y, s: s * (u < 2 / FPS ? big : u < 4 / FPS ? 1 + (big - 1) / 3 : 1) }, f);
      }
    } };
}

/* ---------- life for lifted animals and things ----------
   A lifted cat is one drawing; split it into parts with lift.py's "frac" boxes (legF, legH, and where the drawing
   allows legF2, legH2, tail, head: see its docstring) and catLife moves them. catLife(q, ph, { d, L, A, tail, head })
   returns { parts, bob, rot } to spread into pose: the tail swishes, the head twitches now and then (an ear flick, a
   look round), out of step with the other cats by ph. Walking: give d, the distance walked in the piece's own px
   (world px / s), and the legs swing by it, front and hind pairs opposite (legF2 / legH2, when split, opposite their
   pair), with a small bob each step, so the feet keep pace with the ground; L is a stride (piece px: about 70–80 for a crowd cat walking 40–60 world px/s; shorter strides flicker at 12 fps), A the swing in
   degrees. A part the piece does not have is ignored. On twos, as everything else. */
function catLife(q, ph = 0, { d = null, L = 30, A = 16, tail = 12, head = 7 } = {}) {
  const t = Math.floor((q + ph * 1.7) * FPS / 2) * 2 / FPS, w = (t + ph * 3.1) % 3.7;
  const parts = { tail: tail * Math.sin(t * 2.4 + ph), head: (w < .5 ? Math.sin(w / .5 * Math.PI) * head : 0) + Math.sin(t * .9 + ph) * head * .25 };
  let bob = 0, rot = 0;
  if (d !== null) {
    const u = d / L * Math.PI * 2;
    parts.legF = A * Math.sin(u); parts.legH = -A * Math.sin(u); parts.legF2 = -parts.legF; parts.legH2 = -parts.legH;
    bob = Math.abs(Math.sin(u)) * 2.5; rot = Math.sin(u) * 1.2;
    parts.tail += A * .4 * Math.sin(u * .5);
  }
  return { parts, bob, rot };
}

// Smoke in the book's ink, as Gág draws a pipe's: a cream ribbon with an ink edge and hatch strokes across it,
// curling up from (x, y), widening as it climbs, its top breaking into puffs. The curls travel up the ribbon, so it
// rises all the time. Returns q => … to call each frame. opts: size (px wide at the pipe), rise (px tall), drift (px it
// leans: + right), curl (px of the side-to-side wave), waves (curls along it), period (s for a curl to climb one wave),
// ink (stroke px), seed. Steam over a bath or a bowl: smaller, slower, less rise. A drawn smoke part lifted with the
// figure can be hidden, or kept as the stem with this above it.
function inkSmoke(parent, x, y, { size = 12, rise = 230, drift = 50, curl = 22, waves = 1.6, period = 1.8, ink = 2.2, seed = 1 } = {}) {
  const g = mk('g', {}, parent);
  const band = mk('path', { fill: '#efe8d6', stroke: CUT_INK, 'stroke-width': ink, 'stroke-linejoin': 'round' }, g);
  const hatch = mk('path', { fill: 'none', stroke: CUT_INK, 'stroke-width': ink * .8, 'stroke-linecap': 'round' }, g);
  const puffs = [0, 1, 2].map(() => mk('ellipse', { fill: '#efe8d6', stroke: CUT_INK, 'stroke-width': ink }, g));
  g.insertBefore(puffs[0], hatch);   // the cap over the band's top end, under its hatching
  const N = 26, ph0 = seed * 1.7;
  return q => {
    const t = Math.floor(q * FPS / 2) * 2 / FPS, ph = t / period * Math.PI * 2 + ph0;
    const c = v => [x + drift * v + curl * (.25 + v) * Math.sin(v * waves * Math.PI * 2 - ph), y - rise * v];
    const wd = v => size * (.4 + 3 * v) * (1 + .15 * Math.sin(v * 9 - ph * 1.3));
    const L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const v = i / N * .86, [ax, ay] = c(v), [bx, by] = c(v + .01), nx = -(by - ay), ny = bx - ax, k = Math.hypot(nx, ny) || 1, w = wd(v) / 2;
      L.push([ax + nx / k * w, ay + ny / k * w]); R.push([ax - nx / k * w, ay - ny / k * w]);
    }
    const P = a => a.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' L');
    band.setAttribute('d', `M${P(L)} L${P(R.reverse())} Z`); R.reverse();
    let h = '';   // hatch strokes across the band, riding up with the curls
    for (let j = 0; j < 9; j++) {
      const v = ((j / 9 + t / period / 6) % 1) * .84, i = Math.round(v / .86 * N), a = L[i], b = R[i];
      if (!a || i < 2) continue;
      const m = .12 + .1 * ((j * 7 + seed) % 3);
      h += `M${(a[0] + (b[0] - a[0]) * m).toFixed(1)},${(a[1] + (b[1] - a[1]) * m).toFixed(1)} Q${((a[0] + b[0]) / 2).toFixed(1)},${((a[1] + b[1]) / 2 - 4).toFixed(1)} ${(a[0] + (b[0] - a[0]) * (.9 - m * .5)).toFixed(1)},${(a[1] + (b[1] - a[1]) * (.9 - m * .5)).toFixed(1)} `;
    }
    hatch.setAttribute('d', h);
    puffs.forEach((e, k) => {   // the top breaks off: a puff or two rising on, shrinking away
      const u = k === 0 ? 0 : ((t / period / 1.5 + k / 2) % 1), v = .86 + u * .35, [px, py] = c(v), r = wd(.86) * (k === 0 ? .55 : .5 * (1 - u * .85));
      e.setAttribute('cx', px.toFixed(1)); e.setAttribute('cy', (py - u * 20).toFixed(1));
      e.setAttribute('rx', Math.max(.1, r).toFixed(1)); e.setAttribute('ry', Math.max(.1, r * .75).toFixed(1));
    });
  };
}
