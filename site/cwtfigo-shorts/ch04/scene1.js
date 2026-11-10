/* scene1.js — This is fine. Frame 0 is already moving: an egg frying on the keyboard of Martin's laptop on the stool
   (bubbling, the camera pushing in on it and Martin), the screen red at 90 °C, smoke from the vents, the garage going
   red, and Martin's "this is fine" in the same shot (our own: Martin, a mug, a smile, the heat), then his single: "Claude, what the fuck is going on?", punched in on
   "Ninety degrees. Every day!". */
'use strict';
const MX = 700;   // Martin left of the stool, so the laptop and its egg are clear beside him
// Martin's "this is fine" pose: the mug at his chest (screen-left mitten), a sip after his line, the other arm easy.
function martinFine(st, q, extra = {}) {
  const base = { x: MX, y: PLACE.martin[1], look: .15, eyeX: .1, lids: .5, mouth: 'smile', brow: 0, shut: blinkAt(q, 2), frontL: true };
  const mouth = st.martin.point(base, [514, 684]);
  const s0 = clipAt('scene1', PRE1, 'm02') - .05;   // the sip: right after his line, down as the call starts
  const sip = span(q, s0 - .35, s0 - .05) - span(q, s0 + .3, s0 + .6);
  const chest = [mouth[0] - 18, mouth[1] + 62];
  const mugAt = [chest[0] + (mouth[0] - 4 - chest[0]) * sip, chest[1] + (mouth[1] + 20 - chest[1]) * sip];
  return { ...base, ...st.martin.aim(base, 'L', mugAt), holdL: MUG, armR: 10, ...extra };
}
const sweat = (x, y, q, n = 2) => Array.from({ length: n }, (_, i) => {
  const u = ((q * .9 + i * .5) % 1);
  return `<path d="M${x + i * 70},${(y + 40 * u).toFixed(1)} q-6,10 0,14 q6,-4 0,-14 Z" transform="scale(1)" fill="#bfe6ff" stroke="${CW_INK}" stroke-width="1.6" opacity="${(1 - u).toFixed(2)}"/>`;
}).join('');
function scene1(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene1', PRE1, c, t), lap = hotLap(st);
  // one shot pushing in on Martin and the frying laptop through "This is fine." (the meme's frame: him, calm, in the
  // heat), then his single for the call
  const shots = [{ ...shot(0, 'wide'), view: { x: 815, y: 515, z: 2.1 } },
    shot(at('m02', .25), 'single', 'martin', { x: MX }), shot(at('m02', 2.72), 'close', 'martin', { x: MX })];
  const S = shooter(st, shots);
  st.cam.to({ x: 790, y: 545, z: 2.6 }, 0, at('m02', .25));
  sfx('scene1', 0, 'sizzle', .15, { loop: true });
  const open = cwOpener(p, 'scene1', ['90 °C', 'EVERY DAY'], { size: 80 });
  stopClock(D, (q, f) => {
    const cur = S(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'off' } });
    lap.draw(q, f, { heat: 1, temp: 90, egg: { k: 1.8, cook: .3 + span(q, 0, 6), sizzle: true } });
    const mt = talk(q, 'scene1', PRE1, 'm01', 'm02');
    let martin;
    if (cur.kind === 'wide') martin = martinFine(st, q, q >= at('m01') && q < at('m01', .95) ? { mouth: mt === 'X' ? 'smile' : mt } : {});
    else {   // his single: the smile cracks, the mug shakes at his chest
      const shake = cur.kind === 'close' ? 3 * Math.sin(q * 40) : 0;
      const base = { x: MX, y: PLACE.martin[1], look: 0, lids: 0, brow: 1, mouth: mt === 'X' ? 'wobble' : mt, shut: blinkAt(q, 2), frontL: true,
        eyeY: -.2 };
      const mouth = st.martin.point(base, [514, 684]);
      martin = { ...base, ...st.martin.aim(base, 'L', [mouth[0] - 22 + shake, mouth[1] + 70]), holdL: MUG, armR: 8 };
    }
    castPose(st, cur, f, { doc: docSolder(st, q, f), martin, claude: null });
    let fx = heatFX(q, 1, cur.kind === 'wide');
    if (cur.kind !== 'wide') { const [hx, hy] = st.martin.point({ x: MX, y: PLACE.martin[1] }, [250, 330]); fx += sweat(hx, hy, q, 1) + sweat(hx + 150, hy - 10, q + .4, 1); }
    else { const mug = st.martin.hand(martin, 'L'); fx += smokeSVG(mug[0], mug[1] - 34, q, 3, .6); }
    st.fxHTML = fx;
    open.draw(q);
  });
}
