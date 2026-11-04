/* scene16.js — The prettiest cat (p33, then p34). Beat clock = PRE16 + the joined clip's seconds (T below).
   1 p33 wide: the evening at home, she knits and rocks, he smokes and rocks, the cat plays with the yarn (0 – T(.12): her line opens on her);
   2 close on her, w14 "And it is a very pretty cat, after all!" (to T(2.5)); 3 insert on the cat and its yarn (to T(3.6));
   4 (cut 3 dropped the narrator's "said the very old woman / man" and her second close shot); 5 close on him with his pipe
     smoke, m14 "the most beautiful cat in the whole world" (to T(7.584)); 6 the wide again, and on "hundreds … trillions" the room
     fades to paper, Gág's refrain lettering stands straight on it (a soft borderless cream glow behind the letters, no card)
     with a ghost of the crowd swelling behind, and all fades back on "and not one was as pretty as this one"
     (T(8.4) – T(15.9)); 7 insert on the cat (to the hole sleep16);
   8 page turn in the hole to p34: the cat asleep under its flower, a slow push held to the end; no end card. */
'use strict';
const PRE16 = .5;

const s16T = t => PRE16 + t;
const s16M = m => markAt('scene16', PRE16, m);
const s16CUT = [.021, 2.136, 2.861, 2.861, 6.763, 16.65].map(s16T);   // cuts: wide | woman | cat | (her second shot, gone in cut 3) | man | wide | cat
const s16TURN = s16T(19.025);                                  // covered here, in the hole sleep16
const s16SAY = [[.126, 2.08], [3.068, 6.441], [7.796, 16.95]];       // when her / his own voice is speaking (clip seconds)
const s16talk = (q, i) => { const [a, b] = s16SAY[i]; return q >= s16T(a) && q < s16T(b) ? Math.abs(Math.sin((q - s16T(a)) * 8.4)) : 0; };
// the refrain's words, in time: the five numbers on their marks, the little words on the words file's times
// each little word is the nearest number's mark plus the gap between their word times in m14b's words file
// (narration.en.words.txt: hundreds 14.39, of 14.77, cats 14.88, thousands 15.45, of 15.88, cats 15.99, millions 16.59, and 17.13,
// billions 17.26, and 17.69, trillions 17.77, of 18.24, cats 18.36, and 18.96, not 19.1), so a re-joined clip moves them with the marks
const s16RF = [['rf-hundreds', 'm14b.hun', 0], ['rf-of1', 'm14b.hun', .5], ['rf-cats4', 'm14b.hun', .76],
  ['rf-thousands', 'm14b.thou', 0], ['rf-of2', 'm14b.thou', .242], ['rf-cats5', 'm14b.thou', .682],
  ['rf-millions', 'm14b.mil', 0], ['rf-and2', 'm14b.mil', .261],
  ['rf-billions', 'm14b.bil', 0], ['rf-and3', 'm14b.bil', .38],
  ['rf-trillions', 'm14b.tril', 0], ['rf-of3', 'm14b.tril', .4], ['rf-cats6', 'm14b.tril', .88]];
const s16NOT = () => s16M('m14b.not');

sfx('scene16', 0, 'fire', .3, { loop: true, to: s16TURN });
sfx('scene16', .05, 'page', .8);
for (let k = 0; k < 7; k++) sfx('scene16', +(.3 + k * 2.9).toFixed(2), 'rock', .2);
for (let k = 0; k < 6; k++) sfx('scene16', +(1.5 + k * 3.4).toFixed(2), 'rock', .16);
sfx('scene16', s16CUT[1], 'purr', .22);
sfx('scene16', s16T(1.062), 'mew1', .25);
for (const [m, v] of [['m14b.hun', .2], ['m14b.thou', .28], ['m14b.mil', .36], ['m14b.bil', .42], ['m14b.tril', .5]]) sfx('scene16', s16M(m), 'mews', v);
sfx('scene16', s16T(16.461), 'chime', .3); sfx('scene16', s16T(16.697), 'purr', .25);
sfx('scene16', s16TURN - .5, 'page', .5);

function scene16(p, D) {
  const pk = (q, t, w = .2) => Math.max(0, 1 - Math.abs(q - t) / w);

  // ---- p33: the evening ----
  const A = paperCam(p, 'p33', { x: 820, y: 470, z: 1.4 });
  A.to({ x: 820, y: 470, z: 1.55 }, .6, s16CUT[0] - .6)
   .cut({ x: 505, y: 475, z: 2.5 }, s16CUT[0]).to({ x: 515, y: 470, z: 2.65 }, s16CUT[0], s16CUT[1] - s16CUT[0])      // her, w14
   .cut({ x: 770, y: 585, z: 3.3 }, s16CUT[1]).to({ x: 760, y: 590, z: 3.5 }, s16CUT[1], s16CUT[2] - s16CUT[1])      // the cat and its yarn
   .cut({ x: 1020, y: 345, z: 2.5 }, s16CUT[3]).to({ x: 1020, y: 355, z: 2.75 }, s16CUT[3], s16CUT[4] - s16CUT[3])  // him, m14
   .cut({ x: 820, y: 470, z: 1.6 }, s16CUT[4]).to({ x: 820, y: 460, z: 1.35 }, s16CUT[4], 1.2)                      // pull back: the refrain
   .to({ x: 820, y: 470, z: 1.3 }, s16T(8.126), s16T(16.202) - s16T(8.126))
   .cut({ x: 775, y: 590, z: 3.0 }, s16CUT[5]).to({ x: 765, y: 592, z: 3.6 }, s16CUT[5], s16TURN - s16CUT[5]);       // the cat, "pretty as this one"
  const wAt = pagePos('p33', 'woman33'), mAt = pagePos('p33', 'man33'), cAt = pagePos('p33', 'cat33');
  const woman = cutPuppet(A.stage, 'woman33'), man = cutPuppet(A.stage, 'man33'), cat = cutPuppet(A.stage, 'cat33');
  // the lamp's flame as its own piece over Gág's: it flickers on twos (scale, skew), never smaller than hers
  const flame = cutPuppet(A.stage, 'flame33'), fAt = pagePos('p33', 'flame33');
  // his pipe smoke curls from the pipe bowl in her ink (man33-local px), over the hidden drawn smoke
  const MC = CUT.man33, s16sm = inkSmoke(mk('g', {}, man.g), (2290 - MC.pa[0]) * MC.sc, (800 - MC.pa[1]) * MC.sc, { size: 8, rise: 150, drift: 34, curl: 13, period: 2.2, ink: 1.8, seed: 3 });
  const s16r = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  // ---- the refrain over the room: all in frame space, above the camera ----
  const veil = mk('rect', { width: 1600, height: 900, fill: '#efe8d6', opacity: 0, visibility: 'hidden', 'pointer-events': 'none' }, p);
  const NAMES = ['cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat23e', 'cat23f', 'cat23g', 'cat23h', 'cat22a', 'cat22b', 'cat22c', 'cat22d'];
  const crowd = catCrowd(p, { names: NAMES, n: 72, box: [-260, 440, 1330, 880], seed: 14, s: [2.3, 1.2] });
  const hunT = s16M('m14b.hun'), trilT = s16M('m14b.tril'), notT = s16NOT();
  const when = i => hunT - .1 + Math.pow(i / 72, 1.25) * (trilT + .9 - hunT);
  const L = lettering(p, s16RF.map(w => w[0]), { x: 800, y: 285, s: 1.6 });
  const times = {}; for (const [n, m, d] of s16RF) times[n] = s16M(m) + d;
  const box = L.items.reduce((b, it) => { const C = it.p.C, k = 1.6, l = it.x - C.ax * k, t = it.y - C.ay * k, w = C.parts[0].w * k, h = C.parts[0].h * k;
    return [Math.min(b[0], l), Math.min(b[1], t), Math.max(b[2], l + w), Math.max(b[3], t + h)]; }, [1e9, 1e9, -1e9, -1e9]);
  const slip = mk('g', {}, p);   // a soft glow only: no edge, no shadow
  slip.innerHTML = `<defs><filter id="s16glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="30"/></filter></defs><rect x="${box[0] - 30}" y="${box[1] - 24}" width="${box[2] - box[0] + 60}" height="${box[3] - box[1] + 48}" rx="40" fill="#efe8d6" filter="url(#s16glow)"/>`;
  p.insertBefore(slip, L.g);   // the slip under her letters

  // ---- p34: the cat asleep ----
  const B = paperCam(p, 'p34', { x: 815, y: 560, z: 1.5 });
  const fl = cutPuppet(B.stage, 'flower34'), flAt = pagePos('p34', 'flower34'), sl = cutPuppet(B.stage, 'sleeper34'), slAt = pagePos('p34', 'sleeper34');
  B.to({ x: 815, y: 540, z: 1.7 }, s16TURN + .5, Math.max(4, D - s16TURN - .5));   // a slow hold to the last frame

  const turnOut = pageTurn(p, 0, .6, 'out');
  const ta = pageTurn(p, s16TURN - .5, .5, 'in'), ga = p.lastChild, tb = pageTurn(p, s16TURN, .5, 'out'), gb = p.lastChild;

  stopClock(D, (q, f) => {
    const onA = q < s16TURN; vis(A.root, onA); vis(B.root, !onA);
    if (onA) {
      A.apply(q, f);
      // she rocks slowly, he rocks out of step with her; each pulses a little with his or her voice, and breathes
      const rw = Math.sin(q * 2 * Math.PI / 2.9) * 2.6, rm = Math.sin(q * 2 * Math.PI / 3.4 + 1.3) * 2.0;
      // her head nods over the work and tilts with her voice; the needles click on twos in runs, her hands with them
      const tw = s16talk(q, 0), tm = s16talk(q, 1) || s16talk(q, 2), run = (q % 1.9) < 1.3 ? 1 : .35;
      woman.pose({ ...wAt, rot: rw, sq: 1 + .012 * Math.sin(q * 2.2) + .012 * tw, bob: 2.5 * tw,
        parts: { head: 2.5 * Math.sin(q * 1.5) + tw * 5 * Math.sin(q * 8.4 + 1), hands: 1.8 * run * onTwos(q) + .6 * Math.sin(q * 2.1) } }, f);
      man.pose({ ...mAt, rot: rm, sq: 1 + .01 * Math.sin(q * 2.0 + 1) + .01 * tm, bob: 2 * tm, hide: ['smoke'],
        parts: { head: 2 * Math.sin(q * 1.2 + 1) + tm * 3 * Math.sin(q * 7.3), hands: .8 * Math.sin(q * 1.7) + tm * 2.5 * Math.sin(q * 6.1 + 2) } }, f);
      s16sm(q);
      const k = Math.floor(q * 6), r1 = s16r(k), r2 = s16r(k + 100), r3 = s16r(k + 200);
      flame.pose({ ...fAt, s: fAt.s * (1.25 + 1.0 * r1), sq: 1 + .5 * r2, w: .85 + .5 * r3, sk: (r3 - .5) * 26 }, f);
      // the cat bats the yarn: small quick bats on twos in bursts, then licks a paw (a rest)
      const w = (q % 2.4) / 2.4, burst = w < .55 ? Math.sin(w / .55 * Math.PI) : 0;
      const cl = catLife(q, 2, { tail: 16, head: 9 });
      cat.pose({ ...cAt, parts: { ...cl.parts, head: cl.parts.head + burst * onTwos(q) * 6 }, rot: burst * onTwos(q) * 5, bob: burst * 2.5 * (onTwos(q) > 0 ? 1 : 0), sq: 1 + .015 * Math.sin(q * 3.1), move: { body: [burst * onTwos(q) * 2.5, 0] } }, f);
      // the refrain: the room dims, the crowd swells behind her letters, then all fades back on "and not one was as pretty"
      const swell = q >= hunT - .1 && q < notT ? 1 : 0;   // a cut to clean cream paper on the first word and a cut back to the room on "not one": no fade
      const live = swell > 0;
      for (const g of [veil, crowd.g, slip, L.g]) vis(g, live);
      if (live) {
        veil.setAttribute('opacity', swell.toFixed(3));
        crowd.g.setAttribute('opacity', swell.toFixed(3));   // full black ink
        for (const g of [slip, L.g]) g.setAttribute('opacity', swell.toFixed(3));
        crowd.pose(q, f, { from: 0, every: when, hop: false, walk: { v: 55, t0: hunT, t1: notT + .7 } });   // pop in as the words land, then walk with legs and tails
        L.show(q, times, f);
      }
    } else {
      for (const g of [veil, crowd.g, slip, L.g]) vis(g, false);
      B.apply(q, f);
      // the page's one live thing: the flower sways on its stem (twos), the sleeper breathes
      fl.pose({ ...flAt, sk: 4 * Math.sin(q * 1.3) + 1.5 * Math.sin(q * 3.1), rot: 1.2 * Math.sin(q * 1.3 + .8) }, f);
      sl.pose({ ...slAt, sq: 1 + .022 * (.5 + .5 * Math.sin(q * 1.7)), w: 1 + .008 * Math.sin(q * 1.7) }, f);
    }
    turnOut(q); ta(q); vis(ga, q > s16TURN - .5 && q < s16TURN); tb(q); vis(gb, q >= s16TURN && q < s16TURN + .5);
  });
}
