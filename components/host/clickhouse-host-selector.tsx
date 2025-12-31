'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { memo, useCallback } from 'react'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHostStatus } from '@/lib/swr/use-host-status'
import { buildUrl } from '@/lib/url/url-builder'
import { getHost } from '@/lib/utils'
import { StatusIndicator } from './shared'

type ClickHouseHostSelectorProps = {
  currentHostId: number
  hosts: Array<Omit<HostInfo, 'user'>>
}

/**
 * Host selector component for static routing with query parameters.
 * Handles host switching by updating the `host` query parameter.
 * Status indicators are shown in the dropdown for each host.
 */
export function ClickHouseHostSelector({
  currentHostId = 0,
  hosts,
}: ClickHouseHostSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleValueChange = useCallback(
    (val: string) => {
      const hostId = parseInt(val, 10)
      if (!Number.isNaN(hostId) && hostId >= 0) {
        const url = buildUrl(pathname, { host: hostId }, searchParams)
        router.push(url)
      }
    },
    [searchParams, pathname, router]
  )

  const current = hosts[currentHostId]

  if (!current) {
    return null
  }

  return (
    <Select value={current.id.toString()} onValueChange={handleValueChange}>
      <SelectTrigger
        className="w-auto border-0 p-1 shadow-none focus:ring-0"
        data-testid="host-selector"
        aria-label={`Select ClickHouse host. Current host: ${current.name || getHost(current.host)}`}
      >
        <SelectValue
          placeholder={current.name || getHost(current.host)}
          className="mr-2 w-fit truncate"
        />
      </SelectTrigger>
      <SelectContent data-testid="host-options">
        {hosts.map((host) => (
          <SelectItem
            key={host.host + host.id}
            value={host.id.toString()}
            data-testid={`host-option-${host.id}`}
          >
            <HostStatusIndicator
              hostId={host.id}
              hostName={host.name || getHost(host.host)}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Host status indicator component using SWR for data fetching.
 * Displays online/offline status with tooltip showing host details.
 */
const HostStatusIndicator = memo(function HostStatusIndicator({
  hostId,
  hostName,
}: {
  hostId: number
  hostName: string
}) {
  const { data, isOnline, isLoading } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span>{hostName}</span>
        <StatusIndicator
          title={['Loading...']}
          className="bg-gray-400 animate-pulse"
        />
      </div>
    )
  }

  if (isOnline && data) {
    return (
      <div className="flex items-center gap-2">
        <span>{hostName}</span>
        <StatusIndicator
          className="bg-sky-500"
          title={[
            `Host: ${data.hostname}`,
            `Online: ${data.uptime}`,
            `Version: ${data.version}`,
          ]}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span>{hostName}</span>
      <StatusIndicator title={['The host is offline']} />
    </div>
  )
})

