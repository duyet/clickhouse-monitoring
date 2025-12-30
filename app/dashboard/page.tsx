'use client'

import { Button } from '@/components/ui/button'
import { ChartParams } from '@/components/dashboard/chart-params'
import { RenderChart } from '@/components/dashboard/render-chart'
import { useChartData } from '@/lib/swr/use-chart-data'
import { useHostId } from '@/lib/swr'

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

export default function DashboardPage() {
  const hostId = useHostId()

  // Fetch dashboards
  const { data: dashboards } = useChartData<DashboardChart>({
    chartName: 'dashboard-charts',
    hostId,
    refreshInterval: 30000,
  })

  // Fetch settings
  const { data: settings } = useChartData<DashboardSetting>({
    chartName: 'dashboard-settings',
    hostId,
    refreshInterval: 30000,
  })

  // Cast to array and extract params
  const settingsData = (Array.isArray(settings) ? settings : []) as DashboardSetting[]
  const params: Record<string, string> = JSON.parse(
    settingsData.find((s) => s.key === 'params')?.value || '{}'
  )

  // Cast dashboards to array
  const dashboardsData = (Array.isArray(dashboards) ? dashboards : []) as DashboardChart[]

  return (
    <div>
      <div className="mb-4 flex flex-row items-center justify-between gap-4">
        <ChartParams params={params} />
        <Button>Add Chart</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
