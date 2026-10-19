#!/usr/bin/env python3
"""Bake every paper piece a picture book uses (puppets and props, every scene of every chapter) to bitmaps.

    uv run --with playwright --with pillow python bake_puppets.py site/<book> [--url http://localhost:8790/site/<book>/] [--clean]

The page would otherwise run the paper filter on each piece at startup. This opens every chNN of the book with ?bake
(which ignores existing bitmaps), seeks it to its last beat (which builds every scene before it, so every piece is asked
for once), and saves each piece to SITE/img/puppets/<hash>.webp, listed in baked.js (window.BAKED) that paper.js reads.
Run it with a preview server up (python3 SKILL/scripts/serve.py 8790 site) after changing a puppet or prop drawing.
--url is the book's address as the server shows it (default http://localhost:8790/); files this run did not produce are
kept (a piece another chapter or an earlier run made) unless --clean removes them first. Needs Playwright's Chromium.
"""
import argparse, base64, io, json, pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

READY = """async () => {
  let n = -1; while (bakedJobs.size !== n) { n = bakedJobs.size; await Promise.all([...bakedJobs.values()]); await new Promise(r => setTimeout(r, 300)); }
  const out = [];
  for (const [key, url] of bakedReady) { const blob = await (await fetch(url)).blob();
    out.push([keyHash(key), await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); })]); }
  return out; }"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('site'); ap.add_argument('--url', default='http://localhost:8790/'); ap.add_argument('--clean', action='store_true')
    a = ap.parse_args()
    site = pathlib.Path(a.site); out = site / 'img/puppets'; url = a.url.rstrip('/') + '/'
    got = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1600, 'height': 900})
        for ch in sorted(d.name for d in site.glob('ch[0-9][0-9]')):
            pg.goto(f'{url}{ch}/?bake', timeout=600000)
            last = pg.evaluate('BEATS.length - 1')
            pg.goto(f'{url}{ch}/?bake&beat={last}&t=0.1', timeout=600000)
            got += pg.evaluate(READY)
            print(ch, 'beat', last, len(got), 'pieces so far')
        b.close()
    out.mkdir(parents=True, exist_ok=True)
    if a.clean:
        for f in out.glob('*.webp'): f.unlink()
    man_path = out / 'baked.js'
    man = {}
    if man_path.exists() and not a.clean:
        man = {h: f for h, f in json.loads(man_path.read_text().split('=', 1)[1].rstrip().rstrip(';')).items() if (out / f).exists()}
    for h, data in got:
        f = out / f'{h}.webp'
        Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).save(f, quality=88, method=6)
        man[h] = f.name
    man_path.write_text('window.BAKED = ' + json.dumps(man) + ';\n')
    print(len(got), 'pieces baked,', len(man), 'listed,', sum((out / f).stat().st_size for f in man.values()) // 1024, 'KB')


if __name__ == '__main__':
    main()
