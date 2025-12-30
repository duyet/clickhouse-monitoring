'use client'

import { Bell, Moon, Search, Sun } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { IconButton } from '@/components/ui/icon-button'
import { ConnectionStatusBadge } from '@/components/connection-status-badge'
import { CommandPalette } from '@/components/command-palette'

interface HeaderActionsProps {
  menuComponent?: React.ReactNode
}

export function HeaderActions({ menuComponent }: HeaderActionsProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      <CommandPalette />
      <ConnectionStatusBadge />
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          type="search"
          placeholder="Search..."
          className="h-8 w-40 bg-muted/30 pl-8 text-xs border-transparent focus-visible:ring-1 focus-visible:ring-primary/30 transition-all md:w-64"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </div>
      <IconButton
        tooltip={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        icon={theme === 'light' ? <Moon /> : <Sun />}
        onClick={toggleTheme}
      />
      <IconButton
        tooltip="Notifications"
        icon={<Bell />}
      />
      {menuComponent}
    </div>
  )
}
