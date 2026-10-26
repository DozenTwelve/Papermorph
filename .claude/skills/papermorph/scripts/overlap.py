#!/usr/bin/env python3
"""Arrow/text overlap finder: samples every lesson beat and reports where an arrow runs through text, or text sits on text.

    uv run --with playwright overlap.py ch09 ch10 [--url http://localhost:8765/<book>/] [--step 0.25] [--json OUT.json] [--beat ID]

An arrow is any path whose last subpath is a three-point head ending where the shaft ends (e.g. `M x y L x2 y2 M … L x2 y2 L …`).
Points every 3 px along each visible arrow (shaft and head, widened by half the stroke) are tested against the ink
box of each visible text (getBBox trimmed to the glyph band, tested in the text's own, possibly rotated, frame).
Text pairs count when their ink boxes overlap by more than 4 px on every axis. Hits are merged into time ranges per
beat and element pair; look at those frames with strip.py. Runs in Firefox.
A lesson tool: picture-book scenes have no SVG text or arrows (captions are HTML, signs are painted), so a
picture-book chapter (paper.js loaded) is skipped with a note.
"""
import argparse, asyncio, json, sys
from playwright.async_api import async_playwright

MEASURE = r"""
([i, step]) => {
  seek(i, false);
  const stage = document.getElementById('stage'), inv = stage.getScreenCTM().inverse();
  const vis = el => {   // effective opacity, 0 if hidden
    let o = 1;
    for (let e = el; e && e !== stage; e = e.parentNode) {
      if (e.style && (e.style.display === 'none' || e.style.visibility === 'hidden' || e.style.opacity === '0')) return 0;
      const a = e.getAttribute && e.getAttribute('opacity'); if (a !== null && a !== undefined) o *= +a;
      if (o < .15) return 0;
    }
    return o;
  };
  const isArrow = d => {
    const sub = d.trim().split(/(?=M)/); if (sub.length < 2) return false;
    const head = sub[sub.length - 1].match(/-?\d*\.?\d+(?:e-?\d+)?/g), body = sub[sub.length - 2].match(/-?\d*\.?\d+(?:e-?\d+)?/g);
    if (!head || head.length !== 6 || !body) return false;
    // body end: last coordinate pair, or for 'H x' the x with the M's y
    const hv = sub[sub.length - 2].includes('H');
    const ex = +body[body.length - (hv ? 1 : 2)], ey = hv ? +body[1] : +body[body.length - 1];
    return Math.abs(+head[2] - ex) < .5 && Math.abs(+head[3] - ey) < .5;
  };
  const toStage = (el) => { const m = inv.multiply(el.getScreenCTM()); return (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
  const dur = P.end, out = [];
  for (let t = 0; t <= dur + 1e-6; t += step) {
    P.t = t; evalTo(t);
    const texts = [], arrows = [];
    for (const el of scene.querySelectorAll('text')) {
      const s = el.textContent.trim(); if (!s || !vis(el)) continue;
      const b = el.getBBox(); if (!b.width) continue;
      const f = toStage(el), size = parseFloat(el.getAttribute('font-size')) || 30;
      // ink band: text sits on its local baseline y = 0 (positions are transforms); caps reach ~0.72 em above it and
      // descenders ~0.15 em below. The bbox (full em box) is taller than the ink.
      const top = -.72 * size, bot = .15 * size;
      const m = inv.multiply(el.getScreenCTM()), sc = Math.hypot(m.a, m.b);
      const q = [[b.x + 1, top], [b.x + b.width - 1, top], [b.x + b.width - 1, bot], [b.x + 1, bot]].map(([x, y]) => f(x, y));
      const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
      if (Math.max(...xs) < 0 || Math.min(...xs) > SW || Math.max(...ys) < 0 || Math.min(...ys) > SH) continue;   // off the stage (upright too)
      // q: the ink box corners on stage (rotated text stays a rotated box); mi maps stage points back to text space
      texts.push({ s, q, mi: m.inverse(), x0: b.x + 1, x1: b.x + b.width - 1, top, bot, sc });
    }
    let k = 0;
    for (const el of scene.querySelectorAll('path')) {
      const d = el.getAttribute('d'); if (!d || !isArrow(d)) continue;
      const id = k++;
      if (!vis(el) || el.style.visibility === 'hidden') continue;
      const L = el.getTotalLength(); if (L < 4) continue;
      const f = toStage(el), m = inv.multiply(el.getScreenCTM()), sc = Math.hypot(m.a, m.b);
      const hw = (parseFloat(el.getAttribute('stroke-width')) || 4) * sc / 2;
      const col = el.getAttribute('stroke'), pts = [];
      for (let u = 0; u <= L; u += 3) { const p = el.getPointAtLength(u); pts.push(f(p.x, p.y)); }
      arrows.push({ id: `${col}#${id}`, pts, hw });
    }
    for (const a of arrows) for (const r of texts) {
      const g = a.hw / r.sc;   // half the stroke, in text units
      if (a.pts.some(([x, y]) => { const u = r.mi.a * x + r.mi.c * y + r.mi.e, v = r.mi.b * x + r.mi.d * y + r.mi.f;
        return u > r.x0 - g && u < r.x1 + g && v > r.top - g && v < r.bot + g; }))
        out.push([+t.toFixed(2), 'arrow', a.id, r.s]);
    }
    // text pairs: separating-axis test on the two ink boxes, needing 4 px of overlap on every axis
    const proj = (q, ax) => { const d = q.map(([x, y]) => x * ax[0] + y * ax[1]); return [Math.min(...d), Math.max(...d)]; };
    const axes = q => [0, 1].map(i => { const dx = q[i + 1][0] - q[i][0], dy = q[i + 1][1] - q[i][1], n = Math.hypot(dx, dy) || 1; return [dx / n, dy / n]; });
    for (let p = 0; p < texts.length; p++) for (let q = p + 1; q < texts.length; q++) {
      const A = texts[p], B = texts[q];
      if ([...axes(A.q), ...axes(B.q)].every(ax => { const [a0, a1] = proj(A.q, ax), [b0, b1] = proj(B.q, ax); return Math.min(a1, b1) - Math.max(a0, b0) > 4; }))
        out.push([+t.toFixed(2), 'text', A.s, B.s]);
    }
  }
  return out;
}
"""

async def run(pg, base, ch, step, only):
    await pg.goto(f"{base}{ch}/?beat=0&t=0"); await pg.wait_for_timeout(800)
    if await pg.evaluate("typeof jit === 'function'"): return None
    beats = await pg.evaluate("BEATS.map(b => [b.id, !!b.ask])")
    res = {"": len([1 for bid, ask in beats if not ask and (not only or bid in only)])}   # beats sampled
    for i, (bid, ask) in enumerate(beats):
        if ask or (only and bid not in only): continue
        hits = await pg.evaluate(MEASURE, [i, step])
        groups = {}
        for t, kind, a, b in hits: groups.setdefault((kind, a, b), []).append(t)
        rows = []
        for (kind, a, b), ts in groups.items():   # merge into ranges
            rng, s0, prev = [], ts[0], ts[0]
            for t in ts[1:]:
                if t - prev > step * 1.5: rng.append((s0, prev)); s0 = t
                prev = t
            rng.append((s0, prev))
            rows.append({"kind": kind, "a": a, "b": b, "ranges": rng, "n": len(ts)})
        if rows: res[bid] = rows
    return res

async def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chapters", nargs="+"); ap.add_argument("--url", default="http://localhost:8765/")
    ap.add_argument("--step", type=float, default=.25); ap.add_argument("--json"); ap.add_argument("--beat", action="append", default=[])
    o = ap.parse_args()
    args, step, jout, only, base = o.chapters, o.step, o.json, set(o.beat), o.url.rstrip("/") + "/"
    async with async_playwright() as p:
        b = await p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0})
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        allres = {}
        for ch in args:
            res = await run(pg, base, ch, step, only)
            if res is None:
                print(f"== {ch}: a picture book, skipped (overlap.py is for lessons: films have no SVG text or arrows)"); continue
            n = res.pop(""); allres[ch] = res
            na = sum(1 for rows in res.values() for r in rows if r["kind"] == "arrow")
            nt = sum(1 for rows in res.values() for r in rows if r["kind"] == "text")
            print(f"== {ch}: {na} arrow/text, {nt} text/text pairs, in {len(res)} of {n} beats sampled")
            for bid, rows in res.items():
                for r in rows:
                    rg = ", ".join(f"{a:g}" if a == c else f"{a:g}-{c:g}" for a, c in r["ranges"])
                    print(f"  {bid:14} {r['kind']:5} {r['a'][:28]!r:32} {r['b'][:40]!r:44} t={rg}")
        await b.close()
        if errs: print("PAGE ERRORS:", errs)
        if jout: json.dump(allres, open(jout, "w"), indent=1)

if __name__ == "__main__":
    asyncio.run(main())
