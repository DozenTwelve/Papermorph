/* scene6.js — Ask Mama (the stable). Little Horse walks home slowly, head low, the sack still on his back; Mother comes
   out to meet him. "Why, you're back already?" — his embarrassed "I couldn't get across" — her "Isn't it very
   shallow?" — his eager "Uncle Ox said so too" (a torn-paper memory over his head: the ox chewing in the water), then
   "But Squirrel said it's very deep" (a second one: Squirrel shouting, a tear on "drowned") — her gentle question,
   pushed in on "Did you think about what they said?" — his small "No... I didn't." She nuzzles him: "Use your own
   head": a paper thought bubble opens over him with the river cut side-on, one waterline across all three: on the
   shallow shelf the ox (water on his shins), the foal at his knees with a "?", Squirrel in the deep part under the
   water. The camera walks along the waterline from the ox to the foal to Squirrel; on "Go" the "?" turns "!" and his
   eyes light; the bubble pops, he nods; on the cut he has turned for the road and trots off right. Mother watches
   him go. Times are the beat clock (storyboard, scene 6). */
'use strict';
const PRE6 = 3.6;
const s6_c = c => PRE6 + c;   // clip time (narration.en.words.txt) -> beat clock

/* ---------- timeline (beat clock) ---------- */
const S6 = {
  stop: 3.9,                   // he stops in front of her
  yes: s6_c(9.77), uncle: s6_c(10.69), but: s6_c(12.55), squirrel: s6_c(12.75), drown: s6_c(15.51), it: s6_c(16.21),
  deep: s6_c(18.54), shallow: s6_c(19.2), think: s6_c(20.34),
  hole: s6_c(22.39), no: s6_c(23.19), didnt: s6_c(24.23),
  child: s6_c(25.38), use: s6_c(29.48), tryIt: s6_c(30.44), self: s6_c(31.32),
  go: s6_c(32.6), see: s6_c(32.84), know: s6_c(33.68),
  bubOn: s6_c(29.48) + .22,    // the puffs rise on "Use", the bubble is open on "head"
  bubOff: s6_c(32.84) + .3,    // after "Go and see": the bubble pops
  turn: s6_c(34.26) + .78,     // the cut to the wide: he has turned for the road
  run: s6_c(34.26) + .9,       // and trots off right
};
S6.vig1 = S6.uncle - .05; S6.vig2 = S6.squirrel - .05; S6.vigOff = S6.it + .55;

/* ---------- sounds ---------- */
sfx('scene6', 0, 'birds', .5);
// hooves: one soft knock every half stride of the walk (d in the puppet's own units, a stride is 74)
function s6_steps(keys, s, t0, t1, vol) {
  let last = null;
  for (let f = Math.round(t0 * FPS); f <= t1 * FPS; f++) {
    const q = f / FPS, r = route(q, keys, s), n = Math.floor(Math.abs(r.x - keys[0][1]) / s / 37);
    if (last !== null && n > last) sfx('scene6', +q.toFixed(3), 'hoof', vol);
    last = n;
  }
}
const S6_LHK = [[-2, 1800], [S6.stop, 1080]];
const S6_MAK = [[1.3, 560], [3.5, 690], [s6_c(25.5), 690], [s6_c(26.4), 765], [S6.bubOn + .1, 765], [S6.bubOn + .9, 715]];
s6_steps(S6_LHK, 1.05, 0, S6.stop, .28);
s6_steps(S6_MAK, 1.3, 1.3, S6.bubOn + 1, .2);
sfx('scene6', S6.bubOn + .5, 'hoof', .2);   // her half step back (s6_steps counts only forward steps)
sfx('scene6', S6.vig1, 'pop', .45);
sfx('scene6', S6.vig2, 'pop', .45);
sfx('scene6', S6.vigOff, 'pop', .35);
sfx('scene6', S6.bubOn, 'pop', .7);
sfx('scene6', S6.go, 'chime', .35);
sfx('scene6', S6.bubOff, 'pop', .7);
sfx('scene6', S6.run, 'trot', .5);

/* ---------- little helpers ---------- */
// eased keys [[t, v], …]: holds the first and last values, eases between neighbours
function s6_k(q, ks) {
  if (q <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (q < ks[i][0]) return ks[i - 1][1] + (ks[i][1] - ks[i - 1][1]) * span(q, ks[i - 1][0], ks[i][0]);
  return ks[ks.length - 1][1];
}
const s6_bump = (q, t, dur, amp) => q > t && q < t + dur ? amp * Math.sin(Math.PI * (q - t) / dur) : 0;
// a paper piece popping open at t0 (a few frames of overshoot) and shut at t1 (one big frame, then gone)
const s6_pop = (q, t0, t1) => q < t0 || q >= t1 + 1 / FPS ? 0 : q >= t1 ? 1.1 : [.4, 1.12, .95, 1][Math.min(3, Math.floor((q - t0) * FPS + 1e-6))];

/* ---------- the memories: torn-paper vignettes over his head while he tells it ---------- */
// A torn sheet w × h around (0, 0): its edges wander a little, the same every time.
function s6_torn(w, h, seed) {
  const pts = [], n = 9;
  const side = (x0, y0, x1, y1, k) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + 4 * jit(seed, k + i), y0 + (y1 - y0) * u + 4 * jit(seed, k + 40 + i)]); } };
  side(-w / 2, -h / 2, w / 2, -h / 2, 0); side(w / 2, -h / 2, w / 2, h / 2, 100); side(w / 2, h / 2, -w / 2, h / 2, 200); side(-w / 2, h / 2, -w / 2, -h / 2, 300);
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L') + ' Z';
}
function s6_vignette(stage, x, y, w, h, seed, bg) {
  const outer = mk('g', {}, stage), g = mk('g', {}, outer), id = 's6v' + seed;
  g.innerHTML = `<clipPath id="${id}"><path d="${s6_torn(w - 14, h - 14, seed + 1)}"/></clipPath>
    <g filter="url(#paper)"><path d="${s6_torn(w, h, seed)}" fill="#fbf6ea"/></g>
    <g clip-path="url(#${id})"><g filter="url(#paper)">${bg}</g><g class="in"></g><g class="front"></g></g>`;
  bakeAll(g);
  return { outer, inner: g.querySelector('.in'), front: g.querySelector('.front'),
    place(q, f, t0, t1) { const sc = s6_pop(q, t0, t1); vis(outer, sc > 0); tf(outer, `translate(${x},${y}) rotate(${(-3 + seed % 7).toFixed(1)}) scale(${sc || .01})`); return sc > 0; } };
}

/* ---------- the thought bubble: the river cut side-on, in Little Horse's head ----------
   Inside it the puppets are at S6_K of their size and the river is drawn in their units around the waterline (y 0):
   a sloping bed, so the ox stands on a shallow shelf (water 50 units up his legs: his shins, well under his knee pins at
   106), the foal on the middle at 67 (his knee pins), Squirrel in the deep part at 130 (over his head: at s .7, a little over his
   true .6 so he reads in the bubble, he is 91 tall). */
const S6_BX = 1150, S6_BY = 230, S6_K = .48, S6_MX = -14, S6_MY = 41;   // bubble centre; where the river's (0, 0) sits in it
const S6_W = (x, y) => [S6_BX + S6_MX + S6_K * x, S6_BY + S6_MY + S6_K * y];   // the river's units -> world
const S6_OX = -380, S6_FOAL = 170, S6_SQ = 430;
function s6_bubble(stage) {
  const rx = 330, ry = 168, n = 22;
  const ring = (dr, fill) => Array.from({ length: n }, (_, i) => {
    const a = i * 2 * Math.PI / n, r = 36 + 8 * (i % 3 === 0);
    return `<circle cx="${(rx * Math.cos(a)).toFixed(1)}" cy="${(ry * Math.sin(a)).toFixed(1)}" r="${r + dr}" fill="${fill}"/>`;
  }).join('') + `<ellipse rx="${rx + dr}" ry="${ry + dr}" fill="${fill}"/>`;
  const wave = Array.from({ length: 20 }, (_, i) => `Q${-1000 + i * 100 + 25},-7 ${-1000 + i * 100 + 50},0 T${-1000 + i * 100 + 100},0`).join(' ');
  const outer = mk('g', {}, stage), g = mk('g', {}, outer), M = `translate(${S6_MX},${S6_MY}) scale(${S6_K})`;
  g.innerHTML = `<clipPath id="s6clip"><ellipse rx="320" ry="160"/></clipPath>
    <g filter="url(#paper)">${ring(4, '#8a6a46')}${ring(0, '#fbf6ea')}</g>
    <g clip-path="url(#s6clip)">
      <g filter="url(#paper)"><rect x="-340" y="-180" width="680" height="360" fill="#dcecef"/>
        <path d="M-340,10 C-200,-20 -120,0 -40,-12 C60,-26 160,-4 340,-22 L340,180 L-340,180 Z" fill="#b8cfa4"/>
        <g transform="${M}"><rect x="-800" y="0" width="1600" height="400" fill="#b9dcea"/></g></g>
      <g class="s6mini" transform="${M}"></g>
      <g transform="${M}">
        <g class="s6wave"><g filter="url(#paper)"><path d="M-1000,0 ${wave} L1000,400 L-1000,400 Z" fill="#5f9fc0" opacity=".3"/></g></g>
        <g filter="url(#paper)"><path d="M-800,50 L-230,50 C-150,50 -140,67 -60,67 L300,67 C350,67 340,130 390,130 L510,130 C565,130 575,-24 640,-24 L800,-24 L800,400 L-800,400 Z" fill="#c9ad74"/>
          <path d="M-800,70 L-240,70 M-50,86 L290,86 M400,148 L500,148" stroke="#b0925a" stroke-width="6" fill="none"/>
          <path d="M600,-24 L800,-24 L800,-40 C720,-46 650,-40 600,-24 Z" fill="#8fb36e"/></g>
        <g class="s6line"><path d="M-1000,0 ${wave}" stroke="#ffffff" stroke-width="7" fill="none"/></g>
        <g class="s6air"></g>
      </g>
    </g>
    <g class="s6q"></g><g class="s6x"></g>`;
  const mini = g.querySelector('.s6mini');
  const ox = oxPuppet(mini), lh = horsePuppet(mini), sq = squirrelPuppet(mini);
  const wv = g.querySelector('.s6wave'), ln = g.querySelector('.s6line');
  const air = g.querySelector('.s6air'), bubs = Array.from({ length: 3 }, () => mk('circle', { r: 6, fill: '#f4fbff', 'fill-opacity': .4, stroke: '#ffffff', 'stroke-width': 3.5 }, air));
  const mark = (sel, ch) => { const e = g.querySelector(sel); e.innerHTML = `<g filter="url(#paper)"><text x="0" y="0" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="80" fill="#c8322f" stroke="#7a1e1c" stroke-width="2">${ch}</text></g>`; return e; };
  const qm = mark('.s6q', '?'), xm = mark('.s6x', '!');
  bakeAll(g);
  // the trail of three small puffs from his head up to the bubble
  const trail = [[1014, 462, 6], [1025, 445, 9], [1038, 425, 12]].map(([x, y, r]) =>
    prop(stage, `<g filter="url(#paper)"><circle cx="${x}" cy="${y}" r="${r + 3}" fill="#8a6a46"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fbf6ea"/></g>`));
  // paper bits when it pops
  const bits = Array.from({ length: 8 }, (_, i) => ({ a: i * Math.PI / 4 + .3, g: prop(stage, `<g filter="url(#paper)"><path d="M-9,-6 L8,-8 L10,5 L-7,8 Z" fill="${i % 2 ? '#fbf6ea' : '#e9dcc0'}"/></g>`) }));
  return (q, f) => {
    trail.forEach((t, i) => vis(t, q >= S6.bubOn - .25 + i * .08 && q < S6.bubOff));
    const sc = s6_pop(q, S6.bubOn, S6.bubOff);
    vis(outer, sc > 0);
    tf(outer, `translate(${S6_BX + jit(f, 61) * .4},${S6_BY + jit(f, 62) * .4}) scale(${sc || .01})`);
    const u = (q - S6.bubOff) / .45;
    bits.forEach(({ a, g: b }, i) => {
      vis(b, u >= 0 && u < 1);
      if (u < 0 || u >= 1) return;
      const r = 120 + 200 * ease(u), x = S6_BX + r * 1.5 * Math.cos(a), y = S6_BY + r * .8 * Math.sin(a) + 120 * u * u;
      tf(b, `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(i * 47 + 300 * u).toFixed(0)})`); b.setAttribute('opacity', (1 - u).toFixed(2));
    });
    if (!sc) return;
    const t = q - S6.bubOn, got = q >= S6.go;
    ox.pose({ x: S6_OX, y: 50, s: 1.4, turn: 1, chew: t * 1.4, grass: true, lid: .35, look: .4, shut: blinking(q, [S6.bubOn + 1.1, S6.bubOn + 2.6]), tail: 6 * Math.sin(t * 2) }, f);
    lh.pose({ x: S6_FOAL, y: 67, s: 1.05, brow: got ? -1 : -.6, ear: got ? -1 : .2 + .2 * Math.sin(t * 3), neck: got ? -10 : -4, nod: got ? 0 : 4 * Math.sin(t * 2.2),
      look: got ? .8 : .3 * Math.sin(t * 1.4), shut: blinking(q, [S6.bubOn + 1.8]), sack: true, tail: (got ? 14 : 0) + 8 * Math.sin(t * 2.6) }, f);
    sq.pose({ x: S6_SQ, y: 130, s: .7, turn: -1, paw: -40 + 20 * Math.sin(t * 5), pawF: -30 + 20 * Math.sin(t * 5 + 1.5), brow: -.8, ear: -.4,
      tail: 10 * Math.sin(t * 3), tail2: 12 * Math.sin(t * 3 + 1), hop: 2 * Math.sin(t * 4), mouth: 'B' }, f);
    const dx = (-(t * 40) % 100).toFixed(1);
    tf(wv, `translate(${dx},0)`); tf(ln, `translate(${dx},0)`);
    bubs.forEach((b, i) => {   // air bubbles from Squirrel's mouth up to the surface
      const v = ((t / 1.6 + i / 3) % 1 + 1) % 1, x = S6_SQ - 25 + 6 * Math.sin(v * 9 + i * 2), y = 74 - v * 74;
      b.setAttribute('cx', x.toFixed(1)); b.setAttribute('cy', y.toFixed(1)); b.setAttribute('opacity', v < .92 ? '1' : '0');
    });
    const [mx, my] = S6_W(S6_FOAL + 40, -300);   // over the foal's head
    vis(qm, !got); vis(xm, got);
    const tilt = got ? 0 : 6 * Math.sin(t * 2), jump = got ? -10 * (1 - span(q, S6.go, S6.go + .25)) : 3 * Math.sin(t * 3);
    tf(qm, `translate(${mx - S6_BX},${(my - S6_BY + jump).toFixed(1)}) rotate(${tilt.toFixed(1)})`);
    tf(xm, `translate(${mx - S6_BX},${(my - S6_BY + jump).toFixed(1)}) scale(${(1 + .25 * (1 - span(q, S6.go, S6.go + .2))).toFixed(2)})`);
  };
}

/* ---------- shots ---------- */
const S6_WIDE = { x: 960, y: 520, z: 1.25 };    // the yard and the stable: he comes home, she comes out
const S6_TWO = { x: 885, y: 560, z: 2.0 };      // the two of them
const S6_LH = { x: 960, y: 560, z: 2.95 };      // him, her face whole at the left
const S6_MA = { x: 855, y: 505, z: 3.0 };       // her, his face whole at the right
const S6_MEM1 = { x: 1000, y: 455, z: 2.4 };    // him with the first memory over his head
const S6_MEM2 = { x: 1060, y: 452, z: 2.6 };    // closer, both memories
// True singles: the listener is off screen (not drawn) while the speaker has the frame to herself / himself.
const S6_MA1 = { x: 845, y: 505, z: 3.1 };      // Mother alone, looking right at him off screen
const S6_LH1 = { x: 985, y: 575, z: 3.4 };      // Little Horse alone, head low, looking left at her off screen
const S6_BUB = { x: 1100, y: 330, z: 1.45 };    // the whole bubble over him, both faces below it
const S6_IN1 = { x: 940, y: 215, z: 3.2 };      // in the bubble: the ox on his shelf, water on his shins
const S6_IN2 = { x: 1240, y: 205, z: 3.2 };     // along the waterline: the foal, water at his knees, the "?"
const S6_IN3 = { x: 1335, y: 262, z: 3.5 };     // and down to Squirrel in the deep part, under the line
const S6_CLOSE2 = { x: 900, y: 545, z: 2.4 };   // the two, close
const S6_END = { x: 900, y: 560, z: 1.8 };      // the yard: he trots off for the road, she watches

function scene6(p, D) {
  const cam = setCam(p, 'stable', S6_WIDE);
  const ma = motherPuppet(cam.stage), lh = horsePuppet(cam.stage);
  // the memories: Uncle Ox chewing in the river (water on his shins), Squirrel on his rock shouting
  const v1 = s6_vignette(cam.stage, 1080, 352, 200, 128, 3, `<rect x="-110" y="-70" width="220" height="140" fill="#dcecef"/><path d="M-110,0 C-40,-12 40,4 110,-8 L110,70 L-110,70 Z" fill="#b8cfa4"/><path d="M-110,38 H110 V70 H-110 Z" fill="#b9dcea"/>`);
  const v1ox = oxPuppet(v1.inner);
  v1.front.innerHTML = `<g filter="url(#paper)"><path d="M-110,40 C-60,36 0,44 110,38 L110,70 L-110,70 Z" fill="#5f9fc0" opacity=".45"/><path d="M-110,40 C-60,36 0,44 110,38" stroke="#fff" stroke-width="3" fill="none"/></g>`;
  const v2 = s6_vignette(cam.stage, 1238, 392, 150, 160, 8, `<rect x="-80" y="-85" width="160" height="170" fill="#e6ecd8"/><path d="M-80,40 C-30,30 30,44 80,36 L80,85 L-80,85 Z" fill="#6aaed0"/><path d="M-50,50 C-50,22 -20,12 10,14 C40,16 52,34 50,52 Z" fill="#9a958c"/>`);
  const v2sq = squirrelPuppet(v2.inner);
  bakeAll(v1.front);
  const bubble = s6_bubble(cam.stage);

  cam.to({ x: 930 }, 0, S6.stop)                               // drifting with him as he comes in
    .cut(S6_TWO, 3.4)                                          // "Why, you're back already?" (Mother, medium)
    .cut(S6_LH, s6_c(2.2))                                     // "A river was in my way. I... I couldn't get across."
    .cut(S6_MA, s6_c(6.45))                                    // "That river? Isn't it very shallow?"
    .cut(S6_MEM1, s6_c(9.6))                                   // "Yes! Uncle Ox said so too." (the ox memory)
    .cut(S6_MEM2, S6.but - .1)                                 // "But Squirrel said it's very deep. His friend drowned in it!"
    .cut(S6_MA1, S6.vigOff + .1)                               // her single: "So which is it, deep or shallow?"
    .to({ x: 835, y: 500, z: 3.5 }, S6.think, 1.6)             // a slight push: "Did you think about what they said?"
    .cut(S6_LH1, S6.hole - .1)                                 // his single: the hole, "No... I didn't."
    .cut(S6_CLOSE2, S6.child - .15)                            // "My child..." she nuzzles him
    .cut(S6_BUB, S6.use - .05)                                 // "Use your own head": the bubble
    .to(S6_IN1, S6.tryIt - .15, .55)                           // "and try it": the ox's shins
    .to(S6_IN2, S6.tryIt + .45, .5)                            // along the waterline to the foal's knees, the "?"
    .to(S6_IN3, S6.self, .5)                                   // "for yourself": Squirrel under the line
    .cut(S6_BUB, S6.go - .1)                                   // "Go": "!", his eyes light; "and see": the pop
    .cut(S6_CLOSE2, S6.bubOff + .1)                            // straight after the pop: "Then you'll know." He nods
    .cut(S6_END, S6.turn);                                     // the wide: he has turned for the road, trots off; she watches
  cam.soft(s6_c(2.2), true).soft(S6.child - .15, false).soft(S6.bubOff + .1, true).soft(S6.turn, false);

  const MA_BLINK = [.4, 3.0, 6.9, 9.6, 14.7, 17.9, 22.4, 26.3, 33.9, 36.9, 38.2, 40.5];
  const LH_BLINK = [1.2, 4.5, 8.2, 12.3, 15.4, 21.4, 24.6, 27.3, 35.1, S6.bubOff, 39.3];
  stopClock(D, (q, f) => {
    cam.apply(q, f);

    /* ---- Mother ---- */
    const mr = route(q, S6_MAK, 1.3), mTalk = lips(q, 'scene6', PRE6, 'm06', 'm06b', 'm06c', 'm06d');
    const nuzzle = span(q, s6_c(26.3), s6_c(26.9)) * (1 - span(q, S6.bubOn - .5, S6.bubOn + .2));
    ma.pose({ x: mr.x, y: 780, s: 1.3, d: (mr.x - 560) / 1.3, stand: mr.stand, gait: 'walk', mouth: mTalk,
      bob: 1.2 * Math.sin(q * 2 * Math.PI / 3.4),
      neck: s6_k(q, [[0, 4], [.7, -6], [1.3, -2], [3.5, -4], [3.8, -10], [5.6, -6], [6.4, 6], [10.2, 4], [11.4, -2], [13.2, 2], [16.4, 6], [18.8, 10],
        [20.6, 8], [21.6, 12], [S6.think, 12], [S6.think + 1.5, 16], [s6_c(25.0), 16], [s6_c(25.6), 8]]) * (1 - nuzzle) + 3 * nuzzle
        + s6_k(q, [[S6.bubOn - .5, 0], [S6.bubOn + .2, -10], [S6.turn, -10], [S6.run + .4, -14]]),
      nod: s6_bump(q, s6_c(7.6), 1.6, -7) + s6_k(q, [[s6_c(16.9), 0], [s6_c(17.6), 8], [s6_c(25.3), 8], [s6_c(25.8), 0]])
        + s6_bump(q, S6.didnt + .2, .8, 7) + 7 * nuzzle + s6_bump(q, S6.go, .6, 5) + s6_bump(q, S6.know + .1, .6, 5) + s6_bump(q, D - .9, 1.0, 7),
      // negative brows lift: surprised, concerned, gentle; never the down-to-the-nose stern one
      brow: s6_k(q, [[0, -.2], [.7, -.7], [3.4, -.7], [3.8, -1], [5.6, -.9], [6.6, -.5], [10.0, -.6], [13.2, -.3], [16.4, -.4], [18.8, -.8], [20.6, -.4],
        [S6.think, -.35], [S6.child, -.3], [S6.use, -.4], [S6.know, -.3]]),
      lid: 0,
      ear: s6_k(q, [[0, .1], [.7, -.8], [5.6, -.5], [6.6, .1], [10.0, -.3], [13.2, 0], [16.4, .2], [18.8, .5], [20.6, 0], [S6.child, .3], [S6.bubOn, -.2], [S6.run, -.6]])
        + .08 * Math.sin(q * 1.7),
      // she looks at him; on "deep" her eyes go away (left), on "shallow" back to him (right)
      look: s6_k(q, [[0, 0], [.7, 1], [S6.deep - .1, 1], [S6.deep + .05, -1], [S6.shallow - .1, -1], [S6.shallow + .05, 1], [S6.child, 1], [S6.child + .4, .7], [S6.bubOn, 1]]),
      tail: s6_k(q, [[0, 0], [1.3, 6], [3.5, 0]]) + 5 * Math.sin(q * 1.3 + 1),
      shut: blinking(q, MA_BLINK) || between(q, s6_c(26.6), s6_c(28.0)) }, f);   // eyes shut, tender, while she nuzzles

    /* ---- Little Horse ---- */
    const out = q >= S6.run, u = q - S6.run, V = 300, TA = .4;
    const xr = out ? 1080 + (u < TA ? .5 * V / TA * u * u : .5 * V * TA + V * (u - TA)) : route(q, S6_LHK, 1.05).x;
    const stand = out ? Math.max(0, 1 - u / .2) : route(q, S6_LHK, 1.05).stand;
    const turn = q < S6.turn ? -1 : 1;   // he turns on the cut to the wide
    const hTalk = lips(q, 'scene6', PRE6, 'h06', 'h06b', 'h06c');
    lh.pose({ x: xr, y: 780, s: 1.05, turn, d: out ? (xr - 1080) / 1.05 : (1800 - xr) / 1.05, stand, gait: out ? 'trot' : 'walk', mouth: hTalk, sack: true,
      bob: 1 * Math.sin(q * 2 * Math.PI / 2.9 + 2),
      neck: s6_k(q, [[0, 24], [S6.stop, 22], [s6_c(2.3), 18], [s6_c(3.2), 24], [s6_c(6.6), 20], [s6_c(7.6), 12], [S6.yes - .1, 12], [S6.yes + .2, -8], [S6.but - .2, -6],
        [S6.but + .3, 4], [S6.drown - .5, 2], [S6.drown, -4], [s6_c(17.0), 2], [S6.think, 4], [S6.think + 1.5, 10], [S6.hole, 14], [S6.no, 26], [S6.child, 22],
        [s6_c(26.4), 14], [S6.bubOn - .3, 14], [S6.bubOn + .3, -6], [S6.go, -6], [S6.go + .25, -14], [S6.turn, -10], [S6.run + .3, -4]]),
      nod: s6_bump(q, s6_c(5.5), .7, 5) + s6_bump(q, S6.didnt, .7, 6) + s6_bump(q, S6.bubOff + .05, .45, 15) + s6_bump(q, S6.know + .3, .4, 8),
      tilt: s6_bump(q, S6.yes, .7, -5) + s6_bump(q, S6.go, .5, -3),
      legs: { nf: [s6_bump(q, S6.yes, .5, 6), s6_bump(q, S6.yes, .5, 20) + s6_bump(q, S6.go + .1, .4, 14)] },
      ear: s6_k(q, [[0, .8], [S6.yes - .1, .6], [S6.yes + .15, -.8], [S6.but, -.6], [S6.but + .4, .6], [S6.think, .4], [S6.think + 1.5, .7], [S6.hole, .9], [S6.no, 1],
        [S6.child + .5, .6], [S6.bubOn, .1], [S6.go, .1], [S6.go + .2, -1], [S6.run + .5, -.8]]) + .1 * Math.sin(q * 2.1),
      // negative brows lift (worried, sad, surprised); positive only for the set-off
      brow: s6_k(q, [[0, -.6], [S6.yes, -.5], [S6.yes + .2, -.4], [S6.but + .2, -.5], [S6.but + .6, -1], [s6_c(17.0), -.7], [S6.think, -.6], [S6.no, -.9],
        [S6.child + .5, -.6], [S6.bubOn + .3, -.3], [S6.go, -.3], [S6.go + .2, -1], [S6.know, -.6], [S6.turn, .3]]),
      lid: s6_k(q, [[0, .2], [S6.stop, .15], [S6.yes, .15], [S6.yes + .2, 0], [S6.no, 0], [S6.no + .4, .15], [S6.child + .2, .15], [S6.bubOn, 0]]),
      // eyes: to Mother (+1) while she speaks, to the ground and away (-) when ashamed, up and back to the bubble
      look: s6_k(q, [[0, 0], [3.0, .6], [s6_c(2.4), -.6], [s6_c(6.6), .5], [S6.yes, 1], [s6_c(17.0), 1], [S6.hole - .1, 1], [S6.hole + .2, -.9], [S6.hole + .55, .3],
        [S6.no, -.7], [S6.child, .3], [S6.bubOn + .2, -.8], [S6.go - .1, -.8], [S6.go + .1, 1], [S6.turn, .6]]),
      tail: s6_k(q, [[0, -10], [S6.yes, -4], [S6.yes + .3, 10], [S6.but, 4], [S6.but + .5, -8], [S6.go, -2], [S6.go + .3, 12]]) + 5 * Math.sin(q * 1.9),
      shut: blinking(q, LH_BLINK) || between(q, s6_c(26.6), s6_c(28.3)) }, f);

    /* ---- the memories ---- */
    if (v1.place(q, f, S6.vig1, S6.vigOff)) {
      const t = q - S6.vig1;
      v1ox.pose({ x: -6, y: 56, s: .3, turn: 1, chew: t * 1.4, grass: true, lid: .35, tail: 6 * Math.sin(t * 2), shut: blinking(q, [S6.vig1 + 1.6, S6.vig1 + 4.2]) }, f);
    }
    if (v2.place(q, f, S6.vig2, S6.vigOff)) {
      const t = q - S6.vig2, cry = q >= S6.drown;
      v2sq.pose({ x: -6, y: 18, s: .68, turn: 1, lean: 8 + 3 * Math.sin(t * 6), paw: -100 + 25 * Math.sin(t * 7), pawF: -80 + 25 * Math.sin(t * 7 + 1), brow: -1,
        ear: -.6, tail: 12 * Math.sin(t * 5), tail2: 14 * Math.sin(t * 5 + 1), hop: Math.abs(5 * Math.sin(t * 6)), mouth: onTwos(q) > 0 ? 'D' : 'C', tear: cry,
        shut: blinking(q, [S6.vig2 + 1.3]) }, f);
    }

    vis(lh.g, !between(q, S6.vigOff + .1, S6.hole - .1));   // the singles
    vis(ma.g, !between(q, S6.hole - .1, S6.child - .15));
    bubble(q, f);
  });
}
