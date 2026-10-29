# SOCWatch CTF backend (M4)

A tiny serverless scoreboard for the mini-CTF: an **AWS Lambda Function URL**
backed by a **DynamoDB** table, defined as **CloudFormation (SAM)** in
[`template.yaml`](./template.yaml). Flags are validated server-side in
[`ctf/handler.mjs`](./ctf/handler.mjs) — the browser never decides the score.

- Region: **ap-south-1**
- No build step, no dependencies (AWS SDK v3 ships with the `nodejs20.x` runtime).
- Cost: pay-per-request DynamoDB + Lambda. At portfolio traffic this is effectively free and well inside the $10 budget.

## The three flags

| # | id | where it hides | points |
|---|------|----------------|--------|
| 1 | `recon`    | HTML source comment (`view-source:`)                 | 100 |
| 2 | `terminal` | hidden terminal — `~` then `ls` → `cat .secret`       | 150 |
| 3 | `feed`     | earned: trigger a *high* alert from the terminal      | 250 |

Only the **SHA-256 digests** of the flags live in `handler.mjs` — never the
plaintext — so reading the Lambda source doesn't hand out the flags. The flags
themselves are hidden on the site (index.html comment, `terminal.js`,
`feed.js`). If you change a flag, recompute its digest:

```bash
node -e 'console.log(require("crypto").createHash("sha256").update("FLAG{...}").digest("hex"))'
```

## No SAM CLI? Deploy from the console

If you don't have the SAM CLI (or local AWS credentials), use the plain
CloudFormation version [`template-console.yaml`](./template-console.yaml) — it
inlines the Lambda code so the whole stack deploys in one console upload. Steps:
[`docs/DEPLOY-CONSOLE.md`](../docs/DEPLOY-CONSOLE.md). The SAM path below is the
CLI alternative.

## Deploy with SAM (you run this — Claude can't sign in to AWS)

Prereqs: **AWS SAM CLI** (`sam --version`) and credentials for the
`socwatch-admin` user (`aws sts get-caller-identity` should return account
477013660512). Install SAM: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

```bash
cd "G:/AWS Project/socwatch-portfolio/infra"
sam build
sam deploy --guided --region ap-south-1 --stack-name socwatch-ctf
# Accept defaults; when asked "CtfFunction Function URL may not have authorization defined, Is this okay?" answer y.
```

Copy the **FunctionUrl** output (looks like
`https://xxxx.lambda-url.ap-south-1.on.aws/`).

## Wire the front-end (two edits, then push)

1. `config.js` — set the URL:
   ```js
   window.SOCWATCH_CONFIG = { backendUrl: "https://xxxx.lambda-url.ap-south-1.on.aws/" };
   ```
2. `customHttp.yml` — append the same origin (scheme + host, no trailing path) to `connect-src`:
   ```
   connect-src 'self' https://xxxx.lambda-url.ap-south-1.on.aws;
   ```
   (CSP blocks the fetch until you do this — that's the point.)

Then commit & push; Amplify redeploys and the scoreboard comes online. Until
then the site shows a graceful "scoreboard offline" state and the flags are
still findable.

## Smoke test after deploy

```bash
URL="https://xxxx.lambda-url.ap-south-1.on.aws/"
curl -s "$URL" | jq .                              # empty leaderboard
curl -s -XPOST "$URL" -H 'content-type: application/json' \
  -d '{"handle":"tester","flag":"FLAG{welcome_to_the_soc}"}' | jq .   # +100
```

## Tear down (stop all charges)

```bash
sam delete --stack-name socwatch-ctf --region ap-south-1
```
