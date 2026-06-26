import { ChevronDown } from 'lucide-react'

import { docsVersion } from '@/lib/shared'

// Compact version indicator shown in the nav. Links to the release notes.
// When a second docs version is cut, this can grow into a dropdown switcher;
// for now it surfaces the current version and routes to the changelog.
export function VersionSwitcher() {
  return (
    <a
      href="/releases"
      className="inline-flex items-center gap-1 rounded-full border bg-fd-secondary/50 px-2.5 py-0.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      aria-label={`Documentation version ${docsVersion} — view release notes`}
    >
      {docsVersion}
      <ChevronDown className="size-3 opacity-60" />
    </a>
  )
}
