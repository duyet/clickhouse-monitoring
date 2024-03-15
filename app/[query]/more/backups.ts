import { ColumnFormat } from '@/components/data-table/column-defs'
import { type QueryConfig } from '@/lib/types/query-config'

export const backupsConfig: QueryConfig = {
  name: 'backups',
  description: `To restore a backup:
      RESTORE TABLE data_lake.events AS data_lake.events_restore FROM Disk('s3_backup', 'data_lake.events_20231212')`,
  sql: `
      SELECT *,
        formatReadableSize(total_size) as readable_total_size,
        formatReadableSize(uncompressed_size) as readable_uncompressed_size,
        formatReadableSize(compressed_size) as readable_compressed_size,
        formatReadableSize(bytes_read) as readable_bytes_read,
        formatReadableQuantity(files_read) as readable_files_read,
        formatReadableQuantity(num_entries) as readable_num_entries
      FROM system.backup_log
      ORDER BY start_time DESC
    `,
  columns: [
    'id',
    'name',
    'status',
    'start_time',
    'end_time',
    'num_files',
    'readable_total_size',
    'num_entries',
    'readable_uncompressed_size',
    'readable_compressed_size',
    'readable_files_read',
    'readable_bytes_read',
    'error',
  ],
  columnFormats: {
    status: ColumnFormat.ColoredBadge,
    start_time: ColumnFormat.RelatedTime,
    end_time: ColumnFormat.RelatedTime,
    error: ColumnFormat.Code,
    ProfileEvents: ColumnFormat.Code,
  },
  relatedCharts: [
    [
      'backup-size',
      {
        title: 'Backup over last day',
        lastHours: 24,
      },
    ],
    [
      'backup-size',
      {
        title: 'All backup',
      },
    ],
  ],
}
