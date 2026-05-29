'use client'

import type { ClickHouseInterval } from '@chm/types/clickhouse-interval'
import type { QueryConfig } from '@/types/query-config'
import type { ChartValueUnit } from './chart-format'

import { ChartChip } from './chart-chip'

const VALID_UNITS: ReadonlySet<string> = new Set([
  'count',
  'bytes',
  'ms',
  'seconds',
  'percent',
])

type ChartConfig = NonNullable<QueryConfig['relatedCharts']>[number]

export interface ChartRowSummaryProps {
  charts: ChartConfig[]
}

function chartLabel(name: string, props?: Record<string, unknown>): string {
  const title = props?.title
  if (typeof title === 'string' && title.length > 0) return title
  return name.replace(/-/g, ' ')
}

export const ChartRowSummary = function ChartRowSummary({
  charts,
}: ChartRowSummaryProps) {
  const items = charts
    .filter(
      (c): c is Exclude<ChartConfig, 'break' | null | undefined> =>
        Boolean(c) && c !== 'break'
    )
    .map((c) => {
      const name = Array.isArray(c) ? c[0] : (c as string)
      const props = Array.isArray(c)
        ? ((c[1] as Record<string, unknown> | undefined) ?? undefined)
        : undefined
      const valueField =
        typeof props?.valueField === 'string' ? props.valueField : undefined
      const unit =
        typeof props?.unit === 'string' && VALID_UNITS.has(props.unit)
          ? (props.unit as ChartValueUnit)
          : undefined
      const interval =
        typeof props?.interval === 'string'
          ? (props.interval as ClickHouseInterval)
          : undefined
      const lastHours =
        typeof props?.lastHours === 'number' ? props.lastHours : undefined
      return {
        name,
        label: chartLabel(name, props),
        valueField,
        unit,
        interval,
        lastHours,
      }
    })

  if (items.length === 0) return null

  return (
    <div className="flex min-w-0 flex-1 items-stretch gap-1 divide-x divide-border/60 overflow-hidden">
      {items.map((item, index) => (
        <ChartChip
          key={`${item.name}-${index}`}
          chartName={item.name}
          label={item.label}
          valueField={item.valueField}
          unit={item.unit}
          interval={item.interval}
          lastHours={item.lastHours}
        />
      ))}
    </div>
  )
}
