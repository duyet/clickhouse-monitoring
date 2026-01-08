/**
 * Dictionary Monitoring Charts
 * Charts for tracking dictionary memory usage and performance
 */

import type { ChartQueryBuilder } from './types'

export const dictionaryCharts: Record<string, ChartQueryBuilder> = {
  'dictionary-count': () => ({
    query: `
      SELECT
        status,
        count() as count
      FROM system.dictionaries
      GROUP BY status
      ORDER BY count DESC
    `,
  }),
}
