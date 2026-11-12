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
  everywhere the Earth goes round the Sun counterclockwise at 40 degrees a second, its lit side from its angle; the
            walker's pose from the distance walked
  earth     the globe turns counterclockwise, 14 degrees a second
  9-28      the runner's distance, flags, the stop at the red light, both cars at 300 m, the frozen sprint, the swimmers'
            speeds (7 and 5 m/s), opposite ways at the same speed, your jog's sign and facing, the truck's and the
            U-turning car's speeds against their labels, sprites seen from above heading the way they move at a
            steady speed, the formula car's speed, the followed car's speed over the road
  labels    every label shown in the lesson stays at least 40 px inside the stage (clipped picture-in-picture text aside)
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
  // a sprite's anchor (the point the page places it by) and its turn: its group's transform, on the stage
  const anchor = g => { const m = g.getScreenCTM(); return [(m.e - st.left) * k, (m.f - st.top) * k, Math.atan2(m.b, m.a) * 180 / Math.PI]; };
  const pics = {}, frames = {}, anc = {};
  for (const e of scene.querySelectorAll('image')) {
    if (!shown(e)) continue;
    const n = name(e), strip = e.parentNode.tagName === 'svg';
    (pics[n] ??= []).push(strip ? at(e.parentNode) : box(e));
    (anc[n] ??= []).push(anchor(strip ? e.parentNode.parentNode : e.parentNode));
    if (strip) (frames[n] ??= []).push(parseFloat(e.parentNode.getAttribute('viewBox')) / CLAY.img[n].w);
  }
  return { pics, frames, anc, labels: [...scene.querySelectorAll('text')].filter(shown).map(e => e.textContent) };
}
"""
V, DT = 150, 0.5        # px a second for 30 mph at zoom 1; the time between the two looks


def mph(label):
    m = re.search(r'(←)?\s*(\d+) mph', label)
    return (-1 if m.group(1) else 1) * int(m.group(2))


def near(a_, b_, tol, what):
    assert abs(a_ - b_) <= tol, f'{what}: {a_:.2f}, expected {b_:.2f} (within {tol})'


async def parts_2_to_4(pg, state, idx, n):
    """The measured motions of beats 9-28: each moving thing on screen against the number the page shows for it."""
    mark = lambda b, k: pg.evaluate(f"TIMINGS[{b!r}].marks[{k!r}]")

    async def look(b, t, name, k=0, dt=0.2):   # anchor, its velocity on screen (px/s) and turn, and the state at t
        i = await idx(b)
        s0, s1 = await state(i, t), await state(i, t + dt)
        (x0, y0, r0), (x1, y1, _) = s0['anc'][name][k], s1['anc'][name][k]
        return (x0, y0, r0), ((x1 - x0) / dt, (y1 - y0) / dt), s0
    run = await pg.evaluate("CLAY.track.run")
    # speed (10): the runner's distance from 0 m is the distance label, her pose follows it
    t0, t1 = await mark('speed', 'go') + .4, await mark('speed', 'f') - .2
    for t in (t0 + .9, (t0 + t1) / 2, t1 + .3):
        (x, _, _), (vx, _), st_ = await look('speed', t, 'runner')
        d = [int(x_.split()[0]) for x_ in st_['labels'] if re.fullmatch(r'[0-9]+ m', x_)]
        near((x - 220) / 50, d[0], 0.5, f'speed {t:.1f} s: runner at {(x - 220) / 50:.2f} m, label {d[0]} m')
        assert round(st_['frames']['runner'][0]) == round((x - 220) / run * 8) % 8, f'speed {t:.1f} s: runner pose'
        n += 2
    # units (11): a flag stands at every 3 m the runner has passed in whole seconds
    e0 = await mark('units', 'each') + .2
    for t in (e0 + .5, e0 + 2.1, e0 + 4.9):
        (x, _, _), _, st_ = await look('units', t, 'runner')
        sec = (x - 220) / 150
        fl = sorted(a_[0] for a_ in st_['anc'].get('flag_t', []))
        assert len(fl) == math.floor(sec + 1e-6), f'units {t:.1f} s: {len(fl)} flags after {sec:.2f} s'
        for j, fx in enumerate(fl): near(fx, 220 + 150 * (j + 1), 0.5, f'units: flag {j + 1}')
        n += 1 + len(fl)
    # average (12): stopped at the red light while the label says 0 m/s; the trip and the steady car arrive together at 300 m
    st0, ag = await mark('average', 'stop'), await mark('average', 'again')
    (x, _, _), (vx, _), st_ = await look('average', (st0 + ag) / 2 + .2, 'car')
    assert abs(vx) < .01 and '0 m/s' in st_['labels'] and round(st_['frames']['light'][0]) == 0, f'average: stopped at red ({vx:.2f} px/s, {st_["labels"]})'
    (x, _, _), (vx, _), st_ = await look('average', st0 - .6, 'car')
    assert vx > 1 and '15 m/s' in st_['labels'], f'average: driving at 15 m/s ({vx:.1f} px/s)'
    g1 = await mark('average', 'ghost') + 5.6
    st_ = await state(await idx('average'), g1)
    near(st_['anc']['car'][0][0], 170 + 4.2 * 300, 0.5, 'average: the trip car at 300 m'); near(st_['anc']['car'][1][0], 170 + 4.2 * 300, 0.5, 'average: the steady car at 300 m')
    n += 4
    # instant (13): frozen for the snapshot at 12 m/s
    fz = await mark('instant', 'but') + .2 + 6.3
    _, (vx, _), st_ = await look('instant', fz + .5, 'runner')
    assert abs(vx) < .01 and 'now: 12 m/s' in st_['labels'], f'instant: frozen at 90 m ({vx:.2f} px/s)'
    n += 1
    # q2 (14): the dolphin swims 7 m every second, the walrus 5 (20 px a meter, the clip runs 1.4 times fast)
    _, (vd, _), _ = await look('q2', 2.0, 'dolphin'); _, (vw, _), _ = await look('q2', 2.0, 'walrus')
    near(vd / (20 * 1.4), 7, 0.01, 'q2: dolphin m/s'); near(vw / (20 * 1.4), 5, 0.01, 'q2: walrus m/s')
    st_ = await state(await idx('q2'), 7.9)
    near(st_['anc']['dolphin'][0][0], 170 + 20 * 56, 0.5, 'q2: dolphin at 56 m'); near(st_['anc']['walrus'][0][0], 170 + 20 * 30, 0.5, 'q2: walrus at 30 m')
    n += 4
    # part3 (16): same speed, opposite ways
    _, (va, _), _ = await look('part3', 3.0, 'car_l'); _, (vb, _), _ = await look('part3', 3.0, 'truck')
    near(va, -vb, 0.01, 'part3: the two speeds'); assert va < 0 < vb; n += 1
    # velocity (17): right at +2, left at −2, the same speed both ways, the jog facing the way it goes
    j0, mi = await mark('velocity', 'jog'), await mark('velocity', 'minus')
    leg = (mi - j0) / 5
    speeds = []
    for t, sgn in ((j0 + 3.8 * leg, -1), (j0 + 4.5 * leg, 1), (j0 + 5.5 * leg, -1), (j0 + 6.5 * leg, 1)):   # the velocity label is shown (faded in) from just after "diff"
        nm = 'you_jog_r' if sgn > 0 else 'you_jog_l'
        _, (vx, _), st_ = await look('velocity', t, nm)
        assert (vx > 0) == (sgn > 0) and nm in st_['anc'] and ('you_jog_l' if sgn > 0 else 'you_jog_r') not in st_['anc'], f'velocity {t:.1f} s: facing'
        v_ = [x_ for x_ in st_['labels'] if x_.startswith('velocity: ')][0]
        assert (sgn > 0) == ('+2' in v_), f'velocity {t:.1f} s: label {v_} for {vx:.1f} px/s'
        speeds.append(abs(vx)); n += 2
    near(min(speeds), max(speeds), 0.01, 'velocity: same speed both ways'); n += 1
    # change (18): the truck's screen speed is 15 px/s per m/s of its label; the car 6 m/s before and after its U-turn
    sp0 = await mark('change', 'spd')
    for t in (sp0 + .5, sp0 + 1.5, sp0 + 2.5):
        _, (vx, _), st_ = await look('change', t, 'truck', dt=.05)
        lab = [int(re.search(r'\+([0-9]+) m/s', x_).group(1)) for x_ in st_['labels'] if x_.startswith('velocity: +')]
        assert any(abs(vx - 15 * v_) <= 8 for v_ in lab), f'change {t:.1f} s: truck {vx:.1f} px/s, labels {lab}'
        n += 1
    dr = await mark('change', 'dir') + .6
    _, (vb1, _), st_ = await look('change', dr - .5, 'car'); assert '+6' in ' '.join(st_['labels'])
    _, (vb2, _), st_ = await look('change', dr + 1.5, 'car_l'); assert '−6' in ' '.join(st_['labels'])
    near(vb1, 90, .01, 'change: before the U-turn'); near(vb2, -90, .01, 'change: after the U-turn')
    st_ = await state(await idx('change'), dr + .35); assert 'car_y' in st_['anc'] and 'car' not in st_['anc'], 'change: turning poses during the U-turn'
    n += 5
    # corner (19), turnfeel (26), q3 (20), q4 (27), accel (23): a sprite seen from above heads the way it moves
    async def heading(b, t, name, speed=None, k=0, dt=.05):
        (x, y, r), (vx, vy), st_ = await look(b, t, name, k, dt)
        h = math.degrees(math.atan2(vy, vx))
        assert abs((h - r + 180) % 360 - 180) < 4, f'{b} {t:.1f} s: {name} faces {r:.1f}, moves {h:.1f} degrees'
        if speed: near(math.hypot(vx, vy), speed, speed * .02, f'{b} {t:.1f} s: {name} speed')
        return st_
    tt = await mark('corner', 'turn')
    for t in (tt - 1, tt + .9, tt + 1.8, tt + 3.2):
        st_ = await heading('corner', t, 'car_top', 150)
        assert 'speed: 10 m/s' in st_['labels'] and any(x_.startswith('velocity: 10 m/s') for x_ in st_['labels'])
        n += 2
    for t in (await mark('turnfeel', 'dir') + 1, await mark('turnfeel', 'feel') + .5): await heading('turnfeel', t, 'car_top', 70); n += 2
    for t in (.5, 1.6, 2.9): await heading('q3', t, 'walker_top', 220); n += 2
    for t in (.6, 1.4): await heading('q4', t, 'bee', 170 * .9); n += 2
    i = await idx('accel')
    for t in (6.0, 7.5):                                     # the boxes fade in at "ways"
        st_ = await heading('accel', t, 'car_top', None)
        (x, y, _), (vx, vy), _ = await look('accel', t, 'car_top')
        cx_, cy_ = 1070 + 460 / 2, 230 + 400 / 2             # the third box
        assert (x - cx_) * vy - (y - cy_) * vx < 0, 'accel: the car goes round counterclockwise on screen'
        n += 2
    # formula (24): the car's screen speed is 20 px/s per m/s of its label
    e0 = await mark('formula', 'ex') + .2
    for s_ in (1, 2, 3):
        t = e0 + s_ * 5 / 4
        _, (vx, _), st_ = await look('formula', t, 'car', dt=.02)
        v_ = [int(x_.split()[0]) for x_ in st_['labels'] if re.fullmatch(r'[0-9]+ m/s', x_)][0]
        near(vx / 20 / (4 / 5), 5 + 5 * s_, 0.6, f'formula at {s_} s: speed')   # the clip runs 4 s of motion in 5 s
        near(v_, 5 + 5 * s_, 0.6, f'formula at {s_} s: label'); n += 2
    # sign (25): the car's speed over the road (the camera follows) is 12 px/s per m/s of its label; the acceleration label's sign is the change of that speed
    g0, b0 = await mark('sign', 'gas'), await mark('sign', 'brake')
    prev = None
    for t in (g0 - .5, g0 + 1.5, g0 + 3.5, b0 + 2.0):
        i = await idx('sign')
        s0, s1 = await state(i, t), await state(i, t + .02)
        rd = lambda st_: min(st_['anc']['road'], key=lambda a_: abs(a_[0]))[0]
        dv = (s1['anc']['car'][0][0] - s0['anc']['car'][0][0]) - (((rd(s1) - rd(s0)) + 1200) % 2400 - 1200)
        v_ = [int(x_.split()[1]) for x_ in s0['labels'] if x_.startswith('velocity: ')][0]
        near(dv / .02 / 12, v_, 0.6, f'sign {t:.1f} s: speed over the road')   # the label is rounded: within half a m/s
        acc = [x_ for x_ in s0['labels'] if x_.startswith('acceleration: ')][0]
        want = 'acceleration: +5 m/s²' if t < g0 + 3 and t > g0 else 'acceleration: −5 m/s²' if t > b0 else 'acceleration: 0'
        assert acc == want, f'sign {t:.1f} s: {acc}, expected {want}'
        if prev is not None: assert (v_ > prev) == (want.endswith('+5 m/s²')) or want == 'acceleration: 0' or v_ < prev, f'sign {t:.1f} s: speed {prev} to {v_} under {want}'
        n += 2; prev = v_
    return n


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
        # everywhere: the Earth goes round the Sun counterclockwise on screen (seen from above and in front: the near
        # side moves right), its frame is the one its angle gives; the walker's pose follows the distance walked
        i = await idx('everywhere')
        te, ty = await pg.evaluate("[TIMINGS.everywhere.marks.earth, TIMINGS.everywhere.marks.you]")
        ox, oy = await pg.evaluate("[CLAY.table.orbit[0], CLAY.table.orbit[1]]")
        ang = []
        for t in (te, te + 1, te + 2, te + 3, te + 4):
            st_ = await state(i, t)
            x, y, w, h = st_['pics']['earth'][0]
            ex, ey = x + w / 2 - await pg.evaluate("CLAY.img.earth.x + CLAY.img.earth.w / 2"), y + h / 2 - await pg.evaluate("CLAY.img.earth.y + CLAY.img.earth.h / 2")
            ang.append(math.degrees(math.atan2(-(ey - oy) / await pg.evaluate("CLAY.table.orbit[3]"), (ex - ox) / await pg.evaluate("CLAY.table.orbit[2]"))))
            assert round(st_['frames']['earth'][0]) == round((ang[-1] + 90) / 15) % 24, f'everywhere {t} s: Earth frame {st_["frames"]["earth"][0]} at {ang[-1]:.0f} degrees'
            n += 1
        d = [((b_ - a_ + 180) % 360) - 180 for a_, b_ in zip(ang, ang[1:])]
        assert all(abs(v - 40) < 0.5 for v in d), f'everywhere: the Earth turns {d} degrees a second, not +40 (counterclockwise)'
        step = await pg.evaluate("CLAY.table.step")
        for t in (ty + .5, ty + 1.3, ty + 2.2, ty + 6):
            st_ = await state(i, t)
            wx = await pg.evaluate("CLAY.table.walk[0] + CLAY.img.walk.x")
            dist = st_['pics']['walk'][0][0] - wx
            assert round(st_['frames']['walk'][0]) == round(dist / step * 8) % 8, f'everywhere {t} s: walk frame'
            n += 1
        # earth: the globe turns counterclockwise on screen (its rotation angle falls), at ESPIN degrees a second
        i = await idx('earth')
        rot = await pg.evaluate("""([i, t]) => { seek(i, false); P.t = t; evalTo(t);
          const g = [...scene.querySelectorAll('image')].find(e => /globe\\.webp/.test(e.getAttribute('href'))).parentNode.parentNode;
          const m = g.transform.baseVal.consolidate().matrix; return Math.atan2(m.b, m.a) * 180 / Math.PI; }""", [i, 8.0])
        rot2 = await pg.evaluate("""([i, t]) => { seek(i, false); P.t = t; evalTo(t);
          const g = [...scene.querySelectorAll('image')].find(e => /globe\\.webp/.test(e.getAttribute('href'))).parentNode.parentNode;
          const m = g.transform.baseVal.consolidate().matrix; return Math.atan2(m.b, m.a) * 180 / Math.PI; }""", [i, 9.0])
        assert abs(((rot2 - rot + 180) % 360 - 180) - (-14)) < 0.01, f'earth: the globe turns {rot2 - rot} degrees a second, not -14 (counterclockwise)'
        n += 1
        n = await parts_2_to_4(pg, state, idx, n)
        # labels: every label shown in the lesson sits at least 40 px inside the stage
        for bid in ('intro', 'position', 'everywhere', 'roadside', 'incar', 'rule', 'earth', 'q1', 'wrap',
                    'part2', 'speed', 'units', 'average', 'instant', 'q2', 'wrap2', 'part3', 'velocity', 'change', 'corner', 'q3', 'wrap3',
                    'part4', 'accel', 'formula', 'sign', 'turnfeel', 'q4', 'wrap4'):
            i = await idx(bid)
            end = await pg.evaluate(f"TIMINGS[{bid!r}].dur")
            for t in [end * k / 8 for k in range(9)]:
                bad = await pg.evaluate("""([i, t]) => { seek(i, false); for (let u = 0; u < t; u += .25) evalTo(u); P.t = t; evalTo(t);
                  const st = document.getElementById('stage').getBoundingClientRect(), k = 1600 / st.width;
                  const shown = e => { for (let n = e; n && n !== scene; n = n.parentNode) { if (n._st && n._st.o < .5) return false; if (n.getAttribute && n.getAttribute('clip-path')) return false; } return true; };
                  return [...scene.querySelectorAll('text')].filter(e => e.textContent.trim() && shown(e)).map(e => { const r = e.getBoundingClientRect();
                    return [e.textContent, (r.left - st.left) * k, (r.top - st.top) * k, (r.right - st.left) * k, (r.bottom - st.top) * k]; })
                    .filter(([, l, tp, r, b]) => r > 0 && l < 1600 && b > 0 && tp < 900 && (l < 40 || tp < 40 || r > 1560 || b > 860)); }""", [i, t])
                assert not bad, f'{bid} at {t:.1f} s: labels closer than 40 px to the edge: {bad}'
                n += 1
        assert not errs, errs
        print(f'check_ch09 ({a.browser}): {n} checks passed: the clay picture agrees with the live numbers in beats 0-28 (speeds, positions, poses, headings, directions), labels 40 px inside, jumped-to equals stepped-to')
        await b.close()

asyncio.run(main())
