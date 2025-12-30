'use client'

import { Activity } from 'lucide-react'
import { Suspense, use } from 'react'
import { ChevronDown } from 'lucide-react'

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

export function HeaderBrand({
  currentHostId,
  hostsPromise,
}: {
  currentHostId: string
  hostsPromise: Promise<Array<Omit<HostInfo, 'user'>>>
}) {

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
        <Activity className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className="text-muted-foreground">{TITLE_SHORT}</span>
        <span className="text-muted-foreground/40">/</span>
        <Suspense fallback={<span className="text-xs text-muted-foreground">Loading...</span>}>
          <HostSelectorWrapper hostsPromise={hostsPromise} currentHostId={Number(currentHostId)} />
        </Suspense>
        <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
      </div>
    </div>
  )
}

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
