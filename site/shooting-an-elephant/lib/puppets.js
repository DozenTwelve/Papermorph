/* puppets.js — this film's cut-out puppets, drawn in SVG (no pictures): Burmese townspeople, the officer, the elephant.
   One black card per figure with a thin cream rim round its whole outline, in the manner of Lotte Reiniger: the parts
   are plain black shapes, and the rim (and the slightly uneven, boiling edge) comes from a filter on an unscaled wrapper,
   so joints never show and the rim is the same width at any size.
   Each builder draws its figure in its own units (feet on y = 0; people face right, the elephant faces left) and returns
   { g, pose(t) }: pose sets the joints for a time t (seconds), a pure function of the clock like everything in the engine.
   PUP.mount(parent, figure, x, y, k, flip) places it; PUP.defs(svg) adds the filters once (pupRim0..2, for boiling). */
'use strict';
const PUP = (() => {
  const NS = 'http://www.w3.org/2000/svg', CARD = '#07100b', RIM = '#f3ede0';
  const el = (tag, a, parent) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; };
  function defs(svg) {
    if (svg.querySelector('#pupRim0')) return;
    const d = el('defs', {}, svg);
    [4, 11, 23].forEach((seed, i) => {
      const f = el('filter', { id: `pupRim${i}`, x: '-10%', y: '-10%', width: '120%', height: '120%' }, d);
      // every part is the same black: make the alpha solid first, so the joints' anti-aliased seams vanish
      const ct = el('feComponentTransfer', { in: 'SourceAlpha', result: 'a' }, f);
      el('feFuncA', { type: 'discrete', tableValues: '0 1 1 1 1' }, ct);
      el('feFlood', { 'flood-color': CARD, result: 'ink' }, f);
      el('feComposite', { in: 'ink', in2: 'a', operator: 'in', result: 'solid' }, f);
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: .03, numOctaves: 3, seed, result: 'n' }, f);
      el('feDisplacementMap', { in: 'solid', in2: 'n', scale: 4, result: 'cut' }, f);
      el('feMorphology', { in: 'cut', operator: 'dilate', radius: 2.4, result: 'fat' }, f);
      el('feFlood', { 'flood-color': RIM, result: 'c' }, f);
      el('feComposite', { in: 'c', in2: 'fat', operator: 'in', result: 'rim' }, f);
      const m = el('feMerge', {}, f); el('feMergeNode', { in: 'rim' }, m); el('feMergeNode', { in: 'cut' }, m);
    });
  }
  // place a figure: an outer group carries the filter (unscaled, so the rim keeps its width), the figure's own g the scale
  // (filter: false puts it straight into parent, for a crowd whose shared group carries one filter: cheaper)
  function mount(parent, fig, x, y, k, flip = false, filter = true) {
    const w = filter ? el('g', { filter: 'url(#pupRim0)' }, parent) : parent;
    w.appendChild(fig.g);
    fig.g.setAttribute('transform', `translate(${x},${y}) scale(${flip ? -k : k},${k})`);
    fig.wrap = w;
    return fig;
  }
  const boilAt = (target, t) => (target.wrap || target).setAttribute('filter', `url(#pupRim${Math.floor(t * 12) % 3})`);
  // a part: a group turning about its pivot (px, py), holding plain black shapes
  function part(parent, d, px = 0, py = 0) {
    const g = el('g', {}, parent);
    el('path', { d, fill: CARD }, g);
    g.set = (a = 0, dx = 0, dy = 0) => g.setAttribute('transform', `translate(${dx.toFixed(1)},${dy.toFixed(1)}) rotate(${a.toFixed(2)} ${px} ${py})`);
    return g;
  }
  const wave = (t, f, ph = 0) => Math.sin((t * f + ph) * 2 * Math.PI);

  /* ---------- a Burmese townsman or townswoman, in profile, about 1000 units tall ----------
     kind: 'man' (short hair), 'bun' (a man's hair knot), 'turban' (gaung baung), 'monk' (shaved head, robe),
     'woman' (hair in a bun), 'boy' (smaller, shorts). act: 'walk' | 'stand' | 'laugh' | 'point' | 'cheer'.
     prop: what he or she carries, which is most of what makes a silhouette: 'parasol', 'basket' (on the head),
     'pole' (a carrying pole with two baskets), 'bowl' (a monk's alms bowl), 'staff', 'child' (on the shoulders).
     The head and the arms hang from the body, so a lean carries them; the body turns about the hips. */
  function person(parent, { kind = 'man', act = 'walk', prop = '', speed = 1, phase = 0 } = {}) {
    const g = el('g', {}, parent), monk = kind === 'monk', boy = kind === 'boy';
    const foot = dx => `L${-6 + dx} -64L${-4 + dx} -16L${30 + dx} -7C${37 + dx} -5 ${37 + dx} 0 ${30 + dx} 0L${-32 + dx} 0C${-36 + dx} -12 ${-34 + dx} -42 ${-30 + dx} -64`;
    const top = boy ? -330 : -300;
    const legB = part(g, `M-24 ${top}L0 ${top}L-2 -64` + foot(0) + 'Z', -10, top);
    const legF = part(g, `M-2 ${top}L22 ${top}L22 -64` + foot(24) + 'Z', 10, top);
    // the body (a jacket with sloping shoulders over a longyi flaring a little to the hem, its knot at the front of the
    // waist; a monk's robe; the boy's shirt and shorts), turning about the hips
    const body = monk
      ? 'M-34 -846C-10 -854 22 -852 38 -840C56 -760 64 -620 66 -470C68 -330 70 -180 74 -44H-70C-66 -180-64 -330-62 -470C-60 -640-56 -780-34 -846Z'
      : boy
        ? 'M-30 -846C-10 -852 20 -850 34 -838C46 -790 50 -700 52 -620C54 -580 54 -545 52 -510L56 -340H-52L-54 -510C-58 -560-58 -650-52 -730C-48 -790-42 -832-30 -846Z'
        : 'M-30 -846C-10 -852 20 -850 34 -838C46 -800 52 -720 54 -640C56 -590 58 -540 56 -512C58 -470 54 -400 58 -300C62 -200 66 -110 70 -42H-66C-64 -110-62 -200-60 -300C-58 -400-60 -470-58 -512C-60 -560-60 -650-54 -720C-50 -780-44 -830-30 -846ZM50 -520C66 -524 76 -510 72 -494C68 -480 52 -480 48 -492Z';
    const torso = part(g, body, 0, top);
    // arms hang from the shoulder: thin, tapering to the wrist, a hand; the far one behind the body
    const arm = dx => `M${-15 + dx} -828C${-23 + dx} -760 ${-25 + dx} -680 ${-21 + dx} -600C${-19 + dx} -560 ${-15 + dx} -520 ${-13 + dx} -482C${-15 + dx} -462 ${-7 + dx} -444 ${5 + dx} -446C${17 + dx} -448 ${19 + dx} -466 ${13 + dx} -482C${15 + dx} -560 ${17 + dx} -680 ${19 + dx} -800Z`;
    const armB = part(torso, arm(0), 2, -828); torso.insertBefore(armB, torso.firstChild);
    // the head, small, in profile: crown, brow, nose, lips, chin; hair, a knot, a cloth, or nothing
    const head = part(torso, 'M-45 -965C-40 -995 -5 -1004 20 -998C45 -992 58 -970 58 -945L70 -925L60 -920C64 -910 62 -905 56 -902C58 -895 54 -888 48 -884C40 -874 25 -870 12 -872L10 -840H-22L-24 -870C-44 -880 -55 -910 -55 -935C-55 -950 -52 -960 -45 -965Z', 0, -845);
    const ink = (d, host) => el('path', { d, fill: CARD }, host);
    if (kind === 'bun' || kind === 'woman') ink('M-50 -972C-72 -976 -80 -952 -68 -938C-56 -926 -40 -932 -38 -950Z', head);
    if (kind === 'turban') ink('M-58 -948C-58 -992 -18 -1018 22 -1004C44 -996 58 -980 58 -960C30 -972 -12 -970 -58 -948ZM20 -1002C36 -1024 64 -1024 72 -1002C58 -1000 46 -994 38 -986Z', head);
    if (kind === 'man') ink('M-55 -935C-58 -978 -30 -1004 8 -1002C32 -1000 50 -988 56 -968C30 -978 -10 -976 -36 -952Z', head);
    const armF = part(torso, arm(22), 24, -828);
    // the props
    let sway = null, child = null;
    if (prop === 'parasol') {   // a paper parasol over the shoulder, its ribs showing as notches in the rim
      ink('M30 -560L44 -560L46 -1190L32 -1190Z', torso);
      ink('M-150 -1110C-90 -1230 160 -1250 230 -1120C200 -1128 180 -1110 160 -1124C130 -1112 110 -1124 90 -1112C60 -1124 40 -1110 20 -1122C-10 -1110 -30 -1124 -60 -1112C-90 -1122 -110 -1108 -150 -1110Z', torso);
      ink('M30 -1240C30 -1262 46 -1262 46 -1240L44 -1190H32Z', torso);
    }
    if (prop === 'basket') ink('M-74 -1000C-74 -1012 74 -1012 74 -1000L60 -1100C60 -1112 -60 -1112 -60 -1100Z', head);
    if (prop === 'pole') {   // a bamboo pole on the shoulder, a basket hanging from each end, swinging
      ink('M-300 -850C-100 -864 100 -864 300 -850L300 -836C100 -850 -100 -850 -300 -836Z', torso);
      sway = [-1, 1].map(sx => {
        const b = el('g', {}, torso), x = sx * 290;
        ink(`M${x - 3} -846L${x + 3} -846L${x + 40} -650L${x + 34} -648L${x} -820L${x - 34} -648L${x - 40} -650Z`, b);
        ink(`M${x - 70} -650H${x + 70}L${x + 56} -560C${x + 40} -540 ${x - 40} -540 ${x - 56} -560Z`, b);
        b.px = x; return b;
      });
    }
    if (prop === 'bowl') ink('M40 -590C40 -520 150 -520 150 -590Z', torso);
    if (prop === 'staff') ink('M30 -470L42 -470L74 0L62 0Z', armF);
    if (prop === 'child') {   // a small child astride the shoulders, arms up
      child = person(torso, { kind: 'boy', act: 'cheer', phase: phase + .3 });
      child.g.setAttribute('transform', 'translate(-6,-700) scale(.42)');
    }
    if (boy) g.setAttribute('transform', 'scale(.72)');
    const fixed = { parasol: [-62, 0], bowl: [-58, -40], staff: [8, 0], basket: [-168, 0], pole: [-150, 10] }[prop];
    function pose(t) {
      const tt = t * speed + phase;
      let s, bob;
      if (act === 'walk') {
        s = wave(tt, 1.6); bob = -9 * Math.abs(wave(tt, 1.6, .25));
        legF.set(15 * s, 0, bob); legB.set(-15 * s, 0, bob); torso.set(1.5, 0, bob);
        armF.set(-16 * s); armB.set(16 * s); head.set(2 * s);
      } else if (act === 'laugh') {   // bent forward, shaking, the head thrown back on the beat
        s = wave(tt, 3.2);
        torso.set(8 + 4 * s); head.set(-20 + 14 * s); armF.set(-26 + 12 * s); armB.set(30 - 8 * s); legF.set(0); legB.set(0);
      } else if (act === 'point') {
        s = wave(tt, 2.4);
        torso.set(-3); armF.set(-96 + 6 * s); head.set(-6 + 4 * s); armB.set(12); legF.set(0); legB.set(0);
      } else if (act === 'cheer') {   // both arms up, bouncing
        s = wave(tt, 2.6); bob = -14 * Math.abs(s);
        torso.set(0, 0, bob); armF.set(-150 + 12 * s); armB.set(-110 - 14 * s); head.set(-8); legF.set(0, 0, bob); legB.set(0, 0, bob);
      } else { torso.set(1); head.set(0); armF.set(0); armB.set(0); legF.set(0); legB.set(0); }
      if (fixed) { armF.set(fixed[0]); if (fixed[1]) armB.set(fixed[1]); }
      if (sway) sway.forEach((b, k) => b.setAttribute('transform', `rotate(${(6 * Math.sin(tt * 6 + k)).toFixed(2)} ${b.px} -846)`));
      if (child) child.pose(t);
    }
    pose(0);
    return { g, pose };
  }

  /* ---------- the officer: very tall and thin, pith helmet, shirt and shorts, long socks, the rifle; about 1150 tall,
     facing right. act: 'walk' | 'stand'; lower(t), 0..1, brings the rifle down from the shoulder (0) to hang muzzle-down in his hand (1). */
  function officer(parent, { act = 'walk', speed = 1, phase = 0, lower = () => 0 } = {}) {
    const g = el('g', {}, parent);
    const legB = part(g, 'M-20 -470C-22 -300-18 -150-16 -60L-20 -22C-20 -8-12 0 0 0H58C66 0 64-14 52-18L18-30C22 -150 24 -300 20 -470Z', 0, -470);
    const armB = part(g, 'M-2 -920C-16 -840-22 -740-18 -650C-16 -626 0 -620 10 -634C16 -730 20 -830 24 -904Z', 8, -910);
    const torso = part(g, 'M-38 -948C-6 -964 28 -962 46 -946L54 -660C56 -620 50 -580 46 -560L52 -450H-46L-42 -560C-50 -600-54 -650-52 -700Z', 0, 0);
    const legF = part(g, 'M-4 -470C-6 -300-2 -150 0 -60L-4 -22C-4 -8 6 0 18 0H80C88 0 86-14 74-18L38-30C42 -150 44 -300 40 -470Z', 18, -470);
    const head = part(g, 'M-26 -1092C14 -1100 46 -1074 48 -1030L62 -1004C64 -998 58 -994 52 -994C54 -986 52 -980 46 -978C48 -968 44 -958 34 -954C24 -942 8 -938 -6 -940L-6 -950H-30C-52 -968 -58 -1010 -52 -1046C-48 -1070 -40 -1086 -26 -1092Z', 0, -950);
    el('path', { d: 'M-86 -1066C-80 -1078 -54 -1088 -36 -1092C-42 -1156 -6 -1192 32 -1184C72 -1174 88 -1130 80 -1090C98 -1086 112 -1078 116 -1066C72 -1072 -46 -1074 -86 -1066Z', fill: CARD }, head);
    // the front arm and the rifle, which turn together about the shoulder
    const armF = el('g', {}, g);
    el('path', { d: 'M10 -920C-2 -850-2 -780 12 -720C20 -700 38 -702 44 -720C38 -780 38 -850 42 -910Z', fill: CARD }, armF);
    const rifle = el('g', {}, armF);   // turns about the hand (30, -712)
    el('path', { d: 'M-26 -1300L-14 -1304L46 -780L60 -712C66 -682 58 -654 42 -650L20 -646L26 -722L32 -782Z', fill: CARD }, rifle);
    function pose(t) {
      const tt = t * speed + phase, l = Math.max(0, Math.min(1, lower(t)));
      if (act === 'walk') {
        const s = wave(tt, 1.3), bob = -11 * Math.abs(wave(tt, 1.3, .25));
        legF.set(16 * s, 0, bob); legB.set(-16 * s, 0, bob); armB.set(18 * s, 0, bob); torso.set(0, 0, bob); head.set(0, 0, bob);
        armF.setAttribute('transform', `translate(0,${bob.toFixed(1)}) rotate(${(-4 * s - 18 * l).toFixed(2)} 26 -910)`);
        rifle.setAttribute('transform', `rotate(${(150 * l).toFixed(2)} 30 -712)`);
      } else {
        legF.set(0); legB.set(0); armB.set(0); torso.set(0); head.set(5 * l);
        armF.setAttribute('transform', `rotate(${(-18 * l).toFixed(2)} 26 -910)`);
        rifle.setAttribute('transform', `rotate(${(150 * l).toFixed(2)} 30 -712)`);
      }
    }
    pose(0);
    return { g, pose };
  }

  /* ---------- the elephant, facing left; 1050 tall at the back, feet on y = 0 (proportions measured from a reference
     silhouette: the back highest just behind the middle, the domed head high at the front, legs four tenths of the height)
     act: 'stand' | 'graze' | 'walk'. Grazing runs a 4.5 s cycle from its own t = 0: the trunk reaches down and tears up
     grass (0–1.4 s), swings it up and beats it against the near foreleg's knee twice (1.4–3.0 s), curls it into the mouth
     (3.0–4.5 s); beats(t) gives the times of the two blows in the current cycle, for a sound. */
  function elephant(parent, { act = 'graze', phase = 0 } = {}) {
    const g = el('g', {}, parent);
    // a leg: a column thick at the top, a knee, a little taper, a broad flat foot
    // a leg: broad at the top, a slight knee, narrow at the ankle, a broad flat foot (measured from the reference)
    const leg = (x, top, w, hock = 0) => {
      const k = top * .5, a = -110, wk = w * .86, wa = w * .64, wf = w * 1.06;
      return `M${x - w / 2} ${top}C${x - w / 2 - 6} ${top * .78} ${x - wk / 2 - 8 + hock} ${k - 40} ${x - wk / 2 + hock} ${k}C${x - wk / 2 + 6 + hock} ${k * .6} ${x - wa / 2 + hock} ${a - 30} ${x - wa / 2 + hock} ${a}C${x - wa / 2 - 6 + hock} -56 ${x - wf / 2 - 2 + hock} -30 ${x - wf / 2 - 6 + hock} -14C${x - wf / 2 - 8 + hock} -4 ${x - wf / 2 + 4 + hock} 0 ${x - wf / 2 + 16 + hock} 0H${x + wf / 2 + hock}C${x + wf / 2 + 12 + hock} 0 ${x + wf / 2 + 12 + hock} -12 ${x + wf / 2 + 6 + hock} -26C${x + wa / 2 + 8 + hock} -50 ${x + wa / 2 + hock} -80 ${x + wa / 2 + hock} ${a}C${x + wa / 2 + 2 + hock} ${a - 60} ${x + wk / 2 + hock} ${k * .6} ${x + wk / 2 + 4 + hock} ${k}C${x + wk / 2 + 10} ${k - 40} ${x + w / 2 + 6} ${top * .78} ${x + w / 2} ${top}Z`;
    };
    const farFore = part(g, leg(-110, -470, 150), -110, -470), farHind = part(g, leg(300, -480, 170, 20), 300, -480);
    const tail = part(g, 'M636 -700C664 -600 690 -470 694 -330C696 -300 690 -290 684 -300C676 -420 650 -560 616 -680ZM680 -330C664 -290 668 -230 690 -208C712 -224 718 -284 700 -334Z', 630, -700);
    // the body: the back rising from the neck to its height behind the middle, round over the rump, the belly hanging low
    const body = part(g, 'M-430 -1012C-300 -1010 -220 -1030 -120 -1042C0 -1056 120 -1052 240 -1028C380 -1000 500 -948 586 -858C634 -806 652 -730 652 -650C652 -580 630 -520 590 -480C520 -440 440 -426 340 -420C240 -414 140 -414 40 -432C-60 -450 -160 -470 -260 -484C-360 -500 -430 -540 -470 -620C-500 -700 -500 -880 -430 -1012Z', 0, 0);
    const nearHind = part(g, leg(500, -560, 200, 26), 500, -560);
    const nearFore = part(g, leg(-230, -520, 170), -230, -520);
    // the head: the double dome high at the front, the brow, the trunk's root, the jaw; the small eye
    const head = part(g, 'M-420 -960C-450 -1016 -510 -1046 -572 -1036C-640 -1024 -692 -966 -712 -884C-726 -820 -730 -730 -720 -664C-712 -612 -684 -580 -642 -572C-592 -562 -540 -580 -500 -620C-466 -654 -436 -704 -426 -770Z', -560, -760);
    // the ear: a broad, ragged fan over the side of the neck (Asian: smaller than an African's)
    const ear = part(head, 'M-560 -930C-500 -956 -430 -940 -406 -870C-392 -820 -404 -760 -440 -712C-458 -688 -470 -704 -484 -690C-506 -700 -520 -686 -540 -700C-560 -760 -574 -840 -560 -930Z', -560, -920);
    // the trunk: seven segments hanging from the root, each a tapering card turning about its upper end; widths overlap
    // so the joints vanish under the rim filter
    const segs = [], L = [110, 104, 98, 92, 84, 76, 70], W = [118, 100, 86, 74, 62, 52, 44];
    let host = head;
    for (let i = 0; i < L.length; i++) {
      const w0 = W[i] / 2, w1 = (W[i + 1] || 36) / 2, l = L[i];
      const s = el('g', {}, host);
      el('path', { d: `M${-w0} ${-w0 * .6}C${-w0} ${l * .5} ${-w1} ${l * .8} ${-w1} ${l + 10}H${w1}C${w1} ${l * .8} ${w0} ${l * .5} ${w0} ${-w0 * .6}Z`, fill: CARD }, s);
      el('circle', { cx: 0, cy: l, r: w1 + 1, fill: CARD }, s);
      segs.push(s); host = s;
    }
    el('path', { d: `M-18 ${L[6]}C-26 ${L[6] + 26} -14 ${L[6] + 46} 0 ${L[6] + 46}C14 ${L[6] + 46} 26 ${L[6] + 26} 18 ${L[6]}Z`, fill: CARD }, segs[6]);
    const grass = el('g', { opacity: 0 }, segs[6]);   // a tuft of grass the trunk carries
    for (let i = 0; i < 11; i++) el('path', { d: `M0 ${L[6] + 34}q${-60 + i * 11} ${40 + (i % 3) * 18} ${-80 + i * 16} ${120 + (i % 4) * 18}`, stroke: CARD, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, grass);
    const ROOT = [-694, -652];   // inside the head's outline, so the trunk's first joint never shows
    const curl = A => segs.forEach((s, i) => s.setAttribute('transform', `${i ? `translate(0,${L[i - 1]})` : `translate(${ROOT[0]},${ROOT[1]})`} rotate(${A[i].toFixed(2)})`));
    const ease = q => q * q * (3 - 2 * q), mix = (a, b, q) => a.map((v, i) => v + (b[i] - v) * q);
    const DOWN = [6, 4, 3, 2, 2, 4, 8], REACH = [16, 10, 6, 4, 2, -2, -8], LIFT = [-30, -26, -22, -18, -14, -10, -8], KNEE = [-6, 22, 34, 34, 30, 22, 16], MOUTH = [22, 38, 50, 56, 54, 46, 40];
    const keys = [[0, DOWN], [1.0, REACH], [1.4, DOWN], [1.8, LIFT], [2.1, KNEE], [2.4, LIFT], [2.7, KNEE], [3.4, MOUTH], [4.2, DOWN], [4.5, DOWN]];
    const trunkAt = c => { for (let i = 1; i < keys.length; i++) if (c <= keys[i][0]) { const [a, A] = keys[i - 1], [b, B] = keys[i]; return mix(A, B, ease((c - a) / (b - a))); } return DOWN; };
    function pose(t) {
      const tt = t + phase;
      if (act === 'graze') {
        const c = ((tt % 4.5) + 4.5) % 4.5;
        curl(trunkAt(c));
        grass.setAttribute('opacity', c > .95 && c < 3.6 ? 1 : 0);
        head.set(c > 3 && c < 4 ? 4 * Math.sin(Math.PI * (c - 3)) : 1.5 * wave(tt, .3));
        ear.set(5 * wave(tt, .45)); tail.set(6 * wave(tt, .4));
        nearFore.set(c > 2 && c < 2.9 ? 2 : 0); body.set(0); nearHind.set(0); farFore.set(0); farHind.set(0);
      } else if (act === 'walk') {
        const s = wave(tt, 1.1);
        nearFore.set(9 * s); farHind.set(9 * s); nearHind.set(-9 * s); farFore.set(-9 * s);
        curl(mix(DOWN, REACH, .4 + .3 * s)); head.set(2 * s); ear.set(6 * s); tail.set(8 * s); body.set(0, 0, -6 * Math.abs(s));
      } else { curl(DOWN); head.set(0); ear.set(4 * wave(tt, .5)); tail.set(5 * wave(tt, .4)); }
    }
    const beats = t => { const c = (((t + phase) % 4.5) + 4.5) % 4.5; return [2.1, 2.7].map(b => t - c + b); };
    pose(0);
    return { g, pose, beats };
  }
  function hut(parent, { door = true } = {}) {
    const g = el('g', {}, parent), ink = d => el('path', { d, fill: CARD }, g);
    for (const x of [-330, -110, 110, 330]) ink(`M${x - 14} 0L${x - 10} -260H${x + 10}L${x + 14} 0Z`);   // stilts
    ink('M-380 -250H380V-284H-380Z');                                                                       // the platform
    ink('M-140 -250L-40 -250L-120 -40L-150 -40ZM-150 -40H-100V-26H-150Z');                                 // a ladder
    el('path', { d: 'M-340 -284V-560H340V-284Z' + (door ? 'M40 -290V-480H150V-290Z' : ''), fill: CARD, 'fill-rule': 'evenodd' }, g);   // the walls, a doorway cut in them
    let fringe = 'M-440 -520';
    for (let x = -440; x <= 440; x += 40) fringe += `L${x + 20} ${-505 + (x / 40 % 2 ? 6 : -4)}L${x + 40} -520`;
    ink(`${fringe}L60 -900C40 -910 20 -910 0 -904L-440 -520Z`);                                            // the roof, its eave ragged
    return { g, pose: () => {} };
  }
  return { person, officer, elephant, hut, mount, defs, boilAt, el };
})();
