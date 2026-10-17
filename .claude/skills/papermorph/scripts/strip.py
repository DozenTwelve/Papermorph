#!/usr/bin/env python3
"""Frames of a chapter's beats on contact sheets, rendered from the beat clock: storyboard sheets and motion strips.

    uv run --with playwright --with pillow --with numpy strip.py ch12 OUT [specs ...] [--sheet NAME] [--url URL] [--browser chromium]

    push:2.3,dir,end    chosen moments of beat 'push': seconds, a narration mark (dir, dir+0.5), mid or end
    push/0.25           a motion strip: every 0.25 s across the beat (push alone: every 1 s)
    push/0.25@w         also a motion WebP of the beat (0.25 s steps)
    push/0.2@o          also an onion skin: the strip's frames laid over each other in one picture, later ones
                        stronger; even gaps between ghosts mean even speed, bunched ghosts slow-in or slow-out
    --sheet storyboard  put every frame into one sheet OUT/storyboard.jpg (layout-first storyboard)

Without --sheet each beat gets OUT/strip_<beat>.jpg (onion skins OUT/onion_<beat>.jpg). Frames are labelled "beat t" and shown at 1/3 size, four
a row. Firefox by default: it is the slowest common browser and the one to judge by. --url is where the book is served.
"""
import argparse, asyncio, re, sys, tempfile
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw

def sheet(ims, path, cols=4):
    cols = min(cols, len(ims)); W, H = ims[0].size
    S = Image.new("RGB", (W * cols, H * ((len(ims) + cols - 1) // cols)), (20, 30, 27))
    for k, im in enumerate(ims): S.paste(im, ((k % cols) * W, (k // cols) * H))
    S.save(path, quality=84)

def onion_skin(ims):
    """Frames over a common background: what stays still is the per-pixel median; what moved is painted from
    each frame, earliest faintest."""
    import numpy as np
    F = np.stack([np.asarray(im, dtype=np.float32) for im in ims]); bg = np.median(F, axis=0); out = bg.copy()
    for k, f in enumerate(F):
        moved = np.abs(f - bg).max(axis=2) > 24
        a = .25 + .75 * k / max(len(F) - 1, 1)
        out[moved] = out[moved] * (1 - a) + f[moved] * a
    return Image.fromarray(out.astype(np.uint8))

async def main(a):
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp()) / "f.png"
    async with async_playwright() as p:
        b = await (p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0}) if a.browser == "firefox" else p.chromium.launch())
        pg = await b.new_page(viewport={"width": 1600, "height": 960})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(f"{a.url}{a.chapter}/?beat=0&t=0"); await pg.wait_for_timeout(800)
        async def shot(t, scale):
            await pg.evaluate(f"P.t = {t}; evalTo({t})"); await pg.wait_for_timeout(60)
            r = await pg.evaluate("(() => { const r = document.getElementById('stage').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()")
            await pg.screenshot(path=str(tmp), clip={"x": r[0], "y": r[1], "width": r[2], "height": r[3]})
            im = Image.open(tmp).convert("RGB")
            return im.resize((im.width // scale, im.height // scale))
        allims = []
        for spec in a.specs:
            m = re.fullmatch(r"(.+?)((?:@[wo])*)", spec); spec, flags = m[1], m[2]
            webp, onion = "@w" in flags, "@o" in flags
            m = re.fullmatch(r"([^:/]+)(?::(.+)|/([\d.]+))?", spec)
            if not m: sys.exit(f"bad spec {spec!r}")
            bid, moments, step = m.groups()
            i = await pg.evaluate(f"BEATS.findIndex(b => b.id === '{bid}')")
            if i < 0: sys.exit(f"no beat {bid!r}")
            tm = await pg.evaluate(f"TIMINGS['{bid}']"); dur = tm["dur"]
            def when(x):
                mk = re.fullmatch(r"([A-Za-z_]\w*)([+-][\d.]+)?", x)
                if x in ("mid", "end"): return dur / 2 if x == "mid" else dur - .05
                if mk and mk[1] in tm.get("marks", {}): return tm["marks"][mk[1]] + float(mk[2] or 0)
                return float(x)
            await pg.evaluate(f"seek({i}, false)"); await pg.wait_for_timeout(300)
            st = float(step or 1)
            ts = [when(x) for x in moments.split(",")] if moments else [k * st for k in range(int(dur / st) + 1)]
            ims, raw = [], []
            for t in ts:
                im = await shot(t, 3); raw.append(im.copy())
                ImageDraw.Draw(im).text((6, 4), f"{bid} t={t:.2f}", fill=(255, 230, 120)); ims.append(im)
            if onion:
                skin = onion_skin([await shot(t, 2) for t in ts] if len(ts) > 1 else raw)
                ImageDraw.Draw(skin).text((8, 6), f"{bid} onion t={ts[0]:.2f}..{ts[-1]:.2f}, {len(ts)} frames", fill=(255, 230, 120))
                skin.save(out / f"onion_{bid}.jpg", quality=86)
            if a.sheet: allims += ims
            else: sheet(ims, out / f"strip_{bid}.jpg")
            if webp:
                fr, t = [], 0.0
                while t <= dur:
                    fr.append(await shot(t, 2)); t += .25
                fr[0].save(out / f"motion_{bid}.webp", save_all=True, append_images=fr[1:], duration=250, loop=0, quality=60)
            print(bid, len(ims), "frames")
        if a.sheet and allims: sheet(allims, out / f"{a.sheet}.jpg"); print("sheet", out / f"{a.sheet}.jpg")
        await b.close()
    if errs: print("PAGE ERRORS:", errs); return 1
    return 0

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chapter"); ap.add_argument("out"); ap.add_argument("specs", nargs="+")
    ap.add_argument("--sheet"); ap.add_argument("--url", default="http://localhost:8765/")
    ap.add_argument("--browser", default="firefox", choices=["firefox", "chromium"])
    a = ap.parse_args(); a.url = a.url.rstrip("/") + "/"
    sys.exit(asyncio.run(main(a)))
