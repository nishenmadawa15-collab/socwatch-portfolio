/* SOCWatch runtime config — public, non-secret values only.
   The Lambda Function URL goes here after the M4 CloudFormation deploy.
   Leave empty until then; the front-end treats an empty URL as "scoreboard offline". */
window.SOCWATCH_CONFIG = {
  // e.g. "https://abc123.lambda-url.ap-south-1.on.aws/"
  backendUrl: "https://nr2zhakzbok6og27sg7gi6miha0czazx.lambda-url.ap-south-1.on.aws/"
};
