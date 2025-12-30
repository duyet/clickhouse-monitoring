'use client'

import { Bell, Moon, RefreshCw, Search, Sun } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'usehooks-ts'

import { useAppContext } from '@/app/context'
import { Input } from '@/components/ui/input'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { ConnectionStatusBadge } from '@/components/connection-status-badge'
import { CommandPalette } from '@/components/command-palette'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatReadableSecondDuration } from '@/lib/format-readable'
import { cn } from '@/lib/utils'

interface HeaderActionsProps {
  menuComponent?: React.ReactNode
}

const SECOND = 1000
const MINUTE = 60 * SECOND

export const HeaderActions = memo(function HeaderActions({ menuComponent }: HeaderActionsProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const { reloadInterval, setReloadInterval } = useAppContext()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Countdown state
  const initCountDown = reloadInterval ? reloadInterval / 1000 : 30
  const [countDown, setCountDown] = useState(initCountDown)

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }, [theme])

  // Trigger SWR revalidation by dispatching a custom event
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    // Dispatch custom event for SWR revalidation
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

  const handleSetReloadInterval = useCallback((interval: number | null) => {
    setReloadInterval(interval)
    if (interval) {
      setCountDown(interval / 1000)
    }
  }, [setReloadInterval])

  return (
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      {/* Refresh countdown - visible on all screens */}
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

      <CommandPalette />
      <ConnectionStatusBadge />

      {/* Search - hidden on mobile */}
      <div className="relative hidden md:block">
        <Search aria-hidden="true" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          type="search"
          id="global-search"
          placeholder="Search..."
          aria-label="Search pages and commands"
          aria-describedby="search-shortcut"
          className="h-8 w-40 bg-muted/30 pl-8 text-xs border-transparent focus-visible:ring-1 focus-visible:ring-primary/30 transition-all md:w-64"
        />
        <kbd id="search-shortcut" className="absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </div>

      {/* Theme toggle - hidden on mobile */}
      <IconButton
        tooltip={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        icon={theme === 'light' ? <Moon /> : <Sun />}
        onClick={toggleTheme}
        className="hidden sm:flex"
      />

      {/* Notifications - hidden on mobile */}
      <IconButton
        tooltip="Notifications"
        icon={<Bell />}
        className="hidden sm:flex"
      />
      {menuComponent}
    </div>
  )
})
