import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

/**
 * Live resource snapshot for the CONNECTED ClickHouse node.
 *
 * The topology graph shows live CPU / memory / disk / active-query numbers for the
 * node we are connected to (the `is_local` node in system.clusters). We deliberately
 * do NOT fan out to every replica here: `clusterAllReplicas` can fail or be slow when
 * a cluster is partially down, and the design's per-node live numbers for remote nodes
 * were a mock. Remote nodes render their structural state (errors / active) only —
 * never fabricated metrics.
 *
 * One row. Cheap. Polled on a short interval, separate from the structural query so
 * the slow-moving topology is not refetched on every live tick.
 */
export type ClusterLiveMetricsRow = {
  hostname: string
  cpu_pct: number
  mem_used_bytes: number
  mem_total_bytes: number
  disk_used_bytes: number
  disk_total_bytes: number
  active_queries: number
  uptime_seconds: number
  version: string
}

export const clusterLiveMetricsConfig: QueryConfig = {
  name: 'cluster-live-metrics',
  description:
    'Live CPU / memory / disk / active-query snapshot for the connected ClickHouse node.',
  sql: `
    ${QUERY_COMMENT}
    SELECT
        hostName() AS hostname,
        round(
          100 * (
            (SELECT sum(value) FROM system.asynchronous_metrics WHERE metric IN ('OSUserTimeNormalized', 'OSSystemTimeNormalized'))
          ),
          1
        ) AS cpu_pct,
        (SELECT sum(value) FROM system.metrics WHERE metric = 'MemoryTracking') AS mem_used_bytes,
        (SELECT sum(value) FROM system.asynchronous_metrics WHERE metric = 'OSMemoryTotal') AS mem_total_bytes,
        (SELECT sum(total_space - free_space) FROM system.disks) AS disk_used_bytes,
        (SELECT sum(total_space) FROM system.disks) AS disk_total_bytes,
        (SELECT count() FROM system.processes WHERE is_cancelled = 0) AS active_queries,
        toUInt64(uptime()) AS uptime_seconds,
        version() AS version
  `,
  columns: [
    'hostname',
    'cpu_pct',
    'mem_used_bytes',
    'mem_total_bytes',
    'disk_used_bytes',
    'disk_total_bytes',
    'active_queries',
    'uptime_seconds',
    'version',
  ],
}
