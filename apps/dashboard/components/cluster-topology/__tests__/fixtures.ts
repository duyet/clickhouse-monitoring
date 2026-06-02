/**
 * Deterministic fixtures for the topology rendering matrix:
 *   node counts {1,2,3,5,12} × cluster counts {1,2,3,5} × replicated/sharded/mixed
 *   × keeper {0,1,3,5} × a shared-host overlap case.
 *
 * Pure data builders — no randomness — so geometry/layout tests stay stable.
 */

import type { ClusterTopologyRow } from '@/lib/query-config/system/clusters-topology'
import type { KeeperInfoRow } from '../model'

export function chRow(
  partial: Partial<ClusterTopologyRow> & {
    cluster: string
    host_name: string
    shard_num: number
    replica_num: number
  }
): ClusterTopologyRow {
  return {
    shard_weight: 1,
    internal_replication: 0,
    host_address: '127.0.0.1',
    port: 9000,
    is_local: 0,
    user: 'default',
    default_database: 'default',
    errors_count: 0,
    slowdowns_count: 0,
    estimated_recovery_time: 0,
    database_shard_name: '',
    database_replica_name: '',
    is_active: null,
    replication_lag: null,
    recovery_time: null,
    ...partial,
  }
}

/** A replicated cluster: 1 shard, N replicas (one host per replica). */
export function replicatedCluster(
  name: string,
  replicas: number,
  hostPrefix = name
): ClusterTopologyRow[] {
  return Array.from({ length: replicas }, (_, i) =>
    chRow({
      cluster: name,
      shard_num: 1,
      replica_num: i + 1,
      host_name: `${hostPrefix}-r${i + 1}`,
      port: 9000,
    })
  )
}

/** A sharded cluster: N shards, 1 replica each. */
export function shardedCluster(
  name: string,
  shards: number,
  hostPrefix = name
): ClusterTopologyRow[] {
  return Array.from({ length: shards }, (_, i) =>
    chRow({
      cluster: name,
      shard_num: i + 1,
      replica_num: 1,
      host_name: `${hostPrefix}-s${i + 1}`,
      port: 9000,
    })
  )
}

/** S shards × R replicas. */
export function mixedCluster(
  name: string,
  shards: number,
  replicas: number,
  hostPrefix = name
): ClusterTopologyRow[] {
  const rows: ClusterTopologyRow[] = []
  for (let s = 1; s <= shards; s++) {
    for (let r = 1; r <= replicas; r++) {
      rows.push(
        chRow({
          cluster: name,
          shard_num: s,
          replica_num: r,
          host_name: `${hostPrefix}-s${s}r${r}`,
          port: 9000,
        })
      )
    }
  }
  return rows
}

export function keeperRow(
  partial: Partial<KeeperInfoRow> & { host: string }
): KeeperInfoRow {
  return {
    port: 9181,
    is_connected: 1,
    is_leader: 0,
    ...partial,
  }
}

/** N keeper nodes; the first is the leader (unless N===0). */
export function keepers(n: number): KeeperInfoRow[] {
  return Array.from({ length: n }, (_, i) =>
    keeperRow({
      host: `keeper-${i + 1}`,
      is_leader: i === 0 ? 1 : 0,
      server_state: i === 0 ? 'leader' : 'follower',
      avg_latency: 1.2,
    })
  )
}

/** Overlap case: host `shared` belongs to BOTH cluster_a and cluster_b. */
export function overlapClusters(): ClusterTopologyRow[] {
  return [
    chRow({
      cluster: 'cluster_a',
      host_name: 'a-1',
      shard_num: 1,
      replica_num: 1,
    }),
    chRow({
      cluster: 'cluster_a',
      host_name: 'shared',
      shard_num: 1,
      replica_num: 2,
    }),
    chRow({
      cluster: 'cluster_b',
      host_name: 'shared',
      shard_num: 1,
      replica_num: 1,
    }),
    chRow({
      cluster: 'cluster_b',
      host_name: 'b-1',
      shard_num: 1,
      replica_num: 2,
    }),
  ]
}

/**
 * Local-duplicate case: the connected server appears as `localhost` in the
 * implicit `default` cluster AND as its real FQDN `chi-...-0-0` in the operator
 * `cluster` — both with is_local=1 (different host_address, like a k8s pod).
 * The other two replicas are remote. Mirrors the reported screenshot.
 */
export function localDuplicateClusters(): ClusterTopologyRow[] {
  return [
    chRow({
      cluster: 'default',
      host_name: 'localhost',
      host_address: '127.0.0.1',
      is_local: 1,
      shard_num: 1,
      replica_num: 1,
    }),
    chRow({
      cluster: 'cluster',
      host_name: 'chi-clickhouse-cluster-0-0.clickhouse.svc.cluster.local',
      host_address: '10.0.0.10',
      is_local: 1,
      shard_num: 1,
      replica_num: 1,
    }),
    chRow({
      cluster: 'cluster',
      host_name: 'chi-clickhouse-cluster-0-1.clickhouse.svc.cluster.local',
      host_address: '10.0.0.11',
      shard_num: 2,
      replica_num: 1,
    }),
    chRow({
      cluster: 'cluster',
      host_name: 'chi-clickhouse-cluster-0-2.clickhouse.svc.cluster.local',
      host_address: '10.0.0.12',
      shard_num: 3,
      replica_num: 1,
    }),
  ]
}
