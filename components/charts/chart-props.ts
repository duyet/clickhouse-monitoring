import type { AreaChartProps } from '@/types/charts'
import type { ClickHouseInterval } from '@/types/clickhouse-interval'

export interface ChartProps extends Partial<AreaChartProps> {
  title?: string
  interval?: ClickHouseInterval
  className?: string
  chartClassName?: string
  chartCardContentClassName?: string
  lastHours?: number
  hostId?: number
}
