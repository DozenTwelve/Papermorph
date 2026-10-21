/* baka.js — episode 6's cast, props and places: Uncle Pedro (straw hat, vest, grey moustache), cousin Yui from
   Osaka (pigtails, a suitcase), Luna the cow (the side-on cow from episode 3, untouched), a thought bubble for the
   バカ gag, the MIKASA letters, and the layouts and views of the farm's three painted sets. Series helpers live in
   ../lib/shared.js; puppets are built on ../lib/cast.js the way episode 3's farm.js does. */
'use strict';

/* ---------- Uncle Pedro: the loudest uncle in Andalusia (pose keys as in cast.js) ----------
   Built on the aunt's grown-up frame (big head, long body on longer legs). Cream linen shirt under a brown vest with
   a big buckle, grey curls in a straw hat pushed back; the moustache goes on the face in pedroPuppet. armR 80…130 =
   raised, pointing out or sweeping wide; the arms hang at ±24. */
SHAPES.pedro = { ...SHAPES.aunt, sx: 66,
  body: 'M-50,-284 C-72,-270 -78,-140 -72,-96 Q-36,-84 0,-84 Q36,-84 72,-96 C78,-140 74,-270 50,-284 Z',
  extra: '<path d="M-58,-270 L-34,-276 L-40,-100 L-64,-96 Z" fill="#8a5a33"/>' +   // vest, front panels
    '<path d="M58,-270 L34,-276 L40,-100 L64,-96 Z" fill="#8a5a33"/>' +
    '<path d="M-44,-274 L0,-236 L44,-274 L48,-260 L0,-222 L-48,-260 Z" fill="#6f4323"/>' +   // vest neckline
    '<rect x="-74" y="-112" width="148" height="18" fill="#5f442c"/><rect x="-12" y="-114" width="24" height="22" rx="5" fill="#c9a44a"/>' +   // belt + buckle
    '<circle cx="52" cy="-246" r="4" fill="#c9a44a"/><circle cx="-52" cy="-246" r="4" fill="#c9a44a"/>',
  hair: ['#b8ac96', 'M-88,-368 C-94,-424 -54,-442 0,-442 C54,-442 94,-424 88,-368 Q66,-402 24,-418 Q0,-428 -24,-418 Q-66,-402 -88,-368 Z'],   // grey curls under the hat
  hat: '<path d="M-118,-372 Q-140,-392 -112,-392 Q0,-360 112,-392 Q140,-392 118,-372 Q0,-336 -118,-372 Z" fill="#e2c77e"/>' +   // brim
    '<path d="M-64,-382 C-58,-440 58,-440 64,-382 Q0,-398 -64,-382 Z" fill="#ecd590"/>' +   // dome
    '<path d="M-64,-388 Q0,-372 64,-388 L64,-376 Q0,-362 -64,-376 Z" fill="#8a5a33"/>' };   // hat band
function pedroPuppet(p, o) {
  const pup = spKid(p, 'pedro', { skin: '#e0b088', coat: '#e6d3ac', stripe: '#e6d3ac', pants: '#6d4a33', ...o });
  // the moustache sits on the face (it slides with the features), just above the mouth
  pup.g.querySelector('[data-p="feat"] .mouth').insertAdjacentHTML('beforebegin',
    `<path d="M-30,-328 Q-16,-340 0,-332 Q16,-340 30,-328 Q34,-318 24,-320 Q12,-326 0,-322 Q-12,-326 -24,-320 Q-34,-318 -30,-328 Z" fill="#8a745a"/>`);
  return pup;
}

/* ---------- Yui: the cousin from Osaka (a classmate build: pigtails, sunflower tee, blue skirt) ----------
   Her hold 'case' — the suitcase hangs from her screen-right mitten; pose({hold:'case'}) shows it. */
SHAPES.yui = kidShape('pigtails', '#211a17');
const yuiPuppet = (p, o) => spKid(p, 'yui', {
  coat: '#e8963c', stripe: '#e8963c', pants: '#5e6b8c',
  holds: { case: '<g filter="url(#paper)"><rect x="-30" y="0" width="60" height="92" rx="9" fill="#8a5a3a"/>' +
    '<rect x="-30" y="30" width="60" height="10" fill="#5f3c26"/><rect x="-9" y="-12" width="18" height="16" rx="7" fill="#5f3c26"/>' +
    '<circle cx="-12" cy="66" r="6" fill="#e8d9b0"/><circle cx="13" cy="52" r="7" fill="#e8d9b0"/></g>' }, ...o });

/* ---------- Luna: episode 3's cow, verbatim ---------- */
const haySVG = artSVG('hay', -38, -6, 77, 160);
const COW = { coat: '#f6f2ea', spot: '#2a2624', pink: '#f0a8a8', hoof: '#3a302a', horn: '#efe2c0' };
const REST_COW = { x: 0, y: 0, s: 1, dir: 1, headR: 0, jaw: 0, tail: 0, ear: 0, shut: false, lids: 0, eyeX: 1, eyeY: 0, brow: 0,
  walk: false, splay: 0, bob: 0, lie: 0, rod: false, swing: 0 };
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
    tf(P.line, `translate(${COW_ROD.tip[0]},${COW_ROD.tip[1]}) rotate(${(-o.swing + j(11)).toFixed(2)})`);
  } };
}

/* ---------- places: the three painted sets, 1600 × 900 world ----------
   gate: the lane runs across the whole foreground (walk-in at y = 800); the farmhouse's big arched door is at
   x ≈ 650–830, geraniums at ≈ 900, the blue door far right ≈ 1345, olive tree + bench + signboard on the left.
   pasture: red barn left, two-rail fence mid-frame at y ≈ 515–600 with posts ≈ every 330, hay bales right; everyone
   stands in the open meadow in front of the fence at y ≈ 806. Luna faces left (dir −1), head/eye around x ≈ 1030.
   stable: dusk. Barn right, its double doors y ≈ 375–660 and the blank board above (x ≈ 1045–1390, y ≈ 310–375) that
   becomes MIKASA; lantern post at x ≈ 800, chicken at ≈ 615, farmhouse left. */
const BK = {
  GROUND: 800,
  gate: { me: 330, yui: 490, pedro: 1210 },            // beat 1; Yui walks in from x 60 with the suitcase
  gateView: { x: 800, y: 520, z: 1.1 },
  gateYui: { x: 490, y: 490, z: 2.3 },                  // close on Yui for the language line
  PAST: { pedro: 430, me: 640, yui: 830, cow: { x: 1230, y: 806, s: .92, dir: -1 } },   // beats 2–5
  pastView: { x: 800, y: 505, z: 1.4 },
  pastTrio: { x: 700, y: 520, z: 1.62 },               // tighter two/three-shot for the whisper
  pastLuna: { x: 1000, y: 500, z: 1.85 },              // Luna's head + Yui at her muzzle
  pedroCU: { x: 430, y: 480, z: 2.3 },
  yuiCU: { x: 900, y: 480, z: 2.3 },
  cowCU: { x: 1010, y: 545, z: 2.25 },                 // Luna's head, since she faces left
  STAB: { pedro: 540, me: 650, yui: 880, cow: { x: 1180, y: 800, s: .95, dir: -1 } },
  stabView: { x: 760, y: 505, z: 1.28 },
  stabYui: { x: 760, y: 480, z: 1.75 },                // tight on Yui and Pedro for "Mi… baka?"
  stabSign: { x: 1160, y: 420, z: 2.0 },               // the board as Pedro paints it
  BOARD: { x: 1218, y: 348 },                          // centre of the blank board on the stable set
};

function gateSet(p) {
  const cam = paperCam(p, 'gate');
  const yui = yuiPuppet(cam.stage), me = mePuppet(cam.stage), pedro = pedroPuppet(cam.stage);
  return { cam, yui, me, pedro };
}
function pastSet(p) {
  const cam = paperCam(p, 'pasture');
  const cow = cowPuppet(cam.stage);
  const yui = yuiPuppet(cam.stage), me = mePuppet(cam.stage), pedro = pedroPuppet(cam.stage);
  return { cam, cow, yui, me, pedro };
}
function stabSet(p) {
  const cam = paperCam(p, 'stable');
  const sign = prop(cam.stage, mikasaLettersSVG());
  const cow = cowPuppet(cam.stage);
  const yui = yuiPuppet(cam.stage), me = mePuppet(cam.stage), pedro = pedroPuppet(cam.stage);
  // the lantern's glow, drawn over the puppets; the scene can pulse it
  const glow = mk('g', {}, cam.stage);
  glow.innerHTML = `<circle cx="800" cy="378" r="92" fill="#ffb347" opacity=".13"/><circle cx="800" cy="378" r="44" fill="#ffd089" opacity=".2"/>`;
  return { cam, sign, cow, yui, me, pedro, glow };
}

/* ---------- pop easing: 0 → overshoot → 1 (bubbles, letters, pops) ---------- */
const bkPop = (q, t0, dur = .5) => { const k = Math.max(0, Math.min(1, (q - t0) / dur)), c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

/* ---------- the thought bubble: Yui hears "vaca", her head answers バカ ----------
   Built on the world plane, above and left of her head; pose({x, y, k}) per frame, 0 hidden. The three small circles
   trail toward her head, so it stays a her-thought from any angle we frame. */
function bkBubble(p) {
  const g = mk('g', { visibility: 'hidden' }, p);
  g.innerHTML = `<g data-p="b"><g filter="url(#paper)">
      <ellipse cx="0" cy="0" rx="120" ry="70" fill="#fffdf6"/><circle cx="-138" cy="60" r="15" fill="#fffdf6"/>
      <circle cx="-160" cy="86" r="9" fill="#fffdf6"/><circle cx="-174" cy="106" r="4.5" fill="#fffdf6"/></g>
      <text data-p="w" x="0" y="26" font-family="'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif" font-size="64" font-weight="800" text-anchor="middle" fill="${SP_INK}">バカ</text></g>`;
  bakeAll(g);
  return { g, pose(o, f) {
    g.setAttribute('visibility', o.k <= 0 ? 'hidden' : 'visible');
    tf(g, `translate(${o.x.toFixed(1)},${o.y.toFixed(1)}) scale(${o.k.toFixed(3)})`);
    tf(g.querySelector('[data-p="w"]'), `rotate(${(2.5 * Math.sin((f / FPS) * 7.3) * o.k).toFixed(2)})`);
  } };
}

/* ---------- MIKASA: one group per letter, so they can drop in one by one (scene 6) ---------- */
function mikasaLettersSVG() {
  return `<g transform="translate(${BK.BOARD.x},${BK.BOARD.y - 16}) scale(.78)"><g data-p="letters">${'MIKASA'.split('').map((c, i) => `<g data-p="l${i}" transform="translate(${(i - 2.5) * 58},0)">
      <g filter="url(#paper)"><path d="M-18,32 q9,24 3,42 l-6,-1 q-5,-17 -9,-40 Z" fill="#a83c28" opacity=".5"/>
      <text x="0" y="24" font-family="'Avenir Next Heavy','Arial Black','DejaVu Sans',sans-serif" font-size="58" font-weight="800" text-anchor="middle" fill="#a83c28" transform="rotate(${i % 2 ? 3 : -2})">${c}</text></g></g>`).join('')}</g>`;
}

/* ---------- the closing card: black, a torn strip, the episode's line (the series' pattern) ---------- */
function bkTitleCard(p) {
  const card = mk('g', { visibility: 'hidden' }, p);
  card.innerHTML = `<rect width="1600" height="900" fill="#0d0b0a"/>
    <g filter="url(#paper)"><path d="M180,330 L260,318 L420,334 L600,316 L800,332 L1000,317 L1200,333 L1380,318 L1430,330 L1420,430 L1370,444 L1180,428 L1000,444 L800,430 L600,446 L400,430 L240,446 L176,432 Z" fill="#f3ead6"/></g>
    <text x="800" y="408" text-anchor="middle" font-family="'Chalkboard SE','Avenir Next Heavy',sans-serif" font-size="66" font-weight="800" fill="#2a1c14">Baka Means Cow</text>
    <text x="800" y="560" text-anchor="middle" font-family="'Avenir Next',Arial,sans-serif" font-size="26" fill="#8a745a">Joke Collection · Episode 7</text>`;
  return { g: card, on(v) { card.setAttribute('visibility', v ? 'visible' : 'hidden'); } };
}
