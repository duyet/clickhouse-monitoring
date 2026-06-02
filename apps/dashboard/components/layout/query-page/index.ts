/**
 * QueryPageLayout Components
 *
 * Barrel export for all query page layout components.
 */

export type {
  CreateQueryPageOptions as CreatePageOptions,
  QueryPageLayoutProps as PageLayoutProps,
} from './layout'

export { ChartRow, type ChartRowProps } from './chart-row'
export { ChartsToggle, type ChartsToggleProps } from './charts-toggle'
export { DynamicChart, type DynamicChartProps } from './dynamic-chart'
// Re-export PageLayout as alias for backward compatibility
export {
  type CreateQueryPageOptions,
  createQueryPage,
  createQueryPage as createPage,
  QueryPageLayout,
  QueryPageLayout as PageLayout,
  type QueryPageLayoutProps,
} from './layout'
export { RelatedCharts, type RelatedChartsProps } from './related-charts'
export {
  type UseChartsCollapsedReturn,
  useChartsCollapsed,
} from './use-charts-collapsed'
export { CHARTS_PER_ROW, groupChartsIntoRows } from './utils'
export { withSuspense } from './with-suspense'
