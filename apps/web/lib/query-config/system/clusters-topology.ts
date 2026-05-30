import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

/**
 * Per-replica view of `system.clusters` used to build the Cluster Topology graph.
 *
 * Unlike `clustersConfig` (which aggregates to one row per cluster), this returns
 * one row per (cluster, shard, replica) so the UI can reconstruct the full
 * cluster → shard → replica hierarchy and detect a single host participating in
 * multiple clusters with a different shard/replica role each time (the overlapping
 * virtual-cluster story in the design).
 *
 * This is STRUCTURAL, slow-moving data — the consuming hook caches it hard.
 *
 * `is_active` was added in v24.10; the versioned SQL falls back to a NULL-ish 1
 * (treated as "unknown / assume active") on older servers.
 */
export type ClusterTopologyRow = {
  cluster: string
  shard_num: number
  shard_weight: number
  replica_num: number
  host_name: string
  host_address: string
  port: number
  is_local: number
  errors_count: number
  slowdowns_count: number
  estimated_recovery_time: number
  is_active: number | null
}

export const clustersTopologyConfig: QueryConfig = {
  name: 'clusters-topology',
  description:
    'Per-replica rows from system.clusters for the Cluster Topology graph (one row per cluster/shard/replica).',
  sql: [
    {
      since: '23.3',
      sql: `
        ${QUERY_COMMENT}
        SELECT
            cluster,
            shard_num,
            shard_weight,
            replica_num,
            host_name,
            host_address,
            port,
            is_local,
            errors_count,
            slowdowns_count,
            toUInt32(estimated_recovery_time) AS estimated_recovery_time,
            CAST(NULL AS Nullable(UInt8)) AS is_active
        FROM system.clusters
        ORDER BY cluster ASC, shard_num ASC, replica_num ASC
      `,
    },
    {
      since: '24.10',
      sql: `
        ${QUERY_COMMENT}
        SELECT
            cluster,
            shard_num,
            shard_weight,
            replica_num,
            host_name,
            host_address,
            port,
            is_local,
            errors_count,
            slowdowns_count,
            toUInt32(estimated_recovery_time) AS estimated_recovery_time,
            is_active
        FROM system.clusters
        ORDER BY cluster ASC, shard_num ASC, replica_num ASC
      `,
    },
  ],
  columns: [
    'cluster',
    'shard_num',
    'shard_weight',
    'replica_num',
    'host_name',
    'host_address',
    'port',
    'is_local',
    'errors_count',
    'slowdowns_count',
    'estimated_recovery_time',
    'is_active',
  ],
}
