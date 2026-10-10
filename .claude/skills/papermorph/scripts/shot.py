#!/usr/bin/env python3
"""Screenshot beats of a chapter for review, plus contact sheets of four shots each.

    uv run --with playwright --with pillow shot.py ch07                    # every beat at 1.2 s (open) and its end
    uv run --with playwright --with pillow shot.py ch07 --moments mid      # add the middle of every beat
    uv run --with playwright --with pillow shot.py ch07 3:end 5:4.5 6:mid  # chosen moments (seconds, mid, end)
    ... --url http://localhost:8765/history/ --out /tmp/shots

Writes OUT/chNN_bII_T.png and OUT/chNN_sheet_T_K.png (2x2, half size; open the sheets first).
Uses ?beat=N&t=S, which seeks to the beat and freezes at that time. Run one browser at a
time: parallel runs slow page loads and catch pictures half faded in.
"""
import argparse, asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image


async def main(a):
    a.out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1600, "height": 960})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        base = f"{a.url}{a.chapter}/index.html"
        await pg.goto(base + "?beat=0&t=0"); await pg.wait_for_timeout(500)
        if errs:
            print("page errors:", errs); await b.close(); return 1
        n = await pg.evaluate("BEATS.length")
        durs = await pg.evaluate("BEATS.map(b => TIMINGS[b.id].dur)")
        specs = a.specs or [f"{i}:{t}" for t in ("open", "end", *a.moments) for i in range(n)]
        groups = {}
        for s in specs:
            i, t = s.split(":"); i = int(i)
            sec = {"open": 1.2, "end": durs[i] + 3, "mid": durs[i] / 2}.get(t)
            sec = float(t) if sec is None else sec
            await pg.goto(f"{base}?beat={i}&t={sec}"); await pg.wait_for_timeout(450)
            f = a.out / f"{a.chapter}_b{i:02d}_{t}.png"
            await pg.screenshot(path=str(f))
            groups.setdefault(t, []).append(f)
        await b.close()
    for t, fs in groups.items():
        for k in range(0, len(fs), 4):
            sheet = Image.new("RGB", (1600, 960), "black")
            for j, f in enumerate(fs[k:k + 4]):
                sheet.paste(Image.open(f).resize((800, 480)), ((j % 2) * 800, (j // 2) * 480))
            sheet.save(a.out / f"{a.chapter}_sheet_{t}_{k // 4}.png")
    print("errors:", sorted(set(errs))[:8] or "none", "| shots in", a.out)
    return 1 if errs else 0


if __name__ == "__main__":
    # Captured output (a pipe) uses the system code page on Windows; page errors may be any language.
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chapter", help="chapter folder under --url, e.g. ch07")
    ap.add_argument("specs", nargs="*",
                    help="moments as BEAT:TIME; BEAT is the index in BEATS from 0 (the player shows BEAT+1), "
                         "TIME is seconds, open, mid or end; e.g. 3:end 5:4.5 (default: every beat at open and end)")
    ap.add_argument("--moments", nargs="*", default=[], choices=["mid"], help="extra moments for every beat")
    ap.add_argument("--url", default="http://localhost:8765/")
    ap.add_argument("--out", type=Path, default=Path("/tmp/animebook-shots"))
    a = ap.parse_args()
    a.url = a.url if a.url.endswith("/") else a.url + "/"
    sys.exit(asyncio.run(main(a)))
