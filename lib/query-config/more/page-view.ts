import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'system.monitoring_events'

export const pageViewConfig: QueryConfig = {
  name: 'page-view',
  description: `Self analytics: Page views from ${EVENTS_TABLE}`,
  // Disable e2e test for this query
  disableSqlValidation: true,
  tableCheck: EVENTS_TABLE,
  sql: `
    SELECT kind, actor, data, extra, event_time, event_date
    FROM ${EVENTS_TABLE}
    WHERE kind = 'PageView'
      AND (if({event_date: String} != '', event_date = {event_date: String}, true))
    ORDER BY event_time DESC
    LIMIT 100
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
        lastHours: 24 * 14,
        colors: ['--chart-1'],
        xAxisLabel: 'Day',
      },
    ],
    [
      'page-view',
      {
        title: 'Monthly Page Views',
        interval: 'toStartOfMonth',
        lastHours: 24 * 365,
        colors: ['--chart-2'],
        xAxisLabel: 'Month',
      },
    ],
    ['top-pages', { title: 'Top Pages by Views' }],
    ['human-vs-bot-pageviews', { title: 'Human vs Bot Pageviews' }],
    ['pageviews-by-device', { title: 'Pageviews by Device' }],
    ['pageviews-by-country', { title: 'Pageviews by Country' }],
  ],
}
