/* cast.js — the puppets, in the flat cut-paper style of South Park: a big round head straight on the body, two
   touching eyes, a mouth low on the face, mitten hands. Built at the feet (0, 0) facing us. They turn by sliding the
   face to one side (look -1 … 1), as that show does; the paper pieces never deform, except that a sleeve stretches with
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
   serves many characters. An animal or anything not built like a kid gets its own builder with the same contract
   (build in g, bakeAll(g), return { g, aim, point, pose(o, f) }) — see spKid for the pattern; aimArm and rotPt below do
   the geometry for any shoulder and head. */
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
