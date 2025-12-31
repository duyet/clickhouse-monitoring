/**
 * Reusable tooltip row components
 */

'use client'

import type { ChartConfig } from '@/components/ui/chart'
import { TooltipColorIndicator } from './tooltip-color-indicator'

interface StandardTooltipRowProps {
  name: string
  value: any
  item: any
  chartConfig: ChartConfig
}

/**
 * Standard tooltip row for displaying name/value pairs
 */
export function StandardTooltipRow({
  name,
  value,
  item,
  chartConfig,
}: StandardTooltipRowProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-2 min-w-0">
      <TooltipRowLabel name={name} chartConfig={chartConfig} />
      <TooltipRowValue item={item} name={name} value={value} />
    </div>
  )
}

interface SummaryRowProps {
  name: string
  value: any
  chartConfig: ChartConfig
}

/**
 * Summary row for breakdown tooltips
 */
export function SummaryRow({
  name,
  value,
  chartConfig,
}: SummaryRowProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-2 min-w-0">
      <TooltipRowLabel name={name} chartConfig={chartConfig} />
      <div className="text-foreground shrink-0 flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
        {value}
        <span className="text-muted-foreground font-normal"></span>
      </div>
    </div>
  )
}

interface TooltipRowLabelProps {
  name: string
  chartConfig: ChartConfig
}

/**
 * Label section of tooltip row with color indicator
 */
function TooltipRowLabel({ name, chartConfig }: TooltipRowLabelProps) {
  return (
    <div className="flex flex-row items-center gap-1.5 min-w-0">
      <TooltipColorIndicator colorVar={`var(--color-${name})`} />
      <span className="truncate text-muted-foreground">
        {chartConfig[name as keyof typeof chartConfig]?.label || name}
      </span>
    </div>
  )
}

interface TooltipRowValueProps {
  item: any
  name: string
  value: any
}

/**
 * Value section of tooltip row with readable fallback
 */
function TooltipRowValue({ item, name, value }: TooltipRowValueProps) {
  return (
    <div className="text-foreground shrink-0 flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
      {item.payload[`readable_${name}` as keyof typeof item] ||
        value.toLocaleString()}
      <span className="text-muted-foreground font-normal"></span>
    </div>
  )
}
