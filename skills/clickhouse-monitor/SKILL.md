---
name: clickhouse-monitor
description: Specialized knowledge for the ClickHouse Monitor dashboard. Use this skill when: working with ClickHouse monitoring dashboards, analyzing query performance, writing ClickHouse system table queries, developing dashboard features, or integrating with the ClickHouse Monitor API. Covers query monitoring, table management, merge operations, system metrics, and ClickHouse version compatibility.
version: 1.0.0
author: duyet
license: MIT
---

# ClickHouse Monitor

Real-time monitoring and observability dashboard for ClickHouse clusters. Static site architecture with client-side SWR data fetching, multi-host support, and version-aware queries.

## Quick Start

### Dashboard Access

Navigate using query parameter routing (`?host=N` for multi-host setups):
- `/overview?host=0` - System overview (Connections, Queries, Merges, Replication, System)
- `/running-queries?host=0` - Active queries with progress tracking
- `/explorer?host=0` - Interactive database schema browser
- `/merges?host=0` - Active merge operations with progress
- `/clusters?host=0` - Cluster configuration and ZooKeeper status

### Multi-Host Configuration

Configure multiple ClickHouse instances via comma-separated environment variables:

```bash
CLICKHOUSE_HOST=prod.example.com,staging.example.com
CLICKHOUSE_USER=admin,readonly
CLICKHOUSE_PASSWORD=secret,readonly_secret
CLICKHOUSE_NAME="Production,Staging"
```

Access hosts via `?host=0`, `?host=1`, etc. in URLs.

## Core Features

### Query Monitoring

Track query performance and resource usage:
- **Running Queries** - Active queries with progress %, memory, row counts, estimated completion
- **History Queries** - Query log with execution metrics (duration, CPU, memory)
- **Failed Queries** - Error details, stack traces, failure patterns
- **Expensive Queries** - Ranked by CPU, memory, duration, rows read
- **Query Cache** - Hit/miss rates, size, eviction statistics
- **Thread Analysis** - Per-thread performance breakdown for parallel queries
- **Parallelization** - Thread utilization and parallel effectiveness

### Table Management

Browse database objects and metadata:
- **Data Explorer** - Interactive schema tree (databases → tables → columns → dependencies)
- **Tables Overview** - Storage stats, part counts, sizes, replication status
- **Replicas** - Health status, lag, queue size, absolute delay
- **Replication Queue** - Pending/in-progress tasks from Keeper/ZooKeeper
- **Projections** - Definition, status, usage statistics
- **View Refreshes** - Materialized view refresh schedules and history
- **Part Info** - Active part details with levels, rows, bytes
- **Dictionaries** - External dictionary status, source type, memory usage

### Merge Operations

Monitor background MergeTree activity:
- **Merges** - Active merges with progress, rows read/written, memory
- **Merge Performance** - Historical merge trends, part size distribution
- **Mutations** - Table mutation status, progress, failed mutations
- **New Parts Created** - Part creation frequency for optimization

### System Metrics

Real-time server monitoring:
- **Metrics** - CPU, memory, disk, network, query counters
- **Async Metrics** - Background-calculated metrics (cache sizes, queue depths)
- **Disks** - Storage volume configuration and usage
- **Settings** - Server configuration values and current settings
- **MergeTree Settings** - Engine-specific settings per table

### Security & Logs

Track security events and system logs:
- **Sessions** - User session history with authentication details
- **Login Attempts** - Authentication events, failures, reason codes
- **Audit Log** - Security-related events (DDL, user changes, access)
- **Text Log** - Server logs with query context and stack traces
- **Stack Traces** - Live thread stack traces for debugging
- **Crashes** - Historical crash reports with diagnostics

## API Usage

### Chart Data

Fetch time-series data for visualization:

```http
GET /api/v1/charts/{chartName}?hostId={hostId}&interval={interval}&lastHours={hours}
```

**Parameters:**
- `chartName` - Name from chart registry (see references for full list)
- `hostId` - Host index (0-based)
- `interval` - Time bucket: `1m`, `5m`, `1h`, `1d`
- `lastHours` - Historical range (default: 24)

**Response:**
```json
{
  "success": true,
  "data": [{ "ts": "2026-03-05T00:00:00Z", "value": 1234 }],
  "metadata": {
    "queryId": "abc123",
    "duration": 45,
    "rows": 24,
    "host": "clickhouse.example.com",
    "clickhouseVersion": "24.3.1.1"
  }
}
```

### Table Data

Fetch paginated table data:

```http
GET /api/v1/tables/{queryConfigName}?hostId={hostId}&pageSize={n}&page={p}
```

Supports sorting (`sortCol`, `sortOrder`) and filtering per query config.

### Database Explorer

Browse schema structure:

```http
GET /api/v1/explorer/databases?hostId={hostId}
GET /api/v1/explorer/tables?hostId={hostId}&database={db}
GET /api/v1/explorer/columns?hostId={hostId}&database={db}&table={t}
```

## Development Patterns

### Static Site Architecture

**CRITICAL**: Fully static site with client-side data fetching. No SSR, no middleware.

**Routing Pattern:**
```typescript
// Static route with query parameter
app/overview/page.tsx  →  /overview?host=0

// NOT dynamic routes (deprecated)
// app/[host]/overview/page.tsx
```

**Page Component Template:**
```typescript
'use client'

import { Suspense } from 'react'
import { useHostId } from '@/lib/swr'
import { ChartSkeleton } from '@/components/skeletons'
import { YourChart } from '@/components/charts/your-chart'

export default function YourPage() {
  const hostId = useHostId()  // Extracts from ?host= query param

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <YourChart hostId={hostId} />
    </Suspense>
  )
}
```

### SWR Data Fetching

All data uses SWR with the `hostId` pattern:

```typescript
import useSWR from 'swr'
import { useChartData } from '@/lib/swr/use-chart-data'

export function YourChart({ hostId }: { hostId: number }) {
  const { data, error, isLoading } = useChartData({
    name: 'your-chart-name',
    hostId,
    interval: 300000,  // 5 minutes SWR cache
  })

  if (isLoading) return <ChartSkeleton />
  if (error) return <ChartError error={error} />
  // ... render chart with data
}
```

### Adding Charts

1. **Define query** in `lib/api/charts/{domain}-charts.ts`:
```typescript
export const yourChart: ChartQueryBuilder = (params) => ({
  sql: `
    SELECT toStartOfInterval(event_time, INTERVAL {interval:UInt64} SECOND) AS ts,
           COUNT() AS value
    FROM system.query_log
    WHERE event_time > now() - INTERVAL {lastHours:UInt64} HOUR
    GROUP BY ts ORDER BY ts
  `,
  columns: ['ts', 'value'],
})
```

2. **Register** in `lib/api/chart-registry.ts`:
```typescript
export const chartRegistry = {
  // ...
  'your-chart-name': yourChart,
}
```

3. **Create component** in `components/charts/`:
```typescript
'use client'
import { useChartData } from '@/lib/swr/use-chart-data'

export function YourChart({ hostId }: { hostId: number }) {
  const { data } = useChartData({ name: 'your-chart-name', hostId })
  // Render using Recharts or Tremor
}
```

### Query Configuration

Add table views via `QueryConfig` in `lib/query-config/queries/`:

```typescript
export const yourConfig: QueryConfig = {
  name: 'your-query',
  description: 'Query description',
  sql: `
    SELECT database, table,
           formatReadableQuantity(sum(rows)) AS total_rows
    FROM system.parts
    WHERE active
    GROUP BY database, table
    ORDER BY total_rows DESC
  `,
  columns: ['database', 'table', 'total_rows'],
  columnFormats: {
    database: ColumnFormat.Badge,
    total_rows: [ColumnFormat.BackgroundBar, {
      base: 'rows',
      readable: 'total_rows',
      pct: 'pct_rows'
    }],
  },
}
```

**BackgroundBar format** requires 3 SQL columns:
```sql
rows,                              -- base value
formatReadableQuantity(rows) AS total_rows,  -- display
round(rows * 100 / max(rows) OVER (), 2) AS pct_rows  -- percentage
```

## ClickHouse Compatibility

### Version-Aware Queries

ClickHouse system tables change between versions. Use `VersionedSql[]`:

```typescript
export const yourConfig: QueryConfig = {
  name: 'your-query',
  sql: [
    { since: '23.8', sql: 'SELECT col1 FROM system.table' },
    { since: '24.3', sql: 'SELECT col1, col2 FROM system.table' },
  ],
  columns: ['col1', 'col2'],
}
```

The system selects the appropriate query based on detected ClickHouse version.

### Optional Tables

Some tables don't exist depending on configuration. Mark as `optional`:

```typescript
export const backupsConfig: QueryConfig = {
  name: 'backups',
  optional: true,  // Graceful handling if table missing
  tableCheck: 'system.backup_log',
  sql: 'SELECT * FROM system.backup_log',
  // ...
}
```

**Optional tables**: `backup_log`, `error_log`, `zookeeper`, `monitoring_events`.

## Common Issues

**Empty charts?**
- Verify required log tables enabled: `query_log`, `metric_log`, `part_log`
- Check ClickHouse configuration for log settings
- See `docs/clickhouse-schemas/` for table requirements

**API returns `table_not_found`?**
- Optional table missing - verify ClickHouse configuration
- Version mismatch - check `docs/clickhouse-schemas/tables/{table}.md`

**Multi-host not working?**
- Verify all three env arrays have same length
- Use comma-separated values: `host1,host2` (not spaces)
- Check each host's credentials individually

## References

- [Complete API List](references/api-list.md) - All 58 charts and 63 table endpoints
- [Dashboard Pages](references/dashboard-pages.md) - All 45 dashboard pages with descriptions
- [API Endpoints](references/api-endpoints.md) - Detailed API documentation with examples
- [Development Guide](references/development.md) - Architecture patterns, conventions, contribution workflow
- [ClickHouse Compatibility](references/clickhouse-compat.md) - Version-aware queries, schema docs, optional tables
- [Project Repository](https://github.com/duyet/clickhouse-monitor)

---

*This skill documentation is automatically generated from the codebase. Run `bun run scripts/generate-skill-docs.ts` to update.*
