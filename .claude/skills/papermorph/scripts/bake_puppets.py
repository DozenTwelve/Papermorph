#!/usr/bin/env python3
"""Bake every paper piece a picture book uses (puppets and props, every scene of every chapter) to bitmaps.

    python3 SKILL/scripts/serve.py 8765 site &
    uv run --with playwright --with pillow python bake_puppets.py site/<book> [--url http://localhost:8765/<book>/] [--clean]

The page would otherwise run the paper filter on each piece at startup. This opens every chNN of the book with ?bake
(which ignores existing bitmaps), seeks it to its last beat (which builds every scene before it, so every piece is asked
for once), and saves each piece to SITE/img/puppets/<hash>.webp, listed in baked.js (window.BAKED) that paper.js reads.
Run it after changing a puppet or prop drawing, or after adding a chapter. A piece is found by its drawing and its
bounding box, and the box of text or of a rotated piece differs between browsers, so the pages are opened in Chromium
and in Firefox and both sets are kept. Pieces already baked are not encoded again, and files this run did not produce
are kept (a piece another chapter or an earlier run made); --clean (after changing the paper filter itself) re-encodes
every piece and then removes the files no chapter asked for. --url defaults to the book under http://localhost:8765/.
A page error is printed and the run exits 1: the scenes after the one that threw asked for no pieces, so the page
bakes those live.
"""
import argparse, base64, io, json, pathlib, sys
from PIL import Image
from playwright.sync_api import sync_playwright
from browsers import answers, exe, firefox

READY = """async () => {
  let n = -1; while (bakedJobs.size !== n) { n = bakedJobs.size; await Promise.all([...bakedJobs.values()]); await new Promise(r => setTimeout(r, 300)); }
  const out = [];
  for (const [key, url] of bakedReady) { const blob = await (await fetch(url)).blob();
    out.push([keyHash(key), await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); })]); }
  return out; }"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('site'); ap.add_argument('--url'); ap.add_argument('--clean', action='store_true')
    a = ap.parse_args()
    site = pathlib.Path(a.site); out = site / 'img/puppets'
    url = (a.url or f'http://localhost:8765/{site.resolve().name}/').rstrip('/') + '/'
    got, clean, errs = {}, a.clean, []
    chs = sorted(d.name for d in site.glob('ch[0-9][0-9]'))
    if not chs: sys.exit(f'{site}: no chNN folders: give the book folder in site/')
    for ch in chs: answers(f'{url}{ch}/')
    with sync_playwright() as p:
        for kind in (p.chromium, p.firefox):
            try:
                b = kind.launch(**exe()) if kind is p.chromium else kind.launch(**firefox())
            except Exception as e:   # Playwright's Firefox may not run on this system: the Chromium pieces still stand
                if kind is p.chromium: raise
                print(f'{kind.name} did not start, so Firefox bakes its own few pieces in the page:', str(e).splitlines()[0])
                if clean: print('--clean is off: the Firefox pieces baked before stay'); clean = False
                continue
            pg = b.new_page(viewport={'width': 1600, 'height': 900})
            pg.on('pageerror', lambda e, k=kind.name: errs.append(f'{k} {pg.url}: {e}'))
            for ch in chs:
                pg.goto(f'{url}{ch}/?bake', timeout=600000)
                last = pg.evaluate('BEATS.length - 1')
                pg.goto(f'{url}{ch}/?bake&beat={last}&t=0.1', timeout=600000)
                got.update(pg.evaluate(READY))
                print(kind.name, ch, 'beat', last, len(got), 'pieces so far', flush=True)
            b.close()
    out.mkdir(parents=True, exist_ok=True)
    man_path = out / 'baked.js'
    man = {}
    if man_path.exists() and not clean:
        man = {h: f for h, f in json.loads(man_path.read_text().split('=', 1)[1].rstrip().rstrip(';')).items() if (out / f).exists()}
    new = 0
    for h, data in got.items():
        f = out / f'{h}.webp'
        if h in man and not clean: continue   # the same key is the same drawing: re-encoding only adds noise
        Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).save(f, quality=88, method=6)
        man[h] = f.name; new += 1
    man_path.write_text('window.BAKED = ' + json.dumps(man) + ';\n')
    if clean:   # only now, so the site never lists a file that is gone
        for f in out.glob('*.webp'):
            if f.name not in man.values(): f.unlink()
    print(len(got), 'pieces asked for,', new, 'encoded,', len(man), 'listed,', sum((out / f).stat().st_size for f in man.values()) // 1024, 'KB')
    if errs:   # a scene that threw asked for no pieces after it: those are missing here, and baked live by the page
        print('PAGE ERRORS (the pieces of the scenes after one are not baked):', *errs[:10], sep='\n  ')
        sys.exit(1)


if __name__ == '__main__':
    main()
