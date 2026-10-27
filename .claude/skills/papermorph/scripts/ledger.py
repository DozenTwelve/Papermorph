"""One cost ledger for every paid script: tab-separated rows (date, chapter, file, model, what, cost in USD).

    from ledger import append, print_total
    append("books/<book>/art/costs.tsv", "books/<book>/art/ch04/vials.png", "openai/gpt-image-2.5-flare", "low", 0.004)

The chapter is read from the file's path (its first chNN, e.g. art/ch04/ or ch01-desk.png; "-" when there is none),
so episodes made in parallel are told apart in one ledger. Older rows have no chapter column (date, file, model, what,
cost); print_total sums both.
"""
import datetime, pathlib, re


def append(path, file, model, what, cost):
    ch = re.search(r"(?<![A-Za-z])ch\d+", str(file))
    led = pathlib.Path(path); led.parent.mkdir(parents=True, exist_ok=True)
    with led.open("a", encoding="utf-8") as f:
        f.write(f"{datetime.date.today()}\t{ch[0] if ch else '-'}\t{file}\t{model}\t{what}\t{cost}\n")


def rows(path):
    """Parsed non-empty ledger rows; the model is r[-3] and the cost r[-1] in both layouts."""
    text = pathlib.Path(path).read_text(encoding="utf-8")
    return [l.rstrip("\n").split("\t") for l in text.splitlines() if l.strip()]


def print_total(path, note=""):
    """Per-model and overall USD sums; note appends e.g. ', estimated'."""
    rs = rows(path)
    by = {}
    for r in rs:
        by[r[-3]] = by.get(r[-3], 0) + float(r[-1])
    tail = f"  ({len(rs)} rows{', ' + note if note else ''})"
    for m, c in sorted(by.items()):
        print(f"{m:40s} {c:8.4f} USD")
    print(f"{'total':40s} {sum(by.values()):8.4f} USD{tail}")
