/* SOCWatch Portfolio — M0 behaviour.
   Kept tiny on purpose: terminal, alert feed and backend arrive in M2–M4. */
(function () {
  "use strict";

  // --- current year in footer ---
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // --- theme toggle (persisted) ---
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
  } catch (e) { /* storage blocked — default theme stays */ }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("socwatch-theme", next); } catch (e) { /* ignore */ }
    });
  }

  // --- active section highlight in nav ---
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  var byId = {};
  links.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (id) byId[id] = a;
  });

  if ("IntersectionObserver" in window && links.length) {
    var obs = new IntersectionObserver(function (entries) {
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
      if (sec) obs.observe(sec);
    });
  }
})();
