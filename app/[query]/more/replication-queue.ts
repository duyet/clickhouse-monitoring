import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const replicationQueueConfig: QueryConfig = {
  name: 'replication-queue',
  description: `Contains information about tasks from replication queues stored in ClickHouse Keeper, or ZooKeeper, for tables in the ReplicatedMergeTree family`,
  sql: `
      SELECT *,
             database || '.' || table as table
      FROM system.replication_queue
      ORDER BY is_currently_executing DESC, create_time DESC
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
    last_exception: ColumnFormat.CodeToggle,
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
