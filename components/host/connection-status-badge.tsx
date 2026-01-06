'use client'

import { CheckCircle2Icon, CircleXIcon, LoaderIcon } from 'lucide-react'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useHostId } from '@/lib/swr'
import { useHostStatus } from '@/lib/swr/use-host-status'

type ConnectionStatus = 'loading' | 'connected' | 'error'

// Status config moved to module level to prevent recreation on every render
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
} as const

export const ConnectionStatusBadge = memo(function ConnectionStatusBadge() {
  const hostId = useHostId()
  const { data, error, isLoading } = useHostStatus(hostId, {
    refreshInterval: 30000,
  })

  // Determine connection status
  let status: ConnectionStatus = 'loading'
  if (isLoading) {
    status = 'loading'
  } else if (error || !data?.version) {
    status = 'error'
  } else {
    status = 'connected'
  }

  const config = statusConfig[status]

  const badgeClasses = {
    loading: 'gap-1.5',
    connected:
      'gap-1.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900',
    error: 'gap-1.5',
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={status === 'error' ? 'destructive' : 'outline'}
          className={badgeClasses[status]}
          aria-label={config.tooltip}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">{config.icon}</span>
          <span className="hidden sm:inline">{config.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom">{config.tooltip}</TooltipContent>
    </Tooltip>
  )
})
