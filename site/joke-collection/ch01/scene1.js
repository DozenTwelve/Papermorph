/* scene1.js — 起: the ritual. Wide town, then the bun stall three mornings running (sun, rain, snow) in one locked
   framing, then the same three shots again, cut on "Every. Single. Morning." */
'use strict';
const PRE1 = 1.3;

// piecewise-linear keyframes: s1kf(r, [[t, v], …])
const s1kf = (r, k) => { if (r <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (r < k[i][0]) { const [a, va] = k[i - 1], [b, vb] = k[i]; return va + (vb - va) * (r - a) / (b - a); } return k[k.length - 1][1]; };
const s1h = (i, k) => (jit(i * 7919 + 13, k) + 1) / 2;   // a stable 0…1 number per index

// "Grade 7": a small paper label with a strip of tape
const s1label = `<g filter="url(#paper)"><path d="M0,6 L330,0 L336,128 L4,134 Z" fill="#f6ecc9"/><path d="M0,6 L330,0" stroke="#d9c88f" stroke-width="3"/></g>
  <g filter="url(#paper)"><rect x="118" y="-14" width="100" height="30" fill="#d8d0b4" opacity=".85" transform="rotate(-3 168 0)"/></g>
  <text x="168" y="96" font-family="Chalkboard, Comic Sans MS, sans-serif" font-weight="700" font-size="82" text-anchor="middle" fill="#3a2f26">Grade 7</text>`;
// a scarf round the neck (drawn over the chin line), w half-width of the body; one tail hangs down the chest
const s1scarf = w => `<g filter="url(#paper)"><path d="M${-w},-170 Q0,-136 ${w},-170 L${w + 4},-146 Q0,-112 ${-w - 4},-146 Z" fill="#c94a3c"/>
  <rect x="${w * .35}" y="-150" width="${w * .42}" height="76" rx="6" fill="#c94a3c"/><path d="M${w * .35},-124 h${w * .42} M${w * .35},-100 h${w * .42}" stroke="#f4f1ea" stroke-width="5"/></g>`;

function scene1(p, D) {
  const B = ['s02', 's02c', 's02e'].map(c => clipAt('scene1', PRE1, c)), IN = .45;   // each day: Bo's line starts IN s after the cut
  const cuts = [B[0] - IN, B[1] - IN, B[2] - IN];
  const montage = [cueAt('scene1', PRE1, 7) - .04, cueAt('scene1', PRE1, 8) - .04, cueAt('scene1', PRE1, 9) - .04];   // Every. / Single. / Morning.
  const WX = ['sun', 'rain', 'snow'];
  const STALL_AT = cueAt('scene1', PRE1, 1) - .05;   // cut to the stall on "Every morning, the first one:"

  // 1 the town: wide, held, a slow push toward the school gate
  const town = paperCam(p, 'town', { x: 800, y: 450, z: 1 });
  town.to({ x: 800, y: 500, z: 1.14 }, .2, cuts[0]);
  // 2 the stall: Me left, Bo right, the seller behind her cart — one framing for all six shots
  const st = stallSet(p, { bun: bunSVG(), bite: bunSVG(true), umbM: umbrellaArt('red'), umbB: umbrellaArt('yellow') }); st.cam.cut(STALL_VIEW, 0);
  const scarfMe = prop(st.cam.stage, s1scarf(70)), scarfBo = prop(st.cam.stage, s1scarf(48));
  const tossBun = [prop(st.cam.stage, bunSVG()), prop(st.cam.stage, bunSVG())];

  // weather in front of everything: tint, rain streaks, snowflakes
  const tint = mk('rect', { width: 1600, height: 900, opacity: 0 }, p);
  const rain = mk('path', { fill: 'none', stroke: '#6f93b4', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .8 }, p);
  const flakes = Array.from({ length: 90 }, (_, i) => mk('circle', { r: 3 + 5 * s1h(i, 3), fill: '#fff', stroke: '#b3c6dc', 'stroke-width': 1.5 }, p));
  const label = prop(p, s1label);
  sfx('scene1', .05, 'sting');
  sfx('scene1', cuts[1], 'rain', .6); sfx('scene1', montage[1], 'rain-short', .5);

  stopClock(D, (q, f) => {
    // which shot are we in?
    let k = -1; for (let i = 0; i < 3; i++) if (q >= cuts[i]) k = i;
    let m = -1; for (let i = 0; i < 3; i++) if (q >= montage[i]) m = i;
    const isTown = q < STALL_AT, eating = m >= 0, wi = eating ? m : Math.max(k, 0);
    const w = isTown ? 'sun' : WX[wi];
    const t0 = eating ? montage[m] : cuts[Math.max(k, 0)];
    const r = eating ? 4.4 + (q - t0) : q - t0, rainy = w === 'rain', snowy = w === 'snow';
    vis(town.root, isTown); vis(st.cam.root, !isTown);

    // title label: pops in on the sting, gone after about two seconds
    const lt = q - 1.0, showLabel = lt >= 0 && lt < 2.1;
    vis(label, showLabel); if (showLabel) tf(label, `translate(150,${90 + (lt < .17 ? 30 * (1 - lt / .17) : 0)}) rotate(-4) scale(${lt < .17 ? .88 : 1})`);
    if (isTown) { town.apply(q, f); vis(tint, false); vis(rain, false); flakes.forEach(c => vis(c, false)); return; }
    st.cam.apply(q, f); st.weather(w);

    // weather
    const fi = Math.floor(f / 2);
    vis(tint, rainy || snowy); tint.setAttribute('fill', rainy ? '#3a4a63' : '#e4ecf6'); tint.setAttribute('opacity', rainy ? .1 : .06);   // the painted street carries the weather; this only pulls the puppets into it
    vis(rain, rainy);
    if (rainy) { let d = ''; for (let i = 0; i < 80; i++) {
      const x = ((s1h(i, 1) * 1800 - fi * 22 * (.6 + s1h(i, 2))) % 1800 + 1800) % 1800 - 100, y = ((s1h(i, 4) * 1000 + fi * (85 + 60 * s1h(i, 5))) % 1000) - 50;
      d += `M${x.toFixed(0)},${y.toFixed(0)} l-10,44 `; } rain.setAttribute('d', d); }
    flakes.forEach((c, i) => { vis(c, snowy); if (snowy) {
      const sp = .5 + s1h(i, 6);
      c.setAttribute('cx', (((s1h(i, 7) * 1800 + Math.sin(fi * .5 + i) * 14 - fi * 3) % 1800 + 1800) % 1800 - 100).toFixed(0));
      c.setAttribute('cy', (((s1h(i, 8) * 1000 + fi * 15 * sp) % 1000) - 50).toFixed(0)); } });

    // the lines: Bo asks, Me answers (silent in the closing montage)
    const bo = eating ? 'X' : lips(q, 'scene1', PRE1, 's02', 's02c', 's02e'), me = eating ? 'X' : lips(q, 'scene1', PRE1, 's02b', 's02d', 's02f');
    const speakBo = bo !== 'X', speakMe = me !== 'X';

    // buns: arrive in flight, eaten with deadpan chewing
    const landBo = 3.65, landMe = 4.05, tossBo = 3.35, tossMe = 3.55;
    const gotBo = r >= landBo, gotMe = r >= landMe;
    const chewing = (landAt, kk) => r >= landAt + .25 ? ((Math.floor((f + kk) / 2)) % 2 ? 'chew' : 'A') : 'flat';
    const umb = rainy ? 150 : 0;

    // the seller: arm up, two overarm tosses, arm down; her left (our left) hand holds the bun
    const aArm = s1kf(r, [[2.9, 0], [3.2, 150], [3.35, 150], [3.45, 105], [3.5, 150], [3.55, 150], [3.65, 105], [3.8, 120], [4.2, 0]]);
    const aBun = (r >= 3.2 && r < 3.38) || (r >= 3.5 && r < 3.58);
    st.aunt.pose({ ...STALL.aunt, armL: aArm, holdL: aBun ? 'bun' : null, mouth: 'flat', lids: .25, shut: blinking(r, [1.4, 5.3]) }, f);

    // flying buns (thrown on twos: the position changes every other frame)
    const fly = (i, t, dur, from, to, h, spin) => {
      const u = r >= t && r < t + dur ? Math.min(1, Math.floor((r - t) * FPS / 2) * 2 / FPS / dur) : -1;
      vis(tossBun[i], u >= 0);
      if (u >= 0) tf(tossBun[i], `translate(${from[0] + (to[0] - from[0]) * u},${from[1] + (to[1] - from[1]) * u - 4 * h * u * (1 - u)}) rotate(${spin * u}) scale(1.25)`);
    };
    const handA = [1232, 446], handBo = [STALL.bo + (48 + 69) * STALL.s, STALL.ground - 140 * STALL.s + 24], handMe = [STALL.me + (104 + 69) * STALL.s, STALL.ground - 135 * STALL.s + 24];
    fly(0, tossBo, .3, handA, handBo, 150, -300); fly(1, tossMe, .5, handA, handMe, 200, 560);

    const lidsDead = .3;
    // Me: left. Listens to Bo's line (eyes toward him), answers, takes the bun, chews.
    st.me.pose({ x: STALL.me, y: STALL.ground, s: STALL.s, mouth: speakMe ? me : gotMe ? chewing(landMe, 1) : 'flat', lids: lidsDead, shut: blinking(r, [.7, 4.6, 6.9]),
      eyeX: s1kf(r, [[.4, 0], [.5, .7], [1.3, .7], [1.4, 0]]), headR: speakMe ? -2 : 0, bob: gotMe && chewing(landMe, 1) === 'chew' ? 1 : 0,
      armR: eating || gotMe ? s1kf(r, [[landMe, 52], [landMe + .5, 100]]) : s1kf(r, [[tossMe, 0], [landMe - .1, 52]]), hold: gotMe ? (r >= landMe + .5 ? 'bite' : 'bun') : null,
      armL: umb, holdL: rainy ? 'umbM' : null }, f);
    // Bo: right. Asks, listens to Me (eyes toward him), takes the bun, chews (half a beat behind Me).
    st.bo.pose({ x: STALL.bo, y: STALL.ground, s: STALL.s, mouth: speakBo ? bo : gotBo ? chewing(landBo, 3) : 'flat', lids: lidsDead, shut: blinking(r, [1.7, 3.1, 5.6]),
      eyeX: s1kf(r, [[2.55, 0], [2.65, -.7], [3.4, -.7], [3.5, 0]]), headR: speakBo ? 2 : 0, bob: gotBo && chewing(landBo, 3) === 'chew' ? 1 : 0,
      armR: eating || gotBo ? s1kf(r, [[landBo, 52], [landBo + .5, 100]]) : s1kf(r, [[tossBo, 0], [landBo - .1, 52]]), hold: gotBo ? (r >= landBo + .5 ? 'bite' : 'bun') : null,
      armL: umb, holdL: rainy ? 'umbB' : null }, f);

    // scarves in snow, riding the necks
    vis(scarfMe, snowy); vis(scarfBo, snowy);
    if (snowy) { tf(scarfMe, `translate(${STALL.me},${STALL.ground}) scale(${STALL.s})`); tf(scarfBo, `translate(${STALL.bo},${STALL.ground}) scale(${STALL.s})`); }
  });
}
