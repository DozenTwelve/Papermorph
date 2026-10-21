/* cast.js — the kids, in the flat cut-paper style of South Park: a big round head straight on the body, two touching
   eyes, a mouth low on the face, mitten hands. Built at the feet (0, 0) facing us. They turn by sliding the face to
   one side (look -1 … 1), as that show does; the paper pieces never deform.
   pose(o, f): x, y, s; look (face slide), eyeX/eyeY (pupils, -1 … 1), lids (0 open … 1 shut; .55 is deadpan), shut
   (blink), mouth (a Rhubarb shape or an expression below), brow (0 none, <0 angry, >0 worried), headR, bob, squash,
   armL/armR (degrees, + raises outward; 0 hangs at the side), legL/legR (degrees), sit (hide legs), hold (prop key). */
'use strict';
// Mouths, centred on the mouth point: Rhubarb shapes A–H and X, plus expressions. They open downward, like the show's.
const SP_INK = '#1d1a1a';
// How far a shut eye's lid comes down: 1 covers it; an episode may set window.SP_SHUT = .9 to leave the lid line showing.
const SP_SHUT = window.SP_SHUT ?? 1;
const SP_MOUTHS = {
  X: `<path d="M-13,0 Q0,4 13,0" fill="none" stroke="${SP_INK}" stroke-width="3" stroke-linecap="round"/>`,
  A: `<path d="M-11,1 L11,1" stroke="${SP_INK}" stroke-width="3" stroke-linecap="round"/>`,
  B: `<path d="M-13,-1 L13,-1 Q11,8 0,9 Q-11,8 -13,-1 Z" fill="#5a1414"/><path d="M-10,0 h20" stroke="#fff" stroke-width="2.4"/>`,
  C: `<path d="M-14,-2 L14,-2 Q12,12 0,13 Q-12,12 -14,-2 Z" fill="#5a1414"/><ellipse cy="9" rx="7" ry="3" fill="#d9606a"/>`,
  D: `<path d="M-18,-3 L18,-3 Q16,18 0,19 Q-16,18 -18,-3 Z" fill="#5a1414"/><ellipse cy="13" rx="10" ry="4.5" fill="#d9606a"/>`,
  E: `<ellipse cy="3" rx="8" ry="10" fill="#5a1414"/>`,
  F: `<ellipse cy="1" rx="5" ry="5.5" fill="#5a1414"/>`,
  G: `<path d="M-12,-1 L12,-1 Q10,6 0,7 Q-10,6 -12,-1 Z" fill="#5a1414"/><path d="M-9,1 h18" stroke="#fff" stroke-width="3"/>`,
  H: `<path d="M-13,-2 L13,-2 Q11,10 0,11 Q-11,10 -13,-2 Z" fill="#5a1414"/><ellipse cy="2" rx="5" ry="3" fill="#d9606a"/>`,
  flat: `<path d="M-12,1 L12,1" stroke="${SP_INK}" stroke-width="3.2" stroke-linecap="round"/>`,
  frown: `<path d="M-13,4 Q0,-3 13,4" fill="none" stroke="${SP_INK}" stroke-width="3" stroke-linecap="round"/>`,
  smile: `<path d="M-15,-2 Q0,9 15,-2" fill="none" stroke="${SP_INK}" stroke-width="3" stroke-linecap="round"/>`,
  grin: `<path d="M-18,-3 L18,-3 Q15,15 0,16 Q-15,15 -18,-3 Z" fill="#5a1414"/><path d="M-16,-1 h32 v4 q-16,3 -32,0 z" fill="#fff"/>`,
  O: `<ellipse cy="5" rx="11" ry="14" fill="#5a1414"/>`,
  wobble: `<path d="M-14,2 q3.5,-4 7,0 t7,0 t7,0 t7,0" fill="none" stroke="${SP_INK}" stroke-width="3" stroke-linecap="round"/>`,
  chew: `<path d="M-12,0 Q0,-5 12,0" fill="none" stroke="${SP_INK}" stroke-width="3" stroke-linecap="round"/>`,
};
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${
  Object.entries(SP_MOUTHS).map(([k, s]) => `<g id="sp${k}">${s}</g>`).join('')}
  <radialGradient id="spShadow"><stop offset="0" stop-color="#2a1c10" stop-opacity=".42"/><stop offset=".6" stop-color="#2a1c10" stop-opacity=".22"/><stop offset="1" stop-color="#2a1c10" stop-opacity="0"/></radialGradient></defs></svg>`);

const UNIFORM = { coat: '#3563c0', stripe: '#f4f1ea', pants: '#25356a' };
const SHAPES = {
  // the fat kid: round body, wide head, double chin, bowl of black hair
  me: { sx: 104, sy: -142, hipX: 34, legW: 40, shoe: 29, body: 'M-66,-174 C-126,-156 -136,-72 -116,-46 Q-72,-28 0,-28 Q72,-28 116,-46 C136,-72 126,-156 66,-174 Z',
    head: [0, -250, 106, 90], neck: -160, eyes: [22, -256, 23, 28], mouth: [0, -196], cheeks: [64, -216], slide: 30,
    chin: 'M-52,-174 Q0,-152 52,-174',
    hair: ['#211a17', 'M-104,-262 C-108,-334 -62,-350 0,-350 C62,-350 108,-334 104,-262 L88,-280 L70,-262 L50,-284 L26,-268 L4,-288 L-20,-268 L-44,-286 L-66,-264 L-86,-282 Z'] },
  // the thin kid with glasses and a spiky top
  bo: { sx: 54, sy: -146, hipX: 18, legW: 26, shoe: 20, body: 'M-44,-166 C-64,-150 -68,-78 -62,-50 Q-30,-36 0,-36 Q30,-36 62,-50 C68,-78 64,-150 44,-166 Z',
    head: [0, -246, 92, 86], neck: -158, eyes: [24, -254, 20, 25], mouth: [0, -196], cheeks: null, slide: 28, glasses: 31,
    hair: ['#2a1f1a', 'M-90,-262 C-96,-318 -60,-338 -10,-340 L-24,-366 L4,-346 L10,-374 L30,-346 L50,-366 L52,-338 C84,-326 96,-300 90,-262 L74,-286 L56,-270 L30,-292 L0,-276 L-30,-292 L-58,-270 Z'] },
};
// classmates: one body, a few heads of hair
const KID_HAIR = {
  bowl: c => [c, 'M-90,-258 C-94,-320 -56,-336 0,-336 C56,-336 94,-320 90,-258 L72,-280 Q0,-296 -72,-280 Z'],
  pigtails: c => [c, 'M-90,-256 C-94,-320 -56,-336 0,-336 C56,-336 94,-320 90,-256 L78,-282 Q0,-300 -78,-282 Z M-96,-262 q-34,4 -36,40 q20,-6 36,-18 Z M96,-262 q34,4 36,40 q-20,-6 -36,-18 Z'],
  part: c => [c, 'M-90,-258 C-94,-322 -50,-338 10,-336 C64,-332 94,-312 90,-258 L80,-290 Q30,-312 -20,-290 Q-60,-300 -84,-276 Z'],
  buzz: c => [c, 'M-88,-266 C-90,-318 -52,-334 0,-334 C52,-334 90,-318 88,-266 Q0,-300 -88,-266 Z'],
};
const kidShape = (hair, col) => ({ ...SHAPES.bo, glasses: 0, hair: KID_HAIR[hair](col) });
// the bun seller: a grown-up, so a long body on longer legs; white apron and cap. Coat colour is her top.
SHAPES.aunt = { sx: 60, sy: -262, hipX: 20, legW: 30, shoe: 22, legH: 96, neck: -276,
  body: 'M-46,-284 C-66,-270 -72,-140 -66,-96 Q-34,-84 0,-84 Q34,-84 66,-96 C72,-140 66,-270 46,-284 Z',
  extra: '<path d="M-40,-230 L40,-230 L54,-92 Q0,-80 -54,-92 Z" fill="#f6f4ee"/><path d="M-40,-230 L-26,-276 M40,-230 L26,-276" stroke="#f6f4ee" stroke-width="6"/>',
  head: [0, -360, 88, 82], eyes: [22, -366, 18, 22], mouth: [0, -312], cheeks: [56, -330], slide: 26,
  hair: ['#2a2220', 'M-86,-372 C-92,-430 -50,-446 0,-446 C50,-446 92,-430 86,-372 Q60,-404 0,-406 Q-60,-404 -86,-372 Z'],
  hat: '<path d="M-74,-414 C-80,-470 80,-470 74,-414 Q0,-430 -74,-414 Z" fill="#f6f4ee"/><rect x="-78" y="-424" width="156" height="18" rx="8" fill="#e8e4da"/>' };
const auntPuppet = (p, o) => spKid(p, 'aunt', { coat: '#c94a3c', stripe: '#c94a3c', pants: '#3a3430', ...o });

let spClip = 0;
const REST_SP = { x: 0, y: 0, s: 1, look: 0, eyeX: 0, eyeY: 0, lids: 0, shut: false, mouth: 'X', brow: 0, headR: 0, bob: 0, squash: 0,
  armL: 0, armR: 0, legL: 0, legR: 0, sit: false, hold: null, holdL: null };
// holds: { key: svg } drawn in the hand of the screen-right arm (hold) or screen-left arm (holdL), at the mitten centre
function spKid(parent, shape, { skin = '#f7d9bb', coat = UNIFORM.coat, stripe = UNIFORM.stripe, pants = UNIFORM.pants, holds = {} } = {}) {
  const S = typeof shape === 'string' ? SHAPES[shape] : shape, g = mk('g', {}, parent), id = 'spc' + (++spClip);
  const legH = S.legH || 46, [hx, hy, hrx, hry] = S.head, [ex, ey, erx, ery] = S.eyes, [mx, my] = S.mouth;
  const arm = side => `<g data-p="arm${side}"><g filter="url(#paper)"><rect x="-14" y="-6" width="28" height="64" rx="13" fill="${coat}"/>
      <path d="M${side === 'R' ? 7 : -7},-2 v56" stroke="${stripe}" stroke-width="5"/>
      <circle cy="72" r="18" fill="#f2efe6"/><ellipse cx="${side === 'R' ? -14 : 14}" cy="62" rx="7" ry="10" fill="#f2efe6"/></g>
      ${Object.entries(holds).map(([k, s]) => `<g data-p="hold${side}_${k}" transform="translate(0,72)">${s}</g>`).join('')}</g>`;
  const leg = side => `<g data-p="leg${side}"><g filter="url(#paper)"><rect x="${-S.legW / 2}" y="0" width="${S.legW}" height="${legH}" rx="6" fill="${pants}"/>
      <ellipse cx="${side === 'R' ? 6 : -6}" cy="${legH - 2}" rx="${S.shoe}" ry="11" fill="#1f1d1d"/></g></g>`;
  const eye = sx => `<ellipse cx="${sx * ex}" cy="${ey}" rx="${erx}" ry="${ery}"`;
  // a soft shadow on the ground, a little to the right: the painted sets are lit from the left
  g.innerHTML = `<ellipse data-p="shadow" cx="${S.sx * .18}" cy="-2" rx="${S.sx + 34}" ry="16" fill="url(#spShadow)"/><g data-p="all"><g data-p="legs">${leg('L')}${leg('R')}</g>
    <g data-p="body"><g filter="url(#paper)"><path d="${S.body}" fill="${coat}"/>
      <path d="M-24,${S.sy - 22} L0,${S.sy + 8} L24,${S.sy - 22}" fill="none" stroke="${stripe}" stroke-width="7" stroke-linejoin="round"/>
      ${S.extra || `<path d="M0,${S.sy + 8} V-40" stroke="#26478f" stroke-width="3"/>`}</g></g>
    ${arm('L')}${arm('R')}
    <g data-p="head"><g filter="url(#paper)"><ellipse cx="${hx}" cy="${hy}" rx="${hrx}" ry="${hry}" fill="${skin}"/>
        ${S.chin ? `<path d="${S.chin}" fill="none" stroke="#d9a888" stroke-width="3" stroke-linecap="round"/>` : ''}</g>
      <clipPath id="${id}"><ellipse cx="${hx}" cy="${hy}" rx="${hrx}" ry="${hry}"/></clipPath>
      <g clip-path="url(#${id})"><g data-p="feat">
        ${S.cheeks ? `<circle cx="${-S.cheeks[0]}" cy="${S.cheeks[1]}" r="13" fill="#ef9f98" opacity=".55"/><circle cx="${S.cheeks[0]}" cy="${S.cheeks[1]}" r="13" fill="#ef9f98" opacity=".55"/>` : ''}
        <g data-p="whites" filter="url(#paper)">${eye(-1)} fill="#fff"/>${eye(1)} fill="#fff"/></g>
        <g data-p="pupils"><circle cx="${-ex}" cy="${ey}" r="${erx * .22}" fill="${SP_INK}"/><circle cx="${ex}" cy="${ey}" r="${erx * .22}" fill="${SP_INK}"/></g>
        <clipPath id="${id}e">${eye(-1)}/>${eye(1)}/></clipPath>
        <g clip-path="url(#${id}e)"><g data-p="lids">
          <rect x="${-ex - erx - 2}" y="${ey - ery * 3}" width="${2 * (ex + erx) + 4}" height="${ery * 2}" fill="${skin}"/>
          <path d="M${-ex - erx - 2},${ey - ery} H${ex + erx + 2}" stroke="${SP_INK}" stroke-width="3"/></g></g>
        ${eye(-1)} fill="none" stroke="${SP_INK}" stroke-width="2"/>${eye(1)} fill="none" stroke="${SP_INK}" stroke-width="2"/>
        ${S.glasses ? `<g fill="none" stroke="${SP_INK}" stroke-width="4.5"><circle cx="${-ex}" cy="${ey}" r="${S.glasses}"/><circle cx="${ex}" cy="${ey}" r="${S.glasses}"/>
          <path d="M${-ex + S.glasses},${ey - 4} Q0,${ey - 10} ${ex - S.glasses},${ey - 4}"/></g>` : ''}
        <path data-p="browL" d="M${-ex - 16},${ey - ery - 12} L${-ex + 14},${ey - ery - 6}" stroke="${SP_INK}" stroke-width="4" stroke-linecap="round"/>
        <path data-p="browR" d="M${ex + 16},${ey - ery - 12} L${ex - 14},${ey - ery - 6}" stroke="${SP_INK}" stroke-width="4" stroke-linecap="round"/>
        <use class="mouth" href="#spX" transform="translate(${mx},${my})"/></g></g>
      <g data-p="hair"><g filter="url(#paper)"><path d="${S.hair[1]}" fill="${S.hair[0]}"/>${S.hat || ''}</g></g></g></g>`;
  bakeAll(g);
  const P = pieces(g), holdKeys = Object.keys(holds);
  const legY = -(legH + 6), ery2 = ery * 2;
  return { g, S, pose(o, f) {
    o = { ...REST_SP, ...o };
    const j = k => .35 * jit(f >> 1, k);   // the animator's hand: small, and held for two frames
    tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + j(2) * .6).toFixed(1)}) scale(${o.s})`);
    // squash > 0 flattens the figure on its feet (a landing, a sigh)
    tf(P.all, `translate(0,${o.bob.toFixed(1)}) scale(${(1 + .5 * o.squash).toFixed(3)},${(1 - o.squash).toFixed(3)}) rotate(${(j(3) * .4).toFixed(2)})`);
    vis(P.legs, !o.sit); vis(P.shadow, !o.sit);
    tf(P.legL, `translate(${-S.hipX},${legY}) rotate(${(o.legL + j(4) * .5).toFixed(2)})`);
    tf(P.legR, `translate(${S.hipX},${legY}) rotate(${(-o.legR + j(5) * .5).toFixed(2)})`);
    tf(P.armL, `translate(${-S.sx},${S.sy}) rotate(${(24 + o.armL + j(6) * .6).toFixed(2)})`);
    tf(P.armR, `translate(${S.sx},${S.sy}) rotate(${(-24 - o.armR + j(7) * .6).toFixed(2)})`);
    for (const k of holdKeys) { vis(P[`holdR_${k}`], o.hold === k); vis(P[`holdL_${k}`], o.holdL === k);
      // a held thing stays upright whatever the arm does
      tf(P[`holdR_${k}`], `translate(0,72) rotate(${(24 + o.armR).toFixed(2)})`); tf(P[`holdL_${k}`], `translate(0,72) rotate(${(-24 - o.armL).toFixed(2)})`); }
    tf(P.head, `rotate(${(o.headR + j(8) * .6).toFixed(2)},0,${S.neck})`);
    const lx = o.look * S.slide;
    tf(P.feat, `translate(${lx.toFixed(1)},0)`); tf(P.hair, `translate(${(lx * .25).toFixed(1)},0)`);
    tf(P.pupils, `translate(${(o.eyeX * erx * .5).toFixed(1)},${(o.eyeY * ery * .45).toFixed(1)})`);
    tf(P.lids, `translate(0,${((o.shut ? SP_SHUT : o.lids) * ery2).toFixed(1)})`);
    const b = o.brow;
    vis(P.browL, b !== 0); vis(P.browR, b !== 0);
    tf(P.browL, `rotate(${(-14 * b).toFixed(1)},${-ex},${ey - ery - 9})`); tf(P.browR, `rotate(${(14 * b).toFixed(1)},${ex},${ey - ery - 9})`);
    const m = g.querySelector('.mouth'), href = '#sp' + (o.mouth || 'X'); if (m._m !== href) m.setAttribute('href', m._m = href);
  } };
}
const mePuppet = (p, o) => spKid(p, 'me', o), boPuppet = (p, o) => spKid(p, 'bo', o);
const classmate = (p, hair, col, o) => spKid(p, kidShape(hair, col), o);

// A walk in the show's manner: the figure bobs on twos and the stubby legs scissor; no compass needed at this size.
function spWalk(q, rate = 2.4) { const k = Math.floor(q * FPS / 2) % 2 ? 1 : -1; return { legL: 16 * k, legR: -16 * k, bob: k > 0 ? -6 : 0, armL: 8 * k, armR: -8 * k, k }; }

// The teacher (episode 2): a grown-up like the seller, a cardigan over a blouse, hair up in a tall bun.
SHAPES.teacher = { ...SHAPES.aunt,
  extra: '<path d="M-22,-282 L0,-236 L22,-282 Z" fill="#f2e6d0"/><path d="M-6,-232 V-96" stroke="#5e1c2c" stroke-width="4"/>' +
    [-200, -160, -120].map(y => `<circle cx="6" cy="${y}" r="5" fill="#f2e6d0"/>`).join(''),
  hat: '<circle cx="0" cy="-458" r="38" fill="#2a2220"/><path d="M-30,-436 Q0,-424 30,-436" stroke="#5a4a44" stroke-width="5" fill="none"/>' };
const teacherPuppet = (p, o) => spKid(p, 'teacher', { coat: '#8c2f45', stripe: '#8c2f45', pants: '#4a4a52', ...o });

/* The bun seller's dog (episode 2), side-on as the show draws its dogs. Built at its feet (0, 0) facing right, about
   190 long and 170 tall at s = 1. pose(o, f): x, y, s, dir (1 faces right, -1 left), headR (+ looks up), jaw (0 shut …
   1 open), tail (degrees, + up), wag (the tail swings on twos), ear (degrees), shut, lids, eyeX (-1 … 1 along its look),
   sit (on its haunches; 0…1 or true, ease it over ~0.3 s), lie (flat on the ground, front paws out, 0…1 or true; asleep
   unless lie is 'awake'), walk (legs scissor on twos), bob, glasses, tongue, sniff (the nose twitches),
   hold (prop key, carried crosswise in its mouth); rot (degrees: the whole dog tips about its middle, + nose down,
   for a leap); paw (degrees: the near front paw raised forward), swell (0…1: the chest
   fills, a big breath in).
   breed (episode 6; every key optional, leaving one out draws episode 4's dog): coat, dark, far, muzzle (colours),
   collar (colour, 'none'), torso ([rx, ry] of the body, default [82, 40]), spot (svg for the back patch, '' none), ear
   (path at the ear pin, 0,0 is the pin; DOG_EARS), tail (path), body (svg over the torso), neck (svg by the collar),
   hat (svg on the head, drawn last), mouthIn (svg of the inside of the mouth, behind the jaw: it turns half as far as
   the jaw, so a wide-open mouth shows a mouth, not a gap). */
const DOG = { coat: '#ece5d6', dark: '#6b5444', far: '#cdc3b1', muzzle: '#fbf8f0' };
const REST_DOG = { x: 0, y: 0, s: 1, dir: 1, headR: 0, jaw: 0, tail: 0, wag: false, ear: 0, shut: false, lids: 0, eyeX: 0,
  sit: false, lie: false, walk: false, bob: 0, glasses: false, tongue: false, sniff: false, hold: null, paw: 0, swell: 0 };
// Ear shapes at the ear pin: the floppy one (episode 4) and a pricked one (rotate it back, ear -60…-80, to lay it flat).
const DOG_EARS = { flop: 'M0,0 C-22,4 -26,40 -12,62 C-2,52 10,28 8,0 Z', prick: 'M-16,6 C-14,-14 -4,-40 6,-52 C14,-34 18,-12 16,6 Z' };
function dogPuppet(parent, { holds = {}, breed = {} } = {}) {
  const g = mk('g', {}, parent), id = 'dogc' + (++spClip), C = { ...DOG, ...breed }, [trx, try_] = breed.torso || [82, 40];
  const leg = (k, col) => `<g data-p="leg${k}"><g filter="url(#paper)"><rect x="-11" y="0" width="22" height="58" rx="8" fill="${col}"/><ellipse cx="6" cy="56" rx="13" ry="7" fill="${C.dark}"/></g></g>`;
  const eye = '<ellipse cx="100" cy="-142" rx="11" ry="13"';
  g.innerHTML = `<g data-p="all">${leg('B2', C.far)}${leg('F2', C.far)}
    <g data-p="haunch"><g filter="url(#paper)"><ellipse cx="-44" cy="-34" rx="40" ry="34" fill="${C.coat}"/><ellipse cx="-24" cy="-5" rx="24" ry="7" fill="${C.dark}"/></g></g>
    <g data-p="torso">
      <g data-p="tail"><g filter="url(#paper)"><path d="${breed.tail ?? 'M0,0 Q-34,-16 -40,-60 Q-28,-60 -24,-32 Q-16,-12 8,-8 Z'}" fill="${C.coat}"/></g></g>
      <g filter="url(#paper)"><ellipse cx="0" cy="-86" rx="${trx}" ry="${try_}" fill="${C.coat}"/>${breed.spot ?? `<ellipse cx="-14" cy="-100" rx="30" ry="15" fill="${C.dark}"/>`}${breed.body || ''}</g>
      <g data-p="head">
        <g filter="url(#paper)"><rect x="52" y="-116" width="28" height="12" rx="4" fill="${C.collar ?? '#c8322f'}" transform="rotate(-20 66 -110)"/>${breed.neck || ''}
          <circle cx="94" cy="-132" r="38" fill="${C.coat}"/><ellipse cx="128" cy="-106" rx="24" ry="9" fill="#4a1a14"/></g>
        ${breed.mouthIn ? `<g data-p="mouthIn">${breed.mouthIn}</g>` : ''}<g data-p="jaw"><g filter="url(#paper)"><path d="M100,-108 Q150,-106 150,-98 Q132,-86 100,-96 Z" fill="${C.muzzle}"/></g>
          <ellipse data-p="tongue" cx="138" cy="-90" rx="9" ry="12" fill="#e06f7a"/></g>
        <g filter="url(#paper)"><ellipse cx="128" cy="-116" rx="28" ry="15" fill="${C.muzzle}"/></g><g data-p="nose"><g filter="url(#paper)"><ellipse cx="154" cy="-122" rx="8.5" ry="6.5" fill="${SP_INK}"/></g></g>
        <clipPath id="${id}">${eye}/></clipPath>
        <g data-p="whites" filter="url(#paper)">${eye} fill="#fff"/></g>
        <circle data-p="pupil" cx="102" cy="-142" r="4.8" fill="${SP_INK}"/>
        <g clip-path="url(#${id})"><g data-p="lids"><rect x="86" y="-182" width="28" height="26" fill="${C.coat}"/><path d="M86,-155 H114" stroke="${SP_INK}" stroke-width="3"/></g></g>
        ${eye} fill="none" stroke="${SP_INK}" stroke-width="2"/>
        <g data-p="ear"><g filter="url(#paper)"><path d="${breed.ear ?? DOG_EARS.flop}" fill="${C.dark}"/></g></g>
        <g data-p="glasses" fill="none" stroke="${SP_INK}" stroke-width="3.5"><circle cx="101" cy="-142" r="16"/><path d="M85,-144 L64,-150 M117,-145 Q122,-149 127,-146"/><ellipse cx="135" cy="-143" rx="7" ry="13"/></g>
        ${Object.entries(holds).map(([k, s]) => `<g data-p="hold_${k}" transform="translate(134,-100)">${s}</g>`).join('')}${breed.hat || ''}
      </g></g>${leg('B1', C.coat)}${leg('F1', C.coat)}</g>`;
  bakeAll(g);
  const P = pieces(g), holdKeys = Object.keys(holds);
  // a point of the torso turned by `a` degrees about the hip: where the shoulders go when it sits
  const turn = (x, y, a) => { const r = a * Math.PI / 180, dx = x + 50, dy = y + 56; return [-50 + dx * Math.cos(r) - dy * Math.sin(r), -56 + dx * Math.sin(r) + dy * Math.cos(r)]; };
  return { g, pose(o, f) {
    o = { ...REST_DOG, ...o };
    const j = k => .35 * jit(f >> 1, k), k2 = Math.floor(f / 2) % 2 ? 1 : -1;
    tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + j(2) * .6).toFixed(1)}) scale(${(o.s * o.dir).toFixed(3)},${o.s})${o.rot ? ` rotate(${o.rot.toFixed(1)},0,-80)` : ''}`);
    const L = o.lie === true || o.lie === 'awake' ? 1 : +o.lie || 0, S = o.sit === true ? 1 : +o.sit || 0;
    tf(P.all, `translate(0,${(o.bob + 50 * L).toFixed(1)})`);
    const a = -16 * S;
    tf(P.torso, `rotate(${(a + j(3) * .4).toFixed(2)},-50,-56)${o.swell ? ` translate(0,-80) scale(${(1 + .07 * o.swell).toFixed(3)}) translate(0,80)` : ''}`);
    // sitting folds the back legs under the haunch; lying shortens the back legs away and swings the front paws forward
    vis(P.haunch, S > .4); vis(P.legB1, S <= .4 && L < .95); vis(P.legB2, S <= .4 && L < .95);
    const sw = o.walk ? 18 * k2 : 0, [fx, fy] = turn(30 + 16 * (1 - S), -60, a), fl = (-fy) / 60, bl = 1 - L;   // front legs reach the ground from the shoulder
    tf(P.legB1, `translate(-50,-60) rotate(${(sw + j(4) * .5).toFixed(2)}) scale(1,${bl.toFixed(3)})`); tf(P.legB2, `translate(-34,-60) rotate(${(-sw + j(5) * .5).toFixed(2)}) scale(1,${bl.toFixed(3)})`);
    const fr = -90 * L, fs = fl * (1 - .3 * L);
    tf(P.legF1, `translate(${fx.toFixed(1)},${fy.toFixed(1)}) rotate(${(-sw + fr - o.paw + j(6) * .5).toFixed(2)}) scale(1,${fs.toFixed(3)})`);
    tf(P.legF2, `translate(${(fx + 14).toFixed(1)},${fy.toFixed(1)}) rotate(${(sw + fr + j(7) * .5).toFixed(2)}) scale(1,${fs.toFixed(3)})`);
    tf(P.tail, `translate(-78,-92) rotate(${(-o.tail - (o.wag ? 16 * k2 : 0) + j(8)).toFixed(2)})`);
    tf(P.head, `rotate(${(-o.headR - a + j(9) * .6).toFixed(2)},62,-104)`);
    tf(P.jaw, `rotate(${(o.jaw * 30).toFixed(1)},100,-102)`);
    if (P.mouthIn) tf(P.mouthIn, `rotate(${(o.jaw * 15).toFixed(1)},100,-102)`);   // the inside of an open mouth (episode 6), halfway between
    tf(P.ear, `translate(80,-158) rotate(${(o.ear + j(10) * 2).toFixed(2)})`);
    tf(P.pupil, `translate(${(o.eyeX * 5).toFixed(1)},0)`);
    tf(P.lids, `translate(0,${((o.shut || (L > .5 && o.lie !== 'awake') ? 1 : o.lids) * 26).toFixed(1)})`);
    tf(P.nose, o.sniff ? `translate(154,-122) scale(${(1 + .18 * (f % 2)).toFixed(2)}) translate(-154,-122)` : '');   // sniffing: the nose twitches every frame
    vis(P.glasses, o.glasses); vis(P.tongue, o.tongue);
    for (const k of holdKeys) vis(P[`hold_${k}`], o.hold === k);
  } };
}

/* ---------- episode "Do You Need a Bag?": three grown-ups at a convenience store ---------- */
// Move every y of an absolute path (M/C/L/Q pairs) by dy: grown-ups reuse the kids' hair, higher up.
const shiftY = (d, dy) => { let i = 0; return d.replace(/-?\d+(\.\d+)?/g, n => (i++ % 2 ? +n + dy : +n) + ''); };
// Me, grown up: the same round face and bowl of black hair, on a big round body and grown-up legs; a grey hoodie.
SHAPES.meAdult = { sx: 104, sy: -258, hipX: 34, legW: 40, shoe: 29, legH: 96, neck: -276,
  body: 'M-70,-290 C-128,-272 -140,-150 -122,-104 Q-76,-86 0,-86 Q76,-86 122,-104 C140,-150 128,-272 70,-290 Z',
  extra: '<path d="M-62,-176 L62,-176 L72,-118 L-72,-118 Z" fill="#7b808b"/><path d="M-16,-284 v46 M16,-284 v46" stroke="#f4f1ea" stroke-width="4" stroke-linecap="round"/>',
  head: [0, -366, 106, 90], eyes: [22, -372, 23, 28], mouth: [0, -312], cheeks: [64, -332], slide: 30, chin: 'M-52,-290 Q0,-268 52,-290',
  hair: ['#211a17', shiftY(SHAPES.me.hair[1], -116)] };
const meAdultPuppet = (p, o) => spKid(p, 'meAdult', { coat: '#8f949e', stripe: '#8f949e', pants: '#34405e', ...o });
// The American girl: blonde, a high ponytail swinging to her left, a pink T-shirt with a heart, backpack straps, denim shorts.
SHAPES.amy = { ...SHAPES.aunt,
  extra: '<path d="M-40,-282 L-36,-150 M40,-282 L36,-150" stroke="#3a5ab0" stroke-width="13" stroke-linecap="round"/><path d="M0,-186 c-14,-18 -38,-2 -20,16 l20,18 l20,-18 c18,-18 -6,-34 -20,-16 Z" fill="#e0405a"/>',
  cheeks: [54, -330],
  hair: ['#f0c45a', 'M-86,-366 C-94,-432 -50,-448 0,-448 C50,-448 94,-432 86,-366 Q74,-404 30,-412 Q-30,-420 -86,-366 Z M50,-438 q70,-34 84,22 q6,46 -26,84 q8,-52 -22,-80 Z'],
  hat: '<circle cx="54" cy="-436" r="10" fill="#e0405a"/>' };
const amyPuppet = (p, o) => spKid(p, 'amy', { skin: '#f9dcc6', coat: '#f39ab8', stripe: '#f39ab8', pants: '#5a7ab8', ...o });
// The clerk: a young woman with a black bob, the store's blue-and-white striped shirt and a name badge.
SHAPES.clerk = { ...SHAPES.aunt,
  extra: [-44, -26, -8, 10, 28, 46].map(x => `<rect x="${x - 4}" y="-274" width="8" height="184" fill="#5b8fd0"/>`).join('') +
    '<path d="M-22,-284 L0,-250 L22,-284" fill="none" stroke="#2f6fb8" stroke-width="7"/><rect x="18" y="-236" width="34" height="20" rx="3" fill="#fbfbf6" stroke="#3f9a5a" stroke-width="3"/>',
  hair: ['#1d1716', 'M-92,-366 C-98,-434 -52,-450 0,-450 C52,-450 98,-434 92,-366 L94,-318 Q84,-326 72,-324 L74,-384 Q0,-408 -74,-384 L-72,-324 Q-84,-326 -94,-318 Z'] };
SHAPES.clerk.hat = '';
const clerkPuppet = (p, o) => spKid(p, 'clerk', { coat: '#eef2f8', stripe: '#eef2f8', pants: '#2c3446', ...o });
