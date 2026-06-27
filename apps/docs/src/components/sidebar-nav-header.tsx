import { Check, ChevronsUpDown } from 'lucide-react'

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

// Version dropdown (sidebar variant). Full-width, matches section dropdown style.
// Drives from docsVersions in lib/shared — add a new entry there when cutting a
// new version; no changes needed here.
function SidebarVersionDropdown() {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={triggerCls}
        aria-label={`Switch documentation version (current: ${docsVersion})`}
      >
        <span className="flex-1 text-sm font-medium">{docsVersion}</span>
        <ChevronsUpDown className="ms-auto size-4 shrink-0 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex flex-col gap-1 p-1 w-(--radix-popover-trigger-width)"
      >
        {docsVersions.map((v) => (
          <a
            key={v.label}
            href={v.href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            <span className="flex-1">{v.label}</span>
            {v.current ? <Check className="size-3.5 text-fd-primary" /> : null}
          </a>
        ))}
        <a
          href="/reference/releases"
          onClick={() => setOpen(false)}
          className="mt-1 border-t pt-1.5 px-1.5 py-1 text-xs text-fd-muted-foreground hover:text-fd-accent-foreground"
        >
          All releases →
        </a>
      </PopoverContent>
    </Popover>
  )
}

// Section dropdown. Reads the current pathname to highlight the active section.
// Replaces Fumadocs' built-in SidebarTabsDropdown (tabMode="auto") so that the
// version can appear above it in the sidebar.
function SidebarSectionDropdown() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // Find the most-specific matching prefix (longest wins).
  const active =
    [...docsSections]
      .sort((a, b) => b.prefix.length - a.prefix.length)
      .find((s) => pathname.startsWith(s.prefix)) ?? docsSections[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerCls}>
        <span className="flex-1 text-sm font-medium">{active.title}</span>
        <ChevronsUpDown className="ms-auto size-4 shrink-0 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex flex-col gap-1 p-1 w-(--radix-popover-trigger-width)"
      >
        {docsSections.map((section) => {
          const isActive = section.prefix === active.prefix
          return (
            <a
              key={section.url}
              href={section.url}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <span className="flex-1">{section.title}</span>
              {isActive ? <Check className="size-3.5 text-fd-primary" /> : null}
            </a>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

// Two stacked sidebar navigation dropdowns:
//   1. Version dropdown (top) — switches between published docs versions
//   2. Section dropdown (below) — switches between Guide / Deploy & Operate / Reference
//
// Passed as `sidebar.banner` in DocsLayout. tabMode must NOT be "auto" so Fumadocs
// does not also render its own section dropdown below the banner.
export function SidebarNavHeader() {
  return (
    <div className="flex flex-col gap-2">
      <SidebarVersionDropdown />
      <SidebarSectionDropdown />
    </div>
  )
}
