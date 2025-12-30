'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo, Suspense, use } from 'react'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import { ClickHouseHostSelector } from '@/components/clickhouse-host-selector'

const TITLE_SHORT = process.env.NEXT_PUBLIC_TITLE_SHORT || 'ClickHouse'
const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || ''

/** API response format for chart data */
type ChartApiResponse = {
  success: boolean
  data?: Array<{ val: string }>
}

/**
 * Fetch host status (uptime, hostname, version) from API
 */
async function fetchHostStatus(hostId: number): Promise<{
  uptime: string
  hostName: string
  version: string
} | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // Fetch all three values in parallel
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
      hostnameRes.json() as Promise<ChartApiResponse>,
      versionRes.json() as Promise<ChartApiResponse>,
      uptimeRes.json() as Promise<ChartApiResponse>,
    ])

    // Extract values from API response format
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
        <Suspense
          fallback={
            <span className="inline-block h-4 w-24 animate-shimmer rounded bg-muted" />
          }
        >
          <HostSelectorWrapper
            hostsPromise={hostsPromise}
            currentHostId={Number(currentHostId)}
          />
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
  // Create actual promises that fetch host status from the API
  const configs = hosts.map((host) => ({
    ...host,
    promise: fetchHostStatus(host.id),
  }))
  return (
    <ClickHouseHostSelector currentHostId={currentHostId} configs={configs} />
  )
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
