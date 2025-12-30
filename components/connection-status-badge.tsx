'use client'

import { CheckCircle2Icon, CircleXIcon, LoaderIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ErrorLogger } from '@/lib/error-logger'
import { useHostId } from '@/lib/swr'

type ConnectionStatus = 'loading' | 'connected' | 'error'

const statusConfig = {
  loading: {
    icon: <LoaderIcon className="size-3 animate-spin" />,
    label: 'Connecting...',
    tooltip: 'Checking connection to ClickHouse...',
  },
  connected: {
    icon: <CheckCircle2Icon className="size-3" />,
    label: 'Connected',
    tooltip: 'ClickHouse connection is healthy',
  },
  error: {
    icon: <CircleXIcon className="size-3" />,
    label: 'Disconnected',
    tooltip: 'Unable to connect to ClickHouse. Check your connection.',
  },
}

export function ConnectionStatusBadge() {
  const hostId = useHostId()
  const [status, setStatus] = useState<ConnectionStatus>('loading')

  useEffect(() => {
    // Reset when host changes
    setStatus('loading')

    // Simple health check - fetch a small query
    const checkConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(`/api/v1/charts/hostname?hostId=${hostId}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          setStatus('connected')
        } else {
          setStatus('error')
          ErrorLogger.logWarning(
            `Connection check failed for host ${hostId}: ${response.status} ${response.statusText}`,
            { component: 'ConnectionStatusBadge', hostId }
          )
        }
      } catch (err) {
        setStatus('error')
        // Log network errors for debugging
        ErrorLogger.logError(
          err instanceof Error ? err : new Error('Unknown connection error'),
          { component: 'ConnectionStatusBadge', hostId }
        )
      }
    }

    checkConnection()

    // Recheck every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [hostId])

  const config = statusConfig[status]

  const badgeClasses = {
    loading: 'gap-1.5',
    connected: 'gap-1.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900',
    error: 'gap-1.5',
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={status === 'error' ? 'destructive' : 'outline'}
          className={badgeClasses[status]}
          aria-label={config.tooltip}
        >
          {config.icon}
          <span className="hidden sm:inline">{config.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {config.tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
