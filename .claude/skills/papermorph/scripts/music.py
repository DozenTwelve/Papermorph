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
last frame. A short fade in, then:
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
    """[(beat id, P.end, pre, silent, MUSIC_OFF at every 1/OFF_HZ s, ask, video, hold)] for every beat (silent: { dur },
    no clip), the chapter's language, its music() tracks [(file, gain, beats)] and whether it is a film."""
    from playwright.async_api import async_playwright
    answers(url)
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe()); pg = await b.new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        async def ask(js):
            try: return await pg.evaluate(js)
            except Exception as e: sys.exit(f"{url}: the page did not load: {errs[0] if errs else e}")
        await pg.goto(f"{url}?beat=0&t=0")
        n, lang, bgm, film = await ask("[BEATS.length, CHAPTER.language || 'en', SND.bgm.map(m => [m.a.src, m.gain, m.beats]), !!CHAPTER.film]")
        beats = []
        for i in range(n):
            await pg.goto(f"{url}?beat={i}&t=0"); await pg.wait_for_timeout(300)
            beats.append(tuple(await ask(f"""(() => {{ const b = BEATS[P.i];
              return [b.id, P.end, b.pre || 0, !!TIMINGS[b.id].silent,
                      Array.from({{length: Math.ceil(P.end * {OFF_HZ})}}, (_, f) => !!window.MUSIC_OFF?.[b.id]?.(f / {OFF_HZ})),
                      !!b.ask, b.video ?? null, b.hold ?? null]; }})()""")))
        await b.close()
    if errs: print(f"page errors: {'; '.join(sorted(set(errs))[:3])}", file=sys.stderr)
    return beats, lang, bgm, film


def video_timeline(beats, film):
    """timeline()'s beats as export.py cuts the video: a beat with `video: false` (or a lesson's question) left out,
    `video: S` ended S s into its clock, a film's wait held for its `hold` (1.5 s by default)."""
    out = []
    for bid, end, pre, silent, off, ask, video, hold in beats:
        if video is False or ask and not film: continue
        if isinstance(video, (int, float)) and not isinstance(video, bool): end = min(end, video)
        elif ask: end += 1.5 if hold is None else hold
        out.append((bid, end, pre, silent, off, ask, video, hold))
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
        beats, _, _, film = asyncio.run(timeline(a.url))
        page, video = sum(b[1] for b in beats), sum(b[1] for b in video_timeline(beats, film))
        a.length = video if a.video else page
        if abs(page - video) > .05:   # listen-and-find stops, `video` cuts, a film's holds: the MP4 is another length
            print(f"the page's beats run {page:.2f} s, the exported video {video:.2f} s (export.py's `video` and `hold`): cut to "
                  + ("the video" if a.video else "the page; --video cuts it so its last note lands on the MP4's end instead"))
    end, ends = (a.end, None) if a.end is not None else (last_note(a.src), sound_end(a.src))
    at = a.length - a.shift   # where the last note falls in the cut
    found = silences(a.src, a.rests, .25, max(0, end - at - 120), at + 120) if a.rests is not None else []   # ponytail: rests up to 2 min before the in-point, enough for a few short ones
    keep, used = spans(end, at, found)
    if keep[0][0] < 0: sys.exit(f"the recording is {end:.1f} s to its last note, shorter than the film's {at:.1f} s")
    f = [f"[0]atrim={x:.3f}" + (f":{y:.3f}" if y is not None else "") + f",asetpts=PTS-STARTPTS[s{i}]" for i, (x, y) in enumerate(keep)]
    last = "s0"
    for i in range(1, len(keep)):
        f.append(f"[{last}][s{i}]acrossfade=d={XF}:c1=tri:c2=tri[x{i}]"); last = f"x{i}"
    lifts = [(float(x), float(y or 6)) for x, _, y in (l.partition(":") for l in a.lift)]
    lift = "volume='pow(10,(" + "+".join(f"{db}*exp(-pow((t-{t})/0.9,2))" for t, db in lifts) + ")/20)':eval=frame" if lifts else ""
    chain = ",".join(filter(None, [f"atrim=0:{a.length + TAIL:.3f}", a.af, EVEN if a.even else "", lift, "afade=t=in:d=0.4"]))
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    seen = []
    def render(gain, lim=None):   # one encode from the recording: each MP3 generation loses some loudness, so none is levelled twice
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(a.src), "-filter_complex",
                        ";".join(f + [f"[{last}]{chain}{',' + lv.limiter(gain, lim) if lim is not None else ''}[o]"]),
                        "-map", "[o]", "-ar", "44100", "-ac", "2", "-b:a", "160k", str(out)], check=True)
        seen.append(lv.measure(out)[:2]); return seen[-1]
    # levelled by level.py's own loop (the limiter lowered while the peak is over, the best try kept)
    i, tp, g, _ = lv.level_to(render, a.lufs, a.peak, 0.0) if a.lufs is not None else (*render(0.0), 0.0, None)
    i0 = seen[0][0]
    print(f"film {a.length:.2f} s; recording from {keep[0][0]:.2f} s, its last note ({end:.2f} s) at {at:.2f} s of the cut"
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


def gaps(a):
    import numpy as np
    beats, lang, bgm, film = asyncio.run(timeline(a.url))
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
        # the bed as the engine plays it: each track under its own beats, at the length of its earlier beats plus the
        # clock, looping, silent where MUSIC_OFF is true; ponytail: crossfades (0.8 s) and MUSIC_UP_IN_PRE lead-ins not modelled
        BR = 44100   # the bed in stereo at the file's rate, so its loudness reads as the track's own and the video's
        bed, lens, end_of = np.zeros((int((L + 1) * BR), 2), np.float32), [], {b[0]: b[1] for b in beats}
        for src, g, tb in tracks:
            x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "2", "-ar", str(BR), "-f", "f32le", "-"],
                                             capture_output=True, check=True).stdout, np.float32).reshape(-1, 2)
            lens.append(len(x) / BR); t0 = 0.0
            for bid, end, _, _, off, *_ in beats:
                if bid in tb:
                    pos, n = sum(end_of.get(b, 0) for b in tb[:tb.index(bid)]), int(end * BR)
                    seg = x[(int(pos * BR) + np.arange(n)) % len(x)] * g * DUCK
                    mask = np.repeat(np.array(off, bool), BR // OFF_HZ)[:n]
                    seg[:len(mask)][mask] = 0
                    i = int(t0 * BR); bed[i:i + n] += seg[:len(bed) - i]
                t0 += end
        with tempfile.TemporaryDirectory() as d:
            wav = pathlib.Path(d) / "bed.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(BR), "-ac", "2", "-i", "-", str(wav)], input=bed.tobytes(), check=True)
            M = momentary(wav)
        what = "; ".join(f"{src.rsplit('/', 1)[-1]} ({ln:.1f} s{', looped' if ln < sum(end_of[b] for b in tb if b in end_of) else ''}) "
                         f"at gain {g} under {len(tb)} beats" for (src, g, tb), ln in zip(tracks, lens)) + \
               f", ducked to {DUCK:.0%}" + (", silent in MUSIC_OFF moments" if any(any(b[4]) for b in beats) else "")
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


def selftest():
    """A 30 s recording: tone, two rests (0.5 s at 16 s, 0.4 s at 20 s), a last note ending at 28 s, then silence. Cut to
    a 14 s film with --rests: both rests found and taken out, the in-point earlier by them and the crossfades, the last
    note still at 14 s of the cut, the file levelled; without --rests the in-point is plain end minus length."""
    with tempfile.TemporaryDirectory() as d:
        src, out = pathlib.Path(d) / "rec.wav", pathlib.Path(d) / "cut.mp3"
        tone = "0.3*sin(2*PI*330*t)*(1-between(t,16,16.5))*(1-between(t,20,20.4))*lt(t,28)"
        subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"aevalsrc='{tone}':d=30:s=44100", str(src)], check=True)
        assert abs(last_note(src) - 28) < .05, last_note(src)
        a = argparse.Namespace(src=src, out=out, url=None, length=14.0, video=False, end=None, shift=0.0, rests=-40.0, af="", even=False, lufs=-16.0, peak=-1.5, lift=[])
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
    c.add_argument("--rests", type=float, nargs="?", const=-40.0, metavar="DB", help="splice out rests under DB (default -40) for 0.25 s or more")
    c.add_argument("--af", default="", help="an ffmpeg filter on the cut, e.g. an EQ dip or a gentler dynaudnorm")
    c.add_argument("--even", action="store_true", help="dynaudnorm and a gentle compressor")
    c.add_argument("--lift", action="append", default=[], metavar="T[:DB]", help="raise the cut around T s by DB (default 6) dB; repeatable")
    c.add_argument("--lufs", type=float, default=-16.0, help="integrated loudness of the file (default -16)")
    c.add_argument("--peak", type=float, default=-1.5, help="true-peak ceiling in dBTP (default -1.5)")
    g = sub.add_parser("gaps", help="the bed's loudness in the voice-free gaps")
    g.add_argument("chapter", nargs="?", help="chNN, with --url the book")
    g.add_argument("--url", required=True, help="the book, served (http://localhost:8765/<book>/), or the chapter's URL")
    g.add_argument("--mp4", help="measure this exported mix instead of the page's track")
    g.add_argument("--bed", help="a music file to measure instead of the page's first music() track")
    g.add_argument("--gain", type=float, help="its music() gain (default: the page's, else 0.4)")
    a = ap.parse_args()
    if a.selftest: return selftest()
    if a.cmd is None: ap.error("cut or gaps (or --selftest)")
    if a.url: a.url = chapter_url(a.url, a.chapter)
    if a.cmd == "cut" and a.url is None and a.length is None: ap.error("cut needs --url or --length")
    cut(a) if a.cmd == "cut" else gaps(a)


if __name__ == "__main__":
    main()
