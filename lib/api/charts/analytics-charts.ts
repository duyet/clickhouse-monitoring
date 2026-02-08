/**
 * Analytics Charts
 * Charts for tracking application analytics and performance
 */

import type { ChartQueryBuilder } from './types'

import { applyInterval, fillStep, nowOrToday } from './types'

export const analyticsCharts: Record<string, ChartQueryBuilder> = {
  'feature-usage': ({ interval = 'toStartOfDay', lastHours = 24 * 30 }) => {
    const eventTimeExpr = applyInterval(interval, 'event_time', 'event_time')
    return {
      query: `
    SELECT ${eventTimeExpr},
           count() AS usage_count,
           JSONExtractString(data, 'feature') AS feature
    FROM system.monitoring_events
    WHERE kind = 'FeatureUsage'
      AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time, feature
    ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
      optional: true,
      tableCheck: 'system.monitoring_events',
    }
  },

  'top-features': () => ({
    query: `
    SELECT
      JSONExtractString(data, 'feature') AS feature,
      count() AS usage_count
    FROM system.monitoring_events
    WHERE kind = 'FeatureUsage'
    GROUP BY feature
    ORDER BY usage_count DESC
    LIMIT 10
  `,
    optional: true,
    tableCheck: 'system.monitoring_events',
  }),

  'errors-over-time': ({ interval = 'toStartOfDay', lastHours = 24 * 7 }) => {
    const eventTimeExpr = applyInterval(interval, 'event_time', 'event_time')
    return {
      query: `
    SELECT ${eventTimeExpr},
           count() AS error_count,
           JSONExtractString(data, 'type') AS error_type
    FROM system.monitoring_events
    WHERE kind = 'ErrorCaught'
      AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time, error_type
    ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
      optional: true,
      tableCheck: 'system.monitoring_events',
    }
  },

  'top-errors': () => ({
    query: `
    SELECT
      JSONExtractString(data, 'type') AS error_type,
      count() AS error_count,
      any(JSONExtractString(data, 'message')) AS example_message
    FROM system.monitoring_events
    WHERE kind = 'ErrorCaught'
    GROUP BY error_type
    ORDER BY error_count DESC
    LIMIT 10
  `,
    optional: true,
    tableCheck: 'system.monitoring_events',
  }),

  'performance-metrics': () => ({
    query: `
    SELECT
      JSONExtractString(data, 'name') AS metric_name,
      AVG(JSONExtractFloat(data, 'value')) AS avg_value,
      quantile(0.5)(JSONExtractFloat(data, 'value')) AS p50,
      quantile(0.95)(JSONExtractFloat(data, 'value')) AS p95,
      quantile(0.99)(JSONExtractFloat(data, 'value')) AS p99,
      count() AS sample_count
    FROM system.monitoring_events
    WHERE kind = 'PerformanceMetric'
      AND event_time >= now() - INTERVAL 24 HOUR
    GROUP BY metric_name
    ORDER BY metric_name
  `,
    optional: true,
    tableCheck: 'system.monitoring_events',
  }),

  'performance-over-time': ({ interval = 'toStartOfHour', lastHours = 24 }) => {
    const eventTimeExpr = applyInterval(interval, 'event_time', 'event_time')
    return {
      query: `
    SELECT ${eventTimeExpr},
           JSONExtractString(data, 'name') AS metric_name,
           AVG(JSONExtractFloat(data, 'value')) AS avg_value,
           count() AS sample_count
    FROM system.monitoring_events
    WHERE kind = 'PerformanceMetric'
      AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time, metric_name
    ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
      optional: true,
      tableCheck: 'system.monitoring_events',
    }
  },

  'user-actions': () => ({
    query: `
    SELECT
      JSONExtractString(data, 'action') AS action,
      JSONExtractString(data, 'target') AS target,
      JSONExtractString(data, 'context') AS context,
      count() AS action_count
    FROM system.monitoring_events
    WHERE kind = 'UserAction'
      AND event_time >= now() - INTERVAL 7 DAY
    GROUP BY action, target, context
    ORDER BY action_count DESC
    LIMIT 20
  `,
    optional: true,
    tableCheck: 'system.monitoring_events',
  }),

  'user-actions-over-time': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 7,
  }) => {
    const eventTimeExpr = applyInterval(interval, 'event_time', 'event_time')
    return {
      query: `
    SELECT ${eventTimeExpr},
           count() AS action_count,
           JSONExtractString(data, 'action') AS action
    FROM system.monitoring_events
    WHERE kind = 'UserAction'
      AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time, action
    ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
      optional: true,
      tableCheck: 'system.monitoring_events',
    }
  },
}
