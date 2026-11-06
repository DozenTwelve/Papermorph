#!/usr/bin/env python3
"""Figures, sets and lettering lifted out of a scanned ink-on-paper book (a story book's own pictures), for paper puppets.

    uv run --with pillow --with numpy --with opencv-python-headless python lift.py MANIFEST.json [MORE.json ...]
        --pages books/<book>/pages --out site/<book>/img [--only NAME ...] [--sheet books/<book>/review/lift]
    ... lift.py grid PAGE.png OUT.jpg [--box X0,Y0,X1,Y1] [--step 100]     # a crop with a labelled grid, to read coordinates

Coordinates are page pixels of the page images in --pages (PNG named after the manifest's "page", e.g. p05.png); read
them off `grid` crops. Every picture is levelled: luminance at or above `levels[1]` becomes the book's paper colour
(scan stains and the next page's show-through drop out), at or below `levels[0]` its ink colour, in between a soft
ramp, so pieces from different pages and scans match.

The manifest (several may be given; later ones add to and replace entries of earlier ones):

    {"paper": [239, 232, 214], "ink": [30, 26, 22], "levels": [80, 190], "res": 2.5, "setRes": 2,
     "pieces": {
       "man": {"page": "p05", "scale": 0.5, "poly": [[x, y], ...], "mask": "auto", "close": 9,
               "anchor": [x, y],                                   the point a puppet is placed by (default bottom middle)
               "faces": -1,                                        the way the drawing looks (-1 left, 1 right), kept in cut.js
               "erase": [[[x, y], ...]],                           areas painted paper first (a stray cat, a word)
               "holes": [[[x, y], ...]],                           areas cut out of the silhouette (paper between an arm and the body)
               "shadow": 0.38,                                     the baked drop shadow's strength (0: none; "ink" pieces: 0);
                                                                   a piece with parts gets a shadow picture per part (sf),
                                                                   which cut.js draws under all the parts, each moving with its part
               "parts": {"legF": {"poly": [...], "cap": [...], "pivot": [x, y]}, ...},
                       or {"frac": [x0, y0, x1, y1], "capFrac": [...], "pivotFrac": [x, y]}: a box in fractions
                       of the figure's own box (0, 0 its top left, 1, 1 its bottom right), for small figures such as
                       a cat split into legF, legH, tail, head without reading coordinates; check the sheet
                       "under": "fill" keeps the body drawn behind a part (inpainted), so an arm lifted off a coat
                       leaves no paper hole
               "order": ["legB", "legF", "body", "armF"]}},        draw order, back to front ("body" is what no part took)
     "sets": {
       "house": {"page": "p05", "box": [x0, y0, x1, y1], "world": [x, y, w], "erase": [...], "fill": [...],
                 "layers": [{"name": "band", "poly": [...], "k": 0.9}, ...], "base": {"name": "page", "k": 1}}}}

pieces: `scale` is world px per page px, by default 900 / the page's height, the scale of a set made of the whole page,
so a figure put back into its own page's set needs no resizing. `mask` "auto" (default) is the figure's silhouette: ink inside `poly` (a loose lasso round the figure), closed
by `close` page px so outlines seal, its holes filled, so the cream paper inside a coat or a face stays opaque and
the set never shows through. Use "poly" when the figure stands on a drawn background (the lasso is then the cut
line, so draw it tight), and "ink" for lettering and line work that should float with its paper transparent. A part
takes the silhouette inside its `poly`; `cap` is extra area it also copies while the body keeps it (the top of a leg
under the coat, so a swinging leg never opens a hole at the hip). Each piece is written as OUT/cut/<name>.webp, or
<name>-<part>.webp per part, at res pixels per world px (so a close-up at 2x stays sharp), and listed in OUT/cut/cut.js as window.CUT[name] =
{w, h, ax, ay, page, pa, sc, parts: [{n, f, x, y, w, h, px, py}]} in world px (page px times scale): x, y the part's box
from the piece's top left, px, py its pivot in the same frame, ax, ay the anchor (pa: the anchor in page px, sc: the
scale), so a figure can be put back exactly where it stood in its own page's set. A piece without parts has one part,
"body". A set's first layer carries `page` ({pages: [[name, width]], s, x0, y0, wx, wy}: world = w + (page - x0)·s),
for the same mapping from page px to the set's world px.

sets: `box` (page px) is cut from the page (a list of pages, e.g. ["p06", "p07"], are joined side by side first, so a
spread becomes one wide picture, and boxes then count from the left page) and placed at world [x, y] with width w
(default: fitted to the 900 px frame height and centred on 800). `erase` polygons are painted paper (hand lettering
on blank paper, a figure lifted out on blank paper); `fill` polygons are inpainted from their surroundings (a figure
lifted off a drawn background; a stand-in until a better patch exists). `pad` [x, y] world px of plain paper is added round
the base (default [300, 60]): a page is narrower than the frame, so the camera sees paper beyond its edges. `patch` [{"file": "patch.png", "poly": [...]}]
pastes the given picture (same size as the page, or the spread) inside each polygon after the fill, for a hole an
image model has painted. Each layer is its polygon of the cleaned picture (transparent outside, its paper kept), and the base
is the rest, with plain paper where the layers were (so a layer that moves never shows a hole; `keepUnder`: true keeps
the drawing there instead, for small parallax); layers are written front of the base in the order listed. Writes OUT/sets/<set>/<layer>.webp and
-soft.webp at `res` px per world px, and merges the set into OUT/sets/sets.js (the paperCam manifest), keeping the
other sets. --sheet writes a contact sheet per run (pieces on grey, parts outlined, pivots and anchors marked), to
look at before using them.

The run names what it could not do: a polygon outside its page, a part that took no ink, a piece whose silhouette is
much bigger than its ink (an outline that did not close: raise `close` or draw a tighter poly), an unknown page, and
for an auto mask: a silhouette that runs along its lasso (sky or ground hatching taken in, or a light figure on dark
ground, which auto cannot cut: there is no seed mask yet), and an outline left open (the silhouette nearly all ink
while a 4x `close` fills much paper: the figure would be see-through; there is no seal line yet), with the parts it is in.
A piece re-lifted with other parts has its old pictures removed, each named.
"""
import argparse, hashlib, json, pathlib, re, sys, tempfile
try:
    import fcntl
except ImportError:   # Windows: no flock, so runs into one book are not serialised (said when it matters)
    fcntl = None
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cv2


def grid(src, out, box, step):
    im = Image.open(src).convert('RGB')
    x0, y0, x1, y1 = box or (0, 0, im.width, im.height)
    im = im.crop((x0, y0, x1, y1)); k = 1600 / max(im.size);   # small crops are enlarged, for precise points
    im = im.resize((round(im.width * k), round(im.height * k)))
    d = ImageDraw.Draw(im)
    for v in range((x0 // step + 1) * step, x1, step):
        X = (v - x0) * k; d.line([(X, 0), (X, im.height)], fill=(230, 40, 40) if v % (step * 5) == 0 else (240, 140, 140), width=1)
        d.text((X + 2, 2), str(v), fill=(200, 0, 0))
    for v in range((y0 // step + 1) * step, y1, step):
        Y = (v - y0) * k; d.line([(0, Y), (im.width, Y)], fill=(40, 90, 230) if v % (step * 5) == 0 else (140, 160, 240), width=1)
        d.text((2, Y + 2), str(v), fill=(0, 0, 200))
    im.save(out, quality=85); print(out, im.size, f'1 px = {1 / k:.2f} page px')


class Book:
    def __init__(self, m, pages):
        self.paper = np.array(m.get('paper', [239, 232, 214]), float); self.ink = np.array(m.get('ink', [30, 26, 22]), float)
        self.levels = m.get('levels', [80, 190]); self.pages = pathlib.Path(pages); self.cache = {}

    def page(self, name):
        names = name if isinstance(name, list) else [name]
        key = '+'.join(names)
        if key not in self.cache:
            ims = []
            for n in names:
                f = self.pages / f'{n}.png'
                if not f.exists(): sys.exit(f'unknown page {n!r}: no {f}')
                ims.append(np.asarray(Image.open(f).convert('L'), float))
            h = min(i.shape[0] for i in ims)
            self.cache[key] = np.concatenate([i[:h] for i in ims], axis=1)
        return self.cache[key]

    def tone(self, lum, levels=None):
        """luminance -> ink amount t (0 paper, 1 ink)."""
        lo, hi = levels or self.levels
        return np.clip((hi - lum) / (hi - lo), 0, 1) ** .85

    def rgb(self, t):
        return (self.paper[None, None] + (self.ink - self.paper)[None, None] * t[..., None]).clip(0, 255)


def poly_mask(shape, poly, ox=0, oy=0):
    m = np.zeros(shape, np.uint8)
    if poly: cv2.fillPoly(m, [np.round(np.array(poly, float) - [ox, oy]).astype(np.int32)], 1)
    return m.astype(bool)


def check_poly(where, poly, W, H):
    p = np.array(poly, float)
    if p.ndim != 2 or len(p) < 3: sys.exit(f'{where}: a polygon needs 3 or more [x, y] points')
    if (p[:, 0] < -2).any() or (p[:, 1] < -2).any() or (p[:, 0] > W + 2).any() or (p[:, 1] > H + 2).any():
        print(f'WARNING {where}: polygon reaches outside the page ({W}x{H}); clipped', file=sys.stderr)


def silhouette(t, region, close, mode):
    if mode == 'poly': return region
    if mode == 'ink': return region & (t > 0.02)
    ink = ((t > 0.25) & region).astype(np.uint8)
    if close > 0:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * close + 1, 2 * close + 1))
        ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, k)
    # fill holes: everything not reachable from the border through non-ink
    inv = (1 - ink).astype(np.uint8); h, w = inv.shape
    pad = np.pad(inv, 1, constant_values=1); ff = np.zeros((h + 4, w + 4), np.uint8)
    cv2.floodFill(pad, ff, (0, 0), 2)
    filled = (pad[1:-1, 1:-1] != 2) & region
    n, lab, st, _ = cv2.connectedComponentsWithStats(filled.astype(np.uint8), 8)
    if n > 2:   # drop specks far smaller than the figure
        big = st[1:, cv2.CC_STAT_AREA].max()
        keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= big * 0.02]
        filled = np.isin(lab, keep)
    return filled


def audit_auto(name, P, t, region, sil, x0, y0):
    """Say where an auto mask likely went wrong, naming the piece or part: the silhouette runs along the lasso (ink
    beyond the figure was taken in: sky or ground hatching, or a light figure on dark ground), or a much larger `close`
    fills much more paper (an outline left open, so the paper inside shows the set through). lift.py has no seal or seed
    option yet, so the way out is a tighter poly, holes, or "mask": "poly"."""
    edge = region & ~cv2.erode(region.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    if edge.sum() and (sil & edge).sum() > 0.25 * edge.sum():
        dark = ((t > 0.25) & region).sum() / region.sum()
        why = 'a light figure on dark ground? (auto keeps the dark ground)' if dark > 0.6 else \
              'ink beyond the figure (sky, ground, a neighbour) was taken in'
        print(f'WARNING {name}: the silhouette runs along {(sil & edge).sum() / edge.sum():.0%} of its lasso: {why}; '
              f'draw the poly tighter there, or use "mask": "poly"', file=sys.stderr)
    # see-through: the silhouette is little more than its ink, and closing 4x wider gaps adds much paper inside it
    close = P.get('close', 9); big = 4 * close
    ink = sil & (t > 0.25)
    if sil.sum() > 200 and ink.sum() > 0.85 * sil.sum():
        wide = silhouette(t, region, big, 'auto'); added = wide & ~sil
        if added.sum() > 0.5 * sil.sum():
            parts = {pn: poly_mask(sil.shape, D['poly'], x0, y0) for pn, D in P.get('parts', {}).items() if 'poly' in D}
            where = [pn for pn, own in parts.items() if (added & own).sum() > 0.25 * max(1, (sil & own).sum())]
            print(f'WARNING {name}: an outline seems open{" (in " + ", ".join(where) + ")" if where else ""}: the '
                  f'silhouette is nearly all ink, and closing gaps of {big} px instead of {close} adds '
                  f'{added.sum() / sil.sum():.1f}x its area, so the paper inside would be see-through; raise "close", '
                  f'or trace it with "mask": "poly" (if it is a dark figure with open shapes, ignore this)', file=sys.stderr)


def lift_piece(book, name, P, res, out, sheet):
    lum = book.page(P['page']).copy(); H, W = lum.shape
    for e in P.get('erase', []): check_poly(f'{name} erase', e, W, H); lum[poly_mask(lum.shape, e)] = 255
    poly = P.get('poly') or [[0, 0], [W, 0], [W, H], [0, H]]
    check_poly(f'{name} poly', poly, W, H)
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    x0, y0, x1, y1 = max(0, int(min(xs)) - 4), max(0, int(min(ys)) - 4), min(W, int(max(xs)) + 5), min(H, int(max(ys)) + 5)
    L = lum[y0:y1, x0:x1]; t = book.tone(L, P.get('levels'))
    region = poly_mask(L.shape, poly, x0, y0)
    mode = P.get('mask', 'auto')
    sil = silhouette(t, region, P.get('close', 9), mode)
    for h in P.get('holes', []): check_poly(f'{name} hole', h, W, H); sil &= ~poly_mask(L.shape, h, x0, y0)
    if mode == 'auto':
        inked = ((t > 0.25) & region).sum()
        if inked and sil.sum() > 12 * inked:
            print(f'WARNING {name}: silhouette is {sil.sum() / inked:.0f}x its ink; an outline may not have closed '
                  f'(raise "close" or draw a tighter poly, or use "mask": "poly")', file=sys.stderr)
        audit_auto(name, P, t, region, sil, x0, y0)
    alpha = (t if mode == 'ink' else sil.astype(float)) * sil
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (3, 3), 0.7) if mode != 'ink' else alpha
    rgb = book.rgb(t)
    s = P.get('scale', 900 / H); px_per = s * res   # default: the scale of a set that fits its page to the frame's height
    parts_def = {pn: dict(D) for pn, D in P.get('parts', {}).items()}
    taken = np.zeros(L.shape, bool); parts = {}
    ys_, xs_ = np.nonzero(alpha > 0.05)
    if len(xs_):   # "frac" parts: boxes in fractions of the figure's own box, so a cat splits without reading coordinates
        fx0, fy0, fw, fh = x0 + xs_.min(), y0 + ys_.min(), xs_.max() - xs_.min() + 1, ys_.max() - ys_.min() + 1
        at = lambda u, v: [fx0 + u * fw, fy0 + v * fh]
        for pn, D in parts_def.items():
            if 'frac' in D:
                a0, b0, a1, b1 = D['frac']; D['poly'] = [at(a0, b0), at(a1, b0), at(a1, b1), at(a0, b1)]
            if 'capFrac' in D:
                a0, b0, a1, b1 = D['capFrac']; D['cap'] = [at(a0, b0), at(a1, b0), at(a1, b1), at(a0, b1)]
            if 'pivotFrac' in D: D['pivot'] = at(*D['pivotFrac'])
    for pn, D in parts_def.items():
        if 'poly' not in D: print(f'WARNING {name}.{pn}: no "poly" or "frac"; part skipped', file=sys.stderr); continue
        check_poly(f'{name}.{pn}', D['poly'], W, H)
        own = poly_mask(L.shape, D['poly'], x0, y0)
        cap = poly_mask(L.shape, D.get('cap'), x0, y0)
        # the part reaches 3 page px past its cut line, under or over the body, so the two never show a pale seam
        lap = cv2.dilate(own.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
        a = alpha * (lap | cap)
        if a.sum() < 20: print(f'WARNING {name}.{pn}: the part took no ink (its poly misses the figure?)', file=sys.stderr)
        parts[pn] = (a, D.get('pivot'))
        taken |= own
    # "under": "fill" on a part keeps the body whole behind it, inpainted from the body round it, so an arm that swings
    # out leaves the coat behind it drawn instead of a hole of paper. A stand-in: on a hatched coat it is a grey smear
    # (woman5's bodice), so it suits a plain coat or a small lift; a hatched one wants a painted patch
    under = np.zeros(L.shape, bool)
    for pn, D in parts_def.items():
        if D.get('under') == 'fill' and 'poly' in D: under |= poly_mask(L.shape, D['poly'], x0, y0)
    body_rgb = rgb
    if under.any():
        m = (under & sil).astype(np.uint8)   # only under the part: the body round it keeps Gág's own pixels
        body_rgb = cv2.inpaint(rgb.astype(np.uint8), m, 9, cv2.INPAINT_TELEA).astype(float)
    parts['body'] = (alpha * ~(taken & ~under), P.get('pivot'))
    order = P.get('order') or ([n for n, D in parts_def.items() if D.get('cap')] + ['body'] + [n for n, D in parts_def.items() if not D.get('cap')])
    for n in parts:
        if n not in order: print(f'WARNING {name}: part {n} is not in "order"; drawn last', file=sys.stderr); order.append(n)
    ys_, xs_ = np.nonzero(alpha > 0.05)
    if not len(xs_): print(f'WARNING {name}: nothing lifted (empty silhouette)', file=sys.stderr); return None
    bx0, by0 = xs_.min(), ys_.min(); bw, bh = xs_.max() - bx0 + 1, ys_.max() - by0 + 1
    anc = P.get('anchor') or [x0 + bx0 + bw / 2, y0 + by0 + bh]
    entry = {'w': round(float(bw * s), 1), 'h': round(float(bh * s), 1), 'ax': round(float((anc[0] - x0 - bx0) * s), 1), 'ay': round(float((anc[1] - y0 - by0) * s), 1),
             'page': P['page'], 'pa': [round(float(anc[0]), 1), round(float(anc[1]), 1)], 'sc': s, 'parts': []}
    if 'faces' in P: entry['faces'] = P['faces']   # -1: drawn looking left (cut.js turns a walking crowd by it)
    (out / 'cut').mkdir(parents=True, exist_ok=True)
    one = len(parts) == 1
    shadow = P.get('shadow', 0.38 if mode != 'ink' else 0)
    for pn in order:
        a, piv = parts[pn]
        yy, xx = np.nonzero(a > 0.02)
        if not len(xx): continue
        cx0, cy0, cx1, cy1 = xx.min(), yy.min(), xx.max() + 1, yy.max() + 1
        src = body_rgb if pn == 'body' else rgb
        rgba = np.dstack([src[cy0:cy1, cx0:cx1], a[cy0:cy1, cx0:cx1] * 255]).astype(np.uint8)
        im = Image.fromarray(rgba, 'RGBA')
        im = im.resize((max(1, round(im.width * px_per)), max(1, round(im.height * px_per))), Image.LANCZOS)
        fn = f'{name}.webp' if one else f'{name}-{pn}.webp'
        sf = None
        if shadow:   # a soft drop shadow, as the paper filter gives a drawn piece
            pd = round(8 * res); size = (im.width + 2 * pd, im.height + 2 * pd)
            a8 = Image.new('L', size, 0); a8.paste(im.getchannel('A'), (pd + round(2.5 * res), pd + round(3.5 * res)))
            a8 = a8.filter(ImageFilter.GaussianBlur(2.2 * res)).point(lambda v: int(v * shadow))
            base = Image.new('RGBA', size, (42, 22, 8, 0)); base.putalpha(a8)
            cx0 -= pd / px_per; cy0 -= pd / px_per; cx1 += pd / px_per; cy1 += pd / px_per
            if one: base.alpha_composite(im, (pd, pd)); im = base
            else:   # each part's shadow is its own picture, drawn under every part (cut.js), so a cut edge never shows
                sf = f'{name}-{pn}-sh.webp'; base.save(out / 'cut' / sf, quality=80, method=6)
                im = base.copy(); im.putalpha(0); im.alpha_composite(Image.fromarray(rgba, 'RGBA').resize((im.width - 2 * pd, im.height - 2 * pd), Image.LANCZOS), (pd, pd))
        im.save(out / 'cut' / fn, quality=90, method=6)
        piv = piv or [x0 + (cx0 + cx1) / 2, y0 + (cy0 + cy1) / 2]
        r = lambda v: round(float(v), 1)
        entry['parts'].append({'n': pn, 'f': fn, 'x': r((cx0 - bx0) * s), 'y': r((cy0 - by0) * s), 'w': r((cx1 - cx0) * s),
                               'h': r((cy1 - cy0) * s), 'px': r((piv[0] - x0 - bx0) * s), 'py': r((piv[1] - y0 - by0) * s),
                               **({'sf': sf} if sf else {})})
    if sheet is not None:
        tile = Image.new('RGB', (round(bw * s) + 20, round(bh * s) + 40), (150, 150, 150))
        d = ImageDraw.Draw(tile)
        for p in entry['parts']:
            pim = Image.open(out / 'cut' / p['f']).resize((max(1, round(p['w'])), max(1, round(p['h']))))
            tile.paste(pim, (round(p['x']) + 10, round(p['y']) + 30), pim)
        for p in entry['parts']:
            if len(entry['parts']) > 1: d.rectangle([p['x'] + 10, p['y'] + 30, p['x'] + p['w'] + 10, p['y'] + p['h'] + 30], outline=(0, 90, 200))
            d.ellipse([p['px'] + 6, p['py'] + 26, p['px'] + 14, p['py'] + 34], outline=(220, 0, 0), width=2)
        d.line([entry['ax'] + 2, entry['ay'] + 30, entry['ax'] + 18, entry['ay'] + 30], fill=(0, 160, 0), width=3)
        d.text((4, 4), f"{name} {entry['w']:.0f}x{entry['h']:.0f}", fill=(0, 0, 0))
        sheet.append(tile)
    # a piece re-lifted with other parts (a cat split into legs) leaves its old pictures behind: remove them, and say so
    keep = {p['f'] for p in entry['parts']} | {p['sf'] for p in entry['parts'] if p.get('sf')}
    # ponytail: a part name is one word, so 'man-old.webp' of a piece 'man-old' would count as a part of 'man'
    own = re.compile(re.escape(name) + r'(-[A-Za-z0-9]+)?(-sh)?\.webp')
    for f in (out / 'cut').glob(f'{name}*.webp'):
        if own.fullmatch(f.name) and f.name not in keep: f.unlink(); print(f'removed {f.name} (no longer a part of {name})')
    return entry


def lift_set(book, name, S, res, out):
    lum = book.page(S['page']).copy(); H, W = lum.shape
    for e in S.get('erase', []): check_poly(f'{name} erase', e, W, H); lum[poly_mask(lum.shape, e)] = 255
    t = book.tone(lum, S.get('levels'))
    fills = S.get('fill', [])
    if fills:
        m = np.zeros(lum.shape, np.uint8)
        for f in fills: check_poly(f'{name} fill', f, W, H); m |= poly_mask(lum.shape, f).astype(np.uint8)
        ys_, xs_ = np.nonzero(m); g = 40   # inpaint only round the holes: the whole page takes minutes
        a0, b0, a1, b1 = max(0, ys_.min() - g), max(0, xs_.min() - g), ys_.max() + g, xs_.max() + g
        t8 = (t * 255).astype(np.uint8); t8[a0:a1, b0:b1] = cv2.inpaint(t8[a0:a1, b0:b1], m[a0:a1, b0:b1], 9, cv2.INPAINT_TELEA)
        t = t8.astype(float) / 255
    rgb = book.rgb(t)
    for p in S.get('patch', []):
        src = np.asarray(Image.open(p['file']).convert('L').resize((W, H)), float)
        m = poly_mask(lum.shape, p['poly'])
        m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 3)[..., None]
        rgb = rgb * (1 - m) + book.rgb(book.tone(src, S.get('levels'))) * m
    x0, y0, x1, y1 = S.get('box', [0, 0, W, H])
    wx, wy, ww = [*(S.get('world') or []), None, None, None][:3]   # [x, y] alone: w is fitted, as with no world
    if ww is None:
        ww = (x1 - x0) * 900 / (y1 - y0)
        wx, wy = 800 - ww / 2 if wx is None else wx, 0 if wy is None else wy
    s = ww / (x1 - x0)
    taken = np.zeros(lum.shape, bool); made = []
    for Lr in S.get('layers', []):
        check_poly(f"{name}.{Lr['name']}", Lr['poly'], W, H)
        m = poly_mask(lum.shape, Lr['poly']); made.append((Lr, m)); taken |= m
    base = S.get('base', {'name': 'page', 'k': 1})
    keep_base = S.get('keepUnder', False)   # True: the base keeps what layers cover (for small parallax)
    entries, files = [], []
    px_, py_ = [round(v / s) for v in S.get('pad', [300, 60])]   # paper round the page, in page px: the frame is wider than a page
    under = rgb.copy()
    if not keep_base: under[taken] = book.paper   # what the layers cover is plain paper in the base, never a hole
    for Lr, m in [(base, np.ones(lum.shape, bool))] + made:
        a = cv2.GaussianBlur(m.astype(np.float32), (3, 3), 0.8)
        rgba = np.dstack([under if Lr is base else rgb, a * 255])[y0:y1, x0:x1]
        if Lr is base and (px_ or py_):
            pad = np.zeros((rgba.shape[0] + 2 * py_, rgba.shape[1] + 2 * px_, 4)); pad[...] = [*book.paper, 255]
            pad[py_:py_ + rgba.shape[0], px_:px_ + rgba.shape[1]] = rgba; rgba = pad
        yy, xx = np.nonzero(rgba[..., 3] > 3)
        if not len(xx): print(f"WARNING {name}.{Lr['name']}: layer is empty inside the box", file=sys.stderr); continue
        cx0, cy0, cx1, cy1 = (xx.min(), yy.min(), xx.max() + 1, yy.max() + 1) if Lr is not base else (0, 0, rgba.shape[1], rgba.shape[0])
        im = Image.fromarray(rgba[cy0:cy1, cx0:cx1].astype(np.uint8), 'RGBA')
        im = im.resize((round((cx1 - cx0) * s * res), round((cy1 - cy0) * s * res)), Image.LANCZOS)
        if Lr is base: cx0 -= px_; cy0 -= py_; cx1 -= px_; cy1 -= py_
        files.append((Lr['name'], im))
        entries.append({'name': Lr['name'], 'k': Lr.get('k', 1), 'box': [round(float(wx + cx0 * s), 1), round(float(wy + cy0 * s), 1), round(float((cx1 - cx0) * s), 1), round(float((cy1 - cy0) * s), 1)],
                        'soft': True, **({'stage': True} if Lr.get('stage') else {})})
    d = out / 'sets' / name; d.mkdir(parents=True, exist_ok=True)
    for f in d.glob('*.webp'): f.unlink()
    for n, im in files:
        im.save(d / f'{n}.webp', quality=88, method=6)
        im.filter(ImageFilter.GaussianBlur(5 * res)).save(d / f'{n}-soft.webp', quality=78, method=6)
    pages = S['page'] if isinstance(S['page'], list) else [S['page']]
    entries[0]['paper'] = '#%02x%02x%02x' % tuple(int(v) for v in book.paper)   # paperCam lays the set on a sheet of it
    entries[0]['page'] = {'pages': [[n, book.page(n).shape[1]] for n in pages], 's': round(float(s), 5), 'x0': int(x0), 'y0': int(y0), 'wx': round(float(wx), 2), 'wy': round(float(wy), 2)}
    print('set', name, [(e['name'], e['box']) for e in entries], f'(page px x {s:.3f})')
    return entries


def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'grid':
        ap = argparse.ArgumentParser(); ap.add_argument('cmd'); ap.add_argument('src'); ap.add_argument('out')
        ap.add_argument('--box'); ap.add_argument('--step', type=int, default=100); a = ap.parse_args()
        return grid(a.src, a.out, [int(v) for v in a.box.split(',')] if a.box else None, a.step)
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('manifests', nargs='+'); ap.add_argument('--pages', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--only', nargs='+'); ap.add_argument('--sheet')
    a = ap.parse_args()
    m = {}
    for f in a.manifests:
        d = json.loads(pathlib.Path(f).read_text(encoding='utf-8'))
        for k, v in d.items():
            m[k] = {**m.get(k, {}), **v} if isinstance(v, dict) and k in ('pieces', 'sets') else v
    out = pathlib.Path(a.out)
    # several workers may lift into one book at once: one run at a time, so no run's cut.js or sets.js is lost
    key = hashlib.md5(str(out.resolve()).encode()).hexdigest()[:10]
    lock = open(pathlib.Path(tempfile.gettempdir()) / f'lift-{key}.lock', 'w')
    if fcntl:
        fcntl.flock(lock, fcntl.LOCK_EX)
    else:
        print('note: no file lock on this system (fcntl): run one lift.py into this book at a time, or one run loses the other\'s cut.js/sets.js entries')
    book = Book(m, a.pages); res = m.get('res', 2.5); set_res = m.get('setRes', 2)
    want = lambda n: not a.only or n in a.only
    cut_js = out / 'cut' / 'cut.js'
    cut = json.loads(cut_js.read_text().split('=', 1)[1].strip().rstrip(';')) if cut_js.exists() else {}
    sheet = [] if a.sheet else None
    for n, P in m.get('pieces', {}).items():
        if want(n):
            e = lift_piece(book, n, P, res, out, sheet)
            if e: cut[n] = e; print('piece', n, f"{e['w']:.0f}x{e['h']:.0f}", [p['n'] for p in e['parts']])
    if cut:
        cut_js.parent.mkdir(parents=True, exist_ok=True)
        cut_js.write_text('window.CUT = ' + json.dumps(cut, separators=(',', ':')) + ';\n')
    sets_js = out / 'sets' / 'sets.js'
    sets = json.loads(sets_js.read_text().split('=', 1)[1].strip().rstrip(';')) if sets_js.exists() else {}
    for n, S in m.get('sets', {}).items():
        if want(n):
            sets[n] = lift_set(book, n, S, S.get('res', set_res), out)
            sets_js.parent.mkdir(parents=True, exist_ok=True)
            sets_js.write_text('window.SETS = ' + json.dumps(sets) + ';\n')
    if a.only:
        for n in a.only:
            if n not in m.get('pieces', {}) and n not in m.get('sets', {}): print(f'WARNING --only {n}: no such piece or set', file=sys.stderr)
    if sheet:
        W = 1800; rows, row, x, h = [], [], 0, 0
        for t in sheet:
            if x + t.width > W and row: rows.append((row, h)); row, x, h = [], 0, 0
            row.append((x, t)); x += t.width + 6; h = max(h, t.height)
        rows.append((row, h))
        S = Image.new('RGB', (W, sum(h for _, h in rows) + 6 * len(rows)), (120, 120, 120)); y = 0
        for r, h in rows:
            for x, t in r: S.paste(t, (x, y))
            y += h + 6
        p = pathlib.Path(a.sheet); p.mkdir(parents=True, exist_ok=True)
        S.save(p / 'pieces.jpg', quality=85); print('sheet', p / 'pieces.jpg')


if __name__ == '__main__':
    main()
