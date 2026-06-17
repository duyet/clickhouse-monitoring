import type { DeclarativeQueryConfig } from '../../schema'

export const replicationQueueDeclarative: DeclarativeQueryConfig = {
  name: 'replication-queue',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['type'] },
  refreshInterval: 30_000,
  description: `Contains information about tasks from replication queues stored in ClickHouse Keeper, or ZooKeeper, for tables in the ReplicatedMergeTree family`,
  optional: false,
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
    table: 'colored-badge',
    create_time: 'related-time',
    last_exception_time: 'related-time',
    last_attempt_time: 'related-time',
    last_postpone_time: 'related-time',
    type: 'colored-badge',
    is_detach: 'boolean',
    is_currently_executing: 'boolean',
    required_quorum: 'boolean',
    last_exception: 'code-dialog',
    parts_to_merge: 'code-dialog',
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
