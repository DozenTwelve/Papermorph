/* scene11.js — cake, juice, the moral and a wink. */
'use strict';
const PRE11 = 1.4;   // the trunk wipe uncovers the warm table, and the wide holds a moment
// Grandma's near (profile) hand in the world, from her pose: the arm hangs from (16, -134), 50 to the elbow, 54 to the hand.
function s11_hand(o) {
  const r = Math.PI / 180, a = o.ua * r, b = (o.ua + o.fa) * r, L = (o.lean || 0) * r;
  const hx = 16 - 50 * Math.sin(a) - 54 * Math.sin(b), hy = -134 + 50 * Math.cos(a) + 54 * Math.cos(b);
  return [o.x + o.s * (hx * Math.cos(L) - hy * Math.sin(L)), o.y + (o.hop || 0) + o.s * (hx * Math.sin(L) + hy * Math.cos(L))];
}
// Eased keys [[t, {k: v}], …]: each key holds until the next one, which it eases into over `over` s.
function s11_keys(q, keys, over = .25) {
  let o = { ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) {
    const [t, v] = keys[i]; if (q < t - over) break;
    const u = span(q, t - over, t); for (const k in v) o[k] = (o[k] ?? 0) + (v[k] - (o[k] ?? 0)) * u;
  }
  return o;
}
function scene11(p, D) {
  const C = (c, t) => clipAt('scene11', PRE11, c, t);
  const cam = paperCam(p, 'room', { x: 2475, y: 590, z: 1.75 }), st = cam.stage;
  const gran = grandmaPuppet(st), red = redPuppet(st), wood = woodcutterPuppet(st);
  // Red's close-up for the moral and the wink: the same wall and shelf behind her, soft; the same table in front of her,
  // seen from close (the wide's table scaled about her, so the cake, the bottle and the flowers sit where they did)
  const cu = paperCam(p, 'room', { x: 2530, y: 470, z: 1.3 }).soft(0, 'all'), redCU = redPuppet(cu.stage);
  const CU_S = 2.5, CU_Y = 876, CU_K = CU_S / .6, cuTable = mk('g', { transform: `translate(${2482 * (1 - CU_K)},${CU_Y - 660 * CU_K}) scale(${CU_K})` }, cu.stage);
  // the table: cloth, the cake with a slice gone, Grandma's plate and glass, the juice bottle, the bouquet in a jug, cups
  const TABLE = `<g filter="url(#paper)"><path d="M2262,636 L2698,636 L2712,800 L2248,800 Z" fill="#f6efe0"/><path d="M2256,700 L2704,700" stroke="#c8322f" stroke-width="10" stroke-dasharray="14 10"/></g>
    <g filter="url(#paper)"><ellipse cx="2452" cy="632" rx="40" ry="10" fill="#b5853c"/><rect x="2412" y="612" width="80" height="20" fill="#d9a85a"/><ellipse cx="2452" cy="612" rx="40" ry="10" fill="#f6efe0"/>
      <path d="M2452,612 L2492,612 L2487,622 Z" fill="#c8322f"/></g>
    <g filter="url(#paper)"><ellipse cx="2388" cy="634" rx="22" ry="5" fill="#e8dcc6"/></g>
    <g filter="url(#paper)"><rect x="2560" y="578" width="30" height="56" rx="7" fill="#e9a43a"/><rect x="2567" y="560" width="16" height="22" rx="4" fill="#e9a43a"/>
      <rect x="2565" y="552" width="20" height="10" rx="3" fill="#c8322f"/><rect x="2563" y="596" width="24" height="18" fill="#f6efe0"/><circle cx="2575" cy="605" r="6" fill="#d6493f"/></g>
    <g filter="url(#paper)"><path d="M2606,634 L2610,604 L2636,604 L2640,634 Z" fill="#3f5f8a"/>
      <path d="M2623,604 l-10,-34 M2623,604 l0,-40 M2623,604 l10,-34" stroke="#4f7a34" stroke-width="3"/>
      <circle cx="2613" cy="568" r="8" fill="#d6493f"/><circle cx="2623" cy="561" r="8" fill="#f6efe0"/><circle cx="2633" cy="568" r="8" fill="#e88ab0"/>
      <circle cx="2613" cy="568" r="2.6" fill="#efae48"/><circle cx="2623" cy="561" r="2.6" fill="#efae48"/><circle cx="2633" cy="568" r="2.6" fill="#efae48"/></g>
    <g filter="url(#paper)"><rect x="2516" y="616" width="16" height="20" fill="#f6e7b8"/><rect x="2668" y="616" width="18" height="20" fill="#f6e7b8"/></g>`;
  prop(st, TABLE);
  cu.stage.insertBefore(mk('rect', { x: 1800, y: CU_Y - 24 * CU_K + 8, width: 1500, height: 300, fill: '#f6efe0', filter: 'url(#paper)' }, cu.stage), cuTable);   // the cloth, edge to edge
  prop(cuTable, TABLE);
  // what Grandma lifts: the slice of cake and her glass of apple juice (drawn round the hand that holds them)
  const SLICE = '<g filter="url(#paper)"><path d="M-16,8 L16,8 L16,-4 L-16,-10 Z" fill="#d9a85a"/><path d="M-16,-10 L16,-4 L16,-8 L-16,-15 Z" fill="#f6efe0"/><path d="M14,-8 l4,4 l-6,1 Z" fill="#c8322f"/></g>', slice = prop(st, SLICE);
  const glass = mk('g', {}, st), juice = mk('rect', { x: -8, y: -12, width: 16, height: 22, fill: '#e9a43a' }, glass);
  prop(glass, '<path d="M-10,-24 L10,-24 L8,12 L-8,12 Z" fill="#ffffff" fill-opacity=".35" stroke="#ffffff" stroke-width="2.5"/>');
  // her slice (bitten) and her glass (mostly drunk), put down, in the close-up's table
  prop(cuTable, SLICE).setAttribute('transform', `translate(${s11_hand({ x: 2330, y: 655, s: .55, ua: -40, fa: -25, lean: 10 })[0].toFixed(1)},628) scale(.7,1)`);
  prop(cuTable, `<g transform="translate(${s11_hand({ x: 2330, y: 655, s: .55, ua: -28, fa: -38, lean: 10 })[0].toFixed(1)},622)"><rect x="-8" y="3.4" width="16" height="6.6" fill="#e9a43a"/><path d="M-10,-24 L10,-24 L8,12 L-8,12 Z" fill="#ffffff" fill-opacity=".35" stroke="#ffffff" stroke-width="2.5"/></g>`);
  const warm = mk('rect', { width: 1600, height: 900, fill: '#ffb050', opacity: .1 }, p), wipe = trunkWipe(p, 0, .8, 'out');
  // 11.1 the three at the table; 11.2 medium on Grandma: cake, juice, and she comes back to life (push in on "better");
  // 11.3 Red's close-up (the cu camera), to us: the moral, a nod on "stay on the path", a head shake on "never", and the
  // wink on the chime; 11.4 back out to the table, the iris closes on Red, The End
  cam.cut({ x: 2372, y: 585, z: 3.1 }, C('s11', .3)).to({ x: 2370, y: 568, z: 3.4 }, C('s11', 2.9), 2.2)
    .cut({ x: 2475, y: 568, z: 2.0 }, C('s11c', -.08)).soft(C('s11c', -.08), false).to({ x: 2480, y: 560, z: 1.55 }, C('s11c', .05), 2.4);
  const CU0 = C('s11b', -.08), CU1 = C('s11c', -.08);
  cu.to({ x: 2522, y: 462, z: 1.42 }, CU0 + .3, CU1 - CU0 - .6);   // a slow push in through the promise to the wink
  const IRIS = C('s11c', 2.0), v = cam.at(IRIS);
  const shut = iris(p, C('s11c', .8), 1.2, 800 + (2482 - v.x) * v.z, 450 + (548 - v.y) * v.z), card = endCard(p, C('s11c', 2.3));
  // Grandma's arm, step by step (clip s11): reach the slice, bite, put it down; reach the glass, drink, put it down
  const DOWN = { ua: 6, fa: -6 }, REACH = { ua: -40, fa: -25 }, MOUTH = { ua: -60, fa: -110 }, DRINK = { ua: -50, fa: -100 }, REACH2 = { ua: -28, fa: -38 };
  const ARM = [[0, DOWN], [C('s11', .55), REACH], [C('s11', .85), MOUTH], [C('s11', 1.45), MOUTH], [C('s11', 1.65), REACH], [C('s11', 1.8), DOWN],
    [C('s11', 1.95), REACH2], [C('s11', 2.2), DRINK], [C('s11', 2.75), DRINK], [C('s11', 2.95), REACH2], [C('s11', 3.1), DOWN],
    [C('better11', .2), { ua: -90, fa: -60 }], [C('better11', .5), { ua: -92, fa: -25 }], [C('better11', .8), { ua: -90, fa: -65 }], [C('better11', 1.1), { ua: -92, fa: -25 }], [C('better11', 1.4), { ua: -90, fa: -60 }], [C('s11b', .1), DOWN]];
  const reach1 = s11_hand({ x: 2330, y: 655, s: .55, ...REACH, lean: 10 }), reach2 = s11_hand({ x: 2330, y: 655, s: .55, ...REACH2, lean: 10 });

  sfx('scene11', 0, 'room', .4, { loop: true });   // a bed: it repeats to the end of the scene
  sfx('scene11', C('better11', .2), 'pop', 1.2); sfx('scene11', C('better11', .2), 'hop', 1.4); sfx('scene11', C('wink11', .25), 'chime', .8);

  stopClock(D, (q, f) => {
    const onCU = between(q, CU0, CU1); vis(cam.root, !onCU); vis(cu.root, onCU);
    if (onCU) cu.apply(q, f); else cam.apply(q, f);
    wipe(q); shut(q); card(q);
    const close = between(q, C('s11b', -.08), C('s11c', -.08)), front = q >= C('s11b', -.08), better = span(q, C('s11', 3.0), C('s11', 4.6));
    const lift = between(q, C('better11', 0), C('better11', 1.5)), bounce = lift ? -18 * Math.abs(Math.sin(Math.PI * (q - C('better11', 0)) / .5)) : 0;
    // Grandma: poorly at first (bent, head low), then the cake and juice, then pink cheeks, upright, a hop and a cheer
    const arm = s11_keys(q, ARM, .22);
    const g = { x: 2330, y: 655, s: .55, ...arm, lean: 4 + 6 * (1 - better), hop: bounce, headR: 7 - 12 * better + (lift ? -6 : 0), nod: 4 * (1 - better) };
    const chewing = between(q, C('s11', .9), C('s11', 1.5)), drinking = between(q, C('s11', 2.2), C('s11', 2.75));
    gran.pose({ ...g, cap: true, glasses: true, blush: better, head: front ? 'F' : 'P', turn: 1,
      mouth: chewing ? (onTwos(q) > 0 ? 'B' : 'X') : drinking ? 'F' : lift ? 'D' : 'X',
      shut: blinking(q, [C('s11', 1.9), C('s11', 4.0), C('s11b', 1.2), C('s11b', 3.8)]) || (q < C('s11', .3) && onTwos(q) > 0 && q > .9) || chewing && q < C('s11', 1.2) }, f);
    const hand = s11_hand(g);
    // the slice: on the plate, then in her hand from the reach to the put-down; a bite out of it after the first chew
    const holdS = between(q, C('s11', .55), C('s11', 1.65)), bitten = q > C('s11', 1.05);
    const [sx, sy] = holdS ? hand : [reach1[0], 628];
    tf(slice, `translate(${sx.toFixed(1)},${(sy - (holdS ? 6 : 0)).toFixed(1)}) scale(${bitten ? .7 : 1},1)`);
    // the glass: on the table, in her hand, tipped to her mouth while she drinks; the juice goes down
    const holdG = between(q, C('s11', 1.95), C('s11', 2.95)), tip = drinking ? -40 * span(q, C('s11', 2.2), C('s11', 2.35)) : 0;
    const [gx, gy] = holdG ? hand : [reach2[0], 622];
    tf(glass, `translate(${gx.toFixed(1)},${(gy - (holdG ? 8 : 0)).toFixed(1)}) rotate(${tip.toFixed(1)})`);
    const level = 1 - .7 * span(q, C('s11', 2.3), C('s11', 2.7));
    juice.setAttribute('y', (10 - 22 * level).toFixed(1)); juice.setAttribute('height', (22 * level).toFixed(1));
    // Red: watching Grandma (profile, facing her), glad on "better"; on the cut, the moral to us and the wink
    const rWink = between(q, C('wink11', .25), C('wink11', .85));
    red.pose({ x: 2482, y: 660, s: .6, turn: front ? 1 : -1, head: front ? 'F' : 'P', basket: false, hop: lift ? .7 * bounce : 0,
      headR: front ? (rWink ? 7 : 2 * Math.sin(q * 1.3)) : -4 + 4 * better, nod: close && between(q, C('s11b', 1.6), C('s11b', 2.1)) ? 4 : 0,
      wink: rWink,
      mouth: lips(q, 'scene11', PRE11, 's11b') !== 'X' ? lips(q, 'scene11', PRE11, 's11b') : lift ? 'D' : 'X',
      shut: !rWink && (blinking(q, [C('s11', 2.6), C('s11b', 2.3), C('s11c', .6)]) || between(q, C('better11', .1), C('better11', .5))) }, f);
    // Red's close-up: the promise to us; a nod on "stay on the path", a shake of the head on "never chat with wolves", the wink
    if (onCU) {
      const nod = 5 * Math.sin(Math.PI * span(q, C('s11b', 1.26), C('s11b', 1.7))), sh = C('s11b', 2.82), shake = between(q, sh, sh + .9) ? 9 * Math.sin(2 * Math.PI * (q - sh) / .45) : 0;
      const m = lips(q, 'scene11', PRE11, 's11b');
      redCU.pose({ x: 2482, y: CU_Y + 2.5 * Math.sin(q * 2.2), s: CU_S, head: 'F', basket: false, nod: nod + (rWink ? 3 : 0), headR: shake + (rWink ? 8 * span(q, C('wink11', .15), C('wink11', .3)) : 1.5 * Math.sin(q * 1.3)),
        wink: rWink, mouth: m, brow: between(q, sh, sh + .9) ? .5 : 0, rua: 6, rfa: -4, lua: -6, lfa: 4,
        shut: !rWink && blinking(q, [C('s11b', .9), C('s11b', 2.3), C('wink11', 1.0)]) }, f);
    }
    // the woodcutter: listens to Grandma, laughs and cheers with her, nods along with Red's promise
    wood.pose({ x: 2670, y: 668, s: .62, turn: -1, axe: false, ua: lift ? -150 : 6, fa: lift ? -40 : -6, headR: lift ? -10 : 0,
      nod: close && between(q, C('s11b', 3.0), C('s11b', 3.5)) ? 5 : 0,
      mouth: lift ? (onTwos(q) > 0 ? 'D' : 'C') : 'X', shut: blinking(q, [C('s11', 1.8), C('s11b', .6), C('s11b', 4)]) }, f);
  });
}
