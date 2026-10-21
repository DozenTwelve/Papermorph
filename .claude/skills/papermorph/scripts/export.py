#!/usr/bin/env python3
"""Export a chapter's lesson as an MP4 video with an .srt caption file, for video sites.

    uv run --with playwright export.py ch12 --url http://localhost:8765/<book>/ --out OUT
    ... --fps 30 --height 1080 --link https://example.org/<book>/ch12/

The engine draws every frame as a pure function of the beat time, so frames are rendered by seeking, not by
recording playback: the video is exact and the same on every run. Question beats (quick checks and practice) are
left out; the video ends on a card saying they are in the interactive lesson (--link adds its address).
Captions are not burned in: upload OUT/chNN.srt with the video. Needs ffmpeg; serve the site over HTTP first.
"""
import argparse, asyncio, json, subprocess, sys, tempfile
from pathlib import Path
from playwright.async_api import async_playwright
from browsers import exe

END_SECONDS = 4
FLAT = '#frame { border-radius: 0 !important; box-shadow: none !important; }'   # square corners in the video

END_CARD = """(link) => {
  const d = document.createElement('div');
  d.id = 'exportEnd';
  d.style.cssText = 'position:absolute;left:0;top:0;width:1600px;height:900px;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:26px;background:var(--board,#1d2b27);color:var(--chalk,#ece8dc);' +
    'font-family:inherit;text-align:center;z-index:50';
  d.innerHTML = `<div style="font-size:30px;opacity:.65;letter-spacing:.08em;text-transform:uppercase">Chapter ${CHAPTER.number}</div>
    <div style="font-size:64px;font-weight:600;max-width:1300px">${CHAPTER.title}</div>
    <div style="font-size:34px;opacity:.85;margin-top:30px">Quick checks and practice are in the interactive lesson.</div>
    ${link ? `<div style="font-size:30px;opacity:.65">${link}</div>` : ''}`;
  document.getElementById('frame').append(d);
}"""


def srt_time(t):
    ms = round(t * 1000)
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


async def open_beat(pg, base, i):
    await pg.goto(f'{base}?beat={i}&t=0')
    await pg.add_style_tag(content=FLAT)
    await pg.wait_for_timeout(300)


async def main(a):
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    scale = a.height / 900
    async with async_playwright() as p:
        b = await p.chromium.launch(**exe())
        # The page fits a 1640 x 1000 frame at scale 1: the 1600 x 900 stage, rendered at the requested height.
        pg = await b.new_page(viewport={'width': 1640, 'height': 1000}, device_scale_factor=scale)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        base = f'{a.url}{a.chapter}/index.html'
        await pg.goto(base + '?beat=0&t=0'); await pg.wait_for_timeout(500)
        if errs:
            sys.exit(f'page errors: {errs}')
        info = await pg.evaluate("({lang: CHAPTER.language || 'en', beats: BEATS.map(b => ({id: b.id, ask: !!b.ask}))})")
        beats = [(i, x['id']) for i, x in enumerate(info['beats']) if not x['ask']]
        box = await pg.locator('#stage').bounding_box()
        clip = {k: box[k] for k in ('x', 'y', 'width', 'height')}
        audio_dir = Path(tempfile.mkdtemp(prefix='export-'))
        video = out / f'{a.chapter}.mp4'
        # Pass 1: the audio track, each beat's clip padded to the beat's length on screen.
        lengths, cues, offset = [], [], 0.0
        for i, bid in beats:
            await open_beat(pg, base, i)
            end, T = await pg.evaluate('[P.end, TIMINGS[BEATS[P.i].id]]')
            lengths.append(end)
            for k, (t, line) in enumerate(T['cues']):
                stop = T['cues'][k + 1][0] if k + 1 < len(T['cues']) else T['dur']
                cues.append((offset + t, offset + stop, line))
            offset += end
        total = offset + END_SECONDS
        site_audio = [f'{a.url}{a.chapter}/audio/{info["lang"]}/{bid}.mp3' for _, bid in beats]
        inputs, chains = [], []
        for k, src in enumerate(site_audio):
            inputs += ['-i', src]
            chains.append(f'[{k}:a]aformat=sample_rates=44100:channel_layouts=stereo,apad=whole_dur={lengths[k]:.3f},'
                          f'atrim=0:{lengths[k]:.3f}[a{k}]')
        mix = ''.join(f'[a{k}]' for k in range(len(beats))) + f'concat=n={len(beats)}:v=0:a=1,apad=whole_dur={total:.3f}[out]'
        wav = audio_dir / 'track.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(chains) + ';' + mix,
                        '-map', '[out]', str(wav)], check=True)
        # Pass 2: frames, piped into the encoder with the audio track.
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'mjpeg',
                                '-i', '-', '-i', str(wav), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
                                '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-shortest', str(video)],
                               stdin=subprocess.PIPE)
        frames = 0
        for k, (i, bid) in enumerate(beats):
            await open_beat(pg, base, i)
            n = round(lengths[k] * a.fps)
            for f in range(n):
                await pg.evaluate('t => { P.t = t; evalTo(t); }', f / a.fps)
                enc.stdin.write(await pg.screenshot(clip=clip, type='jpeg', quality=92))
                frames += 1
            print(f'{bid}: {n} frames', flush=True)
        await pg.evaluate(END_CARD, a.link or '')
        end = await pg.screenshot(clip=clip, type='jpeg', quality=92)
        for _ in range(END_SECONDS * a.fps):
            enc.stdin.write(end)
        enc.stdin.close(); enc.wait()
        await b.close()
    with open(out / f'{a.chapter}.srt', 'w', encoding='utf-8') as f:
        for k, (t0, t1, line) in enumerate(cues, 1):
            f.write(f'{k}\n{srt_time(t0)} --> {srt_time(t1)}\n{line}\n\n')
    if errs or enc.returncode:
        sys.exit(f'failed: {errs[:3]} encoder {enc.returncode}')
    print(f'{video} ({total / 60:.1f} min, {frames} frames, {len(beats)} beats; question beats left out) and {a.chapter}.srt')


if __name__ == '__main__':
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('chapter', help='chapter folder under --url, e.g. ch12')
    ap.add_argument('--url', default='http://localhost:8765/', help='the book served over HTTP, ending in /')
    ap.add_argument('--out', default='export', help='output folder')
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--height', type=int, default=1080, help='video height; width is 16:9')
    ap.add_argument('--link', help='address of the interactive lesson, shown on the end card')
    asyncio.run(main(ap.parse_args()))
