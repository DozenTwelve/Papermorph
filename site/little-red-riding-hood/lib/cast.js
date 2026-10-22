/* cast.js — the wolf, Grandma and the woodcutter, on paper.js. Each is drawn at its hip (0, 0) facing right, with a
   profile set and a front set of pieces; the front set shows whenever head is 'F' or the turn is past its middle,
   so a puppet always faces us as a whole. */
'use strict';
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
   Feet at y 200. jaw follows the mouth cue unless given; cap 'on' | 'hand' | 'off'; night (Grandma's nightcap),
   glasses; ears twitch with `ear`; look moves the pupils. */
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
  <g data-p="nightP" filter="url(#paper)"><path d="M-36,-228 C-32,-278 34,-288 54,-236 Z" fill="#f6efe0"/><path d="M-30,-258 C-70,-268 -92,-238 -96,-212" stroke="#f6efe0" stroke-width="16" fill="none" stroke-linecap="round"/>
    <circle cx="-98" cy="-206" r="9" fill="#e8b4a6"/><path d="M-38,-230 Q8,-222 56,-236" stroke="#e8b4a6" stroke-width="6" fill="none"/></g>
  <g data-p="earP" filter="url(#paper)"><path d="M-16,-236 L-8,-294 L24,-240 Z" fill="${FUR}"/><path d="M-8,-244 L-3,-280 L14,-246 Z" fill="#e8b4a6"/></g>
  <g data-p="capP" filter="url(#paper)"><path d="M-34,-238 C-22,-264 42,-266 54,-238 L80,-234 C76,-226 54,-226 42,-228 L-34,-228 Z" fill="#6e4a30"/><path d="M-30,-236 h76" stroke="#5a3b24" stroke-width="3"/></g>
  <g data-p="glassesP"><circle cx="44" cy="-216" r="13" fill="#ffffff" fill-opacity=".18" stroke="#3a2a1a" stroke-width="3"/><path d="M31,-218 L-4,-224" stroke="#3a2a1a" stroke-width="3"/></g>
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
  <g data-p="nightF" filter="url(#paper)"><path d="M-50,-236 C-48,-300 48,-300 50,-236 Q0,-252 -50,-236 Z" fill="#f6efe0"/><path d="M30,-284 C70,-300 90,-270 92,-240" stroke="#f6efe0" stroke-width="16" fill="none" stroke-linecap="round"/>
    <circle cx="93" cy="-234" r="9" fill="#e8b4a6"/><path d="M-50,-238 Q0,-254 50,-238" stroke="#e8b4a6" stroke-width="6" fill="none"/></g>
  <g data-p="earsF" filter="url(#paper)"><path d="M-46,-238 L-36,-302 L-8,-252 Z M46,-238 L36,-302 L8,-252 Z" fill="${FUR}"/><path d="M-38,-246 L-34,-288 L-18,-254 Z M38,-246 L34,-288 L18,-254 Z" fill="#e8b4a6"/></g>
  <g data-p="capF" filter="url(#paper)"><path d="M-46,-248 C-44,-288 44,-288 46,-248 Q0,-238 -46,-248 Z" fill="#6e4a30"/><path d="M-40,-246 Q0,-232 40,-246 L44,-240 Q0,-226 -44,-240 Z" fill="#5a3b24"/></g>
  <g data-p="glassesF"><circle cx="-19" cy="-222" r="14" fill="#ffffff" fill-opacity=".18" stroke="#3a2a1a" stroke-width="3"/><circle cx="19" cy="-222" r="14" fill="#ffffff" fill-opacity=".18" stroke="#3a2a1a" stroke-width="3"/><path d="M-5,-222 h10" stroke="#3a2a1a" stroke-width="3"/></g>
  </g>`;
const bowTie = (x, y) => `<g filter="url(#paper)"><path d="M${x},${y} l-14,-9 v18 Z M${x},${y} l14,-9 v18 Z" fill="#c8322f"/><circle cx="${x}" cy="${y}" r="4.5" fill="#a82626"/></g>`;
const capInHand = (x, y, id) => `<g data-p="${id}" filter="url(#paper)"><path d="M${x - 30},${y + 10} C${x - 22},${y - 14} ${x + 22},${y - 14} ${x + 30},${y + 10} Z" fill="#6e4a30"/></g>`;
const REST_WOLF = { ...REST, tail: 0, jaw: null, cap: 'on', night: false, glasses: false, ear: 0, look: 0 };
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
  ${wolfHeadF}`, REST_WOLF, (P, o, j, g) => {
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
   Feet at y 196. umbrella: held in her near hand (pointing along the forearm). */
const SKIN_G = '#f2cfb4', GOWN = '#f1ece0', SHAWL = '#8a6a9a', HAIR_G = '#cfc8be';
const umbrellaSVG = (x, y, id) => `<g data-p="${id}" filter="url(#paper)"><rect x="${x - 2.5}" y="${y - 6}" width="5" height="118" fill="#5a3b24"/>
  <path d="M${x},${y + 24} L${x + 15},${y + 92} L${x},${y + 112} L${x - 15},${y + 92} Z" fill="#3f5f8a"/><path d="M${x},${y - 6} q-14,-4 -14,10" stroke="#5a3b24" stroke-width="5" fill="none"/></g>`;
const REST_GRAN = { ...REST, cap: true, glasses: true, umbrella: false, blush: 0 };
function grandmaPuppet(parent) {
  const ink = '#22150e';
  return puppet(parent, `<g data-p="body">
    <g filter="url(#paper)"><path d="M14,184 h28 q12,0 12,8 v5 h-40 z M-16,184 h24 q10,0 10,8 v5 h-34 z" fill="#8a6a9a"/></g>
    <g filter="url(#paper)"><path d="M-42,-14 L40,-14 C52,60 62,140 70,190 Q0,202 -70,190 C-62,140 -54,60 -42,-14 Z" fill="${GOWN}"/><path d="M-68,184 Q0,198 68,184" stroke="#d8cfbf" stroke-width="5" fill="none"/></g>
    <g filter="url(#paper)"><path d="M-32,-140 L28,-140 L40,-10 L-42,-10 Z" fill="${GOWN}"/><rect x="-8" y="-166" width="16" height="30" fill="${SKIN_G}"/></g>
    <g filter="url(#paper)"><path d="M-42,-152 Q0,-166 34,-146 L46,-88 Q0,-74 -54,-82 Q-52,-120 -42,-152 Z" fill="${SHAWL}"/></g>
    <g data-p="headP">
      <g filter="url(#paper)"><circle cx="-30" cy="-226" r="18" fill="${HAIR_G}"/><circle cx="12" cy="-200" r="40" fill="${SKIN_G}"/><circle cx="52" cy="-198" r="8.5" fill="${SKIN_G}"/>
        <path d="M-34,-200 C-36,-242 30,-252 52,-216 Q26,-232 2,-222 Q-12,-210 -14,-190 Q-18,-172 -8,-164 L-30,-168 C-38,-180 -36,-192 -34,-200 Z" fill="${HAIR_G}"/>
        <path d="M22,-186 q6,4 12,0" stroke="#d9a98e" stroke-width="2" fill="none"/></g>
      <circle data-p="blushP" cx="32" cy="-184" r="9" fill="#ef8a7a"/>
      <g class="eyeO"><ellipse cx="36" cy="-206" rx="4" ry="5.5" fill="${ink}"/></g>
      <g class="eyeC"><path d="M31,-205 Q36,-201 41,-205" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
      <path data-p="browP" d="M28,-220 L44,-218" stroke="#a9a196" stroke-width="3.5" stroke-linecap="round"/>
      <use class="mouth" href="#mX" transform="translate(42,-180) scale(.8)"/>
      <g data-p="glassesP"><circle cx="37" cy="-205" r="11" fill="#ffffff" fill-opacity=".15" stroke="#7a5a2a" stroke-width="2.6"/><path d="M26,-207 L-4,-212" stroke="#7a5a2a" stroke-width="2.6"/></g>
      <g data-p="capP" filter="url(#paper)"><path d="M-42,-212 C-42,-264 52,-268 60,-216 Q10,-234 -42,-212 Z" fill="#f6efe0"/>
        <path d="M-42,-212 Q10,-234 60,-216" stroke="#e8c4d0" stroke-width="7" fill="none" stroke-dasharray="7 5"/></g>
      ${pinAt(0, -162)}</g>
    <g data-p="arm"><g filter="url(#paper)"><rect x="7" y="-140" width="17" height="58" rx="8" fill="${GOWN}"/></g>
      <g data-p="fore"><g filter="url(#paper)"><rect x="9.5" y="-88" width="13" height="56" rx="6" fill="${SKIN_G}"/><circle cx="16" cy="-30" r="9.5" fill="${SKIN_G}"/></g>
        ${umbrellaSVG(16, -30, 'umbP')}${pinAt(16, -84)}</g>${pinAt(16, -134)}</g></g>
  <g data-p="bodyF">
    <g filter="url(#paper)"><ellipse cx="-16" cy="194" rx="13" ry="7" fill="#8a6a9a"/><ellipse cx="16" cy="194" rx="13" ry="7" fill="#8a6a9a"/></g>
    <g filter="url(#paper)"><path d="M-44,-14 L44,-14 C56,60 66,140 74,190 Q0,202 -74,190 C-66,140 -56,60 -44,-14 Z" fill="${GOWN}"/></g>
    <g filter="url(#paper)"><path d="M-36,-140 L36,-140 L44,-10 L-44,-10 Z" fill="${GOWN}"/><rect x="-8" y="-166" width="16" height="30" fill="${SKIN_G}"/></g>
    ${frontArm('lArm', -34, -136, GOWN, SKIN_G, 52, 54)}
    ${frontArm('rArm', 34, -136, GOWN, SKIN_G, 52, 54, umbrellaSVG(34, -34, 'umbF'))}
    <g filter="url(#paper)"><path d="M-48,-152 Q0,-170 48,-152 L58,-92 Q0,-74 -58,-92 Z" fill="${SHAWL}"/></g>
  </g>
  <g data-p="headF">
    <g filter="url(#paper)"><circle cx="-38" cy="-206" r="16" fill="${HAIR_G}"/><circle cx="38" cy="-206" r="16" fill="${HAIR_G}"/><circle cx="0" cy="-200" r="42" fill="${SKIN_G}"/>
      <path d="M-40,-206 Q0,-246 40,-206 Q20,-222 0,-218 Q-20,-222 -40,-206 Z" fill="${HAIR_G}"/></g>
    <circle data-p="blushF1" cx="-24" cy="-184" r="8.5" fill="#ef8a7a"/><circle data-p="blushF2" cx="24" cy="-184" r="8.5" fill="#ef8a7a"/>
    <g class="eyeO"><ellipse cx="-14" cy="-204" rx="4" ry="5.5" fill="${ink}"/><ellipse cx="14" cy="-204" rx="4" ry="5.5" fill="${ink}"/></g>
    <g class="eyeC"><path d="M-19,-203 Q-14,-199 -9,-203 M9,-203 Q14,-199 19,-203" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>
    <path data-p="browL" d="M-22,-218 L-8,-217" stroke="#a9a196" stroke-width="3.5" stroke-linecap="round"/>
    <path data-p="browR" d="M8,-217 L22,-218" stroke="#a9a196" stroke-width="3.5" stroke-linecap="round"/>
    <use class="mouth" href="#mX" transform="translate(0,-178)"/>
    <g data-p="glassesF"><circle cx="-14" cy="-204" r="12" fill="#ffffff" fill-opacity=".15" stroke="#7a5a2a" stroke-width="2.6"/><circle cx="14" cy="-204" r="12" fill="#ffffff" fill-opacity=".15" stroke="#7a5a2a" stroke-width="2.6"/><path d="M-2,-204 h4" stroke="#7a5a2a" stroke-width="2.6"/></g>
    <g data-p="capF" filter="url(#paper)"><path d="M-54,-206 C-54,-276 54,-276 54,-206 Q0,-232 -54,-206 Z" fill="#f6efe0"/><path d="M-54,-206 Q0,-232 54,-206" stroke="#e8c4d0" stroke-width="7" fill="none" stroke-dasharray="7 5"/></g>
  </g>`, REST_GRAN, (P, o, j, g) => {
    common(P, o, j, g, { neck: [0, -162], sh: [16, -134], el: [16, -84], fsh: [34, -136], fup: 52, knee: 0 });
    tf(P.browP, `rotate(${(-12 * o.brow).toFixed(1)},28,-220)`);
    tf(P.browL, `translate(0,${(-4 * Math.max(0, o.brow)).toFixed(1)}) rotate(${(-12 * o.brow).toFixed(1)},-8,-217)`);
    tf(P.browR, `translate(0,${(-4 * Math.max(0, o.brow)).toFixed(1)}) rotate(${(12 * o.brow).toFixed(1)},8,-217)`);
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
