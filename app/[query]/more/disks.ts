import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const disksConfig: QueryConfig = {
  name: 'disks',
  sql: `
      SELECT name,
             path,
             (total_space - unreserved_space) AS used_space,
             formatReadableSize(used_space) AS readable_used_space,
             unreserved_space,
             formatReadableSize(unreserved_space) AS readable_unreserved_space,
             free_space,
             formatReadableSize(free_space) AS readable_free_space,
             total_space,
             formatReadableSize(total_space) AS readable_total_space,
             toString(round(100.0 * free_space / total_space, 2)) || '%' AS percent_free,
             keep_free_space
      FROM system.disks
      ORDER BY name
    `,
  columns: [
    'name',
    'path',
    'readable_used_space',
    'readable_total_space',
    'readable_unreserved_space',
    'readable_free_space',
    'percent_free',
    'keep_free_space',
  ],
  columnFormats: {
    name: ColumnFormat.ColoredBadge,
  },
  relatedCharts: [
    [
      'disk-size',
      {
        title: 'Disk Used',
      },
    ],
    [
      'disks-usage',
      {
        title: 'Disk Usage over last 14 days',
        interval: 'toStartOfHour',
        lastHours: 24 * 14,
      },
    ],
  ],
}
