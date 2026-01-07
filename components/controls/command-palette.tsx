'use client'

import { Search, Settings } from 'lucide-react'
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
  CommandSeparator,
} from '@/components/ui/command'
import { IconButton } from '@/components/ui/icon-button'
import { buildUrl } from '@/lib/url/url-builder'

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onOpenSettings?: () => void
}

export const CommandPalette = memo(function CommandPalette({
  open: controlledOpen,
  onOpenChange,
  onOpenSettings,
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

  const handleOpenSettings = useCallback(() => {
    setOpen(false)
    onOpenSettings?.()
  }, [setOpen, onOpenSettings])

  return (
    <>
      {/* Search icon button for small screens */}
      <IconButton
        icon={<Search className="h-4 w-4" />}
        onClick={() => setOpen(true)}
        tooltip="Search"
        className="md:hidden"
      />

      {/* Search trigger - hidden on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative hidden h-8 w-30 items-center gap-2 rounded-md border bg-muted/30 px-2.5 text-xs transition-all hover:bg-muted/50 hover:ring-1 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 md:inline-flex md:w-40"
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
                    <span className="ml-auto shrink-0 text-xs">
                      {item.title}
                    </span>
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

          {onOpenSettings && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                <CommandItem onSelect={handleOpenSettings} value="Settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    ⌘,
                  </span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
})
