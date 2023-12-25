'use client'

import { Metric, ProgressBar, Text } from '@tremor/react'

export interface CardMultiMetricsProps {
  primary?: string | number
  items: {
    current: number
    target: number
    currentReadable?: string
    targetReadable?: string
  }[]
  className?: string
}

export function CardMultiMetrics({
  primary,
  items,
  className,
}: CardMultiMetricsProps) {
  return (
    <div className={className}>
      <Metric>{primary}</Metric>

      <div className="flex flex-col justify-between">
        {items.map((item, i) => {
          const percent = (item.current / item.target) * 100

          return (
            <div key={i}>
              <div className="mt-4 flex flex-row justify-between">
                <Text className="truncate">{item.currentReadable}</Text>
                <Text>{item.targetReadable}</Text>
              </div>
              <ProgressBar value={percent} className="mt-2" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
