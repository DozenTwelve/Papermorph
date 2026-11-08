/* scene7.js — Online. The backup goes back, the pings come back green (screen); the router's lights and Martin's own
   loud desktop come back (wide); his joy and Claude's "Yeah, yeah." (singles); Martin runs out into the rain and the
   door rattles down while Claude, unbothered, writes in his notebook (wide), the notebook's pages (insert, a slow
   drift back over the earlier visits), "Again." */
'use strict';
const PRE7 = 3.7;
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
  const shots = [shot(0, 'screen', null, { over: 'term' }), shot(lights, 'wide'), shot(at('m12', -.05), 'single', 'martin'),
    shot(at('c14', -.05), 'single', 'claude'), shot(run, 'wide'), shot(ins, 'insert', null, { over: 'book' }),
    shot(at('c15', 4.4) - .05, 'single', 'claude')];
  const S = shooter(st, shots, { term: term.g, book: book.g });
  stingAt('scene7');
  sfx('scene7', 0, 'typing', .7); [1.05, 1.4, 1.75].forEach(t => sfx('scene7', t, 'beep', .5));
  sfx('scene7', lights + .1, 'chime', 1.2); sfx('scene7', lights, 'rain', .3, { loop: true, to: ins });
  sfx('scene7', 0, 'hum', .3, { loop: true }); sfx('scene7', run + .05, 'patter', 1.2); sfx('scene7', run + .6, 'rain', .7, { loop: true, to: ins });
  sfx('scene7', shut0, 'shutter', 1.2); sfx('scene7', run + .8, 'page', .9); sfx('scene7', ins + .1, 'page', .7);
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
    // Martin: jaw drop at the lights, hugs the laptop, runs out of the door
    let ma = { x: PLACE.martin[0], y: PLACE.martin[1], lids: 0, brow: .3, mouth: mt, shut: blinkAt(q, 16) };
    // hugged high against his chest, the screen (his own loud desktop) out towards us
    const hug = { name: 'laptop-open', w: 380, y: -540, screen: `<g transform="translate(-152 -106)">${screenSVG('desk', 152, 72, 304, 144)}</g>` };
    const grab = lights + .7, joy = mt === 'X' ? 'grin' : ['D', 'C', 'D', 'H'][Math.floor(q * 8) % 4];
    const hugArms = o => { const [lx, ly] = [o.x - 52, o.y - 180], [rx, ry] = [o.x + 52, o.y - 180];
      return { ...st.martin.aim(o, 'L', [lx, ly]), ...st.martin.aim(o, 'R', [rx, ry]), frontL: true, frontR: true }; };
    if (q < grab) {   // the lights: his jaw drops, he steps to the stool and grabs it
      const step = span(q, lights + .25, grab - .1);
      ma = { ...ma, x: PLACE.martin[0] + 110 * step, look: .6, eyeX: 1, mouth: q > lights + .2 ? 'O' : 'wobble', brow: 1,
        ...(step > 0 ? st.martin.aim({ ...ma, x: PLACE.martin[0] + 110 * step }, 'R', [PLACE.laptop[0] - 40, 560 + 20 * (1 - step)]) : {}), frontR: true };
    } else if (!gone) {
      const o = { ...ma, x: PLACE.martin[0] + 110 * (1 - span(q, grab, grab + .4)), brow: .5, lids: 0, mouth: joy, bob: 10 * Math.abs(Math.sin(q * 9)), chest: hug };
      ma = { ...o, ...hugArms(o), headR: 4 * Math.sin(q * 7) };
    }
    else {
      const u = (q - run) / .95;
      const o = { ...ma, x: PLACE.martin[0] - 760 * Math.min(1, u), lean: -8, bob: 14 * Math.abs(Math.sin(q * 16)), look: -.8, eyeX: -1,
        mouth: 'grin', chest: hug, o: u < 1 ? 1 : 0 };
      ma = { ...o, ...hugArms(o) };
    }
    // Claude: deadpan, then the notebook
    let cl = { x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S, lids: .5, mouth: ct === 'X' ? 0 : ct, spin: q * 60, shut: blinkAt(q, 17) };
    if (q < at('m12')) cl = { ...cl, look: -.5, eyeX: -.8, lids: .3 };
    if (gone) {
      const pull = span(q, run + .5, run + .9), scrib = q > run + .9 ? 8 * Math.sin(q * 30) : 0;
      const base = { ...cl, eyeY: .9, eyeX: -.2, lids: .55 };
      const [nx, ny] = st.claude.point(base, [430, 1050]);
      cl = { ...base, frontL: true, frontR: true, holdL: pull > 0 ? { name: 'notebook', w: 240, upright: true, r: -8 } : null,
        ...(pull > 0 ? st.claude.aim(base, 'L', [nx - 40 * (1 - pull), ny]) : {}), ...st.claude.aim(base, 'R', [nx + 40 + scrib, ny - 20 + scrib * .5]) };
      if (q >= at('c15', 4.4) - .05) cl = { ...cl, lids: .75, brow: -.5, eyeY: .9 };
    }
    st.frame(q, f, { door: gone ? 1 - span(q, shut0, shut0 + 1) : 1, ledsOk: q >= lights, lap: q < grab ? { open: true, screen: q >= lights ? 'desk' : 9 } : null,
      plug: { at: q < grab ? PLACE.port : [905, 830], lit: q < grab } });
    castPose(st, cur, f, {
      doc: docSolder(st, q, f, gone ? { look: -.7, eyeX: -1, eyeY: 0, lids: .2 } : { look: .5, eyeX: .9, eyeY: .2, lids: .3 }),
      martin: ma, claude: cl,
    });
    st.fxHTML = '';
  });
}
