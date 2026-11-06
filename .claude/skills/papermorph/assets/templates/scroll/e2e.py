"""A scroll page's checks, in Chromium and Firefox, on a desktop window and a 390 px phone: page errors, console
errors and missing files; that scrolling down passes every step in order and scrolling back up draws the same P at
the same place (the picture is a function of the scroll alone); that reduced motion shows each step's finished
picture; cards too tall for the band they stick in; render times. With --out, a screenshot of every step's middle
and end at both sizes (from the first browser): open them, they are the only way to see the pictures.

    python3 SKILL/scripts/serve.py 8765 site &
    uv run --with playwright python3 tools/BOOK/e2e_scroll.py http://localhost:8765/BOOK/ [--out books/BOOK/review/scroll]
    ... --browsers firefox          # one browser; CHROME=/path/to/chrome for an installed Chromium

The engine's tools (check.py, shot.py, strip.py, still.py, perf.py, export.py, lint.py) read a chapter's BEATS and
do not work on a scroll page; this file is its check. Exit status 1 on any error.
"""
import argparse, asyncio, os, sys, urllib.request
from pathlib import Path
from playwright.async_api import async_playwright

ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
ap.add_argument('url', help='the page, e.g. http://localhost:8765/BOOK/')
ap.add_argument('--out', help='a folder for the step screenshots')
ap.add_argument('--browsers', default='chromium,firefox')
a = ap.parse_args()
SIZES = {'desktop': (1280, 800), 'phone': (390, 844)}
WAIT = "() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"   # the next frame is drawn
P = "() => +document.documentElement.dataset.p"
problems = []


def bad(msg):
    problems.append(msg)
    print('  ERROR', msg)


async def walk(pg, where):
    n = await pg.evaluate("() => scrollySteps().length")
    total = await pg.evaluate("() => document.documentElement.scrollHeight - innerHeight")
    step = max(40, (await pg.evaluate("() => innerHeight")) // 5)
    ys = list(range(0, total + 1, step)) + [total]
    down = []
    for y in ys:
        await pg.evaluate(f"() => scrollTo(0, {y})"); await pg.evaluate(WAIT)
        down.append(await pg.evaluate(P))
    if any(b < x - 1e-4 for x, b in zip(down, down[1:])):
        bad(f'{where}: P goes back while scrolling down: {[round(p, 2) for p in down]}')
    if skipped := sorted(set(range(n)) - {int(p) for p in down}):
        bad(f'{where}: no scroll position landed inside step(s) {[k + 1 for k in skipped]} ({step} px apart): a step too short, or never reached')
    if down[-1] < n - .05:
        bad(f'{where}: the page ends at P {down[-1]:.2f}, before the last step finishes ({n}): give the steps room below (.steps padding)')
    for y, p in zip(reversed(ys), reversed(down)):
        await pg.evaluate(f"() => scrollTo(0, {y})"); await pg.evaluate(WAIT)
        q = await pg.evaluate(P)
        if abs(q - p) > 1e-3:
            bad(f'{where}: at scrollY {y} P was {p:.4f} going down and {q:.4f} going back up'); break
    # a card taller than the room under the line it sticks to shows its last lines only as its step leaves
    tall = await pg.evaluate("""() => { const t = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--trig')) * innerHeight;
      return [...document.querySelectorAll('.step .card')].map((c, i) => [i + 1, Math.round(c.offsetHeight), Math.round(innerHeight - t)]).filter(([, h, room]) => h > room); }""")
    for i, h, room in tall:
        bad(f'{where}: step {i}\'s card is {h} px, the room under the trigger line {room} px: shorten it or split the step')
    st = await pg.evaluate("() => scrollyStats()")
    print(f'  {where}: {len(down)} scroll positions, P 0 to {down[-1]:.2f} over {n} steps; render ms median {st["median"]:.1f}, '
          f'p95 {st["p95"]:.1f}, max {st["max"]:.1f}' + ('  (over 16 ms: a phone will drop frames)' if st['p95'] > 16 else ''))
    return n


async def shots(pg, where, n, out):
    for i in range(n):
        for f, tag in ((.5, 'mid'), (.98, 'end')):
            await pg.evaluate(f"""() => {{ const s = document.querySelectorAll('.step'), t = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--trig')) * innerHeight,
              a = s[{i}].getBoundingClientRect().top + scrollY, b = {i} + 1 < s.length ? s[{i} + 1].getBoundingClientRect().top + scrollY : a + s[{i}].offsetHeight;
              scrollTo(0, a + (b - a) * {f} - t); }}""")
            await pg.evaluate(WAIT); await pg.wait_for_timeout(150)
            await pg.screenshot(path=str(out / f'{where}_step{i + 1:02d}_{tag}.png'))
    print(f'  {n * 2} screenshots in {out}/{where}_step*.png')


async def main():
    try:   # a wrong port or path would otherwise show up later as an unrelated error
        urllib.request.urlopen(a.url, timeout=10).close()
    except OSError as e:
        sys.exit(f'{a.url} does not answer ({e}): start the preview with serve.py PORT site, from the folder that holds site/')
    out = Path(a.out) if a.out else None
    if out:
        out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        for bi, name in enumerate(a.browsers.split(',')):
            kw = {'executable_path': os.environ['CHROME']} if name == 'chromium' and os.environ.get('CHROME') else {}
            b = await getattr(p, name).launch(**kw)
            for size, (w, h) in SIZES.items():
                for motion in ('no-preference', 'reduce'):
                    where = f'{name} {size}' + (' reduced motion' if motion == 'reduce' else '')
                    ctx = await b.new_context(viewport={'width': w, 'height': h}, reduced_motion=motion, device_scale_factor=2 if size == 'phone' else 1)
                    pg = await ctx.new_page()
                    pg.on('pageerror', lambda e, where=where: bad(f'{where}: page error: {e}'))
                    pg.on('console', lambda m, where=where: m.type == 'error' and 'Failed to load resource' not in m.text and bad(f'{where}: console: {m.text}'))
                    pg.on('response', lambda r, where=where: r.status >= 400 and not r.url.endswith('favicon.ico') and bad(f'{where}: missing file ({r.status}): {r.url}'))
                    await pg.goto(a.url, wait_until='load')
                    await pg.evaluate("() => document.fonts.ready"); await pg.evaluate(WAIT)
                    if not await pg.evaluate("() => typeof scrollySteps === 'function'"):
                        sys.exit(f'{a.url} is not a scroll page: lib/scroll.js did not load, or the page is not the kit\'s')
                    if motion == 'reduce':   # each step shows its finished picture: P is whole numbers only
                        ps = []
                        for i in range(await pg.evaluate("() => scrollySteps().length")):
                            await pg.evaluate(f"() => document.querySelectorAll('.step')[{i}].scrollIntoView()")
                            await pg.evaluate(f"() => scrollBy(0, innerHeight / 4)"); await pg.evaluate(WAIT)
                            ps.append(await pg.evaluate(P))
                        if any(abs(q - round(q)) > 1e-4 for q in ps):
                            bad(f'{where}: P {ps}: reduced motion should hold each step at its finished picture')
                        print(f'  {where}: P at each step {ps}')
                    else:
                        n = await walk(pg, where)
                        if out and bi == 0:
                            await shots(pg, size, n, out)
                    await ctx.close()
            await b.close()
    print(f'{len(problems)} problems' if problems else 'ok')
    sys.exit(1 if problems else 0)


asyncio.run(main())
