import type { DeclarativeQueryConfig } from '../../schema'

export const schedulerDeclarative: DeclarativeQueryConfig = {
  name: 'scheduler',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['resource', 'type'] },
  description:
    'Live resource scheduler node state: in-flight, queued, and budget per workload path (system.scheduler, CH 25.4+).',
  refreshInterval: 5_000,
  optional: true,
  tableCheck: 'system.scheduler',
  sql: [
    {
      since: '25.4',
      description: 'Live scheduler node state per resource and workload path',
      sql: `
        SELECT
          resource,
          path,
          type,
          status,
          dequeued_requests,
          formatReadableQuantity(dequeued_requests) AS readable_dequeued,
          round(dequeued_requests * 100.0 / nullIf(max(dequeued_requests) OVER (), 0), 2) AS pct_dequeued,
          dequeued_cost,
          in_flight_requests,
          in_flight_cost,
          budget,
          is_active
        FROM system.scheduler
        ORDER BY resource ASC, path ASC
      `,
    },
  ],
  columns: [
    'resource',
    'path',
    'type',
    'status',
    'readable_dequeued',
    'dequeued_cost',
    'in_flight_requests',
    'in_flight_cost',
    'budget',
    'is_active',
  ],
  columnFormats: {
    resource: 'colored-badge',
    type: 'colored-badge',
    status: 'colored-badge',
    readable_dequeued: 'background-bar',
    is_active: 'boolean',
    in_flight_requests: 'number',
    in_flight_cost: 'number',
    budget: 'number',
  },
}
