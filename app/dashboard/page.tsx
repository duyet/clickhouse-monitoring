'use client'

import { Button } from '@/components/ui/button'
import { ChartParams } from '@/components/dashboard/chart-params'
import { RenderChart } from '@/components/dashboard/render-chart'
import { useHostId } from '@/lib/swr'
import { useFetchData } from '@/lib/swr/use-fetch-data'
import { TABLE_CHARTS, TABLE_SETTINGS } from '@/lib/api/dashboard-api'

export default function DashboardPage() {
  const hostId = useHostId()

  // Fetch dashboards
  const { data: dashboards } = useFetchData<
    Array<{
      kind: 'area' | 'bar' | 'calendar'
      title: string
      query: string
      ordering: number
      created_at: string
      updated_at: string
    }>
  >(
    `SELECT * FROM ${TABLE_CHARTS} FINAL ORDER BY ordering ASC`,
    {},
    hostId,
    30000
  )

  // Fetch settings
  const { data: settings } = useFetchData<
    Array<{
      key: string
      value: string
      updated_at: string
    }>
  >(`SELECT * FROM ${TABLE_SETTINGS} FINAL`, {}, hostId, 30000)

  const params: Record<string, string> = JSON.parse(
    settings?.find((s) => s.key === 'params')?.value || '{}'
  )

  return (
    <div>
      <div className="mb-4 flex flex-row items-center justify-between gap-4">
        <ChartParams params={params} />
        <Button>Add Chart</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {dashboards?.map((dashboard, i) => (
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
