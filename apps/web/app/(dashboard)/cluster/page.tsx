'use client'

import { Suspense } from 'react'
import { ChartSummaryUsedByRunningQueries } from '@/components/charts/summary-used-by-running-queries'
import { ChartCPUUsage } from '@/components/charts/system/cpu-usage'
import { ChartMemoryUsage } from '@/components/charts/system/memory-usage'
import { PageHeader } from '@/components/layout'
import { ChartSkeleton } from '@/components/skeletons'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHosts } from '@/lib/swr/use-hosts'
import { cn } from '@/lib/utils'

/** Metric row config */
const METRICS = [
  {
    id: 'running-queries',
    label: 'Running Queries',
    Component: ChartSummaryUsedByRunningQueries,
  },
  {
    id: 'cpu-usage',
    label: 'CPU Usage',
    Component: ChartCPUUsage,
  },
  {
    id: 'memory-usage',
    label: 'Memory Usage',
    Component: ChartMemoryUsage,
  },
] as const

function HostSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-48 opacity-60" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-7 w-52 mb-1" />
        <Skeleton className="h-4 w-80 opacity-60" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <HostSkeleton />
        <HostSkeleton />
        <HostSkeleton />
      </div>
    </div>
  )
}

function ClusterComparisonContent() {
  const { hosts, isLoading, error } = useHosts()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            Failed to load hosts: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hosts || hosts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No ClickHouse hosts configured.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Single host: show a note that comparison requires multiple hosts
  const isSingleHost = hosts.length === 1

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Page header */}
      <PageHeader
        title="Cluster Comparison"
        description={
          isSingleHost
            ? 'Side-by-side view of key metrics. Add more hosts to compare across nodes.'
            : `Comparing ${hosts.length} hosts — spot imbalances in CPU, memory, and query load.`
        }
      />

      {/* Metric rows: one section per metric, one card per host */}
      {METRICS.map(({ id, label, Component }) => (
        <section key={id} aria-label={label}>
          <h2 className="mb-3 text-xs font-medium tracking-widest text-muted-foreground/70 uppercase">
            {label}
          </h2>
          <div
            className={cn(
              'grid grid-cols-1 gap-4',
              hosts.length === 1 && 'max-w-sm gap-0',
              hosts.length === 2 && 'sm:grid-cols-2',
              hosts.length >= 3 && 'sm:grid-cols-2 xl:grid-cols-3'
            )}
          >
            {hosts.map((host) => (
              <div key={host.id} className="flex flex-col gap-2">
                {/* Host label above each card */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">
                    {host.name}
                  </span>
                  <span className="mt-0.5 text-xs text-muted-foreground truncate">
                    {host.host}
                  </span>
                </div>

                <Suspense fallback={<ChartSkeleton />}>
                  <Component hostId={host.id} />
                </Suspense>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function ClusterComparisonPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ClusterComparisonContent />
    </Suspense>
  )
}
