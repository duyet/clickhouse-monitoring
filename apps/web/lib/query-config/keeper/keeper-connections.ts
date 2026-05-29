import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@/lib/clickhouse/constants'
import { ColumnFormat } from '@/types/column-format'

export const keeperConnectionsConfig: QueryConfig = {
  name: 'keeper-connections',
  description:
    'Current live Keeper/ZooKeeper connections from this ClickHouse server, one row per active connection, with compatibility across ClickHouse releases.',
  optional: true,
  tableCheck: 'system.zookeeper_connection',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_connection',
  sql: [
    {
      since: '22.11',
      sql: `
        ${QUERY_COMMENT}
        SELECT
          name,
          host,
          port,
          index,
          connected_time,
          session_uptime_elapsed_seconds,
          is_expired,
          keeper_api_version,
          client_id
        FROM system.zookeeper_connection
        ORDER BY name, host, port, index
        LIMIT 50
      `,
    },
    {
      since: '23.3',
      sql: `
        ${QUERY_COMMENT}
        SELECT
          name,
          host,
          port,
          index,
          connected_time,
          session_uptime_elapsed_seconds,
          is_expired,
          keeper_api_version,
          client_id,
          xid
        FROM system.zookeeper_connection
        ORDER BY name, host, port, index
        LIMIT 50
      `,
    },
    {
      since: '24.1',
      sql: `
        ${QUERY_COMMENT}
        SELECT
          name,
          host,
          port,
          index,
          connected_time,
          session_uptime_elapsed_seconds,
          is_expired,
          keeper_api_version,
          client_id,
          xid,
          session_timeout_ms,
          last_zxid_seen
        FROM system.zookeeper_connection
        ORDER BY name, host, port, index
        LIMIT 50
      `,
    },
    {
      since: '25.1',
      sql: `
        ${QUERY_COMMENT}
        SELECT
          name,
          host,
          port,
          index,
          connected_time,
          session_uptime_elapsed_seconds,
          is_expired,
          keeper_api_version,
          client_id,
          xid,
          session_timeout_ms,
          last_zxid_seen,
          enabled_feature_flags,
          availability_zone
        FROM system.zookeeper_connection
        ORDER BY name, host, port, index
        LIMIT 50
      `,
    },
  ],
  columns: [
    'name',
    'host',
    'port',
    'index',
    'connected_time',
    'session_uptime_elapsed_seconds',
    'is_expired',
    'keeper_api_version',
    'client_id',
    'xid',
    'session_timeout_ms',
    'last_zxid_seen',
    'enabled_feature_flags',
    'availability_zone',
  ],
  columnFormats: {
    name: ColumnFormat.Badge,
    host: ColumnFormat.Text,
    port: ColumnFormat.Number,
    index: ColumnFormat.Number,
    connected_time: ColumnFormat.RelatedTime,
    session_uptime_elapsed_seconds: ColumnFormat.Duration,
    is_expired: ColumnFormat.Boolean,
    keeper_api_version: ColumnFormat.Number,
    client_id: ColumnFormat.Number,
    xid: ColumnFormat.Number,
    session_timeout_ms: ColumnFormat.Duration,
    last_zxid_seen: ColumnFormat.Number,
    enabled_feature_flags: ColumnFormat.ColoredBadge,
    availability_zone: ColumnFormat.Text,
  },
}
