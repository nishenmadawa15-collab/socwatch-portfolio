/* SOCWatch Portfolio — behaviour (M0 + M1).
   No frameworks, no inline (CSP-safe): styles set via CSSOM, SVG built with
   createElementNS. Terminal / alert feed / backend arrive in M2-M4. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- theme toggle (persisted) ---------------- */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var label = toggle ? toggle.querySelector("[data-theme-label]") : null;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (label) label.textContent = theme === "light" ? "Light" : "Dark";
  }
  try {
    var saved = localStorage.getItem("socwatch-theme");
    if (saved) applyTheme(saved);
  } catch (e) { /* storage blocked */ }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("socwatch-theme", next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------------- active section highlight ---------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  var byId = {};
  links.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (id) byId[id] = a;
  });
  if ("IntersectionObserver" in window && links.length) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (link && entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("is-active"); });
          link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["about", "skills", "projects", "contact"].forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) navObs.observe(sec);
    });
  }

  /* ---------------- scroll reveal + bar fills ---------------- */
  function fillBars(scope) {
    var fills = scope.querySelectorAll(".bar__fill");
    Array.prototype.forEach.call(fills, function (f) {
      var v = parseInt(f.getAttribute("data-value"), 10) || 0;
      f.style.width = v + "%";               // CSSOM — allowed under strict CSP
    });
  }
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        fillBars(entry.target);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    Array.prototype.forEach.call(revealEls, function (el) { revObs.observe(el); });
  } else {
    Array.prototype.forEach.call(revealEls, function (el) {
      el.classList.add("is-visible");
      fillBars(el);
    });
  }

  /* ---------------- capability radar (SVG, data-driven) ---------------- */
  (function buildRadar() {
    var svg = document.getElementById("capabilityRadar");
    if (!svg) return;
    var NS = "http://www.w3.org/2000/svg";
    var cx = 160, cy = 150, R = 100;
    var data = [
      { label: "SOC", v: 0.80 },
      { label: "AWS", v: 0.85 },
      { label: "Linux", v: 0.75 },
      { label: "Net", v: 0.70 },
      { label: "Web", v: 0.70 },
      { label: "CTF", v: 0.65 }
    ];
    var n = data.length;
    function pt(i, r) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }
    function points(r) {
      var p = [];
      for (var i = 0; i < n; i++) { var xy = pt(i, r); p.push(xy[0].toFixed(1) + "," + xy[1].toFixed(1)); }
      return p.join(" ");
    }
    function el(name, cls, attrs) {
      var e = document.createElementNS(NS, name);
      if (cls) e.setAttribute("class", cls);
      for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
      return e;
    }
    [0.33, 0.66, 1].forEach(function (f) {
      svg.appendChild(el("polygon", "radar-grid", { points: points(R * f) }));
    });
    for (var i = 0; i < n; i++) {
      var end = pt(i, R);
      svg.appendChild(el("line", "radar-axis", { x1: cx, y1: cy, x2: end[0].toFixed(1), y2: end[1].toFixed(1) }));
      var lp = pt(i, R + 20);
      var anchor = Math.abs(lp[0] - cx) < 10 ? "middle" : (lp[0] > cx ? "start" : "end");
      var t = el("text", "radar-label", { x: lp[0].toFixed(1), y: (lp[1] + 4).toFixed(1), "text-anchor": anchor });
      t.textContent = data[i].label;
      svg.appendChild(t);
    }
    var dp = [];
    for (var j = 0; j < n; j++) { var xy = pt(j, R * data[j].v); dp.push(xy[0].toFixed(1) + "," + xy[1].toFixed(1)); }
    svg.appendChild(el("polygon", "radar-area", { points: dp.join(" ") }));
    for (var k = 0; k < n; k++) {
      var d = pt(k, R * data[k].v);
      svg.appendChild(el("circle", "radar-dot", { cx: d[0].toFixed(1), cy: d[1].toFixed(1), r: 3 }));
    }
  })();

  /* ---------------- hero tagline typing (once) ---------------- */
  (function typeHero() {
    var elc = document.getElementById("heroTagline");
    if (!elc) return;
    var text = elc.getAttribute("data-text") || elc.textContent;
    if (reduceMotion) { elc.textContent = text; return; }
    elc.textContent = "";
    var caret = document.createElement("span");
    caret.className = "type-caret";
    caret.textContent = "▋";
    elc.appendChild(caret);
    var i = 0;
    (function step() {
      if (i < text.length) {
        caret.insertAdjacentText("beforebegin", text.charAt(i));
        i++;
        setTimeout(step, 45);
      } else {
        setTimeout(function () { if (caret.parentNode) caret.parentNode.removeChild(caret); }, 1400);
      }
    })();
  })();

  /* ---------------- hero radar canvas (network + sweep) ---------------- */
  (function heroCanvas() {
    var canvas = document.getElementById("heroRadar");
    var hero = document.getElementById("hero");
    if (!canvas || !hero) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, cx = 0, cy = 0, nodes = [], sweep = 0;
    var running = false, raf = null;
    var mouse = { x: -9999, y: -9999 };

    function resize() {
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
    }
    function initNodes() {
      nodes = [];
      var count = Math.round(Math.min(26, Math.max(12, w / 55)));
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
          r: 1.2 + Math.random() * 1.8
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      // concentric rings
      ctx.strokeStyle = "rgba(53,224,200,0.07)";
      ctx.lineWidth = 1;
      for (var ring = 70; ring < Math.max(w, h); ring += 90) {
        ctx.beginPath(); ctx.arc(cx, cy, ring, 0, Math.PI * 2); ctx.stroke();
      }
      // rotating sweep wedge
      sweep += 0.012;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(sweep);
      var reach = Math.hypot(w, h);
      var g = ctx.createLinearGradient(0, 0, reach, 0);
      g.addColorStop(0, "rgba(53,224,200,0)");
      g.addColorStop(1, "rgba(53,224,200,0.10)");
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.arc(0, 0, reach, -0.22, 0); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
      // update nodes (subtle cursor attraction)
      var i, nd;
      for (i = 0; i < nodes.length; i++) {
        nd = nodes[i];
        var dxm = mouse.x - nd.x, dym = mouse.y - nd.y, dm = Math.hypot(dxm, dym);
        if (dm < 160 && dm > 0.01) { nd.vx += (dxm / dm) * 0.02; nd.vy += (dym / dm) * 0.02; }
        nd.vx *= 0.98; nd.vy *= 0.98;
        nd.x += nd.vx; nd.y += nd.vy;
        if (nd.x < 0 || nd.x > w) nd.vx *= -1;
        if (nd.y < 0 || nd.y > h) nd.vy *= -1;
        nd.x = Math.max(0, Math.min(w, nd.x));
        nd.y = Math.max(0, Math.min(h, nd.y));
      }
      // links
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.strokeStyle = "rgba(53,224,200," + (0.12 * (1 - d / 120)).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
          }
        }
      }
      // node dots
      ctx.fillStyle = "rgba(53,224,200,0.75)";
      for (var k = 0; k < nodes.length; k++) {
        ctx.beginPath(); ctx.arc(nodes[k].x, nodes[k].y, nodes[k].r, 0, Math.PI * 2); ctx.fill();
      }
    }
    function frame() { if (!running) return; draw(); raf = requestAnimationFrame(frame); }
    function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    resize(); initNodes();

    if (reduceMotion) { draw(); return; }   // single static frame

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
      }, { threshold: 0.02 }).observe(hero);
    } else { start(); }

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resize(); initNodes(); }, 150);
    });
    window.addEventListener("pointermove", function (ev) {
      var r = hero.getBoundingClientRect();
      mouse.x = ev.clientX - r.left; mouse.y = ev.clientY - r.top;
    });
    hero.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
  })();
})();
