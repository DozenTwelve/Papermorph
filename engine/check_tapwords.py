#!/usr/bin/env python3
"""Point-and-read regression: a small film whose ask beat is tapWords(), played headless.

    uv run --with playwright engine/check_tapwords.py

No server is needed: the check answers every request itself with this engine, a page written here and real MP3s from
existing books (one word clip is left missing on purpose). It checks that the things turn tappable only once the
narration is over, that a tap shows the word beside the thing (not over it), says its clip and ducks the music, the
counter and Continue, the keys (arrows, Enter, Space), the warnings for a thing without a word, off the stage or
without a clip, the cleanup on a seek and a replay, that Continue goes on once, and the video's P.tapDemo.
"""
import asyncio
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

ENGINE = Path(__file__).resolve().parent
SITE = ENGINE.parent / "site"
LONG = SITE / "math-notebook/ch01/audio/en/intro.mp3"   # the music
WORD = SITE / "little-red-riding-hood/ch01/audio/en/s01c.mp3"   # every word clip but one
PAGE = """<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>tapWords check</title><link rel="stylesheet" href="../lib/engine.css"></head>
<body>
<script src="../lib/engine.js"></script>
<script>
'use strict';
const CHAPTER = { number: 1, title: 'Point and read', minutes: 1, language: 'en', film: true };
let THINGS = [];
function picture(p, D) {
  const sun = mk('circle', { cx: 100, cy: 100, r: 10, fill: '#f0b45a' }, p);   // continuous motion: it runs on while the page waits
  clockRun(t => sun.setAttribute('cx', 100 + t * 10), D, { tail: true });
  const ball = mk('circle', { cx: 300, cy: 500, r: 60, fill: '#c94a3c' }, p);
  const tree = mk('rect', { x: 700, y: 150, width: 200, height: 600, fill: '#3e7f4c' }, p);
  const bee = mk('circle', { cx: 800, cy: 400, r: 12, fill: '#f0b45a' }, p);   // small, in front of the tree
  // a prop at the top (its word goes below) that the scene moves every frame through its own transform, as a puppet's is
  const cup = mk('g', {}, p);
  mk('rect', { width: 80, height: 60, fill: '#86c9e8' }, cup);
  clockRun(t => cup.setAttribute('transform', `translate(${(1300 + t * 20).toFixed(1)} 40)`), D, { tail: true });
  const box = mk('rect', { x: 1380, y: 795, width: 40, height: 20, fill: '#9aaba3' }, p);   // under the counter's card
  THINGS = [{ g: ball, word: 'ball', side: 'right' }, { g: tree, word: 'tree' }, { g: bee, word: 'bee', clip: 'w-bee-2', side: 'top' }, { g: cup, word: 'Ice cream' },
            { g: box, word: 'box' }, { g: tree, word: '' }, { g: document.createElementNS(NS, 'g'), word: 'ghost' }];
}
music('audio/bgm/m.mp3', ['q', 'after', 'end'], .5);
const BEATS = [
  ['q', 'Look', (m, D) => picture(panel(0), D), { dur: 1, ask: done => tapWords(THINGS, done) }],
  ['after', 'After', () => {}, { dur: 6 }],
  ['end', 'End', () => {}, { dur: 6 }],
].map(([id, title, run, extra]) => ({ id, title, run, ...extra }));
boot();
</script>
</body>
</html>"""


async def answer(route):
    path = urlparse(route.request.url).path.split("/__tapwords__/")[1]
    if path == "ch01/":
        await route.fulfill(content_type="text/html", body=PAGE)
    elif path.startswith("lib/"):
        await route.fulfill(path=ENGINE / path[4:])
    elif path == "ch01/audio/bgm/m.mp3":
        await route.fulfill(path=LONG)
    elif path.startswith("ch01/audio/en/w-") and path != "ch01/audio/en/w-ice-cream.mp3":
        await route.fulfill(path=WORD)
    else:
        await route.fulfill(status=404, body="")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = await browser.new_page(viewport={"width": 1640, "height": 1000})
        errors, warnings, asked = [], [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: (warnings if m.type == "warning" else errors).append(m.text)
                if m.type in ("warning", "error") and "404" not in m.text else None)
        page.on("request", lambda r: asked.append(urlparse(r.url).path.rsplit("/", 1)[-1]))
        await page.add_init_script("""window.PLAYED = [];
          const play = HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play = function () { PLAYED.push(this.src.split('/').pop()); return play.call(this); };""")
        await page.route("**/__tapwords__/**", answer)
        await page.goto("http://tapwords.invalid/__tapwords__/ch01/")
        await page.wait_for_function("typeof P !== 'undefined' && typeof BEATS !== 'undefined'")
        js = page.evaluate
        hits = "[...document.querySelectorAll('#stage .tapw .hit')]"
        count = "document.querySelector('.card.words .count')?.textContent"
        word = "document.querySelector('#ui .card.word')?.textContent"

        async def tap_at(selector_js):
            """A real click at the middle of a drawn thing."""
            r = await js(f"(() => {{ const r = {selector_js}.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }})()")
            await page.mouse.click(*r)
            await page.wait_for_timeout(80)

        await page.locator("#cover").click()
        await page.wait_for_timeout(200)
        assert await js("P.playing && !P.waiting"), "the film did not start"
        assert await js(f"{hits}.length") == 0 and await js(count) is None, "things were tappable during the narration"
        await page.wait_for_function(f"P.waiting && {hits}.length === 5", timeout=5000)
        assert sorted(await js(f"{hits}.map(g => g.getAttribute('aria-label'))")) == ["Ice cream", "ball", "bee", "box", "tree"]
        assert await js(f"{hits}.every(g => g.getAttribute('role') === 'button' && g.tabIndex === 0)")
        assert await js("document.getElementById('stage').getAttribute('role')") == "group", "the things are hidden from screen readers"
        assert await js(f"{hits}.every(g => {{ const r = g.getBBox(); return r.width >= 120 && r.height >= 120; }})"), "a hit box under 120 px"
        assert {"w-ball.mp3", "w-tree.mp3", "w-bee-2.mp3", "w-ice-cream.mp3"} <= set(asked), f"word clips not requested: {asked}"
        assert await js(count) == "0 / 5"
        assert "Continue" in await js("document.querySelector('.card.words button').textContent")
        assert await js("document.querySelector('.card.words button').className") == "btn quiet"
        print("PASS waiting: five things tappable after the narration, labelled, 120 px boxes, clips requested, 0 / 5, Continue")

        cx = await js("+document.querySelector('#scene circle').getAttribute('cx')")
        ring = "+document.querySelector('#stage .tapw [aria-label=\"Ice cream\"] rect').getAttribute('x')"
        rx = await js(ring)
        await page.wait_for_timeout(500)
        assert await js(ring) > rx + 5, "the hit box did not follow a moving thing"
        assert await js("SND.duck") > .6, "the music did not come up while waiting"
        assert await js("+document.querySelector('#scene circle').getAttribute('cx')") > cx + 3, "the scene's motion stopped while waiting"
        await tap_at("THINGS[0].g")
        assert await js(word) == "ball" and await js(count) == "1 / 5"
        assert "w-ball.mp3" in await js("PLAYED"), "the word was not said"
        assert await js("THINGS[0].g.getAnimations().length") > 0, "the thing did not hop"
        assert await js("""(() => { const a = document.querySelector('#ui .card.word').getBoundingClientRect(), b = THINGS[0].g.getBoundingClientRect();
          return a.left >= b.right; })()"""), "the word is not right of the thing (side: 'right')"
        await page.wait_for_timeout(250)
        assert await js("SND.duck") < .5, "the music did not duck under the word"
        await tap_at("THINGS[2].g")   # the bee, in front of the tree: the smaller box is on top
        assert await js(word) == "bee" and await js(count) == "2 / 5"
        assert await js("PLAYED.at(-1)") == "w-bee-2.mp3"
        await tap_at("THINGS[3].g")   # at the top: its word goes below
        assert await js("""(() => { const a = document.querySelector('#ui .card.word').getBoundingClientRect(), b = THINGS[3].g.getBoundingClientRect();
          return a.top >= b.bottom; })()"""), "a thing at the top did not get its word below"
        await tap_at("THINGS[0].g")   # again: says it again, counts once
        assert await js("PLAYED.at(-1)") == "w-ball.mp3" and await js(count) == "3 / 5"
        print("PASS taps: motion runs on while waiting, hit boxes follow, word on its side of the thing, clip played, music ducked, hop, smaller thing on top, a second tap says it again")

        await page.keyboard.press("ArrowRight")   # left to right: ball, tree, bee, ice cream, box
        await page.keyboard.press("ArrowRight")
        assert await js("document.activeElement.getAttribute('aria-label')") == "tree"
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(80)
        assert await js(word) == "tree" and await js(count) == "4 / 5"
        await page.keyboard.press("ArrowRight")
        await page.keyboard.press("ArrowRight")
        await page.keyboard.press("Space")
        await page.wait_for_timeout(120)   # mid-hop: the scene's transform is kept, the hop adds to it
        hop = await js("""[THINGS[3].g.getAttribute('transform'), THINGS[3].g.getBoundingClientRect().top]""")
        assert await js(word) == "Ice cream" and await js("P.i === 0 && P.waiting"), "Space did not tap"
        assert await js(count) == "4 / 5"
        await page.wait_for_timeout(500)
        rest = await js("""[THINGS[3].g.getAttribute('transform'), THINGS[3].g.getBoundingClientRect().top]""")
        assert hop[0].startswith("translate(13") and rest[0].startswith("translate(13") and hop[1] < rest[1] - 4, f"the hop lost the scene's transform: {hop} {rest}"
        await page.keyboard.press("ArrowRight")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(80)
        assert await js(word) == "box" and await js(count) == "You found them all!"
        assert await js("document.querySelector('.card.words button').className") == "btn go"
        print("PASS keys: arrows move left to right, Enter and Space tap; a hop keeps the scene's own transform; all heard: praise and Continue lit")

        await page.wait_for_timeout(300)
        for w in ('a thing has no word', '"ghost" is not an element on the stage', '"Ice cream" has no clip at audio/en/w-ice-cream.mp3',
                  '"box" cannot be tapped: <', '"bee" has side "top"'):
            assert any(w in x for x in warnings), f"no warning: {w}\n{warnings}"
        print("PASS warnings: no word, not on the stage, missing clip, covered by the counter, unknown side")

        await js("seek(1, false)")
        await page.wait_for_timeout(100)
        left = await js("""[document.querySelectorAll('#stage .tapw').length, document.querySelectorAll('#ui .card').length,
          P.keys === null, P.tapDemo === undefined, SND.word === null]""")
        assert left == [0, 0, True, True, True], f"a seek away left {left}"
        for _ in range(2):   # a replay, twice: one set of things, nothing counted from before
            await js("seek(0, true)")
            await page.wait_for_timeout(50)
        await page.wait_for_function(f"P.waiting && {hits}.length === 5", timeout=5000)
        assert await js("document.querySelectorAll('#stage .tapw').length") == 1 and await js(count) == "0 / 5"
        print("PASS cleanup: a seek away clears hit boxes, cards, keys and the word; a replay starts afresh")

        await js("document.activeElement.blur()")
        await page.keyboard.press("Enter")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(150)
        assert await js("P.i") == 1 and await js("document.querySelectorAll('#stage .tapw').length") == 0, "Continue did not go on once"
        print("PASS Continue: Enter goes on to the next beat once, before every thing was heard")

        await js("seek(0, false)")
        await page.wait_for_timeout(50)
        demo = await js("P.tapDemo && [P.tapDemo.clips, P.tapDemo.step]")
        assert demo == [["w-ball", "w-tree", "w-bee-2", "w-ice-cream", "w-box"], 2], demo
        said = await js("PLAYED.length")
        await js("P.tapDemo.at(0)")
        assert await js(word) == "ball"
        await js("P.tapDemo.at(2.1)")
        assert await js(word) == "tree" and await js(count) == "2 / 5"
        await js("P.tapDemo.at(99)")
        assert await js(word) == "box" and await js(count) == "You found them all!"
        assert await js("PLAYED.length") == said, "the video's words played sound"
        print("PASS video: P.tapDemo lists the clips and shows the words in turn, silently")
        missing = await js("['en', 'ru', 'zh', 'ja'].flatMap(l => ['wordsHeard', 'allWordsHeard'].filter(k => !TRANSLATIONS[l][k]).map(k => l + '.' + k))")
        assert not missing, f"interface strings missing: {missing}"
        print("PASS interface strings in en, ru, zh and ja")
        assert not errors, errors
        await browser.close()


asyncio.run(main())
