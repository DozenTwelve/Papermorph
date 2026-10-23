/* shared.js — what every scene of the book uses: timing helpers, painted props, and the sound effects. Put the book's
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

/* ---------- sound effects ----------
   sfx(beat, at, name, vol): play audio/sfx/<name>.mp3 (SKILL/scripts/sfx.py) when the clock of beat `beat` passes `at`
   in normal playback (seeking past it does not fire it). Pausing holds them; a seek stops them. They play at half volume under the voices. */
const SFX = [], sfxOn = [];
const SFX_BED = {};   // file name -> length in s, for long ambience called once (a seek into the middle starts it part-way)
// A scene function runs again at every seek, replay and Home: the same effect (beat, time, name) is listed once.
const sfx = (beat, at, name, vol = 1, bed = SFX_BED[name] || 0) => {
  const e = SFX.find(x => x.beat === beat && x.at === at && x.name === name);
  if (e) Object.assign(e, { vol, bed }); else SFX.push({ beat, at, name, vol, bed });
};
const sfxVolume = () => Math.min(1, Math.max(0, +(document.getElementById('volume')?.value ?? 1)));
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
      const a = new Audio(`audio/sfx/${e.name}.mp3`);
      a._vol = Math.min(1, Math.max(0, .5 * e.vol));   // effects sit under the voices (vol 2 is full volume); the slider is applied every tick below
      a.volume = a._vol * sfxVolume();
      a.playbackRate = P.rate || 1;
      a.play().catch(() => {}); sfxOn.push(a); a.onended = () => sfxOn.splice(sfxOn.indexOf(a), 1);
      if (e.at <= from || e.at > P.t) a.addEventListener('loadedmetadata', () => { a.currentTime = P.t - e.at; }, { once: true });   // a long bed joined mid-way
    }
  const v = sfxVolume();
  for (const a of sfxOn) { a.playbackRate = P.rate || 1; if (a.volume !== a._vol * v) a.volume = a._vol * v;   // the slider reaches effects and beds already playing
    if (on === a.paused && !a.ended) on ? a.play().catch(() => {}) : a.pause(); }   // a pause holds them, play resumes
  // the music follows the playback speed too (BGM is the chapter's own list, when it has one)
  if (typeof BGM !== 'undefined') for (const m of BGM) if (m.a.playbackRate !== (P.rate || 1)) m.a.playbackRate = P.rate || 1;
  sfxLast = { i: P.i, t: on ? P.t : from, pend: !on && (!same || !!sfxLast.pend) };
  requestAnimationFrame(sfxTick);
}
addEventListener('load', () => requestAnimationFrame(sfxTick));   // after the chapter's own scripts define BEATS
