/* scene2.js — 承: the second catchphrase. Every class ends with the bell and "Bathroom?" / "Bathroom." and both walk out
   together, twice, identically; then the next morning the two sit waiting. Ends on the TWO framing, both seated (scene 3's start). */
'use strict';
const PRE2 = 1.2;

/* ---------- props (clock hands and the bell box, drawn at the origin) ---------- */
// Clock hands (drawn at the origin, pointing up) and the bell box with its clapper.
const s2hourH = `<g filter="url(#paper)"><path d="M-7,10 L0,-44 L7,10 Z" fill="#2a2a2a"/></g>`;
const s2minH = `<g filter="url(#paper)"><path d="M-5,10 L0,-66 L5,10 Z" fill="#2a2a2a"/></g>`;
const s2secH = `<g filter="url(#paper)"><path d="M0,18 V-72" stroke="#c0392b" stroke-width="3"/><circle r="6" fill="#c0392b"/></g>`;
const s2pin = `<g filter="url(#paper)"><circle r="7" fill="#2a2a2a"/></g>`;
const s2bellBox = `<g filter="url(#paper)"><rect x="-44" y="-34" width="88" height="68" rx="10" fill="#c94a3c"/><circle r="22" fill="#7a2a24"/></g>`;
const s2clapper = `<g filter="url(#paper)"><circle r="8" fill="#e6c46a"/></g>`;

/* ---------- times (beat clock) ---------- */
const S2 = { BELL1: .4, A: clipAt('scene2', PRE2, 's04b'), B: clipAt('scene2', PRE2, 's04c'), C: clipAt('scene2', PRE2, 's04d'),
  E: clipAt('scene2', PRE2, 's04e'), N: clipAt('scene2', PRE2, 's05') };
// a round: Bo's line at tb, Me's at tm; both rise at tm+1.2, walk out left by tm+2.6, clock/bell insert, back seated at tm+3.4
const S2R = [{ tb: S2.A, tm: S2.B, h: 10 + 50 / 60, bell: true }, { tb: S2.C, tm: S2.E, h: 7 + 50 / 60, bell: false }];
const S2_WIDE = { x: 800, y: 450, z: 1 }, S2_CLOCK = { x: 800, y: 170, z: 3.3 }, S2_BELLBOX = { x: 1460, y: 180, z: 4 };
const S2_SPEED = 680, S2_UPY = 64;
// tail: next morning at the stall (A), Bo bursts in late (B), the two-shot, his stomach growls (C)
const S2T = { A: S2.N + 6.0, B: clipAt('scene2', PRE2, 's05b', 3.0), IN: clipAt('scene2', PRE2, 's05b', 3.1), C: clipAt('scene2', PRE2, 's05b', 5.55) };
// The door in the painted back wall (x 42–245, y 178–656): flung open, Bo panting in it; then a cut to him landing in his seat.
const S2_DOOR = { x: 145, y: 656, s: .8 }, S2_DOORVIEW = { x: 250, y: 440, z: 2.5 }, S2_DOORSHOT = 1.3;   // an insert on the door, then back to the class
const s2doorway = `<rect x="50" y="186" width="188" height="470" fill="#b9ad97"/><rect x="50" y="560" width="188" height="96" fill="#9c8f78"/><g filter="url(#paper)"><path d="M42,178 L64,190 L64,662 L42,656 Z" fill="#8a5a32"/></g>`;
sfx('scene2', S2T.IN, 'door');
sfx('scene2', S2T.C + .5, 'growl');

sfx('scene2', S2.BELL1, 'bell');
sfx('scene2', S2R[0].tm + 3.0, 'bell', .6);
for (const r of S2R) { sfx('scene2', r.tm + 2.7, 'tick'); sfx('scene2', r.tm + 1.2, 'chair', .8); }

// Deterministic blink times, 2–5 s apart, different for each seed.
const s2blinks = (seed, from = 0) => { const o = []; let t = from, r = seed; while (t < 31) { r = (r * 1103515245 + 12345) & 0x7fffffff; t += 2 + 3 * (r % 1000) / 1000; o.push(+t.toFixed(2)); } return o; };

function scene2(p, D) {
  const c = classroom(p), cam = c.cam, { ME, BO } = c;
  // the front wall (clock and bell), a second camera on the other set
  const fr = paperCam(p, 'classFront');
  const hourH = prop(fr.stage, s2hourH), minH = prop(fr.stage, s2minH), secH = prop(fr.stage, s2secH), pin = prop(fr.stage, s2pin);
  const bellBox = prop(fr.stage, s2bellBox), clap = prop(fr.stage, s2clapper);
  const rings = mk('g', {}, fr.stage); rings.innerHTML = [-1, 1].map(s => `<path d="M${1460 + s * 62},160 q${s * 14},20 0,40 M${1460 + s * 80},150 q${s * 18},30 0,60" fill="none" stroke="#3a2a22" stroke-width="5" stroke-linecap="round"/>`).join('');
  // insert windows: [from, to, clock hour]; the first also shows the bell box
  const ins = S2R.map(r => ({ t0: r.tm + 2.7, t1: r.tm + 3.4, tb: r.tm + 3.05, h: r.h, bell: r.bell }));
  ins[1].t1 = S2.E + 3.4;

  /* cameras: 1 wide (bell, class), 2 two-shot, 3 clock inserts, back to the two-shot, ... ends on the two-shot */
  cam.cut(S2_WIDE, 0).cut(TWO, S2.A - .4);
  cam.cut(S2_WIDE, S2T.B).cut(TWO, S2T.C);
  // the door insert: its own camera on the classroom set, tight on the door (the pupils sit far in front of it)
  const dc = paperCam(p, 'classBack', S2_DOORVIEW);
  const doorway = prop(dc.stage, s2doorway), doorway2 = prop(c.cam.stage, s2doorway), boDoor = boPuppet(dc.stage);
  c.cam.stage.prepend(doorway2);   // the open door in the wide, behind every pupil
  const st = stallSet(p, { bun: bunSVG(), bite: bunSVG(true) }); st.cam.cut(STALL_VIEW, 0); st.weather('sun');
  fr.cut(S2_CLOCK, ins[0].t0).cut(S2_BELLBOX, ins[0].tb).cut(S2_CLOCK, ins[1].t0);

  const meBl = s2blinks(3), boBl = s2blinks(11, 1.3);
  const lerp = (a, b, u) => a + (b - a) * u;

  stopClock(D, (q, f) => {
    const insert = ins.find(i => between(q, i.t0, i.t1)), showFront = !!insert, atStall = between(q, S2T.A, S2T.B);
    const doorShot = q >= S2T.IN && q < S2T.IN + S2_DOORSHOT;
    vis(dc.root, doorShot); if (doorShot) dc.apply(q, f);
    vis(cam.root, !showFront && !atStall && !doorShot); vis(fr.root, showFront); vis(st.cam.root, atStall);

    /* ---- A: the next morning at the stall: Me chews his bun, Bo's spot is empty, the seller blinks ---- */
    if (atStall) {
      st.cam.apply(q, f);
      const u = q - S2T.A, glance = span(q, S2T.A + 1.0, S2T.A + 1.15) - span(q, S2T.A + 1.9, S2T.A + 2.05);
      st.me.pose({ x: STALL.me, y: STALL.ground, s: STALL.s, mouth: chew(q), bob: onTwos(q) > 0 ? 1 : 0, lids: .3, shut: blinking(u, [.6, 3.4, 5.2]),
        look: .5 * glance, eyeX: glance, armR: 100, hold: 'bite' }, f);
      st.bo.pose({ x: STALL.bo, y: 2000, s: STALL.s }, f);
      st.aunt.pose({ ...STALL.aunt, mouth: 'flat', lids: .4, shut: blinking(u, [1.1, 2.0, 4.1]) }, f);
      return;
    }

    /* ---- clock / bell inserts ---- */
    if (showFront) {
      fr.apply(q, f);
      const hr = insert.h, a = hr * 30, m = (hr % 1) * 360;
      tf(hourH, `translate(800,170) rotate(${a.toFixed(1)})`); tf(minH, `translate(800,170) rotate(${m.toFixed(1)})`); tf(pin, 'translate(800,170)');
      tf(secH, `translate(800,170) rotate(${(6 * Math.floor((q - insert.t0) * 2 + 3)).toFixed(1)})`);
      const ringing = insert.bell && q >= insert.tb, ring = ringing ? onTwos(q) : 0;
      tf(bellBox, `translate(1460,180) rotate(${4 * ring})`); tf(clap, `translate(${1460 + 4 * ring},${204 + 3 * ring})`);
      vis(rings, ringing && ring > 0); vis(bellBox, ringing); vis(clap, ringing);
      return;
    }
    cam.apply(q, f);

    /* ---- Me and Bo: seated, deadpan; in a round they talk, rise, and walk out left together ---- */
    const me = { ...ME, sit: true, look: 0, eyeX: 0, lids: .3, mouth: 'flat', shut: blinking(q, meBl) };
    const bo = { ...BO, sit: true, look: 0, eyeX: 0, lids: .3, mouth: 'flat', shut: blinking(q, boBl) };
    const talk = (...cl) => { const m = lips(q, 'scene2', PRE2, ...cl); return m === 'X' ? 'flat' : m; };
    let lookAt = null, t0 = 0;
    // wide: the bell rings, Bo glances at Me
    if (q < S2.BELL1 + 4) { bo.look = -.5 * span(q, S2.BELL1 + .9, S2.BELL1 + 1.2) * (q < S2.A - .6 ? 1 : 0); bo.eyeX = bo.look < 0 ? -1 : 0; me.lids = .35; }
    if (between(q, S2.BELL1, S2.BELL1 + 1.4)) { lookAt = 1700; t0 = S2.BELL1; }
    for (const r of S2R) {
      const { tb, tm } = r;
      if (q < tb - .6 || q >= tm + 3.4) continue;
      const turn = span(q, tb - .3, tb - .05) - span(q, tm + .9, tm + 1.1);   // Bo's face toward Me and back
      bo.look = -.7 * turn; bo.eyeX = turn > .5 ? -1 : 0; bo.mouth = talk('s04b', 's04d');
      const meTurn = span(q, tb + .35, tb + .6) - span(q, tm + .9, tm + 1.1);  // Me hears it, answers, turns back
      me.look = .6 * meTurn; me.eyeX = q >= tb + .2 && q < tm + 1 ? 1 : 0; me.mouth = talk('s04c', 's04e'); me.lids = q >= tm - .1 && q < tm + 1 ? .15 : .3;
      if (q >= tm + 1.2) {   // both stand together and walk out of frame to the left
        const up = span(q, tm + 1.2, tm + 1.45), w = Math.max(0, q - (tm + 1.45)), wk = spWalk(q), walking = w > 0;
        for (const [o, base] of [[me, ME], [bo, BO]]) Object.assign(o, { x: base.x - S2_SPEED * w, y: base.y - S2_UPY * up, look: -.9, eyeX: -1, lids: 0, mouth: 'flat',
          bob: walking ? wk.bob : 0, armL: walking ? 30 * wk.k : 0, armR: walking ? -30 * wk.k : 0, squash: up < 1 ? -.05 : 0, shut: false });
        lookAt = ME.x - S2_SPEED * w; t0 = tm + 1.2;
      }
    }
    // the last frames: the next morning, waiting; two quick sidelong glances
    if (q >= S2.E + 3.4 && q < S2T.A) {
      const g = span(q, S2.N + 2.6, S2.N + 2.8) - span(q, S2.N + 3.6, S2.N + 3.8), g2 = span(q, S2.N + 4.4, S2.N + 4.6) - span(q, S2.N + 5.2, S2.N + 5.4);
      bo.eyeX = -g; me.eyeX = g2; me.lids = bo.lids = .35;
    }
    const atDoor = q >= S2T.IN && q < S2T.C;
    vis(doorway2, atDoor);
    if (doorShot) {   // B: the door bangs open, Bo in it, out of breath; the class turns to look
      const w = q - S2T.IN;
      boDoor.pose({ ...S2_DOOR, bob: onTwos(q) > 0 ? -4 : 0, squash: w < .1 ? .08 : 0, armL: 40, armR: 40, look: 0, eyeX: 0, lids: 0, mouth: onTwos(q) > 0 ? 'D' : 'C',
        shut: blinking(q, [S2T.IN + 1.4]) }, f);
    }
    if (atDoor) { lookAt = 150; t0 = S2T.IN; }   // the whole class stares at the door until he is in his seat
    if (q >= S2T.B && q < S2T.C) bo.y = 2000;   // not in his seat yet
    if (q >= S2T.C) {   // C: he drops into his seat, squashes, settles; pants, his stomach growls, a hand to his belly
      const d = q - S2T.C, c0 = d, belly = span(q, S2T.C + .7, S2T.C + 1.1), down = span(q, S2T.C + .6, S2T.C + .8);
      Object.assign(bo, { y: BO.y - 40 * Math.max(0, 1 - d * 8), squash: d < .25 ? (d < .08 ? -.08 : .06) : 0, bob: onTwos(q) > 0 ? -3 : 0, lids: .4, mouth: q < S2T.C + .6 ? 'C' : (q < S2T.C + 1.8 ? 'wobble' : 'flat'),
        eyeY: -down, armR: -70 * belly, look: 0, eyeX: 0, shut: blinking(q, [S2T.C + 2.3]) });
      if (q >= S2T.C + .6) bo.bob = onTwos(q) > 0 && q < S2T.C + 1.9 ? -2 : 0;
      me.look = .5 * span(q, S2T.C + .8, S2T.C + 1.0); me.eyeX = c0 > .8 ? 1 : 0; me.lids = .3;
    }
    c.me.pose(me, f); c.bo.pose(bo, f);

    /* ---- the class: glancing about; looks up at the bell, follows the two out ---- */
    c.matesPose(q, f, { lookAt, t0 });
  });
}
