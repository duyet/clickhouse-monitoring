'use client'

import {
  BarChart as TremorBarChart,
  type BarChartProps as TremorBarChartProps,
} from '@tremor/react'
import { memo, useMemo } from 'react'

export interface BarChartProps extends TremorBarChartProps {
  readableColumn?: string
}

export const BarChart = memo(function BarChart({
  data,
  index,
  categories,
  readableColumn,
  ...props
}: BarChartProps) {
  const valueFormatter = useMemo(() => {
    if (!readableColumn) {
      return undefined
    }

    return (value: number) => {
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
  }, [readableColumn, data, categories])

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
})
