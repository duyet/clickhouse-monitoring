import { ExternalLink, LayoutDashboard } from 'lucide-react'

import { dashboardUrl } from '@/lib/shared'

// Persistent call-to-action pinned to the bottom of the docs sidebar.
// Moved here from the top nav so the live dashboard is always one click away
// while reading any page.
export function SidebarFooter() {
  return (
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
  )
}
