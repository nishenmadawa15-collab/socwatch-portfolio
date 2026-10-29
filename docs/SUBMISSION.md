# AWS Student Builder Challenge — Submission

**Challenge:** Build Your Tech Superpower
**Builder:** Nishen Madava Abedeera — BSc (Hons) Cyber Security, SLTC Research University, Sri Lanka
**Project:** SOCWatch — *the portfolio that watches you back*
**Live:** https://main.d2e99c40tngdmx.amplifyapp.com
**Source:** https://github.com/nishenmadawa15-collab/socwatch-portfolio

> Draft copy for the submission form — adapt field-by-field to whatever the portal asks.

## One-liner
A portfolio that *is* a Security Operations Center: it plays at monitoring you (friendly, never creepy), hides a real terminal and a three-flag CTF, and keeps score on a serverless AWS backend.

## My tech superpower
**Blue-team security engineering** — I don't learn security from slides; I stand up real labs, break and defend them, and ship secure web. This site turns my portfolio into a live demonstration of that: SOC-style monitoring, a working command console, and a CTF whose scoreboard I secured and deployed myself.

## What I built
- **Layer A — Live SOC alert feed:** a simulated console that reacts to visitor actions and streams weighted synthetic security events, with severity filters and a live sparkline.
- **Layer B — Hidden terminal:** a real command parser (history + Tab-completion) behind the `~` key.
- **Layer C — Mini-CTF:** three hidden flags and a public Blue-Team scoreboard, scored server-side.
- All on **plain HTML/CSS/vanilla JS** — no frameworks, no build step, no CDNs — under a strict, zero-inline Content-Security-Policy.

## AWS services used
| Service | Role |
|---------|------|
| **AWS Amplify Hosting** | CI/CD + global hosting; auto-deploys every push to `main`, serves strict security headers via `customHttp.yml`. |
| **AWS Lambda** (Function URL) | Serverless CTF API — validates flags by SHA-256 digest, computes scores. nodejs20.x on arm64, zero dependencies. |
| **Amazon DynamoDB** | Pay-per-request scoreboard table (`SOCWatchScores`). |
| **AWS CloudFormation / SAM** | The whole backend as one infrastructure-as-code template (`infra/template.yaml`). |
| **IAM** | Least-privilege execution role — DynamoDB CRUD scoped to one table. |

## Security engineering highlights
- Strict **CSP with no `unsafe-inline`**, enforced by a CI guard; HSTS (preload), `nosniff`, `frame-ancestors 'none'`, restrictive `Referrer-Policy`/`Permissions-Policy`.
- Flags validated **server-side by hash** — plaintext never in the Lambda source.
- The browser literally **cannot reach the backend until its origin is whitelisted in `connect-src`** — the posture is correct by construction.
- Least-privilege IAM; pay-per-request billing kept inside a $10 AWS Budget with alerts (a lesson from a previous lab where idle resources still billed).

## How I built it
Built **in the open**, deploy-first: a real site went live on Amplify on day one, then each milestone (terminal → alert feed → backend/CTF → polish → docs) merged to `main` and auto-deployed. I paired with **Claude Code** as an AI build partner and did the architecture, security review, and AWS deployment myself. Full narrative in [`docs/BUILD-LOG.md`](BUILD-LOG.md); engineering detail in [`docs/HOW-IT-WORKS.md`](HOW-IT-WORKS.md).

## Try it (90 seconds)
1. Open the live site. Watch the **live feed** react as you scroll.
2. Press `` ` `` or `~` for the **terminal**; run `help`, then `ls`, then `cat .secret`.
3. Head to **Capture the flag**, pick a handle, and submit the flags you found.

## About me
TryHackMe Top 1% globally (as *VoidInjector*), 5th nationally at ANIMUS 1.0 CTF with Team N4X, Google Cybersecurity certified, former Cybersecurity Intern at CodeZela (built a Wazuh SIEM lab on AWS). Seeking a SOC Analyst / Penetration Testing internship or junior role in Sri Lanka.
