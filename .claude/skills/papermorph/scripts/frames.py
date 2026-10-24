#!/usr/bin/env python3
"""A generated clip (video.py) -> ink-line frames on one sprite sheet, the same treatment as prep.py's line mode.

    uv run --with pillow --with numpy python frames.py books/<book>/art/video/chained.mp4 chained --out site/<book>/img
    ... [--fps 12] [--side 560] [--cols 10] [--ink 243,237,224]

Every frame is scaled to fit side x side with its aspect kept (a 16:9 clip makes 560 x 315 cells), its paper made
transparent and its lines drawn in --ink, then laid out in rows of --cols. A WebP is at most 16383 px a side, so a sheet
that would be larger stops the script first, saying how many frames fit. Writes OUT/<name>-sheet.webp (quality 80) and adds <name>: {fw, fh, cols, n, fps} to OUT/frames.js
(window.FRAMES), which the documentary kit's anim() plays on the beat clock. Needs ffmpeg. Keep clips short: a 5 s
clip at 12 fps and 560 px is about 4 MB.
"""
import argparse, json, math, pathlib, subprocess
import numpy as np
from PIL import Image
from prep import CREAM, ink, rgb

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("src"); ap.add_argument("name")
ap.add_argument("--out", required=True, help="the book's img folder, e.g. site/<book>/img")
ap.add_argument("--fps", type=int, default=12); ap.add_argument("--side", type=int, default=560); ap.add_argument("--cols", type=int, default=10)
ap.add_argument("--ink", type=rgb, default=CREAM, help="line colour r,g,b")
a = ap.parse_args()
def run(cmd):
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode: raise SystemExit(r.stderr.decode(errors="replace").strip() or f"{cmd[0]} failed")
    return r.stdout
info = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", a.src]))
w, h = info["streams"][0]["width"], info["streams"][0]["height"]
fw, fh = (a.side, max(1, round(a.side * h / w))) if w >= h else (max(1, round(a.side * w / h)), a.side)
cols = a.cols
def fits(n):   # a WebP is at most 16383 px a side
    if cols * fw > 16383: raise SystemExit(f"{cols} columns of {fw} px exceed WebP's 16383 px: use --cols {16383 // fw} or less")
    if -(-n // cols) * fh > 16383: raise SystemExit(f"{n} frames exceed WebP's 16383 px: at most {cols * (16383 // fh)} fit; shorten the clip or lower --fps or --side")
fits(math.ceil(float(info["format"]["duration"]) * a.fps))
raw = run(["ffmpeg", "-v", "error", "-i", a.src, "-vf", f"fps={a.fps},scale={fw}:{fh}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
fr = np.frombuffer(raw, np.uint8).reshape(-1, fh, fw, 3)
n = len(fr); fits(n); rows = -(-n // cols)
sheet = Image.new("RGBA", (cols * fw, rows * fh), tuple(a.ink) + (0,))
for i, f in enumerate(fr):
    sheet.paste(ink(f, a.ink), ((i % cols) * fw, (i // cols) * fh))
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
dst = out / f"{a.name}-sheet.webp"; sheet.save(dst, quality=80, method=5)
jf = out / "frames.js"
t = jf.read_text() if jf.exists() else ""
data = json.loads(t[t.index("{", t.index("window.FRAMES")):t.rindex("}") + 1]) if t else {}
data[a.name] = {"fw": fw, "fh": fh, "cols": cols, "n": n, "fps": a.fps}
jf.write_text("window.FRAMES = " + json.dumps(data) + ";\n")
print(n, "frames ->", dst, round(dst.stat().st_size / 1e6, 2), "MB")
