import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'
import { ColumnFormat } from '@/types/column-format'

export const keeperLogConfig: QueryConfig = {
  name: 'keeper-log',
  description:
    'Per-request log of parameters sent to ZooKeeper/Keeper and the responses received. Requires <zookeeper_log> in server config (often absent in default installs). https://clickhouse.com/docs/en/operations/system-tables/zookeeper_log',
  optional: true,
  tableCheck: 'system.zookeeper_log',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper_log',
  // Version-aware: `hostname` was added in v23.11 (PR #55894); v23.3-v23.10 has
  // the table without it. `stat_aversion` is intentionally NOT selected — it
  // does not exist in system.zookeeper_log on any version (it belongs to the
  // live-tree system.zookeeper table). Verified against ClickHouse source.
  sql: [
    {
      since: '23.3',
      sql: `
        ${QUERY_COMMENT}
        SELECT
          event_time,
          thread_id,
          query_id,
          toString(address) AS address,
          port,
          session_id,
          xid,
          type,
          op_num,
          path,
          data,
          is_ephemeral,
          is_sequential,
          has_watch,
          version,
          requests_size,
          request_idx,
          zxid,
          error,
          watch_type,
          watch_state,
          path_created,
          stat_czxid,
          stat_mzxid,
          stat_pzxid,
          stat_version,
          stat_cversion,
          stat_dataLength,
          stat_numChildren,
          children
        FROM system.zookeeper_log
        WHERE event_time >= now() - INTERVAL 7 DAY
        ORDER BY event_time DESC
        LIMIT 1000
      `,
    },
    {
      since: '23.11',
      sql: `
        ${QUERY_COMMENT}
        SELECT
          hostname,
          event_time,
          thread_id,
          query_id,
          toString(address) AS address,
          port,
          session_id,
          xid,
          type,
          op_num,
          path,
          data,
          is_ephemeral,
          is_sequential,
          has_watch,
          version,
          requests_size,
          request_idx,
          zxid,
          error,
          watch_type,
          watch_state,
          path_created,
          stat_czxid,
          stat_mzxid,
          stat_pzxid,
          stat_version,
          stat_cversion,
          stat_dataLength,
          stat_numChildren,
          children
        FROM system.zookeeper_log
        WHERE event_time >= now() - INTERVAL 7 DAY
        ORDER BY event_time DESC
        LIMIT 1000
      `,
    },
  ],
  columns: [
    'hostname',
    'event_time',
    'thread_id',
    'query_id',
    'address',
    'port',
    'session_id',
    'xid',
    'type',
    'op_num',
    'path',
    'data',
    'is_ephemeral',
    'is_sequential',
    'has_watch',
    'version',
    'requests_size',
    'request_idx',
    'zxid',
    'error',
    'watch_type',
    'watch_state',
    'path_created',
    'stat_czxid',
    'stat_mzxid',
    'stat_pzxid',
    'stat_version',
    'stat_cversion',
    'stat_dataLength',
    'stat_numChildren',
    'children',
  ],
  columnFormats: {
    hostname: ColumnFormat.Text,
    event_time: ColumnFormat.RelatedTime,
    thread_id: ColumnFormat.Number,
    query_id: ColumnFormat.Text,
    address: ColumnFormat.Text,
    port: ColumnFormat.Number,
    session_id: ColumnFormat.Number,
    xid: ColumnFormat.Number,
    type: ColumnFormat.ColoredBadge,
    op_num: ColumnFormat.ColoredBadge,
    path: ColumnFormat.Code,
    data: ColumnFormat.Text,
    is_ephemeral: ColumnFormat.Boolean,
    is_sequential: ColumnFormat.Boolean,
    has_watch: ColumnFormat.Boolean,
    version: ColumnFormat.Number,
    requests_size: ColumnFormat.Number,
    request_idx: ColumnFormat.Number,
    zxid: ColumnFormat.Number,
    error: ColumnFormat.ColoredBadge,
    watch_type: ColumnFormat.ColoredBadge,
    watch_state: ColumnFormat.ColoredBadge,
    path_created: ColumnFormat.Code,
    stat_czxid: ColumnFormat.Number,
    stat_mzxid: ColumnFormat.Number,
    stat_pzxid: ColumnFormat.Number,
    stat_version: ColumnFormat.Number,
    stat_cversion: ColumnFormat.Number,
    stat_dataLength: ColumnFormat.Number,
    stat_numChildren: ColumnFormat.Number,
    children: ColumnFormat.Text,
  },
}
