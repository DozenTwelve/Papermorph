/* scene5.js — Squirrel. The shout from the tree; on "Stop!" Little Horse has turned to face him (on the cut) and asks,
   looking down at him; "Deep as anything!" is shown in a torn-paper picture over Squirrel's head (the river cut side-on,
   Squirrel at his size on the bed, the water far over his head); "and drowned!"; he turns back to the river (wide) and
   pulls back his hoof; the look back and forth; home. Beat clock = PRE5 + the scene clip's word times
   (content/little-horse/ch01/narration.en.words.txt). Uncle Ox stands where scene 4 left him (x 1060, facing left,
   water at his shins). Every shot is at zoom 3.5 or less (Firefox). */
'use strict';
const PRE5 = 1.6;

const s5_T = t => PRE5 + t;                                    // scene-clip time to beat clock
// The squirrel's leap: from the branch seat to the rock's left shoulder (clear of the horse's tail).
const s5_FROM = [380, 412], s5_TO = [438, 663], s5_UP = .5, s5_LAND = 1.2;
const s5_LIP = [658, 719];                                     // the bank's lip, where he waits while Little Horse goes
const s5_FACE = 575;                                           // Little Horse facing Squirrel (left): chest clear of him
const s5_VIG = [268, 398];                                     // the torn-paper picture, over Squirrel's head, left of the horse's face
const s5_V = {
  wide: { x: 600, y: 560, z: 1.4 },     // tree, branch, rock, the edge, the ox
  sqIn: { x: 490, y: 545, z: 2.9 },     // Squirrel lands and shouts; Little Horse whole, his face hearing it
  lhIn: { x: 470, y: 530, z: 2.8 },     // "Stop!": Little Horse has turned to him, looking down; Squirrel below
  sqCU: { x: 455, y: 548, z: 3.5 },     // Squirrel's close-up on the rock, the horse's face over him
  sqR: { x: 400, y: 600, z: 3.5 },      // Squirrel on the rock when the horse faces the river again
  twoB: { x: 400, y: 520, z: 2.2 },     // the two-shot from Squirrel's side: tiny squirrel, the huge horse's face over him
  vigIn: { x: 332, y: 420, z: 3.0 },    // into the picture, the horse's face beside it
  lhL: { x: 470, y: 455, z: 3.5 },      // Little Horse's close-up, facing left
  sqTight: { x: 446, y: 658, z: 3.5 },  // Squirrel's close-up for his line: face and paw centred, the tear readable (a cut, no zoom)
  two: { x: 590, y: 560, z: 2.0 },      // horse, squirrel and the ox's head
  edge: { x: 560, y: 662, z: 3.5 },     // the hoof at the edge
  lhCU: { x: 696, y: 490, z: 3.5 },     // Little Horse's close-up, facing the river
  ox: { x: 840, y: 530, z: 2.8 },       // Uncle Ox chewing, Little Horse's face beside him
  end: { x: 600, y: 560, z: 1.9 },      // the bank: he leaves left; Squirrel and the ox stay
};

/* The torn-paper picture: a sheet torn w × h around (0, 0), the same every time; inside it, the river cut side-on with
   the bed showing, drawn at the film's scale but deep (as scene 6's thought bubble draws it), so Squirrel at his own
   size stands on the bed with the water far over his head. */
function s5_torn(w, h, seed) {
  const pts = [], n = 9;
  const side = (x0, y0, x1, y1, k) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + 4 * jit(seed, k + i), y0 + (y1 - y0) * u + 4 * jit(seed, k + 40 + i)]); } };
  side(-w / 2, -h / 2, w / 2, -h / 2, 0); side(w / 2, -h / 2, w / 2, h / 2, 100); side(w / 2, h / 2, -w / 2, h / 2, 200); side(-w / 2, h / 2, -w / 2, -h / 2, 300);
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L') + ' Z';
}
const s5_SURF = -52, s5_BED = 80;                              // in the picture: the waterline and the bed under him
function s5_picture(stage) {
  const W = 250, H = 214, outer = mk('g', {}, stage), g = mk('g', {}, outer);
  const wave = Array.from({ length: 8 }, (_, i) => `Q${-160 + i * 40 + 10},${s5_SURF - 4} ${-160 + i * 40 + 20},${s5_SURF} T${-160 + i * 40 + 40},${s5_SURF}`).join(' ');
  g.innerHTML = `<clipPath id="s5clip"><path d="${s5_torn(W - 14, H - 14, 6)}"/></clipPath>
    <g filter="url(#paper)"><path d="${s5_torn(W, H, 5)}" fill="#fbf6ea"/></g>
    <g clip-path="url(#s5clip)">
      <g filter="url(#paper)"><rect x="-140" y="-120" width="280" height="240" fill="#dcecef"/>
        <path d="M-140,${s5_SURF - 14} C-60,${s5_SURF - 26} 40,${s5_SURF - 8} 140,${s5_SURF - 20} L140,${s5_SURF} L-140,${s5_SURF} Z" fill="#b8cfa4"/>
        <rect x="-140" y="${s5_SURF}" width="280" height="200" fill="#b9dcea"/></g>
      <g class="s5sq"></g>
      <g class="s5wave"><g filter="url(#paper)"><path d="M-160,${s5_SURF} ${wave} L160,200 L-160,200 Z" fill="#5f9fc0" opacity=".32"/></g></g>
      <g filter="url(#paper)"><path d="M-140,${s5_BED + 6} C-80,${s5_BED - 2} -30,${s5_BED + 2} 30,${s5_BED} C80,${s5_BED - 2} 110,${s5_BED + 4} 140,${s5_BED + 2} L140,140 L-140,140 Z" fill="#c9ad74"/>
        <ellipse cx="-88" cy="${s5_BED + 4}" rx="12" ry="6" fill="#9a958c"/><ellipse cx="74" cy="${s5_BED + 3}" rx="9" ry="5" fill="#857f74"/></g>
      <g class="s5line"><path d="M-160,${s5_SURF} ${wave}" stroke="#ffffff" stroke-width="4" fill="none"/></g>
      <g class="s5air"></g>
    </g>`;
  const sq = squirrelPuppet(g.querySelector('.s5sq'));
  const wv = g.querySelector('.s5wave'), ln = g.querySelector('.s5line'), air = g.querySelector('.s5air');
  const bubs = Array.from({ length: 3 }, (_, i) => mk('circle', { r: 3 + i, fill: '#f4fbff', 'fill-opacity': .4, stroke: '#ffffff', 'stroke-width': 2 }, air));
  bakeAll(g);
  // two small puffs from his head up to the picture
  const trail = [[414, 574, 5], [374, 542, 7]].map(([x, y, r]) =>
    prop(stage, `<g filter="url(#paper)"><circle cx="${x}" cy="${y}" r="${r + 2.5}" fill="#8a6a46"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fbf6ea"/></g>`));
  return (q, f, t0, t1) => {
    trail.forEach((t, i) => vis(t, q >= t0 - .2 + i * .08 && q < t1));
    const sc = q < t0 || q >= t1 ? 0 : [.4, 1.12, .95, 1][Math.min(3, Math.floor((q - t0) * FPS + 1e-6))];
    vis(outer, sc > 0);
    if (!sc) return;
    tf(outer, `translate(${s5_VIG[0] + jit(f, 61) * .4},${s5_VIG[1] + jit(f, 62) * .4}) rotate(-2) scale(${sc})`);
    const t = q - t0;
    // Squirrel on the bed, paddling gently, cheeks puffed, holding his breath
    sq.pose({ x: 4, y: s5_BED, s: .6, paw: -60 + 25 * Math.sin(t * 6), pawF: -40 + 25 * Math.sin(t * 6 + 1.6), brow: -.8, ear: -.3,
      tail: 10 * Math.sin(t * 3), tail2: 10 * Math.sin(t * 3 + 1), hop: 3 + 3 * Math.sin(t * 4), headR: -10, mouth: 'B', shut: blinking(q, [t0 + .9]) }, f);
    const dx = (-(t * 24) % 40).toFixed(1);
    tf(wv, `translate(${dx},0)`); tf(ln, `translate(${dx},0)`);
    bubs.forEach((b, i) => {   // air bubbles from his mouth up to the surface
      const v = ((t / 1.4 + i / 3) % 1 + 1) % 1, y0 = s5_BED - 52;
      b.setAttribute('cx', (26 + 5 * Math.sin(v * 9 + i * 2)).toFixed(1)); b.setAttribute('cy', (y0 - v * (y0 - s5_SURF)).toFixed(1));
      b.setAttribute('opacity', v < .92 ? '1' : '0');
    });
  };
}

function scene5(p, D) {
  const cam = setCam(p, 'river', s5_V.wide), V = s5_V, T = s5_T;
  const tPic = T(7.0), tPicOff = T(8.85), tTurnBack = T(13.35);
  const shots = [
    [s5_LAND, V.sqIn], [T(1.24), V.lhIn], [T(2.9), V.sqCU], [T(4.4), V.twoB], [T(7.3), V.vigIn], [tPicOff, V.sqTight],
    [T(11.9), V.lhL], [T(12.35), V.sqTight], [T(13.29), V.two], [T(14.25), V.edge], [T(15.75), V.two], [T(16.6), V.lhCU],
    [T(17.0), V.ox], [T(17.55), V.lhCU], [T(17.95), V.sqR], [T(18.5), V.lhCU], [T(20.3), V.end],
  ];
  for (const [t, v] of shots) cam.cut(v, t);
  cam.to({ y: 470 }, tPic - .15, .3);                   // up a little as the picture opens over him
  cam.to({ x: 560 }, T(20.5), 3.4);                     // the bank, drifting with him a little
  for (const [t, on] of [[s5_LAND, true], [T(4.4), false], [tPicOff, true], [T(13.29), false], [T(16.6), true], [T(20.3), false]]) cam.soft(t, on);

  const ox = oxPuppet(cam.stage), lh = horsePuppet(cam.stage), sq = squirrelPuppet(cam.stage);   // Squirrel nearest
  // a rustle in the tree: leaves shaken loose as he goes, falling left of his path
  const leaves = [[330, 430, .2], [362, 420, .35], [312, 440, .55], [350, 446, .7]].map(([x, y, t0], i) => ({ x, y, t0, i,
    g: prop(cam.stage, `<g filter="url(#paper)"><path d="M0,-9 C7,-6 8,4 0,9 C-8,4 -7,-6 0,-9 Z" fill="${['#71a056', '#83b264', '#5f8e48', '#94bb7c'][i]}"/><path d="M0,-8 L0,8" stroke="#4f7c3e" stroke-width="1.6"/></g>`) }));
  const picture = s5_picture(cam.stage);

  sfx('scene5', 0, 'river', .45); sfx('scene5', 0, 'birds', .35);
  sfx('scene5', .15, 'squeak', .35); sfx('scene5', s5_UP, 'whoosh', .7); sfx('scene5', s5_LAND, 'hop', .7);
  sfx('scene5', T(1.24), 'sting', .35);                 // "Stop!"
  sfx('scene5', tPic, 'pop', .4);                       // the picture opens
  sfx('scene5', T(15.3), 'hoof', .45);                  // the hoof set back down on the bank
  [[T(21.1), .22], [T(21.65), .22], [T(22.2), .2], [T(22.75), .15], [T(23.3), .1]].forEach(([t, v]) => sfx('scene5', t, 'hoof', v));   // slow steps away
  sfx('scene5', T(23.65), 'hop', .3);                   // Squirrel back up on his rock

  const lhBlinks = [0.9, T(.5), T(4.4), T(7.9), T(9.9), T(12.2), T(15.9), T(17.4), T(19.0), T(21.6), T(23.4)];
  const sqBlinks = [T(4.9), T(6.4), T(9.3), T(15.6), T(18.4), T(19.8), T(22.0), T(23.6)];
  const oxBlinks = [1.7, T(3.3), T(8.8), T(13.0), T(16.9), T(20.9), T(24.0)];

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const st = q - PRE5;                                  // scene-clip time

    /* ---------- Uncle Ox: in the shallows facing the bank (x 1060), unbothered ---------- */
    // As scene 4 left him: head lifted toward the foal, no grass, chewing. Mid-scene he dips for a fresh tuft and munches on.
    const dip = span(q, T(14.6), T(15.2)) - span(q, T(15.5), T(16.1));
    ox.pose({ x: 1060, y: WATER + 50, s: 1.4, turn: -1, chew: q * .85 + .01, grass: q > T(15.4),
      neck: 7.5 + 22 * dip + 2 * Math.sin(q * .85 * Math.PI * 2), nod: 6 * dip,
      lid: .45 + .1 * span(q, T(17), T(17.4)), look: q < T(4) ? .8 - .5 * span(q, T(2), T(4)) : between(q, T(17.0), T(17.55)) ? .6 : .3,
      ear: .3 * Math.sin(q * 1.3) ** 8, tail: 12 * Math.sin(q * 1.6), shut: blinking(q, oxBlinks) }, f);

    /* ---------- Squirrel ---------- */
    let sx = s5_FROM[0], sy = s5_FROM[1], stretch = 0, lean = 0, tail = 4 * Math.sin(q * 3.1), tail2 = 6 * Math.sin(q * 2.3 + 1);
    let paw = 0, pawF = 0, headR = 0, brow = 0, ear = 0, hop = 0, sturn = 1, tear = false;
    if (q < s5_UP) {                                       // crouch on the branch, ready
      const c = span(q, .1, s5_UP);
      stretch = -.7 * c; lean = 14 * c; tail = -10 * c + 4 * Math.sin(q * 9); headR = 6 * c;
    } else if (q < s5_LAND) {                              // the leap: an arc, stretched out, tail streaming
      const u = (q - s5_UP) / (s5_LAND - s5_UP);
      sx = s5_FROM[0] + (s5_TO[0] - s5_FROM[0]) * u;
      sy = s5_FROM[1] + (s5_TO[1] - s5_FROM[1]) * u - 520 * u * (1 - u);
      stretch = 1; lean = 28 - 30 * u; tail = -48 + 20 * u; tail2 = -12; paw = -70; pawF = -60; headR = -8 + 16 * u;
    } else {
      sx = s5_TO[0]; sy = s5_TO[1];
      const k = (q - s5_LAND) * FPS;                       // landing squash, then up
      stretch = k < 2 ? -1 : k < 4 ? .35 : 0;
      if (k < 4) { tail = -20 + 8 * k; lean = 10; }
    }
    const up = st > 1.3 && st < 13.3 ? -14 : 0;            // while the horse faces him, his face is high above: look up
    if (st > 0 && st < 4.4) {                              // "Little Horse! Stop! Don't cross! You'll drown!"
      paw = st < 1.24 ? -95 - 15 * Math.sin(st * 14) : st < 2.9 ? -125 : -150;
      pawF = st < 1.24 ? -40 : st < 2.9 ? -115 : -150;
      lean = st < 2.9 ? 8 : 4; brow = -.7; ear = -1; headR = up;
      hop = (between(st, 1.24, 1.6) ? 10 * Math.sin(Math.PI * (st - 1.24) / .36) : 0) + (between(st, 1.9, 2.2) ? 6 * Math.sin(Math.PI * (st - 1.9) / .3) : 0);
      tail2 = 10 * Math.sin(st * 8);
    } else if (st >= 4.4 && st < 6.78) {                    // listening to the question, looking up at him
      paw = tween(q, T(4.4), .3, -150, -20); pawF = tween(q, T(4.4), .3, -150, -10);
      headR = -18 + 4 * span(q, T(5.4), T(5.8)); brow = -.4; ear = -.4;
    } else if (st >= 6.78 && st < 11.42) {                  // "Deep as anything!" (the picture) … "a friend of mine fell into this river,"
      const big = st < 7.2, pic = st >= 7.2 && st < 8.85;
      paw = big ? -80 - 12 * Math.sin(st * 6) : pic ? -150 : st < 10.3 ? -40 : tween(q, T(10.3), .4, -40, -65);   // arms wide, points up at the picture, then at the river
      pawF = big ? -60 + 15 * Math.sin(st * 6 + 1) : pic ? -30 : -10;
      lean = big ? 10 : pic ? 2 : 8 + 6 * span(q, T(10.3), T(10.8));
      hop = big && between(st, 6.8, 7.2) ? 9 * Math.sin(Math.PI * (st - 6.8) / .4) : 0;
      tail = big ? -10 : tail; tail2 = big ? 11 * Math.sin(st * 11) : tail2;   // bristling
      brow = big || pic ? -.8 : -.6 - .3 * span(q, T(10.6), T(11.3)); ear = big ? -1 : 0;
      headR = big ? -12 : pic ? -22 : tween(q, T(9.6), .6, -12, 6);
    } else if (st >= 11.42) {                               // "and drowned!": the tear, the wipe, the tail falls
      const s = span(q, T(11.42), T(12.3));
      tear = st > 11.95 && st < 13.25; ear = .9 * s; brow = -1; headR = 6 + 10 * s; lean = 14 + 6 * s;
      tail = -12 - 26 * s; tail2 = 10 * s;
      const w = st - 12.6;                                 // wipes his eye with his paw (the tear shows between strokes)
      paw = w < 0 ? -40 : w < .65 ? -100 - 18 * Math.max(0, Math.sin(w * 12)) : w < .9 ? tween(q, T(13.25), .25, -100, -20) : -20;
      pawF = -10;
      if (st > 15.8) { headR = 16 - 22 * span(q, T(15.8), T(16.2)); }   // looks up at the horse again
      if (between(st, 17.95, 18.6)) { headR = -2 + 14 * Math.sin((st - 17.95) * 14) * (1 - span(q, T(18.4), T(18.6))); ear = -.3; }   // nods hard: deep!
      if (st >= 18.7) {                                     // out of his way (off camera, during the sigh): down to the lip; back on the rock when he has gone
        const a = span(q, T(18.7), T(18.95)), b = span(q, T(18.95), T(19.5));
        const c = span(q, T(22.7), T(23.4)), d = span(q, T(23.4), T(23.65));
        const gx = b > 0 ? 500 + (s5_LIP[0] - 500) * b : 438 + 62 * a;
        sx = c > 0 ? (d > 0 ? 500 - 62 * d : s5_LIP[0] - (s5_LIP[0] - 500) * c) : gx;
        const ground = x => x < 600 ? 700 : RIVER_BED(x);
        sy = d > 0 ? 700 - 37 * d - 40 * Math.sin(Math.PI * d) : c > 0 ? ground(sx) : b > 0 ? ground(sx) : 663 + 37 * a - 30 * Math.sin(Math.PI * a);
        const run = (between(q, T(18.95), T(19.5)) || between(q, T(22.7), T(23.4)));
        hop = run ? 7 * Math.abs(Math.sin(q * 18)) : 0; lean = run ? 18 : 6; stretch = run ? .3 : 0;
        sturn = q < T(20.7) ? 1 : 1 - 2 * span(q, T(20.7), T(20.95));   // turns to watch him go
        headR = 2; tail = -24 + 8 * Math.sin(q * 2); tail2 = 6 * Math.sin(q * 2.6); paw = -20; pawF = -10; brow = -.5; ear = .3;
      }
      if (st < 13.3) headR += up * .6;
    }
    tail2 = Math.max(-12, Math.min(12, tail2));             // keep the plume's two pieces joined at the pin
    sq.pose({ x: sx, y: sy, s: .6, turn: sturn, stretch, lean, tail, tail2, paw, pawF, headR, brow, ear, hop, tear,
      mouth: lips(q, 'scene5', PRE5, 's05', 's05b'), shut: blinking(q, sqBlinks) }, f);

    /* ---------- the leaves, the picture ---------- */
    for (const L of leaves) {
      const u = q - L.t0, on = u > 0 && u < 3;
      vis(L.g, on);
      if (on) tf(L.g, `translate(${(L.x + 14 * Math.sin(u * 3 + L.i) - 16 * u).toFixed(1)},${(L.y + 70 * u).toFixed(1)}) rotate(${(40 * Math.sin(u * 4 + L.i * 2)).toFixed(0)})`);
    }
    picture(q, f, tPic, tPicOff);

    /* ---------- Little Horse (brows negative = worried) ---------- */
    // As scene 4 left him: x 560 facing the river, near fore hoof over the water, looking down at it.
    const o = { x: 560, y: 700, s: 1.05, turn: 1, sack: true, neck: 12, nod: 10, look: .2, brow: -.25, ear: -.8,
      tail: 4 * Math.sin(q * 1.4) - 38 * span(q, s5_LAND, s5_LAND + .3), lid: 0 };   // the thump behind him: the tail clamps
    let nf = [36, 26];
    if (q > T(0) && q < T(1.24)) o.ear = -.8 + .5 * span(q, T(0), T(.3));            // an ear swivels back to the voice
    if (q >= T(1.24) && q < tTurnBack) {
      // "Stop!": on the cut he has turned round to face Squirrel, and looks down at him
      Object.assign(o, { x: s5_FACE, y: 702, turn: -1, neck: 4, nod: 12, look: .5, brow: -.8, ear: -.4, tail: -10 + 3 * Math.sin(q * 1.4) });
      nf = null;
      if (q < T(1.6)) o.tilt = -3 * (1 - span(q, T(1.24), T(1.6)));                   // still rocking from the turn
      if (q > T(2.9) && q < T(4.4)) { o.brow = -1; o.ear = .4; o.nod = 12 + 5 * (span(q, T(3.1), T(3.25)) - span(q, T(3.3), T(3.5))); }   // "drown!": a gulp
      if (between(q, tPic, tPicOff)) { o.neck = tween(q, tPic, .3, 4, -8); o.nod = tween(q, tPic, .3, 12, -2); o.look = .9; o.brow = -1; o.ear = -.6; }   // he sees the picture
      if (q >= tPicOff) { o.neck = -14; o.nod = -8; o.look = .5; o.ear = .3; o.brow = -1; }   // listening, head up (out of Squirrel's close-up)
      if (q >= T(11.9) && q < T(12.35)) { o.nod = -8 + 14 * span(q, T(11.95), T(12.1)); o.ear = .9; o.look = .7; }   // "drowned": he gulps, ears flat
    } else if (q >= tTurnBack) {
      // turns back to the river in the wide shot, puts a hoof out over the water … and "pulled back his hoof"
      const k = span(q, tTurnBack, tTurnBack + .35);
      Object.assign(o, { x: s5_FACE - 15 * k, turn: -1 + 2 * k, brow: -1, ear: .6, neck: 10, nod: 8, look: .5 });
      const out = span(q, T(13.75), T(14.1)), back = span(q, T(14.6), T(15.3));
      nf = back > 0 ? [36 - 44 * back, 26 * (1 - back) + 10 * Math.sin(Math.PI * back)] : [36 * out, 26 * out];
    }
    if (q >= T(16.6)) {                                     // "He didn't know what to do": to the ox, to Squirrel, ears sinking
      const back = q >= T(17.55);
      Object.assign(o, { look: back ? -1 : 1, neck: back ? -10 : -2, nod: back ? 10 : -6, brow: -1, ear: .2 + .5 * span(q, T(16.6), T(18.4)) });
      nf = [-8, 0];
    }
    if (q >= T(18.5)) {                                     // "Oh." — the sigh; "I'd better go home and ask Mama."
      const s = span(q, T(18.6), T(19.4));
      Object.assign(o, { look: -1 + 1.3 * s, neck: -6 + 28 * s, ear: .7 + .3 * s, lid: .3 * s, brow: -1 + .2 * s, nod: 8 - 4 * s,
        tilt: 1.5 * Math.sin(Math.PI * span(q, T(18.6), T(19.3))) });   // the breath out
    }
    if (q >= T(20.3)) {                                     // turns round in the wide shot and walks off left, head low
      o.turn = 1 - 2 * span(q, T(20.5), T(20.85));
      const r = route(q, [[T(20.9), 560], [T(24.6), -140]], 1.05);
      Object.assign(o, { x: r.x, d: r.d, stand: r.stand, gait: 'walk', neck: 44, nod: 6, ear: 1, lid: .3, look: .3, brow: -.8, tail: -6, tilt: 0 });   // head under the branch
      nf = null;
    }
    lh.pose({ ...o, legs: nf ? { nf } : {}, mouth: lips(q, 'scene5', PRE5, 'h05', 'h05b'), shut: blinking(q, lhBlinks) }, f);
  });
}
