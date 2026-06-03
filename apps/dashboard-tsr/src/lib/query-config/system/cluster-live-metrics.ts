import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

/**
 * Live resource snapshot for ClickHouse nodes.
 *
 * Two configs are exported:
 *
 *  - `clusterLiveMetricsConfig` — one row for the CONNECTED (`is_local`) node only.
 *    Cheap, always works, used as the resilient fallback when the cluster fan-out
 *    is not permitted (readonly profile / missing `remote`/`cluster` grant).
 *
 *  - `clusterLiveMetricsAllConfig` — fans out to EVERY replica of a named cluster
 *    via `clusterAllReplicas({cluster:String}, view(...))`, returning one row per
 *    reachable host. `SETTINGS skip_unavailable_shards = 1` makes a partially-down
 *    cluster return the rows it CAN reach instead of throwing; nodes that are
 *    absent from the result are marked unreachable by the route (never fabricated).
 *
 * Metric sourcing (stable across 23.3+):
 *  - CPU: `OSUserTimeNormalized + OSSystemTimeNormalized` (each [0..1] per core) × 100.
 *  - Memory: `MemoryResident` (actual RSS) + `OSMemoryTotal` / `OSMemoryAvailable`.
 *  - Disk: `sum(total_space - free_space)` / `sum(total_space)` across this node's disks.
 *  - Active queries: `count()` over `system.processes` (excluding cancelled).
 *  - Looking metrics up by `metric = '…'` means a missing metric yields NULL (no row)
 *    rather than a SQL error, so this degrades gracefully without version branching.
 */
export type ClusterLiveMetricsRow = {
  hostname: string
  cpu_pct: number
  mem_used_bytes: number
  mem_total_bytes: number
  mem_available_bytes: number
  disk_used_bytes: number
  disk_total_bytes: number
  active_queries: number
  uptime_seconds: number
  version: string
}

// Inner per-node snapshot. Runs locally on each node when wrapped in view().
const LIVE_SNAPSHOT_SELECT = `
    SELECT
        hostName() AS hostname,
        round(
          100 * (
            (SELECT sum(value) FROM system.asynchronous_metrics WHERE metric IN ('OSUserTimeNormalized', 'OSSystemTimeNormalized'))
          ),
          1
        ) AS cpu_pct,
        (SELECT value FROM system.asynchronous_metrics WHERE metric = 'MemoryResident') AS mem_used_bytes,
        (SELECT value FROM system.asynchronous_metrics WHERE metric = 'OSMemoryTotal') AS mem_total_bytes,
        (SELECT value FROM system.asynchronous_metrics WHERE metric = 'OSMemoryAvailable') AS mem_available_bytes,
        (SELECT sum(total_space - free_space) FROM system.disks) AS disk_used_bytes,
        (SELECT sum(total_space) FROM system.disks) AS disk_total_bytes,
        (SELECT count() FROM system.processes WHERE is_cancelled = 0) AS active_queries,
        toUInt64(uptime()) AS uptime_seconds,
        version() AS version`

const LIVE_COLUMNS = [
  'hostname',
  'cpu_pct',
  'mem_used_bytes',
  'mem_total_bytes',
  'mem_available_bytes',
  'disk_used_bytes',
  'disk_total_bytes',
  'active_queries',
  'uptime_seconds',
  'version',
]

export const clusterLiveMetricsConfig: QueryConfig = {
  name: 'cluster-live-metrics',
  description:
    'Live CPU / memory / disk / active-query snapshot for the connected ClickHouse node.',
  sql: `
    ${QUERY_COMMENT}
    ${LIVE_SNAPSHOT_SELECT}
  `,
  columns: LIVE_COLUMNS,
}

/**
 * All-node live snapshot via clusterAllReplicas. Requires `{cluster:String}` in
 * query_params. `skip_unavailable_shards = 1` returns a subset on partial outage;
 * the failover knobs keep the coordinator from stalling on a dead peer.
 */
export const clusterLiveMetricsAllConfig: QueryConfig = {
  name: 'cluster-live-metrics-all',
  description:
    'Live per-node snapshot fanned out across every replica of a named cluster via clusterAllReplicas.',
  sql: `
    ${QUERY_COMMENT}
    SELECT * FROM clusterAllReplicas(
      {cluster:String},
      view(${LIVE_SNAPSHOT_SELECT}
      )
    )
    SETTINGS
      skip_unavailable_shards = 1,
      connections_with_failover_max_tries = 1,
      connect_timeout_with_failover_ms = 2000
  `,
  columns: LIVE_COLUMNS,
}
