import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const pageViewsConfig: QueryConfig = {
  name: 'page-views',
  description: 'Self analytics: Page views from system.monitoring_events',
  // system.monitoring_events may not exist if the monitoring app hasn't created it yet
  optional: true,
  tableCheck: 'system.monitoring_events',
  sql: `
    SELECT kind, actor, data, extra, event_time, event_date
    FROM system.monitoring_events
    WHERE kind = 'PageView'
      AND (if({event_date: String} != '', event_date = {event_date: String}, true))
    ORDER BY event_time DESC
    LIMIT 20
  `,
  columns: ['event_time', 'event_date', 'actor', 'data', 'extra'],
  columnFormats: {
    event_time: ColumnFormat.RelatedTime,
    data: ColumnFormat.Code,
    extra: ColumnFormat.CodeToggle,
  },
  defaultParams: { event_date: '' },
  relatedCharts: [
    [
      'page-view',
      {
        title: 'Daily Page Views',
        interval: 'toStartOfDay',
        lastHours: 24 * 30,
        colors: ['--chart-1'],
        xAxisLabel: 'Day',
      },
    ],
    ['top-pages', { title: 'Top Pages' }],
    [
      'human-vs-bot-pageviews',
      {
        title: 'Human vs Bot Pageviews',
        interval: 'toStartOfDay',
        lastHours: 24 * 30,
      },
    ],
    ['pageviews-by-device', { title: 'Pageviews by Device' }],
  ],
  disableSqlValidation: true,
}
