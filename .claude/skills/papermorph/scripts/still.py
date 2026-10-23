#!/usr/bin/env python3
"""Stretches where a lesson beat's stage does not move: seeks each beat every STEP seconds and compares frames.

    uv run --with playwright --with pillow still.py ch15 --url http://localhost:8765/science/ [beat ...] [--min 3]

Prints, per lesson beat, the stretches of at least --min seconds whose consecutive frames differ by less than
--thr (mean absolute pixel difference, 0-255, on a small grey copy of the stage). In a picture book the kit's hand
jitter (`jit` called from the book's lib/, not the camera's shake) and the exposure flicker are switched off while
measuring; a scene's own `jit` (snowfall, a tremble) keeps working, so what is left is the film as played, less the hand:
a breathing, blinking puppet that does nothing else measures about 1-1.5, real acting 2 and up (The Chess Dog,
2026-10-23). Defaults: 0.03 for a lesson, 1.5 for a picture book. Strips and onion skins cannot show that nothing
moves; this can. A stretch is worth a look, not automatically wrong: a held moment can be right.
"""
import argparse, asyncio, io
from playwright.async_api import async_playwright
from PIL import Image, ImageChops, ImageStat

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("chapter"); ap.add_argument("beats", nargs="*")
ap.add_argument("--url", default="http://localhost:8765/")
ap.add_argument("--step", type=float, default=1); ap.add_argument("--min", type=float, default=3)
ap.add_argument("--thr", type=float)
a = ap.parse_args()
URL = a.url.rstrip("/") + f"/{a.chapter}/"
# The kit's hand jitter is jit() called from a puppet in the book's lib/ (cast.js, paper.js); the camera's shake is
# jit() from cam.apply, and scenes call jit() for layout and acting (ch01's snowflakes, ch06's trembling dog): those
# keep their values. ponytail: tells callers apart by the stack (slow, measuring only); a kit flag would be cheaper.
STEADY = r"""(() => {
  if (typeof jit !== 'function') return false;
  const j0 = jit;
  window.jit = (f, k) => {
    const at = new Error().stack.split('\n').find(l => /https?:/.test(l)) || '';
    return /\/lib\/[^/]+\.js/.test(at) && !/\bapply\b/.test(at) ? 0 : j0(f, k);
  };
  if (typeof FLICKER !== 'undefined') FLICKER.style.display = 'none';
  return true;
})()"""

async def main():
    async with async_playwright() as p:
        b = await p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0})
        pg = await b.new_page(viewport={"width": 1600, "height": 960}, reduced_motion="reduce")
        await pg.goto(URL + "?beat=0&t=0"); await pg.wait_for_timeout(800)
        ids = await pg.evaluate("BEATS.map(b => b.id)"); asks = await pg.evaluate("BEATS.map(b => !!b.ask)")
        film = await pg.evaluate(STEADY)
        thr = a.thr if a.thr is not None else (1.5 if film else .03)
        r = await pg.evaluate("(() => { const r = document.getElementById('stage').getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; })()")
        for i, bid in enumerate(ids):
            if asks[i] or (a.beats and bid not in a.beats): continue
            await pg.evaluate(f"seek({i}, false)"); await pg.wait_for_timeout(200)
            dur = await pg.evaluate("P.end")   # the whole beat: a picture book's `pre` and the tail after the speech
            prev, diffs, t = None, [], 0.0
            while t <= dur + 1e-6:
                await pg.evaluate(f"P.t = {t}; evalTo({t})"); await pg.wait_for_timeout(40)
                im = Image.open(io.BytesIO(await pg.screenshot(clip=r))).convert("L").resize((400, 240))
                if prev is not None: diffs.append((t, ImageStat.Stat(ImageChops.difference(prev, im)).mean[0]))
                prev = im; t += a.step
            runs, start = [], None
            for t1, d in diffs + [(t, 99)]:
                if d < thr and start is None: start = t1 - a.step
                if d >= thr and start is not None:
                    if min(t1 - a.step, dur) - start >= a.min: runs.append((start, min(t1 - a.step, dur)))
                    start = None
            print(f"{bid:11s} dur {dur:5.1f}  still: " + (", ".join(f"{s:.0f}-{e:.0f}s" for s, e in runs) or "-"), flush=True)
        await b.close()

asyncio.run(main())
