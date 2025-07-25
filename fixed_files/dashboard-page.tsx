import { Button } from '@/components/ui/button'

import { ChartParams } from './chart-params'
import { RenderChart } from './render-chart'
import { getCustomDashboards } from './utils'

export const dynamic = 'force-dynamic'
export const revalidate = 30

// Added params to function signature
export default async function Page({
  params,
}: {
  params: Promise<{ host: string }>
}) {
  // Extract host from params
  const { host } = await params

  const { dashboards, settings } = await getCustomDashboards()

  console.log('Dashboard settings', settings)
  console.log('Dashboard data', dashboards)

  const chartParams: Record<string, string> = JSON.parse(
    settings.find((s) => s.key === 'params')?.value || '{}'
  )

  return (
    <div>
      <div className="mb-4 flex flex-row items-center justify-between gap-4">
        <ChartParams params={chartParams} />
        <Button>Add Chart</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {dashboards.map((dashboard, i) => (
          <RenderChart
            key={'dashboard' + i}
            {...dashboard}
            params={chartParams}
            host={host} // Pass host parameter
          />
        ))}
      </div>
    </div>
  )
}
