#!/usr/bin/env python3
"""Turn a chapter's mcq-item-writer bank into the items.js a chapter page loads.

    python SKILL/scripts/items.py books/<book>/items/chNN.items.json site/<book>/chNN/items.js

The bank is the source of truth for the chapter's choice questions: write and lint it with the
mcq-item-writer skill, then build. The page loads items.js after engine.js and asks with
mcq('ID') (references/lessons/questions.md). Lint first; this script only refuses what the engine can't show:

  - multiple-response items, data tables and media (draw data in the picture and ask about it);
  - an item without exactly one correct option.

Ordered-MC items become ordinary choice questions (the engine has no partial credit). Options keep
their authored order, since the engine doesn't shuffle, so spread key positions in the bank. The
engine prefixes "Correct." / "Not quite.", so a leading verdict in feedback is dropped. Items that
aren't approved yet are listed as a warning.
"""
import argparse
import json
import re
import sys
from pathlib import Path

VERDICT = re.compile(r"^\s*(correct|incorrect|not quite|not correct|right|wrong|yes|no)\s*[.!:,—–-]\s*", re.I)


def feedback(text):
    return VERDICT.sub("", text.strip(), count=1)


def convert(item, problems):
    iid = item.get("id", "?")
    fmt = item.get("format", "one-best-answer")
    stem = item.get("stem") or {}
    if fmt == "multiple-response":
        problems.append(f"{iid}: multiple-response items can't be shown by choice(); rewrite as one-best-answer")
    if stem.get("data_table"):
        problems.append(f"{iid}: data tables aren't shown on cards; draw the data in the picture and ask about it")
    if item.get("media"):
        problems.append(f"{iid}: media aren't shown on cards; the picture is the item's figure")
    opts = item.get("options") or []
    keys = [i for i, o in enumerate(opts) if o.get("correct")]
    if len(keys) != 1:
        problems.append(f"{iid}: {len(keys)} correct options; choice() needs exactly one")
        return None
    right = keys[0]
    prompt = " ".join(t.strip() for t in (stem.get("scenario"), stem.get("lead_in")) if t and t.strip())
    return {
        "prompt": prompt,
        "opts": [[o["text"].strip()] for o in opts],
        "right": right,
        "why": feedback(opts[right].get("feedback", "")),
        "no": [None if i == right else feedback(o.get("feedback", "")) for i, o in enumerate(opts)],
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("bank", type=Path, help="books/<book>/items/chNN.items.json")
    ap.add_argument("out", type=Path, help="site/<book>/chNN/items.js")
    a = ap.parse_args(argv)
    try:
        bank = json.loads(a.bank.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        sys.exit(f"items.py: can't read {a.bank}: {e}")
    items = [it for it in bank.get("items", []) if it.get("status") != "retired"]
    problems, out = [], {}
    for it in items:
        if it.get("id") in out:
            problems.append(f"{it['id']}: duplicate id")
        q = convert(it, problems)
        if q:
            out[it["id"]] = q
    if problems:
        sys.exit("items.py: not built\n  " + "\n  ".join(problems))
    body = json.dumps(out, ensure_ascii=False, indent=1).replace("</", "<\\/")
    a.out.parent.mkdir(parents=True, exist_ok=True)
    try:
        src = a.bank.resolve().relative_to(Path.cwd()).as_posix()
    except ValueError:
        src = a.bank.name
    a.out.write_text(f"// Built by scripts/items.py from {src}; edit the bank, not this file.\n"
                     f"window.ITEMS = Object.assign(window.ITEMS || {{}}, {body});\n", encoding="utf-8", newline="\n")
    ordered = [it["id"] for it in items if it.get("format") == "ordered-mc"]
    drafts = [it["id"] for it in items if it.get("status") != "approved"]
    print(f"{a.out}: {len(out)} item(s)")
    if ordered:
        print(f"  note: ordered-MC scored right/wrong only: {', '.join(ordered)}")
    if drafts:
        print(f"  warning: not yet approved: {', '.join(drafts)}")


if __name__ == "__main__":
    main()
