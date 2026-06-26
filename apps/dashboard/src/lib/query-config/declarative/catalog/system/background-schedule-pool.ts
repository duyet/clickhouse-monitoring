import type { DeclarativeQueryConfig } from '../../schema'

export const backgroundSchedulePoolDeclarative: DeclarativeQueryConfig = {
  name: 'background-schedule-pool',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['task_type', 'state'] },
  description:
    'Live background scheduled tasks: active and pending jobs in the background schedule pool (system.background_schedule_pool, CH 25.12+)',
  refreshInterval: 10_000,
  optional: true,
  tableCheck: 'system.background_schedule_pool',
  sql: [
    {
      since: '25.12',
      description: 'Background schedule pool live task state',
      sql: `
        SELECT
          database,
          table,
          task_name,
          task_type,
          next_time,
          dateDiff('second', now(), next_time) AS seconds_until_next,
          formatReadableTimeDelta(abs(dateDiff('second', now(), next_time))) AS readable_next_in,
          state
        FROM system.background_schedule_pool
        ORDER BY next_time ASC
      `,
    },
  ],
  columns: [
    'database',
    'table',
    'task_name',
    'task_type',
    'next_time',
    'readable_next_in',
    'state',
  ],
  columnFormats: {
    database: 'colored-badge',
    table: 'colored-badge',
    task_type: 'colored-badge',
    state: 'colored-badge',
  },
}
