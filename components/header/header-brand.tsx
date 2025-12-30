'use client'

import { Suspense, memo, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { ClickHouseHostSelector } from '@/components/clickhouse-host-selector'
import type { HostInfo } from '@/app/api/v1/hosts/route'

const TITLE_SHORT = process.env.NEXT_PUBLIC_TITLE_SHORT || 'ClickHouse'
const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || ''

export const HeaderBrand = memo(function HeaderBrand({
  currentHostId,
  hostsPromise,
}: {
  currentHostId: string
  hostsPromise: Promise<Array<Omit<HostInfo, 'user'>>>
}) {
  return (
    <div className="flex items-center gap-4">
      {/* Logo - only render if configured */}
      {LOGO_URL && (
        <Link
          href="/overview"
          aria-label="Go to overview"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Image
            src={LOGO_URL}
            alt="Logo"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            unoptimized
          />
        </Link>
      )}

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
        <Suspense fallback={<span className="inline-block h-4 w-24 animate-shimmer rounded bg-muted" />}>
          <HostSelectorWrapper hostsPromise={hostsPromise} currentHostId={Number(currentHostId)} />
        </Suspense>
      </div>
    </div>
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
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-4 w-16 animate-shimmer rounded bg-muted" />
        <span className="text-muted-foreground/40">/</span>
        <span className="inline-block h-4 w-24 animate-shimmer rounded bg-muted" />
      </div>
    </div>
  )
})
