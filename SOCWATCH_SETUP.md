# SOCWatch Portfolio — Complete Setup File (v2)

**Project name:** `socwatch-portfolio`  ·  **Site title:** *Nishen Madawa Abedeera — SOCWatch*
**Tagline:** "The portfolio that watches you back."
**Deadline:** Nov 6, 2026 · 11:59 PM PT (= Nov 7, 12:29 PM Sri Lanka)

This file has 5 parts:
1. What to install (minimum) and what we do through Chrome instead
2. How to launch Claude Code in automation mode
3. The agent team (how many, who does what)
4. **THE PROMPT** — paste into Claude Code
5. Browser steps we do together (GitHub, Amplify, CloudFormation) + timeline

---

## PART 1 — Install (minimum) vs. browser

| Need | Decision | Why |
|---|---|---|
| **Node.js LTS** | Already needed for Claude Code | — |
| **Git for Windows** | **Install (only this one)** | Amplify CI/CD and the hackathon's GitHub-link requirement both need a real git repo. Uploading files through GitHub's web UI every change is painful. 1 installer, 2 minutes: https://git-scm.com/download/win → defaults. |
| GitHub CLI (`gh`) | **Skip** | We create the repo in Chrome; Claude Code pushes with plain `git push` (HTTPS, Windows asks you to sign in once in a browser popup). |
| AWS CLI | **Skip** | Backend (Lambda + DynamoDB) is deployed by uploading one CloudFormation file in the AWS console with me (Claude in Chrome). Amplify is connected in the console too. |
| Python | Optional | Claude Code can use `npx serve` for local testing instead. |

After installing Git, open a new terminal and run once (your real name/email):
```
git config --global user.name "Nishen Madawa Abedeera"
git config --global user.email "nishenmadawa15@gmail.com"
```

## PART 2 — Launch Claude Code in automation mode

```
mkdir C:\Projects\socwatch-portfolio
cd C:\Projects\socwatch-portfolio
claude --permission-mode acceptEdits
```

Inside Claude Code, run `/permissions` and **allow** these so it never stops for routine work (it will still ask for anything else):
```
Bash(git *)
Bash(npm *)
Bash(npx *)
Bash(node *)
Bash(mkdir *)
Bash(dir *)
```
Rule of thumb you asked for: it edits files and runs git/npm freely; it must still **ask you** before anything that touches your AWS account, deletes files, or installs software. That rule is written into the prompt.

Tip: keep the session alive across days with `claude --continue`.

## PART 3 — The agent team

Claude Code can spawn sub-agents (its `Agent`/Task tool). **One lead + 4 specialists** is the sweet spot for a 9-day solo project — more than that just burns tokens coordinating. The prompt tells the lead exactly this:

| Agent | Owns | Runs when |
|---|---|---|
| **Lead (the main session)** | Plan, milestones, integration, commits, status reports to you | Always |
| **UI/Front-end agent** | HTML/CSS/JS, design system, animations, responsive, accessibility, SVG assets | M1, M2, M3, M5 |
| **Security/AWS agent** | Lambda, DynamoDB, CloudFormation, IAM, `customHttp.yml`, CSP, flag hashing | M4 |
| **QA agent** | Playwright screenshots at 5 widths, test checklist, Lighthouse, CSP console check, broken links | after every milestone |
| **Docs/Write-up agent** | README, HOW-IT-WORKS, BUILD-LOG, SUBMISSION.md, LinkedIn post | M6 (and keeps BUILD-LOG during M1–M5) |

UI + Security agents can run **in parallel** from M2 onward (separate files, no conflicts). QA runs after each merge.

## PART 4 — THE PROMPT (paste everything below the line into Claude Code)

Fill the 3 placeholders first: `<<GITHUB_USERNAME>>`, `<<LINKEDIN_URL>>`, `<<DOMAIN_OR_BLANK>>`.

---

You are the **lead engineer** on my project `socwatch-portfolio`: my personal portfolio website for the **AWS Student Builder Challenge: Build Your Tech Superpower** (deadline Nov 6, 2026, 11:59 PM PT). I am a cybersecurity undergraduate; you are a senior full-stack + security engineer and a meticulous designer. We are aiming for the **top 5**. Work autonomously; follow the operating rules in §9.

### §1 Judging rubric (optimize for this)
- Creativity & memorability **30%** — one interactive creative feature that reflects me, discoverable via a visible hint
- Working AWS implementation **25%** — hosted on **AWS Amplify Hosting** (mandatory), loads at a live URL, AWS usage documented
- Communication quality **25%** — clear write-up, screenshots, process, learnings, challenges
- Completeness & usability **20%** — About Me, Skills, Projects/Achievements; navigation works; desktop + mobile

Competing entries we must beat: a "chip datasheet" portfolio (Lambda + DynamoDB counter), a "rewind through web eras" portfolio with strict CSP, several generic hacker-terminal portfolios, a classic-Mac desktop, a game-missions portfolio. We win by being more **memorable**, more **polished**, and **deeper on AWS and security** than all of them.

### §2 About me (use exactly; never invent facts)
- **Nishen Madawa Abedeera** (goes by Nishen or Madawa), Sri Lanka. BSc undergraduate, **Cybersecurity & Cloud Computing**, Sri Lanka Technological Campus (SLTC) Research University.
- Email nishenmadawa15@gmail.com · GitHub `<<GITHUB_USERNAME>>` · LinkedIn `<<LINKEDIN_URL>>` · AWS Builder https://builder.aws.com/content/users/nishen
- Identity: blue-team / SOC-minded student who learns by building real labs, solving CTFs (web, OSINT, forensics, crypto) and developing websites. Goal: capable security professional who can also ship secure web products and earn independently.
- Skills — Security: Wazuh SIEM & SOC monitoring, OWASP Top 10, vulnerability assessment basics, OSINT & forensics (CTF level). Cloud: AWS (EC2, VPC, IAM, Amplify, Budgets, Lambda, DynamoDB, CloudFormation), Linux & Bash, networking (DNS/HTTP/TCP-IP). Dev: HTML/CSS/JS, Python, Git/GitHub, AI-assisted development with Claude Code.
- Project 1 — **SOCWatch Lab: Wazuh SOC on AWS** — custom VPC, Wazuh manager on EC2, Linux + Windows agents, Elastic IP, log collection, alert triage, file-integrity monitoring. Lesson: stopped instances still bill for EBS + EIP → now I terminate, keep AMIs, and run a $10/month budget with alerts.
- Project 2 — **This portfolio** (describe truthfully once built).
- Project 3 — **CTF practice log** — 2–3 cards marked `TODO` for me to fill with real challenges.
- Certifications/achievements — `TODO` block only. Do not fabricate anything, anywhere.

### §3 The concept — "The portfolio that watches you back"
My portfolio **is a SOC**. When a visitor arrives, the site starts monitoring them — playful, never creepy. Three integrated layers:

**Layer A — Live SOC Alert Feed (signature feature).** Collapsible right-side panel (bottom sheet on mobile) styled like a Wazuh/SIEM stream. Visitor actions produce timestamped alerts with severity + MITRE ATT&CK tag. Write ~30 varied, witty, technically accurate alerts, e.g.: page load → `[INFO] New session · <browser/OS> · T1595 Active Scanning`; scroll into Projects → `[INFO] Recon: enumerating Projects`; open terminal → `[WARN] Interactive shell spawned · T1059`; type `sudo` → `[HIGH] Privilege escalation attempt · T1548`; DevTools open → `[CRITICAL] Debugger attached — nice try 😏`; copy text → `[MEDIUM] Clipboard exfiltration · T1041`; idle 60 s → `[LOW] Beacon silence… AFK?`; click Email → `[INFO] Outbound to recruiter channel approved ✅`. Include severity filter, per-severity counters, mute toggle, clear, and a tiny "events/min" sparkline. Never blocks navigation; respects `prefers-reduced-motion`.

**Layer B — Hidden Terminal.** Open with `~`, the nav "Terminal" button, or the footer link. Hero shows the visible hint: *"Psst — there's a hidden terminal. Press ~ and type help."* Real parser with history (↑/↓) and tab-completion. Commands: `help`, `ls` (`ls -a` reveals `.secret`), `cat about.txt|skills.txt|projects.txt|contact.txt|.secret`, `cd <section>` (smooth-scroll), `whoami`, `nmap madawa` (fake scan: open ports = skills, services = projects), `sudo hire-me` (joke + opens mailto), `history`, `clear`, `theme dark|light|matrix`, `flag <value>`, `scoreboard`, `exit`. Every command emits an alert into Layer A.

**Layer C — Mini CTF + real AWS backend.** Three flags `FLAG{...}`: (1) HTML comment near the hero; (2) base64 inside a fake log line that appears in the feed after ~10 alerts; (3) `cat .secret` in the terminal. Correct submission (terminal or small form in the panel) calls the backend and updates a public **Blue Team Scoreboard** (captures per flag) + the visitor's own progress in `localStorage`.
Backend: one **AWS Lambda** (Node.js 20) behind a **Function URL** (CORS locked to the site origin) with `GET /scores` and `POST /capture {flagId, flag}`; **DynamoDB** table `socwatch-scores` (PK `flagId`, atomic `ADD count`), on-demand; flags validated by **SHA-256 hash** (plaintext flags never in Lambda code); simple in-memory per-IP rate limit; graceful "scoreboard offline" fallback. Deliver infra as **one CloudFormation template `infra/template.yaml`** (table, least-privilege IAM role scoped to that table, Lambda with inline code, Function URL, outputs the URL) — **I will upload it in the AWS console myself**, so make it console-upload friendly (no S3 packaging, inline `ZipFile` code ≤ 4 KB or clear instructions). Front-end reads the URL from `config.js`.

### §4 Visual design — next-level, not template-level
- Stack: plain HTML + CSS + vanilla JS. No frameworks, no build step, no CDNs, no third-party scripts. Self-host two open-license fonts (e.g., JetBrains Mono + Inter) in `assets/fonts/` with licenses.
- Art direction: **"terminal-noir"** — deep navy/charcoal, one accent (electric green or cyan), subtle grid + scanline texture, generous whitespace, strong type hierarchy. Professional, not cheesy. Light theme via `prefers-color-scheme` + manual toggle.
- **Advanced visuals, all code-generated (no stock images):**
  - Hero: animated SVG "radar sweep"/network graph that reacts to cursor (canvas, ≤ 60 fps, pauses off-screen and under reduced motion).
  - Skills: SVG radial "capability radar" + proficiency bars that animate on scroll.
  - Projects: cards with an SVG architecture mini-diagram each (VPC/EC2 for the lab; Amplify/Lambda/DynamoDB for this site).
  - Section transitions: subtle "scanline reveal". Micro-interactions: hero typing effect (once), card hover lift, smooth scroll, focus rings.
  - Favicon + OG image as SVG/PNG generated by you (no external logos).
- Layout: Hero → About Me → Tech Superpowers → Projects & Achievements → Contact. Sticky nav with active-section highlight. Footer: "Hosted on AWS Amplify", repo link, security-posture badge linking to `https://securityheaders.com/?q=<site>`.
- Responsive: 360 / 390 / 768 / 1024 / 1440 px, no horizontal scroll, touch targets ≥ 44 px; panel → bottom sheet, terminal → full-screen on mobile.
- Accessibility: landmarks, skip link, full keyboard operation, focus trap in terminal dialog, `aria-live="polite"` feed, contrast ≥ 4.5:1, reduced-motion honoured.
- Performance: Lighthouse ≥ 95 ×4 on mobile; page weight < 400 KB; lazy-load below the fold.
- SEO/meta: title, description, Open Graph, favicon, `robots.txt`, `sitemap.xml`.

### §5 Security (must prove I'm a security student)
- `customHttp.yml` for Amplify: strict CSP (`default-src 'self'; connect-src 'self' <lambda-url>; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:`), HSTS 1y + includeSubDomains + preload, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/mic/geolocation, COOP same-origin. **Zero inline scripts/styles** so CSP needs no `unsafe-inline`.
- Cache: immutable for fonts/images; revalidate for HTML/CSS/JS.
- Sanitize terminal input; never `innerHTML` with user input.

### §6 Repo & deployment (no CLIs beyond git)
- `git init`, `.gitignore`, MIT `LICENSE`, `README.md` (overview, Mermaid architecture diagram, local run, backend deploy via console, Amplify deploy, security headers), `amplify.yml` (static, artifact allowlist: `index.html styles.css script.js config.js assets/** robots.txt sitemap.xml` — never `infra/`, `docs/`).
- Small conventional commits (`feat:`/`fix:`/`docs:`). **I create the empty GitHub repo `socwatch-portfolio` in my browser and give you the HTTPS URL**; you add the remote and push `main` (Windows will pop a GitHub sign-in once).
- Write `docs/DEPLOY-CONSOLE.md`: exact click-by-click steps for (a) uploading `infra/template.yaml` in **CloudFormation console (ap-south-1)**, copying the Function URL output into `config.js`; (b) connecting the repo in **Amplify Hosting console** (GitHub app → repo → branch `main` → confirm `amplify.yml` + `customHttp.yml` → deploy → verify URL); (c) optional custom domain `<<DOMAIN_OR_BLANK>>`.
- Costs: Amplify static + Lambda + DynamoDB on-demand + CloudWatch defaults only. **No EC2, NAT, RDS, or anything hourly.**

### §7 Testing (never skip)
- Local run (`npx serve .`): verify nav, all terminal commands, all alert triggers, all 3 flags, scoreboard GET/POST (mock until backend exists, real after), CSP console = 0 violations, no 404s.
- `docs/TEST-CHECKLIST.md` with pass/fail; Playwright screenshots at 5 widths → `docs/screenshots/`; Lighthouse report → `docs/lighthouse.html`; fix anything < 95.

### §8 Write-up (Communication 25%)
`docs/SUBMISSION.md`, first person, honest, student voice: (1) title + live URL + repo; (2) the idea — why a SOC portfolio reflects me (Wazuh lab); (3) the creative feature — what a visitor experiences in the first 30 s, how the hint works; (4) AWS architecture — Amplify CI/CD, Lambda Function URL, DynamoDB, IAM least privilege, CloudFormation, CloudWatch — Mermaid diagram + list of screenshots I must take (Amplify console, Lambda, DynamoDB, securityheaders.com A+, Lighthouse); (5) security decisions; (6) what I learned (incl. the real cost lesson); (7) challenges & fixes — sourced from `docs/BUILD-LOG.md` you maintain throughout; (8) next steps. Plus a 3-line LinkedIn post and a short Builder Center announcement.

### §9 Operating rules (automation + safety)
1. **Agents:** You are the lead. Spawn sub-agents: **UI/Front-end**, **Security/AWS**, **QA**, **Docs**. Run UI and Security in parallel from M2 (disjoint files). Run QA after every milestone merge. Keep it to these 4 — no more.
2. **Permissions:** Edit files and run `git`/`npm`/`npx`/`node` freely. **Ask me before:** anything touching my AWS account, deleting files/branches, force-pushing, installing software, or changing `config.js` secrets. Never commit real flags' plaintext hashes' source values or any credentials.
3. **Milestones — deploy first, then iterate.** Write `docs/PLAN.md` first, then:
   - **M0 (today, ≤ 2 hours): "Live or nothing."** A minimal but real site — hero, About, Skills, Projects, Contact with my real content, clean styling, mobile OK, `amplify.yml` + `customHttp.yml` present, `README.md` stub — committed and pushed to `main`. Stop and tell me: *"M0 pushed — connect Amplify now."* I connect Amplify in the console; from then on **every push to `main` auto-deploys**, so the live URL exists from day 1 and is never at risk.
   - M1 full static design · M2 terminal · M3 alert feed · M4 backend + CTF (template + console guide) · M5 polish/tests/Lighthouse · M6 docs/write-up.
   - Work on a feature branch per milestone (`feat/terminal`, `feat/alert-feed`…), merge to `main` only when QA passes, so the live site is always stable. Commit after each.
4. **Status:** after each milestone, give me 5 lines: done / next / what you need from me (repo URL, Function URL, screenshots only I can take).
5. **Truth:** where you need my real data (CTF names, certs, photos), insert clearly marked `TODO` placeholders and list them at the end.
6. **Maintainability:** readable, commented code; `docs/HOW-IT-WORKS.md` explains every non-obvious technique so I can maintain it alone.
7. **Deadline awareness:** if M4 risks the deadline, ship M1–M3 + M5–M6 first, then add M4.

Begin now: write `docs/PLAN.md`, then build **M0** and push it. Do not start M1 until you have told me M0 is pushed.

---

## PART 5 — Browser steps we do together (Chrome + me)

| When | Step | Where |
|---|---|---|
| **Today, before M0 push** | Create empty **public** repo `socwatch-portfolio` (no README) → copy HTTPS URL → give to Claude Code | github.com/new |
| **Today, right after M0 push** | Amplify Hosting → Create new app → GitHub → `socwatch-portfolio` / `main` → confirm `amplify.yml` → Save & deploy → copy live URL (`https://main.xxxxx.amplifyapp.com`). **Live site exists from day 1.** | AWS console, ap-south-1 |
| After M4 | Upload `infra/template.yaml` → CloudFormation → Create stack → copy **Function URL** output → Claude Code puts it in `config.js` + CSP → push → auto-deploys | AWS console, ap-south-1 |
| After each deploy | Open the live URL on phone + laptop; securityheaders.com (A+ screenshot), Lighthouse, Amplify/Lambda/DynamoDB screenshots | Chrome |
| Nov 3 (early!) | Builder Center → hackathon → **Your project** → create a **draft** with live URL + repo (so a submission exists even if something breaks later) | builder.aws.com |
| Nov 5–6 | Replace draft with final SUBMISSION.md + screenshots | builder.aws.com |

### Timeline — fast-deploy version (today = Oct 29, Sri Lanka)
- **Oct 29 (today):** Git install → repo → **M0 pushed → Amplify connected → LIVE URL** ✅ → start M1
- **Oct 30:** M1 full design + M2 terminal (each merge auto-deploys)
- **Oct 31:** M3 alert feed
- **Nov 1–2:** M4 backend + CTF, CloudFormation upload
- **Nov 3:** M5 polish, Lighthouse, mobile QA · **draft submission on Builder Center**
- **Nov 4–5:** M6 write-up + screenshots, final submission
- **Nov 6:** buffer only (PT deadline = Nov 7, 12:29 PM Sri Lanka — don't use it)

### Optional extra: AI-generated images
If you want a photoreal/illustrated hero or OG image instead of code-generated SVG, ask me here — I can generate images and hand you the files to drop into `assets/`. Keep them self-hosted (no external URLs) so CSP stays strict.
