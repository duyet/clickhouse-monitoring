/**
 * Chart Legend Components
 */

'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'
import { useChartContext } from '../context'
import { getPayloadConfigFromPayload } from '../utils'

export const ChartLegend = RechartsPrimitive.Legend

export interface ChartLegendContentProps
  extends React.ComponentProps<'div'>,
    Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> {
  hideIcon?: boolean
  nameKey?: string
}

/**
 * Legend content renderer for chart series
 *
 * Displays color indicators and labels for each chart series.
 */
export function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: ChartLegendContentProps) {
  const { config } = useChartContext()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4 overflow-x-auto',
        'scrollbar-hide',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className
      )}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || 'value'}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={cn(
              '[&>svg]:text-muted-foreground flex items-center gap-1.5 shrink-0 [&>svg]:h-3 [&>svg]:w-3'
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span className="text-xs truncate max-w-[100px]">
              {itemConfig?.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
