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
function roomProps(cam, order) {
  // order: puppet slots between the room's pieces, back to front. Returns the pieces' controls.
  const st = cam.stage, slot = n => mk('g', {}, st), r = {};
  r.daylight = prop(st, `<g filter="url(#paper)"><rect x="176" y="436" width="188" height="364" fill="#f6e7b8"/><rect x="176" y="690" width="188" height="110" fill="#8db35b"/></g>`);
  r.atDoor = slot();
  r.door = doorLeaf(st, 'M176,436 H364 V800 H176 Z', '#8a5a32', 176, '<path d="M220,436 V800 M270,436 V800 M320,436 V800" stroke="#6e4426" stroke-width="3"/><rect x="330" y="600" width="22" height="8" fill="#3b2a1e"/>');
  r.inWardrobe = slot();
  r.wardrobe = doorLeaf(st, 'M1790,410 H1932 V790 H1790 Z', '#8a5a32', 1790, '<circle cx="1918" cy="600" r="6" fill="#caa24c"/><path d="M1810,430 h102 v160 h-102 Z" fill="none" stroke="#6e4426" stroke-width="4"/>');
  r.inBed = slot();
  r.quilt = prop(st, quiltSVG);
  r.front = slot();
  return r;
}
