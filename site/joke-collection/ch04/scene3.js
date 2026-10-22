/* scene3.js — 转, the victim. Teacher close-up "And yours?"; Me close-up, lip trembling, his eyes slide off to the dog; the
   dog close-up (a scrap of homework at its mouth corner: the evidence); Me close-up, "The dog ate it."; a half-wide where the
   front rows turn to stare at Me; the dog's burp in close-up; Bo sits; teacher close-up "Of course he did. Detention.";
   "All three of you." cuts to the two-shot where Me droops, Bo rolls his eyes and the dog's ears fall and it lies down;
   a tighter two-shot for Bo's whisper and Me's shout; the dog sits up and licks its lips. No music in this scene. */
'use strict';
const PRE3 = .3;   // scene 2 ends on Me's close-up, so we cut straight to the teacher

/* ---------- cues (beat-clock seconds = PRE3 + audio time) ---------- */
const S3 = { me: 1.6, dogCU: 3.3, me2: 4.1, half: 6.0, turn: 6.15, burp: 7.1, half2: 7.8, bosit: 7.95, tchr: 9.0, look: 13.9, two: 14.55,
  tight: 16.0, yell: 21.15, lick: 22.75, lick2: 23.95 };
sfx('scene3', S3.burp, 'burp');
sfx('scene3', S3.bosit, 'chair');
sfx('scene3', S3.lick, 'lick');
sfx('scene3', S3.lick2, 'lick', .8);

const S3SCRAP = `<g transform="translate(-4,6) rotate(-25) scale(1.7)">${scrapSVG}</g>`;   // hangs from the corner of the mouth

function scene3(p, D) {
  const c = classroom(p), cam = c.cam;
  const dog = dogPuppet(cam.stage, { holds: { scrap: S3SCRAP, scrap2: `<g transform="scale(.55)">${S3SCRAP}</g>` } });
  const tc = teacherSet(p), tcam = tc.cam;
  const DOGX = 830;   // a little left of DOG_DESK: its head in the gap, its body not only on Bo
  const ME_CU = { x: 680, y: 570, z: 2.8 }, DOG_CU = { x: 765, y: 655, z: 5 }, HALF = { x: 800, y: 560, z: 1.35 }, TIGHT = { x: 800, y: 590, z: 2.5 };
  cam.cut(ME_CU, 0).soft(0, true).cut(DOG_CU, S3.dogCU).cut(ME_CU, S3.me2).cut(HALF, S3.half).soft(S3.half, false)
    .cut(DOG_CU, S3.burp).soft(S3.burp, true).cut(HALF, S3.half2).soft(S3.half2, false).cut(TWO, S3.two).cut(TIGHT, S3.tight)
    .to({ ...TIGHT, z: 2.7 }, S3.tight, 6);   // a slow push-in on the whisper and the shout
  tcam.cut(TEACH_CU, 0).soft(0, true);
  // a manga anger mark at Me's temple for the shout (his hair hides his brows)
  const mark = prop(cam.stage, '<g stroke="#d8322c" stroke-width="7" fill="none" stroke-linecap="round" filter="url(#paper)"><path d="M-16,-6 Q-6,-6 -6,-16 M6,-16 Q6,-6 16,-6 M16,6 Q6,6 6,16 M-6,16 Q-6,6 -16,6"/></g>');

  stopClock(D, (q, f) => {
    const teach = q < S3.me || between(q, S3.tchr, S3.two);
    const dogCU = between(q, S3.dogCU, S3.me2) || between(q, S3.burp, S3.half2);
    const meCU = between(q, S3.me, S3.dogCU) || between(q, S3.me2, S3.half);
    const half = between(q, S3.half, S3.burp) || between(q, S3.half2, S3.tchr), two = q >= S3.two, tight = q >= S3.tight;
    vis(tcam.root, teach); vis(cam.root, !teach);
    cam.apply(q, f); tcam.apply(q, f);
    const A = (...cl) => { const m = lips(q, 'scene3', PRE3, ...cl); return m === 'X' ? 'flat' : m; };

    // the teacher, deadpan: eyes slide to Me on "yours"; "Of course he did" the lids sink a little more; "Detention." a
    // small drop of the head; then her eyes go down to the dog for "All three of you"
    const tT = { ...TEACHER, lids: .45, mouth: A('s08', 's10'), shut: blinking(q, [1.3, 3.4, 11.4, 13.1, 15.6]), headR: 0 };
    if (q < S3.me) Object.assign(tT, { look: -.55 * span(q, .35, .6), eyeX: q > .4 ? -1 : 0, headR: -2 * span(q, .35, .6) });
    else {
      Object.assign(tT, { look: -.55, eyeX: -1, headR: -2 });
      if (q > 9.7) tT.lids = .55;
      if (q >= 12.2) { tT.headR = -2 - 2.5 * span(q, 12.2, 12.35); tT.lids = .6; }   // "Detention."
      if (q >= S3.look) Object.assign(tT, { eyeY: .8 * span(q, S3.look, S3.look + .2), headR: -4, lids: .55, look: -.4 });
    }
    tc.t.pose(tT, f);

    /* Me: the lips tremble, the eyes dart and fall on the dog; then "The dog ate it." (brow > 0 is worried) */
    const me = { ...c.ME, sit: true, look: .7, eyeX: .8, lids: 0, brow: .3, mouth: 'flat', armL: -50, armR: -70,   // hands kept in front, under the desk's edge
      shut: blinking(q, [2.05, 2.75, 4.35, 5.5, 8.6, 13.7, 22.4]) };
    if (between(q, S3.me, S3.dogCU)) {   // silence: wide eyes, trembling mouth, a drift of the eyes, then he looks down at the dog
      const g = span(q, 2.95, 3.15);
      Object.assign(me, { look: 0, eyeX: q < 2.3 ? 0 : q < 2.7 ? -.5 : q < 2.95 ? .3 : 1, eyeY: q > 2.3 && q < 2.7 ? .3 : g * .5, lids: q > 2.2 && q < 2.4 ? .3 : 0, brow: .5 + .2 * Math.sin(q * 7),
        headR: 1.2 * Math.sin(q * 9) + 3 * g, mouth: 'wobble', squash: q > 2.6 && q < 2.8 ? .02 : 0 });
    } else if (meCU) {   // he looks back at the camera, braces, and says it
      Object.assign(me, { look: 0, eyeX: q < 4.5 ? -.2 : 0, lids: q < 4.5 ? .25 : 0, brow: q < 4.6 ? .3 : .75, headR: q > 4.6 ? 2 : 0,
        mouth: q > 4.5 && q < 5.8 ? A('s09') : 'wobble', armR: -70 });
      if (q >= 5.8) Object.assign(me, { mouth: 'flat', lids: .2, brow: .6, eyeX: .3 });
    } else if (half) {   // the whole class stares: he looks along the row, then down
      Object.assign(me, { look: q < 7.1 ? .5 * Math.sin(q * 2) : 0, eyeX: q < 6.9 ? .8 : q < 7.5 ? -.8 : 0, eyeY: .3, lids: .1, mouth: 'wobble', brow: .5, headR: 1.2 * Math.sin(q * 8) });
    }
    if (q >= S3.tchr) Object.assign(me, { look: .6, eyeX: .8, lids: .25, brow: .5, mouth: 'flat' });
    if (two) {
      const talk = A('s11b'), yell = q >= S3.yell, k = span(q, S3.two, S3.two + .5);
      if (q < S3.tight) Object.assign(me, { look: 0, eyeX: 0, eyeY: .8 * k, lids: .35, brow: .6, headR: 5 * k, mouth: 'frown', squash: .03 * k });   // "All three of you": his head drops
      else Object.assign(me, { look: .2, eyeX: 0, eyeY: 0, lids: .4, brow: .5, headR: 0, mouth: 'frown', squash: 0 });   // mortified, staring ahead
      if (q >= 20.4 && q < S3.yell) Object.assign(me, { look: .7 * span(q, 20.4, 20.8), eyeX: .8, lids: .3, brow: -.4, mouth: 'flat' });   // slowly turns on Bo
      if (yell) {   // his hair hides his brows, so the anger is in the narrowed eyes, the lean toward Bo and the wide mouth
        const sh = talk !== 'flat', wide = talk === 'A' ? 'G' : onTwos(q) > 0 ? 'grin' : 'G', k = span(q, S3.yell - .1, S3.yell + .15);
        Object.assign(me, { x: me.x + 22 * k, look: .8, eyeX: 1, lids: .3, brow: -.9, mouth: sh ? wide : 'frown', headR: 4 * k + 2.5 * onTwos(q), armR: sh ? 30 : 18, armL: sh ? 50 : -50, squash: sh ? .03 : 0 });
      }
      if (q >= 22.6) Object.assign(me, { x: me.x + 22 * (1 - span(q, 22.6, 23)), lids: .4, brow: -.3, mouth: 'flat', headR: 2, armR: 10, armL: -50, squash: 0 });
    }
    const shout = between(q, S3.yell, 22.6);
    vis(mark, shout); if (shout) tf(mark, `translate(${(me.x + 112).toFixed(0)},474) scale(${(1.5 + .25 * onTwos(q)).toFixed(2)})`);
    vis(c.me.g, !teach); c.me.pose(me, f);

    /* Bo: stands (scene 2 left him up), sits as the class stares, rolls his eyes at "All three", whispers to Me */
    const sit = q >= S3.bosit + .22, down = span(q, S3.bosit, S3.bosit + .22);
    const bo = { ...(sit ? c.BO : { ...c.BO_UP, y: c.BO_UP.y + 64 * down }), sit, look: 0, eyeX: 0, lids: .15, brow: .2, shut: blinking(q, [.9, 4.1, 9.3, 12.8, 15.2, 18.9, 20.3]) };
    if (half && !sit) Object.assign(bo, { look: -.5, eyeX: -.8, mouth: between(q, 6.3, 6.75) || between(q, 7.3, 7.8) ? 'O' : q > 6.75 && q < 7.3 ? 'frown' : 'flat', brow: .4, shut: blinking(q, [6.8, 7.0]) });
    if (sit) Object.assign(bo, { lids: .3, mouth: 'flat', look: -.2, eyeX: -.5 });
    if (two) {
      const w = A('s11'), k = span(q, S3.two, S3.two + .5);
      if (q < S3.tight) Object.assign(bo, { look: 0, eyeX: 0, eyeY: -.9 * Math.min(1, k * 2) * (q < 15.5 ? 1 : 0), lids: .5, mouth: 'flat', brow: 0, headR: 3 * k });   // eyes roll up
      else Object.assign(bo, { look: -.7, eyeX: -1, eyeY: 0, lids: .2, mouth: w, headR: -3 * span(q, S3.tight, S3.tight + .4), brow: w !== 'flat' ? .3 : 0 });
      if (q > 20.5 && q < S3.yell) Object.assign(bo, { mouth: 'flat', lids: .2, look: -.7, brow: .3 });
      if (q >= S3.yell) { const k = span(q, S3.yell, S3.yell + .2); Object.assign(bo, { x: bo.x + 16 * k, look: -.6, eyeX: -1, lids: 0, brow: .8, mouth: 'O', headR: 4 * k, squash: .02 * k }); }   // flinches back, eyes on Me   // taken aback by the shout
      if (q >= 22.7) Object.assign(bo, { x: bo.x + 16 * (1 - span(q, 22.7, 23.1)), look: -.1, eyeX: .2, eyeY: .7, lids: .35, brow: .2, headR: 0, mouth: 'flat', squash: 0 });   // eyes down at the dog
    }
    vis(c.bo.g, !teach && !meCU); c.bo.pose(bo, f);

    // the class turns to look at Me (a staggered snap)
    for (const m of c.mates) vis(m.p.g, half || two);
    if (half || two) for (const m of c.mates) {   // each pupil blinks on their own rhythm (0.17 s, never stuck) and glances about; in the half-wide they turn to Me
      const per = 2.7 + (m.k % 5) * .45, shut = ((q + m.k * 1.13) % per) < .17, own = (q * .23 + m.k * .37) % 1;
      let look = own < .12 ? (m.k % 2 ? .5 : -.5) : 0, eyeX = look;
      if (half && q >= S3.turn + (m.k % 4) * .09) { look = Math.max(-1, Math.min(1, (680 - m.x) / 400)); eyeX = Math.sign(680 - m.x); }
      m.p.pose({ x: m.x, y: m.y, s: m.s, sit: true, look, eyeX, shut }, f);
    }

    /* the dog: stands on the desk facing Me with a scrap at its mouth, licking; burps; sits sheepish; at "All three of you" its
       ears fall and it lies down; the shout makes it sit up, and it licks its lips */
    vis(dog.g, dogCU || half || two);
    const burpU = span(q, S3.burp, S3.burp + .7), burp = between(q, S3.burp, S3.burp + .7), lick = q >= S3.lick && (between(q, S3.lick, S3.lick + .6) || q >= S3.lick2 && q < S3.lick2 + .6);
    // sit and lie ease (0…1); the shout throws it upright with a hop
    const lieV = ease(span(q, 15.2, 15.65)) * (1 - ease(span(q, S3.yell - .1, S3.yell + .12)));
    const sitV = ease(span(q, 7.75, 8.1)) * (1 - lieV), hop = 16 * Math.sin(Math.PI * span(q, S3.yell - .1, S3.yell + .3));
    const d = { ...DOG_DESK, x: DOGX + 22 * ease(span(q, S3.yell - .1, S3.yell + .2)), y: DOG_DESK.y - hop, dir: -1, bob: .8 * Math.sin(q * 3.1), tail: 10 + 30 * sitV + 60 * lieV, wag: q > 2 && q < 6.6, ear: 3 * Math.sin(q * 1.7),
      shut: blinking(q, [1.2, 5.5, 8.9, 17.5, 20.1]), hold: q < 6.7 ? 'scrap' : q < 6.95 ? 'scrap2' : null, eyeX: .5, sit: sitV, lie: lieV > .999 ? 'awake' : lieV };
    if (dogCU && q < S3.me2) Object.assign(d, { tongue: onTwos(q) > 0 && q % 1 > .3, jaw: .12 + .06 * onTwos(q), headR: 5 + 2 * Math.sin((q - S3.dogCU) * 6), lids: .25, ear: 8 + 3 * onTwos(q), tail: 14, wag: true, eyeX: -.5,
      shut: false, bob: 1.2 * Math.sin(q * 5) });   // chewing the scrap, pleased with itself
    if (half && q < S3.burp) Object.assign(d, { jaw: .1 * (onTwos(q) > 0 && q < 6.95), tail: 12, wag: false });   // chews the last of it
    if (q >= 6.95 && q < S3.burp) Object.assign(d, { bob: 3 * span(q, 6.95, S3.burp), headR: -3 * span(q, 6.95, S3.burp) });   // gulps it down, then air
    if (burp) Object.assign(d, { headR: 14 * Math.sin(Math.PI * burpU), jaw: .55 * (q < S3.burp + .5), bob: -4 * Math.sin(Math.PI * span(q, S3.burp, S3.burp + .5)), lids: .45, wag: false, tail: 12 });
    if (q >= S3.half2) Object.assign(d, { wag: false, eyeX: -.5, lids: .3 });
    if (two) {   // ears fall, then it lies down (awake: sulking)
      const k = span(q, S3.two, S3.two + .6);
      Object.assign(d, { ear: -16 * k, headR: -10 * k * (1 - lieV), lids: .55, wag: false, shut: lieV > .999 ? false : blinking(q, [17.5]), bob: .6 * Math.sin(q * 2) });
    }
    if (q >= S3.yell - .1) Object.assign(d, { shut: false, lids: 0, ear: 16 * span(q, S3.yell - .1, S3.yell + .1) * (q < S3.yell + .8 ? 1 : 0), headR: 5 * span(q, S3.yell - .1, S3.yell + .1), tail: 20, eyeX: .3 });   // startled
    if (q >= 22.5) Object.assign(d, { ear: 2, lids: .3, headR: 4, tail: 36, wag: q > 24.4 });
    if (lick) Object.assign(d, { tongue: true, jaw: .12 + .1 * (onTwos(q) > 0), headR: 7, lids: .3 });
    dog.pose(d, f);
  });
}
