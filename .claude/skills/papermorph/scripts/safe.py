#!/usr/bin/env python3
"""Words outside an upright film's safe box, where a phone feed draws its title, caption and buttons over the stage.

    uv run --with playwright python safe.py chNN --url http://localhost:8765/<book>/ [--query tags] [--step 0.25]

Samples every beat every --step s on the beat clock (as strip.py sets it) and lists each text seen outside x 50-810,
y 130-1290 of the 900 x 1600 stage in two samples running (a word sliding through the edge in one frame is not
listed), once per beat with the first time it was out and its box. The box is the text's outline without its stroke,
with the top and bottom 20 % of its height trimmed (capitals fill about the middle 60 % of a font's height); a text
counts when its opacity, with all its parents', is over 0.5. --query adds to the page's query (tags: the source and
AI tags shown, as export.py shows them on an upright film). Exits 1 when any word is out, so a script can rely on it.
"""
import argparse, asyncio, sys
from playwright.async_api import async_playwright
from browsers import answers, exe

BOX = (50, 810, 130, 1290)   # x0, x1, y0, y1 on the 900 x 1600 stage
JS = """([x0, x1, y0, y1]) => { const st = document.getElementById('stage'), r = st.getBoundingClientRect(), k = SW / r.width, out = [];
  for (const e of st.querySelectorAll('text')) {
    let o = 1; for (let n = e; n && n !== st; n = n.parentElement) o *= +getComputedStyle(n).opacity;
    if (o < .5 || !e.textContent.trim()) continue;
    const b = e.getBoundingClientRect(); if (b.width < 1) continue;   // in a panel not shown
    const l = (b.left - r.left) * k, rt = (b.right - r.left) * k, t = (b.top - r.top) * k, bt = (b.bottom - r.top) * k, h = bt - t;
    if (l < x0 || rt > x1 || t + .2 * h < y0 || bt - .2 * h > y1) out.push(`${e.textContent.trim()} [${l|0}-${rt|0}, ${t|0}-${bt|0}]`);
  } return out; }"""


async def main(a):
    url = f"{a.url}{a.chapter}/"
    answers(url)
    q = a.query + "&" if a.query else ""
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe())
        pg = await b.new_page(viewport={"width": 940, "height": 1700}, reduced_motion="reduce")
        await pg.goto(f"{url}?{q}beat=0&t=0"); await pg.wait_for_timeout(500)
        n, sw, sh = await pg.evaluate("[BEATS.length, SW, SH]")
        if sw > sh: sys.exit(f"{url} is a landscape stage ({sw} x {sh}); the safe box is for an upright film")
        bad = 0
        for i in range(n):
            await pg.goto(f"{url}?{q}beat={i}&t=0"); await pg.wait_for_timeout(300)
            bid, end = await pg.evaluate("[BEATS[P.i].id, P.end]")
            prev, seen, t = set(), {}, 0.0
            while t < end:
                await pg.evaluate(f"P.t = {t}; evalTo({t})")
                cur = set(await pg.evaluate(JS, BOX))
                for s in cur & prev: seen.setdefault(s.split(" [")[0], (round(t, 2), s))
                prev, t = cur, t + a.step
            for t, s in seen.values(): print(f"{bid:10s} t={t:5.2f}  {s}"); bad += 1
        await b.close()
    print(bad, "words outside the safe box x %d-%d, y %d-%d" % BOX)
    return 1 if bad else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chapter", help="chapter folder under --url, e.g. ch03")
    ap.add_argument("--url", default="http://localhost:8765/")
    ap.add_argument("--query", default="", help="extra page query, e.g. tags")
    ap.add_argument("--step", type=float, default=.25, help="seconds between samples (default 0.25)")
    a = ap.parse_args(); a.url = a.url.rstrip("/") + "/"
    sys.exit(asyncio.run(main(a)))
