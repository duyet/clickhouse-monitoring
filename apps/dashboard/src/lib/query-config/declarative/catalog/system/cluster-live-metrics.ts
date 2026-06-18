import type { DeclarativeQueryConfig } from '../../schema'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

// Inner per-node snapshot SQL — mirrors the LIVE_SNAPSHOT_SELECT constant in
// the legacy cluster-live-metrics.ts config.
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

export const clusterLiveMetricsDeclarative: DeclarativeQueryConfig = {
  name: 'cluster-live-metrics',
  description:
    'Live CPU / memory / disk / active-query snapshot for the connected ClickHouse node.',
  sql: `
    ${QUERY_COMMENT}
    ${LIVE_SNAPSHOT_SELECT}
  `,
  columns: LIVE_COLUMNS,
  optional: false,
}

export const clusterLiveMetricsAllDeclarative: DeclarativeQueryConfig = {
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
  optional: false,
}
