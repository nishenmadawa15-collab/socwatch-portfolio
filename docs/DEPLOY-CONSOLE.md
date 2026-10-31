# Deploy the CTF backend from the AWS Console

> ✅ **Already deployed and live** (region `ap-south-1`, stack `socwatch-ctf`).
> Function URL: `https://nr2zhakzbok6og27sg7gi6miha0czazx.lambda-url.ap-south-1.on.aws/`
> — already wired into [`config.js`](../config.js) and [`customHttp.yml`](../customHttp.yml).
> The steps below are the reproducible procedure for redeploying from scratch.

No SAM CLI, no local credentials — just the console you're already signed into.
This deploys the whole backend (DynamoDB + Lambda + public Function URL + IAM)
from one template: [`infra/template-console.yaml`](../infra/template-console.yaml).
Region: **ap-south-1**.

## 1. Create the stack
1. AWS Console → make sure the region (top-right) is **Asia Pacific (Mumbai) ap-south-1**.
2. Go to **CloudFormation** → **Create stack** → **With new resources (standard)**.
3. **Choose an existing template** → **Upload a template file** → pick
   `infra/template-console.yaml` from this repo → **Next**.
4. **Stack name:** `socwatch-ctf`. Leave `AllowOrigin` as the default (the live
   site URL) → **Next**.
5. **Next** again (defaults are fine).
6. At the bottom, tick **"I acknowledge that AWS CloudFormation might create IAM
   resources"** → **Submit**.
7. Wait ~1–2 minutes for **CREATE_COMPLETE**.

## 2. Grab the Function URL
Open the stack → **Outputs** tab → copy **FunctionUrl**
(`https://xxxx.lambda-url.ap-south-1.on.aws/`).

Quick smoke test — paste the URL in a browser; you should see
`{"ok":true,"total":0,"scoreboard":[]}`.

## 3. Wire the front-end (two edits, then push)
1. `config.js`:
   ```js
   window.SOCWATCH_CONFIG = { backendUrl: "https://xxxx.lambda-url.ap-south-1.on.aws/" };
   ```
2. `customHttp.yml` — add the same origin (scheme + host, **no trailing slash**)
   to `connect-src`:
   ```
   connect-src 'self' https://xxxx.lambda-url.ap-south-1.on.aws;
   ```
3. Commit & push. Amplify redeploys and the scoreboard goes live.

> Or just send me the FunctionUrl and I'll make these two edits and push.

## Tear down (stops all charges)
CloudFormation → select `socwatch-ctf` → **Delete**.

---
*CLI alternative:* if you later install the SAM CLI, `infra/template.yaml` +
`infra/README.md` do the same thing with `sam deploy`.
