#!/usr/bin/env python3
"""The checks for an explorable map (the explore kit), which check.py, shot.py and perf.py cannot run: these pages have
no beats and run on their own clock, so there is no ?beat=N&t=T to seek to. This drives the page by its window.MAP.

    uv run --with playwright python explore.py check http://localhost:8765/<book>/ [--browsers chromium,firefox]
    uv run --with playwright python explore.py shots http://localhost:8765/<book>/ --out books/<book>/review/shots [--size 1512x982]
    uv run --with playwright python explore.py perf  http://localhost:8765/<book>/ [--out books/<book>/review/perf.txt]
    uv run --with playwright python explore.py narration http://localhost:8765/<book>/ content/<book>/narration.en.json

check   in each browser: page errors, missing files (404), console errors and warnings (the kit's own checks print
        there: a place a route names that PLACES lacks, a state an event names that STATES lacks, a region to glow the
        map file lacks); then every year's film, each card clicked on as a reader would (?speed=8 for the waits and
        walks; a clip still plays to its end), every person's card and every ringed place's card opened with a real
        click: whether its clip plays, or the card has no clip (Listen hidden, the film holds a reading time).
        Exit status 1 on any page error or missing file.
shots   a screenshot of the start, every event card as it shows, and every year's end (the whole map, the people
        standing), plus each place card: OUT/<year>_<n>.png. Look at them for labels under cards, a figure in the sea,
        a camera that lands beside its event.
perf    Firefox frame times (requestAnimationFrame) while the camera moves: home to each event's close-up and back,
        and one year's walks with the follow shot. Prints the median, p95 and max frame time and the frames over 50 ms;
        the bar is a median under 20 ms. The machine counts as much as the page: run it when nothing else is busy.
narration  writes the card texts (events '<year>-e<n>', people '<year>-<person>', places 'place-<key>') into the
        narration file's beats, keeping its other keys (engine, voice, rate), so tts.py or eleven.py voices exactly
        what the cards say; rerun after changing a text, then the voice step remakes only the changed clips.
"""
import argparse, asyncio, json, statistics, sys
from pathlib import Path
from playwright.async_api import async_playwright
from browsers import LOAD_FAILED, answers, exe, firefox, missing
from perf import load

READY = "() => window.MAP && document.body.classList.contains('ready')"
STATE = """() => ({ film: !!MAP.film, walking: MAP.walking, year: MAP.year,
  card: (e => e && !e.hidden ? e.querySelector('h2').textContent : null)(document.querySelector('#event')) })"""
VOICE = "() => { const v = document.querySelector('#voice'); return { src: v.currentSrc || v.getAttribute('src') || '', paused: v.paused, err: v.error && v.error.code }; }"


async def open_page(b, url, cur, size=(1512, 982)):
    pg = await b.new_page(viewport={"width": size[0], "height": size[1]})
    pg.on("pageerror", lambda e: cur["errs"].append(str(e).splitlines()[0]))
    pg.on("console", lambda m: m.type in ("error", "warning", "info") and LOAD_FAILED not in m.text
          and cur["cons"].append(f"{m.type}: {m.text}"))
    missing(pg, cur["miss"].append)
    await pg.goto(url)
    try:
        await pg.wait_for_function(READY, timeout=15000)
    except Exception:
        cur["errs"].append("the page did not become ready (no window.MAP, or body.ready never set): is it an explore-kit page?")
        return pg, False
    return pg, True


async def play_year(pg, on_card=None, step=0.4):
    """Run the film now playing to its end, clicking on each card once it is up (as a reader would)."""
    seen = []
    for _ in range(int(240 / .1)):
        s = await pg.evaluate(STATE)
        if not s["film"]:
            return seen
        if s["card"] and (not seen or seen[-1] != s["card"]):
            seen.append(s["card"])
            await pg.wait_for_timeout(step * 1000)
            if on_card:
                await on_card(len(seen), s["card"])
            await pg.evaluate("() => MAP.next()")
        await pg.wait_for_timeout(100)
    raise RuntimeError(f"the film of {s['year']} did not end in 240 s")


async def clip_of(pg, id_, voiced):
    await pg.wait_for_timeout(600)
    v = await pg.evaluate(VOICE)
    if id_ not in voiced:
        return f"{id_}: no clip (Listen hidden)"
    ok = v["src"].endswith(f"/{id_}.mp3") and not v["paused"] and not v["err"]
    return f"{id_}: {'plays' if ok else 'DOES NOT PLAY'} ({v['src'].rsplit('/', 1)[-1] or 'no src'}, paused={v['paused']}, error={v['err']})"


async def check(a):
    bad = 0
    async with async_playwright() as p:
        for name in a.browsers.split(","):
            b = await (p.firefox.launch(**firefox()) if name == "firefox" else p.chromium.launch(**exe()))
            cur = {"errs": [], "cons": [], "miss": []}
            pg, ok = await open_page(b, a.url + "?speed=8", cur)
            lines = []
            if ok:
                first, last, voiced = await pg.evaluate("[MAP.first, MAP.last, MAP.voiced]")
                await pg.click("#begin")
                cards = await play_year(pg)
                lines.append(f"{first}: {len(cards)} cards")
                for y in range(first + 1, last + 1):
                    await pg.evaluate("() => MAP.go(1)")
                    cards = await play_year(pg)
                    lines.append(f"{y}: {len(cards)} cards")
                await pg.evaluate("() => MAP.go(-1)"); await pg.wait_for_timeout(3000)   # back a year: the walk back
                await pg.evaluate("() => MAP.go(1)"); await pg.wait_for_timeout(500)
                await pg.keyboard.press("Escape"); await pg.wait_for_function("() => !MAP.film", timeout=20000)
                people = await pg.evaluate("Object.keys(PEOPLE)")
                for w in people:
                    await pg.evaluate("() => document.querySelectorAll('.card .close').forEach(c => !c.closest('[hidden]') && c.click())")
                    await pg.click(f"#people button:nth-child({people.index(w) + 1})")
                    lines.append("person " + await clip_of(pg, f"{last}-{w}", voiced))
                for key in await pg.evaluate("MAP.spots()"):
                    await pg.evaluate("() => document.querySelectorAll('.card .close').forEach(c => !c.closest('[hidden]') && c.click())")
                    await pg.wait_for_timeout(300)
                    await pg.click(f"#spots .spot[data-key='{key}']")
                    lines.append("place " + await clip_of(pg, f"place-{key}", voiced))
            await b.close()
            print(f"== {name}: {len(cur['errs'])} page errors, {len(cur['miss'])} missing files, {len(cur['cons'])} console messages")
            for e in cur["errs"]: print("  PAGE ERROR", e)
            for m in sorted(set(cur["miss"])): print("  " + m)
            for m in cur["cons"]: print("  " + m)
            for l in lines: print("  " + l)
            bad += len(cur["errs"]) + len(cur["miss"]) + sum("DOES NOT PLAY" in l for l in lines)
    sys.exit(1 if bad else 0)


async def shots(a):
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    w, h = (int(v) for v in a.size.split("x"))
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe())
        cur = {"errs": [], "cons": [], "miss": []}
        pg, ok = await open_page(b, a.url + "?speed=8", cur, (w, h))
        if not ok:
            sys.exit("; ".join(cur["errs"]))
        await pg.screenshot(path=out / "start.png")
        first, last = await pg.evaluate("[MAP.first, MAP.last]")
        await pg.click("#begin")
        for y in range(first, last + 1):
            if y > first:
                await pg.evaluate("() => MAP.go(1)")

            async def snap(n, title, y=y):
                await pg.wait_for_timeout(700)   # the camera has landed, the card slid in
                await pg.screenshot(path=out / f"{y}_{n}.png")
            await play_year(pg, snap, step=.9)
            await pg.wait_for_timeout(1500)
            await pg.screenshot(path=out / f"{y}_end.png")
        for key in await pg.evaluate("MAP.spots()"):
            await pg.evaluate(f"() => {{ document.querySelectorAll('.card .close').forEach(c => !c.closest('[hidden]') && c.click()); MAP.openPlace({key!r}); }}")
            await pg.wait_for_timeout(500)
            await pg.screenshot(path=out / f"place-{key}.png")
        await b.close()
    for e in cur["errs"] + sorted(set(cur["miss"])): print("  ", e)
    print(f"shots in {out}/: start.png, <year>_<n>.png (each event card), <year>_end.png, place-<key>.png")


FRAMES = """async ms => { const d = []; let last = performance.now(), on = true;
  const loop = now => { d.push(now - last); last = now; if (on) requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  await new Promise(r => setTimeout(r, ms)); on = false; return d.slice(2); }"""


async def perf(a):
    async with async_playwright() as p:
        b = await p.firefox.launch(**firefox())
        cur = {"errs": [], "cons": [], "miss": []}
        pg, ok = await open_page(b, a.url, cur)
        if not ok:
            sys.exit("; ".join(cur["errs"]))
        await pg.evaluate("() => MAP.begin()")
        await pg.evaluate("() => { document.querySelector('#voice').muted = true; }")
        spots = await pg.evaluate("Object.values(EVENTS).flat().map(e => [e.at[1], e.at[2]])")
        rows, alld = [], []
        for lon, lat in spots[: a.moves]:
            js = f"""async () => {{ const t = FRAMES_PROMISE(3000); await MAP.cam(MAP.viewFor([MAP.xy({lon}, {lat})], 'left', 430), 1300);
                    await MAP.cam(MAP.home(), 1300); return t; }}"""
            d = await pg.evaluate(js.replace("FRAMES_PROMISE", f"({FRAMES})"))
            rows.append((f"camera to {lon:.2f},{lat:.2f} and back", d)); alld += d
        await pg.evaluate("() => MAP.replay()")   # the first year's film: its events and walks, camera and all, at speed 1
        d = await pg.evaluate(f"({FRAMES})(12000)")
        rows.append(("the first year's film, 12 s", d)); alld += d
        await b.close()
    lines = [load()]
    for k, d in rows + [("all", alld)]:
        d = sorted(d); n = len(d)
        lines.append(f"{k:40s} median {statistics.median(d):5.1f}  p95 {d[int(n * .95)]:5.1f}  max {d[-1]:6.1f}  >50ms {sum(x > 50 for x in d)}  ({n} frames)")
    verdict = "under" if statistics.median(alld) < 20 else "OVER"
    lines.append(f"median {statistics.median(alld):.1f} ms: {verdict} the 20 ms bar")
    for e in cur["errs"]: lines.append("PAGE ERROR " + e)
    print("\n".join(lines))
    if a.out:
        Path(a.out).write_text(f"Firefox (Playwright), 1512x982, {a.url}\n" + "\n".join(lines) + "\n")


async def narration(a):
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe())
        cur = {"errs": [], "cons": [], "miss": []}
        pg, ok = await open_page(b, a.url, cur)
        if not ok:
            sys.exit("; ".join(cur["errs"]))
        beats = await pg.evaluate("""() => { const o = {};
          for (const [y, evs] of Object.entries(EVENTS)) evs.forEach((e, i) => { o[`${y}-e${i + 1}`] = e.text; });
          for (const [y, cards] of Object.entries(YEARS)) for (const [w, c] of Object.entries(cards)) o[`${y}-${w}`] = c.text;
          for (const [k, c] of Object.entries(typeof PLACE_CARDS !== 'undefined' ? PLACE_CARDS : {})) o[`place-${k}`] = c.text;
          return o; }""")
        await b.close()
    f = Path(a.file)
    doc = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {"engine": "edge", "voice": "en-GB-RyanNeural", "rate": "-4%"}
    old = doc.get("beats", {})
    doc["beats"] = beats
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    changed = [k for k in beats if old.get(k) != beats[k]]
    gone = [k for k in old if k not in beats]
    print(f"{f}: {len(beats)} clips, {len(changed)} new or changed" + (f"; dropped {', '.join(gone)}" if gone else ""))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("what", choices=["check", "shots", "perf", "narration"])
    ap.add_argument("url", help="the page, e.g. http://localhost:8765/<book>/")
    ap.add_argument("file", nargs="?", help="narration: the narration.<lang>.json to write")
    ap.add_argument("--browsers", default="chromium,firefox")
    ap.add_argument("--out", help="shots: the folder (required); perf: a file for the numbers")
    ap.add_argument("--size", default="1512x982", help="shots: the window, e.g. 390x844 for an upright phone")
    ap.add_argument("--moves", type=int, default=6, help="perf: how many event close-ups to time (default 6)")
    a = ap.parse_args()
    a.url = a.url.split("?")[0].rstrip("/") + "/"
    if a.what == "shots" and not a.out:
        sys.exit("shots: --out is required (give each review its own folder)")
    if a.what == "narration" and not a.file:
        sys.exit("narration: name the narration file, e.g. content/<book>/narration.en.json")
    answers(a.url)
    asyncio.run({"check": check, "shots": shots, "perf": perf, "narration": narration}[a.what](a))


if __name__ == "__main__":
    main()
