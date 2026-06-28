---
title: "Public (no auth)"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/authentication/public.mdx"
---

The default mode. The dashboard and all `/api/v1/*` routes are open to anyone who can reach the server.

## Configuration

No configuration needed. This is the default when `CHM_AUTH_PROVIDER` is unset.

```bash
CHM_AUTH_PROVIDER=none   # or omit entirely
```

If you also set `CHM_API_KEY_SECRET`, the API key layer activates for non-browser callers — `/api/v1/*` will require a `chm_` token from scripts and MCP clients even though the browser dashboard remains open. See [API keys](/authentication/api-keys).

## When to use

- Local development
- Internal network with no external exposure
- Read-only dashboards where the data is not sensitive

## When not to use

- Any public-internet deployment where you want to restrict access
- Dashboards showing sensitive query data or credentials
- Multi-user setups where you need per-user audit trails

## How to lock down

To add authentication, switch to another provider:

- [Clerk](/authentication/clerk) — add browser sign-in with Clerk accounts
- [Cloudflare Access](/authentication/cloudflare-access) — put the dashboard behind Cloudflare Access
- [Trusted header](/authentication/trusted-header) — front with nginx or k8s ingress auth

To lock down programmatic access only (keep the dashboard open), set `CHM_API_KEY_SECRET` and issue `chm_` tokens to authorized callers. See [API keys](/authentication/api-keys).

## Related

- [Authentication overview](/authentication)
- [Environment Variables — Authentication](/reference/environment-variables#authentication)
- [Feature Permissions](/advanced/feature-permissions)
