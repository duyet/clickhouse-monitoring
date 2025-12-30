'use client'

import {
  BarList as TremorBarList,
  type BarListProps as TremorBarListProps,
} from '@tremor/react'
import { memo, useMemo } from 'react'

export interface BarListProps extends TremorBarListProps {
  data: (TremorBarListProps['data'][0] & { [key: string]: any })[]
  formatedColumn?: string
}

export const BarList = memo(function BarList({ data, formatedColumn, ...props }: BarListProps) {
  const valueFormatter = useMemo(() => {
    if (!formatedColumn) {
      return undefined
    }

    return (value: number) => {
      const formated = data.find((d) => d.value === value)?.[
        formatedColumn
      ] as string

      return formated ? formated : value
    }
  }, [formatedColumn, data])

  return (
    <TremorBarList data={data} valueFormatter={valueFormatter} {...props} />
  )
})
