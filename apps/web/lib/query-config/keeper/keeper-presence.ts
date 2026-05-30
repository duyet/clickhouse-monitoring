import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

/**
 * Coordination-layer existence / liveness probe.
 *
 * `system.zookeeper_connection` exists since 22.11 — far broader coverage than
 * `system.zookeeper_info` (26.1+), so it is the PRIMARY signal for "does this
 * server have a coordination layer (ClickHouse Keeper / external ZooKeeper)?":
 *
 *  - table absent (tableCheck fails) → no coordination configured → ABSENT.
 *  - table present, 0 rows → configured but never connected → treat as ABSENT.
 *  - table present, ≥1 row → coordination present & reachable → PRESENT.
 *
 * `system.zookeeper_info` (keeper-info.ts) is then used purely as ENRICHMENT for
 * per-node role / latency / raft indices when it exists.
 *
 * `enabled_feature_flags` (since 25.1) is a soft hint: populated → embedded
 * ClickHouse Keeper; empty → likely external ZooKeeper. We select it on the
 * baseline column set and let `tableCheck` + version selection guard older builds
 * by simply not including it.
 */
export type KeeperPresenceRow = {
  name: string
  host: string
  port: number
  is_expired: number
  enabled_feature_flags?: string[] | null
}

export const keeperPresenceConfig: QueryConfig = {
  name: 'keeper-presence',
  description:
    'Coordination-layer existence/liveness probe from system.zookeeper_connection (broad version coverage).',
  optional: true,
  tableCheck: 'system.zookeeper_connection',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_connection',
  sql: [
    {
      // 22.11: core connection columns (no feature flags yet).
      since: '22.11',
      sql: `
        ${QUERY_COMMENT}
        SELECT
            name,
            host,
            port,
            is_expired
        FROM system.zookeeper_connection
      `,
    },
    {
      // 25.1: enabled_feature_flags distinguishes embedded Keeper vs external ZK.
      since: '25.1',
      sql: `
        ${QUERY_COMMENT}
        SELECT
            name,
            host,
            port,
            is_expired,
            enabled_feature_flags
        FROM system.zookeeper_connection
      `,
    },
  ],
  columns: ['name', 'host', 'port', 'is_expired', 'enabled_feature_flags'],
}
