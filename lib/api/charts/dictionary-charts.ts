/**
 * Dictionary Monitoring Charts
 * Charts for tracking dictionary memory usage and performance
 */

import type { ChartQueryBuilder } from './types'

export const dictionaryCharts: Record<string, ChartQueryBuilder> = {
  'dictionary-memory-usage': () => ({
    query: `
      SELECT
        database || '.' || name as dictionary_name,
        bytes_allocated,
        formatReadableSize(bytes_allocated) as readable_size
      FROM system.dictionaries
      ORDER BY bytes_allocated DESC
      LIMIT 10
    `,
  }),

  'dictionary-load-times': () => ({
    query: `
      SELECT
        database || '.' || name as dictionary_name,
        loading_duration,
        round(loading_duration, 2) as loading_duration_s
      FROM system.dictionaries
      WHERE loading_duration > 0
      ORDER BY loading_duration DESC
      LIMIT 10
    `,
  }),

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
