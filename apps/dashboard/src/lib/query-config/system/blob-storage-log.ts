import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

/**
 * system.blob_storage_log — available since ClickHouse 23.11 when an S3/blob
 * storage disk is configured. Tracks each read, write, delete, and list
 * operation sent to object storage.
 */
export const blobStorageLogConfig: QueryConfig = {
  name: 'blob-storage-log',
  defaultView: 'auto',
  card: { primary: 'remote_path', badges: ['event_type', 'disk_name'] },
  description:
    'Object storage operations (reads, writes, deletes) recorded in system.blob_storage_log',
  refreshInterval: 30_000,
  // system.blob_storage_log is opt-in: only exists when an S3/blob disk is
  // configured and ClickHouse >= 23.11.
  optional: true,
  tableCheck: 'system.blob_storage_log',
  sql: [
    {
      since: '23.11',
      sql: `
        SELECT
          event_time,
          event_type,
          disk_name,
          bucket,
          remote_path,
          data_size,
          formatReadableSize(data_size) AS readable_data_size,
          round(data_size * 100.0 / nullIf(max(data_size) OVER (), 0), 2) AS pct_data_size,
          error,
          query_id
        FROM system.blob_storage_log
        ORDER BY event_time DESC
        LIMIT 1000
      `,
    },
  ],
  columns: [
    'event_time',
    'event_type',
    'disk_name',
    'bucket',
    'remote_path',
    'readable_data_size',
    'error',
    'query_id',
  ],
  columnFormats: {
    event_time: ColumnFormat.RelatedTime,
    event_type: ColumnFormat.ColoredBadge,
    disk_name: ColumnFormat.ColoredBadge,
    remote_path: ColumnFormat.Code,
    readable_data_size: ColumnFormat.BackgroundBar,
    error: ColumnFormat.CodeDialog,
    query_id: [
      ColumnFormat.Link,
      { href: '/query?query_id=[query_id]&host=[ctx.hostId]' },
    ],
  },
  rowClassName: (row) => {
    if (row.error && String(row.error).length > 0)
      return 'bg-red-50 dark:bg-red-950/20'
    return ''
  },
}
