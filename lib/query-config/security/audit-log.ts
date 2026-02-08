import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

/**
 * Audit Log Query Configuration
 *
 * Displays security events, access control changes, and audit trail from ClickHouse.
 */
export const auditLogConfig: QueryConfig = {
  name: 'audit-log',
  description: 'Security events and audit trail',
  sql: `
    SELECT
      event_time,
      type,
      query_id,
      user,
      query,
      exception_code,
      exception_text
    FROM system.query_log
    WHERE type = 'QueryFinish'
      AND (query LIKE '%GRANT%' OR query LIKE '%REVOKE%' OR query LIKE '%CREATE ROLE%' OR query LIKE '%DROP ROLE%')
      AND event_time >= (now() - INTERVAL 7 DAY)
    ORDER BY event_time DESC
  `,
  columns: [
    'event_time',
    'type',
    'query_id',
    'user',
    'query',
    'exception_code',
    'exception_text',
  ],
  columnFormats: {
    event_time: [ColumnFormat.Text, {}],
    type: [ColumnFormat.Text, {}],
    query: [ColumnFormat.CodeDialog, {}],
  },
}
