const fs = require("fs");
const env = fs.readFileSync(".env", "utf8");
const lines = env.split(/\r?\n/).filter((l) => l.trim().startsWith("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="));
const raw = lines[0].split("=").slice(1).join("=").trim().replace(/["']/g, "");
const b64part = raw.slice(7).replace(/[^A-Za-z0-9+/=]/g, "");
console.log("B64:", b64part);
const domain = Buffer.from(b64part, "base64").toString("utf8").replace(/\$$/, "");
console.log("DOMAIN:", domain);

async function attempt(body) {
  const r = await fetch(`https://${domain}/v1/client/sign_ins?_is_native=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: raw,
    },
    body: new URLSearchParams(body),
  });
  const j = await r.json().catch(() => null);
  return { status: r.status, j };
}

(async () => {
  const withPrompt = await attempt({
    strategy: "oauth_google",
    redirect_url: "https://example.com/sso-callback",
    oidc_prompt: "select_account",
  });
  console.log("WITH oidc_prompt STATUS:", withPrompt.status);
  const si = withPrompt.j?.response;
  if (si?.first_factor_verification) {
    const url = si.first_factor_verification.external_verification_redirect_url || "";
    console.log("REDIRECT_URL:", url);
    console.log("HAS select_account:", url.includes("prompt=select_account") || url.includes("prompt=consent%20select_account"));
  } else {
    console.log(JSON.stringify(withPrompt.j, null, 2).slice(0, 1200));
  }

  const noPrompt = await attempt({
    strategy: "oauth_google",
    redirect_url: "https://example.com/sso-callback",
  });
  const si2 = noPrompt.j?.response;
  if (si2?.first_factor_verification) {
    console.log("NO_PROMPT REDIRECT:", si2.first_factor_verification.external_verification_redirect_url);
  } else {
    console.log("NO_PROMPT STATUS:", noPrompt.status);
  }
})().catch((e) => console.error("ERR", e));
