'use client'

import { notFound, useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { ChartSkeleton } from '@/components/skeletons'
import { ErrorLogger } from '@/lib/logger'
import { useHostId } from '@/lib/swr'

interface DynamicChartProps {
  chartName: string
  hostId: number
  index: number
}

function DynamicChart({ chartName, hostId, index }: DynamicChartProps) {
  const ChartComponent = useMemo(() => {
    try {
      return require(`@/components/charts/${chartName}`).default
    } catch (e) {
      ErrorLogger.logError(e as Error, {
        component: 'DynamicChart',
        action: 'load-chart',
        chartName,
      })
      return null
    }
  }, [chartName])

  if (!ChartComponent) {
    return notFound()
  }

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartComponent
        key={index}
        className="mb-4 w-full p-0 shadow-none"
        chartClassName="h-full min-h-[300px]"
        hostId={hostId}
      />
    </Suspense>
  )
}

export default function ChartsPage() {
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
    <div className="max-w-full">
      <h1 className="text-xl font-semibold mb-4">{displayTitle}</h1>
      {chartNames.map((chartName, index) => (
        <DynamicChart
          key={`${chartName}-${index}`}
          chartName={chartName}
          hostId={hostId}
          index={index}
        />
      ))}
    </div>
  )
}
