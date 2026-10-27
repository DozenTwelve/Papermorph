#!/usr/bin/env python3
"""Page errors, console messages and beat lengths of chapters in several browsers: the check before a review.

    uv run --with playwright python check.py ch03 [ch04 ...] --url http://localhost:8765/<book>/ [--browsers chromium,firefox]

In each browser every beat is opened (?beat=N) and drawn at its middle and its last frame, so errors from building a
beat and from its frame functions both show, each with the beat it came from. Prints the page errors (any makes the
exit status 1), the console errors, and the console warnings apart, those known to be harmless marked: Chromium's "GPU
stall due to ReadPixels" (preserveDrawingBuffer, which the export needs) and three.js's shader-info warning in Firefox.

Then, from the first browser, each beat's voice length (pre + its clip) against its real length (P.end). A beat runs to
its last tween plus HOLD (0.6 s), so a tween or a clockRun past D lengthens it silently: the overrun past voice + HOLD
is printed, and marked when over 1 s (a helper without the beat's D: clockRun(f, 0, { tail: true }) runs to the end
and never lengthens it). Mirrored beats meant to run alike show here too. A silent beat ({ dur: s }, no clip) counts
its dur as its voice and is labelled so.
"""
import argparse, asyncio, re, sys
from playwright.async_api import async_playwright
from browsers import answers, exe

HARMLESS = re.compile(r"GPU stall due to ReadPixels|THREE\.WebGLProgram|WEBGL_debug_renderer_info is deprecated")
HOLD = .6


async def chapter(pg, cur, url):
    """[(beat id, voice length, real length)]; page errors and console messages land in cur."""
    cur.update(beat="(load)", errs=[], cons=[])
    await pg.goto(f"{url}?beat=0&t=0"); await pg.wait_for_timeout(500)
    try:
        ids = await pg.evaluate("BEATS.map(b => b.id)")
    except Exception as e:
        cur["errs"].append(("(load)", f"the page did not load: {str(e).splitlines()[0]}")); return []
    rows = []
    for i, bid in enumerate(ids):
        cur["beat"] = bid
        await pg.goto(f"{url}?beat={i}&t=0"); await pg.wait_for_timeout(300)
        try:
            end, pre, dur, quiet = await pg.evaluate("[P.end, BEATS[P.i].pre || 0, TIMINGS[BEATS[P.i].id].dur, !!TIMINGS[BEATS[P.i].id].silent]")
        except Exception as e:
            cur["errs"].append((bid, str(e).splitlines()[0])); continue
        for t in (end / 2, end - .05):
            try:
                await pg.evaluate(f"P.t = {t}; evalTo({t})")
            except Exception as e:
                cur["errs"].append((f"{bid} t={t:.2f}", str(e).splitlines()[0]))
        rows.append((bid + (" (silent)" if quiet else ""), pre + dur, end))
    return rows


def summary(items):
    """Each distinct message once: count and the first beat it came from."""
    out = {}
    for beat, msg in items:
        n, first = out.get(msg, (0, beat)); out[msg] = (n + 1, first)
    return [f"{msg[:300]}  ({'x%d, ' % n if n > 1 else ''}first in {first})" for msg, (n, first) in out.items()]


async def main(a):
    bad, lengths = 0, {}
    async with async_playwright() as p:
        for name in a.browsers.split(","):
            b = await (p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0}) if name == "firefox"
                       else p.chromium.launch(**exe()) if name == "chromium" else p.webkit.launch())
            pg = await b.new_page(viewport={"width": 1600, "height": 960}, reduced_motion="reduce")
            pg.set_default_timeout(120000)   # a loaded machine renders slowly; it is not an error
            cur = {}
            pg.on("pageerror", lambda e: cur["errs"].append((cur["beat"], str(e))))
            pg.on("console", lambda m: m.type in ("error", "warning") and not m.location.get("url", "").endswith("/favicon.ico")
                  and cur["cons"].append((m.type, cur["beat"], m.text)))
            for ch in a.chapters:
                url = f"{a.url}{ch}/"
                answers(url)
                rows = await chapter(pg, cur, url)
                lengths.setdefault(ch, rows)
                errs = summary(cur["errs"])
                cerr = summary((bt, t) for k, bt, t in cur["cons"] if k == "error")
                warn = summary((bt, t) for k, bt, t in cur["cons"] if k == "warning")
                print(f"== {name} {ch}: {len(errs)} page errors, {len(cerr)} console errors, {len(warn)} console warnings")
                for e in errs: print("  page error   ", e)
                for e in cerr: print("  console error", e)
                for w in warn: print("  warning      ", ("[harmless] " if HARMLESS.search(w) else "") + w)
                bad += len(errs)
            await b.close()
    for ch, rows in lengths.items():
        if not rows: continue
        print(f"== {ch} beat lengths: voice (pre + clip) and real (P.end), overrun past voice + {HOLD} s hold")
        for bid, voice, end in rows:
            over = end - voice - HOLD
            print(f"  {bid:14s} voice {voice:6.2f}  real {end:6.2f}  {over:+6.2f}" + ("  <- lengthened: a tween or clockRun past D" if over > 1 else ""))
        print(f"  film {sum(e for _, _, e in rows):.2f} s")
    return 1 if bad else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chapters", nargs="+", help="chapter folders under --url, e.g. ch03")
    ap.add_argument("--url", default="http://localhost:8765/", help="the book, served")
    ap.add_argument("--browsers", default="chromium,firefox", help="comma-separated: chromium, firefox, webkit")
    a = ap.parse_args(); a.url = a.url.rstrip("/") + "/"
    sys.exit(asyncio.run(main(a)))
