import type { DeclarativeQueryConfig } from '../../schema'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

export const keeperConnectionLogDeclarative: DeclarativeQueryConfig = {
  name: 'keeper-connection-log',
  defaultView: 'auto',
  card: { primary: 'host', badges: ['type'] },
  description:
    'Time-series log of ZooKeeper/Keeper connection and disconnection events with reason codes, ordered by most recent activity. https://clickhouse.com/docs/en/operations/system-tables/zookeeper_connection_log',
  optional: true,
  tableCheck: 'system.zookeeper_connection_log',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_connection_log',
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
    event_time: 'related-time',
    hostname: 'text',
    type: 'colored-badge',
    name: 'text',
    host: 'text',
    port: 'number',
    index: 'number',
    client_id: 'code',
    reason: 'badge',
    keeper_api_version: 'number',
    enabled_feature_flags: 'colored-badge',
    availability_zone: 'badge',
  },
}
