#!/usr/bin/env python3
"""Export a chapter (a lesson or a picture-book episode) as an MP4 video with an .srt caption file, for video sites.

    uv run --with playwright --with numpy export.py ch12 --url http://localhost:8765/<book>/ --out OUT
    ... --fps 30 --height 1080 --link https://example.org/<book>/ch12/

The engine draws every frame as a pure function of the beat time, so frames are rendered by seeking, not by
recording playback: the video is exact and the same on every run. The sound is mixed the way the page plays it:
each beat's clip from its `pre` on, and in a film (a picture book or a documentary) the sfx() effects (cut at the end
of their scene, as a scene change stops them) and the BGM tracks with their crossfades, ducking and MUSIC_OFF. Question beats (quick
checks and practice) are left out, and then the video ends on a card saying they are in the interactive lesson
(--link adds its address); in a film with interactive moments (CHAPTER.film, e.g. the reader fires a rifle) they stay in,
each holding its last picture for its `hold` seconds (1.5 by default, the music up at 70 % as the page plays it while
it waits) before the next beat plays as if the reader had acted. With --link and no question beats left out, the end
card shows the title and the link only. A mix that would clip is turned down as a whole (the run prints by how much).
Odd sizes (an upright --height 720 is 405 wide) are cut to even ones, as H.264 needs. The video is written to
OUT/chNN.tmp.mp4 and renamed when done, so a failed run leaves an earlier OUT/chNN.mp4 alone. Captions are not burned
in: upload OUT/chNN.srt with the video. Needs ffmpeg; serve the site over HTTP first.

An upright film (a short) goes out with its source and AI-illustration tags (the page's ?tags query), since a video
leaves the page that credits them; --no-tags leaves them out. A landscape chapter shows them only with --query tags.

Speed: frames are shot by --jobs browsers at once (default: half the CPU threads, at most 8), frame f by browser
f % jobs, and written in order. The browsers ask for the GPU (Chromium falls back to software where there is none),
and the video goes to the first hardware H.264 encoder that works on this machine (NVENC, Quick Sync, AMF,
VideoToolbox), else libx264; the run prints which.
"""
import argparse, asyncio, functools, json, os, shutil, subprocess, sys, tempfile, wave
import numpy as np
from pathlib import Path
from playwright.async_api import async_playwright
from browsers import exe

END_SECONDS = 4
FLAT = '#frame { border-radius: 0 !important; box-shadow: none !important; }'   # square corners in the video

END_CARD = """([link, asks]) => {
  const d = document.createElement('div');
  d.id = 'exportEnd';
  d.style.cssText = 'position:absolute;left:0;top:0;width:'+SW+'px;height:'+SH+'px;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:26px;background:var(--board,#1d2b27);color:var(--chalk,#ece8dc);' +
    'font-family:inherit;text-align:center;z-index:50';
  d.innerHTML = `<div style="font-size:30px;opacity:.65;letter-spacing:.08em;text-transform:uppercase">${translate('chapterNumber', { n: CHAPTER.label ?? CHAPTER.number })}</div>
    <div style="font-size:64px;font-weight:600;max-width:${SW - 300}px">${CHAPTER.title}</div>
    ${asks ? `<div style="font-size:34px;opacity:.85;margin-top:30px">${translate('checksInLesson')}</div>` : ''}
    ${link ? `<div style="font-size:30px;opacity:.65">${link}</div>` : ''}`;
  document.getElementById('frame').append(d);
}"""


RATE = 44100

# H.264 encoders, first that works wins; a listed hardware encoder can still fail (no such GPU), so each is tried
ENCODERS = [('h264_nvenc', ['-preset', 'p5', '-rc', 'vbr', '-cq', '20', '-b:v', '0']),
            ('h264_qsv', ['-global_quality', '20']),
            ('h264_amf', ['-rc', 'cqp', '-qp_i', '20', '-qp_p', '20']),
            ('h264_videotoolbox', ['-q:v', '65']),
            ('libx264', ['-crf', '20', '-preset', 'medium'])]


def encoder():
    for name, opts in ENCODERS:
        if subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=s=256x256:d=0.1', '-pix_fmt', 'yuv420p',
                           '-c:v', name] + opts + ['-f', 'null', '-'], capture_output=True).returncode == 0:
            return name, opts
    sys.exit('ffmpeg has no working H.264 encoder')


@functools.lru_cache(maxsize=None)
def decode(src):
    """Any audio file or URL as float32 stereo samples at RATE."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'f32le', '-ac', '2', '-ar', str(RATE), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


def put(track, at, clip, gain=1.0, stop=None):
    """Add clip into track from `at` seconds, cut at `stop` seconds."""
    i = round(at * RATE); j = min(len(track), i + len(clip), round(stop * RATE) if stop is not None else len(track))
    if j > i: track[i:j] += clip[:j - i] * gain


def srt_time(t):
    ms = round(t * 1000)
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


SFX_JS = "typeof SFX === 'undefined' ? [] : SFX.map(e => ({...e, src: new URL(`audio/sfx/${e.name}.mp3`, location.href).href}))"


QUERY = ''   # extra page query (--query), e.g. 'tags&'


async def open_beat(pg, base, i):
    await pg.goto(f'{base}?{QUERY}beat={i}&t=0')
    await pg.add_style_tag(content=FLAT)
    await pg.wait_for_timeout(300)


async def main(a):
    global QUERY
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        kw = exe(); kw['args'] = kw.get('args', []) + ['--enable-gpu']   # headless Chromium draws in software unless asked
        b = await p.chromium.launch(**kw)
        base = f'{a.url}{a.chapter}/index.html'
        # The stage is 1600 x 900, or 900 x 1600 for a book with <html data-stage="portrait">.
        probe = await b.new_page()
        await probe.goto(base + f'?{QUERY}beat=0&t=0')
        sw, sh = await probe.evaluate('[SW, SH]')
        await probe.close()
        if sh > sw and not a.no_tags and 'tags' not in QUERY.split('&'):
            QUERY = 'tags&' + QUERY; print('upright film: source and AI tags shown (--no-tags leaves them out)')
        scale = (a.height or 1080 * sh / min(sw, sh)) / sh
        # The page fits the stage plus its control strip at scale 1, rendered at the requested height.
        pg = await b.new_page(viewport={'width': sw + 40, 'height': sh + 100}, device_scale_factor=scale)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(base + f'?{QUERY}beat=0&t=0'); await pg.wait_for_timeout(500)
        if errs:
            sys.exit(f'page errors: {errs}')
        info = await pg.evaluate("""({lang: CHAPTER.language || 'en', film: !!CHAPTER.film,
          beats: BEATS.map(b => ({id: b.id, ask: !!b.ask, pre: b.pre || 0, hold: b.hold ?? 1.5})),
          bgm: typeof BGM === 'undefined' ? [] : BGM.map(m => ({src: m.a.src, beats: m.beats, gain: m.gain, fade: m.fade ?? .8})),
          upInPre: window.MUSIC_UP_IN_PRE || false})""")
        # a film's question beats (CHAPTER.film: the reader acts, e.g. fires) stay in the video: their picture holds `hold` s
        # (BEATS[i].hold, 1.5 by default) where the page waits for the reader, then the next beat plays as if they had acted
        beats = [(i, x['id']) for i, x in enumerate(info['beats']) if not x['ask'] or info['film']]
        info['sfx'] = []
        asks = len(beats) < len(info['beats'])
        box = await pg.locator('#stage').bounding_box()
        clip = {k: box[k] for k in ('x', 'y', 'width', 'height')}
        audio_dir = Path(tempfile.mkdtemp(prefix='export-'))
        video, part = out / f'{a.chapter}.mp4', out / f'{a.chapter}.tmp.mp4'   # renamed to video when the encoder is done
        # Pass 1: the sound track and the captions, beat by beat at the beat's length on screen.
        end_s = END_SECONDS if asks or a.link else 0   # a picture book ends on its own last scene
        lengths, starts, counts, music_off, cues, offset, waits, silent = [], [], [], [], [], 0.0, {}, set()
        for i, bid in beats:
            await open_beat(pg, base, i)
            end, T = await pg.evaluate('[P.end, TIMINGS[BEATS[P.i].id]]')
            if T.get('silent'): silent.add(bid)   # { dur } in the beat's fourth slot: no clip, its sound is silence
            if info['beats'][i]['ask']: waits[bid] = end; end += info['beats'][i]['hold']   # from P.end the page waits
            # a scene lists its sfx() when its beat is built, so they are collected beat by beat
            for e in await pg.evaluate(SFX_JS):
                if e not in info['sfx']:
                    info['sfx'].append(e)
            pre = info['beats'][i]['pre']
            # frames counted on the running clock, so rounding never drifts the picture away from the sound
            count = round((offset + end) * a.fps) - round(offset * a.fps)
            lengths.append(end); starts.append(offset); counts.append(count)
            music_off.append(await pg.evaluate('([id, n, fps]) => Array.from({length: n}, (_, f) => !!window.MUSIC_OFF?.[id]?.(f / fps))',
                                               [bid, count, a.fps]))
            for k, c in enumerate(T['cues']):   # [t, text, end?]: the page shows it at pre + t
                stop = c[2] if len(c) > 2 else T['cues'][k + 1][0] if k + 1 < len(T['cues']) else T['dur']
                cues.append((offset + pre + c[0], offset + pre + stop, c[1]))
            offset += end
        total = offset + end_s
        track = np.zeros((round(total * RATE) + 1, 2), np.float32)
        for k, (i, bid) in enumerate(beats):
            o, pre = starts[k], info['beats'][i]['pre']
            if bid not in silent: put(track, o + pre, decode(f'{a.url}{a.chapter}/audio/{info["lang"]}/{bid}.mp3'), 1, o + lengths[k])
            for e in info['sfx']:   # effects sit at half volume under the voices; a new scene stops them
                if e['beat'] == bid and 0 <= e['at'] < lengths[k]:
                    put(track, o + e['at'], decode(e['src']), .5 * e['vol'], o + lengths[k])
        # music: the engine's music player (soundTick), frame by frame: crossfades of the track's `fade` (0.8 s by default), ducked to 30 % in a
        # scene with voices; with MUSIC_UP_IN_PRE (true, or a list of beat ids) the music comes up to 70 % while a beat's
        # picture runs before its narration, and in a film while the page waits for the reader (the hold)
        fps, n = a.fps, sum(len(m) for m in music_off)
        frames_id = [bid for k, (_, bid) in enumerate(beats) for _ in music_off[k]]
        frames_t = [f / fps for m in music_off for f in range(len(m))]
        frames_off = [x for m in music_off for x in m]
        beat_len = {bid: lengths[k] for k, (_, bid) in enumerate(beats)}
        beat_pre = {x['id']: x['pre'] for x in info['beats']}
        for m in info['bgm']:
            song, v, duck, pos = decode(m['src']), 0.0, .3, 0.0
            gain = np.zeros(n); at = np.zeros(n, int)
            for f in range(n):
                bid, t = frames_id[f], frames_t[f]
                current = bid in m['beats'] and not frames_off[f]
                v = max(0.0, min(1.0, v + (1 if current else -1) / fps / m['fade'])) if m['fade'] > 0 else float(current)   # 0: a cut
                up = info['upInPre']
                want = .7 if (up and (up is True or bid in up) and t < beat_pre[bid]) or t >= waits.get(bid, 1e9) else .3
                duck += max(-1 / fps, min(1 / fps, want - duck))
                if current: pos = sum(beat_len.get(b, 0) for b in m['beats'][:m['beats'].index(bid)]) + t
                else: pos += 1 / fps
                gain[f], at[f] = v * m['gain'] * duck, round(pos * RATE) % len(song)
            step = RATE / fps
            for f in np.nonzero(gain)[0]:
                i = round(f * step); seg = np.take(song, np.arange(at[f], at[f] + round(step)), axis=0, mode='wrap')
                put(track, i / RATE, seg, gain[f])
        peak = float(np.abs(track).max())
        if peak > 1: track *= .98 / peak   # a mix that would clip, turned down as a whole
        wav = audio_dir / 'track.wav'
        with wave.open(str(wav), 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes((np.clip(track, -1, 1) * 32767).astype('<i2').tobytes())
        # Pass 2: frames, shot by --jobs browsers at once and piped in order into the encoder with the audio track.
        codec, opts = encoder()
        print(f'encoder {codec}, {a.jobs} browsers', flush=True)
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'mjpeg',
                                '-i', '-', '-i', str(wav), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',   # H.264 wants even sizes
                                '-c:v', codec, '-pix_fmt', 'yuv420p'] + opts +
                               ['-c:a', 'aac', '-b:a', '160k', '-shortest', str(part)],
                               stdin=subprocess.PIPE)
        pages, more = [pg], []
        for _ in range(a.jobs - 1):
            more.append(await p.chromium.launch(**kw))
            w = await more[-1].new_page(viewport={'width': sw + 40, 'height': sh + 100}, device_scale_factor=scale)
            w.on('pageerror', lambda e: errs.append(str(e)))
            pages.append(w)
        opened, last = {}, {}

        async def shoot(w, i, f):
            if opened.get(w) != i:
                await open_beat(w, base, i); opened[w], last[w] = i, -1
            # evalTo only runs forward and a tween takes its start value when first reached, so overlapping tweens
            # depend on the frames before: each browser steps every frame since its last shot, as one browser would
            await w.evaluate('ts => { for (const t of ts) { P.t = t; evalTo(t); } }',
                             [g / a.fps for g in range(last[w] + 1, f + 1)])
            last[w] = f
            return await w.screenshot(clip=clip, type='jpeg', quality=92)

        jobs = [(k, i, f) for k, (i, _) in enumerate(beats) for f in range(counts[k])]
        frames, done = 0, 0
        try:
            for s in range(0, len(jobs), a.jobs):
                batch = jobs[s:s + a.jobs]
                for img in await asyncio.gather(*(shoot(pages[j], i, f) for j, (_, i, f) in enumerate(batch))):
                    enc.stdin.write(img)
                frames += len(batch)
                while done < len(beats) and frames >= sum(counts[:done + 1]):
                    print(f'{beats[done][1]}: {counts[done]} frames', flush=True); done += 1
            if end_s:
                await pg.evaluate(END_CARD, [a.link or '', asks])
                end = await pg.screenshot(clip=clip, type='jpeg', quality=92)
                for _ in range(end_s * a.fps):
                    enc.stdin.write(end)
            enc.stdin.close()
        except BrokenPipeError:   # the encoder stopped: its error is printed above
            pass
        enc.wait()
        shutil.rmtree(audio_dir, ignore_errors=True)
        for x in [b] + more:
            await x.close()
    with open(out / f'{a.chapter}.srt', 'w', encoding='utf-8') as f:
        for k, (t0, t1, line) in enumerate(cues, 1):
            f.write(f'{k}\n{srt_time(t0)} --> {srt_time(t1)}\n{line}\n\n')
    if errs or enc.returncode:
        part.unlink(missing_ok=True)
        sys.exit(f'failed: {errs[:3]} encoder {enc.returncode}')
    part.replace(video)
    print(f'{video} ({total / 60:.1f} min, {frames} frames, {len(beats)} beats{"; question beats left out" if asks else ""}; '
          f'sound peak {peak:.2f}{f" turned down to 0.98 (x{.98 / peak:.2f}) so as not to clip" if peak > 1 else ""}) and {a.chapter}.srt')


if __name__ == '__main__':
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('chapter', help='chapter folder under --url, e.g. ch12')
    ap.add_argument('--url', default='http://localhost:8765/', help='the book served over HTTP, ending in /')
    ap.add_argument('--out', default='export', help='output folder')
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--jobs', type=int, default=max(1, min(8, (os.cpu_count() or 2) // 2)),
                    help='browsers shooting frames at once (default: half the CPU threads, at most 8)')
    ap.add_argument('--height', type=int, help='video height (default 1080 landscape, 1920 portrait)')
    ap.add_argument('--link', help='address of the interactive lesson, shown on the end card')
    ap.add_argument('--query', default='', help='extra page query, e.g. tags (the source and AI-illustration tags)')
    ap.add_argument('--no-tags', action='store_true', help="an upright film without its source and AI tags (shown by default)")
    args = ap.parse_args()
    QUERY = args.query + '&' if args.query else ''
    args.url = args.url.rstrip('/') + '/'
    asyncio.run(main(args))
