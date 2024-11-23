'use client'

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { type AreaChartProps } from '@/types/charts'
import {
  Area,
  CartesianGrid,
  AreaChart as RechartAreaChart,
  XAxis,
} from 'recharts'
import {
  NameType,
  Payload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent'

export function AreaChart({
  data,
  index,
  categories,
  showLegend = false,
  showXAxis = true,
  showCartesianGrid = true,
  stack = false,
  opacity = 0.6,
  colors,
  colorLabel,
  tickFormatter,
  breakdown,
  breakdownLabel,
  breakdownValue,
  breakdownHeading,
  tooltipActive,
  chartConfig: customChartConfig,
  className,
}: AreaChartProps) {
  const config = categories.reduce(
    (acc, category, index) => {
      acc[category] = {
        label: category,
        color: colors
          ? `hsl(var(${colors[index]}))`
          : `hsl(var(--chart-${index + 1}))`,
      }

      return acc
    },
    {
      label: {
        color: colorLabel
          ? `hsl(var(${colorLabel}))`
          : 'hsl(var(--background))',
      },
    } as ChartConfig
  )
  const chartConfig = {
    ...config,
    ...(customChartConfig || {}),
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('min-h-[200px] w-full', className)}
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
          />
        )}

        {renderChartTooltip({
          breakdown,
          breakdownLabel,
          breakdownValue,
          breakdownHeading,
          tooltipActive,
          chartConfig,
          categories,
        })}

        {categories.map((category) => (
          <Area
            key={'' + category}
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
}

function renderChartTooltip<TValue extends ValueType, TName extends NameType>({
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
            className="w-fit"
            formatter={(
              value,
              name,
              item,
              index,
              payload: Array<Payload<ValueType, NameType>>
            ) => {
              return (
                <div
                  key={'' + name + index}
                  className="flex flex-row items-baseline justify-between gap-3"
                >
                  <div className="flex flex-row items-baseline gap-1">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                      style={
                        {
                          '--color-bg': `var(--color-${name})`,
                        } as React.CSSProperties
                      }
                    />
                    {chartConfig[name as keyof typeof chartConfig]?.label ||
                      name}
                  </div>

                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {item['payload'][`readable_${name}` as keyof typeof item] ||
                      value.toLocaleString()}
                    <span className="font-normal text-muted-foreground"></span>
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
          className="w-fit"
          formatter={(value, name, item, index, payload: any) => {
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
              <>
                <div className="flex flex-row">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                    style={
                      {
                        '--color-bg': `var(--color-${name})`,
                      } as React.CSSProperties
                    }
                  />

                  {chartConfig[name as keyof typeof chartConfig]?.label || name}

                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {value}
                    <span className="font-normal text-muted-foreground"></span>
                  </div>
                </div>

                {breakdownData.length > 0 && (
                  <>
                    <div
                      className="mt-1 flex basis-full flex-col border-t text-xs font-medium text-foreground"
                      role="breakdown"
                    >
                      <div className="mt-1.5">
                        {breakdownHeading || 'Breakdown'}
                      </div>
                      {breakdownDataMap.map(([name, value], index) => (
                        <div
                          key={name + index}
                          className="mt-1.5 flex items-center gap-1.5"
                          role="row"
                        >
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                            style={
                              {
                                '--color-bg': `hsl(var(--chart-${10 - index}))`,
                              } as React.CSSProperties
                            }
                          />

                          {item[breakdownLabel as keyof typeof item] || name}

                          <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                            {value.toLocaleString()}
                            <span className="font-normal text-muted-foreground"></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )
          }}
        />
      }
      cursor={false}
    />
  )
}
