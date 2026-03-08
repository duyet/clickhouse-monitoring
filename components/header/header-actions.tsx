'use client'

import { Moon, Sun } from 'lucide-react'

import { useTheme } from 'next-themes'
import { memo, useEffect, useState } from 'react'
import { CommandPalette } from '@/components/controls/command-palette'
import { RefreshCountdown } from '@/components/header/refresh-countdown'
import { GlobalTimeRangePicker } from '@/components/header/time-range-picker'
import { NotificationsPopover } from '@/components/notifications/notifications-popover'
import { SettingsDialog } from '@/components/settings'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'

interface HeaderActionsProps {
  menuComponent?: React.ReactNode
}

export const HeaderActions = memo(function HeaderActions({
  menuComponent,
}: HeaderActionsProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Handle hydration - set mounted state after client-side render
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      <GlobalTimeRangePicker />

      <RefreshCountdown />

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Theme toggle - visible on all viewports */}
      {mounted ? (
        <IconButton
          tooltip={
            resolvedTheme === 'light'
              ? 'Switch to dark mode'
              : 'Switch to light mode'
          }
          icon={resolvedTheme === 'light' ? <Moon /> : <Sun />}
          onClick={toggleTheme}
          className="flex"
          suppressHydrationWarning
        />
      ) : (
        <Button variant="ghost" size="icon" className="flex">
          <Sun className="h-4 w-4" />
        </Button>
      )}

      {/* Notifications - hidden on mobile */}
      <NotificationsPopover />
      {menuComponent}

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div />
      </SettingsDialog>
    </div>
  )
})
