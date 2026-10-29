/* SOCWatch Portfolio — live SOC alert feed (Layer A / M3).
   A friendly, front-end-only simulation: synthetic SOC events plus reactions to
   what the visitor does on this page. Nothing is sent anywhere (backend = M4).
   CSP-safe: output via createElement + textContent, SVG via createElementNS,
   zero inline styles. Pauses when the tab is hidden; respects reduced-motion. */
(function () {
  "use strict";

  var list = document.getElementById("socList");
  var spark = document.getElementById("socSpark");
  if (!list || !spark) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var MAX_ROWS = 40;
  var BUCKETS = 32;
  var SEVS = ["high", "warn", "low", "info"];
  var counts = { all: 0, high: 0, warn: 0, low: 0, info: 0 };
  var buckets = [];
  for (var b = 0; b < BUCKETS; b++) buckets.push(0);
  var filter = "all";
  var fired = {};           // one-shot guards (scroll milestones, idle)

  /* ---------------- counters / filter ---------------- */
  var countEls = {};
  Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
    countEls[el.getAttribute("data-count")] = el;
  });
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".soc__count"));

  function renderCounts() {
    for (var k in counts) if (counts.hasOwnProperty(k) && countEls[k]) {
      countEls[k].textContent = String(counts[k]);
    }
  }
  function setFilter(sev) {
    filter = sev;
    filterBtns.forEach(function (btn) {
      var on = btn.getAttribute("data-sev") === sev;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    Array.prototype.forEach.call(list.children, function (row) {
      var show = sev === "all" || row.getAttribute("data-sev") === sev;
      row.classList.toggle("is-hidden", !show);
    });
  }
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () { setFilter(btn.getAttribute("data-sev")); });
  });

  /* ---------------- a row ---------------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function stamp(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }

  function addAlert(sev, source, msg) {
    if (SEVS.indexOf(sev) === -1) sev = "info";
    var row = document.createElement("li");
    row.className = "soc__row soc__row--" + sev + (reduceMotion ? "" : " soc__row--in");
    if (filter !== "all" && filter !== sev) row.classList.add("is-hidden");
    row.setAttribute("data-sev", sev);

    var t = document.createElement("span");
    t.className = "soc__t";
    t.textContent = stamp(new Date());

    var badge = document.createElement("span");
    badge.className = "soc__sev soc__sev--" + sev;
    badge.textContent = sev;

    var src = document.createElement("span");
    src.className = "soc__src";
    src.textContent = source;

    var m = document.createElement("span");
    m.className = "soc__msg";
    m.textContent = msg;

    row.appendChild(t);
    row.appendChild(badge);
    row.appendChild(src);
    row.appendChild(m);
    list.insertBefore(row, list.firstChild);

    while (list.children.length > MAX_ROWS) list.removeChild(list.lastChild);
    if (!reduceMotion) {
      // let the entrance animation run, then drop the class so filtering is clean
      setTimeout(function () { row.classList.remove("soc__row--in"); }, 400);
    }

    counts.all++; counts[sev]++;
    renderCounts();
    buckets[buckets.length - 1]++;
    drawSpark();
  }

  /* ---------------- sparkline (SVG) ---------------- */
  var NS = "http://www.w3.org/2000/svg";
  var W = 240, H = 48, PAD = 3;
  function drawSpark() {
    while (spark.firstChild) spark.removeChild(spark.firstChild);
    var max = 1;
    for (var i = 0; i < buckets.length; i++) if (buckets[i] > max) max = buckets[i];
    var n = buckets.length;
    var stepX = (W - PAD * 2) / (n - 1);
    function x(i) { return PAD + i * stepX; }
    function y(v) { return H - PAD - (v / max) * (H - PAD * 2); }
    var line = [], area = [];
    for (var j = 0; j < n; j++) {
      var px = x(j).toFixed(1), py = y(buckets[j]).toFixed(1);
      line.push(px + "," + py);
      area.push(px + "," + py);
    }
    area.unshift(x(0).toFixed(1) + "," + (H - PAD));
    area.push(x(n - 1).toFixed(1) + "," + (H - PAD));
    var ap = document.createElementNS(NS, "polygon");
    ap.setAttribute("class", "soc__spark-area");
    ap.setAttribute("points", area.join(" "));
    spark.appendChild(ap);
    var pl = document.createElementNS(NS, "polyline");
    pl.setAttribute("class", "soc__spark-line");
    pl.setAttribute("points", line.join(" "));
    spark.appendChild(pl);
    var dot = document.createElementNS(NS, "circle");
    dot.setAttribute("class", "soc__spark-dot");
    dot.setAttribute("cx", x(n - 1).toFixed(1));
    dot.setAttribute("cy", y(buckets[n - 1]).toFixed(1));
    dot.setAttribute("r", "2.5");
    spark.appendChild(dot);
  }
  function tickBucket() { buckets.shift(); buckets.push(0); drawSpark(); }

  /* ---------------- synthetic SOC events ---------------- */
  function octet() { return Math.floor(Math.random() * 254) + 1; }
  function fill(s) { return s.replace(/\$/g, function () { return octet(); }); }
  var POOL = [
    { sev: "high", src: "auth",    msg: "SSH brute-force blocked — src 203.0.113.$ (Rule 5712, Lvl 10)" },
    { sev: "high", src: "ids",     msg: "Suspicious outbound to known-bad host 198.51.100.$" },
    { sev: "high", src: "auth",    msg: "Account lockout after repeated failed logins" },
    { sev: "warn", src: "fim",     msg: "File-integrity change in /etc/ssh/sshd_config" },
    { sev: "warn", src: "vuln",    msg: "New CVE match on installed package (medium)" },
    { sev: "warn", src: "net",     msg: "Port scan detected from 192.0.2.$" },
    { sev: "warn", src: "auth",    msg: "Login from unrecognised device" },
    { sev: "low",  src: "geoip",   msg: "Login from a new region — flagged for review" },
    { sev: "low",  src: "tls",     msg: "Certificate expires in 14 days" },
    { sev: "low",  src: "agent",   msg: "Agent reconnected after brief timeout" },
    { sev: "info", src: "heartbeat", msg: "Heartbeat OK — 3 endpoints active" },
    { sev: "info", src: "ingest",  msg: "Log ingestion nominal (↑ events/s)" },
    { sev: "info", src: "baseline", msg: "Baseline snapshot stored" }
  ];
  // weighted so info/low are common, high is rare — reads like a real quiet SOC
  var WEIGHTS = { high: 1, warn: 3, low: 4, info: 6 };
  function pickSynthetic() {
    var bag = [];
    POOL.forEach(function (p) {
      var w = WEIGHTS[p.sev] || 1;
      for (var i = 0; i < w; i++) bag.push(p);
    });
    var p = bag[Math.floor(Math.random() * bag.length)];
    addAlert(p.sev, p.src, fill(p.msg));
  }

  /* ---------------- visitor reactions ---------------- */
  // terminal (and anything else) can push alerts through this event
  var flag3Shown = false;
  document.addEventListener("socwatch:alert", function (e) {
    var d = e.detail || {};
    addAlert(d.sev || "info", d.source || "ui", d.msg || "event");
    // flag 3 is EARNED: provoke a high-severity alert from the terminal
    // (e.g. `cat .secret` or `sudo`) and the SOC escalates — revealing it here.
    if (!flag3Shown && d.source === "terminal" && d.sev === "high") {
      flag3Shown = true;
      setTimeout(function () {
        addAlert("high", "ctf", "Access escalated — FLAG{the_soc_sees_everything} — submit it on the scoreboard");
      }, 700);
    }
  });

  // theme changes
  var root = document.documentElement;
  if ("MutationObserver" in window) {
    var lastTheme = root.getAttribute("data-theme");
    new MutationObserver(function () {
      var now = root.getAttribute("data-theme");
      if (now !== lastTheme) {
        lastTheme = now;
        addAlert("low", "ui", "Theme switched to " + (now === "light" ? "light" : "dark"));
      }
    }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // scroll-depth milestones (one-shot each)
  window.addEventListener("scroll", function () {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - doc.clientHeight;
    if (scrollable <= 0) return;
    var pct = Math.round((doc.scrollTop || document.body.scrollTop) / scrollable * 100);
    [25, 50, 75, 100].forEach(function (mark) {
      if (pct >= mark && !fired["scroll" + mark]) {
        fired["scroll" + mark] = true;
        addAlert("info", "tracker", "Visitor reached " + mark + "% scroll depth");
      }
    });
  }, { passive: true });

  // clipboard copy (friendly nudge)
  document.addEventListener("copy", function () {
    addAlert("warn", "dlp", "Clipboard copy observed — relax, nothing leaves your browser");
  });

  // idle watcher
  var idleTimer = null;
  function resetIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      addAlert("low", "tracker", "Visitor idle — still watching");
    }, 45000);
  }
  ["mousemove", "keydown", "scroll", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, resetIdle, { passive: true });
  });

  /* ---------------- clock ---------------- */
  var synthTimer = null, bucketTimer = null;
  function schedSynthetic() {
    var delay = 3500 + Math.random() * 4000;
    synthTimer = setTimeout(function () { pickSynthetic(); schedSynthetic(); }, delay);
  }
  function start() {
    if (!bucketTimer) bucketTimer = setInterval(tickBucket, 2000);
    if (!synthTimer) schedSynthetic();
  }
  function stop() {
    if (bucketTimer) { clearInterval(bucketTimer); bucketTimer = null; }
    if (synthTimer) { clearTimeout(synthTimer); synthTimer = null; }
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  /* ---------------- boot ---------------- */
  renderCounts();
  drawSpark();
  var anon = Math.floor(1000 + Math.random() * 9000);
  addAlert("info", "session", "Session opened — visitor fingerprint anon-" + anon);
  addAlert("info", "heartbeat", "SOC online — monitoring this page");
  resetIdle();
  if (!document.hidden) start();
})();
