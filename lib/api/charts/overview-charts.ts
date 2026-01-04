/**
 * Overview Charts
 * Charts for the overview page displaying system status metrics
 */

import type { ChartQueryBuilder } from './types'

export const overviewCharts: Record<string, ChartQueryBuilder> = {
  'running-queries-count': () => ({
    query: `
      SELECT COUNT() as count FROM system.processes WHERE is_cancelled = 0
    `,
  }),

  'database-count': () => ({
    query: `
      SELECT countDistinct(database) as count FROM system.tables
      WHERE lower(database) NOT IN ('system', 'information_schema')
    `,
  }),

  'table-count': () => ({
    query: `
      SELECT countDistinct(format('{}.{}', database, table)) as count FROM system.tables
      WHERE lower(database) NOT IN ('system', 'information_schema')
    `,
  }),

  'disk-size-single': () => ({
    query: `
      SELECT name,
             (total_space - unreserved_space) AS used_space,
             formatReadableSize(used_space) AS readable_used_space,
             total_space,
             formatReadableSize(total_space) AS readable_total_space
      FROM system.disks
      ORDER BY name
      LIMIT 1
    `,
  }),
}
