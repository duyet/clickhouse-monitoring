/**
 * Shared transformation utilities for chart data patterns.
 *
 * These functions extract common data transformation logic used across
 * multiple chart components, promoting code reuse and consistency.
 */

/**
 * Input data structure for user event count transformations.
 * Represents a row containing event timestamp, user identifier, and count.
 */
export type UserEventCountItem = {
  event_time: string
  user: string
  count: number
}

/**
 * Output structure for user event count transformations.
 * Provides organized data for stacked bar charts with user breakdown.
 */
export type UserEventCountsTransformed<T extends string = string> = {
  /** Nested record: event_time -> user -> count */
  data: Record<T, Record<string, number>>
  /** Alphabetically sorted unique users */
  users: string[]
  /** Flattened data for chart libraries: array of objects with event_time and user keys */
  chartData: Array<Record<T, string> & Record<string, number>>
}

/**
 * Transforms an array of user event counts into a structured format for stacked bar charts.
 *
 * This function performs a single-pass transformation that:
 * 1. Collects all unique users (sorted alphabetically for consistent coloring)
 * 2. Creates a nested record structure (time -> user -> count)
 * 3. Generates flattened chart data compatible with charting libraries
 *
 * @template T - The event_time field name (default: "event_time")
 * @param data - Array of items with event_time, user, and count fields
 * @param timeField - Custom time field name (defaults to "event_time")
 * @returns Transformed data with nested structure, sorted users, and chart-ready data
 *
 * @example
 * ```ts
 * const input = [
 *   { event_time: '2024-01-01', user: 'alice', count: 5 },
 *   { event_time: '2024-01-01', user: 'bob', count: 3 },
 *   { event_time: '2024-01-02', user: 'alice', count: 7 },
 * ]
 *
 * const result = transformUserEventCounts(input)
 * // result.data = { '2024-01-01': { alice: 5, bob: 3 }, '2024-01-02': { alice: 7 } }
 * // result.users = ['alice', 'bob']
 * // result.chartData = [{ event_time: '2024-01-01', alice: 5, bob: 3 }, ...]
 * ```
 */
export function transformUserEventCounts<
  T extends string = 'event_time',
>(
  data: readonly Record<string, unknown>[],
  timeField: T = 'event_time' as T
): UserEventCountsTransformed<T> {
  const userSet = new Set<string>()
  const nestedData = data.reduce<Record<string, Record<string, number>>>(
    (acc, item) => {
      const event_time = String(item.event_time ?? '')
      const user = String(item.user ?? '')
      const count = Number(item.count ?? 0)

      userSet.add(user)

      if (acc[event_time] === undefined) {
        acc[event_time] = {}
      }

      acc[event_time][user] = count
      return acc
    },
    {}
  )

  const users = Array.from(userSet).sort()

  const chartData = Object.entries(nestedData).map(([time, userCounts]) => {
    const entry: Record<string, number | string> = { [timeField]: time }
    Object.entries(userCounts).forEach(([user, count]) => {
      entry[user] = count
    })
    return entry as Record<T, string> & Record<string, number>
  })

  return {
    data: nestedData as Record<T, Record<string, number>>,
    users,
    chartData,
  }
}

/**
 * Memory usage data structure with raw and formatted values.
 */
export type MemoryUsageData = {
  memory_usage: number
  readable_memory_usage: string
}

/**
 * Total memory data structure from system.metrics.
 */
export type TotalMemData = {
  metric: string
  total: number
  readable_total: string
}

/**
 * Rows read/written data structure.
 */
export type RowsReadWrittenData = {
  rows_read: number
  rows_written: number
  readable_rows_read: string
  readable_rows_written: string
}

/**
 * Bytes read/written data structure.
 */
export type BytesReadWrittenData = {
  bytes_read: number
  bytes_written: number
  readable_bytes_read: string
  readable_bytes_written: string
}

/**
 * Query count data structure.
 */
export type QueryCountData = {
  query_count: number
}

/**
 * Transformed summary data with formatted metric items.
 */
export type SummaryMetricsItem = {
  current: number
  target: number
  currentReadable: string
  targetReadable: string
}

/**
 * Input data structure for summary transformations.
 * Combines multiple related metrics from different queries.
 */
export type SummaryInputData = {
  used?: MemoryUsageData[]
  totalMem?: TotalMemData[]
  rowsReadWritten?: RowsReadWrittenData[]
  bytesReadWritten?: BytesReadWrittenData[]
  todayQueryCount?: QueryCountData[]
  main?: (MemoryUsageData & QueryCountData)[]
}

/**
 * Transformed summary data with primary display values and metrics.
 */
export type SummaryDataTransformed = {
  /** Primary display values for the card header */
  primary: {
    memoryUsage: string
    description: string
  }
  /** Array of metric items for comparison display */
  items: SummaryMetricsItem[]
  /** Raw data for additional logic if needed */
  raw: {
    used: MemoryUsageData
    totalMem: TotalMemData
    rowsReadWritten: RowsReadWrittenData
    bytesReadWritten?: BytesReadWrittenData
    todayQueryCount?: number
  }
}

/**
 * Transforms merge summary data into a structured format for display.
 *
 * Extracts memory usage, rows read/written, and bytes read/written metrics,
 * creating formatted comparison items showing current vs total values.
 *
 * @param data - Combined API response with nested metric arrays
 * @returns Transformed data with primary display info and metric items
 * @throws Error if required data (used, totalMem, rowsReadWritten) is missing
 *
 * @example
 * ```ts
 * const input = {
 *   used: [{ memory_usage: 1024, readable_memory_usage: '1 GiB' }],
 *   totalMem: [{ total: 8192, readable_total: '8 GiB' }],
 *   rowsReadWritten: [{ rows_read: 1000, rows_written: 500, ... }],
 *   bytesReadWritten: [{ bytes_read: 10000, bytes_written: 5000, ... }],
 * }
 *
 * const result = transformMergeSummaryData(input)
 * // result.primary = { memoryUsage: '1 GiB', description: 'memory used for merges' }
 * // result.items = [formatted comparison items]
 * ```
 */
export function transformMergeSummaryData(
  data: SummaryInputData
): SummaryDataTransformed | null {
  const used = data.used?.[0]
  const totalMem = data.totalMem?.[0]
  const rowsReadWritten = data.rowsReadWritten?.[0]
  const bytesReadWritten = data.bytesReadWritten?.[0]

  if (!used || !totalMem || !rowsReadWritten) {
    return null
  }

  const items: SummaryMetricsItem[] = []

  // Add rows comparison (smaller value first for visual consistency)
  if (rowsReadWritten.rows_read < rowsReadWritten.rows_written) {
    items.push({
      current: rowsReadWritten.rows_read,
      target: rowsReadWritten.rows_written,
      currentReadable: `${rowsReadWritten.readable_rows_read} rows read`,
      targetReadable: `${rowsReadWritten.readable_rows_written} rows written`,
    })
  } else {
    items.push({
      current: rowsReadWritten.rows_written,
      target: rowsReadWritten.rows_read,
      currentReadable: `${rowsReadWritten.readable_rows_written} rows written`,
      targetReadable: `${rowsReadWritten.readable_rows_read} rows read`,
    })
  }

  // Add bytes comparison (smaller value first for visual consistency)
  if (bytesReadWritten) {
    if (bytesReadWritten.bytes_read < bytesReadWritten.bytes_written) {
      items.push({
        current: bytesReadWritten.bytes_read,
        target: bytesReadWritten.bytes_written,
        currentReadable: `${bytesReadWritten.readable_bytes_read} read (uncompressed)`,
        targetReadable: `${bytesReadWritten.readable_bytes_written} written (uncompressed)`,
      })
    } else {
      items.push({
        current: bytesReadWritten.bytes_written,
        target: bytesReadWritten.bytes_read,
        currentReadable: `${bytesReadWritten.readable_bytes_written} written (uncompressed)`,
        targetReadable: `${bytesReadWritten.readable_bytes_read} read (uncompressed)`,
      })
    }
  }

  // Add memory usage comparison (always last)
  items.push({
    current: used.memory_usage,
    target: totalMem.total,
    currentReadable: `${used.readable_memory_usage} memory used`,
    targetReadable: `${totalMem.readable_total} total`,
  })

  return {
    primary: {
      memoryUsage: used.readable_memory_usage,
      description: 'memory used for merges',
    },
    items,
    raw: {
      used,
      totalMem,
      rowsReadWritten,
      bytesReadWritten,
    },
  }
}

/**
 * Transforms running query summary data into a structured format for display.
 *
 * Similar to merge summary but optimized for query monitoring,
 * extracting memory usage, query count, and row throughput metrics.
 *
 * @param data - Combined API response with nested metric arrays
 * @returns Transformed data with primary display info and metric items
 * @throws Error if required data (main, totalMem, rowsReadWritten) is missing
 *
 * @example
 * ```ts
 * const input = {
 *   main: [{ query_count: 5, memory_usage: 1024, readable_memory_usage: '1 GiB' }],
 *   totalMem: [{ total: 8192, readable_total: '8 GiB' }],
 *   rowsReadWritten: [{ rows_read: 1000, rows_written: 500, ... }],
 *   todayQueryCount: [{ query_count: 1000 }],
 * }
 *
 * const result = transformRunningQueriesSummaryData(input)
 * // result.primary = { memoryUsage: '1 GiB', queryCount: 5, description: '...' }
 * // result.items = [formatted comparison items]
 * ```
 */
export function transformRunningQueriesSummaryData(
  data: SummaryInputData
): SummaryDataTransformed | null {
  const main = data.main?.[0]
  const totalMem = data.totalMem?.[0]
  const rowsReadWritten = data.rowsReadWritten?.[0]
  const todayQueryCount = data.todayQueryCount?.[0]?.query_count

  if (!main || !totalMem || !rowsReadWritten) {
    return null
  }

  const items: SummaryMetricsItem[] = []

  // Add memory usage comparison (first for queries)
  items.push({
    current: main.memory_usage,
    target: totalMem.total,
    currentReadable: `${main.readable_memory_usage} memory usage`,
    targetReadable: `${totalMem.readable_total} total`,
  })

  // Add query count comparison
  items.push({
    current: main.query_count,
    target: todayQueryCount ?? main.query_count,
    currentReadable: `${main.query_count} running queries`,
    targetReadable: `${todayQueryCount ?? main.query_count} today`,
  })

  // Add rows comparison (smaller value first for visual consistency)
  if (rowsReadWritten.rows_read < rowsReadWritten.rows_written) {
    items.push({
      current: rowsReadWritten.rows_read,
      target: rowsReadWritten.rows_written,
      currentReadable: `${rowsReadWritten.readable_rows_read} rows read`,
      targetReadable: `${rowsReadWritten.readable_rows_written} rows written`,
    })
  } else {
    items.push({
      current: rowsReadWritten.rows_written,
      target: rowsReadWritten.rows_read,
      currentReadable: `${rowsReadWritten.readable_rows_written} rows written`,
      targetReadable: `${rowsReadWritten.readable_rows_read} rows read`,
    })
  }

  return {
    primary: {
      memoryUsage: main.readable_memory_usage,
      description: 'memory used for running queries',
    },
    items,
    raw: {
      used: { memory_usage: main.memory_usage, readable_memory_usage: main.readable_memory_usage },
      totalMem,
      rowsReadWritten,
      todayQueryCount,
    },
  }
}

/**
 * Safely extracts and validates nested data from API response.
 *
 * @param data - Raw API response (potentially array of unknown objects)
 * @param key - Key to extract from the first item
 * @returns Extracted array or undefined
 *
 * @example
 * ```ts
 * const response = [{ used: [...] }, { totalMem: [...] }]
 * const used = extractNestedData(response, 'used')
 * // used = [...]
 * ```
 */
export function extractNestedData<T>(
  data: unknown[] | undefined,
  key: string
): T[] | undefined {
  const firstItem = data?.[0] as Record<string, unknown> | undefined
  if (!firstItem || typeof firstItem !== 'object') {
    return undefined
  }

  const nested = firstItem[key]
  return Array.isArray(nested) ? (nested as T[]) : undefined
}

/**
 * Formats a read/write pair for display, ensuring smaller value is shown first.
 *
 * @param read - Read value and readable string
 * @param write - Write value and readable string
 * @param unit - Unit suffix for display
 * @returns Formatted comparison item
 */
export function formatReadWritePair(
  read: { value: number; readable: string },
  write: { value: number; readable: string },
  unit: string = ''
): SummaryMetricsItem {
  const isReadSmaller = read.value < write.value
  const unitPrefix = unit ? `${unit} ` : ''

  if (isReadSmaller) {
    return {
      current: read.value,
      target: write.value,
      currentReadable: `${read.readable} ${unitPrefix}read`.trim(),
      targetReadable: `${write.readable} ${unitPrefix}written`.trim(),
    }
  } else {
    return {
      current: write.value,
      target: read.value,
      currentReadable: `${write.readable} ${unitPrefix}written`.trim(),
      targetReadable: `${read.readable} ${unitPrefix}read`.trim(),
    }
  }
}
