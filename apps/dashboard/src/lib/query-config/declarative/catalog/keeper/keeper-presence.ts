import type { DeclarativeQueryConfig } from '../../schema'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

export const keeperPresenceDeclarative: DeclarativeQueryConfig = {
  name: 'keeper-presence',
  defaultView: 'auto',
  card: { primary: 'name', badges: ['is_expired'] },
  description:
    'Coordination-layer existence/liveness probe from system.zookeeper_connection (broad version coverage).',
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
            is_expired
        FROM system.zookeeper_connection
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
            is_expired,
            enabled_feature_flags
        FROM system.zookeeper_connection
      `,
    },
  ],
  columns: ['name', 'host', 'port', 'is_expired', 'enabled_feature_flags'],
}
