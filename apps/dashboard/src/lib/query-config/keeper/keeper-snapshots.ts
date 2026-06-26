import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@chm/clickhouse-client/constants'
import { ColumnFormat } from '@/types/column-format'

/**
 * Keeper snapshot files — local snapshot metadata.
 * Requires ClickHouse 26.6+ with Keeper co-located on this node.
 */
export const keeperSnapshotsConfig: QueryConfig = {
  name: 'keeper-snapshots',
  defaultView: 'table',
  description:
    'Local Keeper snapshot files: path, creation time, and file size. Snapshots are periodic full images of the Keeper znode tree used for recovery and log compaction.',
  optional: true,
  tableCheck: 'system.keeper_snapshots',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/keeper_snapshots',
  sql: [
    {
      since: '26.6',
      sql: `
        ${QUERY_COMMENT}
        SELECT
            path,
            created_at,
            file_size,
            formatReadableSize(file_size) AS readable_file_size,
            round(file_size * 100.0 / nullIf(max(file_size) OVER (), 0), 2) AS pct_file_size
        FROM system.keeper_snapshots
        ORDER BY created_at DESC
        LIMIT 100
      `,
    },
  ],
  columns: ['path', 'created_at', 'readable_file_size'],
  columnFormats: {
    path: ColumnFormat.Text,
    created_at: ColumnFormat.RelatedTime,
    readable_file_size: ColumnFormat.BackgroundBar,
  },
}
