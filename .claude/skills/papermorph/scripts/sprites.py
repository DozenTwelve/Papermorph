#!/usr/bin/env python3
"""Common image steps for a book's processing script, whatever the style. Import it, or use the commands:

    uv run --with pillow sprites.py scale IN.png OUT.png --k 8                   # integer nearest-neighbour scale
    uv run --with pillow sprites.py recolor IN.png OUT.png --map ffd83d=bba8ee  # exact colour swaps (repeat --map)
    uv run --with pillow sprites.py art ROWS.txt OUT.png --k 8                  # pixel art from text rows
    uv run --with pillow sprites.py sheet OUT.png FRAMES.json                   # frames -> one sheet + layout

ROWS.txt: palette lines "X=#rrggbb", then one text row per pixel row; "." is transparent.
FRAMES.json: {"walk": ["walk1.png", "walk2.png"], "stand": ["stand.png"]}; every frame has the same size. Writes the
sheet (a row per animation) and OUT.json {"w", "h", "anims": {name: {"row", "n"}}} for a nested-<svg> viewBox player.
Scale pixel art last, after recolouring, so colours stay exact.
"""
import argparse, json
from pathlib import Path
from PIL import Image

hexc = lambda h: tuple(int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))

def scale(im, k):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)

def recolor(im, mapping):
    """mapping: {(r, g, b): (r, g, b)}; exact matches on opaque pixels only."""
    im = im.convert("RGBA"); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            c = px[x, y]
            if c[3] and c[:3] in mapping: px[x, y] = (*mapping[c[:3]], 255)
    return im

def art(rows, pal):
    """rows: strings, one char per pixel; pal: {char: (r, g, b)}; '.' is transparent."""
    im = Image.new("RGBA", (max(map(len, rows)), len(rows)))
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != ".": im.putpixel((x, y), (*pal[ch], 255))
    return im

def sheet(anims):
    """anims: {name: [Image, ...]} -> (sheet, layout)."""
    w, h = next(iter(anims.values()))[0].size
    odd = [f"{n}[{k}] {f.size}" for n, fs in anims.items() for k, f in enumerate(fs) if f.size != (w, h)]
    if odd: raise ValueError(f"every frame must be {w}x{h}: {odd[:5]}")
    cols = max(len(f) for f in anims.values())
    S = Image.new("RGBA", (w * cols, h * len(anims)))
    layout = {"w": w, "h": h, "anims": {}}
    for row, (name, frames) in enumerate(anims.items()):
        for k, f in enumerate(frames): S.paste(f, (k * w, row * h))
        layout["anims"][name] = {"row": row, "n": len(frames)}
    return S, layout

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["scale", "recolor", "art", "sheet"]); ap.add_argument("a"); ap.add_argument("b")
    ap.add_argument("--k", type=int, default=1); ap.add_argument("--map", action="append", default=[])
    o = ap.parse_args()
    if o.cmd == "scale": scale(Image.open(o.a), o.k).save(o.b, optimize=True)
    elif o.cmd == "recolor":
        m = dict(tuple(map(hexc, s.split("="))) for s in o.map)
        scale(recolor(Image.open(o.a), m), o.k).save(o.b, optimize=True)
    elif o.cmd == "art":
        lines = [l.rstrip("\n") for l in open(o.a) if l.strip()]
        pal = {l[0]: hexc(l[2:].strip()) for l in lines if len(l) > 2 and l[1] == "="}
        scale(art([l for l in lines if not (len(l) > 2 and l[1] == "=")], pal), o.k).save(o.b, optimize=True)
    else:
        spec = json.load(open(o.b)); base = Path(o.b).parent
        S, layout = sheet({n: [Image.open(base / f).convert("RGBA") for f in fs] for n, fs in spec.items()})
        S.save(o.a, optimize=True); Path(o.a).with_suffix(".json").write_text(json.dumps(layout))
