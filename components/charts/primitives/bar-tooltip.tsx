'use client'

import { memo } from 'react'
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
 * BarTooltip - Tooltip component for BarChart using shadcn/ui pattern
 */
export const BarTooltip = memo(function BarTooltip({
  tooltipTotal,
  chartConfig: _chartConfig,
  categories,
  xAxisDataKey: _xAxisDataKey,
}: BarTooltipProps) {
  if (tooltipTotal) {
    // Tooltip with total for stacked bars
    return (
      <ChartTooltip
        cursor={{ fill: 'hsl(var(--muted))' }}
        content={
          <ChartTooltipContent
            formatter={(value, name, item, index) => (
              <>
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{name}</span>
                <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {/* Show total after last item */}
                {index === categories.length - 1 && (
                  <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                    Total
                    <span className="ml-auto font-mono font-medium tabular-nums">
                      {categories
                        .map((cat) => Number(item.payload[cat]) || 0)
                        .reduce((a, b) => a + b, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}
          />
        }
      />
    )
  }

  // Standard tooltip without total
  return (
    <ChartTooltip
      cursor={{ fill: 'hsl(var(--muted))' }}
      content={<ChartTooltipContent />}
    />
  )
})
