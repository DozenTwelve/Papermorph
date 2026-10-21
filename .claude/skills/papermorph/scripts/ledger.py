"""Sums for the paint scripts' 5-column TSV ledgers (date, file, model, quality, cost)."""
import pathlib


def rows(path):
    """Parsed non-empty ledger rows: [date, file, model, quality, cost]."""
    text = pathlib.Path(path).read_text(encoding="utf-8")
    return [l.rstrip("\n").split("\t") for l in text.splitlines() if l.strip()]


def print_total(path, note=""):
    """Per-model and overall USD sums; note appends e.g. ', estimated'."""
    rs = rows(path)
    by = {}
    for r in rs:
        by[r[2]] = by.get(r[2], 0) + float(r[4])
    tail = f"  ({len(rs)} pictures{', ' + note if note else ''})"
    for m, c in sorted(by.items()):
        print(f"{m:40s} {c:8.4f} USD")
    print(f"{'total':40s} {sum(by.values()):8.4f} USD{tail}")
