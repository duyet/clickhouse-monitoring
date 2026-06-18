import type { DeclarativeQueryConfig } from '../../schema'

export const commonErrorsDeclarative: DeclarativeQueryConfig = {
  name: 'common-errors',
  description:
    'This table `system.errors` contains error codes and the number of times each error has been triggered. Furthermore, we can see when the error last occurred coupled with the exact error message',
  defaultView: 'auto',
  card: { primary: 'name', badges: ['remote'] },
  tableCheck: 'system.errors',
  optional: false,
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
    name: 'colored-badge',
    code: 'colored-badge',
    value: 'background-bar',
    last_error_time: 'related-time',
    remote: 'code-dialog',
    last_error_message: ['code-dialog', { max_truncate: 100 }],
  },
}
