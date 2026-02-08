'use client'

import {
  ClusterStatusCard,
  MergeOperationsCard,
  QueryPerformanceCard,
  ReplicationCard,
  SystemMetricsCard,
  SystemStatusCard,
} from './bento-cards'
import { BentoGrid, BentoItem } from './bento-grid'
import { memo } from 'react'

/**
 * BentoOverview - Modern bento grid layout for the overview page
 *
 * Mobile-first responsive layout:
 * - Base (< 640px): 1 column - all cards stacked vertically
 * - sm (640px+): 2 columns - wide cards take full row
 * - md (768px+): 4 columns - small cards in 2x2 grid, wide card wraps
 * - lg (1024px+): 12 columns - optimized 3-column layout
 * - xl (1280px+): 16 columns - expanded layout
 * - 2xl (1536px+): 20 columns - maximum density
 *
 * Desktop layout (12-column grid):
 * ┌──────────────┬──────────────┬──────────────┐
 * │ CLUSTER      │ SYSTEM       │ QUERY PERF   │
 * │ STATUS (4)   │ METRICS (4)  │ (wide/8)     │
 * │ - Health     │ - CPU, Mem   │ - Query count│
 * │ - Metrics    │ - Disk       │ - Sparkline  │
 * ├──────────────┼──────────────┤              │
 * │ MERGES (4)   │ REPLIC (4)   │              │
 * ├──────────────┼──────────────┤              │
 * │ SYSTEM (4)   │              │              │
 * └──────────────┴──────────────┴──────────────┘
 *
 * Mobile layout:
 * All cards stack vertically with full width
 */
export const BentoOverview = memo(function BentoOverview() {
  return (
    <BentoGrid>
      {/* Row 1: Cluster status (4) + System metrics (4) */}
      <BentoItem size="small" interactive>
        <ClusterStatusCard />
      </BentoItem>

      <BentoItem size="small">
        <SystemMetricsCard />
      </BentoItem>

      {/* Row 1-2: Query performance wide (8) - spans 2 rows */}
      <BentoItem size="wide" interactive>
        <QueryPerformanceCard />
      </BentoItem>

      {/* Row 2: Merges (4) + Replication (4) + System status (4) */}
      <BentoItem size="small" interactive>
        <MergeOperationsCard />
      </BentoItem>

      <BentoItem size="small" interactive>
        <ReplicationCard />
      </BentoItem>

      <BentoItem size="small">
        <SystemStatusCard />
      </BentoItem>
    </BentoGrid>
  )
})
