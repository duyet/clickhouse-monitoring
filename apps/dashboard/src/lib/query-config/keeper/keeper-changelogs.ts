import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'
import { ColumnFormat } from '@/types/column-format'

/**
 * Keeper changelog (WAL) files — Raft write-ahead log metadata.
 * Requires ClickHouse 26.6+ with Keeper co-located on this node.
 */
export const keeperChangelogsConfig: QueryConfig = {
  name: 'keeper-changelogs',
  defaultView: 'table',
  description:
    'Local Keeper changelog (WAL) files: log index range, creation time, and file size. Changelogs record every Raft log entry and are compacted once a snapshot covers their range.',
  optional: true,
  tableCheck: 'system.keeper_changelogs',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/keeper_changelogs',
  sql: [
    {
      since: '26.6',
      sql: `
        ${QUERY_COMMENT}
        SELECT
            path,
            created_at,
            first_log_index,
            last_log_index,
            file_size,
            formatReadableSize(file_size) AS readable_file_size,
            round(file_size * 100.0 / nullIf(max(file_size) OVER (), 0), 2) AS pct_file_size
        FROM system.keeper_changelogs
        ORDER BY first_log_index DESC
        LIMIT 100
      `,
    },
  ],
  columns: [
    'path',
    'created_at',
    'first_log_index',
    'last_log_index',
    'readable_file_size',
  ],
  columnFormats: {
    path: ColumnFormat.Text,
    created_at: ColumnFormat.RelatedTime,
    first_log_index: ColumnFormat.Number,
    last_log_index: ColumnFormat.Number,
    readable_file_size: ColumnFormat.BackgroundBar,
  },
}
