/* scene4.js — 合, what we learned. Detention at dusk (wide, the clock, in silence), Me's sincere speech turned to Bo
   (slow push-in, a dog insert, Bo's welling eyes, "Dude. That's beautiful."), then the next-morning tag: the teacher
   asks with empty hands, the dog already sits between the boys in glasses with a pencil, Bo hands the sheet over, an
   insert of the perfect homework, "Bo… it's perfect.", "The dog did it." and a snap push-in to the dog, title card.
   Speech starts PRE4 s in (3 s of silent detention). */
'use strict';
const PRE4 = 3.0;
const S4 = {
  clock: 1.0, two0: 2.1,                 // wide, insert of the clock, then the two-shot
  me: PRE4,                              // Me close-up, speech starts (first word at 3.1)
  dogIn: 6.45, meBack: 7.55,             // insert of the dog on "dog", then Me again, turned to Bo
  bo: 11.05,                             // Bo close-up, listening (Me's speech ends 11.03)
  tagT: 16.4,                            // next morning: the teacher asks (music off from here)
  give: 18.35,                           // the two-shot: Bo hands the sheet over
  holds: 19.5, ins: 20.1, cu: 21.5,      // the teacher holds it, insert of the sheet, her close-up for "It's perfect"
  two: 24.6, dog: 25.97, card: 28.4,     // the two-shot again; snap push to the dog; title card
};
window.MUSIC_OFF = { ...(window.MUSIC_OFF || {}), scene4: t => t < PRE4 + .05 || t >= S4.tagT };   // silent clock-ticks, music from Me's first word, off again for the tag
for (let t = .4; t < PRE4 - .2; t++) sfx('scene4', t, 'tick', .6);
sfx('scene4', S4.dog - .08, 'whoosh');
sfx('scene4', S4.card, 'sting');

const s4tearSVG = '<g filter="url(#paper)"><path d="M0,-12 Q10,4 0,10 Q-10,4 0,-12 Z" fill="#8fc6f0" stroke="#4f8fc4" stroke-width="2"/></g>';
// title card: cut-paper letters on construction paper (same as episode 1's)
function s4cardSVG() {
  const cols = ['#f4e9c8', '#f2c14e', '#e8715a', '#7cc08a', '#6aa6d8'], lines = [['The Dog', 150], ['Ate My', 150], ['Homework', 150]];
  let n = 0, out = '<g filter="url(#paper)"><rect width="1600" height="900" fill="#2e3b5a"/></g>' +
    '<g filter="url(#paper)" transform="rotate(-1.2 800 450)"><rect x="140" y="90" width="1320" height="720" rx="14" fill="#e9b872"/><rect x="170" y="120" width="1260" height="660" rx="8" fill="#f3d79f"/></g>';
  const ys = [320, 500, 700], sizes = [170, 170, 190];
  lines.forEach(([txt], li) => {
    // each letter's width, so wide letters (m, w) don't crowd and narrow ones (r) don't leave gaps
    const sz = sizes[li], wid = ch => sz * ({ m: .86, w: .86, M: .86, W: .9, r: .46, t: .46, ' ': .4 }[ch] || .62);
    const xs = []; let acc = 0; for (const ch of txt) { xs.push(acc + wid(ch) / 2); acc += wid(ch); }
    const x0 = 800 - acc / 2;
    [...txt].forEach((ch, i) => {
      if (ch === ' ') { n++; return; }
      const rot = ((n * 37) % 11 - 5) * 1.3, dy = ((n * 53) % 7 - 3) * 4, c = cols[n % cols.length]; n++;
      const x = x0 + xs[i], y = ys[li] + dy;
      out += `<g filter="url(#paper)" transform="translate(${x},${y}) rotate(${rot})"><text text-anchor="middle" font-family="Arial Black, Impact, Helvetica, sans-serif" font-weight="900" font-size="${sz}" fill="${c}" stroke="#3a2a1c" stroke-width="9" stroke-linejoin="round" paint-order="stroke">${ch}</text></g>`;
    });
  });
  return out;
}
const s4blinks = (a, gap, to) => { const o = []; for (let t = a; t < to; t += gap) o.push(+t.toFixed(2)); return o; };


// the perfect sheet as the teacher holds it: her glove grips the bottom edge, in front of the paper
const s4hold = hwSVG({ perfect: true, paw: true }) + '<g filter="url(#paper)"><circle cx="0" cy="-6" r="17" fill="#f2efe6"/><ellipse cx="-13" cy="-16" rx="7" ry="10" fill="#f2efe6"/></g>';
const s4give = hwSVG({ perfect: true, paw: true, name: 'Bo' }) + '<g filter="url(#paper)"><circle cx="0" cy="-5" r="14" fill="#f2efe6"/></g>';

function scene4(p, D) {
  const room = classroom(p, { hw: s4give }), cam = room.cam, { me, bo, mates } = room;
  const dog = dogPuppet(cam.stage, { holds: { pencil: pencilSVG } });
  const tr = teacherSet(p, { hw: s4hold }), tcam = tr.cam, teacher = tr.t;
  const WIDE = { x: 800, y: 450, z: 1 }, ME_CU = { x: 680, y: 575, z: 2.8 }, BO_CU = { x: 920, y: 548, z: 3 }, DOG_CU = { x: DOG_DESK.x - 50, y: 640, z: 3.4 };
  const TW = { x: 1200, y: 520, z: 1.9 };      // the teacher, bun and all
  // the sheet in her hand: where the camera goes for the insert (hand of the right arm, the sheet standing above it)
  const T_ARM = 25, tHand = [TEACHER.x + teacher.S.sx + 72 * -Math.sin((-24 - T_ARM) * Math.PI / 180), TEACHER.y + teacher.S.sy + 72 * Math.cos((-24 - T_ARM) * Math.PI / 180)];
  // classroom: wide / two-shot at dusk; Me close-up pushing in, the dog insert, Me again; Bo close-up;
  // morning two-shot, then snap push to the dog
  cam.cut(WIDE, 0).cut(TWO, S4.two0).cut(ME_CU, S4.me).soft(S4.me, true).to({ z: 3.0 }, S4.me, S4.dogIn - S4.me)
    .cut({ ...DOG_CU, y: 660, z: 3.3 }, S4.dogIn).to({ z: 3.5 }, S4.dogIn, S4.meBack - S4.dogIn)
    .cut({ ...ME_CU, z: 3.0 }, S4.meBack).to({ z: 3.25 }, S4.meBack, S4.bo - S4.meBack)
    .cut(BO_CU, S4.bo).to({ z: 3.15 }, S4.bo, S4.tagT - S4.bo)
    .cut(TWO, S4.give).soft(S4.give, false).cut(TWO, S4.two).to(DOG_CU, S4.dog, .15).soft(S4.dog, true).to({ z: 3.6 }, S4.dog + .2, 2.2);
  // the teacher camera: the clock, then her wide, the sheet in her hand, the insert, her close-up
  tcam.cut({ x: 800, y: 170, z: 3 }, 0).cut(TW, S4.tagT).cut(TW, S4.holds)
    .cut({ x: tHand[0] - 14, y: tHand[1] - 56, z: 5.0 }, S4.ins).to({ z: 5.5 }, S4.ins, S4.cu - S4.ins).soft(S4.ins, true).cut(TEACH_CU, S4.cu).soft(S4.cu, true);
  // the clock's hands at half past four (the set's clock has none)
  prop(tcam.stage, '<g filter="url(#paper)"><path d="M800,170 L832,202" stroke="#2a2a2a" stroke-width="11" stroke-linecap="round"/><path d="M800,170 L800,236" stroke="#2a2a2a" stroke-width="7" stroke-linecap="round"/><circle cx="800" cy="170" r="9" fill="#c94a3c"/></g>');
  const tear = prop(cam.stage, s4tearSVG);
  const card = mk('g', {}, p); prop(card, s4cardSVG());
  const cardHw = prop(card, hwSVG({ bite: 2 }));
  // dusk: the kit's wash plus a stronger evening tint and two slanting bands of low orange sun
  const dk = dusk(p);
  mk('rect', { width: 1600, height: 900, fill: '#b8461a', opacity: .22, style: 'mix-blend-mode: multiply' }, dk);
  const bands = mk('g', {}, dk);   // sun bands only in the wide shots, never across a close-up face
  mk('polygon', { points: '260,0 520,0 1180,900 820,900', fill: '#ffb050', opacity: .1, style: 'mix-blend-mode: screen' }, bands);
  mk('polygon', { points: '700,0 900,0 1500,900 1260,900', fill: '#ffb050', opacity: .07, style: 'mix-blend-mode: screen' }, bands);

  const meBlink = [.9, 4.0, 7.0, 9.6, 12.2], boBlink = [1.6, 5.2, 8.9, 13.4, 15.3, 17.9, 21.0, 25.4],
    dogBlink = [.7, 2.9, 3.6, 8.1, 18.6, 21.9, 25.2, 26.6, 27.6], tBlink = [S4.tagT + .9, 19.9, 21.1, 23.2, 24.2];
  const A = (q, ...cl) => lips(q, 'scene4', PRE4, ...cl);
  stopClock(D, (q, f) => {
    const clockShot = between(q, S4.clock, S4.two0), tag = between(q, S4.tagT, S4.give) || between(q, S4.holds, S4.two), inRoom = !tag && !clockShot && q < S4.card, inCard = q >= S4.card;
    vis(cam.root, inRoom); vis(tcam.root, clockShot || tag); vis(card, inCard); vis(dk, q < S4.tagT); vis(bands, q < S4.me);
    if (inCard) {
      const k = Math.floor((q - S4.card) * FPS / 2) % 2;       // the half-eaten sheet bounces on twos, clear of the title
      tf(cardHw, `translate(1368,${k ? 650 : 678}) scale(1.4) rotate(${k ? -6 : 5})`);
      tf(card, `translate(${(jit(f, 5) * .8).toFixed(1)},${(jit(f, 6) * .8).toFixed(1)})`);
      return;
    }
    if (clockShot || tag) {
      tcam.apply(q, f);
      // the teacher: asks with an open empty hand; later holds the sheet in her glove, reads it, stunned
      const has = q >= S4.holds, t3 = lips(q, 'scene4', PRE4, 's13', 's13b'), stun = span(q, 21.95, 22.35), reading = has && q < 22.2;
      const boOpen = q >= 20.8 && q < 21.04;   // "Bo.": the lip-sync's closed B lands ~0.15 s after the sound, so open at the onset
      const perfectEnd = clipAt('scene4', PRE4, 's13b', 20.65 - 16.426);
      teacher.pose({ ...TEACHER, mouth: boOpen ? 'B' : t3 !== 'X' ? t3 : (q > perfectEnd && q < S4.two ? (Math.floor(q * 2.5) % 2 ? 'E' : 'F') : 'X'), lids: .45 - .45 * stun, hold: has ? 'hw' : null,
        armR: has ? T_ARM + (between(q, S4.ins, S4.cu) ? 3 * Math.sin((q - S4.ins) * 4.5) : 0) : 50 - 4 * onTwos(q), armL: 0, look: 0, eyeX: 0, eyeY: reading ? .7 : 0, headR: has ? (reading ? -2 : -1 * stun) : 0,
        brow: .55 * stun, shut: blinking(q, tBlink), bob: has ? 0 : .6 * Math.sin(q * 1.3) }, f);
      return;
    }
    cam.apply(q, f);
    const detent = q < S4.tagT, meClose = between(q, S4.me, S4.dogIn) || between(q, S4.meBack, S4.bo), boClose = between(q, S4.bo, S4.tagT),
      dogShot = q >= S4.dog, dogIns = between(q, S4.dogIn, S4.meBack), morning = q >= S4.give;
    for (const m of mates) vis(m.p.g, morning);          // the class is gone for detention, back in the morning
    if (morning) room.matesPose(q, f);
    vis(me.g, !boClose); vis(bo.g, !meClose); vis(dog.g, !(meClose || boClose));
    const br = 1.4 * Math.sin(q * 1.3), glance = between(q, 2.2, 2.9) ? 1 : 0;
    // Me (left): stares ahead in the silence, glances at the dog, the sincere speech to camera, then turned to Bo for the last line
    const sp = between(q, S4.me, S4.bo), toBo = q >= S4.meBack - .1 && q < S4.bo + .3, hand = span(q, 9.2, 9.5) * (1 - span(q, 10.5, 10.9));
    me.pose({ ...room.ME, sit: true, look: toBo ? .7 : 0, eyeX: toBo ? 1 : glance * .8, lids: sp ? .1 : (morning ? .5 : .42),
      headR: sp ? 2.5 * Math.sin(q * 1.1) + 3 * span(q, S4.meBack - .1, S4.meBack + .4) : 0, brow: sp ? .3 * Math.sin(q * .9) + .2 : 0,
      mouth: A(q, 's12'), armL: -130 * hand, eyeY: 0, bob: sp ? 0 : br * .3, shut: blinking(q, meBlink) }, f);
    // Bo (right): listens (eyes on Me, welling, chin trembling); "Dude. That's beautiful."; in the morning deadpan, hands the sheet over
    const saying = between(q, clipAt('scene4', PRE4, 's12b') - .05, clipAt('scene4', PRE4, 's12b') + 2.9), gv = span(q, S4.give, S4.give + .35) * (1 - span(q, 19.0, 19.3));
    bo.pose({ ...room.BO, sit: true, look: boClose ? -.6 : 0, eyeX: boClose ? -1 : (morning ? 0 : -.6 * glance), lids: boClose ? .05 : (morning ? .4 : .5), brow: boClose ? .7 : 0,
      headR: boClose ? 2 * Math.sin(q * 1.7) : 0, eyeY: boClose ? .2 : 0, hold: q >= S4.give && q < 19.3 ? 'hw' : null, armR: 50 * gv + 30 * span(q, 18.95, 19.2),
      mouth: boClose ? (saying ? lips(q, 'scene4', PRE4, 's12b') : 'wobble') : (morning ? lips(q, 'scene4', PRE4, 's13c') : 'X'),
      bob: boClose ? 0 : br * .3, shut: blinking(q, boBlink) }, f);
    // the tear wells at the eye corner, then rolls
    const grow = span(q, 11.6, 12.4), roll = span(q, 13.4, 15.2), step = Math.floor(roll * 10) / 10;
    tf(tear, `translate(${(950 + step * 4).toFixed(1)},${(578 + step * 70).toFixed(1)}) scale(${(.3 + .7 * grow).toFixed(2)})`);
    vis(tear, boClose && q > 11.6);
    // the dog on the desk between them, sitting, facing Me: breathes, blinks, ears and tail; tilts its head on "dog";
    // in the morning already in glasses with a pencil, chewing it; at the snap push it chews, the pencil bobs, it wags
    const twitch = between(q, 2.4, 2.55) || between(q, 4.4, 4.55) ? 14 : 0, pencil = morning;
    const d = { ...DOG_DESK, sit: true, dir: -1, ear: pencil ? 3 * Math.sin(q * 2.3) + (between(q, 21.2, 21.4) ? 10 : 0) : twitch, bob: .8 * Math.sin(q * 2.2), shut: blinking(q, dogBlink), lids: .2,
      glasses: pencil, hold: pencil ? 'pencil' : null, eyeX: pencil ? 0 : (glance ? -1 : 0), tail: 6, wag: q > S4.two + .5 };
    if (dogIns) Object.assign(d, { headR: 14 * span(q, S4.dogIn, S4.dogIn + .25) - 3 * span(q, S4.dogIn + .6, S4.dogIn + .9), eyeX: -1, lids: 0, ear: 6, tail: 14, wag: true });
    if (pencil) Object.assign(d, { jaw: .18 * (onTwos(q) > 0 ? 1 : 0) * (q > S4.two - 1 ? 1 : 0), headR: q > S4.dog ? 3 * Math.sin((q - S4.dog) * 7) : 1.5 * Math.sin(q * 1.5), lids: .1 });
    if (dogShot) Object.assign(d, { tail: 10, wag: true, eyeX: 1, ear: 4 * Math.sin(q * 9) });
    dog.pose(d, f);
  });
}
