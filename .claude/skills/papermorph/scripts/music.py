#!/usr/bin/env python3
"""A film's one music track: cut a recording to the film's length so its last note lands on the end, and check the bed
in the voice's pauses.

    uv run --with playwright python music.py cut SRC OUT --url http://localhost:8765/<book>/chNN/ [--rests] [--even] [--lufs -16]
    uv run --with playwright --with numpy python music.py gaps --url http://localhost:8765/<book>/chNN/ [--mp4 OUT/chNN.mp4]

cut: the film's length is the sum of every beat's length on screen (the page's P.end, not its clip's dur), read in a
headless page (or given with --length). The recording's last note (where its trailing silence starts, under -50 dB;
--end gives it by hand) lands that long after the in-point, and the track runs 2 s past the film so its ring is not cut;
--shift -1 starts it a second earlier, so the last note rings a second past the last frame. A short fade in, then:
  --rests [DB]   splice out the recording's rests (under -40 dB, or DB, for 0.25 s or more; a classical recording has
                 them, and one falling into a voice pause plays as a staged stop) with 0.15 s crossfades; the in-point
                 moves earlier by what was taken out, so the last note still lands on the end
  --af FILTER    an ffmpeg filter on the cut, e.g. a dip in the voice's band (equalizer=f=1800:t=q:w=1.2:g=-4)
  --even         even it out: dynaudnorm, then a gentle compressor, so quiet phrase ends do not leave holes
  --lufs L       level the file to L LUFS integrated (default -16) with its true peak under --peak (default -1.5),
                 measured and redone as level.py does; the page's music() gain is relative to this, so say both
Writes OUT as MP3 and prints the in-point, the rests it took out and the level.

gaps: the bed as it sounds in the voice-free gaps (0.4 s or more where the beats' clips, placed at each beat's start plus
its `pre`, are quiet). Without --mp4 it measures the page's own track (its first music() file, at its gain, or --bed
and --gain) under the engine's 30 % ducking; with --mp4, the exported mix. Prints each gap's quietest momentary
loudness (400 ms) against the median gap, marks a hole (8 LU or more under the median), and the median itself.

--selftest checks the splice and the in-point on a synthetic recording. Needs ffmpeg.
"""
import argparse, asyncio, json, pathlib, re, statistics, subprocess, sys, tempfile
import level as lv
from browsers import answers, exe

XF, TAIL, DUCK = .15, 2.0, .3
EVEN = "dynaudnorm=f=400:g=21:p=0.6:m=8,acompressor=threshold=-24dB:ratio=2.5:attack=40:release=400:makeup=2"


async def timeline(url):
    """[(beat id, P.end, pre)] for every beat, the chapter's language and its first music() file and gain."""
    from playwright.async_api import async_playwright
    answers(url)
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe()); pg = await b.new_page()
        await pg.goto(f"{url}?beat=0&t=0")
        n, lang, bgm = await pg.evaluate("[BEATS.length, CHAPTER.language || 'en', typeof BGM === 'undefined' || !BGM.length ? null : [BGM[0].a.src, BGM[0].gain]]")
        beats = []
        for i in range(n):
            await pg.goto(f"{url}?beat={i}&t=0"); await pg.wait_for_timeout(300)
            beats.append(tuple(await pg.evaluate("[BEATS[P.i].id, P.end, BEATS[P.i].pre || 0]")))
        await b.close()
    return beats, lang, bgm


def silences(src, db, d, ss=0.0, t=None):
    """(start, end) of each stretch under db dB for d s or more, in the recording's own seconds; an open end is None."""
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{ss:.3f}", "-i", str(src)] + (["-t", f"{t:.3f}"] if t else [])
    log = subprocess.run(cmd + ["-af", f"silencedetect=n={db}dB:d={d}", "-f", "null", "-"], capture_output=True, text=True).stderr
    out = []
    for m in re.finditer(r"silence_start: (-?[\d.]+)|silence_end: ([\d.]+)", log):
        if m[1]: out.append([float(m[1]) + ss, None])
        elif out: out[-1][1] = float(m[2]) + ss
    return [tuple(x) for x in out]


def last_note(src):
    s = silences(src, -50, .5)
    dur = lv.measure(src)[2]
    return s[-1][0] if s and (s[-1][1] is None or s[-1][1] > dur - .1) else dur


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
        beats, _, _ = asyncio.run(timeline(a.url))
        a.length = sum(e for _, e, _ in beats)
    end = a.end if a.end is not None else last_note(a.src)
    at = a.length - a.shift   # where the last note falls in the cut
    found = silences(a.src, a.rests, .25, max(0, end - at - 120), at + 120) if a.rests is not None else []   # ponytail: rests up to 2 min before the in-point, enough for a few short ones
    keep, used = spans(end, at, found)
    if keep[0][0] < 0: sys.exit(f"the recording is {end:.1f} s to its last note, shorter than the film's {at:.1f} s")
    f = [f"[0]atrim={x:.3f}" + (f":{y:.3f}" if y is not None else "") + f",asetpts=PTS-STARTPTS[s{i}]" for i, (x, y) in enumerate(keep)]
    last = "s0"
    for i in range(1, len(keep)):
        f.append(f"[{last}][s{i}]acrossfade=d={XF}:c1=tri:c2=tri[x{i}]"); last = f"x{i}"
    chain = ",".join(filter(None, [f"atrim=0:{a.length + TAIL:.3f}", a.af, EVEN if a.even else "", "afade=t=in:d=0.4"]))
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    def render(gain):   # one encode from the recording: each MP3 generation loses some loudness, so none is levelled twice
        lim = f",volume={gain:.2f}dB,alimiter=limit={10 ** ((a.peak - .3) / 20):.4f}:level=0:latency=1" if a.lufs is not None else ""
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(a.src), "-filter_complex", ";".join(f + [f"[{last}]{chain}{lim}[o]"]),
                        "-map", "[o]", "-ar", "44100", "-ac", "2", "-b:a", "160k", str(out)], check=True)
        return lv.measure(out)[:2]
    g = 0.0; i, tp = render(g); i0 = i
    for _ in range(4 if a.lufs is not None else 0):   # measured and redone until within 0.3 LU, as level.py does
        if abs(a.lufs - i) <= .3 and tp <= a.peak: break
        g += a.lufs - i if abs(a.lufs - i) > .3 else 0
        if tp > a.peak: g -= .2
        i, tp = render(g)
    print(f"film {a.length:.2f} s; recording from {keep[0][0]:.2f} s, its last note ({end:.2f} s) at {at:.2f} s of the cut")
    if a.rests is not None:
        print(f"rests taken out: {', '.join(f'{x:.2f}-{y:.2f}' for x, y in used) or 'none'}")
    print(f"{out}: {i:.1f} LUFS, {tp:.1f} dBTP" + (f" ({i0:.1f} before levelling, {g:+.1f} dB)" if a.lufs is not None else ""))
    return keep, used


def momentary(src, gain=1.0):
    """[(t, momentary loudness of the 400 ms up to t)] of a file's sound."""
    log = subprocess.run(["ffmpeg", "-nostats", "-i", str(src), "-vn", "-af", f"volume={gain},ebur128=metadata=1,ametadata=print:key=lavfi.r128.M:file=-",
                          "-f", "null", "-"], capture_output=True, text=True).stdout
    return list(zip(map(float, re.findall(r"pts_time:([\d.]+)", log)), map(float, re.findall(r"r128\.M=(-?[\d.inf]+)", log))))


def gaps(a):
    import numpy as np
    beats, lang, bgm = asyncio.run(timeline(a.url))
    L, SR, hop, w = sum(e for _, e, _ in beats), 16000, 800, 6400   # 400 ms windows every 50 ms
    voice, t0 = np.zeros(int((L + 1) * SR), np.float32), 0.0
    for bid, end, pre in beats:
        x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f"{a.url}audio/{lang}/{bid}.mp3", "-ac", "1", "-ar", str(SR),
                                          "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
        i = int((t0 + pre) * SR); x = x[:max(0, min(len(x), int((t0 + end) * SR) - i))]; voice[i:i + len(x)] += x; t0 += end
    quiet = [20 * np.log10(np.sqrt(np.mean(voice[i:i + w] ** 2)) + 1e-9) < -45 for i in range(0, len(voice) - w, hop)]
    runs, k = [], 0   # voice-free stretches: [first window's start, last window's end]
    while k < len(quiet):
        j = k
        while j < len(quiet) and quiet[j]: j += 1
        if j - k >= 8 and (j - 1) * .05 + .4 < L - .5: runs.append((k * .05, (j - 1) * .05 + .4))   # after the last word, the music's own ending
        k = j + 1
    if a.mp4:
        M, what = momentary(a.mp4), f"the mix in {a.mp4}"
    else:
        src, g = a.bed or (bgm and bgm[0]), a.gain if a.gain is not None else bgm[1] if bgm else .4
        if not src: sys.exit("the page has no music(): give --bed FILE")
        M, what = momentary(src, g * DUCK), f"{src.rsplit('/', 1)[-1]} at gain {g} under the {DUCK:.0%} duck"   # ponytail: ducked all through, MUSIC_UP_IN_PRE lead-ins not modelled
    rows = []
    for g0, g1 in runs:
        sel = [m for t, m in M if g0 + .4 <= t <= g1]   # windows wholly inside the gap
        if sel: rows.append((g0, g1 - g0, min(sel)))
    if not rows: sys.exit("no voice-free gaps of 0.4 s or more")
    med = statistics.median(r[2] for r in rows)
    print(f"film {L:.2f} s, {len(rows)} voice-free gaps; {what}")
    for t, d, m in rows:
        print(f"gap at {t:6.2f} s for {d:4.2f} s: {m:6.1f} LUFS momentary min ({m - med:+5.1f}){'  <- hole' if m <= med - 8 else ''}")
    print(f"median gap {med:.1f} LUFS; {sum(m <= med - 8 for _, _, m in rows)} holes")
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
        a = argparse.Namespace(src=src, out=out, url=None, length=14.0, end=None, shift=0.0, rests=-40.0, af="", even=False, lufs=-16.0, peak=-1.5)
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
    print("music.py selftest passed")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--selftest", action="store_true", help="check the splice and the in-point on a synthetic recording")
    sub = ap.add_subparsers(dest="cmd")
    c = sub.add_parser("cut", help="cut a recording to the film's length, ending on its last note")
    c.add_argument("src", type=pathlib.Path); c.add_argument("out")
    c.add_argument("--url", help="the chapter, served: http://localhost:8765/<book>/chNN/")
    c.add_argument("--length", type=float, help="the film's length in s, instead of reading the page")
    c.add_argument("--end", type=float, help="the recording's last note in s (default: where its trailing silence starts)")
    c.add_argument("--shift", type=float, default=0.0, help="move the in-point by this many s (-1: the last note a second past the end)")
    c.add_argument("--rests", type=float, nargs="?", const=-40.0, metavar="DB", help="splice out rests under DB (default -40) for 0.25 s or more")
    c.add_argument("--af", default="", help="an ffmpeg filter on the cut, e.g. an EQ dip or a gentler dynaudnorm")
    c.add_argument("--even", action="store_true", help="dynaudnorm and a gentle compressor")
    c.add_argument("--lufs", type=float, default=-16.0, help="integrated loudness of the file (default -16)")
    c.add_argument("--peak", type=float, default=-1.5, help="true-peak ceiling in dBTP (default -1.5)")
    g = sub.add_parser("gaps", help="the bed's loudness in the voice-free gaps")
    g.add_argument("--url", required=True, help="the chapter, served: http://localhost:8765/<book>/chNN/")
    g.add_argument("--mp4", help="measure this exported mix instead of the page's track")
    g.add_argument("--bed", help="a music file to measure instead of the page's first music() track")
    g.add_argument("--gain", type=float, help="its music() gain (default: the page's, else 0.4)")
    a = ap.parse_args()
    if a.selftest: return selftest()
    if a.cmd is None: ap.error("cut or gaps (or --selftest)")
    if a.url: a.url = a.url.rstrip("/") + "/"
    if a.cmd == "cut" and a.url is None and a.length is None: ap.error("cut needs --url or --length")
    cut(a) if a.cmd == "cut" else gaps(a)


if __name__ == "__main__":
    main()
