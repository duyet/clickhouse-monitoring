'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb } from '@/components/breadcrumb'
import { HeaderActions } from '@/components/header/header-actions'
import { ClickHouseHostSelector } from '@/components/clickhouse-host-selector'
import { ErrorLogger } from '@/lib/error-logger'
import { Skeleton } from '@/components/ui/skeleton'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import { use } from 'react'

async function fetchHosts(): Promise<Array<Omit<HostInfo, 'user'>>> {
  try {
    const response = await fetch('/api/v1/hosts')
    if (!response.ok) {
      ErrorLogger.logWarning(
        `Failed to fetch hosts: ${response.status} ${response.statusText}`,
        { component: 'SidebarLayout' }
      )
      return []
    }
    const result = (await response.json()) as {
      success: boolean
      data?: HostInfo[]
    }
    return result.success && result.data ? result.data : []
  } catch (err) {
    ErrorLogger.logError(
      err instanceof Error ? err : new Error('Failed to fetch hosts'),
      { component: 'SidebarLayout' }
    )
    return []
  }
}

async function fetchHostStatus(hostId: number): Promise<{
  uptime: string
  hostName: string
  version: string
} | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const [hostnameRes, versionRes, uptimeRes] = await Promise.all([
      fetch(`/api/v1/charts/hostname?hostId=${hostId}`, {
        signal: controller.signal,
      }),
      fetch(`/api/v1/charts/version?hostId=${hostId}`, {
        signal: controller.signal,
      }),
      fetch(`/api/v1/charts/uptime-readable?hostId=${hostId}`, {
        signal: controller.signal,
      }),
    ])

    clearTimeout(timeoutId)

    if (!hostnameRes.ok || !versionRes.ok || !uptimeRes.ok) {
      return null
    }

    const [hostnameData, versionData, uptimeData] = await Promise.all([
      hostnameRes.json() as Promise<{ success: boolean; data?: Array<{ val: string }> }>,
      versionRes.json() as Promise<{ success: boolean; data?: Array<{ val: string }> }>,
      uptimeRes.json() as Promise<{ success: boolean; data?: Array<{ val: string }> }>,
    ])

    const hostName = hostnameData?.data?.[0]?.val ?? ''
    const version = versionData?.data?.[0]?.val ?? ''
    const uptime = uptimeData?.data?.[0]?.val ?? ''

    if (!hostName && !version && !uptime) {
      return null
    }

    return { hostName, version, uptime }
  } catch {
    return null
  }
}

interface SidebarLayoutProps {
  children: React.ReactNode
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
    promise: fetchHostStatus(host.id),
  }))

  return (
    <ClickHouseHostSelector
      currentHostId={currentHostId}
      configs={configs}
    />
  )
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const searchParams = useSearchParams()
  const hostId = Number(searchParams.get('host') || '0')
  const hostsPromise = fetchHosts()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Suspense fallback={<Skeleton className="h-8 w-24 rounded" />}>
            <HostSelectorWrapper
              hostsPromise={hostsPromise}
              currentHostId={hostId}
            />
          </Suspense>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Suspense fallback={<Skeleton className="h-4 w-32" />}>
            <Breadcrumb />
          </Suspense>
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
