/**
 * Registry-backed command palette.
 *
 * This component renders commands sourced from the `commandRegistry` singleton
 * (see `lib/command-palette/command-registry.ts`). It is a complement to the
 * menu-driven palette in `components/controls/command-palette.tsx` — use this
 * when you need programmatically-registered commands (e.g. dynamic host entries
 * or feature-specific actions) rather than the static menu tree.
 *
 * Wire-up: mount once at a layout level, alongside `registerNavCommands()`:
 *
 * ```tsx
 * import { RegistryCommandPalette } from '@/components/command-palette/command-palette'
 * import { registerNavCommands } from '@/lib/command-palette/nav-commands'
 *
 * useEffect(() => { registerNavCommands() }, [])
 * return <RegistryCommandPalette />
 * ```
 */

import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import type { PaletteCommand } from '@/lib/command-palette/command-registry'
import { commandRegistry } from '@/lib/command-palette/command-registry'
import { useCommandPalette } from './use-command-palette'

interface RegistryCommandPaletteProps {
  /** Override open state for controlled usage. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const GROUP_LABELS: Record<PaletteCommand['group'], string> = {
  navigation: 'Navigation',
  host: 'Hosts',
  action: 'Actions',
}

/**
 * Command palette backed by the `commandRegistry`. Supports Cmd/Ctrl+K when
 * used as an uncontrolled component via `useCommandPalette`.
 */
export function RegistryCommandPalette({
  open: controlledOpen,
  onOpenChange,
}: RegistryCommandPaletteProps = {}) {
  const { open: hookOpen, setOpen: hookSetOpen } = useCommandPalette()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const open = controlledOpen ?? hookOpen
  const setOpen = onOpenChange ?? hookSetOpen

  const results = commandRegistry.search(query)

  const grouped = results.reduce<Record<string, PaletteCommand[]>>(
    (acc, cmd) => {
      const g = cmd.group
      if (!acc[g]) acc[g] = []
      acc[g].push(cmd)
      return acc
    },
    {}
  )

  const handleSelect = (cmd: PaletteCommand) => {
    setOpen(false)
    setQuery('')
    if (cmd.action) {
      cmd.action()
    } else if (cmd.href) {
      const queryIndex = cmd.href.indexOf('?')
      if (queryIndex === -1) {
        navigate({ to: cmd.href })
      } else {
        const to = cmd.href.slice(0, queryIndex)
        const search = Object.fromEntries(
          new URLSearchParams(cmd.href.slice(queryIndex + 1))
        )
        navigate({ to, search })
      }
    }
  }

  // Sync local query when palette closes.
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const groups = Object.entries(grouped) as [
    PaletteCommand['group'],
    PaletteCommand[],
  ][]

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setQuery('')
      }}
      title="Command palette"
      description="Search for pages and actions"
      showCloseButton={false}
      aria-label="Command palette"
      className="sm:max-w-xl"
    >
      <CommandInput
        placeholder="Search pages and actions…"
        value={query}
        onValueChange={setQuery}
        aria-label="Search commands"
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map(([group, cmds], idx) => (
          <span key={group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={GROUP_LABELS[group]}>
              {cmds.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={[cmd.label, ...(cmd.keywords ?? [])].join(' ')}
                  onSelect={() => handleSelect(cmd)}
                >
                  <span>{cmd.label}</span>
                  {cmd.href && (
                    <span className="ml-auto truncate pl-4 text-[11px] text-muted-foreground">
                      {cmd.href}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </span>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
