---
title: "Dashboard"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/features/dashboard.mdx"
---

> Build and save custom monitoring dashboards by combining any of the built-in charts into a single view.

| | |
|---|---|
| **Routes** | `/dashboard` |
| **Feature id** | `dashboard` |
| **Default access** | `public` |
| **Requires auth** | No (set `CHM_FEATURE_DASHBOARD_ACCESS=authenticated` to gate) |
| **System tables** | Depends on the charts added; each chart queries its own system tables (see [Overview](/features/overview), [Queries](/features/queries), etc.) |
| **ClickHouse grants** | `SELECT` on whichever system tables the chosen charts read |

## What it does

The Dashboard is a chart builder. You pick charts from the built-in library and arrange them on a canvas. The result is saved to the browser and reloaded on the next visit.

Use it to:

- Combine query-rate, memory, merge count, and replication lag on one screen for an at-a-glance SRE view.
- Create host-specific dashboards for different ClickHouse clusters.
- Share a layout with teammates by exporting the dashboard config.

Each chart on the dashboard is the same chart used on other feature pages. It fetches data from the same API endpoints and respects the same `hostId` query parameter, so the dashboard works with the host selector.

## Pages

| Page | Route | What it shows | System tables |
|---|---|---|---|
| Dashboard | `/dashboard` | User-composed chart grid; chart picker; saved layout | Depends on charts selected |

## Permissions & access

```bash
## Gate to authenticated users
CHM_FEATURE_DASHBOARD_ACCESS=authenticated

## Disable entirely
CHM_FEATURE_DASHBOARD_ENABLED=false
## or
CHM_DISABLED_FEATURES=dashboard
```

```toml
## CHM_CONFIG_FILE (TOML)
[features.dashboard]
access = "authenticated"
```

When disabled, `/dashboard` is removed from the nav and shows a disabled screen on direct visit.

## Configuration

No feature-specific server configuration. The dashboard layout is stored in the browser's localStorage; no server-side persistence is required.

```bash
## Global query settings still apply to every chart on the dashboard
CLICKHOUSE_MAX_EXECUTION_TIME=60
NEXT_QUERY_CACHE_TTL=3600
```

## Notes & limitations

- **Layout storage** — the dashboard layout is saved to `localStorage` in the browser. Clearing browser storage removes the saved layout. There is no server-side layout persistence in the current version.
- **Per-host layouts** — layouts are not differentiated per host. If you switch the host selector, the same chart grid is shown but each chart fetches data from the newly selected host.
- **Chart permissions** — if a chart reads a system table the connected ClickHouse user cannot access, that chart shows an error while the rest of the dashboard continues to load.
- **System table availability** — optional system tables (e.g. `system.part_log`, `system.query_metric_log`) must be enabled in the ClickHouse server config for the corresponding charts to show data.

## Related

- [Overview](/features/overview)
- [Queries](/features/queries)
- [Operations](/features/operations)
- [Authentication](/authentication)
- [Settings reference](/settings)
