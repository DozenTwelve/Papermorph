#!/usr/bin/env python3
"""Mouth shapes for every beat of a narration, from the TTS word times, for puppets that talk.

    python3 mouths.py content/<book>/chNN/narration.en.json site/<book>/chNN/audio/en

Reads the .timings.json cache that tts.py wrote next to the narration file and writes AUDIO_DIR/mouths.js
(window.MOUTHS = {beat: [[seconds, shape], ...]}). Shapes follow the cartoon set Rhubarb uses: A closed (m b p),
B teeth/most consonants, C open (e i), D wide (a), E round (o), F pucker (oo w u), G f/v, H l, X rest. Each word's
letters become shapes spread over the word's time; a pause between words closes the mouth. Letters are read as
English spelling; for another language the rules below are a rough guide only. Run it after tts.py (and before
join.py, which moves the cues of clips it joins).
"""
import json, re, sys, pathlib
if len(sys.argv) < 3 or sys.argv[1] in ('-h', '--help'):
    print(__doc__); sys.exit(0 if sys.argv[1:2] in (['-h'], ['--help']) else 2)
src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
cache = json.loads(src.with_suffix('.timings.json').read_text())
RULES = [('oo', 'F'), ('ou', 'F'), ('ow', 'F'), ('th', 'B'), ('ee', 'C'), ('ea', 'C'), ('ai', 'C'), ('ay', 'C'),
         ('m', 'A'), ('b', 'A'), ('p', 'A'), ('f', 'G'), ('v', 'G'), ('w', 'F'), ('u', 'F'), ('o', 'E'), ('a', 'D'),
         ('e', 'C'), ('i', 'C'), ('y', 'C'), ('l', 'H')]
def shapes(word):
    w, i, s = re.sub(r'[^a-z]', '', word.lower()), 0, []
    while i < len(w):
        for k, v in RULES:
            if w.startswith(k, i): s.append(v); i += len(k); break
        else: s.append('B'); i += 1
    out = [x for j, x in enumerate(s) if j == 0 or x != s[j - 1]]
    return out or ['B']
res = {}
for beat, e in cache.items():
    words, dur, cues = e['words'], e['dur'], []
    for j, (t, w) in enumerate(words):
        end = min(words[j + 1][0] if j + 1 < len(words) else dur - .1, t + .55)
        sh = shapes(w); step = (end - t) / len(sh)
        cues += [[round(t + k * step, 3), x] for k, x in enumerate(sh)]
        if j + 1 < len(words) and words[j + 1][0] - end > .12: cues.append([round(end, 3), 'X'])   # a pause closes the mouth
    cues.append([round(min(dur, (words[-1][0] + .55) if words else 0), 3), 'X'])
    res[beat] = cues
(out / 'mouths.js').write_text('window.MOUTHS = ' + json.dumps(res, separators=(',', ':')) + ';\n')
print(len(res), 'beats;', next(iter(res.items()), None))
