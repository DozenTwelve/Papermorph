"""Generate narration audio and word-mark timings with Edge TTS or Kokoro.

Usage (from the project root; SKILL is this skill's folder):
    uv run --with edge-tts $SKILL/scripts/tts.py content/<book>/ch01/narration.en.json site/<book>/ch01/audio/en
    uv run --python 3.12 --with kokoro $SKILL/scripts/tts.py ...      # narration with "engine": "kokoro"

The narration file names the engine ("edge", the default, or "kokoro"), the voice and the rate. Edge needs network
access. Kokoro (Apache 2.0) runs locally: its first run downloads the model (about 330 MB) and an English dictionary;
voices start with the accent's letter (am_michael, af_heart: American; bm_george, bf_emma: British) and its word
timings cover English. Both need ffmpeg/ffprobe.

A book with several speakers lists them under "voices" ({name: {"voice", "rate", "pitch"}}) and writes a
beat as {"speaker": name, "text": ...}; plain string beats (and beats without a speaker) use the file's own voice. Pitch is Edge only ("+20Hz").

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


MARK = re.compile(r"\[\[(\w+)\]\]")
MAX_ATTEMPTS = 5          # requests per beat when Edge returns no audio
FIRST_RETRY_DELAY = 2     # seconds before the second request; doubles after each failure
PROBE_TEXT = "1, 2, 3."   # checks the voice after a beat fails; any voice reads digits in its own language


async def synth(text, voice, rate, mp3_path, pitch="+0Hz"):
    import edge_tts
    words = []  # (seconds, word)
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append((chunk["offset"] / 1e7, chunk["text"]))
    return words


async def synth_with_retries(beat, text, voice, rate, mp3_path, pitch):
    """synth(), requested again after NoAudioReceived; each attempt rewrites mp3_path from the start."""
    from edge_tts.exceptions import NoAudioReceived
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return await synth(text, voice, rate, mp3_path, pitch)
        except NoAudioReceived:
            if attempt == MAX_ATTEMPTS:
                raise
            delay = FIRST_RETRY_DELAY * 2 ** (attempt - 1)
            print(f"{beat}: Edge returned no audio, retrying in {delay} s (attempt {attempt + 1} of {MAX_ATTEMPTS})",
                  file=sys.stderr, flush=True)
            await asyncio.sleep(delay)


async def explain_no_audio(beat, voice, rate, out_dir):
    """The message for a beat that ran out of attempts: whether the voice or this beat's text failed."""
    from edge_tts.exceptions import NoAudioReceived
    with tempfile.NamedTemporaryFile(dir=out_dir, prefix=".probe-", suffix=".mp3", delete=False) as f:
        probe_path = Path(f.name)
    try:
        await synth(PROBE_TEXT, voice, rate, probe_path)  # default pitch
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


async def edge_beat(beat, text, voice, rate, mp3_path, out_dir, pitch):
    from edge_tts.exceptions import NoAudioReceived
    try:
        return await synth_with_retries(beat, text, voice, rate, mp3_path, pitch)
    except NoAudioReceived:
        raise SystemExit(await explain_no_audio(beat, voice, rate, out_dir)) from None


KOKORO = {}   # one pipeline per accent, loaded once per run


def kokoro_beat(text, voice, rate, mp3_path):
    """Synthesize locally with Kokoro; word start times come from its predicted durations."""
    import numpy as np
    from kokoro import KPipeline
    lang = voice[0]
    if lang not in KOKORO:
        KOKORO[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
    speed = 1 + float(rate.rstrip("%")) / 100 if rate else 1
    words, chunks, offset = [], [], 0.0
    for r in KOKORO[lang](text, voice=voice, speed=speed):
        audio = np.asarray(r.audio, dtype=np.float32)
        for tk in r.tokens or []:
            if tk.start_ts is not None and any(c.isalnum() for c in tk.text):
                words.append((round(offset + tk.start_ts, 3), tk.text))
        chunks.append(audio)
        offset += len(audio) / 24000
    pcm = (np.clip(np.concatenate(chunks), -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", "-",
                    "-b:a", "64k", str(mp3_path)], input=pcm, check=True)
    return words


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


def time_at(clean, words, estimate=False):
    """Return f(pos): start time of the first spoken word at or after char pos. The voice's word list can stop
    short of the text; with estimate, a position past its last word is timed at the speaking rate so far (seconds
    per character within sentences) plus the voice's mean pause at each sentence end on the way."""
    cursor, located = 0, []
    for t, w in words:
        i = clean.find(w, cursor)
        if i < 0:
            continue
        located.append((i, t))
        cursor = i + len(w)
    ends = lambda a, b: len(SENTENCE_END.findall(clean, a, b))
    pairs = list(zip(located, located[1:]))
    inner = [(i1 - i0, t1 - t0) for (i0, t0), (i1, t1) in pairs if not ends(i0, i1)]
    rate = sum(d for _, d in inner) / max(sum(c for c, _ in inner), 1) if inner else located[-1][1] / max(located[-1][0], 1) if located else 0
    gaps = [t1 - t0 - (i1 - i0) * rate for (i0, t0), (i1, t1) in pairs if ends(i0, i1)]
    pause = max(0, sum(gaps) / len(gaps)) if gaps else .4   # ponytail: a guess when the clip shows no sentence end
    def at(pos):
        t = next((t for i, t in located if i >= pos), None)
        if t is None and estimate and located:
            i, t = located[-1]
            t += (pos - i) * rate + ends(i, pos) * pause
        return None if t is None else round(t, 3)
    return at


def mark_times(clean, marks, words):
    at, out = time_at(clean, words), {}
    for name, pos in marks.items():
        out[name] = at(pos)
        if out[name] is None:
            raise SystemExit(f"mark {name!r} not matched to a spoken word")
    return out


SENTENCE_END = re.compile(r"[.?!]\s+|[。！？]\s*")
ABBREV = re.compile(r"(?<![\w.])(?:Mr|Mrs|Ms|Dr|Prof|St|vs|approx|e\.g|i\.e|cf)\.$")


def caption_cues(clean, words):
    """One cue per sentence: [start seconds, sentence]."""
    at, cues, start = time_at(clean, words, estimate=True), [], 0
    for m in list(SENTENCE_END.finditer(clean)) + [None]:
        if m and ABBREV.search(clean, 0, m.start() + 1):   # "Mr. Lee", "e.g. a lot" go on
            continue
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
    engine, voices = spec.get("engine", "edge"), spec.get("voices", {})
    if engine not in ("edge", "kokoro"):
        raise SystemExit(f"unknown engine {engine!r}: use edge or kokoro")
    result = {}
    public = lambda v: {k: v[k] for k in ("dur", "marks", "cues", "forced") if k in v}
    live = {b: public(v) for b, v in cache.items()
            if {"dur", "marks", "cues"} <= v.keys() and (out_dir / f"{b}.mp3").exists()}
    timings_path = out_dir / "timings.js"
    for beat, raw in spec["beats"].items():
        name = raw.get("speaker") if isinstance(raw, dict) else None
        if name is not None and name not in voices:
            raise SystemExit(f"{beat}: speaker {name!r} is not under the narration file's \"voices\"")
        who = voices[name] if name is not None else spec   # no speaker: the file's own voice
        sub = raw.get("sub") if isinstance(raw, dict) else None   # the line's subtitle, one cue for the whole clip
        raw = raw["text"] if isinstance(raw, dict) else raw
        voice, rate, pitch = who["voice"], who.get("rate", "+0%"), who.get("pitch", "+0Hz")
        if pitch != "+0Hz" and engine == "kokoro":
            raise SystemExit(f"{beat}: pitch is Edge only")
        mp3 = out_dir / f"{beat}.mp3"
        old = cache.get(beat)
        clean, marks = split_marks(raw)
        tag = "" if engine == "edge" else f"{engine}|"   # Edge keys stay as they were, so its audio is kept
        key = hashlib.sha1(f"{tag}{voice}|{rate}|{'' if pitch == '+0Hz' else pitch + '|'}{clean}".encode()).hexdigest()
        # Existing caches included [[marks]] in the key; reuse an unchanged old beat once,
        # then save its spoken-text key so future mark edits do not regenerate audio.
        legacy_key = hashlib.sha1(f"{voice}|{rate}|{raw}".encode()).hexdigest()
        reusable = old and old.get("key") in (key, legacy_key if engine == "edge" else key) and "words" in old and mp3.exists() and mp3.stat().st_size > 0
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
                words = (kokoro_beat(clean, voice, rate, clip) if engine == "kokoro"
                         else await edge_beat(beat, clean, voice, rate, clip, out_dir, pitch))
            entry = {"key": key, "dur": duration(clip), "words": words,
                     "marks": mark_times(clean, marks, words), "cues": [[0, sub]] if sub else caption_cues(clean, words)}
            # a line in another language than the book's (its voice's locale differs): the page shows its subtitle even
            # with captions off, as films do with foreign dialogue
            if sub and "-" in voice and voice.split("-")[0].lower() != Path(src).stem.split(".")[-1].lower():
                entry["forced"] = True
            if tmp:
                tmp.replace(mp3)
                print(f"{beat}: synthesized")
            # Edge has returned clips that stop a sentence early: the last spoken word should end the text
            ends = re.findall(r"[A-Za-z][\w'-]*", clean[-40:])
            if words and ends and clean.isascii() and words[-1][1].strip(".,;:!?\"'") != ends[-1]:
                print(f"{beat}: WARNING the voice's last word is {words[-1][1]!r} but the text ends {ends[-1]!r}: the clip "
                      "may be cut short; listen to it, and synthesize it again (change its cached key) if so")
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
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(0 if sys.argv[1:] in (["-h"], ["--help"]) else 2)
    asyncio.run(main(*sys.argv[1:3]))
