#!/usr/bin/env python3
"""Even out the levels of clips (voices, effects): bring each to one loudness and keep its peaks under a limiter.

    python3 level.py site/<book>/ch01/audio/en/*.mp3                  # every clip to -18 LUFS, in place
    python3 level.py site/<book>/ch01/audio/en/o1.mp3 o2.mp3 --gain 3 # these clips 3 dB louder (not idempotent)
    python3 level.py CLIPS --lufs -16 --peak -1.5 --out OUT_DIR       # write the results to OUT_DIR instead

Needs ffmpeg. Each clip is measured (EBU R128 integrated loudness and true peak), raised or lowered to --lufs (default
-18, a speaking voice for headphones and laptop speakers), and run through a lookahead limiter with its delay
compensated, so the clip keeps its length and every word stays where timings.js says; the encoded result is measured
again and redone from the original until its true peak is at most --peak dBTP (default -1). A clip already within
0.5 dB of the target with its peak at or under --peak is left alone, so a rerun touches only the clips tts.py
regenerated (join.py's scene*.mp3 included): put it in the episode's audio script after tts.py and before join.py
(which joins the levelled clips). A clip shorter than 0.4 s (a tick, a clack, a pop) has no integrated loudness and is
left as it is with a note (--gain still applies to it). Effects from sfx.py are peak-normalised, not loudness-matched;
level them with their own --lufs if a set of them sounds uneven. Prints, per clip, the loudness and peak before and
after. --selftest checks all this on synthetic clips.
"""
import argparse, json, math, os, re, subprocess, sys, tempfile
from pathlib import Path


def measure(f):
    """Integrated loudness (LUFS), true peak (dBTP), duration (s) and bit rate of a clip."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(f), "-af", "loudnorm=print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True, check=True)
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr).group(0))
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,bit_rate", "-of", "json", str(f)],
                       capture_output=True, text=True, check=True)
    fmt = json.loads(p.stdout)["format"]
    return float(m["input_i"]), float(m["input_tp"]), float(fmt["duration"]), int(fmt.get("bit_rate") or 64000)


def level(f, out, gain, limit, rate):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-af",
                    f"volume={gain:.2f}dB,alimiter=limit={10 ** (limit / 20):.4f}:level=0:latency=1",
                    "-b:a", f"{max(32, round(rate / 1000))}k", "-f", "mp3", str(out)], check=True)
    return measure(out)


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
    try:
        lim = a.peak - .3   # MP3 encoding overshoots the limiter; measure and redo from the original until under --peak
        for _ in range(6):
            i2, tp2, dur2, _ = level(f, tmp, g, lim, rate)
            off = a.lufs - i2 if a.gain is None else 0
            if tp2 <= a.peak and abs(off) <= .3: break
            if tp2 > a.peak: lim -= tp2 - a.peak + .2
            if abs(off) > .3: g += off   # the limiter took some of the loudness
        os.replace(tmp, dest)
    finally:
        tmp.unlink(missing_ok=True)
    warn = f"  WARNING length {dur:.3f} -> {dur2:.3f} s" if abs(dur2 - dur) > .03 else ""
    warn += f"  WARNING peak {tp2:.1f} over {a.peak}" if tp2 > a.peak else ""
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
        print(one(f, (a.out / f.name) if a.out else f, a), flush=True)


if __name__ == "__main__":
    main()
