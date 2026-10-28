/* SOCWatch — 3D hero: "Threat Globe".
   Raw WebGL, zero dependencies, CSP-safe (no inline, no CDN, no style attrs).
   Decorative only: the canvas is aria-hidden and pointer-events: none.
   - Wireframe graticule globe, sensor nodes, threat-flow arcs, orbit ring.
   - Reacts subtly to cursor (tilt) and scroll (tip forward).
   - Pauses when offscreen / tab hidden; DPR capped at 2.
   - prefers-reduced-motion: renders one static frame, no animation loop.
   ponytail: raw WebGL instead of Three.js — the scene is lines + points only,
   so a renderer dependency (~115 KB gzip) would be dead weight. Swap in Three
   if the scene ever needs meshes, lighting or post-processing. */
(function () {
  "use strict";

  var canvas = document.getElementById("heroGlobe");
  var hero = document.getElementById("hero");
  if (!canvas || !hero) return;
  var box = canvas.parentNode;
  var gl = canvas.getContext("webgl", { antialias: true, alpha: true, powerPreference: "low-power" });
  if (!gl) { box.classList.add("is-unavailable"); return; }

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var DIST = 3.8;            // camera distance (globe radius = 1)
  var FIT = 1.5;             // world units that must fit in the shorter axis

  /* ---------- tiny column-major mat4 ---------- */
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
  function rotZ(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
  function translate(x, y, z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); }
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }

  /* ---------- shaders ----------
     Vertex layout (stride 6 floats): aPos.xyz, aExtra.xyz
     aExtra = [t along arc | point size, phase, speed | alert flag] */
  var VS = [
    "attribute vec3 aPos; attribute vec3 aExtra;",
    "uniform mat4 uMVP; uniform mat4 uModel; uniform float uTime; uniform float uDpr;",
    "varying float vFace; varying vec3 vExtra;",
    "void main(){",
    "  vec3 wp = (uModel * vec4(aPos, 1.0)).xyz;",
    "  vFace = normalize(wp).z;",                        // +1 facing camera, -1 far side
    "  vExtra = aExtra;",
    "  gl_Position = uMVP * vec4(aPos, 1.0);",
    "  float pulse = 0.5 + 0.5 * sin(uTime * 1.6 + aExtra.y * 6.2831);",
    "  gl_PointSize = uDpr * aExtra.x * (0.75 + 0.25 * pulse * aExtra.z) * (0.55 + 0.45 * smoothstep(-0.3, 0.6, vFace));",
    "}"
  ].join("\n");

  // highp to match the vertex-shader uniform precision (link fails otherwise)
  var FS_HEAD = "precision highp float; uniform vec3 uColor; uniform vec3 uHot; uniform float uAlpha; uniform float uTime; varying float vFace; varying vec3 vExtra;\n";

  var FS_LINE = FS_HEAD + [
    "void main(){",
    "  float a = uAlpha * (0.10 + 0.90 * smoothstep(-0.15, 0.6, vFace));",
    "  gl_FragColor = vec4(uColor * a, a);",
    "}"
  ].join("\n");

  var FS_ARC = FS_HEAD + [
    "void main(){",
    "  float head = fract(uTime * vExtra.z + vExtra.y) * 1.6;",   // 1.0..1.6 = rest gap
    "  float d = head - vExtra.x;",
    "  float comet = step(0.0, d) * smoothstep(0.35, 0.0, d);",
    "  float face = 0.2 + 0.8 * smoothstep(-0.2, 0.5, vFace);",
    "  float a = uAlpha * (0.14 + 0.9 * comet) * face;",
    "  gl_FragColor = vec4(mix(uColor, uHot, comet * 0.55) * a, a);",
    "}"
  ].join("\n");

  var FS_POINT = FS_HEAD + [
    "void main(){",
    "  float r = length(gl_PointCoord - 0.5) * 2.0;",
    "  float core = smoothstep(0.55, 0.15, r);",
    "  float glow = smoothstep(1.0, 0.3, r) * 0.35;",
    "  float face = 0.15 + 0.85 * smoothstep(-0.2, 0.5, vFace);",
    "  float pulse = 0.5 + 0.5 * sin(uTime * 1.6 + vExtra.y * 6.2831);",
    "  float a = uAlpha * (core + glow) * face * (0.7 + 0.3 * pulse * vExtra.z);",
    "  gl_FragColor = vec4(mix(uColor, uHot, core * 0.35 * vExtra.z) * a, a);",
    "}"
  ].join("\n");

  /* camera-facing disc: soft inner fill + thin limb glow */
  var VS_DISC = "attribute vec2 aPos; uniform mat4 uPV; uniform float uR; varying vec2 vUv; void main(){ vUv = aPos * uR; gl_Position = uPV * vec4(aPos * uR, 0.0, 1.0); }";
  var FS_DISC = [
    "precision highp float; uniform vec3 uColor; uniform float uAlpha; varying vec2 vUv;",
    "void main(){",
    "  float r = length(vUv);",
    "  float fill = smoothstep(1.0, 0.2, r) * 0.07;",
    "  float rim = smoothstep(0.06, 0.0, abs(r - 1.0)) * 0.28;",
    "  float a = uAlpha * (fill + rim);",
    "  gl_FragColor = vec4(uColor * a, a);",
    "}"
  ].join("\n");

  function program(vs, fs, alpha) {
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "aPos");
    gl.bindAttribLocation(p, 1, "aExtra");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {};
    ["uMVP", "uModel", "uPV", "uR", "uTime", "uDpr", "uAlpha", "uColor", "uHot"].forEach(function (n) {
      u[n] = gl.getUniformLocation(p, n);         // null when absent; uniform*() then no-ops
    });
    return { prog: p, u: u, alpha: alpha };
  }

  /* ---------- geometry ---------- */
  var SEG = 72, TAU = Math.PI * 2;
  function graticule() {
    var v = [], i, lat, lon, a0, a1;
    function seg(p, q) { v.push(p[0], p[1], p[2], 0, 0, 0, q[0], q[1], q[2], 0, 0, 0); }
    for (lat = -75; lat <= 75; lat += 15) {
      var r = Math.cos(lat * Math.PI / 180), y = Math.sin(lat * Math.PI / 180);
      for (i = 0; i < SEG; i++) {
        a0 = i / SEG * TAU; a1 = (i + 1) / SEG * TAU;
        seg([Math.cos(a0) * r, y, Math.sin(a0) * r], [Math.cos(a1) * r, y, Math.sin(a1) * r]);
      }
    }
    for (lon = 0; lon < 180; lon += 15) {
      var cl = Math.cos(lon * Math.PI / 180), sl = Math.sin(lon * Math.PI / 180);
      for (i = 0; i < SEG; i++) {
        a0 = i / SEG * TAU; a1 = (i + 1) / SEG * TAU;
        seg([Math.cos(a0) * cl, Math.sin(a0), Math.cos(a0) * sl], [Math.cos(a1) * cl, Math.sin(a1), Math.cos(a1) * sl]);
      }
    }
    return new Float32Array(v);
  }
  function fibSphere(n) {
    var pts = [], g = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
    }
    return pts;
  }
  function pickNodes(count) {
    var pool = fibSphere(90), out = [];
    while (out.length < count && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return out;
  }
  function nodeBuffer(nodes) {
    var v = [];
    nodes.forEach(function (p, i) {
      var alert = i % 4 === 0 ? 1 : 0;
      v.push(p[0], p[1], p[2], 5 + Math.random() * 3 + alert * 3, Math.random(), alert);
    });
    return new Float32Array(v);
  }
  function slerp(a, b, t) {
    var d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    var om = Math.acos(d), so = Math.sin(om);
    if (so < 1e-5) return a;
    var wa = Math.sin((1 - t) * om) / so, wb = Math.sin(t * om) / so;
    return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
  }
  function arcBuffer(nodes, count) {
    var v = [], tries = 0, N = 40;
    while (count > 0 && tries++ < 400) {
      var a = nodes[Math.floor(Math.random() * nodes.length)];
      var b = nodes[Math.floor(Math.random() * nodes.length)];
      var ang = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
      if (ang < 0.6 || ang > 2.4) continue;
      var h = 0.10 + 0.22 * (ang / Math.PI), phase = Math.random(), speed = 0.09 + Math.random() * 0.08, prev = null;
      for (var i = 0; i <= N; i++) {
        var t = i / N, p = slerp(a, b, t), lift = 1 + h * Math.sin(t * Math.PI);
        var q = [p[0] * lift, p[1] * lift, p[2] * lift, t, phase, speed];
        if (prev) { v.push.apply(v, prev); v.push.apply(v, q); }
        prev = q;
      }
      count--;
    }
    return new Float32Array(v);
  }
  function ringBuffer(r, n) {
    var v = [], prev = null;
    for (var i = 0; i <= n; i++) {
      var t = i / n, q = [Math.cos(t * TAU) * r, 0, Math.sin(t * TAU) * r, t, 0, 0.07];
      if (prev) { v.push.apply(v, prev); v.push.apply(v, q); }
      prev = q;
    }
    return new Float32Array(v);
  }
  function buffer(data) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { buf: b, n: data.length / 6 };
  }

  /* ---------- theme (reads the CSS tokens, re-reads on toggle) ---------- */
  var theme = { accent: [0.21, 0.88, 0.78], hot: [0.9, 0.93, 0.95], alpha: 1 };
  function hex(s, fb) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((s || "").trim());
    if (!m) return fb;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    var light = document.documentElement.getAttribute("data-theme") === "light";
    theme.accent = hex(cs.getPropertyValue("--accent"), theme.accent);
    theme.hot = light ? theme.accent : hex(cs.getPropertyValue("--text"), theme.hot);
    theme.alpha = light ? 0.85 : 1;
  }

  /* ---------- scene state ---------- */
  var progLine, progArc, progPoint, progDisc, grat, arcs, ring, nodes, quad;
  var P, PV, W = 0, H = 0;
  var mx = 0, my = 0, tx = 0, ty = 0, scrollP = 0, t0 = performance.now();
  var raf = 0, running = false, visible = false;

  function init() {
    progLine = program(VS, FS_LINE, 0.55);
    progArc = program(VS, FS_ARC, 0.95);
    progPoint = program(VS, FS_POINT, 0.9);
    progDisc = program(VS_DISC, FS_DISC, 1);
    var pts = pickNodes(48);
    grat = buffer(graticule());
    arcs = buffer(arcBuffer(pts, 16));
    ring = buffer(ringBuffer(1.36, 160));
    nodes = buffer(nodeBuffer(pts));
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  }

  function resize() {
    var w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    W = Math.round(w * DPR); H = Math.round(h * DPR);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    var aspect = w / h, halfH = FIT / Math.min(1, aspect);
    P = perspective(2 * Math.atan(halfH / DIST), aspect, 0.1, 20);
    PV = mul(P, translate(0, 0, -DIST));
  }

  function draw(p, b, M, mode, time) {
    gl.useProgram(p.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.uniformMatrix4fv(p.u.uMVP, false, mul(PV, M));
    gl.uniformMatrix4fv(p.u.uModel, false, M);
    gl.uniform1f(p.u.uTime, time);
    gl.uniform1f(p.u.uDpr, DPR);
    gl.uniform1f(p.u.uAlpha, p.alpha * theme.alpha);
    gl.uniform3fv(p.u.uColor, theme.accent);
    gl.uniform3fv(p.u.uHot, theme.hot);
    gl.drawArrays(mode, 0, b.n);
  }
  function drawDisc() {
    gl.useProgram(progDisc.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.disableVertexAttribArray(1);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(progDisc.u.uPV, false, PV);
    gl.uniform1f(progDisc.u.uR, 1.06);
    gl.uniform1f(progDisc.u.uAlpha, theme.alpha);
    gl.uniform3fv(progDisc.u.uColor, theme.accent);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function render(now) {
    if (!PV) return;
    var time = reduceMotion ? 0 : (now - t0) / 1000;
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    var spin = time * 0.07;
    // globe: spin about its own axis, 24deg axial tilt, cursor/scroll tip
    var M = mul(rotX(0.28 + my * 0.22 + scrollP * 0.45), mul(rotZ(0.42), rotY(spin + mx * 0.35)));
    // orbit ring: slim ellipse, counter-rotating sweep
    var R = mul(rotX(0.55 + my * 0.15 + scrollP * 0.3), mul(rotZ(-0.35), rotY(-spin * 0.5)));
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);     // premultiplied output
    drawDisc();
    draw(progLine, grat, M, gl.LINES, time);
    draw(progArc, arcs, M, gl.LINES, time);
    draw(progArc, ring, R, gl.LINES, time);
    draw(progPoint, nodes, M, gl.POINTS, time);
  }

  function frame(now) { if (!running) return; render(now); raf = requestAnimationFrame(frame); }
  function start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function once() { render(performance.now()); }

  try { init(); } catch (e) { box.classList.add("is-unavailable"); return; }
  readTheme();
  resize();
  once();

  /* ---------- lifecycle ---------- */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0.02 }).observe(hero);
  } else { visible = true; start(); }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else if (visible) start();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(function () { resize(); if (!running) once(); }).observe(box);
  } else {
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resize(); if (!running) once(); }, 150);
    });
  }

  new MutationObserver(function () { readTheme(); if (!running) once(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if (!reduceMotion) {
    window.addEventListener("pointermove", function (ev) {
      if (ev.pointerType === "touch") return;
      tx = (ev.clientX / window.innerWidth - 0.5) * 2;
      ty = (ev.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    window.addEventListener("scroll", function () {
      scrollP = Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight));
    }, { passive: true });
  }

  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); });
  canvas.addEventListener("webglcontextrestored", function () {
    try { init(); } catch (e) { box.classList.add("is-unavailable"); return; }
    resize(); once();
    if (visible) start();
  });
})();
