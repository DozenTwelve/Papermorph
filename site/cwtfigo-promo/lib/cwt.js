/* cwt.js — the cast of the CWTFIGO promo: Doc, Martin and Claude as flat South Park cut-outs.
   The bodies and heads are image-model pictures cut off a magenta key (img/cast/, tools/cwtfigo-promo/cut.py); the
   eyes, lids, brows, mouths and arms are live SVG drawn in the same flat colours with the same ink, so a face can blink,
   look, talk and an arm can reach anywhere without another picture. Coordinates inside a puppet are the pixels of its
   1024 × 1536 source picture; K scales them to the stage and the pose's s on top.

   pose(o, f): x, y (feet), s, look (-1 … 1, the face slides as the show's faces do), eyeX/eyeY (pupils, -1 … 1),
   lids (0 open … 1 shut), shut (blink), mouth (a Rhubarb shape A–H/X or an expression of SP_MOUTHS; Claude: an
   opening 0 … 1 or a shape), brow (-1 angry … 1 worried), headR/headY (head tilt and drop; Doc and Martin), bob
   (the whole figure up), squash (1 = none), lean (degrees), armL/armR (degrees, + raises outward, 0 hangs),
   reachL/reachR (arm length, 1 rest), frontL/frontR (draw that arm in front of the body), hold/holdL ({ name, w, x, y,
   r, upright, text }: a prop picture in the screen-right / screen-left mitten), o (opacity), bliss (eyes shut happy: two arcs), back (Claude seen from behind: no face, arms behind him). Claude also takes spin (the ✻'s turn
   in degrees), star (its colour) and puff (cigar smoke on). */
'use strict';
const CW_INK = '#1d1a1a';
const CW_PROPS = { sign: [305, 439], notebook: [167, 223], 'notebook-open': [352, 220], cigar: [338, 97], laptop: [348, 197],
  'laptop-open': [415, 249], iron: [481, 164], screwdriver: [414, 73], 'claude-reading': [427, 881] };
const CW = {
  doc: { K: .33, head: [197, 79, 631, 598], body: [226, 384, 574, 1039], feet: [512, 1422], neck: [512, 668],
    skin: '#fbcb8f', sleeve: '#1e5f31', shoulders: [[302, 680], [720, 680]], arm: 350, armW: 78, hand: 62,
    face: { eyes: [[428, 425, 80, 80], [600, 425, 80, 80]], glasses: true, pupil: 13, mouth: [513, 618, 2.6],
      mustache: [513, 572], brows: false, slide: 70 } },
  martin: { K: .3, head: [164, 118, 688, 649], body: [207, 525, 615, 875], feet: [508, 1399], neck: [514, 757],
    skin: '#f9cf9f', sleeve: '#9ca0a7', shoulders: [[304, 790], [720, 790]], arm: 320, armW: 74, hand: 58,
    face: { eyes: [[428, 526, 86, 98], [601, 526, 86, 98]], pupil: 14, mouth: [514, 684, 2.8], brows: [[428, 402], [601, 402]],
      slide: 80, rest: 'wobble' } },
  claude: { K: .165, body: [144, 64, 735, 1396], back: [144, 63, 735, 1397], feet: [512, 1459], skin: '#ef601d', sleeve: '#a6a9ae',
    shoulders: [[196, 742], [828, 742]], arm: 290, armW: 62, hand: 58, hose: true,
    face: { eyes: [[432, 470, 82, 88], [584, 468, 80, 86]], ring: true, pupil: 12, lids: .42, teeth: [556, 640, 214, 96],
      brows: [[432, 372], [584, 352]], slide: 40 }, star: [512, 66] },
};

// A prop picture centred on (x, y), w wide, turned r degrees, with optional words: a sign's board carries `text`
// (lines split on \n) in hand lettering, a screen (`screen`: svg) shows whatever the scene draws on it.
function cwProp({ name, w, x = 0, y = 0, r = 0, text = null, size = 48, ink = CW_INK, screen = '' }) {
  const [pw, ph] = CW_PROPS[name], h = w * ph / pw;
  let s = `<g transform="translate(${x} ${y}) rotate(${r})"><image href="../img/props/${name}.webp" x="${-w / 2}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h.toFixed(1)}"/>`;
  if (text && name === 'sign') {   // the board is the top half of the picture: 305 × 219 of 305 × 439
    const lines = text.split('\n'), cy = -h / 2 + h * .25, lh = size * 1.08;
    s += lines.map((l, i) => `<text x="0" y="${(cy + (i - (lines.length - 1) / 2) * lh + size * .36).toFixed(1)}" text-anchor="middle" font-family="CW Marker, Comic Sans MS, sans-serif" font-size="${size}" fill="${ink}">${l}</text>`).join('');
  }
  if (screen) s += screen;
  return s + '</g>';
}

// Claude's grid teeth: a smirk of two rows; `open` (0 … 1) drops the lower row and shows the mouth behind.
function cwTeeth(open, w, h) {
  const gap = 70 * open, top = -h / 2, half = h / 2, cols = 7, cw = w / cols;
  let s = `<path d="M${-w / 2 - 6},${top - 4} H${w / 2 + 6} V${half + gap} Q0,${half + gap + 22} ${-w / 2 - 6},${half + gap - 4} Z" fill="#3b0d0d" stroke="${CW_INK}" stroke-width="8"/>`;
  if (gap > 4) s += `<ellipse cx="10" cy="${half + gap * .55}" rx="${w * .3}" ry="${gap * .32}" fill="#d9606a"/>`;
  const row = (y0, y1) => {
    let r = `<rect x="${-w / 2}" y="${y0}" width="${w}" height="${y1 - y0}" rx="8" fill="#f6edc9" stroke="${CW_INK}" stroke-width="7"/>`;
    for (let i = 1; i < cols; i++) r += `<path d="M${-w / 2 + i * cw},${y0} V${y1}" stroke="${CW_INK}" stroke-width="5"/>`;
    return r;
  };
  return s + row(top, 0) + row(gap, half + gap - (open ? 0 : 0));
}
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><g id="spSCREAM"><path d="M-24,-8 Q0,-14 24,-8 Q22,34 0,38 Q-22,34 -24,-8Z" fill="#5a1414"/><ellipse cy="26" rx="12" ry="7" fill="#d9606a"/><path d="M-18,-6 H18" stroke="#fff" stroke-width="5"/></g></defs></svg>`);
SP_MOUTHS.SCREAM = true;   // a wide open scream for a close-up (#spSCREAM above)
const CW_OPEN = { X: 0, A: 0, B: .2, C: .45, D: .85, E: .6, F: .3, G: .15, H: .45 };

// An eyelid over an ellipse eye: the part above the line `lids` of the way down, in the skin's colour, with an ink edge.
function cwLid(cx, cy, rx, ry, lids, fill) {
  if (lids <= .01) return '';
  const y0 = cy - ry + 2 * ry * Math.min(lids, 1), u = (y0 - cy) / ry, hw = rx * Math.sqrt(Math.max(0, 1 - u * u));
  if (lids >= 1) return `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 1}" ry="${ry + 1}" fill="${fill}"/><path d="M${cx - rx},${cy} H${cx + rx}" stroke="${CW_INK}" stroke-width="7" stroke-linecap="round"/>`;
  return `<path d="M${cx - hw},${y0} A${rx + 1},${ry + 1} 0 ${u > 0 ? 1 : 0} 1 ${cx + hw},${y0} Z" fill="${fill}"/>` +
    `<path d="M${cx - hw},${y0} H${cx + hw}" stroke="${CW_INK}" stroke-width="7" stroke-linecap="round"/>`;
}

function cwArm(spec, prop) {
  const { arm, armW: w, hand, sleeve, skin, hose } = spec;
  const g = mk('g', {}), sl = mk('path', {}, g), mitt = mk('g', {}, g), held = mk('g', {}, mitt);
  mitt.innerHTML = '';
  mitt.appendChild(held);
  const mittShape = mk('g', {}, mitt);
  mittShape.innerHTML = hose
    ? `<circle r="${hand}" fill="#a6a9ae" stroke="${CW_INK}" stroke-width="8"/><circle cx="${-hand * .6}" cy="${-hand * .5}" r="${hand * .45}" fill="#a6a9ae" stroke="${CW_INK}" stroke-width="7"/>`
    : `<ellipse rx="${hand * 1.05}" ry="${hand}" fill="${skin}" stroke="${CW_INK}" stroke-width="8"/><ellipse cx="${-hand * .85}" cy="${-hand * .35}" rx="${hand * .42}" ry="${hand * .3}" fill="${skin}" stroke="${CW_INK}" stroke-width="7"/>`;
  let lastKey = '';
  return { g, held, set(reach, propSpec) {
    const L = arm * reach, key = `${L.toFixed(0)}`;
    if (key !== lastKey) {
      lastKey = key;
      if (hose) {   // a grey hose of rings
        let d = `M${-w / 2},0 V${L} H${w / 2} V0 Z`;
        let rings = ''; for (let y = L / 5; y < L - 10; y += L / 5) rings += `M${-w / 2},${y.toFixed(1)} Q0,${(y + 12).toFixed(1)} ${w / 2},${y.toFixed(1)}`;
        sl.setAttribute('d', d + rings);
        sl.setAttribute('fill', sleeve); sl.setAttribute('stroke', CW_INK); sl.setAttribute('stroke-width', 8);
      } else {
        sl.setAttribute('d', `M${-w / 2},0 A${w / 2},${w / 2} 0 0 1 ${w / 2},0 Q${w / 2 + 4},${L * .5} ${w / 2 - 6},${L} H${-w / 2 + 6} Q${-w / 2 - 4},${L * .5} ${-w / 2},0 Z`);   // a round shoulder on top
        sl.setAttribute('fill', sleeve); sl.setAttribute('stroke', CW_INK); sl.setAttribute('stroke-width', 8);
      }
      tf(mitt, `translate(0 ${L})`);
    }
  } };
}

function cwPuppet(parent, who) {
  const spec = CW[who], F = spec.face;
  const g = mk('g', {}, parent), shadow = mk('ellipse', { rx: spec.body[2] * .45, ry: 40, fill: '#000', opacity: .2 }, g);
  const fig = mk('g', {}, g), armBack = mk('g', {}, fig), bodyG = mk('g', {}, fig), headG = mk('g', {}, fig), chestG = mk('g', {}, fig), armFront = mk('g', {}, fig);
  let lastChest = '';
  const img = (box, file, into) => mk('image', { href: `../img/cast/${file}.webp`, x: box[0], y: box[1], width: box[2], height: box[3] }, into);
  const front = img(spec.body, `${who}-body`, bodyG);
  const backImg = spec.back ? img(spec.back, `${who}-back`, bodyG) : null;   // Claude seen from behind (typing)
  if (backImg) backImg.setAttribute('visibility', 'hidden');
  let lastBack = false;
  if (spec.head) img(spec.head, `${who}-head`, headG);
  const faceG = mk('g', {}, spec.head ? headG : bodyG);
  const eyesG = mk('g', {}, faceG), mouthG = mk('g', {}, faceG), topG = mk('g', {}, faceG);
  const star = spec.star ? mk('g', {}, bodyG) : null;
  if (star) star.innerHTML = `<g>${[0, 60, 120].map(a => `<rect x="-11" y="-58" width="22" height="116" rx="4" transform="rotate(${a})" fill="currentColor" stroke="${CW_INK}" stroke-width="6"/>`).join('')}${[0, 60, 120].map(a => `<rect x="-6" y="-52" width="12" height="104" transform="rotate(${a})" fill="currentColor"/>`).join('')}</g>`;
  const arms = [cwArm(spec), cwArm(spec)];
  let lastFace = '', lastMouth = '', lastHold = ['', ''];
  const holdSVG = h => h ? (h.svg ? `<g transform="translate(${h.x || 0} ${h.y || 0}) rotate(${h.r || 0})">${h.svg}</g>` : cwProp(h)) : '';

  function faceSVG(o) {
    const sl = (o.look || 0) * F.slide, ex = (o.eyeX || 0), ey = (o.eyeY || 0);
    const lids = o.shut ? 1 : Math.max(o.lids ?? F.lids ?? 0, 0);
    let s = '';
    if (F.glasses) {   // Doc: the lenses are his eyes; the temples run to the sides of the head
      const [[x1, y1, r1], [x2, y2]] = F.eyes;
      s += `<path d="M${x1 - r1 + sl},${y1} L${238 + sl * .3},${y1 - 6} M${x2 + r1 + sl},${y2} L${786 + sl * .3},${y2 - 6}" stroke="${CW_INK}" stroke-width="9" stroke-linecap="round"/>`;
    }
    for (const [i, [cx0, cy, rx, ry]] of F.eyes.entries()) {
      const cx = cx0 + sl;
      if (o.bliss) {   // eyes shut in bliss: no whites, a curved lash line on each, sagging in the middle
        s += `<path d="M${cx - rx * .75},${cy - ry * .1} Q${cx},${cy + ry * .55} ${cx + rx * .75},${cy - ry * .1}" fill="none" stroke="${CW_INK}" stroke-width="9" stroke-linecap="round"/>`;
        continue;
      }
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fbf8f0" ${F.glasses || F.ring ? `stroke="${CW_INK}" stroke-width="${F.glasses ? 10 : 8}"` : ''}/>`;
      if (lids < 1) {   // an open eye always shows its pupil: under a heavy lid it sits just below the lid's edge, half tucked
        const ryl = ry - (F.glasses ? 5 : 0), edge = cy - ryl + 2 * ryl * lids, r = F.pupil;
        const py = Math.min(Math.max(cy + ey * ry * .45, edge + r * .15), cy + ry - r * .9);
        s += `<circle cx="${(cx + ex * rx * .45 + (i ? -1 : 1) * rx * .08).toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="${CW_INK}"/>`;
      }
      s += cwLid(cx, cy, rx - (F.glasses ? 5 : 0), ry - (F.glasses ? 5 : 0), lids, F.glasses ? spec.skin : (who === 'claude' ? spec.skin : spec.skin));
    }
    if (F.brows) {
      const b = o.brow || 0;
      F.brows.forEach(([bx, by], i) => {
        const side = i ? 1 : -1, cx = bx + sl, inner = -b * 26, outer = b * 14;   // + worried: inner ends up
        const yIn = by + inner + (lids > .3 && who !== 'claude' ? 20 * lids : 0), yOut = by + outer;
        if (who === 'claude') {   // thick black brows, the right one cocked
          const cock = i ? -16 : 0;
          s += `<path d="M${cx - 70},${by + 10 + (i ? 0 : b * -10) + cock * 0} Q${cx},${by - 18 + cock - b * 8} ${cx + 70},${by + 4 + b * -16 * (i ? 0 : 1)}" fill="none" stroke="${CW_INK}" stroke-width="17" stroke-linecap="round"/>`;
        } else s += `<path d="M${cx - side * 10},${yIn} L${cx + side * 70},${yOut}" stroke="${CW_INK}" stroke-width="12" stroke-linecap="round"/>`;
      });
    }
    return s;
  }

  function mouthSVG(o) {
    const sl = (o.look || 0) * F.slide;
    if (F.teeth) {
      const [mx, my, w, h] = F.teeth, m = o.mouth ?? 'X';
      const open = typeof m === 'number' ? m : (CW_OPEN[m] ?? 0);
      const cig = o.cigar ? `<g transform="translate(${mx + w / 2 - 20 + sl * .8} ${my - 8}) rotate(${12 + 6 * open})"><image href="../img/props/cigar.webp" x="0" y="-33" width="230" height="66"/><circle cx="226" cy="0" r="16" fill="#ff7a2a"/><circle cx="226" cy="0" r="8" fill="#ffe08a"/></g>` : '';
      return `<g transform="translate(${mx + sl * .8} ${my})">${cwTeeth(open, w, h)}</g>${cig}`;
    }
    const [mx, my, k] = F.mouth, m = o.mouth ?? F.rest ?? 'X';
    let s = `<g transform="translate(${mx + sl} ${my}) scale(${k})"><use href="#sp${SP_MOUTHS[m] ? m : 'X'}"/></g>`;
    if (F.mustache) {
      const [ux, uy] = F.mustache;
      s += `<path transform="translate(${ux + sl} ${uy + (m === 'X' || m === 'A' ? 0 : -6)})" d="M-118,34 C-112,-8 -64,-40 0,-24 C64,-40 112,-8 118,34 C92,14 44,22 0,12 C-44,22 -92,14 -118,34 Z" fill="#949494"/>`;
    }
    return s;
  }

  return { g, spec,
    pose(o, f = 0) {
      const s = (o.s ?? 1) * spec.K, j = f ? .35 : 0;
      const bob = o.bob || 0, sq = o.squash ?? 1;
      tf(g, `translate(${((o.x ?? 800) + jit(f, 1) * j).toFixed(1)} ${((o.y ?? 800) + jit(f, 2) * j).toFixed(1)})`);
      g.setAttribute('opacity', o.o ?? 1);
      tf(shadow, `scale(${s.toFixed(4)})`);
      const [fx, fy] = spec.feet;
      const back = !!(o.back && backImg);   // from behind: the back picture, no face, both arms behind the body
      if (back !== lastBack) { lastBack = back; backImg.setAttribute('visibility', back ? 'inherit' : 'hidden'); front.setAttribute('visibility', back ? 'hidden' : 'inherit'); faceG.setAttribute('visibility', back ? 'hidden' : 'inherit'); }
      tf(fig, `scale(${s.toFixed(4)} ${(s * sq).toFixed(4)}) translate(0 ${(-bob / s).toFixed(1)}) rotate(${o.lean || 0}) translate(${-fx} ${-fy})`);
      if (spec.head) {
        const [nx, ny] = spec.neck;
        tf(headG, `translate(0 ${o.headY || 0}) rotate(${o.headR || 0} ${nx} ${ny})`);
      }
      if (star) {
        const [sx, sy] = spec.star;
        tf(star, `translate(${sx} ${sy}) rotate(${o.spin || 0}) scale(${o.starS ?? 1})`);
        star.setAttribute('color', o.star || '#e8582a');
      }
      const fk = JSON.stringify([o.look, o.eyeX, o.eyeY, o.lids, o.shut, o.brow, o.bliss]);
      if (fk !== lastFace) { lastFace = fk; eyesG.innerHTML = faceSVG(o); }
      const mk2 = JSON.stringify([o.mouth, o.look, o.cigar]);
      if (mk2 !== lastMouth) { lastMouth = mk2; mouthG.innerHTML = mouthSVG(o); }
      spec.shoulders.forEach(([px, py], i) => {
        const a = arms[i], side = i ? 'R' : 'L', ang = o['arm' + side] || 0, inFront = o['front' + side] && !o.back;
        const into = inFront ? armFront : armBack;
        if (a.g.parentNode !== into) into.appendChild(a.g);
        a.set(o['reach' + side] ?? 1);
        tf(a.g, `translate(${px} ${py}) rotate(${i ? -ang : ang})`);
        const h = o[i ? 'hold' : 'holdL'], hk = JSON.stringify(h || '');
        if (hk !== lastHold[i]) { lastHold[i] = hk; a.held.innerHTML = holdSVG(h); }
        tf(a.held, h && h.upright ? `rotate(${i ? ang : -ang})` : '');   // a sign stays upright whatever the arm does
      });
      const ck = JSON.stringify(o.chest || '');   // a prop held flat against the body, between the body and front arms
      if (ck !== lastChest) { lastChest = ck; chestG.innerHTML = o.chest ? cwProp({ ...o.chest, x: (o.chest.x || 0) + spec.feet[0], y: (o.chest.y || 0) + spec.feet[1] }) : ''; }
    },
    // The mitten's centre on the stage for pose o (side 'L' screen-left, 'R'), and the arm values that put it on a
    // point: spread aim(o, 'R', [x, y]) into the pose (lean and squash ignored, so aim with them at 0 or near it).
    hand(o, side) {
      const k = (o.s ?? 1) * spec.K, i = side === 'R' ? 1 : 0, [px, py] = spec.shoulders[i];
      const sx = (o.x ?? 800) + (px - spec.feet[0]) * k, sy = (o.y ?? 800) - (o.bob || 0) + (py - spec.feet[1]) * k;
      const a = (o['arm' + side] || 0) * Math.PI / 180, L = spec.arm * (o['reach' + side] ?? 1) * k;
      return i ? [sx + Math.sin(a) * L, sy + Math.cos(a) * L] : [sx - Math.sin(a) * L, sy + Math.cos(a) * L];
    },
    aim(o, side, [tx, ty]) {
      const k = (o.s ?? 1) * spec.K, i = side === 'R' ? 1 : 0, [px, py] = spec.shoulders[i];
      const sx = (o.x ?? 800) + (px - spec.feet[0]) * k, sy = (o.y ?? 800) - (o.bob || 0) + (py - spec.feet[1]) * k;
      const dx = tx - sx, dy = ty - sy, reach = Math.hypot(dx, dy) / (spec.arm * k);
      const arm = (i ? Math.atan2(dx, dy) : Math.atan2(-dx, dy)) * 180 / Math.PI;
      return { ['arm' + side]: arm, ['reach' + side]: reach };
    },
    // where a point of the source picture is on the stage for pose o (no lean): the feet-relative pixel times the scale
    point(o, [px, py]) { const s = (o.s ?? 1) * spec.K; return [(o.x ?? 800) + (px - spec.feet[0]) * s, (o.y ?? 800) + (py - spec.feet[1]) * s - (o.bob || 0)]; },
  };
}
const docPuppet = p => cwPuppet(p, 'doc');
const martinPuppet = p => cwPuppet(p, 'martin');
const claudePuppet = p => cwPuppet(p, 'claude');
