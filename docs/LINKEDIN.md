# LinkedIn post — drafts

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

👉 Find the flags: [LIVE URL]
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

Try the CTF 👉 [LIVE URL]
Code 👉 github.com/nishenmadawa15-collab/socwatch-portfolio

Open to SOC Analyst / Penetration Testing internships in Sri Lanka. 🇱🇰

#AWS #Serverless #CyberSecurity #Lambda #DynamoDB #CSP #StudentBuilder
