import { Check, ChevronDown } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover'
import { docsVersion, docsVersions } from '@/lib/shared'

// Version switcher shown in the nav. A dropdown listing the published docs
// versions; each entry links to that version's release notes. The current
// version is marked with a check. Driven by `docsVersions` in lib/shared.
export function VersionSwitcher() {
  return (
    <Popover>
      <PopoverTrigger
        className="group inline-flex items-center gap-1 rounded-full border bg-fd-secondary/50 px-2.5 py-0.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground"
        aria-label={`Documentation version ${docsVersion} — switch version`}
      >
        {docsVersion}
        <ChevronDown className="size-3 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-40 flex-col p-1">
        {docsVersions.map((version) => (
          <a
            key={version.label}
            href={version.href}
            className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground ${
              version.current
                ? 'text-fd-foreground'
                : 'text-fd-muted-foreground'
            }`}
          >
            {version.label}
            {version.current ? <Check className="size-3.5" /> : null}
          </a>
        ))}
        <a
          href="/releases"
          className="mt-1 border-t pt-1.5 px-2 py-1.5 text-xs text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground"
        >
          All releases →
        </a>
      </PopoverContent>
    </Popover>
  )
}
