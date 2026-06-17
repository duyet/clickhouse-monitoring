import type { DeclarativeQueryConfig } from '../../schema'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'

export const keeperWatchesDeclarative: DeclarativeQueryConfig = {
  name: 'keeper-watches',
  defaultView: 'auto',
  card: { primary: 'path', badges: ['watch_type'] },
  description:
    'Currently active ZooKeeper/Keeper watches registered by this server. One row per watch entry tracking path, session, and callback info. Available only on very recent ClickHouse builds (added by PR #99277, post-26.1).',
  optional: true,
  tableCheck: 'system.zookeeper_watches',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_watches',
  sql: `
      ${QUERY_COMMENT}
      SELECT
          zookeeper_name,
          path,
          session_id,
          request_xid,
          watch_type,
          create_time,
          create_time_microseconds,
          op_num
      FROM system.zookeeper_watches
      ORDER BY create_time DESC
      LIMIT 1000
  `,
  columns: [
    'zookeeper_name',
    'path',
    'session_id',
    'request_xid',
    'watch_type',
    'create_time',
    'create_time_microseconds',
    'op_num',
  ],
  columnFormats: {
    zookeeper_name: 'badge',
    path: 'code',
    session_id: 'number',
    request_xid: 'number',
    watch_type: 'colored-badge',
    create_time: 'related-time',
    create_time_microseconds: 'related-time',
    op_num: 'colored-badge',
  },
}
