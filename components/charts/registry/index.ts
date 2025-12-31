/**
 * Chart Registry - Main Exports
 *
 * Centralized chart registry system for lazy-loading chart components.
 * Provides type-safe access to all registered charts with proper skeleton hints.
 *
 * @example
 * ```tsx
 * import { getChartComponent, hasChart } from '@/components/charts/registry'
 *
 * if (hasChart('query-count')) {
 *   const Chart = getChartComponent('query-count')
 *   return <Chart hostId={0} />
 * }
 * ```
 */

// Types
export type {
  ChartComponent,
  ChartSkeletonType,
  LazyChartComponent,
  ChartRegistryMap,
} from './types'
export type { ChartProps } from './types'

// Type hints and skeleton utilities
export { CHART_TYPE_HINTS, getChartSkeletonType } from './type-hints'

// Registry functions
export {
  getChartComponent,
  hasChart,
  getRegisteredChartNames,
  getChartsByCategory,
} from './registry-fns'

// Chart categories
export { CHART_CATEGORIES, CHARTS_BY_CATEGORY } from './chart-categories'
export type { ChartCategory } from './chart-categories'

// Direct access to imports (for advanced use cases)
export { chartImports } from './chart-imports'
