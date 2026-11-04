/* scene16.js — The prettiest cat (p33, then p34). Beat clock = PRE16 + the joined clip's seconds (T below).
   1 p33 wide: the evening at home, she knits and rocks, he smokes and rocks, the cat plays with the yarn (0 – T(.95));
   2 close on her, w14 "And it is a very pretty cat, after all!" (to T(2.5)); 3 insert on the cat and its yarn (to T(3.9));
   4 close on her for "said the very old woman" (to T(6.65)); 5 close on him with his pipe smoke, m14 "the most beautiful cat
     in the whole world" and "said the very old man" (to T(12.7)); 6 the wide again, and on "hundreds … trillions" the room
     dims, Gág's refrain lettering comes over it on a slip of paper with a ghost of the crowd swelling behind, and all fades
     back on "and not one was as pretty as this one" (T(13.5) – T(21.0)); 7 insert on the cat (to the hole sleep16);
   8 page turn in the hole to p34: the cat asleep under its flower, a slow push, and the end card below it. */
'use strict';
const PRE16 = .5;

const s16T = t => PRE16 + t;
const s16M = m => markAt('scene16', PRE16, m);
const s16CUT = [.95, 2.5, 3.9, 6.65, 12.7, 20.4].map(s16T);   // cuts: wide | woman | cat | woman | man | wide | cat
const s16TURN = s16T(23.35);                                  // covered here, in the hole sleep16
const s16SAY = [[.22, 2.4], [6.9, 9.8], [13.74, 22.4]];       // when her / his own voice is speaking (clip seconds)
const s16talk = (q, i) => { const [a, b] = s16SAY[i]; return q >= s16T(a) && q < s16T(b) ? Math.abs(Math.sin((q - s16T(a)) * 8.4)) : 0; };
// the refrain's words, in time: the five numbers on their marks, the little words on the words file's times
const s16RF = [['rf-hundreds', 'm14b.hun'], ['rf-of1', 15.76], ['rf-cats4', 15.88], ['rf-thousands', 'm14b.thou'], ['rf-of2', 16.95], ['rf-cats5', 17.07],
  ['rf-millions', 'm14b.mil'], ['rf-and2', 18.3], ['rf-billions', 'm14b.bil'], ['rf-and3', 18.89], ['rf-trillions', 'm14b.tril'], ['rf-of3', 19.49], ['rf-cats6', 19.61]];
const s16NOT = () => s16M('m14b.not');

sfx('scene16', 0, 'fire', .3, { loop: true, to: s16TURN });
sfx('scene16', .05, 'page', .8);
for (let k = 0; k < 7; k++) sfx('scene16', +(.3 + k * 2.9).toFixed(2), 'rock', .2);
for (let k = 0; k < 6; k++) sfx('scene16', +(1.5 + k * 3.4).toFixed(2), 'rock', .16);
sfx('scene16', s16CUT[1], 'purr', .22);
sfx('scene16', s16T(1.0), 'mew1', .25);
sfx('scene16', s16T(15.35), 'mews', .2); sfx('scene16', s16T(16.49), 'mews', .28); sfx('scene16', s16T(17.71), 'mews', .36);
sfx('scene16', s16T(18.43), 'mews', .42); sfx('scene16', s16T(18.99), 'mews', .5);
sfx('scene16', s16T(20.15), 'chime', .3); sfx('scene16', s16T(20.5), 'purr', .25);
sfx('scene16', s16TURN - .5, 'page', .5);

function scene16(p, D) {
  const pk = (q, t, w = .2) => Math.max(0, 1 - Math.abs(q - t) / w);

  // ---- p33: the evening ----
  const A = paperCam(p, 'p33', { x: 820, y: 470, z: 1.4 });
  A.to({ x: 820, y: 470, z: 1.55 }, .6, s16CUT[0] - .6)
   .cut({ x: 505, y: 475, z: 2.5 }, s16CUT[0]).to({ x: 515, y: 470, z: 2.65 }, s16CUT[0], s16CUT[1] - s16CUT[0])      // her, w14
   .cut({ x: 770, y: 585, z: 3.3 }, s16CUT[1]).to({ x: 760, y: 590, z: 3.5 }, s16CUT[1], s16CUT[2] - s16CUT[1])      // the cat and its yarn
   .cut({ x: 500, y: 480, z: 2.4 }, s16CUT[2]).to({ x: 510, y: 475, z: 2.55 }, s16CUT[2], s16CUT[3] - s16CUT[2])    // "said the very old woman"
   .cut({ x: 1020, y: 345, z: 2.5 }, s16CUT[3]).to({ x: 1020, y: 355, z: 2.75 }, s16CUT[3], s16CUT[4] - s16CUT[3])  // him, m14
   .cut({ x: 820, y: 470, z: 1.6 }, s16CUT[4]).to({ x: 820, y: 460, z: 1.35 }, s16CUT[4], 1.2)                      // pull back: the refrain
   .to({ x: 820, y: 470, z: 1.3 }, s16T(14), s16T(20) - s16T(14))
   .cut({ x: 775, y: 590, z: 3.0 }, s16CUT[5]).to({ x: 765, y: 592, z: 3.6 }, s16CUT[5], s16TURN - s16CUT[5]);       // the cat, "pretty as this one"
  const wAt = pagePos('p33', 'woman33'), mAt = pagePos('p33', 'man33'), cAt = pagePos('p33', 'cat33');
  const woman = cutPuppet(A.stage, 'woman33'), man = cutPuppet(A.stage, 'man33'), cat = cutPuppet(A.stage, 'cat33');

  // ---- the refrain over the room: all in frame space, above the camera ----
  const veil = mk('rect', { width: 1600, height: 900, fill: '#150b05', opacity: 0, visibility: 'hidden', 'pointer-events': 'none' }, p);
  const NAMES = ['cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat23e', 'cat23f', 'cat23g', 'cat23h', 'cat22a', 'cat22b', 'cat22c', 'cat22d'];
  const crowd = catCrowd(p, { names: NAMES, n: 72, box: [40, 430, 1560, 880], seed: 14, s: [2.3, 1.2] });
  const hunT = s16M('m14b.hun'), trilT = s16M('m14b.tril'), notT = s16NOT();
  const when = i => hunT - .1 + Math.pow(i / 72, 1.25) * (trilT + .9 - hunT);
  const L = lettering(p, s16RF.map(w => w[0]), { x: 800, y: 285, s: 1.6 });
  const times = {}; for (const [n, t] of s16RF) times[n] = typeof t === 'string' ? s16M(t) : s16T(t);
  const box = L.items.reduce((b, it) => { const C = it.p.C, k = 1.6, l = it.x - C.ax * k, t = it.y - C.ay * k, w = C.parts[0].w * k, h = C.parts[0].h * k;
    return [Math.min(b[0], l), Math.min(b[1], t), Math.max(b[2], l + w), Math.max(b[3], t + h)]; }, [1e9, 1e9, -1e9, -1e9]);
  const slip = prop(p, `<g filter="url(#paper)"><rect x="${box[0] - 40}" y="${box[1] - 34}" width="${box[2] - box[0] + 80}" height="${box[3] - box[1] + 68}" rx="18" fill="#f4ecd6"/></g>`);
  p.insertBefore(slip, L.g);   // the slip under her letters

  // ---- p34: the cat asleep ----
  const B = paperCam(p, 'p34', { x: 815, y: 560, z: 1.5 });
  B.to({ x: 815, y: 548, z: 1.66 }, s16TURN + .5, 4);
  const card = endCard(p, s16T(24.6), 'The End', { x: 800, y: 765, size: 56 });

  const turnOut = pageTurn(p, 0, .6, 'out');
  const ta = pageTurn(p, s16TURN - .5, .5, 'in'), ga = p.lastChild, tb = pageTurn(p, s16TURN, .5, 'out'), gb = p.lastChild;

  stopClock(D, (q, f) => {
    const onA = q < s16TURN; vis(A.root, onA); vis(B.root, !onA);
    if (onA) {
      A.apply(q, f);
      // she rocks slowly, he rocks out of step with her; each pulses a little with his or her voice, and breathes
      const rw = Math.sin(q * 2 * Math.PI / 2.9) * 2.6, rm = Math.sin(q * 2 * Math.PI / 3.4 + 1.3) * 2.0;
      woman.pose({ ...wAt, rot: rw, sq: 1 + .012 * Math.sin(q * 2.2) + .012 * s16talk(q, 0), bob: 2.5 * s16talk(q, 0) }, f);
      const sm = Math.sin(q * 1.3);
      man.pose({ ...mAt, rot: rm, sq: 1 + .01 * Math.sin(q * 2.0 + 1) + .01 * (s16talk(q, 1) || s16talk(q, 2)), bob: 2 * (s16talk(q, 1) || s16talk(q, 2)),
        parts: { smoke: 7 * sm + 3 * Math.sin(q * 3.1) }, move: { smoke: [4 * Math.sin(q * 1.7 + 1), -3 * Math.abs(Math.sin(q * 0.9))] } }, f);
      // the cat bats the yarn: small quick bats on twos in bursts, then licks a paw (a rest)
      const w = (q % 2.4) / 2.4, burst = w < .55 ? Math.sin(w / .55 * Math.PI) : 0;
      cat.pose({ ...cAt, rot: burst * onTwos(q) * 5, bob: burst * 2.5 * (onTwos(q) > 0 ? 1 : 0), sq: 1 + .015 * Math.sin(q * 3.1), move: { body: [burst * onTwos(q) * 2.5, 0] } }, f);
      // the refrain: the room dims, the crowd swells behind her letters, then all fades back on "and not one was as pretty"
      const swell = span(q, hunT - .35, hunT + .6) * (1 - span(q, notT, notT + .7));
      const live = swell > 0;
      for (const g of [veil, crowd.g, slip, L.g]) vis(g, live);
      if (live) {
        veil.setAttribute('opacity', (.68 * swell).toFixed(3));
        crowd.g.setAttribute('opacity', (swell * (.2 + .35 * span(q, hunT, trilT + .6))).toFixed(3));
        for (const g of [slip, L.g]) g.setAttribute('opacity', swell.toFixed(3));
        crowd.pose(q, f, { from: 0, every: when, hop: false });
        L.show(q, times, f);
      }
    } else {
      for (const g of [veil, crowd.g, slip, L.g]) vis(g, false);
      B.apply(q, f);
    }
    card(q); turnOut(q); ta(q); vis(ga, q > s16TURN - .5 && q < s16TURN); tb(q); vis(gb, q >= s16TURN && q < s16TURN + .5);
  });
}
