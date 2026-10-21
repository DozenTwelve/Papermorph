#!/usr/bin/env python3
"""Bake a picture book's SVG set sketches to WebP layers (plus a blurred -soft copy for shallow focus).

    uv run --with playwright --with pillow python bake_sets.py books/<book>/art/sets.js site/<book> [SET ...] [--ref DIR]

SETS.JS (template: assets/templates/picture-book/sets.js) defines window.SETS = {setName: () => [layer, ...]} and
window.SET_DEFS (an SVG <defs> string with the paper filters). A layer is {name, k, box: [x, y, w, h] in world px,
scale, svg, soft?}: k is the parallax factor (1 = the puppets' plane), scale the bitmap's pixels per world px, soft:
false skips the blurred copy. Writes SITE/img/sets/<set>/<layer>.webp, <layer>-soft.webp and the placement manifest
SITE/img/sets/sets.js that paper.js reads. The manifest keeps every set it already lists: without SET names only the
sets it does not list yet are baked (one that is there may have been painted since), and with SET names those are baked
again. --ref DIR also writes each baked set's layers as one 1600x900 picture, DIR/ref-<set>.png.

The sketches are a finished look on their own (free) and the composition reference an image model repaints (give the
--ref picture to paint.py, then put the result in with painted.py). Needs Playwright's Chromium.
"""
import asyncio, base64, io, json, pathlib, sys
from PIL import Image
from playwright.async_api import async_playwright
from browsers import exe

JS = """async ([name, i, soft]) => {
  const L = SETS[name]()[i], [x, y, w, h] = L.box, s = L.scale || 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * s}" height="${h * s}" viewBox="${x} ${y} ${w} ${h}">${window.SET_DEFS || ''}${L.svg}</svg>`;
  const img = new Image(); img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await img.decode();
  const c = document.createElement('canvas'); c.width = w * s; c.height = h * s;
  const g = c.getContext('2d'); if (soft) g.filter = `blur(${5 * s}px)`; g.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}"""


async def main(sets_js, site, only, ref):
    out = pathlib.Path(site) / 'img/sets'; old = out / 'sets.js'
    man = json.loads(old.read_text().split('=', 1)[1].rstrip().rstrip(';')) if old.exists() else {}
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe()); pg = await b.new_page()
        await pg.add_script_tag(path=str(pathlib.Path(sets_js).resolve()))
        known = await pg.evaluate('Object.keys(SETS)')
        if set(only) - set(known): sys.exit(f'not in {sets_js}: {sorted(set(only) - set(known))}')
        names = only or [n for n in known if n not in man]
        if not names: print('every set is in the manifest already: name the ones to bake again')
        for n in names:
            frame = Image.new('RGBA', (1600, 900))
            layers = await pg.evaluate(f'SETS[{json.dumps(n)}]().map(l => ({{name: l.name, k: l.k, box: l.box, soft: l.soft !== false}}))')
            (out / n).mkdir(parents=True, exist_ok=True)
            for i, L in enumerate(layers):
                for soft in ([False, True] if L['soft'] else [False]):
                    png = await pg.evaluate(JS, [n, i, soft])
                    f = out / n / (L['name'] + ('-soft' if soft else '') + '.webp')
                    im = Image.open(io.BytesIO(base64.b64decode(png.split(',')[1]))); im.save(f, quality=86, method=6)
                    print(f.relative_to(out), f.stat().st_size // 1024, 'KB')
                    if not soft:
                        x, y, w, h = L['box']; lay = im.convert('RGBA').resize((w, h)); frame.paste(lay, (x, y), lay)
            man[n] = layers
            if ref:
                pathlib.Path(ref).mkdir(parents=True, exist_ok=True); frame.convert('RGB').save(pathlib.Path(ref) / f'ref-{n}.png')
        old.write_text('window.SETS = ' + json.dumps(man) + ';\n')
        await b.close()


if __name__ == '__main__':
    args, ref = sys.argv[1:], None
    if '--ref' in args:
        k = args.index('--ref'); ref = args[k + 1]; del args[k:k + 2]
    if len(args) < 2:
        print(__doc__); sys.exit(0 if args in (['-h'], ['--help']) else 2)
    asyncio.run(main(args[0], args[1], args[2:], ref))
