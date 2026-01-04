import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const readOnlyTablesConfig: QueryConfig = {
  name: 'readonly-tables',
  description: `Readonly tables and their replicas`,
  sql: `
      SELECT
        database || '.' || table as table,
        is_readonly,
        absolute_delay,
        zookeeper_path,
        last_queue_update_exception,
        last_queue_update,
        zookeeper_exception,
        total_replicas,
        active_replicas,
        is_leader,
        is_session_expired,
        replica_name,
        replica_path,
        log_pointer,
        engine
      FROM system.replicas
      WHERE is_readonly = 1
      ORDER BY database, table
    `,
  columns: [
    'table',
    'is_readonly',
    'absolute_delay',
    'zookeeper_path',
    'last_queue_update_exception',
    'last_queue_update',
    'zookeeper_exception',
    'total_replicas',
    'active_replicas',
    'is_leader',
    'is_session_expired',
    'replica_name',
    'replica_path',
    'log_pointer',
    'engine',
  ],
  columnFormats: {
    table: ColumnFormat.ColoredBadge,
    engine: ColumnFormat.ColoredBadge,
    is_leader: ColumnFormat.Boolean,
    can_become_leader: ColumnFormat.Boolean,
    is_readonly: ColumnFormat.Boolean,
    is_session_expired: ColumnFormat.Boolean,
    replica_name: ColumnFormat.ColoredBadge,
  },
  relatedCharts: [
    [
      'readonly-replica',
      {
        title: 'Readonly Replica',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
      },
    ],
  ],
}
