/* scene4w.js — in the meadow: listen and find (the engine's findWords, as Little Horse's scenes 3 and 8).
   s04w "Little Red Riding Hood wanted flowers for Grandma. Help her look! Listen, and touch what she asks for."
   Shot 1 (0 – "Help"): medium close, Red bent over one flower, picks it on "flowers", holds it up, and it goes into
   her bouquet on "Grandma". Shot 2 (cut on "Help", a little wide): she looks about the meadow in profile, turns round
   to us on "Listen", her eyes on the butterfly, while the camera eases in to the game's frame (still from D on). The game: she asks for a flower, the butterfly, the bird
   (findWords speaks; her mouth follows findMouth(), her eyes go to FIND.target while she waits, to us while she asks).
   Every flower in the frame is a flower: the set's big fore flowers are drawn live here (the baked fore layer is
   hidden), the small painted ones get a live copy the moment one is touched. The flower the child touches, wherever
   it is, is wrapped into the one "flower" thing findWords knows (s4w_wrap), so it is the one that hops, is found and
   flies into her bunch, and keeps its colour there. The bird pecks and hops along the tree top, the butterfly loops
   over the grass, the sun's rays turn, the cloud drifts. Every visible thing answers a tap with its name. */
'use strict';
const PRE4W = 1.0;
let MEADOW_THINGS = [];   // filled by scene4w each time it builds; findWords reads it
sfx('scene4w', 0, 'meadow', .6, { loop: true });
sfx('scene4w', PRE4W + 1.55, 'rustle', .5);   // the stem snaps

const s4w_RX = 2300, s4w_GY = 795, s4w_S = .6, s4w_B0 = 5;   // Red on the grass; flowers in her bunch from scene 4 (5; 7 by scene 7)
const s4w_GAME = { x: 2430, y: 590, z: 1.65 };                // the tapping frame: cloud and flowers to tree and bird
const s4w_CLUMP = [[2105, '#d6493f', .95, 0], [2160, '#efae48', 1.05, 1.7], [2212, '#e88ab0', .9, 3.1]];   // x, colour, s, phase
const s4w_PICK = { x: s4w_RX + 30, col: '#f6efe0' };            // the one she picks in shot 1
// The meadow set's fore layer (k 1.3) where this scene's cameras see it, drawn live from the same numbers
// (art/sets.js, meadow: grassTufts and bigFlower): tufts [x, h], flowers [x, h, r, colour], feet on y 1000.
const s4w_TUFTS = [[2210, 68], [2386, 82], [2489, 90], [2645, 79], [2739, 53], [2950, 81], [3083, 74], [3214, 104], [3404, 83], [3621, 94]];
const s4w_FORE = [[3493, 70, 16.9, '#d6493f'], [3113, 134, 22.4, '#f6efe0'], [3277.6, 161, 26.9, '#efae48'], [3264, 117, 21.1, '#8a6ab0'],
  [2741.8, 106, 25.8, '#efae48'], [2209, 159, 14.7, '#8a6ab0'], [2971, 77, 22.9, '#8a6ab0'], [2718, 92, 16.5, '#f6efe0'], [3485, 115, 22, '#d6493f'],
  [2940, 155, 20.7, '#f6efe0'], [3196, 76, 19.5, '#8a6ab0'], [2397, 86, 19.1, '#f6efe0'], [2497.7, 84, 25.6, '#efae48'], [3002, 114, 18.4, '#d6493f']];
const s4w_HERO = 1;   // the big white one in the middle: the flower the hints point at and the give-up finds (its word clears Red)
// The set's small painted flowers in the game frame (house layer, k 1): "x,y,colour index" of their heads.
const s4w_MC = ['#d6493f', '#f6efe0', '#efae48', '#e88ab0', '#8a6ab0'];
const s4w_SMALL = ('2946,736,1 2949,735,2 2520,790,0 2535,794,0 2540,784,2 2542,788,4 1939,710,4 1962,707,4 1922,716,2 1926,709,1 2935,825,4 ' +
  '2614,717,3 2638,722,3 2607,715,4 2656,729,0 1925,721,4 1941,732,0 2401,871,3 2383,864,2 2426,869,1 2408,867,0 2630,784,2 2652,785,2 ' +
  '2632,791,1 2676,788,4 2344,865,4 2317,867,4 2353,855,4 2355,859,2 2324,805,4 2356,813,2 2361,819,1 2362,813,1 2466,840,1 2495,843,3 ' +
  '2475,846,0 2511,847,4 2833,732,1 2831,730,4 2779,744,0 2782,744,1 2248,817,0 2261,806,4 2304,814,4 2289,817,2 2687,803,1 2697,798,0 ' +
  '2704,804,3 2697,797,2 2838,747,3 2816,745,1 2855,752,3 2850,743,3 2565,716,2 2514,722,4 2543,727,0 2527,714,1 2449,798,1 2477,792,1 ' +
  '2454,785,0 2469,794,1 2483,760,0 2516,770,0 2534,768,1 2522,762,4 2683,731,4 2688,743,2 2682,741,0 2680,746,1 2609,770,2 2570,784,0 ' +
  '2574,772,1 2606,776,0 2374,781,3 2379,785,3 2404,782,4 2410,775,1 2799,826,2 2770,825,3 2798,825,0 2799,828,1 2732,846,2 2745,844,0 ' +
  '2772,833,1 2730,838,1 2265,717,2 2296,730,2 2270,724,3 2308,719,2 2935,829,1 2942,828,3 1903,829,2 2113,784,1 2107,792,0 2081,788,4 ' +
  '2097,781,3 2947,792,0 2949,796,1 2910,797,1 2930,791,2').split(' ').map(t => t.split(',').map(Number));
// the set's bigFlower, drawn from its foot at (0, 0)
const s4w_bloomSVG = (h, r, col) => `<g filter="url(#paper)"><path d="M0,0 C-6,${-h * .4} 6,${-h * .7} 0,${-h}" stroke="#4f7a34" stroke-width="${(r * .22).toFixed(1)}" fill="none"/>
  <path d="M0,${-h * .35} q${-r * 1.4},${-r * .4} ${-r * 1.8},${-r * 1.3} q${r * 1.2},0 ${r * 1.8},${r * 1.3} Z M0,${-h * .55} q${r * 1.4},${-r * .4} ${r * 1.7},${-r * 1.2} q${-r * 1.2},0 ${-r * 1.7},${r * 1.2} Z" fill="#5b8a3e"/>
  ${[0, 1, 2, 3, 4].map(i => { const a = i * 1.2566 - 1.57; return `<circle cx="${(r * .95 * Math.cos(a)).toFixed(1)}" cy="${(-h + r * .95 * Math.sin(a)).toFixed(1)}" r="${(r * .72).toFixed(1)}" fill="${col}"/>`; }).join('')}
  <circle cy="${-h}" r="${(r * .55).toFixed(1)}" fill="#efae48"/></g>`;
// a small paper tuft that hides a picked painted flower's head (a flat grass disc showed as a pale dot)
const s4w_TUFT = `<g filter="url(#paper)"><path d="M-12,8 Q-14,-2 -16,-10 Q-6,-2 -3,-14 Q1,-3 6,-12 Q7,0 15,-8 Q11,2 12,8 Z" fill="#5f8f42"/></g>`;
// the set's small flower (flowers()), drawn from its head at (0, 0)
const s4w_budSVG = col => `<g filter="url(#paper)"><rect x="-1.5" y="0" width="3" height="18" fill="#4f7a34"/><circle r="7" fill="${col}"/><circle r="2.6" fill="#efae48"/></g>`;
const s4w_bump = (q, t0, d) => q < t0 || q > t0 + d ? 0 : Math.sin(Math.PI * (q - t0) / d);
// the screen-left (bouquet) hand of the front figure, in puppet units from the hip (armsF in cast.js)
const s4w_hand = (lua, lfa) => { const r = Math.PI / 180, a = lua * r, b = (lua + lfa) * r;
  return [-30 - 52 * Math.sin(a) - 48 * Math.sin(b), -126 + 52 * Math.cos(a) + 48 * Math.cos(b)]; };
// a client point in a group's own units
const s4w_local = (g, x, y) => { const m = g.getScreenCTM(), d = m.a * m.d - m.b * m.c, u = x - m.e, v = y - m.f; return [(m.d * u - m.c * v) / d, (m.a * v - m.b * u) / d]; };
const s4w_seg = (px, py, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay, u = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(px - ax - u * vx, py - ay - u * vy); };
const s4w_in = (g, x, y) => { const r = g.getBoundingClientRect(); return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
// the butterfly's loop over the grass between Red and the tree; the bird's place on the tree top
const s4w_flyAt = q => ({ x: 2490 + 60 * Math.sin(.7 * q) + 12 * Math.sin(2.1 * q + 1), y: 650 + 22 * Math.sin(1.3 * q) + 6 * Math.sin(3.1 * q) });
function s4w_birdAt(q) {   // every 3.1 s a hop to a new place along the crown, then a peck or a look about
  const T = 3.1, k = Math.floor(q / T), u = q - k * T, X = i => 2715 + 70 * (.5 + .5 * jit(i, 47));
  const a = X(k - 1), b = X(k), dir = b > a ? 1 : -1;
  if (u < .35) { const w = u / .35; return { x: a + (b - a) * ease(w), hop: 18 * Math.sin(Math.PI * w), dir, flap: k % 3 === 0 ? onTwos(q) : 0 }; }
  return { x: b, hop: 0, dir: k % 2 ? dir : -dir, peck: u > 1.2 && u < 1.5 ? 1 : 0, look: u > 2 && u < 2.6 ? 1 : 0 };
}

function scene4w(p, D) {
  const C = t => clipAt('scene4w', PRE4W, 's04w', t), HELP = C(3.4), LISTEN = C(4.55);
  const cam = paperCam(p, 'meadow', { x: s4w_RX - 10, y: 668, z: 2.5 }, { stages: ['fore'] });
  cam.show('fore', false);   // drawn live below, so every big flower can be touched and picked
  cam.to({ x: s4w_RX + 10, y: 660, z: 2.75 }, 0, HELP);   // a slow push while she picks
  cam.cut({ x: 2420, y: 575, z: 1.45 }, HELP).to(s4w_GAME, LISTEN, D - LISTEN);   // in on her as she turns to us; still from D (the taps)
  const st = cam.stage, fore = cam.stageAt.fore;
  const sun = sunProp(st), cloud = cloudProp(st);
  const tree = mk('rect', { x: 2610, y: 450, width: 270, height: 290, fill: 'transparent' }, st);   // painted into the set
  const bird = birdProp(st), fly = butterflyProp(st);
  // the flowers that can be picked: the clump at the left, the small painted ones (copied when touched), the fore
  const flowers = [];
  const clumpG = mk('g', {}, st), smallG = mk('g', {}, st);
  s4w_CLUMP.forEach(([x, col, s, ph]) => flowers.push({ el: prop(clumpG, s4w_bloomSVG(70, 12.6, col)), g: st, x, y: s4w_GY + 40, h: 70, R: 21, s, col, ph }));
  const red = redPuppet(st);
  const pick = flowerProp(st, s4w_PICK.col);
  prop(fore, `<g filter="url(#paper)">${s4w_TUFTS.map(([x, h]) => `<path d="M${x},1000 Q${x - 20},${1000 - h * .6} ${x - 34},${1000 - h} Q${x},${1000 - h * .5} ${x + 10},${1000 - h * 1.1} Q${x + 18},${1000 - h * .5} ${x + 44},${1000 - h * .8} Q${x + 30},${1000 - h * .3} ${x + 40},1000 Z" fill="#4f7d3c"/>`).join('')}</g>`);
  const foreRecs = s4w_FORE.map(([x, h, r, col], i) => ({ el: prop(fore, s4w_bloomSVG(h, r, col)), g: fore, x, y: 1000, h, R: 1.67 * r, s: 1, col, ph: i * 1.7, fore: true }));
  flowers.push(...foreRecs);
  const flyG = mk('g', {}, cam.world);   // the picked flower on its way, then in her bunch: in front of everything, k 1
  const headF = red.g.querySelector('[data-p="headF"]'), eyes = [...headF.querySelectorAll('.eyeO, .eyeC')];
  const basket = red.g.querySelector('[data-p="basketF"]');

  // the one "flower" thing findWords knows: it wraps whichever flower was touched last (the big white one at first)
  const fG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  let held = null;
  const wrap = f => { if (held === f) return; if (held) fG.replaceWith(held.el); f.el.replaceWith(fG); fG.append(f.el); held = f; };
  wrap(foreRecs[s4w_HERO]);
  let OX = 0, OY = 0;   // the fore layer's parallax offset in the current frame
  const headAt = f => f.fore ? [f.x + OX, f.y - f.h + OY] : [f.x, f.y - f.h * f.s];
  // a touch on the picture: the flower under the finger (front ones first; none behind Red or the butterfly), else null
  const smallRecs = new Map();
  const flowerAt = (cx, cy) => {
    let best = null, bd = 1;
    const [fx, fy] = s4w_local(fore, cx, cy), [sx, sy] = s4w_local(st, cx, cy);
    for (const f of foreRecs) if (!f.picked) {
      const hy = f.y - f.h, d = Math.min(Math.hypot(fx - f.x, fy - hy) / (f.R + 14), s4w_seg(fx, fy, f.x, f.y, f.x, hy) / (8 + .3 * f.R));
      if (d < bd) { bd = d; best = f; }
    }
    if (best || s4w_in(red.g, cx, cy) || s4w_in(fly.g, cx, cy)) return best;
    for (const f of flowers) if (!f.fore && !f.picked) {
      const hy = f.y - f.h * f.s, d = Math.min(Math.hypot(sx - f.x, sy - hy) / (f.R * f.s + 12), s4w_seg(sx, sy, f.x, f.y, f.x, hy) / 10);
      if (d < bd) { bd = d; best = f; }
    }
    if (best) return best;
    for (const [x, y, c] of s4w_SMALL) { const d = Math.hypot(sx - x, sy - y) / 18; if (d < bd) { bd = d; best = [x, y, c]; } }
    if (!best) return null;
    const key = best.join(), had = smallRecs.get(key);
    if (had) return had.picked ? null : had;
    // a small painted one: a live copy over it, and a tuft over the painted head once the copy is picked
    const [x, y, c] = best;
    const tuft = prop(smallG, s4w_TUFT), el = prop(smallG, s4w_budSVG(s4w_MC[c]));
    tf(tuft, `translate(${x},${y + 2})`); vis(tuft, false); tf(el, `translate(${x},${y})`);
    const f = { el, tuft, g: st, x, y, h: 0, R: 7, s: 1, col: s4w_MC[c], small: true };
    smallRecs.set(key, f); flowers.push(f);
    return f;
  };
  // inside the asked thing's tap box (findWords's hitBox: its box, at least minBox 120 stage px): findWords finds it
  const inAsked = (cx, cy) => {
    if (!FIND.target || FIND.target === fG) return false;
    const s = $('stage').getBoundingClientRect(), r = FIND.target.getBoundingClientRect(), k = s.width / SW, m = 120 * k;
    const w = Math.max(m, r.width), h = Math.max(m, r.height), x0 = r.left + (r.width - w) / 2, y0 = r.top + (r.height - h) / 2;
    return cx >= x0 && cx <= x0 + w && cy >= y0 && cy <= y0 + h;
  };
  const onDown = e => {
    if (!e.isTrusted || !e.target.closest?.('.findw') || gotQ !== null && fly01 < 1 || inAsked(e.clientX, e.clientY)) return;
    const f = flowerAt(e.clientX, e.clientY);
    if (!f) return;
    wrap(f);
    if (FIND.target === fG) return;   // asked for a flower: findWords finds it in fG's box
    // asked for something else: the flower answers "flower" and hops, as every wrong thing does
    const hit = [...document.querySelectorAll('.findw rect')].find(r => r.getAttribute('aria-label') === 'flower');
    if (!hit) return;
    e.stopPropagation(); e.preventDefault();
    hit.dispatchEvent(new PointerEvent('pointerdown', { clientX: e.clientX, clientY: e.clientY, bubbles: true, cancelable: true }));
  };
  document.addEventListener('pointerdown', onDown, true);
  P.cleanup.push(() => document.removeEventListener('pointerdown', onDown, true));

  // where each thing is in the world (for her eyes)
  let B = s4w_birdAt(0), F = s4w_flyAt(0), flying = null, got = null, gotQ = null, fly01 = 0, bunchHead = null;
  const where = new Map([[sun.g, () => [2600, 395]], [cloud.g, () => [2060, 420]], [tree, () => [2745, 560]], [bird.g, () => [B.x, 440]],
    [fly.g, () => [F.x, F.y]], [fG, () => flying || headAt(held)], [basket, () => [s4w_RX + 30, 690]]]);
  MEADOW_THINGS = [{ g: fG, word: 'flower', side: 'above' }, { g: fly.g, word: 'butterfly' }, { g: bird.g, word: 'bird' },
    { g: tree, word: 'tree' }, { g: sun.g, word: 'sun' }, { g: cloud.g, word: 'cloud' }, { g: basket, word: 'basket', side: 'right' },
    { g: red.g, word: 'Red Riding Hood', clip: 'q-me', talk: true, side: 'above' }];
  let birdQ = -1e9, flyQ = -1e9, sawG = null;

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const v = cam.at(q); OX = -.3 * (v.x - 800); OY = -.3 * (v.y - 450);
    const wait = q > D, saying = wait && FIND.saying, breathe = Math.sin(q * 2.3);
    // what findWords has just done: the flower found (it flies), the bird or the butterfly found (they show off)
    if (FIND.found === fG && gotQ === null) {
      gotQ = q; got = held; got.picked = true; got.from = headAt(got);
      wrap(foreRecs[s4w_HERO].picked ? foreRecs.find(r => !r.picked && r.x > 2600 && r.x < 3300) : foreRecs[s4w_HERO]);
      flyG.append(got.el); if (got.tuft) vis(got.tuft, true);
      bunchHead = prop(flyG, `<g filter="url(#paper)"><circle r="9" fill="${got.col}"/><circle r="3" fill="#efae48"/></g>`);
    }
    const saw = findSaw();
    if (saw !== sawG) { sawG = saw; if (saw === bird.g) birdQ = q; if (saw === fly.g) flyQ = q; }
    fly01 = gotQ === null ? 0 : Math.min(1, (q - gotQ) / 1.0);
    const landed = fly01 >= 1, glad = landed ? s4w_bump(q - gotQ - 1, 0, .4) : 0;

    // ---- Red ----
    const front = q >= LISTEN + 3 / FPS, praise = saying === 'q-done';
    const LUA = praise ? 150 : -12 + 1.5 * breathe, LFA = praise ? 10 : -10;   // the bunch in front of her apron; up high for the praise
    let o;
    if (q < HELP) {   // shot 1: bent to the flower, picks it on "flowers", shows it, into the bunch on "Grandma"
      const PK = C(1.55), up = span(q, PK + .1, PK + .6), into = span(q, C(2.5), C(2.9));
      const tug = q < PK ? 3 * s4w_bump(q % .9, .5, .3) : 0;
      o = { turn: 1, ua: -35 * (1 - up) - 8 * up, fa: -78 * up, lean: 62 * (1 - up) + 12 * up * (1 - into), crouch: .7 * (1 - up), fua: q < C(2.9) ? -50 * (1 - up) - 95 * up + 40 * into : null,
        ffa: 10 * (1 - up) - 50 * up + tug, held: q >= PK && q < C(2.8) ? s4w_PICK.col : null, bouquet: s4w_B0 + (q >= C(2.8) ? 1 : 0),
        headR: 16 * (1 - up) - 6 * up * (1 - into) + 4 * into, shut: blinking(q, [.6, C(2.2)]) };
    } else if (!front) {   // shot 2: looks over the meadow (up to the tree top, down at the flowers), then turns round to us
      const k = Math.floor((q - LISTEN) * FPS / 2);
      o = { turn: q < LISTEN ? 1 : [1, .6, .25][Math.min(2, k)], headR: q < C(3.95) ? -12 : 10, bouquet: s4w_B0 + 1, shut: blinking(q, [C(4.2)]) };
    } else {   // facing us: breathing, a small weight shift, the bunch in her screen-left hand, the basket in the right
      const hop = praise ? -14 * Math.abs(Math.sin((q - D) * 7)) : -10 * glad - 8 * s4w_bump(q, C(4.95), .35);   // hops: as the flower lands; on "and"
      const pre = !wait;   // before the game: her head follows the butterfly's loop, nods on "touch" and "asks for"
      const headR = pre ? 3 + 6 * Math.sin(.7 * q) : 2.5 * Math.sin(q * .6) + (saying ? 3 * Math.sin(q * 4) : 0);
      o = { turn: 0, head: 'F', y: hop, rua: 8 + 2 * breathe, rfa: -6, lua: LUA, lfa: LFA,
        bouquet: s4w_B0 + 1, cape: 3 + 2 * breathe, headR, nod: pre ? 7 * s4w_bump(q, C(5.4), .5) + 7 * s4w_bump(q, C(6.3), .5) : 0,
        mouth: wait ? findMouth() : 'X', shut: !saying && (blinking(q, [C(5.8)]) || (wait && (q % 3.7) < 2 / FPS)) };
    }
    const rx = s4w_RX + (front ? 1.5 * Math.sin(q * .45) : 0), ry = hipOn(s4w_GY, s4w_S) - (front ? 1.2 * breathe : 0) + (o.y || 0);
    red.pose({ x: rx, s: s4w_S, ...o, y: ry }, f);
    // her eyes: to us while she speaks, else to the thing asked for (or the one just found), else wandering
    let dx = 0, dy = 0;
    const look = !wait ? where.get(fly.g) : saw && where.get(saw) || (!saying && FIND.target && where.get(FIND.target));
    if (front && look) { const [tx, ty] = look(), hx = s4w_RX, hy = s4w_GY - 330 * s4w_S; dx = 3.5 * Math.max(-1, Math.min(1, (tx - hx) / 160)); dy = 2.5 * Math.max(-1, Math.min(1, (ty - hy) / 160)); }
    else if (front && !saying) dx = 2.5 * Math.sin(q * .8);
    eyes.forEach(e => tf(e, `translate(${dx.toFixed(1)},${dy.toFixed(1)})`));

    // ---- the flower she picks in shot 1 ----
    pick.pose(s4w_PICK.x, s4w_GY + 2, .95, { sway: 4 * Math.sin(q * 1.6) + (q < C(1.55) ? 6 * s4w_bump(q % .9, .5, .3) : 0), on: q < C(1.55) });
    // ---- the meadow's flowers sway; the picked one flies up in an arc into her bunch, turning, and stays there
    for (const fl of flowers) if (!fl.picked && !fl.small)
      tf(fl.el, `translate(${fl.x},${fl.y}) rotate(${((fl.fore ? 1.6 : 4) * Math.sin(q * 1.2 + fl.ph)).toFixed(2)}) scale(${fl.s})`);
    flying = null;
    if (got) {
      const [hx, hy] = s4w_hand(LUA, LFA), tx = rx + (hx + 38.1) * s4w_S, ty = ry + (hy - 22) * s4w_S;   // the bunch's seventh place
      vis(got.el, !landed); vis(bunchHead, landed);
      if (!landed) {
        // the head never smaller in the air than a big flower's at half size, so a small one is seen going
        const u = ease(fly01), [x0, y0] = got.from, end = 5.6 / got.R, peak = Math.max(.35, 18 / (got.R * got.s) - 1);
        const sz = (got.s + (end - got.s) * u) * (1 + peak * Math.sin(Math.PI * fly01));
        const fx = x0 + (tx - x0) * u, fy = y0 + (ty - y0) * u - 170 * Math.sin(Math.PI * fly01);
        flying = [fx, fy];
        tf(got.el, `translate(${fx.toFixed(1)},${fy.toFixed(1)}) rotate(${(360 * fly01).toFixed(1)}) scale(${sz.toFixed(3)}) translate(0,${got.h})`);
      } else tf(bunchHead, `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${s4w_S})`);
    }
    // ---- the sky ----
    sun.pose(2600, 395, .7, q * 4);
    cloud.pose(2060 + 25 * Math.sin(q / 5), 420 + 3 * Math.sin(q / 2), 1);
    // ---- the bird on the tree top: hops, pecks, looks; found, it flaps for a moment ----
    B = s4w_birdAt(q);
    const shows = q - birdQ < 1;
    const by = 440 - B.hop - (shows ? 16 * s4w_bump(q - birdQ, 0, 1) : 0);
    bird.pose(B.x, by, .8, { peck: shows ? 0 : B.peck || 0, flap: shows ? onTwos(q) : B.flap || 0, look: B.look || 0 });
    if (B.dir < 0) tf(bird.g, `translate(${B.x.toFixed(1)},${by.toFixed(1)}) scale(-.8,.8)`);   // birdProp only faces right
    // ---- the butterfly: loops over the grass, wings on twos; found, a quick climb and back ----
    F = s4w_flyAt(q);
    fly.pose(F.x, F.y - 40 * s4w_bump(q - flyQ, 0, 1.2), 1, [1, .7, .35, .7][Math.floor(q * FPS / (q - flyQ < 1.2 ? 1 : 2)) % 4]);
  });
}
