import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const commonErrorsConfig: QueryConfig = {
  name: 'common-errors',
  description:
    'This table `system.errors` contains error codes and the number of times each error has been triggered. Furthermore, we can see when the error last occurred coupled with the exact error message',
  sql: `
      SELECT
          name,
          code,
          value,
          last_error_time,
          last_error_message,
          last_error_trace AS remote
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
    last_error_time: ColumnFormat.RelatedTime,
    remote: ColumnFormat.Code,
  },
}
