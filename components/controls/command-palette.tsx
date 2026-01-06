'use client'

import { menuItemsConfig } from '@/menu'

import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { memo, useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { buildUrl } from '@/lib/url/url-builder'

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const CommandPalette = memo(function CommandPalette({
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [internalOpen, setInternalOpen] = React.useState(false)

  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setOpen(!open)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      const hostId = searchParams.get('host') || '0'
      const url = buildUrl(href, { host: hostId })
      router.push(url)
    },
    [router, setOpen, searchParams]
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      aria-label="Command palette"
    >
      <CommandInput
        placeholder="Type a command or search..."
        aria-label="Search commands"
      />
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
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
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
                {group.icon && <group.icon className="mr-2 h-4 w-4" />}
                <span>{group.title}</span>
              </CommandItem>
            )}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
})
