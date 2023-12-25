'use client'

import {
  BarList as TremorBarList,
  type BarListProps as TremorBarListProps,
} from '@tremor/react'

export interface BarListProps extends TremorBarListProps {
  data: (TremorBarListProps['data'][0] & { [key: string]: any })[]
  formatedColumn?: string
}

export function BarList({ data, formatedColumn, ...props }: BarListProps) {
  let valueFormatter

  if (formatedColumn) {
    valueFormatter = (value: number) => {
      const formated = data.find((d) => d.value === value)?.[
        formatedColumn
      ] as string

      return formated ? formated : value
    }
  }

  return (
    <TremorBarList data={data} valueFormatter={valueFormatter} {...props} />
  )
}
