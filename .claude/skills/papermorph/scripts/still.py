#!/usr/bin/env python3
"""Stretches where a lesson beat's stage does not move: seeks each beat every STEP seconds and compares frames.

    uv run --with playwright --with pillow still.py ch15 --url http://localhost:8765/science/ [beat ...] [--min 3]

Prints, per lesson beat, the stretches of at least --min seconds whose consecutive frames differ by less than
--thr (mean absolute pixel difference, 0-255, on a small grey copy of the stage). Strips and onion skins cannot
show that nothing moves; this can. A stretch is worth a look, not automatically wrong: a held moment can be right.
"""
import argparse, asyncio, io
from playwright.async_api import async_playwright
from PIL import Image, ImageChops, ImageStat

ap = argparse.ArgumentParser()
ap.add_argument("chapter"); ap.add_argument("beats", nargs="*")
ap.add_argument("--url", default="http://localhost:8765/")
ap.add_argument("--step", type=float, default=1); ap.add_argument("--min", type=float, default=3)
ap.add_argument("--thr", type=float, default=.03)
a = ap.parse_args()
URL = a.url.rstrip("/") + f"/{a.chapter}/"

async def main():
    async with async_playwright() as p:
        b = await p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0})
        pg = await b.new_page(viewport={"width": 1600, "height": 960})
        await pg.goto(URL + "?beat=0&t=0"); await pg.wait_for_timeout(800)
        ids = await pg.evaluate("BEATS.map(b => b.id)"); asks = await pg.evaluate("BEATS.map(b => !!b.ask)")
        r = await pg.evaluate("(() => { const r = document.getElementById('stage').getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; })()")
        for i, bid in enumerate(ids):
            if asks[i] or (a.beats and bid not in a.beats): continue
            dur = await pg.evaluate(f"TIMINGS['{bid}'].dur")
            await pg.evaluate(f"seek({i}, false)"); await pg.wait_for_timeout(200)
            prev, diffs, t = None, [], 0.0
            while t <= dur + 1e-6:
                await pg.evaluate(f"P.t = {t}; evalTo({t})"); await pg.wait_for_timeout(40)
                im = Image.open(io.BytesIO(await pg.screenshot(clip=r))).convert("L").resize((400, 240))
                if prev is not None: diffs.append((t, ImageStat.Stat(ImageChops.difference(prev, im)).mean[0]))
                prev = im; t += a.step
            runs, start = [], None
            for t1, d in diffs + [(t, 99)]:
                if d < a.thr and start is None: start = t1 - a.step
                if d >= a.thr and start is not None:
                    if min(t1 - a.step, dur) - start >= a.min: runs.append((start, min(t1 - a.step, dur)))
                    start = None
            print(f"{bid:11s} dur {dur:5.1f}  still: " + (", ".join(f"{s:.0f}-{e:.0f}s" for s, e in runs) or "-"), flush=True)
        await b.close()

asyncio.run(main())
