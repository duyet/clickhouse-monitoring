/**
 * Expensive Queries components
 *
 * Purpose-built, dense view for the Most Expensive Queries page — a sortable,
 * responsive table of the costliest `system.query_log` fingerprints over the
 * last 24h, with rank badges, a severity heat accent, filters and expandable
 * per-row detail.
 */

export {
  ExpensiveQueriesTable,
  type ExpensiveQueryRow,
} from '@/components/expensive-queries/expensive-queries-table'
export { ExpensiveQueriesView } from '@/components/expensive-queries/expensive-queries-view'
