#!/usr/bin/env python3
"""Extract a book by its page map, or preview a page range before a map exists.

    uv run --with pymupdf split_pages.py book.pdf --sections sections.json --out book_pages
    uv run --with pymupdf split_pages.py book.pdf --list            # check the map only
    uv run --with pymupdf split_pages.py book.pdf --only ch05       # one section
    uv run --with pymupdf split_pages.py book.pdf --text-only        # text layer only, no images
    uv run --with pymupdf split_pages.py book.pdf --pages 1-12       # preview/, no sections.json needed

Each section folder also gets text.md: the PDF's own text layer, page by page. Read that
first; open a page image only for diagrams, layout or text the layer gets wrong (it is far
cheaper than an image). Scanned books have no text layer, so text.md comes out empty.

Files are named page_NNNN.png by PDF page order (from 1), never by printed page numbers.
The script refuses a map with gaps or overlaps, and refuses to overwrite existing images
unless --overwrite is given. The pages are a private reference for the author; they are
never published with the site.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import pymupdf


def main():
    # Captured output (a pipe) uses the system code page on Windows; section titles may be any language.
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", type=Path)
    ap.add_argument("--sections", type=Path, default=Path("sections.json"))
    ap.add_argument("--out", type=Path, default=Path("book_pages"))
    ap.add_argument("--dpi", type=int, default=150)
    ap.add_argument("--list", action="store_true", help="print the map and stop")
    ap.add_argument("--only", nargs="+", help="render only these section folders")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--text-only", action="store_true", help="write text.md files, skip the images")
    ap.add_argument("--pages", help="preview a page or inclusive range (e.g. 3 or 1-12), independently of the map")
    a = ap.parse_args()
    with pymupdf.open(a.pdf) as doc:
        if a.pages:
            match = re.fullmatch(r"(\d+)(?:-(\d+))?", a.pages)
            if not match:
                ap.error("--pages expects a page or range, e.g. 3 or 1-12")
            start, end = int(match[1]), int(match[2] or match[1])
            if not 1 <= start <= end <= len(doc):
                ap.error(f"--pages must be within 1-{len(doc)} in ascending order")
            if a.only:
                ap.error("use --pages for a preview or --only for mapped sections")
            sections = [{"folder": "preview", "title": f"Pages {start}-{end}", "start": start, "end": end}]
        else:
            sections = json.loads(a.sections.read_text(encoding="utf-8-sig"))   # PowerShell 5.1 writes a BOM
            nxt, seen = 1, set()
            for s in sections:
                f, st, en = s["folder"], s["start"], s["end"]
                if not f or "/" in f or "\\" in f or f in (".", "..") or f in seen:
                    ap.error(f"bad or repeated folder name: {f!r}")
                if st != nxt or en < st or en > len(doc):
                    ap.error(f"pages must run on without gaps or overlaps: {f} ({st}-{en}), expected start {nxt}")
                seen.add(f)
                nxt = en + 1
            if nxt != len(doc) + 1:
                ap.error(f"the map ends at page {nxt - 1}; the PDF has {len(doc)} pages")
            if a.only:
                unknown = set(a.only) - seen
                if unknown:
                    ap.error(f"unknown section folders: {', '.join(sorted(unknown))}")
        print(f"{len(doc)} pages, {len(sections)} sections, {a.dpi} dpi")
        if a.list:
            for s in sections:
                print(f'{s["folder"]}: {s["start"]}-{s["end"]}  {s["title"]}')
            return
        todo = [s for s in sections if not a.only or s["folder"] in a.only]
        for s in todo:
            d = a.out / s["folder"]
            d.mkdir(parents=True, exist_ok=True)
            text = [f"## page {p}\n\n{doc[p - 1].get_text().strip()}\n" for p in range(s["start"], s["end"] + 1)]
            (d / "text.md").write_text(f"# {s['title']}\n\n" + "\n".join(text), encoding="utf-8")
            if a.text_only:
                continue
            for p in range(s["start"], s["end"] + 1):
                target = d / f"page_{p:04d}.png"
                if target.exists() and not a.overwrite:
                    continue
                tmp = target.with_suffix(".tmp")     # never leave half an image behind
                tmp.write_bytes(doc[p - 1].get_pixmap(dpi=a.dpi, colorspace=pymupdf.csRGB, alpha=False).tobytes("png"))
                tmp.replace(target)
            print(f'{s["folder"]}: {s["start"]}-{s["end"]} done', flush=True)
        manifest = {"source": a.pdf.name, "page_count": len(doc), "dpi": a.dpi,
                    "page_numbering": "PDF page order from 1, not printed page numbers",
                    "filename_pattern": "page_{pdf_page:04d}.png", "sections": sections}
        manifest_dir = a.out / "preview" if a.pages else a.out
        (manifest_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
