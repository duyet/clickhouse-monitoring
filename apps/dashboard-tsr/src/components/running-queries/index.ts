/**
 * Running Queries components
 *
 * Purpose-built, dense table for the Running Queries page — a sortable,
 * responsive view of in-flight `system.processes` rows with expandable
 * execution detail.
 */

export {
  CompletedQueriesTable,
  type CompletedQueryRow,
} from '@/components/running-queries/completed-queries-table'
export {
  RunningQueriesTable,
  type RunningQueryRow,
} from '@/components/running-queries/running-queries-table'
export { RunningQueriesView } from '@/components/running-queries/running-queries-view'
