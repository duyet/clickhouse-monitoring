'use client'

import { ChartSkeleton } from '@/components/skeleton'
import { useHostId } from '@/lib/swr'
import { ErrorLogger } from '@/lib/error-logger'
import { notFound } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'

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
        chartClassName="h-64"
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
    const chartsParam = searchParams.get('charts')
    if (!chartsParam) return []
    return decodeURIComponent(chartsParam).split(',')
  }, [searchParams])

  if (chartNames.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">
          No charts specified. Use ?charts=chart-name to view charts.
        </p>
      </div>
    )
  }

  return (
    <div>
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
