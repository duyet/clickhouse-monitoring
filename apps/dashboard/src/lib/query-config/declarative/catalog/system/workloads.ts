import type { DeclarativeQueryConfig } from '../../schema'

export const workloadsDeclarative: DeclarativeQueryConfig = {
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
    name: 'colored-badge',
    parent: 'colored-badge',
    priority: 'number',
    weight: 'number',
    max_concurrent_queries: 'number',
    max_cpus: 'number',
  },
}
