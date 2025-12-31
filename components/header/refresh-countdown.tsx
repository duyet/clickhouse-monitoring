'use client'

import { RefreshCw } from 'lucide-react'
import { memo, useCallback, useState } from 'react'

import { useAppContext } from '@/app/context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatReadableSecondDuration } from '@/lib/format-readable'
import { cn } from '@/lib/utils'
import { useRefreshTimer } from './hooks'

const SECOND = 1000
const MINUTE = 60 * SECOND

export const RefreshCountdown = memo(function RefreshCountdown() {
  const { reloadInterval, setReloadInterval } = useAppContext()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { remaining, reset } = useRefreshTimer({
    interval: reloadInterval ?? undefined,
    enabled: reloadInterval != null,
    onRefresh: () => {
      setIsRefreshing(true)
      window.dispatchEvent(new CustomEvent('swr:revalidate'))
      setTimeout(() => setIsRefreshing(false), 1000)
    },
  })

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    window.dispatchEvent(new CustomEvent('swr:revalidate'))
    setTimeout(() => {
      setIsRefreshing(false)
      reset()
    }, 1000)
  }, [reset])

  const handleSetReloadInterval = useCallback(
    (interval: number | null) => {
      setReloadInterval(interval)
    },
    [setReloadInterval]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 gap-1.5 px-2 text-xs font-normal',
            isRefreshing && 'animate-pulse'
          )}
          aria-label={`Auto refresh ${reloadInterval ? `in ${formatReadableSecondDuration(remaining)}` : 'disabled'}. Click to change.`}
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
            aria-hidden="true"
          />
          <span className="font-mono text-muted-foreground tabular-nums">
            {reloadInterval ? formatReadableSecondDuration(remaining) : 'Off'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleRefresh}>Refresh now</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSetReloadInterval(30 * SECOND)}>
          30 seconds
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetReloadInterval(1 * MINUTE)}>
          1 minute
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetReloadInterval(2 * MINUTE)}>
          2 minutes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetReloadInterval(5 * MINUTE)}>
          5 minutes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSetReloadInterval(null)}>
          Disable auto-refresh
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
