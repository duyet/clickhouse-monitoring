'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { getChartComponent, hasChart } from '@/components/charts/chart-registry'
import { ChartSkeleton } from '@/components/skeletons'
import { useHostId } from '@/lib/swr'

interface DynamicChartProps {
  chartName: string
  hostId: number
}

function DynamicChart({ chartName, hostId }: DynamicChartProps) {
  // Check if chart exists in registry
  if (!hasChart(chartName)) {
    return null
  }

  const ChartComponent = getChartComponent(chartName)

  if (!ChartComponent) {
    return null
  }

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartComponent
        className="mb-4 w-full p-0"
        chartClassName="h-full min-h-[260px] sm:min-h-[300px]"
        hostId={hostId}
      />
    </Suspense>
  )
}

function ChartsPageContent() {
  const hostId = useHostId()
  const searchParams = useSearchParams()

  // Get chart names from URL search params
  const chartNames: string[] = useMemo(() => {
    const chartsParam = searchParams.get('name')
    if (!chartsParam) return []
    return decodeURIComponent(chartsParam).split(',')
  }, [searchParams])

  if (chartNames.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-2">Charts</h1>
        <p className="text-muted-foreground">
          No charts specified. Use ?name=chart-name to view charts.
        </p>
      </div>
    )
  }

  // Format chart names for display
  const displayTitle =
    chartNames.length === 1
      ? chartNames[0]
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : `${chartNames.length} Charts`

  return (
    <div className="max-w-full px-3 sm:px-0">
      <h1 className="mb-4 text-lg font-semibold sm:text-xl">{displayTitle}</h1>
      {chartNames.map((chartName, index) => (
        <DynamicChart
          key={`${chartName}-${index}`}
          chartName={chartName}
          hostId={hostId}
        />
      ))}
    </div>
  )
}

export default function ChartsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartsPageContent />
    </Suspense>
  )
}
