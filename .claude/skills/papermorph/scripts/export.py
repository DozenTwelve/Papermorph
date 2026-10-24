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
each holding its last picture for its `hold` seconds (1.5 by default) before the next beat plays as if the reader had acted. Captions are not burned in: upload OUT/chNN.srt with the video. Needs ffmpeg; serve the
site over HTTP first.
"""
import argparse, asyncio, functools, json, shutil, subprocess, sys, tempfile, wave
import numpy as np
from pathlib import Path
from playwright.async_api import async_playwright
from browsers import exe

END_SECONDS = 4
FLAT = '#frame { border-radius: 0 !important; box-shadow: none !important; }'   # square corners in the video

END_CARD = """(link) => {
  const d = document.createElement('div');
  d.id = 'exportEnd';
  d.style.cssText = 'position:absolute;left:0;top:0;width:'+SW+'px;height:'+SH+'px;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:26px;background:var(--board,#1d2b27);color:var(--chalk,#ece8dc);' +
    'font-family:inherit;text-align:center;z-index:50';
  d.innerHTML = `<div style="font-size:30px;opacity:.65;letter-spacing:.08em;text-transform:uppercase">${translate('chapterNumber', { n: CHAPTER.label ?? CHAPTER.number })}</div>
    <div style="font-size:64px;font-weight:600;max-width:${SW - 300}px">${CHAPTER.title}</div>
    <div style="font-size:34px;opacity:.85;margin-top:30px">${translate('checksInLesson')}</div>
    ${link ? `<div style="font-size:30px;opacity:.65">${link}</div>` : ''}`;
  document.getElementById('frame').append(d);
}"""


RATE = 44100


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
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe())
        base = f'{a.url}{a.chapter}/index.html'
        # The stage is 1600 x 900, or 900 x 1600 for a book with <html data-stage="portrait">.
        probe = await b.new_page()
        await probe.goto(base + f'?{QUERY}beat=0&t=0')
        sw, sh = await probe.evaluate('[SW, SH]')
        await probe.close()
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
        video = out / f'{a.chapter}.mp4'
        # Pass 1: the sound track and the captions, beat by beat at the beat's length on screen.
        end_s = END_SECONDS if asks or a.link else 0   # a picture book ends on its own last scene
        lengths, starts, counts, music_off, cues, offset = [], [], [], [], [], 0.0
        for i, bid in beats:
            await open_beat(pg, base, i)
            end, T = await pg.evaluate('[P.end, TIMINGS[BEATS[P.i].id]]')
            if info['beats'][i]['ask']: end += info['beats'][i]['hold']
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
            put(track, o + pre, decode(f'{a.url}{a.chapter}/audio/{info["lang"]}/{bid}.mp3'), 1, o + lengths[k])
            for e in info['sfx']:   # effects sit at half volume under the voices; a new scene stops them
                if e['beat'] == bid and 0 <= e['at'] < lengths[k]:
                    put(track, o + e['at'], decode(e['src']), .5 * e['vol'], o + lengths[k])
        # music: the engine's music player (soundTick), frame by frame: crossfades of the track's `fade` (0.8 s by default), ducked to 30 % in a
        # scene with voices; with MUSIC_UP_IN_PRE (true, or a list of beat ids) the music comes up to 70 % while a beat's
        # picture runs before its narration
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
                want = .7 if up and (up is True or bid in up) and t < beat_pre[bid] else .3
                duck += max(-1 / fps, min(1 / fps, want - duck))
                if current: pos = sum(beat_len.get(b, 0) for b in m['beats'][:m['beats'].index(bid)]) + t
                else: pos += 1 / fps
                gain[f], at[f] = v * m['gain'] * duck, round(pos * RATE) % len(song)
            step = RATE / fps
            for f in np.nonzero(gain)[0]:
                i = round(f * step); seg = np.take(song, np.arange(at[f], at[f] + round(step)), axis=0, mode='wrap')
                put(track, i / RATE, seg, gain[f])
        peak = float(np.abs(track).max())
        wav = audio_dir / 'track.wav'
        with wave.open(str(wav), 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes((np.clip(track, -1, 1) * 32767).astype('<i2').tobytes())
        # Pass 2: frames, piped into the encoder with the audio track.
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'mjpeg',
                                '-i', '-', '-i', str(wav), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
                                '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-shortest', str(video)],
                               stdin=subprocess.PIPE)
        frames = 0
        for k, (i, bid) in enumerate(beats):
            await open_beat(pg, base, i)
            n = counts[k]
            for f in range(n):
                await pg.evaluate('t => { P.t = t; evalTo(t); }', f / a.fps)
                enc.stdin.write(await pg.screenshot(clip=clip, type='jpeg', quality=92))
                frames += 1
            print(f'{bid}: {n} frames', flush=True)
        if end_s:
            await pg.evaluate(END_CARD, a.link or '')
            end = await pg.screenshot(clip=clip, type='jpeg', quality=92)
            for _ in range(end_s * a.fps):
                enc.stdin.write(end)
        enc.stdin.close(); enc.wait()
        shutil.rmtree(audio_dir, ignore_errors=True)
        await b.close()
    with open(out / f'{a.chapter}.srt', 'w', encoding='utf-8') as f:
        for k, (t0, t1, line) in enumerate(cues, 1):
            f.write(f'{k}\n{srt_time(t0)} --> {srt_time(t1)}\n{line}\n\n')
    if errs or enc.returncode:
        sys.exit(f'failed: {errs[:3]} encoder {enc.returncode}')
    print(f'{video} ({total / 60:.1f} min, {frames} frames, {len(beats)} beats{"; question beats left out" if asks else ""}; '
          f'sound peak {peak:.2f}{" (clipped)" if peak > 1 else ""}) and {a.chapter}.srt')


if __name__ == '__main__':
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('chapter', help='chapter folder under --url, e.g. ch12')
    ap.add_argument('--url', default='http://localhost:8765/', help='the book served over HTTP, ending in /')
    ap.add_argument('--out', default='export', help='output folder')
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--height', type=int, help='video height (default 1080 landscape, 1920 portrait)')
    ap.add_argument('--link', help='address of the interactive lesson, shown on the end card')
    ap.add_argument('--query', default='', help='extra page query, e.g. tags (the source and AI-illustration tags)')
    args = ap.parse_args()
    QUERY = args.query + '&' if args.query else ''
    asyncio.run(main(args))
