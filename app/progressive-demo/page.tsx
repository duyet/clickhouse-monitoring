'use client'

import { Suspense, useState } from 'react'
import { ProgressiveMetricCard } from '@/components/cards/progressive-metric-card'
import { ChartSkeleton } from '@/components/skeletons'

/**
 * Progressive Disclosure Demo Page
 *
 * This page showcases the 4-level progressive disclosure pattern.
 * It demonstrates different use cases for the ProgressiveMetricCard component.
 */

function DemoContent() {
  const [demoCardLevel, setDemoCardLevel] = useState(0)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Progressive Disclosure Demo</h1>
        <p className="text-muted-foreground">
          A 4-level progressive disclosure pattern for complex metrics. Click
          the cards or level indicators to expand.
        </p>
      </div>

      {/* Demo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Running Queries Demo */}
        <ProgressiveMetricCard
          cardId="demo-running-queries"
          headline={{
            value: '15',
            label: 'Running Queries',
            trend: { value: 5, label: 'vs last hour' },
          }}
          keyMetrics={{
            timeRange: 'Last 5 minutes',
            metrics: [
              { label: "Today's Queries", value: '1,234', trend: 12 },
              { label: 'Avg Duration', value: '2.5', unit: 's', trend: -8 },
              { label: 'Median Duration', value: '1.2', unit: 's' },
            ],
          }}
          detailedTable={{
            title: 'Top Tables by Query Count',
            headers: [
              { key: 'table', label: 'Table', width: 'min-w-[200px]' },
              { key: 'count', label: 'Queries', align: 'right' },
              { key: 'avg_time', label: 'Avg Time', align: 'right' },
            ],
            rows: [
              {
                id: '1',
                cells: {
                  table: 'analytics.events',
                  count: '456',
                  avg_time: '1.8s',
                },
              },
              {
                id: '2',
                cells: {
                  table: 'users.sessions',
                  count: '234',
                  avg_time: '2.1s',
                },
              },
              {
                id: '3',
                cells: {
                  table: 'metrics.measurements',
                  count: '189',
                  avg_time: '0.9s',
                },
              },
            ],
          }}
          rawData={{
            type: 'sql',
            sql: `SELECT count() AS count
FROM system.processes
WHERE query_kind != 'Unknown'`,
            title: 'Running Queries SQL',
          }}
          onLevelChange={setDemoCardLevel}
        />

        {/* Card 2: Disk Usage Demo */}
        <ProgressiveMetricCard
          cardId="demo-disk-usage"
          headline={{
            value: '45.2 GB',
            label: 'Disk Usage',
          }}
          keyMetrics={{
            timeRange: 'Current usage',
            metrics: [
              { label: 'Total Space', value: '100 GB' },
              { label: 'Free Space', value: '54.8 GB' },
              { label: 'Used %', value: '45.2', unit: '%' },
            ],
          }}
          detailedTable={{
            title: 'Disk Usage by Table',
            headers: [
              { key: 'table', label: 'Table', width: 'min-w-[200px]' },
              { key: 'size', label: 'Size', align: 'right' },
              { key: 'rows', label: 'Rows', align: 'right' },
            ],
            rows: [
              {
                id: '1',
                cells: {
                  table: 'analytics.events',
                  size: '12.3 GB',
                  rows: '1.2B',
                },
              },
              {
                id: '2',
                cells: {
                  table: 'users.sessions',
                  size: '8.7 GB',
                  rows: '456M',
                },
              },
              {
                id: '3',
                cells: {
                  table: 'metrics.measurements',
                  size: '5.4 GB',
                  rows: '890M',
                },
              },
            ],
          }}
          rawData={{
            type: 'json',
            data: {
              total_bytes: 48529039157,
              free_bytes: 58839116858,
              used_bytes: 45.2,
              unit: 'GB',
            },
            title: 'Disk Usage Data',
          }}
        />
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Level 0:</strong> Headline KPI
            display - shows the most important metric at a glance
          </li>
          <li>
            <strong className="text-foreground">Level 1:</strong> Key metrics
            with trends - secondary metrics and trend information
          </li>
          <li>
            <strong className="text-foreground">Level 2:</strong> Detailed
            breakdown table - full data table with rows
          </li>
          <li>
            <strong className="text-foreground">Level 3:</strong> Raw data/SQL -
            underlying query or data for power users
          </li>
        </ul>
        <div className="pt-2 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">URL Persistence:</strong> The
            disclosure level is stored in the URL query params (e.g.,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              ?disclosure-demo-running-queries=2
            </code>
            ), making the expanded state shareable.
          </p>
        </div>
      </div>

      {/* State Debug */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">State Debug</h3>
        <p className="text-xs text-muted-foreground font-mono">
          Current demo card level: {demoCardLevel}
        </p>
        <p className="text-xs text-muted-foreground">
          Try expanding the cards and notice the URL changes. You can also set
          the initial state via URL params.
        </p>
      </div>
    </div>
  )
}

export default function ProgressiveDemoPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <DemoContent />
    </Suspense>
  )
}
