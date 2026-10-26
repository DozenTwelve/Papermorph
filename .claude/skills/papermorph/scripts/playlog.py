#!/usr/bin/env python3
"""Play a chapter headless in real time and log every sound start and caption line with its beat time, plus a frame
at each: checking sound against picture without ears.

    uv run --with playwright --with pillow playlog.py ch01 --out OUT --url http://localhost:8765/<book>/
    ... --rate 1.5          play faster (effects and voices follow the speed; beat times stay the same)
    ... --from scene3       start at that beat (index from 0 or id) instead of the beginning
    ... --to scene3         stop when that beat ends instead of at the end (--from scene3 --to scene3: one scene)

Prints and writes OUT/chNN_playlog.txt, one event a line, and OUT/chNN_playlog.jpg, the stage at each event's beat
time with its label (four a row):

    scene1     0.60  voice  en/scene1.mp3
    scene1     1.12  line   Every afternoon, the old man plays chess in the park.
    scene1     8.41  sfx    clack   vol 0.50

voice/sfx/bgm: an audio file started playing (its folder under audio/ names the kind; vol is the element's volume
when it started, the slider at 1). line: the caption changed (captions are switched on for the run). An effect
listed twice at one moment plays twice. Look at each frame: is the clack on the frame where the piece lands, the
slurp where the cup is at the mouth, the line where that character's mouth moves? Effects fire only in normal
playback, never on a seek, which is why this plays the chapter instead of seeking it. Chromium; if it cannot play
sound, the engine runs on wall time and the log says so (times are then still beat times).
"""
import argparse, asyncio, io, sys
from pathlib import Path
from playwright.async_api import async_playwright
from browsers import exe
from PIL import Image, ImageDraw

HOOK = r"""
window.__log = [];
try { localStorage.setItem('captions', '1'); } catch {}
const play0 = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function () {
  try {
    if (this.paused && !this.muted && typeof P !== 'undefined' && P.playing) {   // a real start (not a resume of a playing clip, not the silent unlock)
      const src = decodeURI(new URL(this.currentSrc || this.src, location.href).pathname).replace(/^.*?\/audio\//, '');
      __log.push({ kind: /^sfx\//.test(src) ? 'sfx' : /^bgm\//.test(src) ? 'bgm' : 'voice', what: src.replace(/^(sfx|bgm)\//, '').replace(/\.mp3$/, ''),
                   i: P.i, t: P.t, vol: this.volume });
    }
  } catch {}
  return play0.apply(this, arguments);
};
// the engine's effects play through Web Audio, not an element
const start0 = AudioBufferSourceNode.prototype.start;
AudioBufferSourceNode.prototype.start = function () {
  try { if (this._sfx && P.playing) __log.push({ kind: 'sfx', what: this._sfx, i: P.i, t: P.t, vol: this._vol }); } catch {}
  return start0.apply(this, arguments);
};
addEventListener('DOMContentLoaded', () => {
  const c = document.getElementById('caption'); if (!c) return;
  let last = '';
  new MutationObserver(() => { const s = c.hidden ? '' : c.textContent.trim();
    if (s && s !== last && P.playing) __log.push({ kind: 'line', what: s, i: P.i, t: P.t }); last = s; })
    .observe(c, { childList: true, characterData: true, subtree: true, attributes: true });
});
"""


async def main(a):
    a.out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        x = exe(); x["args"] = list({*x.get("args", []), "--autoplay-policy=no-user-gesture-required"})
        b = await p.chromium.launch(**x)
        pg = await b.new_page(viewport={"width": 1600, "height": 960}, reduced_motion="reduce")
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.add_init_script(HOOK)
        url = f"{a.url}{a.chapter}/index.html"
        await pg.goto(url); await pg.wait_for_timeout(1000)
        ids = await pg.evaluate("BEATS.map(b => b.id)")
        cw, ch = 400, round(400 * await pg.evaluate("SH / SW"))   # a frame 400 wide, in the stage's shape (upright too)
        def beat(s):
            if s.isdigit() and int(s) < len(ids): return int(s)
            if s in ids: return ids.index(s)
            sys.exit(f"no beat {s!r}: give an index from 0 to {len(ids) - 1} or one of {', '.join(ids)}")
        first, last = beat(a.start), beat(a.end) if a.end else len(ids) - 1
        if last < first: sys.exit(f"--to {a.end} comes before --from {a.start}")
        total = await pg.evaluate(f"BEATS.slice({first}, {last + 1}).reduce((s, b) => s + (b.pre || 0) + TIMINGS[b.id].dur + 1, 0)")
        if first: await pg.goto(f"{url}?beat={first}&t=0"); await pg.wait_for_timeout(1000)
        await pg.keyboard.press("Space"); await pg.wait_for_timeout(200)   # a real key press: the browser lets it start sound
        if a.rate != 1: await pg.evaluate(f"typeof setSpeed === 'function' ? setSpeed({a.rate}) : (P.rate = {a.rate})")
        print(f"playing {a.chapter} from {ids[first]} to {ids[last]}, about {total / a.rate:.0f} s", flush=True)
        waited, stop = 0, f"P.done || P.waiting || P.i > {last}"
        while not await pg.evaluate(stop) and waited < total / a.rate + 30:
            await pg.wait_for_timeout(250); waited += .25
        log, afail = await pg.evaluate(f"[__log.filter(e => e.i <= {last}), P.afail]")
        if not await pg.evaluate(f"P.done || P.i > {last}"): print(f"did not reach the end of {ids[last]} (a question waits, or it stalled)")
        # the frames: each beat rebuilt once and its clock run forward, as playback reaches it
        shots = []
        await pg.add_style_tag(content=".paused-mark { display: none !important; }")   # the frames are taken paused
        for e in sorted(log, key=lambda e: (e["i"], e["t"])):
            if not shots or shots[-1][0]["i"] != e["i"]:
                await pg.evaluate(f"seek({e['i']}, false)")
            await pg.evaluate(f"P.t = {e['t']}; evalTo({e['t']})"); await pg.wait_for_timeout(120)
            r = await pg.evaluate("(() => { const r = document.getElementById('stage').getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; })()")
            shots.append((e, Image.open(io.BytesIO(await pg.screenshot(clip=r))).convert("RGB").resize((cw, ch))))
        await b.close()
    lines = [f"{ids[e['i']]:10} {e['t']:6.2f}  {e['kind']:5}  {e['what']}" + (f"   vol {e['vol']:.2f}" if e['kind'] == 'sfx' else '') for e, _ in shots]
    if afail: lines.append("note: sound did not play in this browser; the clock ran on wall time")
    (a.out / f"{a.chapter}_playlog.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    if shots:
        S = Image.new("RGB", (4 * cw, ch * ((len(shots) + 3) // 4)), (20, 30, 27))
        for k, (e, im) in enumerate(shots):
            d = ImageDraw.Draw(im); label = f"{ids[e['i']]} {e['t']:.2f} {e['kind']} {e['what'][:40]}"
            d.rectangle((0, 0, 7 * len(label) + 8, 16), fill=(0, 0, 0)); d.text((4, 3), label, fill=(255, 230, 120))
            S.paste(im, ((k % 4) * cw, (k // 4) * ch))
        S.save(a.out / f"{a.chapter}_playlog.jpg", quality=84)
    print(f"{len(shots)} events | log and frames in {a.out}" + (f" | PAGE ERRORS: {errs[:5]}" if errs else ""))
    return 1 if errs else 0


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chapter", help="chapter folder under --url, e.g. ch01")
    ap.add_argument("--out", type=Path, required=True, help="folder for the log and the frames")
    ap.add_argument("--url", default="http://localhost:8765/")
    ap.add_argument("--rate", type=float, default=1, help="playback speed (the player offers .75, 1, 1.25, 1.5)")
    ap.add_argument("--from", dest="start", default="0", help="first beat, index from 0 or id")
    ap.add_argument("--to", dest="end", help="last beat, index from 0 or id (default: the last)")
    a = ap.parse_args()
    a.url = a.url if a.url.endswith("/") else a.url + "/"
    sys.exit(asyncio.run(main(a)))
