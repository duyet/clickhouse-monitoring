/**
 * QueryPageLayout Components
 *
 * Barrel export for all query page layout components.
 */

export { ChartsToggle, type ChartsToggleProps } from './charts-toggle'

export { DynamicChart, type DynamicChartProps } from './dynamic-chart'
export type {
  CreateQueryPageOptions as CreatePageOptions,
  QueryPageLayoutProps as PageLayoutProps,
} from './layout'
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
export { useChartsCollapsed } from './use-charts-collapsed'
