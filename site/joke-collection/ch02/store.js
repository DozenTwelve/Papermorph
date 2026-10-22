/* store.js — episode 2's props and places (the store inside and out), thought bubbles; the series helpers are in
   ../lib/shared.js. */
'use strict';
// Painted props, held at the hand (0, 0) or stood on a surface at (0, 0) when drawn on their own.
const coffeeSVG = artSVG('coffee', -22, -50, 44, 62);       // the hundred-yen coffee: paper cup, sleeve, lid
const drinkSVG = artSVG('drink', -14, -64, 28, 92);         // Amy's bottle of green tea
const broccoliSVG = artSVG('broccoli', -40, -44, 80, 88);
// A credit card held up by its lower edge; a 100-yen coin (r 13) lying flat or held.
const cardSVG = `<g filter="url(#paper)"><rect x="-30" y="-40" width="60" height="38" rx="5" fill="#2f6fb8"/><rect x="-30" y="-32" width="60" height="7" fill="#1d1a1a"/><rect x="-22" y="-18" width="12" height="9" rx="2" fill="#e8c460"/></g>`;
const coinSVG = `<g filter="url(#paper)"><circle r="13" fill="#d8d8d2"/><circle r="10" fill="none" stroke="#a9a9a2" stroke-width="1.5"/><text y="4" font-family="Avenir Next, sans-serif" font-size="10" font-weight="700" text-anchor="middle" fill="#7a7a74">100</text></g>`;

/* ---------- the store (every scene but the last) ----------
   Seen from the customers' side. The till counter is a painted cut-out (x 760…1570, its top at y 550): the clerk
   stands behind it (only her top half shows), the customers on the floor in front of it, all facing us. Amy at the
   counter, Me queuing behind her on the left; he steps up to SHOP.meUp. Things put on the counter sit at y SHOP.top. */
const SHOP = { ground: 800, s: .9, top: 552, me: 520, meUp: 800, amy: 1060, clerk: { x: 1330, y: 720, s: .9 },
  card: 1230, coin: 1160, coffee: 957, drink: 1290 };
// the locked wide: all three and the counter
const SHOP_WIDE = { x: 900, y: 500, z: 1.12 };
// close-ups (z 2.4) on each face, and on the counter top
const CU = { clerk: { x: 1330, y: 400, z: 2.4 }, amy: { x: 1060, y: 470, z: 2.4 }, me: { x: 520, y: 470, z: 2.4 }, meUp: { x: 800, y: 470, z: 2.4 },
  coin: { x: 1150, y: 520, z: 3.2 } };
function shopSet(p, { meHolds = {}, amyHolds = {}, clerkHolds = {} } = {}) {
  const cam = paperCam(p, 'shop', {}, { after: 'counter', stages: ['wall'] });
  const clerk = clerkPuppet(cam.stageAt.wall, { holds: { drink: drinkSVG, coffee: coffeeSVG, coin: coinSVG, ...clerkHolds } });
  // things lying on the counter top (behind the customers): each a piece you show with vis() and place with tf()
  const on = {};
  for (const [k, svg] of [['drink', drinkSVG], ['coffee', coffeeSVG], ['coin', `<g transform="scale(1,.45)">${coinSVG}</g>`]]) { on[k] = prop(cam.stage, svg); vis(on[k], false); }
  const me = meAdultPuppet(cam.stage, { holds: { coffee: coffeeSVG, ...meHolds } });
  const amy = amyPuppet(cam.stage, { holds: { drink: drinkSVG, card: cardSVG, coin: coinSVG, ...amyHolds } });
  return { cam, clerk, me, amy, on };
}

/* ---------- outside the store (first and last shots) ----------
   The store front at dusk, its automatic door at x 700…900 (people come out at x 800, y 800). */
function streetSet(p) {
  const cam = paperCam(p, 'street');
  return { cam, me: meAdultPuppet(cam.stage, { holds: { coffee: coffeeSVG } }), amy: amyPuppet(cam.stage, { holds: { drink: drinkSVG } }) };
}

/* ---------- thought bubbles ----------
   A paper cloud over a head with small puffs leading down to it. bubble(parent, { key: svg … }) → pose({ x, y, s,
   show: key | null, pop }) where (x, y) is the head top it rises from and pop 0…1 grows it in (a frame or two). The
   contents are drawn centred on (0, -130) inside a cloud about 260 × 150. */
function bubble(parent, contents) {
  const g = mk('g', {}, parent);
  g.innerHTML = `<g filter="url(#paper)"><circle cx="-6" cy="-14" r="9" fill="#fbfbf6"/><circle cx="-18" cy="-40" r="14" fill="#fbfbf6"/>
    <path d="M-120,-100 C-150,-150 -100,-200 -50,-190 C-30,-226 40,-226 60,-192 C110,-204 150,-160 126,-116 C150,-76 100,-50 60,-62 C30,-36 -30,-38 -50,-62 C-100,-50 -146,-70 -120,-100 Z" fill="#fbfbf6"/></g>
    ${Object.entries(contents).map(([k, svg]) => `<g data-p="c_${k}" transform="translate(0,-130)">${svg}</g>`).join('')}`;
  bakeAll(g);
  const P = pieces(g), keys = Object.keys(contents);
  return { g, pose({ x = 0, y = 0, s = 1, show = null, pop = 1 } = {}, f = 0) {
    vis(g, !!show);
    const k = s * (.4 + .6 * Math.min(1, pop)), j = .35 * jit(f >> 1, 41);
    tf(g, `translate(${(x + j).toFixed(1)},${y.toFixed(1)}) scale(${k.toFixed(3)})`);
    for (const c of keys) vis(P['c_' + c], show === c);
  } };
}
// Words in a bubble, in the show's hand-lettered style.
const bubbleText = (text, size = 44, fill = '#1d1a1a') => `<text y="${size * .35}" font-family="Chalkboard SE, Comic Sans MS, sans-serif" font-size="${size}" font-weight="700" text-anchor="middle" fill="${fill}">${text}</text>`;

