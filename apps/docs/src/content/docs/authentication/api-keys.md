---
title: "API keys (chm_ Bearer)"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/authentication/api-keys.mdx"
---

The API key layer is provider-agnostic. It activates whenever `CHM_API_KEY_SECRET` is set, regardless of which auth provider is configured. This is how MCP clients, scripts, and CI pipelines authenticate.

## How it works

- Keys are HMAC-SHA-256 signed and time-limited.
- A valid key satisfies the auth guard on any `/api/v1/*` route.
- The key layer coexists with any provider: a valid key always grants access, and if the key is absent or invalid the provider's check runs next.

## Configuration

```bash
CHM_API_KEY_SECRET=a-long-random-string-keep-this-secret
```

Set this out-of-band in production. For Cloudflare Workers:

```bash
wrangler secret put CHM_API_KEY_SECRET
```

## Issuing a token

Call the key-issuance endpoint. It uses its own secret-based auth (the same `CHM_API_KEY_SECRET`):

```bash
curl -X POST https://dash.example.com/api/v1/auth/api-key \
  -H "Authorization: Bearer $CHM_API_KEY_SECRET"
```

The response includes a `chm_` token. Tokens are time-limited; re-issue before expiry.

## Using a token

Pass the token in the `Authorization` header:

```bash
curl https://dash.example.com/api/v1/hosts \
  -H "Authorization: Bearer chm_eyJ..."
```

```bash
## MCP client example
curl https://dash.example.com/api/mcp \
  -H "Authorization: Bearer chm_eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Notes

- Never put `CHM_API_KEY_SECRET` in a `VITE_*` or `NEXT_PUBLIC_*` variable — keep it server-side only.
- The `/api/mcp` endpoint also accepts Clerk OAuth bearer tokens. See [Clerk](/authentication/clerk) and [MCP Server](/reference/mcp-server).
- Feature-level permissions apply on top of the key auth. See [Feature Permissions](/advanced/feature-permissions).

## Related

- [Authentication overview](/authentication)
- [MCP Server](/reference/mcp-server)
- [Environment Variables — Authentication](/reference/environment-variables#authentication)
