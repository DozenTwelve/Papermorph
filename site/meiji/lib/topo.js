/* A small TopoJSON reader for the map: absolute arcs, ring paths for SVG, and who owns each arc.
   Coordinates stay in the file's quantised integers; the page puts one transform on the map group to get kilometres. */
'use strict';
const Topo = (() => {
  // the arcs as flat absolute integer arrays [x0, y0, x1, y1, ...]
  function decode(topo) {
    return topo.arcs.map(a => {
      const out = new Int32Array(a.length * 2);
      let x = 0, y = 0;
      a.forEach(([dx, dy], i) => { x += dx; y += dy; out[2 * i] = x; out[2 * i + 1] = y; });
      return out;
    });
  }

  // matrix(a b c d e f) taking quantised integers to kilometres east and south (SVG y points down)
  function matrix(topo) {
    const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
    return [sx / 1000, 0, 0, -sy / 1000, tx / 1000, -ty / 1000];
  }

  const unwrap = i => (i < 0 ? ~i : i);

  // one ring (arc indexes, negative for reversed) as a closed subpath: an absolute start, then relative steps
  function pathOf(arcs, idx) {
    const pts = [];
    for (const i of idx) {
      const a = arcs[unwrap(i)], n = a.length / 2;
      for (let k = 0; k < n; k++) {
        const j = i < 0 ? n - 1 - k : k;
        if (pts.length && k === 0) continue;   // shared end point
        pts.push(a[2 * j], a[2 * j + 1]);
      }
    }
    let px = pts[0], py = pts[1];
    const out = [];
    for (let k = 1; k < pts.length / 2; k++) { out.push(pts[2 * k] - px, pts[2 * k + 1] - py); px = pts[2 * k]; py = pts[2 * k + 1]; }
    return `M${pts[0]} ${pts[1]}l` + out.join(' ') + 'z';
  }

  // all the rings of a list of polygons as one path
  function rings(arcs, polys) {
    let d = '';
    for (const poly of polys) for (const r of poly) d += pathOf(arcs, r);
    return d;
  }

  // the polygons of a geometry as [[ring, ...], ...]; each ring a list of arc indexes
  const polygons = g => (g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []);

  // a set of single arcs as open lines (for borders)
  function lines(arcs, ids) {
    let d = '';
    for (const id of ids) {
      const a = arcs[id], n = a.length / 2;
      if (n < 2) continue;
      d += `M${a[0]} ${a[1]}l`;
      const out = [];
      for (let k = 1; k < n; k++) out.push(a[2 * k] - a[2 * k - 2], a[2 * k + 1] - a[2 * k - 1]);
      d += out.join(' ');
    }
    return d;
  }

  // arc id -> the geometries (by index in the list) that have it on an edge
  function owners(geoms) {
    const m = new Map();
    geoms.forEach((g, gi) => {
      for (const poly of polygons(g)) for (const r of poly) for (const i of r) {
        const id = unwrap(i), l = m.get(id);
        if (!l) m.set(id, [gi]); else if (!l.includes(gi)) l.push(gi);
      }
    });
    return m;
  }

  // the middle of the biggest ring's bounding box, in quantised units: where a region's name can go
  function centre(arcs, g) {
    let best = null;
    for (const poly of polygons(g)) {
      let x0 = 1e12, y0 = 1e12, x1 = -1e12, y1 = -1e12;
      for (const i of poly[0]) { const a = arcs[unwrap(i)]; for (let k = 0; k < a.length; k += 2) { x0 = Math.min(x0, a[k]); x1 = Math.max(x1, a[k]); y0 = Math.min(y0, a[k + 1]); y1 = Math.max(y1, a[k + 1]); } }
      const area = (x1 - x0) * (y1 - y0);
      if (!best || area > best.area) best = { area, c: [(x0 + x1) / 2, (y0 + y1) / 2] };
    }
    return best.c;
  }

  return { decode, matrix, polygons, rings, lines, owners, centre };
})();
