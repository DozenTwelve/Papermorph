/* shared.js — what every scene of the series uses: timing helpers, props, the two places (the bun stall and the
   classroom, built the same way whenever they appear so the staging matches across cuts) and the sound effects. */
'use strict';
// Beat-clock time of `t` seconds into clip `clip` of a joined scene whose speech starts `pre` s in.
const clipAt = (scene, pre, clip, t = 0) => pre + TIMINGS[scene].parts[clip] + t;
// Beat-clock time of the n-th caption cue (one per sentence) of a joined scene: for cutting on sentences.
const cueAt = (scene, pre, n) => pre + TIMINGS[scene].cues[n][0];
const onTwos = q => Math.floor(q * FPS / 2) % 2 ? 1 : -1;
const between = (q, a, b) => q >= a && q < b;
const tween = (q, t0, d, a, b) => a + (b - a) * span(q, t0, t0 + d);
// Who is speaking: the mouth for this frame from the listed clips of a joined scene, or 'X'.
const lips = (q, scene, pre, ...clips) => { for (const c of clips) { const m = mouthAt(c, q - clipAt(scene, pre, c)); if (m !== 'X') return m; } return 'X'; };
// Chewing on twos: the mouth alternates between two shapes.
const chew = q => onTwos(q) > 0 ? 'chew' : 'A';

/* ---------- props (puppet pieces, baked like them) ---------- */
// Painted props (img/props, from the Skill's scripts/painted.py): a picture at (x, y), w by h.
const artSVG = (name, x, y, w, h) => `<image href="../img/props/${name}.webp" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
// A steamed bun, centred on (0, 0), about 48 wide; `bite`: with a bite out of its right side.
const bunSVG = (bite = false) => bite ? artSVG('bun-bite', -24, -36, 48, 44) : artSVG('bun', -24, -34, 48, 42);
// A one-litre bottle of soy milk, held by its middle.
const soySVG = artSVG('soy', -15, -64, 31, 100);   // painted
// A painted umbrella ('red' | 'yellow') held by the crook of its handle, the canopy above the hand.
const umbrellaArt = c => artSVG('umb-' + c, -150, -312, 300, 335);
// An umbrella held up by its handle (the canopy above the hand).
// `len` is the shaft: long enough that the canopy clears the holder's head.
const umbrellaSVG = (c, len = 150) => `<g filter="url(#paper)"><path d="M0,0 V${-len}" stroke="#3a3430" stroke-width="5"/><path transform="translate(0,${150 - len})" d="M-120,-140 Q0,-250 120,-140 Q90,-160 60,-140 Q30,-160 0,-140 Q-30,-160 -60,-140 Q-90,-160 -120,-140 Z" fill="${c}"/></g>`;
// A double desk: the pupils behind it show from the chest up. (cx, top) is the middle of its top edge, s its scale.
const deskSVG = (cx, top, s) => artSVG('desk', cx - 240 * s, top - 10 * s, 480 * s, 233 * s);   // painted (800 x 388)

/* ---------- the bun stall (scenes 1 and 4) ----------
   The cart is on the right; the seller stands behind it (only her top half shows over the counter). The two boys stand
   on the pavement facing us, Me on the left, Bo on the right — they keep those sides in every scene. */
const STALL = { ground: 800, s: .95, me: 480, bo: 760, aunt: { x: 1300, y: 780, s: 1 } };
// the stall's locked framing: the boys and the seller, a little closer than the whole set
const STALL_VIEW = { x: 860, y: 560, z: 1.3 };
// The stall is painted (the Skill's scripts/painted.py): three weathers of the street, and the cart as its own cut-out so
// the seller stands behind it. weather('sun'|'rain'|'snow').
function stallSet(p, holds = {}) {
  const cam = paperCam(p, 'stall', {}, { after: 'cart', stages: ['snow'] });
  const aunt = auntPuppet(cam.stageAt.snow, { holds: { bun: bunSVG() } });
  const me = mePuppet(cam.stage, { holds }), bo = boPuppet(cam.stage, { holds });
  const weather = w => { cam.show('rain', w === 'rain'); cam.show('snow', w === 'snow'); };
  weather('sun');
  return { cam, me, bo, aunt, weather };
}

/* ---------- the classroom (scenes 2, 3 and 4) ----------
   Seen from the teacher's desk: three rows of double desks going back toward the wall, every pupil facing us. Me and
   Bo share the middle desk of the front row (Me left, Bo right). Rows are built back to front so nearer desks cover
   farther pupils. classroom(p) → { cam, me, bo, mates, seat, matesPose }. */
const ROWS = [
  { s: .6, top: 520, desks: [400, 800, 1200], gap: 70 },
  { s: .78, top: 612, desks: [300, 800, 1300], gap: 92 },
  { s: 1, top: 722, desks: [250, 800, 1350], gap: 120 },
];
// where a pupil sits: x and the y of their feet (hidden under the desk) for desk d, side -1 (left) / 1 (right)
const seat = (r, d, side) => ({ x: ROWS[r].desks[d] + side * ROWS[r].gap, y: ROWS[r].top + 74 * ROWS[r].s, s: ROWS[r].s });
// The desk right behind Me and Bo stays empty: heads there would peek over theirs in every two-shot.
const MATES = [   // [row, desk, side, hair, hair colour]
  [0, 0, -1, 'bowl', '#1c1a1a'], [0, 0, 1, 'pigtails', '#2a1d14'], [0, 1, -1, 'part', '#3a2618'], [0, 1, 1, 'buzz', '#1c1a1a'], [0, 2, -1, 'pigtails', '#1c1a1a'], [0, 2, 1, 'bowl', '#4a3020'],
  [1, 0, -1, 'buzz', '#2a1d14'], [1, 0, 1, 'pigtails', '#3a2618'], [1, 2, -1, 'pigtails', '#4a3020'], [1, 2, 1, 'buzz', '#1c1a1a'],
  [2, 0, -1, 'part', '#2a1d14'], [2, 0, 1, 'pigtails', '#1c1a1a'], [2, 2, -1, 'bowl', '#3a2618'], [2, 2, 1, 'buzz', '#2a1d14'],
];
// The two-shot of Me and Bo at their desk (Bo standing or sitting): the framing scenes 3 and 4 meet on.
const TWO = { x: 800, y: 600, z: 1.8 };
function classroom(p, holds = {}) {
  const cam = paperCam(p, 'classBack');
  const mates = [], out = { cam, seat };
  for (let r = 0; r < ROWS.length; r++) {
    for (const [mr, d, side, hair, col] of MATES) if (mr === r) mates.push({ ...seat(r, d, side), k: mates.length, p: classmate(cam.stage, hair, col) });
    if (r === 2) { out.me = mePuppet(cam.stage, { holds }); out.bo = boPuppet(cam.stage, { holds }); }
    prop(cam.stage, ROWS[r].desks.map(cx => deskSVG(cx, ROWS[r].top, ROWS[r].s)).join(''));
  }
  out.mates = mates;
  out.ME = seat(2, 1, -1); out.BO = seat(2, 1, 1);
  // Bo on his feet behind the desk (scene 2 ends and scene 3 starts this way)
  out.BO_UP = { ...out.BO, y: out.BO.y - 64 };
  // The class at rest: each pupil blinks on their own and glances about now and then. lookAt (an x, or null) turns
  // every face toward that point from time `t0` (a staggered snap, a frame or two apart, the way a class turns).
  out.matesPose = (q, f, { lookAt = null, t0 = 0, extra = {} } = {}) => {
    for (const m of mates) {
      const own = (q * .23 + m.k * .37) % 1, blinkAt = Math.floor(q / 3.1 + m.k * .29);
      const shut = ((q / 3.1 + m.k * .29) % 1) < .05 && blinkAt >= 0;
      let look = own < .12 ? (m.k % 2 ? .5 : -.5) : 0, eyeX = look;
      if (lookAt !== null && q >= t0 + (m.k % 4) / FPS) { look = Math.max(-1, Math.min(1, (lookAt - m.x) / 400)); eyeX = Math.sign(lookAt - m.x); }
      m.p.pose({ x: m.x, y: m.y, s: m.s, sit: true, look, eyeX, shut, ...extra }, f);
    }
  };
  return out;
}

/* ---------- episode 2: the homework, the teacher, the dog ---------- */
// A sheet of homework held up by its bottom edge (the hand at (0, 0)). grease: the oil stain from a bun; bite 0–2: how
// much of it a dog has eaten from the top; blank: nothing written; perfect: a red 100 in the corner.
// name: 'Bo' written at the top (so a blank one reads as blank); grease: true or 'big' (for an insert); paw: a muddy
// paw print in the corner (the dog signed it).
function hwSVG({ grease = false, bite = 0, blank = false, perfect = false, name = '', paw = false } = {}) {
  const top = [-92, -92, -50][bite];
  const sheet = ['M-34,-92 H34 V-4 H-34 Z', 'M-34,-92 H2 a14,14 0 0 0 16,14 a12,12 0 0 0 16,10 V-4 H-34 Z',
    'M-34,-50 a12,12 0 0 0 18,-6 a14,14 0 0 0 22,4 a14,14 0 0 0 28,-6 V-4 H-34 Z'][bite];
  const lines = blank ? '' : [-78, -66, -54, -42, -30, -18].filter(y => y > top + 6)
    .map((y, i) => `<path d="M-26,${y} q6,-4 12,0 t12,0 t12,0 ${i % 2 ? 't12,0' : 't12,0 t8,0'}" fill="none" stroke="#3a4f86" stroke-width="2.2"/>`).join('');
  return `<g filter="url(#paper)"><path d="${sheet}" fill="#fbfaf4"/><path d="M-34,${top + 2} V-4" stroke="#e89a9a" stroke-width="2"/>${lines}
    ${grease === 'big' ? '<path d="M-6,-48 q14,-10 30,-2 q12,8 4,22 q-8,14 -26,10 q-18,-4 -16,-16 q0,-8 8,-14 Z" fill="#c98f2e" opacity=".7"/><ellipse cx="10" cy="-36" rx="9" ry="6" fill="#f3d79a" opacity=".6"/>'
      : grease ? '<ellipse cx="10" cy="-34" rx="15" ry="11" fill="#e0b25a" opacity=".55"/>' : ''}
    ${name && top < -80 ? `<text x="-24" y="-80" font-family="Chalkboard, Comic Sans MS, sans-serif" font-size="12" font-weight="700" fill="#3a4f86">${name}</text>` : ''}
    ${paw ? '<g fill="#7a5a3c" opacity=".85"><ellipse cx="18" cy="-18" rx="7" ry="6"/><circle cx="10" cy="-27" r="2.6"/><circle cx="15" cy="-30" r="2.6"/><circle cx="21" cy="-30" r="2.6"/><circle cx="26" cy="-26" r="2.6"/></g>' : ''}
    ${perfect ? '<text x="16" y="-70" font-family="Chalkboard, Comic Sans MS, sans-serif" font-size="22" font-weight="700" fill="#d8322c" text-anchor="middle">100</text><ellipse cx="16" cy="-77" rx="19" ry="13" fill="none" stroke="#d8322c" stroke-width="2.5"/>' : ''}</g>`;
}
// A pencil, centred, lying crosswise (as the dog carries it).
// A torn scrap of a homework sheet (in the dog's mouth corner after the bites), centred.
const scrapSVG = `<g filter="url(#paper)"><path d="M-9,-7 L8,-9 L10,-2 L6,1 L9,7 L-7,8 L-10,2 Z" fill="#fbfaf4"/><path d="M-6,-2 q4,-3 8,0 t6,0" fill="none" stroke="#3a4f86" stroke-width="1.6"/></g>`;
const pencilSVG = `<g filter="url(#paper)"><rect x="-34" y="-5" width="60" height="10" fill="#f2c230"/><path d="M26,-5 L40,0 L26,5 Z" fill="#e8c9a0"/><path d="M36,-1.5 L40,0 L36,1.5 Z" fill="#3a3430"/><rect x="-42" y="-5" width="9" height="10" rx="2" fill="#e88a9a"/></g>`;

/* The front of the classroom, seen by the pupils: the teacher behind her desk on the right of the blackboard, only
   her top half over it. teacherSet(p, holds) → { cam, t }; TEACHER is where she stands (pose her there every frame),
   TEACH_CU her close-up. The dog on Me and Bo's desk stands at DOG_DESK (in classroom(), facing either of them). */
const TEACHER = { x: 1220, y: 800, s: 1 };
const TEACH_CU = { x: 1200, y: 470, z: 2.3 };
function teacherSet(p, holds = {}) {
  const cam = paperCam(p, 'classFront', {}, { after: 'wall' });
  return { cam, t: teacherPuppet(cam.stage, { holds }) };
}
// Facing Me (dir -1) its body sits in front of Bo's chest and its head in the gap between the boys' faces; facing Bo,
// mirror it (x 1600 - 860).
const DOG_DESK = { x: 860, y: 724, s: .7 };
// Late afternoon light for the detention: a warm wash over the whole frame (draw it last, over the camera).
const dusk = p => { const g = mk('g', { 'pointer-events': 'none' }, p);
  mk('rect', { width: 1600, height: 900, fill: '#c2501e', opacity: .2, style: 'mix-blend-mode: multiply' }, g);
  mk('rect', { width: 1600, height: 900, fill: '#ffa040', opacity: .18 }, g); return g; };

/* ---------- sound effects ----------
   sfx(beat, at, name, vol): play audio/sfx/<name>.mp3 when the clock of beat `beat` passes `at` in normal playback
   (seeking past it does not fire it). Pausing holds them; a seek stops them. */
const SFX = [], sfxOn = [];
const SFX_BED = {};   // file name -> length in s, for long ambience called once (a seek into the middle starts it part-way)
const sfx = (beat, at, name, vol = 1, bed = SFX_BED[name] || 0) => SFX.push({ beat, at, name, vol, bed });
let sfxLast = { i: -1, t: 0 };
function sfxTick() {
  const id = BEATS[P.i]?.id, on = P.started && P.playing && !P.waiting && !P.done;
  // the clock ran on (or stood still, paused) in the same beat; anything else is a seek, a replay or a new scene,
  // and what was playing belongs to another moment
  const same = sfxLast.i === P.i && P.t >= sfxLast.t && P.t - Math.max(0, sfxLast.t) < .5;
  if (!same) while (sfxOn.length) sfxOn.pop().pause();
  // a scene that has just begun (or begins again) fires its effects from 0 on, those at 0 too; a seek fires nothing it skipped
  const from = same ? sfxLast.t : P.t < .25 ? -1 : P.t;
  const seeked = !same || sfxLast.pend;   // pend: a seek that happened while paused, now playing
  if (on)
    for (const e of SFX) if (e.beat === id && (e.at > from && e.at <= P.t || seeked && e.bed && e.at < P.t && P.t < e.at + e.bed)) {
      const a = new Audio(`audio/sfx/${e.name}.mp3`); a.volume = .5 * e.vol * +(document.getElementById('volume')?.value ?? 1);   // effects sit under the voices
      a.playbackRate = P.rate || 1;
      a.play().catch(() => {}); sfxOn.push(a); a.onended = () => sfxOn.splice(sfxOn.indexOf(a), 1);
      if (e.at <= from || e.at > P.t) a.addEventListener('loadedmetadata', () => { a.currentTime = P.t - e.at; }, { once: true });   // a long bed joined mid-way
    }
  // a pause holds them, play resumes; one that has just ended (still listed until its onended runs) is not replayed
  for (const a of sfxOn) { a.playbackRate = P.rate || 1; if (on === a.paused && !a.ended) on ? a.play().catch(() => {}) : a.pause(); }
  sfxLast = { i: P.i, t: on ? P.t : from, pend: !on && (!same || !!sfxLast.pend) };
  // the music follows the playback speed, so the chapter's bgmTick need not re-seek it at 0.75× or 1.5× (BGM is the
  // chapter's own list, when it has one)
  if (typeof BGM !== 'undefined') for (const m of BGM) if (m.a.playbackRate !== (P.rate || 1)) m.a.playbackRate = P.rate || 1;
  requestAnimationFrame(sfxTick);
}
addEventListener('load', () => requestAnimationFrame(sfxTick));   // after the chapter's own scripts define BEATS
