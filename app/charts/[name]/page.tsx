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

function ChartContent({ name }: { name: string }) {
  const hostId = useHostId()

  if (!hasChart(name)) {
    notFound()
  }

  const ChartComponent = getChartComponent(name)

  if (!ChartComponent) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <FadeIn duration={250}>
        <ChartComponent
          className="w-full"
          chartClassName="h-full min-h-[300px]"
          hostId={hostId}
        />
      </FadeIn>
    </div>
  )
}

export default function ChartPage({ params }: ChartPageProps) {
  const { name } = use(params)

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartContent name={name} />
    </Suspense>
  )
}
