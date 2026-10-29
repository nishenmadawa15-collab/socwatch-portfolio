/* SOCWatch Portfolio — mini-CTF scoreboard (Layer C / M4 front-end).
   Talks to the Lambda Function URL in config.js (backendUrl). Flags are
   validated server-side; this only submits and renders the leaderboard.
   Degrades gracefully to an "offline" state when no backendUrl is set or the
   backend is unreachable. CSP-safe: DOM via createElement + textContent, and
   the fetch target must be in customHttp.yml connect-src (added at deploy). */
(function () {
  "use strict";

  var form = document.getElementById("ctfForm");
  var handleEl = document.getElementById("ctfHandle");
  var flagEl = document.getElementById("ctfFlag");
  var submitEl = document.getElementById("ctfSubmit");
  var msgEl = document.getElementById("ctfMsg");
  var body = document.getElementById("ctfBody");
  var emptyEl = document.getElementById("ctfEmpty");
  var table = document.getElementById("ctfBoard");
  if (!form || !body) return;

  var cfg = (window.SOCWATCH_CONFIG || {});
  var base = (cfg.backendUrl || "").replace(/\/+$/, "");

  function setMsg(text, kind) {
    msgEl.textContent = text || "";
    msgEl.className = "ctf__msg" + (kind ? " ctf__msg--" + kind : "");
  }
  function showBoard(show) {
    table.hidden = !show;
    emptyEl.hidden = show;
  }

  /* ---- offline: no backend configured yet ---- */
  if (!base) {
    showBoard(false);
    submitEl.disabled = true;
    submitEl.textContent = "Scoreboard offline";
    return;
  }

  /* restore last handle */
  try {
    var saved = localStorage.getItem("socwatch-handle");
    if (saved && !handleEl.value) handleEl.value = saved;
  } catch (e) { /* ignore */ }

  function renderBoard(rows) {
    body.textContent = "";
    if (!rows || !rows.length) {
      showBoard(false);
      emptyEl.hidden = false;
      emptyEl.textContent = "No captures yet — be the first on the board.";
      return;
    }
    rows.forEach(function (r, i) {
      var tr = document.createElement("tr");
      var mine = false;
      try { mine = r.handle === localStorage.getItem("socwatch-handle"); } catch (e) {}
      if (mine) tr.className = "is-me";
      cell(tr, String(i + 1));
      cell(tr, r.handle);
      cell(tr, (r.solved && r.solved.length ? r.solved.length : 0) + "/3");
      cell(tr, String(r.score));
      body.appendChild(tr);
    });
    showBoard(true);
  }
  function cell(tr, text) {
    var td = document.createElement("td");
    td.textContent = text;
    tr.appendChild(td);
  }

  function loadBoard() {
    fetch(base + "/", { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok) renderBoard(d.scoreboard); })
      .catch(function () {
        showBoard(false);
        emptyEl.hidden = false;
        emptyEl.textContent = "Scoreboard unreachable right now — try again shortly.";
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var handle = handleEl.value.trim();
    var flag = flagEl.value.trim();
    if (!handle || handle.length < 2) { setMsg("Pick a handle (2–24 characters).", "err"); return; }
    if (!flag) { setMsg("Paste a flag first.", "err"); return; }

    try { localStorage.setItem("socwatch-handle", handle); } catch (e2) { /* ignore */ }
    submitEl.disabled = true;
    setMsg("Submitting…", "muted");

    fetch(base + "/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: handle, flag: flag })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d) { setMsg("No response — try again.", "err"); return; }
        if (d.ok === false) { setMsg(d.error || "Flag not recognised.", "err"); return; }
        if (d.already) {
          setMsg("Already captured [" + d.id + "] — score " + d.score + ", rank #" + d.rank + ".", "muted");
        } else {
          setMsg("Captured [" + d.id + "] +" + d.awarded + " — score " + d.score +
                 ", rank #" + d.rank + " of " + d.total + ". " + (d.solved.length) + "/3 flags.", "ok");
          flagEl.value = "";
        }
        loadBoard();
      })
      .catch(function () { setMsg("Submission failed — the backend may be offline.", "err"); })
      .then(function () { submitEl.disabled = false; });
  });

  loadBoard();
})();
