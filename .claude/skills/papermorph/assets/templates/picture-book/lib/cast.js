/* cast.js — the puppets, on paper.js. Three kinds, each with a working example to copy; a book keeps the kind (or kinds)
   its story needs, adds its characters and deletes the rest:
   1. round-headed figures that face us, in the flat cut-paper style of South Park (spKid, kidPuppet; Joke Collection);
   2. storybook figures seen mostly in profile, with a side set and a front set of pieces (puppet, common, figurePuppet;
      Little Red Riding Hood);
   3. four-legged animals in profile on a two-bone leg rig with distance-driven gaits (beast, catPuppet; The Little Horse
      Crosses the River).
   Moving along the ground: spStep / spWalk (kind 1), walk() in paper.js with hipOn, walker and bigStep (kind 2), route
   (kinds 2 and 3); flipTurn turns a profile puppet over like a card. Each section's header lists its pose keys.

   ---------- 1. round-headed figures ----------
   A big round head straight on the body, two touching eyes, a mouth low on the face, mitten hands. Built at the feet
   (0, 0) facing us. They turn by sliding the face to one side (look -1 … 1), as that show does; the paper pieces never deform, except that a sleeve stretches with
   reach and a seated shin with the seat's height.
   pose(o, f): x, y, s; look (face slide), eyeX/eyeY (pupils, -1 … 1), lids (0 open … 1 shut; .55 is deadpan), shut
   (blink), mouth (a Rhubarb shape or an expression below), brow (0 none, <0 angry, >0 worried), headR, bob, squash,
   armL/armR (degrees, + raises outward; 0 hangs at the side), reachL/reachR (arm length, 1 rest: the sleeve stretches,
   the mitten slides along it), legL/legR (degrees, + swings outward), lean (degrees, the body about the hip, + leans to
   screen right), headY (+ lowers the head), sit (true: the legs and shadow hidden, for a seat whose front reaches the
   coat; a number H, up to the shape's legH - 12 (34 on the kid): on a seat H units above the feet, the lap and knees
   towards us and the shins down to the ground at y), hold/holdL (prop key in the screen-right / screen-left hand).
   A hand raised above the chin and in from its shoulder, towards the face, is drawn in front of the head (a cup at the
   lips, a hand on the chin, a reach across to the far side of the head); an arm raised out to the side (a wave, a cheer,
   a scratch at its own side of the head) stays behind it. armFrontL/armFrontR (true / false) override that.
   aim(o, 'L' | 'R', [x, y]) → { arm, reach, far, armR, reachR } (or armL, reachL): the values that put that hand on a
   point in the parent's coordinates for pose o; spread it into the pose (pose({ ...o, ...kid.aim(o, 'R', pt) })) or tween
   arm and reach from rest. far > 1.25 means the point is out of reach by that factor: lean, step closer or move the point.
   point(o, name) → [x, y]: where 'mouth', 'chin', 'capL'/'capR' (the sides of the head at the temples) or a head-local
   [x, y] of the shape is for pose o, in the parent's coordinates. A held thing hangs from the mitten's centre, so aim
   at the point minus its own offset (a cup whose rim is 40 units above the hand: [mouth x, mouth y + 40·s]).

   To add a character: write another entry in SHAPES (copy `kid` and change the numbers: sx/sy the shoulder, hipX the
   hip, body and head outlines, eyes [x, y, rx, ry], mouth [x, y], slide how far the face moves, hair [colour, path],
   optional glasses/hat/extra/legH/armH/browUp/cheeks/chin), then a one-line builder like kidPuppet below. A grown-up is a taller
   body (legH 96, sy and the head moved up) with longer arms (armH 100 reaches a table). Colours (coat, stripe, pants, skin, cuff) are options of the builder, so one shape
   serves many characters. A four-legged animal goes on the rig of section 3 (it stands in profile beside these figures
   well enough: the template's scene1 has the cat walk in with the kid); anything else not built like a kid gets its own
   builder with the same contract (build in g, bakeAll(g), return { g, aim, point, pose(o, f) }) — see spKid for the
   pattern; aimArm and rotPt below do the geometry for any shoulder and head. */
'use strict';
const SP_INK = '#1d1a1a';
// How far a shut eye's lid comes down: .9 leaves the lid line showing (a full lid, 1, leaves two blank skin ovals).
const SP_SHUT = window.SP_SHUT ?? .9;
// Mouths, centred on the mouth point: Rhubarb shapes A–H and X (mouths.py writes them), plus expressions. They open downward, like the show's.
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
  // a kid: big round head, bowl of dark hair, thin body. Copy this entry for the next character.
  kid: { sx: 54, sy: -146, hipX: 18, legW: 26, shoe: 20, body: 'M-44,-166 C-64,-150 -68,-78 -62,-50 Q-30,-36 0,-36 Q30,-36 62,-50 C68,-78 64,-150 44,-166 Z',
    head: [0, -246, 92, 86], neck: -158, eyes: [24, -254, 20, 25], mouth: [0, -196], cheeks: null, slide: 28, glasses: 0,
    hair: ['#2a1f1a', 'M-90,-258 C-94,-320 -56,-336 0,-336 C56,-336 94,-320 90,-258 L72,-280 Q0,-296 -72,-280 Z'] },
};

let spClip = 0;
// A point rotated by deg about (cx, cy), SVG-style (y down, + clockwise).
const rotPt = ([x, y], deg, cx = 0, cy = 0) => { const a = deg * Math.PI / 180, dx = x - cx, dy = y - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; };
// The arm angle that points a hand at [px, py] (parent coordinates) for pose o. pin is the shoulder in the puppet's units,
// pivot the lean's centre, drop the body's shift (seated), rest the arm's rest angle, len the hand's distance from the shoulder.
function aimArm(o, side, [px, py], { pin, pivot, drop = 0, rest, len }) {
  const s = o.s ?? 1, [qx, qy] = rotPt(pin, o.lean || 0, ...pivot);
  const sx = (o.x || 0) + s * qx, sy = (o.y || 0) + s * (qy + (o.bob || 0) + drop);
  const th = Math.atan2(-(px - sx), py - sy) * 180 / Math.PI - (o.lean || 0);
  const far = Math.hypot(px - sx, py - sy) / (len * s), arm = side === 'L' ? th - rest : -rest - th, reach = Math.min(1.25, Math.max(.6, far));
  return { arm, reach, far, shoulder: [sx, sy], ['arm' + side]: arm, ['reach' + side]: reach };
}
const REST_SP = { x: 0, y: 0, s: 1, look: 0, eyeX: 0, eyeY: 0, lids: 0, shut: false, mouth: 'X', brow: 0, headR: 0, headY: 0, lean: 0, bob: 0, squash: 0,
  armL: 0, armR: 0, reachL: 1, reachR: 1, armFrontL: undefined, armFrontR: undefined, legL: 0, legR: 0, sit: false, hold: null, holdL: null };
// holds: { key: svg } drawn in the hand of the screen-right arm (hold) or screen-left arm (holdL), at the mitten centre
function spKid(parent, shape, { skin = '#f7d9bb', coat = UNIFORM.coat, stripe = UNIFORM.stripe, pants = UNIFORM.pants, cuff = null, holds = {} } = {}) {
  const S = typeof shape === 'string' ? SHAPES[shape] : shape, g = mk('g', {}, parent), id = 'spc' + (++spClip);
  const legH = S.legH || 46, armH = S.armH || 64, hand = armH + 8, [hx, hy, hrx, hry] = S.head, [ex, ey, erx, ery] = S.eyes, [mx, my] = S.mouth;
  const browY = ey - ery - (S.browUp ?? 12), R = side => side === 'R' ? 1 : -1;
  // a sleeve, then a knitted cuff and a mitten with its thumb towards the body; the mitten slides along the sleeve (reach)
  const arm = side => `<g data-p="arm${side}"><g data-p="sleeve${side}"><g filter="url(#paper)"><rect x="-14" y="-6" width="28" height="${armH}" rx="13" fill="${coat}"/>
      <path d="M${7 * R(side)},-2 v${armH - 8}" stroke="${stripe}" stroke-width="5"/></g></g>
      <g data-p="mitt${side}"><g filter="url(#paper)"><rect x="-16" y="${hand - 24}" width="32" height="10" rx="4" fill="${cuff || coat}"/>
        <path d="M-10,${hand - 23} v8 M-3,${hand - 23} v8 M4,${hand - 23} v8 M11,${hand - 23} v8" stroke="#00000030" stroke-width="2"/>
        <rect x="-17" y="${hand - 16}" width="34" height="34" rx="15" fill="#f2efe6"/><ellipse cx="${-17 * R(side)}" cy="${hand - 6}" rx="7" ry="10" fill="#f2efe6"/>
        <path d="M${-9 * R(side)},${hand + 4} q${9 * R(side)},6 ${18 * R(side)},0" stroke="#cfc9bb" stroke-width="2" fill="none"/></g></g>
      ${Object.entries(holds).map(([k, s]) => `<g data-p="hold${side}_${k}" transform="translate(0,${hand})">${s}</g>`).join('')}</g>`;
  const leg = side => `<g data-p="leg${side}"><g filter="url(#paper)"><rect x="${-S.legW / 2}" y="0" width="${S.legW}" height="${legH}" rx="6" fill="${pants}"/>
      <ellipse cx="${6 * R(side)}" cy="${legH - 2}" rx="${S.shoe}" ry="11" fill="#1f1d1d"/></g></g>`;
  // seated on a seat of a given height: a shin that stretches down from the knee and a shoe of its own, so the shoe never stretches
  const shin = side => `<g data-p="leg${side}S"><g data-p="shin${side}"><g filter="url(#paper)"><rect x="${-S.legW / 2}" y="0" width="${S.legW}" height="50" rx="6" fill="${pants}"/></g></g>
      <g data-p="shoe${side}"><g filter="url(#paper)"><ellipse cx="${6 * R(side)}" cy="0" rx="${S.shoe}" ry="11" fill="#1f1d1d"/></g></g></g>`;
  // the thighs seen end on: a lap and two knees towards us, which is what makes a figure from the front read as sitting
  const lap = `<g data-p="lap"><g filter="url(#paper)"><rect x="${-S.hipX * 1.5 - S.legW / 2 - 10}" y="${-legH - 2}" width="${3 * S.hipX + S.legW + 20}" height="26" rx="13" fill="${pants}"/>
      ${[-1, 1].map(k => `<ellipse cx="${k * S.hipX * 1.5}" cy="${-legH + 20}" rx="${S.legW * .8}" ry="19" fill="${pants}"/><ellipse cx="${k * S.hipX * 1.5 - 3}" cy="${-legH + 13}" rx="${S.legW * .42}" ry="7" fill="#ffffff" opacity=".13"/>
        <path d="M${k * S.hipX * 1.5 - S.legW * .7},${-legH + 30} q${S.legW * .7},10 ${S.legW * 1.4},0" stroke="#00000033" stroke-width="3" fill="none"/>`).join('')}</g></g>`;
  const eye = sx => `<ellipse cx="${sx * ex}" cy="${ey}" rx="${erx}" ry="${ery}"`;
  // a soft shadow on the ground, a little to the right: the painted sets are lit from the left
  g.innerHTML = `<ellipse data-p="shadow" cx="${S.sx * .18}" cy="-2" rx="${S.sx + 34}" ry="16" fill="url(#spShadow)"/><g data-p="all"><g data-p="legs">${leg('L')}${leg('R')}</g><g data-p="legsS">${shin('L')}${shin('R')}</g>
    <g data-p="body"><g filter="url(#paper)"><path d="${S.body}" fill="${coat}"/>
      <path d="M-24,${S.sy - 22} L0,${S.sy + 8} L24,${S.sy - 22}" fill="none" stroke="${stripe}" stroke-width="7" stroke-linejoin="round"/>
      ${S.extra || `<path d="M0,${S.sy + 8} V-40" stroke="#26478f" stroke-width="3"/>`}</g></g>
    ${lap}${arm('L')}${arm('R')}
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
        <path data-p="browL" d="M${-ex - 16},${browY} L${-ex + 14},${browY + 6}" stroke="${SP_INK}" stroke-width="4" stroke-linecap="round"/>
        <path data-p="browR" d="M${ex + 16},${browY} L${ex - 14},${browY + 6}" stroke="${SP_INK}" stroke-width="4" stroke-linecap="round"/>
        <use class="mouth" href="#spX" transform="translate(${mx},${my})"/></g></g>
      <g data-p="hair"><g filter="url(#paper)"><path d="${S.hair[1]}" fill="${S.hair[0]}"/>${S.hat || ''}</g></g></g></g>`;
  bakeAll(g);
  const P = pieces(g), holdKeys = Object.keys(holds);
  const legY = -(legH + 6), ery2 = ery * 2;
  // sit: H puts the hip just over a seat H units up (the body comes down by drop; a seat above legH - 12 counts as that
  // high, so a seated figure is never taller than it stands); sit: true leaves the body where it stands
  const seatH = o => typeof o.sit === 'number' && o.sit > 0 ? Math.min(o.sit, legH - 12) : 0;
  const drop = o => seatH(o) && legH - seatH(o) - 12;
  const aim = (o, side, pt) => { o = { ...REST_SP, ...o };
    return aimArm(o, side, pt, { pin: [S.sx * R(side), S.sy], pivot: [0, -legH], drop: drop(o), rest: 24, len: hand }); };
  const LOCAL = { mouth: [[mx, my], 1], chin: [[hx, hy + hry], 0], capL: [[hx - hrx + 6, hy - hry * .45], 0], capR: [[hx + hrx - 6, hy - hry * .45], 0] };
  const point = (o, name) => { o = { ...REST_SP, ...o };
    let [pt, feat] = Array.isArray(name) ? [name, 0] : LOCAL[name];
    pt = rotPt([pt[0] + feat * o.look * S.slide, pt[1]], o.headR, 0, S.neck);
    pt = rotPt([pt[0], pt[1] + o.headY], o.lean, 0, -legH);
    return [o.x + o.s * pt[0], o.y + o.s * (pt[1] + o.bob + drop(o))]; };
  return { g, S, aim, point, pose(o, f) {
    o = { ...REST_SP, ...o };
    const j = k => .35 * jit(f >> 1, k);   // the animator's hand: small, and held for two frames
    tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + j(2) * .6).toFixed(1)}) scale(${o.s})`);
    // squash > 0 flattens the figure on its feet (a landing, a sigh)
    const dy = drop(o), seated = seatH(o) > 0, Ls = seatH(o) + 12;
    tf(P.all, `translate(0,${(o.bob + dy).toFixed(1)}) scale(${(1 + .5 * o.squash).toFixed(3)},${(1 - o.squash).toFixed(3)}) rotate(${o.lean.toFixed(2)},0,${-legH}) rotate(${(j(3) * .4).toFixed(2)})`);
    vis(P.legs, !o.sit); vis(P.legsS, seated); vis(P.lap, seated); vis(P.shadow, !o.sit || seated);
    if (seated) for (const k of 'LR') { tf(P['shin' + k], `scale(1,${((Ls - 4) / 50).toFixed(3)})`); tf(P['shoe' + k], `translate(0,${Ls - 2})`); }
    for (const [L, Rt, k] of [[P.legL, P.legR, 1], [P.legLS, P.legRS, 1.5]]) {   // the legs hang plumb whatever the lean; seated, from the knees, apart
      tf(L, `translate(${-S.hipX * k},${legY}) rotate(${(o.legL - o.lean + j(4) * .5).toFixed(2)})`);
      tf(Rt, `translate(${S.hipX * k},${legY}) rotate(${(-o.legR - o.lean + j(5) * .5).toFixed(2)})`); }
    tf(P.armL, `translate(${-S.sx},${S.sy}) rotate(${(24 + o.armL + j(6) * .6).toFixed(2)})`);
    tf(P.armR, `translate(${S.sx},${S.sy}) rotate(${(-24 - o.armR + j(7) * .6).toFixed(2)})`);
    // a hand above the chin and in from its shoulder by more than half a mitten comes in front of the head; both arms
    // are placed in one fixed order (L under R) from the pose alone, so a seek draws what playback draws
    const front = (a, r) => (a *= Math.PI / 180, S.sy + hand * r * Math.cos(a) < hy + hry + 24 + o.headY && hand * r * Math.sin(a) < -17);
    const fL = o.armFrontL ?? front(24 + o.armL, o.reachL), fR = o.armFrontR ?? front(24 + o.armR, o.reachR);
    if (P.all._arms !== `${fL} ${fR}`) { P.all._arms = `${fL} ${fR}`;
      for (const [a, up] of [[P.armL, fL], [P.armR, fR]]) up ? P.all.appendChild(a) : P.all.insertBefore(a, P.head); }
    for (const sd of 'LR') { const r = o['reach' + sd]; tf(P['sleeve' + sd], `scale(1,${r.toFixed(3)})`); tf(P['mitt' + sd], `translate(0,${(hand * (r - 1)).toFixed(1)})`); }
    for (const k of holdKeys) { vis(P[`holdR_${k}`], o.hold === k); vis(P[`holdL_${k}`], o.holdL === k);
      // a held thing stays upright whatever the arm does
      tf(P[`holdR_${k}`], `translate(0,${(hand * o.reachR).toFixed(1)}) rotate(${(24 + o.armR).toFixed(2)})`); tf(P[`holdL_${k}`], `translate(0,${(hand * o.reachL).toFixed(1)}) rotate(${(-24 - o.armL).toFixed(2)})`); }
    tf(P.head, `translate(0,${o.headY.toFixed(1)}) rotate(${(o.headR + j(8) * .6).toFixed(2)},0,${S.neck})`);
    const lx = o.look * S.slide;
    tf(P.feat, `translate(${lx.toFixed(1)},0)`); tf(P.hair, `translate(${(lx * .25).toFixed(1)},0)`);
    tf(P.pupils, `translate(${(o.eyeX * erx * .5).toFixed(1)},${(o.eyeY * ery * .45).toFixed(1)})`);
    tf(P.lids, `translate(0,${((o.shut ? SP_SHUT : o.lids) * ery2).toFixed(1)})`);
    const b = o.brow;
    vis(P.browL, b !== 0); vis(P.browR, b !== 0);
    tf(P.browL, `rotate(${(-14 * b).toFixed(1)},${-ex},${browY + 3})`); tf(P.browR, `rotate(${(14 * b).toFixed(1)},${ex},${browY + 3})`);
    const m = g.querySelector('.mouth'), href = '#sp' + (o.mouth || 'X'); if (m._m !== href) m.setAttribute('href', m._m = href);
  } };
}
const kidPuppet = (p, o) => spKid(p, 'kid', o);   // kidPuppet(parent, { coat, stripe, pants, skin, holds: { key: svg } })

// A walk in the show's manner: the figure bobs on twos and the stubby legs scissor. (For feet that never slide on the
// ground, use walk() in paper.js, which also tells how far the hip has travelled.)
function spWalk(q) { const k = Math.floor(q * FPS / 2) % 2 ? 1 : -1; return { legL: 16 * k, legR: -16 * k, bob: k > 0 ? -6 : 0, armL: 8 * k, armR: -8 * k, k }; }
// A side step for a figure that faces us while it crosses the frame (step, close, step, close): one foot stays planted
// while the hip rides over it and the other opens out or closes in, so both legs lean outward by the same angle and the
// ankles never cross. (walk() in paper.js is for a profile figure: its near/far legs on a front figure cross every
// other step.) tau seconds into the walk, `period` s per step; L the hip pin to the sole (the shape's legH + 6), A the widest angle in
// degrees. d is how far the hip has travelled, always >= 0: x = x0 + d * s going right, x0 - d * s going left; give
// bob: drop. Sample tau on twos (Math.floor(q * 6) / 6) like everything else and keep the period a whole number of
// 1/3 s, so a drawing lands on the widest stance between the step and the close and only one foot moves at a time.
function spStep(tau, { L = 52, A = 20, period = 2 / 3 } = {}) {
  tau = Math.max(0, tau);
  const n = Math.floor(tau / period), u = tau / period - n, D = 2 * L * Math.sin(A * Math.PI / 180);
  const a = Math.asin(D * Math.min(u, 1 - u) / L) * 180 / Math.PI;
  return { legL: a, legR: a, d: D * (n + u), drop: L * (1 - Math.cos(a * Math.PI / 180)), u };
}


/* ---------- 2. storybook figures: a side set and a front set ----------
   A figure is drawn at its hip (0, 0) facing right, its feet at y 170 (hipOn(gy, s) puts them on ground y gy), as two
   sets of paper pieces: a profile set (data-p "body", holding "headP") and a front set ("bodyF", "headF"). The front
   set shows whenever head is 'F' or |turn| < .55, so a figure always faces us as a whole: turn tweened from 1 to -1
   squashes the side figure, shows the whole front figure through the thin middle and comes out mirrored.
   puppet(parent, svg, rest, pose) builds one from its SVG; common(P, o, j, g, rig) does what every figure does with
   its pose (place and jitter, turn, the profile legs and near arm, the two front arms, the head, eyes and mouth):
   rig = { neck, sh, el (the near shoulder and elbow pins), fsh (the front right shoulder), fup (its upper arm length),
   knee (the knee pin's y in legPiece), waist (the y that lean bends about, default 0) }. The common keys (REST_FIG):
   x y s turn; near, far (the profile legs, degrees, + forward) and kNear, kFar (knee bends); ua, fa (the near arm's
   shoulder and elbow); rua, rfa, lua, lfa (the front figure's screen-right and screen-left arms; 0 hangs down); head
   ('P' | 'F'), headR (degrees), nod (+ lowers the head); mouth, shut (blink: blinking(q, times) in paper.js); hop
   (+ moves the whole figure down, - up; the arc of a hop is yours); lean; brow.
   A face's live parts are found by class: .eyeO (open eyes) / .eyeC (shut) and a <use class="mouth" href="#mX">.

   figurePuppet(parent, colours) is the example, a child in a coat and a hat; one builder serves many characters
   through its colours: { skin, coat, coatFar, legs, legsFar, shoe, hair, hat (null: no hat), band, cheek, skirt
   (true: a long coat over the thighs, false: a short one over trousers), holds: { key: svg } }. Its keys besides
   the common ones:
   look      the pupils, -1 … 1 (profile: + towards the way it faces; front: + to screen right)
   brow      0 none (the brows are hidden: earlier shots keep their faces), > 0 worried (inner ends up), < 0 cross
   lean      bends it at the waist, degrees forward (profile only): 60–80 reaches the ground
   crouch    0 … 1: knees up and hip down, the feet kept on the ground (a duck, a bend to pick something up, the squash
             before and after a hop)
   fua, ffa  the far arm (profile), shoulder and elbow like ua / fa; null hides it (it hangs behind the body at rest).
             To pick something off the ground: { lean: 60, crouch: .7, fua: -50, ffa: 10 } puts the far hand there
   hat       true / false: the hat on its head. The hair is drawn under the hat on both heads, so a hat that comes off
             leaves hair, never a bald head (the hat on its own is hatSVG, for a hand or the ground)
   hold      a key of holds, shown in the near hand (profile) and the screen-right hand (front), kept upright; each
             svg is drawn around the hand's centre (0, 0)
   To add a character with another build, copy figurePuppet, change its paths and pins, and keep its pose to common()
   plus the keys the character needs. */
// A profile leg: a thigh and a shin on a knee pin (y thigh - 8), with its shoe.
function legPiece(id, sock, shoe, thigh = 94, shin = 82, w = 18) {
  const k = thigh - 8, f = k + shin - 10;
  return `<g data-p="${id}"><g filter="url(#paper)"><rect x="${-w / 2}" y="-4" width="${w}" height="${thigh}" rx="8" fill="${sock}"/></g>
    <g data-p="${id}k"><g filter="url(#paper)"><rect x="${-w / 2 + 1}" y="${k - 6}" width="${w - 2}" height="${shin}" rx="7" fill="${sock}"/><path d="M-10,${f} h22 q13,0 13,10 v4 h-37 z" fill="${shoe}"/></g>${pinAt(0, k)}</g></g>`;
}
// A front arm hanging from its shoulder (x, y): sleeve, forearm, hand; extra goes in the hand's group.
const frontArm = (id, x, y, sleeve, skin, up = 60, fore = 56, extra = '') => `<g data-p="${id}"><g filter="url(#paper)"><rect x="${x - 8.5}" y="${y - 6}" width="17" height="${up + 6}" rx="8" fill="${sleeve}"/></g>
  <g data-p="${id}f"><g filter="url(#paper)"><rect x="${x - 6.5}" y="${y + up - 6}" width="13" height="${fore}" rx="6" fill="${skin}"/><circle cx="${x}" cy="${y + up + fore - 4}" r="9.5" fill="${skin}"/>${extra}</g>
  ${pinAt(x, y + up - 2)}</g>${pinAt(x, y)}</g>`;
function armsF(P, o, j, sx, sy, up) {   // the two front arms: r = screen right, l = screen left; 0 hangs down
  tf(P.rArm, `rotate(${(o.rua + j(21) * .6).toFixed(2)},${sx},${sy})`); tf(P.rArmf, `rotate(${(o.rfa + j(22) * .6).toFixed(2)},${sx},${sy + up - 2})`);
  tf(P.lArm, `rotate(${(o.lua + j(23) * .6).toFixed(2)},${-sx},${sy})`); tf(P.lArmf, `rotate(${(o.lfa + j(24) * .6).toFixed(2)},${-sx},${sy + up - 2})`);
}
// How far a jaw opens for each mouth shape of the cues (a jaw on a pin: the four-legged rig, a snout).
const JAW = { X: 0, A: 0, B: .25, C: .45, D: .85, E: .6, F: .3, G: .2, H: .35 };

function puppet(parent, svg, rest, pose) {
  const g = mk('g', {}, parent);
  g.innerHTML = svg;
  bakeAll(g);
  const P = pieces(g);
  return { g, P, pose(o, f) { o = { ...rest, ...o }; pose(P, o, k => jit(f, k), g); } };
}
function common(P, o, j, g, { neck, sh, el, fsh, fup, knee, waist = 0 }) {
  const front = o.head === 'F' || Math.abs(o.turn) < .55;
  tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + o.hop + j(2) * .6).toFixed(1)}) scale(${o.s}) rotate(${(j(3) * .5).toFixed(2)})`);
  tf(P.body, `scale(${o.turn.toFixed(3)},1)`); vis(P.body, !front); vis(P.bodyF, front);
  if (P.upper) tf(P.upper, `rotate(${o.lean.toFixed(2)},0,${waist})`);
  if (P.legN) {
    tf(P.legN, `rotate(${(o.near + j(4) * .6).toFixed(2)})`); tf(P.legNk, `rotate(${o.kNear.toFixed(2)},0,${knee})`);
    tf(P.legF, `rotate(${(o.far + j(5) * .6).toFixed(2)})`); tf(P.legFk, `rotate(${o.kFar.toFixed(2)},0,${knee})`);
  }
  const ua = o.ua + j(7) * .6, fa = o.fa + j(8) * .6;
  tf(P.arm, `rotate(${ua.toFixed(2)},${sh[0]},${sh[1]})`); tf(P.fore, `rotate(${fa.toFixed(2)},${el[0]},${el[1]})`);
  armsF(P, o, j, fsh[0], fsh[1], fup);
  const hr = `translate(0,${o.nod.toFixed(1)}) rotate(${(o.headR + j(9) * .7).toFixed(2)},${neck[0]},${neck[1]})`;
  tf(P.headP, hr); tf(P.headF, hr);
  vis(P.headP, !front); vis(P.headF, front);
  face(front ? P.headF : P.headP, o);
  return { front, ua, fa };
}
// Show or hide a piece on both sets at once: both(P, 'hat', on) for data-p "hatP" and "hatF".
const both = (P, k, on) => { if (P[k + 'P']) vis(P[k + 'P'], on); if (P[k + 'F']) vis(P[k + 'F'], on); };
const REST_FIG = { x: 0, y: 0, s: 1, turn: 1, near: 0, far: 0, kNear: 0, kFar: 0, lean: 0, ua: 6, fa: -6, rua: 6, rfa: -4, lua: -6, lfa: 4,
  head: 'P', headR: 0, nod: 0, mouth: 'X', shut: false, hop: 0, brow: 0 };

// Where a figure's hip goes for its feet on ground y gy at scale s (feet: the feet's y in the figure, 170 here).
const hipOn = (gy, s, feet = 170) => gy - feet * s;
// A walk from x0 to the right (dir -1: to the left) that stops cleanly after `steps` steps: walker(x0, s)(tau) gives
// walk()'s keys and x; pose({ ...w, y: hipOn(gy, s) + w.drop * s }). It stops where both legs pass the vertical and
// sets the lifted foot down beside the other over a quarter second, so the figure ends standing, not mid-stride.
function walker(x0, s, opts = {}, dir = 1, steps = Infinity) {
  const half = (opts.period || 1) / 2, end = steps * half;
  return tau => { const w = walk(Math.min(tau, end), opts), k = tau > end ? 1 - ease((tau - end) / .25) : 1;
    return { ...w, kNear: w.kNear * k, kFar: w.kFar * k, x: x0 + dir * w.d * s }; };
}
// One big, deliberate step forward (off a path onto the grass), u 0 … 1 over the step: the near knee lifts high, the
// foot comes down ahead and the hip follows, sinking into the stride (drop) while the back knee bends so the back foot
// stays on the ground; at u 1 both feet are down. Like walk(): const b = bigStep(u);
// fig.pose({ ...b, x: x0 + b.d * s, y: hipOn(gy, s) + b.drop * s, … }).
function bigStep(u, L = 166, reach = 30) {
  const e = ease(u), lift = Math.sin(Math.PI * Math.min(1, u * 1.25)), r = Math.PI / 180;
  const near = -reach * Math.sin(Math.PI * e / 2) - 40 * lift * (1 - e), far = reach * e * .7;
  // hip height h·L: down to the stride's (cos reach) as the step lands; the back leg (thigh ≈ shin ≈ L/2) bends to reach it
  const h = Math.cos(reach * e * r), kFar = Math.max(0, Math.acos(Math.min(1, 2 * h - Math.cos(far * r))) / r - far);
  return { near, far, kNear: 75 * lift, kFar, d: 2 * L * Math.sin(reach * Math.PI / 360) * e * 1.6, drop: L * (1 - h) };
}

// A hat on its own, drawn where it sits on the profile head at puppet scale 1 (for a hand, a peg or the ground).
const hatSVG = (hat = '#c8322f', band = '#8a2420') => `<g filter="url(#paper)"><path d="M-30,-222 C-28,-262 40,-268 50,-222 Z" fill="${hat}"/><rect x="-40" y="-228" width="102" height="11" rx="5" fill="${band}"/></g>`;
const REST_FIGURE = { ...REST_FIG, look: 0, fua: null, ffa: -10, crouch: 0, hat: true, hold: null };
function figurePuppet(parent, { skin = '#f6d2b5', coat = '#3d6fa8', coatFar = '#335d8d', legs = '#f2ede1', legsFar = '#d8d1c2', shoe = '#3a2418',
  hair = '#6b3b22', hat = '#c8322f', band = '#8a2420', cheek = '#ef9a8a', skirt = true, holds = {} } = {}) {
  const ink = '#22150e', held = (side, x, y) => Object.entries(holds).map(([k, s]) => `<g data-p="hold${side}_${k}" transform="translate(${x},${y})">${s}</g>`).join('');
  const lower = skirt ? 'M-38,-46 L38,-46 C48,0 58,30 64,56 Q0,70 -64,56 C-58,30 -48,0 -38,-46 Z' : 'M-36,-46 L36,-46 L40,10 Q0,18 -40,10 Z';
  const lowerF = skirt ? 'M-40,-46 L40,-46 C52,0 62,30 68,56 Q0,70 -68,56 C-62,30 -52,0 -40,-46 Z' : 'M-38,-46 L38,-46 L42,10 Q0,18 -42,10 Z';
  const fig = puppet(parent, `<g data-p="body">
    ${legPiece('legF', legsFar, shoe)}${legPiece('legN', legs, shoe)}
    <g filter="url(#paper)"><path d="${lower}" fill="${coat}"/></g>
    <g data-p="upper">
      <g data-p="armF"><g filter="url(#paper)"><rect x="-4.5" y="-134" width="17" height="62" rx="8" fill="${coatFar}"/></g>
        <g data-p="foreF"><g filter="url(#paper)"><rect x="-2" y="-80" width="12" height="54" rx="6" fill="${skin}"/><circle cx="4" cy="-26" r="9" fill="${skin}"/></g>${pinAt(4, -76)}</g>${pinAt(4, -128)}</g>
      <g filter="url(#paper)"><path d="M-28,-128 L26,-128 L34,-42 L-34,-42 Z" fill="${coat}"/><rect x="-8" y="-150" width="16" height="28" fill="${skin}"/>
        <path d="M-30,-132 Q0,-142 30,-130 L28,-118 Q0,-126 -30,-118 Z" fill="${coatFar}"/></g>
      <g data-p="headP"><g filter="url(#paper)">
        <path d="M-44,-186 C-48,-244 34,-256 52,-212 L30,-204 L-6,-206 L-10,-160 L-34,-152 C-46,-162 -44,-176 -44,-186 Z" fill="${hair}"/>
        <circle cx="14" cy="-192" r="40" fill="${skin}"/><circle cx="53" cy="-189" r="7" fill="${skin}"/>
        <path d="M-28,-200 C-30,-238 20,-250 54,-210 Q32,-222 12,-206 Q-4,-216 -14,-198 Q-20,-186 -16,-172 L-28,-176 Z" fill="${hair}"/>
        <circle cx="31" cy="-176" r="8.5" fill="${cheek}" opacity=".8"/></g>
        <g data-p="lookP"><g class="eyeO"><ellipse cx="34" cy="-198" rx="4.5" ry="6.2" fill="${ink}"/></g></g>
        <g class="eyeC"><path d="M29,-197 Q34,-193 39,-197" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
        <path data-p="browP" d="M26,-209 L41,-208" stroke="${ink}" stroke-width="3.6" stroke-linecap="round"/>
        <use class="mouth" href="#mX" transform="translate(41,-172) scale(.85)"/>
        ${hat ? `<g data-p="hatP">${hatSVG(hat, band)}</g>` : ''}${pinAt(0, -146)}</g>
      <g data-p="arm"><g filter="url(#paper)"><rect x="6" y="-134" width="17" height="64" rx="8" fill="${coat}"/></g>
        <g data-p="fore"><g filter="url(#paper)"><rect x="8.5" y="-80" width="12" height="54" rx="6" fill="${skin}"/><circle cx="14.5" cy="-26" r="9" fill="${skin}"/></g>
          ${held('N', 14.5, -26)}${pinAt(14.5, -76)}</g>${pinAt(14.5, -128)}</g></g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><rect x="-21" y="${skirt ? 46 : 0}" width="16" height="${skirt ? 114 : 160}" rx="7" fill="${legs}"/><rect x="5" y="${skirt ? 46 : 0}" width="16" height="${skirt ? 114 : 160}" rx="7" fill="${legs}"/>
      <ellipse cx="-13" cy="164" rx="12" ry="7" fill="${shoe}"/><ellipse cx="13" cy="164" rx="12" ry="7" fill="${shoe}"/></g>
    <g filter="url(#paper)"><path d="${lowerF}" fill="${coat}"/></g>
    <g filter="url(#paper)"><path d="M-30,-128 L30,-128 L38,-42 L-38,-42 Z" fill="${coat}"/><rect x="-8" y="-150" width="16" height="28" fill="${skin}"/>
      <path d="M-32,-132 Q0,-144 32,-132 L30,-120 Q0,-130 -30,-120 Z" fill="${coatFar}"/></g>
    ${frontArm('lArm', -30, -126, coat, skin, 54, 50)}
    ${frontArm('rArm', 30, -126, coat, skin, 54, 50, held('F', 30, -26))}
  </g>
  <g data-p="headF"><g filter="url(#paper)">
    <path d="M-52,-168 C-62,-238 62,-238 52,-168 Q40,-160 30,-168 L-30,-168 Q-40,-160 -52,-168 Z" fill="${hair}"/><circle cx="0" cy="-188" r="42" fill="${skin}"/>
    <path d="M-44,-196 C-46,-250 46,-250 44,-196 Q24,-222 0,-216 Q-24,-222 -44,-196 Z" fill="${hair}"/>
    <circle cx="-23" cy="-176" r="8" fill="${cheek}" opacity=".8"/><circle cx="23" cy="-176" r="8" fill="${cheek}" opacity=".8"/></g>
    <g data-p="lookF"><g class="eyeO"><ellipse cx="-14" cy="-196" rx="4.5" ry="6.2" fill="${ink}"/><ellipse cx="14" cy="-196" rx="4.5" ry="6.2" fill="${ink}"/></g></g>
    <g class="eyeC"><path d="M-19,-195 Q-14,-191 -9,-195 M9,-195 Q14,-191 19,-195" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
    <path data-p="browL" d="M-22,-208 L-7,-207" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/><path data-p="browR" d="M7,-207 L22,-208" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/>
    <use class="mouth" href="#mX" transform="translate(0,-166)"/>
    ${hat ? `<g data-p="hatF"><g filter="url(#paper)"><path d="M-46,-224 C-44,-276 44,-276 46,-224 Z" fill="${hat}"/><ellipse cx="0" cy="-224" rx="62" ry="9" fill="${band}"/></g></g>` : ''}</g>`,
  REST_FIGURE, (P, o, j, g) => {
    if (o.crouch) {   // the hip sinks as far as the folded legs shorten, so the feet stay on the ground
      const c = o.crouch, r = Math.PI / 180, n = { near: o.near - 62 * c, far: o.far - 50 * c, kNear: o.kNear + 104 * c, kFar: o.kFar + 100 * c };
      const reach = (a, k) => 86 * Math.cos(a * r) + 86 * Math.cos((a + k) * r), drop = 172 - Math.max(reach(n.near, n.kNear), reach(n.far, n.kFar));
      o = { ...o, ...n, hop: o.hop + Math.max(0, drop) * o.s };
    }
    const { front, ua, fa } = common(P, o, j, g, { neck: [0, -146], sh: [14.5, -128], el: [14.5, -76], fsh: [30, -126], fup: 54, knee: 86, waist: -44 });
    tf(P.lookP, `translate(${(3 * o.look).toFixed(1)},0)`); tf(P.lookF, `translate(${(4 * o.look).toFixed(1)},0)`);
    for (const k of ['browP', 'browL', 'browR']) vis(P[k], o.brow !== 0);
    tf(P.browP, `rotate(${(-16 * o.brow).toFixed(1)},26,-209)`);
    tf(P.browL, `rotate(${(-16 * o.brow).toFixed(1)},-22,-208)`); tf(P.browR, `rotate(${(16 * o.brow).toFixed(1)},22,-208)`);
    both(P, 'hat', o.hat);
    vis(P.armF, o.fua !== null && !front);
    if (o.fua !== null) { tf(P.armF, `rotate(${(o.fua + j(10) * .6).toFixed(2)},4,-128)`); tf(P.foreF, `rotate(${(o.ffa + j(11) * .6).toFixed(2)},4,-76)`); }
    for (const k of Object.keys(holds)) {   // a held thing stays upright whatever the arm and the bend do
      vis(P[`holdN_${k}`], o.hold === k); vis(P[`holdF_${k}`], o.hold === k);
      tf(P[`holdN_${k}`], `translate(14.5,-26) rotate(${(-(o.lean + ua + fa)).toFixed(2)})`);
      tf(P[`holdF_${k}`], `translate(30,-26) rotate(${(-(o.rua + o.rfa)).toFixed(2)})`);
    }
  });
  return fig;
}

/* ---------- moving along the ground (kinds 2 and 3) ---------- */
// keys [[t, x], …] on the scene clock, eased between keys. Returns x, the distance travelled in the puppet's own units
// (d: a four-legged puppet's pose({ d }) plants its feet with it) and stand (1 at rest, blending to 0 within a quarter
// second of setting off and back to 1 after stopping).
function route(q, keys, s = 1) {
  let x = keys[0][1], d = 0, moving = false, since = 1e9;
  for (let i = 1; i < keys.length; i++) {
    const [t0, a] = keys[i - 1], [t1, b] = keys[i];
    if (q >= t1) { d += Math.abs(b - a) / s; x = b; if (a !== b) since = q - t1; continue; }
    if (q > t0 && a !== b) { const u = ease((q - t0) / (t1 - t0)); x = a + (b - a) * u; d += Math.abs(b - a) * u / s; moving = true; since = 0; }
    break;
  }
  const start = keys.find((k, i) => i && keys[i - 1][1] !== k[1] && q >= keys[i - 1][0] && q < k[0]);
  const into = start ? q - keys[keys.indexOf(start) - 1][0] : 1e9;
  const stand = moving ? Math.max(0, 1 - into / .25) : Math.min(1, since / .25);
  return { x, d, stand };
}
// A cut-out turned over in the shot: the turn key from face a to face b (1 right, -1 left) over four frames on twos,
// never quite flat. Turning on a cut (the next shot simply has the other turn) read best of all; use this when the
// turn has to happen on screen, in a wide shot.
const flipTurn = (q, t0, a, b) => { const k = Math.floor((q - t0) * FPS + 1e-6); return k < 0 ? a : k >= 4 ? b : [.5 * a, .12 * a, .12 * b, .5 * b][k]; };

/* ---------- 3. four-legged animals ----------
   Drawn in profile facing right, at the point on the ground under the body (0, 0); turn -1 faces left, and a turn
   tweened through 0 squashes the whole figure (never thinner than a third) and out mirrored, as a cut-out turned over
   on the table (flipTurn above does it in four frames).
   beast(parent, svg, geo, rest) is the rig: each leg is two pieces on pins solved to put its foot on a point, so a
   foot planted on the ground stays exactly there while the body rides over it. Walking and trotting come from the
   distance covered, not the clock: pose({ d }) with d in the puppet's own units, and the scene moves x by d·s in the
   facing direction (x = x0 + turn·s·d; route() above gives x and d together), so the feet never slide.
   Pose keys (REST_BEAST): x y s turn; d, gait ('walk': one foot at a time; 'trot': diagonal pairs), stand (0 … 1:
   blends every leg back to its rest place for a stop; route's stand); bob (+ down), tilt (the body about its centre,
   degrees); neck, nod (degrees about the neck and head pins); mouth (a cue shape: the jaw opens by JAW) or jaw (0 … 1,
   overrides it), chew (a number that grows with time works the jaw); shut (blink), lid (0 … 1, a sleepy lid), look
   (the pupil, -1 … 1 along the face), brow (> 0 tips it down to the nose: cross, determined; < 0 lifts it: worried,
   surprised); ear, tail (degrees: ear × 22, tail as given); legs: { nf: [dx, lift], … } moves a foot from where the
   gait puts it (a paw raised, a hoof testing the water). Any other true / false key shows or hides the piece of the
   same data-p name (a saddle cloth, a sack on the back, a tear): give its default in the rest.
   at(name) gives a named point of the drawn pose in the puppet's parent's coordinates: a leg's hip 'nf' 'ff' 'nh'
   'fh', its knee or hock 'nfk' …, its foot 'nfHoof' …, and every mark the drawing places (mark('at_<name>', x, y) in
   the svg: the cat has 'mouth', 'eye', 'head', 'back'), so a thing in its mouth or water at a knee lands where the
   picture is.
   geo: { hips: { nf: [x, y], ff, nh, fh }, up, low (the two leg pieces' lengths), L (stride), H (foot lift), body:
   [x, y] tilt centre, neck, head, jaw: [x, y] pins, jawOpen (degrees at jaw 1), ear, tail: [x, y] pins, rest: { nf: dx,
   … } each foot's rest place from under its hip, eye: [x, y], lidH (the lid's travel), lookX (the pupil's) }.
   Legs: nf near fore, ff far fore, nh near hind, fh far hind; a fore knee folds forward, a hind hock backward. The svg
   names its pieces: trunk (holding tail, neckG > headG > jaw, ear, eyeO, eyeC, pupil, optional lid and brow), and the
   four legs from legSVG, far legs before the trunk and near legs after it. catPuppet below is the example: copy it and
   its CAT_GEO for another animal (Little Horse's horses and water buffalo are built this way). */
const pf = (body, id = '') => `<g${id ? ` data-p="${id}"` : ''} filter="url(#paper)">${body}</g>`;
const mark = (id, x, y) => `<g data-p="${id}" transform="translate(${x} ${y})"></g>`;
// One leg: the upper piece (data-p id) and the lower one (id + 'k', on the knee pin at y up) with its hoof or paw, and
// the foot's mark (id + 'Hoof'). sock colours the lower leg's foot end.
function legSVG(id, up, low, wUp, wLow, col, hoof, sock = null) {
  const u = `<path d="M${-wUp / 2},-6 C${-wUp / 2},${up * .5} ${-wLow / 2 - 1},${up * .8} ${-wLow / 2},${up + 4} L${wLow / 2},${up + 4} C${wLow / 2 + 1},${up * .8} ${wUp / 2},${up * .5} ${wUp / 2},-6 Z" fill="${col}"/>`;
  const l = `<path d="M${-wLow / 2},-3 L${-wLow / 2 + 1},${low - 14} L${wLow / 2 - 1},${low - 14} L${wLow / 2},-3 Z" fill="${col}"/>`
    + (sock ? `<path d="M${-wLow / 2 + 1},${low - 34} L${-wLow / 2 + 1},${low - 12} L${wLow / 2 - 1},${low - 12} L${wLow / 2 - 1},${low - 34} Z" fill="${sock}"/>` : '')
    + `<path d="M${-wLow / 2 - 2},${low - 15} L${wLow / 2 + 4},${low - 15} L${wLow / 2 + 7},${low} L${-wLow / 2 - 3},${low} Z" fill="${hoof}"/>`;
  return `<g data-p="${id}">${pf(u)}<g data-p="${id}k" transform="translate(0 ${up})">${pf(l)}${pinAt(0, 0)}${mark(id + 'Hoof', 1, low)}</g>${pinAt(0, 0)}</g>`;
}
// Two-bone reach from a hip to a foot point (dx, dy from the hip, y down): the upper and lower piece angles in degrees
// (SVG rotate, 0 = straight down). bend +1 puts the joint forward (a fore knee), -1 backward (a hind hock).
function reach2(dx, dy, up, low, bend) {
  let D = Math.hypot(dx, dy); D = Math.min(up + low - .5, Math.max(Math.abs(up - low) + 1, D));
  const phi0 = Math.atan2(dx, dy), b = Math.acos(Math.max(-1, Math.min(1, (up * up + D * D - low * low) / (2 * up * D))));
  const p1 = phi0 + bend * b, kx = up * Math.sin(p1), ky = up * Math.cos(p1);
  const p2 = Math.atan2(dx - kx, dy - ky);
  return [-p1 * 180 / Math.PI, -(p2 - p1) * 180 / Math.PI];
}
// Where each foot is, relative to its rest place, at walk distance d: [dx, lift]. Walk: one foot at a time (lateral
// sequence); trot: diagonal pairs.
const GAITS = {
  walk: { phase: { nh: 0, nf: .25, fh: .5, ff: .75 }, beta: .64, bob: 2.5 },
  trot: { phase: { nh: 0, ff: 0, fh: .5, nf: .5 }, beta: .5, bob: 6 },
};
function gait(d, kind, L, H) {
  const G = GAITS[kind], out = {}, u0 = d / L;
  for (const k of ['nf', 'ff', 'nh', 'fh']) {
    const r = u0 + G.phase[k] - Math.floor(u0 + G.phase[k]), b = G.beta, s = L * b;
    if (r < b) out[k] = [s / 2 - s * (r / b), 0];
    else { const w = (r - b) / (1 - b); out[k] = [-s / 2 + s * ease(w), H * Math.sin(Math.PI * w)]; }
  }
  out.bob = kind === 'trot' ? -G.bob * Math.abs(Math.sin(2 * Math.PI * u0)) : -G.bob * (1 - Math.cos(4 * Math.PI * u0)) / 2;
  return out;
}
const REST_BEAST = { x: 0, y: 0, s: 1, turn: 1, d: 0, gait: 'walk', stand: 1, bob: 0, tilt: 0, neck: 0, nod: 0, mouth: 'X',
  jaw: null, chew: 0, shut: false, lid: 0, look: 0, brow: 0, ear: 0, tail: 0, legs: {} };
function beast(parent, svg, geo, rest) {
  const g = mk('g', {}, parent);
  g.innerHTML = svg;
  bakeAll(g);
  const P = pieces(g), R = { ...REST_BEAST, ...rest };
  const legs = ['nf', 'ff', 'nh', 'fh'], toggles = Object.keys(R).filter(k => typeof R[k] === 'boolean' && k !== 'shut' && P[k]);
  return { g, P,
    pose(o, f) {
      o = { ...R, ...o };
      const j = k => jit(f, k);
      const gt = gait(o.d, o.gait, geo.L, geo.H), st = Math.max(0, Math.min(1, o.stand));
      const bob = o.bob + gt.bob * (1 - st);
      const tn = Math.sign(o.turn || 1) * Math.max(.34, Math.abs(o.turn));   // flips through, never a sliver
      tf(g, `translate(${(o.x + j(1) * .7).toFixed(1)},${(o.y + j(2) * .5).toFixed(1)}) scale(${(o.s * tn).toFixed(4)},${o.s.toFixed(4)})`);
      // the body (with neck, head, tail) tilts about its centre and rides the bob; legs hang from the tilted hips
      const [cx, cy] = geo.body, a = o.tilt * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      tf(P.trunk, `translate(0,${bob.toFixed(1)}) rotate(${(o.tilt + j(3) * .3).toFixed(2)},${cx},${cy})`);
      for (const k of legs) {
        const [hx0, hy0] = geo.hips[k], hx = cx + (hx0 - cx) * ca - (hy0 - cy) * sa, hy = cy + (hx0 - cx) * sa + (hy0 - cy) * ca + bob;
        const [gx, gl] = gt[k], extra = o.legs[k] || [0, 0];
        const fx = hx0 + geo.rest[k] + gx * (1 - st) + extra[0], fy = -(gl * (1 - st)) - extra[1];
        const [a1, a2] = reach2(fx - hx, fy - hy, geo.up, geo.low, k[1] === 'f' ? 1 : -1);
        tf(P[k], `translate(${hx.toFixed(1)},${hy.toFixed(1)}) rotate(${(a1 + j(4) * .4).toFixed(2)})`);
        tf(P[k + 'k'], `translate(0,${geo.up}) rotate(${a2.toFixed(2)})`);
      }
      tf(P.neckG, `rotate(${(o.neck + j(5) * .4).toFixed(2)},${geo.neck[0]},${geo.neck[1]})`);
      tf(P.headG, `rotate(${(o.nod + j(6) * .5).toFixed(2)},${geo.head[0]},${geo.head[1]})`);
      const jaw = o.jaw ?? (o.chew ? .25 + .25 * Math.sin(o.chew * Math.PI * 2) : JAW[o.mouth || 'X'] ?? 0);
      tf(P.jaw, `rotate(${(jaw * geo.jawOpen).toFixed(1)},${geo.jaw[0]},${geo.jaw[1]})`);
      tf(P.ear, `rotate(${(o.ear * 22 + j(7)).toFixed(1)},${geo.ear[0]},${geo.ear[1]})`);
      tf(P.tail, `rotate(${(o.tail + j(8) * 1.5).toFixed(1)},${geo.tail[0]},${geo.tail[1]})`);
      vis(P.eyeO, !o.shut); vis(P.eyeC, !!o.shut);
      if (P.lid) { vis(P.lid, !o.shut && o.lid > 0); tf(P.lid, `translate(0,${(-geo.lidH * (1 - o.lid)).toFixed(1)})`); }
      tf(P.pupil, `translate(${(o.look * geo.lookX).toFixed(1)},0)`);
      if (P.brow) tf(P.brow, `rotate(${(o.brow * 14).toFixed(1)},${geo.eye[0]},${geo.eye[1] - 12}) translate(0,${(-4 * Math.max(0, o.brow)).toFixed(1)})`);
      for (const k of toggles) vis(P[k], !!o[k]);
    },
    at(name) { const m = P[name] || P['at_' + name]; const M = g.parentNode.getCTM().inverse().multiply(m.getCTM()); return [M.e, M.f]; },
  };
}

// The example: a tabby cat, about 150 units long and 130 tall to the ear tips; s 1.4 stands it beside the kid.
const CAT_GEO = { hips: { nf: [44, -60], ff: [52, -60], nh: [-44, -62], fh: [-36, -62] }, up: 30, low: 34, L: 46, H: 10,
  body: [0, -72], neck: [44, -82], head: [66, -104], jaw: [82, -92], jawOpen: 18, ear: [64, -124], tail: [-56, -80],
  rest: { nf: 2, ff: 0, nh: -2, fh: 0 }, eye: [80, -110], lidH: 9, lookX: 2 };
function catSVG({ coat = '#d98a3d', far = '#b8722f', stripe = '#a35a22', belly = '#f3e2c4', nose = '#d9646a', paw = '#f3e2c4' } = {}) {
  return `${legSVG('fh', 30, 34, 22, 11, far, paw)}${legSVG('ff', 30, 34, 15, 10, far, paw)}
  <g data-p="trunk">
    <g data-p="tail">${pf(`<path d="M-54,-84 C-82,-92 -96,-120 -88,-148 C-86,-156 -76,-156 -78,-146 C-84,-122 -72,-100 -50,-94 Z" fill="${coat}"/><path d="M-84,-126 l9,-2 M-80,-110 l9,-4 M-70,-98 l7,-6" stroke="${stripe}" stroke-width="4"/>`)}</g>
    ${pf(`<path d="M-62,-78 C-64,-98 -40,-104 0,-102 C34,-102 58,-98 60,-80 C62,-62 48,-52 30,-52 L-36,-52 C-54,-54 -62,-62 -62,-78 Z" fill="${coat}"/>
      <path d="M-30,-102 q4,12 -2,20 M-8,-103 q4,12 -2,20 M14,-103 q4,12 -2,20" stroke="${stripe}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M-40,-56 C-20,-50 20,-50 40,-56 C34,-52 30,-52 26,-52 L-30,-52 Z" fill="${belly}"/>`)}${mark('at_back', 0, -104)}
    <g data-p="neckG">
      ${pf(`<path d="M30,-98 C40,-110 54,-116 64,-114 L76,-96 C68,-82 56,-70 44,-66 C34,-70 28,-84 30,-98 Z" fill="${coat}"/><path d="M50,-72 C58,-78 66,-86 72,-94 L76,-90 C70,-80 60,-70 48,-66 Z" fill="${belly}"/>`)}
      <g data-p="headG">
        <g data-p="ear">${pf(`<path d="M56,-118 L60,-142 L74,-122 Z" fill="${coat}"/><path d="M60,-122 L62,-136 L70,-123 Z" fill="${nose}" opacity=".7"/>`)}</g>
        ${pf(`<path d="M50,-112 C50,-130 74,-136 86,-124 C94,-116 100,-106 100,-98 C100,-88 90,-84 80,-86 L64,-90 C54,-94 50,-102 50,-112 Z" fill="${coat}"/>
          <path d="M74,-130 L80,-142 L88,-124 Z" fill="${coat}"/><path d="M58,-128 q6,6 14,4" stroke="${stripe}" stroke-width="3" fill="none"/>
          <ellipse cx="90" cy="-96" rx="10" ry="7" fill="${belly}"/><path d="M97,-102 l4,3 l-5,2 Z" fill="${nose}"/>
          <path d="M92,-98 l18,-3 M92,-96 l18,2" stroke="#3a2a20" stroke-width="1.2" opacity=".6"/>`)}
        <g data-p="jaw">${pf(`<path d="M80,-90 C88,-86 96,-86 100,-90 C99,-82 90,-79 82,-84 Z" fill="${belly}"/>`)}${mark('at_mouth', 96, -88)}</g>
        <g data-p="eyeO"><ellipse cx="80" cy="-110" rx="5.5" ry="6" fill="#e9d36a"/><g data-p="pupil"><ellipse cx="81" cy="-110" rx="2" ry="4.6" fill="#1e1610"/><circle cx="82.5" cy="-112" r="1.2" fill="#fff"/></g>
          <g data-p="lid"><rect x="73.5" y="-118" width="13" height="8" fill="${coat}"/><path d="M74,-110 h12" stroke="#1e1610" stroke-width="1.8"/></g></g>
        <g data-p="eyeC"><path d="M75,-109 Q80,-105 85,-109" stroke="#1e1610" stroke-width="2.2" fill="none"/></g>
        <path data-p="brow" d="M74,-120 Q80,-123 87,-120" stroke="${stripe}" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${mark('at_eye', 80, -110)}${mark('at_head', 72, -138)}${pinAt(66, -104)}
      </g>${pinAt(44, -82)}
    </g>
  </g>
  ${legSVG('nh', 30, 34, 24, 12, coat, paw)}${legSVG('nf', 30, 34, 16, 11, coat, paw)}`;
}
// catPuppet(parent, colours, rest): colours as catSVG's; rest overrides REST_BEAST (gait, lid …).
const catPuppet = (parent, colours = {}, rest = {}) => beast(parent, catSVG(colours), CAT_GEO, rest);
