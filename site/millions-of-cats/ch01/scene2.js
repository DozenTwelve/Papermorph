/* scene2.js — Over the hills (p06+p07 as one spread, set `hills`; layer `clouds` drifts by parallax). The old man (man5,
   lifted off p05, tiny here) walks from the house in the valley over the ridges: five shots, each a stretch of the
   way, so a walk of a few hundred px per shot makes the whole long journey (a cut is the time that passes). He walks
   with cutWalk, legs on pins, feet planted; the camera follows. Beat clock = PRE2 + the scene-clip word times. */
'use strict';
const PRE2 = 1.2;                    // the page turn uncovers the valley, then "And he set out"
const S2_S = .17;                    // his size on this spread (Gág's ridge man was about 43 px; the piece is ~340 px tall)
// The spread's top edge (world x, y of the first ink), read off the set: he walks the crest, against the blank sky.
const S2_TOP = [[330,521],[360,515],[400,509],[440,507],[480,512],[520,523],[560,537],[580,542],[600,530],[620,513],[640,499],[660,485],[680,473],[700,457],[720,447],[740,438],[760,431],[780,424],[800,424],[820,450],[840,454],[860,438],[880,430],[900,421],[920,413],[940,398],[960,395],[980,377],[1000,367],[1020,353],[1040,340],[1060,333],[1080,330],[1100,319],[1120,303],[1140,292],[1160,276],[1180,240],[1200,226],[1220,214],[1240,200],[1260,196],[1280,192],[1300,190],[1320,196],[1340,213],[1360,213],[1380,207],[1400,210],[1420,220],[1440,247],[1460,252],[1480,255],[1500,272],[1520,276],[1540,270],[1560,272],[1580,274],[1600,273],[1620,271],[1640,267],[1660,261],[1680,260],[1700,266],[1720,264],[1740,259],[1760,256],[1780,261],[1800,264],[1820,268],[1840,263],[1860,255],[1880,249],[1900,246],[1920,234],[1940,224]];
function s2_top(x) {
  const T = S2_TOP; if (x <= T[0][0]) return T[0][1]; if (x >= T[T.length - 1][0]) return T[T.length - 1][1];
  let i = 0; while (T[i + 1][0] < x) i++;
  return T[i][1] + (T[i + 1][1] - T[i][1]) * (x - T[i][0]) / (T[i + 1][0] - T[i][0]);
}
// The crest from x0 to x1, a little smoothed (trees and spires would make him bob), his feet a few px inside the hatching.
function s2_crest(x0, x1) {
  const pts = [], sm = x => { let a = 0; for (let k = -3; k <= 3; k++) a += s2_top(x + k * 14); return a / 7; };
  for (let x = x0; x <= x1; x += 10) pts.push([x, sm(x) + 9]);
  return pts;
}
// Where he is after walking `u` px along a polyline: x, y and the slope's angle (degrees).
function s2_along(poly, u) {
  let acc = 0;
  for (let i = 1; i < poly.length; i++) {
    const [ax, ay] = poly[i - 1], [bx, by] = poly[i], len = Math.hypot(bx - ax, by - ay);
    if (u <= acc + len || i === poly.length - 1) {
      const k = Math.min(1, Math.max(0, (u - acc) / len));
      return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, ang: Math.atan2(by - ay, bx - ax) * 180 / Math.PI };
    }
    acc += len;
  }
}

// The shots. go = when his feet start, stop = when he stands (snapped to a whole step so both legs are together).
const S2_SHOTS = [
  { t0: 0,        go: PRE2 + .05, stop: 99, poly: [[-132, 782], [-95, 789], [-40, 773], [10, 750], [60, 740], [130, 752]], z: 1.5, vol: .12 },
  { t0: PRE2 + 2.75, go: PRE2 + 2.9, stop: 99, poly: s2_crest(610, 800), z: 2.3, vol: .12, period: .5 },
  { t0: PRE2 + 5.15, go: PRE2 + 5.2, stop: 99, poly: s2_crest(770, 960), z: 2.3, vol: .1, period: .6, A: 17, slump: 1 },
  { t0: PRE2 + 7.5,  go: PRE2 + 7.5, stop: 99, poly: s2_crest(960, 1200), z: 1.0, vol: .05, period: .5 },
  { t0: PRE2 + 10.05, go: PRE2 + 10.1, stop: PRE2 + 13.6, poly: s2_crest(1530, 1745), z: 2.2, vol: .12, period: .5 },
];

function scene2(p, D) {
  const P = PRE2, T = (c, t = 0) => clipAt('scene2', P, c, t);
  const cam = paperCam(p, 'hills');
  cam.world.insertBefore(mk('rect', { x: -3000, y: -2000, width: 8000, height: 5000, fill: '#eee8d6' }), cam.world.firstChild);   // the set's sky is cut out under the clouds; parallax would show the stage
  const man = cutPuppet(cam.stage, 'man5');
  const out = pageTurn(p, 0, .6, 'out'), turn = pageTurn(p, D - .1, .6, 'in');
  for (const s of S2_SHOTS) { s.period ??= .5; s.A ??= 20; s.L = 128; }

  // Where he is at beat time q: the shot, his steps, the slope under his feet.
  function manAt(q) {
    let s = S2_SHOTS[0]; for (const k of S2_SHOTS) if (q >= k.t0) s = k;
    const half = s.period / 2, tau = Math.max(0, Math.min(q - s.go, Math.floor((s.stop - s.go) / half) * half));
    const w = cutWalk(tau, { L: s.L, A: s.A, period: s.period });
    const at = s2_along(s.poly, w.d * S2_S), walking = q >= s.go && tau < Math.floor((s.stop - s.go) / half) * half - 1e-6;
    return { ...at, w, s, tau, walking };
  }

  // Cameras: wide on the valley with him at the door; close on the crest, following; wide again for the long walk,
  // the camera going ahead of him; then the last ridge, pushing in as he stops.
  const lead = 90, fx = t => Math.min(manAt(t).x + lead, 1611), fy = t => manAt(t).y - 42;
  cam.cut({ x: fx, y: fy, z: 2.5 }, 0);
  cam.cut({ x: fx, y: fy, z: 2.3 }, S2_SHOTS[1].t0);
  cam.cut({ x: fx, y: fy, z: 2.3 }, S2_SHOTS[2].t0);
  cam.cut({ x: 960, y: 330, z: 1.0 }, S2_SHOTS[3].t0).to({ x: 1200, y: 320, z: 1.05 }, S2_SHOTS[3].t0, P + 10.9 - S2_SHOTS[3].t0);
  cam.cut({ x: fx, y: fy, z: 2.2 }, S2_SHOTS[4].t0).to({ z: 2.7 }, T('n02', 13.0), 2.0);

  // Sound: wind in the grass and birds; his steps (a soft shoe, in turn), quieter the further he is.
  sfx('scene2', 0, 'meadow', .5, { loop: true }); sfx('scene2', 0, 'birds', .3, { loop: true });
  let n = 0;
  for (const s of S2_SHOTS) {
    const t1 = Math.min(s.stop, S2_SHOTS[S2_SHOTS.indexOf(s) + 1]?.t0 ?? D);
    for (let k = 0; ; k++) { const t = s.go + s.period / 4 + k * s.period / 2; if (t >= t1 - .05) break; sfx('scene2', t, 'step' + (1 + n++ % 3), s.vol); }
  }
  sfx('scene2', D - .15, 'page', .6);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const m = manAt(q), s = m.s, w = m.w, still = !m.walking;
    const slope = m.ang, lean = still ? 0 : (slope < -8 ? 7 : 3);
    // trudging through the valleys: head down, a little slumped
    const slump = s.slump && q < T('n02', 7.4) ? .97 : 1;
    man.pose({
      x: m.x, y: m.y, s: S2_S, rot: Math.max(-6, Math.min(6, slope * .25)) + lean + (still ? Math.sin(q * 1.7) * .8 : 0),
      bob: (still ? 0 : w.bob * S2_S) + (still && q > T('n02', 13.7) && q < T('n02', 13.7) + .4 ? Math.sin((q - T('n02', 13.7)) / .4 * Math.PI) * 9 : 0),
      sq: slump * (1 + .012 * Math.sin(q * 2.2)),
      parts: still ? { legL: 0, legR: 0 } : { legL: w.legL, legR: w.legR },
      move: { smoke: [Math.sin(q * 1.3) * 3, -Math.abs(Math.sin(q * 1.1)) * 4] },
    }, f);
    out(q); turn(q);
  });
}
