#!/usr/bin/env python3
"""Draft sections.json (the page map of a book) from the PDF's bookmarks.

    uv run --with pymupdf outline.py book.pdf                 # show the bookmark tree
    uv run --with pymupdf outline.py book.pdf --level 2 -o sections.json

--level is the bookmark depth that marks chapters (look at the tree first). The parent
bookmarks one level up (units, parts) are recorded as each chapter's "unit"; a unit's
title pages are put at the start of its first chapter, and "chapter_start" keeps the
page where the chapter itself begins. Pages before the first chapter become
"00_front"; pages after the last chapter's own bookmark range become "99_back".
Every PDF page lands in exactly one section, numbered by PDF page order (from 1),
not by printed page numbers.

Without usable chapter bookmarks, render the contents using split_pages.py book.pdf
--pages 1-12, then write sections.json from those pages. Its JSON array covers every
PDF page once:
[{"folder":"00_front","title":"Front matter","start":1,"end":12},
 {"folder":"ch01","title":"Chapter title","start":13,"end":40,"unit":"Part one"}, ...]
Adjust boundaries to the actual PDF; start/end are inclusive PDF page numbers.
"""
import argparse
import json
import sys
from pathlib import Path

import pymupdf

FLAT_PDF_HINT = ("Render contents with split_pages.py book.pdf --pages 1-12, "
                 "then write sections.json from them (schema: outline.py --help).")


def main():
    # Captured output (a pipe) uses the system code page on Windows; bookmark titles may be any language.
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", type=Path)
    ap.add_argument("--level", type=int, help="bookmark depth of chapters; omit to print the tree")
    ap.add_argument("-o", "--output", type=Path, help="write sections.json here (default: print)")
    a = ap.parse_args()
    doc = pymupdf.open(a.pdf)
    toc = doc.get_toc()                     # [level, title, page]
    n = len(doc)
    if not toc:
        sys.exit(f"No bookmarks. {FLAT_PDF_HINT}")
    if a.level is None:
        for lv, title, page in toc:
            print(f"{'  ' * (lv - 1)}[{lv}] p{page}  {title}")
        if len(toc) < 2:
            print(f"\n{n} pages, one bookmark: it does not split the book into chapters. {FLAT_PDF_HINT}")
        else:
            print(f"\n{n} pages. Rerun with --level N (the depth whose entries are chapters).")
        return

    chapters = [(i, t, p) for i, (lv, t, p) in enumerate(toc) if lv == a.level and p >= 1]
    if not chapters:
        sys.exit(f"No bookmarks at level {a.level}.")
    # The first bookmark after the last chapter that is not inside it (an index, appendix, ...) ends the chapters.
    last_i = chapters[-1][0]
    after = next((p for lv, t, p in toc[last_i + 1:] if lv <= a.level and p > chapters[-1][2]), n + 1)

    def parent(i):
        for lv, t, p in reversed(toc[:i]):
            if lv < a.level:
                return t, p
        return None, None

    sections, starts = [], []
    for k, (i, title, page) in enumerate(chapters):
        unit, upage = parent(i)
        first_in_unit = unit is not None and (k == 0 or parent(chapters[k - 1][0])[0] != unit)
        start = upage if first_in_unit and upage < page else page
        starts.append(start)
        s = {"folder": f"ch{k + 1:02d}", "title": title, "start": start, "end": None, "chapter_start": page}
        if unit:
            s["unit"] = unit
        sections.append(s)
    for k, s in enumerate(sections):
        s["end"] = (starts[k + 1] if k + 1 < len(starts) else after) - 1
    if starts[0] > 1:
        sections.insert(0, {"folder": "00_front", "title": "Front matter", "start": 1, "end": starts[0] - 1})
    if after <= n:
        sections.append({"folder": "99_back", "title": "Back matter", "start": after, "end": n})
    for s in sections:
        if s["end"] < s["start"]:
            sys.exit(f"Bad range for {s['folder']} ({s['start']}-{s['end']}); bookmarks out of order? Fix by hand.")
    text = json.dumps(sections, ensure_ascii=False, indent=2) + "\n"
    if a.output:
        a.output.write_text(text, encoding="utf-8")
        print(f"{len(sections)} sections, {sum(1 for s in sections if s['folder'].startswith('ch'))} chapters -> {a.output}")
    else:
        print(text)
    if len(chapters) < 2:
        sys.stdout.flush()                  # keep the hint after the result when both streams are captured
        print(f"One chapter at level {a.level}. If the book has more chapters, its bookmarks do not mark them. "
              f"{FLAT_PDF_HINT}", file=sys.stderr)


if __name__ == "__main__":
    main()
