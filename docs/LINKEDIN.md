# LinkedIn post

## ✅ FINAL — ready to post

**Image:** attach `assets/promo-linkedin.png` (1200×630 SOC console + radar card).
Optional extra: a 10–15s screen-recording of the live feed reacting + the `~` terminal.

> I built a portfolio that watches you back. 🛡️
>
> Most portfolios are a static page. Mine is a live Security Operations Center.
>
> For the **AWS Student Builder Challenge**, I turned my portfolio into **SOCWatch** — and everything on it is real:
>
> 🔴 A **live SOC alert feed** that reacts as you browse — scroll, switch theme, copy text — streaming simulated security events with severity filters and a live sparkline.
> ⌨️ A **hidden terminal** — press `~` for a real command console with history and Tab-completion. (There's a flag in there.)
> 🚩 A **3-flag mini-CTF** with a Blue-Team scoreboard, scored server-side on **AWS Lambda + DynamoDB**.
>
> Under the hood it's deliberately boring in the best way:
> • Plain HTML/CSS/JS — no frameworks, no build step, no CDNs.
> • Strict **zero-inline Content-Security-Policy**, HSTS, **A+ at securityheaders.com**.
> • Flags validated by **SHA-256 server-side** — plaintext never touches the Lambda. The browser literally can't reach the backend until its origin is whitelisted.
>
> Security by construction, not by hope.
>
> Built in the open, deploy-first — live on day one, every feature auto-deployed through **AWS Amplify**. I paired with Claude Code as a build partner; architecture, security review and AWS deployment are mine.
>
> 👉 Find the three flags: https://main.d2e99c40tngdmx.amplifyapp.com
> 💻 Source: github.com/nishenmadawa15-collab/socwatch-portfolio
>
> BSc (Hons) Cyber Security undergrad (SLTC), TryHackMe Top 1% globally as *VoidInjector* — open to **SOC Analyst / Penetration Testing internships in Sri Lanka**. 🇱🇰
>
> #AWS #CyberSecurity #SOC #BlueTeam #Serverless #Lambda #CSP #StudentBuilder #CTF

### Best time to post (Sri Lanka, UTC+5:30)
- **Best:** Tuesday or Wednesday, **~9:00 AM SLST** — catches the SL morning scroll, and it's still mid-afternoon in Europe (~4:30 AM US ET, builds through their morning).
- **Strong alternative:** Tue/Wed **~7:30–8:30 PM SLST** — SL evening scroll + overlaps US daytime (9–10 AM ET) for the global infosec/recruiter crowd.
- **Avoid:** Fri evening → Sunday, and Monday morning. Weekends are weak for professional reach.
- First 60–90 min matter most: reply to every comment fast, and don't drop extra links in the post body (put the repo link in the first comment if you want max reach — LinkedIn soft-throttles outbound links).

### Before you paste the live URL on LinkedIn
Run the site URL through the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) once (after the Amplify redeploy finishes) so the new `og:image` card is scraped fresh.

---

## Alternate drafts

Pick one, add 2–3 screenshots or a short screen-recording (terminal + live feed
reacting), and post. Tag AWS / the challenge if the rules ask for it.

---

## Draft A — the hook ("watches you back")

I built a portfolio that watches you back. 🛡️

For the **AWS Student Builder Challenge**, I turned my portfolio into a live Security Operations Center:

🔴 A **live SOC alert feed** that reacts as you browse — scroll, switch theme, copy text — and streams simulated security events with severity filters and a live sparkline.
⌨️ A **hidden terminal** — press `~` for a real command console with history and Tab-completion.
🚩 A **mini-CTF**: three hidden flags and a Blue-Team scoreboard, scored server-side on **AWS Lambda + DynamoDB**.

The whole thing is plain HTML/CSS/JS — no frameworks, no build step — under a strict, zero-inline Content-Security-Policy, hosted on **AWS Amplify** with an A+ security-headers posture. Flags are validated by hash server-side, and the browser literally can't reach the backend until its origin is whitelisted. Security by construction, not by hope.

Built in the open, deploy-first, paired with Claude Code — architecture, security review and AWS deployment done by me.

👉 Find the flags: https://main.d2e99c40tngdmx.amplifyapp.com
💻 Source: github.com/nishenmadawa15-collab/socwatch-portfolio

#AWS #CyberSecurity #CloudComputing #SOC #Serverless #StudentBuilder #BlueTeam

---

## Draft B — the engineering angle

What does a cybersecurity portfolio look like when the portfolio *is* the demo?

For the AWS Student Builder Challenge I shipped **SOCWatch** — a portfolio themed as a live SOC:

• **AWS Amplify** hosting with CI/CD and a strict CSP (zero `unsafe-inline`), HSTS, and `frame-ancestors 'none'` — targeting an A+ at securityheaders.com.
• A **Lambda Function URL + DynamoDB** backend (infrastructure-as-code via CloudFormation/SAM) scoring a 3-flag CTF. Flags validated by SHA-256 digest — plaintext never touches the Lambda source.
• Least-privilege IAM, pay-per-request billing inside a $10 budget.
• Front-end: a hidden terminal, a reactive live alert feed, and a WebGL hero — all vanilla JS, no CDNs.

Deploy-first and built in the open: live on day one, each feature merged and auto-deployed.

Try the CTF 👉 https://main.d2e99c40tngdmx.amplifyapp.com
Code 👉 github.com/nishenmadawa15-collab/socwatch-portfolio

Open to SOC Analyst / Penetration Testing internships in Sri Lanka. 🇱🇰

#AWS #Serverless #CyberSecurity #Lambda #DynamoDB #CSP #StudentBuilder
