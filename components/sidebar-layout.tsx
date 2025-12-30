'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb } from '@/components/breadcrumb'
import { HeaderActions } from '@/components/header/header-actions'
import { ErrorLogger } from '@/lib/error-logger'
import { Skeleton } from '@/components/ui/skeleton'
import type { HostInfo } from '@/app/api/v1/hosts/route'

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

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const searchParams = useSearchParams()
  const hostId = Number(searchParams.get('host') || '0')
  const hostsPromise = fetchHosts()

  return (
    <SidebarProvider>
      <AppSidebar hostsPromise={hostsPromise} currentHostId={hostId} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
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
