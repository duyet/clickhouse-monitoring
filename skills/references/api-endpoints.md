# API Endpoints Reference

Complete reference for the ClickHouse Monitor API layer. All endpoints are prefixed with `/api/v1/`.

## Overview

The API provides:
- **Chart data** - Time-series metrics for visualizations
- **Table data** - Paginated query results with filtering
- **Explorer** - Database schema and metadata
- **Host management** - Multi-host configuration

**Security Note**: API responses include raw SQL queries and database structure for debugging. Do not expose to public internet without authentication.

## Authentication

Currently uses hostId-based access control. Configure hosts via environment variables:

```bash
CLICKHOUSE_HOST=host1.example.com,host2.example.com
CLICKHOUSE_USER=user1,user2
CLICKHOUSE_PASSWORD=pass1,pass2
```

The `hostId` parameter maps to these arrays (0 = first host, 1 = second, etc.).

## Response Format

All endpoints return a consistent `ApiResponse<T>` structure:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  metadata: {
    queryId: string        // Unique execution identifier
    duration: number       // Duration in milliseconds
    rows: number           // Rows returned
    host: string           // Host that executed
    clickhouseVersion?: string
    cachedAt?: number      // Timestamp if cached
    status?: DataStatus    // 'ok' | 'empty' | 'table_not_found' | etc.
    statusMessage?: string
    api?: string           // Full endpoint URL
    sql?: string           // Executed SQL
    params?: Record<string, unknown>
  }
  error?: ApiError
}
```

## Chart Data API

### GET /api/v1/charts/{name}

Fetch time-series data for a specific chart.

**Parameters:**
- `name` (path) - Chart name from registry
- `hostId` (query) - Host index (required)
- `interval` (query) - Time aggregation: `1m`, `1h`, `1d`, etc.
- `lastHours` (query) - Hours of historical data
- `params` (query) - Chart-specific parameters (JSON-encoded)

**Example:**
```bash
curl "http://localhost:3000/api/v1/charts/query-count?hostId=0&interval=1h&lastHours=24"
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "ts": "2026-03-05T00:00:00Z", "value": 1234 },
    { "ts": "2026-03-05T01:00:00Z", "value": 1456 }
  ],
  "metadata": {
    "queryId": "q_123456",
    "duration": 45,
    "rows": 24,
    "host": "clickhouse.example.com",
    "sql": "SELECT toStartOfTime(event_time) AS ts, COUNT() AS value FROM system.query_log WHERE event_time > now() - INTERVAL 24 HOUR GROUP BY ts ORDER BY ts"
  }
}
```

### Available Chart Names

**Query Monitoring:**
- `query-count` - Total query count over time
- `query-count-by-type` - Queries grouped by type (Select, Insert, etc.)
- `query-duration-p95` - 95th percentile query duration
- `query-duration-p99` - 99th percentile query duration
- `query-memory-usage` - Memory consumption by queries
- `query-read-rows` - Rows read by queries
- `query-written-rows` - Rows written by queries
- `query-cache-hit-rate` - Query cache effectiveness
- `expensive-query-count` - Count of expensive queries

**Merge Operations:**
- `merge-count` - Merge operations over time
- `merge-by-reason` - Merges by reason (Regular, TTL, etc.)
- `merge-count-by-part-type` - Merges by part type
- `parts-merged-per-merge` - Average parts per merge
- `merge-rows-read-per-second` - Merge read throughput
- `merge-rows-write-per-second` - Merge write throughput
- `merge-by-table` - Merge count by table

**System Metrics:**
- `cpu-usage` - CPU utilization percentage
- `memory-usage` - Memory consumption
- `disk-usage` - Disk space by database
- `network-bytes` - Network bytes transferred
- `connections-http` - HTTP connection count
- `connections-interserver` - Inter-server connection count

**Replication:**
- `replication-lag-max` - Maximum replication lag
- `replication-queue-length` - Pending replication tasks
- `replica-has-delay` - Replicas with delays

**ZooKeeper/Keeper:**
- `zookeeper-watch-count` - Active watches
- `zookeeper-outstanding-requests` - Outstanding requests

## Table Data API

### GET /api/v1/tables/{name}

Fetch paginated table data for a query config.

**Parameters:**
- `name` (path) - Query config name
- `hostId` (query) - Host index (required)
- `pageSize` (query) - Rows per page (default: 50)
- `page` (query) - Page number (default: 1)
- Additional parameters are passed as query params and substituted into SQL

**Example:**
```bash
curl "http://localhost:3000/api/v1/tables/running-queries?hostId=0&pageSize=20&page=1"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "query_id": "abc-123",
      "user": "admin",
      "query": "SELECT * FROM system.tables",
      "elapsed": 1.5,
      "readable_elapsed": "1.5 seconds",
      "pct_elapsed": 25.5
    }
  ],
  "metadata": {
    "queryId": "t_789012",
    "duration": 12,
    "rows": 15,
    "host": "clickhouse.example.com",
    "table": "running-queries"
  }
}
```

### Available Table Names

**Query Monitoring:**
- `running-queries` - Currently executing queries
- `history-queries` - Query execution history
- `failed-queries` - Failed query log
- `common-errors` - Frequent error patterns
- `expensive-queries` - Resource-intensive queries
- `expensive-queries-by-memory` - High memory queries
- `query-cache` - Cache statistics
- `thread-analysis` - Thread-level query breakdown
- `parallelization` - Parallel execution effectiveness

**Table Management:**
- `tables-overview` - Table storage statistics
- `replicas` - Replicated table status
- `replication-queue` - Pending replication tasks
- `readonly-tables` - Read-only table status
- `distributed-ddl-queue` - DDL task queue
- `top-usage-tables` - Most accessed tables
- `projections` - Projection definitions
- `view-refreshes` - Materialized view refreshes
- `part-info` - Active part details
- `dictionaries` - External dictionary status

**Merges:**
- `merges` - Active merge operations
- `merge-performance` - Historical merge stats
- `mutations` - Mutation status

**System:**
- `settings` - Server configuration
- `mergetree-settings` - MergeTree engine settings
- `disks` - Storage disk configuration
- `metrics` - Server metrics
- `asynchronous-metrics` - Background metrics
- `clusters` - Cluster information

**Security:**
- `sessions` - User session history
- `login-attempts` - Authentication events

**Operations:**
- `backups` - Backup history
- `errors` - Detailed error log
- `page-views` - Dashboard analytics

**Explorer:**
- `explorer-databases` - Database list
- `explorer-tables` - Table list by database
- `explorer-columns` - Column metadata
- `explorer-ddl` - Table DDL
- `explorer-dependencies-downstream` - Downstream dependencies
- `explorer-dependencies-upstream` - Upstream dependencies
- `explorer-indexes` - Skip indexes
- `explorer-projections` - Projection metadata

## Explorer API

### GET /api/v1/explorer/databases

List all databases.

**Response:**
```json
{
  "success": true,
  "data": ["default", "system", "information_schema"],
  "metadata": { ... }
}
```

### GET /api/v1/explorer/tables

List tables in a database.

**Parameters:**
- `database` (query) - Database name

### GET /api/v1/explorer/columns

Get column metadata for a table.

**Parameters:**
- `database` (query) - Database name
- `table` (query) - Table name

### GET /api/v1/explorer/ddl

Get CREATE TABLE statement.

**Parameters:**
- `database` (query) - Database name
- `table` (query) - Table name

### GET /api/v1/explorer/dependencies

Get table dependencies (views, dictionaries, etc.).

**Parameters:**
- `database` (query) - Database name
- `table` (query) - Table name
- `type` (query) - Dependency type: `all`, `upstream`, `downstream`, `table`

**Example:**
```bash
curl "http://localhost:3000/api/v1/explorer/dependencies?database=default&table=my_table&type=all&hostId=0"
```

### GET /api/v1/explorer/projections

Get projection definitions for a table.

**Parameters:**
- `database` (query) - Database name
- `table` (query) - Table name

### GET /api/v1/explorer/indexes

Get skip index definitions for a table.

**Parameters:**
- `database` (query) - Database name
- `table` (query) - Table name

### GET /api/v1/explorer/preview

Preview table data.

**Parameters:**
- `database` (query) - Database name
- `table` (query) - Table name
- `limit` (query) - Max rows (default: 100)

## Host Management

### GET /api/v1/hosts

List configured hosts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 0,
      "name": "Production",
      "host": "clickhouse-prod.example.com"
    },
    {
      "id": 1,
      "name": "Staging",
      "host": "clickhouse-staging.example.com"
    }
  ],
  "metadata": { ... }
}
```

### GET /api/v1/host-status

Get connection status for a host.

**Parameters:**
- `hostId` (query) - Host index

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "version": "24.3.1.1",
    "timezone": "UTC"
  },
  "metadata": { ... }
}
```

## Special Endpoints

### POST /api/v1/actions

Execute bulk actions on selected rows.

**Request:**
```json
{
  "action": "kill-query",
  "hostId": 0,
  "keys": ["query-id-1", "query-id-2"]
}
```

**Available Actions:**
- `kill-query` - Terminate running queries
- `explain-query` - Get query execution plan
- `open-in-explorer` - Navigate to table in explorer

### POST /api/v1/explain

Get query execution plan.

**Request:**
```json
{
  "query": "SELECT * FROM system.tables LIMIT 10",
  "hostId": 0,
  "type": "AST"  // or "PLAN", "PIPELINE"
}
```

### GET /api/v1/menu-counts/{key}

Get count badge for menu items.

**Available Keys:**
- `running-queries` - Active query count
- `tables-overview` - Table count
- `merges` - Active merge count
- `replicas` - Replica count
- `dictionaries` - Dictionary count

## Error Handling

### Error Types

```typescript
enum ApiErrorType {
  TableNotFound = 'table_not_found',
  ValidationError = 'validation_error',
  QueryError = 'query_error',
  NetworkError = 'network_error',
  PermissionError = 'permission_error'
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "type": "table_not_found",
    "message": "Table system.backup_log does not exist",
    "details": {
      "table": "system.backup_log",
      "suggestion": "Enable backup logging to see backup history"
    }
  },
  "metadata": {
    "status": "table_not_found",
    "statusMessage": "The backup_log table is not configured"
  }
}
```

### Data Status Values

- `ok` - Data returned successfully
- `empty` - Query succeeded but no data
- `table_not_configured` - Required log table not enabled
- `table_not_found` - Table does not exist
- `table_empty` - Table exists but contains no data

## Caching

The API uses SWR (stale-while-revalidate) caching on the client:
- Charts refresh every 5 minutes by default
- Manual refresh available via UI
- Stale data displayed with indicator during revalidation

## See Also

- [Development Guide](development.md) - API integration patterns
- [ClickHouse Compatibility](clickhouse-compat.md) - Query version handling
