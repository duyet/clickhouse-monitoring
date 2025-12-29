'use client'

import {
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type {
  NameType,
  Payload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent'

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
export function BarTooltip({
  tooltipTotal,
  chartConfig,
  categories,
  xAxisDataKey,
}: BarTooltipProps) {
  // Standard tooltip without total
  if (!tooltipTotal) {
    return (
      <ChartTooltip
        content={
          <ChartTooltipContent
            className="w-fit"
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
              <>
                <div
                  className="size-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                  style={
                    {
                      '--color-bg': `var(--color-${name})`,
                    } as React.CSSProperties
                  }
                />

                {chartConfig[name as keyof typeof chartConfig]?.label || name}

                <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                  {item.payload[`readable_${name}` as keyof typeof item] ||
                    value.toLocaleString()}
                  <span className="text-muted-foreground font-normal"></span>
                </div>
              </>
            )}
          />
        }
      />
    )
  }

  // Tooltip with total for stacked bars
  return (
    <ChartTooltip
      content={
        <ChartTooltipContent
          hideLabel
          className="w-fit"
          formatter={(value, name, item, index) => (
            <>
              <div
                className="size-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                style={
                  {
                    '--color-bg': `var(--color-${name})`,
                  } as React.CSSProperties
                }
              />

              {chartConfig[name as keyof typeof chartConfig]?.label || name}

              <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                {item.payload[`readable_${name}` as keyof typeof item] ||
                  value.toLocaleString()}
                <span className="text-muted-foreground font-normal"></span>
              </div>

              {index === 1 && (
                <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                  Total
                  <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                    {categories
                      .map((cat) => parseInt(item.payload[cat], 10) || 0)
                      .reduce((a, b) => a + b, 0)}
                    <span className="text-muted-foreground font-normal"></span>
                  </div>
                </div>
              )}
            </>
          )}
        />
      }
      cursor={false}
      defaultIndex={1}
    />
  )
}
