## 🚚 Migration — upgrading to v0.3 (Next.js → TanStack Start)

> **v0.3 switches the runtime app from the legacy Next.js dashboard to
> `dashboard-tsr` (TanStack Start).** The ClickHouse connection vars are
> unchanged, but **client-side (`NEXT_PUBLIC_*`) vars are renamed to `VITE_*`**
> and server auth moves to `CHM_*`. The Docker entrypoint changed too.

### What changed

| Concern | v0.2 (Next.js) | v0.3 (TanStack Start) |
|---|---|---|
| Client env prefix | `NEXT_PUBLIC_*` | `VITE_*` (build-time inlined) |
| Auth provider (client) | `NEXT_PUBLIC_AUTH_PROVIDER` | `VITE_AUTH_PROVIDER` |
| Clerk key (client) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `VITE_CLERK_PUBLISHABLE_KEY` |
| Conversation DB flag | `NEXT_PUBLIC_FEATURE_CONVERSATION_DB` | `VITE_FEATURE_CONVERSATION_DB` |
| Auth provider (server) | derived from `NEXT_PUBLIC_AUTH_PROVIDER` | `CHM_AUTH_PROVIDER` (`none\|clerk\|proxy`, wins on server) |
| Docker entrypoint | `node server.js` (OpenNext standalone) | `node server/index.mjs` (Nitro node-server) |
| ClickHouse vars | `CLICKHOUSE_HOST/USER/PASSWORD/NAME` | **unchanged** |
| Secrets | `CLERK_SECRET_KEY`, etc. | **unchanged** (still server secrets) |

The old `NEXT_PUBLIC_*` names still work as a **compatibility fallback** — the
rename is recommended but not required, nothing breaks if you skip it. Client
`VITE_*` vars are **build-time inlined** — set them when building the image /
Worker, not only at runtime. Server vars (`CLICKHOUSE_*`, `CHM_*`, `*_API_KEY`)
are read at runtime as before and are unchanged.

Full per-platform steps: see [Migrate to v0.3](/docs/migrating/v0-3).

### Paste this into any AI assistant to migrate your config

```text
You are migrating a chmonitor deployment from v0.2 (Next.js) to v0.3 (TanStack Start).
Here is my current environment (.env / docker-compose / wrangler / k8s manifest):

<PASTE YOUR ENV HERE>

Rewrite it for v0.3 applying EXACTLY these rules, and output the migrated config
plus a short list of what you changed:

1. Rename every client var prefix NEXT_PUBLIC_ -> VITE_. Specifically:
   NEXT_PUBLIC_AUTH_PROVIDER          -> VITE_AUTH_PROVIDER
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  -> VITE_CLERK_PUBLISHABLE_KEY
   NEXT_PUBLIC_FEATURE_CONVERSATION_DB-> VITE_FEATURE_CONVERSATION_DB
   (any other NEXT_PUBLIC_X -> VITE_X)
2. Add server-side auth var CHM_AUTH_PROVIDER (none|clerk|proxy) mirroring the
   client provider. It is authoritative on the server; keep VITE_AUTH_PROVIDER too
   so the browser bundle agrees.
3. Do NOT rename server vars: CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD,
   CLICKHOUSE_NAME, CLICKHOUSE_MAX_EXECUTION_TIME, CLERK_SECRET_KEY, *_API_KEY — keep as-is.
4. VITE_* vars are build-time inlined: ensure they are present at image/Worker BUILD time
   (Docker build-args or CI build env), not only at container runtime.
5. If this is a Docker deployment, change the container start command from
   `node server.js` to `node server/index.mjs`. Port 3000 and the /api/healthz
   healthcheck are unchanged.
6. Flag anything that has no v0.3 equivalent instead of silently dropping it.
```
