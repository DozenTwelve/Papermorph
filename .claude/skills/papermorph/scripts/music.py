#!/usr/bin/env python3
"""A film's one music track: cut a recording to the film's length so its last note lands on the end, and check the bed
in the voice's pauses.

    uv run --with playwright python music.py cut SRC OUT chNN --url http://localhost:8765/<book>/ [--video] [--rests] [--even] [--lufs -16]
    uv run --with playwright --with numpy python music.py gaps chNN --url http://localhost:8765/<book>/ [--mp4 OUT/chNN.mp4]

--url is the book, as for the other scripts, with the chapter after it; the chapter's own URL (…/<book>/chNN/) without
a chapter works too. A page that fails to load stops the script with its first page error.

cut: the film's length is the sum of every beat's length on screen (the page's P.end, not its clip's dur), read in a
headless page (or given with --length); with --video it is the exported MP4's (export.py leaves out `video: false`
beats, ends a `video: S` one at S and holds a film's waits), so the last note lands on the video's end. When the two
differ the run prints both. The recording's last note lands that long after the in-point: the last moment
its loudness is within 10 LU of its body (the median), so a long decay after it rings past the end instead of leaving
the end card near silence (--end gives it by hand; the run also prints where the sound itself ends). The track runs 2 s
past the film so its ring is not cut; --shift -1 starts it a second earlier, so the last note rings a second past the
last frame. --at T: the music enters T s into the film (after an opener played as an effect): the cut starts with T s of
silence and the recording fills the rest. A recording too short to its last note for that stops the run with how short
it is; --fit [K] then slows it to fit by at most K (default 0.05, five per cent; the pitch is kept). A short fade in, then:
  --rests [DB]   splice out the recording's rests (under -40 dB, or DB, for 0.25 s or more; a classical recording has
                 them, and one falling into a voice pause plays as a staged stop) with 0.15 s crossfades; the in-point
                 moves earlier by what was taken out, so the last note still lands on the end
  --af FILTER    an ffmpeg filter on the cut, e.g. a dip in the voice's band (equalizer=f=1800:t=q:w=1.2:g=-4)
  --even         even it out: dynaudnorm, then a gentle compressor, so quiet phrase ends do not leave holes
  --lift T[:DB]  raise the cut around T s of the film by DB (default 6) dB, easing in and out over about 2 s: a hole
                 gaps names that --even and --rests leave (a phrase end with no rest); repeat for several
  --lufs L       level the file to L LUFS integrated (default -16) with its true peak under --peak (default -1.5),
                 measured and redone as level.py does; the page's music() gain is relative to this, so say both
Writes OUT as MP3 and prints the in-point, the rests it took out and the level.

gaps: the bed as it sounds in the voice-free gaps (0.4 s or more where the beats' clips, placed at each beat's start plus
its `pre`, are quiet). Without --mp4 it measures the bed as the engine plays it: every music() track under its own
beats at its gain (or --bed and --gain, one file under every beat), placed at the length of its earlier beats plus the
beat's clock and looping as often as the film needs, silent where MUSIC_OFF is true, under the 30 % ducking (the
crossfades and MUSIC_UP_IN_PRE lead-ins are not modelled). The film's waits for the reader are not on that timeline:
the music runs on through them, so the run names them and says the track is further on after each. With --mp4 it
measures the exported mix, on the video's timeline (export.py's `video` and `hold`). Prints each gap's quietest momentary
loudness (400 ms) against the median gap, marks a hole (8 LU or more under the median), and the median itself; then
the ending after the last word, marked the same way (a decaying track leaves the end card silent), and, when the page's
track runs under every beat, whether it was cut for this film's length: it says "recut" after any change of length.

--selftest checks the splice and the in-point on a synthetic recording. Needs ffmpeg.
"""
import argparse, asyncio, json, math, pathlib, re, statistics, subprocess, sys, tempfile
import level as lv
from browsers import answers, exe
from tts import duration

XF, TAIL, DUCK, OFF_HZ = .15, 2.0, .3, 20
EVEN = "dynaudnorm=f=400:g=21:p=0.6:m=8,acompressor=threshold=-24dB:ratio=2.5:attack=40:release=400:makeup=2"


def chapter_url(url, ch):
    """The chapter's URL: --url is the book with the chapter given, or the chapter itself."""
    url = url.rstrip("/") + "/"
    if ch: return f"{url}{ch}/"
    if not re.search(r"/ch\d+/$", url): sys.exit(f"--url {url}: give the chapter after it (music.py gaps chNN --url BOOK/) or the chapter's URL")
    return url


async def timeline(url):
    """[(beat id, P.end, pre, silent, MUSIC_OFF at every 1/OFF_HZ s, ask, video, hold, up at every 1/OFF_HZ s, effects,
    cues)] for every beat (silent: { dur }, no clip; up: the music comes up there, in a MUSIC_UP_IN_PRE lead-in or a
    MUSIC_UP moment; effects: its sfx() calls as {at, name, vol, loop, to, src}; cues: its caption cues), the chapter's
    language, its music() tracks [(file, gain, beats)], whether it is a film, and MUSIC_LEVELS ({} by default). A beat
    lists its effects only once it is built, so each beat is opened in turn."""
    from playwright.async_api import async_playwright
    answers(url)
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe()); pg = await b.new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        async def ask(js):
            try: return await pg.evaluate(js)
            except Exception as e: sys.exit(f"{url}: the page did not load: {errs[0] if errs else e}")
        await pg.goto(f"{url}?beat=0&t=0")
        n, lang, bgm, film, levels = await ask("[BEATS.length, CHAPTER.language || 'en', SND.bgm.map(m => [m.a.src, m.gain, m.beats]), !!CHAPTER.film, window.MUSIC_LEVELS || {}]")
        beats = []
        for i in range(n):
            await pg.goto(f"{url}?beat={i}&t=0"); await pg.wait_for_timeout(300)
            beats.append(tuple(await ask(f"""(() => {{ const b = BEATS[P.i];
              return [b.id, P.end, b.pre || 0, !!TIMINGS[b.id].silent,
                      Array.from({{length: Math.ceil(P.end * {OFF_HZ})}}, (_, f) => !!window.MUSIC_OFF?.[b.id]?.(f / {OFF_HZ})),
                      !!b.ask, b.video ?? null, b.hold ?? null,
                      Array.from({{length: Math.ceil(P.end * {OFF_HZ})}}, (_, f) => {{ const t = f / {OFF_HZ}, up = window.MUSIC_UP_IN_PRE;
                        return (up === true || !!up?.includes?.(b.id)) && t < (b.pre || 0) || !!window.MUSIC_UP?.[b.id]?.(t); }}),
                      SND.sfx.filter(e => e.beat === b.id).map(e => ({{at: e.at, name: e.name, vol: e.vol, loop: !!e.loop, to: e.to ?? null,
                        src: new URL(`audio/sfx/${{e.name}}.mp3`, location.href).href}})),
                      TIMINGS[b.id].cues || []]; }})()""")))
        await b.close()
    if errs: print(f"page errors: {'; '.join(sorted(set(errs))[:3])}", file=sys.stderr)
    return beats, lang, bgm, film, levels


def video_timeline(beats, film):
    """timeline()'s beats as export.py cuts the video: a beat with `video: false` (or a lesson's question) left out,
    `video: S` ended S s into its clock, a film's wait held for its `hold` (1.5 s by default)."""
    out = []
    for bid, end, pre, silent, off, ask, video, hold, *rest in beats:
        if video is False or ask and not film: continue
        if isinstance(video, (int, float)) and not isinstance(video, bool): end = min(end, video)
        elif ask: end += 1.5 if hold is None else hold
        out.append((bid, end, pre, silent, off, ask, video, hold, *rest))
    return out


def silences(src, db, d, ss=0.0, t=None):
    """(start, end) of each stretch under db dB for d s or more, in the recording's own seconds; an open end is None."""
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{ss:.3f}", "-i", str(src)] + (["-t", f"{t:.3f}"] if t else [])
    log = subprocess.run(cmd + ["-af", f"silencedetect=n={db}dB:d={d}", "-f", "null", "-"], capture_output=True, text=True).stderr
    out = []
    for m in re.finditer(r"silence_start: (-?[\d.]+)|silence_end: ([\d.]+)", log):
        if m[1]: out.append([float(m[1]) + ss, None])
        elif out: out[-1][1] = float(m[2]) + ss
    return [tuple(x) for x in out]


def sound_end(src):
    """Where the recording's trailing silence (under -50 dB) starts, or its end."""
    s = silences(src, -50, .5)
    dur = duration(src)
    return s[-1][0] if s and (s[-1][1] is None or s[-1][1] > dur - .1) else dur


def last_note(src):
    """The last moment the recording is within 10 LU of its body (median momentary loudness)."""
    M = [(t, m) for t, m in momentary(src) if not math.isnan(m)]
    if not any(m > -70 for _, m in M): sys.exit(f"{src}: no sound above -70 LUFS to find a last note in (silent, or not a recording?)")
    body = statistics.median(m for _, m in M if m > -70)
    return max(.0, max(t for t, m in M if m >= body - 10) - .2)   # the 400 ms window of frame t ends at t + .1: an abrupt end reads .2 s late


def spans(end, at, rests):
    """The recording's spans to keep so that `end` falls `at` s into the cut, rests taken out with XF crossfades;
    returns (spans, rests used). Taking a rest out moves the in-point earlier, which can bring in another one."""
    used = []
    for _ in range(8):
        start = end - at - sum(b - a for a, b in used) - XF * len(used)
        now = [(a, b) for a, b in rests if b is not None and start + .5 < a and b < end - .05]
        if now == used: break
        used = now
    edges = [start] + [x for r in used for x in r] + [None]
    return list(zip(edges[::2], edges[1::2])), used


def cut(a):
    if a.length is None:
        beats, _, _, film, _ = asyncio.run(timeline(a.url))
        page, video = sum(b[1] for b in beats), sum(b[1] for b in video_timeline(beats, film))
        a.length = video if a.video else page
        if abs(page - video) > .05:   # listen-and-find stops, `video` cuts, a film's holds: the MP4 is another length
            print(f"the page's beats run {page:.2f} s, the exported video {video:.2f} s (export.py's `video` and `hold`): cut to "
                  + ("the video" if a.video else "the page; --video cuts it so its last note lands on the MP4's end instead"))
    end, ends = (a.end, None) if a.end is not None else (last_note(a.src), sound_end(a.src))
    at = a.length - a.shift - a.at   # where the last note falls in the recording's part of the cut (after --at's silence)
    if end < at and a.fit:   # too short: slowed (or a long one sped up) by at most --fit, pitch kept
        k = end / at
        if 1 - k > a.fit: sys.exit(f"the recording is {end:.1f} s to its last note, {at - end:.1f} s short of the {at:.1f} s it must fill: "
                                   f"slowing it {1 / k - 1:.1%} is more than --fit {a.fit:.0%}; loop it in the page (music() loops) or find a longer one")
        tmp = pathlib.Path(tempfile.mkdtemp()) / "fit.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a.src), "-af", f"atempo={k:.5f}", str(tmp)], check=True)
        print(f"the recording is {end:.2f} s to its last note, the film needs {at:.2f} s: slowed {1 / k - 1:.1%} (atempo {k:.4f}, pitch kept)")
        a.src, end, ends = tmp, end / k, (ends / k if ends else None)
    found = silences(a.src, a.rests, .25, max(0, end - at - 120), at + 120) if a.rests is not None else []   # ponytail: rests up to 2 min before the in-point, enough for a few short ones
    keep, used = spans(end, at, found)
    if keep[0][0] < 0: sys.exit(f"the recording is {end:.1f} s to its last note, {at - end:.1f} s short of the film's {at:.1f} s"
                                + (f" after --at {a.at:g}" if a.at else "") + f": --fit {math.ceil((1 - end / at) * 100) / 100:.2f} slows it "
                                f"{at / end - 1:.1%} to fit (pitch kept), or loop it in the page (music() loops a shorter track)")
    f = [f"[0]atrim={x:.3f}" + (f":{y:.3f}" if y is not None else "") + f",asetpts=PTS-STARTPTS[s{i}]" for i, (x, y) in enumerate(keep)]
    last = "s0"
    for i in range(1, len(keep)):
        f.append(f"[{last}][s{i}]acrossfade=d={XF}:c1=tri:c2=tri[x{i}]"); last = f"x{i}"
    lifts = [(float(x), float(y or 6)) for x, _, y in (l.partition(":") for l in a.lift)]
    lift = "volume='pow(10,(" + "+".join(f"{db}*exp(-pow((t-{t})/0.9,2))" for t, db in lifts) + ")/20)':eval=frame" if lifts else ""
    chain = ",".join(filter(None, [f"atrim=0:{a.length - a.at + TAIL:.3f}", a.af, EVEN if a.even else "", lift, "afade=t=in:d=0.4"]))
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    seen = []
    def render(gain, lim=None):   # one encode from the recording: each MP3 generation loses some loudness, so none is levelled twice
        # --at: the cut opens with that much silence (the bed enters after an opener), joined by concat (adelay into
        # libmp3lame fails on some ffmpeg builds: "inadequate AVFrame plane padding")
        body = f"[{last}]{chain}{',' + lv.limiter(gain, lim) if lim is not None else ''},aformat=sample_rates=44100:channel_layouts=stereo"
        tail = (f"[b];anullsrc=r=44100:cl=stereo,atrim=0:{a.at:.3f}[z];[z][b]concat=n=2:v=0:a=1[o]" if a.at else "[o]")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(a.src), "-filter_complex", ";".join(f + [body + tail]),
                        "-map", "[o]", "-ar", "44100", "-ac", "2", "-b:a", "160k", str(out)], check=True)
        seen.append(lv.measure(out)[:2]); return seen[-1]
    # levelled by level.py's own loop (the limiter lowered while the peak is over, the best try kept)
    i, tp, g, _ = lv.level_to(render, a.lufs, a.peak, 0.0) if a.lufs is not None else (*render(0.0), 0.0, None)
    i0 = seen[0][0]
    print(f"film {a.length:.2f} s; " + (f"{a.at:g} s of silence, then " if a.at else "") + f"recording from {keep[0][0]:.2f} s, its last note ({end:.2f} s) at {at + a.at:.2f} s of the cut"
          + (f"; its sound ends at {ends:.2f} s (--end {ends:.2f} lands that on the end instead)" if ends and ends - end > .5 else ""))
    if a.rests is not None:
        print(f"rests taken out: {', '.join(f'{x:.2f}-{y:.2f}' for x, y in used) or 'none'}")
    print(f"{out}: {i:.1f} LUFS, {tp:.1f} dBTP" + (f" ({i0:.1f} before levelling, {g:+.1f} dB)" if a.lufs is not None else "")
          + (f": WARNING {a.lufs - i:+.1f} LU from --lufs {a.lufs:g}" if a.lufs is not None and abs(a.lufs - i) > .5 else "")
          + (f": WARNING peak over --peak {a.peak:g}" if a.lufs is not None and tp > a.peak else ""))
    return keep, used


def momentary(src, gain=1.0):
    """[(t, momentary loudness of the 400 ms up to t)] of a file's sound."""
    log = subprocess.run(["ffmpeg", "-nostats", "-i", str(src), "-vn", "-af", f"volume={gain},ebur128=metadata=1,ametadata=print:key=lavfi.r128.M:file=-",
                          "-f", "null", "-"], capture_output=True, text=True).stdout
    return list(zip(map(float, re.findall(r"pts_time:([\d.]+)", log)), map(float, re.findall(r"r128\.M=(-?[\w.]+)", log))))


BR = 44100   # the bed in stereo at the file's rate, so its loudness reads as the track's own and the video's


def levels_of(levels):
    """The engine's two music levels as gains: under a voice (30 %) and up (70 %), or MUSIC_LEVELS' dB."""
    g = lambda k, d: 10 ** (levels[k] / 20) if levels.get(k) is not None else d
    return g("under", DUCK), g("open", .7)


def bed_track(beats, tracks, levels):
    """The music as the engine plays it, in stereo at BR: each track under its own beats at its gain, placed at the
    length of its earlier beats plus the clock and looping, silent where MUSIC_OFF is true, under the duck: 30 % (or
    MUSIC_LEVELS.under), coming up to 70 % (MUSIC_LEVELS.open) in MUSIC_UP_IN_PRE lead-ins and MUSIC_UP moments and
    moving between the two at 1 a second as the engine's does. Returns the bed, each file's length, each beat's length
    and a line saying how it was played. ponytail: the crossfades (0.8 s) between tracks are not modelled."""
    import numpy as np
    under, up = levels_of(levels)
    flags = [x for b in beats for x in (list(b[8]) + [False] * len(b[4]))[:len(b[4])]]   # up, at OFF_HZ, the whole film
    env, d = np.empty(len(flags), np.float32), DUCK   # the engine starts at 30 % whatever the levels
    for k, f in enumerate(flags):
        d += max(-1 / OFF_HZ, min(1 / OFF_HZ, (up if f else under) - d)); env[k] = d
    L = sum(b[1] for b in beats)
    bed, lens, end_of = np.zeros((int((L + 1) * BR), 2), np.float32), [], {b[0]: b[1] for b in beats}
    for src, g, tb in tracks:
        x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "2", "-ar", str(BR), "-f", "f32le", "-"],
                                         capture_output=True, check=True).stdout, np.float32).reshape(-1, 2)
        lens.append(len(x) / BR); t0, e0 = 0.0, 0
        for bid, end, _, _, off, *_ in beats:
            if bid in tb:
                pos, n = sum(end_of.get(b, 0) for b in tb[:tb.index(bid)]), int(end * BR)
                gainf = np.repeat(env[e0:e0 + len(off)], BR // OFF_HZ)
                gainf = np.concatenate([gainf, np.full(max(0, n - len(gainf)), gainf[-1] if len(gainf) else under, np.float32)])[:n]
                seg = x[(int(pos * BR) + np.arange(n)) % len(x)] * g * gainf[:, None]
                mask = np.repeat(np.array(off, bool), BR // OFF_HZ)[:n]
                seg[:len(mask)][mask] = 0
                i = int(t0 * BR); bed[i:i + n] += seg[:len(bed) - i]
            t0 += end; e0 += len(off)
    lifted = any(flags)
    how = (f"ducked to {20 * math.log10(under):.1f} dB ({under:.0%})" + (f", up to {20 * math.log10(up):.1f} dB ({up:.0%}) in "
           "lead-ins and MUSIC_UP moments" if lifted else "") + (" (MUSIC_LEVELS)" if levels else ""))
    return bed, lens, end_of, how


def gaps(a):
    import numpy as np
    beats, lang, bgm, film, levels = asyncio.run(timeline(a.url))
    if a.mp4:   # the video's timeline, as export.py cuts it
        beats = video_timeline(beats, film)
    elif film and (waits := [b[0] for b in beats if b[5]]):
        print(f"{', '.join(waits)} wait{'s' if len(waits) == 1 else ''} for the reader: the music runs on there at 70 %, so after "
              "a wait the track is that much further on than measured here (--mp4 measures the video, which holds or skips each wait)")
    L, SR, hop, w = sum(b[1] for b in beats), 16000, 800, 6400   # 400 ms windows every 50 ms
    pcm = lambda src: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                                   capture_output=True, check=True).stdout, np.float32)
    voice, t0 = np.zeros(int((L + 1) * SR), np.float32), 0.0
    for bid, end, pre, silent, *_ in beats:
        if silent: t0 += end; continue   # no clip: all of it is a gap
        x = pcm(f"{a.url}audio/{lang}/{bid}.mp3")
        i = int((t0 + pre) * SR); x = x[:max(0, min(len(x), int((t0 + end) * SR) - i))]; voice[i:i + len(x)] += x; t0 += end
    quiet = [20 * np.log10(np.sqrt(np.mean(voice[i:i + w] ** 2)) + 1e-9) < -45 for i in range(0, len(voice) - w, hop)]
    runs, k = [], 0   # voice-free stretches: [first window's start, last window's end]
    while k < len(quiet):
        j = k
        while j < len(quiet) and quiet[j]: j += 1
        if j - k >= 8 and (j - 1) * .05 + .4 < L - .5: runs.append((k * .05, (j - 1) * .05 + .4))   # after the last word, the music's own ending
        k = j + 1
    ids = [b[0] for b in beats]
    tracks = [(a.bed, a.gain if a.gain is not None else .4, ids)] if a.bed else \
             [(src, a.gain if a.gain is not None else g, tb) for src, g, tb in bgm]
    if a.mp4:
        M, what = momentary(a.mp4), f"the mix in {a.mp4}"
    else:
        if not tracks: sys.exit("the page has no music(): give --bed FILE")
        bed, lens, end_of, duck = bed_track(beats, tracks, levels)
        with tempfile.TemporaryDirectory() as d:
            wav = pathlib.Path(d) / "bed.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(BR), "-ac", "2", "-i", "-", str(wav)], input=bed.tobytes(), check=True)
            M = momentary(wav)
        what = "; ".join(f"{src.rsplit('/', 1)[-1]} ({ln:.1f} s{', looped' if ln < sum(end_of[b] for b in tb if b in end_of) else ''}) "
                         f"at gain {g} under {len(tb)} beats" for (src, g, tb), ln in zip(tracks, lens)) + f", {duck}" + \
               (", silent in MUSIC_OFF moments" if any(any(b[4]) for b in beats) else "")
    silenced, t0 = [], 0.0   # MUSIC_OFF moments on the timeline: a gap there is meant, not a hole
    for b in beats:
        silenced += [t0 + f / OFF_HZ for f, x in enumerate(b[4]) if x]; t0 += b[1]
    meant = lambda g0, d: any(g0 <= t <= g0 + d for t in silenced)
    rows = []
    for g0, g1 in runs:
        sel = [m for t, m in M if g0 + .4 <= t <= g1]   # windows wholly inside the gap
        if sel: rows.append((g0, g1 - g0, min(sel)))
    if not rows: sys.exit("no voice-free gaps of 0.4 s or more")
    med = statistics.median(r[2] for r in rows)
    print(f"film {L:.2f} s, {len(rows)} voice-free gaps; {what}")
    for t, d, m in rows:
        print(f"gap at {t:6.2f} s for {d:4.2f} s: {m:6.1f} LUFS momentary min ({m - med:+5.1f})"
              + ("  <- MUSIC_OFF (the page silences the music here)" if meant(t, d) else "  <- hole" if m <= med - 8 else ""))
    print(f"median gap {med:.1f} LUFS; {sum(m <= med - 8 and not meant(t, d) for t, d, m in rows)} holes")
    loud = [i for i in range(0, len(voice) - w, hop) if 20 * np.log10(np.sqrt(np.mean(voice[i:i + w] ** 2)) + 1e-9) >= -45]
    last = (loud[-1] + w) / SR if loud else 0.0   # the end of the last word
    tail = [m for t, m in M if last + .4 <= t <= L and not math.isnan(m)]
    if tail and L - last >= .8:   # an end card, not the last word's own ring
        m = statistics.median(tail)
        print(f"ending: {L - last:.2f} s after the last word, {m:6.1f} LUFS momentary median ({m - med:+5.1f})"
              + ("  <- quiet ending: the track decays before the end (music.py cut picks its last note by loudness; or --end)" if m <= med - 8 else ""))
    if not a.bed and len(bgm) == 1 and len(bgm[0][2]) == len(beats):   # the page's one track under every beat: was it cut for this length?
        dur = duration(bgm[0][0])
        if dur > L / 2 and abs(dur - TAIL - L) > .15:   # ponytail: a track under half the film is a loop, not a cut
            print(f"the track is {dur:.2f} s, cut for a {dur - TAIL:.2f} s film; this one is {L:.2f} s: recut it (music.py cut{' --video' if a.mp4 else ''})")
    return rows, med


UNDER_MUSIC, UNDER_BED, UNDER_FX = 10, 15, 6   # dB under the voice: the figures mix checks against


def mix(a):
    """Every caption line against what sounds under it, at the levels the page plays them: the music bed, the looping
    effect beds (rain, room tone) and the one-shot effects. Each in dB under the line's voice."""
    import numpy as np
    beats, lang, bgm, film, levels = asyncio.run(timeline(a.url))
    L = sum(b[1] for b in beats)
    stem = lambda: np.zeros((int((L + 1) * BR), 2), np.float32)
    voice, beds, shots = stem(), stem(), stem()
    dec = {}
    def pcm(src):
        if src not in dec:
            dec[src] = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "2", "-ar", str(BR), "-f", "f32le", "-"],
                                                    capture_output=True, check=True).stdout, np.float32).reshape(-1, 2)
        return dec[src]
    def put(track, at, x, g, stop):
        i, j = int(at * BR), min(len(track), int(at * BR) + len(x), int(stop * BR))
        if j > i: track[i:j] += x[:j - i] * g
    lines, t0, lost = [], 0.0, []
    for bid, end, pre, silent, off, ask, video, hold, up, fx, cues in beats:
        if not silent: put(voice, t0 + pre, pcm(f"{a.url}audio/{lang}/{bid}.mp3"), 1, t0 + end)
        for e in fx:   # as the engine plays them: half volume (vol 2 is full), a bed laid again every its length - 0.5 s
            x = pcm(e["src"]); g = .5 * e["vol"]
            if e["loop"]:
                stop, step, at = end if e["to"] is None else min(end, e["to"]), max(.5, len(x) / BR - .5), e["at"]
                while 0 <= at < stop: put(beds, t0 + at, x, g, t0 + stop); at += step
            elif 0 <= e["at"] < end: put(shots, t0 + e["at"], x, g, t0 + end)
            else: lost.append(f"{bid} {e['name']}@{e['at']}")
        for k, c in enumerate(cues):   # [t, line, end?] on the clip's clock
            stop = c[2] if len(c) > 2 and c[2] is not None else cues[k + 1][0] if k + 1 < len(cues) else end - pre
            if stop - c[0] >= .6: lines.append((t0 + pre + c[0], t0 + pre + stop, bid, c[1]))
        t0 += end
    tracks = [(src, g, tb) for src, g, tb in bgm]
    music, how = (bed_track(beats, tracks, levels)[::3] if tracks else (stem(), "no music()"))
    with tempfile.TemporaryDirectory() as d:
        M = {}
        for name, x in (("voice", voice), ("music", music), ("beds", beds), ("effects", shots)):
            f = pathlib.Path(d) / f"{name}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(BR), "-ac", "2", "-i", "-", str(f)], input=x.tobytes(), check=True)
            M[name] = [(t, m) for t, m in momentary(f) if not math.isnan(m)]
    def span(name, t0, t1, f):   # f of the momentary loudness of the 400 ms windows inside [t0, t1], or None (silent)
        v = [m for t, m in M[name] if t0 + .4 <= t <= t1 and m > -70]
        return f(v) if v else None
    print(f"film {L:.2f} s, {len(lines)} lines; music {how}. Momentary loudness (400 ms): the voice while it speaks (its windows "
          "within 10 dB of the line's loudest), the music and beds as their median over the line, an effect as its loudest "
          "against the line's loudest")
    print("voice in LUFS; the other columns in dB against it (-12: 12 dB under the voice), fx against the line's loudest")
    print(f"{'at':>7}  {'beat':10} {'voice':>6} {'music':>7} {'beds':>7} {'fx':>7}  line")
    rows, flags = [], 0
    for t0, t1, bid, text in lines:
        vmax = span("voice", t0, t1, max)
        if vmax is None: continue
        v = span("voice", t0, t1, lambda ms: statistics.median(m for m in ms if m > vmax - 10))   # while it speaks, not its pauses
        mu, bd, fx = span("music", t0, t1, statistics.median), span("beds", t0, t1, statistics.median), span("effects", t0, t1, max)
        why = [w for w, bad in (("music close to the voice", mu is not None and v - mu < UNDER_MUSIC),
                                ("a bed close to the voice", bd is not None and v - bd < UNDER_BED),
                                ("an effect as loud as the line", fx is not None and vmax - fx < UNDER_FX)) if bad]
        flags += bool(why)
        rel = lambda x, ref=v: f"{x - ref:+7.1f}" if x is not None else f"{'-':>7}"
        print(f"{t0:7.2f}  {bid:10} {v:6.1f} {rel(mu)} {rel(bd)} {rel(fx, vmax)}  {text[:48]}" + (f"  <- {', '.join(why)}" if why else ""))
        rows.append((v, mu, bd))
    med = lambda xs: statistics.median(xs) if xs else None
    dm, db = med([v - mu for v, mu, _ in rows if mu is not None]), med([v - bd for v, _, bd in rows if bd is not None])
    gap_mu = med([m for t, m in M["music"] if m > -70 and not any(a0 <= t <= a1 + .4 for a0, a1, *_ in lines)])
    line_mu = med([mu for _, mu, _ in rows if mu is not None])
    print(f"median: music {dm:.1f} dB under the voice" if dm is not None else "no music under the lines", end="")
    print(f", beds {db:.1f} dB under" if db is not None else "", end="")
    print(f"; music between the lines {gap_mu - line_mu:+.1f} dB against under them" if gap_mu is not None and line_mu is not None else "")
    print(f"{flags} lines flagged (music under {UNDER_MUSIC} dB, a bed under {UNDER_BED} dB below the voice, an effect's loudest "
          f"moment within {UNDER_FX} dB of the line's)")
    if lost: print(f"effects due past their beat's end, which never play: {', '.join(lost)}")
    return rows


def selftest():
    """A 30 s recording: tone, two rests (0.5 s at 16 s, 0.4 s at 20 s), a last note ending at 28 s, then silence. Cut to
    a 14 s film with --rests: both rests found and taken out, the in-point earlier by them and the crossfades, the last
    note still at 14 s of the cut, the file levelled; without --rests the in-point is plain end minus length."""
    with tempfile.TemporaryDirectory() as d:
        src, out = pathlib.Path(d) / "rec.wav", pathlib.Path(d) / "cut.mp3"
        tone = "0.3*sin(2*PI*330*t)*(1-between(t,16,16.5))*(1-between(t,20,20.4))*lt(t,28)"
        subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"aevalsrc='{tone}':d=30:s=44100", str(src)], check=True)
        assert abs(last_note(src) - 28) < .05, last_note(src)
        a = argparse.Namespace(src=src, out=out, url=None, length=14.0, video=False, end=None, shift=0.0, rests=-40.0, af="", even=False, lufs=-16.0, peak=-1.5, lift=[], at=0.0, fit=0.0)
        keep, used = cut(a)
        assert len(used) == 2 and abs(used[0][0] - 16) < .05 and abs(used[1][1] - 20.4) < .05, used
        assert abs(keep[0][0] - (28 - 14 - .9 - 2 * XF)) < .1, keep[0]
        i, tp, dur, _ = lv.measure(out)
        assert abs(i + 16) < .6 and tp <= -1.5 and abs(dur - 16) < .1, (i, tp, dur)
        rest = [s for s in silences(out, -40, .25) if s[0] < 13.9]   # the silence after the last note stays
        assert not rest, f"a rest is left in the cut: {rest}"
        a.rests, a.lufs = None, None
        keep, _ = cut(a)
        assert abs(keep[0][0] - 14) < .05 and len(keep) == 1, keep
        # --at: 3 s of silence first, the last note still on the film's end; a 30 s film needs --fit (28 s to the note)
        a.at = 3.0; keep, _ = cut(a)
        assert abs(keep[0][0] - (28 - 11)) < .05, keep
        assert silences(out, -50, 2.5) and silences(out, -50, 2.5)[0][0] < .05 and 2.9 < silences(out, -50, 2.5)[0][1] < 3.2, silences(out, -50, 2.5)
        a.at, a.length, a.fit = 0.0, 29.0, .05; keep, _ = cut(a)
        assert keep[0][0] < .2 and abs(last_note(out) - 29) < .3, (keep, last_note(out))
    # the video's timeline: a listen-and-find stop out, `video: S` cut at S, a film's wait held, `video: true` as it is
    beats = [("a", 5, 0, False, [], False, None, None), ("find", 4, 0, False, [], True, False, None), ("mill", 6, 0, False, [], True, 3.6, None),
             ("fire", 2, 0, False, [], True, None, None), ("end", 3, 0, False, [], False, True, None)]
    assert [b[1] for b in video_timeline(beats, True)] == [5, 3.6, 3.5, 3], video_timeline(beats, True)
    assert [b[0] for b in video_timeline(beats, False)] == ["a", "end"], "a lesson's questions are left out"
    print("music.py selftest passed")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--selftest", action="store_true", help="check the splice and the in-point on a synthetic recording")
    sub = ap.add_subparsers(dest="cmd")
    c = sub.add_parser("cut", help="cut a recording to the film's length, ending on its last note")
    c.add_argument("src", type=pathlib.Path); c.add_argument("out"); c.add_argument("chapter", nargs="?", help="chNN, with --url the book")
    c.add_argument("--url", help="the book, served (http://localhost:8765/<book>/), or the chapter's URL")
    c.add_argument("--length", type=float, help="the film's length in s, instead of reading the page")
    c.add_argument("--video", action="store_true", help="cut to the exported MP4's length (export.py's `video` and `hold`), not the page's")
    c.add_argument("--end", type=float, help="the recording's last note in s (default: the last moment within 10 LU of its body)")
    c.add_argument("--shift", type=float, default=0.0, help="move the in-point by this many s (-1: the last note a second past the end)")
    c.add_argument("--at", type=float, default=0.0, metavar="T", help="the music enters T s into the film (after an opener): the cut starts with T s of silence")
    c.add_argument("--fit", type=float, nargs="?", const=.05, default=0.0, metavar="K",
                   help="a recording too short to its last note is slowed to fit, by at most K (default 0.05: 5 %%), pitch kept")
    c.add_argument("--rests", type=float, nargs="?", const=-40.0, metavar="DB", help="splice out rests under DB (default -40) for 0.25 s or more")
    c.add_argument("--af", default="", help="an ffmpeg filter on the cut, e.g. an EQ dip or a gentler dynaudnorm")
    c.add_argument("--even", action="store_true", help="dynaudnorm and a gentle compressor")
    c.add_argument("--lift", action="append", default=[], metavar="T[:DB]", help="raise the cut around T s by DB (default 6) dB; repeatable")
    c.add_argument("--lufs", type=float, default=-16.0, help="integrated loudness of the file (default -16)")
    c.add_argument("--peak", type=float, default=-1.5, help="true-peak ceiling in dBTP (default -1.5)")
    x = sub.add_parser("mix", help="every caption line against the music, the effect beds and the effects under it")
    x.add_argument("chapter", nargs="?", help="chNN, with --url the book")
    x.add_argument("--url", required=True, help="the book, served (http://localhost:8765/<book>/), or the chapter's URL")
    g = sub.add_parser("gaps", help="the bed's loudness in the voice-free gaps")
    g.add_argument("chapter", nargs="?", help="chNN, with --url the book")
    g.add_argument("--url", required=True, help="the book, served (http://localhost:8765/<book>/), or the chapter's URL")
    g.add_argument("--mp4", help="measure this exported mix instead of the page's track")
    g.add_argument("--bed", help="a music file to measure instead of the page's first music() track")
    g.add_argument("--gain", type=float, help="its music() gain (default: the page's, else 0.4)")
    a = ap.parse_args()
    if a.selftest: return selftest()
    if a.cmd is None: ap.error("cut, gaps or mix (or --selftest)")
    if a.url: a.url = chapter_url(a.url, a.chapter)
    if a.cmd == "cut" and a.url is None and a.length is None: ap.error("cut needs --url or --length")
    {"cut": cut, "gaps": gaps, "mix": mix}[a.cmd](a)


if __name__ == "__main__":
    main()
