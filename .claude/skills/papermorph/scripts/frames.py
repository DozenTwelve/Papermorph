#!/usr/bin/env python3
"""A generated clip (video.py) -> ink-line frames on one sprite sheet, the same treatment as prep.py's line mode.

    uv run --with pillow --with numpy python frames.py books/<book>/art/video/chained.mp4 chained --out site/<book>/img
    ... [--fps 12] [--side 560] [--cols 10] [--ink 243,237,224]

Every frame is scaled to side x side, its paper made transparent and its lines drawn in --ink, then laid out in rows
of --cols. Writes OUT/<name>-sheet.webp (quality 80) and adds <name>: {fw, fh, cols, n, fps} to OUT/frames.js
(window.FRAMES), which the documentary kit's anim() plays on the beat clock. Needs ffmpeg. Keep clips short: a 5 s
clip at 12 fps and 560 px is about 4 MB.
"""
import argparse, json, pathlib, subprocess
import numpy as np
from PIL import Image
from prep import CREAM, ink, rgb

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("src"); ap.add_argument("name")
ap.add_argument("--out", required=True, help="the book's img folder, e.g. site/<book>/img")
ap.add_argument("--fps", type=int, default=12); ap.add_argument("--side", type=int, default=560); ap.add_argument("--cols", type=int, default=10)
ap.add_argument("--ink", type=rgb, default=CREAM, help="line colour r,g,b")
a = ap.parse_args()
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.src, "-vf", f"fps={a.fps},scale={a.side}:{a.side}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, a.side, a.side, 3)
n, cols = len(fr), a.cols; rows = -(-n // cols)
sheet = Image.new("RGBA", (cols * a.side, rows * a.side), tuple(a.ink) + (0,))
for i, f in enumerate(fr):
    sheet.paste(ink(f, a.ink), ((i % cols) * a.side, (i // cols) * a.side))
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
dst = out / f"{a.name}-sheet.webp"; sheet.save(dst, quality=80, method=5)
jf = out / "frames.js"
data = json.loads(jf.read_text().split("=", 1)[1].rstrip().rstrip(";")) if jf.exists() else {}
data[a.name] = {"fw": a.side, "fh": a.side, "cols": cols, "n": n, "fps": a.fps}
jf.write_text("window.FRAMES = " + json.dumps(data) + ";\n")
print(n, "frames ->", dst, round(dst.stat().st_size / 1e6, 2), "MB")
