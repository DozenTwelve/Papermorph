/* scene3.js — 转, the slip. Bo asks the question (thought bubbles merge), Me stares, the daydream of a breakfast on the
   squat pan, "Go eat shit", Bo's slow realisation and his answer; ends on the two-shot scene 4 opens on. */
'use strict';
const PRE3 = 3.6;   // scene 2 ends on this same two-shot; the pre-roll (bell, growl, two wants colliding) fills it

/* ---------- scene-only props (drawn at (0, 0), baked like puppet pieces) ---------- */
const S3INK = '#3a3430';
const s3toiletSVG = `<g filter="url(#paper)"><rect x="-18" y="-42" width="36" height="26" rx="4" fill="#fafcfc" stroke="${S3INK}" stroke-width="3"/>
  <circle cx="12" cy="-47" r="4" fill="#c9d3d3" stroke="${S3INK}" stroke-width="2"/>
  <path d="M-28,-14 H28 Q28,10 9,16 L9,30 H-9 L-9,16 Q-28,10 -28,-14 Z" fill="#fafcfc" stroke="${S3INK}" stroke-width="3"/>
  <ellipse cx="0" cy="-14" rx="28" ry="7" fill="#dfe7e7" stroke="${S3INK}" stroke-width="3"/></g>`;
// a thought bubble: the cloud with `inner` in it and the little trailing circles toward the thinker (dx: which way they lean)
const s3bubble = (inner, dx) => `<g filter="url(#paper)"><circle cx="${dx * 24}" cy="74" r="9" fill="#fff" stroke="${S3INK}" stroke-width="3"/>
  <circle cx="${dx * 38}" cy="96" r="5.5" fill="#fff" stroke="${S3INK}" stroke-width="3"/>
  <circle r="64" fill="#fff" stroke="${S3INK}" stroke-width="3.5"/></g>${inner}`;
const s3bubbleToilet = s3bubble(`<g transform="translate(0,6) scale(1.15)">${s3toiletSVG}</g>`, 1);
const s3bubbleBun = s3bubble(`<g transform="translate(0,6) scale(2.1)">${bunSVG()}</g>`, -1);
const s3bubbleBoth = s3bubble(`<g transform="translate(0,12) scale(1.15)">${s3toiletSVG}</g><g transform="translate(0,-14) scale(1.15)">${bunSVG()}</g>`, 0);
const s3placemat = `<g filter="url(#paper)"><rect x="-150" y="-12" width="300" height="24" rx="6" fill="url(#check)"/></g>`;
const s3flySVG = `<ellipse cx="0" cy="0" rx="6" ry="4.5" fill="#1d1a1a"/><circle cx="-6" cy="-1" r="3.4" fill="#1d1a1a"/>
  <g data-w="1"><ellipse cx="2" cy="-6" rx="8" ry="3.2" fill="#e4eef7" fill-opacity=".85" stroke="#8a9aa8" stroke-width=".8" transform="rotate(-20 2 -6)"/></g>`;

// the dreamy cloud-edged border: a scalloped fog with a clear middle (evenodd), two layers of different size
function s3cloud(cx, cy, rx, ry, n, ph, r) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = ph + 2 * Math.PI * i / n, x = (cx + rx * Math.cos(a)).toFixed(1), y = (cy + ry * Math.sin(a)).toFixed(1);
    d += i ? `A${r},${r} 0 0 0 ${x},${y} ` : `M${x},${y} `;
  }
  return d + 'Z';
}
const s3popBack = u => { u = Math.min(1, Math.max(0, u)); return u <= 0 ? 0 : 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2; };

/* ---------- audio cues ---------- */
const A6 = clipAt('scene3', PRE3, 's06'), A7 = clipAt('scene3', PRE3, 's07'), A8 = clipAt('scene3', PRE3, 's08'), A8B = clipAt('scene3', PRE3, 's08b');
// pre-roll (absolute q): bell, growl + bun bubble, glance at the door + toilet bubble, three shoves, merge, cut to Bo
const S3 = { bell: .15, growl: .9, popB: 1.0, glance: 1.8, popT: 2.1, jost: 2.45, slide: 3.05, merge: 3.3, bo1: A6 - .1,
  tilt: .5,
  me1: A6 + 4.2, snap: A6 + 6.15, loo: A6 + 6.55, flyIn: A6 + 6.6, land: A6 + 7.65, me2: A6 + 9.9,   // Me stares, daydream, back to Me
  bo2: A7 + 2.2, me3: A8 + 2.3, two: A8B + 1.5 };   // Bo thinks (after s07), Me thinks (after s08), final two-shot
sfx('scene3', S3.bell, 'bell');
sfx('scene3', S3.growl, 'growl');
sfx('scene3', S3.me1 + .3, 'crickets');
sfx('scene3', S3.snap, 'whoosh');
sfx('scene3', S3.flyIn, 'fly');
sfx('scene3', S3.land, 'violin');

function scene3(p, D) {
  const c = classroom(p), cam = c.cam;
  const BO_CU1 = { x: 920, y: 494, z: 2.1 }, BO_CU2 = { x: 920, y: 544, z: 2.8 }, ME_CU = { x: 680, y: 570, z: 2.8 }, EYES = { x: 703, y: 545, z: 6.5 };
  // 3.1 two-shot, Bo desperate: "Dude."   3.2 close on Bo: the thought bubbles pop up and merge
  cam.cut(TWO, 0).to({ ...TWO, y: 495 }, S3.tilt, .4).shake(S3.growl, .5, 2);   // tilt up to give the bubbles room
  cam.cut(BO_CU1, S3.bo1).soft(S3.bo1, true);
  // 3.3 close on Me: the stare, then a snap zoom into his eyes
  cam.cut(ME_CU, S3.me1).to(EYES, S3.snap, .22);
  // 3.5 Me, deadpan: "Go eat shit."   3.6 reverse on Bo: the realisation   3.7 back to the two-shot
  cam.cut(ME_CU, S3.me2).cut(BO_CU2, S3.bo2).cut(ME_CU, S3.me3).cut(TWO, S3.two).soft(S3.two, false);

  // 3.4 the daydream: the squat pan laid like a breakfast place, a fly, a violin — on its own camera, in a cloud border
  const loo = paperCam(p, 'loo');
  loo.cut({ x: 800, y: 640, z: 2.9 }, 0);
  prop(loo.stage, `<g transform="translate(800,668)">${s3placemat}</g>`);
  prop(loo.stage, `<g transform="translate(735,664) scale(2.1)">${bunSVG()}</g>`);
  prop(loo.stage, `<g transform="translate(880,654) scale(1.8)">${soySVG}</g>`);
  const fly = mk('g', {}, loo.stage); fly.innerHTML = s3flySVG;
  const wing = fly.querySelector('[data-w]');
  const dream = mk('g', {}, p);
  mk('rect', { width: 1600, height: 900, fill: '#ffe3f0', opacity: .12 }, dream);
  mk('path', { 'fill-rule': 'evenodd', fill: '#fff', opacity: .5, d: `M-60,-60 H1660 V960 H-60 Z ${s3cloud(800, 450, 760, 450, 26, .1, 78)}` }, dream);
  mk('path', { 'fill-rule': 'evenodd', fill: '#fff4f9', opacity: .92, d: `M-60,-60 H1660 V960 H-60 Z ${s3cloud(800, 450, 680, 390, 30, 0, 66)}` }, dream);
  const haze = dream.children[2];

  // the three bubbles live in the classroom's world so they follow the camera over Bo's head
  const bT = prop(cam.world, `<g>${s3bubbleToilet}</g>`), bB = prop(cam.world, `<g>${s3bubbleBun}</g>`), bM = prop(cam.world, `<g>${s3bubbleBoth}</g>`);
  const place = (g, q, x, y, s) => { vis(g, s > 0.01); if (s > .01) tf(g, `translate(${x.toFixed(1)},${(y + 3 * onTwos(q)).toFixed(1)}) scale(${s.toFixed(3)})`); };

  const Y = 356, XT = 805, XB = 1045, XM = 925;   // over seated Bo's head
  stopClock(D, (q, f) => {
    const two = q < S3.bo1 || q >= S3.two, pre = q < S3.bo1, boCU = (q >= S3.bo1 && q < S3.me1) || (q >= S3.bo2 && q < S3.me3);
    const meCU = (q >= S3.me1 && q < S3.loo) || (q >= S3.me2 && q < S3.bo2) || (q >= S3.me3 && q < S3.two), dreaming = q >= S3.loo && q < S3.me2;
    vis(cam.root, !dreaming); vis(loo.root, dreaming); vis(dream, dreaming);
    cam.apply(q, f); loo.apply(q, f);
    c.matesPose(q, f);   // everyone stays in every classroom shot, blinking and glancing
    const lipsOf = (...cl) => { const m = lips(q, 'scene3', PRE3, ...cl); return m === 'X' ? 'flat' : m; };
    const fin = q >= S3.two;   // the closing deadpan two-shot

    // Bo: seated, asks casually; then (reverse) stares, blinks, eyes drift up, a beat, deadpan "You are shit."
    const bo = { ...c.BO, sit: true, look: -.7, eyeX: -1, mouth: lipsOf('s06'), shut: blinking(q, [.5, 2.3, 3.9, S3.bo2 + .7, S3.bo2 + 1.9, A8 + 1.7, A8 + 3.2, A8B + 1.9]) };
    if (pre) {   // hungry (eyes down, hand on belly, growl), glances at the door, eyes up at the bubbles
      const gl = q >= S3.glance && q < S3.popT + .3, up = q >= S3.popT + .3, g = q >= S3.growl && q < S3.growl + .5;
      Object.assign(bo, { mouth: g ? 'wobble' : 'frown', look: gl ? -1 : up ? -.2 : 0, eyeX: gl ? -1 : up ? -.3 : 0, eyeY: gl ? 0 : up ? -.7 : .7, lids: .2, brow: -.4,
        armR: -35, squash: g ? .03 * onTwos(q) : 0, headR: gl ? -3 : up ? 2 : -2 });
    } else if (q < S3.bo2) {
      Object.assign(bo, { headR: -1 });   // a casual question, seated: he hasn't noticed the slip
    } else if (q < A8) {
      const up = q >= S3.bo2 + 1.1;   // after a stare, the eyes drift up and a beat is held
      Object.assign(bo, { lids: up ? .15 : .25, eyeX: up ? -.3 : -1, eyeY: up ? -.8 : 0, brow: up ? -.3 : 0, headR: up ? 2 : 0, mouth: 'flat' });
    } else {
      Object.assign(bo, { lids: .5, mouth: lipsOf('s08'), eyeX: -.6, headR: 0 });
    }
    c.bo.pose(bo, f);

    // Me: blank stare (blinks, a tiny glance), the deadpan answer, then thinks and answers flat
    const me = { ...c.ME, sit: true, look: .7, eyeX: .8, lids: .12, mouth: lipsOf('s07', 's08b'), shut: blinking(q, [1.6, 3.0, A6 + 4.9, A6 + 5.8, S3.me2 + .2, A7 + 2.2, S3.me3 + .9, A8B + 2.3]) };
    if (pre && q >= S3.growl) Object.assign(me, { lids: .3, headR: 2 });   // hears the growl
    if (q >= S3.me1 && q < S3.loo) me.eyeX = q >= A6 + 6.0 ? .4 : .8;
    if (q >= S3.me2) me.lids = .5;
    if (q >= S3.me3 && q < A8B) { me.eyeX = q >= S3.me3 + 1.4 ? .2 : .8; me.eyeY = q >= S3.me3 + 1.4 ? -.5 : 0; }
    c.me.pose(me, f);

    // the bubbles over Bo's head
    const sT = s3popBack((q - S3.popT) / .25), sB = s3popBack((q - S3.popB) / .25), u = span(q, S3.slide, S3.merge), shown = q < S3.me1;
    const merged = q >= S3.merge, bump = 1 + .1 * Math.exp(-(q - S3.merge) * 14) * (merged);
    // the shoves: each lunges the two bubbles together, then they settle a little closer
    const qq = Math.floor(q * 6) / 6, n = Math.min(2, Math.max(0, Math.floor((qq - S3.jost) / .2))), ph = ((qq - S3.jost) % .2) / .2;
    const jostling = qq >= S3.jost && q < S3.slide;
    const hg = ([120, 86, 68][n + (jostling ? 0 : 0)] - (jostling ? 16 * Math.max(0, 1 - ph * 3) : 0)) * (qq < S3.jost ? 1 : 1) * (1 - u);
    const hgS = q < S3.jost ? 120 * (1 - u) : q < S3.slide ? hg : 56 * (1 - u), sh = jostling && ph < .35 ? 5 * (n % 2 ? -1 : 1) : 0;
    place(bT, q, XM - hgS, Y + sh, shown && !merged ? sT : 0);
    place(bB, q, XM + hgS, Y - sh, shown && !merged ? sB : 0);
    place(bM, q, XM, Y - 6, shown && merged ? bump : 0);

    // the daydream: the fly circles the bun and lands
    if (dreaming) {
      const w = Math.min(1, Math.max(0, (q - S3.flyIn) / (S3.land - S3.flyIn))), R = 200 * (1 - w) ** 1.3, a = 2 * Math.PI * 2.3 * w;
      const x = 735 + R * Math.cos(a), y = 622 - 70 * (1 - w) + R * .42 * Math.sin(a);
      const flying = w < 1, twitch = q > 9.2 && q < 9.45;
      tf(fly, `translate(${(x + (flying ? 3 * jit(f, 50) : 0)).toFixed(1)},${(y + (flying ? 3 * jit(f, 51) : 0)).toFixed(1)}) scale(${Math.cos(a) > 0 || !flying ? 1.7 : -1.7},1.7)`);
      vis(wing, flying ? f % 2 === 0 : twitch);
      tf(haze, `translate(800 450) scale(${(1 + .012 * Math.sin(q * 3)).toFixed(3)}) translate(-800 -450)`);
    }
  });
}
