'use client'

import {
  Activity,
  Clock,
  Database,
  Gauge,
  HardDrive,
  Layers,
  Rows3Icon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import type { ReactNode } from 'react'

import { useExplorerState } from '../hooks/use-explorer-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/lib/swr/api-fetch'
import { useHostId } from '@/lib/swr/use-host'

interface OverviewRow {
  total_bytes?: string | number | null
  total_rows?: string | number | null
  engine?: string | null
  engine_full?: string | null
  primary_key_bytes_in_memory?: string | number | null
  primary_key_bytes_in_memory_allocated?: string | number | null
  metadata_modification_time?: string | null
  compressed_bytes?: string | number | null
  uncompressed_bytes?: string | number | null
  active_parts?: string | number | null
  partitions?: string | number | null
  last_modified?: string | null
}

interface UsageRow {
  queries_24h?: string | number | null
  queries_7d?: string | number | null
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  metadata?: {
    unavailable?: boolean
    [key: string]: unknown
  }
}

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  subline?: ReactNode
}

const fetcher = async <T,>(url: string): Promise<ApiResponse<T>> => {
  const res = await apiFetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json()
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function formatBytes(value: unknown): string {
  const bytes = toFiniteNumber(value)
  if (bytes === null) return '—'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const unitIndex = Math.min(
    Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)),
    units.length - 1
  )
  const scaled = bytes / 1024 ** unitIndex
  const digits = scaled >= 10 || unitIndex === 0 ? 0 : 1

  return `${scaled.toFixed(digits)} ${units[unitIndex]}`
}

function formatNumber(value: unknown): string {
  const n = toFiniteNumber(value)
  return n === null ? '—' : n.toLocaleString()
}

function formatDateTime(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatCompressionRatio(
  compressedValue: unknown,
  uncompressedValue: unknown
): string {
  const compressed = toFiniteNumber(compressedValue)
  const uncompressed = toFiniteNumber(uncompressedValue)

  if (compressed === null || uncompressed === null || compressed === 0) {
    return '—'
  }

  return `${(uncompressed / compressed).toFixed(1)}x`
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function StatCard({ label, value, icon, subline }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="break-words text-2xl font-semibold">{value}</div>
        {subline ? (
          <div className="mt-1 break-words text-sm text-muted-foreground">
            {subline}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function OverviewTab() {
  const hostId = useHostId()
  const { database, table } = useExplorerState()

  const summaryUrl =
    database && table
      ? `/api/v1/tables/explorer-table-overview?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null
  const usageUrl =
    database && table
      ? `/api/v1/tables/explorer-table-usage?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null

  const {
    data: summaryResponse,
    error: summaryError,
    isLoading: summaryLoading,
  } = useQuery<ApiResponse<OverviewRow[]>>({
    queryKey: [summaryUrl],
    queryFn: () => fetcher<OverviewRow[]>(summaryUrl!),
    enabled: Boolean(summaryUrl),
  })

  const {
    data: usageResponse,
    error: usageError,
    isLoading: usageLoading,
  } = useQuery<ApiResponse<UsageRow[]>>({
    queryKey: [usageUrl],
    queryFn: () => fetcher<UsageRow[]>(usageUrl!),
    enabled: Boolean(usageUrl),
  })

  if (!database || !table) {
    return null
  }

  if (summaryLoading) {
    return <OverviewSkeleton />
  }

  if (summaryError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-destructive">
            Failed to load overview: {getErrorMessage(summaryError)}
          </div>
        </CardContent>
      </Card>
    )
  }

  const summary = summaryResponse?.data?.[0]
  const usage = usageResponse?.data?.[0]
  const usageUnavailable =
    Boolean(usageError) ||
    usageResponse?.metadata?.unavailable === true ||
    (!usageLoading && !usage)
  const lastModified =
    summary?.last_modified || summary?.metadata_modification_time || null
  const usageValue =
    usageLoading || usageUnavailable || !usage
      ? '—'
      : `${formatNumber(usage.queries_24h)} (24h) / ${formatNumber(usage.queries_7d)} (7d)`

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Table size"
        value={formatBytes(summary?.total_bytes)}
        icon={<HardDrive className="size-4" />}
      />
      <StatCard
        label="Rows"
        value={formatNumber(summary?.total_rows)}
        icon={<Rows3Icon className="size-4" />}
      />
      <StatCard
        label="Engine"
        value={summary?.engine || '—'}
        icon={<Database className="size-4" />}
        subline={
          summary?.engine_full && summary.engine_full !== summary.engine ? (
            <code className="font-mono text-xs">{summary.engine_full}</code>
          ) : undefined
        }
      />
      <StatCard
        label="Index size"
        value={formatBytes(summary?.primary_key_bytes_in_memory)}
        icon={<Gauge className="size-4" />}
        subline={`/ ${formatBytes(summary?.primary_key_bytes_in_memory_allocated)} allocated`}
      />
      <StatCard
        label="Compression"
        value={formatCompressionRatio(
          summary?.compressed_bytes,
          summary?.uncompressed_bytes
        )}
        icon={<Activity className="size-4" />}
        subline={`compressed ${formatBytes(summary?.compressed_bytes)} · uncompressed ${formatBytes(summary?.uncompressed_bytes)}`}
      />
      <StatCard
        label="Active parts"
        value={formatNumber(summary?.active_parts)}
        icon={<Layers className="size-4" />}
      />
      <StatCard
        label="Partitions"
        value={formatNumber(summary?.partitions)}
        icon={<Layers className="size-4" />}
      />
      <StatCard
        label="Last modified"
        value={formatDateTime(lastModified)}
        icon={<Clock className="size-4" />}
      />
      <StatCard
        label="Usage"
        value={usageValue}
        icon={<Activity className="size-4" />}
        subline={
          usageLoading
            ? 'Loading usage...'
            : usageUnavailable
              ? 'Usage unavailable (system.query_log disabled)'
              : undefined
        }
      />
    </div>
  )
}
