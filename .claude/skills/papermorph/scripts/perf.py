#!/usr/bin/env python3
"""Frame timings in Firefox for every lesson beat of a chapter: the clock runs on wall time (no audio) for 2 s from
three moments in each beat (start, middle, near the end), plus every beat transition. Prints mean / p95 / max frame
time and frames over 50 ms; the worst cases come last.

    uv run --with playwright perf.py ch11 [OUT.txt] [--url http://localhost:8765/<book>/] [--ref ch00:map@3]

The numbers measure the machine as much as the page: other exports or agents on it multiply every frame time. The run
prints the load average and the core count before and after, with a warning when the load is over the cores. --ref
CH:BEAT[@T] times one reference moment (a beat id or index of chapter CH of the same book, at T s, default its middle)
before and after the run, e.g. a beat measured on a quiet machine: read the chapter's numbers against it.
"""
import argparse, asyncio, os, sys
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
def load():
    l1, l5, _ = os.getloadavg(); n = os.cpu_count()
    return f"load average {l1:.1f} (1 min), {l5:.1f} (5 min) on {n} cores" + (
        "  WARNING busy machine: frame times read high; compare with --ref or measure when it is quiet" if l1 > n else "")


async def page(b, url):
    pg = await b.new_page(viewport={"width": 1512, "height": 982})
    await pg.goto(url); await pg.wait_for_timeout(800)
    await pg.evaluate(SETUP)
    return pg


async def reference(b, base, ref):
    ch, _, bt = ref.partition(":"); bt, _, t = bt.partition("@")
    pg = await page(b, f"{base}{ch}/?beat=0&t=0")
    i = await pg.evaluate(f"BEATS.findIndex((b, i) => b.id === {bt!r} || String(i) === {bt!r})")
    if i < 0: sys.exit(f"--ref: no beat {bt!r} in {ch}")
    t = float(t) if t else await pg.evaluate(f"((BEATS[{i}].pre || 0) + TIMINGS[BEATS[{i}].id].dur) / 2")
    v = await pg.evaluate(RUN, [i, t, 2000]); await pg.close()
    return f"reference {ref} @{t:.1f}: mean {v['mean']:5.1f}  p95 {v['p95']:5.1f}  max {v['max']:6.1f}  >50ms {v['over50']}"


async def main(ch, out, base, ref):
    head = [load()]; print(head[0], flush=True)
    async with async_playwright() as p:
        b = await p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0})
        if ref: head.append(await reference(b, base, ref) + " (before)"); print(head[-1], flush=True)
        pg = await page(b, f"{base}{ch}/?beat=0&t=0")
        beats = await pg.evaluate("BEATS.map(b => [b.id, !!b.ask, (b.pre || 0) + TIMINGS[b.id].dur])")
        res = []
        for i, (bid, ask, dur) in enumerate(beats):
            if ask: continue
            for t in (.3, dur / 2, dur - 2.2):
                res.append((f"{bid} @{t:.1f}", await pg.evaluate(RUN, [i, t, 2000])))
            if i < len(beats) - 1: res.append((f"{bid} -> next", await pg.evaluate(RUN, [i, -1.0, 2200])))
        if ref: head.append(await reference(b, base, ref) + " (after)")
        await b.close()
    head.append(load())
    res.sort(key=lambda r: (r[1]["over50"], r[1]["mean"]))
    lines = [f"{k:28s} mean {v['mean']:5.1f}  p95 {v['p95']:5.1f}  max {v['max']:6.1f}  >50ms {v['over50']}" for k, v in res]
    txt = "\n".join(lines); print(txt); print("\n".join(head[1 if not ref else 2:]))
    if out: open(out, "w").write(f"Firefox (Playwright), 1512x982, {ch}\n" + "\n".join(head) + "\n" + txt + "\n")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chapter"); ap.add_argument("out", nargs="?"); ap.add_argument("--url", default="http://localhost:8765/")
    ap.add_argument("--ref", metavar="CH:BEAT[@T]", help="a reference moment timed before and after, e.g. ch00:map@3")
    a = ap.parse_args()
    asyncio.run(main(a.chapter, a.out, a.url.rstrip("/") + "/", a.ref))
