# Build log — SOCWatch Portfolio

Built in the open for the AWS Student Builder Challenge, deploy-first: a real
site went live on Amplify at the start, and every milestone merged to `main`
and auto-deployed. Entire build happened on 2026-10-29, paired with Claude Code.

## M0 — Minimal live site
Hero, About, Skills, Projects, Contact with real content and terminal-noir
styling; `amplify.yml` + `customHttp.yml` (strict CSP, security headers);
repo pushed and **connected to Amplify + live**. Proved the pipeline before
building anything clever. *(12c37ed … 2d3b31d)*

## Real CV pass
Swapped placeholder bio for real data: Nishen **Madava** Abedeera, BSc (Hons)
Cyber Security @ SLTC, CodeZela internship (Wazuh SIEM on AWS), TryHackMe
Top 1%, ANIMUS 1.0 CTF 5th nationally. Phone kept off the public site on
purpose. *(94f4c7e)*

## M1 — Full static design
SVG capability radar + proficiency bars, project architecture mini-diagrams,
scroll reveals, hero typing effect — all CSP-safe (CSSOM + `createElementNS`,
zero inline). Added the CI CSP guard `scripts/check-csp.js`. *(953e494)*

## 3D hero — Threat Globe
A WebGL "threat globe" hero (wireframe graticule, sensor nodes, threat arcs,
orbit sweep, HUD) on **self-hosted, tree-shaken Three.js r160** — no CDN.
Reduced-motion static frame, DPR≤2, pauses offscreen. Shipped the
hard-won gotcha fix: a root-level module must be listed in `amplify.yml`'s
artifacts or it 404s live. *(2356e0b, 7d8c8cd, a798d5e)*

## M2 — Hidden terminal (Layer B)
`terminal.js`: toggle with `` ` `` / `~`, command parser, history (`↑`/`↓`),
Tab-completion, a virtual filesystem, and a `role="dialog"` with proper focus
management. CSP-safe (markup in HTML, output via `createElement`/`textContent`).
Added `terminal.js` to the Amplify allowlist and the CSP guard. Planted the
second CTF flag behind `cat .secret`. *(86d45ab, 2e47b89)*

## M3 — Live SOC alert feed (Layer A)
`feed.js`: weighted synthetic SOC events + reactions to real visitor actions
(theme, scroll, copy, idle, terminal), severity counters that double as
filters, an SVG sparkline, tab-hide pause, reduced-motion aware. The terminal
now emits `socwatch:alert` events the feed consumes — decoupled via a
`CustomEvent`. New "live feed" section; nav + section observer updated.
*(6669b77, a753153)*

## M4 — Mini-CTF + serverless backend (Layer C)
Front-end `scoreboard.js` (submit flags, live leaderboard, graceful offline
state) and a SAM/CloudFormation backend in `infra/`: DynamoDB table + Lambda
Function URL, flags validated by **SHA-256 digest** server-side, least-privilege
IAM, zero dependencies. The third flag is *earned* — a high-severity terminal
alert makes the feed escalate and reveal it, tying Layers A+B together. Backend
is one `sam deploy` away (deployed by me — Claude can't sign in to AWS).
*(bc014ae, 7bd2a3c)*

## M5 — Polish & QA
Code polish: ambient feed set `aria-live="off"` (constant announcements would
be hostile to screen-reader users); project card copy updated to present tense.
Remaining QA is tooling I run locally: Lighthouse ≥95, an A+ at
securityheaders.com, Playwright screenshots across five widths, and a
0-CSP-violation console check on the live site.

## M6 — Docs
This log, [`HOW-IT-WORKS.md`](HOW-IT-WORKS.md), [`SUBMISSION.md`](SUBMISSION.md),
the LinkedIn post, and a rewritten top-level README.

## Lessons
- **Deploy first.** Being live from day one meant no milestone ever risked the submission URL.
- **CSP as a design constraint, not an afterthought.** Writing zero-inline from M0 made every later feature drop in cleanly — and the CI guard caught regressions for free.
- **Decouple with events.** `socwatch:alert` let the terminal and feed cooperate without knowing about each other.
- **Correct-by-construction security.** The backend is unreachable until its origin is whitelisted in `connect-src`; nothing is accidentally exposed.
