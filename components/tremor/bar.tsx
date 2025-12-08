'use client'

import {
  BarChart as TremorBarChart,
  type BarChartProps as TremorBarChartProps,
} from '@tremor/react'

export interface BarChartProps extends TremorBarChartProps {
  readableColumn?: string
}

export function BarChart({
  data,
  index,
  categories,
  readableColumn,
  ...props
}: BarChartProps) {
  let valueFormatter 

  if (readableColumn) {
    valueFormatter = (value: number) => {
      for (const category of categories) {
        const formated = data.find((row) => row[category] === value)?.[
          readableColumn
        ]

        if (formated) {
          return formated
        }
      }

      return value
    }
  }

  return (
    <TremorBarChart
      data={data}
      index={index}
      categories={categories}
      valueFormatter={valueFormatter}
      showYAxis={false}
      {...props}
    />
  )
}
