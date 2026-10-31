/* scene11.js — cake. */
'use strict';
const PRE11 = .8;
function scene11(p, D) {
  const C = (c, t) => clipAt('scene11', PRE11, c, t);
  const cam = paperCam(p, 'room', { x: 2475, y: 590, z: 1.75 }), st = cam.stage;
  const gran = grandmaPuppet(st), red = redPuppet(st), wood = woodcutterPuppet(st);
  prop(st, `<g filter="url(#paper)"><path d="M2262,636 L2698,636 L2712,800 L2248,800 Z" fill="#f6efe0"/><path d="M2256,700 L2704,700" stroke="#c8322f" stroke-width="10" stroke-dasharray="14 10"/></g>
    <g filter="url(#paper)"><ellipse cx="2405" cy="630" rx="42" ry="11" fill="#b5853c"/><rect x="2363" y="610" width="84" height="20" fill="#d9a85a"/><ellipse cx="2405" cy="610" rx="42" ry="11" fill="#f6efe0"/>
      <path d="M2405,610 L2447,610 L2442,620 Z" fill="#c8322f"/></g>
    <g filter="url(#paper)"><path d="M2556,632 L2560,580 Q2576,566 2592,580 L2596,632 Z" fill="#3f5f8a"/><path d="M2594,590 q16,4 6,24" stroke="#3f5f8a" stroke-width="6" fill="none"/></g>
    <g filter="url(#paper)"><rect x="2348" y="616" width="18" height="20" fill="#f6e7b8"/><rect x="2606" y="616" width="18" height="20" fill="#f6e7b8"/><rect x="2516" y="616" width="16" height="20" fill="#f6e7b8"/></g>`);
  const warm = mk('rect', { width: 1600, height: 900, fill: '#ffb050', opacity: .1 }, p), wipe = trunkWipe(p, 0, .8, 'out');
  const shut = iris(p, C('s11c', 1.0), 1.2, 805, 445), card = endCard(p, C('s11c', 2.3));
  // 11.1 the three at the table; 11.2 Red close, to us; 11.3 back out, and the iris closes on her
  cam.cut({ x: 2480, y: 535, z: 3.4 }, C('s11b', -.05)).soft(C('s11b', -.05), true).cut({ x: 2475, y: 560, z: 1.5 }, C('s11c', -.05)).soft(C('s11c', -.05), false).to({ x: 2480, y: 520, z: 1.9 }, C('s11c', .1), 2.4);
  stopClock(D, (q, f) => {
    cam.apply(q, f); wipe(q); shut(q); card(q);
    const eat = between(q, C('s11', .5), C('s11', 1.2)) || between(q, C('s11', 1.6), C('s11', 2.4));
    gran.pose({ x: 2330, y: 655, s: .55, cap: true, glasses: true, ua: eat ? -60 : 6, fa: eat ? -110 : -6, blush: span(q, C('s11', 3), C('s11', 4.2)), shut: blinking(q, [C('s11', 1.0), C('s11b', 3)]) }, f);
    red.pose({ x: 2482, y: 660, s: .6, head: 'F', basket: false, mouth: lips(q, 'scene11', PRE11, 's11b'), shut: blinking(q, [C('s11', 2.6), C('s11b', 5.6)]) || between(q, C('s11b', 5.0), C('s11b', 5.0) + 3 / FPS) }, f);
    wood.pose({ x: 2640, y: 668, s: .62, turn: -1, axe: false, mouth: between(q, C('s11', 3.0), C('s11', 4.6)) ? (onTwos(q) > 0 ? 'D' : 'C') : 'X', shut: blinking(q, [C('s11', 1.8), C('s11b', 4)]) }, f);
  });
}
