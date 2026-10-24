#!/usr/bin/env python3
"""Narration with OpenRouter's ElevenLabs voices; marks and caption cues from local word alignment (faster-whisper).

    uv run --with faster-whisper --with numpy python eleven.py content/<book>/ch01/narration.en.json site/<book>/ch01/audio/en
    ... [--model elevenlabs/eleven-v4] [--voice george] [--only beat,beat] [--dry] [--ledger books/<book>/art/costs.tsv]

Same input and output as tts.py: the narration file's beats with [[mark]] tags in, <beat>.mp3 and timings.js
({dur, marks, cues} per beat) out, so the page cannot tell the two apart. The voice and model come from the
narration file ("voice", "model"), else from the flags (default george, eleven-v4); OpenRouter offers 21 preset
voices. A beat may be {"speaker": name, "text": ...} with the speaker's "voice" under the file's "voices", as in tts.py,
and a "sub": a line in another language, whose subtitle is its one caption cue, shown even with captions off (forced);
Whisper detects that line's language.

ElevenLabs returns no word timings, so each clip is transcribed locally (faster-whisper base.en, or base for another
language, from the file name narration.<lang>.json; the first run downloads the model) and the script's words are
matched to the heard words in order; each [[mark]] is the start of the word after it, and there is one caption cue per
sentence and per clause after a colon ("Mr." and "e.g." do not end one, as in tts.py). Audio is decoded with ffmpeg, not PyAV (faster-whisper's PyAV version clashes). Needs ffmpeg.

v4 audio tags such as [cackles] or [whispers] act: they are performed, not read aloud, and left out of captions.
Price: about $0.00008 per character (about $0.65 for a ten-minute film). Before paying, the run prints the characters
it will synthesize and their estimated cost; --dry stops there. --ledger appends the run's estimate to the ledger
paint.py writes (OpenRouter reports no cost for speech).

Each beat's clip is cached beside the narration as .eleven/<beat>.<hash>.mp3 (hash of model, voice and text), so
moving marks or rerunning never pays twice. --only takes the listed beats again (a fresh, paid take, even with the
text unchanged) and leaves the others' mp3 and timings as they are. A clip levelled in place (level.py) is kept by
later runs until its take changes: .eleven/takes.json records which take each output clip was copied from.
The key is read from ~/.config/openrouter/key or $OPENROUTER_API_KEY.
"""
import argparse, datetime, hashlib, json, pathlib, re, subprocess, sys, urllib.error, urllib.request
from paint import key
from tts import ABBREV, split_marks, mark_times, duration, write_atomic

TAG = re.compile(r"(?<!\[)\[[^\[\]]+\](?!\])")   # a v4 audio tag, not a [[mark]]
PRICE = 0.00008   # USD per character

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("narration"); ap.add_argument("out")
ap.add_argument("--model"); ap.add_argument("--voice")
ap.add_argument("--only", default="", help="comma-separated beats to take again")
ap.add_argument("--dry", action="store_true", help="print what would be synthesized and its cost, then stop")
ap.add_argument("--ledger", help="tab-separated cost log to append the estimate to, e.g. books/<book>/art/costs.tsv")
a = ap.parse_args()
spec = json.loads(pathlib.Path(a.narration).read_text(encoding="utf-8-sig"))
model = a.model or spec.get("model", "elevenlabs/eleven-v4")
lang = pathlib.Path(a.narration).stem.split(".")[-1]
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
cache = pathlib.Path(a.narration).parent / ".eleven"; cache.mkdir(exist_ok=True)
only = set(filter(None, a.only.split(",")))
if only - spec["beats"].keys():
    sys.exit(f"--only: no beat {', '.join(sorted(only - spec['beats'].keys()))}")


def speak(text, voice, dst):
    body = json.dumps({"model": model, "input": text, "voice": voice, "response_format": "mp3"}).encode()
    k = key()
    req = urllib.request.Request("https://openrouter.ai/api/v1/audio/speech", body,
                                 {"Authorization": f"Bearer {k}", "Content-Type": "application/json"})
    try:
        data = urllib.request.urlopen(req, timeout=300).read()
    except urllib.error.HTTPError as e:
        sys.exit(f"{e.code} {e.read().decode(errors='replace').replace(k, '***')[:500]}")
    if not data.startswith(b"ID3") and not (data[:1] == b"\xff" and len(data) > 1 and data[1] & 0xE0 == 0xE0):
        sys.exit(f"not audio: {data[:300]!r}")
    dst.write_bytes(data)


norm = lambda w: re.sub(r"\W", "", w.lower())
asr = {}
tf = out / "timings.js"
old = {}
if tf.exists():
    t = tf.read_text(encoding="utf-8"); old = json.loads(t[t.index("{"):t.rindex("}") + 1])
tk = cache / "takes.json"   # output clip -> the cached take it was copied from
takes = json.loads(tk.read_text()) if tk.exists() else {}
beats = []
for beat, raw in spec["beats"].items():
    voice = spec["voices"][raw["speaker"]]["voice"] if isinstance(raw, dict) else a.voice or spec.get("voice", "george")
    sub = raw.get("sub") if isinstance(raw, dict) else None   # a foreign line's subtitle, its one cue
    raw = raw["text"] if isinstance(raw, dict) else raw
    clean, marks = split_marks(raw)   # clean keeps audio tags: they go to the voice
    cached = cache / f"{beat}.{hashlib.sha1(f'{model}|{voice}|{clean}'.encode()).hexdigest()[:12]}.mp3"
    fresh = beat in only if only else not cached.exists()   # --only takes its beats again, cached or not
    beats.append((beat, voice, sub, clean, marks, cached, fresh))
todo = sum(len(b[3]) for b in beats if b[6])
print(f"{sum(b[6] for b in beats)} beats to synthesize, {todo} characters, about ${todo * PRICE:.2f}", flush=True)
if a.dry:
    sys.exit()
if a.ledger and todo:
    led = pathlib.Path(a.ledger); led.parent.mkdir(parents=True, exist_ok=True)
    with led.open("a", encoding="utf-8") as f: f.write(f"{datetime.date.today()}\t{a.out}\t{model}\ttts{todo}c\t{todo * PRICE:.4f}\n")
timings, spent = {}, 0
for beat, voice, sub, clean, marks, cached, fresh in beats:
    if only and beat not in only and beat in old:
        timings[beat] = old[beat]; continue   # --only leaves the other beats alone
    if not fresh and not cached.exists():
        print(f"{beat}: WARNING not in {tf} and not cached, left out: run without --only to make it", file=sys.stderr); continue
    if fresh:
        speak(clean, voice, cached); spent += len(clean); print(beat, "synthesized")
    mp3 = out / f"{beat}.mp3"
    if fresh or not mp3.exists() or takes.get(str(mp3.resolve())) != cached.name:   # else keep it: perhaps levelled since
        mp3.write_bytes(cached.read_bytes()); takes[str(mp3.resolve())] = cached.name
    m = "base" if sub or lang != "en" else "base.en"
    if m not in asr:
        import numpy as np
        from faster_whisper import WhisperModel
        asr[m] = WhisperModel(m, device="cpu", compute_type="int8")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    segs, _ = asr[m].transcribe(np.frombuffer(pcm, np.float32), word_timestamps=True, language=None if sub else lang)
    heard = [(norm(w.word), w.start) for s in segs for w in s.words if norm(w.word)]
    # the script's words (audio tags blanked out, positions kept), matched to heard words in order with a small look-ahead
    spoken = TAG.sub(lambda m: " " * len(m.group()), clean)
    toks = [w for w in re.findall(r"\S+", spoken) if norm(w)]
    times, j = [], 0
    for w in map(norm, toks):
        k = next((k for k in range(j, min(j + 6, len(heard))) if heard[k][0] == w or len(w) >= 4 and heard[k][0].startswith(w[:4])), None)
        times.append(None if k is None else heard[k][1]); j = j if k is None else k + 1
    dur = duration(mp3)
    for i, v in enumerate(times):   # words Whisper merged or split: halfway between their known neighbours
        if v is None:
            prev = next((times[q] for q in range(i - 1, -1, -1) if times[q] is not None), 0.0)
            nxt = next((times[q] for q in range(i + 1, len(times)) if times[q] is not None), dur)
            times[i] = round(prev + (nxt - prev) * .5, 3)
    words = list(zip(times, toks))
    # caption cues: one per sentence or clause after a colon (long documentary sentences), at its first word
    cues, i, sents = [], 0, []
    for sent in re.split(r"(?<=[.?!:])\s+", re.sub(r"\s+", " ", TAG.sub(" ", clean)).strip()):   # a tag parts words
        if sents and ABBREV.search(sents[-1]): sents[-1] += " " + sent   # "Mr. Lee", "e.g. a lot" go on
        else: sents.append(sent)
    for sent in sents:
        n = len([w for w in sent.split() if norm(w)])
        if n: cues.append([round(times[i], 3) if i < len(times) else 0, sent]); i += n
    if cues: cues[0][0] = min(cues[0][0], .1)
    timings[beat] = {"dur": dur, "marks": mark_times(clean, marks, words), "cues": [[0, sub]] if sub else cues}
    if sub: timings[beat]["forced"] = True
    print(f"{beat}: {dur} s, {len(marks)} marks")
write_atomic(tf, "window.TIMINGS = " + json.dumps(timings, indent=1, ensure_ascii=False) + ";\n")
write_atomic(tk, json.dumps(takes, indent=1))
print(f"{len(timings)} beats in {tf}; synthesized {spent} characters, about ${spent * PRICE:.2f}")
