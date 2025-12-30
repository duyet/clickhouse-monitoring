/**
 * Connection Charts
 * Charts for tracking HTTP and inter-server connections
 */

import type { ChartQueryBuilder } from './types'
import { applyInterval } from './types'

export const connectionCharts: Record<string, ChartQueryBuilder> = {
  'connections-http': ({ interval = 'toStartOfHour', lastHours = 24 * 7 }) => ({
    query: `
    /* HTTPConnection: Number of connections to HTTP server */
    /* HTTPConnectionsTotal: Total count of all sessions: stored in the pool and actively used right now for http hosts */

    SELECT
      ${applyInterval(interval, 'event_time')},
      SUM(CurrentMetric_HTTPConnection) AS CurrentMetric_HTTPConnection,
      formatReadableQuantity(CurrentMetric_HTTPConnection) AS readable_CurrentMetric_HTTPConnection,
      SUM(CurrentMetric_HTTPConnectionsTotal) AS CurrentMetric_HTTPConnectionsTotal,
      formatReadableQuantity(CurrentMetric_HTTPConnectionsTotal) AS readable_CurrentMetric_HTTPConnectionsTotal
    FROM system.metric_log
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `,
  }),

  'connections-interserver': ({
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
  }) => ({
    query: `
    SELECT
      ${applyInterval(interval, 'event_time')},
      SUM(CurrentMetric_InterserverConnection) AS CurrentMetric_InterserverConnection,
      formatReadableQuantity(CurrentMetric_InterserverConnection) AS readable_CurrentMetric_InterserverConnection
    FROM system.metric_log
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `,
  }),
}
