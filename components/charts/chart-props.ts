import type { AreaChartProps } from '@tremor/react'

import type { ClickHouseInterval } from '@/types/clickhouse-interval'

export interface ChartProps extends Partial<AreaChartProps> {
  title?: string
  interval?: ClickHouseInterval
  className?: string
  chartClassName?: string
  lastHours?: number
}
