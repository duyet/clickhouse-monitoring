export enum ColumnFormat {
  Code = 'code',
  Duration = 'duration',
  None = 'none',
}

export interface QueryConfig {
  name: string
  sql: string
  columns: string[]
  columnFormats?: { [key: string]: ColumnFormat }
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
      WHERE is_cancelled = 0`,
    columns: [
      'query_id',
      'query',
      'user',
      'elapsed',
      'readable_read_rows',
      'readable_total_rows_approx',
      'readable_memory_usage',
      'readable_peak_memory_usage',
    ],
    columnFormats: {
      query: ColumnFormat.Code,
      elapsed: ColumnFormat.Duration,
    },
  },
  {
    name: 'merges',
    sql: `
      SELECT * 
      FROM system.merges`,
    columns: [
      'table',
      'database',
      'elapsed',
      'progress',
      'num_parts',
      'read_rows',
      'read_bytes',
      'written_rows',
      'written_bytes',
      'merged_rows',
      'merged_bytes',
      'merge_type',
      'merge_algorithm',
    ],
    columnFormats: {
      query: ColumnFormat.Code,
      elapsed: ColumnFormat.Duration,
    },
  },
]

export const getQueryByName = (name: string) => {
  if (!name) {
    return null
  }

  return queries.find((q) => q.name === name)
}
