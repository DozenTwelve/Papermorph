#!/usr/bin/env python3
"""Cut image-model pictures drawn on a flat key colour (magenta) into transparent pieces: puppet parts and props.

    uv run --with pillow --with numpy --with scipy python cutout.py books/<book>/art/gen/doc-body.png --out site/<book>/img/cast
    uv run --with pillow --with numpy --with scipy python cutout.py books/<book>/art/gen/props.png --out site/<book>/img/props \\
        --split --names sign,notebook,cigar --sheet books/<book>/review/props.jpg

An image model cannot paint transparency, so ask it for the figure or the props on one flat colour none of them uses
(magenta, #ff00ff, for most casts; green for a pink or purple character) and cut them out here. The key is the
picture's border colour (--key HEX to give it). Every edge pixel is unmixed from the key, not just thresholded: its
alpha comes from how far it is from the key and its colour has the key taken out, so no pink or white fringe is left
on a dark set. Each picture becomes one piece, or with --split one piece per separate shape (a sheet of props, a head
and a body drawn apart: ask for them apart, it is cheaper than splitting one figure), numbered left to right in rows
and printed with its centre, so --names can name them in that order on the next run. Shapes under --min pixels
(default 1500, specks of noise) are dropped and counted.

Writes OUT/<name>.webp (cropped to the piece) and OUT/pieces.json: each piece's source, its box in the source picture
[x, y, w, h], and its feet (bottom centre, in the piece's own pixels), which is where a standing figure's builder pins
it. --sheet writes a contact sheet of every piece on dark, light and checked grounds with its name and size: look at it
after every batch, for a fringe on the dark ground, holes, and a part of the figure that went see-through.

Says what it could not do: a picture whose border is not one flat colour stops with the colours it found; a piece that
touches the picture's edge was cut off by the frame (ask for more room around it); a piece with see-through patches
inside has colours near the key (a purple coat on magenta): pick another key colour and generate it again.
"""
import argparse, json, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

LO, HI = 60, 170   # distance from the key (0-441) at which a pixel starts to count, and where it is wholly the figure's


def border_key(p):
    """The flat colour round the picture's edge, or a stop naming what was there instead."""
    edge = np.concatenate([p[:3].reshape(-1, 3), p[-3:].reshape(-1, 3), p[:, :3].reshape(-1, 3), p[:, -3:].reshape(-1, 3)])
    k = np.median(edge, axis=0)
    near = (np.linalg.norm(edge - k, axis=1) < 40).mean()
    if near < .8:
        sys.exit(f"the picture's border is not one flat colour (only {near:.0%} near {hexs(k)}): ask the model for a flat key "
                 "background reaching every edge, or give --key")
    return k


hexs = lambda c: '#%02x%02x%02x' % tuple(int(round(v)) for v in c)


def unkey(p, k):
    """RGBA float array: alpha from the distance to the key, colour with the key unmixed out of every edge pixel."""
    d = np.linalg.norm(p - k, axis=2)
    a = np.clip((d - LO) / (HI - LO), 0, 1)
    c = (p - (1 - a[..., None]) * k) / np.maximum(a[..., None], 1e-3)
    return np.dstack([np.clip(c, 0, 255), a * 255])


def pieces(rgba, split, least):
    """[(mask, box)] of the picture's pieces, in rows left to right; and how many specks were dropped."""
    solid = rgba[..., 3] > 128
    if not split:
        return ([solid | (rgba[..., 3] > 8)] if solid.any() else []), 0
    lab, n = nd.label(nd.binary_closing(solid, iterations=4))
    found, specks = [], 0
    for i, sl in enumerate(nd.find_objects(lab), 1):
        m = lab == i
        if m.sum() < least: specks += 1; continue
        found.append(nd.binary_dilation(m, iterations=3) & (rgba[..., 3] > 8))   # the soft edge round it too
    rows = max(1, rgba.shape[0] // 6)   # pieces whose centres lie within a sixth of the height count as one row
    cy = lambda m: np.argwhere(m)[:, 0].mean()
    found.sort(key=lambda m: (int(cy(m) // rows), np.argwhere(m)[:, 1].mean()))
    return found, specks


def checker(w, h, s=16):
    im = Image.new('RGB', (w, h), (205, 205, 205)); d = ImageDraw.Draw(im)
    for y in range(0, h, s):
        for x in range((y // s) % 2 * s, w, 2 * s): d.rectangle([x, y, x + s - 1, y + s - 1], fill=(250, 250, 250))
    return im


def sheet(made, path):
    """Each piece on dark, light and checked ground, one row a piece, its name and size above."""
    T = 220
    rows = []
    for name, im in made:
        t = im.copy(); t.thumbnail((T, T))
        row = Image.new('RGB', (3 * (T + 12) + 12, T + 34), (40, 40, 40))
        ImageDraw.Draw(row).text((12, 6), f'{name}  {im.width}x{im.height}', fill=(255, 230, 120))
        for k, ground in enumerate((Image.new('RGB', (T, T), (27, 27, 27)), Image.new('RGB', (T, T), (242, 239, 230)), checker(T, T))):
            ground.paste(t, ((T - t.width) // 2, (T - t.height) // 2), t)
            row.paste(ground, (12 + k * (T + 12), 26))
        rows.append(row)
    S = Image.new('RGB', (rows[0].width, sum(r.height for r in rows)), (40, 40, 40))
    y = 0
    for r in rows: S.paste(r, (0, y)); y += r.height
    path.parent.mkdir(parents=True, exist_ok=True); S.convert('RGB').save(path, quality=88)
    print('sheet', path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src', nargs='+', type=pathlib.Path, help='pictures on a flat key colour')
    ap.add_argument('--out', type=pathlib.Path, required=True, help='folder for the pieces and pieces.json')
    ap.add_argument('--key', help='the key colour as #rrggbb (default: the picture border\'s)')
    ap.add_argument('--split', action='store_true', help='one piece per separate shape (a sheet of props)')
    ap.add_argument('--names', help='comma-separated names for the pieces, in the printed order (one picture)')
    ap.add_argument('--min', type=int, default=1500, help='drop shapes under this many pixels (default 1500)')
    ap.add_argument('--sheet', type=pathlib.Path, help='a contact sheet of the pieces on dark, light and checked grounds')
    a = ap.parse_args()
    names = a.names.split(',') if a.names else None
    if names and len(a.src) > 1: ap.error('--names names the pieces of one picture')
    a.out.mkdir(parents=True, exist_ok=True)
    jf = a.out / 'pieces.json'
    meta = json.loads(jf.read_text()) if jf.exists() else {}
    made, bad = [], 0
    for src in a.src:
        p = np.asarray(Image.open(src).convert('RGB')).astype(float)
        k = np.array([int(a.key.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)], float) if a.key else border_key(p)
        rgba = unkey(p, k)
        found, specks = pieces(rgba, a.split, a.min)
        if not found: print(f'{src.name}: nothing but the key colour {hexs(k)} in it'); bad += 1; continue
        if names and len(names) != len(found):
            print(f'{src.name}: {len(found)} pieces but {len(names)} names: the pieces are numbered below; name them all')
            names = None
        H, W = rgba.shape[:2]
        for i, m in enumerate(found):
            name = names[i] if names else src.stem if len(found) == 1 else f'{src.stem}-{i + 1}'
            ys, xs = np.nonzero(m)
            x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            piece = rgba.copy(); piece[~m, 3] = 0
            piece = piece[y0:y1, x0:x1]
            im = Image.fromarray(piece.astype(np.uint8), 'RGBA')
            im.save(a.out / f'{name}.webp', quality=92)
            solid = piece[..., 3] > 250
            feet = [round(float(np.nonzero(solid[-1] if solid[-1].any() else piece[-1, :, 3] > 8)[0].mean()), 1), int(y1 - y0)]
            meta[name] = {'source': src.name, 'box': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)], 'feet': feet}
            warn = []
            if x0 == 0 or y0 == 0 or x1 == W or y1 == H: warn.append('touches the picture\'s edge: cut off by the frame? ask for more room round it')
            inner = nd.binary_erosion(piece[..., 3] > 8, iterations=6)
            holes = (inner & (piece[..., 3] < 200)).sum() / max(1, inner.sum())
            if holes > .005: warn.append(f'{holes:.1%} of its inside is part see-through: colours near the key {hexs(k)}; generate it on another key')
            print(f'{name:16s} from {src.name}: centre {(x0 + x1) / 2:.0f},{(y0 + y1) / 2:.0f}  box {x0},{y0} {x1 - x0}x{y1 - y0}'
                  + ''.join(f'\n  WARNING {w}' for w in warn))
            bad += bool(warn); made.append((name, im))
        if specks: print(f'{src.name}: {specks} specks under --min {a.min} px dropped')
    jf.write_text(json.dumps(meta, indent=1))
    print(f'{len(made)} pieces in {a.out} (pieces.json)')
    if a.sheet and made: sheet(made, a.sheet)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
