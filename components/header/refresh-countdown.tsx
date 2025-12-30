'use client'

import { RefreshCw } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'usehooks-ts'

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

const SECOND = 1000
const MINUTE = 60 * SECOND

export const RefreshCountdown = memo(function RefreshCountdown() {
  const { reloadInterval, setReloadInterval } = useAppContext()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Countdown state
  const initCountDown = reloadInterval ? reloadInterval / 1000 : 30
  const [countDown, setCountDown] = useState(initCountDown)

  // Trigger SWR revalidation by dispatching a custom event
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    window.dispatchEvent(new CustomEvent('swr:revalidate'))
    setTimeout(() => setIsRefreshing(false), 1000)
    setCountDown(initCountDown)
  }, [initCountDown])

  // Update countdown when reload interval changes
  useEffect(() => {
    if (reloadInterval) {
      setCountDown(reloadInterval / 1000)
    }
  }, [reloadInterval])

  // Countdown interval
  useInterval(
    () => {
      if (countDown <= 0) {
        handleRefresh()
      } else {
        setCountDown(countDown - 1)
      }
    },
    !isRefreshing && reloadInterval != null ? 1000 : null
  )

  const handleSetReloadInterval = useCallback(
    (interval: number | null) => {
      setReloadInterval(interval)
      if (interval) {
        setCountDown(interval / 1000)
      }
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
          aria-label={`Auto refresh ${reloadInterval ? `in ${formatReadableSecondDuration(countDown)}` : 'disabled'}. Click to change.`}
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
            aria-hidden="true"
          />
          <span className="font-mono text-muted-foreground tabular-nums">
            {reloadInterval ? formatReadableSecondDuration(countDown) : 'Off'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleRefresh}>
          Refresh now
        </DropdownMenuItem>
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
