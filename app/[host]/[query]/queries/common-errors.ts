import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'

export const commonErrorsConfig: QueryConfig = {
  name: 'common-errors',
  description:
    'This table `system.errors` contains error codes and the number of times each error has been triggered. Furthermore, we can see when the error last occurred coupled with the exact error message',
  tableCheck: 'system.errors',
  sql: `
      SELECT
          name,
          code,
          value,
          round(100 * value / max(value) OVER ()) AS pct_value,
          last_error_time,
          last_error_message,
          toString(last_error_trace) AS remote
      FROM system.errors
      ORDER BY last_error_time DESC
      LIMIT 1000
    `,
  columns: [
    'name',
    'code',
    'value',
    'last_error_time',
    'last_error_message',
    'remote',
  ],
  columnFormats: {
    name: ColumnFormat.ColoredBadge,
    code: ColumnFormat.ColoredBadge,
    value: ColumnFormat.BackgroundBar,
    last_error_time: ColumnFormat.RelatedTime,
    remote: ColumnFormat.CodeDialog,
    last_error_message: [ColumnFormat.CodeDialog, { max_truncate: 100 }],
  },
}
