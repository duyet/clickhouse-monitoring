import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'

export const errorsConfig: QueryConfig = {
  name: 'errors',
  description: 'System error logs and history',
  optional: true,
  tableCheck: 'system.error_log',
  sql: `
      SELECT *
      FROM system.error_log
      WHERE if({error: String} != '', error = {error: String}, true)
      ORDER BY event_time DESC
      LIMIT 100
  `,
  columns: [
    'event_time',
    'event_date',
    'code',
    'error',
    'value',
    'remote',
    'hostname',
  ],
  columnFormats: {
    error: [ColumnFormat.Link, { href: `?error=[error]` }],
    remote: ColumnFormat.Boolean,
  },
  defaultParams: { error: '' },
  // Common ClickHouse error types for quick filtering
  // These are frequently occurring errors in production environments
  // Future improvement: fetch distinct error types dynamically from system.error_log
  filterParamPresets: [
    ...[
      'KEEPER_EXCEPTION',
      'PART_IS_TEMPORARILY_LOCKED',
      'TABLE_IS_READ_ONLY',
      'NO_REPLICA_HAS_PART',
      'INCORRECT_DATA',
      'TIMEOUT_EXCEEDED',
      'CANNOT_PARSE_INPUT_ASSERTION_FAILED',
      'ABORTED',
      'TOO_MANY_PARTS',
      'CHECKSUM_DOESNT_MATCH',
      'NETWORK_ERROR',
    ].map((error) => ({
      name: error,
      key: 'error',
      value: error,
    })),
  ],
  relatedCharts: [['zookeeper-exception', {}]],
}
