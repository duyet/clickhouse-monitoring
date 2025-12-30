/**
 * Consolidated skeleton components
 *
 * All skeleton loading states organized by purpose:
 * - base: Base Skeleton component from shadcn/ui
 * - chart: Chart-specific skeletons (area, bar, metric, table)
 * - table: DataTable skeleton
 * - page: Page-level skeletons (PageSkeleton, OverviewPageSkeleton, etc.)
 * - ui: Inline UI skeletons (SingleLine, MultiLine, List)
 */

// Base skeleton
export { Skeleton } from './base'

// Chart skeletons
export { ChartSkeleton } from './chart'

// Table skeleton
export { TableSkeleton } from './table'

// Page skeletons
export {
  PageSkeleton,
  ChartsOnlyPageSkeleton,
  TableOnlyPageSkeleton,
  OverviewPageSkeleton,
  DatabasePageSkeleton,
  ChartCardSkeleton,
  MetricCardSkeleton,
  TableCardSkeleton,
} from './page'

// UI skeletons
export { SingleLineSkeleton, MultiLineSkeleton, ListSkeleton } from './ui'

// Sidebar skeleton
export { SidebarSkeleton } from './sidebar'

// Re-export ChartSkeleton for backward compatibility
// Many files import from @/components/skeleton
export { ChartSkeleton as ChartSkeletonCompat } from './chart'
