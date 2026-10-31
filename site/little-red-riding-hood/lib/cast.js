/* cast.js — Red, Mother, the wolf, Grandma and the woodcutter, on paper.js. Each is drawn at its hip (0, 0) facing right, with a
   profile set and a front set of pieces; the front set shows whenever head is 'F' or the turn is past its middle,
   so a puppet always faces us as a whole. */
'use strict';
/* ---------- the book's own pieces (moved from lib/paper.js when it became the kit's file) ---------- */
// Red and Mother, and the parts the cast below builds with (legPiece, frontArm, armsF).
function legPiece(id, sock, shoe, thigh = 94, shin = 82, w = 18) {
  const k = thigh - 8, f = k + shin - 10;
  return `<g data-p="${id}"><g filter="url(#paper)"><rect x="${-w / 2}" y="-4" width="${w}" height="${thigh}" rx="8" fill="${sock}"/></g>
    <g data-p="${id}k"><g filter="url(#paper)"><rect x="${-w / 2 + 1}" y="${k - 6}" width="${w - 2}" height="${shin}" rx="7" fill="${sock}"/><path d="M-10,${f} h22 q13,0 13,10 v4 h-37 z" fill="${shoe}"/></g>${pinAt(0, k)}</g></g>`;
}
// The basket with its checked cloth; its handle hangs from (14.5 + dx, -64 + dy).
const basketSVG = (dx, dy, id = 'basket') => `<g data-p="${id}" filter="url(#paper)"><g transform="translate(${dx},${dy})">
  <path d="M-18,-22 Q14,-86 46,-22" fill="none" stroke="#8a5a2a" stroke-width="6"/>
  <path d="M-26,-24 L54,-24 L45,20 L-17,20 Z" fill="#b07a3e"/><path d="M-22,-8 L50,-8 M-19,6 L47,6" stroke="#8a5a2a" stroke-width="2.5"/>
  <path d="M-24,-26 Q14,-42 52,-26 L54,-18 L-26,-18 Z" fill="url(#check)"/></g></g>`;
// A front arm hanging from its shoulder (x, y): sleeve, forearm, hand; extra goes in the hand group.
const frontArm = (id, x, y, sleeve, skin, up = 60, fore = 56, extra = '') => `<g data-p="${id}"><g filter="url(#paper)"><rect x="${x - 8.5}" y="${y - 6}" width="17" height="${up + 6}" rx="8" fill="${sleeve}"/></g>
  <g data-p="${id}f"><g filter="url(#paper)"><rect x="${x - 6.5}" y="${y + up - 6}" width="13" height="${fore}" rx="6" fill="${skin}"/><circle cx="${x}" cy="${y + up + fore - 4}" r="9.5" fill="${skin}"/>${extra}</g>
  ${pinAt(x, y + up - 2)}</g>${pinAt(x, y)}</g>`;
// The raised index finger (with its thumb) on the hand at (x, y): on the face side, so it never reads as another gesture.
const fingerSVG = (x, y, skin) => `<g data-p="finger" filter="url(#paper)"><rect x="${x + 2.5}" y="${y + 2}" width="6.5" height="24" rx="3.2" fill="${skin}"/><ellipse cx="${x - 9.5}" cy="${y - 4}" rx="5" ry="7.5" transform="rotate(-35,${x - 9.5},${y - 4})" fill="${skin}"/><path d="M${x - 6.5},${y + 5} q3,4 7,0" stroke="#c99878" stroke-width="1.6" fill="none"/></g>`;
function armsF(P, o, j, sx, sy, up) {   // the two front arms: r = screen right, l = screen left; 0 hangs down
  tf(P.rArm, `rotate(${(o.rua + j(21) * .6).toFixed(2)},${sx},${sy})`); tf(P.rArmf, `rotate(${(o.rfa + j(22) * .6).toFixed(2)},${sx},${sy + up - 2})`);
  tf(P.lArm, `rotate(${(o.lua + j(23) * .6).toFixed(2)},${-sx},${sy})`); tf(P.lArmf, `rotate(${(o.lfa + j(24) * .6).toFixed(2)},${-sx},${sy + up - 2})`);
}
// A bunch of flowers held at (x, y), kept upright by its group; `n` of its seven flowers show (bouquet: 0 … 7).
const FLOWER_COLS = ['#d6493f', '#f6efe0', '#efae48', '#d6493f', '#e88ab0', '#f6efe0', '#efae48'];
const bouquetSVG = (x, y, id) => `<g data-p="${id}"><g filter="url(#paper)"><path d="M${x},${y} l-14,-46 M${x},${y} l0,-54 M${x},${y} l14,-46 M${x},${y} l-24,-34 M${x},${y} l24,-34" stroke="#4f7a34" stroke-width="3"/></g>
  ${FLOWER_COLS.map((c, i) => { const a = (-60 + i * 20) * Math.PI / 180, r = 44 + (i % 2) * 12;
    return `<g data-p="${id}${i}" filter="url(#paper)"><circle cx="${(x + r * Math.sin(a)).toFixed(1)}" cy="${(y - r * Math.cos(a)).toFixed(1)}" r="9" fill="${c}"/><circle cx="${(x + r * Math.sin(a)).toFixed(1)}" cy="${(y - r * Math.cos(a)).toFixed(1)}" r="3" fill="#efae48"/></g>`; }).join('')}</g>`;
function bouquetPose(P, id, n, rot, x, y) {
  vis(P[id], n > 0); tf(P[id], `rotate(${rot.toFixed(2)},${x},${y})`);
  for (let i = 0; i < 7; i++) vis(P[id + i], i < n);
}

/* Red. Feet at y 170 (hipOn(gy, s)). Keys besides the common ones (x y s turn near far kNear kFar ua fa rua rfa lua lfa
   head headR nod mouth shut hop):
   cape      the back of the cape, degrees (3 at rest; more flies out behind her)
   basket    the basket in the near hand; swing rocks it (degrees). bouquet 0 … 7: flowers in the bunch, one by one
   lean      bends her at the waist (profile), degrees forward: 60–80 to reach the ground
   fua, ffa  the far arm (profile), shoulder and elbow like ua/fa; null hides it (it hangs behind her at rest).
             To pick: lean 70, fua -20, ffa -10 puts the far hand at the grass; then up again
   held      a flower in the far hand (a FLOWER_COLS colour, or null), the one she has just picked
   brow      worried brows (0 none, 1 worried, more is more); shown only while not 0, so earlier shots keep their faces
   wink      the screen-right eye shut on the front face (the wink to us)
   crouch    0 … 1, a duck: knees up, hip down, feet kept on the ground (add ua -150 for arms over her head)
   Picking a flower (flowerProp at s ≈ 1.25 × hers, a step in front of her): { lean: 60, crouch: .7, fua: -50, ffa: 10 }
   brings the far hand to its head; then held: col and back up to { lean: 15, fua: -100, ffa: -50 } to show it. */
const REST_RED = { x: 0, y: 0, s: 1, turn: 1, near: 0, far: 0, kNear: 0, kFar: 0, cape: 3, ua: -8, fa: -78, basket: true, swing: 0, headR: 0, nod: 0, head: 'P', mouth: 'X', shut: false, hop: 0, rua: 6, rfa: -4, lua: -6, lfa: 4, bouquet: 0,
  lean: 0, fua: null, ffa: -10, held: null, brow: 0, wink: false, crouch: 0 };
function redPuppet(parent) {
  const g = mk('g', {}, parent);
  g.innerHTML = `<g data-p="body">
    <g data-p="upperB"><g data-p="capeB" filter="url(#paper)"><path d="M-12,-138 C-46,-118 -78,-30 -100,50 Q-40,64 14,44 L22,-118 Z" fill="#a92a27"/></g></g>
    ${legPiece('legF', '#d8d1c2', '#2b1a10')}${legPiece('legN', '#f2ede1', '#3a2418')}
    <g filter="url(#paper)"><path d="M-38,-46 L38,-46 C48,0 58,30 64,56 Q0,70 -64,56 C-58,30 -48,0 -38,-46 Z" fill="#2d4f86"/></g>
    <g filter="url(#paper)"><path d="M6,-42 L36,-42 C44,0 50,30 54,52 Q30,60 8,58 Z" fill="#f4efe2"/></g>
    <g data-p="upper">
    <g data-p="armF"><g filter="url(#paper)"><rect x="-4.5" y="-134" width="17" height="62" rx="8" fill="#ddd5c4"/></g>
      <g data-p="foreF"><g filter="url(#paper)"><rect x="-2" y="-80" width="12" height="54" rx="6" fill="#e9c2a4"/><circle cx="4" cy="-26" r="9" fill="#e9c2a4"/></g>
        <g data-p="heldF"><g filter="url(#paper)"><path d="M4,-26 l14,-40" stroke="#4f7a34" stroke-width="3"/></g><circle data-p="heldC" cx="18" cy="-70" r="10" fill="#d6493f"/><circle cx="18" cy="-70" r="3.4" fill="#efae48"/></g>
        ${pinAt(4, -76)}</g>${pinAt(4, -128)}</g>
    <g filter="url(#paper)"><path d="M-28,-128 L26,-128 L34,-42 L-34,-42 Z" fill="#2d4f86"/><rect x="-8" y="-150" width="16" height="28" fill="#f6d2b5"/></g>
    <g filter="url(#paper)"><path d="M-30,-152 Q5,-160 28,-140 L36,-94 Q0,-84 -50,-88 Q-48,-122 -30,-152 Z" fill="#c8322f"/></g>
    <g data-p="headP"><g filter="url(#paper)">
      <path d="M-50,-190 C-55,-252 32,-264 54,-214 C64,-188 58,-160 40,-148 L-40,-140 C-56,-150 -52,-172 -50,-190 Z" fill="#c8322f"/>
      <circle cx="14" cy="-192" r="40" fill="#f6d2b5"/><circle cx="53" cy="-189" r="7" fill="#f6d2b5"/>
      <path d="M-18,-214 Q16,-242 52,-210 Q32,-220 12,-205 Q-4,-214 -18,-198 Z" fill="#6b3b22"/>
      <path d="M-46,-195 C-46,-247 42,-260 60,-212 C42,-240 -8,-242 -20,-196 C-24,-170 -16,-150 -6,-142 L-40,-140 C-52,-155 -48,-176 -46,-195 Z" fill="#b02c29"/>
      <circle cx="31" cy="-176" r="8.5" fill="#ef9a8a" opacity=".8"/>
      <g class="eyeO"><ellipse cx="34" cy="-198" rx="4.5" ry="6.2" fill="#22150e"/></g>
      <g class="eyeC"><path d="M29,-197 Q34,-193 39,-197" fill="none" stroke="#22150e" stroke-width="2.4" stroke-linecap="round"/></g>
      <path data-p="browP" d="M26,-208 L41,-207" stroke="#3b2210" stroke-width="3.8" stroke-linecap="round"/>
      <use class="mouth" href="#mX" transform="translate(41,-172) scale(.85)"/></g>${pinAt(0, -146)}</g>
    <g data-p="arm"><g filter="url(#paper)"><rect x="6" y="-134" width="17" height="64" rx="8" fill="#f4efe2"/></g>
      <g data-p="fore"><g filter="url(#paper)"><rect x="8.5" y="-80" width="12" height="54" rx="6" fill="#f6d2b5"/><circle cx="14.5" cy="-26" r="9" fill="#f6d2b5"/></g>
        ${basketSVG(0, 0)}${bouquetSVG(14.5, -26, 'bq')}${pinAt(14.5, -76)}</g>
      ${pinAt(14.5, -128)}</g></g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><path d="M-36,-140 L36,-140 L72,50 Q0,64 -72,50 Z" fill="#a92a27"/></g>
    <g filter="url(#paper)"><rect x="-21" y="46" width="16" height="114" rx="7" fill="#f2ede1"/><rect x="5" y="46" width="16" height="114" rx="7" fill="#f2ede1"/>
      <ellipse cx="-13" cy="164" rx="12" ry="7" fill="#3a2418"/><ellipse cx="13" cy="164" rx="12" ry="7" fill="#3a2418"/></g>
    <g filter="url(#paper)"><path d="M-40,-46 L40,-46 C52,0 62,30 68,56 Q0,70 -68,56 C-62,30 -52,0 -40,-46 Z" fill="#2d4f86"/></g>
    <g filter="url(#paper)"><path d="M-20,-42 L20,-42 L28,52 Q0,58 -28,52 Z" fill="#f4efe2"/></g>
    <g filter="url(#paper)"><path d="M-30,-128 L30,-128 L38,-42 L-38,-42 Z" fill="#2d4f86"/><rect x="-8" y="-150" width="16" height="28" fill="#f6d2b5"/></g>
    ${frontArm('lArm', -30, -126, '#f4efe2', '#f6d2b5', 54, 50, bouquetSVG(-30, -26, 'bqF'))}
    ${frontArm('rArm', 30, -126, '#f4efe2', '#f6d2b5', 54, 50, basketSVG(15.5, 38, 'basketF'))}
    <g filter="url(#paper)"><path d="M-40,-152 Q0,-166 40,-152 L52,-96 Q0,-82 -52,-96 Z" fill="#c8322f"/></g>
  </g>
  <g data-p="headF"><g filter="url(#paper)">
    <ellipse cx="0" cy="-194" rx="62" ry="64" fill="#c8322f"/><circle cx="0" cy="-188" r="42" fill="#f6d2b5"/>
    <path d="M-38,-200 Q0,-246 38,-200 Q20,-212 0,-210 Q-20,-212 -38,-200 Z" fill="#6b3b22"/>
    <path d="M-61,-192 C-61,-264 61,-264 61,-192 C50,-238 -50,-238 -61,-192 Z" fill="#b02c29"/>
    <circle cx="-23" cy="-176" r="8" fill="#ef9a8a" opacity=".8"/><circle cx="23" cy="-176" r="8" fill="#ef9a8a" opacity=".8"/>
    <g class="eyeO"><ellipse cx="-14" cy="-196" rx="4.5" ry="6.2" fill="#22150e"/></g><g class="eyeO" data-p="eyeRO"><ellipse cx="14" cy="-196" rx="4.5" ry="6.2" fill="#22150e"/></g>
    <g class="eyeC"><path d="M-19,-195 Q-14,-191 -9,-195" fill="none" stroke="#22150e" stroke-width="2.4" stroke-linecap="round"/></g><g class="eyeC" data-p="eyeRC"><path d="M9,-195 Q14,-191 19,-195" fill="none" stroke="#22150e" stroke-width="2.4" stroke-linecap="round"/></g>
    <path data-p="browL" d="M-22,-207 L-7,-206" stroke="#3b2210" stroke-width="3.4" stroke-linecap="round"/><path data-p="browR" d="M7,-206 L22,-207" stroke="#3b2210" stroke-width="3.4" stroke-linecap="round"/>
    <use class="mouth" href="#mX" transform="translate(0,-166)"/></g></g>`;
  bakeAll(g);
  const P = pieces(g);
  return { g, pose(o, f) {
    o = { ...REST_RED, ...o };
    const j = k => jit(f, k), front = o.head === 'F' || Math.abs(o.turn) < .55;
    if (o.crouch) {   // the hip sinks as far as the folded legs shorten, so the feet stay on the ground
      const c = o.crouch, r = Math.PI / 180, n = { near: o.near - 62 * c, far: o.far - 50 * c, kNear: o.kNear + 104 * c, kFar: o.kFar + 100 * c };
      const reach = (a, k) => 86 * Math.cos(a * r) + 86 * Math.cos((a + k) * r), drop = 172 - Math.max(reach(n.near, n.kNear), reach(n.far, n.kFar));
      o = { ...o, ...n, hop: o.hop + Math.max(0, drop) * o.s };
    }
    tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + o.hop + j(2) * .6).toFixed(1)}) scale(${o.s}) rotate(${(j(3) * .5).toFixed(2)})`);
    tf(P.body, `scale(${o.turn.toFixed(3)},1)`); vis(P.body, !front); vis(P.bodyF, front);
    armsF(P, o, j, 30, -126, 54);
    tf(P.basketF, `rotate(${(-(o.rua + o.rfa) + o.swing).toFixed(2)},45.5,-26)`); vis(P.basketF, o.basket);
    bouquetPose(P, 'bqF', o.bouquet, -(o.lua + o.lfa), -30, -26);
    tf(P.legN, `rotate(${(o.near + j(4) * .6).toFixed(2)})`); tf(P.legNk, `rotate(${o.kNear.toFixed(2)},0,86)`);
    tf(P.legF, `rotate(${(o.far + j(5) * .6).toFixed(2)})`); tf(P.legFk, `rotate(${o.kFar.toFixed(2)},0,86)`);
    tf(P.capeB, `rotate(${(o.cape - .75 * o.lean + j(6) * .5).toFixed(2)},-12,-138)`);   // bent over, the cape still hangs
    const ua = o.ua + j(7) * .6, fa = o.fa + j(8) * .6;
    tf(P.arm, `rotate(${ua.toFixed(2)},14.5,-128)`); tf(P.fore, `rotate(${fa.toFixed(2)},14.5,-76)`);
    tf(P.basket, `rotate(${(-(ua + fa) + o.swing).toFixed(2)},14.5,-64)`); vis(P.basket, o.basket);
    bouquetPose(P, 'bq', o.bouquet, -(ua + fa) + 10, 14.5, -26);
    vis(P.headP, !front); vis(P.headF, front);
    const hr = `translate(0,${o.nod.toFixed(1)}) rotate(${(o.headR + j(9) * .7).toFixed(2)},0,-146)`;
    tf(P.headP, hr); tf(P.headF, hr);
    face(front ? P.headF : P.headP, o);
    const bend = `rotate(${o.lean.toFixed(2)},0,-44)`; tf(P.upper, bend); tf(P.upperB, bend);
    vis(P.armF, o.fua !== null);
    if (o.fua !== null) { tf(P.armF, `rotate(${(o.fua + j(10) * .6).toFixed(2)},4,-128)`); tf(P.foreF, `rotate(${(o.ffa + j(11) * .6).toFixed(2)},4,-76)`); }
    vis(P.heldF, !!o.held); if (o.held) { P.heldC.setAttribute('fill', o.held); tf(P.heldF, `rotate(${(-(o.fua || 0) - o.ffa - o.lean).toFixed(2)},4,-26)`); }
    for (const k of ['browP', 'browL', 'browR']) vis(P[k], o.brow !== 0);
    tf(P.browP, `rotate(${(-16 * o.brow).toFixed(1)},26,-208)`);
    tf(P.browL, `rotate(${(-16 * o.brow).toFixed(1)},-22,-207)`); tf(P.browR, `rotate(${(16 * o.brow).toFixed(1)},22,-207)`);
    if (front && o.wink && !o.shut) { vis(P.eyeRO, false); vis(P.eyeRC, true); }
  } };
}

// Mother: long green dress and apron, hair in a bun; one arm (the near one) that holds out, points or waves.
// Feet at y 212. Her basket hangs from her hand.
const REST_MOM = { x: 0, y: 0, s: 1, turn: 1, ua: 6, fa: -6, basket: false, finger: false, swing: 0, head: 'P', headR: 0, brow: 0, mouth: 'X', shut: false, hop: 0, rua: 6, rfa: -4, lua: -6, lfa: 4 };
function motherPuppet(parent) {
  const g = mk('g', {}, parent), skin = '#f2c9a6', dress = '#4f7a5a', hair = '#6b3b22', ink = '#22150e';
  g.innerHTML = `<g data-p="body">
    <g filter="url(#paper)"><path d="M20,198 h30 q12,0 12,9 v5 h-42 z M-14,198 h26 q10,0 10,9 v5 h-36 z" fill="#3a2418"/></g>
    <g filter="url(#paper)"><path d="M-44,-14 L44,-14 C56,60 70,140 78,200 Q0,214 -78,200 C-70,140 -56,60 -44,-14 Z" fill="${dress}"/></g>
    <g filter="url(#paper)"><path d="M10,-10 L44,-10 C54,60 62,130 68,190 Q40,198 14,196 Z" fill="#f4efe2"/></g>
    <g filter="url(#paper)"><path d="M-34,-150 L30,-150 L44,-10 L-44,-10 Z" fill="${dress}"/><rect x="-9" y="-178" width="18" height="32" fill="${skin}"/>
      <path d="M-28,-152 Q4,-140 32,-152 L34,-136 Q4,-124 -30,-136 Z" fill="#f4efe2"/></g>
    <g data-p="headP"><g filter="url(#paper)">
      <circle cx="-32" cy="-240" r="22" fill="${hair}"/>
      <circle cx="14" cy="-212" r="42" fill="${skin}"/><circle cx="55" cy="-209" r="7.5" fill="${skin}"/>
      <path d="M-38,-206 C-42,-262 40,-274 58,-226 Q30,-248 4,-238 Q-10,-228 -14,-202 Q-20,-180 -10,-170 L-34,-176 C-42,-188 -40,-198 -38,-206 Z" fill="${hair}"/>
      <circle cx="33" cy="-196" r="8" fill="#ef9a8a" opacity=".7"/>
      <g class="eyeO"><ellipse cx="36" cy="-218" rx="4.5" ry="6" fill="${ink}"/></g>
      <g class="eyeC"><path d="M31,-217 Q36,-213 41,-217" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
      <path data-p="browP" d="M28,-233 L44,-231" stroke="${hair}" stroke-width="3.5" stroke-linecap="round"/>
      <use class="mouth" href="#mX" transform="translate(42,-190) scale(.85)"/></g>${pinAt(0, -174)}</g>
    <g data-p="arm"><g filter="url(#paper)"><rect x="8" y="-148" width="17" height="62" rx="8" fill="#f4efe2"/></g>
      <g data-p="fore"><g filter="url(#paper)"><rect x="10" y="-92" width="13" height="58" rx="6" fill="${skin}"/><circle cx="16.5" cy="-32" r="10" fill="${skin}"/>
        ${fingerSVG(16.5, -32, skin)}</g>
        ${basketSVG(2, 32)}${pinAt(16.5, -88)}</g>${pinAt(16.5, -142)}</g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><ellipse cx="-18" cy="206" rx="13" ry="7" fill="#3a2418"/><ellipse cx="18" cy="206" rx="13" ry="7" fill="#3a2418"/></g>
    <g filter="url(#paper)"><path d="M-46,-14 L46,-14 C58,60 72,140 80,200 Q0,214 -80,200 C-72,140 -58,60 -46,-14 Z" fill="${dress}"/></g>
    <g filter="url(#paper)"><path d="M-26,-10 L26,-10 L36,192 Q0,198 -36,192 Z" fill="#f4efe2"/></g>
    <g filter="url(#paper)"><path d="M-36,-150 L36,-150 L46,-10 L-46,-10 Z" fill="${dress}"/><rect x="-9" y="-178" width="18" height="32" fill="${skin}"/>
      <path d="M-30,-152 Q0,-138 30,-152 L32,-140 Q0,-124 -32,-140 Z" fill="#f4efe2"/></g>
    ${frontArm('lArm', -32, -142, '#f4efe2', skin, 56, 58)}
    ${frontArm('rArm', 32, -142, '#f4efe2', skin, 56, 58, fingerSVG(32, -32, skin).replace('data-p="finger"', 'data-p="fingerF"'))}
  </g>
  <g data-p="headF"><g filter="url(#paper)">
    <circle cx="0" cy="-262" r="20" fill="${hair}"/><circle cx="0" cy="-210" r="44" fill="${skin}"/>
    <path d="M-47,-206 C-50,-272 50,-272 47,-206 Q34,-240 0,-238 Q-34,-240 -47,-206 Z" fill="${hair}"/>
    <circle cx="-25" cy="-194" r="8" fill="#ef9a8a" opacity=".7"/><circle cx="25" cy="-194" r="8" fill="#ef9a8a" opacity=".7"/>
    <g class="eyeO"><ellipse cx="-15" cy="-214" rx="4.5" ry="6" fill="${ink}"/><ellipse cx="15" cy="-214" rx="4.5" ry="6" fill="${ink}"/></g>
    <g class="eyeC"><path d="M-20,-213 Q-15,-209 -10,-213 M10,-213 Q15,-209 20,-213" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
    <path data-p="browL" d="M-23,-229 L-8,-228" stroke="${hair}" stroke-width="3.5" stroke-linecap="round"/>
    <path data-p="browR" d="M8,-228 L23,-229" stroke="${hair}" stroke-width="3.5" stroke-linecap="round"/>
    <use class="mouth" href="#mX" transform="translate(0,-186)"/></g></g>`;
  bakeAll(g);
  const P = pieces(g);
  return { g, pose(o, f) {
    o = { ...REST_MOM, ...o };
    const j = k => jit(f, k), front = o.head === 'F' || Math.abs(o.turn) < .55;
    tf(g, `translate(${(o.x + j(11) * .8).toFixed(1)},${(o.y + o.hop + j(12) * .6).toFixed(1)}) scale(${o.s}) rotate(${(j(13) * .5).toFixed(2)})`);
    tf(P.body, `scale(${o.turn.toFixed(3)},1)`); vis(P.body, !front); vis(P.bodyF, front);
    armsF(P, o, j, 32, -142, 56); vis(P.fingerF, o.finger);
    const ua = o.ua + j(17) * .6, fa = o.fa + j(18) * .6;
    tf(P.arm, `rotate(${ua.toFixed(2)},16.5,-142)`); tf(P.fore, `rotate(${fa.toFixed(2)},16.5,-88)`);
    tf(P.basket, `rotate(${(-(ua + fa) + o.swing).toFixed(2)},16.5,-32)`); vis(P.basket, o.basket); vis(P.finger, o.finger);
    vis(P.headP, !front); vis(P.headF, front);
    const hr = `rotate(${(o.headR + j(19) * .7).toFixed(2)},0,-174)`;
    tf(P.headP, hr); tf(P.headF, hr);
    // brow > 0: worried (inner ends up)
    tf(P.browP, `rotate(${(-12 * o.brow).toFixed(1)},28,-233)`);
    tf(P.browL, `rotate(${(-14 * o.brow).toFixed(1)},-8,-228)`); tf(P.browR, `rotate(${(14 * o.brow).toFixed(1)},8,-228)`);
    face(front ? P.headF : P.headP, o);
  } };
}

document.querySelector('svg defs').insertAdjacentHTML('beforeend', `
  <pattern id="plaid" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect width="24" height="24" fill="#b03a2e"/><rect y="9" width="24" height="6" fill="#2a1a14" opacity=".5"/><rect x="9" width="6" height="24" fill="#2a1a14" opacity=".5"/>
  </pattern>`);
const CAST_DEFS = `<pattern id="plaid" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect width="24" height="24" fill="#b03a2e"/><rect y="9" width="24" height="6" fill="#2a1a14" opacity=".5"/><rect x="9" width="6" height="24" fill="#2a1a14" opacity=".5"/>
  </pattern>`;
// The baker renders pieces in their own documents: give it the cast's patterns too.
PAPER_EXTRA.push(CAST_DEFS);

// How far a jaw opens for each mouth shape of the cues.
const JAW = { X: 0, A: 0, B: .25, C: .45, D: .85, E: .6, F: .3, G: .2, H: .35 };

function puppet(parent, svg, rest, pose) {
  const g = mk('g', {}, parent);
  g.innerHTML = svg;
  bakeAll(g);
  const P = pieces(g);
  return { g, pose(o, f) { o = { ...rest, ...o }; pose(P, o, k => jit(f, k), g); } };
}
// What every puppet does with its pose: place, jitter, turn, legs, arms, head; returns whether it faces us.
function common(P, o, j, g, { neck, sh, el, hand, fsh, fup, knee }) {
  const front = o.head === 'F' || Math.abs(o.turn) < .55;
  tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + o.hop + j(2) * .6).toFixed(1)}) scale(${o.s}) rotate(${(j(3) * .5).toFixed(2)})`);
  tf(P.body, `scale(${o.turn.toFixed(3)},1)`); vis(P.body, !front); vis(P.bodyF, front);
  if (P.upper) tf(P.upper, `rotate(${o.lean.toFixed(2)})`);
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
const both = (P, k, on) => { if (P[k + 'P']) vis(P[k + 'P'], on); if (P[k + 'F']) vis(P[k + 'F'], on); };
const REST = { x: 0, y: 0, s: 1, turn: 1, near: 0, far: 0, kNear: 0, kFar: 0, lean: 0, ua: 6, fa: -6, rua: 6, rfa: -4, lua: -6, lfa: 4,
  head: 'P', headR: 0, nod: 0, mouth: 'X', shut: false, hop: 0, brow: 0 };

/* ---------- the wolf: grey, a flat cap and a red bow tie, more polite than he should be ----------
   Feet at y 200 (hipOn(gy, s, 200)), upright or on all fours. Keys besides the common ones (lean bends him forward):
   jaw       0 … 1, follows the mouth cue unless given; tail (degrees); ear twitches (-1 … 1); look moves the pupils
   cap       'on' | 'hand' (off in his paw, for the bow) | 'off'; night: Grandma's nightcap; glasses
   flap      the nightcap's tail, degrees (on twos while he runs: 25 * onTwos(q))
   run       on all fours: the distance run so far, in his own units (route(q, keys, s).d), or null upright. The paws
             are planted by it: they stay put on the ground while the body passes over (a gallop, one stride 220 units),
             so give the real distance and the gait matches any speed. With run set, also:
   skid      0 … 1, braking: front legs braced forward, hind legs under him, rump down (feet slide: that is the skid)
   crouch    0 … 1, low to the ground, legs folded, ready to spring
   stretch   0 … 1, in the air: front legs reaching forward, hind legs back (move y yourself for the arc)
   The head on all fours takes cap, night, glasses, jaw/mouth, ear, look, brow, shut, headR, flap like the upright one. */
const FUR = '#8a8178', FUR2 = '#6b635b', ARM = '#787067', BELLY = '#d3cabc', NOSE = '#2a2420';
const wolfHeadP = `<g data-p="headP">
  <g filter="url(#paper)">
    <ellipse cx="10" cy="-206" rx="46" ry="40" fill="${FUR}"/>
    <path d="M28,-226 C70,-228 104,-216 108,-202 C108,-192 92,-186 62,-186 L28,-184 Z" fill="${FUR}"/>
    <path d="M30,-186 L86,-187 L86,-176 L30,-172 Z" fill="#5a1f1f"/>
    <path d="M52,-188 l4,7 l4,-7 Z M76,-188 l4,7 l4,-7 Z" fill="#f6efe0"/>
    <path d="M-30,-196 C-44,-186 -40,-170 -24,-172 C-18,-180 -22,-190 -30,-196 Z" fill="${BELLY}"/>
    <ellipse cx="42" cy="-216" rx="10" ry="9" fill="#f6efe0"/></g>
  <g data-p="jawP" filter="url(#paper)"><path d="M28,-186 L90,-186 C96,-180 88,-170 70,-170 L30,-168 Z" fill="${FUR2}"/></g>
  <g filter="url(#paper)"><ellipse cx="106" cy="-205" rx="9" ry="7" fill="${NOSE}"/></g>
  <g class="eyeO"><circle data-p="pupilP" cx="44" cy="-216" r="4.6" fill="${NOSE}"/></g>
  <g class="eyeC"><ellipse cx="42" cy="-218" rx="11" ry="9" fill="${FUR}"/><path d="M32,-215 Q42,-210 52,-215" stroke="${NOSE}" stroke-width="2.6" fill="none"/></g>
  <path data-p="browP" d="M30,-233 L54,-229" stroke="${FUR2}" stroke-width="5" stroke-linecap="round"/>
  <g data-p="nightP"><g data-p="nightTailP" filter="url(#paper)"><path d="M-30,-258 C-70,-268 -92,-238 -96,-212" stroke="#f6efe0" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="-98" cy="-206" r="9" fill="#e8b4a6"/></g>
    <g filter="url(#paper)"><path d="M-36,-228 C-32,-278 34,-288 54,-236 Z" fill="#f6efe0"/><path d="M-38,-230 Q8,-222 56,-236" stroke="#e8b4a6" stroke-width="6" fill="none"/></g></g>
  <g data-p="earP" filter="url(#paper)"><path d="M-16,-236 L-8,-294 L24,-240 Z" fill="${FUR}"/><path d="M-8,-244 L-3,-280 L14,-246 Z" fill="#e8b4a6"/></g>
  <g data-p="capP" filter="url(#paper)"><path d="M-34,-238 C-22,-264 42,-266 54,-238 L80,-234 C76,-226 54,-226 42,-228 L-34,-228 Z" fill="#6e4a30"/><path d="M-30,-236 h76" stroke="#5a3b24" stroke-width="3"/></g>
  <g data-p="glassesP"><circle cx="44" cy="-216" r="14" fill="#ffffff" fill-opacity=".22" stroke="#3a2412" stroke-width="5.2"/><path d="M30,-218 L-4,-224" stroke="#3a2412" stroke-width="4.6" stroke-linecap="round"/></g>
  ${pinAt(8, -160)}</g>`;
const wolfHeadF = `<g data-p="headF">
  <g filter="url(#paper)">
    <circle cx="0" cy="-212" r="52" fill="${FUR}"/><path d="M-52,-200 L-70,-184 L-46,-180 Z M52,-200 L70,-184 L46,-180 Z" fill="${FUR}"/>
    <ellipse cx="0" cy="-174" rx="20" ry="18" fill="#5a1f1f"/>
    <circle cx="-19" cy="-222" r="11" fill="#f6efe0"/><circle cx="19" cy="-222" r="11" fill="#f6efe0"/></g>
  <g data-p="jawF" filter="url(#paper)"><ellipse cx="0" cy="-176" rx="22" ry="13" fill="${BELLY}"/></g>
  <g filter="url(#paper)"><ellipse cx="0" cy="-196" rx="32" ry="19" fill="${BELLY}"/><path d="M-14,-180 l4,8 l4,-8 Z M6,-180 l4,8 l4,-8 Z" fill="#f6efe0"/>
    <ellipse cx="0" cy="-204" rx="12" ry="8.5" fill="${NOSE}"/></g>
  <g class="eyeO"><circle data-p="pupilL" cx="-19" cy="-222" r="5" fill="${NOSE}"/><circle data-p="pupilR" cx="19" cy="-222" r="5" fill="${NOSE}"/></g>
  <g class="eyeC"><path d="M-30,-222 a11,9 0 0 1 22,0 Z M8,-222 a11,9 0 0 1 22,0 Z" fill="${FUR}"/><path d="M-29,-221 Q-19,-216 -9,-221 M9,-221 Q19,-216 29,-221" stroke="${NOSE}" stroke-width="2.6" fill="none"/></g>
  <path data-p="browL" d="M-32,-240 L-8,-236" stroke="${FUR2}" stroke-width="5" stroke-linecap="round"/>
  <path data-p="browR" d="M8,-236 L32,-240" stroke="${FUR2}" stroke-width="5" stroke-linecap="round"/>
  <g data-p="nightF"><g data-p="nightTailF" filter="url(#paper)"><path d="M30,-284 C70,-300 90,-270 92,-240" stroke="#f6efe0" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="93" cy="-234" r="9" fill="#e8b4a6"/></g>
    <g filter="url(#paper)"><path d="M-50,-236 C-48,-300 48,-300 50,-236 Q0,-252 -50,-236 Z" fill="#f6efe0"/><path d="M-50,-238 Q0,-254 50,-238" stroke="#e8b4a6" stroke-width="6" fill="none"/></g></g>
  <g data-p="earsF" filter="url(#paper)"><path d="M-46,-238 L-36,-302 L-8,-252 Z M46,-238 L36,-302 L8,-252 Z" fill="${FUR}"/><path d="M-38,-246 L-34,-288 L-18,-254 Z M38,-246 L34,-288 L18,-254 Z" fill="#e8b4a6"/></g>
  <g data-p="capF" filter="url(#paper)"><path d="M-46,-248 C-44,-288 44,-288 46,-248 Q0,-238 -46,-248 Z" fill="#6e4a30"/><path d="M-40,-246 Q0,-232 40,-246 L44,-240 Q0,-226 -44,-240 Z" fill="#5a3b24"/></g>
  <g data-p="glassesF"><circle cx="-19" cy="-222" r="15" fill="#ffffff" fill-opacity=".22" stroke="#3a2412" stroke-width="5.2"/><circle cx="19" cy="-222" r="15" fill="#ffffff" fill-opacity=".22" stroke="#3a2412" stroke-width="5.2"/><path d="M-5,-224 q5,-4 10,0" stroke="#3a2412" stroke-width="4.6" fill="none" stroke-linecap="round"/></g>
  </g>`;
const bowTie = (x, y) => `<g filter="url(#paper)"><path d="M${x},${y} l-14,-9 v18 Z M${x},${y} l14,-9 v18 Z" fill="#c8322f"/><circle cx="${x}" cy="${y}" r="4.5" fill="#a82626"/></g>`;
const capInHand = (x, y, id) => `<g data-p="${id}" filter="url(#paper)"><path d="M${x - 30},${y + 10} C${x - 22},${y - 14} ${x + 22},${y - 14} ${x + 30},${y + 10} Z" fill="#6e4a30"/></g>`;
const REST_WOLF = { ...REST, tail: 0, jaw: null, cap: 'on', night: false, glasses: false, ear: 0, look: 0, flap: 0, run: null, skid: 0, crouch: 0, stretch: 0 };
// On all fours: legs hang from hips at (±78, 58), thigh 68 to the knee, 84 knee to sole; paws on y 200.
const RUN4 = { stride: 220, stance: .45, hip: 58, T: 68, S: 84, legs: [['hindN', -78, 0], ['hindF', -66, .08], ['foreN', 78, .5], ['foreF', 90, .58]] };
// Two-segment leg reaching for (tx, ty) from its hip: thigh angle a and knee bend k, degrees (knee forward).
function legIK(tx, ty, T = RUN4.T, S = RUN4.S) {
  const D = Math.min(T + S - .01, Math.hypot(tx, ty)), phi = Math.atan2(tx, ty);
  const b = Math.acos((T * T + D * D - S * S) / (2 * T * D)), c = Math.acos((T * T + S * S - D * D) / (2 * T * S));
  return { a: -(phi + b) * 180 / Math.PI, k: 180 - c * 180 / Math.PI };
}
const wolfRunSVG = () => {
  const leg = (id, x, fur) => `<g transform="translate(${x},${RUN4.hip})">${legPiece(id, fur, NOSE, RUN4.T + 8, RUN4.S - 4, 24)}</g>`;
  return `<g data-p="bodyR">
    <g data-p="tailR" filter="url(#paper)"><path d="M-96,10 C-140,0 -180,-10 -206,-34 C-178,-30 -160,-44 -168,-66 C-136,-44 -110,-20 -90,-8 Z" fill="${FUR}"/><path d="M-206,-34 C-196,-46 -180,-58 -168,-66 C-176,-50 -190,-40 -206,-34 Z" fill="${BELLY}"/></g>
    ${leg('hindF', -66, FUR2)}${leg('foreF', 90, FUR2)}
    <g filter="url(#paper)"><path d="M-110,30 C-112,-10 -70,-22 0,-20 C60,-20 104,-30 122,6 C130,40 110,80 70,84 L-80,84 C-104,80 -110,56 -110,30 Z" fill="${FUR}"/>
      <path d="M-70,84 C-40,62 40,60 80,84 Z" fill="${BELLY}"/></g>
    ${leg('hindN', -78, FUR)}${leg('foreN', 78, FUR)}
    ${bowTie(118, 30)}
    <g transform="translate(96,150)">${wolfHeadP.replace(/data-p="(\w+)"/g, 'data-p="$1R"')}</g>
  </g>`;
};
function wolfPuppet(parent) {
  return puppet(parent, `<g data-p="body">
    <g data-p="tail" filter="url(#paper)"><path d="M-30,-30 C-80,-40 -130,-30 -150,-70 C-120,-60 -96,-80 -110,-110 C-70,-80 -40,-70 -24,-50 Z" fill="${FUR}"/><path d="M-150,-70 C-140,-80 -126,-96 -110,-110 C-118,-90 -134,-76 -150,-70 Z" fill="${BELLY}"/></g>
    ${legPiece('legF', FUR2, NOSE, 104, 100, 28)}${legPiece('legN', FUR, NOSE, 104, 100, 28)}
    <g data-p="upper">
      <g filter="url(#paper)"><path d="M-28,-140 L-26,-198 L32,-198 L30,-140 Z" fill="${FUR}"/></g>
      <g filter="url(#paper)"><path d="M-40,-152 C-62,-80 -60,0 -38,20 L38,20 C58,-10 52,-100 32,-152 Z" fill="${FUR}"/><path d="M8,-124 C32,-84 36,-22 28,14 L2,16 C12,-30 10,-82 0,-124 Z" fill="${BELLY}"/></g>
      ${bowTie(22, -150)}
      ${wolfHeadP}
      <g data-p="arm"><g filter="url(#paper)"><rect x="6" y="-146" width="19" height="66" rx="9" fill="${ARM}"/></g>
        <g data-p="fore"><g filter="url(#paper)"><rect x="8.5" y="-86" width="15" height="58" rx="7" fill="${ARM}"/><circle cx="15.5" cy="-28" r="12" fill="${FUR2}"/></g>
          ${capInHand(15.5, -12, 'capHand')}${pinAt(15.5, -82)}</g>${pinAt(15.5, -140)}</g>
    </g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><path d="M30,-40 C80,-60 110,-90 100,-130 C90,-100 70,-80 30,-70 Z" fill="${FUR}"/></g>
    <g filter="url(#paper)"><rect x="-30" y="10" width="24" height="186" rx="10" fill="${FUR}"/><rect x="6" y="10" width="24" height="186" rx="10" fill="${FUR}"/>
      <ellipse cx="-16" cy="198" rx="16" ry="8" fill="${NOSE}"/><ellipse cx="16" cy="198" rx="16" ry="8" fill="${NOSE}"/></g>
    <g filter="url(#paper)"><rect x="-28" y="-198" width="56" height="58" fill="${FUR}"/></g>
    <g filter="url(#paper)"><path d="M-40,-152 C-62,-80 -58,0 -40,22 L40,22 C58,0 62,-80 40,-152 Z" fill="${FUR}"/><path d="M-20,-124 C-30,-60 -26,0 -18,16 L18,16 C26,0 30,-60 20,-124 Z" fill="${BELLY}"/></g>
    ${bowTie(0, -148)}
    ${frontArm('lArm', -38, -140, ARM, ARM, 60, 58)}
    ${frontArm('rArm', 38, -140, ARM, ARM, 60, 58, capInHand(38, -26, 'capHandF'))}
  </g>
  ${wolfHeadF}
  ${wolfRunSVG()}`, REST_WOLF, (P, o, j, g) => {
    tf(P.nightTailP, `rotate(${o.flap.toFixed(1)},-30,-258)`); tf(P.nightTailF, `rotate(${(-o.flap).toFixed(1)},30,-284)`); tf(P.nightTailPR, `rotate(${o.flap.toFixed(1)},-30,-258)`);
    const four = o.run !== null && o.run !== undefined;
    vis(P.bodyR, four);
    if (four) {
      vis(P.body, false); vis(P.bodyF, false); vis(P.headF, false);
      tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + o.hop + j(2) * .6).toFixed(1)}) scale(${o.s}) rotate(${(j(3) * .5).toFixed(2)})`);
      const R = RUN4, ph = o.run / R.stride, moving = 1 - Math.max(o.skid, o.crouch, o.stretch);
      const bob = -7 * Math.sin(4 * Math.PI * ph) * moving, low = 46 * o.crouch, tilt = -10 * o.skid + 4 * o.crouch;
      tf(P.bodyR, `scale(${o.turn < 0 ? -1 : 1},1) translate(0,${(bob + low).toFixed(1)}) rotate(${(tilt + o.lean * .2).toFixed(2)},0,40)`);
      R.legs.forEach(([id, hx, off], i) => {
        const u = ((ph + off) % 1 + 1) % 1, half = R.stride * R.stance / 2, ty = 200 - R.hip - bob - low;
        let tx, lift = 0;
        if (u < R.stance) tx = half - 2 * half * (u / R.stance);
        else { const v = (u - R.stance) / (1 - R.stance); tx = -half + 2 * half * ease(v); lift = 46 * Math.sin(Math.PI * v); }
        const fore = hx > 0, gait = legIK(tx, ty - lift);
        const brace = fore ? legIK(70, ty) : legIK(-12, ty), tuck = legIK(fore ? 10 : -6, ty), fly = fore ? { a: -62, k: 10 } : { a: 58, k: 20 };
        let a = gait.a, k = gait.k;
        for (const [w, p] of [[o.skid, brace], [o.crouch, tuck], [o.stretch, fly]]) if (w) { a += (p.a - a) * w; k += (p.k - k) * w; }
        tf(P[id], `rotate(${(a + j(30 + i) * .8).toFixed(2)})`); tf(P[id + 'k'], `rotate(${k.toFixed(2)},0,${R.T})`);
      });
      tf(P.tailR, `rotate(${(o.tail + j(6) * 1.2).toFixed(2)},-96,10)`);
      tf(P.headPR, `translate(0,${o.nod.toFixed(1)}) rotate(${(o.headR + j(9) * .7).toFixed(2)},8,-160)`);
      const jaw = o.jaw ?? JAW[o.mouth || 'X'] ?? 0;
      tf(P.jawPR, `rotate(${(jaw * 30).toFixed(1)},30,-184)`); tf(P.earPR, `rotate(${(o.ear * 14).toFixed(1)},4,-238)`);
      tf(P.browPR, `rotate(${(-10 * o.brow).toFixed(1)},42,-231)`); P.pupilPR.setAttribute('cx', 44 + 3 * o.look);
      vis(P.capPR, o.cap === 'on'); vis(P.nightPR, o.night); vis(P.glassesPR, o.glasses);
      face(P.headPR, o);
      return;
    }
    const { front } = common(P, o, j, g, { neck: [8, -160], sh: [15.5, -140], el: [15.5, -82], fsh: [38, -140], fup: 60, knee: 96 });
    tf(P.tail, `rotate(${(o.tail + j(6) * 1.2).toFixed(2)},-30,-40)`);
    const jaw = o.jaw ?? JAW[o.mouth || 'X'] ?? 0;
    tf(P.jawP, `rotate(${(jaw * 30).toFixed(1)},30,-184)`); tf(P.jawF, `translate(0,${(jaw * 22).toFixed(1)})`);
    tf(P.earP, `rotate(${(o.ear * 14).toFixed(1)},4,-238)`); tf(P.earsF, `translate(0,${(-6 * Math.abs(o.ear)).toFixed(1)})`);
    tf(P.browP, `rotate(${(-10 * o.brow).toFixed(1)},42,-231)`);
    tf(P.browL, `translate(0,${(-5 * Math.max(0, o.brow)).toFixed(1)}) rotate(${(14 * o.brow).toFixed(1)},-8,-236)`);
    tf(P.browR, `translate(0,${(-5 * Math.max(0, o.brow)).toFixed(1)}) rotate(${(-14 * o.brow).toFixed(1)},8,-236)`);
    P.pupilP.setAttribute('cx', 44 + 3 * o.look); P.pupilL.setAttribute('cx', -19 + 4 * o.look); P.pupilR.setAttribute('cx', 19 + 4 * o.look);
    both(P, 'cap', o.cap === 'on'); vis(P.capHand, o.cap === 'hand'); vis(P.capHandF, o.cap === 'hand');
    both(P, 'night', o.night); both(P, 'glasses', o.glasses);
  });
}

/* ---------- Grandma: small and round, nightcap, glasses and a lilac shawl ----------
   Feet at y 196 (hipOn(gy, s, 196)). Keys besides the common ones:
   cap, glasses   on her head (true/false); off, they are granCapProp / granGlassesProp in shared.js (with the cap off,
                  her grey hair and bun show on the front head; the profile has its own)
   umbrella       held in her near hand, along the forearm (raise it: ua -150, fa -30)
   blush          0 … 1, pink cheeks (her recovery at the table)
   crouch         0 … 1, a squash: the gown folds down, everything above sinks (before a hop and on landing);
                  the hop itself is her x, y on an arc, e.g. y - 130 * Math.sin(Math.PI * u)
   lean           bends her forward at the waist (profile)
   brow           like the others': > 0 worried (inner ends up), < 0 cross; the profile brow too */
const SKIN_G = '#f2cfb4', GOWN = '#f1ece0', SHAWL = '#8a6a9a', HAIR_G = '#cfc8be';
const umbrellaSVG = (x, y, id) => `<g data-p="${id}" filter="url(#paper)"><rect x="${x - 2.5}" y="${y - 6}" width="5" height="118" fill="#5a3b24"/>
  <path d="M${x},${y + 24} L${x + 15},${y + 92} L${x},${y + 112} L${x - 15},${y + 92} Z" fill="#3f5f8a"/><path d="M${x},${y - 6} q-14,-4 -14,10" stroke="#5a3b24" stroke-width="5" fill="none"/></g>`;
const REST_GRAN = { ...REST, cap: true, glasses: true, umbrella: false, blush: 0, crouch: 0 };
function grandmaPuppet(parent) {
  const ink = '#22150e';
  return puppet(parent, `<g data-p="body">
    <g filter="url(#paper)"><path d="M14,184 h28 q12,0 12,8 v5 h-40 z M-16,184 h24 q10,0 10,8 v5 h-34 z" fill="#8a6a9a"/></g>
    <g data-p="skirt"><g filter="url(#paper)"><path d="M-42,-14 L40,-14 C52,60 62,140 70,190 Q0,202 -70,190 C-62,140 -54,60 -42,-14 Z" fill="${GOWN}"/><path d="M-68,184 Q0,198 68,184" stroke="#d8cfbf" stroke-width="5" fill="none"/></g></g>
    <g data-p="upper">
    <g filter="url(#paper)"><path d="M-32,-140 L28,-140 L40,-10 L-42,-10 Z" fill="${GOWN}"/><rect x="-8" y="-166" width="16" height="30" fill="${SKIN_G}"/></g>
    <g filter="url(#paper)"><path d="M-42,-152 Q0,-166 34,-146 L46,-88 Q0,-74 -54,-82 Q-52,-120 -42,-152 Z" fill="${SHAWL}"/></g>
    <g data-p="headP">
      <g filter="url(#paper)"><circle cx="-30" cy="-226" r="18" fill="${HAIR_G}"/><circle cx="12" cy="-200" r="40" fill="${SKIN_G}"/><circle cx="52" cy="-198" r="8.5" fill="${SKIN_G}"/>
        <path d="M-34,-200 C-36,-242 30,-252 52,-216 Q26,-232 2,-222 Q-12,-210 -14,-190 Q-18,-172 -8,-164 L-30,-168 C-38,-180 -36,-192 -34,-200 Z" fill="${HAIR_G}"/>
        <path d="M22,-186 q6,4 12,0" stroke="#d9a98e" stroke-width="2" fill="none"/></g>
      <circle data-p="blushP" cx="32" cy="-184" r="9" fill="#ef8a7a"/>
      <g class="eyeO"><ellipse cx="36" cy="-206" rx="4" ry="5.5" fill="${ink}"/></g>
      <g class="eyeC"><path d="M31,-205 Q36,-201 41,-205" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
      <path data-p="browP" d="M27,-224.5 L44,-222.5" stroke="#6a6258" stroke-width="4" stroke-linecap="round"/>
      <use class="mouth" href="#mX" transform="translate(42,-180) scale(.8)"/>
      <g data-p="glassesP"><circle cx="37" cy="-205" r="11.5" fill="#ffffff" fill-opacity=".22" stroke="#3a2412" stroke-width="4.4"/><path d="M25,-207 L-4,-212" stroke="#3a2412" stroke-width="4.2" stroke-linecap="round"/></g>
      <g data-p="capP" filter="url(#paper)"><path d="M-42,-212 C-42,-264 52,-268 60,-216 Q10,-234 -42,-212 Z" fill="#f6efe0"/>
        <path d="M-42,-212 Q10,-234 60,-216" stroke="#e8c4d0" stroke-width="7" fill="none" stroke-dasharray="7 5"/></g>
      ${pinAt(0, -162)}</g>
    <g data-p="arm"><g filter="url(#paper)"><rect x="7" y="-140" width="17" height="58" rx="8" fill="${GOWN}"/></g>
      <g data-p="fore"><g filter="url(#paper)"><rect x="9.5" y="-88" width="13" height="56" rx="6" fill="${SKIN_G}"/><circle cx="16" cy="-30" r="9.5" fill="${SKIN_G}"/></g>
        ${umbrellaSVG(16, -30, 'umbP')}${pinAt(16, -84)}</g>${pinAt(16, -134)}</g></g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><ellipse cx="-16" cy="194" rx="13" ry="7" fill="#8a6a9a"/><ellipse cx="16" cy="194" rx="13" ry="7" fill="#8a6a9a"/></g>
    <g data-p="skirtF"><g filter="url(#paper)"><path d="M-44,-14 L44,-14 C56,60 66,140 74,190 Q0,202 -74,190 C-66,140 -56,60 -44,-14 Z" fill="${GOWN}"/></g></g>
    <g data-p="upperF">
    <g filter="url(#paper)"><path d="M-36,-140 L36,-140 L44,-10 L-44,-10 Z" fill="${GOWN}"/><rect x="-8" y="-166" width="16" height="30" fill="${SKIN_G}"/></g>
    ${frontArm('lArm', -34, -136, GOWN, SKIN_G, 52, 54)}
    ${frontArm('rArm', 34, -136, GOWN, SKIN_G, 52, 54, umbrellaSVG(34, -34, 'umbF'))}
    <g filter="url(#paper)"><path d="M-48,-152 Q0,-170 48,-152 L58,-92 Q0,-74 -58,-92 Z" fill="${SHAWL}"/></g>
    </g>
  </g>
  <g data-p="headF">
    <g filter="url(#paper)"><circle cx="-38" cy="-206" r="16" fill="${HAIR_G}"/><circle cx="38" cy="-206" r="16" fill="${HAIR_G}"/><circle cx="0" cy="-200" r="42" fill="${SKIN_G}"/>
      <path d="M-40,-206 Q0,-246 40,-206 Q20,-222 0,-218 Q-20,-222 -40,-206 Z" fill="${HAIR_G}"/></g>
    <g data-p="hairF" filter="url(#paper)"><circle cy="-252" r="16" fill="${HAIR_G}"/><path d="M-45,-196 C-51,-256 51,-256 45,-196 Q25,-227 0,-221 Q-25,-227 -45,-196 Z" fill="${HAIR_G}"/>
      <path d="M-24,-232 Q-8,-244 6,-238 M8,-236 Q22,-240 30,-228" stroke="#b5ada2" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <circle data-p="blushF1" cx="-24" cy="-184" r="8.5" fill="#ef8a7a"/><circle data-p="blushF2" cx="24" cy="-184" r="8.5" fill="#ef8a7a"/>
    <g class="eyeO"><ellipse cx="-14" cy="-204" rx="4" ry="5.5" fill="${ink}"/><ellipse cx="14" cy="-204" rx="4" ry="5.5" fill="${ink}"/></g>
    <g class="eyeC"><path d="M-19,-203 Q-14,-199 -9,-203 M9,-203 Q14,-199 19,-203" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
    <path data-p="browL" d="M-23,-223 L-8,-222" stroke="#6a6258" stroke-width="4" stroke-linecap="round"/>
    <path data-p="browR" d="M8,-222 L23,-223" stroke="#6a6258" stroke-width="4" stroke-linecap="round"/>
    <use class="mouth" href="#mX" transform="translate(0,-178)"/>
    <g data-p="glassesF"><circle cx="-15" cy="-204" r="12.5" fill="#ffffff" fill-opacity=".22" stroke="#3a2412" stroke-width="4.6"/><circle cx="15" cy="-204" r="12.5" fill="#ffffff" fill-opacity=".22" stroke="#3a2412" stroke-width="4.6"/><path d="M-3,-206 q3,-3 6,0 M-27,-206 l-14,-3 M27,-206 l14,-3" stroke="#3a2412" stroke-width="4.2" fill="none" stroke-linecap="round"/></g>
    <g data-p="capF" filter="url(#paper)"><path d="M-54,-206 C-54,-276 54,-276 54,-206 Q0,-232 -54,-206 Z" fill="#f6efe0"/><path d="M-54,-206 Q0,-232 54,-206" stroke="#e8c4d0" stroke-width="7" fill="none" stroke-dasharray="7 5"/></g>
  </g>`, REST_GRAN, (P, o, j, g) => {
    common(P, o, j, g, { neck: [0, -162], sh: [16, -134], el: [16, -84], fsh: [34, -136], fup: 52, knee: 0 });
    const sq = .22 * o.crouch, dy = 204 * sq, fold = `translate(0,190) scale(1,${(1 - sq).toFixed(3)}) translate(0,-190)`;
    tf(P.skirt, fold); tf(P.skirtF, fold); tf(P.upper, `translate(0,${dy.toFixed(1)}) rotate(${o.lean.toFixed(2)})`); tf(P.upperF, `translate(0,${dy.toFixed(1)})`);
    tf(P.headF, `translate(0,${(o.nod + dy).toFixed(1)}) rotate(${(o.headR + j(9) * .7).toFixed(2)},0,-162)`);
    tf(P.browL, `translate(0,${(-4 * Math.max(0, o.brow)).toFixed(1)}) rotate(${(-12 * o.brow).toFixed(1)},-8,-222)`);
    tf(P.browR, `translate(0,${(-4 * Math.max(0, o.brow)).toFixed(1)}) rotate(${(12 * o.brow).toFixed(1)},8,-222)`);
    tf(P.browP, `translate(0,${(-4 * Math.max(0, o.brow)).toFixed(1)}) rotate(${(-14 * o.brow).toFixed(1)},44,-222.5)`);   // pivots at its nose end
    vis(P.hairF, !o.cap);
    for (const k of ['blushP', 'blushF1', 'blushF2']) P[k].setAttribute('opacity', (.35 + .5 * o.blush).toFixed(2));
    both(P, 'cap', o.cap); both(P, 'glasses', o.glasses); vis(P.umbP, o.umbrella); vis(P.umbF, o.umbrella);
  });
}

/* ---------- the woodcutter: tall, a red check shirt, a beard and a green knit hat; axe on his shoulder ----------
   Feet at y 200. */
const SKIN_W = '#e9b892', BEARD = '#6b4a2e';
const axeSVG = (x, y, id) => `<g data-p="${id}" filter="url(#paper)"><rect x="${x - 3.5}" y="${y - 10}" width="7" height="140" rx="3" fill="#8a5a32"/>
  <path d="M${x - 3},${y + 100} L${x - 34},${y + 92} L${x - 40},${y + 132} L${x - 3},${y + 126} Z" fill="#9aa0a6"/><path d="M${x - 34},${y + 92} L${x - 40},${y + 132}" stroke="#d6dade" stroke-width="4"/></g>`;
const REST_WOOD = { ...REST, axe: true };
function woodcutterPuppet(parent) {
  const ink = '#22150e';
  return puppet(parent, `<g data-p="body">
    ${legPiece('legF', '#4e3a2a', '#2a1a10', 104, 96, 22)}${legPiece('legN', '#5e4632', '#3a2418', 104, 96, 22)}
    <g filter="url(#paper)"><path d="M-40,-172 L36,-172 L46,-4 L-46,-4 Z" fill="url(#plaid)"/><rect x="-46" y="-20" width="92" height="14" fill="#3a2418"/><rect x="-9" y="-196" width="18" height="30" fill="${SKIN_W}"/></g>
    <g data-p="headP">
      <g filter="url(#paper)"><circle cx="12" cy="-224" r="40" fill="${SKIN_W}"/><circle cx="52" cy="-224" r="8.5" fill="${SKIN_W}"/>
        <path d="M-18,-216 C-22,-170 34,-158 56,-200 L52,-208 Q30,-196 12,-202 Q-4,-206 -18,-216 Z" fill="${BEARD}"/>
        <path d="M-32,-234 C-30,-280 52,-282 56,-234 Z" fill="#3f6d3a"/><path d="M-34,-238 h92 v12 h-92 Z" fill="#2f5a2c"/></g>
      <g class="eyeO"><ellipse cx="36" cy="-220" rx="4.5" ry="5.5" fill="${ink}"/></g>
      <g class="eyeC"><path d="M31,-219 Q36,-215 41,-219" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
      <path data-p="browP" d="M27,-233 L46,-231" stroke="${BEARD}" stroke-width="5" stroke-linecap="round"/>
      <use class="mouth" href="#mX" transform="translate(42,-204) scale(.85)"/>
      ${pinAt(0, -194)}</g>
    <g data-p="arm"><g filter="url(#paper)"><rect x="6" y="-168" width="20" height="68" rx="9" fill="url(#plaid)"/></g>
      <g data-p="fore"><g filter="url(#paper)"><rect x="9" y="-106" width="15" height="60" rx="7" fill="${SKIN_W}"/><circle cx="16.5" cy="-46" r="12" fill="${SKIN_W}"/></g>
        ${axeSVG(16.5, -46, 'axeP')}${pinAt(16.5, -102)}</g>${pinAt(16.5, -162)}</g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><rect x="-28" y="-6" width="22" height="196" rx="9" fill="#5e4632"/><rect x="6" y="-6" width="22" height="196" rx="9" fill="#5e4632"/>
      <ellipse cx="-17" cy="196" rx="17" ry="9" fill="#3a2418"/><ellipse cx="17" cy="196" rx="17" ry="9" fill="#3a2418"/></g>
    <g filter="url(#paper)"><path d="M-44,-172 L44,-172 L50,-4 L-50,-4 Z" fill="url(#plaid)"/><rect x="-50" y="-20" width="100" height="14" fill="#3a2418"/><rect x="-9" y="-196" width="18" height="30" fill="${SKIN_W}"/></g>
    ${frontArm('lArm', -42, -164, 'url(#plaid)', SKIN_W, 62, 60)}
    ${frontArm('rArm', 42, -164, 'url(#plaid)', SKIN_W, 62, 60, axeSVG(42, -46, 'axeF'))}
  </g>
  <g data-p="headF">
    <g filter="url(#paper)"><circle cx="0" cy="-224" r="42" fill="${SKIN_W}"/>
      <path d="M-40,-222 C-44,-170 44,-170 40,-222 Q22,-200 0,-204 Q-22,-200 -40,-222 Z" fill="${BEARD}"/>
      <path d="M-44,-236 C-44,-290 44,-290 44,-236 Z" fill="#3f6d3a"/><path d="M-46,-240 h92 v12 h-92 Z" fill="#2f5a2c"/></g>
    <g class="eyeO"><ellipse cx="-15" cy="-218" rx="4.5" ry="5.5" fill="${ink}"/><ellipse cx="15" cy="-218" rx="4.5" ry="5.5" fill="${ink}"/></g>
    <g class="eyeC"><path d="M-20,-217 Q-15,-213 -10,-217 M10,-217 Q15,-213 20,-217" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
    <path data-p="browL" d="M-24,-230 L-8,-229" stroke="${BEARD}" stroke-width="5" stroke-linecap="round"/>
    <path data-p="browR" d="M8,-229 L24,-230" stroke="${BEARD}" stroke-width="5" stroke-linecap="round"/>
    <use class="mouth" href="#mX" transform="translate(0,-200)"/>
  </g>`, REST_WOOD, (P, o, j, g) => {
    common(P, o, j, g, { neck: [0, -194], sh: [16.5, -162], el: [16.5, -102], fsh: [42, -164], fup: 62, knee: 96 });
    tf(P.browP, `rotate(${(-12 * o.brow).toFixed(1)},27,-233)`);
    tf(P.browL, `rotate(${(-14 * o.brow).toFixed(1)},-8,-229)`); tf(P.browR, `rotate(${(14 * o.brow).toFixed(1)},8,-229)`);
    vis(P.axeP, o.axe); vis(P.axeF, o.axe);
  });
}
