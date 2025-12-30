'use client'

import { Bell, Moon, Search, Sun } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HeaderActionsProps {
  menuComponent?: React.ReactNode
}

export function HeaderActions({ menuComponent }: HeaderActionsProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          type="search"
          placeholder="Search..."
          className="h-8 w-40 bg-muted/30 pl-8 text-xs border-transparent focus-visible:ring-1 focus-visible:ring-primary/30 transition-all md:w-64"
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setSearchOpen(false)}
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 text-[10px] font-medium">
          K
        </kbd>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleTheme}>
        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
        <Bell className="h-4 w-4" />
      </Button>
      {menuComponent}
    </div>
  )
}
