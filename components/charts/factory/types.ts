import type {
  DateRangeConfig,
  DateRangePresetName,
} from '@/components/date-range'
import type { AreaChartProps, BarChartProps } from '@/types/charts'
import type { ClickHouseInterval } from '@/types/clickhouse-interval'

interface BaseChartFactoryConfig {
  chartName: string
  defaultTitle?: string
  defaultInterval?: ClickHouseInterval
  defaultLastHours?: number
  refreshInterval?: number
  dataTestId?: string
  /** Enable date range selector with preset or custom config (opt-in) */
  dateRangeConfig?: DateRangeConfig | DateRangePresetName
  /** Enable log scale toggle (default: true). Set to false for charts where log scale doesn't work well */
  enableScaleToggle?: boolean
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
  /** Enable smart x-axis date formatting based on time range */
  xAxisDateFormat?: boolean
}

export interface CustomChartFactoryConfig extends BaseChartFactoryConfig {
  render: (
    data: unknown[],
    sql: string | undefined,
    hostId: number
  ) => React.ReactNode
  chartCardClassName?: string
  contentClassName?: string
}
