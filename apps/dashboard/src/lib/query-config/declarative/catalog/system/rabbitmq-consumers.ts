import type { DeclarativeQueryConfig } from '../../schema'

export const rabbitmqConsumersDeclarative: DeclarativeQueryConfig = {
  name: 'rabbitmq-consumers',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['database', 'table'] },
  description:
    'RabbitMQ table engine consumer state: active consumers, messages received, errors, and last exception (system.rabbitmq_consumers)',
  refreshInterval: 15_000,
  optional: true,
  tableCheck: 'system.rabbitmq_consumers',
  sql: `
    SELECT
      database,
      table,
      num_created_consumers,
      num_active_consumers,
      messages_received,
      formatReadableQuantity(messages_received) AS readable_messages_received,
      round(messages_received * 100.0 / nullIf(max(messages_received) OVER (), 0), 2) AS pct_messages_received,
      msg_errors,
      formatReadableQuantity(msg_errors) AS readable_msg_errors,
      round(msg_errors * 100.0 / nullIf(max(msg_errors) OVER (), 0), 2) AS pct_msg_errors,
      last_exception_time,
      last_exception
    FROM system.rabbitmq_consumers
    ORDER BY msg_errors DESC, table
  `,
  columns: [
    'database',
    'table',
    'num_created_consumers',
    'num_active_consumers',
    'readable_messages_received',
    'readable_msg_errors',
    'last_exception_time',
    'last_exception',
  ],
  columnFormats: {
    database: 'colored-badge',
    table: 'colored-badge',
    num_created_consumers: 'number',
    num_active_consumers: 'number',
    readable_messages_received: 'background-bar',
    readable_msg_errors: 'background-bar',
    last_exception: 'code-dialog',
  },
  // msg_errors > 0 → red; last_exception non-empty → amber (first match wins)
  rowStyle: {
    rules: [
      {
        when: { column: 'msg_errors', op: 'truthy' },
        className: 'bg-red-50 dark:bg-red-950/20',
      },
      {
        when: { column: 'last_exception', op: 'nonempty' },
        className: 'bg-amber-50 dark:bg-amber-950/20',
      },
    ],
    default: '',
  },
}
