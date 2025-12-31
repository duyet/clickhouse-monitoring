/**
 * Chart Tooltip Sub-Components
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { ChartConfig } from '../types'
import type { ChartIndicator } from '../types'
import { getPayloadConfigFromPayload } from '../utils'

interface TooltipIndicatorProps {
  indicator: ChartIndicator
  color?: string
  nestLabel: boolean
  hideIndicator?: boolean
}

/**
 * Visual indicator (dot, line, or dashed) for tooltip items
 */
export function TooltipIndicator({
  indicator,
  color,
  nestLabel,
  hideIndicator,
}: TooltipIndicatorProps) {
  if (hideIndicator) return null

  return (
    <div
      className={cn(
        'border-border shrink-0 rounded-[2px] bg-(--color-bg)',
        {
          'h-2.5 w-2.5': indicator === 'dot',
          'w-1': indicator === 'line',
          'w-0 border-[1.5px] border-dashed bg-transparent':
            indicator === 'dashed',
          'my-0.5': nestLabel && indicator === 'dashed',
        }
      )}
      style={
        {
          '--color-bg': color,
          '--color-border': color,
        } as React.CSSProperties
      }
    />
  )
}

interface TooltipLabelProps {
  children: React.ReactNode
  className?: string
}

/**
 * Tooltip label section
 */
export function TooltipLabel({ children, className }: TooltipLabelProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <div className="grid gap-1.5">{children}</div>
    </div>
  )
}

interface TooltipItemProps {
  item: any
  index: number
  config: ChartConfig
  nameKey?: string
  indicator: ChartIndicator
  hideIndicator?: boolean
  color?: string
  formatter?: (value: any, name: any, item: any, index: number, payload: any) => React.ReactNode
  nestLabel: boolean
  tooltipLabel: React.ReactNode
}

/**
 * Individual tooltip item renderer
 */
export function TooltipItem({
  item,
  index,
  config,
  nameKey,
  indicator,
  hideIndicator,
  color,
  formatter,
  nestLabel,
  tooltipLabel,
}: TooltipItemProps) {
  const key = `${nameKey || item.name || item.dataKey || 'value'}`
  const itemConfig = getPayloadConfigFromPayload(config, item, key)
  const indicatorColor = color || item.payload.fill || item.color

  return (
    <div
      className={cn(
        '[&>svg]:text-muted-foreground flex w-full items-start gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:shrink-0',
        indicator === 'dot' && 'items-center'
      )}
    >
      {formatter && item?.value !== undefined && item.name ? (
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {formatter(item.value, item.name, item, index, item.payload)}
        </div>
      ) : (
        <>
          {itemConfig?.icon ? (
            <itemConfig.icon />
          ) : (
            <TooltipIndicator
              indicator={indicator}
              color={indicatorColor}
              nestLabel={nestLabel}
              hideIndicator={hideIndicator}
            />
          )}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="grid gap-1.5">
              {nestLabel ? tooltipLabel : null}
              <span className="text-muted-foreground truncate">
                {itemConfig?.label || item.name}
              </span>
            </div>
            {item.value && (
              <span className="text-foreground font-mono font-medium tabular-nums truncate">
                {item.value.toLocaleString()}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
