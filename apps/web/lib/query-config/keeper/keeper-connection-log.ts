import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'
import { ColumnFormat } from '@/types/column-format'

export const keeperConnectionLogConfig: QueryConfig = {
  name: 'keeper-connection-log',
  description:
    'Time-series log of ZooKeeper/Keeper connection and disconnection events with reason codes, ordered by most recent activity. https://clickhouse.com/docs/en/operations/system-tables/zookeeper_connection_log',
  optional: true,
  tableCheck: 'system.zookeeper_connection_log',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_connection_log',
  // Introduced whole-cloth in v25.8 (PR #79494) with all columns; tableCheck
  // handles older versions where the table is absent.
  sql: [
    {
      since: '25.8',
      sql: `
        ${QUERY_COMMENT}
        SELECT
            event_time,
            hostname,
            type,
            name,
            host,
            port,
            index,
            client_id,
            reason,
            keeper_api_version,
            enabled_feature_flags,
            availability_zone
        FROM system.zookeeper_connection_log
        WHERE event_time >= now() - INTERVAL 7 DAY
        ORDER BY event_time DESC
        LIMIT 1000
      `,
    },
  ],
  columns: [
    'event_time',
    'hostname',
    'type',
    'name',
    'host',
    'port',
    'index',
    'client_id',
    'reason',
    'keeper_api_version',
    'enabled_feature_flags',
    'availability_zone',
  ],
  columnFormats: {
    event_time: ColumnFormat.RelatedTime,
    hostname: ColumnFormat.Text,
    type: ColumnFormat.ColoredBadge,
    name: ColumnFormat.Text,
    host: ColumnFormat.Text,
    port: ColumnFormat.Number,
    index: ColumnFormat.Number,
    client_id: ColumnFormat.Code,
    reason: ColumnFormat.Badge,
    keeper_api_version: ColumnFormat.Number,
    enabled_feature_flags: ColumnFormat.ColoredBadge,
    availability_zone: ColumnFormat.Badge,
  },
}
