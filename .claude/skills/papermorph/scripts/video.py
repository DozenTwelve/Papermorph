#!/usr/bin/env python3
"""A short clip from a still (image-to-video through OpenRouter: POST /api/v1/videos, poll, download).

    python3 video.py OUT.mp4 FIRST_FRAME.png "prompt" --model kwaivgi/kling-v3.0-std --ledger books/<book>/art/costs.tsv
    ... [--duration 5] [--resolution 720p] [--aspect 1:1]
    ... --resume JOBID      # the same command again: poll that job instead of paying for a new one

The still is the first frame; the clip has no sound. Then frames.py turns it into an ink-line sprite sheet, so it
plays on the beat clock like the rest of the film (pause, seek and export match, which a <video> would not).
Kling 3.0 std, 5 s, cost about $0.42 and kept an engraving's style; Veo 3.1 lite refused 1:1. A job takes minutes;
the script polls every 20 s for up to 15 minutes. A job that ends other than completed stops the script; a timeout or a
lost connection prints the job id to --resume. The key is read from ~/.config/openrouter/key or $OPENROUTER_API_KEY.

Prints the cost OpenRouter reports and appends a row to the ledger (date, chapter, file, model, "video<N>s", cost), the same
ledger paint.py writes, so `python3 paint.py --total LEDGER` sums both.
"""
import argparse, base64, json, mimetypes, pathlib, sys, time, urllib.error, urllib.request
from paint import key
from ledger import append

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("out"); ap.add_argument("frame"); ap.add_argument("prompt")
ap.add_argument("--model", required=True); ap.add_argument("--duration", type=int, default=5); ap.add_argument("--resolution", default="720p")
ap.add_argument("--aspect", default="1:1")
ap.add_argument("--resume", metavar="JOBID", help="poll this job (after a timeout or lost connection) instead of starting a new one")
ap.add_argument("--ledger", required=True, help="tab-separated cost log, e.g. books/<book>/art/costs.tsv")
a = ap.parse_args()
k = key()
H = {"Authorization": f"Bearer {k}", "Content-Type": "application/json"}
jid = a.resume
again = lambda: f"; the job may still finish: rerun with --resume {jid}" if jid else ""
def call(url, body=None):
    try:
        return urllib.request.urlopen(urllib.request.Request(url, json.dumps(body).encode() if body else None, H), timeout=300)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{e.code} {e.read().decode(errors='replace').replace(k, '***')[:500]}{again()}")
if not jid:
    img = f"data:{mimetypes.guess_type(a.frame)[0] or 'image/png'};base64," + base64.b64encode(pathlib.Path(a.frame).read_bytes()).decode()
    body = {"model": a.model, "prompt": a.prompt, "duration": a.duration, "resolution": a.resolution, "aspect_ratio": a.aspect,
            "generate_audio": False, "frame_images": [{"type": "image_url", "image_url": {"url": img}, "frame_type": "first_frame"}]}
    r = json.load(call("https://openrouter.ai/api/v1/videos", body)); jid = r.get("id")
    if not jid: raise SystemExit(f"no job id in the answer: {json.dumps(r).replace(k, '***')[:500]}")
print(a.model, "job", jid, flush=True)
t0, fails = time.time(), 0
while True:
    time.sleep(20)
    try:
        s = json.load(call(f"https://openrouter.ai/api/v1/videos/{jid}"))
    except (urllib.error.URLError, TimeoutError, ConnectionError, ValueError) as e:   # the connection, not the job
        fails += 1
        if fails == 5: raise SystemExit(f"polling failed 5 times ({e}){again()}")
        print("poll failed, retrying:", e, file=sys.stderr); continue
    fails = 0
    if s.get("status") in ("completed", "failed", "cancelled", "expired"): break
    if time.time() - t0 > 900: raise SystemExit(f"still {s.get('status')} after 15 minutes{again()}")
if s["status"] != "completed": raise SystemExit(f"{s['status']}: {s.get('error')}")
out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(call(f"https://openrouter.ai/api/v1/videos/{jid}/content?index=0").read())
cost = (s.get("usage") or {}).get("cost", 0) or 0
append(a.ledger, a.out, a.model, f"video{a.duration}s", cost)
print(a.out, f"cost {cost} USD")
