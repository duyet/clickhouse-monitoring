'use client'

import { Suspense } from 'react'
import { ChartParams } from '@/components/dashboard/chart-params'
import { RenderChart } from '@/components/dashboard/render-chart'
import { ChartSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'

type DashboardChart = {
  kind: 'area' | 'bar' | 'calendar'
  title: string
  query: string
  ordering: number
  created_at: string
  updated_at: string
}

type DashboardSetting = {
  key: string
  value: string
  updated_at: string
}

function DashboardContent() {
  const hostId = useHostId()

  const { data: dashboards } = useChartData<DashboardChart>({
    chartName: 'dashboard-charts',
    hostId,
    refreshInterval: 30000,
  })

  const { data: settings } = useChartData<DashboardSetting>({
    chartName: 'dashboard-settings',
    hostId,
    refreshInterval: 30000,
  })

  const settingsData = (
    Array.isArray(settings) ? settings : []
  ) as DashboardSetting[]
  const params: Record<string, string> = JSON.parse(
    settingsData.find((s) => s.key === 'params')?.value || '{}'
  )

  const dashboardsData = (
    Array.isArray(dashboards) ? dashboards : []
  ) as DashboardChart[]

  return (
    <div>
      <div className="mb-4 flex flex-row items-center justify-between gap-4">
        <ChartParams params={params} />
        <Button>Add Chart</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {dashboardsData.map((dashboard, i) => (
          <RenderChart
            key={`dashboard${i}`}
            {...dashboard}
            params={params}
            hostId={hostId}
          />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
