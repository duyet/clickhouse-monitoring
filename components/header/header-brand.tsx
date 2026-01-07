'use client'

import type { HostInfo } from '@/app/api/v1/hosts/route'

import Link from 'next/link'
import { memo } from 'react'
import { ClickHouseHostSelector } from '@/components/host/clickhouse-host-selector'
import { ClickHouseLogo } from '@/components/icons/clickhouse-logo'

const TITLE_SHORT = process.env.NEXT_PUBLIC_TITLE_SHORT || 'ClickHouse'

export const HeaderBrand = memo(function HeaderBrand({
  currentHostId,
  hosts,
}: {
  currentHostId: string
  hosts: Array<Omit<HostInfo, 'user'>>
}) {
  return (
    <div className="flex items-center gap-4">
      {/* Logo */}
      <Link
        href="/overview"
        aria-label="Go to overview"
        className="flex items-center transition-opacity hover:opacity-80"
      >
        <ClickHouseLogo width={24} height={24} className="h-6 w-6 text-foreground dark:text-white" />
      </Link>

      {/* Title and Host Selector */}
      <div className="flex items-center gap-1.5 font-medium">
        <Link
          href="/overview"
          aria-label="Go to overview"
          className="text-muted-foreground transition-opacity hover:opacity-80"
        >
          {TITLE_SHORT}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <ClickHouseHostSelector
          currentHostId={Number(currentHostId)}
          hosts={hosts}
        />
      </div>
    </div>
  )
})

export const HeaderBrandSkeleton = memo(function HeaderBrandSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-4 w-16 animate-shimmer rounded bg-muted" />
        <span className="text-muted-foreground/40">/</span>
        <span className="inline-block h-4 w-24 animate-shimmer rounded bg-muted" />
      </div>
    </div>
  )
})
