import type { AreaChartProps } from '@tremor/react'

import type { ClickHouseIntervalFunc } from '../interval-select'

export interface ChartProps extends Partial<AreaChartProps> {
  title?: string
  interval?: ClickHouseIntervalFunc
  className?: string
  chartClassName?: string
  lastHours?: number
}
