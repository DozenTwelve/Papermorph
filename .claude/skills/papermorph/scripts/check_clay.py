#!/usr/bin/env python3
"""check_clay.py: a chapter's clay pictures (claykit.py's WebPs and their manifest, window.CLAY) load, decode and fit it.

    uv run --with playwright python3 check_clay.py http://localhost:8765/<book>/ch01/ [--browser chromium|firefox|webkit]
    uv run --with playwright python3 check_clay.py --selftest     # a made-up book with a bad, a missing and a wrong picture

Opens the page (served by serve.py) and fails, naming each, when:
  - a file the page asks for is missing (HTTP 400 or more) or its request fails, or the page throws;
  - a picture in the manifest does not load or decode, or its pixels do not match its entry: a strip's width is not
    n equal frames, or a frame's shape is not the entry's w by h (at any density: --scale 200 is twice the page size);
  - a picture drawn on the stage at the start, middle and end of any beat (its whole length: pre-roll and hold) does not decode, or a strip shows a frame
    outside its n;
  - a beat's visible clay pictures differ when its middle is jumped to (?beat=N&t=S) and when it is played to at 60 steps a
    second (where each picture is, which frame each strip shows).
It does not judge the look or the motion: a book's own check measures that (site/physics-clay/make/check_ch09.py).
Exits 1 on any problem. From another script: problems = await check_clay.assets(pg) after watch(pg, sink).
"""
import argparse, asyncio, functools, http.server, json, math, pathlib, sys, tempfile, threading
from browsers import answers, exe, firefox, missing

# Every manifest picture, loaded and decoded as the page would: {name: [url, natural w, natural h] or [url, error]}
LOAD = r"""async () => {
  const base = CLAY.base || new URL('../img/clay/', location.href).href, out = {};
  await Promise.all(Object.keys(CLAY.img).map(async name => {
    const im = new Image(), url = base + name + '.webp';
    im.src = url;
    try { await Promise.race([im.decode(), new Promise((_, no) => setTimeout(() => no(new Error('timed out')), 15000))]);
      out[name] = [url, im.naturalWidth, im.naturalHeight]; }
    catch (e) { out[name] = [url, String(e.message || e)]; }
  }));
  return out;
}"""
# The stage's pictures at a moment: [href, x, y, w, h] for each <image> (strips: their window), and each strip's frame
STAGE = r"""([i, t, stepped]) => {
  seek(i, false);
  if (stepped) for (let u = 0; u < t; u += 1 / 60) evalTo(u);
  P.t = t; evalTo(t);
  const st = document.getElementById('stage').getBoundingClientRect(), k = SW / st.width, out = [], bad = [];
  for (const e of scene.querySelectorAll('image')) {
    const href = new URL(e.getAttribute('href'), document.baseURI).href, v = e.parentNode;
    let hidden = false;   // a picture no one sees (opacity 0 on it or a group above) may keep any frame: only its decode counts
    for (let n = e; n && n !== scene.ownerSVGElement; n = n.parentNode) { const cs = getComputedStyle(n); if (+cs.opacity === 0 || cs.display === 'none') hidden = true; }
    if (hidden) { out.push([href, 'hidden']); continue; }
    const r = (v.tagName === 'svg' ? v : e).getBoundingClientRect();
    out.push([href, ...[r.left - st.left, r.top - st.top, r.width, r.height].map(x => Math.round(x * k * 10) / 10)]);
    if (v.tagName === 'svg') {
      const name = href.replace(/.*\/|\.webp$/g, ''), m = CLAY.img[name], f = parseFloat(v.getAttribute('viewBox')) / (m ? m.w : 1);
      out.push(['frame', name, f]);
      if (m && (Math.abs(f - Math.round(f)) > 1e-6 || f < 0 || f >= m.n)) bad.push(`${name} shows frame ${f} of ${m.n}`);
    }
  }
  return [out, bad];
}"""


def watch(pg, sink):
    """Report missing files, failed requests and page errors to sink (call before goto)."""
    missing(pg, sink)
    # Seeking cancels the previous audio request (WebKit types it 'other'); an aborted picture still fails.
    audio = lambda r: r.resource_type == 'media' or r.url.split('?')[0].endswith(('.mp3', '.m4a', '.ogg', '.wav'))
    pg.on('requestfailed', lambda r: None if audio(r) and r.failure in ('net::ERR_ABORTED', 'NS_BINDING_ABORTED', 'cancelled')
          else sink(f'request failed ({r.failure}, {r.resource_type}): {r.url}'))
    pg.on('pageerror', lambda e: sink(f'page error: {e}'))


async def assets(pg):
    """Problems with the manifest's pictures: each one that does not load or decode, or does not fit its entry."""
    if not await pg.evaluate("typeof CLAY === 'object' && !!CLAY.img"):
        return ['no window.CLAY with img: the page does not load a clay manifest (../img/clay/clay.js) before this check']
    man, got, out = await pg.evaluate('CLAY.img'), await pg.evaluate(LOAD), []
    if not man: return ['the clay manifest has no pictures']
    for name, m in man.items():
        if any(not isinstance(m.get(k), (int, float)) or not math.isfinite(m[k]) for k in ('w', 'h', 'x', 'y')) or min(m.get('w', 0), m.get('h', 0)) <= 0 or not isinstance(m.get('n', 1), int) or m.get('n', 1) < 1:
            out.append(f'{name}: invalid manifest rectangle or frame count: {m}'); continue
        url, *r = got[name]
        if len(r) == 1:
            out.append(f'{name}: {url} did not load or decode ({r[0]})'); continue
        w, h = r; n = m.get('n', 1)
        # Blender rounds each side on its own (1000x101 at 50% is 500x50), so some one density must fit both within 1 px
        lo, hi = max((w / n - 1) / m['w'], (h - 1) / m['h']), min((w / n + 1) / m['w'], (h + 1) / m['h'])
        if w % n or lo > hi:
            out.append(f'{name}: {url} is {w}x{h} px, which is not {n} frame{"s" * (n > 1)} of {m["w"]}x{m["h"]} at any one density')
    return out


async def stage(pg):
    """Problems with what the beats draw: pictures that do not decode, strip frames out of range, jumped-to and
    played-to moments that differ. Returns (problems, moments looked at)."""
    if await pg.evaluate("typeof BEATS === 'undefined'"):
        return ['no BEATS: not a beat chapter, so only the manifest was checked'], 0
    try: await pg.wait_for_function('P.gen > 0', timeout=30000)   # boot has started a beat (a clay page boots once its pictures decode)
    except Exception: return ['the page did not boot within 30 s (no beat started): did clayBoot or clayReady reject?'], 0
    # each beat's whole length on screen, as the engine runs it: pre-roll, narration, tweens past it and the hold
    beats = await pg.evaluate("BEATS.map((b, i) => { seek(i, false); return [b.id, P.end]; })")
    out, urls, moments = [], set(), 0
    for i, (bid, dur) in enumerate(beats):
        for t in (0.3, dur / 2, max(0.3, dur - 0.2)):
            (pics, bad), moments = await pg.evaluate(STAGE, [i, t, False]), moments + 1
            out += [f'{bid} at {t:.1f} s: {b}' for b in bad]
            urls |= {p[0] for p in pics if p[0] != 'frame'}
            if t == dur / 2 and pics != (await pg.evaluate(STAGE, [i, t, True]))[0]:
                out.append(f'{bid} at {t:.1f} s: the clay pictures differ jumped to and played to (a pose or place read from playback state, not from t)')
    bad = await pg.evaluate("""async urls => (await Promise.all(urls.map(async u => { const im = new Image(); im.src = u;
      try { await im.decode(); return null; } catch { return u; } }))).filter(Boolean)""", sorted(urls))
    return out + [f'the stage draws {u}, which did not decode' for u in bad], moments


async def check(url, browser):
    answers(url)
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await (p.chromium.launch(**exe()) if browser == 'chromium' else p.firefox.launch(**firefox()) if browser == 'firefox' else p.webkit.launch())
        pg = await b.new_page(viewport={'width': 1600, 'height': 960})
        errs = []
        watch(pg, errs.append)
        await pg.goto(url); await pg.wait_for_load_state('load')
        found = await assets(pg)
        if found: st, moments = [], 0
        else: st, moments = await stage(pg)
        await b.close()
    problems = errs + found + st
    for x in problems: print('  ' + x)
    print(f'check_clay ({browser}): {url}: {len(problems)} problem{"s" * (len(problems) != 1)}; manifest pictures and {moments} beat moments looked at')
    return not problems


def selftest():
    """A book with six pictures: good, a strip of two good frames, a wide shallow crop whose sides were rounded apart,
    one undecodable, one missing, one whose entry says another size. The check must name the last three and only them."""
    from playwright.async_api import async_playwright
    with tempfile.TemporaryDirectory() as tmp:
        root = pathlib.Path(tmp); (root / 'b/img/clay').mkdir(parents=True); (root / 'b/ch01').mkdir()
        man = {'img': {'good': {'w': 20, 'h': 10, 'x': 0, 'y': 0}, 'pair': {'w': 10, 'h': 10, 'x': 0, 'y': 0, 'n': 2},
                       'bad': {'w': 20, 'h': 10, 'x': 0, 'y': 0}, 'gone': {'w': 20, 'h': 10, 'x': 0, 'y': 0},
                       'wrong': {'w': 40, 'h': 10, 'x': 0, 'y': 0},
                       'flat': {'w': 1000, 'h': 101, 'x': 0, 'y': 0}}}
        (root / 'b/img/clay/clay.js').write_text('window.CLAY = ' + json.dumps(man) + ";\nif (document.currentScript) CLAY.base = document.currentScript.src.replace(/[^/]*$/, '');\n")
        (root / 'b/ch01/index.html').write_text('<!doctype html><meta charset="utf-8"><script src="../img/clay/clay.js"></script>')
        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=tmp))
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        url = f'http://127.0.0.1:{srv.server_address[1]}/b/ch01/'

        async def run():
            async with async_playwright() as p:
                b = await p.chromium.launch(**exe()); pg = await b.new_page()
                import base64
                async def webp(w, h):
                    u = await pg.evaluate("""([w, h]) => { const c = document.createElement('canvas'); c.width = w; c.height = h;
                      const g = c.getContext('2d'); g.fillStyle = '#c96'; g.fillRect(0, 0, w, h); return c.toDataURL('image/webp'); }""", [w, h])
                    data = base64.b64decode(u.split(',', 1)[1])
                    assert data[:4] == b'RIFF', 'this Chromium made no WebP for the fixture'
                    return data
                data = await webp(20, 10)
                for n in ('good', 'pair', 'wrong'): (root / f'b/img/clay/{n}.webp').write_bytes(data)
                (root / 'b/img/clay/flat.webp').write_bytes(await webp(500, 50))   # 1000x101 at 50%: each side rounded down
                (root / 'b/img/clay/bad.webp').write_bytes(b'RIFF\x10\x00\x00\x00WEBPnot a picture')
                errs = []
                watch(pg, errs.append)
                await pg.goto(url)
                found = await assets(pg)
                blocked = await b.new_page()
                failed = []
                watch(blocked, failed.append)
                await blocked.route('**/*.webp', lambda route: route.abort())
                await blocked.goto(url)
                absent = await assets(blocked)
                assert {x.split(':')[0] for x in absent} == set(man['img']), absent
                assert any('request failed' in e for e in failed), failed
                await b.close()
                return errs, found
        errs, found = asyncio.run(run())
        srv.shutdown()
    named = {x.split(':')[0] for x in found}
    assert named == {'bad', 'gone', 'wrong'}, found
    assert any('gone.webp' in e and '404' in e for e in errs), errs
    print('check_clay selftest: ok (missing/undecodable/wrong size named; good image, strip and rounded crop pass; aborting all images fails every asset)')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('url', nargs='?')
    ap.add_argument('--browser', default='chromium', choices=['chromium', 'firefox', 'webkit'])
    ap.add_argument('--selftest', action='store_true')
    a = ap.parse_args()
    if a.selftest: selftest()
    elif not a.url: ap.error('give the chapter URL, or --selftest')
    else: sys.exit(0 if asyncio.run(check(a.url, a.browser)) else 1)
