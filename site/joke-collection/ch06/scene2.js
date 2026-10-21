/* scene2.js — "Back home" (round 2). The American boasts (a cutaway to his front yard: he barks at a house, each bark
   harder, until the window flies up and a steak lands on his head), then demonstrates in the alley: two WOOFs, the
   chopping stops, the cook's shadow turns to the door, the eyes in the box sink; the chopping resumes ("Sooner or
   later."). Beat clock throughout. Alley 0–1.6 and 13.5–end; yard 1.6–13.5. Ends on AL_TRIO. */
'use strict';
const PRE2 = 1.0;
window.S2_STOP = 15.0;
const S2_RUNS = [[0, 15.55], [19.95, 26.0]];
chopSfx('scene2', S2_RUNS, { mute: [[1.6, 13.5]] });   // no kitchen in the yard; the chopping returning at 13.5 says we are back
roomSfx('scene2', [[0, 1.6], [13.5, 26]]);
// the yard barks, escalating and varied (sound, time, volume); the head throws further with each
const S2_BARKS = [['bark-big', 2.5, .55], ['bark-big2', 4.45, .6], ['bark-big3', 4.95, .7], ['bark-big', 5.45, .8], ['bark-big2', 5.95, .9], ['bark-big3', 6.35, 1], ['bark-big', 7.6, 1]];
S2_BARKS.forEach(([n, t, v]) => sfx('scene2', t, n, v));
const S2_BT = S2_BARKS.map(b => b[1]);
sfx('scene2', 1.6, 'whoosh', .6);
sfx('scene2', 13.5, 'whoosh', .6);
sfx('scene2', 8.55, 'sash');
sfx('scene2', 11.2, 'plop');
sfx('scene2', 12.9, 'gulp', .6);
sfx('scene2', 17.8, 'flap', .5);
sfx('scene2', 14.6, 'inhale-short', .5);
sfx('scene2', 15.5, 'woof', 2);       // the demonstration: the loudest sound of the film
sfx('scene2', 15.95, 'woof', 2);
[17.85, 17.95, 18.05].forEach(t => sfx('scene2', t, 'tick', .6));   // the box trembling

// the bark in progress at q: index and how far into its 0.25 s head throw (0…1 on and off), or null
function s2bark(q) {
  for (let i = 0; i < S2_BT.length; i++) { const d = q - S2_BT[i]; if (d >= -.03 && d < .3) return { i, k: Math.min(1, (d + .03) / .05) * (d < .22 ? 1 : 1 - (d - .22) / .08) }; }
  return null;
}
// a little cream curtain behind the shut glass: twitches once and is still (the second window insert)
const s2curtain = '<g filter="url(#paper)"><path d="M0,0 H92 V176 Q80,184 68,176 Q56,184 46,176 Q34,184 22,176 Q10,184 0,176 Z" fill="#e8dcc0"/>' +
  '<path d="M18,6 V172 M38,6 V172 M58,6 V172 M78,6 V172" stroke="#c9b98f" stroke-width="5" opacity=".8"/><rect width="92" height="8" fill="#b9a67a"/></g>';

function scene2(p, D) {
  const a = alleySet(p), ac = a.cam, y = yardSet(p), yc = y.cam;
  const curtain = prop(yc.stage, s2curtain);
  const usA = { x: ALLEY.us, y: ALLEY.ground, s: US.s, dir: 1 }, plP = { x: ALLEY.pl, y: ALLEY.ground, s: PL.s, dir: -1, sit: 1 },
    suP = { x: ALLEY.su, y: ALLEY.suY, s: SU.s, dir: -1, sit: 1 };
  const usY = { x: YARD.us, y: YARD.y, s: YARD.s, dir: 1, sit: 1 };
  const [hx, hy] = dogHead(usY), hat = [hx - 14, hy - 12];   // the steak sits on the head, between its top and the ear
  const cuA0 = DOG_CU(usA), cuA = { ...cuA0, x: cuA0.x - 125 }, cuY = DOG_CU(usY);   // cuA: the American alone, the Polish dog out of frame

  const cuP = { ...DOG_CU(plP), x: DOG_CU(plP).x + 150, y: DOG_CU(plP).y - 40 };   // the Polish dog and the Soviet dog's whole head, the American out
  // alley cuts: TRIO, close-up, TRIO, the demonstration close-up (snap push at the first WOOF), window, slot, the American waiting,
  // TRIO, window, slot, "Sooner or later.", the Polish dog's close-up, TRIO to end
  ac.cut(AL_TRIO, 0); ac.cut(cuA0, 1.2); ac.cut(AL_TRIO, 13.5); ac.cut(cuA, 14.6); ac.to({ ...cuA, z: cuA.z + .5 }, 15.5, .1);
  ac.cut(cuP, 16.3); ac.cut(AL_WINDOW, 16.6); ac.cut(AL_SLOT, 17.6); ac.cut(cuA, 18.2); ac.cut(AL_TRIO, 18.9); ac.cut(AL_WINDOW, 19.6); ac.cut(AL_SLOT, 20.4);
  ac.cut(cuA, 21.6); ac.cut(cuP, 23.0); ac.cut(AL_TRIO, 25.2);
  ac.shake(15.5, .15, 8); ac.shake(15.95, .15, 8);
  // yard cuts: wide, WOOF close-up, two-shot, close-ups with window inserts for the barks, the sash, waiting, the steak
  yc.cut(YARD_WIDE, 1.6); yc.cut(cuY, 2.45); yc.cut(YARD_TWO, 3.45);
  yc.cut(cuY, 4.38); yc.cut(YARD_WIN, 5.15); yc.cut(cuY, 5.75); yc.cut(YARD_WIN, 6.05); yc.cut(cuY, 6.58);
  yc.cut(YARD_WIN, 8.33); yc.cut(cuY, 9.3); yc.cut(YARD_TWO, 9.9); yc.cut(YARD_WIN, 10.3); yc.cut(cuY, 10.9);

  stopClock(D, (q, f) => {
    const yard = q >= 1.6 && q < 13.5;
    vis(ac.root, !yard); vis(yc.root, yard);
    ac.apply(q, f); yc.apply(q, f);
    const said = dogJaw(lips(q, 'scene2', PRE2, 's07', 's08'));   // the American's mouth for his words

    /* ----- alley ----- */
    if (!yard) {
      a.steam(q); a.shade(1); vis(a.bowl, true); a.placeBowl();
      const demo = span(q, 14.6, 15.45), woof = barkJaw(q, [15.5, 15.95], .2), thrown = woof > .5 || between(q, 15.5, 15.75) || between(q, 15.95, 16.2);
      const grin = q >= 13.5 && q < 14.6, wait = q >= 18.2 && q < 19.6, shrug = q >= 21.6 && q < 23;
      const swell = q < 13.5 ? span(q, .1, 1.2) : q < 14.6 ? .35 : q < 15.5 ? demo : 1 - span(q, 15.6, 16.4);
      a.us.pose({ ...usA, swell, wag: !(q >= 15.5 && q < 18.2), tongue: grin || wait || q >= 20.5,
        headR: q < 13.5 ? 0 : q < 14.6 ? 4 : q < 15.5 ? 30 * demo : thrown ? 35 : q < 16.6 ? 8 : shrug ? (q < 22.3 ? 10 : 0) : 0,
        bob: thrown ? -10 : shrug && q >= 22.2 && q < 22.55 ? -8 * Math.sin(Math.PI * (q - 22.2) / .35) : 0,
        ear: thrown ? EAR_BACK : wait ? 16 : 0, jaw: Math.max(woof, wait ? .35 : grin ? .25 : said),
        eyeX: wait ? 1 : q >= 21.6 && q < 22.3 ? 0 : 0, shut: blinking(q, [2.4, 11, 17.6, 19.5]) || between(q, 22.6, 22.85) }, f);
      // the Polish dog: eyes on him; he looks back at the door (it is behind him) at 18.2 and 24.0; an ear goes up once; he glances down at his bowl at 19.0 and 24.9
      const door = q >= 18.2 && q < 19.6, plLook = q < 23 ? (q < 18.2 ? 1 : q < 19.6 ? -1 : 1) : 1 - 2 * (span(q, 23.5, 23.9) - span(q, 24.5, 24.9));
      const flinch = between(q, 16.3, 16.6) ? 1 : 0;
      a.pl.pose({ ...plP, eyeX: plLook, ear: between(q, 19.1, 19.4) || between(q, 24.05, 24.45) ? 30 : door ? 10 : flinch ? EAR_BACK : 0, headR: between(q, 16.3, 16.38) ? 8 : between(q, 19.0, 19.5) || between(q, 24.9, 25.15) ? -12 : q >= 23.5 && q < 24.7 ? 4 : 0, ...(flinch ? { lids: 0 } : {}),
        shut: blinking(q, [3.1, 8.7, 14.2, 20.3, 25.2]) }, f);
      a.su.pose({ ...suP, lids: .35, eyeX: q < 23.2 ? 1 : q < 24.2 ? -1 : 1, shut: blinking(q, [4.6, 12.8, 19.3, 24.8]) }, f);
      vis(a.cn.g, false);
      // the box: eyes in the hole; at 17.6 they widen (1 frame), shut and are gone, the box shakes and a flap jumps; they rise again slowly from 20.4
      const sink = q < 17.7 ? 0 : q < 20.4 ? span(q, 17.7, 17.95) : 1 - .5 * span(q, 20.5, 21.0) - .3 * span(q, 21.0, 21.6);
      a.box.pose({ x: ALLEY.box, y: ALLEY.ground, eyes: 1, sink, eyeX: q < 17.6 ? .6 : 1,
        lids: q >= 20.4 ? .3 : 0,
        shut: q < 17.6 ? blinking(q, [3, 7.5, 12.2]) : q >= 22 ? blinking(q, [22.4]) : false,
        flaps: between(q, 17.7, 17.85) ? .5 : 0,
        shake: q >= 17.7 && q < 18.0 ? 1 : 0 }, f);
      // the cook: chopping with the sounds; the arm rests raised while it is silent; he turns to the door 16.9–17.4 and back 19.6–20.1
      a.kit.cook({ arm: cleaverAt(q, S2_RUNS, 1), turn: span(q, 16.9, 17.4) * (1 - span(q, 19.6, 19.9)) });
      a.kit.crack(0);
    }

    /* ----- yard ----- */
    if (yard) {
      const b = s2bark(q), waiting = between(q, 9.3, 9.9), flight = q >= 10.3 && q < 11.2, landed = q >= 11.2;
      const i = b ? b.i : 0, throwR = b ? (20 + 20 * i / 6) * b.k : 0;
      const dip = landed ? Math.max(0, 1 - (q - 11.2) / .4) : 0, hit = landed && q < 11.45;   // the head dips for 3 frames and bounces back
      const lift = b && i >= 3 ? b.k : 0, pant = q >= 6.7 && q < 7.5 && onTwos(q) > 0 ? .3 : 0, up = q >= 10.9 && q < 11.2;
      y.us.pose({ ...usY, ...(q >= 11.17 ? { hold: 'steak' } : {}), y: usY.y - 10 * lift, paw: 25 * lift, wag: q < 2.45 || q >= 10.4, tongue: q < 2.45 || landed || pant > 0 || waiting,
        headR: b ? throwR : hit ? -15 : up ? 25 : q < 2.45 ? 0 : q < 8.33 ? 10 : waiting ? 14 : landed ? 8 * span(q, 11.45, 11.7) : 10,
        bob: b ? -(8 + 4 * i / 6) * b.k : hit ? 14 : 0, ear: b ? EAR_BACK : hit ? EAR_BACK : waiting ? 16 : 0, swell: pant,
        jaw: Math.max(barkJaw(q, S2_BT), landed && q >= 11.7 && q < 13.5 ? .3 : 0, waiting ? .35 : 0, q < 2.45 || (q >= 3.45 && q < 4.38) || (q >= 6.58 && q < 7.5) || q >= 8.33 && q < 9.3 || q >= 9.9 && q < 11.2 ? said : 0),
        eyeX: landed && q >= 12.4 && q < 13.3 ? 1 : q >= 3.45 && q < 9.3 ? .8 : 0, lids: landed && q >= 12.4 && q < 13.3 ? .3 : 0,
        shut: blinking(q, [1.8, 3.9, 9.6, 13.2]) }, f);
      // the window: shut until the sash is shoved up at 8.55 (dark inside); once a curtain twitches behind the glass (6.25–6.5), then nothing
      y.win(span(q, 8.55, 8.9));
      const bu = Math.sin(Math.PI * span(q, 6.2, 6.5));   // it bulges in for 0.25 s, springs back and hangs still
      vis(curtain, between(q, 6.05, 6.6)); tf(curtain, `translate(962,308) scale(${(1 + .3 * bu).toFixed(3)},${(1 - .04 * bu).toFixed(3)}) skewY(${(6 * bu).toFixed(2)})`);
      // the steak: springs out spinning at 10.3, falls past the camera to his head at 11.2 (the close-up sees it drop in), then sits there
      vis(y.steak, q >= 10.3 && q < 11.17);
      if (q >= 10.3 && q < 11.17) {
        const u = Math.min(1, (q - 10.3) / .87), [sx, sy] = toss(u, YARD.from, hat, 210);
        tf(y.steak, `translate(${sx.toFixed(1)},${(sy + (landed ? (b ? 0 : (hit ? 14 : 0)) : 0)).toFixed(1)}) rotate(${(landed ? -8 : 540 * u - 10).toFixed(1)}) scale(.62)`);
      }
    }
  });
}
