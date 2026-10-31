/* scene4w.js — in the meadow: listen and find (lib/find.js, as Little Horse's scenes 3 and 8).
   s04w "Little Red Riding Hood wanted flowers for Grandma. Help her look! Listen, and touch what she asks for."
   Shot 1 (0 – "Help"): medium close, Red bent over one flower, picks it on "flowers", holds it up, and it goes into
   her bouquet on "Grandma". Shot 2 (cut on "Help", a little wide): she looks about the meadow in profile, turns round
   to us on "Listen", her eyes on the butterfly, while the camera eases in to the game's frame (still from D on). The game: she asks for a flower, the butterfly, the bird
   (find.js speaks; her mouth follows findMouth(), her eyes go to FIND.target while she waits, to us while she asks).
   The flower the child touches flies into her bouquet. The bird pecks and hops along the tree top, the butterfly
   loops over the grass, the sun's rays turn, the cloud drifts. Every visible thing answers a tap with its name. */
'use strict';
const PRE4W = 1.0;
let MEADOW_THINGS = [];   // filled by scene4w each time it builds; findWords (lib/find.js) reads it
sfx('scene4w', 0, 'meadow', .6);
sfx('scene4w', PRE4W + 1.55, 'rustle', .5);   // the stem snaps

const s4w_RX = 2300, s4w_GY = 795, s4w_S = .6, s4w_B0 = 5;   // Red on the grass; flowers in her bunch from scene 4 (5; 7 by scene 7)
const s4w_GAME = { x: 2430, y: 590, z: 1.65 };                // the tapping frame: cloud and flowers to tree and bird
const s4w_CLUMP = [[2105, '#d6493f', .95, 0], [2160, '#efae48', 1.05, 1.7], [2212, '#e88ab0', .9, 3.1]];   // x, colour, s, phase
const s4w_PICK = { x: s4w_RX + 30, col: '#f6efe0' };            // the one she picks in shot 1
const s4w_bump = (q, t0, d) => q < t0 || q > t0 + d ? 0 : Math.sin(Math.PI * (q - t0) / d);
// the screen-left (bouquet) hand of the front figure, in puppet units from the hip (armsF in cast.js)
const s4w_hand = (lua, lfa) => { const r = Math.PI / 180, a = lua * r, b = (lua + lfa) * r;
  return [-30 - 52 * Math.sin(a) - 48 * Math.sin(b), -126 + 52 * Math.cos(a) + 48 * Math.cos(b)]; };
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
  const cam = paperCam(p, 'meadow', { x: s4w_RX - 10, y: 668, z: 2.5 });
  cam.to({ x: s4w_RX + 10, y: 660, z: 2.75 }, 0, HELP);   // a slow push while she picks
  cam.cut({ x: 2420, y: 575, z: 1.45 }, HELP).to(s4w_GAME, LISTEN, D - LISTEN);   // in on her as she turns to us; still from D (the taps)
  const st = cam.stage;
  const sun = sunProp(st), cloud = cloudProp(st);
  const tree = mk('rect', { x: 2610, y: 450, width: 270, height: 290, fill: 'transparent' }, st);   // painted into the set
  const bird = birdProp(st), fly = butterflyProp(st);
  const red = redPuppet(st);
  const pick = flowerProp(st, s4w_PICK.col);
  const clumpG = mk('g', {}, st), clump = s4w_CLUMP.map(([, col]) => flowerProp(clumpG, col));
  const headF = red.g.querySelector('[data-p="headF"]'), eyes = [...headF.querySelectorAll('.eyeO, .eyeC')];
  const basket = red.g.querySelector('[data-p="basketF"]');
  // where each thing is in the world (for her eyes)
  let B = s4w_birdAt(0), F = s4w_flyAt(0);
  const where = new Map([[sun.g, () => [2600, 395]], [cloud.g, () => [2060, 420]], [tree, () => [2745, 560]], [bird.g, () => [B.x, 440]],
    [fly.g, () => [F.x, F.y]], [clumpG, () => flying || [2160, 770]], [basket, () => [s4w_RX + 30, 690]]]);
  MEADOW_THINGS = [{ g: clumpG, word: 'flower' }, { g: fly.g, word: 'butterfly' }, { g: bird.g, word: 'bird' },
    { g: tree, word: 'tree' }, { g: sun.g, word: 'sun' }, { g: cloud.g, word: 'cloud' }, { g: basket, word: 'basket', side: 'right' },
    { g: red.g, word: 'Red Riding Hood', clip: 'q-me', talk: true, side: 'above' }];

  // the flower the child touched is the one that flies: the last pointer down on the page, nearest flower head
  let flying = null, tap = null, gotQ = null, gotI = 1, birdQ = -1e9, flyQ = -1e9, sawG = null;
  const onTap = e => { tap = [e.clientX, e.clientY]; };
  document.addEventListener('pointerdown', onTap, true);
  P.cleanup.push(() => document.removeEventListener('pointerdown', onTap, true));
  const nearest = () => {
    if (!tap) return 1;
    let best = 1, bd = Infinity;
    clump.forEach((c, i) => { const r = c.g.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - tap[0], r.top + r.height * .3 - tap[1]); if (d < bd) { bd = d; best = i; } });
    return best;
  };

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const wait = q > D, saying = wait && FIND.saying, breathe = Math.sin(q * 2.3);
    // what find.js has just done: the flower found (it flies), the bird or the butterfly found (they show off)
    if (FIND.found === clumpG && gotQ === null) { gotQ = q; gotI = nearest(); }
    const saw = findSaw();
    if (saw !== sawG) { sawG = saw; if (saw === bird.g) birdQ = q; if (saw === fly.g) flyQ = q; }
    const fly01 = gotQ === null ? 0 : Math.min(1, (q - gotQ) / 1.0), landed = fly01 >= 1, glad = landed ? s4w_bump(q - gotQ - 1, 0, .4) : 0;

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
        bouquet: s4w_B0 + 1 + (landed ? 1 : 0), cape: 3 + 2 * breathe, headR, nod: pre ? 7 * s4w_bump(q, C(5.4), .5) + 7 * s4w_bump(q, C(6.3), .5) : 0,
        mouth: wait ? findMouth() : 'X', shut: !saying && (blinking(q, [C(5.8)]) || (wait && (q % 3.7) < 2 / FPS)) };
    }
    red.pose({ x: s4w_RX + (front ? 1.5 * Math.sin(q * .45) : 0), s: s4w_S, ...o, y: hipOn(s4w_GY, s4w_S) - (front ? 1.2 * breathe : 0) + (o.y || 0) }, f);
    // her eyes: to us while she speaks, else to the thing asked for (or the one just found), else wandering
    let dx = 0, dy = 0;
    const look = !wait ? where.get(fly.g) : saw && where.get(saw) || (!saying && FIND.target && where.get(FIND.target));
    if (front && look) { const [tx, ty] = look(), hx = s4w_RX, hy = s4w_GY - 330 * s4w_S; dx = 3.5 * Math.max(-1, Math.min(1, (tx - hx) / 160)); dy = 2.5 * Math.max(-1, Math.min(1, (ty - hy) / 160)); }
    else if (front && !saying) dx = 2.5 * Math.sin(q * .8);
    eyes.forEach(e => tf(e, `translate(${dx.toFixed(1)},${dy.toFixed(1)})`));

    // ---- the flower she picks in shot 1 ----
    pick.pose(s4w_PICK.x, s4w_GY + 2, .95, { sway: 4 * Math.sin(q * 1.6) + (q < C(1.55) ? 6 * s4w_bump(q % .9, .5, .3) : 0), on: q < C(1.55) });
    // ---- the clump to find; the found one flies up in an arc into her bunch, turning ----
    flying = null;
    s4w_CLUMP.forEach(([x, , s, ph], i) => {
      if (i === gotI && gotQ !== null && !landed) {   // (landed: hidden back home, so the clump's hit box shrinks again)
        const [hx, hy] = s4w_hand(LUA, LFA), tx = s4w_RX + hx * s4w_S, ty = hipOn(s4w_GY, s4w_S) + (hy - 46) * s4w_S;
        const u = ease(fly01), sz = s * (1 - .45 * u + .45 * Math.sin(Math.PI * fly01)), y0 = s4w_GY + 40;   // foot placed so the head lands on the bunch
        const fx = x + (tx - x) * u, fy = y0 + (ty + 70 * sz - y0) * u - 170 * Math.sin(Math.PI * fly01);
        flying = [fx, fy - 70 * sz];
        clump[i].pose(fx, fy, sz, { sway: 360 * fly01 });
      } else clump[i].pose(x, s4w_GY + 40, s, { sway: 5 * Math.sin(q * 1.3 + ph), on: !(i === gotI && landed) });
    });
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
