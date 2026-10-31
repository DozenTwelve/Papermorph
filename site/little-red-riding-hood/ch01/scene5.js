/* scene5.js — Grandma's door (storyboard v2 §5, director finding #5).
   Shots (beat clock; PRE5 is the arrival):
   A  0 – 4.4     the wide under the three oaks (the woodcutter's block, his axe left in it); the wolf gallops in on all
                  fours from the left, skids, crouches and looks both ways, rises and tiptoes to the door; slow push in
   B  4.4 – s05 2.3   door close-up: three knocks, a paw at his throat, the squeaky "Grandma! It's me, Little Red…",
                  fluttering his lashes on "It's me"
   C  s05 2.3 – s05b 2.15   inside, Grandma in bed (the listener): she perks up at the name, sniffs, "Just lift the latch,
                  dear," pointing to the door
   D  s05b 2.15 – door5   back outside, the wolf's sly grin on "and come in", rubbing his paws
   E  door5 (2 s) from inside: the latch lifts (latch), the door creaks open on the wolf's dark shape against the daylight
   Last frame: the room's door open, the wolf's silhouette (scene 6 opens on him in the doorway). */
'use strict';
const PRE5 = 5.6;
const s5_C = (c, t = 0) => clipAt('scene5', PRE5, c, t);
const s5_IN = s5_C('s05', 2.3), s5_OUT = s5_C('s05b', 2.15), s5_DOOR = s5_C('door5');
const s5_KNOCK = [55, 57, 59].map(k => k / FPS), s5_TIP = 3.0, s5_TIPP = .9;   // the knocks; the tiptoe starts at s5_TIP, a step every s5_TIPP / 2
// the woodcutter's place by the oaks (scene 7 has him chopping here): a block, a log on it and split logs; axe: his axe
// stuck in the block (he is not here yet)
const s5_WX = 400, s5_WY = 772, s5_CHIMNEY = [1483, 258];   // Grandma's fire is lit: smoke from the chimney in 5 and 7
function s5_woodPile(parent, axe) {
  const X = s5_WX, Y = s5_WY;
  return prop(parent, `<g filter="url(#paper)"><path d="M${X + 56},${Y} L${X + 60},${Y - 78} L${X + 116},${Y - 78} L${X + 120},${Y} Z" fill="#7a5034"/><ellipse cx="${X + 88}" cy="${Y - 78}" rx="28" ry="7" fill="#c9a074"/>
    <rect x="${X + 74}" y="${Y - 118}" width="28" height="40" fill="#a37a52"/><ellipse cx="${X + 88}" cy="${Y - 118}" rx="14" ry="4.5" fill="#d8b88a"/>
    <path d="M${X - 120},${Y} l60,0 l-6,-22 l-56,4 Z M${X - 110},${Y - 20} l56,-4 l-4,-20 l-54,6 Z" fill="#a37a52"/></g>
    ${axe ? `<g filter="url(#paper)" transform="rotate(-24,${X + 92},${Y - 80})"><rect x="${X + 89}" y="${Y - 166}" width="7" height="88" rx="3" fill="#8a5a32"/>
      <path d="M${X + 80},${Y - 90} L${X + 108},${Y - 92} L${X + 110},${Y - 74} L${X + 78},${Y - 74} Z" fill="#9aa0a6"/></g>` : ''}`);
}
// the shape in the doorway seen from inside: daylight behind, so a dark figure (scenes 5 and 7 share the look)
document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${[30, 55, 80].map(k => `<filter id="s5_dark${k}" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="${k / 100}"/><feFuncG type="linear" slope="${k / 100}"/><feFuncB type="linear" slope="${(k + 6) / 100}"/></feComponentTransfer></filter>`).join('')}
</defs></svg>`);

// the beds follow the cuts: the forest outside (A, B, D), the room inside (C, E)
sfx('scene5', 0, 'forest', .5, { loop: true, to: s5_IN }); sfx('scene5', s5_OUT, 'forest', .5, { loop: true, to: s5_DOOR });
sfx('scene5', s5_IN, 'room', .4, { loop: true, to: s5_OUT }); sfx('scene5', s5_DOOR, 'room', .4, { loop: true });
[1.0, 1.44].forEach(t => sfx('scene5', t, 'run', 1.3));
sfx('scene5', 1.9, 'skid', 1.3);
[0, 1, 2].forEach(k => sfx('scene5', +(s5_TIP + s5_TIPP * (.25 + k / 2)).toFixed(2), 'pad', 1));
s5_KNOCK.forEach(t => sfx('scene5', t, 'knock', 2));   // the engine plays at half the vol: 2 is full
sfx('scene5', s5_DOOR + .05, 'latch', 1.6);
sfx('scene5', s5_DOOR + .6, 'creak', 1.4);

function scene5(p, D) {
  const C = s5_C, s = .6;
  // outside: the three oaks, the house, the woodcutter's block
  const cam = paperCam(p, 'grandmaOut', { x: 960, y: 420, z: .85 }, { after: 'house', stages: ['inside'] });
  const door = doorLeaf(cam.stage, 'M1010,800 L1010,560 Q1070,510 1130,560 L1130,800 Z', '#3f5f8a', 1010, '<path d="M1040,530 V800 M1070,520 V800 M1100,530 V800" stroke="#2f4a6e" stroke-width="3"/><circle cx="1116" cy="680" r="6" fill="#caa24c"/>');
  s5_woodPile(cam.stage, true);
  const puff = smoke(cam.stage, ...s5_CHIMNEY);
  const wolf = wolfPuppet(cam.stage);
  cam.to({ x: 950, y: 432, z: .9 }, 1.9, 1.3).to({ x: 930, y: 500, z: 1.15 }, 3.2, 1.2);   // hold the wide (three whole oaks) ~2.5 s, then A: in with him as he creeps up
  cam.cut({ x: 975, y: 590, z: 2.6 }, 4.4);         // B: the door
  // inside: Grandma in bed; then the door from inside
  const inn = paperCam(p, 'room', { x: 1252, y: 536, z: 3 }), R = roomProps(inn, []), gran = grandmaPuppet(R.inBed), wolfIn = wolfPuppet(R.atDoor);
  R.atDoor.setAttribute('filter', 'url(#s5_dark30)');
  const latch = prop(inn.stage, `<g filter="url(#paper)"><rect x="318" y="596" width="36" height="9" rx="3" fill="#3b2a1e"/></g>`);
  inn.to({ x: 1248, y: 524, z: 3.5 }, s5_IN + .3, s5_OUT - s5_IN - .3);   // slowly in on her while she listens and answers
  inn.cut({ x: 330, y: 600, z: 1.8 }, s5_DOOR).to({ x: 300, y: 610, z: 2.1 }, s5_DOOR + .9, 1.6);
  const gallop = [[.8, -320], [2.45, 800]], tip = walker(800, s, { L: 196, A: 11, period: s5_TIPP, knee: 64 }, 1, 3);
  stopClock(D, (q, f) => {
    const inside = q >= s5_IN && (q < s5_OUT || q >= s5_DOOR);
    vis(cam.root, !inside); vis(inn.root, inside);
    if (inside) {
      inn.apply(q, f);
      const opened = s5_DOOR + .6;
      R.door(opening(q, opened));
      tf(latch, q >= s5_DOOR + .25 ? 'rotate(-32,320,600)' : ''); vis(latch, q < opened);
      // Grandma: hears the name, lifts her head and smiles; a sniff; then her line, a hand toward the door on "latch"
      const up = span(q, s5_IN + .1, s5_IN + .5), sniff = between(q, C('s05b', -.5), C('s05b', -.5) + 2 / FPS);
      const point = span(q, C('s05b', .35), C('s05b', .7)) - span(q, C('s05b', 1.9), C('s05b', 2.2));
      gran.pose({ x: 1250, y: 630, s: .55, turn: -1, headR: -6 * (1 - up) + (sniff ? 5 : 0), nod: sniff ? 3 : 0,
        mouth: lips(q, 'scene5', PRE5, 's05b'), ua: -50 * point, fa: -40 * point,
        shut: sniff || blinking(q, [s5_IN + .9, C('s05b', 2.5)]), brow: -.4 * up }, f);
      // the wolf in the doorway, dark against the day
      vis(wolfIn.g, q >= opened);
      wolfIn.pose({ x: 262, y: hipOn(800, s, 200), s, lean: 8, ua: -30, fa: -60 + 6 * onTwos(q), brow: -1, tail: 10 + 8 * onTwos(q),
        shut: blinking(q, [s5_DOOR + 1.6]) }, f);
      return;
    }
    cam.apply(q, f); door(1); puff(q);
    let o;
    if (q < s5_TIP) {   // the gallop (paws planted by the distance run), braking into a skid, then crouched, looking both ways
      const r = route(q, gallop, s), low = span(q, 2.4, 2.55);
      o = { x: r.x, y: hipOn(800, s, 200), run: r.d, skid: span(q, 1.95, 2.15) * (1 - low), crouch: low, tail: -10 + 6 * onTwos(q),
        ear: q < 2.5 ? -1 : onTwos(q) * .5, look: q < 2.6 ? 1 : q < 2.8 ? -1 : 1, headR: q < 2.6 ? 0 : q < 2.8 ? -8 : 4 };
    } else if (q < 4.4) {   // up on his hind legs, tiptoeing: paws up, knees high
      const w = tip(q - s5_TIP), done = q - s5_TIP >= 1.5 * s5_TIPP;   // walker ends mid-stance: stand straight once done
      o = { x: w.x, y: hipOn(800, s, 200) + (done ? 0 : w.drop * s), near: done ? 0 : w.near, far: done ? 0 : w.far, kNear: done ? 0 : w.kNear, kFar: done ? 0 : w.kFar, lean: 12,
        ua: -95, fa: -65, tail: 12, look: 1, brow: -1 };
    } else {   // B and D: at the door
      const knock = s5_KNOCK.some(t => between(q, t, t + 1 / FPS)), throat = q >= 5.05 && q < C('s05', 2.4);
      o = { x: tip(9).x, y: hipOn(800, s, 200), lean: 6, ua: throat ? -10 : -75, fa: throat ? -155 : -35 + (knock ? 25 : 0),
        nod: between(q, 5.2, 5.2 + 2 / FPS) ? 4 : 0, brow: q > 5.05 ? 1 : 0, mouth: lips(q, 'scene5', PRE5, 's05'),
        shut: (between(q, C('s05', 1.0), C('s05', 1.9)) && onTwos(q) > 0) || blinking(q, [4.45]), tail: 6 * onTwos(q) };
      if (q >= s5_OUT) o = { ...o, ua: -40, fa: -95 + 12 * onTwos(q), brow: -1, mouth: 'X', tail: 14 + 10 * onTwos(q), look: 1,
        ear: between(q, s5_OUT + .8, s5_OUT + 1) ? 1 : 0, shut: blinking(q, [s5_OUT + .5]) };
    }
    wolf.pose({ s, ...o }, f);
  });
}
