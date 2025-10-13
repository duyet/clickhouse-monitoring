import { Button } from '@/components/ui/button'

import { ChartParams } from './chart-params'
import { RenderChart } from './render-chart'
import { getCustomDashboards } from './utils'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function Page({
  params: routeParams,
}: {
  params: Promise<{ host: string }>
}) {
  const { host } = await routeParams
  const hostId = Number(host)

  const { dashboards, settings } = await getCustomDashboards()

  console.log('Dashboard settings', settings)
  console.log('Dashboard data', dashboards)

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
            key={'dashboard' + i}
            {...dashboard}
            params={params}
            hostId={hostId}
          />
        ))}
      </div>
    </div>
  )
}
