/**
 * Consolidated skeleton components
 *
 * All skeleton loading states organized by purpose:
 * - base: Base Skeleton component from shadcn/ui
 * - chart: Chart skeleton
 * - explorer: Database explorer skeleton
 * - page: Page-level skeletons (PageSkeleton, ChartsOnlyPageSkeleton, TableOnlyPageSkeleton)
 * - redirect: Redirect page skeleton
 * - sidebar: Sidebar skeleton
 * - table: DataTable skeleton
 * - tabs: Tabs skeleton
 * - ui: Inline UI skeletons (SingleLine, MultiLine, List)
 */

// Base skeleton
export { Skeleton } from './base'
// Chart skeletons
export { ChartSkeleton } from './chart'
// Explorer skeleton
export { ExplorerSkeleton } from './explorer'
// Page skeletons
export {
  ChartsOnlyPageSkeleton,
  PageSkeleton,
  TableOnlyPageSkeleton,
} from './page'
// Redirect skeleton
export { RedirectSkeleton } from './redirect'
// Sidebar skeleton
export { SidebarSkeleton } from './sidebar'
// Table skeleton
export { TableSkeleton } from './table'
// Tabs skeleton
export { TabsSkeleton } from './tabs'
// UI skeletons
export { ListSkeleton, MultiLineSkeleton, SingleLineSkeleton } from './ui'
