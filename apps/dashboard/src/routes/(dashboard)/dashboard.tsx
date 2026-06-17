import { createFileRoute } from '@tanstack/react-router'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { getChartComponent, hasChart } from '@/components/charts/registry'
import { ChartPicker } from '@/components/dashboard/chart-picker'
import { SavedDashboardsToolbar } from '@/components/dashboard/saved-dashboards-toolbar'
import { ChartSkeleton, ChartsOnlyPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import { useHostId } from '@/lib/swr'

/** Charts shown when no saved dashboard is loaded */
const DEFAULT_CHARTS: string[] = [
  'query-count',
  'query-duration',
  'query-memory',
  'failed-query-count',
  'merge-count',
  'memory-usage',
  'cpu-usage',
  'disk-size',
]

function DashboardContent() {
  const hostId = useHostId()
  const [selectedCharts, setSelectedCharts] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CHARTS
    const stored = sessionStorage.getItem('dashboard-current-charts')
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored)
        if (
          Array.isArray(parsed) &&
          parsed.every((c) => typeof c === 'string')
        ) {
          return parsed
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_CHARTS
  })

  // Persist selection to sessionStorage so it survives navigation within the
  // same tab but resets on new tab (intentional UX — saved dashboards use
  // localStorage for cross-tab persistence).
  useEffect(() => {
    sessionStorage.setItem(
      'dashboard-current-charts',
      JSON.stringify(selectedCharts)
    )
  }, [selectedCharts])

  const handleLoad = useCallback((charts: string[]) => {
    setSelectedCharts(charts)
  }, [])

  const handleChartsChange = useCallback((charts: string[]) => {
    setSelectedCharts(charts)
  }, [])

  // Filter to only charts that exist in the registry
  const validCharts = selectedCharts.filter(hasChart)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SavedDashboardsToolbar
          selectedCharts={validCharts}
          onLoad={handleLoad}
        />
        <ChartPicker
          selectedCharts={validCharts}
          onChange={handleChartsChange}
        />
      </div>

      {/* Empty state */}
      {validCharts.length === 0 && (
        <EmptyState
          variant="no-data"
          title="No charts selected"
          description='Use "Add Charts" to build your dashboard.'
        />
      )}

      {/* Chart grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {validCharts.map((chartName) => {
          const Chart = getChartComponent(chartName)
          if (!Chart) return null
          return (
            <Suspense key={chartName} fallback={<ChartSkeleton />}>
              <Chart hostId={hostId} />
            </Suspense>
          )
        })}
      </div>
    </div>
  )
}

function DashboardPage() {
  return (
    <Suspense fallback={<ChartsOnlyPageSkeleton chartCount={8} />}>
      <DashboardContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/dashboard')({
  component: DashboardPage,
})
