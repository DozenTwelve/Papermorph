/* shared.js — what every scene of Millions of Cats uses: timing helpers, the page turn between Gág's pages, a cat
   crowd, a thought cloud. The sets are her pages (img/sets/, from lift.py); the actors her drawings (lib/cut.js). */
'use strict';
// Beat-clock time of `t` seconds into clip `clip` of a joined scene whose speech starts `pre` s in (join.py's `parts`).
const clipAt = (scene, pre, clip, t = 0) => pre + TIMINGS[scene].parts[clip] + t;
// Beat-clock time of a [[mark]] in a joined scene ('clip.mark', join.py's marks).
const markAt = (scene, pre, mark) => { const v = TIMINGS[scene].marks[mark]; if (v === undefined) throw new Error(`markAt: no mark '${mark}' in ${scene} (${Object.keys(TIMINGS[scene].marks).join(', ')})`); return pre + v; };
// Beat-clock time of the n-th caption cue (one per sentence) of a joined scene: for cutting on sentences.
const cueAt = (scene, pre, n) => pre + TIMINGS[scene].cues[n][0];
const onTwos = q => Math.floor(q * FPS / 2) % 2 ? 1 : -1;
const between = (q, a, b) => q >= a && q < b;
const tween = (q, t0, d, a, b) => a + (b - a) * span(q, t0, t0 + d);
// Who is speaking: the mouth for this frame from the listed clips of a joined scene, or 'X' (rest).
const lips = (q, scene, pre, ...clips) => { for (const c of clips) { const m = mouthAt(c, q - clipAt(scene, pre, c)); if (m !== 'X') return m; } return 'X'; };
// Seeded random in [0, 1) from an integer: the same crowd every time.
const rnd = k => (jit(k, 7) + 1) / 2;

/* ---------- the page turn ----------
   Between places, Gág's next page comes over this one like a turned leaf: a cream sheet with a soft shadow at its
   edge sweeps from right to left. 'in' ends with the frame covered (the scene ends on it), 'out' starts covered and
   uncovers the new page (the next scene begins with it). Put it last in the scene's panel, so it is drawn on top. */
function pageTurn(p, t0, dur = .45, mode = 'in') {
  dur = Math.min(dur, .45);   // round 1: the turns showed up to 1.5 s of blank sheet; a leaf turns quickly
  const g = mk('g', {}, p);
  g.innerHTML = `<defs><linearGradient id="turnEdge${mode}" x1="0" x2="1"><stop offset="0" stop-color="#2a1608" stop-opacity="0"/><stop offset="1" stop-color="#2a1608" stop-opacity=".28"/></linearGradient>
    <linearGradient id="turnFace${mode}" x1="0" x2="1"><stop offset="0" stop-color="#e6dcc4"/><stop offset=".12" stop-color="#efe8d6"/><stop offset="1" stop-color="#efe8d6"/></linearGradient></defs>
    <rect x="-90" y="-60" width="90" height="1020" fill="url(#turnEdge${mode})"/><rect x="0" y="-60" width="2000" height="1020" fill="url(#turnFace${mode})"/>`;
  const [a, b] = mode === 'in' ? [1700, -60] : [-60, -2200];
  return q => { const u = Math.min(1, Math.max(0, (q - t0) / dur)); vis(g, mode === 'in' ? u > 0 : u < 1);
    tf(g, `translate(${(a + (b - a) * (1 - (1 - u) ** 2)).toFixed(0)},0)`); };
}

/* ---------- a crowd of cats ----------
   catCrowd(parent, { names, n, box: [x0, y0, x1, y1], seed, s: [near, far], flip }) scatters n lifted cats in the
   box (feet in it), smaller towards the top (far) and drawn back to front, each a different one of `names`, half of
   them mirrored. pose(q, f, { from, every, hop, walk, seethe }) shows cat i from from + i·every s (a pop in: a little
   hop), and then lets each cat live (catLife in cut.js: tail, head, and legs when split): a hop now and then at its own
   moment, a small rock. `every` can be a function i → time. walk: { v, t0, t1 } moves every cat v world px/s from t0 to t1
   (+ right), each turned to face the way it goes (by its piece's `faces` in cut.js: -1 drawn looking left), legs keeping pace;
   seethe 0 … 1: a quarrel, every cat hopping, lunging and spinning on its spot, faster and higher as it grows.
   Returns { cats: [{ p, x, y, s, flip }], pose }. */
function catCrowd(parent, { names, n = 20, box = [0, 600, 1600, 900], seed = 1, s = [1, .55], flip = true } = {}) {
  const g = mk('g', {}, parent), cats = [];
  for (let i = 0; i < n; i++) {
    const y = box[1] + (box[3] - box[1]) * rnd(seed * 977 + i * 31), u = (y - box[1]) / Math.max(1, box[3] - box[1]);
    cats.push({ i, name: names[Math.floor(rnd(seed * 131 + i * 17) * names.length)], x: box[0] + (box[2] - box[0]) * rnd(seed * 613 + i * 7),
                y, s: s[1] + (s[0] - s[1]) * u, flip: flip && rnd(seed * 53 + i * 11) > .5, ph: rnd(seed * 29 + i * 13) * 7 });
  }
  cats.sort((a, b) => a.y - b.y);
  for (const c of cats) c.p = cutPuppet(g, c.name);
  return { g, cats,
    pose(q, f, { from = 0, every = 0, hop = true, walk = null, seethe = 0 } = {}) {
      for (const c of cats) {
        const t = from + (typeof every === 'function' ? every(c.i) : c.i * every), u = q - t;
        vis(c.p.g, u >= 0); if (u < 0) continue;
        const pop = u < .34 ? Math.sin(u / .34 * Math.PI) * 18 : 0;                        // pops in with a hop
        const w = hop ? (q + c.ph) % 4.2 : 9, live = w < .34 ? Math.sin(w / .34 * Math.PI) * 7 : 0;   // a hop now and then
        const t0w = walk?.t0 ?? 0, moving = walk && q >= t0w && q < (walk.t1 ?? Infinity);
        const run = walk ? (Math.min(q, walk.t1 ?? Infinity) - t0w) * walk.v * (q > t0w) : 0;   // world px walked (stops at t1)
        const L = catLife(q, c.ph, { d: moving ? Math.abs(run) / c.s : null, tail: 12 + 20 * seethe, head: 7 + 12 * seethe });
        let x = c.x + run, bob = pop + live + L.bob, rot = Math.sin((q + c.ph) * 1.7) * 1.2 + L.rot;
        if (seethe) {   // a quarrel: on twos, each cat lunges, hops and twists at its own beat
          const k = Math.floor((q + c.ph) * FPS / 2), r = jit(k, c.i + 40), r2 = jit(k, c.i + 80);
          x += r * 14 * seethe; bob += Math.abs(r2) * 22 * seethe; rot += r2 * 16 * seethe;
        }
        const fl = walk && walk.v ? (CUT[c.name].faces ?? 1) * Math.sign(walk.v) < 0 : c.flip;
        c.p.pose({ x, y: c.y, s: c.s, flip: fl !== (seethe > 0 && jit(Math.floor((q + c.ph) * 2), c.i) > .6), bob, rot, parts: L.parts }, f + c.i);
      }
    } };
}

/* ---------- a thought ----------
   A little cloud of cream paper with an ink rim (Gág's clouds are like this) rising from (x, y) to a bubble at (bx, by),
   holding whatever the scene puts in its `inside` group. pose(q, t0, t1): grows in over 0.4 s from t0, gone at t1. */
function thought(parent, x, y, bx, by, r = 120) {
  const g = mk('g', {}, parent), bub = mk('g', {}, g), inside = mk('g', {}, bub);
  const lump = Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2; return `<circle cx="${(Math.cos(a) * r * .78).toFixed(1)}" cy="${(Math.sin(a) * r * .55).toFixed(1)}" r="${(r * .42).toFixed(1)}"/>`; }).join('');
  bub.insertAdjacentHTML('afterbegin', `<g filter="url(#paper)"><g fill="#1e1a16">${lump}</g></g><g fill="#efe8d6" transform="scale(.95)">${lump}<ellipse rx="${r * .8}" ry="${r * .58}"/></g>`);
  const dots = [.25, .5, .75].map((k, i) => mk('circle', { cx: x + (bx - x) * k, cy: y + (by - y) * k, r: 8 + i * 6, fill: '#efe8d6', stroke: '#1e1a16', 'stroke-width': 3 }, g));
  bakeAll(bub);
  return { g, inside, pose(q, t0, t1 = Infinity) {
    const on = q >= t0 && q < t1; vis(g, on); if (!on) return;
    const u = span(q, t0, t0 + .4); dots.forEach((d, i) => vis(d, u > i / 4));
    tf(bub, `translate(${bx} ${by + Math.sin(q * 2) * 3}) scale(${Math.max(.01, Math.floor(u * 4) / 4)})`);
  } };
}
