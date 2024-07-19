import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const replicasConfig: QueryConfig = {
  name: 'replicas',
  description: `Contains information and status for replicated tables residing on the local server`,
  sql: `
      SELECT *,
             database || '.' || table as table
      FROM system.replicas
      ORDER BY database, table
    `,
  columns: [
    'table',
    'engine',
    'future_parts',
    'queue_size',
    'absolute_delay',
    'total_replicas',
    'active_replicas',
    'is_leader',
    'can_become_leader',
    'is_readonly',
    'is_session_expired',
    'parts_to_check',
    'zookeeper_path',
    'replica_name',
    'replica_path',
    'columns_version',
    'inserts_in_queue',
    'merges_in_queue',
    'part_mutations_in_queue',
    'queue_oldest_time',
    'inserts_oldest_time',
    'merges_oldest_time',
    'part_mutations_oldest_time',
    'oldest_part_to_get',
    'oldest_part_to_merge_to',
    'oldest_part_to_mutate_to',
    'log_max_index',
    'log_pointer',
    'last_queue_update',
    'last_queue_update_exception',
    'zookeeper_exception',
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
      'replication-queue-count',
      {
        title: 'Replication Status',
      },
    ],
    [
      'replication-summary-table',
      {
        title: 'Replication Summary',
      },
    ],
  ],
}
