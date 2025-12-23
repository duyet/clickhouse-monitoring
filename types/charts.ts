import type React from 'react'
import type { ReactNode } from 'react'
import type { LabelPosition } from 'recharts/types/component/Label'

import type { ChartConfig } from '@/components/ui'

interface BaseAnimationTimingProps {
  animationDuration?: number
  showAnimation?: boolean
}

type ValueFormatter = (value: number) => string

type TickFormatter = (value: string) => string

type LabelFormatter = (value: string) => string

type FixedProps = {
  eventType: 'dot' | 'category' | 'bar' | 'slice' | 'bubble'
  categoryClicked: string
}

type BaseEventProps = FixedProps & {
  [key: string]: number | string
}
type EventProps = BaseEventProps | null | undefined

type Color = string

export type ValueType = number | string | Array<number | string>
export type NameType = number | string
export type TooltipType = 'none'
export type Formatter<TValue extends ValueType, TName extends NameType> = (
  value: TValue,
  name: TName,
  item: Payload<TValue, TName>,
  index: number,
  payload: Array<Payload<TValue, TName>>
) => [React.ReactNode, TName] | React.ReactNode

export interface Payload<TValue extends ValueType, TName extends NameType> {
  type?: TooltipType
  color?: string
  formatter?: Formatter<TValue, TName>
  name?: TName
  value?: TValue
  unit?: ReactNode
  dataKey?: string | number
  payload?: any
  chartType?: string
  stroke?: string
  strokeDasharray?: string | number
  strokeWidth?: number | string
  className?: string
  hide?: boolean
}

type CustomTooltipProps = {
  payload:
    | Payload<string | number | (string | number)[], string | number>[]
    | undefined
  active: boolean | undefined
  label: NameType | undefined
}

export interface BaseChartProps
  extends BaseAnimationTimingProps,
    React.HTMLAttributes<HTMLDivElement> {
  data: any[]
  labelPosition?: LabelPosition
  labelAngle?: number
  colors?: Color[]
  colorLabel?: Color
  valueFormatter?: ValueFormatter
  tickFormatter?: TickFormatter
  labelFormatter?: LabelFormatter
  startEndOnly?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  yAxisWidth?: number
  showTooltip?: boolean
  showLegend?: boolean
  showLabel?: boolean
  showGridLines?: boolean
  autoMinValue?: boolean
  minValue?: number
  maxValue?: number
  allowDecimals?: boolean
  noDataText?: string
  onValueChange?: (value: EventProps) => void
  enableLegendSlider?: boolean
  customTooltip?: React.ComponentType<CustomTooltipProps>
  rotateLabelX?: {
    angle: number
    verticalShift?: number
    xAxisHeight?: number
  }
  tickGap?: number
  xAxisLabel?: string
  yAxisLabel?: string
  chartConfig?: ChartConfig
}

export interface BarChartProps extends BaseChartProps {
  categories: string[]
  index?: string
  layout?: 'vertical' | 'horizontal'
  stack?: boolean
  relative?: boolean
  barCategoryGap?: string | number
  readableColumn?: string
  horizontal?: boolean
  tooltipTotal?: boolean
  onClickHref?: string
}

/**
 * Format type for readable value display
 * - 'bytes': Format as human-readable bytes (KB, MB, GB, etc.)
 * - 'duration': Format as human-readable duration (ms, s, m, h)
 * - 'number': Format as human-readable number with K, M, B suffixes
 * - 'quantity': Format as human-readable quantity (same as number, for semantic clarity)
 */
export type ReadableFormat = 'bytes' | 'duration' | 'number' | 'quantity'

export interface AreaChartProps extends BaseChartProps {
  categories: string[]
  index?: string
  type?: string
  stack?: boolean
  relative?: boolean
  opacity?: number
  breakdown?: string
  breakdownLabel?: string
  breakdownValue?: string
  breakdownHeading?: string
  tooltipActive?: boolean
  showCartesianGrid?: boolean

  /**
   * Format hint for readable value display
   * When set, values in specified columns will be formatted accordingly
   */
  readable?: ReadableFormat

  /**
   * Single column name whose values should be formatted according to 'readable'
   */
  readableColumn?: string

  /**
   * Multiple column names whose values should be formatted according to 'readable'
   * Takes precedence over readableColumn if both are specified
   */
  readableColumns?: string[]
}

export interface RadialChartProps extends BaseChartProps {
  data: Record<string, string | number>[]
  nameKey: string
  dataKey: string
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

export interface NumberChartProps extends BaseChartProps {
  data: Record<string, string | number>[]
  nameKey: string
  dataKey: string
  title?: string
  description?: string
}
