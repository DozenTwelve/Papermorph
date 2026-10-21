/* dogs.js — episode 6's kit ("Four Dogs"): the four dogs (side-on, on lib/cast.js's dogPuppet: the American, the
   Polish, the Soviet and the Chinese dog), the cardboard box the Chinese dog hides in, the kitchen back door with the
   cook's shadow chopping behind its frosted window, the steak and the bowl, the thought bubble; the alley and the three
   "back home" cutaways (USA, Poland, USSR), each built by one function so every shot of a place stages it the same way;
   the title card. The series helpers are in ../lib/shared.js, the puppets' base in ../lib/cast.js. */
'use strict';

/* ---------- the four dogs ----------
   dogPuppet pose keys (cast.js): x, y, s, dir (1 faces screen-right, -1 left), headR (+ up), jaw (0…1), tail, wag, ear
   (degrees; the pricked ears lie flat at EAR_FLAT, -100), shut, lids, eyeX (-1 back … 1 forward), sit (0…1), lie, walk, bob,
   tongue, sniff, hold ('bowl'), paw (near front paw raised, degrees), swell (0…1, a big breath in).
   Build them with these; give each its own size: US.s, PL.s, SU.s, CN.s. */
const PAPER = b => `<g filter="url(#paper)">${b}</g>`;
// The American dog: a big, well-fed golden retriever in a Stars-and-Stripes bandana, a gold tag on a navy collar.
const US_BREED = { coat: '#dc9548', far: '#bd7a36', dark: '#a8622a', muzzle: '#f0c890', collar: '#2f4a8a', torso: [90, 46], spot: '',
  neck: '<path d="M50,-110 L92,-100 L74,-62 Z" fill="#c8323a"/><path d="M60,-103 L86,-97 M64,-92 L82,-88 M68,-80 L78,-77" stroke="#fbfbf6" stroke-width="4"/>' +
    '<path d="M50,-110 L70,-106 L62,-90 Z" fill="#2f4a8a"/><circle cx="58" cy="-102" r="2" fill="#fff"/><circle cx="64" cy="-98" r="1.6" fill="#fff"/>' +
    '<circle cx="84" cy="-92" r="7" fill="#efc84a" stroke="#a8802a" stroke-width="2"/>',
  // the inside of his mouth: a barking mouth shows a mouth (turns half as far as the jaw)
  mouthIn: '<path d="M100,-102 L148,-114 Q158,-104 149,-92 Z" fill="#5a1418"/><ellipse cx="134" cy="-100" rx="10" ry="4" fill="#d9606a"/>' };
// The Polish dog: a skinny grey mutt, ribs showing, folded ear tips, a thin tail; carries his empty bowl in his mouth.
const PL_BREED = { coat: '#a8a090', far: '#8c8476', dark: '#6f675a', muzzle: '#cdc6b6', collar: 'none', torso: [72, 29],
  spot: '<ellipse cx="-46" cy="-92" rx="18" ry="11" fill="#7d7568"/>',
  body: '<path d="M-4,-108 q9,14 3,30 M12,-110 q9,14 3,30 M28,-109 q9,14 3,29" stroke="#7d7568" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
  ear: 'M-16,6 C-16,-16 -6,-36 6,-44 C18,-46 26,-36 30,-24 C22,-30 16,-28 16,-20 C16,-8 18,0 16,6 Z',
  tail: 'M0,0 Q-30,-10 -44,-50 Q-37,-52 -31,-36 Q-20,-13 6,-6 Z' };
// The Soviet dog: a big dark shaggy shepherd in an ushanka with a red star, a leather basket muzzle (he has never
// barked: keep his jaw at most .2), the hat's brim low over his eye (stern).
const SU_BREED = { coat: '#5f5b58', far: '#47433f', dark: '#3b3734', muzzle: '#7d7873', collar: 'none', torso: [88, 44], spot: '', ear: 'M0,0 Z',
  body: '<path d="M-74,-116 l9,-14 l8,12 l10,-16 l8,14 l10,-14 l8,14 l10,-14 l8,14 l10,-12 l8,14 l10,-10" fill="none" stroke="#4a4643" stroke-width="6" stroke-linejoin="round"/>',
  hat: PAPER('<path d="M58,-150 Q50,-122 60,-102 L76,-106 Q70,-126 74,-148 Z" fill="#7c6650"/><path d="M56,-156 C54,-208 134,-208 132,-156 Z" fill="#6b5640"/>' +
    '<path d="M50,-158 Q94,-174 138,-158 L136,-147 Q94,-161 52,-147 Z" fill="#8f7a5c"/><path transform="translate(126,-168) scale(.62)" d="M0,-12 l3.5,8 l9,1 l-7,6 l2,9 l-7.5,-5 l-7.5,5 l2,-9 l-7,-6 l9,-1 Z" fill="#d83a2f"/>') +
    '<g fill="none" stroke="#5a3a20" stroke-width="4"><rect x="104" y="-134" width="56" height="42" rx="15"/><path d="M118,-134 v42 M133,-134 v42 M147,-132 v38" stroke-width="3"/><path d="M104,-122 L66,-140"/></g>' };
// The Chinese dog: a small cream-white village dog with dark tan ears and a tan saddle (nothing like the American's gold),
// pricked ears (flat when scared: ear EAR_FLAT), a worried brow (always: he knows), a curled tail. hold 'shh': a paw
// raised in front of his nose ("Shh.").
const CN_COL = { coat: '#f1e8d6', far: '#d6cab2', dark: '#b8783c', muzzle: '#fbf6ea' };
const CN_BREED = { ...CN_COL, collar: 'none', torso: [70, 34], ear: DOG_EARS.prick,
  spot: '<path d="M-58,-112 Q-20,-128 22,-116 Q8,-100 -24,-100 Q-48,-100 -58,-112 Z" fill="#c98f4e"/>',
  tail: 'M0,0 Q-30,-6 -40,-34 Q-46,-58 -26,-62 Q-10,-62 -14,-46 Q-26,-46 -24,-34 Q-18,-14 8,-8 Z',
  hat: '<path d="M88,-166 Q100,-164 116,-173" fill="none" stroke="#2a2220" stroke-width="4.5" stroke-linecap="round"/><path d="M122,-104 Q110,-103 100,-95" fill="none" stroke="#2a2220" stroke-width="3" stroke-linecap="round"/>' };   // a worried brow; the mouth's corner turned down
const EAR_FLAT = -100;
// The floppy ears (the American, the queue): + swings the ear back (EAR_BACK, for a bark or a fright); a negative ear
// swings it forward over the eye — don't.
const EAR_BACK = 40;
const shhPaw = PAPER(`<path d="M-4,70 C-6,30 2,-8 10,-26 Q18,-40 30,-31 Q35,-22 27,-8 C20,20 16,46 16,70 Z" fill="#e6dac2" stroke="#8a7656" stroke-width="2.5"/><path d="M15,-32 q5,7 2,14 M23,-33 q5,7 2,14" stroke="#8a7656" stroke-width="2.5" fill="none"/><ellipse cx="19" cy="-12" rx="6" ry="4" fill="#c98f8a"/>`);
// a bowl carried by its rim in the mouth (hold: 'bowl'); the steak (prop pieces)
const bowlHeld = artSVG('bowl', -34, -27, 68, 38), steakSVG = artSVG('steak', -70, -48, 140, 95), bowlSVG = artSVG('bowl', -45, -26, 90, 50);
// A shut eye reads as closed: a lash curve across it (a lid alone left an empty ring). Every dog of this episode.
function dogLash(pup) {
  const head = pup.g.querySelector('[data-p="head"]'), lash = mk('path', { d: 'M86,-143 Q100,-133 114,-143', fill: 'none', stroke: SP_INK, 'stroke-width': 4, 'stroke-linecap': 'round' }, head);
  const base = pup.pose; pup.pose = (o, f) => { base(o, f); vis(lash, !!o.shut); };
  return pup;
}
// the steak riding on the American's head (hold: 'steak'): it dips and bounces with his head
const steakOnHead = `<g transform="translate(-44,-80) rotate(-6)">${artSVG('steak', -62, -40, 124, 84)}</g>`;
const usDog = p => dogLash(dogPuppet(p, { breed: US_BREED, holds: { steak: steakOnHead } })), plDog = p => dogLash(dogPuppet(p, { breed: PL_BREED, holds: { bowl: bowlHeld } }));
const suDog = p => dogLash(dogPuppet(p, { breed: SU_BREED })), cnDog = p => dogLash(dogPuppet(p, { breed: CN_BREED, holds: { shh: shhPaw } }));
// The Polish dog licking his empty bowl on the ground (scene 3's opening): lying down, head bent into it, tongue out.
// Put the bowl at BOWL_AT (his ALLEY.pl). Lick strokes: jaw .25 ↔ .4 and headR −32 ↔ −26 on twos, with 'scrape'.
const PL_LICK = { lie: 'awake', headR: -30, tongue: true, jaw: .3 };
// The bowl on the ground in front of any dog's front paws (a pose): [x, y] for the queue's bowls.
const bowlAhead = o => [(o.x || 0) + (o.dir ?? 1) * (o.s ?? 1) * 150, o.y || 0];
const US = { s: 1.15 }, PL = { s: 1 }, SU = { s: 1.3 }, CN = { s: .8 };

// A dog's mouth from a lip-sync shape (lips(...) of shared.js gives the shape): how far the jaw opens.
const DOG_JAW = { X: 0, A: 0, B: .25, C: .45, D: .7, E: .55, F: .3, G: .2, H: .35 };
// k scales it: the Chinese dog murmurs (k .4), the Soviet dog speaks through his muzzle (k .25).
const dogJaw = (m, k = 1) => k * (DOG_JAW[m] ?? .3);
// A bark's jaw: wide open 0.07 s before each bark's sound starts (the sound comes out of an open mouth), held `hold` s,
// shutting over 0.1 s. barkJaw(q, [t1, t2, …]) → 0…1; add headR/bob/ear yourself.
const barkJaw = (q, times, hold = .22) => Math.max(0, ...times.map(t => q < t - .07 || q > t + hold + .1 ? 0 : q < t ? span(q, t - .07, t) : q < t + hold ? 1 : 1 - span(q, t + hold, t + hold + .1)));
// Where a dog's head (the eye) is in the world for a pose: framings follow it.
function dogHead(o) {
  const s = o.s ?? 1, dir = o.dir ?? 1, S = o.sit === true ? 1 : +o.sit || 0, L = o.lie === true || o.lie === 'awake' ? 1 : +o.lie || 0;
  const r = -16 * S * Math.PI / 180, dx = 100 + 50, dy = -142 + 56;
  const lx = -50 + dx * Math.cos(r) - dy * Math.sin(r), ly = -56 + dx * Math.sin(r) + dy * Math.cos(r) + (o.bob || 0) + 50 * L;
  return [(o.x || 0) + dir * s * lx, (o.y || 0) + s * ly];
}
// A close-up on a dog's head (z 3.6 by default), the head a little above the centre, a little room in front of the snout.
const DOG_CU = (o, z = 3.6) => { const [x, y] = dogHead(o); return { x: x + (o.dir ?? 1) * 24 * (o.s ?? 1), y: y + 14 * (o.s ?? 1), z }; };

/* ---------- the cardboard box ----------
   boxProp(p) → { back, front, eyes, clip, pose }. Draw order: back, the dog inside (clipped by `clip`: nothing of him
   shows below the box or through its side, only above the rim or behind the front), front, (the alley's shadow), eyes —
   the alley builds it so. pose(o, f): x, y (front face's bottom middle), s, flaps (0 a loose V … 1 pushed wide open),
   eyes (0 none, 1 the Chinese dog's pair in the hand-hole, 4 all four dogs: US, PL, SU, CN from left to right), eyeX
   (-1…1), lids ([…] per pair, or one number), shut ([…] per pair, or one bool), stuffed (the ushanka pokes out of the
   top, a golden tail out of the side; tail: its angle), bulge (0…1, 1.2 at most), shake (0…1, it trembles), mouth
   (0…1: the American's mouth opens wide in the hole, teeth and tongue), clamp (0…1: three paws — grey, dark, cream —
   reach in from inside the hole and shut it; the mouth is squashed and his eyes squeeze), legs (true: sixteen legs
   under it in four dogs' colours, the box lifted), walk (with legs: q; they step on twos, alternately), sink (0…1: the
   eyes sink below the hole's lower edge and are gone; 1 = gone; also per pair as an array), light (0…1: the light
   from the door crack lies across the box's front, brightest on the right), hatDy (px: the ushanka bounces — negative
   up). shake 1 = a hard tremble (±5 px on twos). */
const BOX_EYES = { 1: [[0, -84, 7.5]], 4: [[-40, -86, 9], [-10, -80, 7], [20, -88, 8], [46, -82, 6]] };
const BOX_SLOT = { x: -66, y: -98, w: 132, h: 28 };
function boxProp(p) {
  const back = mk('g', {}, p), front = mk('g', {}, p), eyes = mk('g', {}, p);
  const card = '#c0915a', side = '#9a6c3c', dark = '#21160c', id = 'bxc' + (++spClip);
  back.innerHTML = `<g data-p="bk">${PAPER(`<path d="M90,0 L118,-18 L118,-148 L90,-130 Z" fill="${side}"/><path d="M-90,-130 L90,-130 L118,-148 L-62,-148 Z" fill="${dark}"/>
      <path d="M-62,-148 L118,-148 L110,-196 L-56,-190 Z" fill="#b08250"/>`)}
    <g data-p="tail">${PAPER(`<path d="M0,0 Q30,-10 46,-46 Q38,-50 32,-34 Q22,-14 0,-10 Z" fill="${US_BREED.coat}"/>`)}</g>
    <g data-p="hat">${PAPER('<path d="M-12,-130 C-14,-178 66,-178 64,-130 Z" fill="#6b5640"/><path d="M-18,-138 Q26,-150 70,-138 L68,-128 Q26,-140 -16,-128 Z" fill="#8f7a5c"/><path transform="translate(26,-158) scale(.7)" d="M0,-12 l3.5,8 l9,1 l-7,6 l2,9 l-7.5,-5 l-7.5,5 l2,-9 l-7,-6 l9,-1 Z" fill="#d83a2f"/>')}</g></g>`;
  const legCols = [US_BREED.coat, PL_BREED.coat, SU_BREED.coat, CN_COL.coat];
  front.innerHTML = `<g data-p="legs">${Array.from({ length: 16 }, (_, i) => `<g data-p="l${i}">${PAPER(`<rect x="-5" y="-4" width="10" height="38" rx="4" fill="${legCols[i >> 2]}"/><ellipse cx="2" cy="33" rx="7" ry="4" fill="#3a2a1c"/>`)}</g>`).join('')}</g>
    <g data-p="fr">${PAPER(`<rect x="-90" y="-130" width="180" height="130" fill="${card}"/><path d="M-90,-110 H90" stroke="#d8b47a" stroke-width="10" opacity=".7"/>
      <path d="M-60,-98 H60 Q66,-98 66,-90 V-78 Q66,-70 60,-70 H-60 Q-66,-70 -66,-78 V-90 Q-66,-98 -60,-98 Z" fill="${dark}"/>`)}
      <g data-p="flapL">${PAPER(`<path d="M0,0 L-72,-46 L-62,-60 L10,-8 Z" fill="#cc9c64"/>`)}</g>
      <g data-p="flapR">${PAPER(`<path d="M0,0 L72,-50 L80,-36 L-6,8 Z" fill="#b8884e"/>`)}</g></g>`;
  // the clip for the dog inside, in world coordinates (updated with the box): above the rim, or behind the front face
  const clip = mk('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, p), cr = [0, 1, 2].map(() => mk('rect', {}, clip));
  const sid0 = id + 'e', ec = mk('clipPath', { id: sid0 }, eyes); mk('rect', { x: BOX_SLOT.x, y: BOX_SLOT.y, width: BOX_SLOT.w, height: BOX_SLOT.h, rx: 7 }, ec);
  const eyeG = mk('g', { 'clip-path': `url(#${sid0})` }, eyes), litG = mk('g', {}, front);
  litG.innerHTML = `<defs><linearGradient id="${id}l"><stop offset="0" stop-color="#ffe08a" stop-opacity=".1"/><stop offset=".5" stop-color="#ffe08a" stop-opacity=".6"/><stop offset="1" stop-color="#fff4c4" stop-opacity=".95"/></linearGradient></defs>
    <path d="M-90,-130 H90 V0 H-90 Z M90,-130 L118,-148 V-18 L90,0 Z" fill="url(#${id}l)" style="mix-blend-mode:screen"/>`;
  const pairs = BOX_EYES[4].map(() => { const g = mk('g', {}, eyeG); g.innerHTML = [-1, 1].map(k => `<g><ellipse rx="1" ry="1" fill="#fbf8ee" class="w"/><circle r="1" fill="#141010" class="pu"/>
      <clipPath><ellipse rx="1" ry="1"/></clipPath><rect class="lid" x="-20" y="-40" width="40" height="40" fill="#2e2014"/></g>`).join(''); return g; });
  // the American's mouth and the three paws, inside the hand-hole (clipped to it: they come from within)
  const sid = id + 's', gag = mk('g', { 'clip-path': `url(#${sid})` }, eyes);
  const sc = mk('clipPath', { id: sid }, eyes); mk('rect', { x: BOX_SLOT.x, y: BOX_SLOT.y, width: BOX_SLOT.w, height: BOX_SLOT.h, rx: 7 }, sc);
  const mouth = mk('g', {}, gag);
  mouth.innerHTML = '<ellipse rx="15" ry="11" fill="#5a1418"/><path d="M-12,-7 Q0,-11 12,-7 L11,-3 Q0,-6 -11,-3 Z" fill="#fbf8ee"/><ellipse cy="6" rx="9" ry="5" fill="#d9606a"/>';
  const paws = [PL_BREED.coat, SU_BREED.coat, CN_COL.coat].map(c => prop(gag, PAPER(`<rect x="-15" y="-11" width="30" height="22" rx="11" fill="${c}"/>`)));
  bakeAll(back); bakeAll(front);
  const P = { ...pieces(back), ...pieces(front) };
  const per = (v, i) => Array.isArray(v) ? v[i] : v;
  return { back, front, eyes, clip: id, pose(o, f) {
    const s = o.s ?? 1, lift = o.legs ? 34 : 0, sh = (o.shake || 0) * 5 * jit(f >> 1, 41), b = o.bulge || 0, x = (o.x || 0) + sh, y = (o.y || 0) + (o.shake || 0) * 2 * jit(f >> 1, 42);
    const sx = s * (1 + .08 * b), sy = s * (1 + .05 * b);
    const T = `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
    tf(back, T); tf(front, T); tf(eyes, T);
    [[-300, -600, 390, 470], [90, -600, 300, 450], [-90, -130, 180, 130]].forEach(([rx, ry, w, h], i) => {
      cr[i].setAttribute('x', (x + sx * rx).toFixed(1)); cr[i].setAttribute('y', (y + sy * (ry - lift)).toFixed(1));
      cr[i].setAttribute('width', (sx * w).toFixed(1)); cr[i].setAttribute('height', (sy * h).toFixed(1)); });
    tf(P.bk, `translate(0,${-lift})`); tf(P.fr, `translate(0,${-lift})`);
    vis(P.legs, !!o.legs);
    const k = onTwos(o.walk || 0);
    for (let i = 0; i < 16; i++) tf(P['l' + i], `translate(${(-82 + i * 11).toFixed(0)},${-lift}) rotate(${o.legs && o.walk != null ? (i % 2 ? 16 : -16) * k : 0})`);
    const fl = o.flaps ?? 0;
    tf(P.flapL, `translate(-90,-130) rotate(${(-10 - 40 * fl + jit(f >> 1, 43) * 1.5).toFixed(1)})`);
    tf(P.flapR, `translate(90,-130) rotate(${(8 + 40 * fl + jit(f >> 1, 44) * 1.5).toFixed(1)})`);
    vis(P.hat, !!o.stuffed); vis(P.tail, !!o.stuffed); tf(P.hat, `translate(0,${(o.hatDy || 0).toFixed(1)})`);
    vis(litG, (o.light || 0) > .01); litG.setAttribute('opacity', (o.light || 0).toFixed(2)); tf(litG, `translate(0,${-lift})`);
    tf(P.tail, `translate(116,-60) rotate(${(o.tail || 0).toFixed(1)})`);
    const n = o.eyes || 0, E = BOX_EYES[n] || [], m = n === 4 ? (o.mouth || 0) : 0, c = n === 4 ? (o.clamp || 0) : 0;
    pairs.forEach((g, i) => {
      vis(g, i < E.length); if (i >= E.length) return;
      const [ex, ey, r] = E[i], shut = per(o.shut, i);
      let lids = shut ? 1 : (per(o.lids, i) || 0); if (i === 0) lids = Math.max(lids, .55 * c);   // squeezed shut by the paws
      tf(g, `translate(${ex},${(ey - lift - (i === 0 ? 4 * m : 0) + 24 * (per(o.sink, i) || 0)).toFixed(1)})`);
      g.querySelectorAll(':scope > g').forEach((e, k) => { tf(e, `translate(${((2 * k - 1) * r * 1.02).toFixed(1)},0)`);
        e.querySelectorAll('ellipse').forEach(el => { el.setAttribute('rx', r * .8); el.setAttribute('ry', r); });
        const pu = e.querySelector('.pu'); pu.setAttribute('r', r * .42); pu.setAttribute('cx', ((o.eyeX || 0) * r * .4).toFixed(1));
        const l = e.querySelector('.lid'); l.setAttribute('y', (-r - 2 * r + 2 * r * lids).toFixed(1)); l.setAttribute('height', 2 * r);
        if (!e._c) { const cid = 'bxe' + (++spClip); e.querySelector('clipPath').id = cid; l.setAttribute('clip-path', `url(#${cid})`); e._c = 1; }
      });
    });
    tf(gag, `translate(0,${-lift})`);
    { const cl = ec.firstChild; cl.setAttribute('y', BOX_SLOT.y - lift); }
    vis(mouth, m > .02); tf(mouth, `translate(-40,${(-76 + 2 * c).toFixed(1)}) scale(${(.6 + .4 * m).toFixed(3)},${Math.max(.08, m * (1 - .9 * c)).toFixed(3)})`);
    // the paws: grey from the right, dark from below, cream from the left, one after the other, meeting on the mouth
    [[60, 6], [0, 26], [-40, 4]].forEach(([dx, dy], i) => { const u = span(c, i * .2, .4 + i * .2); vis(paws[i], c > .02);
      tf(paws[i], `translate(${(-40 + (i - 1) * 16 + dx * (1 - u)).toFixed(1)},${(-77 + (i === 1 ? 6 : 0) + dy * (1 - u)).toFixed(1)}) rotate(${(i - 1) * 20})`); });
  } };
}

/* ---------- the kitchen: chopping, the cook's shadow, the door ----------
   Chop runs on a scene's clock: [[from, to, every = .36], …]. At the top level of a scene file call
   chopSfx('sceneN', RUNS, { mute, quiet }) (one 'chop' per hit, loud and soft alternately, a little uneven like a real
   cook; mute: [[a, b], …] spans with no chopping heard — the cutaways, which are somewhere else; quiet: [[a, b, vol]]
   spans played softer; hits in the last 0.15 s of the scene are dropped, so two scenes never double a chop at the
   join). In the scene, pose the cook with cleaverAt(q, RUNS) — the same runs — so the cleaver lands on every hit and
   rests raised (or at `rest`) between runs. */
const chopHits = runs => runs.flatMap(([a, b, e = .36]) => { const o = []; let k = 0; for (let t = a; t < b - 1e-6; t += e, k++) o.push(+(t + (k ? .025 * jit(k + Math.round(a * 10), 77) : 0)).toFixed(3)); return o; });
function chopSfx(beat, runs, { mute = [], quiet = [], vol = .5 } = {}) {
  const n = beat.replace('scene', ''), pre = Function(`return typeof PRE${n} === 'undefined' ? 0 : PRE${n}`)();
  const end = pre + (TIMINGS[beat]?.dur ?? 1e9) - .15;
  chopHits(runs).forEach((t, i) => {
    if (t >= end || mute.some(([a, b]) => t >= a && t < b)) return;
    const qv = quiet.find(([a, b]) => t >= a && t < b);
    sfx(beat, t, 'chop', (qv ? qv[2] : vol) * (i % 2 ? .8 : 1));
  });
}
// the cleaver 0 (down on the board) … 1 (raised); `rest` between runs (1: held up, frozen mid-chop)
function cleaverAt(q, runs, rest = 1) {
  for (const run of runs) {
    if (q < run[0] - .25 || q >= run[1] + .3) continue;
    const h = chopHits([run]), i = h.findIndex(t => t > q);
    if (i === 0) return 1;                                     // about to start
    const t = q - h[(i < 0 ? h.length : i) - 1];
    if (i < 0) return t < .07 ? 0 : span(t, .07, .2);          // the last stroke lifts and stays up
    return t < .07 ? 0 : t < .2 ? span(t, .07, .2) : 1 - span(q, h[i] - .1, h[i]);
  }
  return rest;
}
// The frosted window of the kitchen door, in world px.
const WIN = { x: 1282, y: 405, w: 98, h: 140 };
function kitchen(p) {
  const g = mk('g', {}, p), id = 'kwin' + (++spClip);
  g.innerHTML = `<clipPath id="${id}"><rect x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}"/></clipPath>
    <g clip-path="url(#${id})" opacity=".66" style="mix-blend-mode:multiply"><g data-p="cook" fill="#4a2c12">
      <path d="M1290,560 Q1292,512 1330,506 Q1372,508 1378,560 Z"/><rect x="1328" y="486" width="18" height="24"/>
      <path d="M1316,446 Q1306,414 1324,410 Q1332,392 1348,404 Q1368,404 1362,446 Z"/>
      <circle cx="1338" cy="466" r="22"/><g data-p="nose"><path d="M1318,460 L1306,470 L1318,476 Z"/><path d="M1322,482 h8" stroke="#4a2c12" stroke-width="3"/></g>
      <g data-p="arm"><path d="M0,-9 L-46,-6 L-46,6 L0,9 Z"/><circle cx="-48" cy="0" r="9"/><g transform="translate(-50,0)"><path d="M-4,-4 V-20 M4,-4 V-20" stroke="#4a2c12" stroke-width="5"/><path d="M-20,-52 H12 V-20 H-20 Z"/></g></g>
      <g data-p="armF"><path d="M1352,530 L1370,486 L1384,492 L1368,534 Z"/><circle cx="1378" cy="484" r="9"/><rect x="1374" y="454" width="9" height="28" rx="2"/>
        <path d="M1364,412 H1400 V456 H1364 Z M1371,419 a4,4 0 1 0 8,0 a4,4 0 1 0 -8,0 Z" fill-rule="evenodd"/></g>
    </g></g>
    <g data-p="crack"><path data-p="slit" fill="#ffe7a0"/><path data-p="wedge" fill="#ffe08a" opacity=".38" style="mix-blend-mode:screen"/></g>`;
  const P = pieces(g);
  return { g,
    // cook(o): arm 0…1 (cleaverAt), turn 0…1 (0 in profile over the board, 1 facing the door, nearer and bigger),
    // show (false: the window is empty — he has left it)
    cook(o) {
      vis(P.cook, o.show !== false); const t = o.turn || 0;
      tf(P.cook, `translate(${(-16 * t).toFixed(1)},${(-4 * t).toFixed(1)})`);   // turned: a step nearer the door; the broad blade fits the window
      vis(P.nose, t < .5); vis(P.arm, t < .7); vis(P.armF, t >= .7);   // turned to the door, the cleaver is held up beside his head
      tf(P.arm, `translate(1318,520) rotate(${(-30 + 75 * (o.arm ?? 1)).toFixed(1)})`);
    },
    // crack(u): the door opens a crack (0 shut … .6 a door handle's width … 1): a bright slit at its handle edge and a
    // wedge of light across the cobbles that creeps toward the box and reaches it from u .9 (then light the box itself
    // with the box's `light`)
    crack(u) {
      vis(P.crack, u > .01); if (u <= .01) return;
      const w = 6 + 44 * u;   // at .6 about a door handle's width
      P.slit.setAttribute('d', `M${1424 - w},357 H1424 V756 H${1424 - w} Z`);
      // the wedge of light lies across the cobbles toward the dark corner; at u ≥ .9 it reaches the box (x 220)
      const far = 1300 - 1150 * u;
      P.wedge.setAttribute('d', `M${1424 - w},758 L1424,762 L${(far + 260 * u).toFixed(0)},905 L${far.toFixed(0)},905 L${(far - 40).toFixed(0)},${(840 - 20 * u).toFixed(0)} Z`);
      P.wedge.setAttribute('opacity', (.5 * Math.min(1, u * 2)).toFixed(2));
    } };
}

/* ---------- the alley (scenes 1–4) ----------
   Evening, a brick back wall. Left: the dark corner with the dustbins and the box (ALLEY.box), where the Chinese dog
   hides; middle: the lamp; right: the kitchen door (x 1238…1424, window WIN), the vent with steam above it, crates. The
   three talk in the lamplight: the American at ALLEY.us facing right (dir 1), the Polish dog at ALLEY.pl and the Soviet
   dog at ALLEY.su facing left (dir -1), sitting. alleySet(p) → { cam, us, pl, su, cn, box, bowl, kit, steam, shade }.
   Call steam(q) every frame; shade(k) sets the dark corner (1 as built … 0 none; lower it in close-ups of the box).
   bowl: the Polish dog's empty bowl, on the ground in front of him in every alley shot (he guards it; he never
   carries it): vis it and a.placeBowl() — at BOWL_AT; after he knocks it in scene 3 it lies at BOWL_KNOCKED
   (a.placeBowl(0, BOWL_KNOCKED.rot, BOWL_KNOCKED.dx)) for the rest of scene 3 and all of scene 4.
   The Chinese dog in the box: while only his eyes show (box eyes: 1) keep the puppet hidden (vis(cn.g, false)); to look
   out he sits up behind the box's front at ALLEY.cnUp (sit 1, dir 1): rise from cnUp.y + 130 to cnUp.y over ~0.4 s
   with flaps going ~.6 (the box clips him: nothing shows below it or through its side). "Shh.": hold 'shh' (his paw
   up in front of his nose). Scared: ear EAR_FLAT, lids .25, his jaw small (dogJaw(m, .4)).
   Framings: AL_WIDE, AL_TRIO, AL_BOX (only the box and the bins — no other dog), AL_BOX_WIDE (the box left of centre,
   room on the right for dogs diving in), AL_SLOT (the hand-hole), AL_GAG (the American's mouth in the hole, the paws),
   AL_WINDOW, AL_DOOR, AL_US_PL, AL_PL_SU, AL_BOWL (the bowl at the Polish dog's front feet), AL_TAG (low, the box
   walking off); DOG_CU(pose) for any dog. */
const ALLEY = { ground: 800, us: 600, pl: 990, su: 1150, suY: 772, box: 220, cnUp: { x: 214, y: 742 } };
const BOWL_AT = { x: ALLEY.pl - 138, y: ALLEY.ground - 18 }, BOWL_KNOCKED = { dx: -70, rot: -6 };
const AL_WIDE = { x: 800, y: 450, z: 1 }, AL_TRIO = { x: 880, y: 610, z: 1.7 }, AL_BOX = { x: 178, y: 700, z: 3.4 }, AL_BOX_WIDE = { x: 380, y: 640, z: 2.2 },
  AL_SLOT = { x: 220, y: 716, z: 6.5 }, AL_GAG = { x: 212, y: 722, z: 9 }, AL_WINDOW = { x: 1331, y: 478, z: 4.6 }, AL_DOOR = { x: 1260, y: 560, z: 2.15 },
  AL_US_PL = { x: 800, y: 620, z: 2.1 }, AL_PL_SU = { x: 1060, y: 600, z: 2.1 }, AL_BOWL = { x: BOWL_AT.x, y: BOWL_AT.y - 40, z: 4 }, AL_TAG = { x: 360, y: 650, z: 2.0 };
// the Polish dog licking his bowl (scene 3's opening; PL_LICK): his head and the bowl
const AL_LICK = { x: BOWL_AT.x + 60, y: 700, z: 3.2 };
// The alley's room tone (the kitchen's extractor hum, very low): roomSfx('sceneN', [[from, to], …]) lays it under
// those spans (3 s tiles every 2.6 s, overlapping). It never stops when the chopping does: then the silence is an event.
const roomSfx = (beat, spans, vol = .12) => spans.forEach(([a, b]) => { for (let t = a; t < b - .5; t += 2.6) sfx(beat, +t.toFixed(2), 'room', vol); });
function alleySet(p) {
  const cam = paperCam(p, 'alley'), st = cam.stage;
  const kit = kitchen(st), steam = smoke(st, 1508, 250, 4, 3.0);
  const box = boxProp(st), cn = cnDog(mk('g', { 'clip-path': `url(#${box.clip})` }, st));
  const sid = 'alsh' + (++spClip), grad = mk('linearGradient', { id: sid }, st);
  grad.innerHTML = '<stop offset="0" stop-color="#0c0814" stop-opacity=".55"/><stop offset=".55" stop-color="#0c0814" stop-opacity=".3"/><stop offset="1" stop-color="#0c0814" stop-opacity="0"/>';
  const shade = mk('rect', { x: -200, y: -100, width: 1100, height: 1100, fill: `url(#${sid})`, 'pointer-events': 'none' });
  st.append(box.back, cn.g.parentNode, box.front, shade, box.eyes);   // the box's back, the dog inside, its front, the dark corner, the eyes
  const bowl = prop(st, bowlSVG); vis(bowl, false);
  const su = suDog(st), us = usDog(st), pl = plDog(st);
  // placeBowl(dy, rot, dx, spin): dy up, rot its tilt, dx along the ground, spin −1…1 (a turn on the spot: its width)
  const placeBowl = (dy = 0, rot = 0, dx = 0, spin = 1) => tf(bowl, `translate(${(BOWL_AT.x + dx).toFixed(1)},${(BOWL_AT.y - dy).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${spin.toFixed(3)},1)`);
  return { cam, us, pl, su, cn, box, bowl, placeBowl, kit, steam, shade: k => shade.setAttribute('opacity', k) };
}

/* ---------- a thought bubble (scene 4: the steak from "back home"; then the steak is him) ----------
   thought(p) → { g, pose({ x, y (bubble centre), tx, ty (where the little dots lead: his head), s, u (0…1: it pops
   up), me (the steak IS him: his big floppy ear, his eye and black nose on the meat's right end, his Stars-and-Stripes
   bandana tied round its "neck", his tail on the left end, wagging), q (the clock, for the wag), blink }) }. */
function thought(p) {
  const g = mk('g', {}, p), dots = [0, 1, 2].map(i => prop(g, PAPER(`<circle r="${8 + 5 * i}" fill="#fbf8ee"/>`))), body = mk('g', {}, g);
  // the steak fills about two-thirds of the bubble
  prop(body, PAPER('<path d="M-150,10 C-190,-20 -160,-90 -100,-80 C-90,-130 -10,-140 20,-100 C60,-140 140,-120 140,-70 C200,-60 200,30 140,40 C140,90 60,100 30,70 C0,110 -80,100 -100,60 C-160,80 -190,40 -150,10 Z" fill="#fbf8ee"/>') + steakSVG.replace('<image', '<image transform="translate(-4,-6) scale(1.85)"'));
  // him, as the steak: his tail on the left end; his floppy ear, his eye and his black nose on the meat's right (narrow)
  // end; tied under its "neck" (behind the ear) his Stars-and-Stripes bandana, knotted, with the gold tag
  const me = mk('g', { transform: 'translate(-4,-6) scale(1.42)' }, body), tail = mk('g', {}, me);
  prop(tail, PAPER(`<path d="M0,0 Q-24,-14 -30,-56 Q-18,-58 -16,-38 Q-10,-14 6,-6 Z" fill="${US_BREED.coat}"/>`));
  prop(me, PAPER('<path d="M0,44 Q22,38 46,44 L44,52 Q22,46 2,52 Z" fill="#c8323a"/>' +
      '<path d="M2,48 L44,46 L24,84 Z" fill="#c8323a"/><path d="M9,56 L38,55 M14,65 L33,64 M19,74 L28,73" stroke="#fbfbf6" stroke-width="4"/><path d="M2,48 L20,47 L13,62 Z" fill="#2f4a8a"/><circle cx="9" cy="52" r="1.8" fill="#fff"/>' +
      '<circle cx="34" cy="62" r="7" fill="#efc84a" stroke="#a8802a" stroke-width="2"/>') +
    PAPER(`<path d="M30,-62 C12,-58 10,-14 22,20 C34,12 44,-24 46,-58 Z" fill="${US_BREED.dark}"/>`) +
    PAPER('<ellipse cx="58" cy="-22" rx="11" ry="13" fill="#fff"/><ellipse cx="78" cy="2" rx="9" ry="7" fill="#141010"/>'));
  const pupil = mk('circle', { cx: 61, cy: -22, r: 5, fill: '#141010' }, me), lid = mk('path', { d: 'M47,-22 Q58,-12 69,-22', fill: 'none', stroke: '#141010', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, me);
  const lidFill = mk('ellipse', { cx: 58, cy: -22, rx: 12, ry: 14, fill: '#b23a2e' }, me); me.insertBefore(lidFill, lid);
  return { g, pose(o) {
    const u = o.u ?? 1; vis(g, u > .01); if (u <= .01) return;
    const s = (o.s ?? 1) * (u < 1 ? .3 + .7 * ease(u) + .08 * Math.sin(Math.PI * u) : 1);
    tf(body, `translate(${o.x},${o.y}) scale(${s.toFixed(3)})`); vis(me, !!o.me);
    tf(tail, `translate(-62,4) rotate(${(-16 * onTwos(o.q || 0)).toFixed(0)})`);
    vis(lid, !!o.blink); vis(lidFill, !!o.blink); vis(pupil, !o.blink);   // blink: true for two frames (blinking(q, [t]))
    dots.forEach((d, i) => { const k = (i + 1) / 4; tf(d, `translate(${(o.tx + (o.x - 120 - o.tx) * k).toFixed(1)},${(o.ty + (o.y + 60 - o.ty) * k).toFixed(1)})`); vis(d, u > .2 * i); });
  } };
}
// the bubble's size: the cloud spans about x −190…190, y −135…105 around (x, y) at s 1 — keep y − 135·s on screen

/* ---------- the "back home" cutaways ----------
   Each carries a torn-paper place tag in the top-left corner (placeTag, part of the camera, not zoomed): USA, POLAND,
   USSR; it is shown whenever that camera is (vis(set.tag, false) to drop it). */
function placeTag(p, text) {
  return prop(p, PAPER(`<path d="M40,40 L${100 + 34 * text.length},34 L${108 + 34 * text.length},96 L44,102 Z" fill="#f3ead6"/>`) +
    `<text x="${74 + 17 * text.length}" y="84" font-family="Rockwell, Georgia, serif" font-size="44" font-weight="700" text-anchor="middle" fill="#2a2420">${text}</text>`);
}
// USA (scene 2): a sunny front yard; the American dog sits on the lawn (YARD.us, dir 1) looking up at the window
// (YARD.win: x 952…1158, y 300…495). win(u): the lower sash slides up (0 shut … 1 open, dark inside). steak: a group
// for the flying steak (tf it: translate/rotate, vis it); toss(u, from, to, h) gives a point on a thrown arc.
const YARD = { us: 700, y: 820, s: 1.15, win: { x: 952, y: 300, w: 206, h: 195 }, from: [1055, 470] };
const YARD_WIDE = { x: 800, y: 450, z: 1 }, YARD_WIN = { x: 1060, y: 380, z: 3.0 }, YARD_TWO = { x: 900, y: 560, z: 1.5 };
const toss = (u, [x0, y0], [x1, y1], h = 160) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - h * 4 * u * (1 - u)];
function yardSet(p) {
  const cam = paperCam(p, 'yard'), st = cam.stage, W = YARD.win;
  const w = mk('g', {}, st);
  w.innerHTML = `<rect data-p="hole" x="${W.x}" y="${W.y + W.h / 2}" width="${W.w}" height="0" fill="#2a2a34"/>`;
  const sash = prop(w, PAPER(`<rect x="${W.x}" y="${W.y + W.h / 2}" width="${W.w}" height="${W.h / 2}" fill="#f4f1ea"/><rect x="${W.x + 12}" y="${W.y + W.h / 2 + 10}" width="${W.w / 2 - 18}" height="${W.h / 2 - 22}" fill="#9cc6de"/><rect x="${W.x + W.w / 2 + 6}" y="${W.y + W.h / 2 + 10}" width="${W.w / 2 - 18}" height="${W.h / 2 - 22}" fill="#9cc6de"/>`));
  const hole = w.querySelector('[data-p="hole"]');
  const us = usDog(st), steak = prop(st, steakSVG); vis(steak, false);
  const tag = placeTag(cam.root, 'USA');
  return { cam, us, steak, tag, win(u) { vis(w, u > .01); const hgt = (W.h / 2 - 6) * ease(u); hole.setAttribute('height', hgt.toFixed(1)); tf(sash, `translate(0,${(-hgt).toFixed(1)})`); } };
}
// POLAND (scene 3): a grey morning; a queue of dogs with empty bowls in their mouths stretches from the butcher's door
// (BUTCHER.queue: x of each dog, front first; all face right, dir 1, standing) to the Polish dog last at the left. The
// window shows a rail of empty hooks (BU_HOOKS). shutter(u): the shop's shutter rolls down over window and door (1 down).
const BUTCHER = { y: 800, s: .78, queue: [1270, 1105, 940, 775, 610], pl: 390 };
const BU_WIDE = { x: 800, y: 450, z: 1 }, BU_HOOKS = { x: 1124, y: 440, z: 3.2 }, BU_END = { x: 470, y: 640, z: 2.4 },
  BU_FRONT = { x: 1180, y: 630, z: 2.2 }, BU_DOOR = { x: 1260, y: 560, z: 2.0 };   // a pan along the queue: cam.to from BU_FRONT to BU_END
// (the queue dogs' bowls are on the ground now — `bowls` — not in their mouths)
const QUEUE_BREEDS = [{ coat: '#3a3634', far: '#2a2624', dark: '#1e1a18', muzzle: '#5a5450' }, { coat: '#c9b48e', far: '#ad9a76', dark: '#8a7656', muzzle: '#e4d6b8' },
  { coat: '#8a5a3a', far: '#6e462c', dark: '#4e301e', muzzle: '#b8865e', ear: DOG_EARS.prick }, { coat: '#ece5d6', far: '#cdc3b1', dark: '#6b5444', muzzle: '#fbf8f0' },
  { coat: '#7a7a80', far: '#606066', dark: '#46464c', muzzle: '#a0a0a6', torso: [70, 32], ear: DOG_EARS.prick }].map(b => ({ collar: 'none', ...b }));
function butcherSet(p) {
  const cam = paperCam(p, 'butcher'), st = cam.stage;
  const queue = QUEUE_BREEDS.map(b => dogLash(dogPuppet(st, { breed: b, holds: { bowl: bowlHeld } }))), pl = plDog(st);
  // every dog's empty bowl on the pavement in front of it (queue order, then the Polish dog's): place them each frame
  // with bowlAhead(that dog's pose): tf(bowls[i], `translate(x,y) scale(BUTCHER.s)`)
  const bowls = [...queue, pl].map(() => prop(st, bowlSVG));
  const sh = mk('g', {}, st), cl = 'bush' + (++spClip);
  sh.innerHTML = `<clipPath id="${cl}"><rect x="940" y="340" width="560" height="310"/></clipPath><g clip-path="url(#${cl})"><g data-p="roll">${
    Array.from({ length: 16 }, (_, i) => `<rect x="940" y="${340 + i * 20}" width="560" height="20" fill="${i % 2 ? '#8a8e94' : '#9ca0a6'}" stroke="#6a6e74" stroke-width="2"/>`).join('')}</g></g>`;
  const roll = sh.querySelector('[data-p="roll"]');
  const tag = placeTag(cam.root, 'POLAND');
  return { cam, queue, pl, bowls, tag, shutter(u) { vis(sh, u > .01); tf(roll, `translate(0,${(-310 * (1 - ease(u))).toFixed(1)})`); } };
}
// USSR (scene 3): the snowy square; a row of dogs in ushankas and muzzles sit in silence facing left (dir -1) at
// SNOW.row (the Soviet dog first, leftmost); a puppy at the right end (SNOW.pup, s .5, no hat). snow(q) every frame.
const SNOW = { y: 800, s: .82, row: [420, 630, 840, 1050, 1260], pup: 1460 };
const SN_WIDE = { x: 800, y: 450, z: 1 }, SN_ROW = { x: 950, y: 555, z: 1.2 }, SN_PUP = { x: 1400, y: 700, z: 3.2 };
function snowSet(p) {
  const cam = paperCam(p, 'snowsq'), st = cam.stage;
  const row = SNOW.row.map((x, i) => i ? dogLash(dogPuppet(st, { breed: { ...SU_BREED, coat: ['#5f5b58', '#6a5e52', '#55524e', '#706a64'][i % 4] } })) : suDog(st));
  const pup = dogLash(dogPuppet(st, { breed: { coat: '#8a7e72', far: '#6e645a', dark: '#5a5048', muzzle: '#b0a698', collar: 'none', spot: '', torso: [70, 38] } }));
  const flakes = Array.from({ length: 60 }, (_, i) => mk('circle', { r: 2 + (i % 3) * 1.6, fill: '#fbfbff', opacity: .85 }, st));
  const tag = placeTag(cam.root, 'USSR');
  return { cam, row, pup, tag, snow(q) { flakes.forEach((c, i) => { const sp = 40 + (i % 5) * 12, x = (i * 97.3) % 1700 - 50 + 20 * Math.sin(q * .9 + i), y = ((i * 61.7 + q * sp) % 1000) - 60;
    c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); }); } };
}

/* ---------- the title card ----------
   titleCard(p) → card; card.at(q, t0) every frame: the strip springs up with "Three Dogs"; at t0 + .8 a red line
   strikes out "Three" and "Four" is scrawled above it (play 'tick' there); at t0 + 1.6 the Chinese dog peeks over the
   strip's right end, ears flat. */
function titleCard(p) {
  const card = mk('g', {}, p);
  card.innerHTML = `<rect width="1600" height="900" fill="#0d0b0a"/>`;
  const wrap = mk('g', {}, card), peek = mk('g', {}, wrap), clip = mk('clipPath', { id: 'titlePeek6' }, card);
  mk('rect', { x: 0, y: 0, width: 1440, height: 372 }, clip); wrap.setAttribute('clip-path', 'url(#titlePeek6)');
  // the Chinese dog peeking over the strip, Kilroy-fashion: his face to us, rounded tan ears up, worried brows, mouth
  // corners down, two cream paws on the strip's edge
  peek.innerHTML = PAPER(`<g data-p="earL"><ellipse cx="-34" cy="-40" rx="17" ry="26" fill="${CN_COL.dark}" transform="rotate(-18 -34 -40)"/></g>`) +
    PAPER(`<ellipse cx="34" cy="-40" rx="17" ry="26" fill="${CN_COL.dark}" transform="rotate(18 34 -40)"/><circle r="48" fill="${CN_COL.coat}"/><ellipse cx="0" cy="22" rx="26" ry="18" fill="${CN_COL.muzzle}"/>`) +
    `<ellipse cx="-16" cy="-6" rx="10" ry="12" fill="#fff" stroke="${SP_INK}" stroke-width="2"/><ellipse cx="16" cy="-6" rx="10" ry="12" fill="#fff" stroke="${SP_INK}" stroke-width="2"/>
    <circle data-p="pl" cx="-14" cy="-2" r="4.5" fill="${SP_INK}"/><circle data-p="pr" cx="18" cy="-2" r="4.5" fill="${SP_INK}"/>
    <g data-p="blink"><path d="M-26,-6 Q-16,2 -6,-6 M6,-6 Q16,2 26,-6" fill="none" stroke="${SP_INK}" stroke-width="3.5" stroke-linecap="round"/></g>
    <path d="M-28,-26 L-8,-22 M28,-26 L8,-22" stroke="${SP_INK}" stroke-width="4" stroke-linecap="round" transform="rotate(0)"/>
    <ellipse cx="0" cy="14" rx="8" ry="6" fill="${SP_INK}"/><path d="M-12,32 Q0,25 12,32" fill="none" stroke="${SP_INK}" stroke-width="3" stroke-linecap="round"/>` +
    PAPER(`<ellipse cx="-30" cy="46" rx="16" ry="11" fill="${CN_COL.coat}"/><ellipse cx="30" cy="46" rx="16" ry="11" fill="${CN_COL.coat}"/>`);
  const K = pieces(peek);
  const strip = mk('g', {}, card);
  strip.innerHTML = PAPER('<path d="M240,330 L360,318 L520,334 L700,316 L900,332 L1100,317 L1300,333 L1370,330 L1360,430 L1180,444 L1000,428 L800,444 L600,430 L400,446 L236,432 Z" fill="#f3ead6"/>') +
    `<text x="800" y="418" font-family="Chalkboard SE, Avenir Next Heavy, sans-serif" font-size="86" font-weight="800" text-anchor="middle" fill="#1d1a1a"><tspan data-p="three">Three</tspan> Dogs</text>
    <text x="800" y="530" font-family="Avenir Next, sans-serif" font-size="38" letter-spacing="4" text-anchor="middle" fill="#cfc6b4">Joke Collection · Episode 6</text>`;
  const fix = mk('g', {}, strip);
  fix.innerHTML = `<path data-p="strike" d="M548,386 L790,370" stroke="#d8322c" stroke-width="9" stroke-linecap="round" fill="none"/>
    <text data-p="four" x="670" y="318" font-family="Chalkboard SE, Comic Sans MS, sans-serif" font-size="64" font-weight="700" text-anchor="middle" fill="#d8322c" transform="rotate(-6 670 300)">Four</text>`;
  bakeAll(card);
  const F = pieces(fix);
  card.at = (q, t0) => {
    vis(card, q >= t0); if (q < t0) return;
    const u = span(q, t0, t0 + .35), o = Math.sin(Math.PI * Math.min(1, u * 1.4)) * 12 * (1 - u);
    tf(strip, `translate(0,${((1 - u) * 80 - o).toFixed(1)})`);
    const k = span(q, t0 + .8, t0 + 1.0); vis(F.strike, k > 0); F.strike.setAttribute('stroke-dasharray', `${(250 * k).toFixed(0)} 400`); vis(F.four, q >= t0 + 1.0);
    tf(peek, `translate(1290,${(300 + 140 * (1 - span(q, t0 + 1.6, t0 + 1.9))).toFixed(1)})`);
    tf(K.earL, between(q, t0 + 2.6, t0 + 2.75) ? 'rotate(-22 -34 -14)' : '');   // one ear twitch
    const sh = blinking(q, [t0 + 2.9]); vis(K.blink, sh); vis(K.pl, !sh); vis(K.pr, !sh);
  };
  return card;
}
Object.assign(SFX_BED, { wind: 8, 'wind-pl': 5.7, room: 3 });   // the cutaways' wind bed: a seek into it joins it part-way
