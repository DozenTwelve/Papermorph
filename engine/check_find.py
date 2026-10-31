#!/usr/bin/env python3
"""Listen-and-find regression: a small film whose ask beat is findWords(), played headless in Chromium.

    uv run --with playwright engine/check_find.py

No server is needed: the check answers every request itself with this engine, a page written here and real MP3s from
Little Horse (one word clip is left missing on purpose). It checks that the things turn tappable only once the
narration is over; the character's ask with its caption and mouth (FIND.saying); a wrong tap (it says its name, then
the short ask); blank taps (ripples, two count as a miss); the shake at the second miss and the stars at the third; a
tap inside the asked thing's box under a smaller thing; the give-up line; the praise and the film going on; the keys;
the warnings; that the scene keeps drawing and a bed keeps playing (and is laid again) while the page waits, and a bed
with `to` stops there; and that a seek away mid-stop clears everything, the caption too, and a seek back starts afresh.
"""
import asyncio
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

ENGINE = Path(__file__).resolve().parent
SITE = ENGINE.parent / "site"
HORSE = SITE / "little-horse/ch01/audio"
LONG = SITE / "math-notebook/ch01/audio/en/intro.mp3"   # the music
PAGE = """<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>findWords check</title><link rel="stylesheet" href="../lib/engine.css"></head>
<body>
<script src="../lib/engine.js"></script>
<script>
'use strict';
const CHAPTER = { number: 1, title: 'Listen and find', minutes: 1, language: 'en', film: true };
window.TIMINGS = { 'q-ball': { dur: 1.28, marks: {}, cues: [[0, 'Can you find the ball?']] } };
let THINGS = [];
sfx('q', 0, 'bed', .5, { loop: true });            // a 2 s file: laid again every 1.5 s, through the wait
sfx('q', 0, 'cut', .5, { loop: true, to: .5 });    // stopped at 0.5 s on the beat clock
function picture(p, D) {
  const sun = mk('circle', { cx: 100, cy: 100, r: 10, fill: '#f0b45a' }, p);   // continuous motion: it runs on while the page waits
  clockRun(t => sun.setAttribute('cx', 100 + t * 10), D, { tail: true });
  const ball = mk('circle', { cx: 300, cy: 500, r: 60, fill: '#c94a3c' }, p);
  const tree = mk('rect', { x: 700, y: 150, width: 200, height: 600, fill: '#3e7f4c' }, p);
  const bee = mk('circle', { cx: 800, cy: 400, r: 12, fill: '#f0b45a' }, p);   // small, in front of the tree
  const cup = mk('rect', { x: 1300, y: 600, width: 80, height: 60, fill: '#86c9e8' }, p);
  THINGS = [{ g: ball, word: 'ball', side: 'right' }, { g: tree, word: 'tree' }, { g: bee, word: 'bee', side: 'top' },
            { g: cup, word: 'Ice cream' }, { g: tree, word: '' }, { g: document.createElementNS(NS, 'g'), word: 'ghost' }];
}
music('audio/bgm/m.mp3', ['q', 'after'], .5);
const ASKS = ['ball', 'tree', 'bee'].map(w => ({ word: w, clip: 'q-' + w }));
const BEATS = [
  ['q', 'Look', (m, D) => picture(panel(0), D), { dur: 1, ask: done => findWords(THINGS, ASKS, done, { hintAfter: 1.5, giveUpAfter: 3 }) }],
  ['after', 'After', () => {}, { dur: 6 }],
].map(([id, title, run, extra]) => ({ id, title, run, ...extra }));
boot();
</script>
</body>
</html>"""
CLIPS = {"q-": HORSE / "en/r-bird.mp3", "r-": HORSE / "en/w-ox.mp3", "w-": HORSE / "en/w-bird.mp3"}


async def answer(route):
    path = urlparse(route.request.url).path.split("/__find__/")[1]
    name = path.rsplit("/", 1)[-1]
    if path == "ch01/":
        await route.fulfill(content_type="text/html", body=PAGE)
    elif path.startswith("lib/"):
        await route.fulfill(path=ENGINE / path[4:])
    elif path == "ch01/audio/bgm/m.mp3":
        await route.fulfill(path=LONG)
    elif path in ("ch01/audio/sfx/bed.mp3", "ch01/audio/sfx/cut.mp3"):
        await route.fulfill(path=HORSE / "sfx/trot.mp3")
    elif path == "ch01/audio/sfx/chime.mp3":
        await route.fulfill(path=HORSE / "sfx/chime.mp3")
    elif path.startswith("ch01/audio/en/") and name[:2] in CLIPS and name != "w-ice-cream.mp3":
        await route.fulfill(path=CLIPS[name[:2]])
    else:
        await route.fulfill(status=404, body="")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = await browser.new_page(viewport={"width": 1640, "height": 1000})
        errors, warnings = [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: (warnings if m.type == "warning" else errors).append(m.text)
                if m.type in ("warning", "error") and "404" not in m.text else None)
        await page.add_init_script("""window.PLAYED = [];
          const play = HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play = function () { PLAYED.push(this.src.split('/').pop()); return play.call(this); };""")
        await page.route("**/__find__/**", answer)
        await page.goto("http://find.invalid/__find__/ch01/")
        await page.wait_for_function("typeof P !== 'undefined' && typeof BEATS !== 'undefined'")
        js = page.evaluate
        hits = "[...document.querySelectorAll('#stage .findw rect[role=button]')]"
        word = "document.querySelector('#ui .card.word')?.textContent"
        state = "window.FIND_STATE?.k"

        async def tap_at(x_js, wait=80):
            """A real click at the middle of a drawn thing, or at a stage point [x, y]."""
            r = await js(f"""(() => {{ const t = {x_js}, s = $('stage').getBoundingClientRect();
              if (Array.isArray(t)) return [s.x + t[0] * s.width / SW, s.y + t[1] * s.height / SH];
              const r = t.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }})()""")
            await page.mouse.click(*r)
            await page.wait_for_timeout(wait)

        async def said(clip, timeout=4000):
            await page.wait_for_function(f"PLAYED.includes({clip!r})", timeout=timeout)

        await js("setCaptions(true, false)")
        await page.locator("#cover").click()
        await page.wait_for_timeout(200)
        assert await js("P.playing && !P.waiting"), "the film did not start"
        assert await js(f"{hits}.length") == 0, "things were tappable during the narration"
        await page.wait_for_function(f"P.waiting && {hits}.length === 4", timeout=5000)
        assert sorted(await js(f"{hits}.map(g => g.getAttribute('aria-label'))")) == ["Ice cream", "ball", "bee", "tree"]
        assert await js(f"{hits}.every(g => g.tabIndex === 0)")
        assert await js("document.getElementById('stage').getAttribute('role')") == "group"
        assert await js(f"{hits}.every(g => {{ const r = g.getBBox(); return r.width >= 120 && r.height >= 120; }})"), "a hit box under 120 px"
        await said("q-ball.mp3")
        assert await js("FIND.saying") == "q-ball" and await js("FIND.target === THINGS[0].g")
        await page.wait_for_timeout(150)
        assert await js("$('caption').textContent") == "Can you find the ball?" and not await js("$('caption').hidden"), "the ask has no caption"
        print("PASS waiting: four things tappable after the narration, labelled, 120 px boxes; the ask said, captioned, FIND.saying and FIND.target set")

        cx = await js("+document.querySelector('#scene circle').getAttribute('cx')")
        await page.wait_for_timeout(1800)
        assert await js("+document.querySelector('#scene circle').getAttribute('cx')") > cx + 3, "the scene's motion stopped while waiting"
        assert await js("$('caption').hidden"), "the ask's caption stayed after it was said"
        beds = await js("SND.on.filter(s => s._sfx === 'bed').map(s => s._at)")
        assert beds and max(beds) >= 1.5, f"the bed was not laid again during the wait: {beds}"
        assert not await js("SND.on.some(s => s._sfx === 'cut')"), "a bed with to: .5 still plays"
        assert await js("SND.duck") > .6, "the music did not come up while waiting"
        print(f"PASS the wait: the scene draws on, the bed is laid again (lays at {beds}), a bed with `to` stopped, the music up")

        await tap_at("[800, 700]")   # the tree (below the bee's box), while she asks for the ball
        assert await js(word) == "tree" and await js(state) == 0
        await said("w-tree.mp3")
        await said("r-ball.mp3")
        print("PASS a wrong tap: it hops, shows and says its name, then the short ask comes again; nothing is found")

        await tap_at("[1200, 300]")   # nothing there: a ripple; two of them count as a miss
        assert await js("document.querySelectorAll('#stage circle[stroke=\"#fbf6ea\"]').length") >= 1, "no ripple on a blank tap"
        await tap_at("[1250, 320]")
        await page.wait_for_timeout(100)
        assert await js("THINGS[0].g.getAnimations().length") > 0, "the ball did not shake at the second miss"
        await tap_at("THINGS[0].g")
        await page.wait_for_function(f"{state} === 1", timeout=5000)
        assert await js("PLAYED.includes('w-ball.mp3')") and await js("PLAYED.includes('chime.mp3')")
        print("PASS blanks and a find: ripples, two blanks are a miss, the shake at the second miss; the ball found, its name and the chime")

        await said("q-tree.mp3")
        for _ in range(3):
            await tap_at("THINGS[0].g", 150)   # the ball, three times while she asks for the tree
        assert await js("document.querySelectorAll('#stage g[pointer-events=none] path').length") == 6, "no stars at the third miss"
        await tap_at("THINGS[2].g")   # the bee, in front of the tree: inside the tree's box, so the tree is found
        await page.wait_for_function(f"{state} === 2", timeout=5000)
        assert await js("document.querySelectorAll('#stage g[pointer-events=none] path').length") == 0, "the stars stayed"
        print("PASS stars at the third miss; a tap inside the asked thing's box finds it under a smaller thing")

        await said("q-bee.mp3")
        await said("q-there.mp3", 6000)   # nobody finds the bee: the give-up line, then it counts as found
        await page.wait_for_function(f"{state} === 3", timeout=5000)
        await said("q-done.mp3")
        await page.wait_for_function("P.i === 1", timeout=5000)
        assert await js("document.querySelectorAll('#stage .findw').length") == 0
        print("PASS give-up after giveUpAfter s, the praise, and the film goes on by itself")

        await js("seek(0, true)")   # back into the stop, and away while she speaks
        await page.wait_for_function("P.waiting && FIND.saying === 'q-ball'", timeout=5000)
        await page.wait_for_timeout(150)
        assert not await js("$('caption').hidden")
        await js("seek(1, false)")
        await page.wait_for_timeout(150)
        left = await js("""[document.querySelectorAll('#stage .findw').length, document.querySelectorAll('#ui .card').length,
          P.keys === null, SND.word === null, FIND.saying, FIND.target, $('caption').hidden]""")
        assert left == [0, 0, True, True, None, None, True], f"a seek away left {left}"
        for _ in range(2):   # a replay, twice: one set of things, nothing counted from before
            await js("seek(0, true)")
            await page.wait_for_timeout(50)
        await page.wait_for_function(f"P.waiting && {hits}.length === 4", timeout=5000)
        assert await js("document.querySelectorAll('#stage .findw').length") == 1 and await js(state) == 0
        print("PASS seeks: away mid-line clears hit boxes, word, keys, sound and the caption; back starts afresh")

        await page.wait_for_timeout(1500)
        await page.keyboard.press("ArrowRight")   # left to right: ball, tree, bee, ice cream
        await page.keyboard.press("ArrowRight")
        assert await js("document.activeElement.getAttribute('aria-label')") == "tree"
        await page.keyboard.press("ArrowLeft")
        await page.keyboard.press("Enter")   # the ball, focused: found
        await page.wait_for_function(f"{state} === 1", timeout=5000)
        await js("document.activeElement.blur()")
        await page.keyboard.press("Enter")   # none focused: the stop is skipped
        await page.wait_for_timeout(150)
        assert await js("P.i") == 1, "Enter did not skip the stop"
        print("PASS keys: arrows go left to right, Enter taps the focused thing, Enter with none focused skips the stop")

        for w in ('a thing has no word', '"ghost" is not an element on the stage', '"Ice cream" has no clip at audio/en/w-ice-cream.mp3',
                  '"bee" has side "top"'):
            assert any(w in x for x in warnings), f"no warning: {w}\n{warnings}"
        print("PASS warnings: no word, not on the stage, missing clip, unknown side")
        assert not errors, errors
        await browser.close()


asyncio.run(main())
