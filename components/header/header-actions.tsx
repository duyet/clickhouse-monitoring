'use client'

import { Bell, Moon, RefreshCw, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { memo, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'usehooks-ts'

import { useAppContext } from '@/app/context'
import { CommandPalette } from '@/components/command-palette'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { formatReadableSecondDuration } from '@/lib/format-readable'
import { cn } from '@/lib/utils'

interface HeaderActionsProps {
  menuComponent?: React.ReactNode
}

const SECOND = 1000
const MINUTE = 60 * SECOND

export const HeaderActions = memo(function HeaderActions({
  menuComponent,
}: HeaderActionsProps) {
  const { theme: _theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { reloadInterval, setReloadInterval } = useAppContext()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Countdown state
  const initCountDown = reloadInterval ? reloadInterval / 1000 : 30
  const [countDown, setCountDown] = useState(initCountDown)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [setTheme, resolvedTheme])

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
          <DropdownMenuItem
            onClick={() => handleSetReloadInterval(30 * SECOND)}
          >
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

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      {/* Search trigger - hidden on mobile */}
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="relative hidden h-8 w-40 items-center gap-2 rounded-md border border-transparent bg-muted/30 px-2.5 text-xs transition-all hover:bg-muted/50 hover:ring-1 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 md:inline-flex md:w-64"
        aria-label="Search pages and commands"
        aria-describedby="search-shortcut"
      >
        <Search
          aria-hidden="true"
          className="h-3.5 w-3.5 text-muted-foreground/60"
        />
        <span className="text-muted-foreground/60">Search...</span>
        <kbd
          id="search-shortcut"
          className="ml-auto rounded border bg-muted px-1.5 text-[10px] font-medium"
        >
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle - hidden on mobile */}
      {mounted ? (
        <IconButton
          tooltip={
            resolvedTheme === 'light'
              ? 'Switch to dark mode'
              : 'Switch to light mode'
          }
          icon={resolvedTheme === 'light' ? <Moon /> : <Sun />}
          onClick={toggleTheme}
          className="hidden sm:flex"
        />
      ) : (
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Sun className="h-4 w-4" />
        </Button>
      )}

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
