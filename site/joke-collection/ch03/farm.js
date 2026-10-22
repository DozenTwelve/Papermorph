/* farm.js — episode 3's cast, props and places: the American, the Chinese man, the Indian man (grown-ups built like
   the series' puppets, ../lib/cast.js), the cow (side-on, like the dog), the whip, the fishing rod and the hay, and the
   two stretches of country road. The series helpers are in ../lib/shared.js. */
'use strict';

/* ---------- the three men (pose keys as in cast.js) ----------
   Hands pressed together in prayer: armL = armR = -115 (the mittens meet under the chin; further in, the big head
   hides them). Pointing at someone on the right: armR 80…95; on the left: armL 80…95. Hands up: armL = armR = 110 (at 150 the mittens go behind the big head). */
// The American: cowboy hat, red plaid shirt, belt with a big buckle, jeans.
SHAPES.american = { ...SHAPES.aunt, sx: 66,
  body: 'M-52,-284 C-74,-270 -78,-140 -72,-96 Q-36,-84 0,-84 Q36,-84 72,-96 C78,-140 74,-270 52,-284 Z',
  extra: [-48, -20, 8, 36].map(x => `<rect x="${x}" y="-280" width="10" height="184" fill="#8e2e28" opacity=".55"/>`).join('') +
    [-246, -206, -166, -126].map(y => `<rect x="-70" y="${y}" width="140" height="9" fill="#8e2e28" opacity=".55"/>`).join('') +
    '<rect x="-74" y="-112" width="148" height="18" fill="#4a2e1a"/><rect x="-16" y="-116" width="32" height="26" rx="5" fill="#d9b24a"/>',
  hair: ['#6a4426', 'M-88,-372 C-92,-410 -60,-430 0,-430 C60,-430 92,-410 88,-372 L84,-330 Q78,-344 72,-346 L70,-390 Q0,-404 -70,-390 L-72,-346 Q-78,-344 -84,-330 Z'],
  hat: '<path d="M-150,-414 Q-160,-436 -120,-428 Q0,-404 120,-428 Q160,-436 150,-414 Q0,-380 -150,-414 Z" fill="#a0703c"/>' +
    '<path d="M-74,-420 C-80,-480 -60,-500 -30,-494 Q0,-476 30,-494 C60,-500 80,-480 74,-420 Q0,-406 -74,-420 Z" fill="#a0703c"/><path d="M-74,-430 Q0,-416 74,-430 L74,-418 Q0,-404 -74,-418 Z" fill="#5a3a20"/>' };
const americanPuppet = (p, o) => spKid(p, 'american', { coat: '#c4453a', stripe: '#c4453a', pants: '#3d5a8a', ...o });
// The Chinese man: middle-aged, black side-parted hair, a pale blue short-sleeved shirt with a pen in its pocket, dark trousers, a bit of a belly.
SHAPES.chinese = { ...SHAPES.aunt, sx: 62,
  body: 'M-48,-284 C-70,-270 -80,-150 -78,-100 Q-38,-84 0,-84 Q38,-84 78,-100 C80,-150 70,-270 48,-284 Z',
  extra: '<path d="M0,-256 V-100" stroke="#8fa9c4" stroke-width="3"/>' + [-232, -192, -152, -116].map(y => `<circle cx="6" cy="${y}" r="4" fill="#8fa9c4"/>`).join('') +
    '<rect x="-56" y="-240" width="34" height="36" rx="3" fill="none" stroke="#8fa9c4" stroke-width="3"/><rect x="-46" y="-254" width="7" height="30" rx="2" fill="#2f5aa8"/>' +
    '<rect x="-80" y="-104" width="160" height="14" fill="#2a2a2e"/>', hat: '',
  hair: ['#151313', 'M-90,-370 C-96,-432 -54,-450 -6,-450 C52,-450 96,-430 90,-370 L84,-392 Q40,-420 -18,-410 L-24,-424 Q-60,-416 -82,-392 Z'] };
const chinesePuppet = (p, o) => spKid(p, 'chinese', { skin: '#f2d2ae', coat: '#b9d0e6', stripe: '#9fb9d2', pants: '#2f3138', ...o });
// The Indian man: a moustache, wavy black hair, a long mustard kurta with a darker placket over white trousers.
SHAPES.indian = { ...SHAPES.aunt, sx: 60,
  body: 'M-46,-284 C-66,-270 -74,-120 -70,-56 Q-34,-46 0,-46 Q34,-46 70,-56 C74,-120 66,-270 46,-284 Z',
  extra: '<path d="M0,-268 V-170" stroke="#a8782a" stroke-width="10"/>' + [-250, -220, -190].map(y => `<circle cx="0" cy="${y}" r="3.5" fill="#f2e6c0"/>`).join(''), hat: '',
  hair: ['#171313', 'M-88,-366 C-96,-436 -50,-452 0,-450 C50,-452 96,-436 88,-366 Q80,-392 60,-398 Q40,-412 20,-400 Q0,-414 -20,-400 Q-40,-412 -60,-398 Q-80,-392 -88,-366 Z'] };
function indianPuppet(p, o) {
  const pup = spKid(p, 'indian', { skin: '#b57c52', coat: '#e3b25a', stripe: '#e3b25a', pants: '#f6f3ea', ...o });
  // the moustache sits on the face (it slides with the features), just above the mouth
  pup.g.querySelector('[data-p="feat"] .mouth').insertAdjacentHTML('beforebegin',
    `<path d="M-30,-328 Q-16,-340 0,-332 Q16,-340 30,-328 Q34,-318 24,-320 Q12,-326 0,-322 Q-12,-326 -24,-320 Q-34,-318 -30,-328 Z" fill="#171313"/>`);
  return pup;
}

// Where a man's mitten is in the world for a pose (side 'R' = screen-right arm, 'L' = screen-left): for things that
// leave the hand or are drawn live from it (the whip's lash, a knot being tied).
function handAt(pup, o, side = 'R') {
  const S = pup.S, s = o.s ?? 1, a = (side === 'R' ? -24 - (o.armR || 0) : 24 + (o.armL || 0)) * Math.PI / 180;
  const lx = (side === 'R' ? S.sx : -S.sx) - 72 * Math.sin(a), ly = S.sy + 72 * Math.cos(a) + (o.bob || 0);
  return [(o.x || 0) + s * lx, (o.y || 0) + s * ly];
}

/* ---------- props ---------- */
// The bundle of hay, hung from its loop at (0, 0) (painted, 384 x 800).
const haySVG = artSVG('hay', -38, -6, 77, 160);
// The coiled whip in the hand (the handle in the fist, the coil hanging below).
const whipCoilSVG = `<g filter="url(#paper)"><rect x="-6" y="-34" width="12" height="44" rx="4" fill="#4a2e1a"/><ellipse cx="4" cy="34" rx="20" ry="26" fill="none" stroke="#6a4426" stroke-width="5"/><ellipse cx="-2" cy="40" rx="15" ry="20" fill="none" stroke="#6a4426" stroke-width="4"/></g>`;
// The whip's handle alone (the lash is drawn live by whipLash).
const whipHandleSVG = `<g filter="url(#paper)"><rect x="-6" y="-46" width="12" height="52" rx="4" fill="#4a2e1a"/></g>`;
// The fishing rod carried over the shoulder: the butt and reel at the hand, the tip far up behind.
const rodHeldSVG = `<g filter="url(#paper)"><path d="M14,40 L-150,-330" stroke="#3a2a1a" stroke-width="7" stroke-linecap="round"/><path d="M-150,-330 L-190,-420" stroke="#5a4636" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="4" cy="14" r="13" fill="#9aa0a8"/><circle cx="4" cy="14" r="5" fill="#5a5f66"/></g>`;
/* The whip's lash, live: a tapering curve from the handle's tip (hx, hy). phase 0 hangs limp, 0…1 the swing over the
   head and the crack forward (the tip reaches tx, ty on 1). whipLash(parent) → pose({ hx, hy, tx, ty, phase, on }). */
function whipLash(parent) {
  // dark and thick on a pale edge, so it reads against the fence and the fields at wide-shot scale
  const edge = mk('path', { fill: 'none', stroke: '#f6efe0', 'stroke-width': 11, 'stroke-linecap': 'round', opacity: .8 }, parent);
  const path = mk('path', { fill: 'none', stroke: '#2e1c10', 'stroke-width': 7, 'stroke-linecap': 'round' }, parent);
  return { els: [edge, path], pose({ hx = 0, hy = 0, tx = hx + 160, ty = hy + 40, phase = 0, on = true, len = 1 } = {}) {
    vis(path, on); vis(edge, on); if (!on) return;
    let d;
    if (phase <= 0) { const L = len; d = `M${hx},${hy} q${22*L},${-14*L} ${30*L},${18*L} q${8*L},${56*L} ${-6*L},${104*L} q${-6*L},${24*L} ${8*L},${40*L}`; }   // hanging
    else if (phase < .6) { const u = phase / .6, bx = hx - 230 * Math.sin(u * Math.PI), by = hy - 190 - 90 * u;   // whirled up and back over the head
      d = `M${hx},${hy} Q${hx + 30},${hy - 210} ${bx},${by}`; }
    else { const u = (phase - .6) / .4, e = u ** 1.4;   // thrown forward: the tip leaves from above the hand; a wave runs down the lash and it snaps at the target
      const x0 = hx, y0 = hy - 250, X = x0 + (tx - x0) * e, Y = y0 + (ty - y0) * e, dx = X - hx, dy = Y - hy, n = Math.hypot(dx, dy) || 1,
        A = 95 * (1 - u) + 20, px = dy / n * A, py = -dx / n * A, f = k => (hx + dx * k).toFixed(1) + ',' + (hy + dy * k).toFixed(1);
      d = `M${hx},${hy} C${(hx + dx * .3 + px).toFixed(1)},${(hy + dy * .3 + py).toFixed(1)} ${(hx + dx * .7 - px * .7).toFixed(1)},${(hy + dy * .7 - py * .7).toFixed(1)} ${X.toFixed(1)},${Y.toFixed(1)}`;
      if (u >= 1) d += ' q10,-20 30,-12'; }   // the crack: the tip flicks up
    if (path._d !== d) { path.setAttribute('d', path._d = d); edge.setAttribute('d', d); }
  } };
}

/* ---------- the cow ----------
   A black-and-white cow seen side-on, built at its feet (0, 0) facing right, about 490 long (tail -190 … nose 300)
   and 350 tall at s = 1. pose(o, f): x, y, s, dir (1 faces right, -1 left), headR (degrees, + raises the head, -
   lowers it), jaw (0 shut … 1 wide open: moo; small quick values chew), tail (degrees, + swings it out behind), ear
   (degrees), shut, lids (0 … 1), eyeX (-1 looks back … 0 at the camera … 1 forward), eyeY, brow (0 none, > 0 cross),
   walk (legs scissor on twos), splay (legs thrown out, a jump), bob, lie (0 standing … 1 flat on the ground, chin
   down), rod (the fishing rod tied on its back), swing (the hay's swing on its line, degrees, + forward). */
const COW = { coat: '#f6f2ea', spot: '#2a2624', pink: '#f0a8a8', hoof: '#3a302a', horn: '#efe2c0' };
const REST_COW = { x: 0, y: 0, s: 1, dir: 1, headR: 0, jaw: 0, tail: 0, ear: 0, shut: false, lids: 0, eyeX: 1, eyeY: 0, brow: 0,
  walk: false, splay: 0, bob: 0, lie: 0, rod: false, swing: 0 };
// where the line hangs from (the rod's tip) and the hay's loop, in the cow's own frame
const COW_ROD = { tip: [372, -500], line: 200 };
function cowPuppet(parent) {
  const g = mk('g', {}, parent), id = 'cowc' + (++spClip), C = COW;
  const leg = (k, col) => `<g data-p="leg${k}"><g filter="url(#paper)"><rect x="-17" y="0" width="34" height="150" rx="10" fill="${col}"/><rect x="-18" y="128" width="36" height="22" rx="4" fill="${C.hoof}"/></g></g>`;
  const body = 'M-170,-250 C-180,-310 -100,-300 0,-300 C110,-300 170,-300 175,-240 C178,-170 140,-130 60,-128 L-120,-128 C-170,-130 -176,-190 -170,-250 Z';
  const eye = '<ellipse cx="238" cy="-308" rx="17" ry="20"';
  g.innerHTML = `<ellipse data-p="shadow" cx="40" cy="-2" rx="250" ry="20" fill="url(#spShadow)"/><g data-p="all">${leg('B2', '#ddd8ce')}${leg('F2', '#ddd8ce')}
    <g data-p="torso">
      <g data-p="tail"><g filter="url(#paper)"><path d="M0,0 Q-24,60 -14,138" fill="none" stroke="${C.coat}" stroke-width="9" stroke-linecap="round"/><path d="M-26,126 Q-14,116 -2,128 Q4,158 -12,170 Q-30,158 -26,126 Z" fill="${C.spot}"/></g></g>
      <g filter="url(#paper)"><path d="${body}" fill="${C.coat}"/></g>
      <clipPath id="${id}b"><path d="${body}"/></clipPath>
      <g clip-path="url(#${id}b)"><g filter="url(#paper)"><path d="M-120,-310 C-60,-300 -40,-240 -90,-200 C-130,-170 -170,-200 -180,-260 Z" fill="${C.spot}"/>
        <path d="M30,-305 C80,-290 70,-230 30,-220 C-10,-212 -20,-270 30,-305 Z" fill="${C.spot}"/><path d="M110,-180 C150,-190 180,-160 170,-130 L90,-128 C80,-150 90,-172 110,-180 Z" fill="${C.spot}"/></g></g>
      <g filter="url(#paper)"><path d="M-70,-132 Q-40,-96 -10,-132 Z" fill="${C.pink}"/><circle cx="-56" cy="-112" r="5" fill="${C.pink}"/><circle cx="-24" cy="-112" r="5" fill="${C.pink}"/></g>
      <g data-p="rod"><g filter="url(#paper)"><path d="M-60,-288 L${COW_ROD.tip[0]},${COW_ROD.tip[1]}" stroke="#3a2a1a" stroke-width="7" stroke-linecap="round"/>
        <path d="M-74,-304 Q-60,-210 -76,-130 M-50,-304 Q-36,-210 -52,-130" stroke="#b08a50" stroke-width="7" fill="none"/><circle cx="-40" cy="-300" r="12" fill="#9aa0a8"/></g></g>
      <g data-p="head">
        <g filter="url(#paper)"><path d="M140,-296 C170,-330 205,-345 222,-330 L236,-246 C222,-226 196,-214 168,-210 C150,-208 140,-222 140,-240 Z" fill="${C.coat}"/>
          <path d="M224,-362 Q212,-388 222,-398 Q228,-374 242,-358 Z" fill="#d6c79e"/>
          <path d="M210,-360 Q196,-386 206,-396 Q212,-372 228,-354 Z" fill="${C.horn}"/>
          <path d="M200,-322 C196,-356 226,-376 258,-372 C282,-368 292,-348 294,-322 L300,-262 C298,-238 268,-228 240,-232 C216,-236 204,-262 202,-290 Z" fill="${C.coat}"/>
          <path d="M228,-352 C246,-366 264,-360 270,-344 C262,-326 238,-326 228,-352 Z" fill="${C.spot}"/></g>
        <g data-p="jaw"><g filter="url(#paper)"><path d="M232,-226 Q262,-214 300,-222 Q296,-198 264,-196 Q238,-200 232,-226 Z" fill="${C.pink}"/></g>
          <path d="M248,-212 Q268,-206 288,-212" stroke="#c87070" stroke-width="3" fill="none"/></g>
        <g filter="url(#paper)"><ellipse cx="282" cy="-244" rx="40" ry="30" fill="${C.pink}"/></g>
        <ellipse cx="300" cy="-250" rx="5" ry="7" fill="#9a4a4a"/>
        <clipPath id="${id}">${eye}/></clipPath>
        <g data-p="whites" filter="url(#paper)">${eye} fill="#fff"/></g>
        <circle data-p="pupil" cx="238" cy="-308" r="7" fill="${SP_INK}"/>
        <g clip-path="url(#${id})"><g data-p="lids"><rect x="216" y="-360" width="44" height="32" fill="${C.coat}"/><path d="M216,-328 H260" stroke="${SP_INK}" stroke-width="3"/></g></g>
        ${eye} fill="none" stroke="${SP_INK}" stroke-width="2.4"/>
        <path data-p="brow" d="M220,-340 L256,-330" stroke="${SP_INK}" stroke-width="4.5" stroke-linecap="round"/>
        <g data-p="ear"><g filter="url(#paper)"><path d="M0,0 C-30,-6 -60,4 -64,20 C-40,26 -14,18 0,8 Z" fill="${C.coat}"/><path d="M-8,4 C-30,2 -48,10 -52,18 C-34,20 -18,14 -8,8 Z" fill="${C.pink}"/></g></g>
      </g></g>${leg('B1', C.coat)}${leg('F1', C.coat)}
    <g data-p="line"><path d="M0,0 V${COW_ROD.line}" stroke="#3a3430" stroke-width="2"/><g transform="translate(0,${COW_ROD.line})">${haySVG}</g></g></g>`;
  bakeAll(g);
  const P = pieces(g);
  return { g, pose(o, f) {
    o = { ...REST_COW, ...o };
    const j = k => .35 * jit(f >> 1, k), k2 = Math.floor(o.gait ?? f / 2) % 2 ? 1 : -1, L = Math.max(0, Math.min(1, o.lie));
    tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + j(2) * .6).toFixed(1)}) scale(${(o.s * o.dir).toFixed(3)},${o.s})`);
    // lying: the legs fold under (shorter, splayed a little), the body sinks onto the ground, the chin goes down
    tf(P.all, `translate(0,${(o.bob + 118 * L).toFixed(1)})`);
    vis(P.shadow, true);
    const sw = o.walk ? 14 * k2 * Number(o.walk) : 0, fold = 1 - .82 * L;
    const legT = (x, a) => `translate(${x},-150) rotate(${(a + j(4 + x % 7) * .5).toFixed(2)}) scale(1,${fold.toFixed(3)})`;
    tf(P.legB1, legT(-120, sw + o.splay)); tf(P.legB2, legT(-96, -sw + o.splay * .6));
    tf(P.legF1, legT(120, -sw - o.splay)); tf(P.legF2, legT(144, sw - o.splay * .6));
    tf(P.torso, `rotate(${(j(3) * .3).toFixed(2)},0,-200)`);
    tf(P.tail, `translate(-166,-262) rotate(${(o.tail + j(8)).toFixed(2)})`);
    tf(P.head, `rotate(${(-o.headR + 16 * L + j(9) * .6).toFixed(2)},160,-250)`);
    tf(P.jaw, `rotate(${(o.jaw * 26).toFixed(1)},236,-224)`);
    tf(P.ear, `translate(214,-322) rotate(${(o.ear + j(10) * 2).toFixed(2)})`);
    tf(P.pupil, `translate(${(o.eyeX * 7).toFixed(1)},${(o.eyeY * 7).toFixed(1)})`);
    tf(P.lids, `translate(0,${((o.shut ? 1 : o.lids) * 32).toFixed(1)})`);
    vis(P.brow, o.brow !== 0); tf(P.brow, `rotate(${(14 * o.brow).toFixed(1)},238,-335)`);
    vis(P.rod, o.rod); vis(P.line, o.rod);
    // the hay hangs from the rod's tip and swings; it rides the torso's sink when the cow lies down
    tf(P.line, `translate(${COW_ROD.tip[0]},${COW_ROD.tip[1]}) rotate(${(-o.swing + j(11)).toFixed(2)})`);
  } };
}

/* ---------- the country road (scenes 1–3) and further along it (scene 4) ----------
   Everyone stands on y 800. On the road the cow stands mid-road facing right (x 1040, s .92: tail at ~865, nose at
   ~1320); the three men stand left of it facing us: the American at 300, the Chinese man at 500, the Indian man at 700. */
const FARM = { ground: 800, s: .9, am: 300, cn: 500, ind: 700, cow: { x: 1040, y: 790, s: .92 } };
// the locked wide: all four
const FARM_WIDE = { x: 800, y: 520, z: 1.05 };
// close-ups on each face (z 2.4) and on the cow's head
const FCU = { am: { x: 300, y: 470, z: 2.4 }, cn: { x: 500, y: 470, z: 2.4 }, ind: { x: 700, y: 470, z: 2.4 }, cow: { x: 1200, y: 560, z: 2.4 } };
// roadSet(p, set) → { cam, cow, am, cn, ind, lash }: the cow first (the men pass in front of it), the lash last.
function roadSet(p, set = 'road', { amHolds = {}, cnHolds = {} } = {}) {
  const cam = paperCam(p, set);
  const cow = cowPuppet(cam.stage);
  const am = americanPuppet(cam.stage, { holds: { coil: whipCoilSVG, whip: whipHandleSVG, ...amHolds } });
  const lash = whipLash(cam.stage);   // right above the American, below whoever stands in front of him
  const cn = chinesePuppet(cam.stage, { holds: { rod: rodHeldSVG, hay: haySVG, ...cnHolds } });
  const ind = indianPuppet(cam.stage);
  return { cam, cow, am, cn, ind, lash };
}

// The title card at the end: black, a torn paper strip with the title, the series line under it.
function titleCard(p) {
  const card = mk('g', {}, p);
  card.innerHTML = `<rect width="1600" height="900" fill="#0d0b0a"/>
    <g filter="url(#paper)"><path d="M180,330 L260,318 L420,334 L600,316 L800,332 L1000,317 L1200,333 L1380,318 L1430,330 L1420,430 L1370,444 L1180,428 L1000,444 L800,430 L600,446 L400,430 L240,446 L176,432 Z" fill="#f3ead6"/></g>
    <text x="800" y="418" font-family="Chalkboard SE, Avenir Next Heavy, sans-serif" font-size="92" font-weight="800" text-anchor="middle" fill="#1d1a1a">How to Move a Cow</text>
    <text x="800" y="510" font-family="Avenir Next, sans-serif" font-size="38" letter-spacing="4" text-anchor="middle" fill="#cfc6b4">Joke Collection · Episode 3</text>`;
  bakeAll(card);
  return card;
}
