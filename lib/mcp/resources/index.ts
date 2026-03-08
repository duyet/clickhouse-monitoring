import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const SYSTEM_TABLES_TEXT = `Key ClickHouse System Tables for Monitoring:

- system.processes — Currently running queries
- system.query_log — Historical query execution log
- system.metrics — Real-time server metrics (connections, memory, etc.)
- system.events — Cumulative event counters
- system.asynchronous_metrics — Background-calculated metrics
- system.merges — Currently running merge operations
- system.parts — Data parts of MergeTree tables
- system.tables — Table metadata (sizes, row counts, engines)
- system.databases — Database list with engines
- system.columns — Column definitions for all tables
- system.disks — Disk usage information
- system.replicas — Replication status for replicated tables
- system.clusters — Cluster configuration
- system.zookeeper — ZooKeeper/Keeper node data (if configured)
- system.backup_log — Backup operation history (if configured)
- system.errors — Server error counters
`

const QUERY_EXAMPLES_TEXT = `Common ClickHouse Monitoring Queries:

-- Server version and uptime
SELECT version(), uptime()

-- Active connections
SELECT metric, value FROM system.metrics
WHERE metric IN ('TCPConnection', 'HTTPConnection', 'MemoryTracking')

-- Top tables by size
SELECT database, name, formatReadableSize(total_bytes) AS size, total_rows
FROM system.tables ORDER BY total_bytes DESC LIMIT 20

-- Slowest queries in the last hour
SELECT query_id, user, query_duration_ms, read_rows, memory_usage,
  substring(query, 1, 200) AS query
FROM system.query_log
WHERE type = 'QueryFinish' AND event_time > now() - INTERVAL 1 HOUR
ORDER BY query_duration_ms DESC LIMIT 10

-- Current merge operations
SELECT database, table, round(progress * 100, 2) AS pct,
  formatReadableSize(total_size_bytes_compressed) AS size, elapsed
FROM system.merges ORDER BY elapsed DESC

-- Disk usage
SELECT name, path, formatReadableSize(total_space) AS total,
  formatReadableSize(free_space) AS free
FROM system.disks

-- Replication lag
SELECT database, table, is_leader, absolute_delay,
  queue_size, inserts_in_queue, merges_in_queue
FROM system.replicas ORDER BY absolute_delay DESC
`

export function registerResources(server: McpServer) {
  server.resource(
    'system-tables',
    'clickhouse://system-tables',
    {
      description:
        'Reference of key ClickHouse system tables used for monitoring',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [
        {
          uri: 'clickhouse://system-tables',
          mimeType: 'text/plain',
          text: SYSTEM_TABLES_TEXT,
        },
      ],
    })
  )

  server.resource(
    'query-examples',
    'clickhouse://query-examples',
    {
      description: 'Example SQL queries for common ClickHouse monitoring tasks',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [
        {
          uri: 'clickhouse://query-examples',
          mimeType: 'text/plain',
          text: QUERY_EXAMPLES_TEXT,
        },
      ],
    })
  )
}
