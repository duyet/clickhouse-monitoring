'use client'

import { notFound } from 'next/navigation'
import { Suspense, use } from 'react'
import { getChartComponent, hasChart } from '@/components/charts/chart-registry'
import { ChartSkeleton } from '@/components/skeletons'
import { FadeIn } from '@/components/ui/fade-in'
import { useHostId } from '@/lib/swr'

interface ChartPageProps {
  params: Promise<{
    name: string
  }>
}

export default function ChartPage({ params }: ChartPageProps) {
  const { name } = use(params)
  const hostId = useHostId()

  // Check if chart exists in registry
  if (!hasChart(name)) {
    notFound()
  }

  const ChartComponent = getChartComponent(name)

  if (!ChartComponent) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<ChartSkeleton type="area" dataPoints={12} />}>
        <FadeIn duration={250}>
          <ChartComponent
            className="w-full"
            chartClassName="h-80"
            hostId={hostId}
          />
        </FadeIn>
      </Suspense>
    </div>
  )
}
