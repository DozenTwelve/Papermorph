/* scene2.js — Off to the mill: a follow shot down the road, then the river across his path.
   Shots (beat clock, PRE2 1.0 + clip times):
     A  0.00–2.40  road, medium follow: Little Horse trotting right, sack on, happy
     B  2.40–4.30  road, close follow on the sack and his face ("with the wheat on his back")
     C  4.30–6.80  road, wide low follow, he gains on the camera ("He ran, and he ran")
     D  6.80–9.45  river, wide, drifting in: he trots in from the left past the tree; the river right across his path,
                   Uncle Ox in it, not far away; he sees it ("right across his path"): ears up, brow up
     H  9.45–10.15 river, insert low on the hooves: the skid, front legs braced, dust; he stops at x 400 (the tree end)
     E  10.15–12.75 river, his close-up with the water ahead, the ox out of frame: "Whoa!", "Can I get across?"
     E' 12.75–14.45 cut out to the bank, the river and the ox: on "Mama" a torn-paper thought picture pops up beside his head
                   (Mother at the stable door, small), held through "to ask", then it pops away; the frame stays
     E2 14.45–end  head low over the water: the bank, the river and the ox for the
                   last frame: Little Horse at x 400 facing right, worried; Ox at 1060 facing left */
'use strict';
const PRE2 = 1.0;
const s2_T = { mama: [12.95, 14.45], hooves: 9.45, cut: 6.8, wide: 4.3, close: 2.4, ride: 9.55, stop: 10.05, cu: 10.15 };
const s2_L = HORSE_GEO.L, s2_S = 1.05;
// Road: trot cycles done by time t (2.0 Hz, picking up to 2.4 Hz by "as fast as he could go").
const s2_roadCyc = t => t <= 2 ? 2 * Math.max(0, t) : t <= 4.5 ? 4 + 2 * (t - 2) + .08 * (t - 2) ** 2 : 9.5 + 2.4 * (t - 4.5);
const s2_roadX = t => 300 + s2_S * s2_L * s2_roadCyc(t);
// River: in from the left at 1.9 Hz, then a skid of 50 px with the hooves braced (sliding, decelerating).
const s2_HZ = 1.895, s2_X0 = -55;   // stops at x 400
const s2_rivCyc = t => s2_HZ * Math.min(s2_T.ride, Math.max(s2_T.cut, t)) - s2_HZ * s2_T.cut;
function s2_rivX(t) {
  if (t < s2_T.ride) return s2_X0 + s2_S * s2_L * s2_rivCyc(t);
  const u = Math.min(1, (t - s2_T.ride) / (s2_T.stop - s2_T.ride)), x1 = s2_X0 + s2_S * s2_L * s2_rivCyc(s2_T.ride);
  return x1 + 50 * (1 - (1 - u) ** 2);
}
// A thought picture popping open at t0 (a few frames of overshoot) and shut at t1 (one big frame, then gone).
const s2_pop = (q, t0, t1) => q < t0 || q >= t1 + 1 / FPS ? 0 : q >= t1 ? 1.1 : [.4, 1.12, .95, 1][Math.min(3, Math.floor((q - t0) * FPS + 1e-6))];
// A torn sheet w × h around (0, 0), its edges wandering a little, the same every time.
function s2_torn(w, h, seed) {
  const pts = [], n = 9;
  const side = (x0, y0, x1, y1, k) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + 4 * jit(seed, k + i), y0 + (y1 - y0) * u + 4 * jit(seed, k + 40 + i)]); } };
  side(-w / 2, -h / 2, w / 2, -h / 2, 0); side(w / 2, -h / 2, w / 2, h / 2, 100); side(w / 2, h / 2, -w / 2, h / 2, 200); side(-w / 2, h / 2, -w / 2, -h / 2, 300);
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L') + ' Z';
}
// A paper puff of dust for the skid.
const s2_PUFF = '<g filter="url(#paper)"><circle r="16" fill="#dccaa0"/><circle cx="9" cy="-6" r="10" fill="#e6d7b2"/></g>';

function scene2(p, D) {
  const at = t => PRE2 + t;   // clip time -> beat clock
  // ---- sound: beds, a hoof on every diagonal pair's landing, the skid
  sfx('scene2', 0, 'birds', .45); sfx('scene2', 0, 'wind', .25); sfx('scene2', s2_T.cut, 'river', .5);
  for (const [cyc, t0, t1, vol] of [[s2_roadCyc, 0, s2_T.cut, .22], [s2_rivCyc, s2_T.cut, s2_T.ride, .3]]) {
    let last = Math.floor(cyc(t0) * 2);
    for (let t = t0; t < t1; t += 1 / 120) { const k = Math.floor(cyc(t) * 2); if (k > last) { sfx('scene2', +t.toFixed(3), 'hoof', vol); last = k; } }
  }
  sfx('scene2', s2_T.ride, 'skid', .7); sfx('scene2', s2_T.stop, 'hoof', .45);

  // ---- the road
  const road = setCam(p, 'road', { x: s2_roadX(0) + 150, y: 650, z: 1.4 });
  const lhR = horsePuppet(road.stage);
  road.to({ x: t => s2_roadX(t) + 150 }, 0, 0.001);
  road.cut({ x: t => s2_roadX(t) + 60, y: 560, z: 2.3 }, s2_T.close);
  // the wide: the camera falls behind, so he runs from left of centre to right of it
  road.cut({ x: t => s2_roadX(t) + 480 - 640 * span(t, s2_T.wide, s2_T.cut + .4), y: 505, z: .88 }, s2_T.wide);

  // ---- the river
  const riv = setCam(p, 'river', { x: 720, y: 540, z: 1.12 });
  const ox = oxPuppet(riv.stage), lh = horsePuppet(riv.stage);
  const puffs = Array.from({ length: 9 }, () => prop(riv.stage, s2_PUFF));
  // ---- the thought of Mama: a torn-paper picture over the water beside his head, Mother at the stable door
  const VX = 622, VY = 330, mamaV = mk('g', {}, riv.stage), mamaIn = mk('g', {}, mamaV);
  mamaIn.innerHTML = `<clipPath id="s2clip"><path d="${s2_torn(196, 140, 22)}"/></clipPath>
    <g filter="url(#paper)"><path d="${s2_torn(210, 154, 21)}" fill="#fbf6ea"/></g>
    <g clip-path="url(#s2clip)"><g filter="url(#paper)"><rect x="-120" y="-90" width="240" height="180" fill="#e6ecd8"/>
      <path d="M-120,10 C-60,0 40,14 120,4 L120,90 L-120,90 Z" fill="#b8cfa4"/><path d="M-120,52 C-40,48 40,56 120,50 L120,90 L-120,90 Z" fill="#c9b27a"/>
      <path d="M-120,-40 L-14,-40 L-14,54 L-120,54 Z" fill="#a8754a"/><path d="M-128,-38 L-60,-78 L4,-38 Z" fill="#d9b25e"/>
      <path d="M-82,-14 L-38,-14 L-38,54 L-82,54 Z" fill="#5a3b24"/><path d="M-60,-14 L-60,54" stroke="#46301d" stroke-width="3"/></g>
      <g class="mom"></g></g>`;
  bakeAll(mamaIn);
  const mom = motherPuppet(mamaIn.querySelector('.mom'));
  const trail = [[521, 433, 4], [530, 422, 6], [541, 411, 8]].map(([x, y, r]) =>
    prop(riv.stage, `<g filter="url(#paper)"><circle cx="${x}" cy="${y}" r="${r + 3}" fill="#8a6a46"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fbf6ea"/></g>`));
  sfx('scene2', s2_T.mama[0], 'pop', .45); sfx('scene2', s2_T.mama[1], 'pop', .35);
  riv.to({ x: 560, y: 560, z: 1.4 }, s2_T.cut + .1, 2.6);   // drifts in on the bank as he comes
  riv.cut({ x: 455, y: 660, z: 3.2 }, s2_T.hooves);   // H: the hooves skidding
  riv.cut({ x: 410, y: 575, z: 2.2 }, s2_T.cu).soft(s2_T.cu, true);   // E: "Whoa!", the water ahead, the ox out of frame
  riv.to({ y: 600 }, 11.05, .8);   // "Can I get across?": the frame tips down to the water
  riv.cut({ x: 560, y: 545, z: 1.45 }, 12.75);   // on "If only": out to the bank, the river and the ox, with room for the thought of Mama
  riv.soft(s2_T.hooves, true);
  const hBlinks = [1.7, 4.9, 7.6, 12.3, 15.65], oxBlinks = [7.5, 11.2, 14.6, 16.3];
  stopClock(D, (q, f) => {
    const onRoad = q < s2_T.cut;
    vis(road.root, onRoad); vis(riv.root, !onRoad);
    (onRoad ? road : riv).apply(q, f);

    // ---- road pose: happy trot, a nod in step with the gait, tail streaming
    if (q < s2_T.cut) {
      const c = s2_roadCyc(q);
      lhR.pose({ x: s2_roadX(q), y: 815, s: s2_S, d: s2_L * c, stand: 0, gait: 'trot', sack: true,
        nod: 3 * Math.sin(4 * Math.PI * c), neck: -4, ear: -.6 + .1 * Math.sin(4 * Math.PI * c), look: .4,
        tail: 24 + 6 * Math.sin(4 * Math.PI * c + 1), shut: blinking(q, hBlinks) }, f);
      return;
    }

    // ---- river: Uncle Ox in the shallows, chewing, unbothered; facing left; his eye goes to Little Horse at the skid
    ox.pose({ x: 1060, y: WATER + 50, s: 1.4, turn: -1, chew: q * 1.1, grass: true, neck: 6, lid: .35, brow: -.15,
      look: between(q, 9.9, 12.2) ? 1 : .2, ear: .3 * Math.sin(q * .9) + (between(q, 9.7, 10.2) ? -.6 : 0),
      tail: 6 * Math.sin(q * 1.3), shut: blinking(q, oxBlinks) }, f);

    // ---- Little Horse: trot in, skid, teeter, then the worried close-up
    // The kit's brow: + slants it down to the nose (cross), - lifts its inner end (surprised, worried).
    const x = s2_rivX(q), skid = span(q, s2_T.ride, s2_T.ride + .17), settle = span(q, s2_T.stop + .25, s2_T.stop + .7);
    const brace = skid * (1 - settle);   // front legs thrust forward, hind tucked under, body thrown back
    const teeter = q < s2_T.stop ? 0 : 4 * Math.sin(Math.PI * Math.min(1, (q - s2_T.stop) / .55)) * (1 - span(q, s2_T.stop + .55, s2_T.stop + .9));
    const mouth = lips(q, 'scene2', PRE2, 'h02');
    // the face through the lines (beat clock: Whoa 10.23, Can I get across 11.21, If only 12.77, Mama 12.97, ask 13.99)
    const sees = span(q, 8.4, 8.75);   // "right across his path": ears up, brow up
    const away = span(q, 12.6, 12.95) * (1 - span(q, 14.1, 14.4));   // head up, eyes up to the thought of Mama
    const water = span(q, 10.95, 11.4) * (1 - span(q, 12.5, 12.7)) + span(q, 14.1, 14.4);   // looking down at the water
    const gloom = span(q, 14.1, 14.6);
    const breathe = q > s2_T.stop + .9 ? 1.2 * Math.sin(2 * Math.PI * (q - s2_T.stop) / 2.6) : 0;
    const sigh = -3 * Math.sin(Math.PI * span(q, 14.6, 15.5));
    const c = s2_rivCyc(q);
    lh.pose({ x, y: 700, s: s2_S, d: s2_L * c, stand: skid, gait: 'trot', sack: true,
      tilt: -13 * brace + teeter, bob: breathe + sigh,
      legs: { nf: [34 * brace, 0], ff: [28 * brace, 0], nh: [18 * brace, 0], fh: [14 * brace, 0] },
      neck: -4 - 16 * brace + 18 * water - 2 * away + 4 * gloom,
      nod: q < s2_T.ride ? 3 * Math.sin(4 * Math.PI * c) : 5 * water + 2 * away,
      ear: -.6 * (1 - sees) - .9 * sees * (1 - brace) + .9 * brace + (q > s2_T.stop + .5 ? .3 * away + 1.0 * gloom : 0),
      brow: -Math.min(1, .7 * sees + .3 * brace + .3 * Math.max(water, away, gloom)),
      look: .4 + .5 * water + .5 * away,
      tail: q < s2_T.ride ? 24 + 6 * Math.sin(4 * Math.PI * c + 1) : 24 * (1 - skid) + 10 * brace - 6 * gloom,
      mouth, shut: blinking(q, hBlinks) }, f);

    // ---- the thought of Mama: pops on "Mama", held through "to ask"; she looks his way, breathes, blinks
    const [m0, m1] = s2_T.mama, sc = s2_pop(q, m0, m1);
    trail.forEach((t, i) => vis(t, q >= m0 - .2 + i * .07 && q < m1));
    vis(mamaV, sc > 0);
    if (sc > 0) {
      tf(mamaV, `translate(${VX + jit(f, 61) * .4},${VY + jit(f, 62) * .4}) rotate(2) scale(${sc})`);
      mom.pose({ x: 22, y: 58, s: .33, turn: -1, neck: 6 + 6 * span(q, m0 + .4, m0 + .9), look: .4, brow: -.2,
        bob: .8 * Math.sin(q * 2.4), tail: 4 * Math.sin(q * 1.7), shut: blinking(q, [m0 + .95]) }, f);
    }

    // ---- dust from the skid: puffs thrown up at the hooves, drifting on and fading
    puffs.forEach((g, i) => {
      const tb = s2_T.ride + .05 + i * .055, age = (q - tb) / .9;
      if (age < 0 || age > 1) { vis(g, false); return; }
      vis(g, true);
      const fore = i % 3 !== 2, hx = s2_rivX(tb) + s2_S * (fore ? 70 : -40) + 6 * jit(i, 40);
      tf(g, `translate(${(hx + (fore ? 55 : -25) * age).toFixed(1)},${(698 - 46 * age - 6 * (i % 2)).toFixed(1)}) scale(${(.45 + 1.15 * age).toFixed(3)})`);
      g.setAttribute('opacity', (Math.min(1, age * 6) * (1 - age) * .9).toFixed(2));
    });
  });
}
