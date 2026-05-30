/**
 * Slow Queries components
 *
 * Purpose-built, dense table for the Slow Queries page — a sortable,
 * responsive view of the slowest `system.query_log` rows with per-row
 * expand, preset filters, rank badges, and a syntax-highlighted query dialog.
 */

export {
  SlowQueriesTable,
  type SlowQueryRow,
} from '@/components/slow-queries/slow-queries-table'
export { SlowQueriesView } from '@/components/slow-queries/slow-queries-view'
