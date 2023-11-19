import { QUERY_COMMENT } from '@/lib/clickhouse'
import type { QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/columns'

export const queries: Array<QueryConfig> = [
  {
    name: 'running-queries',
    sql: `
      SELECT *, 
        formatReadableQuantity(read_rows) as readable_read_rows,
        formatReadableQuantity(total_rows_approx) as readable_total_rows_approx,
        formatReadableSize(memory_usage) as readable_memory_usage,
        formatReadableSize(peak_memory_usage) as readable_peak_memory_usage
      FROM system.processes 
      WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'
      ORDER BY elapsed
    `,
    columns: [
      'query',
      'user',
      'elapsed',
      'readable_read_rows',
      'readable_total_rows_approx',
      'readable_memory_usage',
      'readable_peak_memory_usage',
      'query_id',
    ],
    columnFormats: {
      query: ColumnFormat.CodeToggle,
      elapsed: ColumnFormat.Duration,
      query_id: ColumnFormat.Action,
    },
    relatedCharts: [
      [
        'query-count-by-user',
        {
          title: 'Total Queries over last 14 days',
          interval: 'toStartOfDay',
          lastHours: 24 * 14,
          showLegend: false,
        },
      ],
      [
        'query-count',
        {
          title: 'Total Running Queries over last 12 hours (query / 5 minutes)',
          interval: 'toStartOfFiveMinutes',
          lastHours: 12,
        },
      ],
    ],
  },
  {
    name: 'merges',
    sql: `
      SELECT *,
        (cast(round(progress * 100, 1), 'String') || '%') as readable_progress,
        formatReadableQuantity(rows_read) as readable_rows_read,
        formatReadableQuantity(rows_written) as readable_rows_written,
        formatReadableSize(memory_usage) as readable_memory_usage
      FROM system.merges
      ORDER BY progress DESC
    `,
    columns: [
      'database',
      'table',
      'elapsed',
      'readable_progress',
      'num_parts',
      'readable_rows_read',
      'readable_rows_written',
      'readable_memory_usage',
      'is_mutation',
      'merge_type',
      'merge_algorithm',
    ],
    columnFormats: {
      query: ColumnFormat.Code,
      elapsed: ColumnFormat.Duration,
      is_mutation: ColumnFormat.Boolean,
    },
    relatedCharts: [
      [
        'merge-count',
        {
          title: 'Merge over last 12 hours (avg / 5 minutes)',
          interval: 'toStartOfFiveMinutes',
          lastHours: 12,
        },
      ],
    ],
  },
  {
    name: 'settings',
    sql: `
      SELECT *
      FROM system.settings
      ORDER BY name
    `,
    columns: ['name', 'value', 'changed', 'description', 'default'],
    columnFormats: {
      name: ColumnFormat.Code,
      changed: ColumnFormat.Boolean,
      value: ColumnFormat.Code,
      default: ColumnFormat.Code,
    },
  },
]

export const getQueryConfigByName = (name: string) => {
  if (!name) {
    return null
  }

  return queries.find((q) => q.name === name)
}
