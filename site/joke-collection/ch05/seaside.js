/* seaside.js — episode 5's cast, props and places: the man (flat cap, V-neck jumper and tie), the policeman (an
   English bobby: tall helmet, moustache), the penguin (front-facing, waddles; balloon, zoo sticker, rubber ring and
   sunglasses for day two), the fish parcel, bucket, chips, the zoo poster and the zoo photo; the harbour, the town
   street and the beach, each built by one function so every shot of a place stages it identically. The series
   helpers are in ../lib/shared.js, the puppets' base in ../lib/cast.js. */
'use strict';

/* ---------- the two grown-ups (pose keys as in cast.js; built like the aunt: ~446 px tall at s 1, used at s .9) ----------
   Hands behind the back: armL = armR = -20. Pointing to the screen-right: armR 80…95. Waving: armR 120…150 swinging.
   brow < 0 is cross, > 0 worried/raised (cast.js). */
// The man: a brown tweed flat cap over ginger hair, a green V-neck jumper over a white shirt and a red tie, brown trousers.
SHAPES.pman = { ...SHAPES.aunt, sx: 64,
  body: 'M-50,-284 C-74,-270 -82,-150 -78,-100 Q-38,-88 0,-88 Q38,-88 78,-100 C82,-150 74,-270 50,-284 Z',
  extra: '<path d="M-20,-283 L0,-256 L20,-283 Z" fill="#f6f3ea"/><path d="M-5,-262 L5,-262 L8,-232 L0,-224 L-8,-232 Z" fill="#b23a2e"/>' +
    '<rect x="-78" y="-112" width="156" height="18" fill="#3f6a3c"/>' + [-60, -40, -20, 0, 20, 40, 60].map(x => `<path d="M${x},-112 v18" stroke="#2f5230" stroke-width="3"/>`).join(''),
  hair: ['#b8642e', 'M-88,-372 C-92,-410 -60,-430 0,-430 C60,-430 92,-410 88,-372 L84,-330 Q78,-344 72,-346 L70,-390 Q0,-404 -70,-390 L-72,-346 Q-78,-344 -84,-330 Z'],
  hat: '<path d="M-94,-410 C-100,-464 -52,-480 0,-480 C52,-480 100,-464 94,-410 Q0,-426 -94,-410 Z" fill="#8a7458"/>' +
    [[-50, -458], [-10, -466], [30, -456], [-30, -440], [10, -444], [52, -440]].map(([x, y]) => `<path d="M${x},${y} l10,3" stroke="#6a5840" stroke-width="3"/>`).join('') +
    '<path d="M-100,-412 Q0,-432 100,-412 L96,-400 Q0,-418 -96,-400 Z" fill="#5f4e3a"/>' };
// A blink shows a closed lid: the lid covers the eye and a curved lash line sits where it was (a lid that stops short
// left blank skin ovals). Wraps pose: `shut` becomes lids 1 plus the lash line.
function closedEyes(pup) {
  const [ex, ey, erx, ery] = pup.S.eyes, feat = pup.g.querySelector('[data-p="feat"]');
  const line = mk('g', {}, feat); line.innerHTML = [-1, 1].map(s => `<path d="M${s * ex - erx},${ey - ery * .1} Q${s * ex},${ey + ery * .75} ${s * ex + erx},${ey - ery * .1}" fill="none" stroke="${SP_INK}" stroke-width="4" stroke-linecap="round"/>`).join('');
  const base = pup.pose;
  pup.pose = (o, f) => { base(o.shut ? { ...o, shut: false, lids: 1 } : o, f); vis(line, !!o.shut); };
  return pup;
}
const manPuppet = (p, o) => closedEyes(spKid(p, 'pman', { skin: '#f4d2b4', coat: '#4f7d4a', stripe: '#3f6a3c', pants: '#7a5a3c', ...o }));
// The policeman: a tall dark-blue custodian helmet with a silver star, a high-collared tunic with silver buttons and a
// whistle chain, a belt, a big brown moustache.
SHAPES.cop = { ...SHAPES.aunt, sx: 64,
  body: 'M-52,-284 C-72,-270 -76,-130 -72,-80 Q-36,-70 0,-70 Q36,-70 72,-80 C76,-130 72,-270 52,-284 Z',
  extra: '<rect x="-34" y="-292" width="68" height="18" rx="5" fill="#1a2440"/>' + [-250, -215, -180, -110].map(y => `<circle cx="0" cy="${y}" r="5" fill="#cfd6de"/>`).join('') +
    '<path d="M0,-215 Q-22,-196 -42,-232" stroke="#cfd6de" stroke-width="3" fill="none"/><rect x="-58" y="-244" width="34" height="8" fill="#1a2440"/><rect x="24" y="-244" width="34" height="8" fill="#1a2440"/>' +
    '<rect x="-74" y="-156" width="148" height="16" fill="#141a28"/><rect x="-12" y="-158" width="24" height="20" rx="3" fill="#cfd6de"/>',
  hair: ['#5a3a24', 'M-88,-372 L-84,-330 Q-78,-344 -72,-346 L-70,-392 Q-82,-394 -88,-372 Z M88,-372 L84,-330 Q78,-344 72,-346 L70,-392 Q82,-394 88,-372 Z'],
  hat: '<path d="M-86,-414 C-92,-490 -62,-566 0,-572 C62,-566 92,-490 86,-414 Q0,-426 -86,-414 Z" fill="#1e2a44"/>' +
    '<path d="M-92,-418 Q0,-432 92,-418 L90,-404 Q0,-418 -90,-404 Z" fill="#141c30"/><circle cx="0" cy="-572" r="10" fill="#cfd6de"/>' +
    '<path d="M0,-498 l8,16 l18,2 l-13,12 l4,18 l-17,-9 l-17,9 l4,-18 l-13,-12 l18,-2 Z" fill="#d8dde4"/>' };
// eat (0…1) lifts his screen-right hand from wherever armR puts it to his mouth: .5 holds a chip at his chest ("halfway"),
// .8 at his chin, 1 in his mouth (chew with mouth 'chew'/'A' on twos). From .7 on the mitten and its chip are drawn in
// front of his face (an arm raised that far goes behind the big head). Give hold: 'chip' to show the chip below .7.
const COP_EAT = -152;   // armR at eat 1
function copPuppet(p, o) {
  const pup = closedEyes(spKid(p, 'cop', { skin: '#f2cfae', coat: '#22304f', stripe: '#22304f', pants: '#1c2236', ...o }));
  // the moustache sits on the face (it slides with the features), just above the mouth
  pup.g.querySelector('[data-p="feat"] .mouth').insertAdjacentHTML('beforebegin',
    '<path d="M-42,-322 Q-30,-344 -8,-334 Q0,-340 8,-334 Q30,-344 42,-322 Q46,-312 34,-316 Q16,-322 0,-318 Q-16,-322 -34,-316 Q-46,-312 -42,-322 Z" fill="#6a4228"/>');
  const all = pup.g.querySelector('[data-p="all"]'), hand = mk('g', {}, all);
  hand.innerHTML = `<g transform="translate(-6,-16)">${chipSVG}</g><g filter="url(#paper)"><circle r="18" fill="#f2efe6"/><ellipse cx="14" cy="-10" rx="7" ry="10" fill="#f2efe6"/></g>`;
  bakeAll(hand);
  const base = pup.pose, S = pup.S;
  pup.pose = (o, f) => {
    const e = Math.max(0, Math.min(1, o.eat || 0)), armR = e ? (o.armR || 0) * (1 - e) + COP_EAT * e : o.armR;
    base(e ? { ...o, armR, hold: e >= .7 ? null : o.hold } : o, f);
    vis(hand, e >= .7);
    if (e >= .7) { const a = (-24 - armR) * Math.PI / 180; tf(hand, `translate(${(S.sx - 72 * Math.sin(a)).toFixed(1)},${(S.sy + 72 * Math.cos(a)).toFixed(1)})`); }
  };
  return pup;
}

// Where a grown-up's mitten is in the world for a pose (side 'R' = screen-right arm, 'L' = screen-left): for a hand
// that meets something (the penguin's flipper, the photo).
function handAt(pup, o, side = 'R') {
  const S = pup.S, s = o.s ?? 1, a = (side === 'R' ? -24 - (o.armR || 0) : 24 + (o.armL || 0)) * Math.PI / 180;
  const lx = (side === 'R' ? S.sx : -S.sx) - 72 * Math.sin(a), ly = S.sy + 72 * Math.cos(a) + (o.bob || 0);
  return [(o.x || 0) + s * lx, (o.y || 0) + s * ly];
}

// A visible hand-to-hand pass for the man (the fish from his screen-left hand to his screen-right one, or back): u 0…1
// over ~0.6 s. Both mittens swing in to meet in front of his belly (arms -62), the prop changes hands there at u .5,
// and they swing back to their rest angles. Spread the result into his pose: { ...pose, ...manPass(u) }.
function manPass(u, key = 'fish', { from = 'L', restL = 10, restR = 0 } = {}) {
  const k = Math.sin(Math.PI * Math.max(0, Math.min(1, u))), got = u >= .5;
  const inL = from === 'L' ? !got : got;
  return { armL: restL + (-62 - restL) * k, armR: restR + (-62 - restR) * k, holdL: inL ? key : null, hold: inL ? null : key };
}

/* ---------- the penguin ----------
   Front-facing, built at its feet (0, 0), about 236 tall at s 1 (used at s .9: ~212, the man's waist). pose(o, f): x, y,
   s; look (-1…1, the face slides toward where it looks), eyeX/eyeY (-1…1), lids (0…1), shut (blink), beak (0 shut … 1
   wide: a honk), headR (degrees, + tilts toward the screen-right), rock (degrees, the waddle's tilt; + leans right),
   footL/footR (px a foot is lifted), bob, squash (+ flattens: a landing), flipL/flipR (degrees, + raises the flipper
   outward; 0 hangs, 90 straight out, 150 up), hold (prop key in the screen-right flipper), sticker (the zoo sticker on
   its chest), ring (a rubber ring round its waist), shades (false, 'up' on its head, 'on' over its eyes), balloon (a
   ZOO balloon tied to its screen-left flipper; it sways by itself; balX shifts it sideways, + to the screen-right). pengWaddle(q) gives a waddle on twos. */
const PENG = { ink: '#25282e', belly: '#f6f3ea', beak: '#f0a030', beak2: '#c9741c', feet: '#f0a030' };
const REST_PENG = { x: 0, y: 0, s: 1, look: 0, eyeX: 0, eyeY: 0, lids: 0, shut: false, beak: 0, headR: 0, rock: 0, footL: 0, footR: 0,
  bob: 0, squash: 0, flipL: 0, flipR: 0, hold: null, sticker: false, ring: false, shades: false, balloon: false };
const PENG_FLIP = { x: 58, y: -130, len: 96, rest: 10 };   // the flippers' shoulder pins and length
function penguinPuppet(parent, { holds = {} } = {}) {
  const g = mk('g', {}, parent), id = 'pgc' + (++spClip), C = PENG;
  const eye = sx => `<ellipse cx="${sx * 15}" cy="-196" rx="14" ry="17"`;
  const flip = side => `<g data-p="flip${side}"><g filter="url(#paper)"><path d="M-8,0 C10,-4 24,40 16,96 C14,104 4,104 2,98 C-2,60 -12,30 -8,0 Z" fill="${C.ink}" transform="scale(${side === 'R' ? 1 : -1},1)"/></g>
      ${side === 'L' ? `<g data-p="bal" transform="translate(${-8},94)"><path data-p="balStr" d="M0,0" stroke="#5a5a5a" stroke-width="1.6" fill="none"/>
        <g data-p="balloon"><g filter="url(#paper)"><path d="M0,-84 C-40,-84 -44,-36 -26,-14 C-16,-2 -6,2 0,4 C6,2 16,-2 26,-14 C44,-36 40,-84 0,-84 Z" fill="#d8403a"/><path d="M-6,8 L6,8 L0,2 Z" fill="#b83030"/>
          <ellipse cx="-14" cy="-60" rx="7" ry="12" fill="#f6b0a0" opacity=".7"/>
          <text x="0" y="-32" font-family="Rockwell, Georgia, serif" font-size="20" font-weight="700" text-anchor="middle" fill="#fbf6ea">ZOO</text></g></g></g>` : ''}
      ${Object.entries(holds).map(([k, s]) => `<g data-p="hold${side}_${k}" transform="translate(${side === 'R' ? 8 : -8},94)">${s}</g>`).join('')}</g>`;
  g.innerHTML = `<ellipse data-p="shadow" cx="8" cy="-2" rx="78" ry="13" fill="url(#spShadow)"/><g data-p="all">
    <g data-p="footL"><g filter="url(#paper)"><path d="M-46,-2 Q-40,-16 -22,-14 Q-4,-14 -2,-2 Q-24,6 -46,-2 Z" fill="${C.feet}"/></g></g>
    <g data-p="footR"><g filter="url(#paper)"><path d="M46,-2 Q40,-16 22,-14 Q4,-14 2,-2 Q24,6 46,-2 Z" fill="${C.feet}"/></g></g>
    <g data-p="ringB"><path d="M-94,-70 A94,26 0 0 1 94,-70" fill="none" stroke="#b8322a" stroke-width="24"/></g>
    ${flip('L')}${flip('R')}
    <g filter="url(#paper)"><ellipse cx="0" cy="-102" rx="70" ry="98" fill="${C.ink}"/><ellipse cx="0" cy="-84" rx="53" ry="78" fill="${C.belly}"/></g>
    <g data-p="sticker"><g filter="url(#paper)"><circle cx="-26" cy="-118" r="17" fill="#f6c843"/><circle cx="-26" cy="-118" r="14" fill="none" stroke="#c8402f" stroke-width="1.6"/>
      <text x="-26" y="-121" font-family="Rockwell, Georgia, serif" font-size="8" font-weight="700" text-anchor="middle" fill="#c8402f">I ♥</text>
      <text x="-26" y="-111" font-family="Rockwell, Georgia, serif" font-size="8.5" font-weight="700" text-anchor="middle" fill="#2f4f7a">ZOO</text></g></g>
    <g data-p="ringF"><g filter="url(#paper)"><path d="M-94,-70 A94,26 0 0 0 94,-70" fill="none" stroke="#e8463a" stroke-width="26"/>
      <path d="M-94,-70 A94,26 0 0 0 94,-70" fill="none" stroke="#fbf6ea" stroke-width="26" stroke-dasharray="22 40" stroke-dashoffset="10"/></g></g>
    <g data-p="head">
      <g filter="url(#paper)"><circle cx="0" cy="-186" r="50" fill="${C.ink}"/></g>
      <g data-p="feat">
        <g data-p="whites" filter="url(#paper)">${eye(-1)} fill="#fff"/>${eye(1)} fill="#fff"/></g>
        <g data-p="pupils"><circle cx="-15" cy="-196" r="4.6" fill="${SP_INK}"/><circle cx="15" cy="-196" r="4.6" fill="${SP_INK}"/></g>
        <clipPath id="${id}e">${eye(-1)}/>${eye(1)}/></clipPath>
        <g clip-path="url(#${id}e)"><g data-p="lids"><rect x="-32" y="-248" width="64" height="34" fill="${C.ink}"/><path d="M-32,-214 H32" stroke="#555" stroke-width="2.5"/></g></g>
        ${eye(-1)} fill="none" stroke="#111" stroke-width="2"/>${eye(1)} fill="none" stroke="#111" stroke-width="2"/>
        <g data-p="mouth"><path d="M-13,0 L13,0 L10,1 L-10,1 Z" fill="#4a1a16"/></g>
        <g data-p="beakL"><g filter="url(#paper)"><path d="M-12,-152 L12,-152 Q9,-136 0,-134 Q-9,-136 -12,-152 Z" fill="${C.beak2}"/></g></g>
        <g data-p="beakU"><g filter="url(#paper)"><path d="M-17,-177 Q0,-182 17,-177 L12,-160 Q0,-153 -12,-160 Z" fill="${C.beak}"/></g></g>
        <g data-p="shades"><g filter="url(#paper)"><ellipse cx="-16" cy="-196" rx="18" ry="14" fill="#16181c"/><ellipse cx="16" cy="-196" rx="18" ry="14" fill="#16181c"/>
          <path d="M-2,-198 Q0,-202 2,-198" stroke="#16181c" stroke-width="4" fill="none"/>
          <ellipse cx="-16" cy="-196" rx="18" ry="14" fill="none" stroke="#e8c858" stroke-width="2.5"/><ellipse cx="16" cy="-196" rx="18" ry="14" fill="none" stroke="#e8c858" stroke-width="2.5"/>
          <path d="M-26,-201 l7,-5 M6,-201 l7,-5" stroke="#f4f6f8" stroke-width="3" stroke-linecap="round"/></g></g>
      </g></g></g>`;
  bakeAll(g);
  const P = pieces(g), holdKeys = Object.keys(holds);
  return { g, pose(o, f) {
    o = { ...REST_PENG, ...o };
    const j = k => .35 * jit(f >> 1, k);
    tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + j(2) * .6).toFixed(1)}) scale(${o.s})`);
    tf(P.all, `translate(0,${o.bob.toFixed(1)}) rotate(${(o.rock + j(3) * .4).toFixed(2)},0,-8) scale(${(1 + .5 * o.squash).toFixed(3)},${(1 - o.squash).toFixed(3)})`);
    // a lifted foot also swings out from under the belly, so it shows (footR 20+ reads as "one foot up")
    tf(P.footL, `translate(${(-.9 * o.footL).toFixed(1)},${(-.8 * o.footL).toFixed(1)}) rotate(${(o.footL * .6).toFixed(1)},-24,-6)`);
    tf(P.footR, `translate(${(.9 * o.footR).toFixed(1)},${(-.8 * o.footR).toFixed(1)}) rotate(${(-o.footR * .6).toFixed(1)},24,-6)`);
    const aL = PENG_FLIP.rest + o.flipL + j(6) * .6, aR = PENG_FLIP.rest + o.flipR + j(7) * .6;
    tf(P.flipL, `translate(${-PENG_FLIP.x},${PENG_FLIP.y}) rotate(${aL.toFixed(2)})`);
    tf(P.flipR, `translate(${PENG_FLIP.x},${PENG_FLIP.y}) rotate(${(-aR).toFixed(2)})`);
    for (const k of holdKeys) { vis(P[`holdR_${k}`], o.hold === k); vis(P[`holdL_${k}`], false); tf(P[`holdR_${k}`], `translate(8,94) rotate(${aR.toFixed(2)})`); }
    // the balloon floats up on its string from the left flipper's tip, drifting a little on its own
    vis(P.bal, o.balloon);
    if (o.balloon) {
      const t = f / FPS, sw = 10 * Math.sin(t * 1.3) + 4 * Math.sin(t * 2.9) - o.rock * 2, bx = -26 + sw + (o.balX || 0), by = -196;
      tf(P.bal, `translate(-8,94) rotate(${(-aL).toFixed(2)})`);
      const d = `M0,0 Q${(bx * .3 + 6).toFixed(1)},${(by * .5).toFixed(1)} ${bx.toFixed(1)},${(by + 8).toFixed(1)}`;
      if (P.balStr._d !== d) P.balStr.setAttribute('d', P.balStr._d = d);
      tf(P.balloon, `translate(${bx.toFixed(1)},${by}) rotate(${(sw * .5).toFixed(2)})`);
    }
    vis(P.sticker, o.sticker); vis(P.ringB, o.ring); vis(P.ringF, o.ring);
    tf(P.head, `rotate(${(o.headR + j(8) * .6).toFixed(2)},0,-150)`);
    tf(P.feat, `translate(${(o.look * 14).toFixed(1)},0)`);
    tf(P.pupils, `translate(${(o.eyeX * 6).toFixed(1)},${(o.eyeY * 7).toFixed(1)})`);
    tf(P.lids, `translate(0,${((o.shut ? 1 : o.lids) * 34).toFixed(1)})`);
    // the upper mandible stays put (under the eyes); the lower drops away from it and the dark mouth shows between
    tf(P.beakL, `translate(0,${(-12 + 26 * o.beak).toFixed(1)})`);
    vis(P.mouth, o.beak > .05); tf(P.mouth, `translate(0,-162) scale(1,${(1 + 26 * o.beak).toFixed(1)})`);
    vis(P.shades, !!o.shades); tf(P.shades, o.shades === 'up' ? 'translate(0,-38)' : '');
  } };
}
// A waddle on twos: the body tips from foot to foot and the lifted foot clears the ground. Slide x yourself
// (~110 px/s at s .9; ~150 px/s hurrying to keep up with the man) and point the face where it goes (look ±.6).
function pengWaddle(q) { const k = Math.floor(q * FPS / 2) % 2 ? 1 : -1; return { rock: 5 * k, footL: k > 0 ? 9 : 0, footR: k < 0 ? 9 : 0, bob: -2, k }; }
// Where a flipper's tip is in the world for a pose ('R' screen-right, 'L' screen-left): where the man's hand holds it.
function flipAt(o, side = 'R') {
  const s = o.s ?? 1, a = (PENG_FLIP.rest + (side === 'R' ? o.flipR || 0 : o.flipL || 0)) * Math.PI / 180, sg = side === 'R' ? 1 : -1;
  return [(o.x || 0) + s * sg * (PENG_FLIP.x + PENG_FLIP.len * Math.sin(a)), (o.y || 0) + s * (PENG_FLIP.y + (o.bob || 0) + PENG_FLIP.len * Math.cos(a))];
}

// Hand in flipper: returns the penguin's pose `po` with x and flipR set so its screen-right flipper tip is in the man's
// screen-left mitten (man pose `mo`; keep the man's armL small, 0…15, so the hand hangs low). The man leads; the
// penguin follows the hand wherever he walks.
function pengHand(man, mo, po) {
  const [hx, hy] = handAt(man, mo, 'L'), s = po.s ?? 1, c = Math.max(-1, Math.min(1, ((hy - (po.y || 0)) / s - PENG_FLIP.y - (po.bob || 0)) / PENG_FLIP.len));
  const a = Math.acos(c);
  return { ...po, flipR: a * 180 / Math.PI - PENG_FLIP.rest, x: hx - s * (PENG_FLIP.x + PENG_FLIP.len * Math.sin(a)) };
}

/* ---------- props (puppet pieces: give them to holds, or prop() them onto a stage) ---------- */
// The fish wrapped in paper, carried by its string: the parcel hangs just below the mitten, its tail to the screen-right.
// Keep the penguin ~200 px away from the man (or it stands under the parcel); in a two-shot it looks up at it.
const fishSVG = `<path d="M0,6 L-6,22 M0,6 L8,22" stroke="#a07a4a" stroke-width="2.4"/>${artSVG('fish', -66, 18, 132, 43)}`;
// The red bucket with a yellow spade, held by its handle.
const bucketSVG = artSVG('bucket', -32, -8, 64, 100);
// A paper cone of fish and chips, held round the cone.
const chipsSVG = artSVG('chips', -30, -62, 58, 108);
// One chip, held up between finger and thumb (the policeman eats them one by one).
const chipSVG = '<g filter="url(#paper)"><rect x="-4" y="-26" width="8" height="28" rx="3" fill="#e8b84a" transform="rotate(-12)"/></g>';
// The zoo photo as it is held in a hand (small: its insert is photoInsert below), held by its bottom edge.
const photoSVG = `<g filter="url(#paper)"><rect x="-38" y="-92" width="76" height="90" fill="#fbf8f0"/></g><image href="../img/props/zoo-pool.webp" x="-32" y="-86" width="64" height="64"/>`;
// The zoo poster: the painted picture with its words, top-left at (0, 0), 230 x 307.
const POSTER = { x: 1300, y: 320, w: 230, h: 307 };
const posterSVG = `<g filter="url(#paper)"><rect x="-6" y="-6" width="${POSTER.w + 12}" height="${POSTER.h + 12}" fill="#e2d6bc"/></g>${artSVG('poster-zoo', 0, 0, POSTER.w, POSTER.h)}
  <text x="${POSTER.w / 2}" y="52" font-family="Rockwell, Georgia, serif" font-size="40" font-weight="700" text-anchor="middle" fill="#2f5a3a">CITY ZOO</text>
  <text x="${POSTER.w / 2}" y="${POSTER.h - 24}" font-family="Rockwell, Georgia, serif" font-size="23" font-style="italic" font-weight="700" text-anchor="middle" fill="#b8402f">A great day out!</text>
  <circle cx="10" cy="10" r="4" fill="#c8a040"/><circle cx="${POSTER.w - 10}" cy="10" r="4" fill="#c8a040"/>`;

/* ---------- the insert of the zoo photo (scene 3) ----------
   photoInsert(p) → a full-frame group: the town street blurred behind, the man's mitten holding up a big
   polaroid: the penguin pool at the zoo, and in front of its railing — on the visitors' side — the man and the penguin
   grinning, the penguin with an ice cream, its sticker and balloon. A photo does not move: show and hide it whole. */
const iceSVG = '<g filter="url(#paper)"><path d="M-12,-6 L12,-6 L0,30 Z" fill="#d8a45a"/><circle cx="0" cy="-14" r="13" fill="#f6e2ea"/><circle cx="-6" cy="-24" r="9" fill="#f3c6d6"/></g>';
function photoInsert(p) {
  const g = mk('g', {}, p);
  g.innerHTML = `<image href="../img/sets/square/bg-soft.webp" x="-1300" y="-600" width="3440" height="1936" preserveAspectRatio="none"/>`;
  const card = mk('g', { transform: 'translate(800,470) rotate(-3)' }, g);
  card.innerHTML = `<g filter="url(#paper)"><rect x="-300" y="-340" width="600" height="700" fill="#fbf8f0"/></g>
    <image href="../img/props/zoo-pool.webp" x="-268" y="-308" width="536" height="536"/>
    <text x="0" y="300" font-family="Chalkboard SE, Comic Sans MS, sans-serif" font-size="36" text-anchor="middle" fill="#3a4f86">City Zoo — Tuesday</text>`;
  const clip = mk('clipPath', { id: 'photoClip' }, card); mk('rect', { x: -268, y: -308, width: 536, height: 536 }, clip);
  const inner = mk('g', { 'clip-path': 'url(#photoClip)' }, card);
  // the two of them in front of the railing, grinning (a photo: posed once, frame 0)
  const man = manPuppet(inner), peng = penguinPuppet(inner, { holds: { ice: iceSVG } });
  man.pose({ x: -90, y: 330, s: .95, mouth: 'grin', armR: 40, look: .2 }, 0);
  peng.pose({ x: 90, y: 250, s: 1.05, look: -.2, flipR: 60, hold: 'ice', sticker: true, balloon: true, balX: 150, eyeY: -.2 }, 0);
  // his screen-left mitten holds the photo up by its bottom-left corner (the other hand has the bucket)
  const hands = mk('g', {}, g);
  hands.innerHTML = `<g transform="translate(800,470) rotate(-3)"><g filter="url(#paper)"><rect x="-340" y="380" width="80" height="200" rx="30" fill="#4f7d4a"/><circle cx="-300" cy="350" r="46" fill="#f2efe6"/></g></g>`;
  bakeAll(g);
  // photoZoom(g, z, [x, y]): push in on a point of the photo (1 = as built); PHOTO_SMILE is the penguin with its ice cream
  return g;
}
const PHOTO_SMILE = [915, 520];
const photoZoom = (g, z, [x, y] = PHOTO_SMILE) => tf(g, z === 1 ? '' : `translate(${x},${y}) scale(${z.toFixed(4)}) translate(${-x},${-y})`);

/* ---------- places ----------
   Everyone stands on y 800 at s .9 (the penguin too); x positions and framings below. Close-up helpers take the
   puppet's x: MAN_CU(x), COP_CU(x), PENG_CU(x) (whole penguin), PENG_FACE(x) (its head, an insert), TWO_MP(xm, xp)
   (the man and the penguin). Close-ups need soft(t, true). */
const SEA = { s: .9, ground: 800 };
const MAN_CU = x => ({ x, y: 480, z: 2.4 }), COP_CU = x => ({ x, y: 470, z: 2.3 });
// singles once they stand close (the policeman walked over, the penguin beside the man): one face, at most a shoulder
const MAN_SOLO = x => ({ x: x - 45, y: 455, z: 3.8 }), COP_SOLO = x => ({ x: x + 45, y: 445, z: 3.8 });
// the man and the policeman face to face (scene 3, after he walks over: man 860, policeman ~1090)
const MAN_COP = (xm, xc) => ({ x: (xm + xc) / 2, y: 465, z: 2.1 });
const PENG_CU = x => ({ x, y: 690, z: 3.0 }), PENG_FACE = x => ({ x, y: 630, z: 5.5 });
// inserts on the day-two souvenirs: the balloon on its string (penguin at x), the sticker on its chest
const PENG_BALLOON = x => ({ x: x - 50, y: 600, z: 3.4 }), PENG_STICKER = x => ({ x: x - 24, y: 700, z: 5 });
const TWO_MP = (xm, xp) => ({ x: (xm + xp) / 2, y: 610, z: 1.9 });

/* The harbour (scene 1): the fish stall on the far left (the man starts there, x 230), a stack of fish crates at
   x 540…802 standing back on the quay (bottom y 754; a cut-out: whoever is in cam.stage stands behind it, whoever is in
   cam.stageAt.crates in front). The penguin hides behind their left end (x HARB.crates 620, y HARB.hideY 745, s
   HARB.hideS .85: the top of its head just shows; lift it with bob ≈ -42 to peek over); coming out round the left end it
   steps down to y 800, s .9 (ease y and s over ~0.4 s). front(pup, true|false) moves a puppet in front of / behind the
   crates; the man walks on y 800, in front of them. */
const HARB = { stall: 230, crates: 620, hideY: 745, hideS: .85, ground: 800 };
const HARB_WIDE = { x: 800, y: 450, z: 1 }, HARB_CRATES = { x: 680, y: 620, z: 2.6 };
function harbourSet(p) {
  const cam = paperCam(p, 'harbour', {}, { after: 'bg', stages: ['crates'] });
  const peng = penguinPuppet(cam.stage), man = manPuppet(cam.stageAt.crates, { holds: { fish: fishSVG } });
  const front = (pup, on) => { const want = on ? cam.stageAt.crates : cam.stage; if (pup.g.parentNode !== want) want.appendChild(pup.g); };
  return { cam, man, peng, front };
}

/* The town street (scenes 2 and 3): shops along the back, the lamppost at x 330, the plain wall on the right with the
   zoo poster (POSTER, x 1300…1530, y 320…627). The policeman's corner is x 1180 (he faces us, poster at his left
   shoulder, screen-right); the man stops at x 860 and the penguin at x 620 (well clear of the fish parcel). */
const SQ = { cop: 1180, man: 860, peng: 620, ground: 800 };
const SQ_WIDE = { x: 800, y: 450, z: 1 }, SQ_THREE = { x: 940, y: 560, z: 1.45 }, SQ_POSTER = { x: 1400, y: 474, z: 2.9 };   // poster insert: hide the policeman in it (the frame edge would cut his helmet)
// pushes on the poster: to the penguins painted in it (scene 2: "the zoo is where penguins live") and to its slogan
// (scene 3: the clue paid off). cam.to(...) from SQ_POSTER over ~0.6–1 s.
const POSTER_PENG = { x: 1470, y: 495, z: 5 }, POSTER_SLOGAN = { x: 1415, y: 598, z: 4.5 };
function squareSet(p) {
  const cam = paperCam(p, 'square');
  const poster = prop(cam.stage, posterSVG); tf(poster, `translate(${POSTER.x},${POSTER.y})`);
  const cop = copPuppet(cam.stage, { holds: { chips: chipsSVG } });
  const peng = penguinPuppet(cam.stage);
  const man = manPuppet(cam.stage, { holds: { fish: fishSVG, bucket: bucketSVG, photo: photoSVG } });
  return { cam, man, cop, peng, poster };
}

/* The beach (scene 4): the FISH & CHIPS kiosk on the left; the policeman eats his lunch in front of it (x 470); the
   second penguin comes in from the left to x 640. Out in the sea, smaller and further away (s .55, feet y 660, hidden
   under a strip of paper waves that rolls by itself), the man (x 1180) and the penguin floating in its ring (x 1340;
   pose it with y ≈ BEACH.float). The umbrella at x 900 is painted. */
const BEACH = { cop: 470, peng2: 640, man: 1180, peng: 1340, ss: .55, sea: 660, float: 648 };
const BEACH_WIDE = { x: 800, y: 450, z: 1 }, BEACH_SWIM = { x: 1260, y: 560, z: 2.6 }, BEACH_FLOAT = { x: 1415, y: 585, z: 4.2 },
  BEACH_MAN = { x: 1180, y: 520, z: 3.2 }, BEACH_TWO = { x: 560, y: 600, z: 1.85 };
function beachSet(p) {
  const cam = paperCam(p, 'beach');
  const man = manPuppet(cam.stage, { holds: { bucket: bucketSVG } }), peng = penguinPuppet(cam.stage);
  // the water in front of the swimmers is the painted sea itself (a clipped copy of the set, so it matches), hiding
  // their legs; only the paper foam line on it rolls to and fro (roll). Keep soft(…, 'all') off on the beach: the copy
  // stays sharp.
  const crest = Array.from({ length: 5 }, () => 'q20,-7 40,0 t40,0').join(' ');
  const sea = mk('g', {}, cam.stage);
  sea.innerHTML = `<clipPath id="seaFront"><path d="M1000,666 L1012,640 Q1040,624 1080,622 ${crest} Q1560,624 1590,640 L1600,666 Z"/></clipPath>
    <image href="../img/sets/beach/bg.webp" x="-60" y="-34" width="1720" height="968" preserveAspectRatio="none" clip-path="url(#seaFront)"/>`;
  const waves = prop(cam.stage, `<g filter="url(#paper)"><path d="M1080,622 ${crest}" fill="none" stroke="#f4f6f2" stroke-width="5" stroke-linecap="round"/></g>`);
  const cop = copPuppet(cam.stage, { holds: { chips: chipsSVG, chip: chipSVG } }), peng2 = penguinPuppet(cam.stage);
  // call every frame: the strip rolls, the swimmers bob with it (add bob(q) to their y)
  const roll = q => tf(waves, `translate(${(10 * Math.sin(q * 1.1)).toFixed(1)},${(3 * Math.sin(q * 2.2)).toFixed(1)})`);
  const bob = q => 5 * Math.sin(q * 2.2 + .6);
  return { cam, man, peng, cop, peng2, roll, bob };
}

// The title card at the end: black, a torn paper strip with the title, the series line under it. card.at(q, t0) every
// frame: hidden before t0, then the strip springs up (0.35 s) and at t0 + 1.2 a small penguin peeks over its right end.
function titleCard(p) {
  const card = mk('g', {}, p);
  card.innerHTML = `<rect width="1600" height="900" fill="#0d0b0a"/>
    <g filter="url(#paper)"><path d="M140,330 L260,318 L420,334 L600,316 L800,332 L1000,317 L1200,333 L1380,318 L1470,330 L1460,430 L1370,444 L1180,428 L1000,444 L800,430 L600,446 L400,430 L240,446 L136,432 Z" fill="#f3ead6"/></g>
    <text x="800" y="418" font-family="Chalkboard SE, Avenir Next Heavy, sans-serif" font-size="86" font-weight="800" text-anchor="middle" fill="#1d1a1a">The Penguin and the Zoo</text>
    <text x="800" y="510" font-family="Avenir Next, sans-serif" font-size="38" letter-spacing="4" text-anchor="middle" fill="#cfc6b4">Joke Collection · Episode 5</text>`;
  const strip = mk('g', {}, card); [...card.children].slice(1, 4).forEach(c => strip.appendChild(c));
  // the penguin rises behind the strip, clipped at the strip's middle so it never shows below it
  const clip = mk('clipPath', { id: 'titlePeek' }, card); mk('rect', { x: 0, y: 0, width: 1600, height: 400 }, clip);
  const wrap = mk('g', { 'clip-path': 'url(#titlePeek)' }, card), peek = mk('g', {}, wrap), pg = penguinPuppet(peek); card.insertBefore(wrap, strip);
  pg.pose({ x: 1380, y: 440, s: .7, look: -.6, eyeX: -1, eyeY: .3 }, 0);
  bakeAll(card);
  card.at = (q, t0) => {
    vis(card, q >= t0); if (q < t0) return;
    const u = span(q, t0, t0 + .35), o = Math.sin(Math.PI * Math.min(1, u * 1.4)) * 12 * (1 - u);
    tf(strip, `translate(0,${((1 - u) * 80 - o).toFixed(1)})`);
    tf(peek, `translate(0,${(130 * (1 - span(q, t0 + 1.2, t0 + 1.5))).toFixed(1)})`);
  };
  return card;
}
Object.assign(SFX_BED, { waves: 32, 'waves-bed3': 24.35 });   // called once per scene; a seek or deep link into the middle joins them part-way
