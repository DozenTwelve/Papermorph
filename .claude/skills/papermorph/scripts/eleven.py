#!/usr/bin/env python3
"""Narration with OpenRouter's ElevenLabs voices; marks and caption cues from local word alignment (faster-whisper).

    uv run --with faster-whisper --with numpy python eleven.py content/<book>/ch01/narration.en.json site/<book>/ch01/audio/en
    ... [--model elevenlabs/eleven-v4] [--voice george] [--only beat,beat]

Same input and output as tts.py: the narration file's beats with [[mark]] tags in, <beat>.mp3 and timings.js
({dur, marks, cues} per beat) out, so the page cannot tell the two apart. The voice and model come from the
narration file ("voice", "model"), else from the flags (default george, eleven-v4); OpenRouter offers 21 preset
voices. A beat may be {"speaker": name, "text": ...} with the speaker's "voice" under the file's "voices", as in tts.py.

ElevenLabs returns no word timings, so each clip is transcribed locally (faster-whisper base.en, or base for another
language, from the file name narration.<lang>.json; the first run downloads the model) and the script's words are
matched to the heard words in order; each [[mark]] is the start of the word after it, and there is one caption cue per
sentence and per clause after a colon. Audio is decoded with ffmpeg, not PyAV (faster-whisper's PyAV version clashes). Needs ffmpeg.

v4 audio tags such as [cackles] or [whispers] act: they are performed, not read aloud, and left out of captions.
Price: about $0.00008 per character (about $0.65 for a ten-minute film); the run prints its estimate.

Each beat's clip is cached beside the narration as .eleven/<beat>.<hash>.mp3 (hash of model, voice and text), so
moving marks or rerunning never pays twice. --only regenerates the listed beats and leaves the others' mp3 (perhaps
levelled since) and timings as they are. The key is read from ~/.config/openrouter/key or $OPENROUTER_API_KEY.
"""
import argparse, hashlib, json, pathlib, re, subprocess, sys, urllib.error, urllib.request
import numpy as np
from paint import key
from tts import split_marks, mark_times, duration, write_atomic

TAG = re.compile(r"(?<!\[)\[[^\[\]]+\](?!\])")   # a v4 audio tag, not a [[mark]]
PRICE = 0.00008   # USD per character

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("narration"); ap.add_argument("out")
ap.add_argument("--model"); ap.add_argument("--voice")
ap.add_argument("--only", default="", help="comma-separated beats to regenerate")
a = ap.parse_args()
spec = json.loads(pathlib.Path(a.narration).read_text(encoding="utf-8-sig"))
model = a.model or spec.get("model", "elevenlabs/eleven-v4")
lang = pathlib.Path(a.narration).stem.split(".")[-1]
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
cache = pathlib.Path(a.narration).parent / ".eleven"; cache.mkdir(exist_ok=True)
only = set(filter(None, a.only.split(",")))


def speak(text, voice, dst):
    body = json.dumps({"model": model, "input": text, "voice": voice, "response_format": "mp3"}).encode()
    req = urllib.request.Request("https://openrouter.ai/api/v1/audio/speech", body,
                                 {"Authorization": f"Bearer {key()}", "Content-Type": "application/json"})
    try:
        data = urllib.request.urlopen(req, timeout=300).read()
    except urllib.error.HTTPError as e:
        sys.exit(f"{e.code} {e.read().decode(errors='replace')[:500]}")
    if not data.startswith(b"ID3") and not (data[:1] == b"\xff" and len(data) > 1 and data[1] & 0xE0 == 0xE0):
        sys.exit(f"not audio: {data[:300]!r}")
    dst.write_bytes(data)


norm = lambda w: re.sub(r"\W", "", w.lower())
asr = None
tf = out / "timings.js"
old = {}
if tf.exists():
    t = tf.read_text(encoding="utf-8"); old = json.loads(t[t.index("{"):t.rindex("}") + 1])
timings, spent = {}, 0
for beat, raw in spec["beats"].items():
    voice = spec["voices"][raw["speaker"]]["voice"] if isinstance(raw, dict) else a.voice or spec.get("voice", "george")
    raw = raw["text"] if isinstance(raw, dict) else raw
    clean, marks = split_marks(raw)   # clean keeps audio tags: they go to the voice
    if only and beat not in only and beat in old:
        timings[beat] = old[beat]; continue   # --only leaves the other beats alone
    cached = cache / f"{beat}.{hashlib.sha1(f'{model}|{voice}|{clean}'.encode()).hexdigest()[:12]}.mp3"
    if not cached.exists():
        if only and beat not in only:
            continue
        speak(clean, voice, cached); spent += len(clean); print(beat, "synthesized")
    mp3 = out / f"{beat}.mp3"; mp3.write_bytes(cached.read_bytes())
    if asr is None:
        from faster_whisper import WhisperModel
        asr = WhisperModel("base.en" if lang == "en" else "base", device="cpu", compute_type="int8")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    segs, _ = asr.transcribe(np.frombuffer(pcm, np.float32), word_timestamps=True, language=lang)
    heard = [(norm(w.word), w.start) for s in segs for w in s.words if norm(w.word)]
    # the script's words (audio tags blanked out, positions kept), matched to heard words in order with a small look-ahead
    spoken = TAG.sub(lambda m: " " * len(m.group()), clean)
    toks = [w for w in re.findall(r"\S+", spoken) if norm(w)]
    times, j = [], 0
    for w in map(norm, toks):
        k = next((k for k in range(j, min(j + 6, len(heard))) if heard[k][0] == w or heard[k][0].startswith(w[:4])), None)
        times.append(None if k is None else heard[k][1]); j = j if k is None else k + 1
    dur = duration(mp3)
    for i, v in enumerate(times):   # words Whisper merged or split: halfway between their known neighbours
        if v is None:
            prev = next((times[q] for q in range(i - 1, -1, -1) if times[q] is not None), 0.0)
            nxt = next((times[q] for q in range(i + 1, len(times)) if times[q] is not None), dur)
            times[i] = round(prev + (nxt - prev) * .5, 3)
    words = list(zip(times, toks))
    # caption cues: one per sentence or clause after a colon (long documentary sentences), at its first word
    cues, i = [], 0
    for sent in re.split(r"(?<=[.?!:])\s+", re.sub(r"\s+", " ", TAG.sub("", clean)).strip()):
        n = len([w for w in sent.split() if norm(w)])
        if n: cues.append([round(times[i], 3) if i < len(times) else 0, sent]); i += n
    if cues: cues[0][0] = min(cues[0][0], .1)
    timings[beat] = {"dur": dur, "marks": mark_times(clean, marks, words), "cues": cues}
    print(f"{beat}: {dur} s, {len(marks)} marks")
write_atomic(tf, "window.TIMINGS = " + json.dumps(timings, indent=1, ensure_ascii=False) + ";\n")
print(f"{len(timings)} beats in {tf}; synthesized {spent} characters, about ${spent * PRICE:.2f}")
