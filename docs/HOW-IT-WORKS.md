# How SOCWatch works

A tour of the three layers, the CTF, and the engineering decisions behind them.
Written for judges and for future-me. *(Contains CTF spoilers.)*

## Design constraints (self-imposed)
- **No frameworks, no build step, no CDNs, no third-party scripts.** Plain HTML/CSS/vanilla JS. Everything is auditable and loads instantly.
- **Zero inline scripts/styles** so the Content-Security-Policy needs no `unsafe-inline`. Dynamic styling uses the CSSOM or CSS classes; SVG is built with `createElementNS`; text is set with `textContent`, never `innerHTML`. A CI guard (`scripts/check-csp.js`) fails the build if anything inline sneaks in.
- **Accessible and motion-safe.** Skip link, focus-visible rings, `prefers-reduced-motion` honored everywhere, keyboard paths for every interaction.
- **Deploy first, iterate in the open.** A real site went live on Amplify on day one; each milestone merges to `main` and auto-deploys.

## Layer A — Live SOC alert feed (`feed.js`)
A front-end-only simulation. It:
- generates **weighted synthetic SOC events** (auth / ids / fim / vuln / net / geoip / tls / heartbeat) so the feed reads like a real, mostly-quiet SOC — `info`/`low` common, `high` rare;
- **reacts to the real visitor**: theme switches (via a `MutationObserver` on `data-theme`), scroll-depth milestones, clipboard `copy`, a 45 s idle watcher, and anything the terminal emits;
- keeps a capped, newest-first list, four **severity counters that double as filter chips**, and an **SVG sparkline** of alert volume per 2 s bucket;
- **pauses when the tab is hidden** (`visibilitychange`) and drops entrance animation under reduced-motion;
- announces nothing to screen readers (`aria-live="off"` on an ambient log) — the noise would be hostile otherwise.

Decoupling: anything on the page can raise an alert by dispatching a `socwatch:alert` `CustomEvent`; the feed is the only listener. That's how the terminal talks to the feed without either importing the other.

## Layer B — Hidden terminal (`terminal.js`)
Toggle with `` ` `` / `~` (or the hero button); close with `Esc`, the close button, or `exit`. It's a real little shell:
- a command table (`help`, `whoami`, `about`, `skills`, `projects`, `contact`, `ls`, `cat`, `goto`, `theme`, `banner`, `date`, `history`, `ctf`, `scoreboard`, `clear`, `exit`, plus `sudo`/`cls`/`ll`);
- **command history** with `↑`/`↓` (stashes your in-progress line), and **Tab-completion** of command names with a common-prefix fill;
- a virtual filesystem (`ls` / `cat about.txt` / `cat .secret`);
- `role="dialog"` + `aria-modal`, focus moved in on open and restored on close, text stays selectable so flags are copyable.

Every command also emits a `socwatch:alert`, so your terminal activity shows up in Layer A.

## Layer C — Mini-CTF + scoreboard (`scoreboard.js` + `infra/`)
Three flags (see the [CTF section of the README](../README.md#the-mini-ctf)):
1. **recon** `FLAG{welcome_to_the_soc}` — an HTML `<!-- comment -->` in the source.
2. **terminal** `FLAG{deeper_than_view_source}` — printed by `cat .secret` in the terminal.
3. **feed** `FLAG{the_soc_sees_everything}` — *earned*: `cat .secret` (or `sudo`) raises a **high** terminal alert; `feed.js` sees it and escalates, revealing flag 3 once in the live feed. It ties Layers A and B together.

The front-end only submits and renders; it never decides a score. `scoreboard.js` reads `config.js`'s `backendUrl`, `GET`s the leaderboard and `POST`s `{handle, flag}`. With no URL set (or an unreachable backend) it shows a graceful **offline** state — so the site is safe to ship before the backend exists, and the flags are still findable.

### Backend (`infra/template.yaml`, `infra/ctf/handler.mjs`)
A SAM/CloudFormation stack: a **DynamoDB** table (`SOCWatchScores`, pay-per-request) and a **Lambda** (nodejs20.x, arm64) exposed by a **Function URL** with CORS scoped to the live origin. The handler:
- `GET` → scans and returns the top 20 by score;
- `POST` → validates the submitted flag by **SHA-256 digest** (plaintext flags are never in the source), awards points once per flag per handle (no double-dipping), upserts the score, and returns the new score + rank;
- runs on a **least-privilege** role (DynamoDB CRUD on just that table) with zero dependencies — the AWS SDK v3 ships with the runtime.

CSP keeps the browser from calling the Lambda until its exact origin is added to `connect-src` — deliberate, so the security posture is correct the moment the backend goes live.

## Security posture
Strict CSP (no `unsafe-inline`), HSTS with preload, `nosniff`, `frame-ancestors 'none'`, `base-uri 'self'`, restrictive `Referrer-Policy` and `Permissions-Policy`. Target: an **A+** at securityheaders.com and **0 CSP violations** in the console.

## The hard-won gotcha
Amplify's `amplify.yml` ships only the files in its artifact allowlist. A root-level JS file that isn't listed 404s on the live site even though it works locally. Every root script here (`terminal.js`, `feed.js`, `scoreboard.js`, `hero3d.js`) is explicitly listed; `assets/**` covers the vendored Three.js.
