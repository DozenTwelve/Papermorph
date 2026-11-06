#!/usr/bin/env python3
"""Join several narration clips into one clip per scene, so a whole scene plays as one beat.

    python3 join.py site/<book>/chNN/audio/en scene1=s01,s02,s02b,hush1:4 scene2=s03,s04@2.1+1.5,s05
    python3 join.py ... --words content/<book>/chNN/narration.en.json   # also every word's time, for scene authors

Each argument is SCENE=CLIP,CLIP,...; a clip may be CLIP@T+S@T+S: S seconds of silence inserted T seconds into it
(room for an action in the middle of a line; T may be 0, silence before the line), and NAME:S is S seconds of
silence with no clip of its own (a stare or a tag after the last line; its start is in `parts` like a clip's). Each
name appears once in a scene (its start and marks are keyed by it), and a scene is not named like a clip. A
hole belongs after a word's sound has ended, not where the next word starts; one that falls inside the sound (within
30 dB of the clip's loud parts) gets a WARNING naming the scene, the clip and time, the word (with --words) and the
nearest pause to move it to. A short pause (0.35 s) goes between clips. Writes AUDIO_DIR/SCENE.mp3 and
AUDIO_DIR/shots.js: TIMINGS.SCENE = {dur, marks, cues, parts} with each clip's start in `parts` (marks become
"clip.mark") and the caption cues moved along; the mouth cues of clips with holes are moved too (MOUTHS.clip). Load
shots.js after timings.js and mouths.js. A scene not on the command line keeps what an earlier run wrote for it in
shots.js (and in the words file), so one scene can be joined again alone; the run names the scenes it kept. Captions start 0.12 s after Edge's word times (the sound starts that much
later; mouths.py moves its cues the same) and end at the first pause of 0.45 s or more after their last word — a
pause inside the sentence, or the clip's silence without word times, never ends one early. With --words, writes NARRATION.words.txt next to the narration (outside the site): each clip's start, its holes and
every word's heard time in the joined scene clip, which a scene's author times actions against (the beat clock is the
scene's `pre` plus these). Keep the join command in a script beside the book's notes and rerun it after any change.
Run after tts.py and mouths.py; needs ffmpeg.
"""
import array, json, math, re, subprocess, sys, pathlib, tempfile
if len(sys.argv) < 3 or sys.argv[1] in ('-h', '--help'):
    print(__doc__); sys.exit(0 if sys.argv[1:2] in (['-h'], ['--help']) else 2)
GAP = .35
LAG = .12   # Edge's word times run ~0.12–0.25 s ahead of the sound: captions (and mouths.py's cues) start this much later
from silence import speech_end, pauses, silences   # a caption ends at the pause after its words
from tts import duration, js_object
d = pathlib.Path(sys.argv[1]); T = js_object(d / 'timings.js')
args, words = sys.argv[2:], None
if '--words' in args:
    k = args.index('--words'); words = pathlib.Path(args[k + 1]); del args[k:k + 2]
WB = json.loads(words.with_suffix('.timings.json').read_text(encoding='utf-8')) if words else {}   # per-beat word times, to place caption ends
def level_at(f, ts):
    """The sound at each time in ts: the loudest 10 ms within 20 ms of it, in dB against the clip's loud level (its
    95th-percentile 10 ms). Between words a clip sits 30 dB or more under it (Millions of Cats: -33 to -54); inside a
    word, 0 to -25."""
    x = array.array('f', subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                                        capture_output=True, check=True).stdout)   # ponytail: native byte order, little-endian machines
    fr = [10 * math.log10(sum(v * v for v in x[i:i + 160]) / 160 + 1e-12) for i in range(0, len(x) - 160, 160)]
    top = sorted(fr)[int(len(fr) * .95)] if fr else 0
    return [max(fr[max(0, round(t * 100) - 2):round(t * 100) + 3] or [-120]) - top for t in ts]
def silence(path, sec):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', str(sec), '-b:a', '64k', str(path)], check=True)
out, H = {}, {}   # H: every shot's holes, for the mouths
for arg in args:
    shot, beats = arg.split('='); beats = beats.split(',')
    if shot in T and not T[shot].get('silent'):   # SCENE.mp3 would be written over the clip
        sys.exit(f"{shot}: a clip of that name is in timings.js, and the scene's {shot}.mp3 would replace it: name the scene otherwise")
    names = [re.split(r'[@:]', b)[0] for b in beats]
    if dup := sorted({n for n in names if names.count(n) > 1}):   # its start in parts, its marks, would be overwritten
        sys.exit(f"{shot}: {', '.join(dup)} more than once; each clip or silence in a scene needs a name of its own "
                 "(a repeated line: voice it again as a beat of its own; a silence: hush1:1, hush2:1)")
    holes = {}   # beat -> [(at, seconds)]: silences inserted inside a clip, room for action
    for i, b in enumerate(beats):
        if ':' in b:   # NAME:S, a stretch of silence
            name, sec = b.split(':'); beats[i] = name; holes[name] = []
            T[name] = {'dur': float(sec), 'marks': {}, 'cues': [], 'silent': True}; continue
        name, *ins = b.split('@'); beats[i] = name
        holes[name] = sorted(tuple(map(float, x.split('+'))) for x in ins)
        inner = [at for at, _ in holes[name] if 0 < at < T[name]['dur'] - .05]   # a hole at 0 or the end cuts no word
        for at, db in zip(inner, level_at(d / f'{name}.mp3', inner) if inner else []):
            if db > -30:   # a hole here splits a word ("la- [0.8 s] -st"), heard as the voice sticking
                said = [(t + (WB.get(name) or {}).get('lag', LAG), w) for t, w in (WB.get(name) or {}).get('words', [])]
                word = max((tw for tw in said if tw[0] <= at), default=None)
                near = min(silences(d / f'{name}.mp3', .1), key=lambda g: min(abs(g[0] - at), abs(g[1] - at)), default=None)
                print(f"WARNING {shot}: {name}@{at} is inside the clip's sound ({db:+.0f} dB against its loud parts"
                      + (f", in {word[1]!r} heard at {word[0]:.2f} s" if word else "") + ")"
                      + (f"; the nearest pause is {near[0]:.2f}-{near[1]:.2f} s: put the hole there" if near else "; put it in a pause after a word"),
                      file=sys.stderr)
    with tempfile.TemporaryDirectory() as tmp:
        def piece(b):   # the clip's file, cut at its holes with silence between
            if T[b].get('silent'):
                f = pathlib.Path(tmp) / f'{b}.mp3'; silence(f, T[b]['dur']); return [str(f)]
            if not holes[b]: return [str((d / f'{b}.mp3').resolve())]
            out, start = [], 0
            for k, (at, sec) in enumerate(holes[b] + [(None, 0)]):
                seg = pathlib.Path(tmp) / f'{b}-{k}.mp3'
                if at is None or at > start:   # a hole at 0 (or two at one place) has no sound before it
                    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', str(d / f'{b}.mp3'), '-ss', str(start)] + (['-to', str(at)] if at is not None else []) + ['-c:a', 'libmp3lame', '-b:a', '64k', str(seg)]
                    subprocess.run(cmd, check=True); out.append(str(seg))
                if at is not None:
                    sil = pathlib.Path(tmp) / f'{b}-s{k}.mp3'
                    silence(sil, sec); out.append(str(sil)); start = at
            return out
        shift = lambda b, t: t + sum(sec for at, sec in holes[b] if t >= at)
        gap = pathlib.Path(tmp) / 'gap.mp3'; silence(gap, GAP)
        lst = pathlib.Path(tmp) / 'list.txt'
        q = lambda f: "file '" + str(f).replace("'", "'\\''") + "'\n"   # the concat list's quoting: ' becomes '\''
        lst.write_text(''.join(''.join(q(f) for f in piece(b)) + (q(gap) if i < len(beats) - 1 else '') for i, b in enumerate(beats)), encoding='utf-8')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c:a', 'libmp3lame', '-b:a', '64k', str(d / f'{shot}.mp3')], check=True)
    parts, cues, marks, at = {}, [], {}, 0
    for b in beats:
        parts[b] = round(at, 3)
        # a caption at 0 (a voice with no word timings) still belongs after a hole that opens the clip; each one ends
        # .3 s after its words do (the next caption, a hole between it and the next, or the clip's last sound), so it
        # does not hang over the action; a hole or a pause inside its own sentence keeps it up — a pause may close it
        # only once its final word has been heard (with word times; without them only the trusted ends close it)
        if T[b].get('silent'): at += T[b]['dur'] + GAP; continue
        cs, last, ps = T[b]['cues'], speech_end(d / f'{b}.mp3'), pauses(d / f'{b}.mp3')
        said = [t for t, _ in (WB.get(b) or {}).get('words', [])]
        for k, (t, c) in enumerate(cs):
            t = max(t, .1); nxt = cs[k + 1][0] if k + 1 < len(cs) else None
            lim = nxt or 1e9
            mine = [w for w in said if t <= w < lim]
            stop = min([last] + ([nxt] + [h for h, _ in holes[b] if t < h < nxt] if nxt is not None else [])
                       + [x for x in ps if t + .15 < x < lim and mine and x > max(mine) + .2])
            cues.append([round(shift(b, t) + at + (WB.get(b) or {}).get('lag', LAG), 3), c, round(shift(b, stop - 1e-3) + at + .3, 3)] + [1] * bool(T[b].get('forced')))
        marks.update({f'{b}.{k}': round(shift(b, v) + at, 3) for k, v in T[b]['marks'].items()})
        at += T[b]['dur'] + sum(sec for _, sec in holes[b]) + GAP
    dur = duration(d / f'{shot}.mp3')
    H.update(holes)
    out[shot] = {'dur': round(dur, 3), 'marks': marks, 'cues': cues, 'parts': parts}
# a clip with holes gets its mouth cues moved the same way (and shut at each hole), after mouths.js in the page
mp = d / 'mouths.js'; M = js_object(mp) if mp.exists() else {}
sh = lambda b, t: t + sum(sec for at, sec in H[b] if t >= at)
moved = {b: sorted([[round(sh(b, t), 3), k] for t, k in M[b]] + [[round(sh(b, at - 1e-3), 3), 'X'] for at, _ in H[b]])
         for b in H if H[b] and b in M}
# the scenes joined before and not in this run stay (rejoining one scene keeps the others), and so do the moved mouths
# of their clips; a clip of this run is moved afresh, or back to mouths.js's own cues when it has no holes now
sp, mine = d / 'shots.js', {b for b in H}
old = {}   # (TIMINGS or MOUTHS, name) -> value, as an earlier run wrote them
if sp.exists():
    for line in sp.read_text(encoding='utf-8').splitlines():
        if m := re.fullmatch(r'(TIMINGS|MOUTHS)\.(\w+) = (.*);', line): old[m[1], m[2]] = json.loads(m[3])
kept = [k for (w, k) in old if w == 'TIMINGS' and k not in out]
scenes = {**{k: v for (w, k), v in old.items() if w == 'TIMINGS' and k not in out}, **out}
mouths = {**{k: v for (w, k), v in old.items() if w == 'MOUTHS' and k not in mine}, **moved}
sp.write_text(''.join(f'TIMINGS.{k} = {json.dumps(v)};\n' for k, v in scenes.items()) + ''.join(f'MOUTHS.{b} = {json.dumps(v)};\n' for b, v in mouths.items()), encoding='utf-8')
if kept: print(f"kept from the earlier shots.js (not joined this run): {', '.join(kept)}")
if words:   # every word where it is heard in its scene clip
    W, lines = json.loads(words.with_suffix('.timings.json').read_text(encoding='utf-8')), []
    for sc, v in out.items():
        lines.append(f"{sc} dur {v['dur']} (scene-clip times; the beat clock adds the scene's pre)")
        for b, p in v['parts'].items():
            hs = ' '.join(f'[hole {round(p + sh(b, at - 1e-6), 2)}…{round(p + sh(b, at - 1e-6) + sec, 2)}]' for at, sec in H.get(b, []))
            ws = W.get(b, {}).get('words', [])
            lines.append(f"   {b} @{p} {hs} | " + (' '.join(f'{w}@{round(p + sh(b, t) + W.get(b, {}).get("lag", LAG), 2)}' for t, w in ws) or '(silence)'))
    wf = words.with_suffix('.words.txt')   # the earlier run's lines of the scenes kept in shots.js stay
    if wf.exists():
        blocks = re.split(r'\n(?=\S)', wf.read_text(encoding='utf-8').strip('\n'))
        lines = [x for x in blocks if x.split(' ', 1)[0] in kept] + lines
    wf.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print({k: (v['dur'], v['parts']) for k, v in out.items()})
