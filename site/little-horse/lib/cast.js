/* cast.js — the animals of The Little Horse Crosses the River, on paper.js: Little Horse, Mother, Uncle Ox (a water
   buffalo), Squirrel and a little rabbit. All are drawn in profile facing right, at the point on the ground under the
   body (0, 0); `turn` -1 faces left, and a turn tweened through 0 squashes the whole figure flat and out mirrored,
   as a cut-out turned over on the table.

   The four-legged ones share one rig (beast): each leg is two pieces on pins and is solved to put its hoof on a point,
   so a hoof planted on the ground stays exactly there while the body rides over it. Walking and trotting come from the
   distance covered, not the clock: pose({ d }) with d in the puppet's own units, and the scene moves x by d·s in the
   facing direction (x = x0 + turn·s·d), so the feet never slide. `stand` (0..1) blends every leg back to its rest
   place for a stop.

   at(name) gives a named point of the drawn pose in the puppet's parent's coordinates ('mouth', 'back', 'eye',
   'head'; a leg's hip 'nf' 'ff' 'nh' 'fh', its knee or hock 'nfk' …, its hoof 'nfHoof' …; Squirrel: 'mouth', 'paw',
   'eye', 'top'; Rabbit: 'eye', 'top'), so a sack in a mouth or water at a knee lands where the picture is.
   brow: positive tips the brow down to the nose (cross, determined), negative lifts it (worried, surprised). */
'use strict';

// How far a jaw opens for each mouth shape of the cues.
const JAW = { X: 0, A: 0, B: .25, C: .45, D: .9, E: .6, F: .3, G: .2, H: .35 };
const tri = x => 1 - Math.abs(((x % 2) + 2) % 2 - 1);   // 0..1..0 every 2
const frac = x => x - Math.floor(x);
const deg = r => r * 180 / Math.PI;

const pf = (body, id = '') => `<g${id ? ` data-p="${id}"` : ''} filter="url(#paper)">${body}</g>`;
const mark = (id, x, y) => `<g data-p="${id}" transform="translate(${x} ${y})"></g>`;

/* ---------- the four-legged rig ----------
   geo: { hips: { nf: [x, y], ff, nh, fh }, up, low, L (stride), H (hoof lift), neck: [x, y] pivot, head: [x, y] pivot,
          jaw: [x, y] pivot, ear: [x, y], tail: [x, y], body: [x, y] tilt centre, rest: { nf: dx, … } hoof under hip }
   Legs: nf near fore, ff far fore, nh near hind, fh far hind. A fore knee folds forward, a hind hock backward. */
function legSVG(id, up, low, wUp, wLow, col, hoof, sock = null) {
  const u = `<path d="M${-wUp / 2},-6 C${-wUp / 2},${up * .5} ${-wLow / 2 - 1},${up * .8} ${-wLow / 2},${up + 4} L${wLow / 2},${up + 4} C${wLow / 2 + 1},${up * .8} ${wUp / 2},${up * .5} ${wUp / 2},-6 Z" fill="${col}"/>`;
  const l = `<path d="M${-wLow / 2},-3 L${-wLow / 2 + 1},${low - 14} L${wLow / 2 - 1},${low - 14} L${wLow / 2},-3 Z" fill="${col}"/>`
    + (sock ? `<path d="M${-wLow / 2 + 1},${low - 34} L${-wLow / 2 + 1},${low - 12} L${wLow / 2 - 1},${low - 12} L${wLow / 2 - 1},${low - 34} Z" fill="${sock}"/>` : '')
    + `<path d="M${-wLow / 2 - 2},${low - 15} L${wLow / 2 + 4},${low - 15} L${wLow / 2 + 7},${low} L${-wLow / 2 - 3},${low} Z" fill="${hoof}"/>`;
  return `<g data-p="${id}">${pf(u)}<g data-p="${id}k" transform="translate(0 ${up})">${pf(l)}${pinAt(0, 0)}${mark(id + 'Hoof', 1, low)}</g>${pinAt(0, 0)}</g>`;
}

// Two-bone reach from a hip to a hoof point (dx, dy from the hip, y down): the upper and lower piece angles in degrees
// (SVG rotate, 0 = straight down). bend +1 puts the joint forward (a fore knee), -1 backward (a hind hock).
function reach2(dx, dy, up, low, bend) {
  let D = Math.hypot(dx, dy); D = Math.min(up + low - .5, Math.max(Math.abs(up - low) + 1, D));
  const phi0 = Math.atan2(dx, dy), b = Math.acos(Math.max(-1, Math.min(1, (up * up + D * D - low * low) / (2 * up * D))));
  const p1 = phi0 + bend * b, kx = up * Math.sin(p1), ky = up * Math.cos(p1);
  const p2 = Math.atan2(dx - kx, dy - ky);
  return [-deg(p1), -deg(p2 - p1)];
}

// Where each hoof is, relative to its rest place, at walk distance d: [dx, lift]. Walk: one hoof at a time (lateral
// sequence); trot: diagonal pairs.
const GAITS = {
  walk: { phase: { nh: 0, nf: .25, fh: .5, ff: .75 }, beta: .64, bob: 2.5 },
  trot: { phase: { nh: 0, ff: 0, fh: .5, nf: .5 }, beta: .5, bob: 6 },
};
function gait(d, kind, L, H) {
  const G = GAITS[kind], out = {}, u0 = d / L;
  for (const k of ['nf', 'ff', 'nh', 'fh']) {
    const r = frac(u0 + G.phase[k]), b = G.beta, s = L * b;
    if (r < b) out[k] = [s / 2 - s * (r / b), 0];
    else { const w = (r - b) / (1 - b); out[k] = [-s / 2 + s * ease(w), H * Math.sin(Math.PI * w)]; }
  }
  out.bob = kind === 'trot' ? -G.bob * Math.abs(Math.sin(2 * Math.PI * u0)) : -G.bob * (1 - Math.cos(4 * Math.PI * u0)) / 2;
  return out;
}

const REST_BEAST = { x: 0, y: 0, s: 1, turn: 1, d: 0, gait: 'walk', stand: 1, bob: 0, tilt: 0, neck: 0, nod: 0, mouth: 'X',
  jaw: null, shut: false, lid: 0, look: 0, brow: 0, ear: 0, tail: 0, legs: {}, sack: false, cloth: true, grass: false, chew: 0, tear: false };

function beast(parent, svg, geo, rest) {
  const g = mk('g', {}, parent);
  g.innerHTML = svg;
  bakeAll(g);
  const P = pieces(g), R = { ...REST_BEAST, ...rest };
  const legs = ['nf', 'ff', 'nh', 'fh'];
  const pup = {
    g, P,
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
      if (P.sack) vis(P.sack, !!o.sack);
      if (P.cloth) vis(P.cloth, !!o.cloth);
      if (P.grass) vis(P.grass, !!o.grass);
      if (P.tear) vis(P.tear, !!o.tear);
    },
    at(name) { const m = P[name] || P['at_' + name]; const M = g.parentNode.getCTM().inverse().multiply(m.getCTM()); return [M.e, M.f]; },
  };
  return pup;
}

/* ---------- Little Horse and Mother ----------
   Little Horse: a chestnut foal, long legs, a big head, a red saddle cloth (cloth), the half sack of wheat (sack).
   Mother: a bay mare, bigger (build her at s about 1.3), a white blaze. */
const HORSE_GEO = { hips: { nf: [44, -118], ff: [52, -118], nh: [-46, -118], fh: [-38, -118] }, up: 58, low: 64, L: 74, H: 18,
  body: [0, -128], neck: [46, -150], head: [86, -228], jaw: [112, -176], jawOpen: 16, ear: [84, -244], tail: [-70, -142],
  rest: { nf: 2, ff: 0, nh: -2, fh: 0 }, eye: [100, -222], lidH: 14, lookX: 4.5 };
function horseSVG(c) {
  const legs = (far) => far
    ? legSVG('fh', 58, 64, 30, 13, c.far, c.hoof) + legSVG('ff', 58, 64, 22, 13, c.far, c.hoof)
    : legSVG('nh', 58, 64, 32, 14, c.coat, c.hoof, c.sock) + legSVG('nf', 58, 64, 23, 14, c.coat, c.hoof, c.sockF);
  return `${legs(true)}
  <g data-p="trunk">
    <g data-p="tail">${pf(`<path d="M-70,-148 C-98,-152 -114,-124 -110,-84 C-108,-70 -98,-64 -92,-74 C-96,-100 -90,-124 -66,-136 Z" fill="${c.mane}"/><path d="M-96,-118 C-104,-104 -102,-88 -98,-78" stroke="${c.mane2}" stroke-width="4" fill="none"/>`)}</g>
    ${pf(`<path d="M-80,-128 C-82,-160 -52,-170 -12,-165 C30,-168 64,-162 76,-140 C84,-120 72,-96 40,-92 L-40,-92 C-72,-94 -80,-110 -80,-128 Z" fill="${c.coat}"/>
      <path d="M-70,-104 C-50,-92 30,-90 60,-104 C52,-94 40,-92 30,-92 L-40,-92 C-56,-93 -66,-98 -70,-104 Z" fill="${c.shade}"/>`)}
    <g data-p="cloth">${pf(`<path d="M-34,-166 C-10,-170 18,-170 34,-166 L38,-118 C14,-112 -14,-112 -38,-118 Z" fill="#c8322f"/><path d="M-34,-128 C-12,-122 14,-122 36,-128" stroke="#e8b73e" stroke-width="5" fill="none"/><circle cx="0" cy="-142" r="7" fill="#e8b73e"/>`)}</g>
    <g data-p="sack">${pf(`<path d="M-40,-160 C-46,-186 -30,-204 -4,-206 C24,-208 42,-192 40,-166 C26,-158 -24,-156 -40,-160 Z" fill="#d9b77c"/><path d="M-30,-174 C-10,-170 14,-170 32,-176" stroke="#b8935a" stroke-width="3" fill="none"/>
      <path d="M-8,-204 L-14,-222 M0,-206 L2,-226 M8,-204 L16,-220" stroke="#c9a04a" stroke-width="3"/><ellipse cx="-14" cy="-224" rx="3.5" ry="6" fill="#e2c062"/><ellipse cx="2" cy="-229" rx="3.5" ry="6" fill="#e2c062"/><ellipse cx="17" cy="-222" rx="3.5" ry="6" fill="#e2c062"/>
      <path d="M-6,-203 C-2,-208 6,-208 10,-203" stroke="#8a5a36" stroke-width="5" fill="none"/>`)}${mark('at_back', 0, -170)}</g>
    <g data-p="neckG">
      ${pf(`<path d="M24,-160 C36,-194 60,-228 84,-238 L106,-216 C94,-196 80,-168 74,-136 C58,-128 36,-132 24,-160 Z" fill="${c.coat}"/>`)}
      ${pf(`<path d="M22,-162 C30,-196 52,-232 80,-246 L86,-236 C70,-226 58,-212 50,-196 L44,-198 C40,-186 36,-176 32,-166 Z" fill="${c.mane}"/><path d="M30,-170 l-10,4 M38,-188 l-11,2 M48,-206 l-10,0 M60,-222 l-8,-3" stroke="${c.mane}" stroke-width="7" stroke-linecap="round"/>`)}
      <g data-p="headG">
        ${pf(`<path d="M70,-240 C82,-254 106,-250 116,-234 C128,-216 142,-202 146,-190 C150,-176 140,-168 128,-170 L104,-174 C86,-178 72,-196 68,-214 C66,-226 66,-234 70,-240 Z" fill="${c.coat}"/>
          <ellipse cx="132" cy="-182" rx="17" ry="13" fill="${c.muzzle}"/>${c.blaze ? `<path d="M94,-246 C104,-230 116,-210 126,-192 L132,-196 C122,-212 110,-234 100,-248 Z" fill="#f4ecdc"/>` : ''}
          <ellipse cx="142" cy="-187" rx="3.6" ry="2.6" fill="#3a2418"/>${c.cheek ? `<circle cx="112" cy="-198" r="8" fill="#e77f6a" opacity=".45"/>` : ''}`)}
        <g data-p="jaw">${pf(`<path d="M108,-178 C120,-172 136,-170 144,-174 C143,-163 128,-158 112,-166 Z" fill="${c.muzzle2}"/>`)}${mark('at_mouth', 140, -170)}</g>
        <g data-p="ear">${pf(`<path d="M76,-240 L78,-274 L94,-244 Z" fill="${c.coat}"/><path d="M80,-244 L81,-266 L90,-246 Z" fill="${c.ear}"/>`)}</g>
        ${pf(`<path d="M80,-246 C86,-256 98,-256 104,-248 C98,-246 94,-240 92,-232 C88,-240 84,-244 80,-246 Z" fill="${c.mane}"/>`)}
        <g data-p="eyeO"><ellipse cx="100" cy="-222" rx="${c.eyeR}" ry="${c.eyeR + 1}" fill="#fbf6ea"/><g data-p="pupil"><circle cx="102" cy="-221" r="${c.eyeR * .62}" fill="#2a1a10"/><circle cx="104" cy="-224" r="1.8" fill="#fff"/></g>
          ${c.lash ? `<path d="M${100 + c.eyeR - 2},-${222 + c.eyeR - 1} l5,-5 M${100 + c.eyeR - 6},-${222 + c.eyeR + 1} l3,-6" stroke="#2a1a10" stroke-width="2"/>` : ''}
          <g data-p="lid"><rect x="${100 - c.eyeR - 1}" y="-${222 + c.eyeR + 2}" width="${2 * c.eyeR + 2}" height="${c.eyeR + 3}" fill="${c.coat}"/><path d="M${100 - c.eyeR},-${219} h${2 * c.eyeR}" stroke="#2a1a10" stroke-width="2"/></g></g>
        <g data-p="eyeC"><path d="M${100 - c.eyeR},-221 Q100,-${214 - 1} ${100 + c.eyeR},-221" stroke="#2a1a10" stroke-width="2.6" fill="none"/></g>
        <path data-p="brow" d="M${92},-${236} Q100,-${240} ${110},-${236}" stroke="${c.mane}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <g data-p="tear">${pf(`<path d="M104,-212 C100,-204 100,-200 104,-198 C108,-200 108,-204 104,-212 Z" fill="#9fd0ea"/>`)}</g>
        ${mark('at_eye', 100, -222)}${mark('at_head', 88, -260)}
        ${pinAt(86, -228)}
      </g>${pinAt(46, -150)}
    </g>
  </g>
  ${legs(false)}`;
}
const LITTLE = { coat: '#c8753d', shade: '#b0612f', far: '#a2592b', mane: '#6b3a1f', mane2: '#55301a', muzzle: '#eab68c', muzzle2: '#d99c72',
  hoof: '#4a2e1e', ear: '#e9a07e', sock: '#f2e6cf', sockF: null, eyeR: 9, cheek: true, lash: false, blaze: false };
const MAMA = { coat: '#8a5233', shade: '#784529', far: '#6c3e25', mane: '#3a2418', mane2: '#2a1a10', muzzle: '#c99a76', muzzle2: '#b5845f',
  hoof: '#2e1e14', ear: '#c98a6a', sock: '#f2e6cf', sockF: '#f2e6cf', eyeR: 7.5, cheek: false, lash: true, blaze: true };
function horsePuppet(parent, o = {}) { return beast(parent, horseSVG(LITTLE), HORSE_GEO, { cloth: true, ...o }); }
function motherPuppet(parent, o = {}) { return beast(parent, horseSVG(MAMA), HORSE_GEO, { cloth: false, gait: 'walk', ...o }); }

/* ---------- Uncle Ox: an old water buffalo, slate grey, great swept horns, sleepy lids ----------
   chew (a number that grows with time) works the jaw; grass: a tuft in his mouth. */
// Long legs on purpose: at the river's deepest the water must sit on his shins (half his lower leg), where it sits on
// Little Horse's knees. The trunk is drawn as before and lifted 28 units onto the longer legs.
const OX_GEO = { hips: { nf: [84, -140], ff: [94, -140], nh: [-88, -140], fh: [-78, -140] }, up: 66, low: 76, L: 80, H: 16,
  body: [0, -168], neck: [100, -156], head: [148, -166], jaw: [170, -104], jawOpen: 14, ear: [140, -168], tail: [-124, -164],
  rest: { nf: 2, ff: 0, nh: -2, fh: 0 }, eye: [162, -158], lidH: 10, lookX: 3 };   // pivots inside the lifted trunk keep its own coordinates
function oxSVG() {
  const C = '#776b63', S = '#655a53', F = '#5a5049', H = '#ddd0b2', N = '#a08f84';
  return `${legSVG('fh', 66, 76, 46, 28, F, '#2d2926')}${legSVG('ff', 66, 76, 40, 28, F, '#2d2926')}
  <g data-p="trunk"><g transform="translate(0 -28)">
    <g data-p="tail">${pf(`<path d="M-124,-166 C-140,-150 -146,-120 -142,-92" stroke="${S}" stroke-width="6" fill="none"/><path d="M-148,-96 C-150,-84 -142,-72 -136,-74 C-134,-84 -136,-92 -140,-98 Z" fill="#2d2926"/>`)}</g>
    ${pf(`<path d="M-130,-140 C-132,-186 -82,-198 -10,-194 C52,-198 106,-192 120,-160 C130,-130 116,-96 82,-90 L-82,-90 C-120,-92 -130,-112 -130,-140 Z" fill="${C}"/>
      <path d="M-120,-104 C-90,-90 60,-88 104,-104 C96,-94 88,-90 80,-90 L-82,-90 C-100,-91 -114,-96 -120,-104 Z" fill="${S}"/>
      <path d="M40,-192 C70,-196 100,-188 112,-170 C96,-178 70,-184 40,-186 Z" fill="#7c7672"/>`)}
    <g data-p="neckG">
      ${pf(`<path d="M86,-186 C118,-192 146,-182 158,-164 L152,-122 C132,-114 108,-118 90,-128 Z" fill="${C}"/>`)}
      <g data-p="headG">
        ${pf(`<path d="M154,-180 C130,-196 98,-204 72,-200 C48,-196 36,-210 40,-242 C54,-224 62,-216 78,-218 C106,-220 134,-212 156,-196 Z" fill="#a99c80"/>`)}
        ${pf(`<path d="M136,-186 C162,-192 184,-176 194,-150 C204,-128 206,-112 198,-104 C188,-96 172,-100 162,-110 C148,-130 136,-152 132,-170 Z" fill="${C}"/>
          <ellipse cx="190" cy="-110" rx="19" ry="14" fill="${N}"/><ellipse cx="199" cy="-114" rx="4" ry="2.8" fill="#2d2926"/>`)}
        <circle cx="201" cy="-103" r="6" fill="none" stroke="#c9a24c" stroke-width="2.6"/>
        <g data-p="jaw">${pf(`<path d="M164,-108 C176,-102 190,-98 198,-100 C196,-90 180,-86 168,-94 Z" fill="${S}"/>`)}
          <g data-p="grass">${pf(`<path d="M190,-98 C196,-92 200,-80 197,-64 M194,-98 C203,-94 211,-84 213,-70 M186,-97 C188,-88 186,-78 181,-68 M192,-98 C200,-90 204,-82 205,-74" stroke="#7da34a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M197,-64 l-2,7 M213,-70 l1,7 M181,-68 l-3,6" stroke="#6c9440" stroke-width="4" stroke-linecap="round"/>`)}</g>${mark('at_mouth', 194, -98)}</g>
        <g data-p="ear">${pf(`<path d="M140,-170 C124,-160 110,-160 104,-166 C114,-176 128,-178 140,-176 Z" fill="${S}"/><path d="M134,-170 C124,-166 116,-166 112,-168 C120,-172 128,-173 134,-173 Z" fill="#a08e86"/>`)}</g>
        ${pf(`<path d="M146,-174 C122,-186 90,-194 64,-190 C40,-186 28,-200 32,-232 C46,-214 54,-206 70,-208 C98,-210 126,-202 146,-190 Z" fill="${H}"/><path d="M64,-190 C62,-198 64,-204 70,-208 M96,-194 C94,-200 96,-206 100,-209" stroke="#c4b796" stroke-width="3" fill="none"/>`)}
        <g data-p="eyeO"><ellipse cx="162" cy="-158" rx="6" ry="6.5" fill="#f4ecdc"/><g data-p="pupil"><circle cx="163" cy="-157" r="4" fill="#1e1a18"/><circle cx="164.5" cy="-159" r="1.3" fill="#fff"/></g>
          <g data-p="lid"><rect x="155" y="-166" width="14" height="9" fill="${C}"/><path d="M155,-157 h14" stroke="#1e1a18" stroke-width="2"/></g></g>
        <g data-p="eyeC"><path d="M156,-157 Q162,-152 168,-157" stroke="#1e1a18" stroke-width="2.4" fill="none"/></g>
        <path data-p="brow" d="M154,-170 Q162,-174 170,-170" stroke="#3e3a37" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        ${mark('at_eye', 162, -158)}${mark('at_head', 150, -200)}${pinAt(148, -166)}
      </g>${pinAt(100, -156)}
    </g>
  </g></g>
  ${legSVG('nh', 66, 76, 50, 30, C, '#2d2926')}${legSVG('nf', 66, 76, 44, 30, C, '#2d2926')}`;
}
function oxPuppet(parent, o = {}) { return beast(parent, oxSVG(), OX_GEO, { cloth: false, lid: .4, ...o }); }

/* ---------- Squirrel: rust red, a great plume of a tail, sits up on his haunches ----------
   Feet at (0, 0), facing right, about 130 tall with the tail. tail / tail2 bend the plume, paw raises the near front
   paw (degrees, - forward/up), pawF the far one, lean tips the upper body, hop lifts him (px, the scene's arc), stretch
   (0..1) lengthens him for a leap, tear shows a tear. */
const REST_SQ = { x: 0, y: 0, s: 1, turn: 1, lean: 0, headR: 0, tail: 0, tail2: 0, paw: 0, pawF: 0, mouth: 'X', shut: false, look: 0,
  brow: 0, ear: 0, tear: false, hop: 0, stretch: 0 };
function squirrelPuppet(parent, o = {}) {
  const C = '#c4622c', D = '#a24f22', B = '#f0d9b0', T = '#d9824a';
  const g = mk('g', {}, parent);
  g.innerHTML = `
  <g data-p="tailA">${pf(`<path d="M-14,-18 C-46,-14 -62,-40 -56,-72 C-52,-92 -40,-100 -30,-96 C-44,-80 -44,-54 -26,-40 Z" fill="${C}"/><path d="M-46,-48 C-52,-62 -50,-80 -40,-92" stroke="${T}" stroke-width="5" fill="none"/>`)}
    <g data-p="tailB">${pf(`<path d="M-36,-94 C-26,-122 0,-130 14,-116 C24,-106 20,-92 10,-92 C2,-108 -16,-108 -26,-88 Z" fill="${C}"/><path d="M-28,-108 C-16,-120 0,-122 10,-112" stroke="${T}" stroke-width="5" fill="none"/>`)}</g></g>
  <g data-p="pawFG">${pf(`<path d="M10,-64 C20,-58 28,-50 30,-42 C26,-38 22,-40 20,-46 C16,-52 10,-56 6,-58 Z" fill="${D}"/>`)}</g>
  ${pf(`<ellipse cx="-4" cy="-18" rx="22" ry="18" fill="${C}"/><path d="M-4,-2 C8,-2 22,0 28,-2 C28,4 8,4 -6,4 Z" fill="${D}"/>`)}
  <g data-p="upper">
    ${pf(`<path d="M-20,-30 C-26,-56 -14,-80 4,-82 C20,-82 24,-60 20,-36 C16,-22 -14,-18 -20,-30 Z" fill="${C}"/><path d="M6,-74 C16,-64 18,-44 12,-30 C6,-26 0,-30 2,-40 C4,-52 4,-64 6,-74 Z" fill="${B}"/>`)}
    <g data-p="headG">
      ${pf(`<circle cx="10" cy="-92" r="17" fill="${C}"/><path d="M14,-104 C28,-102 38,-94 40,-88 C40,-82 34,-80 26,-80 L12,-80 Z" fill="${C}"/><path d="M22,-86 C30,-84 36,-84 39,-87 C38,-80 30,-78 22,-80 Z" fill="${B}"/><circle cx="40" cy="-89" r="3" fill="#2a1a10"/>`)}
      <g data-p="ear">${pf(`<path d="M0,-104 L2,-124 L6,-128 L8,-122 L12,-106 Z" fill="${C}"/><path d="M3,-108 L5,-120 L9,-108 Z" fill="#e9a07e"/>`)}</g>
      <g data-p="jaw">${pf(`<path d="M22,-81 C28,-79 34,-79 37,-81 C36,-75 28,-73 22,-77 Z" fill="${D}"/>`)}${mark('at_mouth', 36, -80)}</g>
      <g data-p="eyeO"><circle cx="22" cy="-96" r="5" fill="#1e140c"/><circle cx="23.5" cy="-97.5" r="1.6" fill="#fff"/></g>
      <g data-p="eyeC"><path d="M17,-95 Q22,-91 27,-95" stroke="#1e140c" stroke-width="2.2" fill="none"/></g>
      <path data-p="brow" d="M16,-105 L28,-103" stroke="${D}" stroke-width="3" stroke-linecap="round"/>
      <g data-p="tear">${pf(`<path d="M24,-90 C21,-84 21,-81 24,-79 C27,-81 27,-84 24,-90 Z" fill="#9fd0ea"/>`)}</g>
      ${mark('at_eye', 22, -96)}${mark('at_top', 6, -128)}${pinAt(4, -78)}
    </g>
    <g data-p="pawG">${pf(`<path d="M8,-63 C20,-58 30,-48 33,-38 C29,-31 22,-33 21,-40 C17,-48 9,-51 4,-56 Z" fill="${D}"/><ellipse cx="30" cy="-35" rx="6" ry="5" fill="#6e3414"/>`)}${mark('at_paw', 31, -35)}${pinAt(7, -60)}</g>
  </g>
  ${pf(`<path d="M-2,-6 C10,-8 22,-6 26,-2 C24,2 6,2 -4,0 Z" fill="${D}"/>`)}`;
  bakeAll(g);
  const P = pieces(g), R = { ...REST_SQ, ...o };
  return { g, P,
    pose(o, f) {
      o = { ...R, ...o }; const j = k => jit(f, k);
      tf(g, `translate(${(o.x + j(1) * .5).toFixed(1)},${(o.y - o.hop + j(2) * .4).toFixed(1)}) scale(${(o.s * o.turn).toFixed(4)},${(o.s * (1 + .18 * o.stretch)).toFixed(4)})`);
      tf(P.upper, `rotate(${(o.lean + j(3) * .5).toFixed(2)},-2,-24)`);
      tf(P.headG, `rotate(${(o.headR + j(4) * .7).toFixed(2)},4,-78)`);
      tf(P.tailA, `rotate(${(o.tail + j(5) * 1.2).toFixed(2)},-14,-20)`); tf(P.tailB, `rotate(${(o.tail2 + j(6) * 1.5).toFixed(2)},-32,-92)`);
      tf(P.pawG, `rotate(${(o.paw + j(7)).toFixed(1)},7,-60)`); tf(P.pawFG, `rotate(${(o.pawF + j(9)).toFixed(1)},8,-62)`);
      tf(P.jaw, `rotate(${((JAW[o.mouth || 'X'] ?? 0) * 18).toFixed(1)},22,-80)`);
      tf(P.ear, `rotate(${(o.ear * 15).toFixed(1)},6,-106)`);
      tf(P.brow, `rotate(${(o.brow * 16).toFixed(1)},22,-104)`);
      vis(P.eyeO, !o.shut); vis(P.eyeC, !!o.shut); vis(P.tear, !!o.tear);
    },
    at(name) { const m = P['at_' + name]; const M = g.parentNode.getCTM().inverse().multiply(m.getCTM()); return [M.e, M.f]; },
  };
}

/* ---------- the little rabbit: white, long ears, sits ----------
   ears (degrees, + back), nose twitch on twos while `sniff`, hop lifts it, tuck (0..1) folds it down to ride. */
const REST_RB = { x: 0, y: 0, s: 1, turn: 1, ears: 0, ear2: 0, headR: 0, shut: false, look: 0, hop: 0, sniff: false, lean: 0 };
function rabbitPuppet(parent, o = {}) {
  const W = '#efe9df', S = '#d9d1c4', K = '#e9a7a2';
  const g = mk('g', {}, parent);
  g.innerHTML = `
  ${pf(`<circle cx="-28" cy="-26" r="10" fill="#fbf8f2"/>`)}
  <g data-p="earF">${pf(`<path d="M10,-66 C2,-92 4,-118 12,-124 C20,-118 20,-92 16,-66 Z" fill="${S}"/>`)}</g>
  <g data-p="body">
    ${pf(`<path d="M-30,-20 C-34,-46 -12,-62 10,-58 C30,-54 34,-30 26,-12 C18,0 -24,2 -30,-20 Z" fill="${W}"/><path d="M14,-4 C22,-4 32,-2 34,2 C26,4 14,4 8,2 Z" fill="${S}"/>`)}
    <g data-p="headG">
      ${pf(`<path d="M4,-64 C6,-82 24,-90 38,-80 C48,-72 48,-58 38,-52 C26,-46 8,-48 4,-64 Z" fill="${W}"/><circle cx="46" cy="-62" r="3" fill="${K}"/><circle cx="34" cy="-56" r="5" fill="#f2b8b0" opacity=".5"/>`)}
      <g data-p="ear">${pf(`<path d="M14,-76 C6,-102 10,-126 18,-130 C26,-124 26,-98 22,-76 Z" fill="${W}"/><path d="M16,-82 C12,-100 14,-118 18,-122 C22,-116 22,-98 20,-82 Z" fill="${K}"/>`)}</g>
      <g data-p="eyeO"><circle cx="34" cy="-70" r="4" fill="#2a1a20"/><circle cx="35.2" cy="-71.2" r="1.3" fill="#fff"/></g>
      <g data-p="eyeC"><path d="M30,-69 Q34,-66 38,-69" stroke="#2a1a20" stroke-width="2" fill="none"/></g>
      <g data-p="nose">${pf(`<path d="M44,-60 l3,4 l-5,1 Z" fill="#c97a78"/>`)}</g>
      ${mark('at_eye', 34, -70)}${mark('at_top', 18, -130)}${pinAt(8, -58)}
    </g>
    ${pf(`<path d="M8,-30 C14,-24 18,-14 16,-6 C12,-4 8,-8 8,-14 Z" fill="${S}"/>`)}
  </g>`;
  bakeAll(g);
  const P = pieces(g), R = { ...REST_RB, ...o };
  return { g, P,
    pose(o, f) {
      o = { ...R, ...o }; const j = k => jit(f, k);
      tf(g, `translate(${(o.x + j(1) * .5).toFixed(1)},${(o.y - o.hop + j(2) * .4).toFixed(1)}) scale(${(o.s * o.turn).toFixed(4)},${o.s.toFixed(4)})`);
      tf(P.body, `rotate(${(o.lean + j(3) * .4).toFixed(2)},0,-10)`);
      tf(P.headG, `rotate(${(o.headR + j(4) * .6).toFixed(2)},8,-58)`);
      tf(P.ear, `rotate(${(o.ears + j(5)).toFixed(1)},18,-76)`); tf(P.earF, `rotate(${(o.ears + o.ear2 - 6 + j(6)).toFixed(1)},14,-66)`);
      tf(P.nose, `translate(0,${o.sniff && onTwos(f / FPS) > 0 ? -1.5 : 0})`);
      vis(P.eyeO, !o.shut); vis(P.eyeC, !!o.shut);
      tf(P.eyeO, `translate(${(o.look * 1.5).toFixed(1)},0)`);
    },
    at(name) { const m = P['at_' + name]; const M = g.parentNode.getCTM().inverse().multiply(m.getCTM()); return [M.e, M.f]; },
  };
}

// The half sack of wheat on its own, for Mother to carry in her teeth: drawn around its tie (0, 0).
const SACK = pf(`<path d="M-40,10 C-46,-16 -30,-34 -4,-36 C24,-38 42,-22 40,4 C40,30 24,40 -2,40 C-28,40 -38,30 -40,10 Z" fill="#d9b77c"/><path d="M-30,-4 C-10,0 14,0 32,-6" stroke="#b8935a" stroke-width="3" fill="none"/>
  <path d="M-8,-34 L-14,-52 M0,-36 L2,-56 M8,-34 L16,-50" stroke="#c9a04a" stroke-width="3"/><ellipse cx="-14" cy="-54" rx="3.5" ry="6" fill="#e2c062"/><ellipse cx="2" cy="-59" rx="3.5" ry="6" fill="#e2c062"/><ellipse cx="17" cy="-52" rx="3.5" ry="6" fill="#e2c062"/>
  <path d="M-6,-33 C-2,-38 6,-38 10,-33" stroke="#8a5a36" stroke-width="5" fill="none"/>`);
