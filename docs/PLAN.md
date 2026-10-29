# SOCWatch Portfolio — Build Plan

**Site:** *Nishen Madawa Abedeera — SOCWatch* · "The portfolio that watches you back."
**Challenge:** AWS Student Builder Challenge — Build Your Tech Superpower
**Deadline:** Nov 6, 2026 · 11:59 PM PT (Nov 7, 12:29 PM Sri Lanka)
**Working dir:** `G:\AWS Project\socwatch-portfolio`

## Strategy — deploy first, then iterate
Get a real site live on Amplify on **day 1** so the live URL never depends on a last-minute build. Every push to `main` auto-deploys after Amplify is connected. Feature branches per milestone, merge to `main` only after QA passes.

## Milestones
| ID | Scope | Branch | Status |
|----|-------|--------|--------|
| **M0** | Minimal real site: hero, About, Skills, Projects, Contact (real content), clean terminal-noir styling, mobile OK, `amplify.yml` + `customHttp.yml`, README stub, repo pushed | `main` | **IN PROGRESS** |
| M1 | Full static design: SVG radar hero, capability radar, project architecture diagrams, scanline reveals, self-hosted fonts, themes | `feat/design` | todo |
| M2 | Hidden terminal (`~`), command parser, history, tab-complete | `feat/terminal` | **done** |
| M3 | Live SOC alert feed (Layer A), severity filter/counters/sparkline | `feat/alert-feed` | todo |
| M4 | Backend: Lambda Function URL + DynamoDB + CloudFormation `infra/template.yaml`, mini CTF (3 flags), scoreboard | `feat/backend` | todo |
| M5 | Polish, Playwright screenshots ×5 widths, Lighthouse ≥95, CSP = 0 violations, mobile QA | `feat/polish` | todo |
| M6 | Docs: README, HOW-IT-WORKS, SUBMISSION.md, BUILD-LOG, LinkedIn post | `feat/docs` | todo |

## Decisions log (ponytail)
- **M0 fonts:** system font stack (`system-ui`, `ui-monospace`) — zero weight, no CSP issue. Self-hosted JetBrains Mono + Inter added in M1. *add when: M1 design pass.*
- **No frameworks, no build step, no CDNs, no third-party scripts** — plain HTML/CSS/vanilla JS. All CSS/JS external (zero inline) so CSP needs no `unsafe-inline`.
- **M0 has no backend** — scoreboard/CTF/terminal/alert-feed come M2–M4. M0 just proves "live".
- Region for all AWS: **ap-south-1** (Mumbai, closest to Sri Lanka).

## Open TODOs (need from Nishen)
- [ ] GitHub username + empty public repo `socwatch-portfolio` HTTPS URL (to push M0)
- [ ] LinkedIn profile URL
- [ ] Custom domain? (optional, can stay blank)
- [ ] M3 CTF: real challenge names/writeups for Project 3 cards
- [ ] Certifications/achievements (if any)

## Status checkpoints
After each milestone: 5 lines — done / next / what I need from you.
