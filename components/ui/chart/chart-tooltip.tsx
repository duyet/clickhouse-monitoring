/**
 * Chart Tooltip Components
 */

'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'
import { useChartContext } from './context'
import { getPayloadConfigFromPayload } from './utils'
import type { ChartIndicator } from './types'
import { TooltipIndicator } from './tooltip-indicator'
import { TooltipLabel } from './tooltip-label'
import { TooltipItem } from './tooltip-item'

export const ChartTooltip = RechartsPrimitive.Tooltip

export interface ChartTooltipContentProps
  extends React.ComponentProps<typeof RechartsPrimitive.Tooltip>,
    React.ComponentProps<'div'> {
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: ChartIndicator
  nameKey?: string
  labelKey?: string
}

/**
 * Main tooltip content component for Recharts charts
 *
 * Renders tooltip with label, indicators, and formatted values.
 * Supports custom formatters and icons.
 */
export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config } = useChartContext()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === 'string'
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid max-w-[280px] min-w-[120px] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl z-50',
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => (
          <TooltipItem
            key={item.dataKey}
            item={item}
            index={index}
            config={config}
            nameKey={nameKey}
            indicator={indicator}
            hideIndicator={hideIndicator}
            color={color}
            formatter={formatter}
            nestLabel={nestLabel}
            tooltipLabel={tooltipLabel}
          />
        ))}
      </div>
    </div>
  )
}
