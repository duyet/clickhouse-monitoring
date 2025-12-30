/**
 * Page View Charts
 * Charts for tracking application page views from monitoring_events
 */

import type { ChartQueryBuilder } from './types'
import { applyInterval, fillStep, nowOrToday } from './types'

export const pageViewCharts: Record<string, ChartQueryBuilder> = {
  'page-view': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => {
    const eventTimeExpr = applyInterval(interval, 'event_time', 'event_time')
    return {
      query: `
    SELECT ${eventTimeExpr},
           count() AS page_views
    FROM system.monitoring_events
    WHERE kind = 'PageView'
      AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
      optional: true,
      tableCheck: 'system.monitoring_events',
    }
  },
}
