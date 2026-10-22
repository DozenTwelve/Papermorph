/* cast.js — the puppets, in the flat cut-paper style of South Park: a big round head straight on the body, two
   touching eyes, a mouth low on the face, mitten hands. Built at the feet (0, 0) facing us. They turn by sliding the
   face to one side (look -1 … 1), as that show does; the paper pieces never deform.
   pose(o, f): x, y, s; look (face slide), eyeX/eyeY (pupils, -1 … 1), lids (0 open … 1 shut; .55 is deadpan), shut
   (blink), mouth (a Rhubarb shape or an expression below), brow (0 none, <0 angry, >0 worried), headR, bob, squash,
   armL/armR (degrees, + raises outward; 0 hangs at the side), legL/legR (degrees), sit (hide legs), hold (prop key).

   To add a character: write another entry in SHAPES (copy `kid` and change the numbers: sx/sy the shoulder, hipX the
   hip, body and head outlines, eyes [x, y, rx, ry], mouth [x, y], slide how far the face moves, hair [colour, path],
   optional glasses/hat/extra/legH/cheeks/chin), then a one-line builder like kidPuppet below. A grown-up is a taller
   body (legH 96, sy and the head moved up). Colours (coat, stripe, pants, skin) are options of the builder, so one shape
   serves many characters. An animal or anything not built like a kid gets its own builder with the same contract
   (build in g, bakeAll(g), return { g, pose(o, f) }) — see spKid for the pattern. */
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
const kidPuppet = (p, o) => spKid(p, 'kid', o);   // kidPuppet(parent, { coat, stripe, pants, skin, holds: { key: svg } })

// A walk in the show's manner: the figure bobs on twos and the stubby legs scissor. (For feet that never slide on the
// ground, use walk() in paper.js, which also tells how far the hip has travelled.)
function spWalk(q) { const k = Math.floor(q * FPS / 2) % 2 ? 1 : -1; return { legL: 16 * k, legR: -16 * k, bob: k > 0 ? -6 : 0, armL: 8 * k, armR: -8 * k, k }; }
