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

/* ---------- this book's places ---------- */
// The river, side-on (books/little-horse/art/sets.js): the waterline and the bed under it, so a wader's hooves stand on
// the bed and the water layer covers whatever is below the line.
const WATER = 720;
const RIVER_BED = x => x < 600 ? 700 : x < 690 ? 700 + 20 * (x - 600) / 90 + 18 * ((x - 600) / 90) ** 2
  : x < 1230 ? 738 + 48 * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - 690) / 540))) ** .8 : x < 1320 ? 738 - 32 * (x - 1230) / 90 : 706;
// A camera on one of the book's sets with the puppets' plane where it belongs: at the river the puppets stand in front
// of the tree (Squirrel sits on its branch) and behind the water and the near faces of the banks.
const setCam = (p, set, v0 = {}) => paperCam(p, set, v0, set === 'river' ? { after: 'tree' } : {});

// Moving a four-legged puppet along the ground: keys [[t, x], …] on the scene clock, eased between keys. Returns x, the
// distance walked in the puppet's own units (d, for pose: x = x0 + turn·s·d keeps the hooves planted) and stand, 1 at
// rest, blending to 0 within a quarter second of setting off and back to 1 after stopping.
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

// The mill's water wheel, a paper wheel that turns on the scene clock: wheel(q) poses it.
function millWheel(parent, x = 1340, y = 650, r = 150) {
  const spokes = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M0,0 L${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}" stroke="#6e4a30" stroke-width="12"/>`; }).join('');
  const paddles = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `<rect x="-9" y="${-r - 26}" width="18" height="40" fill="#8a5a36" transform="rotate(${(a * 180 / Math.PI).toFixed(1)})"/>`; }).join('');
  const g = prop(parent, `<g filter="url(#paper)">${paddles}<circle r="${r}" fill="none" stroke="#7a5236" stroke-width="14"/><circle r="${r * .62}" fill="none" stroke="#7a5236" stroke-width="8"/>${spokes}<circle r="22" fill="#5a3b24"/></g>`);
  return q => tf(g, `translate(${x},${y}) rotate(${(q * 24 % 360).toFixed(1)})`);
}

// Beds (river, birds, wind, mill) are files of about 10 s with soft ends; a scene calls sfx() for one once, and it is
// laid again every BED_STEP s so it runs to the scene's end (effects past a beat's end never play, and export.py
// leaves them out too). The page waiting at a point-and-read stop plays no effects; the music carries the wait.
const BED_STEP = { river: 9.5, mill: 9.5, birds: 9.6, wind: 7.5 };
{ const once = window.sfx; window.sfx = (beat, t, name, vol) => { once(beat, t, name, vol); if (BED_STEP[name]) for (let k = 1; k * BED_STEP[name] < 60; k++) once(beat, +(t + k * BED_STEP[name]).toFixed(2), name, vol); }; }
