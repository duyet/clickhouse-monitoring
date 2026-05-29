import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'
import { ColumnFormat } from '@/types/column-format'

export const keeperInfoConfig: QueryConfig = {
  name: 'keeper-info',
  description:
    'Cluster health introspection of all available Keeper/ZooKeeper nodes: one row per node with role, latency, raft log indices, znode/watch counts, and data size metrics.',
  optional: true,
  tableCheck: 'system.zookeeper_info',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_info',
  // system.zookeeper_info and all 22 columns shipped atomically in v26.1
  // (PR #90809); tableCheck handles older versions where the table is absent.
  sql: [
    {
      since: '26.1',
      sql: `
        ${QUERY_COMMENT}
        SELECT
            zookeeper_cluster_name,
            host,
            port,
            is_connected,
            server_state,
            is_leader,
            version,
            avg_latency,
            min_latency,
            max_latency,
            znode_count,
            watch_count,
            ephemerals_count,
            approximate_data_size,
            formatReadableSize(coalesce(approximate_data_size, 0)) AS readable_approximate_data_size,
            round(coalesce(approximate_data_size, 0) * 100.0 / nullIf(max(coalesce(approximate_data_size, 0)) OVER (), 0), 2) AS pct_approximate_data_size,
            packets_received,
            packets_sent,
            outstanding_requests,
            followers,
            synced_followers,
            zxid,
            last_log_idx,
            last_committed_idx
        FROM system.zookeeper_info
        ORDER BY zookeeper_cluster_name ASC, is_leader DESC, host ASC
      `,
    },
  ],
  columns: [
    'zookeeper_cluster_name',
    'host',
    'port',
    'is_connected',
    'server_state',
    'is_leader',
    'version',
    'avg_latency',
    'min_latency',
    'max_latency',
    'znode_count',
    'watch_count',
    'ephemerals_count',
    'readable_approximate_data_size',
    'packets_received',
    'packets_sent',
    'outstanding_requests',
    'followers',
    'synced_followers',
    'zxid',
    'last_log_idx',
    'last_committed_idx',
  ],
  columnFormats: {
    zookeeper_cluster_name: ColumnFormat.Text,
    host: ColumnFormat.Text,
    port: ColumnFormat.Number,
    is_connected: ColumnFormat.Boolean,
    server_state: ColumnFormat.ColoredBadge,
    is_leader: ColumnFormat.Boolean,
    version: ColumnFormat.Text,
    avg_latency: ColumnFormat.Duration,
    min_latency: ColumnFormat.Duration,
    max_latency: ColumnFormat.Duration,
    znode_count: ColumnFormat.Number,
    watch_count: ColumnFormat.Number,
    ephemerals_count: ColumnFormat.Number,
    readable_approximate_data_size: ColumnFormat.BackgroundBar,
    packets_received: ColumnFormat.Number,
    packets_sent: ColumnFormat.Number,
    outstanding_requests: ColumnFormat.Number,
    followers: ColumnFormat.Number,
    synced_followers: ColumnFormat.Number,
    zxid: ColumnFormat.Number,
    last_log_idx: ColumnFormat.Number,
    last_committed_idx: ColumnFormat.Number,
  },
}
