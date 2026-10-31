/* shared.js — what every scene of the book uses: timing helpers and painted props. Put the book's
   recurring places and props here too (a classroom or a street built the same way whenever it appears, so the staging
   matches across cuts): a function like `function room(p) { const cam = paperCam(p, 'room'); … return { cam, … }; }`. */
'use strict';
// Beat-clock time of `t` seconds into clip `clip` of a joined scene whose speech starts `pre` s in (join.py's `parts`).
const clipAt = (scene, pre, clip, t = 0) => pre + TIMINGS[scene].parts[clip] + t;
// Beat-clock time of the n-th caption cue (one per sentence) of a joined scene: for cutting on sentences.
const cueAt = (scene, pre, n) => pre + TIMINGS[scene].cues[n][0];
const onTwos = q => Math.floor(q * FPS / 2) % 2 ? 1 : -1;
const between = (q, a, b) => q >= a && q < b;
const tween = (q, t0, d, a, b) => a + (b - a) * span(q, t0, t0 + d);
// Who is speaking: the mouth for this frame from the listed clips of a joined scene, or 'X' (rest).
const lips = (q, scene, pre, ...clips) => { for (const c of clips) { const m = mouthAt(c, q - clipAt(scene, pre, c)); if (m !== 'X') return m; } return 'X'; };
// Chewing on twos: the mouth alternates between two shapes.
const chew = q => onTwos(q) > 0 ? 'chew' : 'A';

/* ---------- painted props (img/props/<name>.webp, from painted.py) ---------- */
// A picture at (x, y), w by h, to hold in a puppet's hand (holds: { key: svg }) or drop into prop().
const artSVG = (name, x, y, w, h) => `<image href="../img/props/${name}.webp" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

/* ---------- this book's places and pieces ---------- */
// The ground the path runs on in the woods, and where a puppet's hip sits for feet on it.
const WOODS = 785, hipOn = (gy, s, feet = 170) => gy - feet * s;
// A walk of a puppet from x0 to the right (dir -1: to the left), stopping cleanly after `steps` steps.
function walker(x0, s, opts = {}, dir = 1, steps = Infinity) {
  const half = (opts.period || 1) / 2;
  return tau => { const w = walk(Math.min(tau, steps * half), opts); return { ...w, x: x0 + dir * w.d * s }; };
}
const bushBackSVG = (x, y) => `<g filter="url(#paper)" transform="translate(${x},${y}) scale(.9)"><circle cx="-80" cy="-40" r="58" fill="#2f5638"/><circle cx="80" cy="-46" r="62" fill="#2f5638"/>
  <rect x="-110" y="-70" width="220" height="90" rx="30" fill="#26482f"/><circle cx="0" cy="-122" r="50" fill="#3a6844"/></g>`;
const bushFrontSVG = (x, y) => `<g filter="url(#paper)" transform="translate(${x},${y}) scale(.9)"><circle cx="-30" cy="-6" r="40" fill="#3a6844"/><circle cx="40" cy="-4" r="42" fill="#3a6844"/></g>`;
// Round eyes in the dark of a bush: open (0 … 1) and look (-1 … 1).
function bushEyes(parent, x, y) {
  const g = mk('g', {}, parent);
  const e = [-23, 23].map(dx => { const w = mk('g', { transform: `translate(${x + dx},${y})` }, g); mk('ellipse', { rx: 13.5, ry: 11.5, fill: '#fbf4e2' }, w); return [w, mk('circle', { r: 6, fill: '#22150e' }, w)]; });
  return (open, look) => { vis(g, open > 0); e.forEach(([w, p], i) => { tf(w, `translate(${x + [-23, 23][i]},${y}) scale(1,${Math.max(.05, open).toFixed(2)})`); p.setAttribute('cx', (6 * look).toFixed(1)); }); };
}
const doorLeaf = (parent, d, fill, hinge, extra = '') => { const g = prop(parent, `<g filter="url(#paper)"><path d="${d}" fill="${fill}"/>${extra}</g>`); return k => tf(g, `translate(${hinge},0) scale(${k.toFixed(2)},1) translate(${-hinge},0)`); };
// Door positions over its frames from shut (1) to open; returns the door's scale at time q for an opening at t0.
const OPENING = [1, .75, .45, .15, -.15, -.35];
const opening = (q, t0, steps = OPENING) => q < t0 ? steps[0] : steps[Math.min(steps.length - 1, Math.floor((q - t0) * FPS))];
const quiltSVG = `<g filter="url(#paper)"><path d="M736,646 C800,630 900,640 1000,628 C1100,620 1200,632 1344,640 L1350,764 L730,764 Z" fill="#b5523b"/>
  ${[0, 1, 2, 3, 4].map(i => `<rect x="${770 + i * 112}" y="${660 + (i % 2) * 34}" width="70" height="44" fill="${i % 2 ? '#e8c4a0' : '#c8704a'}"/>`).join('')}</g>`;
const ROOM_DOOR = 'M176,800 L176,520 Q270,352 364,520 L364,800 Z';   // the doorway's arch in the room set (sets.js)
function roomProps(cam, order) {
  // order: puppet slots between the room's pieces, back to front. Returns the pieces' controls.
  const st = cam.stage, slot = n => mk('g', {}, st), r = {};
  // the front door: blue, arched and hinged at its left like the outside one (grandmaOut); daylight in its arch when open
  r.daylight = prop(st, `<g filter="url(#paper)"><path d="${ROOM_DOOR}" fill="#f6e7b8"/><rect x="176" y="690" width="188" height="110" fill="#8db35b"/></g>`);
  r.atDoor = slot();
  r.door = doorLeaf(st, ROOM_DOOR, '#3f5f8a', 176, '<path d="M220,468 V800 M270,444 V800 M320,468 V800" stroke="#2f4a6e" stroke-width="3"/><circle cx="344" cy="620" r="7" fill="#caa24c"/>');
  r.inWardrobe = slot();
  r.wardrobe = doorLeaf(st, 'M1790,410 H1932 V790 H1790 Z', '#8a5a32', 1790, '<circle cx="1918" cy="600" r="6" fill="#caa24c"/><path d="M1810,430 h102 v160 h-102 Z" fill="none" stroke="#6e4426" stroke-width="4"/>');
  r.inBed = slot();
  r.quilt = prop(st, quiltSVG);
  r.front = slot();
  return r;
}

/* ---------- props: the meadow's things (scenes 4 and 4w) and the inserts ----------
   Each returns { g, pose(...) }: g is the group to tap or hide (vis), pose places it in the world of the stage it was
   built in. Nothing here is in a set, so it can move, be picked and answer a tap. All are baked like puppet pieces. */
// The bird (on a branch, the ground or the wing): pose(x, y, s, { peck 0…1, flap -1 | 0 | 1 (wings on twos), look -1…1 }).
function birdProp(parent) {
  const g = mk('g', {}, parent), body = mk('g', {}, g);
  body.innerHTML = `<g filter="url(#paper)"><path d="M-30,4 L-52,-6 L-50,12 Z" fill="#3f5f8a"/><ellipse cx="0" cy="0" rx="30" ry="21" fill="#5b82b8"/>
    <ellipse cx="6" cy="8" rx="17" ry="11" fill="#f1e2c4"/></g>`;
  const head = mk('g', {}, body);
  head.innerHTML = `<g filter="url(#paper)"><circle cx="24" cy="-18" r="15" fill="#5b82b8"/><path d="M37,-21 L50,-16 L37,-12 Z" fill="#efae48"/></g><circle cx="29" cy="-21" r="3.2" fill="#22150e"/>`;
  const wing = prop(body, `<g filter="url(#paper)"><path d="M-14,-6 Q4,-22 18,-4 Q2,10 -14,-6 Z" fill="#3f5f8a"/></g>`);
  const legs = prop(g, `<path d="M-4,18 l-3,14 M8,18 l2,14" stroke="#c98a3c" stroke-width="3"/>`);
  bakeAll(g);
  return { g, pose(x, y, s, { peck = 0, flap = 0, look = 0 } = {}) {
    tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); vis(legs, !flap);
    tf(body, `translate(0,${flap ? -14 : 0}) rotate(${(peck * 28).toFixed(1)},10,10)`);
    tf(head, `rotate(${(look * 10).toFixed(1)},24,-8)`);
    tf(wing, flap ? `rotate(${flap > 0 ? -50 : 20},-14,-6)` : '');
  } };
}
// A butterfly: pose(x, y, s, open), open 1 … 0 … 1 the wings (on twos: [1, .7, .35, .7][Math.floor(q * FPS / 2) % 4]).
function butterflyProp(parent) {
  const g = mk('g', {}, parent), wings = [-1, 1].map(d => prop(g, `<g filter="url(#paper)"><path d="M0,0 C${12 * d},-34 ${44 * d},-30 ${36 * d},-6 C${32 * d},6 ${12 * d},4 0,0 Z" fill="#e88ab0"/>
    <path d="M0,2 C${16 * d},8 ${30 * d},16 ${20 * d},30 C${10 * d},32 ${2 * d},18 0,2 Z" fill="#efae48"/><circle cx="${22 * d}" cy="-14" r="5" fill="#f6efe0"/></g>`));
  prop(g, `<g filter="url(#paper)"><rect x="-3.5" y="-16" width="7" height="34" rx="3.5" fill="#3b2a1e"/></g><path d="M-2,-15 q-6,-12 -12,-14 M2,-15 q6,-12 12,-14" stroke="#3b2a1e" stroke-width="2" fill="none"/>`);
  mk('circle', { r: 40, fill: 'transparent' }, g);   // a finger-sized target even when the wings are shut
  return { g, pose(x, y, s, open) { tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); wings.forEach(w => tf(w, `scale(${open},1)`)); } };
}
// One flower to pick, as big as the meadow's fore flowers (the set's flowers stay where they are): drawn from its foot
// at (0, 0), its head at (0, -h). col: a FLOWER_COLS colour (cast.js), so it matches the bouquet it goes into.
// pose(x, y, s, { sway: degrees, on: true }); picked flowers: vis(f.g, false) and show Red's `held`.
function flowerProp(parent, col = '#d6493f', h = 70) {
  const g = mk('g', {}, parent);
  prop(g, `<g filter="url(#paper)"><path d="M0,0 C-4,${-h * .4} 4,${-h * .7} 0,${-h}" stroke="#4f7a34" stroke-width="4" fill="none"/>
    <path d="M0,${-h * .3} q-14,-4 -18,-14 q12,0 18,14 Z M0,${-h * .5} q14,-4 17,-13 q-12,0 -17,13 Z" fill="#5b8a3e"/></g>`);
  const head = mk('g', {}, g);   // after the stem: the head is on top
  prop(head, `<g filter="url(#paper)">${[0, 1, 2, 3, 4].map(i => { const a = i * 1.2566 - 1.57; return `<circle cx="${(12 * Math.cos(a)).toFixed(1)}" cy="${(-h + 12 * Math.sin(a)).toFixed(1)}" r="9.5" fill="${col}"/>`; }).join('')}
    <circle cx="0" cy="${-h}" r="7" fill="#efae48"/></g>`);
  mk('circle', { cy: -h, r: 30, fill: 'transparent' }, g);   // a finger-sized target
  return { g, pose(x, y, s = 1, { sway = 0, on = true } = {}) { vis(g, on); tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); tf(head, `rotate(${sway.toFixed(1)},0,0)`); } };
}
// A cloud that drifts (the one to tap; the sets' own clouds are baked): pose(x, y, s).
function cloudProp(parent) {
  const g = mk('g', {}, parent);
  prop(g, `<g filter="url(#paper)"><circle cx="-40" cy="10" r="30" fill="#fbf4e2"/><circle cx="0" cy="-8" r="40" fill="#fbf4e2"/>
    <circle cx="45" cy="8" r="32" fill="#fbf4e2"/><rect x="-70" y="10" width="148" height="30" rx="15" fill="#fbf4e2"/></g>`);
  mk('rect', { x: -80, y: -56, width: 170, height: 106, rx: 40, fill: 'transparent' }, g);
  return { g, pose(x, y, s = 1) { tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); } };
}
// The sun, with paper rays that turn slowly: pose(x, y, s, spin degrees). The meadow set has none of its own.
function sunProp(parent) {
  const g = mk('g', {}, parent), rays = mk('g', {}, g);
  prop(rays, `<g filter="url(#paper)">${Array.from({ length: 10 }, (_, i) => `<path d="M-9,-78 L0,-104 L9,-78 Z" fill="#f3c560" transform="rotate(${i * 36})"/>`).join('')}</g>`);
  prop(g, `<g filter="url(#paper)"><circle r="66" fill="#efae48"/><circle r="50" fill="#f3c560"/></g>`);
  return { g, pose(x, y, s = 1, spin = 0) { tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); tf(rays, `rotate(${spin.toFixed(1)})`); } };
}
// Grandma's nightcap and glasses on their own (they drop off as she hops, the wolf picks them up; the glasses also fly
// off the wolf at "EAT"): drawn at their size on her head (puppet scale 1; give the puppet's s). pose(x, y, s, rot).
function granCapProp(parent) {
  const g = mk('g', {}, parent), c = mk('g', {}, g);
  prop(c, `<g filter="url(#paper)"><path d="M-48,26 C-48,-26 46,-30 54,22 Q4,4 -48,26 Z" fill="#f6efe0"/><path d="M-48,26 Q4,4 54,22" stroke="#e8c4d0" stroke-width="7" fill="none" stroke-dasharray="7 5"/></g>`);
  return { g, pose(x, y, s = .55, rot = 0) { tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); tf(c, `rotate(${rot.toFixed(1)})`); } };
}
function granGlassesProp(parent) {
  const g = mk('g', {}, parent), c = mk('g', {}, g);
  c.innerHTML = '<circle cx="-15" r="12.5" fill="#ffffff" fill-opacity=".22" stroke="#3a2412" stroke-width="4.6"/><circle cx="15" r="12.5" fill="#ffffff" fill-opacity=".22" stroke="#3a2412" stroke-width="4.6"/><path d="M-3,-2 q3,-3 6,0 M-27,-2 l-14,-3 M27,-2 l14,-3" stroke="#3a2412" stroke-width="4.2" fill="none" stroke-linecap="round"/>';
  return { g, pose(x, y, s = .55, rot = 0) { tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); tf(c, `rotate(${rot.toFixed(1)})`); } };
}
// The basket for the insert in scene 1 ("cake and apple juice"): the cloth folded back on the cake and the bottle.
// About 300 wide at s 1, its foot at (0, 0); open 0 (the checked cloth over everything) … 1 (cloth off to the left).
// .cloth is the cloth's group, for a scene that moves it its own way (pose with open 0, then transform .cloth).
function basketProp(parent) {
  const g = mk('g', {}, parent);
  prop(g, `<g filter="url(#paper)"><path d="M-110,-150 Q0,-330 110,-150" fill="none" stroke="#8a5a2a" stroke-width="16"/></g>
    <g filter="url(#paper)"><rect x="18" y="-250" width="44" height="120" rx="10" fill="#e9a43a"/><rect x="28" y="-282" width="24" height="40" rx="6" fill="#e9a43a"/>
      <rect x="26" y="-292" width="28" height="14" rx="4" fill="#c8322f"/><rect x="22" y="-210" width="36" height="40" fill="#f6efe0"/><circle cx="40" cy="-190" r="11" fill="#d6493f"/><path d="M40,-201 q4,-8 10,-8" stroke="#4f7a34" stroke-width="3" fill="none"/></g>
    <g filter="url(#paper)"><path d="M-96,-150 L6,-150 L6,-196 Q-45,-214 -96,-196 Z" fill="#d9a85a"/><path d="M-96,-196 Q-45,-214 6,-196 Q-45,-180 -96,-196 Z" fill="#f6efe0"/>
      <path d="M-90,-186 h90" stroke="#c8322f" stroke-width="5" stroke-dasharray="10 7"/><circle cx="-45" cy="-208" r="9" fill="#c8322f"/></g>
    <g filter="url(#paper)"><path d="M-130,-160 L130,-160 L108,0 L-108,0 Z" fill="#b07a3e"/><path d="M-124,-112 L124,-112 M-116,-58 L116,-58" stroke="#8a5a2a" stroke-width="6"/>
      <path d="M-70,-160 L-64,0 M0,-160 L0,0 M70,-160 L64,0" stroke="#8a5a2a" stroke-width="4"/></g>`);
  const cloth = mk('g', {}, g);   // last: it lies over the cake and the bottle
  prop(cloth, `<g filter="url(#paper)"><path d="M-138,-150 Q-128,-262 0,-272 Q128,-262 138,-150 L124,-118 Q0,-138 -124,-118 Z" fill="url(#check)"/></g>`);
  return { g, cloth, pose(x, y, s = 1, open = 1) { tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`);
    tf(cloth, open > 0 ? `translate(${(-190 * open).toFixed(1)},${(120 * open).toFixed(1)}) rotate(${(-28 * open).toFixed(1)},-138,-150)` : ''); } };
}

/* ---------- moving puppets along the ground ---------- */
// keys [[t, x], …] on the scene clock, eased between keys (Little Horse's route). Returns x, the distance travelled in
// the puppet's own units (d: the wolf's `run: d` plants his paws with it) and stand (1 at rest, 0 moving).
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
// One big, deliberate step forward (Red stepping off the path onto the grass), u 0 … 1 over the step: the near knee
// lifts high, the foot comes down ahead and the hip follows, sinking into the stride (drop) while the back knee bends so
// the back foot stays on the ground; at u 1 both feet are down. Like walk(): const b = bigStep(u);
// red.pose({ ...b, x: x0 + b.d * s, y: hipOn(gy, s) + b.drop * s, … }).
function bigStep(u, L = 166, reach = 30) {
  const e = ease(u), lift = Math.sin(Math.PI * Math.min(1, u * 1.25)), r = Math.PI / 180;
  const near = -reach * Math.sin(Math.PI * e / 2) - 40 * lift * (1 - e), far = reach * e * .7;
  // hip height h·L: down to the stride's (cos reach) as the step lands; the back leg (thigh ≈ shin ≈ L/2) bends to reach it
  const h = Math.cos(reach * e * r), kFar = Math.max(0, Math.acos(Math.min(1, 2 * h - Math.cos(far * r))) / r - far);
  return { near, far, kNear: 75 * lift, kFar, d: 2 * L * Math.sin(reach * Math.PI / 360) * e * 1.6, drop: L * (1 - h) };
}
