'use client'

import {
  DonutChart as TremorDonutChart,
  type DonutChartProps as TremorDonutChartProps,
} from '@tremor/react'
import { memo, useCallback } from 'react'

export interface DonutChartProps extends TremorDonutChartProps {
  readable?: string
  readableColumn?: string
}

export const DonutChart = memo(function DonutChart({
  data,
  readable,
  readableColumn,
  ...props
}: DonutChartProps) {
  const valueFormatter = useCallback(
    (value: number) => {
      if (!readable || !readableColumn) return value
      const formatted = data.find((d) => d.value === value)?.[readableColumn]
      return formatted ?? value
    },
    [data, readable, readableColumn]
  )

  return (
    <TremorDonutChart
      data={data}
      valueFormatter={readable && readableColumn ? valueFormatter : undefined}
      {...props}
    />
  )
})
