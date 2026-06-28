---
title: "Clerk"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/authentication/clerk.mdx"
---

Use Clerk when you want browser-based sign-in with user accounts. The browser authenticates via a Clerk `__session` cookie, verified networklessly on each `/api/v1/*` call. The MCP server additionally accepts Clerk OAuth bearer tokens.

## How it works

- Browser clients sign in through Clerk's hosted UI.
- The `__session` cookie is sent automatically same-origin and verified on the server using the Clerk secret key — no network call per request.
- The publishable key must be present at **build time** so the client-side gate enables Clerk UI (sign-in button, user menu). The secret key is read at runtime.

## Configuration

```bash
## Server-side (runtime)
CHM_AUTH_PROVIDER=clerk
CLERK_SECRET_KEY=sk_live_...

## Client-side (build-time inlined — TanStack app)
VITE_AUTH_PROVIDER=clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

> If migrating from the legacy Next.js app, see [Migrate to v0.3](/migrating/v0-3) for the `NEXT_PUBLIC_*` → `VITE_*` rename.

## Setup steps

1. Create a Clerk application at [clerk.com](https://clerk.com).
2. Copy the **Publishable key** (`pk_live_...`) and **Secret key** (`sk_live_...`) from the Clerk dashboard.
3. Set the build-time env vars before building the client:
   ```bash
   VITE_AUTH_PROVIDER=clerk
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   ```
4. Set the runtime env vars on the server (or as Worker secrets):
   ```bash
   CHM_AUTH_PROVIDER=clerk
   wrangler secret put CLERK_SECRET_KEY   # paste sk_live_...
   ```
5. Rebuild and redeploy. The sign-in button appears in the header.

## Clerk OAuth for MCP

The MCP server at `/api/mcp` also accepts Clerk **OAuth** bearer tokens. Clerk acts as the authorization server (login, consent, dynamic client registration); chmonitor is the resource server and verifies tokens via Clerk's REST introspection. This lets MCP clients use an OAuth flow instead of a `chm_` API key. It uses the same `CLERK_SECRET_KEY` — no extra configuration needed.

See [MCP Server](/reference/mcp-server) for connection details.

## Gating features to authenticated users

Most features are public even with Clerk enabled. The **AI agent** (`agent`) and
**control actions** (`actions` — KILL QUERY, OPTIMIZE TABLE) default to
`authenticated`, so they require sign-in. To change a feature's access:

```bash
CHM_FEATURE_AGENT_ACCESS=public          # loosen the agent to public
CHM_FEATURE_TABLES_ACCESS=authenticated  # require sign-in for tables
```

See [Feature Permissions](/advanced/feature-permissions) for all feature ids and options.

## Public read-only mode

By default, Clerk gates **every** `/api/v1/*` request — an anonymous visitor sees
the dashboard shell but no data (every data call returns `401`). Set
`CHM_CLERK_PUBLIC_READ` to let anonymous visitors view read-only monitoring
content while keeping sign-in required for writes:

```bash
CHM_AUTH_PROVIDER=clerk
CHM_CLERK_PUBLIC_READ=true   # runtime / Worker var
```

Access is then split along a **read / write** boundary:

- **Reads** — predefined monitoring data (overview, queries, tables, metrics,
  charts, schema browsing) — serve to anonymous visitors.
- **Writes** — the AI agent, control actions (KILL QUERY, OPTIMIZE TABLE), and
  **arbitrary SQL execution** (SQL Console / explorer query) — still return `401`
  for anonymous callers. Running attacker-chosen SQL is treated as a write even
  though it runs read-only, because it is a far more powerful capability than a
  fixed registry query.
- API keys (`chm_` bearer tokens) and signed-in Clerk users get full read + write.

### Anonymous capability matrix

| Auth mode | Anonymous read | Anonymous write |
|---|---|---|
| `none` | ✅ | ✅ (everyone is authenticated) |
| `clerk` + `CHM_CLERK_PUBLIC_READ=true` | ✅ | ❌ |
| `clerk` (default) | ❌ | ❌ |
| `proxy` | ❌ | ❌ (proxy authenticates upstream) |

The flag only applies to the `clerk` provider — `none` is already fully public and
`proxy` fronts its own auth. It is off by default, so existing locked-down Clerk
deployments are unchanged. The client reads these flags from `GET /api/v1/config`
(`capabilities.read` / `capabilities.write`) to decide what to surface.

## Related

- [Authentication overview](/authentication)
- [API keys](/authentication/api-keys)
- [MCP Server](/reference/mcp-server)
- [Environment Variables — Authentication](/reference/environment-variables#authentication)
- [Feature Permissions](/advanced/feature-permissions)
