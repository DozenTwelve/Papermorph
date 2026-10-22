#!/usr/bin/env python3
"""Frame timings in Firefox for every lesson beat of a chapter: the clock runs on wall time (no audio) for 2 s from
three moments in each beat (start, middle, near the end), plus every beat transition. Prints mean / p95 / max frame
time and frames over 50 ms; the worst cases come last.

    uv run --with playwright perf.py ch11 [OUT.txt] [--url http://localhost:8765/<book>/]
"""
import argparse, asyncio, sys
from playwright.async_api import async_playwright
SETUP = r"""
() => { window.__d = []; let last = performance.now();
  const loop = now => { window.__d.push(now - last); last = now; requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
"""
RUN = r"""
async ([i, t, ms]) => {
  seek(i, true); P.afail = true; P.audio && P.audio.pause(); P.t = t < 0 ? P.end + t : t;
  await new Promise(r => setTimeout(r, 300)); window.__d = [];
  await new Promise(r => setTimeout(r, ms));
  const d = window.__d.slice(1).sort((a, b) => a - b), n = d.length;
  return { mean: +(d.reduce((a, b) => a + b, 0) / n).toFixed(1), p95: +d[Math.floor(n * .95)].toFixed(1), max: +d[n - 1].toFixed(1), over50: d.filter(x => x > 50).length };
}
"""
async def main(ch, out, base):
    async with async_playwright() as p:
        b = await p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0})
        pg = await b.new_page(viewport={"width": 1512, "height": 982})
        await pg.goto(f"{base}{ch}/?beat=0&t=0"); await pg.wait_for_timeout(800)
        await pg.evaluate(SETUP)
        beats = await pg.evaluate("BEATS.map(b => [b.id, !!b.ask, (b.pre || 0) + TIMINGS[b.id].dur])")
        res = []
        for i, (bid, ask, dur) in enumerate(beats):
            if ask: continue
            for t in (.3, dur / 2, dur - 2.2):
                res.append((f"{bid} @{t:.1f}", await pg.evaluate(RUN, [i, t, 2000])))
            if i < len(beats) - 1: res.append((f"{bid} -> next", await pg.evaluate(RUN, [i, -1.0, 2200])))
        await b.close()
    res.sort(key=lambda r: (r[1]["over50"], r[1]["mean"]))
    lines = [f"{k:28s} mean {v['mean']:5.1f}  p95 {v['p95']:5.1f}  max {v['max']:6.1f}  >50ms {v['over50']}" for k, v in res]
    txt = "\n".join(lines); print(txt)
    if out: open(out, "w").write(f"Firefox (Playwright), 1512x982, {ch}\n" + txt + "\n")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chapter"); ap.add_argument("out", nargs="?"); ap.add_argument("--url", default="http://localhost:8765/")
    a = ap.parse_args()
    asyncio.run(main(a.chapter, a.out, a.url.rstrip("/") + "/"))
