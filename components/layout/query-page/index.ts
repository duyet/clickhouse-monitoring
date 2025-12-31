/**
 * QueryPageLayout Components
 *
 * Barrel export for all query page layout components.
 */

export {
  QueryPageLayout,
  createQueryPage,
  type QueryPageLayoutProps,
  type CreateQueryPageOptions,
} from './layout'

export { DynamicChart, type DynamicChartProps } from './dynamic-chart'
export { RelatedCharts, type RelatedChartsProps } from './related-charts'
export { ChartsToggle, type ChartsToggleProps } from './charts-toggle'
export { useChartsCollapsed } from './use-charts-collapsed'

// Re-export PageLayout as alias for backward compatibility
export { QueryPageLayout as PageLayout } from './layout'
export { createQueryPage as createPage } from './layout'
export type { CreateQueryPageOptions as CreatePageOptions } from './layout'
export type { QueryPageLayoutProps as PageLayoutProps } from './layout'
