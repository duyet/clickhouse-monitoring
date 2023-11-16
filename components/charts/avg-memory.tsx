import { AreaChart } from '@/components/tremor'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { avgMemory } from '@/lib/clickhouse-chart-queries'
import { ClickHouseIntervalFunc } from '../interval-select'

interface ChartAvgMemoryProps {
  title?: string
  interval: ClickHouseIntervalFunc
}

export async function ChartAvgMemory({ title, interval }: ChartAvgMemoryProps) {
  const data = await avgMemory(interval)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <AreaChart
          className='mt'
          data={data}
          index='event_time'
          categories={['avg_memory_gb']}
          showAnimation
        />
      </CardContent>
    </Card>
  )
}
