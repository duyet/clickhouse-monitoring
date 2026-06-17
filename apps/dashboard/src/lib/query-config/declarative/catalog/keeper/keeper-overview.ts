import type { DeclarativeQueryConfig } from '../../schema'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

/**
 * Keeper Overview page config — declarative counterpart of keeperOverviewConfig.
 *
 * keeperOverviewConfig spreads keeperInfoConfig and overrides name, description,
 * and relatedCharts. This declarative version is self-contained: all fields from
 * the spread are inlined so the catalog entry stands alone without runtime imports.
 */
export const keeperOverviewDeclarative: DeclarativeQueryConfig = {
  name: 'keeper-overview',
  defaultView: 'auto',
  card: { primary: 'host', badges: ['server_state', 'is_leader'] },
  description:
    'Keeper/ZooKeeper health overview: liveness, request load, latency, and per-node cluster state.',
  optional: true,
  tableCheck: 'system.zookeeper_info',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_info',
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
    zookeeper_cluster_name: 'text',
    host: 'text',
    port: 'number',
    is_connected: 'boolean',
    server_state: 'colored-badge',
    is_leader: 'boolean',
    version: 'text',
    avg_latency: 'duration',
    min_latency: 'duration',
    max_latency: 'duration',
    znode_count: 'number',
    watch_count: 'number',
    ephemerals_count: 'number',
    readable_approximate_data_size: 'background-bar',
    packets_received: 'number',
    packets_sent: 'number',
    outstanding_requests: 'number',
    followers: 'number',
    synced_followers: 'number',
    zxid: 'number',
    last_log_idx: 'number',
    last_committed_idx: 'number',
  },
  relatedCharts: [
    [
      'zookeeper-requests',
      {
        title: 'Requests & Watches',
        interval: 'toStartOfHour',
        lastHours: 168,
      },
    ],
    ['keeper-bytes', { title: 'Network Throughput' }],
    'break',
    ['zookeeper-wait', { title: 'Request Wait Time' }],
    ['keeper-connection-events', { title: 'Connection Events' }],
    'break',
    ['keeper-operation-mix', { title: 'Operation Mix (since server start)' }],
    ['zookeeper-exception', { title: 'Keeper Exceptions' }],
  ],
}
