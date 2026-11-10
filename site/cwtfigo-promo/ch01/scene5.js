/* scene5.js — YOLO. Martin snaps (close); even YOLO asks: Claude hoists a sign bigger than himself and Martin smashes
   the key (wide); Claude salutes with his ✻ flashing red; "rm -rf" fills the screen; everyone freezes (wide); Martin's
   scream (close, shaking); Claude's cigar and the punchline. */
'use strict';
const PRE5 = .25;
function scene5(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene5', PRE5, c, t);
  const rmAt = at('m11'), rmEnd = rmAt + 1.35;
  // rm -rf, big and red; the Enter; and (seen only when we come back on "typing yes") the floor CWTFIGO keeps in every
  // mode: deleting user data waits for a typed yes (skills/cwtfigo/SKILL.md)
  const guard0 = at('c10', .75), guard1 = at('c10', 3.35);
  const rm = mk('g', {}, p);
  rm.innerHTML = termChrome() + yoloBadge();
  const rmCmd = mk('g', {}, rm), rmKey = mk('g', {}, rm), rmGuard = mk('g', {}, rm);
  const GX = F45 ? X45 + 26 : 160;   // 4:5: the warning wrapped to the window
  rmGuard.innerHTML = (F45 ? [['✻ That deletes user data', 520], ['  (/home/martin). Even in YOLO', 570], ['  it waits for you to type yes:', 620]]
    : [['✻ That deletes user data (/home/martin).', 560], ['  Even in YOLO it waits for you to type yes:', 620]])
    .map(([t, y]) => `<text x="${GX}" y="${y}" font-family="${MONO}" font-size="${F45 ? 30 : 40}" fill="#e8582a" xml:space="preserve">${t}</text>`).join('');
  const rmCursor = mk('text', { x: GX, y: F45 ? 690 : 700, 'font-family': MONO, 'font-size': 44, fill: '#e8eaed' }, rmGuard);
  const flag = stamp(p, `<g transform="translate(${F45 ? '800 690' : '1180 760'}) rotate(-4)"><rect x="-330" y="-46" width="660" height="80" rx="10" fill="#d8262b"/>
    <text x="0" y="10" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="34" fill="#fff">--dangerously-skip-permissions</text></g>`);
  const yolo = at('c08'), smash = yolo + 1.05;
  const shots = [shot(0, 'close', 'martin'), shot(yolo, 'wide', null, wv('yolo')), shot(at('c08', 1.9) - .1, 'single', 'claude'),
    shot(at('m10', -.05), 'single', 'martin'), shot(at('c09', -.05), 'single', 'claude'),
    shot(rmAt, 'screen', null, { over: 'rm' }), shot(rmEnd, 'wide', null, wv('stage')), shot(at('m11', 2.2) - .1, 'close', 'martin'),
    shot(at('c10', -.05), 'single', 'claude'), shot(guard0, 'screen', null, { over: 'rm' }), shot(guard1, 'single', 'claude')];
  const S = shooter(st, shots, { rm });
  stingAt('scene5'); stingAt('scene5', rmAt, 'uhoh');
  st.cam.shake(at('m11', 2.2), 1.3, 9);
  sfx('scene5', yolo + .1, 'whoosh', .8); sfx('scene5', yolo + .3, 'flap', 1.4); sfx('scene5', smash, 'keysmash', 1.8);
  sfx('scene5', smash + .12, 'chime', .8); sfx('scene5', rmAt + .1, 'typing', .9); sfx('scene5', rmEnd - .12, 'tick', 2);
  sfx('scene5', rmEnd + .25, 'clang', 1.2);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'rm') {
      const n = Math.max(0, Math.min(19, Math.floor((q - rmAt - .1) * 22)));
      rmCmd.innerHTML = `<text x="800" y="420" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="${F45 ? 52 : 88}" fill="#ff4a3d" xml:space="preserve"><tspan fill="#5df07a">$ </tspan>${'rm -rf /home/martin'.slice(0, n)}${q < rmEnd - .15 ? '▌' : ''}</text>`;
      const hit = q >= rmEnd - .15 && q < rmEnd + .2;
      rmKey.innerHTML = q >= rmEnd - .15 && q < guard0 ? `<g transform="translate(800 520) scale(${hit ? 1.15 : 1})"><rect x="-120" y="-40" width="240" height="80" rx="14" fill="${hit ? '#ff4a3d' : '#2a2f38'}" stroke="#e8eaed" stroke-width="4"/><text y="16" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="44" fill="#fff">Enter ⏎</text></g>` : '';
      vis(rmGuard, q >= guard0);
      rmCursor.textContent = '> ' + (Math.floor(q * 2.5) % 2 ? '▌' : ' ');
    }
    vis(flag, cur.who === 'claude' && q >= at('c08', 1.9) && q < at('m10') - .05);
    const yoloOn = q >= smash, red = yoloOn && Math.floor(q * 4) % 2 === 0;
    st.frame(q, f, { door: 1, lap: { open: true, screen: q >= smash && q < smash + .3 ? 'desk' : yoloOn ? 9 : 7 }, plug: {}, flicker: true });
    const ct = talk(q, 'scene5', PRE5, 'c08', 'c09', 'c10'), mt = talk(q, 'scene5', PRE5, 'm09', 'm10', 'm11');
    const frozen = q >= rmEnd && q < at('m11', 2.2);
    // Claude
    let cl = { x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S, mouth: ct === 'X' ? 0 : ct, star: red ? '#ff2a2a' : '#e8582a', spin: yoloOn ? q * 720 : q * 60,
      lids: .4, shut: blinkAt(q, 12) };
    if (cur.kind === 'wide' && q < rmAt) {   // the giant sign
      const up = span(q, yolo + .05, yolo + .35);
      cl = { ...cl, look: -.4, eyeX: -.8, lids: 0, brow: .6, armL: 20, armR: 120 * up, reachR: 1.2, frontR: true,
        hold: up > 0 ? { name: 'sign', w: 1400, x: 60, y: -430, upright: true, text: 'Turn on YOLO\nfor 12 hours?\n[y/n]', size: 145 } : null };
    } else if (q < at('m10')) {   // the salute
      const sal = span(q, at('c08', 1.9), at('c08', 2.2));
      const [bx, by] = st.claude.point(cl, [600, 380]);
      cl = { ...cl, lids: .1, brow: .3, ...st.claude.aim(cl, 'R', [bx + 30, by]), frontR: true };
      if (sal < 1) Object.assign(cl, { armR: cl.armR * sal, reachR: 1 + (cl.reachR - 1) * sal });
    } else if (q < at('c10')) cl = { ...cl, lids: .35, brow: 0, look: 0, eyeX: .3 };
    else cl = { ...cl, lids: .6, brow: -.3, cigar: true, mouth: ct === 'X' ? 0 : ct };
    if (frozen) cl = { ...cl, mouth: 0, lids: .5, eyeX: -.8, look: -.4 };
    // Martin
    let ma = { x: PLACE.martin[0], y: PLACE.martin[1], mouth: mt, lids: 0, shut: blinkAt(q, 13) };
    if (q < yolo) ma = { ...ma, brow: -1.2, mouth: mt === 'X' ? 'flat' : mt, headR: 2 * jit(f, 21), armL: 35, armR: 35, bob: 4 * Math.abs(jit(f, 22)) };
    else if (q < at('c08', 1.9)) {   // smashes the key
      const base = { ...ma, x: 650, brow: -1, look: .6, eyeX: .9, eyeY: .6, mouth: 'flat' };
      const lift = q < smash - .08 ? span(q, yolo + .4, smash - .2) : 1 - span(q, smash - .08, smash);
      const [kx, ky] = [PLACE.laptop[0] - 30, 568 - 150 * lift];
      ma = { ...base, ...st.martin.aim(base, 'R', [kx, ky]), frontR: true };
    } else if (q < at('m11', 2.2)) ma = { ...ma, brow: 1.2, mouth: mt === 'X' ? 'wobble' : mt, armL: 60, armR: 60, lean: q > at('m10') ? -6 : 0,
      eyeX: frozen ? 1 : 0, look: frozen ? .5 : 0 };
    else {   // hands on his head
      const base = { ...ma, brow: 1.4, eyeY: -.2, mouth: 'SCREAM', headR: 3 * jit(f, 23) };
      const [lx, ly] = st.martin.point(base, [260, 400]), [rx, ry] = st.martin.point(base, [768, 400]);
      ma = { ...base, ...st.martin.aim(base, 'L', [lx, ly]), ...st.martin.aim(base, 'R', [rx, ry]), frontL: true, frontR: true };
    }
    // Doc: soldering, looking over at the sign, frozen at rm -rf, his iron on the floor after
    const dropped = q >= rmEnd + .2;
    const doc = docSolder(st, q, f, { look: .6, eyeX: .9, eyeY: q > yolo ? -.2 : 1, lids: frozen ? 0 : .3, mouth: frozen ? 'O' : 'X',
      ...(dropped ? { hold: null, armR: 8, reachR: 1 } : {}) }, q > yolo ? 1 : glance(q, 3));
    castPose(st, cur, f, { doc, martin: ma, claude: cl });
    let fx = '';
    if (q >= smash && q < smash + .3 && cur.kind === 'wide') fx += `<g transform="translate(${PLACE.laptop[0] - 30} 560) scale(${(1 + 2 * (q - smash)).toFixed(2)})">${
      Array.from({ length: 8 }, (_, i) => `<path d="M0,0 L${(Math.cos(i * .785) * 46).toFixed(0)},${(Math.sin(i * .785) * 46).toFixed(0)}" stroke="#ffd23f" stroke-width="7" stroke-linecap="round"/>`).join('')}</g>`;
    if (dropped && cur.kind === 'wide') fx += `<image href="../img/props/iron.webp" x="${PLACE.doc[0] + 20}" y="${BENCH.y - 30}" width="100" height="34" transform="rotate(8 ${PLACE.doc[0] + 70} ${BENCH.y - 13})"/>`;
    if (cl.cigar && cur.who === 'claude') fx += smokeSVG(...emberAt(st, cl), q, 5, 1.2);
    st.fxHTML = fx;
  });
}
