/* scene4.js — Lying flat. They walk in along road2 (cow first, rod on), the cow slows as it works it out, stops, looks at
   the hay, at us, sighs and lies down (thud: the march music stops); everybody stares; the Chinese man twitches, turns,
   storms over to the American and jabs a finger at him (camera shake); snap zoom to the American's "Me?"; title card. */
'use strict';
const PRE4 = 0.5;
const s4v = (clip, t = 0) => clipAt('scene4', PRE4, clip, t);

/* ---------- timeline (beat time, s) ---------- */
const S4 = {
  slow0: 6.3, stop: 10.5,                          // the cow slows during "However far it walked…" and stands
  cowCU: 10.35, hay: 10.5, us: 11.9, blink: 12.6, sigh: 13.9, lie0: 14.65, lie1: 15.45,   // 4.2
  wide: 15.95,                                     // 4.3 (s13 starts at s4v('s13'))
  // the office cutaway runs through s13b ("Lying flat means…", 21.2 to 31.0); everything after it sits 11.738 s later than before
  cut0: 21.0, cutS2: 24.6, cutS3: 28.75, cut1: 31.0,                 // 4.3b shots 1, 2, 3 of the cutaway, then back to the wide
  slowJ: 26.2, stopJ: 27.4, clock0: 24.8, clock1: 26.9, night0: 25.0, night1: 26.6, sign: 27.55, us2: 28.2, sink0: 28.75, fall0: 29.15, land: 30.35, chest: 29.9,
  cnCU: 32.638, turn: 34.538, two: 35.138, storm0: 35.188, storm1: 36.338, // 4.4, 4.5
  hands: 41.638, snap: 42.088, titleAt: 45.338,    // 4.6, 4.7
};
S4.shake = s4v('s14', 1.107 + 3.5);                // on 境外
window.S4_STOP = S4.lie1;
for (let t = .2; t < S4.stop - 1; t += 2) sfx('scene4', t, 'clop', t < 6 ? .8 : .5);
sfx('scene4', S4.lie1, 'thud');
sfx('scene4', S4.land, 'thud', .4);   // the office worker lies down
sfx('scene4', S4.cnCU + .1, 'crickets');
sfx('scene4', S4.snap, 'whoosh');
sfx('scene4', S4.titleAt, 'sting');

/* ---------- the march: cow x(q) (X0 → 1000), 130 px/s then slowing to a stop ---------- */
const S4_V = 150, S4_SLOW = S4.stop - S4.slow0, S4_X0 = 1000 - S4_V * S4.slow0 - S4_V * S4_SLOW / 2;
function s4cowX(q) {
  if (q <= S4.slow0) return S4_X0 + S4_V * q;
  const u = Math.min(1, (q - S4.slow0) / S4_SLOW);
  return S4_X0 + S4_V * S4.slow0 + S4_V * S4_SLOW * (u / 2 + Math.sin(Math.PI * u) / (2 * Math.PI));
}
const s4moving = q => q < S4.stop;
// gait follows ground speed: one step flip per 130/6 px of travel (the old fixed rate), stride amplitude ∝ speed
const s4r = q => q <= S4.slow0 ? 1 : (1 + Math.cos(Math.PI * Math.min(1, (q - S4.slow0) / S4_SLOW))) / 2;
const s4gait = q => (s4cowX(q) - S4_X0) / (S4_V / 6);
function s4walk(q) { return s3walk(s4cowX(q), Math.min(1, 4 * s4r(q))); }   // the same walk as scene 3, by ground covered; the swing shortens only in the last step or two
// Piecewise eased keyframes [[t, v], …].
const s4k = (q, pts) => {
  if (q <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (q < pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * ease((q - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return pts[pts.length - 1][1];
};
const s4flick = (q, k, amp = .12) => amp * jit(Math.floor(q * 2.5), k);   // tiny eye moves

/* ---------- the cutaway: "lying flat" at the office (during s13b) ----------
   Three hard cuts on one paper-cutout office (flat wall, a desk with a monitor, a wall clock, a window; the same torn-paper
   pieces as the puppets, baked): 1 a young office worker jogs after a PROMOTION sign dangling from a rod held by a hand from the
   frame edge (the cow and the hay); 2 the clock spins to late night, the window goes dark, he slows, stops, looks at the sign,
   then at us; 3 he lies down on his back, hands on his chest, the sign still dangling above him. */
SHAPES.worker = { ...SHAPES.meAdult,
  extra: '<path d="M-8,-250 L8,-250 L13,-150 L0,-122 L-13,-150 Z" fill="#a8272b"/><path d="M-8,-250 L8,-250 L5,-238 L-5,-238 Z" fill="#7a1a1d"/><rect x="-124" y="-110" width="248" height="14" fill="#2a2a2e"/>' };
const workerPuppet = (p, o) => spKid(p, 'worker', { coat: '#f4f1ea', stripe: '#c9c3b4', pants: '#2a2d3a', ...o });
const S4J = { v: 284, stride: 71, a: 22, X: 640, s: FARM.s };   // ground speed (px/s) and the distance one leg flip covers at a 22 degree swing and s .9
const S4VIEW = [{ x: 800, y: 450, z: 1 }, { x: 760, y: 500, z: 1.7 }, { x: 660, y: 540, z: 1.25 }];   // wide, a push-in on him and the sign, a low frame on the floor
const S4TIP = [1040, 215];
// distance run since the cut: full speed, then slowing to a stop (the same ease as the cow's)
function s4jogDist(q) {
  const T = S4.stopJ - S4.slowJ;
  if (q <= S4.slowJ) return S4J.v * (q - S4.cut0);
  const u = Math.min(1, (q - S4.slowJ) / T);
  return S4J.v * (S4.slowJ - S4.cut0) + S4J.v * T * (u / 2 + Math.sin(Math.PI * u) / (2 * Math.PI));
}
function s4office(p) {
  const root = mk('g', {}, p), view = mk('g', {}, root), set = mk('g', {}, view);
  // the window sits low enough that the rod passes above it
  const wy = y => 220 + (y - 120) * .744;
  const buildings = [[1140, 330, 60], [1196, 270, 80], [1272, 360, 50], [1318, 300, 70], [1384, 240, 66]].map(([x, y, w], i) => `<rect x="${x}" y="${wy(y).toFixed(0)}" width="${w}" height="${510 - wy(y)}" fill="${i % 2 ? '#74899f' : '#8aa0b8'}"/>`).join('');
  let lit = ''; for (let i = 0; i < 40; i++) { const x = 1150 + (i % 10) * 29 + (i % 3) * 3, y = wy(290 + Math.floor(i / 10) * 52 + (i % 4) * 6); if (jit(i, 5) > -.2) lit += `<rect x="${x}" y="${y.toFixed(0)}" width="9" height="12" fill="#f6d365"/>`; }
  let seams = ''; for (let i = -1; i < 11; i++) seams += `<path d="M${i * 160},748 L${i * 160 - 24},900" stroke="#6b5b4e" stroke-width="4"/>`;
  let ticks = ''; for (let i = 0; i < 12; i++) ticks += `<rect x="-3" y="-76" width="6" height="${i % 3 ? 10 : 18}" fill="#3a2e26" transform="rotate(${i * 30})"/>`;
  // one 1600-wide stretch of office; two of them side by side scroll past as he runs and the second ends exactly where the first began
  const room = `<rect width="1600" height="740" fill="#dcd0b6"/><rect y="560" width="1600" height="180" fill="#d0c3a6"/><rect y="556" width="1600" height="6" fill="#bfae8c"/>
    <rect y="740" width="1600" height="160" fill="#7f6e60"/><g>${seams}</g>
    <g filter="url(#paper)"><rect x="0" y="722" width="1600" height="26" fill="#f1ead9"/></g>
    <rect x="1140" y="220" width="310" height="290" fill="#a9d2ee"/>${buildings}<rect class="night" x="1140" y="220" width="310" height="290" fill="#0f1936" opacity="0"/><g class="lit" opacity="0">${lit}</g>
    <g filter="url(#paper)"><path fill-rule="evenodd" d="M1118,198 H1472 V532 H1118 Z M1140,220 V510 H1450 V220 Z" fill="#f4eee0"/><rect x="1290" y="220" width="10" height="290" fill="#f4eee0"/><rect x="1140" y="360" width="310" height="10" fill="#f4eee0"/><rect x="1104" y="520" width="382" height="22" fill="#e6dcc6"/></g>
    <g filter="url(#paper)"><circle cx="800" cy="190" r="94" fill="#4a3a2c"/><circle cx="800" cy="190" r="82" fill="#faf6ea"/></g>
    <g transform="translate(800,190)">${ticks}<g class="hH"><path d="M0,8 L0,-46" stroke="#2a2220" stroke-width="8" stroke-linecap="round"/></g><g class="mH"><path d="M0,10 L0,-68" stroke="#2a2220" stroke-width="5" stroke-linecap="round"/></g><circle r="7" fill="#a8272b"/></g>
    <g filter="url(#paper)"><rect x="20" y="560" width="500" height="26" rx="4" fill="#b98350"/><rect x="40" y="586" width="30" height="204" fill="#9a6a40"/><rect x="470" y="586" width="30" height="204" fill="#9a6a40"/><rect x="70" y="586" width="400" height="140" fill="#8c5f38"/></g>
    <g filter="url(#paper)"><rect x="168" y="372" width="224" height="150" rx="10" fill="#2b2f38"/><rect x="182" y="386" width="196" height="116" fill="#b8e0ee"/><rect x="262" y="522" width="36" height="30" fill="#2b2f38"/><rect x="226" y="548" width="108" height="12" rx="4" fill="#2b2f38"/>
      <rect x="196" y="456" width="22" height="36" fill="#5b8fd0"/><rect x="228" y="430" width="22" height="62" fill="#e0a43a"/><rect x="260" y="466" width="22" height="26" fill="#5b8fd0"/><rect x="292" y="410" width="22" height="82" fill="#c8322f"/><rect x="324" y="444" width="22" height="48" fill="#e0a43a"/></g>
    <g filter="url(#paper)"><rect x="410" y="516" width="40" height="44" rx="5" fill="#f6f1e4"/><rect x="456" y="528" width="40" height="32" fill="#fbfbf6"/><rect x="460" y="518" width="36" height="12" fill="#f3eee0"/></g>`;
  const scroll = mk('g', {}, set); scroll.innerHTML = `<g>${room}</g><g transform="translate(1600,0)">${room}</g>`;
  const still = mk('g', {}, set); still.innerHTML = '<ellipse class="shadow" rx="100" ry="18" fill="url(#spShadow)"/>';
  bakeAll(set);
  const all = c => [...set.querySelectorAll(c)], shadow = set.querySelector('.shadow');
  const nights = all('.night'), litG = all('.lit'), hHs = all('.hH'), mHs = all('.mH');
  const setAll = (els, a, v) => els.forEach(e => e.setAttribute(a, v));
  const wrap = mk('g', {}, view), man = workerPuppet(wrap);
  // the rod (drawn level, pointing left from the hand, stretched to length), the arm from the frame edge, the sign on its line
  const rod = prop(mk('g', {}, view), '<g filter="url(#paper)"><path d="M0,-5 L-1000,-2 L-1000,2 L0,5 Z" fill="#3a2a1a"/></g>'), rodG = rod.parentNode;
  const arm = prop(mk('g', {}, view), '<g filter="url(#paper)"><rect x="20" y="-26" width="200" height="52" rx="8" fill="#2f3a52"/><rect x="20" y="-28" width="16" height="56" fill="#f2efe6"/><circle r="25" fill="#f2efe6"/><ellipse cx="-12" cy="-6" rx="9" ry="13" fill="#f2efe6"/></g>'), armG = arm.parentNode;
  const signG = mk('g', {}, view);
  signG.innerHTML = `<path d="M-110,168 L0,0 L110,168" stroke="#3a3430" stroke-width="3" fill="none"/><g transform="translate(0,300)">
    <g filter="url(#paper)"><rect x="-150" y="-132" width="300" height="90" rx="6" fill="#f6efe0" stroke="#c8322f" stroke-width="6"/></g><text y="-74" font-family="Avenir Next, Helvetica, sans-serif" font-size="40" font-weight="800" letter-spacing="2" text-anchor="middle" fill="#3a1a14">PROMOTION</text></g>`;
  bakeAll(signG);
  // the caption card, in screen space
  const cap = mk('g', {}, root);
  cap.innerHTML = `<g filter="url(#paper)"><path d="M36,34 L220,26 L420,36 L640,28 L650,70 L644,150 L420,158 L220,150 L40,158 L30,100 Z" fill="#f3ead6"/></g>
    <text x="64" y="118" font-family="PingFang SC, Heiti SC, sans-serif" font-size="72" font-weight="800" fill="#1d1a1a">躺平</text>
    <text x="230" y="84" font-family="Avenir Next, sans-serif" font-size="30" font-weight="700" fill="#8e2e28">tǎng píng</text><text x="230" y="130" font-family="Avenir Next, sans-serif" font-size="30" fill="#3a3430">· lying flat</text>`;
  bakeAll(cap);
  const jogTotal = s4jogDist(S4.stopJ);
  return { root, draw(q, f) {
    const sh = q < S4.cutS2 ? 0 : q < S4.cutS3 ? 1 : 2, V = S4VIEW[sh];
    tf(view, `translate(800,450) scale(${V.z}) translate(${-V.x},${-V.y})`);
    vis(cap, q >= S4.cut0 + .3 && sh < 2); tf(cap, `rotate(${(-1.5 + .4 * jit(f >> 1, 3)).toFixed(2)},300,90)`);
    // clock and window: the hands spin, then night falls
    const ck = span(q, S4.clock0, S4.clock1);
    setAll(hHs, 'transform', `rotate(${(270 + 80 * ck).toFixed(1)})`); setAll(mHs, 'transform', `rotate(${(1800 * ck + 240 * ck).toFixed(1)})`);
    const nt = span(q, S4.night0, S4.night1); setAll(nights, 'opacity', (.92 * nt).toFixed(2)); setAll(litG, 'opacity', nt.toFixed(2));
    // the run: legs flip once per S4J.stride px of ground covered; the whole office (wall, desk, window, floor) slides back at that speed,
    // scaled so the run ends one office-width along: the second copy of the room stops where the first began
    const dist = s4jogDist(q), k = Math.floor(dist / S4J.stride) % 2 ? 1 : -1, T = S4.stopJ - S4.slowJ;
    const r = q < S4.slowJ ? 1 : (1 + Math.cos(Math.PI * Math.min(1, (q - S4.slowJ) / T))) / 2, running = q < S4.stopJ, A = S4J.a * Math.min(1, 4 * r);
    tf(scroll, `translate(${(-1600 * Math.min(1, dist / jogTotal)).toFixed(1)},0)`);
    // the end: he sinks, sighs, then lies back slowly about his heels onto the floor, head toward the desk, hands folded on his chest
    const sk = span(q, S4.sink0, S4.sink0 + .5), u = span(q, S4.fall0, S4.land), ang = -90 * u, lie = q >= S4.land;
    const fold = span(q, S4.fall0 + .3, S4.land);
    const sway = q < S4.slowJ ? 1 : q < S4.stopJ ? .6 : .3;
    const toSign = between(q, S4.stopJ, S4.us2), toUs = q >= S4.us2 && q < S4.fall0;
    const breathe = lie ? .03 * Math.sin((q - S4.land) * 1.8) : 0, sigh = between(q, S4.us2 + .1, S4.sink0 + .3) ? .05 * Math.sin(Math.PI * span(q, S4.us2 + .1, S4.sink0 + .3)) : 0;
    const pose = { x: 0, y: 0, s: S4J.s, look: running || toSign ? .9 : 0, eyeX: running || toSign ? 1 : 0, eyeY: running || toSign ? -.55 : 0, shut: blinking(q, [22.7, 25.5, 27.9]) || q >= S4.fall0 + .55,
      lids: toUs ? .55 : 0, brow: running ? -.3 : toSign ? .6 : 0, headR: toUs ? 4 : 0, squash: sigh + breathe + .1 * sk * (1 - u),
      bob: running ? (k > 0 ? -9 : 0) * Math.min(1, 2 * r) : 26 * sk * (1 - u), legL: running ? A * k : 0, legR: running ? A * k : 0,
      armL: u > 0 ? -80 * fold : running ? (45 - 45 * k) * Math.min(1, 2 * r) : 0, armR: u > 0 ? -85 * fold : running ? (45 + 45 * k) * Math.min(1, 2 * r) : 0,
      mouth: u > .7 ? 'smile' : between(q, S4.us2 + .1, S4.sink0 + .3) ? 'O' : u > 0 || sk > 0 ? 'flat' : toUs ? 'X' : toSign ? 'flat' : running ? 'grin' : 'A' };
    man.pose(pose, f); vis(man.g.querySelector('[data-p="shadow"]'), false);
    const a = ang * Math.PI / 180, lean = running ? 6 * Math.min(1, r * 2) : 0;
    tf(wrap, `translate(${S4J.X},${(802 + 108 * Math.sin(a) + 45 * u).toFixed(1)}) rotate(${(lean + ang).toFixed(2)})`);
    tf(shadow, `translate(${(S4J.X + 20 - 230 * u).toFixed(1)},${(803 + 40 * u).toFixed(0)}) scale(${(1 + 1.8 * u).toFixed(2)},1)`);
    // rod, hand and sign: the tip is where the sign hangs; the rod passes above the window
    const tip = S4TIP, H = [1610, 40], hb = running ? (k > 0 ? 6 : 0) : 2 * Math.sin(q * 2.2);
    const dx = tip[0] - H[0], dy = tip[1] - H[1] - hb;
    tf(armG, `translate(${H[0]},${(H[1] + hb).toFixed(1)})`);
    tf(rodG, `translate(${H[0]},${(H[1] + hb).toFixed(1)}) rotate(${(Math.atan2(dy, dx) * 180 / Math.PI - 180).toFixed(2)}) scale(${(Math.hypot(dx, dy) / 1000).toFixed(4)},1)`);
    tf(signG, `translate(${tip[0]},${(tip[1]).toFixed(1)}) rotate(${(sway * 8 * Math.sin(q * (running ? 7.5 : 3.2)) + 1.2 * jit(f >> 1, 12)).toFixed(2)})`);
  } };
}

function scene4(p, D) {
  const R = roadSet(p, 'road2'), cam = R.cam, card = titleCard(p), office = s4office(p);
  const CX = 1000, CN_END = CX - 250, AM_X = CX - 730, IND_X = CX - 560, IND_BACK = { x: IND_X + 250, y: 36 }, AM_RECOIL = 30, CN_STORM_END = AM_X - AM_RECOIL + 240;   // scene 3's order: American, Indian, Chinese, cow; the Indian man steps back for the storm   // standing places after the stop (the Indian man clear of the signpost at x 190…356)
  const CU_COW = { x: 1200, y: 560, z: 2.4 }, CU_CN = { x: CN_END + 110, y: 470, z: 2.4 }, TWO = { x: 500, y: 500, z: 1.6 }, CU_AM = { x: AM_X - 60, y: 500, z: 3 };
  // 4.1 wide, they walk in   4.2 the cow's close-up   4.3 wide   4.4 the Chinese man   4.5 two-shot   4.6 snap zoom to the American
  cam.cut(FARM_WIDE, 0).cut(CU_COW, S4.cowCU).soft(S4.cowCU, true).to({ x: 1190, y: 640, z: 2.05 }, S4.lie0 - .1, .9).cut(FARM_WIDE, S4.wide).soft(S4.wide, false)
    .cut(CU_CN, S4.cnCU).soft(S4.cnCU, true).cut(TWO, S4.two).soft(S4.two, false).shake(S4.shake, .8, 9)
    .to(CU_AM, S4.snap, .3).soft(S4.snap + .3, true);

  stopClock(D, (q, f) => {
    const title = q >= S4.titleAt;
    const cut = q >= S4.cut0 && q < S4.cut1;
    vis(cam.root, !title && !cut); vis(card, title); vis(office.root, cut);
    if (title) return;
    cam.apply(q, f);
    if (cut) { office.draw(q, f); return; }
    const cx = s4cowX(q), mv = s4moving(q), w = mv ? s4walk(q) : {}, lieU = span(q, S4.lie0, S4.lie1);
    R.lash.pose({ on: false });

    /* ---------- the cow ---------- */
    const reaching = q < S4.stop ? Math.min(1, (S4.stop - q) / 2) : 0;   // the neck stretches while it still hopes
    const sigh = between(q, S4.sigh, S4.lie0 + .1) ? Math.sin(Math.PI * span(q, S4.sigh, S4.lie0 + .1)) : 0;
    const standing = q >= S4.stop && q < S4.lie0;
    const eyeX = q < S4.us ? 1 : q < S4.lie0 ? 0 : 0;
    R.cow.pose({ ...FARM.cow, x: cx, rod: true, walk: mv ? s4r(q) : 0, gait: s4gait(q), bob: mv ? (Math.floor(s4gait(q)) % 2 ? -6 * s4r(q) : 0) * .7 : 8 * sigh, lie: lieU,
      headR: 10 * reaching - 5 * sigh - 18 * lieU, jaw: mv && q < 8 ? .12 * (onTwos(q) > 0 ? 1 : 0) : .25 * sigh,
      eyeX: standing || q < S4.stop ? eyeX : 0, eyeY: lieU > 0 ? .2 : 0, swing: mv ? 7 + 3 * onTwos(q) * reaching : 0,
      shut: blinking(q, [3.1, 7.6, 19.0, 37.2, 42.7]) || between(q, S4.blink, S4.blink + .8),
      lids: sigh ? .5 : lieU > 0 ? .45 : q >= S4.us ? .15 : 0, brow: q >= S4.us && q < S4.lie0 ? -.4 * 0 : 0,
      ear: q > S4.stop ? 14 * (onTwos(q) > 0 && between(q % 5, 0, .3) ? 1 : 0) : 0, tail: q > S4.lie1 && between((q - S4.lie1) % 4, 0, .5) ? 25 * onTwos(q) : 0 }, f);

    /* ---------- the men: follow the cow, then stand and stare ---------- */
    const k = mv ? w : {};
    const stare = { look: .7, eyeX: 1 };
    // Chinese man: strutting beside the cow's tail (hands behind his back), then staring, then turning on the American
    const turn = span(q, S4.turn, S4.turn + .7), storm = span(q, S4.storm0, S4.storm1);
    const cnX = (mv ? cx - 250 : CN_END) + (q >= S4.storm0 ? (CN_STORM_END - CN_END) * storm : 0);
    const stormWalk = q >= S4.storm0 && q < S4.storm1 + .1 ? spWalk(q) : {};
    const sp = q >= s4v('s14') && q < s4v('s14', 9.4);
    // stressed words: 境外势力 and 躺平; he leans in, squashes a little and jabs on twos at the American's face
    const stress = [[1.107, 1.9], [4.18, 5.0]].some(([a, b]) => between(q, s4v('s14', a + 3.5), s4v('s14', b + 3.5)));
    const jab = q >= S4.storm1 - .3 ? 86 + (stress ? 7 * onTwos(q) : 3 * onTwos(q)) : 30 + 56 * span(q, S4.storm0, S4.storm1);
    const drop = span(q, S4.hands - .3, S4.hands);   // the finger comes down as the American's hands go up (they'd meet like a fist bump)
    const angry = q >= S4.turn + .4;
    const twitch = between(q, S4.cnCU + .6, S4.cnCU + 1.5) ? (onTwos(q) > 0 ? .55 : 0) : between(q, S4.cnCU + 1.9, S4.cnCU + 2.3) && onTwos(q) > 0 ? .4 : 0;
    R.cn.pose({ x: cnX, y: FARM.ground, s: FARM.s, ...k, ...stormWalk, look: .7 - 1.5 * turn, eyeX: 1 - 2 * turn, eyeY: 0,
      armR: mv ? -20 : 0, armL: mv ? -20 : q >= S4.storm0 ? jab * (1 - drop) : 0,
      lids: twitch, squash: sp && stress ? .05 : 0, shut: blinking(q, [2.4, 6.9, 18.2, 31.8, 34.0, 36.9, 39.4, 41.9]), brow: angry ? -1.2 : mv ? -.1 : .3,
      mouth: sp ? (lips(q, 'scene4', PRE4, 's14') === 'X' ? 'frown' : lips(q, 'scene4', PRE4, 's14')) : mv ? 'smile' : angry ? 'frown' : 'flat',
      headR: angry ? (sp ? -9 - (stress ? 4 : 0) : -5) : 0 }, f);
    // American: agape, then hands up for "Me?"
    const hands = span(q, S4.hands, S4.hands + .35);
    const amLook = q >= S4.storm0 - .2 ? { look: .9, eyeX: 1, eyeY: .1 } : stare;
    if (R.am.g._up !== (hands > 0)) { R.am.g._up = hands > 0; if (hands > 0) R.am.g.parentNode.appendChild(R.am.g); }   // in front of the Chinese man once his hands are up, so both show
    R.am.pose({ x: mv ? cx - 730 : AM_X + (q >= S4.storm0 + .5 ? -AM_RECOIL * span(q, S4.storm0 + .5, S4.storm1 + .3) : 0), y: FARM.ground, s: FARM.s, ...k, ...amLook, eyeY: (amLook.eyeY || 0) + s4flick(q, 3),
      hold: null, armL: 130 * hands, armR: 130 * hands + (k.armR || 0) * (1 - hands), shut: blinking(q, [1.9, 5.4, 9.1, 13.8, 18.7, 33.0, 35.8, 40.0, 44.2]),
      mouth: q >= s4v('s15') ? lips(q, 'scene4', PRE4, 's15') === 'X' ? 'O' : lips(q, 'scene4', PRE4, 's15') : 'O',
      brow: 1.2 * span(q, S4.storm0 + .5, S4.storm0 + 1.2) + .3, lids: 0, squash: 0, bob: k.bob || 0, headR: q > S4.storm1 && hands === 0 ? -7 : hands > 0 ? 5 * onTwos(q) * (hands < 1 ? 1 : 0) : 0 }, f);
    // Indian man: agape, then a shrug behind the two-shot
    const shrug = s4k(q, [[38.138, 0], [38.538, 60], [39.938, 60], [40.338, 0]]);
    const back = span(q, S4.turn + .2, S4.storm0 + .3);   // he steps back (behind the Chinese man's path) as the storm starts
    if (R.ind.g._back !== (back > 0)) { R.ind.g._back = back > 0; back > 0 ? R.ind.g.parentNode.insertBefore(R.ind.g, R.cn.g) : R.ind.g.parentNode.appendChild(R.ind.g); }   // behind the Chinese man while he storms past
    R.ind.pose({ x: mv ? cx - 560 : IND_X + (IND_BACK.x - IND_X) * back, y: FARM.ground - IND_BACK.y * back, s: FARM.s * (1 - .1 * back), ...k, look: q >= S4.storm0 ? .5 : .6, eyeX: 1, eyeY: s4flick(q, 5),
      armL: shrug || (k.armL || 0), armR: shrug || (k.armR || 0), headR: shrug > 30 ? 8 : 0,
      shut: blinking(q, [3.6, 8.3, 15.1, 33.5, 37.5, 39.0, 43.0]), mouth: shrug > 30 ? 'flat' : 'O', brow: .7 }, f);
  });
}
