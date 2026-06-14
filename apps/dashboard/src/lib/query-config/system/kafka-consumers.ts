import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const kafkaConsumersConfig: QueryConfig = {
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
    database: ColumnFormat.ColoredBadge,
    table: ColumnFormat.ColoredBadge,
    num_messages_read: ColumnFormat.NumberShort,
    num_commits: ColumnFormat.NumberShort,
    last_exception: ColumnFormat.CodeDialog,
  },
  rowClassName: (row) => {
    const lastException = String(row.last_exception || '')
    if (lastException !== '') return 'bg-red-50 dark:bg-red-950/20'
    return ''
  },
}
