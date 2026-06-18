import type { DeclarativeQueryConfig } from '../../schema'

export const kafkaConsumersDeclarative: DeclarativeQueryConfig = {
  name: 'kafka-consumers',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['consumer_id'] },
  description:
    'Kafka table engine consumer state: poll/commit activity, messages read, and last exception per consumer',
  refreshInterval: 15_000,
  // system.kafka_consumers only exists if Kafka table engines are configured
  optional: true,
  tableCheck: 'system.kafka_consumers',
  sql: `
      SELECT
        database,
        table,
        consumer_id,
        assignments.topic AS topics,
        assignments.partition_id AS partitions,
        last_poll_time,
        num_messages_read,
        last_commit_time,
        num_commits,
        last_exception_time,
        last_exception
      FROM system.kafka_consumers
      ORDER BY table
    `,
  columns: [
    'database',
    'table',
    'consumer_id',
    'topics',
    'partitions',
    'last_poll_time',
    'num_messages_read',
    'last_commit_time',
    'num_commits',
    'last_exception_time',
    'last_exception',
  ],
  columnFormats: {
    database: 'colored-badge',
    table: 'colored-badge',
    num_messages_read: 'number-short',
    num_commits: 'number-short',
    last_exception: 'code-dialog',
  },
  // Replaces the legacy rowClassName: highlight rows with a non-empty
  // last_exception. default '' matches the legacy no-match return.
  rowStyle: {
    rules: [
      {
        when: { column: 'last_exception', op: 'nonempty' },
        className: 'bg-red-50 dark:bg-red-950/20',
      },
    ],
    default: '',
  },
}
