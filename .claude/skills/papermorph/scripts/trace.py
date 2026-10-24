#!/usr/bin/env python3
"""Line drawing (dark lines on light paper) -> centreline strokes, ordered like a hand draws, for a draw-on animation.

    uv run --with scikit-image --with pillow python trace.py IN.png OUT.svg [--width 900] [--min 12]
    ... --lines site/<book>/lib/lines.js [--name NAME]      # also add or replace LINES[NAME] (default: OUT's stem)

The drawing is scaled to --width, thresholded, skeletonised and walked into strokes (endpoints first, stopping at
junctions, loops last); strokes shorter than --min px are dropped. Draw order runs top to bottom, each stroke chaining
to the nearest unfinished one. OUT.svg holds one <path data-len> per stroke, to look at. --lines writes the entry
the documentary kit's traced() reads: LINES[name] = {box: [x0, y0, x1, y1] of the strokes, p: [path d], l: [lengths]}.
"""
import argparse, json, pathlib
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize
from skimage.measure import approximate_polygon

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--width", type=int, default=900)
ap.add_argument("--min", type=float, default=12, help="drop strokes shorter than this (px)")
ap.add_argument("--lines", help="lines.js to add or replace this drawing's entry in")
ap.add_argument("--name", help="its key in LINES (default: OUT's file name without .svg)")
a = ap.parse_args()

src = Image.open(a.src).convert("RGBA")   # transparent paper counts as white paper
im = Image.alpha_composite(Image.new("RGBA", src.size, "white"), src).convert("L")
im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
ink = np.asarray(im) < 140
sk = skeletonize(ink)
H, W = sk.shape
pts = set(zip(*np.nonzero(sk)))
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
nb = lambda p: [(p[0] + dy, p[1] + dx) for dy, dx in N8 if (p[0] + dy, p[1] + dx) in pts]

# walk the skeleton: start at endpoints, stop at junctions; every edge used once; loops last
used, strokes = set(), []
def walk(p):
    path = [p]
    while True:
        nxt = [q for q in nb(p) if frozenset((p, q)) not in used]
        if not nxt:
            return path
        q = nxt[0]; used.add(frozenset((p, q))); path.append(q); p = q
        if len(nb(p)) > 2:
            return path
ends = [p for p in pts if len(nb(p)) == 1] + [p for p in pts if len(nb(p)) > 2] + list(pts)
for p in ends:
    while any(frozenset((p, q)) not in used for q in nb(p)):
        s = walk(p)
        if len(s) > 1:
            strokes.append(s)

def length(s):
    return float(np.sum(np.hypot(*np.diff(np.array(s, float), axis=0).T)))
strokes = [approximate_polygon(np.array(s, float), 0.8) for s in strokes if length(s) >= a.min]
if not strokes:
    raise SystemExit("no strokes: is it dark lines on light paper?")
# draw order: like a hand, top to bottom, chaining to the nearest unfinished stroke
order, left = [], strokes[:]
cur = min(left, key=lambda s: s[:, 0].min())
while left:
    left = [s for s in left if s is not cur]; order.append(cur)
    if not left:
        break
    end = cur[-1]
    best = min(left, key=lambda s: min(np.hypot(*(s[0] - end)), np.hypot(*(s[-1] - end))))
    if np.hypot(*(best[-1] - end)) < np.hypot(*(best[0] - end)):
        best = best[::-1]
    cur = best
ds = [f'M{" L".join(f"{x:.1f} {y:.1f}" for y, x in s)}' for s in order]
lens = [f"{length(s):.1f}" for s in order]
paths = "\n".join(f'<path d="{d}" data-len="{l}"/>' for d, l in zip(ds, lens))
open(a.out, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">\n{paths}\n</svg>\n')
print(f"{len(order)} strokes, {sum(length(s) for s in order):.0f} px of line")

if a.lines:
    all_ = np.concatenate(order)
    entry = {"box": [round(all_[:, 1].min()), round(all_[:, 0].min()), round(all_[:, 1].max()), round(all_[:, 0].max())],
             "p": ds, "l": [round(float(l)) for l in lens]}
    lf = pathlib.Path(a.lines)
    head, data = "// centreline traces of line drawings (trace.py)\n", {}
    if lf.exists():
        t = lf.read_text()
        i = t.index("window.LINES"); head, data = t[:i], json.loads(t[t.index("{", i):t.rindex("}") + 1])
    data[a.name or pathlib.Path(a.out).stem] = entry
    lf.write_text(head + "window.LINES = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(len(data), "drawings in", lf)
