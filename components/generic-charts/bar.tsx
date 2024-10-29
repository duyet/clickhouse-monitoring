'use client'

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { binding, cn } from '@/lib/utils'
import { type BarChartProps } from '@/types/charts'
import { useHistory } from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  LabelList,
  BarChart as RechartBarChart,
  XAxis,
  YAxis,
  type LabelListProps,
} from 'recharts'
import {
  NameType,
  Payload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent'
import { type ViewBox } from 'recharts/types/util/types'

export function BarChart({
  data,
  index,
  categories,
  readableColumn,
  labelPosition,
  labelAngle,
  showLegend = false,
  showLabel = false,
  stack = false,
  horizontal = false,
  tooltipTotal = false,
  onClickHref,
  colors,
  colorLabel,
  tickFormatter,
  className,
}: BarChartProps) {
  const history = useHistory()

  const chartConfig = categories.reduce(
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

  const getRadius = ({
    index,
    categories,
    stack,
    horizontal,
  }: Pick<BarChartProps, 'categories' | 'horizontal' | 'stack'> & {
    index: number
  }): number | [number, number, number, number] => {
    const length = categories.length
    const radius = 6

    if (!stack) {
      return radius
    }

    if (length === 1) {
      return radius
    }

    if (index === 0) {
      if (horizontal) {
        return [radius, 0, 0, radius]
      } else {
        return [0, 0, radius, radius]
      }
    }

    if (index === length - 1) {
      if (horizontal) {
        return [0, radius, radius, 0]
      } else {
        return [radius, radius, 0, 0]
      }
    }

    return [0, 0, 0, 0]
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('min-h-[200px] w-full', className)}
    >
      <RechartBarChart
        accessibilityLayer
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{
          top: 5,
        }}
      >
        <CartesianGrid vertical={horizontal} horizontal={!horizontal} />

        {horizontal ? (
          <>
            <XAxis dataKey={categories[0]} type="number" hide />
            <YAxis
              dataKey={index}
              type="category"
              tickLine={false}
              axisLine={false}
              tickFormatter={tickFormatter}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={index}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={tickFormatter}
            />
          </>
        )}

        {renderChartTooltip({ tooltipTotal, chartConfig, categories })}

        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey={category}
            layout={horizontal ? 'vertical' : 'horizontal'}
            fill={`var(--color-${category})`}
            stackId={stack ? 'a' : undefined}
            radius={getRadius({ index, categories, stack, horizontal })}
            maxBarSize={120}
            minPointSize={3}
            onClick={(data) =>
              onClickHref !== undefined &&
              history.push(binding(onClickHref, data))
            }
            cursor={onClickHref !== undefined ? 'pointer' : 'default'}
          >
            {renderChartLabel({
              dataKey: category,
              showLabel,
              labelPosition,
              labelAngle,
              stack,
              data,
              categories,
              readableColumn,
              horizontal,
            })}
          </Bar>
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
}

interface Data {
  value?: number | string | Array<number | string>
  payload?: any
  parentViewBox?: ViewBox
}

function renderChartLabel<T extends Data>({
  dataKey,
  showLabel,
  labelPosition,
  labelAngle,
  data,
  stack,
  categories,
  readableColumn,
  horizontal,
}: Pick<
  BarChartProps,
  | 'showLabel'
  | 'labelPosition'
  | 'labelAngle'
  | 'data'
  | 'stack'
  | 'categories'
  | 'readableColumn'
  | 'labelFormatter'
  | 'horizontal'
> &
  Pick<LabelListProps<T>, 'dataKey'>) {
  if (!showLabel) return null

  const labelFormatter = (value: string) => {
    if (!readableColumn) {
      return value
    }

    for (let category of categories) {
      const formated = data.find((row) => row[category] === value)?.[
        readableColumn
      ]

      if (formated) {
        return formated
      }
    }

    return value
  }

  if (stack) {
    return (
      <LabelList
        dataKey={dataKey}
        position={labelPosition || (horizontal ? 'insideLeft' : 'inside')}
        offset={8}
        className="fill-[--color-label]"
        fontSize={12}
        formatter={readableColumn ? labelFormatter : undefined}
        angle={labelAngle}
      />
    )
  }

  return (
    <LabelList
      dataKey={dataKey}
      position={labelPosition || (horizontal ? 'right' : 'top')}
      offset={8}
      className="fill-foreground"
      fontSize={12}
      formatter={readableColumn ? labelFormatter : undefined}
      angle={labelAngle}
    />
  )
}

function renderChartTooltip({
  tooltipTotal,
  chartConfig,
  categories,
}: Pick<BarChartProps, 'categories' | 'tooltipTotal'> & {
  chartConfig: ChartConfig
}) {
  if (!tooltipTotal) {
    return (
      <ChartTooltip
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
                <>
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
                    {item['payload'][`readable_${name}` as keyof typeof item] ||
                      value.toLocaleString()}
                    <span className="font-normal text-muted-foreground"></span>
                  </div>
                </>
              )
            }}
          />
        }
      />
    )
  }

  return (
    <ChartTooltip
      content={
        <ChartTooltipContent
          hideLabel
          className="w-fit"
          formatter={(value, name, item, index) => (
            <>
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
                {item['payload'][`readable_${name}` as keyof typeof item] ||
                  value.toLocaleString()}
                <span className="font-normal text-muted-foreground"></span>
              </div>

              {index === 1 && (
                <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                  Total
                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {categories
                      .map((cat) => parseInt(item.payload[cat]) || 0)
                      .reduce((a, b) => a + b, 0)}
                    <span className="font-normal text-muted-foreground"></span>
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
