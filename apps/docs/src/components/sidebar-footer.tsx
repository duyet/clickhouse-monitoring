import { ExternalLink, LayoutDashboard } from 'lucide-react'

import { VersionSwitcher } from '@/components/version-switcher'
import { dashboardUrl } from '@/lib/shared'

// Persistent footer pinned to the bottom of the docs sidebar. Holds the live
// dashboard CTA and the single documentation version control, so version lives
// here once instead of being duplicated across the nav and a sidebar banner.
export function SidebarFooter() {
  return (
    <div className="flex flex-col gap-2">
      <a
        href={dashboardUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center gap-2 rounded-lg border bg-fd-card px-3 py-2 text-sm font-medium text-fd-card-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        <LayoutDashboard className="size-4 shrink-0 text-fd-primary" />
        <span className="flex-1">Open Dashboard</span>
        <ExternalLink className="size-3.5 shrink-0 opacity-60" />
      </a>
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs text-fd-muted-foreground">Documentation</span>
        <VersionSwitcher />
      </div>
    </div>
  )
}
