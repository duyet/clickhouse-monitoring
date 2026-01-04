'use client'

import { SidebarMenu } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

// Fixed widths to avoid hydration mismatch from Math.random()
// These are deterministic and consistent between server and client
const SKELETON_WIDTHS = ['65%', '55%', '70%', '60%', '75%', '50%', '68%', '58%']

export function TreeSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SidebarMenu>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          data-slot="sidebar-menu-skeleton"
          data-sidebar="menu-skeleton"
          className="flex h-8 items-center gap-2 rounded-md px-2"
        >
          <Skeleton
            className="size-4 rounded-md"
            data-sidebar="menu-skeleton-icon"
          />
          <Skeleton
            className="h-4 flex-1"
            data-sidebar="menu-skeleton-text"
            style={{ maxWidth: SKELETON_WIDTHS[i % SKELETON_WIDTHS.length] }}
          />
        </div>
      ))}
    </SidebarMenu>
  )
}
