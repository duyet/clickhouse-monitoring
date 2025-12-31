/**
 * Consolidated skeleton components
 *
 * All skeleton loading states organized by purpose:
 * - base: Base Skeleton component from shadcn/ui
 * - chart: Chart skeleton
 * - table: DataTable skeleton
 * - page: Page-level skeletons (PageSkeleton, ChartsOnlyPageSkeleton, TableOnlyPageSkeleton)
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
} from './page'

// UI skeletons
export { SingleLineSkeleton, MultiLineSkeleton, ListSkeleton } from './ui'

// Sidebar skeleton
export { SidebarSkeleton } from './sidebar'
