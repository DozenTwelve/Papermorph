#!/usr/bin/env python3
"""Join several narration clips into one clip per scene, so a whole scene plays as one beat.

    python3 join.py site/<book>/chNN/audio/en scene1=s01,s02,s02b scene2=s03,s04@2.1+1.5,s05

Each argument is SCENE=CLIP,CLIP,...; a clip may be CLIP@T+S@T+S: S seconds of silence inserted T seconds into it
(room for an action in the middle of a line). A short pause (0.35 s) goes between clips. Writes AUDIO_DIR/SCENE.mp3 and
AUDIO_DIR/shots.js: TIMINGS.SCENE = {dur, marks, cues, parts} with each clip's start in `parts` (marks become
"clip.mark") and the caption cues moved along; the mouth cues of clips with holes are moved too (MOUTHS.clip). Load
shots.js after timings.js and mouths.js. Run after tts.py and mouths.py; needs ffmpeg.
"""
import json, subprocess, sys, pathlib, tempfile
if len(sys.argv) < 3 or sys.argv[1] in ('-h', '--help'):
    print(__doc__); sys.exit(0 if sys.argv[1:2] in (['-h'], ['--help']) else 2)
GAP = .35
d = pathlib.Path(sys.argv[1]); T = json.loads((d / 'timings.js').read_text().split('=', 1)[1].rstrip().rstrip(';'))
out, H = {}, {}   # H: every shot's holes, for the mouths
for arg in sys.argv[2:]:
    shot, beats = arg.split('='); beats = beats.split(',')
    holes = {}   # beat -> [(at, seconds)]: silences inserted inside a clip, room for action
    for i, b in enumerate(beats):
        name, *ins = b.split('@'); beats[i] = name
        holes[name] = [tuple(map(float, x.split('+'))) for x in ins]
    with tempfile.TemporaryDirectory() as tmp:
        def piece(b):   # the clip's file, cut at its holes with silence between
            if not holes[b]: return [str((d / f'{b}.mp3').resolve())]
            out, start = [], 0
            for k, (at, sec) in enumerate(holes[b] + [(None, 0)]):
                seg = pathlib.Path(tmp) / f'{b}-{k}.mp3'
                cmd = ['ffmpeg', '-v', 'error', '-y', '-i', str(d / f'{b}.mp3'), '-ss', str(start)] + (['-to', str(at)] if at is not None else []) + ['-c:a', 'libmp3lame', '-b:a', '64k', str(seg)]
                subprocess.run(cmd, check=True); out.append(str(seg))
                if at is not None:
                    sil = pathlib.Path(tmp) / f'{b}-s{k}.mp3'
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', str(sec), '-b:a', '64k', str(sil)], check=True); out.append(str(sil)); start = at
            return out
        shift = lambda b, t: t + sum(sec for at, sec in holes[b] if t >= at)
        gap = pathlib.Path(tmp) / 'gap.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', str(GAP), '-b:a', '64k', str(gap)], check=True)
        lst = pathlib.Path(tmp) / 'list.txt'
        lst.write_text(''.join(''.join(f"file '{f}'\n" for f in piece(b)) + (f"file '{gap}'\n" if i < len(beats) - 1 else '') for i, b in enumerate(beats)))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c:a', 'libmp3lame', '-b:a', '64k', str(d / f'{shot}.mp3')], check=True)
    parts, cues, marks, at = {}, [], {}, 0
    for b in beats:
        parts[b] = round(at, 3)
        cues += [[round(shift(b, t) + at, 3), c] for t, c in T[b]['cues']]
        marks.update({f'{b}.{k}': round(shift(b, v) + at, 3) for k, v in T[b]['marks'].items()})
        at += T[b]['dur'] + sum(sec for _, sec in holes[b]) + GAP
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(d / f'{shot}.mp3')], capture_output=True, text=True).stdout)
    H.update(holes)
    out[shot] = {'dur': round(dur, 3), 'marks': marks, 'cues': cues, 'parts': parts}
# a clip with holes gets its mouth cues moved the same way (and shut at each hole), after mouths.js in the page
mp = d / 'mouths.js'; M = json.loads(mp.read_text().split('=', 1)[1].rstrip().rstrip(';')) if mp.exists() else {}
sh = lambda b, t: t + sum(sec for at, sec in H[b] if t >= at)
moved = {b: sorted([[round(sh(b, t), 3), k] for t, k in M[b]] + [[round(sh(b, at - 1e-3), 3), 'X'] for at, _ in H[b]])
         for b in H if H[b] and b in M}
(d / 'shots.js').write_text(''.join(f'TIMINGS.{k} = {json.dumps(v)};\n' for k, v in out.items()) + ''.join(f'MOUTHS.{b} = {json.dumps(v)};\n' for b, v in moved.items()))
print({k: (v['dur'], v['parts']) for k, v in out.items()})
