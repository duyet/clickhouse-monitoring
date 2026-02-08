'use client'

import { BentoGrid, BentoItem } from './bento-grid'
import {
  ClusterStatusCard,
  SystemMetricsCard,
  QueryPerformanceCard,
  MergeOperationsCard,
  ReplicationCard,
  SystemStatusCard,
} from './bento-cards'
import { memo } from 'react'

/**
 * BentoOverview - Modern bento grid layout for the overview page
 *
 * Layout structure:
 * ┌─────────────────────────────────────────────────────────┐
 * │  CLUSTER STATUS (Large)  │  METRICS (Medium)          │
 * │  - Health indicators      │  - CPU, Memory, Disk      │
 * │  - Active connections     │  - Mini progress bars     │
 * ├───────────────────────────┴────────────────────────────┤
 * │  QUERY PERFORMANCE (Wide)                            │
 * │  - Query count with sparkline                         │
 * │  - Duration percentiles                               │
 * ├──────────────────┬──────────────────┬─────────────────┤
 * │  MERGES (Small)  │  REPLICATION     │  SYSTEM (Small) │
 * │  - Progress bars │  (Small)         │  - Status list  │
 * └──────────────────┴──────────────────┴─────────────────┘
 *
 * Responsive behavior:
 * - Mobile: Single column stacked
 * - Tablet: 2 columns with some spanning
 * - Desktop: 4 columns full bento layout
 */
export const BentoOverview = memo(function BentoOverview() {
  return (
    <BentoGrid>
      {/* Row 1: Large cluster status + Medium metrics */}
      <BentoItem size="large">
        <ClusterStatusCard />
      </BentoItem>

      <BentoItem size="medium">
        <SystemMetricsCard />
      </BentoItem>

      {/* Row 2: Wide query performance */}
      <BentoItem size="wide">
        <QueryPerformanceCard />
      </BentoItem>

      {/* Row 3: Three small cards */}
      <BentoItem size="small">
        <MergeOperationsCard />
      </BentoItem>

      <BentoItem size="small">
        <ReplicationCard />
      </BentoItem>

      <BentoItem size="small">
        <SystemStatusCard />
      </BentoItem>
    </BentoGrid>
  )
})
