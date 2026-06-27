import { Check, ChevronsUpDown } from 'lucide-react'

import type { ReactNode } from 'react'

import { usePathname } from 'fumadocs-core/framework'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover'
import { useState } from 'react'
import { docsSections, docsVersion, docsVersions } from '@/lib/shared'

// Matches Fumadocs' SidebarTabsDropdown trigger styling so the two dropdowns
// look visually consistent with each other and with the rest of the sidebar.
const triggerCls =
  'flex w-full items-center gap-2 rounded-lg p-2 border bg-fd-secondary/50 text-start text-fd-secondary-foreground transition-colors hover:bg-fd-accent data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground'

interface DropdownItem {
  label: string
  href: string
  active?: boolean
}

// Generic full-width sidebar dropdown: a labelled trigger over a list of links,
// a check on the active item, and an optional footer (e.g. "All releases →").
function SidebarDropdown({
  label,
  ariaLabel,
  items,
  footer,
}: {
  label: string
  ariaLabel?: string
  items: DropdownItem[]
  footer?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerCls} aria-label={ariaLabel}>
        <span className="flex-1 text-sm font-medium">{label}</span>
        <ChevronsUpDown className="ms-auto size-4 shrink-0 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex flex-col gap-1 p-1 w-(--radix-popover-trigger-width)"
      >
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            <span className="flex-1">{item.label}</span>
            {item.active ? (
              <Check className="size-3.5 text-fd-primary" />
            ) : null}
          </a>
        ))}
        {footer}
      </PopoverContent>
    </Popover>
  )
}

// Two stacked sidebar navigation dropdowns:
//   1. Version dropdown (top) — switches between published docs versions
//   2. Section dropdown (below) — Guide / Deploy & Operate / Reference
//
// Passed as `sidebar.banner` in DocsLayout. tabMode must NOT be "auto" so
// Fumadocs does not also render its own section dropdown below the banner.
export function SidebarNavHeader() {
  const pathname = usePathname()
  // Only three non-overlapping top-level prefixes, so a plain find suffices.
  const activeSection =
    docsSections.find((s) => pathname.startsWith(s.url)) ?? docsSections[0]

  return (
    <div className="flex flex-col gap-2">
      <SidebarDropdown
        label={docsVersion}
        ariaLabel={`Switch documentation version (current: ${docsVersion})`}
        items={docsVersions.map((v) => ({
          label: v.label,
          href: v.href,
          active: v.current,
        }))}
        footer={
          <a
            href="/reference/releases"
            className="mt-1 border-t pt-1.5 px-1.5 py-1 text-xs text-fd-muted-foreground hover:text-fd-accent-foreground"
          >
            All releases →
          </a>
        }
      />
      <SidebarDropdown
        label={activeSection.title}
        items={docsSections.map((s) => ({
          label: s.title,
          href: s.url,
          active: s.url === activeSection.url,
        }))}
      />
    </div>
  )
}
