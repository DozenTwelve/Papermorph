/* scene2.js — Over the hills (p06+p07 as one spread, set `hills`; layer `clouds` drifts by parallax). The old man (man5,
   lifted off p05, tiny here) walks from the house in the valley over the ridges, then turns the page to p08 (the hill of cats): five shots, each a stretch of the
   way, so a walk of a few hundred px per shot makes the whole long journey (a cut is the time that passes). He walks
   with cutWalk, legs on pins, feet planted; the camera follows. Beat clock = PRE2 + the scene-clip word times. */
'use strict';
const PRE2 = 1.2;                    // the page turn uncovers the valley, then "And he set out"
const S2_TURN = PRE2 + 11.45;       // "at last he came to a hill": the page turns to p08
const S2_S = .17;                    // his size on this spread (Gág's ridge man was about 43 px; the piece is ~340 px tall)
// The spread's top edge (world x, y of the first ink), read off the set: he walks the crest, against the blank sky.
const S2_GAP = 30;
const S2_TOP = [[330,521],[360,515],[400,509],[440,507],[480,512],[520,523],[560,537],[580,542],[600,530],[620,513],[640,499],[660,485],[680,473],[700,457],[720,447],[740,438],[760,431],[780,424],[800,424],[820,450],[840,454],[860,438],[880,430],[900,421],[920,413],[940,398],[960,395],[980,377],[1000,367],[1020,353],[1040,340],[1060,333],[1080,330],[1100,319],[1120,303],[1140,292],[1160,276],[1180,240],[1200,226],[1220,214],[1240,200],[1260,196],[1280,192],[1300,190],[1320,196],[1340,213],[1360,213],[1380,207],[1400,210],[1420,220],[1440,247],[1460,252],[1480,255],[1500,272],[1520,276],[1540,270],[1560,272],[1580,274],[1600,273],[1620,271],[1640,267],[1660,261],[1680,260],[1700,266],[1720,264],[1740,259],[1760,256],[1780,261],[1800,264],[1820,268],[1840,263],[1860,255],[1880,249],[1900,246],[1920,234],[1940,224]];
function s2_top(x) {
  x += S2_GAP * Math.min(1, Math.max(0, (x - 780) / 40));   // the set's right page was moved 30 px left to close the gutter
  const T = S2_TOP; if (x <= T[0][0]) return T[0][1]; if (x >= T[T.length - 1][0]) return T[T.length - 1][1];
  let i = 0; while (T[i + 1][0] < x) i++;
  return T[i][1] + (T[i + 1][1] - T[i][1]) * (x - T[i][0]) / (T[i + 1][0] - T[i][0]);
}
// The crest from x0 to x1, a little smoothed (trees and spires would make him bob), his feet a few px inside the hatching.
function s2_crest(x0, x1) {
  const pts = [], sm = x => { let a = 0; for (let k = -3; k <= 3; k++) a += s2_top(x + k * 14); return a / 7; };
  for (let x = x0; x <= x1; x += 10) pts.push([x, sm(x) + 14]);
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
  { t0: PRE2 + 2.75, go: PRE2 + 2.9, stop: 99, poly: s2_crest(610, 765), z: 2.3, vol: .12, period: .5 },
  { t0: PRE2 + 5.15, go: PRE2 + 5.2, stop: 99, poly: [[900, 506], [925, 475], [950, 437], [975, 409], [1000, 394], [1060, 362]], z: 2.3, vol: .1, period: .6, A: 17, slump: 1 },
  // the long walk: on the road (the pale path up the ridge to the crest), the camera on him
  { t0: PRE2 + 7.5,  go: PRE2 + 7.5, poly: [[1000, 394], [1060, 364], [1100, 337], [1150, 315], [1200, 300], [1300, 287]], z: 2.0, vol: .1, period: .5, stop: S2_TURN },
];

// p08 (set cathill): the old man from behind and the cats on the hill. Shared with scene3, which holds the same picture.
// Returns pose(q, f, u, fl): u 0..1 the arms rising (on their pins), fl the surprise flutter.
function s2_hill(cam) {
  const man = cutPuppet(cam.stage, 'man8'), at = pagePos('cathill', 'man8');
  const pets = ['cat8a', 'cat8c', 'cat8d', 'cat8e'].map((n, i) => ({ n, i, p: cutPuppet(cam.stage, n), at: pagePos('cathill', n) }));
  cam.world.insertBefore(mk('rect', { x: -3000, y: -2000, width: 8000, height: 5000, fill: '#eee8d6' }), cam.world.firstChild);
  return (q, f, u, fl) => {
    man.pose({
      x: at.x, y: at.y, s: at.s, sq: 1 + .012 * Math.sin(q * 2.2), rot: Math.sin(q * 1.3) * .5,
      bob: u > 0 && u < 1 ? Math.sin(u * Math.PI) * 9 : 0,
      parts: { armL: -75 * (1 - u) + fl + 3 * Math.sin(q * 1.6) + 4 * u * Math.sin(q * 3.3), armR: 75 * (1 - u) - fl - 3 * Math.sin(q * 1.6 + 1) - 4 * u * Math.sin(q * 3.3 + 2),
        head: -7 * u + Math.sin(q * 1.8) * 1.2 + (1 - u) * 5 * Math.sin(q * .8) },   // before: looking slowly along the hill; after: arms up and waving in awe
    }, f);
    for (const c of pets) { const cl = catLife(q, c.i * 1.3 + .4);
      c.p.pose({ x: c.at.x, y: c.at.y, s: c.at.s, rot: Math.sin(q * 2.4 + c.i * 2) * 1.6 + cl.rot, parts: cl.parts, sq: 1 + .012 * Math.sin(q * 2.6 + c.i), bob: (q + c.i * 1.1) % 2.3 < .2 ? Math.sin(((q + c.i * 1.1) % 2.3) / .2 * Math.PI) * 4 : 0 }, f + c.i); }
  };
}
const S2_HILLCAM = { x: 640, y: 560, z: 1.95 };   // where the p08 shot ends, and scene3 begins

function scene2(p, D) {
  const P = PRE2, T = (c, t = 0) => clipAt('scene2', P, c, t);
  const cam = paperCam(p, 'hills');
  cam.world.insertBefore(mk('rect', { x: -3000, y: -2000, width: 8000, height: 5000, fill: '#eee8d6' }), cam.world.firstChild);   // the set's sky is cut out under the clouds; parallax would show the stage
  const man = cutPuppet(cam.stage, 'man5');
  cam.move('clouds', q => `translate(${(-.2 * (cam.at(q).x - cam.at(0).x) + 18 * Math.sin(q * .45)).toFixed(1)} 0)`);   // the parallax is cancelled so the cut edge of the cloud band stays at the gutter, off screen
  //   // Gág's clouds drift to and fro (a steady drift would pull the spread's cut edge out of the sky)
  const pipeG = mk('g', {}, cam.stage), pipe = inkSmoke(pipeG, 0, 0, { size: 1.1, rise: 24, drift: 7, curl: 2.4, waves: 1.4, period: 1.6, ink: .7, seed: 4 });
  const cam1 = paperCam(p, 'cathill'), hill = s2_hill(cam1);
  const out = pageTurn(p, 0, .6, 'out'), tin = pageTurn(p, S2_TURN, .3, 'in'), tout = pageTurn(p, S2_TURN + .3, .3, 'out');
  const SW = S2_TURN + .3, UP = T('n02', 13.0), UPEND = T('n02', 13.75);   // the swap under the turned leaf; arms up on "covered with cats"
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
  // (the grey smudge where Gág's own figure was lifted off the ridge, near x 1340-1380, stays out of frame)
  // The spread's join (world x 800) is Gág's gutter: the two pages are out of register, so no shot may show it. The shots
  // before 6.35 s keep the camera on the left page (its right edge stays left of 800), the ones after on the right page.
  const lead = 90, fx = t => { const m = manAt(t); return t < S2_SHOTS[2].t0 ? Math.min(m.x + lead, 415) : Math.max(m.x + 30, 1085); },
  fy = t => manAt(t).y - 42;
  cam.cut({ x: fx, y: fy, z: 2.5 }, 0);
  cam.cut({ x: fx, y: fy, z: 2.3 }, S2_SHOTS[1].t0);
  cam.cut({ x: fx, y: fy, z: 3.2 }, S2_SHOTS[2].t0);   // left edge = cx - 250 stays right of the gutter (800)
  cam.cut({ x: fx, y: fy, z: 3.2 }, S2_SHOTS[3].t0);
  // p08: wide on the hill, then in on him as his arms rise; scene3 opens on the last framing
  cam1.cut({ x: 800, y: 470, z: 1.36 }, 0).to(S2_HILLCAM, SW, UPEND - SW);

  // Sound: wind in the grass and birds; his steps (a soft shoe, in turn), quieter the further he is.
  sfx('scene2', 0, 'meadow', .5, { loop: true }); sfx('scene2', 0, 'birds', .3, { loop: true });
  let n = 0;
  for (const s of S2_SHOTS) {
    const t1 = Math.min(s.stop, S2_SHOTS[S2_SHOTS.indexOf(s) + 1]?.t0 ?? D);
    for (let k = 0; ; k++) { const t = s.go + s.period / 4 + k * s.period / 2; if (t >= t1 - .05) break; sfx('scene2', t, 'step' + (1 + n++ % 3), s.vol); }
  }
  sfx('scene2', S2_TURN, 'page', .6); sfx('scene2', UP, 'whoosh', .22);

  stopClock(D, (q, f) => {
    const hillShot = q >= SW; vis(cam.root, !hillShot); vis(cam1.root, hillShot);
    if (hillShot) {
      cam1.apply(q, f);
      hill(q, f, span(q, UP, UPEND), q > UPEND ? Math.sin(q * 11) * 2.5 * span(q, UPEND, UPEND + .4) : 0);
      out(q); tin(0); tout(q); return;
    }
    cam.apply(q, f);
    const m = manAt(q), s = m.s, w = m.w, still = !m.walking;
    const slope = m.ang, lean = still ? 0 : (slope < -8 ? 7 : 3);
    // trudging through the valleys: head down, a little slumped
    const slump = s.slump && q < T('n02', 7.4) ? .97 : 1;
    const rotv = Math.max(-6, Math.min(6, slope * .25)) + lean + (still ? Math.sin(q * 1.7) * .8 : 0);
    man.pose({
      x: m.x, y: m.y, s: S2_S, rot: rotv,
      bob: (still ? 0 : w.bob * S2_S),
      sq: slump * (1 + .012 * Math.sin(q * 2.2)),
      parts: still ? { legL: 0, legR: 0, head: 2 * Math.sin(q * 1.3) } : { legL: w.legL, legR: w.legR, head: 3 * Math.sin(q * Math.PI * 2 / s.period + 1) + (s.slump ? 4 : 0) },
      hide: ['smoke'],
    }, f);
    const pa = rotv * Math.PI / 180, ddx = 18 * .358 * S2_S, ddy = -818 * .358 * S2_S;   // his pipe's end, rotated about his feet
    pipeG.setAttribute('transform', `translate(${(m.x + ddx * Math.cos(pa) - ddy * Math.sin(pa)).toFixed(1)} ${(m.y - (still ? 0 : w.bob * S2_S) + ddx * Math.sin(pa) + ddy * Math.cos(pa)).toFixed(1)})`);
    pipe(q);
    out(q); tin(q); tout(1e9);
  });
}
