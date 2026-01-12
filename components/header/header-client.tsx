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
import { useAuth } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Link } from 'next/link'
import { Icons } from '@/components/ui/icons'

export const HeaderClient = memo(function HeaderClient() {
  const searchParams = useSearchParams()
  const hostId = searchParams.get('host') || '0'
  const { hosts } = useHosts()
  const { session, signOut, isLoading } = useAuth()

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b">
        <div className="h-12 animate-pulse bg-gray-100" />
      </header>
    )
  }

  if (!session) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center justify-between px-4 md:px-6 lg:px-8">
          <Link href="/overview" className="flex items-center space-x-2">
            <Icons.database className="h-6 w-6" />
            <span className="font-bold">ClickHouse Monitor</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      {/* Branding Row */}
      <div className="flex h-12 items-center justify-between px-4 md:px-6 lg:px-8">
        <Suspense fallback={<HeaderBrandSkeleton />}>
          <HeaderBrand currentHostId={hostId} hosts={hosts} />
        </Suspense>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {session.user?.name || session.user?.email}
            </span>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user?.name || 'User'}
                className="h-8 w-8 rounded-full"
              />
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <Icons.logOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
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
