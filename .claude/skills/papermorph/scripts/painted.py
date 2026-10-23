#!/usr/bin/env python3
"""Put image-model pictures into a picture book: painted sets and cut-out props, from a JSON manifest.

    uv run --with pillow python painted.py books/<book>/art/painted.json site/<book>

Replaces the SVG sketch of a set (bake_sets.py) by its painted layers. For every set in the manifest the layers are
written to SITE/img/sets/<set>/<layer>.webp with a blurred <layer>-soft.webp for close-ups, and the set's entry in
SITE/img/sets/sets.js is replaced. Full-frame pictures are resized to the 1600x900 frame and grown by mirrored, blurred
edges (`pad`) so a shaking or zooming camera never sees past them; a `cut` layer is a transparent picture cropped to its
opaque part and placed by its left x, bottom y and width, so characters can stand behind it. A layer's `k` is its
parallax factor as in the sketch (1, the puppets' plane, if left out). The padding mirrors the picture's edges; a layer
with "edge": "stretch" repeats its outermost pixels instead (when something near the edge, a post box, would show
twice). Words for signs and boards
(the model leaves them blank) are written onto the picture. sets.js is rewritten after each set, so if a set fails the
sets before it are done and the rest keep their old files and entries. Props go to SITE/img/props/<name>.webp. Run bake_sets.py
first (it rewrites sets.js); run this again after any change. Paths in the manifest are relative to the manifest.

    {
      "frame": [1600, 900], "pad": [60, 34],                       (optional, these are the defaults)
      "fonts": {"sign": "/System/Library/Fonts/STHeiti Medium.ttc"},   (a path, or {"path": ..., "index": 0}; optional)
      "sets": {
        "street": [
          {"name": "bg", "file": "bg-street.png",
           "words": [{"x": 584, "y": 449, "size": 60, "text": "OPEN", "colour": "#f6d68a", "font": "sign"}]},
          {"name": "cart", "file": "cart.png", "cut": {"x": 1010, "bottom": 800, "width": 470}},
          {"name": "wall", "file": "wall.png", "box": [0, 0, 1600, 900], "k": 0.85}     (a box in world px: x, y, w, h)
        ]},
      "props": {"bun": "p-bun.png"}                                  (largest side 800 px)
    }

A layer with neither `cut` nor `box` is a full frame. `font` names an entry of `fonts` or is a path; without one the
first CJK-capable system font found is used (macOS Hiragino/PingFang/STHeiti, Windows YaHei, Noto/WenQuanYi on Linux).
"""
import json, pathlib, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SYSTEM_FONTS = [('/System/Library/Fonts/STHeiti Medium.ttc', 0), ('/System/Library/Fonts/PingFang.ttc', 0),
                ('/System/Library/Fonts/Hiragino Sans GB.ttc', 0), ('C:/Windows/Fonts/msyh.ttc', 0),
                ('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 0), ('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', 0),
                ('/System/Library/Fonts/Helvetica.ttc', 0), ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 0)]


def load_font(spec, size, base):
    path, idx = (spec['path'], spec.get('index', 0)) if isinstance(spec, dict) else (spec, 0)
    p = pathlib.Path(path).expanduser()
    p = p if p.is_absolute() else base / p
    return ImageFont.truetype(str(p), size, index=idx)


def default_font(size):
    for path, idx in SYSTEM_FONTS:
        if pathlib.Path(path).exists():
            return ImageFont.truetype(path, size, index=idx)
    return ImageFont.load_default()


def words(im, items, ox, oy, fonts, base):
    d = ImageDraw.Draw(im)
    for w in items:
        f = w.get('font')
        spec = fonts.get(f, f) if f else None
        font = load_font(spec, w['size'], base) if spec else default_font(w['size'])
        d.text((w['x'] - ox, w['y'] - oy), w['text'], fill=w.get('colour', '#ffffff'), font=font, anchor='mm')


def padded(im, pad, edge='mirror'):
    px, py = pad; W, H = im.size
    if edge == 'stretch':   # the outermost pixels repeated outwards (columns, then rows), softened
        out = Image.new('RGBA', (W + 2 * px, H + 2 * py)); out.paste(im, (px, py))
        out.paste(im.crop((0, 0, 1, H)).resize((px, H)), (0, py)); out.paste(im.crop((W - 1, 0, W, H)).resize((px, H)), (W + px, py))
        out.paste(out.crop((0, py, W + 2 * px, py + 1)).resize((W + 2 * px, py)), (0, 0))
        out.paste(out.crop((0, py + H - 1, W + 2 * px, py + H)).resize((W + 2 * px, py)), (0, py + H))
        out = out.filter(ImageFilter.GaussianBlur(12)); out.paste(im, (px, py)); return out
    out = Image.new('RGBA', (W + 2 * px, H + 2 * py))
    out.paste(im.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.FLIP_TOP_BOTTOM).resize((W + 2 * px, H + 2 * py)).filter(ImageFilter.GaussianBlur(12)))
    for dx, dy, flip, box in [(-px, 0, Image.FLIP_LEFT_RIGHT, (0, 0, px, H)), (W, 0, Image.FLIP_LEFT_RIGHT, (W - px, 0, W, H)),
                              (0, -py, Image.FLIP_TOP_BOTTOM, (0, 0, W, py)), (0, H, Image.FLIP_TOP_BOTTOM, (0, H - py, W, H))]:
        out.paste(im.crop(box).transpose(flip).filter(ImageFilter.GaussianBlur(3)), (dx + px, dy + py))
    out.paste(im, (px, py)); return out


def tight(im):   # crop a cut-out to its opaque part
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())


def main(manifest, site):
    mp = pathlib.Path(manifest).resolve(); base = mp.parent
    m = json.loads(mp.read_text(encoding='utf-8'))
    W, H = m.get('frame', [1600, 900]); pad = m.get('pad', [60, 34]); fonts = m.get('fonts', {})
    sets_js = pathlib.Path(site) / 'img/sets/sets.js'
    sets = json.loads(sets_js.read_text().split('=', 1)[1].strip().rstrip(';')) if sets_js.exists() else {}
    missing = [L['file'] for layers in m.get('sets', {}).values() for L in layers if not (base / L['file']).exists()]
    missing += [src for src in m.get('props', {}).values() if not (base / src).exists()]
    if missing: sys.exit(f'missing pictures (nothing changed): {missing}')
    for name, layers in m.get('sets', {}).items():
        out = sets_js.parent / name
        entry, made = [], []   # every layer is made before the set's old files go, so a failure leaves the set whole
        for L in layers:
            im = Image.open(base / L['file']).convert('RGBA')
            if 'cut' in L:
                c = L['cut']; im = tight(im); im = im.resize((c['width'], round(im.height * c['width'] / im.width)), Image.LANCZOS)
                b = [c['x'], c['bottom'] - im.height, c['width'], im.height]; words(im, L.get('words', []), b[0], b[1], fonts, base)
            elif 'box' in L:
                b = L['box']; im = im.resize((b[2], b[3]), Image.LANCZOS); words(im, L.get('words', []), b[0], b[1], fonts, base)
            else:
                im = im.resize((W, H), Image.LANCZOS); words(im, L.get('words', []), 0, 0, fonts, base)
                im = padded(im, pad, L.get('edge', 'mirror')); b = [-pad[0], -pad[1], W + 2 * pad[0], H + 2 * pad[1]]
            made.append((L['name'], im))
            entry.append({'name': L['name'], 'k': L.get('k', 1), 'box': b, 'soft': True})
            print(name, L['name'], b)
        out.mkdir(parents=True, exist_ok=True)
        for f in out.glob('*.webp'): f.unlink()
        for n, im in made:
            im.save(out / f'{n}.webp', quality=88, method=6)
            im.filter(ImageFilter.GaussianBlur(6)).save(out / f'{n}-soft.webp', quality=80, method=6)
        sets[name] = entry   # sets.js follows each finished set, so a later failure leaves files and entries in step
        tmp = sets_js.with_suffix('.tmp'); tmp.write_text('window.SETS = ' + json.dumps(sets) + ';\n'); tmp.replace(sets_js)
    props = pathlib.Path(site) / 'img/props'; props.mkdir(parents=True, exist_ok=True)
    for name, src in m.get('props', {}).items():
        im = tight(Image.open(base / src).convert('RGBA')); im.thumbnail((800, 800), Image.LANCZOS)
        im.save(props / f'{name}.webp', quality=88, method=6); print('prop', name, im.size)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__); sys.exit(0 if sys.argv[1:] in (['-h'], ['--help']) else 2)
    main(*sys.argv[1:3])
