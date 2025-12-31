import type { ChartProps } from '@/components/charts/chart-props'
import type { AreaChartProps, BarChartProps } from '@/types/charts'
import type { ClickHouseInterval } from '@/types/clickhouse-interval'

interface BaseChartFactoryConfig {
  chartName: string
  defaultTitle?: string
  defaultInterval?: ClickHouseInterval
  defaultLastHours?: number
  refreshInterval?: number
  dataTestId?: string
}

// Additional props that AreaChart accepts but aren't in AreaChartProps
interface AreaChartAdditionalProps {
  yAxisTickFormatter?: (value: string | number) => string
}

export interface AreaChartFactoryConfig extends BaseChartFactoryConfig {
  index: string
  categories: string[]
  defaultChartClassName?: string
  areaChartProps?: Partial<AreaChartProps> & AreaChartAdditionalProps
}

// Additional props that BarChart accepts but aren't in BarChartProps
interface BarChartAdditionalProps {
  yAxisTickFormatter?: (value: string | number) => string
}

export interface BarChartFactoryConfig extends BaseChartFactoryConfig {
  index: string
  categories: string[] | ((data: unknown[]) => string[])
  defaultChartClassName?: string
  barChartProps?: Partial<BarChartProps> & BarChartAdditionalProps
}

export interface CustomChartFactoryConfig extends BaseChartFactoryConfig {
  render: (data: unknown[], sql: string | undefined, hostId: number) => React.ReactNode
  chartCardClassName?: string
  contentClassName?: string
}
