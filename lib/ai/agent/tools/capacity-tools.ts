import { formatBytes } from '@/lib/utils'

import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createCapacityTools(hostId: number) {
  return {
    forecast_capacity: dynamicTool({
      description:
        'Forecast storage and resource capacity based on 30-day historical trends. Analyzes storage growth from system.parts, query volume from query_log, and current disk state. Returns projections for days until disk full. Use for capacity planning and budgeting.',
      inputSchema: z.object({
        forecastDays: z
          .number()
          .int()
          .min(7)
          .max(365)
          .optional()
          .default(90)
          .describe('Number of days to forecast ahead (default: 90)'),
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { forecastDays = 90, hostId: toolHostId } = input as {
          forecastDays?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        const [storageGrowth, disks, queryTrend, tableSizes] =
          await Promise.all([
            readOnlyQuery({
              query: `
              SELECT
                toDate(modification_time) AS day,
                sum(bytes_on_disk) AS daily_bytes,
                formatReadableSize(sum(bytes_on_disk)) AS readable_size,
                count() AS parts_added
              FROM system.parts
              WHERE modification_time > now() - INTERVAL 30 DAY
                AND active
              GROUP BY day
              ORDER BY day
            `,
              hostId: resolvedHostId,
            }).catch((e: Error) => ({ error: e.message })),

            readOnlyQuery({
              query: `
              SELECT
                name,
                free_space,
                total_space,
                formatReadableSize(free_space) AS readable_free,
                formatReadableSize(total_space) AS readable_total,
                round(free_space * 100.0 / nullIf(total_space, 0), 2) AS free_pct
              FROM system.disks
            `,
              hostId: resolvedHostId,
            }).catch((e: Error) => ({ error: e.message })),

            readOnlyQuery({
              query: `
              SELECT
                toDate(event_time) AS day,
                count() AS queries,
                avg(query_duration_ms) AS avg_duration_ms,
                sum(read_bytes) AS total_read_bytes
              FROM system.query_log
              WHERE type = 'QueryFinish'
                AND event_time > now() - INTERVAL 30 DAY
              GROUP BY day
              ORDER BY day
            `,
              hostId: resolvedHostId,
            }).catch((e: Error) => ({ error: e.message })),

            readOnlyQuery({
              query: `
              SELECT
                database,
                table,
                formatReadableSize(sum(bytes_on_disk)) AS current_size,
                sum(rows) AS total_rows
              FROM system.parts
              WHERE active
              GROUP BY database, table
              ORDER BY sum(bytes_on_disk) DESC
              LIMIT 10
            `,
              hostId: resolvedHostId,
            }).catch((e: Error) => ({ error: e.message })),
          ])

        let projections = null
        if (Array.isArray(storageGrowth) && storageGrowth.length >= 7) {
          const dailyBytes = storageGrowth.map(
            (row: Record<string, unknown>) => Number(row.daily_bytes || 0)
          )
          const avgDailyGrowth =
            dailyBytes.reduce((a: number, b: number) => a + b, 0) /
            dailyBytes.length

          if (Array.isArray(disks)) {
            projections = (disks as Array<Record<string, unknown>>).map(
              (disk) => {
                const freeSpace = Number(disk.free_space || 0)
                const totalSpace = Number(disk.total_space || 0)
                const daysUntil90Pct =
                  avgDailyGrowth > 0
                    ? Math.floor(
                        (freeSpace - totalSpace * 0.1) / avgDailyGrowth
                      )
                    : null
                const daysUntilFull =
                  avgDailyGrowth > 0
                    ? Math.floor(freeSpace / avgDailyGrowth)
                    : null
                return {
                  disk: disk.name,
                  avg_daily_growth_bytes: avgDailyGrowth,
                  avg_daily_growth_readable: formatBytes(avgDailyGrowth),
                  days_until_90_pct: daysUntil90Pct,
                  days_until_full: daysUntilFull,
                  free_pct: disk.free_pct,
                }
              }
            )
          }
        }

        return {
          forecast_days: forecastDays,
          storage_trend: storageGrowth,
          current_disks: disks,
          query_volume_trend: queryTrend,
          top_tables: tableSizes,
          projections,
          instructions:
            'Analyze these trends and present a capacity planning report. Highlight any disks projected to fill within 90 days. Recommend actions if growth rate is unsustainable.',
        }
      },
    }),
  }
}
