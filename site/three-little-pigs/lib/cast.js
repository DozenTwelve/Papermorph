// The cast of The Three Little Pigs. Drawn parts (torso, heads, hands, feet, the wolf's tail) come from the image model;
// limbs and the pigs' tails are SVG, so they bend. Every frame an actor is posed from a plain state object, so a
// picture is a pure function of time. Coordinates of parts are pixels of their own images; everything else is in
// actor units (stage pixels at scale 1), with the ground at y = 0 and the actor facing right.
const CAST = (() => {
  const head = (src, pivot, s) => ({ src, pivot, s });
  // Each head drawing hangs from a pivot near the bottom of the drawing (measured from the images), so swapping
  // drawings keeps the head on its neck. Mother's and the second pig's heads have their collars cut away: the
  // collar belongs to the torso, which is drawn over an SVG neck.
  const PIVOT = {
    mother: [[132, 226], [129, 229], [126, 220], [131, 224], [134, 241]], pig2: [[147, 251], [142, 245], [151, 247], [145, 243], [145, 254]],
    pig1: [[156, 269], [152, 261], [142, 253], [148, 261], [152, 259]], pig3: [[136, 261], [134, 260], [137, 261], [132, 259], [135, 261]],
  };
  const pig = (id, heads, hs) => Object.fromEntries(heads.map((n, i) => [n, head(`${id}/h${i + 1}`, PIVOT[id][i], hs)]));
  // Torsos have no arms, sleeves or (with a neck) heads; a sleeve is its own piece, turning with the upper arm.
  return {
    mother: {
      torso: { src: 'mother/body', s: .26, neck: [370, 52], shoulder: [300, 150], hipN: [440, 900], hipF: [350, 900] },
      neck: { up: 20, w: 30 }, sleeve: { src: 'mother/sleeve', at: [140, 60], dir: 90, s: .2 },   // ends about halfway down the upper arm
      heads: pig('mother', ['smile', 'call', 'worried', 'laugh', 'surprised'], .5),
      // A face without features (face.png, same scale as the head drawings); eyes, brows and mouth are drawn on it.
      face: { src: 'mother/face', pivot: [138, 216], eyes: [[163, 121, 17, 22], [213, 104, 8, 17]], brows: [[138, 90, 176, 84], [204, 79, 222, 77]], lashes: true, mouth: [196, 182, 72] },
      leg: [30, 28, 26], arm: [80, 52, 22], skin: '#f6a99a',
      hand: { src: 'mother/hand', at: [65, 20], dir: 90, s: .2 }, fist: { src: 'mother/fist', at: [70, 20], dir: 90, s: .2 },
      foot: { src: 'mother/foot', at: [64, 110], h: 249, s: .2 },
    },
    pig1: {
      torso: { src: 'pig1/body', s: .195, neck: [363, 40], shoulder: [332, 120], hipN: [430, 830], hipF: [350, 830], tail: [150, 600] },
      sleeve: { src: 'pig1/sleeve', at: [100, 40], dir: 90, s: .195 },
      heads: pig('pig1', ['happy', 'scared', 'sleepy', 'surprised', 'laugh'], .48),
      leg: [26, 26, 26], arm: [42, 38, 24], skin: '#f6a99a',
      hand: { src: 'pig1/hand', at: [80, 200], dir: 90, s: .17 }, fist: { src: 'pig1/fist', at: [78, 170], dir: 90, s: .17 },
      foot: { src: 'pig1/foot', at: [95, 200], h: 348, s: .2 },
    },
    pig2: {
      torso: { src: 'pig2/body', s: .225, neck: [264, 48], shoulder: [208, 138], hipN: [416, 920], hipF: [250, 920], tail: [40, 760] },
      neck: { up: 16, w: 30 }, sleeve: { src: 'pig2/sleeve', at: [110, 50], dir: 75, s: .225 },
      heads: pig('pig2', ['grin', 'scared', 'laugh', 'whistle', 'shocked'], .44),
      leg: [22, 22, 28], arm: [40, 36, 20], skin: '#f6a99a',
      hand: { src: 'pig2/hand', at: [12, 140], dir: 0, s: .2 }, fist: { src: 'pig2/fist', at: [10, 110], dir: 0, s: .2 },
      foot: { src: 'pig2/foot', at: [80, 200], h: 334, s: .22 },
    },
    pig3: {
      torso: { src: 'pig3/body', s: .236, neck: [230, 35], shoulder: [115, 200], hipN: [380, 850], hipF: [150, 850], tail: [40, 700] },
      sleeve: { src: 'pig3/sleeve', at: [110, 50], dir: 90, s: .236 },
      heads: pig('pig3', ['determined', 'calm', 'wink', 'surprised', 'laugh'], .44),
      leg: [22, 22, 28], arm: [40, 36, 22], skin: '#f6a99a',
      hand: { src: 'pig3/hand', at: [8, 178], dir: 0, s: .2 }, fist: { src: 'pig3/fist', at: [8, 100], dir: 0, s: .2 },
      foot: { src: 'pig3/foot', at: [70, 80], h: 218, s: .22 },
    },
    wolf: {
      torso: { src: 'wolf/torso', s: .62, neck: [118, 22], shoulder: [118, 125], hipN: [128, 392], hipF: [108, 392] },
      tailImg: { src: 'wolf/tail', at: [35, 360], root: [22, 85], s: .5 },
      heads: Object.fromEntries(['neutral', 'sly', 'angry', 'puff', 'shock', 'howl', 'sniff', 'sneak', 'dizzy', 'lick'].map(n => [n, head(`wolf/${n}`, [92, 240], .8)])),
      leg: [125, 103, 45], arm: [114, 100, 34], skin: '#4e4a4b',
      fist: { src: 'wolf/fist', at: [58, 14], dir: 90, s: .44 }, foot: { src: 'wolf/foot', at: [46, 16], h: 94, s: .42 },
    },
  };
})();

// actor(parent, spec) builds the parts once; a.pose(state) places them. State (defaults in brackets):
//   x, ground: hip above this world point; k [1] scale; dir [1] facing right or -1; lean [0] degrees about the hip;
//   sy [1] squash of the torso (area kept); drop [0] hip lowered by (crouch); bob [0] extra hip drop;
//   feet: [[x, lift], [x, lift]] near and far, world x and lift above the ground (default: under the hip);
//   arms: [{ up, bend, hand }] near and far: degrees back from hanging, elbow bend (negative = forward), 'hand' or 'fist';
//   head: name [first], tilt [0] degrees, pop [1] scale, back [false] looking behind; tail [0] degrees of wag;
//   face (characters with a drawn face): mouth shape letter, smile, blink, gaze [x, y], raise, worry, wide.
function actor(parent, spec) {
  const NSV = 'http://www.w3.org/2000/svg', INK = '#151314';
  const el = (tag, attrs, p) => { const e = document.createElementNS(NSV, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); return e; };
  const src = n => `../img/${n}.png`;
  const T = spec.torso, R = Math.PI / 180;
  const root = el('g', {}, parent);
  const layer = () => el('g', {}, root);
  const farArmG = layer(), farLegG = layer(), tailG = layer(), backG = layer(), nearLegG = layer(), neckG = layer(), torsoG = layer(), frontG = layer(), headG = layer(), nearArmG = layer();
  farArmG.style.filter = farLegG.style.filter = 'brightness(.78)';
  // The torso image, its pelvis (between the hip roots) at the hip origin.
  const pelvis = [(T.hipN[0] + T.hipF[0]) / 2, (T.hipN[1] + T.hipF[1]) / 2];
  const torsoImg = el('image', { href: src(T.src), transform: `scale(${T.s}) translate(${-pelvis[0]},${-pelvis[1]})` }, torsoG);
  const headImg = el('image', {}, headG);
  // The drawn face: eyes (white, pupil, highlight, a closed-lid line), brows and a mouth, in face-image pixels.
  const F = spec.face, faceG = F && el('g', {}, headG), faceImg = F && el('image', { href: src(F.src) }, faceG);
  const eyes = F ? F.eyes.map(([x, y, rx, ry], i) => {
    const g = el('g', {}, faceG), open = el('g', {}, g);
    el('ellipse', { rx, ry, fill: '#fff', stroke: INK, 'stroke-width': i ? 3.5 : 4.5 }, open);
    const pupil = el('ellipse', { rx: rx * .5, ry: ry * .55, fill: INK }, open), shine = el('circle', { r: rx * .16, fill: '#fff' }, open);
    const shut = el('path', { d: `M${-rx * 1.05} 0Q0 ${ry * .55} ${rx * 1.05} 0`, fill: 'none', stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, g);
    const lash = F.lashes && el('path', { d: `M${rx * .55} ${-ry * .8}l${rx * .45} ${-ry * .3}M${rx * .85} ${-ry * .45}l${rx * .5} ${-ry * .12}`, fill: 'none', stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, open);
    return { x, y, rx, ry, g, open, pupil, shine, shut };
  }) : [];
  const brows = F ? F.brows.map(() => el('path', { fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round' }, faceG)) : [];
  const mouthG = F && el('g', {}, faceG);
  const mouthIn = F && el('path', { fill: '#7b2430', stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, mouthG);
  const tongue = F && el('path', { fill: '#ef7d86' }, mouthG), teeth = F && el('path', { fill: '#fff' }, mouthG);
  const mouthLine = F && el('path', { fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round' }, mouthG);
  // Mouth shapes (Rhubarb's set) in mouth units, the mouth's front under the snout on the right: [open height, width, teeth].
  const MOUTH = { X: [0, 1], A: [0, .9], B: [7, .8, 1], C: [16, .95], D: [26, 1], E: [20, .7], F: [11, .45], G: [7, .75, 1], H: [17, .9] };
  // A hose limb: one smooth curve through the joint, ink outline under the skin colour; a drawn hand or foot at the end.
  function hose(g, w, sleeve) {
    const out = el('path', { fill: 'none', stroke: INK, 'stroke-width': w + 7, 'stroke-linecap': 'round' }, g);
    const end = el('image', {}, g);
    const fill = el('path', { fill: 'none', stroke: spec.skin, 'stroke-width': w, 'stroke-linecap': 'round' }, g);
    const sl = sleeve && el('image', { href: src(sleeve.src) }, g);   // over the limb's root, turning with the upper arm
    return (a, k, b, part, ang, upAng) => {
      const c = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], d = `M${a}Q${c} ${b}`;
      out.setAttribute('d', d); fill.setAttribute('d', d);
      if (end._src !== part.src) { end.setAttribute('href', src(part.src)); end._src = part.src; }
      end.setAttribute('transform', `translate(${b}) rotate(${ang}) scale(${part.s}) translate(${-part.at[0]},${-part.at[1]})`);
      if (sl) sl.setAttribute('transform', `translate(${a}) rotate(${upAng - sleeve.dir}) scale(${sleeve.s}) translate(${-sleeve.at[0]},${-sleeve.at[1]})`);
    };
  }
  const [L1, L2, LW] = spec.leg, [A1, A2, AW] = spec.arm;
  const nearLeg = hose(nearLegG, LW), farLeg = hose(farLegG, LW), nearArm = hose(nearArmG, AW, spec.sleeve), farArm = hose(farArmG, AW, spec.sleeve);
  // A neck: a short SVG column from inside the collar up into the head, under the torso so the collar covers its root.
  const neckPaths = spec.neck && [el('path', { fill: 'none', stroke: INK, 'stroke-width': spec.neck.w + 7, 'stroke-linecap': 'round' }, neckG), el('path', { fill: 'none', stroke: spec.skin, 'stroke-width': spec.neck.w, 'stroke-linecap': 'round' }, neckG)];
  // Pig tails: a curl that wags; the wolf's is a drawing.
  let tail;
  if (spec.tailImg) { const ti = spec.tailImg; tail = el('image', { href: src(ti.src) }, tailG); }
  else if (T.tail) {
    const d = 'M0 0c-10 -2 -18 6 -14 14c4 8 16 6 16 -3c0 -8 -10 -10 -14 -4';
    el('path', { d, fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round' }, tailG);
    el('path', { d, fill: 'none', stroke: spec.skin, 'stroke-width': 3, 'stroke-linecap': 'round' }, tailG);
  }
  const legLen = L1 + L2, ankleH = (spec.foot.h - spec.foot.at[1]) * spec.foot.s;   // ankle above the sole
  function ik(h, a) {   // knee bends forward
    const dx = a[0] - h[0], dy = a[1] - h[1], d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1), legLen * .999);
    const th = Math.atan2(dy, dx) - Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
    return [h[0] + L1 * Math.cos(th), h[1] + L1 * Math.sin(th)];
  }
  const a = {
    root, spec, back: backG, front: frontG,   // back/front: drawn in torso image pixels, moving with the torso
    pose(s) {
      const k = s.k ?? 1, face = s.dir ?? 1, lean = s.lean ?? 0, sy = s.sy ?? 1, sx = 1 / sy;
      const hipY = -(ankleH + legLen * .94 - (s.drop ?? 0) - (s.bob ?? 0));
      root.setAttribute('transform', `translate(${s.x},${s.ground}) scale(${face * k},${k})`);
      // A point on the torso drawing, in actor units: pelvis-relative, squashed, leaned about the hip.
      const c = Math.cos(lean * R), sn = Math.sin(lean * R);
      const on = ([px, py]) => { const lx = (px - pelvis[0]) * T.s * sx, ly = (py - pelvis[1]) * T.s * sy; return [lx * c - ly * sn, hipY + lx * sn + ly * c]; };
      torsoG.setAttribute('transform', `translate(0,${hipY}) rotate(${lean}) scale(${sx},${sy})`);
      const tp = `translate(0,${hipY}) rotate(${lean}) scale(${sx * T.s},${sy * T.s}) translate(${-pelvis[0]},${-pelvis[1]})`;
      backG.setAttribute('transform', tp); frontG.setAttribute('transform', tp);
      // Head: swap drawings; pop is a quick squash that hides the swap.
      const hd = spec.heads[s.head?.name] || Object.values(spec.heads)[0], pop = s.head?.pop ?? 1;
      if (headImg._src !== hd.src) { headImg.setAttribute('href', src(hd.src)); headImg._src = hd.src; }
      let nk = on(T.neck);
      if (spec.neck) {   // the head rides on top of the neck, which leans a little with the head
        const tilt = (s.head?.tilt ?? 0) * .4 + lean, top = [nk[0] + spec.neck.up * Math.sin(tilt * R), nk[1] - spec.neck.up * Math.cos(tilt * R)];
        const base = on([T.neck[0], T.neck[1] + 40]);
        neckPaths.forEach(p => p.setAttribute('d', `M${base}L${top}`)); nk = top;
      }
      const back = s.head?.back ? -1 : 1;   // back: the head turned to look behind
      headG.setAttribute('transform', `translate(${nk}) rotate(${back * (s.head?.tilt ?? 0) + lean}) scale(${back * pop},${1 / pop})`);
      const fc = F && s.face;   // a drawn face replaces the head drawings
      headImg.style.display = fc ? 'none' : ''; if (F) faceG.style.display = fc ? '' : 'none';
      if (!fc) headImg.setAttribute('transform', `scale(${hd.s}) translate(${-hd.pivot[0]},${-hd.pivot[1]})`);
      else {
        faceG.setAttribute('transform', `scale(${hd.s}) translate(${-F.pivot[0]},${-F.pivot[1]})`);
        const [gx, gy] = fc.gaze || [1, 0], blink = fc.blink ?? 0, wide = fc.wide ?? 0, worry = fc.worry ?? 0, raise = fc.raise ?? 0;
        eyes.forEach(e => {
          const open = Math.max(.06, (1 - blink) * (1 + .12 * wide));
          e.g.setAttribute('transform', `translate(${e.x},${e.y})`); e.open.setAttribute('transform', `scale(1,${open})`);
          e.shut.style.opacity = blink > .7 ? 1 : 0; e.open.style.opacity = blink > .7 ? 0 : 1;
          const px = e.rx * (.22 + .32 * gx), py = e.ry * .32 * gy, ps = 1 - .3 * wide;
          e.pupil.setAttribute('transform', `translate(${px},${py}) scale(${ps})`); e.shine.setAttribute('transform', `translate(${px + e.rx * .12},${py - e.ry * .2})`);
        });
        // Brows: raise lifts both ends, worry lifts the inner (front) end and drops the outer one.
        F.brows.forEach(([x1, y1, x2, y2], i) => {
          const up = 9 * raise + 6 * wide, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 7 - up;
          brows[i].setAttribute('d', `M${x1} ${y1 - up + 6 * worry}Q${mx} ${my - 4 * worry} ${x2} ${y2 - up - 9 * worry}`);
        });
        const [m0, m1, mw] = F.mouth, [h, wk, th] = MOUTH[fc.mouth || 'X'] || MOUTH.X, w = mw * wk / 2, sm = fc.smile ?? .6;
        mouthG.setAttribute('transform', `translate(${m0 + mw / 2 - w},${m1})`);   // narrow shapes stay at the front
        const L = [-w, -2 - 9 * sm], Rt = [w, -2];   // back corner (lifts with a smile), front under the snout
        if (!h) { mouthLine.setAttribute('d', `M${L}Q${(L[0] + Rt[0]) / 2} ${10 * sm} ${Rt}`); mouthIn.setAttribute('d', ''); tongue.setAttribute('d', ''); teeth.setAttribute('d', ''); }
        else {
          const lip = `M${L}Q0 ${-4 + 3 * sm} ${Rt}`;
          mouthIn.setAttribute('d', `${lip}Q${w * .2} ${h * 1.25} ${L}Z`); mouthLine.setAttribute('d', '');
          tongue.setAttribute('d', h > 12 ? `M${-w * .55} ${h * .55}Q${w * .1} ${h * .3 + (fc.mouth === 'H' ? -8 : 0)} ${w * .6} ${h * .45}Q${w * .1} ${h * 1.05} ${-w * .55} ${h * .55}Z` : '');
          teeth.setAttribute('d', th ? `M${-w * .6} ${-2 - 4 * sm}L${w * .8} -1L${w * .75} 5L${-w * .55} 4Z` : '');
        }
      }
      // Legs: ankle targets from world x and lift; feet roll toe-down as they lift.
      const local = ([wx, lift]) => [(wx - s.x) / (face * k), -ankleH - lift / k];
      const feet = s.feet || [[s.x, 0], [s.x, 0]];
      [[nearLeg, T.hipN, feet[0]], [farLeg, T.hipF, feet[1]]].forEach(([draw, hip, f]) => {
        const h = on(hip), an = local(f);
        draw(h, ik(h, an), an, spec.foot, Math.min(25, f[1] * .6 / k));
      });
      // Arms: angles from hanging straight down; the hand turns with the forearm.
      const sh = on(T.shoulder), arms = s.arms || [{}, {}];
      [[nearArm, arms[0]], [farArm, arms[1]]].forEach(([draw, arm = {}]) => {
        const a1 = (90 + (arm.up ?? 0) + lean) * R, a2 = a1 + (arm.bend ?? -15) * R;
        const e = [sh[0] + A1 * Math.cos(a1), sh[1] + A1 * Math.sin(a1)], w = [e[0] + A2 * Math.cos(a2), e[1] + A2 * Math.sin(a2)];
        const part = (arm.hand === 'hand' ? spec.hand : spec.fist) || spec.fist || spec.hand;
        draw(sh, e, w, part, a2 / R - part.dir, a1 / R);
        const i = draw === nearArm ? 0 : 1, grip = [w[0] + 22 * Math.cos(a2), w[1] + 22 * Math.sin(a2)];   // inside the hand, along the forearm
        (a.wrists ||= [])[i] = [s.x + face * k * w[0], s.ground + k * w[1]];   // world, for held props
        (a.grips ||= [])[i] = { at: [s.x + face * k * grip[0], s.ground + k * grip[1]], ang: face > 0 ? a2 / R : 180 - a2 / R };
      });
      if (spec.tailImg) {
        const ti = spec.tailImg, tp = on(ti.at);
        tail.setAttribute('transform', `translate(${tp}) rotate(${lean + (s.tail ?? 0)}) scale(${-ti.s},${ti.s}) translate(${-ti.root[0]},${-ti.root[1]})`);
      } else if (T.tail) tailG.setAttribute('transform', `translate(${on(T.tail)}) rotate(${lean + (s.tail ?? 0)}) scale(.9)`);
    },
  };
  return a;
}

// A walk that starts from standing, as a pure function of tau (seconds since the first step). Each foot is planted
// while the body passes over it, then swings to its next plant. Returns the distance walked d, both feet as
// [distance, lift] (near, far), the hip's drop (bob, + is down) and, for a skip, the body's rise (up).
function walk(tau, { T = .8, stance = .6, v = 150, acc = .4, lift = 14, bob = 4, hop = 0 } = {}) {
  const dist = u => u <= 0 ? 0 : u < acc ? v * u * u / (2 * acc) : v * (u - acc / 2);
  const foot = off => {
    if (tau <= 0) return [0, 0];
    const c = tau / T + off, n = Math.floor(c), u = c - n, plant = j => dist((j + stance / 2 - off) * T);
    if (u < stance) return [plant(n), 0];
    const q = (u - stance) / (1 - stance);
    return [plant(n) + (plant(n + 1) - plant(n)) * q * q * (3 - 2 * q), Math.sin(Math.PI * q) * lift];
  };
  const ramp = Math.min(1, Math.max(0, tau / .3));
  return { d: dist(tau), feet: [foot(stance), foot(stance + .5)], bob: ramp * bob * Math.cos(4 * Math.PI * (tau / T - .48)),
    up: ramp * hop * Math.abs(Math.sin(2 * Math.PI * (tau / T - .4))) };
}

// Follow-through, seekable: a damped spring's response to an input signal f(t), as a weighted sum of f over the last
// `win` seconds. No state, so any frame can be computed on its own. hz: natural frequency; z: damping ratio.
function lag(f, t, { hz = 2.5, z = .35, win = 1.6, n = 40 } = {}) {
  const w = 2 * Math.PI * hz, wd = w * Math.sqrt(1 - z * z), dt = win / n;
  let sum = 0, norm = 0;
  for (let i = 0; i < n; i++) { const tau = (i + .5) * dt, h = Math.exp(-z * w * tau) * Math.sin(wd * tau); sum += h * f(t - tau); norm += h; }
  return sum / norm;
}
// Repeatable noise and automatic blinks: each character has its own seed.
const hash = x => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const wobble = (t, seed, hz = .3) => Math.sin(t * hz * 6.283 + seed) * .6 + Math.sin(t * hz * 2.71 * 6.283 + seed * 3) * .4;
function blinkAt(t, seed) {
  let at = .8 + hash(seed) * 1.5, prev = -9, i = 1;
  while (at <= t) { prev = at; at += 2 + 4 * hash(seed + i++); }
  const d = t - prev; return d < .16 ? Math.sin(Math.PI * d / .16) : 0;
}
