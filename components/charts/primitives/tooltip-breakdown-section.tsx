/**
 * Breakdown section component for tooltips
 */

'use client'

import { TooltipColorIndicator } from './tooltip-color-indicator'

export interface BreakdownSectionProps {
  breakdownData: Array<[string, any]>
  heading: string
  item: any
  breakdownLabel?: string
}

/**
 * Breakdown section with detailed items
 *
 * Displays a list of breakdown items with color indicators and values.
 */
export function BreakdownSection({
  breakdownData,
  heading,
  item,
  breakdownLabel,
}: BreakdownSectionProps) {
  return (
    <div className="text-foreground flex basis-full flex-col border-t pt-2 text-xs font-medium">
      <div className="mb-1.5">{heading}</div>
      <div className="flex flex-col gap-1.5">
        {breakdownData.map(([name, value], index) => (
          <BreakdownRow
            key={name + index}
            name={name}
            value={value}
            index={index}
            item={item}
            breakdownLabel={breakdownLabel}
          />
        ))}
      </div>
    </div>
  )
}

interface BreakdownRowProps {
  name: string
  value: any
  index: number
  item: any
  breakdownLabel?: string
}

/**
 * Individual breakdown row
 */
function BreakdownRow({
  name,
  value,
  index,
  item,
  breakdownLabel,
}: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between gap-2" role="row">
      <div className="flex items-center gap-1.5 min-w-0">
        <TooltipColorIndicator
          colorVar={`var(--chart-${10 - index})`}
          size="small"
        />
        <span className="truncate">
          {item[breakdownLabel as keyof typeof item] || name}
        </span>
      </div>

      <div className="text-foreground shrink-0 flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
        {value.toLocaleString()}
        <span className="text-muted-foreground font-normal"></span>
      </div>
    </div>
  )
}
