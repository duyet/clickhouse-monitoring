import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@/lib/clickhouse/constants'
import { ColumnFormat } from '@/types/column-format'

export const keeperWatchesConfig: QueryConfig = {
  name: 'keeper-watches',
  description:
    'Currently active ZooKeeper/Keeper watches registered by this server. One row per watch entry tracking path, session, and callback info. Introduced in ClickHouse 26.5.',
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
    zookeeper_name: ColumnFormat.Badge,
    path: ColumnFormat.Code,
    session_id: ColumnFormat.Number,
    request_xid: ColumnFormat.Number,
    watch_type: ColumnFormat.ColoredBadge,
    create_time: ColumnFormat.RelatedTime,
    create_time_microseconds: ColumnFormat.RelatedTime,
    op_num: ColumnFormat.ColoredBadge,
  },
}
