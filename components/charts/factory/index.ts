/**
 * Chart factory module for creating chart components with consistent patterns
 *
 * Eliminates ~45 lines of duplicate code per chart component.
 *
 * @example
 * ```typescript
 * import { createAreaChart } from '@/components/charts/factory'
 *
 * export const ChartCpuUsage = createAreaChart<{
 *   event_time: string
 *   cpu_usage: number
 * }>({
 *   chartName: 'cpu-usage',
 *   index: 'event_time',
 *   categories: ['cpu_usage'],
 * })
 * ```
 */

export type {
  AreaChartFactoryConfig,
  BarChartFactoryConfig,
  CustomChartFactoryConfig,
} from './types'

export { createAreaChart } from './create-area-chart'
export { createBarChart } from './create-bar-chart'
export { createCustomChart } from './create-custom-chart'
