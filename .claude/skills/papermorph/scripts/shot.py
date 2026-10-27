#!/usr/bin/env python3
"""Screenshot beats of a chapter for review, plus contact sheets of four shots each; cut sheets and clean stills.

    uv run --with playwright --with pillow shot.py ch07 --out OUT                      # every beat at 1.2 s (open) and its end
    uv run --with playwright --with pillow shot.py ch07 --out OUT --moments mid        # add the middle of every beat
    uv run --with playwright --with pillow shot.py ch07 --out OUT 3:end 5:4.5 scene2:mid  # chosen moments
    uv run --with playwright --with pillow shot.py ch01 --out OUT --cuts               # cut sheet of a picture book
    uv run --with playwright --with pillow shot.py ch01 --out OUT --cuts scene3        # only the cuts into and out of scene3
    uv run --with playwright --with pillow shot.py ch01 --out books/<book>/review/stills 2:9 --webp 1400 --name still-ch01   # copy the .webp to site/<book>/img/
    ... --url http://localhost:8765/<book>/ [--query tags]

A moment is BEAT:TIME. BEAT is the beat's index in BEATS counted from 0 (the player shows BEAT+1) or its id;
TIME is seconds on the beat clock, open (1.2 s), mid (half the beat) or end (the beat's last frame, P.end - 0.05:
the picture the next beat cuts from). Writes OUT/chNN_bII_T.png and OUT/chNN_sheet_T_K.png (2x2, half size; open
the sheets first). --out is required: give each review its own folder (books/<book>/review/...).

  --clean     the stage alone: no player bar, captions, cards or notes, cropped to the stage (1600x900, or 900x1600
              for a book with <html data-stage="portrait">)
  --cuts [BEAT ...]  a cut sheet, OUT/chNN_cuts.jpg: for every beat boundary, the last frame of the beat beside the
              first frame of the next (clean), one boundary a row; with beats, only the boundaries into and out of
              them (OUT/chNN_cuts_BEAT.jpg). Look for jumps in place, pose, light and screen direction
  --webp W    also write each shot as a W-wide WebP of the stage's shape (implies --clean): a series-page still or a cover
              (stories.md: 1400 wide); --name NAME names it OUT/NAME.webp (one moment only)

--query adds to the page's query (tags: the source and AI tags an upright film's export shows). Uses ?beat=N&t=0,
then sets the beat clock to the moment, as playback would reach it. The page runs with reduced
motion, which stops the CSS-only motion that runs on the wall clock (page cross-fades, cards sliding in, the mascot):
a shot is the same picture however busy the machine is, so several runs at once (parallel scene workers) are safe.
"""
import argparse, asyncio, io
import sys
from pathlib import Path
from playwright.async_api import async_playwright
from browsers import answers, exe
from PIL import Image, ImageDraw

CLEAN = """#bar, #caption, #ui, #soundNote, #help, #cover, .paused-mark { display: none !important; }
#frame { border-radius: 0 !important; box-shadow: none !important; }"""


async def main(a):
    a.out.mkdir(parents=True, exist_ok=True)
    answers(f"{a.url}{a.chapter}/index.html")
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe())
        pg = await b.new_page(viewport={"width": 1600, "height": 960}, reduced_motion="reduce")
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        # a desktop browser ($CHROME) also asks the server for /favicon.ico, which is not the book's
        pg.on("console", lambda m: m.type == "error" and not m.location.get("url", "").endswith("/favicon.ico") and errs.append(m.text))
        base = f"{a.url}{a.chapter}/index.html?{a.query + '&' if a.query else ''}"
        await pg.goto(base + "beat=0&t=0"); await pg.wait_for_timeout(500)
        if errs:
            print("page errors:", errs); await b.close(); return 1
        ids = await pg.evaluate("BEATS.map(b => b.id)")
        SW, SH = await pg.evaluate("[SW, SH]")   # 1600 x 900, or 900 x 1600 upright
        await pg.set_viewport_size({"width": SW + 40, "height": SH + 100})   # the page then draws the stage at scale 1

        async def grab(i, t, clean):
            """The picture of beat i at t (seconds, open, mid, end) as an RGB image, and the time used."""
            await pg.goto(f"{base}beat={i}&t=0"); await pg.wait_for_timeout(300)
            end = await pg.evaluate("P.end")
            sec = {"open": 1.2, "end": end - .05, "mid": end / 2}.get(t)
            sec = float(t) if sec is None else sec
            await pg.evaluate(f"P.t = {sec}; evalTo({sec})")
            if clean: await pg.add_style_tag(content=CLEAN)
            await pg.wait_for_timeout(450)
            clip = await pg.evaluate("(() => { const r = document.getElementById('stage').getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; })()") if clean else None
            im = Image.open(io.BytesIO(await pg.screenshot(clip=clip))).convert("RGB")
            return (im.resize((SW, SH), Image.LANCZOS) if clean else im), sec   # stage pixels = stage coordinates

        def beat(s):
            if s.isdigit() and int(s) < len(ids): return int(s)
            if s in ids: return ids.index(s)
            sys.exit(f"no beat {s!r}: give an index from 0 to {len(ids) - 1} or one of {', '.join(ids)}")

        groups, clean = {}, a.clean or bool(a.webp)
        specs = a.specs or ([] if a.cuts is not None else [f"{i}:{t}" for t in ("open", "end", *a.moments) for i in range(len(ids))])
        if a.name and not a.webp: sys.exit("--name names the --webp still: give --webp too")
        if a.name and len(specs) != 1: sys.exit("--name names one moment: give exactly one BEAT:TIME")
        for s in specs:
            i, t = s.rsplit(":", 1); i = beat(i)
            im, _ = await grab(i, t, clean)
            f = a.out / f"{a.chapter}_b{i:02d}_{t}.png"
            im.save(f)
            groups.setdefault(t, []).append(f)
            if a.webp:
                w = a.out / f"{a.name or f.stem}.webp"
                im.resize((a.webp, round(a.webp * SH / SW)), Image.LANCZOS).save(w, quality=88); print("still", w)
        if a.cuts is not None:
            rows, only, cw, chh = [], {beat(s) for s in a.cuts}, SW // 2, SH // 2   # each frame at half size
            for i in range(len(ids) - 1):
                if only and not only & {i, i + 1}: continue
                (x, tx), (y, ty) = await grab(i, "end", True), await grab(i + 1, "0.05", True)
                pair = Image.new("RGB", (2 * cw + 8, chh), (20, 30, 27))
                for k, (im, label) in enumerate(((x, f"{ids[i]} end t={tx:.2f}"), (y, f"{ids[i + 1]} start t={ty:.2f}"))):
                    pair.paste(im.resize((cw, chh)), (k * (cw + 8), 0)); ImageDraw.Draw(pair).text((k * (cw + 8) + 8, 6), label, fill=(255, 230, 120))
                rows.append(pair)
            if rows:
                S = Image.new("RGB", (2 * cw + 8, (chh + 8) * len(rows)), (20, 30, 27))
                for k, r in enumerate(rows): S.paste(r, (0, k * (chh + 8)))
                f = a.out / f"{a.chapter}_cuts{''.join('_' + ids[i] for i in sorted(only))}.jpg"
                S.save(f, quality=86); print("cut sheet", f)
        # pieces a picture book bakes in the browser: missing from img/puppets/baked.js (key hash = its file name there)
        live = await pg.evaluate("typeof bakedJobs === 'undefined' ? [] : [...bakedJobs.keys()].map(k => { const i = k.indexOf('|'), "
                                 "html = k.slice(i + 1); return [keyHash(k), k.slice(0, i), (html.match(/data-p=\"([^\"]+)\"/) || [])[1] "
                                 "|| html.replace(/\\s+/g, ' ').slice(0, 70)]; })")
        await b.close()
    if live:
        print(f"{len(live)} paper pieces were baked live in the page: run bake_puppets.py. Pieces (hash, box x y w h, data-p or the start of its SVG):")
        for h, box, svg in live: print(f"  {h}  {box:18}  {svg}")
    for t, fs in groups.items():
        if len(fs) < 2: continue
        w, h = (d // 2 for d in Image.open(fs[0]).size)   # half size
        for k in range(0, len(fs), 4):
            sheet = Image.new("RGB", (2 * w, 2 * h), "black")
            for j, f in enumerate(fs[k:k + 4]):
                sheet.paste(Image.open(f).resize((w, h)), ((j % 2) * w, (j // 2) * h))
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
                    help="moments as BEAT:TIME; BEAT is the index in BEATS from 0 (the player shows BEAT+1) or the beat id, "
                         "TIME is seconds, open, mid or end; e.g. 3:end 5:4.5 (default: every beat at open and end)")
    ap.add_argument("--moments", nargs="*", default=[], choices=["mid"], help="extra moments for every beat")
    ap.add_argument("--url", default="http://localhost:8765/")
    ap.add_argument("--out", type=Path, required=True, help="folder for the shots, e.g. books/<book>/review/chNN-shots")
    ap.add_argument("--clean", action="store_true", help="the stage alone, no player UI")
    ap.add_argument("--cuts", nargs="*", metavar="BEAT", help="cut sheet: each beat's last frame beside the next one's first; "
                    "with beats, only the cuts into and out of them")
    ap.add_argument("--webp", type=int, metavar="W", help="also save each shot as a W-wide WebP of the stage's shape (clean)")
    ap.add_argument("--name", help="file name (without .webp) for the one --webp still")
    ap.add_argument("--query", default="", help="extra page query, e.g. tags")
    a = ap.parse_args()
    a.url = a.url if a.url.endswith("/") else a.url + "/"
    sys.exit(asyncio.run(main(a)))
