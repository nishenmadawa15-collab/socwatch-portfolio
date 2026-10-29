/* SOCWatch Portfolio — hidden SOC terminal (Layer B / M2).
   No frameworks, no inline (CSP-safe): markup lives in index.html, styling in
   styles.css, output rendered with createElement + textContent (never innerHTML).
   Toggle with ` or ~ (or the hero button); close with Esc / the close button /
   the `exit` command. Command parser + history (up/down) + Tab completion. */
(function () {
  "use strict";

  var term = document.getElementById("term");
  var screenEl = document.getElementById("termScreen");
  var output = document.getElementById("termOutput");
  var input = document.getElementById("termInput");
  if (!term || !screenEl || !output || !input) return;

  var openBtn = document.getElementById("termOpen");
  var closeBtn = document.getElementById("termClose");

  var history = [];       // committed commands, oldest first
  var histIdx = 0;        // cursor into history (== length means "new line")
  var draft = "";         // in-progress line stashed when walking history
  var lastFocus = null;   // element to restore focus to on close

  /* ---------------- output helpers ---------------- */
  function line(text, cls) {
    var div = document.createElement("div");
    div.className = "term__line" + (cls ? " term__line--" + cls : "");
    div.textContent = text;
    output.appendChild(div);
    return div;
  }
  function block(text) {           // preserves whitespace (banners, art)
    var pre = document.createElement("pre");
    pre.className = "term__pre";
    pre.textContent = text;
    output.appendChild(pre);
    return pre;
  }
  function print(value, cls) {
    if (value == null) return;
    String(value).split("\n").forEach(function (l) { line(l, cls); });
  }
  function echo(cmd) {
    var row = document.createElement("div");
    row.className = "term__line term__echo";
    var ps1 = document.createElement("span");
    ps1.className = "term__ps1";
    ps1.textContent = PS1;
    var c = document.createElement("span");
    c.className = "term__cmd";
    c.textContent = " " + cmd;
    row.appendChild(ps1);
    row.appendChild(c);
    output.appendChild(row);
  }
  function scrollDown() { screenEl.scrollTop = screenEl.scrollHeight; }

  var PS1 = "visitor@socwatch:~$";

  /* ---------------- virtual files ---------------- */
  var FILES = {
    "about.txt":
      "Nishen Madava Abedeera — BSc (Hons) Cyber Security @ SLTC (2024-2028), Matara, LK.\n" +
      "Blue team first (SOC / detection & response), comfortable on offense too.\n" +
      "CodeZela internship: built a Wazuh 4.14 SIEM lab on AWS. TryHackMe Top 1%.",
    "skills.txt":
      "SOC & SIEM (Wazuh)  ****  AWS & Cloud  ****  Linux & Bash\n" +
      "Networking  ***  Web dev (HTML/CSS/JS)  ***  CTF & forensics\n" +
      "Tooling: Burp, ZAP, Nmap, Wireshark, Nessus, Metasploit, Hydra, John.",
    "contact.txt":
      "email    nishenmadawa15@gmail.com\n" +
      "github   github.com/nishenmadawa15-collab\n" +
      "linkedin linkedin.com/in/nishen-madava\n" +
      "thm      tryhackme.com/p/VoidInjector",
    ".secret":
      "# classified — blue-team eyes only\n" +
      "Nice recon. Most visitors never even open the terminal.\n" +
      "FLAG{deeper_than_view_source}\n" +
      "Flag submission + the Blue-Team scoreboard unlock in milestone M4."
  };

  var BANNER =
    "  ___  ___   ___ _      __    _       _\n" +
    " / __|/ _ \\ / __| |    / /\\ | |_ __ | |_\n" +
    " \\__ \\ (_) | (__| |   / /_\\ \\ __/ _|| ' \\\n" +
    " |___/\\___/ \\___|_|  /_/  \\_\\__\\__||_||_|  SOCWatch\n" +
    "            the portfolio that watches you back";

  /* ---------------- commands ---------------- */
  var commands = {
    help: function () {
      print([
        "Available commands:",
        "  help               this list",
        "  whoami             who you are (and who's watching)",
        "  about              about Nishen",
        "  skills             core competencies",
        "  projects           project & achievement list",
        "  contact            how to reach Nishen",
        "  ls                 list files",
        "  cat <file>         print a file",
        "  goto <section>     jump to a page section",
        "  theme [dark|light] switch colour theme",
        "  banner             print the SOCWatch banner",
        "  date               current timestamp",
        "  history            command history",
        "  ctf                about the mini-CTF",
        "  scoreboard         Blue-Team scoreboard status",
        "  clear              clear the screen",
        "  exit               close the terminal"
      ].join("\n"));
      print("Tip: Tab completes, ↑/↓ walks history. Recon pays off.", "muted");
    },
    whoami: function () {
      print("visitor — role: unprivileged / read-only.");
      print("You're being observed by the SOC. Friendly, never creepy.", "muted");
      print("Operator on duty: Nishen Madava Abedeera — SOC analyst & pentester.", "accent");
    },
    about: function () { print(FILES["about.txt"]); },
    skills: function () { print(FILES["skills.txt"]); },
    contact: function () { print(FILES["contact.txt"]); },
    projects: function () {
      print([
        "projects/",
        "  1  SOCWatch Lab      Wazuh SIEM on AWS (CodeZela internship)",
        "  2  SOCWatch Portfolio this site — Amplify + Lambda + DynamoDB",
        "  3  CTF & competitions THM Top 1%, ANIMUS 1.0 CTF 5th nationally",
        "  4  NexSkill          internship matching (React/Node)",
        "  5  Southern Plant +  secure full-stack + Chrome tools"
      ].join("\n"));
      print("Run 'goto projects' to open the projects section.", "muted");
    },
    ls: function (args) {
      if (args[0] === "projects" || args[0] === "projects/") { commands.projects(); return; }
      print("about.txt   skills.txt   projects/   contact.txt   .secret");
    },
    cat: function (args) {
      var name = args[0];
      if (!name) { print("usage: cat <file>  — try 'ls'", "err"); return; }
      if (name === "projects" || name === "projects/") { print("cat: projects/: Is a directory — try 'ls projects'", "err"); return; }
      if (FILES.hasOwnProperty(name)) {
        print(FILES[name], name === ".secret" ? "flag" : null);
      } else {
        print("cat: " + name + ": No such file. try 'ls'", "err");
      }
    },
    goto: function (args) {
      var map = { top: "top", hero: "top", about: "about", skills: "skills",
                  superpowers: "skills", projects: "projects", contact: "contact" };
      var target = map[(args[0] || "").toLowerCase()];
      if (!target) { print("usage: goto <about|skills|projects|contact|top>", "err"); return; }
      var el = document.getElementById(target);
      if (!el) { print("section not found.", "err"); return; }
      print("navigating → #" + target, "muted");
      close();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof el.focus === "function") { el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); }
    },
    theme: function (args) {
      var root = document.documentElement;
      var want = (args[0] || "").toLowerCase();
      var next = want === "dark" || want === "light"
        ? want
        : (root.getAttribute("data-theme") === "light" ? "dark" : "light");
      root.setAttribute("data-theme", next);
      var label = document.querySelector("#themeToggle [data-theme-label]");
      if (label) label.textContent = next === "light" ? "Light" : "Dark";
      try { localStorage.setItem("socwatch-theme", next); } catch (e) { /* ignore */ }
      print("theme set to " + next + ".", "accent");
    },
    banner: function () { block(BANNER); },
    date: function () { print(new Date().toString()); },
    history: function () {
      if (!history.length) { print("(empty)", "muted"); return; }
      history.forEach(function (c, i) { print("  " + (i + 1) + "  " + c); });
    },
    ctf: function () {
      print([
        "SOCWatch mini-CTF — 3 flags hidden across this site:",
        "  [1] in the page source        (view-source: pays off)",
        "  [2] right here in the terminal (you're warm — try 'ls', then 'cat')",
        "  [3] earned, not given          (arrives with the alert feed)"
      ].join("\n"));
      print("Scoreboard + flag submission go live in milestone M4 (Lambda + DynamoDB).", "muted");
    },
    scoreboard: function () {
      print("Blue-Team scoreboard: OFFLINE.", "err");
      print("Backend (AWS Lambda Function URL + DynamoDB) deploys in milestone M4.");
      print("Nothing to rank yet — but the flags are already live. Keep hunting.", "muted");
    },
    clear: function () { output.textContent = ""; },
    exit: function () { print("logging out…", "muted"); close(); },
    quit: function () { commands.exit(); },
    sudo: function () {
      print("visitor is not in the sudoers file. This incident has been logged. 🛡️", "err");
    }
  };
  commands["cls"] = commands.clear;
  commands["ll"] = commands.ls;

  var NAMES = Object.keys(commands).concat(["help"]).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();

  /* ---------------- run a line ---------------- */
  function run(raw) {
    var cmd = raw.trim();
    echo(raw);
    if (cmd) {
      if (history[history.length - 1] !== cmd) history.push(cmd);
      var parts = cmd.split(/\s+/);
      var name = parts[0].toLowerCase();
      var args = parts.slice(1);
      if (commands.hasOwnProperty(name)) {
        try { commands[name](args); }
        catch (e) { print("internal error running '" + name + "'.", "err"); }
      } else {
        print(name + ": command not found. type 'help'.", "err");
      }
    }
    histIdx = history.length;
    draft = "";
    scrollDown();
  }

  /* ---------------- tab completion (first token) ---------------- */
  function complete() {
    var val = input.value;
    if (/\s/.test(val)) return;               // only completes the command name
    var frag = val.toLowerCase();
    if (!frag) { print("commands: " + NAMES.join("  "), "muted"); scrollDown(); return; }
    var hits = NAMES.filter(function (n) { return n.indexOf(frag) === 0; });
    if (hits.length === 1) {
      input.value = hits[0] + " ";
    } else if (hits.length > 1) {
      var prefix = commonPrefix(hits);
      if (prefix.length > val.length) input.value = prefix;
      echo(val);
      print(hits.join("  "), "muted");
      scrollDown();
    }
  }
  function commonPrefix(arr) {
    var p = arr[0];
    for (var i = 1; i < arr.length; i++) {
      while (arr[i].indexOf(p) !== 0) p = p.slice(0, -1);
    }
    return p;
  }

  /* ---------------- history walking ---------------- */
  function histPrev() {
    if (!history.length) return;
    if (histIdx === history.length) draft = input.value;
    if (histIdx > 0) histIdx--;
    input.value = history[histIdx];
    moveCaretEnd();
  }
  function histNext() {
    if (histIdx >= history.length) return;
    histIdx++;
    input.value = histIdx === history.length ? draft : history[histIdx];
    moveCaretEnd();
  }
  function moveCaretEnd() {
    var v = input.value; input.value = ""; input.value = v;
  }

  /* ---------------- open / close ---------------- */
  function open() {
    if (!term.hidden) return;
    lastFocus = document.activeElement;
    term.hidden = false;
    document.body.classList.add("term-open");
    if (!output.childElementCount) greet();
    input.focus();
    scrollDown();
  }
  function close() {
    if (term.hidden) return;
    term.hidden = true;
    document.body.classList.remove("term-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }
  function greet() {
    block(BANNER);
    print("Unauthenticated session. Read-only access granted.", "muted");
    print("Type 'help' for commands. 'exit' or Esc to leave.", "muted");
  }

  /* ---------------- events ---------------- */
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    var editable = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if ((e.key === "`" || e.key === "~") && !editable && term.hidden) {
      e.preventDefault();
      open();
    } else if (e.key === "Escape" && !term.hidden) {
      e.preventDefault();
      close();
    }
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); var v = input.value; input.value = ""; run(v); }
    else if (e.key === "Tab") { e.preventDefault(); complete(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); histPrev(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); histNext(); }
    else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); commands.clear(); }
  });

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  // click empty screen space to focus the input, but never while the visitor
  // is selecting text (so flags / output stay copyable)
  screenEl.addEventListener("click", function (e) {
    if (e.target === input) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed) return;
    input.focus();
  });
  // click the backdrop (outside the window) to close
  term.addEventListener("click", function (e) { if (e.target === term) close(); });
})();
