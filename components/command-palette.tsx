'use client'

import { useRouter } from 'next/navigation'
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

export function CommandPalette() {
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

  const navigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
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
                    <span className="text-muted-foreground text-xs">
                      {item.description}
                    </span>
                  )}
                  <span className="ml-auto text-xs">{item.title}</span>
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
}
