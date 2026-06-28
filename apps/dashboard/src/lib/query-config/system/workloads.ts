import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

/**
 * system.workloads — available since ClickHouse 25.4.
 * Shows the WORKLOAD hierarchy for SQL resource scheduling:
 * weights, priorities, and concurrency caps per workload.
 */
export const workloadsConfig: QueryConfig = {
  name: 'workloads',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['name', 'parent'] },
  description:
    'SQL resource scheduling workload hierarchy: weights, priorities, and concurrency limits (system.workloads, CH 25.4+).',
  refreshInterval: 30_000,
  optional: true,
  tableCheck: 'system.workloads',
  sql: [
    {
      since: '25.4',
      description: 'Workload hierarchy with scheduling parameters',
      sql: `
        SELECT
          name,
          parent,
          priority,
          weight,
          max_speed,
          max_burst,
          max_concurrent_queries,
          max_cpus
        FROM system.workloads
        ORDER BY parent ASC, name ASC
      `,
    },
  ],
  columns: [
    'name',
    'parent',
    'priority',
    'weight',
    'max_speed',
    'max_burst',
    'max_concurrent_queries',
    'max_cpus',
  ],
  columnFormats: {
    name: ColumnFormat.ColoredBadge,
    parent: ColumnFormat.ColoredBadge,
    priority: ColumnFormat.Number,
    weight: ColumnFormat.Number,
    max_concurrent_queries: ColumnFormat.Number,
    max_cpus: ColumnFormat.Number,
  },
}
