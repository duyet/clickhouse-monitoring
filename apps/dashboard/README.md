# chmonitor dashboard (`apps/dashboard`)

The ClickHouse monitoring dashboard — a Next.js 15 (React 19) app that reads
ClickHouse `system.*` tables to provide real-time insight into queries, merges,
replication, tables/parts, and cluster health. Deployed to Cloudflare Workers
as `chmonitor-dash` on **dash.chmonitor.dev** (also `cloud.chmonitor.dev`).

This is the primary app of the monorepo. It is a member of the root bun
workspace and shares the pinned dependency tree (see the root
[`package.json`](../../package.json) `workspaces` field).

## Architecture

Fully static site — no SSR, no middleware, client-side only:

- `'use client'` pages with client-side redirects (never `redirect()`)
- [SWR](https://swr.vercel.app) for all data fetching, with caching
- Query-param routing (`/overview?host=0`), not dynamic routes
- API routes under `app/api/v1/*` back the SWR hooks
- Multi-host: every data fetch requires a `hostId`

See the repo-root [`CLAUDE.md`](../../CLAUDE.md) for the full architecture,
conventions, and query-config reference.

## Develop

```bash
cd apps/dashboard
bun install            # or `bun install` from the repo root
bun run dev            # http://localhost:3000 (Turbopack)
bun run build          # production build (includes type checking)
bun run start          # serve the production build
```

From the repo root, `bun run dev` (turbo) starts the dashboard and MCP apps
together.

## Test & lint

```bash
bun run test                  # full Bun test suite
bun run test:unit             # targeted unit tests
bun run test:query-config     # query-config tests
bun run test:component:headless   # Cypress component tests
bun run test:e2e:headless         # Cypress e2e tests
bun run lint                  # Biome lint
bun run fmt                   # Biome format
```

## Environment

Required env vars (via `.env.local` or CI secrets):

| Variable | Purpose |
|----------|---------|
| `CLICKHOUSE_HOST` | ClickHouse host(s), comma-separated |
| `CLICKHOUSE_USER` | ClickHouse user(s), comma-separated |
| `CLICKHOUSE_PASSWORD` | ClickHouse password(s), comma-separated |

Optional: `CLICKHOUSE_NAME`, `CLICKHOUSE_MAX_EXECUTION_TIME`, `CLERK_SECRET_KEY`,
LLM API keys (`LLM_API_KEY`, `LLM_API_BASE`, `LLM_MODEL`), and analytics keys.
See [`CLAUDE.md`](../../CLAUDE.md) for the complete list.

## Deploy

```bash
bun run cf:deploy      # build -> wrangler deploy -> populate KV cache
```

Production deploys also run on push to `main` via GitHub Actions. The MCP
endpoints (`/api/mcp*`) are served by the separate [`apps/mcp`](../mcp) worker,
which is split out to keep this worker's bundle small.

## Docker

```bash
docker compose up -d   # from the repo root
bun run docker:health
```
