/**
 * Tooltip components for AreaChart
 *
 * Provides standard and breakdown tooltip variants.
 */

'use client'

import type { NameType, Payload, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { StandardTooltipRow, SummaryRow } from './tooltip-row'
import { BreakdownSection } from './tooltip-breakdown-section'
import { parseBreakdownData } from './tooltip-data-parser'

export interface RenderChartTooltipOptions {
  breakdown?: string
  breakdownLabel?: string
  breakdownValue?: string
  breakdownHeading?: string
  tooltipActive?: boolean
  chartConfig: ChartConfig
  categories: string[]
}

/**
 * Main tooltip renderer for AreaChart
 *
 * Delegates to appropriate tooltip based on breakdown configuration.
 */
export function renderChartTooltip({
  breakdown,
  breakdownLabel,
  breakdownValue,
  breakdownHeading,
  tooltipActive,
  chartConfig,
  categories,
}: RenderChartTooltipOptions) {
  if (!breakdown) {
    return renderStandardTooltip(chartConfig)
  }

  if (categories.length > 1) {
    throw new Error('Only support single category for breakdown')
  }

  return renderBreakdownTooltip({
    breakdown,
    breakdownLabel,
    breakdownValue,
    breakdownHeading,
    tooltipActive,
    chartConfig,
  })
}

/**
 * Standard tooltip without breakdown
 */
function renderStandardTooltip(chartConfig: ChartConfig) {
  return (
    <ChartTooltip
      cursor
      content={
        <ChartTooltipContent
          className="max-w-[280px]"
          formatter={(
            value,
            name,
            item,
            index,
            _payload: Array<Payload<ValueType, NameType>>
          ) => {
            return (
              <StandardTooltipRow
                key={`${name}${index}`}
                name={name as string}
                value={value}
                item={item}
                chartConfig={chartConfig}
              />
            )
          }}
        />
      }
    />
  )
}

/**
 * Breakdown tooltip with detailed data
 */
function renderBreakdownTooltip({
  breakdown,
  breakdownLabel,
  breakdownValue,
  breakdownHeading,
  tooltipActive,
  chartConfig,
}: {
  breakdown?: string
  breakdownLabel?: string
  breakdownValue?: string
  breakdownHeading?: string
  tooltipActive?: boolean
  chartConfig: ChartConfig
}) {
  return (
    <ChartTooltip
      active={tooltipActive}
      content={
        <ChartTooltipContent
          hideLabel
          className="max-w-[320px]"
          formatter={(value, name, item, _index, payload: any) => {
            return (
              <BreakdownTooltipContent
                name={name as string}
                value={value}
                item={item}
                payload={payload}
                breakdown={breakdown}
                breakdownLabel={breakdownLabel}
                breakdownValue={breakdownValue}
                breakdownHeading={breakdownHeading}
                chartConfig={chartConfig}
              />
            )
          }}
        />
      }
      cursor={false}
    />
  )
}

/**
 * Tooltip content with breakdown data
 */
function BreakdownTooltipContent({
  name,
  value,
  item,
  payload,
  breakdown,
  breakdownLabel,
  breakdownValue,
  breakdownHeading,
  chartConfig,
}: {
  name: string
  value: any
  item: any
  payload: any
  breakdown?: string
  breakdownLabel?: string
  breakdownValue?: string
  breakdownHeading?: string
  chartConfig: ChartConfig
}) {
  const breakdownDataMap = parseBreakdownData(
    payload[breakdown as keyof typeof payload] as Array<any>,
    breakdownLabel,
    breakdownValue
  )

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <SummaryRow name={name} value={value} chartConfig={chartConfig} />

      {breakdownDataMap.length > 0 && (
        <BreakdownSection
          breakdownData={breakdownDataMap}
          heading={breakdownHeading || 'Breakdown'}
          item={item}
          breakdownLabel={breakdownLabel}
        />
      )}
    </div>
  )
}
