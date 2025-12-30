'use client'

import { Activity } from 'lucide-react'
import { Suspense, memo, use } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

import { ClickHouseHostSelector } from '@/components/clickhouse-host-selector'
import type { HostInfo } from '@/app/api/v1/hosts/route'

const TITLE_SHORT = process.env.NEXT_PUBLIC_TITLE_SHORT || 'CH'

async function fetchHosts(): Promise<Array<Omit<HostInfo, 'user'>>> {
  try {
    const response = await fetch('/api/v1/hosts')
    if (!response.ok) return []
    const result = await response.json() as { success: boolean; data?: HostInfo[] }
    return result.success && result.data ? result.data : []
  } catch {
    return []
  }
}

export const HeaderBrand = memo(function HeaderBrand({
  currentHostId,
  hostsPromise,
}: {
  currentHostId: string
  hostsPromise: Promise<Array<Omit<HostInfo, 'user'>>>
}) {

  return (
    <Link
      href="/overview"
      aria-label="Go to overview"
      className="flex items-center gap-4 transition-opacity hover:opacity-80"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
        <Activity className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className="text-muted-foreground">{TITLE_SHORT}</span>
        <span className="text-muted-foreground/40">/</span>
        <Suspense fallback={<span className="inline-block h-4 w-24 animate-shimmer rounded bg-muted" />}>
          <HostSelectorWrapper hostsPromise={hostsPromise} currentHostId={Number(currentHostId)} />
        </Suspense>
        <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
      </div>
    </Link>
  )
})

function HostSelectorWrapper({
  hostsPromise,
  currentHostId,
}: {
  hostsPromise: Promise<Array<Omit<HostInfo, 'user'>>>
  currentHostId: number
}) {
  const hosts = use(hostsPromise)
  const configs = hosts.map((host) => ({
    ...host,
    promise: Promise.resolve(null),
  }))
  return <ClickHouseHostSelector currentHostId={currentHostId} configs={configs} />
}

export const HeaderBrandSkeleton = memo(function HeaderBrandSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-6 w-6 animate-shimmer items-center justify-center rounded bg-muted" />
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-4 w-8 animate-shimmer rounded bg-muted" />
        <span className="text-muted-foreground/40">/</span>
        <span className="inline-block h-4 w-24 animate-shimmer rounded bg-muted" />
      </div>
    </div>
  )
})
