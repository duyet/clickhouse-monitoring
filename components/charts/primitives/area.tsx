'use client'

import { memo, useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  AreaChart as RechartAreaChart,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  NameType,
  Payload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import type { AreaChartProps } from '@/types/charts'

export const AreaChart = memo(function AreaChart({
  data,
  index,
  categories,
  showLegend = false,
  showXAxis = true,
  showYAxis = true,
  showCartesianGrid = true,
  stack = false,
  opacity = 0.6,
  colors,
  colorLabel,
  tickFormatter,
  yAxisTickFormatter,
  xAxisLabel,
  yAxisLabel,
  breakdown,
  breakdownLabel,
  breakdownValue,
  breakdownHeading,
  tooltipActive,
  chartConfig: customChartConfig,
  className,
}: AreaChartProps & {
  yAxisTickFormatter?: (value: string | number) => string
}) {
  const chartConfig = useMemo(() => {
    const config = categories.reduce(
      (acc, category, index) => {
        acc[category] = {
          label: category,
          color: colors ? `var(${colors[index]})` : `var(--chart-${index + 1})`,
        }

        return acc
      },
      {
        label: {
          color: colorLabel ? `var(${colorLabel})` : 'var(--background)',
        },
      } as ChartConfig
    )

    return {
      ...config,
      ...(customChartConfig || {}),
    }
  }, [categories, colors, colorLabel, customChartConfig])

  // Memoize tooltip renderer to prevent recreation on every render
  const tooltip = useMemo(
    () =>
      renderChartTooltip({
        breakdown,
        breakdownLabel,
        breakdownValue,
        breakdownHeading,
        tooltipActive,
        chartConfig,
        categories,
      }),
    [
      breakdown,
      breakdownLabel,
      breakdownValue,
      breakdownHeading,
      tooltipActive,
      chartConfig,
      categories,
    ]
  )

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('h-full w-full', className)}
    >
      <RechartAreaChart
        accessibilityLayer
        data={data}
        margin={{
          top: 4,
          left: 12,
          right: 12,
        }}
      >
        {showCartesianGrid && <CartesianGrid vertical={false} />}
        {showXAxis && (
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={tickFormatter}
            domain={['auto', 'auto']}
            interval={'equidistantPreserveStart'}
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: 'insideBottom', offset: -10 }
                : undefined
            }
          />
        )}
        {showYAxis && (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={yAxisTickFormatter}
            label={
              yAxisLabel
                ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                : undefined
            }
          />
        )}

        {tooltip}

        {categories.map((category) => (
          <Area
            key={`${category}`}
            dataKey={category}
            fill={`var(--color-${category})`}
            stroke={`var(--color-${category})`}
            strokeWidth={2}
            stackId={stack ? 'a' : undefined}
            type="linear"
            fillOpacity={opacity}
          />
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartAreaChart>
    </ChartContainer>
  )
})

function renderChartTooltip<
  _TValue extends ValueType,
  _TName extends NameType,
>({
  breakdown,
  breakdownLabel,
  breakdownValue,
  breakdownHeading,
  tooltipActive,
  chartConfig,
  categories,
}: Pick<
  AreaChartProps,
  | 'breakdown'
  | 'breakdownLabel'
  | 'breakdownValue'
  | 'breakdownHeading'
  | 'tooltipActive'
  | 'categories'
> & {
  chartConfig: ChartConfig
}) {
  if (!breakdown) {
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
                <div
                  key={`${name}${index}`}
                  className="flex flex-row items-center justify-between gap-2 min-w-0"
                >
                  <div className="flex flex-row items-center gap-1.5 min-w-0">
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
              )
            }}
          />
        }
      />
    )
  }

  if (categories.length > 1) {
    throw new Error('Only support single category for breakdown')
  }

  return (
    <ChartTooltip
      active={tooltipActive}
      content={
        <ChartTooltipContent
          hideLabel
          className="max-w-[320px]"
          formatter={(value, name, item, _index, payload: any) => {
            const breakdownData = payload[
              breakdown as keyof typeof payload
            ] as Array<any>
            const breakdownDataMap = breakdownData.map((item) => {
              // breakdown: [('A', 1000)]
              if (Array.isArray(item) && item.length === 2) {
                return item
              }

              // breakdown: [{ name: 'A', value: 1000 }]
              if (typeof item === 'object') {
                if (!breakdownLabel || !breakdownValue) {
                  throw new Error('Missing breakdownLabel or breakdownValue')
                }

                return [item[breakdownLabel], item[breakdownValue]]
              }

              throw new Error(
                'Invalid breakdown data, expected array(2) or object'
              )
            })

            return (
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex flex-row items-center justify-between gap-2 min-w-0">
                  <div className="flex flex-row items-center gap-1.5 min-w-0">
                    <div
                      className="size-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                      style={
                        {
                          '--color-bg': `var(--color-${name})`,
                        } as React.CSSProperties
                      }
                    />
                    <span className="truncate text-muted-foreground">
                      {chartConfig[name as keyof typeof chartConfig]?.label || name}
                    </span>
                  </div>

                  <div className="text-foreground shrink-0 flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                    {value}
                    <span className="text-muted-foreground font-normal"></span>
                  </div>
                </div>

                {breakdownData.length > 0 && (
                  <div className="text-foreground flex basis-full flex-col border-t pt-2 text-xs font-medium">
                    <div className="mb-1.5">
                      {breakdownHeading || 'Breakdown'}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {breakdownDataMap.map(([name, value], index) => (
                        <div
                          key={name + index}
                          className="flex items-center justify-between gap-2"
                          role="row"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className="size-2 shrink-0 rounded-[2px] bg-(--color-bg)"
                              style={
                                {
                                  '--color-bg': `var(--chart-${10 - index})`,
                                } as React.CSSProperties
                              }
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
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          }}
        />
      }
      cursor={false}
    />
  )
}
