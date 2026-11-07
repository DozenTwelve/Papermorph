/* shared.js — what every scene of the series uses: timing helpers, props, the two places (the bun stall and the
   classroom, built the same way whenever they appear so the staging matches across cuts) and the long sounds. */
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

/* ---------- the cast ----------
   Puppets on the kit's spKid (cast.js): the kids in the flat cut-paper style of South Park, a big round head straight
   on the body, two touching eyes, a mouth low on the face, mitten hands, and the grown-ups and dogs of the episodes. */
Object.assign(SHAPES, {
  // the fat kid: round body, wide head, double chin, bowl of black hair
  me: { sx: 104, sy: -142, hipX: 34, legW: 40, shoe: 29, body: 'M-66,-174 C-126,-156 -136,-72 -116,-46 Q-72,-28 0,-28 Q72,-28 116,-46 C136,-72 126,-156 66,-174 Z',
    head: [0, -250, 106, 90], neck: -160, eyes: [22, -256, 23, 28], mouth: [0, -196], cheeks: [64, -216], slide: 30,
    chin: 'M-52,-174 Q0,-152 52,-174',
    hair: ['#211a17', 'M-104,-262 C-108,-334 -62,-350 0,-350 C62,-350 108,-334 104,-262 L88,-280 L70,-262 L50,-284 L26,-268 L4,-288 L-20,-268 L-44,-286 L-66,-264 L-86,-282 Z'] },
  // the thin kid with glasses and a spiky top
  bo: { sx: 54, sy: -146, hipX: 18, legW: 26, shoe: 20, body: 'M-44,-166 C-64,-150 -68,-78 -62,-50 Q-30,-36 0,-36 Q30,-36 62,-50 C68,-78 64,-150 44,-166 Z',
    head: [0, -246, 92, 86], neck: -158, eyes: [24, -254, 20, 25], mouth: [0, -196], cheeks: null, slide: 28, glasses: 31,
    hair: ['#2a1f1a', 'M-90,-262 C-96,-318 -60,-338 -10,-340 L-24,-366 L4,-346 L10,-374 L30,-346 L50,-366 L52,-338 C84,-326 96,-300 90,-262 L74,-286 L56,-270 L30,-292 L0,-276 L-30,-292 L-58,-270 Z'] },
});
// classmates: one body, a few heads of hair
const KID_HAIR = {
  bowl: c => [c, 'M-90,-258 C-94,-320 -56,-336 0,-336 C56,-336 94,-320 90,-258 L72,-280 Q0,-296 -72,-280 Z'],
  pigtails: c => [c, 'M-90,-256 C-94,-320 -56,-336 0,-336 C56,-336 94,-320 90,-256 L78,-282 Q0,-300 -78,-282 Z M-96,-262 q-34,4 -36,40 q20,-6 36,-18 Z M96,-262 q34,4 36,40 q-20,-6 -36,-18 Z'],
  part: c => [c, 'M-90,-258 C-94,-322 -50,-338 10,-336 C64,-332 94,-312 90,-258 L80,-290 Q30,-312 -20,-290 Q-60,-300 -84,-276 Z'],
  buzz: c => [c, 'M-88,-266 C-90,-318 -52,-334 0,-334 C52,-334 90,-318 88,-266 Q0,-300 -88,-266 Z'],
};
const kidShape = (hair, col) => ({ ...SHAPES.bo, glasses: 0, hair: KID_HAIR[hair](col) });
// the bun seller: a grown-up, so a long body on longer legs; white apron and cap. Coat colour is her top.
SHAPES.aunt = { sx: 60, sy: -262, hipX: 20, legW: 30, shoe: 22, legH: 96, neck: -276,
  body: 'M-46,-284 C-66,-270 -72,-140 -66,-96 Q-34,-84 0,-84 Q34,-84 66,-96 C72,-140 66,-270 46,-284 Z',
  extra: '<path d="M-40,-230 L40,-230 L54,-92 Q0,-80 -54,-92 Z" fill="#f6f4ee"/><path d="M-40,-230 L-26,-276 M40,-230 L26,-276" stroke="#f6f4ee" stroke-width="6"/>',
  head: [0, -360, 88, 82], eyes: [22, -366, 18, 22], mouth: [0, -312], cheeks: [56, -330], slide: 26,
  hair: ['#2a2220', 'M-86,-372 C-92,-430 -50,-446 0,-446 C50,-446 92,-430 86,-372 Q60,-404 0,-406 Q-60,-404 -86,-372 Z'],
  hat: '<path d="M-74,-414 C-80,-470 80,-470 74,-414 Q0,-430 -74,-414 Z" fill="#f6f4ee"/><rect x="-78" y="-424" width="156" height="18" rx="8" fill="#e8e4da"/>' };
const auntPuppet = (p, o) => spKid(p, 'aunt', { coat: '#c94a3c', stripe: '#c94a3c', pants: '#3a3430', ...o });

const mePuppet = (p, o) => spKid(p, 'me', o), boPuppet = (p, o) => spKid(p, 'bo', o);
const classmate = (p, hair, col, o) => spKid(p, kidShape(hair, col), o);


// The teacher (episode 2): a grown-up like the seller, a cardigan over a blouse, hair up in a tall bun.
SHAPES.teacher = { ...SHAPES.aunt,
  extra: '<path d="M-22,-282 L0,-236 L22,-282 Z" fill="#f2e6d0"/><path d="M-6,-232 V-96" stroke="#5e1c2c" stroke-width="4"/>' +
    [-200, -160, -120].map(y => `<circle cx="6" cy="${y}" r="5" fill="#f2e6d0"/>`).join(''),
  hat: '<circle cx="0" cy="-458" r="38" fill="#2a2220"/><path d="M-30,-436 Q0,-424 30,-436" stroke="#5a4a44" stroke-width="5" fill="none"/>' };
const teacherPuppet = (p, o) => spKid(p, 'teacher', { coat: '#8c2f45', stripe: '#8c2f45', pants: '#4a4a52', ...o });

/* The bun seller's dog (episode 2), side-on as the show draws its dogs. Built at its feet (0, 0) facing right, about
   190 long and 170 tall at s = 1. pose(o, f): x, y, s, dir (1 faces right, -1 left), headR (+ looks up), jaw (0 shut …
   1 open), tail (degrees, + up), wag (the tail swings on twos), ear (degrees), shut, lids, eyeX (-1 … 1 along its look),
   sit (on its haunches; 0…1 or true, ease it over ~0.3 s), lie (flat on the ground, front paws out, 0…1 or true; asleep
   unless lie is 'awake'), walk (legs scissor on twos), bob, glasses, tongue, sniff (the nose twitches),
   hold (prop key, carried crosswise in its mouth); rot (degrees: the whole dog tips about its middle, + nose down,
   for a leap); paw (degrees: the near front paw raised forward), swell (0…1: the chest
   fills, a big breath in).
   breed (episode 6; every key optional, leaving one out draws episode 4's dog): coat, dark, far, muzzle (colours),
   collar (colour, 'none'), torso ([rx, ry] of the body, default [82, 40]), spot (svg for the back patch, '' none), ear
   (path at the ear pin, 0,0 is the pin; DOG_EARS), tail (path), body (svg over the torso), neck (svg by the collar),
   hat (svg on the head, drawn last), mouthIn (svg of the inside of the mouth, behind the jaw: it turns half as far as
   the jaw, so a wide-open mouth shows a mouth, not a gap). */
const DOG = { coat: '#ece5d6', dark: '#6b5444', far: '#cdc3b1', muzzle: '#fbf8f0' };
const REST_DOG = { x: 0, y: 0, s: 1, dir: 1, headR: 0, jaw: 0, tail: 0, wag: false, ear: 0, shut: false, lids: 0, eyeX: 0,
  sit: false, lie: false, walk: false, bob: 0, glasses: false, tongue: false, sniff: false, hold: null, paw: 0, swell: 0 };
// Ear shapes at the ear pin: the floppy one (episode 4) and a pricked one (rotate it back, ear -60…-80, to lay it flat).
const DOG_EARS = { flop: 'M0,0 C-22,4 -26,40 -12,62 C-2,52 10,28 8,0 Z', prick: 'M-16,6 C-14,-14 -4,-40 6,-52 C14,-34 18,-12 16,6 Z' };
function dogPuppet(parent, { holds = {}, breed = {} } = {}) {
  const g = mk('g', {}, parent), id = 'dogc' + (++spClip), C = { ...DOG, ...breed }, [trx, try_] = breed.torso || [82, 40];
  const leg = (k, col) => `<g data-p="leg${k}"><g filter="url(#paper)"><rect x="-11" y="0" width="22" height="58" rx="8" fill="${col}"/><ellipse cx="6" cy="56" rx="13" ry="7" fill="${C.dark}"/></g></g>`;
  const eye = '<ellipse cx="100" cy="-142" rx="11" ry="13"';
  g.innerHTML = `<g data-p="all">${leg('B2', C.far)}${leg('F2', C.far)}
    <g data-p="haunch"><g filter="url(#paper)"><ellipse cx="-44" cy="-34" rx="40" ry="34" fill="${C.coat}"/><ellipse cx="-24" cy="-5" rx="24" ry="7" fill="${C.dark}"/></g></g>
    <g data-p="torso">
      <g data-p="tail"><g filter="url(#paper)"><path d="${breed.tail ?? 'M0,0 Q-34,-16 -40,-60 Q-28,-60 -24,-32 Q-16,-12 8,-8 Z'}" fill="${C.coat}"/></g></g>
      <g filter="url(#paper)"><ellipse cx="0" cy="-86" rx="${trx}" ry="${try_}" fill="${C.coat}"/>${breed.spot ?? `<ellipse cx="-14" cy="-100" rx="30" ry="15" fill="${C.dark}"/>`}${breed.body || ''}</g>
      <g data-p="head">
        <g filter="url(#paper)"><rect x="52" y="-116" width="28" height="12" rx="4" fill="${C.collar ?? '#c8322f'}" transform="rotate(-20 66 -110)"/>${breed.neck || ''}
          <circle cx="94" cy="-132" r="38" fill="${C.coat}"/><ellipse cx="128" cy="-106" rx="24" ry="9" fill="#4a1a14"/></g>
        ${breed.mouthIn ? `<g data-p="mouthIn">${breed.mouthIn}</g>` : ''}<g data-p="jaw"><g filter="url(#paper)"><path d="M100,-108 Q150,-106 150,-98 Q132,-86 100,-96 Z" fill="${C.muzzle}"/></g>
          <ellipse data-p="tongue" cx="138" cy="-90" rx="9" ry="12" fill="#e06f7a"/></g>
        <g filter="url(#paper)"><ellipse cx="128" cy="-116" rx="28" ry="15" fill="${C.muzzle}"/></g><g data-p="nose"><g filter="url(#paper)"><ellipse cx="154" cy="-122" rx="8.5" ry="6.5" fill="${SP_INK}"/></g></g>
        <clipPath id="${id}">${eye}/></clipPath>
        <g data-p="whites" filter="url(#paper)">${eye} fill="#fff"/></g>
        <circle data-p="pupil" cx="102" cy="-142" r="4.8" fill="${SP_INK}"/>
        <g clip-path="url(#${id})"><g data-p="lids"><rect x="86" y="-182" width="28" height="26" fill="${C.coat}"/><path d="M86,-155 H114" stroke="${SP_INK}" stroke-width="3"/></g></g>
        ${eye} fill="none" stroke="${SP_INK}" stroke-width="2"/>
        <g data-p="ear"><g filter="url(#paper)"><path d="${breed.ear ?? DOG_EARS.flop}" fill="${C.dark}"/></g></g>
        <g data-p="glasses" fill="none" stroke="${SP_INK}" stroke-width="3.5"><circle cx="101" cy="-142" r="16"/><path d="M85,-144 L64,-150 M117,-145 Q122,-149 127,-146"/><ellipse cx="135" cy="-143" rx="7" ry="13"/></g>
        ${Object.entries(holds).map(([k, s]) => `<g data-p="hold_${k}" transform="translate(134,-100)">${s}</g>`).join('')}${breed.hat || ''}
      </g></g>${leg('B1', C.coat)}${leg('F1', C.coat)}</g>`;
  bakeAll(g);
  const P = pieces(g), holdKeys = Object.keys(holds);
  // a point of the torso turned by `a` degrees about the hip: where the shoulders go when it sits
  const turn = (x, y, a) => { const r = a * Math.PI / 180, dx = x + 50, dy = y + 56; return [-50 + dx * Math.cos(r) - dy * Math.sin(r), -56 + dx * Math.sin(r) + dy * Math.cos(r)]; };
  return { g, pose(o, f) {
    o = { ...REST_DOG, ...o };
    const j = k => .35 * jit(f >> 1, k), k2 = Math.floor(f / 2) % 2 ? 1 : -1;
    tf(g, `translate(${(o.x + j(1) * .8).toFixed(1)},${(o.y + j(2) * .6).toFixed(1)}) scale(${(o.s * o.dir).toFixed(3)},${o.s})${o.rot ? ` rotate(${o.rot.toFixed(1)},0,-80)` : ''}`);
    const L = o.lie === true || o.lie === 'awake' ? 1 : +o.lie || 0, S = o.sit === true ? 1 : +o.sit || 0;
    tf(P.all, `translate(0,${(o.bob + 50 * L).toFixed(1)})`);
    const a = -16 * S;
    tf(P.torso, `rotate(${(a + j(3) * .4).toFixed(2)},-50,-56)${o.swell ? ` translate(0,-80) scale(${(1 + .07 * o.swell).toFixed(3)}) translate(0,80)` : ''}`);
    // sitting folds the back legs under the haunch; lying shortens the back legs away and swings the front paws forward
    vis(P.haunch, S > .4); vis(P.legB1, S <= .4 && L < .95); vis(P.legB2, S <= .4 && L < .95);
    const sw = o.walk ? 18 * k2 : 0, [fx, fy] = turn(30 + 16 * (1 - S), -60, a), fl = (-fy) / 60, bl = 1 - L;   // front legs reach the ground from the shoulder
    tf(P.legB1, `translate(-50,-60) rotate(${(sw + j(4) * .5).toFixed(2)}) scale(1,${bl.toFixed(3)})`); tf(P.legB2, `translate(-34,-60) rotate(${(-sw + j(5) * .5).toFixed(2)}) scale(1,${bl.toFixed(3)})`);
    const fr = -90 * L, fs = fl * (1 - .3 * L);
    tf(P.legF1, `translate(${fx.toFixed(1)},${fy.toFixed(1)}) rotate(${(-sw + fr - o.paw + j(6) * .5).toFixed(2)}) scale(1,${fs.toFixed(3)})`);
    tf(P.legF2, `translate(${(fx + 14).toFixed(1)},${fy.toFixed(1)}) rotate(${(sw + fr + j(7) * .5).toFixed(2)}) scale(1,${fs.toFixed(3)})`);
    tf(P.tail, `translate(-78,-92) rotate(${(-o.tail - (o.wag ? 16 * k2 : 0) + j(8)).toFixed(2)})`);
    tf(P.head, `rotate(${(-o.headR - a + j(9) * .6).toFixed(2)},62,-104)`);
    tf(P.jaw, `rotate(${(o.jaw * 30).toFixed(1)},100,-102)`);
    if (P.mouthIn) tf(P.mouthIn, `rotate(${(o.jaw * 15).toFixed(1)},100,-102)`);   // the inside of an open mouth (episode 6), halfway between
    tf(P.ear, `translate(80,-158) rotate(${(o.ear + j(10) * 2).toFixed(2)})`);
    tf(P.pupil, `translate(${(o.eyeX * 5).toFixed(1)},0)`);
    tf(P.lids, `translate(0,${((o.shut || (L > .5 && o.lie !== 'awake') ? 1 : o.lids) * 26).toFixed(1)})`);
    tf(P.nose, o.sniff ? `translate(154,-122) scale(${(1 + .18 * (f % 2)).toFixed(2)}) translate(-154,-122)` : '');   // sniffing: the nose twitches every frame
    vis(P.glasses, o.glasses); vis(P.tongue, o.tongue);
    for (const k of holdKeys) vis(P[`hold_${k}`], o.hold === k);
  } };
}

/* ---------- episode "Do You Need a Bag?": three grown-ups at a convenience store ---------- */
// Move every y of an absolute path (M/C/L/Q pairs) by dy: grown-ups reuse the kids' hair, higher up.
const shiftY = (d, dy) => { let i = 0; return d.replace(/-?\d+(\.\d+)?/g, n => (i++ % 2 ? +n + dy : +n) + ''); };
// Me, grown up: the same round face and bowl of black hair, on a big round body and grown-up legs; a grey hoodie.
SHAPES.meAdult = { sx: 104, sy: -258, hipX: 34, legW: 40, shoe: 29, legH: 96, neck: -276,
  body: 'M-70,-290 C-128,-272 -140,-150 -122,-104 Q-76,-86 0,-86 Q76,-86 122,-104 C140,-150 128,-272 70,-290 Z',
  extra: '<path d="M-62,-176 L62,-176 L72,-118 L-72,-118 Z" fill="#7b808b"/><path d="M-16,-284 v46 M16,-284 v46" stroke="#f4f1ea" stroke-width="4" stroke-linecap="round"/>',
  head: [0, -366, 106, 90], eyes: [22, -372, 23, 28], mouth: [0, -312], cheeks: [64, -332], slide: 30, chin: 'M-52,-290 Q0,-268 52,-290',
  hair: ['#211a17', shiftY(SHAPES.me.hair[1], -116)] };
const meAdultPuppet = (p, o) => spKid(p, 'meAdult', { coat: '#8f949e', stripe: '#8f949e', pants: '#34405e', ...o });
// The American girl: blonde, a high ponytail swinging to her left, a pink T-shirt with a heart, backpack straps, denim shorts.
SHAPES.amy = { ...SHAPES.aunt,
  extra: '<path d="M-40,-282 L-36,-150 M40,-282 L36,-150" stroke="#3a5ab0" stroke-width="13" stroke-linecap="round"/><path d="M0,-186 c-14,-18 -38,-2 -20,16 l20,18 l20,-18 c18,-18 -6,-34 -20,-16 Z" fill="#e0405a"/>',
  cheeks: [54, -330],
  hair: ['#f0c45a', 'M-86,-366 C-94,-432 -50,-448 0,-448 C50,-448 94,-432 86,-366 Q74,-404 30,-412 Q-30,-420 -86,-366 Z M50,-438 q70,-34 84,22 q6,46 -26,84 q8,-52 -22,-80 Z'],
  hat: '<circle cx="54" cy="-436" r="10" fill="#e0405a"/>' };
const amyPuppet = (p, o) => spKid(p, 'amy', { skin: '#f9dcc6', coat: '#f39ab8', stripe: '#f39ab8', pants: '#5a7ab8', ...o });
// The clerk: a young woman with a black bob, the store's blue-and-white striped shirt and a name badge.
SHAPES.clerk = { ...SHAPES.aunt,
  extra: [-44, -26, -8, 10, 28, 46].map(x => `<rect x="${x - 4}" y="-274" width="8" height="184" fill="#5b8fd0"/>`).join('') +
    '<path d="M-22,-284 L0,-250 L22,-284" fill="none" stroke="#2f6fb8" stroke-width="7"/><rect x="18" y="-236" width="34" height="20" rx="3" fill="#fbfbf6" stroke="#3f9a5a" stroke-width="3"/>',
  hair: ['#1d1716', 'M-92,-366 C-98,-434 -52,-450 0,-450 C52,-450 98,-434 92,-366 L94,-318 Q84,-326 72,-324 L74,-384 Q0,-408 -74,-384 L-72,-324 Q-84,-326 -94,-318 Z'] };
SHAPES.clerk.hat = '';
const clerkPuppet = (p, o) => spKid(p, 'clerk', { coat: '#eef2f8', stripe: '#eef2f8', pants: '#2c3446', ...o });

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

/* ---------- sound ----------
   Effects and music are the engine's sfx() and music() (references/core/sound.md), so export.py mixes them too. The long
   one-off sounds are listed with their length here, before the scenes call sfx(), so a seek into one joins it part-way. */
Object.assign(SFX_BED, { rain: 6, waves: 32 });   // episode 6 lists its own (dogs.js)
