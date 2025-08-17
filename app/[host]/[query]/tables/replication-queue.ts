import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const replicationQueueConfig: QueryConfig = {
  name: 'replication-queue',
  description: `Contains information about tasks from replication queues stored in ClickHouse Keeper, or ZooKeeper, for tables in the ReplicatedMergeTree family`,
  tableCheck: 'system.replication_queue',
  sql: `
      SELECT
        * EXCEPT (table, parts_to_merge),
        concat(database, '.', table) AS table,
        arrayStringConcat(parts_to_merge, ', ') AS parts_to_merge
      FROM system.replication_queue
      ORDER BY is_currently_executing DESC, create_time DESC
      LIMIT 1000
    `,
  columns: [
    'table',
    'replica_name',
    'position',
    'node_name',
    'type',
    'create_time',
    'required_quorum',
    'source_replica',
    'new_part_name',
    'parts_to_merge',
    'is_detach',
    'is_currently_executing',
    'num_tries',
    'last_exception',
    'last_exception_time',
    'last_attempt_time',
    'num_postponed',
    'postpone_reason',
    'last_postpone_time',
    'merge_type',
  ],
  columnFormats: {
    table: ColumnFormat.ColoredBadge,
    create_time: ColumnFormat.RelatedTime,
    last_exception_time: ColumnFormat.RelatedTime,
    last_attempt_time: ColumnFormat.RelatedTime,
    last_postpone_time: ColumnFormat.RelatedTime,
    type: ColumnFormat.ColoredBadge,
    is_detach: ColumnFormat.Boolean,
    is_currently_executing: ColumnFormat.Boolean,
    required_quorum: ColumnFormat.Boolean,
    last_exception: ColumnFormat.CodeDialog,
    parts_to_merge: ColumnFormat.CodeDialog,
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
