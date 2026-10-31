/* find.js — "listen and find", the book's point-and-read stops (2026-10-31; to move into the engine beside tapWords).
   findWords(things, asks, done, opts): a character asks for one thing at a time ("Can you find the bird? Touch it!").
   Every thing in the picture answers a tap: a wrong one hops and says its own name, then the short question comes
   again ("Where's the bird?"). Nothing is ever called wrong; each miss helps more: at the second the thing asked for
   shakes at once, from the third paper stars circle it and it keeps shaking. A tap on nothing leaves a paper ripple
   (two of them count as a miss). A tap that lands inside the asked thing's box counts as finding it, even where a
   smaller thing's box lies on top. Nobody finds it for `giveUpAfter` s: the character says "Look! There it is!", the
   thing hops and counts as found, so a child who never taps is never stuck. After the last one, the praise line, and
   the film goes on by itself. A new tap cuts off whatever was being said, so lines never pile up.
   things: [{ g, word, side?, clip?, talk? }] as for tapWords (talk: the clip is the character's voice, e.g. 'q-me'
   for the character itself); asks: [{ word, clip, again? }] in order (again defaults to 'r-' + word);
   opts.end: the praise clip; opts.there: the give-up clip.
   While the character speaks, FIND.saying names its clip: a scene poses its mouth with findMouth(), and can turn its
   eyes to FIND.target (the thing asked for) or findSaw() (the thing just found, until the next question). The lines
   are captioned, from their timings, when captions are on. */
'use strict';
// The engine keeps a scene living while tapWords waits; it does not for another ask. So find.js remembers each
// scene's frame function (stopClock, paper.js) and draws it on past the beat's end while the page waits.
const FIND_CLOCKS = [];
{ const run = stopClock; stopClock = (D, draw) => { while (FIND_CLOCKS.length && FIND_CLOCKS[0].gen !== P.gen) FIND_CLOCKS.shift(); FIND_CLOCKS.push({ gen: P.gen, D, draw, f: -1 }); run(D, draw); }; }
const FIND = { saying: null, t0: 0, target: null, found: null, foundAt: -1e9 }, FIND_SEEN = .9;   // until the next question starts
const findMouth = () => FIND.saying ? mouthAt(FIND.saying, performance.now() / 1000 - FIND.t0) : 'X';
const findSaw = () => performance.now() / 1000 - FIND.foundAt < FIND_SEEN ? FIND.found : null;
const FIND_SIDES = { above: 0, below: 1, right: 2, left: 3 };

function findWords(things, asks, done, { end = 'q-done', there = 'q-there', hintAfter = 5, giveUpAfter = 20, minBox = 120 } = {}) {
  const gen = P.gen, stage = $('stage'), lang = CHAPTER.language || 'en';
  const clip = name => { const a = new Audio(`audio/${lang}/${name}.mp3`); a.preload = 'auto'; a.clipName = name; return a; };
  const list = things.filter(t => t.word && t.g instanceof SVGGraphicsElement && stage.contains(t.g))
    .map(t => ({ ...t, a: clip(t.clip || 'w-' + t.word.toLowerCase().replace(/ /g, '-')) }));
  const qs = asks.map(q => ({ ...q, a: clip(q.clip), again: clip(q.again || 'r-' + q.word) }));
  const praise = clip(end), help = clip(there), chime = new Audio('audio/sfx/chime.mp3');
  const L = mk('g', { class: 'findw' }, stage);
  let on = false, alive = true, k = 0, word = null, lastAct = 0, askedAt = 0, wiggling = null, playing = null;
  let misses = 0, blanks = 0, turn = 0, stars = null;
  const now = () => performance.now();
  const box = t => {
    const s = stage.getBoundingClientRect(), r = t.g.getBoundingClientRect(), kx = SW / s.width, ky = SH / s.height;
    return { x: (r.left - s.left) * kx, y: (r.top - s.top) * ky, w: r.width * kx, h: r.height * ky };
  };
  const hitBox = t => { const b = box(t), w = Math.max(minBox, b.w), hh = Math.max(minBox, b.h); return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - hh) / 2, w, h: hh }; };
  const place = () => { for (const t of list) { const b = hitBox(t); for (const [key, v] of Object.entries({ x: b.x, y: b.y, width: b.w, height: b.h })) t.hit.setAttribute(key, v.toFixed(1)); } };
  const stagePoint = e => { const s = stage.getBoundingClientRect(); return [(e.clientX - s.left) * SW / s.width, (e.clientY - s.top) * SH / s.height]; };
  const want = () => list.find(t => t.word === qs[k]?.word);

  // one sound at a time, ducking the music like a tapped word; the character's own lines move its mouth and are
  // captioned; resolves when the sound ends
  const caption = a => {
    if (typeof captions === 'undefined' || !captions) return;
    const line = (TIMINGS[a.clipName]?.cues || []).map(c => c[1]).join(' ');
    $('caption').textContent = line; $('caption').hidden = !line;
  };
  const say = (a, talk = false) => new Promise(ok => {
    if (!alive) return ok();
    playing?.pause(); playing = a;
    a.currentTime = 0; a.volume = +($('volume')?.value ?? 1);
    FIND.saying = talk ? a.clipName : null; FIND.t0 = now() / 1000;
    if (talk) caption(a);
    a.onended = () => { if (SND.word === a) SND.word = null; if (FIND.saying === a.clipName) FIND.saying = null; if (talk) { $('caption').hidden = true; } ok(); };
    SND.word = a;
    a.play().catch(ok);
  });
  let wordTimer = 0;
  const hideWord = (after = 1500) => { clearTimeout(wordTimer); const w = word; wordTimer = setTimeout(() => w?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).finished.then(() => w.remove()), after); };
  // the word beside its thing, on its `side` or wherever it fits, as tapWords places it
  const showWord = t => {
    word?.remove(); clearTimeout(wordTimer);
    word = h('div', 'card word', t.word); word.setAttribute('aria-hidden', 'true');
    $('ui').append(word);
    const b = box(t), w = word.offsetWidth, hh = word.offsetHeight, gap = 30, m = 16, cx = b.x + (b.w - w) / 2, cy = b.y + (b.h - hh) / 2;
    const spots = [[cx, b.y - hh - gap], [cx, b.y + b.h + gap], [b.x + b.w + gap, cy], [b.x - w - gap, cy]];
    const [x, y] = t.side in FIND_SIDES ? spots[FIND_SIDES[t.side]] : spots.find(([x, y], i) => i < 2 ? y >= m && y + hh <= SH - m : x >= m && x + w <= SW - m) || spots[0];
    Object.assign(word.style, { left: Math.max(m, Math.min(SW - m - w, x)) + 'px', top: Math.max(m, Math.min(SH - m - hh, y)) + 'px' });
  };
  const hop = t => t.g.animate([{ translate: '0 0' }, { translate: '0 -22px', offset: .3 }, { translate: '0 0' }], { duration: 450, easing: 'ease-out' });
  // the hint: a big side-to-side shake (translate, so a scene can copy it onto a picture it moves itself, the mill's wheel)
  const wiggle = t => {
    if (wiggling) return;
    wiggling = t.g.animate([{ translate: '0 0' }, { translate: '-20px -6px' }, { translate: '20px 0' }, { translate: '-16px -4px' }, { translate: '12px 0' }, { translate: '0 0' }], { duration: 750 });
    wiggling.onfinish = () => { wiggling = null; lastAct = now() - (hintAfter - (misses >= 3 ? 0 : 2.5)) * 1000; };
  };
  // paper stars close round the thing asked for, from the third miss until it is found
  const starsOn = t => {
    if (stars) return;
    stars = mk('g', { 'pointer-events': 'none' }, L.parentNode);
    stars.innerHTML = Array.from({ length: 6 }, () => `<path d="M0,-28 L8,-8 L28,-8 L12,6 L18,26 L0,14 L-18,26 L-12,6 L-28,-8 L-8,-8 Z" fill="#f4c542" stroke="#b8862a" stroke-width="3"/>`).join('');
    stars.t = t;
  };
  const starsOff = () => { stars?.remove(); stars = null; };

  const ask = async () => {
    lastAct = askedAt = now();
    window.FIND_STATE = { k, of: qs.length };   // for tests
    FIND.target = want()?.g || null;
    if (k >= qs.length) {
      on = false; word?.remove(); FIND.target = null;
      await say(praise, true);
      setTimeout(() => { if (alive && P.gen === gen) { window.FIND_STATE.done = true; done(); } }, 900);
      return;
    }
    await say(qs[k].a, true);
    lastAct = askedAt = now();
  };
  const found = async (t, given) => {
    on = false; starsOff(); turn++;
    hop(t); showWord(t);
    if (given) await say(help, true);
    await say(t.a); hideWord(600);
    FIND.found = t.g; FIND.foundAt = now() / 1000;
    chime.currentTime = 0; chime.volume = .5 * +($('volume')?.value ?? 1); chime.play().catch(() => {});
    await new Promise(r => setTimeout(r, 700));
    if (!alive) return;
    k++; misses = blanks = 0; on = true; ask();
  };
  const miss = async (t, my) => {
    misses++;
    const w = want();
    if (misses >= 2 && w) wiggle(w);
    if (misses >= 3 && w) starsOn(w);
    if (t) { await say(t.a, !!t.talk); if (my !== turn) return; hideWord(); }
    await new Promise(r => setTimeout(r, 250));
    if (my === turn && alive && on) say(qs[k].again, true);
  };
  // every tap: inside the asked thing's box it is found, whatever lies on top; else the thing tapped, or nothing
  const press = (e, t) => {
    e.preventDefault();
    if (!on || !alive) return;
    lastAct = now();
    const [x, y] = stagePoint(e), w = want(), b = w && hitBox(w);
    if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return found(w);
    if (t) { const my = ++turn; hop(t); showWord(t); return miss(t, my); }
    const r = mk('circle', { cx: x, cy: y, r: 10, fill: 'none', stroke: '#fbf6ea', 'stroke-width': 4, 'pointer-events': 'none' }, L.parentNode);
    r.animate([{ r: 10, opacity: .9 }, { r: 46, opacity: 0 }], { duration: 500, easing: 'ease-out' }).finished.then(() => r.remove());
    if (++blanks % 2 === 0) miss(null, ++turn);
  };
  const enable = () => {
    on = true;
    const bg = mk('rect', { x: 0, y: 0, width: SW, height: SH, fill: 'transparent', style: 'pointer-events:all' }, L);
    bg.addEventListener('pointerdown', e => press(e, null));
    for (const t of list) {
      t.hit = mk('rect', { fill: 'transparent', style: 'cursor:pointer;pointer-events:all;outline:none', 'aria-label': t.word, role: 'button' }, L);
      t.hit.addEventListener('pointerdown', e => press(e, t));
    }
    // smaller things on top, so a bird in front of a tree can be reached
    [...list].sort((a, b) => box(b).w * box(b).h - box(a).w * box(a).h).forEach(t => L.append(t.hit));
    place();
    P.keys = e => e.key === 'Enter' ? (done(), true) : false;
    ask();
  };
  const cleanup = () => {
    alive = false; L.remove(); word?.remove(); starsOff();
    for (const a of [...list.map(t => t.a), ...qs.map(q => q.a), ...qs.map(q => q.again), praise, help]) a.pause();
    if (SND.word) SND.word = null;
    Object.assign(FIND, { saying: null, target: null, found: null });
  };
  P.cleanup.push(cleanup);
  let waitFrom = 0;
  const tick = () => {
    if (!alive) return;
    if (P.gen !== gen) { cleanup(); return; }
    // the scene lives on while the page waits: its frame function at D + the seconds waited, on its own 12 fps steps
    if (P.waiting) {
      waitFrom ||= now();
      for (const c of FIND_CLOCKS) if (c.gen === gen) {
        const q = c.D + (now() - waitFrom) / 1000, f = Math.floor(q * FPS + 1e-6);
        if (f !== c.f) { c.f = f; c.draw(f / FPS, f); }
      }
    }
    if (P.waiting && !on && k === 0 && !list[0].hit) enable();
    if (list[0]?.hit) place();
    if (stars) { const b = box(stars.t), cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.max(b.w, b.h) * .38 + 24, a0 = now() / 900;
      [...stars.children].forEach((st, i) => { const a = a0 + i * Math.PI / 3; st.setAttribute('transform', `translate(${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * .8 * Math.sin(a)).toFixed(1)}) rotate(${(a * 60).toFixed(0)})`); }); }
    const w = want();
    if (on && w && now() - askedAt > giveUpAfter * 1000) found(w, true);
    else if (on && w && now() - lastAct > hintAfter * 1000) wiggle(w);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
