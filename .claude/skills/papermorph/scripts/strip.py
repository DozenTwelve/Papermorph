#!/usr/bin/env python3
"""Frames of a chapter's beats on contact sheets, rendered from the beat clock: storyboard sheets and motion strips.

    uv run --with playwright --with pillow --with numpy strip.py ch12 OUT [specs ...] [--sheet NAME] [--url URL] [--browser chromium] [--query tags]

    push:2.3,dir,end    chosen moments of beat 'push': seconds on the beat clock, a narration mark (dir, dir+0.5,
                        s04.ba1 in a joined scene), mid or end of the whole beat
    push/0.25           a motion strip: every 0.25 s across the beat (push alone: every 1 s)
    push/0.25@w         also a motion WebP of the beat (0.25 s steps)
    push/0.2@o          also an onion skin: the strip's frames laid over each other in one picture, later ones
                        stronger; even gaps between ghosts mean even speed, bunched ghosts slow-in or slow-out
    push:4..6/0.2@o     a time range of the beat instead of all of it (ends may be marks: dir..dir+1.5). An onion
                        skin is only readable inside one shot: give it the range of that shot, never across a cut
    walk:2..5/0.1@o@c   @c: camera off. Every frame is drawn in the set's own framing (a picture book's paperCam at
                        its base view, no pan, zoom or shake), so a follow shot or a cut within one set no longer
                        moves the background: a planted foot is one sharp ghost, a sliding foot a smear
    --sheet storyboard  put every frame into one sheet OUT/storyboard.jpg (layout-first storyboard)

A whole-beat strip whose first frame is mostly one flat colour (a beat that swipes or fades its first shot in) takes that
frame at 0.2 s instead, labelled so, when its step is 0.2 s or more.
Without --sheet each beat gets OUT/strip_<beat>.jpg (onion skins OUT/onion_<beat>.jpg). Frames are labelled "beat t" and shown at 1/3 size, four
a row. Firefox by default: it is the slowest common browser and the one to judge by. --url is where the book is served;
--query adds to the page's query (tags: the source and AI tags an upright film's export shows).
"""
import argparse, asyncio, re, sys, tempfile
from pathlib import Path
from playwright.async_api import async_playwright
from browsers import answers, exe
from PIL import Image, ImageDraw

def sheet(ims, path, cols=4):
    cols = min(cols, len(ims)); W, H = ims[0].size
    S = Image.new("RGB", (W * cols, H * ((len(ims) + cols - 1) // cols)), (20, 30, 27))
    for k, im in enumerate(ims): S.paste(im, ((k % cols) * W, (k // cols) * H))
    S.save(path, quality=84)

CAMERA_OFF = r"""() => {   // paperCam: a set layer is image > layer g > world > view; base view = no transforms
  for (const im of scene.querySelectorAll('image[href*="img/sets/"]')) {
    const layer = im.parentNode, view = layer.parentNode.parentNode;
    layer.removeAttribute('transform'); view.removeAttribute('transform');
  }
}"""

def mean_diff(a, b):
    import numpy as np
    return float(np.abs(np.asarray(a.convert("L"), dtype=np.float32) - np.asarray(b.convert("L"), dtype=np.float32)).mean())

def blank(im):
    """Mostly one flat colour: 85 % of the pixels within 6 grey levels of the median (a clip's edge may peek in)."""
    import numpy as np
    g = np.asarray(im.convert("L"), dtype=np.float32)
    return float((np.abs(g - np.median(g)) <= 6).mean()) >= .85

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
    answers(f"{a.url}{a.chapter}/")
    async with async_playwright() as p:
        b = await (p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0}) if a.browser == "firefox" else p.chromium.launch(**exe()))
        pg = await b.new_page(viewport={"width": 1600, "height": 960}, reduced_motion="reduce")   # no wall-clock CSS motion
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(f"{a.url}{a.chapter}/?{a.query + '&' if a.query else ''}beat=0&t=0"); await pg.wait_for_timeout(800)
        sw, sh = await pg.evaluate("[SW, SH]")   # the stage at scale 1, 1600 x 900 or 900 x 1600 upright
        await pg.set_viewport_size({"width": sw + 40, "height": sh + 100})
        at = {"i": -1, "t": 0.0}
        cam = {"off": False}
        async def shot(t, scale):
            if t < at["t"]:   # tweens that have finished stay finished: going back needs the beat rebuilt
                await pg.evaluate(f"seek({at['i']}, false)")
            at["t"] = t
            await pg.evaluate(f"P.t = {t}; evalTo({t})")
            if cam["off"]: await pg.evaluate(CAMERA_OFF)
            await pg.wait_for_timeout(60)
            r = await pg.evaluate("(() => { const r = document.getElementById('stage').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()")
            await pg.screenshot(path=str(tmp), clip={"x": r[0], "y": r[1], "width": r[2], "height": r[3]})
            im = Image.open(tmp).convert("RGB")
            return im.resize((im.width // scale, im.height // scale))
        allims = []
        for spec in a.specs:
            m = re.fullmatch(r"(.+?)((?:@[woc])*)", spec); spec, flags = m[1], m[2]
            webp, onion, cam["off"] = "@w" in flags, "@o" in flags, "@c" in flags
            m = re.fullmatch(r"([^:/]+)(?::([^/]+))?(?:/([\d.]+))?", spec)
            if not m or (m[2] and m[3] and ".." not in m[2]): sys.exit(f"bad spec {spec!r}")
            bid, moments, step = m.groups()
            i = await pg.evaluate(f"BEATS.findIndex(b => b.id === '{bid}')")
            if i < 0: sys.exit(f"no beat {bid!r}")
            tm = await pg.evaluate(f"TIMINGS['{bid}']")
            await pg.evaluate(f"seek({i}, false)"); await pg.wait_for_timeout(300); at.update(i=i, t=0.0)
            dur, pre = await pg.evaluate("[P.end, BEATS[P.i].pre || 0]")   # the whole beat; marks start after `pre`
            def when(x):
                mk = re.fullmatch(r"([A-Za-z_][\w.]*?)([+-][\d.]+)?", x)
                if x in ("mid", "end"): return dur / 2 if x == "mid" else dur - .05
                if mk and mk[1] in tm.get("marks", {}): return pre + tm["marks"][mk[1]] + float(mk[2] or 0)
                if mk: sys.exit(f"no mark {mk[1]!r} in {bid}")
                return float(x)
            st = float(step or 1)
            t0, t1 = (when(x) for x in moments.split("..")) if moments and ".." in moments else (0, dur)
            ts = ([when(x) for x in moments.split(",")] if moments and ".." not in moments
                  else [t0 + k * st for k in range(int((t1 - t0) / st + 1e-6) + 1)])
            ims, raw = [], []
            for k, t in enumerate(ts):
                im = await shot(t, 3)
                if k == 0 and not moments and st >= .2 and blank(im):   # empty until the first shot swipes or fades in
                    t = ts[0] = .2; im = await shot(t, 3)
                raw.append(im.copy())
                ImageDraw.Draw(im).text((6, 4), f"{bid} t={t:.2f}", fill=(255, 230, 120)); ims.append(im)
            if onion:
                cuts = [f"{ts[k]:.2f}" for k in range(1, len(raw)) if mean_diff(raw[k - 1], raw[k]) > 30]
                if cuts: print(f"  {bid}: the picture jumps at t={', '.join(cuts)} (a cut or a pan?): the onion skin blends "
                               "shots; give it the range of one shot, or @c for a pan")
                skin = onion_skin([await shot(t, 2) for t in ts] if len(ts) > 1 else raw)
                ImageDraw.Draw(skin).text((8, 6), f"{bid} onion t={ts[0]:.2f}..{ts[-1]:.2f}, {len(ts)} frames{', camera off' if cam['off'] else ''}", fill=(255, 230, 120))
                skin.save(out / f"onion_{bid}.jpg", quality=86)
            if a.sheet: allims += ims
            else: sheet(ims, out / f"strip_{bid}.jpg")
            if webp:
                fr, t = [], t0
                while t <= t1 + 1e-6:
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
    ap.add_argument("--query", default="", help="extra page query, e.g. tags")
    a = ap.parse_args(); a.url = a.url.rstrip("/") + "/"
    sys.exit(asyncio.run(main(a)))
