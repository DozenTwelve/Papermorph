#!/usr/bin/env python3
"""Even out the levels of clips (voices, effects): bring each to one loudness and keep its peaks under a limiter.

    python3 level.py site/<book>/ch01/audio/en/*.mp3                  # every clip to -18 LUFS, in place
    python3 level.py site/<book>/ch01/audio/en/o1.mp3 o2.mp3 --gain 3 # these clips 3 dB louder (not idempotent)
    python3 level.py CLIPS --lufs -16 --peak -1.5 --out OUT_DIR       # write the results to OUT_DIR instead

Needs ffmpeg. Each clip is measured (EBU R128 integrated loudness and true peak), raised or lowered to --lufs (default
-18, a speaking voice for headphones and laptop speakers), and run through a lookahead limiter with its delay
compensated, so the clip keeps its length and every word stays where timings.js says; the encoded result is measured
again and redone from the original (up to six tries) until its true peak is at most --peak dBTP (default -1) and its
loudness within 0.3 LU, and the best try is kept. A clip already within 0.5 dB of the target with its peak at or under
--peak is left alone, and so is one no try brings nearer than it was ("left as is"), so a rerun never makes a clip
worse, the one after it changes nothing, and a rerun touches only the clips tts.py regenerated (join.py's scene*.mp3 included): put it in the episode's audio script after tts.py and before join.py
(which joins the levelled clips). A clip shorter than 0.4 s (a tick, a clack, a pop) has no integrated loudness and is
left as it is with a note (--gain still applies to it). Effects from sfx.py are peak-normalised, not loudness-matched;
level them with their own --lufs if a set of them sounds uneven. Prints, per clip, the loudness and peak before and
after (a clip that is not an .mp3 is named and left as is), and a WARNING where the peak stays over --peak or the loudness more than 0.5 LU off (the limiter holds a clip
with sharp peaks back; a second run often gets nearer). --selftest checks all this on synthetic clips.
"""
import argparse, json, math, os, re, subprocess, sys, tempfile
from pathlib import Path
from tts import duration


def measure(f):
    """Integrated loudness (LUFS), true peak (dBTP), duration (s) and bit rate of a clip."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(f), "-vn", "-af", "loudnorm=print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr)
    if r.returncode or not m:
        sys.exit(f"{f}: ffmpeg could not measure its loudness ({r.stderr.strip().splitlines()[-1] if r.stderr.strip() else 'no output'})")
    m = json.loads(m.group(0))
    rate = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=bit_rate", "-of", "csv=p=0", str(f)],
                          capture_output=True, text=True).stdout.strip()
    return float(m["input_i"]), float(m["input_tp"]), duration(f), int(rate) if rate.isdigit() else 64000


def limiter(gain, lim):
    """The gain and the lookahead limiter (its delay compensated, so no word moves) every levelling uses."""
    return f"volume={gain:.2f}dB,alimiter=limit={10 ** (lim / 20):.4f}:level=0:latency=1"


def level_to(render, lufs, peak, gain):
    """The one levelling loop (this script, export.py's mix and music.py cut): render(gain dB, limiter ceiling dBFS)
    encodes the result from the original and returns its measure (LUFS, dBTP, ...). The limiter starts 0.3 dB under
    `peak` (encoding overshoots it); while the peak is over it goes lower, and while the loudness is more than 0.3 LU off
    `lufs` (None: the gain stays as given) the gain takes up what the limiter took. Up to six tries; the best one is
    kept (its peak under `peak` first, then nearest the target), never simply the last, which can be the worst when
    the limiter and the gain chase each other (a low-rate MP3's peak jumps by a dB or more between ceilings 0.4 dB
    apart, so no rule walks straight to the target). Returns the kept try's measure plus its gain and ceiling."""
    lim, tries = peak - .3, []
    for _ in range(6):
        m = render(gain, lim)
        off = 0 if lufs is None else lufs - m[0]
        tries.append(((m[1] > peak, abs(off)), m, gain, lim))
        if m[1] <= peak and abs(off) <= .3: break
        if m[1] > peak: lim -= m[1] - peak + .2
        if abs(off) > .3: gain += off   # the limiter took some of the loudness
    best = min(tries, key=lambda x: x[0])
    if best is not tries[-1]: best = (best[0], render(best[2], best[3]), best[2], best[3])   # the same encode again
    return (*best[1], best[2], best[3])


def one(f, dest, a):
    """Level clip f into dest (may be f itself); returns the line to print."""
    i, tp, dur, rate = measure(f)
    g = a.gain if a.gain is not None else a.lufs - i
    head = f"{f.name:16s} {i:6.1f} LUFS {tp:5.1f} dBTP"
    skip = ("too short to measure loudness, left as is" if not math.isfinite(g) else
            "already level" if a.gain is None and abs(g) < .6 and tp <= a.peak + .05 else None)
    if skip:   # an unmeasurable clip gets no gain; a level one is not encoded again
        if dest != f: dest.write_bytes(f.read_bytes())
        return f"{head}  {skip}"
    tmp = dest.with_name(f".{dest.stem}.level.tmp")   # beside dest, then replaced in one step
    def render(gain, lim):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-af", limiter(gain, lim),
                        "-b:a", f"{max(32, round(rate / 1000))}k", "-f", "mp3", str(tmp)], check=True)
        return measure(tmp)
    try:
        i2, tp2, dur2, _, g, _ = level_to(render, None if a.gain is not None else a.lufs, a.peak, g)
        # a clip the tries bring no nearer than it was (a rerun on a clip already as near as its limiter allows) stays
        # as it is: a rerun never makes a clip worse, and the one after it changes nothing
        if a.gain is None and (tp2 > a.peak, abs(a.lufs - i2)) >= (tp > a.peak, abs(a.lufs - i)):
            if dest != f: dest.write_bytes(f.read_bytes())
            return f"{head}  left as is: levelling came no nearer ({i2:.1f} LUFS, {tp2:.1f} dBTP at best)"
        os.replace(tmp, dest)
    finally:
        tmp.unlink(missing_ok=True)
    warn = f"  WARNING length {dur:.3f} -> {dur2:.3f} s" if abs(dur2 - dur) > .03 else ""
    warn += f"  WARNING peak {tp2:.1f} over {a.peak}" if tp2 > a.peak else ""
    warn += f"  WARNING {a.lufs - i2:+.1f} LU from {a.lufs:g}: the limiter holds it back" if a.gain is None and abs(a.lufs - i2) > .5 else ""
    return f"{head} -> {i2:6.1f} LUFS {tp2:5.1f} dBTP ({g:+.1f} dB){warn}"


def selftest():
    """A 0.1 s tick, a 3 s clip whose clicks the limiter must hold, and a quiet one: the tick untouched, the others at target and under the ceiling with
    their lengths kept, and a rerun leaves every file as it was."""
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        for name, src in (("tick", "sine=f=2000:d=0.1"), ("spiky", "aevalsrc='0.1*sin(2*PI*220*t)+0.95*lt(mod(t,0.5),0.003)':d=3"),
                          ("quiet", "sine=f=220:d=2.5,volume=-30dB")):
            subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", src, "-ac", "1", "-ar", "44100", "-b:a", "64k",
                            str(d / f"{name}.mp3")], check=True)
        clips = sorted(d.glob("*.mp3"))
        before = {f: (f.read_bytes(), measure(f)) for f in clips}
        a = argparse.Namespace(lufs=-18, gain=None, peak=-1)
        print("\n".join(one(f, f, a) for f in clips))
        assert (d / "tick.mp3").read_bytes() == before[d / "tick.mp3"][0], "a short clip is left alone"
        after = {f: f.read_bytes() for f in clips}
        for f in clips:
            i, tp, dur, _ = measure(f)
            assert abs(dur - before[f][1][2]) < .03, (f.name, "length")
            if f.stem != "tick": assert abs(i + 18) < .6 and tp <= -1, (f.name, i, tp)
        print("\n".join(one(f, f, a) for f in clips))
        assert all(f.read_bytes() == after[f] for f in clips), "a rerun changes nothing"
        assert not list(d.glob(".*")), "no temp files left"
    # tries whose peaks jump about (a low-rate MP3): the best one is kept and encoded again, not the last
    got, calls = iter([(-14.2, -1.0), (-14.5, -1.7), (-13.0, -0.4), (-15.5, -0.9), (-16.0, -0.2), (-13.5, -0.6)]), {}
    render = lambda g, lim: calls[(g, lim)] if (g, lim) in calls else calls.setdefault((g, lim), next(got))
    i, tp, g, lim = level_to(render, -14, -1.5, .5)
    assert (i, tp) == (-14.5, -1.7) and calls[(g, lim)] == (i, tp), (i, tp, calls)
    print("level.py selftest passed")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clips", nargs="*", type=Path)
    ap.add_argument("--lufs", type=float, default=-18, help="target integrated loudness (default -18)")
    ap.add_argument("--gain", type=float, help="add this many dB instead of matching --lufs")
    ap.add_argument("--peak", type=float, default=-1, help="ceiling for the encoded true peak in dBTP (default -1)")
    ap.add_argument("--out", type=Path, help="write here instead of replacing the clips")
    ap.add_argument("--selftest", action="store_true", help="check the levelling on synthetic clips")
    a = ap.parse_args()
    if a.selftest: return selftest()
    if not a.clips: ap.error("give the clips to level")
    if a.out:
        a.out.mkdir(parents=True, exist_ok=True)
    for f in a.clips:
        if f.suffix.lower() != ".mp3":   # the result is encoded as MP3, which a .wav name would hide
            print(f"{f.name:16s} not an .mp3, left as is: level.py writes MP3; convert it to one first", flush=True); continue
        print(one(f, (a.out / f.name) if a.out else f, a), flush=True)


if __name__ == "__main__":
    main()
