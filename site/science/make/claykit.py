"""claykit.py: clay tabletop sets for the science book, rendered in Blender. Imported by the chapter scripts
(ch09.py), never run on its own.

The picture is a hand-made clay miniature on a table, photographed from the side and a little above. The page keeps
moving things itself (a truck, a ball, a camera that follows a car), so the kit renders what the page needs to do
that exactly:

  plate   a set without its movers, one frame (or one period of a road that repeats);
  sprite  one mover alone on a transparent film, with its shadow on the ground (a shadow catcher);
  strip   a mover's turning part (a wheel, a ball) at N angles, side by side in one image.

Why that is exact, not an approximation: the camera is orthographic and never turns, the sun is one direction and
the world light is even. Then moving a thing sideways (or in depth, at one distance from the plane of focus) does
not change its picture, only where it is: page x = 100 * Blender x, page y = Y0 - 100 * (z cos e + y sin e)
for an elevation e (px(), below). A sprite rendered once and moved by the page is the frame Blender would render
there. The depth of field is real (Cycles blurs an orthographic camera too): the plane of focus stands square to the
view through the set's focus depth, so near ground and far hills go soft and a mover keeps its sharpness as it drives.

Units: 1 Blender unit = 100 page px (U). Sets are built at toy size: a person is 1.2 units, a thumb dent ~0.3.

Every part is a dense mesh pushed about like clay (finish(): slow lumps, thumb dents with a raised rim) under a
material with a colour drift, tool strokes, coarse fingerprints and specks of other clay (clay()).

Files: raw PNG frames go to --out (heavy, not committed); what the page loads goes to --site as WebP (written by
Blender, no other tool), and its place and size to --site/clay.js (window.CLAY).
"""
import bpy, bmesh, math, random, os, sys, json, re, time, argparse
import numpy as np
from mathutils import Vector, noise

U = 100.0
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))


def arguments(extra=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='', help='comma list of assets to render (default: all of the set)')
    ap.add_argument('--engine', default='cycles', choices=['cycles', 'eevee'], help='eevee has no shadow catcher: plates only')
    ap.add_argument('--device', default='auto', help='Cycles: auto (OPTIX, CUDA, HIP, METAL, ONEAPI, the first with a GPU), one of them, or CPU')
    ap.add_argument('--samples', type=int, default=64)
    ap.add_argument('--scale', type=int, default=100, help='percent of page size (200 for high-density screens)')
    ap.add_argument('--elev', type=float, default=30.0, help='camera elevation in degrees; the page reads it from clay.js')
    ap.add_argument('--fstop', type=float, default=None, help='lower: near ground and far hills softer (default: the set\'s own, about 0.2)')
    ap.add_argument('--sun', type=float, default=5.0)
    ap.add_argument('--sun-dir', dest='sun_dir', type=lambda v: tuple(map(float, v.split(','))), default=(1.0, 0.45, -0.72),
                    help='the way sunlight travels: x right, y into the set, z up')
    ap.add_argument('--sun-size', dest='sun_size', type=float, default=9.0, help='degrees; larger: softer shadow edges')
    ap.add_argument('--ambient', type=float, default=0.5)
    ap.add_argument('--look', default='Medium High Contrast')
    ap.add_argument('--exposure', type=float, default=0.3)
    ap.add_argument('--marks', type=float, default=1.0, help='strength of the surface marks in the clay materials')
    ap.add_argument('--quality', type=int, default=82, help='WebP quality')
    ap.add_argument('--out', default=os.path.join(ROOT, 'books', 'science-clay', 'render'), help='raw PNG frames')
    ap.add_argument('--site', default=os.path.join(ROOT, 'site', 'science', 'img', 'clay'), help='what the page loads')
    ap.add_argument('--reuse', action='store_true', help='keep raw frames that exist: only pack them again (a new --quality)')
    ap.add_argument('--draft', action='store_true', help='PNG only, no WebP and no clay.js entry (look tests)')
    if extra: extra(ap)
    return ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c) + (1.0,)


# ---------------------------------------------------------------- scene, light, camera

A = None            # the arguments
GROUPS = {}         # name -> [objects]; a shot shows, hides or makes catchers of whole groups
E = 0.0             # elevation, radians
MANIFEST = {}


def setup(a):
    """Render settings, world, sun. Empties the scene."""
    global A, E
    A = a; E = math.radians(a.elev)
    sc = bpy.context.scene
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    if a.engine == 'cycles':
        sc.render.engine = 'CYCLES'
        c = sc.cycles
        c.samples = a.samples; c.use_denoising = True; c.use_adaptive_sampling = True
        c.max_bounces = 6; c.diffuse_bounces = 3; c.glossy_bounces = 2
        c.caustics_reflective = c.caustics_refractive = False
        c.sample_clamp_indirect = 4
        sc.render.use_persistent_data = True
        cp = bpy.context.preferences.addons['cycles'].preferences
        kinds = ['OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'] if a.device == 'auto' else [a.device.upper()]
        for kind in kinds:
            if kind == 'CPU': break
            try: cp.compute_device_type = kind
            except TypeError: continue
            cp.get_devices()
            gpus = [d for d in cp.devices if d.type == kind]
            if gpus:
                for d in cp.devices: d.use = d.type == kind
                c.device = 'GPU'
                print(f'cycles: {kind} on {", ".join(d.name for d in gpus)}')
                break
        if c.device != 'GPU': print(f'cycles: CPU (no GPU among {kinds})')
    else:
        sc.render.engine = 'BLENDER_EEVEE'
        sc.eevee.taa_render_samples = a.samples
        sc.eevee.use_raytracing = True
        print('eevee: no shadow catcher, so sprites come without their ground shadow; use it for plates and look tests')
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'
    for lk in (a.look, 'AgX - ' + a.look):
        try: sc.view_settings.look = lk; break
        except TypeError: pass
    else: print(f'look: {a.look!r} is not a look in this Blender; using none')
    sc.view_settings.exposure = a.exposure
    w = bpy.data.worlds.new('room'); sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = srgb('#7f8f88'); bg.inputs[1].default_value = a.ambient   # the board's green, greyed: a dim room
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = a.sun; sun.data.angle = math.radians(a.sun_size); sun.data.color = (1.0, 0.93, 0.82)
    sun.rotation_euler = Vector(a.sun_dir).to_track_quat('-Z', 'Y').to_euler()
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'
    cam.data.clip_start, cam.data.clip_end = 0.1, 400
    cam.rotation_euler = (math.pi / 2 - E, 0, 0)       # looks into the set (+y) and down by the elevation; it never turns
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = a.fstop
    cam.data.dof.aperture_blades = 7
    return sc


def px(x, y, z, Y0):
    """Page px of a Blender point; Y0 is the page y of the ground at depth 0."""
    return x * U, Y0 - U * (z * math.cos(E) + y * math.sin(E))


def aim(rect, Y0, focus_y):
    """Frame the page rectangle (x, y, w, h) exactly; focus on the ground at depth focus_y."""
    sc = bpy.context.scene; cam = sc.camera
    x, y, w, h = rect
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = int(w), int(h), A.scale
    cam.data.sensor_fit = 'HORIZONTAL'
    cam.data.ortho_scale = w / U
    d = Vector((0, math.cos(E), -math.sin(E)))          # the view direction
    P = Vector(((x + w / 2) / U, 0, (Y0 - (y + h / 2)) / (U * math.cos(E))))   # the frame's centre, on the plane y = 0
    cam.location = P - d * 150
    cam.data.dof.focus_distance = (Vector((0, focus_y, 0)) - cam.location).dot(d)


def group(name, *objs):
    GROUPS.setdefault(name, []).extend(objs)
    return objs[0] if len(objs) == 1 else objs


def shot(name, rect, Y0, focus_y, show, catch=(), unseen=(), frames=None, anchor=None, extra=None):
    """Render one asset and write it for the page.

    show: groups the camera sees. catch: groups that only catch shadows (the ground under a sprite). unseen: groups
    that light and shadow the picture but the camera does not see (a truck's body while its wheel is shot).
    Every other group is out of the render. frames: [(key, fn)]: a strip; fn() poses the frame.
    anchor: the page point (x, y) the sprite is placed by; clay.js gets its offset inside the image. extra: more
    fields for the page (a wheel's radius, a road's period)."""
    sc = bpy.context.scene
    x, y, w, h = rect = tuple(int(round(v)) for v in rect)
    for g, objs in GROUPS.items():
        on = g in show or g in catch or g in unseen
        for o in objs:
            o.hide_render = not on
            o.is_shadow_catcher = g in catch
            o.visible_camera = g not in unseen
    aim(rect, Y0, focus_y)
    raw = os.path.join(os.path.abspath(A.out), name); os.makedirs(raw, exist_ok=True)
    t0 = time.time()
    files = []
    for i, (key, fn) in enumerate(frames or [(0, None)]):
        f = os.path.join(raw, f'{i:03d}.png')
        files.append(f)
        if A.reuse and os.path.exists(f): continue
        if fn: fn()
        sc.render.filepath = f
        bpy.ops.render.render(write_still=True)
    dt = time.time() - t0
    n = len(files)
    print(f'shot {name}: {w}x{h} px at {A.scale}%, {n} frame{"s" * (n > 1)}, {dt:.1f} s ({dt / n:.1f} s a frame), raw in {raw}', flush=True)
    if A.draft: return files
    site = os.path.abspath(A.site); os.makedirs(site, exist_ok=True)
    dst = os.path.join(site, name + '.webp')
    pack(files, dst)
    m = {'w': w, 'h': h, 'x': x, 'y': y}
    if anchor: m.update(x=round(x - anchor[0], 2), y=round(y - anchor[1], 2))   # where the image's corner is from the anchor
    if n > 1: m['n'] = n
    if extra: m.update(extra)
    MANIFEST[name] = m
    print(f'shot {name}: {dst} {os.path.getsize(dst) / 1024:.0f} KB')
    return files


def pack(files, dst):
    """The frames side by side as one WebP (alpha kept), written by Blender itself: no other tool is needed."""
    n = len(files)
    ims = [bpy.data.images.load(f) for f in files]
    w, h = ims[0].size
    out = np.empty((h, w * n, 4), 'f')
    for i, im in enumerate(ims):
        buf = np.empty(w * h * 4, 'f'); im.pixels.foreach_get(buf)
        out[:, i * w:(i + 1) * w] = buf.reshape(h, w, 4)
        bpy.data.images.remove(im)
    o = bpy.data.images.new('pack', w * n, h, alpha=True)
    o.pixels.foreach_set(out.ravel())
    o.filepath_raw = dst; o.file_format = 'WEBP'
    o.save(quality=A.quality)
    bpy.data.images.remove(o)


def write_manifest(meta):
    """Merge this run's assets into --site/clay.js (window.CLAY): the page reads sizes and anchors from it."""
    if A.draft or not MANIFEST: return
    path = os.path.join(os.path.abspath(A.site), 'clay.js')
    old = {}
    if os.path.exists(path):
        m = re.search(r'=\s*(\{.*\})\s*;?\s*$', open(path).read(), re.S)
        if m: old = json.loads(m.group(1))
    old.update(meta)
    old.setdefault('img', {}).update(MANIFEST)
    open(path, 'w').write('// Written by site/science/make (Blender): the clay pictures, their sizes and where they sit. Do not edit.\n'
                          'window.CLAY = ' + json.dumps(old, indent=1) + ';\n')
    print(f'clay.js: {len(MANIFEST)} assets written, {len(old["img"])} in all')


# ---------------------------------------------------------------- materials

MATS = {}
SPECKS = ['#f4a48c', '#86c9e8', '#f3c95c', '#ece8dc', '#8fd6b0', '#bba8ee']   # crumbs of the other clays


def _m(N, L, op, a, b=None):
    n = N.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((a, b)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: L.new(v, n.inputs[i])
    return n.outputs[0]


def clay(name, hexcol, rough=0.5, sss=0.08, marks=1.0, specks=1.0, period=0.0, feat=1.0, emit=0.0, stipple=0.0, prints=1.0):
    """Modelling clay: a colour that drifts, thumb-sized dents, tool strokes, coarse fingerprints in patches, a few
    crumbs of other colours, a soft waxy shine.

    stipple: a surface dabbed all over with a stiff brush (grass). prints: strength of the fingerprints.
    period: for ground that repeats along x (a road plate that wraps): the marks then repeat every `period` units
    with no seam (x is wound on a circle in a fourth noise dimension). feat: size of the marks (2 = twice as large)."""
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); MATS[name] = m
    m.use_nodes = True
    nt = m.node_tree; N, L = nt.nodes, nt.links
    b = N['Principled BSDF']
    base = srgb(hexcol)
    tc = N.new('ShaderNodeTexCoord')
    P = tc.outputs['Object']; W4 = None
    if period:
        sep = N.new('ShaderNodeSeparateXYZ'); L.new(P, sep.inputs[0])
        th = _m(N, L, 'MULTIPLY', sep.outputs[0], 2 * math.pi / period); R = period / (2 * math.pi)
        cx = N.new('ShaderNodeCombineXYZ')
        L.new(_m(N, L, 'MULTIPLY', _m(N, L, 'COSINE', th), R), cx.inputs[0]); L.new(sep.outputs[1], cx.inputs[1]); L.new(sep.outputs[2], cx.inputs[2])
        P = cx.outputs[0]; W4 = _m(N, L, 'MULTIPLY', _m(N, L, 'SINE', th), R)

    def tex(kind, scale, vec=None, **kw):
        n = N.new(kind)
        if W4 is not None:
            if kind == 'ShaderNodeTexNoise': n.noise_dimensions = '4D'
            else: n.voronoi_dimensions = '4D'
            L.new(W4, n.inputs['W'])
        n.inputs['Scale'].default_value = scale / feat
        for k, v in kw.items(): n.inputs[k].default_value = v
        L.new(vec or P, n.inputs['Vector'])
        return n
    drift = tex('ShaderNodeTexNoise', 1.6, Detail=3.0)
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs[6].default_value = tuple(v * 0.82 for v in base[:3]) + (1,)
    mix.inputs[7].default_value = tuple(min(1, v * 1.12 + 0.004) for v in base[:3]) + (1,)
    L.new(drift.outputs['Fac'], mix.inputs['Factor'])
    col = mix.outputs[2]
    if specks:   # crumbs: a few Voronoi cells, each its own colour from the other clays
        vor = tex('ShaderNodeTexVoronoi', 8.0)
        ramp = N.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
        els = ramp.color_ramp.elements
        els[0].position = 0; els[0].color = srgb(SPECKS[0]); els[1].position = 1 / 6; els[1].color = srgb(SPECKS[1])
        for i in range(2, 6): e = els.new(i / 6); e.color = srgb(SPECKS[i])
        sepc = N.new('ShaderNodeSeparateColor'); L.new(vor.outputs['Color'], sepc.inputs[0])
        L.new(sepc.outputs[0], ramp.inputs[0])
        dot = _m(N, L, 'LESS_THAN', vor.outputs['Distance'], 0.12)                # the crumb's size, in cells
        rare = _m(N, L, 'GREATER_THAN', sepc.outputs[1], 1 - 0.03 * specks)      # one cell in thirty has one
        mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'
        L.new(_m(N, L, 'MULTIPLY', dot, rare), mx.inputs['Factor']); L.new(col, mx.inputs[6]); L.new(ramp.outputs[0], mx.inputs[7])
        col = mx.outputs[2]
    L.new(col, b.inputs['Base Color'])
    rn = tex('ShaderNodeTexNoise', 5.0)
    rr = N.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = rough - 0.1; rr.inputs['To Max'].default_value = rough + 0.12
    L.new(rn.outputs['Fac'], rr.inputs['Value']); L.new(rr.outputs['Result'], b.inputs['Roughness'])
    b.inputs['Specular IOR Level'].default_value = 0.45
    b.inputs['Subsurface Weight'].default_value = sss
    b.inputs['Subsurface Scale'].default_value = 0.06
    b.inputs['Subsurface Radius'].default_value = (1.0, 0.5, 0.35)
    if emit:
        L.new(col, b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = emit
    k = marks * A.marks
    prev = None

    def bump(h, strength, dist):
        nonlocal prev
        bn = N.new('ShaderNodeBump'); bn.inputs['Strength'].default_value = strength; bn.inputs['Distance'].default_value = dist * feat
        L.new(h, bn.inputs['Height'])
        if prev is not None: L.new(prev, bn.inputs['Normal'])
        prev = bn.outputs['Normal']
    if k > 0:
        bump(tex('ShaderNodeTexNoise', 3.2, Detail=1.5).outputs['Fac'], 0.9 * k, 0.03)     # finger dents, a third of a unit across
        mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, 1, 6); mp.inputs['Rotation'].default_value = (0.4, 0.9, 0.2)
        L.new(P, mp.inputs['Vector'])
        bump(tex('ShaderNodeTexNoise', 9.0, vec=mp.outputs['Vector'], Detail=1.0, Roughness=0.3).outputs['Fac'], 0.5 * k, 0.02)   # tool strokes
        warp = tex('ShaderNodeTexNoise', 6.0)                                              # fingerprints: rings round points, in patches
        wv = N.new('ShaderNodeVectorMath'); wv.operation = 'MULTIPLY_ADD'; wv.inputs[1].default_value = (0.08, 0.08, 0.08)
        L.new(warp.outputs['Color'], wv.inputs[0]); L.new(P, wv.inputs[2])
        vor = tex('ShaderNodeTexVoronoi', 2.2, vec=wv.outputs['Vector'])
        ring = _m(N, L, 'SINE', _m(N, L, 'MULTIPLY', vor.outputs['Distance'], 2 * math.pi / 0.085))   # in cells: ridges ~4 px apart at page size
        patch = tex('ShaderNodeTexNoise', 1.8)
        pr = N.new('ShaderNodeMapRange'); pr.inputs['From Min'].default_value = 0.56; pr.inputs['From Max'].default_value = 0.7
        L.new(patch.outputs['Fac'], pr.inputs['Value'])
        if prints: bump(_m(N, L, 'MULTIPLY', ring, pr.outputs['Result']), 0.16 * k * prints, 0.006)
        if stipple: bump(tex('ShaderNodeTexNoise', 55.0 * feat, Detail=2.0, Roughness=0.7).outputs['Fac'], stipple * k, 0.012 / feat)
    if prev is not None: L.new(prev, b.inputs['Normal'])
    return m


# ---------------------------------------------------------------- shapes

def rbox_mesh(size, r, d=0.06):
    """A box with rounded edges as an even quad mesh, about d between vertices. r = half the smallest side: a pill
    or a ball."""
    n = [max(2, round(s / d)) for s in size]
    h = [s / 2 for s in size]
    r = min(r, min(h))
    bm = bmesh.new(); V = {}

    def v(key):
        if key not in V:
            p = [-h[a] + size[a] * key[a] / n[a] for a in range(3)]
            c = [max(-(h[a] - r), min(h[a] - r, p[a])) for a in range(3)]
            dv = Vector(p) - Vector(c)
            V[key] = bm.verts.new(Vector(c) + dv.normalized() * r if dv.length > 1e-9 else p)
        return V[key]
    for a in range(3):
        b, c = (a + 1) % 3, (a + 2) % 3
        for side in (0, n[a]):
            for i in range(n[b]):
                for j in range(n[c]):
                    q = []
                    for di, dj in ((0, 0), (1, 0), (1, 1), (0, 1)):
                        key = [0, 0, 0]; key[a] = side; key[b] = i + di; key[c] = j + dj
                        q.append(v(tuple(key)))
                    bm.faces.new(q if side else q[::-1])
    me = bpy.data.meshes.new('rbox'); bm.to_mesh(me); bm.free()
    return me


def lathe_mesh(prof, d=0.06):
    """A turned shape about z: prof = [(z, r), ...] bottom to top, r 0 at an end closes it. Resampled to about d."""
    pts = [prof[0]]
    for (z0, r0), (z1, r1) in zip(prof, prof[1:]):
        k = max(1, round(math.hypot(z1 - z0, r1 - r0) / d))
        pts += [(z0 + (z1 - z0) * i / k, r0 + (r1 - r0) * i / k) for i in range(1, k + 1)]
    seg = max(8, round(2 * math.pi * max(r for _, r in pts) / d))
    bm = bmesh.new()
    rings = [[bm.verts.new((0, 0, z))] if r < 1e-6 else [bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)] for z, r in pts]
    for a, c in zip(rings, rings[1:]):
        if len(a) == 1 and len(c) == 1: continue
        for i in range(seg):
            j = (i + 1) % seg
            if len(a) == 1: bm.faces.new((a[0], c[i], c[j]))
            elif len(c) == 1: bm.faces.new((a[i], c[0], a[j]))
            else: bm.faces.new((a[i], c[i], c[j], a[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('lathe'); bm.to_mesh(me); bm.free()
    return me


def finish(me, lump=0.03, dents=6, seed=0, dent_r=(0.12, 0.26), lump_size=0.7, keep=None):
    """Push the mesh about like clay: slow lumps (they change the outline), then thumb dents: a pressed hollow with
    a slightly raised rim. keep(points) -> bool array: vertices that stay where they are (a slab's underside)."""
    rnd = random.Random(seed)
    n = len(me.vertices)
    co = np.empty(n * 3, 'f'); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
    no = np.empty(n * 3, 'f'); me.vertices.foreach_get('normal', no); no = no.reshape(n, 3)
    off = Vector((rnd.uniform(0, 50), rnd.uniform(0, 50), rnd.uniform(0, 50)))
    disp = np.zeros((n, 3), 'f')
    if lump:
        f = np.array([noise.noise(Vector(p) / lump_size + off) + 0.4 * noise.noise(Vector(p) / (lump_size * 0.35) - off) for p in co], 'f')
        disp += no * (f * lump)[:, None]
    for _ in range(dents):
        i = rnd.randrange(n); c = co[i]; nc = no[i]
        r = rnd.uniform(*dent_r); depth = r * rnd.uniform(0.18, 0.3)
        d = np.linalg.norm(co - c, axis=1)
        near = (no @ nc) > 0.2                     # only the side the thumb is on
        hollow = np.exp(-(d / r) ** 2) - 0.3 * np.exp(-((d - 1.5 * r) / (0.45 * r)) ** 2)
        disp -= nc * (depth * hollow * near)[:, None]
    if keep is not None: disp[keep(co)] = 0
    me.vertices.foreach_set('co', (co + disp).ravel())
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.update()
    return me


def part(name, me, mat, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), parent=None, **fin):
    """A clay part: the mesh pushed about (finish) and placed. Returns the object."""
    fin.setdefault('seed', sum(map(ord, name)))
    finish(me, **fin)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot; o.scale = scale; o.parent = parent
    me.materials.append(mat)
    return o


def box(name, size, mat, loc=(0, 0, 0), r=0.12, d=0.06, **kw):
    return part(name, rbox_mesh(size, r, d), mat, loc, **kw)


def ball(name, r, mat, loc=(0, 0, 0), squash=(1, 1, 1), d=0.05, **kw):
    """A ball, or a pebble with squash (x, y, z)."""
    me = rbox_mesh((2 * r, 2 * r, 2 * r), r, d)
    for v in me.vertices: v.co = Vector((v.co.x * squash[0], v.co.y * squash[1], v.co.z * squash[2]))
    return part(name, me, mat, loc, **kw)


def roll(name, p0, p1, r, mat, d=0.05, **kw):
    """A rolled sausage of clay from p0 to p1 with round ends."""
    p0, p1 = Vector(p0), Vector(p1); v = p1 - p0; ln = v.length
    prof = [(-r, 0)] + [(-r * math.cos(a), r * math.sin(a)) for a in (math.pi * i / 8 for i in range(1, 4))] + [(0, r), (ln, r)] + \
           [(ln + r * math.sin(a), r * math.cos(a)) for a in (math.pi * i / 8 for i in range(1, 4))] + [(ln + r, 0)]
    kw.setdefault('lump', r * 0.12); kw.setdefault('dents', 0)
    return part(name, lathe_mesh(prof, d), mat, p0, v.to_track_quat('Z', 'Y').to_euler(), **kw)


def empty(name, loc=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(e)
    e.location = loc; e.parent = parent
    return e


def copy(o, loc, parent=None):
    """A linked copy (the same mesh and marks) somewhere else: scenery that repeats."""
    c = bpy.data.objects.new(o.name, o.data); bpy.context.scene.collection.objects.link(c)
    c.location = loc; c.rotation_euler = o.rotation_euler; c.scale = o.scale; c.parent = parent
    return c


def slab(name, x0, x1, y0, y1, top, mat, thick=0.3, d=0.1, wobble=0.03, period=0.0, lump=0.012, seed=0):
    """Clay rolled flat on the table: a sheet from x0 to x1, y0 to y1, its top at z = top, edges cut by hand
    (they wander by `wobble`), the surface gently uneven. With a period the wander and the lumps repeat along x."""
    nx, ny = max(2, round((x1 - x0) / d)), max(2, round((y1 - y0) / d))
    rnd = random.Random(seed + 11)
    ph = [rnd.uniform(0, 6.28) for _ in range(8)]
    W = period or (x1 - x0) * 1.37

    def wave(x, k):      # a wander that repeats every W
        return sum(math.sin(2 * math.pi * f * x / W + ph[k + i]) / (i + 1.5) for i, f in enumerate((3, 7, 13)))
    bm = bmesh.new()
    g = [[None] * (ny + 1) for _ in range(nx + 1)]
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        ya, yb = y0 + wobble * wave(x, 0), y1 + wobble * wave(x, 3)
        for j in range(ny + 1):
            v = j / ny; y = ya + (yb - ya) * v
            edge = min(v, 1 - v) * (yb - ya)                      # the cut edge is rounded over
            if not period: edge = min(edge, x - x0, x1 - x)       # a piece that does not repeat has ends too
            z = top - 0.5 * thick * max(0, 1 - edge / (0.5 * thick)) ** 2
            z += lump * (math.sin(2 * math.pi * 5 * x / W + ph[6] + 3 * v) + math.sin(2 * math.pi * 11 * x / W + ph[7] - 5 * v)) * min(1, edge / 0.3)
            g[i][j] = bm.verts.new((x, y, z))
    for i in range(nx):
        for j in range(ny): bm.faces.new((g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]))
    rim = [[g[i][0] for i in range(nx + 1)], [g[i][ny] for i in range(nx + 1)]]      # the cut sides, down to the table
    if not period: rim += [[g[0][j] for j in range(ny + 1)], [g[nx][j] for j in range(ny + 1)]]
    for row in rim:
        low = [bm.verts.new((v.co.x, v.co.y, top - thick)) for v in row]
        for i in range(len(row) - 1): bm.faces.new((row[i], low[i], low[i + 1], row[i + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    me.materials.append(mat)
    return o
