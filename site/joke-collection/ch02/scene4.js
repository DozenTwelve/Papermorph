/* scene4.js — Free coffee. Outside the store at dusk: Me comes out with his coffee, sips, Amy waves goodbye and walks
   off; "...my coffee was free" (a toast); hard cut to the title card. */
'use strict';
const PRE4 = 0.5;
const S4 = { out: .35, sip: 2.7, sipEnd: 4.4, amy: 1.2, wave: 3.5, toast: clipAt('scene4', PRE4, 's14', 5.75), cut: PRE4 + 9.8 };
sfx('scene4', .1, 'chime');
sfx('scene4', S4.cut, 'sting');

function scene4(p, D) {
  const S = streetSet(p);
  S.cam.cut({ x: 800, y: 480, z: 1.15 }, 0);
  // title card on top of the camera: black, a torn paper strip with the title, a small line under it
  const card = mk('g', {}, p);
  card.innerHTML = `<rect width="1600" height="900" fill="#0d0b0a"/>
    <g transform="translate(800,450) scale(1) translate(-800,-450)"><g filter="url(#paper)"><path d="M180,330 L260,318 L420,334 L600,316 L800,332 L1000,317 L1200,333 L1380,318 L1430,330 L1420,430 L1370,444 L1180,428 L1000,444 L800,430 L600,446 L400,430 L240,446 L176,432 Z" fill="#f3ead6"/></g></g>
    <text x="800" y="418" font-family="Chalkboard SE, Avenir Next Heavy, sans-serif" font-size="92" font-weight="800" text-anchor="middle" fill="#1d1a1a">Do You Need a Bag?</text>
    <text x="800" y="510" font-family="Avenir Next, sans-serif" font-size="38" letter-spacing="4" text-anchor="middle" fill="#cfc6b4">Joke Collection · Episode 2</text>`;
  bakeAll(card);
  const sipT = (q, a, b) => Math.sin(Math.PI * span(q, a, b));   // 0 → 1 → 0 over a..b
  stopClock(D, (q, f) => {
    S.cam.apply(q, f);
    const title = q >= S4.cut; vis(card, title);
    // Me: steps out of the door, walks left to x 520, sips, sighs, toasts on "free"
    const wm = span(q, S4.out, 2.0), walkingM = q >= S4.out && q < 2.0, w = spWalk(q);
    const sip = sipT(q, S4.sip, S4.sipEnd), toast = sipT(q, S4.toast - .3, S4.toast + 1.2);
    const sigh = between(q, S4.sipEnd, S4.sipEnd + 1.1);
    S.me.pose({ x: 800 - 280 * wm, y: 800 - 6 * (1 - wm) * 0, s: SHOP.s, look: walkingM ? -.4 : 0, eyeX: walkingM ? -.5 : 0,
      ...(walkingM ? { legL: w.legL, legR: w.legR, bob: w.bob, armL: w.armL } : {}),
      hold: 'coffee', armR: walkingM ? 35 : 35 + 125 * sip + 70 * toast,
      mouth: sip > .5 ? 'chew' : toast > .5 ? 'smile' : sigh ? 'O' : 'X',
      lids: sigh ? .5 : 0, squash: sigh ? .03 * Math.sin(Math.PI * span(q, S4.sipEnd, S4.sipEnd + 1.1)) : 0,
      shut: blinking(q, [1.6, 5.1, 7.3, 10.2]) }, f);
    vis(S.me.g, q >= S4.out);
    // Amy: out of the door a moment later, walks right and off the frame, one wave back at him
    const wa = span(q, S4.amy, 7.2), walkingA = q >= S4.amy && q < 7.2, waving = between(q, S4.wave, S4.wave + 1.3);
    vis(S.amy.g, q >= S4.amy && q < 7.3);
    S.amy.pose({ x: 800 + 760 * wa, y: 800, s: SHOP.s, look: waving ? -.5 : .2, eyeX: waving ? -1 : .6,
      ...(walkingA ? { legL: w.legL, legR: w.legR, bob: w.bob, armL: w.armL } : {}),
      ...(waving ? { armL: 105 + 15 * onTwos(q) } : {}),
      hold: 'drink', armR: 30 - w.armR * 0, mouth: waving ? 'smile' : 'X', shut: blinking(q, [2.4, 4.9, 6.1]) }, f);
  });
}
