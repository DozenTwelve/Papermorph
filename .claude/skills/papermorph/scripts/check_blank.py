#!/usr/bin/env python3
"""Find opening blanks: the narration has started but the picture is still empty.

    python3 SKILL/scripts/serve.py 8765 site &
    uv run --with playwright check_blank.py site                       # every chapter of the book in site/
    uv run --with playwright check_blank.py site/history ch05 ch06 --url http://localhost:8765/history/
    LIMIT=0.6 uv run --with playwright check_blank.py site             # stricter

book_dir holds the chNN folders; --url is where that folder is served. For each lesson beat
(question beats are skipped) whose picture stays empty longer than LIMIT seconds (default 1)
near its start, prints: chapter, beat index, beat id, empty from, empty until, seconds.
Otherwise it prints one line saying none were found. Exit status 1 when something is found.
A lesson tool: a picture book's painted set is always on stage, so a picture-book chapter (paper.js loaded) is
skipped with a note; check its openings with strip.py and still.py.
"""
import argparse, asyncio, os, sys
from pathlib import Path
from playwright.async_api import async_playwright
from browsers import exe

LIMIT = float(os.environ.get("LIMIT", "1.0"))
PROBE = r"""
(i) => {
  seek(i, false);
  const b = BEATS[i], tm = TIMINGS[b.id], pre = b.pre || 0, first = pre + (tm.cues[0] || [0])[0];   // the speech starts `pre` s in
  const visible = () => {   // drawn leaves whose opacity, multiplied up to the scene, is above .05
    let n = 0;
    for (const e of scene.querySelectorAll('text,path,circle,rect,ellipse,line,polygon,image')) {
      if (e.closest('.qlayer')) continue;
      let o = 1, x = e;
      while (x && x !== scene) { o *= +(x.getAttribute('opacity') ?? 1); if (x.style && x.style.visibility === 'hidden') o = 0; x = x.parentNode; }
      const r = e.getBoundingClientRect();
      if (o >= .05 && (r.width >= 2 || r.height >= 2)) n++;
    }
    return n;
  };
  const out = [];
  for (let t = 0; t <= Math.min(P.end, pre + 12); t += .2) { P.t = t; evalTo(t); out.push([+t.toFixed(1), visible()]); }
  return { id: b.id, ask: !!b.ask, first, dur: P.end, out };
}
"""


async def main(book: Path, chapters, url):
    found, checked = [], []
    async with async_playwright() as p:
        browser = await p.chromium.launch(**exe())
        pg = await browser.new_page(viewport={"width": 1600, "height": 960})
        for ch in chapters:
            await pg.goto(f"{url}{ch}/index.html?beat=0&t=0"); await pg.wait_for_timeout(300)
            if await pg.evaluate("typeof jit === 'function'"):
                print(f"{ch}: a picture book, skipped (check_blank is for lessons; use strip.py and still.py)"); continue
            checked.append(ch)
            for i in range(await pg.evaluate("BEATS.length")):
                r = await pg.evaluate(PROBE, i)
                if r["ask"] or r["id"] == "finish":
                    continue
                empty = [t for t, c in r["out"] if c == 0]
                if not empty or empty[0] >= 3:
                    continue
                start = max(empty[0], r["first"])
                end = next((t for t, c in r["out"] if t > empty[0] and c > 0), r["dur"])
                if end - start > LIMIT:
                    found.append((ch, i, r["id"], round(start, 1), round(end, 1), round(end - start, 1)))
        await browser.close()
    for row in found:
        print(*row)
    if not found and checked: print(f"no opening blanks in {', '.join(checked)}")
    return 1 if found else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("book_dir", type=Path)
    ap.add_argument("chapters", nargs="*")
    ap.add_argument("--url", default="http://localhost:8765/")
    a = ap.parse_args()
    if not a.book_dir.is_dir():
        ap.error(f"book directory does not exist: {a.book_dir}")
    chs = a.chapters or sorted(d.name for d in a.book_dir.glob("ch[0-9][0-9]") if d.is_dir())
    if not chs:
        ap.error(f"no chapter folders in {a.book_dir}")
    missing = [ch for ch in chs if not (a.book_dir / ch / "index.html").is_file()]
    if missing:
        ap.error(f"chapter pages not found: {', '.join(missing)}")
    sys.exit(asyncio.run(main(a.book_dir, chs, a.url if a.url.endswith("/") else a.url + "/")))
