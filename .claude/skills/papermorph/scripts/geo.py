#!/usr/bin/env python3
"""The map kit's data: countries, regions, cities and a city's detail in lon/lat, from Natural Earth (public domain).

    python3 geo.py site/<book>/img                                   # img/geo-lite.js: the world, capitals and big cities
    python3 geo.py site/<book>/img --regions CHN,ITA:region          # + China's provinces, Italy's regions
    python3 geo.py site/<book>/img --detail Wuhan=114.27,30.58,1.5   # + rivers, lakes and built-up areas 1.5 deg around
    python3 geo.py site/<book>/img --cities Codogno=9.705,45.16,Bergamo   # + named places (a name, or name=lon,lat)
    uv run --with pillow python3 geo.py site/<book>/img --globe site/<book>/lib   # + the globe: three.js and night.webp

Writes window.GEO_LITE for assets/templates/maps/lib/map.js (paperMap, globeShot): lod[0] 110m countries for wide views,
lod[1] 50m thinned to 0.02 deg for close ones, both keyed by ISO 3166 alpha-3 ('CHN', 'FRA', 'ATA' Antarctica included);
regions[ISO][name] admin-1 at 0.02 deg, by English name ('Hubei'), or merged by another Natural Earth field after a colon
(ITA:region gives Italy's 20 regions, 'Lombardia', instead of its 110 provinces: with shapely installed, uv run --with
shapely, each is dissolved into one outline, else its provinces' borders show inside it); cities {name: [lon, lat]};
detail[name] {c: centre, lakes, urban, rivers} at 10m. Rings are
delta-encoded integers (hundredths of a degree, detail ten-thousandths). Only outer rings: holes are lakes, the sea shows.
The world alone is about 400 KB; each region set and detail cut adds to it, so ask for the ones the film shows.

Natural Earth's GeoJSON is downloaded once from github.com/nvkelso/natural-earth-vector into ~/.cache/papermorph/ne
(the 10m regions file is 39 MB, the detail files 40 MB), or read from --ne DIR when you already have the files.
--globe also writes LIB/vendor/three.module.js, three.core.js and three.LICENSE (three.js r186, MIT) and
IMG/night.webp from NASA's Black Marble 2016 (public domain; --night-width 8192 px, the film's; 4096 is lighter); that
step needs Pillow (the uv line above). Credit the picture in the film's sources: "Black Marble 2016, NASA Earth
Observatory, public domain"; the map: "Natural Earth, public domain".
"""
import argparse, json, pathlib, sys, urllib.request

NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'
THREE = 'https://cdn.jsdelivr.net/npm/three@0.186.1/'
NIGHT = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg'
CACHE = pathlib.Path.home() / '.cache/papermorph/ne'


def get(url, dst):
    if not dst.exists():
        print('downloading', url, file=sys.stderr)
        dst.parent.mkdir(parents=True, exist_ok=True)
        tmp = dst.with_suffix('.part')
        with urllib.request.urlopen(url, timeout=120) as r, open(tmp, 'wb') as fh:
            while b := r.read(1 << 20):
                fh.write(b)
        tmp.rename(dst)
    return dst


def features(a, name):
    f = pathlib.Path(a.ne) / f'ne_{name}.geojson' if a.ne else get(NE + f'ne_{name}.geojson', CACHE / f'ne_{name}.geojson')
    return json.loads(f.read_text(encoding='utf-8'))['features']


def iso(p):   # France and Norway have ISO_A3 -99 in Natural Earth; their _EH code is right
    for k in ('ISO_A3', 'ISO_A3_EH', 'ADM0_A3', 'adm0_a3'):
        if p.get(k) and p[k] != '-99':
            return p[k]


def dp(pts, tol):   # Douglas-Peucker on [(lon, lat)]
    if tol <= 0 or len(pts) < 4:
        return pts
    if pts[0] == pts[-1]:   # a closed ring: split at its farthest point, or every point lies on a zero-length chord
        x0, y0 = pts[0]
        m = max(range(len(pts)), key=lambda i: (pts[i][0] - x0) ** 2 + (pts[i][1] - y0) ** 2)
        return dp(pts[:m + 1], tol) + dp(pts[m:], tol)[1:]
    keep, stack = {0, len(pts) - 1}, [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy, best, bi = bx - ax, by - ay, -1, -1
        L = (dx * dx + dy * dy) ** .5 or 1e-12
        for i in range(a + 1, b):
            x, y = pts[i]
            d = abs(dy * (x - ax) - dx * (y - ay)) / L
            if d > best:
                best, bi = d, i
        if best > tol:
            keep.add(bi); stack += [(a, bi), (bi, b)]
    return [pts[i] for i in sorted(keep)]


def enc(line, tol, q=100, least=4):
    # Antarctica's ring runs along the pole between lon 180 and -180: drop those points, or the border draws a seam
    pts = dp([tuple(p[:2]) for p in line if p[1] > -89.99], tol)
    out, px, py = [], 0, 0
    for x, y in pts:
        qx, qy = round(x * q), round(y * q)
        if out and qx == px and qy == py:
            continue
        out += [qx - px, qy - py]; px, py = qx, qy
    return out if len(out) >= 2 * least else None


def outer(geom):
    if not geom:
        return []
    return [p[0] for p in (geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']])]


def layer(feats, tol, key, keep=lambda p: True):
    out = {}
    for f in feats:
        p = f['properties']
        if keep(p):
            out.setdefault(key(p), []).extend(r for r in (enc(r, tol) for r in outer(f['geometry'])) if r)
    return out


def detail(a, lon, lat, deg):
    box = lambda x, y: abs(x - lon) <= deg and abs(y - lat) <= deg
    near = lambda r: any(box(x, y) for x, y, *_ in r)
    rings = lambda name: [r for f in features(a, name) for o in outer(f['geometry']) if near(o)
                          for r in [enc(o, .0005, 10000)] if r]
    rivers = []
    for f in features(a, '10m_rivers_lake_centerlines'):
        g = f['geometry']
        if not g:
            continue
        for ln in (g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]):
            run = []   # the stretches inside the box, each with one point past its edge so it reaches the frame
            for i, p in enumerate(ln):
                if box(*p[:2]):
                    if not run and i:
                        run.append(ln[i - 1])
                    run.append(p)
                elif run:
                    run.append(p); rivers.append(run); run = []
            if run:
                rivers.append(run)
    return {'lakes': rings('10m_lakes'), 'urban': rings('10m_urban_areas'),
            'rivers': [r for r in (enc(r, .0005, 10000, 2) for r in rivers) if r]}


def globe(lib, img, width):
    from PIL import Image
    # the minified builds, under the names the module imports (three.module.min.js imports ./three.core.js)
    for f, name in (('build/three.module.min.js', 'three.module.js'), ('build/three.core.min.js', 'three.core.js'), ('LICENSE', 'three.LICENSE')):
        get(THREE + f, lib / 'vendor' / name)
    jpg = get(NIGHT, CACHE.parent / 'BlackMarble_2016_3km.jpg')
    Image.MAX_IMAGE_PIXELS = None
    im = Image.open(jpg).convert('RGB').resize((width, width // 2), Image.LANCZOS)
    im.save(img / 'night.webp', quality=82, method=5)
    print(lib / 'vendor', 'three.js r186;', img / 'night.webp', im.size)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0], epilog=__doc__.split('\n', 2)[2],
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('img', help="the book's img/ folder: geo-lite.js is written there")
    ap.add_argument('--regions', default='', help='ISO codes whose admin-1 regions to add (CHN,ITA:region,USA)')
    ap.add_argument('--detail', action='append', default=[], metavar='NAME=LON,LAT,DEG',
                    help='rivers, lakes and built-up areas within DEG degrees of a point (repeatable)')
    ap.add_argument('--cities', default='', help='more places: names from Natural Earth, or name=lon,lat')
    ap.add_argument('--min-pop', type=float, default=5e6, help='cities this big are in besides capitals (default 5e6)')
    ap.add_argument('--ne', help='a folder holding the Natural Earth GeoJSON files instead of downloading them')
    ap.add_argument('--globe', metavar='LIB', help="the book's lib/: also fetch three.js and make img/night.webp")
    ap.add_argument('--night-width', type=int, default=8192)
    a = ap.parse_args()
    img = pathlib.Path(a.img)
    img.mkdir(parents=True, exist_ok=True)

    geo = {'lod': [layer(features(a, '110m_admin_0_countries'), 0, iso), layer(features(a, '50m_admin_0_countries'), .02, iso)]}
    want = dict((c.split(':') + [''])[:2] for c in a.regions.split(',') if c)   # ISO -> the field to merge by
    if want:
        geo['regions'], parts = {}, {}
        for f in features(a, '10m_admin_1_states_provinces'):
            p = f['properties']
            if p.get('adm0_a3') in want and f['geometry']:
                key = p.get(want[p['adm0_a3']]) or p.get('name_en') or p['name']
                parts.setdefault(p['adm0_a3'], {}).setdefault(key, []).append(f['geometry'])
        try:
            from shapely.geometry import mapping, shape
            from shapely.ops import unary_union
            union = lambda gs: [mapping(unary_union([shape(g).buffer(0) for g in gs]))] if len(gs) > 1 else gs
        except ImportError:
            union = lambda gs: gs
            if any(want.values()):
                print('shapely is not installed: merged regions keep their inner borders', file=sys.stderr)
        for c, keys in parts.items():
            geo['regions'][c] = {k: [r for g in union(gs) for r in (enc(r, .02) for r in outer(g)) if r] for k, gs in keys.items()}
        if miss := [c for c in want if c not in geo['regions']]:
            sys.exit(f'no regions for {miss}: use the adm0_a3 code (CHN, ITA, USA)')

    # names, or name=lon,lat (split by the same commas: "Codogno=9.705" + "45.16" rejoin)
    names, parts, raw = {}, [s.strip() for s in a.cities.split(',') if s.strip()], []
    i = 0
    while i < len(parts):
        n, eq, v = parts[i].partition('=')
        if eq and i + 1 < len(parts):
            names[n] = [float(v), float(parts[i + 1])]; i += 2
        else:
            raw.append(parts[i]); i += 1
    best = {}
    for f in features(a, '10m_populated_places_simple'):
        p = f['properties']
        n = p['nameascii'] if p['nameascii'] in raw else p['name'] if p['name'] in raw else None
        n = n or (p['nameascii'] if p.get('adm0cap') or p['pop_max'] >= a.min_pop else None)
        if n and p['pop_max'] > best.get(n, (-1,))[0]:
            best[n] = (p['pop_max'], round(p['longitude'], 3), round(p['latitude'], 3))
    geo['cities'] = {n: [v[1], v[2]] for n, v in sorted(best.items())} | names
    if miss := [n for n in raw if n not in best]:
        print('not in Natural Earth (give them as name=lon,lat):', ', '.join(miss), file=sys.stderr)

    for d in a.detail:
        n, _, v = d.partition('=')
        lon, lat, deg = (float(x) for x in v.split(','))
        geo.setdefault('detail', {})[n] = {'c': [lon, lat], **detail(a, lon, lat, deg)}

    out = img / 'geo-lite.js'
    out.write_text('// made by geo.py from Natural Earth (public domain): lon/lat rings, delta-encoded integers (1/100 deg,\n'
                   '// detail 1/10000); lod[0] 110m, lod[1] 50m at 0.02 deg, regions admin-1, cities [lon, lat]\n'
                   'window.GEO_LITE = ' + json.dumps(geo, separators=(',', ':')) + ';\n')
    pts = lambda L: sum(len(r) // 2 for rs in L.values() for r in rs)
    print(out, f'{out.stat().st_size // 1024} KB:', 'points 110m', pts(geo['lod'][0]), '50m', pts(geo['lod'][1]),
          *(f'{c} {len(v)} regions' for c, v in geo.get('regions', {}).items()), 'cities', len(geo['cities']),
          *(f'detail {n}' for n in geo.get('detail', {})))
    if a.globe:
        globe(pathlib.Path(a.globe), img, a.night_width)


if __name__ == '__main__':
    main()
