#!/usr/bin/env python3
"""One picture from OpenAI's image API directly (no OpenRouter). Same CLI, ledger and spirit as paint.py.

    python3 paint_openai.py OUT.png "prompt" [ref.png ...] [--ar 16:9] [--q low|medium] [--bg transparent]
                     [--model gpt-image-2.5-flare] [--env /path/to/.env] --ledger books/<book>/art/costs.tsv
    python3 paint_openai.py --total books/<book>/art/costs.tsv      # sum a ledger, per model and overall

Aspect ratios map to OpenAI's sizes: 16:9 -> 1536x1024, 9:16 -> 1024x1536, otherwise 1024x1024.
Reference pictures go through /v1/images/edits (multipart), no refs through /v1/images/generations (JSON).
Quality is low or medium only: high costs several times as much and has never been needed; the script refuses it.
The key is read from $OPENAI_API_KEY, else from --env FILE, else ~/.config/papermorph/.env.

OpenAI's response reports usage tokens but not a USD cost, so the ledger records an estimate
(about 0.02 USD per low picture, 0.05 per medium at 1536x1024) — check the invoice for exact numbers.
Each call prints the usage and appends one line to the ledger (date, chapter, file, model, quality, cost; see ledger.py).
"""
import argparse, base64, json, os, pathlib, sys, urllib.request, urllib.error

API = "https://api.openai.com/v1"
SIZES = {"16:9": "1536x1024", "9:16": "1024x1536", "1:1": "1024x1024"}
EST = {"low": 0.02, "medium": 0.05, "high": 0.20}


from ledger import append, print_total

def total(path):
    print_total(path, 'estimated')


def env_value(v):
    """An .env value: surrounding whitespace, then matching outer quotes, removed."""
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
        v = v[1:-1]
    return v


def key(env):
    if os.environ.get("OPENAI_API_KEY"):
        return os.environ["OPENAI_API_KEY"]
    for f in ([pathlib.Path(env)] if env else []) + [pathlib.Path("~/.config/papermorph/.env").expanduser()]:
        if f.exists():
            for line in f.read_text().splitlines():
                if line.startswith("OPENAI_API_KEY="):
                    k = env_value(line.split("=", 1)[1])
                    if k:  # skip empty lines, keep looking
                        return k
    raise SystemExit("no key: set OPENAI_API_KEY or pass --env FILE with OPENAI_API_KEY=...")


def post(url, key, data, headers):
    req = urllib.request.Request(url, data, {"Authorization": f"Bearer {key}", **headers})
    try:
        return json.load(urllib.request.urlopen(req, timeout=600))
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace").replace(key, "***")[:500]  # redact the whole body, then trim
        raise SystemExit(f"{e.code} {body}")


def multipart(fields, files):
    b = "----papermorph" + os.urandom(8).hex()
    def part(h, v): return f"--{b}\r\n{h}\r\n\r\n".encode() + (v if isinstance(v, bytes) else v.encode()) + b"\r\n"
    body = b"".join(part(f'Content-Disposition: form-data; name="{k}"', v) for k, v in fields.items())
    for name, fname, data in files:
        body += part(f'Content-Disposition: form-data; name="{name}"; filename="{fname}"\r\nContent-Type: image/png', data)
    return body + f"--{b}--\r\n".encode(), f"multipart/form-data; boundary={b}"


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--total":
        return total(sys.argv[2])
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out"); ap.add_argument("prompt"); ap.add_argument("refs", nargs="*")
    ap.add_argument("--ar", default="16:9"); ap.add_argument("--q", default="medium", choices=["low", "medium", "high"])
    ap.add_argument("--bg", default="auto", choices=["auto", "transparent", "opaque"])
    ap.add_argument("--model", default="gpt-image-2.5-flare")
    ap.add_argument("--env", default="", help="path to a .env file containing OPENAI_API_KEY=...")
    ap.add_argument("--ledger", required=True, help="tab-separated cost log, e.g. books/<book>/art/costs.tsv")
    a = ap.parse_args()
    if a.q == "high":
        raise SystemExit("quality high is refused: use low or medium")
    k = key(a.env)
    size = SIZES.get(a.ar, "1024x1024")
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)

    if a.refs:
        fields = {"model": a.model, "prompt": a.prompt, "quality": a.q, "size": size}
        if a.bg != "auto":
            fields["background"] = a.bg
        body, ctype = multipart(fields, [("image[]", pathlib.Path(r).name, pathlib.Path(r).read_bytes()) for r in a.refs])
        r = post(f"{API}/images/edits", k, body, {"Content-Type": ctype})
    else:
        body = {"model": a.model, "prompt": a.prompt, "quality": a.q, "size": size, "output_format": "png"}
        if a.bg != "auto":
            body["background"] = a.bg
        r = post(f"{API}/images/generations", k, json.dumps(body).encode(), {"Content-Type": "application/json"})

    out.write_bytes(base64.b64decode(r["data"][0]["b64_json"]))
    usage = r.get("usage") or {}
    cost = (usage.get("cost") if isinstance(usage, dict) else None) or EST[a.q]
    print(a.out, f"cost {cost} USD (est)", json.dumps(usage))
    append(a.ledger, a.out, a.model, a.q, f"{cost:.4f}")


if __name__ == "__main__":
    main()
