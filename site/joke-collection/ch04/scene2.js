/* scene2.js — 承, Exhibit A. At the stall Me's bun drips oil on his homework (insert), the sleeping dog sniffs toward
   him (insert), Bo gets his idea and rents the seller's dog. In class the teacher asks, Bo lifts the dog from behind the
   desk onto it ("Exhibit A."), the dog sniffs Bo's blank sheet, snubs it, then follows its nose to Me's greasy one and
   eats it in three bites. Ends on Me's close-up, still pinching a scrap of paper. */
'use strict';
const PRE2 = 1.0;
const A2 = a => PRE2 + a;   // audio-relative time -> beat clock
// the music drops out just before the crickets and stays out: the eating plays in silence
window.MUSIC_OFF = { ...(window.MUSIC_OFF || {}), scene2: t => t >= A2(24.5) };

/* ---------- scene-only props ---------- */
const s2sheet = (o, dx) => `<g transform="translate(${dx},0)">${hwSVG(o)}</g>`;   // a sheet held by its lower left corner, the mitten under it
const s2drop = '<g filter="url(#paper)"><path d="M0,-11 Q8,3 0,9 Q-8,3 0,-11 Z" fill="#e0b25a"/></g>';
const s2mitten = '<g filter="url(#paper)"><rect x="-14" y="-52" width="28" height="52" rx="13" fill="#3563c0"/><path d="M7,-50 v48" stroke="#f4f1ea" stroke-width="5"/><circle r="18" fill="#f2efe6"/><ellipse cx="-14" cy="-10" rx="7" ry="10" fill="#f2efe6"/></g>';
// Me's sheet after a bite: the right side is gone up to x = R (local), the edge ragged with four round bites
const s2eaten = R => {
  const n = Math.floor((R - 8 + 26) / 12), lines = [-78, -66, -54, -42, -30, -18].filter(() => n > 0)
    .map(y => `<path d="M-26,${y} q6,-4 12,0${' t12,0'.repeat(Math.max(0, n - 1))}" fill="none" stroke="#3a4f86" stroke-width="2.2"/>`).join('');
  return `<g filter="url(#paper)"><path d="M-34,-92 H${R}${' q-13,11 0,22'.repeat(4)} V-4 H-34 Z" fill="#fbfaf4"/><path d="M-34,-90 V-4" stroke="#e89a9a" stroke-width="2"/>${lines}
    ${R > 0 ? '<ellipse cx="-4" cy="-37" rx="8" ry="9" fill="#c98f2e" opacity=".7"/>' : ''}</g>`;
};
// Me's sheet is in his left (screen-left) hand at the stall and in class; Bo's blank one in his right (outer) hand
const S2HOLDS = { bun: `<g transform="scale(1.7)">${bunSVG()}</g>`, bite: `<g transform="scale(1.7)">${bunSVG(true)}</g>`,
  hw: s2sheet({}, 40), hwS: s2sheet({ grease: true }, 40), hwG: s2sheet({ grease: 'big' }, 40),
  e1: `<g transform="translate(40,0)">${s2eaten(12)}</g>`, e2: `<g transform="translate(40,0)">${s2eaten(-12)}</g>`,
  scrap: `<g transform="translate(8,-20) scale(1.5)">${scrapSVG}</g>`, bhw: s2sheet({ blank: true, name: 'Bo' }, 0) };

/* ---------- timeline (audio-relative seconds; the picture is cut on these) ---------- */
const S2 = {
  // stall: wide, insert of the drop, trio, dog insert (sleeping sniff), trio, Bo idea, medium, seller, dog
  ins: 1.7, drop: 2.3, plop: 2.65, trio: 3.1, dogIns: 4.25, trio2: 5.05, sniffD: 4.35, boIdea: 5.65, med: 7.5, aunt: 10.1, dogCU: 11.85,
  // class: teacher medium, two-shot (Bo stands, ducks, lifts the dog, presents it), teacher close-up, the sniff, the eating
  tmed: 13.7, two: 15.95, duck: 16.35, down: 17.0, rise: 17.2, over: 18.0, land: 18.35, present: 18.75, fetch: 19.9, back: 20.2, tcu: 20.65,
  tight: 23.1, raise: 23.3, insBlank: 23.65, tight2: 24.45, crick: 25.0, tcu2: 25.55, meCU: 26.1, dogCU2: 26.65, turn: 27.1, pan: 27.8,
  meCU2: 28.65, insBite: 29.25, chomp: [29.75, 30.35, 30.95], tight3: 31.45, gulp: 31.55, meCU3: 32.35 };
sfx('scene2', A2(S2.plop), 'plop');
sfx('scene2', A2(S2.sniffD), 'sniff', .6);
sfx('scene2', A2(S2.two - .1), 'chair');
sfx('scene2', A2(S2.insBlank), 'sniff');
sfx('scene2', A2(S2.crick), 'crickets');
sfx('scene2', A2(S2.dogCU2 + .1), 'sniff');
sfx('scene2', A2(S2.pan + .1), 'sniff');
S2.chomp.forEach(t => sfx('scene2', A2(t), 'chomp'));
sfx('scene2', A2(S2.gulp), 'gulp');

// the arm angle (the kit's armL/armR value) that puts a hand of length 72 as near (tx, ty) as it reaches, from a shoulder at (sx, sy)
function s2reach(sx, sy, tx, ty, side) {
  const dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy), k = Math.min(1, 72 / d), th = Math.atan2(-dx, dy) * 180 / Math.PI;
  return { arm: side === 'L' ? th - 24 : -24 - th, th, hx: sx + dx * k, hy: sy + dy * k };
}

function scene2(p, D) {
  const st = stallSet(p, S2HOLDS), sc = st.cam, c = classroom(p, S2HOLDS), cc = c.cam, tc = teacherSet(p), tcam = tc.cam;
  const DOG_STALL = { x: 1010, y: 836, s: .9 };
  const dogS = dogPuppet(sc.stage);
  const deskG = cc.stage.lastChild;                                  // the front desk: the dog rises behind it, then stands on it
  const dogL = mk('g', {}, cc.stage), dogC = dogPuppet(dogL);
  const handsPR = [prop(dogL, s2mitten), prop(dogL, s2mitten)];       // Bo's hands over the dog while he lifts it
  const drop = prop(sc.stage, s2drop);
  // the seller's open hand held out toward Bo (five fingers: five yuan), drawn over the counter because the cart hides her own arm
  const palm = prop(sc.stage, `<g filter="url(#paper)"><path d="M1240,522 L1170,540" stroke="#c94a3c" stroke-width="30" stroke-linecap="round"/><g transform="translate(1150,528)">${
    [-62, -30, -10, 10, 30].map((r, i) => `<rect x="-5" y="${i ? -54 : -42}" width="10" height="${i ? 42 : 30}" rx="5" fill="#f7d9bb" transform="rotate(${r})"/>`).join('')}<ellipse rx="21" ry="22" fill="#f7d9bb"/></g></g>`);

  // stall views: wide, oil insert on Me's hands, trio, dog, Bo close-up, medium with all four, seller
  const INS_OIL = { x: 490, y: 665, z: 5 }, TRIO = { x: 740, y: 640, z: 1.9 }, BO_ST = { x: 800, y: 560, z: 2.5 }, MED = { x: 900, y: 570, z: 1.5 },
    AUNT_CU = { x: 1270, y: 500, z: 2.2 }, DOG_ST = { x: 960, y: 770, z: 3.2 };
  sc.cut(STALL_VIEW, 0).cut(INS_OIL, A2(S2.ins)).cut(TRIO, A2(S2.trio)).cut(DOG_ST, A2(S2.dogIns)).cut(TRIO, A2(S2.trio2)).cut(BO_ST, A2(S2.boIdea)).cut(MED, A2(S2.med))
    .cut(AUNT_CU, A2(S2.aunt)).cut(DOG_ST, A2(S2.dogCU));
  sc.soft(A2(S2.ins), true).soft(A2(S2.trio), false).soft(A2(S2.dogIns), true).soft(A2(S2.trio2), false).soft(A2(S2.boIdea), true).soft(A2(S2.med), false).soft(A2(S2.aunt), true);
  // teacher: medium (x kept inside the set), then close-ups
  const TEACH_MED = { x: 1060, y: 530, z: 1.5 };
  tcam.cut(TEACH_MED, 0).cut(TEACH_CU, A2(S2.tcu)).soft(A2(S2.tcu), true);
  // class: two-shot, tight on Bo and the dog, insert of the blank sheet, reactions, dog, pan to the oil, Me, insert of the bites, the gulp
  const TIGHT = { x: 900, y: 610, z: 2.6 }, INS_BLANK = { x: 985, y: 630, z: 3.6 }, BO_CU = { x: 930, y: 540, z: 2.8 }, ME_CU = { x: 680, y: 570, z: 2.8 },
    DOG_CU = { x: 945, y: 630, z: 5.4 }, DOG_CU1 = { x: 800, y: 630, z: 5.4 }, PAN0 = { x: 770, y: 640, z: 4.2 }, PAN1 = { x: 640, y: 610, z: 4.2 },
    INS_BITE = { x: 690, y: 635, z: 3.7 }, GULP = { x: 770, y: 630, z: 3 };
  cc.cut(TWO, 0).cut(TIGHT, A2(S2.tight)).cut(INS_BLANK, A2(S2.insBlank)).cut(TIGHT, A2(S2.tight2)).cut(BO_CU, A2(S2.crick)).cut(ME_CU, A2(S2.meCU))
    .cut(DOG_CU, A2(S2.dogCU2)).to(DOG_CU1, A2(S2.turn - .05), .6)           // the camera follows the dog's head round
    .cut(PAN0, A2(S2.pan)).to(PAN1, A2(S2.pan + .05), .7)                       // then slides along its nose to the oil stain
    .cut(ME_CU, A2(S2.meCU2)).cut(INS_BITE, A2(S2.insBite)).cut(GULP, A2(S2.tight3)).cut(ME_CU, A2(S2.meCU3));
  cc.soft(A2(S2.insBlank), true).soft(A2(S2.tight2), false).soft(A2(S2.crick), true).soft(A2(S2.pan), true).soft(A2(S2.tight3), false).soft(A2(S2.meCU3), true);

  stopClock(D, (q, f) => {
    const a = q - PRE2;
    // which shot is on: [from, name]
    const SH = [[0, 'wide'], [S2.ins, 'ins'], [S2.trio, 'trio'], [S2.dogIns, 'dogST'], [S2.trio2, 'trio'], [S2.boIdea, 'boST'], [S2.med, 'med'], [S2.aunt, 'auntCU'], [S2.dogCU, 'dogST'],
      [S2.tmed, 'tmed'], [S2.two, 'two'], [S2.tcu, 'tcu'], [S2.tight, 'tight'], [S2.insBlank, 'insBlank'], [S2.tight2, 'tight'], [S2.crick, 'boCU'], [S2.tcu2, 'tcu'], [S2.meCU, 'meCU'],
      [S2.dogCU2, 'dogCU'], [S2.pan, 'pan'], [S2.meCU2, 'meCU'], [S2.insBite, 'insBite'], [S2.tight3, 'gulp'], [S2.meCU3, 'meCU']];
    let shot = 'wide'; for (const [t, n] of SH) if (a >= t) shot = n;
    const inStall = a < S2.tmed, inTeach = shot === 'tmed' || shot === 'tcu', inClass = !inStall && !inTeach;
    vis(sc.root, inStall); vis(tcam.root, inTeach); vis(cc.root, inClass);
    sc.apply(q, f); tcam.apply(q, f); cc.apply(q, f);
    const blink = (...t) => blinking(q, t.map(A2));
    const is = (...n) => n.includes(shot);

    /* ---- the stall ---- */
    if (inStall) {
      const dripping = a >= S2.drop && a < S2.plop + .05, stained = a >= S2.plop;
      const up = .5 + .5 * Math.sin(a * 3.4);   // the bun goes to his mouth and back
      const reading = Math.floor(a * 1.3) % 2 ? -.6 : .2;
      const inIns = is('ins'), startled = a >= S2.plop && a < S2.plop + 1.4;
      // Me: bun in the right hand, homework in the left; in the insert the bun hangs over the sheet and drips
      const armR = inIns ? -128 : -112 - 8 * up;
      vis(st.me.g, is('wide', 'ins', 'trio', 'med'));
      st.me.pose({ x: STALL.me, y: STALL.ground, s: STALL.s, look: is('med') ? .1 : -.4, eyeX: is('med') ? 1 : startled ? -1 : reading, eyeY: .55, lids: .3, headR: -3,
        mouth: startled || inIns ? 'flat' : chew(q), shut: blink(1.2, 5.3, 8.4, 9.9), hold: a >= 1.1 ? 'bite' : 'bun', holdL: !stained ? 'hw' : a < S2.plop + .2 ? 'hwS' : 'hwG',
        armL: -52, armR, bob: inIns || startled ? 0 : -1.5 * up }, f);
      // the drop falls from the bun onto the sheet
      vis(drop, dripping && inIns);
      if (dripping) { const u = (a - S2.drop) / (S2.plop + .05 - S2.drop);
        tf(drop, `translate(${(482 - 18 * u).toFixed(1)},${(652 + 37 * u * u).toFixed(1)}) scale(${(1 + .3 * Math.min(1, u * 3)).toFixed(2)})`); }
      // Bo: waits; looks at the dog; the idea (a beat of silence); "Can I rent your dog?" pointing at it; hand down
      const ask = lips(q, 'scene2', PRE2, 's05');
      const point = a >= S2.med - .1 && a < 9.4 ? ease((a - S2.med + .1) / .25) * (1 - ease((a - 9.1) / .3)) : 0;
      const boIdea = a >= 6.5 && a < S2.med;
      vis(st.bo.g, is('wide', 'trio', 'boST', 'med'));
      const dogLook = a >= 4.4;
      st.bo.pose({ x: STALL.bo, y: STALL.ground, s: STALL.s, look: is('boST') ? .5 : dogLook ? .7 : -.5, eyeX: dogLook ? 1 : -1, eyeY: dogLook ? .8 : 0,
        lids: boIdea ? 0 : .2, brow: boIdea ? .5 : 0, headR: is('boST') ? 2 : 3 * point,
        mouth: boIdea && a > 6.95 ? 'smile' : ask === 'X' ? 'flat' : ask, shut: blink(2.1, 4.0, 6.2, 8.4, 10.6),
        armR: 14 + 36 * point - (point ? 0 : 14), bob: 0 }, f);
      // the seller, deadpan, palm out toward Bo for the five yuan
      const price = lips(q, 'scene2', PRE2, 's05b');
      vis(st.aunt.g, is('wide', 'med', 'auntCU', 'trio'));
      st.aunt.pose({ ...STALL.aunt, look: -.5, eyeX: -1, lids: .35, mouth: price === 'X' ? 'flat' : price, shut: blink(3.0, 7.6, 11.0, 12.2), armL: 0 }, f);
      vis(palm, a >= 9.7 && a < 12.6 && is('med', 'auntCU')); tf(palm, `translate(0,${(34 * (1 - ease((a - 9.7) / .3))).toFixed(1)})`);
      // the dog: asleep, breathing; sniffs toward Me in its sleep (insert); after the price wakes: eye opens, head up, then it rises
      vis(dogS.g, is('wide', 'trio', 'med', 'dogST'));
      const sn = a >= S2.sniffD && a < S2.sniffD + .8, rise0 = 12.35, u = ease((a - rise0) / .45);
      const dg = { ...DOG_STALL, dir: -1, lie: 1, bob: .9 * Math.sin(a * 2.2), lids: .8, eyeX: -.6 };
      if (sn) Object.assign(dg, { sniff: true, headR: 20 * ease((a - S2.sniffD) / .25) * (1 - ease((a - S2.sniffD - .55) / .25)), ear: 8 * Math.sin((a - S2.sniffD) * 14) });
      if (a >= 11.2) Object.assign(dg, { headR: 10 * ease((a - 11.2) / .7), ear: 8 * ease((a - 11.2) / .7) });         // heard the price
      if (a >= 12.0) Object.assign(dg, { lie: 'awake', lids: .8 - .4 * ease((a - 12.0) / .3), headR: 14, tail: 8 * Math.sin((a - 12.0) * 16) });   // one eye, the tail thumps
      if (a >= rise0) Object.assign(dg, { lie: 1 - u, sit: u, bob: .3 * Math.sin(a * 2.2), headR: 14 - 6 * u, shut: false, lids: .4, tail: 6, wag: a >= rise0 + .9 && a < rise0 + 1.6 });
      dogS.pose(dg, f);
    }

    /* ---- the teacher ---- */
    if (inTeach) {
      const l = lips(q, 'scene2', PRE2, 's06', 's07');
      tc.t.pose({ ...TEACHER, look: 0, eyeX: 0, lids: .45, mouth: l === 'X' ? 'flat' : l, shut: blink(14.0, 14.6, 20.9, 21.9, 22.6, 25.8), headR: shot === 'tcu' ? 1 : 0 }, f);
    }

    /* ---- the boys' desk ---- */
    if (inClass) {
      const full = is('two', 'tight', 'gulp');
      // --- Bo: stands, ducks under the desk, lifts the dog, presents it with open palms ("Exhibit A."), fetches his blank sheet ---
      const ex = lips(q, 'scene2', PRE2, 's06b');
      const duckA = ease((a - S2.duck) / (S2.down - S2.duck)) * (1 - ease((a - S2.rise) / (S2.over - S2.rise)));
      const duckB = ease((a - S2.fetch) / .22) * (1 - ease((a - S2.back) / .25));
      const dep = 110 * duckA + 110 * duckB;
      const bo = { ...c.BO_UP, y: c.BO_UP.y + dep, sit: dep > 30, look: -.7 + .5 * (a > S2.land), eyeX: -1, lids: .15, mouth: ex === 'X' ? 'flat' : ex, shut: blink(16.7, 19.5, 24.6, 25.2),
        brow: 0, hold: null, headR: 0, armL: 0, armR: 0 };
      // the lift: both hands under the dog, which rises from behind the desk, goes over it and is set down
      const dogX = 880;
      let feet = 900, hands = false;
      if (a >= S2.rise && a < S2.over) { const u = ease((a - S2.rise) / (S2.over - S2.rise)); feet = 860 + (686 - 860) * u; hands = true; }
      else if (a >= S2.over && a < S2.land) { const u = ease((a - S2.over) / (S2.land - S2.over)); feet = 686 + (DOG_DESK.y - 686) * u; hands = true; }
      else if (a >= S2.land) feet = DOG_DESK.y;
      const sh = side => [c.BO.x + (side === 'L' ? -54 : 54), c.BO_UP.y + dep - 146];
      handsPR.forEach(h => vis(h, false));
      if (hands) {
        const belly = feet - 42, hx = a < S2.over ? 860 : 860 + 20 * ease((a - S2.over) / (S2.land - S2.over));
        const rl = s2reach(...sh('L'), hx - 30, belly, 'L'), rr = s2reach(...sh('R'), hx + 50, belly, 'R');
        bo.armL = rl.arm; bo.armR = rr.arm;
        [[handsPR[0], rl], [handsPR[1], rr]].forEach(([h, r]) => { vis(h, feet < 770); tf(h, `translate(${r.hx.toFixed(1)},${r.hy.toFixed(1)}) rotate(${r.th.toFixed(1)})`); });
      }
      if (a >= S2.duck && a < S2.rise) bo.lids = .3;
      if (a >= S2.land) {
        // let go; on "Exhibit A." both palms open toward the dog; then down under the desk for the blank sheet (after "A.")
        const pa = ease((a - S2.present) / .3) * (1 - ease((a - S2.fetch) / .2));
        bo.armL = 6 + 42 * pa; bo.armR = 6 + 42 * pa; bo.headR = 3 * pa;
        if (a >= S2.back) { bo.hold = 'bhw'; bo.armR = 6 - 36 * ease((a - S2.raise) / .35); bo.armL = 6; }
        if (a >= S2.tight3 - .3) { bo.brow = .5 * ease((a - S2.tight3 + .3) / .3); bo.look = -.5; bo.mouth = 'O'; bo.armR = -30 + 36 * ease((a - S2.tight3 - .3) / .4); }
      }
      vis(c.bo.g, is('two', 'tight', 'gulp', 'insBlank', 'boCU', 'dogCU')); c.bo.pose(bo, f);

      // --- Me: the greasy sheet in his left hand, in front of his chest, the mitten under its corner ---
      const T = S2.chomp, cnt = T.filter(t => a >= t).length;        // bites finished (the sheet changes on the frame the jaw closes)
      const eaten = cnt >= 3;
      const holdL = eaten ? 'scrap' : ['hwG', 'e1', 'e2'][cnt];
      const fear = ease((a - (S2.meCU2 - .3)) / .3) * (a < 31.9 ? 1 : 1 - ease((a - 31.9) / .5) * .5);
      const scared = a >= S2.meCU2 - .3;
      const meLook = a < S2.rise ? .3 : a < S2.back ? .6 : a < S2.tcu ? .3 : .6;
      const me = { ...c.ME, sit: true, look: scared ? .6 : meLook, eyeX: scared ? 1 : a < S2.land ? .8 : a < S2.dogCU2 ? .4 : 1, eyeY: .3,
        lids: .38 - .38 * fear * (a < S2.meCU3 ? 1 : .6), brow: .8 * fear, mouth: fear > .6 ? 'O' : fear > .2 ? 'B' : 'flat', headR: -3 * fear,
        shut: blink(16.4, 21.2, 26.2, 27.0, 31.8, 33.0) && fear < .3, holdL, hold: null, armL: -62, armR: 0, squash: fear > .5 && a < S2.tight3 ? .03 : 0 };
      if (a >= S2.meCU3) Object.assign(me, { armL: -70, lids: .15, brow: .5, mouth: a < S2.meCU3 + .8 ? 'O' : 'flat', shut: blink(33.1) });
      vis(c.me.g, is('two', 'tight', 'gulp', 'meCU', 'pan', 'insBite', 'dogCU')); c.me.pose(me, f);

      // --- the dog ---
      const dogP = { ...DOG_DESK, x: dogX, dir: 1, bob: .5 * Math.sin(a * 2.4), tail: 5, ear: 3 * Math.sin(a * 1.7) + 4 * (blinking(q, [A2(21.0), A2(24.0)]) ? 1 : 0), shut: blink(21.5, 24.0, 28.4, 31.7), lids: .1, eyeX: 0, y: feet };
      vis(dogC.g, a >= S2.rise && is('two', 'tight', 'gulp', 'insBlank', 'dogCU', 'pan', 'insBite'));
      // behind the desk while it is lifted over it, in front of it once it is clear
      const onTop = a >= S2.over;
      if (onTop !== dogL._top) { dogL._top = onTop; if (onTop) cc.stage.appendChild(dogL); else cc.stage.insertBefore(dogL, deskG); }
      if (a >= S2.rise) {   // carried: head down, tail drooping, ears back; eased out as it is set down
        const w = 1 - ease((a - S2.land) / .4);
        Object.assign(dogP, { headR: -8 * w, tail: 5 - 27 * w, ear: 14 * w, eyeX: .6 * w, lids: .1 + .2 * w });
        if (a >= S2.land && a < S2.land + .4) dogP.y = DOG_DESK.y + 5 * Math.sin(Math.PI * (a - S2.land) / .4);
        if (a >= S2.present && a < S2.fetch) Object.assign(dogP, { headR: 8, eyeX: 0 });      // presented: head up, facing the class
      }
      // sniffs Bo's blank sheet (nose on the paper), then snubs it: nose in the air, eyes half shut, a "hmph" blink, a step back
      if (a >= S2.insBlank - .4 && a < S2.tight2) Object.assign(dogP, { sniff: a >= S2.insBlank, headR: 14 + 3 * Math.sin((a - S2.insBlank) * 18), eyeX: 1, x: dogX + 14 * ease((a - S2.insBlank + .4) / .4) });
      if (a >= S2.tight2) { const u = ease((a - S2.tight2) / .4);
        Object.assign(dogP, { headR: 14 + 22 * u, lids: .1 + .5 * u, eyeX: 1 - 2 * u, x: dogX + 14 - 24 * u, tail: 5 - 5 * u, shut: a >= S2.tight2 + .45 && a < S2.tight2 + .7 }); }
      // close-up: the nose twitches, the head rises, then the whole dog turns toward Me in six steps while stepping over
      if (a >= S2.dogCU2 && a < S2.turn) Object.assign(dogP, { sniff: true, headR: 36 - 22 * ease((a - S2.dogCU2) / .4), lids: .6 - .5 * ease((a - S2.dogCU2) / .5), eyeX: -.4, x: dogX - 10 });
      const REST = 830;
      if (a >= S2.turn) {
        const t = (a - S2.turn) / .5, seq = [1, .7, .35, -.35, -.7, -1];
        dogP.dir = seq[Math.max(0, Math.min(5, Math.floor(t * 6)))];
        Object.assign(dogP, { headR: 14, lids: .1, eyeX: 1, sniff: a < S2.pan + .9, x: (dogX - 10) + (REST - dogX + 10) * ease(t), bob: .5 * Math.sin(a * 2.4) - 4 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))) });
      }
      // the three bites: head back, then jaw wide and a lunge at the sheet's right edge, closing on it; held, then back for a beat
      const TIP = [684, 662, 638];
      let lunge = REST, jaw = 0, head = 4;
      if (a >= S2.insBite - .3) {
        for (let k = 0; k < 3; k++) {
          const t = T[k], x = TIP[k] + 105;
          if (a >= t - .3 && a < t) { const u = ease((a - (t - .3)) / .22); jaw = .8 * u; lunge = (k ? TIP[k - 1] + 105 + 28 : REST) + (x - (k ? TIP[k - 1] + 105 + 28 : REST)) * u; head = -2; }
          else if (a >= t && a < t + .15) { lunge = x; jaw = 0; head = -2; }
          else if (a >= t + .15 && a < t + .3) { lunge = x + (k < 2 ? 28 : REST - x) * ease((a - t - .15) / .15); head = -2 + 6 * ease((a - t - .15) / .15); }
        }
        if (a >= T[2] + .3) lunge = REST;
        dogP.x = lunge; dogP.jaw = jaw; dogP.headR = head; dogP.lids = .1; dogP.eyeX = 1; dogP.sniff = false;
        if (a >= T[0] - .3 && a < T[2] + .3 && jaw === 0 && !(T.some(t => a >= t && a < t + .15))) dogP.jaw = .2 * (onTwos(q) > 0);   // chewing between bites
        if (a >= T[2] + .3) { dogP.jaw = a < S2.gulp - .1 ? .22 * (onTwos(q) > 0) : 0; dogP.headR = 4; dogP.lids = .3; }
        if (a >= S2.gulp - .1 && a < S2.gulp + .45) { const g = Math.sin(Math.PI * ease((a - S2.gulp + .1) / .55)); dogP.headR = 4 + 16 * g; dogP.bob = (dogP.bob || 0) - 3 * g; }
        if (a >= S2.gulp + .6) { dogP.wag = true; dogP.tail = 14; dogP.headR = 2; dogP.eyeX = 1; }
        dogP.dir = -1;
      }
      dogP.glasses = false;
      dogC.pose(dogP, f);

      // the class: heads turn toward the dog once it comes up; only the wider shots show them
      for (const m of c.mates) vis(m.p.g, full);
      if (full) { if (a >= S2.rise) c.matesPose(q, f, { lookAt: 800, t0: A2(S2.rise + .3) }); else c.matesPose(q, f); }
    }
  });
}
