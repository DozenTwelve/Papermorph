"""Generate narration audio and word-mark timings with Edge TTS.

Usage (from the project root; SKILL is this skill's folder):
    uv run --with edge-tts $SKILL/scripts/tts.py content/ch01/narration.en.json site/ch01/audio/en

Needs network access and ffprobe (from ffmpeg) for clip durations.

Narration text may contain [[mark]] tags placed before a word. The output
timings.js records each clip's duration and the time (seconds) at which the
word after every mark starts, so page animations can wait for that word,
plus one caption cue per sentence. Only beats whose text or voice changed are
regenerated; spoken word times are cached, so caption and mark rules can change
without new audio.

Narration files are read as UTF-8 (a byte order mark is allowed) on every platform.
Keep beat ids and mark names ASCII: they become file names and JS keys, and are
printed to the console.

Edge sometimes answers a request with no audio (NoAudioReceived), more often for
some voices; such a beat is requested again up to MAX_ATTEMPTS times with growing
pauses. If it still gets none, a short test phrase in the same voice tells whether
the voice is unavailable or this beat's text is the problem, and the run stops.
"""

import asyncio
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts
from edge_tts.exceptions import NoAudioReceived

MARK = re.compile(r"\[\[(\w+)\]\]")
MAX_ATTEMPTS = 5          # requests per beat when Edge returns no audio
FIRST_RETRY_DELAY = 2     # seconds before the second request; doubles after each failure
PROBE_TEXT = "1, 2, 3."   # checks the voice after a beat fails; any voice reads digits in its own language


async def synth(text, voice, rate, mp3_path):
    words = []  # (seconds, word)
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append((chunk["offset"] / 1e7, chunk["text"]))
    return words


async def synth_with_retries(beat, text, voice, rate, mp3_path):
    """synth(), requested again after NoAudioReceived; each attempt rewrites mp3_path from the start."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return await synth(text, voice, rate, mp3_path)
        except NoAudioReceived:
            if attempt == MAX_ATTEMPTS:
                raise
            delay = FIRST_RETRY_DELAY * 2 ** (attempt - 1)
            print(f"{beat}: Edge returned no audio, retrying in {delay} s (attempt {attempt + 1} of {MAX_ATTEMPTS})",
                  file=sys.stderr, flush=True)
            await asyncio.sleep(delay)


async def explain_no_audio(beat, voice, rate, out_dir):
    """The message for a beat that ran out of attempts: whether the voice or this beat's text failed."""
    with tempfile.NamedTemporaryFile(dir=out_dir, prefix=".probe-", suffix=".mp3", delete=False) as f:
        probe_path = Path(f.name)
    try:
        await synth(PROBE_TEXT, voice, rate, probe_path)
        voice_works = True
    except NoAudioReceived:
        voice_works = False
    finally:
        probe_path.unlink(missing_ok=True)
    if voice_works:
        return (f"{beat}: the voice {voice} works, but Edge returned no audio for this beat's text "
                f"{MAX_ATTEMPTS} times. Look for unusual characters in it, or split the beat.")
    return (f"{beat}: the voice {voice} returned no audio {MAX_ATTEMPTS} times, and also for a short test phrase, "
            "so the voice is unavailable at Edge right now; the text is not the cause. Completed beats are saved. "
            "Rerun later, or choose another voice for the whole book (uv run --with edge-tts edge-tts --list-voices).")


def split_marks(raw):
    """Return clean text and {mark: char position in clean text}."""
    marks, clean, pos = {}, [], 0
    # MARK.split alternates text, name, text, name, ...
    for i, part in enumerate(MARK.split(raw)):
        if i % 2:
            if part in marks:
                raise ValueError(f"duplicate mark {part!r} in one beat")
            marks[part] = pos
        else:
            clean.append(part)
            pos += len(part)
    return "".join(clean), marks


def time_at(clean, words):
    """Return f(pos): start time of the first spoken word at or after char pos."""
    cursor, located = 0, []
    for t, w in words:
        i = clean.find(w, cursor)
        if i < 0:
            continue
        located.append((i, t))
        cursor = i + len(w)
    return lambda pos: next((round(t, 3) for i, t in located if i >= pos), None)


def mark_times(clean, marks, words):
    at, out = time_at(clean, words), {}
    for name, pos in marks.items():
        out[name] = at(pos)
        if out[name] is None:
            raise SystemExit(f"mark {name!r} not matched to a spoken word")
    return out


def caption_cues(clean, words):
    """One cue per sentence: [start seconds, sentence]."""
    at, cues, start = time_at(clean, words), [], 0
    for m in list(re.finditer(r"[.?!]\s+", clean)) + [None]:
        end = m.end() if m else len(clean)
        text = clean[start:end].strip()
        if text:
            cues.append([at(start) or 0, text])
        start = end
    return cues


def duration(mp3):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
        capture_output=True, text=True, check=True)
    return round(float(r.stdout), 3)


def write_atomic(path, text):
    """Replace output only after its complete contents have been written."""
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=f".{path.name}-", delete=False) as f:
        tmp = Path(f.name)
    try:
        tmp.write_text(text, encoding="utf-8")
        tmp.replace(path)
    finally:
        tmp.unlink(missing_ok=True)


async def main(src, out_dir):
    spec = json.loads(Path(src).read_text(encoding="utf-8-sig"))
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    cache_path = Path(src).with_suffix(".timings.json")  # build cache, kept out of the site
    cache = json.loads(cache_path.read_text(encoding="utf-8-sig")) if cache_path.exists() else {}
    voice, rate = spec["voice"], spec["rate"]
    result = {}
    public = lambda v: {k: v[k] for k in ("dur", "marks", "cues")}
    live = {b: public(v) for b, v in cache.items()
            if {"dur", "marks", "cues"} <= v.keys() and (out_dir / f"{b}.mp3").exists()}
    timings_path = out_dir / "timings.js"
    for beat, raw in spec["beats"].items():
        mp3 = out_dir / f"{beat}.mp3"
        old = cache.get(beat)
        clean, marks = split_marks(raw)
        key = hashlib.sha1(f"{voice}|{rate}|{clean}".encode()).hexdigest()
        # Existing caches included [[marks]] in the key; reuse an unchanged old beat once,
        # then save its spoken-text key so future mark edits do not regenerate audio.
        legacy_key = hashlib.sha1(f"{voice}|{rate}|{raw}".encode()).hexdigest()
        reusable = old and old.get("key") in (key, legacy_key) and "words" in old and mp3.exists() and mp3.stat().st_size > 0
        tmp = None
        if reusable:
            words = old["words"]
            clip = mp3
        else:
            with tempfile.NamedTemporaryFile(dir=out_dir, prefix=f".{beat}-", suffix=".mp3", delete=False) as f:
                tmp = Path(f.name)
            clip = tmp
        try:
            if not reusable:
                try:
                    words = await synth_with_retries(beat, clean, voice, rate, clip)
                except NoAudioReceived:
                    raise SystemExit(await explain_no_audio(beat, voice, rate, out_dir)) from None
            entry = {"key": key, "dur": duration(clip), "words": words,
                     "marks": mark_times(clean, marks, words), "cues": caption_cues(clean, words)}
            if tmp:
                tmp.replace(mp3)
                print(f"{beat}: synthesized")
            result[beat] = entry
            cache[beat] = entry
            # A later failed beat must not discard the successful beats' cache.
            write_atomic(cache_path, json.dumps(cache, indent=1))
            # Keep the successful MP3's timings consistent even if a later beat fails.
            live[beat] = public(entry)
            write_atomic(timings_path, "window.TIMINGS = " + json.dumps(live, indent=1) + ";\n")
        finally:
            if tmp:
                tmp.unlink(missing_ok=True)
    write_atomic(cache_path, json.dumps(result, indent=1))
    js = {b: public(v) for b, v in result.items()}
    write_atomic(timings_path, "window.TIMINGS = " + json.dumps(js, indent=1) + ";\n")


if __name__ == "__main__":
    asyncio.run(main(*sys.argv[1:3]))
