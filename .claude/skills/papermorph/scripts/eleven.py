#!/usr/bin/env python3
"""Narration with OpenRouter's ElevenLabs voices; marks and caption cues from local word alignment (faster-whisper).

    uv run --with faster-whisper --with numpy python eleven.py content/<book>/ch01/narration.en.json site/<book>/ch01/audio/en
    ... [--model elevenlabs/eleven-v4] [--voice george] [--only beat,beat] [--dry] [--ledger books/<book>/art/costs.tsv]
    ... [--lufs -14] [--peak -1.5] [--no-level] [--max-pause 0.3] [--tempo 1.1]

Same input and output as tts.py: the narration file's beats with [[mark]] tags in, <beat>.mp3 and timings.js
({dur, marks, cues} per beat) out, so the page cannot tell the two apart. The voice and model come from the flags,
else from the narration file ("voice", "model"), else george and eleven-v4; OpenRouter offers 21 preset voices. A beat
may be {"speaker": name, "text": ...} with the speaker's "voice" under the file's "voices", as in tts.py (no speaker:
the file's voice),
and a "sub": a line in another language, whose subtitle is its one caption cue, shown even with captions off (forced);
Whisper detects that line's language.

ElevenLabs returns no word timings, so each clip is transcribed locally (faster-whisper base.en, or base for another
language, from the file name narration.<lang>.json; the first run downloads the model) and the script's words are
matched to the heard words in order (Chinese and Japanese, which have no spaces between words, character by
character); each [[mark]] is the start of the word after it, and there is one caption cue per sentence (。！？ end
one too) and per clause after a colon, split by tts.py's own rules ("Mr." and "e.g." do not end one). Whisper writes spoken numbers in
digits ("a hundred and twenty" heard as "120"): a number's first word is matched to such a heard number, so a mark on it
lands on the number's start. A rerun prints the marks that moved more than 0.1 s against the old timings.js. Every word's heard time also goes
in the .timings.json beside the narration, as tts.py writes it, so a picture book's mouths.py and join.py --words work
on these clips too. A word Whisper starts inside a pause (it often does, up to 0.7 s early) is moved to where the
sound comes back, and the run prints it. Audio is decoded with ffmpeg, not PyAV (faster-whisper's PyAV version clashes). Needs ffmpeg.

v4 audio tags such as [cackles] or [whispers] act: they are performed, not read aloud, and left out of captions.
Price: about $0.00008 per character (about $0.65 for a ten-minute film). Before paying, the run prints the characters
it will synthesize and their estimated cost; --dry stops there. --ledger appends the characters the run synthesized
(also when it stops partway, say on a 402 for credit: timings.js then has the beats it finished, the beats it did not reach keep
their old timings, as their clips are unchanged, and the run names each beat still on its old take or not voiced at all) and their estimated cost to the ledger paint.py writes (OpenRouter reports no cost for
speech).

Each beat's clip is cached beside the narration as .eleven/<beat>.<hash>.mp3 (hash of model, voice and text), so
moving marks or rerunning never pays twice. --only takes the listed beats again (a fresh, paid take, even with the
text unchanged) and leaves the others' mp3 and timings as they are. A clip levelled in place (level.py) is kept by
later runs until its take changes: .eleven/takes.json records which take each output clip (by its folder and name, en/open.mp3) was copied from.
The key is read from ~/.config/openrouter/key or $OPENROUTER_API_KEY.

ElevenLabs delivers about -23 LUFS, which sinks under music, so every output clip is levelled to --lufs (default -14)
with its true peak under --peak (default -1.5 dBTP) by level.py, and the run prints each clip's loudness before and
after; a clip already level is left as it is, so a rerun changes nothing. --no-level leaves the clips as delivered
(level them later with level.py --lufs). --max-pause S shortens every pause inside a clip (under -38 dB, not its
leading or trailing silence) longer than S to S, keeping S/2 at each side: a short's length hides in the voice's own
sentence pauses (0.4 to 1.0 s). It runs before the alignment, so the marks and cues come from the shortened clip; a
shortened clip has no pause left to shorten, so a rerun keeps it. One cap for every pause of every beat; a pause that
should stay long (a turn of the film) needs its beat run without it.

--tempo K (or "tempo": K in the narration file, which a rerun then keeps without the flag) speeds every clip up
(1.1: a tenth faster) or slows it, pitch kept (ffmpeg atempo, 0.5 to 2), before the pauses, the levelling and the
alignment, so the marks, cues and loudness come from the clip as heard. takes.json records the tempo with the take, so a
rerun keeps a sped clip, and a changed tempo makes it again from the cached take (no new take is paid for).
"""
import argparse, atexit, hashlib, json, pathlib, re, subprocess, sys, urllib.error, urllib.request
from paint import key
from ledger import append
from tts import split_marks, mark_times, duration, write_atomic, tokens, sentences, js_object
from silence import silences
import level as lv

TAG = re.compile(r"(?<!\[)\[[^\[\]]+\](?!\])")   # a v4 audio tag, not a [[mark]]
PRICE = 0.00008   # USD per character

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("narration"); ap.add_argument("out")
ap.add_argument("--model"); ap.add_argument("--voice")
ap.add_argument("--only", default="", help="comma-separated beats to take again")
ap.add_argument("--dry", action="store_true", help="print what would be synthesized and its cost, then stop")
ap.add_argument("--ledger", help="tab-separated cost log to append the estimate to, e.g. books/<book>/art/costs.tsv")
ap.add_argument("--lufs", type=float, default=-14, help="level every clip to this integrated loudness (default -14)")
ap.add_argument("--peak", type=float, default=-1.5, help="true-peak ceiling of the levelled clips in dBTP (default -1.5)")
ap.add_argument("--no-level", action="store_true", help="leave the clips at the loudness the voice service delivered")
ap.add_argument("--max-pause", type=float, metavar="S", help="shorten pauses inside a clip longer than S seconds to S")
ap.add_argument("--tempo", type=float, metavar="K", help="speed the clips by K (1.1), pitch kept (default: the narration file's \"tempo\", else 1)")
a = ap.parse_args()
spec = json.loads(pathlib.Path(a.narration).read_text(encoding="utf-8-sig"))
tempo = a.tempo or spec.get("tempo", 1)
if not .5 <= tempo <= 2: sys.exit(f"--tempo {tempo}: give 0.5 to 2")
model = a.model or spec.get("model", "elevenlabs/eleven-v4")
lang = pathlib.Path(a.narration).stem.split(".")[-1]
if not re.fullmatch(r"[a-z]{2,3}", lang):   # Whisper is told the language: "narration" would stop it with a ValueError
    sys.exit(f"{a.narration}: name the file narration.<language>.json (narration.en.json, narration.zh.json); the transcript's language comes from it")
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
cache = pathlib.Path(a.narration).parent / ".eleven"; cache.mkdir(exist_ok=True)
only = set(filter(None, a.only.split(",")))
if only - spec["beats"].keys():
    sys.exit(f"--only: no beat {', '.join(sorted(only - spec['beats'].keys()))}")


def tighten(mp3, cap):
    """Shorten the pauses inside mp3 longer than cap to cap, in place; returns the seconds cut."""
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(mp3), "-af", "silencedetect=n=-38dB:d=0.3", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    dur, cuts = duration(mp3), []
    for x, y in re.findall(r"silence_start: ([\d.]+).*?silence_end: ([\d.]+)", log, re.S):
        x, y = float(x), float(y)
        if x > .05 and y < dur - .05 and y - x > cap + .05:   # inside the clip; one already near the cap stays
            cuts.append((x + cap / 2, y - cap / 2))
    if not cuts: return 0.0
    keep = list(zip([0.0] + [y for _, y in cuts], [x for x, _ in cuts] + [None]))
    parts = "".join(f"[0]atrim={x:.3f}{'' if y is None else f':{y:.3f}'},asetpts=N/SR/TB[p{i}];" for i, (x, y) in enumerate(keep))
    tmp = mp3.with_suffix(".part")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-filter_complex", parts + "".join(f"[p{i}]" for i in range(len(keep)))
                    + f"concat=n={len(keep)}:v=0:a=1", "-b:a", "128k", "-f", "mp3", str(tmp)], check=True)
    tmp.replace(mp3)
    return sum(y - x for x, y in cuts)


def atempo(mp3, k):
    tmp = mp3.with_suffix(".part")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-filter:a", f"atempo={k}", "-b:a", "128k", "-f", "mp3", str(tmp)], check=True)
    tmp.replace(mp3)


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
    tmp = dst.with_suffix(".part"); tmp.write_bytes(data); tmp.replace(dst)   # a half-written take is never a cached one


norm = lambda w: re.sub(r"\W", "", w.lower())
NUM = re.compile("(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|"
                 "seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)+")
JOIN = {"a", "an", "and", "point", "half"}   # inside a number: "a hundred and twenty", "seven point one"
asr = {}
tf = out / "timings.js"
old = {}
if tf.exists():
    old = js_object(tf)
tk = cache / "takes.json"   # output clip -> the cached take it was copied from
clip_key = lambda f: "/".join(pathlib.Path(f).parts[-2:])   # en/open.mp3: the same in any clone (older runs: the full path)
takes = {clip_key(k): v for k, v in json.loads(tk.read_text()).items()} if tk.exists() else {}
takes0 = dict(takes)   # as the run found them: a clip whose take this run has not replaced still matches its old timings
beats = []
for beat, raw in spec["beats"].items():
    who = raw.get("speaker") if isinstance(raw, dict) else None
    if who is not None and who not in spec.get("voices", {}):
        sys.exit(f"{beat}: speaker {who!r} is not under the narration file's \"voices\"")
    voice = spec["voices"][who]["voice"] if who is not None else a.voice or spec.get("voice", "george")
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
timings, spent = {}, 0
wc_path = pathlib.Path(a.narration).with_suffix(".timings.json")   # every word's heard time, for mouths.py and join.py
wcache = json.loads(wc_path.read_text(encoding="utf-8")) if wc_path.exists() else {}


def charge():
    """Log what was paid for, once the takes are made: a run stopped partway logs only its finished takes."""
    if a.ledger and spent:
        append(a.ledger, a.out, model, f"tts{spent}c", f"{spent * PRICE:.4f}")


atexit.register(charge)   # at the end, or when a later step (a failed take, Whisper) stops the run
done = []


def save():
    """timings.js, takes and word times for every beat finished so far: a run stopped partway (a 402 for credit) keeps
    what it paid for usable, keeps the old timings of the beats it did not reach (their clips are the ones those
    timings were made on), and says what is missing."""
    stale = []
    for beat, *_, fresh in beats:
        mp3 = out / f"{beat}.mp3"
        if beat not in timings and beat in old and mp3.exists() and takes.get(clip_key(mp3)) == takes0.get(clip_key(mp3)):
            timings[beat] = old[beat]; stale += [beat] if fresh else []
    if stale: print(f"WARNING {len(stale)} beats keep their old take, not voiced again: {', '.join(stale)}", file=sys.stderr)
    ordered = {b[0]: timings[b[0]] for b in beats if b[0] in timings}
    write_atomic(tf, "window.TIMINGS = " + json.dumps(ordered, indent=1, ensure_ascii=False) + ";\n")
    write_atomic(tk, json.dumps(takes, indent=1))
    write_atomic(wc_path, json.dumps(wcache, indent=1, ensure_ascii=False))
    left = [b[0] for b in beats if b[0] not in timings]
    if left: print(f"WARNING {len(left)} beats not voiced, left out of {tf}: {', '.join(left[:12])}{' …' if len(left) > 12 else ''}", file=sys.stderr)


atexit.register(lambda: done or save())   # stopped partway: keep the finished beats
for beat, voice, sub, clean, marks, cached, fresh in beats:
    if only and beat not in only and beat in old:
        timings[beat] = old[beat]; continue   # --only leaves the other beats alone
    if not fresh and not cached.exists():
        print(f"{beat}: WARNING not in {tf} and not cached, left out: run without --only to make it", file=sys.stderr); continue
    if fresh:
        speak(clean, voice, cached); spent += len(clean); print(beat, "synthesized")
    mp3 = out / f"{beat}.mp3"
    take = cached.name + (f"@{tempo:g}" if tempo != 1 else "")
    if fresh or not mp3.exists() or takes.get(clip_key(mp3)) != take:   # else keep it: perhaps levelled since
        mp3.write_bytes(cached.read_bytes()); takes[clip_key(mp3)] = take
        if tempo != 1: atempo(mp3, tempo)
    if a.max_pause and (cut := tighten(mp3, a.max_pause)): print(f"{beat}: pauses over {a.max_pause} s shortened, -{cut:.2f} s")
    if not a.no_level: print(lv.one(mp3, mp3, argparse.Namespace(lufs=a.lufs, gain=None, peak=a.peak)), flush=True)
    m = "base" if sub or lang != "en" else "base.en"
    if m not in asr:
        import numpy as np
        from faster_whisper import WhisperModel
        asr[m] = WhisperModel(m, device="cpu", compute_type="int8")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    segs, _ = asr[m].transcribe(np.frombuffer(pcm, np.float32), word_timestamps=True, language=None if sub else lang)
    heard = []   # each heard word; a Chinese or Japanese one split into characters spread over its time, as the script is
    for s in segs:
        for w in s.words:
            ts = [norm(t) for t in tokens(w.word) if norm(t)]
            heard += [(t, round(w.start + (w.end - w.start) * k / len(ts), 3)) for k, t in enumerate(ts)]
    # the script's words (audio tags blanked out, positions kept), matched to heard words in order with a small look-ahead
    spoken = TAG.sub(lambda m: " " * len(m.group()), clean)
    toks = [w for w in tokens(spoken) if norm(w)]
    ws, times, j, run = [norm(w) for w in toks], [], 0, None
    for i, w in enumerate(ws):
        win = range(j, min(j + 6, len(heard)))
        if run is not None and (NUM.fullmatch(w) or w in JOIN) and not re.search(r"[.,:;!?]$", toks[i - 1]):
            k = j if j < len(heard) and heard[j][0] == w else None   # the rest of a number heard as digits ("million")
            times.append(run if k is None else heard[k][1]); j = j if k is None else k + 1   # else at the digits' start
            continue
        k = next((k for k in win if heard[k][0] == w or len(w) >= 4 and heard[k][0].startswith(w[:4])), None)
        run = None
        if NUM.fullmatch(w) or w in JOIN and i + 1 < len(ws) and NUM.fullmatch(ws[i + 1]):   # a number's first word
            d = next((k for k in win if any(c.isdigit() for c in heard[k][0])), None)
            if d is not None and (k is None or d < k): k, run = d, heard[d][1]
        times.append(None if k is None else heard[k][1]); j = j if k is None else k + 1
    dur = duration(mp3)
    # Whisper starts a word that follows a pause inside the pause (up to 0.7 s early, the mouth moving in silence):
    # a word heard inside a silence starts where the sound comes back
    gaps = [(a, b) for a, b in silences(mp3) if b < dur - .05]
    for i, v in enumerate(times):
        g = next(((a, b) for a, b in gaps if v is not None and a - .02 <= v < b - .02), None)
        if g:
            print(f"{beat}: {toks[i]!r} moved from {v:.2f} to the end of the pause, {g[1]:.2f}")
            times[i] = round(g[1], 3)
    # ... or puts the word after a pause before it ("river? Isn't it" heard as Isn't@0.54, pause 0.78-1.21, it@1.46):
    # when no word starts where a pause of 0.3 s or more ends and the next word comes later than 0.2 s after it,
    # the last word before the pause is the one spoken there
    for g0, g1 in gaps:   # (not a, b: `a` holds the arguments)
        if g1 - g0 < .3 or any(v is not None and abs(v - g1) < .03 for v in times): continue
        k = max((q for q, v in enumerate(times) if v is not None and v < g0), default=None)
        n = next((v for v in times[k + 1:] if v is not None), None) if k is not None else None
        if k is not None and k > 0 and n is not None and n > g1 + .2:
            print(f"{beat}: {toks[k]!r} moved from {times[k]:.2f} past the pause to {g1:.2f}")
            times[k] = round(g1, 3)
    for i, v in enumerate(times):   # words Whisper merged or split: halfway between their known neighbours
        if v is None:
            prev = next((times[q] for q in range(i - 1, -1, -1) if times[q] is not None), 0.0)
            nxt = next((times[q] for q in range(i + 1, len(times)) if times[q] is not None), dur)
            times[i] = round(prev + (nxt - prev) * .5, 3)
    words = list(zip(times, toks))
    # caption cues: one per sentence or clause after a colon (long documentary sentences), at its first word
    # (tts.py's own splitter, so "Mr. Lee" goes on, "I... I can't" stays one line and 。！？ end a sentence)
    cues, i = [], 0
    for s0, s1 in sentences(spoken, colon=True):   # spoken: a tag parts words
        n = len([w for w in tokens(spoken[s0:s1]) if norm(w)])
        if n: cues.append([round(times[i], 3) if i < len(times) else 0, re.sub(r"\s+", " ", spoken[s0:s1]).strip()]); i += n
    if cues: cues[0][0] = min(cues[0][0], .1)
    timings[beat] = {"dur": dur, "marks": mark_times(clean, marks, words), "cues": [[0, sub]] if sub else cues}
    if sub: timings[beat]["forced"] = True
    wcache[beat] = {"dur": dur, "words": [[t, w] for t, w in words], "lag": 0}   # heard times: no Edge lead to correct
    moved = [f"{k} {old[beat]['marks'][k]} -> {v}" for k, v in timings[beat]["marks"].items()
             if k in old.get(beat, {}).get("marks", {}) and abs(old[beat]["marks"][k] - v) > .1]
    if moved: print(f"{beat}: marks moved: {', '.join(moved)}")
    print(f"{beat}: {dur} s, {len(marks)} marks")
save(); done.append(1)
print(f"{len(timings)} beats in {tf}; synthesized {spent} characters, about ${spent * PRICE:.2f}")
