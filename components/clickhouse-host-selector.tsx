'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, use } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import { cn, getHost } from '@/lib/utils'

type UptimePromise = Promise<{
  uptime: string
  hostName: string
  version: string
} | null>

type ClickHouseHostSelectorProps = {
  currentHostId: number
  configs: Array<
    Omit<HostInfo, 'user'> & {
      promise: UptimePromise
    }
  >
}

/**
 * Host selector component for static routing with query parameters.
 * Handles host switching by updating the `host` query parameter.
 */
export function ClickHouseHostSelector({
  currentHostId = 0,
  configs,
}: ClickHouseHostSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = configs[currentHostId]
  if (!current) {
    return null
  }

  const handleValueChange = (val: string) => {
    const hostId = parseInt(val, 10)
    if (!Number.isNaN(hostId) && hostId >= 0) {
      // Update the host query parameter
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set('host', hostId.toString())
      router.push(`${pathname}?${newParams.toString()}`)
    }
  }

  return (
    <div>
      <Select
        value={current.id.toString()}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          className="w-auto border-0 p-1 shadow-none focus:ring-0"
          data-testid="host-selector"
        >
          <SelectValue
            placeholder={current.name || getHost(current.host)}
            className="mr-2 w-fit truncate"
          />
        </SelectTrigger>
        <SelectContent data-testid="host-options">
          {configs.map((config) => (
            <SelectItem
              key={config.host + config.id}
              value={config.id.toString()}
              data-testid={`host-option-${config.id}`}
            >
              <div className="flex items-center gap-2">
                <span>{config.name || getHost(config.host)}</span>
                <Suspense
                  fallback={
                    <StatusIndicator title={['']} className="bg-gray-500" />
                  }
                >
                  <HostStatus promise={config.promise} />
                </Suspense>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function HostStatus({ promise }: { promise: UptimePromise }) {
  const res = use(promise)

  const isOnline = res != null
  if (isOnline) {
    return (
      <StatusIndicator
        className="bg-sky-500"
        title={[
          `Host: ${res.hostName}`,
          `Online: ${res.uptime}`,
          `Version: ${res.version}`,
        ]}
      />
    )
  }

  return <StatusIndicator title={[`The host is offline`]} />
}

const StatusIndicator = ({
  title,
  className,
}: {
  title: string[]
  className?: string
}) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative flex size-2 cursor-pointer">
          <span
            className={cn(
              'absolute inline-flex size-full rounded-full bg-red-400',
              className
            )}
          ></span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {title.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)
