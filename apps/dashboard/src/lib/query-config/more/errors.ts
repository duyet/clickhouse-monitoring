import type { QueryConfig, VersionedSql } from '@/types/query-config'

import { createExpandedPanel } from '@/components/data-table/cells/expanded-panel'
import { ColumnFormat } from '@/types/column-format'

/** Base WHERE predicate shared across all version variants. */
const errorsTail = `
      FROM system.error_log
      WHERE if({error: String} != '', error = {error: String}, true)
      ORDER BY event_time DESC
      LIMIT 100`

export const errorsConfig: QueryConfig = {
  name: 'errors',
  defaultView: 'auto',
  card: { primary: 'error', badges: ['remote'] },
  description: 'System error logs and history',
  optional: true,
  tableCheck: 'system.error_log',
  sql: [
    {
      since: '23.8',
      description: 'Base query — columns available in all supported versions',
      sql: `
      SELECT
          event_time,
          event_date,
          code,
          error,
          value,
          remote,
          hostname
      ${errorsTail}
  `,
    },
    {
      since: '25.12',
      description:
        'Added last_error_time, last_error_message, last_error_query_id, last_error_trace (CH 25.12+)',
      sql: `
      SELECT
          event_time,
          event_date,
          code,
          error,
          value,
          remote,
          hostname,
          last_error_time,
          last_error_message,
          last_error_query_id,
          last_error_trace
      ${errorsTail}
  `,
    },
  ] as VersionedSql[],
  columns: [
    'event_time',
    'event_date',
    'code',
    'error',
    'value',
    'remote',
    'hostname',
    'last_error_time',
    'last_error_message',
    'last_error_query_id',
  ],
  columnFormats: {
    error: [ColumnFormat.Link, { href: `?error=[error]` }],
    remote: ColumnFormat.Boolean,
    last_error_query_id: [
      ColumnFormat.Link,
      {
        href: '/query?query_id=[last_error_query_id]&host=[ctx.hostId]',
        className: 'truncate max-w-48',
        title: 'View query detail',
      },
    ],
    last_error_time: ColumnFormat.RelatedTime,
  },
  defaultParams: { error: '' },
  // Row expansion shows last error message + trace + query link (CH 25.12+ only)
  expandable: {
    renderExpanded: createExpandedPanel({
      sections: [
        {
          type: 'fields',
          title: 'Last Error Details',
          columns: [
            { key: 'last_error_time', label: 'Last error time' },
            { key: 'last_error_query_id', label: 'Query ID' },
          ],
        },
        {
          type: 'code',
          title: 'Last error message',
          column: 'last_error_message',
        },
        {
          type: 'code',
          title: 'Stack trace',
          column: 'last_error_trace',
        },
      ],
    }),
  },
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
