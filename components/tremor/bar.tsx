'use client'

import {
  BarChart as TremorBarChart,
  type BarChartProps as TremorBarChartProps,
} from '@tremor/react'

import { type ReadableFormat } from './types'

export interface BarChartProps extends TremorBarChartProps {
  readable?: ReadableFormat
  readableColumn?: string
}

export function BarChart({
  data,
  index,
  readable,
  readableColumn,
  ...props
}: BarChartProps) {
  let valueFormatter = undefined

  if (readable && readableColumn) {
    valueFormatter = (value: number) => {
      const formated = data.find((d) => d[index] === value)?.[readableColumn]

      return formated ? formated : value
    }
  }

  return (
    <TremorBarChart
      data={data}
      index={index}
      valueFormatter={valueFormatter}
      {...props}
    />
  )
}
