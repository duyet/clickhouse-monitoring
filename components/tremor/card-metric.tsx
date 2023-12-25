'use client'

import { Metric, ProgressBar, Text } from '@tremor/react'

export interface CardMetricProps {
  current: number
  target: number
  currentReadable?: string
  targetReadable?: string
  className?: string
}

export function CardMetric({
  current,
  target,
  currentReadable,
  targetReadable,
  className,
}: CardMetricProps) {
  const percent = (current / target) * 100

  return (
    <div className={className}>
      <Metric>{currentReadable || current}</Metric>

      <div className="flex flex-col justify-between">
        <div className="mt-4 flex flex-row justify-between">
          <Text className="truncate">{currentReadable || current}</Text>
          <Text>{targetReadable || target}</Text>
        </div>
        <ProgressBar value={percent} className="mt-2" />
      </div>
    </div>
  )
}
