#!/usr/bin/env python3
"""One picture from an image model (OpenRouter /images), from a prompt and optional reference pictures.

    python3 paint.py OUT.png "prompt" [ref.png ...] [--ar 16:9] [--q low|medium] [--bg transparent]
                     [--model openai/gpt-image-2.5-flare] --ledger books/<book>/art/costs.tsv
    python3 paint.py --total books/<book>/art/costs.tsv      # sum a ledger, per model and overall

Reference pictures steer composition and characters (a baked set sketch makes a good composition reference, see
bake_sets.py). Quality is low or medium only: high costs several times as much and has never been needed; the
script refuses it. --bg transparent asks for a cut-out (props, characters); otherwise the model chooses.
The key is read from ~/.config/openrouter/key or $OPENROUTER_API_KEY. OpenRouter refuses image requests while the
account balance is below $1.00, so top up before a batch; a refusal for credit prints the balance left. Voice
(eleven.py) spends from the same balance: when several runs share it, make the pictures first.

Each call prints the cost OpenRouter reports and appends one line to the ledger (date, chapter, file, model, quality,
cost, tab separated, see ledger.py; the ledger and its folder are created). Test the cheapest quality first and total the ledger before and
after a batch, so the spend is known. An existing OUT is never replaced (it may be an approved, paid picture) unless
--force is given.
"""
import argparse, base64, json, mimetypes, os, pathlib, sys, urllib.request, urllib.error

from ledger import append, print_total

total = print_total

def key():
    f = pathlib.Path("~/.config/openrouter/key").expanduser()
    k = os.environ.get("OPENROUTER_API_KEY") or (f.read_text().strip() if f.exists() else "")
    if not k:
        raise SystemExit("no key: put it in ~/.config/openrouter/key or set OPENROUTER_API_KEY")
    return k


def balance(k):
    """The account's credit left in USD, or None when OpenRouter does not say."""
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request("https://openrouter.ai/api/v1/credits",
                                                                    headers={"Authorization": f"Bearer {k}"}), timeout=30))["data"]
        return d["total_credits"] - d["total_usage"]
    except Exception:
        return None


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--total":
        return total(sys.argv[2])
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out"); ap.add_argument("prompt"); ap.add_argument("refs", nargs="*")
    ap.add_argument("--ar", default="16:9"); ap.add_argument("--q", default="medium", choices=["low", "medium", "high"])
    ap.add_argument("--bg", default="auto", choices=["auto", "transparent", "opaque"])
    ap.add_argument("--model", default="openai/gpt-image-2.5-flare")
    ap.add_argument("--ledger", required=True, help="tab-separated cost log, e.g. books/<book>/art/costs.tsv")
    ap.add_argument("--force", action="store_true", help="replace an existing OUT")
    a = ap.parse_args()
    if a.q == "high":
        raise SystemExit("quality high is refused: use low or medium")
    if pathlib.Path(a.out).exists() and not a.force:
        raise SystemExit(f"{a.out} exists: give a new name, or --force to replace it")
    body = {"model": a.model, "prompt": a.prompt, "aspect_ratio": a.ar, "output_format": "png"}
    if a.model.startswith("openai/"):
        body.update(quality=a.q, background=a.bg)
    else:
        body["resolution"] = "2K"
    if a.refs:
        body["input_references"] = [{"type": "image_url", "image_url": {"url": f"data:{mimetypes.guess_type(r)[0] or 'image/png'};base64," + base64.b64encode(pathlib.Path(r).read_bytes()).decode()}} for r in a.refs]
    k = key()
    req = urllib.request.Request("https://openrouter.ai/api/v1/images", json.dumps(body).encode(),
                                 {"Authorization": f"Bearer {k}", "Content-Type": "application/json"})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=600))
    except urllib.error.HTTPError as e:
        err = e.read().decode(errors="replace").replace(k, "***")[:500]  # redact the whole body, then trim
        if e.code == 402 or "credit" in err.lower() or "balance" in err.lower():
            left = balance(k)
            err += (f"\nOpenRouter refuses image requests while the balance is under $1.00 (left: "
                    f"{'unknown' if left is None else f'${left:.2f}'}). Top up at https://openrouter.ai/settings/credits; "
                    "when several runs share the balance, make the pictures before the voice (eleven.py spends from it too).")
        raise SystemExit(f"{e.code} {err}")
    usage = r.get("usage") or {}
    cost = usage.get("cost", 0) or 0
    print(a.out, f"cost {cost} USD", json.dumps(usage))
    append(a.ledger, a.out, a.model, a.q, cost)   # logged first: the call is paid for even if no picture came back
    try:
        png = base64.b64decode(r["data"][0]["b64_json"])
    except (KeyError, IndexError, TypeError):
        raise SystemExit(f"no picture in the answer: {json.dumps(r).replace(k, '***')[:500]}")
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(png)


if __name__ == "__main__":
    main()
