/**
 * Resolve per-table behavior settings from props and queryConfig.tableBehavior.
 *
 * Precedence (highest to lowest):
 *   1. props passed directly to <DataTable>
 *   2. queryConfig.tableBehavior
 *   3. global defaults
 *
 * Pure utility, not a hook — it makes no React calls. Returning a single
 * typed object keeps the call-site in data-table.tsx flat and prevents
 * the resolved booleans from leaking through the file as a loose
 * collection of locals.
 */

import type { QueryConfig } from '@/types/query-config'

interface ResolveTableBehaviorOptions {
  queryConfig: QueryConfig
  enableColumnReorderingProp?: boolean
}

interface ResolvedTableBehavior {
  enableColumnResizing: boolean
  columnResizeMode: 'onChange' | 'onEnd'
  enableSorting: boolean
  enableColumnReordering: boolean
}

export function resolveTableBehavior({
  queryConfig,
  enableColumnReorderingProp,
}: ResolveTableBehaviorOptions): ResolvedTableBehavior {
  const behavior = queryConfig.tableBehavior ?? {}

  return {
    enableColumnResizing: behavior.enableColumnResizing ?? true,
    columnResizeMode: behavior.columnResizeMode ?? 'onChange',
    enableSorting: behavior.enableSorting ?? true,
    enableColumnReordering:
      enableColumnReorderingProp ?? behavior.enableColumnReordering ?? true,
  }
}
