"""check_ch09.py: the clay picture and the live numbers of chapter 1 agree, at any moment however it is reached.

    python3 .claude/skills/papermorph/scripts/serve.py 8831 site &
    uv run --with playwright site/science/make/check_ch09.py [--url http://localhost:8831/science/ch09/] [--browser firefox]

Measured on the page as drawn (getBoundingClientRect of the clay pictures, stage px), not from the page's own
formulas:
  incar     the truck, the car and the friend move across the screen at the speed their labels say (30 mph is
            150 px a second at zoom 1), before and after the cut to the car's camera; the road plate with them
  roadside  the truck at 30 mph past you
  position  the ball's centre is over 2 m, then 7 m, and the angle shown is the one its rolled distance gives
  wheels    the wheel frame shown is the one the distance driven gives
Each moment is opened two ways: jumped to (as ?beat=N&t=S does) and stepped to at 60 steps a second (as playing
does); both must give the same picture.
"""
import argparse, asyncio, math, re
from playwright.async_api import async_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--url', default='http://localhost:8831/science/ch09/')
ap.add_argument('--browser', default='chromium', choices=['chromium', 'firefox'])
a = ap.parse_args()

# The page's state at beat i, time t: where each clay picture is on the stage, which frame each strip shows, the labels.
STATE = r"""
([i, t, stepped]) => {
  seek(i, false);
  if (stepped) for (let u = 0; u < t; u += 1 / 60) evalTo(u);
  P.t = t; evalTo(t);
  const st = document.getElementById('stage').getBoundingClientRect(), k = 1600 / st.width;
  const name = e => e.getAttribute('href').replace(/.*\/|\.webp$/g, '');
  const box = e => { const r = e.getBoundingClientRect(); return [(r.left - st.left) * k, (r.top - st.top) * k, r.width * k, r.height * k]; };
  // a strip's window: its corner through the transform of the group it sits in (Chromium's rectangle of the window takes in the whole strip)
  const at = v => { const m = v.parentNode.getScreenCTM(), x = +v.getAttribute('x'), y = +v.getAttribute('y');
    return [(m.a * x + m.c * y + m.e - st.left) * k, (m.b * x + m.d * y + m.f - st.top) * k, +v.getAttribute('width') * m.a * k, +v.getAttribute('height') * m.d * k]; };
  const shown = e => { for (let n = e; n && n !== scene; n = n.parentNode) if (n._st && n._st.o < .5) return false; return true; };
  const pics = {}, frames = {};
  for (const e of scene.querySelectorAll('image')) {
    if (!shown(e)) continue;
    const n = name(e), strip = e.parentNode.tagName === 'svg';
    (pics[n] ??= []).push(strip ? at(e.parentNode) : box(e));
    if (strip) (frames[n] ??= []).push(parseFloat(e.parentNode.getAttribute('viewBox')) / CLAY.img[n].w);
  }
  return { pics, frames, labels: [...scene.querySelectorAll('text')].filter(shown).map(e => e.textContent) };
}
"""
V, DT = 150, 0.5        # px a second for 30 mph at zoom 1; the time between the two looks


def mph(label):
    m = re.search(r'(←)?\s*(\d+) mph', label)
    return (-1 if m.group(1) else 1) * int(m.group(2))


async def main():
    async with async_playwright() as p:
        b = await getattr(p, a.browser).launch()
        pg = await b.new_page(viewport={'width': 1600, 'height': 960})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(a.url); await pg.wait_for_timeout(600)
        idx = lambda bid: pg.evaluate(f"BEATS.findIndex(b => b.id === '{bid}')")
        n = 0

        async def state(i, t):
            s, s2 = await pg.evaluate(STATE, [i, t, False]), await pg.evaluate(STATE, [i, t, True])
            assert s == s2, f'beat {i} at {t} s: jumped to and stepped to differ'
            return s

        async def speed(i, t, pic, zoom, wrap=0):   # screen speed of a picture's left edge, as mph
            s0, s1 = await state(i, t), await state(i, t + DT)
            d = (s1['pics'][pic][0][0] - s0['pics'][pic][0][0]) / zoom
            if wrap: d = (d + wrap / 2) % wrap - wrap / 2      # a plate that repeats may have stepped back one period
            return d / DT / V * 30, s0

        # incar: before the cut the camera stands by the road (zoom 1); after it, it rides in the car (zoom 1.15)
        i = await idx('incar')
        r0 = await pg.evaluate("TIMINGS.incar.marks.ride")
        for t, zoom in [(4.0, 1), (6.5, 1), (r0 + .4, 1.15), (12.0, 1.15), (16.0, 1.15), (20.0, 1.15)]:
            for pic, lab in (('truck', 'truck'), ('car', 'your car'), ('friend', 'friend')):
                v, s = await speed(i, t, pic, zoom)
                said = [x for x in s['labels'] if x.startswith(lab + ':')]
                x = s['pics'][pic][0][0] - zoom * await pg.evaluate(f'CLAY.img.{pic}.x')   # its anchor (the feet), on the stage
                if not said and not 0 < x < 1600: continue                # it has left the frame, and its label with it
                assert said, f'incar {t} s: no label for the {pic} among {s["labels"]}'
                said = mph(said[0])
                assert abs(v - said) < 0.05, f'incar {t} s: the {pic} moves at {v:.2f} mph on screen, its label says {said}'
                n += 1
            v, s = await speed(i, t, 'road', zoom, wrap=await pg.evaluate("CLAY.road.W"))
            want = 0 if zoom == 1 else -30
            assert abs(v - want) < 0.05, f'incar {t} s: the road moves at {v:.2f} mph on screen, expected {want}'
            if zoom > 1: assert 'road and trees: ← 30 mph' in s['labels'] or t < await pg.evaluate("TIMINGS.incar.marks.back")
            n += 1
        # wheels: the frame shown is the nearest of the strip's angles to distance / radius (each wheel leads by 7 frames more)
        for t in (5.0, 9.3, 14.7):
            s = await state(i, t)
            x = await pg.evaluate(f"-330 + 150 * Math.max(0, {t} - (TIMINGS.incar.marks.car + .3)) + 330")
            for pic in ('truck', 'car'):
                r, N = await pg.evaluate(f"[CLAY.img.{pic}.r, CLAY.img.{pic}_wheel.n]")
                for w, f in enumerate(s['frames'][pic + '_wheel']):
                    assert round(f) == (round(x / r / (2 * math.pi) * N) + 7 * w) % N, f'incar {t} s: {pic} wheel {w} shows frame {f}'
                    n += 1
        # roadside: the truck passes you at 30 mph
        i = await idx('roadside')
        for t in (7.0, 9.0, 11.0):
            v, s = await speed(i, t, 'truck', 1)
            assert abs(v - 30) < 0.05 and 'truck: 30 mph →' in s['labels'], f'roadside {t} s: truck at {v:.2f} mph'
            n += 1
        # position: the ball over 2 m, then over 7 m (0 m at x = 200, 120 px a metre), turned by the distance rolled
        i = await idx('position')
        roll = await pg.evaluate("TIMINGS.position.marks.roll")
        cx, r, N = await pg.evaluate("[-CLAY.img.ball.x, CLAY.img.ball.r, CLAY.img.ball.n]")
        for t, metres in [(3.0, 2), (roll + 2.4, 7), (17.0, 7)]:
            s = await state(i, t)
            x = s['pics']['ball'][0][0] + cx
            assert abs(x - (200 + 120 * metres)) < 0.5, f'position {t} s: ball centre at x = {x:.1f}, not over {metres} m'
            assert round(s['frames']['ball'][0]) == round(120 * (metres - 2) / r / (2 * math.pi) * N) % N
            n += 2
        for t in (roll + .6, roll + 1.2, roll + 1.9):       # on the way: the angle follows the distance
            s = await state(i, t)
            d = s['pics']['ball'][0][0] + cx - 440
            assert round(s['frames']['ball'][0]) == round(d / r / (2 * math.pi) * N) % N, f'position {t} s: ball angle'
            n += 1
        assert not errs, errs
        print(f'check_ch09 ({a.browser}): {n} checks passed: screen speeds equal the labels in incar and roadside, wheel and ball angles follow the distance, jumped-to equals stepped-to')
        await b.close()

asyncio.run(main())
