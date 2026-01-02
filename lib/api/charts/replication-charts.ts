/**
 * Replication Charts
 * Charts for tracking ClickHouse replication status and queue
 */

import type { ChartQueryBuilder } from './types'

import { applyInterval } from './types'

export const replicationCharts: Record<string, ChartQueryBuilder> = {
  'replication-queue-count': () => ({
    query: `
    SELECT COUNT() as count_all,
           countIf(is_currently_executing) AS count_executing
    FROM system.replication_queue
  `,
  }),

  'replication-summary-table': () => ({
    query: `
    SELECT (database || '.' || table) as table,
           type,
           countIf(is_currently_executing) AS current_executing,
           COUNT() as total
    FROM system.replication_queue
    GROUP BY 1, 2
    ORDER BY total DESC
  `,
  }),

  'readonly-replica': ({
    interval = 'toStartOfFifteenMinutes',
    lastHours = 24,
  }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           MAX(CurrentMetric_ReadonlyReplica) AS ReadonlyReplica
    FROM merge('system', '^metric_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `,
  }),

  'replication-lag': () => ({
    query: `
    SELECT
      database,
      table,
      replica_name,
      absolute_delay,
      CASE
        WHEN absolute_delay = 0 THEN 'synced'
        WHEN absolute_delay < 60 THEN 'slight lag'
        WHEN absolute_delay < 300 THEN 'moderate lag'
        ELSE 'severe lag'
      END AS lag_status,
      formatReadableTimeDelta(absolute_delay) AS readable_delay,
      inserts_in_queue,
      merges_in_queue
    FROM system.replicas
    WHERE is_leader = 1 OR absolute_delay > 0
    ORDER BY absolute_delay DESC
    LIMIT 20
  `,
  }),
}
