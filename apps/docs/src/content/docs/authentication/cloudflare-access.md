---
title: "Reverse proxy: Cloudflare Access"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/authentication/cloudflare-access.mdx"
---

Put chmonitor behind [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) and let Access handle authentication. Access authenticates the user and forwards a signed JWT; chmonitor verifies it cryptographically. No shared secret needed — the signature is the proof.

## How it works

- Cloudflare Access sits in front of the chmonitor Worker.
- On each request, Access adds a `Cf-Access-Jwt-Assertion` header with a signed JWT.
- chmonitor verifies the JWT against your team's JWKS: checks the `aud`, issuer, `exp`, and `RS256` signature.
- The authenticated subject is the token's `email` field (falls back to `sub`).
- When `CHM_CF_ACCESS_*` are unset, this mechanism is skipped.

## Configuration

```bash
CHM_AUTH_PROVIDER=proxy
CHM_CF_ACCESS_TEAM_DOMAIN=https://your-team.cloudflareaccess.com
CHM_CF_ACCESS_AUD=<access-application-aud-tag>
```

Set these as Worker secrets in production:

```bash
wrangler secret put CHM_CF_ACCESS_TEAM_DOMAIN
wrangler secret put CHM_CF_ACCESS_AUD
```

## Setup steps

1. In the Cloudflare Zero Trust dashboard, create an **Access application** that protects your chmonitor Worker route.
2. Under the application settings, copy the **AUD tag** (also called Application Audience).
3. Copy your **team domain** — it looks like `https://your-team.cloudflareaccess.com`.
4. Set the env vars on the server:
   ```bash
   CHM_AUTH_PROVIDER=proxy
   CHM_CF_ACCESS_TEAM_DOMAIN=https://your-team.cloudflareaccess.com
   CHM_CF_ACCESS_AUD=<aud-tag>
   ```
5. Redeploy. Users reaching the Worker URL will be sent through the Access login flow.

## Notes

- The `VITE_AUTH_PROVIDER` client var does not need to be set for proxy auth; the browser UI does not show a sign-in button (Access handles the login page externally).
- Combine with `CHM_API_KEY_SECRET` to allow MCP/script access alongside Access-authenticated browser sessions. See [API keys](/authentication/api-keys).
- If both Cloudflare Access (`CHM_CF_ACCESS_*`) and trusted-header (`CHM_PROXY_AUTH_SECRET`) are configured, Access is checked first.

## Related

- [Authentication overview](/authentication)
- [Trusted header](/authentication/trusted-header)
- [API keys](/authentication/api-keys)
- [Environment Variables — Authentication](/reference/environment-variables#authentication)
- [Feature Permissions](/advanced/feature-permissions)
