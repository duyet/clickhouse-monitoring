import { ColumnFormat } from '@/components/data-table/columns'

export interface QueryConfig {
  name: string
  sql: string
  columns: string[]
  columnFormats?: { [key: string]: ColumnFormat }
  relatedCharts?: string[]
}

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
      WHERE is_cancelled = 0
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
      query: ColumnFormat.Code,
      elapsed: ColumnFormat.Duration,
      query_id: ColumnFormat.Action,
    },
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
  },
  {
    name: 'tables',
    sql: `
      SELECT database,
          table,
          sum(data_compressed_bytes) as compressed_bytes,
          sum(data_uncompressed_bytes) AS uncompressed_bytes,
          formatReadableSize(compressed_bytes) AS compressed,
          formatReadableSize(uncompressed_bytes) AS uncompressed,
          round(uncompressed_bytes / compressed_bytes, 2) AS compr_rate,
          sum(rows) AS total_rows,
          formatReadableQuantity(sum(rows)) AS total_rows_formatted,
          count() AS part_count,
          max(max_time),
          bar(compressed_bytes, 0, max(compressed_bytes) OVER (), 10) AS compressed_size_bar
      FROM cluster('default', system.parts)
      WHERE (active = 1)
        AND (database != 'system')
        AND (table LIKE '%')
      GROUP BY database,
               table
      ORDER BY database, compressed_bytes DESC
    `,
    columns: [
      'database',
      'table',
      'compressed',
      'uncompressed',
      'compr_rate',
      'total_rows_formatted',
      'part_count',
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
    }
  },
]

export const getQueryByName = (name: string) => {
  if (!name) {
    return null
  }

  return queries.find((q) => q.name === name)
}
