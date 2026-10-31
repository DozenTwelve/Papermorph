/* scene3.js — By the river: the first stop, a "listen and find" game (lib/find.js).
   n03 "Little Horse looked all around. Who could help him? Help him look! Listen, and touch what he asks for."
   Wide river shot; on "looked all around" Little Horse turns round to the tree and the flowers and back to the river,
   worried; the camera eases in to the game's frame (every thing in, none under another's word). Then he asks for one
   thing at a time (bird, flower, butterfly, ox; find.js speaks and moves his mouth through findMouth()), with his
   chin up and eyes to us while he asks, searching about between asks, glancing at each thing as it is found; finding
   Uncle Ox ends it ("There's Uncle Ox! Let's ask him!"). The picture lives on meanwhile: the ox chews in the river
   facing him, a kingfisher hops along the branch, a butterfly flutters over the flowers.
   Squirrel is hidden in the crown (not built) until scene 5. */
'use strict';
const PRE3 = 1.0;
let RIVER_THINGS = [];   // filled by scene3 each time it builds; findWords (lib/find.js) reads it
sfx('scene3', 0, 'river', .5);
sfx('scene3', 0, 'birds', .4);
sfx('scene3', 1.8, 'hoof', .25);   // the turn round, and back
sfx('scene3', 3.05, 'hoof', .25);

const s3_LH = 400;   // Little Horse at the tree end of the bank, where scene 2 leaves him; the rock is clear in front of him
const s3_OX = 1060, s3_OXY = WATER + 50;   // the ox where scenes 4 and 5 have him, facing Little Horse, water at his shins
const s3_TAP = { x: 700, y: 470, z: 1.2 };   // the tapping frame: tree to far bank, ground to crown
// the top of the tree's low branch at x (sets.js: 430 at x 262 rising to 412 at the tip, 440)
const s3_branchY = x => 412 + 18 * Math.max(0, (440 - x) / 178) ** 1.5 + 3;
// A cut-out turned over: from face a to face b over four frames on twos, never quite flat
const s3_turn = (q, t0, a, b) => { const k = Math.floor((q - t0) * FPS + 1e-6); return k < 0 ? a : k >= 4 ? b : [.5 * a, .12 * a, .12 * b, .5 * b][k]; };
const s3_bump = (q, t0, d) => q < t0 || q > t0 + d ? 0 : Math.sin(Math.PI * (q - t0) / d);

// A kingfisher, feet at (0, 0), facing right; bright against the branch and the crown.
function s3_bird(parent) {
  const g = mk('g', {}, parent), body = mk('g', {}, g);
  prop(body, `<g filter="url(#paper)"><path d="M-14,-15 L-38,-7 L-36,-1 L-12,-8 Z" fill="#1d6a90"/>
    <ellipse cx="0" cy="-16" rx="21" ry="13" fill="#2f95c0"/><path d="M-16,-12 C-8,-1 12,0 20,-12 C14,-4 -4,-2 -16,-12 Z" fill="#e8873a"/>
    <path d="M-12,-10 C-2,-3 12,-4 19,-13 L18,-9 C10,0 -6,0 -12,-10 Z" fill="#e8873a"/></g>
    <path d="M-3,-5 l-3,6 M5,-5 l1,6" stroke="#d2553a" stroke-width="3" stroke-linecap="round"/>`);
  const head = prop(body, `<g filter="url(#paper)"><circle cx="13" cy="-29" r="12" fill="#2f95c0"/><path d="M5,-24 C10,-18 20,-18 24,-24 C18,-21 10,-21 5,-24 Z" fill="#f6efe0"/>
    <ellipse cx="11" cy="-27" rx="5" ry="3" fill="#e8873a"/><path d="M22,-32 L46,-27 L22,-24 Z" fill="#2a1a10"/></g><circle cx="17" cy="-31" r="2.8" fill="#1a120c"/><circle cx="18" cy="-32" r="1" fill="#fff"/>`);
  const wing = prop(body, `<g filter="url(#paper)"><path d="M-14,-20 Q2,-30 14,-18 Q0,-9 -14,-20 Z" fill="#1d6a90"/><circle cx="-4" cy="-19" r="1.6" fill="#8fd3ea"/><circle cx="3" cy="-21" r="1.6" fill="#8fd3ea"/></g>`);
  return { g, pose(x, y, s, { dir = 1, hop = 0, peck = 0, look = 0, flap = 0 } = {}) {
    tf(g, `translate(${x.toFixed(1)},${(y - hop).toFixed(1)}) scale(${(s * dir).toFixed(3)},${s})`);
    tf(body, `rotate(${(peck * 30).toFixed(1)},4,-6)`);
    tf(head, `rotate(${(look * 14).toFixed(1)},12,-22)`);
    tf(wing, flap ? `rotate(${flap > 0 ? -55 : 15},-12,-20)` : '');
  } };
}
// Where the kingfisher is at q: every 2.8 s it hops to a new place along the branch (every third time a flutter
// with open wings), then pecks, looks about, or turns round.
function s3_birdAt(q) {
  const P = 2.8, k = Math.floor(q / P), u = q - k * P;
  const X = i => i <= 1 ? 398 : 372 + 60 * (.5 + .5 * jit(i, 61));   // the outer branch, over his back: clear of his head and of the butterfly's word
  const fly = k % 3 === 0, a = X(k - 1), b = X(k), dur = fly ? .7 : .35, moves = Math.abs(b - a) > 6;
  const dir = moves ? Math.sign(b - a) : k % 2 ? 1 : -1;
  if (moves && u < dur) {
    const w = u / dur;
    return { x: a + (b - a) * ease(w), hop: (fly ? 48 : 14) * Math.sin(Math.PI * w), dir, flap: fly ? onTwos(q) : 0 };
  }
  const turned = k % 3 === 2 && u > 1.9 ? -dir : dir;
  return { x: b, dir: turned, peck: k % 2 && u > 1.1 && u < 1.45 ? 1 : 0, look: u > 1.6 && u < 2.3 ? (k % 2 ? -1 : 1) : 0 };
}
// A butterfly seen from above, wings on twos.
function s3_butterfly(parent) {
  const g = mk('g', {}, parent), wings = [-1, 1].map(d => prop(g, `<g filter="url(#paper)"><path d="M0,0 C${12 * d},-34 ${44 * d},-32 ${38 * d},-6 C${34 * d},6 ${12 * d},4 0,0 Z" fill="#f08a24"/>
    <path d="M0,2 C${16 * d},8 ${30 * d},16 ${20 * d},30 C${10 * d},32 ${2 * d},18 0,2 Z" fill="#f5b23e"/><path d="M${30 * d},-24 C${40 * d},-22 ${42 * d},-12 ${38 * d},-6" stroke="#3b2a1e" stroke-width="4" fill="none"/>
    <circle cx="${24 * d}" cy="-16" r="4.5" fill="#f6efe0"/><circle cx="${34 * d}" cy="-12" r="2.6" fill="#f6efe0"/></g>`));
  prop(g, `<g filter="url(#paper)"><rect x="-3.5" y="-16" width="7" height="34" rx="3.5" fill="#3b2a1e"/></g><path d="M-2,-15 q-6,-12 -12,-14 M2,-15 q6,-12 12,-14" stroke="#3b2a1e" stroke-width="2" fill="none"/>`);
  return { g, pose(x, y, s, open, tilt) { tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${tilt.toFixed(1)}) scale(${s})`); wings.forEach(w => tf(w, `scale(${open},1)`)); } };
}
// just above the flower heads (its hit box clear of their middle), low enough that its long word (above it) stays
// under the kingfisher on the branch
const s3_flyAt = q => ({ x: 160 + 50 * Math.sin(.62 * q) + 10 * Math.sin(1.9 * q + 1), y: 612 + 6 * Math.sin(1.15 * q) + 3 * Math.sin(2.7 * q) });
// A clump of five paper flowers on short stems, big enough to find, base at (0, 0) on the bank top; each nods in the
// breeze on its own beat. Returns { g, pose(q) }.
const s3_FLOWERS = [[-44, -30, '#e0523f'], [-20, -44, '#f6efe0'], [4, -26, '#f2c140'], [26, -40, '#ee8fb0'], [48, -26, '#e0523f']];
function s3_flowers(parent, x, y) {
  const g = mk('g', { transform: `translate(${x} ${y})` }, parent);
  const petals = (cx, cy, c) => Array.from({ length: 5 }, (_, i) => { const a = i * Math.PI * 2 / 5 - Math.PI / 2; return `<circle cx="${(cx + 8 * Math.cos(a)).toFixed(1)}" cy="${(cy + 8 * Math.sin(a)).toFixed(1)}" r="7" fill="${c}"/>`; }).join('');
  const heads = s3_FLOWERS.map(([hx, hy, c], i) => prop(g, `<g filter="url(#paper)"><path d="M${hx * .4},8 Q${hx * .8},${hy * .5} ${hx},${hy}" stroke="#4f7c3e" stroke-width="4" fill="none"/>
    <path d="M${hx * .55},${hy * .35} q${i % 2 ? 14 : -14},-4 ${i % 2 ? 18 : -18},-14 q${i % 2 ? -10 : 10},2 ${i % 2 ? -18 : 18},14 Z" fill="#5d8c47"/>
    ${petals(hx, hy, c)}<circle cx="${hx}" cy="${hy}" r="5" fill="${c === '#f2c140' ? '#e0823a' : '#f2c140'}"/></g>`));
  return { g, pose(q) { heads.forEach((h, i) => tf(h, `rotate(${(3 * Math.sin(q * 1.4 + i * 1.3)).toFixed(1)},${(s3_FLOWERS[i][0] * .4).toFixed(1)},8)`)); } };
}

function scene3(p, D) {
  const cam = setCam(p, 'river');
  cam.to(s3_TAP, 3.4, 2.6);   // in from the wide shot on "Who could help him?"
  const st = cam.stage;
  // transparent shapes over things painted into the set
  const spot = (word, x, y, w, h, extra = {}) => ({ g: mk('rect', { x, y, width: w, height: h, fill: 'transparent' }, st), word, ...extra });
  // the river: the open water between the bank and the ox's nose; its word goes below (to the frame's foot, over
  // the water), clear of both faces and of the counter's card at the right
  const river = spot('river', 664, 724, 236, 180, { side: 'below', at: () => [780, 780] });
  // the tree: its crown and the top of the trunk (a tap on Little Horse must not say "tree"); its word to the right,
  // in the sky above the branch, so it covers neither the kingfisher nor his ears
  const tree = spot('tree', 95, 185, 250, 260, { side: 'right', at: () => [230, 330] });
  const flowers = s3_flowers(st, 160, 704);   // over the set's own small flowers, in front of them
  const flower = { g: flowers.g, word: 'flower', side: 'below', at: () => [160, 680] };
  const bird = s3_bird(st), fly = s3_butterfly(st);
  const ox = oxPuppet(st), lh = horsePuppet(st);
  let B = s3_birdAt(0), F = s3_flyAt(0);
  // the painted rock is left out: it lies behind his legs. Little Horse answers a tap on himself ("That's me!"), his
  // word below him, on the bank, clear of the kingfisher above.
  RIVER_THINGS = [river, tree, flower,
    { g: ox.g, word: 'ox', at: () => [900, 560] },
    { g: bird.g, word: 'bird', at: () => [B.x, 390] },
    { g: fly.g, word: 'butterfly', at: () => [F.x, F.y] },
    { g: lh.g, word: 'horse', clip: 'q-me', talk: true, side: 'below', at: () => [s3_LH + 100, 470] }];
  const thingAt = g => RIVER_THINGS.find(t => t.g === g)?.at();

  // Little Horse turns round once, for the scripted look round. While the page waits he stays facing the river (turned
  // round, his head would sit in front of the trunk and the kingfisher). He asks with his head up and his eyes to us,
  // searches about between asks (worried, not playing), and glances at each thing as it is found.
  const turns = [[1.75, -1], [3.0, 1]];
  const faceAt = q => { let a = 1, f = 1; for (const [t0, to] of turns) { if (t0 > q) break; f = s3_turn(q, t0, a, to); a = to; } return f; };
  let saw = null, sawQ = -1e9;   // the thing just found (find.js) and when, on the beat clock

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const wait = q > D, g = typeof findSaw === 'function' ? findSaw() : null;
    if (g !== saw) { saw = g; if (g) sawQ = q; }
    const asking = wait && typeof FIND !== 'undefined' && !!FIND.saying;
    const turn = faceAt(q), breathe = Math.sin(q * 2.2), at = saw && thingAt(saw);
    // where he looks: worried at the water; up ahead; the tree, the flowers; then searching about
    let neck, look, nod = 0;
    const behind = at && at[0] < s3_LH;   // behind him: the eyes go back and an ear turns to it
    if (at) { neck = at[1] < 500 ? -14 : at[1] > 640 ? 10 : 0; look = behind ? -.9 : .9; nod = 5 * s3_bump(q, sawQ + .3, .5); }
    else if (asking) { neck = -6; look = 0; nod = -5; }   // to us: chin up, eyes in the middle
    else if (q < 1.45) { neck = 7; look = .5; }
    else if (q < 1.75) { neck = -4; look = 1; }
    else if (q < 2.6) { neck = -16; look = .8; }
    else if (q < 3.05) { neck = 9; look = .6; }
    else { const k = Math.floor((q - 3.05) / 1.7) % 4; neck = [-2, 9, -10, 4][k]; look = [1, .7, -.8, .3][k]; }
    const ear = asking ? -.2 : at ? (behind ? .7 : -.4) : .25 + (Math.floor(q * 10) % 37 < 2 ? .7 : 0);   // a little back: worried
    lh.pose({ x: s3_LH, y: 700, s: 1.05, turn, sack: true, neck: neck + 1.2 * breathe, nod, look, ear,
      mouth: wait && typeof findMouth === 'function' ? findMouth() : 'X',
      bob: 1.2 * breathe, brow: at ? -.4 : -.6,   // worried throughout; eased a little as each thing is found
      tail: 6 * Math.sin(q * 1.3) + 10 * s3_bump(q % 6.1, 4.8, .5),
      shut: blinking(q, [.9, 3.6, 6.2]) || (wait && !asking && q % 3.7 < 2 / FPS) }, f);
    // Uncle Ox chews in the river facing Little Horse, a short rest every 5 s; slow blinks, a tail flick. Found, he
    // stops chewing and lifts his head (find.js hops and shakes his g itself, on top of this pose).
    const rest = Math.min(.8, Math.max(0, q % 5 - 4.2)), chewing = 1.4 * (q - .8 * Math.floor(q / 5) - rest);
    const oxSeen = saw === ox.g ? q - sawQ : 1e9;
    ox.pose({ x: s3_OX, y: s3_OXY, s: 1.4, turn: -1, grass: true, chew: (rest > 0 && rest < .8) || oxSeen < 2 ? 0 : chewing,
      neck: 4 + 2 * Math.sin(q * .8) - 8 * s3_bump(oxSeen, 0, 2), nod: 1.5 * Math.sin(chewing * Math.PI * 2),
      ear: s3_bump(q % 4.4, 3.9, .35) * .8, tail: 8 * Math.sin(q * .9),
      shut: blinking(q, [2.3, 5.4]) || (wait && (q + 1.3) % 5.3 < 2 / FPS) }, f);
    B = s3_birdAt(q);
    bird.pose(B.x, s3_branchY(B.x), 1.15, B);
    F = s3_flyAt(q);
    flowers.pose(q);
    fly.pose(F.x, F.y, 1, [1, .65, .3, .65][Math.floor(q * FPS / 2) % 4], 12 * Math.sin(q * 1.3));
  });
}
