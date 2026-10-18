// Characters drawn entirely in SVG, built as a rig: every part is a group nested in the part it hangs from, so
// sleeves turn with arms, hands with forearms, the head on the neck; nothing can come apart. Shapes are drawn in the
// pixels of the model sheet's side view (the character faces right) and scaled by `k` and SCALE.
// pose(state) places everything from a plain object, so a frame is a pure function of time. State:
//   x, ground; k [1]; lean [0] (whole body, about the hip); bend [0] (upper body, about the waist); sy [1] breath;
//   drop [0] hips lowered; feet [[x, lift], [x, lift]] (world x, near and far); skirt [0] sway (−1..1);
//   arms [{ up, bend, hand: 'open'|'fist' }] near and far (degrees; up 0 = hanging, + swings back; bend − = forward);
//   head { tilt }, ears [0] flap (−1..1), bow [0] sway, tail [0] wag;
//   face { mouth, smile, blink, gaze [x, y], raise, worry, wide }.
const TOON = (() => {
  const NSV = 'http://www.w3.org/2000/svg', INK = '#151314', R = Math.PI / 180;
  const el = (tag, attrs, p) => { const e = document.createElementNS(NSV, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); return e; };
  const G = (p, cls) => el('g', cls ? { class: cls } : {}, p);
  const shape = (p, d, fill, w = 5, extra = {}) => el('path', { d, fill, stroke: INK, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra }, p);
  const at = (e, x, y, r = 0, sx = 1, sy = sx) => e.setAttribute('transform', `translate(${x},${y}) rotate(${r}) scale(${sx},${sy})`);
  const around = (e, [px, py], r = 0, sx = 1, sy = sx) => e.setAttribute('transform', `translate(${px},${py}) rotate(${r}) scale(${sx},${sy}) translate(${-px},${-py})`);
  // A limb as one rubbery curve through its joint: ink under skin.
  function hose(p, w, skin) {
    const out = el('path', { fill: 'none', stroke: INK, 'stroke-width': w + 9, 'stroke-linecap': 'round' }, p);
    const fill = el('path', { fill: 'none', stroke: skin, 'stroke-width': w, 'stroke-linecap': 'round' }, p);
    return (a, k, b) => { const c = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], d = `M${a}Q${c} ${b}`; out.setAttribute('d', d); fill.setAttribute('d', d); };
  }
  // Pig hands: a mitten with a thumb, or a fist; axis along +y from the wrist, thumb toward +x (forward).
  function hand(p, skin) {
    const open = G(p), fist = G(p);
    shape(open, 'M-15 -4C-21 16 -18 36 -7 46C3 54 17 47 19 34C21 20 17 6 14 -4Z', skin);
    shape(open, 'M13 8C27 4 33 18 22 27', skin, 4.5);
    shape(open, 'M-6 30L-4 44M3 31L5 46M11 28L13 42', 'none', 3);
    shape(fist, 'M-16 -2C-22 14 -16 32 0 33C16 34 22 18 18 2C16 -6 -12 -8 -16 -2Z', skin);
    shape(fist, 'M-9 20Q-6 27 -1 21M0 22Q4 29 9 22M15 6Q22 12 14 18', 'none', 3);
    return k => { open.style.display = k === 'fist' ? 'none' : ''; fist.style.display = k === 'fist' ? '' : 'none'; };
  }
  // A cloven hoof at the ankle, pointing forward.
  const hoof = (p, skin) => { shape(p, 'M-13 -14L13 -14L13 4L-13 4Z', skin, 0); shape(p, 'M-15 0C-16 -6 -12 -10 -6 -10L14 -10C28 -10 34 4 30 14L-16 14C-19 9 -17 3 -15 0Z', '#4b2c22'); shape(p, 'M10 -9L15 14', 'none', 3.5); };
  // A face: eyes (white, pupil, shine, closed-lid line), brows, a mouth under the snout (Rhubarb's shapes).
  const MOUTH = { X: [0, 1], A: [0, .9], B: [7, .8, 1], C: [16, .95], D: [26, 1], E: [20, .7], F: [11, .45], G: [7, .75, 1], H: [17, .9] };
  function face(p, F) {
    const eyes = F.eyes.map(([x, y, rx, ry], i) => {
      const g = G(p), open = G(g);
      el('ellipse', { rx, ry, fill: '#fff', stroke: INK, 'stroke-width': i ? 3.5 : 4.5 }, open);
      const pupil = el('ellipse', { rx: rx * .52, ry: ry * .5, fill: INK }, open), shine = el('circle', { r: rx * .17, fill: '#fff' }, open);
      if (F.lashes && !i) shape(open, `M${rx * .55} ${-ry * .8}l${rx * .5} ${-ry * .3}M${rx * .85} ${-ry * .42}l${rx * .55} ${-ry * .1}`, 'none', 3.5);
      const shut = shape(g, `M${-rx * 1.1} 0Q0 ${ry * .5} ${rx * 1.1} 0`, 'none', 4.5);
      return { x, y, rx, ry, g, open, pupil, shine, shut };
    });
    const brows = F.brows.map(() => shape(p, '', 'none', 6.5));
    const mouth = G(p), inside = shape(mouth, '', '#7b2430', 4.5), tongue = el('path', { fill: '#ef7d86' }, mouth), teeth = el('path', { fill: '#fff' }, mouth), line = shape(mouth, '', 'none', 5);
    return fc => {
      const [gx, gy] = fc.gaze || [1, 0], blink = fc.blink ?? 0, wide = fc.wide ?? 0, worry = fc.worry ?? 0, raise = fc.raise ?? 0;
      eyes.forEach(e => {
        at(e.g, e.x, e.y); e.open.setAttribute('transform', `scale(1,${Math.max(.06, (1 - blink) * (1 + .12 * wide))})`);
        e.shut.style.opacity = blink > .7 ? 1 : 0; e.open.style.opacity = blink > .7 ? 0 : 1;
        const px = e.rx * (.15 + .32 * gx), py = e.ry * .3 * gy;
        at(e.pupil, px, py, 0, 1 - .3 * wide); at(e.shine, px + e.rx * .14, py - e.ry * .2);
      });
      F.brows.forEach(([x1, y1, x2, y2], i) => {
        const up = 9 * raise + 6 * wide, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 8 - up;
        brows[i].setAttribute('d', `M${x1} ${y1 - up + 5 * worry}Q${mx} ${my - 4 * worry} ${x2} ${y2 - up - 9 * worry}`);
      });
      const [m0, m1, mw] = F.mouth, [h, wk, th] = MOUTH[fc.mouth || 'X'] || MOUTH.X, w = mw * wk / 2, sm = fc.smile ?? .6;
      at(mouth, m0 - w, m1);   // the front corner stays under the snout
      const L = [-w, -2 - 9 * sm], Rt = [w, -2];
      if (!h) { line.setAttribute('d', `M${L}Q${(L[0] + Rt[0]) / 2} ${10 * sm} ${Rt}`); for (const e of [inside, tongue, teeth]) e.setAttribute('d', ''); }
      else {
        line.setAttribute('d', '');
        inside.setAttribute('d', `M${L}Q0 ${-4 + 3 * sm} ${Rt}Q${w * .2} ${h * 1.25} ${L}Z`);
        tongue.setAttribute('d', h > 12 ? `M${-w * .55} ${h * .55}Q${w * .1} ${h * .3 + (fc.mouth === 'H' ? -8 : 0)} ${w * .6} ${h * .45}Q${w * .1} ${h * 1.05} ${-w * .55} ${h * .55}Z` : '');
        teeth.setAttribute('d', th ? `M${-w * .6} ${-2 - 4 * sm}L${w * .8} -1L${w * .75} 5L${-w * .55} 4Z` : '');
      }
    };
  }

  // Mother Pig, from the side view of her model sheet (297 × 661 px; ground at y 660).
  function mother(parent) {
    const SKIN = '#f6a99a', SKIN2 = '#e98c80', DRESS = '#ab8fd2', DRESS2 = '#957ac0', WHITE = '#f7f5f0';
    const HIP = [152, 548], WAIST = [160, 330], NECK = [152, 226], SHOULDER = [126, 268];
    const LEG = [44, 42], ARM = [96, 84];
    const root = G(parent);
    const farLegG = G(root), nearLegG = G(root), body = G(root);   // legs under the skirt
    farLegG.style.filter = 'brightness(.88)';
    // Legs (stage of the root, not leaning): hoses from under the skirt to hooves.
    const legs = [nearLegG, farLegG].map(g => { const h = hose(g, 30, SKIN), f = G(g); hoof(f, SKIN); return { h, f }; });
    // Body: skirt (sways at the hem), then the upper body, bending at the waist.
    const tailG = G(body), bowG = G(body), skirtG = G(body), upper = G(body);
    const tail = shape(tailG, 'M48 424C30 418 14 428 18 442C22 456 42 452 40 438C38 428 26 430 26 438', 'none', 9);
    shape(tailG, 'M48 424C30 418 14 428 18 442C22 456 42 452 40 438C38 428 26 430 26 438', 'none', 4, { stroke: SKIN });
    const skirt = shape(skirtG, '', DRESS), apron = shape(skirtG, '', WHITE, 4.5);
    shape(bowG, 'M92 332C70 300 34 304 30 330C28 352 62 352 92 340Z', WHITE, 4.5);
    shape(bowG, 'M92 340C66 352 40 380 52 396C66 404 84 372 96 348Z', WHITE, 4.5);
    shape(bowG, 'M88 342C70 372 70 410 84 416C92 404 96 372 98 346Z', WHITE, 4.5);
    shape(bowG, 'M48 326Q66 330 80 334', 'none', 3);
    const farArmG = G(upper), bodice = G(upper), headG = G(upper), nearArmG = G(upper);
    farArmG.style.filter = 'brightness(.88)'; const farArm = arm(farArmG);
    shape(bodice, 'M98 236C74 262 70 302 84 336L244 336C266 300 266 262 240 238C206 252 132 254 98 236Z', DRESS);
    shape(bodice, 'M150 322L250 322L248 340L150 340Z', WHITE, 4.5);   // apron waistband
    shape(bodice, 'M102 226C116 252 190 258 236 232C240 250 218 264 190 262C160 268 120 260 100 242Z', WHITE, 4.5);   // collar
    el('circle', { cx: 226, cy: 270, r: 6, fill: WHITE, stroke: INK, 'stroke-width': 3 }, bodice);
    el('circle', { cx: 231, cy: 286, r: 6, fill: WHITE, stroke: INK, 'stroke-width': 3 }, bodice);
    // Head: back ear, head, snout, face, front ear; ears flop on springs about their roots.
    const earBack = G(headG), skull = G(headG), faceG = G(headG), earFront = G(headG);
    shape(earBack, 'M104 72C78 52 46 74 50 110C70 118 104 104 122 90Z', SKIN); shape(earBack, 'M98 80C80 70 62 84 62 102C76 104 96 94 108 88Z', SKIN2, 0);
    shape(skull, 'M96 206C58 176 54 96 100 60C136 30 198 30 226 70C240 92 244 108 242 122L244 172C234 198 206 214 170 220C140 224 112 220 96 206Z', SKIN);
    shape(skull, 'M104 200C88 186 80 168 80 150', 'none', 3, { stroke: SKIN2 });
    const look = face(faceG, { eyes: [[202, 118, 14, 24], [233, 106, 6, 17]], brows: [[184, 84, 212, 78], [228, 74, 242, 72]], lashes: true, mouth: [238, 176, 48] });
    shape(faceG, 'M258 118C246 118 238 132 238 146C238 162 246 174 258 174C270 174 278 162 278 146C278 132 270 118 258 118Z', '#f7b4a6');
    el('ellipse', { cx: 252, cy: 141, rx: 3, ry: 7, fill: '#8a3b3b' }, faceG); el('ellipse', { cx: 265, cy: 150, rx: 2.6, ry: 6, fill: '#8a3b3b' }, faceG);
    shape(earFront, 'M172 46C176 16 206 0 246 8C252 20 234 36 216 48C200 56 184 56 172 46Z', SKIN); shape(earFront, 'M184 42C192 22 214 12 236 14C230 26 214 38 196 44Z', SKIN2, 0);
    const nearArm = arm(nearArmG);
    // An arm: shoulder group (turns with the upper arm) holding the arm curve, the puff sleeve and a hand group.
    function arm(p) {
      const g = G(p), h = hose(g, 26, SKIN), sleeve = G(g), handG = G(g), grip = G(handG), setHand = hand(handG, SKIN);
      shape(sleeve, 'M-48 -18C-54 -56 42 -60 52 -18C58 14 42 52 30 60L-28 60C-46 44 -52 14 -48 -18Z', DRESS);
      shape(sleeve, 'M-32 -30Q-20 -40 -6 -36', 'none', 3, { stroke: DRESS2 });
      shape(sleeve, 'M-30 54L32 54L32 72L-30 72Z', WHITE, 4.5);
      return { g, grip, place(up, bend, kind) {
        const b = bend * R, e = [0, ARM[0]], w = [-ARM[1] * Math.sin(b), ARM[0] + ARM[1] * Math.cos(b)];
        at(g, SHOULDER[0], SHOULDER[1], up); h([0, 8], e, w); at(handG, w[0], w[1], bend); setHand(kind);
        return up + bend;   // the hand's angle from hanging, in the upper body's frame
      } };
    }
    return {
      root, grip: nearArm.grip,
      pose(s) {
        const k = (s.k ?? 1) * mother.SCALE, lean = s.lean ?? 0, bend = s.bend ?? 0, sy = s.sy ?? 1;
        const legLen = LEG[0] + LEG[1], hipY = 636 - legLen * .96 + (s.drop ?? 0);   // ankle line at 636
        root.setAttribute('transform', `translate(${s.x},${s.ground}) scale(${k}) translate(${-HIP[0]},${-660})`);
        // Hip origin: the body hangs from it; lean turns all of it, the upper body adds `bend` at the waist.
        body.setAttribute('transform', `translate(${HIP[0]},${hipY}) rotate(${lean}) translate(${-HIP[0]},${-HIP[1]})`);
        const sw = s.skirt ?? 0;
        skirt.setAttribute('d', `M80 330C60 400 ${36 + 8 * sw} 480 ${22 + 18 * sw} 556C90 ${576 - 4 * sw} 220 578 ${292 + 14 * sw} ${560 - 6 * sw}C278 480 262 400 248 330Z`);
        apron.setAttribute('d', `M152 330L250 330C262 400 ${278 + 6 * sw} 460 ${288 + 10 * sw} 506Q${274 + 10 * sw} 522 262 508Q250 524 236 510Q222 526 208 510Q194 524 180 510Q166 522 154 506C150 456 148 390 152 330Z`);
        upper.setAttribute('transform', `translate(${WAIST[0]},${WAIST[1]}) rotate(${bend}) scale(${1 / sy},${sy}) translate(${-WAIST[0]},${-WAIST[1]})`);
        around(bowG, [92, 336], (s.bow ?? 0) * 12); around(tailG, [48, 424], (s.tail ?? 0) * 20);
        around(headG, NECK, s.head?.tilt ?? 0);
        const ear = s.ears ?? 0; around(earFront, [184, 46], -10 * ear); around(earBack, [112, 82], 12 * ear);
        look(s.face || {});
        const arms = s.arms || [{}, {}];
        const ang = nearArm.place(arms[0]?.up ?? 0, arms[0]?.bend ?? -12, arms[0]?.hand); farArm.place(arms[1]?.up ?? 0, arms[1]?.bend ?? -12, arms[1]?.hand);
        nearArm.handAngle = ang + bend + lean;   // from hanging, in the world: a held cloth hangs by counter-rotating this
        // Legs by IK to world feet, in sheet pixels.
        const feet = s.feet || [[s.x + 10 * k, 0], [s.x - 10 * k, 0]];
        const hip = [HIP[0], hipY], toSheet = ([wx, lift]) => [HIP[0] + (wx - s.x) / k, 636 - lift / k];
        [[legs[0], [hip[0] + 14, hip[1]], feet[0]], [legs[1], [hip[0] - 16, hip[1]], feet[1]]].forEach(([L, h, f]) => {
          const a = toSheet(f), dx = a[0] - h[0], dy = a[1] - h[1], d = Math.min(Math.hypot(dx, dy), legLen * .999);
          const th = Math.atan2(dy, dx) - Math.acos((LEG[0] ** 2 + d * d - LEG[1] ** 2) / (2 * LEG[0] * d));
          L.h(h, [h[0] + LEG[0] * Math.cos(th), h[1] + LEG[0] * Math.sin(th)], a); at(L.f, a[0], a[1], Math.min(25, f[1] * .6 / k));
        });
      },
      get handAngle() { return nearArm.handAngle; },
    };
  }
  mother.SCALE = .62;
  return { mother };
})();

// Mother Pig as a vector puppet: parts traced from her rig images (img/mother/rig/*.svg, offsets in rig.json, all
// in the rig picture's pixels, 1024 × 1536, facing right). The arm between sleeve and hand is an SVG limb in her
// line weight and skin colour, so it bends without seams. Same pose() state as TOON.mother.
TOON.vecMother = (parent, R) => {
  const NSV = 'http://www.w3.org/2000/svg', INK = '#151314';
  const el = (tag, attrs, p) => { const e = document.createElementNS(NSV, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); return e; };
  const G = p => el('g', {}, p);
  const img = (p, n) => { const [x, y, w, h] = R.parts[n]; return el('image', { href: `../img/mother/rig/${n}.svg`, x, y, width: w, height: h }, p); };
  const about = (e, [px, py], r = 0, sx = 1, sy = sx, dx = 0, dy = 0) => e.setAttribute('transform', `translate(${px + dx},${py + dy}) rotate(${r}) scale(${sx},${sy}) translate(${-px},${-py})`);
  const FOOT = [468, 1492], WAIST = [470, R.waist], NECK = [505, 505], SHOULDER = [372, 646];
  const ROOT = [374, 664], ELBOW = [388, 858], WRIST = [392, 952], ARM_W = 90, LINE = 12;
  const root = G(parent), all = G(root);
  el('ellipse', { cx: 505, cy: 478, rx: 92, ry: 58, fill: R.skin }, all);   // neck, behind the collar
  img(all, 'lower');
  const upper = G(all), head = G(upper);   // the head behind the bodice: the collar covers its cut edge
  img(upper, 'upper');
  const arm = G(upper);
  // The arm, behind the bodice: limb outline, hand, limb fill (covering the hand's cut top), sleeve over the root.
  const hose = [el('path', { fill: 'none', stroke: INK, 'stroke-width': ARM_W + LINE, 'stroke-linecap': 'round' }, arm)];
  const handG = G(arm); img(handG, 'hand');
  hose.push(el('path', { fill: 'none', stroke: R.skin, 'stroke-width': ARM_W, 'stroke-linecap': 'round' }, arm));
  img(arm, 'sleeve');
  img(head, 'head');
  for (let i = 0; i < R.lines; i++) if (i !== 3) img(head, `line${i}`);
  const brows = G(head); head.appendChild(brows);
  // Eyes: the drawn eye and pupil; a skin-coloured lid (the eye's ellipse, clipped to the part above the lid's edge)
  // slides down over them, its edge drawn as a line.
  const eyes = [0, 1].map(i => {
    const g = G(head), [x, y, w, h] = R.parts[`eye${i}`]; img(g, `eye${i}`); const p = img(g, `pupil${i}`);
    const id = `lid${i}${Math.random().toString(36).slice(2, 7)}`, clip = el('clipPath', { id }, el('defs', {}, head)), cut = el('rect', { x: x - 6, y: y - 6, width: w + 12, height: 0 }, clip);
    el('ellipse', { cx: x + w / 2, cy: y + h / 2, rx: w / 2 + 3, ry: h / 2 + 3, fill: R.skin, 'clip-path': `url(#${id})` }, head);
    const edge = el('path', { fill: 'none', stroke: INK, 'stroke-width': LINE * .65, 'stroke-linecap': 'round' }, head);
    return { g, p, cut, edge, x, y, w, h, c: [x + w / 2, y + h / 2] };
  });
  // Brow and lash marks move with the eyes; the smile line is the closed mouth.
  const marks = [1, 2].map(i => head.querySelector(`image[href$="line${i}.svg"]`));
  const smile = img(head, 'line3'), [mx, my, mw, mh] = R.parts.line3;
  const mouth = G(head), inside = el('path', { fill: '#7b2430', stroke: INK, 'stroke-width': LINE * .7, 'stroke-linejoin': 'round' }, mouth);
  const tongue = el('path', { fill: '#ef7d86' }, mouth), teeth = el('path', { fill: '#fff' }, mouth);
  const MOUTH = { B: [14, .8, 1], C: [30, .9], D: [48, 1], E: [38, .7], F: [22, .45], G: [14, .75, 1], H: [32, .9] };
  const front = [mx + mw - 6, my + 14];
  upper.appendChild(arm);   // the arm in front of her head and body
  const gripAt = G(handG); gripAt.setAttribute('transform', 'translate(400,1012) scale(4)');   // between thumb and fingers
  return {
    root, grip: G(gripAt),
    pose(s) {
      const k = (s.k ?? 1) * TOON.vecMother.SCALE, lean = s.lean ?? 0, bend = s.bend ?? 0, sy = s.sy ?? 1;
      root.setAttribute('transform', `translate(${s.x},${s.ground}) scale(${(s.dir ?? 1) * k},${k}) translate(${-FOOT[0]},${-FOOT[1]})`);
      about(all, FOOT, lean * .5);
      about(upper, WAIST, bend, 1 / sy, sy);
      about(head, NECK, s.head?.tilt ?? 0);
      // Arm: up about the shoulder (sleeve and all), bend about the elbow (forearm and hand).
      const a = s.arms?.[0] || {}, up = a.up ?? 0, b = a.bend ?? -8, rad = b * Math.PI / 180;
      about(arm, SHOULDER, up);
      const v = [WRIST[0] - ELBOW[0], WRIST[1] - ELBOW[1]], w = [ELBOW[0] + v[0] * Math.cos(rad) - v[1] * Math.sin(rad), ELBOW[1] + v[0] * Math.sin(rad) + v[1] * Math.cos(rad)];
      const c = [2 * ELBOW[0] - (ROOT[0] + w[0]) / 2, 2 * ELBOW[1] - (ROOT[1] + w[1]) / 2], d = `M${ROOT}Q${c} ${w}`;
      hose.forEach(h => h.setAttribute('d', d)); about(handG, ELBOW, b);
      this.handAngle = up + b + bend + lean * .5;
      // Face.
      const f = s.face || {}, blink = f.blink ?? 0, [gx, gy] = f.gaze || [1, 0], raise = f.raise ?? 0, worry = f.worry ?? 0, wide = f.wide ?? 0;
      eyes.forEach((e, i) => {
        const down = Math.min(1, blink) * (e.h * .78), ly = e.y + down;   // the lid's edge
        e.cut.setAttribute('height', down + 6);
        const half = Math.sqrt(Math.max(0, 1 - ((ly - e.c[1]) / (e.h / 2 + 3)) ** 2)) * (e.w / 2 + 3);
        e.edge.setAttribute('d', down > 2 ? `M${e.c[0] - half} ${ly}Q${e.c[0]} ${ly + 6} ${e.c[0] + half} ${ly}` : '');
        about(e.p, e.c, 0, 1 - .25 * wide, 1 - .25 * wide, -16 * (1 - gx) * (i ? .6 : 1), 12 * gy);
      });
      marks.forEach((m, i) => about(m, [m.x.baseVal.value + m.width.baseVal.value / 2, m.y.baseVal.value + m.height.baseVal.value], (i ? -1 : 1) * -10 * worry, 1, 1, 0, -14 * raise - 10 * wide));
      // Mouth: closed, the drawn smile (flipped into a frown when unhappy); open, a shape hinged under the snout.
      const shape = MOUTH[f.mouth] , sm = f.smile ?? .6;
      smile.style.display = shape ? 'none' : ''; mouth.style.display = shape ? '' : 'none';
      if (!shape) about(smile, [mx + mw / 2, my + mh / 2], 0, 1, Math.sign(sm || 1) * Math.max(.25, Math.abs(sm)));
      else {
        const [h, wk, th] = shape, L = [front[0] - (mw - 10) * wk, my + 8 - 10 * sm], mid = (L[0] + front[0]) / 2;
        inside.setAttribute('d', `M${L}Q${mid} ${my + 24 + 10 * sm} ${front}Q${mid} ${my + 30 + h * 1.6} ${L}Z`);
        tongue.setAttribute('d', h > 25 ? `M${mid - 30} ${my + 28 + h}Q${mid + 10} ${my + 16 + h * .7} ${front[0] - 12} ${my + 26 + h * .6}Q${mid} ${my + 34 + h * 1.4} ${mid - 30} ${my + 28 + h}Z` : '');
        teeth.setAttribute('d', '');
      }
    },
  };
};
TOON.vecMother.SCALE = .26;

// Any character as a vector puppet from its rig parts (img/<name>/rig/*.svg; RIGS.<name> from rig.js, rig-image
// pixels, facing right). Optional pieces follow the rig: a separate head (tilts on the neck, behind the collar), an
// upper body bending at the waist, a sleeve turning with the arm, legs as SVG limbs to drawn feet (walking by IK).
// pose(state): x, ground, k, dir, lean, bend, sy, head { tilt }, arms [{ up, bend }], feet [[x, lift], [x, lift]]
// (world x of near and far foot), face { mouth, smile, blink, gaze [x, y], raise, worry, wide }.
TOON.puppet = (parent, name, opts = {}) => {
  const R = RIGS[name], NSV = 'http://www.w3.org/2000/svg', INK = '#151314', P = R.parts;
  const el = (tag, attrs, p) => { const e = document.createElementNS(NSV, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); return e; };
  const G = p => el('g', {}, p);
  const img = (p, n) => { const [x, y, w, h] = P[n]; return el('image', { href: `../img/${name}/rig/${n}.svg`, x, y, width: w, height: h }, p); };
  const about = (e, [px, py], r = 0, sx = 1, sy = sx, dx = 0, dy = 0) => e.setAttribute('transform', `translate(${px + dx},${py + dy}) rotate(${r}) scale(${sx},${sy}) translate(${-px},${-py})`);
  const hoseOf = (p, w, skin) => [el('path', { fill: 'none', stroke: INK, 'stroke-width': w + 12, 'stroke-linecap': 'round' }, p), el('path', { fill: 'none', stroke: skin, 'stroke-width': w, 'stroke-linecap': 'round' }, p)];
  const curve = (a, k, b) => `M${a}Q${2 * k[0] - (a[0] + b[0]) / 2},${2 * k[1] - (a[1] + b[1]) / 2} ${b}`;
  const FOOT = [P.body ? P.body[0] + P.body[2] / 2 : 470, R.ground];
  const root = G(parent), all = G(root);
  // Legs (behind the body): limb from hip to ankle with a knee by IK, the drawn foot at the ankle.
  const legs = (R.legs || []).map(L => {
    const g = G(all), h = hoseOf(g, L.width - 12, R.legSkin), f = G(g); img(f, L.part);
    const len = Math.hypot(L.ankle[0] - L.hip[0], L.ankle[1] - L.hip[1]);
    return { L, h, f, len };
  });
  const hips = R.legs ? [R.legs.reduce((s, L) => s + L.hip[0], 0) / R.legs.length, R.legs[0].hip[1]] : FOOT;
  if (R.neck) el('ellipse', { cx: R.neck[0], cy: R.neck[1] - 20, rx: 70, ry: 50, fill: R.lid }, all);   // a neck behind the collar
  if (P.lower) img(all, 'lower');
  const upper = G(all), head = R.neck ? G(upper) : null;
  img(upper, P.upper ? 'upper' : 'body');
  const faceG = head || G(upper);
  if (head) img(head, 'head');
  // Arm: limb outline, hand, limb fill (over the hand's cut top), sleeve over the limb's root.
  const arm = G(upper), AW = Math.max(R.armWidth, 70) - 12, armHose = hoseOf(arm, AW, R.skin), handG = G(arm);
  arm.insertBefore(handG, armHose[1]); img(handG, 'hand');
  if (P.sleeve) img(arm, 'sleeve');
  // Face: eyes with pupils and sliding lids, brows, marks, mouth.
  const eyes = R.eyes.map((n, i) => {
    const g = G(faceG), [x, y, w, h] = P[n]; img(g, n); const p = P[`pupil${i}`] ? img(g, `pupil${i}`) : null;
    const id = `lid${name}${i}${Math.random().toString(36).slice(2, 7)}`, clip = el('clipPath', { id }, el('defs', {}, faceG)), cut = el('rect', { x: x - 6, y: y - 6, width: w + 12, height: 0 }, clip);
    el('ellipse', { cx: x + w / 2, cy: y + h / 2, rx: w / 2 + 3, ry: h / 2 + 3, fill: R.lid, 'clip-path': `url(#${id})` }, faceG);
    const edge = el('path', { fill: 'none', stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round' }, faceG);
    return { p, cut, edge, x, y, w, h, c: [x + w / 2, y + h / 2] };
  });
  for (const n of R.marks) img(faceG, n);
  const brows = R.brows.map(n => img(faceG, n));
  const [mx, my, mw, mh] = R.mouth ? P[R.mouth] : [0, 0, 0, 0], smile = R.mouth && img(faceG, R.mouth);
  const mouth = G(faceG), inside = el('path', { fill: '#7b2430', stroke: INK, 'stroke-width': 8, 'stroke-linejoin': 'round' }, mouth), tongue = el('path', { fill: '#ef7d86' }, mouth);
  const MOUTH = { B: [.25, .8], C: [.55, .9], D: [.85, 1], E: [.7, .7], F: [.4, .45], G: [.25, .75], H: [.6, .9] };
  upper.appendChild(arm);   // in front of the head and body
  const gripAt = G(handG); gripAt.setAttribute('transform', `translate(${R.wrist[0] + 8},${R.wrist[1] + 60}) scale(4)`);
  const self = {
    root, grip: G(gripAt), R,
    pose(s) {
      const k = (s.k ?? 1) * (opts.scale ?? .26), lean = s.lean ?? 0, bend = s.bend ?? 0, sy = s.sy ?? 1;
      root.setAttribute('transform', `translate(${s.x},${s.ground}) scale(${(s.dir ?? 1) * k},${k}) translate(${-FOOT[0]},${-FOOT[1]})`);
      about(all, FOOT, lean * .5);
      about(upper, P.upper ? [FOOT[0], R.waist] : hips, bend, 1 / sy, sy, 0, -(s.bob ?? 0) / k);
      if (head) about(head, R.neck, s.head?.tilt ?? 0);
      // Arm.
      const a = s.arms?.[0] || {}, up = a.up ?? 0, b = a.bend ?? -8, rad = b * Math.PI / 180;
      about(arm, R.shoulder, up);
      const v = [R.wrist[0] - R.elbow[0], R.wrist[1] - R.elbow[1]], w = [R.elbow[0] + v[0] * Math.cos(rad) - v[1] * Math.sin(rad), R.elbow[1] + v[0] * Math.sin(rad) + v[1] * Math.cos(rad)];
      armHose.forEach(h => h.setAttribute('d', curve(R.root, R.elbow, w))); about(handG, R.elbow, b);
      self.handAngle = up + b + bend + lean * .5;
      // Legs: feet given in world x (near first) with a lift; knees bend forward. Hips ride with the body's bob.
      const feet = s.feet, toRig = ([wx, lift]) => [FOOT[0] + (wx - s.x) / ((s.dir ?? 1) * k), R.ground - lift / k];
      legs.forEach((lg, i) => {
        const L = lg.L, hip = [L.hip[0], L.hip[1] - (s.bob ?? 0) / k];
        const ank = feet ? (([fx, fy]) => [fx + L.ankle[0] - FOOT[0], fy - (R.ground - L.ankle[1])])(toRig(feet[legs.length - 1 - i])) : L.ankle;
        const dx = ank[0] - hip[0], dy = ank[1] - hip[1], l1 = lg.len / 2, d = Math.min(Math.hypot(dx, dy), lg.len * .999);
        const th = Math.atan2(dy, dx) - Math.acos(d / (2 * l1)), knee = [hip[0] + l1 * Math.cos(th), hip[1] + l1 * Math.sin(th)];
        lg.h.forEach(h => h.setAttribute('d', curve(hip, knee, ank)));
        about(lg.f, L.ankle, feet ? Math.min(25, feet[legs.length - 1 - i][1] * .5 / k * .05) : 0, 1, 1, ank[0] - L.ankle[0], ank[1] - L.ankle[1]);
      });
      // Face.
      const f = s.face || {}, blink = f.blink ?? 0, [gx, gy] = f.gaze || [1, 0], raise = f.raise ?? 0, worry = f.worry ?? 0, wide = f.wide ?? 0;
      eyes.forEach((e, i) => {
        const down = Math.min(1, blink) * e.h * .8, ly = e.y + down;
        e.cut.setAttribute('height', down + 6);
        const half = Math.sqrt(Math.max(0, 1 - ((ly - e.c[1]) / (e.h / 2 + 3)) ** 2)) * (e.w / 2 + 3);
        e.edge.setAttribute('d', down > 2 ? `M${e.c[0] - half} ${ly}Q${e.c[0]} ${ly + 6} ${e.c[0] + half} ${ly}` : '');
        if (e.p) about(e.p, e.c, 0, 1 - .25 * wide, 1 - .25 * wide, -e.w * .16 * (1 - gx), e.h * .1 * gy);
      });
      brows.forEach((m, i) => about(m, [m.x.baseVal.value + m.width.baseVal.value / 2, m.y.baseVal.value + m.height.baseVal.value], (i % 2 ? 1 : -1) * 8 * worry, 1, 1, 0, -14 * raise - 10 * wide));
      if (R.mouth) {
        const shape = MOUTH[f.mouth], sm = f.smile ?? .6, front = [mx + mw - 6, my + mh * .3];
        smile.style.display = shape ? 'none' : ''; mouth.style.display = shape ? '' : 'none';
        if (!shape) about(smile, [mx + mw / 2, my + mh / 2], 0, 1, Math.sign(sm || 1) * Math.max(.25, Math.abs(sm)));
        else {
          const [h, wk] = shape, H = h * Math.max(60, mw * .45), L = [front[0] - (mw - 10) * wk, my + mh * .2 - 10 * sm], mid = (L[0] + front[0]) / 2;
          inside.setAttribute('d', `M${L}Q${mid} ${my + mh * .6 + 10 * sm} ${front}Q${mid} ${my + mh * .7 + H * 1.6} ${L}Z`);
          tongue.setAttribute('d', h > .5 ? `M${mid - 30} ${my + mh * .7 + H}Q${mid + 10} ${my + mh * .5 + H * .7} ${front[0] - 12} ${my + mh * .6 + H * .6}Q${mid} ${my + mh * .8 + H * 1.4} ${mid - 30} ${my + mh * .7 + H}Z` : '');
        }
      }
    },
  };
  return self;
};

// A character from drawn poses (POSES.<name>, img/<name>/pose/): one whole-figure drawing per leg pose, arm
// drawings laid over it, mouth drawings over the face; eyes, pupils, lids and brows from its rig parts.
// pose(state): x, ground, k, dir, lean, bob, legs (0 = standing, 1.. walk-cycle drawings), arm (0 rest, 1..),
// face { mouth (Rhubarb letter), blink, gaze [x, y], raise, wide }.
TOON.posed = (parent, name, opts = {}) => {
  const S = POSES[name], R = RIGS[name], NSV = 'http://www.w3.org/2000/svg', INK = '#151314';
  const el = (tag, attrs, p) => { const e = document.createElementNS(NSV, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); return e; };
  const G = p => el('g', {}, p);
  // Every drawing is decoded up front: a picture decoded on its first showing leaves that frame blank (a flicker).
  const pic = (p, dir, n, [x, y, w, h]) => { const href = `../img/${name}/${dir}/${n}.webp`; TOON.preload(href); return el('image', { href, x, y, width: w, height: h }, p); };
  const about = (e, [px, py], r = 0, sx = 1, sy = sx, dx = 0, dy = 0) => e.setAttribute('transform', `translate(${px + dx},${py + dy}) rotate(${r}) scale(${sx},${sy}) translate(${-px},${-py})`);
  const FOOT = [S.parts.fig0[0] + S.parts.fig0[2] / 2, S.ground];
  const root = G(parent), all = G(root);
  const back = G(all);   // things worn behind the body (a bindle), in rig pixels
  const figs = Array.from({ length: S.legs + 1 }, (_, i) => pic(all, 'pose', `fig${i}`, S.parts[`fig${i}`]));
  const face = G(all);
  pic(face, 'pose', 'faceplate', S.parts.faceplate);   // covers the figures' own eyes, brows and mouth
  const eyes = R.eyes.map((n, i) => {
    const [x, y, w, h] = R.parts[n]; pic(face, 'rig', n, R.parts[n]); const p = R.parts[`pupil${i}`] ? pic(face, 'rig', `pupil${i}`, R.parts[`pupil${i}`]) : null;
    const id = `lid${name}${i}${Math.random().toString(36).slice(2, 7)}`, cut = el('rect', { x: x - 6, y: y - 6, width: w + 12, height: 0 }, el('clipPath', { id }, el('defs', {}, face)));
    el('ellipse', { cx: x + w / 2, cy: y + h / 2, rx: w / 2 + 3, ry: h / 2 + 3, fill: R.lid, 'clip-path': `url(#${id})` }, face);
    const edge = el('path', { fill: 'none', stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round' }, face);
    return { p, cut, edge, x, y, w, h, c: [x + w / 2, y + h / 2] };
  });
  const brows = R.brows.map(n => pic(face, 'rig', n, R.parts[n]));
  R.marks.forEach(n => pic(face, 'rig', n, R.parts[n]));
  const closed = pic(face, 'rig', R.mouth, R.parts[R.mouth]);
  const mouths = Array.from({ length: S.mouths }, (_, i) => pic(face, 'pose', `mouth${i + 1}`, S.parts[`mouth${i + 1}`]));
  const arms = Array.from({ length: S.arms }, (_, i) => pic(all, 'pose', `arm${i}`, S.parts[`arm${i}`]));
  const wholes = Object.fromEntries((S.wholes || []).map(n => {
    const e = pic(all, 'pose', n, S.parts[n]);
    if (n === 'nap') { const [, y, , h] = S.parts[n]; e.setAttribute('y', S.ground - h); }   // lying down: on the ground
    return [n, e];
  }));   // drawings with their own face
  const show = (list, i) => list.forEach((e, j) => { e.style.visibility = j === i ? '' : 'hidden'; });   // hidden, not display:none, so every drawing loads up front
  const MOUTH = { B: 0, G: 0, C: 1, H: 1, D: 2, E: 3, F: 3 };
  return {
    root, back, R,
    pose(s) {
      const k = (s.k ?? 1) * (opts.scale ?? .26);
      root.setAttribute('transform', `translate(${s.x},${s.ground}) scale(${(s.dir ?? 1) * k},${k}) translate(${-FOOT[0]},${-FOOT[1]})`);
      about(all, FOOT, s.lean ?? 0, 1, 1, 0, -(s.bob ?? 0) / k);
      const w = s.whole && wholes[s.whole];
      for (const n in wholes) wholes[n].style.visibility = wholes[n] === w ? '' : 'hidden';
      face.style.visibility = w ? 'hidden' : '';
      show(figs, w ? -1 : s.legs ?? 0);
      const on = [].concat(s.arm ?? 0); arms.forEach((e, j) => { e.style.visibility = !w && on.includes(j) ? '' : 'hidden'; });   // arm: one index, or several shown together
      const f = s.face || {}, blink = f.blink ?? 0, [gx, gy] = f.gaze || [1, 0], raise = f.raise ?? 0, wide = f.wide ?? 0;
      eyes.forEach(e => {
        const down = Math.min(1, blink) * e.h * .8, ly = e.y + down; e.cut.setAttribute('height', down > 1 ? down + 6 : 0);
        const half = Math.sqrt(Math.max(0, 1 - ((ly - e.c[1]) / (e.h / 2 + 3)) ** 2)) * (e.w / 2 + 3);
        e.edge.setAttribute('d', down > 2 ? `M${e.c[0] - half} ${ly}Q${e.c[0]} ${ly + 6} ${e.c[0] + half} ${ly}` : '');
        if (e.p) about(e.p, e.c, 0, 1 - .25 * wide, 1 - .25 * wide, -e.w * .16 * (1 - gx), e.h * .1 * gy);
      });
      const worry = f.worry ?? 0, sm = f.smile ?? .6;
      brows.forEach((m, i) => { const [x, y, w, h] = R.parts[R.brows[i]]; about(m, [x + w / 2, y + h], (i % 2 ? 1 : -1) * 9 * worry, 1, 1, 0, -14 * raise - 10 * wide); });
      show(mouths, MOUTH[f.mouth] ?? -1); closed.style.visibility = MOUTH[f.mouth] === undefined ? '' : 'hidden';
      const [cx, cy, cw, ch] = R.parts[R.mouth]; about(closed, [cx + cw / 2, cy + ch / 2], 0, 1, sm < 0 ? Math.max(-1, sm) : Math.max(.3, sm));   // a frown is the smile flipped
    },
  };
};

// Decoded pictures stay in the browser's cache, so swapping them in later costs nothing and never shows a blank frame.
TOON.loaded = new Map();
TOON.preload = href => { if (!TOON.loaded.has(href)) { const im = new Image(); im.src = href; TOON.loaded.set(href, im.decode ? im.decode().catch(() => {}) : null); } };
