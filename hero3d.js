/* SOCWatch — 3D hero: "Threat Globe" on Three.js.
   Three is self-hosted as a pinned, tree-shaken ES-module subset
   (assets/vendor/, built by scripts/vendor-three.js) and imported by relative
   path, so the strict CSP (script-src 'self') holds: no inline, no CDN.
   Decorative only: the canvas is aria-hidden and pointer-events: none.
   - Wireframe graticule globe, sensor nodes, threat-flow arcs, orbit ring.
   - Reacts subtly to cursor (tilt) and scroll (tip forward).
   - Pauses when offscreen / tab hidden; DPR capped at 2.
   - prefers-reduced-motion: renders one static frame, no animation loop. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, BufferGeometry, BufferAttribute,
  LineSegments, Points, Mesh, PlaneGeometry, ShaderMaterial, Color,
  CustomBlending, OneFactor, OneMinusSrcAlphaFactor
} from "./assets/vendor/three-0.160.0.slim.module.min.js";

const canvas = document.getElementById("heroGlobe");
const hero = document.getElementById("hero");
if (canvas && hero) main(canvas, hero, canvas.parentNode);

function main(canvas, hero, box) {
  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const DIST = 3.8;          // camera distance (globe radius = 1)
  const FIT = 1.5;           // world units that must fit in the shorter axis

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) { box.classList.add("is-unavailable"); return; }
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);

  /* ---------- shaders (Three injects precision + built-in uniforms/attributes)
     aExtra = [t along arc | point size, phase, speed | alert flag] ---------- */
  const VS = `
    attribute vec3 aExtra;
    uniform float uTime; uniform float uDpr;
    varying float vFace; varying vec3 vExtra;
    void main() {
      vFace = normalize((modelMatrix * vec4(position, 1.0)).xyz).z;   // +1 faces camera
      vExtra = aExtra;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      float pulse = 0.5 + 0.5 * sin(uTime * 1.6 + aExtra.y * 6.2831);
      gl_PointSize = uDpr * aExtra.x * (0.75 + 0.25 * pulse * aExtra.z) * (0.55 + 0.45 * smoothstep(-0.3, 0.6, vFace));
    }`;
  const FS_HEAD = `
    uniform vec3 uColor; uniform vec3 uHot; uniform float uAlpha; uniform float uFade; uniform float uTime;
    varying float vFace; varying vec3 vExtra;`;
  const FS_LINE = FS_HEAD + `
    void main() {
      float a = uAlpha * uFade * (0.10 + 0.90 * smoothstep(-0.15, 0.6, vFace));
      gl_FragColor = vec4(uColor * a, a);
    }`;
  const FS_ARC = FS_HEAD + `
    void main() {
      float head = fract(uTime * vExtra.z + vExtra.y) * 1.6;      // 1.0..1.6 = rest gap
      float d = head - vExtra.x;
      float comet = step(0.0, d) * smoothstep(0.35, 0.0, d);
      float face = 0.2 + 0.8 * smoothstep(-0.2, 0.5, vFace);
      float a = uAlpha * uFade * (0.14 + 0.9 * comet) * face;
      gl_FragColor = vec4(mix(uColor, uHot, comet * 0.55) * a, a);
    }`;
  const FS_POINT = FS_HEAD + `
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      float core = smoothstep(0.55, 0.15, r);
      float glow = smoothstep(1.0, 0.3, r) * 0.35;
      float face = 0.15 + 0.85 * smoothstep(-0.2, 0.5, vFace);
      float pulse = 0.5 + 0.5 * sin(uTime * 1.6 + vExtra.y * 6.2831);
      float a = uAlpha * uFade * (core + glow) * face * (0.7 + 0.3 * pulse * vExtra.z);
      gl_FragColor = vec4(mix(uColor, uHot, core * 0.35 * vExtra.z) * a, a);
    }`;
  /* camera-facing disc: soft inner fill + thin limb glow */
  const VS_DISC = `
    uniform float uR; varying vec2 vUv;
    void main() { vUv = position.xy * uR; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * uR, 0.0, 1.0); }`;
  const FS_DISC = `
    uniform vec3 uColor; uniform float uFade; varying vec2 vUv;
    void main() {
      float r = length(vUv);
      float fill = smoothstep(1.0, 0.2, r) * 0.07;
      float rim = smoothstep(0.06, 0.0, abs(r - 1.0)) * 0.28;
      float a = uFade * (fill + rim);
      gl_FragColor = vec4(uColor * a, a);
    }`;

  // uniforms shared by reference across materials (theme + time update once)
  const shared = {
    uTime: { value: 0 }, uDpr: { value: DPR }, uFade: { value: 1 },
    uColor: { value: new Color(0.21, 0.88, 0.78) }, uHot: { value: new Color(0.9, 0.93, 0.95) }
  };
  function material(vs, fs, alpha, extra) {
    return new ShaderMaterial({
      vertexShader: vs, fragmentShader: fs,
      uniforms: Object.assign({ uAlpha: { value: alpha } }, shared, extra || {}),
      transparent: true, depthTest: false, depthWrite: false,
      blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor   // premultiplied
    });
  }

  /* ---------- geometry ---------- */
  const SEG = 72, TAU = Math.PI * 2;
  function collector() {
    const pos = [], ext = [];
    return {
      push(p, e) { pos.push(p[0], p[1], p[2]); ext.push(e[0], e[1], e[2]); },
      seg(p, q, e) { this.push(p, e); this.push(q, e); },
      geo() {
        const g = new BufferGeometry();
        g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
        g.setAttribute("aExtra", new BufferAttribute(new Float32Array(ext), 3));
        return g;
      }
    };
  }
  function graticule() {
    const c = collector(), z = [0, 0, 0];
    for (let lat = -75; lat <= 75; lat += 15) {
      const r = Math.cos(lat * Math.PI / 180), y = Math.sin(lat * Math.PI / 180);
      for (let i = 0; i < SEG; i++) {
        const a0 = i / SEG * TAU, a1 = (i + 1) / SEG * TAU;
        c.seg([Math.cos(a0) * r, y, Math.sin(a0) * r], [Math.cos(a1) * r, y, Math.sin(a1) * r], z);
      }
    }
    for (let lon = 0; lon < 180; lon += 15) {
      const cl = Math.cos(lon * Math.PI / 180), sl = Math.sin(lon * Math.PI / 180);
      for (let i = 0; i < SEG; i++) {
        const a0 = i / SEG * TAU, a1 = (i + 1) / SEG * TAU;
        c.seg([Math.cos(a0) * cl, Math.sin(a0), Math.cos(a0) * sl], [Math.cos(a1) * cl, Math.sin(a1), Math.cos(a1) * sl], z);
      }
    }
    return c.geo();
  }
  function fibSphere(n) {
    const pts = [], g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
    }
    return pts;
  }
  function pickNodes(count) {
    const pool = fibSphere(90), out = [];
    while (out.length < count && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return out;
  }
  function nodesGeo(nodes) {
    const c = collector();
    nodes.forEach((p, i) => {
      const alert = i % 4 === 0 ? 1 : 0;
      c.push(p, [5 + Math.random() * 3 + alert * 3, Math.random(), alert]);
    });
    return c.geo();
  }
  function slerp(a, b, t) {
    const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const om = Math.acos(d), so = Math.sin(om);
    if (so < 1e-5) return a;
    const wa = Math.sin((1 - t) * om) / so, wb = Math.sin(t * om) / so;
    return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
  }
  function arcsGeo(nodes, count) {
    const c = collector(), N = 40;
    let tries = 0;
    while (count > 0 && tries++ < 400) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      const ang = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
      if (ang < 0.6 || ang > 2.4) continue;
      const h = 0.10 + 0.22 * (ang / Math.PI), phase = Math.random(), speed = 0.09 + Math.random() * 0.08;
      let prev = null;
      for (let i = 0; i <= N; i++) {
        const t = i / N, p = slerp(a, b, t), lift = 1 + h * Math.sin(t * Math.PI);
        const q = [p[0] * lift, p[1] * lift, p[2] * lift];
        if (prev) { c.push(prev[0], prev[1]); c.push(q, [t, phase, speed]); }
        prev = [q, [t, phase, speed]];
      }
      count--;
    }
    return c.geo();
  }
  function ringGeo(r, n) {
    const c = collector();
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, q = [Math.cos(t * TAU) * r, 0, Math.sin(t * TAU) * r], e = [t, 0, 0.07];
      if (prev) { c.push(prev[0], prev[1]); c.push(q, e); }
      prev = [q, e];
    }
    return c.geo();
  }

  /* ---------- scene graph ----------
     globe world matrix = Rx(cursor/scroll tip) * Rz(axial tilt) * Ry(spin) */
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 20);
  camera.position.z = DIST;
  const tilt = new Group(), globe = new Group();
  const ringTilt = new Group(), ringSpin = new Group();
  tilt.rotation.z = 0.42; tilt.add(globe);
  ringTilt.rotation.z = -0.35; ringTilt.add(ringSpin);
  scene.add(tilt, ringTilt);

  const pts = pickNodes(48);
  const objects = [
    [new Mesh(new PlaneGeometry(2, 2), material(VS_DISC, FS_DISC, 1, { uR: { value: 1.06 } })), scene],
    [new LineSegments(graticule(), material(VS, FS_LINE, 0.55)), globe],
    [new LineSegments(arcsGeo(pts, 16), material(VS, FS_ARC, 0.95)), globe],
    [new LineSegments(ringGeo(1.36, 160), material(VS, FS_ARC, 0.95)), ringSpin],
    [new Points(nodesGeo(pts), material(VS, FS_POINT, 0.9)), globe]
  ];
  objects.forEach(([obj, parent], i) => { obj.renderOrder = i; obj.frustumCulled = false; parent.add(obj); });

  /* ---------- theme (reads the CSS tokens, re-reads on toggle) ---------- */
  function hex(s, fb) {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((s || "").trim());
    if (!m) return fb;
    let h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const light = document.documentElement.getAttribute("data-theme") === "light";
    const accent = hex(cs.getPropertyValue("--accent"), [0.21, 0.88, 0.78]);
    const hot = light ? accent : hex(cs.getPropertyValue("--text"), [0.9, 0.93, 0.95]);
    shared.uColor.value.setRGB(accent[0], accent[1], accent[2]);   // raw sRGB, no conversion
    shared.uHot.value.setRGB(hot[0], hot[1], hot[2]);
    shared.uFade.value = light ? 0.85 : 1;
  }

  /* ---------- render loop ---------- */
  let mx = 0, my = 0, tx = 0, ty = 0, scrollP = 0, sized = false;
  let raf = 0, running = false, visible = false;
  const t0 = performance.now();

  function resize() {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);                 // CSS owns the element size
    const aspect = w / h, halfH = FIT / Math.min(1, aspect);
    camera.fov = 2 * Math.atan(halfH / DIST) * 180 / Math.PI;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    sized = true;
  }
  function render(now) {
    if (!sized) return;
    const time = reduceMotion ? 0 : (now - t0) / 1000;
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    const spin = time * 0.07;
    tilt.rotation.x = 0.28 + my * 0.22 + scrollP * 0.45;
    globe.rotation.y = spin + mx * 0.35;
    ringTilt.rotation.x = 0.55 + my * 0.15 + scrollP * 0.3;
    ringSpin.rotation.y = -spin * 0.5;
    shared.uTime.value = time;
    renderer.render(scene, camera);
  }
  function frame(now) { if (!running) return; render(now); raf = requestAnimationFrame(frame); }
  function start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function once() { render(performance.now()); }

  readTheme();
  resize();
  once();

  /* ---------- lifecycle ---------- */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0.02 }).observe(hero);
  } else { visible = true; start(); }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else if (visible) start();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { resize(); if (!running) once(); }).observe(box);
  } else {
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { resize(); if (!running) once(); }, 150);
    });
  }

  new MutationObserver(() => { readTheme(); if (!running) once(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if (!reduceMotion) {
    window.addEventListener("pointermove", (ev) => {
      if (ev.pointerType === "touch") return;
      tx = (ev.clientX / window.innerWidth - 0.5) * 2;
      ty = (ev.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    window.addEventListener("scroll", () => {
      scrollP = Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight));
    }, { passive: true });
  }

  // Three re-creates its GL state on restore; we just pause/resume the loop.
  canvas.addEventListener("webglcontextlost", stop);
  canvas.addEventListener("webglcontextrestored", () => { once(); if (visible) start(); });
}
