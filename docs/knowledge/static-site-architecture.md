---
id: static-site-architecture
title: Static Site Architecture
type: decision
status: active
updated: 2026-05-13
tags:
  - architecture
  - nextjs
  - swr
  - static-site
related:
  - query-config-format
  - memory-optimization
  - deployment
---

# Static Site Architecture

## Decision

The application is a **fully static site**. No SSR, no middleware, no server components. Client-side only.

## Why

- Static shell pre-rendered → faster initial page load
- Better CDN caching at edge
- Simpler deployment with standalone output
- Progressive data loading via client-side SWR

## How to Apply

- Use `'use client'` for all pages
- Use client-side redirect (`useRouter` + `useEffect`), never `redirect()` from next/navigation
- Use SWR for all data fetching
- Query params for routing (`?host=0`), not dynamic routes

### Routing

- **Old (dynamic)**: `https://example.com/0/overview`
- **New (static)**: `https://example.com/overview?host=0`

### Data Flow

```
Page (client) → useHostId() from ?host= param
  → SWR hooks (useChartData / useTableData)
    → /api/v1/* endpoints
      → ClickHouse client (with hostId)
```

### Multi-Host

All data fetching requires `hostId` parameter. Environment variables support comma-separated lists:

- `CLICKHOUSE_HOST` — host URLs
- `CLICKHOUSE_USER` — usernames
- `CLICKHOUSE_PASSWORD` — passwords
- `CLICKHOUSE_NAME` — custom display names

## Key Files

- `app/layout.tsx` — root layout with SWR provider
- `app/page.tsx` — root redirect to `/overview?host=0`
- `lib/swr/use-host.ts` — extract hostId from query params
- `lib/clickhouse.ts` — ClickHouse client (hostId required)
