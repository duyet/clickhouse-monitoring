---
id: static-site-architecture
title: Dashboard Architecture
type: decision
status: active
updated: 2026-06-22
tags:
  - architecture
  - tanstack-start
  - tanstack-query
  - cloudflare-workers
related:
  - query-config-format
  - memory-optimization
  - deployment
  - tsr-migration
---

# Dashboard Architecture

## Decision

The application is **TanStack Start** (`apps/dashboard`) deployed as a Cloudflare Worker (`chmonitor-dash`). Pages are prerendered at build time as a static shell; the Worker SSR layer handles auth middleware and API routes. Data is fetched client-side via TanStack Query.

Migration history: was a fully static Next.js SPA before the 2026-06-14 cutover (PR #1392). See [[tsr-migration]] for migration rationale and tradeoffs.

## Architecture

- **Router**: TanStack Router, file-based routes under `src/routes/(dashboard)/`
- **Data fetching**: TanStack Query (`useQuery`, `useSuspenseQuery`) replacing the old SWR hooks
- **Build**: Vite with `@cloudflare/vite-plugin` → native Workers bundle
- **SSR**: Minimal — static shell prerendered; Worker SSR only for auth and API routes
- **Multi-host routing**: `?host=0` query param (unchanged from v0.2)

## Multi-Host

All data fetching requires a `hostId` extracted from the `?host=` param. Environment variables support comma-separated lists:

- `CLICKHOUSE_HOST` — host URLs
- `CLICKHOUSE_USER` — usernames
- `CLICKHOUSE_PASSWORD` — passwords
- `CLICKHOUSE_NAME` — custom display names

## Key Files

- `src/routes/(dashboard)/` — all dashboard page routes
- `src/routes/api/` — API route handlers
- `src/lib/clickhouse.ts` — ClickHouse client (hostId required)
- `apps/dashboard/src/routes/__root.tsx` — root layout

## How to Apply

- Dashboard pages live under `src/routes/(dashboard)/` as file-based TanStack Router routes
- Use `createFileRoute` and `useSearch` for query-param access (`?host=0`)
- Use TanStack Query (`useQuery` / `useSuspenseQuery`) for all data fetching — **not** SWR hooks (legacy)
- API routes use `createAPIFileRoute` under `src/routes/api/`
- Keep data fetching at the deepest consuming component (not at page-level props)
