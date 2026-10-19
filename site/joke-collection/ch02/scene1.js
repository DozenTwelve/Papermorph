/* scene1.js — "Need a bag?". Street at dusk (chime, "Fukuoka" plate, slow push to the door), hard cut into the shop wide
   (Amy's bottle is scanned), clerk close-up ("Reji-bukuro…"), Amy close-up (REJI? -> VEGGIE? bubble, "I'm not vegetarian"),
   Me close-up holding in a laugh. Ends on Me's close-up; scene 2 opens on the clerk's close-up. */
'use strict';
const PRE1 = 2.5;   // picture first: the street, the chime, the plate; the narrator starts at 2.5 s

/* ---------- audio cues ---------- */
const C1 = { s02: clipAt('scene1', PRE1, 's02'), s03: clipAt('scene1', PRE1, 's03'), s04: clipAt('scene1', PRE1, 's04'), s05: clipAt('scene1', PRE1, 's05') };
const T1 = {
  cutIn: C1.s02,                       // hard cut street -> shop wide, at the start of s02's hole
  clerkCU: C1.s03 - .15,               // clerk close-up just before her line (voice at +.45)
  amyCU: C1.s03 + 2.592 + .15,         // reaction after the line
  tilt: C1.s04 + .15,                  // camera tilts up as the bubble pops
  reji: C1.s04 + .35, veg: C1.s04 + 1.5,   // "…REJI…?" then the snap to "VEGGIE?"
  off: clipAt('scene1', PRE1, 's04', 2.25) + .4,   // the bubble goes just after "Um…"
  meCU: C1.s05,                        // Me's close-up for s05's hole + the line
};
sfx('scene1', 9.55, 'chime');
sfx('scene1', T1.cutIn + 1.5, 'beep');
sfx('scene1', T1.veg, 'whoosh', .5);

// a bubble's contents: the word above, the broccoli below
const s1veg = `<g transform="translate(0,-28)">${bubbleText('VEGGIE?', 36)}</g><g transform="translate(0,34) scale(.8)">${broccoliSVG}</g>`;
// the paper title plate (taped strip with hand lettering)
const s1plate = `<g filter="url(#paper)" transform="rotate(-2)"><rect x="0" y="0" width="236" height="64" rx="4" fill="#f4ecd8" stroke="#8a7a58" stroke-width="2"/>
  <rect x="86" y="-10" width="64" height="20" fill="#e9dca6" opacity=".85"/>
  <text x="118" y="44" font-family="Chalkboard SE, Comic Sans MS, sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="#2a2420">Fukuoka</text></g>`;

function scene1(p, D) {
  const st = streetSet(p), S = shopSet(p), plate = prop(p, s1plate);
  vis(st.amy.g, false);   // Me (empty-handed) walks in from the left along the pavement and goes through the door

  // 1.1 street: slow push toward the door and the red coffee poster   1.2 shop wide   1.3 clerk   1.4 Amy   1.5 Me
  st.cam.cut({ x: 800, y: 450, z: 1 }, 0).to({ x: 940, y: 520, z: 1.25 }, .4, T1.cutIn - .4);
  S.cam.cut(SHOP_WIDE, 0).cut(CU.clerk, T1.clerkCU).soft(T1.clerkCU, true)
    .cut({ x: 1095, y: 440, z: 2.1 }, T1.amyCU).to({ x: 1095, y: 410, z: 2 }, T1.tilt, .3).shake(T1.veg, .25, 3)
    .cut({ x: 540, y: 480, z: 2 }, T1.meCU);
  const b = bubble(S.cam.stage, { reji: bubbleText('…REJI…?', 38), veg: s1veg });

  const W = T1.cutIn;   // the wide begins
  const drinkX = 1110;   // where Amy sets it down; the clerk puts it back at SHOP.drink, out of Amy's way
  stopClock(D, (q, f) => {
    const inShop = q >= W;
    vis(st.cam.root, !inShop); vis(S.cam.root, inShop);
    st.cam.apply(q, f); S.cam.apply(q, f);
    vis(plate, q > .3 && q < 3.6);
    tf(plate, `translate(${(48 + 2 * onTwos(q) * 0).toFixed(1)},${(52 + (q < .6 ? (1 - span(q, .3, .6)) * -40 : 0)).toFixed(1)})`);
    // Me walks to the door (x 800) during s01 and goes in; hidden once inside
    const walkIn = !inShop && q < 9.55, wk = spWalk(q);
    vis(st.me.g, walkIn);
    if (walkIn) st.me.pose({ x: tween(q, 1, 8.55, -170, 800), y: 800, s: .9, look: .5, eyeX: 1, hold: null, armR: 0, ...wk, armR: wk.armR + 5,
      shut: blinking(q, [3.1, 6.4]) }, f);
    if (!inShop) return;

    const lipsOf = (...c) => { const m = lips(q, 'scene1', PRE1, ...c); return m; };
    const w = q - W;   // seconds into the wide
    const wide = q < T1.clerkCU, cuClerk = q >= T1.clerkCU && q < T1.amyCU, cuAmy = q >= T1.amyCU && q < T1.meCU, cuMe = q >= T1.meCU;

    /* --- the bottle: Amy puts it down, the clerk takes it, scans (beep), puts it back --- */
    const putDown = .45, pick = 1.25, scan = 1.5, back = 2.4;
    const onCounter = w >= putDown && !(w >= pick && w < back);
    const clerkHas = w >= pick && w < back;
    vis(S.on.drink, onCounter); tf(S.on.drink, `translate(${w >= back ? SHOP.drink : drinkX},${SHOP.top})`);

    /* --- Amy --- */
    const amy = { x: SHOP.amy, y: SHOP.ground, s: SHOP.s, look: .6, eyeX: 1, hold: w < putDown ? 'drink' : null,
      shut: blinking(q, [W + 3.1, W + 7.4, T1.amyCU + .4, T1.amyCU + .8, T1.amyCU + 3.9, T1.meCU + 1]) };
    if (w < 1) amy.armR = tween(w, 0, putDown - .05, 30, 82);
    else amy.armR = tween(w, 1, .4, 82, 22);
    if (w < putDown) amy.armR = tween(w, 0, putDown - .05, 30, 82);
    if (cuAmy || cuMe || q >= T1.amyCU) {   // frozen: blink, blink, the eyes dart; then the answer
      const t = q - T1.amyCU, ex = t < .9 ? 1 : t < 1.2 ? -1 : t < 1.5 ? 1 : t < 1.85 ? -.6 : q < T1.veg ? .9 : q < T1.off ? .2 : .8;
      Object.assign(amy, { eyeX: ex, eyeY: q >= T1.reji && q < T1.off ? -.8 : t > 1.2 && t < 1.5 ? .5 : 0, look: q < T1.off ? .3 : .5, lids: .15, brow: 0,
        mouth: q < C1.s04 + 2.25 - .05 ? 'flat' : lipsOf('s04') === 'X' ? 'smile' : lipsOf('s04'), headR: q >= C1.s04 + 2.25 ? 4 : t > 1 && q < T1.off ? -4 * onTwos(q) * 0 - 5 : 0, lids: .3 });
      if (q >= T1.off + .6) Object.assign(amy, { lids: 0, brow: 0 });
    }

    /* --- the clerk: smiles politely, scans, then speaks --- */
    const lean = clerkHas || (w >= pick - .3 && w < back + .5) ? ease(Math.min(1, (w - (pick - .3)) / .3)) * (1 - ease((w - back - .1) / .4)) : 0;
    const clerk = { ...SHOP.clerk, x: SHOP.clerk.x - 50 * lean, mouth: 'smile', look: -.3, eyeX: -.7, holdL: clerkHas ? 'drink' : null,
      shut: blinking(q, [W + 2.6, W + 6.2, T1.clerkCU + 1.2]) };
    clerk.armL = w < pick - .3 ? 0 : w < pick ? tween(w, pick - .3, .3, 0, 58) : w < scan ? tween(w, pick, scan - pick, 58, 12)
      : w < scan + .35 ? tween(w, scan, .35, 12, 24) : w < back ? tween(w, scan + .35, back - scan - .35, 24, 58) : tween(w, back, .35, 58, 0);
    if (q >= T1.clerkCU) Object.assign(clerk, { x: SHOP.clerk.x, look: -.4, eyeX: -.8, holdL: null, armL: 0, mouth: lipsOf('s03') === 'X' ? 'smile' : lipsOf('s03'), headR: -2 });
    if (q >= T1.clerkCU + 2.7) Object.assign(clerk, { headR: 3, mouth: 'smile' });   // a little nod once she has asked

    /* --- Me: queues alive (blinks, glances, one sip), then holds the laugh --- */
    const sip = w >= 4.6 && w < 6.0 ? Math.sin((w - 4.6) / 1.4 * Math.PI) : 0;
    const me = { x: SHOP.me, y: SHOP.ground, s: SHOP.s, look: .5, eyeX: 1, hold: 'coffee', armR: 30 + 95 * Math.min(1, sip * 1.6), lids: .1,
      shut: blinking(q, [W + 1.7, W + 4.4, W + 6.3, W + 8.2, T1.clerkCU + .9, T1.amyCU + 2.2, T1.meCU + 2.1]) };
    if (w >= 7.2 && w < 7.9) Object.assign(me, { eyeX: -.8, look: -.3 });   // a glance at the shelves
    if (cuMe) {
      const t = q - T1.meCU, grow = Math.min(1, t / .7);
      Object.assign(me, { lids: .35, eyeX: 1, look: .6, mouth: (Math.floor(q * 6) % 2) ? 'wobble' : 'flat', headR: grow * (-2 + 1.6 * onTwos(q)), bob: grow * 2.5 * onTwos(q),
        squash: grow * (.03 + .015 * onTwos(q)), x: SHOP.me + grow * 2.2 * onTwos(q), armR: 30 + 3 * onTwos(q) * grow });
      if (t > 3.3 && t < 3.9) me.mouth = 'wobble';   // "too good": the lips almost give way
    }

    S.clerk.pose(clerk, f); S.amy.pose(amy, f); S.me.pose(me, f);
    // the bubble over Amy's head: first the word she heard, then it snaps to what she thinks it means
    const show = q < T1.reji || q >= T1.off ? null : q < T1.veg ? 'reji' : 'veg';
    b.pose({ x: SHOP.amy + 20, y: 392, s: .95, show, pop: show === 'reji' ? span(q, T1.reji, T1.reji + .25) : span(q, T1.veg, T1.veg + .15) }, f);
  });
}
