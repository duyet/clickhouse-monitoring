'use client'

import {
  Legend,
  AreaChart as TremorAreaChart,
  type AreaChartProps as TremorAreaChartProps,
} from '@tremor/react'

import {
  formatReadableQuantity,
  formatReadableSize,
} from '@/lib/format-readable'
import { DonutChart, type DonutChartProps } from '@/components/tremor/donut'

import { type ReadableFormat } from './types'

export interface AreaChartProps extends TremorAreaChartProps {
  readable?: true | ReadableFormat
  readableColumns?: string[]
  breakdown?: string
}

export function AreaChart({
  data,
  categories,
  index,
  readable,
  readableColumns,
  breakdown,
  intervalType = 'preserveStartEnd',
  animationDuration = 100,
  autoMinValue = true,
  showGridLines = false,
  startEndOnly = true,
  allowDecimals = false,
  showYAxis = false,
  ...props
}: AreaChartProps) {
  let valueFormatter = undefined

  if (readable && readableColumns) {
    valueFormatter = (value: number) => {
      for (let i = 0; i < categories.length; i++) {
        // Bruteforce
        const formated = data.find((d) => d[categories[i]] === value)?.[
          readableColumns[i]
        ]

        if (formated) {
          return formated
        }
      }

      return value
    }
  } else if (readable) {
    switch (readable) {
      case 'size':
        valueFormatter = (value: number) => formatReadableSize(value, 1)
        break
      case 'quantity':
        valueFormatter = (value: number) => formatReadableQuantity(value)
        break
    }
  }

  // Providing breakdown props as the column name of the breakdown data
  // The format of the breakdown data should be:
  // [
  //   [key1, value1],
  //   [key2, value2],
  // ]
  // - payload: use payload[0].value for the value, such as "$ 450".
  //            Both payload[0].dataKey and payload[0].name for category values, such as "Sales"
  // - label: For x-axis values, such as "Jan 21"
  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const col = breakdown as string
    const breakdownData = payload[0].payload[col]
    console.log('breakdownData', breakdownData)

    const data: DonutChartProps['data'] = breakdownData.map(
      ([name, value]: [string, string]) => ({
        name,
        value: parseInt(value),
      })
    )
    console.log('data', data)

    return (
      <div className="z-50 flex flex-col content-center rounded-lg bg-white shadow-lg">
        <div className="center flex flex-row justify-between border-b p-2 text-xs text-slate-700">
          <Legend categories={[payload[0].name + ': ' + payload[0].value]} />
          <div className="text-sm text-slate-500">{label}</div>
        </div>

        <div className="flex flex-row gap-2">
          <div className="flex flex-row items-center bg-slate-50 p-3 align-middle">
            <DonutChart
              className="h-28 w-28"
              data={data}
              category="value"
              index="name"
              variant="pie"
              colors={[
                'blue-300',
                'purple-300',
                'pink-300',
                'yellow-300',
                'red-300',
                'gray-300',
              ]}
            />
          </div>
          <div>
            <div className="flex w-48 flex-col p-2 pr-3 pt-3 text-xs text-slate-500">
              {data.map(({ name, value }) => (
                <div
                  key={name}
                  className="mb-1 flex w-full flex-row justify-between gap-1"
                >
                  <span className="truncate">{name}</span>
                  <span className="font-semibold">
                    {formatReadableQuantity(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TremorAreaChart
      data={data}
      index={index}
      categories={categories}
      valueFormatter={valueFormatter}
      intervalType={intervalType}
      animationDuration={animationDuration}
      autoMinValue={autoMinValue}
      showGridLines={showGridLines}
      startEndOnly={startEndOnly}
      allowDecimals={allowDecimals}
      showYAxis={showYAxis}
      {...(breakdown ? { customTooltip } : {})}
      {...props}
    />
  )
}
