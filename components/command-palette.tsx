'use client'

import { useRouter } from 'next/navigation'
import { memo, useCallback } from 'react'
import * as React from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { menuItemsConfig } from '@/menu'

export const CommandPalette = memo(function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navigate = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} aria-label="Command palette">
      <CommandInput placeholder="Type a command or search..." aria-label="Search commands" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {menuItemsConfig.map((group) => (
          <CommandGroup key={group.title} heading={group.title}>
            {group.items ? (
              group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => navigate(item.href)}
                  value={`${group.title} ${item.title}`}
                >
                  {item.description && (
                    <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                      {item.description}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs">{item.title}</span>
                </CommandItem>
              ))
            ) : (
              <CommandItem
                key={group.href}
                onSelect={() => navigate(group.href)}
                value={group.title}
              >
                <span>{group.title}</span>
              </CommandItem>
            )}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
})
