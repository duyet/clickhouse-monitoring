import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'
import { formatDuration } from '@/lib/utils'

const QUERY_BASE = `SELECT
  formatReadableSize(read_bytes) as readable_bytes,
  read_bytes,
  formatReadableQuantity(read_rows) as readable_rows,
  read_rows,
  query_duration_ms,
  formatReadableSize(read_bytes / greatest(query_duration_ms, 1) * 1000) as readable_speed,
  memory_usage,
  formatReadableSize(memory_usage) as readable_memory,
  substring(query, 1, 200) as query,
  user,
  event_time
FROM system.query_log
WHERE type = 'QueryFinish' AND is_initial_query = 1 AND event_time > now() - INTERVAL {lastHours:UInt32} HOUR`

function buildHighlight(
  metric: string,
  row: Record<string, unknown> | null | undefined,
  opts: { valueKey: string; detailFn: (row: Record<string, unknown>) => string }
) {
  if (!row) return null
  return {
    metric,
    value: String(row[opts.valueKey] ?? 'N/A'),
    detail: opts.detailFn(row),
    query: String(row.query ?? ''),
    user: String(row.user ?? ''),
    time: String(row.event_time ?? ''),
  }
}

export function createInsightsTools(hostId: number) {
  return {
    get_query_insights: dynamicTool({
      description:
        'Discover impressive query performance statistics — largest data scans, fastest processing speeds, peak memory, longest queries. Returns highlight records with human-readable values.',
      inputSchema: z.object({
        focus: z
          .enum([
            'all',
            'largest_scan',
            'fastest_scan',
            'longest_query',
            'peak_memory',
            'summary',
          ])
          .default('all'),
        lastHours: z
          .number()
          .int()
          .min(1)
          .max(720)
          .default(720)
          .describe('Look back period in hours'),
        hostId: z.coerce.number().int().optional(),
      }),
      execute: async (input: unknown) => {
        const params = input as {
          focus:
            | 'all'
            | 'largest_scan'
            | 'fastest_scan'
            | 'longest_query'
            | 'peak_memory'
            | 'summary'
          lastHours: number
          hostId?: number
        }
        const resolved = resolveHostId(params.hostId, hostId)
        const h = params.lastHours
        const focus = params.focus

        const runQuery = (sql: string) =>
          readOnlyQuery({
            query: sql,
            query_params: { lastHours: h },
            hostId: resolved,
          })
            .then(
              (r) =>
                (Array.isArray(r) && r.length > 0 ? r[0] : null) as Record<
                  string,
                  unknown
                > | null
            )
            .catch(() => null)

        const queries: Record<
          string,
          Promise<Record<string, unknown> | null>
        > = {}

        if (focus === 'all' || focus === 'largest_scan') {
          queries.largest_scan = runQuery(
            `${QUERY_BASE}\nORDER BY read_bytes DESC LIMIT 1`
          )
        }
        if (focus === 'all' || focus === 'fastest_scan') {
          queries.fastest_scan = runQuery(
            `${QUERY_BASE}\nORDER BY (read_bytes / greatest(query_duration_ms, 1)) DESC LIMIT 1`
          )
        }
        if (focus === 'all' || focus === 'longest_query') {
          queries.longest_query = runQuery(
            `${QUERY_BASE}\nORDER BY query_duration_ms DESC LIMIT 1`
          )
        }
        if (focus === 'all' || focus === 'peak_memory') {
          queries.peak_memory = runQuery(
            `${QUERY_BASE}\nORDER BY memory_usage DESC LIMIT 1`
          )
        }

        const needSummary = focus === 'all' || focus === 'summary'
        const summaryPromise = needSummary
          ? runQuery(`SELECT
  count() as total_queries,
  formatReadableSize(sum(read_bytes)) as total_scanned,
  sum(read_rows) as total_rows_scanned,
  avg(query_duration_ms) as avg_duration_ms
FROM system.query_log
WHERE type = 'QueryFinish' AND event_time > now() - INTERVAL {lastHours:UInt32} HOUR`)
          : Promise.resolve(null)

        const entries = Object.entries(queries)
        const results = await Promise.all([
          ...entries.map(([, p]) => p),
          summaryPromise,
        ])

        const resultMap: Record<string, Record<string, unknown> | null> = {}
        entries.forEach(([key], i) => {
          resultMap[key] = results[i]
        })
        const summary = needSummary ? results[results.length - 1] : null

        const highlights: Array<{
          metric: string
          value: string
          detail: string
          query: string
          user: string
          time: string
        }> = []

        const largestScan = resultMap.largest_scan
        if (largestScan) {
          const h = buildHighlight('Largest Data Scan', largestScan, {
            valueKey: 'readable_bytes',
            detailFn: (r) =>
              `scanned ${r.readable_rows} rows in ${formatDuration(Number(r.query_duration_ms || 0))}`,
          })
          if (h) highlights.push(h)
        }

        const fastestScan = resultMap.fastest_scan
        if (fastestScan) {
          const h = buildHighlight('Fastest Scan Speed', fastestScan, {
            valueKey: 'readable_speed',
            detailFn: (r) =>
              `processed ${r.readable_bytes} in ${formatDuration(Number(r.query_duration_ms || 0))}`,
          })
          if (h) highlights.push(h)
        }

        const longestQuery = resultMap.longest_query
        if (longestQuery) {
          const h = buildHighlight('Longest Query', longestQuery, {
            valueKey: 'query_duration_ms',
            detailFn: (r) =>
              `duration ${formatDuration(Number(r.query_duration_ms || 0))}, scanned ${r.readable_bytes}`,
          })
          if (h) highlights.push(h)
        }

        const peakMemory = resultMap.peak_memory
        if (peakMemory) {
          const h = buildHighlight('Peak Memory', peakMemory, {
            valueKey: 'readable_memory',
            detailFn: (r) =>
              `used ${r.readable_memory}, scanned ${r.readable_rows} rows`,
          })
          if (h) highlights.push(h)
        }

        return {
          type: 'query_insights',
          highlights,
          summary: summary
            ? {
                total_queries: summary.total_queries,
                total_scanned: summary.total_scanned,
                total_rows_scanned: summary.total_rows_scanned,
                avg_duration_ms: summary.avg_duration_ms,
              }
            : null,
          period: `${h}h`,
        }
      },
    }),

    get_table_insights: dynamicTool({
      description:
        'Surface table-level insights — largest tables, best/worst compression ratios, most parts, column-level size breakdown. Use for storage analysis and optimization.',
      inputSchema: z.object({
        focus: z
          .enum(['size', 'rows', 'compression', 'parts', 'column_breakdown'])
          .default('size'),
        database: z
          .string()
          .optional()
          .describe('Database name filter (required for column_breakdown)'),
        table: z
          .string()
          .optional()
          .describe('Table name (required for column_breakdown)'),
        limit: z.number().int().min(1).max(50).optional().default(10),
        hostId: z.coerce.number().int().optional(),
      }),
      execute: async (input: unknown) => {
        const params = input as {
          focus: 'size' | 'rows' | 'compression' | 'parts' | 'column_breakdown'
          database?: string
          table?: string
          limit?: number
          hostId?: number
        }
        const resolved = resolveHostId(params.hostId, hostId)
        const focus = params.focus ?? 'size'
        const limit = params.limit ?? 10

        if (focus === 'column_breakdown') {
          if (!params.database || !params.table) {
            return {
              type: 'error',
              message:
                'database and table are required for column_breakdown focus',
            }
          }

          const sql = `SELECT
  column as name,
  formatReadableSize(sum(bytes_on_disk)) as compressed,
  formatReadableSize(sum(data_uncompressed_bytes)) as uncompressed,
  round(sum(data_compressed_bytes) * 1.0 / nullIf(sum(data_uncompressed_bytes), 0), 3) as compression_ratio
FROM system.parts_columns
WHERE active AND database = {database:String} AND table = {table:String}
GROUP BY column
ORDER BY sum(bytes_on_disk) DESC`

          const rows = await readOnlyQuery({
            query: sql,
            query_params: { database: params.database, table: params.table },
            hostId: resolved,
          })

          return {
            type: 'visualization',
            title: `Column Breakdown: ${params.database}.${params.table}`,
            sql,
            rows,
            rowCount: Array.isArray(rows) ? rows.length : 0,
            columns: [
              'name',
              'compressed',
              'uncompressed',
              'compression_ratio',
            ],
            viz: {
              chartType: 'bar',
              xKey: 'name',
              yKeys: ['compression_ratio'],
              sortBy: 'compressed',
              sortOrder: 'desc' as const,
            },
          }
        }

        const tableSizeSql = (orderBy: string) => `SELECT database, table,
  formatReadableSize(sum(bytes_on_disk)) as size,
  sum(rows) as total_rows,
  formatReadableQuantity(sum(rows)) as readable_rows,
  count() as part_count
FROM system.parts WHERE active
GROUP BY database, table
ORDER BY ${orderBy} DESC
LIMIT {limit:UInt32}`

        const configs: Record<
          string,
          {
            sql: string
            title: string
            yKeys: string[]
            readable: string
            sortBy: string
          }
        > = {
          size: {
            sql: tableSizeSql('sum(bytes_on_disk)'),
            title: 'Top Tables by Size',
            yKeys: ['total_rows'],
            readable: 'bytes',
            sortBy: 'size',
          },
          rows: {
            sql: tableSizeSql('sum(rows)'),
            title: 'Top Tables by Rows',
            yKeys: ['total_rows'],
            readable: 'quantity',
            sortBy: 'total_rows',
          },
          compression: {
            sql: `SELECT database, table,
  round(sum(data_compressed_bytes) * 1.0 / nullIf(sum(data_uncompressed_bytes), 0), 3) as compression_ratio,
  formatReadableSize(sum(data_uncompressed_bytes)) as uncompressed,
  formatReadableSize(sum(bytes_on_disk)) as compressed
FROM system.parts WHERE active
GROUP BY database, table
HAVING sum(data_uncompressed_bytes) > 1048576
ORDER BY compression_ratio ASC
LIMIT {limit:UInt32}`,
            title: 'Tables by Compression Ratio (best first)',
            yKeys: ['compression_ratio'],
            readable: 'number',
            sortBy: 'compression_ratio',
          },
          parts: {
            sql: `SELECT database, table, count() as part_count,
  formatReadableSize(sum(bytes_on_disk)) as size
FROM system.parts WHERE active
GROUP BY database, table
ORDER BY part_count DESC
LIMIT {limit:UInt32}`,
            title: 'Tables by Part Count',
            yKeys: ['part_count'],
            readable: 'number',
            sortBy: 'part_count',
          },
        }

        const config = configs[focus]
        const rows = await readOnlyQuery({
          query: config.sql,
          query_params: { limit },
          hostId: resolved,
        })

        return {
          type: 'visualization',
          title: config.title,
          sql: config.sql,
          rows,
          rowCount: Array.isArray(rows) ? rows.length : 0,
          columns: Object.keys(
            Array.isArray(rows) && rows.length > 0
              ? (rows[0] as Record<string, unknown>)
              : {}
          ),
          viz: {
            chartType: 'bar',
            xKey: 'table',
            yKeys: config.yKeys,
            readable: config.readable,
            sortBy: config.sortBy,
            sortOrder: 'desc' as const,
          },
        }
      },
    }),
  }
}
