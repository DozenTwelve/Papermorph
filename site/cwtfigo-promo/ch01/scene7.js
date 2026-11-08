/* scene7.js — Online. The backup goes back, the pings come back green (screen); the router's lights and Martin's own
   loud desktop come back (wide); his joy and Claude's "Yeah, yeah." (singles); Martin runs out into the rain and the
   door rattles down while Claude, unbothered, writes in his notebook (wide), the notebook's pages (insert, a slow
   drift back over the earlier visits), "Again." */
'use strict';
const PRE7 = 3.7;
// The pen in Claude's writing mitten, its tip reaching left onto the page (source px, kept upright).
const PEN = { svg: `<path d="M0,-6 L-92,22" stroke="${CW_INK}" stroke-width="22" stroke-linecap="round"/><path d="M0,-6 L-86,20" stroke="#e8582a" stroke-width="13" stroke-linecap="round"/><path d="M-88,21 L-104,26" stroke="${CW_INK}" stroke-width="9" stroke-linecap="round"/>`, upright: true };
function scene7(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene7', PRE7, c, t);
  const L = (t, kind, text, cps = 120) => ({ at: t, kind, text, cps });
  const term = termScreen(p, [
    L(0, 'cmd', `cp ~/.config/hypr/hyprland.lua.bak.${BAK} ~/.config/hypr/hyprland.lua`, 160),
    L(.55, 'cmd', 'ping -c 3 1.1.1.1', 90),
    L(.85, 'out', 'PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.'),
    L(1.05, 'ok', '64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=12.3 ms'),
    L(1.4, 'ok', '64 bytes from 1.1.1.1: icmp_seq=2 ttl=57 time=11.8 ms'),
    L(1.75, 'ok', '64 bytes from 1.1.1.1: icmp_seq=3 ttl=57 time=12.1 ms'),
    L(1.95, 'out', '--- 1.1.1.1 ping statistics ---'),
    L(1.95, 'ok', '3 packets transmitted, 3 received, 0% packet loss, time 2003ms'),
  ], { yolo: true });
  const book = notebook(p);
  const lights = 2.25, run = at('c15'), shut0 = run + .95, ins = run + 1.7;
  const shots = [shot(0, 'screen', null, { over: 'term' }), shot(lights, 'wide'), { ...shot(at('m12', -.05), 'single', 'martin'), view: { x: PLACE.martin[0], y: 600, z: 2.35 } },
    shot(at('c14', -.05), 'single', 'claude'), shot(run, 'wide'), shot(ins, 'insert', null, { over: 'book' }),
    shot(at('c15', 4.4) - .05, 'single', 'claude')];
  const S = shooter(st, shots, { term: term.g, book: book.g });
  stingAt('scene7');
  sfx('scene7', 0, 'typing', .7); [1.05, 1.4, 1.75].forEach(t => sfx('scene7', t, 'beep', .5));
  sfx('scene7', lights + .1, 'chime', 1.2); sfx('scene7', run + .05, 'patter', .7);
  sfx('scene7', shut0, 'shutter', 1.2); sfx('scene7', m('m12.love') + .02, 'latch', 1.3); sfx('scene7', run + .8, 'page', .9); sfx('scene7', ins + .1, 'page', .7);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'term') term.draw(q);
    if (cur.over === 'book') {   // the pen finishes today's line, then the page drifts back over the earlier visits
      book.draw(q, { write: span(q, ins - .3, ins + 1.1) });
      const u = span(q, ins + .6, at('c15', 4.4)), sc = 1.12 + .1 * u;
      tf(book.book, `translate(${(-420 + 560 * u).toFixed(1)} ${(-40 - 20 * u).toFixed(1)}) scale(${sc.toFixed(3)})`);
    }
    const mt = talk(q, 'scene7', PRE7, 'm12'), ct = talk(q, 'scene7', PRE7, 'c14', 'c15');
    const gone = q >= run;
    // Martin: jaw drop at the lights, takes the laptop off the stool and holds it out by the sides of its base, the
    // screen (his own loud desktop) to us; on "I love you!" he snaps it shut and hugs it, swaying, eyes shut; runs out.
    let ma = { x: PLACE.martin[0], y: PLACE.martin[1], lids: 0, brow: .3, mouth: mt, shut: blinkAt(q, 16) };
    const DESK_SCR = `<g transform="translate(-152 -106)">${screenSVG('desk', 152, 72, 304, 144)}</g>`;
    const love = m('m12.love'), grab = lights + .7, joy = mt === 'X' ? 'grin' : mt;
    const held = (o, w = 415, cx = 0, cy = -494) => {   // the open laptop at his chest, a mitten on each side of the base
      const hw = w / 2 + 6, k = CW.martin.K * (o.s ?? 1);
      const at = sx => [o.x + (cx + sx * hw) * k, o.y + (cy + .22 * w) * k];
      return { chest: { name: 'laptop-open', w, x: cx, y: cy, screen: `<g transform="scale(${(w / 415).toFixed(3)})">${DESK_SCR}</g>` },
        ...st.martin.aim(o, 'L', at(-1)), ...st.martin.aim(o, 'R', at(1)), frontL: true, frontR: true };
    };
    const hugged = o => {   // shut, flat against his chest, both arms wrapped across it
      const k = CW.martin.K * (o.s ?? 1), [nx, ny] = [o.x, o.y - 470 * k];
      return { chest: { name: 'laptop', w: 400, y: -470 }, ...st.martin.aim(o, 'L', [nx + 40 * k, ny + 10]), ...st.martin.aim(o, 'R', [nx - 40 * k, ny - 6]), frontL: true, frontR: true };
    };
    const NEAR = 170, k = CW.martin.K, carry = span(q, grab, grab + .45);
    if (q < grab) {   // the lights: his jaw drops, he steps to the stool, both mittens on the base
      const step = span(q, lights + .25, grab - .1), o = { ...ma, x: PLACE.martin[0] + NEAR * step, look: .6, eyeX: 1, mouth: q > lights + .2 ? 'O' : 'wobble', brow: 1 };
      const reach = span(q, grab - .4, grab - .05), [lx, ly] = PLACE.laptop;
      ma = { ...o, ...(reach > 0 ? { ...st.martin.aim(o, 'L', [lx - 110, ly - 6]), ...st.martin.aim(o, 'R', [lx + 110, ly - 6]) } : {}), frontL: true, frontR: true };
      if (reach > 0) for (const sd of ['L', 'R']) { ma['arm' + sd] *= reach; ma['reach' + sd] = 1 + (ma['reach' + sd] - 1) * reach; }
    } else if (q < love) {   // lifts it off the stool and steps back holding it up to us: "I'M ONLINE! My configs!"; on
      // "My configs!" he pushes it at the lens
      const o = { ...ma, x: PLACE.martin[0] + NEAR * (1 - carry), brow: .5, lids: 0, mouth: joy, bob: 6 * Math.abs(Math.sin(q * 9)) * carry };
      const push = span(q, m('m12.configs'), m('m12.configs') + .15) - span(q, love - .35, love - .1);
      // the laptop from where it stood (world) to his chest (puppet units from his feet), one size changing smoothly
      const [lx, ly] = PLACE.laptop, sw = LAP_W / k, scx = (lx - o.x) / k, scy = (ly - LAP_W * 249 / 415 / 2 - o.y) / k;
      const e = ease(carry), w = sw + (415 + 50 * push - sw) * e;
      ma = { ...o, ...held(o, w, scx * (1 - e), scy + (-494 - scy) * Math.sqrt(e)), headR: 3 * Math.sin(q * 7) * carry, eyeY: .2 };   // down to his chest first, then over
    } else if (!gone) {   // snaps it shut and hugs it, swaying, eyes shut
      const o = { ...ma, lids: 0, bliss: true, shut: false, brow: .5, mouth: mt === 'X' ? 'grin' : mt, lean: 4 * Math.sin((q - love) * 5), headR: 5 * Math.sin((q - love) * 5 + .6) };
      ma = { ...o, ...(q < love + .1 ? held(o, 415) : hugged(o)) };
      if (q < love + .1) ma.chest = { name: 'laptop', w: 400, y: -494 };   // the lid slaps down
    } else {
      const u = (q - run) / .95;
      const o = { ...ma, x: PLACE.martin[0] - 760 * Math.min(1, u), lean: -8, bob: 14 * Math.abs(Math.sin(q * 16)), look: -.8, eyeX: -1,
        mouth: 'grin', o: u < 1 ? 1 : 0 };
      ma = { ...o, ...hugged(o) };
    }
    // Claude: deadpan, then the notebook
    let cl = { x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S, lids: .5, mouth: ct === 'X' ? 0 : ct, spin: q * 60, shut: blinkAt(q, 17) };
    if (q < at('m12')) cl = { ...cl, look: -.5, eyeX: -.8, lids: .3 };
    if (gone) {   // pulls the notebook out, holds it open by its left edge, writes on the right page; the arms stay off the cover
      const pull = span(q, run + .3, run + .7), scrib = q > run + .75 ? Math.sin(q * 30) : 0;
      const base = { ...cl, eyeY: .9, eyeX: -.2, lids: .55 }, lift = 60 * (1 - pull);
      const [bx, by] = [478, 1010], NW = 300;   // the open book's centre on his chest (source px) and width
      const [lx, ly] = st.claude.point(base, [bx - NW / 2 + 12, by]), [wx, wy] = st.claude.point(base, [bx + NW / 2 + 22, by - 24]);
      cl = { ...base, frontL: true, frontR: true,
        holdL: pull > 0 ? { name: 'notebook-open', w: NW, upright: true, r: -4, x: NW / 2 - 12, y: 0 } : null,
        hold: pull > .6 ? PEN : null,
        ...(pull > 0 ? { ...st.claude.aim(base, 'L', [lx, ly + lift]), ...st.claude.aim(base, 'R', [wx + 3 * scrib, wy + 2 * scrib + lift]) } : { armL: 12, armR: 12 }) };
      if (q >= at('c15', 4.4) - .05) cl = { ...cl, lids: .75, brow: -.5, eyeY: .9 };
    }
    st.frame(q, f, { door: gone ? 1 - span(q, shut0, shut0 + 1) : 1, ledsOk: q >= lights, lap: q < grab ? { open: true, screen: q >= lights ? 'desk' : 9 } : null,
      plug: { at: q < grab ? PLACE.port : [905, 830], lit: q < grab } });
    castPose(st, cur, f, {
      doc: docSolder(st, q, f, gone ? { look: -.7, eyeX: -1, eyeY: 0, lids: .2 } : { look: .5, eyeX: .9, eyeY: .2, lids: .3 }, 1),
      martin: ma, claude: cl,
    });
    st.fxHTML = '';
  });
}
