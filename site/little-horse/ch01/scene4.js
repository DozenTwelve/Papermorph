/* scene4.js — Uncle Ox. The water is shallow FOR THE OX: he stands in it calmly chewing, and the insert on "shins" shows
   the waterline low on his lower leg. Little Horse runs over, asks, believes, and ends at the bank edge with his near
   fore hoof hanging over the water (scene 5 cuts in on Squirrel's shout).
   Staging: the ox faces Little Horse (turn -1) at x 1060 (scenes 2-5), his hooves 50 px under the waterline so it sits
   on his shins (the opaque water hides the hooves). Little Horse waits at the tree end of the bank (x 400, where scene 3
   leaves him), runs over to x 470 to talk, then runs to the bank lip (x 560) and lifts a hoof. */
'use strict';
const PRE4 = 1.0;
function scene4(p, D) {
  const W = (clip, t = 0) => clipAt('scene4', PRE4, clip, t);           // beat-clock time of a word in the scene clip
  const OX = { x: 1060, y: WATER + 50, s: 1.4, turn: -1 }, LHS = 1.05;
  const cam = setCam(p, 'river', { x: 1070, y: 525, z: 1.9 });

  // ---- shots ----
  const tFace = W('n04', 3.4), tTwo = W('n04', 5.72), tAsk = W('h04', -.08), tSize = W('h04', 2.35), tOx = W('o04', -.65),
    tShin = W('o04', 3.2), tBack = W('o04', 5.0), tHop = W('o04', 6.0), tFollow = W('n04b', .45), tEdge = W('n04b', 2.15);
  const LH_CLOSE = { x: 515, y: 470, z: 3.3 };                          // his head on the right third, the ox just out of frame
  cam.to({ z: 2.05 }, 0, tFace)                                          // 1 the old ox chewing in the shallows
    .cut({ x: 850, y: 545, z: 3.2 }, tFace).to({ z: 3.4 }, tFace, tTwo - tFace)   // 2 munching: the tuft in his mouth
    .cut({ x: 740, y: 560, z: 1.45 }, tTwo)                              // 3 two-shot: Little Horse runs over
    .cut(LH_CLOSE, tAsk)                                                 // 4 Little Horse's close-up, looking up: "Uncle Ox, please tell me."
    .cut({ x: 650, y: 515, z: 2.0 }, tSize)                              // 5 two-shot, the big ox and the small foal: "Can I wade across…?"
    .cut({ x: 925, y: 525, z: 2.8 }, tOx).to({ z: 2.95 }, tOx, tShin - tOx)   // 6 the ox: a slow blink, then his answer
    .cut({ x: 1035, y: 682, z: 3.2 }, tShin).to({ z: 3.45 }, tShin, tBack - tShin)   // 7 insert: water at his shins
    .cut(LH_CLOSE, tBack)                                                // 8 the foal's ears perk: "You can get across."
    .cut({ x: 700, y: 545, z: 1.8 }, tHop)                               // 9 two-shot: a happy rear, then the run to the edge
    .to({ x: 680, y: 560, z: 1.95 }, tFollow, 1.4)
    .cut({ x: 720, y: 535, z: 2.25 }, tEdge).to({ z: 2.4 }, tEdge, D + .6 - tEdge);   // 8 the hoof over the water, held
  cam.soft(tFace, true).soft(tTwo, false).soft(tAsk, true).soft(tSize, false).soft(tOx, true).soft(tHop, false).soft(tEdge, true);

  // ---- puppets ----
  const ox = oxPuppet(cam.stage), lh = horsePuppet(cam.stage);
  // ripples where the ox's front legs meet the water: they mark the waterline on the leg
  const ripple = () => prop(cam.world, `<g filter="url(#paper)"><path d="M-22,0 Q0,9 22,0" stroke="#d6eef3" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`);
  const rings = [ripple(), ripple(), ripple(), ripple()];
  // in the insert the set's opaque water gives way to a see-through band, so the legs under the waterline show
  let crest = 'M700,724'; for (let x = 700; x < 1400; x += 40) crest += ' q10,-5 20,0 q10,5 20,0';
  const band = prop(cam.world, `<g filter="url(#paperBig)"><path d="${crest} L1400,1060 L700,1060 Z" fill="#6fa6b8" fill-opacity=".7"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M${720 + i * 56},${748 + (i % 4) * 18} q16,-5 32,0" stroke="#b8dde6" stroke-width="3" fill="none"/>`).join('')}</g>`);
  // the film's depth mark: a dashed waterline across his legs while the insert says "shins"
  const line = prop(cam.world, `<path d="M820,${WATER} H1270" stroke="#f2fbff" stroke-width="4" stroke-dasharray="14 9" stroke-linecap="round" fill="none"/>`);

  // the ox speaks only inside the phrases of his clip; between them he chews
  const talk = []; { let a = null; for (const [t, k] of MOUTHS.o04 || []) { if (k !== 'X' && a === null) a = t; if (k === 'X' && a !== null) { talk.push([W('o04', a), W('o04', t)]); a = null; } } }
  const speaking = q => talk.some(([a, b]) => q >= a - .05 && q < b);
  // a slow, heavy blink: the lids sink, shut, and lift again
  const heavy = (q, times) => Math.max(0, ...times.map(t => q < t ? span(q, t - .3, t) : 1 - span(q, t + .2, t + .5)));

  const lhRoute = [[0, 400], [W('n04', 6.3), 400], [W('n04', 7.6), 470], [W('n04b', .45), 470], [W('n04b', 1.75), 560]];
  const tLift = W('n04b', 2.65);

  sfx('scene4', 0, 'river', .5);
  sfx('scene4', 0, 'birds', .35);
  sfx('scene4', lhRoute[1][0], 'trot', .45);
  sfx('scene4', lhRoute[3][0], 'trot', .4);
  sfx('scene4', lhRoute[4][0], 'skid', .25);
  sfx('scene4', tShin + .1, 'slosh', .3);

  stopClock(D, (q, f) => {
    cam.apply(q, f);

    // Uncle Ox: chewing with heavy lids; notices the foal as he runs over and slowly lifts his head to him
    const om = lips(q, 'scene4', PRE4, 'o04'), talking = speaking(q);
    const raise = span(q, W('n04', 6.9), W('n04', 8.6)) - span(q, W('o04', 6.4), W('o04', 7.6)) * .7;
    const bl = heavy(q, [W('n04', 1.5), W('n04', 4.9), W('h04', 3.3), W('o04', -.35), W('o04', 2.55), W('n04b', 1.9), W('edge4', .7)]);
    const up = span(q, W('o04', -.3), W('o04', .3)) - span(q, W('o04', 6.2), W('o04', 7.2));   // head lifted to the foal while he speaks
    const gulp = span(q, W('o04', .55), W('o04', .75)) - span(q, W('o04', .75), W('o04', .95));  // swallows the tuft after "Mmm."
    ox.pose({ ...OX, grass: q < W('o04', .65),
      chew: talking ? 0 : q * .85 + .01, mouth: talking ? om : 'X', jaw: talking ? Math.min(1, (JAW[om] || 0) * 1.6) : undefined,
      neck: 12 - 15 * raise - 9 * up + 2 * Math.sin(q * .85 * Math.PI * 2) * (talking ? 0 : 1),
      nod: 5 * gulp + 6 * (span(q, W('o04', 1.6), W('o04', 2.0)) - span(q, W('o04', 2.3), W('o04', 2.8)))   // "very shallow": a slow nod
        + 5 * (span(q, W('o04', 5.1), W('o04', 5.4)) - span(q, W('o04', 5.8), W('o04', 6.3))),  // "You can get across."
      look: q < W('n04', 6.4) ? -.2 * Math.sin(q * .7) : .8,
      ear: .6 * (span(q, W('n04', 6.4), W('n04', 6.6)) - span(q, W('n04', 6.7), W('n04', 7.0))) + .15 * Math.sin(q * .9),
      brow: talking && q < W('o04', .6) ? -.25 : 0,                    // "Mmm." considering
      lid: .45 + .55 * bl, shut: bl > .97,
      tail: 10 * Math.sin(q * 1.3), bob: 1.2 * Math.sin(q * 1.4) }, f);
    const insert = between(q, tShin, tBack);
    vis(line, insert); vis(band, insert); cam.show('water', !insert);
    const legs = [ox.at('nfHoof'), ox.at('ffHoof')];
    rings.forEach((g, i) => {
      const u = (q / 1.6 + i * .5) % 1, [x] = legs[i >> 1];
      tf(g, `translate(${(x + 4).toFixed(1)},${WATER + 1}) scale(${(1 + .8 * u).toFixed(3)},1)`);
      g.setAttribute('opacity', (Math.min(1, u * 4) * (1 - u) * .9).toFixed(2));
    });

    // Little Horse
    const r = route(q, lhRoute, LHS), hm = lips(q, 'scene4', PRE4, 'h04');
    const asking = between(q, W('h04'), W('o04')), oxTalks = between(q, W('o04'), W('n04b'));
    const glance = span(q, W('h04', 3.25), W('h04', 3.45)) - span(q, W('h04', 3.85), W('h04', 4.15));   // "this river?"
    const hop = span(q, W('o04', 6.1), W('o04', 6.3)) - span(q, W('o04', 6.55), W('o04', 6.9));          // happy little rear
    const lift = span(q, tLift, tLift + .55), look = span(q, W('n04b', 2.0), W('n04b', 2.5));
    const sway = .5 + .5 * Math.sin(q * 2.2);
    lh.pose({ x: r.x, y: 700, s: LHS, d: r.d, stand: r.stand, gait: 'trot', sack: true, mouth: hm,
      neck: (asking ? -5 : 0) + 10 * glance + 12 * look,
      nod: (asking ? -9 : 0) + 8 * glance + 10 * look - 5 * hop,
      tilt: -7 * hop,
      legs: hop > 0 ? { nf: [6 * hop, 16 * hop], ff: [4 * hop, 12 * hop] } : lift > 0 ? { nf: [16 + 20 * lift, 26 * lift + .8 * lift * Math.sin(q * 9)] } : {},
      ear: q < W('n04', 6.0) ? 0 : oxTalks ? -.4 - .6 * span(q, W('o04', 5.1), W('o04', 5.3)) : asking ? -.3 : q > W('n04b') ? -.8 : -.5,
      brow: asking ? -.6 : oxTalks ? -.35 + .15 * span(q, W('o04', 5.1), W('o04', 5.5)) : -.25 * look,   // negative: polite, worried
      look: q < W('n04b', 2.0) ? .7 : .2,
      shut: blinking(q, [3, W('n04', 7.95), W('h04', 2.1), W('o04', 1.2), W('o04', 3.6), W('o04', 6.6), W('n04b', 2.3), W('edge4', .5), W('edge4', 1.5)]),
      tail: 8 * Math.sin(q * 2.1) + (r.stand < 1 ? 14 : 0), bob: 1.2 * Math.sin(q * 2.5) - (q > tLift ? 1.5 * sway : 0) }, f);
  });
}
