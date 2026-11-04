/* globe.js: the map kit's night globe (three.js, lib/vendor/ from geo.py --globe), on the beat clock, for the engine's
   stage either way up (SW x SH). One WebGL canvas for the whole film, moved into each beat's panel through a
   foreignObject, so beats never pile up contexts. The camera is orthographic: a globe of radius 1 seen at H shows the
   Earth's radius as 450 / H stage px (half the short side of the stage), and the paper map (map.js paperMap, the same
   orthographic view in lon/lat) takes the very same view object: a shot hands over from globe to map without a jump.
   The texture is ../img/night.webp (NASA Black Marble). Loaded by loadGlobe() (map.js), used through globeShot();
   window.Globe = { canvas, draw, mount, dot, arc, vec, clearMarks }.
   Console: Chromium logs "GPU stall due to ReadPixels" (preserveDrawingBuffer, which the export's screenshots need):
   harmless. */
import * as THREE from './vendor/three.module.js';

const W = SW, Hpx = SH, R0 = Math.min(SW, SH) / 2, DEG = Math.PI / 180;
const canvas = document.createElement('canvas');
canvas.width = W; canvas.height = Hpx;
canvas.style.cssText = `width:${W}px;height:${Hpx}px;display:block`;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 100);

// lon/lat (degrees) to a point on the unit sphere, matching SphereGeometry's UVs (u = 0 at lon -180, north up)
const vec = (lon, lat, r = 1) => new THREE.Vector3(
  r * Math.cos(lat * DEG) * Math.cos(lon * DEG), r * Math.sin(lat * DEG), -r * Math.cos(lat * DEG) * Math.sin(lon * DEG));

const loader = new THREE.TextureLoader();
const night = loader.load(new URL('../img/night.webp', import.meta.url).href, () => window.GLOBE_READY = true, undefined,
  () => { console.error('globe.js: no ../img/night.webp (geo.py --globe makes it)'); window.GLOBE_READY = true; });
night.colorSpace = THREE.SRGBColorSpace;
night.anisotropy = renderer.capabilities.getMaxAnisotropy();

const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), new THREE.ShaderMaterial({
  uniforms: { map: { value: night }, gain: { value: 1.6 }, tint: { value: new THREE.Color('#ffcf8a') }, sea: { value: new THREE.Color('#06101c') } },
  // every varying is read by the fragment shader: an unread one is a warning in Firefox's console on every globe beat
  vertexShader: `varying vec2 vUv; varying vec3 vN;
    void main() { vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform sampler2D map; uniform float gain; uniform vec3 tint, sea; varying vec2 vUv; varying vec3 vN;
    void main() { vec3 c = texture2D(map, vUv).rgb; float l = max(c.r, max(c.g, c.b));
      vec3 lights = tint * pow(l, 1.4) * gain;
      float rim = pow(1. - max(dot(vN, vec3(0., 0., 1.)), 0.), 3.);
      vec3 col = sea + c * .35 + lights + vec3(.15, .35, .7) * rim * .35;
      gl_FragColor = vec4(col, 1.);
      #include <colorspace_fragment>
    }`,
}));
scene.add(earth);

// atmosphere: a soft glow behind the disc, brightest at the limb and gone by 1.22 radii (a camera-facing sprite)
const air = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256), r0 = 1 / 1.22;
  g.addColorStop(0, 'rgba(90,150,255,0)'); g.addColorStop(r0 * .96, 'rgba(90,150,255,.0)'); g.addColorStop(r0, 'rgba(110,170,255,.55)');
  g.addColorStop(r0 + (1 - r0) * .3, 'rgba(80,140,255,.18)'); g.addColorStop(1, 'rgba(60,120,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(2.44); s.renderOrder = -1; return s;
})();
scene.add(air);

// stars: fixed points far behind, on their own seed
const stars = (() => {
  let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const p = [];
  for (let i = 0; i < 2500; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2, r = 40; p.push(r * Math.sqrt(1 - u * u) * Math.cos(a), r * u, r * Math.sqrt(1 - u * u) * Math.sin(a)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xc8d8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: .7 }));
})();
scene.add(stars);

// glowing points (cities with cases) and arcs (where the virus travelled): built once, shown by draw()
const dots = new THREE.Group(); scene.add(dots);
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,90,70,.95)'); g.addColorStop(1, 'rgba(255,40,30,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function dot(lon, lat) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.position.copy(vec(lon, lat, 1.002)); s.visible = false; dots.add(s); return s;
}
const arcs = new THREE.Group(); scene.add(arcs);
function arc(a, b, lift = .25, color = 0xff6a50) {
  const A = vec(...a), B = vec(...b), n = 96, pts = [];
  for (let i = 0; i <= n; i++) {
    const q = i / n, p = A.clone().lerp(B, q).normalize(), ang = A.angleTo(B);
    pts.push(p.multiplyScalar(1 + lift * ang / Math.PI * 2 * Math.sin(Math.PI * q) + .003));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .95, blending: THREE.AdditiveBlending }));
  l.geometry.setDrawRange(0, 0); l._n = n + 1; arcs.add(l); return l;
}

/* draw a view: lon/lat the point at the screen centre (north up), H the half-height of the view in globe radii
   (1.15 shows the whole Earth across the frame), dx/dy shift the frame in screen px, roll in degrees, opacity of the canvas,
   lights gain; dotsOn(i) → 0..1 per dot, arcsOn(i) → 0..1 drawn fraction per arc. */
function draw({ lon = 0, lat = 0, H = 1.15, dx = 0, dy = 0, roll = 0, gain = 1.6, dotScale = .03 } = {}, dotsOn, arcsOn) {
  const k = R0 / H;   // stage px per globe radius
  cam.left = (-W / 2 - dx) / k; cam.right = (W / 2 - dx) / k; cam.top = (Hpx / 2 + dy) / k; cam.bottom = (-Hpx / 2 + dy) / k;
  cam.updateProjectionMatrix();
  cam.position.copy(vec(lon, lat, 10)); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0);
  if (roll) cam.rotateZ(roll * DEG);
  earth.material.uniforms.gain.value = gain;
  dots.children.forEach((s, i) => { const v = dotsOn ? dotsOn(i) : 0; s.visible = v > 0; s.material.opacity = v; s.scale.setScalar(dotScale * H * (.6 + .4 * v)); });
  arcs.children.forEach((l, i) => { const v = arcsOn ? arcsOn(i) : 0; l.visible = v > 0; l.geometry.setDrawRange(0, Math.round(l._n * v)); });
  stars.material.opacity = Math.min(.7, .7 * (H - .3) / .8);
  renderer.render(scene, cam);
}

// put the canvas into a panel: returns the foreignObject (fade it like any element)
function mount(p) {
  const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  fo.setAttribute('x', 0); fo.setAttribute('y', 0); fo.setAttribute('width', W); fo.setAttribute('height', Hpx);
  const g = G(p, {}); g.appendChild(fo); fo.appendChild(canvas);
  return g;
}

window.Globe = { canvas, draw, mount, dot, arc, vec, clearMarks: () => { dots.clear(); arcs.clear(); } };
