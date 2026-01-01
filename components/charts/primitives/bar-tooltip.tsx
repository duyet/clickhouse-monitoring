'use client'

import { memo } from 'react'
import type {
  NameType,
  Payload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent'
import {
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface BarTooltipProps {
  tooltipTotal: boolean
  chartConfig: ChartConfig
  categories: string[]
  xAxisDataKey?: string
}

/**
 * BarTooltip - Tooltip rendering component for BarChart
 *
 * Handles tooltip display with optional total calculation for stacked bars.
 * Shows formatted values with color indicators and readable labels.
 */
export const BarTooltip = memo(function BarTooltip({
  tooltipTotal,
  chartConfig,
  categories,
  xAxisDataKey,
}: BarTooltipProps) {
  // Standard tooltip without total
  if (!tooltipTotal) {
    return (
      <ChartTooltip
        cursor={{ fill: 'hsl(var(--muted))' }}
        wrapperStyle={{ zIndex: 1000 }}
        allowEscapeViewBox={{ x: true, y: true }}
        content={
          <ChartTooltipContent
            className="max-w-[280px]"
            labelFormatter={
              xAxisDataKey
                ? (_label, payload) => {
                    return (
                      <div>
                        {
                          payload[0].payload[
                            xAxisDataKey as keyof typeof payload
                          ]
                        }
                      </div>
                    )
                  }
                : undefined
            }
            formatter={(
              value,
              name,
              item,
              _index,
              _payload: Array<Payload<ValueType, NameType>>
            ) => (
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="size-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                    style={
                      {
                        '--color-bg': `var(--color-${name})`,
                      } as React.CSSProperties
                    }
                  />
                  <span className="truncate text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label ||
                      name}
                  </span>
                </div>

                <div className="text-foreground shrink-0 flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                  {item.payload[`readable_${name}` as keyof typeof item] ||
                    value.toLocaleString()}
                  <span className="text-muted-foreground font-normal"></span>
                </div>
              </div>
            )}
          />
        }
      />
    )
  }

  // Tooltip with total for stacked bars
  return (
    <ChartTooltip
      wrapperStyle={{ zIndex: 1000 }}
      content={
        <ChartTooltipContent
          hideLabel
          className="max-w-[280px]"
          formatter={(value, name, item, index) => (
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="size-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                    style={
                      {
                        '--color-bg': `var(--color-${name})`,
                      } as React.CSSProperties
                    }
                  />
                  <span className="truncate text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label ||
                      name}
                  </span>
                </div>

                <div className="text-foreground shrink-0 flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                  {item.payload[`readable_${name}` as keyof typeof item] ||
                    value.toLocaleString()}
                  <span className="text-muted-foreground font-normal"></span>
                </div>
              </div>

              {index === 1 && (
                <div className="text-foreground flex basis-full items-center justify-between border-t pt-1.5 text-xs font-medium">
                  <span>Total</span>
                  <div className="text-foreground flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                    {categories
                      .map((cat) => parseInt(item.payload[cat], 10) || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}
                    <span className="text-muted-foreground font-normal"></span>
                  </div>
                </div>
              )}
            </div>
          )}
        />
      }
      cursor={false}
      defaultIndex={1}
    />
  )
})
