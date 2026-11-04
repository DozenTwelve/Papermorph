/* scene15.js — Bath and milk (p29, then the p30+p31 spread). Beat clock = PRE15 + the joined clip's seconds (T below).
   1 p29, wide: the very old woman has the kitten in her lap, the old man watches (0 – bath);
   2 close on her and the kitten: the bath ("warm bath", splash), then the brush strokes ("brushed" – "shiny"), the kitten's
     shiver when it is done and then still (bath – hole days15);
   3 page turn in the hole days15 to the milk spread: the camera travels down Gág's left slope and up her right one while the
     ten kittens-with-bowls appear one after another where she drew them ("Every day … plenty of milk"), each lapping a
     little, the kitten bigger every time; the last, plump cat sits at the top (milk10), with the empty bowl, and the camera
     settles on it (n13b – end). */
'use strict';
const PRE15 = .5;

const s15T = t => PRE15 + t;
const s15BATH = s15T(3.65), s15BRUSH = s15T(4.821), s15SHINY = s15T(7.336), s15TURN = s15T(8.702);   // covered at s15TURN, in the hole days15
// the kittens' times (clip s): one after another through "Every day they gave it plenty of milk, and soon it grew nice and plump"
const s15AP = [9.596, 10.045, 10.599, 11.033, 11.93, 12.267, 12.781, 12.933, 13.111, 13.365].map(s15T);
// the camera's path down one slope and up the other: [time, x, y, z], read with a smooth spline
const s15KEY = [[8.97, -130, 230, 2], [9.745, -110, 250, 2], [10.151, 10, 360, 1.95], [10.669, 190, 480, 1.9], [11.384, 390, 570, 1.85], [12.05, 640, 640, 1.8],
  [12.422, 990, 650, 1.75], [12.857, 1280, 610, 1.7], [13.01, 1440, 530, 1.7], [13.187, 1580, 430, 1.7], [13.466, 1720, 280, 1.8], [14.316, 1740, 235, 1.95], [16.816, 1750, 235, 2.25]].map(([t, x, y, z]) => [s15T(t), x, y, z]);
function s15path(t, k) {   // Catmull-Rom through s15KEY's column k at time t
  const K = s15KEY; if (t <= K[0][0]) return K[0][k]; if (t >= K[K.length - 1][0]) return K[K.length - 1][k];
  let i = 0; while (K[i + 1][0] < t) i++;
  const p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(K.length - 1, i + 2)], u = (t - p1[0]) / (p2[0] - p1[0]);
  const m1 = (p2[k] - p0[k]) / (p2[0] - p0[0]) * (p2[0] - p1[0]), m2 = (p3[k] - p1[k]) / (p3[0] - p1[0]) * (p2[0] - p1[0]);
  return (2 * u ** 3 - 3 * u ** 2 + 1) * p1[k] + (u ** 3 - 2 * u ** 2 + u) * m1 + (-2 * u ** 3 + 3 * u ** 2) * p2[k] + (u ** 3 - u ** 2) * m2;
}
// where Gág drew a piece on the spread (pagePos gives a wrong place for a two-page piece: its page is a list)
function s15pos(name) {
  const C = CUT[name], S = SETS.milk[0].page;
  return { x: S.wx + (C.pa[0] - S.x0) * S.s, y: S.wy + (C.pa[1] - S.y0) * S.s, s: S.s / C.sc };
}

sfx('scene15', 0, 'room', .35, { loop: true, to: s15TURN });
sfx('scene15', .05, 'page', .8);
sfx('scene15', s15BATH, 'splash', .8); sfx('scene15', s15BATH + .5, 'splash', .5); sfx('scene15', s15BATH + 1.0, 'splash', .35);
for (const [t, v] of [[0, .9], [1.5, .8], [3.0, .7]]) sfx('scene15', s15BRUSH + t, 'brush', v);   // each file is three soft strokes
sfx('scene15', s15SHINY + .2, 'purr', .25);
sfx('scene15', s15TURN - .5, 'page', .5);
sfx('scene15', s15AP[0] - .1, 'laps', .4, { loop: true });
s15AP.forEach((t, i) => { sfx('scene15', t, i % 3 === 2 ? 'mew' + (i % 4 + 1) : 'lap', i % 3 === 2 ? .3 : .5); sfx('scene15', t, 'pop', .3); });
sfx('scene15', s15T(13.213), 'purr', .3);

function scene15(p, D) {
  const pk = (q, t, w = .2) => Math.max(0, 1 - Math.abs(q - t) / w);

  // ---- p29: the bath ----
  const A = paperCam(p, 'p29', { x: 880, y: 520, z: 1.8 });
  A.to({ x: 870, y: 520, z: 2.0 }, .6, s15BATH - .6)
   .cut({ x: 830, y: 515, z: 3.1 }, s15BATH)                                   // close on her and the kitten
   .to({ x: 840, y: 505, z: 3.4 }, s15BATH, s15BRUSH - s15BATH)
   .to({ x: 850, y: 515, z: 3.0 }, s15BRUSH, s15TURN - s15BRUSH - .2)
   .to({ x: 880, y: 540, z: 2.2 }, s15SHINY + .5, 1.2);                        // out again for the man's nod
  const wAt = pagePos('p29', 'woman29'), mAt = pagePos('p29', 'man29'), kAt = pagePos('p29', 'kitten29');
  const man = cutPuppet(A.stage, 'man29'), woman = cutPuppet(A.stage, 'woman29'), kit = cutPuppet(A.stage, 'kitten29');

  // warm steam from the basin: slow, small ribbons in Gág's ink (s15W: page px of p29 to world)
  const s15W = (x, y) => { const S = SETS.p29[0].page; return [S.wx + (x - S.x0) * S.s, S.wy + (y - S.y0) * S.s]; };
  const s15stg = mk('g', {}, A.stage);
  const s15steam = [[1950, 1585, 3], [2040, 1595, 5], [2120, 1580, 8]].map(([x, y, sd]) => inkSmoke(s15stg, ...s15W(x, y), { size: 2.6, rise: 95, drift: 8, curl: 6, period: 3.4, ink: 1.3, seed: sd }));

  // ---- the milk spread ----
  const B = paperCam(p, 'milk', { x: s15path(s15KEY[0][0], 1), y: s15path(s15KEY[0][0], 2), z: s15path(s15KEY[0][0], 3) });
  B.cut({ x: t => s15path(t, 1), y: t => s15path(t, 2), z: t => s15path(t, 3) }, 0);
  const NAMES = ['milk1', 'milk2', 'milk3', 'milk4', 'milk5', 'milk6', 'milk7', 'milk8', 'milk9', 'milk10'];
  const ks = NAMES.map((n, i) => ({ p: cutPuppet(B.stage, n), at: s15pos(n), t: s15AP[i], g: .82 + .036 * i, ph: i * 1.37 }));   // the kitten grows
  const bowl = cutPuppet(B.stage, 'bowl31'), bAt = s15pos('bowl31');

  // two turns in the hole: the old page goes, the new one comes
  const turnOut = pageTurn(p, 0, .6, 'out');
  const ta = pageTurn(p, s15TURN - .5, .5, 'in'), ga = p.lastChild, tb = pageTurn(p, s15TURN, .5, 'out'), gb = p.lastChild;
  const turn = pageTurn(p, D - .1, .6, 'in');

  stopClock(D, (q, f) => {
    const onA = q < s15TURN; vis(A.root, onA); vis(B.root, !onA);
    if (onA) {
      A.apply(q, f);
      s15stg.setAttribute('opacity', (.9 * span(q, .3, 1.6)).toFixed(2)); s15steam.forEach(st => st(q));
      // the old man: stands, breathes, watches the bath (a lean in), nods on "brushed" and again when it is soft and shiny
      const nod = 5 * pk(q, s15BRUSH + .15, .25) + 4 * pk(q, s15T(6.415), .25) + 6 * pk(q, s15SHINY + .3, .3) + 2 * Math.sin(q * 1.1);
      man.pose({ ...mAt, sq: 1 + .012 * Math.sin(q * 2.2 + 1), rot: Math.sin(q * 1.2) * .9 + 1.2 * span(q, s15BATH - .5, s15BATH + .5), parts: { head: nod + 3 * Math.sin(q * 1.9) } }, f);
      // she bends to the bath, then brushes: the forearm strokes on twos from "brushed" to "shiny"
      const bru = q > s15BRUSH && q < s15SHINY ? Math.sin((q - s15BRUSH) * 9.5) * 17 * Math.min(1, (q - s15BRUSH) * 3) * Math.min(1, (s15SHINY - q) * 3) : 0;
      const bath = span(q, s15BATH - .3, s15BATH + .3) * (1 - span(q, s15BRUSH - .2, s15BRUSH)) * 9 * (1 + .25 * Math.sin(q * 11));   // a rub in the water
      woman.pose({ ...wAt, sq: 1 + .012 * Math.sin(q * 2.2), rot: Math.sin(q * 1.3 + 2) * .5 - 1.5 * span(q, s15BATH - .3, s15BATH + .3) * (1 - span(q, s15BRUSH + .3, s15BRUSH + .8)),
        parts: { armR: bru * 1 + bath - 4 * pk(q, s15BRUSH, .3), head: 1.6 * Math.sin(q * 1.4) + bru * .28 + bath * .3 } }, f);
      // the kitten on her lap: squirms in the water, small shake when she dries it, a shiver when it is done, then still
      const shiver = q > s15SHINY + .1 && q < s15SHINY + 1.0 ? Math.sin((q - s15SHINY) * 40) * 3 * (1 - span(q, s15SHINY + .1, s15SHINY + 1.0)) : 0;
      const squirm = span(q, s15BATH, s15BATH + .4) * (1 - span(q, s15BRUSH, s15BRUSH + .3)) * Math.sin(q * 7) * 4;
      const kl = catLife(q, .5, { tail: 14, head: 6 });
      kit.pose({ ...kAt, parts: kl.parts, sq: 1 + .02 * Math.sin(q * 2.8) * (q < s15SHINY ? 1 : .3), rot: squirm + shiver + (q > s15BRUSH && q < s15SHINY ? Math.sin(q * 9.5) * 1.5 : 0),
        bob: pk(q, s15BATH + .1, .15) * 3 }, f);
    } else {
      B.apply(q, f);
      ks.forEach((k, i) => {
        const u = q - k.t; vis(k.p.g, u >= 0); if (u < 0) return;
        const pop = u < .34 ? Math.sin(u / .34 * Math.PI) * 22 : 0;
        // lapping: dips on twos in bursts (a head down, a tail flick), the plump one only breathes and blinks a tail
        const w = ((q + k.ph) % 1.6) / 1.6, bursting = w < .6 && i < 9 ? Math.sin(w / .6 * Math.PI) : 0;
        const dip = bursting * onTwos(q) * 2.4 + (i < 9 ? 1.2 * Math.sin((q + k.ph) * 2.4) : Math.sin(q * 1.3) * .8);
        const flick = ((q + k.ph * 2) % 3.1) < .3 ? 3 * onTwos(q) : 0;
        const s = k.at.s * k.g * (i === 9 ? 1 + .05 * span(q, s15T(12.908), s15T(13.516)) : 1);
        const hd = i < 9 ? bursting * onTwos(q) * 9 + 2 * Math.sin((q + k.ph) * 2.4) : catLife(q, k.ph, { head: 8 }).parts.head;   // the head dips and lifts on each lap
        k.p.pose({ ...k.at, s, bob: pop, rot: dip * .6 + flick, sq: 1 + .014 * Math.sin(q * 2.2 + k.ph),
          w: 1 + .05 * span(q, k.t + .3, k.t + 2.4) + .014 * Math.sin(q * 1.5 + k.ph), parts: { head: hd } }, f + i);   // plumper within each picture, and a slow swell
      });
      vis(bowl.g, q >= s15AP[9]);
      bowl.pose({ ...bAt, bob: q - s15AP[9] < .3 ? Math.sin((q - s15AP[9]) / .3 * Math.PI) * 14 : 0 }, f);
    }
    turnOut(q); ta(q); vis(ga, q > s15TURN - .5 && q < s15TURN); tb(q); vis(gb, q >= s15TURN && q < s15TURN + .5); turn(q);
  });
}
