'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { HeaderBrand, HeaderBrandSkeleton } from '@/components/header/header-brand'
import { HeaderActions } from '@/components/header/header-actions'
import { MenuNavigationStyle } from '@/components/menu/menu-navigation-style'
import { ErrorLogger } from '@/lib/error-logger'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import { menuItemsConfig } from '@/menu'

async function fetchHosts(): Promise<Array<Omit<HostInfo, 'user'>>> {
  try {
    const response = await fetch('/api/v1/hosts')
    if (!response.ok) {
      ErrorLogger.logWarning(`Failed to fetch hosts: ${response.status} ${response.statusText}`, {
        component: 'HeaderClient',
      })
      return []
    }
    const result = (await response.json()) as { success: boolean; data?: HostInfo[] }
    return result.success && result.data ? result.data : []
  } catch (err) {
    ErrorLogger.logError(
      err instanceof Error ? err : new Error('Failed to fetch hosts'),
      { component: 'HeaderClient' }
    )
    return []
  }
}

export function HeaderClient() {
  const searchParams = useSearchParams()
  const hostId = searchParams.get('host') || '0'
  const hostsPromise = fetchHosts()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      {/* Branding Row */}
      <div className="flex h-12 items-center justify-between px-4 md:px-6 lg:px-8">
        <Suspense fallback={<HeaderBrandSkeleton />}>
          <HeaderBrand currentHostId={hostId} hostsPromise={hostsPromise} />
        </Suspense>
        <HeaderActions />
      </div>

      {/* Navigation Row - no overflow clipping to allow dropdown menus */}
      <nav className="flex h-10 items-center border-t px-4 md:px-6 lg:px-8">
        <MenuNavigationStyle items={menuItemsConfig} className="flex items-center gap-1" />
      </nav>
    </header>
  )
}
