#!/usr/bin/env python3
"""Found or generated pictures -> a documentary's two treatments, plus img/art.js (sizes for the page).

    uv run --with pillow --with numpy python prep.py books/<book>/art/prep.json --src books/<book>/art/found --out site/<book>/img
    ... [--ink 243,237,224] [--paper 243,237,224]

line:  dark lines on light paper -> ink-coloured lines on transparent (the paper drops out), cropped to the ink.
       The brightest channel decides, so coloured library stamps drop out with the paper and light plate marks and
       stains stay paper. An inset (0.09 = 9 % a side) shaves a printed plate mark off the edges of the ink box.
print: any picture -> a paper-coloured border and a soft baked shadow, slightly larger than the picture; a near-black
       scanner mat at the edges is trimmed first (never more than 6 % a side).

The list is JSON: [[name, file, mode, max side], ...], a line entry optionally followed by [inset, [r, g, b]] (its own
ink colour, e.g. dark lines for a light map). Files are relative to --src (absolute paths pass through). Writes
OUT/<name>.webp (quality 88) and updates OUT/art.js, window.ART = {name: [w, h]}; entries of other names are kept,
so several lists (one per source folder) can write into one art.js. --ink and --paper default to the cream of the
documentary kit's CREAM.
"""
import argparse, json, pathlib
import numpy as np
from PIL import Image, ImageFilter

CREAM = (243, 237, 224)


def ink(rgb, colour=CREAM):
    """RGB picture or array -> RGBA: dark lines in `colour`, paper transparent (shared with frames.py)."""
    a = np.asarray(rgb, float).max(axis=2)   # brightest channel: coloured stamps drop out with the paper
    # paper -> 0, ink -> 255, with a soft knee so hatching keeps its weight; light plate marks and stains stay paper
    alpha = np.clip((190 - a) / (190 - 60), 0, 1) ** .8 * 255
    im = Image.new("RGBA", (a.shape[1], a.shape[0]), tuple(colour) + (0,))
    im.putalpha(Image.fromarray(alpha.astype("uint8")))
    return im


def line(src, side, inset=0, colour=CREAM):
    rgba = ink(Image.open(src).convert("RGB"), colour)
    box = rgba.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    if not box:
        return None
    if inset:   # shave a printed plate mark off the edges of the ink box
        dx, dy = int((box[2] - box[0]) * inset), int((box[3] - box[1]) * inset)
        box = (box[0] + dx, box[1] + dy, box[2] - dx, box[3] - dy)
    rgba = rgba.crop(box)
    rgba.thumbnail((side, side), Image.LANCZOS)
    return rgba


def print_(src, side, paper=CREAM, border=16, pad=40):
    im = Image.open(src).convert("RGB")
    g = np.asarray(im.convert("L"), float)   # trim a near-black scanner mat at the edges (never more than 6 % a side)
    def edge(means):
        n, lim = len(means), int(len(means) * .06)
        a = next((i for i in range(lim) if means[i] > 30), lim); b = next((i for i in range(lim) if means[n - 1 - i] > 30), lim)
        return a, n - b
    (y0, y1), (x0, x1) = edge(g.mean(1)), edge(g.mean(0))
    im = im.crop((x0, y0, x1, y1))
    im.thumbnail((side, side), Image.LANCZOS)
    w, h = im.size[0] + 2 * border, im.size[1] + 2 * border
    W, H = w + 2 * pad, h + 2 * pad
    sh = Image.new("L", (W, H), 0); sh.paste(150, (pad + 8, pad + 14, pad + 8 + w, pad + 14 + h))
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    out = Image.new("RGBA", (W, H), (20, 4, 6, 0)); out.putalpha(sh)
    card = Image.new("RGBA", (w, h), tuple(paper) + (255,)); card.paste(im, (border, border))
    out.alpha_composite(card, (pad, pad))
    return out


def rgb(s):
    return tuple(int(v) for v in s.split(","))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("list", help="JSON list of [name, file, mode, side, (inset, [r,g,b])]")
    ap.add_argument("--src", default=".", help="folder the list's files are in")
    ap.add_argument("--out", required=True, help="the book's img folder, e.g. site/<book>/img")
    ap.add_argument("--ink", type=rgb, default=CREAM, help="line colour r,g,b")
    ap.add_argument("--paper", type=rgb, default=CREAM, help="print border colour r,g,b")
    a = ap.parse_args()
    src, out = pathlib.Path(a.src), pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    jf = out / "art.js"
    t = jf.read_text() if jf.exists() else ""
    sizes = json.loads(t[t.index("{", t.index("window.ART")):t.rindex("}") + 1]) if t else {}
    for name, f, mode, side, *rest in json.loads(pathlib.Path(a.list).read_text()):
        if mode == "line":
            im = line(src / f, side, rest[0] if rest else 0, rest[1] if len(rest) > 1 else a.ink)
            if im is None:
                print(f"{name}: WARNING no lines in {f} (is it dark lines on light paper?), skipped"); continue
        elif mode == "print":
            im = print_(src / f, side, a.paper)
        else:
            raise SystemExit(f"{name}: mode {mode!r} is not line or print")
        im.save(out / f"{name}.webp", quality=88, method=5)
        sizes[name] = [im.width, im.height]
        print(name, mode, im.width, im.height)
    jf.write_text("window.ART = " + json.dumps(sizes, separators=(",", ":")) + ";\n")
    print(len(sizes), "pictures in", jf)


if __name__ == "__main__":
    main()
