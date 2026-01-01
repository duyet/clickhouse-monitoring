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
// Page skeletons
export {
  ChartsOnlyPageSkeleton,
  PageSkeleton,
  TableOnlyPageSkeleton,
} from './page'
// Sidebar skeleton
export { SidebarSkeleton } from './sidebar'
// Table skeleton
export { TableSkeleton } from './table'
// UI skeletons
export { ListSkeleton, MultiLineSkeleton, SingleLineSkeleton } from './ui'
