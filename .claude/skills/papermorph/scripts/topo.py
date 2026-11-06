#!/usr/bin/env python3
"""An explorable map's data (the explore kit): Natural Earth shapes as one TopoJSON file, projected, with shared borders.

    python3 topo.py site/<book>/data/map.topo.json --iso ITA,SMR,VAT,FRA,CHE,AUT,SVN,HRV --bbox 5,36,19.5,47.5 \\
        --keep name,region,adm0_a3 --dissolve region --cone 38,46,42,12.5
    python3 topo.py site/<book>/data/map.topo.json --layer 50m_admin_0_countries --keep NAME,ADM0_A3 --bbox -12,34,42,62 --cone 40,60,50,15

Writes a Topology for assets/templates/explore/lib/explore.js with three objects:
  areas    every shape kept (admin-1 provinces and states by default; countries with --layer 50m_admin_0_countries),
           with the --keep properties: what lib/states.js groups into the map's states
  land     all of them dissolved into one outline: its arcs are the coast the page draws
  regions  with --dissolve FIELD, the areas sharing a FIELD value dissolved into one shape named by it ({name}): what an
           event's glow lights
Coordinates are metres on a Lambert conformal conic (GRS80; --cone LAT1,LAT2,LAT0,LON0: the two standard parallels
and the origin, put them across the map's own latitudes), quantised (--q, default 100000 steps across), written in
the file as "projection" so the page projects its places the same way. Each border between two areas is one arc both
use, thinned once (--tol metres, default 250), so neighbours still meet after simplification and the page can draw a
line only where two groups meet.

--bbox LON0,LAT0,LON1,LAT1 keeps the shapes with any point inside (it does not cut them); --iso keeps the countries
named (ISO 3166 alpha-3, 'adm0_a3'/'ADM0_A3'). Only outer rings: lakes inside a shape are land here. Shapes are
today's borders and coasts (Natural Earth, public domain); a map of another century groups them in lib/states.js, and
says in its credits what it approximates. The run prints how many borders were shared: a border two sources draw with
different points is not shared and shows as two lines, so take every area from one --layer.

Natural Earth's GeoJSON comes from geo.py's cache (~/.cache/papermorph/ne, downloaded once) or --ne DIR.
"""
import argparse, json, math, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geo   # noqa: E402  (Natural Earth download and cache, Douglas-Peucker)


def lambert(lat1, lat2, lat0, lon0):
    """(lon, lat) -> (x east, y north) in metres; the same formulas as explore.js's lambert()."""
    a, f, r = 6378137, 1 / 298.257222101, math.pi / 180
    e = math.sqrt(f * (2 - f))
    m = lambda p: math.cos(r * p) / math.sqrt(1 - e * e * math.sin(r * p) ** 2)
    t = lambda p: math.tan(math.pi / 4 - r * p / 2) / ((1 - e * math.sin(r * p)) / (1 + e * math.sin(r * p))) ** (e / 2)
    n = (math.log(m(lat1)) - math.log(m(lat2))) / (math.log(t(lat1)) - math.log(t(lat2))) if lat1 != lat2 else math.sin(r * lat1)
    F = m(lat1) / (n * t(lat1) ** n)
    rho = lambda p: a * F * t(p) ** n

    def xy(lon, lat):
        th = n * r * (lon - lon0)
        return rho(lat) * math.sin(th), rho(lat0) - rho(lat) * math.cos(th)
    return xy


def rings_of(geom):
    if not geom:
        return []
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    return [p[0] for p in polys]


def build(pieces):
    """pieces: [[ring of (x, y) ints, closed]] -> (arcs as point lists, each piece's rings as signed arc indexes)."""
    nb = {}   # point -> the unordered neighbour pairs it has, over every ring it is on
    for rings in pieces:
        for ring in rings:
            n = len(ring) - 1
            for i in range(n):
                p, a, b = ring[i], ring[i - 1], ring[i + 1]
                nb.setdefault(p, set()).add((a, b) if a <= b else (b, a))
    junction = {p for p, s in nb.items() if len(s) > 1}
    arcs, index, out = [], {}, []

    def arc_id(pts):
        k = tuple(pts)
        if k in index:
            return index[k]
        r = k[::-1]
        if r in index:
            return ~index[r]
        index[k] = len(arcs); arcs.append(list(pts))
        return index[k]

    for rings in pieces:
        mine = []
        for ring in rings:
            pts = ring[:-1]
            cuts = [i for i, p in enumerate(pts) if p in junction]
            if not cuts:   # a ring that touches no other: one closed arc, started at its smallest point so a copy matches
                s = pts.index(min(pts))
                pts = pts[s:] + pts[:s]
                mine.append([arc_id(pts + [pts[0]])])
                continue
            s = cuts[0]
            pts = pts[s:] + pts[:s]
            cuts = [i - s for i in cuts] + [len(pts)]
            pts = pts + [pts[0]]
            mine.append([arc_id(pts[cuts[k]:cuts[k + 1] + 1]) for k in range(len(cuts) - 1)])
        out.append(mine)
    return arcs, out


def dissolve(arcs, rings):
    """The outline of a group of rings (signed arc indexes): the arcs only one of them uses, chained into rings."""
    used = {}
    for ring in rings:
        for i in ring:
            used.setdefault(i if i >= 0 else ~i, []).append(i)
    edge = [s[0] for s in used.values() if len(s) == 1]
    ends = lambda i: (arcs[i][0], arcs[i][-1]) if i >= 0 else (arcs[~i][-1], arcs[~i][0])
    start = {}
    for i in edge:
        start.setdefault(ends(i)[0], []).append(i)
    out, left = [], set(edge)
    for i in edge:
        if i not in left:
            continue
        ring, j, first = [], i, ends(i)[0]
        while j is not None:
            left.discard(j); ring.append(j)
            e = ends(j)[1]
            if e == first:
                break
            j = next((k for k in start.get(e, []) if k in left), None)
        out.append(ring)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('out', help='the .topo.json to write, e.g. site/<book>/data/map.topo.json')
    ap.add_argument('--layer', default='10m_admin_1_states_provinces', help='Natural Earth layer (default 10m_admin_1_states_provinces)')
    ap.add_argument('--iso', help='keep these countries, ISO alpha-3, comma-separated')
    ap.add_argument('--bbox', help='LON0,LAT0,LON1,LAT1: keep the shapes with a point inside')
    ap.add_argument('--keep', default='name,adm0_a3', help='properties to keep on each area (default name,adm0_a3)')
    ap.add_argument('--dissolve', metavar='FIELD', help='also write regions: the areas sharing FIELD, as one shape each')
    ap.add_argument('--cone', required=True, help='LAT1,LAT2,LAT0,LON0 of the Lambert conic, e.g. 38,46,42,12.5 for Italy')
    ap.add_argument('--tol', type=float, default=250, help='simplify to within this many metres (default 250)')
    ap.add_argument('--q', type=int, default=100000, help='quantisation steps across the map (default 100000)')
    ap.add_argument('--ne', help="a folder with Natural Earth's GeoJSON files, instead of the download")
    a = ap.parse_args()

    iso = set(a.iso.split(',')) if a.iso else None
    box = [float(v) for v in a.bbox.split(',')] if a.bbox else None
    keep = a.keep.split(',')
    cone = [float(v) for v in a.cone.split(',')]
    if len(cone) != 4 or (box and len(box) != 4):
        sys.exit('--cone takes LAT1,LAT2,LAT0,LON0 and --bbox LON0,LAT0,LON1,LAT1')
    xy = lambert(*cone)
    feats = []
    for f in geo.features(a, a.layer):
        p = f['properties']
        if iso and geo.iso(p) not in iso and p.get('adm0_a3') not in iso and p.get('ADM0_A3') not in iso:
            continue
        rings = [r for r in rings_of(f['geometry']) if len(r) >= 4]
        if box and not any(box[0] <= x <= box[2] and box[1] <= y <= box[3] for r in rings for x, y, *_ in r):
            continue
        if rings:
            feats.append((p, rings))
    if not feats:
        sys.exit('no shape matched --iso and --bbox in ' + a.layer)
    missing = [k for k in keep if all(k not in p for p, _ in feats)]
    if missing:
        sys.exit(f'--keep: no area has {", ".join(missing)}; this layer has e.g. {", ".join(sorted(feats[0][0])[:40])}')

    proj = [[[xy(lon, lat) for lon, lat, *_ in r] for r in rings] for _, rings in feats]
    xs = [x for rs in proj for r in rs for x, _ in r]; ys = [y for rs in proj for r in rs for _, y in r]
    x0, y0 = min(xs), min(ys)
    s = max(max(xs) - x0, max(ys) - y0) / (a.q - 1)
    pieces = []
    for rs in proj:
        out = []
        for r in rs:
            q = []
            for x, y in r:
                p = (round((x - x0) / s), round((y - y0) / s))
                if not q or q[-1] != p:
                    q.append(p)
            if q[0] != q[-1]:
                q.append(q[0])
            if len(q) >= 4:
                out.append(q)
        pieces.append(out)
    arcs, prings = build(pieces)
    uses = {}
    for rs in prings:
        for r in rs:
            for i in r:
                uses[i if i >= 0 else ~i] = uses.get(i if i >= 0 else ~i, 0) + 1
    shared = sum(1 for v in uses.values() if v > 1)
    thin = [geo.dp(arc, a.tol / s) if len(arc) > 2 else arc for arc in arcs]

    def geom(rings, props=None):
        g = {'type': 'MultiPolygon', 'arcs': [[r] for r in rings]} if rings else {'type': None}
        if props is not None:
            g['properties'] = props
        return g
    objects = {
        'areas': {'type': 'GeometryCollection', 'geometries': [geom(r, {k: p.get(k) for k in keep}) for (p, _), r in zip(feats, prings)]},
        'land': {'type': 'GeometryCollection', 'geometries': [geom(dissolve(arcs, [r for rs in prings for r in rs]))]},
    }
    if a.dissolve:
        groups = {}
        for (p, _), rs in zip(feats, prings):
            if p.get(a.dissolve):
                groups.setdefault(p[a.dissolve], []).extend(rs)
        if not groups:
            sys.exit(f'--dissolve: no area has a {a.dissolve} value')
        objects['regions'] = {'type': 'GeometryCollection', 'geometries': [geom(dissolve(arcs, rs), {'name': k}) for k, rs in groups.items()]}

    def delta(arc):
        out, px, py = [], 0, 0
        for x, y in arc:
            out.append([x - px, y - py]); px, py = x, y
        return out
    topo = {'type': 'Topology', 'transform': {'scale': [s, s], 'translate': [x0, y0]},
            'projection': {'lambert': cone, 'source': f'Natural Earth {a.layer} (public domain)'},
            'objects': objects, 'arcs': [delta(t) for t in thin]}
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(topo, separators=(',', ':')), encoding='utf-8')
    npts = sum(len(t) for t in thin)
    print(f'{out}: {len(feats)} areas, {len(arcs)} arcs ({shared} shared borders), {npts} points, '
          f'{out.stat().st_size // 1024} KB' + (f', {len(objects["regions"]["geometries"])} regions' if a.dissolve else ''))
    print('the shapes are today\'s borders and coasts (Natural Earth): say in the credits what lib/states.js approximates')
    if shared == 0 and len(feats) > 1:
        print('WARNING no border is shared: these areas touch nowhere, or come from sources whose points differ')


if __name__ == '__main__':
    main()
