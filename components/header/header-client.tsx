'use client'

import { menuItemsConfig } from '@/menu'

import { useSearchParams } from 'next/navigation'
import { memo, Suspense } from 'react'
import { HeaderActions } from '@/components/header/header-actions'
import {
  HeaderBrand,
  HeaderBrandSkeleton,
} from '@/components/header/header-brand'
import { MenuNavigationStyle } from '@/components/menu/menu-navigation-style'
import { useHosts } from '@/lib/swr/use-hosts'

export const HeaderClient = memo(function HeaderClient() {
  const searchParams = useSearchParams()
  const hostId = searchParams.get('host') || '0'
  const { hosts } = useHosts()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      {/* Branding Row */}
      <div className="flex h-12 items-center justify-between px-4 md:px-6 lg:px-8">
        <Suspense fallback={<HeaderBrandSkeleton />}>
          <HeaderBrand currentHostId={hostId} hosts={hosts} />
        </Suspense>
        <HeaderActions />
      </div>

      {/* Navigation Row - centered menu */}
      <nav className="flex h-10 items-center justify-center border-t">
        <MenuNavigationStyle
          items={menuItemsConfig}
          className="flex items-center gap-1"
        />
      </nav>
    </header>
  )
})
