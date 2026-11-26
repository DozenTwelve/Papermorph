"""claykit.py: clay tabletop sets rendered in Blender for a book's pages. A scene script imports it and runs in Blender:

    blender --background --factory-startup --python-exit-code 1 --python books/<book>/art/clay/scene.py -- \
        [--only car,car_wheel] [--draft] [--samples 48] [--scale 100] [--device auto|OPTIX|CUDA|HIP|METAL|ONEAPI|CPU]
    uv run --with numpy python3 claykit.py --selftest      # the bookkeeping below, checked without Blender

The method (plates, sprites, strips; the orthographic camera; why a sprite the page moves stays exact; units, look
arguments, render times) is in references/core/clay.md. In short: a scene builds a clay set from the shapes and
materials here (and the props in clayprops.py), then calls shot() once per picture the page needs:

  plate   a set without its movers, one frame (or one period of a road that repeats);
  sprite  one mover alone on a transparent film, with its shadow on the ground (a shadow catcher);
  strip   a mover's turning part (a wheel, a ball) or its replacement poses, N frames side by side in one image.

Page x = 100 * Blender x, page y = Y0 - 100 * (z cos e + y sin e) for an elevation e (px()). 1 Blender unit = 100
page px (U). Sets are built at toy size: a person is 1.2 units, a thumb dent ~0.3.

What it guards, so a run never leaves a book half old and half new:
  - setup(a, set, assets) checks --only against the set's assets, and refuses a partial run (--only) whose camera or
    light differs from what the set's published pictures were rendered with (the manifest records it per set);
  - shot() checks the strip fits WebP's 16383 px before the first frame, and --reuse uses raw frames only when the
    spec they were rendered with (frames, size, camera, light, the shapes and materials in view) is this run's;
  - pictures are packed into --out/.staged/ and moved into --site with the manifest by write_manifest() only, after
    a partial run's set meta is checked against the published one; --draft writes raw PNGs and nothing else.
Every refusal says why and exits 1 (pass --python-exit-code 1 so an error in the scene does too).

Files: raw PNG frames and spec.json go to --out/<asset>/ (heavy, private); what the page loads goes to --site as WebP
(written by Blender, no other tool) with its place and size in --site/clay.js (window.CLAY).
"""
import math, random, os, sys, json, re, time, argparse, hashlib, shutil
from pathlib import Path
import numpy as np
try:
    import bpy, bmesh
    from mathutils import Vector, noise
except ImportError:          # plain Python: only --selftest
    bpy = None

U = 100.0
WEBP_MAX = 16383            # libwebp's WEBP_MAX_DIMENSION: an image wider or taller cannot be saved
DEVICES = ['OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI']
LOOK = ('engine', 'elev', 'fstop', 'sun', 'sun_dir', 'sun_size', 'ambient', 'look', 'exposure', 'marks')


def die(msg):
    """Say why and stop with status 1 (Blender turns a plain sys.exit into status 0)."""
    print(f'claykit: {msg}', file=sys.stderr, flush=True)
    sys.stdout.flush()
    os._exit(1)


def arguments(extra=None, out=None, site=None):
    """The kit's arguments (and the scene's own, added by extra(ap)). out and site: the scene's default folders."""
    class Parser(argparse.ArgumentParser):
        def error(self, message): die(message)   # argparse's SystemExit is swallowed by Blender
    ap = Parser()
    ap.add_argument('--only', default='', help='comma list of assets to render (default: all of the set)')
    ap.add_argument('--engine', default='cycles', choices=['cycles', 'eevee'], help='eevee has no shadow catcher: plates only')
    ap.add_argument('--device', default='AUTO', type=str.upper, choices=['AUTO', 'CPU'] + DEVICES,
                    help='Cycles: auto (the first of OPTIX, CUDA, HIP, METAL, ONEAPI with a GPU, else CPU), one of them (an error if it has no GPU), or CPU')
    ap.add_argument('--samples', type=int, default=64)
    ap.add_argument('--scale', type=int, default=100, help='percent of page size (200 for high-density screens)')
    ap.add_argument('--elev', type=float, default=30.0, help='camera elevation in degrees; the page reads it from clay.js')
    ap.add_argument('--fstop', type=float, default=None, help='lower: near ground and far hills softer (default: the scene\'s own, else 0.25)')
    ap.add_argument('--sun', type=float, default=5.0)
    ap.add_argument('--sun-dir', dest='sun_dir', type=lambda v: tuple(map(float, v.split(','))), default=(1.0, 0.22, -0.75),
                    help='the way sunlight travels: x right, y into the set, z up')
    ap.add_argument('--sun-size', dest='sun_size', type=float, default=9.0, help='degrees; larger: softer shadow edges')
    ap.add_argument('--ambient', type=float, default=0.5)
    ap.add_argument('--look', default='Medium High Contrast')
    ap.add_argument('--exposure', type=float, default=0.3)
    ap.add_argument('--marks', type=float, default=1.0, help='strength of the surface marks in the clay materials')
    ap.add_argument('--quality', type=int, default=82, help='WebP quality')
    ap.add_argument('--out', default=out, required=out is None, help='raw PNG frames (private, heavy)')
    ap.add_argument('--site', default=site, required=site is None, help='what the page loads: WebP pictures and clay.js')
    ap.add_argument('--reuse', action='store_true', help='keep raw frames rendered to this same spec: only pack them again (a new --quality)')
    ap.add_argument('--draft', action='store_true', help='PNG only, to --out: no WebP, no clay.js entry (look tests)')
    if extra: extra(ap)
    a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if a.samples < 1 or a.scale < 1: ap.error('--samples and --scale must be positive')
    if len(a.sun_dir) != 3 or not all(math.isfinite(v) for v in a.sun_dir) or not any(a.sun_dir): ap.error('--sun-dir needs three finite numbers, not all zero')
    if not 0 <= a.quality <= 100: ap.error('--quality must be between 0 and 100')
    if any(not math.isfinite(getattr(a, k)) for k in ('elev', 'sun', 'sun_size', 'ambient', 'exposure', 'marks')): ap.error('look settings must be finite numbers')
    if a.fstop is not None and (not math.isfinite(a.fstop) or a.fstop <= 0): ap.error('--fstop must be positive and finite')
    return a


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c) + (1.0,)


# ---------------------------------------------------------------- bookkeeping (plain Python: --selftest checks it)

def look_spec(a):
    """The camera and light a set's pictures share: pictures rendered under different ones do not fit together."""
    return {k: list(v) if isinstance(v, tuple) else v for k, v in ((k, getattr(a, k)) for k in LOOK)}


def unknown(only, assets):
    return sorted(set(only) - set(assets))


def partial_problem(record, spec, only, assets):
    """Why a run of only some of a set's assets must not go ahead, or None. record: the manifest's sets[set]."""
    rest = ', '.join(sorted(set(assets) - set(only))) or '(none)'
    if not record:
        return ('the manifest has no record of how this set was rendered, so a partial run cannot be checked against '
                'the pictures already there: render the whole set once (drop --only)')
    diff = [f'{k} {record["spec"].get(k)!r} -> {v!r}' for k, v in spec.items() if record['spec'].get(k) != v]
    if diff:
        return (f'--only renders some assets with another camera or light ({"; ".join(diff)}) than the rest of the set '
                f'was published with; the others ({rest}) would no longer fit them. Render the whole set (drop --only), '
                f'or keep the published settings')
    return None


def meta_problem(old, meta):
    """Set meta (lanes, anchors, centres) that a partial run would change under pictures it does not render."""
    return [f'{k}: {old[k]!r} -> {v!r}' for k, v in meta.items() if k in old and old[k] != v]


def strip_size(w, h, n, pct):
    """The packed image's pixel size: Blender renders int(w * pct / 100) per frame, n frames in a row."""
    return w * pct // 100 * n, h * pct // 100


def max_scale(w, h, n, zoom):
    """The largest --scale (percent) whose strip still fits WebP's limit."""
    s = 1
    while max(strip_size(w, h, n, int((s + 1) * zoom))) <= WEBP_MAX: s += 1
    return s


def reuse_problem(old, new):
    """Keys of the raw frames' spec that differ from this run's: frames that cannot be packed as this asset."""
    if old is None: return ['no spec.json beside the frames']
    return [k for k in sorted(set(old) | set(new)) if old.get(k) != new.get(k)]


def parse_manifest(text):
    m = re.search(r'window\.CLAY\s*=\s*(\{.*\})\s*;', text, re.S)
    if not m: raise ValueError('clay.js has no window.CLAY JSON object; refusing to overwrite it')
    return json.loads(m.group(1))


def manifest_text(d):
    return ('// Written by claykit.py (Blender): the clay pictures, their sizes and where they sit. Do not edit: render again.\n'
            'window.CLAY = ' + json.dumps(d, indent=1) + ';\n'
            "// the pictures sit beside this file, wherever the page that loads it is\n"
            "if (document.currentScript) CLAY.base = document.currentScript.src.replace(/[^/]*$/, '');\n")


def show_groups(groups, show, catch, unseen, holdout, hold, material):
    """Set each group's part in a shot. Every mesh's own materials come back first, then the holdout groups' meshes
    take the holdout material (their own names kept on the mesh, once), so any order of shots restores them.
    material(name) -> the material. Returns warnings: a mesh shared by a holdout group and a group in view."""
    for g, objs in groups.items():
        on = g in show or g in catch or g in unseen or g in holdout
        for o in objs:
            o.hide_render = not on
            o.is_shadow_catcher = g in catch
            o.visible_camera = g not in unseen
            me = getattr(o, 'data', None)
            if me is not None and 'mats' in me:
                for i, n in enumerate(me['mats']): me.materials[i] = material(n)
                del me['mats']
    held = set()
    for g in holdout:
        for o in groups.get(g, ()):
            me = o.data
            if 'mats' not in me: me['mats'] = [m.name for m in me.materials]
            for i in range(len(me.materials)): me.materials[i] = hold
            held.add(id(me))
    return [f'{o.name} (group {g}) shares its mesh with a holdout group, so it is cut out too: give it its own mesh'
            for g, objs in groups.items() if g not in holdout and (g in show or g in catch or g in unseen)
            for o in objs if id(getattr(o, 'data', None)) in held]


# ---------------------------------------------------------------- scene, light, camera

A = None            # the arguments
SET = ''            # the set's name, ASSETS its assets, ONLY those this run renders
ASSETS, ONLY = [], set()
GROUPS = {}         # name -> [objects]; a shot shows, hides or makes catchers of whole groups
E = 0.0             # elevation, radians
MANIFEST = {}       # what this run packed: name -> page metadata
T0 = 0.0


def manifest_path():
    return os.path.join(os.path.abspath(A.site), 'clay.js')


def read_manifest():
    p = manifest_path()
    return parse_manifest(Path(p).read_text(encoding='utf-8')) if os.path.exists(p) else {}


def staged():
    return os.path.join(os.path.abspath(A.out), '.staged')


def want(name):
    """Does this run render the asset? (every asset of the set, or those --only names)"""
    if name not in ASSETS: die(f'want({name!r}): {name!r} is not among the set {SET!r}\'s assets in the scene\'s setup() call')
    return not ONLY or name in ONLY


def setup(a, name, assets):
    """Check the run, then render settings, world, sun, camera; empties the scene. name: the set; assets: every
    picture the set's shots write (--only is checked against it before anything is built)."""
    global A, E, SET, ASSETS, ONLY, T0
    T0 = time.time()
    A = a; SET = name; ASSETS = list(assets)
    ONLY = set(filter(None, a.only.split(',')))
    if bad := unknown(ONLY, ASSETS):
        die(f'--only names {", ".join(bad)}, not an asset of the set {name!r}; its assets: {", ".join(ASSETS)}')
    if a.fstop is None: a.fstop = 0.25
    if ONLY and not a.draft:
        p = partial_problem(read_manifest().get('sets', {}).get(name), look_spec(a), ONLY, ASSETS)
        if p: die(f'set {name!r}: {p}')
    if not a.draft and os.path.isdir(staged()): shutil.rmtree(staged())      # a run that stopped before write_manifest()
    E = math.radians(a.elev)
    GROUPS.clear(); MATS.clear(); MANIFEST.clear()
    v = bpy.app.version
    print(f'blender {bpy.app.version_string}' + ('' if v >= (5, 0, 0) else ': the kit was made on 5.3; older ones may lack the AgX look and the Principled BSDF sockets it sets'))
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
        c.device = 'CPU'
        cp = bpy.context.preferences.addons['cycles'].preferences
        for kind in (DEVICES if a.device == 'AUTO' else [] if a.device == 'CPU' else [a.device]):
            try: cp.compute_device_type = kind
            except TypeError: continue
            cp.get_devices()
            gpus = [d for d in cp.devices if d.type == kind]
            if gpus:
                for d in cp.devices: d.use = d.type == kind
                c.device = 'GPU'
                print(f'cycles: {kind} on {", ".join(d.name for d in gpus)}, {a.samples} samples')
                break
        if c.device != 'GPU':
            if a.device not in ('AUTO', 'CPU'): die(f'--device {a.device}: this Blender finds no {a.device} GPU (use auto or CPU)')
            print(f'cycles: CPU, {a.samples} samples' + (' (no GPU found: expect several times the GPU times)' if a.device == 'AUTO' else ''))
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


def elevation(deg):
    """Change the camera's elevation for the shots that follow (90: straight down onto the table)."""
    global E
    E = math.radians(deg)
    bpy.context.scene.camera.rotation_euler = (math.pi / 2 - E, 0, 0)


def px(x, y, z, Y0):
    """Page px of a Blender point; Y0 is the page y of the ground at depth 0."""
    return x * U, Y0 - U * (z * math.cos(E) + y * math.sin(E))


def aim(rect, Y0, focus, zoom=1):
    """Frame the page rectangle (x, y, w, h) exactly; focus on the ground at depth `focus` (or on a point (x, y, z))."""
    sc = bpy.context.scene; cam = sc.camera
    x, y, w, h = rect
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = int(w), int(h), int(A.scale * zoom)
    cam.data.sensor_fit = 'HORIZONTAL'
    cam.data.ortho_scale = w / U
    d = Vector((0, math.cos(E), -math.sin(E)))          # the view direction
    b = (Y0 - (y + h / 2)) / U                          # the frame's centre, on the plane through the origin square to the view
    P = Vector(((x + w / 2) / U, b * math.sin(E), b * math.cos(E)))
    cam.location = P - d * 150
    cam.data.dof.focus_distance = (Vector(focus if isinstance(focus, tuple) else (0, focus, 0)) - cam.location).dot(d)


def rect_of(objs, Y0, pad=14, shadow=True, ground=0.0):
    """The page rectangle that holds the objects, and their shadows on the ground (the plane z = ground, along the
    --sun-dir) when shadow is set."""
    xs, ys = [], []
    sun = Vector(A.sun_dir)
    bpy.context.view_layer.update()
    for o in objs:
        if o.type != 'MESH': continue
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            pts = [p]
            if shadow and sun.z < 0: pts.append(p - sun * ((p.z - ground) / sun.z))     # where the corner's shadow lands
            for q in pts:
                x, y = px(q.x, q.y, q.z, Y0); xs.append(x); ys.append(y)
    x0, y0 = math.floor(min(xs) - pad), math.floor(min(ys) - pad)
    return x0, y0, math.ceil(max(xs) + pad) - x0, math.ceil(max(ys) + pad) - y0


def union(rects):
    x0 = min(r[0] for r in rects); y0 = min(r[1] for r in rects)
    return x0, y0, max(r[0] + r[2] for r in rects) - x0, max(r[1] + r[3] for r in rects) - y0


def turn_frames(axles, n):
    """n frames of a whole turn about y (a wheel's axle, a ball's centre): positive rolls toward +x."""
    def pose(i):
        def f():
            for ax in axles: ax.rotation_euler = (0, 2 * math.pi * i / n, 0)
        return f
    return [(i, pose(i)) for i in range(n)]


def swap_frames(sets):
    """Replacement frames: frame i shows sets[i] (lists of objects) and hides the others."""
    def pick(i):
        def f():
            for j, objs in enumerate(sets):
                for o in objs: o.hide_render = j != i
        return f
    return [(i, pick(i)) for i in range(len(sets))]


def group(name, *objs):
    GROUPS.setdefault(name, []).extend(objs)
    return objs[0] if len(objs) == 1 else objs


def fingerprint():
    """A hash of what the camera sees and what lights it: the objects in the render, their shapes, places and
    materials, the camera and the lights. Two runs with the same fingerprint render the same frames."""
    h = hashlib.sha1()
    sc = bpy.context.scene
    bpy.context.view_layer.update()
    for o in sorted(sc.objects, key=lambda o: o.name):
        # empties and rigs draw nothing (an axle left turned by an earlier strip must not change a later shot's hash)
        if o.hide_render or o.type in ('EMPTY', 'ARMATURE', 'LATTICE', 'SPEAKER', 'LIGHT_PROBE'): continue
        h.update(f'{o.name}|{o.type}|{o.visible_camera}|{o.is_shadow_catcher}|{o.visible_shadow}'.encode())
        h.update(np.round(np.array(o.matrix_world, 'f'), 4).tobytes())
        if o.type == 'MESH':
            me = o.data; co = np.empty(len(me.vertices) * 3, 'f'); me.vertices.foreach_get('co', co)
            h.update(co.tobytes())
            for field, collection in (('vertex_index', me.loops), ('material_index', me.polygons)):
                data = np.empty(len(collection), 'i'); collection.foreach_get(field, data); h.update(data.tobytes())
            for attr in me.color_attributes:
                data = np.empty(len(attr.data) * 4, 'f'); attr.data.foreach_get('color', data); h.update(data.tobytes())
            for m in me.materials: h.update(_material_key(m).encode())
        elif o.type in ('LIGHT', 'CAMERA'):
            d = o.data
            h.update(repr([getattr(d, k, None) for k in ('energy', 'angle', 'shadow_soft_size', 'size', 'ortho_scale')]).encode())
            if o.type == 'LIGHT': h.update(repr(tuple(d.color)).encode())
    if sc.camera: h.update(repr((sc.camera.data.dof.focus_distance, sc.camera.data.dof.aperture_fstop)).encode())
    if sc.world: h.update(_material_key(sc.world).encode())
    return h.hexdigest()


def _material_key(m):
    if m is None: return 'none'
    out = [m.name]
    if m.node_tree:
        for n in m.node_tree.nodes:
            out.append(n.bl_idname)
            for i in n.inputs:
                v = getattr(i, 'default_value', None)
                try: out.append(repr(tuple(v)) if hasattr(v, '__len__') else repr(v))
                except TypeError: out.append(repr(v))
            if n.bl_idname == 'ShaderNodeValToRGB': out += [repr((e.position, tuple(e.color))) for e in n.color_ramp.elements]
        out += [repr((l.from_node.name, l.from_socket.identifier, l.to_node.name, l.to_socket.identifier)) for l in m.node_tree.links]
    return '/'.join(out)


def source_spec():
    """Conservative cache invalidation for callback code and kit changes, including imported prop builders."""
    paths = {Path(__file__).resolve()}
    for module in (sys.modules.get('__main__'), sys.modules.get('clayprops')):
        if getattr(module, '__file__', None): paths.add(Path(module.__file__).resolve())
    return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}


def environment_spec():
    """Actual set-wide view direction and lighting, including a scene's overrides after setup()."""
    sc = bpy.context.scene
    return {'elevation': E, 'camera_rotation': list(sc.camera.rotation_euler),
            'world': _material_key(sc.world),
            'lights': [[o.name, o.data.type, list(o.location), list(o.rotation_euler), list(o.data.color),
                        o.data.energy, o.data.angle if o.data.type == 'SUN' else o.data.shadow_soft_size]
                       for o in sorted(sc.objects, key=lambda o: o.name) if o.type == 'LIGHT' and not o.hide_render]}


def shot(name, rect, Y0, focus_y, show, catch=(), unseen=(), frames=None, anchor=None, extra=None, zoom=1, round_=None, holdout=()):
    """Render one asset and stage it for the page (write_manifest() publishes it).

    show: groups the camera sees. catch: groups that only catch shadows (the ground under a sprite). unseen: groups
    that light and shadow the picture but the camera does not see (a truck's body while its wheel is shot).
    holdout: groups that hide what is behind them and are themselves cut out of the picture (the water an animal
    swims in: its underwater half is not drawn). Every other group is out of the render. frames: [(key, fn)]: a strip; fn() poses the frame.
    anchor: the page point (x, y) the sprite is placed by; clay.js gets its offset inside the image. extra: more
    fields for the page (a wheel's radius, a road's period). zoom: render this many times finer than the page's
    size (a picture the page's camera goes close to). round_=(r0, r1): fade the alpha to 0 from r0 to r1 page px
    round the anchor (a sprite the page turns: its rectangle's edge would show where a catcher's faint shadow ends)."""
    if name not in ASSETS: die(f'shot({name!r}): not among the set {SET!r}\'s assets in the scene\'s setup() call')
    if bad := unknown(set(show) | set(catch) | set(unseen) | set(holdout), GROUPS):
        die(f'shot {name}: unknown groups {", ".join(bad)}; available: {", ".join(GROUPS)}')
    sc = bpy.context.scene
    x, y, w, h = rect = tuple(int(round(v)) for v in rect)
    frames = frames or [(0, None)]
    n, pct = len(frames), int(A.scale * zoom)
    W, H = strip_size(w, h, n, pct)
    if min(W, H) < 1: die(f'shot {name}: the frame has zero pixels at {pct}% ({w}x{h} page px)')
    if not A.draft and max(W, H) > WEBP_MAX:
        die(f'shot {name}: {n} frame{"s" * (n > 1)} of {w}x{h} page px at {pct}% pack to {W}x{H} px, over WebP\'s {WEBP_MAX} px; '
            f'nothing was rendered for it. Use --scale {max_scale(w, h, n, zoom)} or less, fewer frames, or a smaller zoom')
    if ONLY and not A.draft:
        record = read_manifest().get('sets', {}).get(SET, {})
        if record.get('environment') != environment_spec():
            die(f'set {SET}: the actual camera direction or lighting changed; render the whole set (drop --only)')
    for warning in show_groups(GROUPS, show, catch, unseen, holdout, HOLD(), lambda m: bpy.data.materials[m]):
        print(f'shot {name}: {warning}')
    aim(rect, Y0, focus_y, zoom)
    raw = os.path.join(os.path.abspath(A.out), name); os.makedirs(raw, exist_ok=True)
    poses = []
    for _, fn in frames:
        if fn: fn()
        poses.append(fingerprint())
    spec = {'rect': [x, y, w, h], 'pct': pct, 'frames': [str(k) for k, _ in frames], 'samples': A.samples,
            'engine': A.engine, 'look': look_spec(A), 'round': list(round_ or ()), 'anchor': list(anchor or ()),
            'blender': bpy.app.version_string, 'source': source_spec(), 'poses': poses}
    spec_file = os.path.join(raw, 'spec.json')
    files = [os.path.join(raw, f'{i:03d}.png') for i in range(n)]
    keep = set()
    if A.reuse:
        old = json.loads(Path(spec_file).read_text()) if os.path.exists(spec_file) else None
        if diff := reuse_problem(old, spec):
            die(f'shot {name} --reuse: the raw frames in {raw} were not rendered to this spec ({", ".join(diff)} differ); '
                'render them again (drop --reuse)')
        keep = {f for f in files if os.path.exists(f)}
        if len(keep) != n: die(f'shot {name} --reuse: missing {n - len(keep)} raw frames; render them again (drop --reuse)')
        print(f'shot {name}: reusing {len(keep)} of {n} raw frames rendered to the same spec')
    if os.path.exists(spec_file) and not keep: os.remove(spec_file)    # frames about to change: their spec goes first
    t0 = time.time()
    for f, (key, fn) in zip(files, frames):
        if f in keep: continue
        if fn: fn()
        sc.render.filepath = f
        bpy.ops.render.render(write_still=True)
    Path(spec_file).write_text(json.dumps(spec, indent=1), encoding='utf-8')
    dt = time.time() - t0
    print(f'shot {name}: {w}x{h} page px at {pct}%, {n} frame{"s" * (n > 1)}, packs to {W}x{H} px ({W * H * 4 / 2**20:.1f} MiB decoded), '
          f'render {dt:.1f} s ({dt / n:.1f} s a frame), raw in {raw}', flush=True)
    if A.draft: return files
    os.makedirs(staged(), exist_ok=True)
    dst = os.path.join(staged(), name + '.webp')
    pack(files, dst, (anchor[0] - x, anchor[1] - y, *round_, w) if round_ else None, (W // n, H))
    m = {'w': w, 'h': h, 'x': x, 'y': y}
    if anchor: m.update(x=round(x - anchor[0], 2), y=round(y - anchor[1], 2))   # where the image's corner is from the anchor
    if n > 1: m['n'] = n
    if extra: m.update(extra)
    MANIFEST[name] = m
    print(f'shot {name}: staged {os.path.getsize(dst) / 1024:.0f} KB')
    return files


def pack(files, dst, round_=None, size=None):
    """The frames side by side as one WebP (alpha kept), written by Blender itself: no other tool is needed.
    round_ = (cx, cy, r0, r1, page_w): a round feather of the alpha about (cx, cy) in page px from the frame's corner.
    size: the (w, h) every frame must have."""
    n = len(files)
    ims = [bpy.data.images.load(f) for f in files]
    sizes = {tuple(im.size) for im in ims}
    if len(sizes) > 1 or (size and sizes != {tuple(size)}):
        die(f'pack {dst}: the frames are {sorted(sizes)} px, expected {size}: render them again')
    w, h = ims[0].size
    out = np.empty((h, w * n, 4), 'f')
    for i, im in enumerate(ims):
        buf = np.empty(w * h * 4, 'f'); im.pixels.foreach_get(buf)
        out[:, i * w:(i + 1) * w] = buf.reshape(h, w, 4)
        bpy.data.images.remove(im)
    if round_:
        cx, cy, r0, r1, pw = round_; k = w / pw                      # image px per page px
        yy, xx = np.mgrid[0:h, 0:w]
        d = np.hypot(xx + .5 - cx * k, (h - 1 - yy) + .5 - cy * k) / k   # Blender's rows run bottom to top
        f = np.clip((r1 - d) / (r1 - r0), 0, 1)
        for i in range(n): out[:, i * w:(i + 1) * w, 3] *= f            # loaded PNGs are straight alpha: the alpha alone
    o = bpy.data.images.new('pack', w * n, h, alpha=True)
    o.pixels.foreach_set(out.ravel())
    o.filepath_raw = dst; o.file_format = 'WEBP'
    o.save(quality=A.quality)
    bpy.data.images.remove(o)


def write_manifest(meta):
    """Publish this run: move the staged WebPs into --site and merge their entries and the set's meta (lanes,
    anchors the page reads) into --site/clay.js (window.CLAY), with a record of the camera and light they share."""
    took = time.time() - T0
    if A.draft:
        print(f'draft: nothing published; PNG frames in {os.path.abspath(A.out)} ({took:.0f} s in all)'); return
    if not MANIFEST:
        print(f'set {SET}: nothing rendered, {manifest_path()} unchanged'); return
    if skipped := sorted(set(ONLY or ASSETS) - MANIFEST.keys()):
        die(f'set {SET}: declared but not rendered: {", ".join(skipped)}; nothing published')
    old = read_manifest()
    if ONLY and (diff := meta_problem(old, meta)):
        die(f'set {SET}: this partial run changes the set\'s meta under pictures it did not render ({"; ".join(diff)}); '
            f'nothing published (the new pictures are in {staged()}). Render the whole set (drop --only)')
    sets = old.setdefault('sets', {})
    rec = sets.get(SET) if ONLY else None
    sets[SET] = {'spec': look_spec(A), 'environment': environment_spec(), 'assets': ASSETS,
                 'rendered': {**(rec or {}).get('rendered', {}), **{k: {'blender': bpy.app.version_string, 'samples': A.samples,
                              'scale': A.scale, 'device': bpy.context.scene.cycles.device if A.engine == 'cycles' else 'eevee'} for k in MANIFEST}}}
    old.update(meta)
    old.setdefault('img', {}).update(MANIFEST)
    site = os.path.abspath(A.site); os.makedirs(site, exist_ok=True)
    for name in MANIFEST: shutil.move(os.path.join(staged(), name + '.webp'), os.path.join(site, name + '.webp'))
    tmp = manifest_path() + '.tmp'
    Path(tmp).write_text(manifest_text(old), encoding='utf-8'); os.replace(tmp, manifest_path())
    shutil.rmtree(staged(), ignore_errors=True)
    print(f'clay.js: {len(MANIFEST)} assets of set {SET} published to {site}, {len(old["img"])} in all; {took:.0f} s in all (build, render, pack)')


# ---------------------------------------------------------------- materials

def HOLD():
    """A holdout material: cuts its surface out of the picture (alpha 0) and hides what lies behind it."""
    m = bpy.data.materials.get('holdout')
    if m: return m
    m = bpy.data.materials.new('holdout'); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    h = nt.nodes.new('ShaderNodeHoldout'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(h.outputs[0], o.inputs['Surface'])
    return m


MATS = {}
SPECKS = ['#f4a48c', '#86c9e8', '#f3c95c', '#ece8dc', '#8fd6b0', '#bba8ee']   # crumbs of the other clays

def _m(N, L, op, a, b=None):
    n = N.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((a, b)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: L.new(v, n.inputs[i])
    return n.outputs[0]


def clay(name, hexcol, rough=0.5, sss=0.08, marks=1.0, specks=1.0, period=0.0, feat=1.0, emit=0.0, stipple=0.0, prints=1.0, vcol=False, spec=0.45):
    """Modelling clay: a colour that drifts, thumb-sized dents, tool strokes, coarse fingerprints in patches, a few
    crumbs of other colours, a soft waxy shine.

    spec: the waxy shine (0.45); near 0 where the light comes from the camera's side and would shine back into it.
    vcol: the colour comes from the mesh's colour attribute 'col' (a globe's sea, land and ice), hexcol is unused.
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
    if vcol:
        at = N.new('ShaderNodeAttribute'); at.attribute_name = 'col'
        vm = N.new('ShaderNodeMix'); vm.data_type = 'RGBA'; vm.blend_type = 'MULTIPLY'; vm.inputs['Factor'].default_value = 1.0
        mix.inputs[6].default_value = (0.8, 0.8, 0.8, 1); mix.inputs[7].default_value = (1.1, 1.1, 1.1, 1)
        L.new(at.outputs['Color'], vm.inputs[6]); L.new(col, vm.inputs[7])
        col = vm.outputs[2]
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
    b.inputs['Specular IOR Level'].default_value = spec
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


def fuse(meshes, voxel=0.03, smooth=8):
    """Press several clay shapes into one piece: a voxel remesh of their union, smoothed, as a thumb blends a seam.
    meshes: mesh data already in one shared space. Returns a new mesh (the inputs are removed)."""
    bm = bmesh.new()
    for me in meshes: bm.from_mesh(me); bpy.data.meshes.remove(me)
    tmp = bpy.data.meshes.new('fuse'); bm.to_mesh(tmp); bm.free()
    o = bpy.data.objects.new('fuse', tmp); bpy.context.scene.collection.objects.link(o)
    r = o.modifiers.new('remesh', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = voxel; r.use_smooth_shade = True
    s = o.modifiers.new('smooth', 'SMOOTH'); s.iterations = smooth; s.factor = 0.6
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o); bpy.data.meshes.remove(tmp)
    return me


def moved(me, dx=0, dy=0, dz=0, taper=None):
    """Move a mesh's vertices; taper=(z0, z1, k): shrink x and y towards the top by k between z0 and z1 (a car's glasshouse)."""
    for v in me.vertices:
        x, y, z = v.co
        if taper:
            z0, z1, k = taper; f = 1 - k * min(1, max(0, (z - z0) / (z1 - z0)))
            x, y = x * f, y * f
        v.co = (x + dx, y + dy, z + dz)
    return me


def ribbon(name, pts, half, z, mat, closed=False, d=0.08, lump=0.006, seed=0):
    """A flat clay band of half-width `half` along a polyline of (x, y) points at height z (a road seen from above),
    its edges rounded down to the table."""

    P = [Vector((x, y, 0)) for x, y in pts]
    out = []                                  # resample to about d
    for a_, b_ in zip(P, P[1:] + ([P[0]] if closed else [])):
        k = max(1, round((b_ - a_).length / d))
        out += [a_.lerp(b_, i / k) for i in range(k)]
    if not closed: out.append(P[-1])
    n = len(out); bm = bmesh.new(); rows = []
    prof = [(-1.0, -0.6), (-0.9, 0.0), (0.9, 0.0), (1.0, -0.6)]   # across the band: (offset / half, height / 0.05)
    for i, p in enumerate(out):
        q0, q1 = out[(i - 1) % n] if (closed or i) else p, out[(i + 1) % n] if (closed or i < n - 1) else p
        t = (q1 - q0).normalized(); nrm = Vector((-t.y, t.x, 0))
        rows.append([bm.verts.new(p + nrm * (half * u) + Vector((0, 0, z + 0.05 * h))) for u, h in prof])
    for i in range(n if closed else n - 1):
        a_, b_ = rows[i], rows[(i + 1) % n]
        for j in range(len(prof) - 1): bm.faces.new((a_[j], b_[j], b_[j + 1], a_[j + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return part(name, me, mat, lump=lump, dents=0, seed=seed)


# ---------------------------------------------------------------- self-check (plain Python, no Blender)

def selftest():
    """The guards above on made-up inputs: each case is a way a run once went wrong (references/core/clay.md)."""
    class Mat:
        def __init__(s, name): s.name = name

    class Mesh(dict):                # a mesh: custom properties, and its material slots
        def __init__(s, *names): super().__init__(); s.materials = [Mat(n) for n in names]

    class Obj:
        def __init__(s, name, data): s.name, s.data = name, data
    mats = {n: Mat(n) for n in ('water', 'tile', 'holdout')}
    water, deck = Obj('water', Mesh('water')), Obj('deck', Mesh('tile'))
    groups = {'water': [water], 'deck': [deck]}
    sh = lambda **k: show_groups(groups, k.get('show', ()), (), (), k.get('holdout', ()), mats['holdout'], mats.__getitem__)
    # a holdout twice running, then the water in view: it gets its own material back (it stayed holdout before)
    sh(show=['deck'], holdout=['water']); sh(show=['deck'], holdout=['water'])
    assert [m.name for m in water.data.materials] == ['holdout'] and water.data['mats'] == ['water']
    sh(show=['water', 'deck'])
    assert [m.name for m in water.data.materials] == ['water'] and 'mats' not in water.data and water.hide_render is False
    # a linked copy of the water's mesh in a group in view is cut out with it: said, not silent
    groups['pond'] = [Obj('pond', water.data)]
    assert sh(show=['pond'], holdout=['water']) == ['pond (group pond) shares its mesh with a holdout group, so it is cut out too: give it its own mesh']
    sh(show=['pond']); assert water.data.materials[0].name == 'water'

    # --only with a name the set does not have is an error, alone or among good ones
    assert unknown({'trcuk'}, ['truck', 'car']) == ['trcuk'] and unknown({'truck', 'trcuk'}, ['truck', 'car']) == ['trcuk']
    assert unknown({'truck'}, ['truck', 'car']) == []

    # a partial run under another camera or light, or with no record to check, is refused; the same one goes ahead
    class Args: pass
    a = Args()
    for k, v in zip(LOOK, ('cycles', 30.0, 0.26, 5.0, (1.0, 0.22, -0.75), 9.0, 0.5, 'Medium High Contrast', 0.3, 1.0)): setattr(a, k, v)
    rec = {'spec': look_spec(a), 'assets': ['road', 'truck', 'car']}
    assert partial_problem(rec, look_spec(a), {'truck'}, rec['assets']) is None
    a.elev = 45.0
    p = partial_problem(rec, look_spec(a), {'truck'}, rec['assets'])
    assert 'elev 30.0 -> 45.0' in p and 'car, road' in p, p
    assert 'no record' in partial_problem(None, look_spec(a), {'truck'}, rec['assets'])
    assert json.loads(json.dumps(look_spec(a))) == look_spec(a)    # the record survives the manifest's JSON as it is compared
    # and the set's meta a partial run would change (the lanes at 45 degrees) is caught before anything is published
    assert meta_problem({'road': {'near': 696.94}}, {'road': {'near': 735.33}}) == ["road: {'near': 696.94} -> {'near': 735.33}"]
    assert meta_problem({'road': {'near': 696.94}}, {'road': {'near': 696.94}, 'new': 1}) == []

    # strips over WebP's limit are found before rendering, with the scale that fits: 16 leaf frames of 379 px at 300%
    assert strip_size(379, 263, 16, 300) == (18192, 789) and strip_size(379, 263, 16, 200) == (12128, 526)
    s = max_scale(379, 263, 16, 1)
    assert max(strip_size(379, 263, 16, s)) <= WEBP_MAX < max(strip_size(379, 263, 16, s + 1)), s
    assert max_scale(1800, 1100, 1, 2) == 455                      # the track at zoom 2: 36 px wider for each percent

    # --reuse packs raw frames only when they were rendered to this spec
    spec = {'rect': [0, 0, 300, 200], 'pct': 100, 'frames': ['0', '1'], 'scene': 'abc'}
    assert reuse_problem(dict(spec), spec) == []
    assert reuse_problem({**spec, 'pct': 200, 'scene': 'old'}, spec) == ['pct', 'scene']
    assert reuse_problem({**spec, 'frames': ['0']}, spec) == ['frames'] and reuse_problem(None, spec)

    # the manifest reads back what it wrote, its base line included; an old one (no base line) reads too
    d = {'U': 100.0, 'img': {'car': {'w': 300, 'h': 200, 'x': -150, 'y': -180}}, 'sets': {'road': rec}}
    assert parse_manifest(manifest_text(d)) == d
    assert parse_manifest('// old\nwindow.CLAY = {"img": {}};\n') == {'img': {}}
    print('claykit selftest: ok (holdout restore, --only names, partial runs, strip size, --reuse spec, manifest)')


if __name__ == '__main__' and '--selftest' in sys.argv:
    selftest()
