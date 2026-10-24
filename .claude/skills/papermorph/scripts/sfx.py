#!/usr/bin/env python3
"""Sound effects for a film, synthesized with numpy (no samples): named recipes written as mono 44.1 kHz MP3s.

    uv run --with numpy python sfx.py site/<book>/ch01/audio/sfx knock door rain   # these effects, OUT_DIR/<name>.mp3
    uv run --with numpy python sfx.py site/<book>/ch01/audio/sfx all               # every recipe
    uv run --with numpy python sfx.py --list                                       # names with a one-line description
    uv run --with numpy python sfx.py OUT_DIR splat --recipes books/<book>/sfx_recipes.py   # with the book's own recipes
    uv run --with numpy python sfx.py --selftest                                   # checks the --recipes loading

Needs ffmpeg. Every file is faded (5 ms) and peak-normalised to -3 dBFS; each recipe is seeded by its name, so a name
always renders the same sound. Play them from a chapter with sfx(beat, seconds, 'name', volume) (the engine's sfx(), in
any film: a picture book or a documentary), which plays them at half volume under the voices. Even out voices and
effects afterwards with level.py.

A book's own recipes: --recipes FILE.py (repeatable) imports FILE; every top-level function in it that takes no
required argument and whose name does not start with _ becomes a recipe (underscores in the name become hyphens; the
docstring's first line is its --list line; a book recipe replaces a built-in of the same name). Build them from this
module (`from sfx import SR, t_of, unit, place, smooth, lp1, hp1, bpf, pluck, pink, drops, noise`; draw randomness
from `noise(n)` or `sfx.rng`, which is seeded per recipe) and keep them in the book's folder, not in a copy of this script.

Add a recipe here: write a function that returns a float array at SR, built from the small toolkit below (t_of, unit,
place, smooth, lp1/hp1/bpf filters, pluck, pink, drops), and list it in RECIPES. Keep them soft and natural: a hard
high hiss reads as "scary rain" and a bare sine as a phone, so layer a low thump under a click, shape every sound with
a decay, and listen before using one. Recipes: sting growl gulp door tick bell whoosh fly violin crickets chair
(character and house sounds), knock chop bang bonk thud crash (wood, axe, glass, a wardrobe door), clack chalk page
(a game piece set down, a chalk line, a page turned), plop sniff chomp burp lick slurp hmph bark (eating, drinking, a
nose, a dog), laugh applause (a person laughing, a small audience clapping), splash pop boing (water, a cork, a
spring), chime beep card coin (a convenience store), rain and rain-short (gentle rain), creak latch sash shutter flap
clang scrape (doors, windows, a shutter, cardboard, a steel bowl), inhale inhale-short (a breath in), patter patter1
step1 (light steps, one step, a grown-up's shoe), honk gulls gull1 (a penguin or goose, seagulls, one gull), crack
clop (a whip, hooves), bark-big woof-mf yip (a big dog, a smothered bark, a puppy), and beds: wind (8 s), surf (30 s),
room (3 s room tone that tiles every 2.6 s), birds (10 s park with distant birds; 0.4 s fades, tiles every 9.6 s).
"""
import math
import os
import subprocess
import sys
import tempfile
import wave
import zlib

import numpy as np

SR = 44100
rng = np.random.default_rng(1019)   # replaced per recipe in main(), seeded by the recipe's name


def t_of(dur):
    return np.arange(int(round(dur * SR))) / SR


def unit(x):
    return x / np.max(np.abs(x))


def place(y, x, t0):
    i = int(t0 * SR)
    n = min(len(x), len(y) - i)
    y[i:i + n] += x[:n]


def lp1(x, fc):
    """One-pole low-pass."""
    a = math.exp(-2 * math.pi * fc / SR)
    out, s = [], 0.0
    for v in x.tolist():
        s = a * s + (1 - a) * v
        out.append(s)
    return np.array(out)


def hp1(x, fc):
    return x - lp1(x, fc)


def bpf(x, fc, q=5.0):
    """RBJ constant-peak band-pass; fc may be a per-sample array."""
    fcs = np.broadcast_to(np.asarray(fc, float), x.shape).tolist()
    out, x1, x2, y1, y2 = [], 0.0, 0.0, 0.0, 0.0
    for v, f in zip(x.tolist(), fcs):
        w = 2 * math.pi * f / SR
        al, c = math.sin(w) / (2 * q), math.cos(w)
        y = (al * (v - x2) + 2 * c * y1 - (1 - al) * y2) / (1 + al)
        out.append(y)
        x2, x1, y2, y1 = x1, v, y1, y
    return np.array(out)


def pluck(f, dur, decay=0.996):
    """Karplus-Strong string with a two-point average (lowpass) in the loop."""
    n = int(round(SR / f - 0.5))
    buf = rng.uniform(-1, 1, n).tolist()
    out = []
    for i in range(int(dur * SR)):
        j = i % n
        s = buf[j]
        out.append(s)
        buf[j] = decay * 0.5 * (s + buf[(j + 1) % n])
    return np.array(out)


def pink(n):
    """1/f noise: white noise shaped in the frequency domain."""
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1
    return np.fft.irfft(np.fft.rfft(rng.standard_normal(n)) / np.sqrt(f), n)


def drops(n, rate, fc, q, decay, lo, hi):
    """Random short band-passed ticks (rain on stone or fabric): `rate` per second, pitch near fc."""
    y = np.zeros(n)
    for _ in range(rng.poisson(rate * n / SR)):
        m = int(decay * 6 * SR)
        s = np.arange(m) / SR
        d = bpf(rng.standard_normal(m), fc * rng.uniform(.8, 1.25), q) * np.exp(-s / decay)
        place(y, d * rng.uniform(lo, hi), rng.uniform(0, n / SR - decay * 6))
    return y


def noise(n):
    return rng.standard_normal(n)


def smooth(x, n=40):
    """Moving average over n samples: a soft, cheap low-pass that keeps the length."""
    return np.convolve(x, np.ones(n) / n, mode="same")


def sting():
    """A four-note plucked flourish that settles into a chord (a title or a joke landing)."""
    dur, y = 2.5, np.zeros(int(2.5 * SR))
    for f, t0 in [(146.83, 0.00), (196.00, 0.18), (246.94, 0.36), (293.66, 0.54)]:
        place(y, pluck(f, 0.9), t0)
    for k, f in enumerate([98.00, 123.47, 146.83, 196.00, 246.94, 392.00]):
        place(y, pluck(f, dur - 0.80), 0.80 + k * 0.015)
    return y


def growl():
    """A low, wavering growl."""
    t = t_of(1.4)
    brown = hp1(np.cumsum(rng.standard_normal(len(t))), 20)
    y = bpf(brown, 110 + 30 * np.sin(2 * np.pi * 1.1 * t), q=6)
    rate = 6 + 0.8 * np.sin(2 * np.pi * 0.4 * t)  # tremolo 5-7 Hz
    trem = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(rate) / SR))
    swells = np.interp(t, np.arange(0, 1.6, 0.3), rng.uniform(0.5, 1, 6))
    return unit(y) * trem * swells


def gulp():
    """Three quick glugs."""
    y = np.zeros(int(1.0 * SR))
    for t0 in (0.0, 0.3, 0.6):
        t = t_of(0.2)
        tt = np.minimum(t, 0.12)
        phase = 2 * np.pi * (320 * tt - 100 * tt ** 2 / 0.12 + 120 * np.maximum(t - 0.12, 0))
        glug = np.sin(phase) * np.exp(-t / 0.045)
        click = rng.standard_normal(len(t)) * np.exp(-t / 0.002) * 0.15
        place(y, glug + click, t0)
    return y


def door():
    """A door shut hard: a low thump and a dull bang."""
    t = t_of(0.6)
    bang = lp1(lp1(rng.standard_normal(len(t)), 400), 400) * np.exp(-t / 0.05)
    thump = np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.08)
    return unit(bang) * 0.7 + unit(thump) * 0.9


def tick():
    """A small dry click."""
    t = t_of(0.1)
    click = np.zeros(len(t))
    n = int(0.002 * SR)
    click[:n] = hp1(rng.standard_normal(n), 2000) * np.exp(-t[:n] / 0.0008)
    m = int(0.010 * SR)
    sine = np.zeros(len(t))
    sine[:m] = np.sin(2 * np.pi * 3000 * t[:m]) * np.exp(-t[:m] / 0.003)
    return unit(click) * 0.6 + unit(sine) * 0.8


def bell():
    """A school bell: a ringing hammer, three seconds."""
    dur, t = 3.0, t_of(3.0)
    y = np.zeros(len(t))
    partials = [(1000, 1.0, 0.12), (2410, 0.5, 0.08), (3920, 0.25, 0.05)]
    for ts in np.arange(0, dur, 1 / 22):  # hammer strikes at ~22 Hz
        i0 = int(ts * SR)
        seg = np.arange(min(int(0.5 * SR), len(t) - i0)) / SR
        for f, a, tau in partials:
            y[i0:i0 + len(seg)] += a * np.exp(-seg / tau) * np.sin(2 * np.pi * f * seg)
    env = np.clip((dur - t) / 0.3, 0, 1)  # full 2.7 s, then 0.3 s release
    return unit(y) * env


def whoosh():
    """A swift pass: filtered noise sweeping up."""
    dur = 0.45
    t = t_of(dur)
    y = bpf(rng.standard_normal(len(t)), 400 * (2500 / 400) ** (t / dur), q=2.5)
    return unit(y) * np.sin(np.pi * t / dur) ** 2


def fly():
    """A fly circling: a buzzing 220 Hz saw with vibrato."""
    dur = 3.0
    t = t_of(dur)
    f = 220 + 12 * np.sin(2 * np.pi * 8 * t)  # 8 Hz vibrato, +-12 Hz
    phase = 2 * np.pi * np.cumsum(f) / SR
    saw = np.zeros(len(t))
    for k in range(1, 69):  # band-limited sawtooth, harmonics below ~15 kHz
        saw += np.sin(k * phase) / k
    wander = lp1(rng.standard_normal(len(t)), 0.7)  # circling amplitude
    y = unit(saw) * (0.65 + 0.35 * unit(wander))
    y = hp1(hp1(y, 150), 150)
    return y * np.minimum(t / 0.3, 1) * np.minimum((dur - t) / 0.3, 1)


def violin():
    """A sad four-note violin phrase with a little echo."""
    dur, out = 3.5, np.zeros(int(3.5 * SR) + int(0.2 * SR))
    t0 = 0.0
    for f, d in [(440.0, 0.7), (392.0, 0.7), (349.23, 0.7), (329.63, 1.4)]:
        t = t_of(d)
        vib = np.where(t > 0.15, 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.minimum((t - 0.15) / 0.2, 1), 0)
        phase = 2 * np.pi * np.cumsum(f * (1 + vib)) / SR
        wave_ = sum(np.sin(k * phase) / k for k in range(1, 13))
        env = np.minimum(t / 0.08, 1) * np.minimum((d - t) / 0.05, 1)
        place(out, wave_ * env * 0.5, t0)
        t0 += d
    for _ in range(2):  # ~3 kHz low-pass, two one-poles
        out = lp1(out, 3000)
    echo = out.copy()
    for delay, gain in [(0.060, 10 ** (-10 / 20)), (0.110, 10 ** (-16 / 20))]:
        d = int(delay * SR)
        echo[d:] += gain * out[:-d]
    return echo[:int(dur * SR)]


def crickets():
    """Crickets in the evening."""
    dur, y = 3.0, np.zeros(int(3.0 * SR))
    pulse_len = int(0.012 * SR)
    s = np.arange(pulse_len) / SR
    pulse_env = np.sin(np.pi * s / 0.012) ** 2
    for f, off, gain in [(4500, 0.0, 1.0), (4800, 0.27, 0.6)]:
        for b0 in np.arange(off, dur, 0.6):
            amp = gain * rng.uniform(0.8, 1.0)
            for p in range(3):  # three pulses at 30 Hz
                place(y, amp * np.sin(2 * np.pi * f * s) * pulse_env, b0 + p / 30)
    return y


def chair():
    """A chair scraping the floor."""
    t = t_of(0.5)
    y = bpf(rng.standard_normal(len(t)), 700, q=6)
    jitter = np.repeat(rng.uniform(0.3, 1, int(np.ceil(0.5 / 0.01))), int(0.01 * SR))[:len(t)]
    return unit(y) * jitter


def knock():
    """Knuckles on a wooden door."""
    t = t_of(.18)
    return unit(bpf(noise(len(t)), 190, q=3) * np.exp(-t / .02)) * .8 + unit(np.sin(2 * np.pi * 95 * t) * np.exp(-t / .03)) * .7


def chop():
    """An axe into a log: a crack, the wood's ring, a low thump."""
    t = t_of(.32)
    crack = hp1(noise(len(t)), 2500) * np.exp(-t / .004)
    wood = bpf(noise(len(t)), 620, q=2.5) * np.exp(-t / .045)
    thump = np.sin(2 * np.pi * 120 * t) * np.exp(-t / .06)
    return unit(crack) * .5 + unit(wood) * .8 + unit(thump) * .7


def bang():
    """A door flung against the wall, then a rattle."""
    t = t_of(.6)
    y = unit(lp1(noise(len(t)), 500) * np.exp(-t / .07)) * .7 + unit(np.sin(2 * np.pi * 68 * t) * np.exp(-t / .1)) * .9
    for k, at in enumerate((.11, .17, .21)):
        place(y, unit(bpf(noise(int(.03 * SR)), 900, q=4)) * np.exp(-t_of(.03) / .006) * (.35 - .1 * k), at)
    return y


def bonk():
    """An umbrella on a head: a hollow pitch that drops."""
    t = t_of(.4)
    f = 560 * np.exp(-t / .25)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .12)
    return unit(tone) + unit(hp1(noise(len(t)), 1500) * np.exp(-t / .003)) * .4


def thud():
    """A soft fall onto a floor."""
    t = t_of(.4)
    return unit(lp1(lp1(noise(len(t)), 180), 180) * np.exp(-t / .08)) * .8 + unit(np.sin(2 * np.pi * 58 * t) * np.exp(-t / .12)) * .8


def crash():
    """A window pane: the hit, a hiss of glass, then shards tinkling down."""
    t = t_of(1.6)
    y = unit(hp1(noise(len(t)), 1800) * np.exp(-t / .07)) * .9
    y += unit(bpf(noise(len(t)), 4200, q=1.5) * np.exp(-t / .3)) * .35
    y += unit(lp1(noise(len(t)), 300) * np.exp(-t / .05)) * .5
    for _ in range(46):
        at = rng.uniform(0, 1.1) ** 1.6
        d = t_of(rng.uniform(.03, .12))
        ping = np.sin(2 * np.pi * rng.uniform(2600, 7500) * d) * np.exp(-d / (d[-1] / 3))
        place(y, ping * rng.uniform(.15, .45) * (1 - at / 1.3), at)
    return y


def plop():
    """A single bloop, like a drop in a bowl."""
    dur = 0.35
    t = t_of(dur)
    f = 400 + 500 * np.minimum(t / 0.04, 1)  # pitch rises 400 -> 900 Hz in 40 ms
    bloop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.06)
    n = int(0.002 * SR)
    tick = np.zeros(len(t))
    tick[:n] = hp1(rng.standard_normal(n), 2000) * np.exp(-t[:n] / 0.0008)
    return unit(bloop) + 0.12 * unit(tick)


def sniff():
    """Three short sniffs."""
    dur = 0.9
    y = np.zeros(int(dur * SR))
    n = int(0.10 * SR)
    s = np.arange(n) / SR
    env = np.minimum(s / 0.03, 1) * np.clip(1 - (s - 0.03) / 0.07, 0, 1)  # 30 ms rise, 70 ms fall
    for t0, fc, level in [(0.0, 2500, 1.0), (0.25, 2750, 0.8), (0.5, 2300, 0.9)]:
        noise = bpf(rng.standard_normal(n), fc, q=2)
        place(y, unit(noise) * env * level, t0)
    return y


def chomp():
    """A bite of something crunchy."""
    dur = 0.4
    t = t_of(dur)
    thump = np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.06)
    crackle = hp1(rng.standard_normal(len(t)), 1500)
    gate = np.zeros(len(t))
    for _ in range(rng.integers(6, 11)):  # 6-10 tiny bursts in the first 200 ms
        i0 = int(rng.uniform(0, 0.2) * SR)
        n = int(rng.uniform(0.005, 0.015) * SR)
        n = min(n, len(t) - i0)
        gate[i0:i0 + n] = np.sin(np.pi * np.arange(n) / n)
    return unit(thump) + 0.6 * unit(crackle * gate)


def burp():
    """A low, short burp."""
    dur = 0.8
    t = t_of(dur)
    f = 110 - 30 * t / dur  # 110 -> 80 Hz
    phase = 2 * np.pi * np.cumsum(f) / SR
    saw = sum(np.sin(k * phase) / k for k in range(1, 9))
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 30 * t + 0.8 * np.sin(2 * np.pi * 3.7 * t))  # irregular 30 Hz
    y = saw * am
    y = lp1(lp1(y, 900), 900)
    env = np.minimum(t / 0.04, 1) * np.clip((dur - t) / 0.6, 0, 1)  # 40 ms rise, slow 0.6 s fade
    return unit(y) * env


def lick():
    """A wet lick."""
    dur = 0.5
    t = t_of(dur)
    n = len(t)
    fc = 800 + 2200 * np.minimum(t / 0.3, 1)  # centre sweeps 800 -> 3000 Hz
    wet = bpf(rng.standard_normal(n), fc, q=2)
    wobble = 0.7 + 0.3 * np.sin(2 * np.pi * 60 * t)
    env = np.minimum(t / 0.05, 1) * np.clip((dur - t) / 0.2, 0, 1)
    y = unit(wet) * wobble * env
    m = int(0.002 * SR)
    s = np.arange(m) / SR
    click = hp1(rng.standard_normal(m), 2000) * np.exp(-s / 0.0008)
    place(y, unit(click) * 0.4, 0.46)
    return y


def bark():
    """A small dog barks once."""
    dur = 0.35
    t = t_of(dur)
    f = 420 - 120 * np.minimum(t / 0.15, 1)  # 420 -> 300 Hz
    phase = 2 * np.pi * np.cumsum(f) / SR
    tone = sum(np.sin(k * phase) / k for k in range(1, 7))
    breath = bpf(rng.standard_normal(len(t)), 1200, q=2)
    env = np.minimum(t / 0.01, 1) * np.exp(-t / 0.12)  # 10 ms attack, ~120 ms decay
    return (0.7 * unit(tone) + 0.3 * unit(breath)) * env


def chime():
    """Two soft notes, E6 then C6, second starting at 0.35 s."""
    y = np.zeros(int(1.6 * SR))
    for f, t0 in [(1318.51, 0.0), (1046.50, 0.35)]:
        t = t_of(1.25)
        env = np.minimum(t / 0.005, 1) * np.exp(-t / 0.2)
        tone = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)
        place(y, tone * env, t0)
    return y


def beep():
    """Barcode scanner: one clean 2.7 kHz sine, 0.12 s, then quiet tail."""
    y = np.zeros(int(0.25 * SR))
    t = t_of(0.12)
    place(y, np.sin(2 * np.pi * 2700 * t) * 0.8, 0.0)
    return y


def card():
    """Terminal accepting: two short 1.8 kHz beeps, then a softer rising tone."""
    y = np.zeros(int(0.62 * SR))
    t = t_of(0.08)
    beep_tone = np.sin(2 * np.pi * 1800 * t) * np.sin(np.pi * t / 0.08) ** 2
    place(y, beep_tone, 0.0)
    place(y, beep_tone, 0.20)
    t = t_of(0.24)
    f = np.linspace(2000, 2600, len(t))
    rise = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.24) ** 2 * 0.5
    place(y, rise, 0.36)
    return y


def coin():
    """100-yen coin on a counter: inharmonic metallic tap, tiny wood knock, small bounce."""
    y = np.zeros(int(0.9 * SR))
    partials = [(3200, 1.0, 0.12), (5100, 0.6, 0.10), (7400, 0.4, 0.08), (9800, 0.25, 0.06)]

    def metal(gain):
        t = t_of(0.4)
        tap = sum(a * np.exp(-t / tau) * np.sin(2 * np.pi * f * t) for f, a, tau in partials)
        click = rng.standard_normal(len(t)) * np.exp(-t / 0.001)
        return (tap + click * 0.3) * gain

    place(y, metal(1.0), 0.0)
    place(y, metal(0.3), 0.06)  # small second bounce, quieter
    t = t_of(0.05)
    knock = np.sin(2 * np.pi * 450 * t) * np.exp(-t / 0.015)
    place(y, lp1(knock + rng.standard_normal(len(t)) * np.exp(-t / 0.003) * 0.2, 2500) * 0.4, 0.0)
    return y


def rain(dur=5.0, fade=.35):
    """Gentle rain: a soft pink-noise wash, fine patter on the pavement and drops tapping on umbrellas."""
    t = t_of(dur)
    n = len(t)
    wash = hp1(lp1(lp1(pink(n), 3500), 3500), 120)
    patter = drops(n, 90, 2200, 2.0, .004, .2, .6)
    taps = drops(n, 22, 700, 3.0, .012, .4, 1.0)
    y = unit(wash) * .75 + unit(patter) * .25 + unit(taps) * .3
    return y * np.minimum(t / fade, 1) * np.minimum((dur - t) / fade, 1)


def creak():
    """A door hinge creaking open a crack, 1.1 s: uneven stick-slip clicks ringing a wooden body, loudest mid-way."""
    y, at = np.zeros(int(1.1 * SR)), .02
    while at < 1.05:
        k = t_of(.03)
        click = bpf(noise(len(k)), 420, q=6) + .7 * bpf(noise(len(k)), 900, q=8)
        place(y, unit(click) * np.exp(-k / .008) * (.5 + .5 * np.sin(np.pi * at / 1.1)), at)
        at += 1 / (14 + 26 * np.sin(np.pi * at / 1.1) * (.7 + .3 * rng.random()))  # 14-40 clicks a second
    return y


def latch():
    """A door latch clicking shut: two small metal clicks."""
    y = np.zeros(int(.25 * SR))
    for at, g in [(0, 1), (.06, .6)]:
        t = t_of(.05)
        place(y, unit(bpf(noise(len(t)), 3200, q=3)) * np.exp(-t / .006) * g, at)
    return y


def clang():
    """An empty steel bowl dropped on stone: a bright ring, then quick rattles as it settles."""
    y = np.zeros(int(.9 * SR))
    for at, g, d in [(0, 1, .35), (.16, .55, .18), (.27, .35, .12), (.34, .2, .08)]:
        t = t_of(d)
        ring = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(1180, 1), (1730, .6), (2610, .4), (3300, .25)])
        place(y, unit(ring + .3 * hp1(noise(len(t)), 2000) * np.exp(-t / .004)) * np.exp(-t / (d / 3)) * g, at)
    return y


def shutter():
    """A rolling steel shutter rattling down (1 s of slats) and banging on the ground."""
    y = np.zeros(int(1.3 * SR))
    for i in range(22):
        t = t_of(.05)
        place(y, unit(bpf(noise(len(t)), 1500 + 300 * (i % 3), q=4)) * np.exp(-t / .01) * (.35 + .3 * (i % 2)), i * .045)
    t = t_of(.3)
    place(y, (unit(bpf(noise(len(t)), 300, q=1)) + unit(np.sin(2 * np.pi * 90 * t))) * np.exp(-t / .07) * .7, 1.0)
    return y


def wind():
    """A soft cold wind, 8 s bed: low noise around 500 Hz swelling in slow gusts."""
    t = t_of(8.0)
    n = len(t)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1
    w = np.fft.irfft(np.fft.rfft(noise(n)) / np.sqrt(f) * np.exp(-((np.log(f) - np.log(500)) ** 2) / 1.2), n)
    return unit(w) * (.45 + .55 * np.sin(np.pi * t / 4) ** 2) * np.minimum(t / 1.0, 1) * np.minimum((8 - t) / 1.2, 1)


def room():
    """Room tone, 3 s: an extractor hum (100 Hz) under a low wash; 0.4 s fades, so tiles every 2.6 s overlap smoothly."""
    t = t_of(3.0)
    n = len(t)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1
    wash = np.fft.irfft(np.fft.rfft(noise(n)) / f * (f > 40) / (1 + (f / 600) ** 2), n)
    hum = np.sin(2 * np.pi * 100 * t) + .4 * np.sin(2 * np.pi * 200 * t + 1)
    return (unit(wash) * .8 + unit(hum) * .25) * np.minimum(t / .4, 1) * np.minimum((3 - t) / .4, 1)


def inhale(dur=1.4):
    """A big breath in through the nose: band noise swelling and rising (500 -> 1500 Hz), then a 0.12 s fade."""
    t = t_of(dur)
    return unit(bpf(noise(len(t)), 500 + 1000 * t / dur, q=1.5)) * np.minimum(t / (dur * .8), 1) ** 1.5 * np.minimum((dur - t) / .12, 1)


def scrape():
    """Metal scraped, 0.28 s: a short rasp ringing a steel bowl (2.1 / 3.4 / 5 kHz)."""
    t = t_of(.28)
    n = noise(len(t)) * (1 + .6 * np.sin(2 * np.pi * 28 * t))
    v = bpf(n, 2100, q=8) + .7 * bpf(n, 3400, q=10) + .4 * bpf(n, 5000, q=10) + .3 * bpf(n, 900, q=1)
    return unit(v) * np.sin(np.pi * t / .28) ** .8


def flap():
    """A cardboard flap dropping back: a dull papery slap, 0.15 s."""
    t = t_of(.15)
    return unit(bpf(noise(len(t)), 420, q=1.2)) * np.minimum(t / .004, 1) * np.exp(-t / .035)


def sash():
    """A sash window shoved up: a wooden slide (band noise rising) ending in a knock."""
    t = t_of(.5)
    y = unit(bpf(noise(len(t)), 500 + 900 * t / .5, q=2)) * np.minimum(t / .05, 1) * (.4 + .6 * t / .5)
    k = t_of(.08)
    place(y, unit(bpf(noise(len(k)), 700, q=3)) * np.exp(-k / .02), .42)
    return y


def honk():
    """A penguin's (or goose's) bray: a nasal saw falling 470 -> 300 Hz with a quick wobble, through two formants; two pulses."""
    y = np.zeros(int(.75 * SR))
    for at, d, f0 in [(0, .16, 470), (.2, .42, 420)]:
        t = t_of(d)
        f = f0 - 120 * t / d + 18 * np.sin(2 * np.pi * 24 * t)
        s = 2 * ((np.cumsum(f) / SR) % 1) - 1  # naive saw
        v = bpf(s, 950, q=3) + .6 * bpf(s, 2300, q=4) + .2 * s
        place(y, unit(v) * np.sin(np.pi * np.minimum(t / d, 1)) ** .6 * (.7 if at == 0 else 1), at)
    return y


def gulls():
    """Three distant gull cries, 3 s: a falling 'kee-ow' with a little rasp, softened by distance."""
    y = np.zeros(3 * SR)
    for at, f0, g in [(.1, 1900, 1), (.55, 1750, .8), (1.9, 2000, .6)]:
        t = t_of(.38)
        f = f0 - 700 * (t / .38) ** 1.5 + 40 * np.sin(2 * np.pi * 30 * t)
        ph = np.cumsum(f) / SR
        v = np.sin(2 * np.pi * ph) + .35 * np.sin(4 * np.pi * ph) + .05 * noise(len(t))
        place(y, lp1(v, 3000) * np.sin(np.pi * t / .38) ** .8 * g, at)
    return y


def surf(dur=30.0, fade_in=1.0, fade_out=1.5):
    """Soft surf, 30 s: a low noise wash swelling and drawing back every 3 s.

    One long file covers a scene (a short loop of separate plays gaps or doubles at every join); shaped in the
    frequency domain, so no filter run-in."""
    t = t_of(dur)
    n = len(t)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1
    w = np.fft.irfft(np.fft.rfft(noise(n)) / np.sqrt(f) / (1 + (f / 1100) ** 2) * (f > 60), n)
    return unit(w) * (.4 + .6 * np.sin(np.pi * t / 3) ** 2) * np.minimum(t / fade_in, 1) * np.minimum((dur - t) / fade_out, 1)


def patter(steps=12, gap=1 / 6):
    """Light footsteps on stone (a small animal or a child): flat little slaps, six a second, 2 s."""
    y = np.zeros(int((.06 + steps * gap) * SR))
    for k in range(steps):
        d = t_of(.06)
        hit = unit(bpf(noise(len(d)), 900 + 150 * (k % 2), q=1.5) * np.exp(-d / .012)) * .6 + unit(np.sin(2 * np.pi * 180 * d) * np.exp(-d / .02)) * .4
        place(y, hit * (.75 + .25 * (k % 2)), .02 + k * gap)
    return y


def step1():
    """One grown-up's shoe on pavement, 0.2 s: a soft low thud under a short dull scuff (lower than patter)."""
    y, d = np.zeros(int(.2 * SR)), t_of(.14)
    thud = unit(np.sin(2 * np.pi * (130 - 60 * d / .14) * d) * np.exp(-d / .035))
    scuff = unit(bpf(noise(len(d)), 1500, q=1.2) * np.exp(-d / .02) * np.minimum(d / .004, 1))
    place(y, .6 * thud + .5 * scuff, .01)
    return y


def crack():
    """A whip: a short swish, then a sharp snap with a little room ring, 0.5 s."""
    y = np.zeros(int(.5 * SR))
    sw = t_of(.16); place(y, unit(bpf(noise(len(sw)), 1400, q=1.2) * np.sin(np.pi * sw / sw[-1]) ** 2) * .25, 0)
    s = t_of(.34); place(y, unit(hp1(noise(len(s)), 3000) * np.exp(-s / .006)) + unit(bpf(noise(len(s)), 2200, q=3) * np.exp(-s / .05)) * .3, .16)
    return y


def clop():
    """Four slow hoof steps on a dirt road (2 s): dull knocks, a little uneven."""
    y = np.zeros(int(2.0 * SR))
    for k, at in enumerate((.05, .52, 1.0, 1.47)):
        d = t_of(.12)
        hit = unit(bpf(noise(len(d)), 380 + 40 * (k % 2), q=2) * np.exp(-d / .02)) * .7 + unit(np.sin(2 * np.pi * 150 * d) * np.exp(-d / .03)) * .5
        place(y, hit * (.8 + .2 * (k % 2)), at)
    return y


def gull1():
    """One distant gull cry (the last of gulls), for a second gull that is not the same pattern."""
    return gulls()[int(1.85 * SR):int(2.4 * SR)]


def yip():
    """A puppy's tiny yip: a quick high squeak 900 -> 1300 -> 800 Hz, 0.2 s."""
    t = t_of(.2)
    ph = 2 * np.pi * np.cumsum(900 + 400 * np.sin(np.pi * t / .2)) / SR
    return unit(np.sin(ph) + .3 * np.sin(2 * ph)) * np.sin(np.pi * t / .2) ** .5


def bark_big(k=1.0, dur=.32, rough=.4):
    """A big dog's 'WOOF': a harsh onset, then a rough voiced 'wuh' whose pitch jumps up and falls (200-320 Hz),
    through mouth formants (550 / 1150 / 2500 Hz), a breathy tail."""
    t = t_of(dur)
    f = k * (200 + 120 * np.sin(np.pi / 2 * np.minimum(t / .05, 1)) - 140 * np.maximum(t - .05, 0) / dur)
    f = f * (1 + .02 * noise(len(t)).cumsum() / np.sqrt(np.arange(1, len(t) + 1)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    src = sum(np.sin(h * ph) / h ** 1.1 for h in range(1, 18)) * (1 + rough * np.sin(2 * np.pi * 35 * t))
    voiced = bpf(src, 550, q=2) + .8 * bpf(src, 1150, q=3) + .35 * bpf(src, 2500, q=4)
    env = np.minimum(t / .008, 1) * np.where(t < .07, 1, np.exp(-(t - .07) / (dur / 3.2)))
    return (unit(voiced) * .8 + unit(bpf(noise(len(t)), 1300, q=1.2)) * .25 * np.exp(-t / .2)
            + unit(hp1(noise(len(t)), 1500) * np.exp(-t / .012)) * .35) * env


def woof_mf():
    """A bark smothered by paws: the start of a big bark, muffled, then a closed-mouth 'mf', 0.45 s."""
    b = bark_big(.95)[:int(.15 * SR)]
    b = lp1(lp1(b, 700), 700) * np.minimum((.15 - t_of(.15)) / .03, 1)
    t = t_of(.25)
    y = np.zeros(int(.45 * SR)); place(y, unit(b), 0); place(y, lp1(np.sin(2 * np.pi * 140 * t) * np.exp(-t / .08) * .6, 400), .14)
    return y


def clack():
    """A wooden game piece set down on a wooden board: a dry click, a short hollow ring, a tiny settle, 0.25 s."""
    y, t = np.zeros(int(.25 * SR)), t_of(.12)
    click = unit(smooth(hp1(noise(len(t)), 1800), 4) * np.exp(-t / .0012))
    ring = unit(bpf(noise(len(t)), 1250, q=9) * np.exp(-t / .022))
    body = unit(np.sin(2 * np.pi * 520 * t) * np.exp(-t / .018))
    place(y, .55 * click + .7 * ring + .35 * body, .005)
    place(y, .18 * ring[:int(.05 * SR)] * np.exp(-t[:int(.05 * SR)] / .01), .04)   # the felt base settles
    return y


def chalk():
    """A chalk line on wood or a board, 0.55 s: a gritty scratch with a faint squeak riding on it."""
    t = t_of(.55)
    grit = smooth(bpf(noise(len(t)), 2000, q=2.2), 10) * np.repeat(rng.uniform(.35, 1, int(np.ceil(.55 / .006))), int(.006 * SR))[:len(t)]
    f = 2300 + 260 * np.sin(2 * np.pi * 3 * t) + 80 * noise(len(t)).cumsum() / SR
    squeak = np.sin(2 * np.pi * np.cumsum(f) / SR) * (.5 + .5 * np.sin(2 * np.pi * 45 * t)) ** 2
    env = np.minimum(t / .03, 1) * np.minimum((.55 - t) / .08, 1)
    return (unit(grit) * .8 + unit(squeak) * .22) * env


def slurp():
    """A sip of something hot, 0.7 s: an airy suck rising in pitch, a little bubbly."""
    t = t_of(.7)
    air = bpf(noise(len(t)), 700 + 1300 * (t / .7) ** .7, q=2.5)
    bub = .55 + .45 * np.sign(np.sin(2 * np.pi * np.cumsum(32 + 20 * rng.random(len(t))) / SR))
    return unit(smooth(air * bub)) * np.sin(np.pi * t / .7) ** .7


def hmph():
    """A small offended 'hmph' through the nose, 0.4 s: a short low hum under a breath out."""
    t = t_of(.4)
    s = 2 * ((np.cumsum(175 - 55 * t / .4) / SR) % 1) - 1
    hum = bpf(s, 260, q=2) + .25 * bpf(s, 1100, q=4)
    breath = smooth(bpf(noise(len(t)), 650, q=1.6), 24)
    return (unit(hum) * .7 + unit(breath) * .6) * np.minimum(t / .012, 1) * np.exp(-t / .11)


def birds(dur=10.0):
    """A park in the afternoon, 10 s bed: a soft far wash with a few distant birds; 0.4 s fades, so tiles every 9.6 s overlap."""
    t = t_of(dur)
    n = len(t)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1
    wash = unit(np.fft.irfft(np.fft.rfft(noise(n)) / np.sqrt(f) * (f > 60) / (1 + (f / 900) ** 2), n)) * .35
    y = np.zeros(n)
    for _ in range(int(.9 * dur)):   # phrases of two to five chirps
        at, f0, g = rng.uniform(.3, dur - 1), rng.uniform(3000, 4800), rng.uniform(.25, .6)
        for k in range(rng.integers(2, 6)):
            d = rng.uniform(.05, .11)
            c = t_of(d)
            sweep = f0 * (1 + .25 * np.sin(np.pi * c / d)) * rng.uniform(.92, 1.08)
            place(y, np.sin(2 * np.pi * np.cumsum(sweep) / SR) * np.sin(np.pi * c / d) ** 2 * g, min(at + k * rng.uniform(.12, .2), dur - .3))
    y = bpf(y, 3800, q=.8)   # distance takes the edge off
    return (wash + unit(y) * .5) * np.minimum(t / .4, 1) * np.minimum((dur - t) / .4, 1)


def laugh():
    """A warm laugh, 1.2 s: five breathy 'ha's falling in pitch and getting softer."""
    y = np.zeros(int(1.2 * SR))
    for k in range(5):
        d = .13 - .008 * k
        t = t_of(d)
        ph = np.cumsum(240 - 18 * k - 40 * t / d) / SR
        src = 2 * (ph % 1) - 1
        voiced = bpf(src, 750, q=3) + .7 * bpf(src, 1200, q=4) + .25 * bpf(src, 2600, q=5)
        h = bpf(noise(len(t)), 1400, q=1) * np.exp(-t / .02)   # the breathy 'h' at each onset
        env = np.minimum(t / .015, 1) * np.minimum((d - t) / .04, 1)
        place(y, (unit(voiced) + .5 * unit(h)) * env * (1 - .13 * k), .02 + k * .19)
    return y


def applause(dur=3.0):
    """A small audience clapping, 3 s: many hands at their own pace, swelling in and dying away."""
    t = t_of(dur)
    y = np.zeros(len(t))
    for _ in range(18):   # 18 people clapping 3-5 times a second
        rate, at, fc = rng.uniform(3, 5), rng.uniform(0, .4), rng.uniform(1100, 2200)
        while at < dur - .1:
            c = t_of(.05)
            place(y, unit(bpf(noise(len(c)), fc, q=1.3)) * np.exp(-c / .008) * rng.uniform(.5, 1), at)
            at += rng.normal(1 / rate, .02)
    return y * np.minimum(t / .3, 1) * np.minimum((dur - t) / 1.2, 1)


def splash():
    """Something dropped into water, 0.9 s: a low plunge, a spray of noise and droplets falling back."""
    t = t_of(.9)
    n = len(t)
    plunge = lp1(noise(n), 400) * np.exp(-t / .08)
    spray = bpf(noise(n), 1800, q=.8) * np.minimum(t / .01, 1) * np.exp(-t / .18)
    y = unit(plunge) * .7 + unit(spray) * .6 + unit(drops(n, 40, 1500, 6, .01, .3, 1)) * .3 * np.exp(-t / .5)
    return y


def page():
    """A page turned, 0.5 s: a papery swish that rises and lands with a soft flap."""
    t = t_of(.5)
    crinkle = np.repeat(rng.uniform(.4, 1, int(np.ceil(.5 / .008))), int(.008 * SR))[:len(t)]
    swish = unit(bpf(noise(len(t)), 1200 + 2400 * t / .5, q=1.1)) * crinkle * np.sin(np.pi * t / .5) ** 1.5
    k = t_of(.06)
    place(swish, unit(bpf(noise(len(k)), 500, q=1.2)) * np.exp(-k / .015) * .6, .42)
    return swish


def pop():
    """A cork or a bubble popping, 0.2 s: a click and a quick hollow drop in pitch."""
    t = t_of(.2)
    tone = np.sin(2 * np.pi * np.cumsum(700 * np.exp(-t / .03) + 250) / SR) * np.exp(-t / .03)
    return unit(tone) + .5 * unit(hp1(noise(len(t)), 2500) * np.exp(-t / .0015))


def boing():
    """A spring, 0.8 s: a low twang whose pitch wobbles fast and settles."""
    t = t_of(.8)
    f = 170 * (1 + .35 * np.exp(-t / .25) * np.sin(2 * np.pi * 11 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return unit(np.sin(ph) + .3 * np.sin(2 * ph)) * np.minimum(t / .005, 1) * np.exp(-t / .3)


RECIPES = {name: globals()[name] for name in (
    "sting growl gulp door tick bell whoosh fly violin crickets chair knock chop bang bonk thud crash plop sniff "
    "chomp burp lick bark chime beep card coin rain creak latch clang shutter sash flap scrape inhale wind room "
    "honk gulls surf patter step1 crack clop gull1 yip clack chalk slurp hmph birds laugh applause splash page pop "
    "boing").split()}
RECIPES["bark-big"] = bark_big
RECIPES["woof-mf"] = woof_mf
RECIPES["rain-short"] = lambda: rain(1.15, .12)
RECIPES["rain-short"].__doc__ = "About one second of the same rain, for a quick cut."
RECIPES["inhale-short"] = lambda: inhale(.85)
RECIPES["inhale-short"].__doc__ = "A quicker breath in, 0.85 s."
RECIPES["patter1"] = lambda: patter(1)
RECIPES["patter1"].__doc__ = "One light step of the same patter."


def write_mp3(path, y):
    fade = int(0.005 * SR)
    ramp = np.linspace(0, 1, fade)
    y = y.copy()
    y[:fade] *= ramp
    y[-fade:] *= ramp[::-1]
    y *= 10 ** (-3 / 20) / np.max(np.abs(y))
    pcm = (np.clip(y, -1, 1) * 32767).astype("<i2")
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, "x.wav")
        with wave.open(wav, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", str(SR),
                        "-b:a", "128k", str(path)], check=True)


def load_recipes(path):
    """Import a book's recipe file and add its recipes to RECIPES; returns their names."""
    import importlib.util
    import inspect
    sys.modules.setdefault("sfx", sys.modules[__name__])   # `import sfx` in the file gets this module, not a second copy
    spec = importlib.util.spec_from_file_location(f"sfx_book_{zlib.crc32(os.path.abspath(path).encode())}", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    added = []
    for name, fn in vars(mod).items():
        if name.startswith("_") or not inspect.isfunction(fn) or fn.__module__ != mod.__name__:
            continue
        if any(p.default is p.empty and p.kind in (p.POSITIONAL_ONLY, p.POSITIONAL_OR_KEYWORD)
               for p in inspect.signature(fn).parameters.values()):
            continue   # a helper that needs arguments, not a recipe
        RECIPES[name.replace("_", "-")] = fn
        added.append(name.replace("_", "-"))
    return added


def render(name):
    global rng
    rng = np.random.default_rng(zlib.crc32(name.encode()))
    return RECIPES[name]()


BOOK_TEST = '''import numpy as np
from sfx import SR, t_of, unit, noise
def _hidden():
    return np.zeros(10)
def helper(x):
    return x
def tap_tap(dur=.1):
    "Two taps."
    return unit(noise(len(t_of(dur))))
def knock():
    "A book's own knock."
    return np.ones(SR // 10)
'''


def selftest():
    """--recipes: a book file's recipes register (helpers and imports do not), override built-ins, render repeatably."""
    with tempfile.TemporaryDirectory() as d:
        f = os.path.join(d, "book.py")
        with open(f, "w") as fh:
            fh.write(BOOK_TEST)
        assert load_recipes(f) == ["tap-tap", "knock"]
        assert "helper" not in RECIPES and "_hidden" not in RECIPES and "unit" not in RECIPES
        a, b = render("tap-tap"), render("tap-tap")
        assert len(a) == 4410 and np.array_equal(a, b)
        assert np.all(render("knock") == 1)
    print("sfx selftest ok")


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out", nargs="?", help="folder for <name>.mp3 (the chapter's audio/sfx)")
    ap.add_argument("names", nargs="*", help="recipe names, or all")
    ap.add_argument("--recipes", action="append", default=[], metavar="FILE.py", help="a book's own recipes")
    ap.add_argument("--list", action="store_true", help="print the recipe names with a one-line description")
    ap.add_argument("--selftest", action="store_true", help="check the --recipes loading")
    a = ap.parse_args(argv)
    if a.selftest:
        return selftest()
    for f in a.recipes:
        load_recipes(f)
    if a.list:
        for name, fn in RECIPES.items():
            doc = (fn.__doc__ or "").strip().splitlines()
            print(f"{name:14s}{doc[0] if doc else ''}")
        return
    if not a.out or not a.names:
        ap.error("give an output folder and recipe names (or all)")
    names = list(RECIPES) if a.names == ["all"] else a.names
    unknown = [n for n in names if n not in RECIPES]
    if unknown:
        sys.exit(f"unknown: {', '.join(unknown)} (sfx.py --list)")
    os.makedirs(a.out, exist_ok=True)
    for name in names:
        write_mp3(os.path.join(a.out, name + ".mp3"), render(name))
        print("wrote", name)


if __name__ == "__main__":
    main(sys.argv[1:])
