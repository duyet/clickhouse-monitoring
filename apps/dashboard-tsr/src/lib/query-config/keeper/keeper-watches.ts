import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'
import { ColumnFormat } from '@/types/column-format'

export const keeperWatchesConfig: QueryConfig = {
  name: 'keeper-watches',
  defaultView: 'auto',
  card: { primary: 'path', badges: ['watch_type'] },
  description:
    'Currently active ZooKeeper/Keeper watches registered by this server. One row per watch entry tracking path, session, and callback info. Available only on very recent ClickHouse builds (added by PR #99277, post-26.1).',
  optional: true,
  tableCheck: 'system.zookeeper_watches',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_watches',
  // Single SQL (no `since` pin): system.zookeeper_watches and all 8 columns were
  // added atomically in PR #99277 (master-only, post-26.1, not yet in a stable
  // release tag). tableCheck short-circuits on every version where it is absent.
  // Pinning an unconfirmed `since` would wrongly exclude the query on the first
  // releases that ship the table, so we keep one unversioned statement.
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
