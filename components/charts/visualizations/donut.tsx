'use client'

import {
  DonutChart as TremorDonutChart,
  type DonutChartProps as TremorDonutChartProps,
} from '@tremor/react'

export interface DonutChartProps extends TremorDonutChartProps {
  readable?: string
  readableColumn?: string
}

export function DonutChart({
  data,
  readable,
  readableColumn,
  ...props
}: DonutChartProps) {
  let valueFormatter

  if (readable && readableColumn) {
    valueFormatter = (value: number) => {
      const formated = data.find((d) => d.value === value)?.[readableColumn]

      return formated ? formated : value
    }
  }

  return (
    <TremorDonutChart data={data} valueFormatter={valueFormatter} {...props} />
  )
}
