'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, memo, use, useState, useEffect } from 'react'
import { CheckCircle2Icon, CircleXIcon, LoaderIcon } from 'lucide-react'

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

type ConnectionStatus = 'loading' | 'connected' | 'error'

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
 * Includes connection status indicator.
 */
export function ClickHouseHostSelector({
  currentHostId = 0,
  configs,
}: ClickHouseHostSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('loading')

  const current = configs[currentHostId]

  // Check connection status for current host
  useEffect(() => {
    if (!current) return

    const checkConnection = async () => {
      try {
        setConnectionStatus('loading')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`/api/v1/charts/hostname?hostId=${currentHostId}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setConnectionStatus(response.ok ? 'connected' : 'error')
      } catch {
        setConnectionStatus('error')
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [currentHostId, current])

  if (!current) {
    return null
  }

  const handleValueChange = useCallback((val: string) => {
    const hostId = parseInt(val, 10)
    if (!Number.isNaN(hostId) && hostId >= 0) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set('host', hostId.toString())
      router.push(`${pathname}?${newParams.toString()}`)
    }
  }, [searchParams, pathname, router])

  return (
    <div className="flex items-center gap-1.5">
      {/* Connection status indicator */}
      <ConnectionStatusIcon status={connectionStatus} />

      <Select
        value={current.id.toString()}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          className="w-auto border-0 p-1 shadow-none focus:ring-0"
          data-testid="host-selector"
          aria-label={`Select ClickHouse host. Current host: ${current.name || getHost(current.host)}. Status: ${connectionStatus}`}
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
                    <StatusIndicator title={['Loading...']} className="bg-gray-400 animate-pulse" />
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

/**
 * Connection status icon displayed next to host selector
 */
const ConnectionStatusIcon = memo(function ConnectionStatusIcon({
  status,
}: {
  status: ConnectionStatus
}) {
  const config = {
    loading: {
      icon: <LoaderIcon className="size-3.5 animate-spin text-muted-foreground" />,
      tooltip: 'Checking connection...',
    },
    connected: {
      icon: <CheckCircle2Icon className="size-3.5 text-green-500" />,
      tooltip: 'Connected to ClickHouse',
    },
    error: {
      icon: <CircleXIcon className="size-3.5 text-destructive" />,
      tooltip: 'Connection failed',
    },
  }

  const { icon, tooltip } = config[status]

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="flex items-center"
            role="status"
            aria-label={tooltip}
          >
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

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

const StatusIndicator = memo(function StatusIndicator({
  title,
  className,
}: {
  title: string[]
  className?: string
}) {
  const isOnline = className !== undefined
  const statusText = isOnline ? 'Online' : 'Offline'

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="relative flex size-2 cursor-pointer"
            role="status"
            aria-label={statusText}
          >
            <span
              className={cn(
                'absolute inline-flex size-full rounded-full',
                !className && 'bg-red-400', // Only red if no className provided (offline)
                className
              )}
              aria-hidden="true"
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
})
