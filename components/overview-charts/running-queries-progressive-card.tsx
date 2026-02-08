'use client'

import { memo, useMemo } from 'react'
import { ProgressiveMetricCard } from '@/components/cards/progressive-metric-card'
import type { MetricItem } from '@/components/cards/disclosure-levels'

/**
 * RunningQueriesProgressiveCard - Progressive disclosure version of RunningQueriesCard
 *
 * Demonstrates the 4-level progressive disclosure pattern:
 * - Level 0: Running query count headline
 * - Level 1: Today's queries, 5min trend, avg query time
 * - Level 2: Top tables by query count table
 * - Level 3: SQL query used to fetch data
 *
 * NOTE: This is a demo component with static data. For production use,
 * integrate with actual data fetching via SWR hooks.
 */

export const RunningQueriesProgressiveCard = memo(
  function RunningQueriesProgressiveCard() {
    // Demo data - in production, this would come from SWR
    const runningCount = 15
    const todayCount = 1234
    const avgDuration = 2500 // ms
    const medianDuration = 1200 // ms

    // Build key metrics for Level 1
    const keyMetrics: MetricItem[] = [
      {
        label: "Today's Queries",
        value: todayCount.toLocaleString(),
        trend: 5, // This would be calculated from historical data
      },
      {
        label: 'Avg Duration',
        value: (avgDuration / 1000).toFixed(2),
        unit: 's',
      },
      {
        label: 'Median Duration',
        value: (medianDuration / 1000).toFixed(2),
        unit: 's',
      },
    ]

    // Build detailed table for Level 2
    const detailedTable = useMemo(() => {
      // Demo table data
      const demoData = [
        { database: 'analytics', table: 'events', count: 456 },
        { database: 'users', table: 'sessions', count: 234 },
        { database: 'metrics', table: 'measurements', count: 189 },
      ]

      const rows = demoData.map((row) => ({
        id: `${row.database}.${row.table}`,
        cells: {
          table: `${row.database}.${row.table}`,
          count: row.count.toLocaleString(),
        },
      }))

      return {
        headers: [
          { key: 'table', label: 'Table', width: 'min-w-[200px]' },
          { key: 'count', label: 'Queries', align: 'right' as const },
        ],
        rows,
        title: 'Top Tables by Query Count',
        maxRows: 5,
      }
    }, [])

    // Raw SQL for Level 3
    const rawData = {
      type: 'sql' as const,
      sql: `SELECT count() AS count
FROM system.processes
WHERE query_kind != 'Unknown'`,
      title: 'Running Queries SQL',
    }

    return (
      <ProgressiveMetricCard
        cardId="running-queries"
        headline={{
          value: runningCount.toLocaleString(),
          label: 'Running Queries',
        }}
        keyMetrics={{
          metrics: keyMetrics,
          timeRange: 'Last 5 minutes',
        }}
        detailedTable={detailedTable}
        rawData={rawData}
      />
    )
  }
)
