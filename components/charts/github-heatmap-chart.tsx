'use client'

import HeatMap, { type HeatMapProps } from '@uiw/react-heat-map'

import { memo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface HeatmapDataPoint {
  [key: string]: string | number | undefined
  count?: number
}

// Full of props https://uiwjs.github.io/react-heat-map/#props
export interface GithubHeatmapChartProps extends HeatMapProps {
  data: HeatmapDataPoint[]
  index?: string
  colors?: string[]
  weekLabels?: HeatMapProps['weekLabels']
  startDate?: HeatMapProps['startDate']
  endDate?: HeatMapProps['endDate']
  space?: HeatMapProps['space']
  className?: string
}

export const GithubHeatmapChart = memo(function GithubHeatmapChart({
  data,
  index = 'date',
  weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  startDate,
  endDate,
  className,
  ...props
}: GithubHeatmapChartProps) {
  if (data === null) {
    return null
  }

  const value: HeatMapProps['value'] = data.map((d) => ({
    ...d,
    date: String(d[index]),
    count: d.count || 0,
  }))

  return (
    <div className={className}>
      <HeatMap
        value={value}
        weekLabels={weekLabels}
        startDate={startDate}
        endDate={endDate}
        rectRender={(props, data) => {
          return (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <rect {...props} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{data.count}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }}
        {...props}
      />
    </div>
  )
})

export default GithubHeatmapChart
